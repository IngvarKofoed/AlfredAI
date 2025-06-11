/**
 * Memory Evaluator Implementation
 * 
 * This service uses a secondary AI to automatically identify and extract
 * memorable information from conversations, then creates memories using
 * the existing memory system.
 */

import { CompletionProvider } from '../completion/completion-provider';
import { MemoryService } from './memory-service';
import { Message } from '../types/core';
import { CreateMemoryOptions, MemoryType } from '../types/memory';
import { logger } from '../utils/logger';

/**
 * Configuration for the automatic memory evaluator
 */
export interface AutoMemoryConfig {
  /** Enable/disable automatic memory creation */
  enabled: boolean;
  /** AI provider to use for the evaluator */
  provider: string;
  /** Model to use for the evaluator */
  model: string;
  /** Confidence threshold to accept a memory (0-1) */
  confidenceThreshold: number;
  /** Maximum number of memories to extract per conversation turn */
  maxMemoriesPerTurn: number;
  /** Debounce time in milliseconds to prevent rapid evaluations */
  debounceMs: number;
}

/**
 * Default configuration for automatic memory creation
 */
export const DEFAULT_AUTO_MEMORY_CONFIG: AutoMemoryConfig = {
  enabled: true, // Enabled by default
  provider: 'gemini',
  model: 'gemini-2.5-flash-preview-05-20', // Fast, efficient model for evaluation
  confidenceThreshold: 0.7,
  maxMemoriesPerTurn: 3,
  debounceMs: 2000 // 2 second debounce
};

/**
 * Structure for memory extraction results from the evaluator AI
 */
interface MemoryExtraction {
  type: MemoryType;
  content: string;
  tags: string[];
  confidence: number;
  reasoning?: string;
}

/**
 * Response format expected from the evaluator AI
 */
interface EvaluatorResponse {
  memories: MemoryExtraction[];
  hasMemorableContent: boolean;
}

/**
 * Memory Evaluator service that automatically creates memories from conversations
 */
export class MemoryEvaluator {
  private config: AutoMemoryConfig;
  private completionProvider: CompletionProvider;
  private memoryService: MemoryService;
  private lastEvaluationTime = 0;
  private evaluationInProgress = false;

  constructor(
    completionProvider: CompletionProvider,
    memoryService: MemoryService,
    config: Partial<AutoMemoryConfig> = {}
  ) {
    this.config = { ...DEFAULT_AUTO_MEMORY_CONFIG, ...config };
    this.completionProvider = completionProvider;
    this.memoryService = memoryService;
  }

  /**
   * Update the evaluator configuration
   */
  updateConfig(config: Partial<AutoMemoryConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Memory evaluator configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoMemoryConfig {
    return { ...this.config };
  }

  /**
   * Evaluate a conversation turn for memorable content
   * This is the main entry point called after each conversation turn
   */
  async evaluateConversation(userMessage: Message, aiResponse: Message, fullConversation: Message[]): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Debounce rapid evaluations
    const now = Date.now();
    if (now - this.lastEvaluationTime < this.config.debounceMs) {
      logger.debug('Memory evaluation debounced');
      return;
    }

    // Prevent concurrent evaluations
    if (this.evaluationInProgress) {
      logger.debug('Memory evaluation already in progress, skipping');
      return;
    }

    this.lastEvaluationTime = now;
    this.evaluationInProgress = true;

    try {
      await this.performEvaluation(userMessage, aiResponse, fullConversation);
    } catch (error) {
      logger.error('Memory evaluation failed:', error);
    } finally {
      this.evaluationInProgress = false;
    }
  }

  /**
   * Perform the actual memory evaluation
   */
  private async performEvaluation(userMessage: Message, aiResponse: Message, fullConversation: Message[]): Promise<void> {
    logger.debug('Starting memory evaluation for conversation turn');

    try {
      // Create the evaluation prompt
      const evaluationPrompt = this.createEvaluationPrompt();
      
      // Create conversation context for the evaluator
      const evaluationContext = this.createEvaluationContext(userMessage, aiResponse, fullConversation);

      // Call the evaluator AI
      const response = await this.completionProvider.generateText(evaluationPrompt, evaluationContext);
      
      // Parse the response
      const evaluation = this.parseEvaluatorResponse(response);
      
      if (!evaluation.hasMemorableContent) {
        logger.debug('No memorable content found in conversation turn');
        return;
      }

      // Filter memories by confidence threshold
      const validMemories = evaluation.memories.filter(
        memory => memory.confidence >= this.config.confidenceThreshold
      );

      if (validMemories.length === 0) {
        logger.debug('No memories met confidence threshold');
        return;
      }

      // Limit the number of memories per turn
      const memoriesToCreate = validMemories.slice(0, this.config.maxMemoriesPerTurn);

      // Create the memories
      const createdMemories = await this.createMemories(memoriesToCreate, fullConversation);
      
      logger.info(`Created ${createdMemories.length} automatic memories from conversation turn`);

    } catch (error) {
      logger.error('Error during memory evaluation:', error);
      throw error;
    }
  }

  /**
   * Create the system prompt for the memory evaluator AI
   */
  private createEvaluationPrompt(): string {
    return `You are a memory extraction specialist. Your job is to analyze conversations and identify information that should be remembered about the user for future interactions.

IMPORTANT: You must respond with valid JSON only. No other text or formatting.

Analyze the conversation and extract memorable information about the user. Look for:

1. **Personal Facts**: Direct statements about the user (job, location, family, etc.)
2. **Preferences**: Things the user likes/dislikes, choices they make
3. **Goals**: What the user wants to achieve, learn, or accomplish
4. **Context**: Important situational information for future conversations
5. **Corrections**: When the user corrects previous assumptions

For each piece of memorable information, determine:
- type: "fact", "preference", "goal", "short-term", or "long-term"
- content: Clear, concise description of what to remember
- tags: 2-4 relevant tags for categorization
- confidence: 0.0-1.0 confidence score
- reasoning: Brief explanation of why this is memorable

Respond with JSON in this exact format:
{
  "hasMemorableContent": boolean,
  "memories": [
    {
      "type": "fact|preference|goal|short-term|long-term",
      "content": "Clear description of what to remember",
      "tags": ["tag1", "tag2", "tag3"],
      "confidence": 0.85,
      "reasoning": "Why this is worth remembering"
    }
  ]
}

If no memorable content is found, respond with:
{
  "hasMemorableContent": false,
  "memories": []
}`;
  }

  /**
   * Create conversation context for the evaluator
   */
  private createEvaluationContext(userMessage: Message, aiResponse: Message, fullConversation: Message[]): Message[] {
    // Include recent conversation context (last 6 messages) plus the current turn
    const recentContext = fullConversation.slice(-6);
    
    // Add the current turn
    const currentTurn = [userMessage, aiResponse];
    
    // Combine and format for evaluation
    const evaluationMessages: Message[] = [
      {
        role: 'user',
        content: `Please analyze this conversation turn for memorable information about the user:

RECENT CONTEXT:
${recentContext.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

CURRENT TURN TO ANALYZE:
USER: ${userMessage.content}

ASSISTANT: ${aiResponse.content}

Extract any memorable information about the user from this conversation turn.`
      }
    ];

    return evaluationMessages;
  }

  /**
   * Parse the response from the evaluator AI
   */
  private parseEvaluatorResponse(response: string): EvaluatorResponse {
    try {
      // Clean the response - remove any markdown formatting
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate the response structure
      if (typeof parsed.hasMemorableContent !== 'boolean') {
        throw new Error('Invalid response: hasMemorableContent must be boolean');
      }
      
      if (!Array.isArray(parsed.memories)) {
        throw new Error('Invalid response: memories must be an array');
      }

      // Validate each memory
      for (const memory of parsed.memories) {
        if (!memory.type || !memory.content || !Array.isArray(memory.tags) || typeof memory.confidence !== 'number') {
          throw new Error('Invalid memory structure');
        }
        
        if (!['fact', 'preference', 'goal', 'short-term', 'long-term'].includes(memory.type)) {
          throw new Error(`Invalid memory type: ${memory.type}`);
        }
        
        if (memory.confidence < 0 || memory.confidence > 1) {
          throw new Error(`Invalid confidence score: ${memory.confidence}`);
        }
      }

      return parsed as EvaluatorResponse;
    } catch (error) {
      logger.error('Failed to parse evaluator response:', { response, error });
      throw new Error(`Failed to parse evaluator response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create memories from the extracted information
   */
  private async createMemories(memories: MemoryExtraction[], conversation: Message[]): Promise<any[]> {
    const createdMemories = [];

    for (const memoryData of memories) {
      try {
        const memoryOptions: CreateMemoryOptions = {
          type: memoryData.type,
          content: memoryData.content,
          tags: memoryData.tags,
          metadata: {
            source: 'ai',
            evaluatorGenerated: true,
            confidence: memoryData.confidence,
            reasoning: memoryData.reasoning,
            evaluatorModel: this.config.model,
            extractedAt: new Date().toISOString()
          }
        };

        const memory = await this.memoryService.rememberFromConversation(
          memoryData.content,
          conversation,
          memoryOptions
        );

        createdMemories.push(memory);
        
        logger.debug('Created automatic memory:', {
          id: memory.id,
          type: memory.type,
          content: memory.content.substring(0, 100),
          confidence: memoryData.confidence
        });

      } catch (error) {
        logger.warn('Failed to create memory:', { memoryData, error });
      }
    }

    return createdMemories;
  }

  /**
   * Get statistics about automatic memory creation
   */
  async getStats(): Promise<{
    enabled: boolean;
    config: AutoMemoryConfig;
    totalAutoMemories: number;
    recentAutoMemories: number;
  }> {
    // Count memories created by the evaluator
    const searchResult = await this.memoryService.search({
      source: 'ai',
      limit: 1000
    });
    
    // Filter to only evaluator-generated memories
    const evaluatorMemories = searchResult.memories.filter(
      memory => memory.metadata.evaluatorGenerated === true
    );
    const totalAutoMemories = evaluatorMemories.length;
    
    // Count recent auto memories (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentAutoMemories = evaluatorMemories.filter(
      memory => memory.timestamp > oneDayAgo
    ).length;

    return {
      enabled: this.config.enabled,
      config: this.config,
      totalAutoMemories,
      recentAutoMemories
    };
  }
}
