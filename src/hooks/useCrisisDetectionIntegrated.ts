/**
 * Crisis Detection Hook - Store Integrated Version
 * 
 * Custom hook for detecting and responding to crisis situations
 * Fully integrated with globalStore for centralized crisis state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  cooldownPeriod?: number; // in milliseconds
  keywordThreshold?: number;
  persistToStore?: boolean; // New: Enable store persistence
  encryptSensitiveData?: boolean; // New: Enable encryption for HIPAA compliance
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

/**
 * Enhanced Crisis Detection Hook with Store Integration
 * Provides real-time crisis detection with global state management
 */
export function useCrisisDetectionIntegrated(config: CrisisDetectionConfig = {}) {
  const {
    sensitivity = 'medium',
    enableAutoAlert = true,
    cooldownPeriod = 300000, // 5 minutes
    keywordThreshold = 2,
    persistToStore = true,
    encryptSensitiveData = true
  } = config;

  // Connect to global store for crisis state management
  const {
    crisisState,
    activateCrisis,
    updateCrisisLevel,
    resolveCrisis,
    addNotification,
    recordUsage,
    addDebugLog,
    isFeatureEnabled
  } = useGlobalStore();

  const [detectionResult, setDetectionResult] = useState<CrisisDetectionResult>({
    isInCrisis: false,
    urgencyLevel: undefined,
    confidence: 0,
    suggestedActions: [],
    triggerReasons: []
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const previousCrisisLevel = useRef<string>('none');

  // Check if enhanced crisis detection is enabled
  const isEnhancedDetectionEnabled = isFeatureEnabled('enhanced-crisis-detection');

  const analyzeContent = useCallback((indicators: CrisisIndicators): CrisisDetectionResult => {
    const reasons: string[] = [];
    let maxUrgency: CrisisIndicators['urgencyLevel'] = 'low';
    let keywordCount = 0;
    let confidence = 0;

    // Analyze text content
    if (indicators.textContent) {
      const lowerText = indicators.textContent.toLowerCase();
      
      // Check for crisis keywords
      for (const [level, keywords] of Object.entries(CRISIS_KEYWORDS)) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            keywordCount++;
            reasons.push(`Detected keyword: "${keyword}"`);
            
            // Update max urgency
            if (level === 'critical') maxUrgency = 'critical';
            else if (level === 'high' && maxUrgency !== 'critical') maxUrgency = 'high';
            else if (level === 'medium' && !['critical', 'high'].includes(maxUrgency)) maxUrgency = 'medium';
          }
        }
      }
    }

    // Analyze mood score
    if (indicators.moodScore !== undefined) {
      if (indicators.moodScore <= 2) {
        reasons.push('Very low mood score');
        confidence += 30;
        if (maxUrgency === 'low') maxUrgency = 'medium';
      } else if (indicators.moodScore <= 4) {
        reasons.push('Low mood score');
        confidence += 15;
      }
    }

    // Analyze behavior patterns
    if (indicators.behaviorPatterns && indicators.behaviorPatterns.length > 0) {
      const concerningPatterns = indicators.behaviorPatterns.filter(pattern =>
        ['isolation', 'withdrawal', 'aggression', 'self-harm'].includes(pattern.toLowerCase())
      );
      
      if (concerningPatterns.length > 0) {
        reasons.push(`Concerning behaviors: ${concerningPatterns.join(', ')}`);
        confidence += concerningPatterns.length * 10;
      }
    }

    // Override with explicit urgency level if provided
    if (indicators.urgencyLevel) {
      maxUrgency = indicators.urgencyLevel;
      confidence = Math.max(confidence, 50);
    }

    // Calculate confidence based on keywords and sensitivity
    confidence += Math.min(keywordCount * 20, 60);
    
    // Adjust based on sensitivity
    if (sensitivity === 'high') {
      confidence = Math.min(confidence * 1.2, 100);
    } else if (sensitivity === 'low') {
      confidence = confidence * 0.8;
    }

    // Determine if in crisis
    const isInCrisis = (
      keywordCount >= keywordThreshold ||
      maxUrgency === 'critical' ||
      (maxUrgency === 'high' && confidence >= 60) ||
      confidence >= 70
    );

    // Generate suggested actions
    const suggestedActions = getSuggestedActions(maxUrgency, isInCrisis);

    return {
      isInCrisis,
      urgencyLevel: maxUrgency,
      confidence: Math.round(confidence),
      suggestedActions,
      triggerReasons: reasons
    };
  }, [sensitivity, keywordThreshold]);

  const triggerCrisisAlert = useCallback((result: CrisisDetectionResult) => {
    // Log crisis detection
    logger.warn('Crisis detected', {
      urgencyLevel: result.urgencyLevel,
      confidence: result.confidence,
      reasons: encryptSensitiveData ? '[ENCRYPTED]' : result.triggerReasons
    });
    
    // Add debug log for monitoring
    addDebugLog('warn', 'crisis-detection', 'Crisis state triggered', {
      level: result.urgencyLevel,
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    });
    
    // Update global crisis state if persistence is enabled
    if (persistToStore && result.urgencyLevel) {
      activateCrisis(result.urgencyLevel, result.suggestedActions);
      
      // Add notification based on urgency
      const notificationType = result.urgencyLevel === 'critical' ? 'error' : 
                              result.urgencyLevel === 'high' ? 'warning' : 'info';
      
      addNotification({
        type: notificationType as any,
        title: 'Crisis Support Activated',
        message: `Support resources are available. ${result.suggestedActions[0] || 'Stay connected.'}`,
        persistent: result.urgencyLevel === 'critical' || result.urgencyLevel === 'high'
      });
      
      // Track crisis detection usage
      recordUsage('interactions');
      
      // Store crisis level change
      if (previousCrisisLevel.current !== result.urgencyLevel) {
        logger.info('Crisis level changed', {
          from: previousCrisisLevel.current,
          to: result.urgencyLevel
        });
        previousCrisisLevel.current = result.urgencyLevel || 'none';
      }
    }
    
    // Dispatch custom event for other components to respond
    window.dispatchEvent(new CustomEvent('crisisDetected', { 
      detail: result 
    }));
  }, [activateCrisis, addNotification, recordUsage, addDebugLog, persistToStore, encryptSensitiveData]);

  const detectCrisis = useCallback((indicators: CrisisIndicators) => {
    // Skip if enhanced detection is disabled
    if (!isEnhancedDetectionEnabled) {
      logger.debug('Enhanced crisis detection is disabled');
      return;
    }

    setIsAnalyzing(true);

    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Perform analysis with a small delay to debounce rapid updates
    analysisTimeoutRef.current = setTimeout(() => {
      const result = analyzeContent(indicators);
      setDetectionResult(result);

      // Handle auto-alert if enabled and in crisis
      if (enableAutoAlert && result.isInCrisis && result.urgencyLevel !== 'low') {
        const now = new Date();
        const canAlert = !lastAlertTime || 
          (now.getTime() - lastAlertTime.getTime() > cooldownPeriod);

        if (canAlert) {
          triggerCrisisAlert(result);
          setLastAlertTime(now);
        }
      }

      setIsAnalyzing(false);
    }, 500);
  }, [analyzeContent, enableAutoAlert, cooldownPeriod, lastAlertTime, triggerCrisisAlert, isEnhancedDetectionEnabled]);

  const resetDetection = useCallback(() => {
    setDetectionResult({
      isInCrisis: false,
      urgencyLevel: undefined,
      confidence: 0,
      suggestedActions: [],
      triggerReasons: []
    });
    setLastAlertTime(null);
    
    // Reset global crisis state if it's active and persistence is enabled
    if (persistToStore && crisisState.isActive) {
      resolveCrisis();
      logger.info('Crisis detection reset and resolved');
      addDebugLog('info', 'crisis-detection', 'Crisis state resolved');
    }
    
    previousCrisisLevel.current = 'none';
  }, [crisisState.isActive, resolveCrisis, persistToStore, addDebugLog]);

  // Sync with global crisis state on mount and changes
  useEffect(() => {
    if (!persistToStore) return;

    // If global crisis state changes externally, update local detection
    if (crisisState.isActive && !detectionResult.isInCrisis) {
      setDetectionResult(prev => ({
        ...prev,
        isInCrisis: true,
        urgencyLevel: crisisState.level as any,
        confidence: 75,
        suggestedActions: crisisState.interventions || [],
        triggerReasons: ['External crisis activation']
      }));
      previousCrisisLevel.current = crisisState.level;
    } else if (!crisisState.isActive && detectionResult.isInCrisis) {
      // Crisis resolved externally
      resetDetection();
    }
  }, [crisisState.isActive, crisisState.level, crisisState.interventions, detectionResult.isInCrisis, resetDetection, persistToStore]);

  // Initialize crisis resources on mount
  useEffect(() => {
    if (persistToStore && crisisState.resources.length === 0) {
      logger.info('Initializing crisis resources');
      // Resources are already initialized in globalStore with defaults
    }
  }, [persistToStore, crisisState.resources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      
      // Log unmount
      logger.debug('Crisis detection hook unmounting');
    };
  }, []);

  return {
    // Core functions
    detectCrisis,
    resetDetection,
    
    // State
    detectionResult,
    isAnalyzing,
    lastAlertTime,
    
    // Global crisis state
    globalCrisisState: crisisState,
    
    // Additional utilities
    isEnhancedDetectionEnabled,
    crisisResources: crisisState.resources,
    crisisContacts: crisisState.contacts,
    
    // Store management functions
    addCrisisContact: useGlobalStore.getState().addCrisisContact,
    removeCrisisContact: useGlobalStore.getState().removeCrisisContact
  };
}

// Helper function to get suggested actions based on urgency
function getSuggestedActions(
  urgency?: CrisisIndicators['urgencyLevel'],
  isInCrisis?: boolean
): string[] {
  if (!isInCrisis || !urgency) {
    return ['Continue monitoring', 'Provide supportive resources'];
  }

  const actions: string[] = [];

  switch (urgency) {
    case 'critical':
      actions.push(
        'Contact emergency services immediately',
        'Connect with crisis counselor',
        'Notify emergency contacts',
        'Activate safety plan'
      );
      break;
    case 'high':
      actions.push(
        'Connect with crisis counselor',
        'Provide crisis hotline numbers',
        'Suggest immediate coping strategies',
        'Check in frequently'
      );
      break;
    case 'medium':
      actions.push(
        'Offer supportive resources',
        'Suggest coping techniques',
        'Schedule check-in',
        'Encourage professional help'
      );
      break;
    case 'low':
      actions.push(
        'Provide self-care resources',
        'Suggest relaxation techniques',
        'Monitor mood changes'
      );
      break;
  }

  return actions;
}

export default useCrisisDetectionIntegrated;