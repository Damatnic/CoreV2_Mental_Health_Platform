/**
 * Astral Core Advanced Service Worker
 * Intelligent caching with mental health feature prioritization
 */

// Configuration
const CACHE_VERSION = 'v1.0.0';
const CACHE_PREFIX = 'astral-core-';
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}static-${CACHE_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}dynamic-${CACHE_VERSION}`,
  CRISIS: `${CACHE_PREFIX}crisis-${CACHE_VERSION}`,
  JOURNAL: `${CACHE_PREFIX}journal-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}images-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}api-${CACHE_VERSION}`
};

// Critical resources that must always be available
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/crisis.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Crisis resources - highest priority
const CRISIS_RESOURCES = [
  '/crisis',
  '/crisis.html',
  '/emergency',
  '/api/crisis/hotlines',
  '/api/crisis/resources',
  '/api/crisis/chat'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Route matching patterns
const ROUTE_PATTERNS = [
  {
    pattern: /\/crisis|\/emergency/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: CACHE_NAMES.CRISIS,
    networkTimeoutSeconds: 2
  },
  {
    pattern: /\/api\/journal/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: CACHE_NAMES.JOURNAL
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: CACHE_NAMES.API,
    networkTimeoutSeconds: 5
  },
  {
    pattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: CACHE_NAMES.IMAGES
  },
  {
    pattern: /\.(js|css)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: CACHE_NAMES.STATIC
  }
];

// Utility functions
const log = (message, ...args) => {
  if (self.location.hostname === 'localhost') {
    console.log(`[SW] ${message}`, ...args);
  }
};

const getCacheStrategy = (request) => {
  const url = new URL(request.url);
  
  for (const route of ROUTE_PATTERNS) {
    if (route.pattern.test(url.pathname) || route.pattern.test(url.href)) {
      return route;
    }
  }
  
  return {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: CACHE_NAMES.DYNAMIC,
    networkTimeoutSeconds: 10
  };
};

// Cache strategies implementation
const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    log('Cache hit:', request.url);
    return cachedResponse;
  }
  
  log('Cache miss, fetching:', request.url);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    log('Network error:', error);
    throw error;
  }
};

const networkFirst = async (request, cacheName, timeoutSeconds = 5) => {
  const cache = await caches.open(cacheName);
  
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeoutSeconds * 1000)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      log('Network success, cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    log('Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    log('Background update failed:', error);
    return null;
  });
  
  return cachedResponse || networkPromise;
};

// Install event
self.addEventListener('install', event => {
  log('Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CACHE_NAMES.STATIC).then(cache => {
        log('Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Pre-cache crisis resources
      caches.open(CACHE_NAMES.CRISIS).then(cache => {
        log('Pre-caching crisis resources');
        return cache.addAll(
          CRISIS_RESOURCES.filter(url => !url.startsWith('/api'))
        );
      })
    ]).then(() => {
      log('Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event
self.addEventListener('activate', event => {
  log('Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith(CACHE_PREFIX))
          .filter(name => !Object.values(CACHE_NAMES).includes(name))
          .map(name => {
            log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      log('Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    (async () => {
      try {
        let response;
        
        switch (strategy.strategy) {
          case CACHE_STRATEGIES.CACHE_FIRST:
            response = await cacheFirst(request, strategy.cacheName);
            break;
            
          case CACHE_STRATEGIES.NETWORK_FIRST:
            response = await networkFirst(
              request,
              strategy.cacheName,
              strategy.networkTimeoutSeconds
            );
            break;
            
          case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            response = await staleWhileRevalidate(request, strategy.cacheName);
            break;
            
          case CACHE_STRATEGIES.CACHE_ONLY:
            const cache = await caches.open(strategy.cacheName);
            response = await cache.match(request);
            if (!response) {
              throw new Error('Cache miss');
            }
            break;
            
          case CACHE_STRATEGIES.NETWORK_ONLY:
          default:
            response = await fetch(request);
            break;
        }
        
        return response;
      } catch (error) {
        log('Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          const offlineResponse = await caches.match('/offline.html');
          if (offlineResponse) {
            return offlineResponse;
          }
        }
        
        // Return 503 Service Unavailable for other failed requests
        return new Response('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    })()
  );
});

// Background sync for journal entries
self.addEventListener('sync', event => {
  if (event.tag === 'sync-journal-entries') {
    log('Syncing journal entries...');
    event.waitUntil(syncJournalEntries());
  }
});

async function syncJournalEntries() {
  const cache = await caches.open(CACHE_NAMES.JOURNAL);
  const requests = await cache.keys();
  
  const syncPromises = requests
    .filter(request => request.method === 'POST' || request.method === 'PUT')
    .map(async request => {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
          log('Synced journal entry:', request.url);
        }
      } catch (error) {
        log('Sync failed, will retry:', request.url);
      }
    });
  
  return Promise.all(syncPromises);
}

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Astral Core Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };
  
  // Don't show notifications for crisis alerts if user has disabled them
  if (data.type === 'crisis' && !data.forceShow) {
    return;
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if needed
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handler for cache operations
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames
              .filter(name => name.startsWith(CACHE_PREFIX))
              .map(name => caches.delete(name))
          );
        }).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHE_NAMES.DYNAMIC).then(cache => {
          return cache.addAll(payload.urls);
        }).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
  }
});

// Performance monitoring
const reportPerformance = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    const metrics = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
    
    // Adjust caching strategy based on connection
    if (connection.saveData || connection.effectiveType === 'slow-2g') {
      // More aggressive caching for slow connections
      log('Slow connection detected, adjusting cache strategy');
    }
  }
};

// Monitor performance periodically
setInterval(reportPerformance, 30000); // Every 30 seconds

log('Service worker loaded successfully');