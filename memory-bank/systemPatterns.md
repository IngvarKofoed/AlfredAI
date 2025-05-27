# System Patterns

This document outlines the system architecture, key technical decisions, design patterns in use, component relationships, and critical implementation paths for the AI assistant project.

## System Architecture (Conceptual)

```mermaid
graph TD
    UserCLI[User (CLI)] -->|WebSocket| AssistantCore
    UserWeb[User (Web Interface)] -->|WebSocket| AssistantCore
    AssistantCore -->|Message| MessageParser
    MessageParser -->|ParsedData| IntentRecognizer
    IntentRecognizer -->|ActionRequest| ToolExecutor
    ToolExecutor -->|ToolName, Params| ToolInterface
    ToolInterface -->|Executes| SpecificTool[Specific Tool (e.g., CodeSearch, FileEdit)]
    SpecificTool -->|Result| ToolInterface
    ToolInterface -->|ToolOutput| AssistantCore
    AssistantCore -->|Updates| MemoryBank
    MemoryBank -->|Context| AssistantCore
    AssistantCore -->|Response/WebSocket| UserCLI
    AssistantCore -->|Response/WebSocket| UserWeb

    subgraph Tools
        SpecificTool
    end
```

**Components:**

-   **User (CLI/Web):** The developer interacting with the assistant via either a Command Line Interface or a Web Interface. Both will use WebSockets.
-   **Assistant Core:** Main orchestrator. Handles message flow, maintains state, and interacts with other components.
-   **Message Parser:** Responsible for initial processing of user input. The current task of XML parsing fits here.
-   **Intent Recognizer:** (Future component) Analyzes parsed data to determine user's goal or requested action.
-   **Tool Executor:** Manages the execution of available tools based on recognized intent.
-   **Tool Interface:** An abstraction layer for different tools, providing a consistent way for the Tool Executor to interact with them.
-   **Specific Tools:** Individual modules that perform specific tasks (e.g., `codebase_search`, `edit_file`, `run_terminal_cmd`).
-   **Memory Bank:** Persistent storage for project context, learnings, and history. Crucial for the assistant's long-term effectiveness.

## Key Technical Decisions

-   **Backend Language:** TypeScript with Node.js. Chosen for its strong typing, scalability, and suitability for I/O-bound operations typical in assistant applications.
-   **Communication Protocols:** HTTP (for standard requests) and WebSockets (for real-time bidirectional communication).
-   **Memory Bank Format:** Markdown files. Chosen for human-readability and ease of editing, with a structured approach to content.
-   **Modularity:** The system is designed as a set of loosely coupled modules to enhance maintainability and allow for easier extension with new tools or capabilities.

## Design Patterns in Use (Anticipated)

-   **Command Pattern:** Tool execution can be modeled using the command pattern, encapsulating a request as an object.
-   **Strategy Pattern:** Different parsing strategies (e.g., regex, library-based) for messages or different approaches to intent recognition could be implemented using the strategy pattern.
-   **Observer Pattern:** The Memory Bank could notify relevant components (like the Assistant Core) of updates.
-   **Facade Pattern:** The `ToolInterface` can act as a facade to simplify interactions with a diverse set of underlying tools.

## Component Relationships

-   The `AssistantCore` is central, coordinating activities.
-   The `MessageParser` is an early-stage component in the input processing pipeline.
-   `Tools` are invoked by the `ToolExecutor` through a common `ToolInterface`.
-   The `MemoryBank` is accessed and updated by the `AssistantCore` to provide context and store learnings.

## Critical Implementation Paths

1.  **Core Message Handling:** Robust parsing of user messages (including the current XML parsing task) via HTTP and WebSockets.
2.  **Tool Integration Framework:** A flexible way to define, register, and execute tools.
3.  **Memory Bank Management:** Effective mechanisms for reading, writing, and updating the Memory Bank documents.
4.  **Real-time Communication:** Establishing and managing WebSocket connections for features requiring immediate feedback or asynchronous updates. 