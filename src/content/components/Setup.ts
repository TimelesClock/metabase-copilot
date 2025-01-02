import { createSidebar } from './Sidebar';
import { setupDatabaseObserver } from './DatabaseHandler';

let documentObserver: MutationObserver | null = null;
let databaseCleanup: (() => void) | null = null;

export const setupElements = () => {
    const existingSidebar = document.getElementById('sql-assistant-sidebar');
    if (existingSidebar) {
        existingSidebar.remove();
    }

    createSidebar();

    databaseCleanup = setupDatabaseObserver();

    documentObserver = new MutationObserver((mutations) => {
        if (document.querySelector('.GuiBuilder-section.GuiBuilder-data')) {
            if (databaseCleanup) {
                databaseCleanup();
            }
            databaseCleanup = setupDatabaseObserver();
            documentObserver?.disconnect();
        }
    });

    documentObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
};

export const destroyElements = () => {
    // Remove the sidebar
    const sidebar = document.getElementById('sql-assistant-sidebar');
    if (sidebar) {
        sidebar.remove();
    }

    // Clean up database observer
    if (databaseCleanup) {
        databaseCleanup();
        databaseCleanup = null;
    }

    // Disconnect document observer
    if (documentObserver) {
        documentObserver.disconnect();
        documentObserver = null;
    }
};