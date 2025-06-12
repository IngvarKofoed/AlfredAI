let socket;

let tabId = undefined;

function connectToWebSocket() {
    console.log('Connecting to WebSocket');
  socket = new WebSocket('ws://localhost:12345');  // Replace with your WebSocket server URL
  
  socket.onopen = () => {
    console.log('WebSocket connection opened');
    socket.send(JSON.stringify({ type: "info", title: "Hello from Chrome extension!" }));
  };
  
  socket.onmessage = (event) => {
    console.log('Message from server: ', event.data.toString());
    
    // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     if (tabs.length > 0 && tabs[0].id !== undefined) {
    //       const tabId = tabs[0].id;
          console.log('Sending message to tab: ', tabId);
          chrome.tabs.sendMessage(tabId, { type: "greeting", text: event.data.toString() });
    //     }
    //   });
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
    if (message.type === "pageInfo") {
    tabId = sender.tab?.id;
      console.log("Received page title from content script:", message.title + " on tab: " + tabId);
      socket.send(JSON.stringify({ type: "pageTitle", title: message.title }));
    }
    if (message.type === "pageHtml") {
        console.log("Received page html from content script:", message.html + " on tab: " + tabId);
        socket.send(JSON.stringify({ type: "pageHtml", html: message.html }));
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