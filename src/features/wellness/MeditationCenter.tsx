import React, { useState } from 'react';
import { Play, Clock, Heart, Zap } from 'lucide-react';
import '../../styles/MeditationCenter.css';

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: 'mindfulness' | 'breathing' | 'body-scan' | 'loving-kindness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audioUrl?: string;
}

const MeditationCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);

  const sessions: MeditationSession[] = [
    {
      id: '1',
      title: 'Mindful Breathing',
      description: 'Focus on your breath to calm the mind',
      duration: 10,
      category: 'mindfulness',
      difficulty: 'beginner'
    },
    {
      id: '2',
      title: 'Body Scan Relaxation',
      description: 'Progressive relaxation throughout the body',
      duration: 20,
      category: 'body-scan',
      difficulty: 'intermediate'
    },
    {
      id: '3',
      title: 'Loving Kindness',
      description: 'Cultivate compassion for yourself and others',
      duration: 15,
      category: 'loving-kindness',
      difficulty: 'beginner'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Sessions', icon: <Zap size={16} /> },
    { id: 'mindfulness', name: 'Mindfulness', icon: <Heart size={16} /> },
    { id: 'breathing', name: 'Breathing', icon: <Zap size={16} /> },
    { id: 'body-scan', name: 'Body Scan', icon: <Heart size={16} /> },
    { id: 'loving-kindness', name: 'Loving Kindness', icon: <Heart size={16} /> }
  ];

  const filteredSessions = selectedCategory === 'all' 
    ? sessions 
    : sessions.filter(s => s.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="meditation-center">
      <div className="center-header">
        <Heart size={32} />
        <div>
          <h2>Meditation Center</h2>
          <p>Find peace and mindfulness through guided meditation</p>
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
          </button>
        ))}
      </div>

      <div className="sessions-grid">
        {filteredSessions.map(session => (
          <div key={session.id} className="session-card">
            <div className="session-header">
              <h3>{session.title}</h3>
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(session.difficulty) }}
              >
                {session.difficulty}
              </span>
            </div>
            
            <p className="session-description">{session.description}</p>
            
            <div className="session-meta">
              <div className="duration">
                <Clock size={16} />
                <span>{session.duration} min</span>
              </div>
            </div>
            
            <button 
              className="play-btn"
              onClick={() => setSelectedSession(session)}
            >
              <Play size={18} />
              Start Session
            </button>
          </div>
        ))}
      </div>

      {selectedSession && (
        <div className="session-player">
          <div className="player-header">
            <h3>{selectedSession.title}</h3>
            <button onClick={() => setSelectedSession(null)}>×</button>
          </div>
          <div className="player-controls">
            <button className="play-btn">
              <Play size={24} />
            </button>
            <span>{selectedSession.duration} minutes</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeditationCenter;
