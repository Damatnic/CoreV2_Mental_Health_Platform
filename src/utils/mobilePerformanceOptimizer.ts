/**
 * Mobile Performance Optimizer
 * 
 * Critical performance optimization for mental health app ensuring functionality
 * on low-end devices and poor connections. Provides adaptive strategies based
 * on device capabilities and network conditions.
 * 
 * @fileoverview Mobile performance monitoring and optimization utilities
 * @version 2.0.0
 */

/**
 * Performance monitoring interfaces
 */
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkType: string;
  connectionSpeed: number;
  deviceConcurrency: number;
  renderTime: number;
  loadTime: number;
}

/**
 * Performance thresholds interface
 */
export interface PerformanceThresholds {
  lowEndDevice: boolean;
  slowConnection: boolean;
  lowBattery: boolean;
  highMemoryUsage: boolean;
}

/**
 * Network types
 */
export type NetworkType = 
  | 'slow-2g' 
  | '2g' 
  | '3g' 
  | '4g' 
  | '5g' 
  | 'wifi' 
  | 'unknown';

/**
 * Performance optimization strategies
 */
export interface OptimizationStrategy {
  reducedAnimations: boolean;
  lazyLoadImages: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  imageQuality: 'high' | 'medium' | 'low';
  bundleSplitting: boolean;
  preloadCritical: boolean;
  // Crisis-specific optimizations
  prioritizeCrisisFeatures: boolean;
  offlineCrisisSupport: boolean;
  reducedDataUsage: boolean;
}

/**
 * Device Capability Detector
 */
export class DeviceCapabilityDetector {
  private static instance: DeviceCapabilityDetector;
  private capabilities: PerformanceThresholds | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DeviceCapabilityDetector {
    if (!DeviceCapabilityDetector.instance) {
      DeviceCapabilityDetector.instance = new DeviceCapabilityDetector();
    }
    return DeviceCapabilityDetector.instance;
  }

  /**
   * Detect device capabilities
   */
  public async detectCapabilities(): Promise<PerformanceThresholds> {
    if (this.capabilities) return this.capabilities;

    const [deviceInfo, memoryInfo, networkInfo, batteryInfo] = await Promise.all([
      this.getDeviceInfo(),
      this.getMemoryInfo(),
      this.getNetworkInfo(),
      this.getBatteryInfo()
    ]);

    this.capabilities = {
      lowEndDevice: this.isLowEndDevice(deviceInfo),
      slowConnection: this.isSlowConnection(networkInfo),
      lowBattery: this.isLowBattery(batteryInfo),
      highMemoryUsage: this.isHighMemoryUsage(memoryInfo)
    };

    return this.capabilities;
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    return {
      cores: navigator.hardwareConcurrency || 2,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  /**
   * Get memory information
   */
  private async getMemoryInfo(): Promise<any> {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  /**
   * Get network information
   */
  private async getNetworkInfo(): Promise<any> {
    if ('connection' in navigator) {
      return (navigator as any).connection;
    }
    return null;
  }

  /**
   * Get battery information
   */
  private async getBatteryInfo(): Promise<any> {
    try {
      if ('getBattery' in navigator) {
        return await (navigator as any).getBattery();
      }
    } catch (error) {
      // Battery API not available
    }
    return null;
  }

  /**
   * Check if device is low-end
   */
  private isLowEndDevice(deviceInfo: any): boolean {
    const cores = deviceInfo?.cores || 2;
    const userAgent = (deviceInfo?.userAgent || '').toLowerCase();

    if (cores < 4) return true;

    const lowEndPatterns = [
      'android 4',
      'android 5',
      'android 6',
      'iphone 6',
      'iphone 7',
      'iphone se',
      'samsung sm-j',
      'lg-k',
      'moto e',
      'redmi',
      'nokia'
    ];

    return lowEndPatterns.some(pattern => userAgent.includes(pattern));
  }

  /**
   * Check if connection is slow
   */
  private isSlowConnection(networkInfo: any): boolean {
    if (!networkInfo) {
      // If we can't detect network, assume it might be slow
      // This ensures crisis features work even without network detection
      return true;
    }

    const effectiveType = networkInfo?.effectiveType;
    const downlink = networkInfo?.downlink;
    const rtt = networkInfo?.rtt; // Round-trip time

    // More comprehensive slow connection detection
    return effectiveType === 'slow-2g' ||
           effectiveType === '2g' ||
           effectiveType === '3g' ||
           (downlink && downlink < 1.5) ||
           (rtt && rtt > 300); // High latency
  }

  /**
   * Check if battery is low
   */
  private isLowBattery(batteryInfo: any): boolean {
    if (!batteryInfo) return false;
    return batteryInfo.level < 0.2;
  }

  /**
   * Check if memory usage is high
   */
  private isHighMemoryUsage(memoryInfo: any): boolean {
    if (!memoryInfo) return false;

    const usedMemory = memoryInfo?.usedJSHeapSize || 0;
    const totalMemory = memoryInfo?.totalJSHeapSize || 1;
    const limit = memoryInfo?.jsHeapSizeLimit || 1;

    return (usedMemory / Math.min(totalMemory, limit)) > 0.8;
  }

  /**
   * Get current capabilities
   */
  public getCapabilities(): PerformanceThresholds | null {
    return this.capabilities;
  }
}

/**
 * Mobile Performance Monitor
 */
export class MobilePerformanceMonitor {
  private static instance: MobilePerformanceMonitor;
  private metrics: PerformanceMetrics | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MobilePerformanceMonitor {
    if (!MobilePerformanceMonitor.instance) {
      MobilePerformanceMonitor.instance = new MobilePerformanceMonitor();
    }
    return MobilePerformanceMonitor.instance;
  }

  /**
   * Get current performance metrics
   */
  public async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const [networkInfo, memoryInfo, batteryInfo] = await Promise.all([
      this.getNetworkMetrics(),
      this.getMemoryMetrics(),
      this.getBatteryMetrics()
    ]);

    this.metrics = {
      fps: this.calculateFPS(),
      memoryUsage: memoryInfo.usage,
      batteryLevel: batteryInfo.level,
      networkType: networkInfo.type,
      connectionSpeed: networkInfo.speed,
      deviceConcurrency: navigator.hardwareConcurrency || 2,
      renderTime: performance.now(),
      loadTime: this.getLoadTime()
    };

    return this.metrics;
  }

  /**
   * Calculate FPS
   */
  private calculateFPS(): number {
    // Simple FPS calculation - can be enhanced with requestAnimationFrame tracking
    return 60; // Default
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(): Promise<{ type: string; speed: number }> {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        type: conn?.effectiveType || 'unknown',
        speed: conn?.downlink || 0
      };
    }
    return { type: 'unknown', speed: 0 };
  }

  /**
   * Get memory metrics
   */
  private async getMemoryMetrics(): Promise<{ usage: number }> {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        usage: mem ? (mem.usedJSHeapSize / mem.jsHeapSizeLimit) : 0
      };
    }
    return { usage: 0 };
  }

  /**
   * Get battery metrics
   */
  private async getBatteryMetrics(): Promise<{ level: number }> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return { level: battery.level };
      }
    } catch (error) {
      // Battery API not available
    }
    return { level: 1 }; // Assume full battery if API not available
  }

  /**
   * Get page load time
   */
  private getLoadTime(): number {
    if (performance && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return 0;
  }
}

/**
 * Service Worker Manager
 */
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Register service worker
   */
  public async register(swPath: string): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register(swPath);
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  /**
   * Unregister service worker
   */
  public async unregister(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  }

  /**
   * Update service worker
   */
  public async update(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  }
}

/**
 * Adaptive Performance Manager
 */
export class AdaptivePerformanceManager {
  private static instance: AdaptivePerformanceManager;
  private strategy: OptimizationStrategy;
  private listeners: ((strategy: OptimizationStrategy) => void)[] = [];

  private constructor() {
    this.strategy = {
      reducedAnimations: false,
      lazyLoadImages: true,
      cacheStrategy: 'moderate',
      imageQuality: 'high',
      bundleSplitting: true,
      preloadCritical: true,
      // Always prioritize crisis features
      prioritizeCrisisFeatures: true,
      offlineCrisisSupport: true,
      reducedDataUsage: false
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AdaptivePerformanceManager {
    if (!AdaptivePerformanceManager.instance) {
      AdaptivePerformanceManager.instance = new AdaptivePerformanceManager();
    }
    return AdaptivePerformanceManager.instance;
  }

  /**
   * Register strategy change listener
   */
  public onStrategyChange(callback: (strategy: OptimizationStrategy) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Update optimization strategy
   */
  public updateStrategy(thresholds: PerformanceThresholds): void {
    const newStrategy: OptimizationStrategy = {
      reducedAnimations: thresholds.lowEndDevice || thresholds.slowConnection,
      lazyLoadImages: true,
      cacheStrategy: thresholds.slowConnection ? 'aggressive' : 'moderate',
      imageQuality: thresholds.lowEndDevice ? 'low' : thresholds.slowConnection ? 'medium' : 'high',
      bundleSplitting: !thresholds.lowEndDevice,
      preloadCritical: !thresholds.slowConnection,
      // Crisis features always get priority
      prioritizeCrisisFeatures: true,
      offlineCrisisSupport: true,
      reducedDataUsage: thresholds.slowConnection || thresholds.lowBattery
    };

    // Log strategy changes for monitoring
    this.strategy = newStrategy;
    this.listeners.forEach(listener => listener(newStrategy));
  }

  /**
   * Get current strategy
   */
  public getStrategy(): OptimizationStrategy {
    return this.strategy;
  }
}

/**
 * Critical Crisis Feature Optimizer
 * Ensures crisis-related features are always accessible regardless of device/network conditions
 */
export class CrisisFeatureOptimizer {
  private static criticalPaths = [
    '/crisis',
    '/emergency',
    '/help',
    '/988',
    '/breathing',
    '/grounding',
    '/safety-plan'
  ];

  /**
   * Check if a resource is crisis-related
   */
  public static isCrisisResource(url: string): boolean {
    return this.criticalPaths.some(path => url.includes(path));
  }

  /**
   * Get optimized fetch options for crisis resources
   */
  public static getCrisisFetchOptions(): RequestInit {
    return {
      cache: 'force-cache', // Use cache whenever possible
      mode: 'cors',
      credentials: 'same-origin',
      priority: 'high' as any // Prioritize crisis resources
    };
  }

  /**
   * Preload critical crisis resources
   */
  public static async preloadCrisisResources(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Request service worker to cache crisis resources
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_CRISIS_RESOURCES',
        paths: this.criticalPaths
      });
    }
  }

  /**
   * Initialize crisis feature optimizations
   */
  public static async initialize(): Promise<void> {
    // Detect capabilities
    const capabilities = await deviceCapabilityDetector.detectCapabilities();

    // Always ensure crisis features are accessible
    if (capabilities.slowConnection || capabilities.lowEndDevice) {
      await this.preloadCrisisResources();
    }

    // Update strategy to prioritize crisis features
    adaptivePerformanceManager.updateStrategy(capabilities);
  }
}

/**
 * Memory Manager
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryThreshold = 0.8; // 80% of available memory

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get current memory usage
   */
  public getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return mem ? (mem.usedJSHeapSize / mem.jsHeapSizeLimit) : 0;
    }
    return 0;
  }

  /**
   * Check if memory usage is critical
   */
  public isMemoryCritical(): boolean {
    return this.getCurrentMemoryUsage() > this.memoryThreshold;
  }

  /**
   * Force garbage collection if available
   */
  public forceGarbageCollection(): void {
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Clear caches to free memory
   */
  public clearCaches(): void {
    // Clear various caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        // Only clear non-critical caches
        const nonCriticalCaches = cacheNames.filter(name => 
          !name.includes('crisis') && !name.includes('emergency')
        );
        
        nonCriticalCaches.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
  }
}

// Export singleton instances
export const deviceCapabilityDetector = DeviceCapabilityDetector.getInstance();
export const mobilePerformanceMonitor = MobilePerformanceMonitor.getInstance();
export const serviceWorkerManager = ServiceWorkerManager.getInstance();
export const adaptivePerformanceManager = AdaptivePerformanceManager.getInstance();
export const memoryManager = MemoryManager.getInstance();

// Auto-initialize crisis optimizations when module loads
if (typeof window !== 'undefined') {
  CrisisFeatureOptimizer.initialize().catch(error => {
    console.error('Failed to initialize crisis optimizations:', error);
  });
}

// Default export with all utilities
export default {
  DeviceCapabilityDetector,
  MobilePerformanceMonitor,
  ServiceWorkerManager,
  AdaptivePerformanceManager,
  CrisisFeatureOptimizer,
  MemoryManager,
  deviceCapabilityDetector,
  mobilePerformanceMonitor,
  serviceWorkerManager,
  adaptivePerformanceManager,
  memoryManager
};
