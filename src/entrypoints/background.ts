export default defineBackground(() => {
    console.log('Jeep SQLite Browser background service loaded');

    // Listen for connections from DevTools panel
    browser.runtime.onConnect.addListener((port) => {
        if (port.name === 'devtools-panel') {
            console.log('DevTools panel connected');

            port.onMessage.addListener((message) => {
                const { _id, tabId, ...contentMessage } = message;

                // Forward message to content script in the inspected tab
                const targetTabId = tabId || chrome.devtools?.inspectedWindow?.tabId;

                if (targetTabId) {
                    browser.tabs.sendMessage(targetTabId, contentMessage)
                        .then((response) => {
                            // Send response back to panel with original ID
                            port.postMessage({ ...response, _id });
                        })
                        .catch((error) => {
                            console.error('Failed to send message to content script:', error);
                            port.postMessage({ success: false, error: error.message, _id });
                        });
                } else {
                    port.postMessage({ success: false, error: 'No tab ID available', _id });
                }
            });

            port.onDisconnect.addListener(() => {
                console.log('DevTools panel disconnected');
            });
        }
    });
});
