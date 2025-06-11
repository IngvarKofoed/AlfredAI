/**
 * Memory Manager Implementation
 * 
 * This file contains the central API for memory operations, providing
 * a high-level interface for memory management with evolution logic.
 */

import {
  Memory,
  MemoryManager as IMemoryManager,
  MemoryStore,
  CreateMemoryOptions,
  UpdateMemoryOptions,
  MemorySearchCriteria,
  MemorySearchResult,
  MemoryStats,
  MemoryType,
  MemorySource,
  MemoryError,
  MemoryNotFoundError,
  MemoryValidationError
} from '../types/memory';

/**
 * Central memory management system
 */
export class MemoryManager implements IMemoryManager {
  private store: MemoryStore;
  private initialized = false;

  constructor(store: MemoryStore) {
    this.store = store;
  }

  /**
   * Initialize the memory manager
   */
  async initialize(): Promise<void> {
    try {
      await this.store.initialize();
      this.initialized = true;
    } catch (error) {
      throw new MemoryError(
        `Failed to initialize memory manager: ${error instanceof Error ? error.message : String(error)}`,
        'INITIALIZATION_ERROR'
      );
    }
  }

  /**
   * Create a new memory
   */
  async remember(options: CreateMemoryOptions): Promise<Memory> {
    this.ensureInitialized();
    this.validateCreateOptions(options);

    const now = this.getCurrentTimestamp();
    const memory: Memory = {
      id: this.generateId(),
      type: options.type,
      content: options.content,
      timestamp: now,
      lastAccessed: now,
      metadata: {
        source: 'ai', // Default source
        ...options.metadata
      },
      tags: options.tags || []
    };

    // Check for similar existing memories and potentially evolve them
    const similarMemories = await this.findSimilarContent(memory.content, memory.type);
    
    if (similarMemories.length > 0) {
      // If we find very similar memories, we might want to evolve them instead
      const mostSimilar = similarMemories[0];
      if (this.shouldEvolveMemory(mostSimilar, memory)) {
        return await this.evolveExistingMemory(mostSimilar, memory);
      }
    }

    return await this.store.create(memory);
  }

  /**
   * Retrieve a memory by ID
   */
  async recall(id: string): Promise<Memory | null> {
    this.ensureInitialized();
    
    if (!id || typeof id !== 'string') {
      throw new MemoryValidationError('Memory ID must be a non-empty string');
    }

    return await this.store.getById(id);
  }

  /**
   * Update an existing memory (evolution)
   */
  async evolve(id: string, updates: UpdateMemoryOptions): Promise<Memory | null> {
    this.ensureInitialized();
    this.validateUpdateOptions(updates);

    const existingMemory = await this.store.getById(id);
    if (!existingMemory) {
      throw new MemoryNotFoundError(id);
    }

    // Prepare the updates with evolution logic
    const evolutionUpdates: Partial<Memory> = {
      lastAccessed: this.getCurrentTimestamp()
    };

    // Add other updates
    if (updates.content) evolutionUpdates.content = updates.content;
    if (updates.type) evolutionUpdates.type = updates.type;
    if (updates.tags) evolutionUpdates.tags = updates.tags;

    // Handle metadata carefully
    if (updates.content && updates.content !== existingMemory.content) {
      evolutionUpdates.metadata = {
        ...existingMemory.metadata,
        ...(updates.metadata || {}),
        previousContent: existingMemory.content,
        evolutionCount: (existingMemory.metadata.evolutionCount || 0) + 1
      };
    } else if (updates.metadata) {
      evolutionUpdates.metadata = {
        ...existingMemory.metadata,
        ...updates.metadata
      };
    }

    return await this.store.update(id, evolutionUpdates);
  }

  /**
   * Delete a memory
   */
  async forget(id: string): Promise<boolean> {
    this.ensureInitialized();
    
    if (!id || typeof id !== 'string') {
      throw new MemoryValidationError('Memory ID must be a non-empty string');
    }

    return await this.store.delete(id);
  }

  /**
   * Search for memories
   */
  async search(criteria: MemorySearchCriteria): Promise<MemorySearchResult> {
    this.ensureInitialized();
    return await this.store.search(criteria);
  }

  /**
   * Find memories by tags
   */
  async findByTags(tags: string[], limit?: number): Promise<Memory[]> {
    this.ensureInitialized();
    
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new MemoryValidationError('Tags must be a non-empty array');
    }

    return await this.store.findByTags(tags, limit);
  }

  /**
   * Get recent memories
   */
  async getRecent(limit: number = 10): Promise<Memory[]> {
    this.ensureInitialized();
    
    if (typeof limit !== 'number' || limit < 1) {
      throw new MemoryValidationError('Limit must be a positive number');
    }

    return await this.store.getRecent(limit);
  }

  /**
   * Find similar memories (placeholder for future vector search)
   */
  async findSimilar(query: string, topK: number = 5): Promise<Memory[]> {
    this.ensureInitialized();
    
    if (!query || typeof query !== 'string') {
      throw new MemoryValidationError('Query must be a non-empty string');
    }

    // For now, implement simple text-based similarity
    // This will be replaced with vector search in Phase 3
    const searchResult = await this.store.search({
      content: query,
      limit: topK * 2 // Get more results to filter
    });

    // Simple similarity scoring based on common words
    const scoredMemories = searchResult.memories.map(memory => ({
      memory,
      score: this.calculateTextSimilarity(query, memory.content)
    }));

    // Sort by score and return top K
    return scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.memory);
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    this.ensureInitialized();
    
    const allMemories = await this.store.getAll();
    const memories = allMemories.memories;

    const byType = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<MemoryType, number>);

    const bySource = memories.reduce((acc, memory) => {
      acc[memory.metadata.source] = (acc[memory.metadata.source] || 0) + 1;
      return acc;
    }, {} as Record<MemorySource, number>);

    const tagCounts = memories.reduce((acc, memory) => {
      memory.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const timestamps = memories.map(m => new Date(m.timestamp).getTime());
    const oldestMemory = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : undefined;
    const newestMemory = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : undefined;

    return {
      total: memories.length,
      byType,
      bySource,
      topTags,
      oldestMemory,
      newestMemory
    };
  }

  /**
   * Close the memory manager
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.store.close();
      this.initialized = false;
    }
  }

  /**
   * Find memories with similar content
   */
  private async findSimilarContent(content: string, type: MemoryType): Promise<Memory[]> {
    // Simple implementation - search for memories with similar content
    const searchResult = await this.store.search({
      type,
      content: content.substring(0, 50), // Use first 50 chars for similarity
      limit: 5
    });

    return searchResult.memories.filter(memory => 
      this.calculateTextSimilarity(content, memory.content) > 0.7
    );
  }

  /**
   * Determine if a memory should be evolved instead of creating a new one
   */
  private shouldEvolveMemory(existing: Memory, newMemory: Memory): boolean {
    // Evolve if:
    // 1. Same type
    // 2. High content similarity (>80%)
    // 3. Recent (within last 24 hours)
    
    if (existing.type !== newMemory.type) {
      return false;
    }

    const similarity = this.calculateTextSimilarity(existing.content, newMemory.content);
    if (similarity < 0.8) {
      return false;
    }

    const hoursSinceLastAccess = (Date.now() - new Date(existing.lastAccessed).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastAccess < 24;
  }

  /**
   * Evolve an existing memory with new information
   */
  private async evolveExistingMemory(existing: Memory, newMemory: Memory): Promise<Memory> {
    const mergedMetadata = {
      ...existing.metadata,
      ...newMemory.metadata,
      previousContent: existing.content,
      evolutionCount: (existing.metadata.evolutionCount || 0) + 1
    };

    const updates: Partial<Memory> = {
      content: this.mergeContent(existing.content, newMemory.content),
      tags: [...new Set([...existing.tags, ...newMemory.tags])], // Merge unique tags
      metadata: mergedMetadata,
      lastAccessed: this.getCurrentTimestamp()
    };

    const evolved = await this.store.update(existing.id, updates);
    if (!evolved) {
      throw new MemoryError('Failed to evolve memory', 'EVOLUTION_ERROR');
    }

    return evolved;
  }

  /**
   * Merge content from two memories
   */
  private mergeContent(existing: string, newContent: string): string {
    // Simple merge strategy - append new content if significantly different
    const similarity = this.calculateTextSimilarity(existing, newContent);
    
    if (similarity < 0.9) {
      return `${existing}\n\n[Updated]: ${newContent}`;
    }
    
    return newContent; // Replace if very similar
  }

  /**
   * Calculate text similarity between two strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Validate create memory options
   */
  private validateCreateOptions(options: CreateMemoryOptions): void {
    if (!options.content || typeof options.content !== 'string') {
      throw new MemoryValidationError('Memory content is required and must be a string');
    }

    if (!options.type || !['fact', 'preference', 'goal', 'short-term', 'long-term'].includes(options.type)) {
      throw new MemoryValidationError('Memory type must be one of: fact, preference, goal, short-term, long-term');
    }

    if (options.tags && !Array.isArray(options.tags)) {
      throw new MemoryValidationError('Memory tags must be an array');
    }

    if (options.metadata && typeof options.metadata !== 'object') {
      throw new MemoryValidationError('Memory metadata must be an object');
    }
  }

  /**
   * Validate update memory options
   */
  private validateUpdateOptions(options: UpdateMemoryOptions): void {
    if (options.content !== undefined && (typeof options.content !== 'string' || !options.content)) {
      throw new MemoryValidationError('Memory content must be a non-empty string');
    }

    if (options.type && !['fact', 'preference', 'goal', 'short-term', 'long-term'].includes(options.type)) {
      throw new MemoryValidationError('Memory type must be one of: fact, preference, goal, short-term, long-term');
    }

    if (options.tags && !Array.isArray(options.tags)) {
      throw new MemoryValidationError('Memory tags must be an array');
    }

    if (options.metadata && typeof options.metadata !== 'object') {
      throw new MemoryValidationError('Memory metadata must be an object');
    }
  }

  /**
   * Ensure the manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new MemoryError('Memory manager is not initialized. Call initialize() first.', 'NOT_INITIALIZED');
    }
  }

  /**
   * Generate a unique ID for a memory
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current ISO timestamp
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}