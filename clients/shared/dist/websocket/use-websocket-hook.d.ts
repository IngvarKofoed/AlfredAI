import { ServerMessage, WebSocketReadyState, ConnectionStatus, ClientMessage } from '../types/messages';
export interface UseWebSocketOptions {
    onMessage?: (message: ServerMessage) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
    shouldReconnect?: boolean;
}
export interface UseWebSocketReturn {
    sendMessage: (message: string | ClientMessage) => void;
    connectionStatus: ConnectionStatus;
    lastJsonMessage: ServerMessage | null;
    readyState: WebSocketReadyState;
    reconnectTimer: number;
}
export declare const useWebSocket: (socketUrl: string, options?: UseWebSocketOptions) => UseWebSocketReturn;
//# sourceMappingURL=use-websocket-hook.d.ts.map