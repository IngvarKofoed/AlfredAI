# Active Context

This document tracks the current focus of development, recent significant changes, immediate next steps, active decisions, and important learnings or patterns that have emerged.

## Current Work Focus

-   **Task:** Enhanced CLI client question handling to support both selection and freeform input.
-   **Files:** [`cli/src/shell.tsx`](cli/src/shell.tsx)
-   **Goal:** Allow users to either select from predefined questions or type custom answers when the AI provides question options.

## Recent Changes

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

1.  **Test CLI Enhancement:** Test the new dual-mode question answering functionality end-to-end.
2.  **Integration Testing:** Ensure the enhanced CLI works smoothly with the backend WebSocket communication.
3.  **Test MCP Implementation:** Test the complete MCP protocol implementation end-to-end with a real MCP server (e.g., filesystem server).
4.  **Integration Testing:** Ensure MCP operations work smoothly within the existing WebSocket and HTTP frameworks.
5.  **Documentation:** Create examples and usage documentation for the MCP integration.
6.  **Error Handling Enhancement:** Add more robust error handling and user-friendly error messages.
7.  **MCP Server Configuration:** Consider adding persistent configuration storage for MCP servers.
8.  Thoroughly test the WebSocket communication (sending and receiving messages).
9.  Integrate WebSocket message handling with the `parseAssistantMessage` function or other relevant assistant logic.
10. Define how WebSocket communication will be used by the assistant for both CLI and web-based clients (e.g., for streaming responses, real-time updates, ensuring a common communication interface).
11. Perform end-to-end testing of the new `/assistant/message` route to ensure the `parseAssistantMessage` function behaves as expected within the application context.
12. Begin development or refinement of how the `AssistantCore` (or equivalent component) utilizes the parsed message data from HTTP requests.

## Active Decisions & Considerations

-   **CLI UX Enhancement:** Implemented dual-mode question answering to provide users with both structured selection and flexible freeform input options. This enhances user experience by not restricting them to only predefined choices.
-   **CLI Navigation:** Used Escape key for returning from custom input to selection mode, providing intuitive navigation within the question-answering interface.
-   **Visual Distinction:** Applied different border colors (cyan for selection, magenta for custom input) to clearly communicate the current interaction mode to users.
-   **MCP Architecture:** Chose to implement MCP client functionality through a centralized `MCPClientManager` class that handles connection lifecycle, reconnection logic, and provides a clean interface for the tool system.
-   **MCP Transport:** Using stdio transport as the primary communication method with MCP servers, which is the standard approach recommended by the MCP specification.
-   **Connection Management:** Implemented automatic reconnection with exponential backoff for robust MCP server connectivity.
-   **XML Parsing Strategy:** The initial regex-based approach for extracting tag names and content has been implemented and unit tested. The tests confirm its behavior for valid and malformed XML, and messages with no XML. Further evaluation is needed to determine if a more robust XML parser library (like `xml2js` or `fast-xml-parser`) is necessary for handling increased complexity or edge cases in the future.

## Important Patterns & Preferences

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
-   **CLI Enhancement Insights:** Adding flexibility to user interaction patterns significantly improves user experience. The dual-mode approach allows power users to quickly select common options while providing escape hatches for edge cases or creative responses.
-   **Ink Framework:** The `useInput` hook provides effective global key handling for navigation, and different visual styling helps users understand interface state changes.
-   **MCP Implementation:** The official `@modelcontextprotocol/sdk` provides excellent TypeScript support and makes implementing the protocol straightforward. The stdio transport is reliable and well-documented.
-   **Event-Driven Architecture:** Using EventEmitter for the MCP client manager allows for clean separation of concerns and enables future features like status monitoring and logging.
