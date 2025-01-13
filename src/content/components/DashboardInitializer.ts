// src/content/components/DashboardInitializer.ts

import { getDashboardService } from '../services/DashboardService';
import { showErrorDialog } from '../utils/dashboardDialog';

export class DashboardInitializer {
    static createUI(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'dashboard-initializer';

        container.innerHTML = `
            <div class="initializer-content">
                <div class="initializer-header">
                    <h3>Initialize Dashboard Chat</h3>
                </div>
                
                <div class="initializer-body">
                    <p class="initializer-description">
                        To start using chat for this dashboard, we'll create a temporary folder 
                        in your personal collection to store visualizations and chat history.
                    </p>
                    
                    <div id="initStatus" class="init-status" style="display: none;">
                        <div class="loading-spinner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                            </svg>
                            <span>Initializing...</span>
                        </div>
                    </div>

                    <div class="initializer-actions">
                        <button id="initializeChat" class="action-button primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            Initialize Chat
                        </button>
                    </div>
                </div>
            </div>
        `;

        return container;
    }

    static async setupHandlers(container: HTMLElement, onInitialized: () => void) {
        const initButton = container.querySelector('#initializeChat') as HTMLElement;
        const statusEl = container.querySelector('#initStatus') as HTMLElement;

        initButton?.addEventListener('click', async () => {
            try {
                initButton.style.display = 'none';
                statusEl.style.display = 'flex';

                const service = getDashboardService();
                await service.initializeSession();

                // Remove initializer and enable chat
                container.remove();
                onInitialized();
            } catch (error) {
                initButton.style.display = 'flex';
                statusEl.style.display = 'none';
                await showErrorDialog('Failed to initialize chat: ' + error.message);
            }
        });
    }

    static async checkExistingSession(dashboardId: string): Promise<boolean> {
        try {
            const service = getDashboardService();
            const sessions = await service.listSessions();
            const existingSession = sessions.find(s =>
                s.dashboardId === parseInt(dashboardId)
            );

            if (existingSession) {
                await service.joinSession(existingSession.id);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to check existing sessions:', error);
            return false;
        }
    }
}