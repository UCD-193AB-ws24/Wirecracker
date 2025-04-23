class IndexedDBStorage {
    constructor() {
        this.dbName = 'niftiStorage';
        this.storeName = 'niftiFiles';
        this.chunkStoreName = 'niftiChunks';
        this.db = null;
        this.chunkSize = 100 * 1024 * 1024; // 100MB chunks
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(this.chunkStoreName)) {
                    db.createObjectStore(this.chunkStoreName, { keyPath: ['fileId', 'chunkIndex'] });
                }
            };
        });
    }

    async saveNiftiFile(id, niftiData) {
        if (!this.db) {
            await this.initDB();
        }

        // Split the image data into chunks
        const chunks = this.splitIntoChunks(niftiData.img);
        const header = niftiData.hdr;
        const isRGB = niftiData.isRGB;

        // Save metadata
        const metadata = {
            id,
            header,
            isRGB,
            numChunks: chunks.length
        };

        // Save metadata first
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(metadata);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Save chunks
        for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.chunkStoreName], 'readwrite');
                const store = transaction.objectStore(this.chunkStoreName);
                const request = store.put({
                    fileId: id,
                    chunkIndex: i,
                    data: chunks[i]
                });

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    async getNiftiFile(id) {
        if (!this.db) {
            await this.initDB();
        }

        // Get metadata first
        const metadata = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!metadata) return null;

        // Get all chunks
        const chunks = [];
        for (let i = 0; i < metadata.numChunks; i++) {
            const chunk = await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.chunkStoreName], 'readonly');
                const store = transaction.objectStore(this.chunkStoreName);
                const request = store.get([id, i]);

                request.onsuccess = () => resolve(request.result?.data);
                request.onerror = () => reject(request.error);
            });
            chunks.push(chunk);
        }

        // Reconstruct the image data
        const img = this.reconstructFromChunks(chunks);

        return {
            img,
            hdr: metadata.header,
            isRGB: metadata.isRGB
        };
    }

    async deleteNiftiFile(id) {
        if (!this.db) {
            await this.initDB();
        }

        // Get metadata to know how many chunks to delete
        const metadata = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!metadata) return;

        // Delete all chunks
        for (let i = 0; i < metadata.numChunks; i++) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.chunkStoreName], 'readwrite');
                const store = transaction.objectStore(this.chunkStoreName);
                const request = store.delete([id, i]);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        // Delete metadata
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    splitIntoChunks(data) {
        const chunks = [];
        const totalSize = data.length;
        
        for (let i = 0; i < totalSize; i += this.chunkSize) {
            chunks.push(data.slice(i, i + this.chunkSize));
        }
        
        return chunks;
    }

    reconstructFromChunks(chunks) {
        return chunks.reduce((acc, chunk) => acc.concat(chunk), []);
    }
}

export const niftiStorage = new IndexedDBStorage(); 