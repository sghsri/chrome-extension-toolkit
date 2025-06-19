import { createShadowDOM } from 'src/dom';
import { chrome } from 'jest-chrome';

// Mock fetch globally
// @ts-ignore
global.fetch = jest.fn();

describe('DOM Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        
        // Mock chrome.runtime.getURL
        // @ts-ignore
        chrome.runtime.getURL.mockImplementation((path: string) => `chrome-extension://test-id/${path}`);
        
        // Mock fetch
        // @ts-ignore
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
            text: () => Promise.resolve('body { color: red; }')
        } as Response);
    });

    describe('createShadowDOM', () => {
        it('should create a shadow DOM element', () => {
            const shadowElement = createShadowDOM('test-shadow');
            
            expect(shadowElement).toBeDefined();
            expect(shadowElement.id).toBe('test-shadow');
            expect(shadowElement.tagName).toBe('DIV');
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
            // Mock document.querySelector to return null for html
            const originalQuerySelector = document.querySelector;
            document.querySelector = jest.fn().mockImplementation((selector) => {
                if (selector === 'html') {
                    return null;
                }
                return originalQuerySelector.call(document, selector);
            });
            
            expect(() => {
                createShadowDOM('test-shadow');
            }).toThrow('Could not find html element');
            
            // Restore original querySelector
            document.querySelector = originalQuerySelector;
        });

        it('should have addStyle method', () => {
            const shadowElement = createShadowDOM('test-shadow');
            
            expect(typeof shadowElement.addStyle).toBe('function');
        });

        describe('Multiple shadow DOMs', () => {
            it('should create multiple independent shadow DOMs', () => {
                const shadow1 = createShadowDOM('shadow-1');
                const shadow2 = createShadowDOM('shadow-2');
                
                expect(shadow1.id).toBe('shadow-1');
                expect(shadow2.id).toBe('shadow-2');
                expect(shadow1).not.toBe(shadow2);
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

        describe('Chrome Extension Integration', () => {
            it('should call chrome.runtime.getURL when adding styles', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                try {
                    await shadowElement.addStyle('styles/content.css');
                } catch (error) {
                    // Expected to fail due to shadowRoot being null in test environment
                    // But we can still verify the chrome API call was made
                }
                
                expect(chrome.runtime.getURL).toHaveBeenCalledWith('styles/content.css');
            });

            it('should fetch CSS content', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                try {
                    await shadowElement.addStyle('styles/content.css');
                } catch (error) {
                    // Expected to fail due to shadowRoot being null in test environment
                }
                
                expect(fetch).toHaveBeenCalledWith('chrome-extension://test-id/styles/content.css');
            });

            it('should handle fetch errors', async () => {
                const shadowElement = createShadowDOM('test-shadow');
                
                // @ts-ignore
                (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));
                
                await expect(shadowElement.addStyle('styles/nonexistent.css')).rejects.toThrow('Network error');
            });
        });

        describe('Browser Environment Checks', () => {
            it('should work in extension context', () => {
                // Test that the function can be called without throwing
                expect(() => {
                    createShadowDOM('env-test');
                }).not.toThrow();
            });

            it('should create elements with proper structure', () => {
                const shadowElement = createShadowDOM('structure-test');
                
                expect(shadowElement instanceof HTMLDivElement).toBe(true);
                expect(shadowElement.id).toBe('structure-test');
                expect(shadowElement.parentElement).toBe(document.documentElement);
            });
        });

        // Note: Full Shadow DOM functionality tests are skipped due to jsdom limitations
        // In a real browser environment, these would test:
        // - Shadow root creation and attachment
        // - Style isolation
        // - INJECTION_POINT creation and functionality
        // - Shadow DOM tree manipulation
        // These features are tested manually or in browser-based test environments
    });
});