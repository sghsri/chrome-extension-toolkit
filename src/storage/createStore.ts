import { DataAccessors, Defaults, DataChange, OnChangedFunction } from 'src/types/Storage';
import { capitalize } from 'src/utils/string';

/**
 * A virtual wrapper around the chrome.storage API that allows you to segment and compartmentalize your data.
 * The data is all stored at the top level of the storage area, so you should namespace your keys to avoid collisions.
 */
export type Store<T = {}> = DataAccessors<Defaults<T>> & {
    /**
     * Initializes the store by setting any keys that are not already set to their default values. This will be called automatically when you first access a getter or setter.
     */
    initialize(): Promise<void>;
    /**
     * Adds a listener that will be called whenever the value of the specified key changes.
     * @param key the key to observe
     * @param callback a function that will be called whenever the value of the specified key changes
     * @returns the listener function that was added
     */
    observe<K extends keyof T>(key: K, callback: OnChangedFunction<T[K]>): (changes, area) => void;

    /**
     * Removes a listener that was added with onChanged.
     * @param listener the listener function to remove
     */
    removeObserver(listener: (changes, area) => void): void;
    area: 'sync' | 'local' | 'session' | 'managed';
};

/**
 * A function that creates a virtual Store within the chrome.storage API.
 *
 * @param defaults the default values for the store (these will be used to initialize the store if the key is not already set, and will be used as the type for the getters and setters)
 * @param computed an optional function that allows you to override the generated getters and setters with your own. Provides a reference to the store itself so you can access this store's getters and setters.
 * @param area the storage area to use. Defaults to 'local'
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 */
export function createStore<T>(
    defaults: Defaults<T>,
    computed: (store: Store<T>) => Partial<DataAccessors<T>> = () => ({}),
    area: Store['area'] = 'local'
): Store<T> {
    const keys = Object.keys(defaults) as string[];

    const store = {
        area,
    } as Store<T>;

    let hasInitialized = false;
    store.initialize = async () => {
        const data = await chrome.storage[area].get(keys);
        const missingKeys = keys.filter(key => data[key] === undefined);

        if (missingKeys.length) {
            const defaultsToSet = missingKeys.reduce((acc, key) => {
                acc[key] = defaults[key];
                return acc;
            }, {});

            await chrome.storage[area].set(defaultsToSet);
        }
        hasInitialized = true;
    };

    keys.forEach(key => {
        const get = `get${capitalize(key)}`;
        const set = `set${capitalize(key)}`;

        store[get] = async () => {
            if (!hasInitialized) {
                await store.initialize();
            }
            return (await chrome.storage[area].get(key))[key];
        };

        store[set] = async (value: T[keyof T]) => {
            if (!hasInitialized) {
                await store.initialize();
            }
            await chrome.storage[area].set({ [key]: value });
        };
    });

    // override the generated getters and setters with the computed ones if they exist
    Object.assign(store, computed(store));

    store.observe = (key, callback) => {
        const listener = async (changes, areaName) => {
            if (areaName !== area) return;
            const change = changes[key as string];

            if (change) {
                callback(change as DataChange<any>);
            }
        };

        chrome.storage.onChanged.addListener(listener);
        return listener;
    };

    store.removeObserver = listener => {
        chrome.storage.onChanged.removeListener(listener);
    };

    return store;
}
