import { MessageDefinition, MessageEndpoint, Message, Serializable } from 'src/@types';

/**
 * An object that can be used to send messages to the background script.
 */
export type BackgroundMessenger<M extends MessageDefinition> = {
    [K in keyof M]: (...args: Parameters<M[K]>) => Promise<Serializable<ReturnType<M[K]>>>;
};

/**
 * A wrapper for chrome extension messaging with a type-safe API.
 * @returns A proxy object that can be used to send messages to the background script.
 */
export function createBackgroundMessenger<M extends MessageDefinition>(): BackgroundMessenger<M> {
    const sender = new Proxy({} as any, {
        get(target, prop) {
            const name = prop as string;
            return async (data: Parameters<M[keyof M]>[0]) =>
                new Promise((resolve, reject) => {
                    const message: Message<M> = {
                        name,
                        data: data as any,
                        from: MessageEndpoint.TAB,
                        to: MessageEndpoint.BACKGROUND,
                    };
                    chrome.runtime.sendMessage(message, (response: Serializable<ReturnType<M[keyof M]>>) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });
        },
    });
    return sender;
}

console.log('createBackgroundMessenger.ts loaded');
