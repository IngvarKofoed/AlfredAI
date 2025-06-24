/**
 * Memory Injector Implementation
 * 
 * This file contains the memory injection middleware that integrates with
 * completion providers to automatically include relevant memories in AI conversations.
 */

import { Memory, MemoryManager, MemorySearchCriteria } from '../types/memory';
import { Message } from '../types/core';
import { logger } from '../utils/logger';
import { AIMemorySelector, AIMemorySelectorConfig, AISelectedMemory } from './ai-memory-selector';
import { CompletionProvider } from '../completion/completion-provider';

/**
 * Configuration options for memory injection
 */
export interface MemoryInjectionConfig {
  /** Whether memory injection is enabled */
  enabled: boolean;
  /** Maximum number of memories to inject */
  maxMemories: number;
  /** Minimum relevance threshold (0-1) */
  relevanceThreshold: number;
  /** Types of memories to include */
  memoryTypes: Array<'fact' | 'preference' | 'goal' | 'short-term' | 'long-term'>;
  /** Whether to include conversation context in memory search */
  useConversationContext: boolean;
  /** Maximum age of memories to consider (in days) */
  maxMemoryAge?: number;
  /** Selection strategy: 'algorithmic' or 'ai' */
  selectionStrategy: 'algorithmic' | 'ai';
  /** Configuration for AI memory selector */
  aiSelectorConfig?: Partial<AIMemorySelectorConfig>;
}

/**
 * Default memory injection configuration
 */
export const DEFAULT_MEMORY_CONFIG: MemoryInjectionConfig = {
  enabled: true,
  maxMemories: 10,
  relevanceThreshold: 0.1, // Lowered threshold for better memory recall
  memoryTypes: ['fact', 'preference', 'goal', 'long-term'],
  useConversationContext: true,
  maxMemoryAge: 30, // 30 days
  selectionStrategy: 'algorithmic' // Default to algorithmic for backward compatibility
};

/**
 * Represents a memory with its relevance score
 */
export interface ScoredMemory {
  memory: Memory;
  relevanceScore: number;
  reason: string;
}

/**
 * Context extracted from conversation for memory retrieval
 */
export interface ConversationContext {
  /** Recent user messages */
  recentMessages: string[];
  /** Key topics/entities mentioned */
  topics: string[];
  /** Current conversation intent */
  intent?: string;
  /** Conversation ID if available */
  conversationId?: string;
}

/**
 * Memory Injector class that handles memory retrieval and injection
 */
export class MemoryInjector {
  private memoryManager: MemoryManager;
  private config: MemoryInjectionConfig;
  private aiMemorySelector?: AIMemorySelector;
  private completionProvider?: CompletionProvider;

  constructor(memoryManager: MemoryManager, config: Partial<MemoryInjectionConfig> = {}) {
    this.memoryManager = memoryManager;
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
  }

  /**
   * Initialize AI memory selector with completion provider
   */
  async initializeAISelector(completionProvider: CompletionProvider): Promise<void> {
    const startTime = Date.now();
    
    logger.info('Initializing Memory Injector AI Selector...');

    this.completionProvider = completionProvider;
    
    if (this.config.selectionStrategy === 'ai') {
      this.aiMemorySelector = new AIMemorySelector(this.config.aiSelectorConfig);
      await this.aiMemorySelector.initialize(completionProvider);
      
      const initTime = Date.now() - startTime;
      logger.info(`AI Memory Selector initialized (${initTime}ms)`);
    }
  }

  /**
   * Update memory injection configuration
   */
  updateConfig(config: Partial<MemoryInjectionConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize AI selector if strategy changed to AI
    if (this.config.selectionStrategy === 'ai' && !this.aiMemorySelector && this.completionProvider) {
      this.initializeAISelector(this.completionProvider).catch(error => {
        logger.error('Failed to initialize AI selector after config update:', error);
      });
    }
  }

  /**
   * Get current memory injection configuration
   */
  getConfig(): MemoryInjectionConfig {
    return { ...this.config };
  }

  /**
   * Inject relevant memories into a system prompt
   */
  async injectMemories(systemPrompt: string, conversation: Message[]): Promise<string> {
    const startTime = Date.now();
    
    if (!this.config.enabled) {
      return systemPrompt;
    }

    try {
      // Extract context from conversation
      const context = this.extractConversationContext(conversation);
      
      // Retrieve relevant memories
      const relevantMemories = await this.retrieveRelevantMemories(context);
      
      if (relevantMemories.length === 0) {
        return systemPrompt;
      }

      // Format memories for injection
      const memoryContext = this.formatMemoriesForInjection(relevantMemories);
      
      // Inject memories into system prompt
      const enhancedPrompt = this.injectMemoryContext(systemPrompt, memoryContext);
      
      const totalTime = Date.now() - startTime;
      logger.info(`Memory injection completed (${totalTime}ms): ${relevantMemories.length} memories injected`);
      
      return enhancedPrompt;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`Memory injection failed (${totalTime}ms):`, error);
      // Return original prompt if memory injection fails
      return systemPrompt;
    }
  }

  /**
   * Extract context from conversation history
   */
  private extractConversationContext(conversation: Message[]): ConversationContext {
    const recentMessages = conversation
      .filter(msg => msg.role === 'user')
      .slice(-3) // Last 3 user messages
      .map(msg => msg.content);

    // Extract topics/entities (simple keyword extraction)
    const allText = recentMessages.join(' ').toLowerCase();
    const topics = this.extractTopics(allText);

    return {
      recentMessages,
      topics,
      conversationId: this.extractConversationId(conversation)
    };
  }

  /**
   * Extract topics/keywords from text
   */
  private extractTopics(text: string): string[] {
    const lowerText = text.toLowerCase();
    const topics: string[] = [];
    
    // Check for identity-related questions
    if (/\b(who\s+(am\s+)?i|my\s+name|about\s+me|tell\s+me\s+about|introduce\s+myself)\b/i.test(text)) {
      topics.push('identity', 'name', 'user-profile', 'about');
    }
    
    // Check for personal information queries
    if (/\b(age|old|years|born|birthday)\b/i.test(text)) {
      topics.push('age', 'personal');
    }
    
    if (/\b(work|job|profession|career|developer|engineer)\b/i.test(text)) {
      topics.push('profession', 'work', 'career');
    }
    
    // Simple keyword extraction - can be enhanced with NLP
    const words = text.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^(the|and|but|for|are|with|they|have|this|that|from|will|been|said|each|which|their|time|would|there|could|other|after|first|well|many|some|what|know|take|than|only|think|also|back|good|just|because|should|before|through|when|where|much|your|work|life|right|down|most|way|even|find|here|more|want|give|use|may|say|come|its|like|long|make|thing|see|him|two|how|now|people|over|did|get|made|very|still|since|during|without|again|place|around|however|home|small|found|thought|went|part|while|world|might|came|both|does|put|end|why|try|god|point|different|away|turn|night|move|side|live)$/i.test(word));

    topics.push(...words);
    
    // Remove duplicates and return top topics
    return [...new Set(topics)].slice(0, 15);
  }

  /**
   * Extract conversation ID from messages
   */
  private extractConversationId(conversation: Message[]): string | undefined {
    // Try to find conversation ID in message metadata
    for (const message of conversation) {
      if (message.id) {
        // Extract conversation ID from message ID (assuming format like "conv_123_msg_456")
        const match = message.id.match(/^conv_([^_]+)_/);
        if (match) {
          return match[1];
        }
      }
    }
    return undefined;
  }

  /**
   * Retrieve relevant memories based on conversation context
   */
  private async retrieveRelevantMemories(context: ConversationContext): Promise<ScoredMemory[]> {
    let result: ScoredMemory[];
    
    if (this.config.selectionStrategy === 'ai' && this.aiMemorySelector) {
      result = await this.retrieveMemoriesWithAI(context);
    } else {
      result = await this.retrieveMemoriesAlgorithmically(context);
    }
    
    return result;
  }

  /**
   * Retrieve memories using AI-driven selection
   */
  private async retrieveMemoriesWithAI(context: ConversationContext): Promise<ScoredMemory[]> {
    const startTime = Date.now();
    
    try {
      // First, get candidate memories using fast retrieval methods
      const candidateMemories = await this.getCandidateMemories(context);
      
      if (candidateMemories.length === 0) {
        return [];
      }

      // Convert conversation context to Message format for AI selector
      const conversation: Message[] = context.recentMessages.map((content, index) => ({
        role: 'user',
        content,
        id: `temp_${index}`
      }));

      // Use AI to select the most relevant memories
      const aiSelectedMemories = await this.aiMemorySelector!.selectMemories(conversation, candidateMemories);
      
      // Convert AI selected memories to ScoredMemory format
      const result = aiSelectedMemories.map(selected => ({
        memory: selected.memory,
        relevanceScore: selected.relevanceScore,
        reason: selected.reason
      }));

      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`AI memory selection failed (${totalTime}ms), falling back to algorithmic selection:`, error);
      return await this.retrieveMemoriesAlgorithmically(context);
    }
  }

  /**
   * Get candidate memories for AI selection using fast retrieval methods
   */
  private async getCandidateMemories(context: ConversationContext): Promise<Memory[]> {
    const candidateMemories: Memory[] = [];
    const candidatePoolSize = this.config.aiSelectorConfig?.candidatePoolSize || 40;

    try {
      // Use the last user message for similarity search
      const lastMessage = context.recentMessages[context.recentMessages.length - 1];
      if (lastMessage) {
        const similarMemories = await this.memoryManager.findSimilar(lastMessage, candidatePoolSize);
        const filteredSimilar = similarMemories.filter(m => this.isMemoryTypeAllowed(m.type));
        candidateMemories.push(...filteredSimilar);
      }

      // If we don't have enough candidates, add recent memories
      if (candidateMemories.length < candidatePoolSize / 2) {
        const needed = candidatePoolSize - candidateMemories.length;
        const recentMemories = await this.memoryManager.getRecent(needed);
        const filteredRecent = recentMemories.filter(m =>
          this.isMemoryTypeAllowed(m.type) &&
          !candidateMemories.some(existing => existing.id === m.id)
        );
        candidateMemories.push(...filteredRecent);
      }

      // Add topic-based memories if we have topics
      if (context.topics.length > 0 && candidateMemories.length < candidatePoolSize) {
        const needed = candidatePoolSize - candidateMemories.length;
        const topicMemories = await this.memoryManager.findByTags(context.topics, needed);
        const filteredTopic = topicMemories.filter(m =>
          this.isMemoryTypeAllowed(m.type) &&
          !candidateMemories.some(existing => existing.id === m.id)
        );
        candidateMemories.push(...filteredTopic);
      }

    } catch (error) {
      logger.warn('Error getting candidate memories:', error);
    }

    return candidateMemories.slice(0, candidatePoolSize);
  }

  /**
   * Retrieve memories using the original algorithmic approach
   */
  private async retrieveMemoriesAlgorithmically(context: ConversationContext): Promise<ScoredMemory[]> {
    const allMemories: ScoredMemory[] = [];

    // Search by conversation context
    if (this.config.useConversationContext && context.recentMessages.length > 0) {
      const contextMemories = await this.searchMemoriesByContext(context);
      allMemories.push(...contextMemories);
    }

    // Search by topics
    if (context.topics.length > 0) {
      const topicMemories = await this.searchMemoriesByTopics(context.topics);
      allMemories.push(...topicMemories);
    }

    // Get recent memories as fallback
    if (allMemories.length < this.config.maxMemories / 2) {
      const recentMemories = await this.getRecentMemories();
      allMemories.push(...recentMemories);
    }

    // Remove duplicates and sort by relevance
    const uniqueMemories = this.deduplicateMemories(allMemories);
    
    const filteredMemories = uniqueMemories.filter(
      scored => scored.relevanceScore >= this.config.relevanceThreshold
    );

    // Sort by relevance score and limit results
    const finalMemories = filteredMemories
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.config.maxMemories);

    return finalMemories;
  }

  /**
   * Search memories by conversation context
   */
  private async searchMemoriesByContext(context: ConversationContext): Promise<ScoredMemory[]> {
    const scoredMemories: ScoredMemory[] = [];

    for (const message of context.recentMessages) {
      try {
        const similarMemories = await this.memoryManager.findSimilar(message, 5);
        
        for (const memory of similarMemories) {
          if (this.isMemoryTypeAllowed(memory.type)) {
            const score = this.calculateContextRelevance(memory, message);
            scoredMemories.push({
              memory,
              relevanceScore: score,
              reason: `Similar to recent message: "${message.substring(0, 50)}..."`
            });
          }
        }
      } catch (error) {
        logger.warn('Error searching memories by context:', error);
      }
    }

    return scoredMemories;
  }

  /**
   * Search memories by topics/tags
   */
  private async searchMemoriesByTopics(topics: string[]): Promise<ScoredMemory[]> {
    const scoredMemories: ScoredMemory[] = [];

    try {
      // Search by tags
      const tagMemories = await this.memoryManager.findByTags(topics, this.config.maxMemories);
      
      for (const memory of tagMemories) {
        if (this.isMemoryTypeAllowed(memory.type)) {
          const score = this.calculateTopicRelevance(memory, topics);
          scoredMemories.push({
            memory,
            relevanceScore: score,
            reason: `Matches topics: ${topics.join(', ')}`
          });
        }
      }

      // Search by content
      for (const topic of topics.slice(0, 3)) { // Limit to top 3 topics
        const searchResult = await this.memoryManager.search({
          content: topic,
          limit: 5
        });

        for (const memory of searchResult.memories) {
          if (this.isMemoryTypeAllowed(memory.type)) {
            const score = this.calculateTopicRelevance(memory, [topic]);
            scoredMemories.push({
              memory,
              relevanceScore: score,
              reason: `Contains topic: ${topic}`
            });
          }
        }
      }
    } catch (error) {
      logger.warn('Error searching memories by topics:', error);
    }

    return scoredMemories;
  }

  /**
   * Get recent memories as fallback
   */
  private async getRecentMemories(): Promise<ScoredMemory[]> {
    try {
      const recentMemories = await this.memoryManager.getRecent(5);
      
      return recentMemories
        .filter(memory => this.isMemoryTypeAllowed(memory.type))
        .map(memory => ({
          memory,
          relevanceScore: 0.2, // Low baseline score for recent memories
          reason: 'Recent memory'
        }));
    } catch (error) {
      logger.warn('Error getting recent memories:', error);
      return [];
    }
  }

  /**
   * Check if memory type is allowed by configuration
   */
  private isMemoryTypeAllowed(type: string): boolean {
    return this.config.memoryTypes.includes(type as any);
  }

  /**
   * Calculate relevance score based on context similarity
   */
  private calculateContextRelevance(memory: Memory, context: string): number {
    const contextLower = context.toLowerCase();
    const memoryLower = memory.content.toLowerCase();
    
    // Check for identity-related questions
    if (/\b(who\s+(am\s+)?i|my\s+name|about\s+me)\b/i.test(context)) {
      // For identity questions, prioritize fact-type memories with user profile info
      if (memory.type === 'fact' && memory.tags.some(tag =>
        ['user-profile', 'name', 'identity', 'about'].includes(tag.toLowerCase())
      )) {
        return 0.9; // High relevance for identity facts
      }
    }
    
    // Simple text similarity - can be enhanced with embeddings
    const memoryWords = new Set(memoryLower.split(/\s+/));
    const contextWords = new Set(contextLower.split(/\s+/));
    
    const intersection = new Set([...memoryWords].filter(word => contextWords.has(word)));
    const union = new Set([...memoryWords, ...contextWords]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Boost score for certain memory types
    let typeBoost = 1.0;
    if (memory.type === 'fact') typeBoost = 1.3; // Facts are important
    if (memory.type === 'preference') typeBoost = 1.2;
    if (memory.type === 'goal') typeBoost = 1.1;
    
    return Math.min(jaccardSimilarity * typeBoost, 1.0);
  }

  /**
   * Calculate relevance score based on topic matching
   */
  private calculateTopicRelevance(memory: Memory, topics: string[]): number {
    const memoryText = memory.content.toLowerCase();
    const memoryTags = memory.tags.map(tag => tag.toLowerCase());
    
    let score = 0;
    let matches = 0;
    
    // Special handling for identity-related topics
    const identityTopics = ['identity', 'name', 'user-profile', 'about'];
    const hasIdentityTopic = topics.some(topic => identityTopics.includes(topic.toLowerCase()));
    
    if (hasIdentityTopic && memory.type === 'fact' &&
        memory.tags.some(tag => identityTopics.includes(tag.toLowerCase()))) {
      return 0.8; // High relevance for identity facts
    }
    
    for (const topic of topics) {
      const topicLower = topic.toLowerCase();
      
      // Check content match
      if (memoryText.includes(topicLower)) {
        score += 0.3;
        matches++;
      }
      
      // Check tag match (higher weight)
      if (memoryTags.includes(topicLower)) {
        score += 0.5;
        matches++;
      }
    }
    
    // Normalize by number of topics
    const normalizedScore = matches > 0 ? score / topics.length : 0;
    
    // Boost for memory types
    let typeBoost = 1.0;
    if (memory.type === 'fact') typeBoost = 1.3; // Facts are important
    if (memory.type === 'preference') typeBoost = 1.2;
    
    return Math.min(normalizedScore * typeBoost, 1.0);
  }

  /**
   * Remove duplicate memories from scored list
   */
  private deduplicateMemories(memories: ScoredMemory[]): ScoredMemory[] {
    const seen = new Set<string>();
    const unique: ScoredMemory[] = [];
    
    for (const scored of memories) {
      if (!seen.has(scored.memory.id)) {
        seen.add(scored.memory.id);
        unique.push(scored);
      }
    }
    
    return unique;
  }

  /**
   * Format memories for injection into system prompt
   */
  private formatMemoriesForInjection(memories: ScoredMemory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const sections: string[] = [];
    
    // Group memories by type
    const memoryGroups = this.groupMemoriesByType(memories);
    
    for (const [type, groupMemories] of Object.entries(memoryGroups)) {
      if (groupMemories.length === 0) continue;
      
      const sectionTitle = this.getMemoryTypeName(type);
      const formattedMemories = groupMemories
        .map(scored => this.formatSingleMemory(scored))
        .join('\n');
      
      sections.push(`## ${sectionTitle}\n${formattedMemories}`);
    }
    
    return sections.join('\n\n');
  }

  /**
   * Group memories by type
   */
  private groupMemoriesByType(memories: ScoredMemory[]): Record<string, ScoredMemory[]> {
    const groups: Record<string, ScoredMemory[]> = {};
    
    for (const scored of memories) {
      const type = scored.memory.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(scored);
    }
    
    return groups;
  }

  /**
   * Get human-readable name for memory type
   */
  private getMemoryTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      'fact': 'Facts About User',
      'preference': 'User Preferences',
      'goal': 'User Goals',
      'short-term': 'Recent Context',
      'long-term': 'Long-term Knowledge'
    };
    
    return typeNames[type] || 'Memories';
  }

  /**
   * Format a single memory for injection
   */
  private formatSingleMemory(scored: ScoredMemory): string {
    const { memory } = scored;
    const timestamp = new Date(memory.timestamp).toLocaleDateString();
    
    let formatted = `- ${memory.content}`;
    
    // Add tags if present
    if (memory.tags.length > 0) {
      formatted += ` [Tags: ${memory.tags.join(', ')}]`;
    }
    
    // Add timestamp for context
    formatted += ` (${timestamp})`;
    
    return formatted;
  }

  /**
   * Inject memory context into system prompt
   */
  private injectMemoryContext(systemPrompt: string, memoryContext: string): string {
    if (!memoryContext.trim()) {
      return systemPrompt;
    }

    const memorySection = `
====

MEMORY CONTEXT

The following information has been remembered from previous interactions with this user. Use this context to provide more personalized and relevant responses:

${memoryContext}

====
`;

    // Insert memory context after the initial system prompt but before tool definitions
    const toolSectionIndex = systemPrompt.indexOf('TOOL USE');
    
    if (toolSectionIndex !== -1) {
      // Insert before TOOL USE section
      return systemPrompt.slice(0, toolSectionIndex) + memorySection + '\n' + systemPrompt.slice(toolSectionIndex);
    } else {
      // Append to end if no TOOL USE section found
      return systemPrompt + memorySection;
    }
  }
}