import { JSON } from './Serialization';

/**
 * MessageDefinition is a record of message names and their data types.
 * The data type is the type of the first argument of the message handler.
 * The return type of the message handler is the resolved type of the promise returned by the message sender.
 */
export type MessageDefinition = Record<string, (data: Record<string, any> | undefined) => any>;

/**
 * The internal object representing a message sent between chrome extension contexts.
 */
export type Message<M extends MessageDefinition> = {
    name: keyof MessageDefinition;
    data: Parameters<M[keyof M]>[0];
    from: MessageEndpoint;
    to: MessageEndpoint;
};

/**
 * Represents the extension context in which a message is either sent or received.
 * The context is either the background script/service worker or a tab.
 */
export enum MessageEndpoint {
    BACKGROUND = 'BACKGROUND',
    TAB = 'TAB',
}

/**
 * An object that holds functions that handle messages sent to the current context.
 */
export type MessageHandler<M extends MessageDefinition> = {
    [K in keyof M]: (context: {
        data: JSON<Parameters<M[K]>[0]>;
        sender: chrome.runtime.MessageSender;
        sendResponse: (response: ReturnType<M[K]>) => void;
    }) => Promise<void> | void;
};
