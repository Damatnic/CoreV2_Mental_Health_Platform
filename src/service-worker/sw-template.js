/**
 * Astral Core Service Worker Template
 *
 * This service worker provides comprehensive offline functionality for a mental health
 * support platform with special emphasis on crisis intervention capabilities.
 *
 * Key Features:
 * - Crisis resources always available offline
 * - Background sync for critical user actions
 * - Intelligent caching strategies
 * - Performance optimization
 * - Privacy protection
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Service Worker Version and Configuration
const SW_VERSION = "1.0.0";
const CACHE_PREFIX = "astral-core";
const CRISIS_MODE_ENABLED = true;

// Cache Names
const CACHE_NAMES = {
  CRITICAL: `${CACHE_PREFIX}-critical-v1`,
  API: `${CACHE_PREFIX}-api-v1`,
  COMMUNITY: `${CACHE_PREFIX}-community-v1`,
  CRISIS: `${CACHE_PREFIX}-crisis-v1`,
  IMAGES: `${CACHE_PREFIX}-images-v1`,
  FONTS: `${CACHE_PREFIX}-fonts-v1`
};

// Crisis Resources (Always Available Offline)
const CRISIS_RESOURCES = [
  "/crisis",
  "/emergency",
  "/safety-plan",
  "/crisis-resources.json",
  "/offline-coping-strategies.json",
  "/emergency-contacts.json"
];

// Background Sync Queues
const bgSyncQueues = {
  crisis: new BackgroundSync("crisis-reports", {
    maxRetentionTime: 24 * 60 // 24 hours
  }),
  wellness: new BackgroundSync("wellness-data", {
    maxRetentionTime: 7 * 24 * 60 // 7 days
  }),
  messages: new BackgroundSync("messages", {
    maxRetentionTime: 3 * 24 * 60 // 3 days
  })
};

// Initialize precache from Vite manifest
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old caches
cleanupOutdatedCaches();

/**
 * Crisis Detection and Response
 * Monitors for crisis-related activity and ensures immediate resource availability
 */
class CrisisInterventionHandler {
  constructor() {
    this.crisisIndicators = [
      'suicide', 'kill', 'harm', 'die', 'end it', 
      'not worth', 'no hope', 'hurt myself', 'overdose'
    ];
    this.lastCrisisCheck = null;
  }

  detectCrisis(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return this.crisisIndicators.some(indicator => 
      lowerText.includes(indicator)
    );
  }

  async handleCrisisDetection(request) {
    const requestBody = await request.clone().text();
    
    if (this.detectCrisis(requestBody)) {
      // Log crisis detection (privacy-preserving)
      console.warn('Crisis indicators detected - activating emergency resources');
      
      // Ensure crisis resources are cached
      await this.ensureCrisisResourcesCached();
      
      // Add to priority sync queue
      bgSyncQueues.crisis.pushRequest({ request });
      
      return true;
    }
    return false;
  }

  async ensureCrisisResourcesCached() {
    const cache = await caches.open(CACHE_NAMES.CRISIS);
    
    for (const resource of CRISIS_RESOURCES) {
      try {
        const cachedResponse = await cache.match(resource);
        if (!cachedResponse) {
          const response = await fetch(resource);
          if (response.ok) {
            await cache.put(resource, response.clone());
          }
        }
      } catch (error) {
        console.error(`Failed to cache crisis resource: ${resource}`, error);
      }
    }
  }
}

const crisisHandler = new CrisisInterventionHandler();

/**
 * Install Event - Precache critical resources
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache crisis resources immediately
      crisisHandler.ensureCrisisResourcesCached(),
      
      // Cache shell and critical assets
      caches.open(CACHE_NAMES.CRITICAL).then(cache => 
        cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/manifest.json'
        ])
      ),
      
      // Skip waiting to activate immediately for crisis situations
      self.skipWaiting()
    ])
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => 
        Promise.all(
          cacheNames
            .filter(name => name.startsWith(CACHE_PREFIX))
            .filter(name => !Object.values(CACHE_NAMES).includes(name))
            .map(name => caches.delete(name))
        )
      ),
      
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

/**
 * Crisis Resources Route
 * Always serve from cache first, update in background
 */
registerRoute(
  ({ url }) => CRISIS_RESOURCES.includes(url.pathname),
  new CacheFirst({
    cacheName: CACHE_NAMES.CRISIS,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 50
      })
    ]
  })
);

/**
 * API Routes
 * Network first with cache fallback for API calls
 */
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.API,
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60, // 5 minutes
        maxEntries: 100
      })
    ]
  })
);

/**
 * Community/Social Routes
 * Stale while revalidate for community content
 */
registerRoute(
  ({ url }) => url.pathname.startsWith('/community/') || 
              url.pathname.startsWith('/tether/'),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.COMMUNITY,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1 hour
        maxEntries: 200
      })
    ]
  })
);

/**
 * Image Caching
 * Cache first for images with long expiration
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.IMAGES,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 100
      })
    ]
  })
);

/**
 * Font Caching
 * Cache first for fonts
 */
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: CACHE_NAMES.FONTS,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 30
      })
    ]
  })
);

/**
 * Navigation Route
 * Handle all navigation requests
 */
const navigationRoute = new NavigationRoute(async (params) => {
  try {
    // Try to get from network first
    const response = await fetch(params.event.request);
    return response;
  } catch (error) {
    // If offline, check if it's a crisis page
    const url = new URL(params.event.request.url);
    
    if (CRISIS_RESOURCES.includes(url.pathname)) {
      const cache = await caches.open(CACHE_NAMES.CRISIS);
      const cachedResponse = await cache.match(url.pathname);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline page
    const cache = await caches.open(CACHE_NAMES.CRITICAL);
    return cache.match('/offline.html');
  }
});

registerRoute(navigationRoute);

/**
 * Fetch Event Handler
 * Handle all fetch requests with crisis detection
 */
self.addEventListener('fetch', (event) => {
  // Check for crisis indicators in POST requests
  if (event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        // Check for crisis content
        const isCrisis = await crisisHandler.handleCrisisDetection(event.request);
        
        if (isCrisis && !navigator.onLine) {
          // Store in background sync for when connection returns
          return new Response(
            JSON.stringify({ 
              queued: true, 
              message: 'Your message has been saved and will be sent when connection is restored.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 202 
            }
          );
        }
        
        // Continue with normal fetch
        try {
          return await fetch(event.request);
        } catch (error) {
          // Handle offline scenario
          return new Response(
            JSON.stringify({ 
              error: 'Network unavailable', 
              offline: true 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503 
            }
          );
        }
      })()
    );
  }
});

/**
 * Message Event Handler
 * Handle messages from the main application
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CRISIS_RESOURCES') {
    event.waitUntil(crisisHandler.ensureCrisisResourcesCached());
  }
  
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      )
    );
  }
});

/**
 * Sync Event Handler
 * Handle background sync when connection is restored
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'crisis-reports') {
    event.waitUntil(
      // Process crisis reports with highest priority
      processCrisisReports()
    );
  } else if (event.tag === 'wellness-data') {
    event.waitUntil(
      // Sync wellness tracking data
      syncWellnessData()
    );
  } else if (event.tag === 'messages') {
    event.waitUntil(
      // Sync messages and community posts
      syncMessages()
    );
  }
});

/**
 * Process crisis reports when connection is restored
 */
async function processCrisisReports() {
  console.log('Processing queued crisis reports...');
  // Implementation would process queued crisis reports
  return Promise.resolve();
}

/**
 * Sync wellness tracking data
 */
async function syncWellnessData() {
  console.log('Syncing wellness data...');
  // Implementation would sync wellness data
  return Promise.resolve();
}

/**
 * Sync messages and community posts
 */
async function syncMessages() {
  console.log('Syncing messages...');
  // Implementation would sync messages
  return Promise.resolve();
}

/**
 * Notification Click Handler
 * Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle different notification types
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Push Event Handler
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Astral Core',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Astral Core', options)
  );
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CrisisInterventionHandler,
    CACHE_NAMES,
    CRISIS_RESOURCES
  };
}