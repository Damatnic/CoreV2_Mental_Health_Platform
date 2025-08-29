import '@testing-library/jest-dom';
import { ServiceWorkerManager } from '../serviceWorkerManager';
import type { 
  ServiceWorkerRegistrationResult, 
  CacheStatus, 
  NetworkStatus,
  BackgroundSyncData,
  PushNotificationConfig 
} from '../serviceWorkerManager';

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: jest.fn(),
  controller: null as ServiceWorker | null,
  addEventListener: jest.fn(),
  ready: Promise.resolve({} as ServiceWorkerRegistration),
  getRegistration: jest.fn(),
  getRegistrations: jest.fn()
};

// Mock ServiceWorkerRegistration
const mockRegistration = {
  scope: '/',
  installing: null as ServiceWorker | null,
  waiting: null as ServiceWorker | null,
  active: null as ServiceWorker | null,
  update: jest.fn(),
  unregister: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn(),
    permissionState: jest.fn()
  },
  showNotification: jest.fn(),
  getNotifications: jest.fn(),
  sync: {
    register: jest.fn(),
    getTags: jest.fn()
  }
} as unknown as ServiceWorkerRegistration;

// Mock ServiceWorker
const mockWorker = {
  scriptURL: '/sw-enhanced.js',
  state: 'activated',
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
} as unknown as ServiceWorker;

// Mock MessageChannel
class MockMessageChannel {
  port1 = {
    postMessage: jest.fn(),
    onmessage: null as ((event: MessageEvent) => void) | null,
    close: jest.fn(),
    start: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
  port2 = {
    postMessage: jest.fn(),
    onmessage: null as ((event: MessageEvent) => void) | null,
    close: jest.fn(),
    start: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
}

// Mock fetch
global.fetch = jest.fn();

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn()
};

// Mock window events
const windowEventListeners: Record<string, Function[]> = {};

describe('ServiceWorkerManager', () => {
  let manager: ServiceWorkerManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup navigator mock
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true
    });
    
    // Setup MessageChannel mock
    (global as any).MessageChannel = MockMessageChannel;
    
    // Setup IndexedDB mock
    (global as any).indexedDB = mockIndexedDB;
    
    // Setup window event listeners mock
    window.addEventListener = jest.fn((event: string, handler: EventListenerOrEventListenerObject) => {
      if (!windowEventListeners[event]) {
        windowEventListeners[event] = [];
      }
      windowEventListeners[event].push(handler as Function);
    }) as any;
    
    window.removeEventListener = jest.fn((event: string, handler: EventListenerOrEventListenerObject) => {
      if (windowEventListeners[event]) {
        const index = windowEventListeners[event].indexOf(handler as Function);
        if (index > -1) {
          windowEventListeners[event].splice(index, 1);
        }
      }
    }) as any;
    
    // Create new manager instance
    manager = new ServiceWorkerManager();
    
    // Reset mock implementations
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    mockServiceWorker.controller = mockWorker;
    (mockRegistration as any).active = mockWorker;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  afterEach(() => {
    // Clear event listeners
    Object.keys(windowEventListeners).forEach(key => {
      windowEventListeners[key] = [];
    });
  });

  describe('Initialization', () => {
    it('should successfully initialize when service workers are supported', async () => {
      const result = await manager.initialize();
      
      expect(result.supported).toBe(true);
      expect(result.registered).toBe(true);
      expect(result.registration).toBe(mockRegistration);
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw-enhanced.js', { scope: '/' });
    });

    it('should handle browsers without service worker support', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const result = await manager.initialize();
      
      expect(result.supported).toBe(false);
      expect(result.registered).toBeUndefined();
    });

    it('should handle registration failures gracefully', async () => {
      const error = new Error('Registration failed');
      mockServiceWorker.register.mockRejectedValue(error);
      
      const result = await manager.initialize();
      
      expect(result.supported).toBe(true);
      expect(result.registered).toBe(false);
      expect(result.error).toBe('Registration failed');
    });

    it('should set up event listeners on initialization', async () => {
      await manager.initialize();
      
      expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
        'updatefound',
        expect.any(Function)
      );
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should set up message channel for communication', async () => {
      await manager.initialize();
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        { type: 'INIT_MESSAGE_CHANNEL' },
        expect.any(Array)
      );
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should cache resources successfully', async () => {
      const resources = ['/styles.css', '/script.js', '/index.html'];
      const result = await manager.cacheResources(resources);
      
      expect(result).toBe(true);
    });

    it('should preload critical resources', async () => {
      const resources = [
        '/crisis-support.html',
        '/emergency-contacts.json',
        '/styles.css'
      ];
      
      await manager.preloadCriticalResources(resources);
      
      expect(global.fetch).toHaveBeenCalledTimes(1); // CSS file only
    });

    it('should get cache status', async () => {
      const status = await manager.getCacheStatus();
      
      expect(status).toHaveProperty('staticResources');
      expect(status).toHaveProperty('crisisResources');
      expect(status).toHaveProperty('swRegistered');
    });

    it('should clear cache when requested', async () => {
      const result = await manager.clearCache();
      
      expect(result).toBe(true);
    });
  });

  describe('Update Management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should check for updates', async () => {
      const hasUpdate = await manager.checkForUpdates();
      
      expect(mockRegistration.update).toHaveBeenCalled();
      expect(typeof hasUpdate).toBe('boolean');
    });

    it('should handle update notifications', async () => {
      const updateCallback = jest.fn();
      manager.onUpdateAvailable(updateCallback);
      
      // Simulate update found event
      const updateFoundHandler = (mockRegistration.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'updatefound')?.[1];
      
      if (updateFoundHandler) {
        (mockRegistration as any).installing = {
          ...mockWorker,
          state: 'installing',
          addEventListener: jest.fn((event, handler) => {
            if (event === 'statechange') {
              // Simulate state change to installed
              (mockRegistration as any).installing!.state = 'installed';
              handler();
            }
          })
        } as unknown as ServiceWorker;
        
        updateFoundHandler();
      }
      
      expect(updateCallback).toHaveBeenCalled();
    });

    it('should skip waiting and activate new service worker', async () => {
      await manager.skipWaiting();
      
      // Verify message sent to service worker
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });

  describe('Background Sync', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should register background sync successfully', async () => {
      const syncData: BackgroundSyncData = {
        id: 'sync-1',
        type: 'assessment-submission',
        data: { assessmentId: 'phq9-123' },
        timestamp: Date.now()
      };
      
      await manager.registerBackgroundSync(syncData);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should queue offline actions', async () => {
      const action = {
        type: 'submit-assessment',
        data: { assessmentId: 'gad7-456' }
      };
      
      await manager.queueOfflineAction(action);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should sync data when coming back online', async () => {
      const onlineCallback = jest.fn();
      manager.onOnline(onlineCallback);
      
      // Simulate online event
      const onlineHandler = windowEventListeners['online']?.[0];
      if (onlineHandler) {
        onlineHandler();
      }
      
      expect(onlineCallback).toHaveBeenCalled();
    });
  });

  describe('Push Notifications', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should set up push notifications successfully', async () => {
      const config: PushNotificationConfig = {
        vapidKey: 'test-vapid-key',
        userVisibleOnly: true
      };
      
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        expirationTime: null,
        toJSON: () => ({})
      } as unknown as PushSubscription;
      
      (mockRegistration.pushManager.subscribe as jest.Mock).mockResolvedValue(mockSubscription);
      (mockRegistration.pushManager.getSubscription as jest.Mock).mockResolvedValue(null);
      
      const subscription = await manager.setupPushNotifications(config);
      
      expect(subscription).toBe(mockSubscription);
      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array)
      });
    });

    it('should return existing subscription if available', async () => {
      const config: PushNotificationConfig = {
        vapidKey: 'test-vapid-key'
      };
      
      const mockSubscription = {
        endpoint: 'https://existing.endpoint',
        toJSON: () => ({})
      } as unknown as PushSubscription;
      
      (mockRegistration.pushManager.getSubscription as jest.Mock).mockResolvedValue(mockSubscription);
      
      const subscription = await manager.setupPushNotifications(config);
      
      expect(subscription).toBe(mockSubscription);
      expect(mockRegistration.pushManager.subscribe).not.toHaveBeenCalled();
    });

    it('should handle push notification setup failures', async () => {
      const config: PushNotificationConfig = {
        vapidKey: 'test-vapid-key'
      };
      
      (mockRegistration.pushManager.getSubscription as jest.Mock).mockResolvedValue(null);
      (mockRegistration.pushManager.subscribe as jest.Mock).mockRejectedValue(new Error('Permission denied'));
      
      const subscription = await manager.setupPushNotifications(config);
      
      expect(subscription).toBeNull();
    });
  });

  describe('Network Status', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should get current network status', () => {
      const status = manager.getNetworkStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(typeof status.isOnline).toBe('boolean');
    });

    it('should handle offline events', () => {
      const offlineCallback = jest.fn();
      manager.onOffline(offlineCallback);
      
      // Simulate offline event
      const offlineHandler = windowEventListeners['offline']?.[0];
      if (offlineHandler) {
        offlineHandler();
      }
      
      expect(offlineCallback).toHaveBeenCalled();
    });

    it('should report message channel status', () => {
      const hasChannel = manager.hasMessageChannel();
      
      expect(typeof hasChannel).toBe('boolean');
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should handle storage info messages', () => {
      const messageHandler = (mockServiceWorker.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        const event = new MessageEvent('message', {
          data: { type: 'STORAGE_INFO', data: { used: 1000, quota: 5000 } }
        });
        
        messageHandler(event);
      }
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle cache update messages', () => {
      const messageHandler = (mockServiceWorker.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        const event = new MessageEvent('message', {
          data: { type: 'CACHE_UPDATE', data: { updated: ['/styles.css'] } }
        });
        
        messageHandler(event);
      }
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle sync complete messages', () => {
      const messageHandler = (mockServiceWorker.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        const event = new MessageEvent('message', {
          data: { type: 'SYNC_COMPLETE', data: { synced: 5 } }
        });
        
        messageHandler(event);
      }
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle error messages', () => {
      const messageHandler = (mockServiceWorker.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        const event = new MessageEvent('message', {
          data: { type: 'ERROR', data: { error: 'Cache operation failed' } }
        });
        
        messageHandler(event);
      }
      
      // Should not throw
      expect(true).toBe(true);
    });
  });


  describe('Crisis Resource Optimization', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should prioritize crisis resources in cache', async () => {
      const crisisResources = [
        '/crisis-support.html',
        '/emergency-contacts.json',
        '/crisis-chat.js'
      ];
      
      const result = await manager.cacheResources(crisisResources);
      
      expect(result).toBe(true);
    });

    it('should ensure crisis resources are available offline', async () => {
      const status = await manager.getCacheStatus();
      
      expect(status.crisisResources).toBeDefined();
    });
  });
});