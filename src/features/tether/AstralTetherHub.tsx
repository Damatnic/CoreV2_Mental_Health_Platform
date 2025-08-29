/**
 * Astral Tether Hub Component
 * Central hub for managing tether connections and support network
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Heart, Shield, MessageCircle, Activity, Star, AlertCircle, CheckCircle } from 'lucide-react';
import '../../styles/AstralTetherHub.css';

interface TetherConnection {
  id: string;
  name: string;
  role: 'helper' | 'peer' | 'therapist' | 'family';
  status: 'online' | 'offline' | 'busy';
  avatar?: string;
  lastActive: string;
  trustLevel: number;
  specialties?: string[];
}

interface TetherRequest {
  id: string;
  from: string;
  type: 'support' | 'crisis' | 'chat';
  message: string;
  timestamp: string;
  urgency: 'low' | 'medium' | 'high';
}

interface TetherActivity {
  id: string;
  type: 'session' | 'message' | 'milestone';
  description: string;
  timestamp: string;
  connectionId: string;
}

interface AstralTetherHubProps {
  userId: string;
  onConnectionSelect?: (connection: TetherConnection) => void;
  onRequestAccept?: (request: TetherRequest) => void;
}

const AstralTetherHub: React.FC<AstralTetherHubProps> = ({
  userId,
  onConnectionSelect,
  onRequestAccept
}) => {
  const [connections, setConnections] = useState<TetherConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TetherRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<TetherActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'activity'>('connections');
  const [selectedConnection, setSelectedConnection] = useState<TetherConnection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load tether data
  useEffect(() => {
    loadTetherData();
  }, [userId]);

  const loadTetherData = async () => {
    setIsLoading(true);
    try {
      // Mock data loading
      const mockConnections: TetherConnection[] = [
        {
          id: 'conn-1',
          name: 'Dr. Sarah Chen',
          role: 'therapist',
          status: 'online',
          avatar: '/avatars/sarah.jpg',
          lastActive: new Date().toISOString(),
          trustLevel: 95,
          specialties: ['Anxiety', 'Depression', 'PTSD']
        },
        {
          id: 'conn-2',
          name: 'Marcus Williams',
          role: 'peer',
          status: 'online',
          avatar: '/avatars/marcus.jpg',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          trustLevel: 80,
          specialties: ['Recovery Support', 'Mindfulness']
        },
        {
          id: 'conn-3',
          name: 'Emma Thompson',
          role: 'helper',
          status: 'busy',
          avatar: '/avatars/emma.jpg',
          lastActive: new Date(Date.now() - 7200000).toISOString(),
          trustLevel: 85,
          specialties: ['Crisis Support', 'Active Listening']
        },
        {
          id: 'conn-4',
          name: 'Family Support',
          role: 'family',
          status: 'offline',
          lastActive: new Date(Date.now() - 86400000).toISOString(),
          trustLevel: 100,
          specialties: ['Family Therapy', 'Communication']
        }
      ];

      const mockRequests: TetherRequest[] = [
        {
          id: 'req-1',
          from: 'Alex Johnson',
          type: 'support',
          message: 'Looking for someone to talk to about anxiety',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          urgency: 'medium'
        },
        {
          id: 'req-2',
          from: 'Crisis Alert',
          type: 'crisis',
          message: 'User needs immediate support',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          urgency: 'high'
        }
      ];

      const mockActivity: TetherActivity[] = [
        {
          id: 'act-1',
          type: 'session',
          description: 'Completed therapy session with Dr. Chen',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          connectionId: 'conn-1'
        },
        {
          id: 'act-2',
          type: 'message',
          description: 'New message from Marcus Williams',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          connectionId: 'conn-2'
        },
        {
          id: 'act-3',
          type: 'milestone',
          description: 'Achieved 30-day connection streak',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          connectionId: 'conn-1'
        }
      ];

      setConnections(mockConnections);
      setPendingRequests(mockRequests);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading tether data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter connections
  const filteredConnections = connections.filter(conn => {
    const matchesSearch = conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conn.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || conn.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Handle connection selection
  const handleConnectionSelect = (connection: TetherConnection) => {
    setSelectedConnection(connection);
    onConnectionSelect?.(connection);
  };

  // Handle request acceptance
  const handleRequestAccept = (request: TetherRequest) => {
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    onRequestAccept?.(request);
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'therapist': return <Shield className="role-icon therapist" />;
      case 'peer': return <Users className="role-icon peer" />;
      case 'helper': return <Heart className="role-icon helper" />;
      case 'family': return <Heart className="role-icon family" />;
      default: return <Users className="role-icon" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'busy': return 'status-busy';
      case 'offline': return 'status-offline';
      default: return '';
    }
  };

  return (
    <div className="astral-tether-hub">
      <div className="hub-header">
        <h2>Astral Tether Hub</h2>
        <p>Your support network connections</p>
      </div>

      <div className="hub-tabs">
        <button
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <Users size={18} />
          Connections ({connections.length})
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <MessageCircle size={18} />
          Requests ({pendingRequests.length})
          {pendingRequests.some(r => r.urgency === 'high') && (
            <span className="urgency-indicator" />
          )}
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={18} />
          Activity
        </button>
      </div>

      {activeTab === 'connections' && (
        <div className="connections-section">
          <div className="section-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="therapist">Therapists</option>
              <option value="peer">Peers</option>
              <option value="helper">Helpers</option>
              <option value="family">Family</option>
            </select>
          </div>

          <div className="connections-grid">
            {isLoading ? (
              <div className="loading">Loading connections...</div>
            ) : filteredConnections.length > 0 ? (
              filteredConnections.map(connection => (
                <div
                  key={connection.id}
                  className={`connection-card ${selectedConnection?.id === connection.id ? 'selected' : ''}`}
                  onClick={() => handleConnectionSelect(connection)}
                >
                  <div className="connection-header">
                    <div className="connection-avatar">
                      {connection.avatar ? (
                        <img src={connection.avatar} alt={connection.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {connection.name[0]}
                        </div>
                      )}
                      <span className={`status-dot ${getStatusColor(connection.status)}`} />
                    </div>
                    <div className="connection-info">
                      <h3>{connection.name}</h3>
                      <div className="connection-role">
                        {getRoleIcon(connection.role)}
                        <span>{connection.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="trust-level">
                    <span>Trust Level</span>
                    <div className="trust-bar">
                      <div 
                        className="trust-fill"
                        style={{ width: `${connection.trustLevel}%` }}
                      />
                    </div>
                    <span className="trust-percentage">{connection.trustLevel}%</span>
                  </div>

                  {connection.specialties && (
                    <div className="specialties">
                      {connection.specialties.map((specialty, index) => (
                        <span key={index} className="specialty-tag">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="connection-footer">
                    <span className="last-active">
                      {formatTimeAgo(connection.lastActive)}
                    </span>
                    <button className="connect-btn">
                      <MessageCircle size={16} />
                      Connect
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                No connections found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-section">
          {pendingRequests.length > 0 ? (
            pendingRequests.map(request => (
              <div 
                key={request.id} 
                className={`request-card urgency-${request.urgency}`}
              >
                <div className="request-header">
                  <div className="request-info">
                    <h3>{request.from}</h3>
                    <span className="request-type">{request.type}</span>
                  </div>
                  {request.urgency === 'high' && (
                    <AlertCircle className="urgency-icon" size={20} />
                  )}
                </div>
                
                <p className="request-message">{request.message}</p>
                
                <div className="request-footer">
                  <span className="request-time">
                    {formatTimeAgo(request.timestamp)}
                  </span>
                  <div className="request-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => handleRequestAccept(request)}
                    >
                      <CheckCircle size={16} />
                      Accept
                    </button>
                    <button className="decline-btn">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-requests">
              No pending requests at this time.
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="activity-section">
          {recentActivity.length > 0 ? (
            recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'session' && <Activity size={16} />}
                  {activity.type === 'message' && <MessageCircle size={16} />}
                  {activity.type === 'milestone' && <Star size={16} />}
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-time">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              No recent activity to display.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AstralTetherHub;
