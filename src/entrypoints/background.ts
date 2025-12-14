export default defineBackground(() => {
    console.log('Jeep SQLite Browser background service loaded');

    /**
     * Inject content script programmatically if not already present
     */
    async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
        try {
            // Try to ping the content script
            await browser.tabs.sendMessage(tabId, { action: 'ping' });
            return true;
        } catch (error) {
            // Content script not present, try to inject it
            try {
                await browser.scripting.executeScript({
                    target: { tabId },
                    files: ['content-scripts/content.js']
                });
                console.log(`Injected content script into tab ${tabId}`);
                // Small delay to let it initialize
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            } catch (injectError) {
                console.error('Failed to inject content script:', injectError);
                return false;
            }
        }
    }

    // Listen for connections from DevTools panel
    browser.runtime.onConnect.addListener((port) => {
        if (port.name === 'devtools-panel') {
            console.log('DevTools panel connected');

            port.onMessage.addListener(async (message) => {
                const { _id, tabId, ...contentMessage } = message;

                // Forward message to content script in the inspected tab
                const targetTabId = tabId || chrome.devtools?.inspectedWindow?.tabId;

                if (targetTabId) {
                    // Ensure content script is injected before sending message
                    const isInjected = await ensureContentScriptInjected(targetTabId);
                    
                    if (!isInjected) {
                        port.postMessage({ 
                            success: false, 
                            error: 'Could not inject content script. Please refresh the page.', 
                            _id 
                        });
                        return;
                    }

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
