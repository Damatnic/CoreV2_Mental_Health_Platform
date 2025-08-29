/**
 * Performance Monitor Service
 * 
 * Monitors and tracks application performance with mental health considerations
 */

interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  firstInputDelay: number | null;
  cumulativeLayoutShift: number | null;
  
  // Custom metrics
  timeToInteractive: number | null;
  totalBlockingTime: number | null;
  
  // Application-specific
  crisisDetectionLatency: number | null;
  chatMessageLatency: number | null;
  moodEntryLatency: number | null;
  pageLoadTime: number | null;
  
  // Resource metrics
  bundleSize: number | null;
  memoryUsage: number | null;
  networkLatency: number | null;
}

interface CustomPerformanceEntry {
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: PerformanceMetrics;
  sessionId: string;
  userId?: string;
  critical: boolean; // For crisis-related performance issues
}

interface PerformanceThresholds {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  crisisDetectionLatency: number;
  chatMessageLatency: number;
  moodEntryLatency: number;
  pageLoadTime: number;
}

class PerformanceMonitor {
  private entries: CustomPerformanceEntry[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;
  private thresholds: PerformanceThresholds;
  private reportCallback?: (entry: CustomPerformanceEntry) => void;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.thresholds = this.getDefaultThresholds();
    
    if (typeof window !== 'undefined' && window.performance) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.observeWebVitals();
    this.observeNavigationTiming();
    this.observeResourceTiming();
    this.setupErrorTracking();
    this.setupMemoryMonitoring();
    
    // Set up periodic reporting
    setInterval(() => {
      this.reportMetrics();
    }, 30000); // Report every 30 seconds
  }

  private generateSessionId(): string {
    return 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getDefaultThresholds(): PerformanceThresholds {
    return {
      firstContentfulPaint: 2000, // 2 seconds
      largestContentfulPaint: 4000, // 4 seconds  
      firstInputDelay: 100, // 100ms
      cumulativeLayoutShift: 0.1, // 0.1 CLS score
      crisisDetectionLatency: 500, // 500ms - critical for safety
      chatMessageLatency: 1000, // 1 second
      moodEntryLatency: 2000, // 2 seconds
      pageLoadTime: 5000 // 5 seconds
    };
  }

  private observeWebVitals(): void {
    // First Contentful Paint
    this.observeCustomPerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => (entry as any).name === 'first-contentful-paint');
      if (fcpEntry) {
        this.updateMetric('firstContentfulPaint', (fcpEntry as any).startTime);
      }
    });

    // Largest Contentful Paint
    this.observeCustomPerformanceEntry('largest-contentful-paint', (entries) => {
      if (entries.length > 0) {
        const latestLCP = entries[entries.length - 1];
        this.updateMetric('largestContentfulPaint', (latestLCP as any).startTime);
      }
    });

    // First Input Delay
    this.observeCustomPerformanceEntry('first-input', (entries) => {
      if (entries.length > 0) {
        const fid = (entries[0] as any).processingStart - (entries[0] as any).startTime;
        this.updateMetric('firstInputDelay', fid);
      }
    });

    // Cumulative Layout Shift
    let clsScore = 0;
    this.observeCustomPerformanceEntry('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          this.updateMetric('cumulativeLayoutShift', clsScore);
        }
      });
    });
  }

  private observeNavigationTiming(): void {
    if (!performance.getEntriesByType) return;

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      
      // Calculate Time to Interactive approximation
      const tti = nav.domInteractive - nav.fetchStart;
      this.updateMetric('timeToInteractive', tti);
      
      // Calculate page load time
      const pageLoadTime = nav.loadEventEnd - nav.fetchStart;
      this.updateMetric('pageLoadTime', pageLoadTime);
    }
  }

  private observeResourceTiming(): void {
    this.observeCustomPerformanceEntry('resource', (entries) => {
      entries.forEach((entry: any) => {
        // Track bundle sizes
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          const size = entry.transferSize || entry.encodedBodySize || 0;
          this.updateMetric('bundleSize', size);
        }
        
        // Track network latency
        const latency = entry.responseStart - entry.requestStart;
        if (latency > 0) {
          this.updateMetric('networkLatency', latency);
        }
      });
    });
  }

  private observeCustomPerformanceEntry(type: string, callback: (entries: any[]) => void): void {
    if (!PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type} performance entries:`, error);
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.updateMetric('memoryUsage', memory.usedJSHeapSize);
        }
      }, 10000); // Check every 10 seconds
    }
  }

  private updateMetric(metric: keyof PerformanceMetrics, value: number): void {
    // Find or create current metrics entry
    let currentEntry = this.entries[this.entries.length - 1];
    if (!currentEntry || Date.now() - currentEntry.timestamp > 5000) {
      currentEntry = this.createNewEntry();
    }

    currentEntry.metrics[metric] = value;
    
    // Check thresholds and mark as critical if needed
    if (this.exceedsThreshold(metric, value)) {
      currentEntry.critical = true;
      
      // Immediate reporting for critical performance issues
      if (this.isCriticalMetric(metric)) {
        this.reportEntry(currentEntry);
      }
    }
  }

  private createNewEntry(): CustomPerformanceEntry {
    const entry: CustomPerformanceEntry = {
      id: this.generateEntryId(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      critical: false,
      metrics: {
        firstContentfulPaint: null,
        largestContentfulPaint: null,
        firstInputDelay: null,
        cumulativeLayoutShift: null,
        timeToInteractive: null,
        totalBlockingTime: null,
        crisisDetectionLatency: null,
        chatMessageLatency: null,
        moodEntryLatency: null,
        pageLoadTime: null,
        bundleSize: null,
        memoryUsage: null,
        networkLatency: null
      }
    };

    this.entries.push(entry);
    
    // Keep only last 100 entries to prevent memory issues
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(-100);
    }

    return entry;
  }

  private generateEntryId(): string {
    return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private exceedsThreshold(metric: keyof PerformanceMetrics, value: number): boolean {
    const threshold = this.thresholds[metric as keyof PerformanceThresholds];
    return threshold ? value > threshold : false;
  }

  private isCriticalMetric(metric: keyof PerformanceMetrics): boolean {
    return ['crisisDetectionLatency', 'chatMessageLatency'].includes(metric);
  }

  private trackError(error: {
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
  }): void {
    const errorEntry = {
      ...this.createNewEntry(),
      error,
      critical: true
    };
    
    this.reportEntry(errorEntry as CustomPerformanceEntry);
  }

  // Public API methods

  trackCustomMetric(name: keyof PerformanceMetrics, value: number, critical = false): void {
    this.updateMetric(name, value);
    
    if (critical) {
      const entry = this.entries[this.entries.length - 1];
      if (entry) {
        entry.critical = true;
        this.reportEntry(entry);
      }
    }
  }

  measureCrisisDetection<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.trackCustomMetric('crisisDetectionLatency', duration, duration > this.thresholds.crisisDetectionLatency);
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.trackCustomMetric('crisisDetectionLatency', duration, true);
        throw error;
      }
    );
  }

  measureChatMessage<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.trackCustomMetric('chatMessageLatency', duration);
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.trackCustomMetric('chatMessageLatency', duration, true);
        throw error;
      }
    );
  }

  measureMoodEntry<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.trackCustomMetric('moodEntryLatency', duration);
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.trackCustomMetric('moodEntryLatency', duration, true);
        throw error;
      }
    );
  }

  setUserId(userId: string): void {
    this.entries.forEach(entry => {
      if (!entry.userId) {
        entry.userId = userId;
      }
    });
  }

  setReportCallback(callback: (entry: CustomPerformanceEntry) => void): void {
    this.reportCallback = callback;
  }

  private reportEntry(entry: CustomPerformanceEntry): void {
    if (this.reportCallback) {
      this.reportCallback(entry);
    } else {
      this.sendToAnalytics(entry);
    }
  }

  private reportMetrics(): void {
    if (!this.isEnabled || this.entries.length === 0) return;

    const latestEntry = this.entries[this.entries.length - 1];
    if (latestEntry && !latestEntry.critical) {
      this.reportEntry(latestEntry);
    }
  }

  private async sendToAnalytics(entry: CustomPerformanceEntry): Promise<void> {
    if (!window.navigator.sendBeacon) return;

    try {
      const data = JSON.stringify({
        type: 'performance',
        entry,
        timestamp: Date.now()
      });

      window.navigator.sendBeacon('/api/analytics/performance', data);
    } catch (error) {
      console.warn('Failed to send performance data:', error);
    }
  }

  getMetrics(): CustomPerformanceEntry[] {
    return [...this.entries];
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    const latestEntry = this.entries[this.entries.length - 1];
    return latestEntry ? latestEntry.metrics : null;
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.entries.length === 0) return {};

    const metrics = this.entries.reduce((acc, entry) => {
      Object.entries(entry.metrics).forEach(([key, value]) => {
        if (value !== null) {
          acc[key] = acc[key] || [];
          acc[key].push(value);
        }
      });
      return acc;
    }, {} as Record<string, number[]>);

    const averages: Partial<PerformanceMetrics> = {};
    Object.entries(metrics).forEach(([key, values]) => {
      averages[key as keyof PerformanceMetrics] = 
        values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return averages;
  }

  getCriticalIssues(): CustomPerformanceEntry[] {
    return this.entries.filter(entry => entry.critical);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  reset(): void {
    this.entries = [];
    this.sessionId = this.generateSessionId();
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.entries = [];
    this.isEnabled = false;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Mental health platform specific performance utilities
export const trackCrisisPerformance = <T>(operation: () => Promise<T>): Promise<T> => {
  return performanceMonitor.measureCrisisDetection(operation);
};

export const trackChatPerformance = <T>(operation: () => Promise<T>): Promise<T> => {
  return performanceMonitor.measureChatMessage(operation);
};

export const trackMoodPerformance = <T>(operation: () => Promise<T>): Promise<T> => {
  return performanceMonitor.measureMoodEntry(operation);
};

// Hook for React components
export const usePerformanceMonitor = () => {
  const trackRender = (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackCustomMetric('pageLoadTime', duration);
      
      // Log slow renders for debugging
      if (duration > 100) {
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  };

  const trackInteraction = (interactionName: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      // Track different types of interactions
      if (interactionName.includes('crisis')) {
        performanceMonitor.trackCustomMetric('crisisDetectionLatency', duration, true);
      } else if (interactionName.includes('chat')) {
        performanceMonitor.trackCustomMetric('chatMessageLatency', duration);
      } else if (interactionName.includes('mood')) {
        performanceMonitor.trackCustomMetric('moodEntryLatency', duration);
      }
    };
  };

  return {
    trackRender,
    trackInteraction,
    getCurrentMetrics: () => performanceMonitor.getCurrentMetrics(),
    getCriticalIssues: () => performanceMonitor.getCriticalIssues()
  };
};

export default performanceMonitor;
export type { PerformanceMetrics, CustomPerformanceEntry, PerformanceThresholds };

