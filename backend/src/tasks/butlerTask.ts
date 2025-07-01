import { Task } from './task';
import { CompletionProvider } from '../completion';
import { createSystemPrompt } from '../prompts';
import { parseAssistantMessage } from '../assistant-message';
import { Tool } from '../tools';
import { parseAssistantParameters } from '../assistant-message/parse-assistant-parameters';
import { parseAssistantCompletion } from '../assistant-message/parse-assistant-completion';
import { parseAssistantFollowupQuestion } from '../assistant-message/parse-assistant-followup-question';
import { createToolResponse } from '../user-response';
import { Message, ToolCall } from '../types';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { getConversationHistoryService, getMemoryService } from '../service-locator';

export class ButlerTask extends EventEmitter implements Task {
    private question: string;
    private completionProvider: CompletionProvider;
    private tools: Tool[];
    // private conversation: Message[] = [];
    private waitingForAnswer = false;
    private userAnswer: string | null = null;

    constructor(question: string, completionProvider: CompletionProvider, tools: Tool[], conversationHistory?: Message[]) {
        super();
        this.question = question;
        this.completionProvider = completionProvider;
        this.tools = tools;        
    }

    async run(): Promise<void> {
        // Create system prompt (personality is handled internally)
        const systemPrompt = createSystemPrompt(this.tools);
        
        // No longer reset conversation here - use what was provided in constructor
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
        const conversationHistoryService = getConversationHistoryService();
        const currentConversation = conversationHistoryService.getCurrentConversation();

        if (!currentConversation) {
            await conversationHistoryService.startNewConversation([{
                role: 'user',
                content: this.question
            }]);
        }
        else {
            await this.addMessageToConversation({
                role: 'user',
                content: this.question
            });
        }

        for (let i = 0; i < 20; i++) {
            logger.debug(`Starting iteration ${i} of conversation`);
            const response = await this.completionProvider.generateText(systemPrompt, this.getConversation());
            
            const aiMessage: Message = {
                role: 'assistant',
                content: response
            };

            await this.addMessageToConversation(aiMessage);

            // Evaluate conversation for memory creation after AI response
            await this.evaluateConversationForMemory(aiMessage);

            const parsedResponse = parseAssistantMessage(response);

            if (parsedResponse.length === 0) {
                logger.warn(`No response tags found in assistant message: ${response}`);
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
                    const questionData = parseAssistantFollowupQuestion(parsedResponseItem.content);
                    logger.info(`Followup question: ${questionData}`);
                    this.emit('questionFromAssistant', questionData);
                    
                    // Wait for user answer
                    this.waitingForAnswer = true;
                    await this.waitForAnswer();
                    
                    // Add user's answer to conversation and continue
                    if (this.userAnswer) {
                        await this.addMessageToConversation({
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
                
                const toolCall: ToolCall = {
                    tool: parsedResponseItem.tagName,
                    parameters: parseAssistantParameters(parsedResponseItem)
                }

                const tool = this.tools.find(t => t.description.name === toolCall.tool);
                if (tool) {
                    logger.info(`Executing tool: ${tool.description.name}`);
                    
                    logger.info(`Parameters: ${Object.entries(toolCall.parameters).map(([key, value]) => `${key}: ${value}`).join(', ')}`);
                    
                    // Emit tool call event before execution
                    this.emit('toolCallFromAssistant', toolCall);
                    
                    const result = await tool.execute(toolCall.parameters);
                    // logger.info(`Result: ${JSON.stringify(result)}`);
                    const toolResponse = createToolResponse(tool, toolCall.parameters, result);
                    await this.addMessageToConversation(toolResponse);
                    const truncatedContent = toolResponse.content.length > 500 
                        ? toolResponse.content.substring(0, 500) + '...' 
                        : toolResponse.content;
                    logger.info(`Tool response: ${truncatedContent}`);
                }
                else {
                    // TODO: What to do here??
                    logger.error(`Tool not found: ${parsedResponseItem.tagName}`);
                }
            }
        }

        logger.error(`Conversation loop ended without finding a completion tag`);
    }

    /**
     * Evaluate the conversation for memory creation using the memory evaluator
     */
    private async evaluateConversationForMemory(aiMessage: Message): Promise<void> {
        try {
            // Get the last user message (the one that prompted this AI response)
            const userMessage = this.getConversation()
                .slice(0, -1) // Exclude the current AI message
                .filter(msg => msg.role === 'user')
                .pop();

            if (!userMessage) {
                logger.debug('No user message found for memory evaluation');
                return;
            }

            // Get memory service and evaluate the conversation
            const memoryService = getMemoryService();
            await memoryService.evaluateConversation(userMessage, aiMessage, this.getConversation());
            
        } catch (error) {
            logger.warn('Failed to evaluate conversation for memory:', error);
        }
    }

    private getConversation(): Message[] {
        const conversationHistoryService = getConversationHistoryService();
        const currentConversation = conversationHistoryService.getCurrentConversation();
        if (!currentConversation) {
            throw new Error('No conversation found');
        }
        return currentConversation.messages;
    }

    private async addMessageToConversation(message: Message): Promise<void> {
        const conversationHistoryService = getConversationHistoryService();
        const currentConversation = conversationHistoryService.getCurrentConversation();
        if (!currentConversation) {
            throw new Error('No conversation found');
        }
        const newMessages = [...currentConversation.messages, message];
        await conversationHistoryService.updateConversation(currentConversation.id, newMessages);
    }
}