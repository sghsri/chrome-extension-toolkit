# API Reference

Complete API documentation for chrome-extension-toolkit.

## Table of Contents

- [Context Detection](#context-detection)
- [Messaging](#messaging)
- [Storage](#storage)
- [DOM Utilities](#dom-utilities)
- [Context Management](#context-management)
- [Utilities](#utilities)
- [Types](#types)

## Context Detection

### `getScriptType(): ScriptType | null`

Detects the current Chrome extension runtime context.

**Returns:** `ScriptType | null`
- `ScriptType.CONTENT_SCRIPT` - Running in a content script
- `ScriptType.BACKGROUND_SCRIPT` - Running in a background script
- `ScriptType.EXTENSION_POPUP` - Running in the extension popup
- `ScriptType.EXTENSION_PAGE` - Running in an extension page
- `null` - Not running in a Chrome extension context

**Example:**
```typescript
import { getScriptType, ScriptType } from 'chrome-extension-toolkit';

const context = getScriptType();
if (context === ScriptType.CONTENT_SCRIPT) {
  // Content script specific code
}
```

### Helper Functions

#### `isContentScript(): boolean`
Returns `true` if running in a content script.

#### `isBackgroundScript(): boolean`
Returns `true` if running in a background script.

#### `isExtensionPopup(): boolean`
Returns `true` if running in the extension popup.

#### `isExtensionPage(pageName?: string): boolean`
Returns `true` if running in an extension page. Optionally check for a specific page.

**Parameters:**
- `pageName` (optional): Specific page name to check for (e.g., 'options.html')

## Messaging

### `createMessenger<T>(destination: 'background' | 'foreground')`

Creates a type-safe messenger for communication between extension contexts.

**Parameters:**
- `destination`: Target context for messages
  - `'background'` - Send messages to background script
  - `'foreground'` - Send messages to content scripts/popup

**Returns:** Messenger object with methods corresponding to your message schema

**Example:**
```typescript
interface MessageSchema {
  getUserData: {
    request: { userId: string };
    response: { name: string; email: string };
  };
}

const messenger = createMessenger<MessageSchema>('background');
const result = await messenger.getUserData({ userId: '123' });
// result is typed as { name: string; email: string }
```

### `MessageListener<T>`

Class for handling incoming messages with type safety.

**Constructor:**
```typescript
new MessageListener<T>(handlers: MessageHandler<T>)
```

**Methods:**

#### `listen(options?: MessageListenerOptions): void`
Start listening for messages.

**Options:**
- `verbose?: boolean` - Enable verbose logging
- `onError?: (error: Error) => void` - Error handler callback

#### `unlisten(): void`
Stop listening for messages.

**Example:**
```typescript
const listener = new MessageListener<MessageSchema>({
  getUserData: async ({ data, sendResponse }) => {
    const user = await fetchUser(data.userId);
    return { name: user.name, email: user.email };
  }
});

listener.listen({ verbose: true });
```

### `createUseMessage<T>()`

React hook for messaging (implementation may vary based on actual code).

## Storage

### `createLocalStore<T>(storeId: string, defaults: StoreDefaults<T>, options?: StoreOptions)`

Creates a local storage store that persists across browser sessions.

**Parameters:**
- `storeId`: Unique identifier for the store
- `defaults`: Default values for all store keys
- `options`: Optional configuration
  - `isEncrypted?: boolean` - Enable data encryption

**Returns:** `Store<T>` object

### `createSyncStore<T>(storeId: string, defaults: StoreDefaults<T>, options?: StoreOptions)`

Creates a sync storage store that syncs across user's devices.

### `createSessionStore<T>(storeId: string, defaults: StoreDefaults<T>, options?: StoreOptions)`

Creates a session storage store that only persists during the current session.

### `createManagedStore<T>(storeId: string, defaults: StoreDefaults<T>, options?: StoreOptions)`

Creates a managed storage store controlled by enterprise policies.

### Store Methods

#### `get<K extends keyof T>(key: K): Promise<Serializable<T[K]>>`
Get a value from the store.

#### `set<K extends keyof T>(key: K, value: Serializable<T[K]>): Promise<void>`
Set a single value in the store.

#### `set(values: Partial<Serializable<T>>): Promise<void>`
Set multiple values in the store.

#### `remove<K extends keyof T>(key: K): Promise<void>`
Remove a key from the store.

#### `all(): Promise<Serializable<T>>`
Get all values from the store.

#### `keys(): (keyof T & string)[]`
Get all keys in the store.

#### `use<K extends keyof T | null>(key: K): [value, setter]`
React hook for reactive store access.

#### `subscribe<K extends keyof T>(key: K, callback: OnChangedFunction<T[K]>): Function`
Subscribe to changes in a specific key.

#### `unsubscribe(subscription: Function): void`
Remove a subscription.

**Example:**
```typescript
interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

const store = createLocalStore<UserSettings>('user-settings', {
  theme: 'light',
  notifications: true
});

// Get a value
const theme = await store.get('theme');

// Set a value
await store.set('theme', 'dark');

// Use in React component
function Settings() {
  const [theme, setTheme] = store.use('theme');
  
  return (
    <button onClick={() => setTheme('dark')}>
      Current theme: {theme}
    </button>
  );
}
```

## DOM Utilities

### `createShadowDOM(id: string, options?: ShadowRootInit): HTMLShadowDOMElement`

Creates an isolated shadow DOM element for content scripts.

**Parameters:**
- `id`: Unique identifier for the shadow root
- `options`: Standard `ShadowRootInit` options

**Returns:** Extended `HTMLDivElement` with shadow root and additional methods

**Methods:**
- `addStyle(path: string): Promise<void>` - Add CSS from extension resources

**Example:**
```typescript
import { createShadowDOM } from 'chrome-extension-toolkit';

const shadowRoot = createShadowDOM('my-extension-ui', {
  mode: 'closed'
});

await shadowRoot.addStyle('styles/content.css');
shadowRoot.shadowRoot.INJECTION_POINT.innerHTML = '<div>My UI</div>';
```

## Context Management

### `ContextInvalidated`

React component that displays a message when extension context is invalidated.

**Props:**
- `className?: string` - Custom CSS class
- `onClick?: () => void` - Custom click handler (defaults to page reload)

**Example:**
```typescript
import { ContextInvalidated } from 'chrome-extension-toolkit';

function App() {
  return (
    <ContextInvalidated
      className="context-error"
      onClick={() => {
        // Custom handler
        window.location.reload();
      }}
    />
  );
}
```

### `onContextInvalidated(callback: () => void): () => void`

Listen for context invalidation events.

**Parameters:**
- `callback`: Function to call when context is invalidated

**Returns:** Function to remove the listener

**Example:**
```typescript
import { onContextInvalidated } from 'chrome-extension-toolkit';

const removeListener = onContextInvalidated(() => {
  console.log('Extension context was invalidated');
  // Handle cleanup
});

// Later, remove the listener
removeListener();
```

## Utilities

### `Console`

Styled console logging utility.

**Methods:**
- `Console.log(...args: any[]): void` - Blue styled log
- `Console.success(...args: any[]): void` - Green styled log
- `Console.error(...args: any[]): void` - Red styled error
- `Console.warn(...args: any[]): void` - Yellow styled warning

**Example:**
```typescript
import { Console } from 'chrome-extension-toolkit';

Console.log('Extension loaded');
Console.success('Data synced successfully');
Console.error('Failed to connect');
Console.warn('Deprecated API usage');
```

### String Utilities

#### `capitalize(str: string): string`

Capitalizes the first letter of a string.

**Example:**
```typescript
import { capitalize } from 'chrome-extension-toolkit';

console.log(capitalize('hello')); // 'Hello'
```

## Types

### `MessageSchema`

Interface for defining message types:

```typescript
interface MessageSchema {
  [messageName: string]: {
    request: any;
    response: any;
  };
}
```

### `StoreDefaults<T>`

Type that ensures all required properties have default values:

```typescript
type StoreDefaults<T> = {
  [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> 
    ? T[P] 
    : T[P] | undefined;
};
```

### `Serializable<T>`

Type for values that can be stored in Chrome storage.

### `MessageEndpoint`

Enum for message destinations:
- `MessageEndpoint.BACKGROUND`
- `MessageEndpoint.FOREGROUND`

### `ScriptType`

Enum for extension contexts:
- `ScriptType.CONTENT_SCRIPT`
- `ScriptType.BACKGROUND_SCRIPT`
- `ScriptType.EXTENSION_POPUP`
- `ScriptType.EXTENSION_PAGE`