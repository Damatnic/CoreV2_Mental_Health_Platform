/**
 * Cache Strategy Coordinator Tests
 * 
 * Comprehensive test suite for cache strategy coordination,
 * ensuring optimal performance and data consistency across the mental health platform.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock interfaces
interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  size: number;
  hitCount: number;
  lastAccessed: number;
}

interface CacheStrategy {
  name: string;
  maxSize: number;
  ttl: number;
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'PRIORITY';
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  avgResponseTime: number;
  totalRequests: number;
}

interface CacheCoordinatorConfig {
  strategies: Record<string, CacheStrategy>;
  globalMaxMemory: number;
  compressionThreshold: number;
  monitoringEnabled: boolean;
  autoOptimization: boolean;
}

// Mock Cache Strategy Coordinator
class MockCacheStrategyCoordinator {
  private caches: Map<string, Map<string, CacheEntry>> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();
  private metrics: Map<string, CachePerformanceMetrics> = new Map();
  private config: CacheCoordinatorConfig;

  constructor(config: CacheCoordinatorConfig) {
    this.config = config;
    this.initializeStrategies();
    this.initializeMetrics();
  }

  private initializeStrategies(): void {
    Object.entries(this.config.strategies).forEach(([name, strategy]) => {
      this.strategies.set(name, strategy);
      this.caches.set(name, new Map());
    });
  }

  private initializeMetrics(): void {
    this.strategies.forEach((_, name) => {
      this.metrics.set(name, {
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        memoryUsage: 0,
        avgResponseTime: 0,
        totalRequests: 0
      });
    });
  }

  async set<T>(strategyName: string, key: string, data: T, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<boolean> {
    const strategy = this.strategies.get(strategyName);
    const cache = this.caches.get(strategyName);
    
    if (!strategy || !cache) {
      throw new Error(`Cache strategy '${strategyName}' not found`);
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + strategy.ttl,
      priority,
      size: this.calculateSize(data),
      hitCount: 0,
      lastAccessed: Date.now()
    };

    // Check if eviction is needed
    if (cache.size >= strategy.maxSize) {
      await this.evictEntries(strategyName, 1);
    }

    cache.set(key, entry);
    this.updateMetrics(strategyName, 'set');
    
    return true;
  }

  async get<T>(strategyName: string, key: string): Promise<T | null> {
    const cache = this.caches.get(strategyName);
    const metrics = this.metrics.get(strategyName);
    
    if (!cache || !metrics) {
      return null;
    }

    const entry = cache.get(key);
    
    if (!entry) {
      metrics.missRate = (metrics.missRate * metrics.totalRequests + 1) / (metrics.totalRequests + 1);
      metrics.totalRequests++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      metrics.missRate = (metrics.missRate * metrics.totalRequests + 1) / (metrics.totalRequests + 1);
      metrics.totalRequests++;
      return null;
    }

    // Update access patterns
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    
    // Update metrics
    metrics.hitRate = (metrics.hitRate * metrics.totalRequests + 1) / (metrics.totalRequests + 1);
    metrics.totalRequests++;

    return entry.data as T;
  }

  async invalidate(strategyName: string, key: string): Promise<boolean> {
    const cache = this.caches.get(strategyName);
    if (!cache) return false;
    
    return cache.delete(key);
  }

  async clear(strategyName: string): Promise<void> {
    const cache = this.caches.get(strategyName);
    if (cache) {
      cache.clear();
    }
  }

  async evictEntries(strategyName: string, count: number): Promise<number> {
    const cache = this.caches.get(strategyName);
    const strategy = this.strategies.get(strategyName);
    const metrics = this.metrics.get(strategyName);
    
    if (!cache || !strategy || !metrics) return 0;

    const entries = Array.from(cache.entries());
    let evicted = 0;

    switch (strategy.evictionPolicy) {
      case 'LRU':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'LFU':
        entries.sort(([, a], [, b]) => a.hitCount - b.hitCount);
        break;
      case 'FIFO':
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        break;
      case 'TTL':
        entries.sort(([, a], [, b]) => a.expiresAt - b.expiresAt);
        break;
      case 'PRIORITY':
        const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
        entries.sort(([, a], [, b]) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
    }

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i];
      cache.delete(key);
      evicted++;
    }

    metrics.evictionCount += evicted;
    return evicted;
  }

  getMetrics(strategyName?: string): CachePerformanceMetrics | Record<string, CachePerformanceMetrics> {
    if (strategyName) {
      return this.metrics.get(strategyName) || this.createEmptyMetrics();
    }
    
    const allMetrics: Record<string, CachePerformanceMetrics> = {};
    this.metrics.forEach((metrics, name) => {
      allMetrics[name] = { ...metrics };
    });
    
    return allMetrics;
  }

  async optimizeStrategies(): Promise<void> {
    if (!this.config.autoOptimization) return;

    for (const [name, strategy] of this.strategies) {
      const metrics = this.metrics.get(name);
      if (!metrics) continue;

      // Auto-adjust TTL based on hit rate
      if (metrics.hitRate < 0.5 && strategy.ttl > 60000) {
        strategy.ttl = Math.max(strategy.ttl * 0.8, 60000);
      } else if (metrics.hitRate > 0.8 && strategy.ttl < 3600000) {
        strategy.ttl = Math.min(strategy.ttl * 1.2, 3600000);
      }

      // Auto-adjust max size based on eviction rate
      const evictionRate = metrics.evictionCount / Math.max(metrics.totalRequests, 1);
      if (evictionRate > 0.1 && strategy.maxSize < 10000) {
        strategy.maxSize = Math.min(strategy.maxSize * 1.1, 10000);
      }
    }
  }

  getMemoryUsage(): number {
    let totalMemory = 0;
    
    this.caches.forEach((cache) => {
      cache.forEach((entry) => {
        totalMemory += entry.size;
      });
    });
    
    return totalMemory;
  }

  async preload(strategyName: string, keys: string[], dataProvider: (key: string) => Promise<any>): Promise<void> {
    for (const key of keys) {
      try {
        const data = await dataProvider(key);
        await this.set(strategyName, key, data, 'high');
      } catch (error) {
        console.warn(`Failed to preload key ${key}:`, error);
      }
    }
  }

  private calculateSize(data: any): number {
    // Simplified size calculation
    return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
  }

  private updateMetrics(strategyName: string, operation: 'set' | 'get'): void {
    const metrics = this.metrics.get(strategyName);
    if (!metrics) return;

    if (operation === 'set') {
      metrics.memoryUsage = this.calculateCacheMemoryUsage(strategyName);
    }
  }

  private calculateCacheMemoryUsage(strategyName: string): number {
    const cache = this.caches.get(strategyName);
    if (!cache) return 0;

    let usage = 0;
    cache.forEach((entry) => {
      usage += entry.size;
    });

    return usage;
  }

  private createEmptyMetrics(): CachePerformanceMetrics {
    return {
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryUsage: 0,
      avgResponseTime: 0,
      totalRequests: 0
    };
  }
}

// Test suite
describe('CacheStrategyCoordinator', () => {
  let coordinator: MockCacheStrategyCoordinator;
  let config: CacheCoordinatorConfig;

  beforeEach(() => {
    config = {
      strategies: {
        'user-data': {
          name: 'user-data',
          maxSize: 1000,
          ttl: 300000, // 5 minutes
          evictionPolicy: 'LRU',
          compressionEnabled: false,
          persistToDisk: false
        },
        'session-cache': {
          name: 'session-cache',
          maxSize: 500,
          ttl: 1800000, // 30 minutes
          evictionPolicy: 'TTL',
          compressionEnabled: true,
          persistToDisk: true
        },
        'static-resources': {
          name: 'static-resources',
          maxSize: 2000,
          ttl: 86400000, // 24 hours
          evictionPolicy: 'LFU',
          compressionEnabled: true,
          persistToDisk: true
        }
      },
      globalMaxMemory: 100000000, // 100MB
      compressionThreshold: 1024,
      monitoringEnabled: true,
      autoOptimization: true
    };

    coordinator = new MockCacheStrategyCoordinator(config);
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Basic Cache Operations', () => {
    test('should set and get data successfully', async () => {
      const testData = { id: 1, name: 'Test User', mood: 'happy' };
      
      await coordinator.set('user-data', 'user1', testData);
      const retrieved = await coordinator.get('user-data', 'user1');
      
      expect(retrieved).toEqual(testData);
    });

    test('should return null for non-existent keys', async () => {
      const result = await coordinator.get('user-data', 'non-existent');
      expect(result).toBeNull();
    });

    test('should handle multiple cache strategies', async () => {
      await coordinator.set('user-data', 'user1', { mood: 'happy' });
      await coordinator.set('session-cache', 'session1', { token: 'abc123' });
      await coordinator.set('static-resources', 'logo', { url: '/logo.png' });

      expect(await coordinator.get('user-data', 'user1')).toBeTruthy();
      expect(await coordinator.get('session-cache', 'session1')).toBeTruthy();
      expect(await coordinator.get('static-resources', 'logo')).toBeTruthy();
    });

    test('should handle data expiration', async () => {
      // Mock a strategy with very short TTL for testing
      const shortTTLCoordinator = new MockCacheStrategyCoordinator({
        ...config,
        strategies: {
          'short-lived': {
            name: 'short-lived',
            maxSize: 100,
            ttl: 1, // 1ms
            evictionPolicy: 'TTL',
            compressionEnabled: false,
            persistToDisk: false
          }
        }
      });

      await shortTTLCoordinator.set('short-lived', 'temp', { data: 'test' });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await shortTTLCoordinator.get('short-lived', 'temp');
      expect(result).toBeNull();
    });
  });

  describe('Cache Eviction Policies', () => {
    test('should evict entries using LRU policy', async () => {
      // Fill cache to capacity
      for (let i = 0; i < 1000; i++) {
        await coordinator.set('user-data', `user${i}`, { id: i });
      }

      // Access some entries to make them "recently used"
      await coordinator.get('user-data', 'user500');
      await coordinator.get('user-data', 'user750');

      // Add one more to trigger eviction
      await coordinator.set('user-data', 'new-user', { id: 'new' });

      // Recently used entries should still be there
      expect(await coordinator.get('user-data', 'user500')).toBeTruthy();
      expect(await coordinator.get('user-data', 'user750')).toBeTruthy();
      expect(await coordinator.get('user-data', 'new-user')).toBeTruthy();

      // Some old entries should be evicted
      expect(await coordinator.get('user-data', 'user0')).toBeNull();
    });

    test('should respect priority-based eviction', async () => {
      const priorityCoordinator = new MockCacheStrategyCoordinator({
        ...config,
        strategies: {
          'priority-cache': {
            name: 'priority-cache',
            maxSize: 3,
            ttl: 300000,
            evictionPolicy: 'PRIORITY',
            compressionEnabled: false,
            persistToDisk: false
          }
        }
      });

      // Fill with different priorities
      await priorityCoordinator.set('priority-cache', 'low-item', { data: 'low' }, 'low');
      await priorityCoordinator.set('priority-cache', 'high-item', { data: 'high' }, 'high');
      await priorityCoordinator.set('priority-cache', 'critical-item', { data: 'critical' }, 'critical');

      // This should evict the low priority item
      await priorityCoordinator.set('priority-cache', 'medium-item', { data: 'medium' }, 'medium');

      expect(await priorityCoordinator.get('priority-cache', 'low-item')).toBeNull();
      expect(await priorityCoordinator.get('priority-cache', 'critical-item')).toBeTruthy();
      expect(await priorityCoordinator.get('priority-cache', 'high-item')).toBeTruthy();
      expect(await priorityCoordinator.get('priority-cache', 'medium-item')).toBeTruthy();
    });
  });

  describe('Performance Metrics', () => {
    test('should track hit and miss rates', async () => {
      await coordinator.set('user-data', 'user1', { mood: 'happy' });

      // Generate hits
      await coordinator.get('user-data', 'user1');
      await coordinator.get('user-data', 'user1');

      // Generate misses
      await coordinator.get('user-data', 'user2');
      await coordinator.get('user-data', 'user3');

      const metrics = coordinator.getMetrics('user-data') as CachePerformanceMetrics;
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.hitRate).toBeGreaterThan(0);
      expect(metrics.missRate).toBeGreaterThan(0);
    });

    test('should track memory usage', async () => {
      await coordinator.set('user-data', 'user1', { data: 'small' });
      await coordinator.set('user-data', 'user2', { data: 'larger data content' });

      const memoryUsage = coordinator.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
    });

    test('should track eviction counts', async () => {
      // Fill beyond capacity to trigger evictions
      for (let i = 0; i < 1005; i++) {
        await coordinator.set('user-data', `user${i}`, { id: i });
      }

      const metrics = coordinator.getMetrics('user-data') as CachePerformanceMetrics;
      expect(metrics.evictionCount).toBeGreaterThan(0);
    });
  });

  describe('Cache Optimization', () => {
    test('should optimize strategies based on performance', async () => {
      const initialTTL = config.strategies['user-data'].ttl;

      // Simulate poor performance
      for (let i = 0; i < 100; i++) {
        await coordinator.get('user-data', `missing-key-${i}`); // All misses
      }

      await coordinator.optimizeStrategies();

      // TTL should be adjusted for poor hit rate
      const userDataStrategy = coordinator['strategies'].get('user-data');
      expect(userDataStrategy?.ttl).toBeLessThanOrEqual(initialTTL);
    });
  });

  describe('Data Preloading', () => {
    test('should preload data successfully', async () => {
      const dataProvider = jest.fn().mockImplementation((key: string) => {
        return Promise.resolve({ id: key, data: `data-for-${key}` });
      });

      await coordinator.preload('user-data', ['key1', 'key2', 'key3'], dataProvider);

      expect(dataProvider).toHaveBeenCalledTimes(3);
      expect(await coordinator.get('user-data', 'key1')).toEqual({ id: 'key1', data: 'data-for-key1' });
      expect(await coordinator.get('user-data', 'key2')).toEqual({ id: 'key2', data: 'data-for-key2' });
      expect(await coordinator.get('user-data', 'key3')).toEqual({ id: 'key3', data: 'data-for-key3' });
    });

    test('should handle preload failures gracefully', async () => {
      const dataProvider = jest.fn().mockImplementation((key: string) => {
        if (key === 'failing-key') {
          return Promise.reject(new Error('Data loading failed'));
        }
        return Promise.resolve({ id: key });
      });

      // Should not throw despite one failure
      await expect(
        coordinator.preload('user-data', ['good-key', 'failing-key'], dataProvider)
      ).resolves.not.toThrow();

      expect(await coordinator.get('user-data', 'good-key')).toBeTruthy();
      expect(await coordinator.get('user-data', 'failing-key')).toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate specific entries', async () => {
      await coordinator.set('user-data', 'user1', { mood: 'happy' });
      await coordinator.set('user-data', 'user2', { mood: 'sad' });

      expect(await coordinator.get('user-data', 'user1')).toBeTruthy();
      
      await coordinator.invalidate('user-data', 'user1');
      
      expect(await coordinator.get('user-data', 'user1')).toBeNull();
      expect(await coordinator.get('user-data', 'user2')).toBeTruthy();
    });

    test('should clear entire cache strategies', async () => {
      await coordinator.set('user-data', 'user1', { mood: 'happy' });
      await coordinator.set('user-data', 'user2', { mood: 'sad' });

      await coordinator.clear('user-data');

      expect(await coordinator.get('user-data', 'user1')).toBeNull();
      expect(await coordinator.get('user-data', 'user2')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid strategy names', async () => {
      await expect(coordinator.set('invalid-strategy', 'key', 'data'))
        .rejects.toThrow("Cache strategy 'invalid-strategy' not found");
    });

    test('should handle null/undefined values gracefully', async () => {
      await coordinator.set('user-data', 'null-value', null);
      await coordinator.set('user-data', 'undefined-value', undefined);

      expect(await coordinator.get('user-data', 'null-value')).toBeNull();
      expect(await coordinator.get('user-data', 'undefined-value')).toBeUndefined();
    });
  });
});