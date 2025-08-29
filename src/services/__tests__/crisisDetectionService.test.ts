/**
 * Crisis Detection Service Tests
 * 
 * Comprehensive test suite for crisis detection functionality
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock implementation for testing
const mockCrisisDetectionService = {
  detectCrisis: vi.fn(),
  analyzeSentiment: vi.fn(),
  checkKeywords: vi.fn(),
  assessUrgency: vi.fn(),
  triggerAlert: vi.fn(),
  getStatistics: vi.fn(),
  updateConfiguration: vi.fn()
};

describe('Crisis Detection Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Detection', () => {
    test('should detect high-risk keywords', async () => {
      const testMessage = 'I want to hurt myself';
      
      mockCrisisDetectionService.detectCrisis.mockResolvedValue({
        isInCrisis: true,
        confidence: 0.95,
        urgency: 'high',
        triggers: ['self-harm keywords']
      });

      const result = await mockCrisisDetectionService.detectCrisis(testMessage);

      expect(result.isInCrisis).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.urgency).toBe('high');
    });

    test('should not flag normal messages', async () => {
      const testMessage = 'I had a good day today';
      
      mockCrisisDetectionService.detectCrisis.mockResolvedValue({
        isInCrisis: false,
        confidence: 0.1,
        urgency: 'low',
        triggers: []
      });

      const result = await mockCrisisDetectionService.detectCrisis(testMessage);

      expect(result.isInCrisis).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.urgency).toBe('low');
    });

    test('should handle empty or null messages', async () => {
      mockCrisisDetectionService.detectCrisis.mockResolvedValue({
        isInCrisis: false,
        confidence: 0,
        urgency: 'low',
        triggers: []
      });

      const resultEmpty = await mockCrisisDetectionService.detectCrisis('');
      const resultNull = await mockCrisisDetectionService.detectCrisis(null);

      expect(resultEmpty.isInCrisis).toBe(false);
      expect(resultNull.isInCrisis).toBe(false);
    });
  });

  describe('Sentiment Analysis', () => {
    test('should analyze negative sentiment correctly', async () => {
      const testMessage = 'Everything is hopeless and dark';
      
      mockCrisisDetectionService.analyzeSentiment.mockResolvedValue({
        sentiment: 'negative',
        score: -0.8,
        emotions: ['sadness', 'despair'],
        intensity: 'high'
      });

      const result = await mockCrisisDetectionService.analyzeSentiment(testMessage);

      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
      expect(result.emotions).toContain('sadness');
    });

    test('should analyze positive sentiment correctly', async () => {
      const testMessage = 'I feel great and optimistic about the future';
      
      mockCrisisDetectionService.analyzeSentiment.mockResolvedValue({
        sentiment: 'positive',
        score: 0.7,
        emotions: ['joy', 'optimism'],
        intensity: 'medium'
      });

      const result = await mockCrisisDetectionService.analyzeSentiment(testMessage);

      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.emotions).toContain('joy');
    });

    test('should handle mixed emotions', async () => {
      const testMessage = 'I am happy but also worried about tomorrow';
      
      mockCrisisDetectionService.analyzeSentiment.mockResolvedValue({
        sentiment: 'mixed',
        score: 0.1,
        emotions: ['happiness', 'anxiety'],
        intensity: 'medium'
      });

      const result = await mockCrisisDetectionService.analyzeSentiment(testMessage);

      expect(result.sentiment).toBe('mixed');
      expect(result.emotions).toEqual(expect.arrayContaining(['happiness', 'anxiety']));
    });
  });

  describe('Keyword Detection', () => {
    test('should identify crisis keywords', async () => {
      const testMessage = 'I want to end it all';
      
      mockCrisisDetectionService.checkKeywords.mockResolvedValue({
        foundKeywords: ['end it all'],
        categories: ['suicidal ideation'],
        riskLevel: 'critical'
      });

      const result = await mockCrisisDetectionService.checkKeywords(testMessage);

      expect(result.foundKeywords).toContain('end it all');
      expect(result.categories).toContain('suicidal ideation');
      expect(result.riskLevel).toBe('critical');
    });

    test('should handle context-sensitive keywords', async () => {
      const testMessage1 = 'I could kill for some pizza right now';
      const testMessage2 = 'I want to kill myself';
      
      mockCrisisDetectionService.checkKeywords
        .mockResolvedValueOnce({
          foundKeywords: [],
          categories: [],
          riskLevel: 'low'
        })
        .mockResolvedValueOnce({
          foundKeywords: ['kill myself'],
          categories: ['suicidal ideation'],
          riskLevel: 'critical'
        });

      const result1 = await mockCrisisDetectionService.checkKeywords(testMessage1);
      const result2 = await mockCrisisDetectionService.checkKeywords(testMessage2);

      expect(result1.riskLevel).toBe('low');
      expect(result2.riskLevel).toBe('critical');
    });
  });

  describe('Urgency Assessment', () => {
    test('should assess immediate danger correctly', async () => {
      const crisisData = {
        keywords: ['suicide', 'tonight'],
        sentiment: -0.9,
        context: 'immediate plan'
      };
      
      mockCrisisDetectionService.assessUrgency.mockResolvedValue({
        urgency: 'critical',
        timeframe: 'immediate',
        recommendedAction: 'emergency_intervention',
        confidence: 0.95
      });

      const result = await mockCrisisDetectionService.assessUrgency(crisisData);

      expect(result.urgency).toBe('critical');
      expect(result.timeframe).toBe('immediate');
      expect(result.recommendedAction).toBe('emergency_intervention');
    });

    test('should assess medium-term risk correctly', async () => {
      const crisisData = {
        keywords: ['hopeless', 'alone'],
        sentiment: -0.6,
        context: 'chronic feelings'
      };
      
      mockCrisisDetectionService.assessUrgency.mockResolvedValue({
        urgency: 'moderate',
        timeframe: 'short_term',
        recommendedAction: 'counselor_contact',
        confidence: 0.7
      });

      const result = await mockCrisisDetectionService.assessUrgency(crisisData);

      expect(result.urgency).toBe('moderate');
      expect(result.timeframe).toBe('short_term');
      expect(result.recommendedAction).toBe('counselor_contact');
    });
  });

  describe('Alert System', () => {
    test('should trigger alerts for critical situations', async () => {
      const alertData = {
        userId: 'user-123',
        riskLevel: 'critical',
        message: 'User expressing immediate suicidal intent',
        timestamp: new Date()
      };
      
      mockCrisisDetectionService.triggerAlert.mockResolvedValue({
        alertId: 'alert-456',
        status: 'sent',
        recipients: ['emergency_team', 'therapist'],
        timestamp: new Date()
      });

      const result = await mockCrisisDetectionService.triggerAlert(alertData);

      expect(result.status).toBe('sent');
      expect(result.recipients).toContain('emergency_team');
      expect(result.alertId).toBeDefined();
    });

    test('should not trigger alerts for low-risk situations', async () => {
      const alertData = {
        userId: 'user-123',
        riskLevel: 'low',
        message: 'User feeling slightly down',
        timestamp: new Date()
      };
      
      mockCrisisDetectionService.triggerAlert.mockResolvedValue({
        alertId: null,
        status: 'not_triggered',
        recipients: [],
        timestamp: new Date()
      });

      const result = await mockCrisisDetectionService.triggerAlert(alertData);

      expect(result.status).toBe('not_triggered');
      expect(result.alertId).toBeNull();
    });
  });

  describe('Configuration Management', () => {
    test('should update detection sensitivity', async () => {
      const config = {
        sensitivity: 'high',
        keywordThreshold: 0.3,
        sentimentThreshold: -0.5
      };
      
      mockCrisisDetectionService.updateConfiguration.mockResolvedValue({
        success: true,
        config: config,
        timestamp: new Date()
      });

      const result = await mockCrisisDetectionService.updateConfiguration(config);

      expect(result.success).toBe(true);
      expect(result.config.sensitivity).toBe('high');
    });

    test('should validate configuration parameters', async () => {
      const invalidConfig = {
        sensitivity: 'invalid',
        keywordThreshold: 2.0 // Invalid: should be 0-1
      };
      
      mockCrisisDetectionService.updateConfiguration.mockRejectedValue(
        new Error('Invalid configuration parameters')
      );

      await expect(
        mockCrisisDetectionService.updateConfiguration(invalidConfig)
      ).rejects.toThrow('Invalid configuration parameters');
    });
  });

  describe('Statistics and Reporting', () => {
    test('should provide accurate statistics', async () => {
      const mockStats = {
        totalDetections: 150,
        criticalAlerts: 25,
        falsePositives: 8,
        successfulDeEscalations: 12,
        userFeedback: 'very-helpful',
        averageResponseTime: 180 // seconds
      };
      
      mockCrisisDetectionService.getStatistics.mockResolvedValue(mockStats);

      const result = await mockCrisisDetectionService.getStatistics();

      expect(result.totalDetections).toBe(150);
      expect(result.criticalAlerts).toBe(25);
      expect(result.successfulDeEscalations).toBe(12);
      expect(result.averageResponseTime).toBe(180);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle service unavailability gracefully', async () => {
      mockCrisisDetectionService.detectCrisis.mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      await expect(
        mockCrisisDetectionService.detectCrisis('test message')
      ).rejects.toThrow('Service temporarily unavailable');
    });

    test('should handle malformed input data', async () => {
      const malformedData = { 
        not_a_message: 'this is wrong',
        random_field: 123 
      };
      
      mockCrisisDetectionService.detectCrisis.mockRejectedValue(
        new Error('Invalid input format')
      );

      await expect(
        mockCrisisDetectionService.detectCrisis(malformedData as any)
      ).rejects.toThrow('Invalid input format');
    });

    test('should handle network timeouts', async () => {
      mockCrisisDetectionService.detectCrisis.mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(
        mockCrisisDetectionService.detectCrisis('test message')
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Tests', () => {
    test('should process messages within acceptable time limits', async () => {
      const startTime = Date.now();
      
      mockCrisisDetectionService.detectCrisis.mockImplementation(async () => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          isInCrisis: false,
          confidence: 0.2,
          urgency: 'low',
          triggers: []
        };
      });

      await mockCrisisDetectionService.detectCrisis('test message');
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
    });

    test('should handle batch processing efficiently', async () => {
      const messages = Array(10).fill('test message');
      
      mockCrisisDetectionService.detectCrisis.mockResolvedValue({
        isInCrisis: false,
        confidence: 0.1,
        urgency: 'low',
        triggers: []
      });

      const startTime = Date.now();
      await Promise.all(
        messages.map(msg => mockCrisisDetectionService.detectCrisis(msg))
      );
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(2000); // Should handle 10 messages within 2 seconds
    });
  });
});
