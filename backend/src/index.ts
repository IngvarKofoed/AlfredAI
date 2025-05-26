import 'dotenv/config';
import express, { Request, Response } from 'express';
import { configureServices } from './configureServices';
import { resolveServiceSync } from './serviceLocator';
import { LargeLanguageModel, Message } from './large-language-models';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure all services at startup
configureServices();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Example route using service locator
app.get('/example', async (req, res) => {
  try {
    // Get the LLM service from the service locator
    const llm = resolveServiceSync<LargeLanguageModel>('llm');
    
    // Create a simple conversation
    const conversation: Message[] = [
      {
        role: 'user',
        content: 'Hello! Can you tell me a short joke?'
      }
    ];
    
    // Generate a response
    const responses = await llm.generateText(conversation);
    
    res.json({
      success: true,
      response: responses[0]?.content || 'No response generated',
      responses: responses.map(r => r.content),
      model: llm.getModelName?.() || 'Unknown'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 