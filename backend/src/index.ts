import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import WebSocket from 'ws'; 
import { Client } from './client';
import { ProviderFactory, ProviderType } from './completion/provider-factory';
import { getAllTools } from './tools';
import { logger } from './utils/logger';
import { ScriptedTask, ButlerTask } from './tasks';
import { FollowupQuestion, ToolCall, Message } from './types';
import { mcpClientManager } from './tools/mcp/mcp-client-manager';
import { personalityManager } from './tools/personality/personality-manager';
import { getDefaultPersonality } from './prompts/create-personality-prompt';

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app); // Modified to use http.createServer

// Create WebSocket server
const wss = new WebSocket.Server({ server }); // Attached WebSocket server to HTTP server

// Middleware
app.use(express.json());

for (const tool of getAllTools()) {
  tool.initialize({ httpServer: server });
}

// Keep track of connected clients
const connectedClients = new Map<WebSocket, Client>();

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  logger.info('Client connected via WebSocket');

  // Create a new Client instance for this WebSocket connection
  // Get active personality and determine provider based on personality preferences
  const activePersonality = personalityManager.getActivePersonality();
  const completionProvider = ProviderFactory.createFromPersonalityOrEnv(activePersonality || undefined);
  
  if (activePersonality?.preferredProvider) {
    logger.info(`Using AI provider: ${activePersonality.preferredProvider} (from personality: ${activePersonality.name})`);
  } else {
    const envProvider = (process.env.AI_PROVIDER as ProviderType) || 'claude';
    logger.info(`Using AI provider: ${envProvider} (from environment/default)`);
  }
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
• /provider - Show current AI provider and personality configuration
• /help - Show this help message

Just start typing to chat with Alfred AI!` 
          });
          ws.send(helpMessage);
          return;
        } else if (command === '/provider') {
          // Show current provider information
          const activePersonality = personalityManager.getActivePersonality();
          let providerInfo = `🤖 AI Provider Status:\n\n`;
          
          if (activePersonality?.preferredProvider) {
            providerInfo += `**Active Provider:** ${activePersonality.preferredProvider} (from personality: ${activePersonality.name})\n`;
          } else {
            const envProvider = (process.env.AI_PROVIDER as ProviderType) || 'claude';
            providerInfo += `**Active Provider:** ${envProvider} (from environment/default)\n`;
          }
          
          providerInfo += `**Supported Providers:** claude, openai, gemini, openrouter\n\n`;
          providerInfo += `**Current Personality:** ${activePersonality ? activePersonality.name : 'None (using default behavior)'}\n\n`;
          providerInfo += `💡 To change provider: Use the personality tool to create/update personalities with preferredProvider setting.`;
          
          const providerMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: providerInfo 
          });
          ws.send(providerMessage);
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
              const defaultPersonality = getDefaultPersonality();
              personalitiesText += `**Currently Active:** ${defaultPersonality.name}\n`;
              personalitiesText += `• ${defaultPersonality.description}\n`;
              personalitiesText += `• Tone: ${defaultPersonality.tone}, Style: ${defaultPersonality.communicationStyle}\n\n`;
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
        } else if (command === '/provider') {
          // Implement the /provider command to check AI provider status
          (async () => {
            try {
              const { aiProviderTool } = await import('./tools/ai-provider-tool');
              const result = await aiProviderTool.execute({ action: 'status' });
              
              const providerMessage = JSON.stringify({ 
                type: 'answerFromAssistant', 
                payload: result.success ? result.result : `❌ Error: ${result.error}` 
              });
              ws.send(providerMessage);
            } catch (error: any) {
              const errorMessage = JSON.stringify({ 
                type: 'answerFromAssistant', 
                payload: `❌ Error checking provider status: ${error.message}` 
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
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close all WebSocket connections
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Server shutting down');
    }
  });
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('HTTP server closed');
    console.log('Server shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});