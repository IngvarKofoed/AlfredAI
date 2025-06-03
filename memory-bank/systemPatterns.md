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
        MCPConsumerTool[MCP Consumer Tool]
    end
    
    subgraph MCPSubsystem[MCP Subsystem]
        MCPConsumerTool -->|Commands| MCPClientManager[MCP Client Manager]
        MCPClientManager -->|stdio| MCPServer1[MCP Server 1]
        MCPClientManager -->|stdio| MCPServer2[MCP Server 2]
        MCPClientManager -->|stdio| MCPServerN[MCP Server N...]
        
        MCPServer1 -->|Tools/Resources| MCPClientManager
        MCPServer2 -->|Tools/Resources| MCPClientManager
        MCPServerN -->|Tools/Resources| MCPClientManager
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
-   **MCP Consumer Tool:** Specialized tool that provides access to Model Context Protocol servers and their capabilities.
-   **MCP Client Manager:** Centralized manager for MCP server connections, handling lifecycle, reconnection, and protocol communication.
-   **MCP Servers:** External MCP-compliant servers that provide tools and resources (e.g., filesystem access, database queries, API integrations).
-   **Memory Bank:** Persistent storage for project context, learnings, and history. Crucial for the assistant's long-term effectiveness.

## Key Technical Decisions

-   **Backend Language:** TypeScript with Node.js. Chosen for its strong typing, scalability, and suitability for I/O-bound operations typical in assistant applications.
-   **Communication Protocols:** HTTP (for standard requests) and WebSockets (for real-time bidirectional communication).
-   **MCP Protocol Implementation:** Using official `@modelcontextprotocol/sdk` with stdio transport for robust, standards-compliant MCP communication.
-   **MCP Architecture:** Centralized connection management through `MCPClientManager` class with automatic reconnection and event-driven communication.
-   **Memory Bank Format:** Markdown files. Chosen for human-readability and ease of editing, with a structured approach to content.
-   **Modularity:** The system is designed as a set of loosely coupled modules to enhance maintainability and allow for easier extension with new tools or capabilities.

## Design Patterns in Use

-   **Command Pattern:** Tool execution can be modeled using the command pattern, encapsulating a request as an object.
-   **Strategy Pattern:** Different parsing strategies (e.g., regex, library-based) for messages or different approaches to intent recognition could be implemented using the strategy pattern.
-   **Observer Pattern:** The Memory Bank could notify relevant components (like the Assistant Core) of updates. The MCP Client Manager uses EventEmitter for connection state notifications.
-   **Facade Pattern:** The `ToolInterface` acts as a facade to simplify interactions with a diverse set of underlying tools.
-   **Manager Pattern:** The `MCPClientManager` implements the manager pattern to handle multiple MCP server connections and their lifecycle.
-   **Singleton Pattern:** The `mcpClientManager` is exported as a singleton instance to ensure consistent connection management across the application.

## Component Relationships

-   The `AssistantCore` is central, coordinating activities.
-   The `MessageParser` is an early-stage component in the input processing pipeline.
-   `Tools` are invoked by the `ToolExecutor` through a common `ToolInterface`.
-   The `MCPConsumerTool` acts as a bridge between the tool system and the MCP subsystem.
-   The `MCPClientManager` maintains connections to multiple MCP servers and provides a unified interface for tool execution and resource access.
-   The `MemoryBank` is accessed and updated by the `AssistantCore` to provide context and store learnings.

## Critical Implementation Paths

1.  **Core Message Handling:** Robust parsing of user messages (including the current XML parsing task) via HTTP and WebSockets.
2.  **Tool Integration Framework:** A flexible way to define, register, and execute tools.
3.  **MCP Integration:** Complete Model Context Protocol implementation enabling connection to external MCP servers and access to their tools and resources.
4.  **Memory Bank Management:** Effective mechanisms for reading, writing, and updating the Memory Bank documents.
5.  **Real-time Communication:** Establishing and managing WebSocket connections for features requiring immediate feedback or asynchronous updates.
6.  **MCP Connection Management:** Robust handling of MCP server connections including automatic reconnection, error recovery, and process lifecycle management. 