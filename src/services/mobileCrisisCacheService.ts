/**
 * Mobile Crisis Cache Service
 * 
 * Intelligent caching system for crisis resources with offline-first approach,
 * smart preloading, and network-aware strategies.
 * 
 * @version 2.0.0
 * @priority CRITICAL
 */

import { logger } from '../utils/logger';

/**
 * Cache priority levels for different resource types
 */
export enum CachePriority {
  CRITICAL = 'critical',     // Crisis hotlines, emergency contacts
  HIGH = 'high',             // Breathing exercises, grounding techniques
  MEDIUM = 'medium',         // Safety plans, coping strategies
  LOW = 'low'                // General resources, articles
}

/**
 * Cache strategy types
 */
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',           // Serve from cache, update in background
  NETWORK_FIRST = 'network-first',       // Try network, fallback to cache
  CACHE_ONLY = 'cache-only',              // Only serve from cache
  NETWORK_ONLY = 'network-only',         // Only serve from network
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate' // Serve cache, update for next time
}

/**
 * Crisis resource types
 */
export interface CrisisResource {
  url: string;
  priority: CachePriority;
  type: 'hotline' | 'exercise' | 'technique' | 'plan' | 'contact' | 'article';
  expiresIn?: number; // Hours
  preload: boolean;
  offline: boolean; // Must be available offline
}

/**
 * Cache metadata
 */
interface CacheMetadata {
  url: string;
  cachedAt: number;
  expiresAt: number;
  size: number;
  priority: CachePriority;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  missRate: number;
  criticalResourcesCached: number;
  offlineReadiness: boolean;
  lastUpdate: number;
}

/**
 * Mobile Crisis Cache Service
 */
export class MobileCrisisCacheService {
  private static instance: MobileCrisisCacheService;
  private readonly CACHE_NAME = 'crisis-cache-v2';
  private readonly METADATA_STORE = 'crisis-cache-metadata';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CRITICAL_RESOURCES: CrisisResource[] = [
    // Emergency hotlines
    { url: '/api/crisis/hotlines/988', priority: CachePriority.CRITICAL, type: 'hotline', preload: true, offline: true },
    { url: '/api/crisis/hotlines/911', priority: CachePriority.CRITICAL, type: 'hotline', preload: true, offline: true },
    { url: '/api/crisis/hotlines/text-741741', priority: CachePriority.CRITICAL, type: 'hotline', preload: true, offline: true },
    
    // Breathing exercises
    { url: '/api/exercises/breathing/4-7-8', priority: CachePriority.HIGH, type: 'exercise', preload: true, offline: true },
    { url: '/api/exercises/breathing/box', priority: CachePriority.HIGH, type: 'exercise', preload: true, offline: true },
    { url: '/api/exercises/breathing/belly', priority: CachePriority.HIGH, type: 'exercise', preload: true, offline: true },
    
    // Grounding techniques
    { url: '/api/techniques/grounding/5-4-3-2-1', priority: CachePriority.HIGH, type: 'technique', preload: true, offline: true },
    { url: '/api/techniques/grounding/body-scan', priority: CachePriority.HIGH, type: 'technique', preload: true, offline: true },
    
    // Safety plan template
    { url: '/api/safety-plan/template', priority: CachePriority.MEDIUM, type: 'plan', preload: true, offline: true },
    
    // Emergency contacts
    { url: '/api/contacts/emergency', priority: CachePriority.CRITICAL, type: 'contact', preload: true, offline: true }
  ];
  
  private cacheMetadata: Map<string, CacheMetadata> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private isInitialized = false;
  private preloadQueue: CrisisResource[] = [];
  private preloadInProgress = false;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MobileCrisisCacheService {
    if (!MobileCrisisCacheService.instance) {
      MobileCrisisCacheService.instance = new MobileCrisisCacheService();
    }
    return MobileCrisisCacheService.instance;
  }
  
  /**
   * Initialize the cache service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing Mobile Crisis Cache Service', undefined, 'CrisisCache');
      
      // Load metadata from localStorage
      this.loadMetadata();
      
      // Ensure critical resources are cached
      await this.ensureCriticalResourcesCached();
      
      // Start preloading queue
      this.startPreloadQueue();
      
      // Setup cache maintenance
      this.setupCacheMaintenance();
      
      // Monitor network changes
      this.monitorNetworkChanges();
      
      this.isInitialized = true;
      logger.info('Mobile Crisis Cache Service initialized', this.getStatistics(), 'CrisisCache');
      
    } catch (error) {
      logger.error('Failed to initialize Mobile Crisis Cache Service', error, 'CrisisCache');
      throw error;
    }
  }
  
  /**
   * Cache a resource with strategy
   */
  public async cacheResource(
    url: string,
    priority: CachePriority = CachePriority.LOW,
    strategy: CacheStrategy = CacheStrategy.STALE_WHILE_REVALIDATE
  ): Promise<Response | null> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      
      // Apply strategy
      switch (strategy) {
        case CacheStrategy.CACHE_FIRST:
          return await this.cacheFirst(cache, url, priority);
          
        case CacheStrategy.NETWORK_FIRST:
          return await this.networkFirst(cache, url, priority);
          
        case CacheStrategy.CACHE_ONLY:
          return await this.cacheOnly(cache, url);
          
        case CacheStrategy.NETWORK_ONLY:
          return await this.networkOnly(url);
          
        case CacheStrategy.STALE_WHILE_REVALIDATE:
          return await this.staleWhileRevalidate(cache, url, priority);
          
        default:
          return await this.networkFirst(cache, url, priority);
      }
      
    } catch (error) {
      logger.error('Failed to cache resource', { url, error }, 'CrisisCache');
      return null;
    }
  }
  
  /**
   * Get resource from cache
   */
  public async getFromCache(url: string): Promise<Response | null> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const response = await cache.match(url);
      
      if (response) {
        this.cacheHits++;
        this.updateAccessMetadata(url);
        return response;
      }
      
      this.cacheMisses++;
      return null;
      
    } catch (error) {
      logger.error('Failed to get from cache', { url, error }, 'CrisisCache');
      return null;
    }
  }
  
  /**
   * Preload critical resources
   */
  public async preloadCriticalResources(): Promise<void> {
    logger.info('Preloading critical crisis resources', undefined, 'CrisisCache');
    
    const critical = this.CRITICAL_RESOURCES.filter(r => 
      r.priority === CachePriority.CRITICAL && r.preload
    );
    
    for (const resource of critical) {
      await this.preloadResource(resource);
    }
  }
  
  /**
   * Clear expired cache entries
   */
  public async clearExpiredCache(): Promise<number> {
    const cache = await caches.open(this.CACHE_NAME);
    const now = Date.now();
    let cleared = 0;
    
    for (const [url, metadata] of this.cacheMetadata.entries()) {
      if (metadata.expiresAt < now && metadata.priority !== CachePriority.CRITICAL) {
        await cache.delete(url);
        this.cacheMetadata.delete(url);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      this.saveMetadata();
      logger.info(`Cleared ${cleared} expired cache entries`, undefined, 'CrisisCache');
    }
    
    return cleared;
  }
  
  /**
   * Optimize cache for network conditions
   */
  public async optimizeForNetwork(networkType: 'slow' | 'fast' | 'offline'): Promise<void> {
    logger.info(`Optimizing cache for ${networkType} network`, undefined, 'CrisisCache');
    
    switch (networkType) {
      case 'offline':
        // Ensure all critical resources are cached
        await this.ensureCriticalResourcesCached();
        await this.cacheHighPriorityResources();
        break;
        
      case 'slow':
        // Cache essential resources only
        await this.ensureCriticalResourcesCached();
        // Clear low priority items to save space
        await this.clearLowPriorityCache();
        break;
        
      case 'fast':
        // Preload all resources
        await this.preloadAllResources();
        break;
    }
  }
  
  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    const totalSize = Array.from(this.cacheMetadata.values())
      .reduce((sum, meta) => sum + meta.size, 0);
    
    const criticalCached = Array.from(this.cacheMetadata.values())
      .filter(meta => meta.priority === CachePriority.CRITICAL)
      .length;
    
    const totalRequests = this.cacheHits + this.cacheMisses;
    
    return {
      totalSize,
      itemCount: this.cacheMetadata.size,
      hitRate: totalRequests > 0 ? this.cacheHits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.cacheMisses / totalRequests : 0,
      criticalResourcesCached: criticalCached,
      offlineReadiness: this.checkOfflineReadiness(),
      lastUpdate: Math.max(...Array.from(this.cacheMetadata.values()).map(m => m.cachedAt))
    };
  }
  
  /**
   * Cache first strategy
   */
  private async cacheFirst(
    cache: Cache,
    url: string,
    priority: CachePriority
  ): Promise<Response | null> {
    // Check cache first
    const cached = await cache.match(url);
    if (cached) {
      this.cacheHits++;
      this.updateAccessMetadata(url);
      
      // Update in background if stale
      if (this.isStale(url)) {
        this.updateInBackground(cache, url, priority);
      }
      
      return cached;
    }
    
    // Fallback to network
    return await this.fetchAndCache(cache, url, priority);
  }
  
  /**
   * Network first strategy
   */
  private async networkFirst(
    cache: Cache,
    url: string,
    priority: CachePriority
  ): Promise<Response | null> {
    try {
      // Try network with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        // Cache the response
        await this.cacheResponse(cache, url, response.clone(), priority);
        return response;
      }
    } catch (error) {
      // Network failed, try cache
      logger.debug('Network failed, falling back to cache', { url }, 'CrisisCache');
    }
    
    // Fallback to cache
    const cached = await cache.match(url);
    if (cached) {
      this.cacheHits++;
      this.updateAccessMetadata(url);
      return cached;
    }
    
    this.cacheMisses++;
    return null;
  }
  
  /**
   * Cache only strategy
   */
  private async cacheOnly(cache: Cache, url: string): Promise<Response | null> {
    const cached = await cache.match(url);
    
    if (cached) {
      this.cacheHits++;
      this.updateAccessMetadata(url);
      return cached;
    }
    
    this.cacheMisses++;
    return null;
  }
  
  /**
   * Network only strategy
   */
  private async networkOnly(url: string): Promise<Response | null> {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      return response.ok ? response : null;
    } catch (error) {
      logger.error('Network request failed', { url, error }, 'CrisisCache');
      return null;
    }
  }
  
  /**
   * Stale while revalidate strategy
   */
  private async staleWhileRevalidate(
    cache: Cache,
    url: string,
    priority: CachePriority
  ): Promise<Response | null> {
    const cached = await cache.match(url);
    
    if (cached) {
      this.cacheHits++;
      this.updateAccessMetadata(url);
      
      // Update in background
      this.updateInBackground(cache, url, priority);
      
      return cached;
    }
    
    // No cache, fetch from network
    return await this.fetchAndCache(cache, url, priority);
  }
  
  /**
   * Fetch and cache a resource
   */
  private async fetchAndCache(
    cache: Cache,
    url: string,
    priority: CachePriority
  ): Promise<Response | null> {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        await this.cacheResponse(cache, url, response.clone(), priority);
        return response;
      }
      
      this.cacheMisses++;
      return null;
      
    } catch (error) {
      logger.error('Failed to fetch and cache', { url, error }, 'CrisisCache');
      this.cacheMisses++;
      return null;
    }
  }
  
  /**
   * Cache a response
   */
  private async cacheResponse(
    cache: Cache,
    url: string,
    response: Response,
    priority: CachePriority
  ): Promise<void> {
    try {
      // Check cache size before adding
      if (await this.checkCacheSize()) {
        await cache.put(url, response);
        
        // Update metadata
        const size = parseInt(response.headers.get('content-length') || '0');
        const metadata: CacheMetadata = {
          url,
          cachedAt: Date.now(),
          expiresAt: this.calculateExpiry(priority),
          size,
          priority,
          accessCount: 0,
          lastAccessed: Date.now()
        };
        
        this.cacheMetadata.set(url, metadata);
        this.saveMetadata();
      }
    } catch (error) {
      logger.error('Failed to cache response', { url, error }, 'CrisisCache');
    }
  }
  
  /**
   * Update resource in background
   */
  private async updateInBackground(
    cache: Cache,
    url: string,
    priority: CachePriority
  ): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await this.cacheResponse(cache, url, response, priority);
      }
    } catch (error) {
      // Silent fail - we have cache to fall back on
      logger.debug('Background update failed', { url }, 'CrisisCache');
    }
  }
  
  /**
   * Preload a resource
   */
  private async preloadResource(resource: CrisisResource): Promise<void> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      
      // Check if already cached and fresh
      const existing = await cache.match(resource.url);
      if (existing && !this.isStale(resource.url)) {
        return;
      }
      
      // Fetch and cache
      const response = await fetch(resource.url);
      if (response.ok) {
        await this.cacheResponse(cache, resource.url, response, resource.priority);
        logger.debug(`Preloaded resource: ${resource.url}`, undefined, 'CrisisCache');
      }
      
    } catch (error) {
      logger.error('Failed to preload resource', { url: resource.url, error }, 'CrisisCache');
    }
  }
  
  /**
   * Ensure critical resources are cached
   */
  private async ensureCriticalResourcesCached(): Promise<void> {
    const critical = this.CRITICAL_RESOURCES.filter(r => 
      r.priority === CachePriority.CRITICAL && r.offline
    );
    
    for (const resource of critical) {
      const cached = await this.getFromCache(resource.url);
      if (!cached) {
        await this.preloadResource(resource);
      }
    }
  }
  
  /**
   * Cache high priority resources
   */
  private async cacheHighPriorityResources(): Promise<void> {
    const highPriority = this.CRITICAL_RESOURCES.filter(r => 
      r.priority === CachePriority.HIGH && r.offline
    );
    
    for (const resource of highPriority) {
      await this.preloadResource(resource);
    }
  }
  
  /**
   * Preload all resources
   */
  private async preloadAllResources(): Promise<void> {
    for (const resource of this.CRITICAL_RESOURCES) {
      if (resource.preload) {
        this.preloadQueue.push(resource);
      }
    }
    
    this.processPreloadQueue();
  }
  
  /**
   * Start preload queue processing
   */
  private startPreloadQueue(): void {
    setInterval(() => {
      if (!this.preloadInProgress && this.preloadQueue.length > 0) {
        this.processPreloadQueue();
      }
    }, 5000); // Process every 5 seconds
  }
  
  /**
   * Process preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.preloadInProgress || this.preloadQueue.length === 0) return;
    
    this.preloadInProgress = true;
    
    while (this.preloadQueue.length > 0) {
      const resource = this.preloadQueue.shift();
      if (resource) {
        await this.preloadResource(resource);
        
        // Small delay between preloads to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.preloadInProgress = false;
  }
  
  /**
   * Setup cache maintenance
   */
  private setupCacheMaintenance(): void {
    // Clear expired cache every hour
    setInterval(() => {
      this.clearExpiredCache();
    }, 3600000);
    
    // Optimize cache based on available space
    setInterval(() => {
      this.optimizeCacheSpace();
    }, 1800000); // Every 30 minutes
  }
  
  /**
   * Monitor network changes
   */
  private monitorNetworkChanges(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.optimizeForNetwork('slow');
        } else if (effectiveType === '4g' || effectiveType === '5g') {
          this.optimizeForNetwork('fast');
        }
      });
    }
    
    // Monitor online/offline
    window.addEventListener('online', () => {
      this.optimizeForNetwork('fast');
    });
    
    window.addEventListener('offline', () => {
      this.optimizeForNetwork('offline');
    });
  }
  
  /**
   * Check if resource is stale
   */
  private isStale(url: string): boolean {
    const metadata = this.cacheMetadata.get(url);
    if (!metadata) return true;
    
    return Date.now() > metadata.expiresAt;
  }
  
  /**
   * Calculate expiry time based on priority
   */
  private calculateExpiry(priority: CachePriority): number {
    const now = Date.now();
    
    switch (priority) {
      case CachePriority.CRITICAL:
        return now + (7 * 24 * 60 * 60 * 1000); // 7 days
      case CachePriority.HIGH:
        return now + (3 * 24 * 60 * 60 * 1000); // 3 days
      case CachePriority.MEDIUM:
        return now + (24 * 60 * 60 * 1000); // 1 day
      case CachePriority.LOW:
        return now + (6 * 60 * 60 * 1000); // 6 hours
      default:
        return now + (60 * 60 * 1000); // 1 hour
    }
  }
  
  /**
   * Update access metadata
   */
  private updateAccessMetadata(url: string): void {
    const metadata = this.cacheMetadata.get(url);
    if (metadata) {
      metadata.accessCount++;
      metadata.lastAccessed = Date.now();
      this.cacheMetadata.set(url, metadata);
    }
  }
  
  /**
   * Check cache size
   */
  private async checkCacheSize(): Promise<boolean> {
    const totalSize = Array.from(this.cacheMetadata.values())
      .reduce((sum, meta) => sum + meta.size, 0);
    
    if (totalSize >= this.MAX_CACHE_SIZE) {
      // Clear least recently used items
      await this.clearLRUCache();
    }
    
    return totalSize < this.MAX_CACHE_SIZE;
  }
  
  /**
   * Clear least recently used cache
   */
  private async clearLRUCache(): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    
    // Sort by last accessed, keep critical items
    const sortedMetadata = Array.from(this.cacheMetadata.entries())
      .filter(([_, meta]) => meta.priority !== CachePriority.CRITICAL)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 20% of non-critical items
    const toRemove = Math.floor(sortedMetadata.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      const [url] = sortedMetadata[i];
      await cache.delete(url);
      this.cacheMetadata.delete(url);
    }
    
    this.saveMetadata();
  }
  
  /**
   * Clear low priority cache
   */
  private async clearLowPriorityCache(): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    
    for (const [url, metadata] of this.cacheMetadata.entries()) {
      if (metadata.priority === CachePriority.LOW) {
        await cache.delete(url);
        this.cacheMetadata.delete(url);
      }
    }
    
    this.saveMetadata();
  }
  
  /**
   * Optimize cache space
   */
  private async optimizeCacheSpace(): Promise<void> {
    // Clear expired entries
    await this.clearExpiredCache();
    
    // Check total size
    const totalSize = Array.from(this.cacheMetadata.values())
      .reduce((sum, meta) => sum + meta.size, 0);
    
    if (totalSize > this.MAX_CACHE_SIZE * 0.8) {
      // Cache is getting full, clear LRU
      await this.clearLRUCache();
    }
  }
  
  /**
   * Check offline readiness
   */
  private checkOfflineReadiness(): boolean {
    const criticalResources = this.CRITICAL_RESOURCES.filter(r => 
      r.priority === CachePriority.CRITICAL && r.offline
    );
    
    for (const resource of criticalResources) {
      if (!this.cacheMetadata.has(resource.url)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Load metadata from localStorage
   */
  private loadMetadata(): void {
    try {
      const stored = localStorage.getItem(this.METADATA_STORE);
      if (stored) {
        const data = JSON.parse(stored);
        this.cacheMetadata = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.error('Failed to load cache metadata', error, 'CrisisCache');
    }
  }
  
  /**
   * Save metadata to localStorage
   */
  private saveMetadata(): void {
    try {
      const data = Object.fromEntries(this.cacheMetadata.entries());
      localStorage.setItem(this.METADATA_STORE, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save cache metadata', error, 'CrisisCache');
    }
  }
}

// Export singleton instance
export const mobileCrisisCacheService = MobileCrisisCacheService.getInstance();

// Export for use in other modules
export default mobileCrisisCacheService;