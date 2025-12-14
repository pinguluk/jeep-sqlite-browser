export default defineBackground(() => {
    console.log('Jeep SQLite Browser background service loaded');

    // Listen for connections from DevTools panel
    browser.runtime.onConnect.addListener((port) => {
        if (port.name === 'devtools-panel') {
            console.log('DevTools panel connected');

            port.onMessage.addListener((message) => {
                // Forward messages from devtools to content script
                browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
                    if (tabs[0]?.id) {
                        browser.tabs.sendMessage(tabs[0].id, message).then((response) => {
                            port.postMessage(response);
                        });
                    }
                });
            });
        }
    });
});
