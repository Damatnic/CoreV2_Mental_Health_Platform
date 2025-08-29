import React, { useState } from 'react';
import { Phone, MessageCircle, Heart, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/CrisisSupportWidget.css';

interface CrisisSupportWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  compact?: boolean;
  alwaysVisible?: boolean;
}

const CrisisSupportWidget: React.FC<CrisisSupportWidgetProps> = ({
  position = 'bottom-right',
  compact = false,
  alwaysVisible = false
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysVisible);
  const [showResources, setShowResources] = useState(false);

  const crisisResources = [
    {
      id: 'lifeline',
      name: '988 Crisis Lifeline',
      action: 'tel:988',
      icon: <Phone size={16} />,
      description: '24/7 crisis support',
      primary: true
    },
    {
      id: 'text',
      name: 'Crisis Text Line',
      action: 'sms:741741?body=HOME',
      icon: <MessageCircle size={16} />,
      description: 'Text HOME to 741741',
      primary: true
    },
    {
      id: 'emergency',
      name: 'Emergency Services',
      action: 'tel:911',
      icon: <Shield size={16} />,
      description: 'Call 911',
      primary: false
    }
  ];

  const handleResourceClick = (action: string) => {
    window.location.href = action;
  };

  const toggleExpanded = () => {
    if (!alwaysVisible) {
      setIsExpanded(!isExpanded);
    }
  };

  if (compact) {
    return (
      <div className={`crisis-support-widget compact ${position}`}>
        <button
          className="crisis-btn-compact"
          onClick={() => handleResourceClick('tel:988')}
          aria-label="Crisis support - Call 988"
        >
          <Heart size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`crisis-support-widget ${position} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="widget-header" onClick={toggleExpanded}>
        <div className="header-content">
          <Heart size={20} />
          <span>Crisis Support</span>
        </div>
        {!alwaysVisible && (
          <button className="toggle-btn">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="widget-content">
          <div className="crisis-message">
            <p>If you're in crisis, you're not alone. Help is available right now.</p>
          </div>

          <div className="primary-actions">
            {crisisResources
              .filter(resource => resource.primary)
              .map(resource => (
                <button
                  key={resource.id}
                  className="crisis-action-btn primary"
                  onClick={() => handleResourceClick(resource.action)}
                  aria-label={`${resource.name} - ${resource.description}`}
                >
                  {resource.icon}
                  <div className="action-text">
                    <span className="action-name">{resource.name}</span>
                    <span className="action-desc">{resource.description}</span>
                  </div>
                </button>
              ))}
          </div>

          <button
            className="more-resources-btn"
            onClick={() => setShowResources(!showResources)}
          >
            {showResources ? 'Less Options' : 'More Resources'}
          </button>

          {showResources && (
            <div className="additional-resources">
              {crisisResources
                .filter(resource => !resource.primary)
                .map(resource => (
                  <button
                    key={resource.id}
                    className="crisis-action-btn secondary"
                    onClick={() => handleResourceClick(resource.action)}
                  >
                    {resource.icon}
                    <span>{resource.name}</span>
                  </button>
                ))}
              
              <div className="resource-links">
                <a 
                  href="/crisis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="resource-link"
                >
                  View All Crisis Resources
                </a>
                <a 
                  href="/safety-plan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="resource-link"
                >
                  My Safety Plan
                </a>
              </div>
            </div>
          )}

          <div className="widget-footer">
            <p className="reassurance">
              🤗 You matter. Your life has value.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrisisSupportWidget;
