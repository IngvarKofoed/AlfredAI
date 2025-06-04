import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import WebSocket from 'ws'; 
import { Client } from './client';
import { ClaudeCompletionProvider } from './completion/completion-providers/claude-completion-provider';
import { getAllTools } from './tools';
import { logger } from './utils/logger';
import { ScriptedTask, ButlerTask } from './tasks';
import { FollowupQuestion, ToolCall, Message } from './types';
import { mcpClientManager } from './utils/mcp-client-manager';
import { personalityManager } from './utils/personality-manager';
import { eventManager } from './tools/event-tool';

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app); // Modified to use http.createServer

// Create WebSocket server
const wss = new WebSocket.Server({ server }); // Attached WebSocket server to HTTP server

// Middleware
app.use(express.json());

// Keep track of connected clients
const connectedClients = new Map<WebSocket, Client>();

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' });
});

// WebSocket connection handling
wss.on('connection', async (ws) => {
  logger.info('Client connected via WebSocket');

  // Trigger CLI connection events
  try {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await eventManager.handleCLIConnection(clientId);
  } catch (error) {
    logger.error('Error triggering CLI connection events:', error);
  }

  // Create a new Client instance for this WebSocket connection
  const completionProvider = new ClaudeCompletionProvider(process.env.ANTHROPIC_API_KEY as string);
  const tools = getAllTools();
  
  // Task factory selection based on environment variable
  const taskType = process.env.TASK_TYPE || 'butler';
  let taskFactory: (message: string, conversationHistory?: Message[]) => ScriptedTask | ButlerTask;
  
  if (taskType.toLowerCase() === 'scripted') {
    logger.info('Using ScriptedTask factory');
    taskFactory = (message: string, conversationHistory?: Message[]) => new ScriptedTask(message);
  } else {
    logger.info('Using ButlerTask factory (default)');
    taskFactory = (message: string, conversationHistory?: Message[]) => new ButlerTask(message, completionProvider, tools, conversationHistory);
  }
  
  const client = new Client(taskFactory);
  client.on('thinking', (text: string) => {
    const message = JSON.stringify({ type: 'thinking', payload: { isThinking: true, text: text } });
    logger.debug(`Sending thinking message: ${message}`);
    ws.send(message);
  });
  client.on('questionFromAssistant', (questions: FollowupQuestion) => {
    logger.debug(`Sending questionFromAssistant message: ${JSON.stringify(questions)}`);
    ws.send(JSON.stringify({ 
      type: 'questionFromAssistant', 
      payload: { 
        item: questions.question, 
        questions: questions.options 
      } 
    }));
  });
  client.on('toolCallFromAssistant', (toolCall: ToolCall) => {
    logger.debug(`Sending toolCallFromAssistant message: ${JSON.stringify(toolCall)}`);
    ws.send(JSON.stringify({ type: 'toolCallFromAssistant', payload: toolCall }));
  });
  client.on('answerFromAssistant', (answer: string) => {
    logger.debug(`Sending answerFromAssistant message: ${answer}`);
    ws.send(JSON.stringify({ type: 'answerFromAssistant', payload: answer }));
  });
  connectedClients.set(ws, client);

  ws.on('message', (message) => {
    const messageData = message.toString();
    const parsedMessage = JSON.parse(messageData);
    const { type, payload } = parsedMessage;

    if (type === 'prompt') {
      const prompt = payload;
      logger.debug(`Received prompt: ${prompt}`);
      
      // Check for commands
      if (prompt.startsWith('/')) {
        const command = prompt.toLowerCase().trim();
        
        if (command === '/clear') {
          client.clearHistory();
          logger.info('Conversation history cleared by user command');
          
          // Send confirmation message back to user
          const confirmationMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: '🧹 Conversation history cleared! Starting fresh.' 
          });
          ws.send(confirmationMessage);
          return;
        } else if (command === '/history') {
          const history = client.getConversationHistory();
          const historyText = history.length === 0 
            ? '📝 No conversation history yet.' 
            : `📝 Conversation History (${history.length} messages):

${history.map((msg, index) => 
  `${index + 1}. [${msg.role.toUpperCase()}] ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
).join('\n')}`;
          
          const historyMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: historyText 
          });
          ws.send(historyMessage);
          return;
        } else if (command === '/status') {
          const history = client.getConversationHistory();
          const statusText = `🔍 System Status:
• Conversation: ${history.length} messages
• Connection: Active WebSocket
• Model: Claude (Anthropic)
• Tools: ${getAllTools().length} available
• MCP: Ready for external servers`;
          
          const statusMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: statusText 
          });
          ws.send(statusMessage);
          return;
        } else if (command === '/events' || command.startsWith('/events ')) {
          // Parse command to get optional limit
          const parts = command.split(' ');
          const limit = parts.length > 1 ? parseInt(parts[1]) : 10;
          
          try {
            const events = eventManager.getAllEvents();
            const logs = eventManager.getRecentEventLogs(limit);
            const stats = eventManager.getEventStats();
            
            let eventsText = `⚡ Event System Status:\n\n`;
            
            // Show stats first
            eventsText += `📊 **Statistics:**\n`;
            eventsText += `• Total Events: ${stats.totalEvents}\n`;
            eventsText += `• Active Events: ${stats.activeEvents}\n`;
            eventsText += `• Recent Triggers (24h): ${stats.recentEvents}\n\n`;
            
            // Show recent events if count was specified
            if (limit > 0 && logs.length > 0) {
              eventsText += `📋 **Recent Event Activity (${Math.min(limit, logs.length)}):**\n`;
              logs.slice(0, limit).forEach((log, index) => {
                const event = eventManager.getEvent(log.eventTriggerId);
                const eventName = event ? event.name : 'Unknown Event';
                const status = log.success ? '✅' : '❌';
                
                eventsText += `${index + 1}. ${status} **${eventName}** - ${log.timestamp.toLocaleString()}\n`;
                eventsText += `   🎯 ${log.source.type} | 📝 ${log.details}\n`;
              });
            } else if (stats.recentEvents === 0) {
              eventsText += `📋 **Recent Activity:** No events triggered in the last 24 hours\n`;
            }
            
            // Show active events summary
            const activeEvents = events.filter(e => e.enabled);
            if (activeEvents.length > 0) {
              eventsText += `\n🟢 **Active Events (${activeEvents.length}):**\n`;
              activeEvents.forEach((event, index) => {
                eventsText += `${index + 1}. **${event.name}** (${event.eventSource.type})\n`;
                eventsText += `   🔄 ${event.triggerCount} triggers | 📅 Last: ${event.lastTriggered ? event.lastTriggered.toLocaleDateString() : 'Never'}\n`;
              });
            } else {
              eventsText += `\n📋 **No active events** - use the event tool to create some!\n`;
            }
            
            eventsText += `\n💡 **Quick Actions:**\n`;
            eventsText += `• Use event tool to create CLI welcome events or timers\n`;
            eventsText += `• Try: "create a CLI welcome event"\n`;
            eventsText += `• Try: "create a timer event for 3 PM daily"\n`;
            eventsText += `• Use \`/events 20\` to see more recent activity`;
            
            const eventsMessage = JSON.stringify({ 
              type: 'answerFromAssistant', 
              payload: eventsText 
            });
            ws.send(eventsMessage);
          } catch (error: any) {
            const errorMessage = JSON.stringify({ 
              type: 'answerFromAssistant', 
              payload: `❌ Error accessing event system: ${error.message}` 
            });
            ws.send(errorMessage);
          }
          return;
        } else if (command === '/help') {
          // Send help message
          const helpMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: `🤖 Available Commands:

• /clear - Clear conversation history
• /history - Show conversation history
• /status - Show system status
• /tools - List all available tools and MCP servers
• /personalities - List and manage AI personalities
• /events - Show event system status
• /help - Show this help message

Just start typing to chat with Alfred AI!` 
          });
          ws.send(helpMessage);
          return;
        } else if (command === '/personalities') {
          // Implement the /personalities command
          try {
            const allPersonalities = personalityManager.getAllPersonalities();
            const activePersonality = personalityManager.getActivePersonality();
            const presets = personalityManager.getPresets();
            
            let personalitiesText = `🎭 AI Personalities:\n\n`;
            
            // Show active personality
            if (activePersonality) {
              personalitiesText += `**Currently Active:** ${activePersonality.name} ⭐\n`;
              personalitiesText += `• ${activePersonality.description}\n`;
              personalitiesText += `• Tone: ${activePersonality.tone}, Style: ${activePersonality.communicationStyle}\n\n`;
            } else {
              personalitiesText += `**Currently Active:** None (using default behavior)\n\n`;
            }
            
            // Show custom personalities
            const customPersonalities = Object.values(allPersonalities);
            if (customPersonalities.length > 0) {
              personalitiesText += `**Your Custom Personalities (${customPersonalities.length}):**\n`;
              customPersonalities.forEach((personality, index) => {
                const isActive = activePersonality?.id === personality.id;
                personalitiesText += `${index + 1}. **${personality.name}** ${isActive ? '⭐' : ''}\n`;
                personalitiesText += `   • ${personality.description}\n`;
                personalitiesText += `   • ${personality.tone} tone, ${personality.communicationStyle} style\n`;
                if (personality.expertise.length > 0) {
                  personalitiesText += `   • Expertise: ${personality.expertise.slice(0, 3).join(', ')}${personality.expertise.length > 3 ? '...' : ''}\n`;
                }
                personalitiesText += `\n`;
              });
            }
            
            // Show available presets
            personalitiesText += `**Available Presets (${presets.length}):**\n`;
            presets.forEach((preset, index) => {
              personalitiesText += `${index + 1}. **${preset.name}**\n`;
              personalitiesText += `   • ${preset.description}\n`;
              personalitiesText += `   • ${preset.personality.tone} tone, ${preset.personality.communicationStyle} style\n\n`;
            });
            
            personalitiesText += `**Quick Actions:**\n`;
            personalitiesText += `• Use the personality tool to create, activate, or manage personalities\n`;
            personalitiesText += `• Try: "activate the Creative Collaborator personality"\n`;
            personalitiesText += `• Try: "create a new personality for technical writing"\n`;
            personalitiesText += `• Try: "deactivate the current personality"`;
            
            const personalitiesMessage = JSON.stringify({ 
              type: 'answerFromAssistant', 
              payload: personalitiesText 
            });
            ws.send(personalitiesMessage);
          } catch (error: any) {
            const errorMessage = JSON.stringify({ 
              type: 'answerFromAssistant', 
              payload: `❌ Error listing personalities: ${error.message}` 
            });
            ws.send(errorMessage);
          }
          return;
        } else if (command === '/tools') {
          // Implement the /tools command
          (async () => {
            try {
              const nativeTools = getAllTools();
              const mcpConnections = mcpClientManager.listConnections();
              
              let toolsText = `🔧 Available Tools:\n\n`;
              
              // Native Tools
              toolsText += `**Native Tools (${nativeTools.length}):**\n`;
              nativeTools.forEach((tool, index) => {
                toolsText += `${index + 1}. **${tool.description.name}** - ${tool.description.description}\n`;
              });
              
              // MCP Server Tools
              toolsText += `\n**MCP Servers (${mcpConnections.length}):**\n`;
              if (mcpConnections.length === 0) {
                toolsText += `• No MCP servers connected\n`;
              } else {
                for (const connection of mcpConnections) {
                  toolsText += `• **${connection.name}** - ${connection.connected ? '🟢 Connected' : '🔴 Disconnected'}`;
                  if (connection.lastError) {
                    toolsText += ` (Error: ${connection.lastError})`;
                  }
                  toolsText += `\n`;
                  
                  if (connection.connected) {
                    try {
                      const mcpTools = await mcpClientManager.listTools(connection.name);
                      if (mcpTools.length > 0) {
                        mcpTools.forEach((mcpTool) => {
                          toolsText += `  - ${mcpTool.name}: ${mcpTool.description || 'No description'}\n`;
                        });
                      } else {
                        toolsText += `  - No tools available\n`;
                      }
                    } catch (error: any) {
                      toolsText += `  - Error listing tools: ${error.message}\n`;
                    }
                  }
                }
              }
              
              toolsText += `\nUse the tools through natural conversation or the MCP consumer tool!`;
              
              const toolsMessage = JSON.stringify({ 
                type: 'answerFromAssistant', 
                payload: toolsText 
              });
              ws.send(toolsMessage);
            } catch (error: any) {
              const errorMessage = JSON.stringify({ 
                type: 'answerFromAssistant', 
                payload: `❌ Error listing tools: ${error.message}` 
              });
              ws.send(errorMessage);
            }
          })();
          return;
        } else {
          // Unknown command
          const errorMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: `❌ Unknown command: ${command}

Type /help to see available commands.` 
          });
          ws.send(errorMessage);
          return;
        }
      }
      
      // Normal message processing
      client.messageFromUser(prompt);
    } else if (type === 'answer') {
      const answer = payload;
      logger.debug(`Received answer: ${answer}`);
      client.answerFromUser(answer);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    logger.info('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, async () => { // Modified to use server.listen
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  
  // Initialize MCP client manager and auto-connect saved servers
  try {
    logger.info('Initializing MCP client manager...');
    await mcpClientManager.initialize();
    logger.info('MCP client manager initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize MCP client manager:', error.message);
  }

  // Initialize event manager
  try {
    logger.info('Initializing event manager...');
    await eventManager.initialize();
    logger.info('Event manager initialized successfully');

    // Set up event manager listeners
    eventManager.on('notification', (data: any) => {
      logger.info(`Event notification: ${data.eventName} - ${data.message}`);
      // Could send to all connected clients or specific ones based on context
      const notificationMessage = JSON.stringify({
        type: 'notification',
        payload: {
          title: `Event: ${data.eventName}`,
          message: data.message,
          timestamp: new Date().toISOString()
        }
      });
      
      // Broadcast to all connected clients
      connectedClients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(notificationMessage);
        }
      });
    });

    eventManager.on('sendMessage', (data: any) => {
      logger.info(`Event message: ${data.message}`);
      const messagePayload = JSON.stringify({
        type: 'answerFromAssistant',
        payload: data.message
      });
      
      // Broadcast to all connected clients
      connectedClients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messagePayload);
        }
      });
    });

    eventManager.on('executeTool', async (data: any) => {
      logger.info(`Event tool execution: ${data.tool} with params:`, data.params);
      // This could be implemented to execute tools automatically
      // For now, just log it
    });

    eventManager.on('aiResponse', (data: any) => {
      logger.info(`Event AI response requested: ${data.prompt}`);
      // This could trigger an AI response
      // For now, just log it
    });

    eventManager.on('runCommand', (data: any) => {
      logger.info(`Event command execution requested: ${data.command}`);
      // This could execute commands automatically if autonomous
      // For now, just log it
    });

  } catch (error: any) {
    logger.error('Failed to initialize event manager:', error.message);
  }
});