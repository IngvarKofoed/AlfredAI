import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  thinking?: boolean;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // UI State
  sidebarOpen: boolean;
  currentSessionId: string | null;
  isTyping: boolean;
  
  // Sessions
  sessions: ChatSession[];
  
  // Current chat
  messages: Message[];
  thinking: boolean;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Session management
  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  
  // Message management
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  
  // Thinking state
  setThinking: (thinking: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  
  // Tool calls
  addToolCall: (messageId: string, toolCall: ToolCall) => void;
  updateToolCall: (messageId: string, toolCallId: string, updates: Partial<ToolCall>) => void;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const createDefaultSession = (): ChatSession => ({
  id: generateId(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - false for mobile-first approach
        sidebarOpen: false,
        currentSessionId: null,
        isTyping: false,
        sessions: [],
        messages: [],
        thinking: false,
        
        // UI Actions
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        // Session management
        createSession: (title?: string) => {
          const session = createDefaultSession();
          if (title) session.title = title;
          
          set((state) => ({
            sessions: [session, ...state.sessions],
            currentSessionId: session.id,
            messages: [],
          }));
          
          return session.id;
        },
        
        deleteSession: (sessionId: string) => {
          set((state) => {
            const sessions = state.sessions.filter(s => s.id !== sessionId);
            const isCurrentSession = state.currentSessionId === sessionId;
            
            return {
              sessions,
              currentSessionId: isCurrentSession ? (sessions[0]?.id || null) : state.currentSessionId,
              messages: isCurrentSession ? (sessions[0]?.messages || []) : state.messages,
            };
          });
        },
        
        setCurrentSession: (sessionId: string) => {
          const session = get().sessions.find(s => s.id === sessionId);
          if (session) {
            set({
              currentSessionId: sessionId,
              messages: session.messages,
            });
          }
        },
        
        updateSessionTitle: (sessionId: string, title: string) => {
          set((state) => ({
            sessions: state.sessions.map(s =>
              s.id === sessionId
                ? { ...s, title, updatedAt: new Date() }
                : s
            ),
          }));
        },
        
        // Message management
        addMessage: (messageData) => {
          const message: Message = {
            ...messageData,
            id: generateId(),
            timestamp: new Date(),
          };
          
          set((state) => {
            const newMessages = [...state.messages, message];
            const updatedSessions = state.sessions.map(s =>
              s.id === state.currentSessionId
                ? { ...s, messages: newMessages, updatedAt: new Date() }
                : s
            );
            
            return {
              messages: newMessages,
              sessions: updatedSessions,
            };
          });
        },
        
        updateMessage: (messageId: string, updates: Partial<Message>) => {
          set((state) => {
            const newMessages = state.messages.map(m =>
              m.id === messageId ? { ...m, ...updates } : m
            );
            const updatedSessions = state.sessions.map(s =>
              s.id === state.currentSessionId
                ? { ...s, messages: newMessages, updatedAt: new Date() }
                : s
            );
            
            return {
              messages: newMessages,
              sessions: updatedSessions,
            };
          });
        },
        
        deleteMessage: (messageId: string) => {
          set((state) => {
            const newMessages = state.messages.filter(m => m.id !== messageId);
            const updatedSessions = state.sessions.map(s =>
              s.id === state.currentSessionId
                ? { ...s, messages: newMessages, updatedAt: new Date() }
                : s
            );
            
            return {
              messages: newMessages,
              sessions: updatedSessions,
            };
          });
        },
        
        clearMessages: () => {
          set((state) => {
            const updatedSessions = state.sessions.map(s =>
              s.id === state.currentSessionId
                ? { ...s, messages: [], updatedAt: new Date() }
                : s
            );
            
            return {
              messages: [],
              sessions: updatedSessions,
            };
          });
        },
        
        // Thinking state
        setThinking: (thinking: boolean) => set({ thinking }),
        setIsTyping: (isTyping: boolean) => set({ isTyping }),
        
        // Tool calls
        addToolCall: (messageId: string, toolCall: ToolCall) => {
          set((state) => {
            const newMessages = state.messages.map(m =>
              m.id === messageId
                ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] }
                : m
            );
            const updatedSessions = state.sessions.map(s =>
              s.id === state.currentSessionId
                ? { ...s, messages: newMessages, updatedAt: new Date() }
                : s
            );
            
            return {
              messages: newMessages,
              sessions: updatedSessions,
            };
          });
        },
        
        updateToolCall: (messageId: string, toolCallId: string, updates: Partial<ToolCall>) => {
          set((state) => {
            const newMessages = state.messages.map(m =>
              m.id === messageId
                ? {
                    ...m,
                    toolCalls: m.toolCalls?.map(tc =>
                      tc.id === toolCallId ? { ...tc, ...updates } : tc
                    ),
                  }
                : m
            );
            const updatedSessions = state.sessions.map(s =>
              s.id === state.currentSessionId
                ? { ...s, messages: newMessages, updatedAt: new Date() }
                : s
            );
            
            return {
              messages: newMessages,
              sessions: updatedSessions,
            };
          });
        },
      }),
      {
        name: 'alfred-chat-store',
        partialize: (state) => ({
          sessions: state.sessions,
          currentSessionId: state.currentSessionId,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    { name: 'ChatStore' }
  )
);