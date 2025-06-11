# AI-Driven Memory Injection System

This document explains how to use the new AI-driven memory injection system that intelligently selects which memories to inject into conversations using AI analysis rather than algorithmic approaches.

## Overview

The AI Memory Selector uses a dedicated AI model to analyze conversation context and available memories, selecting the most relevant ones for injection. This provides more nuanced and context-aware memory selection compared to traditional keyword matching and similarity scoring.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MemoryInjector                      │
│  User Message → AI Memory Selector → AI Response       │
│                      ↕                                 │
│                Memory Store ↔ Memory Store             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              AI Memory Selector Process                │
│  1. Pre-filter Candidate Memories                      │
│  2. Construct Selection Prompt                         │
│  3. Call AI Model (Gemini/Claude/etc.)                 │
│  4. Parse AI Response                                   │
│  5. Return Selected Memories with Scores               │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Basic Configuration

To enable AI-driven memory selection, update your memory injection configuration:

```typescript
const memoryInjectionConfig = {
  enabled: true,
  maxMemories: 10,
  relevanceThreshold: 0.1,
  memoryTypes: ['fact', 'preference', 'goal', 'long-term'],
  useConversationContext: true,
  selectionStrategy: 'ai', // Enable AI selection
  aiSelectorConfig: {
    candidatePoolSize: 40,    // Number of candidate memories to send to AI
    timeout: 800,             // Timeout in milliseconds
    relevanceThreshold: 0.3,  // Minimum relevance score from AI
    maxMemories: 10           // Maximum memories to select
  }
};
```

### JSON Configuration Example

```json
{
  "injection": {
    "enabled": true,
    "maxMemories": 10,
    "relevanceThreshold": 0.1,
    "memoryTypes": ["fact", "preference", "goal", "long-term"],
    "useConversationContext": true,
    "selectionStrategy": "ai",
    "aiSelectorConfig": {
      "candidatePoolSize": 40,
      "timeout": 800,
      "relevanceThreshold": 0.3,
      "maxMemories": 10
    }
  }
}
```

## Usage

### Programmatic Usage

```typescript
import { MemoryInjector, AIMemorySelector } from './memory';
import { ProviderFactory } from '../completion/provider-factory';

// Create memory injector with AI selection
const memoryInjector = new MemoryInjector(memoryManager, {
  selectionStrategy: 'ai',
  aiSelectorConfig: {
    candidatePoolSize: 40,
    timeout: 800,
    relevanceThreshold: 0.3,
    maxMemories: 10
  }
});

// Initialize with completion provider
const completionProvider = ProviderFactory.createFromEnv('gemini');
await memoryInjector.initializeAISelector(completionProvider);

// Use normally - AI selection happens automatically
const enhancedPrompt = await memoryInjector.injectMemories(
  systemPrompt, 
  conversation
);
```

### Direct AI Memory Selector Usage

```typescript
import { AIMemorySelector } from './memory';

// Create and initialize AI selector
const aiSelector = new AIMemorySelector({
  candidatePoolSize: 40,
  timeout: 800,
  relevanceThreshold: 0.3,
  maxMemories: 10
});

await aiSelector.initialize(completionProvider);

// Select memories for a conversation
const selectedMemories = await aiSelector.selectMemories(
  conversation,
  candidateMemories
);

// Each selected memory includes:
// - memory: The Memory object
// - relevanceScore: AI-assigned score (0-1)
// - reason: AI's explanation for selection
```

## AI Selection Process

### 1. Candidate Pre-filtering

The system first creates a manageable set of candidate memories using fast retrieval methods:

- **Similarity Search**: Uses vector similarity on the last user message
- **Recent Memories**: Includes recently created memories as fallback
- **Topic-based Search**: Searches by extracted topics/tags

This reduces the memory set from potentially thousands to 30-50 candidates.

### 2. AI Analysis

The AI model receives:
- **Conversation Context**: Recent conversation history
- **Current Message**: The user's latest message
- **Candidate Memories**: Pre-filtered memory set

### 3. Selection Criteria

The AI evaluates memories based on:
- **Direct Relevance**: How directly the memory relates to the current topic
- **Contextual Importance**: Background information that helps understand the user
- **User Preferences**: Relevant preferences that might influence the response
- **Goal Alignment**: Memories related to the user's stated goals

### 4. Output Format

The AI returns structured JSON:

```json
{
  "selected_memories": [
    {
      "id": "mem_123",
      "relevance_score": 0.95,
      "reason": "Directly relates to user's TypeScript question"
    },
    {
      "id": "mem_456", 
      "relevance_score": 0.7,
      "reason": "User's preference for dark mode is relevant to UI discussion"
    }
  ]
}
```

## Performance Considerations

### Optimization Strategies

1. **Candidate Pre-filtering**: Only 30-50 memories sent to AI, not entire database
2. **Fast Models**: Uses lightweight models (Gemini Flash, Claude Haiku) by default
3. **Aggressive Timeouts**: 800ms timeout with fallback to algorithmic selection
4. **Response Caching**: Caches AI selections to avoid redundant calls

### Fallback Mechanisms

The system automatically falls back to algorithmic selection when:
- AI call times out
- AI returns malformed response
- API errors occur
- AI selector initialization fails

### Performance Monitoring

```typescript
// Monitor AI selector performance
const config = memoryInjector.getConfig();
console.log('Selection strategy:', config.selectionStrategy);

// Check if AI selector is active
if (memoryInjector.aiMemorySelector) {
  console.log('AI selector initialized');
} else {
  console.log('Using algorithmic fallback');
}
```

## Comparison: AI vs Algorithmic Selection

| Aspect | Algorithmic | AI-Driven |
|--------|-------------|-----------|
| **Context Understanding** | Keyword matching, Jaccard similarity | Semantic understanding, context awareness |
| **Relevance Detection** | Pattern matching | Nuanced relevance assessment |
| **Performance** | Very fast (~1-5ms) | Fast with optimization (~100-800ms) |
| **Accuracy** | Good for exact matches | Excellent for contextual relevance |
| **Fallback** | N/A | Automatic fallback to algorithmic |
| **Configuration** | Simple thresholds | AI model parameters |

## Troubleshooting

### Common Issues

1. **AI Selector Not Initializing**
   ```
   Error: Missing API key for gemini
   ```
   **Solution**: Ensure `GOOGLE_AI_API_KEY` environment variable is set

2. **Timeouts**
   ```
   AI memory selection timed out after 800ms
   ```
   **Solution**: Increase timeout in `aiSelectorConfig.timeout` or reduce `candidatePoolSize`

3. **No Memories Selected**
   ```
   AI selected 0 memories from 40 candidates
   ```
   **Solution**: Lower `aiSelectorConfig.relevanceThreshold` or check memory content quality

### Debug Logging

Enable debug logging to monitor AI selection:

```typescript
import { logger } from '../utils/logger';

// Set log level to debug
logger.level = 'debug';

// Monitor memory injection process
const enhancedPrompt = await memoryInjector.injectMemories(systemPrompt, conversation);
```

### Testing

Run the test script to verify functionality:

```bash
cd backend
node test-ai-memory-injection.js
```

This will test both algorithmic and AI selection strategies with sample data.

## Best Practices

### 1. Memory Quality
- Write clear, descriptive memory content
- Use relevant tags for better candidate pre-filtering
- Keep memories focused and specific

### 2. Configuration Tuning
- Start with default settings
- Adjust `candidatePoolSize` based on memory database size
- Tune `relevanceThreshold` based on selection quality
- Monitor timeout rates and adjust accordingly

### 3. Monitoring
- Log AI selection performance
- Monitor fallback rates
- Track memory injection effectiveness

### 4. Gradual Rollout
- Start with `selectionStrategy: 'algorithmic'`
- Test AI selection in development
- Gradually enable for production users

## Future Enhancements

- **Caching**: Implement intelligent caching of AI selections
- **Model Selection**: Support for different AI models per use case
- **Batch Processing**: Process multiple conversations simultaneously
- **Learning**: Adapt selection based on user feedback
- **Metrics**: Detailed analytics on selection quality and performance