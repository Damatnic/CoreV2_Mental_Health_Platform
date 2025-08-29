/**
 * Enhanced Service Worker with Push Notifications and Background Sync
 *
 * Custom service worker implementation for Astral Core Mental Health Platform
 * Includes crisis-specific optimizations, push notifications, and enhanced offline support
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';

// Crisis-specific constants
const CRISIS_CACHE_NAME = 'crisis-resources-v2';
const CRISIS_NOTIFICATION_TAG = 'crisis-alert';
const HELPER_NOTIFICATION_TAG = 'helper-request';
const EMERGENCY_CACHE_NAME = 'emergency-fallback-v2';

// Service Worker event listeners
self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced service worker with PWA features');

  // Pre-cache critical crisis resources
  event.waitUntil(
    caches.open(CRISIS_CACHE_NAME).then(cache => {
      return cache.addAll([
        '/offline-crisis.html',
        '/crisis-resources.json',
        '/offline-coping-strategies.json',
        '/emergency-contacts.json'
      ]);
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating enhanced service worker');
  event.waitUntil(Promise.all([
    // Clean up old caches
    cleanupOutdatedCaches(),

    // Claim all clients immediately
    self.clients.claim(),

    // Initialize crisis resource validation
    validateCrisisResources()
  ]));
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event.data?.text());

  if (!event.data) {
    console.warn('[SW] Push event but no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.warn('[SW] Failed to parse push notification data:', error);
    notificationData = {
      title: 'Astral Core',
      body: event.data.text(),
      type: 'general'
    };
  }

  const options = createNotificationOptions(notificationData);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event.notification.tag);

  event.notification.close();
  const notificationData = event.notification.data || {};
  const urlToOpen = getNotificationUrl(notificationData, event.notification.tag);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for failed requests
const crisisBackgroundSync = new BackgroundSync('crisis-requests', {
  maxRetentionTime: 60 * 60 * 24 * 7, // 7 days
  onSync: async ({ queue }) => {
    console.log('[SW] Syncing crisis requests from background');
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('[SW] Crisis request synced successfully');

        // Notify user of successful sync if it was a crisis request
        if (entry.request.url.includes('crisis') || entry.request.url.includes('emergency')) {
          await self.registration.showNotification('Crisis Request Sent', {
            body: 'Your crisis support request has been processed.',
            icon: '/icon-192.png',
            tag: 'crisis-sync-success'
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync crisis request:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

const regularBackgroundSync = new BackgroundSync('regular-requests', {
  maxRetentionTime: 60 * 60 * 24 * 3 // 3 days
});

// Background sync route registration
registerRoute(
  /\/\.netlify\/functions\/(crisis|emergency|help)/,
  new NetworkFirst({
    cacheName: 'crisis-api-cache',
    plugins: [crisisBackgroundSync]
  }),
  'POST'
);

registerRoute(
  /\/\.netlify\/functions\/(?!crisis|emergency|help)/,
  new NetworkFirst({
    cacheName: 'regular-api-cache',
    plugins: [regularBackgroundSync]
  }),
  'POST'
);

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CRISIS_MODE_ACTIVATED':
      handleCrisisMode(payload);
      break;

    case 'REQUEST_NOTIFICATION_PERMISSION':
      requestNotificationPermission();
      break;

    case 'SUBSCRIBE_TO_PUSH':
      subscribeUserToPush(payload);
      break;

    case 'CACHE_CRISIS_RESOURCES':
      cacheCrisisResources();
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Emergency fallback for network failures
setCatchHandler(async ({ request, event }) => {
  console.log('[SW] Network failed, attempting cache fallback for:', request.url);

  // For navigation requests, serve offline crisis page
  if (request.destination === 'document') {
    const cache = await caches.open(CRISIS_CACHE_NAME);
    const cachedResponse = await cache.match('/offline-crisis.html');

    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // For API requests during crisis, return cached emergency data
  if (request.url.includes('/functions/')) {
    return handleOfflineApiRequest(request);
  }

  // For other resources, try emergency cache
  const emergencyCache = await caches.open(EMERGENCY_CACHE_NAME);
  const cachedResponse = await emergencyCache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Ultimate fallback
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Crisis resources are still available.',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
});

// Utility functions
const createNotificationOptions = (data) => {
  const baseOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: data
  };

  switch (data.type) {
    case 'crisis_alert':
      return {
        ...baseOptions,
        body: data.body || 'A crisis support request needs immediate attention',
        tag: CRISIS_NOTIFICATION_TAG,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: 'respond', title: 'Respond Now', icon: '/icon-192.png' },
          { action: 'dismiss', title: 'Dismiss', icon: '/icon-192.png' }
        ]
      };

    case 'helper_request':
      return {
        ...baseOptions,
        body: data.body || 'Someone is requesting support',
        tag: HELPER_NOTIFICATION_TAG,
        actions: [
          { action: 'view', title: 'View Request', icon: '/icon-192.png' },
          { action: 'dismiss', title: 'Not Now', icon: '/icon-192.png' }
        ]
      };

    case 'system_update':
      return {
        ...baseOptions,
        body: data.body || 'System update available',
        tag: 'system-update',
        requireInteraction: false
      };

    default:
      return {
        ...baseOptions,
        body: data.body || 'New notification from Astral Core',
        tag: 'general'
      };
  }
};

const getNotificationUrl = (data, tag) => {
  switch (tag) {
    case CRISIS_NOTIFICATION_TAG:
      return '/crisis';
    case HELPER_NOTIFICATION_TAG:
      return data.dilemmaId ? `/chat/${data.dilemmaId}` : '/dashboard';
    case 'system-update':
      return '/settings';
    default:
      return '/';
  }
};

async function handleCrisisMode(payload) {
  console.log('[SW] Crisis mode activated:', payload);

  // Pre-cache all crisis resources immediately
  const cache = await caches.open(CRISIS_CACHE_NAME);
  await cache.addAll([
    '/offline-crisis.html',
    '/crisis-resources.json',
    '/offline-coping-strategies.json',
    '/emergency-contacts.json'
  ]);

  // Notify all clients about crisis mode
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'CRISIS_MODE_READY',
      payload: { cached: true }
    });
  });
}

async function requestNotificationPermission() {
  if ('Notification' in self && Notification.permission === 'default') {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'REQUEST_NOTIFICATION_PERMISSION_UI'
      });
    });
  }
}

async function subscribeUserToPush(payload) {
  try {
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: payload.vapidPublicKey
    });

    // Send subscription to server
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_SUBSCRIPTION_SUCCESS',
        payload: { subscription }
      });
    });
  } catch (error) {
    console.error('[SW] Failed to subscribe to push notifications:', error);
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_SUBSCRIPTION_ERROR',
        payload: { error: error.message }
      });
    });
  }
}

async function cacheCrisisResources() {
  const cache = await caches.open(CRISIS_CACHE_NAME);
  const criticalResources = [
    '/offline-crisis.html',
    '/crisis-resources.json',
    '/offline-coping-strategies.json',
    '/emergency-contacts.json',
    '/offline.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
  ];

  try {
    await cache.addAll(criticalResources);
    console.log('[SW] Crisis resources cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache crisis resources:', error);
  }
}

async function handleOfflineApiRequest(request) {
  // Return cached crisis data when offline
  if (request.url.includes('crisis-resources')) {
    const cache = await caches.open(CRISIS_CACHE_NAME);
    return cache.match('/crisis-resources.json');
  }

  if (request.url.includes('emergency-contacts')) {
    const cache = await caches.open(CRISIS_CACHE_NAME);
    return cache.match('/emergency-contacts.json');
  }

  // Return offline response for other API calls
  return new Response(
    JSON.stringify({
      offline: true,
      message: 'This feature requires an internet connection. Crisis resources remain available.',
      cached_at: new Date().toISOString()
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

async function validateCrisisResources() {
  const cache = await caches.open(CRISIS_CACHE_NAME);
  const criticalResources = [
    '/offline-crisis.html',
    '/crisis-resources.json',
    '/emergency-contacts.json'
  ];

  for (const resource of criticalResources) {
    const cached = await cache.match(resource);
    if (!cached) {
      console.warn(`[SW] Critical resource not cached: ${resource}`);
      try {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
          console.log(`[SW] Cached missing critical resource: ${resource}`);
        }
      } catch (error) {
        console.error(`[SW] Failed to cache critical resource ${resource}:`, error);
      }
    }
  }
}

// Precache and route setup (will be populated by Workbox build process)
precacheAndRoute(self.__WB_MANIFEST || []);

console.log('[SW] Enhanced service worker with PWA features loaded successfully');