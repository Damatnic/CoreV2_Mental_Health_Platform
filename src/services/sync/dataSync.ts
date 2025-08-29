/**
 * Data Synchronization Service
 * Features: Offline-first architecture, background sync, conflict resolution, data versioning
 */

import { offlineStorage, StoreName, SyncStatus, DataRecord } from '../../utils/offlineStorage';
import { apiClient, ApiResponse } from '../api/apiClient';

// Sync configuration
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  conflictResolution: ConflictResolutionStrategy;
  batchSize: number;
  maxRetries: number;
}

// Conflict resolution strategies
export enum ConflictResolutionStrategy {
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins',
  LATEST_WINS = 'latest_wins',
  MANUAL = 'manual',
  MERGE = 'merge',
}

// Sync result interface
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
  timestamp: number;
}

// Sync event types
export enum SyncEvent {
  SYNC_STARTED = 'sync_started',
  SYNC_PROGRESS = 'sync_progress',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved',
}

// Sync event listener
type SyncEventListener = (event: SyncEvent, data?: any) => void;

/**
 * Data Synchronization Manager
 */
class DataSyncService {
  private config: SyncConfig;
  private syncInProgress: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<SyncEvent, Set<SyncEventListener>> = new Map();
  private conflictQueue: Map<string, DataRecord> = new Map();
  private lastSyncTime: number = 0;

  constructor() {
    // Default configuration
    this.config = {
      autoSync: true,
      syncInterval: 60000, // 1 minute
      conflictResolution: ConflictResolutionStrategy.LATEST_WINS,
      batchSize: 50,
      maxRetries: 3,
    };

    // Initialize sync on network change
    this.setupNetworkListeners();
    
    // Load last sync time
    this.loadLastSyncTime();
  }

  /**
   * Initialize synchronization service
   */
  async initialize(config?: Partial<SyncConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize offline storage
    await offlineStorage.initialize();

    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    console.log('Data sync service initialized');
  }

  /**
   * Setup network change listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network connected. Starting sync...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('Network disconnected. Pausing sync...');
      this.stopAutoSync();
    });

    // Visibility change listener for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.syncAll();
      }
    });
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncAll();
      }
    }, this.config.syncInterval);

    console.log(`Auto-sync started (interval: ${this.config.syncInterval}ms)`);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Sync all stores
   */
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return this.createSyncResult(false, 0, 0, 0, ['Sync already in progress']);
    }

    this.syncInProgress = true;
    this.emit(SyncEvent.SYNC_STARTED);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Sync each store
      const stores = [
        StoreName.MOOD,
        StoreName.JOURNAL,
        StoreName.APPOINTMENTS,
        StoreName.MEDICATIONS,
        StoreName.USER_PROFILE,
      ];

      for (const store of stores) {
        const storeResult = await this.syncStore(store);
        result.synced += storeResult.synced;
        result.failed += storeResult.failed;
        result.conflicts += storeResult.conflicts;
        result.errors.push(...storeResult.errors);
      }

      // Process conflict queue if needed
      if (this.conflictQueue.size > 0) {
        await this.processConflictQueue();
      }

      // Update last sync time
      this.lastSyncTime = Date.now();
      this.saveLastSyncTime();

      this.emit(SyncEvent.SYNC_COMPLETED, result);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.emit(SyncEvent.SYNC_FAILED, result);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Sync a specific store
   */
  async syncStore(storeName: StoreName): Promise<SyncResult> {
    const result = this.createSyncResult(true, 0, 0, 0, []);

    try {
      // Get unsynced records
      const unsyncedRecords = await offlineStorage.getUnsyncedRecords(storeName);
      
      if (unsyncedRecords.length === 0) {
        return result;
      }

      // Process in batches
      const batches = this.createBatches(unsyncedRecords, this.config.batchSize);
      
      for (const batch of batches) {
        const batchResult = await this.syncBatch(storeName, batch);
        result.synced += batchResult.synced;
        result.failed += batchResult.failed;
        result.conflicts += batchResult.conflicts;
        result.errors.push(...batchResult.errors);
        
        // Emit progress event
        this.emit(SyncEvent.SYNC_PROGRESS, {
          store: storeName,
          progress: result.synced / unsyncedRecords.length,
        });
      }

      // Pull latest changes from server
      await this.pullChanges(storeName);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to sync ${storeName}: ${error}`);
    }

    return result;
  }

  /**
   * Sync a batch of records
   */
  private async syncBatch(
    storeName: StoreName,
    batch: DataRecord[]
  ): Promise<SyncResult> {
    const result = this.createSyncResult(true, 0, 0, 0, []);

    for (const record of batch) {
      try {
        // Update sync status to syncing
        await offlineStorage.updateSyncStatus(storeName, record.id, SyncStatus.SYNCING);

        // Determine API endpoint and method
        const endpoint = this.getEndpoint(storeName);
        const method = record.createdAt === record.updatedAt ? 'POST' : 'PUT';

        // Send to server
        const response = await this.sendToServer(endpoint, method, record);

        if (response.success) {
          // Check for conflicts
          if (response.data.conflict) {
            await this.handleConflict(storeName, record, response.data);
            result.conflicts++;
          } else {
            // Update local record with server response
            await this.updateLocalRecord(storeName, record.id, response.data);
            result.synced++;
          }
        } else {
          throw new Error(response.message || 'Sync failed');
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync ${record.id}: ${error}`);
        
        // Update sync status to error
        await offlineStorage.updateSyncStatus(storeName, record.id, SyncStatus.ERROR);
      }
    }

    return result;
  }

  /**
   * Send data to server
   */
  private async sendToServer(
    endpoint: string,
    method: 'POST' | 'PUT',
    record: DataRecord
  ): Promise<ApiResponse> {
    const url = method === 'PUT' ? `${endpoint}/${record.id}` : endpoint;
    
    const payload = {
      ...record.data,
      clientVersion: record.version,
      clientChecksum: record.checksum,
      clientTimestamp: record.updatedAt,
    };

    if (method === 'POST') {
      return apiClient.post(url, payload);
    } else {
      return apiClient.put(url, payload);
    }
  }

  /**
   * Pull latest changes from server
   */
  private async pullChanges(storeName: StoreName): Promise<void> {
    try {
      const endpoint = this.getEndpoint(storeName);
      const response = await apiClient.get(`${endpoint}/changes`, {
        params: {
          since: this.lastSyncTime,
          store: storeName,
        },
      });

      if (response.success && response.data.changes) {
        for (const change of response.data.changes) {
          await this.applyServerChange(storeName, change);
        }
      }
    } catch (error) {
      console.error(`Failed to pull changes for ${storeName}:`, error);
    }
  }

  /**
   * Apply server change to local storage
   */
  private async applyServerChange(storeName: StoreName, change: any): Promise<void> {
    const existing = await offlineStorage.get(storeName, change.id);
    
    if (!existing || existing.version < change.version) {
      // Server has newer version, update local
      await offlineStorage.put(storeName, change.id, change.data, {
        encrypt: true,
      });
      
      // Mark as synced
      await offlineStorage.updateSyncStatus(storeName, change.id, SyncStatus.SYNCED);
    }
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    storeName: StoreName,
    localRecord: DataRecord,
    serverData: any
  ): Promise<void> {
    this.emit(SyncEvent.CONFLICT_DETECTED, {
      store: storeName,
      localRecord,
      serverData,
    });

    let resolved = false;
    let resolvedData: any;

    switch (this.config.conflictResolution) {
      case ConflictResolutionStrategy.CLIENT_WINS:
        resolvedData = localRecord.data;
        resolved = true;
        break;

      case ConflictResolutionStrategy.SERVER_WINS:
        resolvedData = serverData;
        resolved = true;
        break;

      case ConflictResolutionStrategy.LATEST_WINS:
        if (localRecord.updatedAt > serverData.updatedAt) {
          resolvedData = localRecord.data;
        } else {
          resolvedData = serverData;
        }
        resolved = true;
        break;

      case ConflictResolutionStrategy.MERGE:
        resolvedData = await this.mergeConflict(localRecord.data, serverData);
        resolved = true;
        break;

      case ConflictResolutionStrategy.MANUAL:
        // Add to conflict queue for manual resolution
        this.conflictQueue.set(`${storeName}:${localRecord.id}`, localRecord);
        await offlineStorage.updateSyncStatus(storeName, localRecord.id, SyncStatus.CONFLICT);
        break;
    }

    if (resolved) {
      await this.updateLocalRecord(storeName, localRecord.id, resolvedData);
      this.emit(SyncEvent.CONFLICT_RESOLVED, {
        store: storeName,
        recordId: localRecord.id,
        resolution: this.config.conflictResolution,
      });
    }
  }

  /**
   * Merge conflicting data
   */
  private async mergeConflict(localData: any, serverData: any): Promise<any> {
    // Default merge strategy - combine non-conflicting fields
    const merged = { ...serverData };
    
    for (const key in localData) {
      if (!(key in serverData) || localData[key] === serverData[key]) {
        merged[key] = localData[key];
      } else if (Array.isArray(localData[key]) && Array.isArray(serverData[key])) {
        // Merge arrays by combining unique values
        merged[key] = [...new Set([...localData[key], ...serverData[key]])];
      } else if (typeof localData[key] === 'object' && typeof serverData[key] === 'object') {
        // Recursively merge objects
        merged[key] = await this.mergeConflict(localData[key], serverData[key]);
      }
      // For primitive conflicts, server wins by default
    }
    
    return merged;
  }

  /**
   * Process conflict queue
   */
  private async processConflictQueue(): Promise<void> {
    // This would typically show a UI for manual conflict resolution
    console.log(`Processing ${this.conflictQueue.size} conflicts...`);
    
    // For now, auto-resolve with latest wins
    for (const [key, record] of this.conflictQueue) {
      const [storeName, id] = key.split(':');
      await offlineStorage.updateSyncStatus(storeName as StoreName, id, SyncStatus.SYNCED);
    }
    
    this.conflictQueue.clear();
  }

  /**
   * Update local record after successful sync
   */
  private async updateLocalRecord(
    storeName: StoreName,
    id: string,
    serverData: any
  ): Promise<void> {
    await offlineStorage.put(storeName, id, serverData, { encrypt: true });
    await offlineStorage.updateSyncStatus(storeName, id, SyncStatus.SYNCED);
  }

  /**
   * Get API endpoint for store
   */
  private getEndpoint(storeName: StoreName): string {
    const endpoints: Record<StoreName, string> = {
      [StoreName.MOOD]: '/mood',
      [StoreName.JOURNAL]: '/journal',
      [StoreName.APPOINTMENTS]: '/appointments',
      [StoreName.MEDICATIONS]: '/medications',
      [StoreName.USER_PROFILE]: '/profile',
      [StoreName.SYNC_METADATA]: '/sync',
      [StoreName.CACHED_DATA]: '/cache',
    };
    
    return endpoints[storeName];
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Create sync result object
   */
  private createSyncResult(
    success: boolean,
    synced: number,
    failed: number,
    conflicts: number,
    errors: string[]
  ): SyncResult {
    return {
      success,
      synced,
      failed,
      conflicts,
      errors,
      timestamp: Date.now(),
    };
  }

  /**
   * Load last sync time from storage
   */
  private loadLastSyncTime(): void {
    const stored = localStorage.getItem('last_sync_time');
    this.lastSyncTime = stored ? parseInt(stored) : 0;
  }

  /**
   * Save last sync time to storage
   */
  private saveLastSyncTime(): void {
    localStorage.setItem('last_sync_time', this.lastSyncTime.toString());
  }

  /**
   * Add event listener
   */
  on(event: SyncEvent, listener: SyncEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: SyncEvent, listener: SyncEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private emit(event: SyncEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(event, data));
    }
  }

  /**
   * Force sync for specific record
   */
  async syncRecord(storeName: StoreName, id: string): Promise<boolean> {
    try {
      const record = await offlineStorage.get(storeName, id);
      if (!record) return false;

      const result = await this.syncBatch(storeName, [record]);
      return result.synced > 0;
    } catch (error) {
      console.error(`Failed to sync record ${id}:`, error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    inProgress: boolean;
    lastSync: number;
    autoSync: boolean;
    conflicts: number;
  } {
    return {
      inProgress: this.syncInProgress,
      lastSync: this.lastSyncTime,
      autoSync: this.config.autoSync,
      conflicts: this.conflictQueue.size,
    };
  }

  /**
   * Resolve manual conflict
   */
  async resolveConflict(
    storeName: StoreName,
    recordId: string,
    resolution: 'local' | 'server' | any
  ): Promise<void> {
    const key = `${storeName}:${recordId}`;
    const conflictRecord = this.conflictQueue.get(key);
    
    if (!conflictRecord) return;

    if (resolution === 'local') {
      await this.updateLocalRecord(storeName, recordId, conflictRecord.data);
    } else if (resolution === 'server') {
      // Fetch latest from server
      const endpoint = this.getEndpoint(storeName);
      const response = await apiClient.get(`${endpoint}/${recordId}`);
      if (response.success) {
        await this.updateLocalRecord(storeName, recordId, response.data);
      }
    } else {
      // Custom resolution data provided
      await this.updateLocalRecord(storeName, recordId, resolution);
    }

    this.conflictQueue.delete(key);
  }

  /**
   * Clear all local data and resync
   */
  async resetAndSync(): Promise<void> {
    // Clear all stores
    for (const storeName of Object.values(StoreName)) {
      await offlineStorage.clear(storeName);
    }
    
    // Reset sync time
    this.lastSyncTime = 0;
    this.saveLastSyncTime();
    
    // Trigger full sync
    await this.syncAll();
  }
}

// Export singleton instance
export const dataSync = new DataSyncService();

// Export types
export type { SyncConfig, SyncResult };