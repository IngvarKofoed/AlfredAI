import 'dotenv/config';
import { ClaudeCompletionProvider } from './completion/completion-providers/claude-completion-provider';
import { ButlerTask } from './tasks/butlerTask';
import { getAllTools } from './tools';
import { createToolPrompt } from './prompts/create-tools-prompt';

async function main() {

    const tools = getAllTools();
    // const toolPrompt = createToolPrompt(tools);
    // console.log('Tool Prompt:');
    // console.log(toolPrompt);
    // console.log('--------------------------------');

    const completionProvider = new ClaudeCompletionProvider(process.env.ANTHROPIC_API_KEY as string);

    const butlerTask = new ButlerTask(completionProvider, tools);
    await butlerTask.run();
}

main().catch(console.error);

