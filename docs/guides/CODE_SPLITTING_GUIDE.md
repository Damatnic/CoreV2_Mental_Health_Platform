# Code Splitting and Bundle Optimization Guide

## Overview

This guide covers the comprehensive code splitting and bundle optimization system implemented for the Astral Core mental health platform. The system prioritizes crisis intervention resources while optimizing overall performance through intelligent lazy loading, strategic chunk splitting, and performance monitoring.

## System Architecture

### 1. LazyComponent System

The `LazyComponent.tsx` provides enhanced lazy loading with:

```typescript
// Basic usage
const MyComponent = LazyComponent(
  () => import('./MyComponent'),
  { preloadStrategy: 'idle', chunkName: 'my-feature' }
);

// Advanced configuration
const CrisisComponent = LazyComponent(
  () => import('./CrisisComponent'),
  {
    preloadStrategy: 'immediate',
    chunkName: 'crisis-resources',
    fallback: <CrisisLoadingSkeleton />,
    retryCount: 3,
    timeout: 10000
  }
);
```

#### Preloading Strategies

- **immediate**: Loads immediately when component is created
- **idle**: Loads when browser is idle (using requestIdleCallback)
- **visible**: Loads when component enters viewport
- **hover**: Loads on mouse hover or touch start

### 2. Bundle Optimization Configuration

The `bundleOptimization.ts` implements strategic chunk splitting:

```typescript
// Crisis resources get highest priority
const crisisResources = [
  'CrisisView', 'SafetyPlanView', 'EmergencyContactsView'
];

// Vendor libraries are separated by function
const vendorChunks = {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'state-vendor': ['zustand', '@tanstack/react-query'],
  'ui-vendor': ['framer-motion', 'lucide-react'],
  'utils-vendor': ['date-fns', 'zod', 'clsx'],
  'communication-vendor': ['socket.io-client'],
  'monitoring-vendor': ['@sentry/react']
};
```

### 3. Performance Monitoring

The `PerformanceMonitor.tsx` component provides real-time metrics:

- Core Web Vitals (FCP, LCP, CLS)
- Bundle size and chunk analysis
- Load time monitoring
- Cache hit rate tracking
- Performance threshold alerts

## Implementation Details

### Route-Based Code Splitting

Each major route is lazy-loaded with appropriate preloading strategies:

```typescript
// Crisis routes - immediate loading
export const CrisisView = createLazyRoute(
  () => import('../views/CrisisView'),
  {
    preloadStrategy: 'immediate',
    title: 'Crisis Support',
    requiresAuth: false
  }
);

// Core features - idle preloading
export const DashboardView = createLazyRoute(
  () => import('../views/DashboardView'),
  {
    preloadStrategy: 'idle',
    title: 'Dashboard',
    requiresAuth: true
  }
);

// Secondary features - hover preloading
export const SettingsView = createLazyRoute(
  () => import('../views/SettingsView'),
  {
    preloadStrategy: 'hover',
    title: 'Settings',
    requiresAuth: true
  }
);
```

### Component-Level Splitting

Large components are split into smaller chunks:

```typescript
// Split by feature
const MoodTracker = LazyComponent(
  () => import('./features/MoodTracker'),
  { chunkName: 'mood-tracking' }
);

const JournalEditor = LazyComponent(
  () => import('./features/JournalEditor'),
  { chunkName: 'journaling' }
);

// Split by usage frequency
const AdminPanel = LazyComponent(
  () => import('./admin/AdminPanel'),
  { 
    chunkName: 'admin',
    preloadStrategy: 'hover'
  }
);
```

### Error Boundaries

Each lazy component includes error handling:

```typescript
import { SimpleErrorBoundary } from './SimpleErrorBoundary';

const LazyFeature = () => (
  <SimpleErrorBoundary>
    <LazyComponent />
  </SimpleErrorBoundary>
);
```

## Build Configuration

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Crisis resources get priority chunk
          if (id.includes('crisis') || id.includes('emergency')) {
            return 'crisis-resources';
          }
          
          // Vendor splitting
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'ui-vendor';
            }
          }
          
          return 'app';
        }
      }
    },
    chunkSizeWarningLimit: 600,
    target: 'es2020'
  }
});
```

### Bundle Analysis

Monitor bundle performance:

```bash
# Build with analysis
npm run build:analyze

# Check bundle sizes
npm run bundle:size

# Performance audit
npm run audit:performance
```

## Performance Optimization Strategies

### 1. Crisis Resource Prioritization

```typescript
// Immediate loading for crisis resources
const criticalResources = [
  'crisis-resources',
  'emergency-contacts',
  'safety-plan'
];

// Preload on app initialization
criticalResources.forEach(chunk => {
  import(/* webpackChunkName: "[request]" */ `./chunks/${chunk}`);
});
```

### 2. Smart Preloading

```typescript
// Preload based on user behavior
const preloadUserRoutes = (userProfile: UserProfile) => {
  if (userProfile.hasActiveSessions) {
    SessionView.preload();
  }
  
  if (userProfile.usesCommunity) {
    CommunityView.preload();
  }
  
  if (userProfile.isHelper) {
    HelperDashboardView.preload();
  }
};
```

### 3. Resource Hints

```html
<!-- Preload critical chunks -->
<link rel="preload" href="/crisis-resources.js" as="script">
<link rel="preload" href="/react-vendor.js" as="script">

<!-- Prefetch likely next routes -->
<link rel="prefetch" href="/dashboard.js">
<link rel="prefetch" href="/community.js">
```

## Performance Monitoring

### Core Web Vitals Tracking

```typescript
// Monitor performance in production
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      // Track LCP for mental health critical paths
      analytics.track('performance.lcp', {
        value: entry.startTime,
        route: getCurrentRoute(),
        userSegment: getUserSegment()
      });
    }
  }
});

performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] });
```

### Bundle Size Monitoring

```typescript
// Track bundle performance
const trackBundleMetrics = () => {
  const bundleInfo = getBundleInfo();
  
  analytics.track('bundle.performance', {
    totalSize: bundleInfo.totalTransferSize,
    chunkCount: bundleInfo.jsResources,
    cacheHitRate: bundleInfo.cacheHitRate,
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
  });
};
```

## Testing Strategy

### Bundle Analysis Tests

```typescript
describe('Bundle Optimization', () => {
  test('crisis resources load immediately', async () => {
    const startTime = performance.now();
    const CrisisComponent = await import('../views/CrisisView');
    const loadTime = performance.now() - startTime;
    
    expect(loadTime).toBeLessThan(100); // Should be preloaded
  });
  
  test('bundle sizes within limits', () => {
    const bundleReport = getBundleSizeReport();
    
    expect(bundleReport.main).toBeLessThan(500 * 1024); // 500KB
    expect(bundleReport.vendor).toBeLessThan(300 * 1024); // 300KB
    expect(bundleReport.crisis).toBeLessThan(200 * 1024); // 200KB
  });
});
```

### Performance Tests

```typescript
describe('Performance Monitoring', () => {
  test('tracks core web vitals', () => {
    const monitor = new PerformanceMonitor();
    const metrics = monitor.getMetrics();
    
    expect(metrics.firstContentfulPaint).toBeDefined();
    expect(metrics.largestContentfulPaint).toBeDefined();
    expect(metrics.cumulativeLayoutShift).toBeDefined();
  });
  
  test('alerts on threshold violations', () => {
    const alertSpy = jest.fn();
    const monitor = new PerformanceMonitor({
      onThresholdExceeded: alertSpy
    });
    
    // Simulate poor performance
    monitor.updateMetrics({
      largestContentfulPaint: 5000 // Exceeds 2500ms threshold
    });
    
    expect(alertSpy).toHaveBeenCalledWith('lcp', 5000, 2500);
  });
});
```

## Deployment Considerations

### CDN Configuration

```nginx
# Optimize chunk caching
location ~* \.js$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  
  # Priority caching for crisis resources
  if ($uri ~ "crisis-resources") {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
```

### Service Worker Integration

```typescript
// Cache critical chunks with highest priority
const CRITICAL_CHUNKS = [
  '/crisis-resources.js',
  '/react-vendor.js',
  '/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('critical-chunks-v1').then((cache) => {
      return cache.addAll(CRITICAL_CHUNKS);
    })
  );
});
```

## Best Practices

### 1. Crisis Resource Priority

- Always load crisis intervention resources immediately
- Cache crisis resources with highest priority
- Monitor crisis resource performance separately

### 2. User-Centric Splitting

- Split by user journey, not technical boundaries
- Prioritize features based on usage analytics
- Consider user's mental health state in loading strategies

### 3. Performance Budgets

- Main bundle: < 500KB
- Vendor chunks: < 300KB each
- Critical path: < 200KB
- LCP: < 2.5 seconds
- CLS: < 0.1

### 4. Monitoring and Alerts

- Track bundle performance in production
- Set up alerts for performance regressions
- Monitor crisis resource availability

## Accessibility Considerations

### Loading States

```typescript
// Accessible loading indicators
const AccessibleLoader = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading content"
  >
    <LoadingSpinner />
    <span className="sr-only">
      Loading mental health resources...
    </span>
  </div>
);
```

### Error Handling

```typescript
// Accessible error boundaries
const AccessibleErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error }) => (
      <div role="alert" aria-live="assertive">
        <h2>Content Loading Error</h2>
        <p>
          We're having trouble loading this section. 
          <button onClick={() => window.location.reload()}>
            Try reloading the page
          </button>
        </p>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);
```

## Troubleshooting

### Common Issues

1. **Chunks not loading**: Check network configuration and CORS settings
2. **Performance regression**: Analyze bundle report and check for new large dependencies
3. **Memory leaks**: Ensure proper cleanup in lazy components
4. **Cache issues**: Verify chunk naming and cache headers

### Debug Tools

```typescript
// Debug bundle loading
window.__ASTRAL_DEBUG__ = {
  logChunkLoads: true,
  trackPerformance: true,
  analyzeBundle: true
};

// Performance debugging
const debugPerformance = () => {
  console.table(performance.getEntriesByType('resource'));
  console.log('Bundle info:', getBundleInfo());
  console.log('Performance metrics:', getPerformanceMetrics());
};
```

## Next Steps

1. **Advanced Preloading**: Implement ML-based preloading predictions
2. **Edge Optimization**: Deploy critical chunks to edge locations
3. **Progressive Enhancement**: Add progressive loading for slower connections
4. **Real User Monitoring**: Implement comprehensive RUM for performance insights

This code splitting system provides a robust foundation for the Astral Core platform, ensuring that crisis intervention resources are always available while optimizing the overall user experience through intelligent performance optimization.
