/**
 * Enhanced Service Worker with Intelligent Caching
 *
 * Integrates intelligent caching strategies with existing Workbox foundation.
 * Provides crisis-focused offline support for mental health platform with
 * advanced caching, background sync, and offline capabilities.
 * 
 * @fileoverview Enhanced service worker with intelligent caching and crisis support
 * @version 2.0.0
 */

/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Import our intelligent caching services
import { intelligentCache } from './services/intelligentCachingService';
import cacheCoordinator from './services/cacheStrategyCoordinator';

declare const self: ServiceWorkerGlobalScope;

/**
 * Crisis resource patterns for high-priority caching
 */
const CRISIS_PATTERNS = [
  '/crisis',
  '/emergency',
  '/988',
  '/safety',
  '/suicide-prevention',
  '/mental-health-emergency'
];

/**
 * API endpoint patterns
 */
const API_PATTERNS = [
  '/.netlify/functions/',
  '/api/'
];

/**
 * Video content patterns
 */
const VIDEO_PATTERNS = [
  /\.(mp4|webm|ogg|m4v)$/i,
  '/video/'
];

// Precache critical resources using Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Initialize intelligent caching on service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      console.log('[Enhanced SW] Service worker activated');

      try {
        // Initialize intelligent caching  
        await cacheCoordinator.initializeCacheWarming();

        // Clean up old caches
        await cacheCoordinator.performCacheCleanup();

        // Take control of all pages
        await self.clients.claim();

        console.log('[Enhanced SW] Initialization complete');
      } catch (error) {
        console.error('[Enhanced SW] Initialization failed:', error);
      }
    })()
  );
});

// Enhanced fetch handling with intelligent strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try intelligent cache coordinator first
        const coordinatorResponse = await cacheCoordinator.handleFetch(request);
        if (coordinatorResponse) {
          return coordinatorResponse;
        }

        // Fallback to specialized handlers
        return await handleSpecializedFetch(request);
      } catch (error) {
        console.error('[Enhanced SW] Fetch handling failed:', error);

        // Ultimate fallback to network
        try {
          return await fetch(request);
        } catch (networkError) {
          console.error('[Enhanced SW] Network fallback failed:', networkError);
          return await handleOfflineFallback(request);
        }
      }
    })()
  );
});

/**
 * Handle specialized fetch scenarios not covered by coordinator
 */
async function handleSpecializedFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Crisis resources - highest priority, never timeout
  if (isCrisisResource(url)) {
    return handleCrisisResourceFetch(request);
  }

  // API endpoints with background sync
  if (isApiEndpoint(url)) {
    return handleApiEndpointFetch(request);
  }

  // Large video content with smart caching
  if (isVideoContent(url)) {
    return handleVideoContentFetch(request);
  }

  // Navigation requests
  if (request.mode === 'navigate') {
    return handleNavigationFetch(request);
  }

  // Default to network
  return fetch(request);
}

/**
 * Handle crisis resource fetching with maximum reliability
 */
async function handleCrisisResourceFetch(request: Request): Promise<Response> {
  const crisisCache = await caches.open('crisis-resources-enhanced');

  // Always try cache first for crisis resources
  const cachedResponse = await crisisCache.match(request);
  if (cachedResponse) {
    console.log('[Enhanced SW] Serving crisis resource from cache:', request.url);
    return cachedResponse;
  }

  try {
    // Network with extended timeout for crisis resources
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    const networkResponse = await fetch(request, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      // Always cache crisis resources regardless of size
      await crisisCache.put(request, networkResponse.clone());
      console.log('[Enhanced SW] Cached new crisis resource:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error('[Enhanced SW] Crisis resource fetch failed:', error);

    // Return emergency offline crisis page
    const offlineResponse = await crisisCache.match('/offline-crisis.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Create minimal crisis response if nothing else available
    return new Response(
      JSON.stringify({
        emergency: '988',
        text: '988',
        international: '+1-741-741-741',
        message: 'You are not alone. Help is available.'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
}

/**
 * Handle API endpoint fetching with background sync
 */
async function handleApiEndpointFetch(request: Request): Promise<Response> {
  const apiCache = await caches.open('api-cache-enhanced');
  const url = new URL(request.url);

  // Check if this is a critical API endpoint
  const isCriticalApi = url.pathname.includes('/crisis') ||
                       url.pathname.includes('/emergency') ||
                       url.pathname.includes('/safety-plan');

  try {
    // Network first for fresh data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isCriticalApi ? 20000 : 10000);

    const networkResponse = await fetch(request, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      // Cache successful responses
      await apiCache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[Enhanced SW] API network failed, trying cache:', error);

    // Fallback to cache
    const cachedResponse = await apiCache.match(request);
    if (cachedResponse) {
      console.log('[Enhanced SW] Serving API response from cache:', request.url);
      return cachedResponse;
    }

    // For POST/PUT requests, queue for background sync
    if (request.method !== 'GET') {
      await queueForBackgroundSync(request);

      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Request queued for when connection is restored'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 202
        }
      );
    }

    throw error;
  }
}

/**
 * Handle video content with intelligent size checking
 */
async function handleVideoContentFetch(request: Request): Promise<Response> {
  const videoCache = await caches.open('video-cache-enhanced');

  // Check cache first
  const cachedResponse = await videoCache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Check storage availability before caching large videos
  const quota = await navigator.storage.estimate();
  const usagePercentage = (quota.usage || 0) / (quota.quota || 1);
  const networkResponse = await fetch(request);

  // Only cache videos if we have sufficient storage
  if (networkResponse.ok && usagePercentage < 0.7) {
    // Check response size
    const contentLength = networkResponse.headers.get('content-length');
    const responseSize = contentLength ? parseInt(contentLength, 10) : 0;

    // Only cache videos smaller than 50MB
    if (responseSize < 50 * 1024 * 1024) {
      await videoCache.put(request, networkResponse.clone());
      console.log('[Enhanced SW] Cached video content:', request.url);
    }
  }

  return networkResponse;
}

/**
 * Handle navigation requests with offline fallbacks
 */
async function handleNavigationFetch(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.warn('[Enhanced SW] Navigation network failed:', error);

    // Check if this is a crisis-related navigation
    const url = new URL(request.url);
    if (url.pathname.includes('/crisis') || url.pathname.includes('/emergency')) {
      const crisisCache = await caches.open('crisis-resources-enhanced');
      const offlineCrisis = await crisisCache.match('/offline-crisis.html');
      if (offlineCrisis) {
        return offlineCrisis;
      }
    }

    // Default offline page
    const mainCache = await caches.open('workbox-precache-v2-https://astralcore.netlify.app/');
    const offlinePage = await mainCache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Create basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Astral Core</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; }
            .crisis-banner { background: #dc3545; color: white; padding: 1rem; margin-bottom: 2rem; }
            .emergency { font-size: 2rem; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <div class="crisis-banner">
            <h2>🆘 Crisis Support Available</h2>
            <div class="emergency">Call 988 for immediate help</div>
            <p>Text "HOME" to 741741 for crisis text support</p>
          </div>
          <h1>You're Offline</h1>
          <p>Check your internet connection and try again.</p>
          <p>Crisis resources remain available offline.</p>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    );
  }
}

/**
 * Handle offline fallback responses
 */
async function handleOfflineFallback(request: Request): Promise<Response> {
  // Try to serve from any available cache
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    if (response) {
      console.log(`[Enhanced SW] Served from ${cacheName}:`, request.url);
      return response;
    }
  }

  // Return appropriate offline response based on request type
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }

  // For HTML requests, return basic offline page
  return new Response(
    '<!DOCTYPE html><html><body><h1>Offline</h1><p>Check your connection</p></body></html>',
    {
      headers: { 'Content-Type': 'text/html' },
      status: 503
    }
  );
}

/**
 * Queue requests for background sync
 */
async function queueForBackgroundSync(request: Request): Promise<void> {
  try {
    // Open IndexedDB for queue storage
    const db = await openSyncQueue();

    // Store request for later sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    };

    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    
    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(requestData);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });

    console.log('[Enhanced SW] Queued request for background sync:', request.url);
  } catch (error) {
    console.error('[Enhanced SW] Failed to queue request:', error);
  }
}

/**
 * Open IndexedDB for background sync queue
 */
async function openSyncQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sync-queue', 1);

    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB error'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

/**
 * Helper functions to identify resource types
 */
const isCrisisResource = (url: URL): boolean => {
  return CRISIS_PATTERNS.some(pattern => url.pathname.includes(pattern));
};

const isApiEndpoint = (url: URL): boolean => {
  return API_PATTERNS.some(pattern => url.pathname.includes(pattern));
};

const isVideoContent = (url: URL): boolean => {
  return VIDEO_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url.pathname);
    }
    return url.pathname.includes(pattern);
  });
};

// Background sync event handling
self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as Event & { 
    tag?: string; 
    waitUntil?: (promise: Promise<any>) => void;
  };
  
  if (syncEvent.tag === 'background-sync' && syncEvent.waitUntil) {
    syncEvent.waitUntil(handleBackgroundSync());
  }
});

/**
 * Handle background sync when connection is restored
 */
async function handleBackgroundSync(): Promise<void> {
  try {
    const db = await openSyncQueue();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');

    // Properly handle IDBRequest
    const getAllRequest = store.getAll();
    const requests = await new Promise<any[]>((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    console.log(`[Enhanced SW] Processing ${requests.length} queued requests`);

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });

        if (response.ok) {
          await new Promise<void>((resolve, reject) => {
            const deleteRequest = store.delete(requestData.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          console.log('[Enhanced SW] Successfully synced request:', requestData.url);
        }
      } catch (error) {
        console.warn('[Enhanced SW] Background sync failed for:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('[Enhanced SW] Background sync processing failed:', error);
  }
}

// Storage quota monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_STORAGE') {
    event.waitUntil(
      (async () => {
        const storageInfo = { used: 0, quota: 0 }; // Default storage info
        const analytics = await intelligentCache.getAnalytics();
        const stats = await cacheCoordinator.getCacheStatistics();

        // Send storage info back to client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'STORAGE_INFO',
            data: {
              storage: storageInfo,
              analytics,
              cacheStats: stats
            }
          });
        });
      })()
    );
  }
});

// Periodic cache maintenance
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MAINTENANCE') {
    event.waitUntil(
      (async () => {
        await cacheCoordinator.performCacheCleanup();
        await intelligentCache.clearCache();
        console.log('[Enhanced SW] Cache maintenance completed');
      })()
    );
  }
});

console.log('[Enhanced SW] Service worker script loaded with intelligent caching');
