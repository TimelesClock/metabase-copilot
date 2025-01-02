export interface KeyItem {
    name: string;
    key: string;
    created_at: string;
    last_used: string;
    is_active: number;
}

export class AdminSettings {
    static getContent(): string {
        return `
        <div class="settings-content">
          <div class="settings-header">
            <h3>Admin Settings</h3>
            <button class="close-button" aria-label="Close settings">×</button>
          </div>
          
          <div class="settings-section">
            <h4>API Key Management</h4>
            <div class="input-group">
              <label for="admin-key">Admin Key</label>
              <input type="text" name="admin-key" id="admin-key" class="key" placeholder="Enter admin key" autocomplete="off"/>
            </div>

            <div class="keys-section">
              <div class="keys-header">
                <h4>API Keys</h4>
                <div class="input-group keys-actions">
                  <input type="text" name="new-key-name" id="newKeyName" placeholder="New key name" autocomplete="off" class="new-key-input"/>
                  <button id="createKey" class="admin-button create-button" title="Create new key">+</button>
                  <button id="listKeys" class="admin-button refresh-button" title="Refresh list">↻</button>
                </div>
              </div>
              
              <div class="keys-table-container">
                <table class="keys-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="keysList">
                    <!-- Keys will be inserted here -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    private static formatDate(dateStr: string | null): string {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('default', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    }

    private static generateKeyItem(key: KeyItem): string {
        const statusClass = key.is_active ? 'status-active' : 'status-inactive';
        const statusText = key.is_active ? 'Active' : 'Inactive';

        return `
          <tr class="key-row">
            <td class="key-name">
                <div class="key-name-text" title="${key.name}">${key.name}</div>
            </td>
            <td class="key-preview">
                <code title="${key.key}">${key.key.slice(0, 8)}...</code>
            </td>
            <td class="key-date" title="${key.created_at}">
                ${this.formatDate(key.created_at)}
            </td>
            <td class="key-date" title="${key.last_used || ''}">
                ${this.formatDate(key.last_used)}
            </td>
            <td class="key-status">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td class="key-actions">
                <button class="admin-button delete-key" data-key="${key.key}" title="Delete key">-</button>
            </td>
          </tr>
        `;
    }

    private static generateEmptyState(): string {
        return `
          <tr>
            <td colspan="6" class="empty-state">
              <div class="empty-state-content">
                No API keys found
              </div>
            </td>
          </tr>
        `;
    }

    private static async getApiUrl(): Promise<string> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['apiUrl'], (result) => {
                resolve(result.apiUrl || '');
            });
        });
    }

    static async setupHandlers(dialog: any) {
        const closeButton = document.querySelector('.close-button');
        const listKeysButton = document.querySelector('#listKeys') as HTMLButtonElement;
        const createKeyButton = document.querySelector('#createKey') as HTMLButtonElement;
        const keysList = document.querySelector('#keysList') as HTMLElement;
        const newKeyInput = document.querySelector('#newKeyName') as HTMLInputElement;

        closeButton?.addEventListener('click', () => dialog.close());

        const setLoading = (element: HTMLElement, isLoading: boolean) => {
            element.classList.toggle('loading', isLoading);
        };

        listKeysButton?.addEventListener('click', async () => {
            const adminKey = (document.querySelector('#admin-key') as HTMLInputElement)?.value;
            const apiUrl = await this.getApiUrl();

            if (!adminKey || !apiUrl) {
                alert('Please enter both API URL and Admin Key');
                return;
            }

            setLoading(listKeysButton, true);

            try {
                const response = await fetch(`${apiUrl}/api-keys`, {
                    headers: {
                        'X-Admin-Key': adminKey
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const keys = await response.json() as KeyItem[];

                if (keysList) {
                    keysList.innerHTML = keys.length ?
                        keys.map(key => this.generateKeyItem(key)).join('') :
                        this.generateEmptyState();
                }
            } catch (error) {
                console.error('Failed to list keys:', error);
                alert('Failed to fetch API keys. Please check your credentials and try again.');
            } finally {
                setLoading(listKeysButton, false);
            }
        });

        createKeyButton?.addEventListener('click', async () => {
            const adminKey = (document.querySelector('#admin-key') as HTMLInputElement)?.value;
            const apiUrl = await this.getApiUrl();
            const newKeyName = newKeyInput?.value;

            if (!adminKey || !apiUrl || !newKeyName) {
                alert('Please fill in all required fields');
                return;
            }

            setLoading(createKeyButton, true);

            try {
                const response = await fetch(`${apiUrl}/api-keys/${newKeyName}`, {
                    method: 'POST',
                    headers: {
                        'X-Admin-Key': adminKey
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                alert(`Created new key: ${result.api_key}`);

                // Refresh the keys list
                await listKeysButton.click();

                // Clear the input
                newKeyInput.value = '';
            } catch (error) {
                console.error('Failed to create key:', error);
                alert('Failed to create new API key. Please try again.');
            } finally {
                setLoading(createKeyButton, false);
            }
        });

        // Handle Enter key in new key input
        newKeyInput?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                createKeyButton.click();
            }
        });

        // Event delegation for delete buttons
        keysList?.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('delete-key')) {
                const apiKey = target.dataset.key;
                const adminKey = (document.querySelector('#admin-key') as HTMLInputElement)?.value;
                const apiUrl = await this.getApiUrl();

                if (!adminKey || !apiUrl || !apiKey) {
                    alert('Missing required information for deletion');
                    return;
                }

                if (!confirm('Are you sure you want to delete this API key?')) {
                    return;
                }

                setLoading(target, true);

                try {
                    const response = await fetch(`${apiUrl}/api-keys/${apiKey}`, {
                        method: 'DELETE',
                        headers: {
                            'X-Admin-Key': adminKey
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    // Refresh the keys list
                    await listKeysButton.click();
                } catch (error) {
                    console.error('Failed to delete key:', error);
                    alert('Failed to delete API key. Please try again.');
                    setLoading(target, false);
                }
            }
        });

        // Auto-load keys if admin key exists
        const adminKeyInput = document.querySelector('#admin-key') as HTMLInputElement;
        if (adminKeyInput?.value) {
            listKeysButton.click();
        }
    }

    static loadSettings() {
        chrome.storage.local.get(['adminKey'], (result) => {
            const adminKeyInput = document.querySelector('#admin-key') as HTMLInputElement;
            if (adminKeyInput) adminKeyInput.value = result.adminKey || '';
        });
    }
}