# Automatic Memory Creation System Architecture

This document outlines the architecture for a secondary AI system, the **Memory Evaluator**, designed to automatically identify and store memorable information about the user from conversations.

## 1. Secondary AI Architecture: The "Memory Evaluator"

The **Memory Evaluator** is a specialized component that runs independently of the primary conversation AI. Its sole responsibility is to analyze conversation turns and decide what is worth remembering.

### Architectural Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Existing System                      │
│  User Message → Primary AI → AI Response               │
│                      ↕                                 │
│                Memory Injector ↔ Memory Store          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              New Automatic Memory System                │
│  Conversation Turn → Memory Evaluator AI →             │
│  Memory Creation Logic → Memory Store                   │
└─────────────────────────────────────────────────────────┘
```

### Key Characteristics:

- **Specialized Model:** Uses a smaller, faster AI model (e.g., Claude 3 Haiku, GPT-3.5-turbo) optimized for classification and extraction
- **Decoupled:** Operates asynchronously to avoid impacting primary AI response time
- **Focused Prompting:** System prompt engineered specifically for identifying and structuring potential memories

## 2. Evaluation Criteria

The Memory Evaluator identifies the following types of information:

- **Personal Facts:** Direct statements of fact about the user (e.g., "I am a software engineer")
- **Preferences:** Explicit likes and dislikes (e.g., "I prefer dark mode")
- **Goals & Aspirations:** Short-term or long-term objectives (e.g., "I want to learn Python")
- **Contextual Information:** Important context for current or future conversations (e.g., "I'm working on a project with a deadline next week")
- **Corrections:** When the user corrects the AI, indicating a previously held belief was wrong

## 3. Integration Points

The new system integrates with the existing `MemoryService` without disrupting current functionality:

- **Input:** Receives conversation turns (user message + AI response) as input
- **Output:** Calls the existing `memoryService.remember()` method when memorable information is identified

## 4. Processing Pipeline

The evaluation happens **asynchronously after each conversation turn** for near real-time memory creation without blocking the primary conversation flow.

### Processing Flow:

1. User sends message
2. Primary AI responds
3. **Asynchronously:** Memory Evaluator analyzes the conversation turn
4. If memorable information is found, create memory via `memoryService.remember()`

### Pipeline Details:

- **Trigger:** Evaluation triggered immediately following completion of a user-AI message exchange
- **Asynchronous:** Runs in separate, non-blocking process to ensure zero impact on AI response time

## 5. Memory Creation Logic

The Memory Evaluator outputs structured JSON that can be directly passed to `memoryService.remember()`:

```json
{
  "type": "preference",
  "content": "User's favorite programming language is TypeScript",
  "tags": ["programming", "typescript", "preferences"],
  "metadata": { "source": "evaluator-ai", "confidence": 0.95 }
}
```

## 6. Context Insertion

Handled by the existing **Memory Injector**. Automatically created memories are stored in the same `Memory Store` and will be available for injection in subsequent conversation turns.

## 7. Performance Considerations

- **Asynchronous Execution:** User never waits for Memory Evaluator
- **Lightweight Model:** Small, fast AI model for quick evaluations
- **Request Throttling:** Optional debounce mechanism for very rapid messages

## 8. Configuration Options

```typescript
interface AutoMemoryConfig {
  /** Enable/disable automatic memory creation */
  enabled: boolean;
  /** AI provider to use for the evaluator */
  provider: string;
  /** Model to use for the evaluator */
  model: string;
  /** Confidence threshold to accept a memory (0-1) */
  confidenceThreshold: number;
}
```

## Implementation Plan

1. Create Memory Evaluator service
2. Design specialized prompts for memory extraction
3. Integrate with existing completion providers
4. Add configuration management
5. Implement asynchronous processing pipeline
6. Add logging and monitoring
7. Create tests and documentation