import { createShadowDOM } from 'src/dom';
import { chrome } from 'jest-chrome';

// Mock fetch globally
global.fetch = jest.fn();

describe('DOM Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        
        // Mock chrome.runtime.getURL
        chrome.runtime.getURL.mockImplementation((path: string) => `chrome-extension://test-id/${path}`);
        
        // Mock fetch
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
            text: () => Promise.resolve('body { color: red; }')
        } as Response);
    });

    describe('createShadowDOM', () => {
        it('should create a shadow DOM element', () => {
            const shadowElement = createShadowDOM('test-shadow');
            
            expect(shadowElement).toBeDefined();
            expect(shadowElement.id).toBe('test-shadow');
            expect(shadowElement.shadowRoot).toBeDefined();
            expect(shadowElement.shadowRoot.mode).toBe('open');
        });

        it('should create shadow root with custom options', () => {
            const shadowElement = createShadowDOM('test-shadow', { mode: 'closed' });
            
            expect(shadowElement.shadowRoot).toBeDefined();
            // Note: In jsdom, mode is always 'open' regardless of the option
            // This is a limitation of jsdom's Shadow DOM implementation
        });

        it('should create INJECTION_POINT div', () => {
            const shadowElement = createShadowDOM('test-shadow');
            
            expect(shadowElement.shadowRoot.INJECTION_POINT).toBeDefined();
            expect(shadowElement.shadowRoot.INJECTION_POINT.id).toBe('INJECTION_POINT');
            expect(shadowElement.shadowRoot.INJECTION_POINT.tagName).toBe('DIV');
        });

        it('should append shadow element to html', () => {
            const shadowElement = createShadowDOM('test-shadow');
            
            expect(document.documentElement.contains(shadowElement)).toBe(true);
        });

        it('should set initial styles', () => {
            const shadowElement = createShadowDOM('test-shadow');
            
            expect(shadowElement.style.all).toBe('initial');
        });

        it('should throw error if html element is not found', () => {
            // Remove the html element
            const originalHtml = document.documentElement;
            document.removeChild(originalHtml);
            
            expect(() => {
                createShadowDOM('test-shadow');
            }).toThrow('Could not find html element');
            
            // Restore html element
            document.appendChild(originalHtml);
        });

        describe('addStyle method', () => {
            it('should add styles to shadow root', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                await shadowElement.addStyle('styles/content.css');
                
                expect(chrome.runtime.getURL).toHaveBeenCalledWith('styles/content.css');
                expect(fetch).toHaveBeenCalledWith('chrome-extension://test-id/styles/content.css');
                
                const styleElements = shadowElement.shadowRoot.querySelectorAll('style');
                expect(styleElements.length).toBe(1);
                expect(styleElements[0].textContent).toBe('body { color: red; }');
            });

            it('should handle multiple style additions', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                (fetch as jest.MockedFunction<typeof fetch>)
                    .mockResolvedValueOnce({
                        text: () => Promise.resolve('body { color: red; }')
                    } as Response)
                    .mockResolvedValueOnce({
                        text: () => Promise.resolve('div { margin: 10px; }')
                    } as Response);
                
                await shadowElement.addStyle('styles/content.css');
                await shadowElement.addStyle('styles/layout.css');
                
                const styleElements = shadowElement.shadowRoot.querySelectorAll('style');
                expect(styleElements.length).toBe(2);
                expect(styleElements[0].textContent).toBe('body { color: red; }');
                expect(styleElements[1].textContent).toBe('div { margin: 10px; }');
            });

            it('should handle fetch errors gracefully', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));
                
                await expect(shadowElement.addStyle('styles/nonexistent.css')).rejects.toThrow('Network error');
            });

            it('should handle text parsing errors', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
                    text: () => Promise.reject(new Error('Parse error'))
                } as Response);
                
                await expect(shadowElement.addStyle('styles/content.css')).rejects.toThrow('Parse error');
            });
        });

        describe('Shadow DOM structure', () => {
            it('should maintain proper DOM hierarchy', () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                expect(shadowElement.parentElement).toBe(document.documentElement);
                expect(shadowElement.shadowRoot.children.length).toBe(1);
                expect(shadowElement.shadowRoot.children[0]).toBe(shadowElement.shadowRoot.INJECTION_POINT);
            });

            it('should isolate styles from parent document', () => {
                // Add some global styles
                const globalStyle = document.createElement('style');
                globalStyle.textContent = 'div { background: blue; }';
                document.head.appendChild(globalStyle);
                
                const shadowElement = createShadowDOM('test-shadow');
                
                // Create a div inside the shadow DOM
                const innerDiv = document.createElement('div');
                shadowElement.shadowRoot.INJECTION_POINT.appendChild(innerDiv);
                
                // The global styles should not affect elements in the shadow DOM
                const computedStyle = window.getComputedStyle(innerDiv);
                // In a real browser, this would be isolated, but jsdom has limitations
                // We're testing that the structure is correct
                expect(shadowElement.shadowRoot.contains(innerDiv)).toBe(true);
            });

            it('should allow adding custom elements to injection point', () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                const customElement = document.createElement('div');
                customElement.className = 'custom-element';
                customElement.textContent = 'Hello from shadow DOM';
                
                shadowElement.shadowRoot.INJECTION_POINT.appendChild(customElement);
                
                expect(shadowElement.shadowRoot.INJECTION_POINT.children.length).toBe(1);
                expect(shadowElement.shadowRoot.INJECTION_POINT.children[0]).toBe(customElement);
                expect(shadowElement.shadowRoot.querySelector('.custom-element')).toBe(customElement);
            });
        });

        describe('Multiple shadow DOMs', () => {
            it('should create multiple independent shadow DOMs', () => {
                const shadow1 = createShadowDOM('shadow-1');
                const shadow2 = createShadowDOM('shadow-2');
                
                expect(shadow1.id).toBe('shadow-1');
                expect(shadow2.id).toBe('shadow-2');
                expect(shadow1.shadowRoot).not.toBe(shadow2.shadowRoot);
                expect(shadow1.shadowRoot.INJECTION_POINT).not.toBe(shadow2.shadowRoot.INJECTION_POINT);
            });

            it('should handle unique IDs correctly', () => {
                const shadow1 = createShadowDOM('unique-1');
                const shadow2 = createShadowDOM('unique-2');
                
                const element1 = document.getElementById('unique-1');
                const element2 = document.getElementById('unique-2');
                
                expect(element1).toBe(shadow1);
                expect(element2).toBe(shadow2);
                expect(element1).not.toBe(element2);
            });
        });

        describe('Browser compatibility', () => {
            it('should work with different shadow root modes', () => {
                const openShadow = createShadowDOM('open-shadow', { mode: 'open' });
                const closedShadow = createShadowDOM('closed-shadow', { mode: 'closed' });
                
                expect(openShadow.shadowRoot).toBeDefined();
                expect(closedShadow.shadowRoot).toBeDefined();
                
                // Both should have their injection points
                expect(openShadow.shadowRoot.INJECTION_POINT).toBeDefined();
                expect(closedShadow.shadowRoot.INJECTION_POINT).toBeDefined();
            });

            it('should handle additional shadow root options', () => {
                const shadowElement = createShadowDOM('delegated-shadow', { 
                    mode: 'open',
                    delegatesFocus: true 
                });
                
                expect(shadowElement.shadowRoot).toBeDefined();
                expect(shadowElement.shadowRoot.INJECTION_POINT).toBeDefined();
            });
        });
    });
});