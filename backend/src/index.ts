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
import { getPersonalityService, initializeServiceLocator, closeServiceLocator, getCommandService } from './service-locator';
import { getMemoryService } from './service-locator';
import { getMcpService, getConversationHistoryService } from './service-locator';

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

  // Create a new Client instance for this WebSocket connection
  // Get active personality and determine provider based on personality preferences
  const activePersonality = getPersonalityService().getActivePersonality();
  
  // Get memory service and injector for this connection
  let memoryInjector;
  try {
    const memoryService = getMemoryService();
    memoryInjector = memoryService.getMemoryInjector();
  } catch (error) {
    logger.warn('Failed to get memory injector:', error);
  }
  
  const completionProvider = ProviderFactory.createFromPersonalityOrEnv(activePersonality || undefined, 'claude', memoryInjector);
  
  if (activePersonality?.preferredProvider) {
    logger.info(`Using AI provider: ${activePersonality.preferredProvider} (from personality: ${activePersonality.name})`);
  } else {
    const envProvider = (process.env.AI_PROVIDER as ProviderType) || 'claude';
    logger.info(`Using AI provider: ${envProvider} (from environment/default)`);
  }
  const tools = getAllTools();
  
  // Task factory selection based on environment variable
  const taskType = process.env.TASK_TYPE || 'butler';
  let taskFactory: (message: string) => ScriptedTask | ButlerTask;
  
  if (taskType.toLowerCase() === 'scripted') {
    logger.info('Using ScriptedTask factory');
    taskFactory = (message: string) => new ScriptedTask(message);
  } else {
    logger.info('Using ButlerTask factory (default)');
    taskFactory = (message: string) => new ButlerTask(message, completionProvider, tools);
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
    logger.debug(`Sending answerFromAssistant message: ${answer.substring(0, 20)}${answer.length > 20 ? '...' : ''}`);
    ws.send(JSON.stringify({ type: 'answerFromAssistant', payload: answer }));
  });

  client.on('subAgentStarted', (data: any) => {
    logger.debug(`Sending subAgentStarted message: ${data.id}`);
    ws.send(JSON.stringify({ type: 'subAgentStarted', payload: data }));
  });

  client.on('subAgentCompleted', (data: any) => {
    logger.debug(`Sending subAgentCompleted message: ${data.id}`);
    ws.send(JSON.stringify({ type: 'subAgentCompleted', payload: data }));
  });

  client.on('subAgentFailed', (data: any) => {
    logger.debug(`Sending subAgentFailed message: ${data.id}`);
    ws.send(JSON.stringify({ type: 'subAgentFailed', payload: data }));
  });
  
  connectedClients.set(ws, client);

  // Get registered commands from command service
  const registeredCommands = getCommandService().getAllCommands();
  
  // Define all available commands including those handled directly in WebSocket
  const allCommands = [
    ...registeredCommands,
    // { name: 'clear', description: 'Clear conversation history' },
    // { name: 'history', description: 'Show conversation history' },
    // { name: 'status', description: 'Show system status' },
    // { name: 'tools', description: 'List all available tools and MCP servers' },
    // { name: 'personalities', description: 'List and manage AI personalities' },
    // { name: 'memory', description: 'Show memory system status and statistics' }
  ];
  
  ws.send(JSON.stringify({ type: 'commands', payload: allCommands.map(command => ({ 
    name: command.name, 
    description: command.description,
  })) }));

  ws.on('message', async (message) => {
    const messageData = message.toString();
    const parsedMessage = JSON.parse(messageData);
    const { type, payload } = parsedMessage;

    if (type === 'prompt') {
      const prompt = payload;
      logger.debug(`Received prompt: ${prompt}`);

      if (prompt.startsWith('/')) {
        // Execute command with full string parsing
        const commandService = getCommandService();
        const result = await commandService.executeCommandString(prompt);
        ws.send(JSON.stringify({ type: 'promptResponse', payload: result }));
      } else {
        // Normal message processing
        client.messageFromUser(prompt);
      }
    } else if (type === 'answer') {
      const answer = payload;
      logger.debug(`Received answer: ${answer}`);
      client.answerFromUser(answer);
    } else if (type === 'schema-request') {
      const { commandName, context } = payload;
      logger.debug(`Received schema request for command: ${commandName}`, { context });
      
      try {
        const commandService = getCommandService();
        const schema = await commandService.getCommandSchema(commandName, context);
        ws.send(JSON.stringify({ 
          type: 'schema-response', 
          payload: { 
            commandName, 
            schema 
          } 
        }));
      } catch (error) {
        logger.error(`Failed to get schema for command '${commandName}':`, error);
        ws.send(JSON.stringify({ 
          type: 'schema-response', 
          payload: { 
            commandName, 
            schema: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          } 
        }));
      }
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
  
  // Initialize service locator
  try {
    await initializeServiceLocator();
  } catch (error: any) {
    logger.error('Failed to initialize service locator:', error.message);
  }
  
  // Initialize all tools with the HTTP server
  try {
    logger.info('Initializing tools...');
    for (const tool of getAllTools()) {
      tool.initialize({ httpServer: server });
    }
    logger.info('Tools initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize tools:', error.message);
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close all services via service locator
  try {
    console.log('Closing all services...');
    await closeServiceLocator();
    console.log('All services closed');
  } catch (error: any) {
    console.error('Error closing services:', error.message);
  }
  
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