import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

class IntelligentCachingService {
  private cache: Map<string, { data: any; timestamp: number; accessCount: number }> = new Map();
  private maxSize: number = 100;
  private ttl: number = 300000; // 5 minutes

  set(key: string, data: any): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    entry.accessCount++;
    return entry.data;
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let minAccessCount = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }

  getStats(): { size: number; hits: number; misses: number } {
    let hits = 0;
    for (const entry of this.cache.values()) {
      hits += entry.accessCount;
    }
    return { size: this.cache.size, hits, misses: 0 };
  }
}

describe('IntelligentCachingService', () => {
  let service: IntelligentCachingService;

  beforeEach(() => {
    service = new IntelligentCachingService();
  });

  afterEach(() => {
    service.clear();
  });

  it('should cache and retrieve data', () => {
    service.set('key1', { data: 'test' });
    const result = service.get('key1');
    expect(result).toEqual({ data: 'test' });
  });

  it('should return null for missing keys', () => {
    const result = service.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should expire old entries', () => {
    const oldService = new IntelligentCachingService();
    oldService['ttl'] = 100; // Set short TTL
    
    oldService.set('expire-key', 'data');
    
    // Wait for expiration
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);
    
    const result = oldService.get('expire-key');
    expect(result).toBeNull();
  });

  it('should evict least used items when full', () => {
    const smallCache = new IntelligentCachingService();
    smallCache['maxSize'] = 2;
    
    smallCache.set('key1', 'data1');
    smallCache.set('key2', 'data2');
    
    // Access key2 to increase its usage
    smallCache.get('key2');
    
    // This should evict key1
    smallCache.set('key3', 'data3');
    
    expect(smallCache.get('key1')).toBeNull();
    expect(smallCache.get('key2')).toBe('data2');
    expect(smallCache.get('key3')).toBe('data3');
  });

  it('should invalidate specific keys', () => {
    service.set('key1', 'data1');
    service.invalidate('key1');
    expect(service.get('key1')).toBeNull();
  });

  it('should invalidate by pattern', () => {
    service.set('user:1', 'data1');
    service.set('user:2', 'data2');
    service.set('post:1', 'data3');
    
    service.invalidatePattern('user:.*');
    
    expect(service.get('user:1')).toBeNull();
    expect(service.get('user:2')).toBeNull();
    expect(service.get('post:1')).toBe('data3');
  });

  it('should provide cache statistics', () => {
    service.set('key1', 'data1');
    service.get('key1');
    service.get('key1');
    
    const stats = service.getStats();
    expect(stats.size).toBe(1);
    expect(stats.hits).toBe(2);
  });
});
