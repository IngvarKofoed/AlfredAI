# Backend Server

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=3000

# Task Configuration
# Options: "scripted" or "butler"
# Default: "butler"
TASK_TYPE=butler
```

## .env File Setup

To get started quickly, copy the example above into a new `.env` file:

```bash
# In the backend directory
cp .env.example .env
# Then edit the .env file with your actual values
```

Or create the `.env` file manually with these contents:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=3000
TASK_TYPE=butler
```

### Task Types

- **butler**: Uses the ButlerTask with Claude completion provider and tools (default)
- **scripted**: Uses the ScriptedTask for testing purposes

## Usage

1. Copy the environment variables above into a `.env` file
2. Set `TASK_TYPE=butler` (or omit the variable) to use the full AI assistant functionality
3. Set `TASK_TYPE=scripted` to use the scripted testing mode
4. Start the server with `npm start`

The server will log which task factory is being used when clients connect. 