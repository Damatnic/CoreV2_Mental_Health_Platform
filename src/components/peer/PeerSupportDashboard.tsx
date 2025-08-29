import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Calendar, Award, TrendingUp } from 'lucide-react';
import '../../styles/PeerSupportDashboard.css';

interface PeerSession {
  id: string;
  peerName: string;
  date: Date;
  duration: number;
  rating: number;
  notes?: string;
}

interface PeerStats {
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  activePeers: number;
  upcomingSessions: number;
}

const PeerSupportDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<PeerSession[]>([]);
  const [stats, setStats] = useState<PeerStats>({
    totalSessions: 0,
    totalHours: 0,
    averageRating: 0,
    activePeers: 0,
    upcomingSessions: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'peers'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Mock data
    const mockSessions: PeerSession[] = [
      {
        id: '1',
        peerName: 'Alex Chen',
        date: new Date('2024-02-10T14:00:00'),
        duration: 45,
        rating: 5,
        notes: 'Great session on anxiety management'
      },
      {
        id: '2',
        peerName: 'Sarah Johnson',
        date: new Date('2024-02-08T16:00:00'),
        duration: 60,
        rating: 4,
        notes: 'Discussed coping strategies'
      }
    ];

    setSessions(mockSessions);
    
    setStats({
      totalSessions: 24,
      totalHours: 18.5,
      averageRating: 4.6,
      activePeers: 8,
      upcomingSessions: 3
    });
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <Users className="stat-icon" size={24} />
          <div className="stat-content">
            <h3>{stats.activePeers}</h3>
            <p>Active Peers</p>
          </div>
        </div>
        
        <div className="stat-card">
          <MessageSquare className="stat-icon" size={24} />
          <div className="stat-content">
            <h3>{stats.totalSessions}</h3>
            <p>Total Sessions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <Award className="stat-icon" size={24} />
          <div className="stat-content">
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>Avg Rating</p>
          </div>
        </div>
        
        <div className="stat-card">
          <Calendar className="stat-icon" size={24} />
          <div className="stat-content">
            <h3>{stats.upcomingSessions}</h3>
            <p>Upcoming</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Sessions</h3>
        <div className="activity-list">
          {sessions.slice(0, 3).map(session => (
            <div key={session.id} className="activity-item">
              <div className="activity-info">
                <h4>{session.peerName}</h4>
                <p>{session.date.toLocaleDateString()}</p>
              </div>
              <div className="activity-rating">
                {'⭐'.repeat(session.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="sessions-list">
      <h3>All Sessions</h3>
      {sessions.map(session => (
        <div key={session.id} className="session-card">
          <div className="session-header">
            <h4>{session.peerName}</h4>
            <span className="session-date">
              {session.date.toLocaleDateString()}
            </span>
          </div>
          <div className="session-details">
            <span>Duration: {session.duration} min</span>
            <span>Rating: {'⭐'.repeat(session.rating)}</span>
          </div>
          {session.notes && (
            <p className="session-notes">{session.notes}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderPeers = () => (
    <div className="peers-section">
      <h3>Your Support Network</h3>
      <p>Connect with peers who understand your journey</p>
      <button className="find-peers-btn">
        <Users size={20} />
        Find New Peers
      </button>
    </div>
  );

  return (
    <div className="peer-support-dashboard">
      <div className="dashboard-header">
        <h2>Peer Support Dashboard</h2>
        <div className="progress-indicator">
          <TrendingUp size={20} />
          <span>You're making great progress!</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={activeTab === 'peers' ? 'active' : ''}
          onClick={() => setActiveTab('peers')}
        >
          Peers
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'peers' && renderPeers()}
      </div>
    </div>
  );
};

export default PeerSupportDashboard;
