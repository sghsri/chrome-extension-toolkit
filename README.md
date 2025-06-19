# Chrome Extension Toolkit

A comprehensive TypeScript toolkit for building Chrome extensions with modern React patterns, type-safe messaging, secure storage, and context management utilities.

## Features

- 🔒 **Secure Storage** - Encrypted local/sync storage with React hooks
- 📡 **Type-Safe Messaging** - Bi-directional messaging between extension contexts
- 🎯 **Context Detection** - Automatically detect extension runtime context
- 🌐 **DOM Utilities** - Shadow DOM creation and manipulation
- ⚛️ **React Integration** - Built-in hooks and components
- 🛡️ **TypeScript First** - Full type safety throughout

## Installation

```bash
npm install chrome-extension-toolkit
```

## Quick Start

### 1. Context Detection

Detect which context your code is running in:

```typescript
import { getScriptType, ScriptType, isContentScript } from 'chrome-extension-toolkit';

const context = getScriptType();
console.log(context); // 'content_script', 'background_script', 'extension_popup', etc.

if (isContentScript()) {
  // This code only runs in content scripts
}
```

### 2. Type-Safe Messaging

Define your message schema and get type-safe messaging:

```typescript
// types.ts
interface MessageSchema {
  getUserData: {
    request: { userId: string };
    response: { name: string; email: string };
  };
  updateSettings: {
    request: { theme: 'light' | 'dark' };
    response: void;
  };
}

// background.ts
import { createMessenger, MessageListener } from 'chrome-extension-toolkit';

const messenger = createMessenger<MessageSchema>('foreground');
const listener = new MessageListener<MessageSchema>();

listener.onMessage('getUserData', async ({ userId }) => {
  return { name: 'John', email: 'john@example.com' };
});

// content script
const backgroundMessenger = createMessenger<MessageSchema>('background');
const userData = await backgroundMessenger.getUserData({ userId: '123' });
// userData is fully typed!
```

### 3. Secure Storage with React Hooks

Create type-safe storage with automatic React integration:

```typescript
interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  apiKey?: string;
}

const settingsStore = createLocalStore<UserSettings>('user-settings', {
  theme: 'light',
  notifications: true,
  apiKey: undefined
}, { isEncrypted: true });

// In a React component
function SettingsPanel() {
  const [theme, setTheme] = settingsStore.use('theme');
  const [allSettings, setAllSettings] = settingsStore.use(null);

  return (
    <div>
      <button onClick={() => setTheme('dark')}>
        Current theme: {theme}
      </button>
    </div>
  );
}
```

### 4. DOM Utilities

Create isolated DOM environments:

```typescript
import { createShadowRoot } from 'chrome-extension-toolkit';

const shadowRoot = createShadowRoot(document.body, {
  mode: 'closed',
  styles: ['styles.css']
});

// Your extension UI is now isolated from the page's CSS
shadowRoot.innerHTML = '<div>My Extension UI</div>';
```

## API Reference

### Context Detection

- `getScriptType()` - Detect current extension context
- `isContentScript()` - Check if running in content script
- `isBackgroundScript()` - Check if running in background script
- `isExtensionPopup()` - Check if running in popup
- `isExtensionPage(pageName?)` - Check if running in extension page

### Messaging

- `createMessenger<T>(destination)` - Create type-safe messenger
- `MessageListener<T>` - Handle incoming messages with type safety
- `createUseMessage<T>()` - React hook for messaging

### Storage

- `createLocalStore<T>(id, defaults, options?)` - Local storage (persistent)
- `createSyncStore<T>(id, defaults, options?)` - Sync storage (cross-device)
- `createSessionStore<T>(id, defaults, options?)` - Session storage (temporary)
- `createManagedStore<T>(id, defaults, options?)` - Managed storage (admin-controlled)

### DOM Utilities

- `createShadowRoot(host, options?)` - Create isolated shadow DOM

### Context Management

- `ContextInvalidated` - React component for handling context invalidation
- `onContextInvalidated(callback)` - Listen for context invalidation events

## Advanced Usage

### Encrypted Storage

For sensitive data, enable encryption:

```typescript
// Set environment variable for encryption key
process.env.EXTENSION_STORAGE_PASSWORD = 'your-secure-key';

const secureStore = createLocalStore('secure-data', {
  apiToken: '',
  userCredentials: {}
}, { 
  isEncrypted: true 
});
```

### Cross-Context Communication

```typescript
// Background script
const backgroundMessenger = createMessenger<MessageSchema>('foreground');

// Send to active tab
await backgroundMessenger.notifyUser(
  { message: 'Hello!' }, 
  { tabId: 'ACTIVE_TAB' }
);

// Send to specific tab
await backgroundMessenger.updateUI(
  { data: newData }, 
  { tabId: 123, frameId: 0 }
);

// Broadcast to all tabs
await backgroundMessenger.broadcast(
  { event: 'refresh' }, 
  { tabId: 'ALL' }
);
```

### Error Handling

```typescript
import { ContextInvalidated } from 'chrome-extension-toolkit';

function MyComponent() {
  return (
    <ContextInvalidated
      fallback={<div>Extension context was invalidated. Please refresh.</div>}
    >
      <YourAppContent />
    </ContextInvalidated>
  );
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT - see [LICENSE](LICENSE) file for details.

## Changelog

See [releases](https://github.com/sghsri/chrome-extension-toolkit/releases) for version history and changes.