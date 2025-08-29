/**
 * EXAMPLE: 988 Crisis Lifeline Integration
 * 
 * This example demonstrates how to integrate the 988 automation
 * service into your mental health application
 */

import React, { useEffect, useState } from 'react';
import { Crisis988Widget } from '../components/Crisis988Widget';
import { use988Hotline } from '../hooks/use988Hotline';
import crisis988Service from '../services/crisis988Service';

// Example 1: Basic Widget Integration
export const BasicIntegration: React.FC = () => {
  return (
    <div className="app">
      {/* Your app content */}
      <h1>Mental Health Platform</h1>
      
      {/* Add the 988 widget - it will appear in the bottom-right corner */}
      <Crisis988Widget 
        position="bottom-right"
        autoShow={false}
        theme="auto"
      />
    </div>
  );
};

// Example 2: Advanced Integration with Custom Triggers
export const AdvancedIntegration: React.FC = () => {
  const [state, actions] = use988Hotline({
    autoConnect: true,
    requireExplicitConsent: true,
    enableFollowUp: true
  });
  
  const [userMood, setUserMood] = useState(5);
  const [journalText, setJournalText] = useState('');
  
  // Monitor user input for crisis indicators
  useEffect(() => {
    if (journalText.length > 50) {
      // Check for crisis keywords in journal
      const checkForCrisis = async () => {
        const event = await crisis988Service.detectCrisis(journalText, {
          userId: 'current-user-id',
          previousAttempts: 0,
          supportNetwork: []
        });
        
        if (event && event.level === 'imminent') {
          // Auto-connect to 988 for imminent risk
          actions.connect({
            triggers: event.keywords,
            recentMoodScores: [userMood],
            medicationAdherence: true,
            supportSystem: { available: false, contacted: false },
            suicidalIdeation: {
              present: true,
              plan: false,
              means: false
            },
            previousAttempts: 0
          });
        }
      };
      
      checkForCrisis();
    }
  }, [journalText, userMood, actions]);
  
  // Handle mood changes
  useEffect(() => {
    if (userMood <= 2) {
      // Low mood detected - show crisis resources
      actions.reportCrisis('moderate', ['low mood', 'depression']);
    }
  }, [userMood, actions]);
  
  return (
    <div className="app">
      <h1>Mental Health Journal</h1>
      
      {/* Mood Tracker */}
      <div className="mood-tracker">
        <label>How are you feeling? (1-10)</label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={userMood}
          onChange={(e) => setUserMood(parseInt(e.target.value))}
        />
        <span>{userMood}</span>
      </div>
      
      {/* Journal Entry */}
      <div className="journal">
        <textarea
          placeholder="Write your thoughts..."
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          rows={10}
          cols={50}
        />
      </div>
      
      {/* Crisis Status Display */}
      {state.currentCrisisLevel && (
        <div className={`crisis-alert level-${state.currentCrisisLevel}`}>
          <p>Crisis Level: {state.currentCrisisLevel}</p>
          {state.isConnecting && <p>Connecting to 988...</p>}
          {state.isConnected && <p>Connected to Crisis Counselor</p>}
        </div>
      )}
      
      {/* Manual Crisis Button */}
      <button 
        onClick={() => actions.connect()}
        disabled={state.isConnected || state.isConnecting}
        className="crisis-button"
      >
        {state.isConnected ? 'Connected to 988' : 'Get Crisis Support'}
      </button>
      
      {/* Consent Management */}
      {!state.hasConsent && (
        <button onClick={() => actions.showConsent()}>
          Setup Crisis Support Preferences
        </button>
      )}
      
      {/* Session Info */}
      {state.activeSession && (
        <div className="session-info">
          <h3>Active Crisis Session</h3>
          <p>Counselor: {state.activeSession.counselor?.name || 'Crisis Counselor'}</p>
          <p>Connection Quality: {state.connectionQuality}</p>
          <button onClick={() => actions.endSession('user-ended')}>
            End Session
          </button>
        </div>
      )}
      
      {/* Follow-up Tasks */}
      {state.pendingFollowUps.length > 0 && (
        <div className="followup-tasks">
          <h3>Scheduled Follow-ups</h3>
          {state.pendingFollowUps.map(task => (
            <div key={task.id}>
              <p>{task.type} - {new Date(task.scheduledTime).toLocaleString()}</p>
              <button onClick={() => actions.cancelFollowUp(task.id)}>Cancel</button>
            </div>
          ))}
        </div>
      )}
      
      {/* Statistics */}
      {state.statistics.totalSessions > 0 && (
        <div className="stats">
          <h3>Crisis Support History</h3>
          <p>Total Sessions: {state.statistics.totalSessions}</p>
          <p>Average Duration: {state.statistics.averageDuration} minutes</p>
          <p>Success Rate: {Math.round(state.statistics.successRate * 100)}%</p>
        </div>
      )}
      
      {/* Add the widget for additional UI */}
      <Crisis988Widget />
    </div>
  );
};

// Example 3: Programmatic Crisis Detection
export const ProgrammaticDetection: React.FC = () => {
  const [detectedCrisis, setDetectedCrisis] = useState(false);
  
  const handleUserMessage = async (message: string) => {
    // Detect crisis in user message
    const crisisEvent = await crisis988Service.detectCrisis(message, {
      userId: 'user-123',
      previousAttempts: 0,
      supportNetwork: ['friend1', 'family1']
    });
    
    if (crisisEvent) {
      setDetectedCrisis(true);
      
      // Get user consent first
      const consent = {
        dataSharing: true,
        recordingConsent: false,
        emergencyContactNotification: true,
        followUpConsent: true,
        timestamp: new Date(),
        withdrawable: true
      };
      
      // Connect to 988 with context
      const session = await crisis988Service.assessAndConnect(
        crisisEvent,
        {
          triggers: crisisEvent.keywords,
          recentMoodScores: [3, 2, 2],
          medicationAdherence: true,
          supportSystem: {
            available: true,
            contacted: false,
            names: ['John', 'Sarah']
          },
          suicidalIdeation: {
            present: crisisEvent.level === 'imminent',
            plan: false,
            means: false
          },
          previousAttempts: 0,
          currentLocation: {
            safe: true
          }
        },
        consent
      );
      
      console.log('Crisis session started:', session);
    }
  };
  
  return (
    <div className="chat-interface">
      <h2>Support Chat</h2>
      <input 
        type="text"
        placeholder="How can we help you today?"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleUserMessage(e.currentTarget.value);
          }
        }}
      />
      
      {detectedCrisis && (
        <div className="crisis-detected">
          <p>We've detected you may be in crisis. Connecting you to professional support...</p>
        </div>
      )}
    </div>
  );
};

// Example 4: Crisis Prevention with Monitoring
export const CrisisPreventionExample: React.FC = () => {
  const [state, actions] = use988Hotline();
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  
  // Monitor multiple risk factors
  useEffect(() => {
    const monitorRiskFactors = () => {
      const factors = [];
      
      // Check time of day (late night is higher risk)
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 6) {
        factors.push('late-night');
      }
      
      // Check isolation (no recent social interaction)
      const lastSocialContact = localStorage.getItem('lastSocialContact');
      if (lastSocialContact) {
        const daysSinceContact = (Date.now() - parseInt(lastSocialContact)) / (1000 * 60 * 60 * 24);
        if (daysSinceContact > 3) {
          factors.push('social-isolation');
        }
      }
      
      // Check medication adherence
      const medicationTaken = localStorage.getItem('medicationTaken');
      if (medicationTaken === 'false') {
        factors.push('medication-non-adherence');
      }
      
      setRiskFactors(factors);
      
      // Auto-escalate if multiple risk factors present
      if (factors.length >= 3) {
        actions.reportCrisis('high', factors);
      }
    };
    
    // Check every hour
    const interval = setInterval(monitorRiskFactors, 60 * 60 * 1000);
    monitorRiskFactors(); // Initial check
    
    return () => clearInterval(interval);
  }, [actions]);
  
  return (
    <div className="prevention-dashboard">
      <h2>Wellness Monitoring</h2>
      
      <div className="risk-factors">
        <h3>Current Risk Factors</h3>
        {riskFactors.length === 0 ? (
          <p className="all-clear">No risk factors detected</p>
        ) : (
          <ul>
            {riskFactors.map(factor => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="preventive-actions">
        <h3>Recommended Actions</h3>
        <button onClick={() => window.open('/breathing-exercises', '_blank')}>
          Breathing Exercises
        </button>
        <button onClick={() => window.open('/meditation', '_blank')}>
          Guided Meditation
        </button>
        <button onClick={() => actions.connect()}>
          Talk to Someone
        </button>
      </div>
      
      {/* Always show the widget for easy access */}
      <Crisis988Widget autoShow={true} />
    </div>
  );
};

// Example 5: Integration with Existing Crisis System
export const IntegrateWithExistingSystem: React.FC = () => {
  useEffect(() => {
    // Listen for crisis events from existing system
    const handleExistingCrisisEvent = (event: CustomEvent) => {
      const { severity, userId, context } = event.detail;
      
      // Bridge to 988 system
      crisis988Service.triggerEmergencyProtocol(
        userId,
        severity,
        context
      );
    };
    
    window.addEventListener('existingCrisisDetected', handleExistingCrisisEvent as EventListener);
    
    // Listen for 988 events to update existing system
    crisis988Service.on('988-connected', (data) => {
      // Update existing system
      window.dispatchEvent(new CustomEvent('externalCrisisHandled', {
        detail: { session: data.session }
      }));
    });
    
    return () => {
      window.removeEventListener('existingCrisisDetected', handleExistingCrisisEvent as EventListener);
    };
  }, []);
  
  return (
    <div>
      <h2>Crisis System Integration Active</h2>
      <Crisis988Widget />
    </div>
  );
};

// CSS Styles for examples
const exampleStyles = `
  .crisis-alert {
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
  }
  
  .crisis-alert.level-moderate {
    background: #fff3cd;
    border: 1px solid #ffc107;
  }
  
  .crisis-alert.level-high {
    background: #f8d7da;
    border: 1px solid #dc3545;
  }
  
  .crisis-alert.level-critical,
  .crisis-alert.level-imminent {
    background: #dc3545;
    color: white;
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  .crisis-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .crisis-button:hover {
    transform: translateY(-2px);
  }
  
  .crisis-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .all-clear {
    color: #28a745;
    font-weight: 600;
  }
`;

export default {
  BasicIntegration,
  AdvancedIntegration,
  ProgrammaticDetection,
  CrisisPreventionExample,
  IntegrateWithExistingSystem
};