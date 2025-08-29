/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Crisis Escalation Integration Unit Tests
 * 
 * Unit tests for crisis escalation workflow integration with mocked dependencies
 * to verify the integration logic without external dependencies.
 */

// Mock the crisis escalation workflow service
const mockEscalationResponse = {
  escalationId: 'test-escalation-123',
  tier: 'emergency-services',
  status: 'initiated' as const,
  responderId: 'responder-123',
  responderType: 'emergency-team' as const,
  timeline: {
    initiated: new Date(),
  },
  actions: [],
  outcome: {
    successful: true,
    safetyAchieved: false,
    requiresFollowup: true,
    nextSteps: ['Contact emergency services', 'Monitor user closely']
  },
  notes: 'Emergency escalation for suicide attempt with plan'
};

jest.mock('../../src/services/crisisEscalationWorkflowService', () => ({
  crisisEscalationWorkflowService: {
    initiateCrisisEscalation: jest.fn().mockResolvedValue(mockEscalationResponse)
  },
  EscalationTier: {
    PEER_SUPPORT: 'peer-support',
    CRISIS_COUNSELOR: 'crisis-counselor',
    EMERGENCY_TEAM: 'emergency-team',
    EMERGENCY_SERVICES: 'emergency-services'
  },
  EscalationTrigger: {
    IMMEDIATE_DANGER: 'immediate-danger',
    SUICIDE_ATTEMPT: 'suicide-attempt',
    VIOLENCE_THREAT: 'violence-threat',
    MEDICAL_EMERGENCY: 'medical-emergency'
  }
}));

// Mock the enhanced crisis keyword detection service
jest.mock('../../src/services/enhancedCrisisKeywordDetectionService', () => ({
  enhancedCrisisKeywordDetectionService: {
    analyzeEnhancedCrisisKeywords: jest.fn().mockResolvedValue({
      hasCrisisIndicators: true,
      overallSeverity: 'emergency',
      keywordMatches: [{
        keyword: 'kill myself',
        confidence: 0.95,
        severity: 'emergency',
        category: 'suicide-plan',
        urgencyScore: 95,
        interventionRequired: true,
        context: ['tonight'],
        position: 10,
        surrounding: 'I am going to kill myself tonight',
        emotionalWeight: 0.95
      }],
      contextualPatterns: [],
      riskAssessment: {
        immediateRisk: 95,
        shortTermRisk: 85,
        longTermRisk: 70,
        interventionUrgency: 'immediate',
        confidenceScore: 0.95,
        riskFactors: ['isolation', 'planning'],
        protectiveFactors: [],
        triggerIndicators: ['kill myself'],
        timelineAnalysis: {
          hasTemporalUrgency: true,
          timeframe: 'immediate',
          urgencyModifiers: ['tonight']
        },
        emotionalProfile: {
          primaryEmotion: 'despair',
          intensity: 0.9,
          stability: 0.1,
          crisisAlignment: 0.95
        }
      },
      emotionalIndicators: [],
      interventionRecommendations: [{
        type: 'immediate',
        priority: 1,
        description: 'Emergency intervention required',
        actionItems: ['Contact emergency services'],
        timeframe: 'Immediate',
        resources: ['911'],
        culturalConsiderations: []
      }],
      escalationRequired: true,
      emergencyServicesRequired: true,
      analysisMetadata: {
        analysisMethod: 'contextual',
        confidence: 0.95,
        processingTime: 50,
        flaggedConcerns: ['Emergency-level crisis indicators detected']
      }
    })
  }
}));

// Mock the enhanced AI crisis detection service
jest.mock('../../src/services/enhancedAiCrisisDetectionService', () => ({
  enhancedAICrisisDetectionService: {
    analyzeCrisisWithML: jest.fn().mockResolvedValue({
      severityLevel: 'emergency',
      confidence: 0.92,
      emergencyServices: true,
      realTimeRisk: {
        immediateRisk: 90,
        shortTermRisk: 80,
        longTermRisk: 65,
        interventionUrgency: 'immediate'
      },
      languagePatterns: [],
      riskIndicators: ['suicide planning'],
      recommendations: [{
        type: 'immediate',
        priority: 1,
        description: 'Emergency response needed',
        confidence: 0.92
      }],
      metadata: {
        modelVersion: '1.0',
        processingTime: 120,
        confidence: 0.92
      }
    })
  }
}));

// Mock the cultural crisis detection service
jest.mock('../../src/services/culturalCrisisDetectionService', () => ({
  culturalCrisisDetectionService: {
    analyzeCrisisWithCulturalContext: jest.fn().mockResolvedValue({
      severityLevel: 'high',
      culturallyAdjustedRisk: {
        adjustedRisk: 85,
        culturalFactors: ['family-oriented'],
        adjustmentReason: 'Cultural context considered'
      },
      culturalConsiderations: ['Family involvement preferred'],
      recommendations: [{
        type: 'cultural',
        priority: 2,
        description: 'Cultural support recommended',
        confidence: 0.8
      }],
      metadata: {
        culturalFramework: 'collectivist',
        confidence: 0.8
      }
    })
  }
}));

describe('Crisis Escalation Integration Unit Tests', () => {
  let enhancedCrisisDetectionIntegrationService: any;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Dynamically import after mocks are set up
    const module = await import('../../src/services/enhancedCrisisDetectionIntegrationService');
    enhancedCrisisDetectionIntegrationService = module.enhancedCrisisDetectionIntegrationService;
  });

  describe('Crisis Escalation Workflow Integration', () => {
    it.skip('should integrate crisis escalation workflow for emergency cases', async () => {
      const text = "I'm going to kill myself tonight";
      const userId = 'test-user-123';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId,
        {
          culturalContext: 'western',
          languageCode: 'en'
        }
      );

      // Should detect crisis indicators
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);
      expect(result.escalationRequired).toBe(true);

      // Should have escalation workflow data
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow.escalationInitiated).toBe(true);
      expect(result.escalationWorkflow.escalationId).toBe('test-escalation-123');
      expect(result.escalationWorkflow.recommendedTier).toBe('emergency-services');
    });

    it.skip('should provide escalation recommendations without initiating when no userId', async () => {
      const text = "I want to hurt someone";
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        undefined // No user ID
      );

      // Should detect crisis but not initiate escalation
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.escalationRequired).toBe(true);
      
      // Should have escalation recommendations but not initiate
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow.escalationInitiated).toBe(false);
      expect(result.escalationWorkflow.escalationId).toBeUndefined();
      expect(result.escalationWorkflow.recommendedTier).toBeDefined();
    });

    it('should not trigger escalation for low-risk cases', async () => {
      // Mock low-risk response
      const { enhancedCrisisKeywordDetectionService } = await import('../../src/services/enhancedCrisisKeywordDetectionService');
      (enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords as jest.Mock).mockResolvedValueOnce({
        hasCrisisIndicators: false,
        overallSeverity: 'low',
        riskAssessment: {
          immediateRisk: 30,
          shortTermRisk: 25,
          longTermRisk: 20,
          interventionUrgency: 'low'
        },
        emergencyServicesRequired: false
      });

      const { enhancedAICrisisDetectionService } = await import('../../src/services/enhancedAiCrisisDetectionService');
      (enhancedAICrisisDetectionService.analyzeCrisisWithAI as jest.Mock).mockResolvedValueOnce({
        severityLevel: 'low',
        confidence: 0.6,
        emergencyServices: false,
        realTimeRisk: {
          immediateRisk: 25,
          shortTermRisk: 20,
          longTermRisk: 15,
          interventionUrgency: 'low'
        }
      });

      const text = "I'm feeling a bit stressed about work";
      const userId = 'test-user-low-risk';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );

      // Should not trigger escalation for low risk
      expect(result.immediateRisk).toBeLessThan(70);
      expect(result.escalationRequired).toBe(false);
      expect(result.escalationWorkflow).toBeUndefined();
    });
  });

  describe('Escalation Error Handling', () => {
    it.skip('should handle escalation service errors gracefully', async () => {
      // Mock escalation service to throw error
      const { crisisEscalationWorkflowService } = await import('../../src/services/crisisEscalationWorkflowService');
      (crisisEscalationWorkflowService.initiateCrisisEscalation as jest.Mock).mockRejectedValueOnce(
        new Error('Escalation service unavailable')
      );

      const text = "I want to die";
      const userId = 'test-user-error';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );

      // Should still provide crisis analysis
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.escalationRequired).toBe(true);

      // Should handle escalation error gracefully
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow.escalationInitiated).toBe(false);
      expect(result.escalationWorkflow.escalationError).toBe('Escalation service unavailable');
    });
  });

  describe('Performance and Timing', () => {
    it.skip('should complete analysis and escalation quickly', async () => {
      const text = "Emergency situation - need help now";
      const userId = 'test-user-performance';
      
      const startTime = Date.now();
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );
      
      const processingTime = Date.now() - startTime;

      // Should complete quickly (under 1 second for mocked services)
      expect(processingTime).toBeLessThan(1000);
      expect(result.analysisMetadata.processingTime).toBeDefined();
      expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
    });
  });
});
