import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Heart, AlertTriangle, Shield, X, ExternalLink } from 'lucide-react';
import '../../styles/CrisisHelpWidget.css';

interface CrisisResource {
  id: string;
  name: string;
  type: 'phone' | 'text' | 'chat' | 'website';
  contact: string;
  description: string;
  availability: string;
  specialization?: string[];
  urgent?: boolean;
}

interface CrisisHelpWidgetProps {
  isVisible?: boolean;
  riskLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  onClose?: () => void;
  onResourceUsed?: (resourceId: string, type: string) => void;
  userLocation?: string;
}

const CrisisHelpWidget: React.FC<CrisisHelpWidgetProps> = ({
  isVisible = true,
  riskLevel = 'medium',
  onClose,
  onResourceUsed,
  userLocation
}) => {
  const [selectedTab, setSelectedTab] = useState<'immediate' | 'support' | 'local'>('immediate');

  const crisisResources: CrisisResource[] = [
    {
      id: 'lifeline',
      name: '988 Suicide & Crisis Lifeline',
      type: 'phone',
      contact: '988',
      description: 'Free, confidential 24/7 crisis support for people in distress',
      availability: '24/7',
      urgent: true
    },
    {
      id: 'crisis-text',
      name: 'Crisis Text Line',
      type: 'text',
      contact: '741741',
      description: 'Text HOME to 741741 for free crisis support',
      availability: '24/7',
      urgent: true
    },
    {
      id: 'emergency',
      name: 'Emergency Services',
      type: 'phone',
      contact: '911',
      description: 'For immediate medical or psychiatric emergencies',
      availability: '24/7',
      urgent: true
    },
    {
      id: 'warmline',
      name: 'SAMHSA Helpline',
      type: 'phone',
      contact: '1-800-662-4357',
      description: 'Mental health and substance abuse support',
      availability: '24/7'
    },
    {
      id: 'veterans',
      name: 'Veterans Crisis Line',
      type: 'phone',
      contact: '1-800-273-8255',
      description: 'Crisis support specifically for veterans',
      availability: '24/7',
      specialization: ['veterans', 'military']
    },
    {
      id: 'trevor',
      name: 'The Trevor Project',
      type: 'phone',
      contact: '1-866-488-7386',
      description: 'Crisis support for LGBTQ+ youth',
      availability: '24/7',
      specialization: ['lgbtq', 'youth']
    },
    {
      id: 'postpartum',
      name: 'Postpartum Support',
      type: 'phone',
      contact: '1-800-944-4773',
      description: 'Support for postpartum depression and anxiety',
      availability: 'Business hours',
      specialization: ['postpartum', 'maternal']
    }
  ];

  const localResources: CrisisResource[] = [
    {
      id: 'local-er',
      name: 'Nearest Emergency Room',
      type: 'website',
      contact: 'https://maps.google.com/maps?q=emergency+room+near+me',
      description: 'Find the closest emergency room for immediate help',
      availability: '24/7'
    },
    {
      id: 'local-mental-health',
      name: 'Community Mental Health Centers',
      type: 'website',
      contact: 'https://findtreatment.samhsa.gov/',
      description: 'Find local mental health treatment facilities',
      availability: 'Varies'
    }
  ];

  useEffect(() => {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      setSelectedTab('immediate');
    }
  }, [riskLevel]);

  const handleResourceClick = (resource: CrisisResource) => {
    let action = '';
    
    switch (resource.type) {
      case 'phone':
        action = `tel:${resource.contact}`;
        window.location.href = action;
        break;
      case 'text':
        action = `sms:${resource.contact}`;
        window.location.href = action;
        break;
      case 'website':
        action = resource.contact;
        window.open(action, '_blank', 'noopener,noreferrer');
        break;
      case 'chat':
        action = resource.contact;
        window.open(action, '_blank', 'noopener,noreferrer');
        break;
    }
    
    onResourceUsed?.(resource.id, resource.type);
  };

  const getUrgentResources = () => {
    return crisisResources.filter(resource => resource.urgent);
  };

  const getSupportResources = () => {
    return crisisResources.filter(resource => !resource.urgent);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone size={16} />;
      case 'text': return <MessageCircle size={16} />;
      case 'website': return <ExternalLink size={16} />;
      case 'chat': return <MessageCircle size={16} />;
      default: return <Heart size={16} />;
    }
  };

  const getUrgencyColor = () => {
    switch (riskLevel) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getUrgencyMessage = () => {
    switch (riskLevel) {
      case 'critical':
        return 'Immediate help is available. You are not alone.';
      case 'high':
        return 'Support is here for you right now.';
      case 'medium':
        return 'Help is available when you need it.';
      case 'low':
        return 'Resources are here if you need support.';
      default:
        return 'Crisis support resources are available 24/7.';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`crisis-help-widget ${riskLevel}`}>
      <div className="widget-header" style={{ borderLeftColor: getUrgencyColor() }}>
        <div className="header-content">
          <AlertTriangle size={20} style={{ color: getUrgencyColor() }} />
          <div>
            <h3>Crisis Support</h3>
            <p>{getUrgencyMessage()}</p>
          </div>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      {(riskLevel === 'critical' || riskLevel === 'high') && (
        <div className="urgent-banner">
          <Shield size={16} />
          <span>If you are in immediate danger, call 911 or go to your nearest emergency room</span>
        </div>
      )}

      <div className="widget-tabs">
        <button
          className={`tab ${selectedTab === 'immediate' ? 'active' : ''}`}
          onClick={() => setSelectedTab('immediate')}
        >
          Immediate Help
        </button>
        <button
          className={`tab ${selectedTab === 'support' ? 'active' : ''}`}
          onClick={() => setSelectedTab('support')}
        >
          Support Lines
        </button>
        <button
          className={`tab ${selectedTab === 'local' ? 'active' : ''}`}
          onClick={() => setSelectedTab('local')}
        >
          Local Resources
        </button>
      </div>

      <div className="tab-content">
        {selectedTab === 'immediate' && (
          <div className="resources-list">
            {getUrgentResources().map(resource => (
              <button
                key={resource.id}
                className="resource-item urgent"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="resource-icon">
                  {getResourceIcon(resource.type)}
                </div>
                <div className="resource-details">
                  <h4>{resource.name}</h4>
                  <p>{resource.description}</p>
                  <span className="availability">{resource.availability}</span>
                </div>
                <div className="resource-contact">
                  {resource.type === 'phone' ? resource.contact : 'Connect'}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTab === 'support' && (
          <div className="resources-list">
            {getSupportResources().map(resource => (
              <button
                key={resource.id}
                className="resource-item"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="resource-icon">
                  {getResourceIcon(resource.type)}
                </div>
                <div className="resource-details">
                  <h4>{resource.name}</h4>
                  <p>{resource.description}</p>
                  <div className="resource-meta">
                    <span className="availability">{resource.availability}</span>
                    {resource.specialization && (
                      <div className="specializations">
                        {resource.specialization.map(spec => (
                          <span key={spec} className="spec-tag">{spec}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="resource-contact">
                  {resource.type === 'phone' ? resource.contact : 'Connect'}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTab === 'local' && (
          <div className="resources-list">
            {localResources.map(resource => (
              <button
                key={resource.id}
                className="resource-item"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="resource-icon">
                  {getResourceIcon(resource.type)}
                </div>
                <div className="resource-details">
                  <h4>{resource.name}</h4>
                  <p>{resource.description}</p>
                  <span className="availability">{resource.availability}</span>
                </div>
                <ExternalLink size={16} />
              </button>
            ))}
            
            {userLocation && (
              <div className="location-note">
                <p>Resources shown for: {userLocation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="widget-footer">
        <Heart size={14} />
        <p>You matter. Your life has value. Help is available.</p>
      </div>
    </div>
  );
};

export default CrisisHelpWidget;
