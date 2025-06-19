import { 
    createLocalStore, 
    createSyncStore, 
    createSessionStore, 
    createManagedStore,
    Store,
    StoreDefaults
} from 'src/storage';
import { chrome } from 'jest-chrome';
import { renderHook, act } from '@testing-library/react';

interface TestStore {
    userId: string;
    settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
    lastLogin?: Date;
    count: number;
}

const defaultValues: StoreDefaults<TestStore> = {
    userId: '',
    settings: {
        theme: 'light',
        notifications: true
    },
    lastLogin: undefined,
    count: 0
};

describe('Storage Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset chrome storage mocks
        chrome.storage.local.get.mockResolvedValue({});
        chrome.storage.local.set.mockResolvedValue();
        chrome.storage.local.remove.mockResolvedValue();
        chrome.storage.sync.get.mockResolvedValue({});
        chrome.storage.sync.set.mockResolvedValue();
        chrome.storage.sync.remove.mockResolvedValue();
        chrome.storage.session.get.mockResolvedValue({});
        chrome.storage.session.set.mockResolvedValue();
        chrome.storage.session.remove.mockResolvedValue();
        chrome.storage.managed.get.mockResolvedValue({});
    });

    describe('createLocalStore', () => {
        it('should create a local store', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            expect(store).toBeDefined();
            expect(store.storeId).toBe('test-store');
            expect(store.defaults).toEqual(defaultValues);
        });

        it('should initialize store with defaults', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            // Mock that storage is empty
            chrome.storage.local.get.mockResolvedValue({});

            await store.initialize();

            expect(chrome.storage.local.get).toHaveBeenCalledWith([
                'test-store:userId',
                'test-store:settings',
                'test-store:lastLogin',
                'test-store:count'
            ]);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:userId': '',
                'test-store:settings': { theme: 'light', notifications: true },
                'test-store:lastLogin': undefined,
                'test-store:count': 0
            });
        });

        it('should not set defaults if values already exist', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            // Mock that storage already has values
            chrome.storage.local.get.mockResolvedValue({
                'test-store:userId': 'existing-user',
                'test-store:settings': { theme: 'dark', notifications: false },
                'test-store:lastLogin': new Date('2023-01-01'),
                'test-store:count': 5
            });

            await store.initialize();

            expect(chrome.storage.local.get).toHaveBeenCalled();
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });

        it('should get individual values', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            chrome.storage.local.get.mockResolvedValue({
                'test-store:userId': 'test-user'
            });

            const userId = await store.get('userId');

            expect(chrome.storage.local.get).toHaveBeenCalledWith('test-store:userId');
            expect(userId).toBe('test-user');
        });

        it('should set individual values', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.set('userId', 'new-user');

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:userId': 'new-user'
            });
        });

        it('should set multiple values at once', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.set({
                userId: 'new-user',
                count: 10
            });

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:userId': 'new-user',
                'test-store:count': 10
            });
        });

        it('should remove values when set to undefined in batch', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.set({
                userId: 'new-user',
                lastLogin: undefined
            });

            expect(chrome.storage.local.remove).toHaveBeenCalledWith(['test-store:lastLogin']);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'test-store:userId': 'new-user'
            });
        });

        it('should remove individual values', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.remove('userId');

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('test-store:userId');
        });

        it('should get all store data', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            chrome.storage.local.get.mockResolvedValue({
                'test-store:userId': 'test-user',
                'test-store:settings': { theme: 'dark', notifications: true },
                'test-store:count': 5
            });

            const allData = await store.all();

            expect(allData).toEqual({
                userId: 'test-user',
                settings: { theme: 'dark', notifications: true },
                count: 5
            });
        });

        it('should return store keys', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            const keys = store.keys();
            
            expect(keys).toEqual(['userId', 'settings', 'lastLogin', 'count']);
        });

        it('should subscribe to storage changes', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            const callback = jest.fn();
            
            const unsubscribe = store.subscribe('userId', callback);

            // Simulate a storage change
            const changes = {
                'test-store:userId': {
                    oldValue: 'old-user',
                    newValue: 'new-user'
                }
            };

            const [[storageListener]] = chrome.storage.onChanged.addListener.mock.calls;
            await storageListener(changes, 'local');

            expect(callback).toHaveBeenCalledWith({
                key: 'userId',
                oldValue: 'old-user',
                newValue: 'new-user'
            });

            expect(typeof unsubscribe).toBe('function');
        });

        it('should unsubscribe from storage changes', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            const callback = jest.fn();
            
            const unsubscribe = store.subscribe('userId', callback);
            store.unsubscribe(unsubscribe);

            expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(unsubscribe);
        });

        it('should handle React hook usage', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            chrome.storage.local.get.mockResolvedValue({
                'test-store:userId': 'test-user'
            });

            const { result } = renderHook(() => store.use('userId'));

            expect(result.current).toBeDefined();
            expect(result.current[0]).toBe(''); // Initial default value
            expect(typeof result.current[1]).toBe('function'); // Setter function
        });

        it('should handle React hook with explicit default', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            const { result } = renderHook(() => store.use('userId', 'default-user'));

            expect(result.current[0]).toBe('default-user');
        });

        it('should handle React hook for entire store', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            const { result } = renderHook(() => store.use(null));

            expect(result.current).toBeDefined();
            expect(result.current[0]).toEqual(defaultValues);
            expect(typeof result.current[1]).toBe('function');
        });
    });

    describe('createSyncStore', () => {
        it('should create a sync store', () => {
            const store = createSyncStore<TestStore>('sync-store', defaultValues);
            expect(store).toBeDefined();
            expect(store.storeId).toBe('sync-store');
        });

        it('should use chrome.storage.sync', async () => {
            const store = createSyncStore<TestStore>('sync-store', defaultValues);
            
            await store.set('userId', 'sync-user');

            expect(chrome.storage.sync.set).toHaveBeenCalledWith({
                'sync-store:userId': 'sync-user'
            });
        });
    });

    describe('createSessionStore', () => {
        it('should create a session store', () => {
            const store = createSessionStore<TestStore>('session-store', defaultValues);
            expect(store).toBeDefined();
            expect(store.storeId).toBe('session-store');
        });

        it('should use chrome.storage.session', async () => {
            const store = createSessionStore<TestStore>('session-store', defaultValues);
            
            await store.set('userId', 'session-user');

            expect(chrome.storage.session.set).toHaveBeenCalledWith({
                'session-store:userId': 'session-user'
            });
        });
    });

    describe('createManagedStore', () => {
        it('should create a managed store', () => {
            const store = createManagedStore<TestStore>('managed-store', defaultValues);
            expect(store).toBeDefined();
            expect(store.storeId).toBe('managed-store');
        });

        it('should use chrome.storage.managed for reading', async () => {
            const store = createManagedStore<TestStore>('managed-store', defaultValues);
            
            chrome.storage.managed.get.mockResolvedValue({
                'managed-store:userId': 'managed-user'
            });

            const userId = await store.get('userId');

            expect(chrome.storage.managed.get).toHaveBeenCalledWith('managed-store:userId');
            expect(userId).toBe('managed-user');
        });
    });

    describe('Encrypted Storage', () => {
        beforeEach(() => {
            // Mock the environment variable for encryption
            process.env.EXTENSION_STORAGE_PASSWORD = 'test-password';
        });

        afterEach(() => {
            delete process.env.EXTENSION_STORAGE_PASSWORD;
        });

        it('should throw error if password is missing', () => {
            delete process.env.EXTENSION_STORAGE_PASSWORD;
            
            expect(() => {
                createLocalStore<TestStore>('encrypted-store', defaultValues, { isEncrypted: true });
            }).toThrow();
        });

        it('should create encrypted store when password is provided', () => {
            const store = createLocalStore<TestStore>('encrypted-store', defaultValues, { 
                isEncrypted: true 
            });
            
            expect(store).toBeDefined();
            expect(store.options.isEncrypted).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle storage errors gracefully', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            await expect(store.get('userId')).rejects.toThrow('Storage error');
        });

        it('should handle setting undefined values', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.set('lastLogin', undefined);

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('test-store:lastLogin');
        });

        it('should ignore changes from different storage areas', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            const callback = jest.fn();
            
            store.subscribe('userId', callback);

            const changes = {
                'test-store:userId': {
                    oldValue: 'old-user',
                    newValue: 'new-user'
                }
            };

            const [[storageListener]] = chrome.storage.onChanged.addListener.mock.calls;
            await storageListener(changes, 'sync'); // Different area

            expect(callback).not.toHaveBeenCalled();
        });

        it('should ignore changes for unrelated keys', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            const callback = jest.fn();
            
            store.subscribe('userId', callback);

            const changes = {
                'other-store:userId': {
                    oldValue: 'old-user',
                    newValue: 'new-user'
                }
            };

            const [[storageListener]] = chrome.storage.onChanged.addListener.mock.calls;
            await storageListener(changes, 'local');

            expect(callback).not.toHaveBeenCalled();
        });
    });
});