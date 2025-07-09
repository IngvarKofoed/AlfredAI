import { Tool, ToolInitializationContext } from '../tool';
import { ButlerTask } from '../../tasks/butlerTask';
import { CompletionProvider } from '../../completion';
import { ProviderFactory } from '../../completion/provider-factory';
import { getAllTools } from '../tool-registry';
import { getConversationHistoryService, getPersonalityService } from '../../service-locator';
import { logger } from '../../utils/logger';

export const subAgentsTool: Tool = {
    description: {
        name: 'subAgents',
        description: 'Start multiple sub-agents to handle different tasks or questions. A single sub-agent takes a prompt and returns an answer in form of a string. The sub-agents will be executed in parallel and the results will be returned as an array of strings.',
        parameters: [
            {
                name: 'prompts',
                description: 'Array of prompts or questions for the sub-agents to handle',
                usage: 'Array of specific tasks or questions you want the sub-agents to work on',
                required: true,
            }
        ],
        examples: [
            {
                description: 'Start multiple sub-agents to analyze different aspects of a problem',
                parameters: [
                    {
                        name: 'prompts',
                        value: '["Analyze this code for performance issues", "Check for security vulnerabilities", "Suggest code improvements"]',
                    }
                ],
            },
            {
                description: 'Start sub-agents to handle different parts of a project',
                parameters: [
                    {
                        name: 'prompts',
                        value: '["Create a project plan", "Design the database schema", "Plan the API endpoints"]',
                    }
                ],
            }
        ],
    },

    initialize: async (context: ToolInitializationContext) => {
        // No initialization needed for sub-agents tool
    },

    execute: async (parameters: Record<string, any>) => {
        const prompts = parameters.prompts;

        if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
            return {
                success: false,
                error: 'Prompts array is required and must contain at least one prompt for sub-agents execution'
            };
        }

        try {
            const personalityService = getPersonalityService();
            const activePersonality = personalityService.getActivePersonality();
            const completionProvider = ProviderFactory.createFromPersonalityOrEnv(
                activePersonality || undefined, 
                'claude'
            );
            // Get all available tools for the sub-agents
            const tools = getAllTools();
            
            const conversationHistoryService = getConversationHistoryService();

            // Create all ButlerTask instances
            const taskPromises = prompts.map(async (prompt, i) => {

                const conversation = await conversationHistoryService.createEmptyConversation();

                logger.info(`Starting sub-agent ${i + 1} with prompt: ${prompt}`);
                const subAgentTask = new ButlerTask(prompt, completionProvider, tools, undefined, conversation.id);
                let finalAnswer: string | null = null;
                let error: string | null = null;
                subAgentTask.on('answerFromAssistant', (answer: string) => {
                    finalAnswer = answer;
                    logger.info(`Sub-agent ${i + 1} completed with answer: ${answer.substring(0, 100)}...`);
                });
                subAgentTask.on('error', (err: Error) => {
                    error = err.message;
                    logger.error(`Sub-agent ${i + 1} error: ${err.message}`);
                });
                return { subAgentTask, finalAnswerRef: () => finalAnswer, errorRef: () => error, prompt, index: i };
            });

            // Wait for all task objects to be created
            const tasks = await Promise.all(taskPromises);

            // Start all tasks in parallel
            await Promise.all(tasks.map(t => t.subAgentTask.run()));

            // Collect results
            const subAgentResults: string[] = [];
            const errors: string[] = [];
            for (const task of tasks) {
                if (task.finalAnswerRef()) {
                    subAgentResults.push(`Sub-agent ${task.index + 1} (${task.prompt}):\n${task.finalAnswerRef()}`);
                }
                else if (task.errorRef()) {
                    errors.push(`Sub-agent ${task.index + 1} failed: ${task.errorRef()}`);
                } else {
                    errors.push(`Sub-agent ${task.index + 1} did not provide a final answer`);
                }
            }

            // Compile results
            if (errors.length > 0 && subAgentResults.length === 0) {
                return {
                    success: false,
                    error: `All sub-agents failed:\n${errors.join('\n')}`
                };
            }

            const result = JSON.stringify(subAgentResults, null, 2);

            if (errors.length > 0) {
                return {
                    success: true,
                    result: `${result}\n\nErrors:\n${errors.join('\n')}`
                };
            }

            return {
                success: true,
                result: result
            };

        } catch (error) {
            logger.error('Failed to execute sub-agents:', error);
            return {
                success: false,
                error: `Failed to execute sub-agents: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
