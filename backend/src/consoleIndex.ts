import 'dotenv/config';
import { configureServices } from './configureServices';
import { resolveServiceSync } from './serviceLocator';
import { LargeLanguageModel, Message } from './large-language-models';
import { ServiceIdentifiers } from './ServiceIdentifiers';

configureServices();

async function main() {
    const llm = resolveServiceSync<LargeLanguageModel>(ServiceIdentifiers.LLM);

    const conversation: Message[] = [
        { role: 'user', content: 'Hello, how are you?' },
    ];

    const responses = await llm.generateText(conversation);

    console.log(responses);
}

main().catch(console.error);

