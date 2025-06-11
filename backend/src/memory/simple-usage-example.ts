/**
 * Simple Memory System Usage Example
 * 
 * This example demonstrates how to use the memory system in a real application.
 * It shows memory creation, retrieval, AI integration, and practical usage patterns.
 */

import { initializeMemoryService, getMemoryService, closeMemoryService } from './memory-service';
import { MemoryService } from './memory-service';
import { MemoryInjector } from './memory-injector';
import { CreateMemoryOptions, Memory } from '../types/memory';
import { Message } from '../types/core';

/**
 * Simple example showing how to use the memory system
 */
class SimpleMemoryExample {
  private memoryService!: MemoryService;
  private memoryInjector!: MemoryInjector;

  /**
   * Initialize the memory system
   */
  async initialize(): Promise<void> {
    console.log('🧠 Initializing Memory System...\n');
    
    // Initialize with default configuration
    this.memoryService = await initializeMemoryService();
    this.memoryInjector = this.memoryService.getMemoryInjector();
    
    console.log('✅ Memory system ready!\n');
  }

  /**
   * Example 1: Basic Memory Operations
   */
  async basicMemoryOperations(): Promise<void> {
    console.log('📝 Example 1: Basic Memory Operations\n');

    // Create some memories
    const userPreference = await this.memoryService.remember({
      type: 'preference',
      content: 'User prefers dark mode themes',
      tags: ['ui', 'theme', 'preference'],
      metadata: { source: 'user', importance: 'high' }
    });
    console.log(`✅ Created preference: ${userPreference.id}`);

    const userSkill = await this.memoryService.remember({
      type: 'fact',
      content: 'User is experienced with React and TypeScript',
      tags: ['skills', 'programming', 'react', 'typescript'],
      metadata: { source: 'ai', confidence: 0.9 }
    });
    console.log(`✅ Created fact: ${userSkill.id}`);

    const userGoal = await this.memoryService.remember({
      type: 'goal',
      content: 'User wants to build a personal portfolio website',
      tags: ['project', 'portfolio', 'web-development'],
      metadata: { source: 'user', deadline: '2025-12-31' }
    });
    console.log(`✅ Created goal: ${userGoal.id}`);

    // Retrieve recent memories
    const recentMemories = await this.memoryService.getRecent(3);
    console.log(`\n📋 Recent memories (${recentMemories.length}):`);
    recentMemories.forEach((memory, index) => {
      console.log(`  ${index + 1}. [${memory.type.toUpperCase()}] ${memory.content}`);
    });

    // Search for specific memories
    const searchResults = await this.memoryService.search({
      content: 'React',
      limit: 5
    });
    console.log(`\n🔍 Search results for "React": ${searchResults.memories.length} found`);
    
    console.log('');
  }

  /**
   * Example 2: AI Conversation with Memory Injection
   */
  async aiConversationWithMemory(): Promise<void> {
    console.log('🤖 Example 2: AI Conversation with Memory Injection\n');

    // Simulate a conversation
    const conversation: Message[] = [
      {
        role: 'user',
        content: 'I want to start working on my portfolio website. What should I consider?',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'I can help you with your portfolio website! Let me think about the best approach.',
        timestamp: new Date()
      }
    ];

    // Original system prompt (without memory)
    const originalPrompt = `You are a helpful AI assistant specializing in web development.
Provide clear, practical advice for building websites.`;

    console.log('📄 Original prompt length:', originalPrompt.length, 'characters');

    // Inject memories into the system prompt
    const enhancedPrompt = await this.memoryInjector.injectMemories(originalPrompt, conversation);

    console.log('📄 Enhanced prompt length:', enhancedPrompt.length, 'characters');
    console.log('🧠 Memory injection successful!\n');

    // Show the memory context that was injected
    const memoryStart = enhancedPrompt.indexOf('MEMORY CONTEXT');
    const memoryEnd = enhancedPrompt.indexOf('====', memoryStart + 1);
    
    if (memoryStart !== -1 && memoryEnd !== -1) {
      const memorySection = enhancedPrompt.substring(memoryStart, memoryEnd + 4);
      console.log('💡 Injected Memory Context:');
      console.log(memorySection);
    }

    console.log('\n✨ The AI now knows:');
    console.log('  • User prefers dark mode themes');
    console.log('  • User is experienced with React and TypeScript');
    console.log('  • User wants to build a portfolio website');
    console.log('  • This enables personalized, relevant responses!\n');
  }

  /**
   * Example 3: Memory Evolution and Learning
   */
  async memoryEvolutionExample(): Promise<void> {
    console.log('🔄 Example 3: Memory Evolution and Learning\n');

    // Create initial memory
    const initialMemory = await this.memoryService.remember({
      type: 'preference',
      content: 'User likes simple, clean designs',
      tags: ['design', 'preference', 'ui'],
      metadata: { source: 'ai', confidence: 0.7 }
    });
    console.log('📝 Initial memory:', initialMemory.content);

    // Simulate learning more about the user
    const updatedMemory = await this.memoryService.remember({
      type: 'preference',
      content: 'User prefers minimalist design with dark themes and subtle animations',
      tags: ['design', 'preference', 'ui', 'minimalist', 'dark-theme'],
      metadata: { 
        source: 'ai', 
        confidence: 0.9,
        replaces: initialMemory.id 
      }
    });
    console.log('🔄 Updated memory:', updatedMemory.content);

    // Create memories from conversation context
    const conversationMemories = await this.memoryService.rememberMultipleFromConversation([
      {
        content: 'User mentioned using VS Code as their primary editor',
        type: 'fact',
        tags: ['tools', 'editor', 'vscode']
      },
      {
        content: 'User is interested in learning about accessibility in web design',
        type: 'goal',
        tags: ['learning', 'accessibility', 'web-design']
      }
    ], [
      {
        role: 'user',
        content: 'I use VS Code for development and want to make sure my portfolio is accessible',
        timestamp: new Date(),
        id: 'example_msg_1'
      }
    ]);

    console.log(`\n📚 Created ${conversationMemories.length} memories from conversation:`);
    conversationMemories.forEach((memory, index) => {
      console.log(`  ${index + 1}. [${memory.type.toUpperCase()}] ${memory.content}`);
    });

    console.log('');
  }

  /**
   * Example 4: Memory Statistics and Management
   */
  async memoryManagementExample(): Promise<void> {
    console.log('📊 Example 4: Memory Statistics and Management\n');

    // Get memory statistics
    const stats = await this.memoryService.getStats();
    
    console.log('📈 Memory Statistics:');
    console.log(`  Total memories: ${stats.total}`);
    console.log('  By type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    console.log('  By source:');
    Object.entries(stats.bySource).forEach(([source, count]) => {
      console.log(`    ${source}: ${count}`);
    });

    // Show top tags
    if (stats.topTags.length > 0) {
      console.log('  Top tags:');
      stats.topTags.slice(0, 5).forEach(({ tag, count }) => {
        console.log(`    ${tag}: ${count}`);
      });
    }

    // Get injection configuration
    const injectionConfig = this.memoryService.getInjectionConfig();
    console.log('\n🔧 Memory Injection Configuration:');
    console.log(`  Enabled: ${injectionConfig.enabled}`);
    console.log(`  Max memories per injection: ${injectionConfig.maxMemories}`);
    console.log(`  Relevance threshold: ${injectionConfig.relevanceThreshold}`);
    console.log(`  Memory types included: ${injectionConfig.memoryTypes.join(', ')}`);

    console.log('');
  }

  /**
   * Example 5: Practical Usage Patterns
   */
  async practicalUsagePatterns(): Promise<void> {
    console.log('💼 Example 5: Practical Usage Patterns\n');

    // Pattern 1: User onboarding
    console.log('🎯 Pattern 1: User Onboarding');
    await this.memoryService.rememberMultipleFromConversation([
      {
        content: 'New user, first time using the system',
        type: 'fact',
        tags: ['user-status', 'onboarding']
      },
      {
        content: 'User prefers step-by-step guidance',
        type: 'preference',
        tags: ['learning-style', 'guidance']
      }
    ], []);
    console.log('  ✅ Stored onboarding information');

    // Pattern 2: Project context
    console.log('\n🏗️  Pattern 2: Project Context');
    await this.memoryService.remember({
      type: 'fact',
      content: 'Current project: Personal portfolio website using React and TypeScript',
      tags: ['current-project', 'portfolio', 'react', 'typescript'],
      metadata: { source: 'user', priority: 'high' }
    });
    console.log('  ✅ Stored project context');

    // Pattern 3: Learning progress
    console.log('\n📚 Pattern 3: Learning Progress');
    await this.memoryService.remember({
      type: 'fact',
      content: 'User completed React hooks tutorial and understands useState and useEffect',
      tags: ['learning', 'react', 'hooks', 'completed'],
      metadata: { source: 'system', completionDate: new Date().toISOString() }
    });
    console.log('  ✅ Stored learning progress');

    // Pattern 4: Personalization
    console.log('\n🎨 Pattern 4: Personalization');
    await this.memoryService.remember({
      type: 'preference',
      content: 'User timezone: Europe/Copenhagen, prefers metric units',
      tags: ['timezone', 'localization', 'preferences'],
      metadata: { source: 'user', importance: 'medium' }
    });
    console.log('  ✅ Stored personalization preferences');

    console.log('\n💡 These patterns enable:');
    console.log('  • Personalized user experiences');
    console.log('  • Context-aware AI responses');
    console.log('  • Progressive learning and adaptation');
    console.log('  • Consistent user preferences across sessions');

    console.log('');
  }

  /**
   * Clean up and close
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up example data...\n');
    
    // Get final stats
    const finalStats = await this.memoryService.getStats();
    console.log(`📊 Created ${finalStats.total} memories during this example`);
    
    // Reset memories (optional - remove this in production)
    await this.memoryService.resetMemories();
    console.log('✅ Example memories cleared');
    
    // Close memory service
    await closeMemoryService();
    console.log('✅ Memory service closed');
  }

  /**
   * Run the complete example
   */
  async runExample(): Promise<void> {
    try {
      await this.initialize();
      
      await this.basicMemoryOperations();
      await this.aiConversationWithMemory();
      await this.memoryEvolutionExample();
      await this.memoryManagementExample();
      await this.practicalUsagePatterns();
      
      console.log('🎉 Simple Memory System Example Complete!\n');
      console.log('Key takeaways:');
      console.log('  ✅ Easy to create and retrieve memories');
      console.log('  ✅ Automatic memory injection into AI conversations');
      console.log('  ✅ Memory evolution and learning capabilities');
      console.log('  ✅ Comprehensive statistics and management');
      console.log('  ✅ Practical patterns for real applications');
      console.log('\n🚀 The memory system is ready for production use!');
      
    } catch (error) {
      console.error('❌ Example failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

/**
 * Run the example if this file is executed directly
 */
if (require.main === module) {
  const example = new SimpleMemoryExample();
  example.runExample().catch(console.error);
}

export { SimpleMemoryExample };