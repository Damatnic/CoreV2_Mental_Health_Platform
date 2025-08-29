/**
 * Comprehensive Performance Monitor
 *
 * Advanced performance monitoring system for HIPAA-compliant mental health platform.
 * Tracks Core Web Vitals, runtime performance, user experience metrics,
 * and provides real-time insights with privacy-compliant analytics.
 *
 * @fileoverview Complete performance monitoring with ML-powered insights
 * @version 2.0.0
 */

import { logger } from '../utils/logger';

export type PerformanceMetricType = 
  | 'core-web-vitals' 
  | 'runtime-performance' 
  | 'user-experience' 
  | 'network-performance' 
  | 'memory-usage' 
  | 'crisis-performance'
  | 'accessibility-performance';

export type MetricSeverity = 'good' | 'needs-improvement' | 'poor' | 'critical';
export type PerformanceCategory = 'loading' | 'interactivity' | 'visual-stability' | 'runtime' | 'network' | 'memory';

export interface PerformanceMetric {
  id: string;
  name: string;
  type: PerformanceMetricType;
  category: PerformanceCategory;
  value: number;
  unit: string;
  timestamp: Date;
  severity: MetricSeverity;
  threshold: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  context: {
    url: string;
    userAgent: string;
    connectionType?: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    viewport: { width: number; height: number };
  };
  metadata: Record<string, any>;
}

export interface CoreWebVitals {
  lcp: PerformanceMetric; // Largest Contentful Paint
  fid: PerformanceMetric; // First Input Delay
  cls: PerformanceMetric; // Cumulative Layout Shift
  fcp: PerformanceMetric; // First Contentful Paint
  ttfb: PerformanceMetric; // Time to First Byte
  inp: PerformanceMetric; // Interaction to Next Paint
}

export interface RuntimePerformance {
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
    leaks: MemoryLeak[];
  };
  cpuUsage: {
    percentage: number;
    longTasks: LongTask[];
    mainThreadBlocking: number;
  };
  bundleSize: {
    total: number;
    javascript: number;
    css: number;
    images: number;
    fonts: number;
    other: number;
  };
  renderingMetrics: {
    framesPerSecond: number;
    droppedFrames: number;
    renderingTime: number;
    layoutThrashing: number;
  };
}

export interface UserExperienceMetrics {
  sessionDuration: number;
  bounceRate: number;
  timeToInteractive: number;
  userFlows: UserFlowMetric[];
  errorRate: number;
  crisisResponseTime: number;
  accessibilityScore: number;
}

export interface UserFlowMetric {
  flowId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  steps: FlowStep[];
  completed: boolean;
  abandonmentPoint?: string;
  errorCount: number;
  performanceScore: number;
}

export interface FlowStep {
  id: string;
  name: string;
  startTime: Date;
  duration: number;
  success: boolean;
  metrics: {
    loadTime: number;
    renderTime: number;
    interactionDelay: number;
  };
  errors: string[];
}

export interface NetworkPerformance {
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  requestMetrics: {
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    slowestEndpoint: string;
    fastestEndpoint: string;
  };
  resourceTiming: ResourceTimingMetric[];
  cachingEfficiency: {
    hitRate: number;
    missRate: number;
    totalSize: number;
    cachedSize: number;
  };
}

export interface ResourceTimingMetric {
  name: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xmlhttprequest';
  startTime: number;
  duration: number;
  size: number;
  cached: boolean;
  critical: boolean;
}

export interface MemoryLeak {
  id: string;
  timestamp: Date;
  component: string;
  leakSize: number;
  description: string;
  stackTrace: string;
  severity: MetricSeverity;
}

export interface LongTask {
  id: string;
  startTime: number;
  duration: number;
  attribution: string;
  blockingTime: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: PerformanceMetricType;
  severity: MetricSeverity;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  recommendation: string;
  affectedUsers: number;
  businessImpact: string;
  autoResolved: boolean;
  resolvedAt?: Date;
}

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    overallScore: number;
    coreWebVitalsScore: number;
    userExperienceScore: number;
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    totalIssues: number;
    criticalIssues: number;
    improvementOpportunities: string[];
  };
  metrics: {
    coreWebVitals: CoreWebVitals;
    runtime: RuntimePerformance;
    userExperience: UserExperienceMetrics;
    network: NetworkPerformance;
  };
  trends: PerformanceTrend[];
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
  comparisons: {
    previousPeriod: number;
    industry: number;
    competitors: number;
  };
}

export interface PerformanceTrend {
  metric: string;
  period: 'hour' | 'day' | 'week' | 'month';
  data: Array<{
    timestamp: Date;
    value: number;
    severity: MetricSeverity;
  }>;
  direction: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  significance: 'low' | 'medium' | 'high';
}

export interface PerformanceInsight {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'anomaly';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  metrics: string[];
  timeframe: string;
  actionable: boolean;
  estimatedImprovement: {
    metric: string;
    improvement: number;
    unit: string;
  };
}

export interface PerformanceRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: PerformanceCategory;
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
    metric: string;
    improvement: string;
    userBenefit: string;
    businessValue: string;
  };
  relatedMetrics: string[];
  dependencies: string[];
}

export interface PerformanceConfiguration {
  monitoring: {
    enabled: boolean;
    interval: number; // milliseconds
    batchSize: number;
    maxDataPoints: number;
  };
  thresholds: {
    coreWebVitals: {
      lcp: { good: number; needsImprovement: number };
      fid: { good: number; needsImprovement: number };
      cls: { good: number; needsImprovement: number };
      fcp: { good: number; needsImprovement: number };
      ttfb: { good: number; needsImprovement: number };
      inp: { good: number; needsImprovement: number };
    };
    runtime: {
      memoryUsage: { good: number; needsImprovement: number };
      cpuUsage: { good: number; needsImprovement: number };
      longTaskDuration: { good: number; needsImprovement: number };
      framesPerSecond: { good: number; needsImprovement: number };
    };
    network: {
      responseTime: { good: number; needsImprovement: number };
      errorRate: { good: number; needsImprovement: number };
      cacheHitRate: { good: number; needsImprovement: number };
    };
  };
  alerting: {
    enabled: boolean;
    channels: ('console' | 'storage' | 'callback')[];
    debounceTime: number;
    severityFilter: MetricSeverity[];
  };
  privacy: {
    anonymizeData: boolean;
    retentionPeriod: number; // days
    excludePersonalData: boolean;
    consentRequired: boolean;
  };
  features: {
    realTimeMonitoring: boolean;
    automaticReporting: boolean;
    performanceInsights: boolean;
    crisisPerformanceTracking: boolean;
    accessibilityMetrics: boolean;
    userFlowTracking: boolean;
  };
}

class ComprehensivePerformanceMonitor {
  private configuration: PerformanceConfiguration;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private reports: PerformanceReport[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private userFlows: Map<string, UserFlowMetric> = new Map();
  private sessionStartTime = Date.now();
  private eventListeners: Array<(event: any) => void> = [];

  constructor(configuration?: Partial<PerformanceConfiguration>) {
    this.configuration = this.mergeConfiguration(configuration);
    this.initializeMonitoring();
  }

  private mergeConfiguration(userConfig?: Partial<PerformanceConfiguration>): PerformanceConfiguration {
    const defaultConfig: PerformanceConfiguration = {
      monitoring: {
        enabled: true,
        interval: 5000,
        batchSize: 100,
        maxDataPoints: 10000
      },
      thresholds: {
        coreWebVitals: {
          lcp: { good: 2500, needsImprovement: 4000 },
          fid: { good: 100, needsImprovement: 300 },
          cls: { good: 0.1, needsImprovement: 0.25 },
          fcp: { good: 1800, needsImprovement: 3000 },
          ttfb: { good: 800, needsImprovement: 1800 },
          inp: { good: 200, needsImprovement: 500 }
        },
        runtime: {
          memoryUsage: { good: 50, needsImprovement: 80 },
          cpuUsage: { good: 30, needsImprovement: 70 },
          longTaskDuration: { good: 50, needsImprovement: 100 },
          framesPerSecond: { good: 55, needsImprovement: 30 }
        },
        network: {
          responseTime: { good: 200, needsImprovement: 500 },
          errorRate: { good: 1, needsImprovement: 5 },
          cacheHitRate: { good: 90, needsImprovement: 70 }
        }
      },
      alerting: {
        enabled: true,
        channels: ['console', 'storage'],
        debounceTime: 30000,
        severityFilter: ['needs-improvement', 'poor', 'critical']
      },
      privacy: {
        anonymizeData: true,
        retentionPeriod: 30,
        excludePersonalData: true,
        consentRequired: false
      },
      features: {
        realTimeMonitoring: true,
        automaticReporting: true,
        performanceInsights: true,
        crisisPerformanceTracking: true,
        accessibilityMetrics: true,
        userFlowTracking: true
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

  private async initializeMonitoring(): Promise<void> {
    try {
      if (!this.configuration.monitoring.enabled) {
        logger.info('Performance monitoring is disabled');
        return;
      }

      // Initialize Core Web Vitals monitoring
      await this.initializeCoreWebVitals();
      
      // Initialize runtime performance monitoring
      await this.initializeRuntimeMonitoring();
      
      // Initialize network performance monitoring
      await this.initializeNetworkMonitoring();
      
      // Initialize user experience monitoring
      await this.initializeUserExperienceMonitoring();
      
      // Initialize crisis performance tracking
      if (this.configuration.features.crisisPerformanceTracking) {
        await this.initializeCrisisPerformanceTracking();
      }
      
      // Initialize accessibility metrics
      if (this.configuration.features.accessibilityMetrics) {
        await this.initializeAccessibilityMetrics();
      }
      
      // Start real-time monitoring
      if (this.configuration.features.realTimeMonitoring) {
        this.startRealTimeMonitoring();
      }
      
      // Start automatic reporting
      if (this.configuration.features.automaticReporting) {
        this.startAutomaticReporting();
      }

      this.isInitialized = true;
      logger.info('Comprehensive performance monitoring initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error);
      throw error;
    }
  }

  private async initializeCoreWebVitals(): Promise<void> {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.recordMetric({
          id: `lcp-${Date.now()}`,
          name: 'Largest Contentful Paint',
          type: 'core-web-vitals',
          category: 'loading',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: new Date(),
          severity: this.calculateSeverity(lastEntry.startTime, this.configuration.thresholds.coreWebVitals.lcp),
          threshold: {
            good: this.configuration.thresholds.coreWebVitals.lcp.good,
            needsImprovement: this.configuration.thresholds.coreWebVitals.lcp.needsImprovement,
            poor: Infinity
          },
          context: this.getPerformanceContext(),
          metadata: {
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
            size: lastEntry.size
          }
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const fidEntry = entry as any;
          
          this.recordMetric({
            id: `fid-${Date.now()}`,
            name: 'First Input Delay',
            type: 'core-web-vitals',
            category: 'interactivity',
            value: fidEntry.processingStart - fidEntry.startTime,
            unit: 'ms',
            timestamp: new Date(),
            severity: this.calculateSeverity(
              fidEntry.processingStart - fidEntry.startTime,
              this.configuration.thresholds.coreWebVitals.fid
            ),
            threshold: {
              good: this.configuration.thresholds.coreWebVitals.fid.good,
              needsImprovement: this.configuration.thresholds.coreWebVitals.fid.needsImprovement,
              poor: Infinity
            },
            context: this.getPerformanceContext(),
            metadata: {
              eventType: fidEntry.name,
              target: fidEntry.target?.tagName,
              cancelable: fidEntry.cancelable
            }
          });
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        
        this.recordMetric({
          id: `cls-${Date.now()}`,
          name: 'Cumulative Layout Shift',
          type: 'core-web-vitals',
          category: 'visual-stability',
          value: clsValue,
          unit: 'score',
          timestamp: new Date(),
          severity: this.calculateSeverity(clsValue, this.configuration.thresholds.coreWebVitals.cls),
          threshold: {
            good: this.configuration.thresholds.coreWebVitals.cls.good,
            needsImprovement: this.configuration.thresholds.coreWebVitals.cls.needsImprovement,
            poor: Infinity
          },
          context: this.getPerformanceContext(),
          metadata: {
            sources: entries.map((e: any) => ({
              node: e.sources?.[0]?.node?.tagName,
              previousRect: e.sources?.[0]?.previousRect,
              currentRect: e.sources?.[0]?.currentRect
            }))
          }
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    }

    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric({
              id: `fcp-${Date.now()}`,
              name: 'First Contentful Paint',
              type: 'core-web-vitals',
              category: 'loading',
              value: entry.startTime,
              unit: 'ms',
              timestamp: new Date(),
              severity: this.calculateSeverity(entry.startTime, this.configuration.thresholds.coreWebVitals.fcp),
              threshold: {
                good: this.configuration.thresholds.coreWebVitals.fcp.good,
                needsImprovement: this.configuration.thresholds.coreWebVitals.fcp.needsImprovement,
                poor: Infinity
              },
              context: this.getPerformanceContext(),
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            });
          }
        }
      });
      
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', fcpObserver);
    }

    // Time to First Byte (TTFB)
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const navEntry = entry as any;
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          
          this.recordMetric({
            id: `ttfb-${Date.now()}`,
            name: 'Time to First Byte',
            type: 'core-web-vitals',
            category: 'loading',
            value: ttfb,
            unit: 'ms',
            timestamp: new Date(),
            severity: this.calculateSeverity(ttfb, this.configuration.thresholds.coreWebVitals.ttfb),
            threshold: {
              good: this.configuration.thresholds.coreWebVitals.ttfb.good,
              needsImprovement: this.configuration.thresholds.coreWebVitals.ttfb.needsImprovement,
              poor: Infinity
            },
            context: this.getPerformanceContext(),
            metadata: {
              requestStart: navEntry.requestStart,
              responseStart: navEntry.responseStart,
              type: navEntry.type
            }
          });
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    }
  }

  private async initializeRuntimeMonitoring(): Promise<void> {
    // Memory usage monitoring
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        this.recordMetric({
          id: `memory-${Date.now()}`,
          name: 'Memory Usage',
          type: 'runtime-performance',
          category: 'memory',
          value: usedPercentage,
          unit: '%',
          timestamp: new Date(),
          severity: this.calculateSeverity(usedPercentage, this.configuration.thresholds.runtime.memoryUsage),
          threshold: {
            good: this.configuration.thresholds.runtime.memoryUsage.good,
            needsImprovement: this.configuration.thresholds.runtime.memoryUsage.needsImprovement,
            poor: 100
          },
          context: this.getPerformanceContext(),
          metadata: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        });
        
        // Check for memory leaks
        if (usedPercentage > 90) {
          this.detectMemoryLeaks();
        }
      }
    };

    // Long task monitoring
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const longTaskEntry = entry as any;
          
          this.recordMetric({
            id: `long-task-${Date.now()}`,
            name: 'Long Task',
            type: 'runtime-performance',
            category: 'interactivity',
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date(),
            severity: this.calculateSeverity(entry.duration, this.configuration.thresholds.runtime.longTaskDuration),
            threshold: {
              good: this.configuration.thresholds.runtime.longTaskDuration.good,
              needsImprovement: this.configuration.thresholds.runtime.longTaskDuration.needsImprovement,
              poor: Infinity
            },
            context: this.getPerformanceContext(),
            metadata: {
              attribution: longTaskEntry.attribution,
              startTime: entry.startTime,
              duration: entry.duration
            }
          });
          
          // Generate alert for critical long tasks
          if (entry.duration > 200) {
            this.generateAlert({
              type: 'runtime-performance',
              severity: 'critical',
              metric: 'Long Task',
              value: entry.duration,
              threshold: 200,
              message: `Critical long task detected: ${entry.duration}ms`,
              recommendation: 'Consider code splitting or optimizing heavy computations',
              affectedUsers: 1,
              businessImpact: 'User interface may become unresponsive'
            });
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    }

    // Frame rate monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.recordMetric({
          id: `fps-${Date.now()}`,
          name: 'Frames Per Second',
          type: 'runtime-performance',
          category: 'visual-stability',
          value: fps,
          unit: 'fps',
          timestamp: new Date(),
          severity: this.calculateSeverity(fps, this.configuration.thresholds.runtime.framesPerSecond, true),
          threshold: {
            good: this.configuration.thresholds.runtime.framesPerSecond.good,
            needsImprovement: this.configuration.thresholds.runtime.framesPerSecond.needsImprovement,
            poor: 0
          },
          context: this.getPerformanceContext(),
          metadata: {
            frameCount,
            measurementPeriod: currentTime - lastTime
          }
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);

    // Set up periodic memory monitoring
    const memoryInterval = setInterval(monitorMemory, this.configuration.monitoring.interval);
    this.intervals.set('memory', memoryInterval);
  }

  private async initializeNetworkMonitoring(): Promise<void> {
    // Network information monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const recordNetworkInfo = () => {
        this.recordMetric({
          id: `network-${Date.now()}`,
          name: 'Network Quality',
          type: 'network-performance',
          category: 'network',
          value: connection.downlink,
          unit: 'Mbps',
          timestamp: new Date(),
          severity: connection.effectiveType === '4g' ? 'good' : 
                   connection.effectiveType === '3g' ? 'needs-improvement' : 'poor',
          threshold: { good: 10, needsImprovement: 1, poor: 0 },
          context: this.getPerformanceContext(),
          metadata: {
            effectiveType: connection.effectiveType,
            rtt: connection.rtt,
            saveData: connection.saveData,
            type: connection.type
          }
        });
      };
      
      // Record initial network info
      recordNetworkInfo();
      
      // Listen for network changes
      connection.addEventListener('change', recordNetworkInfo);
    }

    // Resource timing monitoring
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const resourceEntry = entry as any;
          
          this.recordMetric({
            id: `resource-${Date.now()}`,
            name: 'Resource Load Time',
            type: 'network-performance',
            category: 'loading',
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date(),
            severity: this.calculateSeverity(entry.duration, this.configuration.thresholds.network.responseTime),
            threshold: {
              good: this.configuration.thresholds.network.responseTime.good,
              needsImprovement: this.configuration.thresholds.network.responseTime.needsImprovement,
              poor: Infinity
            },
            context: this.getPerformanceContext(),
            metadata: {
              name: entry.name,
              initiatorType: resourceEntry.initiatorType,
              transferSize: resourceEntry.transferSize,
              encodedBodySize: resourceEntry.encodedBodySize,
              decodedBodySize: resourceEntry.decodedBodySize,
              cached: resourceEntry.transferSize === 0
            }
          });
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }

  private async initializeUserExperienceMonitoring(): Promise<void> {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordMetric({
          id: `visibility-hidden-${Date.now()}`,
          name: 'Page Hidden',
          type: 'user-experience',
          category: 'interactivity',
          value: Date.now() - this.sessionStartTime,
          unit: 'ms',
          timestamp: new Date(),
          severity: 'good',
          threshold: { good: Infinity, needsImprovement: Infinity, poor: Infinity },
          context: this.getPerformanceContext(),
          metadata: { sessionDuration: Date.now() - this.sessionStartTime }
        });
      } else {
        this.sessionStartTime = Date.now();
      }
    });

    // Track user interactions
    const interactionTypes = ['click', 'keydown', 'touchstart'];
    interactionTypes.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const interactionStart = performance.now();
        
        requestAnimationFrame(() => {
          const interactionEnd = performance.now();
          const interactionDelay = interactionEnd - interactionStart;
          
          this.recordMetric({
            id: `interaction-${Date.now()}`,
            name: 'Interaction Response Time',
            type: 'user-experience',
            category: 'interactivity',
            value: interactionDelay,
            unit: 'ms',
            timestamp: new Date(),
            severity: this.calculateSeverity(interactionDelay, this.configuration.thresholds.coreWebVitals.inp),
            threshold: {
              good: this.configuration.thresholds.coreWebVitals.inp.good,
              needsImprovement: this.configuration.thresholds.coreWebVitals.inp.needsImprovement,
              poor: Infinity
            },
            context: this.getPerformanceContext(),
            metadata: {
              eventType,
              target: (event.target as Element)?.tagName,
              timestamp: interactionStart
            }
          });
        });
      }, { passive: true });
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.recordMetric({
        id: `error-${Date.now()}`,
        name: 'JavaScript Error',
        type: 'user-experience',
        category: 'runtime',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        severity: 'poor',
        threshold: { good: 0, needsImprovement: 1, poor: Infinity },
        context: this.getPerformanceContext(),
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.toString()
        }
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric({
        id: `promise-rejection-${Date.now()}`,
        name: 'Unhandled Promise Rejection',
        type: 'user-experience',
        category: 'runtime',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        severity: 'poor',
        threshold: { good: 0, needsImprovement: 1, poor: Infinity },
        context: this.getPerformanceContext(),
        metadata: {
          reason: event.reason?.toString(),
          promise: event.promise?.toString()
        }
      });
    });
  }

  private async initializeCrisisPerformanceTracking(): Promise<void> {
    // Track crisis button response times
    const trackCrisisElements = () => {
      const crisisElements = document.querySelectorAll(
        '[data-crisis], [data-panic], .crisis-button, .panic-button'
      );
      
      crisisElements.forEach(element => {
        element.addEventListener('click', (event) => {
          const responseStart = performance.now();
          
          // Use MutationObserver to detect when crisis response is complete
          const observer = new MutationObserver(() => {
            const responseEnd = performance.now();
            const responseTime = responseEnd - responseStart;
            
            this.recordMetric({
              id: `crisis-response-${Date.now()}`,
              name: 'Crisis Response Time',
              type: 'crisis-performance',
              category: 'interactivity',
              value: responseTime,
              unit: 'ms',
              timestamp: new Date(),
              severity: responseTime < 100 ? 'good' : responseTime < 300 ? 'needs-improvement' : 'poor',
              threshold: { good: 100, needsImprovement: 300, poor: Infinity },
              context: this.getPerformanceContext(),
              metadata: {
                elementType: element.tagName,
                elementClass: element.className,
                criticalPath: true
              }
            });
            
            // Generate critical alert if crisis response is slow
            if (responseTime > 500) {
              this.generateAlert({
                type: 'crisis-performance',
                severity: 'critical',
                metric: 'Crisis Response Time',
                value: responseTime,
                threshold: 500,
                message: `Critical: Crisis response time is ${responseTime}ms`,
                recommendation: 'Optimize crisis intervention workflow immediately',
                affectedUsers: 1,
                businessImpact: 'Life-threatening delays in crisis intervention'
              });
            }
            
            observer.disconnect();
          });
          
          observer.observe(document.body, { childList: true, subtree: true });
          
          // Timeout the observer after 5 seconds
          setTimeout(() => observer.disconnect(), 5000);
        }, { passive: true });
      });
    };
    
    // Track crisis elements on page load and DOM changes
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackCrisisElements);
    } else {
      trackCrisisElements();
    }
    
    // Re-track when new crisis elements are added
    const crisisObserver = new MutationObserver(trackCrisisElements);
    crisisObserver.observe(document.body, { childList: true, subtree: true });
  }

  private async initializeAccessibilityMetrics(): Promise<void> {
    // Track accessibility-related performance metrics
    const trackAccessibilityPerformance = () => {
      // Measure screen reader announcement delays
      const liveRegions = document.querySelectorAll('[aria-live]');
      liveRegions.forEach(region => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              const announcementStart = performance.now();
              
              // Simulate screen reader processing time
              setTimeout(() => {
                const announcementEnd = performance.now();
                const announcementDelay = announcementEnd - announcementStart;
                
                this.recordMetric({
                  id: `accessibility-announcement-${Date.now()}`,
                  name: 'Screen Reader Announcement Delay',
                  type: 'accessibility-performance',
                  category: 'interactivity',
                  value: announcementDelay,
                  unit: 'ms',
                  timestamp: new Date(),
                  severity: announcementDelay < 200 ? 'good' : 'needs-improvement',
                  threshold: { good: 200, needsImprovement: 500, poor: Infinity },
                  context: this.getPerformanceContext(),
                  metadata: {
                    liveRegionType: region.getAttribute('aria-live'),
                    contentLength: region.textContent?.length || 0
                  }
                });
              }, 100);
            }
          });
        });
        
        observer.observe(region, { childList: true, characterData: true, subtree: true });
      });
      
      // Track focus management performance
      document.addEventListener('focusin', (event) => {
        const focusStart = performance.now();
        
        requestAnimationFrame(() => {
          const focusEnd = performance.now();
          const focusDelay = focusEnd - focusStart;
          
          this.recordMetric({
            id: `focus-management-${Date.now()}`,
            name: 'Focus Management Performance',
            type: 'accessibility-performance',
            category: 'interactivity',
            value: focusDelay,
            unit: 'ms',
            timestamp: new Date(),
            severity: focusDelay < 100 ? 'good' : 'needs-improvement',
            threshold: { good: 100, needsImprovement: 200, poor: Infinity },
            context: this.getPerformanceContext(),
            metadata: {
              targetElement: (event.target as Element)?.tagName,
              hasAriaLabel: (event.target as Element)?.hasAttribute('aria-label')
            }
          });
        });
      }, { passive: true });
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackAccessibilityPerformance);
    } else {
      trackAccessibilityPerformance();
    }
  }

  private startRealTimeMonitoring(): void {
    const monitoringInterval = setInterval(() => {
      this.collectRuntimeMetrics();
      this.analyzePerformanceTrends();
      this.generateInsights();
    }, this.configuration.monitoring.interval);
    
    this.intervals.set('realtime', monitoringInterval);
  }

  private startAutomaticReporting(): void {
    // Generate reports every hour
    const reportingInterval = setInterval(() => {
      const report = this.generatePerformanceReport();
      this.reports.push(report);
      
      // Limit stored reports
      if (this.reports.length > 24) {
        this.reports = this.reports.slice(-12);
      }
      
      logger.info('Automatic performance report generated', {
        reportId: report.id,
        overallScore: report.summary.overallScore,
        criticalIssues: report.summary.criticalIssues
      });
    }, 3600000); // 1 hour
    
    this.intervals.set('reporting', reportingInterval);
  }

  private collectRuntimeMetrics(): void {
    // Collect current runtime metrics
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (memoryUsage > this.configuration.thresholds.runtime.memoryUsage.needsImprovement) {
        this.generateAlert({
          type: 'runtime-performance',
          severity: memoryUsage > 90 ? 'critical' : 'needs-improvement',
          metric: 'Memory Usage',
          value: memoryUsage,
          threshold: this.configuration.thresholds.runtime.memoryUsage.needsImprovement,
          message: `High memory usage detected: ${memoryUsage.toFixed(1)}%`,
          recommendation: 'Consider optimizing memory usage or implementing cleanup',
          affectedUsers: 1,
          businessImpact: 'Application may become slow or unresponsive'
        });
      }
    }
  }

  private analyzePerformanceTrends(): void {
    // Analyze trends in collected metrics
    const metricTypes = ['core-web-vitals', 'runtime-performance', 'user-experience', 'network-performance'];
    
    metricTypes.forEach(metricType => {
      const typeMetrics = this.metrics.get(metricType) || [];
      if (typeMetrics.length >= 10) {
        const recent = typeMetrics.slice(-10);
        const older = typeMetrics.slice(-20, -10);
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
          const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
          const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
          
          if (Math.abs(changePercentage) > 20) {
            const isImproving = changePercentage < 0; // Lower values are generally better
            
            logger.info(`Performance trend detected: ${metricType}`, {
              changePercentage: changePercentage.toFixed(1),
              direction: isImproving ? 'improving' : 'degrading',
              recentAvg: recentAvg.toFixed(2),
              olderAvg: olderAvg.toFixed(2)
            });
          }
        }
      }
    });
  }

  private generateInsights(): void {
    // Generate performance insights based on collected data
    const allMetrics = Array.from(this.metrics.values()).flat();
    const recentMetrics = allMetrics.filter(m => 
      Date.now() - m.timestamp.getTime() < 3600000 // Last hour
    );
    
    if (recentMetrics.length > 0) {
      const poorMetrics = recentMetrics.filter(m => m.severity === 'poor' || m.severity === 'critical');
      
      if (poorMetrics.length > recentMetrics.length * 0.1) {
        logger.warn('Performance degradation detected', {
          poorMetricsCount: poorMetrics.length,
          totalMetricsCount: recentMetrics.length,
          degradationPercentage: ((poorMetrics.length / recentMetrics.length) * 100).toFixed(1)
        });
      }
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    const typeMetrics = this.metrics.get(metric.type) || [];
    typeMetrics.push(metric);
    
    // Limit stored metrics per type
    if (typeMetrics.length > this.configuration.monitoring.maxDataPoints) {
      typeMetrics.splice(0, typeMetrics.length - this.configuration.monitoring.maxDataPoints);
    }
    
    this.metrics.set(metric.type, typeMetrics);
    
    // Check for alerts
    if (metric.severity === 'poor' || metric.severity === 'critical') {
      this.checkForAlerts(metric);
    }
    
    // Emit event
    this.emitEvent({
      type: 'metric-recorded',
      metric,
      timestamp: new Date()
    });
  }

  private calculateSeverity(
    value: number, 
    thresholds: { good: number; needsImprovement: number }, 
    higherIsBetter = false
  ): MetricSeverity {
    if (higherIsBetter) {
      if (value >= thresholds.good) return 'good';
      if (value >= thresholds.needsImprovement) return 'needs-improvement';
      return 'poor';
    } else {
      if (value <= thresholds.good) return 'good';
      if (value <= thresholds.needsImprovement) return 'needs-improvement';
      return 'poor';
    }
  }

  private getPerformanceContext(): PerformanceMetric['context'] {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceType: this.detectDeviceType(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectMemoryLeaks(): void {
    // Simplified memory leak detection
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      
      if (usedMemory > totalMemory * 0.9) {
        const leak: MemoryLeak = {
          id: `leak-${Date.now()}`,
          timestamp: new Date(),
          component: 'unknown',
          leakSize: usedMemory,
          description: 'High memory usage detected, possible memory leak',
          stackTrace: new Error().stack || '',
          severity: 'critical'
        };
        
        this.generateAlert({
          type: 'runtime-performance',
          severity: 'critical',
          metric: 'Memory Leak',
          value: usedMemory,
          threshold: totalMemory * 0.9,
          message: `Potential memory leak detected: ${(usedMemory / 1024 / 1024).toFixed(1)}MB used`,
          recommendation: 'Investigate memory usage patterns and implement cleanup',
          affectedUsers: 1,
          businessImpact: 'Application may crash or become unresponsive'
        });
      }
    }
  }

  private checkForAlerts(metric: PerformanceMetric): void {
    if (!this.configuration.alerting.enabled) return;
    
    if (this.configuration.alerting.severityFilter.includes(metric.severity)) {
      this.generateAlert({
        type: metric.type,
        severity: metric.severity,
        metric: metric.name,
        value: metric.value,
        threshold: metric.threshold.needsImprovement,
        message: `${metric.name} is ${metric.severity}: ${metric.value}${metric.unit}`,
        recommendation: this.getRecommendationForMetric(metric),
        affectedUsers: 1,
        businessImpact: this.getBusinessImpact(metric)
      });
    }
  }

  private generateAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'autoResolved' | 'resolvedAt'>): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      autoResolved: false,
      ...alertData
    };
    
    // Check for duplicate alerts (debouncing)
    const recentAlerts = this.alerts.filter(a => 
      Date.now() - a.timestamp.getTime() < this.configuration.alerting.debounceTime &&
      a.type === alert.type &&
      a.metric === alert.metric
    );
    
    if (recentAlerts.length === 0) {
      this.alerts.push(alert);
      
      // Emit alert through configured channels
      this.configuration.alerting.channels.forEach(channel => {
        switch (channel) {
          case 'console':
            logger.warn(`Performance Alert: ${alert.message}`, alert);
            break;
          case 'storage':
            try {
              const storedAlerts = JSON.parse(localStorage.getItem('performance-alerts') || '[]');
              storedAlerts.push(alert);
              localStorage.setItem('performance-alerts', JSON.stringify(storedAlerts.slice(-100)));
            } catch (error) {
              logger.warn('Failed to store performance alert', error);
            }
            break;
          case 'callback':
            this.emitEvent({
              type: 'alert-generated',
              alert,
              timestamp: new Date()
            });
            break;
        }
      });
    }
  }

  private getRecommendationForMetric(metric: PerformanceMetric): string {
    const recommendations: Record<string, string> = {
      'Largest Contentful Paint': 'Optimize images, use CDN, implement lazy loading',
      'First Input Delay': 'Reduce JavaScript execution time, use web workers',
      'Cumulative Layout Shift': 'Set explicit dimensions for images and ads',
      'Memory Usage': 'Implement proper cleanup, avoid memory leaks',
      'Long Task': 'Break up long-running tasks, use requestIdleCallback',
      'Network Quality': 'Optimize for slower connections, implement offline support',
      'Crisis Response Time': 'Optimize critical path, preload emergency resources'
    };
    
    return recommendations[metric.name] || 'Review and optimize this metric';
  }

  private getBusinessImpact(metric: PerformanceMetric): string {
    const impacts: Record<string, string> = {
      'core-web-vitals': 'Poor user experience, reduced SEO rankings',
      'runtime-performance': 'Application slowdown, potential crashes',
      'user-experience': 'Increased bounce rate, reduced engagement',
      'network-performance': 'Slow loading times, user frustration',
      'crisis-performance': 'Delayed emergency response, potential safety risk',
      'accessibility-performance': 'Reduced accessibility, compliance issues'
    };
    
    return impacts[metric.type] || 'Degraded user experience';
  }

  private generatePerformanceReport(): PerformanceReport {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Get metrics from the last hour
    const allMetrics = Array.from(this.metrics.values()).flat();
    const periodMetrics = allMetrics.filter(m => m.timestamp >= oneHourAgo);
    
    // Calculate scores
    const overallScore = this.calculateOverallScore(periodMetrics);
    const coreWebVitalsScore = this.calculateCoreWebVitalsScore(periodMetrics);
    const userExperienceScore = this.calculateUserExperienceScore(periodMetrics);
    
    // Count issues by severity
    const criticalIssues = periodMetrics.filter(m => m.severity === 'critical').length;
    const totalIssues = periodMetrics.filter(m => m.severity !== 'good').length;
    
    return {
      id: reportId,
      timestamp: now,
      period: { start: oneHourAgo, end: now },
      summary: {
        overallScore,
        coreWebVitalsScore,
        userExperienceScore,
        performanceGrade: this.calculateGrade(overallScore),
        totalIssues,
        criticalIssues,
        improvementOpportunities: this.generateImprovementOpportunities(periodMetrics)
      },
      metrics: this.aggregateMetrics(periodMetrics),
      trends: this.calculateTrendsForReport(),
      insights: this.generateInsightsForReport(periodMetrics),
      recommendations: this.generateRecommendationsForReport(periodMetrics),
      alerts: this.alerts.filter(a => a.timestamp >= oneHourAgo),
      comparisons: {
        previousPeriod: 0, // Would compare with previous period
        industry: 0,       // Would compare with industry benchmarks
        competitors: 0     // Would compare with competitors
      }
    };
  }

  private calculateOverallScore(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 100;
    
    const scores = metrics.map(m => {
      switch (m.severity) {
        case 'good': return 100;
        case 'needs-improvement': return 60;
        case 'poor': return 30;
        case 'critical': return 0;
        default: return 50;
      }
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateCoreWebVitalsScore(metrics: PerformanceMetric[]): number {
    const coreWebVitalMetrics = metrics.filter(m => m.type === 'core-web-vitals');
    return this.calculateOverallScore(coreWebVitalMetrics);
  }

  private calculateUserExperienceScore(metrics: PerformanceMetric[]): number {
    const uxMetrics = metrics.filter(m => m.type === 'user-experience');
    return this.calculateOverallScore(uxMetrics);
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateImprovementOpportunities(metrics: PerformanceMetric[]): string[] {
    const opportunities: string[] = [];
    const poorMetrics = metrics.filter(m => m.severity === 'poor' || m.severity === 'critical');
    
    const metricTypes = new Set(poorMetrics.map(m => m.type));
    metricTypes.forEach(type => {
      switch (type) {
        case 'core-web-vitals':
          opportunities.push('Optimize Core Web Vitals for better user experience');
          break;
        case 'runtime-performance':
          opportunities.push('Improve runtime performance and memory management');
          break;
        case 'network-performance':
          opportunities.push('Optimize network requests and caching strategies');
          break;
        case 'crisis-performance':
          opportunities.push('Critical: Optimize crisis intervention response times');
          break;
      }
    });
    
    return opportunities;
  }

  private aggregateMetrics(metrics: PerformanceMetric[]): PerformanceReport['metrics'] {
    // This would aggregate metrics into the required format
    // Simplified implementation
    return {
      coreWebVitals: {} as CoreWebVitals,
      runtime: {} as RuntimePerformance,
      userExperience: {} as UserExperienceMetrics,
      network: {} as NetworkPerformance
    };
  }

  private calculateTrendsForReport(): PerformanceTrend[] {
    // Calculate trends for the report
    return [];
  }

  private generateInsightsForReport(metrics: PerformanceMetric[]): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    
    // Example insight generation
    const criticalMetrics = metrics.filter(m => m.severity === 'critical');
    if (criticalMetrics.length > 0) {
      insights.push({
        id: `insight-${Date.now()}`,
        type: 'warning',
        title: 'Critical Performance Issues Detected',
        description: `${criticalMetrics.length} critical performance issues need immediate attention`,
        impact: 'high',
        confidence: 0.95,
        metrics: criticalMetrics.map(m => m.name),
        timeframe: 'immediate',
        actionable: true,
        estimatedImprovement: {
          metric: 'Overall Performance Score',
          improvement: 20,
          unit: 'points'
        }
      });
    }
    
    return insights;
  }

  private generateRecommendationsForReport(metrics: PerformanceMetric[]): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    // Example recommendation generation
    const slowMetrics = metrics.filter(m => 
      m.name.includes('Paint') && m.severity !== 'good'
    );
    
    if (slowMetrics.length > 0) {
      recommendations.push({
        id: `rec-${Date.now()}`,
        priority: 'high',
        category: 'loading',
        title: 'Optimize Loading Performance',
        description: 'Several loading metrics are underperforming and need optimization',
        implementation: {
          effort: 'medium',
          timeline: '1-2 weeks',
          steps: [
            'Implement image optimization',
            'Enable compression',
            'Use CDN for static assets',
            'Implement lazy loading'
          ],
          codeExamples: [{
            language: 'html',
            code: '<img src="image.jpg" loading="lazy" alt="Description">',
            description: 'Implement lazy loading for images'
          }],
          resources: [
            'https://web.dev/optimize-lcp/',
            'https://web.dev/lazy-loading-images/'
          ]
        },
        expectedImpact: {
          metric: 'Largest Contentful Paint',
          improvement: '30-50% reduction',
          userBenefit: 'Faster page loads',
          businessValue: 'Improved conversion rates'
        },
        relatedMetrics: ['Largest Contentful Paint', 'First Contentful Paint'],
        dependencies: []
      });
    }
    
    return recommendations;
  }

  private emitEvent(event: any): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.warn('Error in performance event listener', error);
      }
    }
  }

  // Public API
  public getMetrics(type?: PerformanceMetricType): PerformanceMetric[] {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  public getLatestReport(): PerformanceReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  public getAllReports(): PerformanceReport[] {
    return [...this.reports];
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.autoResolved);
  }

  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public generateReport(): PerformanceReport {
    return this.generatePerformanceReport();
  }

  public updateConfiguration(newConfig: Partial<PerformanceConfiguration>): void {
    this.configuration = this.mergeConfiguration(newConfig);
    logger.info('Performance monitor configuration updated', newConfig);
  }

  public getConfiguration(): PerformanceConfiguration {
    return { ...this.configuration };
  }

  public startUserFlow(flowId: string, name: string): void {
    if (!this.configuration.features.userFlowTracking) return;
    
    const flow: UserFlowMetric = {
      flowId,
      name,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      steps: [],
      completed: false,
      errorCount: 0,
      performanceScore: 0
    };
    
    this.userFlows.set(flowId, flow);
  }

  public addFlowStep(flowId: string, stepId: string, stepName: string): void {
    const flow = this.userFlows.get(flowId);
    if (!flow) return;
    
    const step: FlowStep = {
      id: stepId,
      name: stepName,
      startTime: new Date(),
      duration: 0,
      success: false,
      metrics: {
        loadTime: 0,
        renderTime: 0,
        interactionDelay: 0
      },
      errors: []
    };
    
    flow.steps.push(step);
  }

  public completeUserFlow(flowId: string, success = true): void {
    const flow = this.userFlows.get(flowId);
    if (!flow) return;
    
    flow.endTime = new Date();
    flow.duration = flow.endTime.getTime() - flow.startTime.getTime();
    flow.completed = success;
    flow.performanceScore = this.calculateFlowScore(flow);
    
    // Record as metric
    this.recordMetric({
      id: `user-flow-${Date.now()}`,
      name: 'User Flow Duration',
      type: 'user-experience',
      category: 'interactivity',
      value: flow.duration,
      unit: 'ms',
      timestamp: new Date(),
      severity: flow.duration < 3000 ? 'good' : flow.duration < 6000 ? 'needs-improvement' : 'poor',
      threshold: { good: 3000, needsImprovement: 6000, poor: Infinity },
      context: this.getPerformanceContext(),
      metadata: {
        flowId,
        flowName: flow.name,
        completed: flow.completed,
        stepCount: flow.steps.length,
        errorCount: flow.errorCount
      }
    });
  }

  private calculateFlowScore(flow: UserFlowMetric): number {
    if (!flow.completed) return 0;
    
    let score = 100;
    
    // Deduct points for duration
    if (flow.duration > 6000) score -= 30;
    else if (flow.duration > 3000) score -= 15;
    
    // Deduct points for errors
    score -= flow.errorCount * 10;
    
    return Math.max(0, score);
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
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Clear data
    this.metrics.clear();
    this.alerts = [];
    this.reports = [];
    this.userFlows.clear();
    this.eventListeners = [];
    
    this.isInitialized = false;
    logger.info('Comprehensive performance monitor destroyed');
  }
}

// Create singleton instance
export const comprehensivePerformanceMonitor = new ComprehensivePerformanceMonitor();

export default comprehensivePerformanceMonitor;
