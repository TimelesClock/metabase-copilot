import { Dialog, TabConfig } from './Dialog';
import { GeneralSettings } from './tabs/GeneralSettings';
import { AdminSettings } from './tabs/AdminSettings';

export const createSettingsModal = () => {
  const tabs: TabConfig[] = [
    {
      id: 'general',
      label: 'General Settings',
      content: GeneralSettings.getContent()
    },
    {
      id: 'admin',
      label: 'Admin Settings',
      content: AdminSettings.getContent()
    }
  ];

  const dialog = new Dialog('', tabs);

  // Set up content change handler to reinstall event handlers when tab content changes
  dialog.setContentChangeHandler(() => {
    // Setup handlers for current tab
    GeneralSettings.setupHandlers(dialog);
    AdminSettings.setupHandlers(dialog);

    // Load settings for both tabs
    GeneralSettings.loadSettings();
    AdminSettings.loadSettings();
  });

  // Show dialog and initialize
  dialog.show();

  return dialog;
};