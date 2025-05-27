import { Task } from './task';
import { CompletionProvider, Message } from '../completion';
import { createSystemPrompt } from '../prompts';
import { parseAssistantMessage } from '../assistant-message';
import { Tool } from '../tools';
import { parseAssistantParameters } from '../assistant-message/parse-assistant-parameters';
import { createToolResponse } from '../user-response';

export class ButlerTask implements Task {
    private completionProvider: CompletionProvider;
    private tools: Tool[];

    constructor(completionProvider: CompletionProvider, tools: Tool[]) {
        this.completionProvider = completionProvider;
        this.tools = tools;
    }

    async run(): Promise<void> {
        const systemPrompt = createSystemPrompt(this.tools);
        const conversation = [{
            role: 'user',
            content: 'What is the weather in Denmark?'
        }] as Message[];

        for (let i = 0; i < 10; i++) {
            console.log(`Iteration ${i}`);
            const response = await this.completionProvider.generateText(systemPrompt, conversation);
            conversation.push({
                role: 'assistant',
                content: response
            });

            // console.log(response);

            const parsedResponse = parseAssistantMessage(response);
            // console.log(parsedResponse);

            for (const parsedResponseItem of parsedResponse) {
                if (parsedResponseItem.tagName === 'thinking') {
                    console.log(`THINKING: ${parsedResponseItem.content}`);
                    continue;
                }

                if (parsedResponseItem.tagName === 'ask_followup_question') {
                    console.log('NEED TO ASK FOLLOWUP QUESTION');
                    return;
                }

                if (parsedResponseItem.tagName === 'attempt_completion') {
                    console.log('Finished task');
                    console.log(parsedResponseItem.content);
                    return;
                }

                const tool = this.tools.find(t => t.description.name === parsedResponseItem.tagName);
                if (tool) {
                    console.log(`Executing tool: ${tool.description.name}`);
                    const parameters = parseAssistantParameters(parsedResponseItem);
                    console.log(`Parameters: ${Object.entries(parameters).map(([key, value]) => `${key}: ${value}`).join(', ')}`);
                    const result = await tool.execute(parameters);
                    console.log(`Result: ${JSON.stringify(result)}`);
                    const toolResponse = createToolResponse(tool, parameters, result);
                    conversation.push(toolResponse);
                    console.log(`Tool response: ${toolResponse.content}`);
                }
                else {
                    // TODO: What to do here??
                    console.log(`Tool not found: ${parsedResponseItem.tagName}`);
                }
            }
        }
    }
}