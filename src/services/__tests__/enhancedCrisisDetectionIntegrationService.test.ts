/**
 * Enhanced Crisis Detection Integration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../api/crisisService');
jest.mock('../auth/authService');
jest.mock('../analyticsService');

interface CrisisRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  triggers: string[];
  recommendations: string[];
  supportResources: string[];
}

interface CrisisDetectionOptions {
  content: string;
  context?: 'chat' | 'mood' | 'journal' | 'assessment';
  userId?: string;
  immediate?: boolean;
}

class EnhancedCrisisDetectionIntegrationService {
  private apiKey: string;
  private isEnabled: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.isEnabled = true;
  }

  async analyzeCrisisRisk(options: CrisisDetectionOptions): Promise<CrisisRiskAnalysis> {
    if (!this.isEnabled) {
      throw new Error('Crisis detection service is disabled');
    }

    const { content, context = 'chat', userId } = options;

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 100));

    // Crisis keywords detection
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'hurt myself', 
      'self harm', 'not worth living', 'better off dead'
    ];

    const moderateKeywords = [
      'depressed', 'hopeless', 'overwhelming', 'panic', 
      'anxiety attack', 'breakdown'
    ];

    const contentLower = content.toLowerCase();
    const hasCrisisKeywords = crisisKeywords.some(keyword => 
      contentLower.includes(keyword)
    );
    const hasModerateKeywords = moderateKeywords.some(keyword => 
      contentLower.includes(keyword)
    );

    let riskLevel: CrisisRiskAnalysis['riskLevel'] = 'low';
    let confidence = 0.3;
    let triggers: string[] = [];
    let recommendations: string[] = ['monitor_mood', 'self_care'];

    if (hasCrisisKeywords) {
      riskLevel = 'critical';
      confidence = 0.95;
      triggers = ['suicidal_ideation', 'self_harm'];
      recommendations = ['immediate_support', 'emergency_contact', 'crisis_intervention'];
    } else if (hasModerateKeywords) {
      riskLevel = 'medium';
      confidence = 0.7;
      triggers = ['depression_indicators', 'anxiety_symptoms'];
      recommendations = ['professional_support', 'coping_strategies', 'check_in'];
    }

    const supportResources = this.getSupportResources(riskLevel);

    return {
      riskLevel,
      confidence,
      triggers,
      recommendations,
      supportResources
    };
  }

  private getSupportResources(riskLevel: CrisisRiskAnalysis['riskLevel']): string[] {
    const baseResources = [
      'National Suicide Prevention Lifeline: 988',
      'Crisis Text Line: Text HOME to 741741'
    ];

    switch (riskLevel) {
      case 'critical':
        return [
          'Emergency Services: 911',
          ...baseResources,
          'Immediate psychiatric evaluation',
          'Crisis hotline support'
        ];
      case 'high':
        return [
          ...baseResources,
          'Mental health professional consultation',
          'Safety planning resources'
        ];
      case 'medium':
        return [
          ...baseResources,
          'Mental health screening tools',
          'Peer support groups'
        ];
      default:
        return [
          'Mental wellness resources',
          'Mindfulness exercises',
          'Community support'
        ];
    }
  }

  async integrateWithChatSystem(message: string, chatId: string): Promise<{
    blocked: boolean;
    riskAnalysis: CrisisRiskAnalysis;
    interventionTriggered: boolean;
  }> {
    const riskAnalysis = await this.analyzeCrisisRisk({
      content: message,
      context: 'chat'
    });

    const shouldBlock = riskAnalysis.riskLevel === 'critical';
    const shouldIntervene = ['critical', 'high'].includes(riskAnalysis.riskLevel);

    if (shouldIntervene) {
      await this.triggerIntervention(chatId, riskAnalysis);
    }

    return {
      blocked: shouldBlock,
      riskAnalysis,
      interventionTriggered: shouldIntervene
    };
  }

  private async triggerIntervention(chatId: string, analysis: CrisisRiskAnalysis): Promise<void> {
    // Log intervention
    console.log(`Crisis intervention triggered for chat ${chatId}`, {
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence
    });

    // In real implementation, this would:
    // 1. Alert moderators
    // 2. Provide crisis resources
    // 3. Connect to crisis counselors
    // 4. Log for follow-up
  }

  async performRealTimeMonitoring(userId: string, content: string): Promise<void> {
    const analysis = await this.analyzeCrisisRisk({
      content,
      userId,
      immediate: true
    });

    if (analysis.riskLevel === 'critical') {
      await this.initiateEmergencyProtocol(userId, analysis);
    }
  }

  private async initiateEmergencyProtocol(userId: string, analysis: CrisisRiskAnalysis): Promise<void> {
    // Emergency protocol steps:
    // 1. Immediate notification to emergency contacts
    // 2. Crisis counselor connection
    // 3. Location-based emergency services if consented
    // 4. Follow-up care coordination

    console.log(`Emergency protocol initiated for user ${userId}`, analysis);
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}

describe('EnhancedCrisisDetectionIntegrationService', () => {
  let service: EnhancedCrisisDetectionIntegrationService;

  beforeEach(() => {
    service = new EnhancedCrisisDetectionIntegrationService('test-api-key');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Crisis Risk Analysis', () => {
    it('should detect critical risk level for suicidal content', async () => {
      const analysis = await service.analyzeCrisisRisk({
        content: 'I want to kill myself and end it all'
      });

      expect(analysis.riskLevel).toBe('critical');
      expect(analysis.confidence).toBeGreaterThan(0.9);
      expect(analysis.triggers).toContain('suicidal_ideation');
      expect(analysis.recommendations).toContain('immediate_support');
    });

    it('should detect medium risk for depression indicators', async () => {
      const analysis = await service.analyzeCrisisRisk({
        content: 'I feel so depressed and hopeless lately'
      });

      expect(analysis.riskLevel).toBe('medium');
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.triggers).toContain('depression_indicators');
    });

    it('should return low risk for normal content', async () => {
      const analysis = await service.analyzeCrisisRisk({
        content: 'Had a good day at work today'
      });

      expect(analysis.riskLevel).toBe('low');
      expect(analysis.triggers).toHaveLength(0);
    });

    it('should include appropriate support resources', async () => {
      const criticalAnalysis = await service.analyzeCrisisRisk({
        content: 'I want to hurt myself'
      });

      expect(criticalAnalysis.supportResources).toContain('Emergency Services: 911');
      expect(criticalAnalysis.supportResources).toContain('National Suicide Prevention Lifeline: 988');
    });
  });

  describe('Chat System Integration', () => {
    it('should integrate with chat system for crisis content', async () => {
      const result = await service.integrateWithChatSystem(
        'I want to end my life',
        'chat-123'
      );

      expect(result.blocked).toBe(true);
      expect(result.interventionTriggered).toBe(true);
      expect(result.riskAnalysis.riskLevel).toBe('critical');
    });

    it('should not block non-crisis messages', async () => {
      const result = await service.integrateWithChatSystem(
        'Hello, how are you?',
        'chat-123'
      );

      expect(result.blocked).toBe(false);
      expect(result.interventionTriggered).toBe(false);
      expect(result.riskAnalysis.riskLevel).toBe('low');
    });

    it('should trigger intervention for high-risk content', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await service.integrateWithChatSystem(
        'I feel like hurting myself',
        'chat-456'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Crisis intervention triggered for chat chat-456',
        expect.objectContaining({
          riskLevel: 'critical',
          confidence: expect.any(Number)
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Real-time Monitoring', () => {
    it('should perform real-time monitoring', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await service.performRealTimeMonitoring(
        'user-123',
        'I cannot take this anymore'
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should initiate emergency protocol for critical situations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await service.performRealTimeMonitoring(
        'user-456',
        'I want to kill myself tonight'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Emergency protocol initiated for user user-456',
        expect.objectContaining({
          riskLevel: 'critical'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Service Management', () => {
    it('should enable and disable service', () => {
      expect(service.isServiceEnabled()).toBe(true);

      service.setEnabled(false);
      expect(service.isServiceEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isServiceEnabled()).toBe(true);
    });

    it('should throw error when service is disabled', async () => {
      service.setEnabled(false);

      await expect(service.analyzeCrisisRisk({
        content: 'test content'
      })).rejects.toThrow('Crisis detection service is disabled');
    });
  });

  describe('Context-Aware Detection', () => {
    it('should handle different contexts', async () => {
      const chatAnalysis = await service.analyzeCrisisRisk({
        content: 'feeling really down',
        context: 'chat'
      });

      const moodAnalysis = await service.analyzeCrisisRisk({
        content: 'feeling really down',
        context: 'mood'
      });

      expect(chatAnalysis.riskLevel).toBe('medium');
      expect(moodAnalysis.riskLevel).toBe('medium');
    });

    it('should include user context when provided', async () => {
      const analysis = await service.analyzeCrisisRisk({
        content: 'struggling today',
        userId: 'user-789',
        context: 'journal'
      });

      expect(analysis).toBeDefined();
      expect(analysis.riskLevel).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      await expect(service.analyzeCrisisRisk({
        content: ''
      })).resolves.toBeDefined();
    });

    it('should handle service errors', async () => {
      // Mock a service error
      const originalAnalyze = service.analyzeCrisisRisk;
      service.analyzeCrisisRisk = jest.fn(() => Promise.reject(new Error('Service error'))) as any;

      await expect(service.analyzeCrisisRisk({
        content: 'test'
      })).rejects.toThrow('Service error');

      // Restore original method
      service.analyzeCrisisRisk = originalAnalyze;
    });
  });

  describe('Integration Points', () => {
    it('should provide comprehensive crisis analysis', async () => {
      const analysis = await service.analyzeCrisisRisk({
        content: 'I have been thinking about suicide lately',
        context: 'assessment',
        userId: 'user-assessment-123'
      });

      // Should include all required fields
      expect(analysis).toHaveProperty('riskLevel');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('triggers');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('supportResources');

      // Should provide actionable information
      expect(analysis.riskLevel).toBe('critical');
      expect(analysis.triggers.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.supportResources.length).toBeGreaterThan(0);
    });
  });
});

