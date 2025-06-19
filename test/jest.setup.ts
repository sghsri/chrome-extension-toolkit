// @ts-ignore
Object.assign(global, require('jest-chrome'));

// Polyfill for TextEncoder/TextDecoder (needed for Storage tests)
// @ts-ignore
const util = require('util');
// @ts-ignore
global.TextEncoder = util.TextEncoder;
// @ts-ignore
global.TextDecoder = util.TextDecoder;

// Polyfill for crypto (needed for Storage encryption tests)
// @ts-ignore
const crypto = require('crypto');
// @ts-ignore
global.crypto = crypto.webcrypto;

// Mock fetch for DOM tests
// @ts-ignore
global.fetch = jest.fn();

// Setup jsdom environment with proper React/JSX support
import '@testing-library/jest-dom';
