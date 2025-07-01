import { Command, CommandSchema } from '../types/command';
import { getMemoryService } from '../service-locator';
import { Memory } from '../types/memory';

/**
 * Memory command that displays memory system status and statistics.
 * 
 * This command retrieves memory system information including injection status,
 * evaluator status, memory statistics, recent memories, and configuration.
 */
export class MemoryCommand implements Command {
    name = 'memory';
    description = 'Show memory system status and statistics';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        return null;
    }

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const memoryService = getMemoryService();
            const stats = await memoryService.getInjectionStats();
            const recentMemories = await memoryService.getRecent(5);
            const evaluatorStats = await memoryService.getEvaluatorStats();
            
            let memoryText = `🧠 Memory System Status:\n\n`;
            memoryText += `**Memory Injection:** ${stats.enabled ? '🟢 Enabled' : '🔴 Disabled'}\n`;
            memoryText += `**Memory Evaluator:** ${evaluatorStats?.enabled ? '🟢 Enabled' : '🔴 Disabled'}\n`;
            memoryText += `**Total Memories:** ${stats.memoryStats.total}\n`;
            
            if (evaluatorStats?.enabled) {
                memoryText += `**Auto-Generated Memories:** ${evaluatorStats.totalAutoMemories || 0}\n`;
                memoryText += `**Recent Auto Memories (24h):** ${evaluatorStats.recentAutoMemories || 0}\n`;
            }
            
            memoryText += `**Memory Types:**\n`;
            memoryText += `• Facts: ${stats.memoryStats.byType.fact || 0}\n`;
            memoryText += `• Preferences: ${stats.memoryStats.byType.preference || 0}\n`;
            memoryText += `• Goals: ${stats.memoryStats.byType.goal || 0}\n`;
            memoryText += `• Short-term: ${stats.memoryStats.byType['short-term'] || 0}\n`;
            memoryText += `• Long-term: ${stats.memoryStats.byType['long-term'] || 0}\n\n`;
            
            if (recentMemories.length > 0) {
                memoryText += `**Recent Memories (${recentMemories.length}):**\n`;
                recentMemories.forEach((memory: Memory, index: number) => {
                    const preview = memory.content.length > 60 ? memory.content.substring(0, 60) + '...' : memory.content;
                    memoryText += `${index + 1}. [${memory.type.toUpperCase()}] ${preview}\n`;
                });
            } else {
                memoryText += `**Recent Memories:** None yet\n`;
            }
            
            memoryText += `\n**Configuration:**\n`;
            memoryText += `• Max memories per injection: ${stats.config.maxMemories}\n`;
            memoryText += `• Relevance threshold: ${stats.config.relevanceThreshold}\n`;
            memoryText += `• Memory types: ${stats.config.memoryTypes.join(', ')}\n`;
            memoryText += `• Use conversation context: ${stats.config.useConversationContext}\n\n`;
            memoryText += `💡 Use the memory tool to create, search, and manage memories!`;
            
            return memoryText;
        } catch (error: any) {
            throw new Error(`Failed to access memory system: ${error.message}`);
        }
    }
} 