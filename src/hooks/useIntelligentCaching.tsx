import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CacheStats {
  size: number;
  hitRate: number;
  totalRequests: number;
  totalHits: number;
  memoryUsage: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  priorityWeights: Record<string, number>;
}

interface IntelligentCacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, options?: CacheSetOptions) => void;
  invalidate: (key: string) => void;
  invalidateByPattern: (pattern: string) => void;
  clear: () => void;
  getStats: () => CacheStats;
  prefetch: <T>(key: string, fetcher: () => Promise<T>, options?: CacheSetOptions) => Promise<void>;
  warmup: (keys: string[], fetchers: (() => Promise<any>)[]) => Promise<void>;
}

interface CacheSetOptions {
  ttl?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

const defaultConfig: CacheConfig = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  priorityWeights: {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }
};

const IntelligentCacheContext = createContext<IntelligentCacheContextType | null>(null);

export const useIntelligentCache = () => {
  const context = useContext(IntelligentCacheContext);
  if (!context) {
    throw new Error('useIntelligentCache must be used within an IntelligentCacheProvider');
  }
  return context;
};

interface IntelligentCacheProviderProps {
  children: React.ReactNode;
  config?: Partial<CacheConfig>;
}

export const IntelligentCacheProvider: React.FC<IntelligentCacheProviderProps> = ({
  children,
  config: userConfig = {}
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const tags = useRef<Map<string, Set<string>>>(new Map());
  const stats = useRef({
    totalRequests: 0,
    totalHits: 0
  });
  const [, forceUpdate] = useState({});
  
  // Cleanup interval
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate cache score for eviction
  const calculateCacheScore = (entry: CacheEntry): number => {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceAccess = now - entry.lastAccessed;
    const priorityWeight = config.priorityWeights[entry.priority] || 1;
    
    // Score based on access frequency, recency, and priority
    const accessFrequency = entry.accessCount / Math.max(1, age / (60 * 1000)); // accesses per minute
    const recencyScore = Math.max(0, 1 - timeSinceAccess / (60 * 60 * 1000)); // decay over 1 hour
    
    return (accessFrequency * 0.4 + recencyScore * 0.3 + priorityWeight * 0.3);
  };

  // Evict least valuable entries
  const evictLeastValuable = useCallback(() => {
    if (cache.current.size <= config.maxSize) return;

    const entries = Array.from(cache.current.entries());
    const entriesWithScores = entries.map(([key, entry]) => ({
      key,
      entry,
      score: calculateCacheScore(entry)
    }));

    // Sort by score (lowest first) and remove bottom 20%
    entriesWithScores.sort((a, b) => a.score - b.score);
    const entriesToRemove = Math.ceil(cache.current.size * 0.2);

    for (let i = 0; i < entriesToRemove && i < entriesWithScores.length; i++) {
      const key = entriesWithScores[i].key;
      cache.current.delete(key);
      
      // Remove from tag mappings
      tags.current.forEach((keySet) => {
        keySet.delete(key);
      });
    }
  }, [config.maxSize]);

  // Cleanup expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];

    cache.current.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      cache.current.delete(key);
      tags.current.forEach((keySet) => {
        keySet.delete(key);
      });
    });

    // Evict entries if cache is too large
    evictLeastValuable();
  }, [evictLeastValuable]);

  // Start cleanup interval
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(cleanup, config.cleanupInterval);
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanup, config.cleanupInterval]);

  const get = useCallback(<T,>(key: string): T | null => {
    stats.current.totalRequests++;
    
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      cache.current.delete(key);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = now;
    stats.current.totalHits++;
    
    return entry.data as T;
  }, []);

  const set = useCallback(<T,>(key: string, data: T, options: CacheSetOptions = {}) => {
    const now = Date.now();
    const ttl = options.ttl ?? config.defaultTTL;
    const priority = options.priority ?? 'medium';

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now,
      priority
    };

    cache.current.set(key, entry);

    // Handle tags
    if (options.tags) {
      options.tags.forEach(tag => {
        if (!tags.current.has(tag)) {
          tags.current.set(tag, new Set());
        }
        tags.current.get(tag)!.add(key);
      });
    }

    // Cleanup if necessary
    if (cache.current.size > config.maxSize) {
      evictLeastValuable();
    }
  }, [config.defaultTTL, config.maxSize, evictLeastValuable]);

  const invalidate = useCallback((key: string) => {
    cache.current.delete(key);
    tags.current.forEach((keySet) => {
      keySet.delete(key);
    });
  }, []);

  const invalidateByPattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    cache.current.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(invalidate);
  }, [invalidate]);

  const invalidateByTag = useCallback((tag: string) => {
    const keys = tags.current.get(tag);
    if (keys) {
      keys.forEach(invalidate);
      tags.current.delete(tag);
    }
  }, [invalidate]);

  const clear = useCallback(() => {
    cache.current.clear();
    tags.current.clear();
    stats.current = {
      totalRequests: 0,
      totalHits: 0
    };
    forceUpdate({});
  }, []);

  const getStats = useCallback((): CacheStats => {
    const memoryUsage = JSON.stringify(Array.from(cache.current.values())).length;
    const hitRate = stats.current.totalRequests > 0 
      ? stats.current.totalHits / stats.current.totalRequests 
      : 0;

    return {
      size: cache.current.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: stats.current.totalRequests,
      totalHits: stats.current.totalHits,
      memoryUsage
    };
  }, []);

  const prefetch = useCallback(async <T,>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheSetOptions = {}
  ): Promise<void> => {
    // Don't prefetch if already cached and not expired
    const existing = get<T>(key);
    if (existing !== null) return;

    try {
      const data = await fetcher();
      set(key, data, { priority: 'low', ...options });
    } catch (error) {
      console.warn(`Prefetch failed for key ${key}:`, error);
    }
  }, [get, set]);

  const warmup = useCallback(async (
    keys: string[], 
    fetchers: (() => Promise<any>)[]
  ): Promise<void> => {
    if (keys.length !== fetchers.length) {
      throw new Error('Keys and fetchers arrays must have the same length');
    }

    const promises = keys.map((key, index) => 
      prefetch(key, fetchers[index], { priority: 'high' })
    );

    await Promise.allSettled(promises);
  }, [prefetch]);

  const value: IntelligentCacheContextType = {
    get,
    set,
    invalidate,
    invalidateByPattern,
    clear,
    getStats,
    prefetch,
    warmup
  };

  return (
    <IntelligentCacheContext.Provider value={value}>
      {children}
    </IntelligentCacheContext.Provider>
  );
};

// Custom hook for caching API calls
export const useCachedQuery = <T,>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    enabled?: boolean;
    staleTime?: number;
  } = {}
) => {
  const cache = useIntelligentCache();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const {
    enabled = true,
    staleTime = 0,
    ...cacheOptions
  } = options;

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    const cachedData = cache.get<T>(key);
    if (cachedData && !force) {
      setData(cachedData);
      return;
    }

    // Check if we should refetch based on stale time
    const now = Date.now();
    if (!force && lastFetch > 0 && now - lastFetch < staleTime) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      cache.set(key, result, cacheOptions);
      setData(result);
      setLastFetch(now);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, queryFn, cache, enabled, staleTime, lastFetch, cacheOptions]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.invalidate(key);
    setData(null);
  }, [cache, key]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate
  };
};

// Hook for infinite queries with caching
export const useCachedInfiniteQuery = <T,>(
  baseKey: string,
  queryFn: (page: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  } = {}
) => {
  const cache = useIntelligentCache();
  const [pages, setPages] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const { pageSize = 20, ...cacheOptions } = options;

  const fetchNextPage = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    const pageKey = `${baseKey}:page:${currentPage}`;
    const cachedPage = cache.get<T[]>(pageKey);

    if (cachedPage) {
      setPages(prev => [...prev, ...cachedPage]);
      setCurrentPage(prev => prev + 1);
      if (cachedPage.length < pageSize) {
        setHasNextPage(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      const pageData = await queryFn(currentPage);
      cache.set(pageKey, pageData, cacheOptions);
      setPages(prev => [...prev, ...pageData]);
      setCurrentPage(prev => prev + 1);
      
      if (pageData.length < pageSize) {
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('Failed to fetch next page:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseKey, currentPage, queryFn, cache, isLoading, hasNextPage, pageSize, cacheOptions]);

  const reset = useCallback(() => {
    setPages([]);
    setCurrentPage(0);
    setHasNextPage(true);
    cache.invalidateByPattern(`${baseKey}:page:`);
  }, [baseKey, cache]);

  return {
    data: pages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    reset
  };
};

export default useIntelligentCache;

