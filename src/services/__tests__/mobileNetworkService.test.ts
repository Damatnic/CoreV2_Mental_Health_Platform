/**
 * Mobile Network Service Tests
 * 
 * Comprehensive tests for mobile network detection and adaptation service
 * ensuring optimal performance across varying network conditions for
 * mental health platform features.
 * 
 * @fileoverview Tests for MobileNetworkService
 * @version 2.0.0
 */

import { 
  MobileNetworkService,
  mobileNetworkService,
  getNetworkInfo,
  getAdaptiveConfig,
  shouldSaveData,
  isSuitableForHeavyContent,
  type NetworkInfo,
  type NetworkType,
  type EffectiveType,
  type Speed,
  type Quality,
  type ImageQuality,
  type PreloadLevel,
  type AdaptiveConfig,
  type NetworkMetrics,
  type BandwidthEstimate,
  type OptimizationRecommendations
} from '../mobileNetworkService';

describe('MobileNetworkService', () => {
  let service: MobileNetworkService;
  let mockConnection: any;
  let originalNavigator: any;
  let originalWindow: any;
  let originalPerformance: any;
  let originalFetch: any;

  beforeAll(() => {
    // Save original globals
    originalNavigator = global.navigator;
    originalWindow = global.window;
    originalPerformance = global.performance;
    originalFetch = global.fetch;
  });

  afterAll(() => {
    // Restore original globals
    global.navigator = originalNavigator;
    global.window = originalWindow;
    global.performance = originalPerformance;
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Create fresh service instance for each test
    service = new MobileNetworkService();

    // Mock navigator.connection
    mockConnection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      downlinkMax: 100,
      rtt: 100,
      saveData: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };

    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: true,
        connection: mockConnection
      },
      writable: true,
      configurable: true
    });

    // Mock window
    const intervalCallbacks: { [key: number]: () => void } = {};
    let intervalId = 1;

    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        setInterval: jest.fn((callback: () => void, interval: number) => {
          const id = intervalId++;
          intervalCallbacks[id] = callback;
          return id;
        }),
        clearInterval: jest.fn((id: number) => {
          delete intervalCallbacks[id];
        })
      },
      writable: true,
      configurable: true
    });

    // Mock performance
    Object.defineProperty(global, 'performance', {
      value: {
        now: jest.fn(() => Date.now())
      },
      writable: true,
      configurable: true
    });

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: jest.fn(() => Promise.resolve(new Blob(['test']))),
        ok: true,
        status: 200
      } as any)
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Network Information Detection', () => {
    test('should detect online status correctly', () => {
      (global.navigator as any).onLine = true;
      const info = service.getNetworkInfo();
      
      expect(info).toBeDefined();
      expect(info.isOnline).toBe(true);
    });

    test('should detect offline status correctly', () => {
      (global.navigator as any).onLine = false;
      const info = service.getNetworkInfo();
      
      expect(info).toBeDefined();
      expect(info.isOnline).toBe(false);
    });

    test('should detect network type from connection API', () => {
      mockConnection.type = 'wifi';
      mockConnection.effectiveType = '4g';
      
      const info = service.getNetworkInfo();
      expect(info.effectiveType).toBe('4g');
    });

    test('should handle various network types', () => {
      const networkTypes: Array<{ input: string; expected: EffectiveType }> = [
        { input: 'slow-2g', expected: 'slow-2g' },
        { input: '2g', expected: '2g' },
        { input: '3g', expected: '3g' },
        { input: '4g', expected: '4g' }
      ];

      networkTypes.forEach(({ input, expected }) => {
        mockConnection.effectiveType = input;
        const info = service.getNetworkInfo();
        expect(info.effectiveType).toBe(expected);
      });
    });

    test('should detect data saver mode', () => {
      mockConnection.saveData = true;
      
      const info = service.getNetworkInfo();
      expect(info.saveData).toBe(true);
    });

    test('should calculate connection quality based on downlink and rtt', () => {
      // Test excellent quality
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      let info = service.getNetworkInfo();
      expect(info.quality).toBe('excellent');

      // Test good quality
      mockConnection.downlink = 2;
      mockConnection.rtt = 300;
      info = service.getNetworkInfo();
      expect(info.quality).toBe('good');

      // Test poor quality
      mockConnection.downlink = 0.5;
      mockConnection.rtt = 1000;
      info = service.getNetworkInfo();
      expect(info.quality).toBe('poor');
    });

    test('should categorize connection speed', () => {
      // Test fast speed
      mockConnection.downlink = 10;
      let info = service.getNetworkInfo();
      expect(info.speed).toBe('fast');

      // Test medium speed
      mockConnection.downlink = 1.5;
      info = service.getNetworkInfo();
      expect(info.speed).toBe('medium');

      // Test slow speed
      mockConnection.downlink = 0.5;
      info = service.getNetworkInfo();
      expect(info.speed).toBe('slow');
    });

    test('should estimate values when connection API values are missing', () => {
      mockConnection.downlink = 0;
      mockConnection.rtt = 0;
      mockConnection.effectiveType = '3g';
      
      const info = service.getNetworkInfo();
      
      // Should have estimated values based on effectiveType
      expect(info.downlink).toBeGreaterThan(0);
      expect(info.rtt).toBeGreaterThan(0);
    });

    test('should handle missing Network Information API', () => {
      delete (global.navigator as any).connection;
      
      const info = service.getNetworkInfo();
      
      expect(info).toBeDefined();
      expect(info.type).toBe('unknown');
      expect(info.effectiveType).toBe('unknown');
      expect(info.downlink).toBeGreaterThan(0); // Should have default estimate
      expect(info.rtt).toBeGreaterThan(0); // Should have default estimate
    });

    test('should include timestamp in network info', () => {
      const before = Date.now();
      const info = service.getNetworkInfo();
      const after = Date.now();
      
      expect(info.timestamp).toBeGreaterThanOrEqual(before);
      expect(info.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Adaptive Configuration', () => {
    test('should adapt for poor network quality', () => {
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      const config = service.getAdaptiveConfig();
      
      expect(config.imageQuality).toBe('low');
      expect(config.preloadLevel).toBe('minimal');
      expect(config.enableVideoAutoplay).toBe(false);
      expect(config.enableAnimations).toBe(false);
      expect(config.maxConcurrentRequests).toBe(2);
      expect(config.enableCompression).toBe(true);
      expect(config.enableLazyLoading).toBe(true);
      expect(config.cacheStrategy).toBe('aggressive');
    });

    test('should adapt for good network quality', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 2;
      mockConnection.rtt = 300;
      
      const config = service.getAdaptiveConfig();
      
      expect(config.imageQuality).toBe('medium');
      expect(config.preloadLevel).toBe('selective');
      expect(config.enableVideoAutoplay).toBe(true);
      expect(config.enableAnimations).toBe(true);
      expect(config.maxConcurrentRequests).toBe(3);
      expect(config.cacheStrategy).toBe('moderate');
    });

    test('should adapt for excellent network quality', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      const config = service.getAdaptiveConfig();
      
      expect(config.imageQuality).toBe('high');
      expect(config.preloadLevel).toBe('aggressive');
      expect(config.enableVideoAutoplay).toBe(true);
      expect(config.enableAnimations).toBe(true);
      expect(config.maxConcurrentRequests).toBe(6);
      expect(config.cacheStrategy).toBe('minimal');
    });

    test('should respect data saver mode regardless of connection quality', () => {
      mockConnection.saveData = true;
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 20;
      mockConnection.rtt = 30;
      
      const config = service.getAdaptiveConfig();
      
      expect(config.imageQuality).toBe('low');
      expect(config.preloadLevel).toBe('minimal');
      expect(config.enableVideoAutoplay).toBe(false);
      expect(config.maxConcurrentRequests).toBe(1);
      expect(config.enableCompression).toBe(true);
    });
  });

  describe('Optimization Recommendations', () => {
    test('should provide image optimization recommendations', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      const recommendations = service.getOptimizationRecommendations();
      
      expect(recommendations.imageOptimization).toBeDefined();
      expect(recommendations.imageOptimization.format).toBe('webp');
      expect(recommendations.imageOptimization.quality).toBe(85);
      expect(recommendations.imageOptimization.maxWidth).toBe(1920);
      expect(recommendations.imageOptimization.maxHeight).toBe(1080);
    });

    test('should provide video optimization recommendations', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 2;
      mockConnection.rtt = 300;
      
      const recommendations = service.getOptimizationRecommendations();
      
      expect(recommendations.videoOptimization).toBeDefined();
      expect(recommendations.videoOptimization.enableAutoplay).toBe(true);
      expect(recommendations.videoOptimization.maxBitrate).toBe(2500);
      expect(recommendations.videoOptimization.preferredResolution).toBe('720p');
    });

    test('should provide content strategy recommendations', () => {
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      const recommendations = service.getOptimizationRecommendations();
      
      expect(recommendations.contentStrategy).toBeDefined();
      expect(recommendations.contentStrategy.enableLazyLoading).toBe(true);
      expect(recommendations.contentStrategy.preloadDistance).toBe(500);
      expect(recommendations.contentStrategy.maxConcurrentLoads).toBe(2);
    });

    test('should provide cache strategy recommendations', () => {
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.25;
      mockConnection.rtt = 1400;
      
      const recommendations = service.getOptimizationRecommendations();
      
      expect(recommendations.cacheStrategy).toBeDefined();
      expect(recommendations.cacheStrategy.ttl).toBe(86400); // Aggressive caching
      expect(recommendations.cacheStrategy.maxSize).toBe(25);
      expect(recommendations.cacheStrategy.priority).toBe('storage');
    });
  });

  describe('Bandwidth Estimation', () => {
    test('should estimate bandwidth successfully', async () => {
      const estimate = await service.estimateBandwidth();
      
      expect(estimate).toBeDefined();
      expect(estimate.downloadSpeed).toBeGreaterThan(0);
      expect(estimate.uploadSpeed).toBeGreaterThan(0);
      expect(estimate.latency).toBeGreaterThan(0);
      expect(estimate.jitter).toBeGreaterThanOrEqual(0);
      expect(estimate.reliability).toBeGreaterThan(0);
      expect(estimate.reliability).toBeLessThanOrEqual(1);
      expect(estimate.timestamp).toBeGreaterThan(0);
    });

    test('should handle bandwidth estimation errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const estimate = await service.estimateBandwidth();
      
      expect(estimate).toBeDefined();
      expect(estimate.downloadSpeed).toBe(1);
      expect(estimate.uploadSpeed).toBe(0.5);
      expect(estimate.latency).toBe(500);
      expect(estimate.jitter).toBe(100);
      expect(estimate.reliability).toBe(0.5);
    });
  });

  describe('Network Monitoring', () => {
    test('should add and notify network change listeners', () => {
      const listener = jest.fn();
      service.addNetworkChangeListener(listener);
      
      // Trigger network change
      mockConnection.effectiveType = '3g';
      const changeHandler = mockConnection.addEventListener.mock.calls[0]?.[1];
      if (changeHandler) {
        changeHandler();
      }
      
      // Listener should have been called
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: expect.any(Boolean),
          type: expect.any(String),
          effectiveType: expect.any(String)
        })
      );
    });

    test('should remove network change listeners', () => {
      const listener = jest.fn();
      service.addNetworkChangeListener(listener);
      service.removeNetworkChangeListener(listener);
      
      // Trigger network change
      mockConnection.effectiveType = '3g';
      const changeHandler = mockConnection.addEventListener.mock.calls[0]?.[1];
      if (changeHandler) {
        changeHandler();
      }
      
      // Listener should not have been called after removal
      expect(listener).not.toHaveBeenCalled();
    });

    test('should start and stop monitoring', () => {
      service.startMonitoring(5000);
      expect(global.window.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        5000
      );
      
      service.stopMonitoring();
      expect(global.window.clearInterval).toHaveBeenCalled();
    });

    test('should not start monitoring if already monitoring', () => {
      service.startMonitoring(5000);
      const firstCallCount = (global.window.setInterval as jest.Mock).mock.calls.length;
      
      service.startMonitoring(5000);
      const secondCallCount = (global.window.setInterval as jest.Mock).mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });

    test('should handle online event', () => {
      const onlineHandler = (global.window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'online')?.[1];
      
      expect(onlineHandler).toBeDefined();
      
      (global.navigator as any).onLine = true;
      onlineHandler();
      
      const info = service.getNetworkInfo();
      expect(info.isOnline).toBe(true);
    });

    test('should handle offline event and track disconnections', () => {
      const metrics = service.getMetrics();
      const initialDisconnections = metrics.disconnectionCount;
      
      const offlineHandler = (global.window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'offline')?.[1];
      
      expect(offlineHandler).toBeDefined();
      
      (global.navigator as any).onLine = false;
      offlineHandler();
      
      const info = service.getNetworkInfo();
      expect(info.isOnline).toBe(false);
      
      const updatedMetrics = service.getMetrics();
      expect(updatedMetrics.disconnectionCount).toBe(initialDisconnections + 1);
      expect(updatedMetrics.lastDisconnection).toBeDefined();
    });
  });

  describe('Network Metrics', () => {
    test('should track network metrics', () => {
      const metrics = service.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.averageDownlink).toBeDefined();
      expect(metrics.averageRtt).toBeDefined();
      expect(metrics.connectionStability).toBeDefined();
      expect(metrics.dataUsage).toBeDefined();
      expect(metrics.qualityHistory).toBeDefined();
      expect(metrics.disconnectionCount).toBeDefined();
      expect(metrics.performanceScore).toBeDefined();
    });

    test('should reset metrics correctly', () => {
      // Generate some metrics
      service.getNetworkInfo();
      service.getNetworkInfo();
      
      service.resetMetrics();
      const metrics = service.getMetrics();
      
      expect(metrics.averageDownlink).toBe(0);
      expect(metrics.averageRtt).toBe(0);
      expect(metrics.connectionStability).toBe(1);
      expect(metrics.dataUsage).toBe(0);
      expect(metrics.qualityHistory).toEqual([]);
      expect(metrics.disconnectionCount).toBe(0);
      expect(metrics.performanceScore).toBe(100);
      expect(metrics.lastDisconnection).toBeUndefined();
    });

    test('should update metrics when network info changes', () => {
      // First reading
      mockConnection.downlink = 10;
      mockConnection.rtt = 100;
      service.getNetworkInfo();
      
      // Second reading
      mockConnection.downlink = 20;
      mockConnection.rtt = 50;
      service.getNetworkInfo();
      
      const metrics = service.getMetrics();
      
      expect(metrics.averageDownlink).toBe(15); // Average of 10 and 20
      expect(metrics.averageRtt).toBe(75); // Average of 100 and 50
      expect(metrics.qualityHistory.length).toBeGreaterThan(0);
    });

    test('should calculate performance score based on quality and stability', () => {
      // Simulate poor connection
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      mockConnection.saveData = true;
      
      service.getNetworkInfo();
      
      const metrics = service.getMetrics();
      expect(metrics.performanceScore).toBeLessThan(100);
    });
  });

  describe('Helper Methods', () => {
    test('should determine if suitable for heavy content', () => {
      // Test with excellent connection
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      mockConnection.saveData = false;
      
      expect(service.isSuitableForHeavyContent()).toBe(true);
      
      // Test with data saver
      mockConnection.saveData = true;
      expect(service.isSuitableForHeavyContent()).toBe(false);
      
      // Test with poor connection
      mockConnection.saveData = false;
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      expect(service.isSuitableForHeavyContent()).toBe(false);
    });

    test('should determine if should save data', () => {
      // Test with data saver mode
      mockConnection.saveData = true;
      expect(service.shouldSaveData()).toBe(true);
      
      // Test with poor quality
      mockConnection.saveData = false;
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      expect(service.shouldSaveData()).toBe(true);
      
      // Test with good connection
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      expect(service.shouldSaveData()).toBe(false);
    });

    test('should get recommended image quality', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      const quality = service.getRecommendedImageQuality();
      expect(['low', 'medium', 'high']).toContain(quality);
      expect(quality).toBe('high');
    });

    test('should get recommended preload level', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 2;
      mockConnection.rtt = 300;
      
      const level = service.getRecommendedPreloadLevel();
      expect(['minimal', 'selective', 'aggressive']).toContain(level);
      expect(level).toBe('selective');
    });

    test('should get connection description', () => {
      mockConnection.type = 'wifi';
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      const description = service.getConnectionDescription();
      expect(description).toContain('connection');
      expect(description).not.toBe('Offline');
      
      // Test offline
      (global.navigator as any).onLine = false;
      const offlineDescription = service.getConnectionDescription();
      expect(offlineDescription).toBe('Offline');
    });

    test('should check if supports real-time features', () => {
      // Test with good connection
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      (global.navigator as any).onLine = true;
      
      expect(service.supportsRealTime()).toBe(true);
      
      // Test with high RTT
      mockConnection.rtt = 1500;
      expect(service.supportsRealTime()).toBe(false);
      
      // Test offline
      (global.navigator as any).onLine = false;
      expect(service.supportsRealTime()).toBe(false);
      
      // Test poor quality
      (global.navigator as any).onLine = true;
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 500;
      
      expect(service.supportsRealTime()).toBe(true); // RTT < 1000
    });

    test('should get recommended timeout', () => {
      // Test excellent quality
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      let timeout = service.getRecommendedTimeout();
      expect(timeout).toBe(5000);
      
      // Test good quality
      mockConnection.downlink = 2;
      mockConnection.rtt = 300;
      
      timeout = service.getRecommendedTimeout();
      expect(timeout).toBe(10000);
      
      // Test poor quality
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      timeout = service.getRecommendedTimeout();
      expect(timeout).toBe(20000);
    });
  });

  describe('Singleton Service Exports', () => {
    test('should export singleton instance', () => {
      expect(mobileNetworkService).toBeDefined();
      expect(mobileNetworkService).toBeInstanceOf(MobileNetworkService);
    });

    test('should export convenience function getNetworkInfo', () => {
      const info = getNetworkInfo();
      expect(info).toBeDefined();
      expect(info).toHaveProperty('isOnline');
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('effectiveType');
    });

    test('should export convenience function getAdaptiveConfig', () => {
      const config = getAdaptiveConfig();
      expect(config).toBeDefined();
      expect(config).toHaveProperty('imageQuality');
      expect(config).toHaveProperty('preloadLevel');
      expect(config).toHaveProperty('enableVideoAutoplay');
    });

    test('should export convenience function shouldSaveData', () => {
      mockConnection.saveData = true;
      const shouldSave = shouldSaveData();
      expect(typeof shouldSave).toBe('boolean');
      expect(shouldSave).toBe(true);
    });

    test('should export convenience function isSuitableForHeavyContent', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      mockConnection.saveData = false;
      
      const suitable = isSuitableForHeavyContent();
      expect(typeof suitable).toBe('boolean');
    });
  });

  describe('Mental Health Platform Specific Features', () => {
    test('should prioritize crisis resources caching on slow connections', () => {
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      const config = service.getAdaptiveConfig();
      const recommendations = service.getOptimizationRecommendations();
      
      // Should use aggressive caching for critical resources
      expect(config.cacheStrategy).toBe('aggressive');
      expect(recommendations.cacheStrategy.ttl).toBe(86400); // 24 hours
      expect(recommendations.cacheStrategy.priority).toBe('storage');
    });

    test('should ensure safety features work offline', () => {
      (global.navigator as any).onLine = false;
      
      const info = service.getNetworkInfo();
      const config = service.getAdaptiveConfig();
      
      expect(info).toBeDefined();
      expect(info.isOnline).toBe(false);
      expect(config).toBeDefined();
      // Service should still provide meaningful config for offline usage
      expect(config.cacheStrategy).toBe('aggressive');
    });

    test('should optimize for peer support video calls', () => {
      // Test with medium quality connection
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 2;
      mockConnection.rtt = 300;
      
      const recommendations = service.getOptimizationRecommendations();
      
      expect(recommendations.videoOptimization.preferredResolution).toBe('720p');
      expect(recommendations.videoOptimization.maxBitrate).toBe(2500);
      expect(recommendations.videoOptimization.enableAutoplay).toBe(true);
      
      // Test with poor connection
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      const poorRecommendations = service.getOptimizationRecommendations();
      
      expect(poorRecommendations.videoOptimization.preferredResolution).toBe('480p');
      expect(poorRecommendations.videoOptimization.maxBitrate).toBe(1000);
      expect(poorRecommendations.videoOptimization.enableAutoplay).toBe(false);
    });

    test('should optimize meditation content loading', () => {
      // Test with data saver mode
      mockConnection.saveData = true;
      
      const config = service.getAdaptiveConfig();
      
      expect(config.imageQuality).toBe('low');
      expect(config.enableVideoAutoplay).toBe(false);
      expect(config.preloadLevel).toBe('minimal');
      // Audio meditation content should still be accessible
      expect(config.maxConcurrentRequests).toBeGreaterThan(0);
    });

    test('should adapt animations for anxiety-reducing experience', () => {
      // Poor connections should disable animations to reduce frustration
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;
      
      const config = service.getAdaptiveConfig();
      expect(config.enableAnimations).toBe(false);
      
      // Good connections can have smooth animations
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      
      const goodConfig = service.getAdaptiveConfig();
      expect(goodConfig.enableAnimations).toBe(true);
    });

    test('should handle connection instability for therapy sessions', () => {
      // Simulate connection changes
      mockConnection.effectiveType = '4g';
      service.getNetworkInfo();
      
      mockConnection.effectiveType = '3g';
      service.getNetworkInfo();
      
      mockConnection.effectiveType = '2g';
      service.getNetworkInfo();
      
      mockConnection.effectiveType = '3g';
      service.getNetworkInfo();
      
      mockConnection.effectiveType = '4g';
      service.getNetworkInfo();
      
      const metrics = service.getMetrics();
      
      // Connection stability should reflect the changes
      expect(metrics.connectionStability).toBeLessThan(1);
      expect(metrics.qualityHistory.length).toBeGreaterThan(0);
      
      // Performance score should be affected by instability
      expect(metrics.performanceScore).toBeLessThan(100);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle undefined connection properties gracefully', () => {
      mockConnection.downlink = undefined;
      mockConnection.rtt = undefined;
      mockConnection.effectiveType = undefined;
      mockConnection.type = undefined;
      
      expect(() => {
        const info = service.getNetworkInfo();
        expect(info).toBeDefined();
        expect(info.downlink).toBeGreaterThan(0); // Should have estimate
        expect(info.rtt).toBeGreaterThan(0); // Should have estimate
      }).not.toThrow();
    });

    test('should handle null connection object', () => {
      (global.navigator as any).connection = null;
      
      expect(() => {
        const info = service.getNetworkInfo();
        expect(info).toBeDefined();
        expect(info.type).toBe('unknown');
      }).not.toThrow();
    });

    test('should handle listeners that throw errors', () => {
      const goodListener = jest.fn();
      const badListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      service.addNetworkChangeListener(goodListener);
      service.addNetworkChangeListener(badListener);
      
      // Should not throw when notifying listeners
      expect(() => {
        const changeHandler = mockConnection.addEventListener.mock.calls[0]?.[1];
        if (changeHandler) {
          changeHandler();
        }
      }).not.toThrow();
      
      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
    });

    test('should handle rapid network changes', () => {
      const listener = jest.fn();
      service.addNetworkChangeListener(listener);
      
      // Simulate rapid changes
      for (let i = 0; i < 10; i++) {
        mockConnection.effectiveType = i % 2 === 0 ? '4g' : '2g';
        const changeHandler = mockConnection.addEventListener.mock.calls[0]?.[1];
        if (changeHandler) {
          changeHandler();
        }
      }
      
      // Should handle all changes without errors
      expect(listener).toHaveBeenCalledTimes(10);
    });

    test('should maintain quality history limit', () => {
      // Generate more than 20 network info updates
      for (let i = 0; i < 30; i++) {
        mockConnection.effectiveType = i % 3 === 0 ? '4g' : i % 3 === 1 ? '3g' : '2g';
        service.getNetworkInfo();
      }
      
      const metrics = service.getMetrics();
      
      // Quality history should be limited to 20 entries
      expect(metrics.qualityHistory.length).toBeLessThanOrEqual(20);
    });

    test('should handle extreme network values', () => {
      // Test with extremely high values
      mockConnection.downlink = 10000;
      mockConnection.rtt = 0.001;
      
      expect(() => {
        const info = service.getNetworkInfo();
        expect(info.quality).toBe('excellent');
      }).not.toThrow();
      
      // Test with zero values
      mockConnection.downlink = 0;
      mockConnection.rtt = 0;
      
      expect(() => {
        const info = service.getNetworkInfo();
        expect(info.downlink).toBeGreaterThan(0); // Should use estimate
        expect(info.rtt).toBeGreaterThan(0); // Should use estimate
      }).not.toThrow();
    });
  });
});