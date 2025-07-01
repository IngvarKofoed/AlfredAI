import { Command, CommandSchema } from '../types/command';
import { getAllTools } from '../tools';
import { getMemoryService } from '../service-locator';
import { getConversationHistoryService } from '../service-locator';

/**
 * Status command that displays system status information.
 * 
 * This command retrieves various system status information including
 * conversation history, memory system status, and available tools.
 */
export class StatusCommand implements Command {
    name = 'status';
    description = 'Show system status';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        return null;
    }

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            let memoryStatus = 'Not initialized';
            
            try {
                const memoryService = getMemoryService();
                const stats = await memoryService.getInjectionStats();
                memoryStatus = `${stats.enabled ? 'Enabled' : 'Disabled'} (${stats.memoryStats.total} memories)`;
            } catch (error) {
                memoryStatus = 'Error loading';
            }
            
            const statusText = `System Status:
• Conversation: ${(await getConversationHistoryService().getConversationList()).length} conversations
• Connection: Active WebSocket
• Model: Claude (Anthropic)
• Tools: ${getAllTools().length} available
• MCP: Ready for external servers
• Memory System: ${memoryStatus}`;
            
            return statusText;
        } catch (error: any) {
            throw new Error(`Failed to get system status: ${error.message}`);
        }
    }
} 