/**
 * IndexedDB Helper Utilities
 * 
 * Comprehensive utilities for managing IndexedDB operations with
 * TypeScript support, error handling, and mental health data optimization.
 * 
 * Features:
 * - Database initialization and versioning
 * - Transaction management
 * - Batch operations
 * - Data compression
 * - Query optimization
 * - Storage quota management
 * - Migration support
 * 
 * @version 2.0.0
 * @license Apache-2.0
 */

// Database configuration
export const DB_CONFIG = {
  name: 'AstralCoreOfflineDB',
  version: 3,
  stores: {
    offlineData: {
      keyPath: 'id',
      indexes: [
        { name: 'by-type', keyPath: 'type' },
        { name: 'by-status', keyPath: 'syncStatus' },
        { name: 'by-user', keyPath: 'userId' },
        { name: 'by-timestamp', keyPath: 'timestamp' },
        { name: 'by-priority', keyPath: 'priority' }
      ]
    },
    syncQueue: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by-status', keyPath: 'status' },
        { name: 'by-type', keyPath: 'type' },
        { name: 'by-priority', keyPath: 'priority' },
        { name: 'by-timestamp', keyPath: 'timestamp' }
      ]
    },
    moodEntries: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by-user', keyPath: 'userId' },
        { name: 'by-date', keyPath: 'date' }
      ]
    },
    journalEntries: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by-user', keyPath: 'userId' },
        { name: 'by-date', keyPath: 'date' },
        { name: 'by-tags', keyPath: 'tags', multiEntry: true }
      ]
    },
    crisisReports: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by-user', keyPath: 'userId' },
        { name: 'by-severity', keyPath: 'severity' },
        { name: 'by-timestamp', keyPath: 'timestamp' }
      ]
    },
    safetyPlans: {
      keyPath: 'id',
      indexes: [
        { name: 'by-user', keyPath: 'userId' },
        { name: 'by-active', keyPath: 'isActive' }
      ]
    },
    copingStrategies: {
      keyPath: 'id',
      indexes: [
        { name: 'by-category', keyPath: 'category' },
        { name: 'by-effectiveness', keyPath: 'effectiveness' }
      ]
    },
    emergencyContacts: {
      keyPath: 'id',
      indexes: [
        { name: 'by-user', keyPath: 'userId' },
        { name: 'by-priority', keyPath: 'priority' }
      ]
    }
  }
};

// Type definitions
export interface DBTransaction {
  store: IDBObjectStore;
  complete: () => Promise<void>;
  abort: () => void;
}

export interface QueryOptions {
  index?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

export interface BatchOperation<T> {
  type: 'add' | 'put' | 'delete';
  store: string;
  data?: T;
  key?: IDBValidKey;
}

// Database instance singleton
let dbInstance: IDBDatabase | null = null;

/**
 * Initialize or get database connection
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance && dbInstance.version === DB_CONFIG.version) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Handle database close/error
      dbInstance.onerror = (event) => {
        console.error('[IndexedDB] Database error:', event);
      };

      dbInstance.onclose = () => {
        console.log('[IndexedDB] Database closed');
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      
      // Create or upgrade stores
      for (const [storeName, config] of Object.entries(DB_CONFIG.stores)) {
        let store: IDBObjectStore;
        
        if (!db.objectStoreNames.contains(storeName)) {
          // Create new store
          store = db.createObjectStore(storeName, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement
          });
        } else {
          // Get existing store for upgrade
          store = transaction.objectStore(storeName);
        }

        // Create indexes
        if (config.indexes) {
          for (const indexConfig of config.indexes) {
            if (!store.indexNames.contains(indexConfig.name)) {
              store.createIndex(
                indexConfig.name,
                indexConfig.keyPath,
                { 
                  unique: false,
                  multiEntry: indexConfig.multiEntry || false
                }
              );
            }
          }
        }
      }

      console.log('[IndexedDB] Database upgraded to version', DB_CONFIG.version);
    };

    request.onblocked = () => {
      console.warn('[IndexedDB] Database upgrade blocked');
    };
  });
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Get a transaction for a store
 */
export async function getTransaction(
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): Promise<DBTransaction> {
  const db = await getDB();
  const transaction = db.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);

  return {
    store,
    complete: () => new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    }),
    abort: () => transaction.abort()
  };
}

/**
 * Add a record to a store
 */
export async function add<T>(storeName: string, data: T): Promise<IDBValidKey> {
  const { store, complete } = await getTransaction(storeName, 'readwrite');
  const request = store.add(data);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    complete();
  });
}

/**
 * Put (add or update) a record in a store
 */
export async function put<T>(storeName: string, data: T): Promise<IDBValidKey> {
  const { store, complete } = await getTransaction(storeName, 'readwrite');
  const request = store.put(data);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    complete();
  });
}

/**
 * Get a record by key
 */
export async function get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const { store } = await getTransaction(storeName, 'readonly');
  const request = store.get(key);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all records from a store
 */
export async function getAll<T>(
  storeName: string,
  options?: QueryOptions
): Promise<T[]> {
  const { store } = await getTransaction(storeName, 'readonly');
  
  let source: IDBObjectStore | IDBIndex = store;
  if (options?.index) {
    source = store.index(options.index);
  }

  const request = options?.range 
    ? source.getAll(options.range, options.limit)
    : source.getAll(undefined, options?.limit);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      let results = request.result;
      
      // Apply offset if specified
      if (options?.offset) {
        results = results.slice(options.offset);
      }
      
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a record by key
 */
export async function remove(storeName: string, key: IDBValidKey): Promise<void> {
  const { store, complete } = await getTransaction(storeName, 'readwrite');
  const request = store.delete(key);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    complete();
  });
}

/**
 * Clear all records from a store
 */
export async function clear(storeName: string): Promise<void> {
  const { store, complete } = await getTransaction(storeName, 'readwrite');
  const request = store.clear();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    complete();
  });
}

/**
 * Count records in a store
 */
export async function count(
  storeName: string,
  options?: QueryOptions
): Promise<number> {
  const { store } = await getTransaction(storeName, 'readonly');
  
  let source: IDBObjectStore | IDBIndex = store;
  if (options?.index) {
    source = store.index(options.index);
  }

  const request = options?.range 
    ? source.count(options.range)
    : source.count();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Query records with advanced options
 */
export async function query<T>(
  storeName: string,
  options: QueryOptions
): Promise<T[]> {
  const { store } = await getTransaction(storeName, 'readonly');
  const results: T[] = [];
  
  let source: IDBObjectStore | IDBIndex = store;
  if (options.index) {
    source = store.index(options.index);
  }

  const request = source.openCursor(options.range, options.direction);
  let count = 0;
  let skipped = 0;
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      
      if (cursor) {
        // Apply offset
        if (options.offset && skipped < options.offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        // Apply limit
        if (!options.limit || count < options.limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      } else {
        resolve(results);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Perform batch operations in a single transaction
 */
export async function batch<T>(operations: BatchOperation<T>[]): Promise<void> {
  const db = await getDB();
  
  // Group operations by store
  const storeOperations = new Map<string, BatchOperation<T>[]>();
  for (const op of operations) {
    if (!storeOperations.has(op.store)) {
      storeOperations.set(op.store, []);
    }
    storeOperations.get(op.store)!.push(op);
  }
  
  // Execute operations per store
  const promises: Promise<void>[] = [];
  
  for (const [storeName, ops] of storeOperations) {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    for (const op of ops) {
      switch (op.type) {
        case 'add':
          if (op.data) store.add(op.data);
          break;
        case 'put':
          if (op.data) store.put(op.data);
          break;
        case 'delete':
          if (op.key) store.delete(op.key);
          break;
      }
    }
    
    promises.push(new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    }));
  }
  
  await Promise.all(promises);
}

/**
 * Get database storage info
 */
export async function getStorageInfo(): Promise<{
  usage: number;
  quota: number;
  percent: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    return {
      usage,
      quota,
      percent: quota > 0 ? (usage / quota) * 100 : 0
    };
  }
  
  // Fallback for browsers without storage API
  return {
    usage: 0,
    quota: 50 * 1024 * 1024, // 50MB default
    percent: 0
  };
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

/**
 * Check if storage is persistent
 */
export async function isStoragePersistent(): Promise<boolean> {
  if ('storage' in navigator && 'persisted' in navigator.storage) {
    return await navigator.storage.persisted();
  }
  return false;
}

/**
 * Export all data from a store
 */
export async function exportStore<T>(storeName: string): Promise<T[]> {
  return getAll<T>(storeName);
}

/**
 * Import data to a store
 */
export async function importStore<T>(storeName: string, data: T[]): Promise<void> {
  const operations: BatchOperation<T>[] = data.map(item => ({
    type: 'put',
    store: storeName,
    data: item
  }));
  
  await batch(operations);
}

/**
 * Create a backup of all stores
 */
export async function createBackup(): Promise<Record<string, any[]>> {
  const backup: Record<string, any[]> = {};
  
  for (const storeName of Object.keys(DB_CONFIG.stores)) {
    backup[storeName] = await exportStore(storeName);
  }
  
  return backup;
}

/**
 * Restore from backup
 */
export async function restoreBackup(backup: Record<string, any[]>): Promise<void> {
  for (const [storeName, data] of Object.entries(backup)) {
    if (DB_CONFIG.stores[storeName]) {
      await clear(storeName);
      await importStore(storeName, data);
    }
  }
}

/**
 * Delete the entire database
 */
export async function deleteDatabase(): Promise<void> {
  closeDB();
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_CONFIG.name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export utilities
export const indexedDBHelper = {
  getDB,
  closeDB,
  getTransaction,
  add,
  put,
  get,
  getAll,
  remove,
  clear,
  count,
  query,
  batch,
  getStorageInfo,
  requestPersistentStorage,
  isStoragePersistent,
  exportStore,
  importStore,
  createBackup,
  restoreBackup,
  deleteDatabase
};

export default indexedDBHelper;