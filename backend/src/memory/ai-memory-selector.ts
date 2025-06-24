/**
 * AI Memory Selector Implementation
 * 
 * This component uses AI to intelligently select which memories are most relevant
 * for injection into conversations, replacing the algorithmic approach with
 * context-aware AI-driven selection.
 */

import { Memory, MemoryManager } from '../types/memory';
import { Message } from '../types/core';
import { CompletionProvider } from '../completion/completion-provider';
import { ProviderFactory, ProviderType } from '../completion/provider-factory';
import { logger } from '../utils/logger';

/**
 * Configuration for the AI Memory Selector
 */
export interface AIMemorySelectorConfig {
  /** AI provider to use for selection (defaults to primary provider) */
  provider?: ProviderType;
  /** AI model to use for selection (defaults to primary model) */
  model?: string;
  /** Maximum number of candidate memories to send to AI */
  candidatePoolSize: number;
  /** Timeout in milliseconds for AI selection call */
  timeout: number;
  /** Minimum relevance threshold for selected memories */
  relevanceThreshold: number;
  /** Maximum number of memories to select */
  maxMemories: number;
}

/**
 * Default configuration for AI Memory Selector
 */
export const DEFAULT_AI_SELECTOR_CONFIG: AIMemorySelectorConfig = {
  candidatePoolSize: 40,
  timeout: 800, // 800ms timeout
  relevanceThreshold: 0.3,
  maxMemories: 10
};

/**
 * Represents a memory selected by AI with relevance score and reasoning
 */
export interface AISelectedMemory {
  memory: Memory;
  relevanceScore: number;
  reason: string;
}

/**
 * AI response format for memory selection
 */
interface AIMemorySelectionResponse {
  selected_memories: Array<{
    id: string;
    relevance_score: number;
    reason: string;
  }>;
}

/**
 * Context extracted from conversation for AI analysis
 */
export interface ConversationContext {
  /** Recent user messages */
  recentMessages: string[];
  /** Current user message */
  currentMessage: string;
  /** Conversation history for context */
  conversationHistory: string;
}

/**
 * AI Memory Selector class that uses AI to intelligently select relevant memories
 */
export class AIMemorySelector {
  private config: AIMemorySelectorConfig;
  private completionProvider?: CompletionProvider;

  constructor(config: Partial<AIMemorySelectorConfig> = {}) {
    this.config = { ...DEFAULT_AI_SELECTOR_CONFIG, ...config };
  }

  /**
   * Initialize the AI Memory Selector with a completion provider
   */
  async initialize(primaryProvider?: CompletionProvider): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('🧠 Initializing AI Memory Selector...');
      logger.debug('AI Memory Selector config:', {
        candidatePoolSize: this.config.candidatePoolSize,
        timeout: this.config.timeout,
        relevanceThreshold: this.config.relevanceThreshold,
        maxMemories: this.config.maxMemories,
        provider: this.config.provider,
        model: this.config.model
      });

      if (this.config.provider) {
        // Create a specific provider for memory selection
        logger.info(`Creating AI provider for memory selection: ${this.config.provider}`);
        this.completionProvider = ProviderFactory.createFromEnv(this.config.provider);
      } else if (primaryProvider) {
        // Use the primary provider
        logger.info('Using primary completion provider for memory selection');
        this.completionProvider = primaryProvider;
      } else {
        // Fallback to default Gemini provider
        logger.info('Falling back to default Gemini provider for memory selection');
        this.completionProvider = ProviderFactory.createFromEnv('gemini');
      }
      
      const initTime = Date.now() - startTime;
      logger.info(`✅ AI Memory Selector initialized successfully (${initTime}ms)`);
    } catch (error) {
      const initTime = Date.now() - startTime;
      logger.error(`❌ Failed to initialize AI Memory Selector (${initTime}ms):`, error);
      throw error;
    }
  }

  /**
   * Select relevant memories using AI analysis
   */
  async selectMemories(
    conversation: Message[],
    candidateMemories: Memory[]
  ): Promise<AISelectedMemory[]> {
    const startTime = Date.now();
    const selectionId = Math.random().toString(36).substr(2, 9);
    
    logger.info(`🎯 AI Memory Selection triggered [${selectionId}]`);
    logger.debug(`Selection context [${selectionId}]:`, {
      conversationLength: conversation.length,
      candidateCount: candidateMemories.length,
      timeout: this.config.timeout,
      relevanceThreshold: this.config.relevanceThreshold
    });

    if (!this.completionProvider) {
      logger.error(`❌ AI Memory Selector not initialized [${selectionId}]`);
      throw new Error('AI Memory Selector not initialized');
    }

    if (candidateMemories.length === 0) {
      logger.debug(`No candidate memories provided to AI selector [${selectionId}]`);
      return [];
    }

    try {
      // Extract conversation context
      logger.debug(`Extracting conversation context [${selectionId}]...`);
      const context = this.extractConversationContext(conversation);
      
      logger.debug(`Conversation context extracted [${selectionId}]:`, {
        recentMessagesCount: context.recentMessages.length,
        currentMessageLength: context.currentMessage.length,
        conversationHistoryLength: context.conversationHistory.length
      });
      
      // Log candidate memories summary
      const candidatesByType = candidateMemories.reduce((acc, memory) => {
        acc[memory.type] = (acc[memory.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      logger.debug(`Candidate memories by type [${selectionId}]:`, candidatesByType);
      logger.debug(`Sample candidate memories [${selectionId}]:`,
        candidateMemories.slice(0, 3).map(m => ({
          id: m.id,
          type: m.type,
          contentPreview: m.content.substring(0, 100) + '...',
          tags: m.tags
        }))
      );
      
      // Construct the selection prompt
      logger.debug(`Constructing AI selection prompt [${selectionId}]...`);
      const prompt = this.constructSelectionPrompt(context, candidateMemories);
      
      // Call AI with timeout
      logger.debug(`Calling AI for memory selection [${selectionId}] (timeout: ${this.config.timeout}ms)...`);
      const aiStartTime = Date.now();
      const response = await this.callAIWithTimeout(prompt);
      const aiTime = Date.now() - aiStartTime;
      
      logger.debug(`AI response received [${selectionId}] (${aiTime}ms):`, {
        responseLength: response.length,
        responsePreview: response.substring(0, 200) + '...'
      });
      
      // Parse and validate response
      logger.debug(`Parsing AI response [${selectionId}]...`);
      const selectedMemories = await this.parseAIResponse(response, candidateMemories);
      
      const totalTime = Date.now() - startTime;
      
      // Log selection results with reasoning
      logger.info(`✅ AI Memory Selection completed [${selectionId}] (${totalTime}ms)`);
      logger.info(`Selected ${selectedMemories.length} memories from ${candidateMemories.length} candidates:`);
      
      selectedMemories.forEach((selected, index) => {
        logger.info(`  ${index + 1}. [${selected.memory.type}] Score: ${selected.relevanceScore.toFixed(2)} - ${selected.reason}`);
        logger.debug(`     Memory: ${selected.memory.content.substring(0, 100)}...`);
      });
      
      // Performance metrics
      logger.debug(`Performance metrics [${selectionId}]:`, {
        totalTime: `${totalTime}ms`,
        aiCallTime: `${aiTime}ms`,
        processingTime: `${totalTime - aiTime}ms`,
        memoriesPerSecond: Math.round((candidateMemories.length / totalTime) * 1000),
        selectionRatio: `${selectedMemories.length}/${candidateMemories.length} (${Math.round((selectedMemories.length / candidateMemories.length) * 100)}%)`
      });

      return selectedMemories;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`❌ AI Memory Selection failed [${selectionId}] (${totalTime}ms):`, error);
      
      // Check if this is a timeout error
      if (error instanceof Error && error.message.includes('timed out')) {
        logger.warn(`AI selection timed out after ${this.config.timeout}ms, falling back to algorithmic selection`);
      }
      
      throw error;
    }
  }

  /**
   * Extract relevant context from conversation history
   */
  private extractConversationContext(conversation: Message[]): ConversationContext {
    logger.debug('Extracting conversation context from messages:', {
      totalMessages: conversation.length,
      messageRoles: conversation.map(m => m.role)
    });

    const userMessages = conversation
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);

    const recentMessages = userMessages.slice(-3); // Last 3 user messages
    const currentMessage = userMessages[userMessages.length - 1] || '';

    // Create a condensed conversation history for context
    const conversationHistory = conversation
      .slice(-6) // Last 6 messages (3 exchanges)
      .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n');

    const context = {
      recentMessages,
      currentMessage,
      conversationHistory
    };

    logger.debug('Conversation context extracted:', {
      recentMessagesCount: recentMessages.length,
      currentMessagePreview: currentMessage.substring(0, 100) + (currentMessage.length > 100 ? '...' : ''),
      conversationHistoryLength: conversationHistory.length
    });

    return context;
  }

  /**
   * Construct the AI prompt for memory selection
   */
  private constructSelectionPrompt(
    context: ConversationContext,
    candidateMemories: Memory[]
  ): string {
    const memoriesJson = candidateMemories.map(memory => ({
      id: memory.id,
      type: memory.type,
      content: memory.content,
      tags: memory.tags,
      timestamp: memory.timestamp
    }));

    return `You are an AI assistant's "memory expert." Your task is to analyze a conversation and a list of available memories about the user. Select the memories that are most relevant to the current conversation context. Your goal is to provide the main AI with the best possible context to generate a personalized and helpful response.

**Current Conversation Context:**
${context.conversationHistory}

**User's Current Message:**
${context.currentMessage}

**Available Memories (Candidate Set):**
${JSON.stringify(memoriesJson, null, 2)}

**Your Task:**
Review the conversation and the available memories. Identify which memories are relevant to the user's current message and the conversation context. For each relevant memory, provide a relevance score from 0.0 to 1.0 and a brief justification.

**Selection Criteria:**
- Prioritize memories that directly relate to the current topic or question
- Consider memories that provide important context about the user's preferences, goals, or background
- Include memories that help understand the user's current situation or needs
- Avoid memories that are completely unrelated to the current conversation
- Score memories based on how much they would help the AI provide a better response

**Output Format (JSON only, no other text):**
{
  "selected_memories": [
    {
      "id": "memory_id",
      "relevance_score": 0.95,
      "reason": "Brief explanation of why this memory is relevant"
    }
  ]
}`;
  }

  /**
   * Call AI with timeout protection
   */
  private async callAIWithTimeout(prompt: string): Promise<string> {
    if (!this.completionProvider) {
      throw new Error('Completion provider not available');
    }

    logger.debug('Calling AI for memory selection:', {
      promptLength: prompt.length,
      timeout: this.config.timeout,
      provider: this.completionProvider.constructor.name
    });

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        logger.warn(`AI memory selection timed out after ${elapsed}ms (limit: ${this.config.timeout}ms)`);
        reject(new Error(`AI memory selection timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.completionProvider!.generateText(prompt, [], { disableConversationHistory: true })
        .then(response => {
          clearTimeout(timeoutId);
          const elapsed = Date.now() - startTime;
          logger.debug(`AI response received in ${elapsed}ms:`, {
            responseLength: response.length,
            tokensPerSecond: Math.round((response.length / elapsed) * 1000)
          });
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          const elapsed = Date.now() - startTime;
          logger.error(`AI call failed after ${elapsed}ms:`, error);
          reject(error);
        });
    });
  }

  /**
   * Parse and validate AI response
   */
  private async parseAIResponse(
    response: string,
    candidateMemories: Memory[]
  ): Promise<AISelectedMemory[]> {
    logger.debug('Parsing AI response for memory selection:', {
      responseLength: response.length,
      candidateCount: candidateMemories.length
    });

    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON found in AI response. Raw response:', response.substring(0, 500));
        throw new Error('No JSON found in AI response');
      }

      logger.debug('JSON extracted from AI response:', jsonMatch[0].substring(0, 500) + '...');

      const parsed: AIMemorySelectionResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsed.selected_memories || !Array.isArray(parsed.selected_memories)) {
        logger.error('Invalid response format: missing selected_memories array. Parsed:', parsed);
        throw new Error('Invalid response format: missing selected_memories array');
      }

      logger.debug(`AI selected ${parsed.selected_memories.length} memories for evaluation`);

      // Create a map for quick memory lookup
      const memoryMap = new Map(candidateMemories.map(m => [m.id, m]));
      
      const selectedMemories: AISelectedMemory[] = [];
      const skippedMemories: Array<{reason: string, selection: any}> = [];

      for (const selection of parsed.selected_memories) {
        const { id, relevance_score, reason } = selection;
        
        // Validate selection format
        if (!id || typeof relevance_score !== 'number' || !reason) {
          const skipReason = 'Invalid memory selection format';
          logger.warn(`${skipReason}, skipping:`, selection);
          skippedMemories.push({ reason: skipReason, selection });
          continue;
        }

        // Find the corresponding memory
        const memory = memoryMap.get(id);
        if (!memory) {
          const skipReason = `Memory with ID ${id} not found in candidates`;
          logger.warn(`${skipReason}, skipping`);
          skippedMemories.push({ reason: skipReason, selection });
          continue;
        }

        // Apply relevance threshold
        if (relevance_score < this.config.relevanceThreshold) {
          const skipReason = `Below relevance threshold (${relevance_score} < ${this.config.relevanceThreshold})`;
          logger.debug(`Memory ${id} ${skipReason}, skipping`);
          skippedMemories.push({ reason: skipReason, selection });
          continue;
        }

        const clampedScore = Math.min(Math.max(relevance_score, 0), 1);
        selectedMemories.push({
          memory,
          relevanceScore: clampedScore,
          reason: reason.trim()
        });

        logger.debug(`✓ Memory selected: ${id} (score: ${clampedScore.toFixed(2)}) - ${reason.substring(0, 100)}...`);
      }

      // Log skipped memories summary
      if (skippedMemories.length > 0) {
        const skipSummary = skippedMemories.reduce((acc, skip) => {
          acc[skip.reason] = (acc[skip.reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        logger.debug('Skipped memories summary:', skipSummary);
      }

      // Sort by relevance score and limit results
      const finalSelection = selectedMemories
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, this.config.maxMemories);

      logger.debug(`Final selection: ${finalSelection.length} memories (after sorting and limiting to ${this.config.maxMemories})`);

      return finalSelection;

    } catch (error) {
      logger.error('Failed to parse AI memory selection response:', error);
      logger.debug('Raw AI response (first 1000 chars):', response.substring(0, 1000));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse AI response: ${errorMessage}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIMemorySelectorConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('AI Memory Selector config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AIMemorySelectorConfig {
    return { ...this.config };
  }
}