/**
 * Browser-specific WebSocket client implementation
 */
import { BaseWebSocketClient, WebSocketInterface } from './base-websocket-client';
export declare class BrowserWebSocketClient extends BaseWebSocketClient {
    protected createWebSocket(url: string, protocols?: string | string[]): WebSocketInterface;
    static isSupported(): boolean;
}
//# sourceMappingURL=browser-websocket-client.d.ts.map