/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Crisis Detection and Escalation Integration Tests
 * 
 * Comprehensive testing for the integration between crisis detection and escalation workflow
 * to ensure severe cases are properly escalated to appropriate crisis intervention teams.
 */

import { enhancedCrisisDetectionIntegrationService } from '../../src/services/enhancedCrisisDetectionIntegrationService';

describe('Crisis Detection and Escalation Integration', () => {
  
  describe('Automatic Escalation Triggering', () => {
    it('should trigger emergency services escalation for suicide attempt', async () => {
      const text = "I'm going to kill myself tonight. I have the pills ready and I know it will work.";
      const userId = 'test-user-emergency';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId,
        {
          culturalContext: 'western',
          languageCode: 'en',
          includeCulturalAnalysis: true
        }
      );

      // Should detect crisis indicators
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toEqual(expect.stringMatching(/emergency|critical/));
      expect(result.immediateRisk).toBeGreaterThan(80);
      expect(result.emergencyServicesRequired).toBe(true);

      // Should have escalation workflow data
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.recommendedTier).toBe('emergency-services');
      expect(result.escalationWorkflow?.triggerReason).toEqual(expect.stringMatching(/suicide-attempt|immediate-danger/));
      expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
      expect(result.escalationWorkflow?.escalationId).toBeDefined();
    });

    it.skip('should trigger crisis counselor escalation for high-risk ideation', async () => {
      const text = "I don't want to live anymore. Everything feels hopeless and I can't see any way out.";
      const userId = 'test-user-high-risk';
      
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
      expect(result.overallSeverity).toEqual(expect.stringMatching(/high|critical/));
      expect(result.immediateRisk).toBeGreaterThan(60);
      expect(result.escalationRequired).toBe(true);

      // Should have escalation workflow data
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.recommendedTier).toEqual(expect.stringMatching(/crisis-counselor|emergency-team/));
      expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
    });

    it('should trigger medical emergency escalation for overdose situation', async () => {
      const text = "I just took too many pills. I can't stop shaking and my heart is racing. I think I overdosed.";
      const userId = 'test-user-medical';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );

      // Should detect medical emergency
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);

      // Should have medical emergency escalation
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.recommendedTier).toBe('emergency-services');
      expect(result.escalationWorkflow?.triggerReason).toBe('medical-emergency');
      expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
    });

    it.skip('should provide escalation recommendations without user ID', async () => {
      const text = "I want to hurt someone at my school. I have a plan and I'm going to do it tomorrow.";
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        undefined, // No user ID provided
        {
          culturalContext: 'western',
          languageCode: 'en'
        }
      );

      // Should detect crisis and violence threat
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);

      // Should have escalation recommendations but not initiate escalation
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.recommendedTier).toBe('emergency-services');
      expect(result.escalationWorkflow?.triggerReason).toBe('violence-threat');
      expect(result.escalationWorkflow?.escalationInitiated).toBe(false);
      expect(result.escalationWorkflow?.escalationId).toBeUndefined();
    });
  });

  describe('Escalation Tier Selection', () => {
    it('should recommend peer support for moderate anxiety', async () => {
      const text = "I'm feeling really anxious lately and it's affecting my work. I'm worried about everything.";
      const userId = 'test-user-moderate';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );

      // Should detect some concern but not high risk
      expect(result.immediateRisk).toBeLessThan(70);
      
      // Should not trigger automatic escalation for low-moderate risk
      expect(result.escalationWorkflow).toBeUndefined();
    });

    it.skip('should recommend crisis counselor for severe distress', async () => {
      const text = "I can't take this anymore. I'm having panic attacks every day and I feel like I'm losing my mind.";
      const userId = 'test-user-severe';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );

      // Should detect high risk requiring professional help
      expect(result.immediateRisk).toBeGreaterThan(60);
      expect(result.escalationRequired).toBe(true);

      // Should have appropriate escalation tier
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.recommendedTier).toEqual(expect.stringMatching(/crisis-counselor|emergency-team/));
    });
  });

  describe('Cultural Context Integration', () => {
    it.skip('should handle cultural considerations in escalation', async () => {
      const text = "Life has no meaning anymore. My family would be better off without me.";
      const userId = 'test-user-cultural';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId,
        {
          culturalContext: 'eastern_collectivist',
          languageCode: 'en'
        }
      );

      // Should detect crisis with cultural context
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.culturalAnalysis).toBeDefined();
      expect(result.escalationRequired).toBe(true);

      // Should include cultural context in escalation
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle escalation errors gracefully', async () => {
      // Test with invalid data that might cause escalation to fail
      const text = "I want to die";
      const userId = 'invalid-user-test';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );

      // Should still provide crisis analysis even if escalation fails
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.escalationRequired).toBe(true);

      // Should have escalation workflow data even if initiation fails
      expect(result.escalationWorkflow).toBeDefined();
      expect(result.escalationWorkflow?.recommendedTier).toBeDefined();
      expect(result.escalationWorkflow?.triggerReason).toBeDefined();
      
      // If escalation fails, should indicate failure
      if (!result.escalationWorkflow?.escalationInitiated) {
        expect(result.escalationWorkflow?.escalationError).toBeDefined();
      }
    });
  });

  describe('Multi-Method Integration', () => {
    it.skip('should combine keyword, AI, and cultural analysis for escalation decisions', async () => {
      const text = "Nobody understands my pain. I'm tired of fighting this battle every day. Maybe it's time to give up.";
      const userId = 'test-user-integrated';
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId,
        {
          culturalContext: 'western',
          languageCode: 'en',
          includeCulturalAnalysis: true,
          prioritizeMethod: 'balanced'
        }
      );

      // Should have analysis from all methods
      expect(result.keywordAnalysis).toBeDefined();
      expect(result.aiAnalysis).toBeDefined();
      expect(result.culturalAnalysis).toBeDefined();

      // Should make escalation decision based on combined analysis
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.analysisMetadata.methodsUsed).toContain('keyword');
      expect(result.analysisMetadata.methodsUsed).toContain('ai');
      expect(result.analysisMetadata.methodsUsed).toContain('cultural');

      // Escalation decision should be influenced by all methods
      if (result.escalationRequired) {
        expect(result.escalationWorkflow).toBeDefined();
        expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
      }
    });
  });

  describe('Response Time and Performance', () => {
    it.skip('should process and escalate severe cases quickly', async () => {
      const text = "Emergency! I'm about to jump off this bridge. This is it.";
      const userId = 'test-user-emergency-timing';
      
      const startTime = Date.now();
      
      const result = await enhancedCrisisDetectionIntegrationService.performComprehensiveCrisisAnalysis(
        text,
        userId
      );
      
      const processingTime = Date.now() - startTime;

      // Should process emergency cases quickly (under 5 seconds)
      expect(processingTime).toBeLessThan(5000);

      // Should properly escalate emergency case
      expect(result.overallSeverity).toBe('emergency');
      expect(result.escalationWorkflow?.recommendedTier).toBe('emergency-services');
      expect(result.escalationWorkflow?.escalationInitiated).toBe(true);
    });
  });
});
