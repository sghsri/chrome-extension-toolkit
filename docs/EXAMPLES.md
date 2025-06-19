# Examples

Practical examples and common use cases for chrome-extension-toolkit.

## Table of Contents

- [Basic Extension Setup](#basic-extension-setup)
- [Messaging Examples](#messaging-examples)
- [Storage Examples](#storage-examples)
- [Content Script Examples](#content-script-examples)
- [React Integration](#react-integration)
- [Advanced Patterns](#advanced-patterns)

## Basic Extension Setup

### Simple Extension with Context Detection

```typescript
// background.ts
import { getScriptType, ScriptType } from 'chrome-extension-toolkit';

const context = getScriptType();
console.log(`Running in: ${context}`);

if (context === ScriptType.BACKGROUND_SCRIPT) {
  // Background script initialization
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
}
```

```typescript
// content.ts
import { isContentScript, createShadowDOM } from 'chrome-extension-toolkit';

if (isContentScript()) {
  // Only run in content script context
  const ui = createShadowDOM('my-extension');
  await ui.addStyle('styles/content.css');
  ui.shadowRoot.INJECTION_POINT.innerHTML = '<div>Content loaded!</div>';
}
```

## Messaging Examples

### Background ↔ Content Script Communication

```typescript
// types/messages.ts
export interface MessageSchema {
  getPageInfo: {
    request: { includeImages: boolean };
    response: { title: string; url: string; imageCount?: number };
  };
  updateBadge: {
    request: { text: string; color: string };
    response: void;
  };
  showNotification: {
    request: { title: string; message: string };
    response: void;
  };
}
```

```typescript
// background.ts
import { createMessenger, MessageListener } from 'chrome-extension-toolkit';
import type { MessageSchema } from './types/messages';

const foregroundMessenger = createMessenger<MessageSchema>('foreground');
const listener = new MessageListener<MessageSchema>({
  updateBadge: async ({ data }) => {
    chrome.action.setBadgeText({ text: data.text });
    chrome.action.setBadgeBackgroundColor({ color: data.color });
  },
  
  showNotification: async ({ data }) => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: data.title,
      message: data.message
    });
  }
});

listener.listen({ verbose: true });

// Send message to active tab
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    const pageInfo = await foregroundMessenger.getPageInfo(
      { includeImages: true },
      { tabId: tab.id }
    );
    console.log(`Page: ${pageInfo.title} has ${pageInfo.imageCount} images`);
  }
});
```

```typescript
// content.ts
import { createMessenger, MessageListener } from 'chrome-extension-toolkit';
import type { MessageSchema } from './types/messages';

const backgroundMessenger = createMessenger<MessageSchema>('background');
const listener = new MessageListener<MessageSchema>({
  getPageInfo: async ({ data }) => {
    const response = {
      title: document.title,
      url: window.location.href
    };
    
    if (data.includeImages) {
      response.imageCount = document.querySelectorAll('img').length;
    }
    
    return response;
  }
});

listener.listen();

// Example: Update badge when page loads
window.addEventListener('load', async () => {
  await backgroundMessenger.updateBadge({
    text: document.querySelectorAll('img').length.toString(),
    color: '#4CAF50'
  });
});
```

### Popup ↔ Background Communication

```typescript
// popup.tsx
import React, { useEffect, useState } from 'react';
import { createMessenger } from 'chrome-extension-toolkit';
import type { MessageSchema } from './types/messages';

export function Popup() {
  const [pageInfo, setPageInfo] = useState(null);
  const backgroundMessenger = createMessenger<MessageSchema>('background');

  const showNotification = async () => {
    await backgroundMessenger.showNotification({
      title: 'Hello from Popup!',
      message: 'This notification was triggered from the popup.'
    });
  };

  const getPageInfo = async () => {
    try {
      // Get active tab info through background script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const foregroundMessenger = createMessenger<MessageSchema>('foreground');
        const info = await foregroundMessenger.getPageInfo(
          { includeImages: true },
          { tabId: tab.id }
        );
        setPageInfo(info);
      }
    } catch (error) {
      console.error('Failed to get page info:', error);
    }
  };

  return (
    <div>
      <h1>Extension Popup</h1>
      <button onClick={showNotification}>
        Show Notification
      </button>
      <button onClick={getPageInfo}>
        Get Page Info
      </button>
      {pageInfo && (
        <div>
          <h3>{pageInfo.title}</h3>
          <p>URL: {pageInfo.url}</p>
          <p>Images: {pageInfo.imageCount}</p>
        </div>
      )}
    </div>
  );
}
```

## Storage Examples

### User Settings Management

```typescript
// stores/userSettings.ts
import { createSyncStore } from 'chrome-extension-toolkit';

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  autoSave: boolean;
  language: string;
  shortcuts: {
    toggle: string;
    save: string;
  };
}

export const userSettingsStore = createSyncStore<UserSettings>('user-settings', {
  theme: 'auto',
  notifications: true,
  autoSave: true,
  language: 'en',
  shortcuts: {
    toggle: 'Ctrl+Shift+E',
    save: 'Ctrl+S'
  }
});
```

```typescript
// components/Settings.tsx
import React from 'react';
import { userSettingsStore } from '../stores/userSettings';

export function Settings() {
  const [settings, setSettings] = userSettingsStore.use(null);
  const [theme, setTheme] = userSettingsStore.use('theme');

  const updateTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  const toggleNotifications = () => {
    setSettings({
      ...settings,
      notifications: !settings.notifications
    });
  };

  return (
    <div>
      <h2>Settings</h2>
      
      <div>
        <label>Theme:</label>
        <select value={theme} onChange={(e) => updateTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={toggleNotifications}
          />
          Enable Notifications
        </label>
      </div>
    </div>
  );
}
```

### Encrypted Data Storage

```typescript
// stores/secureData.ts
import { createLocalStore } from 'chrome-extension-toolkit';

// Set encryption password in environment or build process
process.env.EXTENSION_STORAGE_PASSWORD = 'your-secure-encryption-key';

interface SecureData {
  apiKeys: {
    openai: string;
    github: string;
  };
  userTokens: {
    accessToken: string;
    refreshToken: string;
  };
  personalInfo: {
    email: string;
    preferences: Record<string, any>;
  };
}

export const secureStore = createLocalStore<SecureData>('secure-data', {
  apiKeys: {
    openai: '',
    github: ''
  },
  userTokens: {
    accessToken: '',
    refreshToken: ''
  },
  personalInfo: {
    email: '',
    preferences: {}
  }
}, {
  isEncrypted: true // Enable encryption
});

// Usage
export async function saveApiKey(service: string, key: string) {
  const apiKeys = await secureStore.get('apiKeys');
  await secureStore.set('apiKeys', {
    ...apiKeys,
    [service]: key
  });
}

export async function getApiKey(service: string): Promise<string> {
  const apiKeys = await secureStore.get('apiKeys');
  return apiKeys[service] || '';
}
```

## Content Script Examples

### Page Modification with Shadow DOM

```typescript
// content/pageModifier.ts
import { createShadowDOM, isContentScript } from 'chrome-extension-toolkit';

if (isContentScript()) {
  class PageModifier {
    private shadowRoot: HTMLElement;

    async init() {
      // Create isolated UI
      this.shadowRoot = createShadowDOM('page-modifier', {
        mode: 'closed'
      });

      // Load styles
      await this.shadowRoot.addStyle('styles/content.css');

      // Create floating toolbar
      this.createToolbar();
      
      // Listen for page changes
      this.observePageChanges();
    }

    private createToolbar() {
      const toolbar = document.createElement('div');
      toolbar.className = 'extension-toolbar';
      toolbar.innerHTML = `
        <button id="highlight-btn">Highlight Text</button>
        <button id="summarize-btn">Summarize Page</button>
        <button id="translate-btn">Translate</button>
      `;

      this.shadowRoot.shadowRoot.INJECTION_POINT.appendChild(toolbar);

      // Add event listeners
      toolbar.addEventListener('click', this.handleToolbarClick.bind(this));
    }

    private handleToolbarClick(event: Event) {
      const target = event.target as HTMLElement;
      
      switch (target.id) {
        case 'highlight-btn':
          this.highlightSelection();
          break;
        case 'summarize-btn':
          this.summarizePage();
          break;
        case 'translate-btn':
          this.translatePage();
          break;
      }
    }

    private highlightSelection() {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.backgroundColor = 'yellow';
        span.style.color = 'black';
        
        try {
          range.surroundContents(span);
        } catch (e) {
          // Fallback for complex selections
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
        
        selection.removeAllRanges();
      }
    }

    private async summarizePage() {
      const content = document.body.innerText;
      // Send to background for AI processing
      const backgroundMessenger = createMessenger<MessageSchema>('background');
      await backgroundMessenger.summarizeContent({ content });
    }

    private observePageChanges() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Handle dynamic content changes
            this.updateToolbarPosition();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize when page loads
  const modifier = new PageModifier();
  modifier.init();
}
```

## React Integration

### Complete React App with Extension Context

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { ContextInvalidated, getScriptType } from 'chrome-extension-toolkit';
import { Settings } from './components/Settings';
import { PageInfo } from './components/PageInfo';
import { userSettingsStore } from './stores/userSettings';

export function App() {
  const [settings] = userSettingsStore.use(null);
  const [context, setContext] = useState(null);

  useEffect(() => {
    setContext(getScriptType());
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return (
    <ContextInvalidated fallback={<div>Extension context invalidated</div>}>
      <div className="app">
        <header>
          <h1>My Extension</h1>
          <span className="context-badge">{context}</span>
        </header>

        <main>
          {context === 'extension_popup' && <PageInfo />}
          <Settings />
        </main>
      </div>
    </ContextInvalidated>
  );
}
```

```typescript
// components/PageInfo.tsx
import React, { useEffect, useState } from 'react';
import { createMessenger } from 'chrome-extension-toolkit';

export function PageInfo() {
  const [pageInfo, setPageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const getPageInfo = async () => {
    setLoading(true);
    try {
      const messenger = createMessenger<MessageSchema>('foreground');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.id) {
        const info = await messenger.getPageInfo(
          { includeImages: true },
          { tabId: tab.id }
        );
        setPageInfo(info);
      }
    } catch (error) {
      console.error('Failed to get page info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPageInfo();
  }, []);

  if (loading) return <div>Loading page info...</div>;
  if (!pageInfo) return <div>No page info available</div>;

  return (
    <div className="page-info">
      <h3>Current Page</h3>
      <p><strong>Title:</strong> {pageInfo.title}</p>
      <p><strong>URL:</strong> {pageInfo.url}</p>
      <p><strong>Images:</strong> {pageInfo.imageCount}</p>
      <button onClick={getPageInfo}>Refresh</button>
    </div>
  );
}
```

## Advanced Patterns

### Multi-Context State Synchronization

```typescript
// stores/sharedState.ts
import { createLocalStore } from 'chrome-extension-toolkit';

interface SharedState {
  isActive: boolean;
  currentTab: number | null;
  userActivity: {
    lastSeen: number;
    clickCount: number;
  };
}

export const sharedStateStore = createLocalStore<SharedState>('shared-state', {
  isActive: false,
  currentTab: null,
  userActivity: {
    lastSeen: Date.now(),
    clickCount: 0
  }
});

// Sync state across all contexts
export class StateManager {
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Listen for changes from other contexts
    sharedStateStore.subscribe(['isActive', 'currentTab'], (changes) => {
      this.notifyListeners();
    });
  }

  async setActive(active: boolean) {
    await sharedStateStore.set('isActive', active);
    if (active) {
      await this.updateActivity();
    }
  }

  async updateActivity() {
    const activity = await sharedStateStore.get('userActivity');
    await sharedStateStore.set('userActivity', {
      ...activity,
      lastSeen: Date.now(),
      clickCount: activity.clickCount + 1
    });
  }

  onStateChange(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}

export const stateManager = new StateManager();
```

### Error Handling and Recovery

```typescript
// utils/errorHandler.ts
import { Console, createMessenger } from 'chrome-extension-toolkit';

export class ExtensionErrorHandler {
  private static instance: ExtensionErrorHandler;
  private errorCount = 0;
  private maxErrors = 10;

  static getInstance() {
    if (!ExtensionErrorHandler.instance) {
      ExtensionErrorHandler.instance = new ExtensionErrorHandler();
    }
    return ExtensionErrorHandler.instance;
  }

  handleError(error: Error, context?: string) {
    this.errorCount++;
    
    Console.error(`Extension Error ${context ? `in ${context}` : ''}:`, error);

    // Send to background for logging
    try {
      const messenger = createMessenger<MessageSchema>('background');
      messenger.logError({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      });
    } catch (e) {
      Console.error('Failed to send error to background:', e);
    }

    // Too many errors - disable extension
    if (this.errorCount > this.maxErrors) {
      this.disableExtension();
    }
  }

  private async disableExtension() {
    Console.error('Too many errors, disabling extension');
    
    try {
      // Clean up resources
      await this.cleanup();
      
      // Notify user
      const messenger = createMessenger<MessageSchema>('background');
      await messenger.showNotification({
        title: 'Extension Disabled',
        message: 'Too many errors occurred. Please reload the extension.'
      });
    } catch (e) {
      Console.error('Failed to disable extension gracefully:', e);
    }
  }

  private async cleanup() {
    // Remove event listeners, clear intervals, etc.
    // Implementation depends on your extension's needs
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  ExtensionErrorHandler.getInstance().handleError(event.error, 'global');
});

window.addEventListener('unhandledrejection', (event) => {
  ExtensionErrorHandler.getInstance().handleError(
    new Error(event.reason),
    'unhandled-promise'
  );
});
```

These examples demonstrate real-world usage patterns and best practices for building robust Chrome extensions with the toolkit.