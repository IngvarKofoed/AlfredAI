import { Tool } from './tool';
import { ProviderFactory, ProviderType, DEFAULT_MODELS, DEFAULT_MAX_TOKENS } from '../completion/provider-factory';

/**
 * AI Provider Management Tool
 * Allows users to check, switch, and configure AI providers
 */
export const aiProviderTool: Tool = {
  description: {
    name: 'aiProvider',
    description: 'Manage AI provider settings - check current provider, list available providers, or get configuration info',
    parameters: [
      {
        name: 'action',
        description: 'Action to perform: status (show current), list (available providers), info (configuration help), models (default models)',
        usage: 'status|list|info|models',
        required: true
      },
      {
        name: 'provider',
        description: 'Provider to get information about (when using info action)',
        usage: 'claude|openai|gemini|openrouter',
        required: false
      }
    ],
    examples: [
      {
        description: 'Check current provider status',
        parameters: [{ name: 'action', value: 'status' }]
      },
      {
        description: 'List all available providers',
        parameters: [{ name: 'action', value: 'list' }]
      },
      {
        description: 'Get OpenAI configuration info',
        parameters: [
          { name: 'action', value: 'info' },
          { name: 'provider', value: 'openai' }
        ]
      }
    ]
  },
  async execute(params: Record<string, any>) {
    const { action, provider } = params;

    try {
      let result: string;
      switch (action) {
        case 'status':
          result = getCurrentProviderStatus();
          break;
        
        case 'list':
          result = listAvailableProviders();
          break;
        
        case 'info':
          result = getProviderInfo(provider);
          break;
        
        case 'models':
          result = getDefaultModels();
          break;
        
        default:
          result = 'Invalid action. Use: status, list, info, or models';
      }

      return {
        success: true,
        result: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Get current provider status
 */
function getCurrentProviderStatus(): string {
  const currentProvider = (process.env.AI_PROVIDER as ProviderType) || 'claude';
  const envKeyMap: Record<ProviderType, string> = {
    claude: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GOOGLE_AI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };

  const requiredEnvKey = envKeyMap[currentProvider];
  const hasApiKey = !!process.env[requiredEnvKey];
  const modelOverride = process.env[`${currentProvider.toUpperCase()}_MODEL`];
  const maxTokens = process.env.MAX_TOKENS;
  const temperature = process.env.TEMPERATURE;

  let status = `🤖 **Current AI Provider Status**\n\n`;
  status += `**Active Provider:** ${currentProvider}\n`;
  status += `**API Key Status:** ${hasApiKey ? '✅ Set' : '❌ Missing'}\n`;
  status += `**Default Model:** ${DEFAULT_MODELS[currentProvider]}\n`;
  status += `**Default Max Tokens:** ${DEFAULT_MAX_TOKENS[currentProvider].toLocaleString()}\n`;
  
  if (modelOverride) {
    status += `**Model Override:** ${modelOverride}\n`;
  }
  
  if (maxTokens) {
    status += `**Max Tokens:** ${maxTokens}\n`;
  }
  
  if (temperature) {
    status += `**Temperature:** ${temperature}\n`;
  }

  if (!hasApiKey) {
    status += `\n⚠️ **Missing API Key**\nPlease set the ${requiredEnvKey} environment variable to use ${currentProvider}.`;
  }

  return status;
}

/**
 * List all available providers
 */
function listAvailableProviders(): string {
  const providers = ProviderFactory.getSupportedProviders();
  const envKeyMap: Record<ProviderType, string> = {
    claude: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GOOGLE_AI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };

  let result = `🔧 **Available AI Providers**\n\n`;
  
  providers.forEach(provider => {
    const envKey = envKeyMap[provider];
    const hasKey = !!process.env[envKey];
    const defaultModel = DEFAULT_MODELS[provider];
    const isCurrent = (process.env.AI_PROVIDER || 'claude') === provider;
    
    result += `**${provider.toUpperCase()}** ${isCurrent ? '(current)' : ''}\n`;
    result += `• API Key: ${hasKey ? '✅' : '❌'} (${envKey})\n`;
    result += `• Default Model: ${defaultModel}\n`;
    result += `• Status: ${hasKey ? 'Ready' : 'Needs API key'}\n\n`;
  });

  result += `**To switch providers:**\n`;
  result += `Set the AI_PROVIDER environment variable to: ${providers.join(', ')}\n\n`;
  result += `**Example:** AI_PROVIDER=openai`;

  return result;
}

/**
 * Get configuration information for a specific provider
 */
function getProviderInfo(provider?: ProviderType): string {
  if (!provider) {
    return 'Please specify a provider: claude, openai, gemini, or openrouter';
  }

  const providers = ProviderFactory.getSupportedProviders();
  if (!providers.includes(provider)) {
    return `Invalid provider: ${provider}. Available: ${providers.join(', ')}`;
  }

  const envKeyMap: Record<ProviderType, string> = {
    claude: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GOOGLE_AI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };

  const descriptions: Record<ProviderType, string> = {
    claude: 'Anthropic\'s Claude models - excellent for reasoning and analysis',
    openai: 'OpenAI\'s GPT models - versatile and widely-used',
    gemini: 'Google\'s Gemini models - fast and efficient',
    openrouter: 'Access to multiple AI models through OpenRouter - great for experimentation'
  };

  const examples: Record<ProviderType, string[]> = {
    claude: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    gemini: ['gemini-2.5-flash-preview-05-20', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    openrouter: ['anthropic/claude-3-sonnet', 'openai/gpt-4', 'google/gemini-pro']
  };

  let info = `📋 **${provider.toUpperCase()} Configuration**\n\n`;
  info += `**Description:** ${descriptions[provider]}\n\n`;
  info += `**Required Environment Variables:**\n`;
  info += `• ${envKeyMap[provider]} (required)\n`;
  info += `• ${provider.toUpperCase()}_MODEL (optional, overrides default)\n\n`;
  info += `**Default Model:** ${DEFAULT_MODELS[provider]}\n\n`;
  info += `**Popular Models:**\n`;
  examples[provider].forEach(model => {
    info += `• ${model}\n`;
  });

  if (provider === 'openrouter') {
    info += `\n**Additional Options:**\n`;
    info += `• OPENROUTER_BASE_URL (optional, for custom endpoints)\n`;
  }

  info += `\n**To use this provider:**\n`;
  info += `1. Set ${envKeyMap[provider]}=your_api_key\n`;
  info += `2. Set AI_PROVIDER=${provider}\n`;
  info += `3. Optionally set ${provider.toUpperCase()}_MODEL=your_preferred_model`;

  return info;
}

/**
 * Get default models for all providers
 */
function getDefaultModels(): string {
  let result = `🎯 **Default Models by Provider**\n\n`;
  
  Object.entries(DEFAULT_MODELS).forEach(([provider, model]) => {
    result += `**${provider.toUpperCase()}:** ${model}\n`;
  });

  result += `\n**Note:** You can override these with environment variables:\n`;
  result += `• CLAUDE_MODEL=your_model\n`;
  result += `• OPENAI_MODEL=your_model\n`;
  result += `• GEMINI_MODEL=your_model\n`;
  result += `• OPENROUTER_MODEL=your_model`;

  return result;
} 