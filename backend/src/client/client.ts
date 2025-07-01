import { EventEmitter } from 'events';
import { Task } from '../tasks/task';
import { Message, FollowupQuestion, ToolCall } from '../types';
import { logger } from '../utils/logger';

export class Client extends EventEmitter {
    private task: Task | undefined = undefined;
    private taskFactory: (message: string) => Task;

    constructor(taskFactory: (message: string) => Task) {
        super();
        this.taskFactory = taskFactory;
        logger.info('Client created with empty conversation history');
    }

    public messageFromUser(message: string): void {
        if (this.task) {
            console.log('A task is already running');
            return;
        }

        this.emit('thinking', '');

        // Add user message to conversation history
        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        // Create task with conversation history
        this.task = this.taskFactory(message);
        this.task.on('thinking', this.thinking.bind(this));
        this.task.on('questionFromAssistant', this.questionFromAssistant.bind(this));
        this.task.on('toolCallFromAssistant', this.toolCallFromAssistant.bind(this));
        this.task.on('answerFromAssistant', this.answerFromAssistant.bind(this));
        this.task.run();
    }

    public thinking(text: string): void {
        this.emit('thinking', text);
    }

    public questionFromAssistant(questions: FollowupQuestion): void {
        this.emit('questionFromAssistant', questions);
    }

    public toolCallFromAssistant(toolCall: ToolCall): void {
        this.emit('toolCallFromAssistant', toolCall);
    }

    public answerFromAssistant(answer: string): void {
        this.emit('answerFromAssistant', answer);
        this.task = undefined;
    }

    public answerFromUser(answer: string): void {
        if (this.task) {
            this.task.answerFromUser(answer);
        } else {
            console.log('No task is currently running to receive the answer');
        }
    }
}
