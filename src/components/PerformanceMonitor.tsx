/**
 * Comprehensive Performance Monitor Component
 *
 * Real-time performance monitoring, bundle analysis, and mental health platform
 * specific performance tracking with crisis intervention optimization.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================
// COMPREHENSIVE TYPE DEFINITIONS
// ============================

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  bundleSize: number;
  chunkCount: number;
  cacheHitRate: number;
  memoryUsage: number;
  connectionSpeed: string;
  resourceTimings: ResourceTiming[];
}

export interface ResourceTiming {
  name: string;
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'xmlhttprequest' | 'document' | 'other';
  duration: number;
  transferSize: number;
  decodedSize: number;
  startTime: number;
  endTime: number;
  cached: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface PerformanceThreshold {
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  recommendations: string[];
}

export interface MentalHealthPerformanceContext {
  isCrisisMode: boolean;
  isTherapySession: boolean;
  hasEmergencyContact: boolean;
  userStressLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresOptimization: boolean;
}

export interface PerformanceOptimization {
  preloadCriticalResources: boolean;
  enableServiceWorker: boolean;
  optimizeImages: boolean;
  minifyAssets: boolean;
  enableCompression: boolean;
  prioritizeCrisisFeatures: boolean;
}

export interface PerformanceBudget {
  maxBundleSize: number;
  maxLoadTime: number;
  maxLCP: number;
  maxCLS: number;
  maxFID: number;
  maxTBT: number;
  maxMemoryUsage: number;
}

export interface PerformanceMonitorProps {
  showDetails?: boolean;
  enableRealTimeMonitoring?: boolean;
  mentalHealthContext?: MentalHealthPerformanceContext;
  performanceBudget?: PerformanceBudget;
  optimizations?: PerformanceOptimization;
  onThresholdExceeded?: (alert: PerformanceAlert) => void;
  onOptimizationSuggested?: (suggestions: string[]) => void;
  onCrisisDetected?: (performanceImpact: boolean) => void;
  className?: string;
}

export interface PerformanceReport {
  timestamp: Date;
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  optimizationSuggestions: string[];
  overallScore: number;
  mentalHealthImpact: 'minimal' | 'moderate' | 'significant' | 'critical';
}

// ============================
// PERFORMANCE MONITORING HOOK
// ============================

export const useAdvancedPerformanceMonitoring = (
  context?: MentalHealthPerformanceContext,
  budget?: PerformanceBudget
) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  // Default performance budget with mental health platform focus
  const defaultBudget: PerformanceBudget = {
    maxBundleSize: context?.isCrisisMode ? 512000 : 1048576, // Tighter budget in crisis
    maxLoadTime: context?.isCrisisMode ? 1500 : 3000,
    maxLCP: context?.isCrisisMode ? 2000 : 2500,
    maxCLS: 0.1,
    maxFID: context?.isCrisisMode ? 80 : 100,
    maxTBT: context?.isCrisisMode ? 200 : 300,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    ...budget
  };

  // Performance thresholds optimized for mental health platform
  const performanceThresholds: Record<string, PerformanceThreshold> = {
    firstContentfulPaint: { good: 1200, needsImprovement: 2400, poor: 4000 },
    largestContentfulPaint: { good: 2000, needsImprovement: 3000, poor: 4000 },
    cumulativeLayoutShift: { good: 0.1, needsImprovement: 0.25, poor: 0.4 },
    firstInputDelay: { good: 100, needsImprovement: 300, poor: 500 },
    timeToInteractive: { good: 3000, needsImprovement: 5000, poor: 7000 },
    totalBlockingTime: { good: 200, needsImprovement: 600, poor: 1000 },
    loadTime: { good: context?.isCrisisMode ? 1500 : 2000, needsImprovement: 3000, poor: 5000 },
    bundleSize: { good: 512000, needsImprovement: 1048576, poor: 2097152 },
    memoryUsage: { good: 30 * 1024 * 1024, needsImprovement: 50 * 1024 * 1024, poor: 100 * 1024 * 1024 }
  };

  // Collect comprehensive performance metrics
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics | null> => {
    if (typeof window === 'undefined') return null;

    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      // Core Web Vitals
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      let lcp = metricsRef.current.largestContentfulPaint || 0;
      let cls = metricsRef.current.cumulativeLayoutShift || 0;
      let fid = metricsRef.current.firstInputDelay || 0;

      // Navigation timing
      const loadTime = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.loadEventStart : 0;
      const domContentLoaded = navigationEntry ? 
        navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart : 0;
      const tti = navigationEntry ? navigationEntry.domInteractive - navigationEntry.fetchStart : 0;

      // Resource analysis
      const resourceTimings: ResourceTiming[] = resourceEntries.map(entry => ({
        name: entry.name,
        type: determineResourceType(entry.name),
        duration: entry.duration,
        transferSize: entry.transferSize || 0,
        decodedSize: entry.decodedBodySize || 0,
        startTime: entry.startTime,
        endTime: entry.startTime + entry.duration,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
        priority: determinePriority(entry.name, context?.isCrisisMode || false)
      }));

      const totalBundleSize = resourceTimings.reduce((sum, resource) => sum + resource.transferSize, 0);
      const jsResources = resourceTimings.filter(r => r.type === 'script');
      const cacheHitRate = resourceTimings.length > 0 ? 
        (resourceTimings.filter(r => r.cached).length / resourceTimings.length) * 100 : 0;

      // Memory usage
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize : 0;

      // Connection info
      const connection = (navigator as any).connection;
      const connectionSpeed = connection ? connection.effectiveType || 'unknown' : 'unknown';

      // Calculate Total Blocking Time (simplified)
      const longTasks = resourceTimings.filter(r => r.duration > 50);
      const totalBlockingTime = longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);

      const newMetrics: PerformanceMetrics = {
        loadTime,
        domContentLoaded,
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp,
        cumulativeLayoutShift: cls,
        firstInputDelay: fid,
        timeToInteractive: tti,
        totalBlockingTime,
        bundleSize: totalBundleSize,
        chunkCount: jsResources.length,
        cacheHitRate,
        memoryUsage,
        connectionSpeed,
        resourceTimings
      };

      return newMetrics;
    } catch (error) {
      console.warn('Performance metrics collection failed:', error);
      return null;
    }
  }, [context]);

  // Generate performance alerts
  const generateAlerts = useCallback((metrics: PerformanceMetrics): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];
    const alertId = () => `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check each metric against thresholds
    Object.entries(performanceThresholds).forEach(([metricName, threshold]) => {
      const value = metrics[metricName as keyof PerformanceMetrics] as number;
      if (typeof value === 'number' && value > threshold.poor) {
        alerts.push({
          id: alertId(),
          metric: metricName,
          value,
          threshold: threshold.poor,
          severity: 'critical',
          message: `${metricName} (${formatMetricValue(value, metricName)}) exceeds critical threshold`,
          timestamp: new Date(),
          recommendations: getRecommendations(metricName, value, context)
        });
      } else if (typeof value === 'number' && value > threshold.needsImprovement) {
        alerts.push({
          id: alertId(),
          metric: metricName,
          value,
          threshold: threshold.needsImprovement,
          severity: 'warning',
          message: `${metricName} (${formatMetricValue(value, metricName)}) needs improvement`,
          timestamp: new Date(),
          recommendations: getRecommendations(metricName, value, context)
        });
      }
    });

    // Mental health specific alerts
    if (context?.isCrisisMode && metrics.loadTime > 1500) {
      alerts.push({
        id: alertId(),
        metric: 'crisisLoadTime',
        value: metrics.loadTime,
        threshold: 1500,
        severity: 'critical',
        message: 'Crisis mode requires faster load times for emergency features',
        timestamp: new Date(),
        recommendations: [
          'Enable crisis mode optimization',
          'Preload emergency contact features',
          'Prioritize crisis intervention resources'
        ]
      });
    }

    if (context?.userStressLevel === 'high' && metrics.cumulativeLayoutShift > 0.05) {
      alerts.push({
        id: alertId(),
        metric: 'stressLayoutShift',
        value: metrics.cumulativeLayoutShift,
        threshold: 0.05,
        severity: 'warning',
        message: 'Layout shifts may increase user stress during high-stress periods',
        timestamp: new Date(),
        recommendations: [
          'Stabilize layout during stress indicators',
          'Minimize dynamic content changes',
          'Predefine element dimensions'
        ]
      });
    }

    return alerts;
  }, [context, performanceThresholds]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (typeof window === 'undefined' || isMonitoring) return;

    setIsMonitoring(true);

    // Set up performance observers
    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformancePaintTiming[];
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metricsRef.current.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        let clsValue = metricsRef.current.cumulativeLayoutShift || 0;
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metricsRef.current.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          if (!metricsRef.current.firstInputDelay) {
            metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      observerRef.current = lcpObserver; // Store primary observer for cleanup
    } catch (error) {
      console.warn('Performance observers setup failed:', error);
    }

    // Regular metrics collection
    const collectAndUpdate = async () => {
      const newMetrics = await collectMetrics();
      if (newMetrics) {
        setMetrics(newMetrics);
        const newAlerts = generateAlerts(newMetrics);
        setAlerts(newAlerts);

        // Generate performance report
        const overallScore = calculateOverallScore(newMetrics);
        const mentalHealthImpact = assessMentalHealthImpact(newMetrics, context);
        
        const newReport: PerformanceReport = {
          timestamp: new Date(),
          metrics: newMetrics,
          alerts: newAlerts,
          optimizationSuggestions: generateOptimizationSuggestions(newMetrics, context),
          overallScore,
          mentalHealthImpact
        };
        
        setReport(newReport);
      }
    };

    // Initial collection
    if (document.readyState === 'complete') {
      collectAndUpdate();
    } else {
      window.addEventListener('load', collectAndUpdate);
    }

    // Periodic updates (more frequent in crisis mode)
    const updateInterval = context?.isCrisisMode ? 10000 : 30000;
    const intervalId = setInterval(collectAndUpdate, updateInterval);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isMonitoring, collectMetrics, generateAlerts, context]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring,
    report,
    startMonitoring,
    stopMonitoring,
    performanceThresholds
  };
};

// ============================
// UTILITY FUNCTIONS
// ============================

const determineResourceType = (url: string): ResourceTiming['type'] => {
  if (url.includes('.js') || url.includes('javascript')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
  if (url.includes('api/') || url.includes('fetch')) return 'fetch';
  if (url.includes('.html')) return 'document';
  return 'other';
};

const determinePriority = (url: string, isCrisisMode: boolean): ResourceTiming['priority'] => {
  if (isCrisisMode) {
    if (url.includes('crisis') || url.includes('emergency') || url.includes('988')) return 'critical';
    if (url.includes('safety') || url.includes('intervention')) return 'high';
  }
  if (url.includes('critical') || url.includes('main') || url.includes('app')) return 'critical';
  if (url.includes('vendor') || url.includes('common')) return 'high';
  if (url.includes('chunk') || url.includes('component')) return 'medium';
  return 'low';
};

const formatMetricValue = (value: number, metricName: string): string => {
  if (metricName.includes('Time') || metricName.includes('Paint') || metricName === 'loadTime') {
    return `${Math.round(value)}ms`;
  }
  if (metricName.includes('Size') || metricName === 'memoryUsage') {
    return `${(value / 1024).toFixed(1)}KB`;
  }
  if (metricName === 'cumulativeLayoutShift') {
    return value.toFixed(3);
  }
  if (metricName.includes('Rate')) {
    return `${value.toFixed(1)}%`;
  }
  return value.toString();
};

const getRecommendations = (
  metricName: string, 
  value: number, 
  context?: MentalHealthPerformanceContext
): string[] => {
  const recommendations: string[] = [];

  switch (metricName) {
    case 'loadTime':
      recommendations.push('Enable resource compression and minification');
      recommendations.push('Implement code splitting and lazy loading');
      if (context?.isCrisisMode) {
        recommendations.push('Prioritize crisis intervention resources');
        recommendations.push('Implement emergency service worker caching');
      }
      break;
    case 'bundleSize':
      recommendations.push('Analyze bundle composition and remove unused code');
      recommendations.push('Implement dynamic imports for non-critical features');
      recommendations.push('Optimize third-party libraries');
      break;
    case 'largestContentfulPaint':
      recommendations.push('Optimize critical rendering path');
      recommendations.push('Preload critical resources');
      recommendations.push('Optimize above-the-fold content');
      break;
    case 'cumulativeLayoutShift':
      recommendations.push('Define explicit dimensions for images and videos');
      recommendations.push('Reserve space for dynamic content');
      recommendations.push('Avoid inserting content above existing content');
      break;
    case 'memoryUsage':
      recommendations.push('Profile and fix memory leaks');
      recommendations.push('Implement proper cleanup in components');
      recommendations.push('Optimize large data structures');
      break;
    default:
      recommendations.push(`Optimize ${metricName} performance`);
  }

  return recommendations;
};

const calculateOverallScore = (metrics: PerformanceMetrics): number => {
  const weights = {
    loadTime: 0.25,
    firstContentfulPaint: 0.15,
    largestContentfulPaint: 0.20,
    cumulativeLayoutShift: 0.15,
    firstInputDelay: 0.10,
    totalBlockingTime: 0.10,
    bundleSize: 0.05
  };

  const thresholds = {
    loadTime: { good: 2000, poor: 4000 },
    firstContentfulPaint: { good: 1200, poor: 3000 },
    largestContentfulPaint: { good: 2500, poor: 4000 },
    cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
    firstInputDelay: { good: 100, poor: 300 },
    totalBlockingTime: { good: 200, poor: 600 },
    bundleSize: { good: 512000, poor: 1048576 }
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([metricName, weight]) => {
    const value = metrics[metricName as keyof PerformanceMetrics] as number;
    const threshold = thresholds[metricName as keyof typeof thresholds];
    
    if (typeof value === 'number' && threshold) {
      let score = 100;
      if (value > threshold.good) {
        const range = threshold.poor - threshold.good;
        const excess = Math.min(value - threshold.good, range);
        score = Math.max(0, 100 - (excess / range) * 100);
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

const assessMentalHealthImpact = (
  metrics: PerformanceMetrics, 
  context?: MentalHealthPerformanceContext
): PerformanceReport['mentalHealthImpact'] => {
  let impactScore = 0;

  // Performance factors that affect mental health
  if (metrics.loadTime > 3000) impactScore += 2;
  if (metrics.cumulativeLayoutShift > 0.15) impactScore += 1;
  if (metrics.firstInputDelay > 150) impactScore += 1;

  // Context-specific factors
  if (context?.isCrisisMode) {
    if (metrics.loadTime > 1500) impactScore += 3;
    if (metrics.largestContentfulPaint > 2000) impactScore += 2;
  }

  if (context?.userStressLevel === 'high' || context?.userStressLevel === 'critical') {
    impactScore += 1;
  }

  if (impactScore >= 4) return 'critical';
  if (impactScore >= 2) return 'significant';
  if (impactScore >= 1) return 'moderate';
  return 'minimal';
};

const generateOptimizationSuggestions = (
  metrics: PerformanceMetrics,
  context?: MentalHealthPerformanceContext
): string[] => {
  const suggestions: string[] = [];

  if (metrics.bundleSize > 1048576) {
    suggestions.push('Implement code splitting to reduce initial bundle size');
    suggestions.push('Use dynamic imports for non-critical features');
  }

  if (metrics.loadTime > 3000) {
    suggestions.push('Enable resource compression and caching');
    suggestions.push('Optimize critical rendering path');
  }

  if (metrics.cacheHitRate < 50) {
    suggestions.push('Implement service worker for better caching');
    suggestions.push('Set appropriate cache headers for static assets');
  }

  if (context?.isCrisisMode) {
    suggestions.push('Implement crisis mode performance optimizations');
    suggestions.push('Preload emergency contact and crisis intervention features');
    suggestions.push('Prioritize critical mental health resources');
  }

  if (metrics.memoryUsage > 50 * 1024 * 1024) {
    suggestions.push('Profile and fix memory leaks');
    suggestions.push('Implement proper component cleanup');
  }

  return suggestions;
};

// ============================
// MAIN COMPONENT
// ============================

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  enableRealTimeMonitoring = true,
  mentalHealthContext,
  performanceBudget,
  optimizations,
  onThresholdExceeded,
  onOptimizationSuggested,
  onCrisisDetected,
  className = ''
}) => {
  const {
    metrics,
    alerts,
    isMonitoring,
    report,
    startMonitoring,
    stopMonitoring,
    performanceThresholds
  } = useAdvancedPerformanceMonitoring(mentalHealthContext, performanceBudget);

  // Auto-start monitoring
  useEffect(() => {
    if (enableRealTimeMonitoring && !isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [enableRealTimeMonitoring, isMonitoring, startMonitoring]);

  // Handle threshold exceeded events
  useEffect(() => {
    if (alerts.length > 0 && onThresholdExceeded) {
      alerts.forEach(alert => onThresholdExceeded(alert));
    }
  }, [alerts, onThresholdExceeded]);

  // Handle crisis detection
  useEffect(() => {
    if (report && mentalHealthContext?.isCrisisMode && onCrisisDetected) {
      const hasPerformanceImpact = report.mentalHealthImpact === 'significant' || 
                                   report.mentalHealthImpact === 'critical';
      onCrisisDetected(hasPerformanceImpact);
    }
  }, [report, mentalHealthContext, onCrisisDetected]);

  // Format metric value for display
  const formatMetric = (value: number, unit: string, precision = 0): string => {
    if (unit === 'ms') return `${value.toFixed(precision)}ms`;
    if (unit === 'KB') return `${(value / 1024).toFixed(precision)}KB`;
    if (unit === '%') return `${value.toFixed(precision)}%`;
    if (unit === 'MB') return `${(value / (1024 * 1024)).toFixed(precision)}MB`;
    return `${value.toFixed(precision)}${unit}`;
  };

  // Get metric status for styling
  const getMetricStatus = (metricName: string, value: number): string => {
    const threshold = performanceThresholds[metricName];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  // Get priority alerts
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  if (!metrics) {
    return (
      <div className={`performance-monitor ${className}`}>
        <div className="performance-loading">
          <div className="loading-spinner" />
          <span>Collecting performance metrics...</span>
          {mentalHealthContext?.isCrisisMode && (
            <div className="crisis-notice">
              Crisis mode active - optimizing for emergency performance
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-monitor ${mentalHealthContext?.isCrisisMode ? 'crisis-mode' : ''} ${className}`}>
      {/* Performance Score */}
      {report && (
        <div className="performance-score">
          <div className={`score-circle score-${report.overallScore >= 90 ? 'good' : report.overallScore >= 70 ? 'average' : 'poor'}`}>
            <span className="score-value">{report.overallScore}</span>
            <span className="score-label">Performance Score</span>
          </div>
          <div className="mental-health-impact">
            <span className={`impact-indicator impact-${report.mentalHealthImpact}`}>
              Mental Health Impact: {report.mentalHealthImpact}
            </span>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="performance-alerts critical">
          <h4>🚨 Critical Performance Issues</h4>
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="alert critical-alert">
              <div className="alert-message">{alert.message}</div>
              <div className="alert-recommendations">
                {alert.recommendations.map((rec, idx) => (
                  <div key={idx} className="recommendation">• {rec}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="performance-alerts warning">
          <h4>⚠️ Performance Warnings</h4>
          {warningAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} className="alert warning-alert">
              <span className="alert-message">{alert.message}</span>
            </div>
          ))}
          {warningAlerts.length > 3 && (
            <div className="more-alerts">
              +{warningAlerts.length - 3} more warnings
            </div>
          )}
        </div>
      )}

      {/* Core Metrics */}
      <div className="performance-summary">
        {/* Core Web Vitals */}
        <div className="metric-group">
          <h4>🌟 Core Web Vitals</h4>
          <div className="metrics-grid">
            <div className={`metric metric--${getMetricStatus('firstContentfulPaint', metrics.firstContentfulPaint)}`}>
              <span className="metric-label">FCP</span>
              <span className="metric-value">{formatMetric(metrics.firstContentfulPaint, 'ms')}</span>
            </div>
            <div className={`metric metric--${getMetricStatus('largestContentfulPaint', metrics.largestContentfulPaint)}`}>
              <span className="metric-label">LCP</span>
              <span className="metric-value">{formatMetric(metrics.largestContentfulPaint, 'ms')}</span>
            </div>
            <div className={`metric metric--${getMetricStatus('cumulativeLayoutShift', metrics.cumulativeLayoutShift)}`}>
              <span className="metric-label">CLS</span>
              <span className="metric-value">{formatMetric(metrics.cumulativeLayoutShift, '', 3)}</span>
            </div>
            <div className={`metric metric--${getMetricStatus('firstInputDelay', metrics.firstInputDelay)}`}>
              <span className="metric-label">FID</span>
              <span className="metric-value">{formatMetric(metrics.firstInputDelay, 'ms')}</span>
            </div>
          </div>
        </div>

        {/* Loading Performance */}
        <div className="metric-group">
          <h4>⚡ Loading Performance</h4>
          <div className="metrics-grid">
            <div className={`metric metric--${getMetricStatus('loadTime', metrics.loadTime)}`}>
              <span className="metric-label">Load Time</span>
              <span className="metric-value">{formatMetric(metrics.loadTime, 'ms')}</span>
            </div>
            <div className="metric">
              <span className="metric-label">DOM Ready</span>
              <span className="metric-value">{formatMetric(metrics.domContentLoaded, 'ms')}</span>
            </div>
            <div className={`metric metric--${getMetricStatus('timeToInteractive', metrics.timeToInteractive)}`}>
              <span className="metric-label">TTI</span>
              <span className="metric-value">{formatMetric(metrics.timeToInteractive, 'ms')}</span>
            </div>
            <div className={`metric metric--${getMetricStatus('totalBlockingTime', metrics.totalBlockingTime)}`}>
              <span className="metric-label">TBT</span>
              <span className="metric-value">{formatMetric(metrics.totalBlockingTime, 'ms')}</span>
            </div>
          </div>
        </div>

        {/* Resource Analysis */}
        <div className="metric-group">
          <h4>📦 Bundle Analysis</h4>
          <div className="metrics-grid">
            <div className={`metric metric--${getMetricStatus('bundleSize', metrics.bundleSize)}`}>
              <span className="metric-label">Bundle Size</span>
              <span className="metric-value">{formatMetric(metrics.bundleSize, 'KB')}</span>
            </div>
            <div className="metric">
              <span className="metric-label">JS Chunks</span>
              <span className="metric-value">{metrics.chunkCount}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Cache Hit Rate</span>
              <span className="metric-value">{formatMetric(metrics.cacheHitRate, '%', 1)}</span>
            </div>
            <div className={`metric metric--${getMetricStatus('memoryUsage', metrics.memoryUsage)}`}>
              <span className="metric-label">Memory</span>
              <span className="metric-value">{formatMetric(metrics.memoryUsage, 'MB', 1)}</span>
            </div>
          </div>
        </div>

        {/* Connection Info */}
        <div className="metric-group">
          <h4>🌐 Connection</h4>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Connection</span>
              <span className="metric-value">{metrics.connectionSpeed}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Resources</span>
              <span className="metric-value">{metrics.resourceTimings.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Resource Timing */}
      {showDetails && (
        <div className="performance-details">
          <h4>🔍 Resource Timing Details</h4>
          <div className="resource-table">
            <div className="table-header">
              <span>Resource</span>
              <span>Type</span>
              <span>Duration</span>
              <span>Size</span>
              <span>Priority</span>
            </div>
            {metrics.resourceTimings
              .sort((a, b) => b.duration - a.duration)
              .slice(0, showDetails === true ? 10 : 5)
              .map((resource, idx) => (
                <div key={idx} className={`table-row ${resource.priority}`}>
                  <span className="resource-name" title={resource.name}>
                    {resource.name.split('/').pop() || 'Unknown'}
                  </span>
                  <span className="resource-type">{resource.type}</span>
                  <span className="resource-duration">{formatMetric(resource.duration, 'ms')}</span>
                  <span className="resource-size">{formatMetric(resource.transferSize, 'KB')}</span>
                  <span className={`resource-priority priority-${resource.priority}`}>
                    {resource.priority}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mental Health Context */}
      {mentalHealthContext && (
        <div className="mental-health-context">
          <h4>🧠 Mental Health Performance Context</h4>
          <div className="context-indicators">
            {mentalHealthContext.isCrisisMode && (
              <span className="context-indicator crisis">Crisis Mode Active</span>
            )}
            {mentalHealthContext.isTherapySession && (
              <span className="context-indicator therapy">Therapy Session</span>
            )}
            <span className={`context-indicator stress-${mentalHealthContext.userStressLevel}`}>
              Stress Level: {mentalHealthContext.userStressLevel}
            </span>
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {report && report.optimizationSuggestions.length > 0 && (
        <div className="optimization-suggestions">
          <h4>💡 Performance Optimization Suggestions</h4>
          <ul>
            {report.optimizationSuggestions.map((suggestion, idx) => (
              <li key={idx} className="suggestion-item">{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Control Panel */}
      <div className="performance-controls">
        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`control-button ${isMonitoring ? 'stop' : 'start'}`}
        >
          {isMonitoring ? '⏸️ Stop Monitoring' : '▶️ Start Monitoring'}
        </button>
        {report && (
          <div className="performance-timestamp">
            Last updated: {report.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Inline styles for comprehensive performance monitor */}
      <style>{`
        .performance-monitor {
          background: #ffffff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: system-ui, sans-serif;
        }
        
        .performance-monitor.crisis-mode {
          border: 3px solid #dc2626;
          background: #fef2f2;
        }
        
        .performance-loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        .crisis-notice {
          color: #dc2626;
          font-weight: 600;
          margin-top: 8px;
        }
        
        .performance-score {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .score-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid;
        }
        
        .score-circle.score-good { border-color: #10b981; background: #ecfdf5; }
        .score-circle.score-average { border-color: #f59e0b; background: #fffbeb; }
        .score-circle.score-poor { border-color: #ef4444; background: #fef2f2; }
        
        .score-value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }
        
        .score-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .mental-health-impact {
          text-align: right;
        }
        
        .impact-indicator {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .impact-minimal { background: #ecfdf5; color: #065f46; }
        .impact-moderate { background: #fffbeb; color: #92400e; }
        .impact-significant { background: #fef2f2; color: #991b1b; }
        .impact-critical { background: #fecaca; color: #7f1d1d; }
        
        .performance-alerts {
          margin-bottom: 24px;
          padding: 16px;
          border-radius: 8px;
        }
        
        .performance-alerts.critical {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        
        .performance-alerts.warning {
          background: #fffbeb;
          border: 1px solid #fed7aa;
        }
        
        .alert {
          margin-bottom: 12px;
          padding: 12px;
          border-radius: 6px;
        }
        
        .critical-alert {
          background: #fecaca;
          color: #7f1d1d;
        }
        
        .warning-alert {
          background: #fed7aa;
          color: #92400e;
        }
        
        .alert-recommendations {
          margin-top: 8px;
          font-size: 14px;
        }
        
        .recommendation {
          margin: 4px 0;
        }
        
        .metric-group {
          margin-bottom: 32px;
        }
        
        .metric-group h4 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .metric {
          display: flex;
          flex-direction: column;
          padding: 16px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
        }
        
        .metric--good { border-color: #10b981; background: #ecfdf5; }
        .metric--needs-improvement { border-color: #f59e0b; background: #fffbeb; }
        .metric--poor { border-color: #ef4444; background: #fef2f2; }
        
        .metric-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .resource-table {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          background: #f8fafc;
          padding: 12px;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .table-row:hover {
          background: #f8fafc;
        }
        
        .resource-name {
          font-family: monospace;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .resource-priority.priority-critical { color: #dc2626; font-weight: 600; }
        .resource-priority.priority-high { color: #ea580c; }
        .resource-priority.priority-medium { color: #ca8a04; }
        .resource-priority.priority-low { color: #6b7280; }
        
        .context-indicators {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .context-indicator {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .context-indicator.crisis { background: #fecaca; color: #7f1d1d; }
        .context-indicator.therapy { background: #ddd6fe; color: #5b21b6; }
        .context-indicator.stress-low { background: #ecfdf5; color: #065f46; }
        .context-indicator.stress-medium { background: #fffbeb; color: #92400e; }
        .context-indicator.stress-high { background: #fef2f2; color: #991b1b; }
        .context-indicator.stress-critical { background: #fecaca; color: #7f1d1d; }
        
        .optimization-suggestions ul {
          list-style: none;
          padding: 0;
        }
        
        .suggestion-item {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .suggestion-item::before {
          content: "💡 ";
          margin-right: 8px;
        }
        
        .performance-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        
        .control-button {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .control-button.start {
          background: #10b981;
          color: white;
        }
        
        .control-button.stop {
          background: #ef4444;
          color: white;
        }
        
        .control-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .performance-timestamp {
          color: #6b7280;
          font-size: 14px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PerformanceMonitor;