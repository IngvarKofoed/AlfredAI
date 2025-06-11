/**
 * Memory System Integration Example
 * 
 * This file demonstrates how to integrate the memory system with completion providers
 * to enable AI conversations with memory context.
 */

import { MemoryService, initializeMemoryService } from './memory-service';
import { ProviderFactory, ProviderType } from '../completion/provider-factory';
import { createSystemPrompt } from '../prompts/create-system-prompt';
import { Message } from '../types/core';
import { Tool } from '../tools/tool';
import { logger } from '../utils/logger';

/**
 * Example of how to set up and use the memory-enabled AI system
 */
export class MemoryEnabledAI {
  private memoryService: MemoryService;
  private completionProvider: any;
  private tools: Tool[];

  constructor(providerType: ProviderType = 'claude', tools: Tool[] = []) {
    this.tools = tools;
    this.memoryService = new MemoryService({
      storeConfig: {
        memoryDir: './memory-data',
        format: 'json',
        backup: true
      },
      injectionConfig: {
        enabled: true,
        maxMemories: 10,
        relevanceThreshold: 0.3,
        memoryTypes: ['fact', 'preference', 'goal', 'long-term'],
        useConversationContext: true
      },
      autoInitialize: false // We'll initialize manually
    });

    // Create completion provider with memory injector
    this.completionProvider = ProviderFactory.createFromEnv(
      providerType,
      this.memoryService.getMemoryInjector()
    );
  }

  /**
   * Initialize the memory-enabled AI system
   */
  async initialize(): Promise<void> {
    await this.memoryService.initialize();
    logger.info('Memory-enabled AI system initialized');
  }

  /**
   * Generate a response with memory context
   */
  async generateResponse(conversation: Message[]): Promise<string> {
    try {
      // Create system prompt (memory will be injected automatically by the completion provider)
      const systemPrompt = createSystemPrompt(this.tools);

      // Generate response using completion provider (with automatic memory injection)
      const response = await this.completionProvider.generateText(systemPrompt, conversation);

      // Optionally, extract and store new memories from the conversation
      await this.extractAndStoreMemories(conversation, response);

      return response;
    } catch (error) {
      logger.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Manually add a memory
   */
  async addMemory(content: string, type: 'fact' | 'preference' | 'goal' | 'short-term' | 'long-term' = 'fact', tags: string[] = []): Promise<void> {
    await this.memoryService.remember({
      type,
      content,
      tags,
      metadata: {
        source: 'user'
      }
    });
    logger.info(`Added memory: ${content}`);
  }

  /**
   * Search memories
   */
  async searchMemories(query: string, limit: number = 5) {
    return await this.memoryService.search({
      content: query,
      limit
    });
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    return await this.memoryService.getStats();
  }

  /**
   * Extract and store memories from conversation
   */
  private async extractAndStoreMemories(conversation: Message[], response: string): Promise<void> {
    try {
      // Simple heuristic-based memory extraction
      // In a real implementation, you might use NLP or AI to extract memories
      
      const lastUserMessage = conversation.filter(msg => msg.role === 'user').pop();
      if (!lastUserMessage) return;

      const userContent = lastUserMessage.content.toLowerCase();

      // Extract preferences
      if (userContent.includes('i like') || userContent.includes('i prefer') || userContent.includes('i love')) {
        const preferenceMatch = userContent.match(/i (like|prefer|love) (.+)/);
        if (preferenceMatch) {
          await this.memoryService.rememberFromConversation(
            `User ${preferenceMatch[1]}s ${preferenceMatch[2]}`,
            conversation,
            {
              type: 'preference',
              tags: ['preference', 'extracted']
            }
          );
        }
      }

      // Extract facts
      if (userContent.includes('my name is') || userContent.includes('i am')) {
        const factMatch = userContent.match(/my name is (.+)|i am (.+)/);
        if (factMatch) {
          const fact = factMatch[1] || factMatch[2];
          await this.memoryService.rememberFromConversation(
            `User's name is ${fact}` || `User is ${fact}`,
            conversation,
            {
              type: 'fact',
              tags: ['identity', 'extracted']
            }
          );
        }
      }

      // Extract goals
      if (userContent.includes('i want to') || userContent.includes('i need to') || userContent.includes('my goal is')) {
        const goalMatch = userContent.match(/i want to (.+)|i need to (.+)|my goal is (.+)/);
        if (goalMatch) {
          const goal = goalMatch[1] || goalMatch[2] || goalMatch[3];
          await this.memoryService.rememberFromConversation(
            `User wants to ${goal}`,
            conversation,
            {
              type: 'goal',
              tags: ['goal', 'extracted']
            }
          );
        }
      }

    } catch (error) {
      logger.warn('Error extracting memories:', error);
    }
  }

  /**
   * Enable or disable memory injection
   */
  async setMemoryInjectionEnabled(enabled: boolean): Promise<void> {
    await this.memoryService.updateInjectionConfig({ enabled });
    logger.info(`Memory injection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update memory injection configuration
   */
  async updateMemoryConfig(config: {
    maxMemories?: number;
    relevanceThreshold?: number;
    memoryTypes?: Array<'fact' | 'preference' | 'goal' | 'short-term' | 'long-term'>;
  }): Promise<void> {
    await this.memoryService.updateInjectionConfig(config);
    logger.info('Memory injection configuration updated');
  }

  /**
   * Close the system
   */
  async close(): Promise<void> {
    await this.memoryService.close();
    logger.info('Memory-enabled AI system closed');
  }
}

/**
 * Example usage function
 */
export async function exampleUsage(): Promise<void> {
  // Create memory-enabled AI
  const ai = new MemoryEnabledAI('claude', []);
  
  try {
    // Initialize
    await ai.initialize();

    // Add some initial memories
    await ai.addMemory("User is a software developer", 'fact', ['profession']);
    await ai.addMemory("User prefers TypeScript over JavaScript", 'preference', ['programming']);
    await ai.addMemory("User wants to learn about AI and machine learning", 'goal', ['learning']);

    // Simulate a conversation
    const conversation: Message[] = [
      {
        role: 'user',
        content: 'Hi, I need help with a TypeScript project. Can you help me?'
      }
    ];

    // Generate response (memory will be automatically injected)
    const response = await ai.generateResponse(conversation);
    console.log('AI Response:', response);

    // Add the AI response to conversation
    conversation.push({
      role: 'assistant',
      content: response
    });

    // Continue conversation
    conversation.push({
      role: 'user',
      content: 'I want to build a web application using React and TypeScript.'
    });

    const response2 = await ai.generateResponse(conversation);
    console.log('AI Response 2:', response2);

    // Check memory stats
    const stats = await ai.getMemoryStats();
    console.log('Memory Stats:', stats);

    // Search memories
    const searchResults = await ai.searchMemories('TypeScript');
    console.log('Search Results:', searchResults);

  } finally {
    // Clean up
    await ai.close();
  }
}

/**
 * Simple integration helper for existing systems
 */
export async function createMemoryEnabledProvider(providerType: ProviderType = 'claude') {
  // Initialize memory service
  const memoryService = await initializeMemoryService({
    storeConfig: {
      memoryDir: './memory-data',
      format: 'json',
      backup: true
    },
    injectionConfig: {
      enabled: true,
      maxMemories: 8,
      relevanceThreshold: 0.4,
      memoryTypes: ['fact', 'preference', 'goal', 'long-term']
    }
  });

  // Create provider with memory injection
  const provider = ProviderFactory.createFromEnv(providerType, memoryService.getMemoryInjector());

  return {
    provider,
    memoryService,
    async generateWithMemory(systemPrompt: string, conversation: Message[]): Promise<string> {
      return await provider.generateText(systemPrompt, conversation);
    },
    async addMemory(content: string, type: 'fact' | 'preference' | 'goal' | 'short-term' | 'long-term' = 'fact', tags: string[] = []) {
      return await memoryService.remember({ type, content, tags, metadata: { source: 'user' } });
    },
    async close() {
      await memoryService.close();
    }
  };
}

// Export for easy testing
if (require.main === module) {
  exampleUsage().catch(console.error);
}