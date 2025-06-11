/**
 * Memory System Demo
 * 
 * This file demonstrates the complete memory system functionality including:
 * - Memory creation, retrieval, and evolution
 * - AI integration with memory injection
 * - MCP tool functionality
 * - Complete memory workflow examples
 */

import { initializeMemoryService, getMemoryService, closeMemoryService } from './memory-service';
import { MemoryManager } from './memory-manager';
import { MemoryInjector } from './memory-injector';
import { CreateMemoryOptions, Memory } from '../types/memory';
import { Message } from '../types/core';
import { logger } from '../utils/logger';

/**
 * Demo class that showcases memory system capabilities
 */
class MemorySystemDemo {
  private memoryService: any;
  private memoryManager!: MemoryManager;
  private memoryInjector!: MemoryInjector;

  constructor() {
    // Will be initialized in init()
  }

  /**
   * Initialize the demo
   */
  async init(): Promise<void> {
    console.log('🧠 Initializing Memory System Demo...\n');
    
    try {
      // Initialize memory service
      this.memoryService = await initializeMemoryService({
        storeConfig: {
          memoryDir: './demo-memory-data',
          format: 'json',
          backup: true
        },
        injectionConfig: {
          enabled: true,
          maxMemories: 5,
          relevanceThreshold: 0.2
        }
      });

      this.memoryManager = this.memoryService.getMemoryManager();
      this.memoryInjector = this.memoryService.getMemoryInjector();

      console.log('✅ Memory system initialized successfully!\n');
    } catch (error) {
      console.error('❌ Failed to initialize memory system:', error);
      throw error;
    }
  }

  /**
   * Demo 1: Basic Memory Operations
   */
  async demoBasicOperations(): Promise<void> {
    console.log('📝 Demo 1: Basic Memory Operations\n');

    // Create different types of memories
    const memories: CreateMemoryOptions[] = [
      {
        type: 'fact',
        content: 'User prefers TypeScript over JavaScript for backend development',
        tags: ['programming', 'preferences', 'typescript'],
        metadata: { source: 'user', confidence: 0.9 }
      },
      {
        type: 'preference',
        content: 'User likes to work late at night, usually after 10 PM',
        tags: ['schedule', 'work-habits'],
        metadata: { source: 'ai', confidence: 0.8 }
      },
      {
        type: 'goal',
        content: 'User wants to build a complete AI assistant with memory capabilities',
        tags: ['project', 'ai', 'goals'],
        metadata: { source: 'user', confidence: 1.0 }
      },
      {
        type: 'long-term',
        content: 'User has experience with Node.js, Express, and WebSocket development',
        tags: ['skills', 'experience', 'nodejs'],
        metadata: { source: 'ai', confidence: 0.9 }
      }
    ];

    const createdMemories: Memory[] = [];

    for (const memoryData of memories) {
      try {
        const memory = await this.memoryService.remember(memoryData);
        createdMemories.push(memory);
        console.log(`✅ Created ${memory.type} memory: "${memory.content.substring(0, 50)}..."`);
      } catch (error) {
        console.error(`❌ Failed to create memory:`, error);
      }
    }

    console.log(`\n📊 Created ${createdMemories.length} memories total\n`);

    // Demonstrate memory retrieval
    console.log('🔍 Retrieving memories...\n');

    // Get recent memories
    const recentMemories = await this.memoryService.getRecent(3);
    console.log(`📋 Recent memories (${recentMemories.length}):`);
    recentMemories.forEach((memory: Memory, index: number) => {
      console.log(`  ${index + 1}. [${memory.type.toUpperCase()}] ${memory.content}`);
    });

    // Search memories
    const searchResults = await this.memoryService.search({ 
      content: 'TypeScript',
      limit: 2
    });
    console.log(`\n🔎 Search results for "TypeScript" (${searchResults.memories.length}):`);
    searchResults.memories.forEach((memory: Memory, index: number) => {
      console.log(`  ${index + 1}. [${memory.type.toUpperCase()}] ${memory.content}`);
    });

    // Find similar memories
    const similarMemories = await this.memoryService.findSimilar('programming languages', 2);
    console.log(`\n🔗 Similar memories to "programming languages" (${similarMemories.length}):`);
    similarMemories.forEach((memory: Memory, index: number) => {
      console.log(`  ${index + 1}. [${memory.type.toUpperCase()}] ${memory.content}`);
    });

    console.log('\n');
  }

  /**
   * Demo 2: Memory Injection in AI Conversations
   */
  async demoMemoryInjection(): Promise<void> {
    console.log('🤖 Demo 2: Memory Injection in AI Conversations\n');

    // Simulate a conversation
    const conversation: Message[] = [
      {
        role: 'user',
        content: 'I want to start a new TypeScript project. What should I consider?',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'I can help you with that! Let me think about the best approach for your TypeScript project.',
        timestamp: new Date()
      },
      {
        role: 'user',
        content: 'I prefer working on this late at night when I have more focus.',
        timestamp: new Date()
      }
    ];

    // Original system prompt
    const originalPrompt = `You are a helpful AI assistant. Provide clear and concise responses to user questions.

TOOL USE

You have access to various tools to help accomplish tasks.`;

    console.log('📄 Original system prompt length:', originalPrompt.length, 'characters');

    // Inject memories into the system prompt
    const enhancedPrompt = await this.memoryInjector.injectMemories(originalPrompt, conversation);

    console.log('📄 Enhanced system prompt length:', enhancedPrompt.length, 'characters');
    console.log('\n🧠 Memory injection preview:');
    
    // Extract just the memory section for display
    const memoryStart = enhancedPrompt.indexOf('MEMORY CONTEXT');
    const memoryEnd = enhancedPrompt.indexOf('====', memoryStart + 1);
    
    if (memoryStart !== -1 && memoryEnd !== -1) {
      const memorySection = enhancedPrompt.substring(memoryStart, memoryEnd + 4);
      console.log(memorySection);
    } else {
      console.log('No memory context was injected (no relevant memories found)');
    }

    console.log('\n');
  }

  /**
   * Demo 3: Memory Evolution and Learning
   */
  async demoMemoryEvolution(): Promise<void> {
    console.log('🔄 Demo 3: Memory Evolution and Learning\n');

    // Create a memory that will evolve
    const initialMemory = await this.memoryService.remember({
      type: 'preference',
      content: 'User prefers working with REST APIs',
      tags: ['api', 'preferences'],
      metadata: { source: 'ai', confidence: 0.6 }
    });

    console.log('📝 Initial memory:', initialMemory.content);

    // Simulate learning more about the user's preferences
    const updatedMemory = await this.memoryService.remember({
      type: 'preference',
      content: 'User prefers GraphQL over REST APIs for complex data fetching',
      tags: ['api', 'preferences', 'graphql'],
      metadata: {
        source: 'ai',
        confidence: 0.8,
        replaces: initialMemory.id
      }
    });

    console.log('🔄 Updated memory:', updatedMemory.content);

    // Create memories from conversation context
    const conversationMemories = await this.memoryService.rememberMultipleFromConversation([
      {
        content: 'User is building an AI assistant project',
        type: 'goal',
        tags: ['project', 'ai']
      },
      {
        content: 'User has experience with WebSocket development',
        type: 'fact',
        tags: ['skills', 'websocket']
      }
    ], [
      {
        role: 'user',
        content: 'I\'m working on an AI assistant with real-time communication',
        timestamp: new Date().toISOString(),
        id: 'conv_demo_msg_1'
      }
    ]);

    console.log(`\n📚 Created ${conversationMemories.length} memories from conversation context:`);
    conversationMemories.forEach((memory: Memory, index: number) => {
      console.log(`  ${index + 1}. [${memory.type.toUpperCase()}] ${memory.content}`);
    });

    console.log('\n');
  }

  /**
   * Demo 4: Memory Statistics and Analytics
   */
  async demoMemoryAnalytics(): Promise<void> {
    console.log('📊 Demo 4: Memory Statistics and Analytics\n');

    // Get comprehensive memory statistics
    const stats = await this.memoryService.getStats();
    
    console.log('📈 Memory System Statistics:');
    console.log(`  Total memories: ${stats.total}`);
    console.log(`  Memory types breakdown:`);
    
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });

    console.log(`  Tags distribution:`);
    if (stats.byTags && Object.keys(stats.byTags).length > 0) {
      Object.entries(stats.byTags).slice(0, 5).forEach(([tag, count]) => {
        console.log(`    ${tag}: ${count}`);
      });
    } else {
      console.log(`    No tag statistics available`);
    }

    // Get injection statistics
    const injectionStats = await this.memoryService.getInjectionStats();
    
    console.log('\n🔧 Memory Injection Configuration:');
    console.log(`  Enabled: ${injectionStats.enabled}`);
    console.log(`  Max memories per injection: ${injectionStats.config.maxMemories}`);
    console.log(`  Relevance threshold: ${injectionStats.config.relevanceThreshold}`);
    console.log(`  Memory types included: ${injectionStats.config.memoryTypes.join(', ')}`);
    console.log(`  Use conversation context: ${injectionStats.config.useConversationContext}`);

    console.log('\n');
  }

  /**
   * Demo 5: MCP Tool Integration
   */
  async demoMCPIntegration(): Promise<void> {
    console.log('🔌 Demo 5: MCP Tool Integration\n');

    console.log('💡 The memory system provides MCP tool functionality through:');
    console.log('  • memory-tool.ts - Core memory operations');
    console.log('  • Automatic memory injection in AI conversations');
    console.log('  • Integration with completion providers');
    console.log('  • WebSocket command interface (/memory command)');

    // Demonstrate tool-like operations
    console.log('\n🛠️  Tool-like operations available:');
    
    // Search operation (like a tool call)
    const toolSearchResult = await this.memoryService.search({
      content: 'TypeScript',
      limit: 3
    });
    
    console.log(`  ✅ Search tool: Found ${toolSearchResult.memories.length} memories for "TypeScript"`);

    // Recent memories operation
    const toolRecentResult = await this.memoryService.getRecent(3);
    console.log(`  ✅ Recent tool: Retrieved ${toolRecentResult.length} recent memories`);

    // Memory creation operation
    const toolCreateResult = await this.memoryService.remember({
      type: 'fact',
      content: 'Demo completed successfully with MCP integration',
      tags: ['demo', 'mcp', 'success'],
      metadata: { source: 'system', confidence: 1.0 }
    });
    console.log(`  ✅ Create tool: Created memory with ID ${toolCreateResult.id}`);

    console.log('\n');
  }

  /**
   * Demo 6: Real-world Usage Scenarios
   */
  async demoRealWorldScenarios(): Promise<void> {
    console.log('🌍 Demo 6: Real-world Usage Scenarios\n');

    // Scenario 1: User onboarding
    console.log('📋 Scenario 1: User Onboarding');
    await this.memoryService.rememberMultipleFromConversation([
      {
        content: 'User is new to AI development',
        type: 'fact',
        tags: ['experience-level', 'ai']
      },
      {
        content: 'User prefers step-by-step explanations',
        type: 'preference',
        tags: ['communication', 'learning']
      },
      {
        content: 'User wants to learn about memory systems',
        type: 'goal',
        tags: ['learning', 'memory-systems']
      }
    ], []);

    console.log('  ✅ Stored user onboarding information');

    // Scenario 2: Project context
    console.log('\n🏗️  Scenario 2: Project Context');
    await this.memoryService.rememberMultipleFromConversation([
      {
        content: 'Current project: AI assistant with memory capabilities',
        type: 'fact',
        tags: ['current-project', 'ai-assistant']
      },
      {
        content: 'Tech stack: Node.js, TypeScript, WebSocket, Express',
        type: 'fact',
        tags: ['tech-stack', 'nodejs', 'typescript']
      },
      {
        content: 'Project deadline: End of month',
        type: 'goal',
        tags: ['deadline', 'timeline']
      }
    ], []);

    console.log('  ✅ Stored project context information');

    // Scenario 3: Personalization
    console.log('\n🎯 Scenario 3: Personalization');
    await this.memoryService.rememberMultipleFromConversation([
      {
        content: 'User prefers concise code examples over lengthy explanations',
        type: 'preference',
        tags: ['communication', 'code-examples']
      },
      {
        content: 'User timezone: UTC+2 (Europe/Copenhagen)',
        type: 'fact',
        tags: ['timezone', 'location']
      },
      {
        content: 'User works best with visual diagrams for complex concepts',
        type: 'preference',
        tags: ['learning-style', 'visual']
      }
    ], []);

    console.log('  ✅ Stored personalization preferences');

    // Show how these memories would be used
    const personalizedConversation: Message[] = [
      {
        role: 'user',
        content: 'Can you explain how the memory injection works?',
        timestamp: new Date()
      }
    ];

    const personalizedPrompt = await this.memoryInjector.injectMemories(
      'You are a helpful AI assistant.',
      personalizedConversation
    );

    console.log('\n🎨 Personalized response context created based on stored memories');
    console.log('   The AI now knows the user prefers concise examples and visual explanations');

    console.log('\n');
  }

  /**
   * Clean up demo data
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up demo...\n');
    
    try {
      // Reset all memories created during demo
      await this.memoryService.resetMemories();
      console.log('✅ Demo memories cleared');
      
      // Close memory service
      await closeMemoryService();
      console.log('✅ Memory service closed');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Run the complete demo
   */
  async runCompleteDemo(): Promise<void> {
    try {
      await this.init();
      
      await this.demoBasicOperations();
      await this.demoMemoryInjection();
      await this.demoMemoryEvolution();
      await this.demoMemoryAnalytics();
      await this.demoMCPIntegration();
      await this.demoRealWorldScenarios();
      
      console.log('🎉 Memory System Demo Complete!\n');
      console.log('The memory system is now ready for production use.');
      console.log('Key features demonstrated:');
      console.log('  ✅ Memory creation, retrieval, and search');
      console.log('  ✅ AI conversation memory injection');
      console.log('  ✅ Memory evolution and learning');
      console.log('  ✅ Analytics and statistics');
      console.log('  ✅ MCP tool integration');
      console.log('  ✅ Real-world usage scenarios');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

/**
 * Run the demo if this file is executed directly
 */
if (require.main === module) {
  const demo = new MemorySystemDemo();
  demo.runCompleteDemo().catch(console.error);
}

export { MemorySystemDemo };