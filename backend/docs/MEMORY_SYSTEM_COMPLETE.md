# Complete Memory System Guide

This comprehensive guide covers the complete memory system implementation for AlfredAI, including setup, configuration, usage examples, and troubleshooting.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Integration Guide](#integration-guide)
8. [MCP Tool Integration](#mcp-tool-integration)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)
11. [Performance Considerations](#performance-considerations)
12. [Security Considerations](#security-considerations)

## Overview

The AlfredAI Memory System is a comprehensive solution that enables AI assistants to remember information about users and use that information in future conversations. It provides:

- **Persistent Memory Storage**: Store facts, preferences, goals, and contextual information
- **Intelligent Memory Injection**: Automatically inject relevant memories into AI conversations
- **Memory Evolution**: Update and refine memories based on new information
- **MCP Tool Integration**: Expose memory operations through MCP (Model Context Protocol) tools
- **Multiple Storage Backends**: File-based storage with plans for vector databases
- **Type-Safe API**: Full TypeScript support with comprehensive type definitions

### Key Features

- ✅ **Memory Types**: Facts, preferences, goals, short-term, and long-term memories
- ✅ **Smart Retrieval**: Context-aware memory retrieval based on conversation content
- ✅ **Memory Injection**: Automatic injection of relevant memories into AI prompts
- ✅ **Persistence**: Reliable storage and retrieval across application restarts
- ✅ **Search & Discovery**: Full-text search, tag-based filtering, and similarity matching
- ✅ **Analytics**: Comprehensive statistics and insights about memory usage
- ✅ **MCP Integration**: Expose memory operations as MCP tools for external access

## Architecture

The memory system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
│  (WebSocket Commands, MCP Tools, Completion Providers) │
├─────────────────────────────────────────────────────────┤
│                   Memory Service                       │
│        (High-level API, Configuration Management)      │
├─────────────────────────────────────────────────────────┤
│     Memory Manager          │      Memory Injector     │
│  (CRUD Operations, Search)  │   (Context Injection)    │
├─────────────────────────────────────────────────────────┤
│                   Memory Store                         │
│              (Persistence Layer)                       │
└─────────────────────────────────────────────────────────┘
```

### Core Components

1. **Memory Store**: Handles persistence (currently file-based, extensible to vector DBs)
2. **Memory Manager**: Provides CRUD operations and search functionality
3. **Memory Injector**: Handles intelligent memory injection into AI conversations
4. **Memory Service**: High-level service combining manager and injector
5. **Memory Tools**: MCP tools for external memory operations

## Installation & Setup

### Prerequisites

- Node.js 18+ with TypeScript support
- Sufficient disk space for memory storage (typically minimal)

### Basic Setup

1. **Initialize the Memory System**:

```typescript
import { initializeMemoryService } from './memory';

// Initialize with default configuration
const memoryService = await initializeMemoryService();
```

2. **Custom Configuration**:

```typescript
const memoryService = await initializeMemoryService({
  storeConfig: {
    memoryDir: './my-memory-data',
    format: 'json',
    backup: true
  },
  injectionConfig: {
    enabled: true,
    maxMemories: 10,
    relevanceThreshold: 0.3
  }
});
```

3. **Integration with Completion Providers**:

```typescript
import { ProviderFactory } from './completion/provider-factory';

const memoryInjector = memoryService.getMemoryInjector();
const provider = ProviderFactory.createFromEnv('claude', memoryInjector);
```

## Configuration

### Memory Store Configuration

```typescript
interface MemoryStoreConfig {
  /** Directory to store memory files */
  memoryDir: string;
  /** File format: 'json' or 'yaml' */
  format: 'json' | 'yaml';
  /** Enable backup files */
  backup: boolean;
}
```

**Default Configuration**:
```typescript
{
  memoryDir: './memory-data',
  format: 'json',
  backup: true
}
```

### Memory Injection Configuration

```typescript
interface MemoryInjectionConfig {
  /** Enable/disable memory injection */
  enabled: boolean;
  /** Maximum memories to inject per conversation */
  maxMemories: number;
  /** Minimum relevance threshold (0-1) */
  relevanceThreshold: number;
  /** Memory types to include */
  memoryTypes: Array<'fact' | 'preference' | 'goal' | 'short-term' | 'long-term'>;
  /** Use conversation context for memory search */
  useConversationContext: boolean;
  /** Maximum age of memories in days */
  maxMemoryAge?: number;
}
```

**Default Configuration**:
```typescript
{
  enabled: true,
  maxMemories: 10,
  relevanceThreshold: 0.3,
  memoryTypes: ['fact', 'preference', 'goal', 'long-term'],
  useConversationContext: true,
  maxMemoryAge: 30
}
```

### Environment Variables

```bash
# Memory system configuration
MEMORY_ENABLED=true
MEMORY_DIR=./memory-data
MEMORY_FORMAT=json
MEMORY_BACKUP=true
MEMORY_MAX_MEMORIES=10
MEMORY_RELEVANCE_THRESHOLD=0.3
```

## Usage Examples

### Basic Memory Operations

```typescript
import { getMemoryService } from './memory';

const memoryService = getMemoryService();

// Create a memory
const memory = await memoryService.remember({
  type: 'fact',
  content: 'User prefers TypeScript for backend development',
  tags: ['programming', 'typescript', 'preferences'],
  metadata: { source: 'user', confidence: 0.9 }
});

// Retrieve a memory
const retrieved = await memoryService.recall(memory.id);

// Search memories
const searchResults = await memoryService.search({
  content: 'TypeScript',
  tags: ['programming'],
  limit: 5
});

// Get recent memories
const recentMemories = await memoryService.getRecent(10);

// Find similar memories
const similarMemories = await memoryService.findSimilar('programming languages', 5);
```

### Memory Types and Use Cases

#### Facts
Store objective information about the user:
```typescript
await memoryService.remember({
  type: 'fact',
  content: 'User is a senior software engineer at TechCorp',
  tags: ['profession', 'company'],
  metadata: { source: 'user' }
});
```

#### Preferences
Store user preferences and choices:
```typescript
await memoryService.remember({
  type: 'preference',
  content: 'User prefers dark mode interfaces',
  tags: ['ui', 'preferences'],
  metadata: { source: 'ai' }
});
```

#### Goals
Store user objectives and aspirations:
```typescript
await memoryService.remember({
  type: 'goal',
  content: 'User wants to learn machine learning by end of year',
  tags: ['learning', 'ml', 'goals'],
  metadata: { source: 'user' }
});
```

#### Short-term Memories
Store temporary context:
```typescript
await memoryService.remember({
  type: 'short-term',
  content: 'User is currently debugging a WebSocket connection issue',
  tags: ['current-task', 'debugging', 'websocket'],
  metadata: { source: 'ai' }
});
```

#### Long-term Memories
Store persistent knowledge:
```typescript
await memoryService.remember({
  type: 'long-term',
  content: 'User has 5+ years experience with Node.js development',
  tags: ['experience', 'nodejs', 'skills'],
  metadata: { source: 'ai' }
});
```

### Memory Evolution

```typescript
// Create memories from conversation
const memories = await memoryService.rememberMultipleFromConversation([
  {
    content: 'User mentioned working on a React project',
    type: 'fact',
    tags: ['current-project', 'react']
  },
  {
    content: 'User prefers functional components over class components',
    type: 'preference',
    tags: ['react', 'programming-style']
  }
], conversationHistory);

// Update memory injection configuration
await memoryService.updateInjectionConfig({
  maxMemories: 15,
  relevanceThreshold: 0.2
});
```

### Memory Analytics

```typescript
// Get comprehensive statistics
const stats = await memoryService.getStats();
console.log(`Total memories: ${stats.total}`);
console.log('By type:', stats.byType);
console.log('Top tags:', stats.topTags);

// Get injection statistics
const injectionStats = await memoryService.getInjectionStats();
console.log('Injection enabled:', injectionStats.enabled);
console.log('Configuration:', injectionStats.config);
```

## API Reference

### MemoryService

The main service class providing high-level memory operations.

#### Methods

##### `remember(options: CreateMemoryOptions): Promise<Memory>`
Create a new memory.

##### `recall(id: string): Promise<Memory | null>`
Retrieve a memory by ID.

##### `search(criteria: MemorySearchCriteria): Promise<MemorySearchResult>`
Search for memories based on criteria.

##### `findSimilar(query: string, topK?: number): Promise<Memory[]>`
Find memories similar to the given query.

##### `getRecent(limit?: number): Promise<Memory[]>`
Get recent memories.

##### `getStats(): Promise<MemoryStats>`
Get memory system statistics.

##### `updateInjectionConfig(config: Partial<MemoryInjectionConfig>): Promise<void>`
Update memory injection configuration.

##### `injectMemories(systemPrompt: string, conversation: Message[]): Promise<string>`
Inject relevant memories into a system prompt.

##### `resetMemories(): Promise<void>`
Reset all memories (use with caution).

### Memory Types

#### Memory
```typescript
interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: string;
  lastAccessed: string;
  metadata: MemoryMetadata;
  tags: string[];
}
```

#### CreateMemoryOptions
```typescript
interface CreateMemoryOptions {
  type: MemoryType;
  content: string;
  metadata?: Partial<MemoryMetadata>;
  tags?: string[];
}
```

#### MemorySearchCriteria
```typescript
interface MemorySearchCriteria {
  type?: MemoryType;
  tags?: string[];
  content?: string;
  source?: MemorySource;
  conversationId?: string;
  limit?: number;
  offset?: number;
}
```

## Integration Guide

### WebSocket Commands

The memory system integrates with the WebSocket interface through commands:

#### `/memory` Command
Shows memory system status and statistics:
```
🧠 Memory System Status:

**Status:** 🟢 Enabled
**Total Memories:** 42
**Memory Types:**
• Facts: 15
• Preferences: 12
• Goals: 8
• Short-term: 4
• Long-term: 3

**Recent Memories (5):**
1. [FACT] User prefers TypeScript over JavaScript for backend...
2. [PREFERENCE] User likes to work late at night, usually after...
3. [GOAL] User wants to build a complete AI assistant with...

**Configuration:**
• Max memories per injection: 10
• Relevance threshold: 0.3
• Memory types: fact, preference, goal, long-term
• Use conversation context: true

💡 Use the memory tool to create, search, and manage memories!
```

#### `/status` Command
Includes memory system status in overall system status.

### Completion Provider Integration

Memory injection is automatically handled by completion providers:

```typescript
// Memory injection happens automatically
const response = await completionProvider.generateText(systemPrompt, conversation);
// The systemPrompt is enhanced with relevant memories before being sent to the AI
```

### Manual Memory Injection

For custom implementations:

```typescript
const memoryInjector = memoryService.getMemoryInjector();
const enhancedPrompt = await memoryInjector.injectMemories(originalPrompt, conversation);
```

## MCP Tool Integration

The memory system exposes functionality through MCP (Model Context Protocol) tools:

### Available MCP Tools

1. **memory-create**: Create new memories
2. **memory-search**: Search existing memories
3. **memory-get**: Retrieve specific memories
4. **memory-stats**: Get memory statistics
5. **memory-config**: Manage memory configuration

### Using MCP Tools

```typescript
// Example MCP tool usage (through MCP client)
const result = await mcpClient.callTool('memory-create', {
  type: 'fact',
  content: 'User completed the onboarding process',
  tags: ['onboarding', 'milestone']
});
```

### MCP Server Configuration

Add to your MCP server configuration:

```json
{
  "memory-server": {
    "command": "node",
    "args": ["./dist/tools/memory-tool.js"],
    "env": {
      "MEMORY_DIR": "./memory-data"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Memory System Not Initializing

**Problem**: Memory service fails to initialize
**Solution**:
1. Check directory permissions for memory storage
2. Verify TypeScript compilation is complete
3. Check for conflicting memory directories

```typescript
// Debug initialization
try {
  const memoryService = await initializeMemoryService();
  console.log('Memory system initialized successfully');
} catch (error) {
  console.error('Initialization failed:', error);
  // Check error.message for specific issues
}
```

#### Memory Injection Not Working

**Problem**: Memories are not being injected into conversations
**Solution**:
1. Verify memory injection is enabled
2. Check relevance threshold settings
3. Ensure memories exist and match conversation context

```typescript
// Debug memory injection
const config = memoryService.getInjectionConfig();
console.log('Injection enabled:', config.enabled);
console.log('Relevance threshold:', config.relevanceThreshold);

const stats = await memoryService.getStats();
console.log('Total memories:', stats.total);
```

#### Poor Memory Retrieval

**Problem**: Relevant memories are not being found
**Solution**:
1. Lower the relevance threshold
2. Add more descriptive tags to memories
3. Use more specific search criteria

```typescript
// Improve memory retrieval
await memoryService.updateInjectionConfig({
  relevanceThreshold: 0.1, // Lower threshold
  maxMemories: 15 // More memories
});
```

#### Performance Issues

**Problem**: Memory operations are slow
**Solution**:
1. Limit memory search scope
2. Use pagination for large result sets
3. Consider memory cleanup for old entries

```typescript
// Optimize memory operations
const recentMemories = await memoryService.getRecent(10); // Limit results
const searchResults = await memoryService.search({
  content: 'query',
  limit: 20 // Limit search results
});
```

### Debug Mode

Enable debug logging:

```typescript
import { logger } from './utils/logger';

// Set log level to debug
logger.level = 'debug';

// Memory operations will now log detailed information
```

### Memory Data Inspection

Inspect memory files directly:

```bash
# View memory files
ls -la ./memory-data/
cat ./memory-data/memories.json

# Check memory statistics
node -e "
const { getMemoryService } = require('./dist/memory');
getMemoryService().then(async service => {
  const stats = await service.getStats();
  console.log(JSON.stringify(stats, null, 2));
});
"
```

## FAQ

### General Questions

**Q: How much storage does the memory system use?**
A: Storage usage depends on the number and size of memories. Typically, each memory uses 1-5KB. For 1000 memories, expect 1-5MB of storage.

**Q: Can I use a database instead of files?**
A: The current implementation uses file storage, but the architecture supports pluggable storage backends. Database support is planned for future releases.

**Q: How does memory injection affect AI response time?**
A: Memory injection adds minimal latency (typically <100ms) as it happens before the AI API call, not during it.

### Technical Questions

**Q: How are memories ranked for injection?**
A: Memories are ranked based on:
1. Content similarity to conversation
2. Tag matching
3. Memory type priority
4. Recency (newer memories get slight boost)

**Q: Can I customize memory injection logic?**
A: Yes, you can extend the `MemoryInjector` class or modify injection configuration to customize behavior.

**Q: How do I backup memory data?**
A: Memory files are stored in the configured directory. Simply backup this directory. The system also creates automatic backups if enabled.

### Integration Questions

**Q: How do I integrate with custom completion providers?**
A: Implement the memory injection interface in your provider:

```typescript
class CustomProvider implements CompletionProvider {
  constructor(private memoryInjector?: MemoryInjector) {}
  
  async generateText(systemPrompt: string, conversation: Message[]): Promise<string> {
    if (this.memoryInjector) {
      systemPrompt = await this.memoryInjector.injectMemories(systemPrompt, conversation);
    }
    // Your provider logic here
  }
}
```

**Q: Can I use the memory system without AI integration?**
A: Yes, the memory system can be used standalone for any application requiring persistent memory storage and retrieval.

## Performance Considerations

### Memory Limits

- **Recommended**: 1,000-10,000 memories for optimal performance
- **Maximum tested**: 100,000 memories (with some performance degradation)
- **Memory per entry**: 1-5KB average

### Optimization Tips

1. **Use appropriate memory types**: Short-term memories for temporary context, long-term for persistent knowledge
2. **Tag strategically**: Use specific, searchable tags for better retrieval
3. **Regular cleanup**: Remove outdated short-term memories
4. **Tune injection settings**: Adjust `maxMemories` and `relevanceThreshold` based on your use case

### Scaling Considerations

For large-scale deployments:

1. **Implement memory archiving**: Move old memories to cold storage
2. **Use memory expiration**: Automatically remove old short-term memories
3. **Consider vector databases**: For semantic similarity search at scale
4. **Implement memory sharding**: Distribute memories across multiple stores

## Security Considerations

### Data Privacy

1. **Sensitive Information**: Be cautious about storing sensitive user data in memories
2. **Data Retention**: Implement appropriate data retention policies
3. **Access Control**: Ensure proper access controls for memory data files

### Best Practices

1. **Encrypt sensitive memories**: Consider encryption for sensitive content
2. **Regular audits**: Review stored memories for privacy compliance
3. **User consent**: Ensure users consent to memory storage
4. **Data minimization**: Store only necessary information

### Configuration Security

```typescript
// Example secure configuration
const memoryService = await initializeMemoryService({
  storeConfig: {
    memoryDir: process.env.SECURE_MEMORY_DIR || './memory-data',
    format: 'json',
    backup: true
  },
  injectionConfig: {
    enabled: process.env.MEMORY_INJECTION_ENABLED === 'true',
    maxMemories: parseInt(process.env.MAX_MEMORIES || '10'),
    relevanceThreshold: parseFloat(process.env.RELEVANCE_THRESHOLD || '0.3')
  }
});
```

---

## Getting Started

To get started with the memory system:

1. **Run the demo**: `npm run memory:demo`
2. **Run integration tests**: `npm run memory:test`
3. **Start the application**: `npm run dev`
4. **Try memory commands**: Use `/memory` in the chat interface

The memory system is now fully integrated and ready for production use!