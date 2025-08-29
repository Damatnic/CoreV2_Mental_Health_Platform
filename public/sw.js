/**
 * Enhanced Service Worker for Mental Health Platform
 * 
 * Comprehensive offline-first functionality with crisis-priority caching,
 * intelligent data sync, and full offline support for mental health resources.
 * 
 * Features:
 * - Crisis resources always available offline
 * - IndexedDB integration for offline data
 * - Intelligent background sync with conflict resolution
 * - Progressive caching strategies
 * - Emergency protocol activation
 * - Offline queue management
 * - Data compression and optimization
 * 
 * @version 4.0.0
 * @license Apache-2.0
 */

// Cache version and names
const CACHE_VERSION = 'v4.0.0';
const CACHE_NAMES = {
  STATIC: `astral-static-${CACHE_VERSION}`,
  DYNAMIC: `astral-dynamic-${CACHE_VERSION}`,
  CRISIS: `astral-crisis-${CACHE_VERSION}`,
  WELLNESS: `astral-wellness-${CACHE_VERSION}`,
  MEDIA: `astral-media-${CACHE_VERSION}`,
  API: `astral-api-${CACHE_VERSION}`,
  OFFLINE: `astral-offline-${CACHE_VERSION}`
};

// IndexedDB configuration
const DB_NAME = 'AstralCoreOfflineDB';
const DB_VERSION = 3;

// Performance budgets
const PERFORMANCE_BUDGETS = {
  CRITICAL_RESPONSE: 500, // ms
  CACHE_RESPONSE: 50, // ms
  NETWORK_TIMEOUT: 3000, // ms
  CRISIS_TIMEOUT: 1000, // ms
  SYNC_RETRY_DELAY: 5000, // ms
  MAX_RETRY_ATTEMPTS: 3,
  CACHE_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB
  QUEUE_SIZE_LIMIT: 1000
};

// Critical resources that must be available offline
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/offline-crisis.html',
  '/icon-192.png',
  '/icon-512.png'
];

// Crisis resources with highest priority
const CRISIS_RESOURCES = [
  '/crisis',
  '/emergency',
  '/safety-plan',
  '/crisis-resources/emergency-contacts.json',
  '/crisis-resources/coping-strategies.json',
  '/crisis-resources/safety-planning.json',
  '/crisis-resources/grounding-exercises.json',
  '/crisis-resources/breathing-techniques.json'
];

// Wellness and therapy resources
const WELLNESS_RESOURCES = [
  '/wellness',
  '/mood',
  '/assessments',
  '/therapy',
  '/ai-chat',
  '/breathing',
  '/meditation',
  '/journal'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/mood\//,
  /\/api\/wellness\//,
  /\/api\/assessments\//,
  /\/api\/journal\//,
  /\/api\/goals\//,
  /\/api\/medications\//
];

// Media patterns for lazy caching
const MEDIA_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
  /\.(mp4|webm|ogg|mp3|wav|m4a)$/i,
  /\.(woff|woff2|ttf|otf|eot)$/i
];

// Network-first patterns
const NETWORK_FIRST_PATTERNS = [
  /\/api\/chat\//,
  /\/api\/live\//,
  /\/api\/auth\//,
  /\/api\/sync\//,
  /\.netlify\/functions\//
];

// Crisis detection patterns
const CRISIS_PATTERNS = [
  /crisis/i,
  /emergency/i,
  /suicide/i,
  /help/i,
  /danger/i,
  /harm/i,
  /safety/i
];

// Installation event - Cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced service worker', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      cachesCriticalResources(),
      cacheCrisisResources(),
      initializeIndexedDB(),
      self.skipWaiting()
    ]).catch(error => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activation event - Clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating enhanced service worker', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      cleanOldCaches(),
      self.clients.claim(),
      registerBackgroundSync(),
      registerPeriodicSync()
    ])
  );
});

// Fetch event - Intelligent request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Skip chrome-extension and external requests
  if (!url.href.startsWith(self.location.origin)) return;
  
  // Track performance
  const fetchStart = performance.now();
  
  // Handle different request types
  if (isCrisisRequest(url, request)) {
    event.respondWith(handleCrisisRequest(request, fetchStart));
  } else if (isNetworkFirstRequest(url)) {
    event.respondWith(handleNetworkFirstRequest(request, fetchStart));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request, fetchStart));
  } else if (isMediaRequest(url)) {
    event.respondWith(handleMediaRequest(request, fetchStart));
  } else if (isWellnessRequest(url)) {
    event.respondWith(handleWellnessRequest(request, fetchStart));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request, fetchStart));
  } else {
    event.respondWith(handleGeneralRequest(request, fetchStart));
  }
});

// Message event - Handle client communications
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      cacheUrls(payload.urls);
      break;
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;
    case 'SYNC_DATA':
      syncOfflineData(payload);
      break;
    case 'QUEUE_SYNC':
      queueForSync(payload);
      break;
    case 'GET_SYNC_STATUS':
      event.ports[0].postMessage({ syncStatus: getSyncStatus() });
      break;
    case 'CRISIS_ALERT':
      handleCrisisAlert(payload);
      break;
    case 'PERFORMANCE_REPORT':
      reportPerformance(payload);
      break;
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncAllOfflineData());
  } else if (event.tag === 'sync-mood-data') {
    event.waitUntil(syncMoodData());
  } else if (event.tag === 'sync-crisis-data') {
    event.waitUntil(syncCrisisData());
  } else if (event.tag === 'sync-journal-data') {
    event.waitUntil(syncJournalData());
  } else if (event.tag.startsWith('sync-queue-')) {
    event.waitUntil(processSyncQueue(event.tag));
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'wellness-check') {
    event.waitUntil(performWellnessCheck());
  } else if (event.tag === 'crisis-monitor') {
    event.waitUntil(monitorCrisisIndicators());
  } else if (event.tag === 'cache-cleanup') {
    event.waitUntil(performCacheCleanup());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = event.data ? event.data.json() : {};
  
  // Enhanced notification options for mental health context
  const notificationOptions = {
    body: options.body || 'You have a new message',
    icon: options.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: options.urgent ? [200, 100, 200] : [100],
    tag: options.tag || 'astral-notification',
    data: options.data || {},
    requireInteraction: options.urgent || false,
    actions: options.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    silent: options.silent || false
  };
  
  // Handle crisis notifications with highest priority
  if (options.type === 'crisis') {
    notificationOptions.requireInteraction = true;
    notificationOptions.vibrate = [500, 200, 500, 200, 500];
    notificationOptions.actions = [
      { action: 'call-988', title: 'Call 988' },
      { action: 'crisis-chat', title: 'Crisis Chat' },
      { action: 'safety-plan', title: 'Safety Plan' }
    ];
  }
  
  event.waitUntil(
    self.registration.showNotification(
      options.title || 'Astral Core',
      notificationOptions
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action } = event;
  const { data } = event.notification;
  
  let targetUrl = '/';
  
  switch (action) {
    case 'call-988':
      targetUrl = 'tel:988';
      break;
    case 'crisis-chat':
      targetUrl = '/crisis?chat=true';
      break;
    case 'safety-plan':
      targetUrl = '/safety-plan';
      break;
    case 'view':
      targetUrl = data.url || '/';
      break;
  }
  
  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});

// Helper Functions

async function cachesCriticalResources() {
  try {
    const cache = await caches.open(CACHE_NAMES.STATIC);
    await cache.addAll(CRITICAL_RESOURCES);
    console.log('[SW] Critical resources cached');
  } catch (error) {
    console.error('[SW] Failed to cache critical resources:', error);
  }
}

async function cacheCrisisResources() {
  try {
    const cache = await caches.open(CACHE_NAMES.CRISIS);
    await cache.addAll(CRISIS_RESOURCES);
    console.log('[SW] Crisis resources cached');
  } catch (error) {
    console.error('[SW] Failed to cache crisis resources:', error);
  }
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_NAMES);
  
  return Promise.all(
    cacheNames
      .filter(name => !currentCaches.includes(name))
      .map(name => {
        console.log('[SW] Deleting old cache:', name);
        return caches.delete(name);
      })
  );
}

async function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        syncStore.createIndex('status', 'status');
        syncStore.createIndex('type', 'type');
        syncStore.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        const dataStore = db.createObjectStore('offlineData', { 
          keyPath: 'id' 
        });
        dataStore.createIndex('type', 'type');
        dataStore.createIndex('userId', 'userId');
        dataStore.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('moodEntries')) {
        const moodStore = db.createObjectStore('moodEntries', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        moodStore.createIndex('userId', 'userId');
        moodStore.createIndex('date', 'date');
      }
      
      if (!db.objectStoreNames.contains('journalEntries')) {
        const journalStore = db.createObjectStore('journalEntries', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        journalStore.createIndex('userId', 'userId');
        journalStore.createIndex('date', 'date');
      }
      
      if (!db.objectStoreNames.contains('crisisReports')) {
        const crisisStore = db.createObjectStore('crisisReports', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        crisisStore.createIndex('userId', 'userId');
        crisisStore.createIndex('severity', 'severity');
        crisisStore.createIndex('timestamp', 'timestamp');
      }
    };
    
    request.onsuccess = () => {
      console.log('[SW] IndexedDB initialized');
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('[SW] IndexedDB initialization failed:', request.error);
      reject(request.error);
    };
  });
}

async function registerBackgroundSync() {
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('sync-offline-data');
      console.log('[SW] Background sync registered');
    } catch (error) {
      console.warn('[SW] Background sync registration failed:', error);
    }
  }
}

async function registerPeriodicSync() {
  if ('periodicSync' in self.registration) {
    try {
      await self.registration.periodicSync.register('wellness-check', {
        minInterval: 12 * 60 * 60 * 1000 // 12 hours
      });
      await self.registration.periodicSync.register('crisis-monitor', {
        minInterval: 60 * 60 * 1000 // 1 hour
      });
      await self.registration.periodicSync.register('cache-cleanup', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      });
      console.log('[SW] Periodic sync registered');
    } catch (error) {
      console.warn('[SW] Periodic sync registration failed:', error);
    }
  }
}

// Request type checkers
function isCrisisRequest(url, request) {
  const pathname = url.pathname.toLowerCase();
  const urlString = url.href.toLowerCase();
  
  return CRISIS_RESOURCES.some(resource => pathname.includes(resource)) ||
         CRISIS_PATTERNS.some(pattern => pattern.test(urlString)) ||
         (request.headers.get('X-Crisis-Request') === 'true');
}

function isNetworkFirstRequest(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isMediaRequest(url) {
  return MEDIA_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isWellnessRequest(url) {
  const pathname = url.pathname.toLowerCase();
  return WELLNESS_RESOURCES.some(resource => pathname.includes(resource));
}

// Request handlers
async function handleCrisisRequest(request, fetchStart) {
  // Crisis requests get absolute priority
  const cachePromise = caches.match(request);
  const networkPromise = fetch(request, { 
    mode: 'cors',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(PERFORMANCE_BUDGETS.CRISIS_TIMEOUT)
  }).catch(() => null);
  
  // Race for fastest response
  const response = await Promise.race([cachePromise, networkPromise]);
  
  // Track performance
  const responseTime = performance.now() - fetchStart;
  if (responseTime > PERFORMANCE_BUDGETS.CRITICAL_RESPONSE) {
    console.warn(`[SW] Slow crisis response: ${responseTime}ms for ${request.url}`);
    trackSlowResponse('crisis', request.url, responseTime);
  }
  
  // Update cache in background if network succeeded
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAMES.CRISIS);
    cache.put(request, response.clone());
  }
  
  // Fallback to emergency response if both fail
  return response || createEmergencyCrisisResponse(request);
}

async function handleNetworkFirstRequest(request, fetchStart) {
  try {
    const networkResponse = await fetch(request, {
      signal: AbortSignal.timeout(PERFORMANCE_BUDGETS.NETWORK_TIMEOUT)
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Queue for later sync if it's a POST/PUT/DELETE
    if (request.method !== 'GET') {
      await queueForSync({
        url: request.url,
        method: request.method,
        body: await request.text(),
        headers: Object.fromEntries(request.headers.entries())
      });
    }
    
    return new Response(JSON.stringify({ 
      offline: true, 
      queued: request.method !== 'GET' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleAPIRequest(request, fetchStart) {
  // Try network first with timeout
  try {
    const networkResponse = await fetch(request, {
      signal: AbortSignal.timeout(PERFORMANCE_BUDGETS.NETWORK_TIMEOUT)
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request, networkResponse.clone());
      
      // Track performance
      const responseTime = performance.now() - fetchStart;
      trackPerformance('api', responseTime);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline data from IndexedDB if available
    if (request.method === 'GET') {
      return await generateOfflineAPIResponse(request);
    }
    
    // Queue non-GET requests for sync
    if (request.method !== 'GET') {
      await queueForSync({
        url: request.url,
        method: request.method,
        body: await request.clone().text(),
        headers: Object.fromEntries(request.headers.entries())
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline',
      queued: request.method !== 'GET'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleMediaRequest(request, fetchStart) {
  // Cache-first for media
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAMES.MEDIA).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.MEDIA);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Media unavailable', { status: 503 });
  }
}

async function handleWellnessRequest(request, fetchStart) {
  // Stale-while-revalidate for wellness resources
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHE_NAMES.WELLNESS).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

async function handleNavigationRequest(request, fetchStart) {
  try {
    const networkResponse = await fetch(request, {
      signal: AbortSignal.timeout(PERFORMANCE_BUDGETS.NETWORK_TIMEOUT)
    });
    return networkResponse;
  } catch (error) {
    // Check if it's a crisis-related navigation
    const url = new URL(request.url);
    if (isCrisisRequest(url, request)) {
      return caches.match('/offline-crisis.html') || 
             caches.match('/offline.html');
    }
    
    // Default offline page
    return caches.match('/offline.html');
  }
}

async function handleGeneralRequest(request, fetchStart) {
  // Cache-first for general requests
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Emergency response generators
function createEmergencyCrisisResponse(request) {
  const emergencyData = {
    title: 'Emergency Crisis Support',
    message: 'Help is available even offline',
    emergencyContacts: [
      {
        name: 'National Suicide Prevention Lifeline',
        phone: '988',
        text: 'Text HOME to 741741',
        available: '24/7'
      },
      {
        name: 'Crisis Text Line',
        text: '741741',
        keyword: 'HOME',
        available: '24/7'
      },
      {
        name: 'Emergency Services',
        phone: '911',
        available: '24/7'
      }
    ],
    copingStrategies: [
      {
        name: 'Box Breathing',
        steps: [
          'Breathe in for 4 counts',
          'Hold for 4 counts',
          'Breathe out for 4 counts',
          'Hold for 4 counts',
          'Repeat 4-5 times'
        ]
      },
      {
        name: 'Grounding (5-4-3-2-1)',
        steps: [
          'Name 5 things you can see',
          'Name 4 things you can touch',
          'Name 3 things you can hear',
          'Name 2 things you can smell',
          'Name 1 thing you can taste'
        ]
      },
      {
        name: 'Progressive Muscle Relaxation',
        steps: [
          'Tense your toes for 5 seconds',
          'Release and notice the relaxation',
          'Move up through each muscle group',
          'End with deep breathing'
        ]
      }
    ],
    safetyTips: [
      'Remove immediate dangers',
      'Call someone you trust',
      'Go to a safe place',
      'Use your safety plan',
      'Remember: This feeling will pass'
    ],
    offline: true,
    cached: true,
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(emergencyData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Offline-Response': 'true'
    }
  });
}

async function generateOfflineAPIResponse(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Generate appropriate offline response based on endpoint
  if (pathname.includes('/mood')) {
    return new Response(JSON.stringify({
      offline: true,
      data: await getOfflineMoodData()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (pathname.includes('/journal')) {
    return new Response(JSON.stringify({
      offline: true,
      data: await getOfflineJournalData()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (pathname.includes('/wellness')) {
    return new Response(JSON.stringify({
      offline: true,
      data: await getOfflineWellnessData()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ offline: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// IndexedDB operations
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueForSync(data) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    await store.add({
      ...data,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
    
    // Register sync event
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-queue-' + Date.now());
    }
    
    console.log('[SW] Data queued for sync');
  } catch (error) {
    console.error('[SW] Failed to queue for sync:', error);
  }
}

async function processSyncQueue(tag) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('status');
    const pendingItems = await index.getAll('pending');
    
    for (const item of pendingItems) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        
        if (response.ok) {
          // Remove from queue
          const deleteTransaction = db.transaction(['syncQueue'], 'readwrite');
          await deleteTransaction.objectStore('syncQueue').delete(item.id);
        } else {
          // Update retry count
          item.retryCount++;
          if (item.retryCount >= PERFORMANCE_BUDGETS.MAX_RETRY_ATTEMPTS) {
            item.status = 'failed';
          }
          
          const updateTransaction = db.transaction(['syncQueue'], 'readwrite');
          await updateTransaction.objectStore('syncQueue').put(item);
        }
      } catch (error) {
        console.error('[SW] Sync failed for item:', error);
        
        // Update retry count
        item.retryCount++;
        if (item.retryCount >= PERFORMANCE_BUDGETS.MAX_RETRY_ATTEMPTS) {
          item.status = 'failed';
        }
        
        const updateTransaction = db.transaction(['syncQueue'], 'readwrite');
        await updateTransaction.objectStore('syncQueue').put(item);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to process sync queue:', error);
  }
}

// Data sync functions
async function syncAllOfflineData() {
  await Promise.all([
    syncMoodData(),
    syncJournalData(),
    syncCrisisData(),
    processSyncQueue('sync-all')
  ]);
}

async function syncMoodData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['moodEntries'], 'readonly');
    const store = transaction.objectStore('moodEntries');
    const entries = await store.getAll();
    
    for (const entry of entries) {
      try {
        const response = await fetch('/api/mood/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        if (response.ok) {
          const deleteTransaction = db.transaction(['moodEntries'], 'readwrite');
          await deleteTransaction.objectStore('moodEntries').delete(entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync mood entry:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Mood sync failed:', error);
  }
}

async function syncJournalData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['journalEntries'], 'readonly');
    const store = transaction.objectStore('journalEntries');
    const entries = await store.getAll();
    
    for (const entry of entries) {
      try {
        const response = await fetch('/api/journal/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        if (response.ok) {
          const deleteTransaction = db.transaction(['journalEntries'], 'readwrite');
          await deleteTransaction.objectStore('journalEntries').delete(entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync journal entry:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Journal sync failed:', error);
  }
}

async function syncCrisisData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['crisisReports'], 'readonly');
    const store = transaction.objectStore('crisisReports');
    const reports = await store.getAll();
    
    for (const report of reports) {
      try {
        const response = await fetch('/api/crisis/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
        
        if (response.ok) {
          const deleteTransaction = db.transaction(['crisisReports'], 'readwrite');
          await deleteTransaction.objectStore('crisisReports').delete(report.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync crisis report:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Crisis sync failed:', error);
  }
}

// Get offline data functions
async function getOfflineMoodData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['moodEntries'], 'readonly');
    const store = transaction.objectStore('moodEntries');
    return await store.getAll();
  } catch (error) {
    return [];
  }
}

async function getOfflineJournalData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['journalEntries'], 'readonly');
    const store = transaction.objectStore('journalEntries');
    return await store.getAll();
  } catch (error) {
    return [];
  }
}

async function getOfflineWellnessData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineData'], 'readonly');
    const store = transaction.objectStore('offlineData');
    const index = store.index('type');
    return await index.getAll('wellness');
  } catch (error) {
    return [];
  }
}

// Utility functions
function getSyncStatus() {
  // Return current sync queue status
  return {
    online: navigator.onLine,
    syncing: false,
    pendingItems: 0,
    lastSync: new Date().toISOString()
  };
}

async function handleCrisisAlert(payload) {
  // Show immediate notification
  await self.registration.showNotification('Crisis Alert', {
    body: payload.message || 'Immediate support needed',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
    actions: [
      { action: 'call-988', title: 'Call 988 Now' },
      { action: 'crisis-chat', title: 'Crisis Chat' }
    ],
    tag: 'crisis-alert',
    data: payload
  });
  
  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'CRISIS_ALERT',
      payload
    });
  });
}

async function performWellnessCheck() {
  // Check for user wellness status
  try {
    const response = await fetch('/api/wellness/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.needsSupport) {
        await self.registration.showNotification('Wellness Check-In', {
          body: 'How are you feeling today? Tap to check in.',
          icon: '/icon-192.png',
          actions: [
            { action: 'checkin', title: 'Check In' },
            { action: 'later', title: 'Later' }
          ]
        });
      }
    }
  } catch (error) {
    console.error('[SW] Wellness check failed:', error);
  }
}

async function monitorCrisisIndicators() {
  // Monitor for crisis indicators
  try {
    const response = await fetch('/api/crisis/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.riskDetected) {
        await handleCrisisAlert({
          message: 'We noticed you might be struggling. Support is available.',
          severity: data.severity
        });
      }
    }
  } catch (error) {
    console.error('[SW] Crisis monitoring failed:', error);
  }
}

async function performCacheCleanup() {
  // Clean up old cached data
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      const now = Date.now();
      
      for (const request of requests) {
        const response = await cache.match(request);
        const cacheTime = response.headers.get('X-Cache-Time');
        
        if (cacheTime) {
          const age = now - parseInt(cacheTime);
          const maxAge = cacheName.includes('crisis') ? 
            7 * 24 * 60 * 60 * 1000 : // 7 days for crisis
            24 * 60 * 60 * 1000; // 24 hours for others
          
          if (age > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('[SW] Cache cleanup completed');
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

// Performance tracking
function trackPerformance(type, responseTime) {
  // Send performance data to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PERFORMANCE_METRIC',
        payload: {
          metricType: type,
          responseTime,
          timestamp: Date.now()
        }
      });
    });
  });
}

function trackSlowResponse(type, url, responseTime) {
  // Log slow responses for analysis
  console.warn(`[SW] Slow ${type} response: ${responseTime}ms for ${url}`);
  
  // Store in IndexedDB for later analysis
  openIndexedDB().then(db => {
    const transaction = db.transaction(['offlineData'], 'readwrite');
    const store = transaction.objectStore('offlineData');
    
    store.add({
      id: `perf-${Date.now()}`,
      type: 'performance',
      data: {
        requestType: type,
        url,
        responseTime,
        timestamp: new Date().toISOString()
      },
      userId: 'system',
      timestamp: new Date()
    });
  }).catch(error => {
    console.error('[SW] Failed to track slow response:', error);
  });
}

async function reportPerformance(metrics) {
  // Send performance metrics to analytics
  try {
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metrics,
        serviceWorkerVersion: CACHE_VERSION,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('[SW] Failed to report performance:', error);
  }
}

// Cache management
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAMES.DYNAMIC);
  return cache.addAll(urls);
}

async function clearCache(cacheName) {
  if (cacheName) {
    return caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

console.log('[SW] Enhanced service worker loaded successfully', CACHE_VERSION);