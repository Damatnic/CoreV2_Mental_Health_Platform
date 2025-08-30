/**
 * API Integration Service for Astral Core Mental Health Platform
 * Provides centralized API management for all components
 */

import { logger } from '../../utils/logger';

// Import the mock service for now, can be replaced with real API later
import * as mockApi from './mockApiService';

export interface ApiConfig {
  baseUrl?: string;
  timeout?: number;
  retryCount?: number;
  headers?: Record<string, string>;
}

class ApiIntegrationService {
  private config: ApiConfig;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: config.timeout || 30000,
      retryCount: config.retryCount || 3,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    };
  }

  /**
   * Set authentication token for all requests
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.config.headers = {
        ...this.config.headers,
        'Authorization': `Bearer ${token}`
      };
    } else {
      delete this.config.headers?.['Authorization'];
    }
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
      logger.info('Request cancelled', { requestId }, 'ApiIntegrationService');
    }
  }

  /**
   * Cancel all ongoing requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller, requestId) => {
      controller.abort();
      logger.info('Request cancelled', { requestId }, 'ApiIntegrationService');
    });
    this.abortControllers.clear();
  }

  /**
   * Make an API request with retry logic
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const requestId = `${method}-${endpoint}-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryCount!; attempt++) {
      try {
        // For now, use mock API
        // In production, replace with actual fetch call
        const response = await this.mockApiCall<T>(method, endpoint, data);
        
        this.abortControllers.delete(requestId);
        return response;
        
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Request attempt ${attempt} failed`, { 
          endpoint, 
          attempt, 
          error: lastError.message 
        }, 'ApiIntegrationService');
        
        if (attempt < this.config.retryCount!) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }
    
    this.abortControllers.delete(requestId);
    throw lastError;
  }

  /**
   * Mock API call - replace with real implementation in production
   */
  private async mockApiCall<T>(method: string, endpoint: string, data?: any): Promise<T> {
    // Simulate network delay
    await this.delay(Math.random() * 500 + 200);
    
    // Route to appropriate mock service method
    const path = endpoint.replace(/^\/api\//, '');
    const segments = path.split('/');
    
    // Mock implementation - replace with actual API calls
    logger.info('Mock API call', { method, endpoint, data }, 'ApiIntegrationService');
    
    // Return mock data based on endpoint
    return {} as T;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========== AUTH ENDPOINTS ==========
  
  async login(email: string, password: string) {
    return this.makeRequest('POST', '/api/auth/login', { email, password });
  }

  async register(userData: any) {
    return this.makeRequest('POST', '/api/auth/register', userData);
  }

  async logout() {
    return this.makeRequest('POST', '/api/auth/logout');
  }

  async refreshToken() {
    return this.makeRequest('POST', '/api/auth/refresh');
  }

  async resetPassword(email: string) {
    return this.makeRequest('POST', '/api/auth/reset-password', { email });
  }

  // ========== USER ENDPOINTS ==========

  async getUserProfile(userId: string) {
    return this.makeRequest('GET', `/api/users/${userId}`);
  }

  async updateUserProfile(userId: string, updates: any) {
    return this.makeRequest('PATCH', `/api/users/${userId}`, updates);
  }

  async deleteUser(userId: string) {
    return this.makeRequest('DELETE', `/api/users/${userId}`);
  }

  // ========== MOOD TRACKING ENDPOINTS ==========

  async saveMoodEntry(entry: any) {
    return this.makeRequest('POST', '/api/mood/entries', entry);
  }

  async getMoodHistory(userId: string, days: number = 30) {
    return this.makeRequest('GET', `/api/mood/history/${userId}?days=${days}`);
  }

  async getMoodAnalytics(userId: string) {
    return this.makeRequest('GET', `/api/mood/analytics/${userId}`);
  }

  // ========== JOURNAL ENDPOINTS ==========

  async saveJournalEntry(entry: any) {
    return this.makeRequest('POST', '/api/journal/entries', entry);
  }

  async getJournalEntries(userId: string, limit: number = 20) {
    return this.makeRequest('GET', `/api/journal/entries/${userId}?limit=${limit}`);
  }

  async updateJournalEntry(entryId: string, updates: any) {
    return this.makeRequest('PATCH', `/api/journal/entries/${entryId}`, updates);
  }

  async deleteJournalEntry(entryId: string) {
    return this.makeRequest('DELETE', `/api/journal/entries/${entryId}`);
  }

  // ========== COMMUNITY ENDPOINTS ==========

  async getCommunityPosts(limit: number = 20, offset: number = 0) {
    return this.makeRequest('GET', `/api/community/posts?limit=${limit}&offset=${offset}`);
  }

  async createCommunityPost(post: any) {
    return this.makeRequest('POST', '/api/community/posts', post);
  }

  async likePost(postId: string) {
    return this.makeRequest('POST', `/api/community/posts/${postId}/like`);
  }

  async reportContent(contentId: string, reason: string) {
    return this.makeRequest('POST', `/api/community/report`, { contentId, reason });
  }

  async joinGroup(groupId: string) {
    return this.makeRequest('POST', `/api/community/groups/${groupId}/join`);
  }

  // ========== CRISIS ENDPOINTS ==========

  async triggerCrisisAlert(userId: string, severity: string) {
    return this.makeRequest('POST', '/api/crisis/alert', { userId, severity });
  }

  async getCrisisResources(location?: string) {
    return this.makeRequest('GET', `/api/crisis/resources${location ? `?location=${location}` : ''}`);
  }

  async logCrisisInteraction(interaction: any) {
    return this.makeRequest('POST', '/api/crisis/log', interaction);
  }

  // ========== PROFESSIONAL ENDPOINTS ==========

  async getTherapists(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.makeRequest('GET', `/api/professionals/therapists${queryString}`);
  }

  async bookSession(therapistId: string, sessionData: any) {
    return this.makeRequest('POST', `/api/professionals/sessions`, { therapistId, ...sessionData });
  }

  async getUpcomingSessions(userId: string) {
    return this.makeRequest('GET', `/api/professionals/sessions/${userId}`);
  }

  async cancelSession(sessionId: string) {
    return this.makeRequest('DELETE', `/api/professionals/sessions/${sessionId}`);
  }

  // ========== WELLNESS ENDPOINTS ==========

  async getWellnessTools() {
    return this.makeRequest('GET', '/api/wellness/tools');
  }

  async logWellnessActivity(activity: any) {
    return this.makeRequest('POST', '/api/wellness/activities', activity);
  }

  async getWellnessRecommendations(userId: string) {
    return this.makeRequest('GET', `/api/wellness/recommendations/${userId}`);
  }

  // ========== AI CHAT ENDPOINTS ==========

  async sendAIMessage(message: string, context?: any) {
    return this.makeRequest('POST', '/api/ai/chat', { message, context });
  }

  async getAIChatHistory(userId: string) {
    return this.makeRequest('GET', `/api/ai/history/${userId}`);
  }

  async clearAIChatHistory(userId: string) {
    return this.makeRequest('DELETE', `/api/ai/history/${userId}`);
  }

  // ========== ASSESSMENT ENDPOINTS ==========

  async getAssessments() {
    return this.makeRequest('GET', '/api/assessments');
  }

  async submitAssessment(assessmentId: string, responses: any) {
    return this.makeRequest('POST', `/api/assessments/${assessmentId}/submit`, responses);
  }

  async getAssessmentResults(userId: string) {
    return this.makeRequest('GET', `/api/assessments/results/${userId}`);
  }

  // ========== ANALYTICS ENDPOINTS ==========

  async trackEvent(event: any) {
    return this.makeRequest('POST', '/api/analytics/events', event);
  }

  async getUserAnalytics(userId: string) {
    return this.makeRequest('GET', `/api/analytics/users/${userId}`);
  }

  async getPlatformAnalytics() {
    return this.makeRequest('GET', '/api/analytics/platform');
  }
}

// Export singleton instance
export const apiService = new ApiIntegrationService();

// Export for testing
export default ApiIntegrationService;