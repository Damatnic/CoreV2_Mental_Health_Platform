/**
 * Offline Data Service
 * 
 * Comprehensive offline data management service with IndexedDB integration,
 * intelligent sync strategies, and conflict resolution for mental health platform.
 * 
 * Features:
 * - IndexedDB management for offline storage
 * - Intelligent background sync with retry logic
 * - Conflict resolution strategies
 * - Data compression and optimization
 * - Queue management for offline operations
 * - Crisis data prioritization
 * - Selective data caching
 * 
 * @version 2.0.0
 * @license Apache-2.0
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database configuration
const DB_NAME = 'AstralCoreOfflineDB';
const DB_VERSION = 3;

// Sync configuration
const SYNC_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  BATCH_SIZE: 50,
  CONFLICT_RESOLUTION: 'client-wins' as ConflictResolution,
  COMPRESSION_THRESHOLD: 1024, // 1KB
  MAX_QUEUE_SIZE: 1000,
  STORAGE_QUOTA: 50 * 1024 * 1024 // 50MB
};

// Data types
export type DataType = 
  | 'mood-entry'
  | 'journal-entry'
  | 'assessment'
  | 'safety-plan'
  | 'crisis-report'
  | 'goal'
  | 'medication'
  | 'appointment'
  | 'crisis-contact'
  | 'user-preference'
  | 'therapy-note'
  | 'coping-strategy'
  | 'wellness-data';

export type SyncStatus = 
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'conflict';

export type ConflictResolution = 
  | 'client-wins'
  | 'server-wins'
  | 'merge'
  | 'manual';

export type Priority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Interfaces
export interface OfflineData<T = any> {
  id: string;
  type: DataType;
  data: T;
  userId: string;
  timestamp: Date;
  syncStatus: SyncStatus;
  version: number;
  checksum?: string;
  compressed?: boolean;
  priority: Priority;
  metadata: {
    deviceId: string;
    userAgent: string;
    offline: boolean;
    retryCount: number;
    lastSyncAttempt?: Date;
    conflictData?: any;
    size?: number;
  };
}

export interface SyncQueueItem {
  id?: number;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  timestamp: Date;
  retryCount: number;
  status: SyncStatus;
  priority: Priority;
  type: DataType;
  userId?: string;
}

export interface SyncConflict {
  id: string;
  dataId: string;
  type: DataType;
  clientData: any;
  serverData: any;
  clientTimestamp: Date;
  serverTimestamp: Date;
  resolution?: ConflictResolution;
  resolvedData?: any;
  resolvedAt?: Date;
  userId: string;
}

export interface OfflineCapabilities {
  storage: {
    used: number;
    quota: number;
    available: number;
  };
  features: {
    moodTracking: boolean;
    journaling: boolean;
    crisisResources: boolean;
    safetyPlan: boolean;
    breathingExercises: boolean;
    assessments: boolean;
    goals: boolean;
    medications: boolean;
    appointments: boolean;
  };
  syncStatus: {
    online: boolean;
    lastSync: Date | null;
    pendingItems: number;
    failedItems: number;
    conflicts: number;
  };
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: Array<{
    id: string;
    error: string;
    timestamp: Date;
  }>;
}

// Database schema
interface OfflineDB extends DBSchema {
  offlineData: {
    key: string;
    value: OfflineData;
    indexes: {
      'by-type': DataType;
      'by-status': SyncStatus;
      'by-user': string;
      'by-timestamp': Date;
      'by-priority': Priority;
    };
  };
  syncQueue: {
    key: number;
    value: SyncQueueItem;
    indexes: {
      'by-status': SyncStatus;
      'by-type': DataType;
      'by-priority': Priority;
      'by-timestamp': Date;
    };
  };
  conflicts: {
    key: string;
    value: SyncConflict;
    indexes: {
      'by-type': DataType;
      'by-user': string;
      'by-timestamp': Date;
    };
  };
  moodEntries: {
    key: number;
    value: {
      id?: number;
      userId: string;
      mood: number;
      activities: string[];
      notes: string;
      date: Date;
      synced: boolean;
    };
    indexes: {
      'by-user': string;
      'by-date': Date;
    };
  };
  journalEntries: {
    key: number;
    value: {
      id?: number;
      userId: string;
      title: string;
      content: string;
      tags: string[];
      date: Date;
      synced: boolean;
    };
    indexes: {
      'by-user': string;
      'by-date': Date;
    };
  };
  crisisReports: {
    key: number;
    value: {
      id?: number;
      userId: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      triggers: string[];
      copingUsed: string[];
      outcome: string;
      timestamp: Date;
      synced: boolean;
    };
    indexes: {
      'by-user': string;
      'by-severity': string;
      'by-timestamp': Date;
    };
  };
}

class OfflineDataService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private syncInProgress = false;
  private syncWorker: Worker | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeDB();
    this.setupEventListeners();
  }

  // Initialization
  private async initializeDB(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('offlineData')) {
            const store = db.createObjectStore('offlineData', { keyPath: 'id' });
            store.createIndex('by-type', 'type');
            store.createIndex('by-status', 'syncStatus');
            store.createIndex('by-user', 'userId');
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-priority', 'priority');
          }

          if (!db.objectStoreNames.contains('syncQueue')) {
            const store = db.createObjectStore('syncQueue', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            store.createIndex('by-status', 'status');
            store.createIndex('by-type', 'type');
            store.createIndex('by-priority', 'priority');
            store.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('conflicts')) {
            const store = db.createObjectStore('conflicts', { keyPath: 'id' });
            store.createIndex('by-type', 'type');
            store.createIndex('by-user', 'userId');
            store.createIndex('by-timestamp', 'clientTimestamp');
          }

          if (!db.objectStoreNames.contains('moodEntries')) {
            const store = db.createObjectStore('moodEntries', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            store.createIndex('by-user', 'userId');
            store.createIndex('by-date', 'date');
          }

          if (!db.objectStoreNames.contains('journalEntries')) {
            const store = db.createObjectStore('journalEntries', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            store.createIndex('by-user', 'userId');
            store.createIndex('by-date', 'date');
          }

          if (!db.objectStoreNames.contains('crisisReports')) {
            const store = db.createObjectStore('crisisReports', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            store.createIndex('by-user', 'userId');
            store.createIndex('by-severity', 'severity');
            store.createIndex('by-timestamp', 'timestamp');
          }
        }
      });

      console.log('[OfflineDataService] Database initialized');
    } catch (error) {
      console.error('[OfflineDataService] Failed to initialize database:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Listen for storage events
    window.addEventListener('storage', (e) => this.handleStorageChange(e));

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        this.handleServiceWorkerMessage(e);
      });
    }
  }

  // Event handlers
  private async handleOnline(): Promise<void> {
    console.log('[OfflineDataService] Connection restored, starting sync');
    this.emit('online', { timestamp: new Date() });
    await this.syncAll();
  }

  private handleOffline(): void {
    console.log('[OfflineDataService] Connection lost, switching to offline mode');
    this.emit('offline', { timestamp: new Date() });
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key?.startsWith('offline_')) {
      this.emit('storage-change', { 
        key: event.key, 
        oldValue: event.oldValue, 
        newValue: event.newValue 
      });
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'SYNC_COMPLETE':
        this.emit('sync-complete', payload);
        break;
      case 'SYNC_FAILED':
        this.emit('sync-failed', payload);
        break;
      case 'CONFLICT_DETECTED':
        this.handleConflict(payload);
        break;
    }
  }

  // Public API

  /**
   * Save data for offline use
   */
  public async saveOfflineData<T>(
    type: DataType,
    data: T,
    userId: string,
    priority: Priority = 'medium'
  ): Promise<string> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const id = `${type}_${userId}_${Date.now()}`;
    const offlineData: OfflineData<T> = {
      id,
      type,
      data,
      userId,
      timestamp: new Date(),
      syncStatus: 'pending',
      version: 1,
      priority,
      metadata: {
        deviceId: this.getDeviceId(),
        userAgent: navigator.userAgent,
        offline: !navigator.onLine,
        retryCount: 0,
        size: JSON.stringify(data).length
      }
    };

    // Compress if needed
    if (offlineData.metadata.size && offlineData.metadata.size > SYNC_CONFIG.COMPRESSION_THRESHOLD) {
      offlineData.data = await this.compressData(data);
      offlineData.compressed = true;
    }

    // Calculate checksum
    offlineData.checksum = await this.calculateChecksum(data);

    // Save to IndexedDB
    await this.db.put('offlineData', offlineData);

    // Queue for sync if online
    if (navigator.onLine) {
      await this.queueForSync(type, id, priority);
    }

    this.emit('data-saved', { id, type, userId });
    return id;
  }

  /**
   * Get offline data by ID
   */
  public async getOfflineData<T>(id: string): Promise<OfflineData<T> | undefined> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const data = await this.db.get('offlineData', id);
    
    if (data && data.compressed) {
      data.data = await this.decompressData(data.data);
    }

    return data as OfflineData<T> | undefined;
  }

  /**
   * Get all offline data by type
   */
  public async getOfflineDataByType<T>(
    type: DataType,
    userId?: string
  ): Promise<OfflineData<T>[]> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('offlineData', 'readonly');
    const index = tx.store.index('by-type');
    let data = await index.getAll(type);

    if (userId) {
      data = data.filter(item => item.userId === userId);
    }

    // Decompress data if needed
    for (const item of data) {
      if (item.compressed) {
        item.data = await this.decompressData(item.data);
      }
    }

    return data as OfflineData<T>[];
  }

  /**
   * Queue data for sync
   */
  public async queueForSync(
    type: DataType,
    dataId: string,
    priority: Priority = 'medium'
  ): Promise<void> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const queueItem: SyncQueueItem = {
      url: `/api/${type}/sync`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true'
      },
      body: dataId,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending',
      priority,
      type,
      userId: await this.getCurrentUserId()
    };

    await this.db.add('syncQueue', queueItem);

    // Trigger sync if online
    if (navigator.onLine && !this.syncInProgress) {
      setTimeout(() => this.processSyncQueue(), 1000);
    }
  }

  /**
   * Process sync queue
   */
  public async processSyncQueue(): Promise<SyncResult> {
    if (!this.db || this.syncInProgress) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: []
      };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    };

    try {
      // Get pending items from queue
      const tx = this.db.transaction('syncQueue', 'readonly');
      const index = tx.store.index('by-status');
      const pendingItems = await index.getAll('pending');

      // Sort by priority and timestamp
      pendingItems.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      // Process in batches
      for (let i = 0; i < pendingItems.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + SYNC_CONFIG.BATCH_SIZE);
        await this.processSyncBatch(batch, result);
      }

    } catch (error) {
      console.error('[OfflineDataService] Sync queue processing failed:', error);
      result.success = false;
    } finally {
      this.syncInProgress = false;
      this.emit('sync-complete', result);
    }

    return result;
  }

  /**
   * Process a batch of sync items
   */
  private async processSyncBatch(
    batch: SyncQueueItem[],
    result: SyncResult
  ): Promise<void> {
    if (!this.db) return;

    for (const item of batch) {
      try {
        // Get the actual data
        const offlineData = await this.getOfflineData(item.body || '');
        if (!offlineData) {
          throw new Error(`Data not found: ${item.body}`);
        }

        // Send to server
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(offlineData.data)
        });

        if (response.ok) {
          // Success - remove from queue and mark as synced
          await this.db.delete('syncQueue', item.id!);
          offlineData.syncStatus = 'synced';
          await this.db.put('offlineData', offlineData);
          result.synced++;
        } else if (response.status === 409) {
          // Conflict detected
          const serverData = await response.json();
          await this.handleConflict({
            clientData: offlineData,
            serverData,
            type: item.type
          });
          result.conflicts++;
        } else {
          // Failed - update retry count
          item.retryCount++;
          if (item.retryCount >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
            item.status = 'failed';
            result.failed++;
            result.errors.push({
              id: item.body || '',
              error: `Failed after ${SYNC_CONFIG.MAX_RETRY_ATTEMPTS} attempts`,
              timestamp: new Date()
            });
          }
          await this.db.put('syncQueue', item);
        }
      } catch (error) {
        // Network or other error
        item.retryCount++;
        if (item.retryCount >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
          item.status = 'failed';
          result.failed++;
        }
        await this.db.put('syncQueue', item);

        result.errors.push({
          id: item.body || '',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(conflict: any): Promise<void> {
    if (!this.db) return;

    const conflictRecord: SyncConflict = {
      id: `conflict_${Date.now()}`,
      dataId: conflict.clientData.id,
      type: conflict.type,
      clientData: conflict.clientData.data,
      serverData: conflict.serverData,
      clientTimestamp: conflict.clientData.timestamp,
      serverTimestamp: new Date(conflict.serverData.timestamp),
      userId: conflict.clientData.userId
    };

    // Apply conflict resolution strategy
    switch (SYNC_CONFIG.CONFLICT_RESOLUTION) {
      case 'client-wins':
        conflictRecord.resolution = 'client-wins';
        conflictRecord.resolvedData = conflict.clientData.data;
        break;
      case 'server-wins':
        conflictRecord.resolution = 'server-wins';
        conflictRecord.resolvedData = conflict.serverData;
        break;
      case 'merge':
        conflictRecord.resolvedData = this.mergeData(
          conflict.clientData.data,
          conflict.serverData
        );
        conflictRecord.resolution = 'merge';
        break;
      case 'manual':
        // Store for manual resolution
        await this.db.put('conflicts', conflictRecord);
        this.emit('conflict-detected', conflictRecord);
        return;
    }

    conflictRecord.resolvedAt = new Date();
    await this.db.put('conflicts', conflictRecord);

    // Update the offline data with resolved version
    const offlineData = await this.getOfflineData(conflict.clientData.id);
    if (offlineData) {
      offlineData.data = conflictRecord.resolvedData;
      offlineData.syncStatus = 'synced';
      offlineData.version++;
      await this.db.put('offlineData', offlineData);
    }
  }

  /**
   * Sync all pending data
   */
  public async syncAll(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: [{ 
          id: 'sync-all', 
          error: 'Device is offline', 
          timestamp: new Date() 
        }]
      };
    }

    // Sync different data types in priority order
    const results: SyncResult[] = [];

    // Crisis data first
    results.push(await this.syncDataType('crisis-report'));
    results.push(await this.syncDataType('safety-plan'));
    
    // Then health data
    results.push(await this.syncDataType('mood-entry'));
    results.push(await this.syncDataType('journal-entry'));
    results.push(await this.syncDataType('assessment'));
    
    // Finally other data
    results.push(await this.syncDataType('goal'));
    results.push(await this.syncDataType('medication'));
    results.push(await this.syncDataType('appointment'));

    // Process sync queue
    results.push(await this.processSyncQueue());

    // Aggregate results
    return results.reduce((acc, curr) => ({
      success: acc.success && curr.success,
      synced: acc.synced + curr.synced,
      failed: acc.failed + curr.failed,
      conflicts: acc.conflicts + curr.conflicts,
      errors: [...acc.errors, ...curr.errors]
    }), {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    });
  }

  /**
   * Sync specific data type
   */
  private async syncDataType(type: DataType): Promise<SyncResult> {
    if (!this.db) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: []
      };
    }

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    };

    try {
      const data = await this.getOfflineDataByType(type);
      const pendingData = data.filter(item => item.syncStatus === 'pending');

      for (const item of pendingData) {
        await this.queueForSync(type, item.id, item.priority);
      }

      // Process the queue for this type
      const tx = this.db.transaction('syncQueue', 'readonly');
      const index = tx.store.index('by-type');
      const queueItems = await index.getAll(type);
      
      await this.processSyncBatch(queueItems, result);

    } catch (error) {
      console.error(`[OfflineDataService] Failed to sync ${type}:`, error);
      result.success = false;
    }

    return result;
  }

  /**
   * Get offline capabilities status
   */
  public async getCapabilities(): Promise<OfflineCapabilities> {
    const storage = await this.getStorageStatus();
    const syncStatus = await this.getSyncStatus();

    return {
      storage,
      features: {
        moodTracking: true,
        journaling: true,
        crisisResources: true,
        safetyPlan: true,
        breathingExercises: true,
        assessments: true,
        goals: true,
        medications: true,
        appointments: true
      },
      syncStatus
    };
  }

  /**
   * Get storage status
   */
  private async getStorageStatus(): Promise<OfflineCapabilities['storage']> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || SYNC_CONFIG.STORAGE_QUOTA,
        available: (estimate.quota || SYNC_CONFIG.STORAGE_QUOTA) - (estimate.usage || 0)
      };
    }

    return {
      used: 0,
      quota: SYNC_CONFIG.STORAGE_QUOTA,
      available: SYNC_CONFIG.STORAGE_QUOTA
    };
  }

  /**
   * Get sync status
   */
  private async getSyncStatus(): Promise<OfflineCapabilities['syncStatus']> {
    if (!this.db) {
      return {
        online: navigator.onLine,
        lastSync: null,
        pendingItems: 0,
        failedItems: 0,
        conflicts: 0
      };
    }

    const pendingCount = await this.db.countFromIndex('syncQueue', 'by-status', 'pending');
    const failedCount = await this.db.countFromIndex('syncQueue', 'by-status', 'failed');
    const conflictCount = await this.db.count('conflicts');

    // Get last sync time from localStorage
    const lastSyncStr = localStorage.getItem('offline_last_sync');
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

    return {
      online: navigator.onLine,
      lastSync,
      pendingItems: pendingCount,
      failedItems: failedCount,
      conflicts: conflictCount
    };
  }

  /**
   * Clear all offline data
   */
  public async clearAll(): Promise<void> {
    if (!this.db) return;

    const stores: (keyof OfflineDB)[] = [
      'offlineData',
      'syncQueue',
      'conflicts',
      'moodEntries',
      'journalEntries',
      'crisisReports'
    ];

    for (const store of stores) {
      await this.db.clear(store);
    }

    localStorage.removeItem('offline_last_sync');
    this.emit('data-cleared', { timestamp: new Date() });
  }

  /**
   * Save mood entry offline
   */
  public async saveMoodEntry(
    userId: string,
    mood: number,
    activities: string[],
    notes: string
  ): Promise<number> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const entry = {
      userId,
      mood,
      activities,
      notes,
      date: new Date(),
      synced: false
    };

    const id = await this.db.add('moodEntries', entry);

    // Queue for sync
    await this.queueForSync('mood-entry', `mood_${id}`, 'medium');

    return id;
  }

  /**
   * Save journal entry offline
   */
  public async saveJournalEntry(
    userId: string,
    title: string,
    content: string,
    tags: string[]
  ): Promise<number> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const entry = {
      userId,
      title,
      content,
      tags,
      date: new Date(),
      synced: false
    };

    const id = await this.db.add('journalEntries', entry);

    // Queue for sync
    await this.queueForSync('journal-entry', `journal_${id}`, 'low');

    return id;
  }

  /**
   * Save crisis report offline
   */
  public async saveCrisisReport(
    userId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    triggers: string[],
    copingUsed: string[],
    outcome: string
  ): Promise<number> {
    if (!this.db) await this.initializeDB();
    if (!this.db) throw new Error('Database not initialized');

    const report = {
      userId,
      severity,
      triggers,
      copingUsed,
      outcome,
      timestamp: new Date(),
      synced: false
    };

    const id = await this.db.add('crisisReports', report);

    // Queue for sync with high priority
    await this.queueForSync('crisis-report', `crisis_${id}`, 'critical');

    // Notify service worker for immediate sync attempt
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_DATA',
        payload: { type: 'crisis-report', id: `crisis_${id}` }
      });
    }

    return id;
  }

  // Utility methods

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('offline_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('offline_device_id', deviceId);
    }
    return deviceId;
  }

  private async getCurrentUserId(): Promise<string> {
    // Get from auth context or localStorage
    return localStorage.getItem('user_id') || 'anonymous';
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression using JSON string manipulation
    // In production, use a proper compression library
    const jsonStr = JSON.stringify(data);
    return btoa(jsonStr);
  }

  private async decompressData(data: any): Promise<any> {
    // Decompress data
    const jsonStr = atob(data);
    return JSON.parse(jsonStr);
  }

  private async calculateChecksum(data: any): Promise<string> {
    // Simple checksum calculation
    const jsonStr = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private mergeData(clientData: any, serverData: any): any {
    // Simple merge strategy - in production, implement proper merging
    return {
      ...serverData,
      ...clientData,
      merged: true,
      mergedAt: new Date()
    };
  }

  // Event emitter methods

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}

// Export singleton instance
export const offlineDataService = new OfflineDataService();
export default offlineDataService;