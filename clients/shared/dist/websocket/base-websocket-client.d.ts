/**
 * Platform-agnostic WebSocket client base class
 */
import { EventEmitter } from 'events';
import { ConnectionStatus, ClientToServerMessage, ServerToClientMessage, WebSocketClientOptions, ClientState } from '../types';
export interface WebSocketInterface {
    readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    addEventListener(type: string, listener: any): void;
    removeEventListener(type: string, listener: any): void;
}
export declare abstract class BaseWebSocketClient extends EventEmitter {
    protected socket: WebSocketInterface | null;
    protected url: string;
    protected protocols?: string | string[];
    protected reconnectDelayMs: number;
    protected maxReconnectAttempts: number;
    protected heartbeatIntervalMs: number;
    protected state: ClientState;
    protected reconnectTimer?: NodeJS.Timeout;
    protected heartbeatTimer?: NodeJS.Timeout;
    protected reconnectCountdownTimer?: NodeJS.Timeout;
    protected reconnectCountdown: number;
    constructor(options: WebSocketClientOptions);
    protected abstract createWebSocket(url: string, protocols?: string | string[]): WebSocketInterface;
    connect(): void;
    sendMessage(message: ClientToServerMessage): boolean;
    isConnected(): boolean;
    getConnectionStatus(): ConnectionStatus;
    protected updateConnectionStatus(status: ConnectionStatus): void;
    protected handleError(error: Error): void;
    protected setupEventHandlers(): void;
    protected handleOpen(): void;
    protected handleClose(event: any): void;
    protected handleMessage(event: any): void;
    protected handleServerMessage(message: ServerToClientMessage): void;
    protected attemptReconnection(): void;
    protected startReconnectCountdown(): void;
    protected clearReconnectCountdown(): void;
    protected startHeartbeat(): void;
    protected stopHeartbeat(): void;
    protected cleanup(): void;
    protected handleSocketError(event: any): void;
    disconnect(): void;
    destroy(): void;
}
//# sourceMappingURL=base-websocket-client.d.ts.map