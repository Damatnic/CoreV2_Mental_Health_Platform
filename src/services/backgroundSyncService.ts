/**
 * Background Sync Service
 *
 * Handles offline data synchronization using Background Sync API
 * with fallback to periodic sync for broader browser support
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Priority-based sync queue
 * - Crisis data priority synchronization
 * - Batch sync optimization
 * - Conflict resolution
 * - Network-aware synchronization
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { storageService } from './storageService';
import { networkDetection } from '../utils/networkDetection';
import { performanceService } from './performanceService';

// Sync Request Interface
interface SyncRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  priority: SyncPriority;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  backoffMultiplier: number;
  tags: string[];
  metadata?: Record<string, any>;
}

// Sync Priority Enum
type SyncPriority = 'critical' | 'high' | 'medium' | 'low';

// Sync Result Interface
interface SyncResult {
  requestId: string;
  success: boolean;
  response?: Response;
  error?: Error;
  timestamp: Date;
  duration: number;
  retryCount: number;
}

// Sync Configuration Interface
interface SyncConfiguration {
  maxRetries: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  batchSize: number;
  syncIntervalMs: number;
  networkTimeoutMs: number;
  enablePriorityQueue: boolean;
  enableBatching: boolean;
  enableConflictResolution: boolean;
}

// Conflict Resolution Strategy
interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolver?: (clientData: any, serverData: any) => any;
}

// Sync Statistics Interface
interface SyncStatistics {
  totalRequests: number;
  successfulSyncs: number;
  failedSyncs: number;
  pendingRequests: number;
  averageSyncTime: number;
  lastSyncTime: Date | null;
  networkStatus: 'online' | 'offline' | 'slow';
}

// Main Service Interface
interface BackgroundSyncService {
  // Queue Management
  queueRequest(request: Omit<SyncRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string>;
  cancelRequest(requestId: string): Promise<boolean>;
  clearQueue(): Promise<void>;
  getQueueStatus(): Promise<SyncStatistics>;
  
  // Sync Operations
  syncNow(): Promise<SyncResult[]>;
  syncRequest(requestId: string): Promise<SyncResult>;
  batchSync(requestIds: string[]): Promise<SyncResult[]>;
  
  // Configuration
  updateConfiguration(config: Partial<SyncConfiguration>): Promise<void>;
  getConfiguration(): SyncConfiguration;
  
  // Event Handling
  onSyncComplete(callback: (result: SyncResult) => void): void;
  onSyncError(callback: (error: Error, request: SyncRequest) => void): void;
  onNetworkChange(callback: (isOnline: boolean) => void): void;
  
  // Utilities
  registerServiceWorker(): Promise<boolean>;
  getStoredRequests(): Promise<SyncRequest[]>;
}

// Default Configuration
const DEFAULT_CONFIG: SyncConfiguration = {
  maxRetries: 3,
  baseBackoffMs: 1000,
  maxBackoffMs: 30000,
  batchSize: 5,
  syncIntervalMs: 30000, // 30 seconds
  networkTimeoutMs: 10000, // 10 seconds
  enablePriorityQueue: true,
  enableBatching: true,
  enableConflictResolution: true
};

// Priority Weights for Queue Sorting
const PRIORITY_WEIGHTS: Record<SyncPriority, number> = {
  'critical': 4,
  'high': 3,
  'medium': 2,
  'low': 1
};

// Implementation
class BackgroundSyncServiceImpl implements BackgroundSyncService {
  private syncQueue: SyncRequest[] = [];
  private config: SyncConfiguration = { ...DEFAULT_CONFIG };
  private syncInterval?: ReturnType<typeof setTimeout>;
  private isOnline = navigator.onLine;
  private syncCallbacks: ((result: SyncResult) => void)[] = [];
  private errorCallbacks: ((error: Error, request: SyncRequest) => void)[] = [];
  private networkCallbacks: ((isOnline: boolean) => void)[] = [];
  private statistics: SyncStatistics = {
    totalRequests: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingRequests: 0,
    averageSyncTime: 0,
    lastSyncTime: null,
    networkStatus: 'online'
  };

  constructor() {
    this.initializeService();
    this.setupNetworkListeners();
    this.loadStoredRequests();
    this.startPeriodicSync();
  }

  async queueRequest(request: Omit<SyncRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const syncRequest: SyncRequest = {
        ...request,
        id: this.generateRequestId(),
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: request.maxRetries || this.config.maxRetries,
        backoffMultiplier: request.backoffMultiplier || 1.5
      };

      // Add to queue
      this.syncQueue.push(syncRequest);
      
      // Sort by priority if enabled
      if (this.config.enablePriorityQueue) {
        this.sortQueueByPriority();
      }
      
      // Store persistently
      await this.persistQueue();
      
      // Update statistics
      this.statistics.totalRequests++;
      this.statistics.pendingRequests++;
      
      // Try immediate sync if online and high priority
      if (this.isOnline && (syncRequest.priority === 'critical' || syncRequest.priority === 'high')) {
        this.syncRequest(syncRequest.id).catch(error => {
          logger.debug('Immediate sync failed, will retry later', { error, requestId: syncRequest.id });
        });
      }
      
      logger.info('Request queued for background sync', {
        requestId: syncRequest.id,
        priority: syncRequest.priority,
        method: syncRequest.method,
        url: syncRequest.url
      });
      
      return syncRequest.id;
    } catch (error) {
      logger.error('Failed to queue sync request', { error });
      throw error;
    }
  }

  async cancelRequest(requestId: string): Promise<boolean> {
    try {
      const index = this.syncQueue.findIndex(req => req.id === requestId);
      
      if (index === -1) {
        return false;
      }
      
      this.syncQueue.splice(index, 1);
      await this.persistQueue();
      
      this.statistics.pendingRequests--;
      
      logger.info('Sync request cancelled', { requestId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel sync request', { error, requestId });
      return false;
    }
  }

  async clearQueue(): Promise<void> {
    try {
      this.syncQueue = [];
      await this.persistQueue();
      
      this.statistics.pendingRequests = 0;
      
      logger.info('Sync queue cleared');
    } catch (error) {
      logger.error('Failed to clear sync queue', { error });
      throw error;
    }
  }

  async getQueueStatus(): Promise<SyncStatistics> {
    this.statistics.pendingRequests = this.syncQueue.length;
    this.statistics.networkStatus = this.isOnline ? 'online' : 'offline';
    
    return { ...this.statistics };
  }

  async syncNow(): Promise<SyncResult[]> {
    try {
      if (!this.isOnline) {
        logger.warn('Cannot sync now - offline');
        return [];
      }
      
      const results: SyncResult[] = [];
      const requestsToSync = [...this.syncQueue];
      
      if (this.config.enableBatching) {
        // Process in batches
        for (let i = 0; i < requestsToSync.length; i += this.config.batchSize) {
          const batch = requestsToSync.slice(i, i + this.config.batchSize);
          const batchResults = await this.processBatch(batch);
          results.push(...batchResults);
        }
      } else {
        // Process individually
        for (const request of requestsToSync) {
          const result = await this.processRequest(request);
          results.push(result);
        }
      }
      
      // Remove successful requests from queue
      const successfulIds = results.filter(r => r.success).map(r => r.requestId);
      this.syncQueue = this.syncQueue.filter(req => !successfulIds.includes(req.id));
      
      await this.persistQueue();
      this.updateStatistics(results);
      
      logger.info('Sync completed', {
        totalRequests: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
      
      return results;
    } catch (error) {
      logger.error('Sync operation failed', { error });
      throw error;
    }
  }

  async syncRequest(requestId: string): Promise<SyncResult> {
    try {
      const request = this.syncQueue.find(req => req.id === requestId);
      
      if (!request) {
        throw new Error(`Request not found: ${requestId}`);
      }
      
      const result = await this.processRequest(request);
      
      if (result.success) {
        // Remove from queue
        this.syncQueue = this.syncQueue.filter(req => req.id !== requestId);
        await this.persistQueue();
      }
      
      this.updateStatistics([result]);
      
      return result;
    } catch (error) {
      logger.error('Failed to sync individual request', { error, requestId });
      throw error;
    }
  }

  async batchSync(requestIds: string[]): Promise<SyncResult[]> {
    try {
      const requests = this.syncQueue.filter(req => requestIds.includes(req.id));
      const results = await this.processBatch(requests);
      
      // Remove successful requests from queue
      const successfulIds = results.filter(r => r.success).map(r => r.requestId);
      this.syncQueue = this.syncQueue.filter(req => !successfulIds.includes(req.id));
      
      await this.persistQueue();
      this.updateStatistics(results);
      
      return results;
    } catch (error) {
      logger.error('Batch sync failed', { error, requestIds });
      throw error;
    }
  }

  async updateConfiguration(config: Partial<SyncConfiguration>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      
      // Restart periodic sync if interval changed
      if (config.syncIntervalMs) {
        this.stopPeriodicSync();
        this.startPeriodicSync();
      }
      
      logger.info('Background sync configuration updated', { config });
    } catch (error) {
      logger.error('Failed to update configuration', { error });
      throw error;
    }
  }

  getConfiguration(): SyncConfiguration {
    return { ...this.config };
  }

  onSyncComplete(callback: (result: SyncResult) => void): void {
    this.syncCallbacks.push(callback);
  }

  onSyncError(callback: (error: Error, request: SyncRequest) => void): void {
    this.errorCallbacks.push(callback);
  }

  onNetworkChange(callback: (isOnline: boolean) => void): void {
    this.networkCallbacks.push(callback);
  }

  async registerServiceWorker(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        logger.warn('Service Worker not supported');
        return false;
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Listen for sync events
      registration.addEventListener('sync', (event: any) => {
        if (event.tag === 'background-sync') {
          event.waitUntil(this.syncNow());
        }
      });
      
      logger.info('Service Worker registered for background sync');
      return true;
    } catch (error) {
      logger.error('Failed to register Service Worker', { error });
      return false;
    }
  }

  async getStoredRequests(): Promise<SyncRequest[]> {
    return [...this.syncQueue];
  }

  // Private helper methods
  private async initializeService(): Promise<void> {
    try {
      // Check network status
      this.isOnline = navigator.onLine;
      
      // Register service worker if available
      await this.registerServiceWorker();
      
      logger.info('Background sync service initialized', {
        isOnline: this.isOnline,
        config: this.config
      });
    } catch (error) {
      logger.error('Failed to initialize background sync service', { error });
    }
  }

  private setupNetworkListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyNetworkChange(true);
      
      // Trigger sync when coming back online
      this.syncNow().catch(error => {
        logger.error('Auto-sync on network restore failed', { error });
      });
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyNetworkChange(false);
    });
    
    // Check network quality periodically
    setInterval(() => {
      const quality = networkDetection.getNetworkQuality();
      if (quality === 'poor') {
        this.statistics.networkStatus = 'slow';
      } else if (this.isOnline) {
        this.statistics.networkStatus = 'online';
      } else {
        this.statistics.networkStatus = 'offline';
      }
    }, 10000);
  }

  private async loadStoredRequests(): Promise<void> {
    try {
      const stored = storageService.getItem('background_sync_queue');
      
      if (stored) {
        const requests = JSON.parse(stored) as SyncRequest[];
        this.syncQueue = requests.map(req => ({
          ...req,
          timestamp: new Date(req.timestamp)
        }));
        
        this.statistics.pendingRequests = this.syncQueue.length;
        
        logger.info('Loaded stored sync requests', { count: this.syncQueue.length });
      }
    } catch (error) {
      logger.error('Failed to load stored sync requests', { error });
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      storageService.setItem('background_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      logger.error('Failed to persist sync queue', { error });
    }
  }

  private sortQueueByPriority(): void {
    this.syncQueue.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by timestamp (older first)
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  private async processBatch(requests: SyncRequest[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    // Process requests in parallel with limited concurrency
    const concurrency = Math.min(3, requests.length);
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(request => this.processRequest(request));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            requestId: batch[index].id,
            success: false,
            error: result.reason,
            timestamp: new Date(),
            duration: 0,
            retryCount: batch[index].retryCount
          });
        }
      });
    }
    
    return results;
  }

  private async processRequest(request: SyncRequest): Promise<SyncResult> {
    const startTime = performance.now();
    
    try {
      // Check if we should retry this request
      if (request.retryCount >= request.maxRetries) {
        throw new Error(`Max retries exceeded for request ${request.id}`);
      }
      
      // Apply backoff delay if this is a retry
      if (request.retryCount > 0) {
        const backoffMs = Math.min(
          this.config.baseBackoffMs * Math.pow(request.backoffMultiplier, request.retryCount),
          this.config.maxBackoffMs
        );
        await this.delay(backoffMs);
      }
      
      // Create request
      const fetchRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: AbortSignal.timeout(this.config.networkTimeoutMs)
      });
      
      // Perform request
      const response = await fetch(fetchRequest);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const duration = performance.now() - startTime;
      
      const result: SyncResult = {
        requestId: request.id,
        success: true,
        response: response.clone(),
        timestamp: new Date(),
        duration,
        retryCount: request.retryCount
      };
      
      // Notify success callbacks
      this.syncCallbacks.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          logger.error('Sync callback error', { error });
        }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Increment retry count
      request.retryCount++;
      
      const result: SyncResult = {
        requestId: request.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date(),
        duration,
        retryCount: request.retryCount
      };
      
      // Notify error callbacks
      this.errorCallbacks.forEach(callback => {
        try {
          callback(result.error!, request);
        } catch (callbackError) {
          logger.error('Error callback error', { error: callbackError });
        }
      });
      
      logger.warn('Sync request failed', {
        requestId: request.id,
        error: error instanceof Error ? error.message : String(error),
        retryCount: request.retryCount,
        maxRetries: request.maxRetries
      });
      
      return result;
    }
  }

  private updateStatistics(results: SyncResult[]): void {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    this.statistics.successfulSyncs += successful;
    this.statistics.failedSyncs += failed;
    this.statistics.lastSyncTime = new Date();
    
    // Update average sync time
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / results.length;
    
    this.statistics.averageSyncTime = 
      (this.statistics.averageSyncTime + avgDuration) / 2;
  }

  private notifyNetworkChange(isOnline: boolean): void {
    this.networkCallbacks.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        logger.error('Network change callback error', { error });
      }
    });
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        try {
          await this.syncNow();
        } catch (error) {
          logger.error('Periodic sync failed', { error });
        }
      }
    }, this.config.syncIntervalMs);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  private generateRequestId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncServiceImpl();
export type { 
  BackgroundSyncService, 
  SyncRequest, 
  SyncResult, 
  SyncConfiguration, 
  SyncStatistics,
  SyncPriority,
  ConflictResolution 
};
