import { state } from '../state/state';
import { handleMessage } from './MessageHandler';
import { loadMessageHistory } from './MessageHandler';
import { createSettingsModal } from './SettingsModal';

export const createSidebar = () => {
  const sidebar = document.createElement('div');
  sidebar.id = 'sql-assistant-sidebar';
  sidebar.className = 'sql-assistant-sidebar';

  const handle = document.createElement('div');
  handle.className = 'sidebar-handle';
  handle.innerHTML = '<span class="handle-icon">◀</span>';

  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'messages-container';

  // Load existing message history
  loadMessageHistory(messagesContainer);

  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'controls-container';

  // Create settings button
  const settingsButton = document.createElement('button');
  settingsButton.className = 'control-button';
  settingsButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
    <span>Settings</span>
  `;

  const resetButton = document.createElement('button');
  resetButton.className = 'control-button';
  resetButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
    </svg>
    <span>Reset</span>
  `;

  const revertButton = document.createElement('button');
  revertButton.className = 'control-button';
  revertButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2.5 2v6h6M21.5 22v-6h-6M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.3"/>
    </svg>
    <span>Revert</span>
  `;

  controlsContainer.appendChild(settingsButton);
  controlsContainer.appendChild(resetButton);
  controlsContainer.appendChild(revertButton);

  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';

  const input = document.createElement('textarea');
  input.className = 'chat-input';
  input.placeholder = 'Type your query here...';

  const sendButton = document.createElement('button');
  sendButton.className = 'send-button';
  sendButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  `;

  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);

  chatContainer.appendChild(controlsContainer);
  chatContainer.appendChild(messagesContainer);
  chatContainer.appendChild(inputContainer);

  sidebar.appendChild(chatContainer);
  sidebar.appendChild(handle);

  // Create and append settings modal
  // const settingsModal = createSettingsModal();

  settingsButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createSettingsModal();
  });

  handle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  sendButton.addEventListener('click', () => {
    const message = input.value.trim();
    if (message) {
      handleMessage(message, sidebar);
      input.value = '';
    }
  });

  input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendButton.click();
    }
  });

  resetButton.addEventListener('click', () => {
    state.messageHistory = [];
    localStorage.setItem('messageHistory', JSON.stringify(state.messageHistory)); // Clear local storage
    messagesContainer.innerHTML = '';
    input.value = '';
  });

  revertButton.addEventListener('click', () => {
    if (state.messageHistory.length > 0) {
      const lastMessage = state.messageHistory[state.messageHistory.length - 1];

      if (lastMessage.type === 'assistant') {
        // Remove last two messages (assistant and user) from state
        state.messageHistory.splice(-2);
        localStorage.setItem('messageHistory', JSON.stringify(state.messageHistory));

        // Remove last two messages from UI
        const messages = messagesContainer.querySelectorAll('.message');
        if (messages.length >= 2) {
          messages[messages.length - 1].remove();
          messages[messages.length - 2].remove();
        }
      } else {
        // Remove only the last message (user) from state
        state.messageHistory.pop();
        localStorage.setItem('messageHistory', JSON.stringify(state.messageHistory));

        // Remove last message from UI
        const messages = messagesContainer.querySelectorAll('.message');
        if (messages.length >= 1) {
          messages[messages.length - 1].remove();
        }
      }
    }
  });

  document.body.appendChild(sidebar);
  return sidebar;
};