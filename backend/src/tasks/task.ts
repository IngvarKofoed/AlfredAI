import { EventEmitter } from 'events';
import { FollowupQuestion, ToolCall } from '../types';

export interface Task extends EventEmitter {
    on(event: 'thinking', listener: (text: string) => void): this;
    on(event: 'questionFromAssistant', listener: (questions: FollowupQuestion) => void): this;
    on(event: 'toolCallFromAssistant', listener: (toolCall: ToolCall) => void): this;
    on(event: 'answerFromAssistant', listener: (answer: string) => void): this;

    run(): Promise<void>;

    answerFromUser(answer: string): void;
}