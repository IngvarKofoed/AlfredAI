import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import WebSocket from 'ws'; 
import { Client } from './client';
import { ClaudeCompletionProvider } from './completion/completion-providers/claude-completion-provider';
import { getAllTools } from './tools';
import { logger } from './utils/logger';
import { ScriptedTask, ButlerTask } from './tasks';
import { FollowupQuestion, ToolCall } from './types';

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