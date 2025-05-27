import { Task } from './task';
import { CompletionProvider, Message } from '../completion';
import { createSystemPrompt } from '../prompts';
import { parseAssistantMessage } from '../assistant-message';
import { Tool } from '../tools';
import { parseAssistantParameters } from '../assistant-message/parse-assistant-parameters';
import { parseAssistantCompletion } from '../assistant-message/parse-assistant-completion';
import { createToolResponse } from '../user-response';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export class ButlerTask extends EventEmitter implements Task {
    private question: string;
    private completionProvider: CompletionProvider;
    private tools: Tool[];

    constructor(question: string, completionProvider: CompletionProvider, tools: Tool[]) {
        super();
        this.question = question;
        this.completionProvider = completionProvider;
        this.tools = tools;
    }

    async run(): Promise<void> {
        const systemPrompt = createSystemPrompt(this.tools);
        const conversation = [{
            role: 'user',
            content: this.question
        }] as Message[];

        logger.info(`Running task with question: ${this.question}`);

        for (let i = 0; i < 10; i++) {
            logger.debug(`Iteration ${i}`);
            const response = await this.completionProvider.generateText(systemPrompt, conversation);
            conversation.push({
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
                    this.emit('questionFromAssistant', parsedResponseItem.content);
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
                    conversation.push(toolResponse);
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