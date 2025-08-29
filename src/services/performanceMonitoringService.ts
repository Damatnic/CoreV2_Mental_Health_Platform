/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals and application performance metrics
 */

import { logger } from '../utils/logger';

// Performance metric types
export interface WebVital {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  name: string;
}

export interface PerformanceMetrics {
  webVitals: {
    LCP?: WebVital; // Largest Contentful Paint
    FID?: WebVital; // First Input Delay
    CLS?: WebVital; // Cumulative Layout Shift
    FCP?: WebVital; // First Contentful Paint
    TTFB?: WebVital; // Time to First Byte
  };
  navigation: {
    loadTime?: number;
    domContentLoaded?: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
  resources: {
    totalSize?: number;
    resourceCount?: number;
    cacheHitRate?: number;
  };
  memory?: {
    used?: number;
    total?: number;
    limit?: number;
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  // Enhanced mental health platform metrics
  mentalHealthUX: {
    crisisResponseTime?: number; // Time to display crisis resources
    wellnessCheckLoadTime?: number; // Assessment loading performance
    chatConnectionLatency?: number; // Helper chat connection speed
    safetyPlanAccessTime?: number; // Time to access safety plan
    emergencyAlertDelay?: number; // Emergency notification delay
  };
  wellnessMetrics: {
    sessionStability: {
      dropoutRate: number; // % of sessions that end unexpectedly
      averageSessionLength: number;
      engagementScore: number; // User interaction quality
    };
    userExperience: {
      frustratingEvents: number; // Performance issues during use
      positiveInteractions: number; // Successful feature usage
      accessibilityScore: number; // A11y compliance metrics
      cognitiveLoadIndex: number; // UI complexity impact
    };
    therapeuticImpact: {
      featureUsageEffectiveness: { [feature: string]: number };
      userFlowCompletionRates: { [flow: string]: number };
      stressInducingUIEvents: number;
      calmingElementsEngagement: number;
    };
  };
  platformReliability: {
    uptime: number; // Service availability
    errorRates: {
      critical: number; // Errors during crisis situations
      general: number; // Regular application errors
      recovery: number; // Successful error recoveries
    };
    dataIntegrity: {
      syncFailures: number;
      dataLossEvents: number;
      backupSuccessRate: number;
    };
  };
}

export interface PerformanceConfig {
  enableWebVitals: boolean;
  enableResourceMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  sampleRate: number;
  reportingEndpoint?: string;
  // Enhanced mental health monitoring config
  enableMentalHealthUXMonitoring: boolean;
  enableWellnessMetrics: boolean;
  enableTherapeuticImpactTracking: boolean;
  crisisPerformanceAlerts: boolean;
  accessibilityMonitoring: boolean;
  cognitiveLoadTracking: boolean;
  stressEventDetection: boolean;
  }

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics = {
    webVitals: {},
    navigation: {},
    resources: {},
    mentalHealthUX: {},
    wellnessMetrics: {
      sessionStability: {
        dropoutRate: 0,
        averageSessionLength: 0,
        engagementScore: 0
      },
      userExperience: {
        frustratingEvents: 0,
        positiveInteractions: 0,
        accessibilityScore: 100,
        cognitiveLoadIndex: 0
      },
      therapeuticImpact: {
        featureUsageEffectiveness: {},
        userFlowCompletionRates: {},
        stressInducingUIEvents: 0,
        calmingElementsEngagement: 0
      }
    },
    platformReliability: {
      uptime: 100,
      errorRates: {
        critical: 0,
        general: 0,
        recovery: 0
      },
      dataIntegrity: {
        syncFailures: 0,
        dataLossEvents: 0,
        backupSuccessRate: 100
      }
    }
  };
  
  private config: PerformanceConfig = {
    enableWebVitals: true,
    enableResourceMonitoring: true,
    enableMemoryMonitoring: true,
    sampleRate: 1.0,
    // Mental health specific defaults
    enableMentalHealthUXMonitoring: true,
    enableWellnessMetrics: true,
    enableTherapeuticImpactTracking: true,
    crisisPerformanceAlerts: true,
    accessibilityMonitoring: true,
    cognitiveLoadTracking: true,
    stressEventDetection: true
  };

  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private sessionStartTime: number = Date.now();
  private userInteractionCount: number = 0;
  private stressEventListeners: (() => void)[] = [];

  constructor(config?: Partial<PerformanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Only run in browser environment
      if (typeof window === 'undefined') return;

      // Check if performance API is available
      if (!('performance' in window)) {
        logger.warn('Performance API not available', undefined, 'PerformanceMonitoringService');
        return;
      }

      // Initialize Web Vitals monitoring
      if (this.config.enableWebVitals) {
        await this.initializeWebVitals();
      }

      // Initialize resource monitoring
      if (this.config.enableResourceMonitoring) {
        this.initializeResourceMonitoring();
      }

      // Initialize memory monitoring
      if (this.config.enableMemoryMonitoring) {
        this.initializeMemoryMonitoring();
      }

      // Initialize navigation timing
      this.initializeNavigationTiming();

      // Initialize connection monitoring
      this.initializeConnectionMonitoring();
      
      // Initialize mental health specific monitoring
      if (this.config.enableMentalHealthUXMonitoring) {
        this.initializeMentalHealthUXMonitoring();
      }
      
      if (this.config.enableWellnessMetrics) {
        this.initializeWellnessMetricsTracking();
      }
      
      if (this.config.enableTherapeuticImpactTracking) {
        this.initializeTherapeuticImpactTracking();
      }
      
      if (this.config.accessibilityMonitoring) {
        this.initializeAccessibilityMonitoring();
      }
      
      if (this.config.stressEventDetection) {
        this.initializeStressEventDetection();
      }

      this.isInitialized = true;
      logger.info('Performance monitoring initialized', this.config, 'PerformanceMonitoringService');

    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private async initializeWebVitals(): Promise<void> {
    try {
      // Dynamically import web-vitals to avoid loading in SSR
      const webVitals = await import('web-vitals');
      const getCLS = (webVitals as any).onCLS || (webVitals as any).getCLS;
      const getFID = (webVitals as any).onFID || (webVitals as any).getFID;
      const getFCP = (webVitals as any).onFCP || (webVitals as any).getFCP;
      const getLCP = (webVitals as any).onLCP || (webVitals as any).getLCP;
      const getTTFB = (webVitals as any).onTTFB || (webVitals as any).getTTFB;

      // Core Web Vitals
      if (getCLS) getCLS((metric) => this.handleWebVital('CLS', metric));
      if (getFID) getFID((metric) => this.handleWebVital('FID', metric));
      if (getLCP) getLCP((metric) => this.handleWebVital('LCP', metric));
      
      // Additional metrics
      if (getFCP) getFCP((metric) => this.handleWebVital('FCP', metric));
      if (getTTFB) getTTFB((metric) => this.handleWebVital('TTFB', metric));

    } catch (error) {
      logger.error('Failed to initialize Web Vitals', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Handle Web Vital metric
   */
  private handleWebVital(name: string, metric: any): void {
    const webVital: WebVital = {
      name,
      value: metric.value,
      rating: this.getRating(name, metric.value),
      delta: metric.delta,
      id: metric.id
    };

    this.metrics.webVitals[name as keyof typeof this.metrics.webVitals] = webVital;

    logger.info(`Web Vital: ${name}`, webVital, 'PerformanceMonitoringService');

    // Report if configured
    if (this.config.reportingEndpoint) {
      this.reportMetric('web-vital', webVital);
    }
  }

  /**
   * Get performance rating based on thresholds
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: [2500, 4000], // Good: ≤2.5s, Poor: >4s
      FID: [100, 300],   // Good: ≤100ms, Poor: >300ms
      CLS: [0.1, 0.25],  // Good: ≤0.1, Poor: >0.25
      FCP: [1800, 3000], // Good: ≤1.8s, Poor: >3s
      TTFB: [800, 1800]  // Good: ≤800ms, Poor: >1.8s
    };

    const [good, poor] = thresholds[name as keyof typeof thresholds] || [0, Infinity];

    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Initialize resource monitoring
   */
  private initializeResourceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalSize = 0;
        let resourceCount = 0;

        entries.forEach((entry: any) => {
          if (entry.transferSize) {
            totalSize += entry.transferSize;
            resourceCount++;
          }
        });

        this.metrics.resources = {
          ...this.metrics.resources,
          totalSize: (this.metrics.resources.totalSize || 0) + totalSize,
          resourceCount: (this.metrics.resources.resourceCount || 0) + resourceCount
        };
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);

    } catch (error) {
      logger.error('Failed to initialize resource monitoring', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Initialize memory monitoring
   */
  private initializeMemoryMonitoring(): void {
    if (!('memory' in performance)) return;
    
    try {
      const updateMemoryMetrics = () => {
        const memory = (performance as any).memory;
        this.metrics.memory = {
            used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
        };
      };

      // Update memory metrics periodically
      updateMemoryMetrics();
      setInterval(updateMemoryMetrics, 30000); // Every 30 seconds

    } catch (error) {
      logger.error('Failed to initialize memory monitoring', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Initialize navigation timing
   */
  private initializeNavigationTiming(): void {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // Use fetchStart as the starting point for PerformanceNavigationTiming
        const startTime = navigation.fetchStart || 0;
        this.metrics.navigation = {
          loadTime: navigation.loadEventEnd - startTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - startTime,
          firstPaint: 0, // Will be updated by paint observer
          firstContentfulPaint: 0 // Will be updated by paint observer
        };
      }

      // Observe paint events
      if ('PerformanceObserver' in window) {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-paint') {
              this.metrics.navigation.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
              this.metrics.navigation.firstContentfulPaint = entry.startTime;
            }
          });
        });

        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      }

    } catch (error) {
      logger.error('Failed to initialize navigation timing', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    try {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        this.metrics.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        };

        // Listen for connection changes
        connection.addEventListener('change', () => {
          this.metrics.connection = {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          };
        });
      }

    } catch (error) {
      logger.error('Failed to initialize connection monitoring', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Report metric to external service
   */
  private async reportMetric(type: string, data: any): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    try {
      // Sample based on configured rate
      if (Math.random() > this.config.sampleRate) return;

      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
        })
      });

    } catch (error) {
      logger.error('Failed to report metric', error, 'PerformanceMonitoringService');
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getSummary(): any {
    const webVitals = this.metrics.webVitals;
    const navigation = this.metrics.navigation;
    const resources = this.metrics.resources;
    const memory = this.metrics.memory;
    const mentalHealthUX = this.metrics.mentalHealthUX;
    const wellnessMetrics = this.metrics.wellnessMetrics;
    const platformReliability = this.metrics.platformReliability;
    
    return {
      coreWebVitals: {
        LCP: webVitals.LCP?.value,
        FID: webVitals.FID?.value,
        CLS: webVitals.CLS?.value,
        overall: this.getOverallRating()
      },
      loadPerformance: {
        loadTime: navigation.loadTime,
        domContentLoaded: navigation.domContentLoaded,
        firstContentfulPaint: navigation.firstContentfulPaint
      },
      resourceUsage: {
        totalSize: resources.totalSize,
        resourceCount: resources.resourceCount,
        memoryUsed: memory?.used
      },
      // Enhanced mental health metrics
      mentalHealthPerformance: {
        crisisResponseTime: mentalHealthUX.crisisResponseTime,
        wellnessCheckLoadTime: mentalHealthUX.wellnessCheckLoadTime,
        chatConnectionLatency: mentalHealthUX.chatConnectionLatency,
        safetyPlanAccessTime: mentalHealthUX.safetyPlanAccessTime,
        emergencyAlertDelay: mentalHealthUX.emergencyAlertDelay,
        rating: this.getMentalHealthPerformanceRating()
      },
      userWellnessImpact: {
        sessionStability: wellnessMetrics.sessionStability,
        userExperience: wellnessMetrics.userExperience,
        therapeuticEffectiveness: wellnessMetrics.therapeuticImpact,
        overallWellnessScore: this.calculateOverallWellnessScore()
      },
      platformReliability: {
        uptime: platformReliability.uptime,
        errorRates: platformReliability.errorRates,
        dataIntegrity: platformReliability.dataIntegrity,
        reliabilityScore: this.calculateReliabilityScore()
      }
    };
  }

  /**
   * Get overall performance rating
   */
  private getOverallRating(): 'good' | 'needs-improvement' | 'poor' {
    const vitals = [
      this.metrics.webVitals.LCP?.rating,
      this.metrics.webVitals.FID?.rating,
      this.metrics.webVitals.CLS?.rating
    ].filter(Boolean);

    if (vitals.length === 0) return 'good';

    const poorCount = vitals.filter(rating => rating === 'poor').length;
    const needsImprovementCount = vitals.filter(rating => rating === 'needs-improvement').length;

    if (poorCount > 0) return 'poor';
    if (needsImprovementCount > 0) return 'needs-improvement';
    return 'good';
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Cleanup stress event listeners
    this.stressEventListeners.forEach(cleanup => cleanup());
    this.stressEventListeners = [];
    
    this.isInitialized = false;
  }
  
  // Mental Health UX Monitoring Methods
  private initializeMentalHealthUXMonitoring(): void {
    // Monitor crisis-related performance
    this.monitorCrisisFeatures();
    
    // Monitor wellness check performance
    this.monitorWellnessFeatures();
    
    // Monitor communication features
    this.monitorCommunicationFeatures();
    
    // Monitor safety features
    this.monitorSafetyFeatures();
  }
  
  private monitorCrisisFeatures(): void {
    // Monitor crisis button clicks and response times
    const crisisElements = document.querySelectorAll('[data-crisis="true"], .crisis-button, .emergency-contact');
    
    crisisElements.forEach(element => {
      element.addEventListener('click', (event) => {
        const startTime = performance.now();
        
        // Monitor how quickly crisis resources are displayed
        setTimeout(() => {
          const crisisResourcesVisible = document.querySelector('.crisis-resources, .emergency-resources');
          if (crisisResourcesVisible) {
            const responseTime = performance.now() - startTime;
            this.metrics.mentalHealthUX.crisisResponseTime = responseTime;
            
            // Alert if crisis response is too slow (critical for safety)
            if (responseTime > 1000 && this.config.crisisPerformanceAlerts) {
              this.reportCriticalPerformanceIssue('Crisis response too slow', { responseTime });
            }
          }
        }, 100);
      });
    });
  }
  
  private monitorWellnessFeatures(): void {
    // Monitor assessment loading times
    const assessmentElements = document.querySelectorAll('[data-assessment="true"], .assessment-form, .wellness-check');
    
    assessmentElements.forEach(element => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const startTime = performance.now();
            // Wait for assessment to be fully loaded
            requestAnimationFrame(() => {
              const loadTime = performance.now() - startTime;
              this.metrics.mentalHealthUX.wellnessCheckLoadTime = loadTime;
            });
          }
        });
      });
      
      observer.observe(element, { childList: true, subtree: true });
      this.observers.push(observer as any);
    });
  }
  
  private monitorCommunicationFeatures(): void {
    // Monitor chat connection latency
    if (window.WebSocket) {
      const originalWebSocket = window.WebSocket;
      const metricsRef = this.metrics; // Capture reference to metrics
      
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols);
          
          const connectStart = performance.now();
          
          this.addEventListener('open', () => {
            const latency = performance.now() - connectStart;
            // Only update metrics if this appears to be a chat/helper connection
            if (url.toString().includes('chat') || url.toString().includes('helper')) {
              if (!metricsRef.mentalHealthUX) metricsRef.mentalHealthUX = {};
              metricsRef.mentalHealthUX.chatConnectionLatency = latency;
            }
          });
        }
      };
    }
  }
  
  private monitorSafetyFeatures(): void {
    // Monitor safety plan access times
    const safetyElements = document.querySelectorAll('[data-safety-plan="true"], .safety-plan, .emergency-plan');
    
    safetyElements.forEach(element => {
      element.addEventListener('click', () => {
        const startTime = performance.now();
        
        setTimeout(() => {
          const safetyPlanVisible = document.querySelector('.safety-plan-content, .emergency-plan-content');
          if (safetyPlanVisible) {
            const accessTime = performance.now() - startTime;
            this.metrics.mentalHealthUX.safetyPlanAccessTime = accessTime;
          }
        }, 100);
      });
    });
  }
  
  private initializeWellnessMetricsTracking(): void {
    // Track session stability
    this.trackSessionStability();
    
    // Track user experience metrics
    this.trackUserExperience();
    
    // Track page visibility for engagement
    this.trackEngagement();
  }
  
  private trackSessionStability(): void {
    // Track unexpected page unloads (dropouts)
    window.addEventListener('beforeunload', (event) => {
      const sessionLength = Date.now() - this.sessionStartTime;
      
      // Consider it a dropout if session was very short and no explicit navigation
      if (sessionLength < 30000) { // Less than 30 seconds
        this.metrics.wellnessMetrics.sessionStability.dropoutRate++;
      }
      
      this.metrics.wellnessMetrics.sessionStability.averageSessionLength = 
        (this.metrics.wellnessMetrics.sessionStability.averageSessionLength + sessionLength) / 2;
    });
    
    // Track errors that might cause frustration
    window.addEventListener('error', (event) => {
      this.metrics.wellnessMetrics.userExperience.frustratingEvents++;
      
      // If error during crisis flow, this is critical
      const crisisContext = document.querySelector('.crisis-mode, .emergency-mode');
      if (crisisContext) {
        this.reportCriticalPerformanceIssue('Error during crisis interaction', {
          error: event.error?.message || 'Unknown error',
          filename: event.filename,
          lineno: event.lineno
        });
      }
    });
  }
  
  private trackUserExperience(): void {
    // Track successful positive interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Positive interactions: completed assessments, successful help requests, etc.
      if (target.matches('.success-button, .complete-assessment, .help-received')) {
        this.metrics.wellnessMetrics.userExperience.positiveInteractions++;
      }
      
      // Track calming elements engagement
      if (target.matches('.breathing-exercise, .meditation, .calming-content')) {
        this.metrics.wellnessMetrics.therapeuticImpact.calmingElementsEngagement++;
      }
      
      this.userInteractionCount++;
    });
    
    // Calculate engagement score based on interaction patterns
    setInterval(() => {
      const sessionLength = Date.now() - this.sessionStartTime;
      const interactionsPerMinute = this.userInteractionCount / (sessionLength / 60000);
      this.metrics.wellnessMetrics.sessionStability.engagementScore = Math.min(100, interactionsPerMinute * 10);
    }, 30000); // Update every 30 seconds
  }
  
  private trackEngagement(): void {
    // Track page visibility to understand attention and focus
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User may have been distracted or overwhelmed
        const currentCognitivLoad = this.calculateCurrentCognitiveLoad();
        if (currentCognitivLoad > 7) {
          this.metrics.wellnessMetrics.userExperience.cognitiveLoadIndex++;
        }
      }
    });
  }
  
  private initializeTherapeuticImpactTracking(): void {
    // Track feature effectiveness for therapeutic outcomes
    this.trackFeatureUsage();
    
    // Track user flow completions
    this.trackUserFlows();
  }
  
  private trackFeatureUsage(): void {
    // Monitor key therapeutic features
    const therapeuticFeatures = {
      'mood-tracking': '.mood-tracker, [data-feature="mood-tracking"]',
      'journaling': '.reflection-form, .journal-entry, [data-feature="journaling"]',
      'crisis-support': '.crisis-button, .emergency-contact, [data-feature="crisis-support"]',
      'helper-chat': '.chat-interface, .helper-chat, [data-feature="helper-chat"]',
      'assessments': '.assessment-form, [data-feature="assessments"]',
      'safety-plan': '.safety-plan, [data-feature="safety-plan"]'
    };
    
    Object.entries(therapeuticFeatures).forEach(([feature, selector]) => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        element.addEventListener('click', () => {
          if (!this.metrics.wellnessMetrics.therapeuticImpact.featureUsageEffectiveness[feature]) {
            this.metrics.wellnessMetrics.therapeuticImpact.featureUsageEffectiveness[feature] = 0;
          }
          this.metrics.wellnessMetrics.therapeuticImpact.featureUsageEffectiveness[feature]++;
        });
      });
    });
  }
  
  private trackUserFlows(): void {
    // Track completion of important user flows
    const userFlows = {
      'assessment-completion': () => document.querySelector('.assessment-complete, .assessment-submitted'),
      'crisis-resolution': () => document.querySelector('.crisis-resolved, .emergency-handled'),
      'helper-connection': () => document.querySelector('.helper-connected, .chat-established'),
      'safety-plan-activation': () => document.querySelector('.safety-plan-active, .plan-activated'),
      'wellness-check': () => document.querySelector('.wellness-complete, .check-submitted')
    };
    
    Object.entries(userFlows).forEach(([flow, completionChecker]) => {
      // Check for flow completion every few seconds
      const checkInterval = setInterval(() => {
        if (completionChecker()) {
          if (!this.metrics.wellnessMetrics.therapeuticImpact.userFlowCompletionRates[flow]) {
            this.metrics.wellnessMetrics.therapeuticImpact.userFlowCompletionRates[flow] = 0;
          }
          this.metrics.wellnessMetrics.therapeuticImpact.userFlowCompletionRates[flow]++;
          clearInterval(checkInterval);
        }
      }, 2000);
      
      // Clear interval after reasonable time to prevent memory leaks
      setTimeout(() => clearInterval(checkInterval), 300000); // 5 minutes max
    });
  }
  
  private initializeAccessibilityMonitoring(): void {
    // Monitor accessibility compliance
    let a11yScore = 100;
    
    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    const missingAlt = Array.from(images).filter(img => !img.alt).length;
    a11yScore -= Math.min(20, missingAlt * 2);
    
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    for (const heading of Array.from(headings)) {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      if (currentLevel > previousLevel + 1) {
        a11yScore -= 5; // Penalty for skipped heading levels
      }
      previousLevel = currentLevel;
    }
    
    // Check for proper form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    const missingLabels = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    }).length;
    a11yScore -= Math.min(15, missingLabels * 3);
    
    this.metrics.wellnessMetrics.userExperience.accessibilityScore = Math.max(0, a11yScore);
  }
  
  private initializeStressEventDetection(): void {
    // Detect UI events that might cause stress or frustration
    this.detectFrustrationPatterns();
    
    // Monitor for overwhelming content
    this.monitorCognitiveLoad();
  }
  
  private detectFrustrationPatterns(): void {
    let rapidClicks = 0;
    let lastClickTime = 0;
    
    const clickListener = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime < 500) { // Rapid clicking (less than 500ms apart)
        rapidClicks++;
        if (rapidClicks >= 3) {
          this.metrics.wellnessMetrics.therapeuticImpact.stressInducingUIEvents++;
          rapidClicks = 0; // Reset counter
        }
      } else {
        rapidClicks = 0;
      }
      lastClickTime = now;
    };
    
    document.addEventListener('click', clickListener);
    this.stressEventListeners.push(() => document.removeEventListener('click', clickListener));
    
    // Detect error states that might cause anxiety
    const errorElements = document.querySelectorAll('.error, .alert-error, .validation-error');
    const errorObserver = new MutationObserver(() => {
      const visibleErrors = document.querySelectorAll('.error:not([style*="display: none"]), .alert-error:not([style*="display: none"])');
      if (visibleErrors.length > 0) {
        this.metrics.wellnessMetrics.therapeuticImpact.stressInducingUIEvents++;
      }
    });
    
    errorElements.forEach(element => {
      errorObserver.observe(element, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  }
  
  private monitorCognitiveLoad(): void {
    // Calculate cognitive load based on UI complexity
    const calculateLoad = () => {
      const complexity = this.calculateCurrentCognitiveLoad();
      this.metrics.wellnessMetrics.userExperience.cognitiveLoadIndex = complexity;
    };
    
    // Recalculate periodically
    setInterval(calculateLoad, 10000); // Every 10 seconds
    
    // Recalculate on significant DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateLoad, 1000); // Debounce
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  private calculateCurrentCognitiveLoad(): number {
    // Simple heuristic for cognitive load based on visible elements
    const visibleElements = document.querySelectorAll('*:not([style*="display: none"]):not([hidden])');
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
    const textContent = document.body.textContent?.length || 0;
    
    let load = 0;
    load += Math.min(5, visibleElements.length / 50); // Max 5 points for element count
    load += Math.min(3, interactiveElements.length / 10); // Max 3 points for interactive elements
    load += Math.min(2, textContent / 1000); // Max 2 points for text content
    
    return Math.min(10, load);
  }
  
  private getMentalHealthPerformanceRating(): 'excellent' | 'good' | 'needs-improvement' | 'critical' {
    const metrics = this.metrics.mentalHealthUX;
    
    // Crisis response time is most critical
    if (metrics.crisisResponseTime && metrics.crisisResponseTime > 2000) {
      return 'critical';
    }
    
    const averageTime = (
      (metrics.crisisResponseTime || 0) +
      (metrics.wellnessCheckLoadTime || 0) +
      (metrics.chatConnectionLatency || 0) +
      (metrics.safetyPlanAccessTime || 0)
    ) / 4;
    
    if (averageTime < 500) return 'excellent';
    if (averageTime < 1000) return 'good';
    if (averageTime < 2000) return 'needs-improvement';
    return 'critical';
  }
  
  private calculateOverallWellnessScore(): number {
    const wellness = this.metrics.wellnessMetrics;
    
    let score = 100;
    
    // Penalties for negative metrics
    score -= wellness.sessionStability.dropoutRate * 10;
    score -= wellness.userExperience.frustratingEvents * 5;
    score -= wellness.therapeuticImpact.stressInducingUIEvents * 3;
    score -= (10 - wellness.userExperience.accessibilityScore / 10);
    score -= wellness.userExperience.cognitiveLoadIndex * 2;
    
    // Bonuses for positive metrics
    score += Math.min(20, wellness.userExperience.positiveInteractions * 2);
    score += Math.min(15, wellness.therapeuticImpact.calmingElementsEngagement);
    score += Math.min(10, wellness.sessionStability.engagementScore / 10);
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateReliabilityScore(): number {
    const reliability = this.metrics.platformReliability;
    
    let score = reliability.uptime;
    
    // Heavy penalties for critical errors during crisis situations
    score -= reliability.errorRates.critical * 20;
    score -= reliability.errorRates.general * 2;
    score -= reliability.dataIntegrity.dataLossEvents * 30;
    score -= reliability.dataIntegrity.syncFailures * 5;
    
    // Bonuses for good recovery and backup practices
    score += (reliability.errorRates.recovery * 1);
    score += (reliability.dataIntegrity.backupSuccessRate / 100) * 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private reportCriticalPerformanceIssue(issue: string, data: any): void {
    logger.error('CRITICAL PERFORMANCE ISSUE DETECTED', { issue, data, timestamp: Date.now() });
    
    // In a real implementation, this would trigger alerts to the development team
    // and possibly show user-friendly guidance for degraded performance
    if (this.config.reportingEndpoint) {
      this.reportMetric('critical-performance-issue', {
        issue,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Export class for testing
export { PerformanceMonitoringService };

// Types are already exported as interfaces above

// Default export
export default performanceMonitoringService;

// Mental Health Performance Utilities
export const MentalHealthPerformanceUtils = {
  // Utility to track specific therapeutic action performance
  trackTherapeuticAction: (actionType: string, startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    performanceMonitoringService['metrics'].wellnessMetrics.therapeuticImpact.featureUsageEffectiveness[actionType] = 
      (performanceMonitoringService['metrics'].wellnessMetrics.therapeuticImpact.featureUsageEffectiveness[actionType] || 0) + duration;
  },
  
  // Utility to report stress-inducing UI events
  reportStressEvent: (eventType: string, context?: any) => {
    performanceMonitoringService['metrics'].wellnessMetrics.therapeuticImpact.stressInducingUIEvents++;
    logger.warn('Stress-inducing UI event detected', { eventType, context, timestamp: Date.now() });
  },
  
  // Utility to report positive therapeutic interactions
  reportPositiveInteraction: (interactionType: string, context?: any) => {
    performanceMonitoringService['metrics'].wellnessMetrics.userExperience.positiveInteractions++;
    logger.info('Positive therapeutic interaction', { interactionType, context, timestamp: Date.now() });
  },
  
  // Utility to check if platform is performing adequately for mental health use
  isPlatformMentalHealthReady: (): boolean => {
    const summary = performanceMonitoringService.getSummary();
    const mentalHealthRating = summary.mentalHealthPerformance?.rating;
    const wellnessScore = summary.userWellnessImpact?.overallWellnessScore;
    const reliabilityScore = summary.platformReliability?.reliabilityScore;
    
    return mentalHealthRating !== 'critical' && 
           (wellnessScore || 0) > 60 && 
           (reliabilityScore || 0) > 80;
  }
};