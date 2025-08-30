/**
 * Performance Monitoring Utility for Astral Core
 * Tracks and reports key performance metrics
 */

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  tti: number | null; // Time to Interactive
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  connectionType?: string;
  batteryLevel?: number;
}

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    tti: null
  };

  private observers: Map<string, PerformanceObserver> = new Map();
  private reportCallback: ((metrics: PerformanceMetrics) => void) | null = null;
  private reportInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Start monitoring on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }

    // Monitor visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private startMonitoring() {
    this.observeWebVitals();
    this.observeResourceTiming();
    this.observeMemoryUsage();
    this.observeNetworkInfo();
    this.startReporting();
  }

  private observeWebVitals() {
    // First Contentful Paint (FCP)
    this.observePaintTiming('first-contentful-paint', (value) => {
      this.metrics.fcp = value;
    });

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.debug('LCP observer not supported');
      }
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              this.metrics.fid = entry.processingStart - entry.startTime;
            }
          });
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.debug('FID observer not supported');
      }
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        let clsEntries: any[] = [];
        
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          });
          this.metrics.cls = clsValue;
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.debug('CLS observer not supported');
      }
    }

    // Time to First Byte (TTFB)
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      if (timing.responseStart && timing.navigationStart) {
        this.metrics.ttfb = timing.responseStart - timing.navigationStart;
      }
    }
  }

  private observePaintTiming(name: string, callback: (value: number) => void) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntriesByName(name);
          if (entries.length > 0) {
            callback(entries[0].startTime);
          }
        });
        
        observer.observe({ type: 'paint', buffered: true });
        this.observers.set(name, observer);
      } catch (e) {
        // Fallback for browsers that don't support paint timing
        if (window.performance && window.performance.getEntriesByName) {
          const entries = window.performance.getEntriesByName(name);
          if (entries.length > 0) {
            callback(entries[0].startTime);
          }
        }
      }
    }
  }

  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            // Log slow resources
            if (entry.duration > 1000) {
              console.warn('Slow resource detected:', {
                name: entry.name,
                duration: entry.duration,
                type: entry.initiatorType
              });
            }
          });
        });
        
        resourceObserver.observe({ type: 'resource', buffered: false });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.debug('Resource timing observer not supported');
      }
    }
  }

  private observeMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
      this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
    }
  }

  private observeNetworkInfo() {
    if ('connection' in navigator || 'mozConnection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection;
      if (connection) {
        this.metrics.connectionType = connection.effectiveType;
        
        // Listen for connection changes
        connection.addEventListener('change', () => {
          this.metrics.connectionType = connection.effectiveType;
          this.checkPerformanceMode();
        });
      }
    }

    // Battery API (for mobile optimization)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.metrics.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level;
          this.checkPerformanceMode();
        });
      });
    }
  }

  private checkPerformanceMode() {
    // Adjust performance based on network and battery
    const isSlowNetwork = this.metrics.connectionType === 'slow-2g' || 
                          this.metrics.connectionType === '2g';
    const isLowBattery = this.metrics.batteryLevel !== undefined && 
                         this.metrics.batteryLevel < 0.2;

    if (isSlowNetwork || isLowBattery) {
      this.enableLowPerformanceMode();
    }
  }

  private enableLowPerformanceMode() {
    // Dispatch event for the app to reduce performance-heavy features
    window.dispatchEvent(new CustomEvent('performance-mode-change', {
      detail: { mode: 'low' }
    }));
  }

  private startReporting() {
    this.intervalId = setInterval(() => {
      this.report();
    }, this.reportInterval);
  }

  private report() {
    const metrics = this.getMetrics();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', metrics);
    }

    // Call custom callback if provided
    if (this.reportCallback) {
      this.reportCallback(metrics);
    }

    // Send to analytics service
    this.sendToAnalytics(metrics);
  }

  private sendToAnalytics(metrics: PerformanceMetrics) {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const gtag = (window as any).gtag;
      
      // Send Web Vitals
      if (metrics.fcp) {
        gtag('event', 'FCP', {
          event_category: 'Web Vitals',
          value: Math.round(metrics.fcp),
          event_label: 'First Contentful Paint'
        });
      }

      if (metrics.lcp) {
        gtag('event', 'LCP', {
          event_category: 'Web Vitals',
          value: Math.round(metrics.lcp),
          event_label: 'Largest Contentful Paint'
        });
      }

      if (metrics.fid) {
        gtag('event', 'FID', {
          event_category: 'Web Vitals',
          value: Math.round(metrics.fid),
          event_label: 'First Input Delay'
        });
      }

      if (metrics.cls) {
        gtag('event', 'CLS', {
          event_category: 'Web Vitals',
          value: Math.round(metrics.cls * 1000),
          event_label: 'Cumulative Layout Shift'
        });
      }
    }

    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'performance',
        message: 'Web Vitals',
        level: 'info',
        data: metrics
      });
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public onReport(callback: (metrics: PerformanceMetrics) => void) {
    this.reportCallback = callback;
  }

  public pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public resume() {
    if (!this.intervalId) {
      this.startReporting();
    }
  }

  public destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear reporting interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.reportCallback = null;
  }

  // Utility method to mark custom timings
  public mark(name: string) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  // Utility method to measure between marks
  public measure(name: string, startMark: string, endMark?: string) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measures = window.performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          return measures[measures.length - 1].duration;
        }
      } catch (e) {
        console.debug('Performance measurement failed:', e);
      }
    }
    return null;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in React components
export const usePerformanceMonitor = () => {
  return {
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    onReport: performanceMonitor.onReport.bind(performanceMonitor)
  };
};

export default performanceMonitor;