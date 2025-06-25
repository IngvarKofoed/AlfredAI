"use strict";
/**
 * Browser-specific WebSocket client implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserWebSocketClient = void 0;
const base_websocket_client_1 = require("./base-websocket-client");
class BrowserWebSocketAdapter {
    ws;
    constructor(ws) {
        this.ws = ws;
    }
    get readyState() {
        return this.ws.readyState;
    }
    send(data) {
        this.ws.send(data);
    }
    close(code, reason) {
        this.ws.close(code, reason);
    }
    addEventListener(type, listener) {
        this.ws.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
        this.ws.removeEventListener(type, listener);
    }
}
class BrowserWebSocketClient extends base_websocket_client_1.BaseWebSocketClient {
    createWebSocket(url, protocols) {
        const ws = new WebSocket(url, protocols);
        return new BrowserWebSocketAdapter(ws);
    }
    static isSupported() {
        return typeof WebSocket !== 'undefined';
    }
}
exports.BrowserWebSocketClient = BrowserWebSocketClient;
//# sourceMappingURL=browser-websocket-client.js.map