import { MessageDefinition, MessageHandler } from './@types';
import { createBackgroundMessenger } from './messaging';

export * from './messaging';

export const myPackage = (taco = ''): string => `${taco} from my package`;



interface Test extends MessageDefinition {
    openNewTab: (data: { url: URL; }) => (URL | undefined)[];
}



const m = createBackgroundMessenger<Test>();

let x = await m.openNewTab({ url: new URL('https://google.com') });


const handler: MessageHandler<Test> = {
    openNewTab({ data, sendResponse, sender }) {
        sendResponse();
    },
};