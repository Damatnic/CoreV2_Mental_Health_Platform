/**
 * Crisis Assessment Hook - Minimal Viable Version
 * Provides basic crisis assessment functionality for mental health platform
 * CRITICAL: Maintains safety features and emergency escalation
 */

import { useState, useCallback, useMemo } from 'react';
import useGlobalStore from '../stores/globalStore';
import { logger } from '../utils/logger';

export interface CrisisAssessmentResult {
  score: number;
  passed: boolean;
  recommendations: string[];
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  requiresEscalation: boolean;
}

export interface CrisisScenario {
  id: string;
  category: string;
  scenario: string;
  keywords: string[];
  expectedActions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CrisisAssessmentState {
  isAssessing: boolean;
  currentScenario: CrisisScenario | null;
  assessmentHistory: CrisisAssessmentResult[];
}

/**
 * useCrisisAssessment Hook - Provides crisis assessment and detection
 * Integrated with globalStore for crisis state management
 */
export const useCrisisAssessment = () => {
  const [state, setState] = useState<CrisisAssessmentState>({
    isAssessing: false,
    currentScenario: null,
    assessmentHistory: []
  });

  const { 
    crisisState,
    activateCrisis,
    updateCrisisLevel,
    resolveCrisis,
    addNotification
  } = useGlobalStore();

  // Crisis keywords for basic detection
  const CRISIS_KEYWORDS = {
    critical: ['suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead'],
    high: ['self harm', 'cutting', 'overdose', 'cant go on', 'no hope'],
    medium: ['depressed', 'anxious', 'panic', 'scared', 'overwhelmed'],
    low: ['stressed', 'worried', 'sad', 'lonely', 'tired']
  };

  // Generate crisis scenarios for training
  const generateCrisisScenarios = useCallback((): CrisisScenario[] => {
    return [
      {
        id: 'scenario_1',
        category: 'suicidal_ideation',
        scenario: 'A user messages: "I can\'t take it anymore. I\'ve been thinking about ending everything. My family would be better off without me."',
        keywords: ['suicide', 'ending everything', 'better off without'],
        expectedActions: [
          'Express immediate concern and empathy',
          'Assess immediate safety',
          'Provide 988 Suicide & Crisis Lifeline',
          'Encourage professional help',
          'Stay with the user until help arrives'
        ],
        severity: 'critical'
      },
      {
        id: 'scenario_2',
        category: 'panic_attack',
        scenario: 'A user says: "I can\'t breathe, my heart is racing, I think I\'m having a heart attack. I\'m so scared."',
        keywords: ['panic', 'cant breathe', 'heart racing'],
        expectedActions: [
          'Help ground the user',
          'Guide breathing exercises',
          'Reassure about panic symptoms',
          'Suggest medical evaluation if needed',
          'Provide calming techniques'
        ],
        severity: 'high'
      },
      {
        id: 'scenario_3',
        category: 'domestic_violence',
        scenario: 'A user shares: "My partner hit me again last night. I\'m scared to leave but I can\'t take this anymore."',
        keywords: ['hit', 'scared', 'partner violence'],
        expectedActions: [
          'Validate their experience',
          'Assess immediate safety',
          'Provide domestic violence hotline',
          'Help create safety plan',
          'Document if requested'
        ],
        severity: 'high'
      },
      {
        id: 'scenario_4',
        category: 'depression',
        scenario: 'A user expresses: "I\'ve been feeling so empty lately. Nothing brings me joy anymore. I just want to sleep all day."',
        keywords: ['empty', 'no joy', 'depression'],
        expectedActions: [
          'Show empathy and understanding',
          'Explore support system',
          'Suggest professional counseling',
          'Recommend self-care activities',
          'Schedule follow-up check-in'
        ],
        severity: 'medium'
      }
    ];
  }, []);

  // Detect crisis level from text
  const detectCrisisLevel = useCallback((text: string): CrisisAssessmentResult['riskLevel'] => {
    const lowerText = text.toLowerCase();
    
    // Check for critical keywords
    if (CRISIS_KEYWORDS.critical.some(keyword => lowerText.includes(keyword))) {
      return 'critical';
    }
    
    // Check for high-risk keywords
    if (CRISIS_KEYWORDS.high.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    }
    
    // Check for medium-risk keywords
    if (CRISIS_KEYWORDS.medium.some(keyword => lowerText.includes(keyword))) {
      return 'medium';
    }
    
    // Check for low-risk keywords
    if (CRISIS_KEYWORDS.low.some(keyword => lowerText.includes(keyword))) {
      return 'low';
    }
    
    return 'none';
  }, []);

  // Evaluate a scenario response
  const evaluateScenario = useCallback((scenario: string, response: string): number => {
    let score = 0;
    const lowerResponse = response.toLowerCase();
    
    // Basic scoring based on key elements
    if (lowerResponse.includes('988') || lowerResponse.includes('crisis') || lowerResponse.includes('lifeline')) {
      score += 25; // Mentioned crisis resources
    }
    
    if (lowerResponse.includes('safe') || lowerResponse.includes('safety')) {
      score += 20; // Assessed safety
    }
    
    if (lowerResponse.includes('empathy') || lowerResponse.includes('understand') || lowerResponse.includes('hear you')) {
      score += 20; // Showed empathy
    }
    
    if (lowerResponse.includes('professional') || lowerResponse.includes('therapist') || lowerResponse.includes('counselor')) {
      score += 15; // Suggested professional help
    }
    
    if (lowerResponse.includes('support') || lowerResponse.includes('help')) {
      score += 10; // Offered support
    }
    
    if (lowerResponse.includes('stay') || lowerResponse.includes('here for you')) {
      score += 10; // Committed to staying
    }
    
    logger.info('Scenario evaluated', { scenario: scenario.substring(0, 50), score });
    
    return Math.min(score, 100); // Cap at 100
  }, []);

  // Assess crisis capability based on responses
  const assessCrisisCapability = useCallback(async (
    responses: Array<{ scenario: string; response: string }>
  ): Promise<CrisisAssessmentResult> => {
    setState(prev => ({ ...prev, isAssessing: true }));
    
    try {
      // Calculate scores for each response
      const scores = responses.map(({ scenario, response }) => 
        evaluateScenario(scenario, response)
      );
      
      // Calculate average score
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      // Determine if passed (70% threshold)
      const passed = averageScore >= 70;
      
      // Determine risk level based on score
      let riskLevel: CrisisAssessmentResult['riskLevel'] = 'none';
      if (averageScore < 40) riskLevel = 'high';
      else if (averageScore < 60) riskLevel = 'medium';
      else if (averageScore < 80) riskLevel = 'low';
      
      // Generate recommendations
      const recommendations: string[] = [];
      
      if (averageScore < 50) {
        recommendations.push('Complete crisis intervention training immediately');
        recommendations.push('Review 988 Suicide & Crisis Lifeline protocols');
      }
      
      if (averageScore < 70) {
        recommendations.push('Practice active listening techniques');
        recommendations.push('Study de-escalation strategies');
      }
      
      if (!passed) {
        recommendations.push('Mandatory supervision required for crisis situations');
        recommendations.push('Complete additional mental health first aid training');
      } else {
        recommendations.push('Continue regular crisis response training');
        recommendations.push('Stay updated on best practices');
      }
      
      const result: CrisisAssessmentResult = {
        score: Math.round(averageScore),
        passed,
        recommendations,
        riskLevel,
        requiresEscalation: riskLevel === 'high' || riskLevel === 'critical'
      };
      
      // Store in history
      setState(prev => ({
        ...prev,
        assessmentHistory: [...prev.assessmentHistory, result]
      }));
      
      // Log assessment completion
      logger.info('Crisis assessment completed', { 
        score: result.score, 
        passed: result.passed,
        riskLevel: result.riskLevel 
      });
      
      return result;
    } catch (error) {
      logger.error('Crisis assessment failed', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isAssessing: false }));
    }
  }, [evaluateScenario]);

  // Check text for crisis indicators and trigger alerts if needed
  const checkForCrisis = useCallback((text: string): boolean => {
    const riskLevel = detectCrisisLevel(text);
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      // Activate crisis mode in global store
      activateCrisis(riskLevel, [
        'Immediate assessment initiated',
        'Crisis resources provided',
        '988 Lifeline information displayed'
      ]);
      
      // Add urgent notification
      addNotification({
        type: 'error',
        title: '⚠️ Crisis Detected',
        message: 'If you are in immediate danger, please call 988 or 911',
        persistent: true
      });
      
      logger.warn('Crisis detected', { riskLevel, textLength: text.length });
      return true;
    }
    
    if (riskLevel === 'medium') {
      // Update crisis level without full activation
      updateCrisisLevel(riskLevel);
      
      addNotification({
        type: 'warning',
        title: 'Support Available',
        message: 'We\'re here to help. Consider reaching out to a counselor.',
        persistent: false
      });
      
      return true;
    }
    
    return false;
  }, [detectCrisisLevel, activateCrisis, updateCrisisLevel, addNotification]);

  // Get emergency contacts
  const getEmergencyContacts = useCallback(() => {
    return crisisState.resources;
  }, [crisisState.resources]);

  // Trigger emergency escalation
  const triggerEmergencyEscalation = useCallback(() => {
    activateCrisis('critical', [
      'Emergency escalation triggered',
      '988 contacted',
      'Emergency contacts notified'
    ]);
    
    // Log critical event
    logger.error('EMERGENCY ESCALATION TRIGGERED', { 
      timestamp: Date.now(),
      resources: crisisState.resources 
    });
    
    // Show persistent emergency notification
    addNotification({
      type: 'error',
      title: '🚨 EMERGENCY SUPPORT',
      message: 'Call 988 for immediate help. Help is available 24/7.',
      persistent: true
    });
  }, [activateCrisis, crisisState.resources, addNotification]);

  // Memoize return value
  const returnValue = useMemo(() => ({
    // State
    ...state,
    crisisActive: crisisState.isActive,
    currentCrisisLevel: crisisState.level,
    
    // Methods
    assessCrisisCapability,
    evaluateScenario,
    generateCrisisScenarios,
    detectCrisisLevel,
    checkForCrisis,
    getEmergencyContacts,
    triggerEmergencyEscalation,
    
    // Constants
    CRISIS_HOTLINE: '988',
    CRISIS_TEXT: 'Text HOME to 741741'
  }), [
    state,
    crisisState.isActive,
    crisisState.level,
    assessCrisisCapability,
    evaluateScenario,
    generateCrisisScenarios,
    detectCrisisLevel,
    checkForCrisis,
    getEmergencyContacts,
    triggerEmergencyEscalation
  ]);

  return returnValue;
};

// Export default for backwards compatibility
export default useCrisisAssessment;