import 'dotenv/config';
import { ClaudeCompletionProvider } from './completion/completion-providers/claude-completion-provider';
import { ButlerTask } from './tasks/butlerTask';

async function main() {
    const completionProvider = new ClaudeCompletionProvider(process.env.ANTHROPIC_API_KEY as string);

    const butlerTask = new ButlerTask(completionProvider);
    await butlerTask.run();
}

main().catch(console.error);

