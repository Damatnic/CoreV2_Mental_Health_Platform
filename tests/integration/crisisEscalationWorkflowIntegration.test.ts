/**
 * Test for Crisis Escalation Workflow Integration
 */

import { crisisDetectionIntegrationService } from '../../src/services/crisisDetectionIntegrationService';
import { aiServiceManager } from '../../src/services/optimizedAIService';

// Mock the crisis escalation service
jest.mock('../../src/services/crisisEscalationWorkflowService', () => ({
  crisisEscalationWorkflowService: {
    initiateCrisisEscalation: jest.fn().mockResolvedValue({
      escalationId: 'test-escalation-123',
      tier: 'crisis-counselor',
      status: 'initiated',
      estimatedResponseTime: 300000, // 5 minutes
      contactInfo: {
        method: 'chat',
        endpoint: 'https://crisis-chat.example.com'
      }
    })
  }
}));

describe('Crisis Escalation Workflow Integration', () => {
  beforeEach(() => {
    // Reset services before each test
    (aiServiceManager as any).services = {};
    jest.clearAllMocks();
  });

  it('should trigger escalation workflow for severe crisis', async () => {
    const result = await crisisDetectionIntegrationService.analyzeTextForCrisis(
      'I want to kill myself tonight',
      {
        userId: 'test-user-123',
        conversationId: 'chat-session-456',
        sessionData: {
          messagesSent: 3,
          sessionDuration: 180000, // 3 minutes
          previousEscalations: 0,
          riskTrend: 'increasing'
        },
        userContext: {
          languageCode: 'en',
          preferredContactMethod: 'chat',
          timeZone: 'America/New_York'
        }
      }
    );

    // Should detect crisis
    expect(result.isCrisis).toBe(true);
    expect(['critical', 'emergency']).toContain(result.severity);
    expect(result.escalationRequired).toBe(true);
    
    // Should have escalation response
    expect(result.escalationResponse).toBeDefined();
    expect(result.escalationResponse.escalationId).toBe('test-escalation-123');
    expect(result.escalationResponse.tier).toBe('crisis-counselor');
  });

  it('should not trigger escalation for non-crisis content', async () => {
    const result = await crisisDetectionIntegrationService.analyzeTextForCrisis(
      'I had a good day today, feeling much better',
      {
        userId: 'test-user-456',
        conversationId: 'chat-session-789'
      }
    );

    expect(result.isCrisis).toBe(false);
    expect(result.escalationRequired).toBe(false);
    expect(result.escalationResponse).toBeFalsy();
  });

  it('should analyze conversation and trigger escalation when needed', async () => {
    const messages = [
      'Hi, I need someone to talk to',
      'I have been feeling really depressed lately',
      'I don\'t think I can handle this anymore',
      'I want to end my life'
    ];

    const results = await crisisDetectionIntegrationService.analyzeConversationForCrisis(
      messages,
      {
        userId: 'test-user-789',
        conversationId: 'conversation-123',
        userContext: {
          languageCode: 'en',
          preferredContactMethod: 'phone'
        }
      }
    );

    // Should have analyzed all messages until crisis escalation
    expect(results.length).toBeGreaterThan(0);
    
    // Last message should trigger crisis detection
    const lastResult = results[results.length - 1];
    expect(lastResult.isCrisis).toBe(true);
    expect(lastResult.escalationRequired).toBe(true);
    expect(lastResult.escalationResponse).toBeDefined();
  });

  it.skip('should check user crisis state across multiple messages', async () => {
    const recentMessages = [
      'Everything feels hopeless',
      'I can\'t see a way out',
      'Maybe everyone would be better off without me'
    ];

    const crisisState = await crisisDetectionIntegrationService.checkUserCrisisState(
      'user-crisis-test',
      recentMessages,
      {
        userContext: {
          languageCode: 'en',
          culturalContext: 'western',
          preferredContactMethod: 'text'
        }
      }
    );

    expect(crisisState.isInCrisis).toBe(true);
    expect(['high', 'critical']).toContain(crisisState.highestSeverity);
    expect(crisisState.escalationTriggered).toBe(true);
    expect(crisisState.recommendedActions.length).toBeGreaterThan(0);
  });

  it.skip('should handle escalation service failures gracefully', async () => {
    // Mock escalation service to fail
    const { crisisEscalationWorkflowService } = await import('../../src/services/crisisEscalationWorkflowService');
    (crisisEscalationWorkflowService.initiateCrisisEscalation as jest.Mock)
      .mockRejectedValueOnce(new Error('Escalation service unavailable'));

    const result = await crisisDetectionIntegrationService.analyzeTextForCrisis(
      'I want to hurt myself',
      {
        userId: 'test-user-error',
        conversationId: 'error-test-session'
      }
    );

    // Should still detect crisis even if escalation fails
    expect(result.isCrisis).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.escalationResponse).toBeUndefined(); // Escalation failed
    expect(result.enhanced).toBe(true); // Enhanced detection still worked
  });

  it.skip('should provide appropriate user context to escalation service', async () => {
    const { crisisEscalationWorkflowService } = await import('../../src/services/crisisEscalationWorkflowService');
    
    await crisisDetectionIntegrationService.analyzeTextForCrisis(
      'I can\'t take it anymore',
      {
        userId: 'context-test-user',
        conversationId: 'context-test-session',
        sessionData: {
          messagesSent: 5,
          sessionDuration: 300000,
          previousEscalations: 1,
          riskTrend: 'increasing'
        },
        userContext: {
          languageCode: 'es',
          culturalContext: 'hispanic',
          accessibilityNeeds: ['screen-reader'],
          preferredContactMethod: 'phone',
          timeZone: 'America/Los_Angeles',
          location: {
            country: 'US',
            region: 'CA',
            hasGeolocation: true
          }
        }
      }
    );

    // Verify escalation service was called with correct parameters
    expect(crisisEscalationWorkflowService.initiateCrisisEscalation).toHaveBeenCalledWith(
      expect.any(Object), // crisis analysis
      'context-test-user', // user ID
      expect.objectContaining({
        languageCode: 'es',
        culturalContext: 'hispanic',
        accessibilityNeeds: ['screen-reader'],
        preferredContactMethod: 'phone',
        timeZone: 'America/Los_Angeles',
        location: expect.objectContaining({
          country: 'US',
          region: 'CA',
          hasGeolocation: true
        })
      }),
      expect.objectContaining({
        conversationId: 'context-test-session',
        messagesSent: 5,
        sessionDuration: 300000,
        previousEscalations: 1,
        riskTrend: 'increasing'
      })
    );
  });
});
