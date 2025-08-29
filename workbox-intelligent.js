/**
 * Enhanced Workbox Configuration with Intelligent Caching
 * 
 * Advanced service worker configuration that integrates with intelligent caching
 * strategies for optimal performance and mental health crisis support
 */

const { intelligentCaching } = require('./src/service-worker/intelligentCaching.ts');

// Generate runtime caching from intelligent strategies
const generateRuntimeCaching = () => {
  const strategies = intelligentCaching.getCacheStrategies();
  
  return strategies.map(strategy => ({
    urlPattern: strategy.pattern,
    handler: strategy.strategy,
    options: {
      ...strategy.options,
      // Add background sync for failed requests
      backgroundSync: strategy.priority === 'crisis' ? {
        name: 'crisis-sync-queue',
        options: {
          maxRetentionTime: 24 * 60 // 24 hours
        }
      } : undefined
    }
  }));
};

module.exports = {
  // Source directory for the built application
  globDirectory: 'dist/',
  
  // Files to precache (critical resources with intelligence)
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json}',
    // Prioritize crisis resources
    '**/crisis*.{js,css,html,json}',
    '**/emergency*.{js,css,html,json}',
    '**/offline*.{js,css,html,json}'
  ],
  
  // Output service worker location
  swDest: 'dist/sw-enhanced.js',
  
  // Custom service worker source with intelligent features
  swSrc: './src/service-worker/sw-intelligent.js',
  
  // Mode for importing workbox libraries
  mode: 'production',
  
  // Maximum file size for precaching (adjusted for device capabilities)
  maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB for enhanced resources
  
  // Skip waiting and claim clients immediately for crisis scenarios
  skipWaiting: true,
  clientsClaim: true,
  
  // Clean up outdated caches automatically
  cleanupOutdatedCaches: true,
  
  // Enhanced manifest transformations with intelligent priority
  manifestTransforms: [
    (manifestEntries) => {
      const userMetrics = intelligentCaching.getUserMetrics();
      
      const transformedEntries = manifestEntries.map(entry => {
        // Crisis priority tagging
        if (entry.url.includes('crisis') || entry.url.includes('emergency')) {
          entry.revision = `crisis-${entry.revision}`;
          entry.priority = 'crisis';
        }
        
        // User behavior-based priority
        if (userMetrics.preferredFeatures.some(feature => entry.url.includes(feature))) {
          entry.revision = `preferred-${entry.revision}`;
          entry.priority = 'high';
        }
        
        // Device capability considerations
        if (userMetrics.deviceCapabilities.isLowEnd) {
          // Skip large assets on low-end devices
          const size = entry.size || 0;
          if (size > 500000 && !entry.url.includes('crisis')) { // 500KB limit
            entry.priority = 'low';
          }
        }
        
        return entry;
      });
      
      // Sort by priority (crisis first, then by user preference)
      const priorityOrder = { crisis: 0, high: 1, medium: 2, low: 3 };
      transformedEntries.sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        return aPriority - bPriority;
      });
      
      return { manifest: transformedEntries };
    }
  ],
  
  // Runtime caching strategies from intelligent caching manager
  runtimeCaching: generateRuntimeCaching(),
  
  // Navigation fallback strategy with intelligence
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
    /\/api\//,
    /\/\.netlify\/functions\//,
    // Skip fallback for admin routes
    /\/admin\//
  ],
  
  // Enhanced navigation fallback with crisis detection
  navigateFallbackAllowlist: [
    // Allow fallback for main app routes
    /^\/(?!api|admin|\.netlify)/
  ],
  
  // Disable offline Google Analytics for privacy
  offlineGoogleAnalytics: false,
  
  // Additional configuration for intelligent features
  additionalManifestEntries: [
    // Critical crisis resources that must always be available
    {
      url: '/crisis-resources.json',
      revision: 'crisis-v3'
    },
    {
      url: '/emergency-contacts.json', 
      revision: 'emergency-v3'
    },
    {
      url: '/offline-crisis.html',
      revision: 'crisis-page-v3'
    },
    {
      url: '/offline-coping-strategies.json',
      revision: 'coping-v3'
    }
  ],
  
  // Exclude patterns to avoid caching sensitive or dynamic content
  globIgnores: [
    '**/node_modules/**/*',
    '**/test/**/*',
    '**/tests/**/*',
    '**/*.test.*',
    '**/*.spec.*',
    '**/coverage/**/*',
    '**/admin/**/*', // Exclude admin interface
    '**/analytics/**/*', // Exclude analytics tracking
    '**/*.map' // Exclude source maps in production
  ],
  
  // Injection point for additional features
  injectionPoint: 'self.__WB_MANIFEST',
  
  // Module resolve options for enhanced imports
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/'
  ],
  
  // Cache ID for versioning
  cacheId: 'astral-core-v3',
  
  // Directory index handling
  directoryIndex: 'index.html',
  
  // Don't cache opaque responses by default (except for crisis resources)
  dontCacheBustURLsMatching: /\.(css|js|woff2)$/,
  
  // Templating options for dynamic content
  templatedURLs: {
    '/offline.html': ['src/offline.html'],
    '/offline-crisis.html': ['src/offline-crisis.html']
  }
};

// Export configuration with environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  module.exports.mode = 'development';
  module.exports.sourcemap = true;
}

// Crisis mode override for emergency deployments
if (process.env.CRISIS_MODE === 'true') {
  module.exports.maximumFileSizeToCacheInBytes = 50 * 1024 * 1024; // 50MB in crisis mode
  module.exports.globPatterns.unshift('**/crisis/**/*', '**/emergency/**/*');
}
