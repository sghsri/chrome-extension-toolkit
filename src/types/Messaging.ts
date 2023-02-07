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
    /** The background script or service worker. */
    BACKGROUND = 'BACKGROUND',
    /** A tab or extension page (popup, options, etc) */
    VIEW = 'VIEW',
}

/**
 * An object that implements the message handlers for each of the messages in the message definition.
 */
export type MessageHandler<M extends MessageDefinition> = {
    [K in keyof M]: (context: {
        /** The data sent with the message. */
        data: JSON<Parameters<M[K]>[0]>;
        /** The tab or page or background service worker that sent the message. */
        sender: chrome.runtime.MessageSender;
        /** A function that can be used to send a response asynchronously to the sender. */
        sendResponse: (response: ReturnType<M[K]>) => void;
    }) => Promise<void> | void;
};

/**
 * An object that can be used to handle messages coming from another extension context.
 */
export interface IMessageListener<M extends MessageDefinition> {
    /**
     * Starts listening for messages. When a message is received, the corresponding message handler is called.
     */
    listen: (handler: MessageHandler<M>) => void;
    /**
     * Stops listening for messages.
     */
    unlisten: () => void;
    /**
     * @returns A string representation of the message listener.
     */
    toString: () => string;
}
