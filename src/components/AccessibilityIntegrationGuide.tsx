import React, { useState } from 'react';
import { Eye, Ear, Hand, Brain, Zap, CheckCircle } from 'lucide-react';
import '../styles/AccessibilityIntegrationGuide.css';

interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'visual' | 'auditory' | 'motor' | 'cognitive';
  implemented: boolean;
  priority: 'high' | 'medium' | 'low';
  guidelines: string[];
  examples: string[];
}

const AccessibilityIntegrationGuide: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features: AccessibilityFeature[] = [
    {
      id: 'keyboard-navigation',
      name: 'Keyboard Navigation',
      description: 'Full keyboard accessibility for all interactive elements',
      icon: <Hand size={20} />,
      category: 'motor',
      implemented: true,
      priority: 'high',
      guidelines: [
        'All interactive elements must be keyboard accessible',
        'Focus indicators must be clearly visible',
        'Tab order should be logical and intuitive',
        'Skip links should be provided for main content'
      ],
      examples: [
        'Tab through all form elements',
        'Use arrow keys for menu navigation',
        'Press Enter or Space to activate buttons',
        'Use Alt+M to skip to main content'
      ]
    },
    {
      id: 'screen-reader',
      name: 'Screen Reader Support',
      description: 'Comprehensive screen reader compatibility and ARIA labels',
      icon: <Ear size={20} />,
      category: 'visual',
      implemented: true,
      priority: 'high',
      guidelines: [
        'All images must have descriptive alt text',
        'Form inputs must have associated labels',
        'Dynamic content changes must be announced',
        'Page structure must use semantic HTML'
      ],
      examples: [
        'Alt text describes mood tracking charts',
        'Form validation errors are announced',
        'Loading states communicated to screen readers',
        'Headings create clear page hierarchy'
      ]
    },
    {
      id: 'high-contrast',
      name: 'High Contrast Mode',
      description: 'Enhanced visual contrast for better readability',
      icon: <Eye size={20} />,
      category: 'visual',
      implemented: true,
      priority: 'high',
      guidelines: [
        'Text contrast ratio must meet WCAG AA standards (4.5:1)',
        'Focus indicators must be visible in high contrast',
        'Color should not be the only means of conveying information',
        'Custom high contrast themes available'
      ],
      examples: [
        'Crisis alert banners maintain contrast',
        'Chart data uses patterns and colors',
        'Form validation uses icons and text',
        'Button states clearly distinguished'
      ]
    },
    {
      id: 'cognitive-support',
      name: 'Cognitive Accessibility',
      description: 'Features to support cognitive and learning differences',
      icon: <Brain size={20} />,
      category: 'cognitive',
      implemented: true,
      priority: 'medium',
      guidelines: [
        'Complex tasks broken into simple steps',
        'Clear, simple language throughout interface',
        'Consistent navigation and layout patterns',
        'Option to reduce motion and animations'
      ],
      examples: [
        'Grounding exercises have step-by-step guidance',
        'Crisis resources presented in simple format',
        'Consistent icon usage across platform',
        'Reduced motion preferences respected'
      ]
    },
    {
      id: 'motor-accessibility',
      name: 'Motor Accessibility',
      description: 'Support for users with motor impairments',
      icon: <Hand size={20} />,
      category: 'motor',
      implemented: true,
      priority: 'medium',
      guidelines: [
        'Large touch targets (minimum 44px)',
        'Generous spacing between interactive elements',
        'Drag and drop alternatives provided',
        'Voice control compatibility'
      ],
      examples: [
        'Mobile breathing exercise has large buttons',
        'Crisis contact buttons are easily tappable',
        'Form inputs have adequate spacing',
        'Alternative text input methods available'
      ]
    },
    {
      id: 'seizure-prevention',
      name: 'Seizure Prevention',
      description: 'Prevent content that may trigger seizures',
      icon: <Zap size={20} />,
      category: 'visual',
      implemented: true,
      priority: 'high',
      guidelines: [
        'No flashing content faster than 3 times per second',
        'Large flash areas avoided',
        'Animation controls provided',
        'Parallax effects can be disabled'
      ],
      examples: [
        'Loading spinners rotate smoothly',
        'Notification animations are gentle',
        'Meditation timers use slow, calming animations',
        'Crisis alerts avoid rapid flashing'
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Features', icon: <CheckCircle size={16} /> },
    { id: 'visual', name: 'Visual', icon: <Eye size={16} /> },
    { id: 'auditory', name: 'Auditory', icon: <Ear size={16} /> },
    { id: 'motor', name: 'Motor', icon: <Hand size={16} /> },
    { id: 'cognitive', name: 'Cognitive', icon: <Brain size={16} /> }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const selectedFeatureData = selectedFeature 
    ? features.find(f => f.id === selectedFeature)
    : null;

  const getImplementationStats = () => {
    const total = features.length;
    const implemented = features.filter(f => f.implemented).length;
    const percentage = Math.round((implemented / total) * 100);
    
    return { total, implemented, percentage };
  };

  const stats = getImplementationStats();

  return (
    <div className="accessibility-integration-guide">
      <div className="guide-header">
        <CheckCircle size={32} />
        <div>
          <h2>Accessibility Integration Guide</h2>
          <p>Comprehensive accessibility features for mental health support</p>
          <div className="implementation-stats">
            <span className="stat-value">{stats.implemented}/{stats.total}</span>
            <span className="stat-label">Features Implemented</span>
            <span className="stat-percentage">({stats.percentage}%)</span>
          </div>
        </div>
      </div>

      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.icon}
            <span>{category.name}</span>
            {category.id !== 'all' && (
              <span className="count">
                ({features.filter(f => f.category === category.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="features-grid">
        {filteredFeatures.map(feature => (
          <div 
            key={feature.id}
            className={`feature-card ${feature.implemented ? 'implemented' : 'pending'} ${feature.priority}`}
            onClick={() => setSelectedFeature(feature.id)}
          >
            <div className="feature-header">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <div className="feature-status">
                {feature.implemented ? (
                  <CheckCircle size={16} className="status-implemented" />
                ) : (
                  <div className="status-pending" />
                )}
              </div>
            </div>

            <div className="feature-content">
              <h3>{feature.name}</h3>
              <p>{feature.description}</p>
              
              <div className="feature-meta">
                <span className={`priority priority-${feature.priority}`}>
                  {feature.priority} priority
                </span>
                <span className="category">
                  {feature.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedFeatureData && (
        <div className="feature-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedFeatureData.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedFeature(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="feature-description">
                <p>{selectedFeatureData.description}</p>
              </div>

              <div className="guidelines-section">
                <h4>Implementation Guidelines</h4>
                <ul>
                  {selectedFeatureData.guidelines.map((guideline, index) => (
                    <li key={index}>{guideline}</li>
                  ))}
                </ul>
              </div>

              <div className="examples-section">
                <h4>Platform Examples</h4>
                <ul>
                  {selectedFeatureData.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="accessibility-resources">
        <h3>Additional Resources</h3>
        <div className="resources-grid">
          <div className="resource-card">
            <h4>WCAG Guidelines</h4>
            <p>Web Content Accessibility Guidelines 2.1 compliance</p>
            <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer">
              View Guidelines
            </a>
          </div>
          
          <div className="resource-card">
            <h4>Screen Reader Testing</h4>
            <p>Test with NVDA, JAWS, and VoiceOver</p>
            <a href="https://webaim.org/screenreaders/" target="_blank" rel="noopener noreferrer">
              Learn More
            </a>
          </div>
          
          <div className="resource-card">
            <h4>Color Contrast Checker</h4>
            <p>Ensure sufficient contrast ratios</p>
            <a href="https://webaim.org/resources/contrastchecker/" target="_blank" rel="noopener noreferrer">
              Check Contrast
            </a>
          </div>
        </div>
      </div>

      <div className="implementation-checklist">
        <h3>Implementation Checklist</h3>
        <div className="checklist">
          {features.map(feature => (
            <div key={feature.id} className={`checklist-item ${feature.implemented ? 'completed' : 'pending'}`}>
              <CheckCircle size={16} />
              <span>{feature.name}</span>
              <span className={`priority-badge priority-${feature.priority}`}>
                {feature.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccessibilityIntegrationGuide;
