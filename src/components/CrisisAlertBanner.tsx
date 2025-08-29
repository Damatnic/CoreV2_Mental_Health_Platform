import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MessageCircle, X, Shield, Heart } from 'lucide-react';
import '../styles/CrisisAlertBanner.css';

interface CrisisAlertBannerProps {
  isVisible: boolean;
  severity: 'medium' | 'high' | 'critical';
  message?: string;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
  autoHide?: boolean;
  hideDelay?: number;
  position?: 'top' | 'bottom';
  showActions?: boolean;
}

const CrisisAlertBanner: React.FC<CrisisAlertBannerProps> = ({
  isVisible,
  severity,
  message,
  onDismiss,
  onAction,
  autoHide = false,
  hideDelay = 10000,
  position = 'top',
  showActions = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(hideDelay / 1000);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoHide) {
        const interval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              handleDismiss();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, autoHide, hideDelay]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => onDismiss?.(), 300); // Allow animation to complete
  };

  const handleAction = (action: string) => {
    onAction?.(action);
    
    // Execute action
    switch (action) {
      case 'call-988':
        window.location.href = 'tel:988';
        break;
      case 'text-crisis':
        window.location.href = 'sms:741741?body=HOME';
        break;
      case 'call-911':
        window.location.href = 'tel:911';
        break;
    }
  };

  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          color: '#dc2626',
          bgColor: '#fee2e2',
          borderColor: '#fca5a5',
          icon: <Shield size={20} />,
          defaultMessage: 'Crisis detected - Immediate help is available',
          actions: [
            { id: 'call-911', label: 'Call 911', icon: <Phone size={16} />, primary: true },
            { id: 'call-988', label: 'Call 988', icon: <Phone size={16} />, primary: true }
          ]
        };
      case 'high':
        return {
          color: '#ea580c',
          bgColor: '#fed7aa',
          borderColor: '#fdba74',
          icon: <AlertTriangle size={20} />,
          defaultMessage: 'High risk detected - Support is available now',
          actions: [
            { id: 'call-988', label: 'Call 988', icon: <Phone size={16} />, primary: true },
            { id: 'text-crisis', label: 'Text Crisis Line', icon: <MessageCircle size={16} />, primary: false }
          ]
        };
      case 'medium':
        return {
          color: '#d97706',
          bgColor: '#fef3c7',
          borderColor: '#fcd34d',
          icon: <Heart size={20} />,
          defaultMessage: 'Support resources are available if needed',
          actions: [
            { id: 'text-crisis', label: 'Text HOME to 741741', icon: <MessageCircle size={16} />, primary: true },
            { id: 'call-988', label: 'Call 988', icon: <Phone size={16} />, primary: false }
          ]
        };
    }
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  const config = getSeverityConfig();
  const displayMessage = message || config.defaultMessage;

  return (
    <div 
      className={`crisis-alert-banner ${severity} ${position} ${isVisible && isAnimating ? 'visible' : 'hidden'}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.color
      }}
    >
      <div className="alert-content">
        <div className="alert-icon" style={{ color: config.color }}>
          {config.icon}
        </div>
        
        <div className="alert-message">
          <p>{displayMessage}</p>
          {severity === 'critical' && (
            <p className="critical-note">
              <strong>If you are in immediate danger, call 911 or go to your nearest emergency room.</strong>
            </p>
          )}
        </div>

        {showActions && (
          <div className="alert-actions">
            {config.actions.map(action => (
              <button
                key={action.id}
                className={`action-btn ${action.primary ? 'primary' : 'secondary'}`}
                onClick={() => handleAction(action.id)}
                style={{
                  backgroundColor: action.primary ? config.color : 'transparent',
                  borderColor: config.color,
                  color: action.primary ? '#fff' : config.color
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {onDismiss && (
          <button 
            className="dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            style={{ color: config.color }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {autoHide && timeRemaining > 0 && (
        <div className="auto-hide-indicator">
          <div className="countdown-text">
            Auto-dismissing in {timeRemaining}s
          </div>
          <div 
            className="countdown-bar"
            style={{
              backgroundColor: config.color,
              width: `${(timeRemaining / (hideDelay / 1000)) * 100}%`
            }}
          />
        </div>
      )}

      <div className="support-message">
        <Heart size={14} />
        <span>You are not alone. Help is available.</span>
      </div>
    </div>
  );
};

export default CrisisAlertBanner;
