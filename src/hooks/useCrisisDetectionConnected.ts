/**
 * Crisis Detection Hook - Store Connected Version
 * 
 * Enhanced crisis detection hook connected to global store for state persistence
 * and real-time crisis monitoring across the platform
 */

import { useCallback, useEffect, useRef } from 'react';
import useGlobalStore from '../stores/globalStore';
import { logger } from '../utils/logger';

interface CrisisIndicators {
  textContent?: string;
  moodScore?: number;
  behaviorPatterns?: string[];
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
}

interface CrisisDetectionConfig {
  sensitivity?: 'low' | 'medium' | 'high';
  enableAutoAlert?: boolean;
  cooldownPeriod?: number;
  keywordThreshold?: number;
}

interface CrisisDetectionResult {
  isInCrisis: boolean;
  urgencyLevel: CrisisIndicators['urgencyLevel'];
  confidence: number;
  suggestedActions: string[];
  triggerReasons: string[];
}

const CRISIS_KEYWORDS = {
  critical: [
    'suicide', 'kill myself', 'end it all', 'no point living',
    'better off dead', 'want to die', 'can\'t go on'
  ],
  high: [
    'hurt myself', 'self harm', 'cutting', 'overdose',
    'hopeless', 'worthless', 'no way out', 'give up'
  ],
  medium: [
    'depressed', 'anxious', 'panic', 'scared',
    'alone', 'nobody cares', 'hate myself'
  ],
  low: [
    'sad', 'worried', 'stressed', 'overwhelmed',
    'tired', 'frustrated', 'angry'
  ]
};

const SUGGESTED_ACTIONS = {
  critical: [
    'Call 988 Suicide & Crisis Lifeline immediately',
    'Text HOME to 741741 for Crisis Text Line',
    'Go to nearest emergency room',
    'Call emergency contact'
  ],
  high: [
    'Reach out to crisis counselor',
    'Use safety plan',
    'Contact therapist or counselor',
    'Practice grounding techniques'
  ],
  medium: [
    'Use coping strategies',
    'Try breathing exercises',
    'Journal your feelings',
    'Reach out to support network'
  ],
  low: [
    'Practice self-care',
    'Take a break',
    'Try relaxation techniques',
    'Talk to a friend'
  ]
};

export const useCrisisDetectionConnected = (config: CrisisDetectionConfig = {}) => {
  const {
    sensitivity = 'medium',
    enableAutoAlert = true,
    cooldownPeriod = 300000, // 5 minutes
    keywordThreshold = 2
  } = config;

  // Connect to global store for crisis state
  const {
    user,
    updateAppState,
    sendNotification
  } = useGlobalStore();

  // Get crisis state from store or initialize
  const crisisState = useGlobalStore(state => state.appState?.crisisState) || {
    isInCrisis: false,
    urgencyLevel: null as CrisisIndicators['urgencyLevel'] | null,
    lastDetection: null as number | null,
    detectionHistory: [] as Array<{
      timestamp: number;
      urgencyLevel: CrisisIndicators['urgencyLevel'];
      indicators: CrisisIndicators;
    }>
  };

  const lastAlertTime = useRef<number>(0);

  // Analyze text for crisis indicators
  const analyzeText = useCallback((text: string): CrisisDetectionResult => {
    const lowerText = text.toLowerCase();
    const detectedKeywords: { level: string; keywords: string[] }[] = [];
    let highestUrgency: CrisisIndicators['urgencyLevel'] = 'low';
    const triggerReasons: string[] = [];

    // Check for crisis keywords
    Object.entries(CRISIS_KEYWORDS).forEach(([level, keywords]) => {
      const found = keywords.filter(keyword => lowerText.includes(keyword));
      if (found.length > 0) {
        detectedKeywords.push({ level, keywords: found });
        triggerReasons.push(`Detected ${level} risk keywords: ${found.join(', ')}`);
      }
    });

    // Determine urgency level
    if (detectedKeywords.some(d => d.level === 'critical')) {
      highestUrgency = 'critical';
    } else if (detectedKeywords.some(d => d.level === 'high')) {
      highestUrgency = 'high';
    } else if (detectedKeywords.some(d => d.level === 'medium')) {
      highestUrgency = 'medium';
    } else if (detectedKeywords.length > 0) {
      highestUrgency = 'low';
    }

    // Calculate confidence based on keyword matches
    const totalKeywords = detectedKeywords.reduce((acc, d) => acc + d.keywords.length, 0);
    const confidence = Math.min(totalKeywords / keywordThreshold, 1);

    // Determine if in crisis based on sensitivity
    let isInCrisis = false;
    if (sensitivity === 'high') {
      isInCrisis = totalKeywords >= 1;
    } else if (sensitivity === 'medium') {
      isInCrisis = totalKeywords >= 2 || highestUrgency === 'critical' || highestUrgency === 'high';
    } else {
      isInCrisis = highestUrgency === 'critical' || highestUrgency === 'high';
    }

    return {
      isInCrisis,
      urgencyLevel: highestUrgency,
      confidence,
      suggestedActions: SUGGESTED_ACTIONS[highestUrgency] || [],
      triggerReasons
    };
  }, [keywordThreshold, sensitivity]);

  // Check for crisis indicators
  const checkForCrisis = useCallback((indicators: CrisisIndicators): CrisisDetectionResult => {
    const results: CrisisDetectionResult[] = [];
    
    // Analyze text content if provided
    if (indicators.textContent) {
      results.push(analyzeText(indicators.textContent));
    }
    
    // Analyze mood score if provided
    if (indicators.moodScore !== undefined) {
      const moodResult: CrisisDetectionResult = {
        isInCrisis: indicators.moodScore <= 2,
        urgencyLevel: indicators.moodScore <= 1 ? 'high' : indicators.moodScore <= 2 ? 'medium' : 'low',
        confidence: indicators.moodScore <= 2 ? 0.8 : 0.3,
        suggestedActions: [],
        triggerReasons: indicators.moodScore <= 2 ? ['Very low mood score detected'] : []
      };
      results.push(moodResult);
    }
    
    // Combine results
    if (results.length === 0) {
      return {
        isInCrisis: false,
        urgencyLevel: 'low',
        confidence: 0,
        suggestedActions: [],
        triggerReasons: []
      };
    }
    
    // Use highest urgency and combine trigger reasons
    const combinedResult = results.reduce((acc, result) => ({
      isInCrisis: acc.isInCrisis || result.isInCrisis,
      urgencyLevel: getHigherUrgency(acc.urgencyLevel, result.urgencyLevel),
      confidence: Math.max(acc.confidence, result.confidence),
      suggestedActions: [...new Set([...acc.suggestedActions, ...result.suggestedActions])],
      triggerReasons: [...acc.triggerReasons, ...result.triggerReasons]
    }));
    
    // Update global store with crisis state
    if (combinedResult.isInCrisis) {
      const now = Date.now();
      
      // Update crisis state in store
      updateAppState({
        crisisState: {
          isInCrisis: true,
          urgencyLevel: combinedResult.urgencyLevel,
          lastDetection: now,
          detectionHistory: [
            ...crisisState.detectionHistory,
            {
              timestamp: now,
              urgencyLevel: combinedResult.urgencyLevel,
              indicators
            }
          ].slice(-10) // Keep last 10 detections
        }
      });
      
      // Send notification if enabled and cooldown passed
      if (enableAutoAlert && now - lastAlertTime.current > cooldownPeriod) {
        lastAlertTime.current = now;
        
        if (combinedResult.urgencyLevel === 'critical') {
          sendNotification({
            type: 'error',
            title: '🚨 Immediate Crisis Support Needed',
            message: 'Call 988 for immediate support or text HOME to 741741',
            duration: 0, // Persistent notification
            actions: [
              { label: 'Call 988', action: 'call-988' },
              { label: 'Text Crisis Line', action: 'text-crisis' }
            ]
          });
        } else if (combinedResult.urgencyLevel === 'high') {
          sendNotification({
            type: 'warning',
            title: 'Crisis Support Available',
            message: 'We noticed you might be struggling. Support is available.',
            duration: 10000,
            actions: [
              { label: 'Get Support', action: 'get-support' }
            ]
          });
        }
        
        logger.warn('Crisis detected', {
          urgencyLevel: combinedResult.urgencyLevel,
          confidence: combinedResult.confidence,
          userId: user?.id
        });
      }
    }
    
    return combinedResult;
  }, [analyzeText, crisisState.detectionHistory, enableAutoAlert, cooldownPeriod, updateAppState, sendNotification, user?.id]);

  // Clear crisis state
  const clearCrisis = useCallback(() => {
    updateAppState({
      crisisState: {
        isInCrisis: false,
        urgencyLevel: null,
        lastDetection: crisisState.lastDetection,
        detectionHistory: crisisState.detectionHistory
      }
    });
    logger.info('Crisis state cleared');
  }, [updateAppState, crisisState.lastDetection, crisisState.detectionHistory]);

  // Get crisis resources
  const getCrisisResources = useCallback(() => {
    return {
      hotlines: [
        { name: '988 Suicide & Crisis Lifeline', number: '988', available: '24/7' },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
        { name: 'Veterans Crisis Line', number: '1-800-273-8255', available: '24/7' }
      ],
      websites: [
        { name: 'Suicide Prevention Lifeline', url: 'https://suicidepreventionlifeline.org' },
        { name: 'Crisis Text Line', url: 'https://www.crisistextline.org' },
        { name: 'SAMHSA', url: 'https://www.samhsa.gov/find-help' }
      ],
      immediateActions: SUGGESTED_ACTIONS[crisisState.urgencyLevel || 'low'] || []
    };
  }, [crisisState.urgencyLevel]);

  // Monitor for automatic crisis detection (e.g., from other parts of the app)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Check if crisis state has been updated by other parts of the app
      const currentState = useGlobalStore.getState().appState?.crisisState;
      if (currentState?.isInCrisis && !crisisState.isInCrisis) {
        logger.info('Crisis state updated from external source');
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [crisisState.isInCrisis]);

  return {
    // State
    isInCrisis: crisisState.isInCrisis,
    urgencyLevel: crisisState.urgencyLevel,
    lastDetection: crisisState.lastDetection,
    detectionHistory: crisisState.detectionHistory,
    
    // Methods
    checkForCrisis,
    clearCrisis,
    getCrisisResources,
    analyzeText
  };
};

// Helper function to determine higher urgency level
function getHigherUrgency(
  a: CrisisIndicators['urgencyLevel'],
  b: CrisisIndicators['urgencyLevel']
): CrisisIndicators['urgencyLevel'] {
  const levels = { low: 1, medium: 2, high: 3, critical: 4 };
  const aLevel = levels[a || 'low'];
  const bLevel = levels[b || 'low'];
  const higherLevel = Math.max(aLevel, bLevel);
  
  return Object.entries(levels).find(([_, v]) => v === higherLevel)?.[0] as CrisisIndicators['urgencyLevel'];
}

export default useCrisisDetectionConnected;