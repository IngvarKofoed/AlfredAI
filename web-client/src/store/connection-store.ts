import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ServerInfo {
  version?: string;
  hostname?: string;
  port?: number;
  personalities?: string[];
  currentPersonality?: string;
  providers?: string[];
  currentProvider?: string;
}

interface ConnectionState {
  // Connection state
  status: ConnectionStatus;
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  
  // Server info
  serverInfo: ServerInfo;
  
  // WebSocket instance
  ws: WebSocket | null;
  
  // Actions
  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setServerInfo: (info: Partial<ServerInfo>) => void;
  setWebSocket: (ws: WebSocket | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  
  // Connection management
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

const DEFAULT_WS_URL = 'ws://localhost:3001';

export const useConnectionStore = create<ConnectionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      status: 'disconnected',
      isConnected: false,
      error: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      serverInfo: {},
      ws: null,
      
      // Basic setters
      setStatus: (status: ConnectionStatus) => {
        set({ 
          status,
          isConnected: status === 'connected',
          error: status === 'connected' ? null : get().error,
        });
      },
      
      setError: (error: string | null) => set({ error }),
      
      setServerInfo: (info: Partial<ServerInfo>) => {
        set((state) => ({
          serverInfo: { ...state.serverInfo, ...info },
        }));
      },
      
      setWebSocket: (ws: WebSocket | null) => set({ ws }),
      
      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1,
        }));
      },
      
      resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
      
      // Connection management
      connect: async (url = DEFAULT_WS_URL) => {
        const state = get();
        
        if (state.ws?.readyState === WebSocket.OPEN) {
          return;
        }
        
        state.setStatus('connecting');
        state.setError(null);
        
        try {
          const ws = new WebSocket(url);
          state.setWebSocket(ws);
          
          return new Promise<void>((resolve, reject) => {
            const connectTimeout = setTimeout(() => {
              ws.close();
              reject(new Error('Connection timeout'));
            }, 10000);
            
            ws.onopen = () => {
              clearTimeout(connectTimeout);
              state.setStatus('connected');
              state.resetReconnectAttempts();
              console.log('Connected to Alfred AI server');
              resolve();
            };
            
            ws.onclose = (event) => {
              clearTimeout(connectTimeout);
              console.log('Disconnected from Alfred AI server', event);
              
              if (state.status !== 'disconnected') {
                state.setStatus('disconnected');
                
                // Auto-reconnect logic
                const { reconnectAttempts, maxReconnectAttempts } = get();
                if (reconnectAttempts < maxReconnectAttempts) {
                  setTimeout(() => {
                    state.incrementReconnectAttempts();
                    state.reconnect();
                  }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
                }
              }
            };
            
            ws.onerror = (error) => {
              clearTimeout(connectTimeout);
              console.error('WebSocket error:', error);
              state.setStatus('error');
              state.setError('Failed to connect to server');
              reject(error);
            };
            
            ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                
                // Handle server info updates
                if (data.type === 'server_info') {
                  state.setServerInfo(data.data);
                }
                
                // Emit custom event for message handling
                window.dispatchEvent(
                  new CustomEvent('alfred-message', { detail: data })
                );
              } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
              }
            };
          });
        } catch (error) {
          state.setStatus('error');
          state.setError(error instanceof Error ? error.message : 'Connection failed');
          throw error;
        }
      },
      
      disconnect: () => {
        const { ws } = get();
        if (ws) {
          set({ status: 'disconnected' });
          ws.close();
          set({ ws: null });
        }
      },
      
      reconnect: async () => {
        const { disconnect, connect } = get();
        disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return connect();
      },
    }),
    { name: 'ConnectionStore' }
  )
);