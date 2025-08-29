import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Phone, MessageCircle } from 'lucide-react';
import '../styles/CrisisAlertNotification.css';

interface CrisisAlertProps {
  message?: string;
  severity?: 'warning' | 'urgent' | 'critical';
  onDismiss?: () => void;
  onGetHelp?: () => void;
}

const CrisisAlertNotification: React.FC<CrisisAlertProps> = ({
  message = 'If you are in crisis, help is available',
  severity = 'warning',
  onDismiss,
  onGetHelp
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    if (severity === 'critical') {
      // Don't auto-dismiss critical alerts
      return;
    }

    const timer = setTimeout(() => {
      if (!hasBeenDismissed) {
        setIsVisible(false);
      }
    }, 10000); // Auto-dismiss after 10 seconds

    return () => clearTimeout(timer);
  }, [severity, hasBeenDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    onDismiss?.();
  };

  const handleGetHelp = () => {
    onGetHelp?.();
    // Default action if no handler provided
    if (!onGetHelp) {
      window.location.href = '/crisis';
    }
  };

  const handleCall988 = () => {
    window.location.href = 'tel:988';
  };

  const handleTextCrisis = () => {
    window.location.href = 'sms:741741?body=HOME';
  };

  if (!isVisible) return null;

  return (
    <div className={`crisis-alert-notification severity-${severity}`} role="alert">
      <div className="alert-icon">
        <AlertTriangle size={24} />
      </div>
      
      <div className="alert-content">
        <p className="alert-message">{message}</p>
        
        {severity === 'critical' && (
          <div className="emergency-actions">
            <button 
              className="emergency-btn call"
              onClick={handleCall988}
              aria-label="Call 988 Crisis Lifeline"
            >
              <Phone size={16} />
              Call 988
            </button>
            <button 
              className="emergency-btn text"
              onClick={handleTextCrisis}
              aria-label="Text HOME to Crisis Text Line"
            >
              <MessageCircle size={16} />
              Text HOME to 741741
            </button>
          </div>
        )}
        
        {severity !== 'critical' && (
          <button 
            className="get-help-btn"
            onClick={handleGetHelp}
          >
            Get Help Now
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
  );
};

export default CrisisAlertNotification;
