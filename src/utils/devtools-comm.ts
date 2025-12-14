/**
 * DevTools Communication Helper
 * Handles message passing between DevTools panel and content script via background
 */

// Establish connection to background script
const port = chrome.runtime.connect({ name: 'devtools-panel' });

// Callback storage for async responses
const callbacks: Map<number, (response: any) => void> = new Map();
let messageId = 0;

// Listen for responses from background
port.onMessage.addListener((message) => {
    if (message._id !== undefined && callbacks.has(message._id)) {
        const callback = callbacks.get(message._id)!;
        callbacks.delete(message._id);
        callback(message);
    }
});

/**
 * Send message to content script via background
 */
export function sendToContentScript(message: any): Promise<any> {
    return new Promise((resolve) => {
        const id = messageId++;
        callbacks.set(id, resolve);

        // Add ID to track response
        port.postMessage({ ...message, _id: id });
    });
}

/**
 * Get the inspected tab ID
 */
export function getInspectedTabId(): number {
    return chrome.devtools.inspectedWindow.tabId;
}
