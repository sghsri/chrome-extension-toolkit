import { MessageEndpoint, Message, Serializable, MessageData, MessageResponse } from 'src/types';
/**
 * An object that can be used to send messages to the background script.
 */
export type BackgroundMessenger<M> = {
    [K in keyof M]: MessageData<M, K> extends undefined
        ? () => Promise<Serializable<MessageResponse<M, K>>>
        : (data: MessageData<M, K>) => Promise<Serializable<MessageResponse<M, K>>>;
};

/**
 * an object that can be used to send messages to a tab OR extension pages (popup, options, etc.)
 */
export type TabMessenger<M> = {
    [K in keyof M]: MessageData<M, K> extends undefined
        ? (tab: number | 'ALL') => Promise<Serializable<MessageResponse<M, K>>>
        : (data: MessageData<M, K>, tab: number | 'ALL') => Promise<Serializable<MessageResponse<M, K>>>;
};

/**
 * A wrapper for chrome extension messaging with a type-safe API.
 * @type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the tabs and extension pages (popup, options, etc.)
 */
export function createMessenger<M>(destination: 'tab'): TabMessenger<M>;
/**
 *  A wrapper for chrome extension messaging with a type-safe API.
 * @param type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the background script.
 */
export function createMessenger<M>(destination: 'background'): BackgroundMessenger<M>;
/**
 *  A wrapper for chrome extension messaging with a type-safe API.
 * @param destination To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the background script.
 */
export function createMessenger<M>(destination: 'background' | 'tab') {
    let to: MessageEndpoint = MessageEndpoint.BACKGROUND;
    let from: MessageEndpoint = MessageEndpoint.VIEW;

    if (destination === 'tab') {
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

    async function sendTabMessageToAllTabs(message: Message<M>) {
        const tabs = (await chrome.tabs.query({})).filter(tab => tab.id !== undefined && tab.url);
        const promises: Promise<void>[] = [];
        tabs.forEach(tab =>
            promises.push(
                new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tab.id!, message, onMessageResponse(resolve, reject));
                })
            )
        );

        // and also send it using chrome.runtime.sendMessage for the extension popup or any extension page
        promises.push(
            new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(message, onMessageResponse(resolve, reject));
            })
        );

        return Promise.all(promises);
    }

    const sender = new Proxy({} as any, {
        get(target, prop) {
            const name = prop as keyof M;
            return async (data: MessageData<M, any>, dest?: number | 'ALL') =>
                new Promise((resolve, reject) => {
                    const message: Message<M> = {
                        name,
                        data,
                        from,
                        to,
                    };

                    if (to === MessageEndpoint.VIEW && dest) {
                        // for messages sent to the tabs, we want to send to the tabs using chrome.tabs.sendMessage,
                        if (typeof dest === 'number') {
                            return chrome.tabs.sendMessage(dest, message, onMessageResponse(resolve, reject));
                        }
                        if (dest === 'ALL') {
                            return sendTabMessageToAllTabs(message);
                        }
                    }
                    return chrome.runtime.sendMessage(message, onMessageResponse(resolve, reject));
                });
        },
    });
    return sender;
}
