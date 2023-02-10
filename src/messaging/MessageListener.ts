import getScriptType, { ScriptType } from 'src/getScriptType';
import { MessageHandler, IMessageListener, MessageEndpoint, Message, JSON } from '../types';

/**
 * An object that can be used to listen for and handle messages coming from another extension context.
 */
export class MessageListener<M> implements IMessageListener<M> {
    private handlers: MessageHandler<M>;
    private scriptType: ScriptType;
    private myEndpoint: MessageEndpoint;
    private listeningFor: MessageEndpoint;

    private onError?: (error: Error) => void;

    /**
     * An object that can be used to listen for and handle messages coming from another extension context.
     * @param handlers the message handlers for the messages that this listener will handle. When a message is received, the corresponding message handler is called.
     * @param onError an optional error handler that will be called if an error occurs while handling a message. Useful if you want to log errors to a service like Sentry or Bugsnag.
     */
    constructor(handlers: MessageHandler<M>, onError?: (error: Error) => void) {
        this.handlers = handlers;
        this.onError = onError;

        // we want to know what type of script we are running in so we can determine what endpoint we are (background or tab)
        const scriptType = getScriptType();
        if (!scriptType) {
            throw new Error('Unable to determine extension script type.');
        }
        this.scriptType = scriptType;

        if (this.scriptType === ScriptType.BACKGROUND_SCRIPT) {
            this.myEndpoint = MessageEndpoint.BACKGROUND;
            this.listeningFor = MessageEndpoint.VIEW;
        } else {
            this.myEndpoint = MessageEndpoint.VIEW;
            this.listeningFor = MessageEndpoint.BACKGROUND;
        }
    }

    private handleMessage = (
        message: Message<M>,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: any) => void
    ): boolean => {
        if (message.to !== this.myEndpoint && message.from !== this.listeningFor) {
            // this message is not for my current context, so ignore it
            return true;
        }
        const messageName = message.name as string;

        const handler = this.handlers[messageName];
        if (!handler) {
            // this message is for my current context, but I don't have a handler for it, so ignore it
            console.error(`No handler for message ${messageName}`, message, sender);
            return true;
        }
        try {
            // this message is for my current context, and I have a handler for it, so handle it
            handler({
                data: message.data as JSON<typeof message.data>,
                sendResponse,
                sender,
            });
        } catch (error) {
            console.error(`Error handling message ${messageName}`, error, message, sender);
            if (this.onError) {
                this.onError(error);
            }
        }

        return true;
    };

    public listen() {
        console.log(`${this.toString()} listening for messages from ${this.listeningFor}`);
        chrome.runtime.onMessage.addListener(this.handleMessage);
    }

    public unlisten() {
        console.log(`${this.toString()} no longer listening for messages from ${this.listeningFor}`);
        chrome.runtime.onMessage.removeListener(this.handleMessage);
    }

    public toString() {
        return `MessageListener(${this.myEndpoint})`;
    }
}
