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
export declare const createUserMessageEntry: (message: string) => UserMessageHistoryEntry;
export declare const createAnswerEntry: (answer: string) => AssistantAnswerHistoryEntry;
export declare const createToolEntry: (tool: string, parameters: Record<string, any>) => AssistantToolUsageHistoryEntry;
export declare const createElapsedTimeEntry: (seconds: number) => ElapsedTimeHistoryEntry;
//# sourceMappingURL=history.d.ts.map