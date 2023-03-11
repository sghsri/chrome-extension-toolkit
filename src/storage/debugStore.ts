import { Store } from './createStore';

export const KEY_TO_STORE_MAP = new Map<string, Store>();

/**
 * a helper function to debug the store in the console. Will only do anything when NODE_ENV is set to "development"
 * @param stores an object with the store name as the key and the store as the value
 */
export function debugStore(stores: { [name: string]: Store }) {
    if (process.env.NODE_ENV === 'development') {
        const names = Object.keys(stores);
        for (const name of names) {
            globalThis[name] = stores[name];
            KEY_TO_STORE_MAP.set(name, stores[name]);
        }
    }
}
