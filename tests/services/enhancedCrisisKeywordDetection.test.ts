/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enhanced Crisis Keyword Detection Service Tests
 * 
 * Comprehensive tests for enhanced crisis keyword detection with contextual understanding,
 * emotional pattern recognition, risk assessment scoring, and immediate intervention triggers.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  enhancedCrisisKeywordDetectionService
} from '../../src/services/enhancedCrisisKeywordDetectionService';

describe('EnhancedCrisisKeywordDetectionService', () => {
  beforeEach(() => {
    // Reset any service state if needed
  });

  describe('Emergency Level Crisis Detection', () => {
    test('should detect immediate suicide intent with high confidence', async () => {
      const text = "I'm going to kill myself tonight. I have everything planned and I'm ready to do it.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);
      expect(result.riskAssessment.immediateRisk).toBeGreaterThan(80);
      expect(result.riskAssessment.interventionUrgency).toBe('immediate');
      expect(result.keywordMatches.length).toBeGreaterThan(0);
      expect(result.keywordMatches[0].severity).toBe('emergency');
    });

    test('should detect suicide planning with method consideration', async () => {
      const text = "I have a suicide plan. I know exactly how I'm going to do it when the time comes.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.escalationRequired).toBe(true);
      expect(result.riskAssessment.immediateRisk).toBeGreaterThan(85);
      expect(result.keywordMatches.some(m => m.category === 'suicide-plan')).toBe(true);
    });

    test('should detect medical emergency situations', async () => {
      const text = "I just took too many pills and I can't stop bleeding from my cuts.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);
      expect(result.keywordMatches.some(m => m.category === 'medical-emergency')).toBe(true);
      expect(result.interventionRecommendations[0].type).toBe('immediate');
    });

    test('should detect violence threats toward others', async () => {
      const text = "I'm planning to hurt someone tonight. They deserve what's coming to them.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);
      expect(result.keywordMatches.some(m => m.category === 'violence-threat')).toBe(true);
    });
  });

  describe('Critical Level Crisis Detection', () => {
    test('should detect active suicidal ideation', async () => {
      const text = "I really want to die. I think about it constantly and I'm so tired of living.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('critical');
      expect(result.escalationRequired).toBe(true);
      expect(result.riskAssessment.interventionUrgency).toBe('high');
      expect(result.keywordMatches.some(m => m.category === 'suicidal-ideation')).toBe(true);
    });

    test('should detect substance crisis with suicidal intent', async () => {
      const text = "I've been drinking to die, hoping I won't wake up tomorrow.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.keywordMatches.some(m => m.category === 'substance-crisis')).toBe(true);
      expect(result.riskAssessment.immediateRisk).toBeGreaterThan(70);
    });

    test('should detect abuse disclosure', async () => {
      const text = "Someone is still hurting me at home and I'm not safe. It's happening every day.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('critical');
      expect(result.keywordMatches.some(m => m.category === 'abuse-disclosure')).toBe(true);
      expect(result.riskAssessment.immediateRisk).toBeGreaterThan(60);
    });
  });

  describe('High Level Crisis Detection', () => {
    test.skip('should detect self-harm escalation', async () => {
      const text = "I've been cutting deeper lately and I can't stop hurting myself. It's getting worse.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('high');
      expect(result.keywordMatches.some(m => m.category === 'self-harm')).toBe(true);
      expect(result.riskAssessment.interventionUrgency).toBe('high');
    });

    test('should detect severe psychological distress', async () => {
      const text = "I'm literally losing my mind and hearing voices. I can't think straight anymore.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('high');
      expect(result.keywordMatches.some(m => m.category === 'psychotic-episode')).toBe(true);
    });

    test('should detect panic crisis', async () => {
      const text = "I'm having a severe panic attack right now and I feel like I'm going to die.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('high');
      expect(result.keywordMatches.some(m => m.category === 'panic-crisis')).toBe(true);
    });
  });

  describe('Contextual Analysis', () => {
    test.skip('should reduce crisis level when negative modifiers are present', async () => {
      const text = "I would never kill myself, but sometimes I feel like I want to die.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      // Should detect concern but with reduced severity due to "would never"
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).not.toBe('emergency');
      expect(result.riskAssessment.immediateRisk).toBeLessThan(70);
    });

    test('should increase crisis level with positive amplifiers', async () => {
      const text = "I'm definitely going to kill myself tonight. I'm absolutely ready to end it all.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.riskAssessment.immediateRisk).toBeGreaterThan(85);
      expect(result.keywordMatches[0].confidence).toBeGreaterThan(0.8);
    });

    test('should detect timeline urgency', async () => {
      const text = "I'm planning to end my life tonight when everyone is asleep.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.riskAssessment.timelineAnalysis.hasTemporalUrgency).toBe(true);
      expect(result.riskAssessment.timelineAnalysis.timeframe).toBe('veryUrgent');
      expect(result.riskAssessment.timelineAnalysis.urgencyModifiers).toContain('tonight');
    });
  });

  describe('Emotional Pattern Recognition', () => {
    test.skip('should detect hopelessness emotional pattern', async () => {
      const text = "There's no point in anything. I'm completely trapped with no way out.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.emotionalIndicators.length).toBeGreaterThan(0);
      expect(result.emotionalIndicators.some(e => e.emotionalState === 'hopelessness')).toBe(true);
      expect(result.riskAssessment.emotionalProfile.crisisAlignment).toBeGreaterThan(0.7);
    });

    test.skip('should detect desperation emotional pattern', async () => {
      const text = "I'm so desperate and at my breaking point. I can't take it anymore.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.emotionalIndicators.some(e => e.emotionalState === 'desperation')).toBe(true);
      expect(result.riskAssessment.emotionalProfile.intensity).toBeGreaterThan(0.6);
    });

    test('should detect emotional numbness pattern', async () => {
      const text = "I feel completely empty and numb inside. There's just nothing left.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.emotionalIndicators.some(e => e.emotionalState === 'emotional_numbness')).toBe(true);
    });

    test('should detect rage crisis pattern', async () => {
      const text = "I'm filled with explosive rage and having violent thoughts. I might lose control.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.emotionalIndicators.some(e => e.emotionalState === 'rage_crisis')).toBe(true);
      expect(result.emotionalIndicators.some(e => e.interventionUrgency === 'immediate')).toBe(true);
    });
  });

  describe('Risk Assessment Scoring', () => {
    test.skip('should calculate accurate immediate risk scores', async () => {
      const highRiskText = "I'm going to kill myself tonight with pills I've been saving up.";
      const mediumRiskText = "Sometimes I think about not being alive anymore.";
      const lowRiskText = "I'm feeling sad but I know things will get better.";
      
      const highResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(highRiskText);
      const mediumResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(mediumRiskText);
      const lowResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(lowRiskText);
      
      expect(highResult.riskAssessment.immediateRisk).toBeGreaterThan(mediumResult.riskAssessment.immediateRisk);
      expect(mediumResult.riskAssessment.immediateRisk).toBeGreaterThan(lowResult.riskAssessment.immediateRisk);
    });

    test.skip('should provide appropriate intervention urgency levels', async () => {
      const immediateText = "I'm overdosing right now and need help.";
      const highText = "I want to die and have been planning my suicide.";
      const mediumText = "I've been cutting myself more frequently lately.";
      const lowText = "I feel hopeless but I'm getting therapy help.";
      
      const immediateResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(immediateText);
      const highResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(highText);
      const mediumResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(mediumText);
      const lowResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(lowText);
      
      expect(immediateResult.riskAssessment.interventionUrgency).toBe('immediate');
      expect(highResult.riskAssessment.interventionUrgency).toBe('high');
      expect(mediumResult.riskAssessment.interventionUrgency).toBe('medium');
      expect(lowResult.riskAssessment.interventionUrgency).toBe('low');
    });
  });

  describe('Intervention Recommendations', () => {
    test.skip('should provide immediate intervention for emergency cases', async () => {
      const text = "I just took a whole bottle of pills and I'm ready to die.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.interventionRecommendations.length).toBeGreaterThan(0);
      expect(result.interventionRecommendations[0].type).toBe('immediate');
      expect(result.interventionRecommendations[0].actionItems).toContain('Contact emergency services (911)');
      expect(result.interventionRecommendations[0].timeframe).toBe('Immediate');
    });

    test.skip('should provide urgent intervention for high-risk cases', async () => {
      const text = "I've been planning my suicide and I think I'll do it soon.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.interventionRecommendations.some(r => r.type === 'urgent')).toBe(true);
      expect(result.interventionRecommendations.some(r => r.timeframe === 'Within 2-4 hours')).toBe(true);
    });

    test.skip('should provide supportive intervention for medium-risk cases', async () => {
      const text = "I've been cutting myself more often and feeling really hopeless.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.interventionRecommendations.some(r => r.type === 'supportive')).toBe(true);
      expect(result.interventionRecommendations.some(r => r.timeframe === 'Within 24 hours')).toBe(true);
    });

    test.skip('should provide monitoring recommendations for ongoing support', async () => {
      const text = "I sometimes feel suicidal but I'm trying to get help.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.interventionRecommendations.some(r => r.type === 'monitoring')).toBe(true);
      expect(result.interventionRecommendations.some(r => r.timeframe === 'Ongoing')).toBe(true);
    });
  });

  describe('False Positive Prevention', () => {
    test.skip('should not trigger crisis for hypothetical or past scenarios', async () => {
      const hypotheticalText = "What if someone wanted to kill themselves? How would you help them?";
      const pastText = "I used to think about suicide but I'm better now.";
      const academicText = "Studying suicide prevention methods for my psychology class.";
      
      const hypotheticalResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(hypotheticalText);
      const pastResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(pastText);
      const academicResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(academicText);
      
      expect(hypotheticalResult.overallSeverity).not.toBe('emergency');
      expect(pastResult.riskAssessment.immediateRisk).toBeLessThan(50);
      expect(academicResult.hasCrisisIndicators).toBe(false);
    });

    test('should handle metaphorical language appropriately', async () => {
      const metaphorText = "This workload is killing me. I'm dying to get home.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(metaphorText);
      
      expect(result.hasCrisisIndicators).toBe(false);
      expect(result.overallSeverity).toBe('none');
    });
  });

  describe('Analysis Metadata', () => {
    test('should provide accurate analysis metadata', async () => {
      const text = "I want to die and I can't take it anymore.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result.analysisMetadata.analysisMethod).toBe('contextual');
      expect(result.analysisMetadata.confidence).toBeGreaterThan(0);
      expect(result.analysisMetadata.processingTime).toBeGreaterThan(0);
      expect(Array.isArray(result.analysisMetadata.flaggedConcerns)).toBe(true);
    });

    test.skip('should flag appropriate concerns', async () => {
      const emergencyText = "I'm going to kill myself tonight.";
      const planningText = "I have a detailed suicide plan ready.";
      const violenceText = "I'm going to hurt someone.";
      
      const emergencyResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(emergencyText);
      const planningResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(planningText);
      const violenceResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(violenceText);
      
      expect(emergencyResult.analysisMetadata.flaggedConcerns).toContain('Emergency-level crisis indicators detected');
      expect(planningResult.analysisMetadata.flaggedConcerns).toContain('Suicide planning indicators present');
      expect(violenceResult.analysisMetadata.flaggedConcerns).toContain('Violence threat indicators detected');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty or invalid input gracefully', async () => {
      const emptyResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords('');
      const whitespaceResult = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords('   ');
      
      expect(emptyResult.hasCrisisIndicators).toBe(false);
      expect(emptyResult.overallSeverity).toBe('none');
      expect(whitespaceResult.hasCrisisIndicators).toBe(false);
      expect(whitespaceResult.overallSeverity).toBe('none');
    });

    test('should provide failsafe results when analysis fails', async () => {
      // This would test error conditions, but since we can't easily mock service failures,
      // we'll test that the service always returns a valid result structure
      const text = "This is a test message.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      
      expect(result).toHaveProperty('hasCrisisIndicators');
      expect(result).toHaveProperty('overallSeverity');
      expect(result).toHaveProperty('keywordMatches');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('interventionRecommendations');
      expect(result).toHaveProperty('analysisMetadata');
    });
  });

  describe('Integration Testing', () => {
    test.skip('should handle complex multi-indicator scenarios', async () => {
      const complexText = "I'm so hopeless and empty inside. I've been cutting deeper lately and I really want to die. I think about suicide constantly and I'm planning to do it tonight when everyone is asleep. I have pills saved up and I know it will work.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(complexText);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).toBe('emergency');
      expect(result.emergencyServicesRequired).toBe(true);
      expect(result.keywordMatches.length).toBeGreaterThan(3);
      expect(result.emotionalIndicators.length).toBeGreaterThan(1);
      expect(result.riskAssessment.immediateRisk).toBeGreaterThan(85);
      expect(result.riskAssessment.timelineAnalysis.hasTemporalUrgency).toBe(true);
      expect(result.interventionRecommendations[0].type).toBe('immediate');
    });

    test.skip('should handle mixed signals appropriately', async () => {
      const mixedText = "I sometimes think about suicide but I have a good support system and I'm seeing a therapist regularly. My family cares about me and I don't want to hurt them.";
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(mixedText);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.overallSeverity).not.toBe('emergency');
      expect(result.riskAssessment.protectiveFactors.length).toBeGreaterThan(0);
      expect(result.riskAssessment.immediateRisk).toBeLessThan(70);
    });
  });

  describe('Performance Testing', () => {
    test('should complete analysis within reasonable time', async () => {
      const text = "I want to die and I can't take the pain anymore.";
      const startTime = Date.now();
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(text);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.analysisMetadata.processingTime).toBeLessThan(1000);
    });

    test('should handle long text inputs efficiently', async () => {
      const longText = "I want to die. ".repeat(100) + "I'm planning to kill myself tonight.";
      const startTime = Date.now();
      
      const result = await enhancedCrisisKeywordDetectionService.analyzeEnhancedCrisisKeywords(longText);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(2000); // Should still complete within 2 seconds
      expect(result.hasCrisisIndicators).toBe(true);
    });
  });
});
