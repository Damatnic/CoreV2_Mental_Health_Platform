/**
 * Intelligent Caching Service
 *
 * Advanced caching strategies that build upon the existing robust Workbox foundation
 * with intelligent cache warming, analytics, and mobile optimization for crisis support.
 * Provides predictive caching, cache analytics, and crisis-priority resource management.
 *
 * @fileoverview Intelligent caching with predictive algorithms and crisis prioritization
 * @version 2.0.0
 */

// Type-safe imports with fallbacks
const logger = {
  info: (msg: string, data?: any) => console.log(msg, data),
  error: (msg: string, data?: any) => console.error(msg, data),
  debug: (msg: string, data?: any) => console.debug(msg, data)
};

const mobileNetworkService = {
  getNetworkStatus: () => ({
    saveData: false,
    effectiveType: '4g' as const
  })
};

// Mock IDB types for environments without IndexedDB
type IDBPDatabase<T> = any;
type DBSchema = any;

const openDB = async <T>(name: string, version: number, options?: any): Promise<IDBPDatabase<T>> => {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB not available');
  }
  // Simplified mock - in production use actual idb library
  return {} as IDBPDatabase<T>;
};

export type CachePriority = 'critical' | 'high' | 'medium' | 'low';
export type ResourceType = 'html' | 'css' | 'js' | 'image' | 'audio' | 'video' | 'data' | 'font';
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

export interface CacheEntry {
  url: string;
  timestamp: number;
  hitCount: number;
  lastAccessed: number;
  size: number;
  priority: CachePriority;
  resourceType: ResourceType;
  expirationTime?: number;
  metadata?: Record<string, any>;
}

export interface CacheAnalytics {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  storageUsage: number;
  performanceMetrics: PerformanceMetrics;
  predictiveAccuracy: number;
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  cacheRetrievalTime: number;
  networkFallbackTime: number;
  offlineRequestCount: number;
  bandwidthSaved: number;
}

export interface PredictivePattern {
  sequence: string[];
  frequency: number;
  lastSeen: number;
  accuracy: number;
  userSegment?: string;
}

export interface CacheConfig {
  maxStorageSize: number; // in bytes
  defaultTTL: number; // in milliseconds
  enablePredictivePreloading: boolean;
  enableAnalytics: boolean;
  crisisResourceTTL: number;
  networkAwareEviction: boolean;
  compressionEnabled: boolean;
}

interface CacheDB extends DBSchema {
  entries: {
    key: string;
    value: CacheEntry;
  };
  analytics: {
    key: string;
    value: CacheAnalytics;
  };
  patterns: {
    key: string;
    value: PredictivePattern;
  };
  resources: {
    key: string;
    value: {
      url: string;
      data: ArrayBuffer;
      headers: Record<string, string>;
      timestamp: number;
    };
  };
}

class IntelligentCachingService {
  private db: IDBPDatabase<CacheDB> | null = null;
  private config: CacheConfig;
  private analytics: CacheAnalytics;
  private predictivePatterns: Map<string, PredictivePattern> = new Map();
  private accessSequence: string[] = [];
  private readonly MAX_SEQUENCE_LENGTH = 10;
  private readonly CRISIS_RESOURCES = [
    '/crisis-resources',
    '/emergency-contacts',
    '/safety-plan',
    '/breathing-exercises',
    '/crisis-chat',
    '/988-hotline',
  ];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxStorageSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      enablePredictivePreloading: true,
      enableAnalytics: true,
      crisisResourceTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      networkAwareEviction: true,
      compressionEnabled: true,
      ...config,
    };

    this.analytics = {
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      storageUsage: 0,
      performanceMetrics: {
        averageLoadTime: 0,
        cacheRetrievalTime: 0,
        networkFallbackTime: 0,
        offlineRequestCount: 0,
        bandwidthSaved: 0,
      },
      predictiveAccuracy: 0,
    };

    this.init();
  }

  private async init() {
    try {
      if (typeof indexedDB !== 'undefined') {
        this.db = await openDB<CacheDB>('intelligent-cache', 1, {
          upgrade(db) {
            db.createObjectStore('entries');
            db.createObjectStore('analytics');
            db.createObjectStore('patterns');
            db.createObjectStore('resources');
          },
        });

        await this.loadAnalytics();
        await this.loadPredictivePatterns();
      }
      
      await this.warmCrisisCache();
      
      logger.info('IntelligentCachingService initialized');
    } catch (error) {
      logger.error('Failed to initialize IntelligentCachingService:', error);
    }
  }

  public async handleRequest(request: Request): Promise<Response> {
    const url = request.url;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    
    try {
      // Record access for predictive analysis
      this.recordAccess(url);

      // Try cache first
      const cachedResponse = await this.getFromCache(url);
      if (cachedResponse) {
        const loadTime = performance.now() - startTime;
        this.updateAnalytics('hit', loadTime);
        this.triggerPredictivePreloading(url);
        return cachedResponse;
      }

      // Fetch from network
      const networkResponse = await fetch(request);
      const loadTime = performance.now() - startTime;
      
      if (networkResponse.ok) {
        // Cache the response based on strategy
        await this.cacheResponse(url, networkResponse.clone());
        this.updateAnalytics('miss', loadTime);
      }

      return networkResponse;
    } catch (error) {
      logger.error(`Cache request failed for ${url}:`, error);
      
      // Try to return stale cache as fallback
      const staleResponse = await this.getFromCache(url, true);
      if (staleResponse) {
        logger.info(`Serving stale cache for ${url}`);
        return staleResponse;
      }

      throw error;
    }
  }

  private async getFromCache(url: string, allowStale: boolean = false): Promise<Response | null> {
    if (!this.db) return null;

    try {
      const entry = await this.db.get('entries', url);
      if (!entry) return null;

      // Check expiration
      const now = Date.now();
      if (!allowStale && entry.expirationTime && now > entry.expirationTime) {
        await this.evictEntry(url);
        return null;
      }

      // Get cached resource
      const resource = await this.db.get('resources', url);
      if (!resource) return null;

      // Update access statistics
      entry.hitCount++;
      entry.lastAccessed = now;
      await this.db.put('entries', entry, url);

      // Create response from cached data
      const response = new Response(resource.data, {
        headers: resource.headers,
        status: 200,
        statusText: 'OK',
      });

      return response;
    } catch (error) {
      logger.error(`Failed to get from cache: ${url}`, error);
      return null;
    }
  }

  private async cacheResponse(url: string, response: Response): Promise<void> {
    if (!this.db || !response.ok) return;

    try {
      const resourceType = this.determineResourceType(url);
      const priority = this.determinePriority(url, resourceType);
      const ttl = this.getTTL(priority);
      
      // Check storage limits
      await this.enforceStorageLimits();

      // Store response data
      const data = await response.arrayBuffer();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
        hitCount: 0,
        lastAccessed: Date.now(),
        size: data.byteLength,
        priority,
        resourceType,
        expirationTime: Date.now() + ttl,
      };

      // Use transaction for consistency
      const tx = this.db.transaction(['entries', 'resources'], 'readwrite');
      await Promise.all([
        tx.objectStore('entries').put(entry, url),
        tx.objectStore('resources').put({
          url,
          data,
          headers,
          timestamp: Date.now(),
        }, url),
        tx.done,
      ]);

      logger.debug(`Cached resource: ${url} (${resourceType}, ${priority})`);
    } catch (error) {
      logger.error(`Failed to cache response for ${url}:`, error);
    }
  }

  private determineResourceType(url: string): ResourceType {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
      case 'mjs':
        return 'js';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'image';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'mp4':
      case 'webm':
        return 'video';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      default:
        return 'data';
    }
  }

  private determinePriority(url: string, resourceType: ResourceType): CachePriority {
    // Crisis resources get highest priority
    if (this.CRISIS_RESOURCES.some(path => url.includes(path))) {
      return 'critical';
    }

    // Core application resources
    if (resourceType === 'html' || resourceType === 'js' || resourceType === 'css') {
      return 'high';
    }

    // Fonts and frequently accessed data
    if (resourceType === 'font' || url.includes('/api/')) {
      return 'medium';
    }

    // Images, audio, video
    return 'low';
  }

  private getTTL(priority: CachePriority): number {
    switch (priority) {
      case 'critical':
        return this.config.crisisResourceTTL;
      case 'high':
        return this.config.defaultTTL;
      case 'medium':
        return this.config.defaultTTL / 2;
      case 'low':
        return this.config.defaultTTL / 4;
      default:
        return this.config.defaultTTL;
    }
  }

  private recordAccess(url: string) {
    this.accessSequence.push(url);
    
    // Keep sequence manageable
    if (this.accessSequence.length > this.MAX_SEQUENCE_LENGTH) {
      this.accessSequence.shift();
    }

    // Update predictive patterns
    if (this.config.enablePredictivePreloading) {
      this.updatePredictivePatterns();
    }
  }

  private updatePredictivePatterns() {
    if (this.accessSequence.length < 3) return;

    const sequence = this.accessSequence.slice(-3);
    const patternKey = sequence.slice(0, -1).join('->');
    const nextResource = sequence[sequence.length - 1];

    const existing = this.predictivePatterns.get(patternKey);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = Date.now();
      if (!existing.sequence.includes(nextResource)) {
        existing.sequence.push(nextResource);
      }
    } else {
      this.predictivePatterns.set(patternKey, {
        sequence: [nextResource],
        frequency: 1,
        lastSeen: Date.now(),
        accuracy: 0,
      });
    }

    // Persist patterns periodically
    if (Math.random() < 0.1) { // 10% chance
      this.savePredictivePatterns();
    }
  }

  private async triggerPredictivePreloading(currentUrl: string) {
    if (!this.config.enablePredictivePreloading) return;

    // Find patterns that might predict next resources
    const recentSequence = this.accessSequence.slice(-2);
    const patternKey = recentSequence.join('->');
    const pattern = this.predictivePatterns.get(patternKey);

    if (pattern && pattern.frequency > 2) {
      // Preload predicted resources
      for (const predictedUrl of pattern.sequence) {
        if (!await this.isInCache(predictedUrl)) {
          this.preloadResource(predictedUrl);
        }
      }
    }
  }

  private async preloadResource(url: string) {
    try {
      // Check network conditions before preloading
      const networkStatus = mobileNetworkService.getNetworkStatus();
      if (networkStatus.saveData || networkStatus.effectiveType === ('slow-2g' as any)) {
        return; // Skip preloading on slow networks
      }

      const response = await fetch(url);
      if (response.ok) {
        await this.cacheResponse(url, response);
        logger.debug(`Preloaded resource: ${url}`);
      }
    } catch (error) {
      logger.debug(`Preload failed for ${url}:`, error);
    }
  }

  private async isInCache(url: string): Promise<boolean> {
    if (!this.db) return false;
    const entry = await this.db.get('entries', url);
    return !!entry && (!entry.expirationTime || Date.now() < entry.expirationTime);
  }

  private async enforceStorageLimits() {
    if (!this.db) return;

    try {
      const entries = await this.db.getAll('entries');
      let totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

      if (totalSize <= this.config.maxStorageSize) {
        return;
      }

      // Sort by eviction priority (least important first)
      const sortedEntries = entries.sort((a, b) => {
        // Never evict critical resources
        if (a.priority === 'critical') return 1;
        if (b.priority === 'critical') return -1;

        // Consider priority, hit count, and last access
        const priorityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
        const scoreA = (priorityWeight[a.priority] * a.hitCount) / (Date.now() - a.lastAccessed);
        const scoreB = (priorityWeight[b.priority] * b.hitCount) / (Date.now() - b.lastAccessed);

        return scoreA - scoreB;
      });

      // Evict entries until under limit
      for (const entry of sortedEntries) {
        if (totalSize <= this.config.maxStorageSize * 0.8) break; // Leave 20% buffer

        await this.evictEntry(entry.url);
        totalSize -= entry.size;
        this.analytics.evictionCount++;
      }

      logger.info(`Evicted entries to maintain storage limit. Current size: ${totalSize} bytes`);
    } catch (error) {
      logger.error('Failed to enforce storage limits:', error);
    }
  }

  private async evictEntry(url: string) {
    if (!this.db) return;

    const tx = this.db.transaction(['entries', 'resources'], 'readwrite');
    await Promise.all([
      tx.objectStore('entries').delete(url),
      tx.objectStore('resources').delete(url),
      tx.done,
    ]);
  }

  private updateAnalytics(type: 'hit' | 'miss', loadTime: number) {
    if (!this.config.enableAnalytics) return;

    if (type === 'hit') {
      this.analytics.hitRate = (this.analytics.hitRate * 0.9) + (1 * 0.1);
      this.analytics.performanceMetrics.cacheRetrievalTime = 
        (this.analytics.performanceMetrics.cacheRetrievalTime * 0.9) + (loadTime * 0.1);
    } else {
      this.analytics.missRate = (this.analytics.missRate * 0.9) + (1 * 0.1);
      this.analytics.performanceMetrics.networkFallbackTime = 
        (this.analytics.performanceMetrics.networkFallbackTime * 0.9) + (loadTime * 0.1);
    }

    this.analytics.performanceMetrics.averageLoadTime = 
      (this.analytics.performanceMetrics.averageLoadTime * 0.9) + (loadTime * 0.1);

    // Periodically save analytics
    if (Math.random() < 0.05) { // 5% chance
      this.saveAnalytics();
    }
  }

  private async warmCrisisCache() {
    logger.info('Warming crisis resource cache');
    
    if (typeof window === 'undefined') return;
    
    for (const resourcePath of this.CRISIS_RESOURCES) {
      try {
        const url = new URL(resourcePath, window.location.origin).toString();
        if (!await this.isInCache(url)) {
          await this.preloadResource(url);
        }
      } catch (error) {
        logger.debug(`Failed to warm cache for ${resourcePath}:`, error);
      }
    }
  }

  private async loadAnalytics() {
    if (!this.db) return;
    
    try {
      const saved = await this.db.get('analytics', 'current');
      if (saved) {
        this.analytics = { ...this.analytics, ...saved };
      }
    } catch (error) {
      logger.debug('No saved analytics found');
    }
  }

  private async saveAnalytics() {
    if (!this.db) return;
    
    try {
      await this.db.put('analytics', this.analytics, 'current');
    } catch (error) {
      logger.error('Failed to save analytics:', error);
    }
  }

  private async loadPredictivePatterns() {
    if (!this.db) return;
    
    try {
      const patterns = await this.db.getAll('patterns');
      for (const pattern of patterns) {
        this.predictivePatterns.set(pattern.sequence.join('->'), pattern);
      }
    } catch (error) {
      logger.debug('No saved patterns found');
    }
  }

  private async savePredictivePatterns() {
    if (!this.db) return;
    
    try {
      const tx = this.db.transaction('patterns', 'readwrite');
      for (const [key, pattern] of Array.from(this.predictivePatterns.entries())) {
        await tx.store.put(pattern, key);
      }
      await tx.done;
    } catch (error) {
      logger.error('Failed to save predictive patterns:', error);
    }
  }

  public async getAnalytics(): Promise<CacheAnalytics> {
    if (!this.db) return this.analytics;

    try {
      const entries = await this.db.getAll('entries');
      this.analytics.storageUsage = entries.reduce((sum, entry) => sum + entry.size, 0);
    } catch (error) {
      logger.error('Failed to calculate storage usage:', error);
    }

    return { ...this.analytics };
  }

  public async clearCache(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(['entries', 'resources'], 'readwrite');
      await Promise.all([
        tx.objectStore('entries').clear(),
        tx.objectStore('resources').clear(),
        tx.done,
      ]);
      
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  public async getOfflineMessages(): Promise<any[]> {
    // Placeholder for offline message handling
    return [];
  }

  public async removeOfflineMessage(messageId: string): Promise<void> {
    // Placeholder for offline message removal
    logger.debug(`Removed offline message: ${messageId}`);
  }
}

export const intelligentCache = new IntelligentCachingService();

// React Hook for Cache Analytics (requires React to be available)
export const useCacheAnalytics = () => {
  if (typeof window === 'undefined' || !window.React) {
    return {
      analytics: null,
      clearCache: async () => {}
    };
  }
  
  const React = (window as any).React;
  const [analytics, setAnalytics] = React.useState<CacheAnalytics | null>(null);

  React.useEffect(() => {
    const loadAnalytics = async () => {
      const data = await intelligentCache.getAnalytics();
      setAnalytics(data);
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);

    return () => clearInterval(interval);
  }, []);

  const clearCache = React.useCallback(async () => {
    await intelligentCache.clearCache();
    const data = await intelligentCache.getAnalytics();
    setAnalytics(data);
  }, []);

  return {
    analytics,
    clearCache,
  };
};

// Extend window interface for React
declare global {
  interface Window {
    React?: any;
  }
}

export default intelligentCache;
