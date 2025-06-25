import { ServerMessage, WebSocketReadyState, ConnectionStatus, ClientMessage } from '../types/messages';
export interface WebSocketClientCallbacks {
    onOpen?: () => void;
    onClose?: (code: number, reason: Buffer) => void;
    onError?: (error: Error) => void;
    onMessage?: (message: ServerMessage) => void;
}
export declare class WebSocketClient {
    private socket;
    private url;
    private callbacks;
    private readyState;
    constructor(url: string, callbacks?: WebSocketClientCallbacks);
    connect(): void;
    disconnect(): void;
    sendMessage(message: string | ClientMessage): void;
    getReadyState(): WebSocketReadyState;
    getConnectionStatus(): ConnectionStatus;
    isConnected(): boolean;
}
//# sourceMappingURL=websocket-client.d.ts.map