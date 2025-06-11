/**
 * Memory System Usage Example
 * 
 * This file demonstrates how to use the AlfredAI memory system.
 * This is for documentation and testing purposes.
 */

import { MemoryManager, FileMemoryStore, memoryConfigManager } from './index';

/**
 * Example usage of the memory system
 */
export async function memorySystemExample() {
  try {
    console.log('🧠 Memory System Example');
    console.log('========================');

    // Get memory configuration
    const config = memoryConfigManager.getConfig();
    console.log('📋 Memory Configuration:', JSON.stringify(config, null, 2));

    // Create file-based memory store
    const fileStoreConfig = memoryConfigManager.getFileStoreConfig();
    const memoryStore = new FileMemoryStore(fileStoreConfig);

    // Create memory manager
    const memoryManager = new MemoryManager(memoryStore);

    // Initialize the memory system
    console.log('\n🚀 Initializing memory system...');
    await memoryManager.initialize();
    console.log('✅ Memory system initialized');

    // Create some example memories
    console.log('\n💾 Creating example memories...');

    const userPreference = await memoryManager.remember({
      type: 'preference',
      content: 'User prefers concise explanations over detailed ones',
      tags: ['user-preference', 'communication-style'],
      metadata: {
        source: 'user',
        conversationId: 'conv_001'
      }
    });
    console.log('✅ Created user preference memory:', userPreference.id);

    const factMemory = await memoryManager.remember({
      type: 'fact',
      content: 'The user is working on a TypeScript project called AlfredAI',
      tags: ['project', 'typescript', 'context'],
      metadata: {
        source: 'ai',
        conversationId: 'conv_001'
      }
    });
    console.log('✅ Created fact memory:', factMemory.id);

    const goalMemory = await memoryManager.remember({
      type: 'goal',
      content: 'Help the user implement a memory system for their AI assistant',
      tags: ['goal', 'development', 'memory-system'],
      metadata: {
        source: 'ai',
        conversationId: 'conv_001'
      }
    });
    console.log('✅ Created goal memory:', goalMemory.id);

    // Search for memories
    console.log('\n🔍 Searching memories...');

    const projectMemories = await memoryManager.findByTags(['project']);
    console.log(`📝 Found ${projectMemories.length} project-related memories`);

    const userMemories = await memoryManager.search({
      source: 'user',
      limit: 10
    });
    console.log(`👤 Found ${userMemories.total} user memories`);

    // Get recent memories
    const recentMemories = await memoryManager.getRecent(5);
    console.log(`⏰ Found ${recentMemories.length} recent memories`);

    // Find similar memories
    const similarMemories = await memoryManager.findSimilar('TypeScript development', 3);
    console.log(`🔗 Found ${similarMemories.length} similar memories`);

    // Update a memory (evolution)
    console.log('\n🔄 Evolving a memory...');
    const evolvedMemory = await memoryManager.evolve(factMemory.id, {
      content: 'The user is working on a TypeScript project called AlfredAI, specifically implementing a memory system',
      tags: [...factMemory.tags, 'memory-implementation']
    });
    console.log('✅ Memory evolved:', evolvedMemory?.id);

    // Get memory statistics
    console.log('\n📊 Memory Statistics:');
    const stats = await memoryManager.getStats();
    console.log(JSON.stringify(stats, null, 2));

    // Recall a specific memory
    console.log('\n🎯 Recalling specific memory...');
    const recalled = await memoryManager.recall(userPreference.id);
    console.log('📖 Recalled memory:', recalled?.content);

    // Clean up
    console.log('\n🧹 Cleaning up...');
    await memoryManager.close();
    console.log('✅ Memory system closed');

    console.log('\n🎉 Memory system example completed successfully!');

  } catch (error) {
    console.error('❌ Memory system example failed:', error);
    throw error;
  }
}

/**
 * Run the example if this file is executed directly
 */
if (require.main === module) {
  memorySystemExample()
    .then(() => {
      console.log('Example completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Example failed:', error);
      process.exit(1);
    });
}