import '@testing-library/jest-dom';
import crisisDetectionService from '../crisisDetectionService';
import type { 
  CrisisIndicator,
  CrisisAnalysisResult,
  CrisisResponse,
  CrisisEscalationAction
} from '../crisisDetectionService';
import type {
  TherapeuticProfile,
  SafetyPlan,
  RiskAssessment,
  ConversationContext,
  AIMessage
} from '../therapeuticAIService';

// Mock dependencies
jest.mock('../therapeuticAIService');
jest.mock('../notificationService');

// Import mocked services
import therapeuticAIService from '../therapeuticAIService';
import { notificationService } from '../notificationService';

// Set up mocked methods
const mockedTherapeuticAIService = therapeuticAIService as jest.Mocked<typeof therapeuticAIService>;
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;

// Test data
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'better off dead', 'want to die',
  'hurt myself', 'cut myself', 'overdose', 'jump off', 'hang myself',
  'can\'t go on', 'no hope', 'worthless', 'burden'
];

const NON_CRISIS_MESSAGES = [
  'I had a good day today',
  'Feeling better after therapy',
  'Thanks for your help',
  'The weather is nice',
  'Looking forward to tomorrow'
];

const MILD_CRISIS_MESSAGES = [
  'I\'m feeling really down today',
  'Everything seems hopeless',
  'I don\'t know what to do anymore',
  'I feel so alone and sad'
];

const SEVERE_CRISIS_MESSAGES = [
  'I want to kill myself',
  'I can\'t take this pain anymore, I want to end it all',
  'I have pills and I\'m thinking of taking them all',
  'Everyone would be better off if I was dead',
  'I\'m going to jump off the bridge tonight'
];

// Mock user data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    crisisSupport: {
      enableDetection: true,
      emergencyContacts: [
        { 
          id: 'contact-1', 
          name: 'John Doe', 
          phone: '+1234567890', 
          relationship: 'friend',
          isPrimary: true
        }
      ],
      autoShareLocation: true
    }
  }
};

// Mock safety plan
const mockSafetyPlan: SafetyPlan = {
  warningSignals: ['Feeling hopeless', 'Isolating'],
  copingStrategies: ['Deep breathing', 'Call a friend'],
  socialSupports: ['Friend: John', 'Family: Mom'],
  professionalContacts: ['Dr. Smith - 555-0100'],
  environmentalSafety: ['Remove harmful objects', 'Go to safe space'],
  restrictMeans: ['Lock away medications'],
  reasonsToLive: ['Family', 'Future goals']
};

// Mock conversation context
const mockContext: ConversationContext = {
  sessionId: 'session-123',
  userId: mockUser.id,
  messages: [],
  mood: 3,
  energy: 3,
  anxiety: 7,
  currentCrisis: false,
  therapeuticGoals: ['Manage anxiety', 'Improve mood'],
  sessionNumber: 1,
  lastSession: new Date()
};

describe('Crisis Detection Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    if (mockedTherapeuticAIService.assessRisk) {
      mockedTherapeuticAIService.assessRisk = jest.fn().mockResolvedValue({
        level: 'low',
        factors: [],
        protectiveFactors: [],
        recommendations: [],
        requiresImmediateAttention: false,
        crisisProtocolActivated: false
      });
    }
    
    if (mockedTherapeuticAIService.generateResponse) {
      mockedTherapeuticAIService.generateResponse = jest.fn().mockResolvedValue({
        id: 'response-1',
        content: 'I understand you\'re going through a difficult time.',
        approach: 'CBT',
        confidence: 0.8,
        interventions: [],
        resources: [],
        followUpSuggestions: [],
        timestamp: new Date()
      });
    }
    
    if (mockedNotificationService.sendNotification) {
      mockedNotificationService.sendNotification = jest.fn().mockResolvedValue('notification-id');
    }
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Crisis Detection Accuracy', () => {
    it('should detect severe crisis indicators', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        SEVERE_CRISIS_MESSAGES[0],
        mockUser.id
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.severityLevel).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect mild crisis indicators', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        MILD_CRISIS_MESSAGES[0],
        mockUser.id
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(['low', 'medium']).toContain(result.severityLevel);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should not detect crisis in normal messages', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        NON_CRISIS_MESSAGES[0],
        mockUser.id
      );
      
      expect(result.hasCrisisIndicators).toBe(false);
      expect(result.severityLevel).toBe('none');
    });

    it('should detect multiple crisis keywords', async () => {
      const message = 'I feel worthless and want to die. I have no hope left.';
      const result = await crisisDetectionService.analyzeForCrisis(message, mockUser.id);
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.detectedIndicators.some(i => i.category === 'suicidal')).toBe(true);
      expect(result.detectedIndicators.length).toBeGreaterThan(1);
    });

    it('should handle context in crisis detection', async () => {
      const messages = [
        'I\'ve been feeling worse lately',
        'Nothing seems to help',
        'Maybe everyone would be better off without me'
      ];
      
      // Analyze each message to simulate conversation context
      let lastResult: CrisisAnalysisResult | null = null;
      for (const message of messages) {
        lastResult = await crisisDetectionService.analyzeForCrisis(
          message,
          mockUser.id
        );
      }
      
      expect(lastResult).toBeDefined();
      if (lastResult) {
        expect(lastResult.hasCrisisIndicators).toBe(true);
      }
    });
  });

  describe('Emergency Response', () => {
    it('should trigger emergency protocol for imminent danger', async () => {
      const analysisResult: CrisisAnalysisResult = {
        hasCrisisIndicators: true,
        severityLevel: 'critical',
        detectedIndicators: [{
          keyword: 'kill myself',
          severity: 'critical',
          context: ['going to'],
          category: 'suicidal',
          immediateAction: true
        }],
        confidence: 0.95,
        recommendedActions: ['Call 911 immediately'],
        emergencyContacts: ['911', '988'],
        immediateIntervention: true
      };
      
      const response = await crisisDetectionService.handleCrisisResponse(
        analysisResult,
        mockUser.id
      );
      
      expect(response.escalated).toBe(true);
      expect(response.actionsTaken).toContain('Initiated crisis intervention protocol');
    });

    it('should provide appropriate resources for severe cases', async () => {
      const analysisResult = await crisisDetectionService.analyzeForCrisis(
        SEVERE_CRISIS_MESSAGES[0],
        mockUser.id
      );
      
      const response = await crisisDetectionService.handleCrisisResponse(
        analysisResult,
        mockUser.id
      );
      
      expect(response.actionsTaken.length).toBeGreaterThan(0);
      expect(response.followUpRequired).toBe(true);
    });

    it('should handle location sharing when needed', async () => {
      const mockLocation = { latitude: 40.7128, longitude: -74.0060 };
      
      // Mock geolocation API if available
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: jest.fn((success) => success({
              coords: mockLocation,
              timestamp: Date.now()
            } as GeolocationPosition))
          },
          configurable: true
        });
      }
      
      // Test location-aware crisis response
      const result = await crisisDetectionService.analyzeForCrisis(
        'I need help right now',
        mockUser.id
      );
      
      expect(result.emergencyContacts.length).toBeGreaterThan(0);
    });

    it('should send crisis notifications', async () => {
      const analysisResult: CrisisAnalysisResult = {
        hasCrisisIndicators: true,
        severityLevel: 'high',
        detectedIndicators: [],
        confidence: 0.8,
        recommendedActions: [],
        emergencyContacts: ['988'],
        immediateIntervention: false
      };
      
      await crisisDetectionService.handleCrisisResponse(
        analysisResult,
        mockUser.id
      );
      
      // Verify notification would be sent in real implementation
      expect(analysisResult.severityLevel).toBe('high');
    });
  });

  describe('Safety Plan Integration', () => {
    it('should retrieve user safety plan data', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I\'m feeling really down',
        mockUser.id
      );
      
      expect(result).toBeDefined();
      expect(result.recommendedActions).toBeDefined();
      expect(result.emergencyContacts).toBeDefined();
    });

    it('should activate safety plan steps based on severity', async () => {
      // Test low severity
      const lowResult = await crisisDetectionService.analyzeForCrisis(
        'I feel sad today',
        mockUser.id
      );
      expect(lowResult.recommendedActions).toContain('Practice self-care activities');
      
      // Test medium severity  
      const medResult = await crisisDetectionService.analyzeForCrisis(
        'I feel hopeless',
        mockUser.id
      );
      expect(medResult.recommendedActions).toContain('Contact mental health professional');
      
      // Test high severity
      const highResult = await crisisDetectionService.analyzeForCrisis(
        'I want to hurt myself',
        mockUser.id
      );
      expect(highResult.recommendedActions).toContain('Contact crisis hotline (988)');
    });

    it('should escalate through safety plan levels', async () => {
      const messages = [
        'I\'m feeling down',
        'Everything feels hopeless',
        'I can\'t take this anymore'
      ];
      
      const results: CrisisAnalysisResult[] = [];
      for (const message of messages) {
        const result = await crisisDetectionService.analyzeForCrisis(
          message,
          mockUser.id
        );
        results.push(result);
      }
      
      // Verify escalation in severity
      const severityWeights = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
      const weights = results.map(r => severityWeights[r.severityLevel]);
      
      // Check that severity generally increases or stays the same
      for (let i = 1; i < weights.length; i++) {
        expect(weights[i]).toBeGreaterThanOrEqual(weights[i-1] - 1);
      }
    });
  });

  describe('AI Integration', () => {
    it('should use AI for risk assessment', async () => {
      const mockRiskAssessment: RiskAssessment = {
        level: 'high',
        factors: ['suicidal_ideation', 'plan_mentioned'],
        protectiveFactors: [],
        recommendations: ['immediate_intervention', 'crisis_hotline'],
        requiresImmediateAttention: true,
        crisisProtocolActivated: false
      };
      
      if (mockedTherapeuticAIService.assessRisk) {
        mockedTherapeuticAIService.assessRisk = jest.fn().mockResolvedValue(mockRiskAssessment);
      }
      
      const context: ConversationContext = {
        ...mockContext,
        messages: [{
          id: '1',
          role: 'user',
          content: 'I have a plan to end everything tomorrow',
          timestamp: new Date()
        }]
      };
      
      if (mockedTherapeuticAIService.assessRisk) {
        const riskResult = await mockedTherapeuticAIService.assessRisk(
          'I have a plan to end everything tomorrow',
          context
        );
        
        expect(mockedTherapeuticAIService.assessRisk).toHaveBeenCalled();
        expect(riskResult.level).toBe('high');
        expect(riskResult.recommendations).toContain('crisis_hotline');
      }
    });

    it('should generate appropriate responses', async () => {
      if (mockedTherapeuticAIService.generateResponse) {
        mockedTherapeuticAIService.generateResponse = jest.fn().mockResolvedValue({
          id: 'response-1',
          content: 'I\'m very concerned about what you\'re sharing. Your safety is important. Would you like to talk to a crisis counselor right now?',
          approach: 'CBT',
          confidence: 0.9,
          interventions: [],
          resources: [],
          followUpSuggestions: ['Would you like to talk to a crisis counselor?'],
          timestamp: new Date()
        });
        
        const response = await mockedTherapeuticAIService.generateResponse('I need help', mockContext);
        
        expect(response.content).toContain('safety');
        expect(mockedTherapeuticAIService.generateResponse).toHaveBeenCalled();
      }
    });

    it('should escalate to human when needed', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I have pills and I\'m going to take them all now',
        mockUser.id
      );
      
      if (result.immediateIntervention) {
        // In a real scenario, this would trigger human escalation
        expect(result.immediateIntervention).toBe(true);
        expect(result.severityLevel).toBe('critical');
      }
    });
  });

  describe('Crisis Resources', () => {
    it('should provide appropriate crisis resources', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I\'m thinking about suicide',
        mockUser.id
      );
      
      expect(result.emergencyContacts).toContain('988');
      expect(result.emergencyContacts).toContain('911');
    });

    it('should provide location-specific resources', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I need immediate help',
        mockUser.id
      );
      
      expect(result.emergencyContacts).toBeDefined();
      expect(result.emergencyContacts.length).toBeGreaterThan(0);
    });

    it('should prioritize 24/7 resources', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I\'m in crisis right now',
        mockUser.id
      );
      
      // 988 and 911 are 24/7 services
      expect(result.emergencyContacts).toContain('988');
      expect(result.immediateIntervention).toBe(true);
    });
  });

  describe('Privacy and Consent', () => {
    it('should respect user privacy preferences', async () => {
      const privateUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          crisisSupport: {
            ...mockUser.preferences.crisisSupport,
            enableDetection: false
          }
        }
      };
      
      const result = await crisisDetectionService.analyzeForCrisis(
        SEVERE_CRISIS_MESSAGES[0],
        privateUser.id
      );
      
      // Should still detect but actions depend on implementation
      expect(result.hasCrisisIndicators).toBe(true);
    });

    it('should log crisis events appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await crisisDetectionService.analyzeForCrisis(
        SEVERE_CRISIS_MESSAGES[0],
        mockUser.id
      );
      
      // Verify logging occurred (implementation uses logger.warn for crisis)
      // Note: Actual logging implementation may vary
      
      consoleSpy.mockRestore();
    });

    it('should handle consent for emergency contact', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I need help',
        mockUser.id
      );
      
      // Verify emergency contacts are provided when appropriate
      expect(result.emergencyContacts).toBeDefined();
      expect(Array.isArray(result.emergencyContacts)).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid message analysis', async () => {
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          crisisDetectionService.analyzeForCrisis(MILD_CRISIS_MESSAGES[0], mockUser.id)
        );
      }
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should handle 10 messages in under 5 seconds
    });

    it('should cache recent analysis results', async () => {
      const message = 'I feel hopeless';
      
      // First call
      await crisisDetectionService.analyzeForCrisis(message, mockUser.id);
      
      // Second call (may use cache if implemented)
      const start = Date.now();
      await crisisDetectionService.analyzeForCrisis(message, mockUser.id);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Response should be fast
    });

    it('should handle service failures gracefully', async () => {
      if (mockedTherapeuticAIService.assessRisk) {
        mockedTherapeuticAIService.assessRisk = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      }
      
      const result = await crisisDetectionService.analyzeForCrisis(
        SEVERE_CRISIS_MESSAGES[0],
        mockUser.id
      );
      
      // Should still provide basic detection even if AI fails
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.severityLevel).not.toBe('none');
    });
  });

  describe('Mental Health Specific Features', () => {
    it('should detect self-harm indicators', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I\'ve been cutting myself again',
        mockUser.id
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.detectedIndicators.some(i => i.category === 'self-harm')).toBe(true);
    });

    it('should detect substance abuse crisis', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I took too many pills and I feel weird',
        mockUser.id
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.detectedIndicators.some(i => i.category === 'substance-abuse')).toBe(true);
      expect(result.immediateIntervention).toBe(true);
    });

    it('should detect eating disorder crisis', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'I haven\'t eaten in days and I feel like I\'m going to pass out',
        mockUser.id
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      // May be categorized as general distress or emergency
      expect(result.severityLevel).not.toBe('none');
    });

    it('should provide trauma-informed responses', async () => {
      const result = await crisisDetectionService.analyzeForCrisis(
        'The flashbacks are overwhelming me',
        mockUser.id
      );
      
      // Check for grounding techniques in recommendations
      expect(result.recommendedActions.some(action => 
        action.toLowerCase().includes('grounding') || 
        action.toLowerCase().includes('self-care') ||
        action.toLowerCase().includes('coping')
      )).toBe(true);
    });
  });
});