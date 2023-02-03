import { MessageHandler, PartialMessageHandler, MessageDefinition } from '../types';




export function createMessageHandler<M extends MessageDefinition>(handlers: MessageHandler<M>): MessageHandler<M> {
    return handlers;
}