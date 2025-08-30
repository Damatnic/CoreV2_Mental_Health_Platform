/**
 * Mobile Memory Manager Service
 * 
 * Advanced memory management for mobile devices including leak detection,
 * prevention, and automated cleanup strategies.
 * 
 * @version 2.0.0
 */

import { logger } from '../utils/logger';

/**
 * Memory leak source types
 */
export enum LeakSource {
  EVENT_LISTENERS = 'event_listeners',
  TIMERS = 'timers',
  DOM_REFERENCES = 'dom_references',
  CLOSURES = 'closures',
  DETACHED_NODES = 'detached_nodes',
  WEBSOCKETS = 'websockets',
  OBSERVERS = 'observers',
  CACHE = 'cache'
}

/**
 * Memory leak detection result
 */
export interface LeakDetectionResult {
  detected: boolean;
  source: LeakSource | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  memoryGrowth: number; // MB
  recommendation: string;
}

/**
 * Component memory tracking
 */
interface ComponentMemory {
  name: string;
  mounted: boolean;
  memoryAtMount: number;
  currentMemory: number;
  leakDetected: boolean;
  listeners: Map<string, Function>;
  timers: Set<NodeJS.Timeout>;
  observers: Set<MutationObserver | IntersectionObserver | ResizeObserver>;
}

/**
 * Memory snapshot for comparison
 */
interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  domNodes: number;
  eventListeners: number;
  detachedNodes: WeakSet<Node>;
}

/**
 * Mobile Memory Manager Service
 */
export class MobileMemoryManagerService {
  private static instance: MobileMemoryManagerService;
  private componentMemory: Map<string, ComponentMemory> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private detachedNodes: WeakSet<Node> = new WeakSet();
  private globalListeners: Map<EventTarget, Map<string, Set<EventListener>>> = new Map();
  private activeTimers: Set<NodeJS.Timeout> = new Set();
  private activeObservers: Set<any> = new Set();
  private memoryPressureCallbacks: ((pressure: 'low' | 'moderate' | 'high' | 'critical') => void)[] = [];
  private leakDetectionInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  // Thresholds
  private readonly MEMORY_LIMIT_MB = 50;
  private readonly LEAK_GROWTH_THRESHOLD_MB = 5;
  private readonly SNAPSHOT_INTERVAL_MS = 30000; // 30 seconds
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MobileMemoryManagerService {
    if (!MobileMemoryManagerService.instance) {
      MobileMemoryManagerService.instance = new MobileMemoryManagerService();
    }
    return MobileMemoryManagerService.instance;
  }
  
  /**
   * Start memory monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    logger.info('Starting memory monitoring', undefined, 'MemoryManager');
    
    // Patch global methods to track memory usage
    this.patchGlobalMethods();
    
    // Start leak detection
    this.startLeakDetection();
    
    // Start automatic cleanup
    this.startAutomaticCleanup();
    
    // Monitor memory pressure
    this.monitorMemoryPressure();
    
    this.isMonitoring = true;
  }
  
  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
      this.leakDetectionInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.isMonitoring = false;
    logger.info('Stopped memory monitoring', undefined, 'MemoryManager');
  }
  
  /**
   * Register component for memory tracking
   */
  public registerComponent(name: string): void {
    if (this.componentMemory.has(name)) return;
    
    const memory = this.getCurrentMemoryUsage();
    
    this.componentMemory.set(name, {
      name,
      mounted: true,
      memoryAtMount: memory,
      currentMemory: memory,
      leakDetected: false,
      listeners: new Map(),
      timers: new Set(),
      observers: new Set()
    });
    
    logger.debug(`Component registered: ${name}`, { memory }, 'MemoryManager');
  }
  
  /**
   * Unregister component and cleanup
   */
  public unregisterComponent(name: string): void {
    const component = this.componentMemory.get(name);
    if (!component) return;
    
    // Cleanup component resources
    this.cleanupComponentResources(component);
    
    // Check for memory leak
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryDiff = currentMemory - component.memoryAtMount;
    
    if (memoryDiff > this.LEAK_GROWTH_THRESHOLD_MB) {
      logger.warn(`Potential memory leak in component: ${name}`, {
        memoryGrowth: memoryDiff
      }, 'MemoryManager');
    }
    
    this.componentMemory.delete(name);
  }
  
  /**
   * Track event listener
   */
  public trackEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    componentName?: string
  ): void {
    // Track globally
    if (!this.globalListeners.has(target)) {
      this.globalListeners.set(target, new Map());
    }
    
    const targetListeners = this.globalListeners.get(target)!;
    if (!targetListeners.has(type)) {
      targetListeners.set(type, new Set());
    }
    
    targetListeners.get(type)!.add(listener);
    
    // Track per component
    if (componentName) {
      const component = this.componentMemory.get(componentName);
      if (component) {
        component.listeners.set(`${type}_${Date.now()}`, listener as Function);
      }
    }
  }
  
  /**
   * Untrack event listener
   */
  public untrackEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener
  ): void {
    const targetListeners = this.globalListeners.get(target);
    if (targetListeners) {
      const typeListeners = targetListeners.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
        
        if (typeListeners.size === 0) {
          targetListeners.delete(type);
        }
      }
      
      if (targetListeners.size === 0) {
        this.globalListeners.delete(target);
      }
    }
  }
  
  /**
   * Track timer
   */
  public trackTimer(timer: NodeJS.Timeout, componentName?: string): void {
    this.activeTimers.add(timer);
    
    if (componentName) {
      const component = this.componentMemory.get(componentName);
      if (component) {
        component.timers.add(timer);
      }
    }
  }
  
  /**
   * Untrack timer
   */
  public untrackTimer(timer: NodeJS.Timeout): void {
    this.activeTimers.delete(timer);
    
    // Remove from all components
    this.componentMemory.forEach(component => {
      component.timers.delete(timer);
    });
  }
  
  /**
   * Track observer
   */
  public trackObserver(
    observer: MutationObserver | IntersectionObserver | ResizeObserver,
    componentName?: string
  ): void {
    this.activeObservers.add(observer);
    
    if (componentName) {
      const component = this.componentMemory.get(componentName);
      if (component) {
        component.observers.add(observer);
      }
    }
  }
  
  /**
   * Untrack observer
   */
  public untrackObserver(observer: MutationObserver | IntersectionObserver | ResizeObserver): void {
    this.activeObservers.delete(observer);
    
    // Remove from all components
    this.componentMemory.forEach(component => {
      component.observers.delete(observer);
    });
  }
  
  /**
   * Detect memory leaks
   */
  public async detectLeaks(): Promise<LeakDetectionResult> {
    const snapshot = await this.takeMemorySnapshot();
    
    // Compare with previous snapshots
    if (this.memorySnapshots.length >= 2) {
      const growth = this.calculateMemoryGrowth();
      
      if (growth > this.LEAK_GROWTH_THRESHOLD_MB) {
        const source = await this.identifyLeakSource();
        
        return {
          detected: true,
          source,
          severity: this.calculateLeakSeverity(growth),
          memoryGrowth: growth,
          recommendation: this.getLeakRecommendation(source)
        };
      }
    }
    
    return {
      detected: false,
      source: null,
      severity: 'low',
      memoryGrowth: 0,
      recommendation: 'No memory leak detected'
    };
  }
  
  /**
   * Force garbage collection
   */
  public forceGarbageCollection(): void {
    if ('gc' in window) {
      (window as any).gc();
      logger.info('Forced garbage collection', undefined, 'MemoryManager');
    } else {
      // Trigger GC indirectly by creating and destroying large objects
      this.triggerIndirectGC();
    }
  }
  
  /**
   * Cleanup detached DOM nodes
   */
  public cleanupDetachedNodes(): number {
    let cleaned = 0;
    
    // Find and remove detached nodes
    const allNodes = document.querySelectorAll('*');
    allNodes.forEach(node => {
      if (!document.body.contains(node) && node.parentNode) {
        node.remove();
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} detached DOM nodes`, undefined, 'MemoryManager');
    }
    
    return cleaned;
  }
  
  /**
   * Clear unused caches
   */
  public async clearUnusedCaches(): Promise<void> {
    if (!('caches' in window)) return;
    
    const cacheNames = await caches.keys();
    const activeCaches = ['crisis-offline-v1', 'emergency-resources-v1'];
    
    for (const cacheName of cacheNames) {
      if (!activeCaches.includes(cacheName)) {
        await caches.delete(cacheName);
        logger.debug(`Deleted cache: ${cacheName}`, undefined, 'MemoryManager');
      }
    }
  }
  
  /**
   * Optimize images in memory
   */
  public optimizeImages(): void {
    const images = document.querySelectorAll('img');
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      
      // Unload images far from viewport
      if (
        rect.bottom < -viewportHeight ||
        rect.top > viewportHeight * 2 ||
        rect.right < -viewportWidth ||
        rect.left > viewportWidth * 2
      ) {
        const src = img.src;
        img.setAttribute('data-src', src);
        img.src = '';
        img.style.backgroundColor = '#f0f0f0';
      }
    });
  }
  
  /**
   * Register memory pressure callback
   */
  public onMemoryPressure(
    callback: (pressure: 'low' | 'moderate' | 'high' | 'critical') => void
  ): void {
    this.memoryPressureCallbacks.push(callback);
  }
  
  /**
   * Get memory report
   */
  public getMemoryReport(): any {
    const currentMemory = this.getCurrentMemoryUsage();
    const pressure = this.calculateMemoryPressure(currentMemory);
    
    return {
      current: {
        used: currentMemory,
        limit: this.MEMORY_LIMIT_MB,
        pressure
      },
      components: Array.from(this.componentMemory.entries()).map(([name, data]) => ({
        name,
        memory: data.currentMemory - data.memoryAtMount,
        leakDetected: data.leakDetected,
        resources: {
          listeners: data.listeners.size,
          timers: data.timers.size,
          observers: data.observers.size
        }
      })),
      global: {
        eventListeners: this.countGlobalEventListeners(),
        timers: this.activeTimers.size,
        observers: this.activeObservers.size,
        detachedNodes: this.countDetachedNodes()
      },
      snapshots: this.memorySnapshots.length,
      lastCleanup: this.getLastCleanupTime()
    };
  }
  
  /**
   * Patch global methods for tracking
   */
  private patchGlobalMethods(): void {
    // Patch addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const self = this;
    
    EventTarget.prototype.addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      self.trackEventListener(this, type, listener as EventListener);
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Patch removeEventListener
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    
    EventTarget.prototype.removeEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) {
      self.untrackEventListener(this, type, listener as EventListener);
      return originalRemoveEventListener.call(this, type, listener, options);
    };
    
    // Patch setTimeout
    const originalSetTimeout = window.setTimeout;
    
    window.setTimeout = function(
      handler: TimerHandler,
      timeout?: number,
      ...args: any[]
    ): number {
      const timer = originalSetTimeout(handler, timeout, ...args) as unknown as NodeJS.Timeout;
      self.trackTimer(timer);
      return timer as unknown as number;
    };
    
    // Patch clearTimeout
    const originalClearTimeout = window.clearTimeout;
    
    window.clearTimeout = function(id?: number) {
      if (id) {
        self.untrackTimer(id as unknown as NodeJS.Timeout);
      }
      return originalClearTimeout(id);
    };
    
    // Similar patches for setInterval/clearInterval
    const originalSetInterval = window.setInterval;
    
    window.setInterval = function(
      handler: TimerHandler,
      timeout?: number,
      ...args: any[]
    ): number {
      const timer = originalSetInterval(handler, timeout, ...args) as unknown as NodeJS.Timeout;
      self.trackTimer(timer);
      return timer as unknown as number;
    };
    
    const originalClearInterval = window.clearInterval;
    
    window.clearInterval = function(id?: number) {
      if (id) {
        self.untrackTimer(id as unknown as NodeJS.Timeout);
      }
      return originalClearInterval(id);
    };
  }
  
  /**
   * Start leak detection process
   */
  private startLeakDetection(): void {
    this.leakDetectionInterval = setInterval(async () => {
      const result = await this.detectLeaks();
      
      if (result.detected) {
        logger.warn('Memory leak detected', result, 'MemoryManager');
        
        // Attempt automatic mitigation
        this.mitigateMemoryLeak(result);
      }
    }, this.SNAPSHOT_INTERVAL_MS);
  }
  
  /**
   * Start automatic cleanup
   */
  private startAutomaticCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performAutomaticCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }
  
  /**
   * Monitor memory pressure
   */
  private monitorMemoryPressure(): void {
    setInterval(() => {
      const memory = this.getCurrentMemoryUsage();
      const pressure = this.calculateMemoryPressure(memory);
      
      // Notify callbacks
      this.memoryPressureCallbacks.forEach(callback => callback(pressure));
      
      // Take action based on pressure
      if (pressure === 'critical') {
        this.handleCriticalMemoryPressure();
      } else if (pressure === 'high') {
        this.handleHighMemoryPressure();
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Take memory snapshot
   */
  private async takeMemorySnapshot(): Promise<MemorySnapshot> {
    const memory = this.getDetailedMemoryInfo();
    
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      arrayBuffers: memory.arrayBuffers,
      domNodes: document.querySelectorAll('*').length,
      eventListeners: this.countGlobalEventListeners(),
      detachedNodes: this.detachedNodes
    };
    
    this.memorySnapshots.push(snapshot);
    
    // Keep only last 10 snapshots
    if (this.memorySnapshots.length > 10) {
      this.memorySnapshots.shift();
    }
    
    return snapshot;
  }
  
  /**
   * Get detailed memory information
   */
  private getDetailedMemoryInfo(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize / 1048576,
        heapTotal: memory.totalJSHeapSize / 1048576,
        external: 0, // Not available in browser
        arrayBuffers: 0 // Estimate based on typed arrays
      };
    }
    
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    };
  }
  
  /**
   * Calculate memory growth
   */
  private calculateMemoryGrowth(): number {
    if (this.memorySnapshots.length < 2) return 0;
    
    const recent = this.memorySnapshots[this.memorySnapshots.length - 1];
    const previous = this.memorySnapshots[this.memorySnapshots.length - 2];
    
    return recent.heapUsed - previous.heapUsed;
  }
  
  /**
   * Identify leak source
   */
  private async identifyLeakSource(): Promise<LeakSource | null> {
    const recent = this.memorySnapshots[this.memorySnapshots.length - 1];
    const previous = this.memorySnapshots[0];
    
    // Check for event listener growth
    if (recent.eventListeners > previous.eventListeners * 2) {
      return LeakSource.EVENT_LISTENERS;
    }
    
    // Check for DOM node growth
    if (recent.domNodes > previous.domNodes * 1.5) {
      return LeakSource.DOM_REFERENCES;
    }
    
    // Check for timer accumulation
    if (this.activeTimers.size > 100) {
      return LeakSource.TIMERS;
    }
    
    // Check for observer accumulation
    if (this.activeObservers.size > 50) {
      return LeakSource.OBSERVERS;
    }
    
    // Check for detached nodes
    const detachedCount = this.countDetachedNodes();
    if (detachedCount > 100) {
      return LeakSource.DETACHED_NODES;
    }
    
    return null;
  }
  
  /**
   * Calculate leak severity
   */
  private calculateLeakSeverity(growth: number): 'low' | 'medium' | 'high' | 'critical' {
    if (growth > 20) return 'critical';
    if (growth > 10) return 'high';
    if (growth > 5) return 'medium';
    return 'low';
  }
  
  /**
   * Get leak recommendation
   */
  private getLeakRecommendation(source: LeakSource | null): string {
    switch (source) {
      case LeakSource.EVENT_LISTENERS:
        return 'Remove event listeners when components unmount';
      case LeakSource.TIMERS:
        return 'Clear timers when no longer needed';
      case LeakSource.DOM_REFERENCES:
        return 'Avoid keeping references to removed DOM elements';
      case LeakSource.CLOSURES:
        return 'Be careful with closures that capture large scopes';
      case LeakSource.DETACHED_NODES:
        return 'Ensure DOM nodes are properly removed';
      case LeakSource.WEBSOCKETS:
        return 'Close WebSocket connections when done';
      case LeakSource.OBSERVERS:
        return 'Disconnect observers when no longer needed';
      case LeakSource.CACHE:
        return 'Implement cache eviction policies';
      default:
        return 'Monitor memory usage patterns';
    }
  }
  
  /**
   * Mitigate memory leak
   */
  private mitigateMemoryLeak(result: LeakDetectionResult): void {
    logger.info('Attempting to mitigate memory leak', result, 'MemoryManager');
    
    switch (result.source) {
      case LeakSource.EVENT_LISTENERS:
        this.cleanupEventListeners();
        break;
      case LeakSource.TIMERS:
        this.cleanupTimers();
        break;
      case LeakSource.DOM_REFERENCES:
        this.cleanupDetachedNodes();
        break;
      case LeakSource.OBSERVERS:
        this.cleanupObservers();
        break;
      default:
        this.performAggressiveCleanup();
    }
    
    // Force garbage collection
    this.forceGarbageCollection();
  }
  
  /**
   * Cleanup event listeners
   */
  private cleanupEventListeners(): void {
    let cleaned = 0;
    
    this.globalListeners.forEach((types, target) => {
      // Check if target is still in DOM
      if (target instanceof Node && !document.body.contains(target)) {
        types.forEach((listeners, type) => {
          listeners.forEach(listener => {
            target.removeEventListener(type, listener);
            cleaned++;
          });
        });
        this.globalListeners.delete(target);
      }
    });
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} event listeners`, undefined, 'MemoryManager');
    }
  }
  
  /**
   * Cleanup timers
   */
  private cleanupTimers(): void {
    let cleaned = 0;
    
    this.activeTimers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
      cleaned++;
    });
    
    this.activeTimers.clear();
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} timers`, undefined, 'MemoryManager');
    }
  }
  
  /**
   * Cleanup observers
   */
  private cleanupObservers(): void {
    let cleaned = 0;
    
    this.activeObservers.forEach(observer => {
      if ('disconnect' in observer) {
        observer.disconnect();
        cleaned++;
      }
    });
    
    this.activeObservers.clear();
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} observers`, undefined, 'MemoryManager');
    }
  }
  
  /**
   * Cleanup component resources
   */
  private cleanupComponentResources(component: ComponentMemory): void {
    // Clear event listeners
    component.listeners.clear();
    
    // Clear timers
    component.timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    component.timers.clear();
    
    // Disconnect observers
    component.observers.forEach(observer => {
      if ('disconnect' in observer) {
        observer.disconnect();
      }
    });
    component.observers.clear();
  }
  
  /**
   * Perform automatic cleanup
   */
  private performAutomaticCleanup(): void {
    // Cleanup detached nodes
    this.cleanupDetachedNodes();
    
    // Optimize images
    this.optimizeImages();
    
    // Clear unused caches
    this.clearUnusedCaches();
    
    // Check component memory
    this.componentMemory.forEach((component, name) => {
      const currentMemory = this.getCurrentMemoryUsage();
      component.currentMemory = currentMemory;
      
      // Check for potential leaks
      const growth = currentMemory - component.memoryAtMount;
      if (growth > this.LEAK_GROWTH_THRESHOLD_MB && component.mounted) {
        component.leakDetected = true;
        logger.warn(`Potential leak in component: ${name}`, { growth }, 'MemoryManager');
      }
    });
  }
  
  /**
   * Perform aggressive cleanup
   */
  private performAggressiveCleanup(): void {
    logger.warn('Performing aggressive memory cleanup', undefined, 'MemoryManager');
    
    // Clear all non-essential resources
    this.cleanupEventListeners();
    this.cleanupTimers();
    this.cleanupObservers();
    this.cleanupDetachedNodes();
    this.optimizeImages();
    this.clearUnusedCaches();
    
    // Clear component resources
    this.componentMemory.forEach(component => {
      if (!component.mounted) {
        this.cleanupComponentResources(component);
      }
    });
    
    // Force garbage collection
    this.forceGarbageCollection();
  }
  
  /**
   * Handle critical memory pressure
   */
  private handleCriticalMemoryPressure(): void {
    logger.error('Critical memory pressure detected', undefined, 'MemoryManager');
    
    // Perform emergency cleanup
    this.performAggressiveCleanup();
    
    // Notify application
    window.dispatchEvent(new CustomEvent('memorypressure', {
      detail: { level: 'critical' }
    }));
  }
  
  /**
   * Handle high memory pressure
   */
  private handleHighMemoryPressure(): void {
    logger.warn('High memory pressure detected', undefined, 'MemoryManager');
    
    // Perform standard cleanup
    this.performAutomaticCleanup();
    
    // Notify application
    window.dispatchEvent(new CustomEvent('memorypressure', {
      detail: { level: 'high' }
    }));
  }
  
  /**
   * Trigger indirect garbage collection
   */
  private triggerIndirectGC(): void {
    // Create and destroy large objects to trigger GC
    const arrays = [];
    for (let i = 0; i < 100; i++) {
      arrays.push(new Array(10000).fill(Math.random()));
    }
    arrays.length = 0; // Clear references
  }
  
  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1048576);
    }
    return 0;
  }
  
  /**
   * Calculate memory pressure
   */
  private calculateMemoryPressure(memoryMB: number): 'low' | 'moderate' | 'high' | 'critical' {
    const ratio = memoryMB / this.MEMORY_LIMIT_MB;
    
    if (ratio > 0.9) return 'critical';
    if (ratio > 0.8) return 'high';
    if (ratio > 0.6) return 'moderate';
    return 'low';
  }
  
  /**
   * Count global event listeners
   */
  private countGlobalEventListeners(): number {
    let count = 0;
    this.globalListeners.forEach(types => {
      types.forEach(listeners => {
        count += listeners.size;
      });
    });
    return count;
  }
  
  /**
   * Count detached nodes
   */
  private countDetachedNodes(): number {
    // This is an approximation as WeakSet doesn't have size
    const allNodes = document.querySelectorAll('*');
    let detached = 0;
    
    allNodes.forEach(node => {
      if (!document.body.contains(node)) {
        detached++;
      }
    });
    
    return detached;
  }
  
  /**
   * Get last cleanup time
   */
  private getLastCleanupTime(): string {
    if (this.memorySnapshots.length > 0) {
      const lastSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
      return new Date(lastSnapshot.timestamp).toISOString();
    }
    return 'Never';
  }
}

// Export singleton instance
export const mobileMemoryManager = MobileMemoryManagerService.getInstance();

// Export for use in other modules
export default mobileMemoryManager;