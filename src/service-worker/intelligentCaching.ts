/**
 * Intelligent Caching Strategy for Mental Health Platform
 *
 * Advanced service worker caching with:
 * - User behavior-based prefetching
 * - Crisis-priority resource management
 * - Adaptive cache strategies
 * - Performance-aware resource loading
 */

interface CacheStrategy {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  maxAge: number;
  maxEntries: number;
  networkFirst?: boolean;
  staleWhileRevalidate?: boolean;
}

interface UserBehaviorPattern {
  frequentRoutes: string[];
  timeSpentOnRoutes: Record<string, number>;
  crisisIndicators: string[];
  lastActive: number;
  sessionDuration: number;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  storageUsage: number;
  lastUpdated: number;
}

interface PrefetchPrediction {
  url: string;
  probability: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedLoadTime: number;
  userContext: string;
}

class IntelligentCachingStrategy {
  private cache: Cache | null = null;
  private userBehavior: UserBehaviorPattern;
  private cacheMetrics: CacheMetrics;
  private strategies: Map<string, CacheStrategy>;
  private prefetchQueue: PrefetchPrediction[] = [];

  constructor() {
    this.userBehavior = {
      frequentRoutes: [],
      timeSpentOnRoutes: {},
      crisisIndicators: [],
      lastActive: Date.now(),
      sessionDuration: 0
    };

    this.cacheMetrics = {
      hitRate: 0,
      missRate: 0,
      averageResponseTime: 0,
      storageUsage: 0,
      lastUpdated: Date.now()
    };

    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize caching strategies for different resource types
   */
  private initializeStrategies(): void {
    // Crisis resources - highest priority
    this.strategies.set('crisis', {
      name: 'crisis-resources',
      priority: 'critical',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 100,
      networkFirst: false,
      staleWhileRevalidate: true
    });

    // Core app shell
    this.strategies.set('app-shell', {
      name: 'app-shell',
      priority: 'critical',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 50,
      networkFirst: false,
      staleWhileRevalidate: false
    });

    // User data and preferences
    this.strategies.set('user-data', {
      name: 'user-data',
      priority: 'high',
      maxAge: 60 * 60 * 1000, // 1 hour
      maxEntries: 200,
      networkFirst: true,
      staleWhileRevalidate: true
    });

    // Static assets
    this.strategies.set('static', {
      name: 'static-assets',
      priority: 'medium',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEntries: 500,
      networkFirst: false,
      staleWhileRevalidate: false
    });

    // API responses
    this.strategies.set('api', {
      name: 'api-responses',
      priority: 'high',
      maxAge: 15 * 60 * 1000, // 15 minutes
      maxEntries: 300,
      networkFirst: true,
      staleWhileRevalidate: true
    });
  }

  /**
   * Initialize the cache
   */
  async initialize(): Promise<void> {
    try {
      this.cache = await caches.open('intelligent-cache-v1');
      await this.loadUserBehavior();
      await this.updateCacheMetrics();
      this.startBehaviorTracking();
    } catch (error) {
      console.error('Failed to initialize intelligent caching:', error);
    }
  }

  /**
   * Handle fetch requests with intelligent caching
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const strategy = this.determineStrategy(url);
    
    this.trackUserBehavior(url.pathname);
    
    try {
      if (strategy.networkFirst) {
        return await this.networkFirstStrategy(request, strategy);
      } else if (strategy.staleWhileRevalidate) {
        return await this.staleWhileRevalidateStrategy(request, strategy);
      } else {
        return await this.cacheFirstStrategy(request, strategy);
      }
    } catch (error) {
      console.error('Cache strategy failed:', error);
      return fetch(request);
    }
  }

  /**
   * Determine the appropriate caching strategy for a URL
   */
  private determineStrategy(url: URL): CacheStrategy {
    const pathname = url.pathname;

    // Crisis-related resources
    if (pathname.includes('/crisis') || 
        pathname.includes('/emergency') || 
        pathname.includes('/safety')) {
      return this.strategies.get('crisis')!;
    }

    // App shell resources
    if (pathname === '/' || 
        pathname.includes('/app-shell') || 
        pathname.endsWith('.js') || 
        pathname.endsWith('.css')) {
      return this.strategies.get('app-shell')!;
    }

    // User data
    if (pathname.includes('/user') || 
        pathname.includes('/profile') || 
        pathname.includes('/preferences')) {
      return this.strategies.get('user-data')!;
    }

    // API endpoints
    if (pathname.startsWith('/api/') || 
        pathname.startsWith('/netlify/functions/')) {
      return this.strategies.get('api')!;
    }

    // Default to static assets
    return this.strategies.get('static')!;
  }

  /**
   * Network-first caching strategy
   */
  private async networkFirstStrategy(request: Request, strategy: CacheStrategy): Promise<Response> {
    const startTime = Date.now();

    try {
      const networkResponse = await fetch(request);
      const responseTime = Date.now() - startTime;

      if (networkResponse.ok) {
        // Cache the successful response
        await this.cacheResponse(request, networkResponse.clone(), strategy);
        this.updateMetrics(true, responseTime);
        return networkResponse;
      }
    } catch (error) {
      console.log('Network failed, trying cache:', error);
    }

    // Fallback to cache
    const cachedResponse = await this.getCachedResponse(request);
    if (cachedResponse) {
      this.updateMetrics(true, Date.now() - startTime);
      return cachedResponse;
    }

    this.updateMetrics(false, Date.now() - startTime);
    throw new Error('No network or cached response available');
  }

  /**
   * Cache-first strategy
   */
  private async cacheFirstStrategy(request: Request, strategy: CacheStrategy): Promise<Response> {
    const startTime = Date.now();
    
    const cachedResponse = await this.getCachedResponse(request);
    if (cachedResponse && !this.isCacheExpired(cachedResponse, strategy)) {
      this.updateMetrics(true, Date.now() - startTime);
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      const responseTime = Date.now() - startTime;

      if (networkResponse.ok) {
        await this.cacheResponse(request, networkResponse.clone(), strategy);
        this.updateMetrics(true, responseTime);
        return networkResponse;
      }
    } catch (error) {
      console.error('Network request failed:', error);
    }

    if (cachedResponse) {
      this.updateMetrics(true, Date.now() - startTime);
      return cachedResponse;
    }

    this.updateMetrics(false, Date.now() - startTime);
    throw new Error('No cached response available');
  }

  /**
   * Stale-while-revalidate strategy
   */
  private async staleWhileRevalidateStrategy(request: Request, strategy: CacheStrategy): Promise<Response> {
    const startTime = Date.now();
    
    const cachedResponse = await this.getCachedResponse(request);
    
    // Always try to update in the background
    this.updateInBackground(request, strategy);
    
    if (cachedResponse) {
      this.updateMetrics(true, Date.now() - startTime);
      return cachedResponse;
    }

    // No cache available, wait for network
    try {
      const networkResponse = await fetch(request);
      const responseTime = Date.now() - startTime;

      if (networkResponse.ok) {
        await this.cacheResponse(request, networkResponse.clone(), strategy);
        this.updateMetrics(true, responseTime);
        return networkResponse;
      }
    } catch (error) {
      console.error('Network request failed:', error);
    }

    this.updateMetrics(false, Date.now() - startTime);
    throw new Error('No response available');
  }

  /**
   * Cache a response with the given strategy
   */
  private async cacheResponse(request: Request, response: Response, strategy: CacheStrategy): Promise<void> {
    if (!this.cache) return;

    try {
      // Add cache metadata
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      headers.set('sw-strategy', strategy.name);

      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

      await this.cache.put(request, modifiedResponse);
      await this.enforceQuota(strategy);
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(request: Request): Promise<Response | undefined> {
    if (!this.cache) return undefined;

    try {
      return await this.cache.match(request);
    } catch (error) {
      console.error('Failed to get cached response:', error);
      return undefined;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(response: Response, strategy: CacheStrategy): boolean {
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return true;

    const cacheTime = parseInt(cachedAt);
    const now = Date.now();
    return (now - cacheTime) > strategy.maxAge;
  }

  /**
   * Update cache in background
   */
  private async updateInBackground(request: Request, strategy: CacheStrategy): Promise<void> {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.cacheResponse(request, networkResponse, strategy);
      }
    } catch (error) {
      // Silently fail background updates
      console.log('Background update failed:', error);
    }
  }

  /**
   * Enforce cache quota limits
   */
  private async enforceQuota(strategy: CacheStrategy): Promise<void> {
    if (!this.cache) return;

    try {
      const keys = await this.cache.keys();
      const strategyKeys = keys.filter(request => {
        const url = new URL(request.url);
        return this.determineStrategy(url).name === strategy.name;
      });

      if (strategyKeys.length > strategy.maxEntries) {
        // Remove oldest entries
        const sortedKeys = strategyKeys.sort((a, b) => {
          // Sort by cache time (oldest first)
          return parseInt(a.headers.get('sw-cached-at') || '0') - 
                 parseInt(b.headers.get('sw-cached-at') || '0');
        });

        const keysToDelete = sortedKeys.slice(0, strategyKeys.length - strategy.maxEntries);
        await Promise.all(keysToDelete.map(key => this.cache!.delete(key)));
      }
    } catch (error) {
      console.error('Failed to enforce quota:', error);
    }
  }

  /**
   * Track user behavior for predictive caching
   */
  private trackUserBehavior(pathname: string): void {
    const now = Date.now();
    
    // Update frequent routes
    if (!this.userBehavior.frequentRoutes.includes(pathname)) {
      this.userBehavior.frequentRoutes.push(pathname);
    }

    // Track time spent
    if (!this.userBehavior.timeSpentOnRoutes[pathname]) {
      this.userBehavior.timeSpentOnRoutes[pathname] = 0;
    }
    this.userBehavior.timeSpentOnRoutes[pathname] += now - this.userBehavior.lastActive;

    // Update session data
    this.userBehavior.lastActive = now;
    this.userBehavior.sessionDuration = now - (this.userBehavior.lastActive - this.userBehavior.sessionDuration);

    // Check for crisis indicators
    if (pathname.includes('crisis') || pathname.includes('emergency')) {
      if (!this.userBehavior.crisisIndicators.includes(pathname)) {
        this.userBehavior.crisisIndicators.push(pathname);
      }
    }

    this.saveUserBehavior();
  }

  /**
   * Start behavior tracking
   */
  private startBehaviorTracking(): void {
    // Generate prefetch predictions every 30 seconds
    setInterval(() => {
      this.generatePrefetchPredictions();
    }, 30000);

    // Clean up old behavior data every hour
    setInterval(() => {
      this.cleanupBehaviorData();
    }, 3600000);
  }

  /**
   * Generate prefetch predictions based on user behavior
   */
  private generatePrefetchPredictions(): void {
    const predictions: PrefetchPrediction[] = [];
    
    // Predict based on frequent routes
    this.userBehavior.frequentRoutes.forEach(route => {
      const timeSpent = this.userBehavior.timeSpentOnRoutes[route] || 0;
      const probability = Math.min(timeSpent / 10000, 1); // Normalize to 0-1

      if (probability > 0.3) { // Only prefetch if probability > 30%
        predictions.push({
          url: route,
          probability,
          priority: this.determinePrefetchPriority(route, probability),
          estimatedLoadTime: this.estimateLoadTime(route),
          userContext: 'frequent-route'
        });
      }
    });

    // Predict crisis-related resources if indicators present
    if (this.userBehavior.crisisIndicators.length > 0) {
      const crisisRoutes = ['/crisis-resources', '/emergency-contacts', '/safety-plan'];
      crisisRoutes.forEach(route => {
        predictions.push({
          url: route,
          probability: 0.8,
          priority: 'critical',
          estimatedLoadTime: this.estimateLoadTime(route),
          userContext: 'crisis-indicator'
        });
      });
    }

    this.prefetchQueue = predictions.sort((a, b) => b.probability - a.probability);
    this.executePrefetching();
  }

  /**
   * Determine prefetch priority
   */
  private determinePrefetchPriority(route: string, probability: number): 'critical' | 'high' | 'medium' | 'low' {
    if (route.includes('crisis') || route.includes('emergency')) {
      return 'critical';
    }
    if (probability > 0.7) return 'high';
    if (probability > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Estimate load time for a route
   */
  private estimateLoadTime(route: string): number {
    // Simple estimation based on route complexity
    if (route.includes('api')) return 500;
    if (route.includes('crisis')) return 300;
    return 200;
  }

  /**
   * Execute prefetching for predicted resources
   */
  private async executePrefetching(): Promise<void> {
    const highPriorityPredictions = this.prefetchQueue.filter(p => 
      p.priority === 'critical' || p.priority === 'high'
    );

    for (const prediction of highPriorityPredictions.slice(0, 5)) {
      try {
        const request = new Request(prediction.url);
        const response = await fetch(request);
        
        if (response.ok) {
          const strategy = this.determineStrategy(new URL(prediction.url));
          await this.cacheResponse(request, response, strategy);
        }
      } catch (error) {
        console.log('Prefetch failed for:', prediction.url, error);
      }
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(hit: boolean, responseTime: number): void {
    const totalRequests = this.cacheMetrics.hitRate + this.cacheMetrics.missRate;
    
    if (hit) {
      this.cacheMetrics.hitRate = (this.cacheMetrics.hitRate * totalRequests + 1) / (totalRequests + 1);
    } else {
      this.cacheMetrics.missRate = (this.cacheMetrics.missRate * totalRequests + 1) / (totalRequests + 1);
    }

    this.cacheMetrics.averageResponseTime = (this.cacheMetrics.averageResponseTime * totalRequests + responseTime) / (totalRequests + 1);
    this.cacheMetrics.lastUpdated = Date.now();
  }

  /**
   * Update cache metrics with storage usage
   */
  private async updateCacheMetrics(): Promise<void> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.cacheMetrics.storageUsage = estimate.usage || 0;
      }
    } catch (error) {
      console.error('Failed to update storage metrics:', error);
    }
  }

  /**
   * Load user behavior from storage
   */
  private async loadUserBehavior(): Promise<void> {
    try {
      const stored = localStorage.getItem('sw-user-behavior');
      if (stored) {
        this.userBehavior = { ...this.userBehavior, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load user behavior:', error);
    }
  }

  /**
   * Save user behavior to storage
   */
  private saveUserBehavior(): void {
    try {
      localStorage.setItem('sw-user-behavior', JSON.stringify(this.userBehavior));
    } catch (error) {
      console.error('Failed to save user behavior:', error);
    }
  }

  /**
   * Clean up old behavior data
   */
  private cleanupBehaviorData(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Remove old crisis indicators
    this.userBehavior.crisisIndicators = this.userBehavior.crisisIndicators.filter(indicator => {
      // Keep recent crisis indicators
      return Date.now() - this.userBehavior.lastActive < oneWeekAgo;
    });

    // Limit frequent routes to top 20
    const sortedRoutes = Object.entries(this.userBehavior.timeSpentOnRoutes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    this.userBehavior.frequentRoutes = sortedRoutes.map(([route]) => route);
    this.userBehavior.timeSpentOnRoutes = Object.fromEntries(sortedRoutes);

    this.saveUserBehavior();
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }

  /**
   * Get user behavior patterns
   */
  getUserBehavior(): UserBehaviorPattern {
    return { ...this.userBehavior };
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    if (!this.cache) return;

    try {
      const keys = await this.cache.keys();
      await Promise.all(keys.map(key => this.cache!.delete(key)));
      
      // Reset metrics
      this.cacheMetrics = {
        hitRate: 0,
        missRate: 0,
        averageResponseTime: 0,
        storageUsage: 0,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
}

// Export singleton instance
export const intelligentCachingStrategy = new IntelligentCachingStrategy();
export default intelligentCachingStrategy;
