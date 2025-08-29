/**
 * API Client Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

class ApiClient {
  private config: ApiClientConfig;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async retryRequest<T>(fn: () => Promise<T>): Promise<T> {
    const attempts = this.config.retryAttempts || 3;
    const delay = this.config.retryDelay || 1000;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    throw new Error('Max retry attempts reached');
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.retryRequest(async () => {
      const response = await axios.get(`${this.config.baseURL}${endpoint}`, {
        params,
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });
      return response.data;
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.retryRequest(async () => {
      const response = await axios.post(
        `${this.config.baseURL}${endpoint}`,
        data,
        {
          headers: this.getHeaders(),
          timeout: this.config.timeout
        }
      );
      return response.data;
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.retryRequest(async () => {
      const response = await axios.put(
        `${this.config.baseURL}${endpoint}`,
        data,
        {
          headers: this.getHeaders(),
          timeout: this.config.timeout
        }
      );
      return response.data;
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.retryRequest(async () => {
      const response = await axios.delete(`${this.config.baseURL}${endpoint}`, {
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });
      return response.data;
    });
  }

  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.retryRequest(async () => {
      const response = await axios.post(
        `${this.config.baseURL}${endpoint}`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: this.config.timeout * 3 // Longer timeout for file uploads
        }
      );
      return response.data;
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with provided config', () => {
      const client = new ApiClient({
        baseURL: 'https://test.api.com',
        timeout: 3000,
        headers: { 'X-Custom-Header': 'value' }
      });
      expect(client).toBeDefined();
    });

    it('should set and clear auth token', () => {
      apiClient.setAuthToken('test-token');
      // Token is private, so we test it through a request
      mockedAxios.get.mockResolvedValueOnce({ data: { success: true } });
      apiClient.get('/test');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );

      apiClient.clearAuthToken();
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.get('/users/1');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          timeout: 5000
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle GET request with query params', async () => {
      const mockResponse = { data: { items: [] } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await apiClient.get('/users', { page: 1, limit: 10 });
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          params: { page: 1, limit: 10 }
        })
      );
    });

    it('should retry failed GET request', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await apiClient.get('/retry-test');
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it('should throw after max retry attempts', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/fail-test')).rejects.toThrow('Network error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const postData = { name: 'Test User', email: 'test@example.com' };
      const mockResponse = { data: { id: 1, ...postData } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.post('/users', postData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/users',
        postData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          timeout: 5000
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle POST request without data', async () => {
      const mockResponse = { data: { triggered: true } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await apiClient.post('/trigger');
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/trigger',
        undefined,
        expect.any(Object)
      );
    });

    it('should retry failed POST request', async () => {
      const postData = { test: 'data' };
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await apiClient.post('/retry-post', postData);
      
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = { data: { id: 1, ...updateData } };
      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.put('/users/1', updateData);
      
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        updateData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          timeout: 5000
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = { data: { deleted: true } };
      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.delete('/users/1');
      
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          timeout: 5000
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('File upload', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = { data: { fileId: 'file-123' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.uploadFile('/upload', mockFile);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          }),
          timeout: 15000 // 3x normal timeout
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should upload file with additional data', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const additionalData = { description: 'Test file', category: 'documents' };
      const mockResponse = { data: { fileId: 'file-456' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await apiClient.uploadFile('/upload', mockFile, additionalData);
      
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });
  });

  describe('Health check', () => {
    it('should return true when API is healthy', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ok' } });

      const result = await apiClient.healthCheck();
      
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.any(Object)
      );
    });

    it('should return false when API is unhealthy', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await apiClient.healthCheck();
      
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/error-test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Timeout'));

      await expect(apiClient.get('/timeout-test')).rejects.toThrow('Timeout');
    });

    it('should handle 401 unauthorized errors', async () => {
      const error = new Error('Unauthorized') as any;
      error.response = { status: 401 };
      mockedAxios.get.mockRejectedValue(error);

      await expect(apiClient.get('/auth-test')).rejects.toThrow('Unauthorized');
    });

    it('should handle 404 not found errors', async () => {
      const error = new Error('Not found') as any;
      error.response = { status: 404 };
      mockedAxios.get.mockRejectedValue(error);

      await expect(apiClient.get('/notfound-test')).rejects.toThrow('Not found');
    });

    it('should handle 500 server errors', async () => {
      const error = new Error('Internal server error') as any;
      error.response = { status: 500 };
      mockedAxios.post.mockRejectedValue(error);

      await expect(apiClient.post('/server-error')).rejects.toThrow('Internal server error');
    });
  });

  describe('Request interceptors', () => {
    it('should add auth header when token is set', async () => {
      apiClient.setAuthToken('secret-token');
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      await apiClient.get('/protected');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer secret-token'
          })
        })
      );
    });

    it('should not add auth header when token is not set', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      await apiClient.get('/public');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });
});
