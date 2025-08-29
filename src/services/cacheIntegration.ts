/**
 * Intelligent Caching Integration
 *
 * Integrates intelligent caching strategies with the existing enhanced service worker
 * Provides a bridge between our new caching services and the Workbox foundation
 *
 * Features:
 * - Seamless integration with existing Workbox configuration
 * - Intelligent cache warming and preloading
 * - Predictive caching based on user behavior
 * - Crisis resource priority caching
 * - Performance analytics and optimization
 * - Cache invalidation and cleanup strategies
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import intelligentCachingService, { CachePriority, ResourceType } from './intelligentCachingService';
import { cacheStrategyCoordinator } from './cacheStrategyCoordinator';
import { performanceService } from './performanceService';

// Cache Integration Configuration Interface
interface CacheIntegrationConfig {
  enableCacheWarming: boolean;
  enableIntelligentEviction: boolean;
  enableAnalytics: boolean;
  maintenanceInterval: number; // minutes
  preloadThreshold: number; // probability threshold for preloading
  maxCacheSize: number; // MB
  enablePredictiveCaching: boolean;
  crisisResourcePriority: boolean;
}

// Cache Warming Strategy Interface
interface CacheWarmingStrategy {
  name: string;
  resources: Array<{
    url: string;
    priority: CachePriority;
    resourceType: ResourceType;
    conditions?: {
      timeOfDay?: string[];
      userType?: string[];
      sessionLength?: number;
    };
  }>;
  schedule: {
    immediate?: boolean;
    onIdle?: boolean;
    periodic?: number; // minutes
  };
}

// Cache Analytics Interface
interface CacheAnalytics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  averageResponseTime: number;
  cacheSize: number;
  topMissedResources: Array<{
    url: string;
    missCount: number;
    resourceType: ResourceType;
  }>;
  performanceGains: {
    timesSaved: number;
    bandwidthSaved: number;
  };
}

// Predictive Cache Entry Interface
interface PredictiveCacheEntry {
  url: string;
  probability: number;
  resourceType: ResourceType;
  priority: CachePriority;
  lastAccessed: Date;
  accessPattern: {
    frequency: number;
    timePattern: number[]; // hours of day
    sequencePosition?: number;
  };
}

// Cache Health Status Interface
interface CacheHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  issues: Array<{
    type: 'storage_full' | 'high_miss_rate' | 'slow_response' | 'stale_data';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  metrics: {
    storageUsage: number; // percentage
    hitRate: number;
    averageResponseTime: number;
    staleEntries: number;
  };
}

// Main Service Interface
export interface CacheIntegrationService {
  // Initialization and Configuration
  initialize(config?: Partial<CacheIntegrationConfig>): Promise<void>;
  updateConfiguration(config: Partial<CacheIntegrationConfig>): Promise<void>;
  getConfiguration(): CacheIntegrationConfig;

  // Cache Warming
  warmCache(strategy?: CacheWarmingStrategy): Promise<void>;
  preloadCriticalResources(): Promise<void>;
  schedulePeriodicWarming(): void;

  // Intelligent Caching
  enablePredictiveCaching(): Promise<void>;
  disablePredictiveCaching(): void;
  analyzeCachePatterns(): Promise<PredictiveCacheEntry[]>;

  // Analytics and Monitoring
  getAnalytics(): Promise<CacheAnalytics>;
  getCacheHealthStatus(): Promise<CacheHealthStatus>;
  generateCacheReport(): Promise<string>;

  // Maintenance
  performMaintenance(): Promise<void>;
  optimizeCacheStorage(): Promise<void>;
  cleanupStaleEntries(): Promise<number>;

  // Integration Management
  syncWithWorkbox(): Promise<void>;
  validateCacheIntegrity(): Promise<boolean>;
}

// Default Configuration
const DEFAULT_CONFIG: CacheIntegrationConfig = {
  enableCacheWarming: true,
  enableIntelligentEviction: true,
  enableAnalytics: true,
  maintenanceInterval: 60, // 1 hour
  preloadThreshold: 0.7, // 70% probability
  maxCacheSize: 100, // 100 MB
  enablePredictiveCaching: true,
  crisisResourcePriority: true
};

// Crisis Resources for Priority Caching
const CRISIS_RESOURCES = [
  '/crisis-resources',
  '/emergency-contacts',
  '/breathing-exercises',
  '/grounding-techniques',
  '/safety-plan',
  '/crisis-chat',
  '/emergency-protocols'
];

// Default Cache Warming Strategies
const DEFAULT_WARMING_STRATEGIES: CacheWarmingStrategy[] = [
  {
    name: 'crisis-priority',
    resources: CRISIS_RESOURCES.map(url => ({
      url,
      priority: 'critical' as CachePriority,
      resourceType: 'api' as ResourceType
    })),
    schedule: {
      immediate: true,
      onIdle: true
    }
  },
  {
    name: 'common-assets',
    resources: [
      { url: '/assets/css/main.css', priority: 'high' as CachePriority, resourceType: 'static' as ResourceType },
      { url: '/assets/js/vendor.js', priority: 'high' as CachePriority, resourceType: 'static' as ResourceType },
      { url: '/assets/images/logo.png', priority: 'medium' as CachePriority, resourceType: 'image' as ResourceType }
    ],
    schedule: {
      immediate: true
    }
  },
  {
    name: 'user-specific',
    resources: [
      { url: '/api/user/preferences', priority: 'medium' as CachePriority, resourceType: 'api' as ResourceType },
      { url: '/api/user/history', priority: 'low' as CachePriority, resourceType: 'api' as ResourceType }
    ],
    schedule: {
      onIdle: true,
      periodic: 30
    }
  }
];

// Implementation
class CacheIntegrationServiceImpl implements CacheIntegrationService {
  private config: CacheIntegrationConfig = { ...DEFAULT_CONFIG };
  private isInitialized = false;
  private maintenanceInterval?: ReturnType<typeof setTimeout>;
  private predictiveCacheEntries = new Map<string, PredictiveCacheEntry>();
  private accessLog: Array<{ url: string; timestamp: Date; responseTime: number }> = [];
  private analytics: CacheAnalytics = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    cacheSize: 0,
    topMissedResources: [],
    performanceGains: {
      timesSaved: 0,
      bandwidthSaved: 0
    }
  };

  async initialize(config: Partial<CacheIntegrationConfig> = {}): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.config = { ...DEFAULT_CONFIG, ...config };

      // Initialize intelligent caching service
      await intelligentCachingService.initialize();

      // Set up cache strategy coordination
      await this.syncWithWorkbox();

      // Start cache warming if enabled
      if (this.config.enableCacheWarming) {
        await this.preloadCriticalResources();
        this.schedulePeriodicWarming();
      }

      // Enable predictive caching if configured
      if (this.config.enablePredictiveCaching) {
        await this.enablePredictiveCaching();
      }

      // Start maintenance scheduling
      this.startMaintenanceSchedule();

      this.isInitialized = true;
      logger.info('Cache integration service initialized', { config: this.config });
    } catch (error) {
      logger.error('Failed to initialize cache integration service', { error });
      throw error;
    }
  }

  async updateConfiguration(config: Partial<CacheIntegrationConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };

    // Restart maintenance if interval changed
    if (config.maintenanceInterval && config.maintenanceInterval !== oldConfig.maintenanceInterval) {
      this.stopMaintenanceSchedule();
      this.startMaintenanceSchedule();
    }

    // Update predictive caching
    if (config.enablePredictiveCaching !== oldConfig.enablePredictiveCaching) {
      if (config.enablePredictiveCaching) {
        await this.enablePredictiveCaching();
      } else {
        this.disablePredictiveCaching();
      }
    }

    logger.info('Cache integration configuration updated', { config: this.config });
  }

  getConfiguration(): CacheIntegrationConfig {
    return { ...this.config };
  }

  async warmCache(strategy?: CacheWarmingStrategy): Promise<void> {
    try {
      const strategies = strategy ? [strategy] : DEFAULT_WARMING_STRATEGIES;

      for (const warmingStrategy of strategies) {
        logger.info('Warming cache with strategy', { strategy: warmingStrategy.name });

        for (const resource of warmingStrategy.resources) {
          try {
            // Check conditions if specified
            if (resource.conditions && !this.checkWarmingConditions(resource.conditions)) {
              continue;
            }

            // Warm the cache for this resource
            await intelligentCachingService.preloadResource(
              resource.url,
              resource.resourceType,
              resource.priority
            );

            logger.debug('Cache warmed for resource', { url: resource.url });
          } catch (error) {
            logger.warn('Failed to warm cache for resource', { url: resource.url, error });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to warm cache', { error });
      throw error;
    }
  }

  async preloadCriticalResources(): Promise<void> {
    try {
      // Preload crisis resources with highest priority
      const crisisStrategy = DEFAULT_WARMING_STRATEGIES.find(s => s.name === 'crisis-priority');
      if (crisisStrategy) {
        await this.warmCache(crisisStrategy);
      }

      // Preload common assets
      const assetsStrategy = DEFAULT_WARMING_STRATEGIES.find(s => s.name === 'common-assets');
      if (assetsStrategy) {
        await this.warmCache(assetsStrategy);
      }

      logger.info('Critical resources preloaded');
    } catch (error) {
      logger.error('Failed to preload critical resources', { error });
    }
  }

  schedulePeriodicWarming(): void {
    // Schedule warming during idle periods
    if ('requestIdleCallback' in window) {
      const scheduleNextWarming = () => {
        window.requestIdleCallback(async () => {
          try {
            const userSpecificStrategy = DEFAULT_WARMING_STRATEGIES.find(s => s.name === 'user-specific');
            if (userSpecificStrategy) {
              await this.warmCache(userSpecificStrategy);
            }
          } catch (error) {
            logger.error('Periodic cache warming failed', { error });
          }
          
          // Schedule next warming in 30 minutes
          setTimeout(scheduleNextWarming, 30 * 60 * 1000);
        });
      };
      
      scheduleNextWarming();
    }
  }

  async enablePredictiveCaching(): Promise<void> {
    try {
      // Analyze existing access patterns
      const patterns = await this.analyzeCachePatterns();
      
      // Store predictive entries
      patterns.forEach(entry => {
        this.predictiveCacheEntries.set(entry.url, entry);
      });

      // Set up request interception for learning
      this.setupPredictiveLearning();

      logger.info('Predictive caching enabled', { patterns: patterns.length });
    } catch (error) {
      logger.error('Failed to enable predictive caching', { error });
    }
  }

  disablePredictiveCaching(): void {
    this.predictiveCacheEntries.clear();
    logger.info('Predictive caching disabled');
  }

  async analyzeCachePatterns(): Promise<PredictiveCacheEntry[]> {
    try {
      const patterns: PredictiveCacheEntry[] = [];
      
      // Analyze access log for patterns
      const urlAccess = new Map<string, Array<{ timestamp: Date; responseTime: number }>>();
      
      this.accessLog.forEach(entry => {
        if (!urlAccess.has(entry.url)) {
          urlAccess.set(entry.url, []);
        }
        urlAccess.get(entry.url)!.push({
          timestamp: entry.timestamp,
          responseTime: entry.responseTime
        });
      });

      // Generate predictive entries
      urlAccess.forEach((accesses, url) => {
        if (accesses.length < 3) return; // Need minimum data

        const frequency = accesses.length / 30; // accesses per day (assuming 30 days of data)
        const timePattern = this.analyzeTimePattern(accesses);
        const avgResponseTime = accesses.reduce((sum, a) => sum + a.responseTime, 0) / accesses.length;
        
        // Calculate probability based on frequency and recency
        const recentAccesses = accesses.filter(a => 
          Date.now() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // last 7 days
        );
        const probability = Math.min(1, (recentAccesses.length / 7) * 0.2 + frequency * 0.1);

        if (probability >= this.config.preloadThreshold) {
          patterns.push({
            url,
            probability,
            resourceType: this.inferResourceType(url),
            priority: this.calculatePriority(probability, avgResponseTime),
            lastAccessed: new Date(Math.max(...accesses.map(a => a.timestamp.getTime()))),
            accessPattern: {
              frequency,
              timePattern
            }
          });
        }
      });

      return patterns.sort((a, b) => b.probability - a.probability);
    } catch (error) {
      logger.error('Failed to analyze cache patterns', { error });
      return [];
    }
  }

  async getAnalytics(): Promise<CacheAnalytics> {
    try {
      // Update analytics from cache strategy coordinator
      const cacheMetrics = await cacheStrategyCoordinator.getPerformanceMetrics();
      
      this.analytics.hitRate = cacheMetrics.hitRate;
      this.analytics.missRate = cacheMetrics.missRate;
      this.analytics.averageResponseTime = cacheMetrics.averageResponseTime;
      this.analytics.cacheSize = cacheMetrics.cacheSize;

      // Calculate performance gains
      this.analytics.performanceGains.timesSaved = 
        this.analytics.totalRequests * this.analytics.hitRate * this.analytics.averageResponseTime;
      
      // Estimate bandwidth saved (assuming average response size of 50KB)
      this.analytics.performanceGains.bandwidthSaved = 
        this.analytics.totalRequests * this.analytics.hitRate * 50 * 1024;

      return { ...this.analytics };
    } catch (error) {
      logger.error('Failed to get cache analytics', { error });
      return this.analytics;
    }
  }

  async getCacheHealthStatus(): Promise<CacheHealthStatus> {
    try {
      const analytics = await this.getAnalytics();
      const issues: CacheHealthStatus['issues'] = [];
      
      // Check storage usage
      const storageUsage = (analytics.cacheSize / (this.config.maxCacheSize * 1024 * 1024)) * 100;
      if (storageUsage > 90) {
        issues.push({
          type: 'storage_full',
          severity: 'high',
          description: `Cache storage is ${storageUsage.toFixed(1)}% full`,
          recommendation: 'Run cache cleanup or increase max cache size'
        });
      } else if (storageUsage > 75) {
        issues.push({
          type: 'storage_full',
          severity: 'medium',
          description: `Cache storage is ${storageUsage.toFixed(1)}% full`,
          recommendation: 'Consider running cache cleanup'
        });
      }

      // Check hit rate
      if (analytics.hitRate < 0.5) {
        issues.push({
          type: 'high_miss_rate',
          severity: 'medium',
          description: `Cache hit rate is low: ${(analytics.hitRate * 100).toFixed(1)}%`,
          recommendation: 'Review cache warming strategies and resource prioritization'
        });
      }

      // Check response times
      if (analytics.averageResponseTime > 1000) {
        issues.push({
          type: 'slow_response',
          severity: 'medium',
          description: `Average response time is high: ${analytics.averageResponseTime.toFixed(0)}ms`,
          recommendation: 'Optimize cache storage and consider SSD storage'
        });
      }

      // Determine overall health
      const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
      const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;
      
      let overall: CacheHealthStatus['overall'] = 'healthy';
      if (highSeverityIssues > 0) {
        overall = 'critical';
      } else if (mediumSeverityIssues > 2) {
        overall = 'critical';
      } else if (mediumSeverityIssues > 0) {
        overall = 'warning';
      }

      return {
        overall,
        issues,
        metrics: {
          storageUsage,
          hitRate: analytics.hitRate,
          averageResponseTime: analytics.averageResponseTime,
          staleEntries: 0 // TODO: Implement stale entry detection
        }
      };
    } catch (error) {
      logger.error('Failed to get cache health status', { error });
      return {
        overall: 'critical',
        issues: [{
          type: 'slow_response',
          severity: 'high',
          description: 'Unable to determine cache health',
          recommendation: 'Check cache integration service'
        }],
        metrics: {
          storageUsage: 0,
          hitRate: 0,
          averageResponseTime: 0,
          staleEntries: 0
        }
      };
    }
  }

  async generateCacheReport(): Promise<string> {
    try {
      const analytics = await this.getAnalytics();
      const health = await this.getCacheHealthStatus();
      
      let report = '# Cache Integration Report\n\n';
      report += `Generated: ${new Date().toISOString()}\n\n`;
      
      report += '## Health Status\n';
      report += `Overall: ${health.overall.toUpperCase()}\n`;
      report += `Storage Usage: ${health.metrics.storageUsage.toFixed(1)}%\n`;
      report += `Hit Rate: ${(health.metrics.hitRate * 100).toFixed(1)}%\n`;
      report += `Average Response Time: ${health.metrics.averageResponseTime.toFixed(0)}ms\n\n`;
      
      if (health.issues.length > 0) {
        report += '## Issues\n';
        health.issues.forEach(issue => {
          report += `- **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
          report += `  Recommendation: ${issue.recommendation}\n\n`;
        });
      }
      
      report += '## Performance Analytics\n';
      report += `Total Requests: ${analytics.totalRequests}\n`;
      report += `Cache Size: ${(analytics.cacheSize / (1024 * 1024)).toFixed(2)} MB\n`;
      report += `Time Saved: ${(analytics.performanceGains.timesSaved / 1000).toFixed(2)} seconds\n`;
      report += `Bandwidth Saved: ${(analytics.performanceGains.bandwidthSaved / (1024 * 1024)).toFixed(2)} MB\n\n`;
      
      if (analytics.topMissedResources.length > 0) {
        report += '## Top Missed Resources\n';
        analytics.topMissedResources.forEach(resource => {
          report += `- ${resource.url} (${resource.missCount} misses)\n`;
        });
      }
      
      return report;
    } catch (error) {
      logger.error('Failed to generate cache report', { error });
      return 'Error generating cache report';
    }
  }

  async performMaintenance(): Promise<void> {
    try {
      logger.info('Starting cache maintenance');
      
      // Clean up stale entries
      const cleanedEntries = await this.cleanupStaleEntries();
      
      // Optimize cache storage
      await this.optimizeCacheStorage();
      
      // Validate cache integrity
      const isValid = await this.validateCacheIntegrity();
      
      // Update analytics
      await this.getAnalytics();
      
      logger.info('Cache maintenance completed', { 
        cleanedEntries, 
        cacheValid: isValid 
      });
    } catch (error) {
      logger.error('Cache maintenance failed', { error });
    }
  }

  async optimizeCacheStorage(): Promise<void> {
    try {
      // Get current cache size and health
      const health = await this.getCacheHealthStatus();
      
      if (health.metrics.storageUsage > 80) {
        // Remove least recently used entries
        await intelligentCachingService.evictLRU(0.2); // Remove 20% of cache
        logger.info('Cache storage optimized - removed LRU entries');
      }
      
      // Defragment cache storage if supported
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        logger.debug('Storage estimate after optimization', { estimate });
      }
    } catch (error) {
      logger.error('Failed to optimize cache storage', { error });
    }
  }

  async cleanupStaleEntries(): Promise<number> {
    try {
      let cleanedCount = 0;
      
      // Clean up stale predictive cache entries
      const staleThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      
      for (const [url, entry] of Array.from(this.predictiveCacheEntries.entries())) {
        if (entry.lastAccessed.getTime() < staleThreshold) {
          this.predictiveCacheEntries.delete(url);
          cleanedCount++;
        }
      }
      
      // Clean up old access log entries
      const logThreshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
      this.accessLog = this.accessLog.filter(entry => 
        entry.timestamp.getTime() > logThreshold
      );
      
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup stale entries', { error });
      return 0;
    }
  }

  async syncWithWorkbox(): Promise<void> {
    try {
      // Register cache strategies with strategy coordinator
      const strategies = [
        {
          name: 'crisis-resources-integration',
          pattern: new RegExp('/crisis|/emergency|/safety'),
          priority: 'critical' as CachePriority,
          resourceType: 'api' as ResourceType
        },
        {
          name: 'api-integration',
          pattern: new RegExp('/api/'),
          priority: 'medium' as CachePriority,
          resourceType: 'api' as ResourceType
        }
      ];

      for (const strategy of strategies) {
        await intelligentCachingService.setCacheStrategy(
          strategy.resourceType,
          strategy.priority
        );
      }

      logger.info('Cache integration synced with Workbox');
    } catch (error) {
      logger.error('Failed to sync with Workbox', { error });
    }
  }

  async validateCacheIntegrity(): Promise<boolean> {
    try {
      // Basic integrity checks
      const cacheNames = await caches.keys();
      let validCaches = 0;

      for (const cacheName of cacheNames) {
        try {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          
          // Check if cache has entries
          if (keys.length > 0) {
            validCaches++;
          }
        } catch (error) {
          logger.warn('Invalid cache found', { cacheName, error });
        }
      }

      const isValid = validCaches > 0;
      logger.debug('Cache integrity validation', { 
        totalCaches: cacheNames.length, 
        validCaches, 
        isValid 
      });

      return isValid;
    } catch (error) {
      logger.error('Failed to validate cache integrity', { error });
      return false;
    }
  }

  // Private helper methods
  private startMaintenanceSchedule(): void {
    this.maintenanceInterval = setInterval(async () => {
      await this.performMaintenance();
    }, this.config.maintenanceInterval * 60 * 1000);
  }

  private stopMaintenanceSchedule(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = undefined;
    }
  }

  private checkWarmingConditions(conditions: any): boolean {
    // Simple condition checking - can be expanded
    if (conditions.timeOfDay) {
      const currentHour = new Date().getHours();
      return conditions.timeOfDay.includes(currentHour.toString());
    }
    return true;
  }

  private setupPredictiveLearning(): void {
    // Intercept requests to learn access patterns
    // This would typically be done through service worker
    // For now, we'll simulate with a simple learning mechanism
    
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      try {
        const response = await originalFetch(input, init);
        const responseTime = performance.now() - startTime;
        
        // Log access for learning
        this.accessLog.push({
          url,
          timestamp: new Date(),
          responseTime
        });
        
        // Limit log size
        if (this.accessLog.length > 10000) {
          this.accessLog = this.accessLog.slice(-5000);
        }
        
        return response;
      } catch (error) {
        logger.debug('Request failed', { url, error });
        throw error;
      }
    };
  }

  private analyzeTimePattern(accesses: Array<{ timestamp: Date }>): number[] {
    const hourCounts = new Array(24).fill(0);
    
    accesses.forEach(access => {
      const hour = access.timestamp.getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts;
  }

  private inferResourceType(url: string): ResourceType {
    if (url.includes('/api/')) return 'data';
    if (url.match(/\.css$/)) return 'css';
    if (url.match(/\.js$/)) return 'js';
    if (url.match(/\.(png|jpg|jpeg|gif|svg)$/)) return 'image';
    if (url.match(/\.(html|htm)$/)) return 'html';
    return 'data';
  }

  private calculatePriority(probability: number, responseTime: number): CachePriority {
    if (probability > 0.9 || responseTime > 2000) return 'critical';
    if (probability > 0.7 || responseTime > 1000) return 'high';
    if (probability > 0.5) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const cacheIntegrationService = new CacheIntegrationServiceImpl();
