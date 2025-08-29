import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Heart, Filter } from 'lucide-react';
import '../../styles/CommunityEvents.css';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'workshop' | 'support-group' | 'social' | 'wellness' | 'educational';
  date: Date;
  duration: string;
  location: string;
  isOnline: boolean;
  capacity: number;
  registered: number;
  facilitator: string;
  tags: string[];
}

const CommunityEvents: React.FC = () => {
  const [events] = useState<CommunityEvent[]>([
    {
      id: '1',
      title: 'Mindfulness & Meditation Workshop',
      description: 'Learn practical mindfulness techniques for daily stress management and emotional regulation.',
      type: 'workshop',
      date: new Date('2024-02-15T18:00:00'),
      duration: '90 minutes',
      location: 'Community Center Room A',
      isOnline: false,
      capacity: 20,
      registered: 14,
      facilitator: 'Dr. Sarah Chen',
      tags: ['mindfulness', 'stress-relief', 'beginner-friendly']
    },
    {
      id: '2',
      title: 'Anxiety Support Circle',
      description: 'Safe space to share experiences and coping strategies with others who understand anxiety.',
      type: 'support-group',
      date: new Date('2024-02-16T19:00:00'),
      duration: '60 minutes',
      location: 'Online via Zoom',
      isOnline: true,
      capacity: 15,
      registered: 8,
      facilitator: 'Licensed Counselor',
      tags: ['anxiety', 'support', 'peer-connection']
    },
    {
      id: '3',
      title: 'Mental Health First Aid Training',
      description: 'Learn how to recognize and respond to mental health crises in your community.',
      type: 'educational',
      date: new Date('2024-02-18T14:00:00'),
      duration: '4 hours',
      location: 'Training Center',
      isOnline: false,
      capacity: 30,
      registered: 22,
      facilitator: 'Mental Health First Aid Team',
      tags: ['first-aid', 'crisis-response', 'certification']
    },
    {
      id: '4',
      title: 'Art Therapy Session',
      description: 'Express yourself through creative art in a supportive group environment.',
      type: 'wellness',
      date: new Date('2024-02-20T16:00:00'),
      duration: '2 hours',
      location: 'Art Studio',
      isOnline: false,
      capacity: 12,
      registered: 9,
      facilitator: 'Maria Rodriguez, Art Therapist',
      tags: ['art-therapy', 'creativity', 'self-expression']
    }
  ]);

  const [filter, setFilter] = useState<string>('all');
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'support-group', label: 'Support Groups' },
    { value: 'social', label: 'Social Events' },
    { value: 'wellness', label: 'Wellness Activities' },
    { value: 'educational', label: 'Educational' }
  ];

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.type === filter);

  const handleRegister = (eventId: string) => {
    setRegisteredEvents(prev => new Set([...prev, eventId]));
    console.log('Registered for event:', eventId);
  };

  const handleUnregister = (eventId: string) => {
    setRegisteredEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'workshop': '#007bff',
      'support-group': '#28a745',
      'social': '#ffc107',
      'wellness': '#17a2b8',
      'educational': '#6f42c1'
    };
    return colors[type as keyof typeof colors] || '#6c757d';
  };

  const isEventFull = (event: CommunityEvent) => event.registered >= event.capacity;
  const isRegistered = (eventId: string) => registeredEvents.has(eventId);

  return (
    <div className="community-events">
      <div className="events-header">
        <Calendar size={24} />
        <div>
          <h2>Community Events</h2>
          <p>Connect, learn, and grow together</p>
        </div>
      </div>

      <div className="events-filters">
        <Filter size={20} />
        <div className="filter-buttons">
          {eventTypes.map(type => (
            <button
              key={type.value}
              className={`filter-btn ${filter === type.value ? 'active' : ''}`}
              onClick={() => setFilter(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-header">
              <span 
                className="event-type"
                style={{ backgroundColor: getTypeColor(event.type) }}
              >
                {event.type.replace('-', ' ')}
              </span>
              <span className={`capacity-indicator ${isEventFull(event) ? 'full' : ''}`}>
                {event.registered}/{event.capacity}
              </span>
            </div>

            <h3>{event.title}</h3>
            <p className="event-description">{event.description}</p>

            <div className="event-details">
              <div className="detail">
                <Clock size={16} />
                <span>{event.date.toLocaleDateString('en', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>

              <div className="detail">
                <MapPin size={16} />
                <span>
                  {event.isOnline ? '🌐 ' + event.location : event.location}
                </span>
              </div>

              <div className="detail">
                <Users size={16} />
                <span>{event.facilitator}</span>
              </div>
            </div>

            <div className="event-tags">
              {event.tags.map(tag => (
                <span key={tag} className="event-tag">#{tag}</span>
              ))}
            </div>

            <div className="event-footer">
              <div className="duration">
                <Clock size={14} />
                {event.duration}
              </div>
              
              {isRegistered(event.id) ? (
                <button 
                  className="unregister-btn"
                  onClick={() => handleUnregister(event.id)}
                >
                  Registered ✓
                </button>
              ) : (
                <button 
                  className="register-btn"
                  onClick={() => handleRegister(event.id)}
                  disabled={isEventFull(event)}
                >
                  {isEventFull(event) ? 'Full' : 'Register'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="events-summary">
        <div className="summary-card">
          <Heart size={20} />
          <div>
            <h3>Join Our Community</h3>
            <p>
              Participate in events that support your mental health journey. 
              Connect with others, learn new skills, and find the support you need.
            </p>
          </div>
        </div>
      </div>

      <div className="event-guidelines">
        <h3>Event Guidelines</h3>
        <ul>
          <li>All events are free and open to community members</li>
          <li>Registration is required for capacity planning</li>
          <li>Please arrive 10 minutes early for in-person events</li>
          <li>Contact us if you need accommodations</li>
          <li>Respect confidentiality and privacy of other participants</li>
        </ul>
      </div>
    </div>
  );
};

export default CommunityEvents;
