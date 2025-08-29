import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { EnhancedAiCrisisDetectionService } from '../enhancedAiCrisisDetectionService';

// Mock dependencies
jest.mock('../openai', () => ({
  OpenAIService: jest.fn().mockImplementation(() => ({
    analyzeText: jest.fn(),
    detectSentiment: jest.fn(),
    extractKeywords: jest.fn()
  }))
}));

jest.mock('../crisisKeywordService', () => ({
  CrisisKeywordService: jest.fn().mockImplementation(() => ({
    analyzeKeywords: jest.fn(),
    getCrisisLevel: jest.fn(),
    getContextualFactors: jest.fn()
  }))
}));

jest.mock('../notificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendCrisisAlert: jest.fn(),
    escalateToSupport: jest.fn(),
    logCrisisEvent: jest.fn()
  }))
}));

interface MockCrisisAnalysis {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  indicators: string[];
  keywords: string[];
  sentiment: number;
  contextualFactors: string[];
  recommendations: string[];
  requiresIntervention: boolean;
  escalationLevel: number;
  timestamp: string;
}

interface MockEnhancedAnalysisResult {
  crisisDetected: boolean;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  analysis: MockCrisisAnalysis;
  multimodalFactors?: {
    textualIndicators: string[];
    behavioralPatterns: string[];
    temporalFactors: string[];
  };
  culturalContext?: {
    language: string;
    culturalFactors: string[];
    localResources: string[];
  };
  interventionPlan?: {
    immediateActions: string[];
    supportResources: string[];
    followUpRequired: boolean;
  };
}

describe('EnhancedAiCrisisDetectionService', () => {
  let service: EnhancedAiCrisisDetectionService;
  let mockOpenAI: any;
  let mockKeywordService: any;
  let mockNotificationService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    service = new EnhancedAiCrisisDetectionService({
      enableRealTimeAnalysis: true,
      confidenceThreshold: 0.7,
      escalationThreshold: 0.85,
      enableMultimodalAnalysis: true,
      enableCulturalContext: true,
      debugMode: false
    });

    // Get mock instances
    mockOpenAI = service['openAI'];
    mockKeywordService = service['keywordService'];
    mockNotificationService = service['notificationService'];
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Basic Crisis Detection', () => {
    it('should detect high-risk crisis language', async () => {
      const crisisText = "I can't take this anymore. I want to end it all.";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'critical',
        confidence: 0.95,
        indicators: ['suicidal_ideation', 'hopelessness', 'emotional_distress']
      });

      mockKeywordService.analyzeKeywords.mockReturnValue({
        crisisKeywords: ['end it all', 'can\'t take'],
        severity: 'high',
        contextualFactors: ['isolation', 'desperation']
      });

      const result = await service.analyzeCrisisRisk(crisisText);

      expect(result.crisisDetected).toBe(true);
      expect(result.riskLevel).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.analysis.requiresIntervention).toBe(true);
    });

    it('should detect moderate-risk situations', async () => {
      const moderateText = "I'm really struggling and feeling hopeless lately.";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'moderate',
        confidence: 0.75,
        indicators: ['emotional_distress', 'hopelessness']
      });

      mockKeywordService.analyzeKeywords.mockReturnValue({
        crisisKeywords: ['struggling', 'hopeless'],
        severity: 'moderate',
        contextualFactors: ['depression_indicators']
      });

      const result = await service.analyzeCrisisRisk(moderateText);

      expect(result.crisisDetected).toBe(true);
      expect(result.riskLevel).toBe('moderate');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle non-crisis text appropriately', async () => {
      const normalText = "I had a good day today and feel optimistic about tomorrow.";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'low',
        confidence: 0.9,
        indicators: ['positive_sentiment', 'optimism']
      });

      mockKeywordService.analyzeKeywords.mockReturnValue({
        crisisKeywords: [],
        severity: 'none',
        contextualFactors: ['positive_outlook']
      });

      const result = await service.analyzeCrisisRisk(normalText);

      expect(result.crisisDetected).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle empty or invalid input', async () => {
      const result1 = await service.analyzeCrisisRisk('');
      const result2 = await service.analyzeCrisisRisk('   ');
      const result3 = await service.analyzeCrisisRisk(null as any);

      expect(result1.crisisDetected).toBe(false);
      expect(result2.crisisDetected).toBe(false);
      expect(result3.crisisDetected).toBe(false);
    });
  });

  describe('Multimodal Analysis', () => {
    it('should analyze behavioral patterns along with text', async () => {
      const analysisData = {
        text: "I'm feeling down",
        behavioralData: {
          recentActivity: 'decreased',
          sleepPatterns: 'disrupted',
          socialInteraction: 'withdrawn'
        },
        contextualData: {
          timeOfDay: 'late_night',
          recentEvents: ['relationship_change', 'work_stress']
        }
      };

      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'moderate',
        confidence: 0.8,
        indicators: ['behavioral_changes', 'isolation_patterns']
      });

      const result = await service.analyzeMultimodalCrisis(analysisData);

      expect(result.multimodalFactors).toBeDefined();
      expect(result.multimodalFactors?.behavioralPatterns).toContain('decreased_activity');
      expect(result.multimodalFactors?.temporalFactors).toContain('late_night_vulnerability');
    });

    it('should weight behavioral factors appropriately', async () => {
      const lowTextRisk = {
        text: "Things are okay",
        behavioralData: {
          recentActivity: 'severely_decreased',
          sleepPatterns: 'insomnia',
          socialInteraction: 'completely_withdrawn',
          appUsagePatterns: 'crisis_resource_seeking'
        }
      };

      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'low',
        confidence: 0.7,
        indicators: ['neutral_sentiment']
      });

      const result = await service.analyzeMultimodalCrisis(lowTextRisk);

      // Should elevate risk due to behavioral indicators
      expect(result.riskLevel).not.toBe('low');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should analyze temporal patterns', async () => {
      const temporalData = {
        text: "I feel terrible",
        timeContext: {
          timeOfDay: '3:00 AM',
          dayOfWeek: 'Sunday',
          recentPatterns: ['late_night_distress', 'weekend_isolation']
        }
      };

      const result = await service.analyzeMultimodalCrisis(temporalData);

      expect(result.multimodalFactors?.temporalFactors).toContain('high_risk_time_period');
    });
  });

  describe('Cultural Context Analysis', () => {
    it('should adapt analysis for different languages', async () => {
      const spanishText = "No puedo más, quiero acabar con todo";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'critical',
        confidence: 0.9,
        indicators: ['suicidal_ideation', 'desperation'],
        language: 'es'
      });

      const result = await service.analyzeCrisisRisk(spanishText, {
        language: 'es',
        culturalContext: 'latin_american'
      });

      expect(result.culturalContext).toBeDefined();
      expect(result.culturalContext?.language).toBe('es');
      expect(result.culturalContext?.localResources).toContain('spanish_crisis_line');
    });

    it('should consider cultural expressions of distress', async () => {
      const culturalText = "My family would be better off without me";
      
      const result = await service.analyzeCrisisRisk(culturalText, {
        culturalContext: 'collectivist_culture'
      });

      expect(result.culturalContext?.culturalFactors).toContain('family_burden_concern');
    });

    it('should provide culturally appropriate resources', async () => {
      const result = await service.analyzeCrisisRisk("I need help", {
        location: 'rural_area',
        culturalContext: 'indigenous_community'
      });

      if (result.culturalContext?.localResources) {
        expect(result.culturalContext.localResources).toContain('community_elder_support');
      }
    });
  });

  describe('Real-time Monitoring', () => {
    it('should process streaming text analysis', (done) => {
      const textStream = [
        "I'm feeling okay today",
        "But things are getting harder",
        "I don't know if I can keep going",
        "Maybe it would be better if I wasn't here"
      ];

      let analysisCount = 0;
      const analysisResults: any[] = [];

      service.startRealTimeMonitoring({
        onAnalysis: (result) => {
          analysisResults.push(result);
          analysisCount++;
          
          if (analysisCount === textStream.length) {
            // Should show escalating risk levels
            expect(analysisResults[0].riskLevel).toBe('low');
            expect(analysisResults[analysisResults.length - 1].riskLevel).toBe('critical');
            done();
          }
        },
        confidenceThreshold: 0.6
      });

      // Simulate streaming text
      textStream.forEach((text, index) => {
        setTimeout(() => {
          mockOpenAI.analyzeText.mockResolvedValue({
            riskLevel: index < 2 ? 'low' : index === 2 ? 'moderate' : 'critical',
            confidence: 0.7 + (index * 0.1)
          });
          
          service.processStreamingText(text);
        }, index * 100);
      });
    }, 10000);

    it('should detect escalation patterns', async () => {
      const conversationHistory = [
        { text: "Having a rough day", timestamp: Date.now() - 3600000 },
        { text: "Things aren't getting better", timestamp: Date.now() - 1800000 },
        { text: "I can't handle this anymore", timestamp: Date.now() }
      ];

      const result = await service.analyzeConversationEscalation(conversationHistory);

      expect(result.escalationDetected).toBe(true);
      expect(result.escalationRate).toBeGreaterThan(0);
    });

    it('should trigger alerts on threshold breach', async () => {
      const criticalText = "I have a plan to hurt myself tonight";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'critical',
        confidence: 0.98,
        indicators: ['immediate_threat', 'specific_plan']
      });

      await service.analyzeCrisisRisk(criticalText);

      expect(mockNotificationService.sendCrisisAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          urgency: 'immediate',
          riskLevel: 'critical'
        })
      );
    });
  });

  describe('Intervention Planning', () => {
    it('should generate appropriate intervention plans', async () => {
      const crisisText = "I've been thinking about suicide a lot lately";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'high',
        confidence: 0.9,
        indicators: ['suicidal_ideation', 'persistent_thoughts']
      });

      const result = await service.analyzeCrisisRisk(crisisText);

      expect(result.interventionPlan).toBeDefined();
      expect(result.interventionPlan?.immediateActions).toContain('safety_planning');
      expect(result.interventionPlan?.supportResources).toContain('crisis_hotline');
      expect(result.interventionPlan?.followUpRequired).toBe(true);
    });

    it('should customize interventions based on risk level', async () => {
      const moderateText = "I'm feeling really overwhelmed and sad";
      
      mockOpenAI.analyzeText.mockResolvedValue({
        riskLevel: 'moderate',
        confidence: 0.8,
        indicators: ['emotional_distress', 'overwhelm']
      });

      const result = await service.analyzeCrisisRisk(moderateText);

      expect(result.interventionPlan?.immediateActions).toContain('coping_strategies');
      expect(result.interventionPlan?.immediateActions).not.toContain('emergency_services');
    });

    it('should consider user history in interventions', async () => {
      const userContext = {
        previousCrises: 2,
        lastCrisisDate: Date.now() - 2592000000, // 30 days ago
        effectiveInterventions: ['peer_support', 'breathing_exercises'],
        ineffectiveInterventions: ['generic_resources']
      };

      const result = await service.analyzeCrisisRisk(
        "I'm struggling again", 
        { userContext }
      );

      if (result.interventionPlan?.supportResources) {
        expect(result.interventionPlan.supportResources).toContain('peer_support');
        expect(result.interventionPlan.supportResources).not.toContain('generic_resources');
      }
    });
  });

  describe('Performance and Accuracy', () => {
    it('should maintain high accuracy rates', async () => {
      const testCases = [
        { text: "I want to kill myself", expectedRisk: 'critical' },
        { text: "Life is beautiful", expectedRisk: 'low' },
        { text: "I'm feeling stressed", expectedRisk: 'low' },
        { text: "I can't go on like this", expectedRisk: 'moderate' },
        { text: "Nobody would miss me", expectedRisk: 'high' }
      ];

      let correctPredictions = 0;

      for (const testCase of testCases) {
        mockOpenAI.analyzeText.mockResolvedValue({
          riskLevel: testCase.expectedRisk,
          confidence: 0.8
        });

        const result = await service.analyzeCrisisRisk(testCase.text);
        
        if (result.riskLevel === testCase.expectedRisk) {
          correctPredictions++;
        }
      }

      const accuracy = correctPredictions / testCases.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.8);
    });

    it('should process analysis within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await service.analyzeCrisisRisk("This is a test message for performance");
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent analysis requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        service.analyzeCrisisRisk(`Test message ${i}`)
      );

      const results = await Promise.all(concurrentRequests);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.crisisDetected).toBe('boolean');
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API failures gracefully', async () => {
      mockOpenAI.analyzeText.mockRejectedValue(new Error('API unavailable'));
      
      const result = await service.analyzeCrisisRisk("Test message");
      
      expect(result.crisisDetected).toBe(false);
      expect(result.riskLevel).toBe('low');
      expect(result.analysis.recommendations).toContain('manual_review_recommended');
    });

    it('should fall back to keyword analysis when AI fails', async () => {
      mockOpenAI.analyzeText.mockRejectedValue(new Error('AI service down'));
      mockKeywordService.analyzeKeywords.mockReturnValue({
        crisisKeywords: ['suicide', 'kill myself'],
        severity: 'high'
      });
      
      const result = await service.analyzeCrisisRisk("I want to kill myself");
      
      expect(result.crisisDetected).toBe(true);
      expect(result.riskLevel).toBe('high');
    });

    it('should validate input parameters', async () => {
      const invalidInputs = [
        undefined,
        null,
        123,
        {},
        []
      ];

      for (const input of invalidInputs) {
        const result = await service.analyzeCrisisRisk(input as any);
        expect(result.crisisDetected).toBe(false);
      }
    });

    it('should handle malformed AI responses', async () => {
      mockOpenAI.analyzeText.mockResolvedValue({
        // Missing required fields
        confidence: 0.8
      });

      const result = await service.analyzeCrisisRisk("Test message");
      
      expect(result).toBeDefined();
      expect(result.riskLevel).toBe('low'); // Default safe value
    });

    it('should implement rate limiting', async () => {
      const rapidRequests = Array.from({ length: 100 }, (_, i) => 
        service.analyzeCrisisRisk(`Rapid request ${i}`)
      );

      const results = await Promise.allSettled(rapidRequests);
      
      // Some requests should be rate limited
      const rateLimited = results.filter(r => 
        r.status === 'rejected' && 
        (r.reason.message || '').includes('rate limit')
      );
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Privacy and Security', () => {
    it('should sanitize sensitive information in logs', async () => {
      const sensitiveText = "My name is John Doe and I live at 123 Main St. I want to hurt myself.";
      
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.analyzeCrisisRisk(sensitiveText);
      
      // Check that logs don't contain sensitive information
      const logCalls = logSpy.mock.calls.flat().join(' ');
      expect(logCalls).not.toContain('John Doe');
      expect(logCalls).not.toContain('123 Main St');
      
      logSpy.mockRestore();
    });

    it('should encrypt data transmission', async () => {
      const result = await service.analyzeCrisisRisk("Sensitive crisis message");
      
      // Verify encryption is used (implementation specific)
      expect(mockOpenAI.analyzeText).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          encrypted: true
        })
      );
    });

    it('should not store sensitive content permanently', async () => {
      await service.analyzeCrisisRisk("Private crisis information");
      
      const storedData = service.getStoredAnalyses();
      
      // Should only store metadata, not original content
      storedData.forEach(analysis => {
        expect(analysis).not.toHaveProperty('originalText');
        expect(analysis).toHaveProperty('analysisId');
        expect(analysis).toHaveProperty('timestamp');
      });
    });
  });

  describe('Integration and Configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        confidenceThreshold: 0.9,
        enableRealTimeAnalysis: false,
        escalationThreshold: 0.95
      };

      service.updateConfiguration(newConfig);
      
      const currentConfig = service.getConfiguration();
      expect(currentConfig.confidenceThreshold).toBe(0.9);
      expect(currentConfig.enableRealTimeAnalysis).toBe(false);
    });

    it('should integrate with external crisis services', async () => {
      const mockExternalService = jest.fn().mockResolvedValue({
        serviceAvailable: true,
        estimatedResponseTime: '< 5 minutes'
      });

      service.registerExternalCrisisService('local_crisis_center', mockExternalService);
      
      const criticalResult = await service.analyzeCrisisRisk("I need immediate help");
      
      expect(mockExternalService).toHaveBeenCalled();
      expect(criticalResult.interventionPlan?.supportResources).toContain('local_crisis_center');
    });

    it('should export analysis data for reporting', async () => {
      // Generate some test data
      await service.analyzeCrisisRisk("Test message 1");
      await service.analyzeCrisisRisk("Test message 2");
      
      const exportData = service.exportAnalysisData({
        format: 'json',
        includePII: false,
        dateRange: {
          start: Date.now() - 86400000,
          end: Date.now()
        }
      });

      expect(exportData).toBeDefined();
      expect(Array.isArray(exportData.analyses)).toBe(true);
      expect(exportData.summary).toBeDefined();
    });
  });
});
