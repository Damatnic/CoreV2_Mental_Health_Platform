/**
 * Veterans Resources View
 * Specialized mental health resources for military veterans
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ViewHeader } from '../components/ViewHeader';
import { AppButton } from '../components/AppButton';
import { useNotification } from '../contexts/NotificationContext';
import './VeteransResourcesView.css';

interface ResourceCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  resources: VeteranResource[];
}

interface VeteranResource {
  id: string;
  title: string;
  description: string;
  url?: string;
  phone?: string;
  type: 'hotline' | 'website' | 'program' | 'facility';
  availability: string;
  isEmergency?: boolean;
}

export const VeteransResourcesView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('crisis');
  const [resources, setResources] = useState<ResourceCategory[]>([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadVeteranResources();
  }, []);

  const loadVeteranResources = async () => {
    try {
      const resourceData: ResourceCategory[] = [
        {
          id: 'crisis',
          title: 'Crisis Support',
          icon: '🚨',
          description: 'Immediate help for veterans in crisis',
          resources: [
            {
              id: 'veterans-crisis-line',
              title: 'Veterans Crisis Line',
              description: '24/7 crisis support specifically for veterans',
              phone: '988',
              type: 'hotline',
              availability: '24/7',
              isEmergency: true
            },
            {
              id: 'military-crisis-line',
              title: 'Military Crisis Line',
              description: 'Chat and text support for military personnel',
              url: 'https://www.militarycrisisline.net',
              phone: '1-800-273-8255',
              type: 'hotline',
              availability: '24/7',
              isEmergency: true
            }
          ]
        },
        {
          id: 'ptsd',
          title: 'PTSD Support',
          icon: '🧠',
          description: 'Resources for post-traumatic stress disorder',
          resources: [
            {
              id: 'ptsd-coach',
              title: 'PTSD Coach App',
              description: 'Mobile app for managing PTSD symptoms',
              url: 'https://www.ptsd.va.gov/appvid/mobile/ptsdcoach_app.asp',
              type: 'program',
              availability: 'Always available'
            },
            {
              id: 'va-ptsd-treatment',
              title: 'VA PTSD Treatment',
              description: 'Professional PTSD treatment through VA',
              url: 'https://www.ptsd.va.gov',
              type: 'facility',
              availability: 'Business hours'
            }
          ]
        },
        {
          id: 'benefits',
          title: 'VA Benefits',
          icon: '🏛️',
          description: 'Information about veteran benefits and services',
          resources: [
            {
              id: 'va-benefits',
              title: 'VA Benefits Hotline',
              description: 'Information about disability, healthcare, and other benefits',
              phone: '1-800-827-1000',
              type: 'hotline',
              availability: 'Mon-Fri 8AM-8PM'
            },
            {
              id: 'ebenefits',
              title: 'eBenefits Portal',
              description: 'Online access to VA benefits and services',
              url: 'https://www.ebenefits.va.gov',
              type: 'website',
              availability: 'Always available'
            }
          ]
        },
        {
          id: 'family',
          title: 'Family Support',
          icon: '👨‍👩‍👧‍👦',
          description: 'Support for military families',
          resources: [
            {
              id: 'military-family-life',
              title: 'Military Family Life Counselors',
              description: 'Counseling support for military families',
              url: 'https://www.militaryfamilylife.org',
              type: 'program',
              availability: 'Varies by location'
            },
            {
              id: 'operation-homefront',
              title: 'Operation Homefront',
              description: 'Emergency financial assistance for military families',
              url: 'https://www.operationhomefront.org',
              phone: '1-800-722-6098',
              type: 'program',
              availability: 'Mon-Fri 9AM-5PM'
            }
          ]
        }
      ];

      setResources(resourceData);
    } catch (error) {
      console.error('Failed to load veteran resources:', error);
      showNotification('Failed to load resources. Please try again.', 'error');
    }
  };

  const handleContactResource = (resource: VeteranResource) => {
    if (resource.phone) {
      window.open(`tel:${resource.phone}`, '_blank');
    } else if (resource.url) {
      window.open(resource.url, '_blank');
    }
    
    showNotification(`Connecting to ${resource.title}`, 'info');
  };

  const selectedCategoryData = resources.find(cat => cat.id === selectedCategory);

  return (
    <div className="veterans-resources-view">
      <ViewHeader 
        title="Veterans Mental Health Resources"
        subtitle="Specialized support for our military heroes"
      />

      <div className="emergency-banner">
        <div className="emergency-content">
          <span className="emergency-icon">🚨</span>
          <div>
            <strong>Veterans in Crisis:</strong>
            <p>Call 988, Press 1 for immediate support</p>
          </div>
          <AppButton 
            variant="emergency"
            onClick={() => window.open('tel:988', '_blank')}
          >
            Call Now
          </AppButton>
        </div>
      </div>

      <div className="resource-categories">
        {resources.map(category => (
          <button
            key={category.id}
            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <div className="category-info">
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedCategoryData && (
        <div className="resources-grid">
          {selectedCategoryData.resources.map(resource => (
            <Card key={resource.id} className="resource-card">
              <div className="resource-header">
                <h3>{resource.title}</h3>
                {resource.isEmergency && (
                  <span className="emergency-badge">Emergency</span>
                )}
              </div>
              
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-details">
                <div className="detail-item">
                  <strong>Type:</strong> {resource.type}
                </div>
                <div className="detail-item">
                  <strong>Available:</strong> {resource.availability}
                </div>
                {resource.phone && (
                  <div className="detail-item">
                    <strong>Phone:</strong> {resource.phone}
                  </div>
                )}
              </div>

              <div className="resource-actions">
                <AppButton
                  variant={resource.isEmergency ? 'emergency' : 'primary'}
                  onClick={() => handleContactResource(resource)}
                  fullWidth
                >
                  {resource.phone ? 'Call Now' : 'Visit Resource'}
                </AppButton>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="additional-resources">
        <Card>
          <h3>Additional Support</h3>
          <ul>
            <li>
              <strong>VA Mental Health:</strong> 
              <a href="https://www.mentalhealth.va.gov" target="_blank" rel="noopener noreferrer">
                mentalhealth.va.gov
              </a>
            </li>
            <li>
              <strong>Wounded Warrior Project:</strong> 
              <a href="https://www.woundedwarriorproject.org" target="_blank" rel="noopener noreferrer">
                woundedwarriorproject.org
              </a>
            </li>
            <li>
              <strong>Team Red White & Blue:</strong> 
              <a href="https://www.teamrwb.org" target="_blank" rel="noopener noreferrer">
                teamrwb.org
              </a>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default VeteransResourcesView;
