# Active Context

This document tracks the current focus of development, recent significant changes, immediate next steps, active decisions, and important learnings or patterns that have emerged.

## Current Work Focus

-   **Task:** MCP Server Persistence Implementation Completed
-   **Files:** [`backend/src/utils/mcp-config-manager.ts`](backend/src/utils/mcp-config-manager.ts), [`backend/src/utils/mcp-client-manager.ts`](backend/src/utils/mcp-client-manager.ts), [`backend/src/tools/mcp-consumer-tool.ts`](backend/src/tools/mcp-consumer-tool.ts), [`backend/src/index.ts`](backend/src/index.ts)
-   **Goal:** Ensure MCP server configurations persist across server restarts and auto-reconnect on startup.

## Recent Changes

-   **✅ MCP Server Persistence Implementation Completed:** 
    - Created `MCPConfigManager` class for persistent storage of MCP server configurations
    - Uses JSON file format with `mcpServers` object containing server configurations
    - Configuration file defaults to `backend/mcp-servers.json` in backend directory
    - Each server config includes command, args, and optional env properties
    - Supports loading, saving, adding, and removing server configurations
    - Updated `MCPClientManager` to integrate with persistent storage:
      - Added `initialize()` method to load saved configurations on startup
      - Modified `connectServer()` to optionally save configurations to file
      - Added `removeServer()` method to disconnect and remove from persistent storage
      - Updated `disconnectServer()` with option to preserve or remove config
      - Added methods to get saved configurations and config file path
    - Updated MCP consumer tool with new "remove-server" action
    - Enhanced tool descriptions to reflect persistence capabilities
    - Added auto-initialization in main server startup process
    - Created example configuration file (`backend/mcp-servers.example.json`) showing common server setups
    - Added `.gitignore` entry to prevent committing sensitive configuration files
    - Server configurations now persist across backend server restarts
    - Servers automatically reconnect on startup using saved configurations
-   **✅ /tools Command Added:** 
    - Implemented comprehensive `/tools` command showing both native tools and MCP servers
    - Lists all native tools with names and descriptions (weather, randomNumber, executeCommand, mcpConsumer)
    - Shows MCP server connection status (🟢 Connected / 🔴 Disconnected)
    - Displays tools available from each connected MCP server with descriptions
    - Handles errors gracefully for disconnected or problematic MCP servers
    - Added to CLI autocomplete with description "List all available tools and MCP servers"
    - Updated /help command to include the new /tools option
    - Async handling for MCP server tool queries with proper error handling
-   **✅ Command Autocomplete Added:** 
    - Implemented real-time command autocomplete in CLI when user types '/'
    - Shows all available commands with descriptions in a selection menu
    - Commands auto-complete and execute when selected from the menu
    - Added Escape key support to cancel autocomplete
    - Visual distinction with blue border for command suggestions
    - Integrated seamlessly with existing input handling states
    - Commands list: /clear, /history, /status, /tools, /help with descriptions
-   **✅ Command System Added:** 
    - Implemented command processing in WebSocket message handling
    - Added `/clear` command to clear conversation history with user feedback
    - Added `/history` command to view conversation history (truncated for readability)
    - Added `/status` command to show system information (message count, tools, etc.)
    - Added `/help` command to list all available commands
    - Commands provide immediate feedback without involving the LLM
    - Unknown commands show helpful error messages directing users to /help
-   **✅ Conversation Context Fix Completed:** 
    - Identified root cause: Each user message created a new ButlerTask with fresh conversation history
    - Modified `Client` class to maintain persistent conversation history across tasks
    - Updated `ButlerTask` constructor to accept and use conversation history parameter
    - Updated task factory in `index.ts` to pass conversation history to new tasks
    - Added comprehensive logging to track conversation history management
    - Each WebSocket connection now maintains continuous conversation context
    - Users can now have multi-turn conversations with full context retention
-   **✅ CLI Question Enhancement Completed:** 
    - Enhanced the CLI Shell component to support dual-mode question answering
    - Added "✏️ Type custom answer..." option to question selection menu
    - Implemented custom input mode with proper state management
    - Added Escape key navigation to return from custom input to selection mode
    - Updated UI to clearly distinguish between selection mode (cyan border) and custom input mode (magenta border)
    - Maintained consistent message flow for both selection and custom input paths
-   **✅ MCP Protocol Implementation Completed:** 
    - Installed `@modelcontextprotocol/sdk` dependency
    - Created `MCPClientManager` class in `backend/src/utils/mcp-client-manager.ts` for managing MCP server connections
    - Implemented full MCP protocol communication including:
      - Server connection management with stdio transport
      - Automatic reconnection logic
      - Tool listing and execution
      - Resource discovery and reading
      - Process lifecycle management
    - Updated `backend/src/tools/mcp-consumer-tool.ts` to use real implementations
    - All functions now use actual MCP protocol instead of placeholders
-   **MCP Consumer Tool Restored:** Re-added the `mcpConsumerTool` to `backend/src/tools/mcp-consumer-tool.ts` and integrated it back into the tool registry. This now provides complete MCP server interaction capabilities.
-   Added WebSocket support to `backend/src/index.ts`.
-   Installed `ws` and `@types/ws` npm packages.
-   The server now listens using `http.createServer` and the WebSocket server (`wss`) is attached to this HTTP server.
-   Basic WebSocket event handlers for `connection`, `message`, `close`, and `error` have been implemented.
-   Initialized the Memory Bank by creating the core documentation files (`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`).
-   Successfully integrated the `parseAssistantMessage` function into [`backend/src/index.ts`](backend/src/index.ts), exposing a new POST route `/assistant/message`.

## Next Steps

1.  **Test MCP Persistence:** Test the new MCP server persistence functionality end-to-end by:
    - Connecting to MCP servers using the mcpConsumer tool
    - Restarting the backend server
    - Verifying servers auto-reconnect on startup
    - Testing the remove-server functionality
2.  **Documentation:** Create user documentation for MCP server configuration and management.
3.  **Test /tools Command:** Test the new `/tools` command end-to-end to verify native tool listing and MCP server discovery functionality.
4.  **Test Command Autocomplete:** Test the new '/' autocomplete feature end-to-end in the CLI client.
5.  **Test Command System:** Test all new commands (/clear, /history, /status, /tools, /help) end-to-end with WebSocket clients.
6.  **Test Conversation Context:** Test the conversation context fix end-to-end with multiple user messages to ensure context is maintained.
7.  **Integration Testing:** Verify the fix works with both CLI and web-based clients.
8.  **Session Management:** Consider adding session management features like conversation history persistence to disk or database.
9.  **Test CLI Enhancement:** Test the new dual-mode question answering functionality end-to-end.
10. **Test MCP Implementation:** Test the complete MCP protocol implementation end-to-end with a real MCP server (e.g., filesystem server).
11. **Error Handling Enhancement:** Add more robust error handling and user-friendly error messages.
12. Thoroughly test the WebSocket communication (sending and receiving messages).
13. Integrate WebSocket message handling with the `parseAssistantMessage` function or other relevant assistant logic.
14. Define how WebSocket communication will be used by the assistant for both CLI and web-based clients (e.g., for streaming responses, real-time updates, ensuring a common communication interface).
15. Perform end-to-end testing of the new `/assistant/message` route to ensure the `parseAssistantMessage` function behaves as expected within the application context.
16. Begin development or refinement of how the `AssistantCore` (or equivalent component) utilizes the parsed message data from HTTP requests.

## Active Decisions & Considerations

-   **MCP Configuration Format:** Chose to use the exact format requested by the user with `mcpServers` object structure. This provides a clean, organized way to manage multiple server configurations.
-   **File-based Persistence:** Decided to use JSON file storage for MCP configurations rather than a database. This keeps the solution simple, human-readable, and easily portable.
-   **Security Considerations:** Added configuration file to .gitignore to prevent accidental commits of sensitive API keys or tokens.
-   **Auto-reconnection:** Implemented automatic reconnection on server startup to provide seamless user experience after server restarts.
-   **CLI UX Enhancement:** Implemented dual-mode question answering to provide users with both structured selection and flexible freeform input options. This enhances user experience by not restricting them to only predefined choices.
-   **CLI Navigation:** Used Escape key for returning from custom input to selection mode, providing intuitive navigation within the question-answering interface.
-   **Visual Distinction:** Applied different border colors (cyan for selection, magenta for custom input) to clearly communicate the current interaction mode to users.
-   **MCP Architecture:** Chose to implement MCP client functionality through a centralized `MCPClientManager` class that handles connection lifecycle, reconnection logic, and provides a clean interface for the tool system.
-   **MCP Transport:** Using stdio transport as the primary communication method with MCP servers, which is the standard approach recommended by the MCP specification.
-   **Connection Management:** Implemented automatic reconnection with exponential backoff for robust MCP server connectivity.
-   **XML Parsing Strategy:** The initial regex-based approach for extracting tag names and content has been implemented and unit tested. The tests confirm its behavior for valid and malformed XML, and messages with no XML. Further evaluation is needed to determine if a more robust XML parser library (like `xml2js` or `fast-xml-parser`) is necessary for handling increased complexity or edge cases in the future.

## Important Patterns & Preferences

-   **Configuration Management:** Configuration files should be excluded from version control when they may contain sensitive information. Always provide example files for guidance.
-   **Persistence Strategy:** File-based persistence is appropriate for configuration data that needs to be human-readable and easily managed.
-   **Error Handling:** Graceful degradation when external services (like MCP servers) are unavailable, with proper logging and user feedback.
-   **Autocomplete UX Pattern:** Real-time suggestions improve discoverability and efficiency. Commands should show on-demand help rather than requiring users to remember syntax.
-   **Command System Design:** User commands (prefixed with /) provide immediate system functionality without LLM involvement, ensuring fast response times and consistent behavior.
-   **User Experience First:** Commands include helpful feedback, error messages, and emojis for better user experience.
-   **Memory Bank First:** Always consult and update the Memory Bank before and after significant tasks.
-   **TypeScript for Backend:** Backend logic will be implemented in TypeScript.
-   **Modularity:** Aim for small, well-defined functions and modules.
-   **User Experience Focus:** Prioritize intuitive and flexible user interactions, providing multiple ways to accomplish tasks when beneficial.
-   **Clear Visual Communication:** Use visual cues (colors, borders, text prompts) to clearly communicate interface state and available actions.
-   **MCP Integration:** MCP servers should be treated as external services with proper error handling, connection management, and graceful degradation when unavailable.
-   **Real Protocol Implementation:** Prefer using official SDKs and real protocol implementations over placeholder or mock implementations.

## Learnings & Project Insights

-   The initial setup of the Memory Bank is crucial for establishing a baseline understanding of the project, even for the AI assistant itself.
-   Clear definition of tasks and next steps in `activeContext.md` helps maintain focus.
-   Unit testing early in the development cycle, as demonstrated with the XML parsing function, significantly improves confidence in the correctness and robustness of core functionalities.
-   **MCP Persistence Insights:** File-based configuration persistence provides a good balance between simplicity and functionality. The JSON format is human-readable and easily manageable, while the .gitignore protection prevents security issues.
-   **Configuration Management:** Separation of concerns between connection management and configuration persistence makes the system more maintainable and testable.
-   **Startup Initialization:** Automatic loading and connection of saved servers on startup significantly improves user experience by maintaining state across restarts.
-   **CLI Enhancement Insights:** Adding flexibility to user interaction patterns significantly improves user experience. The dual-mode approach allows power users to quickly select common options while providing escape hatches for edge cases or creative responses.
-   **Ink Framework:** The `useInput` hook provides effective global key handling for navigation, and different visual styling helps users understand interface state changes.
-   **MCP Implementation:** The official `@modelcontextprotocol/sdk` provides excellent TypeScript support and makes implementing the protocol straightforward. The stdio transport is reliable and well-documented.
-   **Event-Driven Architecture:** Using EventEmitter for the MCP client manager allows for clean separation of concerns and enables future features like status monitoring and logging.
