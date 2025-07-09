export type HistoryEntry = UserMessageHistoryEntry | AssistantAnswerHistoryEntry | AssistantToolUsageHistoryEntry | ElapsedTimeHistoryEntry | PromptResponseHistoryEntry;

// Command-related types
export interface Command {
    name: string;
    description: string;
    schema?: CommandSchema;
}

export interface CommandSchema {
    arguments?: CommandArgument[];
    options?: CommandOption[];
}

export interface CommandArgument {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required: boolean;
    default?: any;
    choices?: Array<{
        label: string;
        value: any;
        description?: string;
    }>;
    pattern?: string;
    min?: number;
    max?: number;
}

export interface CommandOption {
    name: string;
    short?: string;
    description: string;
    type: 'boolean' | 'string' | 'number' | 'select';
    default?: any;
    choices?: Array<{
        label: string;
        value: any;
        description?: string;
    }>;
    pattern?: string;
    min?: number;
    max?: number;
}

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

export interface PromptResponseHistoryEntry {
    type: 'promptResponse';
    response: string;
}

export const createUserMessageEntry = (message: string): UserMessageHistoryEntry => ({
    type: 'user',
    message
});

// Utility functions for creating history entries
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

export const createPromptResponseEntry = (response: string): PromptResponseHistoryEntry => ({
    type: 'promptResponse',
    response
});

// Sub-agent related types
export interface SubAgentState {
    id: string;
    prompt: string;
    status: 'starting' | 'running' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    result?: string;
    error?: string;
}

export interface SubAgentEvent {
    type: 'subAgentStarted' | 'subAgentCompleted' | 'subAgentFailed';
    subAgent: SubAgentState;
}

