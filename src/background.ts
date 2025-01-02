// background.ts
const injectedTabs = new Set<number>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_IN_PAGE') {
        const { questionConfig } = message.payload;
        // Testing without currentWindow true
        chrome.tabs.query({ active: true }, async (tabs) => {
            if (!tabs[0]?.id) {
                sendResponse({ success: false, error: 'No active tab found' });
                return;
            }

            try {
                // Ensure pageScript is injected
                if (!injectedTabs.has(tabs[0].id)) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        world: 'MAIN',
                        files: ['dist/pageScript.js']
                    });
                    injectedTabs.add(tabs[0].id);
                }

                // Execute the update
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    world: 'MAIN',
                    func: (config) => {
                        return new Promise((resolve) => {
                            if (!window.MetabaseHelper) {
                                resolve({ success: false, error: 'MetabaseHelper not found' });
                                return;
                            }

                            window.MetabaseHelper.updateQuestion(config)
                                .then(() => {
                                    resolve({ success: true, message: 'Question updated successfully' });
                                })
                                .catch(error => {
                                    resolve({ 
                                        success: false, 
                                        error: error instanceof Error ? error.message : 'Unknown error' 
                                    });
                                });
                        });
                    },
                    args: [questionConfig]
                });

                sendResponse(results[0].result);
                
            } catch (error) {
                console.error('Error in background script:', error);
                sendResponse({ 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
        });

        return true; // Keep the message channel open
    }
});

// Cleanup
chrome.tabs.onRemoved.addListener((tabId: number) => {
    injectedTabs.delete(tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener((details: { frameId: number, tabId: number }) => {
    if (details.frameId !== 0) return;
    injectedTabs.delete(details.tabId);
});