export interface IMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: number;
}
interface WebSocketMessageBase<T extends string, P> {
    type: T;
    correlationId?: string;
    payload: P;
}
export interface UserInputPayload {
    message: IMessage;
    context?: Record<string, any>;
}
export interface HeartbeatPayload {
    timestamp: number;
}
export type ClientUserMessage = WebSocketMessageBase<'user_message', UserInputPayload>;
export type ClientHeartbeatMessage = WebSocketMessageBase<'heartbeat', HeartbeatPayload>;
export type ClientToServerMessage = ClientUserMessage | ClientHeartbeatMessage;
export interface AssistantOutputPayload {
    message: IMessage;
}
export interface ErrorPayload {
    code?: string;
    message: string;
}
export type ServerAssistantResponseMessage = WebSocketMessageBase<'assistant_response', AssistantOutputPayload>;
export type ServerErrorMessage = WebSocketMessageBase<'error', ErrorPayload>;
export type ServerToClientMessage = ServerAssistantResponseMessage | ServerErrorMessage;
export {};
//# sourceMappingURL=websocket-interface.d.ts.map