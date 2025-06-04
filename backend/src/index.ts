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
wss.on('connection', (ws) => {
  logger.info('Client connected via WebSocket');

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
        } else if (command === '/help') {
          // Send help message
          const helpMessage = JSON.stringify({ 
            type: 'answerFromAssistant', 
            payload: `🤖 Available Commands:

• /clear - Clear conversation history
• /history - Show conversation history
• /status - Show system status
• /tools - List all available tools and MCP servers
• /help - Show this help message

Just start typing to chat with Alfred AI!` 
          });
          ws.send(helpMessage);
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
server.listen(PORT, () => { // Modified to use server.listen
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});