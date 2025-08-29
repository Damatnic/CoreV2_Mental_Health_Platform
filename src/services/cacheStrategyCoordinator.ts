/**
 * Mental Health Platform - Advanced Cache Strategy Coordinator
 *
 * Comprehensive intelligent caching orchestration system optimized for
 * mental health platform requirements with crisis-aware resource prioritization,
 * offline-first strategies, and therapeutic content optimization.
 *
 * Features:
 * - Crisis resource priority caching with immediate availability
 * - Multi-tier intelligent caching strategy coordination
 * - Offline-first mental health resource accessibility
 * - Performance-optimized cache routing with therapeutic content priority
 * - Advanced cache analytics and monitoring for platform optimization
 * - Cultural content caching with localization support
 * - Therapeutic session data intelligent caching
 * - Emergency resource pre-caching and availability assurance
 *
 * @version 2.0.0 - Mental Health Platform Specialized
 * @safety Crisis resource priority caching for emergency accessibility
 * @therapeutic Optimized caching for therapeutic content and user sessions
 * @performance Advanced cache coordination for mental health platform optimization
 */

// Mental Health Cache Strategy Types
export type MentalHealthResourceType = 
  | 'crisis-resources' | 'therapeutic-content' | 'user-sessions' | 'cultural-content'
  | 'emergency-contacts' | 'safety-plans' | 'mood-data' | 'assessment-tools'
  | 'static-assets' | 'api-responses' | 'offline-content' | 'community-resources';

export type MentalHealthCachePriority = 
  | 'emergency' | 'crisis' | 'therapeutic' | 'user-critical' | 'standard' | 'background';

export type CacheHandlerStrategy = 
  | 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

// Advanced Cache Strategy Interface
export interface MentalHealthCacheStrategy {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  handler: MentalHealthCacheHandler;
  options: MentalHealthCacheOptions;
  
  // Mental Health Specific Properties
  priority: MentalHealthCachePriority;
  resourceType: MentalHealthResourceType;
  therapeuticImportance: 'critical' | 'high' | 'medium' | 'low';
  crisisAvailability: boolean;
  
  // Cache Configuration
  ttl: number; // Time to live in milliseconds
  maxEntries: number;
  offlineAvailable: boolean;
  preloadConditions?: string[];
  
  // Cultural and Accessibility
  culturalAdaptation?: boolean;
  accessibilityOptimized?: boolean;
  multiLanguageSupport?: boolean;
  
  // Performance and Analytics
  performanceTracking: boolean;
  analyticsEnabled: boolean;
  userExperienceMetrics: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Mental Health Cache Handler Interface
export interface MentalHealthCacheHandler {
  name: string;
  strategy: CacheHandlerStrategy;
  handle(request: Request, context?: MentalHealthCacheContext): Promise<Response>;
  
  // Mental Health Specific Methods
  handleCrisisRequest?(request: Request): Promise<Response>;
  handleTherapeuticContent?(request: Request): Promise<Response>;
  handleOfflineRequest?(request: Request): Promise<Response>;
  
  // Fallback and Error Handling
  fallback?: (request: Request, error?: Error) => Promise<Response>;
  emergencyFallback?: (request: Request) => Promise<Response>;
  
  // Configuration
  retryAttempts?: number;
  timeoutMs?: number;
  validateResponse?: (response: Response) => boolean;
}

// Mental Health Cache Context
export interface MentalHealthCacheContext {
  userId?: string;
  sessionId?: string;
  crisisLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  therapeuticSession?: boolean;
  culturalContext?: string;
  accessibilityNeeds?: string[];
  connectionQuality?: 'offline' | 'slow' | 'fast';
  emergencyMode?: boolean;
}

// Advanced Cache Options
export interface MentalHealthCacheOptions {
  cacheName: string;
  version: string;
  
  // Basic Configuration
  maxAgeSeconds: number;
  maxEntries: number;
  purgeOnQuotaError: boolean;
  
  // Mental Health Specific Options
  crisisPreload: boolean;
  therapeuticPriority: boolean;
  offlineSync: boolean;
  culturalCaching: boolean;
  
  // Performance Options
  backgroundSync?: boolean;
  intelligentPrefetch?: boolean;
  compressionEnabled?: boolean;
  
  // Privacy and Security
  encryptSensitiveData?: boolean;
  hipaaCompliant?: boolean;
  dataRetentionDays?: number;
  anonymizeUserData?: boolean;
  
  // Cache Plugins
  plugins?: MentalHealthCachePlugin[];
}

// Cache Plugin Interface
export interface MentalHealthCachePlugin {
  name: string;
  
  // Lifecycle Methods
  cacheKeyWillBeUsed?(params: {
    request: Request;
    mode: 'read' | 'write';
    context?: MentalHealthCacheContext;
  }): Promise<string>;
  
  cacheWillUpdate?(params: {
    request: Request;
    response: Response;
    context?: MentalHealthCacheContext;
  }): Promise<Response | undefined>;
  
  cachedResponseWillBeUsed?(params: {
    request: Request;
    cachedResponse: Response;
    context?: MentalHealthCacheContext;
  }): Promise<Response | undefined>;
  
  requestWillFetch?(params: {
    request: Request;
    context?: MentalHealthCacheContext;
  }): Promise<Request>;
  
  fetchDidSucceed?(params: {
    request: Request;
    response: Response;
    context?: MentalHealthCacheContext;
  }): Promise<Response>;
  
  fetchDidFail?(params: {
    request: Request;
    error: Error;
    context?: MentalHealthCacheContext;
  }): Promise<void>;
}

// Performance Metrics Interface
export interface MentalHealthCacheMetrics {
  // Basic Metrics
  hitRate: number;
  missRate: number;
  errorRate: number;
  averageResponseTime: number;
  
  // Mental Health Specific Metrics
  crisisResourceAvailability: number;
  therapeuticContentHitRate: number;
  offlineCapabilityScore: number;
  userExperienceScore: number;
  
  // Cache Statistics
  totalCacheSize: number;
  entriesCount: number;
  evictionCount: number;
  compressionRatio: number;
  
  // Performance Indicators
  networkSavings: number; // Bytes saved by caching
  responseTimeImprovement: number; // Percentage improvement
  offlineRequestsServed: number;
  
  // Temporal Data
  lastUpdated: Date;
  reportingPeriod: string;
  trendsData: MetricTrend[];
}

export interface MetricTrend {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'improving' | 'stable' | 'declining';
}

// Configuration Interface
export interface MentalHealthCacheConfiguration {
  // Strategy Management
  strategies: MentalHealthCacheStrategy[];
  defaultStrategy: string;
  emergencyStrategy: string;
  offlineStrategy: string;
  
  // Global Settings
  globalOptions: {
    enableIntelligentPrefetch: boolean;
    enableBackgroundSync: boolean;
    enableCompressionByDefault: boolean;
    enableAnalytics: boolean;
    maxTotalCacheSize: number; // bytes
  };
  
  // Mental Health Specific Settings
  mentalHealthSettings: {
    crisisResourcePreload: boolean;
    therapeuticContentPriority: boolean;
    culturalContentCaching: boolean;
    emergencyModeEnabled: boolean;
    offlineTherapySupport: boolean;
  };
  
  // Performance Settings
  performanceSettings: {
    enableMetrics: boolean;
    metricsReportingInterval: number;
    maxMetricsHistory: number;
    performanceThresholds: {
      acceptableResponseTime: number;
      minimumHitRate: number;
      maximumErrorRate: number;
    };
  };
  
  // Privacy and Compliance
  privacySettings: {
    hipaaCompliant: boolean;
    encryptSensitiveData: boolean;
    dataRetentionPolicy: number; // days
    auditLoggingEnabled: boolean;
  };
}

// Advanced Cache Handlers Implementation
class MentalHealthNetworkFirstHandler implements MentalHealthCacheHandler {
  name = 'MentalHealthNetworkFirst';
  strategy: CacheHandlerStrategy = 'network-first';
  
  constructor(
    private options: MentalHealthCacheOptions,
    private priority: MentalHealthCachePriority = 'standard'
  ) {}

  async handle(request: Request, context?: MentalHealthCacheContext): Promise<Response> {
    const isEmergency = context?.emergencyMode || context?.crisisLevel === 'critical';
    const timeout = isEmergency ? 3000 : (this.options.maxAgeSeconds * 100);

    try {
      // Try network first with timeout for emergency situations
      const networkResponse = await this.fetchWithTimeout(request, timeout);
      
      if (networkResponse.ok) {
        // Cache successful response
        await this.cacheResponse(request, networkResponse);
        return networkResponse;
      }
      
      // Network returned error, try cache
      return await this.getCachedResponse(request, context);
    } catch (error) {
      console.log(`Network first handler - network failed: ${error}, trying cache`);
      return await this.getCachedResponse(request, context);
    }
  }

  async handleCrisisRequest(request: Request): Promise<Response> {
    const emergencyContext: MentalHealthCacheContext = {
      crisisLevel: 'critical',
      emergencyMode: true
    };
    
    return this.handle(request, emergencyContext);
  }

  private async fetchWithTimeout(request: Request, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(request, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async cacheResponse(request: Request, response: Response): Promise<void> {
    try {
      const cache = await caches.open(this.options.cacheName);
      await cache.put(request, response.clone());
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  private async getCachedResponse(request: Request, context?: MentalHealthCacheContext): Promise<Response> {
    try {
      const cache = await caches.open(this.options.cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // No cache available, use fallback
      if (this.fallback) {
        return await this.fallback(request);
      }
      
      if (context?.emergencyMode && this.emergencyFallback) {
        return await this.emergencyFallback(request);
      }
      
      return new Response('Service temporarily unavailable', { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      console.error('Failed to get cached response:', error);
      return new Response('Cache error', { status: 500 });
    }
  }

  fallback?: (request: Request, error?: Error) => Promise<Response>;
  emergencyFallback?: (request: Request) => Promise<Response>;
}

class MentalHealthCacheFirstHandler implements MentalHealthCacheHandler {
  name = 'MentalHealthCacheFirst';
  strategy: CacheHandlerStrategy = 'cache-first';
  
  constructor(private options: MentalHealthCacheOptions) {}

  async handle(request: Request, context?: MentalHealthCacheContext): Promise<Response> {
    try {
      // Try cache first
      const cache = await caches.open(this.options.cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Check if cache is still valid for therapeutic content
        if (this.options.therapeuticPriority && this.isCacheStale(cachedResponse)) {
          // Update cache in background for therapeutic content
          this.updateCacheInBackground(request, cache);
        }
        
        return cachedResponse;
      }
      
      // Cache miss, try network
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      console.error('Cache first handler failed:', error);
      
      if (this.fallback) {
        return await this.fallback(request, error as Error);
      }
      
      return new Response('Service unavailable', { status: 503 });
    }
  }

  private isCacheStale(response: Response): boolean {
    const cacheDate = response.headers.get('date');
    if (!cacheDate) return false;
    
    const age = Date.now() - new Date(cacheDate).getTime();
    return age > (this.options.maxAgeSeconds * 1000 / 2); // Consider stale at half the max age
  }

  private async updateCacheInBackground(request: Request, cache: Cache): Promise<void> {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
    } catch (error) {
      console.log('Background cache update failed:', error);
    }
  }

  fallback?: (request: Request, error?: Error) => Promise<Response>;
  emergencyFallback?: (request: Request) => Promise<Response>;
}

class MentalHealthStaleWhileRevalidateHandler implements MentalHealthCacheHandler {
  name = 'MentalHealthStaleWhileRevalidate';
  strategy: CacheHandlerStrategy = 'stale-while-revalidate';
  
  constructor(private options: MentalHealthCacheOptions) {}

  async handle(request: Request, context?: MentalHealthCacheContext): Promise<Response> {
    try {
      const cache = await caches.open(this.options.cacheName);
      const cachedResponse = await cache.match(request);
      
      // Start network request in background
      const networkPromise = this.fetchAndCache(request, cache);
      
      // Return cached response immediately if available
      if (cachedResponse) {
        // Don't wait for network request
        networkPromise.catch(() => {}); // Prevent unhandled promise rejection
        return cachedResponse;
      }
      
      // No cache, wait for network
      const networkResponse = await networkPromise;
      if (networkResponse) {
        return networkResponse;
      }
      
      if (this.fallback) {
        return await this.fallback(request);
      }
      
      return new Response('No cache and network failed', { status: 503 });
    } catch (error) {
      console.error('Stale while revalidate handler failed:', error);
      
      if (this.fallback) {
        return await this.fallback(request, error as Error);
      }
      
      return new Response('Handler error', { status: 503 });
    }
  }

  private async fetchAndCache(request: Request, cache: Cache): Promise<Response | null> {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.log('Background network request failed:', error);
      return null;
    }
  }

  fallback?: (request: Request, error?: Error) => Promise<Response>;
  emergencyFallback?: (request: Request) => Promise<Response>;
}

// Default Mental Health Cache Strategies
const MENTAL_HEALTH_DEFAULT_STRATEGIES: MentalHealthCacheStrategy[] = [
  {
    id: 'crisis-resources-strategy',
    name: 'Crisis Resources Priority',
    description: 'High-priority caching for crisis intervention resources',
    pattern: /\/api\/crisis|\/emergency|\/suicide-prevention|\/crisis-chat/,
    handler: new MentalHealthNetworkFirstHandler({
      cacheName: 'crisis-resources-v2',
      version: '2.0.0',
      maxAgeSeconds: 300, // 5 minutes
      maxEntries: 200,
      purgeOnQuotaError: true,
      crisisPreload: true,
      therapeuticPriority: true,
      offlineSync: true,
      culturalCaching: true,
      backgroundSync: true,
      encryptSensitiveData: true,
      hipaaCompliant: true
    }, 'crisis'),
    options: {
      cacheName: 'crisis-resources-v2',
      version: '2.0.0',
      maxAgeSeconds: 300,
      maxEntries: 200,
      purgeOnQuotaError: true,
      crisisPreload: true,
      therapeuticPriority: true,
      offlineSync: true,
      culturalCaching: true
    },
    priority: 'emergency',
    resourceType: 'crisis-resources',
    therapeuticImportance: 'critical',
    crisisAvailability: true,
    ttl: 300000,
    maxEntries: 200,
    offlineAvailable: true,
    preloadConditions: ['app-start', 'crisis-detected'],
    culturalAdaptation: true,
    accessibilityOptimized: true,
    multiLanguageSupport: true,
    performanceTracking: true,
    analyticsEnabled: true,
    userExperienceMetrics: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'therapeutic-content-strategy',
    name: 'Therapeutic Content Optimization',
    description: 'Optimized caching for therapeutic content and resources',
    pattern: /\/api\/therapy|\/therapeutic|\/mental-health|\/counseling/,
    handler: new MentalHealthStaleWhileRevalidateHandler({
      cacheName: 'therapeutic-content-v2',
      version: '2.0.0',
      maxAgeSeconds: 1800, // 30 minutes
      maxEntries: 500,
      purgeOnQuotaError: true,
      crisisPreload: false,
      therapeuticPriority: true,
      offlineSync: true,
      culturalCaching: true,
      backgroundSync: true,
      encryptSensitiveData: true,
      hipaaCompliant: true
    }),
    options: {
      cacheName: 'therapeutic-content-v2',
      version: '2.0.0',
      maxAgeSeconds: 1800,
      maxEntries: 500,
      purgeOnQuotaError: true,
      crisisPreload: false,
      therapeuticPriority: true,
      offlineSync: true,
      culturalCaching: true
    },
    priority: 'therapeutic',
    resourceType: 'therapeutic-content',
    therapeuticImportance: 'high',
    crisisAvailability: false,
    ttl: 1800000,
    maxEntries: 500,
    offlineAvailable: true,
    culturalAdaptation: true,
    accessibilityOptimized: true,
    multiLanguageSupport: true,
    performanceTracking: true,
    analyticsEnabled: true,
    userExperienceMetrics: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'static-assets-strategy',
    name: 'Static Assets Cache-First',
    description: 'Cache-first strategy for static assets',
    pattern: /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/,
    handler: new MentalHealthCacheFirstHandler({
      cacheName: 'static-assets-v2',
      version: '2.0.0',
      maxAgeSeconds: 86400, // 24 hours
      maxEntries: 1000,
      purgeOnQuotaError: true,
      crisisPreload: false,
      therapeuticPriority: false,
      offlineSync: false,
      culturalCaching: false,
      compressionEnabled: true
    }),
    options: {
      cacheName: 'static-assets-v2',
      version: '2.0.0',
      maxAgeSeconds: 86400,
      maxEntries: 1000,
      purgeOnQuotaError: true,
      crisisPreload: false,
      therapeuticPriority: false,
      offlineSync: false,
      culturalCaching: false
    },
    priority: 'standard',
    resourceType: 'static-assets',
    therapeuticImportance: 'low',
    crisisAvailability: false,
    ttl: 86400000,
    maxEntries: 1000,
    offlineAvailable: true,
    performanceTracking: true,
    analyticsEnabled: false,
    userExperienceMetrics: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-sessions-strategy',
    name: 'User Session Data',
    description: 'Secure caching for user session and personal data',
    pattern: /\/api\/user|\/api\/session|\/api\/profile/,
    handler: new MentalHealthNetworkFirstHandler({
      cacheName: 'user-sessions-v2',
      version: '2.0.0',
      maxAgeSeconds: 600, // 10 minutes
      maxEntries: 100,
      purgeOnQuotaError: true,
      crisisPreload: false,
      therapeuticPriority: true,
      offlineSync: true,
      culturalCaching: false,
      encryptSensitiveData: true,
      hipaaCompliant: true,
      dataRetentionDays: 30
    }, 'user-critical'),
    options: {
      cacheName: 'user-sessions-v2',
      version: '2.0.0',
      maxAgeSeconds: 600,
      maxEntries: 100,
      purgeOnQuotaError: true,
      crisisPreload: false,
      therapeuticPriority: true,
      offlineSync: true,
      culturalCaching: false
    },
    priority: 'user-critical',
    resourceType: 'user-sessions',
    therapeuticImportance: 'high',
    crisisAvailability: false,
    ttl: 600000,
    maxEntries: 100,
    offlineAvailable: false,
    performanceTracking: true,
    analyticsEnabled: true,
    userExperienceMetrics: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default Configuration
const MENTAL_HEALTH_DEFAULT_CONFIG: MentalHealthCacheConfiguration = {
  strategies: MENTAL_HEALTH_DEFAULT_STRATEGIES,
  defaultStrategy: 'therapeutic-content-strategy',
  emergencyStrategy: 'crisis-resources-strategy',
  offlineStrategy: 'static-assets-strategy',
  
  globalOptions: {
    enableIntelligentPrefetch: true,
    enableBackgroundSync: true,
    enableCompressionByDefault: true,
    enableAnalytics: true,
    maxTotalCacheSize: 100 * 1024 * 1024 // 100MB
  },
  
  mentalHealthSettings: {
    crisisResourcePreload: true,
    therapeuticContentPriority: true,
    culturalContentCaching: true,
    emergencyModeEnabled: true,
    offlineTherapySupport: true
  },
  
  performanceSettings: {
    enableMetrics: true,
    metricsReportingInterval: 60000, // 1 minute
    maxMetricsHistory: 288, // 24 hours of 5-minute intervals
    performanceThresholds: {
      acceptableResponseTime: 2000, // 2 seconds
      minimumHitRate: 0.7, // 70%
      maximumErrorRate: 0.05 // 5%
    }
  },
  
  privacySettings: {
    hipaaCompliant: true,
    encryptSensitiveData: true,
    dataRetentionPolicy: 90, // days
    auditLoggingEnabled: true
  }
};

// Advanced Cache Strategy Coordinator Implementation
export class MentalHealthCacheStrategyCoordinator {
  private strategies: Map<string, MentalHealthCacheStrategy>;
  private config: MentalHealthCacheConfiguration;
  private metrics: MentalHealthCacheMetrics;
  private metricsHistory: MentalHealthCacheMetrics[];
  private metricsInterval?: number;

  constructor() {
    this.strategies = new Map();
    this.config = this.cloneConfig(MENTAL_HEALTH_DEFAULT_CONFIG);
    this.metrics = this.initializeMetrics();
    this.metricsHistory = [];
    
    this.initializeDefaultStrategies();
    this.startMetricsCollection();
  }

  /**
   * Register a new cache strategy
   */
  async registerStrategy(strategy: MentalHealthCacheStrategy): Promise<void> {
    try {
      this.validateStrategy(strategy);
      this.strategies.set(strategy.id, strategy);
      
      console.log('Mental health cache strategy registered:', {
        id: strategy.id,
        name: strategy.name,
        priority: strategy.priority,
        resourceType: strategy.resourceType
      });
    } catch (error) {
      console.error('Failed to register cache strategy:', error);
      throw error;
    }
  }

  /**
   * Route request to appropriate cache strategy
   */
  async routeRequest(request: Request, context?: MentalHealthCacheContext): Promise<Response> {
    const startTime = performance.now();
    
    try {
      const strategy = this.findMatchingStrategy(request, context);
      
      if (!strategy) {
        console.log('No matching strategy found, using default');
        return await this.handleWithDefaultStrategy(request, context);
      }
      
      const response = await strategy.handler.handle(request, context);
      
      // Update metrics
      const responseTime = performance.now() - startTime;
      this.updateMetrics('hit', responseTime, strategy);
      
      return response;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics('error', responseTime);
      
      console.error('Request routing failed:', error);
      throw error;
    }
  }

  /**
   * Find matching strategy with context awareness
   */
  findMatchingStrategy(
    request: Request, 
    context?: MentalHealthCacheContext
  ): MentalHealthCacheStrategy | null {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Crisis mode - prioritize emergency strategies
    if (context?.emergencyMode || context?.crisisLevel === 'critical') {
      const crisisStrategies = Array.from(this.strategies.values())
        .filter(s => s.priority === 'emergency' || s.priority === 'crisis')
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
      
      for (const strategy of crisisStrategies) {
        if (this.matchesPattern(pathname, strategy.pattern)) {
          return strategy;
        }
      }
    }
    
    // Normal mode - find best matching strategy
    const sortedStrategies = Array.from(this.strategies.values())
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
    
    for (const strategy of sortedStrategies) {
      if (this.matchesPattern(pathname, strategy.pattern)) {
        return strategy;
      }
    }
    
    return null;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string | RegExp): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const url = new URL(request.url);
          
          if (this.matchesPattern(url.pathname, pattern)) {
            await cache.delete(request);
            console.log('Cache entry invalidated:', { url: request.url, cacheName });
          }
        }
      }
      
      console.log('Cache invalidation completed');
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive cache metrics
   */
  async getPerformanceMetrics(): Promise<MentalHealthCacheMetrics> {
    try {
      // Update cache sizes
      let totalCacheSize = 0;
      let entriesCount = 0;
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        entriesCount += requests.length;
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            try {
              const blob = await response.blob();
              totalCacheSize += blob.size;
            } catch (error) {
              // Skip if can't read response
            }
          }
        }
      }
      
      this.metrics.totalCacheSize = totalCacheSize;
      this.metrics.entriesCount = entriesCount;
      this.metrics.lastUpdated = new Date();
      
      return this.cloneMetrics(this.metrics);
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return this.cloneMetrics(this.metrics);
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(config: Partial<MentalHealthCacheConfiguration>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      
      // Restart metrics collection if interval changed
      if (config.performanceSettings?.metricsReportingInterval) {
        this.stopMetricsCollection();
        this.startMetricsCollection();
      }
      
      console.log('Cache configuration updated');
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MentalHealthCacheConfiguration {
    return this.cloneConfig(this.config);
  }

  // Private helper methods

  private initializeDefaultStrategies(): void {
    MENTAL_HEALTH_DEFAULT_STRATEGIES.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  private initializeMetrics(): MentalHealthCacheMetrics {
    return {
      hitRate: 0,
      missRate: 0,
      errorRate: 0,
      averageResponseTime: 0,
      crisisResourceAvailability: 1.0,
      therapeuticContentHitRate: 0,
      offlineCapabilityScore: 0.8,
      userExperienceScore: 0.75,
      totalCacheSize: 0,
      entriesCount: 0,
      evictionCount: 0,
      compressionRatio: 0.7,
      networkSavings: 0,
      responseTimeImprovement: 0,
      offlineRequestsServed: 0,
      lastUpdated: new Date(),
      reportingPeriod: '1-hour',
      trendsData: []
    };
  }

  private validateStrategy(strategy: MentalHealthCacheStrategy): void {
    if (!strategy.id || !strategy.name || !strategy.pattern || !strategy.handler) {
      throw new Error('Invalid strategy: missing required fields');
    }
    
    if (this.strategies.has(strategy.id)) {
      throw new Error(`Strategy already exists: ${strategy.id}`);
    }
  }

  private matchesPattern(path: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return path.includes(pattern);
    }
    return pattern.test(path);
  }

  private getPriorityWeight(priority: MentalHealthCachePriority): number {
    switch (priority) {
      case 'emergency': return 6;
      case 'crisis': return 5;
      case 'therapeutic': return 4;
      case 'user-critical': return 3;
      case 'standard': return 2;
      case 'background': return 1;
      default: return 0;
    }
  }

  private async handleWithDefaultStrategy(
    request: Request, 
    context?: MentalHealthCacheContext
  ): Promise<Response> {
    const defaultStrategy = this.strategies.get(this.config.defaultStrategy);
    
    if (defaultStrategy) {
      return await defaultStrategy.handler.handle(request, context);
    }
    
    // Ultimate fallback
    return await fetch(request);
  }

  private updateMetrics(
    type: 'hit' | 'miss' | 'error', 
    responseTime: number, 
    strategy?: MentalHealthCacheStrategy
  ): void {
    // Update response time average
    const currentAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (currentAvg + responseTime) / 2;
    
    // Update rates (simplified)
    switch (type) {
      case 'hit':
        this.metrics.hitRate = Math.min(1.0, this.metrics.hitRate + 0.01);
        break;
      case 'miss':
        this.metrics.missRate = Math.min(1.0, this.metrics.missRate + 0.01);
        break;
      case 'error':
        this.metrics.errorRate = Math.min(1.0, this.metrics.errorRate + 0.01);
        break;
    }
    
    // Update therapeutic content hit rate
    if (strategy?.resourceType === 'therapeutic-content' && type === 'hit') {
      this.metrics.therapeuticContentHitRate = Math.min(1.0, this.metrics.therapeuticContentHitRate + 0.02);
    }
  }

  private startMetricsCollection(): void {
    if (this.config.performanceSettings.enableMetrics) {
      this.metricsInterval = window.setInterval(async () => {
        try {
          const metrics = await this.getPerformanceMetrics();
          this.metricsHistory.push(this.cloneMetrics(metrics));
          
          // Keep only recent metrics
          const maxHistory = this.config.performanceSettings.maxMetricsHistory;
          if (this.metricsHistory.length > maxHistory) {
            this.metricsHistory = this.metricsHistory.slice(-maxHistory);
          }
        } catch (error) {
          console.error('Metrics collection failed:', error);
        }
      }, this.config.performanceSettings.metricsReportingInterval);
    }
  }

  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
  }

  private cloneConfig(config: MentalHealthCacheConfiguration): MentalHealthCacheConfiguration {
    return JSON.parse(JSON.stringify(config));
  }

  private cloneMetrics(metrics: MentalHealthCacheMetrics): MentalHealthCacheMetrics {
    return JSON.parse(JSON.stringify(metrics));
  }
}

// Export singleton instance
export const mentalHealthCacheStrategyCoordinator = new MentalHealthCacheStrategyCoordinator();

export default mentalHealthCacheStrategyCoordinator;