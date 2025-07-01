import { Command } from '../../types/command';
import { getPersonalityService } from '../../service-locator';
import { ProviderType } from '../../completion/provider-factory';

/**
 * Provider command that displays information about the current AI provider configuration.
 * 
 * This command shows the active AI provider, supported providers, current personality,
 * and instructions for changing the provider.
 */
export class ProviderCommand implements Command {
    name = 'provider';
    description = 'Show current AI provider and personality configuration';

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const activePersonality = getPersonalityService().getActivePersonality();
            let providerInfo = `AI Provider Status:\n\n`;
            
            if (activePersonality?.preferredProvider) {
                providerInfo += `**Active Provider:** ${activePersonality.preferredProvider} (from personality: ${activePersonality.name})\n`;
            } else {
                const envProvider = (process.env.AI_PROVIDER as ProviderType) || 'claude';
                providerInfo += `**Active Provider:** ${envProvider} (from environment/default)\n`;
            }
            
            providerInfo += `**Supported Providers:** claude, openai, gemini, openrouter\n\n`;
            providerInfo += `**Current Personality:** ${activePersonality ? activePersonality.name : 'None (using default behavior)'}\n\n`;
            providerInfo += `To change provider: Use the personality tool to create/update personalities with preferredProvider setting.`;
            
            return providerInfo;
        } catch (error: any) {
            throw new Error(`Failed to get provider status: ${error.message}`);
        }
    }
} 