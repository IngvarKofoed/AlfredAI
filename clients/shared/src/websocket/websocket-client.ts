import WebSocket from 'ws';
import {
  ServerMessage,
  WebSocketReadyState,
  ConnectionStatus,
  ClientMessage
} from '../types/messages';

export interface WebSocketClientCallbacks {
  onOpen?: () => void;
  onClose?: (code: number, reason: Buffer) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: ServerMessage) => void;
}

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private callbacks: WebSocketClientCallbacks;
  private readyState: WebSocketReadyState = WebSocketReadyState.CLOSED;

  constructor(url: string, callbacks: WebSocketClientCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.socket = new WebSocket(this.url);
    this.readyState = WebSocketReadyState.CONNECTING;

    this.socket.on('open', () => {
      this.readyState = WebSocketReadyState.OPEN;
      this.callbacks.onOpen?.();
    });

    this.socket.on('close', (code: number, reason: Buffer) => {
      this.readyState = WebSocketReadyState.CLOSED;
      this.callbacks.onClose?.(code, reason);
    });

    this.socket.on('error', (error: Error) => {
      this.readyState = WebSocketReadyState.CLOSED;
      this.callbacks.onError?.(error);
    });

    this.socket.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      if (!isBinary) {
        const messageData = data.toString();
        try {
          const message = JSON.parse(messageData) as ServerMessage;
          this.callbacks.onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.error('Raw message:', messageData);
        }
      } else {
        console.log('Received binary message, ignoring.');
      }
    });
  }

  disconnect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.readyState = WebSocketReadyState.CLOSING;
      this.socket.close();
    }
  }

  sendMessage(message: string | ClientMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageToSend);
    } else {
      console.warn('WebSocket is not open. Message not sent:', message);
    }
  }

  getReadyState(): WebSocketReadyState {
    return this.readyState;
  }

  getConnectionStatus(): ConnectionStatus {
    const statusMap: Record<WebSocketReadyState, ConnectionStatus> = {
      [WebSocketReadyState.CONNECTING]: 'Connecting',
      [WebSocketReadyState.OPEN]: 'Open',
      [WebSocketReadyState.CLOSING]: 'Closing',
      [WebSocketReadyState.CLOSED]: 'Closed',
    };
    return statusMap[this.readyState];
  }

  isConnected(): boolean {
    return this.readyState === WebSocketReadyState.OPEN;
  }
}