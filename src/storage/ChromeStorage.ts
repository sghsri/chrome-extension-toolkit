import { Serializable } from '../types/Serialization';

export type StorageArea = 'local' | 'sync' | 'managed' | 'session';

export class ChromeStorage<T> {
    store: StorageArea;

    constructor(store: StorageArea) {
        this.store = store;
    }

    get<K extends keyof T>(key: K): Promise<Serializable<T[K]>> {
        return '' as any;
    }

    set<K extends keyof T>(key: K, value: Serializable<T[K]>): Promise<void> {
        return '' as any;
    }

    watch<K extends keyof T>(key: K, callback: (value: Serializable<T[K]>) => void): void {
        return '' as any;
    }
}

type Obj = {
    date: Date;
};

interface ILocalStorage {
    name: string;
    url: URL;
    obj: Obj;
}

interface ISyncStorage {
    name: string;
    url: URL;
    obj: Obj;
}

const store = {
    local: new ChromeStorage<ILocalStorage>('local'),
    sync: new ChromeStorage<ISyncStorage>('sync'),
};
