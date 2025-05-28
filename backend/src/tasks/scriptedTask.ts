import { EventEmitter } from 'events';
import { Task } from './task';
import { FollowupQuestion } from '../assistant-message/parse-assistant-followup-question';

export class ScriptedTask extends EventEmitter implements Task {
    private isRunning = false;
    private waitingForAnswer = false;
    private userAnswer: string | null = null;

    constructor(private message: string) {
        super();
    }

    async run(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Task is already running');
        }

        this.isRunning = true;

        try {
            // Simulate thinking phase
            this.emit('thinking', 'Analyzing the request...');
            await this.delay(2000);

            this.emit('thinking', 'Processing information...');
            await this.delay(2000);

            // Simulate asking a followup question
            const followupQuestion: FollowupQuestion = {
                question: 'What would you like me to focus on?',
                options: [
                    'Performance optimization',
                    'Code quality improvements',
                    'Feature implementation',
                    'Bug fixes'
                ]
            };
            this.emit('questionFromAssistant', followupQuestion);
            
            // Wait for user answer
            this.waitingForAnswer = true;
            await this.waitForAnswer();

            // Simulate more thinking based on user input
            this.emit('thinking', `Based on your choice: "${this.userAnswer}", I'm formulating a response...`);
            await this.delay(2000);

            // Simulate providing an answer
            const answer = `Based on the analysis and your preference for "${this.userAnswer}", I recommend implementing the requested changes with a focus on maintainability and performance. Here's my detailed response with actionable steps.`;
            this.emit('answerFromAssistant', answer);
        } finally {
            this.isRunning = false;
            this.waitingForAnswer = false;
            this.userAnswer = null;
        }
    }

    answerFromUser(answer: string): void {
        if (this.waitingForAnswer) {
            this.userAnswer = answer;
            this.waitingForAnswer = false;
        }
    }

    private async waitForAnswer(): Promise<void> {
        return new Promise<void>((resolve) => {
            const checkAnswer = () => {
                if (!this.waitingForAnswer) {
                    resolve();
                } else {
                    setTimeout(checkAnswer, 100);
                }
            };
            checkAnswer();
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Override EventEmitter methods to provide proper typing
    on(event: 'thinking', listener: (text: string) => void): this;
    on(event: 'questionFromAssistant', listener: (questions: FollowupQuestion) => void): this;
    on(event: 'answerFromAssistant', listener: (answer: string) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    emit(event: 'thinking', text: string): boolean;
    emit(event: 'questionFromAssistant', questions: FollowupQuestion): boolean;
    emit(event: 'answerFromAssistant', answer: string): boolean;
    emit(event: string | symbol, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }
}
