import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import WebSocket from 'ws'; 
import { parseAssistantMessage } from './assistant-message/parse-assistant-message';
import { Client } from './client';

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app); // Modified to use http.createServer

// Create WebSocket server
const wss = new WebSocket.Server({ server }); // Attached WebSocket server to HTTP server

// Middleware
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/assistant/message', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assistantMessage = req.body.message;
    if (!assistantMessage) {
      res.status(400).json({ error: 'Message body is required.' });
      return; // Explicitly return to ensure Promise<void> path
    }

    const parsedMessage = parseAssistantMessage(assistantMessage);
    console.log('Parsed Assistant Message:', parsedMessage);

    // Here, the parsedMessage can be made available for further processing
    // by other components of the AssistantCore.
    // For now, we just send it back as a response.
    res.json({ status: 'success', parsedMessage });
  } catch (error: any) {
    console.error('Error parsing assistant message:', error);
    next(error); // Pass error to Express error handling
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');

  ws.on('message', (message) => {
    console.log('Received message via WebSocket:', message.toString());
    // Here you can process the message, e.g., pass it to parseAssistantMessage
    // For now, just echo it back
    ws.send(`Echo: ${message.toString()}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.send('Welcome to the WebSocket server!');
});

// Start server
server.listen(PORT, () => { // Modified to use server.listen
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});