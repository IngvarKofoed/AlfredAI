import { EventEmitter } from 'events';
import { Task } from '../tasks/task';
import { ButlerTask } from '../tasks/butlerTask';
import { CompletionProvider } from '../completion';
import { Tool } from '../tools';

export class Client extends EventEmitter {
    private task: Task | undefined = undefined;
    private completionProvider: CompletionProvider;
    private tools: Tool[];

    constructor(completionProvider: CompletionProvider, tools: Tool[]) {
        super();
        this.completionProvider = completionProvider;
        this.tools = tools;
    }

    public messageFromUser(message: string): void {
        if (this.task) {
            console.log('A task is already running');
            return;
        }

        this.emit('thinking', '');

        this.task = new ButlerTask(message, this.completionProvider, this.tools);
        this.task.on('thinking', this.thinking.bind(this));
        this.task.on('questionFromAssistant', this.questionFromAssistant.bind(this));
        this.task.on('answerFromAssistant', this.answerFromAssistant.bind(this));
        this.task.run();
    }

    public thinking(text: string): void {
        this.emit('thinking', text);
    }

    public questionFromAssistant(questions: string): void {
        this.emit('questionFromAssistant', questions);
    }

    public answerFromAssistant(answer: string): void {
        this.emit('answerFromAssistant', answer);
        this.task = undefined;
    }
}
