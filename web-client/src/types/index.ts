// Export types from stores
export type { Message, ToolCall, ChatSession } from '@/store/chat-store';
export type { ConnectionStatus, ServerInfo } from '@/store/connection-store';

// WebSocket message types
export interface WebSocketOutMessage {
  type: 'message' | 'command' | 'stop';
  content?: string;
  command?: string;
  args?: string[];
  timestamp: string;
}

export interface WebSocketInMessage {
  type: 'response' | 'thinking' | 'error' | 'system' | 'tool_call_start' | 'tool_call_result' | 'server_info' | 'command_result';
  content?: string;
  thinking?: boolean;
  error?: string;
  data?: any;
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

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';