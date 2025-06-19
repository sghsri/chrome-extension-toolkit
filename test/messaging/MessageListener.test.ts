import { MessageListener } from 'src/messaging/MessageListener';
import { chrome } from 'jest-chrome';
import { MessageEndpoint, Message } from 'src/types';
import getScriptType, { ScriptType } from 'src/getScriptType';

// Mock getScriptType
jest.mock('src/getScriptType');
const mockGetScriptType = getScriptType as jest.MockedFunction<typeof getScriptType>;

interface TestMessageSchema {
    getUserData: {
        request: { userId: string };
        response: { name: string; email: string };
    };
    updateSettings: {
        request: { theme: 'light' | 'dark' };
        response: void;
    };
}

describe('MessageListener', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        chrome.runtime.onMessage.addListener.mockClear();
        chrome.runtime.onMessage.removeListener.mockClear();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create a background listener', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            
            expect(listener).toBeDefined();
            expect(mockGetScriptType).toHaveBeenCalled();
        });

        it('should create a foreground listener', () => {
            mockGetScriptType.mockReturnValue(ScriptType.CONTENT_SCRIPT);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            
            expect(listener).toBeDefined();
        });

        it('should throw error when script type cannot be determined', () => {
            mockGetScriptType.mockReturnValue(null);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            expect(() => {
                new MessageListener<TestMessageSchema>(handlers);
            }).toThrow('[crx-kit]: Unable to determine extension script type.');
        });
    });

    describe('listen', () => {
        it('should start listening for messages', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen();

            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('MessageListener(background) listening for messages from foreground')
            );
        });

        it('should start listening with verbose logging', () => {
            mockGetScriptType.mockReturnValue(ScriptType.CONTENT_SCRIPT);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen({ verbose: true });

            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });
    });

    describe('unlisten', () => {
        it('should stop listening for messages', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen();
            listener.unlisten();

            expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('MessageListener(background) no longer listening for messages from foreground')
            );
        });
    });

    describe('message handling', () => {
        it('should handle valid messages in background script', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const getUserDataHandler = jest.fn();
            const handlers = {
                getUserData: getUserDataHandler,
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen();

            // Get the message handler
            const addListenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const messageHandler = addListenerCall[0];

            const message: Message<TestMessageSchema> = {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND,
            };

            const sender = { tab: { id: 123 } };
            const sendResponse = jest.fn();

            const result = messageHandler(message, sender, sendResponse);

            expect(getUserDataHandler).toHaveBeenCalledWith({
                data: { userId: '123' },
                sendResponse,
                sender,
            });
            expect(result).toBe(true);
        });

        it('should ignore messages not intended for current context', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const getUserDataHandler = jest.fn();
            const handlers = {
                getUserData: getUserDataHandler,
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen();

            const addListenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const messageHandler = addListenerCall[0];

            const message: Message<TestMessageSchema> = {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.BACKGROUND, // Wrong source
                to: MessageEndpoint.FOREGROUND,   // Wrong target
            };

            const result = messageHandler(message, {}, jest.fn());

            expect(getUserDataHandler).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should ignore messages without handlers', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const handlers = {
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen();

            const addListenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const messageHandler = addListenerCall[0];

            const message = {
                name: 'nonExistentMessage',
                data: {},
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND,
            };

            const result = messageHandler(message, {}, jest.fn());

            expect(result).toBe(true);
        });

        it('should handle errors in message handlers', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });

            const onError = jest.fn();

            const handlers = {
                getUserData: errorHandler,
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen({ onError });

            const addListenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const messageHandler = addListenerCall[0];

            const message: Message<TestMessageSchema> = {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND,
            };

            const result = messageHandler(message, {}, jest.fn());

            expect(errorHandler).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toBe(true);
        });

        it('should log verbose messages when enabled', () => {
            mockGetScriptType.mockReturnValue(ScriptType.BACKGROUND_SCRIPT);

            const handlers = {
                getUserData: jest.fn(),
                updateSettings: jest.fn(),
            };

            const listener = new MessageListener<TestMessageSchema>(handlers);
            listener.listen({ verbose: true });

            const addListenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const messageHandler = addListenerCall[0];

            const message: Message<TestMessageSchema> = {
                name: 'getUserData',
                data: { userId: '123' },
                from: MessageEndpoint.FOREGROUND,
                to: MessageEndpoint.BACKGROUND,
            };

            const sender = { tab: { id: 123 } };
            messageHandler(message, sender, jest.fn());

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[crx-kit]: message received: getUserData',
                expect.objectContaining({
                    name: 'getUserData',
                    data: { userId: '123' },
                    sender,
                })
            );
        });
    });
});