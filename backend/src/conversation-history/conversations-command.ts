import { Command, CommandSchema } from '../types/command';
import { getConversationHistoryService } from '../service-locator';
import { Conversation } from './conversation-history-service';

/**
 * Conversations command that lists all existing conversations and allows selecting one.
 * 
 * This command retrieves all conversations from the service and displays them
 * in a numbered list. When an ID is provided, it sets that conversation as current.
 */
export class ConversationsCommand implements Command {
    name = 'conversations';
    description = 'List all conversations or select one from dropdown';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        try {
            const historyService = getConversationHistoryService();
            const conversations = await historyService.getConversationList();
            
            if (conversations.length === 0) {
                return null; // No schema needed if no conversations exist
            }

            const choices = conversations.map((conv: any, index: number) => {
                const isCurrent = historyService.getCurrentConversation()?.id === conv.id;
                const currentIndicator = isCurrent ? ' (current)' : '';
                const date = conv.updatedAt.toLocaleDateString();
                const time = conv.updatedAt.toLocaleTimeString();
                
                return {
                    label: `${index + 1}. ${conv.title}${currentIndicator} - ${date} ${time} (${conv.messageCount} messages)`,
                    value: conv.id,
                    description: `Created: ${conv.createdAt.toLocaleString()}`
                };
            });

            return {
                options: [
                    {
                        name: 'select',
                        description: 'Select a conversation to set as current',
                        type: 'select',
                        choices: choices
                    }
                ]
            };
        } catch (error) {
            return null; // Return null if there's an error getting conversations
        }
    }

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const historyService = getConversationHistoryService();
            const selectedConversationId = args?.select;

            if (selectedConversationId) {
                // User selected a conversation from the dropdown
                return await this.selectConversation(historyService, selectedConversationId);
            } else {
                // User wants to see all conversations
                return await this.listConversations(historyService);
            }
        } catch (error: any) {
            throw new Error(`Failed to handle conversations command: ${error.message}`);
        }
    }

    /**
     * Lists all available conversations
     */
    private async listConversations(historyService: any): Promise<string> {
        const conversations = await historyService.getConversationList();
        const currentConversation = historyService.getCurrentConversation();

        if (conversations.length === 0) {
            return 'No conversations found. Start a new conversation by sending a message.';
        }

        const conversationList = conversations.map((conv: any, index: number) => {
            const isCurrent = currentConversation && currentConversation.id === conv.id;
            const currentIndicator = isCurrent ? ' (current)' : '';
            const date = conv.updatedAt.toLocaleDateString();
            const time = conv.updatedAt.toLocaleTimeString();
            
            return `${index + 1}. [${conv.id}] ${conv.title}${currentIndicator}
   📅 ${date} ${time} | 💬 ${conv.messageCount} messages`;
        }).join('\n\n');

        const instructions = `
To select a conversation, use the --select option to choose from the dropdown menu.

Example: conversations --select`;

        return `Available Conversations:\n\n${conversationList}\n\n${instructions}`;
    }

    /**
     * Selects and sets a conversation as current
     */
    private async selectConversation(historyService: any, conversationId: string): Promise<string> {
        const conversation = await historyService.getConversation(conversationId);
        
        if (!conversation) {
            return `Conversation with ID "${conversationId}" not found. Use 'conversations' to see available conversations.`;
        }

        // Set as current conversation
        historyService.setCurrentConversation(conversation);

        const messageCount = conversation.messages.length;
        const lastUpdated = conversation.updatedAt.toLocaleString();

        return `✅ Selected conversation: "${conversation.title}"
📅 Created: ${conversation.createdAt.toLocaleString()}
🕒 Last updated: ${lastUpdated}
💬 Messages: ${messageCount}

Use 'history' to view the conversation content.`;
    }
}
