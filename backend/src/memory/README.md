# AlfredAI Memory System

This directory contains the core memory system infrastructure for AlfredAI, providing persistent, evolving memory capabilities for the AI assistant.

## Overview

The memory system enables AlfredAI to:
- **Remember** user preferences, facts, and goals
- **Recall** relevant information from past interactions
- **Evolve** memories by updating them with new information
- **Search** memories by content, tags, type, and other criteria
- **Persist** memories across sessions using file-based storage

## Architecture

The memory system follows a modular architecture with the following components:

### Core Components

1. **Memory Types** (`../types/memory.ts`)
   - TypeScript interfaces and types for the memory system
   - Memory, MemoryStore, MemoryManager interfaces
   - Error classes and configuration types

2. **Memory Store** (`memory-store.ts`)
   - Abstract base class for memory storage backends
   - Provides validation and common functionality
   - Extensible for different storage implementations

3. **File Memory Store** (`file-memory-store.ts`)
   - File-based implementation using JSON storage
   - Supports backup files and atomic writes
   - Stores memories in the configured memory directory

4. **Memory Manager** (`memory-manager.ts`)
   - Central API for memory operations
   - Implements memory evolution logic
   - Provides high-level memory management functions

5. **Memory Configuration** (`memory-config-manager.ts`)
   - Manages memory system configuration
   - Supports environment variables and config files
   - Provides default settings and validation

## Memory Types

The system supports five types of memories:

- **`fact`** - Factual information about the user or context
- **`preference`** - User preferences and settings
- **`goal`** - User goals and objectives
- **`short-term`** - Temporary information for current session
- **`long-term`** - Persistent information across sessions

## Usage

### Basic Setup

```typescript
import { MemoryManager, FileMemoryStore, memoryConfigManager } from './memory';

// Get configuration
const config = memoryConfigManager.getFileStoreConfig();

// Create store and manager
const store = new FileMemoryStore(config);
const manager = new MemoryManager(store);

// Initialize
await manager.initialize();
```

### Creating Memories

```typescript
// Remember a user preference
const preference = await manager.remember({
  type: 'preference',
  content: 'User prefers concise explanations',
  tags: ['communication-style'],
  metadata: {
    source: 'user',
    conversationId: 'conv_123'
  }
});

// Remember a fact
const fact = await manager.remember({
  type: 'fact',
  content: 'User is working on a TypeScript project',
  tags: ['project', 'typescript'],
  metadata: { source: 'ai' }
});
```

### Retrieving Memories

```typescript
// Recall by ID
const memory = await manager.recall(preference.id);

// Search by criteria
const results = await manager.search({
  type: 'preference',
  tags: ['communication-style'],
  limit: 10
});

// Find by tags
const projectMemories = await manager.findByTags(['project']);

// Get recent memories
const recent = await manager.getRecent(5);

// Find similar memories (basic text similarity)
const similar = await manager.findSimilar('TypeScript development', 3);
```

### Updating Memories

```typescript
// Evolve a memory with new information
const evolved = await manager.evolve(fact.id, {
  content: 'User is working on a TypeScript project called AlfredAI',
  tags: [...fact.tags, 'alfredai']
});
```

### Memory Statistics

```typescript
const stats = await manager.getStats();
console.log(`Total memories: ${stats.total}`);
console.log(`By type:`, stats.byType);
console.log(`Top tags:`, stats.topTags);
```

## Configuration

### Environment Variables

```bash
# Enable/disable memory system
MEMORY_ENABLED=true

# Memory storage directory
MEMORY_DIR=memory-bank

# Store type (file, vector, hybrid)
MEMORY_STORE_TYPE=file

# File format (json, yaml)
MEMORY_FORMAT=json

# Enable backup files
MEMORY_BACKUP=true

# Retention settings
MEMORY_MAX_COUNT=10000
MEMORY_SHORT_TERM_DAYS=7
MEMORY_LONG_TERM_DAYS=365
```

### Configuration File

The system can also be configured via `memory-config.json`:

```json
{
  "enabled": true,
  "memoryDir": "memory-bank",
  "store": {
    "type": "file",
    "config": {
      "memoryDir": "memory-bank",
      "format": "json",
      "backup": true
    }
  },
  "retention": {
    "maxMemories": 10000,
    "shortTermDays": 7,
    "longTermDays": 365
  }
}
```

## File Structure

When using file-based storage, the memory system creates:

```
memory-bank/
├── memories.json      # Main memory storage
├── memories.json.backup  # Backup file (if enabled)
└── index.json        # Metadata and statistics
```

## Memory Evolution

The system includes intelligent memory evolution:

- **Similarity Detection**: Identifies similar memories to avoid duplicates
- **Content Merging**: Combines related information intelligently
- **Tag Merging**: Consolidates tags from related memories
- **Version Tracking**: Preserves previous content in metadata

## Error Handling

The system provides specific error types:

- `MemoryError` - Base error class
- `MemoryNotFoundError` - Memory doesn't exist
- `MemoryValidationError` - Invalid memory data
- `MemoryStoreError` - Storage operation failed

## Future Enhancements

Phase 1 (Current) focuses on core infrastructure. Future phases will add:

- **Phase 2**: Integration with completion providers
- **Phase 3**: Vector database support for semantic search
- **Phase 4**: Advanced memory evolution and forgetting mechanisms

## Example

See `example.ts` for a complete usage example demonstrating all memory system features.

## Testing

To test the memory system:

```bash
# Run the example
npx ts-node src/memory/example.ts

# Or import and use in your code
import { memorySystemExample } from './memory/example';
await memorySystemExample();