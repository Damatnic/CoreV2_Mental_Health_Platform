import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X, MessageCircle, Heart } from 'lucide-react';
import '../styles/CrisisAlert.css';

interface CrisisAlertProps {
  severity?: 'warning' | 'urgent' | 'critical';
  message?: string;
  onDismiss?: () => void;
  onGetHelp?: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const CrisisAlert: React.FC<CrisisAlertProps> = ({
  severity = 'warning',
  message = 'We\'re here for you. If you need immediate help, resources are available.',
  onDismiss,
  onGetHelp,
  autoDismiss = true,
  dismissDelay = 10000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showResources, setShowResources] = useState(false);

  useEffect(() => {
    if (autoDismiss && severity !== 'critical') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, severity]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleGetHelp = () => {
    setShowResources(true);
    onGetHelp?.();
  };

  const handleCall988 = () => {
    window.location.href = 'tel:988';
  };

  const handleTextCrisis = () => {
    window.location.href = 'sms:741741?body=HOME';
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={`crisis-alert severity-${severity}`} role="alert" aria-live="assertive">
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
                  className="crisis-btn call"
                  onClick={handleCall988}
                  aria-label="Call 988 Crisis Lifeline"
                >
                  <Phone size={18} />
                  Call 988
                </button>
                <button 
                  className="crisis-btn text"
                  onClick={handleTextCrisis}
                  aria-label="Text Crisis Line"
                >
                  <MessageCircle size={18} />
                  Text HOME
                </button>
              </>
            ) : (
              <button 
                className="help-btn"
                onClick={handleGetHelp}
              >
                Get Support
              </button>
            )}
          </div>

          {severity !== 'critical' && (
            <button
              className="dismiss-btn"
              onClick={handleDismiss}
              aria-label="Dismiss alert"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {showResources && (
        <div className="resources-overlay" onClick={() => setShowResources(false)}>
          <div className="resources-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Support Resources</h2>
              <button onClick={() => setShowResources(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="resources-list">
              <button className="resource-item" onClick={handleCall988}>
                <Phone size={20} />
                <div>
                  <h3>988 Suicide & Crisis Lifeline</h3>
                  <p>24/7 confidential support</p>
                </div>
              </button>
              
              <button className="resource-item" onClick={handleTextCrisis}>
                <MessageCircle size={20} />
                <div>
                  <h3>Crisis Text Line</h3>
                  <p>Text HOME to 741741</p>
                </div>
              </button>
              
              <div className="resource-item">
                <Heart size={20} />
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
