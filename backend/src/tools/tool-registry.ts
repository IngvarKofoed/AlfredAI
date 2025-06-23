import { Tool } from './tool';
import { weatherTool } from './weather-tool';
import { randomNumberTool } from './random-number-tool';
import { executeCommandTool } from './execute-command';
import { mcpConsumerTool } from './mcp/mcp-consumer-tool';
import { dockerTool } from './docker-tool';
import { personalityTool } from './personality/personality-tool';
import { aiProviderTool } from './ai-provider-tool';
// import { memoryTool } from './memory-tool'; // Disabled for automatic memory evaluation testing
import { browserActionTool } from './browser/browser-action-tool';

export const toolRegistry = {
    weather: weatherTool as Tool,
    randomNumber: randomNumberTool as Tool,
    executeCommand: executeCommandTool as Tool,
    mcpConsumer: mcpConsumerTool as Tool,
    docker: dockerTool as Tool,
    personalityManager: personalityTool as Tool,
    aiProvider: aiProviderTool as Tool,
    // memoryManager: memoryTool as Tool, // Disabled for automatic memory evaluation testing
    browserAction: browserActionTool as Tool,
}

export const getAllTools = (): Tool[] => {
    return Object.values(toolRegistry);
}

export const getTool = (name: string): Tool | undefined => {
    return toolRegistry[name as keyof typeof toolRegistry];
}
