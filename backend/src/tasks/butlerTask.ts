import { Task } from './task';
import { CompletionProvider, Message } from '../completion';
import { createSystemPrompt } from '../prompts';
import { parseAssistantMessage } from '../assistant-message';
import { Tool } from '../tools';

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
                    // TODO: Execute the tool
//                     const result = await tool.execute(parsedResponseItem.parameters);
//                     conversation.push({
//                         role: 'user',
//                         content: `[${tool.description.name}] Result:
// ${result}
// `
//                     });
                }
                else {
                    // TODO: What to do here??
                }

                if (parsedResponseItem.tagName === 'weather') {
                    conversation.push({
                        role: 'user',
                        content: `[weather] Result:
The weather in Denmark is sunny.
`
                    });
                }
            }
        }
    }
}