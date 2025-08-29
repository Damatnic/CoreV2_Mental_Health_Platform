import React from 'react';
import { AlertTriangle, Phone, MessageCircle, Globe } from 'lucide-react';
import '../styles/CulturalCrisisAlert.css';

interface CulturalResource {
  id: string;
  name: string;
  phone: string;
  languages: string[];
  culturalGroups: string[];
  description: string;
  available24h: boolean;
}

interface CulturalCrisisAlertProps {
  userCulture?: string;
  userLanguage?: string;
  severity: 'medium' | 'high' | 'critical';
  onContactResource?: (resourceId: string) => void;
}

const CulturalCrisisAlert: React.FC<CulturalCrisisAlertProps> = ({
  userCulture,
  userLanguage = 'en',
  severity,
  onContactResource
}) => {
  const culturalResources: CulturalResource[] = [
    {
      id: 'hispanic-helpline',
      name: 'National Hispanic Family Helpline',
      phone: '1-866-943-5274',
      languages: ['es', 'en'],
      culturalGroups: ['hispanic', 'latino'],
      description: 'Crisis support in Spanish and English',
      available24h: true
    },
    {
      id: 'asian-mental-health',
      name: 'Asian Mental Health Collective',
      phone: '1-888-274-2642',
      languages: ['en', 'zh', 'ko', 'ja', 'vi', 'hi'],
      culturalGroups: ['asian', 'asian-american'],
      description: 'Culturally competent mental health support',
      available24h: false
    },
    {
      id: 'native-wellness',
      name: 'Native Wellness Research Institute',
      phone: '1-888-946-3327',
      languages: ['en'],
      culturalGroups: ['native-american', 'indigenous'],
      description: 'Traditional and clinical approaches to wellness',
      available24h: true
    },
    {
      id: 'black-mental-health',
      name: 'National Queer and Trans Therapists of Color Network',
      phone: '1-800-273-8255',
      languages: ['en'],
      culturalGroups: ['black', 'african-american', 'lgbtq+'],
      description: 'Affirming support for QTPOC community',
      available24h: true
    }
  ];

  const getRelevantResources = () => {
    return culturalResources.filter(resource => {
      const matchesCulture = !userCulture || resource.culturalGroups.some(group => 
        group.toLowerCase().includes(userCulture.toLowerCase()) || 
        userCulture.toLowerCase().includes(group.toLowerCase())
      );
      
      const matchesLanguage = resource.languages.includes(userLanguage);
      
      return matchesCulture || matchesLanguage;
    });
  };

  const handleContactResource = (resource: CulturalResource) => {
    onContactResource?.(resource.id);
    window.location.href = `tel:${resource.phone}`;
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getSeverityMessage = () => {
    switch (severity) {
      case 'critical':
        return 'Immediate culturally appropriate crisis support is available';
      case 'high':
        return 'Cultural crisis resources are here to support you';
      case 'medium':
        return 'Connect with culturally competent mental health support';
      default:
        return 'Cultural mental health resources available';
    }
  };

  const relevantResources = getRelevantResources();

  return (
    <div className={`cultural-crisis-alert ${severity}`}>
      <div className="alert-header" style={{ borderColor: getSeverityColor() }}>
        <div className="header-content">
          <AlertTriangle size={20} style={{ color: getSeverityColor() }} />
          <div>
            <h3>Cultural Crisis Support</h3>
            <p>{getSeverityMessage()}</p>
          </div>
        </div>
        <Globe size={20} style={{ color: getSeverityColor() }} />
      </div>

      <div className="cultural-message">
        <p>
          We understand that cultural context matters in crisis situations. 
          These resources provide culturally competent support that honors your background and values.
        </p>
      </div>

      <div className="cultural-resources">
        {relevantResources.length > 0 ? (
          relevantResources.map(resource => (
            <div key={resource.id} className="resource-card">
              <div className="resource-header">
                <h4>{resource.name}</h4>
                {resource.available24h && (
                  <span className="availability-badge">24/7</span>
                )}
              </div>
              
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-meta">
                <div className="languages">
                  <Globe size={14} />
                  <span>Languages: {resource.languages.join(', ').toUpperCase()}</span>
                </div>
                
                <div className="cultural-groups">
                  <span>Serves: {resource.culturalGroups.join(', ')}</span>
                </div>
              </div>
              
              <div className="resource-actions">
                <button 
                  className="contact-btn"
                  onClick={() => handleContactResource(resource)}
                  style={{ backgroundColor: getSeverityColor() }}
                >
                  <Phone size={16} />
                  Call {resource.phone}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-cultural-resources">
            <p>No specific cultural resources found for your background.</p>
            <p>The general crisis resources below are still available to help:</p>
          </div>
        )}
      </div>

      <div className="general-resources">
        <h4>General Crisis Resources</h4>
        <div className="general-resource-list">
          <button 
            className="general-resource-btn"
            onClick={() => window.location.href = 'tel:988'}
          >
            <Phone size={16} />
            <div>
              <strong>988 Crisis Lifeline</strong>
              <span>24/7 crisis support in multiple languages</span>
            </div>
          </button>
          
          <button 
            className="general-resource-btn"
            onClick={() => window.location.href = 'sms:741741?body=HOME'}
          >
            <MessageCircle size={16} />
            <div>
              <strong>Crisis Text Line</strong>
              <span>Text HOME to 741741</span>
            </div>
          </button>
        </div>
      </div>

      <div className="cultural-note">
        <p>
          <strong>Cultural Considerations:</strong> Mental health support can vary across cultures. 
          These resources are trained to understand diverse cultural perspectives on mental health and wellness.
        </p>
      </div>
    </div>
  );
};

export default CulturalCrisisAlert;
