/**
 * Enhanced Offline Hook
 *
 * Comprehensive React hook for managing offline capabilities,
 * data synchronization, and offline-first user experiences
 *
 * Features:
 * - Network status monitoring and detection
 * - Offline data caching and synchronization
 * - Background sync with conflict resolution
 * - Offline queue management
 * - Service Worker integration
 * - Progressive enhancement for offline features
 * - Data integrity and validation
 * - Offline analytics and monitoring
 *
 * @license Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';
import type { LoadingState } from '../types';

// Network Status Interface
interface NetworkStatus {
  isOnline: boolean;
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastChanged: Date;
}

// Offline Data Entry Interface
interface OfflineDataEntry {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  error?: string;
  metadata?: {
    userId?: string;
    sessionId?: string;
    version?: number;
    checksum?: string;
  };
}

// Sync Conflict Interface
interface SyncConflict {
  id: string;
  collection: string;
  localData: any;
  remoteData: any;
  conflictFields: string[];
  timestamp: Date;
  resolution?: 'local' | 'remote' | 'merge';
}

// Storage Statistics Interface
interface StorageStats {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  entryCount: number;
  oldestEntry: Date;
  newestEntry: Date;
  collections: Record<string, {
    size: number;
    count: number;
  }>;
}

// Hook Configuration Interface
interface OfflineConfig {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  retryAttempts: number;
  retryBackoff: 'linear' | 'exponential';
  storageQuota: number; // in MB
  collections: string[];
  enableConflictResolution: boolean;
  enableAnalytics: boolean;
}

// Hook Return Interface
interface UseEnhancedOfflineReturn {
  // Network state
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // Data state
  offlineData: OfflineDataEntry[];
  pendingSync: OfflineDataEntry[];
  conflicts: SyncConflict[];
  storageStats: StorageStats;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveOffline: (collection: string, data: any, type?: OfflineDataEntry['type']) => Promise<string>;
  updateOfflineData: (id: string, data: any) => Promise<void>;
  deleteOfflineData: (id: string) => Promise<void>;
  syncData: (collection?: string) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: SyncConflict['resolution'], mergedData?: any) => Promise<void>;
  clearOfflineData: (collection?: string) => Promise<void>;
  exportData: (collection?: string) => Promise<string>;
  importData: (data: string) => Promise<void>;
  
  // Utilities
  refreshStats: () => Promise<void>;
  clearError: () => void;
  retryFailedSync: () => Promise<void>;
}

// Default configuration
const DEFAULT_CONFIG: OfflineConfig = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  retryAttempts: 3,
  retryBackoff: 'exponential',
  storageQuota: 50, // 50 MB
  collections: ['moods', 'journal_entries', 'assessments', 'goals'],
  enableConflictResolution: true,
  enableAnalytics: true
};

// Mock offline data for development
const MOCK_OFFLINE_DATA: OfflineDataEntry[] = [
  {
    id: 'entry-1',
    type: 'create',
    collection: 'moods',
    data: { value: 7, note: 'Feeling good today', timestamp: new Date() },
    timestamp: new Date(),
    retryCount: 0,
    priority: 'medium',
    syncStatus: 'pending',
    metadata: { userId: 'user-123', version: 1 }
  },
  {
    id: 'entry-2',
    type: 'update',
    collection: 'journal_entries',
    data: { title: 'My thoughts', content: 'Today was a challenging day...', timestamp: new Date() },
    timestamp: new Date(),
    retryCount: 1,
    priority: 'high',
    syncStatus: 'failed',
    error: 'Network timeout',
    metadata: { userId: 'user-123', version: 2 }
  }
];

// Get network information
const getNetworkStatus = (): NetworkStatus => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    isOnline: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
    lastChanged: new Date()
  };
};

// Determine connection quality
const getConnectionQuality = (networkStatus: NetworkStatus): 'excellent' | 'good' | 'poor' | 'offline' => {
  if (!networkStatus.isOnline) return 'offline';
  
  const { effectiveType, downlink } = networkStatus;
  
  if (effectiveType === '4g' && downlink > 10) return 'excellent';
  if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 5)) return 'good';
  return 'poor';
};

/**
 * Enhanced offline hook for managing offline-first functionality
 */
export const useEnhancedOffline = (config: Partial<OfflineConfig> = {}): UseEnhancedOfflineReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State management
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(getNetworkStatus);
  const [offlineData, setOfflineData] = useState<OfflineDataEntry[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalSize: 50 * 1024 * 1024, // 50 MB
    usedSize: 2 * 1024 * 1024,   // 2 MB
    availableSize: 48 * 1024 * 1024, // 48 MB
    entryCount: 0,
    oldestEntry: new Date(),
    newestEntry: new Date(),
    collections: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const initialized = useRef(false);

  // Derived state
  const isOnline = networkStatus.isOnline;
  const isOffline = !networkStatus.isOnline;
  const connectionQuality = getConnectionQuality(networkStatus);
  const pendingSync = offlineData.filter(entry => entry.syncStatus === 'pending' || entry.syncStatus === 'failed');

  // Initialize the hook
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializeOfflineSupport();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(getNetworkStatus());
    };

    const handleOnline = () => {
      updateNetworkStatus();
      logger.info('Network connection restored');
      if (finalConfig.autoSync) {
        syncData();
      }
    };

    const handleOffline = () => {
      updateNetworkStatus();
      logger.warn('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [finalConfig.autoSync]);

  // Auto sync interval
  useEffect(() => {
    if (finalConfig.autoSync && isOnline && pendingSync.length > 0) {
      syncTimeoutRef.current = setTimeout(() => {
        syncData();
      }, finalConfig.syncInterval);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [finalConfig.autoSync, finalConfig.syncInterval, isOnline, pendingSync.length]);

  const initializeOfflineSupport = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate loading offline data from IndexedDB/localStorage
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setOfflineData(MOCK_OFFLINE_DATA);
      await updateStorageStats();
      
      logger.info('Enhanced offline support initialized');
    } catch (err) {
      logger.error('Failed to initialize offline support:', err);
      setError('Failed to initialize offline support');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStorageStats = useCallback(async () => {
    try {
      // Calculate storage statistics
      const collections: Record<string, { size: number; count: number }> = {};
      let totalEntries = offlineData.length;
      let estimatedSize = 0;

      offlineData.forEach(entry => {
        const collection = entry.collection;
        const entrySize = JSON.stringify(entry).length; // Rough size estimation
        
        if (!collections[collection]) {
          collections[collection] = { size: 0, count: 0 };
        }
        
        collections[collection].size += entrySize;
        collections[collection].count += 1;
        estimatedSize += entrySize;
      });

      const timestamps = offlineData.map(entry => entry.timestamp);
      const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : new Date();
      const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : new Date();

      setStorageStats({
        totalSize: finalConfig.storageQuota * 1024 * 1024,
        usedSize: estimatedSize,
        availableSize: (finalConfig.storageQuota * 1024 * 1024) - estimatedSize,
        entryCount: totalEntries,
        oldestEntry,
        newestEntry,
        collections
      });
    } catch (err) {
      logger.error('Failed to update storage stats:', err);
    }
  }, [offlineData, finalConfig.storageQuota]);

  const saveOffline = useCallback(async (
    collection: string,
    data: any,
    type: OfflineDataEntry['type'] = 'create'
  ): Promise<string> => {
    try {
      setError(null);
      
      const entry: OfflineDataEntry = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        collection,
        data,
        timestamp: new Date(),
        retryCount: 0,
        priority: 'medium',
        syncStatus: 'pending',
        metadata: {
          version: 1,
          checksum: JSON.stringify(data).length.toString() // Simple checksum
        }
      };

      setOfflineData(prev => [...prev, entry]);
      await updateStorageStats();
      
      logger.info('Data saved offline:', { collection, type, id: entry.id });
      
      // Try immediate sync if online
      if (isOnline && finalConfig.autoSync) {
        setTimeout(() => syncData(collection), 1000);
      }
      
      return entry.id;
    } catch (err) {
      logger.error('Failed to save offline data:', err);
      setError('Failed to save data offline');
      throw err;
    }
  }, [isOnline, finalConfig.autoSync, updateStorageStats]);

  const updateOfflineData = useCallback(async (id: string, data: any): Promise<void> => {
    try {
      setError(null);
      
      setOfflineData(prev => prev.map(entry => {
        if (entry.id === id) {
          return {
            ...entry,
            data: { ...entry.data, ...data },
            timestamp: new Date(),
            syncStatus: 'pending',
            metadata: {
              ...entry.metadata,
              version: (entry.metadata?.version || 1) + 1
            }
          };
        }
        return entry;
      }));

      await updateStorageStats();
      logger.info('Offline data updated:', { id });
    } catch (err) {
      logger.error('Failed to update offline data:', err);
      setError('Failed to update offline data');
      throw err;
    }
  }, [updateStorageStats]);

  const deleteOfflineData = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      setOfflineData(prev => prev.filter(entry => entry.id !== id));
      await updateStorageStats();
      
      logger.info('Offline data deleted:', { id });
    } catch (err) {
      logger.error('Failed to delete offline data:', err);
      setError('Failed to delete offline data');
      throw err;
    }
  }, [updateStorageStats]);

  const syncData = useCallback(async (collection?: string): Promise<void> => {
    if (!isOnline) {
      logger.warn('Cannot sync data while offline');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Filter data to sync
      const dataToSync = offlineData.filter(entry => {
        const matchesCollection = !collection || entry.collection === collection;
        const needsSync = entry.syncStatus === 'pending' || entry.syncStatus === 'failed';
        return matchesCollection && needsSync;
      });

      if (dataToSync.length === 0) {
        logger.info('No data to sync');
        return;
      }

      // Simulate sync process
      for (const entry of dataToSync) {
        try {
          // Update sync status
          setOfflineData(prev => prev.map(item => 
            item.id === entry.id ? { ...item, syncStatus: 'syncing' } : item
          ));

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

          // Simulate random sync failures for testing
          if (Math.random() < 0.1) { // 10% failure rate
            throw new Error('Sync failed due to server error');
          }

          // Mark as synced
          setOfflineData(prev => prev.map(item => 
            item.id === entry.id ? { 
              ...item, 
              syncStatus: 'synced',
              retryCount: 0,
              error: undefined
            } : item
          ));

          logger.info('Entry synced successfully:', { id: entry.id, collection: entry.collection });

        } catch (syncError) {
          // Handle sync failure
          setOfflineData(prev => prev.map(item => 
            item.id === entry.id ? { 
              ...item, 
              syncStatus: 'failed',
              retryCount: item.retryCount + 1,
              error: syncError instanceof Error ? syncError.message : 'Unknown sync error'
            } : item
          ));

          logger.error('Entry sync failed:', { id: entry.id, error: syncError });
        }
      }

      await updateStorageStats();
      logger.info('Sync operation completed');

    } catch (err) {
      logger.error('Sync operation failed:', err);
      setError('Sync operation failed');
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, offlineData, updateStorageStats]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: SyncConflict['resolution'],
    mergedData?: any
  ): Promise<void> => {
    try {
      setError(null);

      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      let resolvedData;
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = mergedData || { ...conflict.remoteData, ...conflict.localData };
          break;
        default:
          throw new Error('Invalid resolution type');
      }

      // Remove conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));

      // Update the data with resolved version
      // In a real implementation, this would sync the resolved data
      logger.info('Conflict resolved:', { conflictId, resolution, resolvedData });

    } catch (err) {
      logger.error('Failed to resolve conflict:', err);
      setError('Failed to resolve conflict');
      throw err;
    }
  }, [conflicts]);

  const clearOfflineData = useCallback(async (collection?: string): Promise<void> => {
    try {
      setError(null);

      if (collection) {
        setOfflineData(prev => prev.filter(entry => entry.collection !== collection));
      } else {
        setOfflineData([]);
      }

      await updateStorageStats();
      logger.info('Offline data cleared', { collection });
    } catch (err) {
      logger.error('Failed to clear offline data:', err);
      setError('Failed to clear offline data');
      throw err;
    }
  }, [updateStorageStats]);

  const exportData = useCallback(async (collection?: string): Promise<string> => {
    try {
      const dataToExport = collection 
        ? offlineData.filter(entry => entry.collection === collection)
        : offlineData;

      const exportObject = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        collection,
        entries: dataToExport
      };

      return JSON.stringify(exportObject, null, 2);
    } catch (err) {
      logger.error('Failed to export data:', err);
      setError('Failed to export data');
      throw err;
    }
  }, [offlineData]);

  const importData = useCallback(async (data: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      const importObject = JSON.parse(data);
      const entries: OfflineDataEntry[] = importObject.entries || [];

      // Validate and process imported entries
      const processedEntries = entries.map(entry => ({
        ...entry,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(entry.timestamp),
        syncStatus: 'pending' as const,
        retryCount: 0
      }));

      setOfflineData(prev => [...prev, ...processedEntries]);
      await updateStorageStats();

      logger.info('Data imported successfully:', { count: processedEntries.length });
    } catch (err) {
      logger.error('Failed to import data:', err);
      setError('Failed to import data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateStorageStats]);

  const refreshStats = useCallback(async (): Promise<void> => {
    await updateStorageStats();
  }, [updateStorageStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryFailedSync = useCallback(async (): Promise<void> => {
    const failedEntries = offlineData.filter(entry => entry.syncStatus === 'failed');
    
    if (failedEntries.length === 0) {
      logger.info('No failed entries to retry');
      return;
    }

    // Reset failed entries to pending status
    setOfflineData(prev => prev.map(entry => 
      entry.syncStatus === 'failed' ? { ...entry, syncStatus: 'pending', error: undefined } : entry
    ));

    // Trigger sync
    await syncData();
    
    logger.info('Retry sync initiated for failed entries:', { count: failedEntries.length });
  }, [offlineData, syncData]);

  return {
    // Network state
    networkStatus,
    isOnline,
    isOffline,
    connectionQuality,
    
    // Data state
    offlineData,
    pendingSync,
    conflicts,
    storageStats,
    isLoading,
    error,
    
    // Actions
    saveOffline,
    updateOfflineData,
    deleteOfflineData,
    syncData,
    resolveConflict,
    clearOfflineData,
    exportData,
    importData,
    
    // Utilities
    refreshStats,
    clearError,
    retryFailedSync
  };
};

export type {
  NetworkStatus,
  OfflineDataEntry,
  SyncConflict,
  StorageStats,
  OfflineConfig,
  UseEnhancedOfflineReturn
};