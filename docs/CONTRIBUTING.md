# Contributing to Chrome Extension Toolkit

Thank you for your interest in contributing to the Chrome Extension Toolkit! This guide will help you get started with contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Getting Started

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/chrome-extension-toolkit.git
   cd chrome-extension-toolkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Run linting**
   ```bash
   npm run lint
   ```

## Project Structure

```
chrome-extension-toolkit/
├── src/                    # Source code
│   ├── context/           # Context management utilities
│   ├── dom/               # DOM manipulation utilities
│   ├── messaging/         # Chrome extension messaging
│   ├── storage/           # Chrome storage utilities
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # General utilities
│   ├── getScriptType.ts   # Context detection
│   └── index.ts           # Main entry point
├── test/                  # Test files
│   ├── context/           # Context tests
│   ├── dom/               # DOM tests
│   ├── messaging/         # Messaging tests
│   ├── storage/           # Storage tests
│   ├── utils/             # Utility tests
│   ├── TestData.ts        # Test fixtures
│   └── jest.setup.ts      # Jest configuration
├── docs/                  # Documentation
│   ├── API.md            # API reference
│   ├── EXAMPLES.md       # Usage examples
│   └── CONTRIBUTING.md   # This file
├── .github/              # GitHub workflows
│   └── workflows/
│       ├── release.yml
│       ├── unit-tests.yml
│       └── validate-pr.yml
├── README.md             # Project overview
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── jest.config.ts        # Jest test configuration
└── tsup.config.ts        # Build configuration
```

## Testing

We use Jest with TypeScript for testing. Tests should be comprehensive and cover:

- **Unit tests** - Test individual functions and classes
- **Integration tests** - Test how components work together
- **Edge cases** - Test error conditions and boundary cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- getScriptType.test.ts
```

### Writing Tests

1. **File naming**: Use `.test.ts` suffix for test files
2. **Test structure**: Follow the Arrange-Act-Assert pattern
3. **Mocking**: Use jest-chrome for Chrome API mocking
4. **Coverage**: Aim for high test coverage

Example test structure:
```typescript
import { functionToTest } from 'src/module';
import { chrome } from 'jest-chrome';

describe('functionToTest', () => {
  beforeEach(() => {
    // Setup mocks
    chrome.runtime.sendMessage.mockClear();
  });

  it('should perform expected behavior', async () => {
    // Arrange
    const input = 'test input';
    const expectedOutput = 'expected result';
    chrome.runtime.sendMessage.mockResolvedValue(expectedOutput);

    // Act
    const result = await functionToTest(input);

    // Assert
    expect(result).toBe(expectedOutput);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(input);
  });
});
```

### Test Utilities

- **TestData.ts** - Contains mock data and fixtures
- **jest.setup.ts** - Global test setup and configuration
- **chrome mocking** - Use jest-chrome for Chrome API mocks

## Code Style

We use ESLint and Prettier for code formatting and linting.

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful names for types and variables
- Add JSDoc comments for public APIs

### Code Standards

- **Naming conventions**:
  - Functions and variables: `camelCase`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `camelCase.ts`

- **Function design**:
  - Keep functions small and focused
  - Use pure functions when possible
  - Handle errors gracefully

- **Documentation**:
  - Add JSDoc comments for all public APIs
  - Include examples in complex functions
  - Document parameters and return types

Example:
```typescript
/**
 * Creates a type-safe messenger for Chrome extension communication.
 * 
 * @param destination - The target context for messages
 * @returns Messenger object with type-safe methods
 * 
 * @example
 * ```typescript
 * const messenger = createMessenger<MessageSchema>('background');
 * const result = await messenger.getUserData({ userId: '123' });
 * ```
 */
export function createMessenger<T>(destination: 'background' | 'foreground') {
  // Implementation
}
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint -- --fix

# Format code with Prettier
npx prettier --write .
```

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Use conventional commit messages:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `test:` - Test additions or changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

   Then create a pull request on GitHub with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots for UI changes
   - Test results

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages follow conventional format

## Adding New Features

### 1. Core Utilities

When adding new core utilities:

1. Create the implementation in the appropriate `src/` directory
2. Add comprehensive TypeScript types
3. Export from the main `index.ts` file
4. Add unit tests with good coverage
5. Document in `docs/API.md`
6. Add usage examples to `docs/EXAMPLES.md`

### 2. Chrome API Wrappers

For new Chrome API integrations:

1. Study the Chrome API documentation
2. Create type-safe wrapper functions
3. Handle all error cases gracefully
4. Add proper JSDoc documentation
5. Mock the Chrome APIs in tests
6. Test across different extension contexts

### 3. React Components

For new React components:

1. Use TypeScript with proper prop types
2. Handle context invalidation scenarios
3. Add comprehensive tests with React Testing Library
4. Document props and usage patterns
5. Consider accessibility requirements

## Release Process

Releases are automated through GitHub Actions:

1. **Version bumping** - Use semantic versioning
2. **Changelog generation** - Automatic from conventional commits
3. **NPM publishing** - Automated on main branch merge
4. **GitHub releases** - Created automatically

### Manual Release Steps

If needed, you can release manually:

```bash
# Bump version
npm version patch  # or minor, major

# Push with tags
git push origin main --tags

# Publish to NPM
npm publish
```

## Getting Help

- **Issues** - Report bugs and request features on GitHub Issues
- **Discussions** - Ask questions in GitHub Discussions
- **Documentation** - Check the docs/ directory for detailed guides

## Code of Conduct

Please note that this project is released with a Code of Conduct. By participating in this project you agree to abide by its terms.

## License

By contributing to Chrome Extension Toolkit, you agree that your contributions will be licensed under the MIT License.