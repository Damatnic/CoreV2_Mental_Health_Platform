import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, Heart, Phone, MessageCircle } from 'lucide-react';
import '../../styles/CrisisTimeline.css';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'trigger' | 'warning' | 'intervention' | 'resolution' | 'followup';
  title: string;
  description: string;
  action?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const CrisisTimeline: React.FC = () => {
  const [events] = useState<TimelineEvent[]>([
    {
      id: '1',
      timestamp: new Date('2024-02-10T14:30:00'),
      type: 'trigger',
      title: 'Crisis Detected',
      description: 'High-risk indicators identified in journal entry',
      severity: 'high'
    },
    {
      id: '2',
      timestamp: new Date('2024-02-10T14:35:00'),
      type: 'intervention',
      title: 'Safety Resources Activated',
      description: 'Crisis resources and coping strategies presented',
      action: 'Self-help resources provided'
    },
    {
      id: '3',
      timestamp: new Date('2024-02-10T14:45:00'),
      type: 'intervention',
      title: 'Support Contact Initiated',
      description: 'Emergency contact notified per safety plan',
      action: 'Text sent to trusted contact'
    },
    {
      id: '4',
      timestamp: new Date('2024-02-10T15:00:00'),
      type: 'followup',
      title: 'Check-in Scheduled',
      description: '24-hour safety check scheduled',
      action: 'Automated follow-up set'
    }
  ]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <AlertTriangle size={20} />;
      case 'warning':
        return <Clock size={20} />;
      case 'intervention':
        return <Heart size={20} />;
      case 'resolution':
        return <CheckCircle size={20} />;
      case 'followup':
        return <MessageCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getEventColor = (type: string, severity?: string) => {
    if (severity === 'critical') return '#dc3545';
    if (severity === 'high') return '#fd7e14';
    if (severity === 'medium') return '#ffc107';
    
    switch (type) {
      case 'trigger':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'intervention':
        return '#28a745';
      case 'resolution':
        return '#20c997';
      case 'followup':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="crisis-timeline">
      <div className="timeline-header">
        <Clock size={24} />
        <div>
          <h2>Crisis Response Timeline</h2>
          <p>Track intervention progress and safety measures</p>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-line"></div>
        
        {events.map((event) => (
          <div key={event.id} className="timeline-event">
            <div 
              className="event-marker"
              style={{ backgroundColor: getEventColor(event.type, event.severity) }}
            >
              {getEventIcon(event.type)}
            </div>
            
            <div className="event-content">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className="event-time">
                  {event.timestamp.toLocaleTimeString('en', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className="event-description">{event.description}</p>
              
              {event.action && (
                <div className="event-action">
                  <strong>Action:</strong> {event.action}
                </div>
              )}
              
              {event.severity && (
                <span className={`severity-badge severity-${event.severity}`}>
                  {event.severity.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="timeline-actions">
        <h3>Available Actions</h3>
        <div className="action-buttons">
          <button className="action-btn emergency">
            <Phone size={18} />
            Call 988
          </button>
          <button className="action-btn support">
            <MessageCircle size={18} />
            Text Crisis Line
          </button>
          <button className="action-btn resources">
            <Heart size={18} />
            View Safety Plan
          </button>
        </div>
      </div>

      <div className="timeline-summary">
        <div className="summary-card">
          <h4>Response Summary</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-value">{events.length}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {Math.round((Date.now() - events[0]?.timestamp.getTime()) / 60000)}m
              </span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {events.filter(e => e.type === 'intervention').length}
              </span>
              <span className="stat-label">Interventions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisTimeline;
