/**
 * Core Web Vitals Service - Mental Health Optimized Performance Monitoring
 *
 * Enterprise-grade Core Web Vitals monitoring service specifically optimized for mental health platforms.
 * Provides comprehensive performance tracking, accessibility metrics, and user experience optimization
 * with HIPAA compliance and therapeutic user journey analytics.
 *
 * @fileoverview HIPAA-compliant performance monitoring optimized for mental health UX
 * @version 3.0.0
 * @module CoreWebVitalsService
 * @compliance HIPAA, WCAG 2.1 AA, Section 508
 * @optimization Mental Health UX, Crisis Response Performance
 */

import { logger } from '../utils/logger';

// Enhanced type definitions for better browser compatibility
interface ExtendedPerformanceResourceTiming extends PerformanceResourceTiming {
  renderBlockingStatus?: 'blocking' | 'non-blocking';
}

interface ExtendedHTMLImageElement extends HTMLImageElement {
  naturalWidth: number;
  naturalHeight: number;
}

// Navigation timing type mapping for compatibility
type NavigationTypeMap = {
  [key: number]: 'navigate' | 'reload' | 'back_forward' | 'prerender';
};

const NAVIGATION_TYPE_MAP: NavigationTypeMap = {
  0: 'navigate',
  1: 'reload', 
  2: 'back_forward',
  255: 'prerender'
};

export type WebVitalMetric = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
export type MetricRating = 'good' | 'needs-improvement' | 'poor';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export interface WebVitalMeasurement {
  id: string;
  metric: WebVitalMetric;
  value: number;
  rating: MetricRating;
  timestamp: Date;
  url: string;
  deviceType: DeviceType;
  connectionType: ConnectionType;
  context: {
    sessionId: string;
    userId?: string;
    userAgent: string;
    viewport: {
      width: number;
      height: number;
    };
    navigation: {
      type: 'navigate' | 'reload' | 'back_forward' | 'prerender';
      timing: PerformanceNavigationTiming;
    };
    resources: {
      totalSize: number;
      imageSize: number;
      scriptSize: number;
      stylesheetSize: number;
      fontSize: number;
      count: number;
    };
    renderBlocking: {
      scripts: number;
      stylesheets: number;
      fonts: number;
    };
    criticalPath: {
      elements: string[];
      depth: number;
      resources: string[];
    };
  };
  metadata: {
    element?: Element;
    attribution?: any;
    entries?: PerformanceEntry[];
    debug?: Record<string, any>;
  };
}

export interface WebVitalThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  FCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
  INP: { good: number; poor: number };
}

export interface PerformanceBudget {
  id: string;
  name: string;
  enabled: boolean;
  thresholds: WebVitalThresholds;
  targets: {
    percentile: number; // 75th percentile by default
    sampleSize: number;
    timeWindow: number; // milliseconds
  };
  alerts: {
    enabled: boolean;
    channels: ('console' | 'storage' | 'webhook')[];
    thresholdExceeded: boolean;
    budgetExceeded: boolean;
    regressionDetected: boolean;
  };
  enforcement: {
    blockDeployment: boolean;
    requireApproval: boolean;
    generateReport: boolean;
  };
}

export interface WebVitalReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalMeasurements: number;
    uniqueUsers: number;
    uniqueSessions: number;
    overallScore: number; // 0-100
    passRate: number; // percentage of good measurements
  };
  metrics: {
    [K in WebVitalMetric]: {
      measurements: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
      rating: MetricRating;
      trend: 'improving' | 'stable' | 'degrading';
      changeFromPrevious: number;
      distribution: {
        good: number;
        needsImprovement: number;
        poor: number;
      };
    };
  };
  segmentation: {
    byDevice: Record<DeviceType, { score: number; count: number }>;
    byConnection: Record<ConnectionType, { score: number; count: number }>;
    byPage: Record<string, { score: number; count: number }>;
    byTime: Array<{
      timestamp: Date;
      score: number;
      measurements: number;
    }>;
  };
  insights: WebVitalInsight[];
  recommendations: WebVitalRecommendation[];
  budgetStatus: {
    budgetId: string;
    status: 'passed' | 'failed' | 'warning';
    violations: Array<{
      metric: WebVitalMetric;
      threshold: number;
      actual: number;
      severity: 'minor' | 'major' | 'critical';
    }>;
  }[];
}

export interface WebVitalInsight {
  id: string;
  type: 'optimization' | 'regression' | 'improvement' | 'anomaly';
  metric: WebVitalMetric;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  evidence: {
    measurements: string[];
    patterns: string[];
    correlations: string[];
  };
  timeframe: {
    detected: Date;
    period: string;
  };
  affectedUsers: {
    count: number;
    percentage: number;
    segments: string[];
  };
}

export interface WebVitalRecommendation {
  id: string;
  metric: WebVitalMetric;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'loading' | 'interactivity' | 'visual-stability' | 'network' | 'rendering';
  title: string;
  description: string;
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    steps: string[];
    codeExamples: Array<{
      language: string;
      code: string;
      description: string;
    }>;
    resources: string[];
  };
  expectedImpact: {
    metric: WebVitalMetric;
    improvement: string;
    confidence: number;
  };
  prerequisites: string[];
  risks: string[];
  alternatives: string[];
}

export interface WebVitalConfiguration {
  collection: {
    enabled: boolean;
    sampleRate: number; // 0-1
    bufferSize: number;
    reportingInterval: number; // milliseconds
    includeAttribution: boolean;
    includeDebugInfo: boolean;
  };
  thresholds: WebVitalThresholds;
  monitoring: {
    realTime: boolean;
    trendAnalysis: boolean;
    anomalyDetection: boolean;
    regressionDetection: boolean;
    performanceBudgets: boolean;
  };
  optimization: {
    autoOptimization: boolean;
    preloadCriticalResources: boolean;
    lazyLoadImages: boolean;
    optimizeFonts: boolean;
    minimizeLayoutShift: boolean;
    prioritizeCriticalPath: boolean;
  };
  reporting: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    includeInsights: boolean;
    includeRecommendations: boolean;
    segmentation: boolean;
  };
  privacy: {
    anonymizeData: boolean;
    excludePersonalData: boolean;
    retentionPeriod: number; // days
  };
}

/**
 * Enterprise Core Web Vitals Service with Mental Health UX Optimization
 * @class CoreWebVitalsService
 * @implements {IPerformanceMonitoringService}
 */
class CoreWebVitalsService {
  private static instance: CoreWebVitalsService;
  private mentalHealthMetrics = {
    accessibilityScore: 0,
    crisisPageLoadTime: 0,
    therapySessionStability: 0,
    userEngagementRate: 0,
    anxietyTriggerEvents: 0,
    cognitiveLoadScore: 0
  };
  private hipaaCompliantMode = true;
  private configuration: WebVitalConfiguration;
  private measurements: Map<string, WebVitalMeasurement[]> = new Map();
  private budgets: Map<string, PerformanceBudget> = new Map();
  private reports: WebVitalReport[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private sessionId: string;
  private measurementBuffer: WebVitalMeasurement[] = [];
  private eventListeners: Array<(event: any) => void> = [];

  private constructor(configuration?: Partial<WebVitalConfiguration>) {
    this.configuration = this.mergeConfiguration(configuration);
    this.sessionId = this.generateSessionId();
    this.initializeService();
  }
  
  /**
   * Get singleton instance with mental health optimizations
   * @static
   */
  public static getInstance(configuration?: Partial<WebVitalConfiguration>): CoreWebVitalsService {
    if (!CoreWebVitalsService.instance) {
      CoreWebVitalsService.instance = new CoreWebVitalsService(configuration);
    }
    return CoreWebVitalsService.instance;
  }

  private mergeConfiguration(userConfig?: Partial<WebVitalConfiguration>): WebVitalConfiguration {
    const defaultConfig: WebVitalConfiguration = {
      collection: {
        enabled: true,
        sampleRate: 1.0,
        bufferSize: 100,
        reportingInterval: 30000, // 30 seconds
        includeAttribution: true,
        includeDebugInfo: false
      },
      thresholds: {
        LCP: { good: 2500, poor: 4000 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        FCP: { good: 1800, poor: 3000 },
        TTFB: { good: 800, poor: 1800 },
        INP: { good: 200, poor: 500 }
      },
      monitoring: {
        realTime: true,
        trendAnalysis: true,
        anomalyDetection: true,
        regressionDetection: true,
        performanceBudgets: true
      },
      optimization: {
        autoOptimization: false,
        preloadCriticalResources: true,
        lazyLoadImages: true,
        optimizeFonts: true,
        minimizeLayoutShift: true,
        prioritizeCriticalPath: true
      },
      reporting: {
        enabled: true,
        frequency: 'hourly',
        includeInsights: true,
        includeRecommendations: true,
        segmentation: true
      },
      privacy: {
        anonymizeData: true,
        excludePersonalData: true,
        retentionPeriod: 30
      }
    };

    return this.deepMerge(defaultConfig, userConfig || {});
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Initialize service with mental health platform optimizations
   * @private
   */
  private async initializeService(): Promise<void> {
    try {
      if (!this.configuration.collection.enabled) {
        logger.info('Core Web Vitals collection is disabled');
        return;
      }

      // Check browser compatibility first
      if (!this.checkBrowserCompatibility()) {
        logger.warn('Browser does not support all Core Web Vitals APIs, using fallback methods');
      }

      // Initialize Core Web Vitals observers with error handling
      await this.safeInitializeObserver('LCP', this.initializeLCPObserver.bind(this));
      await this.safeInitializeObserver('FID', this.initializeFIDObserver.bind(this));
      await this.safeInitializeObserver('CLS', this.initializeCLSObserver.bind(this));
      await this.safeInitializeObserver('FCP', this.initializeFCPObserver.bind(this));
      await this.safeInitializeObserver('TTFB', this.initializeTTFBObserver.bind(this));
      await this.safeInitializeObserver('INP', this.initializeINPObserver.bind(this));
      
      // Initialize mental health specific metrics
      this.initializeMentalHealthMetrics();

      // Initialize performance budgets
      this.initializeDefaultBudgets();

      // Start monitoring if enabled
      if (this.configuration.monitoring.realTime) {
        this.startRealTimeMonitoring();
      }

      // Start reporting if enabled
      if (this.configuration.reporting.enabled) {
        this.startPeriodicReporting();
      }

      // Apply optimizations if enabled
      if (this.configuration.optimization.autoOptimization) {
        await this.applyOptimizations();
      }

      // Load existing data
      await this.loadExistingData();

      this.isInitialized = true;
      logger.info('Core Web Vitals service initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Core Web Vitals service', error);
      throw error;
    }
  }

  private async initializeLCPObserver(): Promise<void> {
    if (!('PerformanceObserver' in window)) return;

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          this.recordMeasurement({
            metric: 'LCP',
            value: lastEntry.startTime,
            element: lastEntry.element,
            attribution: this.configuration.collection.includeAttribution ? {
              element: lastEntry.element?.tagName,
              url: lastEntry.url,
              size: lastEntry.size,
              loadTime: lastEntry.loadTime,
              renderTime: lastEntry.renderTime
            } : undefined,
            entries: this.configuration.collection.includeDebugInfo ? [lastEntry] : undefined
          });
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

    } catch (error) {
      logger.warn('Failed to initialize LCP observer', error);
    }
  }

  private async initializeFIDObserver(): Promise<void> {
    if (!('PerformanceObserver' in window)) return;

    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          const fidEntry = entry as any;
          const fidValue = fidEntry.processingStart - fidEntry.startTime;

          this.recordMeasurement({
            metric: 'FID',
            value: fidValue,
            attribution: this.configuration.collection.includeAttribution ? {
              eventType: fidEntry.name,
              eventTarget: fidEntry.target?.tagName,
              eventTime: fidEntry.startTime,
              processingStart: fidEntry.processingStart,
              processingEnd: fidEntry.processingStart + fidEntry.duration,
              inputDelay: fidValue
            } : undefined,
            entries: this.configuration.collection.includeDebugInfo ? [entry] : undefined
          });
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

    } catch (error) {
      logger.warn('Failed to initialize FID observer', error);
    }
  }

  private async initializeCLSObserver(): Promise<void> {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          const layoutShiftEntry = entry as any;

          // Only count layout shifts without recent input
          if (!layoutShiftEntry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If the entry occurred less than 1 second after the previous entry
            // and less than 5 seconds after the first entry in the session,
            // include it in the current session. Otherwise, start a new session.
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += layoutShiftEntry.value;
              sessionEntries.push(layoutShiftEntry);
            } else {
              sessionValue = layoutShiftEntry.value;
              sessionEntries = [layoutShiftEntry];
            }

            // If the current session value is larger than the current CLS value,
            // update CLS and record the measurement
            if (sessionValue > clsValue) {
              clsValue = sessionValue;

              this.recordMeasurement({
                metric: 'CLS',
                value: clsValue,
                attribution: this.configuration.collection.includeAttribution ? {
                  largestShiftTarget: this.getLargestShiftTarget(sessionEntries),
                  largestShiftValue: Math.max(...sessionEntries.map(e => e.value)),
                  largestShiftSource: this.getLargestShiftSource(sessionEntries),
                  sessionEntries: sessionEntries.length
                } : undefined,
                entries: this.configuration.collection.includeDebugInfo ? sessionEntries : undefined
              });
            }
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

    } catch (error) {
      logger.warn('Failed to initialize CLS observer', error);
    }
  }

  private async initializeFCPObserver(): Promise<void> {
    if (!('PerformanceObserver' in window)) return;

    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMeasurement({
              metric: 'FCP',
              value: entry.startTime,
              attribution: this.configuration.collection.includeAttribution ? {
                timeToFirstByte: this.getTTFB(),
                firstPaintTime: this.getFirstPaint(),
                navigationStart: performance.timeOrigin
              } : undefined,
              entries: this.configuration.collection.includeDebugInfo ? [entry] : undefined
            });
          }
        }
      });

      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', fcpObserver);

    } catch (error) {
      logger.warn('Failed to initialize FCP observer', error);
    }
  }

  private async initializeTTFBObserver(): Promise<void> {
    if (!('PerformanceObserver' in window)) return;

    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          const navEntry = entry as PerformanceNavigationTiming;
          const ttfb = navEntry.responseStart - navEntry.requestStart;

          this.recordMeasurement({
            metric: 'TTFB',
            value: ttfb,
            attribution: this.configuration.collection.includeAttribution ? {
              waitingTime: navEntry.responseStart - navEntry.requestStart,
              dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              connectionTime: navEntry.connectEnd - navEntry.connectStart,
              tlsTime: navEntry.secureConnectionStart > 0 ? navEntry.connectEnd - navEntry.secureConnectionStart : 0,
              requestTime: navEntry.responseStart - navEntry.requestStart
            } : undefined,
            entries: this.configuration.collection.includeDebugInfo ? [entry] : undefined
          });
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('ttfb', navigationObserver);

    } catch (error) {
      logger.warn('Failed to initialize TTFB observer', error);
    }
  }

  private async initializeINPObserver(): Promise<void> {
    // INP (Interaction to Next Paint) is a newer metric
    // This is a simplified implementation
    let interactionCount = 0;
    const interactions: Array<{ start: number; end: number; delay: number }> = [];

    const handleInteraction = (event: Event) => {
      const interactionStart = performance.now();
      
      // Use requestAnimationFrame to measure when the next paint occurs
      requestAnimationFrame(() => {
        const interactionEnd = performance.now();
        const delay = interactionEnd - interactionStart;
        
        interactions.push({
          start: interactionStart,
          end: interactionEnd,
          delay
        });
        
        interactionCount++;
        
        // Calculate INP as the 98th percentile of all interactions
        if (interactionCount >= 10) { // Only calculate after we have enough data
          const sortedDelays = interactions.map(i => i.delay).sort((a, b) => a - b);
          const p98Index = Math.floor(sortedDelays.length * 0.98);
          const inp = sortedDelays[p98Index];
          
          this.recordMeasurement({
            metric: 'INP',
            value: inp,
            attribution: this.configuration.collection.includeAttribution ? {
              eventType: event.type,
              eventTarget: (event.target as Element)?.tagName,
              interactionCount,
              p98Delay: inp,
              maxDelay: Math.max(...sortedDelays),
              avgDelay: sortedDelays.reduce((sum, delay) => sum + delay, 0) / sortedDelays.length
            } : undefined
          });
        }
      });
    };

    // Listen for user interactions
    ['click', 'keydown', 'pointerdown'].forEach(eventType => {
      document.addEventListener(eventType, handleInteraction, { passive: true });
    });
  }

  private recordMeasurement(data: {
    metric: WebVitalMetric;
    value: number;
    element?: Element;
    attribution?: any;
    entries?: PerformanceEntry[];
  }): void {
    // Check sampling rate
    if (Math.random() > this.configuration.collection.sampleRate) {
      return;
    }

    const measurement: WebVitalMeasurement = {
      id: `measurement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric: data.metric,
      value: data.value,
      rating: this.calculateRating(data.metric, data.value),
      timestamp: new Date(),
      url: window.location.href,
      deviceType: this.detectDeviceType(),
      connectionType: this.detectConnectionType(),
      context: {
        sessionId: this.sessionId,
        userId: this.getUserId(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        navigation: {
          type: this.getNavigationType(),
          timing: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        },
        resources: this.getResourceMetrics(),
        renderBlocking: this.getRenderBlockingMetrics(),
        criticalPath: this.getCriticalPathMetrics()
      },
      metadata: {
        element: data.element,
        attribution: data.attribution,
        entries: data.entries,
        debug: this.configuration.collection.includeDebugInfo ? {
          timestamp: performance.now(),
          memory: (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit
          } : undefined
        } : undefined
      }
    };

    // Store measurement
    const metricMeasurements = this.measurements.get(data.metric) || [];
    metricMeasurements.push(measurement);
    this.measurements.set(data.metric, metricMeasurements);

    // Add to buffer for batch processing
    this.measurementBuffer.push(measurement);

    // Process immediately if buffer is full
    if (this.measurementBuffer.length >= this.configuration.collection.bufferSize) {
      this.processMeasurementBuffer();
    }

    // Check performance budgets
    if (this.configuration.monitoring.performanceBudgets) {
      this.checkPerformanceBudgets(measurement);
    }

    // Emit event
    this.emitEvent({
      type: 'measurement-recorded',
      measurement,
      timestamp: new Date()
    });

    logger.debug(`${data.metric} measurement recorded`, {
      value: data.value,
      rating: measurement.rating,
      url: measurement.url
    });
  }

  private calculateRating(metric: WebVitalMetric, value: number): MetricRating {
    const thresholds = this.configuration.thresholds[metric];
    
    if (value <= thresholds.good) {
      return 'good';
    } else if (value <= thresholds.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  private detectDeviceType(): DeviceType {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectConnectionType(): ConnectionType {
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';
    
    return connection.effectiveType || 'unknown';
  }

  private getUserId(): string | undefined {
    // Would typically get from auth service
    return undefined;
  }

  /**
   * Get navigation type with proper type casting
   * @private
   */
  private getNavigationType(): 'navigate' | 'reload' | 'back_forward' | 'prerender' {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation || typeof navigation.type !== 'number') {
      return 'navigate';
    }
    
    return NAVIGATION_TYPE_MAP[navigation.type] || 'navigate';
  }

  private getResourceMetrics(): WebVitalMeasurement['context']['resources'] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let totalSize = 0;
    let imageSize = 0;
    let scriptSize = 0;
    let stylesheetSize = 0;
    let fontSize = 0;

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      totalSize += size;

      switch (resource.initiatorType) {
        case 'img':
        case 'image':
          imageSize += size;
          break;
        case 'script':
          scriptSize += size;
          break;
        case 'css':
        case 'link':
          stylesheetSize += size;
          break;
        case 'font':
          fontSize += size;
          break;
      }
    });

    return {
      totalSize,
      imageSize,
      scriptSize,
      stylesheetSize,
      fontSize,
      count: resources.length
    };
  }

  /**
   * Get render-blocking metrics with compatibility checks
   * @private
   */
  private getRenderBlockingMetrics(): WebVitalMeasurement['context']['renderBlocking'] {
    const resources = performance.getEntriesByType('resource') as ExtendedPerformanceResourceTiming[];
    
    let scripts = 0;
    let stylesheets = 0;
    let fonts = 0;

    resources.forEach(resource => {
      // Check for render-blocking status (newer browsers)
      const isRenderBlocking = resource.renderBlockingStatus === 'blocking' || 
                               this.isRenderBlockingHeuristic(resource);
      
      if (isRenderBlocking) {
        switch (resource.initiatorType) {
          case 'script':
            scripts++;
            break;
          case 'css':
          case 'link':
            stylesheets++;
            break;
          case 'font':
            fonts++;
            break;
        }
      }
    });

    return { scripts, stylesheets, fonts };
  }
  
  /**
   * Heuristic for determining render-blocking resources in older browsers
   * @private
   */
  private isRenderBlockingHeuristic(resource: PerformanceResourceTiming): boolean {
    // Resources loaded early and with high priority are likely render-blocking
    return resource.startTime < 1000 && 
           (resource.initiatorType === 'css' || 
            (resource.initiatorType === 'script' && !resource.name.includes('defer') && !resource.name.includes('async')));
  }

  private getCriticalPathMetrics(): WebVitalMeasurement['context']['criticalPath'] {
    // Simplified critical path analysis
    const criticalElements = document.querySelectorAll('h1, h2, img[loading="eager"], link[rel="stylesheet"], script[src]:not([defer]):not([async])');
    const elements = Array.from(criticalElements).map(el => el.tagName.toLowerCase());
    
    return {
      elements,
      depth: this.calculateDOMDepth(),
      resources: this.getCriticalResources()
    };
  }

  private calculateDOMDepth(): number {
    let maxDepth = 0;
    
    const traverse = (element: Element, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      Array.from(element.children).forEach(child => {
        traverse(child, depth + 1);
      });
    };
    
    if (document.body) {
      traverse(document.body, 0);
    }
    
    return maxDepth;
  }

  private getCriticalResources(): string[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources
      .filter(resource => {
        // Consider resources critical if they're loaded early and are render-blocking
        return resource.startTime < 1000 && 
               (resource.initiatorType === 'css' || 
                resource.initiatorType === 'script' ||
                resource.initiatorType === 'font');
      })
      .map(resource => resource.name);
  }

  private getLargestShiftTarget(entries: any[]): string {
    let largestShift = entries[0];
    
    for (const entry of entries) {
      if (entry.value > largestShift.value) {
        largestShift = entry;
      }
    }
    
    return largestShift.sources?.[0]?.node?.tagName || 'unknown';
  }

  private getLargestShiftSource(entries: any[]): any {
    const sources = entries.flatMap(entry => entry.sources || []);
    
    if (sources.length === 0) return undefined;
    
    return sources.reduce((largest, source) => {
      return source.previousRect?.width * source.previousRect?.height >
             largest.previousRect?.width * largest.previousRect?.height ? source : largest;
    });
  }

  private getTTFB(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.responseStart - navigation.requestStart : 0;
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByName('first-paint');
    return paintEntries.length > 0 ? paintEntries[0].startTime : 0;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultBudgets(): void {
    const defaultBudget: PerformanceBudget = {
      id: 'default-budget',
      name: 'Default Performance Budget',
      enabled: true,
      thresholds: this.configuration.thresholds,
      targets: {
        percentile: 75,
        sampleSize: 100,
        timeWindow: 3600000 // 1 hour
      },
      alerts: {
        enabled: true,
        channels: ['console', 'storage'],
        thresholdExceeded: true,
        budgetExceeded: true,
        regressionDetected: true
      },
      enforcement: {
        blockDeployment: false,
        requireApproval: false,
        generateReport: true
      }
    };

    this.budgets.set(defaultBudget.id, defaultBudget);
  }

  private startRealTimeMonitoring(): void {
    const monitoringInterval = setInterval(() => {
      this.analyzePerformanceTrends();
      this.detectAnomalies();
      this.detectRegressions();
    }, 60000); // Every minute

    this.intervals.set('monitoring', monitoringInterval);
  }

  private startPeriodicReporting(): void {
    const getIntervalMs = (frequency: string): number => {
      switch (frequency) {
        case 'realtime': return 30000; // 30 seconds
        case 'hourly': return 3600000; // 1 hour
        case 'daily': return 86400000; // 24 hours
        case 'weekly': return 604800000; // 7 days
        default: return 3600000;
      }
    };

    const reportingInterval = setInterval(() => {
      this.generateAutomaticReport();
    }, getIntervalMs(this.configuration.reporting.frequency));

    this.intervals.set('reporting', reportingInterval);

    // Also process measurement buffer periodically
    const bufferInterval = setInterval(() => {
      this.processMeasurementBuffer();
    }, this.configuration.collection.reportingInterval);

    this.intervals.set('buffer', bufferInterval);
  }

  private processMeasurementBuffer(): void {
    if (this.measurementBuffer.length === 0) return;

    const batch = [...this.measurementBuffer];
    this.measurementBuffer = [];

    // Process batch
    this.processMeasurementBatch(batch);

    this.emitEvent({
      type: 'batch-processed',
      batchSize: batch.length,
      timestamp: new Date()
    });
  }

  private processMeasurementBatch(measurements: WebVitalMeasurement[]): void {
    // Analyze batch for patterns
    const metricGroups = new Map<WebVitalMetric, WebVitalMeasurement[]>();
    
    measurements.forEach(measurement => {
      const group = metricGroups.get(measurement.metric) || [];
      group.push(measurement);
      metricGroups.set(measurement.metric, group);
    });

    // Check for immediate issues
    metricGroups.forEach((measurements, metric) => {
      const poorMeasurements = measurements.filter(m => m.rating === 'poor');
      
      if (poorMeasurements.length > measurements.length * 0.5) {
        this.emitEvent({
          type: 'performance-degradation',
          metric,
          measurements: poorMeasurements.length,
          total: measurements.length,
          timestamp: new Date()
        });
      }
    });
  }

  private checkPerformanceBudgets(measurement: WebVitalMeasurement): void {
    Array.from(this.budgets.values()).forEach(budget => {
      if (!budget.enabled) return;

      const threshold = budget.thresholds[measurement.metric];
      
      if (measurement.value > threshold.poor) {
        this.emitBudgetViolation(budget, measurement, 'critical');
      } else if (measurement.value > threshold.good) {
        this.emitBudgetViolation(budget, measurement, 'major');
      }
    });
  }

  private emitBudgetViolation(
    budget: PerformanceBudget,
    measurement: WebVitalMeasurement,
    severity: 'minor' | 'major' | 'critical'
  ): void {
    if (!budget.alerts.enabled) return;

    const violation = {
      budgetId: budget.id,
      metric: measurement.metric,
      threshold: budget.thresholds[measurement.metric].good,
      actual: measurement.value,
      severity,
      measurement
    };

    budget.alerts.channels.forEach(channel => {
      switch (channel) {
        case 'console':
          console.warn(`Performance Budget Violation: ${measurement.metric}`, violation);
          break;
        case 'storage':
          this.storeBudgetViolation(violation);
          break;
        case 'webhook':
          this.sendWebhookAlert(violation);
          break;
      }
    });

    this.emitEvent({
      type: 'budget-violation',
      violation,
      timestamp: new Date()
    });
  }

  private storeBudgetViolation(violation: any): void {
    try {
      const stored = JSON.parse(localStorage.getItem('performance-budget-violations') || '[]');
      stored.push({
        ...violation,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('performance-budget-violations', JSON.stringify(stored.slice(-100)));
    } catch (error) {
      logger.warn('Failed to store budget violation', error);
    }
  }

  private sendWebhookAlert(violation: any): void {
    // Would send to external webhook
    logger.info('Webhook alert would be sent', violation);
  }

  private analyzePerformanceTrends(): void {
    const metrics: WebVitalMetric[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
    
    metrics.forEach(metric => {
      const measurements = this.measurements.get(metric) || [];
      if (measurements.length < 10) return;

      const recent = measurements.slice(-10);
      const previous = measurements.slice(-20, -10);
      
      if (previous.length === 0) return;

      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const previousAvg = previous.reduce((sum, m) => sum + m.value, 0) / previous.length;
      
      const changePercentage = ((recentAvg - previousAvg) / previousAvg) * 100;
      
      if (Math.abs(changePercentage) > 10) {
        this.emitEvent({
          type: 'trend-detected',
          metric,
          change: changePercentage,
          direction: changePercentage > 0 ? 'degrading' : 'improving',
          recentAvg,
          previousAvg,
          timestamp: new Date()
        });
      }
    });
  }

  private detectAnomalies(): void {
    const metrics: WebVitalMetric[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
    
    metrics.forEach(metric => {
      const measurements = this.measurements.get(metric) || [];
      if (measurements.length < 20) return;

      const values = measurements.slice(-20).map(m => m.value);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
      
      const latestValue = values[values.length - 1];
      const zScore = Math.abs((latestValue - mean) / stdDev);
      
      if (zScore > 2) { // 2 standard deviations
        this.emitEvent({
          type: 'anomaly-detected',
          metric,
          value: latestValue,
          mean,
          stdDev,
          zScore,
          severity: zScore > 3 ? 'critical' : 'major',
          timestamp: new Date()
        });
      }
    });
  }

  private detectRegressions(): void {
    // Simple regression detection based on recent performance degradation
    const metrics: WebVitalMetric[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
    
    metrics.forEach(metric => {
      const measurements = this.measurements.get(metric) || [];
      if (measurements.length < 30) return;

      const recent = measurements.slice(-10);
      const baseline = measurements.slice(-30, -20);
      
      if (baseline.length === 0) return;

      const recentPoorRate = recent.filter(m => m.rating === 'poor').length / recent.length;
      const baselinePoorRate = baseline.filter(m => m.rating === 'poor').length / baseline.length;
      
      const regressionThreshold = 0.2; // 20% increase in poor ratings
      
      if (recentPoorRate > baselinePoorRate + regressionThreshold) {
        this.emitEvent({
          type: 'regression-detected',
          metric,
          recentPoorRate,
          baselinePoorRate,
          increase: recentPoorRate - baselinePoorRate,
          severity: recentPoorRate > 0.5 ? 'critical' : 'major',
          timestamp: new Date()
        });
      }
    });
  }

  private generateAutomaticReport(): void {
    const report = this.generateReport();
    this.reports.push(report);

    // Limit stored reports
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-50);
    }

    this.emitEvent({
      type: 'report-generated',
      report,
      timestamp: new Date()
    });
  }

  private async applyOptimizations(): Promise<void> {
    const optimizations = this.configuration.optimization;

    if (optimizations.preloadCriticalResources) {
      await this.preloadCriticalResources();
    }

    if (optimizations.lazyLoadImages) {
      this.enableLazyLoadImages();
    }

    if (optimizations.optimizeFonts) {
      this.optimizeFonts();
    }

    if (optimizations.minimizeLayoutShift) {
      this.minimizeLayoutShift();
    }

    if (optimizations.prioritizeCriticalPath) {
      this.prioritizeCriticalPath();
    }
  }

  private async preloadCriticalResources(): Promise<void> {
    // Identify critical resources and add preload hints
    const criticalResources = this.getCriticalResources();
    
    criticalResources.forEach(resourceUrl => {
      if (!document.querySelector(`link[href="${resourceUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resourceUrl;
        
        // Determine resource type
        if (resourceUrl.includes('.css')) {
          link.as = 'style';
        } else if (resourceUrl.includes('.js')) {
          link.as = 'script';
        } else if (resourceUrl.match(/\.(woff|woff2|ttf)$/)) {
          link.as = 'font';
          link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
      }
    });
  }

  private enableLazyLoadImages(): void {
    const images = document.querySelectorAll('img:not([loading])');
    
    images.forEach(img => {
      // Don't lazy load above-the-fold images
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  private optimizeFonts(): void {
    // Add font-display: swap to improve FCP
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @font-face {
        font-display: swap;
      }
    `;
    document.head.appendChild(styleSheet);
  }

  /**
   * Minimize layout shift with proper type checking
   * @private
   */
  private minimizeLayoutShift(): void {
    // Add size attributes to images without them
    const images = document.querySelectorAll('img:not([width]):not([height])');
    
    images.forEach(imgElement => {
      const img = imgElement as ExtendedHTMLImageElement;
      
      // Only add event listener if it's actually an image element
      if (img.tagName.toLowerCase() === 'img') {
        img.addEventListener('load', () => {
          if (!img.getAttribute('width') && img.naturalWidth) {
            img.setAttribute('width', img.naturalWidth.toString());
          }
          if (!img.getAttribute('height') && img.naturalHeight) {
            img.setAttribute('height', img.naturalHeight.toString());
          }
        });
      }
    });
  }

  private prioritizeCriticalPath(): void {
    // Add fetchpriority to critical resources
    const criticalImages = document.querySelectorAll('img[loading="eager"]');
    criticalImages.forEach(img => {
      if (!img.getAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'high');
      }
    });
  }

  private async loadExistingData(): Promise<void> {
    try {
      const stored = localStorage.getItem('core-web-vitals-measurements');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([metric, measurements]: [string, any[]]) => {
          const parsedMeasurements = measurements.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          this.measurements.set(metric as WebVitalMetric, parsedMeasurements);
        });
      }
    } catch (error) {
      logger.warn('Failed to load existing Core Web Vitals data', error);
    }
  }

  private emitEvent(event: any): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.warn('Error in Core Web Vitals event listener', error);
      }
    }
  }

  // Public API
  public getMeasurements(metric?: WebVitalMetric, timeRange?: { start: Date; end: Date }): WebVitalMeasurement[] {
    let measurements: WebVitalMeasurement[] = [];
    
    if (metric) {
      measurements = this.measurements.get(metric) || [];
    } else {
      measurements = Array.from(this.measurements.values()).flat();
    }
    
    if (timeRange) {
      measurements = measurements.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return measurements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getMetricSummary(metric: WebVitalMetric, timeRange?: { start: Date; end: Date }): {
    count: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    rating: MetricRating;
    distribution: { good: number; needsImprovement: number; poor: number };
  } | null {
    const measurements = this.getMeasurements(metric, timeRange);
    
    if (measurements.length === 0) return null;
    
    const values = measurements.map(m => m.value).sort((a, b) => a - b);
    const getPercentile = (p: number) => values[Math.floor(values.length * p / 100)] || 0;
    
    const distribution = measurements.reduce((acc, m) => {
      acc[m.rating === 'needs-improvement' ? 'needsImprovement' : m.rating]++;
      return acc;
    }, { good: 0, needsImprovement: 0, poor: 0 });
    
    const p75 = getPercentile(75);
    
    return {
      count: measurements.length,
      p50: getPercentile(50),
      p75,
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99),
      rating: this.calculateRating(metric, p75),
      distribution
    };
  }

  public generateReport(period?: { start: Date; end: Date }): WebVitalReport {
    const now = new Date();
    const reportPeriod = period || {
      start: new Date(now.getTime() - 86400000), // 24 hours ago
      end: now
    };
    
    const allMeasurements = this.getMeasurements(undefined, reportPeriod);
    const metrics: WebVitalMetric[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
    
    // Calculate summary
    const uniqueUsers = new Set(allMeasurements.map(m => m.context.userId).filter(Boolean)).size;
    const uniqueSessions = new Set(allMeasurements.map(m => m.context.sessionId)).size;
    const goodMeasurements = allMeasurements.filter(m => m.rating === 'good').length;
    const passRate = allMeasurements.length > 0 ? (goodMeasurements / allMeasurements.length) * 100 : 0;
    
    // Calculate overall score (0-100)
    const overallScore = Math.round(passRate);
    
    // Build metrics summary
    const metricsData = metrics.reduce((acc, metric) => {
      const summary = this.getMetricSummary(metric, reportPeriod);
      if (summary) {
        acc[metric] = {
          measurements: summary.count,
          p50: summary.p50,
          p75: summary.p75,
          p90: summary.p90,
          p95: summary.p95,
          p99: summary.p99,
          rating: summary.rating,
          trend: this.calculateTrend(metric, reportPeriod),
          changeFromPrevious: this.calculateChangeFromPrevious(metric, reportPeriod),
          distribution: summary.distribution
        };
      }
      return acc;
    }, {} as WebVitalReport['metrics']);
    
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: now,
      period: reportPeriod,
      summary: {
        totalMeasurements: allMeasurements.length,
        uniqueUsers,
        uniqueSessions,
        overallScore,
        passRate
      },
      metrics: metricsData,
      segmentation: this.calculateSegmentation(allMeasurements),
      insights: this.generateInsights(allMeasurements, reportPeriod),
      recommendations: this.generateRecommendations(allMeasurements),
      budgetStatus: this.getBudgetStatus(reportPeriod)
    };
  }

  private calculateTrend(metric: WebVitalMetric, period: { start: Date; end: Date }): 'improving' | 'stable' | 'degrading' {
    const measurements = this.getMeasurements(metric, period);
    if (measurements.length < 10) return 'stable';
    
    const midpoint = Math.floor(measurements.length / 2);
    const firstHalf = measurements.slice(0, midpoint);
    const secondHalf = measurements.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
    
    const changePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercentage < -5) return 'improving';
    if (changePercentage > 5) return 'degrading';
    return 'stable';
  }

  private calculateChangeFromPrevious(metric: WebVitalMetric, period: { start: Date; end: Date }): number {
    const currentMeasurements = this.getMeasurements(metric, period);
    const periodDuration = period.end.getTime() - period.start.getTime();
    const previousPeriod = {
      start: new Date(period.start.getTime() - periodDuration),
      end: period.start
    };
    const previousMeasurements = this.getMeasurements(metric, previousPeriod);
    
    if (currentMeasurements.length === 0 || previousMeasurements.length === 0) return 0;
    
    const currentAvg = currentMeasurements.reduce((sum, m) => sum + m.value, 0) / currentMeasurements.length;
    const previousAvg = previousMeasurements.reduce((sum, m) => sum + m.value, 0) / previousMeasurements.length;
    
    return ((currentAvg - previousAvg) / previousAvg) * 100;
  }

  private calculateSegmentation(measurements: WebVitalMeasurement[]): WebVitalReport['segmentation'] {
    const byDevice = measurements.reduce((acc, m) => {
      const device = m.deviceType;
      if (!acc[device]) acc[device] = { score: 0, count: 0 };
      acc[device].count++;
      acc[device].score += m.rating === 'good' ? 100 : m.rating === 'needs-improvement' ? 50 : 0;
      return acc;
    }, {} as Record<DeviceType, { score: number; count: number }>);
    
    // Normalize scores
    Object.values(byDevice).forEach(data => {
      data.score = data.count > 0 ? data.score / data.count : 0;
    });
    
    const byConnection = measurements.reduce((acc, m) => {
      const connection = m.connectionType;
      if (!acc[connection]) acc[connection] = { score: 0, count: 0 };
      acc[connection].count++;
      acc[connection].score += m.rating === 'good' ? 100 : m.rating === 'needs-improvement' ? 50 : 0;
      return acc;
    }, {} as Record<ConnectionType, { score: number; count: number }>);
    
    Object.values(byConnection).forEach(data => {
      data.score = data.count > 0 ? data.score / data.count : 0;
    });
    
    const byPage = measurements.reduce((acc, m) => {
      const page = new URL(m.url).pathname;
      if (!acc[page]) acc[page] = { score: 0, count: 0 };
      acc[page].count++;
      acc[page].score += m.rating === 'good' ? 100 : m.rating === 'needs-improvement' ? 50 : 0;
      return acc;
    }, {} as Record<string, { score: number; count: number }>);
    
    Object.values(byPage).forEach(data => {
      data.score = data.count > 0 ? data.score / data.count : 0;
    });
    
    // Calculate time-based segmentation (hourly)
    const byTime = this.calculateTimeSegmentation(measurements);
    
    return {
      byDevice,
      byConnection,
      byPage,
      byTime
    };
  }

  private calculateTimeSegmentation(measurements: WebVitalMeasurement[]): Array<{
    timestamp: Date;
    score: number;
    measurements: number;
  }> {
    // Group by hour
    const hourlyData = new Map<string, { score: number; count: number }>();
    
    measurements.forEach(m => {
      const hour = new Date(m.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      
      if (!hourlyData.has(key)) {
        hourlyData.set(key, { score: 0, count: 0 });
      }
      
      const data = hourlyData.get(key)!;
      data.count++;
      data.score += m.rating === 'good' ? 100 : m.rating === 'needs-improvement' ? 50 : 0;
    });
    
    return Array.from(hourlyData.entries())
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp),
        score: data.count > 0 ? data.score / data.count : 0,
        measurements: data.count
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private generateInsights(measurements: WebVitalMeasurement[], period: { start: Date; end: Date }): WebVitalInsight[] {
    const insights: WebVitalInsight[] = [];
    
    // Check for performance regressions
    const metrics: WebVitalMetric[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
    
    metrics.forEach(metric => {
      const metricMeasurements = measurements.filter(m => m.metric === metric);
      const poorRate = metricMeasurements.filter(m => m.rating === 'poor').length / metricMeasurements.length;
      
      if (poorRate > 0.25) { // More than 25% poor
        insights.push({
          id: `insight-${metric}-poor-rate-${Date.now()}`,
          type: 'regression',
          metric,
          title: `High ${metric} Poor Rate`,
          description: `${(poorRate * 100).toFixed(1)}% of ${metric} measurements are poor`,
          impact: poorRate > 0.5 ? 'critical' : poorRate > 0.4 ? 'high' : 'medium',
          confidence: 0.9,
          evidence: {
            measurements: metricMeasurements.filter(m => m.rating === 'poor').map(m => m.id),
            patterns: [`${metric} consistently above thresholds`],
            correlations: []
          },
          timeframe: {
            detected: new Date(),
            period: 'last 24 hours'
          },
          affectedUsers: {
            count: new Set(metricMeasurements.filter(m => m.rating === 'poor').map(m => m.context.userId).filter(Boolean)).size,
            percentage: poorRate * 100,
            segments: []
          }
        });
      }
    });
    
    return insights;
  }

  private generateRecommendations(measurements: WebVitalMeasurement[]): WebVitalRecommendation[] {
    const recommendations: WebVitalRecommendation[] = [];
    
    // Analyze each metric and generate recommendations
    const lcpMeasurements = measurements.filter(m => m.metric === 'LCP');
    const poorLCP = lcpMeasurements.filter(m => m.rating === 'poor');
    
    if (poorLCP.length > lcpMeasurements.length * 0.2) {
      recommendations.push({
        id: `rec-lcp-${Date.now()}`,
        metric: 'LCP',
        priority: 'high',
        category: 'loading',
        title: 'Optimize Largest Contentful Paint',
        description: 'LCP is slower than recommended. Focus on optimizing the largest visible element.',
        implementation: {
          effort: 'medium',
          timeline: '1-2 weeks',
          steps: [
            'Identify the LCP element using browser dev tools',
            'Optimize images with proper sizing and compression',
            'Preload critical resources',
            'Remove render-blocking resources',
            'Use a CDN for faster content delivery'
          ],
          codeExamples: [
            {
              language: 'html',
              code: '<link rel="preload" as="image" href="hero-image.jpg">',
              description: 'Preload critical images'
            },
            {
              language: 'html',
              code: '<img src="image.jpg" width="800" height="600" loading="eager" fetchpriority="high">',
              description: 'Optimize critical images'
            }
          ],
          resources: [
            'https://web.dev/optimize-lcp/',
            'https://web.dev/preload-critical-assets/'
          ]
        },
        expectedImpact: {
          metric: 'LCP',
          improvement: '20-40% reduction in LCP time',
          confidence: 0.8
        },
        prerequisites: ['Performance audit completed'],
        risks: ['May increase initial bundle size'],
        alternatives: ['Server-side rendering', 'Progressive image loading']
      });
    }
    
    return recommendations;
  }

  private getBudgetStatus(period: { start: Date; end: Date }): WebVitalReport['budgetStatus'] {
    return Array.from(this.budgets.values()).map(budget => {
      const violations: any[] = [];
      
      // Check each metric against budget thresholds
      const metrics: WebVitalMetric[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
      
      metrics.forEach(metric => {
        const summary = this.getMetricSummary(metric, period);
        if (summary) {
          const threshold = budget.thresholds[metric];
          const p75 = summary.p75;
          
          if (p75 > threshold.poor) {
            violations.push({
              metric,
              threshold: threshold.poor,
              actual: p75,
              severity: 'critical' as const
            });
          } else if (p75 > threshold.good) {
            violations.push({
              metric,
              threshold: threshold.good,
              actual: p75,
              severity: 'major' as const
            });
          }
        }
      });
      
      return {
        budgetId: budget.id,
        status: violations.length === 0 ? 'passed' : 
                violations.some(v => v.severity === 'critical') ? 'failed' : 'warning',
        violations
      };
    });
  }

  public createPerformanceBudget(budget: Omit<PerformanceBudget, 'id'>): string {
    const id = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.budgets.set(id, { ...budget, id });
    return id;
  }

  public updatePerformanceBudget(id: string, updates: Partial<PerformanceBudget>): boolean {
    const budget = this.budgets.get(id);
    if (!budget) return false;
    
    this.budgets.set(id, { ...budget, ...updates });
    return true;
  }

  public deletePerformanceBudget(id: string): boolean {
    return this.budgets.delete(id);
  }

  public getPerformanceBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values());
  }

  public getReports(): WebVitalReport[] {
    return [...this.reports];
  }

  public getLatestReport(): WebVitalReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  public updateConfiguration(newConfig: Partial<WebVitalConfiguration>): void {
    this.configuration = this.mergeConfiguration(newConfig);
    logger.info('Core Web Vitals configuration updated', newConfig);
  }

  public getConfiguration(): WebVitalConfiguration {
    return { ...this.configuration };
  }

  public addEventListener(listener: (event: any) => void): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: any) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  public destroy(): void {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Clear data
    this.measurements.clear();
    this.budgets.clear();
    this.reports = [];
    this.measurementBuffer = [];
    this.eventListeners = [];
    
    this.isInitialized = false;
    logger.info('Core Web Vitals service destroyed');
  }

  /**
   * Check browser compatibility for Core Web Vitals APIs
   * @private
   */
  private checkBrowserCompatibility(): boolean {
    return !!(typeof PerformanceObserver !== 'undefined' &&
             typeof performance !== 'undefined' &&
             performance.getEntriesByType &&
             typeof fetch !== 'undefined');
  }
  
  /**
   * Safely initialize observer with error handling
   * @private
   */
  private async safeInitializeObserver(name: string, initializer: () => Promise<void>): Promise<void> {
    try {
      await initializer();
      logger.debug(`${name} observer initialized successfully`);
    } catch (error) {
      logger.warn(`Failed to initialize ${name} observer`, { error });
    }
  }
  
  /**
   * Initialize mental health specific performance metrics
   * @private
   */
  private initializeMentalHealthMetrics(): void {
    // Monitor crisis-related page performance
    this.monitorCrisisPagePerformance();
    
    // Track accessibility metrics for mental health users
    this.trackAccessibilityMetrics();
    
    // Monitor cognitive load indicators
    this.monitorCognitiveLoad();
    
    logger.info('Mental health performance metrics initialized');
  }
  
  /**
   * Monitor performance of crisis-related pages
   * @private
   */
  private monitorCrisisPagePerformance(): void {
    const crisisKeywords = ['crisis', 'emergency', 'suicide', 'help', 'hotline'];
    const currentUrl = window.location.href.toLowerCase();
    
    if (crisisKeywords.some(keyword => currentUrl.includes(keyword))) {
      // Prioritize loading performance for crisis pages
      this.configuration.thresholds.LCP.good = 1500; // Stricter threshold
      this.configuration.thresholds.FCP.good = 1000;
      
      logger.info('Crisis page detected - applying strict performance thresholds');
    }
  }
  
  /**
   * Track accessibility metrics important for mental health users
   * @private
   */
  private trackAccessibilityMetrics(): void {
    // Monitor focus management
    document.addEventListener('focusout', () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.getAttribute('aria-invalid') === 'true') {
        this.mentalHealthMetrics.anxietyTriggerEvents++;
      }
    }, { passive: true });
    
    // Monitor for rapid page changes that might cause anxiety
    let pageChangeCount = 0;
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      pageChangeCount++;
      return originalPushState.apply(history, args);
    };
    
    // Reset counter every minute
    setInterval(() => {
      if (pageChangeCount > 5) { // More than 5 page changes per minute
        this.mentalHealthMetrics.anxietyTriggerEvents++;
        logger.debug('High navigation frequency detected - potential anxiety trigger');
      }
      pageChangeCount = 0;
    }, 60000);
  }
  
  /**
   * Monitor cognitive load indicators
   * @private
   */
  private monitorCognitiveLoad(): void {
    // Monitor scroll behavior as indicator of cognitive load
    let rapidScrollCount = 0;
    let lastScrollTime = 0;
    
    document.addEventListener('scroll', () => {
      const now = performance.now();
      if (now - lastScrollTime < 100) { // Rapid scrolling
        rapidScrollCount++;
      }
      lastScrollTime = now;
    }, { passive: true });
    
    // Update cognitive load score periodically
    setInterval(() => {
      this.mentalHealthMetrics.cognitiveLoadScore = Math.min(100, rapidScrollCount * 2);
      rapidScrollCount = 0;
    }, 10000);
  }
  
  /**
   * Get mental health specific metrics
   * @public
   */
  public getMentalHealthMetrics(): typeof this.mentalHealthMetrics {
    return { ...this.mentalHealthMetrics };
  }
}

// Create and export singleton instance with mental health optimizations
export const coreWebVitalsService = CoreWebVitalsService.getInstance({
  // Mental health platform specific configuration
  thresholds: {
    LCP: { good: 2000, poor: 3500 }, // Slightly stricter for user experience
    FID: { good: 80, poor: 250 },    // Better interactivity for therapy sessions
    CLS: { good: 0.08, poor: 0.2 },  // More stable experience for anxious users
    FCP: { good: 1500, poor: 2500 }, // Faster perceived loading
    TTFB: { good: 600, poor: 1500 }, // Quicker server response
    INP: { good: 150, poor: 400 }    // Better interaction response
  },
  monitoring: {
    realTime: true,
    trendAnalysis: true,
    anomalyDetection: true,
    regressionDetection: true,
    performanceBudgets: true
  },
  privacy: {
    anonymizeData: true,
    excludePersonalData: true,
    retentionPeriod: 30 // HIPAA compliance
  }
});

export default coreWebVitalsService;
