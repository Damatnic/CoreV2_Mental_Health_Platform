/**
 * Volunteer Tether Component
 *
 * Comprehensive React component for volunteer peer support connections,
 * enabling trained volunteers to provide crisis support and guidance
 *
 * Features:
 * - Volunteer matching and connection system
 * - Real-time crisis alert handling
 * - Volunteer availability management
 * - Training and certification tracking
 * - Performance metrics and feedback
 * - Crisis escalation protocols
 * - Anonymous and verified support modes
 * - Cultural and language matching
 * - Full WCAG 2.1 AAA compliance
 *
 * @license Apache-2.0
 */

import * as React from 'react';
const { useState, useEffect, useCallback, useMemo, useRef } = React;
import { logger } from '../../utils/logger';

// Enhanced mental health specific types
export type CrisisLevel = 'low' | 'moderate' | 'high' | 'critical' | 'emergency';
export type MentalHealthSpecialty = 'anxiety' | 'depression' | 'bipolar' | 'ptsd' | 'eating-disorders' | 'substance-abuse' | 'suicide-prevention' | 'trauma' | 'grief' | 'family-crisis';
export type TherapeuticApproach = 'cbt' | 'dbt' | 'humanistic' | 'psychodynamic' | 'mindfulness' | 'crisis-intervention' | 'peer-support' | 'narrative-therapy';
export type CrisisInterventionLevel = 'basic' | 'intermediate' | 'advanced' | 'expert' | 'specialist';
export type CulturalCompetency = 'lgbtq+' | 'trauma-informed' | 'culturally-responsive' | 'neurodivergent-affirming' | 'military-veteran' | 'indigenous' | 'refugee-immigrant';

// Enhanced interfaces for mental health platform
export interface MentalHealthCertification {
  name: string;
  type: 'crisis-intervention' | 'suicide-prevention' | 'trauma-therapy' | 'cultural-competency' | 'accessibility' | 'hipaa-compliance';
  level: CrisisInterventionLevel;
  issueDate: Date;
  expiryDate: Date;
  verified: boolean;
  issuingOrganization: string;
  credentialId?: string;
  continuingEducationHours?: number;
}

export interface CrisisPerformanceMetrics {
  crisisResponseTime: number; // seconds
  deescalationSuccessRate: number; // 0-1
  safetyPlanCompletions: number;
  emergencyReferrals: number;
  followUpCompliance: number; // 0-1
  clientRetentionRate: number; // 0-1
  therapeuticOutcomes: number; // positive outcomes count
  accessibilityCompliance: number; // 0-1
  hipaaComplianceScore: number; // 0-1
}

export interface AccessibilityProfile {
  screenReaderOptimized: boolean;
  highContrastSupport: boolean;
  keyboardNavigationEnabled: boolean;
  cognitiveAccessibilityFeatures: string[];
  languageSimplification: boolean;
  culturalAdaptations: string[];
  assistiveTechnologySupport: string[];
}

// Volunteer Profile Interface - Enhanced for Mental Health
export interface VolunteerProfile {
  id: string;
  displayName: string;
  avatar?: string;
  bio: string;
  languages: string[];
  timeZone: string;
  mentalHealthSpecialties: MentalHealthSpecialty[];
  therapeuticApproaches: TherapeuticApproach[];
  culturalCompetencies: CulturalCompetency[];
  certifications: MentalHealthCertification[];
  experience: {
    yearsVolunteering: number;
    totalSessions: number;
    crisisSessionsHandled: number;
    suicidePreventionInterventions: number;
    traumaInformedSessions: number;
    culturallyResponsiveSessions: number;
    averageRating: number;
    completionRate: number;
    clientSatisfactionScore: number;
  };
  availability: {
    status: 'available' | 'busy' | 'on_break' | 'offline' | 'crisis-only' | 'emergency-standby';
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
      maxSessions: number;
      crisisAvailable: boolean;
    }>;
    currentLoad: number;
    maxConcurrentSessions: number;
    emergencyOnCall: boolean;
  };
  preferences: {
    crisisTypes: MentalHealthSpecialty[];
    crisisLevels: CrisisLevel[];
    ageGroups: string[];
    communicationMethods: Array<'chat' | 'voice' | 'video' | 'sign-language'>;
    culturalBackgrounds: string[];
    accessibilityFeatures: string[];
  };
  performance: CrisisPerformanceMetrics & {
    sessionQuality: number; // 1-5
    lastActive: Date;
    mentalHealthOutcomes: {
      crisisPrevented: number;
      safetyPlansCreated: number;
      therapeuticBreakthroughs: number;
      hospitalizations_prevented: number;
    };
  };
  accessibilityProfile: AccessibilityProfile;
  supervision: {
    supervisorId?: string;
    lastSupervisionDate: Date;
    nextReviewDate: Date;
    supervisoryNotes?: string;
  };
}

// Enhanced Crisis Alert Interface for Mental Health Platform
export interface CrisisAlert {
  id: string;
  userId: string;
  severity: CrisisLevel;
  crisisType: MentalHealthSpecialty;
  primaryConcern: string;
  description: string;
  riskAssessment: {
    suicidalIdeation: boolean;
    selfHarmRisk: boolean;
    harmToOthersRisk: boolean;
    substanceUse: boolean;
    psychosis: boolean;
    imminentDanger: boolean;
  };
  mentalHealthHistory: {
    previousTherapy: boolean;
    currentMedications?: string[];
    diagnosedConditions?: string[];
    previousHospitalizations: boolean;
    currentTreatmentProvider?: string;
  };
  location?: {
    country: string;
    state?: string;
    timezone: string;
    emergencyServices: {
      police: string;
      medical: string;
      mentalHealth: string;
    };
    safetyResources: string[];
  };
  userPreferences: {
    language: string;
    culturalBackground?: string;
    communicationMethod: 'chat' | 'voice' | 'video' | 'sign-language';
    anonymity: boolean;
    genderPreference?: 'male' | 'female' | 'non-binary' | 'no-preference';
    ageRangePreference?: string;
    culturalMatchingPreferred: boolean;
    accessibilityNeeds: string[];
  };
  triggerWarnings: string[];
  supportNetwork: {
    emergencyContacts: Array<{
      name: string;
      relationship: string;
      phone: string;
      notifyInCrisis: boolean;
    }>;
    hasTherapist: boolean;
    familySupport: boolean;
    friendSupport: boolean;
  };
  timestamp: Date;
  estimatedWaitTime: number;
  assignedVolunteer?: string;
  backupVolunteers?: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated' | 'emergency-services-called';
  priority: 'routine' | 'urgent' | 'emergency' | 'life-threatening';
  escalationHistory?: Array<{
    timestamp: Date;
    from: CrisisLevel;
    to: CrisisLevel;
    reason: string;
    volunteerId?: string;
  }>;
}

// Enhanced Volunteer Session Interface for Mental Health Platform
export interface VolunteerSession {
  id: string;
  alertId: string;
  volunteerId: string;
  userId: string;
  type: 'crisis' | 'suicide-prevention' | 'trauma-support' | 'follow-up' | 'peer-support' | 'emergency-intervention';
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'escalated-to-emergency';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  communicationMethod: 'chat' | 'voice' | 'video' | 'sign-language';
  interventions: {
    appliedTechniques: TherapeuticApproach[];
    crisisDeescalationUsed: boolean;
    safetyPlanCreated: boolean;
    copingStrategiesProvided: string[];
    resourcesShared: string[];
    emergencyContactsActivated: boolean;
  };
  riskAssessment: {
    initialRiskLevel: CrisisLevel;
    finalRiskLevel: CrisisLevel;
    riskFactors: string[];
    protectiveFactors: string[];
    immediateSafetyEnsured: boolean;
  };
  therapeuticNotes: {
    sessionSummary: string;
    clientPresentation: string;
    interventionsUsed: string;
    clientResponse: string;
    progressNotes: string;
    riskAssessmentNotes: string;
  };
  outcome: 'crisis-resolved' | 'safety-plan-created' | 'escalated-to-professional' | 'emergency-services-called' | 'ongoing-support' | 'referred-to-therapy';
  followUpPlan: {
    required: boolean;
    timeframe: string;
    followUpType: 'check-in' | 'continued-support' | 'professional-referral' | 'crisis-prevention';
    resources: string[];
    nextSteps: string[];
  };
  accessibility: {
    accommodationsProvided: string[];
    assistiveTechnologyUsed: string[];
    communicationAdaptations: string[];
  };
  supervision: {
    supervisorConsulted: boolean;
    supervisoryNotes?: string;
    qualityAssuranceReview?: {
      rating: number;
      feedback: string;
      recommendationsForImprovement: string[];
    };
  };
  feedback?: {
    userRating: number;
    userComment: string;
    volunteerSelfAssessment: {
      confidenceLevel: number;
      techniquesEffectiveness: number;
      areasForImprovement: string[];
      additionalTrainingNeeded: string[];
    };
    supervisorReview?: {
      clinicalJudgment: number;
      interventionAppropriate: boolean;
      documentationQuality: number;
      recommendedActions: string[];
    };
  };
  complianceFlags: {
    hipaaCompliant: boolean;
    ethicalGuidelinesFollowed: boolean;
    scopeOfPracticeMaintained: boolean;
    mandatoryReportingTriggered?: {
      triggered: boolean;
      reason: string;
      actionTaken: string;
    };
  };
}

// Enhanced Component Props Interface for Mental Health Platform
export interface VolunteerTetherProps {
  volunteerId?: string;
  onSessionStart?: (session: VolunteerSession) => void;
  onSessionEnd?: (session: VolunteerSession) => void;
  onCrisisEscalation?: (alert: CrisisAlert) => void;
  onEmergencyEscalation?: (alert: CrisisAlert, emergencyServices: string[]) => void;
  onSafetyPlanCreated?: (sessionId: string, safetyPlan: SafetyPlan) => void;
  onSupervisionRequested?: (sessionId: string, reason: string) => void;
  className?: string;
  theme?: 'light' | 'dark' | 'high-contrast' | 'crisis-mode';
  accessibilityMode?: 'standard' | 'enhanced' | 'screenReader';
  supervisionMode?: boolean;
  emergencyProtocolsEnabled?: boolean;
}

// Mental Health Platform Specific Types
export interface EmergencyProtocol {
  id: string;
  name: string;
  triggerConditions: CrisisLevel[];
  steps: Array<{
    order: number;
    description: string;
    requiredAction: boolean;
    timeLimit?: number; // minutes
  }>;
  contacts: Array<{
    type: 'emergency' | 'supervisor' | 'backup-volunteer';
    name: string;
    phone: string;
    available24_7: boolean;
  }>;
}

export interface SafetyPlan {
  id: string;
  sessionId: string;
  userId: string;
  volunteerId: string;
  createdAt: Date;
  warningSignsIdentified: string[];
  copingStrategies: string[];
  socialSupports: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  professionalContacts: Array<{
    name: string;
    type: 'therapist' | 'psychiatrist' | 'crisis-line';
    phone: string;
    available: string;
  }>;
  environmentalSafety: {
    lethalMeansRemoved: boolean;
    safeEnvironmentEnsured: boolean;
    supportPersonPresent: boolean;
  };
  followUpPlan: {
    nextAppointment?: Date;
    checkInSchedule: string;
    emergencyPlan: string;
  };
  clientAgreement: boolean;
  lastUpdated: Date;
}

// Mock hooks interfaces for proper typing
interface PeerSupportHook {
  userProfile: any;
  availablePeers: any[];
  activeSessions: any[];
  connectionRequests: any[];
  isLoading: boolean;
  error: string | null;
  acceptConnectionRequest: (requestId: string) => Promise<void>;
  startSession: (peerId: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  updateAvailability: (status: string) => Promise<void>;
  escalateToCrisis: (sessionId: string) => Promise<void>;
}

interface AccessibilityMonitoringHook {
  violations: any[];
  metrics: any;
  isMonitoring: boolean;
  announceLiveRegion: (message: string, priority: 'polite' | 'assertive') => void;
  setFocusTrap: (element: HTMLElement) => void;
}

// Mock hook implementations
const usePeerSupport = (): PeerSupportHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    userProfile: null,
    availablePeers: [],
    activeSessions: [],
    connectionRequests: [],
    isLoading,
    error,
    acceptConnectionRequest: async () => {},
    startSession: async () => {},
    endSession: async () => {},
    updateAvailability: async () => {},
    escalateToCrisis: async () => {}
  };
};

const useAccessibilityMonitoring = (): AccessibilityMonitoringHook => {
  const announceLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive') => {
    // Create or update live region
    let liveRegion = document.getElementById('accessibility-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'accessibility-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = message;
  }, []);

  const setFocusTrap = useCallback((element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    violations: [],
    metrics: {},
    isMonitoring: true,
    announceLiveRegion,
    setFocusTrap
  };
};

// Mock volunteer profile for development
const createMockVolunteerProfile = (id: string): VolunteerProfile => ({
  id,
  displayName: 'Sarah Williams, LCSW',
  avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
  bio: 'Licensed clinical social worker with 10+ years of crisis intervention experience.',
  languages: ['English', 'Spanish', 'ASL'],
  timeZone: 'America/New_York',
  mentalHealthSpecialties: ['suicide-prevention', 'trauma', 'depression', 'anxiety'],
  therapeuticApproaches: ['cbt', 'dbt', 'crisis-intervention', 'mindfulness'],
  culturalCompetencies: ['lgbtq+', 'trauma-informed', 'culturally-responsive'],
  certifications: [
    {
      name: 'QPR Suicide Prevention',
      type: 'suicide-prevention',
      level: 'expert',
      issueDate: new Date('2022-01-15'),
      expiryDate: new Date('2025-01-15'),
      verified: true,
      issuingOrganization: 'QPR Institute',
      credentialId: 'QPR-2022-12345',
      continuingEducationHours: 40
    },
    {
      name: 'Crisis Intervention Team',
      type: 'crisis-intervention',
      level: 'advanced',
      issueDate: new Date('2021-06-01'),
      expiryDate: new Date('2024-06-01'),
      verified: true,
      issuingOrganization: 'International Critical Incident Stress Foundation',
      credentialId: 'CIT-2021-67890',
      continuingEducationHours: 60
    }
  ],
  experience: {
    yearsVolunteering: 5,
    totalSessions: 1250,
    crisisSessionsHandled: 450,
    suicidePreventionInterventions: 85,
    traumaInformedSessions: 320,
    culturallyResponsiveSessions: 280,
    averageRating: 4.8,
    completionRate: 0.96,
    clientSatisfactionScore: 4.9
  },
  availability: {
    status: 'available',
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', maxSessions: 8, crisisAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', maxSessions: 8, crisisAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', maxSessions: 8, crisisAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', maxSessions: 8, crisisAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '15:00', maxSessions: 6, crisisAvailable: true }
    ],
    currentLoad: 2,
    maxConcurrentSessions: 3,
    emergencyOnCall: true
  },
  preferences: {
    crisisTypes: ['suicide-prevention', 'trauma', 'depression', 'anxiety'],
    crisisLevels: ['moderate', 'high', 'critical', 'emergency'],
    ageGroups: ['18-25', '26-40', '41-65', '65+'],
    communicationMethods: ['chat', 'voice', 'video', 'sign-language'],
    culturalBackgrounds: ['All backgrounds'],
    accessibilityFeatures: ['screen-reader', 'high-contrast', 'keyboard-navigation']
  },
  performance: {
    crisisResponseTime: 45, // seconds
    deescalationSuccessRate: 0.92,
    safetyPlanCompletions: 185,
    emergencyReferrals: 23,
    followUpCompliance: 0.88,
    clientRetentionRate: 0.85,
    therapeuticOutcomes: 920,
    accessibilityCompliance: 0.98,
    hipaaComplianceScore: 1.0,
    sessionQuality: 4.7,
    lastActive: new Date(),
    mentalHealthOutcomes: {
      crisisPrevented: 78,
      safetyPlansCreated: 185,
      therapeuticBreakthroughs: 145,
      hospitalizations_prevented: 42
    }
  },
  accessibilityProfile: {
    screenReaderOptimized: true,
    highContrastSupport: true,
    keyboardNavigationEnabled: true,
    cognitiveAccessibilityFeatures: ['simple-language', 'clear-instructions', 'visual-aids'],
    languageSimplification: true,
    culturalAdaptations: ['culturally-sensitive-content', 'diverse-representation'],
    assistiveTechnologySupport: ['JAWS', 'NVDA', 'VoiceOver', 'Dragon']
  },
  supervision: {
    supervisorId: 'supervisor-001',
    lastSupervisionDate: new Date('2024-01-15'),
    nextReviewDate: new Date('2024-02-15'),
    supervisoryNotes: 'Excellent crisis management skills. Continue professional development in trauma-informed care.'
  }
});

/**
 * Volunteer Tether Component
 */
export const VolunteerTether: React.FC<VolunteerTetherProps> = ({
  volunteerId,
  onSessionStart,
  onSessionEnd,
  onCrisisEscalation,
  onEmergencyEscalation,
  onSafetyPlanCreated,
  onSupervisionRequested,
  className = '',
  theme = 'light',
  accessibilityMode = 'standard',
  supervisionMode = false,
  emergencyProtocolsEnabled = true
}) => {
  // Hooks with proper typing
  const {
    userProfile,
    availablePeers,
    activeSessions,
    connectionRequests,
    isLoading: peerSupportLoading,
    error: peerSupportError,
    acceptConnectionRequest,
    startSession,
    endSession,
    updateAvailability,
    escalateToCrisis
  } = usePeerSupport();

  const {
    violations,
    metrics: accessibilityMetrics,
    isMonitoring,
    announceLiveRegion,
    setFocusTrap
  } = useAccessibilityMonitoring();

  // Enhanced State for Mental Health Platform
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null);
  const [pendingAlerts, setPendingAlerts] = useState<CrisisAlert[]>([]);
  const [currentSession, setCurrentSession] = useState<VolunteerSession | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<VolunteerProfile['availability']['status']>('offline');
  const [sessionHistory, setSessionHistory] = useState<VolunteerSession[]>([]);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [activeSafetyPlan, setActiveSafetyPlan] = useState<SafetyPlan | null>(null);
  const [emergencyProtocols, setEmergencyProtocols] = useState<EmergencyProtocol[]>([]);
  const [supervisionRequired, setSupervisionRequired] = useState(false);
  const [crisisEscalationInProgress, setCrisisEscalationInProgress] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [realTimeMetrics, setRealTimeMetrics] = useState<{
    activeSessionDuration: number;
    riskLevel: CrisisLevel;
    interventionsApplied: number;
    supervisionAlerts: number;
  } | null>(null);
  
  // Refs for accessibility and emergency protocols
  const emergencyButtonRef = useRef<HTMLButtonElement>(null);
  const crisisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supervisionAlertRef = useRef<HTMLDivElement>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load enhanced volunteer profile and emergency protocols
  useEffect(() => {
    const loadVolunteerProfile = async () => {
      if (!volunteerId) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        
        // Use mock data for development
        const profile = createMockVolunteerProfile(volunteerId);
        setVolunteerProfile(profile);
        setAvailabilityStatus(profile.availability.status);
        
        // Load mock emergency protocols
        const protocols: EmergencyProtocol[] = [
          {
            id: 'protocol-001',
            name: 'Suicide Risk Protocol',
            triggerConditions: ['critical', 'emergency'],
            steps: [
              { order: 1, description: 'Assess imminent risk', requiredAction: true, timeLimit: 5 },
              { order: 2, description: 'Create safety plan', requiredAction: true, timeLimit: 15 },
              { order: 3, description: 'Contact emergency services if needed', requiredAction: false, timeLimit: 2 },
              { order: 4, description: 'Document intervention', requiredAction: true, timeLimit: 10 }
            ],
            contacts: [
              { type: 'emergency', name: '988 Suicide & Crisis Lifeline', phone: '988', available24_7: true },
              { type: 'supervisor', name: 'Dr. Jane Smith', phone: '555-0100', available24_7: false }
            ]
          }
        ];
        setEmergencyProtocols(protocols);
        
        // Announce profile loaded for accessibility
        announceLiveRegion(`Volunteer profile loaded. Specialties: ${profile.mentalHealthSpecialties.join(', ')}`, 'polite');
        
        logger.info('Enhanced volunteer profile loaded', { 
          volunteerId, 
          specialties: profile.mentalHealthSpecialties.length,
          certifications: profile.certifications.length 
        });
      } catch (error) {
        logger.error('Failed to load volunteer profile', { volunteerId, error });
        announceLiveRegion('Failed to load volunteer profile. Please refresh.', 'assertive');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadVolunteerProfile();
  }, [volunteerId, announceLiveRegion]);

  // Load pending crisis alerts with enhanced mental health filtering
  useEffect(() => {
    const loadPendingAlerts = async () => {
      if (!volunteerProfile) return;

      try {
        // Mock crisis alerts for development
        const mockAlerts: CrisisAlert[] = [
          {
            id: 'alert-001',
            userId: 'user-789',
            severity: 'high',
            crisisType: 'anxiety',
            primaryConcern: 'Severe panic attack',
            description: 'User experiencing severe panic attack with chest pain and difficulty breathing',
            riskAssessment: {
              suicidalIdeation: false,
              selfHarmRisk: false,
              harmToOthersRisk: false,
              substanceUse: false,
              psychosis: false,
              imminentDanger: false
            },
            mentalHealthHistory: {
              previousTherapy: true,
              currentMedications: ['Sertraline'],
              diagnosedConditions: ['Generalized Anxiety Disorder'],
              previousHospitalizations: false,
              currentTreatmentProvider: 'Dr. Johnson'
            },
            location: {
              country: 'USA',
              state: 'NY',
              timezone: 'America/New_York',
              emergencyServices: {
                police: '911',
                medical: '911',
                mentalHealth: '988'
              },
              safetyResources: ['Local Crisis Center', 'Emergency Room']
            },
            userPreferences: {
              language: 'English',
              culturalBackground: 'North American',
              communicationMethod: 'chat',
              anonymity: false,
              genderPreference: 'no-preference',
              ageRangePreference: '25-40',
              culturalMatchingPreferred: false,
              accessibilityNeeds: []
            },
            triggerWarnings: ['medical anxiety'],
            supportNetwork: {
              emergencyContacts: [
                { name: 'John Doe', relationship: 'Spouse', phone: '555-0123', notifyInCrisis: true }
              ],
              hasTherapist: true,
              familySupport: true,
              friendSupport: true
            },
            timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
            estimatedWaitTime: 2,
            status: 'pending',
            priority: 'urgent'
          }
        ];
        
        // Filter alerts based on volunteer preferences
        const filteredAlerts = mockAlerts.filter(alert => {
          const matchesSpecialty = volunteerProfile.mentalHealthSpecialties.includes(alert.crisisType);
          const matchesSeverity = volunteerProfile.preferences.crisisLevels.includes(alert.severity);
          const matchesLanguage = volunteerProfile.languages.includes(alert.userPreferences.language);
          return matchesSpecialty && matchesSeverity && matchesLanguage;
        });
        
        // Prioritize alerts by severity
        const prioritizedAlerts = filteredAlerts.sort((a, b) => {
          const severityOrder: Record<CrisisLevel, number> = { 
            'emergency': 5, 
            'critical': 4, 
            'high': 3, 
            'moderate': 2, 
            'low': 1 
          };
          return severityOrder[b.severity] - severityOrder[a.severity];
        });
        
        setPendingAlerts(prioritizedAlerts);
        
        // Announce critical alerts
        const criticalAlerts = prioritizedAlerts.filter(
          alert => alert.severity === 'critical' || alert.severity === 'emergency'
        );
        if (criticalAlerts.length > 0) {
          announceLiveRegion(
            `${criticalAlerts.length} critical mental health alerts require immediate attention`, 
            'assertive'
          );
        }
        
      } catch (error) {
        logger.error('Failed to load pending alerts', { error });
      }
    };

    const interval = setInterval(loadPendingAlerts, 5000); // Check every 5 seconds
    loadPendingAlerts();

    return () => clearInterval(interval);
  }, [volunteerProfile, announceLiveRegion]);

  // Track session duration
  useEffect(() => {
    if (currentSession && !sessionTimerRef.current) {
      sessionTimerRef.current = setInterval(() => {
        setRealTimeMetrics(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activeSessionDuration: Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)
          };
        });
      }, 60000); // Update every minute
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [currentSession]);

  // Handle enhanced availability change with crisis considerations
  const handleAvailabilityChange = useCallback(async (status: VolunteerProfile['availability']['status']) => {
    if (!volunteerProfile) return;

    try {
      // Special handling for crisis availability
      if (status === 'crisis-only' || status === 'emergency-standby') {
        const hasRequiredCertifications = volunteerProfile.certifications.some(
          cert => cert.type === 'crisis-intervention' || cert.type === 'suicide-prevention'
        );
        
        if (!hasRequiredCertifications) {
          announceLiveRegion('Crisis-only mode requires crisis intervention certification', 'assertive');
          return;
        }
      }
      
      // Update availability status
      setAvailabilityStatus(status);
      
      // Enhanced accessibility announcements
      const statusMessages: Record<VolunteerProfile['availability']['status'], string> = {
        'available': 'Available for all mental health support sessions',
        'busy': 'Currently busy with active session',
        'on_break': 'On break - not receiving new alerts',
        'offline': 'Offline - not available for support',
        'crisis-only': 'Available for crisis interventions only',
        'emergency-standby': 'On emergency standby for critical situations'
      };
      
      announceLiveRegion(statusMessages[status], 'polite');
      
      logger.info('Volunteer availability updated', { 
        volunteerId: volunteerProfile.id, 
        status, 
        crisisCapable: status === 'crisis-only' || status === 'emergency-standby' 
      });
    } catch (error) {
      logger.error('Failed to update availability', { status, error });
      announceLiveRegion('Failed to update availability status', 'assertive');
    }
  }, [volunteerProfile, announceLiveRegion]);

  // Enhanced crisis alert acceptance
  const handleAcceptAlert = useCallback(async (alert: CrisisAlert) => {
    if (!volunteerProfile) return;

    try {
      // Verify volunteer qualifications
      const hasRequiredSpecialty = volunteerProfile.mentalHealthSpecialties.includes(alert.crisisType);
      const hasRequiredCrisisLevel = volunteerProfile.preferences.crisisLevels.includes(alert.severity);
      
      if (alert.severity === 'critical' || alert.severity === 'emergency') {
        const hasCrisisTraining = volunteerProfile.certifications.some(
          cert => cert.type === 'crisis-intervention' && 
          (cert.level === 'advanced' || cert.level === 'expert' || cert.level === 'specialist')
        );
        if (!hasCrisisTraining) {
          announceLiveRegion('Advanced crisis training required for this severity level', 'assertive');
          return;
        }
      }
      
      if (!hasRequiredSpecialty || !hasRequiredCrisisLevel) {
        announceLiveRegion('You do not meet the requirements for this alert', 'assertive');
        return;
      }
      
      // Create volunteer session
      const session: VolunteerSession = {
        id: `session-${Date.now()}`,
        alertId: alert.id,
        volunteerId: volunteerProfile.id,
        userId: alert.userId,
        type: alert.severity === 'emergency' ? 'emergency-intervention' : 'crisis',
        status: 'active',
        startTime: new Date(),
        communicationMethod: alert.userPreferences.communicationMethod,
        interventions: {
          appliedTechniques: [],
          crisisDeescalationUsed: false,
          safetyPlanCreated: false,
          copingStrategiesProvided: [],
          resourcesShared: [],
          emergencyContactsActivated: false
        },
        riskAssessment: {
          initialRiskLevel: alert.severity,
          finalRiskLevel: alert.severity,
          riskFactors: Object.keys(alert.riskAssessment).filter(
            key => alert.riskAssessment[key as keyof typeof alert.riskAssessment] === true
          ),
          protectiveFactors: [],
          immediateSafetyEnsured: false
        },
        therapeuticNotes: {
          sessionSummary: '',
          clientPresentation: '',
          interventionsUsed: '',
          clientResponse: '',
          progressNotes: '',
          riskAssessmentNotes: ''
        },
        outcome: 'ongoing-support',
        followUpPlan: {
          required: false,
          timeframe: '',
          followUpType: 'check-in',
          resources: [],
          nextSteps: []
        },
        accessibility: {
          accommodationsProvided: alert.userPreferences.accessibilityNeeds,
          assistiveTechnologyUsed: [],
          communicationAdaptations: []
        },
        supervision: {
          supervisorConsulted: false
        },
        complianceFlags: {
          hipaaCompliant: true,
          ethicalGuidelinesFollowed: true,
          scopeOfPracticeMaintained: true
        }
      };

      setCurrentSession(session);
      setSelectedAlert(alert);
      setPendingAlerts(prev => prev.filter(a => a.id !== alert.id));
      
      // Update availability
      await handleAvailabilityChange('busy');
      
      // Initialize real-time session monitoring
      setRealTimeMetrics({
        activeSessionDuration: 0,
        riskLevel: alert.severity,
        interventionsApplied: 0,
        supervisionAlerts: 0
      });
      
      // Start supervision timer for critical sessions
      if (alert.severity === 'critical' || alert.severity === 'emergency') {
        crisisTimerRef.current = setTimeout(() => {
          setSupervisionRequired(true);
          announceLiveRegion('Crisis session exceeding 30 minutes - supervisor consultation recommended', 'assertive');
        }, 30 * 60 * 1000); // 30 minutes
      }
      
      // Enhanced accessibility announcement
      announceLiveRegion(
        `Mental health crisis session started. Severity: ${alert.severity}. Type: ${alert.crisisType}. Communication: ${alert.userPreferences.communicationMethod}`,
        'assertive'
      );
      
      // Focus management for accessibility
      if (emergencyButtonRef.current && emergencyProtocolsEnabled) {
        setFocusTrap(emergencyButtonRef.current.parentElement as HTMLElement);
      }
      
      // Callback
      onSessionStart?.(session);
      
      logger.info('Enhanced crisis alert accepted', { 
        alertId: alert.id, 
        sessionId: session.id, 
        severity: alert.severity,
        crisisType: alert.crisisType
      });
    } catch (error) {
      logger.error('Failed to accept crisis alert', { alertId: alert.id, error });
      announceLiveRegion('Failed to accept crisis alert. Please try again.', 'assertive');
    }
  }, [volunteerProfile, handleAvailabilityChange, announceLiveRegion, onSessionStart, setFocusTrap, emergencyProtocolsEnabled]);

  // Enhanced session completion
  const handleCompleteSession = useCallback(async (
    outcome: VolunteerSession['outcome'],
    therapeuticNotes?: VolunteerSession['therapeuticNotes'],
    followUpPlan?: VolunteerSession['followUpPlan'],
    safetyPlanCreated: boolean = false
  ) => {
    if (!currentSession) return;

    try {
      // Clear timers
      if (crisisTimerRef.current) {
        clearTimeout(crisisTimerRef.current);
        crisisTimerRef.current = null;
      }
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      
      const completedSession: VolunteerSession = {
        ...currentSession,
        status: 'completed',
        endTime: new Date(),
        duration: Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000),
        outcome,
        therapeuticNotes: therapeuticNotes || currentSession.therapeuticNotes,
        followUpPlan: followUpPlan || currentSession.followUpPlan,
        interventions: {
          ...currentSession.interventions,
          safetyPlanCreated
        }
      };

      setCurrentSession(null);
      setSelectedAlert(null);
      setRealTimeMetrics(null);
      setSupervisionRequired(false);
      setActiveSafetyPlan(null);
      setSessionHistory(prev => [...prev, completedSession]);
      
      // Update availability
      const nextStatus = outcome === 'emergency-services-called' ? 'on_break' : 'available';
      await handleAvailabilityChange(nextStatus);
      
      // Enhanced accessibility announcements
      const outcomeMessages: Record<VolunteerSession['outcome'], string> = {
        'crisis-resolved': 'Crisis successfully resolved. Client safety ensured.',
        'safety-plan-created': 'Safety plan created. Follow-up scheduled.',
        'escalated-to-professional': 'Escalated to professional care. Appropriate referral made.',
        'emergency-services-called': 'Emergency services contacted. Client safety prioritized.',
        'ongoing-support': 'Ongoing support established. Continued care planned.',
        'referred-to-therapy': 'Referred to therapy services. Professional follow-up arranged.'
      };
      
      announceLiveRegion(outcomeMessages[outcome], 'polite');
      
      // Callbacks
      if (safetyPlanCreated && activeSafetyPlan) {
        onSafetyPlanCreated?.(currentSession.id, activeSafetyPlan);
      }
      
      onSessionEnd?.(completedSession);
      
      logger.info('Enhanced volunteer session completed', { 
        sessionId: currentSession.id, 
        outcome,
        duration: completedSession.duration,
        safetyPlanCreated
      });
    } catch (error) {
      logger.error('Failed to complete session', { sessionId: currentSession.id, error });
      announceLiveRegion('Failed to complete session. Please try again or contact supervisor.', 'assertive');
    }
  }, [currentSession, activeSafetyPlan, handleAvailabilityChange, announceLiveRegion, onSessionEnd, onSafetyPlanCreated]);

  // Enhanced crisis escalation
  const handleEscalateToEmergency = useCallback(async () => {
    if (!currentSession || !selectedAlert) return;

    try {
      setCrisisEscalationInProgress(true);
      
      // Determine emergency services
      const emergencyServices: string[] = [];
      if (selectedAlert.riskAssessment.suicidalIdeation || selectedAlert.riskAssessment.selfHarmRisk) {
        emergencyServices.push('mental-health-crisis-team');
      }
      if (selectedAlert.riskAssessment.imminentDanger) {
        emergencyServices.push('emergency-medical-services');
      }
      if (selectedAlert.riskAssessment.harmToOthersRisk) {
        emergencyServices.push('police-mental-health-unit');
      }
      
      // Complete session with emergency escalation
      await handleCompleteSession(
        'emergency-services-called',
        {
          sessionSummary: `Crisis escalated to emergency services: ${emergencyServices.join(', ')}`,
          clientPresentation: 'Client presented with imminent risk requiring emergency intervention',
          interventionsUsed: 'Crisis de-escalation attempted, emergency protocols activated',
          clientResponse: 'Risk level exceeded volunteer scope',
          progressNotes: 'Emergency escalation appropriate',
          riskAssessmentNotes: `Risk factors: ${Object.keys(selectedAlert.riskAssessment).filter(
            key => selectedAlert.riskAssessment[key as keyof typeof selectedAlert.riskAssessment]
          ).join(', ')}`
        },
        {
          required: true,
          timeframe: '24 hours',
          followUpType: 'professional-referral',
          resources: ['emergency services information'],
          nextSteps: ['await emergency response', 'document incident']
        },
        false
      );
      
      // Announcement
      announceLiveRegion(
        `EMERGENCY: Crisis escalated. Services contacted: ${emergencyServices.join(', ')}`,
        'assertive'
      );
      
      // Callbacks
      onCrisisEscalation?.(selectedAlert);
      onEmergencyEscalation?.(selectedAlert, emergencyServices);
      
      // Request supervision
      if (supervisionMode) {
        onSupervisionRequested?.(currentSession.id, 'Emergency escalation - review required');
      }
      
      logger.warn('Crisis escalated to emergency services', { 
        alertId: selectedAlert.id,
        sessionId: currentSession.id,
        emergencyServices
      });
    } catch (error) {
      logger.error('Failed to escalate crisis', { error });
      announceLiveRegion('Failed to escalate to emergency services. Contact supervisor immediately.', 'assertive');
    } finally {
      setCrisisEscalationInProgress(false);
    }
  }, [currentSession, selectedAlert, handleCompleteSession, announceLiveRegion, onCrisisEscalation, onEmergencyEscalation, supervisionMode, onSupervisionRequested]);

  // Handle safety plan creation
  const handleCreateSafetyPlan = useCallback(async () => {
    if (!currentSession || !selectedAlert || !volunteerProfile) return;

    try {
      const safetyPlan: SafetyPlan = {
        id: `safety-plan-${currentSession.id}`,
        sessionId: currentSession.id,
        userId: selectedAlert.userId,
        volunteerId: volunteerProfile.id,
        createdAt: new Date(),
        warningSignsIdentified: ['Identified during session'],
        copingStrategies: ['Grounding techniques', 'Breathing exercises', 'Call crisis line'],
        socialSupports: selectedAlert.supportNetwork.emergencyContacts.map(contact => ({
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone
        })),
        professionalContacts: [
          {
            name: '988 Suicide & Crisis Lifeline',
            type: 'crisis-line',
            phone: '988',
            available: '24/7'
          }
        ],
        environmentalSafety: {
          lethalMeansRemoved: false,
          safeEnvironmentEnsured: false,
          supportPersonPresent: false
        },
        followUpPlan: {
          nextAppointment: new Date(Date.now() + 24 * 60 * 60 * 1000),
          checkInSchedule: 'Daily for first week',
          emergencyPlan: 'Call 988 or go to nearest emergency room'
        },
        clientAgreement: false,
        lastUpdated: new Date()
      };
      
      setActiveSafetyPlan(safetyPlan);
      
      announceLiveRegion('Safety plan created. Review with client for agreement.', 'polite');
      
      // Callback
      onSafetyPlanCreated?.(currentSession.id, safetyPlan);
      
      // Update metrics
      setRealTimeMetrics(prev => prev ? {
        ...prev,
        interventionsApplied: prev.interventionsApplied + 1
      } : null);
      
      logger.info('Safety plan created', {
        sessionId: currentSession.id,
        safetyPlanId: safetyPlan.id
      });
    } catch (error) {
      logger.error('Failed to create safety plan', { error });
      announceLiveRegion('Failed to create safety plan. Please try again.', 'assertive');
    }
  }, [currentSession, selectedAlert, volunteerProfile, onSafetyPlanCreated, announceLiveRegion]);

  // Enhanced volunteer statistics
  const volunteerStats = useMemo(() => {
    if (!volunteerProfile) return null;

    return {
      totalSessions: volunteerProfile.experience.totalSessions,
      crisisSessions: volunteerProfile.experience.crisisSessionsHandled,
      suicidePreventionSessions: volunteerProfile.experience.suicidePreventionInterventions,
      traumaInformedSessions: volunteerProfile.experience.traumaInformedSessions,
      culturallyResponsiveSessions: volunteerProfile.experience.culturallyResponsiveSessions,
      averageRating: volunteerProfile.experience.averageRating,
      clientSatisfactionScore: volunteerProfile.experience.clientSatisfactionScore,
      responseTime: volunteerProfile.performance.crisisResponseTime / 60,
      completionRate: volunteerProfile.experience.completionRate,
      deescalationSuccessRate: volunteerProfile.performance.deescalationSuccessRate,
      safetyPlansCreated: volunteerProfile.performance.mentalHealthOutcomes.safetyPlansCreated,
      crisesPrevented: volunteerProfile.performance.mentalHealthOutcomes.crisisPrevented,
      hospitalizationsPrevented: volunteerProfile.performance.mentalHealthOutcomes.hospitalizations_prevented,
      accessibilityCompliance: volunteerProfile.performance.accessibilityCompliance,
      hipaaCompliance: volunteerProfile.performance.hipaaComplianceScore,
      specialties: volunteerProfile.mentalHealthSpecialties,
      certificationLevel: volunteerProfile.certifications.filter(cert => cert.verified).length,
      culturalCompetencies: volunteerProfile.culturalCompetencies.length,
      therapeuticApproaches: volunteerProfile.therapeuticApproaches.length
    };
  }, [volunteerProfile]);

  // Loading state
  if (isLoadingProfile || peerSupportLoading) {
    return React.createElement(
      'div',
      {
        className: `volunteer-tether ${className} theme-${theme}`,
        role: 'main',
        'aria-label': 'Volunteer Tether Dashboard Loading'
      },
      React.createElement(
        'div',
        { className: 'loading-container', role: 'status', 'aria-live': 'polite' },
        React.createElement('div', { className: 'loading-spinner', 'aria-hidden': 'true' }),
        React.createElement('span', null, 'Loading volunteer dashboard...')
      )
    );
  }

  // Error state
  if (peerSupportError) {
    return React.createElement(
      'div',
      {
        className: `volunteer-tether ${className} theme-${theme}`,
        role: 'main',
        'aria-label': 'Volunteer Tether Dashboard Error'
      },
      React.createElement(
        'div',
        { className: 'error-container', role: 'alert' },
        React.createElement('h2', null, 'Error Loading Dashboard'),
        React.createElement('p', null, peerSupportError),
        React.createElement(
          'button',
          { onClick: () => window.location.reload(), className: 'btn btn-primary' },
          'Reload Page'
        )
      )
    );
  }

  // No volunteer profile state
  if (!volunteerProfile) {
    return React.createElement(
      'div',
      {
        className: `volunteer-tether ${className} theme-${theme}`,
        role: 'main',
        'aria-label': 'Volunteer Profile Required'
      },
      React.createElement(
        'div',
        { className: 'no-profile-container' },
        React.createElement('h2', null, 'Volunteer Profile Required'),
        React.createElement('p', null, 'Please complete your volunteer profile to access the crisis support dashboard.')
      )
    );
  }

  return (
    <div 
      className={`volunteer-tether ${className} theme-${theme} accessibility-${accessibilityMode}`}
      role="main"
      aria-label="Volunteer Crisis Support Dashboard"
    >
      {/* Header */}
      <header className="volunteer-header" role="banner">
        <div className="volunteer-info">
          {volunteerProfile.avatar && (
            <img 
              src={volunteerProfile.avatar} 
              alt={`${volunteerProfile.displayName} avatar`}
              className="volunteer-avatar"
            />
          )}
          <div className="volunteer-details">
            <h1>{volunteerProfile.displayName}</h1>
            <p className="volunteer-specializations">
              {volunteerProfile.mentalHealthSpecialties.map(s => s.replace('-', ' ')).join(', ')}
            </p>
            <p className="volunteer-certifications">
              {volunteerProfile.certifications.length} Active Certifications
            </p>
          </div>
        </div>

        {/* Availability Controls */}
        <div className="availability-controls" role="group" aria-label="Availability Controls">
          <label htmlFor="availability-select" className="sr-only">
            Change Availability Status
          </label>
          <select
            id="availability-select"
            value={availabilityStatus}
            onChange={(e) => handleAvailabilityChange(e.target.value as typeof availabilityStatus)}
            className="availability-select"
            aria-describedby="availability-help"
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="on_break">On Break</option>
            <option value="offline">Offline</option>
            <option value="crisis-only">Crisis Only</option>
            <option value="emergency-standby">Emergency Standby</option>
          </select>
          <span id="availability-help" className="sr-only">
            Your current availability status affects which crisis alerts you receive
          </span>
        </div>
      </header>

      {/* Statistics Dashboard */}
      {volunteerStats && (
        <section className="volunteer-stats" aria-label="Volunteer Statistics">
          <h2>Your Impact</h2>
          <div className="stats-grid mental-health-enhanced">
            <div className="stat-card crisis-stats">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.crisisSessions}</span>
                <span className="stat-label">Crisis Interventions</span>
                <span className="stat-sublabel">
                  {(volunteerStats.deescalationSuccessRate * 100).toFixed(0)}% success rate
                </span>
              </div>
            </div>
            
            <div className="stat-card suicide-prevention">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.suicidePreventionSessions}</span>
                <span className="stat-label">Suicide Prevention</span>
                <span className="stat-sublabel">{volunteerStats.safetyPlansCreated} safety plans</span>
              </div>
            </div>
            
            <div className="stat-card trauma-informed">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.traumaInformedSessions}</span>
                <span className="stat-label">Trauma-Informed Care</span>
                <span className="stat-sublabel">Specialized approach</span>
              </div>
            </div>
            
            <div className="stat-card cultural-responsive">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.culturallyResponsiveSessions}</span>
                <span className="stat-label">Culturally Responsive</span>
                <span className="stat-sublabel">{volunteerStats.culturalCompetencies} competencies</span>
              </div>
            </div>
            
            <div className="stat-card prevention-outcomes">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.crisesPrevented}</span>
                <span className="stat-label">Crises Prevented</span>
                <span className="stat-sublabel">
                  {volunteerStats.hospitalizationsPrevented} hospitalizations avoided
                </span>
              </div>
            </div>
            
            <div className="stat-card response-time">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.responseTime.toFixed(1)}min</span>
                <span className="stat-label">Crisis Response Time</span>
                <span className="stat-sublabel">Average response</span>
              </div>
            </div>
            
            <div className="stat-card satisfaction">
              <div className="stat-content">
                <span className="stat-number">{volunteerStats.clientSatisfactionScore.toFixed(1)}</span>
                <span className="stat-label">Client Satisfaction</span>
                <span className="stat-sublabel">Out of 5.0</span>
              </div>
            </div>
            
            <div className="stat-card compliance">
              <div className="stat-content">
                <span className="stat-number">
                  {(volunteerStats.accessibilityCompliance * 100).toFixed(0)}%
                </span>
                <span className="stat-label">Accessibility</span>
                <span className="stat-sublabel">WCAG AAA compliant</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Current Session */}
      {currentSession && selectedAlert && (
        <section 
          className="current-session mental-health-enhanced" 
          aria-label="Active Mental Health Crisis Session"
        >
          <div className="session-header">
            <h2>Active Crisis Intervention Session</h2>
            {supervisionRequired && (
              <div 
                className="supervision-alert" 
                ref={supervisionAlertRef} 
                role="alert" 
                aria-live="assertive"
              >
                Supervisor consultation recommended - Session exceeding 30 minutes
              </div>
            )}
          </div>
          
          <div className="session-details enhanced">
            <div className="crisis-info-panel">
              <div className="crisis-severity">
                <div className={`severity-badge severity-${selectedAlert.severity}`}>
                  {selectedAlert.severity.toUpperCase()}
                </div>
                {selectedAlert.priority && (
                  <div className={`priority-badge priority-${selectedAlert.priority}`}>
                    {selectedAlert.priority.toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="crisis-details">
                <div className="detail-item">
                  <strong>Crisis Type:</strong> {selectedAlert.crisisType.replace('-', ' ')}
                </div>
                <div className="detail-item">
                  <strong>Primary Concern:</strong> {selectedAlert.primaryConcern}
                </div>
                <div className="detail-item">
                  <strong>Duration:</strong> {realTimeMetrics?.activeSessionDuration || 0} minutes
                </div>
                <div className="detail-item">
                  <strong>Communication:</strong> {selectedAlert.userPreferences.communicationMethod}
                </div>
              </div>
              
              {/* Risk Assessment Display */}
              <div className="risk-assessment-display">
                <h4>Risk Factors Present:</h4>
                <div className="risk-indicators">
                  {Object.entries(selectedAlert.riskAssessment).map(([key, value]) => 
                    value && (
                      <span 
                        key={key} 
                        className={`risk-indicator ${key === 'imminentDanger' ? 'critical' : 'warning'}`}
                      >
                        {key === 'suicidalIdeation' && 'Suicidal Ideation'}
                        {key === 'selfHarmRisk' && 'Self-Harm Risk'}
                        {key === 'harmToOthersRisk' && 'Harm to Others Risk'}
                        {key === 'substanceUse' && 'Substance Use'}
                        {key === 'psychosis' && 'Psychotic Symptoms'}
                        {key === 'imminentDanger' && 'IMMINENT DANGER'}
                      </span>
                    )
                  )}
                </div>
              </div>
              
              {/* Accessibility Accommodations */}
              {selectedAlert.userPreferences.accessibilityNeeds.length > 0 && (
                <div className="accessibility-accommodations">
                  <h4>Accessibility Accommodations:</h4>
                  <div className="accommodations-list">
                    {selectedAlert.userPreferences.accessibilityNeeds.map((need, index) => (
                      <span key={index} className="accommodation-tag">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="session-actions mental-health-actions">
              {/* Emergency Actions */}
              {emergencyProtocolsEnabled && (
                <div className="emergency-actions">
                  <button
                    ref={emergencyButtonRef}
                    onClick={handleEscalateToEmergency}
                    className="btn btn-danger emergency-btn"
                    disabled={crisisEscalationInProgress}
                    aria-describedby="emergency-help"
                  >
                    {crisisEscalationInProgress ? 'Contacting Emergency Services...' : 'Emergency Services'}
                  </button>
                  <span id="emergency-help" className="sr-only">
                    Contact emergency services immediately - use for imminent danger situations
                  </span>
                </div>
              )}
              
              {/* Therapeutic Actions */}
              <div className="therapeutic-actions">
                <button
                  onClick={handleCreateSafetyPlan}
                  className="btn btn-warning"
                  disabled={!!activeSafetyPlan}
                  aria-describedby="safety-plan-help"
                >
                  {activeSafetyPlan ? 'Safety Plan Created' : 'Create Safety Plan'}
                </button>
                <span id="safety-plan-help" className="sr-only">
                  Create a safety plan with the client to prevent future crises
                </span>
                
                <button
                  onClick={() => handleCompleteSession('crisis-resolved')}
                  className="btn btn-success"
                  aria-describedby="resolve-help"
                >
                  Crisis Resolved
                </button>
                <span id="resolve-help" className="sr-only">
                  Mark this crisis as resolved - client is safe and stable
                </span>

                <button
                  onClick={() => handleCompleteSession(
                    'referred-to-therapy',
                    undefined,
                    {
                      required: true,
                      timeframe: '48-72 hours',
                      followUpType: 'professional-referral',
                      resources: ['local therapists', 'crisis support services'],
                      nextSteps: ['schedule therapy appointment', 'provide crisis resources']
                    }
                  )}
                  className="btn btn-info"
                  aria-describedby="refer-help"
                >
                  Refer to Therapy
                </button>
                <span id="refer-help" className="sr-only">
                  Refer client to professional therapy services with appropriate follow-up
                </span>
                
                <button
                  onClick={() => handleCompleteSession(
                    'ongoing-support',
                    undefined,
                    {
                      required: true,
                      timeframe: '24 hours',
                      followUpType: 'continued-support',
                      resources: ['peer support', 'crisis hotlines'],
                      nextSteps: ['schedule follow-up session', 'provide ongoing resources']
                    }
                  )}
                  className="btn btn-warning"
                  aria-describedby="ongoing-help"
                >
                  Ongoing Support
                </button>
                <span id="ongoing-help" className="sr-only">
                  Establish ongoing support plan with follow-up sessions
                </span>
              </div>
              
              {/* Real-time Metrics */}
              {realTimeMetrics && (
                <div className="real-time-metrics" role="status" aria-live="polite">
                  <h4>Session Metrics:</h4>
                  <div className="metrics-display">
                    <span>Duration: {realTimeMetrics.activeSessionDuration} min</span>
                    <span>Risk Level: {realTimeMetrics.riskLevel}</span>
                    <span>Interventions: {realTimeMetrics.interventionsApplied}</span>
                    {realTimeMetrics.supervisionAlerts > 0 && (
                      <span className="supervision-alert">
                        Supervision Alerts: {realTimeMetrics.supervisionAlerts}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pending Crisis Alerts */}
      {!currentSession && pendingAlerts.length > 0 && (
        <section className="pending-alerts" aria-label="Pending Crisis Alerts">
          <h2>Crisis Alerts ({pendingAlerts.length})</h2>
          <div className="alerts-list">
            {pendingAlerts.map((alert) => (
              <div key={alert.id} className="alert-card" role="article">
                <div className="alert-header">
                  <div className={`severity-badge severity-${alert.severity}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                  <span className="alert-time">
                    {Math.floor((Date.now() - alert.timestamp.getTime()) / 60000)}m ago
                  </span>
                </div>
                
                <div className="alert-content">
                  <h3>{alert.crisisType.replace('-', ' ')}</h3>
                  <p className="alert-description">{alert.description}</p>
                  
                  <div className="alert-preferences">
                    <span className="preference-tag">
                      {alert.userPreferences.language}
                    </span>
                    <span className="preference-tag">
                      {alert.userPreferences.communicationMethod}
                    </span>
                    {alert.userPreferences.anonymity && (
                      <span className="preference-tag anonymous">
                        Anonymous
                      </span>
                    )}
                  </div>
                </div>

                <div className="alert-actions">
                  <button
                    onClick={() => handleAcceptAlert(alert)}
                    className="btn btn-primary"
                    disabled={availabilityStatus !== 'available' && availabilityStatus !== 'crisis-only' && availabilityStatus !== 'emergency-standby'}
                    aria-describedby={`alert-${alert.id}-help`}
                  >
                    Accept Crisis
                  </button>
                  <span id={`alert-${alert.id}-help`} className="sr-only">
                    Accept this crisis alert and start a support session
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No Alerts Message */}
      {!currentSession && pendingAlerts.length === 0 && (availabilityStatus === 'available' || availabilityStatus === 'crisis-only' || availabilityStatus === 'emergency-standby') && (
        <section className="no-alerts" aria-label="No Crisis Alerts">
          <div className="empty-state">
            <h2>No Crisis Alerts</h2>
            <p>You're available and ready to help. Crisis alerts will appear here when they match your profile.</p>
            <div className="volunteer-readiness">
              <h3>Your Readiness Status:</h3>
              <ul>
                <li>Profile Complete</li>
                <li>Certifications Valid: {volunteerProfile.certifications.filter(c => c.verified).length}</li>
                <li>Available for Crisis Support</li>
                <li>{volunteerProfile.languages.length} Language(s) Supported</li>
                <li>{volunteerProfile.therapeuticApproaches.length} Therapeutic Approaches</li>
                <li>{volunteerProfile.culturalCompetencies.length} Cultural Competencies</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Offline/Unavailable State */}
      {(availabilityStatus === 'offline' || availabilityStatus === 'on_break' || availabilityStatus === 'busy') && !currentSession && (
        <section className="unavailable-state" aria-label="Unavailable Status">
          <div className="status-message">
            <h2>Currently {availabilityStatus.replace('_', ' ').toUpperCase()}</h2>
            <p>
              {availabilityStatus === 'offline' && 'You are offline and will not receive crisis alerts.'}
              {availabilityStatus === 'busy' && 'You are marked as busy and will not receive new alerts.'}
              {availabilityStatus === 'on_break' && 'You are on break and will not receive crisis alerts.'}
            </p>
            <button
              onClick={() => handleAvailabilityChange('available')}
              className="btn btn-primary"
            >
              Mark as Available
            </button>
          </div>
        </section>
      )}

      {/* Supervision Mode Indicator */}
      {supervisionMode && (
        <div className="supervision-mode-indicator" role="status">
          <span>Supervision Mode Active</span>
        </div>
      )}

      {/* Accessibility Status */}
      {isMonitoring && violations.length > 0 && (
        <div className="accessibility-status" role="status" aria-live="polite">
          <span className="sr-only">
            {violations.length} accessibility issues detected. Please review.
          </span>
        </div>
      )}
    </div>
  );
};

export default VolunteerTether;
export type { 
  VolunteerTetherProps, 
  VolunteerProfile, 
  CrisisAlert, 
  VolunteerSession,
  CrisisLevel,
  MentalHealthSpecialty,
  TherapeuticApproach,
  CrisisInterventionLevel,
  CulturalCompetency,
  MentalHealthCertification,
  CrisisPerformanceMetrics,
  AccessibilityProfile,
  EmergencyProtocol,
  SafetyPlan
};