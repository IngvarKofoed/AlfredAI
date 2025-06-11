/**
 * File-based Memory Store Implementation
 * 
 * This file contains the file-based implementation of the memory store,
 * using JSON files for persistence.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import {
  Memory,
  MemorySearchCriteria,
  MemorySearchResult,
  FileMemoryStoreConfig,
  MemoryStoreError,
  MemoryNotFoundError
} from '../types/memory';
import { MemoryStore } from './memory-store';

/**
 * File-based memory store implementation
 */
export class FileMemoryStore extends MemoryStore {
  private config: FileMemoryStoreConfig;
  private memoriesFilePath: string;
  private indexFilePath: string;
  private memories: Map<string, Memory> = new Map();

  constructor(config: FileMemoryStoreConfig) {
    super();
    this.config = {
      ...config,
      format: config.format || 'json',
      backup: config.backup !== undefined ? config.backup : true
    };
    this.memoriesFilePath = path.join(this.config.memoryDir, 'memories.json');
    this.indexFilePath = path.join(this.config.memoryDir, 'index.json');
  }

  /**
   * Initialize the file-based memory store
   */
  async initialize(): Promise<void> {
    try {
      // Create memory directory if it doesn't exist
      await fs.mkdir(this.config.memoryDir, { recursive: true });

      // Load existing memories
      await this.loadMemories();

      this.initialized = true;
    } catch (error) {
      throw new MemoryStoreError(`Failed to initialize file memory store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new memory
   */
  async create(memory: Memory): Promise<Memory> {
    this.ensureInitialized();
    this.validateMemory(memory);

    if (this.memories.has(memory.id)) {
      throw new MemoryStoreError(`Memory with ID ${memory.id} already exists`);
    }

    // Update lastAccessed to current time
    const memoryToStore = {
      ...memory,
      lastAccessed: this.getCurrentTimestamp()
    };

    this.memories.set(memory.id, memoryToStore);
    await this.saveMemories();

    return memoryToStore;
  }

  /**
   * Retrieve a memory by ID
   */
  async getById(id: string): Promise<Memory | null> {
    this.ensureInitialized();

    const memory = this.memories.get(id);
    if (!memory) {
      return null;
    }

    // Update lastAccessed timestamp
    const updatedMemory = {
      ...memory,
      lastAccessed: this.getCurrentTimestamp()
    };

    this.memories.set(id, updatedMemory);
    await this.saveMemories();

    return updatedMemory;
  }

  /**
   * Update an existing memory
   */
  async update(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    this.ensureInitialized();

    const existingMemory = this.memories.get(id);
    if (!existingMemory) {
      return null;
    }

    const updatedMemory = {
      ...existingMemory,
      ...updates,
      id, // Ensure ID cannot be changed
      lastAccessed: this.getCurrentTimestamp()
    };

    this.validateMemory(updatedMemory);
    this.memories.set(id, updatedMemory);
    await this.saveMemories();

    return updatedMemory;
  }

  /**
   * Delete a memory by ID
   */
  async delete(id: string): Promise<boolean> {
    this.ensureInitialized();

    const existed = this.memories.has(id);
    if (existed) {
      this.memories.delete(id);
      await this.saveMemories();
    }

    return existed;
  }

  /**
   * Search for memories based on criteria
   */
  async search(criteria: MemorySearchCriteria): Promise<MemorySearchResult> {
    this.ensureInitialized();
    this.validateSearchCriteria(criteria);

    const allMemories = Array.from(this.memories.values());
    const matchingMemories = allMemories.filter(memory => this.matchesCriteria(memory, criteria));
    
    // Sort by timestamp (newest first)
    const sortedMemories = this.sortByTimestamp(matchingMemories);
    
    // Apply pagination
    const paginatedMemories = this.paginate(sortedMemories, criteria.limit, criteria.offset);

    return {
      memories: paginatedMemories,
      total: matchingMemories.length
    };
  }

  /**
   * Get all memories (with optional pagination)
   */
  async getAll(limit?: number, offset?: number): Promise<MemorySearchResult> {
    this.ensureInitialized();

    const allMemories = Array.from(this.memories.values());
    const sortedMemories = this.sortByTimestamp(allMemories);
    const paginatedMemories = this.paginate(sortedMemories, limit, offset);

    return {
      memories: paginatedMemories,
      total: allMemories.length
    };
  }

  /**
   * Get memories by tags
   */
  async findByTags(tags: string[], limit?: number): Promise<Memory[]> {
    this.ensureInitialized();

    const allMemories = Array.from(this.memories.values());
    const matchingMemories = allMemories.filter(memory => 
      tags.every(tag => memory.tags.includes(tag))
    );

    const sortedMemories = this.sortByTimestamp(matchingMemories);
    return this.paginate(sortedMemories, limit);
  }

  /**
   * Get recent memories
   */
  async getRecent(limit: number = 10): Promise<Memory[]> {
    this.ensureInitialized();

    const allMemories = Array.from(this.memories.values());
    const sortedMemories = this.sortByTimestamp(allMemories);
    
    return sortedMemories.slice(0, limit);
  }

  /**
   * Close/cleanup the store
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.saveMemories();
      this.memories.clear();
      this.initialized = false;
    }
  }

  /**
   * Load memories from file
   */
  private async loadMemories(): Promise<void> {
    try {
      if (existsSync(this.memoriesFilePath)) {
        const data = await fs.readFile(this.memoriesFilePath, 'utf-8');
        const memoriesArray: Memory[] = JSON.parse(data);
        
        this.memories.clear();
        for (const memory of memoriesArray) {
          this.validateMemory(memory);
          this.memories.set(memory.id, memory);
        }
      }
    } catch (error) {
      throw new MemoryStoreError(`Failed to load memories from file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save memories to file
   */
  private async saveMemories(): Promise<void> {
    try {
      // Create backup if enabled
      if (this.config.backup && existsSync(this.memoriesFilePath)) {
        const backupPath = `${this.memoriesFilePath}.backup`;
        await fs.copyFile(this.memoriesFilePath, backupPath);
      }

      // Convert Map to Array for JSON serialization
      const memoriesArray = Array.from(this.memories.values());
      
      // Write to temporary file first, then rename (atomic operation)
      const tempPath = `${this.memoriesFilePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(memoriesArray, null, 2), 'utf-8');
      await fs.rename(tempPath, this.memoriesFilePath);

      // Update index file with metadata
      await this.updateIndex();
    } catch (error) {
      throw new MemoryStoreError(`Failed to save memories to file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update index file with metadata
   */
  private async updateIndex(): Promise<void> {
    try {
      const stats = this.calculateStats();
      const index = {
        lastUpdated: this.getCurrentTimestamp(),
        totalMemories: this.memories.size,
        stats
      };

      await fs.writeFile(this.indexFilePath, JSON.stringify(index, null, 2), 'utf-8');
    } catch (error) {
      // Index update failure shouldn't break the main operation
      console.warn(`Failed to update memory index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate memory statistics
   */
  private calculateStats() {
    const memories = Array.from(this.memories.values());
    
    const byType = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = memories.reduce((acc, memory) => {
      acc[memory.metadata.source] = (acc[memory.metadata.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
      byType,
      bySource,
      topTags,
      oldestMemory,
      newestMemory
    };
  }

  /**
   * Get memory store statistics
   */
  async getStats() {
    this.ensureInitialized();
    return this.calculateStats();
  }
}