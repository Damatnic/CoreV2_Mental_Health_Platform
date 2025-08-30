/**
 * Main Entry Point for Astral Core Application
 * This file bootstraps the React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Initialize process shim for browser environment
import './utils/processShim';
// Using App with Optional Auth - login is not required
import App from './App';
import './index.css';

// Import global styles
import './styles/layout-fix-critical.css'; // CRITICAL: Must be first to fix layout issues
import './styles/design-system.css'
import './styles/accessibility.css';
import './styles/mobile-responsive-fixes.css';
import './styles/dark-theme-enhancements.css';
import './styles/safe-ui-system.css';
import './styles/mobile-performance.css'; // Mobile performance optimizations

// Import i18n configuration
import './i18n';
import { logger } from './utils/logger';

// Auth0 provider - not used with simple auth
// import { auth0Service } from './services/auth0Service'
// Import environment validator
import { loadAndValidateEnv } from './utils/envValidator';

// Import error tracking
import { initializeErrorTracking } from './config/errorTracking';

// Import service worker manager
import { registerServiceWorker } from './services/serviceWorkerConfig';

// Import OpenTelemetry (using stub implementation)
import { openTelemetryService } from './services/openTelemetryService';

// Import performance monitoring
import { performanceMonitoringService } from './services/performanceMonitoringService';

// Import enhanced mobile performance services
import { enhancedMobilePerformanceService } from './services/mobilePerformanceEnhancedService';
import { mobileMemoryManager } from './services/mobileMemoryManagerService';
import { mobileCrisisCacheService } from './services/mobileCrisisCacheService';

// Validate environment variables on startup
try {
  loadAndValidateEnv();
} catch (error) {
  logger.error('Environment validation failed:', error, 'main');
  if (import.meta.env.PROD) {
    // In production, show a friendly error page
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1>Configuration Error</h1>
          <p>We're experiencing technical difficulties. Please try again later.</p>
          <p style="color: #666; font-size: 0.9rem;">If this problem persists, please contact support.</p>
        </div>
      </div>
    `;
    throw error;
  }
}

// Initialize error tracking
if (import.meta.env.PROD) {
  initializeErrorTracking();
}

// Initialize OpenTelemetry (using stub)
if (import.meta.env.VITE_OTEL_ENABLED === 'true') {
  openTelemetryService.initialize().catch(error => {
    logger.error('Failed to initialize OpenTelemetry:', error, 'main');
  });
}

// Initialize performance monitoring
performanceMonitoringService.initialize();

// Initialize enhanced mobile performance services
if (typeof window !== 'undefined') {
  // Detect if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.matchMedia('(max-width: 768px)').matches ||
                   'ontouchstart' in window;
  
  if (isMobile) {
    // Initialize mobile-specific performance optimizations
    enhancedMobilePerformanceService.initialize().then(() => {
      logger.info('Enhanced mobile performance service initialized', undefined, 'main');
    }).catch(error => {
      logger.error('Failed to initialize enhanced mobile performance', error, 'main');
    });
    
    // Start memory monitoring for leak detection
    mobileMemoryManager.startMonitoring();
    logger.info('Mobile memory monitoring started', undefined, 'main');
    
    // Initialize crisis cache for offline support
    mobileCrisisCacheService.initialize().then(() => {
      logger.info('Mobile crisis cache initialized', undefined, 'main');
      
      // Preload critical resources
      mobileCrisisCacheService.preloadCriticalResources();
    }).catch(error => {
      logger.error('Failed to initialize crisis cache', error, 'main');
    });
  }
}

// Skip Auth0 initialization - using simple auth instead
// auth0Service.initialize().catch(error => {
//   logger.error('Failed to initialize Auth0:', error, 'main')
// })

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Make sure index.html contains a div with id="root"');
}

// Create React root and render app with Optional Auth
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Performance monitoring
if (import.meta.env.PROD) {
  // Report Web Vitals
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => logger.debug('CLS metric', metric, 'web-vitals'));
    onINP((metric) => logger.debug('INP metric', metric, 'web-vitals'));
    onFCP((metric) => logger.debug('FCP metric', metric, 'web-vitals'));
    onLCP((metric) => logger.debug('LCP metric', metric, 'web-vitals'));
    onTTFB((metric) => logger.debug('TTFB metric', metric, 'web-vitals'));
  });
}

// Accessibility: Announce app ready to screen readers
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Astral Core Mental Health Support Platform has loaded and is ready to use.';
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  });
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  logger.error('Unhandled promise rejection:', event.reason, 'global');
  
  // In production, report to error tracking
  if (import.meta.env.PROD) {
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(event.reason);
    }
  }

  // Prevent default browser behavior
  event.preventDefault();
});

// Export for testing (commented out to fix build)
// export { root }