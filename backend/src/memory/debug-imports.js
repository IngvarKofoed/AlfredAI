// Diagnostic script to test import resolution
console.log('=== Memory System Import Diagnosis ===');

try {
  console.log('Testing memory-manager import...');
  require('./memory-manager.js');
  console.log('✓ memory-manager.js found');
} catch (error) {
  console.log('✗ memory-manager.js NOT found:', error.message);
}

try {
  console.log('Testing memory-manager.ts import...');
  require('./memory-manager.ts');
  console.log('✓ memory-manager.ts found');
} catch (error) {
  console.log('✗ memory-manager.ts NOT found:', error.message);
}

try {
  console.log('Testing memory-service import...');
  require('./memory-service.js');
  console.log('✓ memory-service.js found');
} catch (error) {
  console.log('✗ memory-service.js NOT found:', error.message);
}

console.log('=== End Diagnosis ===');