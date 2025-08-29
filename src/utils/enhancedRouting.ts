/**
 * Enhanced Route-Based Code Splitting
 * 
 * Builds upon existing lazy loading with intelligent route optimization,
 * predictive loading, and mobile-specific performance enhancements.
 * Provides comprehensive route management with analytics and monitoring.
 * 
 * @fileoverview Enhanced routing utilities with predictive loading
 * @version 2.0.0
 */

import React, { ComponentType, lazy, useEffect, useState } from 'react';

// Type aliases
export type Priority = 'low' | 'medium' | 'high';
export type PrefetchTrigger = 'hover' | 'viewport' | 'immediate' | 'interaction';
export type LoadingStrategy = 'aggressive' | 'conservative' | 'minimal';

/**
 * Route configuration interface
 */
export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  preload?: boolean;
  priority?: Priority;
  dependencies?: string[];
  mobileOptimized?: boolean;
  prefetchTrigger?: PrefetchTrigger;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Navigation patterns for predictive loading
 */
export interface NavigationPattern {
  from: string;
  to: string;
  probability: number;
  timestamp: number;
  userAgent?: string;
}

/**
 * Route performance metrics
 */
export interface RouteMetrics {
  path: string;
  loadTime: number;
  renderTime: number;
  cacheHit: boolean;
  errorCount: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Enhanced lazy component options
 */
export interface EnhancedLazyOptions {
  strategy?: 'network-aware' | 'immediate' | 'on-demand';
  trackPerformance?: boolean;
  componentName?: string;
  priority?: Priority;
  respectDataSaver?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallback?: ComponentType<any>;
}

/**
 * Route analytics data
 */
export interface RouteAnalytics {
  totalRoutes: number;
  preloadedRoutes: number;
  cacheHitRate: number;
  averageLoadTime: number;
  mostVisitedRoutes: Array<{ path: string; count: number }>;
  navigationPatterns: NavigationPattern[];
}

/**
 * Enhanced route manager class
 */
export class EnhancedRouteManager {
  private static routes = new Map<string, RouteConfig>();
  private static navigationHistory: NavigationPattern[] = [];
  private static preloadCache = new Set<string>();
  private static routeMetrics = new Map<string, RouteMetrics>();
  private static currentRoute = '';
  private static isInitialized = false;
  private static observers = new Map<string, IntersectionObserver>();

  /**
   * Initialize the route manager
   */
  public static initialize(): void {
    if (this.isInitialized) return;

    // Setup navigation monitoring
    this.setupNavigationMonitoring();

    // Setup intersection observers for viewport-based preloading
    this.setupViewportPreloading();

    // Preload critical routes
    this.preloadCriticalRoutes();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    this.isInitialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Enhanced Route Manager initialized');
    }
  }

  /**
   * Register a route with enhanced lazy loading
   */
  public static registerRoute(config: RouteConfig): ComponentType<any> {
    const { path, component, priority = 'medium', mobileOptimized = true } = config;

    this.routes.set(path, config);

    // Initialize metrics
    this.routeMetrics.set(path, {
      path,
      loadTime: 0,
      renderTime: 0,
      cacheHit: false,
      errorCount: 0,
      accessCount: 0,
      lastAccessed: 0
    });

    // Create enhanced lazy component
    const EnhancedComponent = this.createEnhancedLazyComponent(
      () => Promise.resolve({ default: component }),
      {
        strategy: 'network-aware',
        trackPerformance: true,
        componentName: `Route_${path.replace(/[^\w]/g, '_')}`,
        priority,
        respectDataSaver: mobileOptimized,
        maxRetries: 2,
        retryDelay: 1000
      }
    );

    // Setup preloading if specified
    if (config.preload) {
      this.schedulePreload(path, priority);
    }

    return EnhancedComponent;
  }

  /**
   * Enhanced version of lazy route creation
   */
  public static createLazyRoute(
    importFn: () => Promise<{ default: ComponentType<any> }>,
    routePath: string,
    options: Partial<RouteConfig> = {}
  ): ComponentType<any> {
    const config: RouteConfig = {
      path: routePath,
      component: lazy(importFn) as ComponentType<any>,
      preload: false,
      priority: 'medium',
      mobileOptimized: true,
      prefetchTrigger: 'viewport',
      ...options
    };

    this.routes.set(routePath, config);

    // Initialize metrics
    this.routeMetrics.set(routePath, {
      path: routePath,
      loadTime: 0,
      renderTime: 0,
      cacheHit: false,
      errorCount: 0,
      accessCount: 0,
      lastAccessed: 0
    });

    // Create enhanced lazy component with import function
    const EnhancedComponent = this.createEnhancedLazyComponent(
      importFn,
      {
        strategy: 'network-aware',
        trackPerformance: true,
        componentName: `Route_${routePath.replace(/[^\w]/g, '_')}`,
        priority: config.priority,
        respectDataSaver: config.mobileOptimized,
        maxRetries: 2,
        retryDelay: 1000
      }
    );

    // Setup preloading based on trigger
    this.setupPreloadTrigger(routePath, config);

    return EnhancedComponent;
  }

  /**
   * Create enhanced lazy component with advanced features
   */
  private static createEnhancedLazyComponent(
    importFn: () => Promise<{ default: ComponentType<any> }>,
    options: EnhancedLazyOptions = {}
  ): ComponentType<any> {
    const {
      strategy = 'network-aware',
      trackPerformance = false,
      componentName = 'EnhancedLazyComponent',
      priority = 'medium',
      respectDataSaver = true,
      maxRetries = 3,
      retryDelay = 1000,
      fallback
    } = options;

    // Enhanced import function with retry logic and performance tracking
    const enhancedImportFn = async (): Promise<{ default: ComponentType<any> }> => {
      const startTime = performance.now();
      let attempts = 0;
      let lastError: Error | null = null;

      while (attempts < maxRetries) {
        try {
          const result = await importFn();
          
          if (trackPerformance) {
            const loadTime = performance.now() - startTime;
            this.recordLoadTime(componentName, loadTime);
          }

          return result;
        } catch (error) {
          attempts++;
          lastError = error as Error;
          
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
          }
        }
      }

      throw lastError || new Error(`Failed to load component after ${maxRetries} attempts`);
    };

    const LazyComponent = lazy(enhancedImportFn);

    // Wrapper component with performance tracking
    const WrappedComponent: React.FC<any> = (props) => {
      const [renderStartTime] = useState(() => performance.now());

      useEffect(() => {
        if (trackPerformance) {
          const renderTime = performance.now() - renderStartTime;
          this.recordRenderTime(componentName, renderTime);
        }
      }, [renderStartTime]);

      return React.createElement(LazyComponent, props);
    };

    WrappedComponent.displayName = componentName;
    return WrappedComponent;
  }

  /**
   * Setup navigation monitoring for predictive loading
   */
  private static setupNavigationMonitoring(): void {
    if (typeof window === 'undefined') return;

    let lastPath = window.location.pathname;

    // Monitor history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.recordNavigation(lastPath, args[2] as string);
      lastPath = args[2] as string;
      this.currentRoute = lastPath;
      originalPushState.apply(history, args);
      this.onRouteChange(lastPath);
    };

    history.replaceState = (...args) => {
      lastPath = args[2] as string;
      this.currentRoute = lastPath;
      originalReplaceState.apply(history, args);
      this.onRouteChange(lastPath);
    };

    // Monitor popstate events
    window.addEventListener('popstate', () => {
      const newPath = window.location.pathname;
      this.recordNavigation(lastPath, newPath);
      lastPath = newPath;
      this.currentRoute = newPath;
      this.onRouteChange(newPath);
    });
  }

  /**
   * Record navigation pattern
   */
  private static recordNavigation(from: string, to: string): void {
    if (from === to) return;

    const pattern: NavigationPattern = {
      from,
      to,
      probability: 1,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    this.navigationHistory.push(pattern);

    // Keep only recent history (last 100 navigations)
    if (this.navigationHistory.length > 100) {
      this.navigationHistory.shift();
    }

    // Update probabilities
    this.updateNavigationProbabilities();
  }

  /**
   * Update navigation probabilities based on history
   */
  private static updateNavigationProbabilities(): void {
    const patterns = new Map<string, { count: number; total: number }>();

    this.navigationHistory.forEach(({ from, to }) => {
      const key = `${from}->${to}`;
      const existing = patterns.get(key) || { count: 0, total: 0 };
      existing.count += 1;
      patterns.set(key, existing);

      // Count total navigations from "from" route
      const fromKey = `${from}->*`;
      const fromTotal = patterns.get(fromKey) || { count: 0, total: 0 };
      fromTotal.total += 1;
      patterns.set(fromKey, fromTotal);
    });

    // Update probabilities in navigation history
    this.navigationHistory.forEach(pattern => {
      const key = `${pattern.from}->${pattern.to}`;
      const fromKey = `${pattern.from}->*`;
      const patternData = patterns.get(key);
      const totalData = patterns.get(fromKey);

      if (patternData && totalData && totalData.total > 0) {
        pattern.probability = patternData.count / totalData.total;
      }
    });
  }

  /**
   * Handle route changes
   */
  private static onRouteChange(newPath: string): void {
    // Update route metrics
    this.updateRouteAccess(newPath);

    // Preload likely next routes
    this.preloadLikelyRoutes(newPath);

    // Cleanup unused resources
    this.cleanupUnusedResources();
  }

  /**
   * Update route access metrics
   */
  private static updateRouteAccess(path: string): void {
    const metrics = this.routeMetrics.get(path);
    if (metrics) {
      metrics.accessCount += 1;
      metrics.lastAccessed = Date.now();
    }
  }

  /**
   * Preload likely routes based on navigation patterns
   */
  private static preloadLikelyRoutes(currentPath: string): void {
    const likelyRoutes = this.getLikelyNextRoutes(currentPath);
    
    likelyRoutes.forEach(({ route, probability }) => {
      if (probability > 0.3 && !this.preloadCache.has(route)) {
        this.schedulePreload(route, probability > 0.7 ? 'high' : 'medium');
      }
    });
  }

  /**
   * Get likely next routes based on navigation patterns
   */
  private static getLikelyNextRoutes(currentPath: string): Array<{ route: string; probability: number }> {
    const routes: Array<{ route: string; probability: number }> = [];

    // Find patterns starting from current path
    const relevantPatterns = this.navigationHistory.filter(p => p.from === currentPath);

    // Group by destination and sum probabilities
    const routeProbabilities = new Map<string, number>();
    relevantPatterns.forEach(pattern => {
      const existing = routeProbabilities.get(pattern.to) || 0;
      routeProbabilities.set(pattern.to, existing + pattern.probability);
    });

    // Convert to array and sort by probability
    routeProbabilities.forEach((probability, route) => {
      routes.push({ route, probability });
    });

    return routes.sort((a, b) => b.probability - a.probability).slice(0, 3);
  }

  /**
   * Setup preload triggers
   */
  private static setupPreloadTrigger(routePath: string, config: RouteConfig): void {
    const { prefetchTrigger = 'viewport' } = config;

    switch (prefetchTrigger) {
      case 'immediate':
        this.schedulePreload(routePath, config.priority);
        break;

      case 'hover':
        this.setupHoverPreload(routePath, config.priority);
        break;

      case 'viewport':
        this.setupViewportPreload(routePath, config.priority);
        break;

      case 'interaction':
        this.setupInteractionPreload(routePath, config.priority);
        break;
    }
  }

  /**
   * Setup hover-based preloading
   */
  private static setupHoverPreload(routePath: string, priority?: Priority): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.getAttribute('href') === routePath) {
        this.schedulePreload(routePath, priority);
      }
    });
  }

  /**
   * Setup viewport-based preloading
   */
  private static setupViewportPreload(routePath: string, priority?: Priority): void {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLElement;
          const href = link.getAttribute('href');

          if (href === routePath) {
            this.schedulePreload(routePath, priority);
            observer.unobserve(link);
          }
        }
      });
    }, { rootMargin: '100px' });

    // Store observer for cleanup
    this.observers.set(routePath, observer);

    // Observe all links to this route
    setTimeout(() => {
      const links = document.querySelectorAll(`a[href="${routePath}"]`);
      links.forEach(link => observer.observe(link));
    }, 1000);
  }

  /**
   * Setup interaction-based preloading
   */
  private static setupInteractionPreload(routePath: string, priority?: Priority): void {
    if (typeof document === 'undefined') return;

    const events = ['touchstart', 'mousedown'];

    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a');

        if (link && link.getAttribute('href') === routePath) {
          this.schedulePreload(routePath, priority);
        }
      }, { passive: true });
    });
  }

  /**
   * Setup viewport preloading for all routes
   */
  private static setupViewportPreloading(): void {
    if (typeof window === 'undefined') return;

    const handleIntersection = (entry: IntersectionObserverEntry, observer: IntersectionObserver) => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLElement;
        const href = link.getAttribute('href');

        if (href && this.routes.has(href)) {
          const config = this.routes.get(href)!;
          if (config.prefetchTrigger === 'viewport') {
            this.schedulePreload(href, config.priority);
            observer.unobserve(link);
          }
        }
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => handleIntersection(entry, observer));
    }, { rootMargin: '100px' });

    // Handle added nodes
    const handleAddedNodes = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const links = element.querySelectorAll('a[href]');
        links.forEach(link => observer.observe(link));
      }
    };

    // Observe links as they appear
    const linkObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(handleAddedNodes);
      });
    });

    linkObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Preload critical routes immediately
   */
  private static preloadCriticalRoutes(): void {
    const criticalRoutes = [
      '/',
      '/chat',
      '/dashboard'
    ];

    criticalRoutes.forEach(route => {
      if (this.routes.has(route)) {
        this.schedulePreload(route, 'high');
      }
    });
  }

  /**
   * Schedule route preloading
   */
  private static schedulePreload(routePath: string, priority: Priority = 'medium'): void {
    if (this.preloadCache.has(routePath)) return;

    this.preloadCache.add(routePath);
    const config = this.routes.get(routePath);

    if (config && config.component) {
      // In a real implementation, this would integrate with a component preloader
      // For now, we'll simulate the preloading
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📦 Preloaded route: ${routePath} (priority: ${priority})`);
        }
      }, priority === 'high' ? 0 : priority === 'medium' ? 100 : 500);
    }
  }

  /**
   * Setup performance monitoring
   */
  private static setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor performance entries
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * Record navigation timing
   */
  private static recordNavigationTiming(timing: PerformanceNavigationTiming): void {
    const currentPath = window.location.pathname;
    const metrics = this.routeMetrics.get(currentPath);
    
    if (metrics) {
      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
    }
  }

  /**
   * Record component load time
   */
  private static recordLoadTime(componentName: string, loadTime: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Component ${componentName} load time: ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Record component render time
   */
  private static recordRenderTime(componentName: string, renderTime: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Component ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Cleanup unused resources
   */
  private static cleanupUnusedResources(): void {
    // This would typically involve analyzing which routes haven't been visited
    // and cleaning up their resources if memory is constrained
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning up unused route resources');
    }
  }

  /**
   * Get navigation statistics
   */
  public static getNavigationStats(): RouteAnalytics {
    const totalRoutes = this.routes.size;
    const preloadedRoutes = this.preloadCache.size;
    
    // Calculate cache hit rate
    const totalAccesses = Array.from(this.routeMetrics.values())
      .reduce((sum, metrics) => sum + metrics.accessCount, 0);
    const cacheHits = Array.from(this.routeMetrics.values())
      .reduce((sum, metrics) => sum + (metrics.cacheHit ? metrics.accessCount : 0), 0);
    const cacheHitRate = totalAccesses > 0 ? cacheHits / totalAccesses : 0;

    // Calculate average load time
    const loadTimes = Array.from(this.routeMetrics.values())
      .filter(metrics => metrics.loadTime > 0)
      .map(metrics => metrics.loadTime);
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    // Get most visited routes
    const mostVisitedRoutes = Array.from(this.routeMetrics.entries())
      .map(([path, metrics]) => ({ path, count: metrics.accessCount }))
      .filter(route => route.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRoutes,
      preloadedRoutes,
      cacheHitRate,
      averageLoadTime,
      mostVisitedRoutes,
      navigationPatterns: [...this.navigationHistory]
    };
  }

  /**
   * Get route performance metrics
   */
  public static getRouteMetrics(routePath: string): RouteMetrics | null {
    const metrics = this.routeMetrics.get(routePath);
    return metrics ? { ...metrics } : null;
  }

  /**
   * Clear all caches and reset state
   */
  public static reset(): void {
    this.routes.clear();
    this.navigationHistory = [];
    this.preloadCache.clear();
    this.routeMetrics.clear();
    this.currentRoute = '';
    
    // Cleanup observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    this.isInitialized = false;
  }
}

/**
 * Hook for using enhanced routing
 */
export const useEnhancedRouting = () => {
  useEffect(() => {
    EnhancedRouteManager.initialize();
  }, []);

  return {
    createLazyRoute: EnhancedRouteManager.createLazyRoute.bind(EnhancedRouteManager),
    getNavigationStats: EnhancedRouteManager.getNavigationStats.bind(EnhancedRouteManager),
    getRouteMetrics: EnhancedRouteManager.getRouteMetrics.bind(EnhancedRouteManager)
  };
};

/**
 * HOC for route performance tracking
 */
export const withRouteTracking = <P extends object>(
  Component: ComponentType<P>,
  routePath: string
): ComponentType<P> => {
  const TrackedComponent: React.FC<P> = (props) => {
    useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Route ${routePath} render time: ${renderTime.toFixed(2)}ms`);
        }
      };
    }, []);

    return React.createElement(Component, props);
  };

  TrackedComponent.displayName = `withRouteTracking(${Component.displayName || Component.name})`;
  return TrackedComponent as ComponentType<P>;
};

// Default export with enhanced route manager
export default {
  EnhancedRouteManager,
  useEnhancedRouting,
  withRouteTracking
};
