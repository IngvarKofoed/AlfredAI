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