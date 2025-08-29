/**
 * Connection Status Hook
 *
 * Provides real-time connection status monitoring and service worker communication
 * for the Astral Core mental health platform with crisis intervention priority.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ServiceWorkerMessage {
  type: string;
  data?: any;
  timestamp: number;
}

export interface OfflineCapability {
  feature: string;
  available: boolean;
  description: string;
  fallbackAction: string;
}

export interface ConnectionStatus {
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  isServiceWorkerRegistered: boolean;
  serviceWorkerStatus: 'installing' | 'waiting' | 'active' | 'redundant' | 'not_registered';
  lastSync: Date | null;
  crisisResourcesAvailable: boolean;
  offlineCapabilities: OfflineCapability[];
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  bandwidth?: number;
  latency?: number;
}

export interface ConnectionStatusHookReturn {
  status: ConnectionStatus;
  forceSync: () => Promise<boolean>;
  sendMessageToSW: (message: ServiceWorkerMessage) => Promise<boolean>;
  checkCrisisResources: () => Promise<boolean>;
  refreshStatus: () => void;
  isConnected: boolean;
  canAccessCrisisFeatures: boolean;
}

export interface UseConnectionStatusOptions {
  enablePerformanceMonitoring?: boolean;
  syncInterval?: number;
  crisisResourceCheck?: boolean;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onServiceWorkerUpdate?: (registration: ServiceWorkerRegistration) => void;
}

const DEFAULT_OPTIONS: Required<UseConnectionStatusOptions> = {
  enablePerformanceMonitoring: true,
  syncInterval: 30000, // 30 seconds
  crisisResourceCheck: true,
  onConnectionChange: () => {},
  onServiceWorkerUpdate: () => {}
};

/**
 * Hook for monitoring connection status and service worker communication
 */
export const useConnectionStatus = (options: UseConnectionStatusOptions = {}): ConnectionStatusHookReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [status, setStatus] = useState<ConnectionStatus>(() => ({
    isOnline: navigator.onLine,
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isServiceWorkerRegistered: false,
    serviceWorkerStatus: 'not_registered',
    lastSync: null,
    crisisResourcesAvailable: false,
    offlineCapabilities: [],
    connectionQuality: navigator.onLine ? 'good' : 'offline'
  }));

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  /**
   * Check service worker registration status
   */
  const checkServiceWorkerStatus = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) {
      setStatus(prev => ({
        ...prev,
        isServiceWorkerSupported: false,
        serviceWorkerStatus: 'not_registered'
      }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        swRegistrationRef.current = registration;
        
        let swStatus: ConnectionStatus['serviceWorkerStatus'] = 'not_registered';
        
        if (registration.installing) {
          swStatus = 'installing';
        } else if (registration.waiting) {
          swStatus = 'waiting';
        } else if (registration.active) {
          swStatus = 'active';
        }

        setStatus(prev => ({
          ...prev,
          isServiceWorkerRegistered: true,
          serviceWorkerStatus: swStatus
        }));

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          opts.onServiceWorkerUpdate(registration);
        });

      } else {
        setStatus(prev => ({
          ...prev,
          isServiceWorkerRegistered: false,
          serviceWorkerStatus: 'not_registered'
        }));
      }
    } catch (error) {
      console.error('Failed to check service worker status:', error);
    }
  }, [opts]);

  /**
   * Check offline capabilities
   */
  const checkOfflineCapabilities = useCallback(async (): Promise<OfflineCapability[]> => {
    const capabilities: OfflineCapability[] = [];

    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      capabilities.push({
        feature: 'Local Storage',
        available: true,
        description: 'Can store user data locally',
        fallbackAction: 'Memory storage only'
      });
    } catch {
      capabilities.push({
        feature: 'Local Storage',
        available: false,
        description: 'Cannot store user data locally',
        fallbackAction: 'Memory storage only'
      });
    }

    // Check indexedDB availability
    try {
      if ('indexedDB' in window) {
        capabilities.push({
          feature: 'IndexedDB',
          available: true,
          description: 'Can store large amounts of data offline',
          fallbackAction: 'Use localStorage'
        });
      }
    } catch {
      capabilities.push({
        feature: 'IndexedDB',
        available: false,
        description: 'Cannot store large amounts of data offline',
        fallbackAction: 'Use localStorage'
      });
    }

    // Check cache API availability
    if ('caches' in window) {
      capabilities.push({
        feature: 'Cache API',
        available: true,
        description: 'Can cache resources for offline use',
        fallbackAction: 'No offline resources'
      });
    } else {
      capabilities.push({
        feature: 'Cache API',
        available: false,
        description: 'Cannot cache resources for offline use',
        fallbackAction: 'No offline resources'
      });
    }

    // Check background sync availability
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      capabilities.push({
        feature: 'Background Sync',
        available: true,
        description: 'Can sync data when connection returns',
        fallbackAction: 'Manual sync required'
      });
    } else {
      capabilities.push({
        feature: 'Background Sync',
        available: false,
        description: 'Cannot sync data automatically',
        fallbackAction: 'Manual sync required'
      });
    }

    return capabilities;
  }, []);

  /**
   * Check crisis resources availability
   */
  const checkCrisisResources = useCallback(async (): Promise<boolean> => {
    if (!opts.crisisResourceCheck) return true;

    try {
      // Check if crisis resources are cached
      if ('caches' in window) {
        const cache = await caches.open('crisis-resources-v1');
        const keys = await cache.keys();
        const hasResources = keys.length > 0;
        
        setStatus(prev => ({
          ...prev,
          crisisResourcesAvailable: hasResources
        }));
        
        return hasResources;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check crisis resources:', error);
      return false;
    }
  }, [opts.crisisResourceCheck]);

  /**
   * Measure connection quality
   */
  const measureConnectionQuality = useCallback((): void => {
    if (!navigator.onLine) {
      setStatus(prev => ({ ...prev, connectionQuality: 'offline' }));
      return;
    }

    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      
      let quality: ConnectionStatus['connectionQuality'];
      
      switch (effectiveType) {
        case '4g':
          quality = 'excellent';
          break;
        case '3g':
          quality = 'good';
          break;
        case '2g':
        case 'slow-2g':
          quality = 'poor';
          break;
        default:
          quality = 'good';
      }
      
      setStatus(prev => ({
        ...prev,
        connectionQuality: quality,
        bandwidth: connection.downlink,
        latency: connection.rtt
      }));
    } else {
      // Fallback: measure with a simple request
      const startTime = performance.now();
      
      fetch('/favicon.ico', { method: 'HEAD' })
        .then(() => {
          const latency = performance.now() - startTime;
          let quality: ConnectionStatus['connectionQuality'];
          
          if (latency < 100) {
            quality = 'excellent';
          } else if (latency < 300) {
            quality = 'good';
          } else {
            quality = 'poor';
          }
          
          setStatus(prev => ({
            ...prev,
            connectionQuality: quality,
            latency
          }));
        })
        .catch(() => {
          setStatus(prev => ({ ...prev, connectionQuality: 'poor' }));
        });
    }
  }, []);

  /**
   * Force sync with server
   */
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Trigger background sync if available
      if (swRegistrationRef.current && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await swRegistrationRef.current.sync.register('background-sync');
      }

      setStatus(prev => ({ ...prev, lastSync: new Date() }));
      return true;
    } catch (error) {
      console.error('Failed to force sync:', error);
      return false;
    }
  }, []);

  /**
   * Send message to service worker
   */
  const sendMessageToSW = useCallback(async (message: ServiceWorkerMessage): Promise<boolean> => {
    if (!swRegistrationRef.current?.active) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false);
        };

        swRegistrationRef.current!.active!.postMessage(
          { ...message, timestamp: Date.now() },
          [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      });
    } catch (error) {
      console.error('Failed to send message to service worker:', error);
      return false;
    }
  }, []);

  /**
   * Refresh all status information
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    await checkServiceWorkerStatus();
    const capabilities = await checkOfflineCapabilities();
    await checkCrisisResources();
    measureConnectionQuality();

    setStatus(prev => ({
      ...prev,
      offlineCapabilities: capabilities,
      isOnline: navigator.onLine
    }));
  }, [checkServiceWorkerStatus, checkOfflineCapabilities, checkCrisisResources, measureConnectionQuality]);

  /**
   * Handle online/offline events
   */
  const handleOnline = useCallback(() => {
    setStatus(prev => ({ ...prev, isOnline: true }));
    measureConnectionQuality();
    forceSync();
  }, [measureConnectionQuality, forceSync]);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      connectionQuality: 'offline'
    }));
  }, []);

  /**
   * Setup performance monitoring
   */
  const setupPerformanceMonitoring = useCallback((): void => {
    if (!opts.enablePerformanceMonitoring || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Update connection quality based on load times
            if (navEntry.loadEventEnd - navEntry.loadEventStart > 3000) {
              setStatus(prev => ({ ...prev, connectionQuality: 'poor' }));
            }
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource'] });
      performanceObserverRef.current = observer;
    } catch (error) {
      console.error('Failed to setup performance monitoring:', error);
    }
  }, [opts.enablePerformanceMonitoring]);

  // Initialize hook
  useEffect(() => {
    refreshStatus();
    setupPerformanceMonitoring();

    // Setup event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup periodic sync
    if (opts.syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          forceSync();
        }
      }, opts.syncInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [refreshStatus, setupPerformanceMonitoring, handleOnline, handleOffline, forceSync, opts.syncInterval]);

  // Notify on connection changes
  useEffect(() => {
    opts.onConnectionChange(status);
  }, [status, opts]);

  // Computed values
  const isConnected = status.isOnline;
  const canAccessCrisisFeatures = status.isOnline || status.crisisResourcesAvailable;

  return {
    status,
    forceSync,
    sendMessageToSW,
    checkCrisisResources,
    refreshStatus,
    isConnected,
    canAccessCrisisFeatures
  };
};
