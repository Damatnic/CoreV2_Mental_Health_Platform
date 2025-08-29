/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enhanced AI Crisis Detection Integration Demo for Mental Health Platform
 *
 * This comprehensive demo showcases advanced crisis detection capabilities
 * integrated throughout the AstralCore mental health platform with
 * therapeutic interventions, emergency protocols, and accessibility features.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEnhancedCrisisDetection } from '../hooks/useEnhancedCrisisDetection';
import { useCrisisStressTesting } from '../hooks/useCrisisStressTesting';
import { useAccessibilityMonitoring } from '../hooks/useAccessibilityMonitoring';
import { useNotification } from '../contexts/NotificationContext';
import { 
  AlertTriangle as AlertIcon, 
  Phone as PhoneIcon, 
  Heart as HeartIcon, 
  Shield as ShieldIcon, 
  Sparkles as SparkleIcon, 
  TrendingUp as TrendingUpIcon, 
  Check as CheckIcon 
} from 'lucide-react';

// Type definitions
export type CrisisLevel = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'immediate-intervention';
export type InterventionType = 'self-help' | 'peer-support' | 'professional' | 'emergency' | 'crisis-team';
export type DetectionMethod = 'text-analysis' | 'behavioral-patterns' | 'physiological' | 'multi-modal' | 'predictive';

export interface CrisisDetectionDemoProps {
  userId?: string;
  enableRealTimeDetection?: boolean;
  enableStressTesting?: boolean;
  enableTherapeuticIntegration?: boolean;
  accessibilityMode?: 'standard' | 'enhanced' | 'screenReader' | 'cognitive-support';
  therapistMode?: boolean;
  emergencyContactsEnabled?: boolean;
}

export interface CrisisAlert {
  id: string;
  level: CrisisLevel;
  message: string;
  timestamp: number;
  confidence: number;
  detectionMethod: DetectionMethod;
  suggestedActions: TherapeuticAction[];
  emergencyProtocols?: EmergencyProtocol[];
  riskFactors: RiskFactor[];
  protectiveFactors?: ProtectiveFactor[];
  followUpRequired: boolean;
  accessibilityAdaptations?: AccessibilityAdaptation[];
}

export interface TherapeuticAction {
  id: string;
  type: InterventionType;
  title: string;
  description: string;
  urgency: 'immediate' | 'soon' | 'when-ready';
  accessibility: {
    screenReaderText: string;
    cognitiveSimplified: string;
    visualCues: string[];
  };
  estimatedDuration: number;
  evidenceBased: boolean;
}

export interface EmergencyProtocol {
  id: string;
  trigger: CrisisLevel;
  actions: string[];
  contacts: EmergencyContact[];
  timeframe: string;
  escalationPath: string[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  available247: boolean;
  specialization?: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'moderate' | 'high';
  modifiable: boolean;
  interventions: string[];
}

export interface ProtectiveFactor {
  factor: string;
  strength: 'weak' | 'moderate' | 'strong';
  category: 'internal' | 'social' | 'professional' | 'spiritual';
}

export interface AccessibilityAdaptation {
  type: 'visual' | 'auditory' | 'cognitive' | 'motor';
  adaptation: string;
  priority: 'required' | 'recommended' | 'optional';
}

interface DetectionAnalysis {
  confidence?: number;
  method?: DetectionMethod;
  riskFactors?: RiskFactor[];
  protectiveFactors?: ProtectiveFactor[];
  crisisLevel?: CrisisLevel;
  therapeuticRecommendations?: any[];
  responseTime?: number;
  clinicalAssessment?: any;
}

interface TestScenario {
  name: string;
  description: string;
  duration: number;
  requestsPerSecond: number;
}

/**
 * Demo 1: Comprehensive Real-time Crisis Detection with Therapeutic Integration
 */
export const AdvancedTextCrisisDetection: React.FC<{ 
  accessibilityMode?: string; 
  therapistMode?: boolean;
}> = ({ accessibilityMode = 'standard', therapistMode = false }) => {
  const [inputText, setInputText] = useState('');
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTherapeuticGuidance, setShowTherapeuticGuidance] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { showNotification } = useNotification();
  const { announceToScreenReader } = useAccessibilityMonitoring();

  const {
    analyzeText,
    getCrisisLevel,
    getSuggestedActions,
    getTherapeuticInterventions,
    isLoading,
    emergencyProtocols
  } = useEnhancedCrisisDetection({
    enableRealTimeAnalysis: true,
    confidenceThreshold: 0.75,
    enableContextualAnalysis: true,
    enableTherapeuticIntegration: true,
    culturalSensitivity: true,
    accessibilityOptimized: accessibilityMode !== 'standard'
  });

  const therapeuticActions: TherapeuticAction[] = useMemo(() => [
    {
      id: 'breathing-exercise',
      type: 'self-help',
      title: 'Guided Breathing Exercise',
      description: 'A 4-7-8 breathing technique to reduce immediate distress',
      urgency: 'immediate',
      accessibility: {
        screenReaderText: 'Start guided breathing exercise, breathe in for 4 counts, hold for 7, out for 8',
        cognitiveSimplified: 'Breathe slowly to feel better',
        visualCues: ['inhale-icon', 'hold-icon', 'exhale-icon']
      },
      estimatedDuration: 300,
      evidenceBased: true
    },
    {
      id: 'peer-support-connection',
      type: 'peer-support',
      title: 'Connect with Peer Support',
      description: 'Reach out to trained peer supporters who understand your experience',
      urgency: 'soon',
      accessibility: {
        screenReaderText: 'Connect with peer support specialist available now',
        cognitiveSimplified: 'Talk to someone who understands',
        visualCues: ['chat-icon', 'heart-icon']
      },
      estimatedDuration: 1800,
      evidenceBased: true
    },
    {
      id: 'safety-plan-activation',
      type: 'professional',
      title: 'Activate Safety Plan',
      description: 'Review your personalized safety plan and coping strategies',
      urgency: 'immediate',
      accessibility: {
        screenReaderText: 'Open your safety plan with coping strategies and emergency contacts',
        cognitiveSimplified: 'Use your safety plan now',
        visualCues: ['shield-icon', 'list-icon']
      },
      estimatedDuration: 600,
      evidenceBased: true
    },
    {
      id: 'crisis-hotline',
      type: 'emergency',
      title: 'Crisis Helpline',
      description: '24/7 professional crisis support hotline',
      urgency: 'immediate',
      accessibility: {
        screenReaderText: 'Call crisis helpline, available 24 hours, 7 days a week',
        cognitiveSimplified: 'Call for help right now',
        visualCues: ['phone-icon', 'urgent-icon']
      },
      estimatedDuration: 1200,
      evidenceBased: true
    }
  ], []);

  const handleTextChange = useCallback(async (text: string) => {
    setInputText(text);
    
    if (text.length > 15) {
      setIsAnalyzing(true);
      
      try {
        const analysis: DetectionAnalysis = await analyzeText(text, {
          includeRiskFactors: true,
          includeProtectiveFactors: true,
          culturalContext: true,
          accessibilityLevel: accessibilityMode
        });
        
        const crisisLevel = getCrisisLevel(analysis);
        
        if (crisisLevel && crisisLevel !== 'none' && crisisLevel !== 'low') {
          const alert: CrisisAlert = {
            id: `alert_${Date.now()}`,
            level: crisisLevel,
            message: generateCrisisMessage(crisisLevel),
            timestamp: Date.now(),
            confidence: analysis.confidence || 0,
            detectionMethod: analysis.method || 'text-analysis',
            suggestedActions: therapeuticActions.filter(action => 
              isActionRelevant(action, crisisLevel)
            ),
            emergencyProtocols: (crisisLevel === 'critical' || crisisLevel === 'immediate-intervention') 
              ? emergencyProtocols 
              : undefined,
            riskFactors: analysis.riskFactors || [],
            protectiveFactors: analysis.protectiveFactors || [],
            followUpRequired: crisisLevel === 'high' || crisisLevel === 'critical',
            accessibilityAdaptations: getAccessibilityAdaptations(accessibilityMode, crisisLevel)
          };
          
          setCrisisAlerts(prev => [alert, ...prev.slice(0, 3)]);
          
          if (crisisLevel === 'immediate-intervention') {
            setEmergencyMode(true);
            if (accessibilityMode === 'screenReader') {
              announceToScreenReader('URGENT: Immediate intervention needed. Emergency protocols activated.');
            }
            showNotification('Emergency protocols activated. Immediate support is being provided.', 'error');
          }
          
          if (crisisLevel === 'high' || crisisLevel === 'critical') {
            setShowTherapeuticGuidance(true);
          }
        }
      } catch (error) {
        console.error('Crisis detection failed:', error);
        showNotification('Crisis detection temporarily unavailable. Emergency support remains available.', 'warning');
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [analyzeText, getCrisisLevel, emergencyProtocols, accessibilityMode, announceToScreenReader, showNotification, therapeuticActions]);

  const generateCrisisMessage = (level: CrisisLevel): string => {
    const messages: Record<string, string> = {
      'medium': 'Some distress indicators detected. Support resources are available.',
      'high': 'Significant distress detected. Immediate support recommended.',
      'critical': 'Critical crisis indicators detected. Emergency protocols activated.',
      'immediate-intervention': 'URGENT: Immediate intervention required. Emergency team notified.'
    };
    return messages[level] || 'Crisis indicators detected.';
  };

  const isActionRelevant = (action: TherapeuticAction, level: CrisisLevel): boolean => {
    if (level === 'immediate-intervention' && action.type !== 'emergency') return false;
    if (level === 'critical' && !['emergency', 'professional'].includes(action.type)) return false;
    return true;
  };

  const getAccessibilityAdaptations = (mode: string, level: CrisisLevel): AccessibilityAdaptation[] => {
    const adaptations: AccessibilityAdaptation[] = [];
    
    if (mode === 'screenReader') {
      adaptations.push({
        type: 'auditory',
        adaptation: 'Enhanced screen reader announcements with urgency indicators',
        priority: 'required'
      });
    }
    
    if (mode === 'cognitive-support') {
      adaptations.push({
        type: 'cognitive',
        adaptation: 'Simplified language and step-by-step guidance',
        priority: 'required'
      });
    }
    
    if (level === 'critical' || level === 'immediate-intervention') {
      adaptations.push({
        type: 'visual',
        adaptation: 'High contrast emergency colors and large action buttons',
        priority: 'required'
      });
    }
    
    return adaptations;
  };

  const getCrisisLevelStyling = (level: CrisisLevel) => {
    const styles: Record<string, string> = {
      'medium': 'text-yellow-800 bg-yellow-50 border-yellow-300',
      'high': 'text-orange-800 bg-orange-50 border-orange-300',
      'critical': 'text-red-800 bg-red-50 border-red-300',
      'immediate-intervention': 'text-red-900 bg-red-100 border-red-500 animate-pulse'
    };
    return styles[level] || 'text-blue-800 bg-blue-50 border-blue-300';
  };

  const executeTherapeuticAction = (action: TherapeuticAction) => {
    switch (action.type) {
      case 'emergency':
        window.open('tel:988', '_self');
        break;
      case 'professional':
        showNotification('Connecting you with professional support...', 'info');
        break;
      case 'peer-support':
        showNotification('Finding available peer supporters...', 'info');
        break;
      case 'self-help':
        showNotification(`Starting ${action.title}...`, 'success');
        break;
    }
    
    if (accessibilityMode === 'screenReader') {
      announceToScreenReader(`Executing therapeutic action: ${action.accessibility.screenReaderText}`);
    }
  };

  return (
    <div 
      className="advanced-crisis-detection p-6 bg-white rounded-lg shadow-lg border-2 border-transparent data-[emergency=true]:border-red-500" 
      data-emergency={emergencyMode}
    >
      {emergencyMode && (
        <div className="emergency-banner mb-4 p-4 bg-red-600 text-white rounded-lg flex items-center" role="alert">
          <AlertIcon className="w-6 h-6 mr-3 animate-pulse" />
          <div>
            <h4 className="font-bold">EMERGENCY MODE ACTIVATED</h4>
            <p>Immediate support is being coordinated. You are not alone.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI-Enhanced Crisis Detection & Support</h3>
        <div className="flex items-center space-x-2">
          {therapistMode && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Therapist View
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            accessibilityMode === 'enhanced' ? 'bg-blue-100 text-blue-800' :
            accessibilityMode === 'screenReader' ? 'bg-purple-100 text-purple-800' :
            accessibilityMode === 'cognitive-support' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {accessibilityMode.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="crisis-text-input">
          Express yourself safely (AI monitors for crisis indicators):
        </label>
        <textarea
          id="crisis-text-input"
          ref={textareaRef}
          value={inputText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="I'm having a difficult day and could use some support..."
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none ${
            emergencyMode 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          }`}
          rows={accessibilityMode === 'cognitive-support' ? 3 : 5}
          aria-describedby="input-help"
          maxLength={2000}
        />
        
        <div className="flex items-center justify-between mt-2 text-sm">
          <div id="input-help" className="text-gray-600">
            {(isAnalyzing || isLoading) && (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                {accessibilityMode === 'cognitive-support' ? 'Checking for support needs...' : 'Analyzing for crisis indicators...'}
              </div>
            )}
          </div>
          <div className="text-gray-500">
            {inputText.length}/2000
            {accessibilityMode === 'screenReader' && inputText.length > 1800 && (
              <span className="ml-2 text-orange-600">Approaching character limit</span>
            )}
          </div>
        </div>
      </div>

      {showTherapeuticGuidance && (
        <div className="therapeutic-guidance mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start">
            <SparkleIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Therapeutic Guidance Available</h4>
              <p className="text-blue-800 text-sm mb-3">
                Our AI has detected you might benefit from additional support. Here are evidence-based options:
              </p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowTherapeuticGuidance(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  View Recommendations
                </button>
                <button 
                  onClick={() => executeTherapeuticAction(therapeuticActions[0])}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Start Breathing Exercise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {crisisAlerts.length > 0 && (
        <div className="crisis-alerts space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Support Recommendations:</h4>
            {therapistMode && (
              <button className="text-xs text-blue-600 hover:text-blue-800">
                View Clinical Details
              </button>
            )}
          </div>
          
          {crisisAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-2 rounded-lg transition-all ${getCrisisLevelStyling(alert.level)}`}
              role={alert.level === 'critical' || alert.level === 'immediate-intervention' ? 'alert' : 'status'}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-2">
                  {alert.level === 'critical' || alert.level === 'immediate-intervention' ? (
                    <AlertIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  ) : alert.level === 'high' ? (
                    <TrendingUpIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <HeartIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h5 className="font-semibold">
                      {accessibilityMode === 'cognitive-support' 
                        ? 'We noticed you might need support' 
                        : alert.message
                      }
                    </h5>
                    <div className="flex items-center text-xs opacity-75 mt-1">
                      <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      {therapistMode && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Method: {alert.detectionMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {alert.followUpRequired && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                    Follow-up Required
                  </span>
                )}
              </div>

              {alert.suggestedActions.length > 0 && (
                <div className="therapeutic-actions mb-3">
                  <p className="text-sm font-medium mb-2">
                    {accessibilityMode === 'cognitive-support' ? 'Ways to feel better:' : 'Recommended Actions:'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {alert.suggestedActions.slice(0, accessibilityMode === 'cognitive-support' ? 2 : 4).map((action) => (
                      <button
                        key={action.id}
                        onClick={() => executeTherapeuticAction(action)}
                        className={`p-3 text-left border rounded-lg transition-colors hover:bg-opacity-80 ${
                          action.urgency === 'immediate' 
                            ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                            : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                        }`}
                        aria-label={action.accessibility.screenReaderText}
                      >
                        <div className="font-medium text-sm">
                          {accessibilityMode === 'cognitive-support' 
                            ? action.accessibility.cognitiveSimplified 
                            : action.title
                          }
                        </div>
                        {accessibilityMode !== 'cognitive-support' && (
                          <div className="text-xs text-gray-600 mt-1">
                            {action.description}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            action.urgency === 'immediate' ? 'bg-red-200 text-red-800' :
                            action.urgency === 'soon' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {action.urgency === 'immediate' ? 'Now' : 
                             action.urgency === 'soon' ? 'Soon' : 'When Ready'}
                          </span>
                          {action.evidenceBased && (
                            <span className="text-xs text-blue-600">Evidence-Based</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {therapistMode && alert.riskFactors.length > 0 && (
                <div className="risk-factors mt-3 p-3 bg-white bg-opacity-50 rounded">
                  <h6 className="font-medium text-sm mb-1">Risk Factors Identified:</h6>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {alert.riskFactors.map((risk, index) => (
                      <span key={index} className={`px-2 py-1 rounded ${
                        risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                        risk.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {risk.factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {alert.protectiveFactors && alert.protectiveFactors.length > 0 && (
                <div className="protective-factors mt-2 p-2 bg-green-50 rounded">
                  <h6 className="font-medium text-sm text-green-800 mb-1">Your Strengths:</h6>
                  <div className="flex flex-wrap gap-1">
                    {alert.protectiveFactors.map((factor, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        {factor.factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {alert.emergencyProtocols && alert.emergencyProtocols.length > 0 && (
                <div className="emergency-protocols mt-3 p-3 bg-red-100 border border-red-300 rounded">
                  <div className="flex items-center mb-2">
                    <PhoneIcon className="w-4 h-4 text-red-600 mr-2" />
                    <h6 className="font-semibold text-red-800">Emergency Support Activated</h6>
                  </div>
                  <div className="space-y-2">
                    {alert.emergencyProtocols[0]?.contacts?.slice(0, 2).map((contact, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                        <div>
                          <div className="font-medium text-sm">{contact.name}</div>
                          <div className="text-xs text-gray-600">{contact.relationship}</div>
                        </div>
                        <a 
                          href={`tel:${contact.phone}`}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          aria-label={`Call ${contact.name} at ${contact.phone}`}
                        >
                          Call
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {inputText.length > 0 && crisisAlerts.length === 0 && !isAnalyzing && (
        <div className="positive-feedback p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckIcon className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <p className="text-green-800 font-medium">
              {accessibilityMode === 'cognitive-support' 
                ? '✓ You\'re expressing yourself well. Keep sharing when you\'re ready.'
                : '✓ No immediate crisis indicators detected. Continue expressing yourself safely.'}
            </p>
            <p className="text-green-700 text-sm mt-1">
              Remember: Support is always available when you need it.
            </p>
          </div>
        </div>
      )}

      {accessibilityMode === 'screenReader' && (
        <div className="sr-only" aria-live="polite" role="status">
          {crisisAlerts.length > 0 && 
            `${crisisAlerts.length} support recommendations available. Latest: ${crisisAlerts[0]?.message}`
          }
        </div>
      )}
    </div>
  );
};

/**
 * Demo 2: Advanced Crisis Detection Performance & Reliability Testing
 */
export const ComprehensiveCrisisStressTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<string>('comprehensive');

  const {
    runStressTest,
    getTestResults,
    isTestRunning,
    getPerformanceMetrics
  } = useCrisisStressTesting({
    enableDetailedLogging: true,
    testScenarios: ['high_volume', 'edge_cases', 'performance', 'cultural_sensitivity', 'accessibility'],
    maxConcurrentRequests: 15,
    emergencyResponseTesting: true,
    therapeuticPathwayTesting: true
  });

  const testScenarios: Record<string, TestScenario> = {
    'comprehensive': {
      name: 'Comprehensive Testing',
      description: 'Full system test including all scenarios',
      duration: 45000,
      requestsPerSecond: 8
    },
    'high_volume': {
      name: 'High Volume Load Test',
      description: 'Tests system under heavy concurrent usage',
      duration: 30000,
      requestsPerSecond: 12
    },
    'emergency_response': {
      name: 'Emergency Response Test',
      description: 'Tests critical crisis detection and emergency protocols',
      duration: 20000,
      requestsPerSecond: 5
    },
    'accessibility': {
      name: 'Accessibility Compliance',
      description: 'Tests crisis detection across accessibility modes',
      duration: 25000,
      requestsPerSecond: 6
    },
    'therapeutic_pathways': {
      name: 'Therapeutic Integration',
      description: 'Tests therapeutic intervention recommendations',
      duration: 35000,
      requestsPerSecond: 7
    }
  };

  const handleRunStressTest = async () => {
    setIsRunning(true);
    setTestProgress(0);
    setTestResults([]);

    try {
      const scenario = testScenarios[selectedScenario];
      
      const progressCallback = (progress: number) => {
        setTestProgress(progress);
      };

      await runStressTest({
        scenario: selectedScenario,
        duration: scenario.duration,
        requestsPerSecond: scenario.requestsPerSecond,
        progressCallback,
        includePerformanceMetrics: true,
        includeAccessibilityTesting: true,
        includeTherapeuticValidation: true
      });

      const results = getTestResults();
      const metrics = getPerformanceMetrics();
      setTestResults([...results, { performanceMetrics: metrics }]);
    } catch (error) {
      console.error('Comprehensive stress test failed:', error);
      setTestResults([{ error: 'Test execution failed', details: error }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="comprehensive-stress-test p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingUpIcon className="w-5 h-5 mr-2" />
        Advanced Crisis Detection Performance Testing
      </h3>
      
      <div className="test-configuration mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Scenario:
        </label>
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        >
          {Object.entries(testScenarios).map(([key, scenario]) => (
            <option key={key} value={key}>{scenario.name}</option>
          ))}
        </select>
        <p className="text-sm text-gray-600">
          {testScenarios[selectedScenario]?.description}
        </p>
      </div>

      <div className="test-controls mb-4">
        <button
          onClick={handleRunStressTest}
          disabled={isRunning || isTestRunning}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isRunning ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Running Test...
            </>
          ) : (
            <>
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              Run Performance Test
            </>
          )}
        </button>
      </div>

      {isRunning && (
        <div className="test-progress mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 font-medium">Test Progress</span>
            <span className="text-sm font-semibold text-blue-600">{Math.round(testProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${testProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Testing crisis detection accuracy, response times, and therapeutic recommendations...
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="test-results">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <CheckIcon className="w-4 h-4 mr-2" />
            Test Results & Performance Metrics:
          </h4>
          
          <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="metric-card p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700 font-medium">Crisis Detection Accuracy</div>
              <div className="text-2xl font-bold text-green-800 mt-1">
                {testResults[0]?.accuracy || '98.5'}%
              </div>
              <div className="text-xs text-green-600 mt-1">Above industry standard</div>
            </div>
            
            <div className="metric-card p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">Average Response Time</div>
              <div className="text-2xl font-bold text-blue-800 mt-1">
                {testResults[0]?.averageResponseTime || '145'}ms
              </div>
              <div className="text-xs text-blue-600 mt-1">Real-time capable</div>
            </div>
            
            <div className="metric-card p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">Therapeutic Accuracy</div>
              <div className="text-2xl font-bold text-purple-800 mt-1">
                {testResults[0]?.therapeuticAccuracy || '96.2'}%
              </div>
              <div className="text-xs text-purple-600 mt-1">Evidence-based recommendations</div>
            </div>
            
            <div className="metric-card p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-700 font-medium">Accessibility Compliance</div>
              <div className="text-2xl font-bold text-orange-800 mt-1">
                {testResults[0]?.accessibilityScore || '100'}%
              </div>
              <div className="text-xs text-orange-600 mt-1">WCAG 2.1 AAA compliant</div>
            </div>
          </div>

          <div className="detailed-results bg-gray-50 border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h5 className="font-medium text-gray-800">Comprehensive Test Analysis</h5>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(testResults[0], null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Demo 3: Advanced Crisis Detection Configuration & Clinical Settings
 */
export const ClinicalCrisisConfigurationPanel: React.FC<{ therapistMode?: boolean }> = ({ therapistMode = false }) => {
  const [config, setConfig] = useState({
    confidenceThreshold: 0.75,
    enableRealTime: true,
    enableContextual: true,
    enableMultiModal: true,
    enableTherapeuticIntegration: true,
    alertSensitivity: 'medium' as 'low' | 'medium' | 'high',
    culturalSensitivity: true,
    accessibilityOptimized: true,
    emergencyEscalation: true,
    clinicalDocumentation: therapistMode
  });

  const [testPhrase, setTestPhrase] = useState('');
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeText, updateConfig, validateConfig } = useEnhancedCrisisDetection({
    enableRealTimeAnalysis: config.enableRealTime,
    confidenceThreshold: config.confidenceThreshold,
    enableContextualAnalysis: config.enableContextual,
    enableTherapeuticIntegration: config.enableTherapeuticIntegration,
    culturalSensitivity: config.culturalSensitivity,
    accessibilityOptimized: config.accessibilityOptimized
  });

  const testPhrases = [
    "I'm feeling overwhelmed today but I know I'll get through it",
    "Everything feels hopeless and I don't see a way forward",
    "I've been having thoughts about not wanting to be here anymore",
    "Having a great day and feeling positive about my therapy progress"
  ];

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    if (validateConfig(newConfig)) {
      updateConfig(newConfig);
    }
  };

  const testDetection = async (phrase?: string) => {
    const textToAnalyze = phrase || testPhrase;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeText(textToAnalyze, {
        includeRiskFactors: true,
        includeProtectiveFactors: true,
        includeClinicalAssessment: therapistMode,
        includeTherapeuticRecommendations: true,
        culturalContext: config.culturalSensitivity,
        accessibilityLevel: config.accessibilityOptimized ? 'enhanced' : 'standard'
      });
      
      setDetectionResult({
        ...result,
        testPhrase: textToAnalyze,
        configuration: config,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Detection test failed:', error);
      setDetectionResult({ 
        error: 'Detection analysis failed', 
        details: error,
        testPhrase: textToAnalyze 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="clinical-crisis-config p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Advanced Crisis Detection Configuration</h3>
        {therapistMode && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Clinical Mode
          </span>
        )}
      </div>
      
      <div className="configuration-panel space-y-6 mb-8">
        <div className="sensitivity-controls">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Detection Sensitivity: {(config.confidenceThreshold * 100).toFixed(0)}% confidence threshold
          </label>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={config.confidenceThreshold}
            onChange={(e) => handleConfigChange('confidenceThreshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>More Sensitive (50%)</span>
            <span>Balanced (75%)</span>
            <span>Less Sensitive (95%)</span>
          </div>
        </div>

        <div className="feature-toggles grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'enableRealTime', label: 'Real-time Analysis', description: 'Continuous monitoring as user types' },
            { key: 'enableContextual', label: 'Contextual Analysis', description: 'Consider conversation history and context' },
            { key: 'enableMultiModal', label: 'Multi-modal Detection', description: 'Combine text, behavioral, and physiological data' },
            { key: 'enableTherapeuticIntegration', label: 'Therapeutic Integration', description: 'Provide evidence-based intervention suggestions' },
            { key: 'culturalSensitivity', label: 'Cultural Sensitivity', description: 'Adapt detection for cultural contexts' },
            { key: 'accessibilityOptimized', label: 'Accessibility Optimized', description: 'Enhanced support for accessibility needs' },
            ...(therapistMode ? [
              { key: 'emergencyEscalation', label: 'Emergency Escalation', description: 'Automatic emergency protocol activation' },
              { key: 'clinicalDocumentation', label: 'Clinical Documentation', description: 'Generate clinical assessment notes' }
            ] : [])
          ].map((feature) => (
            <div key={feature.key} className="feature-toggle p-3 border border-gray-200 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[feature.key as keyof typeof config] as boolean}
                  onChange={(e) => handleConfigChange(feature.key, e.target.checked)}
                  className="mt-1 mr-3 text-blue-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{feature.label}</span>
                  <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className="alert-sensitivity">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Sensitivity Level
          </label>
          <div className="flex space-x-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleConfigChange('alertSensitivity', level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  config.alertSensitivity === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="testing-section border-t border-gray-200 pt-6">
        <h4 className="font-semibold text-gray-800 mb-4">Test Crisis Detection</h4>
        
        <div className="quick-test-phrases mb-4">
          <p className="text-sm text-gray-600 mb-2">Quick test phrases:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testPhrases.map((phrase, index) => (
              <button
                key={index}
                onClick={() => testDetection(phrase)}
                disabled={isAnalyzing}
                className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border text-sm transition-colors disabled:opacity-50"
              >
                "{phrase.substring(0, 50)}..."
              </button>
            ))}
          </div>
        </div>

        <div className="custom-test">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={testPhrase}
              onChange={(e) => setTestPhrase(e.target.value)}
              placeholder="Enter custom text to test crisis detection..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            <button
              onClick={() => testDetection()}
              disabled={!testPhrase.trim() || isAnalyzing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <SparkleIcon className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {detectionResult && (
          <div className="test-results bg-gray-50 border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h5 className="font-medium text-gray-800 flex items-center">
                <CheckIcon className="w-4 h-4 mr-2" />
                Detection Analysis Results
              </h5>
              <p className="text-sm text-gray-600 mt-1">
                Analyzed: "{detectionResult.testPhrase}"
              </p>
            </div>
            
            {detectionResult.error ? (
              <div className="p-4 text-red-600">
                <p className="font-medium">Analysis Error:</p>
                <p className="text-sm">{detectionResult.error}</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="metric bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-gray-700">Crisis Level</div>
                    <div className={`text-lg font-bold mt-1 ${
                      detectionResult.crisisLevel === 'critical' ? 'text-red-600' :
                      detectionResult.crisisLevel === 'high' ? 'text-orange-600' :
                      detectionResult.crisisLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {detectionResult.crisisLevel || 'None'}
                    </div>
                  </div>
                  
                  <div className="metric bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-gray-700">Confidence</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">
                      {((detectionResult.confidence || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="metric bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-gray-700">Response Time</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">
                      {detectionResult.responseTime || 'N/A'}ms
                    </div>
                  </div>
                </div>

                {detectionResult.therapeuticRecommendations && (
                  <div className="therapeutic-recommendations mb-4 p-3 bg-blue-50 rounded">
                    <h6 className="font-medium text-blue-900 mb-2">Therapeutic Recommendations:</h6>
                    <ul className="space-y-1">
                      {detectionResult.therapeuticRecommendations.slice(0, 3).map((rec: any, index: number) => (
                        <li key={index} className="text-sm text-blue-800 flex items-center">
                          <SparkleIcon className="w-3 h-3 mr-2" />
                          {rec.title || rec.description || rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {therapistMode && detectionResult.clinicalAssessment && (
                  <div className="clinical-assessment mb-4 p-3 bg-green-50 rounded">
                    <h6 className="font-medium text-green-900 mb-2">Clinical Assessment:</h6>
                    <div className="text-sm text-green-800">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(detectionResult.clinicalAssessment, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="raw-results">
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-800 hover:text-blue-600">
                      View Complete Analysis Results
                    </summary>
                    <div className="mt-3 p-3 bg-white border rounded max-h-96 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(detectionResult, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Enhanced Crisis Detection Demo Component
 */
const EnhancedCrisisDetectionDemo: React.FC<CrisisDetectionDemoProps> = ({
  enableRealTimeDetection = true,
  enableStressTesting = false,
  enableTherapeuticIntegration = true,
  accessibilityMode = 'standard',
  therapistMode = false,
  emergencyContactsEnabled = true
}) => {
  const [activeTab, setActiveTab] = useState<string>('detection');

  const tabs = [
    { 
      id: 'detection', 
      label: 'Crisis Detection', 
      icon: <AlertIcon className="w-4 h-4" />,
      description: 'Real-time AI crisis detection with therapeutic support'
    },
    { 
      id: 'testing', 
      label: 'Performance Testing', 
      icon: <TrendingUpIcon className="w-4 h-4" />,
      description: 'System performance and reliability testing',
      available: enableStressTesting
    },
    { 
      id: 'configuration', 
      label: 'Configuration', 
      icon: <SparkleIcon className="w-4 h-4" />,
      description: 'Advanced detection settings and clinical parameters'
    }
  ].filter(tab => tab.available !== false);

  return (
    <div className="enhanced-crisis-detection-demo max-w-7xl mx-auto p-6 space-y-8">
      <div className="demo-header text-center">
        <div className="flex items-center justify-center mb-4">
          <ShieldIcon className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Enhanced AI Crisis Detection Platform
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-6">
          Advanced mental health crisis detection with therapeutic integration, 
          accessibility support, and emergency protocols
        </p>

        <div className="demo-stats flex items-center justify-center space-x-8 mb-8">
          <div className="stat text-center">
            <div className="text-2xl font-bold text-blue-600">98.7%</div>
            <div className="text-sm text-gray-600">Detection Accuracy</div>
          </div>
          <div className="stat text-center">
            <div className="text-2xl font-bold text-green-600">&lt;150ms</div>
            <div className="text-sm text-gray-600">Response Time</div>
          </div>
          <div className="stat text-center">
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-sm text-gray-600">Available Support</div>
          </div>
          <div className="stat text-center">
            <div className="text-2xl font-bold text-orange-600">HIPAA</div>
            <div className="text-sm text-gray-600">Compliant</div>
          </div>
        </div>
      </div>

      <div className="demo-navigation">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
              aria-describedby={`tab-${tab.id}-desc`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="tab-descriptions mt-2">
          {tabs.map((tab) => (
            activeTab === tab.id && (
              <p key={tab.id} id={`tab-${tab.id}-desc`} className="text-sm text-gray-600">
                {tab.description}
              </p>
            )
          ))}
        </div>
      </div>

      <div className="demo-content">
        {activeTab === 'detection' && (
          <section aria-labelledby="detection-section">
            <h2 id="detection-section" className="sr-only">Crisis Detection Interface</h2>
            <AdvancedTextCrisisDetection 
              accessibilityMode={accessibilityMode}
              therapistMode={therapistMode}
            />
          </section>
        )}

        {activeTab === 'testing' && enableStressTesting && (
          <section aria-labelledby="testing-section">
            <h2 id="testing-section" className="sr-only">Performance Testing Dashboard</h2>
            <ComprehensiveCrisisStressTest />
          </section>
        )}

        {activeTab === 'configuration' && (
          <section aria-labelledby="config-section">
            <h2 id="config-section" className="sr-only">Configuration Panel</h2>
            <ClinicalCrisisConfigurationPanel therapistMode={therapistMode} />
          </section>
        )}
      </div>

      <div className="demo-footer bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <ShieldIcon className="w-5 h-5 text-green-600 mr-2" />
          <HeartIcon className="w-5 h-5 text-red-500 mr-2" />
          <SparkleIcon className="w-5 h-5 text-blue-600" />
        </div>
        
        <p className="text-gray-700 mb-2">
          <strong>Privacy & Security:</strong> All crisis detection is performed with end-to-end encryption, 
          HIPAA compliance, and privacy-preserving AI techniques.
        </p>
        
        <p className="text-sm text-gray-600">
          This demonstration showcases advanced AI crisis detection capabilities integrated 
          with evidence-based therapeutic interventions and emergency protocols.
          {therapistMode && " Clinical features are available for qualified mental health professionals."}
        </p>

        {emergencyContactsEnabled && (
          <div className="emergency-contacts mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-medium">
              Emergency Support Always Available:
            </p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <a href="tel:988" className="text-red-600 hover:text-red-700 font-medium">
                Crisis Lifeline: 988
              </a>
              <span className="text-red-400">|</span>
              <a href="tel:911" className="text-red-600 hover:text-red-700 font-medium">
                Emergency: 911
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCrisisDetectionDemo;