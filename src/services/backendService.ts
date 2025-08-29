/**
 * Backend Service
 * Central service for all backend API communications
 */

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTTL?: number;
}

class BackendService {
  private config: ApiConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json'
      },
      ...config
    };
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = `${method}-${endpoint}-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      const config = {
        method,
        headers: {
          ...this.config.headers,
          ...options.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      };

      // Check cache first for GET requests
      if (method === 'GET' && options.cache) {
        const cached = this.getCachedData(endpoint);
        if (cached) {
          return cached;
        }
      }

      const timeout = options.timeout || this.config.timeout;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const requestPromise = fetch(`${this.config.baseURL}${endpoint}`, config);
      const response = await Promise.race([requestPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const apiResponse: ApiResponse<T> = {
        data: result.data || result,
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      // Cache GET responses
      if (method === 'GET' && options.cache) {
        this.setCachedData(endpoint, apiResponse, options.cacheTTL || 300000);
      }

      return apiResponse;

    } catch (error) {
      const retries = options.retries || this.config.retries;
      
      if (retries > 0 && !controller.signal.aborted) {
        await this.delay(1000); // Wait 1 second before retry
        return this.makeRequest(method, endpoint, data, { ...options, retries: retries - 1 });
      }

      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCachedData<T>(key: string): ApiResponse<T> | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, options);
  }

  // Specialized Methods
  async uploadFile(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              data: response,
              success: true,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            reject({
              data: null,
              success: false,
              error: 'Invalid response format',
              timestamp: new Date().toISOString()
            });
          }
        } else {
          reject({
            data: null,
            success: false,
            error: `Upload failed: ${xhr.statusText}`,
            timestamp: new Date().toISOString()
          });
        }
      };

      xhr.onerror = () => {
        reject({
          data: null,
          success: false,
          error: 'Upload failed',
          timestamp: new Date().toISOString()
        });
      };

      xhr.open('POST', `${this.config.baseURL}${endpoint}`);
      
      // Add auth headers
      Object.entries(this.config.headers).forEach(([key, value]) => {
        if (key !== 'Content-Type') { // Let browser set Content-Type for FormData
          xhr.setRequestHeader(key, value);
        }
      });

      xhr.send(formData);
    });
  }

  // Authentication Methods
  setAuthToken(token: string): void {
    this.config.headers['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.config.headers['Authorization'];
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Request Cancellation
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // Configuration
  updateConfig(updates: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const backendService = new BackendService();

// Convenience methods for common operations
export const api = {
  // User Management
  login: (credentials: { email: string; password: string }) =>
    backendService.post('/auth/login', credentials),
  
  register: (userData: { email: string; password: string; name: string }) =>
    backendService.post('/auth/register', userData),
  
  logout: () =>
    backendService.post('/auth/logout'),
  
  // User Profile
  getProfile: () =>
    backendService.get('/user/profile', { cache: true, cacheTTL: 300000 }),
  
  updateProfile: (updates: any) =>
    backendService.patch('/user/profile', updates),
  
  // Mental Health Data
  saveMoodEntry: (moodData: any) =>
    backendService.post('/mood-entries', moodData),
  
  getMoodEntries: (params?: any) =>
    backendService.get(`/mood-entries${params ? '?' + new URLSearchParams(params) : ''}`, {
      cache: true,
      cacheTTL: 60000
    }),
  
  saveJournalEntry: (journalData: any) =>
    backendService.post('/journal-entries', journalData),
  
  getJournalEntries: (params?: any) =>
    backendService.get(`/journal-entries${params ? '?' + new URLSearchParams(params) : ''}`, {
      cache: true,
      cacheTTL: 60000
    }),
  
  // Crisis Support
  reportCrisis: (crisisData: any) =>
    backendService.post('/crisis/report', crisisData),
  
  getCrisisResources: () =>
    backendService.get('/crisis/resources', { cache: true, cacheTTL: 3600000 }),
  
  // Analytics
  getAnalytics: (timeRange: string) =>
    backendService.get(`/analytics?range=${timeRange}`, {
      cache: true,
      cacheTTL: 300000
    }),
  
  // File Operations
  uploadAvatar: (file: File, onProgress?: (progress: number) => void) =>
    backendService.uploadFile('/user/avatar', file, onProgress),
  
  // System
  getSystemStatus: () =>
    backendService.get('/system/status')
};

export default backendService;
