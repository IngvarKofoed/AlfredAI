/**
 * Node.js-specific WebSocket client implementation
 */
import { BaseWebSocketClient, WebSocketInterface } from './base-websocket-client';
export declare class NodeWebSocketClient extends BaseWebSocketClient {
    protected createWebSocket(url: string, protocols?: string | string[]): WebSocketInterface;
}
//# sourceMappingURL=node-websocket-client.d.ts.map