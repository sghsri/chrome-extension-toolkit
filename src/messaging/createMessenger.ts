import { MessageEndpoint, Message, MessageData, MessageResponse } from 'src/types';
/**
 * An object that can be used to send messages to the background script.
 */ export type BackgroundMessenger<M> = {
    [K in keyof M]: MessageData<M, K> extends undefined
        ? () => Promise<MessageResponse<M, K>>
        : (data: MessageData<M, K>) => Promise<MessageResponse<M, K>>;
};

/**
 * Where the foreground message is being sent to specifically (which tab or frame)
 */
type ForegroundMessageOptions =
    | {
          tabId: number;
          frameId?: number;
      }
    | {
          tabId: 'ALL';
      };

/**
 * an object that can be used to send messages to the foreground (tabs OR extension pages (popup, options, etc.))
 */
export type ForegroundMessenger<M> = {
    [K in keyof M]: (data: MessageData<M, K>, options: ForegroundMessageOptions) => Promise<MessageResponse<M, K>>;
};

/**
 * A wrapper for chrome extension messaging with a type-safe API.
 * @type To which context the messages are sent.
 * @returns A proxy object that can be used to send messages to the foreground (tabs or extension pages (popup, options, etc.))
 */
export function createMessenger<M>(destination: 'foreground'): ForegroundMessenger<M>;
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
export function createMessenger<M>(destination: 'background' | 'foreground') {
    let to: MessageEndpoint = MessageEndpoint.BACKGROUND;
    let from: MessageEndpoint = MessageEndpoint.FOREGROUND;

    if (destination === 'foreground') {
        to = MessageEndpoint.FOREGROUND;
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

        await Promise.all([
            ...tabs.map(tab => chrome.tabs.sendMessage(tab.id!, message)),
            chrome.runtime.sendMessage(message),
        ]);

        return Promise.all(promises);
    }

    const sender = new Proxy({} as any, {
        get(target, prop) {
            const name = prop as keyof M;
            return async (data: MessageData<M, any>, options?: ForegroundMessageOptions) =>
                new Promise<void>((resolve, reject) => {
                    const message: Message<M> = {
                        name,
                        data,
                        from,
                        to,
                    };

                    if (to === MessageEndpoint.FOREGROUND && options) {
                        // for messages sent to the tabs, we want to send to the tabs using chrome.tabs.sendMessage,
                        const { tabId } = options;
                        if (typeof tabId === 'number') {
                            return chrome.tabs
                                .sendMessage(tabId, message, { frameId: options.frameId })
                                .then(() => resolve());
                        }
                        if (tabId === 'ALL') {
                            return sendTabMessageToAllTabs(message).then(() => resolve());
                        }
                    }
                    return chrome.runtime.sendMessage(message, onMessageResponse(resolve, reject));
                });
        },
    });
    return sender;
}
