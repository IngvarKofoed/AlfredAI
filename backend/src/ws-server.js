const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');

console.log('Starting WebSocket server on port 12345');

const wss = new WebSocket.Server({ port: 12345 });

// Keep track of connected clients
const clients = new Set();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        const messageObj = JSON.parse(message);
        console.log(messageObj);
        if (messageObj.type === "pageHtml") {
            console.log('Received page html from client');
            fs.writeFileSync('page.html', messageObj.html);

        }
        else {
            console.log('Received page info from client:', message.toString());
            console.log(JSON.stringify(message));
            // ws.send('Hello from the server');
        }
        // if (messageObj.type === "pageHtml") {
        //     console.log('Received page html from client');
        //     // ws.send('Hello from the server');
        // }
        // else {
        //     console.log('Received page info from client:', message.toString());
        //     console.log(JSON.stringify(message));
        //     // ws.send('Hello from the server');
        // }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

// Handle user input to send messages to all clients
console.log('Type a message and press Enter to send to all connected clients:');
rl.on('line', (input) => {
    if (input.trim()) {
        console.log(`Sending to ${clients.size} client(s): ${input}`);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(input);
            }
        });
    }
    // Show prompt again
    process.stdout.write('> ');
});

// Show initial prompt
process.stdout.write('> ');


