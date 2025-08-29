/**
 * Service Worker Manager
 *
 * Comprehensive service worker management for the mental health platform.
 * Provides registration, caching, offline support, background sync, and
 * push notification capabilities with crisis-focused optimizations.
 * 
 * @fileoverview Service worker management and coordination
 * @version 2.0.0
 */

/**
 * Cache status interface for monitoring
 */
export interface CacheStatus {
  staticResources: boolean;
  crisisResources: boolean;
  translations: boolean;
  culturalContent: boolean;
  aiModels: boolean;
  swRegistered?: boolean;
  cacheVersion?: string;
  updateAvailable?: boolean;
  lastUpdated?: string;
}

/**
 * Service worker registration result
 */
export interface ServiceWorkerRegistrationResult {
  supported: boolean;
  registered?: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

/**
 * Network status information
 */
export interface NetworkStatus {
  isOnline: boolean;
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Background sync data interface
 */
export interface BackgroundSyncData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount?: number;
}

/**
 * Push notification configuration
 */
export interface PushNotificationConfig {
  vapidKey: string;
  endpoint?: string;
  userVisibleOnly?: boolean;
  applicationServerKey?: string;
}

/**
 * Comprehensive service worker manager
 */
export class ServiceWorkerManager {
  private isReady: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;
  private onlineCallbacks: Array<() => void> = [];
  private offlineCallbacks: Array<() => void> = [];
  private updateCallbacks: Array<() => void> = [];
  private messageChannel: MessageChannel | null = null;

  /**
   * Initialize service worker with registration and setup
   */
  async initialize(): Promise<ServiceWorkerRegistrationResult> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[ServiceWorker] Service workers not supported');
      return { supported: false };
    }

    try {
      // Register the enhanced service worker
      this.registration = await navigator.serviceWorker.register('/sw-enhanced.js', {
        scope: '/'
      });

      console.log('[ServiceWorker] Registered:', this.registration);

      // Set up event listeners
      this.setupEventListeners();

      // Initialize message channel
      this.setupMessageChannel();

      // Check for updates
      await this.checkForUpdates();

      this.isReady = true;

      return { 
        supported: true, 
        registered: true, 
        registration: this.registration 
      };
    } catch (error) {
      console.error('[ServiceWorker] Registration failed:', error);
      return { 
        supported: true, 
        registered: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Set up service worker event listeners
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[ServiceWorker] New version available');
            this.updateCallbacks.forEach(callback => callback());
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      console.log('[ServiceWorker] Back online');
      this.onlineCallbacks.forEach(callback => callback());
    });

    window.addEventListener('offline', () => {
      console.log('[ServiceWorker] Gone offline');
      this.offlineCallbacks.forEach(callback => callback());
    });
  }

  /**
   * Set up message channel for communication
   */
  private setupMessageChannel(): void {
    this.messageChannel = new MessageChannel();
    
    this.messageChannel.port1.onmessage = (event) => {
      console.log('[ServiceWorker] Message from SW:', event.data);
    };

    // Send port to service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(
        { type: 'INIT_MESSAGE_CHANNEL' },
        [this.messageChannel.port2]
      );
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'STORAGE_INFO':
        console.log('[ServiceWorker] Storage info:', data);
        break;
      case 'CACHE_UPDATE':
        console.log('[ServiceWorker] Cache updated:', data);
        break;
      case 'SYNC_COMPLETE':
        console.log('[ServiceWorker] Background sync complete:', data);
        break;
      case 'ERROR':
        console.error('[ServiceWorker] Error from SW:', data);
        break;
      default:
        console.log('[ServiceWorker] Unknown message type:', type, data);
    }
  }

  /**
   * Check if message channel is available
   */
  hasMessageChannel(): boolean {
    return this.messageChannel !== null && navigator.serviceWorker.controller !== null;
  }

  /**
   * Cache specific resources
   */
  async cacheResources(resources: string[]): Promise<boolean> {
    if (!this.hasMessageChannel()) {
      console.warn('[ServiceWorker] Message channel not available');
      return false;
    }

    try {
      await this.postMessage({
        type: 'CACHE_RESOURCES',
        resources
      });

      console.log('[ServiceWorker] Resources cached:', resources);
      return true;
    } catch (error) {
      console.error('[ServiceWorker] Failed to cache resources:', error);
      return false;
    }
  }

  /**
   * Preload critical resources for immediate availability
   */
  async preloadCriticalResources(resources: string[]): Promise<void> {
    console.log('[ServiceWorker] Preloading critical resources:', resources);

    if (this.hasMessageChannel()) {
      await this.postMessage({
        type: 'PRELOAD_CRITICAL',
        resources
      });
    }

    // Also preload directly in main thread
    const preloadPromises = resources.map(async (url) => {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        // Determine resource type
        if (url.endsWith('.css')) {
          link.as = 'style';
        } else if (url.endsWith('.js')) {
          link.as = 'script';
        } else if (url.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
          link.as = 'image';
        } else {
          link.as = 'fetch';
          link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
      } catch (error) {
        console.warn('[ServiceWorker] Failed to preload:', url, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Register background sync for offline actions
   */
  async registerBackgroundSync(data: BackgroundSyncData): Promise<void> {
    console.log('[ServiceWorker] Registering background sync:', data);

    if (this.hasMessageChannel()) {
      await this.postMessage({
        type: 'REGISTER_BACKGROUND_SYNC',
        data
      });
    }

    // Fallback: store in IndexedDB for manual sync
    try {
      const request = indexedDB.open('background-sync', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync-queue'], 'readwrite');
        const store = transaction.objectStore('sync-queue');
        store.add(data);
      };
    } catch (error) {
      console.error('[ServiceWorker] Failed to store sync data:', error);
    }
  }

  /**
   * Queue offline action for later execution
   */
  async queueOfflineAction(action: any): Promise<void> {
    const syncData: BackgroundSyncData = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'offline-action',
      data: action,
      timestamp: Date.now()
    };

    await this.registerBackgroundSync(syncData);
    console.log('[ServiceWorker] Queued offline action:', action);
  }

  /**
   * Setup push notifications
   */
  async setupPushNotifications(config: PushNotificationConfig): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('[ServiceWorker] No registration available for push notifications');
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Convert VAPID key to Uint8Array
        const applicationServerKey = this.urlBase64ToUint8Array(config.vapidKey);
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: config.userVisibleOnly ?? true,
          applicationServerKey
        });

        console.log('[ServiceWorker] Push subscription created:', subscription);
      }

      return subscription;
    } catch (error) {
      console.error('[ServiceWorker] Failed to setup push notifications:', error);
      return null;
    }
  }

  /**
   * Send notification through service worker
   */
  async sendNotification(notification: NotificationOptions & { title: string }): Promise<void> {
    if (!this.registration) {
      console.error('[ServiceWorker] No registration available for notifications');
      return;
    }

    try {
      await this.registration.showNotification(notification.title, notification);
      console.log('[ServiceWorker] Notification sent:', notification.title);
    } catch (error) {
      console.error('[ServiceWorker] Failed to send notification:', error);
    }
  }

  /**
   * Check if offline functionality is ready
   */
  async isOfflineReady(): Promise<boolean> {
    if (!this.isReady) return false;

    try {
      const cacheStatus = await this.getCacheStatus();
      return cacheStatus.staticResources && cacheStatus.crisisResources;
    } catch (error) {
      console.error('[ServiceWorker] Failed to check offline readiness:', error);
      return false;
    }
  }

  /**
   * Get comprehensive cache status
   */
  async getCacheStatus(): Promise<CacheStatus> {
    const defaultStatus: CacheStatus = {
      staticResources: false,
      crisisResources: false,
      translations: false,
      culturalContent: false,
      aiModels: false,
      swRegistered: 'serviceWorker' in navigator,
      cacheVersion: '1.0.0',
      updateAvailable: false,
      lastUpdated: new Date().toISOString()
    };

    if (!this.hasMessageChannel()) {
      return defaultStatus;
    }

    try {
      const response = await this.postMessage({ type: 'GET_CACHE_STATUS' });
      return { ...defaultStatus, ...response };
    } catch (error) {
      console.error('[ServiceWorker] Failed to get cache status:', error);
      return defaultStatus;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      await this.postMessage({ type: 'SKIP_WAITING' });
      console.log('[ServiceWorker] Skip waiting requested');
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      const hasUpdate = this.registration.waiting !== null;
      console.log('[ServiceWorker] Update check complete, has update:', hasUpdate);
      return hasUpdate;
    } catch (error) {
      console.error('[ServiceWorker] Update check failed:', error);
      return false;
    }
  }

  /**
   * Clear specific cache or all caches
   */
  async clearCache(cacheName?: string): Promise<boolean> {
    try {
      if (cacheName) {
        const deleted = await caches.delete(cacheName);
        console.log(`[ServiceWorker] Cache '${cacheName}' deleted:`, deleted);
        return deleted;
      } else {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(name => caches.delete(name));
        const results = await Promise.all(deletePromises);
        const allDeleted = results.every(result => result);
        console.log('[ServiceWorker] All caches cleared:', allDeleted);
        return allDeleted;
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Cache crisis resource with high priority
   */
  async cacheCrisisResource(url: string): Promise<boolean> {
    try {
      const cache = await caches.open('crisis-resources');
      const response = await fetch(url);
      
      if (response.ok) {
        await cache.put(url, response);
        console.log('[ServiceWorker] Crisis resource cached:', url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[ServiceWorker] Failed to cache crisis resource:', error);
      return false;
    }
  }

  /**
   * Precache all critical crisis resources
   */
  async precacheCrisisResources(): Promise<void> {
    const crisisResources = [
      '/offline-crisis.html',
      '/crisis',
      '/emergency',
      '/safety-plan',
      '/988'
    ];

    console.log('[ServiceWorker] Precaching crisis resources');
    
    const cachePromises = crisisResources.map(url => this.cacheCrisisResource(url));
    await Promise.allSettled(cachePromises);
  }

  /**
   * Force reload the application
   */
  forceReload(): void {
    window.location.reload();
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    const navigatorWithConnection = navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        type?: string;
        downlink?: number;
        rtt?: number;
      };
    };

    return {
      isOnline: navigator.onLine,
      type: navigatorWithConnection.connection?.type || 'unknown',
      effectiveType: navigatorWithConnection.connection?.effectiveType || 'unknown',
      downlink: navigatorWithConnection.connection?.downlink,
      rtt: navigatorWithConnection.connection?.rtt
    };
  }

  /**
   * Event listener management
   */
  onOnline(callback: () => void): void {
    this.onlineCallbacks.push(callback);
  }

  onOffline(callback: () => void): void {
    this.offlineCallbacks.push(callback);
  }

  onUpdateAvailable(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }

  removeOnlineListener(callback: () => void): void {
    const index = this.onlineCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onlineCallbacks.splice(index, 1);
    }
  }

  removeOfflineListener(callback: () => void): void {
    const index = this.offlineCallbacks.indexOf(callback);
    if (index !== -1) {
      this.offlineCallbacks.splice(index, 1);
    }
  }

  removeUpdateListener(callback: () => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  /**
   * Post message to service worker with promise support
   */
  private async postMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.messageChannel) {
        reject(new Error('Message channel not available'));
        return;
      }

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const messageWithId = { ...message, id: messageId };

      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 10000);

      const handleResponse = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          clearTimeout(timeout);
          this.messageChannel!.port1.removeEventListener('message', handleResponse);
          resolve(event.data.response);
        }
      };

      this.messageChannel.port1.addEventListener('message', handleResponse);
      
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(messageWithId);
      } else {
        reject(new Error('No service worker controller'));
      }
    });
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Create and export singleton instance
const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;
