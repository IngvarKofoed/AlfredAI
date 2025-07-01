import { Command } from '../types/command';
import { Message } from '../types';
import { getConversationHistoryService } from '../service-locator';
import { Conversation } from '../conversation-history/conversation-history-service';

/**
 * History command that displays the conversation history.
 * 
 * This command retrieves the conversation history from the client
 * and formats it into a user-friendly display.
 */
export class HistoryCommand implements Command {
    name = 'history';
    description = 'Show conversation history';

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const historyService = getConversationHistoryService();
            const conversationList = await historyService.getConversationList();
            
            if (conversationList.length === 0) {
                return 'No conversation history yet.';
            }
            
            // Get the newest conversation (first in the list since it's sorted by most recent)
            const newestConversationSummary = conversationList[0];
            const newestConversation = await historyService.getConversation(newestConversationSummary.id);
            
            if (!newestConversation) {
                return 'Failed to load the most recent conversation.';
            }
            
            // Generate text version of the conversation
            const conversationText = this.formatConversation(newestConversation);
            
            const historyText = `Latest Conversation: ${newestConversation.title}

${conversationText}

Total conversations: ${conversationList.length}`;
            
            return historyText;
        } catch (error: any) {
            throw new Error(`Failed to retrieve conversation history: ${error.message}`);
        }
    }

    /**
     * Formats a conversation into a readable text format
     */
    private formatConversation(conversation: Conversation): string {
        if (conversation.messages.length === 0) {
            return 'No messages in this conversation.';
        }

        const formattedMessages = conversation.messages.map((message, index) => {
            const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
            const content = message.content.trim();
            return `${index + 1}. ${role}:\n${content}\n`;
        });

        return formattedMessages.join('\n');
    }
} 