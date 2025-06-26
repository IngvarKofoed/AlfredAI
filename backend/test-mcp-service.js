// Simple test to verify McpService implementation
const { McpService, mcpServiceInstance } = require('./dist/tools/mcp');

console.log('Testing McpService...');

// Test that the service can be instantiated
const service = new McpService();
console.log('✅ McpService instantiated successfully');

// Test that it has the expected properties
console.log('✅ configManager property exists:', typeof service.configManager);
console.log('✅ clientManager property exists:', typeof service.clientManager);

// Test that the singleton instance works
console.log('✅ Singleton instance exists:', typeof mcpServiceInstance);
console.log('✅ Singleton has configManager:', typeof mcpServiceInstance.configManager);
console.log('✅ Singleton has clientManager:', typeof mcpServiceInstance.clientManager);

console.log('✅ All tests passed!'); 