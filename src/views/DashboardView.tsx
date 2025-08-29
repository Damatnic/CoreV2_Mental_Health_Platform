import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color: string;
}

const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const [cards] = useState<DashboardCard[]>([
    {
      id: 'ai-chat',
      title: 'AI Chat Support',
      description: 'Talk with our AI mental health assistant',
      icon: '🤖',
      link: '/ai-chat',
      color: 'blue'
    },
    {
      id: 'crisis-resources',
      title: 'Crisis Resources',
      description: 'Get immediate help and support',
      icon: '🚨',
      link: '/crisis',
      color: 'red'
    },
    {
      id: 'wellness',
      title: 'Wellness Tools',
      description: 'Track your mood and mental health',
      icon: '💚',
      link: '/wellness',
      color: 'green'
    },
    {
      id: 'community',
      title: 'Community Support',
      description: 'Connect with others on similar journeys',
      icon: '👥',
      link: '/community',
      color: 'purple'
    },
    {
      id: 'assessments',
      title: 'Mental Health Assessments',
      description: 'Evaluate your mental health status',
      icon: '📋',
      link: '/assessments',
      color: 'orange'
    },
    {
      id: 'reflections',
      title: 'Daily Reflections',
      description: 'Journal your thoughts and feelings',
      icon: '📝',
      link: '/reflections',
      color: 'teal'
    }
  ]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    return user?.firstName || user?.username || 'there';
  };

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {getGreeting()}, {getUserName()}!
        </h1>
        <p className="dashboard-subtitle">
          Welcome to your mental health support dashboard. How can we help you today?
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Today's Check-in</h3>
            <p>How are you feeling?</p>
            <button className="stat-button">Quick Mood Check</button>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Weekly Goal</h3>
            <p>3 of 5 wellness activities</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌟</div>
          <div className="stat-content">
            <h3>Streak</h3>
            <p>7 days of self-care</p>
            <span className="streak-count">Keep it up!</span>
          </div>
        </div>
      </div>

      <div className="dashboard-cards">
        <h2>Your Support Tools</h2>
        <div className="cards-grid">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className={`dashboard-card dashboard-card--${card.color}`}
              onClick={() => window.location.href = card.link}
            >
              <div className="card-icon">{card.icon}</div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.description}</p>
              </div>
              <div className="card-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-button">
            <span className="action-icon">📞</span>
            <span>Call Crisis Line</span>
          </button>
          <button className="quick-action-button">
            <span className="action-icon">💬</span>
            <span>Start AI Chat</span>
          </button>
          <button className="quick-action-button">
            <span className="action-icon">📝</span>
            <span>Write Reflection</span>
          </button>
          <button className="quick-action-button">
            <span className="action-icon">🧘</span>
            <span>Breathing Exercise</span>
          </button>
        </div>
      </div>

      <div className="dashboard-tips">
        <h2>Daily Wellness Tip</h2>
        <div className="tip-card">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <h4>Practice Gratitude</h4>
            <p>
              Take a moment to think of three things you're grateful for today. 
              Gratitude can help shift your focus to positive aspects of your life 
              and improve your overall mood.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="emergency-notice">
          <p>
            <strong>In Crisis?</strong> Contact the National Suicide Prevention Lifeline: 
            <a href="tel:988" className="emergency-link"> 988</a> or 
            <a href="tel:911" className="emergency-link"> 911</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;