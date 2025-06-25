export interface ServerMessage {
    type: string;
    payload: any;
}
export interface ThinkingPayload {
    isThinking: boolean;
    text: string;
}
export interface QuestionFromAssistantPayload {
    item: string;
    questions?: string[];
}
export interface ToolCallPayload {
    tool: string;
    parameters: Record<string, any>;
}
export type ServerMessageType = 'thinking' | 'questionFromAssistant' | 'answerFromAssistant' | 'toolCallFromAssistant';
export interface ClientMessage {
    type: 'prompt' | 'answer';
    payload: string;
}
export declare enum WebSocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
}
export type ConnectionStatus = 'Connecting' | 'Open' | 'Closing' | 'Closed';
//# sourceMappingURL=messages.d.ts.map