// Base message types for communication between client and server
export interface ServerMessage {
  type: string;
  payload: any;
}

// Thinking state from server
export interface ThinkingPayload {
  isThinking: boolean;
  text: string;
}

// Question from assistant payload
export interface QuestionFromAssistantPayload {
  item: string;
  questions?: string[];
}

// Tool call payload
export interface ToolCallPayload {
  tool: string;
  parameters: Record<string, any>;
}

// Server message types
export type ServerMessageType = 
  | 'thinking'
  | 'questionFromAssistant'
  | 'answerFromAssistant'
  | 'toolCallFromAssistant';

// Client message types for sending to server
export interface ClientMessage {
  type: 'prompt' | 'answer';
  payload: string;
}

// WebSocket connection states
export enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

// Connection status type
export type ConnectionStatus = 'Connecting' | 'Open' | 'Closing' | 'Closed';