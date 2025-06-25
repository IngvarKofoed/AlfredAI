// History entry types for conversation tracking
export type HistoryEntry = UserMessageHistoryEntry | AssistantAnswerHistoryEntry | AssistantToolUsageHistoryEntry | ElapsedTimeHistoryEntry;

export interface UserMessageHistoryEntry {
    type: 'user';
    message: string;
}

export interface AssistantAnswerHistoryEntry {
    type: 'answer';
    answer: string;
}

export interface AssistantToolUsageHistoryEntry {
    type: 'tool';
    tool: string;
    parameters: Record<string, any>;
}

export interface ElapsedTimeHistoryEntry {
    type: 'elapsedTime';
    seconds: number;
}

// Utility functions for creating history entries
export const createUserMessageEntry = (message: string): UserMessageHistoryEntry => ({
    type: 'user',
    message
});

export const createAnswerEntry = (answer: string): AssistantAnswerHistoryEntry => ({
    type: 'answer',
    answer
});

export const createToolEntry = (tool: string, parameters: Record<string, any>): AssistantToolUsageHistoryEntry => ({
    type: 'tool',
    tool,
    parameters
});

export const createElapsedTimeEntry = (seconds: number): ElapsedTimeHistoryEntry => ({
    type: 'elapsedTime',
    seconds
});