// loadMetabaseQuestion.ts
export interface MetabaseQuestion {
    name?: string;
    description?: string;
    display?: string;
    visualization_settings?: Record<string, any>;
}

interface LoaderOptions {
    timeout?: number;
    targetSelector?: string;
}

export async function loadMetabaseQuestion(
    metabaseQuestion: MetabaseQuestion,
    options: LoaderOptions = {}
): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
        // const timeoutMs = options.timeout ?? 10000;
        let timeoutId: NodeJS.Timeout;
        console.log("called")

        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'EXECUTE_IN_PAGE',
            payload: {
                operation: 'UPDATE_QUESTION',
                questionConfig: metabaseQuestion
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                clearTimeout(timeoutId);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            console.log(response)

            if (response.success) {
                resolve({ success: true, message: response.message || 'Question updated successfully' });
            } else {
                reject(new Error(response.error || 'Unknown error occurred'));
            }
        });

        // // Set timeout
        // timeoutId = setTimeout(() => {
        //     reject(new Error('Operation timed out'));
        // }, timeoutMs);
    });
}

// background.ts
