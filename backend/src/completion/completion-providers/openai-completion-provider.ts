import OpenAI from 'openai';
import { CompletionProvider, GenerateTextConfig } from '../';
import { logger } from '../../utils/logger';
import { Message } from '../../types';
import { MemoryInjector } from '../../memory/memory-injector';
import { ConversationHistoryService } from '../../conversation-history';

/**
 * OpenAI implementation of the CompletionProvider interface
 * Uses OpenAI's Chat Completions API for text generation
 */
export class OpenAICompletionProvider implements CompletionProvider {
  private client: OpenAI;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;
  private conversationHistoryService: ConversationHistoryService;
  private memoryInjector?: MemoryInjector;
  private conversationId: string | null = null;

  /**
   * Creates a new OpenAI completion provider instance
   * @param apiKey - OpenAI API key
   * @param modelName - OpenAI model to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
   * @param maxTokens - Maximum tokens to generate (default: 4096)
   * @param temperature - Sampling temperature (default: 0.7)
   * @param conversationHistoryService - Service for managing conversation history
   * @param memoryInjector - Optional memory injector
   */
  constructor(
    apiKey: string,
    modelName: string = 'gpt-4',
    maxTokens: number = 4096,
    temperature: number = 0.7,
    conversationHistoryService: ConversationHistoryService,
    memoryInjector?: MemoryInjector
  ) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
    this.modelName = modelName;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.conversationHistoryService = conversationHistoryService;
    this.memoryInjector = memoryInjector;
  }

  /**
   * Set the memory injector for this provider
   */
  setMemoryInjector(memoryInjector: MemoryInjector): void {
    this.memoryInjector = memoryInjector;
  }

  /**
   * Gets the OpenAI model name being used
   * @returns The model name/identifier
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Generates text responses using OpenAI based on conversation history
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

      // Convert our Message format to OpenAI's format
      const openaiMessages = this.convertToOpenAIFormat(conversation);

      const start = Date.now();

      logger.debug(`OpenAI model ${this.modelName} generation started`);

      // Make the API call to OpenAI
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...openaiMessages,
        ],
      });

      const end = Date.now();
      logger.debug(`OpenAI model ${this.modelName} generation took ${end - start}ms`);

      if (config?.logModelResponse) {
        logger.debug('OpenAI response:');
        logger.debug(JSON.stringify(response, null, 2));
      }

      // Extract the text content from OpenAI's response
      const content = this.extractContentFromResponse(response);
      
      // Handle conversation history
      await this.handleConversationHistory(conversation, content, config);
      
      return content;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Converts our Message format to OpenAI's message format
   * @param conversation - Array of our Message objects
   * @returns Array of OpenAI message objects
   */
  private convertToOpenAIFormat(conversation: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return conversation
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
  }

  /**
   * Extracts text content from OpenAI's response
   * @param response - OpenAI API response
   * @returns The text content as a string
   */
  private extractContentFromResponse(response: OpenAI.Chat.Completions.ChatCompletion): string {
    if (response.choices && response.choices.length > 0) {
      const firstChoice = response.choices[0];
      if (firstChoice.message?.content) {
        return firstChoice.message.content;
      }
    }

    throw new Error('No text content found in OpenAI response');
  }

  /**
   * Handles conversation history for OpenAI responses
   * @param conversation - The original conversation messages
   * @param aiResponse - The AI's response content
   * @param config - Configuration options
   */
  private async handleConversationHistory(conversation: Message[], aiResponse: string, config?: GenerateTextConfig): Promise<void> {
    // Create the AI response message
    const aiMessage: Message = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    if (config?.disableConversationHistory) {
      return;
    }

    if (conversation.length === 1) {
      // First message - start new conversation with user message and AI response
      const userMessage: Message = {
        role: 'user',
        content: conversation[0].content,
        timestamp: new Date()
      };
      const newConversation = await this.conversationHistoryService.startNewConversation([userMessage, aiMessage]);
      this.conversationId = newConversation.id;
    } else {
      // Continuing conversation - update with full conversation including AI response
      const fullConversation = [...conversation, aiMessage];
      await this.conversationHistoryService.updateConversation(this.conversationId as string, fullConversation);
    }
  }
} 