/**
 * Crisis Detection Test Suite
 * 
 * Comprehensive tests for crisis keyword detection, severity assessment,
 * and resource matching functionality.
 * 
 * @fileoverview Tests for crisis detection utility functions
 * @version 2.0.0
 */

import {
  detectCrisisKeywords,
  detectCrisisPatterns,
  calculateCrisisSeverity,
  analyzeCrisisText,
  generateCrisisRecommendations,
  validateCrisisConfig,
  CRISIS_KEYWORDS,
  DEFAULT_CRISIS_CONFIG,
  EMERGENCY_CONTACTS,
  CrisisLevel,
  CrisisIndicator,
  CrisisDetectionResult
} from './crisisDetection';

describe('Crisis Detection Utilities', () => {
  describe('detectCrisisKeywords', () => {
    describe('suicide keyword detection', () => {
      it('should detect direct suicide keywords', () => {
        const suicideTexts = [
          'I want to kill myself',
          'thinking about suicide',
          'my life is not worth living',
          'I would be better off dead',
          'I want to die',
          'I wish I was dead'
        ];

        suicideTexts.forEach(text => {
          const indicators = detectCrisisKeywords(text);
          expect(indicators.length).toBeGreaterThan(0);
          expect(indicators[0].type).toBe('keyword');
          expect(indicators[0].severity).toBeGreaterThanOrEqual(6);
        });
      });

      it('should detect variations and case insensitive matches', () => {
        const variations = [
          'KILL MYSELF',
          'Kill Myself',
          'end my life',
          'END MY LIFE'
        ];

        variations.forEach(text => {
          const indicators = detectCrisisKeywords(text);
          expect(indicators.length).toBeGreaterThan(0);
        });
      });
    });

    describe('self-harm keyword detection', () => {
      it('should detect self-harm keywords', () => {
        const selfHarmTexts = [
          'I want to hurt myself',
          'thinking about self harm',
          'I have been cutting',
          'I want to harm myself',
          'I keep punishing myself'
        ];

        selfHarmTexts.forEach(text => {
          const indicators = detectCrisisKeywords(text);
          expect(indicators.length).toBeGreaterThan(0);
          expect(indicators[0].type).toBe('keyword');
          expect(indicators[0].severity).toBeGreaterThanOrEqual(4);
        });
      });
    });

    describe('hopelessness keyword detection', () => {
      it('should detect hopelessness expressions', () => {
        const hopelessTexts = [
          'no hope left',
          'feeling hopeless',
          'everything is pointless',
          'nothing matters anymore',
          'I give up',
          'no future for me'
        ];

        hopelessTexts.forEach(text => {
          const indicators = detectCrisisKeywords(text);
          expect(indicators.length).toBeGreaterThan(0);
          expect(indicators[0].type).toBe('keyword');
        });
      });
    });

    describe('isolation keyword detection', () => {
      it('should detect isolation and worthlessness', () => {
        const isolationTexts = [
          'I feel so alone',
          'nobody cares about me',
          'I have no friends',
          'I feel worthless',
          'I am a burden'
        ];

        isolationTexts.forEach(text => {
          const indicators = detectCrisisKeywords(text);
          expect(indicators.length).toBeGreaterThan(0);
          expect(indicators[0].type).toBe('keyword');
        });
      });
    });

    describe('mixed severity detection', () => {
      it('should detect multiple keywords in single text', () => {
        const mixedText = 'I feel hopeless and want to hurt myself because nobody cares';
        const indicators = detectCrisisKeywords(mixedText);
        
        expect(indicators.length).toBeGreaterThan(1);
        expect(indicators.some(ind => ind.type === 'keyword')).toBe(true);
      });

      it('should prioritize higher severity keywords', () => {
        const highSeverityText = 'I want to kill myself and end it all';
        const indicators = detectCrisisKeywords(highSeverityText);
        
        const maxSeverity = Math.max(...indicators.map(ind => ind.severity));
        expect(maxSeverity).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('detectCrisisPatterns', () => {
    it('should detect crisis patterns', () => {
      const crisisPatterns = [
        'I have been thinking about suicide for weeks',
        'Every day I feel more hopeless',
        'I keep having thoughts of self-harm'
      ];

      crisisPatterns.forEach(text => {
        const patterns = detectCrisisPatterns(text);
        expect(patterns.length).toBeGreaterThan(0);
        expect(patterns[0].type).toBe('pattern');
      });
    });

    it('should detect temporal patterns', () => {
      const temporalText = 'I have been feeling worse every day for the past month';
      const patterns = detectCrisisPatterns(temporalText);
      
      expect(patterns.some(p => p.description.includes('temporal'))).toBe(true);
    });

    it('should detect intensity patterns', () => {
      const intensityText = 'I feel absolutely hopeless and completely worthless';
      const patterns = detectCrisisPatterns(intensityText);
      
      expect(patterns.some(p => p.description.includes('intensity'))).toBe(true);
    });
  });

  describe('calculateCrisisSeverity', () => {
    it('should calculate severity from indicators', () => {
      const indicators: CrisisIndicator[] = [
        {
          type: 'keyword',
          severity: 8,
          confidence: 0.9,
          description: 'Suicidal ideation detected'
        },
        {
          type: 'pattern',
          severity: 6,
          confidence: 0.7,
          description: 'Hopelessness pattern'
        }
      ];

      const severity = calculateCrisisSeverity(indicators);
      expect(severity).toBe('high');
    });

    it('should handle empty indicators array', () => {
      const severity = calculateCrisisSeverity([]);
      expect(severity).toBe('none');
    });

    it('should handle single indicator', () => {
      const indicators: CrisisIndicator[] = [
        {
          type: 'keyword',
          severity: 10,
          confidence: 0.95,
          description: 'Immediate crisis'
        }
      ];

      const severity = calculateCrisisSeverity(indicators);
      expect(severity).toBe('immediate');
    });

    it('should weight confidence appropriately', () => {
      const indicators: CrisisIndicator[] = [
        {
          type: 'keyword',
          severity: 8,
          confidence: 0.5,
          description: 'Low confidence crisis'
        }
      ];

      const severity = calculateCrisisSeverity(indicators);
      expect(severity).toBe('moderate');
    });
  });

  describe('analyzeCrisisText', () => {
    it('should analyze crisis text comprehensively', () => {
      const crisisText = 'I have been thinking about suicide and feel completely hopeless';
      
      const result = analyzeCrisisText(crisisText);
      
      expect(result).toHaveProperty('crisisLevel');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('indicators');
      expect(result).toHaveProperty('recommendations');
      expect(result.crisisLevel).toBe('high');
    });

    it('should handle long text appropriately', () => {
      const longText = 'This is a very long text that exceeds the maximum analysis length. '.repeat(100);
      
      const result = analyzeCrisisText(longText, {
        enableKeywordDetection: true,
        enableSentimentAnalysis: true,
        enablePatternMatching: true,
        severityThreshold: 5,
        confidenceThreshold: 0.7,
        maxAnalysisLength: 1000
      });
      
      expect(result.metadata.textLength).toBeLessThanOrEqual(1000);
    });

    it('should provide appropriate recommendations', () => {
      const crisisText = 'I want to kill myself';
      
      const result = analyzeCrisisText(crisisText);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('crisis'))).toBe(true);
    });
  });

  describe('generateCrisisRecommendations', () => {
    it('should generate recommendations for high crisis level', () => {
      const indicators: CrisisIndicator[] = [
        {
          type: 'keyword',
          severity: 10,
          confidence: 0.95,
          description: 'Immediate crisis'
        }
      ];

      const recommendations = generateCrisisRecommendations('immediate', indicators);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('immediate'))).toBe(true);
    });

    it('should generate recommendations for moderate crisis level', () => {
      const indicators: CrisisIndicator[] = [
        {
          type: 'keyword',
          severity: 5,
          confidence: 0.7,
          description: 'Moderate crisis'
        }
      ];

      const recommendations = generateCrisisRecommendations('moderate', indicators);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('support'))).toBe(true);
    });

    it('should handle multiple indicator types', () => {
      const indicators: CrisisIndicator[] = [
        {
          type: 'keyword',
          severity: 7,
          confidence: 0.8,
          description: 'Crisis keyword'
        },
        {
          type: 'pattern',
          severity: 6,
          confidence: 0.6,
          description: 'Crisis pattern'
        }
      ];

      const recommendations = generateCrisisRecommendations('high', indicators);
      
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('validateCrisisConfig', () => {
    it('should validate valid configuration', () => {
      const validConfig = {
        enableKeywordDetection: true,
        enableSentimentAnalysis: true,
        enablePatternMatching: true,
        severityThreshold: 5,
        confidenceThreshold: 0.7,
        maxAnalysisLength: 1000
      };

      const validation = validateCrisisConfig(validConfig);
      expect(validation).toBeDefined();
      expect(validation.enableKeywordDetection).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        enableKeywordDetection: true,
        enableSentimentAnalysis: true,
        enablePatternMatching: true,
        severityThreshold: -1, // Invalid
        confidenceThreshold: 1.5, // Invalid
        maxAnalysisLength: 0 // Invalid
      };

      const validation = validateCrisisConfig(invalidConfig);
      expect(validation).toBeDefined();
      expect(validation.severityThreshold).toBe(0);
      expect(validation.confidenceThreshold).toBe(1);
    });

    it('should handle missing configuration properties', () => {
      const incompleteConfig = {
        enableKeywordDetection: true
        // Missing other properties
      };

      const validation = validateCrisisConfig(incompleteConfig as any);
      expect(validation).toBeDefined();
      expect(validation.enableKeywordDetection).toBe(true);
    });
  });

  describe('CRISIS_KEYWORDS', () => {
    it('should contain all expected categories', () => {
      const expectedCategories = ['suicide', 'selfHarm', 'hopelessness', 'isolation'];
      
      expectedCategories.forEach(category => {
        expect(CRISIS_KEYWORDS).toHaveProperty(category);
      });
    });

    it('should have proper structure for each category', () => {
      Object.values(CRISIS_KEYWORDS).forEach(category => {
        expect(category).toHaveProperty('keywords');
        expect(category).toHaveProperty('weight');
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('description');
        
        expect(Array.isArray(category.keywords)).toBe(true);
        expect(typeof category.weight).toBe('number');
        expect(typeof category.category).toBe('string');
        expect(typeof category.description).toBe('string');
      });
    });

    it('should have appropriate severity weights', () => {
      Object.values(CRISIS_KEYWORDS).forEach(category => {
        expect(category.weight).toBeGreaterThan(0);
        expect(category.weight).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('DEFAULT_CRISIS_CONFIG', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_CRISIS_CONFIG).toHaveProperty('enableKeywordDetection');
      expect(DEFAULT_CRISIS_CONFIG).toHaveProperty('enableSentimentAnalysis');
      expect(DEFAULT_CRISIS_CONFIG).toHaveProperty('enablePatternMatching');
      expect(DEFAULT_CRISIS_CONFIG).toHaveProperty('severityThreshold');
      expect(DEFAULT_CRISIS_CONFIG).toHaveProperty('confidenceThreshold');
      expect(DEFAULT_CRISIS_CONFIG).toHaveProperty('maxAnalysisLength');
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_CRISIS_CONFIG.severityThreshold).toBeGreaterThan(0);
      expect(DEFAULT_CRISIS_CONFIG.confidenceThreshold).toBeGreaterThan(0);
      expect(DEFAULT_CRISIS_CONFIG.confidenceThreshold).toBeLessThan(1);
      expect(DEFAULT_CRISIS_CONFIG.maxAnalysisLength).toBeGreaterThan(0);
    });
  });

  describe('EMERGENCY_CONTACTS', () => {
    it('should contain emergency contact information', () => {
      expect(EMERGENCY_CONTACTS).toBeDefined();
      expect(Array.isArray(EMERGENCY_CONTACTS)).toBe(true);
    });

         it('should have proper contact structure', () => {
       Object.values(EMERGENCY_CONTACTS).forEach(contact => {
         expect(contact).toHaveProperty('name');
         expect(contact).toHaveProperty('available');
         
         expect(typeof contact.name).toBe('string');
         expect(typeof contact.available).toBe('string');
       });
     });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = analyzeCrisisText('');
      expect(result.crisisLevel).toBe('none');
      expect(result.confidence).toBe(0);
    });

    it('should handle text with only whitespace', () => {
      const result = analyzeCrisisText('   \n\t  ');
      expect(result.crisisLevel).toBe('none');
    });

    it('should handle text with no crisis keywords', () => {
      const result = analyzeCrisisText('Hello, how are you today?');
      expect(result.crisisLevel).toBe('none');
    });

    it('should handle very long text', () => {
      const longText = 'This is a test. '.repeat(1000);
      const result = analyzeCrisisText(longText);
      
      expect(result).toBeDefined();
      expect(result.metadata.analysisTime).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', () => {
      const startTime = Date.now();
      const text = 'I feel sad and lonely today';
      
      analyzeCrisisText(text);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 100ms for simple text
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent analysis', () => {
      const texts = [
        'I feel okay today',
        'I am feeling a bit down',
        'I need some support'
      ];

      const startTime = Date.now();
      const results = texts.map(text => analyzeCrisisText(text));
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(200); // Should handle 3 texts within 200ms
    });
  });
});
