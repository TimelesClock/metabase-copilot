// src/content/components/DashboardOverlay.ts

import { getDashboardService } from '../services/DashboardService';
import { showErrorDialog } from '../utils/dashboardDialog';

export class DashboardOverlay {
    private container: HTMLElement;
    private currentDashboardId: string | null = null;

    static createOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'dashboard-overlay';

        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-header">
                    <h2>Dashboard Session</h2>
                </div>
                
                <div class="overlay-body">
                    <div id="overlayStatus" class="overlay-status">
                        <div class="loading-spinner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                        </div>
                        <span>Checking dashboard status...</span>
                    </div>
                    
                    <div id="sessionsList" class="sessions-list" style="display: none;">
                        <!-- Sessions will be populated here -->
                    </div>
                    
                    <div class="overlay-actions">
                        <button id="createSession" class="action-button primary" style="display: none;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Create New Session
                        </button>
                    </div>
                </div>
            </div>
        `;

        return overlay;
    }

    constructor() {
        this.container = DashboardOverlay.createOverlay();
        this.initialize();
    }

    private async initialize() {
        // Extract dashboard ID from URL
        const pathMatch = window.location.pathname.match(/\/dashboard\/(\d+)/);
        this.currentDashboardId = pathMatch ? pathMatch[1] : null;

        if (!this.currentDashboardId) {
            this.hideOverlay();
            return;
        }

        document.body.appendChild(this.container);
        await this.checkDashboardStatus();
        this.setupEventListeners();
    }

    private async checkDashboardStatus() {
        const service = getDashboardService();
        const statusEl = this.container.querySelector('#overlayStatus') as HTMLElement;
        const sessionsListEl = this.container.querySelector('#sessionsList') as HTMLElement;
        const createButtonEl = this.container.querySelector('#createSession') as HTMLElement;

        try {
            const sessions = await service.listSessions();
            const currentSession = sessions.find(s =>
                s.dashboardId === parseInt(this.currentDashboardId || '0')
            );

            if (currentSession) {
                // Dashboard is part of a session - join it automatically
                await service.joinSession(currentSession.id);
                this.hideOverlay();
            } else {
                // Show available sessions and creation option
                statusEl.style.display = 'none';
                createButtonEl.style.display = 'flex';

                if (sessions.length > 0) {
                    await this.renderSessionsList(sessions, sessionsListEl);
                    sessionsListEl.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Failed to check dashboard status:', error);
            statusEl.innerHTML = `
                <div class="error-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Failed to check dashboard status. Please try again.</span>
                </div>
            `;
        }
    }

    private async renderSessionsList(sessions: any[], container: HTMLElement) {
        const sessionsList = sessions.map(session => `
            <div class="session-item">
                <div class="session-item-info">
                    <div class="session-item-name">${session.name}</div>
                    <div class="session-item-date">Created: ${new Date(session.created).toLocaleString()}</div>
                </div>
                <button class="join-session" data-id="${session.id}">Join Session</button>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="sessions-header">Available Sessions</div>
            ${sessionsList}
        `;
    }

    private setupEventListeners() {
        const createButton = this.container.querySelector('#createSession');
        const sessionsList = this.container.querySelector('#sessionsList');

        createButton?.addEventListener('click', async () => {
            try {
                const service = getDashboardService();
                await service.initializeSession();
                this.hideOverlay();
            } catch (error) {
                await showErrorDialog('Failed to create session: ' + error.message);
            }
        });

        sessionsList?.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('join-session')) {
                const sessionId = target.dataset.id;
                if (!sessionId) return;

                try {
                    const service = getDashboardService();
                    await service.joinSession(sessionId);
                    this.hideOverlay();
                } catch (error) {
                    await showErrorDialog('Failed to join session: ' + error.message);
                }
            }
        });
    }

    private hideOverlay() {
        this.container.remove();
    }
}