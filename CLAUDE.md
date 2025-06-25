# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Backend:**
- `npm run dev` - Start backend in development mode with nodemon
- `npm run build` - Compile TypeScript to JavaScript 
- `npm start` - Run compiled backend server
- `npm test` - Run Jest tests (single test: `npm test -- --testNamePattern="test name"`)

**CLI:**
- `cd cli && npm run dev` - Start CLI in development mode
- `cd cli && npm run build` - Build CLI application

**Root-level commands:**
- `npm run dev:backend` - Start backend dev server
- `npm run dev:cli` - Start CLI dev server  
- `npm run build` - Build both backend and CLI
- `npm run test:backend` - Run backend tests
- `npm run install:all` - Install dependencies for all packages

**Memory system:**
- `npm run memory:demo` - Run memory system demo
- `npm run memory:test` - Run memory integration test
- `npm run memory:reset` - Reset all memories

## Architecture Overview

AlfredAI is a modular AI assistant with WebSocket-based communication between a backend server and CLI interface.

**Core Components:**

- **Backend Server** (`backend/src/index.ts`): Express + WebSocket server that handles client connections, processes prompts, and coordinates all system components
- **CLI Interface** (`cli/src/app.tsx`): React-based terminal interface using Ink for user interaction
- **Task System** (`backend/src/tasks/`): Pluggable task handlers (ButlerTask for AI responses, ScriptedTask for testing)
- **Completion Providers** (`backend/src/completion/`): Abstracted AI model interfaces supporting Claude, OpenAI, Gemini, and OpenRouter
- **Tool System** (`backend/src/tools/`): Extensible tool registry for AI capabilities (weather, commands, memory, personality management, browser actions, etc.)
- **Memory System** (`backend/src/memory/`): Persistent memory with AI-driven selection, automatic memory creation, and conversation context injection
- **Personality System** (`backend/src/tools/personality/`): Configurable AI personalities with preferred providers and communication styles
- **MCP Integration** (`backend/src/tools/mcp/`): Model Context Protocol client for external tool servers

**Key Patterns:**

- All AI providers implement `CompletionProvider` interface with consistent text generation
- Tools follow `Tool` interface with standardized parameter schemas and execution
- Memory system uses pluggable storage (file-based default) with AI-powered relevance selection
- WebSocket message protocol handles real-time communication between CLI and backend
- Environment variable configuration for API keys and system behavior (`TASK_TYPE`, `AI_PROVIDER`)

**Configuration:**
- Backend requires `.env` file with API keys (copy from `.env.example`)
- Memory system configured via `memory-config.json` with injection and evaluation settings
- Personality configurations stored in `ai-personalities.json`
- MCP servers configured in `mcp-servers.json`

**Testing:**
- Jest configuration in `backend/jest.config.js` 
- Test files located in `backend/test/` directory
- Tests use `*.test.ts` naming convention

## Type System

Global types should be saved in `/types` folder per Cursor rules. Component-specific types (tool, MCP, personality) can remain local to their modules.