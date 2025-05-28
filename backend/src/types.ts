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
 * Represents a tool call from the assistant to the user
 */
export interface ToolCall {
    /** The name of the tool to call */
    toolName: string;

    /** The parameters to pass to the tool */
    parameters: Record<string, any>;
}

/**
 * Represents a followup question with multiple choice options
 */
export interface FollowupQuestion {
    /** The question to ask the user */
    question: string;

    /** The options to choose from */
    options: string[];
} 