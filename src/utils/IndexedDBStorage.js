class IndexedDBStorage {
    constructor() {
        this.dbName = 'niftiStorage';
        this.storeName = 'niftiFiles';
        this.chunkStoreName = 'niftiChunks';
        this.db = null;
        this.chunkSize = 50 * 1024 * 1024; // Reduced to 50MB chunks for better performance
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

        // Compress the image data before chunking
        const compressedData = await this.compressData(niftiData.img);
        const chunks = this.splitIntoChunks(compressedData);
        const header = niftiData.hdr;
        const isRGB = niftiData.isRGB;

        // Save metadata
        const metadata = {
            id,
            header,
            isRGB,
            numChunks: chunks.length,
            originalSize: niftiData.img.length,
            compressedSize: compressedData.length
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

        // Reconstruct and decompress the image data
        const compressedData = this.reconstructFromChunks(chunks);
        const img = await this.decompressData(compressedData, metadata.originalSize);

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
        // Calculate total size
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalSize);
        
        // Copy each chunk into the result
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        return result;
    }

    async compressData(data) {
        try {
            // Convert the data to a format that can be compressed
            const dataArray = new Uint8Array(data);
            const blob = new Blob([dataArray]);
            
            // Create a stream from the blob
            const stream = blob.stream();
            
            // Compress the stream
            const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
            
            // Convert the compressed stream back to a Uint8Array
            const compressedBlob = await new Response(compressedStream).blob();
            const compressedArrayBuffer = await compressedBlob.arrayBuffer();
            return new Uint8Array(compressedArrayBuffer);
        } catch (error) {
            console.error('Compression error:', error);
            // If compression fails, return the original data
            return new Uint8Array(data);
        }
    }

    async decompressData(compressedData, originalSize) {
        try {
            // Create a blob from the compressed data
            const compressedBlob = new Blob([compressedData]);
            
            // Create a stream from the blob
            const stream = compressedBlob.stream();
            
            // Decompress the stream
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            
            // Convert the decompressed stream back to a Uint8Array
            const decompressedBlob = await new Response(decompressedStream).blob();
            const decompressedArrayBuffer = await decompressedBlob.arrayBuffer();
            return new Uint8Array(decompressedArrayBuffer);
        } catch (error) {
            console.error('Decompression error:', error);
            // If decompression fails, return the original data
            return new Uint8Array(compressedData);
        }
    }
}

export const niftiStorage = new IndexedDBStorage(); 