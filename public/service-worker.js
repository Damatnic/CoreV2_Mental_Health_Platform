/**
 * Service Worker for CoreV2 Mental Health Platform
 * Implements offline caching, background sync, and performance optimizations
 */

const CACHE_NAME = 'corev2-cache-v1';
const DYNAMIC_CACHE = 'corev2-dynamic-v1';
const OFFLINE_URL = '/offline.html';

// Critical resources that must be cached
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/crisis', // Crisis page must always be available
];

// Asset patterns to cache
const CACHE_PATTERNS = {
  static: /\.(js|css|woff2?|ttf|otf|eot)$/,
  images: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  api: /\/api\/(assessments|resources|crisis)/,
};

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: [
    /\.(css|js|woff2?)$/,
    /\/static\//,
  ],
  networkFirst: [
    /\/api\//,
    /\/auth\//,
  ],
  staleWhileRevalidate: [
    /\.(png|jpg|jpeg|gif|svg|webp)$/,
    /\/content\//,
  ],
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('corev2-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all pages
      self.clients.claim(),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Determine caching strategy
  const strategy = getCachingStrategy(request);
  
  event.respondWith(
    executeStrategy(strategy, request)
      .catch(() => {
        // If both cache and network fail, show offline page
        if (request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
        // Return a fallback response for other resources
        return new Response('Resource unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncAssessments());
  } else if (event.tag === 'sync-reflections') {
    event.waitUntil(syncReflections());
  } else if (event.tag === 'sync-crisis-logs') {
    event.waitUntil(syncCrisisLogs());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from CoreV2',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now(),
      url: '/',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('CoreV2 Mental Health', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Message handler for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearCache();
  }
});

/**
 * Determine caching strategy for a request
 */
function getCachingStrategy(request) {
  const url = request.url;

  // Check cache-first patterns
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(url)) {
      return 'cache-first';
    }
  }

  // Check network-first patterns
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(url)) {
      return 'network-first';
    }
  }

  // Check stale-while-revalidate patterns
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (pattern.test(url)) {
      return 'stale-while-revalidate';
    }
  }

  // Default to network-first
  return 'network-first';
}

/**
 * Execute caching strategy
 */
async function executeStrategy(strategy, request) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request);
    case 'network-first':
      return networkFirst(request);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network-first strategy
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * Sync assessments data
 */
async function syncAssessments() {
  try {
    const db = await openIndexedDB();
    const pendingAssessments = await getPendingAssessments(db);
    
    for (const assessment of pendingAssessments) {
      await fetch('/api/assessments/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessment),
      });
      
      await markAssessmentSynced(db, assessment.id);
    }
  } catch (error) {
    console.error('[ServiceWorker] Assessment sync failed:', error);
  }
}

/**
 * Sync reflections data
 */
async function syncReflections() {
  try {
    const db = await openIndexedDB();
    const pendingReflections = await getPendingReflections(db);
    
    for (const reflection of pendingReflections) {
      await fetch('/api/reflections/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reflection),
      });
      
      await markReflectionSynced(db, reflection.id);
    }
  } catch (error) {
    console.error('[ServiceWorker] Reflection sync failed:', error);
  }
}

/**
 * Sync crisis logs
 */
async function syncCrisisLogs() {
  try {
    const db = await openIndexedDB();
    const pendingLogs = await getPendingCrisisLogs(db);
    
    for (const log of pendingLogs) {
      await fetch('/api/crisis/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });
      
      await markCrisisLogSynced(db, log.id);
    }
  } catch (error) {
    console.error('[ServiceWorker] Crisis log sync failed:', error);
  }
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
}

/**
 * Clear all caches
 */
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );
}

/**
 * IndexedDB helper functions
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CoreV2DB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getPendingAssessments(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['assessments'], 'readonly');
    const store = transaction.objectStore('assessments');
    const request = store.getAll();
    request.onsuccess = () => {
      const assessments = request.result.filter(a => !a.synced);
      resolve(assessments);
    };
    request.onerror = () => reject(request.error);
  });
}

function markAssessmentSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['assessments'], 'readwrite');
    const store = transaction.objectStore('assessments');
    const request = store.get(id);
    request.onsuccess = () => {
      const assessment = request.result;
      assessment.synced = true;
      store.put(assessment);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

function getPendingReflections(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reflections'], 'readonly');
    const store = transaction.objectStore('reflections');
    const request = store.getAll();
    request.onsuccess = () => {
      const reflections = request.result.filter(r => !r.synced);
      resolve(reflections);
    };
    request.onerror = () => reject(request.error);
  });
}

function markReflectionSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reflections'], 'readwrite');
    const store = transaction.objectStore('reflections');
    const request = store.get(id);
    request.onsuccess = () => {
      const reflection = request.result;
      reflection.synced = true;
      store.put(reflection);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

function getPendingCrisisLogs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['crisisLogs'], 'readonly');
    const store = transaction.objectStore('crisisLogs');
    const request = store.getAll();
    request.onsuccess = () => {
      const logs = request.result.filter(l => !l.synced);
      resolve(logs);
    };
    request.onerror = () => reject(request.error);
  });
}

function markCrisisLogSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['crisisLogs'], 'readwrite');
    const store = transaction.objectStore('crisisLogs');
    const request = store.get(id);
    request.onsuccess = () => {
      const log = request.result;
      log.synced = true;
      store.put(log);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Log slow network requests
    if (entry.duration > 3000) {
      console.warn('[ServiceWorker] Slow request:', {
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
      });
    }
  }
});

// Start observing performance
if (typeof PerformanceObserver !== 'undefined') {
  performanceObserver.observe({ entryTypes: ['resource', 'navigation'] });
}

console.log('[ServiceWorker] Service worker loaded successfully');