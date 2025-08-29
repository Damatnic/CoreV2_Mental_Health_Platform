import React, { useState } from 'react';
import { Plus, Phone, MessageCircle, Heart } from 'lucide-react';
import '../styles/FloatingButtonManager.css';

interface FloatingButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

const FloatingButtonManager: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttons: FloatingButton[] = [
    {
      id: 'crisis-call',
      label: 'Crisis Hotline',
      icon: <Phone size={20} />,
      action: () => window.location.href = 'tel:988',
      color: '#dc2626',
      priority: 'high'
    },
    {
      id: 'mood-check',
      label: 'Quick Mood Check',
      icon: <Heart size={20} />,
      action: () => console.log('Mood check'),
      color: '#059669',
      priority: 'medium'
    },
    {
      id: 'chat-support',
      label: 'Chat Support',
      icon: <MessageCircle size={20} />,
      action: () => console.log('Chat support'),
      color: '#0ea5e9',
      priority: 'medium'
    }
  ];

  return (
    <div className="floating-button-manager">
      <div className={`floating-buttons ${isExpanded ? 'expanded' : ''}`}>
        {buttons.map((button, index) => (
          <button
            key={button.id}
            className="floating-action-btn"
            style={{ 
              backgroundColor: button.color,
              transitionDelay: `${index * 50}ms`
            }}
            onClick={button.action}
            aria-label={button.label}
          >
            {button.icon}
            <span className="button-tooltip">{button.label}</span>
          </button>
        ))}
      </div>
      
      <button
        className="main-floating-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
      >
        <Plus size={24} style={{ transform: isExpanded ? 'rotate(45deg)' : 'none' }} />
      </button>
    </div>
  );
};

export default FloatingButtonManager;
