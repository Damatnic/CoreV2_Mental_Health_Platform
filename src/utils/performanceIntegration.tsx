/**
 * Mobile Performance Integration
 *
 * Integration utilities to seamlessly enhance existing codebase with mobile performance optimizations.
 * Provides wrapper components and migration helpers for existing lazy loading infrastructure
 * with crisis-aware performance monitoring.
 * 
 * @fileoverview Performance integration utilities and React components
 * @version 2.0.0
 */

import React, { ComponentType, useEffect, useState, useCallback } from 'react';

/**
 * Performance integration configuration
 */
export interface PerformanceConfig {
  enableMobileOptimizations: boolean;
  enableBundleAnalysis: boolean;
  enableRouteOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  enablePreloading: boolean;
  debugMode: boolean;
  crisisOptimizationEnabled: boolean;
}

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableMobileOptimizations: true,
  enableBundleAnalysis: process.env.NODE_ENV === 'development',
  enableRouteOptimization: true,
  enablePerformanceMonitoring: true,
  enablePreloading: true,
  debugMode: process.env.NODE_ENV === 'development',
  crisisOptimizationEnabled: true
};

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize?: number;
  networkType?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Enhanced lazy component options
 */
export interface LazyComponentOptions {
  strategy: 'network-aware' | 'immediate' | 'viewport' | 'interaction';
  trackPerformance: boolean;
  componentName: string;
  respectDataSaver: boolean;
  priority: 'low' | 'medium' | 'high';
  maxRetries: number;
  retryDelay: number;
  crisisOptimized?: boolean;
}

/**
 * Performance integration HOC
 */
export const withMobilePerformance = <P extends object>(
  WrappedComponent: ComponentType<P>,
  config: Partial<PerformanceConfig> = {}
) => {
  const mergedConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
  
  const EnhancedComponent: React.FC<P> = (props) => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      const initializePerformance = async () => {
        try {
          // Initialize performance optimizations
          if (mergedConfig.enableBundleAnalysis) {
            // Dynamic import to avoid bundle bloat
            const { initializeBundleOptimization } = await import('./bundleOptimization');
            initializeBundleOptimization();
          }

          if (mergedConfig.enableRouteOptimization) {
            const { EnhancedRouteManager } = await import('./enhancedRouting');
            EnhancedRouteManager.initialize();
          }

          if (mergedConfig.crisisOptimizationEnabled) {
            // Initialize crisis-specific optimizations
            await initializeCrisisOptimizations();
          }

          setIsInitialized(true);

          if (mergedConfig.debugMode) {
            console.log('🚀 Mobile performance optimizations initialized', mergedConfig);
          }
        } catch (error) {
          console.error('Failed to initialize performance optimizations:', error);
          setIsInitialized(true); // Continue without optimizations
        }
      };

      initializePerformance();
    }, []);

    if (mergedConfig.enableMobileOptimizations && isInitialized) {
      return (
        <MobilePerformanceProvider
          enableMonitoring={mergedConfig.enablePerformanceMonitoring}
          enablePreloading={mergedConfig.enablePreloading}
          optimizeForMobile={true}
          crisisOptimized={mergedConfig.crisisOptimizationEnabled}
        >
          <WrappedComponent {...props} />
        </MobilePerformanceProvider>
      );
    }

    return <WrappedComponent {...props} />;
  };

  EnhancedComponent.displayName = `withMobilePerformance(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return EnhancedComponent;
};

/**
 * Crisis-specific performance optimizations
 */
async function initializeCrisisOptimizations(): Promise<void> {
  try {
    // Preload critical crisis resources
    const criticalResources = [
      '/crisis-resources.json',
      '/emergency-contacts.json'
    ];

    await Promise.all(
      criticalResources.map(resource =>
        fetch(resource).catch(() => null) // Fail silently
      )
    );

    // Initialize crisis performance monitoring
    if ('performance' in window) {
      performance.mark('crisis-optimizations-ready');
    }
  } catch (error) {
    console.warn('Crisis optimizations failed to initialize:', error);
  }
}

/**
 * Migration helper for existing React.lazy components
 */
export const migrateLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  options: Partial<LazyComponentOptions> = {}
): ComponentType<any> => {
  const defaultOptions: LazyComponentOptions = {
    strategy: 'network-aware',
    trackPerformance: true,
    componentName,
    respectDataSaver: true,
    priority: 'medium',
    maxRetries: 2,
    retryDelay: 1000,
    crisisOptimized: false
  };

  const finalOptions = { ...defaultOptions, ...options };

  if (finalOptions.crisisOptimized || finalOptions.priority === 'high') {
    // Enhanced loading for crisis components
    return React.lazy(async () => {
      const startTime = performance.now();
      
      try {
        const module = await importFn();
        
        if (finalOptions.trackPerformance) {
          const loadTime = performance.now() - startTime;
          console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
          
          // Report slow crisis component loads
          if (finalOptions.crisisOptimized && loadTime > 1000) {
            console.warn(`Crisis component ${componentName} loaded slowly: ${loadTime}ms`);
          }
        }
        
        return module;
      } catch (error) {
        console.error(`Failed to load component ${componentName}:`, error);
        throw error;
      }
    });
  }

  // Standard React.lazy fallback
  return React.lazy(importFn);
};

/**
 * Mobile-optimized route factory
 */
export const createMobileOptimizedRoutes = () => {
  const createOptimizedRoute = (
    importFn: () => Promise<{ default: ComponentType<any> }>,
    componentName: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const crisisOptimized = componentName.toLowerCase().includes('crisis') || 
                           componentName.toLowerCase().includes('emergency');
    
    return migrateLazyComponent(importFn, componentName, {
      priority,
      crisisOptimized,
      strategy: priority === 'high' ? 'immediate' : 'network-aware'
    });
  };

  return {
    createOptimizedRoute,
    
    // Convenience methods
    createCriticalRoute: (
      importFn: () => Promise<{ default: ComponentType<any> }>, 
      name: string
    ) => createOptimizedRoute(importFn, name, 'high'),
    
    createStandardRoute: (
      importFn: () => Promise<{ default: ComponentType<any> }>, 
      name: string
    ) => createOptimizedRoute(importFn, name, 'medium'),
    
    createDeferredRoute: (
      importFn: () => Promise<{ default: ComponentType<any> }>, 
      name: string
    ) => createOptimizedRoute(importFn, name, 'low')
  };
};

/**
 * Mobile Performance Provider Component
 */
interface MobilePerformanceProviderProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enablePreloading?: boolean;
  optimizeForMobile?: boolean;
  crisisOptimized?: boolean;
}

const MobilePerformanceProvider: React.FC<MobilePerformanceProviderProps> = ({
  children,
  enableMonitoring = true,
  enablePreloading = true,
  optimizeForMobile = true,
  crisisOptimized = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    deviceType: 'desktop'
  });

  useEffect(() => {
    if (!enableMonitoring) return;

    const updateMetrics = () => {
      const newMetrics: PerformanceMetrics = {
        loadTime: performance.now(),
        renderTime: performance.now(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        deviceType: window.innerWidth < 768 ? 'mobile' : 
                    window.innerWidth < 1024 ? 'tablet' : 'desktop',
        networkType: (navigator as any).connection?.effectiveType
      };
      
      setMetrics(newMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);

    return () => clearInterval(interval);
  }, [enableMonitoring]);

  // Crisis-specific performance monitoring
  useEffect(() => {
    if (!crisisOptimized) return;

    const monitorCrisisPerformance = () => {
      if (metrics.loadTime > 2000) {
        console.warn('Crisis component performance degraded:', metrics);
      }
    };

    monitorCrisisPerformance();
  }, [crisisOptimized, metrics]);

  return <>{children}</>;
};

/**
 * Performance monitoring component
 */
export const PerformanceMonitor: React.FC<{ 
  enabled?: boolean;
  crisisMode?: boolean;
}> = ({ 
  enabled = process.env.NODE_ENV === 'development',
  crisisMode = false
}) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const logPerformanceMetrics = async () => {
      try {
        // Get navigation stats
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        
        const newStats = {
          loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
        };

        setStats(newStats);

        if (crisisMode) {
          console.group('🚨 Crisis Performance Metrics');
        } else {
          console.group('📊 Performance Metrics');
        }
        
        console.log('Load Time:', newStats.loadTime + 'ms');
        console.log('DOM Content Loaded:', newStats.domContentLoaded + 'ms');
        console.log('First Paint:', newStats.firstPaint + 'ms');
        console.log('First Contentful Paint:', newStats.firstContentfulPaint + 'ms');
        console.log('Memory Usage:', (newStats.memoryUsage / 1024 / 1024).toFixed(2) + 'MB');
        console.groupEnd();

        // Alert for poor crisis performance
        if (crisisMode && newStats.loadTime > 1000) {
          console.warn('⚠️ Crisis component performance is suboptimal');
        }
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    };

    // Initial metrics
    setTimeout(logPerformanceMetrics, 1000);

    // Periodic metrics
    const interval = setInterval(logPerformanceMetrics, 30000);

    // Metrics on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logPerformanceMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, crisisMode]);

  return null;
};

/**
 * Mobile optimizations provider component
 */
export const MobileOptimizationsProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<PerformanceConfig>;
}> = ({ children, config = {} }) => {
  const mergedConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };

  return (
    <MobilePerformanceProvider
      enableMonitoring={mergedConfig.enablePerformanceMonitoring}
      enablePreloading={mergedConfig.enablePreloading}
      optimizeForMobile={mergedConfig.enableMobileOptimizations}
      crisisOptimized={mergedConfig.crisisOptimizationEnabled}
    >
      {children}
      <PerformanceMonitor 
        enabled={mergedConfig.debugMode}
        crisisMode={mergedConfig.crisisOptimizationEnabled}
      />
    </MobilePerformanceProvider>
  );
};

/**
 * Hook for performance integration
 */
export const usePerformanceIntegration = (config: Partial<PerformanceConfig> = {}) => {
  const [isReady, setIsReady] = useState(false);
  const mergedConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };

  useEffect(() => {
    const initializePerformance = async () => {
      try {
        // Initialize all performance systems
        if (mergedConfig.enableBundleAnalysis) {
          const { initializeBundleOptimization } = await import('./bundleOptimization');
          initializeBundleOptimization();
        }

        if (mergedConfig.enableRouteOptimization) {
          const { EnhancedRouteManager } = await import('./enhancedRouting');
          EnhancedRouteManager.initialize();
        }

        setIsReady(true);

        if (mergedConfig.debugMode) {
          console.log('🚀 Performance integration initialized', mergedConfig);
        }
      } catch (error) {
        console.error('Performance integration failed:', error);
        setIsReady(true); // Continue without optimizations
      }
    };

    initializePerformance();
  }, []);

  const trackPerformance = useCallback((eventName: string, data?: any) => {
    if (mergedConfig.enablePerformanceMonitoring) {
      console.log(`Performance Event: ${eventName}`, data);
    }
  }, [mergedConfig.enablePerformanceMonitoring]);

  return {
    isReady,
    createMobileOptimizedRoutes,
    migrateLazyComponent,
    trackPerformance,
    config: mergedConfig
  };
};

/**
 * Utility to wrap existing App component
 */
export const enhanceAppWithMobilePerformance = (
  AppComponent: ComponentType<any>,
  config: Partial<PerformanceConfig> = {}
) => {
  return withMobilePerformance(AppComponent, config);
};

// Default export with all utilities
export default {
  withMobilePerformance,
  migrateLazyComponent,
  createMobileOptimizedRoutes,
  PerformanceMonitor,
  MobileOptimizationsProvider,
  usePerformanceIntegration,
  enhanceAppWithMobilePerformance,
  DEFAULT_PERFORMANCE_CONFIG
};
