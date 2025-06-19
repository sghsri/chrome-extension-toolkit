import { 
    createLocalStore, 
    createSyncStore, 
    createSessionStore, 
    createManagedStore,
    StoreDefaults
} from 'src/storage';
import { chrome } from 'jest-chrome';

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
            
            // @ts-ignore
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
            
            // @ts-ignore
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
            
            // @ts-ignore
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

        it('should remove individual values', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.remove('userId');

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('test-store:userId');
        });

        it('should return store keys', () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            const keys = store.keys();
            
            expect(keys).toEqual(['userId', 'settings', 'lastLogin', 'count']);
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

            // @ts-ignore
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
            
            // @ts-ignore
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
            
            // @ts-ignore
            chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            await expect(store.get('userId')).rejects.toThrow('Storage error');
        });

        it('should handle setting undefined values', async () => {
            const store = createLocalStore<TestStore>('test-store', defaultValues);
            
            await store.set('lastLogin', undefined);

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('test-store:lastLogin');
        });
    });
});