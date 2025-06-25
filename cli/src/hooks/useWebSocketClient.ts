import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketClient, ServerMessage, WebSocketReadyState, ClientMessage } from '@alfredai/shared-client';

const RECONNECT_DELAY_SECONDS = 5;

export interface UseWebSocketClientOptions {
  onMessage?: (message: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  shouldReconnect?: boolean;
}

export interface UseWebSocketClientReturn {
  sendMessage: (message: string | ClientMessage) => void;
  readyState: WebSocketReadyState;
  reconnectTimer: number;
}

export const useWebSocketClient = (
  socketUrl: string,
  options: UseWebSocketClientOptions = {}
): UseWebSocketClientReturn => {
  const [readyState, setReadyState] = useState<WebSocketReadyState>(WebSocketReadyState.CONNECTING);
  const [attemptReconnect, setAttemptReconnect] = useState<boolean>(false);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [reconnectTimer, setReconnectTimer] = useState<number>(0);
  
  const clientRef = useRef<WebSocketClient | null>(null);
  const callbacksRef = useRef(options);
  
  // Update callbacks ref when options change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);
  
  const {
    shouldReconnect = true
  } = options;

  const createClient = useCallback(() => {
    const client = new WebSocketClient(socketUrl, {
      onOpen: () => {
        setReadyState(WebSocketReadyState.OPEN);
        setAttemptReconnect(false);
        setReconnectTimer(0);
        callbacksRef.current.onOpen?.();
      },
      onClose: () => {
        setReadyState(WebSocketReadyState.CLOSED);
        if (shouldReconnect) {
          setAttemptReconnect(true);
          setReconnectTimer(RECONNECT_DELAY_SECONDS);
        }
        callbacksRef.current.onClose?.();
      },
      onError: (error: Error) => {
        setReadyState(WebSocketReadyState.CLOSED);
        if (shouldReconnect) {
          setAttemptReconnect(true);
          setReconnectTimer(RECONNECT_DELAY_SECONDS);
        }
        callbacksRef.current.onError?.(error);
      },
      onMessage: (message: ServerMessage) => {
        callbacksRef.current.onMessage?.(message);
      }
    });

    return client;
  }, [socketUrl, shouldReconnect]);

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

  return {
    sendMessage,
    readyState,
    reconnectTimer
  };
};