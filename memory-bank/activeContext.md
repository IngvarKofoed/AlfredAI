# Active Context

This document tracks the current focus of development, recent significant changes, immediate next steps, active decisions, and important learnings or patterns that have emerged.

## Current Work Focus

-   **Task:** Add WebSocket support to the backend server.
-   **Files:** [`backend/src/index.ts`](backend/src/index.ts)
-   **Goal:** Enable real-time bidirectional communication between the client and the server using WebSockets. This has been achieved by integrating the `ws` library, creating an HTTP server to which the WebSocket server is attached, and handling WebSocket connection events.

## Recent Changes

-   **MCP Consumer Tool Restored:** Re-added the `mcpConsumerTool` to `backend/src/tools/mcp-consumer-tool.ts` and integrated it back into the tool registry. This provides a framework for connecting to and interacting with Model Context Protocol (MCP) servers, though the actual protocol implementation is still pending.
-   Added WebSocket support to `backend/src/index.ts`.
-   Installed `ws` and `@types/ws` npm packages.
-   The server now listens using `http.createServer` and the WebSocket server (`wss`) is attached to this HTTP server.
-   Basic WebSocket event handlers for `connection`, `message`, `close`, and `error` have been implemented.
-   Initialized the Memory Bank by creating the core documentation files (`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`).
-   Successfully integrated the `parseAssistantMessage` function into [`backend/src/index.ts`](backend/src/index.ts), exposing a new POST route `/assistant/message`.

## Next Steps

1.  Thoroughly test the WebSocket communication (sending and receiving messages).
2.  Integrate WebSocket message handling with the `parseAssistantMessage` function or other relevant assistant logic.
3.  Define how WebSocket communication will be used by the assistant for both CLI and web-based clients (e.g., for streaming responses, real-time updates, ensuring a common communication interface).
4.  Perform end-to-end testing of the new `/assistant/message` route to ensure the `parseAssistantMessage` function behaves as expected within the application context.
5.  Begin development or refinement of how the `AssistantCore` (or equivalent component) utilizes the parsed message data from HTTP requests.

## Active Decisions & Considerations

-   **XML Parsing Strategy:** The initial regex-based approach for extracting tag names and content has been implemented and unit tested. The tests confirm its behavior for valid and malformed XML, and messages with no XML. Further evaluation is needed to determine if a more robust XML parser library (like `xml2js` or `fast-xml-parser`) is necessary for handling increased complexity or edge cases in the future.

## Important Patterns & Preferences

-   **Memory Bank First:** Always consult and update the Memory Bank before and after significant tasks.
-   **TypeScript for Backend:** Backend logic will be implemented in TypeScript.
-   **Modularity:** Aim for small, well-defined functions and modules.

## Learnings & Project Insights

-   The initial setup of the Memory Bank is crucial for establishing a baseline understanding of the project, even for the AI assistant itself.
-   Clear definition of tasks and next steps in `activeContext.md` helps maintain focus.
-   Unit testing early in the development cycle, as demonstrated with the XML parsing function, significantly improves confidence in the correctness and robustness of core functionalities.