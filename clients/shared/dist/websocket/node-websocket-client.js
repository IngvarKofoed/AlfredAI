"use strict";
/**
 * Node.js-specific WebSocket client implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeWebSocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
const base_websocket_client_1 = require("./base-websocket-client");
class NodeWebSocketAdapter {
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
        this.ws.on(type, listener);
    }
    removeEventListener(type, listener) {
        this.ws.off(type, listener);
    }
}
class NodeWebSocketClient extends base_websocket_client_1.BaseWebSocketClient {
    createWebSocket(url, protocols) {
        const ws = new ws_1.default(url, protocols);
        return new NodeWebSocketAdapter(ws);
    }
}
exports.NodeWebSocketClient = NodeWebSocketClient;
//# sourceMappingURL=node-websocket-client.js.map