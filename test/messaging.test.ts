import { createMessenger, MessageListener, createUseMessage } from 'src/messaging';
import { MessageEndpoint } from 'src/types';
import { chrome } from 'jest-chrome';
import TestData from 'test/TestData';
import { renderHook, act } from '@testing-library/react';
// Import getScriptType directly for mocking
import getScriptType, { ScriptType } from 'src/getScriptType';

// Mock getScriptType module
jest.mock('src/getScriptType');
const mockGetScriptType = getScriptType as jest.MockedFunction<typeof getScriptType>;

// Correct message type definitions as functions
interface TestMessages {
    getUserData: (data: { userId: string }) => { name: string; email: string };
    updateSettings: (data: { theme: 'light' | 'dark' }) => void;
    broadcastNotification: (data: { message: string }) => void;
    noDataMessage: (data: undefined) => { success: boolean };
}

// Helper function to create complete message handlers for tests
const createTestHandlers = (overrides: Partial<any> = {}) => ({
    getUserData: jest.fn(),
    updateSettings: jest.fn(),
    broadcastNotification: jest.fn(),
    noDataMessage: jest.fn(),
    ...overrides
});

describe('Messaging Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        chrome.runtime.getManifest.mockReturnValue(TestData.manifest);
        // @ts-ignore
        chrome.runtime.id = TestData.extensionId;
        // Mock getScriptType to return content script by default
        mockGetScriptType.mockReturnValue(ScriptType.CONTENT_SCRIPT);
    });

    describe('createMessenger', () => {
        describe('background messenger', () => {
            it('should create a background messenger', () => {
                const messenger = createMessenger<TestMessages>('background');
                expect(messenger).toBeDefined();
                expect(typeof messenger.getUserData).toBe('function');
                expect(typeof messenger.updateSettings).toBe('function');
            });

            it('should send messages to background script', async () => {
                const messenger = createMessenger<TestMessages>('background');
                const mockResponse = { name: 'John Doe', email: 'john@example.com' };
                
                // @ts-ignore
                chrome.runtime.sendMessage.mockResolvedValue(mockResponse);

                const result = await messenger.getUserData({ userId: '123' });

                expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                    name: 'getUserData',
                    data: { userId: '123' },
                    from: MessageEndpoint.FOREGROUND,
                    to: MessageEndpoint.BACKGROUND,
                });
                expect(result).toEqual(mockResponse);
            });

            it('should handle messages with no data', async () => {
                const messenger = createMessenger<TestMessages>('background');
                const mockResponse = { success: true };
                
                // @ts-ignore
                chrome.runtime.sendMessage.mockResolvedValue(mockResponse);

                const result = await messenger.noDataMessage();

                expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                    name: 'noDataMessage',
                    data: undefined,
                    from: MessageEndpoint.FOREGROUND,
                    to: MessageEndpoint.BACKGROUND,
                });
                expect(result).toEqual(mockResponse);
            });

            it('should handle void responses', async () => {
                const messenger = createMessenger<TestMessages>('background');
                
                // @ts-ignore
                chrome.runtime.sendMessage.mockResolvedValue(undefined);

                const result = await messenger.updateSettings({ theme: 'dark' });

                expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                    name: 'updateSettings',
                    data: { theme: 'dark' },
                    from: MessageEndpoint.FOREGROUND,
                    to: MessageEndpoint.BACKGROUND,
                });
                expect(result).toBeUndefined();
            });
        });

        describe('foreground messenger', () => {
            it('should create a foreground messenger', () => {
                const messenger = createMessenger<TestMessages>('foreground');
                expect(messenger).toBeDefined();
                expect(typeof messenger.getUserData).toBe('function');
            });

            it('should send messages to specific tab', async () => {
                const messenger = createMessenger<TestMessages>('foreground');
                const mockResponse = { name: 'John Doe', email: 'john@example.com' };
                
                // @ts-ignore
                chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

                const result = await messenger.getUserData(
                    { userId: '123' }, 
                    { tabId: 456 }
                );

                expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(456, {
                    name: 'getUserData',
                    data: { userId: '123' },
                    from: MessageEndpoint.BACKGROUND,
                    to: MessageEndpoint.FOREGROUND,
                }, { frameId: undefined });
                expect(result).toEqual(mockResponse);
            });

            it('should send messages to specific tab and frame', async () => {
                const messenger = createMessenger<TestMessages>('foreground');
                const mockResponse = { name: 'John Doe', email: 'john@example.com' };
                
                // @ts-ignore
                chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

                const result = await messenger.getUserData(
                    { userId: '123' }, 
                    { tabId: 456, frameId: 789 }
                );

                expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(456, {
                    name: 'getUserData',
                    data: { userId: '123' },
                    from: MessageEndpoint.BACKGROUND,
                    to: MessageEndpoint.FOREGROUND,
                }, { frameId: 789 });
                expect(result).toEqual(mockResponse);
            });

            it('should send messages to active tab', async () => {
                const messenger = createMessenger<TestMessages>('foreground');
                const mockResponse = { name: 'John Doe', email: 'john@example.com' };
                const mockTab = { 
                    id: 123, 
                    active: true,
                    index: 0,
                    pinned: false,
                    highlighted: false,
                    windowId: 1,
                    incognito: false,
                    selected: false,
                    discarded: false,
                    autoDiscardable: true,
                    url: 'https://example.com'
                } as chrome.tabs.Tab;
                
                // @ts-ignore
                chrome.tabs.query.mockResolvedValue([mockTab]);
                // @ts-ignore
                chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

                const result = await messenger.getUserData(
                    { userId: '123' }, 
                    { tabId: 'ACTIVE_TAB' }
                );

                expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
                expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
                    name: 'getUserData',
                    data: { userId: '123' },
                    from: MessageEndpoint.BACKGROUND,
                    to: MessageEndpoint.FOREGROUND,
                });
                expect(result).toEqual(mockResponse);
            });

            it('should handle active tab when no tab is found', async () => {
                const messenger = createMessenger<TestMessages>('foreground');
                
                // @ts-ignore
                chrome.tabs.query.mockResolvedValue([]);

                const result = await messenger.getUserData(
                    { userId: '123' }, 
                    { tabId: 'ACTIVE_TAB' }
                );

                expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
                expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
                expect(result).toBeUndefined();
            });

            it('should send messages to all tabs', async () => {
                const messenger = createMessenger<TestMessages>('foreground');
                const mockTabs = [
                    { 
                        id: 123, 
                        url: 'https://example.com',
                        index: 0,
                        pinned: false,
                        highlighted: false,
                        windowId: 1,
                        incognito: false,
                        selected: false,
                        discarded: false,
                        autoDiscardable: true,
                        active: false
                    } as chrome.tabs.Tab,
                    { 
                        id: 456, 
                        url: 'https://google.com',
                        index: 1,
                        pinned: false,
                        highlighted: false,
                        windowId: 1,
                        incognito: false,
                        selected: false,
                        discarded: false,
                        autoDiscardable: true,
                        active: false
                    } as chrome.tabs.Tab
                ];
                const mockResponse = { name: 'John Doe', email: 'john@example.com' };
                
                // @ts-ignore
                chrome.tabs.query.mockResolvedValue(mockTabs);
                // @ts-ignore
                chrome.tabs.sendMessage.mockResolvedValue(mockResponse);
                // @ts-ignore
                chrome.runtime.sendMessage.mockResolvedValue(mockResponse);
                
                // Mock Promise.any to return the first resolved promise
                jest.spyOn(Promise, 'any').mockResolvedValue(mockResponse);

                const result = await messenger.getUserData(
                    { userId: '123' }, 
                    { tabId: 'ALL' }
                );

                expect(chrome.tabs.query).toHaveBeenCalledWith({});
                expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
                expect(chrome.runtime.sendMessage).toHaveBeenCalled();
                expect(result).toEqual(mockResponse);

                jest.restoreAllMocks();
            });
        });
    });

    describe('MessageListener', () => {
        it('should create a message listener with handlers', () => {
            const handlers = createTestHandlers();
            
            const listener = new MessageListener<TestMessages>(handlers);
            expect(listener).toBeDefined();
        });

        it('should throw error if not in extension context', () => {
            // Mock getScriptType to return null (not in extension)
            mockGetScriptType.mockReturnValue(null);
            
            expect(() => {
                new MessageListener<TestMessages>(createTestHandlers());
            }).toThrow('[crx-kit]: Unable to determine extension script type.');
            
            // Reset mock
            mockGetScriptType.mockReturnValue(ScriptType.CONTENT_SCRIPT);
        });

        it('should start listening to messages', () => {
            const handlers = createTestHandlers();
            
            const listener = new MessageListener<TestMessages>(handlers);
            listener.listen();

            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        it('should stop listening to messages', () => {
            const handlers = createTestHandlers();
            
            const listener = new MessageListener<TestMessages>(handlers);
            listener.listen();
            listener.unlisten();

            expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
        });

        it('should handle incoming messages with correct handler', () => {
            const handler = jest.fn();
            const handlers = createTestHandlers({ getUserData: handler });
            
            const listener = new MessageListener<TestMessages>(handlers);
            listener.listen();

            // Get the message handler that was registered
            const addListenerCalls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
            const messageHandler = addListenerCalls[0][0];
            
            const message = {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.BACKGROUND,
                to: MessageEndpoint.FOREGROUND,
            };

            const mockSender = { id: 'test-extension' };
            const mockSendResponse = jest.fn();

            const result = messageHandler(message, mockSender, mockSendResponse);

            expect(handler).toHaveBeenCalledWith({
                data: { userId: '123' },
                sendResponse: mockSendResponse,
                sender: mockSender
            });
            expect(result).toBe(true);
        });

        it('should ignore messages not for this endpoint', () => {
            const handler = jest.fn();
            const handlers = createTestHandlers({ getUserData: handler });
            
            const listener = new MessageListener<TestMessages>(handlers);
            listener.listen();

            const addListenerCalls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
            const messageHandler = addListenerCalls[0][0];
            
            const message = {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND, // Wrong destination for content script
            };

            const result = messageHandler(message, {}, jest.fn());

            expect(handler).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should ignore messages with no handler', () => {
            const handlers = createTestHandlers();
            
            const listener = new MessageListener<TestMessages>(handlers);
            listener.listen();

            const addListenerCalls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
            const messageHandler = addListenerCalls[0][0];
            
            const message = {
                name: 'unknownMessage',
                data: {},
                from: MessageEndpoint.BACKGROUND,
                to: MessageEndpoint.FOREGROUND,
            };

            const result = messageHandler(message, {}, jest.fn());

            expect(result).toBe(true);
        });
    });

    describe('createUseMessage', () => {
        it('should create a useMessage hook', () => {
            const useMessage = createUseMessage<TestMessages>();
            expect(useMessage).toBeDefined();
            expect(typeof useMessage).toBe('function');
        });

        it('should set up message listener for specific message', () => {
            const useMessage = createUseMessage<TestMessages>();
            const callback = jest.fn();
            
            renderHook(() => useMessage('getUserData', callback));
            
            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        it('should call callback when matching message is received', () => {
            const useMessage = createUseMessage<TestMessages>();
            const callback = jest.fn();
            
            renderHook(() => useMessage('getUserData', callback));
            
            // Get the message handler that was registered
            const addListenerCalls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
            const messageHandler = addListenerCalls[0][0];
            
            const message = {
                name: 'getUserData',
                data: { userId: '123' }
            };

            messageHandler(message);

            expect(callback).toHaveBeenCalledWith({ userId: '123' });
        });

        it('should ignore non-matching messages', () => {
            const useMessage = createUseMessage<TestMessages>();
            const callback = jest.fn();
            
            renderHook(() => useMessage('getUserData', callback));
            
            const addListenerCalls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
            const messageHandler = addListenerCalls[0][0];
            
            const message = {
                name: 'updateSettings',
                data: { theme: 'dark' }
            };

            messageHandler(message);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should clean up listener on unmount', () => {
            const useMessage = createUseMessage<TestMessages>();
            const callback = jest.fn();
            
            const { unmount } = renderHook(() => useMessage('getUserData', callback));
            
            unmount();

            expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
        });
    });
});