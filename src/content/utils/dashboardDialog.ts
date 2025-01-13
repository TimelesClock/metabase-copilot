import { Dialog } from '../components/Dialog';

export const showErrorDialog = (message: string): Promise<void> => {
    return new Promise((resolve) => {
        const content = `
      <div class="settings-content">
        <div style="color: var(--error); padding: 16px; margin-bottom: 16px; background: var(--error-light); border-radius: 4px;">
          ${message}
        </div>
        <div class="settings-footer">
          <button class="save-button">OK</button>
        </div>
      </div>
    `;

        const dialog = new Dialog(content);

        // Add click handler after dialog is shown
        dialog.show();

        const okButton = dialog.dialog.querySelector('.save-button');
        okButton?.addEventListener('click', () => {
            dialog.close();
            resolve();
        });
    });
};

export const showConfirmDialog = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const content = `
      <div class="settings-content">
        <div style="margin-bottom: 24px;">
          ${message}
        </div>
        <div class="settings-footer">
          <button class="admin-button" style="margin-right: 8px;">Cancel</button>
          <button class="save-button">Confirm</button>
        </div>
      </div>
    `;

        const dialog = new Dialog(content);
        dialog.show();

        const cancelButton = dialog.dialog.querySelector('.admin-button');
        const confirmButton = dialog.dialog.querySelector('.save-button');

        cancelButton?.addEventListener('click', () => {
            dialog.close();
            resolve(false);
        });

        confirmButton?.addEventListener('click', () => {
            dialog.close();
            resolve(true);
        });
    });
};

export const showPromptDialog = (message: string, defaultValue: string = ''): Promise<string | null> => {
    return new Promise((resolve) => {
        const content = `
      <div class="settings-content">
        <div class="input-group">
          <label>${message}</label>
          <input type="text" value="${defaultValue}" class="prompt-input" />
        </div>
        <div class="settings-footer">
          <button class="admin-button" style="margin-right: 8px;">Cancel</button>
          <button class="save-button">Confirm</button>
        </div>
      </div>
    `;

        const dialog = new Dialog(content);
        dialog.show();

        const input = dialog.dialog.querySelector('.prompt-input') as HTMLInputElement;
        const cancelButton = dialog.dialog.querySelector('.admin-button');
        const confirmButton = dialog.dialog.querySelector('.save-button');

        // Focus input after dialog is shown
        setTimeout(() => input?.focus(), 0);

        input?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                dialog.close();
                resolve(input.value.trim() || null);
            }
        });

        cancelButton?.addEventListener('click', () => {
            dialog.close();
            resolve(null);
        });

        confirmButton?.addEventListener('click', () => {
            dialog.close();
            resolve(input.value.trim() || null);
        });
    });
};