import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { HistoryEntry, ThinkingState, AppState } from '@alfredai/shared-client';

// Create the context with a default undefined value
const AppContext = createContext<AppState | undefined>(undefined);

// Create a provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [thinking, setThinking] = useState<ThinkingState>({ isThinking: false, text: '', startTime: undefined });
  const [userQuestions, setUserQuestions] = useState<string[]>([]);

  // Memoize addToHistory with useCallback
  const addToHistory = useCallback((item: HistoryEntry) => {
    setHistory(prevHistory => [...prevHistory, item]);
  }, []); // Empty dependency array means it's created once

  // Memoize setThinking with useCallback (though less critical as setThinking from useState is stable, it's good practice)
  const memoizedSetThinking = useCallback((thinking: ThinkingState) => {
    setThinking(thinking);
  }, []); // Empty dependency array

  const memoizedSetUserQuestions = useCallback((questions: string[]) => {
    setUserQuestions(questions);
  }, []);

  const contextValue: AppState = {
    history,
    addToHistory,
    thinking,
    setThinking: memoizedSetThinking, // Use the memoized version
    userQuestions,
    setUserQuestions: memoizedSetUserQuestions,
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