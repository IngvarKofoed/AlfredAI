import { Command, CommandSchema } from '../types/command';
import { getConversationHistoryService } from '../service-locator';

/**
 * Clear command that resets the current conversation.
 * 
 * This command clears the current active conversation by setting it to undefined,
 * effectively starting fresh for the next interaction.
 */
export class ClearCommand implements Command {
    name = 'clear';
    description = 'Clear the current conversation';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        return null;
    }

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const historyService = getConversationHistoryService();
            
            // Get current conversation before clearing
            const currentConversation = historyService.getCurrentConversation();
            
            // Clear the current conversation
            historyService.clearCurrentConversation();
            
            if (currentConversation) {
                return `Current conversation "${currentConversation.title}" cleared. Ready for a new conversation.`;
            } else {
                return 'No active conversation to clear. Ready for a new conversation.';
            }
        } catch (error: any) {
            throw new Error(`Failed to clear conversation: ${error.message}`);
        }
    }
}
