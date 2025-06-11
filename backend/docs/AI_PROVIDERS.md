# AI Provider System

Alfred AI now supports multiple AI providers, allowing you to use whatever AI model you prefer. The system currently supports Claude (Anthropic), OpenAI GPT models, Google Gemini, and OpenRouter.

## Supported Providers

| Provider | Description | Models |
|----------|-------------|---------|
| **Claude** | Anthropic's Claude models - excellent for reasoning and analysis | claude-3-5-sonnet-20241022, claude-3-haiku-20240307 |
| **OpenAI** | OpenAI's GPT models - versatile and widely-used | gpt-4, gpt-4-turbo, gpt-3.5-turbo |
| **Gemini** | Google's Gemini models - fast and efficient | gemini-2.5-flash-preview-05-20, gemini-1.5-pro, gemini-1.5-flash |
| **OpenRouter** | Access to multiple AI models through OpenRouter - great for experimentation | anthropic/claude-3-sonnet, openai/gpt-4, google/gemini-pro |

## Quick Setup

### 1. Choose Your Provider

Set the `AI_PROVIDER` environment variable to one of: `claude`, `openai`, `gemini`, or `openrouter`

```bash
export AI_PROVIDER=openai
```

### 2. Set Your API Key

Set the appropriate API key for your chosen provider:

```bash
# For Claude
export ANTHROPIC_API_KEY=your_anthropic_api_key

# For OpenAI  
export OPENAI_API_KEY=your_openai_api_key

# For Gemini
export GOOGLE_AI_API_KEY=your_google_ai_api_key

# For OpenRouter
export OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Start Alfred AI

```bash
npm run dev
```

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | Which provider to use: `claude`, `openai`, `gemini`, or `openrouter` (default: `claude`) |
| `ANTHROPIC_API_KEY` | API key for Claude (when using `claude` provider) |
| `OPENAI_API_KEY` | API key for OpenAI (when using `openai` provider) |
| `GOOGLE_AI_API_KEY` | API key for Gemini (when using `gemini` provider) |
| `OPENROUTER_API_KEY` | API key for OpenRouter (when using `openrouter` provider) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_MODEL` | Override default Claude model | `claude-3-5-sonnet-20241022` |
| `OPENAI_MODEL` | Override default OpenAI model | `gpt-4` |
| `GEMINI_MODEL` | Override default Gemini model | `gemini-2.5-flash-preview-05-20` |
| `OPENROUTER_MODEL` | Override default OpenRouter model | `anthropic/claude-3-haiku` |
| `MAX_TOKENS` | Maximum tokens to generate | `8192` (Claude/OpenAI), `1,000,000` (Gemini) |
| `TEMPERATURE` | Sampling temperature (0.0-1.0) | `0.7` |
| `OPENROUTER_BASE_URL` | Custom OpenRouter endpoint | `https://openrouter.ai/api/v1` |

## Using the AI Provider Tool

Alfred AI includes a built-in tool to help you manage AI providers. You can use it through natural conversation:

```
"Show me the current AI provider status"
"List all available AI providers"  
"Tell me about OpenAI configuration"
"What are the default models for each provider?"
```

### AI Provider Tool Actions

| Action | Description | Example |
|--------|-------------|---------|
| `status` | Show current provider and configuration | `{ "action": "status" }` |
| `list` | List all available providers with status | `{ "action": "list" }` |
| `info` | Get configuration info for a specific provider | `{ "action": "info", "provider": "openai" }` |
| `models` | Show default models for all providers | `{ "action": "models" }` |

## CLI Commands

### `/provider` Command

Use the `/provider` command in the CLI to quickly check your current AI provider status:

```
/provider
```

This will show:
- Current active provider
- API key status (set/missing)
- Default model and any overrides
- Configuration settings

### Other Useful Commands

```bash
/help      # Show all available commands
/status    # Show system status including AI provider
/tools     # List all available tools
```

## Examples

### Example 1: Using OpenAI

```bash
# Set environment variables
export AI_PROVIDER=openai
export OPENAI_API_KEY=sk-your-openai-key-here
export OPENAI_MODEL=gpt-4-turbo

# Start Alfred AI
npm run dev
```

### Example 2: Using Gemini

```bash
# Set environment variables  
export AI_PROVIDER=gemini
export GOOGLE_AI_API_KEY=your-google-ai-key-here
export GEMINI_MODEL=gemini-1.5-pro
export TEMPERATURE=0.5

# Start Alfred AI
npm run dev
```

### Example 3: Using OpenRouter with Custom Model

```bash
# Set environment variables
export AI_PROVIDER=openrouter
export OPENROUTER_API_KEY=your-openrouter-key-here
export OPENROUTER_MODEL=anthropic/claude-3-sonnet
export MAX_TOKENS=8192

# Start Alfred AI
npm run dev
```

## Switching Providers

You can switch providers by:

1. **Stopping Alfred AI** (Ctrl+C)
2. **Updating environment variables**:
   ```bash
   export AI_PROVIDER=openai
   export OPENAI_API_KEY=your-key-here
   ```
3. **Restarting Alfred AI**:
   ```bash
   npm run dev
   ```

## Getting API Keys

### Claude (Anthropic)
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key

### OpenAI
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in  
3. Go to API Keys section
4. Create a new API key

### Gemini (Google AI)
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Sign up or log in
3. Get API key from the interface

### OpenRouter
1. Visit [openrouter.ai](https://openrouter.ai)
2. Sign up or log in
3. Go to Keys section
4. Create a new API key

## Troubleshooting

### Common Issues

**"Missing API key" error**
- Make sure you've set the correct environment variable for your provider
- Check that the API key is valid and has sufficient credits

**"Provider not found" error**  
- Ensure `AI_PROVIDER` is set to one of: `claude`, `openai`, `gemini`, `openrouter`
- Check for typos in the provider name

**Model not supported**
- Verify the model name is correct for your provider
- Check the provider's documentation for available models

### Debug Information

Use the `/provider` command or the AI Provider tool to get detailed information about your current configuration and troubleshoot issues.

## Provider-Specific Notes

### Claude
- Excellent for complex reasoning tasks
- Supports large context windows
- Best for analytical and research tasks

### OpenAI
- Most widely compatible
- Good general-purpose performance
- Extensive model selection

### Gemini  
- Very fast response times
- Good for real-time applications
- Efficient for simple tasks

### OpenRouter
- Access to multiple providers through one API
- Great for comparing different models
- Pay-per-use pricing model
- Supports many cutting-edge models

## Development

### Adding New Providers

To add a new AI provider:

1. Create a new completion provider class in `src/completion/completion-providers/`
2. Implement the `CompletionProvider` interface
3. Add the provider to the `ProviderFactory`
4. Update the documentation

### Provider Interface

All providers must implement:

```typescript
interface CompletionProvider {
  getModelName?(): string;
  generateText(systemPrompt: string, conversation: Message[]): Promise<string>;
}
``` 