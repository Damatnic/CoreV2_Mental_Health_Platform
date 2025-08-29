/**
 * Mobile Emergency Contacts Component
 * Quick access to emergency contacts optimized for mobile devices
 */

import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, MapPin, AlertCircle, Heart, Shield, Users } from 'lucide-react';
import '../styles/MobileEmergencyContacts.css';

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  type: 'crisis' | 'medical' | 'personal' | 'professional';
  available: '24/7' | 'business-hours' | 'always';
  icon: React.ReactNode;
  description?: string;
  canText?: boolean;
  location?: string;
}

interface MobileEmergencyContactsProps {
  userId?: string;
  onContactCall?: (contact: EmergencyContact) => void;
  onContactMessage?: (contact: EmergencyContact) => void;
}

const MobileEmergencyContacts: React.FC<MobileEmergencyContactsProps> = ({
  userId,
  onContactCall,
  onContactMessage
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [personalContacts, setPersonalContacts] = useState<EmergencyContact[]>([]);
  const [expandedSection, setExpandedSection] = useState<'crisis' | 'personal' | null>('crisis');
  const [isLoading, setIsLoading] = useState(true);

  // Default emergency contacts
  const defaultContacts: EmergencyContact[] = [
    {
      id: 'crisis-1',
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      type: 'crisis',
      available: '24/7',
      icon: <AlertCircle size={20} />,
      description: 'Free, confidential crisis support',
      canText: true
    },
    {
      id: 'crisis-2',
      name: 'Crisis Text Line',
      number: '741741',
      type: 'crisis',
      available: '24/7',
      icon: <MessageCircle size={20} />,
      description: 'Text HOME to connect with a counselor',
      canText: true
    },
    {
      id: 'medical-1',
      name: 'Emergency Services',
      number: '911',
      type: 'medical',
      available: '24/7',
      icon: <Shield size={20} />,
      description: 'For immediate medical emergency',
      canText: false
    },
    {
      id: 'professional-1',
      name: 'SAMHSA National Helpline',
      number: '1-800-662-4357',
      type: 'professional',
      available: '24/7',
      icon: <Heart size={20} />,
      description: 'Treatment referral and information',
      canText: false
    }
  ];

  useEffect(() => {
    loadContacts();
  }, [userId]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      // Load default contacts
      setContacts(defaultContacts);

      // Load personal contacts (mock data)
      const mockPersonalContacts: EmergencyContact[] = [
        {
          id: 'personal-1',
          name: 'Dr. Sarah Chen',
          number: '555-0123',
          type: 'professional',
          available: 'business-hours',
          icon: <Users size={20} />,
          description: 'Primary therapist',
          canText: true,
          location: 'Downtown Clinic'
        },
        {
          id: 'personal-2',
          name: 'Emergency Contact - Mom',
          number: '555-0124',
          type: 'personal',
          available: 'always',
          icon: <Heart size={20} />,
          description: 'Family support',
          canText: true
        }
      ];

      if (userId) {
        setPersonalContacts(mockPersonalContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (contact: EmergencyContact) => {
    // On mobile, this would trigger a phone call
    if (typeof window !== 'undefined' && 'href' in window.location) {
      window.location.href = `tel:${contact.number}`;
    }
    onContactCall?.(contact);
  };

  const handleMessage = (contact: EmergencyContact) => {
    // On mobile, this would open SMS
    if (typeof window !== 'undefined' && 'href' in window.location) {
      window.location.href = `sms:${contact.number}`;
    }
    onContactMessage?.(contact);
  };

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case '24/7':
        return <span className="availability always">24/7</span>;
      case 'business-hours':
        return <span className="availability business">Business Hours</span>;
      case 'always':
        return <span className="availability always">Always Available</span>;
      default:
        return null;
    }
  };

  const renderContactCard = (contact: EmergencyContact) => (
    <div key={contact.id} className={`contact-card type-${contact.type}`}>
      <div className="contact-header">
        <div className="contact-icon">{contact.icon}</div>
        <div className="contact-info">
          <h3>{contact.name}</h3>
          {contact.description && (
            <p className="contact-description">{contact.description}</p>
          )}
        </div>
        {getAvailabilityLabel(contact.available)}
      </div>

      <div className="contact-number">
        <Phone size={16} />
        <span>{contact.number}</span>
      </div>

      {contact.location && (
        <div className="contact-location">
          <MapPin size={16} />
          <span>{contact.location}</span>
        </div>
      )}

      <div className="contact-actions">
        <button
          className="action-btn call-btn"
          onClick={() => handleCall(contact)}
          aria-label={`Call ${contact.name}`}
        >
          <Phone size={18} />
          Call
        </button>
        {contact.canText && (
          <button
            className="action-btn text-btn"
            onClick={() => handleMessage(contact)}
            aria-label={`Text ${contact.name}`}
          >
            <MessageCircle size={18} />
            Text
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="mobile-emergency-contacts loading">
        <div className="loading-spinner" />
        <p>Loading emergency contacts...</p>
      </div>
    );
  }

  return (
    <div className="mobile-emergency-contacts">
      <div className="emergency-header">
        <AlertCircle className="header-icon" size={24} />
        <div>
          <h2>Emergency Contacts</h2>
          <p>Get help when you need it</p>
        </div>
      </div>

      {/* Crisis Contacts Section */}
      <div className="contacts-section">
        <button
          className={`section-header ${expandedSection === 'crisis' ? 'expanded' : ''}`}
          onClick={() => setExpandedSection(expandedSection === 'crisis' ? null : 'crisis')}
        >
          <span>Crisis & Emergency</span>
          <span className="badge">{contacts.filter(c => c.type === 'crisis' || c.type === 'medical').length}</span>
        </button>
        
        {expandedSection === 'crisis' && (
          <div className="contacts-list">
            {contacts
              .filter(c => c.type === 'crisis' || c.type === 'medical')
              .map(renderContactCard)}
          </div>
        )}
      </div>

      {/* Personal Contacts Section */}
      {personalContacts.length > 0 && (
        <div className="contacts-section">
          <button
            className={`section-header ${expandedSection === 'personal' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          >
            <span>Your Contacts</span>
            <span className="badge">{personalContacts.length}</span>
          </button>
          
          {expandedSection === 'personal' && (
            <div className="contacts-list">
              {personalContacts.map(renderContactCard)}
            </div>
          )}
        </div>
      )}

      {/* Professional Resources */}
      <div className="contacts-section">
        <div className="section-header static">
          <span>Professional Resources</span>
        </div>
        <div className="contacts-list">
          {contacts
            .filter(c => c.type === 'professional')
            .map(renderContactCard)}
        </div>
      </div>

      <div className="emergency-footer">
        <p className="disclaimer">
          If you are experiencing a medical emergency, call 911 immediately.
        </p>
        <button className="add-contact-btn">
          + Add Personal Contact
        </button>
      </div>
    </div>
  );
};

export default MobileEmergencyContacts;
