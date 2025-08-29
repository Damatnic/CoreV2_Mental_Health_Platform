import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  PhoneIcon, 
  MessageIcon, 
  LocationIcon, 
  ClockIcon, 
  SearchIcon, 
  HeartIcon,
  AlertIcon,
  InfoIcon,
  ExternalLinkIcon
} from '../components/icons.dynamic';

interface CrisisResource {
  id: string;
  name: string;
  description: string;
  type: 'hotline' | 'chat' | 'text' | 'emergency' | 'local' | 'online';
  contact: {
    phone?: string;
    website?: string;
    textNumber?: string;
    chatUrl?: string;
    email?: string;
  };
  availability: {
    hours: string;
    timezone?: string;
    languages: string[];
  };
  specializations: string[];
  isEmergency: boolean;
  location?: {
    city: string;
    state: string;
    country: string;
    address?: string;
  };
  rating?: number;
  isVerified: boolean;
  lastUpdated: Date;
  tags: string[];
}

interface CrisisCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  resources: CrisisResource[];
  isEmergency?: boolean;
}

const CrisisResourcesView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [categories, setCategories] = useState<CrisisCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [filteredResources, setFilteredResources] = useState<CrisisResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('');

  useEffect(() => {
    loadCrisisResources();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchQuery, selectedCategory, selectedType, userLocation]);

  const loadCrisisResources = async () => {
    try {
      setIsLoading(true);
      
      // Mock crisis resources data
      const mockResources: CrisisResource[] = [
        // Emergency Resources
        {
          id: '1',
          name: 'National Suicide Prevention Lifeline',
          description: '24/7 free and confidential support for people in distress, prevention and crisis resources.',
          type: 'hotline',
          contact: {
            phone: '988',
            website: 'https://suicidepreventionlifeline.org',
            chatUrl: 'https://suicidepreventionlifeline.org/chat'
          },
          availability: {
            hours: '24/7',
            languages: ['English', 'Spanish']
          },
          specializations: ['Suicide Prevention', 'Mental Health Crisis', 'Emotional Support'],
          isEmergency: true,
          rating: 4.9,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['crisis', 'suicide', 'emergency', 'national']
        },
        {
          id: '2',
          name: 'Crisis Text Line',
          description: 'Free, 24/7 support for those in crisis. Text HOME to 741741 from anywhere in the US.',
          type: 'text',
          contact: {
            textNumber: '741741',
            website: 'https://www.crisistextline.org'
          },
          availability: {
            hours: '24/7',
            languages: ['English', 'Spanish']
          },
          specializations: ['Crisis Support', 'Text-based Help', 'Youth Crisis'],
          isEmergency: true,
          rating: 4.8,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['crisis', 'text', 'emergency', 'youth']
        },
        {
          id: '3',
          name: 'SAMHSA National Helpline',
          description: 'Treatment referral and information service for individuals and families facing mental health and substance use disorders.',
          type: 'hotline',
          contact: {
            phone: '1-800-662-4357',
            website: 'https://www.samhsa.gov/find-help/national-helpline'
          },
          availability: {
            hours: '24/7',
            languages: ['English', 'Spanish']
          },
          specializations: ['Substance Abuse', 'Mental Health Treatment', 'Referrals'],
          isEmergency: false,
          rating: 4.7,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['treatment', 'referral', 'substance abuse']
        },
        // Specialized Resources
        {
          id: '4',
          name: 'National Sexual Assault Hotline',
          description: 'Free, confidential support 24/7 for survivors of sexual assault and their loved ones.',
          type: 'hotline',
          contact: {
            phone: '1-800-656-4673',
            website: 'https://www.rainn.org',
            chatUrl: 'https://hotline.rainn.org/online'
          },
          availability: {
            hours: '24/7',
            languages: ['English', 'Spanish']
          },
          specializations: ['Sexual Assault', 'Trauma Support', 'Legal Resources'],
          isEmergency: true,
          rating: 4.9,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['sexual assault', 'trauma', 'emergency']
        },
        {
          id: '5',
          name: 'National Domestic Violence Hotline',
          description: 'Confidential support for domestic violence survivors and anyone seeking resources and information.',
          type: 'hotline',
          contact: {
            phone: '1-800-799-7233',
            website: 'https://www.thehotline.org',
            textNumber: '22522',
            chatUrl: 'https://www.thehotline.org/get-help/what-is-live-chat'
          },
          availability: {
            hours: '24/7',
            languages: ['English', 'Spanish', '200+ languages via interpretation']
          },
          specializations: ['Domestic Violence', 'Safety Planning', 'Legal Advocacy'],
          isEmergency: true,
          rating: 4.8,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['domestic violence', 'safety', 'emergency']
        },
        {
          id: '6',
          name: 'Trans Lifeline',
          description: 'Peer support service run by and for trans people, offering direct emotional and financial support.',
          type: 'hotline',
          contact: {
            phone: '877-565-8860',
            website: 'https://translifeline.org'
          },
          availability: {
            hours: '24/7',
            languages: ['English']
          },
          specializations: ['LGBTQ+ Support', 'Transgender Issues', 'Peer Support'],
          isEmergency: false,
          rating: 4.6,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['lgbtq', 'transgender', 'peer support']
        },
        // Local/Online Resources
        {
          id: '7',
          name: 'BetterHelp Crisis Support',
          description: 'Professional online therapy platform with crisis support features.',
          type: 'online',
          contact: {
            website: 'https://www.betterhelp.com',
            chatUrl: 'https://www.betterhelp.com/crisis'
          },
          availability: {
            hours: 'Varies by therapist',
            languages: ['English', 'Spanish']
          },
          specializations: ['Online Therapy', 'Professional Counseling', 'Crisis Support'],
          isEmergency: false,
          rating: 4.3,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['online', 'therapy', 'professional']
        },
        {
          id: '8',
          name: 'Veterans Crisis Line',
          description: 'Free, confidential support for Veterans in crisis and their families and friends.',
          type: 'hotline',
          contact: {
            phone: '988 (Press 1)',
            website: 'https://www.veteranscrisisline.net',
            textNumber: '838255',
            chatUrl: 'https://www.veteranscrisisline.net/get-help-now/chat'
          },
          availability: {
            hours: '24/7',
            languages: ['English', 'Spanish']
          },
          specializations: ['Veterans Support', 'Military Mental Health', 'PTSD'],
          isEmergency: true,
          rating: 4.7,
          isVerified: true,
          lastUpdated: new Date(),
          tags: ['veterans', 'military', 'ptsd', 'emergency']
        }
      ];

      const mockCategories: CrisisCategory[] = [
        {
          id: 'emergency',
          name: 'Emergency Crisis Support',
          description: 'Immediate help for life-threatening situations',
          icon: <AlertIcon />,
          resources: mockResources.filter(r => r.isEmergency),
          isEmergency: true
        },
        {
          id: 'suicide',
          name: 'Suicide Prevention',
          description: 'Support for suicidal thoughts and prevention',
          icon: <HeartIcon />,
          resources: mockResources.filter(r => r.specializations.some(s => s.toLowerCase().includes('suicide')))
        },
        {
          id: 'trauma',
          name: 'Trauma & Violence',
          description: 'Support for trauma, abuse, and violence survivors',
          icon: <AlertIcon />,
          resources: mockResources.filter(r => 
            r.specializations.some(s => 
              s.toLowerCase().includes('trauma') || 
              s.toLowerCase().includes('assault') || 
              s.toLowerCase().includes('violence')
            )
          )
        },
        {
          id: 'substance',
          name: 'Substance Abuse',
          description: 'Help with addiction and substance use disorders',
          icon: <InfoIcon />,
          resources: mockResources.filter(r => r.specializations.some(s => s.toLowerCase().includes('substance')))
        },
        {
          id: 'specialized',
          name: 'Specialized Support',
          description: 'Support for specific communities and needs',
          icon: <HeartIcon />,
          resources: mockResources.filter(r => 
            r.specializations.some(s => 
              s.toLowerCase().includes('lgbtq') || 
              s.toLowerCase().includes('veterans') ||
              s.toLowerCase().includes('transgender')
            )
          )
        },
        {
          id: 'online',
          name: 'Online Resources',
          description: 'Web-based support and therapy platforms',
          icon: <ExternalLinkIcon />,
          resources: mockResources.filter(r => r.type === 'online')
        }
      ];

      setResources(mockResources);
      setCategories(mockCategories);
      
    } catch (error) {
      console.error('Error loading crisis resources:', error);
      showNotification('Failed to load crisis resources', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      // Try to get user's location for local resources
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // In a real app, you'd use a geocoding service
            setUserLocation('Local Area');
          },
          (error) => {
            console.log('Location access denied:', error);
          }
        );
      }
    } catch (error) {
      console.log('Geolocation not supported');
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.name.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.specializations.some(spec => spec.toLowerCase().includes(query)) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(resource => 
          category.resources.some(cr => cr.id === resource.id)
        );
      }
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }

    // Sort by priority (emergency first, then by rating)
    filtered.sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    setFilteredResources(filtered);
  };

  const handleContactResource = (resource: CrisisResource, contactType: string) => {
    const { contact } = resource;
    
    switch (contactType) {
      case 'phone':
        if (contact.phone) {
          window.open(`tel:${contact.phone}`, '_self');
          showNotification(`Calling ${resource.name}...`, 'info');
        }
        break;
      case 'text':
        if (contact.textNumber) {
          window.open(`sms:${contact.textNumber}`, '_self');
          showNotification(`Opening text to ${resource.name}...`, 'info');
        }
        break;
      case 'chat':
        if (contact.chatUrl) {
          window.open(contact.chatUrl, '_blank');
          showNotification(`Opening chat with ${resource.name}...`, 'info');
        }
        break;
      case 'website':
        if (contact.website) {
          window.open(contact.website, '_blank');
          showNotification(`Opening ${resource.name} website...`, 'info');
        }
        break;
      case 'email':
        if (contact.email) {
          window.open(`mailto:${contact.email}`, '_self');
          showNotification(`Opening email to ${resource.name}...`, 'info');
        }
        break;
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'hotline': return <PhoneIcon />;
      case 'text': return <MessageIcon />;
      case 'chat': return <MessageIcon />;
      case 'online': return <ExternalLinkIcon />;
      case 'local': return <LocationIcon />;
      default: return <InfoIcon />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'hotline': return 'Phone Support';
      case 'text': return 'Text Support';
      case 'chat': return 'Online Chat';
      case 'online': return 'Online Platform';
      case 'local': return 'Local Resource';
      case 'emergency': return 'Emergency';
      default: return 'Support';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading crisis resources...</p>
      </div>
    );
  }

  return (
    <div className="crisis-resources-view">
      <ViewHeader
        title="Crisis Resources"
        subtitle="Immediate help and support when you need it most"
      />

      {/* Emergency Banner */}
      <Card className="emergency-banner">
        <div className="emergency-content">
          <AlertIcon className="emergency-icon" />
          <div className="emergency-text">
            <h3>In Immediate Danger?</h3>
            <p>If you are in immediate danger or having thoughts of suicide, please contact emergency services or call 988 (Suicide & Crisis Lifeline) immediately.</p>
          </div>
          <div className="emergency-actions">
            <AppButton 
              variant="danger" 
              onClick={() => window.open('tel:911', '_self')}
            >
              Call 911
            </AppButton>
            <AppButton 
              variant="primary" 
              onClick={() => window.open('tel:988', '_self')}
            >
              Call 988
            </AppButton>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="filters-card">
        <div className="search-and-filters">
          <div className="search-bar">
            <SearchIcon />
            <AppInput
              type="text"
              placeholder="Search resources by name, type, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="hotline">Phone Support</option>
              <option value="text">Text Support</option>
              <option value="chat">Online Chat</option>
              <option value="online">Online Platform</option>
              <option value="local">Local Resources</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Quick Access Categories */}
      <div className="categories-grid">
        {categories.map(category => (
          <Card 
            key={category.id} 
            className={`category-card ${category.isEmergency ? 'emergency' : ''} ${selectedCategory === category.id ? 'selected' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <h4>{category.name}</h4>
            <p>{category.description}</p>
            <span className="resource-count">{category.resources.length} resources</span>
          </Card>
        ))}
      </div>

      {/* Resources List */}
      <div className="resources-list">
        <div className="resources-header">
          <h3>Available Resources</h3>
          <span className="results-count">
            {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {filteredResources.length === 0 ? (
          <Card className="no-results">
            <h4>No resources found</h4>
            <p>Try adjusting your search or filters to find relevant resources.</p>
          </Card>
        ) : (
          filteredResources.map(resource => (
            <Card key={resource.id} className={`resource-card ${resource.isEmergency ? 'emergency' : ''}`}>
              <div className="resource-header">
                <div className="resource-title-section">
                  <div className="resource-type">
                    {getResourceTypeIcon(resource.type)}
                    <span>{getResourceTypeLabel(resource.type)}</span>
                    {resource.isEmergency && <span className="emergency-badge">Emergency</span>}
                    {resource.isVerified && <span className="verified-badge">✓ Verified</span>}
                  </div>
                  <h4>{resource.name}</h4>
                  {resource.rating && (
                    <div className="resource-rating">
                      <span>★ {resource.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="resource-content">
                <p className="resource-description">{resource.description}</p>

                <div className="resource-details">
                  <div className="detail-item">
                    <ClockIcon />
                    <span>Available: {resource.availability.hours}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span>Languages: {resource.availability.languages.join(', ')}</span>
                  </div>

                  {resource.location && (
                    <div className="detail-item">
                      <LocationIcon />
                      <span>{resource.location.city}, {resource.location.state}</span>
                    </div>
                  )}
                </div>

                <div className="resource-specializations">
                  {resource.specializations.map(spec => (
                    <span key={spec} className="specialization-tag">{spec}</span>
                  ))}
                </div>

                <div className="resource-actions">
                  {resource.contact.phone && (
                    <AppButton
                      variant="primary"
                      size="small"
                      onClick={() => handleContactResource(resource, 'phone')}
                    >
                      <PhoneIcon /> Call {resource.contact.phone}
                    </AppButton>
                  )}

                  {resource.contact.textNumber && (
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleContactResource(resource, 'text')}
                    >
                      <MessageIcon /> Text {resource.contact.textNumber}
                    </AppButton>
                  )}

                  {resource.contact.chatUrl && (
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleContactResource(resource, 'chat')}
                    >
                      <MessageIcon /> Online Chat
                    </AppButton>
                  )}

                  {resource.contact.website && (
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleContactResource(resource, 'website')}
                    >
                      <ExternalLinkIcon /> Visit Website
                    </AppButton>
                  )}

                  {resource.contact.email && (
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleContactResource(resource, 'email')}
                    >
                      Email Support
                    </AppButton>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Additional Information */}
      <Card className="additional-info">
        <h3>Important Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>When to Seek Emergency Help</h4>
            <ul>
              <li>Thoughts of suicide or self-harm</li>
              <li>Immediate danger to yourself or others</li>
              <li>Severe mental health crisis</li>
              <li>Substance overdose</li>
            </ul>
          </div>
          
          <div className="info-item">
            <h4>What to Expect</h4>
            <ul>
              <li>Trained crisis counselors available 24/7</li>
              <li>Confidential and free support</li>
              <li>No judgment, just help</li>
              <li>Referrals to local resources when needed</li>
            </ul>
          </div>

          <div className="info-item">
            <h4>Privacy & Confidentiality</h4>
            <ul>
              <li>Your calls and chats are confidential</li>
              <li>Information is only shared if you're in immediate danger</li>
              <li>You can remain anonymous if you choose</li>
              <li>No personal information required</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CrisisResourcesView;
