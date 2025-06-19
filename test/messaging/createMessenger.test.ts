import { createMessenger } from 'src/messaging/createMessenger';
import { chrome } from 'jest-chrome';
import { MessageEndpoint } from 'src/types';

interface TestMessageSchema {
    getUserData: {
        request: { userId: string };
        response: { name: string; email: string };
    };
    updateSettings: {
        request: { theme: 'light' | 'dark' };
        response: void;
    };
    ping: {
        request: undefined;
        response: string;
    };
}

describe('createMessenger', () => {
    beforeEach(() => {
        chrome.runtime.sendMessage.mockClear();
        chrome.tabs.sendMessage.mockClear();
        chrome.tabs.query.mockClear();
    });

    describe('background messenger', () => {
        it('should create a background messenger', () => {
            const messenger = createMessenger<TestMessageSchema>('background');
            
            expect(messenger).toBeDefined();
            expect(typeof messenger.getUserData).toBe('function');
            expect(typeof messenger.updateSettings).toBe('function');
            expect(typeof messenger.ping).toBe('function');
        });

        it('should send message to background script', async () => {
            const mockResponse = { name: 'John', email: 'john@example.com' };
            chrome.runtime.sendMessage.mockResolvedValue(mockResponse);

            const messenger = createMessenger<TestMessageSchema>('background');
            
            const result = await messenger.getUserData({ userId: '123' });

            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND,
            });
            expect(result).toEqual(mockResponse);
        });

        it('should handle messages without data', async () => {
            const mockResponse = 'pong';
            chrome.runtime.sendMessage.mockResolvedValue(mockResponse);

            const messenger = createMessenger<TestMessageSchema>('background');
            
            const result = await messenger.ping();

            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                name: 'ping',
                data: undefined,
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND,
            });
            expect(result).toBe(mockResponse);
        });
    });

    describe('foreground messenger', () => {
        it('should create a foreground messenger', () => {
            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            expect(messenger).toBeDefined();
            expect(typeof messenger.getUserData).toBe('function');
            expect(typeof messenger.updateSettings).toBe('function');
            expect(typeof messenger.ping).toBe('function');
        });

        it('should send message to specific tab', async () => {
            const mockResponse = { name: 'John', email: 'john@example.com' };
            chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            const result = await messenger.getUserData({ userId: '123' }, { tabId: 456 });

            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(456, {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.BACKGROUND,
                to: MessageEndpoint.FOREGROUND,
            }, { frameId: undefined });
            expect(result).toEqual(mockResponse);
        });

        it('should send message to specific tab with frame ID', async () => {
            const mockResponse = { name: 'John', email: 'john@example.com' };
            chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            const result = await messenger.getUserData({ userId: '123' }, { tabId: 456, frameId: 789 });

            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(456, {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.BACKGROUND,
                to: MessageEndpoint.FOREGROUND,
            }, { frameId: 789 });
            expect(result).toEqual(mockResponse);
        });

        it('should send message to active tab', async () => {
            const mockTab = { id: 123, url: 'https://example.com' };
            chrome.tabs.query.mockResolvedValue([mockTab]);
            chrome.tabs.sendMessage.mockResolvedValue('success');

            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            const result = await messenger.updateSettings({ theme: 'dark' }, { tabId: 'ACTIVE_TAB' });

            expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
                name: 'updateSettings',
                data: { theme: 'dark' },
                from: MessageEndpoint.BACKGROUND,
                to: MessageEndpoint.FOREGROUND,
            });
            expect(result).toBe('success');
        });

        it('should handle case when no active tab found', async () => {
            chrome.tabs.query.mockResolvedValue([]);

            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            const result = await messenger.updateSettings({ theme: 'dark' }, { tabId: 'ACTIVE_TAB' });

            expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
            expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        it('should send message to all tabs', async () => {
            const mockTabs = [
                { id: 123, url: 'https://example.com' },
                { id: 456, url: 'https://test.com' }
            ];
            chrome.tabs.query.mockResolvedValue(mockTabs);
            chrome.tabs.sendMessage.mockResolvedValue('success');
            chrome.runtime.sendMessage.mockResolvedValue('runtime-success');

            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            await messenger.updateSettings({ theme: 'dark' }, { tabId: 'ALL' });

            expect(chrome.tabs.query).toHaveBeenCalledWith({});
            expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
            expect(chrome.runtime.sendMessage).toHaveBeenCalled();
        });

        it('should fallback to runtime.sendMessage when no options provided', async () => {
            chrome.runtime.sendMessage.mockResolvedValue('success');

            const messenger = createMessenger<TestMessageSchema>('foreground');
            
            // @ts-ignore - testing the case where options is undefined
            const result = await messenger.updateSettings({ theme: 'dark' });

            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                name: 'updateSettings',
                data: { theme: 'dark' },
                from: MessageEndpoint.BACKGROUND,
                to: MessageEndpoint.FOREGROUND,
            });
            expect(result).toBe('success');
        });
    });
});