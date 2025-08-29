import crisisDetectionService from '../../../services/crisisDetectionService';
import crisis988Service from '../../../services/crisis988Service';
import emergencyEscalationService from '../../../services/emergencyEscalationService';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../../services/encryptionService');
jest.mock('../../../services/apiClient');
jest.mock('../../../services/aiSafetyGuardrails');

const mockEncryptionService = require('../../../services/encryptionService');
const mockApiClient = require('../../../services/apiClient');
const mockAiSafetyGuardrails = require('../../../services/aiSafetyGuardrails');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
  
  send(data: string) {
    // Simulate response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'crisis_response',
            content: 'Crisis support connected'
          })
        }));
      }
    }, 100);
  }
  
  close() {
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('Crisis Detection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Default mocks
    mockEncryptionService.encrypt.mockImplementation((data: string) => `encrypted_${data}`);
    mockEncryptionService.decrypt.mockImplementation((data: string) => data.replace('encrypted_', ''));
    mockApiClient.post.mockResolvedValue({ data: { success: true } });
    mockAiSafetyGuardrails.analyzeCrisisContent.mockResolvedValue({
      riskLevel: 'low',
      confidence: 0.8
    });
  });

  describe('Crisis Keyword Detection', () => {
    it('should detect high-risk keywords', async () => {
      const highRiskText = "I want to end my life and I have a plan";
      
      const result = await crisisDetectionService.analyzeCrisisKeywords(highRiskText);

      expect(result.riskLevel).toBe('critical');
      expect(result.detectedKeywords).toContain('end my life');
      expect(result.detectedKeywords).toContain('plan');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should detect moderate-risk expressions', async () => {
      const moderateRiskText = "I feel hopeless and don't see a way out";
      
      const result = await crisisDetectionService.analyzeCrisisKeywords(moderateRiskText);

      expect(result.riskLevel).toBe('moderate');
      expect(result.detectedKeywords).toContain('hopeless');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should handle low-risk content appropriately', async () => {
      const lowRiskText = "I'm feeling a bit sad today but I'll be okay";
      
      const result = await crisisDetectionService.analyzeCrisisKeywords(lowRiskText);

      expect(result.riskLevel).toBe('low');
      expect(result.detectedKeywords).toHaveLength(0);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should detect contextual crisis indicators', async () => {
      const contextualText = "Nobody would miss me if I were gone. I've been thinking about this for weeks";
      
      const result = await crisisDetectionService.analyzeCrisisKeywords(contextualText);

      expect(result.riskLevel).toBe('high');
      expect(result.contextualFactors).toContain('isolation_thoughts');
      expect(result.contextualFactors).toContain('persistent_ideation');
    });

    it('should handle multilingual crisis detection', async () => {
      const spanishCrisisText = "No puedo más, quiero terminar con todo";
      
      const result = await crisisDetectionService.analyzeCrisisKeywords(spanishCrisisText, {
        language: 'es'
      });

      expect(result.riskLevel).toBe('high');
      expect(result.language).toBe('es');
      expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });

    it('should detect disguised or coded crisis language', async () => {
      const codedText = "I'm ready to check out permanently, if you know what I mean";
      
      const result = await crisisDetectionService.analyzeCrisisKeywords(codedText);

      expect(result.riskLevel).toBeGreaterThan('low' as any);
      expect(result.indirectIndicators).toContain('euphemistic_language');
    });
  });

  describe('Crisis Risk Assessment', () => {
    it('should assess overall risk level from multiple factors', async () => {
      const assessmentData = {
        moodScores: [2, 1, 3, 2], // Very low mood scores
        journalKeywords: ['hopeless', 'worthless', 'burden'],
        chatAnalysis: { suicidalIdeation: true, plan: false, means: false },
        behaviorPatterns: { isolationIncreased: true, sleepDisrupted: true },
        previousIncidents: 1
      };

      const result = await crisisDetectionService.assessRiskLevel(assessmentData);

      expect(result.overallRisk).toBe('high');
      expect(result.contributingFactors).toContain('persistent_low_mood');
      expect(result.contributingFactors).toContain('suicidal_ideation');
      expect(result.recommendedActions).toContain('immediate_intervention');
    });

    it('should calculate risk scores accurately', async () => {
      const riskFactors = {
        suicidalIdeation: { present: true, intensity: 8 },
        planSpecificity: { present: false, details: 0 },
        meansAccess: { available: true, lethality: 6 },
        protectiveFactors: { family: true, treatment: true, hope: false },
        previousAttempts: 0,
        mentalState: { depression: 7, anxiety: 6, agitation: 4 }
      };

      const result = await crisisDetectionService.calculateRiskScore(riskFactors);

      expect(result.score).toBeGreaterThan(0.6);
      expect(result.score).toBeLessThan(1.0);
      expect(result.breakdown.ideation).toBeGreaterThan(0);
      expect(result.breakdown.protective).toBeLessThan(0); // Negative contribution
    });

    it('should incorporate temporal patterns', async () => {
      const timeBasedData = {
        timeOfDay: 'late_night',
        dayOfWeek: 'sunday',
        seasonalFactor: 'winter',
        anniversaryDates: ['2023-01-15'], // Loss anniversary
        recentStressors: ['job_loss', 'relationship_end']
      };

      const result = await crisisDetectionService.assessTemporalRisk(timeBasedData);

      expect(result.temporalRisk).toBeGreaterThan(0.5);
      expect(result.riskFactors).toContain('high_risk_time_period');
      expect(result.riskFactors).toContain('multiple_recent_stressors');
    });

    it('should validate assessment data integrity', async () => {
      const invalidData = {
        moodScores: [], // Empty array
        journalKeywords: null,
        chatAnalysis: { invalid: 'format' }
      };

      await expect(crisisDetectionService.assessRiskLevel(invalidData)).rejects.toThrow(/invalid.*assessment.*data/i);
    });
  });

  describe('Crisis Response Triggering', () => {
    it('should trigger appropriate response for critical risk', async () => {
      const criticalEvent = {
        userId: 'user-123',
        riskLevel: 'critical',
        confidence: 0.95,
        triggers: ['suicidal_plan', 'means_available', 'timeline_immediate']
      };

      const result = await crisisDetectionService.triggerCrisisResponse(criticalEvent);

      expect(result.actionsTriggered).toContain('immediate_988_connection');
      expect(result.actionsTriggered).toContain('emergency_contacts_notification');
      expect(result.actionsTriggered).toContain('safety_plan_activation');
      expect(result.escalationLevel).toBe('immediate');
    });

    it('should provide appropriate resources for moderate risk', async () => {
      const moderateEvent = {
        userId: 'user-456',
        riskLevel: 'moderate',
        confidence: 0.75,
        triggers: ['mood_decline', 'isolation_indicators']
      };

      const result = await crisisDetectionService.triggerCrisisResponse(moderateEvent);

      expect(result.resources).toContain('crisis_text_line');
      expect(result.resources).toContain('local_support_groups');
      expect(result.resources).toContain('coping_strategies');
      expect(result.escalationLevel).toBe('supportive');
    });

    it('should log crisis events securely', async () => {
      const crisisEvent = {
        userId: 'user-789',
        content: 'Sensitive crisis information',
        riskLevel: 'high',
        timestamp: new Date()
      };

      await crisisDetectionService.logCrisisEvent(crisisEvent);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive crisis information')
      );
      expect(mockApiClient.post).toHaveBeenCalledWith('/crisis-events', {
        userId: 'user-789',
        content: expect.stringContaining('encrypted_'),
        riskLevel: 'high',
        timestamp: expect.any(Date)
      });
    });

    it('should handle response triggering failures gracefully', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      const event = {
        userId: 'user-123',
        riskLevel: 'high',
        confidence: 0.8
      };

      const result = await crisisDetectionService.triggerCrisisResponse(event);

      expect(result.success).toBe(false);
      expect(result.fallbackActivated).toBe(true);
      expect(result.offlineResources).toContain('local_emergency_services');
    });
  });

  describe('Crisis History and Analytics', () => {
    it('should retrieve user crisis history', async () => {
      const mockHistory = [
        {
          id: 'crisis-1',
          timestamp: new Date('2024-01-15'),
          riskLevel: 'moderate',
          resolved: true,
          resolution: 'therapy_session'
        },
        {
          id: 'crisis-2',
          timestamp: new Date('2024-01-20'),
          riskLevel: 'high',
          resolved: true,
          resolution: '988_connection'
        }
      ];

      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify(mockHistory.map(h => ({ ...h, content: `encrypted_${h.id}` })))
      );

      const history = await crisisDetectionService.getCrisisHistory('user-123');

      expect(history).toHaveLength(2);
      expect(history[0].riskLevel).toBe('moderate');
      expect(history[1].riskLevel).toBe('high');
      expect(mockEncryptionService.decrypt).toHaveBeenCalledTimes(2);
    });

    it('should identify crisis patterns', async () => {
      const historyData = [
        { timestamp: new Date('2024-01-15T22:30:00'), riskLevel: 'high' },
        { timestamp: new Date('2024-01-22T23:15:00'), riskLevel: 'moderate' },
        { timestamp: new Date('2024-01-29T21:45:00'), riskLevel: 'high' },
        { timestamp: new Date('2024-02-05T22:00:00'), riskLevel: 'critical' }
      ];

      const patterns = await crisisDetectionService.identifyPatterns(historyData);

      expect(patterns.timeOfDayPattern).toContain('late_evening');
      expect(patterns.frequencyPattern).toBe('weekly');
      expect(patterns.escalationTrend).toBe('increasing');
      expect(patterns.predictiveIndicators).toContain('time_based_risk');
    });

    it('should generate crisis analytics', async () => {
      const analytics = await crisisDetectionService.generateAnalytics('user-123', {
        timeframe: '30_days'
      });

      expect(analytics).toHaveProperty('totalEvents');
      expect(analytics).toHaveProperty('riskLevelDistribution');
      expect(analytics).toHaveProperty('resolutionMethods');
      expect(analytics).toHaveProperty('averageResolutionTime');
      expect(analytics).toHaveProperty('preventionRecommendations');
    });
  });

  describe('Crisis Settings and Configuration', () => {
    it('should update crisis detection sensitivity', async () => {
      const settings = {
        sensitivity: 0.75,
        autoEscalation: true,
        notificationPreferences: {
          emergencyContacts: true,
          therapist: true,
          familyMembers: false
        }
      };

      await crisisDetectionService.updateSettings('user-123', settings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'crisisSettings_user-123',
        expect.stringContaining('0.75')
      );
      expect(mockApiClient.post).toHaveBeenCalledWith('/crisis-settings', {
        userId: 'user-123',
        ...settings
      });
    });

    it('should retrieve user crisis settings', async () => {
      const mockSettings = {
        sensitivity: 0.8,
        autoEscalation: false,
        customKeywords: ['trigger_word_1', 'trigger_word_2']
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockSettings));

      const settings = await crisisDetectionService.getSettings('user-123');

      expect(settings.sensitivity).toBe(0.8);
      expect(settings.autoEscalation).toBe(false);
      expect(settings.customKeywords).toContain('trigger_word_1');
    });

    it('should validate settings before saving', async () => {
      const invalidSettings = {
        sensitivity: 1.5, // Invalid range
        autoEscalation: 'maybe', // Invalid type
        customKeywords: 'not_an_array'
      };

      await expect(crisisDetectionService.updateSettings('user-123', invalidSettings))
        .rejects.toThrow(/invalid.*settings/i);
    });
  });
});

describe('Crisis 988 Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.post.mockResolvedValue({ data: { success: true } });
  });

  describe('988 Connection Management', () => {
    it('should establish connection to 988 lifeline', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          sessionId: 'session-988-123',
          waitTime: 120,
          counselorInfo: {
            name: 'Crisis Counselor',
            specializations: ['depression', 'anxiety']
          }
        }
      });

      const result = await crisis988Service.connect({
        userId: 'user-123',
        language: 'english',
        urgency: 'high'
      });

      expect(result.sessionId).toBe('session-988-123');
      expect(result.waitTime).toBe(120);
      expect(mockApiClient.post).toHaveBeenCalledWith('/crisis/988/connect', {
        userId: 'user-123',
        language: 'english',
        urgency: 'high'
      });
    });

    it('should handle 988 service unavailability', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' }
        }
      });

      const result = await crisis988Service.connect({ userId: 'user-123' });

      expect(result.success).toBe(false);
      expect(result.fallbackOptions).toContain('crisis_text_line');
      expect(result.fallbackOptions).toContain('local_crisis_centers');
      expect(result.directDialNumber).toBe('988');
    });

    it('should provide real-time status updates', async () => {
      const statusCallback = jest.fn();
      
      await crisis988Service.connect({
        userId: 'user-123',
        onStatusUpdate: statusCallback
      });

      // Simulate status updates via WebSocket
      const ws = new MockWebSocket('ws://crisis988.test');
      
      await new Promise(resolve => {
        ws.onopen = () => {
          ws.send(JSON.stringify({ 
            type: 'status_update',
            status: 'connecting',
            position: 3
          }));
        };
        
        ws.onmessage = () => {
          expect(statusCallback).toHaveBeenCalledWith(
            expect.objectContaining({
              status: 'connecting',
              position: 3
            })
          );
          resolve(true);
        };
      });
    });

    it('should support multilingual connections', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          sessionId: 'session-es-456',
          language: 'spanish',
          counselorInfo: {
            languages: ['spanish', 'english']
          }
        }
      });

      const result = await crisis988Service.connect({
        userId: 'user-456',
        language: 'spanish'
      });

      expect(result.language).toBe('spanish');
      expect(result.counselorInfo.languages).toContain('spanish');
    });
  });

  describe('Crisis Assessment and Triage', () => {
    it('should perform crisis assessment before connection', async () => {
      const crisisData = {
        userId: 'user-123',
        riskIndicators: ['suicidal_ideation', 'plan_present'],
        immediateRisk: true,
        location: { lat: 40.7128, lng: -74.0060 }
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          assessment: {
            riskLevel: 'critical',
            priority: 'emergency',
            recommendedAction: 'immediate_intervention'
          },
          sessionId: 'priority-session-789'
        }
      });

      const result = await crisis988Service.assessAndConnect(crisisData);

      expect(result.assessment.riskLevel).toBe('critical');
      expect(result.assessment.priority).toBe('emergency');
      expect(mockApiClient.post).toHaveBeenCalledWith('/crisis/988/assess-connect', 
        expect.objectContaining({
          ...crisisData,
          timestamp: expect.any(Date)
        })
      );
    });

    it('should escalate to emergency services for imminent risk', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          escalated: true,
          emergencyServices: {
            contacted: true,
            incidentNumber: 'INC-2024-001'
          },
          sessionId: 'emergency-session-999'
        }
      });

      const imminentRiskData = {
        userId: 'user-789',
        riskIndicators: ['suicidal_plan', 'means_available', 'timeline_immediate'],
        location: { lat: 40.7128, lng: -74.0060 }
      };

      const result = await crisis988Service.assessAndConnect(imminentRiskData);

      expect(result.escalated).toBe(true);
      expect(result.emergencyServices.contacted).toBe(true);
      expect(result.emergencyServices.incidentNumber).toBe('INC-2024-001');
    });
  });

  describe('Session Management', () => {
    it('should maintain active session state', async () => {
      const sessionId = 'session-123';
      
      await crisis988Service.connect({ userId: 'user-123' });
      
      const sessionStatus = await crisis988Service.getSessionStatus(sessionId);
      
      expect(sessionStatus.active).toBe(true);
      expect(sessionStatus.duration).toBeGreaterThan(0);
    });

    it('should end session properly', async () => {
      const sessionId = 'session-123';
      
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          summary: {
            duration: 1800, // 30 minutes
            outcome: 'safety_plan_created',
            followUpScheduled: true
          }
        }
      });

      const result = await crisis988Service.endSession(sessionId, {
        reason: 'resolved',
        userFeedback: 'very_helpful'
      });

      expect(result.summary.outcome).toBe('safety_plan_created');
      expect(result.summary.followUpScheduled).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(`/crisis/988/sessions/${sessionId}/end`, {
        reason: 'resolved',
        userFeedback: 'very_helpful'
      });
    });
  });
});

describe('Emergency Escalation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060
            }
          });
        })
      },
      writable: true
    });
  });

  describe('Emergency Service Integration', () => {
    it('should connect to local emergency services', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          services: [
            {
              name: 'City Crisis Center',
              phone: '555-CRISIS',
              address: '123 Help St, City, State',
              distance: 2.5,
              availability: 'immediate'
            }
          ]
        }
      });

      const result = await emergencyEscalationService.findLocalServices({
        latitude: 40.7128,
        longitude: -74.0060
      });

      expect(result.services).toHaveLength(1);
      expect(result.services[0].name).toBe('City Crisis Center');
      expect(result.services[0].distance).toBe(2.5);
    });

    it('should contact emergency services with crisis context', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          callInitiated: true,
          incidentNumber: 'CRISIS-2024-001',
          dispatchTime: new Date(),
          estimatedArrival: 15
        }
      });

      const crisisContext = {
        userId: 'user-123',
        riskLevel: 'critical',
        location: { lat: 40.7128, lng: -74.0060 },
        mentalHealthCrisis: true,
        suicidalIdeation: true,
        weaponsPresent: false
      };

      const result = await emergencyEscalationService.contactEmergencyServices(crisisContext);

      expect(result.callInitiated).toBe(true);
      expect(result.incidentNumber).toBe('CRISIS-2024-001');
      expect(result.estimatedArrival).toBe(15);
    });

    it('should handle emergency service contact failures', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await emergencyEscalationService.contactEmergencyServices({
        userId: 'user-123',
        riskLevel: 'high'
      });

      expect(result.success).toBe(false);
      expect(result.fallbackInstructions).toContain('dial 911 directly');
      expect(result.alternativeResources).toContain('988');
    });
  });

  describe('Emergency Contact Notification', () => {
    it('should notify designated emergency contacts', async () => {
      const emergencyContacts = [
        { name: 'John Doe', phone: '+1234567890', relationship: 'spouse' },
        { name: 'Jane Smith', phone: '+0987654321', relationship: 'parent' }
      ];

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          notificationsSent: 2,
          responses: [
            { contact: 'John Doe', status: 'delivered', timestamp: new Date() },
            { contact: 'Jane Smith', status: 'delivered', timestamp: new Date() }
          ]
        }
      });

      const result = await emergencyEscalationService.notifyEmergencyContacts({
        userId: 'user-123',
        contacts: emergencyContacts,
        crisisLevel: 'high',
        message: 'Your loved one may need immediate support'
      });

      expect(result.notificationsSent).toBe(2);
      expect(result.responses).toHaveLength(2);
      expect(result.responses[0].status).toBe('delivered');
    });

    it('should handle contact notification failures', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          errors: [
            { contact: 'Invalid Contact', error: 'Phone number invalid' }
          ],
          partialSuccess: true,
          notificationsSent: 1
        }
      });

      const result = await emergencyEscalationService.notifyEmergencyContacts({
        userId: 'user-123',
        contacts: [
          { name: 'Valid Contact', phone: '+1234567890' },
          { name: 'Invalid Contact', phone: 'invalid' }
        ]
      });

      expect(result.partialSuccess).toBe(true);
      expect(result.notificationsSent).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Crisis Escalation Workflow', () => {
    it('should execute full escalation workflow for critical risk', async () => {
      const criticalCrisis = {
        userId: 'user-123',
        riskLevel: 'critical',
        triggers: ['suicidal_plan', 'means_available'],
        location: { lat: 40.7128, lng: -74.0060 },
        emergencyContacts: [
          { name: 'Emergency Contact', phone: '+1234567890' }
        ]
      };

      mockApiClient.post
        .mockResolvedValueOnce({ // 988 connection
          data: { success: true, sessionId: '988-session-123' }
        })
        .mockResolvedValueOnce({ // Emergency services
          data: { success: true, incidentNumber: 'INC-2024-001' }
        })
        .mockResolvedValueOnce({ // Contact notification
          data: { success: true, notificationsSent: 1 }
        });

      const result = await emergencyEscalationService.executeEscalationWorkflow(criticalCrisis);

      expect(result.steps).toContain('988_connection_initiated');
      expect(result.steps).toContain('emergency_services_contacted');
      expect(result.steps).toContain('emergency_contacts_notified');
      expect(result.allStepsCompleted).toBe(true);
    });

    it('should continue workflow even if some steps fail', async () => {
      mockApiClient.post
        .mockRejectedValueOnce(new Error('988 unavailable')) // 988 fails
        .mockResolvedValueOnce({ // Emergency services succeeds
          data: { success: true, incidentNumber: 'INC-2024-002' }
        })
        .mockResolvedValueOnce({ // Contact notification succeeds
          data: { success: true, notificationsSent: 1 }
        });

      const result = await emergencyEscalationService.executeEscalationWorkflow({
        userId: 'user-456',
        riskLevel: 'critical'
      });

      expect(result.steps).toContain('emergency_services_contacted');
      expect(result.steps).toContain('emergency_contacts_notified');
      expect(result.failures).toContain('988_connection_failed');
      expect(result.partialSuccess).toBe(true);
    });
  });

  describe('Geographic Emergency Services', () => {
    it('should find nearest hospitals with mental health services', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          hospitals: [
            {
              name: 'Mental Health Hospital',
              address: '456 Care Ave',
              distance: 3.2,
              mentalHealthServices: true,
              emergencyRoom: true,
              phone: '555-HOSPITAL'
            }
          ]
        }
      });

      const result = await emergencyEscalationService.findNearestHospitals({
        latitude: 40.7128,
        longitude: -74.0060,
        mentalHealthOnly: true
      });

      expect(result.hospitals).toHaveLength(1);
      expect(result.hospitals[0].mentalHealthServices).toBe(true);
      expect(result.hospitals[0].distance).toBe(3.2);
    });

    it('should handle location service failures', async () => {
      navigator.geolocation.getCurrentPosition = jest.fn().mockImplementation((success, error) => {
        error({ code: 1, message: 'Location access denied' });
      });

      const result = await emergencyEscalationService.findNearestHospitals();

      expect(result.success).toBe(false);
      expect(result.error).toContain('location');
      expect(result.fallbackInstructions).toContain('dial 911');
    });
  });

  describe('Crisis De-escalation', () => {
    it('should provide de-escalation resources', async () => {
      const result = await emergencyEscalationService.getDeescalationResources({
        riskLevel: 'moderate',
        triggers: ['anxiety', 'panic'],
        userPreferences: ['breathing_exercises', 'guided_meditation']
      });

      expect(result.resources).toContain('breathing_exercises');
      expect(result.resources).toContain('guided_meditation');
      expect(result.immediateActions).toContain('grounding_technique');
      expect(result.followUpActions).toContain('schedule_therapy');
    });

    it('should track de-escalation effectiveness', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, trackingId: 'track-123' }
      });

      await emergencyEscalationService.trackDeescalation({
        userId: 'user-123',
        initialRisk: 'high',
        interventionsUsed: ['breathing_exercise', 'crisis_chat'],
        finalRisk: 'moderate',
        timeToStabilize: 1800 // 30 minutes
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/crisis/deescalation-tracking', {
        userId: 'user-123',
        initialRisk: 'high',
        interventionsUsed: ['breathing_exercise', 'crisis_chat'],
        finalRisk: 'moderate',
        timeToStabilize: 1800
      });
    });
  });
});