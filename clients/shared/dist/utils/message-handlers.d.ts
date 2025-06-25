import { ServerMessage } from '../types/messages';
import { HistoryEntry } from '../types/history';
import { ThinkingState } from '../types/state';
export interface MessageHandlerCallbacks {
    setThinking: (thinking: ThinkingState) => void;
    addToHistory: (entry: HistoryEntry) => void;
    setUserQuestions: (questions: string[]) => void;
}
export interface MessageHandlerState {
    isCurrentlyThinking: boolean;
    thinkingStartTime?: number;
}
export declare const createMessageHandler: (callbacks: MessageHandlerCallbacks, state: {
    current: MessageHandlerState;
}) => (message: ServerMessage) => void;
export declare const resetThinkingState: (setThinking: (thinking: ThinkingState) => void, state: {
    current: MessageHandlerState;
}) => void;
//# sourceMappingURL=message-handlers.d.ts.map