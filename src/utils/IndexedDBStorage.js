class IndexedDBStorage {
    constructor() {
        this.dbName = 'niftiStorage';
        this.storeName = 'niftiFiles';
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 3); // Increment version number

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
                // Remove the chunk store as we're no longer using it
                if (db.objectStoreNames.contains('niftiChunks')) {
                    db.deleteObjectStore('niftiChunks');
                }
            };
        });
    }

    async saveNiftiFile(id, niftiData) {
        if (!this.db) {
            await this.initDB();
        }

        // Compress the entire NIfTI data
        const compressedData = await this.compressData(niftiData);
        const header = niftiData.hdr;
        const isRGB = niftiData.isRGB;

        // Save metadata and compressed data
        const fileData = {
            id,
            header,
            isRGB,
            compressedData,
            originalSize: niftiData.img.length
        };

        // Save the file data
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(fileData);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getNiftiFile(id) {
        if (!this.db) {
            await this.initDB();
        }

        // Get the file data
        const fileData = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!fileData) return null;

        // Decompress the data
        const decompressedData = await this.decompressData(fileData.compressedData);

        return {
            img: decompressedData.img,
            hdr: fileData.header,
            isRGB: fileData.isRGB
        };
    }

    async deleteNiftiFile(id) {
        if (!this.db) {
            await this.initDB();
        }

        // Delete the file data
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async compressData(niftiData) {
        try {
            // Convert the NIfTI data to a format that can be compressed
            const dataToCompress = {
                img: niftiData.img,
                hdr: niftiData.hdr,
                isRGB: niftiData.isRGB
            };
            
            // Convert to JSON string and then to a Blob
            const jsonString = JSON.stringify(dataToCompress);
            const blob = new Blob([jsonString]);
            
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
            throw error;
        }
    }

    async decompressData(compressedData) {
        try {
            // Create a blob from the compressed data
            const compressedBlob = new Blob([compressedData]);
            
            // Create a stream from the blob
            const stream = compressedBlob.stream();
            
            // Decompress the stream
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            
            // Convert the decompressed stream back to a string
            const decompressedBlob = await new Response(decompressedStream).blob();
            const decompressedText = await decompressedBlob.text();
            
            // Parse the JSON string back to an object
            return JSON.parse(decompressedText);
        } catch (error) {
            console.error('Decompression error:', error);
            throw error;
        }
    }
}

export const niftiStorage = new IndexedDBStorage(); 