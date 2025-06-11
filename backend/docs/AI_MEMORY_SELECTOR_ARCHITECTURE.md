# AI-Driven Memory Injection: Architectural Design

The goal of this proposal is to evolve the current algorithmic memory selection process into an intelligent, context-aware system powered by a dedicated AI model. This new component, the **AI Memory Selector**, will work in concert with the existing `MemoryInjector` to provide more nuanced and relevant memories to the primary AI, leading to more personalized and accurate conversations.

### 1. Proposed Architecture: The AI Memory Selector

We will introduce a new component, the `AIMemorySelector`, which will be responsible for the intelligent selection of memories. This component will be invoked by the `MemoryInjector` when the configuration is set to use the AI-driven strategy.

The new architecture can be visualized as follows:

```mermaid
graph TD
    subgraph MemoryInjector
        A[injectMemories] --> B{Selection Strategy?};
        B --o "algorithmic" --> C[Current Algorithmic Selection];
        B --o "ai" --> D[AI Memory Selector];
        C --> E[Format Memories];
        D --> E;
        E --> F[Inject into Prompt];
    end

    subgraph AIMemorySelector
        D --> G[1. Pre-filter Candidate Memories];
        G --> H[2. Construct Selection Prompt];
        H --> I[3. Call AI Model];
        I --> J[4. Parse AI Response];
        J --> K{Success?};
        K --o Yes --> D;
        K --o No --> L[Fallback to Algorithmic];
        L --> C;
    end

    subgraph External Services
        M[Memory Store] <--> G;
        N[AI Provider e.g., Gemini] <--> I;
    end

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style L fill:#f9f,stroke:#333,stroke-width:2px
```

### 2. AI-Driven Memory Selection & Integration

The `AIMemorySelector` will be a new class that encapsulates the logic for AI-based selection. The existing `MemoryInjector` will be modified to support this new strategy.

#### `AIMemorySelector` Class

This class will be responsible for:
1.  **Receiving Context**: Takes the conversation history and a list of pre-filtered candidate memories from the `MemoryInjector`.
2.  **Prompt Construction**: Dynamically builds a specialized prompt for the selection task.
3.  **AI Invocation**: Calls the configured AI model (defaulting to the primary conversational model) with the prompt.
4.  **Response Parsing**: Parses the structured JSON output from the AI, which contains the selected memory IDs, relevance scores, and reasoning.
5.  **Error Handling**: Manages timeouts, API errors, and malformed responses, triggering the fallback mechanism when necessary.

#### Integration with `MemoryInjector`

The integration will be seamless and controlled by configuration:

1.  A new `selectionStrategy` property (`'algorithmic' | 'ai'`) will be added to the `MemoryInjectionConfig`.
2.  The `MemoryInjector.retrieveRelevantMemories` method will be updated:
    *   If `selectionStrategy` is `'algorithmic'`, the existing logic runs.
    *   If `selectionStrategy` is `'ai'`, it will:
        a.  Perform a broad, initial retrieval of **candidate memories** from the `MemoryManager` (e.g., using vector search on the last user message to get the top 30-50 candidates). This avoids sending the entire memory database to the AI.
        b.  Instantiate and invoke the `AIMemorySelector` with the conversation context and the candidate memories.
        c.  Receive the AI-scored memories back and proceed with formatting and injection.

### 3. Selection Prompt Design

The effectiveness of the `AIMemorySelector` hinges on a well-designed prompt. The prompt will instruct the AI to act as a relevance-ranking expert.

**Example Prompt Structure:**

```text
You are an AI assistant's "memory expert." Your task is to analyze a conversation and a list of available memories about the user. Select the memories that are most relevant to the current conversation context. Your goal is to provide the main AI with the best possible context to generate a personalized and helpful response.

**Conversation History (Last 3 turns):**
User: "I'm stuck on that project I mentioned. The deadline is approaching."
AI: "I remember you said the deadline for 'Project Phoenix' is next Friday. What specific issues are you facing?"
User: "I can't get the authentication flow to work with the new dark mode preference I have."

**Available Memories (Candidate Set):**
[
  { "id": "mem_101", "type": "goal", "content": "User wants to finish 'Project Phoenix' by next week." },
  { "id": "mem_102", "type": "preference", "content": "User prefers dark mode for all applications." },
  { "id": "mem_103", "type": "fact", "content": "User is a software engineer specializing in frontend development." },
  { "id": "mem_104", "type": "fact", "content": "User's favorite color is blue." }
]

**Your Task:**
Review the conversation and the available memories. Identify which memories are relevant to the user's last message. For each relevant memory, provide a relevance score from 0.0 to 1.0 and a brief justification.

**Output Format (JSON only):**
{
  "selected_memories": [
    {
      "id": "mem_101",
      "relevance_score": 0.95,
      "reason": "Directly relates to the user's mention of the project deadline."
    },
    {
      "id": "mem_102",
      "relevance_score": 0.9,
      "reason": "Relevant to the user's technical problem involving 'dark mode preference'."
    },
    {
      "id": "mem_103",
      "relevance_score": 0.6,
      "reason": "Provides general context about the user's profession, which is moderately relevant to the technical problem."
    }
  ]
}
```

### 4. Performance Considerations

Since memory injection is on the critical path of generating a response, performance is paramount.

1.  **Synchronous Execution**: Unlike the `MemoryEvaluator`, this process must complete before the primary AI is called.
2.  **Model Choice**: The system will default to the primary AI model (e.g., Gemini), which has proven fast enough for this task. An optional, lighter-weight model can be configured for environments requiring maximum performance.
3.  **Candidate Pre-filtering**: The most critical optimization. Instead of sending all memories to the AI, we first create a smaller candidate set (30-50 memories) using a fast retrieval method like vector search. The AI then performs the nuanced ranking on this manageable set.
4.  **Strict Timeouts**: Implement an aggressive timeout (e.g., 500-800ms) for the AI call. If it fails to respond in time, the system immediately uses the fallback.
5.  **Response Caching**: Cache the AI's selection. The cache key can be a hash of the last user message and the list of candidate memory IDs. This can prevent redundant AI calls if the user asks a follow-up question on the same topic.

### 5. Fallback Mechanisms

Robust fallbacks are essential to ensure system reliability.

1.  **AI Failure**: If the AI call results in an API error (e.g., 500, 503), the system will log the error and seamlessly revert to the **existing algorithmic selection method** for that turn.
2.  **Timeout**: If the AI call exceeds the configured timeout, it will revert to the algorithmic method.
3.  **Malformed Response**: If the AI returns a response that is not valid JSON or does not match the expected schema, it will revert to the algorithmic method.

### 6. Configuration Options

The `MemoryInjectionConfig` will be extended to control the new system:

```typescript
export interface MemoryInjectionConfig {
  // --- Existing Config ---
  enabled: boolean;
  maxMemories: number;
  relevanceThreshold: number; // Used by algorithmic fallback
  // ...

  // --- New AI Selector Config ---
  /** The selection strategy to use: 'algorithmic' or 'ai' */
  selectionStrategy: 'algorithmic' | 'ai';
  
  /** AI provider for the memory selector. Defaults to the primary provider if not set. */
  aiSelectorProvider?: string;
  
  /** AI model for the memory selector. Defaults to the primary model if not set. */
  aiSelectorModel?: string;
  
  /** The number of candidate memories to send to the AI for ranking */
  aiCandidatePoolSize?: number;
  
  /** Timeout in milliseconds for the AI selection call */
aiSelectorTimeout?: number;
}
```

### 7. Comparison Logic

The comparison logic is offloaded to the AI, guided by the prompt. The AI will naturally handle:

*   **Semantic Relevance**: Understanding that "I'm stuck on that project" relates to a memory about "Project Phoenix" without needing an exact keyword match.
*   **Contextual Nuance**: Recognizing that a memory about the user's profession is relevant to a technical problem.
*   **Implicit Connections**: Linking a "dark mode preference" memory to a technical issue about "authentication flow."

The AI's output, with a `relevance_score` and `reason` for each memory, makes the comparison transparent and directly usable by the `MemoryInjector` for filtering and ranking.