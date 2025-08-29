import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface OfflineData {
  id: string;
  type: 'journal' | 'mood' | 'safety-plan' | 'coping-strategy';
  data: any;
  timestamp: number;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: OfflineData;
  attempts: number;
  lastAttempt?: number;
}

class EnhancedOfflineService {
  private isOnline: boolean = navigator.onLine;
  private offlineData: Map<string, OfflineData> = new Map();
  private syncQueue: SyncQueueItem[] = [];
  private syncInProgress: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initializeEventListeners();
    this.loadOfflineData();
  }

  private initializeEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.notifyListeners();
    this.startSync();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  private loadOfflineData(): void {
    try {
      const stored = localStorage.getItem('offline-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.offlineData = new Map(data);
      }

      const queueStored = localStorage.getItem('sync-queue');
      if (queueStored) {
        this.syncQueue = JSON.parse(queueStored);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private saveOfflineData(): void {
    try {
      localStorage.setItem('offline-data', JSON.stringify(Array.from(this.offlineData.entries())));
      localStorage.setItem('sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  async storeData(data: Omit<OfflineData, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const offlineData: OfflineData = {
      id,
      timestamp: Date.now(),
      synced: false,
      ...data
    };

    this.offlineData.set(id, offlineData);
    
    // Add to sync queue
    this.syncQueue.push({
      id: Date.now().toString(),
      action: 'create',
      data: offlineData,
      attempts: 0
    });

    this.saveOfflineData();

    if (this.isOnline) {
      this.startSync();
    }

    return id;
  }

  async updateData(id: string, updates: Partial<OfflineData['data']>): Promise<boolean> {
    const existing = this.offlineData.get(id);
    if (!existing) return false;

    const updated: OfflineData = {
      ...existing,
      data: { ...existing.data, ...updates },
      synced: false
    };

    this.offlineData.set(id, updated);
    
    // Add to sync queue
    this.syncQueue.push({
      id: Date.now().toString(),
      action: 'update',
      data: updated,
      attempts: 0
    });

    this.saveOfflineData();

    if (this.isOnline) {
      this.startSync();
    }

    return true;
  }

  async deleteData(id: string): Promise<boolean> {
    const existing = this.offlineData.get(id);
    if (!existing) return false;

    this.offlineData.delete(id);
    
    // Add to sync queue if it was previously synced
    if (existing.synced) {
      this.syncQueue.push({
        id: Date.now().toString(),
        action: 'delete',
        data: existing,
        attempts: 0
      });
    }

    this.saveOfflineData();

    if (this.isOnline) {
      this.startSync();
    }

    return true;
  }

  getData(id: string): OfflineData | undefined {
    return this.offlineData.get(id);
  }

  getAllData(type?: OfflineData['type']): OfflineData[] {
    const data = Array.from(this.offlineData.values());
    return type ? data.filter(item => item.type === type) : data;
  }

  private async startSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      const itemsToSync = this.syncQueue.filter(item => item.attempts < 3);
      
      for (const item of itemsToSync) {
        try {
          await this.syncItem(item);
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(qItem => qItem.id !== item.id);
          
          // Mark as synced
          if (this.offlineData.has(item.data.id)) {
            const data = this.offlineData.get(item.data.id)!;
            data.synced = true;
            this.offlineData.set(item.data.id, data);
          }
        } catch (error) {
          item.attempts++;
          item.lastAttempt = Date.now();
        }
      }

      this.saveOfflineData();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Sync failed');
    }
  }

  onConnectionChange(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isOnlineMode(): boolean {
    return this.isOnline;
  }

  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  getStorageSize(): number {
    return this.offlineData.size;
  }

  clearOfflineData(): void {
    this.offlineData.clear();
    this.syncQueue = [];
    this.saveOfflineData();
  }
}

describe('EnhancedOfflineService', () => {
  let service: EnhancedOfflineService;
  let mockOnLine: boolean;

  beforeEach(() => {
    mockOnLine = true;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: mockOnLine
    });
    
    localStorage.clear();
    service = new EnhancedOfflineService();
  });

  afterEach(() => {
    service.clearOfflineData();
  });

  it('should initialize with online status', () => {
    expect(service.isOnlineMode()).toBe(true);
  });

  it('should store data offline', async () => {
    const id = await service.storeData({
      type: 'journal',
      data: { content: 'Test journal entry', mood: 7 }
    });

    expect(id).toBeDefined();
    expect(service.getStorageSize()).toBe(1);

    const stored = service.getData(id);
    expect(stored?.data.content).toBe('Test journal entry');
  });

  it('should update stored data', async () => {
    const id = await service.storeData({
      type: 'mood',
      data: { rating: 5, notes: 'Feeling okay' }
    });

    const updated = await service.updateData(id, { rating: 7, notes: 'Feeling better' });
    
    expect(updated).toBe(true);
    
    const data = service.getData(id);
    expect(data?.data.rating).toBe(7);
    expect(data?.data.notes).toBe('Feeling better');
  });

  it('should delete stored data', async () => {
    const id = await service.storeData({
      type: 'safety-plan',
      data: { triggers: ['stress', 'loneliness'] }
    });

    const deleted = await service.deleteData(id);
    
    expect(deleted).toBe(true);
    expect(service.getData(id)).toBeUndefined();
    expect(service.getStorageSize()).toBe(0);
  });

  it('should get all data of specific type', async () => {
    await service.storeData({ type: 'journal', data: { content: 'Entry 1' } });
    await service.storeData({ type: 'mood', data: { rating: 8 } });
    await service.storeData({ type: 'journal', data: { content: 'Entry 2' } });

    const journalEntries = service.getAllData('journal');
    const allData = service.getAllData();

    expect(journalEntries).toHaveLength(2);
    expect(allData).toHaveLength(3);
  });

  it('should handle connection status changes', () => {
    const listener = jest.fn();
    const unsubscribe = service.onConnectionChange(listener);

    // Simulate going offline
    mockOnLine = false;
    window.dispatchEvent(new Event('offline'));

    expect(listener).toHaveBeenCalledWith(false);
    expect(service.isOnlineMode()).toBe(false);

    // Simulate going online
    mockOnLine = true;
    window.dispatchEvent(new Event('online'));

    expect(listener).toHaveBeenCalledWith(true);
    expect(service.isOnlineMode()).toBe(true);

    unsubscribe();
  });

  it('should queue items for sync', async () => {
    await service.storeData({
      type: 'coping-strategy',
      data: { strategy: 'Deep breathing', effectiveness: 8 }
    });

    expect(service.getPendingSyncCount()).toBeGreaterThan(0);
  });

  it('should persist data in localStorage', async () => {
    const id = await service.storeData({
      type: 'mood',
      data: { rating: 6, timestamp: Date.now() }
    });

    // Create new service instance
    const newService = new EnhancedOfflineService();
    
    const retrievedData = newService.getData(id);
    expect(retrievedData?.data.rating).toBe(6);
  });

  it('should handle localStorage errors gracefully', () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('localStorage full');
      });

    expect(async () => {
      await service.storeData({
        type: 'journal',
        data: { content: 'Test' }
      });
    }).not.toThrow();

    mockSetItem.mockRestore();
  });

  it('should clear all offline data', async () => {
    await service.storeData({ type: 'journal', data: { content: 'Test 1' } });
    await service.storeData({ type: 'mood', data: { rating: 5 } });

    expect(service.getStorageSize()).toBe(2);

    service.clearOfflineData();

    expect(service.getStorageSize()).toBe(0);
    expect(service.getPendingSyncCount()).toBe(0);
  });
});
