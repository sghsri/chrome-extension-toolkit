import { 
    createLocalStore, 
    createSyncStore, 
    createSessionStore, 
    createManagedStore 
} from 'src/storage/createStore';
import { chrome } from 'jest-chrome';

// Mock the Security class
jest.mock('src/storage/Security', () => ({
    Security: class {
        static MISSING_PASSWORD_ERROR_MESSAGE = 'EXTENSION_STORAGE_PASSWORD environment variable is required for encrypted storage';
        
        async encrypt(value: any) {
            return `encrypted:${JSON.stringify(value)}`;
        }
        
        async decrypt(value: string) {
            if (typeof value === 'string' && value.startsWith('encrypted:')) {
                return JSON.parse(value.replace('encrypted:', ''));
            }
            return value;
        }
    }
}));

interface TestStoreSchema {
    name: string;
    age: number;
    isActive?: boolean;
    settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
}

describe('createStore', () => {
    const mockDefaults: TestStoreSchema = {
        name: 'John Doe',
        age: 25,
        isActive: true,
        settings: {
            theme: 'light',
            notifications: true,
        },
    };

    beforeEach(() => {
        // Reset all chrome storage mocks
        chrome.storage.local.get.mockClear();
        chrome.storage.local.set.mockClear();
        chrome.storage.local.remove.mockClear();
        chrome.storage.sync.get.mockClear();
        chrome.storage.sync.set.mockClear();
        chrome.storage.sync.remove.mockClear();
        chrome.storage.session.get.mockClear();
        chrome.storage.session.set.mockClear();
        chrome.storage.session.remove.mockClear();
        chrome.storage.managed.get.mockClear();
        chrome.storage.managed.set.mockClear();
        chrome.storage.managed.remove.mockClear();
        chrome.storage.onChanged.addListener.mockClear();
        chrome.storage.onChanged.removeListener.mockClear();
    });

    describe('createLocalStore', () => {
        it('should create a local store with correct properties', () => {
            const store = createLocalStore('test-store', mockDefaults);

            expect(store.storeId).toBe('test-store');
            expect(store.defaults).toEqual(mockDefaults);
            expect(store.keys()).toEqual(['name', 'age', 'isActive', 'settings']);
        });

        it('should initialize store with default values', async () => {
            chrome.storage.local.get.mockResolvedValue({});

            const store = createLocalStore('test-store', mockDefaults);
            await store.initialize();

            expect(chrome.storage.local.get).toHaveBeenCalledWith([
                'test-store:name',
                'test-store:age',
                'test-store:isActive',
                'test-store:settings',
            ]);

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:name': 'John Doe',
                'test-store:age': 25,
                'test-store:isActive': true,
                'test-store:settings': {
                    theme: 'light',
                    notifications: true,
                },
            });
        });

        it('should not set values that already exist', async () => {
            chrome.storage.local.get.mockResolvedValue({
                'test-store:name': 'Existing Name',
                'test-store:age': 30,
            });

            const store = createLocalStore('test-store', mockDefaults);
            await store.initialize();

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:isActive': true,
                'test-store:settings': {
                    theme: 'light',
                    notifications: true,
                },
            });
        });

        it('should get values from storage', async () => {
            chrome.storage.local.get.mockResolvedValue({
                'test-store:name': 'Retrieved Name',
            });

            const store = createLocalStore('test-store', mockDefaults);
            const name = await store.get('name');

            expect(name).toBe('Retrieved Name');
        });

        it('should set individual values', async () => {
            chrome.storage.local.get.mockResolvedValue({});

            const store = createLocalStore('test-store', mockDefaults);
            await store.set('name', 'New Name');

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:name': 'New Name',
            });
        });

        it('should set multiple values', async () => {
            chrome.storage.local.get.mockResolvedValue({});

            const store = createLocalStore('test-store', mockDefaults);
            await store.set({
                name: 'New Name',
                age: 30,
            });

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:name': 'New Name',
                'test-store:age': 30,
            });
        });

        it('should remove values', async () => {
            chrome.storage.local.get.mockResolvedValue({});

            const store = createLocalStore('test-store', mockDefaults);
            await store.remove('name');

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('test-store:name');
        });

        it('should get all values', async () => {
            chrome.storage.local.get.mockResolvedValue({
                'test-store:name': 'John',
                'test-store:age': 25,
                'test-store:isActive': true,
                'test-store:settings': { theme: 'dark', notifications: false },
            });

            const store = createLocalStore('test-store', mockDefaults);
            const all = await store.all();

            expect(all).toEqual({
                name: 'John',
                age: 25,
                isActive: true,
                settings: { theme: 'dark', notifications: false },
            });
        });

        it('should handle subscriptions', async () => {
            chrome.storage.local.get.mockResolvedValue({});

            const store = createLocalStore('test-store', mockDefaults);
            const callback = jest.fn();

            const subscription = store.subscribe('name', callback);

            expect(chrome.storage.onChanged.addListener).toHaveBeenCalledWith(subscription);

            // Simulate a storage change
            const changes = {
                'test-store:name': {
                    oldValue: 'Old Name',
                    newValue: 'New Name',
                },
            };

            subscription(changes, 'local');

            expect(callback).toHaveBeenCalledWith({
                key: 'name',
                oldValue: 'Old Name',
                newValue: 'New Name',
            });
        });

        it('should handle unsubscriptions', () => {
            const store = createLocalStore('test-store', mockDefaults);
            const subscription = jest.fn();

            store.unsubscribe(subscription);

            expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(subscription);
        });
    });

    describe('createSyncStore', () => {
        it('should create a sync store', () => {
            const store = createSyncStore('sync-store', mockDefaults);
            expect(store.storeId).toBe('sync-store');
        });

        it('should use sync storage area', async () => {
            chrome.storage.sync.get.mockResolvedValue({});

            const store = createSyncStore('sync-store', mockDefaults);
            await store.initialize();

            expect(chrome.storage.sync.get).toHaveBeenCalled();
            expect(chrome.storage.sync.set).toHaveBeenCalled();
        });
    });

    describe('createSessionStore', () => {
        it('should create a session store', () => {
            const store = createSessionStore('session-store', mockDefaults);
            expect(store.storeId).toBe('session-store');
        });

        it('should use session storage area', async () => {
            chrome.storage.session.get.mockResolvedValue({});

            const store = createSessionStore('session-store', mockDefaults);
            await store.initialize();

            expect(chrome.storage.session.get).toHaveBeenCalled();
            expect(chrome.storage.session.set).toHaveBeenCalled();
        });
    });

    describe('createManagedStore', () => {
        it('should create a managed store', () => {
            const store = createManagedStore('managed-store', mockDefaults);
            expect(store.storeId).toBe('managed-store');
        });

        it('should use managed storage area', async () => {
            chrome.storage.managed.get.mockResolvedValue({});

            const store = createManagedStore('managed-store', mockDefaults);
            await store.initialize();

            expect(chrome.storage.managed.get).toHaveBeenCalled();
            expect(chrome.storage.managed.set).toHaveBeenCalled();
        });
    });

    describe('encrypted storage', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = { ...originalEnv };
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it('should throw error when encryption is enabled but password is missing', () => {
            delete process.env.EXTENSION_STORAGE_PASSWORD;

            expect(() => {
                createLocalStore('encrypted-store', mockDefaults, { isEncrypted: true });
            }).toThrow('EXTENSION_STORAGE_PASSWORD environment variable is required for encrypted storage');
        });

        it('should encrypt values when encryption is enabled', async () => {
            process.env.EXTENSION_STORAGE_PASSWORD = 'test-password';
            chrome.storage.local.get.mockResolvedValue({});

            const store = createLocalStore('encrypted-store', mockDefaults, { isEncrypted: true });
            await store.set('name', 'Encrypted Name');

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'encrypted-store:name': 'encrypted:"Encrypted Name"',
            });
        });

        it('should decrypt values when retrieving from encrypted storage', async () => {
            process.env.EXTENSION_STORAGE_PASSWORD = 'test-password';
            chrome.storage.local.get.mockResolvedValue({
                'encrypted-store:name': 'encrypted:"Decrypted Name"',
            });

            const store = createLocalStore('encrypted-store', mockDefaults, { isEncrypted: true });
            const name = await store.get('name');

            expect(name).toBe('Decrypted Name');
        });
    });
});