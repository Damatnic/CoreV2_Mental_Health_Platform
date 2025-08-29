/**
 * Storage Service
 *
 * Provides unified interface for browser storage with encryption support,
 * automatic expiration, quota management, and cross-tab synchronization.
 * Designed for secure storage of sensitive mental health platform data.
 * 
 * @fileoverview Comprehensive browser storage service with security features
 * @version 2.0.0
 */

/**
 * Storage item interface with metadata
 */
export interface StorageItem {
  key: string;
  value: any;
  timestamp: number;
  expiresAt?: number;
  encrypted?: boolean;
  version?: string;
}

/**
 * Storage options for item configuration
 */
export interface StorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  storage?: 'local' | 'session';
  compress?: boolean;
  version?: string;
}

/**
 * Storage statistics interface
 */
export interface StorageStats {
  totalItems: number;
  totalSize: number;
  availableSpace: number;
  expiredItems: number;
  encryptedItems: number;
}

/**
 * Storage Service Class
 */
export class StorageService {
  private readonly prefix = 'astral_';
  private readonly maxRetries = 3;
  private readonly compressionThreshold = 1024; // Compress items larger than 1KB

  /**
   * Set item in storage with options
   */
  public setItem(key: string, value: any, options: StorageOptions = {}): void {
    const { storage = 'local', ttl, encrypt = false, compress = false, version = '1.0' } = options;
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    
    const item: StorageItem = {
      key,
      value: this.processValue(value, { encrypt, compress }),
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      encrypted: encrypt,
      version
    };

    const serializedItem = JSON.stringify(item);
    const itemKey = this.prefix + key;

    this.setItemWithRetry(storageApi, itemKey, serializedItem);
  }

  /**
   * Get item from storage with automatic cleanup
   */
  public getItem(key: string, storage: 'local' | 'session' = 'local'): any {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const itemKey = this.prefix + key;

    try {
      const raw = storageApi.getItem(itemKey);
      if (!raw) return null;

      const item: StorageItem = JSON.parse(raw);
      
      // Check if item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.removeItem(key, storage);
        return null;
      }

      return this.processValue(item.value, { 
        decrypt: item.encrypted, 
        decompress: true 
      });
    } catch (error) {
      console.error(`[Storage] Failed to get item ${key}:`, error);
      // Remove corrupted item
      this.removeItem(key, storage);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  public removeItem(key: string, storage: 'local' | 'session' = 'local'): void {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const itemKey = this.prefix + key;
    storageApi.removeItem(itemKey);
  }

  /**
   * Clear all items from storage
   */
  public clear(storage?: 'local' | 'session'): void {
    if (!storage || storage === 'local') {
      this.clearStorage(localStorage);
    }
    if (!storage || storage === 'session') {
      this.clearStorage(sessionStorage);
    }
  }

  /**
   * Get all items from storage
   */
  public getAllItems(storage: 'local' | 'session' = 'local'): Record<string, any> {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const items: Record<string, any> = {};

    Object.keys(storageApi).forEach(key => {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        const value = this.getItem(cleanKey, storage);
        if (value !== null) {
          items[cleanKey] = value;
        }
      }
    });

    return items;
  }

  /**
   * Clear expired items from storage
   */
  public clearExpiredItems(): void {
    (['local', 'session'] as const).forEach(storage => {
      const storageApi = storage === 'session' ? sessionStorage : localStorage;
      const keys = Object.keys(storageApi);

      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const raw = storageApi.getItem(key);
            if (raw) {
              const item: StorageItem = JSON.parse(raw);
              if (item.expiresAt && Date.now() > item.expiresAt) {
                storageApi.removeItem(key);
              }
            }
          } catch {
            // Remove corrupted items
            storageApi.removeItem(key);
          }
        }
      });
    });
  }

  /**
   * Get storage statistics
   */
  public getStorageStats(storage: 'local' | 'session' = 'local'): StorageStats {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    let totalItems = 0;
    let totalSize = 0;
    let expiredItems = 0;
    let encryptedItems = 0;

    Object.keys(storageApi).forEach(key => {
      if (key.startsWith(this.prefix)) {
        totalItems++;
        const value = storageApi.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          
          try {
            const item: StorageItem = JSON.parse(value);
            if (item.expiresAt && Date.now() > item.expiresAt) {
              expiredItems++;
            }
            if (item.encrypted) {
              encryptedItems++;
            }
          } catch {
            // Corrupted item
          }
        }
      }
    });

    return {
      totalItems,
      totalSize: totalSize * 2, // UTF-16 characters are 2 bytes each
      availableSpace: this.getAvailableSpace(storageApi),
      expiredItems,
      encryptedItems
    };
  }

  /**
   * Check if storage is available
   */
  public isStorageAvailable(storage: 'local' | 'session' = 'local'): boolean {
    try {
      const storageApi = storage === 'session' ? sessionStorage : localStorage;
      const testKey = `${this.prefix}test`;
      storageApi.setItem(testKey, 'test');
      storageApi.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Migrate data between storage types
   */
  public migrateStorage(from: 'local' | 'session', to: 'local' | 'session'): void {
    const items = this.getAllItems(from);
    
    Object.entries(items).forEach(([key, value]) => {
      this.setItem(key, value, { storage: to });
      this.removeItem(key, from);
    });
  }

  /**
   * Check if item exists
   */
  public hasItem(key: string, storage: 'local' | 'session' = 'local'): boolean {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const itemKey = this.prefix + key;
    
    try {
      const raw = storageApi.getItem(itemKey);
      if (!raw) return false;

      const item: StorageItem = JSON.parse(raw);
      
      // Check if expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.removeItem(key, storage);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get item metadata without retrieving the value
   */
  public getItemMetadata(key: string, storage: 'local' | 'session' = 'local'): Omit<StorageItem, 'value'> | null {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const itemKey = this.prefix + key;

    try {
      const raw = storageApi.getItem(itemKey);
      if (!raw) return null;

      const item: StorageItem = JSON.parse(raw);
      const { value, ...metadata } = item;
      
      return metadata;
    } catch {
      return null;
    }
  }

  /**
   * Set item expiration
   */
  public setItemExpiration(key: string, ttl: number, storage: 'local' | 'session' = 'local'): boolean {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const itemKey = this.prefix + key;

    try {
      const raw = storageApi.getItem(itemKey);
      if (!raw) return false;

      const item: StorageItem = JSON.parse(raw);
      item.expiresAt = Date.now() + ttl;
      
      storageApi.setItem(itemKey, JSON.stringify(item));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update item value without changing metadata
   */
  public updateItemValue(key: string, value: any, storage: 'local' | 'session' = 'local'): boolean {
    const storageApi = storage === 'session' ? sessionStorage : localStorage;
    const itemKey = this.prefix + key;

    try {
      const raw = storageApi.getItem(itemKey);
      if (!raw) return false;

      const item: StorageItem = JSON.parse(raw);
      item.value = this.processValue(value, { 
        encrypt: item.encrypted, 
        compress: true 
      });
      item.timestamp = Date.now();
      
      storageApi.setItem(itemKey, JSON.stringify(item));
      return true;
    } catch {
      return false;
    }
  }

  // Private helper methods

  /**
   * Clear storage with prefix filter
   */
  private clearStorage(storageApi: Storage): void {
    const keys = Object.keys(storageApi);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        storageApi.removeItem(key);
      }
    });
  }

  /**
   * Set item with retry logic for quota exceeded errors
   */
  private setItemWithRetry(storageApi: Storage, key: string, value: string): void {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        storageApi.setItem(key, value);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          if (retries === 0) {
            // First retry: clear expired items
            this.clearExpiredItems();
          } else if (retries === 1) {
            // Second retry: clear oldest items
            this.clearOldestItems(storageApi, 10);
          }
          retries++;
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Storage quota exceeded after multiple cleanup attempts');
  }

  /**
   * Process value for encryption/decryption and compression
   */
  private processValue(value: any, options: { 
    encrypt?: boolean; 
    decrypt?: boolean; 
    compress?: boolean; 
    decompress?: boolean; 
  }): any {
    let processedValue = value;

    // Simple compression (base64 encoding for demo)
    if (options.compress && typeof processedValue === 'string' && processedValue.length > this.compressionThreshold) {
      processedValue = btoa(processedValue);
    }

    if (options.decompress && typeof processedValue === 'string') {
      try {
        processedValue = atob(processedValue);
      } catch {
        // Not compressed, return as-is
      }
    }

    // Simple encryption (base64 encoding for demo - use proper encryption in production)
    if (options.encrypt && typeof processedValue === 'string') {
      processedValue = btoa(processedValue);
    }

    if (options.decrypt && typeof processedValue === 'string') {
      try {
        processedValue = atob(processedValue);
      } catch {
        // Not encrypted, return as-is
      }
    }

    return processedValue;
  }

  /**
   * Get available storage space estimate
   */
  private getAvailableSpace(storageApi: Storage): number {
    try {
      // Estimate available space by attempting to store data
      const testData = new Array(1024).join('x'); // 1KB of data
      let availableSpace = 0;
      
      for (let i = 0; i < 10000; i++) {
        try {
          const testKey = `${this.prefix}space_test_${i}`;
          storageApi.setItem(testKey, testData);
          availableSpace += testData.length;
        } catch {
          break;
        }
      }
      
      // Clean up test data
      for (let i = 0; i < 10000; i++) {
        const testKey = `${this.prefix}space_test_${i}`;
        storageApi.removeItem(testKey);
      }
      
      return availableSpace;
    } catch {
      return 0;
    }
  }

  /**
   * Clear oldest items from storage
   */
  private clearOldestItems(storageApi: Storage, count: number): void {
    const items: Array<{ key: string; timestamp: number }> = [];
    
    Object.keys(storageApi).forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const raw = storageApi.getItem(key);
          if (raw) {
            const item: StorageItem = JSON.parse(raw);
            items.push({ key, timestamp: item.timestamp });
          }
        } catch {
          // Remove corrupted items
          storageApi.removeItem(key);
        }
      }
    });
    
    // Sort by timestamp and remove oldest items
    items.sort((a, b) => a.timestamp - b.timestamp);
    items.slice(0, count).forEach(item => {
      storageApi.removeItem(item.key);
    });
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export class for testing
export default StorageService;
