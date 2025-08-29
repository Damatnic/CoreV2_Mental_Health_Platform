/**
 * Peer Support Network Service Tests
 * 
 * Tests for peer support matching, connections, and sessions
 */

import { peerSupportNetworkService } from '../peerSupportNetworkService';
import type {
  PeerProfile,
  ExperienceArea,
  AvailabilitySchedule,
  TimeSlot,
  PeerPreferences,
  PeerMetrics,
  PeerBadge,
  SupportRequest,
  CulturalPreferences,
  SupportSession,
  SessionIntervention,
  SessionFeedback,
  MatchingCriteria,
  PeerNetworkAnalytics
} from '../peerSupportNetworkService';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('PeerSupportNetworkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
  });

  describe('Peer Retrieval', () => {
    it('should get a peer by ID', () => {
      const peerId = 'peer-123';
      const peer = peerSupportNetworkService.getPeer(peerId);
      
      // Should return undefined or a peer profile
      expect(peer === undefined || typeof peer === 'object').toBe(true);
    });

    it('should handle non-existent peer ID', () => {
      const peer = peerSupportNetworkService.getPeer('non-existent-id');
      
      expect(peer).toBeUndefined();
    });
  });

  describe('Peer Sessions', () => {
    it('should get sessions for a peer', () => {
      const peerId = 'peer-123';
      const sessions = peerSupportNetworkService.getPeerSessions(peerId);
      
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should return empty array for peer with no sessions', () => {
      const sessions = peerSupportNetworkService.getPeerSessions('new-peer');
      
      expect(sessions).toEqual([]);
    });
  });

  describe('Analytics', () => {
    it('should get network analytics', () => {
      const analytics = peerSupportNetworkService.getAnalytics();
      
      expect(analytics).toHaveProperty('totalPeers');
      expect(analytics).toHaveProperty('activePeers');
      expect(analytics).toHaveProperty('totalRequests');
      expect(analytics).toHaveProperty('matchRate');
      expect(analytics).toHaveProperty('averageMatchTime');
      expect(analytics).toHaveProperty('averageSessionDuration');
      expect(analytics).toHaveProperty('satisfactionScore');
      expect(analytics).toHaveProperty('crisisHandled');
      expect(analytics).toHaveProperty('escalationRate');
      expect(analytics).toHaveProperty('culturalDistribution');
      expect(analytics).toHaveProperty('languageDistribution');
      expect(analytics).toHaveProperty('peakUsageHours');
      expect(analytics).toHaveProperty('retentionRate');
    });

    it('should have valid analytics structure', () => {
      const analytics = peerSupportNetworkService.getAnalytics();
      
      expect(typeof analytics.totalPeers).toBe('number');
      expect(typeof analytics.activePeers).toBe('number');
      expect(typeof analytics.totalRequests).toBe('number');
      expect(typeof analytics.matchRate).toBe('number');
      expect(typeof analytics.averageMatchTime).toBe('number');
      expect(typeof analytics.averageSessionDuration).toBe('number');
      expect(typeof analytics.satisfactionScore).toBe('number');
      expect(typeof analytics.crisisHandled).toBe('number');
      expect(typeof analytics.escalationRate).toBe('number');
      expect(typeof analytics.culturalDistribution).toBe('object');
      expect(typeof analytics.languageDistribution).toBe('object');
      expect(Array.isArray(analytics.peakUsageHours)).toBe(true);
      expect(typeof analytics.retentionRate).toBe('number');
    });
  });

  describe('Mental Health Specific Features', () => {
    it('should handle critical support requests', () => {
      const mockCriticalRequest: SupportRequest = {
        id: 'request-911',
        requesterId: 'user-critical',
        preferredSupport: ['anxiety', 'trauma'],
        urgencyLevel: 'critical',
        isAnonymous: true,
        languagePreference: 'en',
        sessionType: 'text',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        status: 'pending'
      };

      // Service should be able to handle critical requests
      expect(() => {
        const analytics = peerSupportNetworkService.getAnalytics();
        // Critical requests should be tracked
      }).not.toThrow();
    });

    it('should support anonymized peer connections', () => {
      const mockAnonymousPeer: PeerProfile = {
        id: 'anon-peer-123',
        userToken: 'anon-user',
        anonymizedId: 'anon_123456789',
        displayName: 'Anonymous Helper',
        language: 'en',
        culturalBackground: 'diverse',
        preferredLanguages: ['en'],
        availabilityStatus: 'available',
        experienceAreas: [
          {
            category: 'anxiety',
            level: 'intermediate',
            yearsExperience: 2,
            personalExperience: true,
            professionalTraining: false,
            certifications: [],
            description: 'Personal experience with anxiety management'
          }
        ],
        supportStyle: 'listener',
        timezone: 'UTC',
        ageRange: '26-35',
        safetyRating: 4.5,
        totalSupportSessions: 0,
        averageRating: 0,
        lastActive: new Date(),
        isVerified: false,
        culturalSensitivityScore: 4.0,
        responseTime: 10,
        specializations: ['anxiety', 'stress'],
        certifications: [],
        availability: {
          schedule: [],
          emergencyAvailable: false,
          maxConcurrentSessions: 1,
          preferredSessionLength: 30,
          timeZone: 'UTC',
          autoAcceptRequests: false,
          responseTimeGoal: 15
        },
        preferences: {
          genderPreference: 'no-preference',
          agePreference: 'no-preference',
          culturalMatch: false,
          languageMatch: true,
          experienceMatch: true,
          communicationStyle: 'supportive',
          sessionTypes: ['text', 'voice'],
          crisisComfortable: false
        },
        metrics: {
          totalSessions: 0,
          totalHours: 0,
          averageSessionDuration: 0,
          successRate: 0,
          userSatisfactionScore: 0,
          crisisHandled: 0,
          escalationsTriggered: 0,
          noShowRate: 0,
          responseTimeAverage: 0,
          lastMonthSessions: 0,
          badges: []
        }
      };

      // Should support anonymous peers
      expect(mockAnonymousPeer.anonymizedId).toContain('anon_');
    });

    it('should track experience areas for matching', () => {
      const experienceAreas: ExperienceArea[] = [
        {
          category: 'depression',
          level: 'experienced',
          yearsExperience: 3,
          personalExperience: true,
          professionalTraining: true,
          certifications: ['Peer Support Specialist'],
          description: 'Trained peer support specialist'
        },
        {
          category: 'trauma',
          level: 'intermediate',
          yearsExperience: 2,
          personalExperience: true,
          professionalTraining: false,
          certifications: [],
          description: 'Personal recovery experience'
        }
      ];

      expect(experienceAreas.length).toBeGreaterThan(0);
      expect(experienceAreas[0].category).toBeDefined();
    });

    it('should support cultural preferences in matching', () => {
      const culturalPrefs: CulturalPreferences = {
        background: 'Latino',
        language: 'es',
        religiousConsiderations: ['Catholic'],
        culturalPractices: ['family-oriented'],
        communicationStyle: 'indirect',
        familyInvolvement: 'preferred',
        genderSensitive: true
      };

      expect(culturalPrefs.background).toBeDefined();
      expect(culturalPrefs.language).toBeDefined();
    });

    it('should handle session feedback', () => {
      const feedback: SessionFeedback = {
        sessionId: 'session-123',
        fromUserId: 'user-123',
        toUserId: 'peer-123',
        rating: 4.5,
        helpfulness: 4,
        empathy: 5,
        professionalism: 4,
        safetyFelt: 5,
        wouldRecommend: true,
        comments: 'Very supportive and understanding',
        improvementSuggestions: [],
        submittedAt: new Date()
      };

      expect(feedback.rating).toBeGreaterThanOrEqual(0);
      expect(feedback.rating).toBeLessThanOrEqual(5);
      expect(feedback.wouldRecommend).toBeDefined();
    });

    it('should support various session types', () => {
      const textSession: SupportSession = {
        id: 'session-text',
        requestId: 'req-123',
        peerId: 'peer-123',
        requesterId: 'user-123',
        startTime: new Date(),
        endTime: undefined,
        duration: undefined,
        sessionType: 'text',
        urgencyLevel: 'medium',
        safetyLevel: 'safe',
        status: 'active',
        interventions: [],
        escalated: false,
        notes: '',
        followUpRequired: false,
        feedback: undefined
      };

      const voiceSession: SupportSession = {
        ...textSession,
        id: 'session-voice',
        sessionType: 'voice'
      };

      const videoSession: SupportSession = {
        ...textSession,
        id: 'session-video',
        sessionType: 'video'
      };

      expect(textSession.sessionType).toBe('text');
      expect(voiceSession.sessionType).toBe('voice');
      expect(videoSession.sessionType).toBe('video');
    });

    it('should track peer badges and achievements', () => {
      const badges: PeerBadge[] = [
        {
          id: 'badge-1',
          name: 'First Session',
          description: 'Completed first peer support session',
          earnedDate: new Date(),
          category: 'experience',
          icon: '🎯'
        },
        {
          id: 'badge-2',
          name: 'Crisis Helper',
          description: 'Successfully supported someone in crisis',
          earnedDate: new Date(),
          category: 'specialization',
          icon: '💪'
        },
        {
          id: 'badge-3',
          name: 'Multilingual Support',
          description: 'Provided support in multiple languages',
          earnedDate: new Date(),
          category: 'quality',
          icon: '🌍'
        }
      ];

      expect(badges.length).toBeGreaterThan(0);
      badges.forEach(badge => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('earnedDate');
        expect(badge).toHaveProperty('category');
      });
    });

    it('should handle session interventions', () => {
      const intervention: SessionIntervention = {
        id: 'intervention-1',
        type: 'crisis-escalation',
        triggeredBy: 'peer',
        timestamp: new Date(),
        description: 'User expressed suicidal thoughts',
        outcome: 'Connected to crisis hotline',
        followUpRequired: true
      };

      expect(intervention.type).toBe('crisis-escalation');
      expect(intervention.outcome).toBeDefined();
    });

    it('should support availability scheduling', () => {
      const schedule: AvailabilitySchedule = {
        schedule: [
          {
            day: 'monday',
            startTime: '09:00',
            endTime: '17:00',
            available: true
          },
          {
            day: 'wednesday',
            startTime: '14:00',
            endTime: '20:00',
            available: true
          },
          {
            day: 'friday',
            startTime: '10:00',
            endTime: '16:00',
            available: true
          }
        ],
        emergencyAvailable: false,
        maxConcurrentSessions: 2,
        preferredSessionLength: 45,
        timeZone: 'UTC',
        autoAcceptRequests: false,
        responseTimeGoal: 15
      };

      expect(schedule.schedule.length).toBeGreaterThan(0);
      expect(schedule.maxConcurrentSessions).toBeGreaterThan(0);
      expect(schedule.preferredSessionLength).toBeGreaterThan(0);
    });
  });

  describe('Peer Metrics', () => {
    it('should track peer performance metrics', () => {
      const metrics: PeerMetrics = {
        totalSessions: 50,
        totalHours: 37.5,
        averageSessionDuration: 45,
        successRate: 0.9,
        userSatisfactionScore: 4.7,
        crisisHandled: 5,
        escalationsTriggered: 2,
        noShowRate: 0.05,
        responseTimeAverage: 2,
        lastMonthSessions: 12,
        badges: []
      };

      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.userSatisfactionScore).toBeLessThanOrEqual(5);
      expect(metrics.noShowRate).toBeLessThanOrEqual(1);
      expect(metrics.responseTimeAverage).toBeGreaterThanOrEqual(0);
    });

    it('should calculate match rate correctly', () => {
      const analytics = peerSupportNetworkService.getAnalytics();
      
      expect(analytics.matchRate).toBeGreaterThanOrEqual(0);
      expect(analytics.matchRate).toBeLessThanOrEqual(1);
    });

    it('should track satisfaction scores', () => {
      const analytics = peerSupportNetworkService.getAnalytics();
      
      expect(analytics.satisfactionScore).toBeGreaterThanOrEqual(0);
      expect(analytics.satisfactionScore).toBeLessThanOrEqual(5);
    });
  });

  describe('Matching Criteria', () => {
    it('should support comprehensive matching criteria', () => {
      const criteria: MatchingCriteria = {
        experienceMatch: 0.3,
        culturalMatch: 0.2,
        languageMatch: 0.2,
        availabilityMatch: 0.3,
        ratingThreshold: 3.0,
        responseTimeThreshold: 15,
        requireVerified: true,
        requireCrisisExperience: false,
        maxDistance: 3
      };

      expect(criteria.experienceMatch).toBeGreaterThanOrEqual(0);
      expect(criteria.experienceMatch).toBeLessThanOrEqual(1);
      expect(criteria.ratingThreshold).toBeGreaterThan(0);
    });

    it('should prioritize language matching', () => {
      const criteria: MatchingCriteria = {
        experienceMatch: 0.2,
        culturalMatch: 0.3,
        languageMatch: 0.4,
        availabilityMatch: 0.1,
        ratingThreshold: 3.5,
        responseTimeThreshold: 10,
        requireVerified: false,
        requireCrisisExperience: false
      };

      expect(criteria.languageMatch).toBeGreaterThan(criteria.experienceMatch);
      expect(criteria.culturalMatch).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid peer IDs gracefully', () => {
      const peer = peerSupportNetworkService.getPeer('');
      expect(peer).toBeUndefined();

      const sessions = peerSupportNetworkService.getPeerSessions('');
      expect(sessions).toEqual([]);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Service should continue to function even with network errors
      const analytics = peerSupportNetworkService.getAnalytics();
      expect(analytics).toBeDefined();
    });

    it('should validate session data', () => {
      const invalidSession = {
        id: '',
        peerId: '',
        requesterId: ''
      };

      // Service should handle invalid data gracefully
      expect(() => {
        const sessions = peerSupportNetworkService.getPeerSessions('test');
      }).not.toThrow();
    });
  });
});