import { useRef, useEffect } from 'react';
import { useWebSocketClient } from './useWebSocketClient.js';
import {
  ServerMessage,
  createMessageHandler,
  MessageHandlerState,
  resetThinkingState
} from '@alfredai/shared-client';
import { useAppContext } from '../state/context.js';
import { createAnswerEntry } from '../types.js';

export const useWebSocket = (socketUrl: string) => {
  const { setThinking, addToHistory, setUserQuestions } = useAppContext();
  
  // Use refs for thinking state and start time
  const messageHandlerState = useRef<MessageHandlerState>({
    isCurrentlyThinking: false,
    thinkingStartTime: undefined
  });

  // Create message handler with callbacks
  const handleMessage = createMessageHandler(
    { setThinking, addToHistory, setUserQuestions },
    messageHandlerState
  );

  const handleError = (error: Error) => {
    resetThinkingState(setThinking, messageHandlerState);
  };

  const handleClose = () => {
    resetThinkingState(setThinking, messageHandlerState);
  };

  const onMessage = (message: ServerMessage) => {
    try {
      handleMessage(message);
    } catch (e) {
      console.error('Error parsing WebSocket message or handling it:', e);
      addToHistory(createAnswerEntry(`Raw message: ${JSON.stringify(message)}`));
      resetThinkingState(setThinking, messageHandlerState);
    }
  };

  const { sendMessage, readyState, reconnectTimer } = useWebSocketClient(
    socketUrl,
    {
      onMessage,
      onError: handleError,
      onClose: handleClose,
      shouldReconnect: true
    }
  );

  return { sendMessage, readyState, reconnectTimer };
};