/**
 * Enhanced Service Worker for AstralCore
 * 
 * Provides comprehensive offline functionality with multilingual crisis resources,
 * optimized for low-connectivity environments common in underserved communities.
 * 
 * Features:
 * - Multilingual crisis resources caching (8 languages)
 * - Cultural context-aware resource prioritization
 * - Intelligent background sync
 * - Progressive enhancement strategies
 * - Emergency protocol activation
 * 
 * @license Apache-2.0
 */

const CACHE_VERSION = 'v2.1.0';
const STATIC_CACHE_NAME = `astral-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `astral-dynamic-${CACHE_VERSION}`;
const CRISIS_CACHE_NAME = `astral-crisis-${CACHE_VERSION}`;
const I18N_CACHE_NAME = `astral-i18n-${CACHE_VERSION}`;
const CULTURAL_CACHE_NAME = `astral-cultural-${CACHE_VERSION}`;

// Critical resources that must be available offline
const CRITICAL_STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html',
  '/offline-crisis.html'
];

// Crisis resources by language and cultural context
const MULTILINGUAL_CRISIS_RESOURCES = {
  // English (Western)
  'en-western': [
    '/crisis-resources/en/emergency-contacts.json',
    '/crisis-resources/en/coping-strategies.json',
    '/crisis-resources/en/safety-planning.json',
    '/crisis-resources/en/cultural-guidance.json'
  ],
  // Spanish (Hispanic/Latino)
  'es-hispanic': [
    '/crisis-resources/es/emergency-contacts.json',
    '/crisis-resources/es/coping-strategies.json',
    '/crisis-resources/es/safety-planning.json',
    '/crisis-resources/es/cultural-guidance.json'
  ],
  // Portuguese (Brazilian)
  'pt-BR-brazilian': [
    '/crisis-resources/pt-BR/emergency-contacts.json',
    '/crisis-resources/pt-BR/coping-strategies.json',
    '/crisis-resources/pt-BR/safety-planning.json',
    '/crisis-resources/pt-BR/cultural-guidance.json'
  ],
  // Portuguese (European)
  'pt-portuguese': [
    '/crisis-resources/pt/emergency-contacts.json',
    '/crisis-resources/pt/coping-strategies.json',
    '/crisis-resources/pt/safety-planning.json',
    '/crisis-resources/pt/cultural-guidance.json'
  ],
  // Arabic
  'ar-arabic': [
    '/crisis-resources/ar/emergency-contacts.json',
    '/crisis-resources/ar/coping-strategies.json',
    '/crisis-resources/ar/safety-planning.json',
    '/crisis-resources/ar/cultural-guidance.json'
  ],
  // Chinese
  'zh-chinese': [
    '/crisis-resources/zh/emergency-contacts.json',
    '/crisis-resources/zh/coping-strategies.json',
    '/crisis-resources/zh/safety-planning.json',
    '/crisis-resources/zh/cultural-guidance.json'
  ],
  // Vietnamese
  'vi-vietnamese': [
    '/crisis-resources/vi/emergency-contacts.json',
    '/crisis-resources/vi/coping-strategies.json',
    '/crisis-resources/vi/safety-planning.json',
    '/crisis-resources/vi/cultural-guidance.json'
  ],
  // Filipino (Tagalog)
  'tl-filipino': [
    '/crisis-resources/tl/emergency-contacts.json',
    '/crisis-resources/tl/coping-strategies.json',
    '/crisis-resources/tl/safety-planning.json',
    '/crisis-resources/tl/cultural-guidance.json'
  ]
};

// Translation files for offline access
const I18N_RESOURCES = [
  '/locales/en/translation.json',
  '/locales/es/translation.json',
  '/locales/pt-BR/translation.json',
  '/locales/pt/translation.json',
  '/locales/ar/translation.json',
  '/locales/zh/translation.json',
  '/locales/vi/translation.json',
  '/locales/tl/translation.json'
];

// Cultural context data
const CULTURAL_RESOURCES = [
  '/cultural-contexts/western.json',
  '/cultural-contexts/hispanic-latino.json',
  '/cultural-contexts/brazilian.json',
  '/cultural-contexts/portuguese.json',
  '/cultural-contexts/arabic.json',
  '/cultural-contexts/chinese.json',
  '/cultural-contexts/vietnamese.json',
  '/cultural-contexts/filipino.json'
];

// High-priority patterns for crisis-related requests
const CRISIS_PATTERNS = [
  /crisis/i,
  /emergency/i,
  /safety/i,
  /help/i,
  /suicide/i,
  /depression/i,
  /anxiety/i
];

// Network-first patterns for real-time features
const NETWORK_FIRST_PATTERNS = [
  /\.netlify\/functions\/chat/,
  /\.netlify\/functions\/crisis/,
  /\.netlify\/functions\/sessions/,
  /\.netlify\/functions\/auth/,
  /\.netlify\/functions\/ai/
];

// Cache-first patterns for static assets
const CACHE_FIRST_PATTERNS = [
  /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$/,
  /\/locales\//,
  /\/cultural-contexts\//,
  /\/crisis-resources\//
];

/**
 * Install Event - Precache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical static resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[Enhanced SW] Caching critical static resources');
        return cache.addAll(CRITICAL_STATIC_RESOURCES.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      
      // Cache all crisis resources for all languages
      caches.open(CRISIS_CACHE_NAME).then((cache) => {
        console.log('[Enhanced SW] Caching multilingual crisis resources');
        const allCrisisResources = Object.values(MULTILINGUAL_CRISIS_RESOURCES).flat();
        return cache.addAll(allCrisisResources.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      
      // Cache translation files
      caches.open(I18N_CACHE_NAME).then((cache) => {
        console.log('[Enhanced SW] Caching translation files');
        return cache.addAll(I18N_RESOURCES.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      
      // Cache cultural context data
      caches.open(CULTURAL_CACHE_NAME).then((cache) => {
        console.log('[Enhanced SW] Caching cultural context data');
        return cache.addAll(CULTURAL_RESOURCES.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
    ]).then(() => {
      console.log('[Enhanced SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[Enhanced SW] Installation failed:', error);
    })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCacheNames = [
          STATIC_CACHE_NAME,
          DYNAMIC_CACHE_NAME,
          CRISIS_CACHE_NAME,
          I18N_CACHE_NAME,
          CULTURAL_CACHE_NAME
        ];
        
        return Promise.all(
          cacheNames
            .filter(cacheName => !validCacheNames.includes(cacheName))
            .map(cacheName => {
              console.log('[Enhanced SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[Enhanced SW] Activation complete');
    })
  );
});

/**
 * Fetch Event - Intelligent caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and external requests
  if (!url.href.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(handleFetchRequest(request));
});

/**
 * Handle fetch requests with intelligent routing
 */
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Crisis resources - Cache first with network fallback
    if (isCrisisRequest(request)) {
      return await handleCrisisRequest(request);
    }
    
    // Translation files - Cache first
    if (pathname.includes('/locales/') || pathname.includes('/cultural-contexts/')) {
      return await handleI18nRequest(request);
    }
    
    // Real-time features - Network first
    if (isNetworkFirstPattern(pathname)) {
      return await handleNetworkFirstRequest(request);
    }
    
    // Static assets - Cache first
    if (isCacheFirstPattern(pathname)) {
      return await handleCacheFirstRequest(request);
    }
    
    // Navigation requests - Network first with offline fallback
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // Default - Network first with cache fallback
    return await handleDefaultRequest(request);
    
  } catch (error) {
    console.error('[Enhanced SW] Fetch error:', error);
    return await handleOfflineFallback(request);
  }
}

/**
 * Handle crisis-related requests with highest priority
 */
async function handleCrisisRequest(request) {
  const cache = await caches.open(CRISIS_CACHE_NAME);
  
  // Try cache first for crisis resources
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('[Enhanced SW] Serving crisis resource from cache:', request.url);
    
    // Update cache in background if online
    if (navigator.onLine) {
      fetch(request).then(response => {
        if (response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Ignore network errors for background updates
      });
    }
    
    return cachedResponse;
  }
  
  // Try network if cache miss
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Enhanced SW] Crisis resource network failed, providing emergency fallback');
    return createEmergencyResponse(request);
  }
}

/**
 * Handle i18n and cultural context requests
 */
async function handleI18nRequest(request) {
  const cacheName = request.url.includes('/locales/') ? I18N_CACHE_NAME : CULTURAL_CACHE_NAME;
  const cache = await caches.open(cacheName);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return fallback translation if available
    return createFallbackI18nResponse(request);
  }
}

/**
 * Handle network-first requests (real-time features)
 */
async function handleNetworkFirstRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline API response
    return createOfflineApiResponse(request);
  }
}

/**
 * Handle cache-first requests (static assets)
 */
async function handleCacheFirstRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error; // Let it fall through to offline fallback
  }
}

/**
 * Handle navigation requests
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[Enhanced SW] Navigation failed, serving offline page');
    
    const url = new URL(request.url);
    
    // Serve crisis-specific offline page for crisis routes
    if (isCrisisRoute(url.pathname)) {
      return caches.match('/offline-crisis.html') || caches.match('/offline.html');
    }
    
    // Default offline page
    return caches.match('/offline.html');
  }
}

/**
 * Handle default requests
 */
async function handleDefaultRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || handleOfflineFallback(request);
  }
}

/**
 * Create emergency response for crisis resources
 */
function createEmergencyResponse(request) {
  const emergencyContent = {
    title: 'Emergency Crisis Support',
    emergencyContacts: [
      {
        name: 'National Suicide Prevention Lifeline',
        phone: '988',
        available: '24/7'
      },
      {
        name: 'Crisis Text Line',
        text: '741741',
        available: '24/7'
      }
    ],
    copingStrategies: [
      'Take deep, slow breaths',
      'Call someone you trust',
      'Remove yourself from immediate danger',
      'Use grounding techniques (5-4-3-2-1 method)'
    ],
    offline: true,
    lastUpdated: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(emergencyContent), {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Create fallback i18n response
 */
function createFallbackI18nResponse(request) {
  const fallbackTranslation = {
    crisis: {
      title: 'Crisis Support',
      help: 'Help is available',
      call: 'Call for help'
    },
    offline: true
  };
  
  return new Response(JSON.stringify(fallbackTranslation), {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Create offline API response
 */
function createOfflineApiResponse(request) {
  const offlineResponse = {
    error: 'Offline',
    message: 'You are currently offline. Crisis resources are still available.',
    offline: true,
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(offlineResponse), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Handle complete offline fallback
 */
async function handleOfflineFallback(request) {
  // For navigation requests, serve offline page
  if (request.mode === 'navigate') {
    return caches.match('/offline.html');
  }
  
  // For API requests, return offline response
  if (request.url.includes('/api/') || request.url.includes('/.netlify/functions/')) {
    return createOfflineApiResponse(request);
  }
  
  // For other requests, return a generic offline response
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

/**
 * Utility functions
 */
function isCrisisRequest(request) {
  const url = request.url.toLowerCase();
  return CRISIS_PATTERNS.some(pattern => pattern.test(url)) ||
         url.includes('/crisis-resources/') ||
         url.includes('/emergency') ||
         url.includes('/safety-plan');
}

function isNetworkFirstPattern(pathname) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

function isCacheFirstPattern(pathname) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

function isCrisisRoute(pathname) {
  return pathname.includes('/crisis') || 
         pathname.includes('/emergency') ||
         pathname.includes('/safety-plan') ||
         pathname.includes('/get-help');
}

/**
 * Background Sync for offline data
 */
self.addEventListener('sync', (event) => {
  console.log('[Enhanced SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'crisis-data-sync') {
    event.waitUntil(syncCrisisData());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData());
  }
});

/**
 * Sync crisis-related data when connection is restored
 */
async function syncCrisisData() {
  try {
    console.log('[Enhanced SW] Syncing crisis data...');
    
    // Get pending crisis events from IndexedDB
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const crisisItems = await getAllFromStore(store, 'crisis-event');
    
    // Sync each crisis event
    for (const item of crisisItems) {
      try {
        await fetch('/.netlify/functions/crisis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        // Remove from sync queue on success
        const deleteTransaction = db.transaction(['syncQueue'], 'readwrite');
        deleteTransaction.objectStore('syncQueue').delete(item.id);
      } catch (error) {
        console.error('[Enhanced SW] Failed to sync crisis event:', error);
      }
    }
    
    console.log('[Enhanced SW] Crisis data sync complete');
  } catch (error) {
    console.error('[Enhanced SW] Crisis data sync failed:', error);
  }
}

/**
 * Sync analytics data
 */
async function syncAnalyticsData() {
  try {
    console.log('[Enhanced SW] Syncing analytics data...');
    // Implementation for syncing privacy-preserving analytics
  } catch (error) {
    console.error('[Enhanced SW] Analytics sync failed:', error);
  }
}

/**
 * IndexedDB helpers
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AstralCoreOfflineDB', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store, type) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result.filter(item => item.type === type);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Push notification handling for crisis alerts
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  console.log('[Enhanced SW] Push notification received:', data);
  
  // Handle crisis-related push notifications with high priority
  if (data.type === 'crisis-alert') {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'crisis-alert',
        requireInteraction: true,
        actions: [
          {
            action: 'open-crisis',
            title: 'Get Help Now'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      })
    );
  }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open-crisis') {
    event.waitUntil(
      clients.openWindow('/crisis')
    );
  }
});

console.log('[Enhanced SW] Service worker script loaded successfully');
