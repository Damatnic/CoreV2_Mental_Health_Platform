import { ApiClient } from '../../../utils/ApiClient';
import { jest } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new ApiClient('https://api.example.com');
    localStorageMock.getItem.mockReturnValue(null);
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: 'mock response' }),
      text: jest.fn().mockResolvedValue('mock response'),
      headers: new Headers({ 'content-type': 'application/json' })
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ users: [] }),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await apiClient.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });
      expect(result).toEqual({ users: [] });
    });

    it('should make POST requests with data', async () => {
      const postData = { name: 'John', email: 'john@example.com' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: '123', ...postData }),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await apiClient.post('/users', postData);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(postData)
      });
      expect(result).toEqual({ id: '123', ...postData });
    });

    it('should make PUT requests', async () => {
      const putData = { id: '123', name: 'Updated Name' };
      
      const result = await apiClient.put('/users/123', putData);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/123', {
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(putData)
      });
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: jest.fn().mockResolvedValue(null),
        headers: new Headers()
      });

      await apiClient.delete('/users/123');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/123', {
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });
    });
  });

  describe('Authentication', () => {
    it('should include auth token in requests when available', async () => {
      localStorageMock.getItem.mockReturnValue('mock-auth-token');

      await apiClient.get('/protected');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/protected', {
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json'
        })
      });
    });

    it('should make requests without auth token when not available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await apiClient.get('/public');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/public', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Authorization');
    });

    it('should refresh token on 401 response', async () => {
      const mockRefreshResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ token: 'new-auth-token' }),
        headers: new Headers({ 'content-type': 'application/json' })
      };

      // First call returns 401, second call returns new token, third call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
          headers: new Headers()
        })
        .mockResolvedValueOnce(mockRefreshResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ data: 'success' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });

      localStorageMock.getItem
        .mockReturnValueOnce('expired-token')
        .mockReturnValueOnce('refresh-token');

      const result = await apiClient.get('/protected');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-auth-token');
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ message: 'Not found' }),
        statusText: 'Not Found',
        headers: new Headers()
      });

      await expect(apiClient.get('/nonexistent')).rejects.toThrow(/404.*Not found/);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('malformed response'),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await expect(apiClient.get('/malformed')).rejects.toThrow('Invalid JSON');
    });

    it('should retry failed requests', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ data: 'success' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });

      const result = await apiClient.get('/retry-test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry non-retriable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ message: 'Bad request' }),
        statusText: 'Bad Request',
        headers: new Headers()
      });

      await expect(apiClient.get('/bad-request')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request Configuration', () => {
    it('should accept custom headers', async () => {
      await apiClient.get('/test', {
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: expect.objectContaining({
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'application/json'
        })
      });
    });

    it('should support query parameters', async () => {
      await apiClient.get('/search', {
        params: {
          q: 'test query',
          limit: 10,
          offset: 0
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/search?q=test%20query&limit=10&offset=0',
        expect.any(Object)
      );
    });

    it('should handle timeout configuration', async () => {
      jest.useFakeTimers();
      
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ data: 'timeout response' }), 10000);
      });
      
      mockFetch.mockReturnValueOnce(timeoutPromise);

      const requestPromise = apiClient.get('/slow', { timeout: 5000 });

      jest.advanceTimersByTime(5000);

      await expect(requestPromise).rejects.toThrow(/timeout/i);
      
      jest.useRealTimers();
    });

    it('should support different content types', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/upload', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'multipart/form-data'
        }),
        body: formData
      });
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      apiClient = new ApiClient('https://api.example.com', { 
        enableCache: true,
        cacheTimeout: 300000 // 5 minutes
      });
    });

    it('should cache GET requests', async () => {
      const mockResponse = { data: 'cached response' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      // First request
      const result1 = await apiClient.get('/cacheable');
      expect(result1).toEqual(mockResponse);

      // Second request should use cache
      const result2 = await apiClient.get('/cacheable');
      expect(result2).toEqual(mockResponse);

      // Should only make one network request
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after timeout', async () => {
      jest.useFakeTimers();

      const mockResponse = { data: 'response' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await apiClient.get('/timed-cache');
      
      // Advance time beyond cache timeout
      jest.advanceTimersByTime(400000); // 6+ minutes
      
      await apiClient.get('/timed-cache');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should not cache POST requests', async () => {
      const mockResponse = { data: 'response' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await apiClient.post('/non-cacheable', { data: 'test' });
      await apiClient.post('/non-cacheable', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptors', async () => {
      const requestInterceptor = jest.fn((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Request-ID': 'intercepted-123'
        }
      }));

      apiClient.addRequestInterceptor(requestInterceptor);

      await apiClient.get('/intercepted');

      expect(requestInterceptor).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/intercepted', {
        method: 'GET',
        headers: expect.objectContaining({
          'X-Request-ID': 'intercepted-123'
        })
      });
    });

    it('should apply response interceptors', async () => {
      const responseInterceptor = jest.fn((response) => ({
        ...response,
        intercepted: true
      }));

      apiClient.addResponseInterceptor(responseInterceptor);

      const result = await apiClient.get('/intercepted');

      expect(responseInterceptor).toHaveBeenCalled();
      expect(result).toHaveProperty('intercepted', true);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      apiClient = new ApiClient('https://api.example.com', {
        rateLimit: {
          requests: 5,
          per: 1000 // 5 requests per second
        }
      });
    });

    it('should enforce rate limits', async () => {
      jest.useFakeTimers();

      const requests = Array(10).fill(null).map(() => 
        apiClient.get('/rate-limited')
      );

      // Some requests should be delayed due to rate limiting
      const results = await Promise.allSettled(requests);
      
      expect(results.some(r => r.status === 'rejected')).toBe(true);
      
      jest.useRealTimers();
    });

    it('should handle 429 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'Retry-After': '5'
        }),
        json: jest.fn().mockResolvedValue({ message: 'Rate limited' })
      });

      await expect(apiClient.get('/rate-limited')).rejects.toThrow(/rate limited/i);
    });
  });

  describe('Mental Health App Specific Features', () => {
    it('should encrypt sensitive mental health data', async () => {
      const sensitiveData = {
        moodScore: 3,
        notes: 'Feeling very anxious today',
        triggers: ['work stress']
      };

      const encryptSpy = jest.spyOn(apiClient, 'encryptSensitiveData').mockReturnValue({
        ...sensitiveData,
        encrypted: true
      });

      await apiClient.post('/mood-entries', sensitiveData, { 
        encryptSensitive: true 
      });

      expect(encryptSpy).toHaveBeenCalledWith(sensitiveData);
    });

    it('should handle crisis escalation', async () => {
      const crisisData = {
        userId: 'user-123',
        riskLevel: 'high',
        content: 'Suicidal ideation detected'
      };

      // Mock high-priority response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ 
          escalated: true,
          sessionId: 'crisis-456'
        }),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await apiClient.post('/crisis-events', crisisData, {
        priority: 'high',
        timeout: 5000
      });

      expect(result).toEqual({
        escalated: true,
        sessionId: 'crisis-456'
      });
    });

    it('should add HIPAA compliance headers', async () => {
      await apiClient.get('/patient-data', {
        hipaaCompliant: true
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/patient-data', {
        method: 'GET',
        headers: expect.objectContaining({
          'X-HIPAA-Compliant': 'true',
          'X-PHI-Encrypted': 'true'
        })
      });
    });

    it('should handle offline scenarios', async () => {
      // Mock offline scenario
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      // Should queue request for later
      const result = apiClient.get('/offline-test', { 
        offlineQueue: true 
      });

      await expect(result).rejects.toThrow('offline');
      
      // Verify request was queued
      expect(apiClient.getOfflineQueue()).toHaveLength(1);
    });

    it('should sync queued requests when online', async () => {
      // Add requests to offline queue
      apiClient.addToOfflineQueue({
        method: 'POST',
        url: '/queued-request',
        data: { test: 'data' }
      });

      // Mock successful sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ synced: true }),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await apiClient.syncOfflineQueue();

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/queued-request', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: expect.any(Object)
      });

      expect(apiClient.getOfflineQueue()).toHaveLength(0);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track request performance', async () => {
      const performanceTracker = jest.fn();
      apiClient.addPerformanceTracker(performanceTracker);

      await apiClient.get('/performance-test');

      expect(performanceTracker).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/performance-test',
          method: 'GET',
          duration: expect.any(Number),
          status: 200
        })
      );
    });

    it('should implement circuit breaker pattern', async () => {
      apiClient = new ApiClient('https://api.example.com', {
        circuitBreaker: {
          failureThreshold: 3,
          timeout: 5000
        }
      });

      // Simulate consecutive failures
      mockFetch
        .mockRejectedValueOnce(new Error('Server error'))
        .mockRejectedValueOnce(new Error('Server error'))
        .mockRejectedValueOnce(new Error('Server error'));

      try {
        await apiClient.get('/failing-endpoint');
      } catch (e) {}
      
      try {
        await apiClient.get('/failing-endpoint');
      } catch (e) {}
      
      try {
        await apiClient.get('/failing-endpoint');
      } catch (e) {}

      // Fourth request should be rejected due to circuit breaker
      await expect(apiClient.get('/failing-endpoint')).rejects.toThrow(/circuit breaker/i);
    });
  });
});