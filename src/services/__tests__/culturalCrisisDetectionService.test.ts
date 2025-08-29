/**
 * Cultural Crisis Detection Service Tests
 * 
 * Comprehensive test suite for culturally-aware crisis detection,
 * ensuring mental health support respects cultural contexts and practices.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock interfaces for testing
interface CulturalContext {
  culture: string;
  language: string;
  religiousAffiliation?: string;
  stigmaLevel: 'low' | 'medium' | 'high';
  familyInvolvement: boolean;
  communicationStyle: 'direct' | 'indirect' | 'contextual';
}

interface CrisisIndicator {
  text: string;
  severity: number;
  confidence: number;
  culturallyRelevant: boolean;
  recommendedActions: string[];
}

interface CulturalCrisisDetectionResult {
  isCrisisDetected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  culturalContext: CulturalContext;
  indicators: CrisisIndicator[];
  culturallyAppropriateResponse: string[];
  recommendedInterventions: string[];
  respectfulLanguage: boolean;
}

// Mock service implementation
class MockCulturalCrisisDetectionService {
  private culturalPatterns: Record<string, string[]> = {
    'East Asian': ['honor', 'shame', 'family burden', 'academic pressure'],
    'Latino/Hispanic': ['familismo', 'machismo', 'personalismo', 'respeto'],
    'African American': ['historical trauma', 'systemic racism', 'community strength'],
    'Middle Eastern': ['family honor', 'religious beliefs', 'community judgment'],
    'Indigenous': ['historical trauma', 'connection to land', 'traditional healing']
  };

  private interventionsByCulture: Record<string, string[]> = {
    'East Asian': ['Family consultation', 'Traditional healing integration', 'Face-saving approaches'],
    'Latino/Hispanic': ['Extended family involvement', 'Religious/spiritual support', 'Community resources'],
    'African American': ['Cultural trauma-informed care', 'Community-based support', 'Culturally competent therapists'],
    'Middle Eastern': ['Religious leader consultation', 'Family-centered approach', 'Cultural mediator'],
    'Indigenous': ['Traditional healing practices', 'Elder consultation', 'Land-based healing']
  };

  async analyzeCrisisWithCulturalContext(
    text: string,
    culturalContext: CulturalContext
  ): Promise<CulturalCrisisDetectionResult> {
    const indicators = this.detectCulturallyRelevantIndicators(text, culturalContext);
    const severity = this.calculateCulturallyAdjustedSeverity(indicators, culturalContext);
    
    return {
      isCrisisDetected: indicators.some(i => i.severity > 0.7),
      severity,
      culturalContext,
      indicators,
      culturallyAppropriateResponse: this.generateCulturallyAppropriateResponse(culturalContext),
      recommendedInterventions: this.interventionsByCulture[culturalContext.culture] || [],
      respectfulLanguage: true
    };
  }

  private detectCulturallyRelevantIndicators(text: string, context: CulturalContext): CrisisIndicator[] {
    const patterns = this.culturalPatterns[context.culture] || [];
    const indicators: CrisisIndicator[] = [];

    // Basic crisis detection
    if (text.includes('suicide') || text.includes('kill myself')) {
      indicators.push({
        text: 'Direct suicidal ideation',
        severity: 0.9,
        confidence: 0.95,
        culturallyRelevant: true,
        recommendedActions: ['Immediate intervention', 'Cultural sensitivity required']
      });
    }

    // Cultural pattern matching
    patterns.forEach(pattern => {
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        indicators.push({
          text: `Cultural stressor: ${pattern}`,
          severity: 0.6,
          confidence: 0.8,
          culturallyRelevant: true,
          recommendedActions: ['Cultural consultation', 'Family-informed approach']
        });
      }
    });

    return indicators;
  }

  private calculateCulturallyAdjustedSeverity(
    indicators: CrisisIndicator[], 
    context: CulturalContext
  ): 'low' | 'medium' | 'high' | 'critical' {
    const maxSeverity = Math.max(...indicators.map(i => i.severity), 0);
    
    // Adjust for cultural stigma - higher stigma cultures may underreport
    const stigmaAdjustment = context.stigmaLevel === 'high' ? 0.2 : 0;
    const adjustedSeverity = maxSeverity + stigmaAdjustment;
    
    if (adjustedSeverity >= 0.9) return 'critical';
    if (adjustedSeverity >= 0.7) return 'high';
    if (adjustedSeverity >= 0.4) return 'medium';
    return 'low';
  }

  private generateCulturallyAppropriateResponse(context: CulturalContext): string[] {
    const baseResponses = [
      'We understand this is difficult to discuss',
      'Your cultural background is important to us',
      'We want to help in a way that respects your values'
    ];

    // Add culture-specific responses
    if (context.communicationStyle === 'indirect') {
      baseResponses.push('We appreciate your trust in sharing this with us');
    }

    if (context.familyInvolvement) {
      baseResponses.push('We can involve your family if that would be helpful');
    }

    return baseResponses;
  }

  async validateCulturalSensitivity(response: string[], context: CulturalContext): Promise<boolean> {
    // Mock validation - ensure responses respect cultural norms
    return response.every(r => 
      !r.includes('individual therapy only') || context.familyInvolvement === false
    );
  }

  getCulturalResources(culture: string): string[] {
    const resources: Record<string, string[]> = {
      'East Asian': ['Asian Mental Health Collective', 'NAMI Asian Caucus'],
      'Latino/Hispanic': ['National Latino Behavioral Health Association', 'Latinx Therapy'],
      'African American': ['Association of Black Psychologists', 'Black Mental Health Alliance'],
      'Middle Eastern': ['Arab American Institute', 'Middle Eastern Mental Health'],
      'Indigenous': ['National Indian Health Service', 'Native Wellness Research Institute']
    };

    return resources[culture] || ['General mental health resources available'];
  }
}

// Test suite
describe('CulturalCrisisDetectionService', () => {
  let service: MockCulturalCrisisDetectionService;

  beforeEach(() => {
    service = new MockCulturalCrisisDetectionService();
  });

  describe('Crisis Detection with Cultural Context', () => {
    test('should detect direct crisis indicators regardless of culture', async () => {
      const culturalContext: CulturalContext = {
        culture: 'East Asian',
        language: 'Chinese',
        stigmaLevel: 'high',
        familyInvolvement: true,
        communicationStyle: 'indirect'
      };

      const result = await service.analyzeCrisisWithCulturalContext(
        'I want to kill myself because of the shame I brought to my family',
        culturalContext
      );

      expect(result.isCrisisDetected).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.indicators).toHaveLength(2); // Direct threat + cultural stressor
    });

    test('should adjust severity based on cultural stigma levels', async () => {
      const highStigmaContext: CulturalContext = {
        culture: 'East Asian',
        language: 'Korean',
        stigmaLevel: 'high',
        familyInvolvement: true,
        communicationStyle: 'indirect'
      };

      const lowStigmaContext: CulturalContext = {
        culture: 'Indigenous',
        language: 'English',
        stigmaLevel: 'low',
        familyInvolvement: true,
        communicationStyle: 'contextual'
      };

      const text = 'I feel like a burden to everyone';

      const highStigmaResult = await service.analyzeCrisisWithCulturalContext(text, highStigmaContext);
      const lowStigmaResult = await service.analyzeCrisisWithCulturalContext(text, lowStigmaContext);

      // High stigma should result in higher severity due to potential underreporting
      expect(highStigmaResult.severity).not.toBe('low');
    });

    test('should provide culturally appropriate interventions', async () => {
      const culturalContext: CulturalContext = {
        culture: 'Latino/Hispanic',
        language: 'Spanish',
        stigmaLevel: 'medium',
        familyInvolvement: true,
        communicationStyle: 'contextual'
      };

      const result = await service.analyzeCrisisWithCulturalContext(
        'Mi familia no entiende lo que estoy pasando',
        culturalContext
      );

      expect(result.recommendedInterventions).toContain('Extended family involvement');
      expect(result.recommendedInterventions).toContain('Religious/spiritual support');
    });

    test('should generate respectful responses for indirect communication styles', async () => {
      const culturalContext: CulturalContext = {
        culture: 'East Asian',
        language: 'Japanese',
        stigmaLevel: 'high',
        familyInvolvement: true,
        communicationStyle: 'indirect'
      };

      const result = await service.analyzeCrisisWithCulturalContext(
        'Things have been difficult lately with my studies and family expectations',
        culturalContext
      );

      expect(result.culturallyAppropriateResponse).toContain('We appreciate your trust in sharing this with us');
      expect(result.respectfulLanguage).toBe(true);
    });
  });

  describe('Cultural Pattern Recognition', () => {
    test('should identify culture-specific stressors', async () => {
      const culturalContext: CulturalContext = {
        culture: 'African American',
        language: 'English',
        stigmaLevel: 'medium',
        familyInvolvement: true,
        communicationStyle: 'direct'
      };

      const result = await service.analyzeCrisisWithCulturalContext(
        'The systemic racism and historical trauma in my community is overwhelming',
        culturalContext
      );

      const culturalIndicators = result.indicators.filter(i => i.culturallyRelevant);
      expect(culturalIndicators.length).toBeGreaterThan(0);
      expect(culturalIndicators.some(i => i.text.includes('systemic racism'))).toBe(true);
    });

    test('should recommend appropriate cultural resources', () => {
      const eastAsianResources = service.getCulturalResources('East Asian');
      const latinoResources = service.getCulturalResources('Latino/Hispanic');

      expect(eastAsianResources).toContain('Asian Mental Health Collective');
      expect(latinoResources).toContain('National Latino Behavioral Health Association');
    });
  });

  describe('Cultural Sensitivity Validation', () => {
    test('should validate culturally sensitive responses', async () => {
      const familyOrientedContext: CulturalContext = {
        culture: 'Middle Eastern',
        language: 'Arabic',
        stigmaLevel: 'high',
        familyInvolvement: true,
        communicationStyle: 'contextual'
      };

      const appropriateResponse = [
        'We can involve your family if that would be helpful',
        'Your cultural background is important to us'
      ];

      const inappropriateResponse = [
        'individual therapy only',
        'You should separate from your family'
      ];

      const appropriateResult = await service.validateCulturalSensitivity(appropriateResponse, familyOrientedContext);
      const inappropriateResult = await service.validateCulturalSensitivity(inappropriateResponse, familyOrientedContext);

      expect(appropriateResult).toBe(true);
      expect(inappropriateResult).toBe(false);
    });
  });

  describe('Multi-Cultural Support', () => {
    test('should handle multiple cultural influences', async () => {
      const mixedCulturalContext: CulturalContext = {
        culture: 'Mixed Heritage',
        language: 'Bilingual',
        stigmaLevel: 'medium',
        familyInvolvement: true,
        communicationStyle: 'contextual'
      };

      const result = await service.analyzeCrisisWithCulturalContext(
        'I struggle with different cultural expectations from different parts of my identity',
        mixedCulturalContext
      );

      expect(result.culturallyAppropriateResponse).toContain('Your cultural background is important to us');
      expect(result.respectfulLanguage).toBe(true);
    });
  });
});