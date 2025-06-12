let socket;

let tabId = undefined;

function connectToWebSocket() {
    console.log('Connecting to WebSocket');
    socket = new WebSocket('ws://localhost:3001');  // Replace with your WebSocket server URL
  
    socket.onopen = () => {
        console.log('WebSocket connection opened');
    };
  
    socket.onmessage = (event) => {
        console.log('Message from server: ', event.data.toString());
        
        try {
            const message = JSON.parse(event.data.toString());
            
            if (tabId) {
                console.log('Forwarding message to tab: ', tabId, message);
                chrome.tabs.sendMessage(tabId, message);
            } else {
                console.warn('No active tab ID available to send message');
            }
        } catch (error) {
            console.error('Error parsing message: ', error);
        }
    };
  
    socket.onerror = (err) => {
        console.error('WebSocket error: ', err);
    };
  
    socket.onclose = () => {
        console.log('WebSocket closed');
        // Retry connecting after 5 seconds
        setTimeout(connectToWebSocket, 5000);
    };
}

// // Listen for an event to initiate the connection (e.g., a message from a content script or popup)
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'connect') {
//     connectToWebSocket();
//     sendResponse({status: 'connected'});
//   }
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Update tabId from the sender's tab information
    if (sender.tab && sender.tab.id) {
        tabId = sender.tab.id;
        console.log('Updated active tabId to:', tabId);
    }
    
    if (message.type === "pageHtml") {
        console.log("Received page html from content script on tab: " + tabId);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "pageHtml", html: message.html }));
        }
    }
    else if (message.type === "actionComplete") {
        console.log("Received action complete from content script:", message);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "keepAlive") {
        console.log("Keep-alive port opened");
        port.onDisconnect.addListener(() => {
            console.log("Keep-alive port closed");
        });
    }
});

connectToWebSocket();