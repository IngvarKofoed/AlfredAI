/**
 * Memory System Exports
 * 
 * This file provides clean exports for the memory system components.
 */

// Core memory store classes
export { MemoryStore } from './memory-store';
export { FileMemoryStore } from './file-memory-store';

// Memory manager
export { MemoryManager } from './memory-manager';

// Memory injector
export { MemoryInjector, DEFAULT_MEMORY_CONFIG as DEFAULT_INJECTION_CONFIG } from './memory-injector';
export type { MemoryInjectionConfig, ScoredMemory, ConversationContext } from './memory-injector';

// Memory service
export { MemoryService, getMemoryService, initializeMemoryService, closeMemoryService } from './memory-service';
export type { MemoryServiceConfig } from './memory-service';

// Memory configuration
export { MemoryConfigManager, memoryConfigManager, DEFAULT_MEMORY_CONFIG } from './memory-config-manager';
export type { MemoryConfig } from './memory-config-manager';

// Re-export types for convenience
export * from '../types/memory';