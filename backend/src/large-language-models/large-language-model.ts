/**
 * Represents a message in a conversation with a Large Language Model
 */
export interface Message {
  /** The role of the message sender */
  role: 'user' | 'assistant';

  /** The content/text of the message */
  content: string;

  /** Optional timestamp when the message was created */
  timestamp?: Date;
  
  /** Optional unique identifier for the message */
  id?: string;
}

/**
 * Interface for Large Language Model implementations
 * Defines the contract for AI models that can generate text responses
 */
export interface LargeLanguageModel {
  /**
   * Optional: Get the model name or identifier
   */
  getModelName?(): string;

    /**
   * Generates text responses based on the conversation history
   * @param conversation - Array of messages representing the conversation context
   * @returns Promise that resolves to an array of AI-generated response messages,
   * where the first messages is the previous message from the user, and the last message is the AI's response.
   */
  generateText(conversation: Message[]): Promise<Message[]>;
}
