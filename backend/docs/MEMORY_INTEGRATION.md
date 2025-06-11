# Memory System Integration Guide

This document explains how Phase 2 of the memory system integrates with completion providers to enable AI conversations with memory context.

## Overview

Phase 2 of the memory system introduces the **Memory Injector**, which automatically retrieves and injects relevant memories into AI conversations. This allows the AI to remember information about users across sessions and provide more personalized responses.

## Architecture

### Core Components

1. **Memory Injector** (`memory-injector.ts`)
   - Retrieves relevant memories based on conversation context
   - Scores memories for relevance
   - Formats memories for inclusion in system prompts
   - Configurable injection behavior

2. **Memory Service** (`memory-service.ts`)
   - High-level service combining memory manager and injector
   - Provides convenient API for memory operations
   - Handles initialization and configuration

3. **Enhanced Completion Providers**
   - All completion providers now support memory injection
   - Automatically inject memories before AI model calls
   - Graceful fallback if memory injection fails

4. **Enhanced System Prompt Creation**
   - Support for memory context injection
   - Flexible prompt formatting with memory sections
   - Backward compatibility with existing code

## Memory Injection Flow

```
1. User sends message
2. Completion provider receives generateText() call
3. Memory injector analyzes conversation context
4. Relevant memories are retrieved and scored
5. Top memories are formatted and injected into system prompt
6. Enhanced system prompt is sent to AI model
7. AI generates response with memory context
8. Response is returned to user
```

## Configuration

### Memory Injection Configuration

```typescript
interface MemoryInjectionConfig {
  enabled: boolean;                    // Enable/disable memory injection
  maxMemories: number;                 // Max memories to inject (default: 10)
  relevanceThreshold: number;          // Min relevance score (0-1, default: 0.3)
  memoryTypes: MemoryType[];          // Types to include
  useConversationContext: boolean;     // Use conversation for context
  maxMemoryAge?: number;              // Max age in days (optional)
}
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  enabled: true,
  maxMemories: 10,
  relevanceThreshold: 0.3,
  memoryTypes: ['fact', 'preference', 'goal', 'long-term'],
  useConversationContext: true,
  maxMemoryAge: 30
};
```

## Usage Examples

### Basic Integration

```typescript
import { MemoryService, ProviderFactory } from '../memory';

// Initialize memory service
const memoryService = new MemoryService();
await memoryService.initialize();

// Create completion provider with memory injection
const provider = ProviderFactory.createFromEnv('claude', memoryService.getMemoryInjector());

// Use normally - memories are automatically injected
const response = await provider.generateText(systemPrompt, conversation);
```

### Advanced Integration

```typescript
import { MemoryEnabledAI } from '../memory/integration-example';

// Create memory-enabled AI system
const ai = new MemoryEnabledAI('claude', tools);
await ai.initialize();

// Add memories
await ai.addMemory("User is a software developer", 'fact', ['profession']);
await ai.addMemory("User prefers TypeScript", 'preference', ['programming']);

// Generate responses with automatic memory context
const response = await ai.generateResponse(conversation);
```

### Manual Memory Management

```typescript
// Add specific memories
await memoryService.remember({
  type: 'preference',
  content: 'User prefers dark mode interfaces',
  tags: ['ui', 'preference'],
  metadata: { source: 'user' }
});

// Search memories
const results = await memoryService.search({
  content: 'programming',
  limit: 5
});

// Configure injection
await memoryService.updateInjectionConfig({
  maxMemories: 15,
  relevanceThreshold: 0.4
});
```

## Memory Relevance Scoring

The memory injector uses several factors to score memory relevance:

### Context Similarity
- Jaccard similarity between memory content and conversation
- Boost for certain memory types (preferences: +20%, goals: +10%)

### Topic Matching
- Content keyword matching
- Tag matching (higher weight)
- Normalized by number of topics

### Recency
- Recent memories get slight boost
- Configurable maximum age filter

### Memory Type Priority
1. **Preferences** - Highest priority for personalization
2. **Facts** - Important user information
3. **Goals** - User objectives and intentions
4. **Long-term** - Persistent knowledge
5. **Short-term** - Recent context

## Memory Context Format

Memories are injected into the system prompt in a structured format:

```
====

MEMORY CONTEXT

The following information has been remembered from previous interactions with this user. Use this context to provide more personalized and relevant responses:

## Facts About User
- User is a software developer [Tags: profession] (2024-01-15)
- User works with TypeScript and React [Tags: programming, tech-stack] (2024-01-16)

## User Preferences
- User prefers TypeScript over JavaScript [Tags: programming] (2024-01-15)
- User likes dark mode interfaces [Tags: ui, preference] (2024-01-16)

## User Goals
- User wants to learn about AI and machine learning [Tags: learning, ai] (2024-01-15)

====
```

## Integration Points

### Completion Providers

All completion providers now accept an optional `MemoryInjector`:

```typescript
// OpenAI
const provider = new OpenAICompletionProvider(apiKey, model, maxTokens, temperature, memoryInjector);

// Claude
const provider = new ClaudeCompletionProvider(apiKey, model, maxTokens, temperature, memoryInjector);

// Gemini
const provider = new GeminiCompletionProvider(apiKey, model, maxTokens, temperature, memoryInjector);

// OpenRouter
const provider = new OpenRouterCompletionProvider(apiKey, model, maxTokens, temperature, baseURL, memoryInjector);
```

### Provider Factory

The provider factory supports memory injection:

```typescript
const provider = ProviderFactory.createProvider({
  provider: 'claude',
  apiKey: 'your-key',
  memoryInjector: memoryInjector
});
```

### System Prompt Creation

Enhanced system prompt creation with memory support:

```typescript
// Legacy usage (still works)
const prompt = createSystemPrompt(tools);

// New usage with memory context
const prompt = createSystemPrompt({
  tools: tools,
  memoryContext: formattedMemories,
  includeMemorySection: true
});
```

## Error Handling

The memory system is designed to be resilient:

- Memory injection failures don't break AI responses
- Graceful fallback to original system prompt
- Comprehensive logging for debugging
- Configuration validation

## Performance Considerations

### Memory Retrieval
- Efficient similarity search algorithms
- Configurable limits on memory count
- Relevance threshold filtering

### Prompt Size Management
- Limited number of injected memories
- Concise memory formatting
- Configurable memory types

### Caching
- Memory search results can be cached
- Configuration caching
- Conversation context extraction optimization

## Configuration Management

### Environment Variables

```bash
# Memory system
MEMORY_ENABLED=true
MEMORY_DIR=./memory-data
MEMORY_FORMAT=json
MEMORY_BACKUP=true

# Memory injection
MEMORY_INJECTION_ENABLED=true
MEMORY_MAX_INJECT=10
MEMORY_RELEVANCE_THRESHOLD=0.3
```

### Runtime Configuration

```typescript
// Update injection config
await memoryService.updateInjectionConfig({
  enabled: true,
  maxMemories: 15,
  relevanceThreshold: 0.4,
  memoryTypes: ['fact', 'preference', 'goal']
});

// Check current config
const config = memoryService.getInjectionConfig();
```

## Monitoring and Debugging

### Logging

The memory system provides comprehensive logging:

```typescript
// Enable debug logging
logger.setLevel('debug');

// Memory injection logs
// - "Memory injection completed for [provider]"
// - "Injected X memories into system prompt"
// - "No relevant memories found for injection"
```

### Statistics

```typescript
// Get memory statistics
const stats = await memoryService.getStats();
console.log(`Total memories: ${stats.total}`);
console.log(`By type:`, stats.byType);

// Get injection statistics
const injectionStats = await memoryService.getInjectionStats();
console.log(`Injection enabled: ${injectionStats.enabled}`);
```

## Best Practices

### Memory Creation
- Use descriptive content
- Add relevant tags
- Choose appropriate memory types
- Include context in metadata

### Memory Management
- Regular cleanup of old short-term memories
- Monitor memory count and performance
- Use appropriate relevance thresholds

### Integration
- Initialize memory service early in application lifecycle
- Handle memory service failures gracefully
- Configure injection based on use case requirements

### Privacy and Security
- Be mindful of sensitive information in memories
- Implement appropriate access controls
- Consider memory retention policies
- Provide user control over their memories

## Troubleshooting

### Common Issues

1. **Memory injection not working**
   - Check if injection is enabled in config
   - Verify memory service is initialized
   - Check relevance threshold settings

2. **No memories being retrieved**
   - Verify memories exist in store
   - Check memory types configuration
   - Lower relevance threshold for testing

3. **Performance issues**
   - Reduce maxMemories setting
   - Increase relevance threshold
   - Check memory store performance

4. **Memory context too large**
   - Reduce maxMemories
   - Filter memory types
   - Implement memory summarization

### Debug Commands

```typescript
// Check memory service status
console.log('Initialized:', memoryService.isInitialized());
console.log('Injection enabled:', memoryService.isMemoryInjectionEnabled());

// Test memory retrieval
const testMemories = await memoryService.findSimilar('test query', 5);
console.log('Found memories:', testMemories.length);

// Validate configuration
const config = memoryService.getInjectionConfig();
console.log('Config:', config);
```

## Future Enhancements

Phase 2 provides the foundation for future memory system improvements:

- **Vector-based similarity search** for better relevance scoring
- **Memory summarization** to reduce context size
- **Automatic memory extraction** from conversations
- **Memory clustering** and organization
- **Cross-conversation memory sharing**
- **Memory importance scoring** and prioritization

## Conclusion

Phase 2 of the memory system successfully integrates memory capabilities with completion providers, enabling AI conversations with persistent context. The system is designed to be:

- **Easy to integrate** with existing code
- **Configurable** for different use cases
- **Resilient** to failures
- **Performant** for real-time conversations
- **Extensible** for future enhancements

The memory-enabled AI can now remember user preferences, facts, and goals across conversations, providing a more personalized and contextual experience.