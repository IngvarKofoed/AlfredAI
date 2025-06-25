// State management types
export interface ThinkingState {
    isThinking: boolean;
    text: string;
    startTime?: number; // Timestamp when thinking started
}