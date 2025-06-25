# Alfred AI Web Client

A modern web interface for Alfred AI built with Next.js 14, React Query, Zustand, and Tailwind CSS.

## Features

- 🎨 Modern chat interface with dark/light theme support
- 🔄 Real-time WebSocket communication
- 💾 Persistent chat sessions with local storage
- 🧠 Visual thinking indicators and tool call displays
- 📱 Responsive design for desktop and mobile
- ⚡ Fast performance with React Query caching
- 🎯 Command system integration (/help, /clear, etc.)
- 🔌 Seamless integration with Alfred AI backend

## Technology Stack

- **Framework:** Next.js 14 with App Router
- **State Management:** Zustand with persistence
- **Data Fetching:** React Query (TanStack Query)
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Radix UI primitives
- **WebSocket:** Native WebSocket with reconnection logic
- **Markdown:** React Markdown with syntax highlighting
- **TypeScript:** Full type safety throughout

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Running Alfred AI backend server

### Installation

1. Install dependencies:
```bash
cd web-client
npm install
# or
yarn install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update the WebSocket URL in `.env.local`:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
web-client/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── chat/          # Chat-specific components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript definitions
│   └── utils/             # Helper functions
├── public/                # Static assets
└── package.json          # Dependencies and scripts
```

## Key Components

### Chat Interface
- **ChatInterface:** Main chat container with message list and input
- **MessageList:** Displays conversation history
- **MessageItem:** Individual message rendering with markdown support
- **ChatInput:** Message input with command detection
- **ThinkingIndicator:** Visual feedback during AI processing

### Layout
- **Header:** Top navigation with connection status
- **Sidebar:** Chat session management
- **ConnectionStatus:** WebSocket connection indicator

### State Management
- **ChatStore:** Chat messages, sessions, and UI state
- **ConnectionStore:** WebSocket connection management

### WebSocket Integration
- **useWebSocket:** Connection management hook
- **useWebSocketMessage:** Message handling hook

## Commands

The web client supports the same command system as the CLI:

- `/help` - Show available commands
- `/clear` - Clear current conversation
- `/personality` - Switch AI personality
- `/provider` - Change AI provider
- `/sessions` - List chat sessions

## Development

### Code Quality
- ESLint with TypeScript rules
- Strict TypeScript configuration
- Tailwind CSS for consistent styling

### Testing
```bash
npm run test
# or
yarn test
```

### Building
```bash
npm run build
# or
yarn build
```

## Deployment

The web client can be deployed to any platform that supports Next.js:

- **Vercel:** Zero-config deployment
- **Netlify:** Static site generation
- **Docker:** Container deployment
- **Self-hosted:** Node.js server

Make sure to set the correct `NEXT_PUBLIC_WS_URL` environment variable for your deployment.

## Integration with Backend

The web client communicates with the Alfred AI backend via WebSocket connection. It sends and receives the same message format as the CLI client:

```typescript
// Outgoing message
{
  type: 'message' | 'command',
  content?: string,
  command?: string,
  args?: string[],
  timestamp: string
}

// Incoming message
{
  type: 'response' | 'thinking' | 'error' | 'tool_call_start' | 'tool_call_result',
  content?: string,
  thinking?: boolean,
  toolCall?: ToolCall,
  error?: string
}
```

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Write tests for new functionality
4. Update documentation for new features