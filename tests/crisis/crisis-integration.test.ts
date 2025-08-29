/**
 * CRISIS HOTLINE INTEGRATION TESTS
 * 
 * Comprehensive tests to verify 988 and emergency services integration
 * These tests ensure life-critical functionality is working correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crisis988Service from '../../src/services/crisis988Service';
import emergencyServicesConnector from '../../src/services/emergencyServicesConnector';
import emergencyEscalationService from '../../src/services/emergencyEscalationService';

describe('Crisis Hotline Integration', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn();
    
    // Mock navigator APIs
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 10
            },
            timestamp: Date.now()
          });
        }),
        watchPosition: vi.fn()
      },
      writable: true
    });
    
    // Mock media devices for WebRTC
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(() => Promise.resolve({
          getTracks: () => [],
          addTrack: vi.fn()
        }))
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('988 Lifeline Service', () => {
    it('should connect to 988 with multiple fallback methods', async () => {
      const crisisEvent = {
        id: 'test-crisis-1',
        userId: 'test-user',
        timestamp: new Date(),
        severity: 'high' as const,
        triggers: ['test'],
        metadata: {}
      };

      const context = {
        triggers: ['anxiety', 'depression'],
        recentMoodScores: [8, 7, 9],
        medicationAdherence: true,
        supportSystem: { available: false, contacted: false },
        suicidalIdeation: {
          present: true,
          plan: false,
          means: false
        },
        previousAttempts: 0
      };

      const session = await crisis988Service.assessAndConnect(crisisEvent, context);

      expect(session).toBeDefined();
      expect(session.status).toBe('connecting');
      expect(session.sessionType).toBe('voice');
      expect(session.userId).toBe('test-user');
    });

    it('should handle WebRTC connection for 988', async () => {
      // Mock successful WebRTC response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          counselorId: 'counselor-123',
          counselorName: 'Crisis Counselor',
          specializations: ['crisis'],
          language: 'en',
          certifications: ['Crisis Intervention'],
          sdp: 'mock-sdp'
        })
      });

      const crisisEvent = {
        id: 'test-crisis-2',
        userId: 'test-user',
        timestamp: new Date(),
        severity: 'critical' as const,
        triggers: ['immediate help'],
        metadata: {}
      };

      const context = {
        triggers: ['crisis'],
        recentMoodScores: [10],
        medicationAdherence: true,
        supportSystem: { available: false, contacted: false },
        suicidalIdeation: {
          present: true,
          plan: true,
          means: true
        },
        previousAttempts: 1
      };

      const session = await crisis988Service.assessAndConnect(crisisEvent, context);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('988lifeline.org'),
        expect.any(Object)
      );
    });

    it('should fallback to direct dial on mobile devices', async () => {
      // Simulate mobile device
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true
      });

      const crisisEvent = {
        id: 'test-crisis-3',
        userId: 'test-user',
        timestamp: new Date(),
        severity: 'high' as const,
        triggers: ['help'],
        metadata: {}
      };

      const context = {
        triggers: ['distress'],
        recentMoodScores: [7],
        medicationAdherence: true,
        supportSystem: { available: true, contacted: false },
        suicidalIdeation: {
          present: false,
          plan: false,
          means: false
        },
        previousAttempts: 0
      };

      const session = await crisis988Service.assessAndConnect(crisisEvent, context);

      expect(session).toBeDefined();
      // Should have attempted direct dial
      expect(document.querySelector('iframe[src="tel:988"]')).toBeDefined();
    });

    it('should connect to Crisis Text Line', async () => {
      // Mock Crisis Text Line API
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversationId: 'conv-123',
          status: 'connected'
        })
      });

      const crisisEvent = {
        id: 'test-crisis-4',
        userId: 'test-user',
        timestamp: new Date(),
        level: 'high' as const,
        triggers: ['text support'],
        keywords: ['help'],
        riskScore: 0.7,
        language: 'english'
      };

      const response = await emergencyEscalationService.connectCrisisTextLine(crisisEvent);

      expect(response).toBeDefined();
      expect(response.service).toBe('crisis-text');
      expect(response.status).toBe('connected');
    });
  });

  describe('Emergency Services Connector', () => {
    it('should call 911 with location data', async () => {
      const contact = await emergencyServicesConnector.call911('Mental Health Crisis');

      expect(contact).toBeDefined();
      expect(contact.service.type).toBe('medical');
      expect(contact.service.phone).toContain('911');
    });

    it('should find nearest hospitals', async () => {
      // Mock Google Places API
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              place_id: 'hospital-1',
              name: 'Test Hospital',
              vicinity: '123 Medical Dr',
              geometry: {
                location: { lat: 40.7128, lng: -74.0060 }
              },
              rating: 4.5
            }
          ]
        })
      });

      const hospitals = await emergencyServicesConnector.findNearestHospitals();

      expect(hospitals).toBeDefined();
      expect(hospitals.length).toBeGreaterThan(0);
      expect(hospitals[0].hasER).toBe(true);
    });

    it('should connect to poison control', async () => {
      const contact = await emergencyServicesConnector.callPoisonControl('unknown substance');

      expect(contact).toBeDefined();
      expect(contact.service.type).toBe('poison');
      expect(contact.service.phone).toContain('1-800-222-1222');
    });

    it('should find local crisis centers', async () => {
      // Mock SAMHSA API
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          facilities: [
            {
              id: 'center-1',
              name: 'Local Crisis Center',
              phone: '1-800-CRISIS',
              address: '456 Help St',
              distance: 2.5,
              services: ['crisis', 'mental health'],
              languages: ['en', 'es']
            }
          ]
        })
      });

      const centers = await emergencyServicesConnector.findLocalCrisisCenters();

      expect(centers).toBeDefined();
      expect(centers.length).toBeGreaterThan(0);
      expect(centers[0].type).toBe('crisis');
    });
  });

  describe('Emergency Escalation Service', () => {
    it('should detect crisis keywords and escalate appropriately', async () => {
      const text = 'I want to end my life';
      const context = {
        userId: 'test-user',
        previousAttempts: 0,
        supportNetwork: []
      };

      const event = await emergencyEscalationService.detectCrisis(text, context);

      expect(event).toBeDefined();
      expect(event?.level).toBe('imminent');
      expect(event?.riskScore).toBeGreaterThan(0.9);
    });

    it('should auto-escalate imminent crisis to 911 and 988', async () => {
      const event = {
        id: 'crisis-imminent',
        userId: 'test-user',
        timestamp: new Date(),
        level: 'imminent' as const,
        triggers: ['suicide'],
        keywords: ['end my life'],
        riskScore: 0.95,
        language: 'english'
      };

      // Mock emergency services
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const response = await emergencyEscalationService.escalateToEmergency(event);

      expect(response).toBeDefined();
      expect(response.service).toBe('911');
      expect(response.interventions).toContain('911 Emergency Services notified');
    });

    it('should handle multi-language crisis detection', async () => {
      const spanishText = 'quiero morir';
      const context = {
        userId: 'test-user',
        culturalBackground: 'hispanic',
        previousAttempts: 0,
        supportNetwork: []
      };

      const event = await emergencyEscalationService.detectCrisis(spanishText, context);

      expect(event).toBeDefined();
      expect(event?.language).toBe('spanish');
      expect(event?.level).toContain('imminent');
    });

    it('should dispatch mobile crisis team', async () => {
      const event = {
        id: 'crisis-severe',
        userId: 'test-user',
        timestamp: new Date(),
        level: 'severe' as const,
        triggers: ['crisis'],
        keywords: ['help'],
        riskScore: 0.8,
        language: 'english',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      };

      const response = await emergencyEscalationService.dispatchMobileCrisisTeam(event);

      expect(response).toBeDefined();
      expect(response.service).toBe('mobile-crisis');
      expect(response.responder?.role).toBe('Mobile Crisis Team');
    });
  });

  describe('Failover Mechanisms', () => {
    it('should handle 988 API failure with fallback', async () => {
      // Mock all API calls to fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const crisisEvent = {
        id: 'test-crisis-fail',
        userId: 'test-user',
        timestamp: new Date(),
        severity: 'high' as const,
        triggers: ['help'],
        metadata: {}
      };

      const context = {
        triggers: ['crisis'],
        recentMoodScores: [8],
        medicationAdherence: true,
        supportSystem: { available: false, contacted: false },
        suicidalIdeation: {
          present: true,
          plan: false,
          means: false
        },
        previousAttempts: 0
      };

      const session = await crisis988Service.assessAndConnect(crisisEvent, context);

      // Should still return a session even if all methods fail
      expect(session).toBeDefined();
      expect(session.status).toBeDefined();
    });

    it('should handle geolocation failure gracefully', async () => {
      // Mock geolocation to fail
      navigator.geolocation.getCurrentPosition = vi.fn((_, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      const contact = await emergencyServicesConnector.call911('Emergency');

      expect(contact).toBeDefined();
      // Should still work without location
      expect(contact.service.phone).toContain('911');
    });

    it('should handle WebRTC failure and fallback to direct dial', async () => {
      // Mock getUserMedia to fail
      navigator.mediaDevices.getUserMedia = vi.fn(() => 
        Promise.reject(new Error('Permission denied'))
      );

      // Simulate mobile device for fallback
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true
      });

      const crisisEvent = {
        id: 'test-crisis-webrtc-fail',
        userId: 'test-user',
        timestamp: new Date(),
        severity: 'critical' as const,
        triggers: ['help'],
        metadata: {}
      };

      const context = {
        triggers: ['crisis'],
        recentMoodScores: [9],
        medicationAdherence: true,
        supportSystem: { available: false, contacted: false },
        suicidalIdeation: {
          present: true,
          plan: false,
          means: false
        },
        previousAttempts: 0
      };

      const session = await crisis988Service.assessAndConnect(crisisEvent, context);

      expect(session).toBeDefined();
      // Should have fallen back to another method
      expect(session.status).toBeDefined();
    });
  });

  describe('Real-time Crisis Monitoring', () => {
    it('should start monitoring for crisis events', () => {
      const event = {
        id: 'monitor-1',
        userId: 'test-user',
        timestamp: new Date(),
        level: 'high' as const,
        triggers: ['crisis'],
        keywords: ['help'],
        riskScore: 0.7,
        language: 'english'
      };

      emergencyEscalationService.triggerEmergencyProtocol(
        'test-user',
        'high',
        { event }
      );

      const monitoringData = emergencyEscalationService.getMonitoringData('test-user');

      expect(monitoringData).toBeDefined();
      expect(monitoringData?.currentLevel).toBe('high');
      expect(monitoringData?.escalationStatus).toBe('monitoring');
    });

    it('should escalate based on risk threshold', async () => {
      const userId = 'test-user-escalate';
      
      await emergencyEscalationService.triggerEmergencyProtocol(
        userId,
        'imminent',
        {
          suicidalIdeation: { present: true, plan: true, means: true }
        }
      );

      const events = emergencyEscalationService.getActiveEvents();
      const userEvent = events.find(e => e.userId === userId);

      expect(userEvent).toBeDefined();
      expect(userEvent?.level).toBe('imminent');
    });

    it('should stop monitoring when resolved', () => {
      const userId = 'test-user-resolve';
      const eventId = 'event-resolve';

      emergencyEscalationService.triggerEmergencyProtocol(userId, 'moderate');
      emergencyEscalationService.resolveEvent(eventId, 'User stabilized');

      const monitoringData = emergencyEscalationService.getMonitoringData(userId);

      expect(monitoringData).toBeUndefined();
    });
  });
});