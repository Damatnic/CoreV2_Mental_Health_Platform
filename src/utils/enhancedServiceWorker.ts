/**
 * Enhanced Service Worker for Mental Health Platform
 *
 * Advanced caching strategies with crisis feature prioritization,
 * intelligent background sync, and offline-first architecture.
 * 
 * @fileoverview Service Worker management with crisis-aware features
 * @version 2.0.0
 */

import * as React from 'react';

/**
 * Service worker message interface
 */
export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
  timestamp?: number;
}

/**
 * Cache usage statistics
 */
export interface CacheUsage {
  usage: number;
  quota: number;
  percentage: number;
}

/**
 * Service Worker Registration and Management
 */
class EnhancedServiceWorkerManagerClass {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;
  private updateAvailable = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.initializeEventListeners();
  }

  /**
   * Register service worker with enhanced error handling
   */
  async register(swPath = '/service-worker.js'): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      // Set up update handling
      this.setupUpdateHandling();

      // Initialize background sync
      this.initializeBackgroundSync();

      // Set up periodic sync for crisis resources
      this.setupPeriodicSync();

      this.emit('registered', this.registration);
      return true;
    } catch (error) {
      this.emit('registrationFailed', error);
      return false;
    }
  }

  /**
   * Setup update detection and handling
   */
  private setupUpdateHandling(): void {
    if (!this.registration) return;

    // Check for updates on page load
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          this.updateAvailable = true;
          this.emit('updateAvailable', newWorker);
        }
      });
    });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.emit('controllerChanged');
      // Reload the page to get the new service worker
      window.location.reload();
    });

    // Check for updates periodically
    setInterval(() => {
      this.registration?.update();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Initialize background sync capabilities
   */
  private initializeBackgroundSync(): void {
    if (!this.registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      return;
    }

    // Register background sync for critical actions
    this.registerBackgroundSync('crisis-data-sync');
    this.registerBackgroundSync('offline-actions-sync');
    this.registerBackgroundSync('analytics-sync');
  }

  /**
   * Setup periodic sync for crisis resources
   */
  private setupPeriodicSync(): void {
    if (!this.registration || !('periodicSync' in window.ServiceWorkerRegistration.prototype)) {
      return;
    }

    // Register periodic sync for crisis resources (requires user permission)
    (this.registration as any).periodicSync?.register('crisis-resources-update', {
      minInterval: 24 * 60 * 60 * 1000 // 24 hours
    }).catch((error: any) => {
      console.warn('Periodic sync registration failed:', error);
    });
  }

  /**
   * Register a background sync task
   */
  async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.registration) return;

    try {
      await (this.registration as any).sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error(`Failed to register background sync for ${tag}:`, error);
    }
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) return;

    const newWorker = this.registration.waiting;
    if (newWorker) {
      // Send skip waiting message to new service worker
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Get cache storage usage
   */
  async getCacheUsage(): Promise<CacheUsage> {
    if (!('storage' in navigator)) {
      return { usage: 0, quota: 0, percentage: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    } catch (error) {
      return { usage: 0, quota: 0, percentage: 0 };
    }
  }

  /**
   * Clear specific caches
   */
  async clearCache(cacheNames?: string[]): Promise<void> {
    if (!this.registration) return;

    try {
      const allCacheNames = await caches.keys();
      const cachesToDelete = cacheNames || allCacheNames.filter(name =>
        !name.includes('crisis') && !name.includes('emergency')
      );

      await Promise.all(
        cachesToDelete.map(cacheName => caches.delete(cacheName))
      );

      this.emit('cacheCleared', cachesToDelete);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Force cache update for critical resources
   */
  async updateCriticalResources(): Promise<void> {
    if (!this.registration) return;

    // Send message to service worker to update critical caches
    this.sendMessage({
      type: 'UPDATE_CRITICAL_CACHE',
      timestamp: Date.now()
    });
  }

  /**
   * Send message to service worker
   */
  sendMessage(message: ServiceWorkerMessage): void {
    if (!navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage(message);
  }

  /**
   * Listen for messages from service worker
   */
  private initializeEventListeners(): void {
    if (!this.isSupported) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      this.emit(type, payload);
    });
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Check if app is running from cache (offline)
   */
  isRunningFromCache(): boolean {
    return navigator.serviceWorker.controller !== null;
  }

  /**
   * Get registration details
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}

/**
 * Advanced Cache Management Strategies
 */
class AdvancedCacheManagerClass {
  private readonly CACHE_NAMES = {
    CRITICAL: 'astral-critical-v1',
    API: 'astral-api-v1',
    STATIC: 'astral-static-v1',
    IMAGES: 'astral-images-v1',
    COMMUNITY: 'astral-community-v1',
    CRISIS: 'astral-crisis-v1' // Never evicted
  };

  private readonly CACHE_LIMITS = {
    [this.CACHE_NAMES.API]: 50 * 1024 * 1024,        // 50MB
    [this.CACHE_NAMES.STATIC]: 100 * 1024 * 1024,    // 100MB
    [this.CACHE_NAMES.IMAGES]: 200 * 1024 * 1024,    // 200MB
    [this.CACHE_NAMES.COMMUNITY]: 75 * 1024 * 1024,  // 75MB
    [this.CACHE_NAMES.CRISIS]: -1                     // Unlimited
  };

  /**
   * Get cache by strategy
   */
  async getCache(strategy: keyof typeof this.CACHE_NAMES): Promise<Cache> {
    return await caches.open(this.CACHE_NAMES[strategy]);
  }

  /**
   * Store with intelligent caching strategy
   */
  async storeWithStrategy(
    request: Request,
    response: Response,
    strategy: keyof typeof this.CACHE_NAMES
  ): Promise<void> {
    const cache = await this.getCache(strategy);

    // Check cache size before storing
    await this.ensureCacheSize(strategy);

    // Clone response before storing
    const responseClone = response.clone();

    // Add metadata to cached response
    const enhancedResponse = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: {
        ...Object.fromEntries(responseClone.headers.entries()),
        'sw-cached': Date.now().toString(),
        'sw-cache-strategy': strategy
      }
    });

    await cache.put(request, enhancedResponse);
  }

  /**
   * Ensure cache doesn't exceed size limits
   */
  private async ensureCacheSize(strategy: keyof typeof this.CACHE_NAMES): Promise<void> {
    const limit = this.CACHE_LIMITS[this.CACHE_NAMES[strategy]];
    if (limit === -1) return; // Unlimited cache

    const cache = await this.getCache(strategy);
    const requests = await cache.keys();
    let totalSize = 0;
    const entries: Array<{ request: Request; size: number; timestamp: number }> = [];

    // Calculate current cache size
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const size = parseInt(response.headers.get('content-length') || '0');
        const timestamp = parseInt(response.headers.get('sw-cached') || '0');
        totalSize += size;
        entries.push({ request, size, timestamp });
      }
    }

    // Remove oldest entries if over limit
    if (totalSize > limit) {
      entries.sort((a, b) => a.timestamp - b.timestamp);

      for (const entry of entries) {
        await cache.delete(entry.request);
        totalSize -= entry.size;
        if (totalSize <= limit * 0.8) break; // Remove until 80% of limit
      }
    }
  }

  /**
   * Get cached response with fallback
   */
  async getCachedResponse(request: Request): Promise<Response | null> {
    // Try each cache in priority order
    const strategies: Array<keyof typeof this.CACHE_NAMES> = [
      'CRISIS', 'CRITICAL', 'API', 'STATIC', 'IMAGES', 'COMMUNITY'
    ];

    for (const strategy of strategies) {
      const cache = await this.getCache(strategy);
      const response = await cache.match(request);

      if (response) {
        return response;
      }
    }

    return null;
  }

  /**
   * Preload critical resources
   */
  async preloadCriticalResources(): Promise<void> {
    const criticalUrls = [
      '/',
      '/crisis',
      '/emergency',
      '/safety-plan',
      '/crisis-resources.json',
      '/emergency-contacts.json'
    ];

    const cache = await this.getCache('CRITICAL');

    await Promise.all(
      criticalUrls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          console.warn(`Failed to preload ${url}:`, error);
        }
      })
    );
  }

  /**
   * Update crisis resources cache
   */
  async updateCrisisCache(): Promise<void> {
    const crisisCache = await this.getCache('CRISIS');
    const crisisResources = [
      '/crisis-resources.json',
      '/emergency-contacts.json',
      '/offline-coping-strategies.json',
      '/crisis-chat-offline.html'
    ];

    for (const resource of crisisResources) {
      try {
        const response = await fetch(resource, { cache: 'no-cache' });
        if (response.ok) {
          await crisisCache.put(resource, response);
        }
      } catch (error) {
        console.warn(`Failed to update crisis resource ${resource}:`, error);
      }
    }
  }
}

/**
 * Network Status Manager
 */
class NetworkStatusManagerClass {
  private isOnline = navigator.onLine;
  private listeners: Function[] = [];
  private connectionType = 'unknown';
  private effectiveType = 'unknown';

  constructor() {
    this.initializeNetworkDetection();
  }

  private initializeNetworkDetection(): void {
    // Basic online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });

    // Advanced connection detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.connectionType = connection.type || 'unknown';
      this.effectiveType = connection.effectiveType || 'unknown';

      connection.addEventListener('change', () => {
        this.connectionType = connection.type || 'unknown';
        this.effectiveType = connection.effectiveType || 'unknown';
        this.emit('connectionChange', {
          type: this.connectionType,
          effectiveType: this.effectiveType
        });
      });
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      effectiveType: this.effectiveType
    };
  }

  isSlowConnection(): boolean {
    return this.effectiveType === 'slow-2g' || this.effectiveType === '2g';
  }

  isFastConnection(): boolean {
    return this.effectiveType === '4g';
  }

  onChange(callback: Function): void {
    this.listeners.push(callback);
  }

  private emit(event: string, data?: any): void {
    this.listeners.forEach(callback => callback(event, data));
  }
}

// Global instances
const serviceWorkerManager = new EnhancedServiceWorkerManagerClass();
const cacheManager = new AdvancedCacheManagerClass();
const networkManager = new NetworkStatusManagerClass();

// React hooks for service worker functionality
export const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    // Register service worker
    serviceWorkerManager.register().then(setIsRegistered);

    // Listen for updates
    serviceWorkerManager.on('updateAvailable', () => setUpdateAvailable(true));

    // Listen for network changes
    networkManager.onChange((event: string) => {
      if (event === 'online') setIsOnline(true);
      if (event === 'offline') setIsOnline(false);
    });
  }, []);

  const updateApp = React.useCallback(() => {
    serviceWorkerManager.updateServiceWorker();
  }, []);

  const clearCache = React.useCallback(() => {
    return serviceWorkerManager.clearCache();
  }, []);

  return {
    isRegistered,
    updateAvailable,
    isOnline,
    networkStatus: networkManager.getStatus(),
    updateApp,
    clearCache
  };
};

// Export classes and instances
export const EnhancedServiceWorkerManager = EnhancedServiceWorkerManagerClass;
export const AdvancedCacheManager = AdvancedCacheManagerClass;
export const NetworkStatusManager = NetworkStatusManagerClass;

export {
  serviceWorkerManager,
  cacheManager,
  networkManager
};

export default serviceWorkerManager;
