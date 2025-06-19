# Contributing to Chrome Extension Toolkit

Thank you for your interest in contributing to the Chrome Extension Toolkit! This guide will help you understand how to contribute effectively to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/chrome-extension-toolkit.git`
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Run type checking: `npm run typecheck`
6. Run linting: `npm run lint`

## Project Structure

```
src/
├── context/          # React context utilities for Chrome extensions
├── dom/              # DOM manipulation utilities (Shadow DOM)
├── messaging/        # Type-safe messaging between extension contexts
├── storage/          # Storage utilities with React hooks and encryption
├── types/            # TypeScript type definitions
├── utils/            # General utility functions
└── getScriptType.ts  # Script context detection

test/
├── utils/            # Test utilities and string tests
├── *.test.ts         # Test files for each module
├── TestData.ts       # Shared test data and mocks
└── jest.setup.ts     # Jest configuration and polyfills
```

## Testing Guidelines

### Writing Tests

This project uses Jest with `jest-chrome` for mocking Chrome extension APIs. Tests should:

1. **Test the public API** - Focus on the exported functions and classes
2. **Mock Chrome APIs** - Use `jest-chrome` mocks for `chrome.*` APIs
3. **Test edge cases** - Include error conditions and boundary cases
4. **Use TypeScript** - All tests should be written in TypeScript

### Test File Structure

```typescript
import { functionToTest } from 'src/module';
import { chrome } from 'jest-chrome';
import TestData from 'test/TestData';

describe('Module Name', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup chrome mocks
        chrome.runtime.getManifest.mockReturnValue(TestData.manifest);
        chrome.runtime.id = TestData.extensionId;
    });

    describe('functionToTest', () => {
        it('should behave correctly in normal case', () => {
            // Test implementation
        });

        it('should handle edge cases', () => {
            // Test edge cases
        });
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- messaging.test.ts

# Run with coverage
npm test -- --coverage
```

### Mocking Chrome APIs

The project uses `jest-chrome` for mocking Chrome extension APIs:

```typescript
// Mock storage operations
chrome.storage.local.get.mockResolvedValue({ key: 'value' });
chrome.storage.local.set.mockResolvedValue(undefined);

// Mock messaging
chrome.runtime.sendMessage.mockResolvedValue(response);
chrome.runtime.onMessage.addListener.mockImplementation(callback => {
    // Test implementation
});

// Mock tabs API
chrome.tabs.query.mockResolvedValue([mockTab]);
chrome.tabs.sendMessage.mockResolvedValue(response);
```

### Testing React Components

For React components and hooks, use `@testing-library/react`:

```typescript
import { renderHook } from '@testing-library/react';

describe('useMessage hook', () => {
    it('should setup message listener', () => {
        const { result } = renderHook(() => useMessage('messageName', callback));
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
});
```

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit return types for public APIs
- Use type assertions sparingly (`@ts-ignore` only when necessary)
- Document complex types with JSDoc comments

### ESLint & Prettier

The project uses ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint -- --fix

# Format code with Prettier
npx prettier --write .
```

### JSDoc Documentation

All public APIs should be documented with JSDoc:

```typescript
/**
 * Creates a type-safe messenger for Chrome extension communication.
 * @param destination - The target context ('background' or 'foreground')
 * @returns A messenger object with type-safe methods
 * @example
 * ```typescript
 * const messenger = createMessenger<MyMessages>('background');
 * const response = await messenger.getUserData({ userId: '123' });
 * ```
 */
export function createMessenger<M>(destination: string) {
    // Implementation
}
```

## Adding New Features

### 1. Plan the API

- Consider TypeScript types and generics
- Think about Chrome extension contexts (background, content, popup)
- Design for type safety and developer experience

### 2. Implement the Feature

- Add implementation in appropriate `src/` directory
- Export from the module's `index.ts`
- Add to main `src/index.ts` if it's a public API

### 3. Add Tests

- Create comprehensive tests in `test/` directory
- Test all public methods and edge cases
- Mock Chrome APIs appropriately
- Aim for high code coverage

### 4. Update Documentation

- Add JSDoc comments to all public APIs
- Update README.md with usage examples
- Add TypeScript examples that users can copy

### 5. Update Types

- Add or update TypeScript definitions in `src/types/`
- Ensure all exports are properly typed
- Test that types work correctly with TypeScript

## Common Patterns

### Storage Utilities

```typescript
// Creating type-safe stores
interface MyStore {
    userId: string;
    settings: UserSettings;
}

const store = createLocalStore<MyStore>('my-app', {
    userId: '',
    settings: defaultSettings
});
```

### Messaging Patterns

```typescript
// Define message types
interface MyMessages {
    getUserData: {
        data: { userId: string };
        response: UserData;
    };
}

// Background script (receiver)
const listener = new MessageListener<MyMessages>({
    getUserData: async ({ data, sendResponse }) => {
        const userData = await fetchUser(data.userId);
        sendResponse(userData);
    }
});

// Content script (sender)
const messenger = createMessenger<MyMessages>('background');
const userData = await messenger.getUserData({ userId: '123' });
```

### React Integration

```typescript
// Using storage hooks
function MyComponent() {
    const [userId, setUserId] = store.use('userId');
    const [allData, setAllData] = store.use(null);
    
    return (
        <div>
            <input value={userId} onChange={e => setUserId(e.target.value)} />
        </div>
    );
}
```

## Debugging Tests

### Common Issues

1. **Chrome API not mocked**: Make sure to mock all used Chrome APIs
2. **Async operations**: Use `async/await` or return promises in tests
3. **Type errors**: Check that mocks match expected types

### Debugging Tips

```typescript
// Debug what was called
console.log(chrome.runtime.sendMessage.mock.calls);

// Check mock implementations
expect(chrome.storage.local.get).toHaveBeenCalledWith(['key']);

// Use beforeEach for setup
beforeEach(() => {
    jest.clearAllMocks();
    // Reset state
});
```

## Release Process

1. Ensure all tests pass: `npm test`
2. Ensure TypeScript compiles: `npm run typecheck`
3. Ensure linting passes: `npm run lint`
4. Build the package: `npm run build`
5. Update version in `package.json`
6. Create a pull request with your changes

## Getting Help

- Check existing issues on GitHub
- Look at the existing codebase for patterns
- Review test files for testing examples
- Ask questions in GitHub discussions

Thank you for contributing to Chrome Extension Toolkit! 🚀