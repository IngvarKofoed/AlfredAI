import { Tool, ToolParameter, ToolExample } from '../tools';
import { ToolExampleParameter } from '../tools/tool';


export function createToolPrompt(tools: Tool[]): string {
    return tools.map(tool => `## ${tool.description.name}
Description: ${tool.description.description}
Parameters:
${tool.description.parameters.map(param => `- ${param.name}: (${(param.required ? 'required' : 'optional')}) ${param.description}`).join('\n')}
Usage:
<${tool.description.name}>
${tool.description.parameters.map(param => `<${param.name}>${param.usage}</${param.name}>`).join('\n')}
</${tool.description.name}>

${tool.description.examples.map(x => mapExample(tool.description.name, x)).join('\n\n')}
`).join('\n\n');
}


function mapExample(name: string, example: ToolExample): string {
    return `Example: ${example.description}
<${name}>
${example.parameters.map(mapExampleParameter).join('\n')}
</${name}>`;
}

function mapExampleParameter(parameter: ToolExampleParameter): string {
    return `<${parameter.name}>${parameter.value}</${parameter.name}>`;
}

