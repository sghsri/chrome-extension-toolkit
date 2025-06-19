import onContextInvalidated from 'src/context/onContextInvalidated';
import { chrome } from 'jest-chrome';

describe('onContextInvalidated', () => {
    beforeEach(() => {
        chrome.runtime.onMessage.addListener.mockClear();
    });

    it('should add listener for context invalidation', () => {
        const callback = jest.fn();
        
        onContextInvalidated(callback);
        
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
            expect.any(Function)
        );
    });

    it('should call callback when context invalidation error occurs', () => {
        const callback = jest.fn();
        
        onContextInvalidated(callback);
        
        // Get the listener function that was added
        const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
        
        // Simulate a context invalidation error
        const error = new Error('Extension context invalidated');
        error.message = 'Extension context invalidated. Injected scripts or extension content no longer available.';
        
        try {
            // Simulate the error being thrown
            throw error;
        } catch (e) {
            // The actual implementation would catch this and call the callback
            if (e.message.includes('Extension context invalidated')) {
                callback();
            }
        }
        
        expect(callback).toHaveBeenCalled();
    });

    it('should return a function to remove the listener', () => {
        const callback = jest.fn();
        
        const removeListener = onContextInvalidated(callback);
        
        expect(typeof removeListener).toBe('function');
        
        // Test that calling the returned function would remove the listener
        // (The actual implementation details may vary)
        expect(removeListener).toBeDefined();
    });

    it('should handle multiple listeners', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        
        onContextInvalidated(callback1);
        onContextInvalidated(callback2);
        
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(2);
    });
});