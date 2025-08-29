/**
 * Intelligent Service Worker with Advanced Caching and Prefetching
 *
 * Mental health platform service worker with:
 * - Behavior-based prefetching
 * - Crisis-priority caching
 * - Adaptive performance strategies
 * - Background sync for offline resilience
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';
import { intelligentCaching } from './intelligentCaching';

// Service Worker Constants
const SW_VERSION = '3.1.0';
const CRISIS_SYNC_QUEUE = 'crisis-sync-queue';
const USER_DATA_SYNC_QUEUE = 'user-data-sync-queue';
const ANALYTICS_SYNC_QUEUE = 'analytics-sync-queue';

// Crisis detection patterns
const CRISIS_PATTERNS = [
  /crisis/i,
  /emergency/i,
  /suicide/i,
  /self.harm/i,
  /hotline/i,
  /help.urgent/i
];

/**
 * Enhanced Service Worker Class with Intelligence
 */
class IntelligentServiceWorker {
  constructor() {
    this.backgroundSyncQueues = new Map();
    this.prefetchManager = intelligentCaching;
    this.criticalResources = new Set();
    this.userSession = {
      startTime: Date.now(),
      routeChanges: 0,
      crisisDetected: false
    };

    this.initialize();
  }

  /**
   * Initialize service worker with intelligent features
   */
  async initialize() {
    console.log('[SW] Initializing intelligent service worker');
    
    // Setup background sync queues
    this.setupBackgroundSync();

    // Setup intelligent routing
    this.setupIntelligentRouting();

    // Setup event listeners
    this.setupEventListeners();

    // Setup prefetch scheduler
    this.setupPrefetchScheduler();

    console.log('[SW] Service worker initialization complete');
  }

  /**
   * Setup background sync queues for offline resilience
   */
  setupBackgroundSync() {
    // Crisis data sync (highest priority)
    this.backgroundSyncQueues.set('crisis', new BackgroundSync(CRISIS_SYNC_QUEUE, {
      maxRetentionTime: 7 * 24 * 60, // 7 days
      onSync: async ({ queue }) => {
        let entry;
        while ((entry = await queue.shiftRequest())) {
          try {
            await fetch(entry.request.clone());
            console.log('[Crisis Sync] Crisis data synced successfully');
          } catch (error) {
            console.error('[Crisis Sync] Failed to sync crisis data:', error);
            // Re-add to queue for retry
            await queue.unshiftRequest(entry);
            break;
          }
        }
      }
    }));

    // User data sync
    this.backgroundSyncQueues.set('userData', new BackgroundSync(USER_DATA_SYNC_QUEUE, {
      maxRetentionTime: 24 * 60, // 24 hours
      onSync: async ({ queue }) => {
        let entry;
        while ((entry = await queue.shiftRequest())) {
          try {
            await fetch(entry.request.clone());
            console.log('[User Data Sync] User data synced successfully');
          } catch (error) {
            console.error('[User Data Sync] Failed to sync user data:', error);
            // Don't retry user data indefinitely
            break;
          }
        }
      }
    }));

    // Analytics sync (lowest priority)
    this.backgroundSyncQueues.set('analytics', new BackgroundSync(ANALYTICS_SYNC_QUEUE, {
      maxRetentionTime: 2 * 60, // 2 hours
      onSync: async ({ queue }) => {
        let entry;
        while ((entry = await queue.shiftRequest())) {
          try {
            await fetch(entry.request.clone());
            console.log('[Analytics Sync] Analytics synced successfully');
          } catch (error) {
            console.error('[Analytics Sync] Failed to sync analytics:', error);
            // Skip failed analytics
            continue;
          }
        }
      }
    }));
  }

  /**
   * Setup intelligent routing with adaptive strategies
   */
  setupIntelligentRouting() {
    const strategies = this.prefetchManager.getCacheStrategies();

    strategies.forEach(strategy => {
      registerRoute(
        strategy.pattern,
        this.createAdaptiveHandler(strategy),
        'GET'
      );
    });

    // Special handling for POST requests (user data, crisis reports)
    registerRoute(
      /\/\.netlify\/functions\/.*/,
      this.handleAPIRequest.bind(this),
      'POST'
    );

    // Fallback handler for uncached requests
    setCatchHandler(this.handleFallback.bind(this));

    // Default handler with intelligent decision making
    setDefaultHandler(this.handleDefault.bind(this));
  }

  /**
   * Create adaptive handler based on strategy and current conditions
   */
  createAdaptiveHandler(strategy) {
    return async ({ request, event }) => {
      const userMetrics = this.prefetchManager.getUserMetrics();
      const isCrisisRequest = this.isCrisisRequest(request);

      // Crisis requests always get priority handling
      if (isCrisisRequest) {
        this.userSession.crisisDetected = true;
        return this.handleCrisisRequest(request, strategy);
      }

      // Adapt strategy based on network conditions
      if (userMetrics.networkCondition === 'slow' || userMetrics.deviceCapabilities.isLowEnd) {
        return this.handleLowPerformanceRequest(request, strategy);
      }

      // Default to configured strategy
      const handler = this.getHandler(strategy.strategy);
      return handler.handle({ request, event });
    };
  }

  /**
   * Handle crisis requests with maximum reliability
   */
  async handleCrisisRequest(request, strategy) {
    try {
      // Try cache first for immediate response
      const cache = await caches.open(strategy.options.cacheName);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        console.log('[Crisis Handler] Serving crisis resource from cache');

        // Update cache in background
        this.updateCrisisCache(request, cache);

        return cachedResponse;
      }

      // If not in cache, try network with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(request.clone(), {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          // Cache successful response
          await cache.put(request, response.clone());
          console.log('[Crisis Handler] Crisis resource cached successfully');
        }

        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('[Crisis Handler] Network failed, using fallback:', fetchError);

        // Return crisis fallback content
        return this.getCrisisFallback(request);
      }
    } catch (error) {
      console.error('[Crisis Handler] Critical error:', error);
      return this.getCrisisFallback(request);
    }
  }

  /**
   * Handle requests on low-performance devices/networks
   */
  async handleLowPerformanceRequest(request, strategy) {
    // Use cache-first strategy for better performance
    const handler = new CacheFirst({
      cacheName: strategy.options.cacheName,
      plugins: [{
        requestWillFetch: async ({ request }) => {
          // Add quality/compression hints for low-end devices
          const url = new URL(request.url);
          url.searchParams.set('compress', 'true');
          url.searchParams.set('quality', '60');

          return new Request(url.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
            mode: request.mode,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer
          });
        }
      }]
    });

    return handler.handle({ request });
  }

  /**
   * Handle API requests with intelligent sync
   */
  async handleAPIRequest({ request, event }) {
    const isCrisisAPI = this.isCrisisRequest(request);
    const isUserDataAPI = request.url.includes('/users/') || request.url.includes('/profile/');

    try {
      const response = await fetch(request.clone());

      if (response.ok) {
        // Track successful API calls for prefetch predictions
        this.prefetchManager.updateUserBehavior(
          new URL(request.url).pathname,
          0 // API calls don't have time spent
        );
      }

      return response;
    } catch (error) {
      console.error('[API Handler] Network failed, queuing for sync:', request.url, error);

      // Queue for background sync based on request type
      if (isCrisisAPI) {
        await this.backgroundSyncQueues.get('crisis').addRequest(request);
      } else if (isUserDataAPI) {
        await this.backgroundSyncQueues.get('userData').addRequest(request);
      } else {
        await this.backgroundSyncQueues.get('analytics').addRequest(request);
      }

      // Return appropriate offline response
      return this.getOfflineAPIResponse(request);
    }
  }

  /**
   * Handle fallback scenarios
   */
  async handleFallback({ request, event }) {
    // For navigation requests, serve offline page
    if (request.mode === 'navigate') {
      const isCrisisPage = this.isCrisisRequest(request);

      if (isCrisisPage) {
        return caches.match('/offline-crisis.html') ||
               caches.match('/offline.html') ||
               this.createEmergencyResponse();
      }

      return caches.match('/offline.html') || this.createOfflineResponse();
    }

    // For other requests, return appropriate fallback
    return new Response('Offline - Content Not Available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  /**
   * Handle default requests with intelligent routing
   */
  async handleDefault({ request, event }) {
    const userMetrics = this.prefetchManager.getUserMetrics();

    // Skip processing for certain request types
    if (request.url.includes('chrome-extension') ||
        request.url.includes('_devtools') ||
        request.url.includes('analytics')) {
      return fetch(request);
    }

    // Use network-first for dynamic content
    if (request.url.includes('/api/') || request.url.includes('/.netlify/functions/')) {
      const handler = new NetworkFirst({
        cacheName: 'api-cache-v3',
        networkTimeoutSeconds: userMetrics.networkCondition === 'slow' ? 30 : 10
      });
      return handler.handle({ request, event });
    }

    // Use stale-while-revalidate for static assets
    const handler = new StaleWhileRevalidate({
      cacheName: 'default-cache-v3'
    });
    return handler.handle({ request, event });
  }

  /**
   * Setup event listeners for intelligent behavior
   */
  setupEventListeners() {
    // Enhanced install event
    self.addEventListener('install', (event) => {
      console.log('[SW] Installing service worker');

      event.waitUntil(Promise.all([
        // Precache critical resources
        this.precacheCriticalResources(),

        // Initialize intelligent caching
        this.prefetchManager.optimizeStorage(),

        // Skip waiting for immediate activation
        self.skipWaiting()
      ]));
    });

    // Enhanced activate event
    self.addEventListener('activate', (event) => {
      console.log('[SW] Activating service worker');

      event.waitUntil(Promise.all([
        // Clean up old caches
        cleanupOutdatedCaches(),

        // Claim all clients immediately
        self.clients.claim(),

        // Initialize prefetch manager
        this.startIntelligentPrefetching()
      ]));
    });

    // Message handling for client communication
    self.addEventListener('message', (event) => {
      this.handleMessage(event);
    });

    // Fetch event with intelligent handling
    self.addEventListener('fetch', (event) => {
      // Skip non-GET requests that aren't API calls
      if (event.request.method !== 'GET' && !event.request.url.includes('/api/')) {
        return;
      }

      event.respondWith(this.handleFetch(event));
    });

    // Background sync event
    self.addEventListener('sync', (event) => {
      console.log('[SW] Background sync event triggered');

      if (event.tag.startsWith('crisis-sync')) {
        event.waitUntil(this.backgroundSyncQueues.get('crisis').replayRequests());
      } else if (event.tag.startsWith('user-data-sync')) {
        event.waitUntil(this.backgroundSyncQueues.get('userData').replayRequests());
      } else if (event.tag.startsWith('analytics-sync')) {
        event.waitUntil(this.backgroundSyncQueues.get('analytics').replayRequests());
      }
    });

    // Push notification handling
    self.addEventListener('push', (event) => {
      this.handlePushNotification(event);
    });
  }

  /**
   * Setup prefetch scheduler for intelligent resource loading
   */
  setupPrefetchScheduler() {
    // Schedule periodic prefetching
    setInterval(() => {
      this.prefetchManager.intelligentPrefetch();
    }, 30000); // Every 30 seconds

    // Schedule storage optimization
    setInterval(() => {
      this.prefetchManager.optimizeStorage();
    }, 300000); // Every 5 minutes
  }

  /**
   * Check if request is crisis-related
   */
  isCrisisRequest(request) {
    const url = request.url.toLowerCase();
    return CRISIS_PATTERNS.some(pattern => pattern.test(url));
  }

  /**
   * Get appropriate handler for strategy
   */
  getHandler(strategyName) {
    switch (strategyName) {
      case 'CacheFirst':
        return new CacheFirst();
      case 'NetworkFirst':
        return new NetworkFirst();
      case 'StaleWhileRevalidate':
        return new StaleWhileRevalidate();
      default:
        return new NetworkFirst();
    }
  }

  /**
   * Update crisis cache in background
   */
  async updateCrisisCache(request, cache) {
    try {
      const response = await fetch(request.clone());
      if (response.ok) {
        await cache.put(request, response);
        console.log('[Crisis Cache] Crisis cache updated');
      }
    } catch (error) {
      console.warn('[Crisis Cache] Background update failed:', error);
    }
  }

  /**
   * Get crisis fallback response
   */
  async getCrisisFallback(request) {
    // Try to get cached crisis resources
    const crisisCache = await caches.open('crisis-resources-v3');
    const fallback = await crisisCache.match('/emergency-contacts.json') ||
                    await crisisCache.match('/crisis-resources.json');

    if (fallback) {
      return fallback;
    }

    // Return hardcoded emergency response
    return this.createEmergencyResponse();
  }

  /**
   * Create emergency response for crisis scenarios
   */
  createEmergencyResponse() {
    const emergencyData = {
      status: 'offline',
      emergency_contacts: [
        {
          name: 'National Suicide Prevention Lifeline',
          phone: '988',
          available: '24/7'
        },
        {
          name: 'Crisis Text Line',
          phone: 'Text HOME to 741741',
          available: '24/7'
        }
      ],
      message: 'You are not alone. Help is available.',
      offline_resources: [
        'Take deep breaths',
        'Reach out to a trusted friend or family member',
        'Use grounding techniques (5-4-3-2-1)',
        'Remember: This feeling will pass'
      ]
    };

    return new Response(JSON.stringify(emergencyData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  /**
   * Handle client messages for intelligent communication
   */
  async handleMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'ROUTE_CHANGE':
        this.prefetchManager.updateUserBehavior(data.route, data.timeSpent || 0);
        this.userSession.routeChanges++;
        break;

      case 'CRISIS_DETECTED':
        this.userSession.crisisDetected = true;
        // Immediately prefetch crisis resources
        await this.prefetchCrisisResources();
        break;

      case 'USER_PREFERENCES_UPDATED':
        // Update prefetch strategies based on new preferences
        await this.updatePrefetchStrategies(data.preferences);
        break;

      case 'GET_CACHE_STATUS': {
        const status = await this.getCacheStatus();
        event.ports[0]?.postMessage({ type: 'CACHE_STATUS', data: status });
        break;
      }
    }
  }

  /**
   * Prefetch crisis resources immediately
   */
  async prefetchCrisisResources() {
    const crisisResources = [
      '/crisis-resources.json',
      '/emergency-contacts.json',
      '/offline-crisis.html',
      '/offline-coping-strategies.json'
    ];

    const cache = await caches.open('crisis-resources-v3');

    for (const resource of crisisResources) {
      try {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
          console.log('[Crisis Prefetch] Crisis resource cached:', resource);
        }
      } catch (error) {
        console.warn('[Crisis Prefetch] Failed for:', resource, error);
      }
    }
  }

  /**
   * Get cache status for analytics
   */
  async getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {
      caches: [],
      totalSize: 0,
      userMetrics: this.prefetchManager.getUserMetrics(),
      session: this.userSession
    };

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status.caches.push({
        name: cacheName,
        entryCount: keys.length
      });
    }

    return status;
  }

  // Additional helper methods...
  async precacheCriticalResources() {
    return precacheAndRoute(self.__WB_MANIFEST);
  }

  async startIntelligentPrefetching() {
    return this.prefetchManager.intelligentPrefetch();
  }

  async handleFetch(event) {
    // Implementation handled by registered routes
    return fetch(event.request);
  }

  createOfflineResponse() {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Offline</title></head>
        <body>
          <h1>You're currently offline</h1>
          <p>Please check your connection and try again.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  getOfflineAPIResponse(request) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'Request queued for when connection is restored',
      queued: true
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 202
    });
  }

  async handlePushNotification(event) {
    // Handle push notifications for crisis alerts
    const data = event.data?.json() || {};

    if (data.type === 'crisis-alert') {
      event.waitUntil(
        self.registration.showNotification('Crisis Support Available', {
          body: data.message || 'Immediate support is available',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'crisis-alert',
          requireInteraction: true,
          actions: [
            { action: 'get-help', title: 'Get Help Now' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        })
      );
    }
  }

  async updatePrefetchStrategies(preferences) {
    // Update intelligent caching based on user preferences
    console.log('[SW] Updating prefetch strategies');
  }
}

// Initialize the intelligent service worker
const intelligentSW = new IntelligentServiceWorker();