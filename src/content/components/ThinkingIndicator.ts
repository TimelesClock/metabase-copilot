export const showThinkingIndicator = () => {
    const existingIndicator = document.querySelector('.thinking-indicator');
    if (existingIndicator) return;

    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator';
    indicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <span>Assistant is thinking...</span>
    `;

    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
};

export const hideThinkingIndicator = () => {
    const indicator = document.querySelector('.thinking-indicator');
    if (indicator) {
        indicator.remove();
    }
};