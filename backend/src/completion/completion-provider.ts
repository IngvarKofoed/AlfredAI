import { Message } from '../types';

/**
 * Interface for Large Language Model implementations
 * Defines the contract for AI models that can generate text responses
 */
export interface CompletionProvider {
  /**
   * Optional: Get the model name or identifier
   */
  getModelName?(): string;

  /**
 * Generates text responses based on the conversation history
 * @param systemPrompt - The system prompt to use for the conversation
 * @param conversation - Array of messages representing the conversation context
 * @returns Promise that resolves to an array of AI-generated response messages,
 * where the first messages is the previous message from the user, and the last message is the AI's response.
 */
  generateText(systemPrompt: string, conversation: Message[]): Promise<string>;
}