/**
 * Memory Service Implementation
 * 
 * This file provides a high-level service that combines the memory manager
 * and memory injector to provide a complete memory system for the AI.
 */

import { MemoryManager } from './memory-manager';
import { MemoryInjector, MemoryInjectionConfig, DEFAULT_MEMORY_CONFIG } from './memory-injector';
import { MemoryEvaluator, AutoMemoryConfig, DEFAULT_AUTO_MEMORY_CONFIG } from './memory-evaluator';
import { FileMemoryStore } from './file-memory-store';
import { MemoryConfigManager, MemoryConfig } from './memory-config-manager';
import { Memory, CreateMemoryOptions, MemorySearchCriteria, MemorySearchResult, MemoryStats } from '../types/memory';
import { Message } from '../types/core';
import { CompletionProvider } from '../completion/completion-provider';
import { logger } from '../utils/logger';
import { getWorkingDirectory } from '../utils/get-working-directory';
import { Service } from '../types/service';
import { getCommandService, getPersonalityService } from '../service-locator';
import { MemoryCommand } from './memory-command';
import { ProviderFactory } from '../completion/provider-factory';

/**
 * Configuration for the memory service
 */
export interface MemoryServiceConfig {
  /** Memory store configuration */
  storeConfig?: {
    memoryDir?: string;
    format?: 'json' | 'yaml';
    backup?: boolean;
  };
  /** Memory injection configuration */
  injectionConfig?: Partial<MemoryInjectionConfig>;
  /** Memory evaluator configuration */
  evaluatorConfig?: Partial<AutoMemoryConfig>;
  /** Completion provider for memory evaluator */
  completionProvider?: CompletionProvider;
}

/**
 * Default memory service configuration
 */
export const DEFAULT_SERVICE_CONFIG: MemoryServiceConfig = {
  storeConfig: {
    memoryDir: getWorkingDirectory('memory'),
    format: 'json',
    backup: true
  },
  injectionConfig: DEFAULT_MEMORY_CONFIG,
};

/**
 * Memory Service class that provides a complete memory system
 */
export class MemoryService implements Service {
  private memoryManager: MemoryManager;
  private memoryInjector: MemoryInjector;
  private memoryEvaluator: MemoryEvaluator | null = null;
  private configManager: MemoryConfigManager;

  constructor(config: MemoryServiceConfig = {}) {
    const finalConfig = { ...DEFAULT_SERVICE_CONFIG, ...config };
    
    // Ensure required config properties are set
    const storeConfig = {
      memoryDir: finalConfig.storeConfig?.memoryDir || getWorkingDirectory('memory'),
      format: finalConfig.storeConfig?.format || 'json' as const,
      backup: finalConfig.storeConfig?.backup ?? true
    };
    
    // Initialize memory store
    const store = new FileMemoryStore(storeConfig);
    
    // Initialize memory manager
    this.memoryManager = new MemoryManager(store);
    
    // Initialize memory injector
    this.memoryInjector = new MemoryInjector(this.memoryManager, finalConfig.injectionConfig);
    
    // Initialize memory evaluator if completion provider is available
    if (finalConfig.completionProvider) {
      this.memoryEvaluator = new MemoryEvaluator(
        finalConfig.completionProvider,
        this,
        finalConfig.evaluatorConfig
      );
    }
    
    // Initialize config manager
    this.configManager = new MemoryConfigManager();
  }

  /**
   * Initialize the memory service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize memory manager
      await this.memoryManager.initialize();
      
      // Load configuration from config manager
      const memoryConfig = this.configManager.getConfig();
      
      // Update injector config from saved settings if memory injection config exists
      if (memoryConfig) {
        // Extract injection-related config from memory config
        const injectionConfig: Partial<MemoryInjectionConfig> = {
          enabled: memoryConfig.enabled,
          // Use defaults for other injection settings
        };
        this.memoryInjector.updateConfig(injectionConfig);
      }
      
      const commandService = getCommandService();
      commandService.registerCommand(new MemoryCommand());

      const activePersonality = getPersonalityService().getActivePersonality();
      const evaluatorCompletionProvider = ProviderFactory.createFromPersonalityOrEnv(activePersonality || undefined, 'gemini');
      this.setCompletionProvider(evaluatorCompletionProvider);
      
    } catch (error) {
      logger.error('Failed to initialize memory service:', error);
      throw error;
    }
  }

  /**
   * Get the memory injector instance
   */
  getMemoryInjector(): MemoryInjector {
    return this.memoryInjector;
  }

  /**
   * Get the memory manager instance
   */
  getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  /**
   * Get the memory evaluator instance
   */
  getMemoryEvaluator(): MemoryEvaluator | null {
    return this.memoryEvaluator;
  }

  /**
   * Set the completion provider for the memory evaluator
   */
  setCompletionProvider(completionProvider: CompletionProvider): void {
    if (this.memoryEvaluator) {
      // Update existing evaluator with new completion provider
      this.memoryEvaluator = new MemoryEvaluator(
        completionProvider,
        this,
        this.memoryEvaluator.getConfig()
      );
    } else {
      // Create new evaluator
      this.memoryEvaluator = new MemoryEvaluator(
        completionProvider,
        this,
        DEFAULT_AUTO_MEMORY_CONFIG
      );
    }
    
    // Initialize AI selector for memory injection if configured
    const injectionConfig = this.memoryInjector.getConfig();
    if (injectionConfig.selectionStrategy === 'ai') {
      this.memoryInjector.initializeAISelector(completionProvider).catch(error => {
        logger.error('Failed to initialize AI Memory Selector:', error);
      });
    }
  }

  /**
   * Evaluate a conversation for memorable content
   */
  async evaluateConversation(userMessage: Message, aiResponse: Message, fullConversation: Message[]): Promise<void> {
    if (this.memoryEvaluator) {
      await this.memoryEvaluator.evaluateConversation(userMessage, aiResponse, fullConversation);
    }
  }

  /**
   * Update memory evaluator configuration
   */
  updateEvaluatorConfig(config: Partial<AutoMemoryConfig>): void {
    if (this.memoryEvaluator) {
      this.memoryEvaluator.updateConfig(config);
    } else {
      logger.warn('Memory evaluator not available - cannot update configuration');
    }
  }

  /**
   * Get memory evaluator configuration
   */
  getEvaluatorConfig(): AutoMemoryConfig | null {
    return this.memoryEvaluator ? this.memoryEvaluator.getConfig() : null;
  }

  /**
   * Get memory evaluator statistics
   */
  async getEvaluatorStats(): Promise<any> {
    if (this.memoryEvaluator) {
      return await this.memoryEvaluator.getStats();
    }
    return null;
  }

  /**
   * Create a new memory
   */
  async remember(options: CreateMemoryOptions): Promise<Memory> {
    return await this.memoryManager.remember(options);
  }

  /**
   * Retrieve a memory by ID
   */
  async recall(id: string): Promise<Memory | null> {
    return await this.memoryManager.recall(id);
  }

  /**
   * Search for memories
   */
  async search(criteria: MemorySearchCriteria): Promise<MemorySearchResult> {
    return await this.memoryManager.search(criteria);
  }

  /**
   * Find similar memories
   */
  async findSimilar(query: string, topK?: number): Promise<Memory[]> {
    return await this.memoryManager.findSimilar(query, topK);
  }

  /**
   * Get recent memories
   */
  async getRecent(limit?: number): Promise<Memory[]> {
    return await this.memoryManager.getRecent(limit);
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    return await this.memoryManager.getStats();
  }

  /**
   * Update memory injection configuration
   */
  async updateInjectionConfig(config: Partial<MemoryInjectionConfig>): Promise<void> {
    
    const oldConfig = this.memoryInjector.getConfig();
    
    // Update injector config
    this.memoryInjector.updateConfig(config);
    
    const newConfig = this.memoryInjector.getConfig();
    
    // Log configuration changes
    const changes: string[] = [];
    if (oldConfig.enabled !== newConfig.enabled) {
      changes.push(`enabled: ${oldConfig.enabled} → ${newConfig.enabled}`);
    }
    if (oldConfig.selectionStrategy !== newConfig.selectionStrategy) {
      changes.push(`strategy: ${oldConfig.selectionStrategy} → ${newConfig.selectionStrategy}`);
    }
    if (oldConfig.maxMemories !== newConfig.maxMemories) {
      changes.push(`maxMemories: ${oldConfig.maxMemories} → ${newConfig.maxMemories}`);
    }
    
    if (changes.length > 0) {
      logger.debug('Memory injection config changes:', changes.join(', '));
    }
    
    // Save config to memory config manager
    const memoryConfigUpdate: Partial<MemoryConfig> = {
      enabled: newConfig.enabled
    };
    this.configManager.updateConfig(memoryConfigUpdate);
  }

  /**
   * Get current memory injection configuration
   */
  getInjectionConfig(): MemoryInjectionConfig {
    return this.memoryInjector.getConfig();
  }

  /**
   * Inject memories into a system prompt
   */
  async injectMemories(systemPrompt: string, conversation: Message[]): Promise<string> {
    return await this.memoryInjector.injectMemories(systemPrompt, conversation);
  }

  /**
   * Create a memory from conversation context
   * This is a convenience method for creating memories from AI interactions
   */
  async rememberFromConversation(
    content: string,
    conversation: Message[],
    options: Partial<CreateMemoryOptions> = {}
  ): Promise<Memory> {
    // Extract context for metadata
    const conversationId = this.extractConversationId(conversation);
    const recentContext = conversation
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content.substring(0, 100)}`)
      .join('\n');

    const memoryOptions: CreateMemoryOptions = {
      type: 'fact', // Default type
      content,
      metadata: {
        source: 'ai',
        conversationId,
        context: recentContext,
        ...options.metadata
      },
      tags: options.tags || [],
      ...options
    };

    return await this.memoryManager.remember(memoryOptions);
  }

  /**
   * Create multiple memories from a conversation
   */
  async rememberMultipleFromConversation(
    memories: Array<{ content: string; type?: 'fact' | 'preference' | 'goal' | 'short-term' | 'long-term'; tags?: string[] }>,
    conversation: Message[]
  ): Promise<Memory[]> {
    const results: Memory[] = [];
    
    for (const memoryData of memories) {
      try {
        const memory = await this.rememberFromConversation(
          memoryData.content,
          conversation,
          {
            type: memoryData.type || 'fact',
            tags: memoryData.tags || []
          }
        );
        results.push(memory);
      } catch (error) {
        logger.warn('Failed to create memory:', error);
      }
    }
    
    return results;
  }

  /**
   * Extract conversation ID from messages
   */
  private extractConversationId(conversation: Message[]): string | undefined {
    for (const message of conversation) {
      if (message.id) {
        const match = message.id.match(/^conv_([^_]+)_/);
        if (match) {
          return match[1];
        }
      }
    }
    return undefined;
  }

  /**
   * Enable memory injection
   */
  async enableMemoryInjection(): Promise<void> {
    await this.updateInjectionConfig({ enabled: true });
  }

  /**
   * Disable memory injection
   */
  async disableMemoryInjection(): Promise<void> {
    await this.updateInjectionConfig({ enabled: false });
  }

  /**
   * Check if memory injection is enabled
   */
  isMemoryInjectionEnabled(): boolean {
    return this.memoryInjector.getConfig().enabled;
  }

  /**
   * Get memory injection statistics
   */
  async getInjectionStats(): Promise<{
    enabled: boolean;
    config: MemoryInjectionConfig;
    memoryStats: MemoryStats;
  }> {
    const config = this.memoryInjector.getConfig();
    const memoryStats = await this.memoryManager.getStats();
    
    return {
      enabled: config.enabled,
      config,
      memoryStats
    };
  }

  /**
   * Close the memory service
   */
  async close(): Promise<void> {
    await this.memoryManager.close();
  }

  /**
   * Reset all memories (use with caution)
   */
  async resetMemories(): Promise<void> {
    logger.warn('Resetting all memories - this action cannot be undone');
    
    // Get all memories and delete them
    const allMemories = await this.memoryManager.search({ limit: 10000 });
    
    for (const memory of allMemories.memories) {
      await this.memoryManager.forget(memory.id);
    }
    
    logger.debug(`Reset ${allMemories.memories.length} memories`);
  }
}