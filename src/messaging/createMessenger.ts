import { MessageEndpoint, Message, JSON, MessageData, MessageResponse } from 'src/types';
/**
 * An object that can be used to send messages to the background script.
 */
export type BackgroundMessenger<M> = {
    [K in keyof M]: (data: MessageData<M, K>) => Promise<JSON<MessageResponse<M, K>>>;
};

/**
 * an object that can be used to send messages to a tab OR extension pages (popup, options, etc.)
 */
export type TabMessenger<M> = {
    [K in keyof M]: (data: MessageData<M, K>, tabId: number) => Promise<JSON<MessageResponse<M, K>>>;
};

/**
 * A wrapper for chrome extension messaging with a type-safe API.
 * @type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the tabs and extension pages (popup, options, etc.)
 */
export function createMessenger<M>(type: 'tab'): TabMessenger<M>;
/**
 *  A wrapper for chrome extension messaging with a type-safe API.
 * @param type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the background script.
 */
export function createMessenger<M>(type: 'background'): BackgroundMessenger<M>;
/**
 *  A wrapper for chrome extension messaging with a type-safe API.
 * @param type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the background script.
 */
export function createMessenger<M>(type: 'background' | 'tab') {
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
            const name = prop as keyof M;
            return async (data: MessageData<M, any>, tabId?: number) =>
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
