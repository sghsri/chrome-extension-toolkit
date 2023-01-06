import { MessageDefinition } from 'src/@types';

type AddParameters<TFunction extends (...args: any) => any, TParameters extends [...args: any]> = (
    ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>;

/**
 *
 */
export type TabMessageSender<M extends MessageDefinition> = {
    [K in keyof M]: AddParameters<(...args: Parameters<M[K]>) => Promise<ReturnType<M[K]>>, [tabId: number]>;
};
