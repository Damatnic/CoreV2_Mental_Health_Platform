import React, { useState, useEffect } from 'react';
import { Heart, Phone, MessageCircle, Shield, Users, Compass } from 'lucide-react';
import '../../styles/EmotionalSupportLayer.css';

interface EmotionalSupportLayerProps {
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  onSupportAction?: (action: string, details?: any) => void;
  userPreferences?: {
    preferredContact: 'call' | 'text' | 'chat';
    allowEmergencyContact: boolean;
    crisisContactName?: string;
    crisisContactPhone?: string;
  };
}

interface SupportAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  priority: number;
  riskLevels: string[];
}

const EmotionalSupportLayer: React.FC<EmotionalSupportLayerProps> = ({
  riskLevel = 'low',
  onSupportAction,
  userPreferences
}) => {
  const [selectedSupport, setSelectedSupport] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const supportActions: SupportAction[] = [
    {
      id: 'crisis-hotline',
      title: '988 Crisis Lifeline',
      description: 'Free, confidential crisis support 24/7',
      icon: <Phone size={20} />,
      action: 'tel:988',
      priority: 1,
      riskLevels: ['high', 'critical']
    },
    {
      id: 'crisis-text',
      title: 'Crisis Text Line',
      description: 'Text HOME to 741741 for support',
      icon: <MessageCircle size={20} />,
      action: 'sms:741741?body=HOME',
      priority: 2,
      riskLevels: ['medium', 'high', 'critical']
    },
    {
      id: 'emergency-contact',
      title: 'Call Trusted Contact',
      description: userPreferences?.crisisContactName || 'Contact your support person',
      icon: <Users size={20} />,
      action: `tel:${userPreferences?.crisisContactPhone || ''}`,
      priority: 3,
      riskLevels: ['medium', 'high', 'critical']
    },
    {
      id: 'grounding-exercise',
      title: 'Grounding Technique',
      description: '5-4-3-2-1 mindfulness exercise',
      icon: <Compass size={20} />,
      action: 'grounding',
      priority: 4,
      riskLevels: ['low', 'medium']
    },
    {
      id: 'breathing-exercise',
      title: 'Breathing Exercise',
      description: 'Calming breath work to reduce anxiety',
      icon: <Heart size={20} />,
      action: 'breathing',
      priority: 5,
      riskLevels: ['low', 'medium']
    },
    {
      id: 'emergency-services',
      title: 'Emergency Services',
      description: 'Call 911 for immediate help',
      icon: <Shield size={20} />,
      action: 'tel:911',
      priority: 0,
      riskLevels: ['critical']
    }
  ];

  // Filter support actions based on current risk level
  const availableActions = supportActions
    .filter(action => action.riskLevels.includes(riskLevel))
    .sort((a, b) => a.priority - b.priority);

  const handleSupportAction = async (action: SupportAction) => {
    setSelectedSupport(action.id);
    setIsConnecting(true);

    try {
      if (action.action.startsWith('tel:') || action.action.startsWith('sms:')) {
        // Handle phone/SMS actions
        window.location.href = action.action;
        onSupportAction?.('contact_initiated', {
          type: action.id,
          method: action.action.split(':')[0]
        });
      } else if (action.action === 'grounding') {
        // Navigate to grounding exercise
        onSupportAction?.('exercise_started', { type: 'grounding' });
      } else if (action.action === 'breathing') {
        // Navigate to breathing exercise
        onSupportAction?.('exercise_started', { type: 'breathing' });
      }
    } catch (error) {
      console.error('Failed to execute support action:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const getSupportMessage = (): string => {
    switch (riskLevel) {
      case 'critical':
        return 'Immediate support is available. You are not alone.';
      case 'high':
        return 'Support is here for you. Please reach out now.';
      case 'medium':
        return 'Consider connecting with support resources.';
      case 'low':
        return 'Self-care tools and support are available if needed.';
      default:
        return 'Support resources are always available.';
    }
  };

  const getLayerIntensity = (): string => {
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'urgent';
      case 'medium': return 'moderate';
      case 'low': return 'gentle';
      default: return 'gentle';
    }
  };

  useEffect(() => {
    // Auto-focus on highest priority action for high risk
    if ((riskLevel === 'high' || riskLevel === 'critical') && availableActions.length > 0) {
      setSelectedSupport(availableActions[0].id);
    }
  }, [riskLevel, availableActions]);

  return (
    <div className={`emotional-support-layer ${getLayerIntensity()}`}>
      <div className="support-header">
        <Heart size={24} />
        <div>
          <h3>Emotional Support</h3>
          <p className="support-message">{getSupportMessage()}</p>
        </div>
      </div>

      <div className="support-actions">
        {availableActions.map(action => {
          const isSelected = selectedSupport === action.id;
          const isDisabled = !action.action || 
            (action.id === 'emergency-contact' && !userPreferences?.crisisContactPhone);

          return (
            <button
              key={action.id}
              className={`support-action ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handleSupportAction(action)}
              disabled={isDisabled || isConnecting}
            >
              <div className="action-icon">
                {action.icon}
              </div>
              <div className="action-content">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
              {isConnecting && isSelected && (
                <div className="connecting-indicator">
                  Connecting...
                </div>
              )}
            </button>
          );
        })}
      </div>

      {riskLevel === 'critical' && (
        <div className="critical-banner">
          <Shield size={20} />
          <p>
            <strong>Crisis Support:</strong> If you are in immediate danger, 
            please call 911 or go to your nearest emergency room.
          </p>
        </div>
      )}

      <div className="support-reassurance">
        <Heart size={16} />
        <p>
          Remember: Asking for help is a sign of strength. 
          Your life matters and support is always available.
        </p>
      </div>

      {userPreferences?.preferredContact && (
        <div className="preference-notice">
          <p>Your preferred contact method: {userPreferences.preferredContact}</p>
        </div>
      )}
    </div>
  );
};

export default EmotionalSupportLayer;
