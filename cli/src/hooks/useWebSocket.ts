import { useRef } from 'react';
import { useWebSocket as useSharedWebSocket } from '@alfredai/shared-client/websocket';
import {
  ServerMessage,
  createMessageHandler,
  MessageHandlerState,
  resetThinkingState
} from '@alfredai/shared-client';
import { useAppContext } from '../state/context.js';
import { createAnswerEntry } from '../types.js';

export const useWebSocket = (socketUrl: string) => {
  const { setThinking, addToHistory, setReconnectTimer, setUserQuestions } = useAppContext();
  
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

  const { sendMessage, connectionStatus, lastJsonMessage, readyState, reconnectTimer } = useSharedWebSocket(
    socketUrl,
    {
      onMessage,
      onError: handleError,
      onClose: handleClose,
      shouldReconnect: true
    }
  );

  // Update the reconnect timer in the app context
  setReconnectTimer(reconnectTimer);

  return { sendMessage, connectionStatus, lastJsonMessage, readyState };
};