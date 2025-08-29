import React, { useState, useEffect } from 'react';

interface CrisisResource {
  id: string;
  title: string;
  description: string;
  phone?: string;
  website?: string;
  available: string;
  type: 'hotline' | 'text' | 'chat' | 'emergency';
}

const CrisisView: React.FC = () => {
  const [resources] = useState<CrisisResource[]>([
    {
      id: 'suicide-prevention',
      title: 'National Suicide Prevention Lifeline',
      description: 'Free and confidential emotional support 24/7',
      phone: '988',
      website: 'https://suicidepreventionlifeline.org',
      available: '24/7',
      type: 'hotline'
    },
    {
      id: 'crisis-text',
      title: 'Crisis Text Line',
      description: 'Text-based crisis support',
      phone: '741741',
      website: 'https://crisistextline.org',
      available: '24/7',
      type: 'text'
    },
    {
      id: 'emergency',
      title: 'Emergency Services',
      description: 'For immediate life-threatening emergencies',
      phone: '911',
      available: '24/7',
      type: 'emergency'
    },
    {
      id: 'samhsa',
      title: 'SAMHSA National Helpline',
      description: 'Treatment referral and information service',
      phone: '1-800-662-4357',
      website: 'https://samhsa.gov',
      available: '24/7',
      type: 'hotline'
    }
  ]);

  const [isEmergency, setIsEmergency] = useState(false);

  const handleEmergencyCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'hotline': return '📞';
      case 'text': return '💬';
      case 'chat': return '💭';
      case 'emergency': return '🚨';
      default: return '📞';
    }
  };

  return (
    <div className="crisis-view">
      <div className="crisis-header">
        <h1>Crisis Support Resources</h1>
        <div className="crisis-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <p><strong>If you are in immediate danger, call 911 now.</strong></p>
            <p>If you are having thoughts of suicide or self-harm, please reach out for help immediately.</p>
          </div>
        </div>
      </div>

      <div className="emergency-actions">
        <button
          className="emergency-button emergency-button--primary"
          onClick={() => handleEmergencyCall('911')}
        >
          🚨 Call 911 - Emergency
        </button>
        <button
          className="emergency-button emergency-button--suicide"
          onClick={() => handleEmergencyCall('988')}
        >
          📞 Call 988 - Suicide Prevention
        </button>
        <button
          className="emergency-button emergency-button--text"
          onClick={() => handleEmergencyCall('741741')}
        >
          💬 Text 741741 - Crisis Support
        </button>
      </div>

      <div className="crisis-resources">
        <h2>Available Support Resources</h2>
        <div className="resources-grid">
          {resources.map((resource) => (
            <div key={resource.id} className={`resource-card resource-card--${resource.type}`}>
              <div className="resource-header">
                <div className="resource-icon">
                  {getResourceIcon(resource.type)}
                </div>
                <div className="resource-info">
                  <h3 className="resource-title">{resource.title}</h3>
                  <span className="resource-availability">{resource.available}</span>
                </div>
              </div>
              
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-actions">
                {resource.phone && (
                  <button
                    className="resource-button resource-button--call"
                    onClick={() => handleEmergencyCall(resource.phone!)}
                  >
                    Call {resource.phone}
                  </button>
                )}
                {resource.website && (
                  <a
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-button resource-button--website"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="crisis-safety-plan">
        <h2>Safety Planning</h2>
        <div className="safety-tips">
          <div className="safety-tip">
            <h4>🛡️ Create a Safety Plan</h4>
            <p>Identify warning signs, coping strategies, and support contacts.</p>
          </div>
          <div className="safety-tip">
            <h4>👥 Build Your Support Network</h4>
            <p>Connect with family, friends, and mental health professionals.</p>
          </div>
          <div className="safety-tip">
            <h4>🏥 Know Your Resources</h4>
            <p>Keep crisis hotline numbers easily accessible.</p>
          </div>
          <div className="safety-tip">
            <h4>💊 Medication Safety</h4>
            <p>Store medications safely and take as prescribed.</p>
          </div>
        </div>
      </div>

      <div className="crisis-disclaimer">
        <h3>Important Information</h3>
        <ul>
          <li>These resources provide immediate support for mental health crises</li>
          <li>If you're experiencing a medical emergency, call 911</li>
          <li>All crisis hotlines are free, confidential, and available 24/7</li>
          <li>You don't have to go through this alone - help is available</li>
        </ul>
      </div>
    </div>
  );
};

export default CrisisView;