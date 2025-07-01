import { Command, CommandSchema } from '../../types/command';
import { getPersonalityService } from '../../service-locator';
import { getDefaultPersonality } from '../../prompts/create-personality-prompt';

/**
 * Personality command that manages AI personalities.
 * 
 * This command handles listing, activating, deactivating, and managing
 * AI personalities in the system.
 */
export class PersonalityCommand implements Command {
    name = 'personalities';
    description = 'List and manage AI personalities';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        return null;
    }

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const { action, name, id } = args || {};
            
            // Handle different actions
            switch (action?.toLowerCase()) {
                case 'activate':
                    return this.activatePersonality(name || id);
                case 'deactivate':
                    return this.deactivatePersonality();
                case 'list':
                case undefined:
                    return this.listPersonalities();
                case 'create':
                    return this.createPersonality(args || {});
                case 'delete':
                    return this.deletePersonality(name || id);
                case 'info':
                    return this.getPersonalityInfo(name || id);
                default:
                    return this.showHelp();
            }
        } catch (error: any) {
            throw new Error(`Personality command failed: ${error.message}`);
        }
    }

    private async listPersonalities(): Promise<string> {
        const personalityService = getPersonalityService();
        const allPersonalities = personalityService.getAllPersonalities();
        const activePersonality = personalityService.getActivePersonality();
        const presets = personalityService.getPresets();
        
        let personalitiesText = `🎭 AI Personalities:\n\n`;
        
        // Show active personality
        if (activePersonality) {
            personalitiesText += `**Currently Active:** ${activePersonality.name} ⭐\n`;
            personalitiesText += `• ${activePersonality.description}\n`;
            personalitiesText += `• Tone: ${activePersonality.tone}, Style: ${activePersonality.communicationStyle}\n`;
            if (activePersonality.preferredProvider) {
                personalitiesText += `• Preferred Provider: ${activePersonality.preferredProvider}\n`;
            }
            personalitiesText += `\n`;
        } else {
            const defaultPersonality = getDefaultPersonality();
            personalitiesText += `**Currently Active:** ${defaultPersonality.name}\n`;
            personalitiesText += `• ${defaultPersonality.description}\n`;
            personalitiesText += `• Tone: ${defaultPersonality.tone}, Style: ${defaultPersonality.communicationStyle}\n\n`;
        }
        
        // Show custom personalities
        const customPersonalities = Object.values(allPersonalities);
        if (customPersonalities.length > 0) {
            personalitiesText += `**Your Custom Personalities (${customPersonalities.length}):**\n`;
            customPersonalities.forEach((personality, index) => {
                const isActive = activePersonality?.id === personality.id;
                personalitiesText += `${index + 1}. **${personality.name}** ${isActive ? '⭐' : ''}\n`;
                personalitiesText += `   • ${personality.description}\n`;
                personalitiesText += `   • ${personality.tone} tone, ${personality.communicationStyle} style\n`;
                if (personality.expertise.length > 0) {
                    personalitiesText += `   • Expertise: ${personality.expertise.slice(0, 3).join(', ')}${personality.expertise.length > 3 ? '...' : ''}\n`;
                }
                if (personality.preferredProvider) {
                    personalitiesText += `   • Provider: ${personality.preferredProvider}\n`;
                }
                personalitiesText += `\n`;
            });
        }
        
        // Show available presets
        personalitiesText += `**Available Presets (${presets.length}):**\n`;
        presets.forEach((preset, index) => {
            personalitiesText += `${index + 1}. **${preset.name}**\n`;
            personalitiesText += `   • ${preset.description}\n`;
            personalitiesText += `   • ${preset.personality.tone} tone, ${preset.personality.communicationStyle} style\n\n`;
        });
        
        personalitiesText += `**Quick Actions:**\n`;
        personalitiesText += `• /personalities activate <name> - Activate a personality\n`;
        personalitiesText += `• /personalities deactivate - Deactivate current personality\n`;
        personalitiesText += `• /personalities create from <preset> - Create from preset\n`;
        personalitiesText += `• /personalities info <name> - Show personality details\n`;
        personalitiesText += `• /personalities delete <name> - Delete a personality`;
        
        return personalitiesText;
    }

    private async activatePersonality(identifier: string): Promise<string> {
        if (!identifier) {
            throw new Error('Personality name or ID is required');
        }

        const personalityService = getPersonalityService();
        
        // Try to find by name first
        const allPersonalities = personalityService.getAllPersonalities();
        const personality = Object.values(allPersonalities).find(p => 
            p.name.toLowerCase() === identifier.toLowerCase()
        ) || allPersonalities[identifier];

        if (!personality) {
            throw new Error(`Personality "${identifier}" not found`);
        }

        const success = personalityService.setActivePersonality(personality.id);
        if (!success) {
            throw new Error(`Failed to activate personality "${personality.name}"`);
        }

        return `✅ Activated personality: **${personality.name}**\n\n` +
               `• ${personality.description}\n` +
               `• Tone: ${personality.tone}, Style: ${personality.communicationStyle}\n` +
               (personality.preferredProvider ? `• Provider: ${personality.preferredProvider}\n` : '');
    }

    private async deactivatePersonality(): Promise<string> {
        const personalityService = getPersonalityService();
        const activePersonality = personalityService.getActivePersonality();
        
        if (!activePersonality) {
            return `ℹ️ No active personality to deactivate. Using default personality.`;
        }

        personalityService.clearActivePersonality();
        return `✅ Deactivated personality: **${activePersonality.name}**\n\nNow using default personality.`;
    }

    private async createPersonality(args: Record<string, any>): Promise<string> {
        const { from, name, description, tone, style, expertise, provider } = args;
        
        if (from) {
            // Create from preset
            const personalityService = getPersonalityService();
            const presets = personalityService.getPresets();
            const preset = presets.find(p => p.name.toLowerCase() === from.toLowerCase());
            
            if (!preset) {
                throw new Error(`Preset "${from}" not found. Available presets: ${presets.map(p => p.name).join(', ')}`);
            }

            const customizations: any = {};
            if (name) customizations.name = name;
            if (description) customizations.description = description;
            if (tone) customizations.tone = tone;
            if (style) customizations.communicationStyle = style;
            if (expertise) customizations.expertise = expertise.split(',').map((e: string) => e.trim());
            if (provider) customizations.preferredProvider = provider;

            const id = personalityService.createPersonalityFromPreset(preset.name, customizations);
            if (!id) {
                throw new Error(`Failed to create personality from preset "${from}"`);
            }

            const newPersonality = personalityService.getPersonality(id);
            return `✅ Created personality from preset: **${newPersonality?.name}**\n\n` +
                   `• ${newPersonality?.description}\n` +
                   `• Tone: ${newPersonality?.tone}, Style: ${newPersonality?.communicationStyle}`;
        } else {
            throw new Error('Creating custom personalities requires more parameters. Use "from <preset>" to create from a preset.');
        }
    }

    private async deletePersonality(identifier: string): Promise<string> {
        if (!identifier) {
            throw new Error('Personality name or ID is required');
        }

        const personalityService = getPersonalityService();
        const allPersonalities = personalityService.getAllPersonalities();
        
        // Try to find by name first
        const personality = Object.values(allPersonalities).find(p => 
            p.name.toLowerCase() === identifier.toLowerCase()
        ) || allPersonalities[identifier];

        if (!personality) {
            throw new Error(`Personality "${identifier}" not found`);
        }

        const success = personalityService.deletePersonality(personality.id);
        if (!success) {
            throw new Error(`Failed to delete personality "${personality.name}"`);
        }

        return `✅ Deleted personality: **${personality.name}**`;
    }

    private async getPersonalityInfo(identifier: string): Promise<string> {
        if (!identifier) {
            throw new Error('Personality name or ID is required');
        }

        const personalityService = getPersonalityService();
        const allPersonalities = personalityService.getAllPersonalities();
        
        // Try to find by name first
        const personality = Object.values(allPersonalities).find(p => 
            p.name.toLowerCase() === identifier.toLowerCase()
        ) || allPersonalities[identifier];

        if (!personality) {
            throw new Error(`Personality "${identifier}" not found`);
        }

        const activePersonality = personalityService.getActivePersonality();
        const isActive = activePersonality?.id === personality.id;

        let info = `🎭 **${personality.name}** ${isActive ? '⭐ (Active)' : ''}\n\n`;
        info += `**Description:** ${personality.description}\n\n`;
        info += `**Communication:**\n`;
        info += `• Tone: ${personality.tone}\n`;
        info += `• Style: ${personality.communicationStyle}\n`;
        info += `• Verbosity: ${personality.verbosity}\n`;
        info += `• Formality: ${personality.formality}\n`;
        info += `• Creativity: ${personality.creativity}\n\n`;
        
        if (personality.expertise.length > 0) {
            info += `**Expertise:** ${personality.expertise.join(', ')}\n\n`;
        }
        
        if (personality.tags.length > 0) {
            info += `**Tags:** ${personality.tags.join(', ')}\n\n`;
        }
        
        if (personality.preferredProvider) {
            info += `**Preferred Provider:** ${personality.preferredProvider}\n\n`;
        }
        
        info += `**Metadata:**\n`;
        info += `• Created: ${new Date(personality.createdAt).toLocaleDateString()}\n`;
        info += `• Updated: ${new Date(personality.updatedAt).toLocaleDateString()}\n`;
        info += `• Version: ${personality.version}\n`;
        info += `• Author: ${personality.author}`;

        return info;
    }

    private showHelp(): Promise<string> {
        const help = `🎭 **Personality Command Help**\n\n` +
                    `**Available Actions:**\n` +
                    `• \`/personalities\` or \`/personalities list\` - List all personalities\n` +
                    `• \`/personalities activate <name>\` - Activate a personality\n` +
                    `• \`/personalities deactivate\` - Deactivate current personality\n` +
                    `• \`/personalities create from <preset>\` - Create from preset\n` +
                    `• \`/personalities info <name>\` - Show personality details\n` +
                    `• \`/personalities delete <name>\` - Delete a personality\n\n` +
                    `**Examples:**\n` +
                    `• \`/personalities activate "Creative Collaborator"\`\n` +
                    `• \`/personalities create from "Friendly Coding Buddy" name="My Coder"\`\n` +
                    `• \`/personalities info "Professional Assistant"\`\n` +
                    `• \`/personalities delete "Old Personality"\``;
        
        return Promise.resolve(help);
    }
} 