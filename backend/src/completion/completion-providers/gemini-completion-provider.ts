import { GoogleGenerativeAI } from '@google/generative-ai';
import { CompletionProvider, GenerateTextConfig } from '../';
import { logger } from '../../utils/logger';
import { Message } from '../../types';
import { MemoryInjector } from '../../memory/memory-injector';

/**
 * Gemini implementation of the CompletionProvider interface
 * Uses Google's Generative AI API for text generation
 */
export class GeminiCompletionProvider implements CompletionProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;
  private memoryInjector?: MemoryInjector;

  /**
   * Creates a new Gemini completion provider instance
   * @param apiKey - Google AI API key
   * @param modelName - Gemini model to use (e.g., 'gemini-1.5-pro', 'gemini-1.5-flash')
   * @param maxTokens - Maximum tokens to generate (default: 4096)
   * @param temperature - Sampling temperature (default: 0.7)
   * @param memoryInjector - Optional memory injector
   */
  constructor(
    apiKey: string,
    modelName: string = 'gemini-2.5-flash-preview-05-20',
    maxTokens: number = 4096,
    temperature: number = 0.7,
    memoryInjector?: MemoryInjector
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.memoryInjector = memoryInjector;
  }

  /**
   * Set the memory injector for this provider
   */
  setMemoryInjector(memoryInjector: MemoryInjector): void {
    this.memoryInjector = memoryInjector;
    
    // Initialize AI Memory Selector if the injector is configured for AI selection
    if (memoryInjector) {
      memoryInjector.initializeAISelector(this).catch(error => {
        logger.warn('Failed to initialize AI Memory Selector:', error);
      });
    }
  }

  /**
   * Gets the Gemini model name being used
   * @returns The model name/identifier
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Generates text responses using Gemini based on conversation history
   * @param systemPrompt - The system prompt to use for the conversation
   * @param conversation - Array of messages representing the conversation context
   * @param config - Configuration options for text generation (optional)
   * @returns Promise that resolves to the AI-generated response text
   */
  async generateText(systemPrompt: string, conversation: Message[], config?: GenerateTextConfig): Promise<string> {
    try {
      // Inject memories into system prompt if memory injector is available
      let enhancedSystemPrompt = systemPrompt;
      if (this.memoryInjector) {
        try {
          enhancedSystemPrompt = await this.memoryInjector.injectMemories(systemPrompt, conversation);
        } catch (error) {
          logger.warn('Memory injection failed, using original system prompt:', error);
        }
      }

      const start = Date.now();

      logger.debug(`Gemini model ${this.modelName} generation started`);

      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
        },
        systemInstruction: enhancedSystemPrompt,
      });

      // Convert our conversation to Gemini's format
      const history = this.convertToGeminiFormat(conversation);

      // Start a chat session with the conversation history
      const chat = model.startChat({
        history: history.slice(0, -1), // All messages except the last one
      });

      // Send the last message and get response
      const lastMessage = history[history.length - 1];
      const result = await chat.sendMessage(lastMessage.parts);

      const end = Date.now();
      
      logger.debug(`Gemini model ${this.modelName} generation took ${end - start}ms`);

      if (config?.logModelResponse) {
        logger.debug('Gemini response:');
        logger.debug(JSON.stringify(result.response, null, 2));
      }

      // Extract the text content from Gemini's response
      const content = this.extractContentFromResponse(result.response);
      
      return content;
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Converts our Message format to Gemini's message format
   * @param conversation - Array of our Message objects
   * @returns Array of Gemini message objects
   */
  private convertToGeminiFormat(conversation: Message[]) {
    return conversation.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  /**
   * Extracts text content from Gemini's response
   * @param response - Gemini API response
   * @returns The text content as a string
   */
  private extractContentFromResponse(response: any): string {
    if (response.text) {
      return response.text();
    }

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || '';
      }
    }

    throw new Error('No text content found in Gemini response');
  }
} 