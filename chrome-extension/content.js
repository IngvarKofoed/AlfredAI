// This runs in the context of the webpage
const pageTitle = document.title;

console.log("Content script loaded on:", window.location.href);

const port = chrome.runtime.connect({ name: "keepAlive" });

// Function to get page HTML
function getPageHtml() {
    return document.documentElement.outerHTML;
}

// Send HTML
function sendHtml() {
    console.log("Sending HTML to background script");
    chrome.runtime.sendMessage({ type: "pageHtml", html: getPageHtml() });
}

// Send initial HTML when page is fully loaded and rendered
function waitForPageReady() {
    if (document.readyState === 'complete') {
        // Page is fully loaded, but wait a bit more for dynamic content
        setTimeout(sendHtml, 1000);
    } else if (document.readyState === 'loading') {
        // Page is still loading, wait for load event
        window.addEventListener('load', () => {
            // Wait a bit more for any dynamic content to render
            setTimeout(sendHtml, 1000);
        });
    } else {
        // Page is interactive but not complete, wait for load event
        window.addEventListener('load', () => {
            setTimeout(sendHtml, 1000);
        });
    }
}

waitForPageReady();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message);
    
    if (message.type === "scroll") {
        console.log("Handling scroll action");
        handleScrollAction(message);
    } else if (message.type === "close") {
        console.log("Handling close action");
        handleCloseAction(message);
    } else if (message.type === "navigate") {
        console.log("Handling navigate action");
        handleNavigateAction(message);
    } else {
        console.log("Unknown message type:", message.type);
    }
});

// Handle scroll actions
function handleScrollAction(message) {
    const { direction, pages = 1, actionId } = message;
    const scrollAmount = window.innerHeight * 0.8; // Scroll 80% of viewport height each time
    const totalScrollAmount = scrollAmount * pages;
    
    if (direction === 'down') {
        window.scrollBy({
            top: totalScrollAmount,
            behavior: 'smooth'
        });
    } else if (direction === 'up') {
        window.scrollBy({
            top: -totalScrollAmount,
            behavior: 'smooth'
        });
    }
    
    // Wait a bit for scroll to complete, then send response
    setTimeout(() => {
        // Send action completion confirmation
        chrome.runtime.sendMessage({ 
            type: "actionComplete", 
            actionId: actionId,
            action: "scroll",
            direction: direction,
            pages: pages
        });
        
        // Send updated HTML
        chrome.runtime.sendMessage({ type: "pageHtml", html: getPageHtml() });
    }, 1000);
}

// Handle close action
function handleCloseAction(message) {
    const { actionId } = message;
    
    // Send action completion confirmation
    chrome.runtime.sendMessage({ 
        type: "actionComplete", 
        actionId: actionId,
        action: "close"
    });
    
    // Close the tab/window
    setTimeout(() => {
        window.close();
    }, 500);
}

// Handle navigate action
function handleNavigateAction(message) {
    const { url, actionId } = message;
    
    console.log("Navigating to URL:", url);

    // Send action completion confirmation
    chrome.runtime.sendMessage({ 
        type: "actionComplete", 
        actionId: actionId,
        action: "navigate",
        url: url
    });
    
    // Wait a bit for the message to be sent, then navigate to the new URL
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}

// Function to scroll down 5 times with delays
// async function scrollDownFiveTimes() {
//   const scrollAmount = window.innerHeight * 0.8; // Scroll 80% of viewport height each time
//   const scrollDelay = 1000; // 1 second delay between scrolls
  
//   for (let i = 1; i <= 5; i++) {
//     console.log(`Scrolling down ${i}/5...`);
//     window.scrollBy({
//       top: scrollAmount,
//       behavior: 'smooth'
//     });
    
//     // Wait for the scroll delay before the next scroll
//     if (i < 5) {
//       await new Promise(resolve => setTimeout(resolve, scrollDelay));
//     }
//   }
  
//   console.log("Finished scrolling down 5 times!");
// }

// // Start scrolling after a short delay to let the page load
// setTimeout(() => {
//   scrollDownFiveTimes();
// }, 1000);

// // content_script.js

// // A tiny helper that waits up to `timeout` ms for a selector to appear in the DOM.
// // If found, resolves with the element; otherwise rejects.
// async function waitForSelector(selector, timeout = 5000) {
//   const start = Date.now();
//   return new Promise((resolve, reject) => {
//     (function check() {
//       const el = document.querySelector(selector);
//       if (el) return resolve(el);
//       if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for ${selector}`));
//       setTimeout(check, 250);
//     })();
//   });
// }

// (async () => {
//   // 1) Log the current page URL for debugging:
//   console.log("Minimal All‐Pages Automator running on:", window.location.href);

//   // 2) If this happens to be a Facebook page, try clicking the first Like button.
//   //    Otherwise, do nothing (or add your own logic for other sites).
//   //
//   //    Note: Facebook's markup changes frequently. As of this writing (May 2025),
//   //    many "Like" buttons carry `data-testid="fb-ufi-likelink"`. You may need to adjust
//   //    the selector if FB changes it again.
//   //
//   // const isFacebook = window.location.hostname.includes("facebook.com");
//   // if (isFacebook) {
//   //   try {
//   //     // Wait up to 5 seconds for the first "Like" button to appear:
//   //     const LIKE_BUTTON_SELECTOR = "div[data-testid='fb-ufi-likelink']";
//   //     const btn = await waitForSelector(LIKE_BUTTON_SELECTOR, 5000);
//   //     console.log("Minimal All‐Pages Automator: Clicking Facebook Like button…");
//   //     btn.click();
//   //     console.log("Minimal All‐Pages Automator: Click dispatched.");
//   //   } catch (err) {
//   //     console.warn("Minimal All‐Pages Automator: Could not find FB Like button:", err.message);
//   //   }
//     document.querySelectorAll("a[href^='http']").forEach(a => {
//       a.style.border = "1px solid red";
//     });

//     const p0 = document.querySelector("p");
//     if (p0) p0.style.backgroundColor = "yellow";

//   // 3) (Optional) If you wanted to act on *all* pages (not just Facebook), put your logic here.
//   //    For example:
//   //
//   //    if (window.location.hostname.includes("twitter.com")) {
//   //      // look for a "Favorite" star, or a "Like" button, etc.
//   //    }
//   //
//   //    Or even generic DOM-mutation logging:
//   //    const firstHeading = document.querySelector("h1");
//   //    if (firstHeading) {
//   //      console.log("First <h1> on this page:", firstHeading.innerText);
//   //    }
//   //
// })();
