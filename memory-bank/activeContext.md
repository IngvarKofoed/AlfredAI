# Active Context

This document tracks the current focus of development, recent significant changes, immediate next steps, active decisions, and important learnings or patterns that have emerged.

## Current Work Focus

-   **Task:** Command Parser Dynamic Schema Fix - Completed
-   **Files:** [`backend/src/utils/command-parser.ts`](backend/src/utils/command-parser.ts), [`backend/src/commands/command-service.ts`](backend/src/commands/command-service.ts)
-   **Goal:** Fixed command parser to work with dynamic schema system where commands use `getSchema()` method instead of static `schema` property.

## Recent Changes

-   **✅ Python Tool Implementation Completed:**
    - Created comprehensive `pythonTool` in `backend/src/tools/python/python-tool.ts` for executing Python scripts
    - Supports both Python code snippets and file paths as input
    - Handles command-line arguments and working directory specification
    - Implements security checks to prevent dangerous operations (os.system, subprocess, eval, exec, file writes)
    - Creates temporary files for code snippets with automatic cleanup
    - Returns both stdout and stderr in structured format
    - Includes comprehensive error handling and logging
    - Added tool to tool registry and created index file for clean imports
    - All TypeScript compilation successful with no errors
    - End-to-end testing completed successfully with various Python code examples
    - Tool follows established patterns from other tools in the system

-   **✅ Command Parser Dynamic Schema Fix Completed:**
    - Updated `parseCommandArguments()` function to be async and call `command.getSchema(context)` instead of accessing static `command.schema`
    - Updated `validateCommandArguments()` function to be async and handle dynamic schema generation
    - Modified `CommandService.executeCommandString()` to await the async parser functions
    - Added optional `context` parameter to both parser functions for dynamic schema generation
    - Fixed all TypeScript compilation errors related to missing `schema` property on Command interface
    - All TypeScript compilation successful with no errors
    - Command parser now fully supports the dynamic schema system implemented earlier

-   **✅ Dynamic Command Schema Implementation Completed:**
    - Added `getSchema()` method to `Command` interface in `backend/src/types/command.ts` for dynamic schema generation
    - Updated `CommandService` with `getCommandSchema()` method to handle dynamic schema requests
    - Added WebSocket message handling for `schema-request` and `schema-response` in `backend/src/index.ts`
    - Enhanced CLI WebSocket hook with `requestSchema()` function and schema response handling
    - Updated CLI command selection logic to request dynamic schemas before showing input wizard
    - Modified `ExampleCommand` to demonstrate dynamic schema generation based on file system state
    - Dynamic schema includes file choices from current directory and context-aware options
    - Added fallback to static schema if dynamic generation fails
    - All TypeScript compilation successful with no errors
    - Commands can now generate different schemas based on runtime conditions (files, permissions, etc.)

-   **✅ Elapsed Time History Entry Feature Completed:**
    - Added `ElapsedTimeHistoryEntry` interface to `cli/src/types.ts` with `type: 'elapsedTime'` and `seconds: number`
    - Created `createElapsedTimeEntry()` utility function for creating elapsed time history entries
    - Updated `HistoryEntry` union type to include the new elapsed time entry type
    - Enhanced `renderHistoryEntry()` in `cli/src/shell.tsx` to display elapsed time entries in gray color with stopwatch emoji
    - Modified `cli/src/hooks/useWebSocket.ts` to add elapsed time entry after each answer from assistant
    - Elapsed time is calculated from the thinking state's startTime when answer is received
    - Added thinking state access to WebSocket hook to calculate elapsed time
    - All TypeScript compilation successful with no errors
    - Provides permanent record of processing time for each AI response in conversation history
-   **✅ Thinking Elapsed Time Feature Completed:**
    - Added `startTime` field to `ThinkingState` interface in `cli/src/state/context.tsx`
    - Implemented elapsed time tracking in `cli/src/shell.tsx` with `useEffect` and `setInterval`
    - Updated thinking box UI to display elapsed time at the bottom in dimmed gray color
    - Modified `cli/src/hooks/useWebSocket.ts` to set `startTime` when thinking begins and clear it when thinking stops
    - Timer starts at 0 seconds when `isThinking` becomes true and updates every second
    - Timer automatically resets when thinking stops or on connection errors
    - All TypeScript compilation successful with no errors
    - Provides real-time feedback on how long the AI has been processing
-   **✅ Browser Action Enhancement Completed:**
    - Modified `browserActionTool` to store webpage content in memory instead of returning large HTML responses
    - Added new `askQuestion` action that uses Gemini completion provider to answer questions about stored webpage content
    - Updated all browser actions (launch, navigate, scroll_down, scroll_up) to return short confirmation messages
    - Implemented webpage content storage using the memory system with appropriate tags and metadata
    - Added Gemini provider initialization for question answering functionality
    - Enhanced tool description and examples to include the new askQuestion action
    - Added proper validation for askQuestion action parameters
    - Implemented content clearing when browser is closed
    - All TypeScript compilation successful with no errors
    - Reduces response size significantly while maintaining full functionality through memory storage
-   **✅ Redundant isActive Field Removal Completed:**
    - Removed `isActive: boolean` field from `AIPersonality` interface - no longer needed since `activePersonalityId` already tracks the active personality
    - Updated `PersonalityManager.setActivePersonality()` to only set `activePersonalityId` instead of manipulating multiple `isActive` flags
    - Updated `PersonalityManager.clearActivePersonality()` to only clear `activePersonalityId`
    - Fixed all references in `personality-tool.ts` to use `activePersonalityId` comparison instead of `isActive` field
    - Updated default personality creation to not include `isActive` field
    - Cleaned up preset definitions to remove `isActive: false` assignments
    - Updated example JSON file to remove all `isActive` fields
    - All active personality detection now uses consistent `personalityId === activePersonalityId` pattern
    - Improved data model consistency and reduced storage redundancy
    - All TypeScript compilation successful with no errors
-   **✅ Default Personality Implementation Completed:**
    - Updated `createPersonalityPrompt()` to always return a personality configuration (never empty string)
    - Added `getDefaultPersonality()` function that provides a balanced, helpful assistant personality as fallback
    - Default personality features: friendly tone, direct communication, moderate verbosity, semi-formal style
    - Ensures consistent AI behavior even when no specific personality is active
    - Removed debug console.log statement
    - All TypeScript compilation successful with no errors
    - System now guarantees personality-driven responses in all scenarios
-   **✅ AI Personality System Architecture Refactoring Completed:**
    - Refactored `createPersonalityPrompt()` to take no arguments and internally fetch the active personality using `personalityManager.getActivePersonality()`
    - Removed personality parameter from `createSystemPrompt()` function signature
    - Eliminated conditional check `${personality ? createPersonalityPrompt(personality) : ''}` in favor of simple `${createPersonalityPrompt()}`
    - Updated `ButlerTask` to remove personality fetching logic - now simply calls `createSystemPrompt(this.tools)`
    - Improved single responsibility principle - personality prompt function now owns its data fetching
    - Reduced code complexity and eliminated unnecessary parameter passing
    - All TypeScript compilation successful with no errors
    - This follows the same pattern as other prompt functions that handle their own concerns internally
-   **✅ AI Personality System Implementation Completed:** 
    - Created comprehensive personality type definitions in `backend/src/types/personality.ts` with rich personality configuration options
    - Implemented `PersonalityManager` class in `backend/src/utils/personality-manager.ts` for persistent storage and management of AI personalities
    - Built comprehensive `personalityTool` in `backend/src/tools/personality-tool.ts` with 13 different actions for complete personality lifecycle management
    - Actions include: create, list, get, get-active, update, delete, activate, deactivate, search, list-presets, create-from-preset, export, import
    - Defined extensive personality traits: tone (10 options), communication style (8 options), error handling (6 options), verbosity, formality, creativity levels
    - Created 4 built-in personality presets: Professional Assistant, Friendly Coding Buddy, Wise Mentor, Creative Collaborator
    - Implemented file-based persistence with JSON storage at `backend/ai-personalities.json`
    - Added comprehensive parameter validation and error handling for all tool actions
    - Support for personality search, tagging, import/export functionality for sharing personalities
    - Created example configuration file (`backend/ai-personalities.example.json`) with sample personalities
    - Added configuration file to `.gitignore` to protect user's custom personalities
    - Integrated into tool registry and exports for system-wide availability
    - Created comprehensive documentation in `backend/docs/PERSONALITY_SYSTEM.md` with usage examples and troubleshooting
    - All TypeScript compilation successful with no errors
    - End-to-end testing completed successfully with all personality management features verified
-   **✅ Docker Tool Implementation Completed:** 
    - Created comprehensive `dockerTool` in `backend/src/tools/docker-tool.ts` with 11 different actions
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
-   **✅ /personalities Command Implementation Completed:**
    - Added `/personalities` command to CLI autocomplete system in `cli/src/shell.tsx`
    - Implemented comprehensive command handler in `backend/src/index.ts` using personalityManager
    - Command displays currently active personality with star indicator (⭐)
    - Shows all custom personalities with detailed information (name, description, tone, style, expertise)
    - Lists all available preset personalities for discovery
    - Includes helpful quick action suggestions for managing personalities
    - Added error handling for personality management failures
    - Updated `/help` command to include the new `/personalities` option
    - Maintains consistent styling and emoji usage with other commands
    - All TypeScript compilation successful with no errors
-   **✅ Tools Code Organization Completed:**
    - Created `backend/src/tools/mcp/` subfolder for all MCP-related code
    - Created `backend/src/tools/personality/` subfolder for all personality-related code
    - Moved `mcp-config-manager.ts`, `mcp-client-manager.ts` from `utils/` to `tools/mcp/`
    - Moved `mcp-consumer-tool.ts` from `tools/` to `tools/mcp/`
    - Moved `personality-manager.ts` from `utils/` to `tools/personality/`
    - Moved `personality-tool.ts` from `tools/` to `tools/personality/`
    - Created index files for both subfolders to maintain clean imports
    - Updated all import statements throughout the codebase to reflect new locations
    - Fixed TypeScript compilation errors and linter issues
    - Verified server functionality after reorganization
    - Utils directory now only contains general utilities (logger, task-logger)
    - Tools directory now has better logical organization with related code grouped together

## Next Steps

1.  **Test Dynamic Schema System:** Test the new dynamic schema system end-to-end to verify:
    - Commands can generate different schemas based on runtime conditions
    - CLI requests schemas when commands are selected
    - Dynamic file choices appear in command options
    - Context-aware options (like admin-only flags) work correctly
    - Fallback to static schema works when dynamic generation fails
    - Error handling works correctly for schema request failures
2.  **Create More Dynamic Commands:** Implement additional commands that demonstrate dynamic schema generation:
    - Database commands with dynamic table/column choices
    - Network commands with dynamic host/port options
    - Configuration commands with dynamic setting choices
    - Test personality activation and system prompt integration with real AI responses
    - Verify personality traits (tone, communication style, error handling) influence actual assistant behavior
    - Test personality greetings and farewells in conversation flow
    - Test custom system prompts and contextual prompts functionality
    - Verify personality persistence across conversation sessions
    - Test switching between different personalities mid-conversation
3.  **Test AI Personality System:** Test the new personality system end-to-end to verify all features work correctly:
    - Test all 13 personality management actions (create, list, get, update, delete, activate, etc.)
    - Test personality creation from presets with customizations
    - Test search and filtering functionality
    - Test import/export features for sharing personalities
    - Verify file persistence and configuration management
    - Test personality activation and integration with AI responses
    - Validate all personality trait options and parameter validation
4.  **Test Docker Tool:** Test the new Docker tool end-to-end to verify all actions work correctly:
    - Test create-dockerfile action with different base images (Node.js, Python, nginx, generic)
    - Test run action with various parameter combinations (ports, volumes, environment variables)
    - Test container management actions (ps, logs, stop, remove)
    - Test build action with generated Dockerfiles
    - Verify Docker availability detection and error messaging
5.  **Test MCP Persistence:** Test the new MCP server persistence functionality end-to-end by:
    - Connecting to MCP servers using the mcpConsumer tool
    - Restarting the backend server
    - Verifying servers auto-reconnect on startup
    - Testing the remove-server functionality
6.  **Documentation:** Create user documentation for MCP server configuration and management.
7.  **Test /tools Command:** Test the new `/tools` command end-to-end to verify native tool listing and MCP server discovery functionality.
8.  **Test Command Autocomplete:** Test the new '/' autocomplete feature end-to-end in the CLI client.
9.  **Test Command System:** Test all new commands (/clear, /history, /status, /tools, /help) end-to-end with WebSocket clients.
10. **Test Conversation Context:** Test the conversation context fix end-to-end with multiple user messages to ensure context is maintained.
11. **Integration Testing:** Verify the fix works with both CLI and web-based clients.
12. **Session Management:** Consider adding session management features like conversation history persistence to disk or database.
13. **Test CLI Enhancement:** Test the new dual-mode question answering functionality end-to-end.
14. **Test MCP Implementation:** Test the complete MCP protocol implementation end-to-end with a real MCP server (e.g., filesystem server).
15. **Error Handling Enhancement:** Add more robust error handling and user-friendly error messages.
16. Thoroughly test the WebSocket communication (sending and receiving messages).
17. Integrate WebSocket message handling with the `parseAssistantMessage` function or other relevant assistant logic.
18. Define how WebSocket communication will be used by the assistant for both CLI and web-based clients (e.g., for streaming responses, real-time updates, ensuring a common communication interface).
19. Perform end-to-end testing of the new `/assistant/message` route to ensure the `parseAssistantMessage` function behaves as expected within the application context.
20. Begin development or refinement of how the `AssistantCore` (or equivalent component) utilizes the parsed message data from HTTP requests.

## Active Decisions & Considerations

-   **AI Personality System Design:** Chose to implement a comprehensive trait-based system with extensive customization options rather than simple personality templates. This provides fine-grained control while maintaining usability through preset personalities. File-based JSON persistence ensures configurations are human-readable, portable, and easily backed up. The import/export functionality enables sharing personalities between users and teams.
-   **Personality Architecture:** Implemented centralized PersonalityManager class following the same pattern as MCPConfigManager for consistency. The tool interface provides complete lifecycle management through a single tool rather than separate personality management commands. This maintains discoverability while providing comprehensive functionality.
-   **Personality Traits Design:** Defined extensive trait categories (tone, communication style, error handling, etc.) with multiple options each to provide granular behavioral control. This approach allows for nuanced personality customization while keeping individual options clear and understandable.
-   **Docker Tool Design:** Chose to implement a comprehensive tool covering the full Docker workflow rather than separate tools for each operation. This provides better user experience and clearer tool discovery while maintaining parameter-based action selection.
-   **Docker Security:** Implemented basic command validation to prevent obviously dangerous operations while maintaining Docker's inherent flexibility and power.
-   **Dockerfile Generation:** Chose to implement smart template generation based on base image type rather than generic templates, providing immediate value and following Docker best practices for common technology stacks.
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

-   **Avoid Redundant Data:** When designing data models, avoid storing the same information in multiple places. Use single sources of truth (like `activePersonalityId`) rather than duplicating state across multiple fields (like `isActive` on each personality). This reduces complexity, prevents inconsistencies, and simplifies code maintenance.
-   **Default Personality Pattern:** Always provide a fallback personality to ensure consistent AI behavior. Never return empty/null personality configurations - instead use a balanced default that provides reasonable behavioral guidelines without being overly opinionated.
-   **Command System Pattern:** User commands follow a consistent pattern with autocomplete support in CLI and backend implementation in `backend/src/index.ts`. Commands should provide immediate feedback with emojis, clear formatting, and helpful suggestions for next actions. All commands should be added to both the CLI autocomplete list and the `/help` command documentation.
-   **Template Literal Integration:** Follow the `${conditionalFunction() || ''}` pattern for embedding optional content in template literals, maintaining consistency with existing patterns like `createToolPrompt(tools)`.
-   **Modular Prompt Generation:** Separate prompt generation logic into dedicated modules (e.g., `createPersonalityPrompt`, `createToolPrompt`) to keep core functions clean and focused while enabling reusability.
-   **Personality System Architecture:** Centralized personality management with automatic integration into core system components. Personalities should influence AI behavior automatically without requiring manual intervention from users or developers.
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

-   **Redundant Data Creates Maintenance Burden:** Removing the `isActive` field from personalities revealed how redundant data complicates code. Having both `activePersonalityId` and individual `isActive` flags meant multiple places to update and potential for inconsistencies. Single source of truth patterns significantly simplify logic and reduce bugs.
-   **Default Behaviors Ensure Consistency:** Implementing a default personality revealed the importance of never leaving behavioral configurations empty. Users expect consistent AI behavior, and having a reasonable default ensures the system always feels intentionally designed rather than falling back to generic/vanilla responses.
-   **Command-Based Discovery:** Implementing the `/personalities` command revealed the value of providing discoverable interfaces for complex features. Users need easy ways to explore available personalities and understand their options without having to use the full tool interface. Commands provide immediate access to system state and options.
    The initial setup of the Memory Bank is crucial for establishing a baseline understanding of the project, even for the AI assistant itself.
    Clear definition of tasks and next steps in `activeContext.md` helps maintain focus.
    Unit testing early in the development cycle, as demonstrated with the XML parsing function, significantly improves confidence in the correctness and robustness of core functionalities.
    **AI Personality System Integration Insights:** Following the same architectural patterns as existing components (like `createToolPrompt`) significantly simplifies integration and maintains code consistency. The `${personality ? createPersonalityPrompt(personality) : ''}` pattern provides clean conditional inclusion in template literals. Separating personality prompt logic into dedicated modules keeps the system prompt generation clean and focused. Automatic personality fetching in `ButlerTask` ensures personalities are always applied without requiring manual intervention.
    **AI Personality System Insights:** Comprehensive personality management provides excellent foundation for customizable AI behavior. The trait-based approach (tone, communication style, expertise areas) offers granular control while remaining user-friendly. File-based persistence with JSON format strikes the right balance between simplicity and functionality. The preset system accelerates adoption by providing ready-to-use personalities while allowing full customization. Import/export functionality enables sharing and collaboration on personality development.
    **Docker Tool Design Insights:** Comprehensive tool design with multiple actions provides better user experience than fragmented tools. Parameter-based action selection allows for flexible, discoverable functionality while maintaining a single tool interface. Smart template generation based on context (base image type) provides immediate value to users.
    **MCP Persistence Insights:** File-based configuration persistence provides a good balance between simplicity and functionality. The JSON format is human-readable and easily manageable, while the .gitignore protection prevents security issues.
    **Configuration Management:** Separation of concerns between connection management and configuration persistence makes the system more maintainable and testable.
    **Startup Initialization:** Automatic loading and connection of saved servers on startup significantly improves user experience by maintaining state across restarts.
    **CLI Enhancement Insights:** Adding flexibility to user interaction patterns significantly improves user experience. The dual-mode approach allows power users to quickly select common options while providing escape hatches for edge cases or creative responses.
    **Ink Framework:** The `useInput` hook provides effective global key handling for navigation, and different visual styling helps users understand interface state changes.
    **MCP Implementation:** The official `@modelcontextprotocol/sdk` provides excellent TypeScript support and makes implementing the protocol straightforward. The stdio transport is reliable and well-documented.
    **Event-Driven Architecture:** Using EventEmitter for the MCP client manager allows for clean separation of concerns and enables future features like status monitoring and logging.