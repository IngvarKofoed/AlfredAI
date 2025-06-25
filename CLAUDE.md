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

**Web Client:**
- `cd web-client && npm run dev` - Start web client in development mode (http://localhost:3000)
- `cd web-client && npm run build` - Build web client for production
- `cd web-client && npm start` - Start production web client

**Shared Client Package:**
- `cd clients/shared && npm run build` - Build shared client utilities package
- `cd clients/shared && npm run dev` - Build shared package in watch mode

**Root-level commands:**
- `npm run dev:backend` - Start backend dev server
- `npm run dev:cli` - Start CLI dev server  
- `npm run dev:web` - Start web client dev server
- `npm run dev:shared` - Build shared client package
- `npm run build` - Build all packages (shared, backend, CLI, web)
- `npm run build:shared` - Build shared package only
- `npm run start:backend` - Start production backend
- `npm run start:web` - Start production web client
- `npm run test:backend` - Run backend tests
- `npm run test:shared` - Run shared package tests
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
- **Web Client** (`web-client/src/app/`): Next.js 14 web application with mobile-responsive design and real-time chat interface
- **Shared Client Package** (`clients/shared/src/`): Platform-agnostic utilities, types, and WebSocket client shared between CLI and web clients
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

## Recent Implementations (June 2025)

### Web Client with Mobile-First Design
- **Technology Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, React Query
- **Mobile Features**: 
  - Touch-friendly interface with 44px minimum touch targets
  - Swipe gestures for sidebar navigation (swipe right from left edge to open, swipe left to close)
  - Mobile drawer overlay with backdrop blur
  - Safe area support for iPhone X+ devices
  - Responsive design that works on all screen sizes
- **UI Components**: Modern chat interface with message bubbles, markdown rendering, syntax highlighting
- **Real-time Features**: WebSocket integration, thinking indicators, tool call visualization
- **Session Management**: Persistent chat sessions with local storage

### Shared Client Package Architecture
- **Purpose**: Code reuse between CLI and web clients
- **Location**: `clients/shared/` - Platform-agnostic utilities and types
- **Key Components**:
  - WebSocket client abstraction (`WebSocketClient` class)
  - Shared message types and validation
  - State management interfaces
  - Message handlers and utilities
- **Architecture Pattern**: Platform-agnostic core with platform-specific implementations

### CLI Refactoring for Code Sharing
- **Migration**: Refactored CLI to use shared client package
- **Maintained Compatibility**: All existing CLI functionality preserved
- **Performance Improvements**: Eliminated code duplication, enhanced type safety
- **WebSocket Handling**: Uses shared WebSocket client with CLI-specific React hooks

### Technical Challenges Resolved
1. **React Hooks Violations**: Eliminated duplicate React instances by making shared package React-agnostic
2. **Hydration Issues**: Fixed server/client rendering mismatches in web client
3. **Infinite Reconnection Loops**: Stabilized WebSocket client creation with proper useRef patterns
4. **Mobile Responsiveness**: Implemented comprehensive mobile-first design patterns

### Development Workflow Enhancements
- **Multi-client Support**: Backend serves both CLI and web clients simultaneously
- **Shared Type Safety**: Consistent TypeScript interfaces across all clients
- **Build Pipeline**: Integrated build process for all packages with dependency management
- **Mobile Testing**: Web client optimized for both desktop and mobile browsers

### Configuration Notes
- **Web Client URL**: Defaults to ws://localhost:3000 for WebSocket connection
- **Mobile Viewport**: Configured with proper viewport meta tags and safe area support
- **State Persistence**: Web client uses localStorage for session persistence
- **Environment Variables**: Web client uses NEXT_PUBLIC_* prefixed environment variables