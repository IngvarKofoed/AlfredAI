import { Command } from '../types/command';
import { Message } from '../types';
import { getConversationHistoryService } from '../service-locator';
import { Conversation } from './conversation-history-service';

/**
 * History command that displays the conversation history.
 * 
 * This command retrieves the current conversation from the service
 * and formats it into a user-friendly display.
 */
export class HistoryCommand implements Command {
    name = 'history';
    description = 'Show conversation history';

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const historyService = getConversationHistoryService();
            const currentConversation = historyService.getCurrentConversation();
            
            if (!currentConversation) {
                return 'No active conversation. Start a new conversation by sending a message.';
            }
            
            // Generate text version of the conversation
            const conversationText = this.formatConversation(currentConversation);
            
            const historyText = `Current Conversation: ${currentConversation.title}

${conversationText}

Conversation started: ${currentConversation.createdAt.toLocaleString()}
Last updated: ${currentConversation.updatedAt.toLocaleString()}`;
            
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