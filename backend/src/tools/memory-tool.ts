import { Tool, ToolResult, ToolInitializationContext } from './tool';
import { getMemoryService } from '../service-locator';
import { 
  CreateMemoryOptions, 
  UpdateMemoryOptions, 
  MemorySearchCriteria, 
  MemoryType, 
  MemorySource,
  Memory,
  MemoryValidationError,
  MemoryNotFoundError
} from '../types/memory';

export const memoryTool: Tool = {
    description: {
        name: 'memoryManager',
        description: 'Manage AI memories for learning and remembering information during conversations',
        parameters: [
            {
                name: 'action',
                description: 'The memory management action to perform',
                usage: 'Action: remember, recall, update, forget, list, search, stats, clear',
                required: true,
            },
            {
                name: 'id',
                description: 'The ID of the memory (required for recall, update, forget actions)',
                usage: 'mem_1234567890_abcdef123',
                required: false,
            },
            {
                name: 'content',
                description: 'The content/text of the memory (required for remember action)',
                usage: 'User prefers dark mode themes',
                required: false,
            },
            {
                name: 'type',
                description: 'The type of memory to create or filter by',
                usage: 'fact, preference, goal, short-term, long-term',
                required: false,
            },
            {
                name: 'tags',
                description: 'Tags for categorizing memories (comma-separated)',
                usage: 'user-preference,ui,theme',
                required: false,
            },
            {
                name: 'source',
                description: 'Source of the memory',
                usage: 'user, ai, system',
                required: false,
            },
            {
                name: 'conversationId',
                description: 'ID of the conversation this memory relates to',
                usage: 'conv_1234567890',
                required: false,
            },
            {
                name: 'query',
                description: 'Search query for finding memories (for search action)',
                usage: 'dark mode preferences',
                required: false,
            },
            {
                name: 'limit',
                description: 'Maximum number of results to return',
                usage: '10',
                required: false,
            },
            {
                name: 'offset',
                description: 'Number of results to skip (for pagination)',
                usage: '0',
                required: false,
            },
            {
                name: 'metadata',
                description: 'Additional metadata as JSON string',
                usage: '{"importance": "high", "category": "user-preference"}',
                required: false,
            }
        ],
        examples: [
            {
                description: 'Remember a user preference',
                parameters: [
                    { name: 'action', value: 'remember' },
                    { name: 'content', value: 'User prefers TypeScript over JavaScript for new projects' },
                    { name: 'type', value: 'preference' },
                    { name: 'tags', value: 'programming,language-preference,typescript' },
                    { name: 'source', value: 'user' }
                ],
            },
            {
                description: 'Recall a specific memory by ID',
                parameters: [
                    { name: 'action', value: 'recall' },
                    { name: 'id', value: 'mem_1234567890_abcdef123' }
                ],
            },
            {
                description: 'Search for memories about coding preferences',
                parameters: [
                    { name: 'action', value: 'search' },
                    { name: 'query', value: 'coding preferences' },
                    { name: 'type', value: 'preference' },
                    { name: 'limit', value: '5' }
                ],
            },
            {
                description: 'List recent memories',
                parameters: [
                    { name: 'action', value: 'list' },
                    { name: 'limit', value: '10' }
                ],
            },
            {
                description: 'Update a memory',
                parameters: [
                    { name: 'action', value: 'update' },
                    { name: 'id', value: 'mem_1234567890_abcdef123' },
                    { name: 'content', value: 'Updated memory content' },
                    { name: 'tags', value: 'updated,important' }
                ],
            },
            {
                description: 'Get memory statistics',
                parameters: [
                    { name: 'action', value: 'stats' }
                ],
            },
            {
                description: 'Find memories by tags',
                parameters: [
                    { name: 'action', value: 'search' },
                    { name: 'tags', value: 'programming,typescript' },
                    { name: 'limit', value: '5' }
                ],
            }
        ],
    },

    initialize: async (context) => {
    },

    execute: async (parameters: Record<string, any>) => {
        const action = parameters.action;

        try {
            // Get the global memory service instance
            const memoryService = getMemoryService();
            
            // No need to initialize memory service here

            switch (action) {
                case 'remember':
                    return handleRemember(memoryService, parameters);

                case 'recall':
                    return handleRecall(memoryService, parameters);

                case 'update':
                    return handleUpdate(memoryService, parameters);

                case 'forget':
                    return handleForget(memoryService, parameters);

                case 'list':
                    return handleList(memoryService, parameters);

                case 'search':
                    return handleSearch(memoryService, parameters);

                case 'stats':
                    return handleStats(memoryService);

                case 'clear':
                    return handleClear(memoryService);

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Available actions: remember, recall, update, forget, list, search, stats, clear`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to execute memory action '${action}': ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
};

// Action handlers

async function handleRemember(memoryService: any, parameters: Record<string, any>) {
    if (!parameters.content) {
        return { success: false, error: 'content parameter is required for remember action' };
    }

    if (!parameters.type) {
        return { success: false, error: 'type parameter is required for remember action. Valid types: fact, preference, goal, short-term, long-term' };
    }

    // Validate memory type
    const validTypes: MemoryType[] = ['fact', 'preference', 'goal', 'short-term', 'long-term'];
    if (!validTypes.includes(parameters.type)) {
        return { 
            success: false, 
            error: `Invalid memory type: ${parameters.type}. Valid types: ${validTypes.join(', ')}` 
        };
    }

    // Parse tags from comma-separated string
    const tags = parameters.tags ? parameters.tags.split(',').map((s: string) => s.trim()) : [];

    // Parse metadata if provided
    let metadata: any = {};
    if (parameters.metadata) {
        try {
            metadata = JSON.parse(parameters.metadata);
        } catch (error) {
            return { success: false, error: 'Invalid JSON format for metadata parameter' };
        }
    }

    // Add source and conversationId to metadata if provided
    if (parameters.source) {
        const validSources: MemorySource[] = ['user', 'ai', 'system'];
        if (!validSources.includes(parameters.source)) {
            return { 
                success: false, 
                error: `Invalid source: ${parameters.source}. Valid sources: ${validSources.join(', ')}` 
            };
        }
        metadata.source = parameters.source;
    }

    if (parameters.conversationId) {
        metadata.conversationId = parameters.conversationId;
    }

    const memoryOptions: CreateMemoryOptions = {
        type: parameters.type,
        content: parameters.content,
        tags,
        metadata
    };

    try {
        const memory = await memoryService.remember(memoryOptions);
        return {
            success: true,
            result: `✅ Successfully created memory with ID: ${memory.id}\n\n📝 **Memory Details:**\n• Type: ${memory.type}\n• Content: ${memory.content}\n• Tags: ${memory.tags.join(', ')}\n• Created: ${new Date(memory.timestamp).toLocaleString()}`
        };
    } catch (error) {
        if (error instanceof MemoryValidationError) {
            return { success: false, error: `Validation error: ${error.message}` };
        }
        throw error;
    }
}

async function handleRecall(memoryService: any, parameters: Record<string, any>) {
    if (!parameters.id) {
        return { success: false, error: 'id parameter is required for recall action' };
    }

    try {
        const memory = await memoryService.recall(parameters.id);
        
        if (!memory) {
            return {
                success: false,
                error: `Memory with ID '${parameters.id}' not found`
            };
        }

        const result = formatMemoryDetails(memory);
        return { success: true, result };
    } catch (error) {
        if (error instanceof MemoryValidationError) {
            return { success: false, error: `Validation error: ${error.message}` };
        }
        throw error;
    }
}

async function handleUpdate(memoryService: any, parameters: Record<string, any>) {
    if (!parameters.id) {
        return { success: false, error: 'id parameter is required for update action' };
    }

    const updates: UpdateMemoryOptions = {};

    // Add updates based on provided parameters
    if (parameters.content) updates.content = parameters.content;
    if (parameters.type) {
        const validTypes: MemoryType[] = ['fact', 'preference', 'goal', 'short-term', 'long-term'];
        if (!validTypes.includes(parameters.type)) {
            return { 
                success: false, 
                error: `Invalid memory type: ${parameters.type}. Valid types: ${validTypes.join(', ')}` 
            };
        }
        updates.type = parameters.type;
    }
    if (parameters.tags) {
        updates.tags = parameters.tags.split(',').map((s: string) => s.trim());
    }
    if (parameters.metadata) {
        try {
            updates.metadata = JSON.parse(parameters.metadata);
        } catch (error) {
            return { success: false, error: 'Invalid JSON format for metadata parameter' };
        }
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
        return { success: false, error: 'At least one field must be provided to update (content, type, tags, metadata)' };
    }

    try {
        const updatedMemory = await memoryService.getMemoryManager().evolve(parameters.id, updates);
        
        if (!updatedMemory) {
            return {
                success: false,
                error: `Memory with ID '${parameters.id}' not found`
            };
        }

        return {
            success: true,
            result: `✅ Successfully updated memory with ID: ${parameters.id}\n\n${formatMemoryDetails(updatedMemory)}`
        };
    } catch (error) {
        if (error instanceof MemoryNotFoundError) {
            return { success: false, error: error.message };
        }
        if (error instanceof MemoryValidationError) {
            return { success: false, error: `Validation error: ${error.message}` };
        }
        throw error;
    }
}

async function handleForget(memoryService: any, parameters: Record<string, any>) {
    if (!parameters.id) {
        return { success: false, error: 'id parameter is required for forget action' };
    }

    try {
        // First get the memory to show what we're deleting
        const memory = await memoryService.recall(parameters.id);
        
        if (!memory) {
            return {
                success: false,
                error: `Memory with ID '${parameters.id}' not found`
            };
        }

        const success = await memoryService.getMemoryManager().forget(parameters.id);
        
        if (success) {
            return {
                success: true,
                result: `✅ Successfully deleted memory: "${memory.content.substring(0, 50)}${memory.content.length > 50 ? '...' : ''}" (ID: ${parameters.id})`
            };
        } else {
            return {
                success: false,
                error: `Failed to delete memory with ID '${parameters.id}'`
            };
        }
    } catch (error) {
        if (error instanceof MemoryValidationError) {
            return { success: false, error: `Validation error: ${error.message}` };
        }
        throw error;
    }
}

async function handleList(memoryService: any, parameters: Record<string, any>) {
    const limit = parameters.limit ? parseInt(parameters.limit) : 10;
    
    if (isNaN(limit) || limit < 1) {
        return { success: false, error: 'limit must be a positive number' };
    }

    try {
        const memories = await memoryService.getRecent(limit);
        
        if (memories.length === 0) {
            return {
                success: true,
                result: "📭 No memories found. Use the 'remember' action to create your first memory."
            };
        }

        let result = `📋 **Recent Memories** (${memories.length}):\n\n`;
        
        memories.forEach((memory: Memory, index: number) => {
            const preview = memory.content.length > 100 
                ? memory.content.substring(0, 100) + '...' 
                : memory.content;
            
            result += `${index + 1}. **${memory.type.toUpperCase()}** (${memory.id})\n`;
            result += `   📝 ${preview}\n`;
            result += `   🏷️ Tags: ${memory.tags.join(', ') || 'None'}\n`;
            result += `   📅 ${new Date(memory.timestamp).toLocaleString()}\n\n`;
        });
        
        return { success: true, result };
    } catch (error) {
        if (error instanceof MemoryValidationError) {
            return { success: false, error: `Validation error: ${error.message}` };
        }
        throw error;
    }
}

async function handleSearch(memoryService: any, parameters: Record<string, any>) {
    const criteria: MemorySearchCriteria = {};
    
    // Build search criteria from parameters
    if (parameters.query) criteria.content = parameters.query;
    if (parameters.type) {
        const validTypes: MemoryType[] = ['fact', 'preference', 'goal', 'short-term', 'long-term'];
        if (!validTypes.includes(parameters.type)) {
            return { 
                success: false, 
                error: `Invalid memory type: ${parameters.type}. Valid types: ${validTypes.join(', ')}` 
            };
        }
        criteria.type = parameters.type;
    }
    if (parameters.source) {
        const validSources: MemorySource[] = ['user', 'ai', 'system'];
        if (!validSources.includes(parameters.source)) {
            return { 
                success: false, 
                error: `Invalid source: ${parameters.source}. Valid sources: ${validSources.join(', ')}` 
            };
        }
        criteria.source = parameters.source;
    }
    if (parameters.conversationId) criteria.conversationId = parameters.conversationId;
    if (parameters.tags) {
        criteria.tags = parameters.tags.split(',').map((s: string) => s.trim());
    }
    if (parameters.limit) {
        const limit = parseInt(parameters.limit);
        if (isNaN(limit) || limit < 1) {
            return { success: false, error: 'limit must be a positive number' };
        }
        criteria.limit = limit;
    }
    if (parameters.offset) {
        const offset = parseInt(parameters.offset);
        if (isNaN(offset) || offset < 0) {
            return { success: false, error: 'offset must be a non-negative number' };
        }
        criteria.offset = offset;
    }

    // Check if any search criteria provided
    if (Object.keys(criteria).length === 0) {
        return { success: false, error: 'At least one search criterion must be provided (query, type, source, conversationId, tags)' };
    }

    try {
        const searchResult = await memoryService.search(criteria);
        
        if (searchResult.memories.length === 0) {
            return {
                success: true,
                result: `No memories found matching the search criteria.`
            };
        }

        let result = `🔍 **Search Results** (${searchResult.memories.length} of ${searchResult.total}):\n\n`;
        
        searchResult.memories.forEach((memory: Memory, index: number) => {
            const preview = memory.content.length > 100 
                ? memory.content.substring(0, 100) + '...' 
                : memory.content;
            
            result += `${index + 1}. **${memory.type.toUpperCase()}** (${memory.id})\n`;
            result += `   📝 ${preview}\n`;
            result += `   🏷️ Tags: ${memory.tags.join(', ') || 'None'}\n`;
            result += `   📅 ${new Date(memory.timestamp).toLocaleString()}\n\n`;
        });
        
        return { success: true, result };
    } catch (error) {
        if (error instanceof MemoryValidationError) {
            return { success: false, error: `Validation error: ${error.message}` };
        }
        throw error;
    }
}

async function handleStats(memoryService: any) {
    try {
        const stats = await memoryService.getStats();
        
        let result = `📊 **Memory Statistics**\n\n`;
        result += `📈 **Total Memories:** ${stats.total}\n\n`;
        
        if (stats.total > 0) {
            result += `📋 **By Type:**\n`;
            Object.entries(stats.byType).forEach(([type, count]) => {
                result += `• ${type}: ${count}\n`;
            });
            
            result += `\n👤 **By Source:**\n`;
            Object.entries(stats.bySource).forEach(([source, count]) => {
                result += `• ${source}: ${count}\n`;
            });
            
            if (stats.topTags.length > 0) {
                result += `\n🏷️ **Top Tags:**\n`;
                stats.topTags.slice(0, 10).forEach(({ tag, count }: { tag: string; count: number }) => {
                    result += `• ${tag}: ${count}\n`;
                });
            }
            
            if (stats.oldestMemory && stats.newestMemory) {
                result += `\n📅 **Timeline:**\n`;
                result += `• Oldest: ${new Date(stats.oldestMemory).toLocaleString()}\n`;
                result += `• Newest: ${new Date(stats.newestMemory).toLocaleString()}\n`;
            }
        }
        
        return { success: true, result };
    } catch (error) {
        throw error;
    }
}

async function handleClear(memoryService: any) {
    try {
        // Get current stats before clearing
        const stats = await memoryService.getStats();
        
        if (stats.total === 0) {
            return {
                success: true,
                result: "📭 No memories to clear. Memory bank is already empty."
            };
        }

        // Reset all memories
        await memoryService.resetMemories();
        
        return {
            success: true,
            result: `✅ Successfully cleared all memories. Deleted ${stats.total} memories from the memory bank.`
        };
    } catch (error) {
        throw error;
    }
}

// Utility function to format memory details
function formatMemoryDetails(memory: Memory): string {
    return `📝 **Memory Details**

**ID:** ${memory.id}
**Type:** ${memory.type.toUpperCase()}
**Content:** ${memory.content}

**Metadata:**
• Source: ${memory.metadata.source}
• Conversation ID: ${memory.metadata.conversationId || 'None'}
• Created: ${new Date(memory.timestamp).toLocaleString()}
• Last Accessed: ${new Date(memory.lastAccessed).toLocaleString()}

**Tags:** ${memory.tags.join(', ') || 'None'}

**Additional Metadata:**
${Object.entries(memory.metadata)
    .filter(([key]) => !['source', 'conversationId'].includes(key))
    .map(([key, value]) => `• ${key}: ${JSON.stringify(value)}`)
    .join('\n') || 'None'}`;
}