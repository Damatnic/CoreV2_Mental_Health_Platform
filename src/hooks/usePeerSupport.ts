/**
 * Peer Support Hook
 *
 * Comprehensive React hook for managing peer support connections,
 * matching, and communication within the mental health platform
 *
 * Features:
 * - Peer matching based on preferences and compatibility
 * - Real-time peer connection management
 * - Support session scheduling and tracking
 * - Peer availability and status management
 * - Anonymous and verified peer connections
 * - Crisis escalation for peer supporters
 * - Peer feedback and rating system
 * - Cultural and language matching
 *
 * @license Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

// Peer Profile Interface
interface PeerProfile {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  avatar?: string;
  bio?: string;
  languages: string[];
  timeZone: string;
  specializations: string[];
  experienceLevel: 'peer' | 'experienced' | 'mentor' | 'professional';
  availability: {
    status: 'available' | 'busy' | 'away' | 'offline';
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
    nextAvailable?: Date;
  };
  preferences: {
    ageRange: [number, number];
    genderPreference?: 'any' | 'same' | 'different';
    culturalBackground?: string[];
    communicationStyle: 'text' | 'voice' | 'video' | 'any';
    topicsOfInterest: string[];
  };
  stats: {
    totalSessions: number;
    rating: number;
    responseTime: number; // in minutes
    completionRate: number; // percentage
  };
  verificationStatus: 'unverified' | 'pending' | 'verified';
  joinedDate: Date;
  lastActive: Date;
}

// Connection Request Interface
interface ConnectionRequest {
  id: string;
  fromPeerId: string;
  toPeerId: string;
  message?: string;
  requestedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sessionType: 'chat' | 'voice' | 'video';
  urgency: 'low' | 'normal' | 'high' | 'crisis';
  topics: string[];
}

// Peer Session Interface
interface PeerSession {
  id: string;
  participants: string[];
  type: 'chat' | 'voice' | 'video';
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  topic: string;
  notes?: string;
  feedback?: {
    peerId: string;
    rating: number;
    comment?: string;
  }[];
  crisisEscalated?: boolean;
}

// Match Criteria Interface
interface MatchCriteria {
  preferredLanguages?: string[];
  experienceLevel?: PeerProfile['experienceLevel'][];
  timeZonePreference?: string[];
  topicsOfInterest?: string[];
  availabilityWindow?: {
    start: Date;
    end: Date;
  };
  communicationStyle?: PeerProfile['preferences']['communicationStyle'];
  genderPreference?: PeerProfile['preferences']['genderPreference'];
  culturalBackground?: string[];
}

// Hook Return Interface
interface UsePeerSupportReturn {
  // State
  userProfile: PeerProfile | null;
  availablePeers: PeerProfile[];
  connectionRequests: ConnectionRequest[];
  activeSessions: PeerSession[];
  matches: PeerProfile[];
  isLoading: boolean;
  error: string | null;

  // Actions
  findMatches: (criteria?: MatchCriteria) => Promise<void>;
  sendConnectionRequest: (peerId: string, message?: string, sessionType?: ConnectionRequest['sessionType']) => Promise<void>;
  acceptConnectionRequest: (requestId: string) => Promise<void>;
  declineConnectionRequest: (requestId: string, reason?: string) => Promise<void>;
  startSession: (peerId: string, type: PeerSession['type']) => Promise<string>;
  endSession: (sessionId: string, feedback?: { rating: number; comment?: string }) => Promise<void>;
  updateAvailability: (status: PeerProfile['availability']['status']) => Promise<void>;
  updateProfile: (updates: Partial<PeerProfile>) => Promise<void>;
  reportPeer: (peerId: string, reason: string, description: string) => Promise<void>;
  blockPeer: (peerId: string) => Promise<void>;
  escalateToCrisis: (sessionId: string, reason: string) => Promise<void>;

  // Utility
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// Mock data for development
const MOCK_USER_PROFILE: PeerProfile = {
  id: 'user-123',
  displayName: 'Sarah M.',
  isAnonymous: false,
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
  bio: 'Mental health advocate with experience in anxiety and depression support.',
  languages: ['English', 'Spanish'],
  timeZone: 'America/New_York',
  specializations: ['anxiety', 'depression', 'mindfulness'],
  experienceLevel: 'experienced',
  availability: {
    status: 'available',
    schedule: [
      { day: 'monday', startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'friday', startTime: '09:00', endTime: '17:00' }
    ],
    nextAvailable: new Date()
  },
  preferences: {
    ageRange: [18, 65],
    genderPreference: 'any',
    culturalBackground: ['North American'],
    communicationStyle: 'any',
    topicsOfInterest: ['anxiety', 'depression', 'mindfulness', 'relationships']
  },
  stats: {
    totalSessions: 24,
    rating: 4.8,
    responseTime: 15,
    completionRate: 95
  },
  verificationStatus: 'verified',
  joinedDate: new Date('2023-01-15'),
  lastActive: new Date()
};

const MOCK_AVAILABLE_PEERS: PeerProfile[] = [
  {
    id: 'peer-456',
    displayName: 'Alex R.',
    isAnonymous: false,
    bio: 'Peer supporter specializing in anxiety and stress management.',
    languages: ['English'],
    timeZone: 'America/Los_Angeles',
    specializations: ['anxiety', 'stress'],
    experienceLevel: 'peer',
    availability: {
      status: 'available',
      schedule: [
        { day: 'monday', startTime: '10:00', endTime: '18:00' }
      ]
    },
    preferences: {
      ageRange: [20, 50],
      communicationStyle: 'text',
      topicsOfInterest: ['anxiety', 'stress', 'work-life-balance']
    },
    stats: {
      totalSessions: 12,
      rating: 4.5,
      responseTime: 20,
      completionRate: 88
    },
    verificationStatus: 'verified',
    joinedDate: new Date('2023-03-20'),
    lastActive: new Date()
  },
  {
    id: 'peer-789',
    displayName: 'Jordan K.',
    isAnonymous: true,
    bio: 'Anonymous peer supporter with lived experience in depression recovery.',
    languages: ['English', 'French'],
    timeZone: 'America/Toronto',
    specializations: ['depression', 'recovery'],
    experienceLevel: 'experienced',
    availability: {
      status: 'available',
      schedule: [
        { day: 'tuesday', startTime: '14:00', endTime: '20:00' }
      ]
    },
    preferences: {
      ageRange: [25, 45],
      communicationStyle: 'any',
      topicsOfInterest: ['depression', 'recovery', 'life-transitions']
    },
    stats: {
      totalSessions: 31,
      rating: 4.9,
      responseTime: 12,
      completionRate: 92
    },
    verificationStatus: 'verified',
    joinedDate: new Date('2022-11-10'),
    lastActive: new Date()
  }
];

/**
 * Custom hook for peer support functionality
 */
export const usePeerSupport = (): UsePeerSupportReturn => {
  // State management
  const [userProfile, setUserProfile] = useState<PeerProfile | null>(null);
  const [availablePeers, setAvailablePeers] = useState<PeerProfile[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<PeerSession[]>([]);
  const [matches, setMatches] = useState<PeerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialized = useRef(false);

  // Initialize the hook
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializePeerSupport();
    }
  }, []);

  const initializePeerSupport = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserProfile(MOCK_USER_PROFILE);
      setAvailablePeers(MOCK_AVAILABLE_PEERS);
      setMatches(MOCK_AVAILABLE_PEERS.slice(0, 2));
      
      logger.info('Peer support initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize peer support:', err);
      setError('Failed to initialize peer support');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Find peer matches based on criteria
  const findMatches = useCallback(async (criteria?: MatchCriteria) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate matching algorithm
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let matchedPeers = MOCK_AVAILABLE_PEERS;
      
      if (criteria?.preferredLanguages) {
        matchedPeers = matchedPeers.filter(peer => 
          peer.languages.some(lang => criteria.preferredLanguages!.includes(lang))
        );
      }
      
      if (criteria?.experienceLevel) {
        matchedPeers = matchedPeers.filter(peer => 
          criteria.experienceLevel!.includes(peer.experienceLevel)
        );
      }

      if (criteria?.topicsOfInterest) {
        matchedPeers = matchedPeers.filter(peer =>
          peer.specializations.some(spec => criteria.topicsOfInterest!.includes(spec))
        );
      }

      setMatches(matchedPeers);
      logger.info('Found peer matches:', matchedPeers.length);
    } catch (err) {
      logger.error('Failed to find matches:', err);
      setError('Failed to find peer matches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send connection request to a peer
  const sendConnectionRequest = useCallback(async (
    peerId: string, 
    message?: string, 
    sessionType: ConnectionRequest['sessionType'] = 'chat'
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newRequest: ConnectionRequest = {
        id: `req-${Date.now()}`,
        fromPeerId: userProfile?.id || 'current-user',
        toPeerId: peerId,
        message,
        requestedAt: new Date(),
        status: 'pending',
        sessionType,
        urgency: 'normal',
        topics: []
      };

      setConnectionRequests(prev => [...prev, newRequest]);
      logger.info('Connection request sent to:', peerId);
    } catch (err) {
      logger.error('Failed to send connection request:', err);
      setError('Failed to send connection request');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  // Accept connection request
  const acceptConnectionRequest = useCallback(async (requestId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      setConnectionRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'accepted' as const }
            : req
        )
      );

      logger.info('Connection request accepted:', requestId);
    } catch (err) {
      logger.error('Failed to accept connection request:', err);
      setError('Failed to accept connection request');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Decline connection request
  const declineConnectionRequest = useCallback(async (requestId: string, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      setConnectionRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'declined' as const }
            : req
        )
      );

      logger.info('Connection request declined:', requestId, reason);
    } catch (err) {
      logger.error('Failed to decline connection request:', err);
      setError('Failed to decline connection request');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start peer session
  const startSession = useCallback(async (peerId: string, type: PeerSession['type']): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 600));

      const sessionId = `session-${Date.now()}`;
      const newSession: PeerSession = {
        id: sessionId,
        participants: [userProfile?.id || 'current-user', peerId],
        type,
        status: 'active',
        startTime: new Date(),
        topic: 'General Support'
      };

      setActiveSessions(prev => [...prev, newSession]);
      logger.info('Peer session started:', sessionId);
      
      return sessionId;
    } catch (err) {
      logger.error('Failed to start session:', err);
      setError('Failed to start peer session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  // End peer session
  const endSession = useCallback(async (
    sessionId: string, 
    feedback?: { rating: number; comment?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 400));

      setActiveSessions(prev => 
        prev.map(session => {
          if (session.id === sessionId) {
            const endTime = new Date();
            const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
            
            return {
              ...session,
              status: 'ended' as const,
              endTime,
              duration,
              feedback: feedback ? [{
                peerId: userProfile?.id || 'current-user',
                ...feedback
              }] : undefined
            };
          }
          return session;
        })
      );

      logger.info('Peer session ended:', sessionId);
    } catch (err) {
      logger.error('Failed to end session:', err);
      setError('Failed to end peer session');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  // Update availability status
  const updateAvailability = useCallback(async (status: PeerProfile['availability']['status']) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      setUserProfile(prev => prev ? {
        ...prev,
        availability: {
          ...prev.availability,
          status
        }
      } : null);

      logger.info('Availability updated to:', status);
    } catch (err) {
      logger.error('Failed to update availability:', err);
      setError('Failed to update availability');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<PeerProfile>) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      logger.info('Profile updated successfully');
    } catch (err) {
      logger.error('Failed to update profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Report peer
  const reportPeer = useCallback(async (peerId: string, reason: string, description: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 600));

      logger.warn('Peer reported:', { peerId, reason, description });
      // In a real implementation, this would send a report to moderators
    } catch (err) {
      logger.error('Failed to report peer:', err);
      setError('Failed to report peer');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Block peer
  const blockPeer = useCallback(async (peerId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 400));

      // Remove blocked peer from available peers and matches
      setAvailablePeers(prev => prev.filter(peer => peer.id !== peerId));
      setMatches(prev => prev.filter(peer => peer.id !== peerId));
      
      logger.info('Peer blocked:', peerId);
    } catch (err) {
      logger.error('Failed to block peer:', err);
      setError('Failed to block peer');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Escalate session to crisis support
  const escalateToCrisis = useCallback(async (sessionId: string, reason: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      setActiveSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, crisisEscalated: true }
            : session
        )
      );

      logger.warn('Session escalated to crisis support:', { sessionId, reason });
      // In a real implementation, this would notify crisis support team
    } catch (err) {
      logger.error('Failed to escalate to crisis support:', err);
      setError('Failed to escalate to crisis support');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await initializePeerSupport();
  }, [initializePeerSupport]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    userProfile,
    availablePeers,
    connectionRequests,
    activeSessions,
    matches,
    isLoading,
    error,

    // Actions
    findMatches,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    startSession,
    endSession,
    updateAvailability,
    updateProfile,
    reportPeer,
    blockPeer,
    escalateToCrisis,

    // Utility
    refreshData,
    clearError
  };
};

export type { 
  PeerProfile, 
  ConnectionRequest, 
  PeerSession, 
  MatchCriteria, 
  UsePeerSupportReturn 
};