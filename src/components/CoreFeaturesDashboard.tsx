import React from 'react';
import { Heart, Brain, Shield, Users, BarChart3, Settings } from 'lucide-react';
import '../styles/CoreFeaturesDashboard.css';

const CoreFeaturesDashboard: React.FC = () => {
  const features = [
    {
      id: 'mood-tracking',
      title: 'Mood Tracking',
      description: 'Monitor your emotional well-being with daily mood check-ins',
      icon: <Heart size={32} />,
      color: '#ef4444',
      status: 'active'
    },
    {
      id: 'crisis-support',
      title: 'Crisis Support',
      description: '24/7 emergency resources and crisis intervention tools',
      icon: <Shield size={32} />,
      color: '#dc2626',
      status: 'active'
    },
    {
      id: 'journal',
      title: 'Digital Journal',
      description: 'Express your thoughts and track your mental health journey',
      icon: <Brain size={32} />,
      color: '#7c3aed',
      status: 'active'
    },
    {
      id: 'community',
      title: 'Community Support',
      description: 'Connect with others who understand your journey',
      icon: <Users size={32} />,
      color: '#059669',
      status: 'active'
    },
    {
      id: 'analytics',
      title: 'Progress Analytics',
      description: 'Visualize your mental health patterns and improvements',
      icon: <BarChart3 size={32} />,
      color: '#0ea5e9',
      status: 'active'
    },
    {
      id: 'personalization',
      title: 'Personalization',
      description: 'Customize your experience with themes and preferences',
      icon: <Settings size={32} />,
      color: '#6b7280',
      status: 'active'
    }
  ];

  return (
    <div className="core-features-dashboard">
      <div className="dashboard-header">
        <h2>Mental Health Platform Features</h2>
        <p>Comprehensive tools for your mental wellness journey</p>
      </div>

      <div className="features-grid">
        {features.map(feature => (
          <div key={feature.id} className="feature-card" style={{ borderColor: feature.color }}>
            <div className="feature-icon" style={{ color: feature.color }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <div className="feature-status">
              <span className={`status-badge ${feature.status}`}>
                {feature.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreFeaturesDashboard;
