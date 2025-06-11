/**
 * Test script to demonstrate the enhanced logging in the AI memory injection system
 */

import { MemoryService } from './src/memory/memory-service';
import { ProviderFactory } from './src/completion/provider-factory';

async function testEnhancedLogging() {
  console.log('🧪 Testing Enhanced AI Memory Injection Logging\n');

  try {
    // Initialize memory service
    const memoryService = new MemoryService({
      storeConfig: {
        memoryDir: './test-memory-data',
        format: 'json',
        backup: false
      },
      injectionConfig: {
        enabled: true,
        selectionStrategy: 'ai', // Use AI selection to see enhanced logging
        maxMemories: 5,
        relevanceThreshold: 0.3,
        aiSelectorConfig: {
          candidatePoolSize: 20,
          timeout: 1000,
          relevanceThreshold: 0.3,
          maxMemories: 5
        }
      }
    });

    await memoryService.initialize();

    // Create completion provider
    const completionProvider = ProviderFactory.createFromEnv('gemini');
    memoryService.setCompletionProvider(completionProvider);

    // Add some test memories
    console.log('📝 Adding test memories...');
    await memoryService.remember({
      type: 'fact',
      content: 'User is a software engineer named John who loves TypeScript',
      tags: ['user-profile', 'name', 'profession']
    });

    await memoryService.remember({
      type: 'preference',
      content: 'User prefers detailed explanations with code examples',
      tags: ['communication', 'learning-style']
    });

    await memoryService.remember({
      type: 'goal',
      content: 'User wants to learn about AI memory systems and logging',
      tags: ['learning', 'ai', 'memory', 'logging']
    });

    // Test memory injection with conversation
    console.log('\n🎯 Testing memory injection with enhanced logging...');
    
    const conversation = [
      {
        role: 'user' as const,
        content: 'Hi, can you tell me about AI memory systems and how logging works?',
        id: 'msg_1'
      }
    ];

    const systemPrompt = `You are a helpful AI assistant. Provide clear and detailed responses.

TOOL USE

You have access to various tools...`;

    // This should trigger the enhanced logging
    const enhancedPrompt = await memoryService.injectMemories(systemPrompt, conversation);

    console.log('\n✅ Memory injection completed!');
    console.log('📊 Enhanced prompt length:', enhancedPrompt.length);
    console.log('📈 Original prompt length:', systemPrompt.length);
    console.log('➕ Added content length:', enhancedPrompt.length - systemPrompt.length);

    // Test configuration update
    console.log('\n🔧 Testing configuration update logging...');
    await memoryService.updateInjectionConfig({
      maxMemories: 8,
      relevanceThreshold: 0.2
    });

    console.log('\n🎉 Enhanced logging test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedLogging().catch(console.error);