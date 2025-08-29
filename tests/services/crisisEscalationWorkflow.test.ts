/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Crisis Escalation Workflow Service Tests
 * 
 * Comprehensive testing for crisis escalation workflows, emergency response protocols,
 * and multi-tier escalation system to ensure reliable operation during crisis situations.
 */

import { crisisEscalationWorkflowService } from '../../src/services/crisisEscalationWorkflowService';
import type {
  EscalationTier
} from '../../src/services/crisisEscalationWorkflowService';
import type { ComprehensiveCrisisAnalysisResult } from '../../src/services/enhancedCrisisDetectionIntegrationService';

// Mock comprehensive crisis analysis results for testing
const createMockCrisisAnalysis = (
  overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'emergency',
  immediateRisk: number,
  emergencyServicesRequired: boolean = false
): ComprehensiveCrisisAnalysisResult => {
  let urgencyLevel: 'immediate' | 'high' | 'medium';
  if (immediateRisk >= 90) {
    urgencyLevel = 'immediate';
  } else if (immediateRisk >= 70) {
    urgencyLevel = 'high';
  } else {
    urgencyLevel = 'medium';
  }
  
  return {
    hasCrisisIndicators: overallSeverity !== 'none',
    overallSeverity,
    confidenceScore: 0.85,
    immediateRisk,
    shortTermRisk: immediateRisk * 0.8,
    longTermRisk: immediateRisk * 0.6,
    interventionUrgency: urgencyLevel,
    keywordAnalysis: {} as any,
    aiAnalysis: {} as any,
    interventionRecommendations: [],
    escalationRequired: immediateRisk >= 70,
    emergencyServicesRequired,
    triggeredIndicators: [],
    riskFactors: [],
    protectiveFactors: [],
    emotionalProfile: {
      primaryEmotion: 'distress',
      intensity: immediateRisk / 100,
      stability: 0.5,
      crisisAlignment: 0.8
    },
    analysisMetadata: {
      methodsUsed: ['keyword', 'ai'],
      processingTime: 150,
      confidenceBreakdown: {
        keyword: 0.8,
        ai: 0.9,
        overall: 0.85
      },
      flaggedConcerns: [],
      analysisVersion: '1.0'
    }
  };
};

const createMockUserContext = () => ({
  languageCode: 'en',
  culturalContext: 'western',
  accessibilityNeeds: [],
  preferredContactMethod: 'phone' as const,
  timeZone: 'America/New_York',
  location: {
    country: 'US',
    region: 'Northeast',
    hasGeolocation: true
  }
});

const createMockSessionData = () => ({
  conversationId: 'conv-123',
  messagesSent: 15,
  sessionDuration: 300000, // 5 minutes
  previousEscalations: 0,
  riskTrend: 'increasing' as const
});

describe('Crisis Escalation Workflow Service', () => {
  
  describe('Crisis Escalation Initiation', () => {
    
    test('should initiate peer support escalation for low-risk situations', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('medium', 35);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-123',
        userContext,
        sessionData
      );

      expect(response).toBeDefined();
      expect(response.tier).toBe('peer-support');
      expect(response.status).toBe('initiated');
      expect(response.escalationId).toMatch(/^escalation-/);
      expect(response.timeline.initiated).toBeInstanceOf(Date);
    });

    test('should initiate crisis counselor escalation for high-risk situations', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('high', 65);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-456',
        userContext,
        sessionData
      );

      expect(response.tier).toBe('crisis-counselor');
      expect(response.status).toBe('initiated');
      expect(response.responderType).toBe('crisis-counselor');
      expect(response.outcome.requiresFollowup).toBe(true);
    });

    test('should initiate emergency team escalation for critical situations', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('critical', 85);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-789',
        userContext,
        sessionData
      );

      expect(response.tier).toBe('emergency-team');
      expect(response.status).toBe('initiated');
      expect(response.responderType).toBe('emergency-team');
      expect(response.outcome.safetyAchieved).toBeDefined();
    });

    test('should initiate emergency services escalation for emergency situations', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('emergency', 95, true);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-999',
        userContext,
        sessionData
      );

      expect(response.tier).toBe('emergency-services');
      expect(response.status).toBe('initiated');
      expect(response.responderType).toBe('medical-professional');
      expect(response.outcome.requiresFollowup).toBe(true);
    });

    test('should handle manual override for escalation tier', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('medium', 45);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const manualOverride = {
        tier: 'crisis-counselor' as EscalationTier,
        reason: 'User specifically requested professional help'
      };

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-override',
        userContext,
        sessionData,
        manualOverride
      );

      expect(response.tier).toBe('crisis-counselor');
      expect(response.notes).toContain('manual-escalation');
    });

    test('should fallback to emergency services on escalation failure', async () => {
      // Create invalid crisis analysis to trigger error
      const invalidAnalysis = null as any;
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        invalidAnalysis,
        'user-error',
        userContext,
        sessionData
      );

      expect(response.tier).toBe('emergency-services');
      expect(response.notes).toContain('fallback');
    });
  });

  describe('Emergency Escalation', () => {
    
    test('should handle immediate emergency escalation', async () => {
      const immediateContext = {
        location: 'New York, NY',
        description: 'User reported active suicide attempt',
        contactPreference: 'phone'
      };

      const response = await crisisEscalationWorkflowService.escalateEmergency(
        'user-emergency',
        'suicide-attempt',
        immediateContext
      );

      expect(response.tier).toBe('emergency-services');
      expect(response.status).toBe('in-progress');
      expect(response.escalationId).toMatch(/^emergency-/);
      expect(response.notes).toContain('User reported active suicide attempt');
      expect(response.outcome.requiresFollowup).toBe(true);
    });

    test('should handle medical emergency escalation', async () => {
      const medicalContext = {
        description: 'User reported overdose in progress',
        contactPreference: 'phone'
      };

      const response = await crisisEscalationWorkflowService.escalateEmergency(
        'user-medical',
        'substance-overdose',
        medicalContext
      );

      expect(response.tier).toBe('emergency-services');
      expect(response.escalationId).toMatch(/^emergency-/);
      expect(response.outcome.nextSteps).toContain('Emergency services contacted');
    });

    test('should handle violence threat escalation', async () => {
      const violenceContext = {
        description: 'User threatening violence toward others',
        contactPreference: 'phone'
      };

      const response = await crisisEscalationWorkflowService.escalateEmergency(
        'user-violence',
        'violence-threat',
        violenceContext
      );

      expect(response.tier).toBe('emergency-services');
      expect(response.notes).toContain('User threatening violence toward others');
    });
  });

  describe('Escalation Monitoring and Updates', () => {
    
    test('should track active escalations', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('high', 75);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-track',
        userContext,
        sessionData
      );

      const trackedEscalation = await crisisEscalationWorkflowService.monitorEscalationProgress(
        response.escalationId
      );

      expect(trackedEscalation).toBeDefined();
      expect(trackedEscalation?.escalationId).toBe(response.escalationId);
      expect(trackedEscalation?.status).toBe('initiated');
    });

    test('should update escalation status', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('critical', 80);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-update',
        userContext,
        sessionData
      );

      const updateSuccess = await crisisEscalationWorkflowService.updateEscalationStatus(
        response.escalationId,
        'acknowledged',
        'Crisis counselor has acknowledged the escalation',
        'counselor-456'
      );

      expect(updateSuccess).toBe(true);

      const updatedEscalation = await crisisEscalationWorkflowService.monitorEscalationProgress(
        response.escalationId
      );

      expect(updatedEscalation?.status).toBe('acknowledged');
      expect(updatedEscalation?.responderId).toBe('counselor-456');
      expect(updatedEscalation?.timeline.acknowledged).toBeInstanceOf(Date);
    });

    test('should handle non-existent escalation updates', async () => {
      const updateSuccess = await crisisEscalationWorkflowService.updateEscalationStatus(
        'non-existent-id',
        'resolved',
        'Test update'
      );

      expect(updateSuccess).toBe(false);
    });
  });

  describe('Emergency Contacts', () => {
    
    test('should return emergency contacts for US location', () => {
      const contacts = crisisEscalationWorkflowService.getEmergencyContacts('US', 'en', 'high');

      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0].coverage.geographic).toContain('US');
      expect(contacts[0].coverage.languages).toContain('en');
    });

    test('should return emergency contacts with language preference', () => {
      const contacts = crisisEscalationWorkflowService.getEmergencyContacts('US', 'es', 'critical');

      expect(contacts.length).toBeGreaterThan(0);
      // Should find contacts supporting Spanish or fallback to English
      expect(contacts.some(contact => 
        contact.coverage.languages.includes('es') || contact.coverage.languages.includes('en')
      )).toBe(true);
    });

    test('should sort contacts by effectiveness', () => {
      const contacts = crisisEscalationWorkflowService.getEmergencyContacts('US', 'en', 'emergency');

      if (contacts.length > 1) {
        // First contact should have best combined score (success rate + response time)
        const firstScore = (contacts[0].successRate * 0.7) + ((1 / contacts[0].averageResponseTime) * 0.3);
        const secondScore = (contacts[1].successRate * 0.7) + ((1 / contacts[1].averageResponseTime) * 0.3);
        expect(firstScore).toBeGreaterThanOrEqual(secondScore);
      }
    });

    test('should handle unknown location gracefully', () => {
      const contacts = crisisEscalationWorkflowService.getEmergencyContacts('Unknown', 'en', 'high');

      // Should still return some emergency contacts (global or fallback)
      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
    });
  });

  describe('Escalation Metrics', () => {
    
    test('should return escalation metrics', () => {
      const metrics = crisisEscalationWorkflowService.getEscalationMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalEscalations).toBeDefined();
      expect(metrics.escalationsByTier).toBeDefined();
      expect(metrics.averageResponseTime).toBeDefined();
      expect(metrics.successRate).toBeDefined();
      expect(metrics.userSafetyRate).toBeDefined();
    });

    test('should track escalations by tier', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('medium', 55);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const initialMetrics = crisisEscalationWorkflowService.getEscalationMetrics();
      const initialCounselorCount = initialMetrics.escalationsByTier['crisis-counselor'];

      await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-metrics',
        userContext,
        sessionData
      );

      const updatedMetrics = crisisEscalationWorkflowService.getEscalationMetrics();
      expect(updatedMetrics.escalationsByTier['crisis-counselor']).toBe(initialCounselorCount + 1);
      expect(updatedMetrics.totalEscalations).toBe(initialMetrics.totalEscalations + 1);
    });
  });

  describe('Escalation Tier Selection', () => {
    
    test('should select appropriate tier based on risk level', async () => {
      const testCases = [
        { risk: 25, expectedTier: 'peer-support' },
        { risk: 55, expectedTier: 'crisis-counselor' },
        { risk: 80, expectedTier: 'emergency-team' },
        { risk: 95, expectedTier: 'emergency-services' }
      ];

      for (const testCase of testCases) {
        let severity: 'emergency' | 'critical' | 'high';
        if (testCase.risk >= 90) {
          severity = 'emergency';
        } else if (testCase.risk >= 70) {
          severity = 'critical';
        } else {
          severity = 'high';
        }
        
        const crisisAnalysis = createMockCrisisAnalysis(
          severity,
          testCase.risk
        );
        const userContext = createMockUserContext();
        const sessionData = createMockSessionData();

        const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
          crisisAnalysis,
          `user-tier-${testCase.risk}`,
          userContext,
          sessionData
        );

        expect(response.tier).toBe(testCase.expectedTier);
      }
    });

    test('should escalate to emergency services when explicitly required', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('critical', 70, true); // Emergency services required
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-emergency-required',
        userContext,
        sessionData
      );

      expect(response.tier).toBe('emergency-services');
    });
  });

  describe('Cultural and Accessibility Considerations', () => {
    
    test('should handle cultural context in escalation', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('high', 70);
      const culturalUserContext = {
        ...createMockUserContext(),
        culturalContext: 'hispanic',
        languageCode: 'es'
      };
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-cultural',
        culturalUserContext,
        sessionData
      );

      expect(response).toBeDefined();
      expect(response.tier).toBe('crisis-counselor');
      // Should consider cultural factors in escalation
    });

    test('should handle accessibility needs in escalation', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('high', 65);
      const accessibilityUserContext = {
        ...createMockUserContext(),
        accessibilityNeeds: ['screen-reader', 'hearing-impaired'],
        preferredContactMethod: 'text' as const
      };
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-accessibility',
        accessibilityUserContext,
        sessionData
      );

      expect(response).toBeDefined();
      expect(response.tier).toBe('crisis-counselor');
      // Should consider accessibility needs in contact methods
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    test('should handle missing user context gracefully', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('medium', 45);
      const minimalContext = {
        languageCode: 'en',
        timeZone: 'UTC'
      } as any;
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-minimal-context',
        minimalContext,
        sessionData
      );

      expect(response).toBeDefined();
      expect(response.escalationId).toBeDefined();
    });

    test('should handle invalid escalation requests', async () => {
      const invalidAnalysis = {
        ...createMockCrisisAnalysis('high', 70),
        immediateRisk: -1 // Invalid risk value
      };
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        invalidAnalysis,
        'user-invalid',
        userContext,
        sessionData
      );

      // Should still create a response, potentially with fallback behavior
      expect(response).toBeDefined();
      expect(response.escalationId).toBeDefined();
    });

    test('should handle concurrent escalations for same user', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('critical', 85);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const userId = 'user-concurrent';
      
      // Create two concurrent escalations
      const [response1, response2] = await Promise.all([
        crisisEscalationWorkflowService.initiateCrisisEscalation(
          crisisAnalysis,
          userId,
          userContext,
          sessionData
        ),
        crisisEscalationWorkflowService.initiateCrisisEscalation(
          crisisAnalysis,
          userId,
          userContext,
          sessionData
        )
      ]);

      expect(response1.escalationId).not.toBe(response2.escalationId);
      expect(response1.tier).toBe('emergency-team');
      expect(response2.tier).toBe('emergency-team');
    });
  });

  describe('Response Time Requirements', () => {
    
    test('should meet response time targets for emergency escalations', async () => {
      const startTime = Date.now();
      
      const response = await crisisEscalationWorkflowService.escalateEmergency(
        'user-response-time',
        'immediate-danger',
        { description: 'Test emergency response time' }
      );

      const responseTime = Date.now() - startTime;
      
      expect(response).toBeDefined();
      // Emergency escalations should be very fast (< 1 second in test environment)
      expect(responseTime).toBeLessThan(1000);
    });

    test('should track escalation timeline accurately', async () => {
      const crisisAnalysis = createMockCrisisAnalysis('critical', 85);
      const userContext = createMockUserContext();
      const sessionData = createMockSessionData();

      const beforeInitiation = new Date();
      
      const response = await crisisEscalationWorkflowService.initiateCrisisEscalation(
        crisisAnalysis,
        'user-timeline',
        userContext,
        sessionData
      );

      const afterInitiation = new Date();

      expect(response.timeline.initiated).toBeInstanceOf(Date);
      expect(response.timeline.initiated.getTime()).toBeGreaterThanOrEqual(beforeInitiation.getTime());
      expect(response.timeline.initiated.getTime()).toBeLessThanOrEqual(afterInitiation.getTime());
    });
  });
});
