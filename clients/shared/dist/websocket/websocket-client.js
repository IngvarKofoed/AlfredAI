"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
const messages_1 = require("../types/messages");
class WebSocketClient {
    socket = null;
    url;
    callbacks;
    readyState = messages_1.WebSocketReadyState.CLOSED;
    constructor(url, callbacks = {}) {
        this.url = url;
        this.callbacks = callbacks;
    }
    connect() {
        if (this.socket && this.socket.readyState === ws_1.default.OPEN) {
            return; // Already connected
        }
        this.socket = new ws_1.default(this.url);
        this.readyState = messages_1.WebSocketReadyState.CONNECTING;
        this.socket.on('open', () => {
            this.readyState = messages_1.WebSocketReadyState.OPEN;
            this.callbacks.onOpen?.();
        });
        this.socket.on('close', (code, reason) => {
            this.readyState = messages_1.WebSocketReadyState.CLOSED;
            this.callbacks.onClose?.(code, reason);
        });
        this.socket.on('error', (error) => {
            this.readyState = messages_1.WebSocketReadyState.CLOSED;
            this.callbacks.onError?.(error);
        });
        this.socket.on('message', (data, isBinary) => {
            if (!isBinary) {
                const messageData = data.toString();
                try {
                    const message = JSON.parse(messageData);
                    this.callbacks.onMessage?.(message);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    console.error('Raw message:', messageData);
                }
            }
            else {
                console.log('Received binary message, ignoring.');
            }
        });
    }
    disconnect() {
        if (this.socket && (this.socket.readyState === ws_1.default.OPEN || this.socket.readyState === ws_1.default.CONNECTING)) {
            this.readyState = messages_1.WebSocketReadyState.CLOSING;
            this.socket.close();
        }
    }
    sendMessage(message) {
        if (this.socket && this.socket.readyState === ws_1.default.OPEN) {
            const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
            this.socket.send(messageToSend);
        }
        else {
            console.warn('WebSocket is not open. Message not sent:', message);
        }
    }
    getReadyState() {
        return this.readyState;
    }
    getConnectionStatus() {
        const statusMap = {
            [messages_1.WebSocketReadyState.CONNECTING]: 'Connecting',
            [messages_1.WebSocketReadyState.OPEN]: 'Open',
            [messages_1.WebSocketReadyState.CLOSING]: 'Closing',
            [messages_1.WebSocketReadyState.CLOSED]: 'Closed',
        };
        return statusMap[this.readyState];
    }
    isConnected() {
        return this.readyState === messages_1.WebSocketReadyState.OPEN;
    }
}
exports.WebSocketClient = WebSocketClient;
//# sourceMappingURL=websocket-client.js.map