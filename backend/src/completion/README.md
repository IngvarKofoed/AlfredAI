# Completion Logger

The Completion Logger is a utility for tracking and logging Large Language Model (LLM) interactions. It creates one log file per conversation and stores the raw output of LLM calls for debugging, analysis, and audit purposes.

## Features

- **One log file per conversation**: Each conversation gets its own JSON log file
- **Raw LLM output logging**: Stores the complete raw response from LLM providers
- **Structured logging**: Logs include timestamps, model names, system prompts, and conversation history
- **Automatic directory creation**: Creates logs in a dedicated subfolder using the working directory
- **Error handling**: Gracefully handles file corruption and I/O errors
- **Easy integration**: Can be used with any completion provider
- **Provider-built logging**: Completion providers create their own logger instances

## Usage

### Basic Usage

```typescript
import { createCompletionLogger } from './completion-logger';
import { OpenAICompletionProvider } from './completion-providers/openai-completion-provider';

// Create a completion logger
const logger = createCompletionLogger();

// Create a completion provider (it creates its own logger instance)
const provider = new OpenAICompletionProvider(apiKey, 'gpt-4');

// Generate text with logging
const response = await provider.generateText(
  'You are a helpful assistant.',
  conversation
);
```

### Using Logger via Config

```typescript
// Pass logger via config for custom logging
const response = await provider.generateText(
  'You are a helpful assistant.',
  conversation,
  {
    logger: logger
  }
);
```

### Manual Logging

```typescript
const logger = createCompletionLogger();
const conversationId = logger.generateConversationId();

// Log a completion manually
await logger.logCompletion(
  conversationId,
  'gpt-4',
  'You are a helpful assistant.',
  conversation,
  JSON.stringify(rawResponse, null, 2)
);

// Read logs for this conversation
const logs = await logger.readLogs(conversationId);
```

### Multiple Conversations

```typescript
const logger = createCompletionLogger();

// Generate different conversation IDs
const conversation1Id = logger.generateConversationId();
const conversation2Id = logger.generateConversationId();

// Log completions with specific conversation IDs
await logger.logCompletion(
  conversation1Id,
  'gpt-4',
  'System prompt',
  conversation1,
  'Response 1'
);

await logger.logCompletion(
  conversation2Id,
  'gpt-4',
  'System prompt',
  conversation2,
  'Response 2'
);

// Read logs for each conversation
const logs1 = await logger.readLogs(conversation1Id);
const logs2 = await logger.readLogs(conversation2Id);
```

## Log File Structure

Log files are stored in JSON format with the following structure:

```json
[
  {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "modelName": "gpt-4",
    "systemPrompt": "You are a helpful assistant.",
    "conversation": [
      {
        "role": "user",
        "content": "Hello, how are you?",
        "timestamp": "2024-01-15T10:29:55.000Z",
        "id": "msg-1"
      }
    ],
    "rawResponse": "{\"choices\":[{\"message\":{\"content\":\"Hello! I'm doing well, thank you for asking.\"}}]}",
    "config": {
      "useStreaming": false
    }
  }
]
```

## File Locations

Log files are stored in the following directory structure:
```
{WORKING_DIRECTORY}/logs/completions/
├── conversation-1.json
├── conversation-2.json
└── my-conversation-123.json
```

The working directory is determined by:
1. `WORKING_DIRECTORY` environment variable
2. User's home directory with `.alfred` subfolder
3. Current working directory

## API Reference

### CompletionLogger

#### Constructor
```typescript
new CompletionLogger()
```

#### Methods

- `logCompletion(conversationId, modelName, systemPrompt, conversation, rawResponse, config?)`: Log a completion interaction
- `readLogs(conversationId)`: Read all logs for a conversation
- `clearLogs(conversationId)`: Clear logs for a conversation
- `generateConversationId()`: Generate a unique conversation ID
- `getLogsDirectory()`: Get the logs directory path

### Factory Function

```typescript
createCompletionLogger(): CompletionLogger
```

## Integration with Completion Providers

The completion logger integrates seamlessly with all completion providers:

- **OpenAI**: `OpenAICompletionProvider`
- **Claude**: `ClaudeCompletionProvider`
- **Gemini**: `GeminiCompletionProvider`
- **OpenRouter**: `OpenRouterCompletionProvider`

### Provider Integration Pattern

```typescript
export class MyCompletionProvider implements CompletionProvider {
  private logger: CompletionLogger;

  constructor() {
    // Create logger instance in constructor
    this.logger = new CompletionLogger();
  }

  async generateText(systemPrompt: string, conversation: Message[], config?: GenerateTextConfig): Promise<string> {
    // ... generate response ...
    
    // Log the completion
    const completionLogger = config?.logger || this.logger;
    if (completionLogger) {
      const conversationId = config?.logger ? this.logger.generateConversationId() : 'my-provider-default';
      await completionLogger.logCompletion(
        conversationId,
        this.getModelName?.(),
        systemPrompt,
        conversation,
        JSON.stringify(rawResponse, null, 2),
        config
      );
    }
    
    return content;
  }
}
```

## Error Handling

The logger handles various error scenarios gracefully:

- **File corruption**: Automatically starts fresh if log file is corrupted
- **I/O errors**: Logs warnings but doesn't break the main flow
- **Missing directories**: Automatically creates required directories
- **Permission issues**: Gracefully handles file permission problems

## Testing

Run the completion logger tests:

```bash
npm test -- completion-logger.test.ts
```

## Example

See `completion-logger.example.ts` for complete usage examples. 