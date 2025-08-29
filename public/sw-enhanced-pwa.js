/**
 * Enhanced Progressive Web App Service Worker
 * Mental Health Platform - Performance & Crisis Optimized
 * 
 * Key Features:
 * - Sub-500ms crisis detection response
 * - Intelligent multi-tier caching strategy
 * - Offline crisis support with full resource availability
 * - Background sync for critical mental health data
 * - Push notifications for crisis alerts
 * - Privacy-preserving analytics
 * 
 * Performance Targets:
 * - Crisis Detection: < 500ms
 * - Emergency Escalation: < 1s
 * - Resource Loading: < 2s
 * - Chat Message Delivery: < 300ms
 */

// Version management
const VERSION = 'v3.0.0-enhanced';
const BUILD_TIME = new Date().toISOString();

// Cache names with versioning
const CACHES = {
  STATIC: `astral-static-${VERSION}`,
  DYNAMIC: `astral-dynamic-${VERSION}`,
  CRISIS: `astral-crisis-${VERSION}`,
  WELLNESS: `astral-wellness-${VERSION}`,
  MEDIA: `astral-media-${VERSION}`,
  API: `astral-api-${VERSION}`,
  OFFLINE: `astral-offline-${VERSION}`
};

// Performance budgets
const PERFORMANCE_BUDGETS = {
  CRITICAL_RESPONSE_TIME: 500, // ms
  CACHE_RESPONSE_TIME: 50, // ms
  NETWORK_TIMEOUT: 3000, // ms
  CRISIS_TIMEOUT: 1000, // ms
  BACKGROUND_SYNC_DELAY: 5000 // ms
};

// Critical resources that must be cached immediately
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/offline-crisis.html',
  '/crisis-resources.json',
  '/emergency-contacts.json',
  '/offline-coping-strategies.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Crisis-related resources with highest priority
const CRISIS_RESOURCES = [
  '/crisis',
  '/emergency',
  '/safety-plan',
  '/api/crisis/detect',
  '/api/crisis/escalate',
  '/api/emergency/contacts',
  '/api/safety/plan'
];

// Wellness and therapy resources
const WELLNESS_RESOURCES = [
  '/wellness',
  '/mood',
  '/assessments',
  '/therapy',
  '/ai-chat',
  '/breathing',
  '/meditation'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/mood\//,
  /\/api\/wellness\//,
  /\/api\/assessments\//,
  /\/api\/chat\//,
  /\/api\/ai\//
];

// Media resources with lazy caching
const MEDIA_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
  /\.(mp4|webm|ogg|mp3|wav)$/,
  /\.(woff|woff2|ttf|otf)$/
];

// Installation event - Cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Enhanced PWA Service Worker', VERSION);
  
  event.waitUntil(
    Promise.all([
      cachesCriticalResources(),
      cacheCrisisResources(),
      self.skipWaiting() // Activate immediately
    ])
  );
});

// Activation event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Enhanced PWA Service Worker', VERSION);
  
  event.waitUntil(
    Promise.all([
      cleanOldCaches(),
      self.clients.claim(), // Take control immediately
      initializeIndexedDB(),
      registerPeriodicSync()
    ])
  );
});

// Fetch event - Intelligent request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Performance tracking
  const fetchStart = performance.now();
  
  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Handle different request types with appropriate strategies
  if (isCrisisRequest(url)) {
    event.respondWith(handleCrisisRequest(request, fetchStart));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request, fetchStart));
  } else if (isMediaRequest(url)) {
    event.respondWith(handleMediaRequest(request, fetchStart));
  } else if (isWellnessRequest(url)) {
    event.respondWith(handleWellnessRequest(request, fetchStart));
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
      syncOfflineData();
      break;
    case 'ENABLE_PUSH':
      enablePushNotifications(payload);
      break;
    case 'CRISIS_ALERT':
      handleCrisisAlert(payload);
      break;
    case 'PERFORMANCE_REPORT':
      reportPerformance(payload);
      break;
  }
});

// Push event - Handle push notifications
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

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-mood-data') {
    event.waitUntil(syncMoodData());
  } else if (event.tag === 'sync-crisis-data') {
    event.waitUntil(syncCrisisData());
  } else if (event.tag === 'sync-wellness-data') {
    event.waitUntil(syncWellnessData());
  } else if (event.tag === 'sync-all') {
    event.waitUntil(syncAllOfflineData());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'wellness-check') {
    event.waitUntil(performWellnessCheck());
  } else if (event.tag === 'crisis-monitor') {
    event.waitUntil(monitorCrisisIndicators());
  }
});

// Helper Functions

async function cachesCriticalResources() {
  const cache = await caches.open(CACHES.STATIC);
  return cache.addAll(CRITICAL_RESOURCES);
}

async function cacheCrisisResources() {
  const cache = await caches.open(CACHES.CRISIS);
  return cache.addAll(CRISIS_RESOURCES.filter(url => !url.includes('/api/')));
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHES);
  
  return Promise.all(
    cacheNames
      .filter(name => !currentCaches.includes(name))
      .map(name => caches.delete(name))
  );
}

async function initializeIndexedDB() {
  // Initialize IndexedDB for offline data storage
  const dbRequest = indexedDB.open('AstralCoreOffline', 1);
  
  dbRequest.onupgradeneeded = (event) => {
    const db = event.target.result;
    
    // Create object stores for offline data
    if (!db.objectStoreNames.contains('moodEntries')) {
      db.createObjectStore('moodEntries', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('crisisReports')) {
      db.createObjectStore('crisisReports', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('wellnessData')) {
      db.createObjectStore('wellnessData', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('chatMessages')) {
      db.createObjectStore('chatMessages', { keyPath: 'id', autoIncrement: true });
    }
  };
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
    } catch (error) {
      console.warn('[SW] Periodic sync registration failed:', error);
    }
  }
}

// Request type checkers
function isCrisisRequest(url) {
  return CRISIS_RESOURCES.some(resource => url.pathname.includes(resource)) ||
         url.pathname.includes('crisis') ||
         url.pathname.includes('emergency') ||
         url.pathname.includes('safety');
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isMediaRequest(url) {
  return MEDIA_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isWellnessRequest(url) {
  return WELLNESS_RESOURCES.some(resource => url.pathname.includes(resource)) ||
         url.pathname.includes('wellness') ||
         url.pathname.includes('mood') ||
         url.pathname.includes('therapy');
}

// Request handlers with performance optimization

async function handleCrisisRequest(request, fetchStart) {
  // Crisis requests get highest priority with race between cache and network
  const cachePromise = caches.match(request);
  const networkPromise = fetch(request, { 
    mode: 'cors',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(PERFORMANCE_BUDGETS.CRISIS_TIMEOUT)
  }).catch(() => null);
  
  // Race for fastest response
  const response = await Promise.race([
    cachePromise,
    networkPromise
  ]);
  
  // Track performance
  const responseTime = performance.now() - fetchStart;
  if (responseTime > PERFORMANCE_BUDGETS.CRITICAL_RESPONSE_TIME) {
    console.warn(`[SW] Slow crisis response: ${responseTime}ms for ${request.url}`);
  }
  
  // Update cache in background if network succeeded
  if (response && response.ok && response.status === 200) {
    const cache = await caches.open(CACHES.CRISIS);
    cache.put(request, response.clone());
  }
  
  return response || new Response('Crisis resource unavailable', { status: 503 });
}

async function handleAPIRequest(request, fetchStart) {
  // API requests use network-first with cache fallback
  try {
    const networkResponse = await fetch(request, {
      signal: AbortSignal.timeout(PERFORMANCE_BUDGETS.NETWORK_TIMEOUT)
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.API);
      cache.put(request, networkResponse.clone());
      
      // Track performance
      const responseTime = performance.now() - fetchStart;
      trackPerformance('api', responseTime);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache for offline
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline data from IndexedDB if available
    if (request.method === 'GET') {
      return generateOfflineAPIResponse(request);
    }
    
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleMediaRequest(request, fetchStart) {
  // Media uses cache-first with lazy network update
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHES.MEDIA).then(cache => {
          cache.put(request, response);
        });
      }
    });
    
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.MEDIA);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Media unavailable', { status: 503 });
  }
}

async function handleWellnessRequest(request, fetchStart) {
  // Wellness requests use stale-while-revalidate
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHES.WELLNESS).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });
  
  return cachedResponse || fetchPromise;
}

async function handleGeneralRequest(request, fetchStart) {
  // General requests use cache-first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHES.DYNAMIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Offline data generation
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

// Background sync functions
async function syncMoodData() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['moodEntries'], 'readonly');
  const store = transaction.objectStore('moodEntries');
  const entries = await store.getAll();
  
  for (const entry of entries) {
    try {
      await fetch('/api/mood/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      // Remove synced entry
      const deleteTransaction = db.transaction(['moodEntries'], 'readwrite');
      await deleteTransaction.objectStore('moodEntries').delete(entry.id);
    } catch (error) {
      console.error('[SW] Failed to sync mood entry:', error);
    }
  }
}

async function syncCrisisData() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['crisisReports'], 'readonly');
  const store = transaction.objectStore('crisisReports');
  const reports = await store.getAll();
  
  for (const report of reports) {
    try {
      await fetch('/api/crisis/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      // Remove synced report
      const deleteTransaction = db.transaction(['crisisReports'], 'readwrite');
      await deleteTransaction.objectStore('crisisReports').delete(report.id);
    } catch (error) {
      console.error('[SW] Failed to sync crisis report:', error);
    }
  }
}

async function syncWellnessData() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['wellnessData'], 'readonly');
  const store = transaction.objectStore('wellnessData');
  const data = await store.getAll();
  
  for (const item of data) {
    try {
      await fetch('/api/wellness/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      
      // Remove synced data
      const deleteTransaction = db.transaction(['wellnessData'], 'readwrite');
      await deleteTransaction.objectStore('wellnessData').delete(item.id);
    } catch (error) {
      console.error('[SW] Failed to sync wellness data:', error);
    }
  }
}

async function syncAllOfflineData() {
  await Promise.all([
    syncMoodData(),
    syncCrisisData(),
    syncWellnessData()
  ]);
}

// Performance tracking
function trackPerformance(type, responseTime) {
  // Send performance data to analytics
  if (self.clients) {
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
}

// Utility functions
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AstralCoreOffline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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

async function getOfflineWellnessData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['wellnessData'], 'readonly');
    const store = transaction.objectStore('wellnessData');
    return await store.getAll();
  } catch (error) {
    return [];
  }
}

// Crisis alert handling
async function handleCrisisAlert(payload) {
  // Immediately show notification
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

// Wellness check
async function performWellnessCheck() {
  // Check for user wellness status
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
}

// Crisis monitoring
async function monitorCrisisIndicators() {
  // Monitor for crisis indicators
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
}

// Cache management utilities
async function cacheUrls(urls) {
  const cache = await caches.open(CACHES.DYNAMIC);
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

// Report performance metrics
async function reportPerformance(metrics) {
  // Send performance metrics to analytics endpoint
  try {
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metrics,
        serviceWorkerVersion: VERSION,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('[SW] Failed to report performance:', error);
  }
}

console.log('[SW] Enhanced PWA Service Worker loaded successfully');