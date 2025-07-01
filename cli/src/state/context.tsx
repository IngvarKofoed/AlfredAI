import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { HistoryEntry } from '../types.js';

// Define command interface
export interface Command {
  name: string;
  description: string;
}

// Define the shape of the application state
interface AppState {
  history: HistoryEntry[];
  addToHistory: (item: HistoryEntry) => void;
  thinking: ThinkingState;
  setThinking: (thinking: ThinkingState) => void;
  reconnectTimer: number;
  setReconnectTimer: (timer: number) => void;
  userQuestions?: string[];
  setUserQuestions: (questions: string[]) => void;
  commands: Command[];
  setCommands: (commands: Command[]) => void;
  // Add other state properties and actions here
}

interface ThinkingState {
  isThinking: boolean;
  text: string;
  startTime?: number; // Timestamp when thinking started
}

// Create the context with a default undefined value
const AppContext = createContext<AppState | undefined>(undefined);

// Create a provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [thinking, setThinking] = useState<ThinkingState>({ isThinking: false, text: '', startTime: undefined });
  const [reconnectTimer, setReconnectTimer] = useState<number>(0);
  const [userQuestions, setUserQuestions] = useState<string[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);

  // Memoize addToHistory with useCallback
  const addToHistory = useCallback((item: HistoryEntry) => {
    setHistory(prevHistory => [...prevHistory, item]);
  }, []); // Empty dependency array means it's created once

  // Memoize setThinking with useCallback (though less critical as setThinking from useState is stable, it's good practice)
  const memoizedSetThinking = useCallback((thinking: ThinkingState) => {
    setThinking(thinking);
  }, []); // Empty dependency array

  const memoizedSetReconnectTimer = useCallback((timer: number) => {
    setReconnectTimer(timer);
  }, []);

  const memoizedSetUserQuestions = useCallback((questions: string[]) => {
    setUserQuestions(questions);
  }, []);

  const memoizedSetCommands = useCallback((commands: Command[]) => {
    setCommands(commands);
  }, []);

  const contextValue: AppState = {
    history,
    addToHistory,
    thinking,
    setThinking: memoizedSetThinking, // Use the memoized version
    reconnectTimer,
    setReconnectTimer: memoizedSetReconnectTimer,
    userQuestions,
    setUserQuestions: memoizedSetUserQuestions,
    commands,
    setCommands: memoizedSetCommands,
    // Add other state values and actions here
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Create a custom hook to use the AppContext
export const useAppContext = (): AppState => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 