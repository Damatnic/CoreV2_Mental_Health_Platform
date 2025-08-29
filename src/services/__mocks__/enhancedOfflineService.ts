/**
 * Mock Enhanced Offline Service
 * 
 * Provides mock implementations for offline functionality testing
 */

interface OfflineQueueItem {
  id: string;
  type: 'api_call' | 'file_upload' | 'user_action' | 'chat_message';
  endpoint?: string;
  method?: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
}

interface OfflineStorageItem {
  key: string;
  data: any;
  timestamp: Date;
  expiry?: Date;
  size: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
  failedItems: number;
  syncInProgress: boolean;
}

class MockEnhancedOfflineService {
  private isOffline = false;
  private queue: OfflineQueueItem[] = [];
  private storage: Map<string, OfflineStorageItem> = new Map();
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private storageListeners: ((key: string, data: any) => void)[] = [];

  // Mock network status
  setOffline(offline: boolean): void {
    this.isOffline = offline;
    if (!offline) {
      setTimeout(() => this.processSyncQueue(), 100);
    }
    this.notifySyncListeners();
  }

  isOnline(): boolean {
    return !this.isOffline;
  }

  // Queue management
  async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    };

    this.queue.push(queueItem);
    this.notifySyncListeners();
    
    // If online, process immediately
    if (this.isOnline()) {
      setTimeout(() => this.processSyncQueue(), 0);
    }

    return queueItem.id;
  }

  getQueueStatus(): { pending: number; failed: number; total: number } {
    const failed = this.queue.filter(item => item.retryCount >= item.maxRetries).length;
    return {
      pending: this.queue.length - failed,
      failed,
      total: this.queue.length
    };
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    this.notifySyncListeners();
  }

  async processSyncQueue(): Promise<void> {
    if (this.isOffline || this.queue.length === 0) return;

    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const sortedQueue = [...this.queue].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.priority);
      const bPriority = priorityOrder.indexOf(b.priority);
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    for (const item of sortedQueue) {
      if (item.retryCount >= item.maxRetries) continue;

      try {
        await this.processQueueItem(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        item.retryCount++;
        console.warn(`Queue item ${item.id} failed (${item.retryCount}/${item.maxRetries}):`, error);
      }
    }

    this.notifySyncListeners();
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    // Mock processing based on item type
    switch (item.type) {
      case 'api_call':
        await this.mockApiCall(item);
        break;
      case 'file_upload':
        await this.mockFileUpload(item);
        break;
      case 'user_action':
        await this.mockUserAction(item);
        break;
      case 'chat_message':
        await this.mockChatMessage(item);
        break;
    }
  }

  private async mockApiCall(item: OfflineQueueItem): Promise<void> {
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Random failure for testing (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error(`Mock API call failed for ${item.endpoint}`);
    }
  }

  private async mockFileUpload(item: OfflineQueueItem): Promise<void> {
    const fileSize = item.data?.size || 1024;
    const uploadTime = Math.max(500, fileSize / 1000); // Simulate upload time
    
    await new Promise(resolve => setTimeout(resolve, uploadTime));
    
    // 5% failure rate for uploads
    if (Math.random() < 0.05) {
      throw new Error('Mock file upload failed');
    }
  }

  private async mockUserAction(item: OfflineQueueItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Very low failure rate for user actions
    if (Math.random() < 0.02) {
      throw new Error('Mock user action failed');
    }
  }

  private async mockChatMessage(item: OfflineQueueItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 3% failure rate for chat messages
    if (Math.random() < 0.03) {
      throw new Error('Mock chat message delivery failed');
    }
  }

  private removeFromQueue(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  // Storage management
  async setOfflineData(key: string, data: any, ttl?: number): Promise<void> {
    const size = JSON.stringify(data).length;
    const expiry = ttl ? new Date(Date.now() + ttl) : undefined;

    const item: OfflineStorageItem = {
      key,
      data,
      timestamp: new Date(),
      expiry,
      size
    };

    this.storage.set(key, item);
    this.notifyStorageListeners(key, data);
  }

  async getOfflineData<T>(key: string): Promise<T | null> {
    const item = this.storage.get(key);
    if (!item) return null;

    // Check expiry
    if (item.expiry && new Date() > item.expiry) {
      this.storage.delete(key);
      return null;
    }

    return item.data as T;
  }

  async removeOfflineData(key: string): Promise<void> {
    const removed = this.storage.delete(key);
    if (removed) {
      this.notifyStorageListeners(key, null);
    }
  }

  async clearOfflineData(): Promise<void> {
    const keys = Array.from(this.storage.keys());
    this.storage.clear();
    keys.forEach(key => this.notifyStorageListeners(key, null));
  }

  getStorageStats(): { totalItems: number; totalSize: number; keys: string[] } {
    const items = Array.from(this.storage.values());
    return {
      totalItems: items.length,
      totalSize: items.reduce((sum, item) => sum + item.size, 0),
      keys: Array.from(this.storage.keys())
    };
  }

  // Cache management
  async getCachedData<T>(key: string): Promise<T | null> {
    return this.getOfflineData<T>(`cache:${key}`);
  }

  async setCachedData(key: string, data: any, ttl = 300000): Promise<void> {
    return this.setOfflineData(`cache:${key}`, data, ttl);
  }

  async invalidateCache(pattern?: string): Promise<void> {
    const keys = Array.from(this.storage.keys());
    const cacheKeys = keys.filter(key => key.startsWith('cache:'));
    
    if (pattern) {
      const regex = new RegExp(pattern);
      const matchingKeys = cacheKeys.filter(key => regex.test(key));
      for (const key of matchingKeys) {
        this.storage.delete(key);
      }
    } else {
      for (const key of cacheKeys) {
        this.storage.delete(key);
      }
    }
  }

  // Sync strategies
  async smartSync(): Promise<{ synced: number; failed: number }> {
    if (this.isOffline) {
      return { synced: 0, failed: 0 };
    }

    const initialCount = this.queue.length;
    await this.processSyncQueue();
    const currentCount = this.queue.length;
    const failedCount = this.queue.filter(item => item.retryCount >= item.maxRetries).length;

    return {
      synced: initialCount - currentCount,
      failed: failedCount
    };
  }

  async prioritySync(priority: OfflineQueueItem['priority']): Promise<void> {
    if (this.isOffline) return;

    const priorityItems = this.queue.filter(item => item.priority === priority);
    
    for (const item of priorityItems) {
      try {
        await this.processQueueItem(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        item.retryCount++;
      }
    }

    this.notifySyncListeners();
  }

  // Event listeners
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    
    // Initial call
    callback(this.getSyncStatus());
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  onStorageChange(callback: (key: string, data: any) => void): () => void {
    this.storageListeners.push(callback);
    
    return () => {
      const index = this.storageListeners.indexOf(callback);
      if (index > -1) {
        this.storageListeners.splice(index, 1);
      }
    };
  }

  private getSyncStatus(): SyncStatus {
    const queueStatus = this.getQueueStatus();
    
    return {
      isOnline: this.isOnline(),
      lastSync: this.queue.length === 0 ? new Date() : null,
      pendingItems: queueStatus.pending,
      failedItems: queueStatus.failed,
      syncInProgress: false // Mock service doesn't track this
    };
  }

  private notifySyncListeners(): void {
    const status = this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  private notifyStorageListeners(key: string, data: any): void {
    this.storageListeners.forEach(listener => {
      try {
        listener(key, data);
      } catch (error) {
        console.error('Error in storage change listener:', error);
      }
    });
  }

  // Test utilities
  getQueueItems(): OfflineQueueItem[] {
    return [...this.queue];
  }

  getStorageItems(): OfflineStorageItem[] {
    return Array.from(this.storage.values());
  }

  simulateNetworkError(): void {
    this.setOffline(true);
    setTimeout(() => this.setOffline(false), 3000);
  }

  simulateSlowNetwork(delay = 2000): void {
    const originalProcessItem = this.processQueueItem.bind(this);
    this.processQueueItem = async (item) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalProcessItem(item);
    };

    setTimeout(() => {
      this.processQueueItem = originalProcessItem;
    }, 10000);
  }

  reset(): void {
    this.isOffline = false;
    this.queue = [];
    this.storage.clear();
    this.syncListeners = [];
    this.storageListeners = [];
  }
}

// Export singleton mock instance
export const mockEnhancedOfflineService = new MockEnhancedOfflineService();

// Export the class for creating additional instances if needed
export default MockEnhancedOfflineService;

// Mock factory functions
export const createMockOfflineService = () => new MockEnhancedOfflineService();

export const createOfflineScenario = (scenario: 'no_connection' | 'slow_connection' | 'intermittent') => {
  const service = new MockEnhancedOfflineService();
  
  switch (scenario) {
    case 'no_connection':
      service.setOffline(true);
      break;
    case 'slow_connection':
      service.simulateSlowNetwork(5000);
      break;
    case 'intermittent':
      service.setOffline(true);
      setTimeout(() => service.setOffline(false), 2000);
      setTimeout(() => service.setOffline(true), 5000);
      setTimeout(() => service.setOffline(false), 8000);
      break;
  }
  
  return service;
};



