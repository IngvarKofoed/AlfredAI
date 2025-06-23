import Anthropic from '@anthropic-ai/sdk';
import { CompletionProvider, GenerateTextConfig } from '../';
import { logger } from '../../utils/logger';
import { Message } from '../../types';
import { MemoryInjector } from '../../memory/memory-injector';

/**
 * Claude implementation of the LargeLanguageModel interface
 * Uses Anthropic's Claude API for text generation
 */
export class ClaudeCompletionProvider implements CompletionProvider {
  private anthropic: Anthropic;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;
  private memoryInjector?: MemoryInjector;

  /**
   * Creates a new Claude LLM instance
   * @param apiKey - Anthropic API key
   * @param modelName - Claude model to use (e.g., 'claude-3-sonnet-20240229')
   * @param maxTokens - Maximum tokens to generate (default: 4096)
   * @param temperature - Sampling temperature (default: 0.7)
   */
  constructor(
    apiKey: string,
    modelName: string = 'claude-3-5-sonnet-20241022',
    maxTokens: number = 4096,
    temperature: number = 0.7,
    memoryInjector?: MemoryInjector
  ) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
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
  }

  /**
   * Gets the Claude model name being used
   * @returns The model name/identifier
   */
  getModelName(): string {
    return this.modelName;
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
          logger.debug('Memory injection completed for Claude provider');
        } catch (error) {
          logger.warn('Memory injection failed, using original system prompt:', error);
        }
      }

      // Convert our Message format to Anthropic's format
      const anthropicMessages = this.convertToAnthropicFormat(conversation);

      // Make the API call to Claude
      const response = await this.anthropic.messages.create({
        model: this.modelName,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: enhancedSystemPrompt,
        messages: anthropicMessages,
      });

      if (config?.logModelResponse) {
        logger.debug('Claude response:');
        logger.debug(JSON.stringify(response, null, 2));
      }

      // Extract the text content from Claude's response
      const content = this.extractContentFromResponse(response);

      // Return in our Message format as an array
      return content;
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
}
