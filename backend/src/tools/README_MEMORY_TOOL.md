# Memory MCP Tool Implementation

## Overview

This directory contains the implementation of Phase 3 of the memory system: the Memory MCP Tool for active memory management. This tool allows the AI to actively manage memories during conversations, creating a truly interactive memory system.

## Files

### Core Implementation
- **`memory-tool.ts`** - Main memory tool implementation with all actions
- **`memory-tool-examples.ts`** - Comprehensive usage examples and best practices
- **`memory-tool-test.ts`** - Simple test suite for verification

### Documentation
- **`../docs/MEMORY_TOOL.md`** - Complete tool documentation
- **`README_MEMORY_TOOL.md`** - This file

## Features Implemented

### ✅ Memory Management Actions
- **remember** - Store new memories with type, content, tags, and metadata
- **recall** - Retrieve specific memories by ID
- **update** - Modify existing memories with evolution tracking
- **forget** - Delete specific memories by ID
- **list** - List recent memories with pagination
- **search** - Advanced search with multiple criteria
- **stats** - Comprehensive memory statistics
- **clear** - Reset all memories (with caution)

### ✅ Memory Types Support
- **fact** - Factual information
- **preference** - User preferences and settings
- **goal** - User objectives and targets
- **short-term** - Temporary conversation-relevant information
- **long-term** - Persistent cross-session information

### ✅ Memory Sources
- **user** - Information from user input
- **ai** - AI-inferred information
- **system** - System-generated information

### ✅ Advanced Features
- **Rich Metadata** - JSON-based metadata support
- **Tagging System** - Flexible categorization with comma-separated tags
- **Search Capabilities** - Content, type, tag, and metadata-based search
- **Pagination** - Limit and offset support for large datasets
- **Error Handling** - Comprehensive validation and error reporting
- **Evolution Tracking** - Memory updates with history preservation

## Integration

### Tool Registry
The memory tool is registered in `tool-registry.ts` as `memoryManager`:

```typescript
import { memoryTool } from './memory-tool';

export const toolRegistry = {
    // ... other tools
    memoryManager: memoryTool as Tool,
}
```

### Memory Service Integration
The tool integrates with the existing memory system:

- Uses the global `MemoryService` instance
- Leverages `MemoryManager` for core operations
- Utilizes `FileMemoryStore` for persistence
- Follows established memory type definitions

## Usage Examples

### Basic Operations

```typescript
// Remember a user preference
await memoryTool.execute({
  action: 'remember',
  content: 'User prefers TypeScript over JavaScript',
  type: 'preference',
  tags: 'programming,language-preference,typescript',
  source: 'user'
});

// Search for programming memories
await memoryTool.execute({
  action: 'search',
  tags: 'programming',
  type: 'preference',
  limit: '5'
});

// Get memory statistics
await memoryTool.execute({
  action: 'stats'
});
```

### Advanced Usage

```typescript
// Remember with rich metadata
await memoryTool.execute({
  action: 'remember',
  content: 'User working on React e-commerce project',
  type: 'fact',
  tags: 'project,react,ecommerce',
  source: 'user',
  conversationId: 'conv_123',
  metadata: JSON.stringify({
    importance: 'high',
    status: 'active',
    technologies: ['React', 'Node.js', 'PostgreSQL']
  })
});
```

## Parameter Validation

The tool includes comprehensive parameter validation:

- **Required Parameters** - Validates presence of required fields
- **Type Validation** - Ensures valid memory types and sources
- **Format Validation** - Validates JSON metadata format
- **Range Validation** - Checks numeric limits and offsets
- **Content Validation** - Ensures non-empty content strings

## Error Handling

Robust error handling for various scenarios:

```typescript
// Validation errors
{
  "success": false,
  "error": "Validation error: Memory content is required"
}

// Not found errors
{
  "success": false,
  "error": "Memory with ID 'mem_123' not found"
}

// Type errors
{
  "success": false,
  "error": "Invalid memory type: invalid. Valid types: fact, preference, goal, short-term, long-term"
}
```

## Testing

Run the test suite to verify functionality:

```bash
cd backend
npm run build
node dist/tools/memory-tool-test.js
```

The test covers:
- Basic memory creation
- Memory retrieval and search
- Statistics generation
- Error handling
- Parameter validation

## Performance Considerations

- **Efficient Search** - Optimized search operations with proper indexing
- **Pagination Support** - Handles large memory sets with limit/offset
- **Memory Evolution** - Tracks changes without duplicating data
- **Concurrent Access** - Safe for multiple simultaneous operations

## Security Features

- **Input Sanitization** - All parameters are validated and sanitized
- **Type Safety** - TypeScript ensures type correctness
- **Access Control** - Tool permissions can control memory operations
- **Safe Operations** - Clear action requires explicit confirmation

## Future Enhancements

### Planned Features
- **Vector Search** - Semantic similarity search using embeddings
- **Auto-categorization** - AI-powered automatic tagging and typing
- **Importance Scoring** - Automatic memory importance assessment
- **Context Integration** - Smarter memory creation from conversation context
- **Export/Import** - Memory backup and migration capabilities

### Performance Improvements
- **Caching Layer** - Frequently accessed memories caching
- **Batch Operations** - Multiple memory operations in single call
- **Compression** - Memory content compression for storage efficiency
- **Indexing** - Advanced indexing for faster search operations

## Best Practices

### Memory Creation
1. Choose appropriate memory types based on information nature
2. Use descriptive, consistent tags for better searchability
3. Include relevant metadata for context and filtering
4. Set appropriate source attribution

### Memory Management
1. Regular cleanup of outdated short-term memories
2. Monitor memory statistics to understand usage patterns
3. Use search before creating to avoid duplicates
4. Update existing memories rather than creating duplicates

### Search Optimization
1. Use specific queries for targeted results
2. Combine multiple criteria for precision
3. Leverage pagination for large result sets
4. Use type and tag filters for organized retrieval

## Troubleshooting

### Common Issues

1. **Memory Service Not Initialized**
   - Ensure the memory service is properly initialized
   - Check memory store configuration

2. **Invalid Memory Types**
   - Use only supported types: fact, preference, goal, short-term, long-term
   - Check for typos in type names

3. **JSON Metadata Errors**
   - Ensure metadata is valid JSON format
   - Use JSON.stringify() for complex objects

4. **Search Returns No Results**
   - Check search criteria spelling
   - Verify memory exists with expected tags/content
   - Use broader search terms

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Set environment variable
process.env.DEBUG = 'memory:*';
```

## Contributing

When extending the memory tool:

1. Follow existing code patterns and structure
2. Add comprehensive parameter validation
3. Include proper error handling
4. Update documentation and examples
5. Add tests for new functionality
6. Maintain backward compatibility

## License

This implementation is part of the AlfredAI project and follows the project's licensing terms.