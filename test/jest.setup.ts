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

// Shadow DOM polyfill for jsdom
// @ts-ignore
if (!Element.prototype.attachShadow) {
    // @ts-ignore
    Element.prototype.attachShadow = function(options) {
        const shadowRoot = document.createElement('div');
        // @ts-ignore
        shadowRoot.mode = options.mode || 'open';
        // @ts-ignore
        shadowRoot.host = this;
        // @ts-ignore
        shadowRoot.appendChild = HTMLElement.prototype.appendChild.bind(shadowRoot);
        // @ts-ignore
        shadowRoot.querySelectorAll = HTMLElement.prototype.querySelectorAll.bind(shadowRoot);
        // @ts-ignore
        shadowRoot.querySelector = HTMLElement.prototype.querySelector.bind(shadowRoot);
        // @ts-ignore
        shadowRoot.contains = HTMLElement.prototype.contains.bind(shadowRoot);
        // @ts-ignore
        this.shadowRoot = shadowRoot;
        return shadowRoot;
    };
}

// Fix jest-chrome mocking issues
// @ts-ignore
beforeEach(() => {
    // Fix chrome storage mocking
    // @ts-ignore
    chrome.storage.local.get = jest.fn().mockResolvedValue({});
    // @ts-ignore
    chrome.storage.local.set = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    chrome.storage.local.remove = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    chrome.storage.sync.get = jest.fn().mockResolvedValue({});
    // @ts-ignore
    chrome.storage.sync.set = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    chrome.storage.sync.remove = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    chrome.storage.managed.get = jest.fn().mockResolvedValue({});
    
    // Add session storage (not in jest-chrome by default)
    // @ts-ignore
    chrome.storage.session = {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined)
    };
    
    // Fix chrome messaging mocking
    // @ts-ignore
    chrome.runtime.onMessage.addListener = jest.fn();
    // @ts-ignore
    chrome.runtime.onMessage.removeListener = jest.fn();
    // @ts-ignore
    chrome.runtime.sendMessage = jest.fn().mockResolvedValue(undefined);
    
    // Fix chrome storage change listener
    // @ts-ignore
    chrome.storage.onChanged.addListener = jest.fn();
    // @ts-ignore
    chrome.storage.onChanged.removeListener = jest.fn();
    
    // Fix chrome tabs mocking
    // @ts-ignore
    chrome.tabs.query = jest.fn().mockResolvedValue([]);
    // @ts-ignore
    chrome.tabs.sendMessage = jest.fn().mockResolvedValue(undefined);
});

// Setup jsdom environment with proper React/JSX support
import '@testing-library/jest-dom';
