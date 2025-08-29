import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Activity, Shield, Clock, Users } from 'lucide-react';
import '../styles/CrisisDetectionDashboard.css';

interface CrisisEvent {
  id: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  source: 'journal' | 'mood' | 'chat' | 'assessment';
  indicators: string[];
  resolved: boolean;
  responseTime?: number;
}

interface DetectionMetrics {
  totalDetections: number;
  averageResponseTime: number;
  resolutionRate: number;
  trendDirection: 'up' | 'down' | 'stable';
}

const CrisisDetectionDashboard: React.FC = () => {
  const [events, setEvents] = useState<CrisisEvent[]>([]);
  const [metrics, setMetrics] = useState<DetectionMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unresolved' | 'high-risk'>('all');

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockEvents: CrisisEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        riskLevel: 'high',
        source: 'journal',
        indicators: ['suicide ideation', 'hopelessness'],
        resolved: true,
        responseTime: 5 // minutes
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        riskLevel: 'medium',
        source: 'mood',
        indicators: ['prolonged sadness', 'isolation'],
        resolved: true,
        responseTime: 12
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        riskLevel: 'critical',
        source: 'chat',
        indicators: ['immediate danger', 'plan mentioned'],
        resolved: false
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        riskLevel: 'low',
        source: 'assessment',
        indicators: ['mild anxiety'],
        resolved: true,
        responseTime: 20
      }
    ];

    setEvents(mockEvents);
    
    // Calculate metrics
    const resolved = mockEvents.filter(e => e.resolved);
    const avgResponseTime = resolved.reduce((sum, e) => sum + (e.responseTime || 0), 0) / resolved.length;
    
    setMetrics({
      totalDetections: mockEvents.length,
      averageResponseTime: Math.round(avgResponseTime),
      resolutionRate: Math.round((resolved.length / mockEvents.length) * 100),
      trendDirection: 'stable'
    });
  }, [timeRange]);

  const filteredEvents = events.filter(event => {
    switch (activeFilter) {
      case 'unresolved':
        return !event.resolved;
      case 'high-risk':
        return event.riskLevel === 'high' || event.riskLevel === 'critical';
      default:
        return true;
    }
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'journal': return '📝';
      case 'mood': return '😔';
      case 'chat': return '💬';
      case 'assessment': return '📋';
      default: return '🔍';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="crisis-detection-dashboard">
      <div className="dashboard-header">
        <Shield size={24} />
        <div>
          <h2>Crisis Detection Dashboard</h2>
          <p>Monitor and respond to mental health crises in real-time</p>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="time-range-selector">
          {(['24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="filter-selector">
          {([
            { key: 'all', label: 'All Events' },
            { key: 'unresolved', label: 'Unresolved' },
            { key: 'high-risk', label: 'High Risk' }
          ] as const).map(filter => (
            <button
              key={filter.key}
              className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <Activity size={20} />
            </div>
            <div className="metric-content">
              <h3>{metrics.totalDetections}</h3>
              <p>Total Detections</p>
            </div>
            <div className="metric-trend">
              <TrendingUp size={16} />
              <span className={metrics.trendDirection}>{metrics.trendDirection}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock size={20} />
            </div>
            <div className="metric-content">
              <h3>{metrics.averageResponseTime}m</h3>
              <p>Avg Response Time</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Shield size={20} />
            </div>
            <div className="metric-content">
              <h3>{metrics.resolutionRate}%</h3>
              <p>Resolution Rate</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Users size={20} />
            </div>
            <div className="metric-content">
              <h3>{filteredEvents.filter(e => !e.resolved).length}</h3>
              <p>Active Cases</p>
            </div>
          </div>
        </div>
      )}

      <div className="events-section">
        <div className="section-header">
          <h3>Crisis Events</h3>
          <span className="event-count">{filteredEvents.length} events</span>
        </div>

        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <Shield size={48} />
              <h3>No events found</h3>
              <p>No crisis events match the current filters.</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className={`event-item ${event.riskLevel} ${event.resolved ? 'resolved' : 'active'}`}>
                <div className="event-header">
                  <div className="event-risk">
                    <div 
                      className="risk-indicator"
                      style={{ backgroundColor: getRiskLevelColor(event.riskLevel) }}
                    />
                    <span className="risk-level">{event.riskLevel.toUpperCase()}</span>
                  </div>
                  <div className="event-source">
                    <span className="source-icon">{getSourceIcon(event.source)}</span>
                    <span>{event.source}</span>
                  </div>
                  <div className="event-time">
                    {formatTimeAgo(event.timestamp)}
                  </div>
                </div>

                <div className="event-content">
                  <div className="event-indicators">
                    <strong>Indicators:</strong>
                    {event.indicators.map(indicator => (
                      <span key={indicator} className="indicator-tag">
                        {indicator}
                      </span>
                    ))}
                  </div>
                  
                  <div className="event-status">
                    <span className={`status-badge ${event.resolved ? 'resolved' : 'active'}`}>
                      {event.resolved ? 'Resolved' : 'Active'}
                    </span>
                    {event.responseTime && (
                      <span className="response-time">
                        Response: {event.responseTime}m
                      </span>
                    )}
                  </div>
                </div>

                {!event.resolved && (
                  <div className="event-actions">
                    <button className="action-btn primary">
                      Take Action
                    </button>
                    <button className="action-btn secondary">
                      View Details
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="footer-info">
          <AlertTriangle size={16} />
          <span>Crisis detection is active and monitoring user inputs in real-time</span>
        </div>
        <div className="last-update">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default CrisisDetectionDashboard;
