'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useConnectionStore } from '@/store/connection-store';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  data?: any;
  content?: string;
  error?: string;
  thinking?: boolean;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, any>;
    status?: 'pending' | 'success' | 'error';
    result?: any;
  };
  serverInfo?: {
    version?: string;
    hostname?: string;
    port?: number;
    personalities?: string[];
    currentPersonality?: string;
    providers?: string[];
    currentProvider?: string;
  };
}

export function useWebSocketMessage(): void {
  const { 
    addMessage, 
    setThinking, 
    updateMessage, 
    messages,
    addToolCall,
    updateToolCall 
  } = useChatStore();
  const { setServerInfo } = useConnectionStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleMessage = (event: CustomEvent<WebSocketMessage>): void => {
      const message = event.detail;

      switch (message.type) {
        case 'response':
          // AI response message
          if (message.content) {
            setThinking(false);
            addMessage({
              type: 'assistant',
              content: message.content,
            });
          }
          break;

        case 'thinking':
          // Thinking state update
          setThinking(message.thinking ?? false);
          break;

        case 'error':
          // Error message
          setThinking(false);
          addMessage({
            type: 'error',
            content: message.error || 'An error occurred',
          });
          
          toast({
            title: 'Error',
            description: message.error || 'An error occurred',
            variant: 'destructive',
          });
          break;

        case 'system':
          // System message
          if (message.content) {
            addMessage({
              type: 'system',
              content: message.content,
            });
          }
          break;

        case 'tool_call_start':
          // Tool call started
          if (message.toolCall) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.type === 'assistant') {
              addToolCall(lastMessage.id, {
                ...message.toolCall,
                status: 'pending',
              });
            }
          }
          break;

        case 'tool_call_result':
          // Tool call completed
          if (message.toolCall) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.type === 'assistant') {
              updateToolCall(lastMessage.id, message.toolCall.id, {
                status: message.toolCall.status || 'success',
                result: message.toolCall.result,
              });
            }
          }
          break;

        case 'server_info':
          // Server information update
          if (message.serverInfo) {
            setServerInfo(message.serverInfo);
          }
          break;

        case 'command_result':
          // Command execution result
          if (message.content) {
            addMessage({
              type: 'system',
              content: message.content,
            });
          }
          setThinking(false);
          break;

        case 'partial_response':
          // Streaming response (if implemented)
          // This would update the last assistant message in real-time
          break;

        default:
          console.log('Unknown message type:', message.type, message);
      }
    };

    // Listen for custom events from the WebSocket connection
    window.addEventListener('alfred-message', handleMessage as EventListener);

    return () => {
      window.removeEventListener('alfred-message', handleMessage as EventListener);
    };
  }, [
    addMessage,
    setThinking,
    updateMessage,
    messages,
    addToolCall,
    updateToolCall,
    setServerInfo,
    toast,
  ]);
}