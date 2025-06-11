/**
 * Memory Tool Test
 * 
 * Simple test to verify the Memory MCP Tool functionality
 */

import { memoryTool } from './memory-tool';

async function testMemoryTool() {
  console.log('🧠 Testing Memory MCP Tool');
  console.log('==========================\n');

  try {
    // Test 1: Remember a preference
    console.log('Test 1: Remembering a user preference...');
    const rememberResult = await memoryTool.execute({
      action: 'remember',
      content: 'User prefers TypeScript over JavaScript for new projects',
      type: 'preference',
      tags: 'programming,language-preference,typescript',
      source: 'user'
    });
    console.log('✅ Remember result:', rememberResult);

    // Test 2: Get memory statistics
    console.log('\nTest 2: Getting memory statistics...');
    const statsResult = await memoryTool.execute({
      action: 'stats'
    });
    console.log('✅ Stats result:', statsResult);

    // Test 3: List recent memories
    console.log('\nTest 3: Listing recent memories...');
    const listResult = await memoryTool.execute({
      action: 'list',
      limit: '5'
    });
    console.log('✅ List result:', listResult);

    // Test 4: Search for memories
    console.log('\nTest 4: Searching for programming memories...');
    const searchResult = await memoryTool.execute({
      action: 'search',
      tags: 'programming',
      limit: '3'
    });
    console.log('✅ Search result:', searchResult);

    // Test 5: Test error handling
    console.log('\nTest 5: Testing error handling (invalid action)...');
    const errorResult = await memoryTool.execute({
      action: 'invalid_action'
    });
    console.log('✅ Error handling result:', errorResult);

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMemoryTool();
}

export { testMemoryTool };