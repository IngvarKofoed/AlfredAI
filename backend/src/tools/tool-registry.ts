import { Tool } from './tool';
import { weatherTool } from './weather-tool';
import { randomNumberTool } from './random-number-tool';
import { executeCommandTool } from './execute-command';
import { mcpConsumerTool } from './mcp-consumer-tool';

export const toolRegistry = {
    weather: weatherTool as Tool,
    randomNumber: randomNumberTool as Tool,
    executeCommand: executeCommandTool as Tool,
    mcpConsumer: mcpConsumerTool as Tool,
}

export const getAllTools = (): Tool[] => {
    return Object.values(toolRegistry);
}

export const getTool = (name: string): Tool | undefined => {
    return toolRegistry[name as keyof typeof toolRegistry];
}
