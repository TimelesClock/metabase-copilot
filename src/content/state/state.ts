// src/content/state/state.ts
import { GlobalState, Message } from '../types/types';

export const initialState: GlobalState = {
    configDict: {},
    storeQueryContent: undefined,
    isContentScriptLoaded: false,
    version: [50, 13],
    previousQueryContents: [],
    isOperationRunning: false,
    messageHistory: {
        query: JSON.parse(localStorage.getItem('queryMessages') || '[]'),
        dashboard: JSON.parse(localStorage.getItem('dashboardMessages') || '[]')
    },
    dashboard: {
        isActive: false,
        collectionId: undefined,
        dashboardId: undefined,
        sessionName: undefined
    }
};

export let state: GlobalState = { ...initialState };

export const getCurrentMessages = () => {
    const isDashboardMode = window.location.pathname.includes('/dashboard');
    return isDashboardMode ? state.messageHistory.dashboard : state.messageHistory.query;
};

export const addMessage = (message: Message) => {
    const isDashboardMode = window.location.pathname.includes('/dashboard');
    const messages = isDashboardMode ? state.messageHistory.dashboard : state.messageHistory.query;
    
    // Ensure tool_calls is initialized if not present
    if (!message.tool_calls) {
        message.tool_calls = '<tool_calls></tool_calls>';
    }
    
    // If updating an existing message (for tool calls)
    const existingMessageIndex = messages.findIndex(m => 
        m.timestamp === message.timestamp && m.role === message.role
    );

    if (existingMessageIndex !== -1) {
        messages[existingMessageIndex] = {
            ...messages[existingMessageIndex],
            ...message
        };
    } else {
        messages.push(message);
    }

    // Update appropriate storage
    const storageKey = isDashboardMode ? 'dashboardMessages' : 'queryMessages';
    localStorage.setItem(storageKey, JSON.stringify(messages));
    localStorage.setItem('messageHistory', JSON.stringify(getCurrentMessages()));
};

export const clearMessages = () => {
    const isDashboardMode = window.location.pathname.includes('/dashboard');
    if (isDashboardMode) {
        state.messageHistory.dashboard = [];
        localStorage.setItem('dashboardMessages', '[]');
    } else {
        state.messageHistory.query = [];
        localStorage.setItem('queryMessages', '[]');
    }
    localStorage.setItem('messageHistory', '[]');
};

export const loadMessages = () => {
    const isDashboardMode = window.location.pathname.includes('/dashboard');
    const storageKey = isDashboardMode ? 'dashboardMessages' : 'queryMessages';

    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
        try {
            const messages = JSON.parse(savedMessages);
            const processedMessages = messages.map((msg: Message) => ({
                ...msg,
                tool_calls: msg.tool_calls || '<tool_calls></tool_calls>'
            }));

            if (isDashboardMode) {
                state.messageHistory.dashboard = processedMessages;
            } else {
                state.messageHistory.query = processedMessages;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            if (isDashboardMode) {
                state.messageHistory.dashboard = [];
            } else {
                state.messageHistory.query = [];
            }
        }
    }
};

export const resetState = () => {
    const currentMessages = {
        query: state.messageHistory.query,
        dashboard: state.messageHistory.dashboard
    };

    state = {
        ...initialState,
        messageHistory: currentMessages
    };

    localStorage.setItem('queryMessages', JSON.stringify(currentMessages.query));
    localStorage.setItem('dashboardMessages', JSON.stringify(currentMessages.dashboard));
    localStorage.setItem('messageHistory', JSON.stringify(getCurrentMessages()));
};

export const initializeMessageHistory = () => {
    const legacyMessages = JSON.parse(localStorage.getItem('messageHistory') || '[]');

    if (legacyMessages.length > 0 && state.messageHistory.query.length === 0) {
        state.messageHistory.query = legacyMessages;
        localStorage.setItem('queryMessages', JSON.stringify(legacyMessages));
    }

    state.messageHistory.query = JSON.parse(localStorage.getItem('queryMessages') || '[]');
    state.messageHistory.dashboard = JSON.parse(localStorage.getItem('dashboardMessages') || '[]');
};

// Function to update tool calls for a specific message
export const updateMessageToolCalls = (messageTimestamp: string, toolCallsXml: string) => {
    const messages = getCurrentMessages();
    const messageIndex = messages.findIndex(m => m.timestamp === messageTimestamp);
    
    if (messageIndex !== -1) {
        const isDashboardMode = window.location.pathname.includes('/dashboard');
        if (isDashboardMode) {
            state.messageHistory.dashboard[messageIndex].tool_calls = toolCallsXml;
            localStorage.setItem('dashboardMessages', JSON.stringify(state.messageHistory.dashboard));
        } else {
            state.messageHistory.query[messageIndex].tool_calls = toolCallsXml;
            localStorage.setItem('queryMessages', JSON.stringify(state.messageHistory.query));
        }
        localStorage.setItem('messageHistory', JSON.stringify(getCurrentMessages()));
    }
};

// Initialize message history
initializeMessageHistory();