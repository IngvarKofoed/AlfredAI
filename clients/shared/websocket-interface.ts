// --- Shared Message Structure (from your input) ---
export interface IMessage {
    id: string; // Unique ID for the message
    content: string;
    role: 'user' | 'assistant';
    timestamp: number; // Unix timestamp (milliseconds) when message was created/sent
}

// --- Common base structure for all WebSocket messages ---
interface WebSocketMessageBase<T extends string, P> {
  type: T;
  correlationId?: string; // Optional: client-generated ID for request-response matching
  payload: P;
}

// --- Payloads for Client-to-Server Messages ---
export interface UserInputPayload {
  message: IMessage; // The user's message object
  context?: Record<string, any>; // Optional client-specific context
}

export interface HeartbeatPayload {
  timestamp: number; // Unix timestamp (milliseconds)
}

// --- Client-to-Server Message Types ---
export type ClientUserMessage = WebSocketMessageBase<'user_message', UserInputPayload>;
export type ClientHeartbeatMessage = WebSocketMessageBase<'heartbeat', HeartbeatPayload>;

// Discriminated union for all possible messages from Client to Server
export type ClientToServerMessage =
  | ClientUserMessage
  | ClientHeartbeatMessage;

// --- Payloads for Server-to-Client Messages ---
export interface AssistantOutputPayload {
  message: IMessage; // The assistant's message object
}

export interface ErrorPayload {
  code?: string; // Optional backend-defined error code
  message: string;
}

// --- Server-to-Client Message Types ---
export type ServerAssistantResponseMessage = WebSocketMessageBase<'assistant_response', AssistantOutputPayload>;
export type ServerErrorMessage = WebSocketMessageBase<'error', ErrorPayload>;

// Discriminated union for all possible messages from Server to Client
export type ServerToClientMessage =
  | ServerAssistantResponseMessage
  | ServerErrorMessage;