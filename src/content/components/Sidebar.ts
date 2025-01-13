// src/content/components/Sidebar.ts

import { state, clearMessages, loadMessages } from '../state/state';
import { handleQueryMessage, handleDashboardMessage } from './MessageHandler';
import { loadMessageHistory } from './MessageHandler';
import { createSettingsModal } from './SettingsModal';
import { getCurrentMessages } from '../state/state';
import { DashboardInitializer } from './DashboardInitializer';
import { setupDatabaseButton } from './DatabasePicker';

export const createSidebar = () => {
  const sidebar = document.createElement('div');
  sidebar.id = 'sql-assistant-sidebar';
  sidebar.className = 'sql-assistant-sidebar';

  // Set sidebar mode based on current page
  const isDashboardMode = window.location.pathname.includes('/dashboard');
  sidebar.setAttribute('data-mode', isDashboardMode ? 'dashboard' : 'query');

  const handle = document.createElement('div');
  handle.className = 'sidebar-handle';
  handle.innerHTML = '<span class="handle-icon">◀</span>';

  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'messages-container';

  // Load existing message history for current mode
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

  if (isDashboardMode) {
    // Extract dashboard ID from URL
    const pathMatch = window.location.pathname.match(/\/dashboard\/(\d+)-[\w-]+/);
    const dashboardId = pathMatch ? pathMatch[1] : null;

    if (dashboardId) {
      // Check for existing session before showing chat
      DashboardInitializer.checkExistingSession(dashboardId).then(hasSession => {
        if (hasSession) {
          // Existing session found - enable chat
          input.disabled = false;
          sendButton.disabled = false;
          input.placeholder = 'Ask about this dashboard or suggest changes...';
          setupDatabaseButton(chatContainer, messagesContainer)
        } else {
          // Show initializer and disable chat until initialized
          const initializer = DashboardInitializer.createUI();
          chatContainer.insertBefore(initializer, messagesContainer);

          // Disable chat until initialized
          input.disabled = true;
          sendButton.disabled = true;

          DashboardInitializer.setupHandlers(initializer, () => {
            // Enable chat after initialization
            input.disabled = false;
            sendButton.disabled = false;
            setupDatabaseButton(chatContainer, messagesContainer)
          });
        }
      });
    }
  }else{
    input.placeholder = 'Ask a question or provide context...';
  }

  // Load messages for current mode
  loadMessages();

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
      if (isDashboardMode) {
        handleDashboardMessage(message, sidebar);
      } else {
        handleQueryMessage(message, sidebar);
      }
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
    clearMessages(); // This now clears mode-specific messages
    messagesContainer.innerHTML = '';
    input.value = '';
  });

  revertButton.addEventListener('click', () => {
    const messages = getCurrentMessages();
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === 'assistant') {
        // Remove last two messages (assistant and user)
        messages.splice(-2);

        // Remove from UI
        const messageElements = messagesContainer.querySelectorAll('.message');
        if (messageElements.length >= 2) {
          messageElements[messageElements.length - 1].remove();
          messageElements[messageElements.length - 2].remove();
        }
      } else {
        // Remove only the last message (user)
        messages.pop();

        // Remove from UI
        const messageElements = messagesContainer.querySelectorAll('.message');
        if (messageElements.length >= 1) {
          messageElements[messageElements.length - 1].remove();
        }
      }

      // Update storage for current mode
      const storageKey = isDashboardMode ? 'dashboardMessages' : 'queryMessages';
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  });

  document.body.appendChild(sidebar);
  return sidebar;
};

