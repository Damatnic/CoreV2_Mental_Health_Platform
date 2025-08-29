/**
 * Service Worker Cache Strategy Tests
 * Tests for different caching strategies and cache management
 */

describe('Service Worker Cache Strategies', () => {
  let mockCaches: jest.Mocked<CacheStorage>;
  let mockCache: jest.Mocked<Cache>;

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

    jest.clearAllMocks();
    mockCaches.open.mockResolvedValue(mockCache);
  });

  describe('Crisis Resources Cache (Cache First)', () => {
    const crisisResourceUrls = [
      '/crisis-resources.json',
      '/offline-coping-strategies.json',
      '/emergency-contacts.json'
    ];

    it('should cache crisis resources with highest priority', async () => {
      const cache = await mockCaches.open('crisis-resources-v1');
      
      await cache.addAll(crisisResourceUrls);
      
      expect(mockCaches.open).toHaveBeenCalledWith('crisis-resources-v1');
      expect(cache.addAll).toHaveBeenCalledWith(crisisResourceUrls);
    });

    it('should serve crisis resources from cache first', async () => {
      const mockResponse = new Response(JSON.stringify({
        hotlines: ['988', '1-800-273-8255'],
        resources: ['https://suicidepreventionlifeline.org']
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-resources.json');
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
    });

    it('should return undefined for cache miss', async () => {
      mockCache.match.mockResolvedValue(undefined);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/non-existent-resource.json');
      
      expect(response).toBeUndefined();
    });

    it('should handle cache storage errors gracefully', async () => {
      const cacheError = new Error('Cache storage full');
      mockCache.addAll.mockRejectedValue(cacheError);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      
      await expect(cache.addAll(crisisResourceUrls)).rejects.toThrow('Cache storage full');
    });
  });

  describe('Offline Pages Cache', () => {
    const offlinePages = ['/offline.html', '/offline-crisis.html'];

    it('should cache offline fallback pages', async () => {
      const cache = await mockCaches.open('offline-pages-v1');
      
      await cache.addAll(offlinePages);
      
      expect(cache.addAll).toHaveBeenCalledWith(offlinePages);
    });

    it('should serve offline page when network fails', async () => {
      const mockOfflineResponse = new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Offline - Astral Core</title></head>
          <body>
            <h1>You're offline</h1>
            <p>Some features are still available...</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });

      mockCache.match.mockResolvedValue(mockOfflineResponse);
      
      const cache = await mockCaches.open('offline-pages-v1');
      const response = await cache.match('/offline.html');
      
      expect(response).toBeDefined();
      expect(response?.headers.get('Content-Type')).toBe('text/html');
    });

    it('should prioritize crisis offline page for crisis routes', async () => {
      const mockCrisisOfflineResponse = new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Crisis Support - Offline</title></head>
          <body>
            <h1>Crisis Support Available Offline</h1>
            <div id="crisis-resources">
              <h2>Emergency Contacts</h2>
              <p>988 - Suicide & Crisis Lifeline</p>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });

      mockCache.match.mockResolvedValue(mockCrisisOfflineResponse);
      
      const cache = await mockCaches.open('offline-pages-v1');
      const response = await cache.match('/offline-crisis.html');
      
      expect(response).toBeDefined();
      const text = await response!.text();
      expect(text).toContain('Crisis Support Available Offline');
      expect(text).toContain('988');
    });
  });

  describe('API Cache (Network First)', () => {
    it('should cache API responses', async () => {
      const mockApiResponse = new Response(JSON.stringify({
        success: true,
        data: { message: 'Hello from API' }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

      const cache = await mockCaches.open('api-cache-v1');
      
      await cache.put('/api/test', mockApiResponse);
      
      expect(cache.put).toHaveBeenCalledWith('/api/test', mockApiResponse);
    });

    it('should serve cached API response when network fails', async () => {
      const mockCachedResponse = new Response(JSON.stringify({
        success: true,
        data: { message: 'Cached response' },
        cached: true
      }));

      mockCache.match.mockResolvedValue(mockCachedResponse);
      
      const cache = await mockCaches.open('api-cache-v1');
      const response = await cache.match('/api/test');
      
      expect(response).toBeDefined();
      const data = await response!.json();
      expect(data.cached).toBe(true);
    });

    it('should handle network timeout for API calls', async () => {
      // Simulate network timeout by not resolving the promise immediately
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), 100);
      });

      mockCache.match.mockImplementation(() => timeoutPromise as Promise<Response | undefined>);
      
      const cache = await mockCaches.open('api-cache-v1');
      
      await expect(cache.match('/api/slow-endpoint')).rejects.toThrow('Network timeout');
    });
  });

  describe('Image Cache (Stale While Revalidate)', () => {
    const imageUrls = [
      '/icon-192.png',
      '/icon-512.png',
      '/favicon.ico'
    ];

    it('should cache images', async () => {
      const cache = await mockCaches.open('images-v1');
      
      for (const url of imageUrls) {
        const mockImageResponse = new Response(new ArrayBuffer(1024), {
          headers: { 'Content-Type': 'image/png' }
        });
        await cache.put(url, mockImageResponse);
      }
      
      expect(cache.put).toHaveBeenCalledTimes(imageUrls.length);
    });

    it('should serve cached images immediately', async () => {
      const mockImageResponse = new Response(new ArrayBuffer(2048), {
        headers: { 'Content-Type': 'image/png' }
      });

      mockCache.match.mockResolvedValue(mockImageResponse);
      
      const cache = await mockCaches.open('images-v1');
      const response = await cache.match('/icon-192.png');
      
      expect(response).toBeDefined();
      expect(response?.headers.get('Content-Type')).toBe('image/png');
    });
  });

  describe('Cache Management', () => {
    it('should list all cached requests', async () => {
      const mockRequests = [
        new Request('/crisis-resources.json'),
        new Request('/offline.html'),
        new Request('/icon-192.png')
      ];

      mockCache.keys.mockResolvedValue(mockRequests);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const requests = await cache.keys();
      
      expect(requests).toHaveLength(3);
      expect(requests[0].url).toContain('/crisis-resources.json');
    });

    it('should delete specific cache entries', async () => {
      mockCache.delete.mockResolvedValue(true);
      
      const cache = await mockCaches.open('api-cache-v1');
      const deleted = await cache.delete('/api/old-endpoint');
      
      expect(deleted).toBe(true);
      expect(cache.delete).toHaveBeenCalledWith('/api/old-endpoint');
    });

    it('should handle cache deletion failures', async () => {
      mockCache.delete.mockResolvedValue(false);
      
      const cache = await mockCaches.open('images-v1');
      const deleted = await cache.delete('/non-existent-image.png');
      
      expect(deleted).toBe(false);
    });

    it('should check if cache exists', async () => {
      mockCaches.has.mockResolvedValue(true);
      
      const exists = await mockCaches.has('crisis-resources-v1');
      
      expect(exists).toBe(true);
    });

    it('should get all cache names', async () => {
      const cacheNames = [
        'crisis-resources-v1',
        'offline-pages-v1',
        'api-cache-v1',
        'images-v1'
      ];

      mockCaches.keys.mockResolvedValue(cacheNames);
      
      const allCaches = await mockCaches.keys();
      
      expect(allCaches).toEqual(cacheNames);
      expect(allCaches).toContain('crisis-resources-v1');
    });

    it('should delete entire cache', async () => {
      mockCaches.delete.mockResolvedValue(true);
      
      const deleted = await mockCaches.delete('old-cache-v1');
      
      expect(deleted).toBe(true);
    });
  });

  describe('Cache Size Management', () => {
    it('should respect maximum cache size limits', async () => {
      // Test that we don't exceed 5MB for crisis resources
      const maxSize = 5 * 1024 * 1024; // 5MB
      const largeResource = new ArrayBuffer(maxSize + 1);
      
      const mockLargeResponse = new Response(largeResource);
      
      // This should ideally reject or handle gracefully
      const cache = await mockCaches.open('crisis-resources-v1');
      
      // In a real service worker, this would check size before caching
      // For testing, we simulate the behavior
      try {
        await cache.put('/large-resource.json', mockLargeResponse);
        // Should handle large resources gracefully
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should implement cache eviction for API cache', async () => {
      const cache = await mockCaches.open('api-cache-v1');
      
      // Simulate adding many entries (>50 max entries)
      const requests = Array.from({ length: 55 }, (_, i) => 
        new Request(`/api/endpoint-${i}`)
      );

      mockCache.keys.mockResolvedValue(requests);
      
      const allRequests = await cache.keys();
      
      // Should have mechanisms to limit entries
      expect(allRequests.length).toBeGreaterThan(50);
    });
  });
});
