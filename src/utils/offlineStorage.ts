/**
 * Offline Storage Utility with IndexedDB
 * Features: Encryption, data versioning, storage quota management
 */

import CryptoJS from 'crypto-js';

// Database configuration
const DB_NAME = 'MentalHealthAppDB';
const DB_VERSION = 1;

// Store names
export enum StoreName {
  MOOD = 'mood_entries',
  JOURNAL = 'journal_entries',
  APPOINTMENTS = 'appointments',
  MEDICATIONS = 'medications',
  USER_PROFILE = 'user_profile',
  SYNC_METADATA = 'sync_metadata',
  CACHED_DATA = 'cached_data',
}

// Sync status enum
export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  CONFLICT = 'conflict',
  ERROR = 'error',
}

// Data record interface
export interface DataRecord<T = any> {
  id: string;
  data: T;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
  version: number;
  checksum?: string;
  encrypted?: boolean;
}

// Storage metadata
export interface StorageMetadata {
  totalSize: number;
  availableSpace: number;
  usage: Record<string, number>;
  lastCleanup: number;
}

/**
 * Offline Storage Manager using IndexedDB
 */
class OfflineStorage {
  private db: IDBDatabase | null = null;
  private encryptionKey: string | null = null;
  private isInitialized: boolean = false;
  private maxStorageSize: number = 50 * 1024 * 1024; // 50MB default
  private compressionEnabled: boolean = true;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Setup encryption key from secure storage
      await this.setupEncryption();

      // Open IndexedDB
      this.db = await this.openDatabase();
      
      this.isInitialized = true;
      
      // Perform initial cleanup if needed
      await this.performStorageCleanup();
      
      console.log('Offline storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      throw error;
    }
  }

  /**
   * Open IndexedDB connection
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        Object.values(StoreName).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Create indexes
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('version', 'version', { unique: false });
            
            // Additional indexes for specific stores
            if (storeName === StoreName.MOOD) {
              store.createIndex('date', 'data.date', { unique: false });
            }
            if (storeName === StoreName.APPOINTMENTS) {
              store.createIndex('startTime', 'data.startTime', { unique: false });
            }
          }
        });
      };
    });
  }

  /**
   * Setup encryption key
   */
  private async setupEncryption(): Promise<void> {
    try {
      // Get or generate encryption key
      let key = localStorage.getItem('db_encryption_key');
      
      if (!key) {
        // Generate new key
        key = CryptoJS.lib.WordArray.random(256/8).toString();
        localStorage.setItem('db_encryption_key', key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to setup encryption:', error);
      // Continue without encryption if setup fails
      this.encryptionKey = null;
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: any): string {
    if (!this.encryptionKey) return JSON.stringify(data);
    
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): any {
    if (!this.encryptionKey) return JSON.parse(encryptedData);
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption failed:', error);
      // Try parsing as plain JSON if decryption fails
      try {
        return JSON.parse(encryptedData);
      } catch {
        return null;
      }
    }
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.SHA256(jsonString).toString();
  }

  /**
   * Verify data integrity
   */
  private verifyChecksum(data: any, checksum: string): boolean {
    return this.generateChecksum(data) === checksum;
  }

  /**
   * Store data in IndexedDB
   */
  async put<T>(
    storeName: StoreName,
    id: string,
    data: T,
    options: {
      encrypt?: boolean;
      compress?: boolean;
    } = {}
  ): Promise<DataRecord<T>> {
    if (!this.db) await this.initialize();

    const shouldEncrypt = options.encrypt ?? this.shouldEncryptStore(storeName);
    
    const record: DataRecord<T> = {
      id,
      data: shouldEncrypt ? this.encrypt(data) : data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: SyncStatus.PENDING,
      version: 1,
      checksum: this.generateChecksum(data),
      encrypted: shouldEncrypt,
    };

    // Check for existing record
    const existing = await this.get(storeName, id);
    if (existing) {
      record.createdAt = existing.createdAt;
      record.version = existing.version + 1;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(record);
      };

      request.onerror = () => {
        reject(new Error(`Failed to store data in ${storeName}`));
      };
    });
  }

  /**
   * Get data from IndexedDB
   */
  async get<T>(storeName: StoreName, id: string): Promise<DataRecord<T> | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        // Decrypt if needed
        if (record.encrypted && typeof record.data === 'string') {
          record.data = this.decrypt(record.data);
        }

        // Verify checksum
        if (record.checksum && !this.verifyChecksum(record.data, record.checksum)) {
          console.warn(`Data integrity check failed for ${storeName}:${id}`);
        }

        resolve(record);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get data from ${storeName}`));
      };
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(
    storeName: StoreName,
    filter?: {
      syncStatus?: SyncStatus;
      since?: number;
      limit?: number;
    }
  ): Promise<DataRecord<T>[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      if (filter?.syncStatus) {
        const index = store.index('syncStatus');
        request = index.getAll(filter.syncStatus);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let records = request.result || [];
        
        // Apply filters
        if (filter?.since) {
          records = records.filter(r => r.updatedAt >= filter.since);
        }
        
        // Decrypt encrypted records
        records = records.map(record => {
          if (record.encrypted && typeof record.data === 'string') {
            record.data = this.decrypt(record.data);
          }
          return record;
        });
        
        // Apply limit
        if (filter?.limit) {
          records = records.slice(0, filter.limit);
        }
        
        resolve(records);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all data from ${storeName}`));
      };
    });
  }

  /**
   * Delete data from IndexedDB
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete data from ${storeName}`));
      };
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: StoreName): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    storeName: StoreName,
    id: string,
    status: SyncStatus
  ): Promise<void> {
    const record = await this.get(storeName, id);
    if (!record) return;

    record.syncStatus = status;
    record.updatedAt = Date.now();

    await this.put(storeName, id, record.data);
  }

  /**
   * Get records needing sync
   */
  async getUnsyncedRecords<T>(storeName: StoreName): Promise<DataRecord<T>[]> {
    return this.getAll(storeName, {
      syncStatus: SyncStatus.PENDING,
    });
  }

  /**
   * Check if store should be encrypted
   */
  private shouldEncryptStore(storeName: StoreName): boolean {
    const encryptedStores = [
      StoreName.JOURNAL,
      StoreName.MOOD,
      StoreName.MEDICATIONS,
      StoreName.USER_PROFILE,
    ];
    
    return encryptedStores.includes(storeName);
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<StorageMetadata> {
    if (!navigator.storage?.estimate) {
      return {
        totalSize: 0,
        availableSpace: 0,
        usage: {},
        lastCleanup: Date.now(),
      };
    }

    const estimate = await navigator.storage.estimate();
    const usage: Record<string, number> = {};

    // Calculate usage per store
    for (const storeName of Object.values(StoreName)) {
      const records = await this.getAll(storeName);
      const size = new Blob([JSON.stringify(records)]).size;
      usage[storeName] = size;
    }

    return {
      totalSize: estimate.usage || 0,
      availableSpace: (estimate.quota || 0) - (estimate.usage || 0),
      usage,
      lastCleanup: parseInt(localStorage.getItem('last_storage_cleanup') || '0'),
    };
  }

  /**
   * Perform storage cleanup
   */
  async performStorageCleanup(): Promise<void> {
    const stats = await this.getStorageStats();
    
    // Check if cleanup is needed
    const cleanupThreshold = this.maxStorageSize * 0.9; // 90% threshold
    if (stats.totalSize < cleanupThreshold) return;

    console.log('Performing storage cleanup...');

    // Remove old synced records
    const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    for (const storeName of Object.values(StoreName)) {
      const records = await this.getAll(storeName);
      
      for (const record of records) {
        if (record.syncStatus === SyncStatus.SYNCED && record.updatedAt < cutoffDate) {
          await this.delete(storeName, record.id);
        }
      }
    }

    // Clear cached data if still over threshold
    const newStats = await this.getStorageStats();
    if (newStats.totalSize > cleanupThreshold) {
      await this.clear(StoreName.CACHED_DATA);
    }

    localStorage.setItem('last_storage_cleanup', Date.now().toString());
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<Record<string, any[]>> {
    const exportData: Record<string, any[]> = {};
    
    for (const storeName of Object.values(StoreName)) {
      exportData[storeName] = await this.getAll(storeName);
    }
    
    return exportData;
  }

  /**
   * Import data from backup
   */
  async importData(data: Record<string, any[]>): Promise<void> {
    for (const [storeName, records] of Object.entries(data)) {
      for (const record of records) {
        await this.put(storeName as StoreName, record.id, record.data);
      }
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Export types
export type { DataRecord, StorageMetadata };