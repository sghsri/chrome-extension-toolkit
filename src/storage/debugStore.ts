import { Store } from './createStore';

/**
 * A global map of the storage keys to the name of the store that they are associated with
 */
export const KEYS_TO_STORE_MAP = new Map<string, string>();

/**
 * a helper function to debug the store in the console. Will only do anything when NODE_ENV is set to "development"
 * @param stores an object with the store name as the key and the store as the value
 */
export function debugStore(stores: { [name: string]: Store<any> }) {
    if (process.env.NODE_ENV === 'development') {
        const names = Object.keys(stores);
        for (const name of names) {
            const store = stores[name];
            globalThis[name] = store;

            const keys = store.keys();
            for (const key of keys) {
                KEYS_TO_STORE_MAP.set(key, name);
            }
        }
    }
}
