/**
 * Store Enhancement Utilities
 *
 * Provides standardized error handling, persistence, and optimization
 * utilities for all Zustand stores in the application. This module contains
 * reusable middleware and utilities for consistent store behavior.
 */

import { StateCreator } from 'zustand';
import { 
  persist, 
  createJSONStorage, 
  PersistOptions, 
  devtools, 
  subscribeWithSelector 
} from 'zustand/middleware';

/**
 * Standard error state interface for all stores
 */
export interface ErrorState {
  error: Error | null;
  errorCode?: string;
  errorTimestamp?: Date;
  errorRetryCount: number;
  maxRetries: number;
  isRetrying: boolean;
}

/**
 * Standard error actions interface
 */
export interface ErrorActions {
  clearError: () => void;
  setError: (error: Error | string, code?: string) => void;
  retryLastAction?: () => Promise<void>;
}

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  loadingOperations: Set<string>;
}

/**
 * Loading actions interface
 */
export interface LoadingActions {
  setLoading: (operation: string, loading: boolean) => void;
  clearAllLoading: () => void;
}

/**
 * Cache state interface
 */
export interface CacheState {
  lastUpdated: Record<string, number>;
  cacheExpiry: number; // milliseconds
}

/**
 * Cache actions interface
 */
export interface CacheActions {
  updateCacheTimestamp: (key: string) => void;
  isCacheValid: (key: string) => boolean;
  clearCache: (key?: string) => void;
}

/**
 * Enhanced state that includes error handling, loading, and caching
 */
export type WithEnhancedState<T> = T & ErrorState & LoadingState & CacheState;

/**
 * Enhanced actions that include error handling, loading, and caching
 */
export type WithEnhancedActions<T> = T & ErrorActions & LoadingActions & CacheActions;

/**
 * Complete enhanced store type
 */
export type EnhancedStore<TState, TActions> = WithEnhancedState<TState> & WithEnhancedActions<TActions>;

/**
 * Default error state
 */
const DEFAULT_ERROR_STATE: ErrorState = {
  error: null,
  errorCode: undefined,
  errorTimestamp: undefined,
  errorRetryCount: 0,
  maxRetries: 3,
  isRetrying: false
};

/**
 * Default loading state
 */
const DEFAULT_LOADING_STATE: LoadingState = {
  isLoading: false,
  loadingOperations: new Set<string>()
};

/**
 * Default cache state
 */
const DEFAULT_CACHE_STATE: CacheState = {
  lastUpdated: {},
  cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

/**
 * Create enhanced slice with error handling, loading, and caching
 */
export const createEnhancedSlice = <TState, TActions>(
  stateCreator: StateCreator<
    WithEnhancedState<TState> & WithEnhancedActions<TActions>,
    [],
    [],
    TState & TActions
  >
): StateCreator<
  WithEnhancedState<TState> & WithEnhancedActions<TActions>,
  [],
  [],
  WithEnhancedState<TState> & WithEnhancedActions<TActions>
> => {
  return (set, get, api) => {
    const baseState = stateCreator(
      (partial, replace) => {
        if (typeof partial === 'function') {
          set((state) => ({
            ...state,
            ...(partial as any)(state)
          }), replace);
        } else {
          set((state) => ({
            ...state,
            ...partial
          }), replace);
        }
      },
      get,
      api
    );

    const enhancedActions: WithEnhancedActions<{}> = {
      // Error handling
      clearError: () => {
        set((state) => ({
          ...state,
          error: null,
          errorCode: undefined,
          errorTimestamp: undefined,
          errorRetryCount: 0,
          isRetrying: false
        }));
      },

      setError: (error: Error | string, code?: string) => {
        const errorObj = error instanceof Error ? error : new Error(error);
        set((state) => ({
          ...state,
          error: errorObj,
          errorCode: code,
          errorTimestamp: new Date(),
          isRetrying: false
        }));
      },

      // Loading state management
      setLoading: (operation: string, loading: boolean) => {
        set((state) => {
          const newOperations = new Set(state.loadingOperations);
          if (loading) {
            newOperations.add(operation);
          } else {
            newOperations.delete(operation);
          }
          
          return {
            ...state,
            loadingOperations: newOperations,
            isLoading: newOperations.size > 0
          };
        });
      },

      clearAllLoading: () => {
        set((state) => ({
          ...state,
          isLoading: false,
          loadingOperations: new Set<string>()
        }));
      },

      // Cache management
      updateCacheTimestamp: (key: string) => {
        set((state) => ({
          ...state,
          lastUpdated: {
            ...state.lastUpdated,
            [key]: Date.now()
          }
        }));
      },

      isCacheValid: (key: string) => {
        const state = get();
        const lastUpdated = state.lastUpdated[key];
        if (!lastUpdated) return false;
        
        return Date.now() - lastUpdated < state.cacheExpiry;
      },

      clearCache: (key?: string) => {
        set((state) => {
          if (key) {
            const { [key]: removed, ...remaining } = state.lastUpdated;
            return {
              ...state,
              lastUpdated: remaining
            };
          } else {
            return {
              ...state,
              lastUpdated: {}
            };
          }
        });
      }
    };

    return {
      ...DEFAULT_ERROR_STATE,
      ...DEFAULT_LOADING_STATE,
      ...DEFAULT_CACHE_STATE,
      ...baseState,
      ...enhancedActions
    };
  };
};

/**
 * Retry wrapper for async operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  onError?: (error: Error, attempt: number) => void
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onError?.(lastError, attempt);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};

/**
 * Optimistic update wrapper
 */
export const withOptimisticUpdate = <T, R>(
  optimisticUpdate: () => void,
  operation: () => Promise<R>,
  rollback: (error: Error) => void
) => {
  return async (): Promise<R> => {
    // Apply optimistic update
    optimisticUpdate();
    
    try {
      // Perform actual operation
      const result = await operation();
      return result;
    } catch (error) {
      // Rollback on failure
      rollback(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };
};

/**
 * Debounce wrapper for store actions
 */
export const withDebounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 300
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

/**
 * Throttle wrapper for store actions
 */
export const withThrottle = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 300
): T => {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
};

/**
 * Store cache utility for complex data structures
 */
export class StoreCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  
  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 minutes
  
  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

/**
 * Enhanced persistence configuration
 */
export const createEnhancedPersistence = <T>(
  name: string,
  options: Partial<PersistOptions<T>> = {}
): PersistOptions<T> => {
  return {
    name,
    storage: createJSONStorage(() => localStorage),
    version: 1,
    migrate: (persistedState: any, version: number) => {
      // Handle version migrations here
      if (version === 0) {
        // Migration from version 0 to 1
        return {
          ...persistedState,
          // Add any necessary transformations
        };
      }
      return persistedState;
    },
    partialize: (state: T) => {
      // Only persist certain parts of the state
      const { error, isRetrying, loadingOperations, ...persistableState } = state as any;
      return persistableState;
    },
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error('Failed to rehydrate store:', error);
      } else if (state) {
        // Reset transient state after rehydration
        (state as any).error = null;
        (state as any).isRetrying = false;
        (state as any).isLoading = false;
        (state as any).loadingOperations = new Set();
      }
    },
    ...options
  };
};

/**
 * Enhanced devtools configuration
 */
export const createEnhancedDevtools = (name: string, enabled: boolean = process.env.NODE_ENV === 'development') => {
  return devtools(
    (set, get, api) => ({ set, get, api }),
    {
      name,
      enabled,
      trace: true,
      traceLimit: 25
    }
  );
};

/**
 * Subscription helper for store changes
 */
export const createStoreSubscription = <T>(
  store: T,
  selector: (state: T) => any,
  callback: (selectedState: any, previousSelectedState: any) => void
) => {
  if (typeof (store as any).subscribe === 'function') {
    return (store as any).subscribe(selector, callback);
  }
  
  console.warn('Store does not support subscriptions');
  return () => {}; // Return empty unsubscribe function
};

/**
 * Batch update utility
 */
export const batchUpdates = <T>(
  setState: (partial: Partial<T>) => void,
  updates: Array<() => Partial<T>>
): void => {
  const combinedUpdate = updates.reduce((acc, update) => ({
    ...acc,
    ...update()
  }), {});
  
  setState(combinedUpdate);
};

export default {
  createEnhancedSlice,
  withRetry,
  withOptimisticUpdate,
  withDebounce,
  withThrottle,
  StoreCache,
  createEnhancedPersistence,
  createEnhancedDevtools,
  createStoreSubscription,
  batchUpdates
};
