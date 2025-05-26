import { LargeLanguageModel, ClaudeLargeLanguageModel } from './large-language-models'
import { serviceLocator } from './serviceLocator';
import { ServiceIdentifiers } from './ServiceIdentifiers';


export function configureServices() {
    // Register the Claude LLM as a singleton
    serviceLocator.registerSingleton<LargeLanguageModel>(
        ServiceIdentifiers.LLM,
        (locator) => {
            const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
            if (!anthropicApiKey) {
                throw new Error('ANTHROPIC_API_KEY is not set');
            }

            return new ClaudeLargeLanguageModel(anthropicApiKey);
        }
    );
}
