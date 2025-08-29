import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MessageCircle, MapPin, Shield, Heart } from 'lucide-react';
import '../../styles/CrisisIntegrationManager.css';

interface CrisisResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'location' | 'app' | 'professional';
  contact?: string;
  available: boolean;
  priority: number;
  description: string;
}

interface CrisisLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendedActions: string[];
}

const CrisisIntegrationManager: React.FC = () => {
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [crisisLevel] = useState<CrisisLevel>({
    level: 'low',
    message: 'Support resources are available if you need them',
    recommendedActions: ['Check in with yourself', 'Use coping strategies']
  });
  const [isAssessing, setIsAssessing] = useState(false);

  useEffect(() => {
    loadCrisisResources();
  }, []);

  const loadCrisisResources = () => {
    const defaultResources: CrisisResource[] = [
      {
        id: '1',
        name: '988 Suicide & Crisis Lifeline',
        type: 'hotline',
        contact: '988',
        available: true,
        priority: 1,
        description: 'Free, confidential crisis support 24/7'
      },
      {
        id: '2',
        name: 'Crisis Text Line',
        type: 'text',
        contact: '741741',
        available: true,
        priority: 1,
        description: 'Text HOME for support'
      },
      {
        id: '3',
        name: 'Emergency Services',
        type: 'hotline',
        contact: '911',
        available: true,
        priority: 1,
        description: 'Immediate emergency assistance'
      },
      {
        id: '4',
        name: 'Find Local Support',
        type: 'location',
        available: true,
        priority: 2,
        description: 'Locate nearby crisis centers'
      },
      {
        id: '5',
        name: 'Connect with Therapist',
        type: 'professional',
        available: true,
        priority: 3,
        description: 'Schedule urgent session'
      }
    ];

    setResources(defaultResources);
  };

  const assessCrisisLevel = () => {
    setIsAssessing(true);
    // Simulate assessment
    setTimeout(() => {
      setIsAssessing(false);
    }, 2000);
  };

  const handleResourceClick = (resource: CrisisResource) => {
    switch (resource.type) {
      case 'hotline':
        window.location.href = `tel:${resource.contact}`;
        break;
      case 'text':
        window.location.href = `sms:${resource.contact}`;
        break;
      case 'location':
        // Open maps or location finder
        console.log('Opening location finder');
        break;
      default:
        console.log('Activating resource:', resource);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'hotline': return <Phone size={20} />;
      case 'text': return <MessageCircle size={20} />;
      case 'location': return <MapPin size={20} />;
      case 'professional': return <Heart size={20} />;
      default: return <Shield size={20} />;
    }
  };

  const getCrisisLevelColor = () => {
    switch (crisisLevel.level) {
      case 'critical': return 'level-critical';
      case 'high': return 'level-high';
      case 'medium': return 'level-medium';
      default: return 'level-low';
    }
  };

  return (
    <div className="crisis-integration-manager">
      <div className={`crisis-header ${getCrisisLevelColor()}`}>
        <AlertTriangle size={24} />
        <div>
          <h2>Crisis Support Center</h2>
          <p>{crisisLevel.message}</p>
        </div>
      </div>

      {crisisLevel.level !== 'low' && (
        <div className="recommended-actions">
          <h3>Recommended Actions:</h3>
          <ul>
            {crisisLevel.recommendedActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="resources-grid">
        {resources
          .filter(r => r.available)
          .sort((a, b) => a.priority - b.priority)
          .map(resource => (
            <button
              key={resource.id}
              className={`resource-card priority-${resource.priority}`}
              onClick={() => handleResourceClick(resource)}
            >
              <div className="resource-icon">
                {getResourceIcon(resource.type)}
              </div>
              <div className="resource-content">
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                {resource.contact && (
                  <span className="resource-contact">{resource.contact}</span>
                )}
              </div>
            </button>
          ))}
      </div>

      <div className="assessment-section">
        <button
          className="assess-btn"
          onClick={assessCrisisLevel}
          disabled={isAssessing}
        >
          {isAssessing ? 'Assessing...' : 'Quick Crisis Assessment'}
        </button>
      </div>

      <div className="safety-reminder">
        <Shield size={20} />
        <p>
          Your safety is our priority. These resources are always available.
          You are not alone.
        </p>
      </div>
    </div>
  );
};

export default CrisisIntegrationManager;
