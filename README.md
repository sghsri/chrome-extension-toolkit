# Chrome Extension Toolkit

A comprehensive TypeScript library providing utilities and helpers for Chrome extension development. This toolkit simplifies common tasks like messaging between different extension contexts, managing storage with React hooks, detecting script contexts, and handling DOM operations in content scripts.

## Installation

```bash
npm install chrome-extension-toolkit
```

## Features

- 🔄 **Type-safe messaging** between extension contexts
- 💾 **Advanced storage management** with React hooks and encryption support
- 🎯 **Script context detection** (content script, background, popup, etc.)
- 🌐 **DOM utilities** for content scripts with Shadow DOM support
- ⚛️ **React integration** with custom hooks and context utilities
- 🔒 **Security features** including data encryption
- 📝 **Full TypeScript support** with comprehensive type definitions

## Quick Start

```typescript
import { 
  getScriptType, 
  ScriptType, 
  createMessenger, 
  createLocalStore 
} from 'chrome-extension-toolkit';

// Detect the current script context
const scriptType = getScriptType();
if (scriptType === ScriptType.CONTENT_SCRIPT) {
  console.log('Running in content script');
}

// Create a type-safe messenger
const messenger = createMessenger<MyMessages>('background');

// Create a storage store with React hooks
const store = createLocalStore('my-app', {
  userId: '',
  settings: { theme: 'light' }
});
```

## API Documentation

### Script Context Detection

The `getScriptType` module helps you determine the context in which your extension code is running.

```typescript
import { 
  getScriptType, 
  ScriptType, 
  isContentScript, 
  isBackgroundScript, 
  isExtensionPopup, 
  isExtensionPage 
} from 'chrome-extension-toolkit';

// Get the current script type
const scriptType = getScriptType();

switch (scriptType) {
  case ScriptType.CONTENT_SCRIPT:
    // Code running in a content script
    break;
  case ScriptType.BACKGROUND_SCRIPT:
    // Code running in the background script/service worker
    break;
  case ScriptType.EXTENSION_POPUP:
    // Code running in the extension popup
    break;
  case ScriptType.EXTENSION_PAGE:
    // Code running in an extension page (options, etc.)
    break;
  default:
    // Not running in a Chrome extension context
    break;
}

// Helper functions for common checks
if (isContentScript()) {
  // Content script specific code
}

if (isBackgroundScript()) {
  // Background script specific code
}

if (isExtensionPopup()) {
  // Popup specific code
}

if (isExtensionPage('options.html')) {
  // Options page specific code
}
```

### Messaging

Type-safe messaging between different parts of your Chrome extension.

#### Define Your Message Types

```typescript
// types/messages.ts
interface MyMessages {
  getUserData: {
    data: { userId: string };
    response: { name: string; email: string };
  };
  updateSettings: {
    data: { theme: 'light' | 'dark' };
    response: void;
  };
  broadcastNotification: {
    data: { message: string };
    response: void;
  };
}
```

#### Background Script (Receiving Messages)

```typescript
import { MessageListener } from 'chrome-extension-toolkit';

const messageListener = new MessageListener<MyMessages>();

messageListener.on('getUserData', async ({ userId }) => {
  const userData = await fetchUserData(userId);
  return { name: userData.name, email: userData.email };
});

messageListener.on('updateSettings', async ({ theme }) => {
  await saveSettings({ theme });
  // No return needed for void responses
});

messageListener.start();
```

#### Content Script/Popup (Sending Messages)

```typescript
import { createMessenger } from 'chrome-extension-toolkit';

const messenger = createMessenger<MyMessages>('background');

// Send a message and get a typed response
const userData = await messenger.getUserData({ userId: '123' });
console.log(userData.name, userData.email);

// Send a message with no response
await messenger.updateSettings({ theme: 'dark' });
```

#### Foreground Messaging (Background to Content Scripts/Pages)

```typescript
// In background script
const messenger = createMessenger<MyMessages>('foreground');

// Send to a specific tab
await messenger.broadcastNotification(
  { message: 'Hello!' }, 
  { tabId: 123 }
);

// Send to the active tab
await messenger.broadcastNotification(
  { message: 'Hello!' }, 
  { tabId: 'ACTIVE_TAB' }
);

// Send to all tabs
await messenger.broadcastNotification(
  { message: 'Hello!' }, 
  { tabId: 'ALL' }
);
```

#### React Hook for Messaging

```typescript
import { createUseMessage } from 'chrome-extension-toolkit';

const useMessage = createUseMessage<MyMessages>();

function MyComponent() {
  const sendMessage = useMessage('background');
  
  const handleClick = async () => {
    const userData = await sendMessage.getUserData({ userId: '123' });
    console.log(userData);
  };
  
  return <button onClick={handleClick}>Get User Data</button>;
}
```

### Storage

Powerful storage utilities with React integration and optional encryption.

#### Basic Usage

```typescript
import { createLocalStore, createSyncStore } from 'chrome-extension-toolkit';

// Define your store type
interface AppStore {
  userId: string;
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  lastLogin?: Date;
}

// Create a local store (stays on device)
const localStore = createLocalStore<AppStore>('my-app', {
  userId: '',
  settings: {
    theme: 'light',
    notifications: true
  },
  lastLogin: undefined
});

// Create a sync store (syncs across devices)
const syncStore = createSyncStore<AppStore>('my-app-sync', {
  userId: '',
  settings: {
    theme: 'light',
    notifications: true
  },
  lastLogin: undefined
});
```

#### Store Operations

```typescript
// Initialize the store (sets default values)
await store.initialize();

// Get individual values
const userId = await store.get('userId');
const settings = await store.get('settings');

// Set individual values
await store.set('userId', 'user123');
await store.set('settings', { theme: 'dark', notifications: false });

// Set multiple values at once
await store.set({
  userId: 'user123',
  lastLogin: new Date()
});

// Get all store data
const allData = await store.all();

// Remove a key
await store.remove('lastLogin');

// Get all keys
const keys = store.keys();
```

#### React Hooks Integration

```typescript
import React from 'react';

function SettingsComponent() {
  // Use a specific key with React hooks
  const [theme, setTheme] = store.use('settings');
  const [userId, setUserId] = store.use('userId');
  
  // Use the entire store
  const [allData, setAllData] = store.use(null);
  
  return (
    <div>
      <p>Current theme: {theme.theme}</p>
      <button onClick={() => setTheme({ ...theme, theme: 'dark' })}>
        Switch to Dark
      </button>
      
      <p>User ID: {userId}</p>
      <input 
        value={userId} 
        onChange={(e) => setUserId(e.target.value)} 
      />
    </div>
  );
}
```

#### Storage Subscriptions

```typescript
// Subscribe to changes in a specific key
const unsubscribe = store.subscribe('settings', (change) => {
  console.log(`Settings changed from`, change.oldValue, 'to', change.newValue);
});

// Subscribe to multiple keys
const unsubscribeMultiple = store.subscribe(['userId', 'settings'], (change) => {
  console.log(`${change.key} changed:`, change.newValue);
});

// Clean up subscriptions
unsubscribe();
unsubscribeMultiple();
```

#### Encrypted Storage

```typescript
// Set up encryption (requires EXTENSION_STORAGE_PASSWORD environment variable)
const encryptedStore = createLocalStore<AppStore>('encrypted-store', 
  { /* defaults */ }, 
  { isEncrypted: true }
);

// Usage is identical to regular stores
await encryptedStore.set('userId', 'sensitive-data');
const userData = await encryptedStore.get('userId'); // Automatically decrypted
```

### DOM Utilities

Utilities for content scripts to interact with the DOM while avoiding style conflicts.

#### Shadow DOM Creation

```typescript
import { createShadowDOM } from 'chrome-extension-toolkit';

// Create an isolated shadow DOM for your extension UI
const shadowRoot = createShadowDOM('my-extension-ui', {
  mode: 'open'
});

// Add styles to the shadow DOM
await shadowRoot.addStyle('styles/content.css');

// Access the injection point for your React app or HTML
const injectionPoint = shadowRoot.shadowRoot.INJECTION_POINT;

// Example: Render a React app in the shadow DOM
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(<MyExtensionApp />, injectionPoint);
```

### Context Utilities

React utilities for handling context invalidation in Chrome extensions.

```typescript
import { ContextInvalidated, onContextInvalidated } from 'chrome-extension-toolkit';

// Handle context invalidation in content scripts
onContextInvalidated(() => {
  console.log('Extension context was invalidated, cleaning up...');
  // Perform cleanup
});

// React component that shows when context is invalidated
function MyApp() {
  return (
    <div>
      <ContextInvalidated>
        <p>Extension context was invalidated. Please refresh the page.</p>
      </ContextInvalidated>
      
      {/* Your app content */}
      <MyMainComponent />
    </div>
  );
}
```

### Utility Functions

#### Console Logging

```typescript
import { Console } from 'chrome-extension-toolkit';

// Enhanced console logging with extension context info
Console.log('Debug message', { data: 'example' });
Console.error('Error occurred', error);
Console.warn('Warning message');
```

#### String Utilities

```typescript
import { capitalize } from 'chrome-extension-toolkit';

const text = capitalize('hello world'); // "Hello world"
```

## Store Types

The toolkit provides different storage types for different use cases:

- **`createLocalStore`** - Local storage that persists on the device
- **`createSyncStore`** - Storage that syncs across user's devices via Chrome sync
- **`createSessionStore`** - Temporary storage that clears when browser closes
- **`createManagedStore`** - Enterprise-managed storage (admin-controlled)

## TypeScript Support

The library is built with TypeScript and provides comprehensive type definitions. All functions and classes are fully typed, providing excellent IntelliSense and compile-time type checking.

## Testing

The library uses Jest with `jest-chrome` for testing Chrome extension APIs. Run tests with:

```bash
npm test
npm run test:watch  # Watch mode
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Examples

Check out the [examples](./examples) directory for complete working examples of:

- Background script setup
- Content script with React
- Popup with messaging
- Options page with storage
- Cross-context communication

## API Reference

For detailed API documentation, see the TypeScript definitions or generate docs with:

```bash
npm run docs
```