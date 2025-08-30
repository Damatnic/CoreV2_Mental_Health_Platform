import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Phone, X, MessageCircle, Heart, Volume2, Mic } from 'lucide-react';
import '../styles/CrisisAlert.css';

interface CrisisAlertProps {
  severity?: 'warning' | 'urgent' | 'critical';
  message?: string;
  onDismiss?: () => void;
  onGetHelp?: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
  screenReaderPriority?: 'polite' | 'assertive';
  enableVoiceControl?: boolean;
  highContrastMode?: boolean;
  largeTargetMode?: boolean;
  keyboardShortcuts?: boolean;
}

const CrisisAlert: React.FC<CrisisAlertProps> = ({
  severity = 'warning',
  message = 'We\'re here for you. If you need immediate help, resources are available.',
  onDismiss,
  onGetHelp,
  autoDismiss = true,
  dismissDelay = 10000,
  screenReaderPriority = 'assertive',
  enableVoiceControl = false,
  highContrastMode = false,
  largeTargetMode = false,
  keyboardShortcuts = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  // Screen reader announcement helper
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Announce crisis alert to screen readers immediately
    const severityAnnouncement = {
      warning: 'Warning: Support resources are available if you need help.',
      urgent: 'Urgent: Please consider reaching out for support. Help is available.',
      critical: 'Critical alert: Immediate help is available. Press Alt+9 to call crisis hotline or Alt+T to text for help.'
    };
    
    announceToScreenReader(severityAnnouncement[severity], screenReaderPriority);
    
    // Focus management for keyboard users
    if (severity === 'critical' && alertRef.current) {
      alertRef.current.focus();
    }
    
    if (autoDismiss && severity !== 'critical') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, severity, announceToScreenReader, screenReaderPriority]);

  const handleDismiss = () => {
    announceToScreenReader('Crisis alert dismissed');
    setIsVisible(false);
    onDismiss?.();
  };

  const handleGetHelp = () => {
    announceToScreenReader('Opening support resources dialog');
    setShowResources(true);
    onGetHelp?.();
  };

  const handleCall988 = () => {
    announceToScreenReader('Calling 988 Crisis Lifeline', 'assertive');
    window.location.href = 'tel:988';
  };

  const handleTextCrisis = () => {
    announceToScreenReader('Opening text message to Crisis Text Line', 'assertive');
    window.location.href = 'sms:741741?body=HOME';
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!keyboardShortcuts) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 9: Call crisis hotline
      if (e.altKey && e.key === '9') {
        e.preventDefault();
        handleCall988();
      }
      // Alt + T: Text crisis line
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        handleTextCrisis();
      }
      // Alt + H: Get help/resources
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        handleGetHelp();
      }
      // Escape: Dismiss (if not critical)
      if (e.key === 'Escape' && severity !== 'critical') {
        e.preventDefault();
        handleDismiss();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, severity]);

  // Voice control initialization
  useEffect(() => {
    if (!enableVoiceControl) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const command = event.results[0][0].transcript.toLowerCase();
      
      if (command.includes('help') || command.includes('crisis')) {
        handleGetHelp();
      } else if (command.includes('call')) {
        handleCall988();
      } else if (command.includes('text')) {
        handleTextCrisis();
      } else if (command.includes('dismiss') && severity !== 'critical') {
        handleDismiss();
      }
    };
    
    if (isListening) {
      recognition.start();
    }
    
    return () => {
      recognition.stop();
    };
  }, [enableVoiceControl, isListening]);

  if (!isVisible) return null;

  const alertClasses = [
    'crisis-alert',
    `severity-${severity}`,
    highContrastMode && 'high-contrast',
    largeTargetMode && 'large-targets'
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Screen reader announcer */}
      <div
        ref={announcerRef}
        className="sr-only"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      />
      
      <div 
        ref={alertRef}
        className={alertClasses} 
        role="alert" 
        aria-live={screenReaderPriority}
        aria-label={`Crisis alert: ${severity} level. ${message}`}
        tabIndex={-1}
        <div className="alert-content">
          <div className="alert-icon">
            <AlertTriangle size={24} />
          </div>
          
          <div className="alert-message">
            <p>{message}</p>
            {severity === 'critical' && (
              <p className="urgent-message">
                <strong>Your safety matters.</strong> Please reach out for help.
              </p>
            )}
          </div>

          <div className="alert-actions">
            {severity === 'critical' ? (
              <>
                <button 
                  className={`crisis-btn call ${largeTargetMode ? 'large-target' : ''}`}
                  onClick={handleCall988}
                  aria-label="Call 988 Crisis Lifeline. Press Alt+9 for keyboard shortcut"
                  aria-keyshortcuts="Alt+9"
                  style={largeTargetMode ? { minWidth: '48px', minHeight: '48px' } : {}}
                >
                  <Phone size={largeTargetMode ? 24 : 18} aria-hidden="true" />
                  <span>Call 988</span>
                  <span className="sr-only">24/7 Crisis Lifeline</span>
                </button>
                <button 
                  className={`crisis-btn text ${largeTargetMode ? 'large-target' : ''}`}
                  onClick={handleTextCrisis}
                  aria-label="Text HOME to 741741 Crisis Text Line. Press Alt+T for keyboard shortcut"
                  aria-keyshortcuts="Alt+T"
                  style={largeTargetMode ? { minWidth: '48px', minHeight: '48px' } : {}}
                >
                  <MessageCircle size={largeTargetMode ? 24 : 18} aria-hidden="true" />
                  <span>Text HOME</span>
                  <span className="sr-only">to 741741</span>
                </button>
              </>
            ) : (
              <button 
                className={`help-btn ${largeTargetMode ? 'large-target' : ''}`}
                onClick={handleGetHelp}
                aria-label="Get support resources. Press Alt+H for keyboard shortcut"
                aria-keyshortcuts="Alt+H"
                style={largeTargetMode ? { minWidth: '48px', minHeight: '48px' } : {}}
              >
                Get Support
              </button>
            )}
          </div>

          {severity !== 'critical' && (
            <button
              className={`dismiss-btn ${largeTargetMode ? 'large-target' : ''}`}
              onClick={handleDismiss}
              aria-label="Dismiss alert. Press Escape key to dismiss"
              aria-keyshortcuts="Escape"
              style={largeTargetMode ? { minWidth: '44px', minHeight: '44px' } : {}}
            >
              <X size={largeTargetMode ? 24 : 20} aria-hidden="true" />
              <span className="sr-only">Dismiss</span>
            </button>
          )}
        </div>
      </div>

      {enableVoiceControl && (
        <button
          className={`voice-control-btn ${isListening ? 'listening' : ''}`}
          onClick={() => setIsListening(!isListening)}
          aria-label={isListening ? 'Stop voice control' : 'Start voice control'}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            minWidth: '48px',
            minHeight: '48px',
            borderRadius: '50%',
            backgroundColor: isListening ? '#ef4444' : '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10001
          }}
        >
          <Mic size={24} aria-hidden="true" />
        </button>
      )}

      {showResources && (
        <div 
          className="resources-overlay" 
          onClick={() => setShowResources(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Support resources dialog"
        >
          <div 
            className="resources-modal" 
            onClick={(e) => e.stopPropagation()}
            role="document"
            <div className="modal-header">
              <h2 id="resources-dialog-title">Support Resources</h2>
              <button 
                onClick={() => {
                  announceToScreenReader('Closing support resources');
                  setShowResources(false);
                }}
                aria-label="Close resources dialog"
                style={largeTargetMode ? { minWidth: '44px', minHeight: '44px' } : {}}
              >
                <X size={24} aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="resources-list">
              <button 
                className={`resource-item ${largeTargetMode ? 'large-target' : ''}`}
                onClick={handleCall988}
                aria-label="Call 988 Suicide and Crisis Lifeline for 24/7 confidential support"
                style={largeTargetMode ? { minHeight: '48px' } : {}}
              >
                <Phone size={largeTargetMode ? 24 : 20} aria-hidden="true" />
                <div>
                  <h3>988 Suicide & Crisis Lifeline</h3>
                  <p>24/7 confidential support</p>
                </div>
              </button>
              
              <button 
                className={`resource-item ${largeTargetMode ? 'large-target' : ''}`}
                onClick={handleTextCrisis}
                aria-label="Text HOME to 741741 for Crisis Text Line support"
                style={largeTargetMode ? { minHeight: '48px' } : {}}
              >
                <MessageCircle size={largeTargetMode ? 24 : 20} aria-hidden="true" />
                <div>
                  <h3>Crisis Text Line</h3>
                  <p>Text HOME to 741741</p>
                </div>
              </button>
              
              <div 
                className={`resource-item ${largeTargetMode ? 'large-target' : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Review your personalized safety plan and coping strategies"
                style={largeTargetMode ? { minHeight: '48px' } : {}}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Navigate to safety plan
                    window.location.hash = '#safety-plan';
                  }
                }}
              >
                <Heart size={largeTargetMode ? 24 : 20} aria-hidden="true" />
                <div>
                  <h3>Your Safety Plan</h3>
                  <p>Review your personalized coping strategies</p>
                </div>
              </div>
            </div>
            
            <p className="support-message">
              You don't have to face this alone. Help is always available.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export { CrisisAlert };
export default CrisisAlert;
