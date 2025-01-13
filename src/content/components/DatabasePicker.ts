// src/content/components/DatabasePicker.ts

import { state } from "../state/state";

interface Database {
    id: number;
    name: string;
    description: string | null;
    // ... other fields
}

export class DatabasePicker {
    private container: HTMLElement;
    private onSelect: (database: Database) => void;
    private searchInput: HTMLInputElement;

    static createPopover(databases: Database[], onSelect: (database: Database) => void): HTMLElement {
        const container = document.createElement('span');
        container.className = 'PopoverContainer tether-element tether-abutted tether-abutted-left tether-element-attached-top tether-element-attached-left tether-target-attached-bottom tether-target-attached-left PopoverContainer--open popover tether-enabled';
        container.dataset.state = 'visible';
        container.style.zIndex = '1001';
        const searchSection = `
        <div class="List-section List-section--expanded" style="height: 62px;">
            <div class="bg-white m1 flex align-center" style="border: 1px solid var(--color-border); border-radius: 6px; padding: 8px;">
                <span class="flex align-center px1">
                    <svg class="Icon Icon-search text-light" viewBox="0 0 32 32" width="16" height="16" fill="currentcolor" role="img" aria-label="search icon">
                        <path d="M22.805 25.734c-5.582 4.178-13.543 3.718-18.632-1.37-5.58-5.581-5.595-14.615-.031-20.179 5.563-5.563 14.597-5.55 20.178.031 5.068 5.068 5.545 12.985 1.422 18.563l5.661 5.661a2.08 2.08 0 0 1 .003 2.949 2.085 2.085 0 0 1-2.95-.003l-5.651-5.652zm-1.486-4.371c3.895-3.895 3.885-10.218-.021-14.125-3.906-3.906-10.23-3.916-14.125-.021-3.894 3.894-3.885 10.218.022 14.124 3.906 3.907 10.23 3.916 14.124.022z"></path>
                    </svg>
                </span>
                <input 
                    placeholder="Find..." 
                    type="text" 
                    class="input flex-full bg-white text-dark" 
                    style="
                        border: none;
                        outline: none;
                        font-size: 14px;
                        padding: 4px;
                        width: 100%;
                        background: none;
                    "
                >
            </div>
        </div>
        `;

        // Update the HTML template to use this search section:
        container.innerHTML = `
            <span style="z-index: 3;">
                <div id="DataPopover" class="PopoverBody PopoverBody--withBackground PopoverBody--autoWidth">
                    <div aria-label="grid" aria-readonly="true" class="ReactVirtualized__Grid ReactVirtualized__List text-brand" id="DatabasePicker" role="grid" tabindex="0" style="box-sizing: border-box; direction: ltr; height: 562px; position: relative; width: 300px; will-change: transform; overflow: hidden auto;">
                        <div class="ReactVirtualized__Grid__innerScrollContainer" role="rowgroup">
                            ${searchSection}
                            <div class="database-list-container">
                                <!-- Database items will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
            </span>
        `;

        return container;
    }

    constructor(databases: Database[], onSelect: (database: Database) => void) {
        this.onSelect = onSelect;
        this.container = DatabasePicker.createPopover(databases, onSelect);
        this.searchInput = this.container.querySelector('input')!;

        this.setupEventListeners();
        this.renderDatabases(databases);
    }

    private createDatabaseItem(database: Database): HTMLElement {
        const item = document.createElement('div');
        item.className = 'List-section List-section--expanded';
        item.style.height = '38px';

        item.innerHTML = `
            <div role="option" class="List-item flex mx1">
                <span class="p1 flex-auto flex align-center cursor-pointer hover-bg" data-database-id="${database.id}" style="border-radius: 4px;">
                    <span class="List-item-icon text-dark-hover flex align-center">
                        <svg class="Icon Icon-database Icon" viewBox="0 0 32 32" width="18" height="18" fill="currentcolor" role="img" aria-label="database icon">
                            <path d="M0 9.32V4.054S1.584 0 15.657 0C29.731 0 31.89 3.669 31.89 4.054v5.24s-1.445 4.125-15.424 4.125S0 10.138 0 9.32zm.305 12.93s2.044 3.692 15.727 3.692 15.63-3.72 15.63-3.72.338.099.338.632v5S30.463 32 15.964 32C1.465 32 .041 27.817.041 27.817V22.9c0-.582.264-.65.264-.65zm0-9.368s2.044 3.692 15.727 3.692 15.63-3.72 15.63-3.72.338.099.338.632v5.001s-1.537 4.145-16.036 4.145C1.465 22.632.041 18.45.041 18.45v-4.918c0-.583.264-.65.264-.65z"></path>
                        </svg>
                    </span>
                    <div>
                        <h4 class="List-item-title ml1 text-wrap text-bold">${database.name}</h4>
                    </div>
                </span>
            </div>
        `;
        return item;
    }

    private setupEventListeners() {
        // Handle database selection
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const dbSpan = target.closest('[data-database-id]') as HTMLElement;
            if (dbSpan) {
                const dbId = parseInt(dbSpan.dataset.databaseId!);
                const database = this.databases.find(db => db.id === dbId);
                if (database) {
                    this.onSelect(database);
                    this.hide();
                }
            }
        });

        // Handle search
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            const filteredDatabases = this.databases.filter(db =>
                db.name.toLowerCase().includes(searchTerm)
            );
            this.renderDatabases(filteredDatabases);
        });

        // Handle click outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target as Node)) {
                this.hide();
            }
        });
    }

    private databases: Database[] = [];

    private renderDatabases(databases: Database[]) {
        this.databases = databases;
        const listContainer = this.container.querySelector('.database-list-container')!;
        listContainer.innerHTML = '';

        databases.forEach(database => {
            listContainer.appendChild(this.createDatabaseItem(database));
        });
    }

    show(anchorElement: HTMLElement) {
        document.body.appendChild(this.container);

        // Position the popover below the anchor element
        const rect = anchorElement.getBoundingClientRect();
        this.container.style.position = 'absolute';
        this.container.style.top = '0px';
        this.container.style.left = '0px';

        const offsetX = 16;
        const offsetY = 4;

        this.container.style.transform = `translateX(${rect.left - offsetX}px) translateY(${rect.bottom + offsetY}px) translateZ(0px)`;
    }
    hide() {
        this.container.remove();
    }
}

function createDatabaseButton(selectedDatabase?: Database): HTMLElement {
    const button = document.createElement('a');
    button.className = 'flex align-center no-decoration';
    button.style.cursor = 'pointer';

    const buttonContent = `
        <span class="px2 py2 text-bold text-default flex align-center">
            <span class="text-medium no-decoration">
                ${selectedDatabase ? selectedDatabase.name : 'Select a database'}
            </span>
            <svg class="Icon Icon-chevrondown ml1" viewBox="0 0 32 32" width="8" height="8" fill="currentcolor" role="img" aria-label="chevrondown icon">
                <path d="M1 12 L16 26 L31 12 L27 8 L16 18 L5 8 z"></path>
            </svg>
        </span>
        <span class="hide"></span>
    `;

    button.innerHTML = buttonContent;

    return button;
}

export function setupDatabaseButton(chatContainer: HTMLElement, messagesContainer: HTMLElement) {
    let currentDatabase: Database | undefined;

    // Define click handler separately so we can reuse it
    const handleButtonClick = (button: HTMLElement) => {
        showDatabasePicker(button, (database) => {
            state.databaseName = database.name;
            currentDatabase = database;

            // Replace the button but maintain click functionality
            const updatedButton = createDatabaseButton(database);
            updatedButton.addEventListener('click', () => handleButtonClick(updatedButton));
            button.replaceWith(updatedButton);
        });
    };

    const initialButton = createDatabaseButton();
    initialButton.addEventListener('click', () => handleButtonClick(initialButton));

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mb2';
    buttonContainer.appendChild(initialButton);

    chatContainer.insertBefore(buttonContainer, messagesContainer);
}

// Usage:
export const showDatabasePicker = async (anchorElement: HTMLElement, onSelect: (database: Database) => void) => {
    try {
        const response = await fetch('/api/database', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch databases');
        }

        const data = await response.json();
        const picker = new DatabasePicker(data.data, onSelect);
        picker.show(anchorElement);
    } catch (error) {
        console.error('Error showing database picker:', error);
    }
};