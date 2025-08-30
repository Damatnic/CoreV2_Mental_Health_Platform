/**
 * Enhanced Mobile Performance Service
 * 
 * Critical mobile performance optimization service for the Astral Core Mental Health Platform.
 * Ensures exceptional performance on mobile devices with focus on battery life, network optimization,
 * and crisis feature accessibility even in poor conditions.
 * 
 * @version 3.0.0
 * @priority CRITICAL
 */

import { logger } from '../utils/logger';
import { 
  deviceCapabilityDetector, 
  mobilePerformanceMonitor,
  adaptivePerformanceManager,
  memoryManager,
  CrisisFeatureOptimizer
} from '../utils/mobilePerformanceOptimizer';

/**
 * Mobile network quality levels
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent', // 5G, fast WiFi
  GOOD = 'good',          // 4G, moderate WiFi
  FAIR = 'fair',          // 3G
  POOR = 'poor',          // 2G, slow connection
  OFFLINE = 'offline'     // No connection
}

/**
 * Battery optimization modes
 */
export enum BatteryMode {
  NORMAL = 'normal',           // >50% battery
  CONSERVATION = 'conservation', // 20-50% battery
  CRITICAL = 'critical',       // <20% battery
  EMERGENCY = 'emergency'      // <10% battery
}

/**
 * Performance budget for different features
 */
interface PerformanceBudget {
  crisisFeatures: {
    maxResponseTime: number;  // ms
    maxMemoryUsage: number;   // MB
    maxBatteryDrain: number;  // % per minute
  };
  generalFeatures: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    maxBatteryDrain: number;
  };
}

/**
 * Enhanced mobile performance metrics
 */
export interface EnhancedMobileMetrics {
  // Network metrics
  network: {
    quality: NetworkQuality;
    effectiveType: string;
    downlink: number;       // Mbps
    rtt: number;           // ms
    saveData: boolean;
    connectionChanges: number;
    offlineEvents: number;
  };
  
  // Battery metrics
  battery: {
    level: number;         // 0-1
    charging: boolean;
    mode: BatteryMode;
    drainRate: number;     // % per minute
    estimatedTimeRemaining: number; // minutes
  };
  
  // Memory metrics
  memory: {
    used: number;          // MB
    total: number;         // MB
    pressure: 'low' | 'moderate' | 'high' | 'critical';
    leaks: number;
    garbageCollections: number;
  };
  
  // Performance metrics
  performance: {
    fps: number;
    jank: number;          // Number of janky frames
    longTasks: number;     // Tasks > 50ms
    bundleLoadTime: number; // ms
    interactionLatency: number; // ms
  };
  
  // Crisis-specific metrics
  crisis: {
    buttonResponseTime: number;    // ms
    resourcesCached: boolean;
    offlineReady: boolean;
    emergencyContactsLoaded: boolean;
    lastSyncTime: number;          // timestamp
  };
}

/**
 * Mobile optimization configuration
 */
interface MobileOptimizationConfig {
  enableNetworkOptimization: boolean;
  enableBatteryOptimization: boolean;
  enableMemoryManagement: boolean;
  enableCrisisPrioritization: boolean;
  enableOfflineSupport: boolean;
  performanceBudget: PerformanceBudget;
}

/**
 * Enhanced Mobile Performance Service
 */
export class EnhancedMobilePerformanceService {
  private static instance: EnhancedMobilePerformanceService;
  private metrics: EnhancedMobileMetrics;
  private config: MobileOptimizationConfig;
  private observers: Map<string, MutationObserver | PerformanceObserver> = new Map();
  private intervalHandles: Map<string, NodeJS.Timeout> = new Map();
  private networkMonitor: any = null;
  private batteryMonitor: any = null;
  private memoryPressureObserver: any = null;
  private isInitialized = false;
  
  // Performance budgets
  private readonly CRISIS_RESPONSE_BUDGET = 100; // ms
  private readonly MAX_MEMORY_USAGE = 50;        // MB
  private readonly MAX_BATTERY_DRAIN = 0.083;    // 5% per hour = 0.083% per minute
  
  private constructor() {
    this.metrics = this.getDefaultMetrics();
    this.config = this.getDefaultConfig();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EnhancedMobilePerformanceService {
    if (!EnhancedMobilePerformanceService.instance) {
      EnhancedMobilePerformanceService.instance = new EnhancedMobilePerformanceService();
    }
    return EnhancedMobilePerformanceService.instance;
  }
  
  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing Enhanced Mobile Performance Service', undefined, 'MobilePerformance');
      
      // Initialize network monitoring
      await this.initializeNetworkMonitoring();
      
      // Initialize battery monitoring
      await this.initializeBatteryMonitoring();
      
      // Initialize memory management
      await this.initializeMemoryManagement();
      
      // Initialize performance monitoring
      await this.initializePerformanceMonitoring();
      
      // Initialize crisis feature optimization
      await this.initializeCrisisOptimization();
      
      // Start periodic optimization checks
      this.startOptimizationLoop();
      
      this.isInitialized = true;
      logger.info('Enhanced Mobile Performance Service initialized successfully', this.metrics, 'MobilePerformance');
      
    } catch (error) {
      logger.error('Failed to initialize Enhanced Mobile Performance Service', error, 'MobilePerformance');
      throw error;
    }
  }
  
  /**
   * Initialize network monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    // Check for Network Information API
    if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
      this.networkMonitor = (navigator as any).connection || 
                           (navigator as any).mozConnection || 
                           (navigator as any).webkitConnection;
      
      if (this.networkMonitor) {
        // Initial network quality assessment
        this.updateNetworkMetrics();
        
        // Monitor network changes
        this.networkMonitor.addEventListener('change', () => {
          this.handleNetworkChange();
        });
      }
    }
    
    // Monitor online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Check for Save Data preference
    if ('connection' in navigator && (navigator as any).connection?.saveData) {
      this.metrics.network.saveData = true;
      this.enableDataSavingMode();
    }
  }
  
  /**
   * Initialize battery monitoring
   */
  private async initializeBatteryMonitoring(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        this.batteryMonitor = await (navigator as any).getBattery();
        
        if (this.batteryMonitor) {
          // Initial battery assessment
          this.updateBatteryMetrics();
          
          // Monitor battery changes
          this.batteryMonitor.addEventListener('levelchange', () => this.updateBatteryMetrics());
          this.batteryMonitor.addEventListener('chargingchange', () => this.updateBatteryMetrics());
          
          // Start battery drain rate monitoring
          this.startBatteryDrainMonitoring();
        }
      }
    } catch (error) {
      logger.warn('Battery API not available', error, 'MobilePerformance');
    }
  }
  
  /**
   * Initialize memory management
   */
  private async initializeMemoryManagement(): Promise<void> {
    // Check for Memory API
    if ('memory' in performance) {
      // Initial memory assessment
      this.updateMemoryMetrics();
      
      // Monitor memory pressure
      this.startMemoryPressureMonitoring();
      
      // Set up leak detection
      this.setupLeakDetection();
    }
    
    // Monitor for memory pressure events (Chrome 94+)
    if ('addEventListener' in navigator && 'memory' in navigator) {
      (navigator as any).addEventListener('memorywarning', (event: any) => {
        this.handleMemoryWarning(event);
      });
    }
  }
  
  /**
   * Initialize performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.metrics.performance.longTasks++;
              
              // Log critical long tasks during crisis interactions
              if (this.isInCrisisContext() && entry.duration > 100) {
                logger.warn('Long task detected during crisis interaction', {
                  duration: entry.duration,
                  name: entry.name
                }, 'MobilePerformance');
              }
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
        
      } catch (error) {
        logger.warn('Long task monitoring not supported', error, 'MobilePerformance');
      }
    }
    
    // Monitor FPS and jank
    this.startFPSMonitoring();
    
    // Monitor interaction latency
    this.startInteractionMonitoring();
  }
  
  /**
   * Initialize crisis feature optimization
   */
  private async initializeCrisisOptimization(): Promise<void> {
    // Preload critical crisis resources
    await this.preloadCrisisResources();
    
    // Set up crisis button performance monitoring
    this.monitorCrisisButtonPerformance();
    
    // Ensure offline crisis support
    await this.setupOfflineCrisisSupport();
    
    // Cache emergency contacts
    await this.cacheEmergencyContacts();
  }
  
  /**
   * Update network metrics
   */
  private updateNetworkMetrics(): void {
    if (!this.networkMonitor) return;
    
    const effectiveType = this.networkMonitor.effectiveType || 'unknown';
    const downlink = this.networkMonitor.downlink || 0;
    const rtt = this.networkMonitor.rtt || 0;
    
    // Determine network quality
    let quality = NetworkQuality.GOOD;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      quality = NetworkQuality.POOR;
    } else if (effectiveType === '3g') {
      quality = NetworkQuality.FAIR;
    } else if (effectiveType === '4g') {
      quality = NetworkQuality.GOOD;
    } else if (downlink > 10) {
      quality = NetworkQuality.EXCELLENT;
    }
    
    this.metrics.network = {
      ...this.metrics.network,
      quality,
      effectiveType,
      downlink,
      rtt,
      saveData: this.networkMonitor.saveData || false
    };
    
    // Apply network-based optimizations
    this.applyNetworkOptimizations(quality);
  }
  
  /**
   * Update battery metrics
   */
  private updateBatteryMetrics(): void {
    if (!this.batteryMonitor) return;
    
    const level = this.batteryMonitor.level;
    const charging = this.batteryMonitor.charging;
    
    // Determine battery mode
    let mode = BatteryMode.NORMAL;
    if (level < 0.1) {
      mode = BatteryMode.EMERGENCY;
    } else if (level < 0.2) {
      mode = BatteryMode.CRITICAL;
    } else if (level < 0.5) {
      mode = BatteryMode.CONSERVATION;
    }
    
    this.metrics.battery = {
      ...this.metrics.battery,
      level,
      charging,
      mode
    };
    
    // Apply battery-based optimizations
    this.applyBatteryOptimizations(mode);
  }
  
  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(): void {
    if (!('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
    const total = Math.round(memory.totalJSHeapSize / 1048576);
    const ratio = used / total;
    
    // Determine memory pressure
    let pressure: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (ratio > 0.9) {
      pressure = 'critical';
    } else if (ratio > 0.8) {
      pressure = 'high';
    } else if (ratio > 0.6) {
      pressure = 'moderate';
    }
    
    this.metrics.memory = {
      ...this.metrics.memory,
      used,
      total,
      pressure
    };
    
    // Apply memory-based optimizations
    if (pressure === 'critical' || pressure === 'high') {
      this.handleMemoryPressure(pressure);
    }
  }
  
  /**
   * Handle network change
   */
  private handleNetworkChange(): void {
    this.metrics.network.connectionChanges++;
    this.updateNetworkMetrics();
    
    // Log significant network changes
    logger.info('Network connection changed', {
      quality: this.metrics.network.quality,
      effectiveType: this.metrics.network.effectiveType
    }, 'MobilePerformance');
    
    // Reoptimize for new network conditions
    this.optimizeForCurrentConditions();
  }
  
  /**
   * Handle going online
   */
  private handleOnline(): void {
    logger.info('Device is back online', undefined, 'MobilePerformance');
    this.metrics.network.quality = NetworkQuality.FAIR; // Conservative estimate
    
    // Sync any offline data
    this.syncOfflineData();
    
    // Update crisis resources
    this.updateCrisisResources();
  }
  
  /**
   * Handle going offline
   */
  private handleOffline(): void {
    logger.warn('Device is offline', undefined, 'MobilePerformance');
    this.metrics.network.quality = NetworkQuality.OFFLINE;
    this.metrics.network.offlineEvents++;
    
    // Ensure crisis features remain accessible
    this.activateOfflineMode();
  }
  
  /**
   * Apply network optimizations based on quality
   */
  private applyNetworkOptimizations(quality: NetworkQuality): void {
    switch (quality) {
      case NetworkQuality.POOR:
        // Aggressive optimizations for poor networks
        this.enableAggressiveCaching();
        this.disableNonEssentialRequests();
        this.reduceImageQuality('low');
        this.enableTextOnlyMode();
        break;
        
      case NetworkQuality.FAIR:
        // Moderate optimizations for 3G
        this.enableModerateCaching();
        this.reduceImageQuality('medium');
        this.deferNonCriticalResources();
        break;
        
      case NetworkQuality.GOOD:
        // Light optimizations for 4G
        this.enableStandardCaching();
        this.reduceImageQuality('high');
        break;
        
      case NetworkQuality.EXCELLENT:
        // Minimal optimizations for 5G/fast WiFi
        this.enableStandardCaching();
        this.enableFullFeatures();
        break;
        
      case NetworkQuality.OFFLINE:
        // Offline mode
        this.activateOfflineMode();
        break;
    }
  }
  
  /**
   * Apply battery optimizations based on mode
   */
  private applyBatteryOptimizations(mode: BatteryMode): void {
    switch (mode) {
      case BatteryMode.EMERGENCY:
        // Maximum power saving
        this.disableAllAnimations();
        this.reducePollingFrequency(60000); // 1 minute
        this.disableBackgroundSync();
        this.enableMinimalMode();
        break;
        
      case BatteryMode.CRITICAL:
        // High power saving
        this.reduceAnimations();
        this.reducePollingFrequency(30000); // 30 seconds
        this.limitBackgroundTasks();
        break;
        
      case BatteryMode.CONSERVATION:
        // Moderate power saving
        this.optimizeAnimations();
        this.reducePollingFrequency(15000); // 15 seconds
        break;
        
      case BatteryMode.NORMAL:
        // Standard operation
        this.enableStandardAnimations();
        this.setNormalPollingFrequency();
        break;
    }
  }
  
  /**
   * Handle memory pressure
   */
  private handleMemoryPressure(pressure: 'high' | 'critical'): void {
    logger.warn('Memory pressure detected', { pressure, memory: this.metrics.memory }, 'MobilePerformance');
    
    if (pressure === 'critical') {
      // Emergency memory cleanup
      this.performEmergencyMemoryCleanup();
    } else {
      // Standard memory optimization
      this.performMemoryOptimization();
    }
  }
  
  /**
   * Perform emergency memory cleanup
   */
  private performEmergencyMemoryCleanup(): void {
    // Clear non-essential caches
    this.clearNonEssentialCaches();
    
    // Remove DOM elements not in viewport
    this.removeOffscreenElements();
    
    // Cancel pending non-critical requests
    this.cancelNonCriticalRequests();
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Unload non-critical images
    this.unloadNonVisibleImages();
  }
  
  /**
   * Monitor crisis button performance
   */
  private monitorCrisisButtonPerformance(): void {
    // Find all crisis-related buttons
    const crisisButtons = document.querySelectorAll(
      '[data-crisis="true"], .crisis-button, .emergency-button, [aria-label*="crisis"], [aria-label*="emergency"]'
    );
    
    crisisButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const startTime = performance.now();
        
        // Use requestAnimationFrame to measure actual render time
        requestAnimationFrame(() => {
          const responseTime = performance.now() - startTime;
          this.metrics.crisis.buttonResponseTime = responseTime;
          
          // Alert if response time exceeds budget
          if (responseTime > this.CRISIS_RESPONSE_BUDGET) {
            logger.error('Crisis button response time exceeded budget', {
              responseTime,
              budget: this.CRISIS_RESPONSE_BUDGET
            }, 'MobilePerformance');
            
            // Take immediate action to improve performance
            this.boostCrisisPerformance();
          }
        });
      });
    });
  }
  
  /**
   * Boost performance for crisis interactions
   */
  private boostCrisisPerformance(): void {
    // Pause all non-critical operations
    this.pauseNonCriticalOperations();
    
    // Clear memory for crisis features
    this.performEmergencyMemoryCleanup();
    
    // Prioritize crisis-related network requests
    this.prioritizeCrisisRequests();
    
    // Disable all animations temporarily
    this.disableAllAnimations();
  }
  
  /**
   * Preload crisis resources
   */
  private async preloadCrisisResources(): Promise<void> {
    const criticalResources = [
      '/api/crisis/hotlines',
      '/api/crisis/resources',
      '/api/emergency/contacts',
      '/breathing-exercises',
      '/grounding-techniques',
      '/safety-plan'
    ];
    
    try {
      // Use service worker to cache resources
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PRELOAD_CRISIS_RESOURCES',
          resources: criticalResources
        });
      }
      
      // Also preload in memory for immediate access
      for (const resource of criticalResources) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        link.as = 'fetch';
        document.head.appendChild(link);
      }
      
      this.metrics.crisis.resourcesCached = true;
      
    } catch (error) {
      logger.error('Failed to preload crisis resources', error, 'MobilePerformance');
    }
  }
  
  /**
   * Setup offline crisis support
   */
  private async setupOfflineCrisisSupport(): Promise<void> {
    try {
      // Ensure crisis resources are available offline
      if ('caches' in window) {
        const cache = await caches.open('crisis-offline-v1');
        
        // Cache essential crisis content
        const essentialUrls = [
          '/crisis',
          '/emergency',
          '/988',
          '/breathing',
          '/grounding',
          '/safety-plan'
        ];
        
        await cache.addAll(essentialUrls);
        
        this.metrics.crisis.offlineReady = true;
      }
    } catch (error) {
      logger.error('Failed to setup offline crisis support', error, 'MobilePerformance');
    }
  }
  
  /**
   * Cache emergency contacts
   */
  private async cacheEmergencyContacts(): Promise<void> {
    try {
      // Store emergency contacts in localStorage for offline access
      const contacts = {
        '988': 'Suicide & Crisis Lifeline',
        '911': 'Emergency Services',
        'text-741741': 'Crisis Text Line'
      };
      
      localStorage.setItem('emergency_contacts', JSON.stringify(contacts));
      this.metrics.crisis.emergencyContactsLoaded = true;
      
    } catch (error) {
      logger.error('Failed to cache emergency contacts', error, 'MobilePerformance');
    }
  }
  
  /**
   * Start battery drain monitoring
   */
  private startBatteryDrainMonitoring(): void {
    let previousLevel = this.batteryMonitor?.level || 1;
    let previousTime = Date.now();
    
    const monitorInterval = setInterval(() => {
      if (!this.batteryMonitor) return;
      
      const currentLevel = this.batteryMonitor.level;
      const currentTime = Date.now();
      const timeDiff = (currentTime - previousTime) / 60000; // Convert to minutes
      
      if (timeDiff > 0 && !this.batteryMonitor.charging) {
        const levelDiff = previousLevel - currentLevel;
        const drainRate = (levelDiff * 100) / timeDiff; // % per minute
        
        this.metrics.battery.drainRate = drainRate;
        
        // Calculate estimated time remaining
        if (drainRate > 0) {
          this.metrics.battery.estimatedTimeRemaining = (currentLevel * 100) / drainRate;
        }
        
        // Alert if drain rate is too high
        if (drainRate > this.MAX_BATTERY_DRAIN) {
          logger.warn('High battery drain detected', {
            drainRate,
            maxAllowed: this.MAX_BATTERY_DRAIN
          }, 'MobilePerformance');
          
          // Apply additional battery optimizations
          this.applyEmergencyBatteryOptimizations();
        }
      }
      
      previousLevel = currentLevel;
      previousTime = currentTime;
      
    }, 60000); // Check every minute
    
    this.intervalHandles.set('batteryDrain', monitorInterval);
  }
  
  /**
   * Start memory pressure monitoring
   */
  private startMemoryPressureMonitoring(): void {
    const monitorInterval = setInterval(() => {
      this.updateMemoryMetrics();
      
      // Check if memory usage exceeds budget
      if (this.metrics.memory.used > this.MAX_MEMORY_USAGE) {
        logger.warn('Memory usage exceeds budget', {
          used: this.metrics.memory.used,
          budget: this.MAX_MEMORY_USAGE
        }, 'MobilePerformance');
        
        this.performMemoryOptimization();
      }
    }, 30000); // Check every 30 seconds
    
    this.intervalHandles.set('memoryPressure', monitorInterval);
  }
  
  /**
   * Setup leak detection
   */
  private setupLeakDetection(): void {
    let previousHeapSize = 0;
    let increasingTrend = 0;
    
    const leakDetectionInterval = setInterval(() => {
      if (!('memory' in performance)) return;
      
      const memory = (performance as any).memory;
      const currentHeapSize = memory.usedJSHeapSize;
      
      // Check for consistent memory growth
      if (currentHeapSize > previousHeapSize) {
        increasingTrend++;
        
        // Potential leak if memory keeps growing for 5 consecutive checks
        if (increasingTrend >= 5) {
          this.metrics.memory.leaks++;
          
          logger.warn('Potential memory leak detected', {
            currentSize: Math.round(currentHeapSize / 1048576),
            trend: increasingTrend
          }, 'MobilePerformance');
          
          // Reset trend counter
          increasingTrend = 0;
          
          // Attempt to mitigate leak
          this.mitigateMemoryLeak();
        }
      } else {
        increasingTrend = 0;
      }
      
      previousHeapSize = currentHeapSize;
      
    }, 60000); // Check every minute
    
    this.intervalHandles.set('leakDetection', leakDetectionInterval);
  }
  
  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    let jankCount = 0;
    
    const measureFPS = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      
      frameCount++;
      
      // Calculate FPS every second
      if (delta >= 1000) {
        this.metrics.performance.fps = Math.round((frameCount * 1000) / delta);
        
        // Check for jank (FPS < 30)
        if (this.metrics.performance.fps < 30) {
          jankCount++;
          this.metrics.performance.jank = jankCount;
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  /**
   * Start interaction monitoring
   */
  private startInteractionMonitoring(): void {
    let interactionStart = 0;
    
    // Monitor click interactions
    document.addEventListener('pointerdown', () => {
      interactionStart = performance.now();
    });
    
    document.addEventListener('pointerup', () => {
      if (interactionStart) {
        const latency = performance.now() - interactionStart;
        this.metrics.performance.interactionLatency = latency;
        
        // Alert if interaction is sluggish
        if (latency > 100) {
          logger.debug('Sluggish interaction detected', { latency }, 'MobilePerformance');
        }
      }
    });
  }
  
  /**
   * Start optimization loop
   */
  private startOptimizationLoop(): void {
    const optimizationInterval = setInterval(() => {
      this.optimizeForCurrentConditions();
    }, 30000); // Run every 30 seconds
    
    this.intervalHandles.set('optimization', optimizationInterval);
  }
  
  /**
   * Optimize for current conditions
   */
  private optimizeForCurrentConditions(): void {
    // Get current device capabilities
    const capabilities = deviceCapabilityDetector.getCapabilities();
    
    if (capabilities) {
      // Update adaptive strategy
      adaptivePerformanceManager.updateStrategy(capabilities);
    }
    
    // Check if we need to apply emergency optimizations
    if (this.shouldApplyEmergencyOptimizations()) {
      this.applyEmergencyOptimizations();
    }
  }
  
  /**
   * Check if emergency optimizations are needed
   */
  private shouldApplyEmergencyOptimizations(): boolean {
    return (
      this.metrics.network.quality === NetworkQuality.POOR ||
      this.metrics.network.quality === NetworkQuality.OFFLINE ||
      this.metrics.battery.mode === BatteryMode.CRITICAL ||
      this.metrics.battery.mode === BatteryMode.EMERGENCY ||
      this.metrics.memory.pressure === 'critical'
    );
  }
  
  /**
   * Apply emergency optimizations
   */
  private applyEmergencyOptimizations(): void {
    logger.warn('Applying emergency optimizations', this.metrics, 'MobilePerformance');
    
    // Disable all non-essential features
    this.disableNonEssentialFeatures();
    
    // Maximize caching
    this.enableAggressiveCaching();
    
    // Minimize resource usage
    this.minimizeResourceUsage();
    
    // Ensure crisis features remain responsive
    this.prioritizeCrisisFeatures();
  }
  
  // Cache management methods
  private enableAggressiveCaching(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_CACHE_STRATEGY',
        strategy: 'aggressive'
      });
    }
  }
  
  private enableModerateCaching(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_CACHE_STRATEGY',
        strategy: 'moderate'
      });
    }
  }
  
  private enableStandardCaching(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_CACHE_STRATEGY',
        strategy: 'standard'
      });
    }
  }
  
  // Network optimization methods
  private disableNonEssentialRequests(): void {
    // Cancel any pending analytics or telemetry
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DISABLE_NON_ESSENTIAL_REQUESTS'
      });
    }
  }
  
  private deferNonCriticalResources(): void {
    // Defer loading of non-critical resources
    const deferredElements = document.querySelectorAll('[data-defer="true"]');
    deferredElements.forEach(el => {
      el.setAttribute('loading', 'lazy');
    });
  }
  
  // Image optimization methods
  private reduceImageQuality(quality: 'low' | 'medium' | 'high'): void {
    document.documentElement.setAttribute('data-image-quality', quality);
  }
  
  private unloadNonVisibleImages(): void {
    const images = document.querySelectorAll('img');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.setAttribute('data-src', img.src);
          img.src = '';
        }
      });
    });
    
    images.forEach(img => observer.observe(img));
  }
  
  // Animation optimization methods
  private disableAllAnimations(): void {
    document.documentElement.style.setProperty('--animation-duration', '0s');
    document.documentElement.classList.add('no-animations');
  }
  
  private reduceAnimations(): void {
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    document.documentElement.classList.add('reduced-animations');
  }
  
  private optimizeAnimations(): void {
    document.documentElement.style.setProperty('--animation-duration', '0.2s');
    document.documentElement.classList.add('optimized-animations');
  }
  
  private enableStandardAnimations(): void {
    document.documentElement.style.removeProperty('--animation-duration');
    document.documentElement.classList.remove('no-animations', 'reduced-animations', 'optimized-animations');
  }
  
  // Utility methods
  private isInCrisisContext(): boolean {
    return document.querySelector('.crisis-mode, .emergency-mode, [data-crisis-active="true"]') !== null;
  }
  
  private enableDataSavingMode(): void {
    logger.info('Data saving mode enabled', undefined, 'MobilePerformance');
    document.documentElement.classList.add('data-saving-mode');
  }
  
  private enableTextOnlyMode(): void {
    document.documentElement.classList.add('text-only-mode');
  }
  
  private enableMinimalMode(): void {
    document.documentElement.classList.add('minimal-mode');
  }
  
  private enableFullFeatures(): void {
    document.documentElement.classList.remove('text-only-mode', 'minimal-mode', 'data-saving-mode');
  }
  
  private clearNonEssentialCaches(): void {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (!name.includes('crisis') && !name.includes('emergency')) {
            caches.delete(name);
          }
        });
      });
    }
  }
  
  private removeOffscreenElements(): void {
    // Implementation would remove DOM elements not in viewport
    // This is a placeholder for the actual implementation
  }
  
  private cancelNonCriticalRequests(): void {
    // Cancel pending fetch requests that aren't crisis-related
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CANCEL_NON_CRITICAL_REQUESTS'
      });
    }
  }
  
  private pauseNonCriticalOperations(): void {
    // Pause background tasks, analytics, etc.
    this.intervalHandles.forEach((handle, key) => {
      if (key !== 'crisis') {
        clearInterval(handle);
      }
    });
  }
  
  private prioritizeCrisisRequests(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PRIORITIZE_CRISIS_REQUESTS'
      });
    }
  }
  
  private prioritizeCrisisFeatures(): void {
    // Ensure crisis features have resources
    this.preloadCrisisResources();
    this.boostCrisisPerformance();
  }
  
  private disableNonEssentialFeatures(): void {
    document.documentElement.classList.add('essential-only-mode');
  }
  
  private minimizeResourceUsage(): void {
    this.clearNonEssentialCaches();
    this.unloadNonVisibleImages();
    this.disableAllAnimations();
  }
  
  private syncOfflineData(): void {
    // Sync any data that was stored offline
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_OFFLINE_DATA'
      });
    }
  }
  
  private updateCrisisResources(): void {
    // Update crisis resources when back online
    this.preloadCrisisResources();
    this.metrics.crisis.lastSyncTime = Date.now();
  }
  
  private activateOfflineMode(): void {
    document.documentElement.classList.add('offline-mode');
    
    // Show offline indicator
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.textContent = 'Offline - Crisis features still available';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');
    document.body.appendChild(indicator);
  }
  
  private disableBackgroundSync(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DISABLE_BACKGROUND_SYNC'
      });
    }
  }
  
  private limitBackgroundTasks(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'LIMIT_BACKGROUND_TASKS'
      });
    }
  }
  
  private reducePollingFrequency(interval: number): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_POLLING_INTERVAL',
        interval
      });
    }
  }
  
  private setNormalPollingFrequency(): void {
    this.reducePollingFrequency(5000); // 5 seconds
  }
  
  private applyEmergencyBatteryOptimizations(): void {
    this.disableAllAnimations();
    this.disableBackgroundSync();
    this.enableMinimalMode();
    this.reducePollingFrequency(120000); // 2 minutes
  }
  
  private performMemoryOptimization(): void {
    this.clearNonEssentialCaches();
    this.unloadNonVisibleImages();
    
    // Trigger garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    this.metrics.memory.garbageCollections++;
  }
  
  private mitigateMemoryLeak(): void {
    // Clear event listeners on removed elements
    const removedElements = document.querySelectorAll('[data-removed="true"]');
    removedElements.forEach(el => {
      el.remove();
    });
    
    // Clear unused timers
    this.intervalHandles.forEach((handle, key) => {
      if (!this.isTimerNeeded(key)) {
        clearInterval(handle);
        this.intervalHandles.delete(key);
      }
    });
    
    // Perform aggressive cleanup
    this.performEmergencyMemoryCleanup();
  }
  
  private isTimerNeeded(key: string): boolean {
    // Determine if a timer is still needed
    const essentialTimers = ['optimization', 'crisis', 'batteryDrain', 'memoryPressure'];
    return essentialTimers.includes(key);
  }
  
  /**
   * Get default metrics
   */
  private getDefaultMetrics(): EnhancedMobileMetrics {
    return {
      network: {
        quality: NetworkQuality.GOOD,
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
        connectionChanges: 0,
        offlineEvents: 0
      },
      battery: {
        level: 1,
        charging: false,
        mode: BatteryMode.NORMAL,
        drainRate: 0,
        estimatedTimeRemaining: 0
      },
      memory: {
        used: 0,
        total: 0,
        pressure: 'low',
        leaks: 0,
        garbageCollections: 0
      },
      performance: {
        fps: 60,
        jank: 0,
        longTasks: 0,
        bundleLoadTime: 0,
        interactionLatency: 0
      },
      crisis: {
        buttonResponseTime: 0,
        resourcesCached: false,
        offlineReady: false,
        emergencyContactsLoaded: false,
        lastSyncTime: 0
      }
    };
  }
  
  /**
   * Get default configuration
   */
  private getDefaultConfig(): MobileOptimizationConfig {
    return {
      enableNetworkOptimization: true,
      enableBatteryOptimization: true,
      enableMemoryManagement: true,
      enableCrisisPrioritization: true,
      enableOfflineSupport: true,
      performanceBudget: {
        crisisFeatures: {
          maxResponseTime: 100,
          maxMemoryUsage: 20,
          maxBatteryDrain: 0.05
        },
        generalFeatures: {
          maxResponseTime: 1000,
          maxMemoryUsage: 50,
          maxBatteryDrain: 0.1
        }
      }
    };
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): EnhancedMobileMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get performance report
   */
  public getPerformanceReport(): any {
    return {
      overall: this.calculateOverallScore(),
      network: {
        quality: this.metrics.network.quality,
        optimizations: this.getActiveNetworkOptimizations()
      },
      battery: {
        mode: this.metrics.battery.mode,
        drainRate: this.metrics.battery.drainRate,
        estimatedTime: this.metrics.battery.estimatedTimeRemaining
      },
      memory: {
        pressure: this.metrics.memory.pressure,
        usage: `${this.metrics.memory.used}/${this.metrics.memory.total} MB`,
        leaks: this.metrics.memory.leaks
      },
      performance: {
        fps: this.metrics.performance.fps,
        jank: this.metrics.performance.jank,
        longTasks: this.metrics.performance.longTasks
      },
      crisis: {
        ready: this.metrics.crisis.offlineReady && this.metrics.crisis.resourcesCached,
        responseTime: this.metrics.crisis.buttonResponseTime,
        lastSync: new Date(this.metrics.crisis.lastSyncTime).toISOString()
      }
    };
  }
  
  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(): number {
    let score = 100;
    
    // Network penalties
    if (this.metrics.network.quality === NetworkQuality.POOR) score -= 20;
    if (this.metrics.network.quality === NetworkQuality.OFFLINE) score -= 30;
    
    // Battery penalties
    if (this.metrics.battery.mode === BatteryMode.CRITICAL) score -= 15;
    if (this.metrics.battery.mode === BatteryMode.EMERGENCY) score -= 25;
    
    // Memory penalties
    if (this.metrics.memory.pressure === 'high') score -= 10;
    if (this.metrics.memory.pressure === 'critical') score -= 20;
    score -= this.metrics.memory.leaks * 5;
    
    // Performance penalties
    if (this.metrics.performance.fps < 30) score -= 15;
    if (this.metrics.performance.fps < 15) score -= 25;
    score -= Math.min(20, this.metrics.performance.jank);
    score -= Math.min(10, this.metrics.performance.longTasks / 10);
    
    // Crisis bonus
    if (this.metrics.crisis.offlineReady && this.metrics.crisis.resourcesCached) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Get active network optimizations
   */
  private getActiveNetworkOptimizations(): string[] {
    const optimizations: string[] = [];
    
    if (document.documentElement.classList.contains('text-only-mode')) {
      optimizations.push('Text-only mode');
    }
    if (document.documentElement.classList.contains('data-saving-mode')) {
      optimizations.push('Data saving mode');
    }
    if (document.documentElement.classList.contains('minimal-mode')) {
      optimizations.push('Minimal mode');
    }
    if (document.documentElement.classList.contains('offline-mode')) {
      optimizations.push('Offline mode');
    }
    
    const imageQuality = document.documentElement.getAttribute('data-image-quality');
    if (imageQuality) {
      optimizations.push(`${imageQuality} quality images`);
    }
    
    return optimizations;
  }
  
  /**
   * Cleanup and destroy the service
   */
  public destroy(): void {
    // Clear all intervals
    this.intervalHandles.forEach(handle => clearInterval(handle));
    this.intervalHandles.clear();
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Remove event listeners
    if (this.networkMonitor) {
      this.networkMonitor.removeEventListener('change', this.handleNetworkChange);
    }
    
    if (this.batteryMonitor) {
      this.batteryMonitor.removeEventListener('levelchange', this.updateBatteryMetrics);
      this.batteryMonitor.removeEventListener('chargingchange', this.updateBatteryMetrics);
    }
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const enhancedMobilePerformanceService = EnhancedMobilePerformanceService.getInstance();

// Export for use in other modules
export default enhancedMobilePerformanceService;