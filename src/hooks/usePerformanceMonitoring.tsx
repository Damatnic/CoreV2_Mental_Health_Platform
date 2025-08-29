/**
 * Performance Monitoring Hook
 *
 * Comprehensive React hook for monitoring application performance,
 * Core Web Vitals, and user experience metrics in real-time
 *
 * Features:
 * - Core Web Vitals tracking (FCP, LCP, CLS, FID, TTFB)
 * - Custom performance metrics
 * - Real-time performance alerts
 * - Performance budget monitoring
 * - Resource timing analysis
 * - Memory usage tracking
 * - Network performance monitoring
 * - Component-level performance tracking
 *
 * @license Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceService } from '../services/performanceService';
import { logger } from '../utils/logger';

// Performance Metrics Interface
interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
  
  // Custom Metrics
  domContentLoaded: number | null;
  windowLoad: number | null;
  navigationStart: number | null;
  
  // Memory Metrics
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  jsHeapSizeLimit: number | null;
  
  // Network Metrics
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  
  // Custom App Metrics
  componentRenderTime: number | null;
  apiResponseTime: number | null;
  routeChangeTime: number | null;
}

// Performance Alert Interface
interface PerformanceAlert {
  id: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

// Performance Budget Interface
interface PerformanceBudget {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
  bundleSize: number;
  imageSize: number;
  apiResponseTime: number;
}

// Resource Timing Interface
interface ResourceTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

// Hook Configuration Interface
interface UsePerformanceMonitoringConfig {
  enableCoreWebVitals: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableResourceTiming: boolean;
  enableCustomMetrics: boolean;
  alertThresholds: Partial<PerformanceBudget>;
  sampleRate: number; // 0-1, for performance sampling
  reportingInterval: number; // milliseconds
}

// Hook Return Type
interface UsePerformanceMonitoringReturn {
  // Current Metrics
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  resourceTimings: ResourceTiming[];
  
  // Status
  isMonitoring: boolean;
  lastUpdate: Date | null;
  
  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
  measureCustomMetric: (name: string, value: number) => void;
  measureComponentRender: (componentName: string, renderTime: number) => void;
  measureApiCall: (endpoint: string, responseTime: number) => void;
  measureRouteChange: (route: string, changeTime: number) => void;
  
  // Utilities
  getPerformanceScore: () => number;
  getBudgetStatus: () => 'good' | 'warning' | 'poor';
  exportMetrics: () => string;
}

// Default Configuration
const DEFAULT_CONFIG: UsePerformanceMonitoringConfig = {
  enableCoreWebVitals: true,
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true,
  enableResourceTiming: true,
  enableCustomMetrics: true,
  alertThresholds: {
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    cls: 0.1,
    fid: 100, // 100ms
    ttfb: 800, // 800ms
    apiResponseTime: 1000 // 1s
  },
  sampleRate: 1.0,
  reportingInterval: 5000 // 5 seconds
};

// Default Performance Budget
const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1800,
  lcp: 2500,
  cls: 0.1,
  fid: 100,
  ttfb: 800,
  bundleSize: 250000, // 250KB
  imageSize: 1000000, // 1MB
  apiResponseTime: 1000
};

/**
 * Performance Monitoring Hook
 * 
 * @param config - Optional configuration for performance monitoring
 * @returns Performance monitoring state and utilities
 */
export function usePerformanceMonitoring(
  config: Partial<UsePerformanceMonitoringConfig> = {}
): UsePerformanceMonitoringReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
    domContentLoaded: null,
    windowLoad: null,
    navigationStart: null,
    usedJSHeapSize: null,
    totalJSHeapSize: null,
    jsHeapSizeLimit: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
    componentRenderTime: null,
    apiResponseTime: null,
    routeChangeTime: null
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [resourceTimings, setResourceTimings] = useState<ResourceTiming[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observersRef = useRef<{
    performanceObserver?: PerformanceObserver;
    mutationObserver?: MutationObserver;
  }>({});
  
  // Core Web Vitals Collection
  const collectCoreWebVitals = useCallback(() => {
    if (!finalConfig.enableCoreWebVitals) return;
    
    try {
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          windowLoad: navigation.loadEventEnd - navigation.navigationStart,
          navigationStart: navigation.navigationStart,
          ttfb: navigation.responseStart - navigation.navigationStart
        }));
      }
      
      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      });
      
      // Use Performance Observer for other metrics
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            switch (entry.entryType) {
              case 'largest-contentful-paint':
                setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
                break;
              case 'first-input':
                setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
                break;
              case 'layout-shift':
                if (!(entry as any).hadRecentInput) {
                  setMetrics(prev => ({ 
                    ...prev, 
                    cls: (prev.cls || 0) + (entry as any).value 
                  }));
                }
                break;
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          observersRef.current.performanceObserver = observer;
        } catch (error) {
          logger.warn('Some performance entry types not supported', { error });
        }
      }
    } catch (error) {
      logger.error('Failed to collect Core Web Vitals', { error });
    }
  }, [finalConfig.enableCoreWebVitals]);
  
  // Memory Monitoring
  const collectMemoryMetrics = useCallback(() => {
    if (!finalConfig.enableMemoryMonitoring) return;
    
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }));
      }
    } catch (error) {
      logger.error('Failed to collect memory metrics', { error });
    }
  }, [finalConfig.enableMemoryMonitoring]);
  
  // Network Monitoring
  const collectNetworkMetrics = useCallback(() => {
    if (!finalConfig.enableNetworkMonitoring) return;
    
    try {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        }));
      }
    } catch (error) {
      logger.error('Failed to collect network metrics', { error });
    }
  }, [finalConfig.enableNetworkMonitoring]);
  
  // Resource Timing Collection
  const collectResourceTimings = useCallback(() => {
    if (!finalConfig.enableResourceTiming) return;
    
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const timings: ResourceTiming[] = resources.map(resource => ({
        name: resource.name,
        entryType: resource.entryType,
        startTime: resource.startTime,
        duration: resource.duration,
        transferSize: resource.transferSize || 0,
        encodedBodySize: resource.encodedBodySize || 0,
        decodedBodySize: resource.decodedBodySize || 0
      }));
      
      setResourceTimings(timings);
    } catch (error) {
      logger.error('Failed to collect resource timings', { error });
    }
  }, [finalConfig.enableResourceTiming]);
  
  // Alert Generation
  const checkAlerts = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];
    
    Object.entries(finalConfig.alertThresholds).forEach(([metric, threshold]) => {
      const value = currentMetrics[metric as keyof PerformanceMetrics] as number;
      
      if (value !== null && value > threshold) {
        const severity = calculateSeverity(metric, value, threshold);
        
        newAlerts.push({
          id: `${metric}_${Date.now()}`,
          metric: metric as keyof PerformanceMetrics,
          value,
          threshold,
          severity,
          message: generateAlertMessage(metric, value, threshold, severity),
          timestamp: new Date(),
          resolved: false
        });
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      
      // Report critical alerts
      newAlerts.forEach(alert => {
        if (alert.severity === 'critical') {
          performanceService.recordCustomMetric('performance_alert_critical', {
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
          });
        }
      });
    }
  }, [finalConfig.alertThresholds]);
  
  // Performance Collection Cycle
  const collectAllMetrics = useCallback(() => {
    try {
      collectCoreWebVitals();
      collectMemoryMetrics();
      collectNetworkMetrics();
      collectResourceTimings();
      
      setLastUpdate(new Date());
      
      // Check for alerts after metrics are updated
      setTimeout(() => {
        setMetrics(currentMetrics => {
          checkAlerts(currentMetrics);
          return currentMetrics;
        });
      }, 100);
      
    } catch (error) {
      logger.error('Failed to collect performance metrics', { error });
    }
  }, [collectCoreWebVitals, collectMemoryMetrics, collectNetworkMetrics, collectResourceTimings, checkAlerts]);
  
  // Start Monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    // Should we sample this session?
    if (Math.random() > finalConfig.sampleRate) {
      logger.debug('Performance monitoring skipped due to sampling rate');
      return;
    }
    
    setIsMonitoring(true);
    
    // Initial collection
    collectAllMetrics();
    
    // Set up periodic collection
    intervalRef.current = setInterval(collectAllMetrics, finalConfig.reportingInterval);
    
    logger.info('Performance monitoring started', { config: finalConfig });
  }, [isMonitoring, finalConfig, collectAllMetrics]);
  
  // Stop Monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Disconnect observers
    if (observersRef.current.performanceObserver) {
      observersRef.current.performanceObserver.disconnect();
      observersRef.current.performanceObserver = undefined;
    }
    
    if (observersRef.current.mutationObserver) {
      observersRef.current.mutationObserver.disconnect();
      observersRef.current.mutationObserver = undefined;
    }
    
    logger.info('Performance monitoring stopped');
  }, [isMonitoring]);
  
  // Clear Alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);
  
  // Custom Metrics
  const measureCustomMetric = useCallback((name: string, value: number) => {
    if (!finalConfig.enableCustomMetrics) return;
    
    try {
      performanceService.recordCustomMetric(`custom_${name}`, { value });
      logger.debug('Custom metric recorded', { name, value });
    } catch (error) {
      logger.error('Failed to record custom metric', { name, value, error });
    }
  }, [finalConfig.enableCustomMetrics]);
  
  const measureComponentRender = useCallback((componentName: string, renderTime: number) => {
    setMetrics(prev => ({ ...prev, componentRenderTime: renderTime }));
    measureCustomMetric(`component_render_${componentName}`, renderTime);
  }, [measureCustomMetric]);
  
  const measureApiCall = useCallback((endpoint: string, responseTime: number) => {
    setMetrics(prev => ({ ...prev, apiResponseTime: responseTime }));
    measureCustomMetric(`api_call_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, responseTime);
  }, [measureCustomMetric]);
  
  const measureRouteChange = useCallback((route: string, changeTime: number) => {
    setMetrics(prev => ({ ...prev, routeChangeTime: changeTime }));
    measureCustomMetric(`route_change_${route.replace(/[^a-zA-Z0-9]/g, '_')}`, changeTime);
  }, [measureCustomMetric]);
  
  // Performance Score Calculation
  const getPerformanceScore = useCallback((): number => {
    const scores: number[] = [];
    
    // FCP Score (0-100)
    if (metrics.fcp !== null) {
      scores.push(calculateMetricScore('fcp', metrics.fcp));
    }
    
    // LCP Score (0-100)
    if (metrics.lcp !== null) {
      scores.push(calculateMetricScore('lcp', metrics.lcp));
    }
    
    // CLS Score (0-100)
    if (metrics.cls !== null) {
      scores.push(calculateMetricScore('cls', metrics.cls));
    }
    
    // FID Score (0-100)
    if (metrics.fid !== null) {
      scores.push(calculateMetricScore('fid', metrics.fid));
    }
    
    // TTFB Score (0-100)
    if (metrics.ttfb !== null) {
      scores.push(calculateMetricScore('ttfb', metrics.ttfb));
    }
    
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }, [metrics]);
  
  // Budget Status
  const getBudgetStatus = useCallback((): 'good' | 'warning' | 'poor' => {
    const score = getPerformanceScore();
    
    if (score >= 90) return 'good';
    if (score >= 50) return 'warning';
    return 'poor';
  }, [getPerformanceScore]);
  
  // Export Metrics
  const exportMetrics = useCallback((): string => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts: alerts.filter(alert => !alert.resolved),
      resourceTimings: resourceTimings.slice(-10), // Last 10 resources
      performanceScore: getPerformanceScore(),
      budgetStatus: getBudgetStatus()
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [metrics, alerts, resourceTimings, getPerformanceScore, getBudgetStatus]);
  
  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (observersRef.current.performanceObserver) {
        observersRef.current.performanceObserver.disconnect();
      }
      
      if (observersRef.current.mutationObserver) {
        observersRef.current.mutationObserver.disconnect();
      }
    };
  }, []);
  
  return {
    // Current State
    metrics,
    alerts,
    resourceTimings,
    isMonitoring,
    lastUpdate,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    measureCustomMetric,
    measureComponentRender,
    measureApiCall,
    measureRouteChange,
    
    // Utilities
    getPerformanceScore,
    getBudgetStatus,
    exportMetrics
  };
}

// Helper Functions
function calculateSeverity(metric: string, value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
  const ratio = value / threshold;
  
  if (ratio >= 3) return 'critical';
  if (ratio >= 2) return 'high';
  if (ratio >= 1.5) return 'medium';
  return 'low';
}

function generateAlertMessage(metric: string, value: number, threshold: number, severity: string): string {
  const metricNames: Record<string, string> = {
    fcp: 'First Contentful Paint',
    lcp: 'Largest Contentful Paint',
    cls: 'Cumulative Layout Shift',
    fid: 'First Input Delay',
    ttfb: 'Time to First Byte',
    apiResponseTime: 'API Response Time'
  };
  
  const name = metricNames[metric] || metric;
  const unit = ['cls'].includes(metric) ? '' : 'ms';
  
  return `${name} is ${severity}: ${Math.round(value)}${unit} (threshold: ${threshold}${unit})`;
}

function calculateMetricScore(metric: string, value: number): number {
  const thresholds: Record<string, { good: number; poor: number }> = {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    fid: { good: 100, poor: 300 },
    ttfb: { good: 800, poor: 1800 }
  };
  
  const threshold = thresholds[metric];
  if (!threshold) return 50; // Default neutral score
  
  if (value <= threshold.good) return 100;
  if (value >= threshold.poor) return 0;
  
  // Linear interpolation between good and poor
  const ratio = (value - threshold.good) / (threshold.poor - threshold.good);
  return Math.round(100 * (1 - ratio));
}

export type { UsePerformanceMonitoringReturn, PerformanceMetrics, PerformanceAlert };
