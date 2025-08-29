/**
 * Comprehensive Performance Monitoring System
 *
 * Advanced performance tracking with crisis feature prioritization,
 * mobile optimization, and real-time metrics collection for mental health applications.
 * 
 * @fileoverview Performance monitoring with crisis-aware optimizations
 * @version 2.0.0
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import * as React from 'react';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay (replaced by INP)
  inp: number | null; // Interaction to Next Paint
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  crisisFeatureLoadTime: number | null;
  chatLoadTime: number | null;
  bundleSize: number | null;
  memoryUsage: number | null;
  networkType: string | null;

  // User experience metrics
  pageLoadTime: number;
  timeToInteractive: number | null;
  resourceCount: number;

  // Mobile specific
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionSpeed: 'slow' | 'medium' | 'fast';
  batteryLevel: number | null;
}

/**
 * Crisis performance thresholds
 */
export interface CrisisThresholds {
  lcp: number; // Max acceptable LCP for crisis features
  fcp: number; // Max acceptable FCP for crisis features
  inp: number; // Max acceptable INP for crisis interactions
  pageLoad: number; // Max acceptable page load time
}

/**
 * Default crisis performance thresholds
 */
export const DEFAULT_CRISIS_THRESHOLDS: CrisisThresholds = {
  lcp: 1000,    // 1 second for crisis features
  fcp: 500,     // 0.5 seconds for first content
  inp: 50,      // 50ms for first input
  pageLoad: 2000 // 2 seconds for page load
};

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver>;
  private startTime: number;
  private analyticsEndpoint: string;
  private crisisThresholds: CrisisThresholds;
  private onCrisisPerformanceIssue?: (metric: string, value: number) => void;

  constructor(
    analyticsEndpoint = '/api/performance-analytics',
    crisisThresholds = DEFAULT_CRISIS_THRESHOLDS,
    onCrisisPerformanceIssue?: (metric: string, value: number) => void
  ) {
    this.analyticsEndpoint = analyticsEndpoint;
    this.crisisThresholds = crisisThresholds;
    this.onCrisisPerformanceIssue = onCrisisPerformanceIssue;
    this.startTime = performance.now();
    this.observers = new Map();
    
    this.metrics = {
      lcp: null,
      fid: null,
      inp: null,
      cls: null,
      fcp: null,
      ttfb: null,
      crisisFeatureLoadTime: null,
      chatLoadTime: null,
      bundleSize: null,
      memoryUsage: null,
      networkType: null,
      pageLoadTime: 0,
      timeToInteractive: null,
      resourceCount: 0,
      deviceType: this.detectDeviceType(),
      connectionSpeed: this.detectConnectionSpeed(),
      batteryLevel: null
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize all performance monitoring
   */
  private initializeMonitoring(): void {
    // Core Web Vitals
    this.setupWebVitals();

    // Custom metrics
    this.setupCustomMetrics();

    // Resource monitoring
    this.setupResourceMonitoring();

    // Memory monitoring
    this.setupMemoryMonitoring();

    // Network monitoring
    this.setupNetworkMonitoring();

    // Battery monitoring
    this.setupBatteryMonitoring();

    // Crisis feature monitoring
    this.setupCrisisMonitoring();

    // Send initial metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.sendMetrics(), 1000);
    });

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true);
    });
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupWebVitals(): void {
    // Largest Contentful Paint
    onLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.checkCrisisPerformance('lcp', metric.value);
    });

    // Interaction to Next Paint (replaces FID)
    onINP((metric: Metric) => {
      this.metrics.inp = metric.value;
      this.metrics.fid = metric.value; // Keep for backward compatibility
      this.checkCrisisPerformance('inp', metric.value);
    });

    // Cumulative Layout Shift
    onCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
    });

    // First Contentful Paint
    onFCP((metric: Metric) => {
      this.metrics.fcp = metric.value;
      this.checkCrisisPerformance('fcp', metric.value);
    });

    // Time to First Byte
    onTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
    });
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    // Time to Interactive
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            // Estimate TTI as FCP + processing time
            this.metrics.timeToInteractive = entry.startTime + 1000;
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('tti', observer);
    }

    // Page load time
    window.addEventListener('load', () => {
      this.metrics.pageLoadTime = performance.now() - this.startTime;
      this.checkCrisisPerformance('pageLoad', this.metrics.pageLoadTime);
    });
  }

  /**
   * Setup resource monitoring
   */
  private setupResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.metrics.resourceCount += entries.length;

        // Track bundle sizes and specific resource loads
        entries.forEach((entry: any) => {
          if (entry.name.includes('main') && entry.name.includes('.js')) {
            this.metrics.bundleSize = entry.transferSize || entry.encodedBodySize;
          }

          // Track crisis feature load times
          if (entry.name.includes('crisis') || entry.name.includes('emergency')) {
            this.metrics.crisisFeatureLoadTime = entry.responseEnd - entry.startTime;
            
            // Alert if crisis features load slowly
            if (this.metrics.crisisFeatureLoadTime > this.crisisThresholds.pageLoad) {
              this.alertSlowCrisisLoad(this.metrics.crisisFeatureLoadTime);
            }
          }

          // Track chat load times
          if (entry.name.includes('chat') || entry.name.includes('websocket')) {
            this.metrics.chatLoadTime = entry.responseEnd - entry.startTime;
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    }
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      const updateMemoryUsage = (): void => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      };

      updateMemoryUsage();
      setInterval(updateMemoryUsage, 30000); // Update every 30 seconds
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.networkType = connection.effectiveType;

      connection.addEventListener('change', () => {
        this.metrics.networkType = connection.effectiveType;
        this.metrics.connectionSpeed = this.detectConnectionSpeed();
      });
    }
  }

  /**
   * Setup battery monitoring
   */
  private setupBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.metrics.batteryLevel = battery.level * 100;
        
        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level * 100;
        });
      });
    }
  }

  /**
   * Setup crisis feature specific monitoring
   */
  private setupCrisisMonitoring(): void {
    // Monitor crisis button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('.emergency-btn') || target.closest('.crisis-btn')) {
        this.trackCrisisInteraction('button_click');
      }
    });

    // Monitor crisis page loads
    const monitorCrisisPageLoad = (): void => {
      if (window.location.pathname.includes('crisis') || 
          window.location.pathname.includes('emergency')) {
        const loadTime = performance.now() - this.startTime;
        this.trackCrisisInteraction('page_load', { loadTime });

        // Alert if crisis page loads slowly
        if (loadTime > this.crisisThresholds.pageLoad) {
          this.alertSlowCrisisLoad(loadTime);
        }
      }
    };

    window.addEventListener('load', monitorCrisisPageLoad);
    window.addEventListener('popstate', monitorCrisisPageLoad);
  }

  /**
   * Check if crisis features are performing adequately
   */
  private checkCrisisPerformance(metric: string, value: number): void {
    const threshold = this.crisisThresholds[metric as keyof CrisisThresholds];
    
    if (threshold && value > threshold) {
      this.alertSlowCrisisPerformance(metric, value);
    }
  }

  /**
   * Alert when crisis features are loading slowly
   */
  private alertSlowCrisisLoad(loadTime: number): void {
    console.warn(`🚨 Crisis page loaded slowly: ${loadTime.toFixed(2)}ms`);
    
    if (this.onCrisisPerformanceIssue) {
      this.onCrisisPerformanceIssue('crisis_load_time', loadTime);
    }

    // Send immediate alert for slow crisis loads
    this.sendMetrics(true, {
      alert: 'slow_crisis_load',
      loadTime,
      timestamp: Date.now()
    });
  }

  /**
   * Alert when crisis performance metrics are poor
   */
  private alertSlowCrisisPerformance(metric: string, value: number): void {
    console.warn(`🚨 Crisis feature ${metric} is slow: ${value.toFixed(2)}ms`);
    
    if (this.onCrisisPerformanceIssue) {
      this.onCrisisPerformanceIssue(metric, value);
    }

    // Track poor crisis performance
    this.trackCrisisInteraction('slow_performance', { metric, value });
  }

  /**
   * Track crisis-specific interactions
   */
  public trackCrisisInteraction(action: string, data?: any): void {
    const event = {
      action,
      timestamp: Date.now(),
      url: window.location.href,
      data,
      metrics: {
        lcp: this.metrics.lcp,
        inp: this.metrics.inp,
        memoryUsage: this.metrics.memoryUsage,
        networkType: this.metrics.networkType
      }
    };

    // Send immediately for crisis events
    this.sendMetrics(true, { crisisEvent: event });
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Detect connection speed
   */
  private detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const speed = connection.downlink;
      if (speed < 1) return 'slow';
      if (speed < 5) return 'medium';
      return 'fast';
    }
    return 'medium';
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance score (0-100)
   */
  public getPerformanceScore(): number {
    const scores = {
      lcp: this.metrics.lcp ? Math.max(0, 100 - (this.metrics.lcp / 25)) : 0,
      inp: this.metrics.inp ? Math.max(0, 100 - (this.metrics.inp / 1)) : 100,
      cls: this.metrics.cls ? Math.max(0, 100 - (this.metrics.cls * 1000)) : 100
    };

    return Math.round((scores.lcp + scores.inp + scores.cls) / 3);
  }

  /**
   * Check if performance is acceptable for crisis features
   */
  public isCrisisPerformanceAcceptable(): boolean {
    return (
      (this.metrics.lcp || 0) < this.crisisThresholds.lcp &&
      (this.metrics.inp || 0) < this.crisisThresholds.inp &&
      (this.metrics.fcp || 0) < this.crisisThresholds.fcp
    );
  }

  /**
   * Send metrics to analytics endpoint
   */
  public async sendMetrics(urgent = false, additionalData?: any): Promise<void> {
    try {
      const payload = {
        metrics: this.metrics,
        performanceScore: this.getPerformanceScore(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        urgent,
        ...additionalData
      };

      // Use sendBeacon for urgent or unload events
      if (urgent && 'sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.analyticsEndpoint,
          JSON.stringify(payload)
        );
      } else {
        await fetch(this.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Setup monitoring for specific component
   */
  public monitorComponent(name: string, element: HTMLElement): void {
    const startTime = performance.now();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const loadTime = performance.now() - startTime;
          
          // Track component load time
          this.trackCrisisInteraction('component_load', {
            component: name,
            loadTime,
            isVisible: true
          });

          observer.disconnect();
        }
      });
    });

    observer.observe(element);
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get or create performance monitor instance
 */
export const getPerformanceMonitor = (
  analyticsEndpoint?: string,
  crisisThresholds?: CrisisThresholds,
  onCrisisPerformanceIssue?: (metric: string, value: number) => void
): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(
      analyticsEndpoint,
      crisisThresholds,
      onCrisisPerformanceIssue
    );
  }
  return performanceMonitor;
};

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const monitor = getPerformanceMonitor();
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(monitor.getMetrics());
  const [score, setScore] = React.useState<number>(monitor.getPerformanceScore());

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics());
      setScore(monitor.getPerformanceScore());
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [monitor]);

  return {
    metrics,
    score,
    isCrisisPerformanceAcceptable: monitor.isCrisisPerformanceAcceptable(),
    trackCrisisInteraction: monitor.trackCrisisInteraction.bind(monitor),
    monitorComponent: monitor.monitorComponent.bind(monitor)
  };
};

/**
 * Performance monitoring middleware for React components
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const elementRef = React.useRef<HTMLDivElement>(null);
    const monitor = getPerformanceMonitor();

    React.useEffect(() => {
      if (elementRef.current) {
        monitor.monitorComponent(componentName, elementRef.current);
      }
    }, []);

    return (
      <div ref={elementRef}>
        <WrappedComponent {...(props as P)} ref={ref} />
      </div>
    );
  });
};

// Initialize performance monitoring on module load
if (typeof window !== 'undefined') {
  getPerformanceMonitor();
}

export default PerformanceMonitor;
