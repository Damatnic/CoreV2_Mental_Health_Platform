/**
 * Crisis Detection Hook
 * 
 * Custom hook for detecting and responding to crisis situations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

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

export function useCrisisDetection(config: CrisisDetectionConfig = {}) {
  const {
    sensitivity = 'medium',
    enableAutoAlert = true,
    cooldownPeriod = 300000, // 5 minutes
    keywordThreshold = 2
  } = config;

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

  const detectCrisis = useCallback((indicators: CrisisIndicators) => {
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
  }, [analyzeContent, enableAutoAlert, cooldownPeriod, lastAlertTime]);

  const triggerCrisisAlert = (result: CrisisDetectionResult) => {
    // This would typically integrate with a crisis response system
    console.warn('Crisis detected:', result);
    
    // Dispatch custom event for other components to respond
    window.dispatchEvent(new CustomEvent('crisisDetected', { 
      detail: result 
    }));
  };

  const resetDetection = useCallback(() => {
    setDetectionResult({
      isInCrisis: false,
      urgencyLevel: undefined,
      confidence: 0,
      suggestedActions: [],
      triggerReasons: []
    });
    setLastAlertTime(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  return {
    detectCrisis,
    detectionResult,
    isAnalyzing,
    resetDetection,
    lastAlertTime
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

export default useCrisisDetection;

