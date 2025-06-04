import { EventEmitter } from 'events';
import { Task } from '../tasks/task';
import { Message, FollowupQuestion, ToolCall } from '../types';
import { logger } from '../utils/logger';

export class Client extends EventEmitter {
    private task: Task | undefined = undefined;
    private taskFactory: (message: string, conversationHistory?: Message[]) => Task;
    private conversationHistory: Message[] = [];

    constructor(taskFactory: (message: string, conversationHistory?: Message[]) => Task) {
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
        this.conversationHistory.push(userMessage);
        logger.debug(`Added user message to history. Total messages: ${this.conversationHistory.length}`);

        // Create task with conversation history
        this.task = this.taskFactory(message, [...this.conversationHistory]);
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
        // Add assistant response to conversation history
        const assistantMessage: Message = {
            role: 'assistant',
            content: answer,
            timestamp: new Date()
        };
        this.conversationHistory.push(assistantMessage);
        logger.debug(`Added assistant message to history. Total messages: ${this.conversationHistory.length}`);

        this.emit('answerFromAssistant', answer);
        this.task = undefined;
    }

    public answerFromUser(answer: string): void {
        if (this.task) {
            // Add follow-up user answer to conversation history
            const userAnswer: Message = {
                role: 'user',
                content: answer,
                timestamp: new Date()
            };
            this.conversationHistory.push(userAnswer);
            logger.debug(`Added follow-up user answer to history. Total messages: ${this.conversationHistory.length}`);

            this.task.answerFromUser(answer);
        } else {
            console.log('No task is currently running to receive the answer');
        }
    }

    // Optional: Method to clear conversation history for new sessions
    public clearHistory(): void {
        this.conversationHistory = [];
        logger.info('Conversation history cleared');
    }

    // Optional: Method to get conversation history for debugging
    public getConversationHistory(): Message[] {
        return [...this.conversationHistory];
    }
}
