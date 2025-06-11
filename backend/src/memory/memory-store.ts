/**
 * Abstract Memory Store Base Class
 * 
 * This file contains the abstract base class for memory storage backends.
 * Concrete implementations should extend this class.
 */

import {
  Memory,
  MemorySearchCriteria,
  MemorySearchResult,
  MemoryStore as IMemoryStore,
  MemoryStoreError,
  MemoryValidationError
} from '../types/memory';

/**
 * Abstract base class for memory storage implementations
 */
export abstract class MemoryStore implements IMemoryStore {
  protected initialized = false;

  /**
   * Initialize the memory store
   */
  abstract initialize(): Promise<void>;

  /**
   * Create a new memory
   */
  abstract create(memory: Memory): Promise<Memory>;

  /**
   * Retrieve a memory by ID
   */
  abstract getById(id: string): Promise<Memory | null>;

  /**
   * Update an existing memory
   */
  abstract update(id: string, updates: Partial<Memory>): Promise<Memory | null>;

  /**
   * Delete a memory by ID
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Search for memories based on criteria
   */
  abstract search(criteria: MemorySearchCriteria): Promise<MemorySearchResult>;

  /**
   * Get all memories (with optional pagination)
   */
  abstract getAll(limit?: number, offset?: number): Promise<MemorySearchResult>;

  /**
   * Get memories by tags
   */
  abstract findByTags(tags: string[], limit?: number): Promise<Memory[]>;

  /**
   * Get recent memories
   */
  abstract getRecent(limit?: number): Promise<Memory[]>;

  /**
   * Close/cleanup the store
   */
  abstract close(): Promise<void>;

  /**
   * Validate a memory object
   */
  protected validateMemory(memory: Memory): void {
    if (!memory.id || typeof memory.id !== 'string') {
      throw new MemoryValidationError('Memory ID is required and must be a string');
    }

    if (!memory.content || typeof memory.content !== 'string') {
      throw new MemoryValidationError('Memory content is required and must be a string');
    }

    if (!memory.type || !['fact', 'preference', 'goal', 'short-term', 'long-term'].includes(memory.type)) {
      throw new MemoryValidationError('Memory type must be one of: fact, preference, goal, short-term, long-term');
    }

    if (!memory.timestamp || typeof memory.timestamp !== 'string') {
      throw new MemoryValidationError('Memory timestamp is required and must be a string');
    }

    if (!memory.lastAccessed || typeof memory.lastAccessed !== 'string') {
      throw new MemoryValidationError('Memory lastAccessed is required and must be a string');
    }

    if (!memory.metadata || typeof memory.metadata !== 'object') {
      throw new MemoryValidationError('Memory metadata is required and must be an object');
    }

    if (!memory.metadata.source || !['user', 'ai', 'system'].includes(memory.metadata.source)) {
      throw new MemoryValidationError('Memory metadata.source must be one of: user, ai, system');
    }

    if (!Array.isArray(memory.tags)) {
      throw new MemoryValidationError('Memory tags must be an array');
    }

    // Validate timestamp format (ISO 8601)
    try {
      new Date(memory.timestamp).toISOString();
      new Date(memory.lastAccessed).toISOString();
    } catch (error) {
      throw new MemoryValidationError('Memory timestamps must be valid ISO 8601 strings');
    }
  }

  /**
   * Validate search criteria
   */
  protected validateSearchCriteria(criteria: MemorySearchCriteria): void {
    if (criteria.type && !['fact', 'preference', 'goal', 'short-term', 'long-term'].includes(criteria.type)) {
      throw new MemoryValidationError('Search criteria type must be one of: fact, preference, goal, short-term, long-term');
    }

    if (criteria.source && !['user', 'ai', 'system'].includes(criteria.source)) {
      throw new MemoryValidationError('Search criteria source must be one of: user, ai, system');
    }

    if (criteria.tags && !Array.isArray(criteria.tags)) {
      throw new MemoryValidationError('Search criteria tags must be an array');
    }

    if (criteria.limit && (typeof criteria.limit !== 'number' || criteria.limit < 1)) {
      throw new MemoryValidationError('Search criteria limit must be a positive number');
    }

    if (criteria.offset && (typeof criteria.offset !== 'number' || criteria.offset < 0)) {
      throw new MemoryValidationError('Search criteria offset must be a non-negative number');
    }
  }

  /**
   * Check if the store is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new MemoryStoreError('Memory store is not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate a unique ID for a memory
   */
  protected generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current ISO timestamp
   */
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Filter memories based on search criteria
   */
  protected matchesCriteria(memory: Memory, criteria: MemorySearchCriteria): boolean {
    // Type filter
    if (criteria.type && memory.type !== criteria.type) {
      return false;
    }

    // Source filter
    if (criteria.source && memory.metadata.source !== criteria.source) {
      return false;
    }

    // Conversation ID filter
    if (criteria.conversationId && memory.metadata.conversationId !== criteria.conversationId) {
      return false;
    }

    // Tags filter (AND operation - all specified tags must be present)
    if (criteria.tags && criteria.tags.length > 0) {
      const hasAllTags = criteria.tags.every(tag => memory.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    // Content filter (simple case-insensitive text search)
    if (criteria.content) {
      const contentLower = memory.content.toLowerCase();
      const searchLower = criteria.content.toLowerCase();
      if (!contentLower.includes(searchLower)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sort memories by timestamp (newest first)
   */
  protected sortByTimestamp(memories: Memory[]): Memory[] {
    return memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Apply pagination to results
   */
  protected paginate<T>(items: T[], limit?: number, offset?: number): T[] {
    let result = items;
    
    if (offset && offset > 0) {
      result = result.slice(offset);
    }
    
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }
}