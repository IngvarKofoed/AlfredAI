import { EventEmitter } from 'events';

export interface Task extends EventEmitter {
    on(event: 'thinking', listener: (text: string) => void): this;
    on(event: 'questionFromAssistant', listener: (questions: string) => void): this;
    on(event: 'answerFromAssistant', listener: (answer: string) => void): this;

    run(): Promise<void>;
}