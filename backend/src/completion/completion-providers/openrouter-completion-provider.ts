import { CompletionProvider, GenerateTextConfig } from '../';
import { logger } from '../../utils/logger';
import { Message } from '../../types';

/**
 * OpenRouter implementation of the CompletionProvider interface
 * Uses OpenRouter's OpenAI-compatible API for text generation
 */
export class OpenRouterCompletionProvider implements CompletionProvider {
  private apiKey: string;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;
  private baseURL: string;

  /**
   * Creates a new OpenRouter completion provider instance
   * @param apiKey - OpenRouter API key
   * @param modelName - Model to use (e.g., 'anthropic/claude-3-sonnet', 'openai/gpt-4')
   * @param maxTokens - Maximum tokens to generate (default: 4096)
   * @param temperature - Sampling temperature (default: 0.7)
   * @param baseURL - OpenRouter API base URL (default: 'https://openrouter.ai/api/v1')
   */
  constructor(
    apiKey: string,
    modelName: string = 'anthropic/claude-3-haiku',
    maxTokens: number = 4096,
    temperature: number = 0.7,
    baseURL: string = 'https://openrouter.ai/api/v1'
  ) {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.baseURL = baseURL;
  }

  /**
   * Gets the OpenRouter model name being used
   * @returns The model name/identifier
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Generates text responses using OpenRouter based on conversation history
   * @param systemPrompt - The system prompt to use for the conversation
   * @param conversation - Array of messages representing the conversation context
   * @param config - Configuration options for text generation (optional)
   * @returns Promise that resolves to the AI-generated response text
   */
  async generateText(systemPrompt: string, conversation: Message[], config?: GenerateTextConfig): Promise<string> {
    try {
      // Convert our Message format to OpenAI-compatible format
      const messages = this.convertToOpenAIFormat(systemPrompt, conversation);

      // Make the API call to OpenRouter
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/user/alfred-ai', // Optional: helps with rate limits
          'X-Title': 'Alfred AI', // Optional: shows in OpenRouter dashboard
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (config?.logModelResponse) {
        logger.debug('OpenRouter response:');
        logger.debug(JSON.stringify(data, null, 2));
      }

      // Extract the text content from OpenRouter's response
      const content = this.extractContentFromResponse(data);
      return content;
    } catch (error) {
      throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Converts our Message format to OpenAI-compatible format with system prompt
   * @param systemPrompt - The system prompt
   * @param conversation - Array of our Message objects
   * @returns Array of OpenAI-compatible message objects
   */
  private convertToOpenAIFormat(systemPrompt: string, conversation: Message[]) {
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
    ];

    return messages;
  }

  /**
   * Extracts text content from OpenRouter's response
   * @param response - OpenRouter API response (OpenAI-compatible format)
   * @returns The text content as a string
   */
  private extractContentFromResponse(response: any): string {
    if (response.choices && response.choices.length > 0) {
      const firstChoice = response.choices[0];
      if (firstChoice.message?.content) {
        return firstChoice.message.content;
      }
    }

    throw new Error('No text content found in OpenRouter response');
  }
} 