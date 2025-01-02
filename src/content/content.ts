// import deleteTextInputElement from '../utils/deleteTextInputElement';
// import nlToSqlRequest from '../functions/nlToSqlRequest';
// import getMetabaseVersion from '../functions/getMetabaseVersion';
// import getQueryEditorTextarea from '../page_elements/getQueryEditorTextarea';
// import { ConfigDict } from '../types/chromeStorage';

// // Import styles
// import './styles/index.css';

// ////////////// Global Variables //////////////

// let configDict: ConfigDict = {};
// let storeQueryContent: string | undefined = undefined;
// let isContentScriptLoaded: boolean = false;
// let version: [number, number] = [50, 13];
// let previousQueryContents: string[] = [];
// let isOperationRunning: boolean = false;
// let messageHistory: { content: string; type: 'user' | 'assistant'; timestamp: string }[] = [];

// ////////////// UI Components //////////////

// const showThinkingIndicator = () => {
//   const existingIndicator = document.querySelector('.thinking-indicator');
//   if (existingIndicator) return;

//   const indicator = document.createElement('div');
//   indicator.className = 'thinking-indicator';
//   indicator.innerHTML = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <circle cx="12" cy="12" r="10"/>
//       <path d="M12 6v6l4 2"/>
//     </svg>
//     <span>Assistant is thinking...</span>
//   `;
  
//   const messagesContainer = document.querySelector('.messages-container');
//   if (messagesContainer) {
//     messagesContainer.appendChild(indicator);
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
//   }
// };

// const hideThinkingIndicator = () => {
//   const indicator = document.querySelector('.thinking-indicator');
//   if (indicator) {
//     indicator.remove();
//   }
// };

// ////////////// Message Handling //////////////

// const addMessageToChat = (content: string, type: 'user' | 'assistant') => {
//   const messageWrapper = document.createElement('div');
//   messageWrapper.className = `message ${type}-message`;
  
//   // Create message header
//   const messageHeader = document.createElement('div');
//   messageHeader.className = 'message-header';
  
//   // Add name
//   const name = document.createElement('span');
//   name.className = 'message-name';
//   name.textContent = type === 'user' ? 'You' : 'Assistant';
  
//   // Add timestamp
//   const timestamp = document.createElement('span');
//   timestamp.className = 'message-timestamp';
//   timestamp.textContent = new Date().toLocaleTimeString([], { 
//     hour: '2-digit', 
//     minute: '2-digit'
//   });
  
//   messageHeader.appendChild(name);
//   messageHeader.appendChild(timestamp);
  
//   // Add message content
//   const messageContent = document.createElement('div');
//   messageContent.className = 'message-content';
//   messageContent.textContent = content;
  
//   messageWrapper.appendChild(messageHeader);
//   messageWrapper.appendChild(messageContent);
  
//   const messagesContainer = document.querySelector('.messages-container');
//   if (messagesContainer) {
//     messagesContainer.appendChild(messageWrapper);
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
//   }
// };

// const loadMessageHistory = (messagesContainer: HTMLElement) => {
//   messageHistory.forEach(({ content, type, timestamp }) => {
//     const messageWrapper = document.createElement('div');
//     messageWrapper.className = `message ${type}-message`;
    
//     const messageHeader = document.createElement('div');
//     messageHeader.className = 'message-header';
    
//     const name = document.createElement('span');
//     name.className = 'message-name';
//     name.textContent = type === 'user' ? 'You' : 'Assistant';
    
//     const timestampEl = document.createElement('span');
//     timestampEl.className = 'message-timestamp';
//     timestampEl.textContent = timestamp;
    
//     messageHeader.appendChild(name);
//     messageHeader.appendChild(timestampEl);
    
//     const messageContent = document.createElement('div');
//     messageContent.className = 'message-content';
//     messageContent.textContent = content;
    
//     messageWrapper.appendChild(messageHeader);
//     messageWrapper.appendChild(messageContent);
//     messagesContainer.appendChild(messageWrapper);
//   });

//   if (messageHistory.length > 0) {
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
//   }
// };

// ////////////// Database Handling //////////////

// const checkDatabaseSelected = (): boolean => {
//   const databaseSection = document.querySelector('.GuiBuilder-section.GuiBuilder-data');
//   if (!databaseSection) return false;

//   const linkEl = databaseSection.querySelector('a');
//   if (!linkEl) return false;

//   const outerSpan = linkEl.querySelector('span');
//   if (!outerSpan) return false;

//   const textSpan = outerSpan.querySelector('span');
//   if (!textSpan) return false;

//   return textSpan.textContent !== 'Select a database';
// };

// const showDatabaseWarning = () => {
//   const messagesContainer = document.querySelector('.messages-container');
//   const existingWarning = document.querySelector('.warning-message');

//   if (!existingWarning && messagesContainer) {
//     const warning = document.createElement('div');
//     warning.className = 'warning-message';
//     warning.innerHTML = `
//       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//         <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
//         <line x1="12" y1="9" x2="12" y2="13"></line>
//         <line x1="12" y1="17" x2="12.01" y2="17"></line>
//       </svg>
//       Please select a database to start querying
//     `;
//     messagesContainer.insertBefore(warning, messagesContainer.firstChild);
//   }
// };

// const hideDatabaseWarning = () => {
//   const existingWarning = document.querySelector('.warning-message');
//   if (existingWarning) {
//     existingWarning.remove();
//   }
// };

// const setupDatabaseObserver = () => {
//   let observer: MutationObserver | null = null;

//   const startObserver = () => {
//     const initialCheck = checkDatabaseSelected();
//     if (!initialCheck) {
//       showDatabaseWarning();
//     }

//     observer = new MutationObserver(() => {
//       const isDatabaseSelected = checkDatabaseSelected();
//       if (isDatabaseSelected) {
//         hideDatabaseWarning();
//       } else {
//         showDatabaseWarning();
//       }
//     });

//     const databaseSection = document.querySelector('.GuiBuilder-section.GuiBuilder-data');
//     if (databaseSection) {
//       observer.observe(databaseSection, {
//         subtree: true,
//         childList: true,
//         characterData: true,
//         characterDataOldValue: true
//       });
//     }
//   };

//   const checkAndStartObserver = () => {
//     const databaseSection = document.querySelector('.GuiBuilder-section.GuiBuilder-data');
//     if (databaseSection) {
//       startObserver();
//     } else {
//       setTimeout(checkAndStartObserver, 500);
//     }
//   };

//   checkAndStartObserver();

//   return () => {
//     if (observer) {
//       observer.disconnect();
//     }
//   };
// };

// ////////////// Message Handling //////////////

// const handleMessage = async (message: string, sidebar: HTMLElement) => {
//   if (isOperationRunning) return;

//   if (!checkDatabaseSelected()) {
//     showDatabaseWarning();
//     return;
//   }

//   isOperationRunning = true;
//   showThinkingIndicator();

//   addMessageToChat(message, 'user');
//   pushPreviousQueryContent();

//   await nlToSqlRequest(
//     configDict,
//     message,
//     (content: string, done: boolean) => {
//       if (content) {
//         addMessageToChat(content, 'assistant');
//       }
//       if (done) {
//         isOperationRunning = false;
//         hideThinkingIndicator();
//         sidebar.classList.remove('open');
//       }
//     },
//     (errorMessage: string) => {
//       isOperationRunning = false;
//       hideThinkingIndicator();
//     }
//   );
// };

// ////////////// Sidebar Creation //////////////

// const createSidebar = () => {
//   const sidebar = document.createElement('div');
//   sidebar.id = 'sql-assistant-sidebar';
//   sidebar.className = 'sql-assistant-sidebar';

//   const handle = document.createElement('div');
//   handle.className = 'sidebar-handle';
//   handle.innerHTML = '<span class="handle-icon">◀</span>';

//   const chatContainer = document.createElement('div');
//   chatContainer.className = 'chat-container';

//   const messagesContainer = document.createElement('div');
//   messagesContainer.className = 'messages-container';
//   loadMessageHistory(messagesContainer);

//   const controlsContainer = document.createElement('div');
//   controlsContainer.className = 'controls-container';

//   const resetButton = document.createElement('button');
//   resetButton.className = 'control-button';
//   resetButton.innerHTML = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
//     </svg>
//     <span>Reset</span>
//   `;

//   const revertButton = document.createElement('button');
//   revertButton.className = 'control-button';
//   revertButton.innerHTML = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <path d="M2.5 2v6h6M21.5 22v-6h-6M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.3"/>
//     </svg>
//     <span>Revert</span>
//   `;

//   controlsContainer.appendChild(resetButton);
//   controlsContainer.appendChild(revertButton);

//   const inputContainer = document.createElement('div');
//   inputContainer.className = 'input-container';

//   const input = document.createElement('textarea');
//   input.className = 'chat-input';
//   input.placeholder = 'Type your query here...';

//   const sendButton = document.createElement('button');
//   sendButton.className = 'send-button';
//   sendButton.innerHTML = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <line x1="22" y1="2" x2="11" y2="13"></line>
//       <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
//     </svg>
//   `;

//   inputContainer.appendChild(input);
//   inputContainer.appendChild(sendButton);

//   chatContainer.appendChild(controlsContainer);
//   chatContainer.appendChild(messagesContainer);
//   chatContainer.appendChild(inputContainer);

//   sidebar.appendChild(chatContainer);
//   sidebar.appendChild(handle);

//   // Event Handlers
//   handle.addEventListener('click', () => {
//     sidebar.classList.toggle('open');
//   });

//   sendButton.addEventListener('click', () => {
//     const message = input.value.trim();
//     if (message) {
//       handleMessage(message, sidebar);
//       input.value = '';
//     }
//   });

//   input.addEventListener('keydown', (event: KeyboardEvent) => {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault();
//       sendButton.click();
//     }
//   });

//   resetButton.addEventListener('click', () => {
//     messageHistory = [];
//     messagesContainer.innerHTML = '';
//     input.value = '';
//   });

//   revertButton.addEventListener('click', () => {
//     if (messageHistory.length >= 2) {
//       messageHistory.splice(-2);
//       const messages = messagesContainer.querySelectorAll('.message');
//       if (messages.length >= 2) {
//         messages[messages.length - 1].remove();
//         messages[messages.length - 2].remove();
//       }
//     }
//   });

//   document.body.appendChild(sidebar);
//   return sidebar;
// };

// ////////////// Query History //////////////

// function pushPreviousQueryContent(): void {
//   const queryEditorTextarea = getQueryEditorTextarea(version);
//   previousQueryContents.push(storeQueryContent);
//   deleteTextInputElement(queryEditorTextarea, storeQueryContent);
// }

// ////////////// Initialization //////////////

// function setupElements() {
//   const existingSidebar = document.getElementById('sql-assistant-sidebar');
//   if (existingSidebar) {
//     existingSidebar.remove();
//   }

//   createSidebar();
  
//   const cleanup = setupDatabaseObserver();
  
//   const documentObserver = new MutationObserver((mutations) => {
//     if (document.querySelector('.GuiBuilder-section.GuiBuilder-data')) {
//       cleanup();
//       setupDatabaseObserver();
//       documentObserver.disconnect();
//     }
//   });

//   documentObserver.observe(document.body, {
//     childList: true,
//     subtree: true
//   });
// }

// function main() {
//   if (isContentScriptLoaded) {
//     return;
//   }
//   isContentScriptLoaded = true;

//   getMetabaseVersion()
//     .then(response => {
//       version = response;
//     })
//     .catch(error => {
//       console.error('Error getting Metabase version:', error);
//       version = [50, 13];
//     })
//     .finally(() => {
//       setupElements();
//       console.log('SQL Assistant initialized successfully');
//     });
// }

// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', main);
// } else {
//   main();
// }
