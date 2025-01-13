import type { MetabaseQuestion } from '../utils/loadMetabaseQuestion';
import { showErrorDialog, showConfirmDialog, showPromptDialog } from '../utils/dashboardDialog';

interface DashboardSession {
    collectionId?: number;
    dashboardId?: number;
    name: string;
}

interface MetabaseUser {
    id: number;
    personal_collection_id: number;
    first_name: string;
    last_name: string;
    email: string;
}

export interface SessionInfo {
    id: string;
    name: string;
    created: string;
    dashboardId: number;
    collectionId: number;
}

const STORAGE_KEY = 'llm_dashboard_sessions';

export class DashboardService {
    private currentSession: DashboardSession | null = null;
    private readonly baseUrl: string;
    private sessions: SessionInfo[] = [];

    constructor() {
        const url = new URL(window.location.href);
        this.baseUrl = `${url.origin}/api`;
        this.loadSessions();
    }

    private loadSessions() {
        const savedSessions = localStorage.getItem(STORAGE_KEY);
        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
        }
    }

    private saveSessions() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
    }

    getCurrentSession(): DashboardSession | null {
        return this.currentSession;
    }

    async initializeSession(sessionName?: string): Promise<void> {
        try {
            // Get current dashboard ID from URL
            const pathMatch = window.location.pathname.match(/\/dashboard\/(\d+)-[\w-]+/);
            const currentDashboardId = pathMatch ? parseInt(pathMatch[1]) : null;

            if (!currentDashboardId) {
                throw new Error('Could not determine current dashboard ID');
            }

            // Verify dashboard exists and is accessible
            const dashResponse = await fetch(
                `${this.baseUrl}/dashboard/${currentDashboardId}`,
                { credentials: 'include' }
            );

            if (!dashResponse.ok) {
                throw new Error('Current dashboard not accessible');
            }

            const currentUser = await this.getCurrentUser();
            if (!currentUser.personal_collection_id) {
                throw new Error('Could not find personal collection');
            }

            // Create name with dashboard ID included
            const name = sessionName || `LLM Session [Dashboard ${currentDashboardId}] ${new Date().toLocaleString()}`;
            if (!name) return;

            // Create collection but don't create a new dashboard
            const collection = await this.createCollection(name, currentUser.personal_collection_id);

            const sessionInfo: SessionInfo = {
                id: collection.id.toString(),
                name,
                created: new Date().toISOString(),
                dashboardId: currentDashboardId,  // Use existing dashboard ID
                collectionId: collection.id
            };

            this.sessions.push(sessionInfo);
            this.saveSessions();

            this.currentSession = {
                collectionId: collection.id,
                dashboardId: currentDashboardId,  // Use existing dashboard ID
                name
            };

        } catch (error) {
            console.error('Failed to initialize dashboard session:', error);
            await showErrorDialog(`Failed to create session: ${error.message}`);
            throw error;
        }
    }

    private async getCurrentUser(): Promise<MetabaseUser> {
        const response = await fetch(`${this.baseUrl}/user/current`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch current user');
        }

        return response.json();
    }

    async listSessions(): Promise<SessionInfo[]> {
        // First check localStorage
        if (this.sessions.length > 0) {
            return this.sessions;
        }

        try {
            const user = await this.getCurrentUser();
            const response = await fetch(
                `${this.baseUrl}/collection/${user.personal_collection_id}/items?models=collection`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch collections');
            }

            const responseData = await response.json();

            // Get current dashboard ID for filtering
            const pathMatch = window.location.pathname.match(/\/dashboard\/(\d+)-[\w-]+/);
            const currentDashboardId = pathMatch ? pathMatch[1] : null;

            // Filter collections for current dashboard
            const sessionCollections = responseData.data.filter((item: any) =>
                item.name.toLowerCase().startsWith('llm session') &&
                item.name.includes(`[Dashboard ${currentDashboardId}]`)
            );

            const discoveredSessions: SessionInfo[] = sessionCollections.map(collection => ({
                id: collection.id.toString(),
                name: collection.name,
                created: collection.created_at || new Date().toISOString(),
                dashboardId: parseInt(currentDashboardId!), // We know this exists from the filter
                collectionId: collection.id
            }));

            // Update local storage with discovered sessions
            this.sessions = discoveredSessions;
            this.saveSessions();

            return this.sessions;
        } catch (error) {
            console.error('Error discovering sessions:', error);
            await showErrorDialog('Failed to list sessions: ' + error.message);
            return [];
        }
    }

    async joinSession(sessionId: string): Promise<void> {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        try {
            // Verify dashboard still exists and is accessible
            const response = await fetch(
                `${this.baseUrl}/dashboard/${session.dashboardId}`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                const shouldRemove = await showConfirmDialog(
                    'This dashboard no longer exists. Remove it from your sessions?'
                );

                if (shouldRemove) {
                    this.sessions = this.sessions.filter(s => s.id !== sessionId);
                    this.saveSessions();
                }

                throw new Error('Dashboard no longer exists');
            }

            this.currentSession = {
                collectionId: session.collectionId,
                dashboardId: session.dashboardId,
                name: session.name
            };
        } catch (error) {
            await showErrorDialog('Failed to join session: ' + error.message);
            throw error;
        }
    }

    private async createCollection(name: string, parentId: number) {
        const response = await fetch(`${this.baseUrl}/collection`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                color: '#509EE3',
                parent_id: parentId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create collection');
        }

        return response.json();
    }

    async createTextCard(text: string, sizeX: number, sizeY: number, row: number, col: number) {
        // Create card then edit
        const newCardRes = await fetch(`${this.baseUrl}/dashboard/${this.currentSession.dashboardId}/cards`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cardId: null
            })
        });

        const newCard = await newCardRes.json();

        //Get the card list
        const cards = await fetch(`${this.baseUrl}/dashboard/${this.currentSession.dashboardId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // edit cards, change out the card that holds card.id
        let cardList = await cards.json();
        cardList = cardList.ordered_cards.map((card: any) => {
            if (card.id === newCard.id) {
                return {
                    ...card,
                    sizeX,
                    sizeY,
                    row,
                    col,
                    visualization_settings: {
                        text: `${text}`,
                        virtual_card: {
                            archived: false,
                            display: "text",
                            dataset_query: {},
                            name: null,
                            visualization_settings: {}
                        },
                    },
                }
            }else{
                return card
            }
        })

        // Update the card
        const res = await fetch(`${this.baseUrl}/dashboard/${this.currentSession.dashboardId}/cards`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cards: cardList })
        });



        if (!res.ok) {
            throw new Error('Failed to create text card');
        }

        return res.json();
    }

    async getDashboardCards() {
        const response = await fetch(`${this.baseUrl}/dashboard/${this.currentSession.dashboardId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard cards');
        }

        let data = await response.json();

        return data.ordered_cards;
    }

    private async createVisualizationCard(metabaseQuestion: MetabaseQuestion) {
        // First create the question/card
        const cardResponse = await fetch(`${this.baseUrl}/card`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...metabaseQuestion,
                collection_id: this.currentSession?.collectionId
            })
        });

        if (!cardResponse.ok) {
            throw new Error('Failed to create card');
        }

        const card = await cardResponse.json();
        return card;
    }

    async addCardToDashboard(
        question: MetabaseQuestion,
        size_x: number,
        size_y: number,
        row: number,
        col: number
    ): Promise<void> {
        if (!this.currentSession?.dashboardId) {
            throw new Error('No active dashboard session');
        }
        try {
            // Create visualization card
            const card = await this.createVisualizationCard(
                question
            );

            // Then add it to the dashboard
            const dashCardResponse = await fetch(`${this.baseUrl}/dashboard/${this.currentSession.dashboardId}/cards`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardId: card.id,
                    sizeX: size_x,
                    sizeY: size_y,
                    row,
                    col,
                })
            });

            if (!dashCardResponse.ok) {
                throw new Error('Failed to add card to dashboard');
            }

            return dashCardResponse.json();

        } catch (error) {
            await showErrorDialog('Failed to add content to dashboard: ' + error.message);
            throw error;
        }
    }
    async updateDashboardLayout(layout: Array<{
        id: number;
        size_x: number;
        size_y: number;
        row: number;
        col: number;
    }>): Promise<void> {
        if (!this.currentSession?.dashboardId) {
            throw new Error('No active dashboard session');
        }

        try {
            // Get current dashboard state
            const response = await fetch(
                `${this.baseUrl}/dashboard/${this.currentSession.dashboardId}`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard');
            }

            const dashboard = await response.json();
            const currentCards = dashboard.ordered_cards;

            // Update positions while preserving other card properties
            const updates = currentCards.map((card: any) => {
                const layoutUpdate = layout.find(l => l.id === card.id);
                if (layoutUpdate) {
                    return {
                        ...card,
                        size_x: layoutUpdate.size_x,
                        size_y: layoutUpdate.size_y,
                        row: layoutUpdate.row,
                        col: layoutUpdate.col,
                    };
                }
                return card;
            });

            // Update dashboard layout
            const layoutResponse = await fetch(
                `${this.baseUrl}/dashboard/${this.currentSession.dashboardId}/cards`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cards: updates })
                }
            );

            if (!layoutResponse.ok) {
                throw new Error('Failed to update dashboard layout');
            }

            /* TODO: Handle React/DOM updates
            // Find and update the dashboard container
            const dashboardContainer = document.querySelector('.Dashboard');
            if (dashboardContainer) {
                // Need to find correct React functions to trigger re-render
                // Possibly:
                // 1. Find dashboard component in React fiber
                // 2. Call appropriate update method
                // 3. Or trigger a custom event that React is listening for
            }
            */
        } catch (error) {
            await showErrorDialog('Failed to update dashboard layout: ' + error.message);
            throw error;
        }
    }

    async updateCard(cardId: number, question: MetabaseQuestion
    ): Promise<void> {
        if (!this.currentSession?.collectionId) {
            throw new Error('No active dashboard session');
        }

        try {
            // First, verify the card is in our collection
            const cardsResponse = await fetch(
                `${this.baseUrl}/collection/${this.currentSession.collectionId}/items?models=card`,
                { credentials: 'include' }
            );

            if (!cardsResponse.ok) {
                throw new Error('Failed to verify card ownership');
            }

            const cardsData = await cardsResponse.json();
            const card = cardsData.data.find((item: any) => item.id === cardId);

            if (!card) {
                throw new Error('Card not found in current session collection');
            }

            // Update the card
            const updateResponse = await fetch(
                `${this.baseUrl}/card/${cardId}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(question)
                }
            );

            if (!updateResponse.ok) {
                throw new Error('Failed to update card');
            }

            /* TODO: Handle React/DOM updates
            // Find and update the card container
            const cardContainer = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardContainer) {
                // Need to find correct React functions to trigger re-render
            }
            */
        } catch (error) {
            await showErrorDialog('Failed to update card: ' + error.message);
            throw error;
        }
    }

    async deleteChart(cardId: number): Promise<void> {
        if (!this.currentSession?.dashboardId || !this.currentSession?.collectionId) {
            throw new Error('No active dashboard session');
        }

        try {
            // First, verify the card is in our collection
            const cardsResponse = await fetch(
                `${this.baseUrl}/collection/${this.currentSession.collectionId}/items?models=card`,
                { credentials: 'include' }
            );

            if (!cardsResponse.ok) {
                throw new Error('Failed to verify card ownership');
            }

            const cardsData = await cardsResponse.json();
            const card = cardsData.data.find((item: any) => item.id === cardId);
            console.log(cardsData)
            console.log(this.currentSession.collectionId)
            if (!card) {
                throw new Error('Card not found in current session collection');
            }

            // First remove from dashboard
            const dashResponse = await fetch(
                `${this.baseUrl}/dashboard/${this.currentSession.dashboardId}/cards`,
                { credentials: 'include' }
            );

            if (dashResponse.ok) {
                const dashboard = await dashResponse.json();
                const cardRef = dashboard.ordered_cards.find((c: any) => c.card_id === cardId);

                if (cardRef) {
                    await fetch(
                        `${this.baseUrl}/dashboard/${this.currentSession.dashboardId}/cards/${cardRef.id}`,
                        {
                            method: 'DELETE',
                            credentials: 'include'
                        }
                    );
                }
            }

            // Then delete the card itself
            const deleteResponse = await fetch(
                `${this.baseUrl}/card/${cardId}`,
                {
                    method: 'DELETE',
                    credentials: 'include'
                }
            );

            if (!deleteResponse.ok) {
                throw new Error('Failed to delete card');
            }

            /* TODO: Handle React/DOM updates
            // Find and remove the card container
            const cardContainer = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardContainer) {
                // Need to find correct React functions to trigger re-render
            }
            */
        } catch (error) {
            await showErrorDialog('Failed to delete card: ' + error.message);
            throw error;
        }
    }

    async getCollectionItems(): Promise<any> {
        if (!this.currentSession?.dashboardId) {
            throw new Error('No active dashboard session');
        }
        // /api/collection/:collectionId/items?models=card
        try {
            const response = await fetch(
                `${this.baseUrl}/collection/${this.currentSession?.collectionId}/items?models=card`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard content');
            }

            return response.json();
        } catch (error) {
            await showErrorDialog('Failed to get dashboard content: ' + error.message);
            throw error;
        }
    }
}

// Create singleton instance
let dashboardService: DashboardService | null = null;

export const getDashboardService = (): DashboardService => {
    if (!dashboardService) {
        dashboardService = new DashboardService();
    }
    return dashboardService;
};