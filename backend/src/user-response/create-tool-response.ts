import { Message } from "../types";
import { Tool, ToolResult } from "../tools";


export function createToolResponse(tool: Tool, args: Record<string, any>, result: ToolResult): Message {
    return {
        role: 'user',
        content: createToolResponseContent(tool, args, result)
    }
}

function createToolResponseContent(tool: Tool, args: Record<string, any>, result: ToolResult): string {
    const argumentsString = Object.entries(args).map(([key, value]) => `'${value}'`).join(', ');
    return `[${tool.description.name}${argumentsString ? ` for ${argumentsString}` : ''}] Result: ${result.result}`;
}
