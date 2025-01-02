import { state } from "../state/state";

export const checkDatabaseSelected = (): boolean => {
    const databaseSection = document.querySelector('.GuiBuilder-section.GuiBuilder-data');
    if (!databaseSection) return false;

    const linkEl = databaseSection.querySelector('a');
    if (!linkEl) return false;

    const outerSpan = linkEl.querySelector('span');
    if (!outerSpan) return false;

    const textSpan = outerSpan.querySelector('span');
    if (!textSpan) return false;
    state.databaseName = textSpan.textContent || '';
    return textSpan.textContent !== 'Select a database';
};

export const showDatabaseWarning = () => {
    const messagesContainer = document.querySelector('.messages-container');
    const existingWarning = document.querySelector('.warning-message');

    if (!existingWarning && messagesContainer) {
        const warning = document.createElement('div');
        warning.className = 'warning-message';
        warning.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Please select a database to start querying
      `;
        messagesContainer.insertBefore(warning, messagesContainer.firstChild);
    }
};

export const hideDatabaseWarning = () => {
    const existingWarning = document.querySelector('.warning-message');
    if (existingWarning) {
        existingWarning.remove();
    }
};

export const setupDatabaseObserver = () => {
    let observer: MutationObserver | null = null;

    const startObserver = () => {
        const initialCheck = checkDatabaseSelected();
        if (!initialCheck) {
            showDatabaseWarning();
        }

        observer = new MutationObserver(() => {
            const isDatabaseSelected = checkDatabaseSelected();
            if (isDatabaseSelected) {
                hideDatabaseWarning();
            } else {
                showDatabaseWarning();
            }
        });

        const databaseSection = document.querySelector('.GuiBuilder-section.GuiBuilder-data');
        if (databaseSection) {
            observer.observe(databaseSection, {
                subtree: true,
                childList: true,
                characterData: true,
                characterDataOldValue: true
            });
        }
    };

    const checkAndStartObserver = () => {
        const databaseSection = document.querySelector('.GuiBuilder-section.GuiBuilder-data');
        if (databaseSection) {
            startObserver();
        } else {
            setTimeout(checkAndStartObserver, 500);
        }
    };

    checkAndStartObserver();

    return () => {
        if (observer) {
            observer.disconnect();
        }
    };
};