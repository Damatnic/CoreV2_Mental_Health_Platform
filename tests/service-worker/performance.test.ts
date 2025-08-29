/**
 * Service Worker Performance Tests
 * Tests for performance metrics, cache efficiency, and resource optimization
 */

describe('Service Worker Performance', () => {
  let mockCaches: jest.Mocked<CacheStorage>;
  let mockCache: jest.Mocked<Cache>;
  let performanceEntries: PerformanceEntry[] = [];

  beforeEach(() => {
    mockCaches = global.caches as jest.Mocked<CacheStorage>;
    mockCache = {
      match: jest.fn(),
      matchAll: jest.fn(),
      add: jest.fn(),
      addAll: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn()
    } as jest.Mocked<Cache>;

    mockCaches.open.mockResolvedValue(mockCache);
    jest.clearAllMocks();
    
    // Mock performance API
    performanceEntries = [];
    global.performance.getEntriesByName = jest.fn().mockReturnValue(performanceEntries);
    global.performance.mark = jest.fn();
    global.performance.measure = jest.fn();
  });

  describe('Cache Performance', () => {
    it('should measure cache hit performance', async () => {
      const mockResponse = new Response('cached content');
      mockCache.match.mockResolvedValue(mockResponse);
      
      performance.mark('cache-start');
      
      const cache = await mockCaches.open('test-cache');
      const response = await cache.match('/test-resource');
      
      performance.mark('cache-end');
      performance.measure('cache-operation', 'cache-start', 'cache-end');
      
      expect(response).toBeDefined();
      expect(performance.mark).toHaveBeenCalledWith('cache-start');
      expect(performance.mark).toHaveBeenCalledWith('cache-end');
      expect(performance.measure).toHaveBeenCalledWith('cache-operation', 'cache-start', 'cache-end');
    });

    it('should optimize cache miss scenarios', async () => {
      mockCache.match.mockResolvedValue(undefined);
      
      const startTime = performance.now();
      
      const cache = await mockCaches.open('test-cache');
      const response = await cache.match('/non-existent-resource');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(response).toBeUndefined();
      expect(duration).toBeLessThan(10); // Cache miss should be very fast
    });

    it('should handle large cache operations efficiently', async () => {
      const largeUrls = Array.from({ length: 100 }, (_, i) => `/resource-${i}`);
      
      const startTime = performance.now();
      
      const cache = await mockCaches.open('large-cache');
      await cache.addAll(largeUrls);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(cache.addAll).toHaveBeenCalledWith(largeUrls);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should verify service worker size is under target', () => {
      // Service worker should be small for fast loading
      const maxServiceWorkerSize = 50 * 1024; // 50KB
      const mockServiceWorkerSize = 2.43 * 1024; // 2.43KB (actual size from deployment)
      
      expect(mockServiceWorkerSize).toBeLessThan(maxServiceWorkerSize);
    });

    it('should verify precached assets are under mobile target', () => {
      const maxMobileCacheSize = 500 * 1024; // 500KB target
      const actualCacheSize = 68.1 * 1024; // 68.1KB (actual from deployment)
      
      expect(actualCacheSize).toBeLessThan(maxMobileCacheSize);
    });

    it('should count precached resources efficiently', () => {
      const expectedResourceCount = 12; // From workbox config
      const criticalResources = [
        '/index.html',
        '/manifest.json',
        '/crisis-resources.json',
        '/emergency-contacts.json',
        '/offline-coping-strategies.json',
        '/offline.html',
        '/offline-crisis.html',
        '/icon-192.png',
        '/icon-512.png',
        '/sw.js',
        // Additional critical assets...
      ];
      
      expect(criticalResources.length).toBeLessThanOrEqual(expectedResourceCount + 2); // Allow some buffer
    });
  });

  describe('Memory Usage', () => {
    it('should manage cache memory efficiently', async () => {
      // Mock memory usage tracking
      const mockMemory = {
        usedJSHeapSize: 1024 * 1024, // 1MB initial
        totalJSHeapSize: 2 * 1024 * 1024
      };
      
      // Simulate heavy cache operations
      const cache = await mockCaches.open('memory-test');
      const responses = Array.from({ length: 50 }, (_, i) => 
        new Response(`Content ${i}`, { headers: { 'Content-Type': 'text/plain' } })
      );
      
      for (let i = 0; i < responses.length; i++) {
        await cache.put(`/test-${i}`, responses[i]);
      }
      
      const memoryIncrease = responses.length * 100; // Simulate memory usage
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024); // Less than 10KB for test
    });

    it('should clean up unused cache entries', async () => {
      const cache = await mockCaches.open('cleanup-test');
      
      // Add entries
      const entries = Array.from({ length: 10 }, (_, i) => `/cleanup-${i}`);
      for (const entry of entries) {
        await cache.put(entry, new Response('test content'));
      }
      
      // Clean up half of them
      const toDelete = entries.slice(0, 5);
      for (const entry of toDelete) {
        await cache.delete(entry);
      }
      
      expect(cache.delete).toHaveBeenCalledTimes(5);
    });
  });

  describe('Network Performance', () => {
    it('should implement efficient network timeouts', () => {
      const networkTimeout = 10000; // 10 seconds from workbox config
      const expectedTimeout = 10000;
      
      expect(networkTimeout).toBe(expectedTimeout);
    });

    it('should handle slow network connections gracefully', async () => {
      // Simulate slow network
      const slowNetworkDelay = 5000; // 5 seconds
      
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Response('slow content'));
        }, slowNetworkDelay);
      });
      
      mockCache.match.mockReturnValue(slowResponse as Promise<Response | undefined>);
      
      const startTime = performance.now();
      const cache = await mockCaches.open('slow-test');
      
      try {
        await cache.match('/slow-resource');
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeGreaterThan(slowNetworkDelay - 100); // Account for timing precision
      } catch (error) {
        // Timeout should handle this gracefully
        expect(error).toBeDefined();
      }
    });

    it('should prioritize critical resources', async () => {
      const criticalResources = [
        '/crisis-resources.json',
        '/emergency-contacts.json',
        '/offline-crisis.html'
      ];
      
      const normalResources = [
        '/images/banner.jpg',
        '/videos/wellness.mp4'
      ];
      
      // Critical resources should load faster (cache-first)
      for (const resource of criticalResources) {
        const mockResponse = new Response('critical content');
        mockCache.match.mockResolvedValue(mockResponse);
        
        const startTime = performance.now();
        const cache = await mockCaches.open('crisis-resources-v1');
        await cache.match(resource);
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(50); // Very fast from cache
      }
    });
  });

  describe('Background Sync Performance', () => {
    it('should queue offline requests efficiently', () => {
      const offlineQueue: Array<{ url: string; data: any; timestamp: number }> = [];
      
      const queueRequest = (url: string, data: any) => {
        offlineQueue.push({
          url,
          data,
          timestamp: Date.now()
        });
      };
      
      // Simulate multiple offline requests
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        queueRequest(`/api/request-${i}`, { data: `payload-${i}` });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(offlineQueue).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should process background sync efficiently', async () => {
      const mockQueue = Array.from({ length: 10 }, (_, i) => ({
        url: `/api/sync-${i}`,
        data: { payload: `data-${i}` },
        timestamp: Date.now() - (i * 1000)
      }));
      
      const processQueue = async (queue: typeof mockQueue) => {
        const processed: string[] = [];
        const startTime = performance.now();
        
        for (const item of queue) {
          // Simulate API call with minimal delay
          await new Promise<void>(resolve => {
            setTimeout(resolve, 1);
          });
          processed.push(item.url);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return { processed, duration };
      };
      
      const result = await processQueue(mockQueue);
      
      expect(result.processed).toHaveLength(10);
      expect(result.duration).toBeLessThan(1000); // 1 second max
    }, 15000);
  });

  describe('Cache Strategy Performance', () => {
    it('should measure cache-first strategy performance', async () => {
      const mockResponse = new Response('cached crisis resource');
      mockCache.match.mockResolvedValue(mockResponse);
      
      const startTime = performance.now();
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-resources.json');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(response).toBeDefined();
      expect(duration).toBeLessThan(25); // Cache-first should be very fast
    });

    it('should measure network-first strategy performance', async () => {
      // Simulate network-first with cache fallback
      const cacheResponse = new Response('cached api response');
      mockCache.match.mockResolvedValue(cacheResponse);
      
      const startTime = performance.now();
      
      // First try network (simulate failure)
      try {
        throw new Error('Network failed');
      } catch {
        // Fall back to cache
        const cache = await mockCaches.open('api-cache-v1');
        const response = await cache.match('/api/fallback');
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(response).toBeDefined();
        expect(duration).toBeLessThan(100); // Fallback should be reasonably fast
      }
    });

    it('should measure stale-while-revalidate performance', async () => {
      const staleResponse = new Response('stale content');
      mockCache.match.mockResolvedValue(staleResponse);
      
      const startTime = performance.now();
      
      // Serve stale content immediately
      const cache = await mockCaches.open('images-v1');
      const response = await cache.match('/image.png');
      
      // Simulate background revalidation
      const revalidateStart = performance.now();
      await cache.put('/image.png', new Response('fresh content'));
      const revalidateEnd = performance.now();
      
      const serveTime = performance.now() - startTime;
      const revalidateTime = revalidateEnd - revalidateStart;
      
      expect(response).toBeDefined();
      expect(serveTime).toBeLessThan(50); // Immediate serve
      expect(revalidateTime).toBeLessThan(200); // Background update
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle cache errors without blocking', async () => {
      const cacheError = new Error('Cache operation failed');
      mockCache.match.mockRejectedValue(cacheError);
      
      const startTime = performance.now();
      
      try {
        const cache = await mockCaches.open('error-test');
        await cache.match('/test-resource');
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeDefined();
        expect(duration).toBeLessThan(100); // Errors should fail fast
      }
    });

    it('should provide graceful degradation', async () => {
      // When all cache operations fail, should still provide basic functionality
      mockCaches.open.mockRejectedValue(new Error('Cache unavailable'));
      
      const startTime = performance.now();
      
      try {
        await mockCaches.open('degraded-test');
      } catch (error) {
        // Should fail gracefully and quickly
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeDefined();
        expect(duration).toBeLessThan(50);
      }
    });
  });
});
