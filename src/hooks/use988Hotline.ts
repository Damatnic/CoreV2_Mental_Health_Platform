/**
 * 988 HOTLINE REACT HOOK
 * 
 * Custom hook for integrating 988 Suicide & Crisis Lifeline automation
 * into React components with full state management and UI controls
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import crisis988Service, { 
  Crisis988Session, 
  CrisisContext, 
  ConsentRecord,
  Crisis988Config,
  FollowUpTask
} from '../services/crisis988Service';
import { CrisisEvent } from '../services/api/crisisService';
import { useCrisisDetection } from './useCrisisDetection';

// ============= TYPES =============

export interface Use988HotlineOptions {
  autoConnect?: boolean;
  requireExplicitConsent?: boolean;
  enableFollowUp?: boolean;
  enableFallback?: boolean;
  customConfig?: Partial<Crisis988Config>;
}

export interface Use988HotlineState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Session state
  activeSession: Crisis988Session | null;
  sessionHistory: Crisis988Session[];
  
  // Consent state
  hasConsent: boolean;
  consentRecord: ConsentRecord | null;
  consentPending: boolean;
  
  // Crisis state
  currentCrisisLevel: CrisisEvent['severity'] | null;
  isMonitoring: boolean;
  lastAssessment: Date | null;
  
  // Follow-up state
  pendingFollowUps: FollowUpTask[];
  completedFollowUps: FollowUpTask[];
  
  // UI state
  showConsentDialog: boolean;
  showConnectionDialog: boolean;
  showFollowUpReminder: boolean;
  connectionQuality: Crisis988Session['connectionQuality'] | null;
  
  // Statistics
  statistics: {
    totalSessions: number;
    averageDuration: number;
    successRate: number;
  };
}

export interface Use988HotlineActions {
  // Connection actions
  connect: (context?: CrisisContext) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Consent actions
  grantConsent: (consent: Partial<ConsentRecord>) => void;
  revokeConsent: () => void;
  updateConsent: (updates: Partial<ConsentRecord>) => void;
  
  // Crisis actions
  reportCrisis: (severity: CrisisEvent['severity'], triggers: string[]) => Promise<void>;
  updateCrisisContext: (context: Partial<CrisisContext>) => void;
  
  // Session actions
  endSession: (reason?: string) => void;
  requestTransfer: (specialization: string) => Promise<void>;
  
  // Follow-up actions
  scheduleFollowUp: (type: FollowUpTask['type'], hours: number) => void;
  cancelFollowUp: (taskId: string) => void;
  
  // UI actions
  showConsent: () => void;
  hideConsent: () => void;
  acknowledgeFollowUp: () => void;
}

// ============= MAIN HOOK =============

export function use988Hotline(
  options: Use988HotlineOptions = {}
): [Use988HotlineState, Use988HotlineActions] {
  // Get user ID from localStorage or session
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'anonymous';
  const { detectCrisis, detectionResult } = useCrisisDetection();
  
  // Configuration
  const configRef = useRef<Use988HotlineOptions>(options);
  
  // State management
  const [state, setState] = useState<Use988HotlineState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    activeSession: null,
    sessionHistory: [],
    hasConsent: false,
    consentRecord: null,
    consentPending: false,
    currentCrisisLevel: null,
    isMonitoring: false,
    lastAssessment: null,
    pendingFollowUps: [],
    completedFollowUps: [],
    showConsentDialog: false,
    showConnectionDialog: false,
    showFollowUpReminder: false,
    connectionQuality: null,
    statistics: {
      totalSessions: 0,
      averageDuration: 0,
      successRate: 0
    }
  });
  
  // Refs for cleanup
  const eventListenersRef = useRef<Array<() => void>>([]);
  const monitoringIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ============= INITIALIZATION =============
  
  useEffect(() => {
    if (options.customConfig) {
      crisis988Service.updateConfig(options.customConfig);
    }
    
    setupEventListeners();
    loadUserData();
    
    return () => {
      cleanup();
    };
  }, []);
  
  // ============= EVENT LISTENERS =============
  
  const setupEventListeners = useCallback(() => {
    const listeners = [
      crisis988Service.on('initialized', handleServiceInitialized),
      crisis988Service.on('988-connected', handleConnectionEstablished),
      crisis988Service.on('session-updated', handleSessionUpdate),
      crisis988Service.on('session-ended', handleSessionEnded),
      crisis988Service.on('consent-required', handleConsentRequired),
      crisis988Service.on('connection-quality-poor', handlePoorConnection),
      crisis988Service.on('warm-handoff', handleWarmHandoff),
      crisis988Service.on('followup-completed', handleFollowUpCompleted),
      crisis988Service.on('welfare-check', handleWelfareCheck),
      crisis988Service.on('fallback-failed', handleFallbackFailed),
      crisis988Service.on('monitoring-update', handleMonitoringUpdate)
    ];
    
    eventListenersRef.current = listeners.map(listener => () => crisis988Service.off(listener));
  }, []);
  
  // ============= EVENT HANDLERS =============
  
  const handleServiceInitialized = useCallback(() => {
    console.log('988 Service initialized');
    updateStatistics();
  }, []);
  
  const handleConnectionEstablished = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      activeSession: data.session,
      connectionQuality: data.session.connectionQuality,
      showConnectionDialog: true
    }));
    
    // Start monitoring connection
    startConnectionMonitoring();
  }, []);
  
  const handleSessionUpdate = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      activeSession: data.session,
      connectionQuality: data.session.connectionQuality
    }));
  }, []);
  
  const handleSessionEnded = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      activeSession: null,
      sessionHistory: [...prev.sessionHistory, data.session],
      connectionQuality: null
    }));
    
    stopConnectionMonitoring();
    updateStatistics();
    
    // Check for follow-up tasks
    checkPendingFollowUps();
  }, []);
  
  const handleConsentRequired = useCallback(() => {
    setState(prev => ({
      ...prev,
      consentPending: true,
      showConsentDialog: true
    }));
  }, []);
  
  const handlePoorConnection = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      connectionQuality: 'poor',
      connectionError: 'Connection quality degraded. Attempting to stabilize...'
    }));
    
    // Auto-reconnect after delay
    reconnectTimeoutRef.current = setTimeout(() => {
      actions.reconnect();
    }, 5000);
  }, []);
  
  const handleWarmHandoff = useCallback((data: any) => {
    console.log('Warm handoff initiated:', data);
    setState(prev => ({
      ...prev,
      activeSession: data.session
    }));
  }, []);
  
  const handleFollowUpCompleted = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      completedFollowUps: [...prev.completedFollowUps, data.task],
      pendingFollowUps: prev.pendingFollowUps.filter(t => t.id !== data.task.id)
    }));
  }, []);
  
  const handleWelfareCheck = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      showFollowUpReminder: true
    }));
  }, []);
  
  const handleFallbackFailed = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      connectionError: 'Unable to establish crisis connection. Please call 988 directly.',
      isConnecting: false
    }));
  }, []);
  
  const handleMonitoringUpdate = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      isMonitoring: true,
      lastAssessment: new Date()
    }));
  }, []);
  
  // ============= DATA LOADING =============
  
  const loadUserData = useCallback(async () => {
    if (!userId || userId === 'anonymous') return;
    
    // Load session history
    const history = crisis988Service.getSessionHistory(userId);
    
    // Check for active session
    const activeSession = crisis988Service.getActiveSession(userId);
    
    setState(prev => ({
      ...prev,
      sessionHistory: history,
      activeSession,
      isConnected: activeSession?.status === 'connected'
    }));
    
    updateStatistics();
  }, [userId]);
  
  // ============= CONNECTION MANAGEMENT =============
  
  const connect = useCallback(async (context?: CrisisContext) => {
    if (state.isConnecting || state.isConnected) return;
    
    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));
    
    try {
      // Create crisis event
      const crisisEvent: CrisisEvent = {
        id: `crisis-${Date.now()}`,
        userId: userId || 'anonymous',
        type: 'self_report',
        severity: state.currentCrisisLevel || 'high',
        status: 'active',
        triggerSource: 'user_report',
        timestamp: new Date(),
        metadata: {
          confidence: 1.0,
          riskFactors: context?.triggers || [],
          protectiveFactors: [],
          interventionsTriggered: ['988_connection'],
          emergencyContactsNotified: [],
          resourcesProvided: [],
          followUpRequired: true
        }
      };
      
      // Default context if not provided
      const crisisContext: CrisisContext = context || {
        triggers: [],
        recentMoodScores: [],
        medicationAdherence: true,
        supportSystem: { available: false, contacted: false },
        suicidalIdeation: {
          present: false,
          plan: false,
          means: false
        },
        previousAttempts: 0
      };
      
      // Get or create consent
      const consent = state.consentRecord || (await requestConsent());
      
      // Connect to 988
      const session = await crisis988Service.assessAndConnect(
        crisisEvent,
        crisisContext,
        consent
      );
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        activeSession: session,
        connectionQuality: session.connectionQuality
      }));
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: error.message || 'Failed to connect to 988'
      }));
    }
  }, [state, user]);
  
  const disconnect = useCallback(() => {
    if (state.activeSession) {
      crisis988Service.endSession(state.activeSession.id, 'user-initiated');
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        activeSession: null,
        connectionQuality: null
      }));
    }
  }, [state.activeSession]);
  
  const reconnect = useCallback(async () => {
    if (state.activeSession && !state.isConnected) {
      await connect();
    }
  }, [state, connect]);
  
  // ============= CONSENT MANAGEMENT =============
  
  const requestConsent = useCallback(async (): Promise<ConsentRecord> => {
    return new Promise((resolve) => {
      setState(prev => ({
        ...prev,
        showConsentDialog: true,
        consentPending: true
      }));
      
      // Wait for user consent
      const checkConsent = setInterval(() => {
        if (state.consentRecord) {
          clearInterval(checkConsent);
          resolve(state.consentRecord);
        }
      }, 100);
    });
  }, [state.consentRecord]);
  
  const grantConsent = useCallback((consent: Partial<ConsentRecord>) => {
    const fullConsent: ConsentRecord = {
      dataSharing: consent.dataSharing ?? true,
      recordingConsent: consent.recordingConsent ?? false,
      emergencyContactNotification: consent.emergencyContactNotification ?? true,
      followUpConsent: consent.followUpConsent ?? true,
      timestamp: new Date(),
      withdrawable: true
    };
    
    if (userId && userId !== 'anonymous') {
      crisis988Service.updateConsent(userId, fullConsent);
    }
    
    setState(prev => ({
      ...prev,
      hasConsent: true,
      consentRecord: fullConsent,
      consentPending: false,
      showConsentDialog: false
    }));
  }, [userId]);
  
  const revokeConsent = useCallback(() => {
    if (userId && userId !== 'anonymous') {
      crisis988Service.withdrawConsent(userId);
    }
    
    setState(prev => ({
      ...prev,
      hasConsent: false,
      consentRecord: null
    }));
    
    // Disconnect if connected
    if (state.isConnected) {
      disconnect();
    }
  }, [userId, state.isConnected, disconnect]);
  
  const updateConsent = useCallback((updates: Partial<ConsentRecord>) => {
    if (userId && userId !== 'anonymous' && state.consentRecord) {
      const updatedConsent = { ...state.consentRecord, ...updates };
      crisis988Service.updateConsent(userId, updatedConsent);
      
      setState(prev => ({
        ...prev,
        consentRecord: updatedConsent
      }));
    }
  }, [userId, state.consentRecord]);
  
  // ============= CRISIS MANAGEMENT =============
  
  const reportCrisis = useCallback(async (
    severity: CrisisEvent['severity'],
    triggers: string[]
  ) => {
    setState(prev => ({
      ...prev,
      currentCrisisLevel: severity,
      lastAssessment: new Date()
    }));
    
    // Auto-connect if severity is high enough
    if (options.autoConnect && ['critical', 'imminent'].includes(severity)) {
      await connect({
        triggers,
        recentMoodScores: [],
        medicationAdherence: true,
        supportSystem: { available: false, contacted: false },
        suicidalIdeation: {
          present: severity === 'imminent',
          plan: false,
          means: false
        },
        previousAttempts: 0
      });
    }
  }, [options.autoConnect, connect]);
  
  const updateCrisisContext = useCallback((context: Partial<CrisisContext>) => {
    // Update current crisis context
    // This would be used to update the active session context
    if (state.activeSession) {
      // In production, would send update to 988 service
      console.log('Updating crisis context:', context);
    }
  }, [state.activeSession]);
  
  // ============= SESSION MANAGEMENT =============
  
  const endSession = useCallback((reason?: string) => {
    if (state.activeSession) {
      crisis988Service.endSession(state.activeSession.id, reason);
    }
  }, [state.activeSession]);
  
  const requestTransfer = useCallback(async (specialization: string) => {
    if (state.activeSession) {
      await crisis988Service.performWarmHandoff(
        state.activeSession,
        `${specialization}-specialist`,
        `User requested ${specialization} specialist`
      );
    }
  }, [state.activeSession]);
  
  // ============= FOLLOW-UP MANAGEMENT =============
  
  const scheduleFollowUp = useCallback((type: FollowUpTask['type'], hours: number) => {
    if (!state.activeSession) return;
    
    const task: FollowUpTask = {
      id: `followup-${Date.now()}`,
      sessionId: state.activeSession.id,
      userId: userId || 'anonymous',
      scheduledTime: new Date(Date.now() + hours * 60 * 60 * 1000),
      attemptNumber: 0,
      type,
      status: 'pending'
    };
    
    setState(prev => ({
      ...prev,
      pendingFollowUps: [...prev.pendingFollowUps, task]
    }));
  }, [state.activeSession, userId]);
  
  const cancelFollowUp = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      pendingFollowUps: prev.pendingFollowUps.filter(t => t.id !== taskId)
    }));
  }, []);
  
  const checkPendingFollowUps = useCallback(() => {
    // Check for any pending follow-ups that need attention
    const now = Date.now();
    const pending = state.pendingFollowUps.filter(
      task => task.scheduledTime.getTime() <= now
    );
    
    if (pending.length > 0) {
      setState(prev => ({
        ...prev,
        showFollowUpReminder: true
      }));
    }
  }, [state.pendingFollowUps]);
  
  // ============= UI ACTIONS =============
  
  const showConsent = useCallback(() => {
    setState(prev => ({ ...prev, showConsentDialog: true }));
  }, []);
  
  const hideConsent = useCallback(() => {
    setState(prev => ({ ...prev, showConsentDialog: false }));
  }, []);
  
  const acknowledgeFollowUp = useCallback(() => {
    setState(prev => ({ ...prev, showFollowUpReminder: false }));
  }, []);
  
  // ============= MONITORING =============
  
  const startConnectionMonitoring = useCallback(() => {
    monitoringIntervalRef.current = setInterval(() => {
      if (state.activeSession) {
        // Monitor connection quality
        // In production, would check actual metrics
      }
    }, 10000); // Check every 10 seconds
  }, [state.activeSession]);
  
  const stopConnectionMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
  }, []);
  
  // ============= STATISTICS =============
  
  const updateStatistics = useCallback(() => {
    const stats = crisis988Service.getStatistics();
    
    setState(prev => ({
      ...prev,
      statistics: {
        totalSessions: stats.totalSessions,
        averageDuration: stats.averageSessionDuration,
        successRate: stats.successfulConnections / Math.max(stats.totalSessions, 1)
      }
    }));
  }, []);
  
  // ============= CLEANUP =============
  
  const cleanup = useCallback(() => {
    // Remove event listeners
    eventListenersRef.current.forEach(remove => remove());
    
    // Clear intervals
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    
    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);
  
  // ============= CRISIS DETECTION INTEGRATION =============
  
  useEffect(() => {
    if (detectionResult.isInCrisis && detectionResult.urgencyLevel) {
      setState(prev => ({
        ...prev,
        currentCrisisLevel: detectionResult.urgencyLevel as CrisisEvent['severity']
      }));
      
      // Auto-connect for critical situations
      if (options.autoConnect && ['critical', 'high'].includes(detectionResult.urgencyLevel)) {
        connect({
          triggers: detectionResult.triggerReasons,
          recentMoodScores: [],
          medicationAdherence: true,
          supportSystem: { available: false, contacted: false },
          suicidalIdeation: {
            present: detectionResult.urgencyLevel === 'critical',
            plan: false,
            means: false
          },
          previousAttempts: 0
        });
      }
    }
  }, [detectionResult, options.autoConnect, connect]);
  
  // ============= ACTIONS OBJECT =============
  
  const actions: Use988HotlineActions = {
    // Connection actions
    connect,
    disconnect,
    reconnect,
    
    // Consent actions
    grantConsent,
    revokeConsent,
    updateConsent,
    
    // Crisis actions
    reportCrisis,
    updateCrisisContext,
    
    // Session actions
    endSession,
    requestTransfer,
    
    // Follow-up actions
    scheduleFollowUp,
    cancelFollowUp,
    
    // UI actions
    showConsent,
    hideConsent,
    acknowledgeFollowUp
  };
  
  return [state, actions];
}

export default use988Hotline;