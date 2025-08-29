import React, { useState } from 'react';
import { Phone, MessageCircle, Heart, Shield, MapPin, Activity } from 'lucide-react';
import '../../styles/MobileCrisisKit.css';

interface CrisisResource {
  id: string;
  name: string;
  type: 'call' | 'text' | 'location' | 'technique';
  action: string;
  description: string;
  icon: React.ReactNode;
}

const MobileCrisisKit: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  
  const resources: CrisisResource[] = [
    {
      id: '1',
      name: 'Crisis Lifeline',
      type: 'call',
      action: 'tel:988',
      description: 'Call 988 for immediate support',
      icon: <Phone size={20} />
    },
    {
      id: '2',
      name: 'Text Support',
      type: 'text',
      action: 'sms:741741?body=HOME',
      description: 'Text HOME to 741741',
      icon: <MessageCircle size={20} />
    },
    {
      id: '3',
      name: 'Emergency',
      type: 'call',
      action: 'tel:911',
      description: 'Call 911 for emergencies',
      icon: <Shield size={20} />
    },
    {
      id: '4',
      name: 'Breathing Exercise',
      type: 'technique',
      action: 'breathing',
      description: '4-7-8 breathing technique',
      icon: <Activity size={20} />
    },
    {
      id: '5',
      name: 'Grounding',
      type: 'technique',
      action: 'grounding',
      description: '5-4-3-2-1 technique',
      icon: <Heart size={20} />
    },
    {
      id: '6',
      name: 'Find Help',
      type: 'location',
      action: 'locate',
      description: 'Find nearby crisis center',
      icon: <MapPin size={20} />
    }
  ];

  const handleResourceClick = (resource: CrisisResource) => {
    switch (resource.type) {
      case 'call':
      case 'text':
        window.location.href = resource.action;
        break;
      case 'location':
        // Open maps or location finder
        console.log('Opening location services');
        break;
      case 'technique':
        // Start guided technique
        console.log('Starting', resource.action);
        break;
    }
  };

  return (
    <div className={`mobile-crisis-kit ${expanded ? 'expanded' : ''}`}>
      <button
        className="crisis-kit-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-label="Toggle crisis kit"
      >
        <Shield size={24} />
        {!expanded && <span>Crisis Kit</span>}
      </button>

      {expanded && (
        <div className="crisis-kit-content">
          <div className="kit-header">
            <h3>Emergency Resources</h3>
            <button
              className="close-btn"
              onClick={() => setExpanded(false)}
              aria-label="Close crisis kit"
            >
              ×
            </button>
          </div>

          <div className="resources-grid">
            {resources.map(resource => (
              <button
                key={resource.id}
                className={`resource-btn type-${resource.type}`}
                onClick={() => handleResourceClick(resource)}
              >
                {resource.icon}
                <span className="resource-name">{resource.name}</span>
                <span className="resource-desc">{resource.description}</span>
              </button>
            ))}
          </div>

          <div className="safety-message">
            <p>You're not alone. Help is always available.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCrisisKit;
