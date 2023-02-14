import { DataAccessors, Defaults, DataChange, OnChangedFunction } from 'src/types/Storage';
import { Security } from 'src/storage/Security';
import { capitalize } from 'src/utils/string';

/**
 * A virtual wrapper around the chrome.storage API that allows you to segment and compartmentalize your data.
 * The data is all stored at the top level of the storage area, so you should namespace your keys to avoid collisions.
 */
export type Store<T = {}, C = {}> = DataAccessors<Defaults<T>> &
    C & {
        /**
         * The options that were passed to the createStore function
         */
        options: StoreOptions;
        /**
         * Initializes the store by setting any keys that are not already set to their default values. This will be called automatically when you first access a getter or setter.
         */
        initialize(): Promise<void>;

        /**
         * A function that allows you to add properties to the store. This is useful if you want to add computed properties based on the store's data.
         */
        modify<C>(overrides: C): Store<T, C>;

        /**
         * Returns a promise that resolves to the entire contents of the store.
         */
        all(): Promise<T>;

        /**
         * Returns an array of all the keys in the store.
         */
        keys(): string[];

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
    };

/**
 * Options that modify the behavior of the store
 */
type StoreOptions = {
    /**
     * Which chrome.storage area to use. Defaults to 'local'
     */
    area?: 'sync' | 'local' | 'session' | 'managed';
    /**
     * Whether or not to encrypt the data before storing it, and decrypt it when retrieving it. Defaults to false.
     */
    isEncrypted?: boolean;
};

const security = new Security();

/**
 * A function that creates a virtual Store within the chrome.storage API.
 *
 * @param defaults the default values for the store (these will be used to initialize the store if the key is not already set, and will be used as the type for the getters and setters)
 * @param computed an optional function that allows you to override the generated getters and setters with your own. Provides a reference to the store itself so you can access this store's getters and setters.
 * @param area the storage area to use. Defaults to 'local'
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 */
export function createStore<T>(defaults: Defaults<T>, options?: StoreOptions): Store<T> {
    const keys = Object.keys(defaults) as string[];

    let area = options?.area || 'local';
    let isEncrypted = options?.isEncrypted || false;

    if (isEncrypted && !process.env.EXTENSION_STORAGE_PASSWORD) {
        throw new Error(Security.MISSING_PASSWORD_ERROR_MESSAGE);
    }

    const store = {
        options,
    } as Store<T>;

    let hasInitialized = false;
    store.initialize = async () => {
        const data = await chrome.storage[area].get(keys);
        const missingKeys = keys.filter(key => data[key] === undefined);

        if (missingKeys.length) {
            const defaultsToSet = {};

            for (const key of missingKeys) {
                // eslint-disable-next-line no-await-in-loop
                defaultsToSet[key] = isEncrypted ? await security.encrypt(defaults[key]) : defaults[key];
            }

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
            const value = (await chrome.storage[area].get(key))[key];
            return isEncrypted ? await security.decrypt(value) : value;
        };

        store[set] = async (value: T[keyof T]) => {
            if (!hasInitialized) {
                await store.initialize();
            }

            await chrome.storage[area].set({
                [key]: isEncrypted ? await security.encrypt(value) : value,
            });
        };
    });

    store.modify = computed => Object.assign(store, computed);

    store.all = async () => {
        if (!hasInitialized) {
            await store.initialize();
        }
        const fullStore = await chrome.storage[area].get(keys);
        if (isEncrypted) {
            Object.keys(fullStore).forEach(async key => {
                fullStore[key] = await security.decrypt(fullStore[key]);
            });
        }
        return fullStore as T;
    };

    store.keys = () => keys;

    store.observe = (key, callback) => {
        const listener = async (changes, areaName) => {
            if (areaName !== area) return;
            if (!(key in changes)) return;

            if (!isEncrypted) {
                callback({
                    oldValue: changes[key].oldValue,
                    newValue: changes[key].newValue,
                });
                return;
            }

            const [oldValue, newValue] = await Promise.all([
                security.decrypt(changes[key].oldValue),
                security.decrypt(changes[key].newValue),
            ]);

            callback({
                oldValue,
                newValue,
            });
        };

        chrome.storage.onChanged.addListener(listener);
        return listener;
    };

    store.removeObserver = listener => {
        chrome.storage.onChanged.removeListener(listener);
    };

    return store;
}
