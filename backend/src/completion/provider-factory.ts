import { CompletionProvider } from './completion-provider';
import {
  ClaudeCompletionProvider,
  OpenAICompletionProvider,
  GeminiCompletionProvider,
  OpenRouterCompletionProvider
} from './completion-providers';
import { AIPersonality } from '../types/personality';
import { MemoryInjector } from '../memory/memory-injector';

/**
 * Supported AI provider types
 */
export type ProviderType = 'claude' | 'openai' | 'gemini' | 'openrouter';

/**
 * Configuration for different AI providers
 */
export interface ProviderConfig {
  provider: ProviderType;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  // Provider-specific options
  baseURL?: string; // For OpenRouter or custom endpoints
  // Memory injection
  memoryInjector?: MemoryInjector;
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS: Record<ProviderType, string> = {
  claude: 'claude-3-7-sonnet-20250219',
  openai: 'gpt-4',
  gemini: 'gemini-2.5-flash-preview-05-20',
  openrouter: 'anthropic/claude-3-haiku',
};

/**
 * Default max tokens for each provider
 */
export const DEFAULT_MAX_TOKENS: Record<ProviderType, number> = {
  claude: 200000,
  openai: 8192,
  gemini: 1000000, // 1 million tokens - Gemini can handle very large responses
  openrouter: 8192,
};

/**
 * Factory class for creating AI completion providers
 */
export class ProviderFactory {
  /**
   * Creates a completion provider based on the provided configuration
   * @param config - Configuration object specifying the provider and its options
   * @returns A CompletionProvider instance
   */
  static createProvider(config: ProviderConfig): CompletionProvider {
    const {
      provider,
      apiKey,
      model = DEFAULT_MODELS[provider],
      maxTokens = DEFAULT_MAX_TOKENS[provider], // Provider-specific defaults
      temperature = 0.7,
      baseURL,
      memoryInjector
    } = config;

    switch (provider) {
      case 'claude':
        return new ClaudeCompletionProvider(apiKey, model, maxTokens, temperature, memoryInjector);
      
      case 'openai':
        return new OpenAICompletionProvider(apiKey, model, maxTokens, temperature, memoryInjector);
      
      case 'gemini':
        return new GeminiCompletionProvider(apiKey, model, maxTokens, temperature, memoryInjector);
      
      case 'openrouter':
        return new OpenRouterCompletionProvider(apiKey, model, maxTokens, temperature, baseURL, memoryInjector);
      
      default:
        throw new Error(`Unsupported provider type: ${provider}`);
    }
  }

  /**
   * Creates a provider based on personality preferences
   * @param personality - The personality containing provider preferences
   * @param fallbackProvider - Fallback provider type if personality doesn't specify one
   * @returns A CompletionProvider instance
   */
  static createFromPersonality(personality: AIPersonality, fallbackProvider: ProviderType = 'claude', memoryInjector?: MemoryInjector): CompletionProvider {
    const provider = personality.preferredProvider || fallbackProvider;
    return this.createFromEnv(provider, memoryInjector);
  }

  /**
   * Creates a provider from environment variables with personality override
   * @param personality - Optional personality that may specify a preferred provider
   * @param defaultProvider - Default provider if no personality preference
   * @returns A CompletionProvider instance
   */
  static createFromPersonalityOrEnv(personality?: AIPersonality, defaultProvider: ProviderType = 'claude', memoryInjector?: MemoryInjector): CompletionProvider {
    if (personality?.preferredProvider) {
      return this.createFromPersonality(personality, defaultProvider, memoryInjector);
    }
    
    // Fall back to environment variable or default
    const envProvider = (process.env.AI_PROVIDER as ProviderType) || defaultProvider;
    return this.createFromEnv(envProvider, memoryInjector);
  }

  /**
   * Creates a provider from environment variables
   * @param provider - The provider type to create
   * @returns A CompletionProvider instance
   */
  static createFromEnv(provider: ProviderType, memoryInjector?: MemoryInjector): CompletionProvider {
    const envKeyMap: Record<ProviderType, string> = {
      claude: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY', 
      gemini: 'GOOGLE_AI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
    };

    const apiKey = process.env[envKeyMap[provider]];
    if (!apiKey) {
      throw new Error(`Missing API key for ${provider}. Please set ${envKeyMap[provider]} environment variable.`);
    }

    // Get optional model override from environment
    const modelEnvKey = `${provider.toUpperCase()}_MODEL`;
    const model = process.env[modelEnvKey];

    // Get optional settings from environment
    const maxTokens = process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : undefined;
    const temperature = process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : undefined;
    const baseURL = process.env.OPENROUTER_BASE_URL; // For OpenRouter custom endpoints

    return this.createProvider({
      provider,
      apiKey,
      model,
      maxTokens,
      temperature,
      baseURL,
      memoryInjector,
    });
  }

  /**
   * Gets a list of all supported provider types
   * @returns Array of supported provider type strings
   */
  static getSupportedProviders(): ProviderType[] {
    return ['claude', 'openai', 'gemini', 'openrouter'];
  }

  /**
   * Gets the default model for a specific provider
   * @param provider - The provider type
   * @returns The default model name
   */
  static getDefaultModel(provider: ProviderType): string {
    return DEFAULT_MODELS[provider];
  }
} 