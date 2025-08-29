/**
 * 988 CRISIS LIFELINE WIDGET COMPONENT
 * 
 * Comprehensive UI component for 988 Suicide & Crisis Lifeline integration
 * Provides automated connection, real-time status, and crisis management
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  AlertTriangle, 
  Shield, 
  MessageCircle,
  Clock,
  Wifi,
  WifiOff,
  UserCheck,
  Heart,
  ChevronRight,
  X,
  CheckCircle,
  Info,
  RefreshCw,
  Settings,
  HelpCircle
} from 'lucide-react';
import { use988Hotline } from '../hooks/use988Hotline';
import { ConsentRecord } from '../services/crisis988Service';
import './Crisis988Widget.css';

// ============= SUB-COMPONENTS =============

interface ConsentDialogProps {
  onGrant: (consent: Partial<ConsentRecord>) => void;
  onDecline: () => void;
}

const ConsentDialog: React.FC<ConsentDialogProps> = ({ onGrant, onDecline }) => {
  const [consent, setConsent] = useState({
    dataSharing: true,
    recordingConsent: false,
    emergencyContactNotification: true,
    followUpConsent: true
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="crisis-988-consent-dialog"
    >
      <div className="consent-header">
        <Shield className="consent-icon" />
        <h3>988 Lifeline Connection Consent</h3>
      </div>
      
      <div className="consent-intro">
        <p>To provide you with the best crisis support, we need your consent to connect you with the 988 Suicide & Crisis Lifeline.</p>
      </div>
      
      <div className="consent-options">
        <label className="consent-option">
          <input
            type="checkbox"
            checked={consent.dataSharing}
            onChange={(e) => setConsent({ ...consent, dataSharing: e.target.checked })}
          />
          <div className="option-content">
            <span className="option-title">Share Crisis Information</span>
            <span className="option-desc">Share relevant context to help counselors provide better support</span>
          </div>
        </label>
        
        <label className="consent-option">
          <input
            type="checkbox"
            checked={consent.recordingConsent}
            onChange={(e) => setConsent({ ...consent, recordingConsent: e.target.checked })}
          />
          <div className="option-content">
            <span className="option-title">Allow Call Recording</span>
            <span className="option-desc">For quality assurance and training purposes only</span>
          </div>
        </label>
        
        <label className="consent-option">
          <input
            type="checkbox"
            checked={consent.emergencyContactNotification}
            onChange={(e) => setConsent({ ...consent, emergencyContactNotification: e.target.checked })}
          />
          <div className="option-content">
            <span className="option-title">Notify Emergency Contacts</span>
            <span className="option-desc">Alert your designated contacts if needed for your safety</span>
          </div>
        </label>
        
        <label className="consent-option">
          <input
            type="checkbox"
            checked={consent.followUpConsent}
            onChange={(e) => setConsent({ ...consent, followUpConsent: e.target.checked })}
          />
          <div className="option-content">
            <span className="option-title">Enable Follow-up Care</span>
            <span className="option-desc">Receive welfare checks and resource recommendations</span>
          </div>
        </label>
      </div>
      
      <div className="consent-privacy">
        <Info size={16} />
        <span>Your privacy is protected under HIPAA. You can withdraw consent at any time.</span>
      </div>
      
      <div className="consent-actions">
        <button 
          className="btn-consent-decline"
          onClick={onDecline}
        >
          Decline
        </button>
        <button 
          className="btn-consent-grant"
          onClick={() => onGrant(consent)}
        >
          Grant Consent & Connect
        </button>
      </div>
    </motion.div>
  );
};

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  counselor?: any;
  duration?: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  quality, 
  counselor,
  duration = 0 
}) => {
  const [elapsedTime, setElapsedTime] = useState(duration);
  
  useEffect(() => {
    if (status === 'connected') {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getQualityIcon = () => {
    switch (quality) {
      case 'excellent': return <Wifi className="quality-excellent" />;
      case 'good': return <Wifi className="quality-good" />;
      case 'fair': return <Wifi className="quality-fair" />;
      case 'poor': return <WifiOff className="quality-poor" />;
      default: return null;
    }
  };
  
  return (
    <div className={`connection-status status-${status}`}>
      {status === 'connecting' && (
        <>
          <RefreshCw className="status-icon spinning" />
          <span>Connecting to 988 Lifeline...</span>
        </>
      )}
      
      {status === 'connected' && (
        <>
          <div className="connection-header">
            <CheckCircle className="status-icon connected" />
            <span>Connected to 988</span>
            {getQualityIcon()}
          </div>
          
          {counselor && (
            <div className="counselor-info">
              <UserCheck size={16} />
              <span>{counselor.name || 'Crisis Counselor'}</span>
              {counselor.specializations?.map((spec: string) => (
                <span key={spec} className="specialization-badge">{spec}</span>
              ))}
            </div>
          )}
          
          <div className="connection-timer">
            <Clock size={14} />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </>
      )}
      
      {status === 'disconnected' && (
        <>
          <PhoneOff className="status-icon disconnected" />
          <span>Disconnected</span>
        </>
      )}
      
      {status === 'failed' && (
        <>
          <AlertTriangle className="status-icon failed" />
          <span>Connection Failed</span>
        </>
      )}
    </div>
  );
};

interface QuickActionsProps {
  onConnect: () => void;
  onDisconnect: () => void;
  onTextSupport: () => void;
  onEmergency: () => void;
  isConnected: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onConnect,
  onDisconnect,
  onTextSupport,
  onEmergency,
  isConnected
}) => {
  return (
    <div className="quick-actions">
      {!isConnected ? (
        <button 
          className="btn-action btn-connect"
          onClick={onConnect}
        >
          <Phone size={20} />
          <span>Connect to 988</span>
        </button>
      ) : (
        <button 
          className="btn-action btn-disconnect"
          onClick={onDisconnect}
        >
          <PhoneOff size={20} />
          <span>End Call</span>
        </button>
      )}
      
      <button 
        className="btn-action btn-text"
        onClick={onTextSupport}
      >
        <MessageCircle size={20} />
        <span>Text Support</span>
      </button>
      
      <button 
        className="btn-action btn-emergency"
        onClick={onEmergency}
      >
        <AlertTriangle size={20} />
        <span>Emergency</span>
      </button>
    </div>
  );
};

interface ResourcesListProps {
  resources: string[];
  onSelectResource: (resource: string) => void;
}

const ResourcesList: React.FC<ResourcesListProps> = ({ resources, onSelectResource }) => {
  return (
    <div className="resources-list">
      <h4>Helpful Resources</h4>
      {resources.map((resource, index) => (
        <motion.div
          key={index}
          className="resource-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectResource(resource)}
        >
          <Heart size={16} />
          <span>{resource}</span>
          <ChevronRight size={16} />
        </motion.div>
      ))}
    </div>
  );
};

interface FollowUpReminderProps {
  tasks: any[];
  onAcknowledge: () => void;
  onSchedule: () => void;
}

const FollowUpReminder: React.FC<FollowUpReminderProps> = ({
  tasks,
  onAcknowledge,
  onSchedule
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="followup-reminder"
    >
      <div className="reminder-header">
        <Clock size={20} />
        <h4>Follow-up Care</h4>
      </div>
      
      <p>We'd like to check in on how you're doing.</p>
      
      {tasks.length > 0 && (
        <div className="pending-tasks">
          {tasks.map((task, index) => (
            <div key={index} className="task-item">
              <span>{task.type}</span>
              <span className="task-time">
                {new Date(task.scheduledTime).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="reminder-actions">
        <button onClick={onAcknowledge}>Acknowledge</button>
        <button onClick={onSchedule}>Schedule Appointment</button>
      </div>
    </motion.div>
  );
};

// ============= MAIN COMPONENT =============

export interface Crisis988WidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoShow?: boolean;
  compactMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export const Crisis988Widget: React.FC<Crisis988WidgetProps> = ({
  position = 'bottom-right',
  autoShow = false,
  compactMode = false,
  theme = 'auto'
}) => {
  const [state, actions] = use988Hotline({
    autoConnect: true,
    requireExplicitConsent: true,
    enableFollowUp: true,
    enableFallback: true
  });
  
  const [isExpanded, setIsExpanded] = useState(!compactMode && autoShow);
  const [showSettings, setShowSettings] = useState(false);
  
  // ============= EVENT HANDLERS =============
  
  const handleConnect = useCallback(async () => {
    try {
      await actions.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [actions]);
  
  const handleDisconnect = useCallback(() => {
    actions.disconnect();
  }, [actions]);
  
  const handleTextSupport = useCallback(() => {
    // Open Crisis Text Line
    window.open('sms:741741?body=HOME', '_blank');
  }, []);
  
  const handleEmergency = useCallback(() => {
    // Trigger emergency protocol
    if (window.confirm('This will contact emergency services. Continue?')) {
      window.location.href = 'tel:911';
    }
  }, []);
  
  const handleGrantConsent = useCallback((consent: Partial<ConsentRecord>) => {
    actions.grantConsent(consent);
    actions.hideConsent();
  }, [actions]);
  
  const handleDeclineConsent = useCallback(() => {
    actions.hideConsent();
  }, [actions]);
  
  const handleSelectResource = useCallback((resource: string) => {
    // Open resource in new tab
    if (resource.startsWith('http')) {
      window.open(resource, '_blank');
    }
  }, []);
  
  const handleScheduleAppointment = useCallback(() => {
    // Navigate to appointment scheduling
    actions.scheduleFollowUp('appointment-reminder', 24);
  }, [actions]);
  
  // ============= AUTO-EXPAND ON CRISIS =============
  
  useEffect(() => {
    if (state.currentCrisisLevel && ['high', 'critical', 'imminent'].includes(state.currentCrisisLevel)) {
      setIsExpanded(true);
    }
  }, [state.currentCrisisLevel]);
  
  // ============= RENDER =============
  
  const widgetClasses = [
    'crisis-988-widget',
    `position-${position}`,
    `theme-${theme}`,
    isExpanded ? 'expanded' : 'compact',
    state.isConnected ? 'connected' : '',
    state.currentCrisisLevel ? `crisis-${state.currentCrisisLevel}` : ''
  ].join(' ');
  
  return (
    <div className={widgetClasses}>
      <AnimatePresence>
        {/* Compact Mode Button */}
        {!isExpanded && (
          <motion.button
            className="widget-toggle"
            onClick={() => setIsExpanded(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone size={24} />
            {state.isConnected && <span className="connection-indicator" />}
          </motion.button>
        )}
        
        {/* Expanded Widget */}
        {isExpanded && (
          <motion.div
            className="widget-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {/* Header */}
            <div className="widget-header">
              <div className="header-title">
                <Phone size={20} />
                <h3>988 Crisis Lifeline</h3>
              </div>
              <div className="header-actions">
                <button 
                  className="btn-icon"
                  onClick={() => setShowSettings(!showSettings)}
                  aria-label="Settings"
                >
                  <Settings size={18} />
                </button>
                <button 
                  className="btn-icon"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Minimize"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Connection Status */}
            {(state.isConnecting || state.isConnected) && (
              <ConnectionStatus
                status={
                  state.isConnecting ? 'connecting' :
                  state.isConnected ? 'connected' :
                  state.connectionError ? 'failed' :
                  'disconnected'
                }
                quality={state.connectionQuality || undefined}
                counselor={state.activeSession?.counselor}
                duration={0}
              />
            )}
            
            {/* Error Message */}
            {state.connectionError && (
              <div className="error-message">
                <AlertTriangle size={16} />
                <span>{state.connectionError}</span>
              </div>
            )}
            
            {/* Quick Actions */}
            <QuickActions
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onTextSupport={handleTextSupport}
              onEmergency={handleEmergency}
              isConnected={state.isConnected}
            />
            
            {/* Resources */}
            {!state.isConnected && (
              <ResourcesList
                resources={[
                  'Breathing Exercises',
                  'Grounding Techniques',
                  'Safety Planning',
                  'Find Local Support'
                ]}
                onSelectResource={handleSelectResource}
              />
            )}
            
            {/* Session Info */}
            {state.activeSession && (
              <div className="session-info">
                <div className="session-interventions">
                  <h5>Support Provided:</h5>
                  {state.activeSession.interventions.slice(-3).map((intervention, index) => (
                    <div key={index} className="intervention-item">
                      <CheckCircle size={14} />
                      <span>{intervention}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Statistics */}
            {!state.isConnected && state.statistics.totalSessions > 0 && (
              <div className="widget-stats">
                <div className="stat-item">
                  <span className="stat-value">{state.statistics.totalSessions}</span>
                  <span className="stat-label">Sessions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{state.statistics.averageDuration}m</span>
                  <span className="stat-label">Avg Duration</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {Math.round(state.statistics.successRate * 100)}%
                  </span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            )}
            
            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                className="settings-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4>Privacy Settings</h4>
                <button onClick={() => actions.showConsent()}>
                  Manage Consent
                </button>
                <button onClick={() => actions.revokeConsent()}>
                  Revoke Consent
                </button>
              </motion.div>
            )}
            
            {/* Help Text */}
            <div className="help-text">
              <HelpCircle size={14} />
              <span>Available 24/7 • Confidential • Free</span>
            </div>
          </motion.div>
        )}
        
        {/* Consent Dialog */}
        {state.showConsentDialog && (
          <div className="dialog-overlay">
            <ConsentDialog
              onGrant={handleGrantConsent}
              onDecline={handleDeclineConsent}
            />
          </div>
        )}
        
        {/* Follow-up Reminder */}
        {state.showFollowUpReminder && (
          <FollowUpReminder
            tasks={state.pendingFollowUps}
            onAcknowledge={actions.acknowledgeFollowUp}
            onSchedule={handleScheduleAppointment}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Crisis988Widget;