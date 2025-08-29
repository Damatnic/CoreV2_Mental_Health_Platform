/**
 * Enhanced API Service for CoreV2 Mental Health Platform
 * Provides a robust HTTP client with retry logic, caching, error handling, and HIPAA compliance
 */

import { auth0Service } from './auth0Service';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/common';

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  enableLogging?: boolean;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

export interface ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;
  headers?: Headers;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiService {
  private config: Required<ApiConfig>;
  private cache = new Map<string, CacheEntry<unknown>>();
  private requestInterceptors: Array<(config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      cache: true,
      cacheTTL: 300000, // 5 minutes
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    };
  }

  // Interceptor management
  public addRequestInterceptor(interceptor: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>): void {
    this.responseInterceptors.push(interceptor);
  }

  // Cache management
  private getCacheKey(url: string, config: ApiRequestConfig): string {
    const method = config.method || 'GET';
    const params = config.params ? JSON.stringify(config.params) : '';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${params}:${body}`;
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCachedData<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Request building
  private buildURL(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, this.config.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  private async buildHeaders(config: ApiRequestConfig): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    });

    // Add authentication token if not skipped
    if (!config.skipAuth) {
      try {
        const token = await auth0Service.getToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch (error) {
        if (this.config.enableLogging) {
          logger.warn('Failed to get auth token for API request:', error);
        }
      }
    }

    return headers;
  }

  // Error handling
  private createApiError(response: Response, data?: unknown): ApiError {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`) as ApiError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = data;
    error.headers = response.headers;
    return error;
  }

  private shouldRetry(error: ApiError, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;
    
    // Retry on network errors or 5xx server errors
    if (!error.status || error.status >= 500) return true;
    
    // Retry on rate limiting
    if (error.status === 429) return true;
    
    // Don't retry on client errors (4xx except 429)
    if (error.status >= 400 && error.status < 500) return false;
    
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main request method
  public async request<T = unknown>(endpoint: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    // Apply request interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const method = finalConfig.method || 'GET';
    const url = this.buildURL(endpoint, finalConfig.params);
    const cacheKey = this.getCacheKey(url, finalConfig);
    const shouldCache = finalConfig.cache ?? (this.config.cache && method === 'GET');
    const cacheTTL = finalConfig.cacheTTL ?? this.config.cacheTTL;

    // Check cache for GET requests
    if (shouldCache && method === 'GET') {
      const cachedData = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        if (this.config.enableLogging) {
          logger.debug(`Cache hit for ${method} ${url}`);
        }
        return cachedData;
      }
    }

    const maxRetries = finalConfig.retries ?? this.config.retries;
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers = await this.buildHeaders(finalConfig);
        const timeout = finalConfig.timeout ?? this.config.timeout;

        // Create request options
        const requestOptions: RequestInit = {
          method,
          headers,
          signal: AbortSignal.timeout(timeout)
        };

        // Add body for non-GET requests
        if (method !== 'GET' && finalConfig.body !== undefined) {
          if (finalConfig.body instanceof FormData) {
            requestOptions.body = finalConfig.body;
            headers.delete('Content-Type'); // Let browser set it for FormData
          } else {
            requestOptions.body = JSON.stringify(finalConfig.body);
          }
        }

        if (this.config.enableLogging) {
          logger.debug(`API Request: ${method} ${url}`, {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            headers: Object.fromEntries(headers.entries()),
            body: finalConfig.body
          });
        }

        // Make the request
        let response = await fetch(url, requestOptions);

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response);
        }

        // Handle response
        if (!response.ok) {
          let errorData: unknown;
          try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = await response.text();
            }
          } catch {
            errorData = null;
          }

          const apiError = this.createApiError(response, errorData);
          
          if (this.config.enableLogging) {
            logger.error(`API Error: ${method} ${url}`, {
              status: response.status,
              statusText: response.statusText,
              data: errorData,
              attempt: attempt + 1
            });
          }

          // Check if we should retry
          if (!finalConfig.skipRetry && this.shouldRetry(apiError, attempt, maxRetries)) {
            lastError = apiError;
            const delay = finalConfig.retryDelay ?? this.config.retryDelay;
            await this.delay(delay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }

          throw apiError;
        }

        // Parse response
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.blob() as unknown as T;
        }

        const apiResponse: ApiResponse<T> = {
          data,
          status: response.status,
          success: true,
          message: response.statusText
        };

        if (this.config.enableLogging) {
          logger.debug(`API Success: ${method} ${url}`, {
            status: response.status,
            attempt: attempt + 1
          });
        }

        // Cache successful GET requests
        if (shouldCache && method === 'GET') {
          this.setCachedData(cacheKey, apiResponse, cacheTTL);
        }

        return apiResponse;

      } catch (error) {
        if (error instanceof Error && 'status' in error) {
          lastError = error as ApiError;
        } else {
          // Network or other errors
          const networkError = new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`) as ApiError;
          networkError.status = 0;
          networkError.statusText = 'Network Error';
          lastError = networkError;
          
          if (this.config.enableLogging) {
            logger.error(`Network Error: ${method} ${url}`, {
              error: error instanceof Error ? error.message : error,
              attempt: attempt + 1
            });
          }
        }

        // Check if we should retry
        if (!finalConfig.skipRetry && this.shouldRetry(lastError, attempt, maxRetries)) {
          const delay = finalConfig.retryDelay ?? this.config.retryDelay;
          await this.delay(delay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        break;
      }
    }

    throw lastError || new Error('Unknown API error');
  }

  // Convenience methods
  public async get<T = unknown>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  public async post<T = unknown>(endpoint: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  public async put<T = unknown>(endpoint: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  public async patch<T = unknown>(endpoint: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  public async delete<T = unknown>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Cache management methods
  public clearCache(): void {
    this.cache.clear();
    if (this.config.enableLogging) {
      logger.debug('API cache cleared');
    }
  }

  public clearExpiredEntries(): void {
    this.clearExpiredCache();
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { skipAuth: true, cache: false, skipRetry: true });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseURL: process.env.VITE_API_BASE_URL || 'https://api.corev2.app',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cache: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: process.env.NODE_ENV === 'development'
};

// Export singleton instance
export const apiService = new ApiService(defaultConfig);

// Also export the class for custom instances
export { ApiService };
export default apiService;
