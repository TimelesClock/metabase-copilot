// Dialog.ts
export interface TabConfig {
  id: string;
  label: string;
  content: string;
}

export class Dialog {
  private dialog: HTMLElement;
  private overlay: HTMLElement;
  private content: HTMLElement;
  private previousActiveElement: HTMLElement | null = null;
  private activeTabId: string | null = null;
  private tabs: TabConfig[] = [];

  constructor(content: string, tabs?: TabConfig[]) {
    this.tabs = tabs || [];
    if (tabs?.length > 0) {
      this.activeTabId = tabs[0].id;
    }

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay';
    
    // Create dialog wrapper
    this.dialog = document.createElement('div');
    this.dialog.className = 'dialog-container';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    
    // Create content wrapper
    this.content = document.createElement('div');
    this.content.className = 'dialog-content';

    if (this.tabs.length > 0) {
      const tabLayout = this.createTabLayout();
      this.content.appendChild(tabLayout);
    } else {
      this.content.innerHTML = content;
    }
    
    // Assemble the dialog
    this.dialog.appendChild(this.content);
    
    // Add styles only if they don't exist
    if (!document.getElementById('sql-assistant-styles')) {
      const styles = document.createElement('style');
      styles.id = 'sql-assistant-styles';
      styles.textContent = this.getStyles();
      document.head.appendChild(styles);
    }
  }

  private createTabLayout(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dialog-with-tabs';

    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'tab-sidebar';

    // Create tab buttons
    this.tabs.forEach(tab => {
      const button = document.createElement('button');
      button.className = 'tab-button';
      button.textContent = tab.label;
      button.setAttribute('data-tab', tab.id);
      if (tab.id === this.activeTabId) {
        button.classList.add('active');
      }
      button.addEventListener('click', () => this.switchTab(tab.id));
      sidebar.appendChild(button);
    });

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'tab-content';
    
    // Set initial content
    const initialTab = this.tabs.find(t => t.id === this.activeTabId);
    if (initialTab) {
      contentArea.innerHTML = initialTab.content;
    }

    container.appendChild(sidebar);
    container.appendChild(contentArea);

    return container;
  }

  private switchTab(tabId: string) {
    this.activeTabId = tabId;
    
    // Update button states
    const buttons = this.dialog.querySelectorAll('.tab-button');
    buttons.forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
    });

    // Update content
    const contentArea = this.dialog.querySelector('.tab-content');
    if (contentArea) {
      const tab = this.tabs.find(t => t.id === tabId);
      if (tab) {
        contentArea.innerHTML = tab.content;
        // Re-trigger any event handlers for the new content
        if (this.onContentChanged) {
          this.onContentChanged();
        }
      }
    }
  }

  private getStyles(): string {
    return `
      .dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
      }

      .dialog-container {
        position: relative;
        z-index: 1000000;
        max-width: 90vw;
        max-height: 85vh;
      }

      .dialog-content {
        background: var(--background, white);
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: auto;
      }

      .dialog-with-tabs {
        display: flex;
        min-height: 500px;
        max-height: 80vh;
      }

      .tab-sidebar {
        width: 200px;
        border-right: 1px solid var(--border, #e2e8f0);
        background: var(--muted, #f8fafc);
        padding: 16px 0;
        flex-shrink: 0;
      }

      .tab-button {
        width: 100%;
        padding: 12px 16px;
        text-align: left;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--muted-foreground, #64748b);
        transition: all 0.2s;
      }

      .tab-button:hover {
        background: var(--muted, #f1f5f9);
        color: var(--foreground, #1a1a1a);
      }

      .tab-button.active {
        background: var(--background, white);
        color: var(--foreground, #1a1a1a);
        font-weight: 500;
        border-right: 2px solid var(--primary, #0052CC);
      }

      .tab-content {
        flex: 1;
        min-width: 800px;
        overflow-y: auto;
      }

      /* Settings Modal Styles */
      .settings-content {
        padding: 24px;
        min-width: 400px;
        background: var(--background, white);
        color: var(--foreground, #1a1a1a);
        font-family: var(--font-sans, system-ui);
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .settings-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--foreground, #1a1a1a);
      }

      .close-button {
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        color: var(--muted-foreground, #64748b);
      }

      .close-button:hover {
        background: var(--muted, #f1f5f9);
      }

      .settings-section {
        margin-bottom: 24px;
      }

      .settings-section h4 {
        margin: 0 0 16px 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--foreground, #1a1a1a);
      }

      .input-group {
        margin-bottom: 16px;
      }

      .input-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--muted-foreground, #64748b);
      }

      .input-group input {
        width: 100%;
        padding: 8px 12px;
        background: var(--background, white);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 6px;
        font-size: 0.875rem;
        color: var(--foreground, #1a1a1a);
      }

      .input-group input:focus {
        outline: none;
        border-color: var(--primary, #0052CC);
        box-shadow: 0 0 0 1px var(--primary, #0052CC);
      }

      .admin-section {
        border-top: 1px solid var(--border, #e2e8f0);
        padding-top: 24px;
        margin-top: 24px;
      }

      .admin-section summary {
        cursor: pointer;
        font-weight: 500;
        margin-bottom: 16px;
        color: var(--foreground, #1a1a1a);
      }

      .admin-button {
        background: var(--background, white);
        border: 1px solid var(--border, #e2e8f0);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--foreground, #1a1a1a);
      }

      .admin-button:hover {
        background: var(--muted, #f1f5f9);
      }

      .keys-list {
        margin-top: 16px;
      }

      .key-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid var(--border, #e2e8f0);
      }

      .key-item:last-child {
        border-bottom: none;
      }

      .delete-key {
        background: transparent;
        color: var(--muted-foreground, #64748b);
        border: 1px solid var(--border, #e2e8f0);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
      }

      .delete-key:hover {
        background: #fef2f2;
        color: #dc2626;
        border-color: #fecaca;
      }

      .save-button {
        background: var(--primary, #0052CC);
        color: var(--primary-foreground, white);
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .save-button:hover {
        background: var(--primary-hover, #0747A6);
      }

      .settings-footer {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--border, #e2e8f0);
      }
    `;
  }

  // Optional callback for when tab content changes
  private onContentChanged?: () => void;
  setContentChangeHandler(handler: () => void) {
    this.onContentChanged = handler;
  }

  private isMouseDownInDialog = false;

  private handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    this.isMouseDownInDialog = this.dialog.contains(target);
  };

  private handleMouseUp = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === this.overlay && !this.isMouseDownInDialog) {
      this.close();
    }
    this.isMouseDownInDialog = false;
  };

  show() {
    // Store currently focused element
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Append to body
    document.body.appendChild(this.overlay);
    this.overlay.appendChild(this.dialog);

    // Add event listeners
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Trigger content changed handler for initial setup
    if (this.onContentChanged) {
      this.onContentChanged();
    }
  }

  close() {
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    this.overlay.remove();
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }
}