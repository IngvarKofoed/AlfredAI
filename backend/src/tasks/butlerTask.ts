import { Task } from './task';
import { CompletionProvider, Message } from '../completion';
import { createSystemPrompt } from '../prompts';
import { parseAssistantMessage } from '../assistant-message';
import { Tool } from '../tools';
import { parseAssistantParameters } from '../assistant-message/parse-assistant-parameters';
import { parseAssistantCompletion } from '../assistant-message/parse-assistant-completion';
import { parseAssistantFollowupQuestion } from '../assistant-message/parse-assistant-followup-question';
import { createToolResponse } from '../user-response';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export class ButlerTask extends EventEmitter implements Task {
    private question: string;
    private completionProvider: CompletionProvider;
    private tools: Tool[];
    private conversation: Message[] = [];
    private waitingForAnswer = false;
    private userAnswer: string | null = null;

    constructor(question: string, completionProvider: CompletionProvider, tools: Tool[]) {
        super();
        this.question = question;
        this.completionProvider = completionProvider;
        this.tools = tools;
    }

    async run(): Promise<void> {
        const systemPrompt = createSystemPrompt(this.tools);
        this.conversation = [{
            role: 'user',
            content: this.question
        }] as Message[];

        logger.info(`Running task with question: ${this.question}`);

        await this.processConversation(systemPrompt);
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

    private async processConversation(systemPrompt: string): Promise<void> {
        for (let i = 0; i < 10; i++) {
            logger.debug(`Iteration ${i}`);
            const response = await this.completionProvider.generateText(systemPrompt, this.conversation);
            this.conversation.push({
                role: 'assistant',
                content: response
            });

            const parsedResponse = parseAssistantMessage(response);

            if (parsedResponse.length === 0) {
                this.emit('answerFromAssistant', response); // We assume the assistant is done
                return;
            }

            for (const parsedResponseItem of parsedResponse) {
                if (parsedResponseItem.tagName === 'thinking') {
                    logger.info(`Thinking: ${parsedResponseItem.content.trim()}`);
                    this.emit('thinking', parsedResponseItem.content.trim());
                    continue;
                }

                if (parsedResponseItem.tagName === 'ask_followup_question') {
                    logger.warn('NEED TO ASK FOLLOWUP QUESTION');
                    const questionData = parseAssistantFollowupQuestion(parsedResponseItem.content);
                    this.emit('questionFromAssistant', questionData);
                    
                    // Wait for user answer
                    this.waitingForAnswer = true;
                    await this.waitForAnswer();
                    
                    // Add user's answer to conversation and continue
                    if (this.userAnswer) {
                        this.conversation.push({
                            role: 'user',
                            content: this.userAnswer
                        });
                        logger.info(`User answered: ${this.userAnswer}`);
                        this.userAnswer = null;
                        
                        // Continue processing with the user's answer
                        await this.processConversation(systemPrompt);
                        return;
                    }
                    return;
                }

                if (parsedResponseItem.tagName === 'attempt_completion') {
                    const completionData = parseAssistantCompletion(parsedResponseItem.content);
                    logger.info(`Finished task with answer: ${completionData.result}`);
                    if (completionData.command) {
                        logger.info(`Command: ${completionData.command}`);
                        this.emit('answerFromAssistant', `${completionData.result} (Command: ${completionData.command})`);
                    } else {
                        this.emit('answerFromAssistant', completionData.result);
                    }
                    return;
                }

                const tool = this.tools.find(t => t.description.name === parsedResponseItem.tagName);
                if (tool) {
                    logger.info(`Executing tool: ${tool.description.name}`);
                    const parameters = parseAssistantParameters(parsedResponseItem);
                    logger.info(`Parameters: ${Object.entries(parameters).map(([key, value]) => `${key}: ${value}`).join(', ')}`);
                    const result = await tool.execute(parameters);
                    logger.info(`Result: ${JSON.stringify(result)}`);
                    const toolResponse = createToolResponse(tool, parameters, result);
                    this.conversation.push(toolResponse);
                    logger.info(`Tool response: ${toolResponse.content}`);
                }
                else {
                    // TODO: What to do here??
                    logger.error(`Tool not found: ${parsedResponseItem.tagName}`);
                }
            }
        }
    }
}