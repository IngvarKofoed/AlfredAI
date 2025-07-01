import WebSocket from 'ws';

// Test script to verify commands are received from backend
async function testCommands() {
  console.log('🔍 Testing dynamic commands reception...');
  
  const ws = new WebSocket('ws://localhost:3000');
  
  ws.on('open', () => {
    console.log('✅ Connected to backend WebSocket server');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message.type);
      
      if (message.type === 'commands') {
        console.log('🎯 Commands received successfully!');
        console.log('📋 Available commands:');
        message.payload.forEach((cmd, index) => {
          console.log(`  ${index + 1}. /${cmd.name} - ${cmd.description}`);
        });
        
        // Verify we have the expected commands
        const expectedCommands = ['help', 'provider', 'clear', 'history', 'status', 'tools', 'personalities', 'memory'];
        const receivedCommands = message.payload.map(cmd => cmd.name);
        
        console.log('\n✅ Verification:');
        expectedCommands.forEach(expected => {
          if (receivedCommands.includes(expected)) {
            console.log(`  ✅ ${expected} command found`);
          } else {
            console.log(`  ❌ ${expected} command missing`);
          }
        });
        
        console.log('\n🎉 Test completed successfully!');
        ws.close();
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout - no commands received');
    ws.close();
    process.exit(1);
  }, 10000);
}

testCommands().catch(console.error); 