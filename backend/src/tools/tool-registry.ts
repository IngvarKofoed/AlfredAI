import { Tool } from './tool';
import { weatherTool } from './weather-tool';
import { randomNumberTool } from './random-number-tool';
import { executeCommandTool } from './execute-command';
import { browserActionTool } from './browser-action';

export const toolRegistry = {
    weather: weatherTool as Tool,
    randomNumber: randomNumberTool as Tool,
    executeCommand: executeCommandTool as Tool,
    browserAction: browserActionTool as Tool,
}

export const getAllTools = (): Tool[] => {
    return Object.values(toolRegistry);
}

export const getTool = (name: string): Tool | undefined => {
    return toolRegistry[name as keyof typeof toolRegistry];
}
