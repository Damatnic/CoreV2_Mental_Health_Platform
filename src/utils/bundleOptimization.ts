/**
 * Bundle Optimization Utilities
 *
 * Advanced bundle analysis and optimization utilities for mobile performance.
 * Provides runtime bundle monitoring, chunk loading optimization, and memory management
 * with comprehensive performance tracking and adaptive loading strategies.
 * 
 * @fileoverview Bundle optimization and performance monitoring utilities
 * @version 2.0.0
 */

/**
 * Bundle metrics interface
 */
export interface BundleMetrics {
  totalSize: number;
  loadTime: number;
  chunkCount: number;
  duplicateModules: string[];
  largestChunks: Array<{ name: string; size: number }>;
  unusedCode: number;
  memoryImpact: number;
}

/**
 * Chunk loading strategy types
 */
export type ChunkLoadingStrategy = 'eager' | 'lazy' | 'prefetch' | 'preload';

/**
 * Chunk registry entry
 */
export interface ChunkRegistryEntry {
  loaded: boolean;
  loading: boolean;
  size: number;
  loadTime: number;
  error?: Error;
}

/**
 * Bundle analyzer class for performance monitoring
 */
export class BundleAnalyzer {
  private static metrics: BundleMetrics = {
    totalSize: 0,
    loadTime: 0,
    chunkCount: 0,
    duplicateModules: [],
    largestChunks: [],
    unusedCode: 0,
    memoryImpact: 0
  };

  private static chunkRegistry = new Map<string, ChunkRegistryEntry>();

  /**
   * Analyze bundle performance
   */
  public static async analyzeBundlePerformance(): Promise<BundleMetrics> {
    if (process.env.NODE_ENV !== 'development') {
      return this.metrics;
    }

    const startTime = performance.now();
    const initialMemory = this.getMemoryUsage();

    try {
      // Analyze chunk loading performance
      await this.analyzeChunkPerformance();

      // Detect duplicate modules
      this.detectDuplicateModules();

      // Calculate unused code
      this.calculateUnusedCode();

      const endTime = performance.now();
      const finalMemory = this.getMemoryUsage();

      this.metrics = {
        ...this.metrics,
        loadTime: endTime - startTime,
        memoryImpact: finalMemory - initialMemory
      };

      this.logAnalysisResults();
      return this.metrics;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      return this.metrics;
    }
  }

  /**
   * Analyze chunk loading performance
   */
  private static async analyzeChunkPerformance(): Promise<void> {
    const chunks = this.getLoadedChunks();
    this.metrics.chunkCount = chunks.length;

    let totalSize = 0;
    const chunkSizes: Array<{ name: string; size: number }> = [];

    for (const chunk of chunks) {
      try {
        const size = await this.getChunkSize(chunk);
        totalSize += size;
        chunkSizes.push({ name: chunk, size });

        this.chunkRegistry.set(chunk, {
          loaded: true,
          loading: false,
          size,
          loadTime: 0
        });
      } catch (error) {
        console.warn(`Failed to analyze chunk ${chunk}:`, error);
      }
    }

    this.metrics.totalSize = totalSize;
    this.metrics.largestChunks = chunkSizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
  }

  /**
   * Get loaded chunks from webpack or fallback
   */
  private static getLoadedChunks(): string[] {
    // Check if webpack is available
    try {
      const windowWithWebpack = window as any & { 
        __webpack_require__?: { cache?: Record<string, any> } 
      };
      
      if (typeof windowWithWebpack.__webpack_require__ !== 'undefined') {
        const webpackChunks = windowWithWebpack.__webpack_require__.cache || {};
        return Object.keys(webpackChunks);
      }
    } catch {
      // Continue to fallback
    }

    // Fallback for non-webpack environments
    const scripts = Array.from(document.scripts);
    return scripts
      .filter(script => script.src.includes('chunk') || script.src.includes('bundle'))
      .map(script => script.src.split('/').pop() || 'unknown');
  }

  /**
   * Estimate chunk size
   */
  private static async getChunkSize(chunkName: string): Promise<number> {
    try {
      // Try to fetch chunk headers to get size
      const response = await fetch(chunkName, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      // Fallback to approximate size estimation
      return this.estimateChunkSize(chunkName);
    }
  }

  /**
   * Estimate chunk size based on script content
   */
  private static estimateChunkSize(chunkName: string): number {
    const script = Array.from(document.scripts).find(s =>
      s.src.includes(chunkName) || s.src.endsWith(chunkName)
    );

    if (script && script.textContent) {
      return new Blob([script.textContent]).size;
    }

    return 0;
  }

  /**
   * Detect duplicate modules (simplified)
   */
  private static detectDuplicateModules(): void {
    // This is a simplified implementation
    // In a real app, you'd analyze webpack module registry

    // Analyze global objects that might indicate duplicates
    const globalKeys = Object.keys(window);
    const potentialDuplicates = globalKeys.filter(key =>
      key.includes('react') ||
      key.includes('lodash') ||
      key.includes('moment')
    );

    this.metrics.duplicateModules = potentialDuplicates;
  }

  /**
   * Calculate unused code percentage
   */
  private static calculateUnusedCode(): void {
    const windowWithCoverage = window as any & { coverage?: any };
    
    if ('coverage' in windowWithCoverage && windowWithCoverage.coverage) {
      const coverage = windowWithCoverage.coverage;
      let totalLines = 0;
      let coveredLines = 0;

      Object.values(coverage).forEach((fileCoverage: any) => {
        const statements = fileCoverage.s || {};
        totalLines += Object.keys(statements).length;
        coveredLines += Object.values(statements).filter(Boolean).length;
      });

      this.metrics.unusedCode = totalLines > 0 ?
        ((totalLines - coveredLines) / totalLines) * 100 : 0;
    }
  }

  /**
   * Get current memory usage
   */
  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      const performanceWithMemory = performance as Performance & { 
        memory?: { usedJSHeapSize: number } 
      };
      return performanceWithMemory.memory!.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Log analysis results
   */
  private static logAnalysisResults(): void {
    console.group('📊 Bundle Analysis Results');
    console.log(`📦 Total Bundle Size: ${(this.metrics.totalSize / 1024).toFixed(2)} KB`);
    console.log(`⏱️ Load Time: ${this.metrics.loadTime.toFixed(2)}ms`);
    console.log(`🧩 Chunk Count: ${this.metrics.chunkCount}`);
    console.log(`💾 Memory Impact: ${this.metrics.memoryImpact.toFixed(2)} MB`);
    console.log(`🗑️ Unused Code: ${this.metrics.unusedCode.toFixed(1)}%`);

    if (this.metrics.largestChunks.length > 0) {
      console.log('📈 Largest Chunks:');
      this.metrics.largestChunks.forEach(chunk => {
        console.log(`  - ${chunk.name}: ${(chunk.size / 1024).toFixed(2)} KB`);
      });
    }

    if (this.metrics.duplicateModules.length > 0) {
      console.log('⚠️ Potential Duplicates:', this.metrics.duplicateModules);
    }

    console.groupEnd();
  }

  /**
   * Get current metrics
   */
  public static getMetrics(): BundleMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing)
   */
  public static resetMetrics(): void {
    this.metrics = {
      totalSize: 0,
      loadTime: 0,
      chunkCount: 0,
      duplicateModules: [],
      largestChunks: [],
      unusedCode: 0,
      memoryImpact: 0
    };
    this.chunkRegistry.clear();
  }

  /**
   * Register chunk loading
   */
  public static registerChunkLoad(chunkName: string, startTime: number): void {
    this.chunkRegistry.set(chunkName, {
      loaded: false,
      loading: true,
      size: 0,
      loadTime: startTime
    });
  }

  /**
   * Mark chunk as loaded
   */
  public static markChunkLoaded(chunkName: string, endTime: number): void {
    const chunk = this.chunkRegistry.get(chunkName);
    if (chunk) {
      chunk.loaded = true;
      chunk.loading = false;
      chunk.loadTime = endTime - chunk.loadTime;
    }
  }

  /**
   * Mark chunk as failed
   */
  public static markChunkFailed(chunkName: string, error: Error): void {
    const chunk = this.chunkRegistry.get(chunkName);
    if (chunk) {
      chunk.loading = false;
      chunk.error = error;
    }
  }

  /**
   * Get chunk status
   */
  public static getChunkStatus(chunkName: string): ChunkRegistryEntry | undefined {
    return this.chunkRegistry.get(chunkName);
  }
}

/**
 * Chunk loading optimizer
 */
export class ChunkLoadingOptimizer {
  private static strategy: ChunkLoadingStrategy = 'lazy';
  private static priorityQueue: Array<{ chunk: string; priority: number }> = [];
  private static loadingChunks = new Set<string>();
  private static maxConcurrentLoads = 3;

  /**
   * Set loading strategy
   */
  public static setStrategy(strategy: ChunkLoadingStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Optimize chunk loading based on user behavior
   */
  public static optimizeChunkLoading(): void {
    // Preload critical chunks
    this.preloadCriticalChunks();

    // Prefetch likely-needed chunks
    this.prefetchLikelyChunks();

    // Clean up unused chunks
    this.cleanupUnusedChunks();
  }

  /**
   * Preload critical chunks
   */
  private static preloadCriticalChunks(): void {
    const criticalChunks = [
      'vendors',  // Third-party libraries
      'common',   // Shared code
      'runtime'   // Webpack runtime
    ];

    criticalChunks.forEach(chunk => {
      this.loadChunk(chunk);
    });
  }

  /**
   * Prefetch likely chunks based on current route
   */
  private static prefetchLikelyChunks(): void {
    const currentPath = window.location.pathname;
    const likelyChunks = this.getLikelyChunks(currentPath);

    likelyChunks.forEach(chunk => {
      this.loadChunk(chunk);
    });
  }

  /**
   * Get likely chunks based on navigation patterns
   */
  private static getLikelyChunks(currentPath: string): string[] {
    // Simple heuristics for likely chunks
    const chunkMap: Record<string, string[]> = {
      '/': ['feed', 'chat', 'dashboard'],
      '/chat': ['messages', 'user-profile'],
      '/dashboard': ['analytics', 'settings'],
      '/admin': ['admin-tools', 'user-management']
    };

    return chunkMap[currentPath] || [];
  }

  /**
   * Load chunk with error handling
   */
  private static async loadChunk(chunkName: string): Promise<void> {
    if (this.loadingChunks.has(chunkName)) {
      return; // Already loading
    }

    if (this.loadingChunks.size >= this.maxConcurrentLoads) {
      // Queue for later
      this.priorityQueue.push({ chunk: chunkName, priority: 1 });
      return;
    }

    this.loadingChunks.add(chunkName);
    const startTime = performance.now();
    BundleAnalyzer.registerChunkLoad(chunkName, startTime);

    try {
      // Simulate chunk loading (replace with actual webpack import)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      BundleAnalyzer.markChunkLoaded(chunkName, endTime);

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Loaded chunk ${chunkName} in ${(endTime - startTime).toFixed(2)}ms`);
      }
    } catch (error) {
      BundleAnalyzer.markChunkFailed(chunkName, error as Error);
      console.warn(`❌ Failed to load chunk ${chunkName}:`, error);
    } finally {
      this.loadingChunks.delete(chunkName);
      this.processQueue();
    }
  }

  /**
   * Process queued chunks
   */
  private static processQueue(): void {
    if (this.priorityQueue.length === 0) return;
    if (this.loadingChunks.size >= this.maxConcurrentLoads) return;

    // Sort by priority and load next chunk
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
    const next = this.priorityQueue.shift();

    if (next) {
      this.loadChunk(next.chunk);
    }
  }

  /**
   * Clean up unused chunks
   */
  private static cleanupUnusedChunks(): void {
    // This would typically involve analyzing which chunks haven't been used
    // and removing them from memory if possible
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning up unused chunks...');
    }
  }

  /**
   * Get loading statistics
   */
  public static getLoadingStats() {
    return {
      strategy: this.strategy,
      queueLength: this.priorityQueue.length,
      loadingCount: this.loadingChunks.size,
      maxConcurrent: this.maxConcurrentLoads
    };
  }
}

/**
 * Memory optimizer for mobile devices
 */
export class MobileMemoryOptimizer {
  private static memoryThreshold = 50; // MB
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Start memory monitoring
   */
  public static startMonitoring(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop memory monitoring
   */
  public static stopMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Check memory usage and cleanup if necessary
   */
  private static checkMemoryUsage(): void {
    const memoryUsage = this.getCurrentMemoryUsage();

    if (memoryUsage > this.memoryThreshold) {
      this.performCleanup();
    }
  }

  /**
   * Get current memory usage for monitoring
   */
  public static getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const performanceWithMemory = performance as Performance & { 
        memory?: { usedJSHeapSize: number } 
      };
      const memory = performanceWithMemory.memory;
      return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // Convert to MB
    }
    return 0;
  }

  /**
   * Perform memory cleanup
   */
  private static performCleanup(): void {
    // Force garbage collection if available
    const windowWithGC = window as any & { gc?: () => void };
    if ('gc' in windowWithGC && windowWithGC.gc) {
      windowWithGC.gc();
    }

    // Clear unused image caches
    this.clearImageCaches();

    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Performed memory cleanup');
    }
  }

  /**
   * Clear image caches
   */
  private static clearImageCaches(): void {
    // Remove unused images from DOM
    const images = document.querySelectorAll('img[data-cached="true"]');
    images.forEach(img => {
      if (!this.isElementInViewport(img as HTMLElement)) {
        img.remove();
      }
    });
  }

  /**
   * Check if element is in viewport
   */
  private static isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get memory statistics
   */
  public static getMemoryStats() {
    return {
      currentUsage: this.getCurrentMemoryUsage(),
      threshold: this.memoryThreshold,
      monitoring: this.cleanupInterval !== null
    };
  }
}

/**
 * Initialize bundle optimization
 */
export const initializeBundleOptimization = () => {
  // Start memory monitoring on mobile devices
  if (window.innerWidth <= 768) {
    MobileMemoryOptimizer.startMonitoring();
  }

  // Optimize chunk loading
  ChunkLoadingOptimizer.optimizeChunkLoading();

  // Analyze bundle performance in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      BundleAnalyzer.analyzeBundlePerformance();
    }, 2000);
  }
};

// Default export with all utilities
export default {
  BundleAnalyzer,
  ChunkLoadingOptimizer,
  MobileMemoryOptimizer,
  initializeBundleOptimization
};
