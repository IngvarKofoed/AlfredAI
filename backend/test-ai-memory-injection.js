/**
 * Test script for AI-driven memory injection
 * 
 * This script demonstrates the new AI Memory Selector functionality
 * and compares it with the algorithmic approach.
 */

const { MemoryService, MemoryInjector } = require('./src/memory');
const { ProviderFactory } = require('./src/completion/provider-factory');

async function testAIMemoryInjection() {
  console.log('🧠 Testing AI-driven Memory Injection System\n');

  try {
    // Initialize memory service
    console.log('1. Initializing memory service...');
    const memoryService = new MemoryService();
    await memoryService.initialize();

    // Create some test memories
    console.log('2. Creating test memories...');
    await memoryService.remember({
      type: 'fact',
      content: 'User is a software engineer specializing in TypeScript and React',
      tags: ['profession', 'programming', 'typescript', 'react']
    });

    await memoryService.remember({
      type: 'preference',
      content: 'User prefers dark mode for all applications',
      tags: ['ui', 'preference', 'dark-mode']
    });

    await memoryService.remember({
      type: 'goal',
      content: 'User wants to learn about AI and machine learning',
      tags: ['learning', 'ai', 'machine-learning', 'goals']
    });

    await memoryService.remember({
      type: 'fact',
      content: 'User lives in Copenhagen, Denmark',
      tags: ['location', 'personal', 'copenhagen', 'denmark']
    });

    await memoryService.remember({
      type: 'preference',
      content: 'User enjoys working with modern JavaScript frameworks',
      tags: ['programming', 'javascript', 'frameworks', 'preference']
    });

    // Test conversation scenarios
    const testConversations = [
      {
        name: 'Programming Question',
        messages: [
          { role: 'user', content: 'Can you help me with a TypeScript interface design?', id: 'msg_1' }
        ]
      },
      {
        name: 'UI Preference Question',
        messages: [
          { role: 'user', content: 'What color scheme should I use for my new app?', id: 'msg_2' }
        ]
      },
      {
        name: 'Learning Question',
        messages: [
          { role: 'user', content: 'I want to start learning about neural networks. Where should I begin?', id: 'msg_3' }
        ]
      }
    ];

    // Test both algorithmic and AI selection strategies
    for (const strategy of ['algorithmic', 'ai']) {
      console.log(`\n3. Testing ${strategy} selection strategy:`);
      console.log('=' .repeat(50));

      // Create memory injector with the current strategy
      const injectorConfig = {
        enabled: true,
        maxMemories: 5,
        relevanceThreshold: 0.1,
        memoryTypes: ['fact', 'preference', 'goal'],
        useConversationContext: true,
        selectionStrategy: strategy,
        aiSelectorConfig: {
          candidatePoolSize: 10,
          timeout: 1000,
          relevanceThreshold: 0.3,
          maxMemories: 5
        }
      };

      const memoryInjector = new MemoryInjector(memoryService.getMemoryManager(), injectorConfig);

      // Initialize AI selector if using AI strategy
      if (strategy === 'ai') {
        try {
          const completionProvider = ProviderFactory.createFromEnv('gemini');
          await memoryInjector.initializeAISelector(completionProvider);
          console.log('✅ AI Memory Selector initialized successfully');
        } catch (error) {
          console.log('❌ Failed to initialize AI Memory Selector:', error.message);
          console.log('   Skipping AI strategy test...\n');
          continue;
        }
      }

      // Test each conversation scenario
      for (const scenario of testConversations) {
        console.log(`\n📝 Scenario: ${scenario.name}`);
        console.log(`💬 User: "${scenario.messages[0].content}"`);

        try {
          const systemPrompt = "You are a helpful AI assistant.";
          const enhancedPrompt = await memoryInjector.injectMemories(systemPrompt, scenario.messages);
          
          // Extract memory context from enhanced prompt
          const memorySection = enhancedPrompt.match(/MEMORY CONTEXT([\s\S]*?)====/);
          if (memorySection) {
            console.log('🧠 Injected memories:');
            const memoryContent = memorySection[1].trim();
            const lines = memoryContent.split('\n').filter(line => line.trim().startsWith('-'));
            lines.forEach(line => {
              console.log(`   ${line.trim()}`);
            });
          } else {
            console.log('🚫 No memories injected');
          }
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAIMemoryInjection().catch(console.error);