/**
 * Simplified Workbox Configuration for Astral Core Service Worker
 * 
 * This configuration provides basic caching for the mental health platform
 */

module.exports = {
  // Source directory for the built application
  globDirectory: 'dist/',
  
  // Files to precache (critical resources)
  globPatterns: [
    // Core HTML files
    'index.html',
    'offline.html',
    
    // Critical static assets - simplified pattern
    'assets/**/*.{js,css}',
    
    // PWA essentials
    'manifest.json',
    'icon-*.png',
    'icon.svg',
    
    // Crisis resources (always cached)
    'crisis-resources.json',
    'emergency-contacts.json'
  ],
  
  // Files to ignore during precaching
  globIgnores: [
    // Large video files
    'Videos/**/*',
    
    // Source maps
    '**/*.map',
    
    // Development files
    '**/_*',
    '**/.*'
  ],
  
  // Output service worker location
  swDest: 'dist/sw.js',
  
  // Maximum file size for precaching (2MB)
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  
  // Skip waiting to activate new service worker immediately
  skipWaiting: true,
  
  // Client claim settings
  clientsClaim: true,
  
  // Custom navigation handling
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    // Don't use fallback for API routes
    /^\/_/,
    /^\/api/,
    /^\/\.netlify/,
    
    // Don't use fallback for assets
    /^\/assets/,
    /^\/Videos/,
    
    // Don't use fallback for service worker itself
    /sw\.js$/,
  ],
  
  // Mode configuration
  mode: 'production'
};