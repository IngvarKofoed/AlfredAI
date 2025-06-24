import Anthropic from '@anthropic-ai/sdk';
import { CompletionProvider, GenerateTextConfig } from '../';
import { logger } from '../../utils/logger';
import { Message } from '../../types';
import { MemoryInjector } from '../../memory/memory-injector';
import { ConversationHistoryService } from '../../conversation-history';

/**
 * Claude implementation of the LargeLanguageModel interface
 * Uses Anthropic's Claude API for text generation
 */
export class ClaudeCompletionProvider implements CompletionProvider {
  private anthropic: Anthropic;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;
  private conversationHistoryService: ConversationHistoryService;
  private memoryInjector?: MemoryInjector;
  private maxRetries: number = 3;
  private baseDelay: number = 30000; // 30 seconds base delay
  private maxDelay: number = 120000; // 2 minutes maximum delay
  private conversationId: string | null = null;

  /**
   * Creates a new Claude LLM instance
   * @param apiKey - Anthropic API key
   * @param modelName - Claude model to use (e.g., 'claude-3-sonnet-20240229')
   * @param maxTokens - Maximum tokens to generate (default: 8192)
   * @param temperature - Sampling temperature (default: 0.7)
   * @param memoryInjector - Optional memory injector
   * @param maxRetries - Maximum number of retries for rate limit errors (default: 3)
   */
  constructor(
    apiKey: string,
    modelName: string = 'claude-3-5-sonnet-20241022',
    maxTokens: number = 8192,
    temperature: number = 0.7,
    conversationHistoryService: ConversationHistoryService,
    memoryInjector?: MemoryInjector,
    maxRetries: number = 3
  ) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    this.modelName = modelName;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.conversationHistoryService = conversationHistoryService;
    this.memoryInjector = memoryInjector;
    this.maxRetries = maxRetries;
  }

  /**
   * Set the memory injector for this provider
   */
  setMemoryInjector(memoryInjector: MemoryInjector): void {
    this.memoryInjector = memoryInjector;
  }

  /**
   * Gets the Claude model name being used
   * @returns The model name/identifier
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Checks if an error is a rate limit error
   * @param error - The error to check
   * @returns True if it's a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    if (error?.error?.type === 'rate_limit_error') {
      return true;
    }
    
    // Check for 429 status code in error message
    if (error?.message && typeof error.message === 'string') {
      return error.message.includes('429') || error.message.includes('rate_limit_error');
    }
    
    return false;
  }

  /**
   * Sleep for a specified number of milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff for rate limit errors
   * @param operation - The operation to retry
   * @param operationName - Name of the operation for logging
   * @returns Promise that resolves to the operation result
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (this.isRateLimitError(error) && attempt < this.maxRetries) {
          // Use a smaller multiplier (1.5x instead of 2x) and cap the maximum delay
          const delay = Math.min(this.baseDelay * Math.pow(1.5, attempt), this.maxDelay);
          logger.warn(`Rate limit hit for ${operationName}, retrying in ${Math.round(delay/1000)}s (attempt ${attempt + 1}/${this.maxRetries + 1})`);
          await this.sleep(delay);
          continue;
        }
        
        // If it's not a rate limit error or we've exhausted retries, throw the error
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Generates text responses using Claude based on conversation history
   * @param systemPrompt - The system prompt to use for the conversation
   * @param conversation - Array of messages representing the conversation context
   * @param config - Configuration options for text generation (optional)
   * @returns Promise that resolves to an array of AI-generated response messages
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

      // Convert our Message format to Anthropic's format
      const anthropicMessages = this.convertToAnthropicFormat(conversation);

      // Use streaming for high token counts or when explicitly requested
      const shouldUseStreaming = this.maxTokens > 4000 || config?.useStreaming === true;
      
      if (shouldUseStreaming) {
        return await this.retryWithBackoff(
          () => this.generateTextWithStreaming(enhancedSystemPrompt, anthropicMessages, config),
          'streaming text generation'
        );
      } else {
        return await this.retryWithBackoff(
          () => this.generateTextWithoutStreaming(enhancedSystemPrompt, anthropicMessages, config),
          'non-streaming text generation'
        );
      }
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates text using streaming (for long operations)
   */
  private async generateTextWithStreaming(
    systemPrompt: string, 
    messages: Anthropic.MessageParam[], 
    config?: GenerateTextConfig
  ): Promise<string> {
    const stream = await this.anthropic.messages.create({
      model: this.modelName,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: messages,
      stream: true,
    });

    let fullContent = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullContent += chunk.delta.text;
      }
      
      if (config?.logModelResponse) {
        logger.debug('Claude streaming chunk:', JSON.stringify(chunk, null, 2));
      }
    }

    // Handle conversation history
    await this.handleConversationHistory(messages, fullContent);

    return fullContent;
  }

  /**
   * Generates text without streaming (for shorter operations)
   */
  private async generateTextWithoutStreaming(
    systemPrompt: string, 
    messages: Anthropic.MessageParam[], 
    config?: GenerateTextConfig
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.modelName,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: messages,
    });

    if (config?.logModelResponse) {
      logger.debug('Claude response:');
      logger.debug(JSON.stringify(response, null, 2));
    }

    // Extract the AI's response content
    const aiResponse = this.extractContentFromResponse(response);
    
    // Handle conversation history
    await this.handleConversationHistory(messages, aiResponse, config);

    return aiResponse;
  }

  /**
   * Handles conversation history for both streaming and non-streaming responses
   * @param messages - The Anthropic message parameters
   * @param aiResponse - The AI's response content
   */
  private async handleConversationHistory(messages: Anthropic.MessageParam[], aiResponse: string, config?: GenerateTextConfig): Promise<void> {
    // Create the AI response message
    const aiMessage: Message = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    if (config?.disableConversationHistory) {
      return;
    }

    if (messages.length === 1) {
      // First message - start new conversation with user message and AI response
      const userMessage: Message = {
        role: 'user',
        content: this.extractTextFromContent(messages[0].content),
        timestamp: new Date()
      };
      const conversation = await this.conversationHistoryService.startNewConversation([userMessage, aiMessage]);
      this.conversationId = conversation.id;
    } else {
      // Continuing conversation - add the last two messages (user + AI response)
      const lastUserMessage: Message = {
        role: 'user',
        content: this.extractTextFromContent(messages[messages.length - 1].content),
        timestamp: new Date()
      };
      await this.conversationHistoryService.updateConversation(this.conversationId as string, [lastUserMessage, aiMessage]);
    }
  }

  /**
   * Converts our Message format to Anthropic's message format
   * @param conversation - Array of our Message objects
   * @returns Array of Anthropic message objects
   */
  private convertToAnthropicFormat(conversation: Message[]): Anthropic.MessageParam[] {
    return conversation
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
  }

  /**
   * Extracts text content from Claude's response
   * @param response - Anthropic API response
   * @returns The text content as a string
   */
  private extractContentFromResponse(response: Anthropic.Message): string {
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if (firstContent.type === 'text') {
        return firstContent.text;
      }    
    }

    throw new Error('No text content found in Claude response');
  }

  /**
   * Safely extracts text content from Anthropic message content
   * @param content - The content from an Anthropic message
   * @returns The text content as a string
   */
  private extractTextFromContent(content: string | Anthropic.ContentBlockParam[]): string {
    if (typeof content === 'string') {
      return content;
    }
    
    // Find the first text block
    const textBlock = content.find(block => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text;
    }
    
    throw new Error('No text content found in message');
  }
}
