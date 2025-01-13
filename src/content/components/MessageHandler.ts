import { state, getCurrentMessages, addMessage, updateMessageToolCalls } from '../state/state';
import { MetabaseQuestion } from '../../content/utils/loadMetabaseQuestion';
import { RawLLMContent, Message, DashboardToolCall } from '../types/types';
import { checkDatabaseSelected, showDatabaseWarning } from './DatabaseHandler';
import { hideThinkingIndicator, showThinkingIndicator } from './ThinkingIndicator';
import { pushPreviousQueryContent } from '../utils/queryHistory';
import nlToSqlRequest from '../../functions/nlToSqlRequest';
import { getDashboardService } from '../services/DashboardService';

interface ToolCallResult {
  type: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
}

interface ParsedToolCall {
  type: string;
  status: string;
  result: any;
  params?: string; // Store params as string to parse later
  logs: string[];
  timestamp: string;
}

const parseToolCalls = (toolCallsXml: string): ParsedToolCall[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(toolCallsXml, 'text/xml');
  const toolCalls = xmlDoc.querySelectorAll('tool_call');

  return Array.from(toolCalls).map(call => ({
    type: call.getAttribute('type') || '',
    status: call.getAttribute('status') || '',
    timestamp: call.getAttribute('timestamp') || new Date().toISOString(),
    logs: JSON.parse(call.querySelector('logs')?.textContent || '[]'),
    params: call.querySelector('params')?.textContent || '{}',
    result: JSON.parse(call.querySelector('result')?.textContent || '{}')
  }));
};

export const createExpandableSection = (
  title: string,
  content: string,
  logs: string[] = [],
  timestamp: string,
  initiallyExpanded: boolean = false
): HTMLElement => {
  const section = document.createElement('div');
  section.className = 'expandable-section';

  const header = document.createElement('div');
  header.className = 'expandable-header';

  const leftSide = document.createElement('div');
  leftSide.className = 'expandable-header-left';

  const icon = document.createElement('span');
  icon.className = `expandable-icon ${initiallyExpanded ? 'expanded' : ''}`;
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'expandable-title';
  titleSpan.textContent = title;

  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'expandable-timestamp';
  timestampSpan.textContent = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  leftSide.appendChild(icon);
  leftSide.appendChild(titleSpan);

  header.appendChild(leftSide);
  header.appendChild(timestampSpan);

  const contentDiv = document.createElement('div');
  contentDiv.className = `expandable-content ${initiallyExpanded ? 'expanded' : ''}`;

  if (logs.length > 0) {
    const logsDiv = document.createElement('div');
    logsDiv.className = 'expandable-logs';
    logsDiv.innerHTML = logs.join('<br>');
    contentDiv.appendChild(logsDiv);
  }

  const mainContent = document.createElement('div');
  mainContent.className = 'expandable-main-content';
  mainContent.innerHTML = content;
  contentDiv.appendChild(mainContent);

  section.appendChild(header);
  section.appendChild(contentDiv);

  header.addEventListener('click', () => {
    const isExpanded = contentDiv.classList.contains('expanded');
    contentDiv.classList.toggle('expanded');
    icon.classList.toggle('expanded');
  });

  return section;
};

export const addMessageToChat = (
  content: string,
  role: 'user' | 'assistant',
  metabaseQuestion?: MetabaseQuestion | null,
  rawLLMResponse?: RawLLMContent[]
): HTMLElement => {
  const currentTimestamp = new Date().toISOString();

  const messageWrapper = document.createElement('div');
  messageWrapper.className = `message ${role}-message`;
  messageWrapper.setAttribute('data-timestamp', currentTimestamp);  // Add timestamp attribute

  const messageHeader = document.createElement('div');
  messageHeader.className = 'message-header';

  const name = document.createElement('span');
  name.className = 'message-name';
  name.textContent = role === 'user' ? 'You' : 'Assistant';

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

  // Main content section
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  mainContent.textContent = content;
  messageContent.appendChild(mainContent);

  // Tool calls container
  const toolCallsContainer = document.createElement('div');
  toolCallsContainer.className = 'tool-calls-container';
  messageContent.appendChild(toolCallsContainer);

  messageWrapper.appendChild(messageHeader);
  messageWrapper.appendChild(messageContent);

  const messagesContainer = document.querySelector('.messages-container');
  if (messagesContainer) {
    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  const message: Message = {
    content,
    role,
    timestamp: currentTimestamp,  // Use same timestamp
    raw_llm_response: rawLLMResponse,
    metabase_question: metabaseQuestion,
    tool_calls: '<tool_calls></tool_calls>'
  };

  addMessage(message);

  return messageWrapper;
};

export const updateMessageWithToolCall = (
  messageElement: HTMLElement,
  toolCall: DashboardToolCall,
  result: ToolCallResult
) => {
  const toolCallsContainer = messageElement.querySelector('.tool-calls-container');
  if (!toolCallsContainer) return;

  const timestamp = messageElement.getAttribute('data-timestamp');
  if (!timestamp) return;

  // Create section with tool call details
  const toolCallSection = createExpandableSection(
    `${toolCall.type.replace(/_/g, ' ')}`,
    `
      <div class="tool-call-details">
        <div class="status ${result.status}">
          ${result.status === 'success' ? '✓' : '❌'} ${result.status.toUpperCase()}
        </div>
        <pre><code>${JSON.stringify({ params: toolCall.params, ...result }, null, 2)}</code></pre>
      </div>
    `,
    [`⏳ Executing ${toolCall.type.replace(/_/g, ' ')}...`],
    new Date().toISOString(),
    false
  );

  toolCallsContainer.appendChild(toolCallSection);

  // Store minimal information in tool calls XML
  const messages = getCurrentMessages();
  const messageIndex = messages.findIndex(m => m.timestamp === timestamp);

  if (messageIndex >= 0) {
    const currentMessage = messages[messageIndex];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      currentMessage.tool_calls || '<tool_calls></tool_calls>',
      'text/xml'
    );

    const toolCallsElement = xmlDoc.querySelector('tool_calls');
    if (toolCallsElement) {
      const toolCallElement = xmlDoc.createElement('tool_call');
      toolCallElement.setAttribute('type', toolCall.type);
      toolCallElement.setAttribute('status', result.status);
      toolCallElement.setAttribute('timestamp', new Date().toISOString());

      // Store params
      if (toolCall.type !== 'preview_chart') {
        const paramsElement = xmlDoc.createElement('params');
        paramsElement.textContent = JSON.stringify(toolCall.params);
        toolCallElement.appendChild(paramsElement);
      }

      // Store minimal result - only status and error if any
      const resultElement = xmlDoc.createElement('result');
      resultElement.textContent = JSON.stringify({
        status: result.status,
        result: result.result,
        ...(result.error && { error: result.error })
      });
      toolCallElement.appendChild(resultElement);

      toolCallsElement.appendChild(toolCallElement);
      updateMessageToolCalls(timestamp, xmlDoc.documentElement.outerHTML);
    }
  }
};

const getToolCallParams = (raw_llm_response?: RawLLMContent[]) => {
  if (!raw_llm_response?.length) return null;

  const toolCall = raw_llm_response.find(r => r.type === 'tool_call');
  if (!toolCall) return null;

  try {
    return JSON.parse(toolCall.text).params;
  } catch (e) {
    console.error('Error parsing tool call params:', e);
    return null;
  }
};

export const loadMessageHistory = (messagesContainer: HTMLElement) => {
  const messages = getCurrentMessages();

  messages.forEach((message) => {
    const { content, role, timestamp, raw_llm_response, metabase_question, tool_calls } = message;
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message ${role}-message`;
    messageWrapper.setAttribute('data-timestamp', timestamp);

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const name = document.createElement('span');
    name.className = 'message-name';
    name.textContent = role === 'user' ? 'You' : 'Assistant';

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

    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content mb-2';
    mainContent.textContent = content;
    messageContent.appendChild(mainContent);

    // Tool calls container
    const toolCallsContainer = document.createElement('div');
    toolCallsContainer.className = 'tool-calls-container';

    // Add tool calls if they exist
    if (tool_calls) {
      const toolCalls = parseToolCalls(tool_calls);
      toolCalls.forEach(toolCall => {
        const params = getToolCallParams(raw_llm_response) || JSON.parse(toolCall.params || '{}');
        const section = createExpandableSection(
          `${toolCall.type.replace(/_/g, ' ')}`,
          `
            <div class="tool-call-details">
              <div class="status ${toolCall.status}">
                ${toolCall.status === 'success' ? '✓' : '❌'} ${toolCall.status.toUpperCase()}
              </div>
              <pre><code>${JSON.stringify({ params, ...toolCall.result }, null, 2)}</code></pre>
            </div>
          `,
          toolCall.logs,
          toolCall.timestamp,
          false
        );
        toolCallsContainer.appendChild(section);
      });
    }

    messageContent.appendChild(toolCallsContainer);
    messageWrapper.appendChild(messageHeader);
    messageWrapper.appendChild(messageContent);

    messagesContainer.appendChild(messageWrapper);
  });

  if (messages.length > 0) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};

export const setMessageLoading = (
  messageElement: HTMLElement,
  loading: boolean = true
) => {
  const contentElement = messageElement.querySelector('.main-content');
  if (!contentElement) return;

  if (loading) {
    messageElement.classList.add('loading');
    const currentContent = contentElement.textContent?.trim() || '';
    contentElement.innerHTML = `
      <div class="flex items-center">
        <span class="loading-spinner mr-2"></span>
        ${currentContent}
      </div>
    `;
  } else {
    messageElement.classList.remove('loading');
    const currentContent = contentElement.textContent?.trim() || '';

    contentElement.textContent = currentContent;
  }
};


export const handleQueryMessage = async (message: string, sidebar: HTMLElement) => {
  if (state.isOperationRunning) return;

  if (!checkDatabaseSelected()) {
    showDatabaseWarning();
    return;
  }

  state.isOperationRunning = true;
  showThinkingIndicator();

  addMessageToChat(message, 'user');
  pushPreviousQueryContent();

  // Get recent messages for context
  const recentMessages = getCurrentMessages().slice(-10);

  await nlToSqlRequest(
    state.configDict,
    message,
    state.databaseName,
    (done: boolean, metabase_question, raw_llm_response, content?: string) => {
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
    recentMessages
  );
};

export const handleDashboardMessage = async (message: string, sidebar: HTMLElement) => {
  if (state.isOperationRunning) return;

  const dashboardService = getDashboardService();
  if (!dashboardService.getCurrentSession()) {
    addMessageToChat("Please start or join a dashboard session first.", "assistant");
    return;
  }

  state.isOperationRunning = true;
  showThinkingIndicator();

  addMessageToChat(message, 'user');

  // Get recent messages for context
  const recentMessages = getCurrentMessages().slice(-10);

  await nlToSqlRequest(
    state.configDict,
    message,
    state.databaseName,
    async (done: boolean, metabase_question, raw_llm_response, content?: string) => {
      if (content) {
        addMessageToChat(content, 'assistant', metabase_question, raw_llm_response);
      }
      if (done) {
        state.isOperationRunning = false;
        hideThinkingIndicator();
      }
    },
    (errorMessage: string) => {
      state.isOperationRunning = false;
      hideThinkingIndicator();
      addMessageToChat(`Error: ${errorMessage}`, "assistant");
    },
    recentMessages,
    'dashboard'
  );
};