import { clearAndPasteContent, clickRunButton } from '../utils/textareaUtils';
import { ConfigDict } from '../types/chromeStorage';
import { loadMetabaseQuestion, MetabaseQuestion } from '../content/utils/loadMetabaseQuestion';
import { Message, RawLLMContent } from '../content/types/types';

async function nlToSqlRequest(
  configDict: ConfigDict,
  question: string,
  database_name: string,
  contentCallback: (content: string, done: boolean, metabaseQuestion: MetabaseQuestion, rawLLMResponse?: RawLLMContent[]) => void,
  errorCallback: (errorMessage: string) => void,
  messageHistory: Array<Message> = []
) {
  try {
    // Get stored API configuration
    const { apiUrl, apiKey } = await chrome.storage.local.get(['apiUrl', 'apiKey']);

    if (!apiUrl || !apiKey) {
      errorCallback('API configuration is missing. Please check settings.');
      return;
    }

    // Remove the last message from the history
    let formattedHistory = messageHistory.slice(0, -1);

    const response = await fetch(`${apiUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        question,
        database_name: database_name,
        message_history: {
          messages: formattedHistory
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error || 'An error occurred';
      errorCallback(errorMessage);
      return;
    }

    const data = await response.json();

    // First, format and send the response through contentCallback
    const formattedResponse = [
      data.explanation && `${data.explanation}\n`,
    ].filter(Boolean).join('\n');

    if (formattedResponse) {
      contentCallback(formattedResponse, true, data.metabase_question, data.raw_llm_response);
    }

    // Then handle SQL and Metabase updates
    if (data.sql) {
      try {
        const pasted = await clearAndPasteContent(data.sql);
        if (pasted) {
          await clickRunButton();
          // Add a small delay to ensure content is processed
          await new Promise(resolve => setTimeout(resolve, 100));
          // Finally, update Metabase question which might refresh the page
          if (data.metabase_question) {
            await loadMetabaseQuestion(data.metabase_question);
          }
        }
      } catch (error) {
        console.error('Error updating Metabase:', error);
        // Don't call errorCallback here as we've already shown the response
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing the response';
    errorCallback(errorMessage);
  }
}

export default nlToSqlRequest;