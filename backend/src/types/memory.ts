/**
 * Memory System Types and Interfaces
 * 
 * This file contains all the TypeScript interfaces and types for the AlfredAI memory system.
 * Based on the Memory System Architecture document.
 */

/**
 * Supported memory types for categorizing different kinds of memories
 */
export type MemoryType = 'fact' | 'preference' | 'goal' | 'short-term' | 'long-term';

/**
 * Source of the memory - who or what created it
 */
export type MemorySource = 'user' | 'ai' | 'system';

/**
 * Metadata associated with a memory
 */
export interface MemoryMetadata {
  /** Source of the memory */
  source: MemorySource;
  /** Optional conversation ID this memory is associated with */
  conversationId?: string;
  /** Additional metadata fields */
  [key: string]: any;
}

/**
 * Core Memory interface representing a single memory record
 */
export interface Memory {
  /** Unique identifier for the memory */
  id: string;
  /** Type/category of the memory */
  type: MemoryType;
  /** The actual content/text of the memory */
  content: string;
  /** ISO timestamp when the memory was created */
  timestamp: string;
  /** ISO timestamp when the memory was last accessed */
  lastAccessed: string;
  /** Associated metadata */
  metadata: MemoryMetadata;
  /** Tags for categorization and retrieval */
  tags: string[];
}

/**
 * Options for creating a new memory
 */
export interface CreateMemoryOptions {
  type: MemoryType;
  content: string;
  metadata?: Partial<MemoryMetadata>;
  tags?: string[];
}

/**
 * Options for updating an existing memory
 */
export interface UpdateMemoryOptions {
  content?: string;
  type?: MemoryType;
  metadata?: Partial<MemoryMetadata>;
  tags?: string[];
}

/**
 * Search criteria for finding memories
 */
export interface MemorySearchCriteria {
  /** Search by memory type */
  type?: MemoryType;
  /** Search by tags (AND operation) */
  tags?: string[];
  /** Search by content (simple text search) */
  content?: string;
  /** Search by source */
  source?: MemorySource;
  /** Search by conversation ID */
  conversationId?: string;
  /** Limit number of results */
  limit?: number;
  /** Skip number of results (for pagination) */
  offset?: number;
}

/**
 * Result of a memory search operation
 */
export interface MemorySearchResult {
  /** Found memories */
  memories: Memory[];
  /** Total count of memories matching criteria (before limit/offset) */
  total: number;
}

/**
 * Abstract interface for memory storage backends
 */
export interface MemoryStore {
  /**
   * Initialize the memory store
   */
  initialize(): Promise<void>;

  /**
   * Create a new memory
   */
  create(memory: Memory): Promise<Memory>;

  /**
   * Retrieve a memory by ID
   */
  getById(id: string): Promise<Memory | null>;

  /**
   * Update an existing memory
   */
  update(id: string, updates: Partial<Memory>): Promise<Memory | null>;

  /**
   * Delete a memory by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Search for memories based on criteria
   */
  search(criteria: MemorySearchCriteria): Promise<MemorySearchResult>;

  /**
   * Get all memories (with optional pagination)
   */
  getAll(limit?: number, offset?: number): Promise<MemorySearchResult>;

  /**
   * Get memories by tags
   */
  findByTags(tags: string[], limit?: number): Promise<Memory[]>;

  /**
   * Get recent memories
   */
  getRecent(limit?: number): Promise<Memory[]>;

  /**
   * Close/cleanup the store
   */
  close(): Promise<void>;
}

/**
 * Configuration for memory stores
 */
export interface MemoryStoreConfig {
  /** Type of store */
  type: 'file' | 'vector' | 'hybrid';
  /** Store-specific configuration */
  config: Record<string, any>;
}

/**
 * Configuration for file-based memory store
 */
export interface FileMemoryStoreConfig {
  /** Directory to store memory files */
  memoryDir: string;
  /** File format for storing memories */
  format: 'json' | 'yaml';
  /** Whether to create backup files */
  backup: boolean;
}

/**
 * Memory Manager interface - central API for memory operations
 */
export interface MemoryManager {
  /**
   * Initialize the memory manager
   */
  initialize(): Promise<void>;

  /**
   * Create a new memory
   */
  remember(options: CreateMemoryOptions): Promise<Memory>;

  /**
   * Retrieve a memory by ID
   */
  recall(id: string): Promise<Memory | null>;

  /**
   * Update an existing memory
   */
  evolve(id: string, updates: UpdateMemoryOptions): Promise<Memory | null>;

  /**
   * Delete a memory
   */
  forget(id: string): Promise<boolean>;

  /**
   * Search for memories
   */
  search(criteria: MemorySearchCriteria): Promise<MemorySearchResult>;

  /**
   * Find memories by tags
   */
  findByTags(tags: string[], limit?: number): Promise<Memory[]>;

  /**
   * Get recent memories
   */
  getRecent(limit?: number): Promise<Memory[]>;

  /**
   * Find similar memories (placeholder for future vector search)
   */
  findSimilar(query: string, topK?: number): Promise<Memory[]>;

  /**
   * Get memory statistics
   */
  getStats(): Promise<MemoryStats>;

  /**
   * Close the memory manager
   */
  close(): Promise<void>;
}

/**
 * Memory system statistics
 */
export interface MemoryStats {
  /** Total number of memories */
  total: number;
  /** Count by memory type */
  byType: Record<MemoryType, number>;
  /** Count by source */
  bySource: Record<MemorySource, number>;
  /** Most used tags */
  topTags: Array<{ tag: string; count: number }>;
  /** Oldest memory timestamp */
  oldestMemory?: string;
  /** Newest memory timestamp */
  newestMemory?: string;
}

/**
 * Error types for memory operations
 */
export class MemoryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class MemoryNotFoundError extends MemoryError {
  constructor(id: string) {
    super(`Memory with ID ${id} not found`, 'MEMORY_NOT_FOUND');
  }
}

export class MemoryValidationError extends MemoryError {
  constructor(message: string) {
    super(message, 'MEMORY_VALIDATION_ERROR');
  }
}

export class MemoryStoreError extends MemoryError {
  constructor(message: string) {
    super(message, 'MEMORY_STORE_ERROR');
  }
}