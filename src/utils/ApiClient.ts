/**
 * API Client for Mental Health Platform
 *
 * Comprehensive API client that handles all backend communication with proper
 * error handling, retry logic, caching, and offline support. Designed for
 * production use with Netlify Functions or any REST API backend.
 */

// Types will be imported as needed to avoid circular dependencies

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTimeout: number;
  enableOfflineSupport: boolean;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  status: number;
  timestamp: number;
}

// API Error interface
export interface ApiErrorInterface {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp: number;
}

// Request options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  requireAuth?: boolean;
}

// Cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? '/.netlify/functions' 
    : 'http://localhost:8888/.netlify/functions',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableOfflineSupport: true
};

/**
 * API Client Class
 * 
 * Handles all HTTP communication with proper error handling, retries,
 * caching, and offline support for the mental health platform.
 */
export class ApiClient {
  private config: ApiConfig;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private offlineQueue: Array<{ key: string; options: RequestOptions }> = [];
  private isOnline: boolean = navigator.onLine;
  private authToken: string | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * Set up network and visibility event listeners
   */
  private setupEventListeners(): void {
    // Network status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Clear expired cache entries periodically
    setInterval(() => {
      this.clearExpiredCache();
    }, 60000); // Every minute
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.authToken || localStorage.getItem('authToken');
  }

  /**
   * Check if Netlify Functions are available
   */
  async checkNetlifyFunctions(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        timeout: 3000
      } as any);
      
      return response.ok;
    } catch (error) {
      console.warn('Netlify Functions not available, using fallback:', error);
      return false;
    }
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(endpoint: string, options: RequestOptions): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache response
   */
  private setCachedResponse<T>(key: string, data: T): void {
    if (!this.config.enableCaching) return;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheTimeout
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const { key, options } of queue) {
      try {
        const endpoint = key.split(':')[1]; // Extract endpoint from cache key
        await this.request(endpoint, options);
      } catch (error) {
        console.error('Failed to process offline queue item:', error);
      }
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Core request method with retry logic
   */
  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retries,
      cache = this.config.enableCaching,
      requireAuth = false
    } = options;

    // Generate cache key
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cachedResponse = this.getCachedResponse<ApiResponse<T>>(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Check if offline and queue request
    if (!this.isOnline && this.config.enableOfflineSupport) {
      if (method !== 'GET') {
        this.offlineQueue.push({ key: cacheKey, options });
      }
      
      throw new ApiError({
        message: 'Currently offline. Request will be processed when connection is restored.',
        status: 0,
        code: 'OFFLINE',
        timestamp: Date.now()
      });
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add auth token if required
    if (requireAuth || this.getAuthToken()) {
      const token = this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else if (requireAuth) {
        throw new ApiError({
          message: 'Authentication required',
          status: 401,
          code: 'AUTH_REQUIRED',
          timestamp: Date.now()
        });
      }
    }

    // Build request URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.config.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    // Attempt request with retries
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          throw new ApiError({
            message: errorData.message || `HTTP ${response.status}`,
            status: response.status,
            code: errorData.code,
            details: errorData.details,
            timestamp: Date.now()
          });
        }

        // Parse response
        const responseText = await response.text();
        let responseData: any = null;

        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = responseText;
          }
        }

        const apiResponse: ApiResponse<T> = {
          data: responseData,
          success: true,
          status: response.status,
          timestamp: Date.now()
        };

        // Cache successful GET responses
        if (method === 'GET' && cache) {
          this.setCachedResponse(cacheKey, apiResponse);
        }

        return apiResponse;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403 || error.status === 404) {
            throw error;
          }
        }

        // Don't retry on abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError({
            message: 'Request timeout',
            status: 408,
            code: 'TIMEOUT',
            timestamp: Date.now()
          });
        }

        // Wait before retry
        if (attempt < retries) {
          await this.sleep(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed
    throw new ApiError({
      message: lastError?.message || 'Request failed',
      status: 0,
      code: 'REQUEST_FAILED',
      details: lastError,
      timestamp: Date.now()
    });
  }

  /**
   * GET request helper
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  async post<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  /**
   * PUT request helper
   */
  async put<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request helper
   */
  async patch<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): { count: number; items: Array<{ key: string; options: RequestOptions }> } {
    return {
      count: this.offlineQueue.length,
      items: [...this.offlineQueue]
    };
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { timeout: 3000, retries: 1 });
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Custom Error class for API errors
 */
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;
  public timestamp: number;

  constructor(error: ApiErrorInterface) {
    super(error.message);
    this.name = 'ApiError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
    this.timestamp = error.timestamp;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiConfig, ApiResponse, ApiErrorInterface, RequestOptions };

// Default export
export default apiClient;
