import Anthropic from '@anthropic-ai/sdk';
import { LargeLanguageModel, Message } from './large-language-model';

/**
 * Claude implementation of the LargeLanguageModel interface
 * Uses Anthropic's Claude API for text generation
 */
export class ClaudeLargeLanguageModel implements LargeLanguageModel {
  private anthropic: Anthropic;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;

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
    temperature: number = 0.7
  ) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    this.modelName = modelName;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
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
   * @param conversation - Array of messages representing the conversation context
   * @returns Promise that resolves to an array of AI-generated response messages
   */
  async generateText(conversation: Message[]): Promise<Message[]> {
    try {
      // Convert our Message format to Anthropic's format
      const anthropicMessages = this.convertToAnthropicFormat(conversation);

      // Make the API call to Claude
      const response = await this.anthropic.messages.create({
        model: this.modelName,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: anthropicMessages,
      });

      // Extract the text content from Claude's response
      const content = this.extractContentFromResponse(response);

      // Return in our Message format as an array
      return [...conversation, {
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        id: response.id,
      }];
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
