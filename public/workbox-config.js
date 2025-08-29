/**
 * Workbox Configuration for Astral Core Service Worker
 * 
 * This configuration implements a comprehensive caching strategy for a mental health
 * support platform with special considerations for crisis intervention and offline access.
 */

const { defineConfig } = require('@workbox/build');

module.exports = defineConfig({
  // Source directory for the built application
  globDirectory: 'dist/',
  
  // Files to precache (critical resources)
  globPatterns: [
    // Core HTML files
    'index.html',
    'offline.html',
    'offline-crisis.html',
    
    // Critical static assets
    'assets/index-*.css',
    'assets/index-*.js',
    
    // PWA essentials
    'manifest.json',
    'icon-*.png',
    'icon.svg',
    
    // Crisis resources (always cached)
    'crisis-resources.json',
    'offline-coping-strategies.json'
  ],
  
  // Files to ignore during precaching
  globIgnores: [
    // Large video files (handled separately)
    'Videos/**/*',
    'assets/video-*',
    
    // Development files
    '**/_*',
    '**/.*',
    
    // Source maps (optional)
    '**/*.map',
    
    // Temporary files
    '**/temp-*',
    '**/tmp-*'
  ],
  
  // Output service worker location
  swSrc: 'src/service-worker/sw-template.js',
  swDest: 'dist/service-worker.js',
  
  // Maximum file size for precaching (2MB)
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  
  // Runtime caching strategies
  runtimeCaching: [
    // API endpoints - Network first for fresh data
    {
      urlPattern: /^https:\/\/.*\.netlify\.app\/\.netlify\/functions\/(ai|wellness|chat|sessions|helpers|community|reflections)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheKeyWillBeUsed: async ({ request }) => {
          // Remove auth headers from cache key for privacy
          const url = new URL(request.url);
          url.searchParams.delete('auth');
          url.searchParams.delete('token');
          return url.href;
        },
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              // Only cache successful responses
              return response.status === 200;
            },
            requestWillFetch: async ({ request }) => {
              // Add cache-busting for critical API calls
              if (request.url.includes('/crisis') || request.url.includes('/emergency')) {
                const url = new URL(request.url);
                url.searchParams.set('cache-bust', Date.now().toString());
                return new Request(url.href, request);
              }
              return request;
            }
          }
        ]
      }
    },
    
    // Community content - Stale while revalidate
    {
      urlPattern: /^https:\/\/.*\.netlify\.app\/\.netlify\/functions\/(community|dilemmas|feedback)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'community-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 15 * 60, // 15 minutes
        },
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => {
              // Normalize URLs for consistent caching
              const url = new URL(request.url);
              url.searchParams.sort();
              return url.href;
            }
          }
        ]
      }
    },
    
    // Static assets from CDN - Cache first
    {
      urlPattern: /^https:\/\/cdn\./,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cdn-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      }
    },
    
    // Essential images - Cache first with size limit
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          purgeOnQuotaError: true, // Auto-cleanup on storage full
        },
        plugins: [
          {
            requestWillFetch: async ({ request }) => {
              // Prioritize crisis-related images
              if (request.url.includes('crisis') || request.url.includes('emergency')) {
                return request;
              }
              
              // Check cache storage quota before caching large images
              const usage = await navigator.storage.estimate();
              const quotaUsage = usage.usage / usage.quota;
              
              if (quotaUsage > 0.8) {
                // Skip caching if near quota limit
                return new Request(request.url, { 
                  ...request, 
                  headers: { ...request.headers, 'sw-cache': 'skip' }
                });
              }
              
              return request;
            }
          }
        ]
      }
    },
    
    // Google Fonts - Cache first with long expiration
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      }
    },
    
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      }
    },
    
    // Crisis resources - Cache first with high priority
    {
      urlPattern: /\/(crisis|emergency|safety|help).*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'crisis-resources',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 1 day (refresh daily for accuracy)
        },
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              // Always cache crisis resources regardless of status
              return true;
            },
            requestWillFetch: async ({ request }) => {
              // Add high priority headers for crisis resources
              return new Request(request.url, {
                ...request,
                headers: {
                  ...request.headers,
                  'priority': 'high'
                }
              });
            }
          }
        ]
      }
    }
  ],
  
  // Skip waiting to activate new service worker immediately
  skipWaiting: false, // Set to false for mental health platform stability
  
  // Client claim settings
  clientsClaim: false, // Set to false to avoid disrupting active sessions
  
  // Custom navigation handling
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    // Don't use fallback for API routes
    /^\/_/,
    /^\/api/,
    /^\/\.netlify/,
    
    // Don't use fallback for assets
    /^\/assets/,
    /^\/icons?/,
    
    // Don't use fallback for service worker itself
    /service-worker\.js$/,
  ],
  
  // Custom navigation handling for specific routes
  navigateFallbackAllowlist: [
    // Allow fallback for main application routes
    /^\/$/,
    /^\/chat/,
    /^\/ai-chat/,
    /^\/wellness/,
    /^\/community/,
    /^\/crisis/, // Ensure crisis pages work offline
  ],
  
  // Manifest transforms for cache optimization
  manifestTransforms: [
    // Add cache versioning to precached files
    (originalManifest) => {
      const manifest = originalManifest.map(entry => ({
        ...entry,
        // Add build timestamp to revision for proper cache busting
        revision: `${entry.revision}-${Date.now()}`
      }));
      
      return { manifest };
    }
  ],
  
  // Additional configuration for mental health platform
  additionalManifestEntries: [
    // Ensure critical offline resources are always cached
    {
      url: '/crisis-resources.json',
      revision: `crisis-${Date.now()}`
    },
    {
      url: '/offline-coping-strategies.json', 
      revision: `coping-${Date.now()}`
    },
    {
      url: '/emergency-contacts.json',
      revision: `emergency-${Date.now()}`
    }
  ],
  
  // Mode configuration
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Source map generation for debugging
  sourcemap: process.env.NODE_ENV !== 'production',
});

// Export additional helper functions for service worker
module.exports.cacheStrategies = {
  CRITICAL_CACHE_NAME: 'astral-core-critical-v1',
  API_CACHE_NAME: 'astral-core-api-v1',
  COMMUNITY_CACHE_NAME: 'astral-core-community-v1',
  CRISIS_CACHE_NAME: 'astral-core-crisis-v1',
  
  // Crisis mode configuration
  CRISIS_RESOURCES: [
    '/crisis',
    '/emergency',
    '/safety-plan',
    '/crisis-resources.json',
    '/offline-coping-strategies.json',
    '/emergency-contacts.json'
  ],
  
  // Cache size limits for mobile optimization
  CACHE_LIMITS: {
    api: 20 * 1024 * 1024,     // 20MB for API responses
    community: 10 * 1024 * 1024, // 10MB for community content
    images: 15 * 1024 * 1024,    // 15MB for images
    crisis: 5 * 1024 * 1024      // 5MB for crisis resources (never evicted)
  }
};
