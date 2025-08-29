/**
 * Enhanced Offline Service
 *
 * Advanced offline capabilities for mental health platform with intelligent
 * data synchronization, conflict resolution, and crisis-ready offline mode.
 * Ensures critical mental health features work without internet connectivity.
 *
 * @fileoverview Enhanced offline service with intelligent sync and crisis support
 * @version 2.0.0
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '../utils/logger';
import { intelligentCache } from './intelligentCachingService';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type DataType = 
  | 'mood-entry'
  | 'journal-entry'
  | 'assessment'
  | 'safety-plan'
  | 'goal'
  | 'medication'
  | 'appointment'
  | 'crisis-contact'
  | 'user-preference'
  | 'therapy-note';

export type ConflictResolution = 'client-wins' | 'server-wins' | 'merge' | 'manual';

export interface OfflineData {
  id: string;
  type: DataType;
  data: any;
  timestamp: Date;
  userId: string;
  syncStatus: SyncStatus;
  version: number;
  checksum: string;
  metadata: {
    deviceId: string;
    userAgent: string;
    offline: boolean;
    retryCount: number;
    lastSyncAttempt?: Date;
    conflictData?: any;
  };
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
}

export interface OfflineCapabilities {
  moodTracking: boolean;
  journaling: boolean;
  crisisResources: boolean;
  safetyPlan: boolean;
  breathingExercises: boolean;
  assessments: boolean;
  goals: boolean;
  medications: boolean;
}

export interface SyncMetrics {
  totalPendingItems: number;
  syncSuccessRate: number;
  averageSyncTime: number;
  conflictCount: number;
  lastSyncTime: Date | null;
  dataByType: Record<DataType, number>;
  networkStatus: 'online' | 'offline' | 'slow';
}

interface OfflineDB extends DBSchema {
  offlineData: {
    key: string;
    value: OfflineData;
    indexes: {
      'by-type': DataType;
      'by-status': SyncStatus;
      'by-user': string;
      'by-timestamp': Date;
    };
  };
  conflicts: {
    key: string;
    value: SyncConflict;
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      priority: number;
      scheduledTime: Date;
      retryCount: number;
    };
  };
  offlineAssets: {
    key: string;
    value: {
      url: string;
      data: ArrayBuffer;
      contentType: string;
      timestamp: Date;
    };
  };
}

class EnhancedOfflineService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private deviceId = '';
  private userId = '';
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();
  private syncQueue: Map<string, any> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly CONFLICT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupNetworkListeners();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>('enhanced-offline', 1, {
        upgrade(db) {
          // Main offline data store
          const offlineStore = db.createObjectStore('offlineData');
          offlineStore.createIndex('by-type', 'type');
          offlineStore.createIndex('by-status', 'syncStatus');
          offlineStore.createIndex('by-user', 'userId');
          offlineStore.createIndex('by-timestamp', 'timestamp');

          // Sync conflicts
          db.createObjectStore('conflicts');

          // Sync queue for prioritization
          db.createObjectStore('syncQueue');

          // Offline assets (images, audio, etc.)
          db.createObjectStore('offlineAssets');
        },
      });

      // Start sync timer
      this.startSyncTimer();
      
      // Preload critical offline assets
      await this.preloadCriticalAssets();
      
      logger.info('EnhancedOfflineService initialized');
    } catch (error) {
      logger.error('Failed to initialize EnhancedOfflineService:', error);
    }
  }

  public async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    
    // Load pending data for this user
    await this.loadPendingSyncData();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('network-status-changed', { online: true });
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('network-status-changed', { online: false });
    });
  }

  public async storeOfflineData(
    type: DataType,
    data: any,
    options: {
      priority?: number;
      immediateSync?: boolean;
    } = {}
  ): Promise<string> {
    if (!this.db) throw new Error('Offline service not initialized');

    const id = this.generateId();
    const timestamp = new Date();
    
    const offlineData: OfflineData = {
      id,
      type,
      data: this.sanitizeData(data),
      timestamp,
      userId: this.userId,
      syncStatus: 'pending',
      version: 1,
      checksum: await this.calculateChecksum(data),
      metadata: {
        deviceId: this.deviceId,
        userAgent: navigator.userAgent,
        offline: !this.isOnline,
        retryCount: 0
      }
    };

    try {
      // Store in offline database
      await this.db.put('offlineData', offlineData, id);
      
      // Add to sync queue with priority
      await this.addToSyncQueue(id, options.priority || this.getPriorityForType(type));
      
      // Immediate sync if requested and online
      if (options.immediateSync && this.isOnline) {
        this.syncItem(id);
      }
      
      this.emit('data-stored-offline', { id, type, data: offlineData });
      
      logger.debug(`Stored offline data: ${type}`, { id, offline: !this.isOnline });
      
      return id;
    } catch (error) {
      logger.error('Failed to store offline data:', error);
      throw error;
    }
  }

  private getPriorityForType(type: DataType): number {
    // Crisis-related data gets highest priority
    const priorities: Record<DataType, number> = {
      'crisis-contact': 1,
      'safety-plan': 1,
      'mood-entry': 2,
      'assessment': 2,
      'medication': 3,
      'appointment': 3,
      'journal-entry': 4,
      'goal': 5,
      'therapy-note': 5,
      'user-preference': 6
    };
    
    return priorities[type] || 5;
  }

  public async getOfflineData(
    type?: DataType,
    status?: SyncStatus
  ): Promise<OfflineData[]> {
    if (!this.db) return [];

    try {
      let data: OfflineData[];
      
      if (type) {
        data = await this.db.getAllFromIndex('offlineData', 'by-type', type);
      } else {
        data = await this.db.getAll('offlineData');
      }
      
      if (status) {
        data = data.filter(item => item.syncStatus === status);
      }
      
      // Filter by current user
      return data.filter(item => item.userId === this.userId);
    } catch (error) {
      logger.error('Failed to get offline data:', error);
      return [];
    }
  }

  private async addToSyncQueue(dataId: string, priority: number): Promise<void> {
    if (!this.db) return;

    const queueItem = {
      id: dataId,
      priority,
      scheduledTime: new Date(),
      retryCount: 0
    };

    await this.db.put('syncQueue', queueItem, dataId);
  }

  private async syncItem(dataId: string): Promise<boolean> {
    if (!this.db || !this.isOnline) return false;

    try {
      const data = await this.db.get('offlineData', dataId);
      if (!data || data.syncStatus === 'synced') return true;

      // Update status to syncing
      data.syncStatus = 'syncing';
      data.metadata.lastSyncAttempt = new Date();
      await this.db.put('offlineData', data, dataId);

      // Attempt to sync with server
      const success = await this.syncWithServer(data);
      
      if (success) {
        data.syncStatus = 'synced';
        await this.db.put('offlineData', data, dataId);
        await this.db.delete('syncQueue', dataId);
        
        this.emit('data-synced', { id: dataId, type: data.type });
        return true;
      } else {
        // Handle sync failure
        data.syncStatus = 'failed';
        data.metadata.retryCount++;
        await this.db.put('offlineData', data, dataId);
        
        // Schedule retry if under max attempts
        if (data.metadata.retryCount < this.MAX_RETRY_ATTEMPTS) {
          await this.scheduleRetry(dataId, data.metadata.retryCount);
        }
        
        return false;
      }
    } catch (error) {
      logger.error(`Failed to sync item ${dataId}:`, error);
      return false;
    }
  }

  private async syncWithServer(data: OfflineData): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      const response = await fetch(`/api/${data.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          id: data.id,
          data: data.data,
          timestamp: data.timestamp,
          checksum: data.checksum,
          version: data.version
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check for conflicts
        if (result.conflict) {
          await this.handleSyncConflict(data, result.serverData);
          return false;
        }
        
        return true;
      } else if (response.status === 409) {
        // Conflict detected
        const conflictData = await response.json();
        await this.handleSyncConflict(data, conflictData);
        return false;
      }
      
      return false;
    } catch (error) {
      logger.error('Server sync failed:', error);
      return false;
    }
  }

  private async handleSyncConflict(clientData: OfflineData, serverData: any): Promise<void> {
    if (!this.db) return;

    const conflict: SyncConflict = {
      id: this.generateId(),
      dataId: clientData.id,
      type: clientData.type,
      clientData: clientData.data,
      serverData: serverData,
      clientTimestamp: clientData.timestamp,
      serverTimestamp: new Date(serverData.timestamp)
    };

    await this.db.put('conflicts', conflict, conflict.id);
    
    // Update data status
    clientData.syncStatus = 'conflict';
    clientData.metadata.conflictData = serverData;
    await this.db.put('offlineData', clientData, clientData.id);
    
    this.emit('sync-conflict', { conflict });
    
    // Auto-resolve if possible
    const resolution = this.determineAutoResolution(conflict);
    if (resolution) {
      await this.resolveConflict(conflict.id, resolution);
    }
  }

  private determineAutoResolution(conflict: SyncConflict): ConflictResolution | null {
    // Auto-resolve based on data type and timestamps
    
    // For safety-critical data, prefer most recent
    if (['crisis-contact', 'safety-plan'].includes(conflict.type)) {
      return conflict.clientTimestamp > conflict.serverTimestamp ? 'client-wins' : 'server-wins';
    }
    
    // For mood and journal entries, prefer client data (user's device)
    if (['mood-entry', 'journal-entry'].includes(conflict.type)) {
      return 'client-wins';
    }
    
    // For preferences, merge if possible
    if (conflict.type === 'user-preference') {
      return 'merge';
    }
    
    // Default to manual resolution for complex conflicts
    return null;
  }

  public async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    customData?: any
  ): Promise<void> {
    if (!this.db) return;

    try {
      const conflict = await this.db.get('conflicts', conflictId);
      if (!conflict) return;

      const data = await this.db.get('offlineData', conflict.dataId);
      if (!data) return;

      let resolvedData: any;
      
      switch (resolution) {
        case 'client-wins':
          resolvedData = conflict.clientData;
          break;
          
        case 'server-wins':
          resolvedData = conflict.serverData;
          break;
          
        case 'merge':
          resolvedData = this.mergeData(conflict.clientData, conflict.serverData);
          break;
          
        case 'manual':
          resolvedData = customData;
          break;
      }

      // Update conflict record
      conflict.resolution = resolution;
      conflict.resolvedData = resolvedData;
      conflict.resolvedAt = new Date();
      await this.db.put('conflicts', conflict, conflictId);

      // Update data with resolved version
      data.data = resolvedData;
      data.syncStatus = 'pending';
      data.version++;
      data.checksum = await this.calculateChecksum(resolvedData);
      await this.db.put('offlineData', data, data.id);

      // Re-add to sync queue
      await this.addToSyncQueue(data.id, this.getPriorityForType(data.type));
      
      this.emit('conflict-resolved', { conflictId, resolution });
      
      logger.info(`Conflict resolved: ${conflictId}`, { resolution });
    } catch (error) {
      logger.error('Failed to resolve conflict:', error);
    }
  }

  private mergeData(clientData: any, serverData: any): any {
    // Simple merge strategy - in practice this would be more sophisticated
    if (typeof clientData === 'object' && typeof serverData === 'object') {
      return { ...serverData, ...clientData };
    }
    
    // For non-objects, prefer client data
    return clientData;
  }

  private startSyncTimer(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.triggerSync();
      }
    }, this.SYNC_INTERVAL);
  }

  public async triggerSync(): Promise<void> {
    if (!this.db || this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    
    try {
      // Get sync queue ordered by priority and retry count
      const queueItems = await this.db.getAll('syncQueue');
      const sortedQueue = queueItems.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.retryCount - b.retryCount;
      });

      let syncedCount = 0;
      let failedCount = 0;

      // Process queue items
      for (const queueItem of sortedQueue.slice(0, 10)) { // Limit batch size
        const success = await this.syncItem(queueItem.id);
        if (success) {
          syncedCount++;
        } else {
          failedCount++;
        }
      }

      this.emit('sync-completed', { 
        synced: syncedCount, 
        failed: failedCount,
        remaining: queueItems.length - syncedCount
      });

      logger.debug(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);
    } catch (error) {
      logger.error('Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async scheduleRetry(dataId: string, retryCount: number): Promise<void> {
    if (!this.db) return;

    const queueItem = await this.db.get('syncQueue', dataId);
    if (queueItem) {
      // Exponential backoff: 2^retryCount minutes
      const delayMinutes = Math.pow(2, retryCount);
      queueItem.scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000);
      queueItem.retryCount = retryCount;
      
      await this.db.put('syncQueue', queueItem, dataId);
    }
  }

  private async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      '/crisis-resources.html',
      '/breathing-exercise-audio.mp3',
      '/safety-plan-template.json',
      '/crisis-contacts.json',
      '/offline-mood-tracker.js'
    ];

    for (const assetUrl of criticalAssets) {
      try {
        const response = await fetch(assetUrl);
        if (response.ok) {
          const data = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          
          await this.storeOfflineAsset(assetUrl, data, contentType);
        }
      } catch (error) {
        logger.debug(`Failed to preload asset: ${assetUrl}`, error);
      }
    }
  }

  private async storeOfflineAsset(
    url: string,
    data: ArrayBuffer,
    contentType: string
  ): Promise<void> {
    if (!this.db) return;

    const asset = {
      url,
      data,
      contentType,
      timestamp: new Date()
    };

    await this.db.put('offlineAssets', asset, url);
  }

  public async getOfflineAsset(url: string): Promise<ArrayBuffer | null> {
    if (!this.db) return null;

    try {
      const asset = await this.db.get('offlineAssets', url);
      return asset ? asset.data : null;
    } catch (error) {
      logger.error(`Failed to get offline asset: ${url}`, error);
      return null;
    }
  }

  public getOfflineCapabilities(): OfflineCapabilities {
    return {
      moodTracking: true,
      journaling: true,
      crisisResources: true,
      safetyPlan: true,
      breathingExercises: true,
      assessments: true,
      goals: true,
      medications: true
    };
  }

  public async getSyncMetrics(): Promise<SyncMetrics> {
    if (!this.db) {
      return {
        totalPendingItems: 0,
        syncSuccessRate: 0,
        averageSyncTime: 0,
        conflictCount: 0,
        lastSyncTime: null,
        dataByType: {} as Record<DataType, number>,
        networkStatus: this.isOnline ? 'online' : 'offline'
      };
    }

    try {
      const pendingData = await this.getOfflineData(undefined, 'pending');
      const syncedData = await this.getOfflineData(undefined, 'synced');
      const conflicts = await this.db.getAll('conflicts');
      
      const totalItems = pendingData.length + syncedData.length;
      const successRate = totalItems > 0 ? syncedData.length / totalItems : 0;
      
      // Group data by type
      const dataByType = [...pendingData, ...syncedData].reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<DataType, number>);
      
      // Get last sync time
      const lastSyncedItem = syncedData
        .filter(item => item.metadata.lastSyncAttempt)
        .sort((a, b) => 
          (b.metadata.lastSyncAttempt?.getTime() || 0) - 
          (a.metadata.lastSyncAttempt?.getTime() || 0)
        )[0];

      return {
        totalPendingItems: pendingData.length,
        syncSuccessRate: successRate,
        averageSyncTime: 0, // Would need to track sync durations
        conflictCount: conflicts.length,
        lastSyncTime: lastSyncedItem?.metadata.lastSyncAttempt || null,
        dataByType,
        networkStatus: this.isOnline ? 'online' : 'offline'
      };
    } catch (error) {
      logger.error('Failed to get sync metrics:', error);
      throw error;
    }
  }

  private async loadPendingSyncData(): Promise<void> {
    const pendingData = await this.getOfflineData(undefined, 'pending');
    
    // Add pending items back to sync queue
    for (const item of pendingData) {
      await this.addToSyncQueue(item.id, this.getPriorityForType(item.type));
    }
  }

  private sanitizeData(data: any): any {
    // Remove sensitive information that shouldn't be stored offline
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Remove tokens, passwords, etc.
      delete sanitized.authToken;
      delete sanitized.password;
      delete sanitized.sessionKey;
      
      return sanitized;
    }
    
    return data;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateId(): string {
    return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  }

  private getAuthToken(): string {
    // In a real implementation, get from secure storage
    return localStorage.getItem('auth-token') || '';
  }

  public addEventListener(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public removeEventListener(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error(`Error in offline service event listener (${event}):`, error);
        }
      });
    }
  }

  public async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(
        ['offlineData', 'conflicts', 'syncQueue', 'offlineAssets'],
        'readwrite'
      );
      
      await Promise.all([
        tx.objectStore('offlineData').clear(),
        tx.objectStore('conflicts').clear(),
        tx.objectStore('syncQueue').clear(),
        tx.objectStore('offlineAssets').clear(),
        tx.done
      ]);
      
      this.emit('offline-data-cleared', {});
      logger.info('Offline data cleared');
    } catch (error) {
      logger.error('Failed to clear offline data:', error);
    }
  }
}

export const enhancedOfflineService = new EnhancedOfflineService();
export default enhancedOfflineService;
