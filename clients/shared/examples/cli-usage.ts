/**
 * Example: How the CLI can use the shared client package
 * This demonstrates migration from the current useWebSocket hook to the shared package
 */

import { createAlfredClient, NodeWebSocketClient, ConversationState } from '../src/index';

// --- Option 1: High-level client (recommended) ---

function createCLIClientHighLevel(socketUrl: string) {
  const client = createAlfredClient({
    url: socketUrl,
    persistState: false, // CLI doesn't need persistence
    maxHistoryLength: 1000,
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 10
  });

  // Wire up CLI-specific handlers
  client.websocket.on('message:thinking', (payload) => {
    console.log(`[THINKING] ${payload.text}`);
  });

  client.websocket.on('message:answerFromAssistant', (answer) => {
    console.log(`[ASSISTANT] ${answer}`);
  });

  client.websocket.on('message:questionFromAssistant', (payload) => {
    console.log(`[QUESTION] ${payload.item}`);
    if (payload.questions) {
      payload.questions.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q}`);
      });
    }
  });

  client.websocket.on('message:toolCallFromAssistant', (payload) => {
    console.log(`[TOOL] ${payload.tool} with parameters:`, payload.parameters);
  });

  client.websocket.on('connectionStatusChange', (status) => {
    console.log(`[CONNECTION] ${status}`);
  });

  client.websocket.on('reconnectCountdown', (seconds) => {
    if (seconds > 0) {
      console.log(`[RECONNECT] Retrying in ${seconds} seconds...`);
    }
  });

  return {
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    sendPrompt: (prompt: string) => client.sendPrompt(prompt),
    sendAnswer: (answer: string) => client.sendAnswer(answer),
    isConnected: () => client.isConnected(),
    getHistory: () => client.state.conversation.getHistory(),
    clearHistory: () => client.clearHistory(),
    getConnectionStatus: () => client.getConnectionStatus(),
    onReconnectCountdown: (callback: (seconds: number) => void) => {
      client.websocket.on('reconnectCountdown', callback);
    },
    destroy: () => client.destroy()
  };
}

// --- Option 2: Custom implementation (for more control) ---

function createCLIClientCustom(socketUrl: string) {
  const websocket = new NodeWebSocketClient({
    url: socketUrl,
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 10
  });

  const conversation = new ConversationState({
    maxHistoryLength: 1000,
    persistState: false
  });

  // Wire up events
  websocket.on('connected', () => {
    console.log('[CONNECTION] Connected to Alfred AI');
  });

  websocket.on('disconnected', () => {
    console.log('[CONNECTION] Disconnected from Alfred AI');
  });

  websocket.on('message:thinking', (payload) => {
    conversation.handleThinkingUpdate(payload.isThinking, payload.text);
    if (payload.isThinking) {
      console.log(`[THINKING] ${payload.text}`);
    }
  });

  websocket.on('message:answerFromAssistant', (answer) => {
    conversation.handleAssistantAnswer(answer);
    console.log(`[ASSISTANT] ${answer}`);
  });

  websocket.on('message:questionFromAssistant', (payload) => {
    conversation.handleAssistantQuestion(payload.item, payload.questions);
    console.log(`[QUESTION] ${payload.item}`);
    if (payload.questions) {
      payload.questions.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q}`);
      });
    }
  });

  websocket.on('message:toolCallFromAssistant', (payload) => {
    conversation.handleToolCall(payload.tool, payload.parameters);
    console.log(`[TOOL] ${payload.tool} with parameters:`, payload.parameters);
  });

  return {
    connect: () => websocket.connect(),
    disconnect: () => websocket.disconnect(),
    sendPrompt: (prompt: string) => {
      conversation.addToHistory(conversation.createUserMessageEntry(prompt));
      return websocket.sendMessage({
        type: 'prompt',
        payload: { prompt }
      });
    },
    sendAnswer: (answer: string) => {
      return websocket.sendMessage({
        type: 'answer',
        payload: { answer }
      });
    },
    isConnected: () => websocket.isConnected(),
    getHistory: () => conversation.getHistory(),
    clearHistory: () => conversation.clearHistory(),
    getConnectionStatus: () => websocket.getConnectionStatus(),
    onReconnectCountdown: (callback: (seconds: number) => void) => {
      websocket.on('reconnectCountdown', callback);
    },
    destroy: () => {
      websocket.destroy();
      conversation.reset();
    }
  };
}

// --- Example usage in CLI application ---

async function main() {
  const socketUrl = 'ws://localhost:3000';
  
  // Using the high-level client
  const client = createCLIClientHighLevel(socketUrl);
  
  // Connect
  client.connect();
  
  // Wait for connection
  await new Promise(resolve => {
    const checkConnection = () => {
      if (client.isConnected()) {
        resolve(void 0);
      } else {
        setTimeout(checkConnection, 100);
      }
    };
    checkConnection();
  });
  
  // Send a message
  client.sendPrompt('Hello, Alfred! How are you today?');
  
  // Show history after some time
  setTimeout(() => {
    const history = client.getHistory();
    console.log('\n--- Conversation History ---');
    history.forEach(entry => {
      switch (entry.type) {
        case 'user':
          console.log(`USER: ${entry.message}`);
          break;
        case 'answer':
          console.log(`ASSISTANT: ${entry.answer}`);
          break;
        case 'tool':
          console.log(`TOOL: ${entry.tool}`);
          break;
        case 'elapsedTime':
          console.log(`⏱ ${entry.seconds}s`);
          break;
      }
    });
  }, 5000);
  
  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    client.destroy();
    process.exit(0);
  });
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createCLIClientHighLevel, createCLIClientCustom };