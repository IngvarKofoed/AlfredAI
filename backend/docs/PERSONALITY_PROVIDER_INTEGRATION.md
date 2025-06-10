# Personality-Based AI Provider Selection

This feature allows you to configure different AI providers (Claude, OpenAI, Gemini, OpenRouter) for different personalities, giving you more control over which AI model is used based on the active personality.

## Overview

Instead of using a single AI provider for all interactions, you can now:
- Assign specific AI providers to individual personalities
- Switch between providers by activating different personalities
- Have different personalities optimized for different AI models

## How It Works

1. **Provider Selection Logic**: The system checks for an active personality first, then falls back to environment variables
2. **Priority Order**:
   - Active personality's `preferredProvider` setting
   - `AI_PROVIDER` environment variable
   - Default fallback to Claude

## Configuration

### Adding Provider to Personality

When creating a personality, you can specify the preferred provider:

```bash
personalityManager action=create name="Claude Expert" description="Specialized for complex reasoning" tone=professional communicationStyle=detailed preferredProvider=claude

personalityManager action=create name="GPT Creative" description="Creative writing assistant" tone=enthusiastic communicationStyle=collaborative preferredProvider=openai

personalityManager action=create name="Gemini Analyst" description="Data analysis helper" tone=analytical communicationStyle=explanatory preferredProvider=gemini
```

### Updating Existing Personality

Add or change the provider for an existing personality:

```bash
personalityManager action=update personalityId=personality_123456 preferredProvider=claude
```

### Supported Providers

- `claude` - Anthropic Claude models
- `openai` - OpenAI GPT models  
- `gemini` - Google Gemini models
- `openrouter` - OpenRouter service

## Environment Variables

You still need the appropriate API keys configured:

```bash
# Required API keys
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Optional: Default provider (overridden by personality preferences)
AI_PROVIDER=claude
```

## Usage Examples

### Scenario 1: Different Providers for Different Tasks

```bash
# Create coding assistant with Claude (good for reasoning)
personalityManager action=create name="Code Mentor" description="Expert coding assistant" tone=professional communicationStyle=mentoring expertise=programming,debugging preferredProvider=claude

# Create creative writer with GPT-4 (good for creativity)
personalityManager action=create name="Story Writer" description="Creative writing assistant" tone=enthusiastic communicationStyle=collaborative expertise=writing,storytelling preferredProvider=openai

# Create data analyst with Gemini (good for large contexts)
personalityManager action=create name="Data Expert" description="Data analysis specialist" tone=analytical communicationStyle=detailed expertise=data-analysis,statistics preferredProvider=gemini
```

### Scenario 2: Testing Same Personality with Different Providers

```bash
# Create base personality
personalityManager action=create name="General Assistant" description="Helpful AI assistant" tone=friendly communicationStyle=conversational

# Duplicate and modify for different providers
personalityManager action=update personalityId=personality_abc123 preferredProvider=claude
# Test with Claude, then switch to OpenAI
personalityManager action=update personalityId=personality_abc123 preferredProvider=openai
```

## Checking Current Provider

Use the `/provider` command to see which provider is currently active:

```
/provider
```

This shows:
- Current active provider
- Source (personality vs environment)
- Active personality name
- Available providers

## Benefits

1. **Model Optimization**: Use the best AI model for specific personality types
2. **Cost Management**: Use different cost tiers for different use cases
3. **Feature Access**: Leverage unique capabilities of different providers
4. **A/B Testing**: Compare provider performance for the same personality
5. **Redundancy**: Switch providers if one is unavailable

## Technical Details

### Code Integration

The provider selection happens in the `ProviderFactory` class with new methods:
- `createFromPersonality()` - Create provider from personality preferences
- `createFromPersonalityOrEnv()` - Create with personality override or environment fallback

### Personality Type Extension

The `AIPersonality` interface includes a new optional field:
```typescript
interface AIPersonality {
  // ... existing fields
  preferredProvider?: 'claude' | 'openai' | 'gemini' | 'openrouter';
}
```

### Logging

The system logs which provider is being used and why:
```
Using AI provider: claude (from personality: Code Mentor)
Using AI provider: openai (from environment/default)
```

## Migration

Existing personalities without `preferredProvider` continue to work unchanged, falling back to the environment variable or default provider.

## Troubleshooting

### Provider Not Available
- Ensure the required API key is configured
- Check spelling of provider name (case-sensitive)
- Verify provider is in supported list: claude, openai, gemini, openrouter

### Personality Not Using Expected Provider
- Check if personality has `preferredProvider` set
- Use `/provider` command to see current selection
- Verify personality is actually active

### API Key Issues
- Ensure environment variables are properly set
- Check API key validity
- Review provider-specific documentation for setup 