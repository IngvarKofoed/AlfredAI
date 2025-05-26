import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { CompletionProvider, Message } from './completion';
import { parseAssistantMessage } from './assistant-message/parse-assistant-message';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});