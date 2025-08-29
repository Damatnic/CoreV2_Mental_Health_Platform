/**
 * Performance Monitoring Service
 * Monitors and optimizes application performance
 */

import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  bundleSize: number;
  cacheHitRatio: number;
}

export interface PerformanceThresholds {
  loadTime: number; // ms
  renderTime: number; // ms
  memoryUsage: number; // MB
  networkLatency: number; // ms
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  
  private readonly thresholds: PerformanceThresholds = {
    loadTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
    memoryUsage: 50, // 50MB
    networkLatency: 1000 // 1 second
  };

  constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      this.measureLoadPerformance();
    });

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Monitor network performance
    this.monitorNetworkPerformance();
  }

  private setupPerformanceObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          switch (entry.entryType) {
            case 'navigation':
              this.handleNavigationEntry(entry as PerformanceNavigationTiming);
              break;
            case 'resource':
              this.handleResourceEntry(entry as PerformanceResourceTiming);
              break;
            case 'paint':
              this.handlePaintEntry(entry);
              break;
            case 'largest-contentful-paint':
              this.handleLCPEntry(entry);
              break;
            case 'first-input':
              this.handleFIDEntry(entry);
              break;
          }
        });
      });

      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input'] 
      });
    } catch (error) {
      logger.warn('Failed to setup performance observer', { error });
    }
  }

  private measureLoadPerformance(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
    const renderTime = timing.domComplete - timing.domLoading;

    const metrics: Partial<PerformanceMetrics> = {
      loadTime,
      renderTime
    };

    this.recordMetrics(metrics);

    // Check thresholds and alert if exceeded
    if (loadTime > this.thresholds.loadTime) {
      logger.warn('Load time threshold exceeded', { loadTime, threshold: this.thresholds.loadTime });
    }

    if (renderTime > this.thresholds.renderTime) {
      logger.warn('Render time threshold exceeded', { renderTime, threshold: this.thresholds.renderTime });
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      loadTime: entry.loadEventEnd - entry.fetchStart,
      renderTime: entry.domComplete - entry.domLoading,
      networkLatency: entry.responseStart - entry.requestStart
    };

    logger.info('Navigation performance', metrics);
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const loadTime = entry.responseEnd - entry.startTime;
    
    // Alert for slow resource loading
    if (loadTime > 2000) { // 2 seconds
      logger.warn('Slow resource loading detected', {
        resource: entry.name,
        loadTime,
        size: entry.transferSize
      });
    }
  }

  private handlePaintEntry(entry: PerformanceEntry): void {
    logger.info(`${entry.name} time`, { time: entry.startTime });
  }

  private handleLCPEntry(entry: PerformanceEntry): void {
    const lcp = entry.startTime;
    logger.info('Largest Contentful Paint', { lcp });
    
    if (lcp > 2500) { // 2.5 seconds
      logger.warn('Poor LCP performance', { lcp });
    }
  }

  private handleFIDEntry(entry: any): void {
    const fid = entry.processingStart - entry.startTime;
    logger.info('First Input Delay', { fid });
    
    if (fid > 100) { // 100ms
      logger.warn('Poor FID performance', { fid });
    }
  }

  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

      if (memoryUsage > this.thresholds.memoryUsage) {
        logger.warn('High memory usage detected', { 
          memoryUsage: `${memoryUsage.toFixed(2)}MB`,
          threshold: `${this.thresholds.memoryUsage}MB`
        });
      }

      // Check again in 30 seconds
      setTimeout(checkMemory, 30000);
    };

    // Start monitoring after 5 seconds
    setTimeout(checkMemory, 5000);
  }

  private monitorNetworkPerformance(): void {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    
    if (connection) {
      logger.info('Network information', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });

      // Alert for slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        logger.warn('Slow network connection detected', {
          effectiveType: connection.effectiveType
        });
      }
    }
  }

  private recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    const timestamp = Date.now();
    
    // Store metrics with timestamp
    const metricEntry = {
      timestamp,
      ...metrics
    };

    // Keep only last 100 entries
    if (this.metrics.length >= 100) {
      this.metrics.shift();
    }

    this.metrics.push(metricEntry as any);
  }

  public getPerformanceReport(): any {
    if (this.metrics.length === 0) {
      return { message: 'No performance data available yet' };
    }

    const latest = this.metrics[this.metrics.length - 1];
    const average = this.calculateAverageMetrics();

    return {
      latest,
      average,
      totalSamples: this.metrics.length,
      thresholds: this.thresholds,
      recommendations: this.generateRecommendations(average)
    };
  }

  private calculateAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sums: any = {};
    const counts: any = {};

    this.metrics.forEach(metric => {
      Object.keys(metric).forEach(key => {
        if (key !== 'timestamp' && typeof metric[key] === 'number') {
          sums[key] = (sums[key] || 0) + metric[key];
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const averages: any = {};
    Object.keys(sums).forEach(key => {
      averages[key] = sums[key] / counts[key];
    });

    return averages;
  }

  private generateRecommendations(metrics: Partial<PerformanceMetrics>): string[] {
    const recommendations: string[] = [];

    if (metrics.loadTime && metrics.loadTime > this.thresholds.loadTime) {
      recommendations.push('Consider optimizing bundle size and enabling code splitting');
    }

    if (metrics.renderTime && metrics.renderTime > this.thresholds.renderTime) {
      recommendations.push('Optimize component rendering with React.memo and useMemo');
    }

    if (metrics.memoryUsage && metrics.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('Check for memory leaks and optimize data structures');
    }

    if (metrics.networkLatency && metrics.networkLatency > this.thresholds.networkLatency) {
      recommendations.push('Consider using a CDN and optimizing API calls');
    }

    return recommendations;
  }

  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default performanceService;
