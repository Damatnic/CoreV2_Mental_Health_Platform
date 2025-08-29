/**
 * Comprehensive Backend API Service
 *
 * Provides a unified interface for all backend API interactions
 * with authentication, error handling, and retry logic
 *
 * Features:
 * - JWT token management
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Error handling and logging
 * - Rate limiting protection
 * - Request caching
 * - Offline queue support
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { simpleAuthService } from './simpleAuthService';
import { backgroundSyncService } from './backgroundSyncService';
import { networkDetection } from '../utils/networkDetection';

// API Configuration
const API_BASE = '/.netlify/functions';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Request Configuration Interface
interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  offline?: boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

// API Response Interface
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  success: boolean;
  timestamp: Date;
  cached?: boolean;
}

// Error Response Interface
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

// Request Interceptor Interface
interface RequestInterceptor {
  name: string;
  handler: (config: ApiRequestConfig, url: string) => Promise<{ config: ApiRequestConfig; url: string }>;
}

// Response Interceptor Interface
interface ResponseInterceptor {
  name: string;
  handler: (response: ApiResponse) => Promise<ApiResponse>;
}

// Cache Entry Interface
interface CacheEntry {
  data: any;
  timestamp: Date;
  ttl: number;
  headers: Record<string, string>;
}

// Rate Limit Configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

// Main Service Interface
interface BackendApiService {
  // HTTP Methods
  get<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  put<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  patch<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  
  // Generic Request
  request<T = any>(endpoint: string, config: ApiRequestConfig): Promise<ApiResponse<T>>;
  
  // Interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
  removeRequestInterceptor(name: string): void;
  removeResponseInterceptor(name: string): void;
  
  // Cache Management
  clearCache(): Promise<void>;
  getCacheSize(): Promise<number>;
  setCacheConfig(endpoint: string, ttl: number): void;
  
  // Rate Limiting
  setRateLimit(config: RateLimitConfig): void;
  getRateLimitStatus(): { remaining: number; resetTime: Date };
  
  // Health Check
  healthCheck(): Promise<boolean>;
  getApiStatus(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency: number }>;
}

// Default Rate Limit Configuration
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  skipSuccessfulRequests: false,
  skipFailedRequests: true
};

// Implementation
class BackendApiServiceImpl implements BackendApiService {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private cache = new Map<string, CacheEntry>();
  private cacheConfig = new Map<string, number>(); // endpoint -> ttl
  private rateLimitConfig: RateLimitConfig = { ...DEFAULT_RATE_LIMIT };
  private requestCounts: { timestamp: number; count: number }[] = [];
  private isOnline = true;

  constructor() {
    this.initializeService();
    this.setupNetworkListeners();
    this.addDefaultInterceptors();
  }

  async get<T = any>(endpoint: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  async put<T = any>(endpoint: string, data?: any, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  async delete<T = any>(endpoint: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, data?: any, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  async request<T = any>(endpoint: string, config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }
      
      // Prepare request configuration
      let requestConfig = { ...config };
      let requestUrl = endpoint;
      
      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        const result = await interceptor.handler(requestConfig, requestUrl);
        requestConfig = result.config;
        requestUrl = result.url;
      }
      
      // Check cache first
      if (requestConfig.method === 'GET' && requestConfig.cache !== false) {
        const cached = this.getCachedResponse<T>(requestUrl);
        if (cached) {
          return cached;
        }
      }
      
      // Handle offline requests
      if (!this.isOnline && requestConfig.offline !== false) {
        return this.handleOfflineRequest<T>(requestUrl, requestConfig);
      }
      
      // Perform request with retries
      const response = await this.performRequestWithRetries<T>(requestUrl, requestConfig);
      
      // Cache successful GET requests
      if (response.success && requestConfig.method === 'GET' && requestConfig.cache !== false) {
        this.cacheResponse(requestUrl, response);
      }
      
      // Apply response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor.handler(finalResponse);
      }
      
      // Update rate limit tracking
      this.updateRateLimitTracking();
      
      const duration = performance.now() - startTime;
      logger.info('API request completed', {
        endpoint: requestUrl,
        method: requestConfig.method,
        status: finalResponse.status,
        duration,
        cached: finalResponse.cached || false
      });
      
      return finalResponse;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('API request failed', {
        endpoint,
        method: config.method,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw this.createApiError(error, endpoint);
    }
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    logger.debug('Request interceptor added', { name: interceptor.name });
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    logger.debug('Response interceptor added', { name: interceptor.name });
  }

  removeRequestInterceptor(name: string): void {
    const index = this.requestInterceptors.findIndex(i => i.name === name);
    if (index !== -1) {
      this.requestInterceptors.splice(index, 1);
      logger.debug('Request interceptor removed', { name });
    }
  }

  removeResponseInterceptor(name: string): void {
    const index = this.responseInterceptors.findIndex(i => i.name === name);
    if (index !== -1) {
      this.responseInterceptors.splice(index, 1);
      logger.debug('Response interceptor removed', { name });
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    logger.info('API cache cleared');
  }

  async getCacheSize(): Promise<number> {
    return this.cache.size;
  }

  setCacheConfig(endpoint: string, ttl: number): void {
    this.cacheConfig.set(endpoint, ttl);
    logger.debug('Cache config updated', { endpoint, ttl });
  }

  setRateLimit(config: RateLimitConfig): void {
    this.rateLimitConfig = { ...config };
    logger.info('Rate limit configuration updated', { config });
  }

  getRateLimitStatus(): { remaining: number; resetTime: Date } {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;
    
    // Count requests in current window
    const requestsInWindow = this.requestCounts.filter(req => req.timestamp > windowStart).length;
    const remaining = Math.max(0, this.rateLimitConfig.maxRequests - requestsInWindow);
    
    // Calculate reset time
    const oldestRequest = this.requestCounts.find(req => req.timestamp > windowStart);
    const resetTime = oldestRequest 
      ? new Date(oldestRequest.timestamp + this.rateLimitConfig.windowMs)
      : new Date(now + this.rateLimitConfig.windowMs);
    
    return { remaining, resetTime };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { timeout: 5000, cache: false });
      return response.success && response.status === 200;
    } catch (error) {
      logger.warn('Health check failed', { error });
      return false;
    }
  }

  async getApiStatus(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency: number }> {
    const startTime = performance.now();
    
    try {
      const response = await this.get('/health', { timeout: 5000, cache: false });
      const latency = performance.now() - startTime;
      
      if (response.success) {
        const status = latency > 2000 ? 'degraded' : 'healthy';
        return { status, latency };
      } else {
        return { status: 'down', latency };
      }
    } catch (error) {
      const latency = performance.now() - startTime;
      return { status: 'down', latency };
    }
  }

  // Private helper methods
  private async initializeService(): Promise<void> {
    try {
      // Initialize network detection
      this.isOnline = await networkDetection.isOnline();
      
      logger.info('Backend API service initialized', {
        apiBase: API_BASE,
        isOnline: this.isOnline,
        rateLimitConfig: this.rateLimitConfig
      });
    } catch (error) {
      logger.error('Failed to initialize backend API service', { error });
    }
  }

  private setupNetworkListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Network connection restored');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.warn('Network connection lost');
    });
    
    // Listen for network quality changes
    networkDetection.onNetworkChange((info) => {
      logger.debug('Network quality changed', { info });
    });
  }

  private addDefaultInterceptors(): void {
    // Authentication interceptor
    this.addRequestInterceptor({
      name: 'authentication',
      handler: async (config, url) => {
        const token = simpleAuthService.getToken();
        
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        
        return { config, url };
      }
    });
    
    // Content-Type interceptor
    this.addRequestInterceptor({
      name: 'content-type',
      handler: async (config, url) => {
        if (config.body && typeof config.body === 'object') {
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/json'
          };
        }
        
        return { config, url };
      }
    });
    
    // URL prefix interceptor
    this.addRequestInterceptor({
      name: 'url-prefix',
      handler: async (config, url) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        return { config, url: fullUrl };
      }
    });
    
    // Error handling interceptor
    this.addResponseInterceptor({
      name: 'error-handling',
      handler: async (response) => {
        if (!response.success && response.status === 401) {
          // Handle authentication errors
          simpleAuthService.clearToken();
          logger.warn('Authentication token expired, cleared');
        }
        
        return response;
      }
    });
  }

  private async performRequestWithRetries<T>(url: string, config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const maxRetries = config.retries || MAX_RETRIES;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          await this.delay(delay);
          logger.debug('Retrying API request', { url, attempt, delay });
        }
        
        return await this.performSingleRequest<T>(url, config);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }
        
        logger.warn('API request attempt failed', {
          url,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: lastError.message
        });
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  private async performSingleRequest<T>(url: string, config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeout = config.timeout || DEFAULT_TIMEOUT;
    
    // Set up timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const fetchConfig: RequestInit = {
        method: config.method || 'GET',
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);
      
      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }
      
      // Convert headers to object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        success: response.ok,
        timestamp: new Date()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  private async handleOfflineRequest<T>(url: string, config: ApiRequestConfig): Promise<ApiResponse<T>> {
    // For GET requests, try cache first
    if (config.method === 'GET') {
      const cached = this.getCachedResponse<T>(url);
      if (cached) {
        return cached;
      }
    }
    
    // For non-GET requests or cache miss, queue for background sync
    if (config.method !== 'GET') {
      const requestId = await backgroundSyncService.queueRequest({
        url,
        method: config.method || 'GET',
        headers: config.headers,
        body: config.body,
        priority: config.priority || 'medium',
        maxRetries: config.retries || MAX_RETRIES,
        backoffMultiplier: 1.5,
        tags: ['api-request']
      });
      
      logger.info('Request queued for background sync', { requestId, url });
      
      // Return a pending response
      return {
        data: { queued: true, requestId } as any,
        status: 202,
        statusText: 'Accepted - Queued for sync',
        headers: {},
        success: true,
        timestamp: new Date()
      };
    }
    
    throw new Error('No cached data available and device is offline');
  }

  private getCachedResponse<T>(url: string): ApiResponse<T> | null {
    const cacheEntry = this.cache.get(url);
    
    if (!cacheEntry) {
      return null;
    }
    
    // Check if cache entry is still valid
    const now = Date.now();
    const age = now - cacheEntry.timestamp.getTime();
    
    if (age > cacheEntry.ttl) {
      this.cache.delete(url);
      return null;
    }
    
    return {
      data: cacheEntry.data,
      status: 200,
      statusText: 'OK',
      headers: cacheEntry.headers,
      success: true,
      timestamp: cacheEntry.timestamp,
      cached: true
    };
  }

  private cacheResponse(url: string, response: ApiResponse): void {
    // Get TTL for this endpoint
    const ttl = this.getCacheTtl(url);
    
    if (ttl > 0) {
      const cacheEntry: CacheEntry = {
        data: response.data,
        timestamp: response.timestamp,
        ttl,
        headers: response.headers
      };
      
      this.cache.set(url, cacheEntry);
      
      // Clean up expired entries periodically
      this.cleanupExpiredCache();
    }
  }

  private getCacheTtl(url: string): number {
    // Check for specific endpoint configuration
    for (const [pattern, ttl] of this.cacheConfig.entries()) {
      if (url.includes(pattern)) {
        return ttl;
      }
    }
    
    // Default TTL based on endpoint type
    if (url.includes('/crisis') || url.includes('/emergency')) {
      return 300000; // 5 minutes for crisis resources
    } else if (url.includes('/static') || url.includes('/assets')) {
      return 3600000; // 1 hour for static resources
    } else {
      return 600000; // 10 minutes for general API responses
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [url, entry] of this.cache.entries()) {
      const age = now - entry.timestamp.getTime();
      if (age > entry.ttl) {
        this.cache.delete(url);
      }
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;
    
    // Clean up old requests
    this.requestCounts = this.requestCounts.filter(req => req.timestamp > windowStart);
    
    // Check if we're under the limit
    return this.requestCounts.length < this.rateLimitConfig.maxRequests;
  }

  private updateRateLimitTracking(): void {
    this.requestCounts.push({
      timestamp: Date.now(),
      count: 1
    });
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry client errors (4xx) except 408, 429
    if (message.includes('400') || message.includes('401') || 
        message.includes('403') || message.includes('404')) {
      return true;
    }
    
    // Don't retry on network errors that won't resolve quickly
    if (message.includes('network error') || message.includes('fetch')) {
      return false; // These should be retried
    }
    
    return false;
  }

  private createApiError(error: any, endpoint: string): ApiError {
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : String(error),
      status: 0,
      timestamp: new Date(),
      retryable: true
    };
    
    // Extract status code if available
    const statusMatch = apiError.message.match(/HTTP (\d+)/);
    if (statusMatch) {
      apiError.status = parseInt(statusMatch[1], 10);
      apiError.retryable = !this.isNonRetryableError(error);
    }
    
    return apiError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const backendApiService = new BackendApiServiceImpl();
export type { 
  BackendApiService, 
  ApiRequestConfig, 
  ApiResponse, 
  ApiError,
  RequestInterceptor,
  ResponseInterceptor,
  RateLimitConfig 
};
