"use strict";
/**
 * Platform-agnostic WebSocket client base class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWebSocketClient = void 0;
const events_1 = require("events");
const types_1 = require("../types");
class BaseWebSocketClient extends events_1.EventEmitter {
    socket = null;
    url;
    protocols;
    reconnectDelayMs;
    maxReconnectAttempts;
    heartbeatIntervalMs;
    state = {
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        lastError: undefined
    };
    reconnectTimer;
    heartbeatTimer;
    reconnectCountdownTimer;
    reconnectCountdown = 0;
    constructor(options) {
        super();
        this.url = options.url;
        this.protocols = options.protocols;
        this.reconnectDelayMs = options.reconnectDelayMs || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.heartbeatIntervalMs = options.heartbeatIntervalMs || 30000;
        if (options.onConnectionStatusChange) {
            this.on('connectionStatusChange', options.onConnectionStatusChange);
        }
        if (options.onError) {
            this.on('error', options.onError);
        }
    }
    connect() {
        if (this.socket?.readyState === types_1.WebSocketReadyState.OPEN) {
            return;
        }
        this.cleanup();
        try {
            this.socket = this.createWebSocket(this.url, this.protocols);
            this.setupEventHandlers();
            this.updateConnectionStatus('Connecting');
        }
        catch (error) {
            this.handleError(error);
        }
    }
    sendMessage(message) {
        if (!this.isConnected()) {
            console.warn('WebSocket is not open. Message not sent:', message);
            return false;
        }
        try {
            const messageString = JSON.stringify(message);
            this.socket.send(messageString);
            this.emit('messageSent', message);
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    isConnected() {
        return this.socket?.readyState === types_1.WebSocketReadyState.OPEN;
    }
    getConnectionStatus() {
        if (!this.socket) {
            return 'Closed';
        }
        return types_1.CONNECTION_STATUS[this.socket.readyState] || 'Closed';
    }
    updateConnectionStatus(status) {
        this.emit('connectionStatusChange', status);
    }
    handleError(error) {
        this.state.lastError = error;
        console.error('WebSocket error:', error);
        this.emit('error', error);
    }
    setupEventHandlers() {
        if (!this.socket)
            return;
        this.socket.addEventListener('open', this.handleOpen.bind(this));
        this.socket.addEventListener('close', this.handleClose.bind(this));
        this.socket.addEventListener('error', this.handleSocketError.bind(this));
        this.socket.addEventListener('message', this.handleMessage.bind(this));
    }
    handleOpen() {
        this.state.isConnected = true;
        this.state.isReconnecting = false;
        this.state.reconnectAttempts = 0;
        this.state.lastError = undefined;
        this.reconnectCountdown = 0;
        this.updateConnectionStatus('Open');
        this.startHeartbeat();
        this.emit('connected');
    }
    handleClose(event) {
        this.state.isConnected = false;
        this.stopHeartbeat();
        this.updateConnectionStatus('Closed');
        this.emit('disconnected', event);
        if (!this.state.isReconnecting && this.state.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnection();
        }
    }
    handleMessage(event) {
        try {
            let messageData;
            if (typeof event.data === 'string') {
                messageData = event.data;
            }
            else if (event.data instanceof ArrayBuffer) {
                messageData = new TextDecoder().decode(event.data);
            }
            else {
                messageData = event.data.toString();
            }
            const message = JSON.parse(messageData);
            this.emit('messageReceived', message);
            this.handleServerMessage(message);
        }
        catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.emit('parseError', error, event.data);
        }
    }
    handleServerMessage(message) {
        this.emit(`message:${message.type}`, message.payload);
    }
    attemptReconnection() {
        if (this.state.isReconnecting || this.state.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }
        this.state.isReconnecting = true;
        this.state.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelayMs * Math.pow(2, this.state.reconnectAttempts - 1), 30000);
        this.reconnectCountdown = Math.ceil(delay / 1000);
        this.emit('reconnecting', this.state.reconnectAttempts, delay);
        this.startReconnectCountdown();
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }
    startReconnectCountdown() {
        this.clearReconnectCountdown();
        this.reconnectCountdownTimer = setInterval(() => {
            this.reconnectCountdown = Math.max(0, this.reconnectCountdown - 1);
            this.emit('reconnectCountdown', this.reconnectCountdown);
            if (this.reconnectCountdown <= 0) {
                this.clearReconnectCountdown();
            }
        }, 1000);
    }
    clearReconnectCountdown() {
        if (this.reconnectCountdownTimer) {
            clearInterval(this.reconnectCountdownTimer);
            this.reconnectCountdownTimer = undefined;
        }
    }
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                this.sendMessage({
                    type: 'heartbeat',
                    payload: { timestamp: Date.now() }
                });
            }
        }, this.heartbeatIntervalMs);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }
    cleanup() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        this.clearReconnectCountdown();
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.removeEventListener('open', this.handleOpen);
            this.socket.removeEventListener('close', this.handleClose);
            this.socket.removeEventListener('error', this.handleSocketError);
            this.socket.removeEventListener('message', this.handleMessage);
            this.socket = null;
        }
    }
    handleSocketError(event) {
        const error = new Error(`WebSocket error: ${event.error || 'Unknown error'}`);
        this.handleError(error);
    }
    disconnect() {
        this.state.isReconnecting = false;
        if (this.socket) {
            this.socket.close(1000, 'Client disconnecting');
        }
        this.cleanup();
        this.updateConnectionStatus('Closed');
    }
    destroy() {
        this.disconnect();
        this.removeAllListeners();
    }
}
exports.BaseWebSocketClient = BaseWebSocketClient;
//# sourceMappingURL=base-websocket-client.js.map