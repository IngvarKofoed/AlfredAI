import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketClient, WebSocketClientCallbacks } from './websocket-client';
import {
  ServerMessage,
  WebSocketReadyState,
  ConnectionStatus,
  ClientMessage
} from '../types/messages';

const RECONNECT_DELAY_SECONDS = 5;

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

export const useWebSocket = (
  socketUrl: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const [lastJsonMessage, setLastJsonMessage] = useState<ServerMessage | null>(null);
  const [readyState, setReadyState] = useState<WebSocketReadyState>(WebSocketReadyState.CONNECTING);
  const [attemptReconnect, setAttemptReconnect] = useState<boolean>(false);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [reconnectTimer, setReconnectTimer] = useState<number>(0);
  
  const clientRef = useRef<WebSocketClient | null>(null);
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    shouldReconnect = true
  } = options;

  const createClient = useCallback(() => {
    const callbacks: WebSocketClientCallbacks = {
      onOpen: () => {
        setReadyState(WebSocketReadyState.OPEN);
        setAttemptReconnect(false);
        setReconnectTimer(0);
        onOpen?.();
      },
      onClose: (code: number, reason: Buffer) => {
        setReadyState(WebSocketReadyState.CLOSED);
        if (shouldReconnect) {
          setAttemptReconnect(true);
          setReconnectTimer(RECONNECT_DELAY_SECONDS);
        }
        onClose?.();
      },
      onError: (error: Error) => {
        setReadyState(WebSocketReadyState.CLOSED);
        if (shouldReconnect) {
          setAttemptReconnect(true);
          setReconnectTimer(RECONNECT_DELAY_SECONDS);
        }
        onError?.(error);
      },
      onMessage: (message: ServerMessage) => {
        setLastJsonMessage(message);
        onMessage?.(message);
      }
    };

    return new WebSocketClient(socketUrl, callbacks);
  }, [socketUrl, onMessage, onOpen, onClose, onError, shouldReconnect]);

  useEffect(() => {
    if (!socketUrl) {
      return;
    }

    clientRef.current = createClient();
    clientRef.current.connect();
    setReadyState(WebSocketReadyState.CONNECTING);
    setReconnectTimer(0);

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      setReadyState(WebSocketReadyState.CLOSED);
    };
  }, [socketUrl, createClient, reconnectAttempt]);

  // Effect for handling reconnect timer
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (attemptReconnect && readyState === WebSocketReadyState.CLOSED && reconnectTimer > 0) {
      timerId = setInterval(() => {
        setReconnectTimer((prev: number) => prev - 1);
      }, 1000);
    } else if (reconnectTimer === 0 && attemptReconnect && readyState === WebSocketReadyState.CLOSED) {
      setAttemptReconnect(false);
      setReconnectAttempt((prev: number) => prev + 1);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [attemptReconnect, readyState, reconnectTimer]);

  const sendMessage = useCallback((message: string | ClientMessage) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.sendMessage(message);
    } else {
      console.warn('WebSocket is not open. Message not sent:', message);
    }
  }, []);

  const connectionStatus = clientRef.current?.getConnectionStatus() || 'Closed';

  return {
    sendMessage,
    connectionStatus,
    lastJsonMessage,
    readyState,
    reconnectTimer
  };
};