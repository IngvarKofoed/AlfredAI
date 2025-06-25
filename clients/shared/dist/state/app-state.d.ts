import { HistoryEntry } from '../types/history';
import { ThinkingState } from '../types/state';
export interface AppState {
    history: HistoryEntry[];
    addToHistory: (item: HistoryEntry) => void;
    thinking: ThinkingState;
    setThinking: (thinking: ThinkingState) => void;
    userQuestions?: string[];
    setUserQuestions: (questions: string[]) => void;
}
//# sourceMappingURL=app-state.d.ts.map