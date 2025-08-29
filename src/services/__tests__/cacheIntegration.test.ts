import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface CacheItem {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

class CacheIntegration {
  private cache: Map<string, CacheItem> = new Map();
  private stats = { hits: 0, misses: 0, evictions: 0 };

  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    item.hits++;
    this.stats.hits++;
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return { ...this.stats, size: this.cache.size };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.stats.evictions++;
      }
    }
  }
}

describe('CacheIntegration', () => {
  let cache: CacheIntegration;

  beforeEach(() => {
    cache = new CacheIntegration();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get cache items', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should handle cache misses', () => {
    expect(cache.get('nonexistent')).toBeNull();
    expect(cache.getStats().misses).toBe(1);
  });

  it('should respect TTL', async () => {
    cache.set('key1', 'value1', 100); // 100ms TTL
    
    expect(cache.get('key1')).toBe('value1');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });

  it('should track statistics', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key1');
    cache.get('nonexistent');

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
  });

  it('should cleanup expired items', async () => {
    cache.set('key1', 'value1', 100);
    cache.set('key2', 'value2', 300000);

    await new Promise(resolve => setTimeout(resolve, 150));
    cache.cleanup();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('should delete items', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeNull();
  });
});
