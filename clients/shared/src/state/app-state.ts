import { HistoryEntry } from '../types/history';
import { ThinkingState } from '../types/state';

// Define the shape of the application state
export interface AppState {
  history: HistoryEntry[];
  addToHistory: (item: HistoryEntry) => void;
  thinking: ThinkingState;
  setThinking: (thinking: ThinkingState) => void;
  userQuestions?: string[];
  setUserQuestions: (questions: string[]) => void;
}