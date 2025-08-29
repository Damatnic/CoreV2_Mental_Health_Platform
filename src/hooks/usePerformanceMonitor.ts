/**
 * Performance Monitor Hook
 *
 * React hook for monitoring Core Web Vitals and performance metrics
 * specifically optimized for mental health crisis scenarios.
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint
}

export interface PerformanceState {
  metrics: PerformanceMetrics;
  isLoading: boolean;
  performanceScore: number;
  recommendations: string[];
  crisisOptimized: boolean;
  mobileOptimized: boolean;
  networkInfo?: NetworkInformation;
  memoryInfo?: MemoryInfo;
}

export interface UsePerformanceMonitorOptions {
  enableRealTimeAlerts?: boolean;
  enableCrisisOptimization?: boolean;
  enableAutomaticReporting?: boolean;
  reportingInterval?: number;
  onPerformanceAlert?: (metric: string, value: number, threshold: number) => void;
  onCrisisPerformanceIssue?: (issues: string[]) => void;
}

export interface CrisisPerformanceThresholds {
  criticalLCP: number;
  criticalFID: number;
  criticalTTFB: number;
  emergencyResponseTime: number;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  score: number;
  issues: string[];
  recommendations: string[];
  userAgent: string;
  url: string;
  connectionType?: string;
}

const CRISIS_THRESHOLDS: CrisisPerformanceThresholds = {
  criticalLCP: 1500, // 1.5s for crisis pages
  criticalFID: 50,   // 50ms for crisis interactions
  criticalTTFB: 500, // 500ms for crisis resource loading
  emergencyResponseTime: 100 // 100ms for emergency actions
};

const GOOD_THRESHOLDS = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1800,
  ttfb: 600,
  inp: 200
};

/**
 * Hook for monitoring web performance metrics
 */
export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}): PerformanceState => {
  const [state, setState] = useState<PerformanceState>({
    metrics: {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null
    },
    isLoading: true,
    performanceScore: 0,
    recommendations: [],
    crisisOptimized: false,
    mobileOptimized: false
  });

  const observersRef = useRef<PerformanceObserver[]>([]);
  const reportingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  });

  /**
   * Calculate performance score based on metrics
   */
  const calculatePerformanceScore = useCallback((metrics: PerformanceMetrics): number => {
    let score = 100;
    let totalWeight = 0;

    // LCP (25% weight)
    if (metrics.lcp !== null) {
      const lcpScore = metrics.lcp <= GOOD_THRESHOLDS.lcp ? 100 : 
                      metrics.lcp <= 4000 ? 50 : 0;
      score += lcpScore * 0.25;
      totalWeight += 0.25;
    }

    // FID (25% weight)
    if (metrics.fid !== null) {
      const fidScore = metrics.fid <= GOOD_THRESHOLDS.fid ? 100 :
                       metrics.fid <= 300 ? 50 : 0;
      score += fidScore * 0.25;
      totalWeight += 0.25;
    }

    // CLS (25% weight)
    if (metrics.cls !== null) {
      const clsScore = metrics.cls <= GOOD_THRESHOLDS.cls ? 100 :
                       metrics.cls <= 0.25 ? 50 : 0;
      score += clsScore * 0.25;
      totalWeight += 0.25;
    }

    // FCP (15% weight)
    if (metrics.fcp !== null) {
      const fcpScore = metrics.fcp <= GOOD_THRESHOLDS.fcp ? 100 :
                       metrics.fcp <= 3000 ? 50 : 0;
      score += fcpScore * 0.15;
      totalWeight += 0.15;
    }

    // TTFB (10% weight)
    if (metrics.ttfb !== null) {
      const ttfbScore = metrics.ttfb <= GOOD_THRESHOLDS.ttfb ? 100 :
                        metrics.ttfb <= 1500 ? 50 : 0;
      score += ttfbScore * 0.10;
      totalWeight += 0.10;
    }

    return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
  }, []);

  /**
   * Generate performance recommendations
   */
  const generateRecommendations = useCallback((metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > GOOD_THRESHOLDS.lcp) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing critical resources');
    }

    if (metrics.fid && metrics.fid > GOOD_THRESHOLDS.fid) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time and breaking up long tasks');
    }

    if (metrics.cls && metrics.cls > GOOD_THRESHOLDS.cls) {
      recommendations.push('Improve Cumulative Layout Shift by setting dimensions on images and avoiding dynamic content injection');
    }

    if (metrics.fcp && metrics.fcp > GOOD_THRESHOLDS.fcp) {
      recommendations.push('Speed up First Contentful Paint by optimizing fonts, CSS, and eliminating render-blocking resources');
    }

    if (metrics.ttfb && metrics.ttfb > GOOD_THRESHOLDS.ttfb) {
      recommendations.push('Reduce Time to First Byte by optimizing server performance and using a CDN');
    }

    if (metrics.inp && metrics.inp > GOOD_THRESHOLDS.inp) {
      recommendations.push('Improve Interaction to Next Paint by optimizing event handlers and reducing main thread work');
    }

    return recommendations;
  }, []);

  /**
   * Check for crisis performance issues
   */
  const checkCrisisPerformance = useCallback((metrics: PerformanceMetrics): string[] => {
    const issues: string[] = [];

    if (metrics.lcp && metrics.lcp > CRISIS_THRESHOLDS.criticalLCP) {
      issues.push(`Critical: LCP ${metrics.lcp}ms exceeds crisis threshold of ${CRISIS_THRESHOLDS.criticalLCP}ms`);
    }

    if (metrics.fid && metrics.fid > CRISIS_THRESHOLDS.criticalFID) {
      issues.push(`Critical: FID ${metrics.fid}ms exceeds crisis threshold of ${CRISIS_THRESHOLDS.criticalFID}ms`);
    }

    if (metrics.ttfb && metrics.ttfb > CRISIS_THRESHOLDS.criticalTTFB) {
      issues.push(`Critical: TTFB ${metrics.ttfb}ms exceeds crisis threshold of ${CRISIS_THRESHOLDS.criticalTTFB}ms`);
    }

    return issues;
  }, []);

  /**
   * Check if performance is optimized for mobile
   */
  const checkMobileOptimization = useCallback((): boolean => {
    const { metrics } = state;
    
    // Mobile-specific thresholds (stricter)
    const mobileThresholds = {
      lcp: 2000, // 2s for mobile
      fid: 80,   // 80ms for mobile
      cls: 0.1,  // Same as desktop
      fcp: 1500, // 1.5s for mobile
      ttfb: 800  // 800ms for mobile
    };

    const issues = [
      metrics.lcp && metrics.lcp > mobileThresholds.lcp,
      metrics.fid && metrics.fid > mobileThresholds.fid,
      metrics.cls && metrics.cls > mobileThresholds.cls,
      metrics.fcp && metrics.fcp > mobileThresholds.fcp,
      metrics.ttfb && metrics.ttfb > mobileThresholds.ttfb
    ].filter(Boolean).length;

    return issues === 0;
  }, [state.metrics]);

  /**
   * Update metric value
   */
  const updateMetric = useCallback((metricName: keyof PerformanceMetrics, value: number): void => {
    metricsRef.current = {
      ...metricsRef.current,
      [metricName]: value
    };

    const newMetrics = { ...metricsRef.current };
    const score = calculatePerformanceScore(newMetrics);
    const recommendations = generateRecommendations(newMetrics);
    const crisisIssues = checkCrisisPerformance(newMetrics);
    const mobileOptimized = checkMobileOptimization();

    setState(prev => ({
      ...prev,
      metrics: newMetrics,
      performanceScore: score,
      recommendations,
      crisisOptimized: crisisIssues.length === 0,
      mobileOptimized,
      isLoading: false
    }));

    // Alert for crisis performance issues
    if (options.enableCrisisOptimization && crisisIssues.length > 0) {
      options.onCrisisPerformanceIssue?.(crisisIssues);
    }

    // Alert for performance issues
    if (options.enableRealTimeAlerts) {
      const thresholds = options.enableCrisisOptimization ? CRISIS_THRESHOLDS : GOOD_THRESHOLDS;
      
      if (metricName === 'lcp' && value > (thresholds as any).criticalLCP || thresholds.lcp) {
        options.onPerformanceAlert?.(metricName, value, (thresholds as any).criticalLCP || thresholds.lcp);
      }
      
      if (metricName === 'fid' && value > (thresholds as any).criticalFID || thresholds.fid) {
        options.onPerformanceAlert?.(metricName, value, (thresholds as any).criticalFID || thresholds.fid);
      }
    }
  }, [calculatePerformanceScore, generateRecommendations, checkCrisisPerformance, checkMobileOptimization, options]);

  /**
   * Setup performance observers
   */
  const setupObservers = useCallback((): void => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    const observers: PerformanceObserver[] = [];

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        if (lastEntry) {
          updateMetric('lcp', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            updateMetric('fid', entry.processingStart - entry.startTime);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        updateMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // First Contentful Paint & TTFB
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            // TTFB
            updateMetric('ttfb', entry.responseStart - entry.requestStart);
          } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            // FCP
            updateMetric('fcp', entry.startTime);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation', 'paint'] });
      observers.push(navigationObserver);

      // Interaction to Next Paint (if supported)
      try {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            updateMetric('inp', entry.duration);
          });
        });
        inpObserver.observe({ entryTypes: ['event'] });
        observers.push(inpObserver);
      } catch (error) {
        // INP not supported in this browser
      }

    } catch (error) {
      console.error('Failed to setup performance observers:', error);
    }

    observersRef.current = observers;
  }, [updateMetric]);

  /**
   * Get network information
   */
  const getNetworkInfo = useCallback((): NetworkInformation | undefined => {
    if ('connection' in navigator) {
      return (navigator as any).connection as NetworkInformation;
    }
    return undefined;
  }, []);

  /**
   * Get memory information
   */
  const getMemoryInfo = useCallback((): MemoryInfo | undefined => {
    if ('memory' in performance) {
      return (performance as any).memory as MemoryInfo;
    }
    return undefined;
  }, []);

  /**
   * Generate performance report
   */
  const generateReport = useCallback((): PerformanceReport => {
    return {
      timestamp: Date.now(),
      metrics: { ...metricsRef.current },
      score: calculatePerformanceScore(metricsRef.current),
      issues: checkCrisisPerformance(metricsRef.current),
      recommendations: generateRecommendations(metricsRef.current),
      userAgent: navigator.userAgent,
      url: window.location.href,
      connectionType: getNetworkInfo()?.effectiveType
    };
  }, [calculatePerformanceScore, checkCrisisPerformance, generateRecommendations, getNetworkInfo]);

  /**
   * Setup automatic reporting
   */
  const setupReporting = useCallback((): void => {
    if (!options.enableAutomaticReporting) return;

    const interval = options.reportingInterval || 60000; // 1 minute default

    reportingIntervalRef.current = setInterval(() => {
      const report = generateReport();
      console.log('Performance Report:', report);
      
      // Here you could send the report to your analytics service
      // analytics.track('performance_report', report);
    }, interval);
  }, [options.enableAutomaticReporting, options.reportingInterval, generateReport]);

  // Initialize performance monitoring
  useEffect(() => {
    setupObservers();
    setupReporting();

    // Get initial network and memory info
    const networkInfo = getNetworkInfo();
    const memoryInfo = getMemoryInfo();

    setState(prev => ({
      ...prev,
      networkInfo,
      memoryInfo
    }));

    // Cleanup function
    return () => {
      // Disconnect all observers
      observersRef.current.forEach(observer => {
        observer.disconnect();
      });
      observersRef.current = [];

      // Clear reporting interval
      if (reportingIntervalRef.current) {
        clearInterval(reportingIntervalRef.current);
      }
    };
  }, [setupObservers, setupReporting, getNetworkInfo, getMemoryInfo]);

  // Monitor network changes
  useEffect(() => {
    const handleConnectionChange = () => {
      const networkInfo = getNetworkInfo();
      setState(prev => ({ ...prev, networkInfo }));
    };

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', handleConnectionChange);

      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [getNetworkInfo]);

  return state;
};

// TypeScript interfaces for browser APIs
interface NetworkInformation {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}
