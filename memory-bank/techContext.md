# Technical Context

This document details the technologies used, development environment setup, technical constraints, dependencies, and tool usage patterns for the AI assistant project.

## Technologies Used

-   **Programming Language (Backend):** TypeScript
-   **Runtime Environment (Backend):** Node.js
-   **Web Server Framework (Backend):** Express.js
-   **WebSocket Library (Backend):** `ws`
-   **MCP Protocol (Backend):** `@modelcontextprotocol/sdk` - Official Model Context Protocol implementation
-   **Version Control:** Git (assumed, standard for most projects)
-   **IDE:** User's choice (e.g., VS Code with Cursor)
-   **Operating System:** User's choice (current user is on win32)
-   **Shell:** User's choice (current user uses Git Bash)
-   **XML Parsing (Initial):** Regular Expressions (built into JavaScript/TypeScript). May consider libraries like `xml2js` or `fast-xml-parser` if complexity grows.

## Development Setup

1.  **Node.js and npm/yarn:** Ensure Node.js (which includes npm) or yarn is installed. (Specific versions TBD, but LTS versions are preferred).
2.  **TypeScript Compiler (tsc):** Install globally or as a project dependency (`npm install -g typescript` or `npm install --save-dev typescript`).
3.  **Project Initialization:**
    ```bash
    npm init -y
    npm install typescript @types/node --save-dev
    npx tsc --init # Creates tsconfig.json
    ```
4.  **`tsconfig.json` Configuration (Example):**
    ```json
    {
      "compilerOptions": {
        "target": "es2020", // Or newer
        "module": "commonjs",
        "rootDir": "./src",
        "outDir": "./dist",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "**/*.test.ts"]
    }
    ```
5.  **Running TypeScript:** Compile with `tsc` and run the JavaScript output with `node dist/your-main-file.js`. Alternatively, use a tool like `ts-node` for direct execution during development (`npm install -g ts-node` or `npm install --save-dev ts-node`).

## Technical Constraints

-   **Statelessness (Initial Design):** Core assistant logic aims to be stateless where possible, relying on the Memory Bank for context persistence. This simplifies scaling and reduces in-memory state management issues.
-   **Security:** Any tool that executes commands or modifies files (like `run_terminal_cmd` or `edit_file`) must be handled with extreme care, with user approval mechanisms.
-   **MCP Server Trust:** MCP servers are external processes that must be treated as potentially untrusted. Input validation and sandboxing considerations apply.
-   **Performance:** Message parsing and tool execution should be reasonably performant to ensure a good user experience. For XML parsing, regex performance on very large inputs should be monitored.

## Dependencies (Backend)

-   `typescript`: For TypeScript language support.
-   `@types/node`: TypeScript definitions for Node.js.
-   `express`: Web server framework.
-   `@types/express`: TypeScript definitions for Express.
-   `dotenv`: For loading environment variables.
-   `ws`: WebSocket library.
-   `@types/ws`: TypeScript definitions for `ws`.
-   `@modelcontextprotocol/sdk`: Official MCP TypeScript SDK for client and server communication.
-   (Potentially an XML parsing library later if regex becomes insufficient)

## Tool Usage Patterns

-   **File System Operations:** Tools like `edit_file`, `read_file`, `list_dir`, `delete_file` will interact directly with the user's file system. Paths should be handled carefully (relative vs. absolute).
-   **Command Execution:** `run_terminal_cmd` requires careful construction of commands and awareness of the shell environment.
-   **Information Retrieval:** `codebase_search`, `grep_search`, `web_search`, `file_search` are used to gather information. Queries should be crafted to be effective.
-   **Memory Bank Interaction:** The assistant itself will use `read_file` and `edit_file` to manage its Memory Bank files.
-   **MCP Integration:** The `mcpConsumer` tool provides access to external MCP servers and their capabilities:
    - Server connection management via `connect-server` action
    - Tool discovery and execution via `list-tools` and `call-tool` actions
    - Resource discovery and access via `list-resources` and `read-resource` actions
    - Connection status monitoring via `list-servers` action

## MCP Architecture Details

-   **Transport:** Using stdio transport for communication with MCP servers (child processes)
-   **Connection Management:** Centralized through `MCPClientManager` singleton with automatic reconnection
-   **Process Lifecycle:** MCP servers run as child processes, managed by the transport layer
-   **Error Handling:** Comprehensive error handling with graceful degradation when servers are unavailable
-   **Event System:** Event-driven architecture for connection state changes and notifications 