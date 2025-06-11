// Quick test to verify memory injection is working
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('Connected to WebSocket');
  
  // Test with an identity question that should trigger memory injection
  setTimeout(() => {
    console.log('Sending test message: "Who am I?"');
    ws.send(JSON.stringify({
      type: 'prompt',
      payload: 'Who am I?'
    }));
  }, 1000);
});

ws.on('message', function message(data) {
  const parsed = JSON.parse(data);
  console.log('Received:', parsed.type);
  
  if (parsed.type === 'answerFromAssistant') {
    console.log('AI Response:', parsed.payload);
    ws.close();
  }
});

ws.on('close', function close() {
  console.log('Connection closed');
  process.exit(0);
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
  process.exit(1);
});