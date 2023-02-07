import { MessageDefinition, MessageEndpoint, Message, JSON, AddParameters } from 'src/types';
/**
 * An object that can be used to send messages to the background script.
 */
export type BackgroundMessenger<M extends MessageDefinition> = {
    [K in keyof M]: (...args: Parameters<M[K]>) => Promise<JSON<ReturnType<M[K]>>>;
};

/**
 * an object that can be used to send messages to a tab OR extension pages (popup, options, etc.)
 */
export type TabMessenger<M extends MessageDefinition> = {
    [K in keyof M]: AddParameters<(...args: Parameters<M[K]>) => Promise<ReturnType<M[K]>>, [tabId: number]>;
};

/**
 * A wrapper for chrome extension messaging with a type-safe API.
 * @type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the tabs and extension pages (popup, options, etc.)
 */
function createMessenger<M extends MessageDefinition>(type: 'tab'): TabMessenger<M>;
/**
 *  A wrapper for chrome extension messaging with a type-safe API.
 * @param type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the background script.
 */
function createMessenger<M extends MessageDefinition>(type: 'background'): BackgroundMessenger<M>;
/**
 *  A wrapper for chrome extension messaging with a type-safe API.
 * @param type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the background script.
 */
function createMessenger<M extends MessageDefinition>(type: 'background' | 'tab') {
    let to: MessageEndpoint = MessageEndpoint.BACKGROUND;
    let from: MessageEndpoint = MessageEndpoint.VIEW;

    if (type === 'tab') {
        to = MessageEndpoint.VIEW;
        from = MessageEndpoint.BACKGROUND;
    }

    function onMessageResponse(resolve: (response: any) => void, reject: (error: any) => void) {
        return (response: any) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        };
    }

    const sender = new Proxy({} as any, {
        get(target, prop) {
            const name = prop as string;
            return async (data: Parameters<M[keyof M]>[0], tabId?: number) =>
                new Promise((resolve, reject) => {
                    const message: Message<M> = {
                        name,
                        data,
                        from,
                        to,
                    };

                    if (to === MessageEndpoint.VIEW && tabId) {
                        // for messages sent to the views, we want to send to the tabs using chrome.tabs.sendMessage, and also send it using chrome.runtime.sendMessage for the extension popup or any extension page
                        chrome.tabs.sendMessage(tabId, message, onMessageResponse(resolve, reject));
                    }
                    chrome.runtime.sendMessage(message, onMessageResponse(resolve, reject));
                });
        },
    });
    return sender;
}

export default createMessenger;
