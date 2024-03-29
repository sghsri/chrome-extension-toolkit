import { Security } from 'src/storage/Security';
import { useEffect, useState } from 'react';
import { Serializable } from '..';

/** A utility type that forces you to declare all the values specified in the type interface for a module. */
export type StoreDefaults<T> = {
    [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
};

/**
 * Represents a change in data within the store.
 */
export type DataChange<T> = {
    /**
     * The old value of the data. This will be undefined if the data was just initialized.
     */
    oldValue?: Serializable<T>;
    /**
     * The new value of the data.
     */
    newValue: Serializable<T>;
};

/**
 * A function that is called when the data in the store changes.
 */
export type OnChangedFunction<T> = (changes: DataChange<T>) => void;

/**
 * A virtual wrapper around the chrome.storage API that allows you to segment and compartmentalize your data.
 * The data is all stored at the top level of the storage area, so you should namespace your keys to avoid collisions.
 */
export type Store<T = {}> = {
    /**
     * A unique identifier for the store. This is for debugging purposes only.
     */
    id: string;
    /**
     * The options that were passed to the createStore function
     */
    options: StoreOptions;
    /**
     * Initializes the store by setting any keys that are not already set to their default values. This will be called automatically when you first access a getter or setter.
     */
    initialize(): Promise<void>;

    /**
     * Gets the value of the specified key from the store.
     * @param key the key to get the value of
     * @returns a promise that resolves to the value of the specified key (wrapped in a Serialized type)
     */
    get<K extends keyof T>(key: K): Promise<Serializable<T[K]>>;

    /**
     * Sets the value of the specified key in the store.
     * @param key the key to set the value of
     * @param value the value to set the key to
     */
    set<K extends keyof T>(key: K, value: Serializable<T[K]>): Promise<void>;
    set<K extends keyof T>(values: Partial<Serializable<T>>): Promise<void>;

    /**
     * Returns a promise that resolves to the entire contents of the store.
     */
    all(): Promise<Serializable<T>>;

    /**
     * Returns an array of all the keys in the store.
     */
    keys(): (keyof T & string)[];

    /**
     * A react hook that allows you to get and set the value of the specified key in the store from a functional component.
     * @param key the key to get the value of
     * @param defaultValue an optional default value to use if the key is not already set
     * @returns a tuple containing the value of the specified key, and a function to set the value
     */
    use<K extends keyof T, D extends Serializable<T[K]> | undefined = undefined>(
        key: K,
        defaultValue?: D
    ): [
        D extends Serializable<T[K]> ? Serializable<T[K]> : Serializable<T[K]> | undefined,
        (value: Serializable<T[K]>) => Promise<void>
    ];

    /**
     * Adds a listener that will be called whenever the value of the specified key changes.
     * @param key the key to observe
     * @param callback a function that will be called whenever the value of the specified key changes
     * @returns the listener function that was added
     */
    listen<K extends keyof T>(key: K, callback: OnChangedFunction<T[K]>): (changes, area) => void;

    /**
     * Removes a listener that was added with onChanged.
     * @param listener the listener function to remove
     */
    removeListener(listener: (changes, area) => void): void;
};

/**
 * Options that modify the behavior of the store
 */
type StoreOptions = {
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
 * @param area the storage area to use. Defaults to 'local'
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 */
function createStore<T>(
    defaults: StoreDefaults<T>,
    area: 'sync' | 'local' | 'session' | 'managed',
    options?: StoreOptions
): Store<T> {
    const keys = Object.keys(defaults) as string[];
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

    store.get = async (key: any) => {
        if (!hasInitialized) {
            await store.initialize();
        }

        const value = (await chrome.storage[area].get(key))[key];
        return isEncrypted ? await security.decrypt(value) : value;
    };

    store.set = async (key: any, value?: any) => {
        if (!hasInitialized) {
            await store.initialize();
        }

        // Handle the case where key is an object
        if (typeof key === 'object' && value === undefined) {
            const entriesToRemove: string[] = [];
            const entriesToSet = {};

            for (const [k, v] of Object.entries(key)) {
                if (v === undefined) {
                    // Prepare to remove this key
                    entriesToRemove.push(k);
                } else {
                    // Prepare to set this key
                    // eslint-disable-next-line no-await-in-loop
                    entriesToSet[k] = isEncrypted ? await security.encrypt(v) : v;
                }
            }

            // Remove keys with undefined values
            if (entriesToRemove.length > 0) {
                await chrome.storage[area].remove(entriesToRemove);
            }

            // Set keys with defined values
            if (Object.keys(entriesToSet).length > 0) {
                await chrome.storage[area].set(entriesToSet);
            }

            return;
        }

        // Direct key-value pair handling
        if (value === undefined) {
            // Remove if value is explicitly undefined
            await chrome.storage[area].remove(key);
        } else {
            // Set the value, applying encryption if necessary
            await chrome.storage[area].set({
                [key]: isEncrypted ? await security.encrypt(value) : value,
            });
        }
    };

    // @ts-ignore
    store.use = (key: keyof T, defaultValue?: T[typeof key]) => {
        const [value, setValue] = useState(defaultValue);

        useEffect(() => {
            store.get(key).then(setValue as any);

            const onChanged = ({ newValue }: DataChange<T[typeof key]>) => {
                setValue(newValue as any);
            };
            store.listen(key, onChanged);
            return () => {
                store.removeListener(onChanged);
            };
        }, [key]);

        const set = async (newValue: T[typeof key]) => {
            await store.set(key, newValue as any);
            setValue(newValue);
        };

        return [value, set] as any;
    };
    store.all = async () => {
        if (!hasInitialized) {
            await store.initialize();
        }
        const fullStore = await chrome.storage[area].get(keys);
        if (isEncrypted) {
            await Promise.all(
                keys.map(async key => {
                    fullStore[key] = await security.decrypt(fullStore[key]);
                })
            );
        }
        return fullStore as Serializable<T>;
    };

    store.keys = () => keys as (keyof T & string)[];

    store.listen = (key, callback) => {
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

    store.removeListener = listener => {
        chrome.storage.onChanged.removeListener(listener);
    };

    return store;
}

/**
 * A function that creates a virtual Store within the chrome.storage.local API.
 * This store will persist across browser sessions and be stored on the user's computer.
 *
 * @param defaults the default values for the store (these will be used to initialize the store if the key is not already set, and will be used as the type for the getters and setters)
 * @param computed an optional function that allows you to override the generated getters and setters with your own. Provides a reference to the store itself so you can access this store's getters and setters.
 * @param area the storage area to use. Defaults to 'local'
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 */
export function createLocalStore<T>(defaults: StoreDefaults<T>, options?: StoreOptions): Store<T> {
    return createStore(defaults, 'local', options);
}

/**
 * A function that creates a virtual Store within the chrome.storage.sync API.
 * This store will persist across browser sessions and be stored on the user's Google account (if they are logged in).
 * This means that the data will be synced across all of the user's devices.
 *
 * @param defaults the default values for the store (these will be used to initialize the store if the key is not already set, and will be used as the type for the getters and setters)
 * @param options options that modify the behavior of the store
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 */
export function createSyncStore<T>(defaults: StoreDefaults<T>, options?: StoreOptions): Store<T> {
    return createStore(defaults, 'sync', options);
}

/**
 * A function that creates a virtual Store within the chrome.storage.managed API.
 * This store will persist across browser sessions and managed by the administrator of the user's computer.
 *
 * @param defaults the default values for the store (these will be used to initialize the store if the key is not already set, and will be used as the type for the getters and setters)
 * @param options options that modify the behavior of the store
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 * @see https://developer.chrome.com/docs/extensions/reference/storage/#type-ManagedStorageArea
 *
 */
export function createManagedStore<T>(defaults: StoreDefaults<T>, options?: StoreOptions): Store<T> {
    return createStore(defaults, 'managed', options);
}

/**
 * A function that creates a virtual Store within the chrome.storage.session API.
 * This store will NOT persist across browser sessions and will be stored in memory. This will reset when the browser is closed.
 *
 * @param defaults the default values for the store (these will be used to initialize the store if the key is not already set, and will be used as the type for the getters and setters)
 * @param options options that modify the behavior of the store
 * @returns an object which contains getters/setters for the keys in the defaults object, as well as an initialize function and an onChanged functions
 */
export function createSessionStore<T>(defaults: StoreDefaults<T>, options?: StoreOptions): Store<T> {
    return createStore(defaults, 'session', options);
}
