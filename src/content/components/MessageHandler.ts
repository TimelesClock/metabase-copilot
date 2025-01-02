import { state } from '../state/state';
import { clearAndPasteContent, clickRunButton } from '../../utils/textareaUtils';
import { loadMetabaseQuestion, MetabaseQuestion } from '../../content/utils/loadMetabaseQuestion';
import { RawLLMContent } from '../types/types';
import { checkDatabaseSelected, showDatabaseWarning } from './DatabaseHandler';
import { hideThinkingIndicator, showThinkingIndicator } from './ThinkingIndicator';
import { pushPreviousQueryContent } from '../utils/queryHistory';
import nlToSqlRequest from '../../functions/nlToSqlRequest';

const mapLLMResponseToMetabaseQuestion = (llmData) => {
  return {
    name: llmData.name,
    description: llmData.description,
    display: llmData.display_type,
    displayIsLocked: true,
    visualization_settings: {
      ...llmData.visualization_settings,
      "graph.show_values": true
    }
  };
};

export const addMessageToChat = (content: string, type: 'user' | 'assistant', metabaseQuestion?: MetabaseQuestion, rawLLMResponse?: RawLLMContent[]) => {
  const messageWrapper = document.createElement('div');
  messageWrapper.className = `message ${type}-message`;

  const messageHeader = document.createElement('div');
  messageHeader.className = 'message-header';

  const name = document.createElement('span');
  name.className = 'message-name';
  name.textContent = type === 'user' ? 'You' : 'Assistant';

  const timestamp = document.createElement('span');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  messageHeader.appendChild(name);
  messageHeader.appendChild(timestamp);

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;

  messageWrapper.appendChild(messageHeader);
  messageWrapper.appendChild(messageContent);

  // Add load visualization button if it's an assistant message with viz data
  if (type === 'assistant' && rawLLMResponse) {
    try {
      const rawText = rawLLMResponse[0].text.replace(/```json\n|\n```/g, '').trim();
      const data = JSON.parse(rawText);
      if (data.sql) {
        const loadVizButton = document.createElement('button');
        loadVizButton.className = 'control-button load-viz-button mt-2';
        loadVizButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="16 12 12 8 8 12"/>
            <line x1="12" y1="16" x2="12" y2="8"/>
          </svg>
          <span>Load visualization</span>
        `;

        loadVizButton.addEventListener('click', async () => {
          try {
            const pasted = await clearAndPasteContent(data.sql);
            if (pasted) {
              await clickRunButton();
              // Add a small delay to ensure content is processed
              await new Promise(resolve => setTimeout(resolve, 100));
              // Finally, update Metabase question which might refresh the page
              await loadMetabaseQuestion(metabaseQuestion);

            }
          } catch (error) {
            console.error('Error updating Metabase:', error);
          }
        });

        messageWrapper.appendChild(loadVizButton);
      }
    } catch (e) {
      // If parsing fails, don't add the button
      console.debug('No visualization data in message');
    }
  }

  const messagesContainer = document.querySelector('.messages-container');
  if (messagesContainer) {
    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  state.messageHistory.push({ content, type, timestamp: new Date().toISOString(), raw_llm_response: rawLLMResponse, metabase_question: metabaseQuestion });
  localStorage.setItem('messageHistory', JSON.stringify(state.messageHistory));
};

export const loadMessageHistory = (messagesContainer: HTMLElement) => {
  const storedHistory = JSON.parse(localStorage.getItem('messageHistory') || '[]');
  storedHistory.forEach(({ content, type, timestamp, raw_llm_response, metabase_question }) => {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message ${type}-message`;

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const name = document.createElement('span');
    name.className = 'message-name';
    name.textContent = type === 'user' ? 'You' : 'Assistant';

    const timestampEl = document.createElement('span');
    timestampEl.className = 'message-timestamp';
    timestampEl.textContent = new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageHeader.appendChild(name);
    messageHeader.appendChild(timestampEl);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;

    messageWrapper.appendChild(messageHeader);
    messageWrapper.appendChild(messageContent);

    if (type === 'assistant' && raw_llm_response) {
      try {
        const rawText = raw_llm_response[0].text.replace(/```json\n|\n```/g, '').trim();
        const data = JSON.parse(rawText);
        if (data.sql) {
          const loadVizButton = document.createElement('button');
          loadVizButton.className = 'control-button load-viz-button';
          loadVizButton.style.marginTop = '0.5rem';
          loadVizButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="16 12 12 8 8 12"/>
              <line x1="12" y1="16" x2="12" y2="8"/>
            </svg>
            <span>Load visualization</span>
          `;

          loadVizButton.addEventListener('click', async () => {
            try {
              const pasted = await clearAndPasteContent(data.sql);
              if (pasted) {
                await clickRunButton();
                // Add a small delay to ensure content is processed
                await new Promise(resolve => setTimeout(resolve, 100));
                // Finally, update Metabase question which might refresh the page
                await loadMetabaseQuestion(metabase_question);

              }
            } catch (error) {
              console.error('Error updating Metabase:', error);
            }
          });

          messageWrapper.appendChild(loadVizButton);
        }
      } catch (e) {
        // If parsing fails, don't add the button
        console.debug('No visualization data in message');
      }

    }

    messagesContainer.appendChild(messageWrapper);
  });

  if (storedHistory.length > 0) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};

export const handleMessage = async (message: string, sidebar: HTMLElement) => {
  if (state.isOperationRunning) return;

  if (!checkDatabaseSelected()) {
    showDatabaseWarning();
    return;
  }

  state.isOperationRunning = true;
  showThinkingIndicator();

  addMessageToChat(message, 'user');
  pushPreviousQueryContent();

  // Get the last N messages (e.g., last 10) to provide context
  const recentMessages = state.messageHistory.slice(-10);

  await nlToSqlRequest(
    state.configDict,
    message,
    state.databaseName,
    (content: string, done: boolean, metabase_question, raw_llm_response) => {
      if (content) {
        addMessageToChat(content, 'assistant', metabase_question, raw_llm_response);
      }
      if (done) {
        state.isOperationRunning = false;
        hideThinkingIndicator();
        sidebar.classList.remove('open');
      }
    },
    (errorMessage: string) => {
      state.isOperationRunning = false;
      hideThinkingIndicator();
    },
    recentMessages // Pass the message history
  );
};