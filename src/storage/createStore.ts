import { DataAccessors, Defaults, DataChange, OnChangedFunction } from 'src/types/Storage';
import { capitalize } from 'src/utils/string';

/**
 * A virtual wrapper around the chrome.storage API that allows you to segment and compartmentalize your data.
 * The data is all stored at the top level of the storage area, so you should namespace your keys to avoid collisions.
 */
type Store<T = {}> = DataAccessors<Defaults<T>> & {
    /**
     * Initializes the store by setting any keys that are not already set to their default values. This will be called automatically when you first access a getter or setter.
     */
    initialize(): Promise<void>;
    /**
     *
     * @param key
     * @param callback
     */
    onChanged<K extends keyof T>(key: K, callback: OnChangedFunction<T[K]>): Promise<OnChangedFunction<T[K]>>;
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
    computed: (store: Store<T>) => Partial<DataAccessors<T>> = {} as any,
    area: 'sync' | 'local' | 'session' | 'managed' = 'local'
): Store<T> {
    const keys = Object.keys(defaults) as string[];

    const store = {} as Store<T>;

    let hasInitialized = false;

    keys.forEach(key => {
        const get = `get${capitalize(key)}`;
        const set = `set${capitalize(key)}`;

        store[get] = async () => {
            if (!hasInitialized) {
                await store.initialize();
            }
            return await chrome.storage[area].get(key)[key];
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

    store.onChanged = async (key, callback) => {
        if (!hasInitialized) {
            await store.initialize();
        }

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== area) return;

            const change = changes[key as string];

            if (change) {
                callback(change as DataChange<any>);
            }
        });
        return callback;
    };

    return store;
}

interface IUserStore {
    name: string;
    email: URL;
    isPremium?: boolean;
}

const defaults: Defaults<IUserStore> = {
    name: 'test',
    email: new URL('https://example.com'),
    isPremium: false,
};

const userStore = createStore(defaults, store => ({
    getEmail: async () => {
        const isPremium = await store.getIsPremium();
        const url = await store.getEmail();
        const data = '';
        return url;
    },
}));
