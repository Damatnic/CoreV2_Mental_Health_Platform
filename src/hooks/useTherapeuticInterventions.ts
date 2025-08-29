/**
 * Therapeutic Interventions Hook for Mental Health Platform
 *
 * Comprehensive hook for managing evidence-based therapeutic interventions
 * with crisis awareness, accessibility features, and professional integration.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from './useAccessibility';

// Types for therapeutic interventions
export type InterventionType = 
  | 'breathing' 
  | 'grounding' 
  | 'mindfulness' 
  | 'cognitive-restructuring'
  | 'behavioral-activation'
  | 'emotion-regulation'
  | 'crisis-intervention'
  | 'self-soothing'
  | 'progressive-relaxation'
  | 'guided-imagery';

export type CrisisLevel = 'low' | 'moderate' | 'high' | 'severe' | 'imminent';

export interface TherapeuticIntervention {
  id: string;
  type: InterventionType;
  title: string;
  description: string;
  instructions: string[];
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  crisisAppropriate: boolean;
  tags: string[];
  evidenceBase: string[];
  accessibility: {
    screenReaderFriendly: boolean;
    keyboardNavigable: boolean;
    reducedMotionVersion: boolean;
    cognitiveLoadLevel: 'low' | 'medium' | 'high';
  };
  audioGuided?: {
    url: string;
    duration: number;
    transcript: string;
  };
  visualAids?: {
    images: string[];
    animations: string[];
    descriptions: string[];
  };
  culturalAdaptations?: Record<string, {
    title: string;
    instructions: string[];
    culturalContext: string;
  }>;
}

export interface InterventionSession {
  id: string;
  interventionId: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  effectivenessRating?: number; // 1-10
  notes?: string;
  crisisLevel?: CrisisLevel;
  triggers?: string[];
  outcomes?: string[];
  professionalNotification?: boolean;
}

export interface InterventionState {
  availableInterventions: TherapeuticIntervention[];
  currentSession: InterventionSession | null;
  sessionHistory: InterventionSession[];
  personalizedRecommendations: TherapeuticIntervention[];
  crisisInterventions: TherapeuticIntervention[];
  isLoading: boolean;
  error: string | null;
}

// Sample interventions data
const sampleInterventions: TherapeuticIntervention[] = [
  {
    id: '1',
    type: 'breathing',
    title: '4-7-8 Breathing Technique',
    description: 'A calming breathing exercise that helps reduce anxiety and promote relaxation.',
    instructions: [
      'Sit or lie down in a comfortable position',
      'Place the tip of your tongue against the tissue ridge behind your upper front teeth',
      'Exhale completely through your mouth, making a whoosh sound',
      'Close your mouth and inhale quietly through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale through your mouth for 8 counts, making a whoosh sound',
      'Repeat the cycle 3-4 times'
    ],
    duration: 5,
    difficulty: 'beginner',
    crisisAppropriate: true,
    tags: ['anxiety', 'stress', 'sleep', 'quick-relief'],
    evidenceBase: ['Randomized Controlled Trial - Journal of Anxiety Research 2019'],
    accessibility: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      reducedMotionVersion: true,
      cognitiveLoadLevel: 'low'
    },
    audioGuided: {
      url: '/audio/interventions/478-breathing.mp3',
      duration: 300,
      transcript: 'Guided 4-7-8 breathing exercise with gentle voice instruction...'
    }
  },
  {
    id: '2',
    type: 'grounding',
    title: '5-4-3-2-1 Grounding Technique',
    description: 'A sensory grounding technique that helps bring awareness to the present moment.',
    instructions: [
      'Name 5 things you can see around you',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste'
    ],
    duration: 3,
    difficulty: 'beginner',
    crisisAppropriate: true,
    tags: ['grounding', 'anxiety', 'panic', 'present-moment'],
    evidenceBase: ['Clinical Psychology Review 2020', 'Trauma-Informed Care Guidelines'],
    accessibility: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      reducedMotionVersion: true,
      cognitiveLoadLevel: 'low'
    }
  },
  {
    id: '3',
    type: 'crisis-intervention',
    title: 'STOP Crisis Technique',
    description: 'Emergency intervention for acute crisis situations.',
    instructions: [
      'STOP - Pause whatever you are doing',
      'TAKE A BREATH - Three deep, slow breaths',
      'OBSERVE - Notice what you are feeling and thinking',
      'PROCEED - Choose a safe, helpful action'
    ],
    duration: 2,
    difficulty: 'beginner',
    crisisAppropriate: true,
    tags: ['crisis', 'emergency', 'self-harm-prevention', 'immediate-relief'],
    evidenceBase: ['Crisis Intervention Protocols 2021', 'Emergency Mental Health Guidelines'],
    accessibility: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      reducedMotionVersion: true,
      cognitiveLoadLevel: 'low'
    }
  }
];

export const useTherapeuticInterventions = () => {
  const { user } = useAuth();
  const { announceToScreenReader } = useAccessibility();

  const [state, setState] = useState<InterventionState>({
    availableInterventions: sampleInterventions,
    currentSession: null,
    sessionHistory: [],
    personalizedRecommendations: [],
    crisisInterventions: [],
    isLoading: false,
    error: null
  });

  // Initialize personalized recommendations
  useEffect(() => {
    if (user) {
      const recommendations = getPersonalizedRecommendations();
      const crisisInterventions = getCrisisInterventions();
      
      setState(prev => ({
        ...prev,
        personalizedRecommendations: recommendations,
        crisisInterventions
      }));
    }
  }, [user]);

  // Get personalized recommendations based on user history and preferences
  const getPersonalizedRecommendations = useCallback((): TherapeuticIntervention[] => {
    // Filter interventions based on user preferences and effectiveness
    return sampleInterventions.filter(intervention => 
      intervention.difficulty === 'beginner' || // Start with beginner-friendly
      intervention.tags.includes('anxiety') // Common need
    ).slice(0, 5);
  }, []);

  // Get crisis-appropriate interventions
  const getCrisisInterventions = useCallback((): TherapeuticIntervention[] => {
    return sampleInterventions.filter(intervention => 
      intervention.crisisAppropriate && 
      intervention.duration <= 5 && // Quick interventions for crisis
      intervention.accessibility.cognitiveLoadLevel === 'low'
    );
  }, []);

  // Start an intervention session
  const startIntervention = useCallback(async (
    interventionId: string, 
    crisisLevel?: CrisisLevel
  ): Promise<InterventionSession> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const intervention = state.availableInterventions.find(i => i.id === interventionId);
      if (!intervention) {
        throw new Error('Intervention not found');
      }

      const session: InterventionSession = {
        id: `session_${Date.now()}`,
        interventionId,
        startTime: new Date(),
        completed: false,
        crisisLevel
      };

      setState(prev => ({
        ...prev,
        currentSession: session,
        isLoading: false
      }));

      announceToScreenReader(`Started ${intervention.title} intervention. Duration: ${intervention.duration} minutes.`);

      // Notify professional if crisis level
      if (crisisLevel && ['high', 'severe', 'imminent'].includes(crisisLevel)) {
        await notifyProfessional(session);
      }

      return session;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start intervention'
      }));
      throw error;
    }
  }, [state.availableInterventions, announceToScreenReader]);

  // Complete an intervention session
  const completeIntervention = useCallback(async (
    sessionId: string,
    effectivenessRating: number,
    notes?: string,
    outcomes?: string[]
  ): Promise<void> => {
    setState(prev => {
      if (!prev.currentSession || prev.currentSession.id !== sessionId) {
        return prev;
      }

      const completedSession: InterventionSession = {
        ...prev.currentSession,
        endTime: new Date(),
        completed: true,
        effectivenessRating,
        notes,
        outcomes
      };

      return {
        ...prev,
        currentSession: null,
        sessionHistory: [completedSession, ...prev.sessionHistory]
      };
    });

    announceToScreenReader('Intervention completed successfully. Your progress has been recorded.');
  }, [announceToScreenReader]);

  // Get intervention by ID
  const getInterventionById = useCallback((id: string): TherapeuticIntervention | undefined => {
    return state.availableInterventions.find(intervention => intervention.id === id);
  }, [state.availableInterventions]);

  // Get interventions by type
  const getInterventionsByType = useCallback((type: InterventionType): TherapeuticIntervention[] => {
    return state.availableInterventions.filter(intervention => intervention.type === type);
  }, [state.availableInterventions]);

  // Get crisis-appropriate interventions for immediate use
  const getEmergencyInterventions = useCallback((): TherapeuticIntervention[] => {
    return state.crisisInterventions.slice(0, 3); // Top 3 emergency interventions
  }, [state.crisisInterventions]);

  // Analyze intervention effectiveness
  const getEffectivenessStats = useCallback(() => {
    const completedSessions = state.sessionHistory.filter(session => 
      session.completed && session.effectivenessRating !== undefined
    );

    if (completedSessions.length === 0) {
      return null;
    }

    const totalRating = completedSessions.reduce((sum, session) => 
      sum + (session.effectivenessRating || 0), 0
    );

    const avgEffectiveness = totalRating / completedSessions.length;

    const mostEffective = completedSessions
      .sort((a, b) => (b.effectivenessRating || 0) - (a.effectivenessRating || 0))
      .slice(0, 3)
      .map(session => session.interventionId);

    return {
      averageEffectiveness: Math.round(avgEffectiveness * 10) / 10,
      totalSessions: completedSessions.length,
      mostEffectiveInterventions: mostEffective
    };
  }, [state.sessionHistory]);

  // Notify professional for crisis situations
  const notifyProfessional = useCallback(async (session: InterventionSession): Promise<void> => {
    try {
      // In a real implementation, this would send notification to care team
      console.log('Crisis intervention started - professional notified', session);
      
      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          professionalNotification: true
        } : null
      }));
    } catch (error) {
      console.error('Failed to notify professional:', error);
    }
  }, []);

  // Get culturally adapted version of intervention
  const getCulturalAdaptation = useCallback((
    interventionId: string, 
    culturalContext: string
  ): TherapeuticIntervention | null => {
    const intervention = getInterventionById(interventionId);
    
    if (!intervention?.culturalAdaptations?.[culturalContext]) {
      return null;
    }

    const adaptation = intervention.culturalAdaptations[culturalContext];
    
    return {
      ...intervention,
      title: adaptation.title,
      instructions: adaptation.instructions
    };
  }, [getInterventionById]);

  // Memoized values for performance
  const interventionStats = useMemo(() => getEffectivenessStats(), [getEffectivenessStats]);
  const emergencyInterventions = useMemo(() => getEmergencyInterventions(), [getEmergencyInterventions]);

  const recommendInterventions = useCallback(async (criteria: any) => {
    // Mock implementation - would use AI/ML in real app
    return state.personalizedRecommendations.slice(0, 3);
  }, [state.personalizedRecommendations]);

  const applyIntervention = useCallback((intervention: any) => {
    // Mock implementation - would start specific intervention
    console.log('Starting intervention:', intervention);
  }, []);

  return {
    // State
    ...state,
    
    // Computed values
    interventionStats,
    emergencyInterventions,
    
    // Actions
    startIntervention,
    completeIntervention,
    getInterventionById,
    getInterventionsByType,
    getEmergencyInterventions,
    getCulturalAdaptation,
    recommendInterventions,
    applyIntervention,
    
    // Utils
    isInterventionActive: !!state.currentSession,
    canStartIntervention: !state.currentSession && !state.isLoading
  };
};