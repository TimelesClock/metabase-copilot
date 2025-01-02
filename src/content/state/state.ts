import { GlobalState } from '../types/types';

export const initialState: GlobalState = {
    configDict: {},
    storeQueryContent: undefined,
    isContentScriptLoaded: false,
    version: [50, 13],
    previousQueryContents: [],
    isOperationRunning: false,
    messageHistory: JSON.parse(localStorage.getItem('messageHistory') || '[]') // Load history from local storage
};

export let state: GlobalState = { ...initialState };

export const resetState = () => {
    state = { ...initialState };
    localStorage.setItem('messageHistory', JSON.stringify(state.messageHistory)); // Update local storage
};
