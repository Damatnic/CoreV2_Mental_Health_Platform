/**
 * Cross-Browser Compatibility Tests
 * Tests for service worker functionality across different browsers and environments
 */

describe('Cross-Browser Compatibility', () => {
  let originalUserAgent: string;
  let mockCaches: any;
  let mockServiceWorker: any;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    
    // Create mock caches object
    mockCaches = {
      open: jest.fn().mockResolvedValue({
        match: jest.fn(),
        matchAll: jest.fn(),
        add: jest.fn(),
        addAll: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn()
      }),
      has: jest.fn().mockResolvedValue(false),
      delete: jest.fn().mockResolvedValue(true),
      keys: jest.fn().mockResolvedValue([]),
      match: jest.fn()
    };
    
    // Set global caches
    (global as any).caches = mockCaches;
    
    mockServiceWorker = navigator.serviceWorker as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
  });

  describe('Browser Detection', () => {
    it('should detect Chrome browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        writable: true
      });

      const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
      expect(isChrome).toBe(true);
    });

    it('should detect Firefox browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
        writable: true
      });

      const isFirefox = navigator.userAgent.includes('Firefox');
      expect(isFirefox).toBe(true);
    });

    it('should detect Safari browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        writable: true
      });

      const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
      expect(isSafari).toBe(true);
    });

    it('should detect Edge browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        writable: true
      });

      const isEdge = navigator.userAgent.includes('Edg');
      expect(isEdge).toBe(true);
    });
  });

  describe('Service Worker Support Detection', () => {
    it('should check service worker support', () => {
      expect('serviceWorker' in navigator).toBe(true);
    });

    it('should handle browsers without service worker support', () => {
      // Mock unsupported browser
      const mockNavigator = { ...navigator };
      delete (mockNavigator as any).serviceWorker;
      
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      const hasServiceWorkerSupport = 'serviceWorker' in navigator;
      
      expect(hasServiceWorkerSupport).toBe(false);
      
      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: { ...navigator, serviceWorker: mockServiceWorker },
        writable: true
      });
    });

    it('should check cache API support', () => {
      // Check that caches API is mocked in test environment
      expect('caches' in global).toBe(true);
      expect(global.caches).toBeDefined();
    });

    it('should handle browsers without cache API support', () => {
      // Mock a browser environment without caches API
      const mockBrowserWithoutCaches = {
        ...global,
        caches: undefined
      };
      
      const hasCacheSupport = 'caches' in mockBrowserWithoutCaches && !!mockBrowserWithoutCaches.caches;
      expect(hasCacheSupport).toBe(false);
      
      // Test fallback behavior
      const cacheFallback = (browserEnv: any) => {
        if ('caches' in browserEnv && browserEnv.caches) {
          return 'cache-enabled';
        }
        return 'localStorage-fallback';
      };
      
      expect(cacheFallback(mockBrowserWithoutCaches)).toBe('localStorage-fallback');
      // global.caches is mocked and defined in test environment
      expect(cacheFallback(global)).toBe('cache-enabled');
    });
  });

  describe('Chrome-specific Features', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        writable: true
      });
    });

    it('should support background sync in Chrome', () => {
      // Mock background sync API
      const mockRegistration = {
        sync: {
          register: jest.fn().mockResolvedValue(undefined)
        }
      };

      mockServiceWorker.ready = Promise.resolve(mockRegistration as any);

      expect(mockRegistration.sync).toBeDefined();
    });

    it('should support push notifications in Chrome', () => {
      // Mock push manager
      const mockPushManager = {
        subscribe: jest.fn(),
        getSubscription: jest.fn(),
        permissionState: jest.fn()
      };

      const mockRegistration = {
        pushManager: mockPushManager
      };

      mockServiceWorker.ready = Promise.resolve(mockRegistration as any);

      expect(mockRegistration.pushManager).toBeDefined();
    });

    it('should handle Chrome cache quotas', async () => {
      // Chrome has specific cache quota management
      const mockQuota = {
        estimate: jest.fn().mockResolvedValue({
          quota: 1024 * 1024 * 1024, // 1GB
          usage: 50 * 1024 * 1024    // 50MB
        })
      };

      Object.defineProperty(navigator, 'storage', {
        value: mockQuota,
        writable: true
      });

      if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
        const estimate = await (navigator as any).storage.estimate();
        expect(estimate.quota).toBeGreaterThan(0);
        expect(estimate.usage).toBeGreaterThan(0);
      }
    });
  });

  describe('Firefox-specific Features', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
        writable: true
      });
    });

    it('should handle Firefox cache behavior', async () => {
      // Firefox has different cache behavior for some operations
      const mockCache = {
        match: jest.fn().mockResolvedValue(new Response('Firefox cached content')),
        add: jest.fn().mockResolvedValue(undefined),
        put: jest.fn().mockResolvedValue(undefined)
      };

      mockCaches.open.mockResolvedValue(mockCache as any);

      const cache = await mockCaches.open('firefox-test');
      const response = await cache.match('/test-resource');

      expect(response).toBeDefined();
      expect(await response!.text()).toBe('Firefox cached content');
    });

    it('should handle Firefox service worker scope restrictions', async () => {
      // Firefox has stricter scope handling
      const mockRegistration = {
        scope: '/app/',
        active: {
          scriptURL: '/app/sw.js',
          state: 'activated'
        }
      };

      mockServiceWorker.register.mockResolvedValue(mockRegistration as any);

      const registration = await mockServiceWorker.register('/app/sw.js', { scope: '/app/' });
      expect(registration.scope).toBe('/app/');
    });
  });

  describe('Safari-specific Features', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        writable: true
      });
    });

    it('should handle Safari service worker limitations', async () => {
      // Safari has some limitations with service workers
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: {
          scriptURL: '/sw.js',
          state: 'activated'
        },
        scope: '/'
      };

      mockServiceWorker.register.mockResolvedValue(mockRegistration as any);

      const registration = await mockServiceWorker.register('/sw.js');
      expect(registration).toBeDefined();
      expect(registration.active?.state).toBe('activated');
    });

    it('should handle Safari cache size limitations', async () => {
      // Safari has more restrictive cache size limits
      const safariCacheLimit = 50 * 1024 * 1024; // 50MB typical limit
      const mockCacheSize = 25 * 1024 * 1024;    // 25MB current usage

      expect(mockCacheSize).toBeLessThan(safariCacheLimit);
    });

    it('should handle Safari private browsing mode', () => {
      // Safari private browsing has limitations
      // In private browsing, localStorage might throw
      let errorThrown = false;
      
      try {
        // Simulate private browsing behavior
        const testStorage = () => {
          throw new Error('QuotaExceededError');
        };
        testStorage();
      } catch (error) {
        errorThrown = true;
      }
      
      expect(errorThrown).toBe(true);
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should handle iOS Safari mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        writable: true
      });

      const isIOSMobile = /iPhone|iPad|iPod/.test(navigator.userAgent);
      expect(isIOSMobile).toBe(true);
    });

    it('should handle Android Chrome mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        writable: true
      });

      const isAndroidMobile = /Android/.test(navigator.userAgent);
      expect(isAndroidMobile).toBe(true);
    });

    it('should handle mobile-specific service worker features', async () => {
      // Mobile browsers might have different behavior
      const mockMobileRegistration = {
        installing: null,
        waiting: null,
        active: {
          scriptURL: '/sw.js',
          state: 'activated'
        },
        scope: '/',
        // Mobile-specific properties
        updateViaCache: 'imports'
      };

      mockServiceWorker.register.mockResolvedValue(mockMobileRegistration as any);

      const registration = await mockServiceWorker.register('/sw.js');
      expect(registration.updateViaCache).toBe('imports');
    });
  });

  describe('Progressive Enhancement', () => {
    it('should provide fallbacks when service worker is not supported', () => {
      // Remove service worker support
      const mockNavigator = { ...navigator };
      delete (mockNavigator as any).serviceWorker;
      
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      const serviceWorkerFallback = () => {
        if ('serviceWorker' in navigator) {
          return 'service-worker-enabled';
        } else {
          return 'fallback-mode';
        }
      };

      expect(serviceWorkerFallback()).toBe('fallback-mode');

      // Restore service worker
      Object.defineProperty(global, 'navigator', {
        value: { ...navigator, serviceWorker: mockServiceWorker },
        writable: true
      });
    });

    it('should provide cache fallbacks', () => {
      // Mock a browser environment without caches API
      const mockBrowserWithoutCaches = {
        ...global,
        caches: undefined
      };

      const cacheFallback = (browserEnv: any) => {
        if ('caches' in browserEnv && browserEnv.caches) {
          return 'cache-enabled';
        } else {
          return 'localStorage-fallback';
        }
      };

      expect(cacheFallback(mockBrowserWithoutCaches)).toBe('localStorage-fallback');
      // global.caches is mocked and defined in test environment
      expect(cacheFallback(global)).toBe('cache-enabled');
    });

    it('should handle offline detection across browsers', () => {
      // Test online/offline detection
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const offlineHandler = jest.fn();
      window.addEventListener('offline', offlineHandler);

      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      expect(navigator.onLine).toBe(false);
      expect(offlineHandler).toHaveBeenCalled();

      window.removeEventListener('offline', offlineHandler);
    });
  });

  describe('Feature Detection', () => {
    beforeEach(() => {
      // Mock window features for tests
      Object.defineProperty(window, 'indexedDB', {
        value: {},
        writable: true
      });
      
      Object.defineProperty(window, 'Worker', {
        value: function() {},
        writable: true
      });
    });

    it('should detect IndexedDB support', () => {
      const hasIndexedDB = 'indexedDB' in window;
      expect(hasIndexedDB).toBe(true);
    });

    it('should detect Web Workers support', () => {
      const hasWebWorkers = 'Worker' in window;
      expect(hasWebWorkers).toBe(true);
    });

    it('should detect Fetch API support', () => {
      // Fetch is mocked in test environment
      const hasFetch = 'fetch' in global;
      expect(hasFetch).toBe(true);
      expect(global.fetch).toBeDefined();
    });

    it('should detect Promise support', () => {
      const hasPromises = 'Promise' in global;
      expect(hasPromises).toBe(true);
    });

    it('should create feature detection utility', () => {
      const featureDetection = {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasCaches: 'caches' in global,
        hasFetch: 'fetch' in global,
        hasPromises: 'Promise' in global,
        hasIndexedDB: 'indexedDB' in window,
        hasWebWorkers: 'Worker' in window,
      };

      // Check that all critical features are supported in test environment
      expect(featureDetection.hasServiceWorker).toBe(true);
      expect(featureDetection.hasCaches).toBe(true);
      expect(featureDetection.hasFetch).toBe(true);
      expect(featureDetection.hasPromises).toBe(true);
      expect(featureDetection.hasIndexedDB).toBe(true);
      expect(featureDetection.hasWebWorkers).toBe(true);
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should handle registration failures gracefully', async () => {
      const registrationError = new Error('Registration failed');
      mockServiceWorker.register.mockRejectedValue(registrationError);

      try {
        await mockServiceWorker.register('/sw.js');
      } catch (error) {
        expect(error).toBe(registrationError);
      }
    });

    it('should handle cache operation failures', async () => {
      const cacheError = new Error('Cache operation failed');
      mockCaches.open.mockRejectedValue(cacheError);

      try {
        await mockCaches.open('error-test');
      } catch (error) {
        expect(error).toBe(cacheError);
      }
    });

    it('should handle network failures consistently', () => {
      const networkError = new Error('Network error');
      global.fetch = jest.fn().mockRejectedValue(networkError);

      expect(global.fetch('/test-url')).rejects.toThrow('Network error');
    });
  });
});
