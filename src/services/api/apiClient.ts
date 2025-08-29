/**
 * API Client with advanced features for production-ready data persistence
 * Features: Interceptors, retry logic, offline queue, error handling, logging
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { tokenManager } from '../auth/tokenManager';

// Define request queue for offline support
interface QueuedRequest {
  id: string;
  config: AxiosRequestConfig;
  timestamp: number;
  retryCount: number;
}

// API response wrapper for consistent structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: number;
  version?: string;
}

// Error response structure
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

/**
 * API Client Configuration
 */
class ApiClient {
  private axiosInstance: AxiosInstance;
  private offlineQueue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Base delay in ms
  private requestLogEnabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    // Initialize axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': process.env.REACT_APP_VERSION || '1.0.0',
      },
    });

    this.setupInterceptors();
    this.setupOfflineDetection();
    this.loadOfflineQueue();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add authentication token
        const token = await tokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Timestamp'] = new Date().toISOString();

        // Log request in development
        if (this.requestLogEnabled) {
          console.log('API Request:', {
            method: config.method,
            url: config.url,
            data: config.data,
            headers: config.headers,
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.transformError(error));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log response in development
        if (this.requestLogEnabled) {
          console.log('API Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers,
          });
        }

        // Transform response to consistent structure
        return this.transformResponse(response);
      },
      async (error) => {
        // Handle token refresh
        if (error.response?.status === 401) {
          try {
            await tokenManager.refreshToken();
            // Retry original request
            return this.axiosInstance.request(error.config);
          } catch (refreshError) {
            // Redirect to login if refresh fails
            window.location.href = '/login';
            return Promise.reject(this.transformError(refreshError));
          }
        }

        // Handle offline scenario
        if (!navigator.onLine && error.config) {
          return this.queueRequest(error.config);
        }

        // Implement retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Setup offline detection and sync
   */
  private setupOfflineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connected. Processing offline queue...');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network disconnected. Requests will be queued.');
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Transform response to consistent structure
   */
  private transformResponse(response: AxiosResponse): ApiResponse {
    const isApiResponse = response.data && 
      typeof response.data === 'object' && 
      'success' in response.data;

    if (isApiResponse) {
      return response.data;
    }

    return {
      data: response.data,
      success: true,
      timestamp: Date.now(),
      message: response.statusText,
    };
  }

  /**
   * Transform error to consistent structure
   */
  private transformError(error: any): ApiError {
    if (error.response?.data) {
      return {
        code: error.response.data.code || error.response.status.toString(),
        message: error.response.data.message || error.message,
        details: error.response.data.details,
        timestamp: Date.now(),
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: Date.now(),
    };
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;
    
    if (!status) return true; // Network errors should be retried
    
    return retryableStatuses.includes(status);
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(error: AxiosError): Promise<any> {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const retryCount = (config as any).__retryCount || 0;
    
    if (retryCount >= this.maxRetries) {
      return Promise.reject(this.transformError(error));
    }

    (config as any).__retryCount = retryCount + 1;
    
    // Calculate delay with exponential backoff and jitter
    const delay = this.retryDelay * Math.pow(2, retryCount) + Math.random() * 1000;
    
    console.log(`Retrying request (${retryCount + 1}/${this.maxRetries}) after ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.axiosInstance.request(config);
  }

  /**
   * Queue request for offline processing
   */
  private async queueRequest(config: AxiosRequestConfig): Promise<any> {
    const queuedRequest: QueuedRequest = {
      id: this.generateRequestId(),
      config,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(queuedRequest);
    await this.saveOfflineQueue();

    console.log('Request queued for offline processing:', queuedRequest.id);

    // Return optimistic response for certain operations
    if (this.canOptimisticallyRespond(config)) {
      return this.createOptimisticResponse(config);
    }

    return Promise.reject({
      code: 'OFFLINE',
      message: 'Request queued for processing when online',
      timestamp: Date.now(),
    });
  }

  /**
   * Check if request can have optimistic response
   */
  private canOptimisticallyRespond(config: AxiosRequestConfig): boolean {
    const optimisticMethods = ['POST', 'PUT', 'PATCH'];
    const optimisticPaths = ['/mood', '/journal', '/medication'];
    
    return optimisticMethods.includes(config.method?.toUpperCase() || '') &&
           optimisticPaths.some(path => config.url?.includes(path));
  }

  /**
   * Create optimistic response for offline operations
   */
  private createOptimisticResponse(config: AxiosRequestConfig): ApiResponse {
    return {
      data: {
        ...config.data,
        id: this.generateRequestId(),
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      },
      success: true,
      timestamp: Date.now(),
      message: 'Data saved locally and will sync when online',
    };
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await this.axiosInstance.request(request.config);
        console.log(`Successfully processed queued request: ${request.id}`);
      } catch (error) {
        console.error(`Failed to process queued request: ${request.id}`, error);
        
        // Re-queue if still offline or retriable error
        if (!navigator.onLine || this.shouldRetry(error as AxiosError)) {
          request.retryCount++;
          if (request.retryCount < this.maxRetries) {
            this.offlineQueue.push(request);
          }
        }
      }
    }

    await this.saveOfflineQueue();
  }

  /**
   * Save offline queue to localStorage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      localStorage.setItem('api_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem('api_offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        
        // Process queue if online
        if (navigator.onLine && this.offlineQueue.length > 0) {
          setTimeout(() => this.processOfflineQueue(), 5000);
        }
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Public API methods
   */
  
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }

  /**
   * Get current offline queue status
   */
  getQueueStatus(): { count: number; items: QueuedRequest[] } {
    return {
      count: this.offlineQueue.length,
      items: this.offlineQueue,
    };
  }

  /**
   * Clear offline queue
   */
  async clearQueue(): Promise<void> {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
  }

  /**
   * Force process offline queue
   */
  async forceSync(): Promise<void> {
    if (navigator.onLine) {
      await this.processOfflineQueue();
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { QueuedRequest };