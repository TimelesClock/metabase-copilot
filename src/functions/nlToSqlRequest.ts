import { clearAndPasteContent, clickRunButton } from '../utils/textareaUtils';
import { ConfigDict } from '../types/chromeStorage';
import { loadMetabaseQuestion, MetabaseQuestion } from '../content/utils/loadMetabaseQuestion';
import { DashboardToolCall, Message, QueryType, RawLLMContent } from '../content/types/types';
import { getDashboardService } from '../content/services/DashboardService';
import { addMessageToChat, setMessageLoading, updateMessageWithToolCall } from '../content/components/MessageHandler';
import { state } from '../content/state/state';


async function nlToSqlRequest(
  configDict: ConfigDict,
  question: string,
  database_name: string,
  contentCallback: (done: boolean, metabaseQuestion: MetabaseQuestion | null, rawLLMResponse?: RawLLMContent[], content?: string) => void,
  errorCallback: (errorMessage: string) => void,
  messageHistory: Array<Message> = [],
  queryType: QueryType = 'chart'
) {
  try {
    const { apiUrl, apiKey } = await chrome.storage.local.get(['apiUrl', 'apiKey']);

    if (!apiUrl || !apiKey) {
      errorCallback('API configuration is missing. Please check settings.');
      return;
    }

    let formattedHistory = messageHistory.slice(0, -1);


    const makeRequest = async (question: string, history: Array<Message>) => {
      const response = await fetch(`${apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify({
          question,
          database_name: database_name,
          message_history: history,
          type: queryType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'An error occurred');
      }

      return response.json();
    };

    let data = await makeRequest(question, formattedHistory);
    let currentMessageElement: HTMLElement | null = null;

    while (true) {
      try {
        const parsedResponse = typeof data === 'string' ? JSON.parse(data) : data;

        // Show initial explanation
        if (parsedResponse.explanation) {
          currentMessageElement = addMessageToChat(
            parsedResponse.explanation,
            'assistant',
            null,
            parsedResponse.raw_llm_response
          );

          if (parsedResponse.tool_calls?.length > 0) {
            setMessageLoading(currentMessageElement, true);
          }
        }

        if (parsedResponse.tool_calls?.length > 0 && currentMessageElement) {
          // Process tool calls sequentially
          for (const call of parsedResponse.tool_calls) {
            try {
              const result = await executeDashboardToolCall(call);
              // If call has explanation, update main-content which is nested in message-content inside currentMessageElement
              if (call.params.explanation) {
                const mainContent = currentMessageElement.querySelector('.message-content .main-content');
                if (mainContent) {
                  mainContent.innerHTML = call.params.explanation;
                }
              }
              updateMessageWithToolCall(currentMessageElement, call, {
                type: call.type,
                status: 'success',
                result
              });

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
              console.error(`Failed to execute tool call ${call.type}:`, error);

              updateMessageWithToolCall(currentMessageElement, call, {
                type: call.type,
                status: 'error',
                error: errorMessage
              });
            }
          }

          setMessageLoading(currentMessageElement, false);

          //find followup requests in parsedResponse.tool_calls
          const followUpRequests = parsedResponse.tool_calls.filter(call => call.params.requires_followup);
          if (followUpRequests.length > 0) {
            data = await makeRequest(
              "Follow up request",
              state.messageHistory.dashboard
            );
            continue;
          }


          // Handle errors if needed
          const toolCalls = currentMessageElement.querySelectorAll('.tool-call-details');
          const hasErrors = Array.from(toolCalls).some(call =>
            call.querySelector('.status.error')
          );

          if (hasErrors) {
            data = await makeRequest(
              "Some operations failed. Please suggest alternatives or continue with the remaining tasks.",
              formattedHistory
            );
            continue;
          }
        }

        contentCallback(true, null, parsedResponse.raw_llm_response);
        break;

      } catch (error) {
        console.error('Error processing response:', error);
        throw error;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    errorCallback(errorMessage);
    addMessageToChat(`Error: ${errorMessage}`, 'assistant');
  }
}



async function executeDashboardToolCall(call: DashboardToolCall) {
  const service = getDashboardService();

  switch (call.type) {
    case "preview_chart": {
      await clearAndPasteContent(call.params.sql);
      await clickRunButton();
      await new Promise(resolve => setTimeout(resolve, 100));

      const previewQuestion: MetabaseQuestion = {
        name: call.params.name,
        description: call.params.description,
        display: call.params.display_type,
        dataset_query: {
          type: "native",
          native: { query: call.params.sql },
          database: 270009
        },
        visualization_settings: call.params.viz_settings,
        parameters: [],
        result_metadata: []
      };

      await loadMetabaseQuestion(previewQuestion);
      return { status: 'success', question: previewQuestion };
    }

    case "list_charts":
      return await service.getCollectionItems();

    case "create_chart":
      const chart: MetabaseQuestion = {
        name: call.params.name,
        description: call.params.description,
        display: call.params.display_type,
        dataset_query: {
          type: "native",
          native: { query: call.params.sql },
          database: 270009
        },
        visualization_settings: call.params.viz_settings,
        parameters: [],
        result_metadata: []
      };
      return await service.addCardToDashboard(
        chart,
        call.params.size_x,
        call.params.size_y,
        call.params.row,
        call.params.col
      );

    case "rearrange_dashboard":
      return await service.updateDashboardLayout(call.params.layout);

    case "update_chart":
      const updatedChart: MetabaseQuestion = {
        name: call.params.name,
        description: call.params.description,
        display: call.params.display_type,
        dataset_query: {
          type: "native",
          native: { query: call.params.sql },
          database: 270009
        },
        visualization_settings: call.params.viz_settings,
        parameters: [],
        result_metadata: []
      };
      return await service.updateCard(
        call.params.card_id,
        updatedChart
      );

    case "delete_chart":
      return await service.deleteChart(call.params.chart_id);

    case "load_chart":
      // return await service.loadChart(call.params.chart_id);
      throw new Error("Load chart not implemented yet");

    case "add_markdown":
      return await service.createTextCard(
        call.params.text,
        call.params.size_x,
        call.params.size_y,
        call.params.row,
        call.params.col
      );

    case "get_dashboard_cards":
      return await service.getDashboardCards();
    default:
      throw new Error(`Unknown tool call type: ${call.type}`);
  }
}

export default nlToSqlRequest;