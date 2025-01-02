import { state } from './state/state';
import { setupElements, destroyElements } from './components/Setup';
import getMetabaseVersion from '../functions/getMetabaseVersion';
import { loadMetabaseQuestion } from './utils/loadMetabaseQuestion';
import './styles/index.css';

function isQuestionPage() {
    return window.location.pathname.includes('/question');
}

function handleUrlChange() {
    if (!isQuestionPage() && state.isContentScriptLoaded) {
        destroyElements();
        state.isContentScriptLoaded = false;
    } else if (isQuestionPage() && !state.isContentScriptLoaded) {
        main();
    }
}

async function main() {
    if (state.isContentScriptLoaded) {
        return;
    }
    state.isContentScriptLoaded = true;

    // Simple message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'UPDATE_QUESTION') {
            loadMetabaseQuestion(message.questionConfig)
                .then(result => {
                    sendResponse({ success: true, result });
                })
                .catch(error => {
                    console.error('Error updating Metabase question:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Keep the message port open
        }
    });

    try {
        state.version = await getMetabaseVersion();
    } catch (error) {
        console.error('Error getting Metabase version:', error);
        state.version = [50, 13];
    }

    setupElements();
    console.log('SQL Assistant initialized successfully');
}

// Set up URL change detection
const observer = new MutationObserver(() => {
    handleUrlChange();
});

// Start observing the document with the configured parameters
observer.observe(document, { subtree: true, childList: true });

// Also handle regular navigation events
window.addEventListener('popstate', handleUrlChange);
window.addEventListener('pushstate', handleUrlChange);
window.addEventListener('replacestate', handleUrlChange);

// Initial load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isQuestionPage()) {
            main();
        }
    });
} else {
    if (isQuestionPage()) {
        main();
    }
}