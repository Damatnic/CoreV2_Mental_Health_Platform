import { performanceMonitoringService, PerformanceMetric } from '../../services/performanceMonitoringService';

// Mock Performance Observer API
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
};

const mockPerformanceObserverConstructor = jest.fn(() => mockPerformanceObserver);

Object.defineProperty(window, 'PerformanceObserver', {
  value: mockPerformanceObserverConstructor,
  writable: true
});

// Mock Performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 50000000
  }
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock Network Information API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  },
  writable: true
});

describe('Performance Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitoringService.reset();
  });

  describe('Core Web Vitals', () => {
    it('should track Largest Contentful Paint (LCP)', () => {
      const mockLCPEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 1500,
        renderTime: 1500,
        loadTime: 1500
      };

      performanceMonitoringService.trackWebVital('LCP', mockLCPEntry);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.webVitals.LCP).toEqual({
        value: 1500,
        rating: 'good', // Under 2500ms threshold
        timestamp: expect.any(Number)
      });
    });

    it('should track First Input Delay (FID)', () => {
      const mockFIDEntry = {
        name: 'first-input',
        entryType: 'first-input',
        startTime: 50,
        processingStart: 55,
        processingEnd: 60,
        duration: 5
      };

      performanceMonitoringService.trackWebVital('FID', mockFIDEntry);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.webVitals.FID).toEqual({
        value: 5,
        rating: 'good', // Under 100ms threshold
        timestamp: expect.any(Number)
      });
    });

    it('should track Cumulative Layout Shift (CLS)', () => {
      const mockCLSEntry = {
        name: 'layout-shift',
        entryType: 'layout-shift',
        startTime: 100,
        value: 0.05,
        hadRecentInput: false
      };

      performanceMonitoringService.trackWebVital('CLS', mockCLSEntry);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.webVitals.CLS).toEqual({
        value: 0.05,
        rating: 'good', // Under 0.1 threshold
        timestamp: expect.any(Number)
      });
    });

    it('should rate web vitals correctly', () => {
      // Test poor LCP
      performanceMonitoringService.trackWebVital('LCP', {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 5000, // Above 4000ms threshold
        renderTime: 5000
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.webVitals.LCP.rating).toBe('poor');
    });
  });

  describe('Mental Health App Specific Metrics', () => {
    it('should track crisis detection performance', () => {
      const startTime = performance.now();
      
      performanceMonitoringService.startMeasurement('crisis-detection');
      
      // Simulate crisis detection processing time
      jest.advanceTimersByTime(150);
      
      performanceMonitoringService.endMeasurement('crisis-detection', {
        userId: 'user123',
        riskLevel: 'high',
        confidence: 0.87
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.customMetrics['crisis-detection']).toEqual(
        expect.objectContaining({
          duration: expect.any(Number),
          metadata: {
            userId: 'user123',
            riskLevel: 'high',
            confidence: 0.87
          },
          timestamp: expect.any(Number)
        })
      );
    });

    it('should alert on slow crisis detection', () => {
      const alertSpy = jest.spyOn(performanceMonitoringService, 'sendAlert');

      performanceMonitoringService.startMeasurement('crisis-detection');
      jest.advanceTimersByTime(2000); // 2 seconds - above threshold
      performanceMonitoringService.endMeasurement('crisis-detection', {
        userId: 'user123'
      });

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'performance',
        severity: 'high',
        message: 'Crisis detection taking too long: 2000ms',
        metric: 'crisis-detection',
        threshold: 1000,
        actualValue: 2000
      });
    });

    it('should track therapy session connection time', () => {
      performanceMonitoringService.trackSessionConnection('video-session', {
        connectionTime: 800,
        userId: 'user123',
        therapistId: 'therapist456',
        quality: 'good'
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.sessionMetrics['video-session']).toEqual({
        connectionTime: 800,
        quality: 'good',
        userId: 'user123',
        therapistId: 'therapist456',
        timestamp: expect.any(Number)
      });
    });

    it('should monitor API response times', async () => {
      const mockAPICall = jest.fn().mockResolvedValue({ data: 'test' });

      await performanceMonitoringService.monitorAPI(
        'mood-entry-create',
        mockAPICall
      );

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.apiMetrics['mood-entry-create']).toEqual(
        expect.objectContaining({
          duration: expect.any(Number),
          success: true,
          timestamp: expect.any(Number)
        })
      );
    });

    it('should track failed API calls', async () => {
      const mockAPICall = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(
        performanceMonitoringService.monitorAPI('mood-entry-create', mockAPICall)
      ).rejects.toThrow('API Error');

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.apiMetrics['mood-entry-create']).toEqual(
        expect.objectContaining({
          duration: expect.any(Number),
          success: false,
          error: 'API Error',
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('Resource Usage Monitoring', () => {
    it('should track memory usage', () => {
      performanceMonitoringService.trackResourceUsage();

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.resourceUsage).toEqual(
        expect.objectContaining({
          memory: {
            usedJSHeapSize: 10000000,
            totalJSHeapSize: 20000000,
            jsHeapSizeLimit: 50000000,
            usagePercentage: 50 // 10M / 20M
          },
          timestamp: expect.any(Number)
        })
      );
    });

    it('should alert on high memory usage', () => {
      // Mock high memory usage
      mockPerformance.memory = {
        usedJSHeapSize: 45000000,
        totalJSHeapSize: 50000000,
        jsHeapSizeLimit: 50000000
      };

      const alertSpy = jest.spyOn(performanceMonitoringService, 'sendAlert');
      
      performanceMonitoringService.trackResourceUsage();

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'resource',
        severity: 'medium',
        message: 'High memory usage detected: 90%',
        metric: 'memory_usage',
        threshold: 80,
        actualValue: 90
      });
    });

    it('should track network conditions', () => {
      performanceMonitoringService.trackNetworkConditions();

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.networkConditions).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('User Experience Tracking', () => {
    it('should track page load performance', () => {
      const mockNavigationTiming = {
        navigationStart: 1000,
        domContentLoadedEventStart: 1500,
        domContentLoadedEventEnd: 1600,
        loadEventStart: 2000,
        loadEventEnd: 2100
      };

      performanceMonitoringService.trackPageLoad('/dashboard', mockNavigationTiming);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.pageLoadMetrics['/dashboard']).toEqual({
        domContentLoaded: 600, // 1600 - 1000
        fullyLoaded: 1100, // 2100 - 1000
        timestamp: expect.any(Number)
      });
    });

    it('should track user interactions', () => {
      performanceMonitoringService.trackInteraction('panic-button-click', {
        responseTime: 50,
        successful: true,
        context: 'mood-tracking'
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.interactionMetrics['panic-button-click']).toEqual({
        responseTime: 50,
        successful: true,
        context: 'mood-tracking',
        timestamp: expect.any(Number)
      });
    });

    it('should alert on slow interactions', () => {
      const alertSpy = jest.spyOn(performanceMonitoringService, 'sendAlert');

      performanceMonitoringService.trackInteraction('panic-button-click', {
        responseTime: 2000, // 2 seconds - too slow for crisis action
        successful: true
      });

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'interaction',
        severity: 'high',
        message: 'Slow crisis interaction detected: panic-button-click took 2000ms',
        metric: 'panic-button-click',
        threshold: 500,
        actualValue: 2000
      });
    });
  });

  describe('Performance Budgets', () => {
    it('should enforce performance budgets for critical operations', () => {
      const budgets = {
        'crisis-detection': { maxDuration: 1000, severity: 'high' },
        'session-connection': { maxDuration: 3000, severity: 'medium' },
        'api-response': { maxDuration: 2000, severity: 'low' }
      };

      performanceMonitoringService.setPerformanceBudgets(budgets);

      const alertSpy = jest.spyOn(performanceMonitoringService, 'sendAlert');

      // Violate crisis detection budget
      performanceMonitoringService.checkBudget('crisis-detection', 1500);

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'budget_violation',
        severity: 'high',
        message: 'Performance budget exceeded for crisis-detection: 1500ms > 1000ms',
        metric: 'crisis-detection',
        threshold: 1000,
        actualValue: 1500
      });
    });

    it('should track budget compliance over time', () => {
      const budgets = {
        'mood-entry': { maxDuration: 500, severity: 'medium' }
      };

      performanceMonitoringService.setPerformanceBudgets(budgets);

      // Track multiple measurements
      performanceMonitoringService.checkBudget('mood-entry', 300); // Good
      performanceMonitoringService.checkBudget('mood-entry', 600); // Bad
      performanceMonitoringService.checkBudget('mood-entry', 400); // Good

      const compliance = performanceMonitoringService.getBudgetCompliance();
      expect(compliance['mood-entry']).toEqual({
        totalChecks: 3,
        violations: 1,
        complianceRate: expect.closeTo(66.67, 1)
      });
    });
  });

  describe('Real-time Monitoring', () => {
    it('should start performance observer for real-time metrics', () => {
      performanceMonitoringService.startRealTimeMonitoring();

      expect(mockPerformanceObserverConstructor).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockPerformanceObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
    });

    it('should process performance entries in real-time', () => {
      const mockEntries = [
        {
          name: 'first-contentful-paint',
          entryType: 'paint',
          startTime: 800
        },
        {
          name: 'largest-contentful-paint',
          entryType: 'largest-contentful-paint',
          startTime: 1200
        }
      ];

      const callback = mockPerformanceObserverConstructor.mock.calls[0][0];
      callback({ getEntries: () => mockEntries });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.realTimeMetrics).toEqual(
        expect.objectContaining({
          'first-contentful-paint': { value: 800, timestamp: expect.any(Number) },
          'largest-contentful-paint': { value: 1200, timestamp: expect.any(Number) }
        })
      );
    });
  });

  describe('Crisis-Specific Performance', () => {
    it('should monitor 988 connection performance', () => {
      performanceMonitoringService.track988Performance('connect-attempt', {
        duration: 120,
        success: true,
        userId: 'user123',
        waitTime: 30
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.crisisMetrics['988-connect-attempt']).toEqual({
        duration: 120,
        success: true,
        userId: 'user123',
        waitTime: 30,
        timestamp: expect.any(Number)
      });
    });

    it('should track emergency escalation timing', () => {
      performanceMonitoringService.trackEmergencyEscalation({
        escalationType: 'automatic',
        triggerTime: 50,
        responseTime: 200,
        userId: 'user123',
        riskLevel: 'critical'
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.emergencyMetrics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            escalationType: 'automatic',
            triggerTime: 50,
            responseTime: 200,
            totalTime: 250
          })
        ])
      );
    });
  });

  describe('Performance Reports', () => {
    it('should generate comprehensive performance report', () => {
      // Add some test data
      performanceMonitoringService.trackWebVital('LCP', {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 1200
      });

      performanceMonitoringService.trackInteraction('mood-entry', {
        responseTime: 300,
        successful: true
      });

      const report = performanceMonitoringService.generateReport();

      expect(report).toEqual(
        expect.objectContaining({
          timestamp: expect.any(String),
          webVitals: expect.any(Object),
          customMetrics: expect.any(Object),
          interactionMetrics: expect.any(Object),
          summary: expect.objectContaining({
            overallScore: expect.any(Number),
            criticalIssues: expect.any(Number),
            recommendations: expect.any(Array)
          })
        })
      );
    });

    it('should identify performance bottlenecks', () => {
      // Simulate performance issues
      performanceMonitoringService.trackWebVital('LCP', {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 5000 // Poor LCP
      });

      performanceMonitoringService.trackInteraction('crisis-button', {
        responseTime: 1500, // Slow crisis response
        successful: true
      });

      const bottlenecks = performanceMonitoringService.identifyBottlenecks();

      expect(bottlenecks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metric: 'LCP',
            severity: 'high',
            issue: 'Poor largest contentful paint'
          }),
          expect.objectContaining({
            metric: 'crisis-button',
            severity: 'critical',
            issue: 'Slow crisis response time'
          })
        ])
      );
    });
  });
});