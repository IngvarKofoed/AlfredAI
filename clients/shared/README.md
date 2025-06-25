# Alfred AI Shared Client

A shared TypeScript library providing reusable components for Alfred AI clients across different platforms (CLI, Web, Mobile, etc.).

## Features

- **Platform-agnostic WebSocket client** with automatic reconnection
- **Standardized message types** for client-server communication
- **State management utilities** for conversation and connection state
- **Message validation** and type guards for runtime safety
- **TypeScript support** with full type definitions
- **Cross-platform compatibility** (Node.js and Browser environments)

## Installation

```bash
npm install @alfred-ai/shared-client
```

For Node.js environments, you'll also need the `ws` package:

```bash
npm install ws @types/ws
```

## Quick Start

### Basic Usage

```typescript
import { createAlfredClient } from '@alfred-ai/shared-client';

const client = createAlfredClient({
  url: 'ws://localhost:3000',
  persistState: true,
  maxHistoryLength: 1000
});

// Connect to the server
client.connect();

// Send a message
client.sendPrompt('Hello, Alfred!');

// Listen for connection status changes
client.websocket.on('connectionStatusChange', (status) => {
  console.log('Connection status:', status);
});

// Listen for assistant responses
client.websocket.on('message:answerFromAssistant', (answer) => {
  console.log('Assistant:', answer);
});

// Access conversation history
const history = client.state.conversation.getHistory();
console.log('Conversation history:', history);
```

### Advanced Usage

```typescript
import { 
  NodeWebSocketClient, 
  ConversationState, 
  validateWebSocketMessage 
} from '@alfred-ai/shared-client';

// Create a custom WebSocket client
const websocket = new NodeWebSocketClient({
  url: 'ws://localhost:3000',
  reconnectDelayMs: 3000,
  maxReconnectAttempts: 5
});

// Create conversation state manager
const conversation = new ConversationState({
  maxHistoryLength: 500,
  persistState: true
});

// Handle messages with validation
websocket.on('messageReceived', (message) => {
  const validation = validateWebSocketMessage(message);
  if (validation.isValid) {
    console.log('Valid message received:', validation.message);
  } else {
    console.error('Invalid message:', validation.error);
  }
});

// Manual connection management
websocket.connect();
```

## API Reference

### WebSocket Clients

#### BaseWebSocketClient

Abstract base class for WebSocket clients with built-in reconnection logic.

```typescript
abstract class BaseWebSocketClient extends EventEmitter {
  connect(): void;
  disconnect(): void;
  sendMessage(message: ClientToServerMessage): boolean;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;
  destroy(): void;
}
```

#### NodeWebSocketClient

Node.js-specific implementation using the `ws` library.

```typescript
class NodeWebSocketClient extends BaseWebSocketClient {
  // Inherits all BaseWebSocketClient methods
}
```

#### BrowserWebSocketClient

Browser-specific implementation using the native WebSocket API.

```typescript
class BrowserWebSocketClient extends BaseWebSocketClient {
  static isSupported(): boolean;
  getBrowserInfo(): { isSupported: boolean; userAgent?: string };
}
```

### State Management

#### ConversationState

Manages conversation history and thinking state.

```typescript
class ConversationState extends EventEmitter {
  getHistory(): Readonly<HistoryEntry[]>;
  addToHistory(entry: HistoryEntry): void;
  clearHistory(): void;
  getThinkingState(): Readonly<ThinkingState>;
  setThinkingState(thinking: ThinkingState): void;
  handleAssistantAnswer(answer: string): void;
  handleThinkingUpdate(isThinking: boolean, text: string): void;
}
```

#### ClientState

Manages WebSocket connection state and reconnection logic.

```typescript
class ClientState extends EventEmitter {
  isConnected(): boolean;
  isReconnecting(): boolean;
  getReconnectAttempts(): number;
  setConnected(connected: boolean): void;
  incrementReconnectAttempts(): number;
  getConnectionStats(): ConnectionStats;
}
```

### Message Types

All message types are fully typed with TypeScript:

```typescript
// Client to Server
type ClientToServerMessage = 
  | ClientUserMessage 
  | ClientPromptMessage 
  | ClientAnswerMessage 
  | ClientHeartbeatMessage;

// Server to Client
type ServerToClientMessage = 
  | ServerAssistantResponseMessage
  | ServerAnswerFromAssistantMessage
  | ServerThinkingMessage
  | ServerQuestionFromAssistantMessage
  | ServerToolCallFromAssistantMessage
  | ServerErrorMessage;
```

### Validation

Message validation utilities for runtime type safety:

```typescript
import { validateWebSocketMessage, isServerToClientMessage } from '@alfred-ai/shared-client';

const result = validateWebSocketMessage(rawMessage);
if (result.isValid) {
  // Message is valid and typed
  console.log(result.message);
} else {
  console.error(result.error);
}
```

## Events

### WebSocket Client Events

- `connected` - Connection established
- `disconnected` - Connection lost
- `reconnecting` - Attempting to reconnect
- `connectionStatusChange` - Connection status changed
- `messageReceived` - Message received from server
- `messageSent` - Message sent to server
- `error` - Error occurred
- `message:{type}` - Specific message type received (e.g., `message:thinking`)

### State Events

- `historyChanged` - Conversation history updated
- `thinkingChanged` - Thinking state changed
- `connectionStateChanged` - Connection state changed
- `errorOccurred` - Error in state management

## Platform Support

### Node.js

Requires Node.js 16+ and the `ws` package:

```typescript
import { NodeWebSocketClient } from '@alfred-ai/shared-client';
```

### Browser

Works with modern browsers supporting WebSocket API:

```typescript
import { BrowserWebSocketClient } from '@alfred-ai/shared-client';
```

### Auto-detection

The library can automatically detect the platform:

```typescript
import { createWebSocketClient } from '@alfred-ai/shared-client';

// Automatically creates NodeWebSocketClient or BrowserWebSocketClient
const client = createWebSocketClient({ url: 'ws://localhost:3000' });
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.