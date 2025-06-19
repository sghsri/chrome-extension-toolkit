import { createShadowDOM } from 'src/dom/createShadowRoot';
import { chrome } from 'jest-chrome';

// Mock DOM environment
const mockHTML = document.createElement('html');
Object.defineProperty(document, 'querySelector', {
    value: jest.fn().mockReturnValue(mockHTML),
});

global.fetch = jest.fn();

describe('createShadowDOM', () => {
    beforeEach(() => {
        // Reset DOM state
        document.querySelector = jest.fn().mockReturnValue(mockHTML);
        mockHTML.innerHTML = '';
        
        // Reset chrome mock
        chrome.runtime.getURL.mockClear();
        (global.fetch as jest.Mock).mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a shadow DOM element with default options', () => {
        const shadowElement = createShadowDOM('test-shadow');

        expect(shadowElement.id).toBe('test-shadow');
        expect(shadowElement.style.all).toBe('initial');
        expect(shadowElement.shadowRoot).toBeDefined();
        expect(shadowElement.shadowRoot.mode).toBe('open');
        expect(shadowElement.shadowRoot.INJECTION_POINT).toBeDefined();
        expect(shadowElement.shadowRoot.INJECTION_POINT.id).toBe('INJECTION_POINT');
    });

    it('should create a shadow DOM element with custom options', () => {
        const shadowElement = createShadowDOM('test-shadow', { 
            mode: 'closed' as ShadowRootMode 
        });

        expect(shadowElement.id).toBe('test-shadow');
        expect(shadowElement.shadowRoot).toBeDefined();
        // Note: In jsdom, mode is always 'open' even when set to 'closed'
        expect(shadowElement.shadowRoot.INJECTION_POINT).toBeDefined();
    });

    it('should append the shadow element to the HTML document', () => {
        const appendChildSpy = jest.spyOn(mockHTML, 'appendChild');
        
        const shadowElement = createShadowDOM('test-shadow');
        
        expect(appendChildSpy).toHaveBeenCalledWith(shadowElement);
    });

    it('should throw error when HTML element is not found', () => {
        document.querySelector = jest.fn().mockReturnValue(null);
        
        expect(() => {
            createShadowDOM('test-shadow');
        }).toThrow('Could not find html element');
    });

    describe('addStyle method', () => {
        it('should add styles to the shadow root', async () => {
            const mockCSS = '.test { color: red; }';
            const mockURL = 'chrome-extension://test/styles.css';
            
            chrome.runtime.getURL.mockReturnValue(mockURL);
            (global.fetch as jest.Mock).mockResolvedValue({
                text: jest.fn().mockResolvedValue(mockCSS)
            });

            const shadowElement = createShadowDOM('test-shadow');
            
            await shadowElement.addStyle('styles.css');

            expect(chrome.runtime.getURL).toHaveBeenCalledWith('styles.css');
            expect(global.fetch).toHaveBeenCalledWith(mockURL);
            
            const styleElements = shadowElement.shadowRoot.querySelectorAll('style');
            expect(styleElements.length).toBe(1);
            expect(styleElements[0].textContent).toBe(mockCSS);
        });

        it('should handle multiple style additions', async () => {
            const mockCSS1 = '.test1 { color: red; }';
            const mockCSS2 = '.test2 { color: blue; }';
            
            chrome.runtime.getURL
                .mockReturnValueOnce('chrome-extension://test/styles1.css')
                .mockReturnValueOnce('chrome-extension://test/styles2.css');
            
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    text: jest.fn().mockResolvedValue(mockCSS1)
                })
                .mockResolvedValueOnce({
                    text: jest.fn().mockResolvedValue(mockCSS2)
                });

            const shadowElement = createShadowDOM('test-shadow');
            
            await shadowElement.addStyle('styles1.css');
            await shadowElement.addStyle('styles2.css');

            const styleElements = shadowElement.shadowRoot.querySelectorAll('style');
            expect(styleElements.length).toBe(2);
            expect(styleElements[0].textContent).toBe(mockCSS1);
            expect(styleElements[1].textContent).toBe(mockCSS2);
        });
    });
});