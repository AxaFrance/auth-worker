import { StorageBackend } from '@openid/appauth/built/storage';
import { getInstance } from '../../../repository/workerRepository';

export class WorkerStorageBackend extends StorageBackend {
    private storage: LocalForage;
    constructor() {
        super();
        this.storage = getInstance();
    }

    public async clear(): Promise<void> {
        await this.storage.clear();
    }

    public async getItem(key: string): Promise<string | null> {
        return await this.storage.getItem(key);
    }
    public async removeItem(key: string): Promise<void> {
        await this.storage.removeItem(key);
    }
    public async setItem(key: string, data: string): Promise<void> {
        await this.storage.setItem(key, data);
    }
}
