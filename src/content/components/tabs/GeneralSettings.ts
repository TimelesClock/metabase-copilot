export class GeneralSettings {
    static getContent(): string {
        return `
        <div class="settings-content">
          <div class="settings-header">
            <h3>Settings</h3>
            <button class="close-button" aria-label="Close settings">×</button>
          </div>
          
          <div class="settings-section">
            <h4>API Configuration</h4>
            <div class="input-group">
              <label for="api-url">API URL</label>
              <input type="text" name="api-url" id="api-url" placeholder="http://localhost:8000/api" autocomplete="off"/>
            </div>
            <div class="input-group">
              <label for="api-key">API Key</label>
              <input type="password" name="api-key" id="api-key" placeholder="Enter your API key" autocomplete="off"/>
            </div>
          </div>
  
          <div class="settings-footer">
            <button id="saveSettings" class="save-button">Save Settings</button>
          </div>
        </div>
      `;
    }

    static setupHandlers(dialog: any) {
        const closeButton = document.querySelector('.close-button');
        const saveButton = document.querySelector('#saveSettings');

        closeButton?.addEventListener('click', () => dialog.close());

        saveButton?.addEventListener('click', async () => {
            const apiUrl = (document.querySelector('#api-url') as HTMLInputElement)?.value;
            const apiKey = (document.querySelector('#api-key') as HTMLInputElement)?.value;
            const adminKey = (document.querySelector('#admin-key') as HTMLInputElement)?.value;

            try {
                await chrome.storage.local.set({
                    apiUrl,
                    apiKey,
                    adminKey
                });
                dialog.close();
            } catch (error) {
                console.error('Failed to save settings:', error);
                alert('Failed to save settings. Please try again.');
            }
        });
    }

    static loadSettings() {
        chrome.storage.local.get(['apiUrl', 'apiKey'], (result) => {
            const apiUrlInput = document.querySelector('#api-url') as HTMLInputElement;
            const apiKeyInput = document.querySelector('#api-key') as HTMLInputElement;

            if (apiUrlInput) apiUrlInput.value = result.apiUrl || '';
            if (apiKeyInput) apiKeyInput.value = result.apiKey || '';
        });
    }
}
