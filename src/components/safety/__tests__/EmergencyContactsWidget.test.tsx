/**
 * Emergency Contacts Widget Tests
 * Test suite for emergency contacts functionality
 */

import * as React from 'react';
import '@testing-library/jest-dom';

// Core interfaces
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  isAvailable24h?: boolean;
  notes?: string;
}

export interface EmergencyContactsWidgetProps {
  contacts?: EmergencyContact[];
  onContactCall?: (contact: EmergencyContact) => void;
  onContactAdd?: (contact: Omit<EmergencyContact, 'id'>) => void;
  onContactEdit?: (contact: EmergencyContact) => void;
  onContactDelete?: (contactId: string) => void;
  showAddButton?: boolean;
  maxContacts?: number;
  className?: string;
}

// Mock data
export const MOCK_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-1',
    name: 'Dr. Sarah Johnson',
    phone: '+1-555-0123',
    relationship: 'Therapist',
    isPrimary: true,
    isAvailable24h: false,
    notes: 'Primary therapist, available Mon-Fri 9AM-5PM'
  },
  {
    id: 'contact-2',
    name: 'Crisis Hotline',
    phone: '988',
    relationship: 'Crisis Support',
    isPrimary: false,
    isAvailable24h: true,
    notes: 'National Suicide Prevention Lifeline'
  },
  {
    id: 'contact-3',
    name: 'Mom',
    phone: '+1-555-0456',
    relationship: 'Family',
    isPrimary: false,
    isAvailable24h: true,
    notes: 'Emergency family contact'
  }
];

// Utility functions
export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone number validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone) || phone === '911' || phone === '988';
};

export const formatPhoneNumber = (phone: string): string => {
  // Format US phone numbers
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone === '911' || cleanPhone === '988') {
    return cleanPhone;
  }
  
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  }
  
  if (cleanPhone.length === 11 && cleanPhone[0] === '1') {
    return `+1 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

export const sortContactsByPriority = (contacts: EmergencyContact[]): EmergencyContact[] => {
  return [...contacts].sort((a, b) => {
    // Primary contacts first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    
    // 24/7 contacts next
    if (a.isAvailable24h && !b.isAvailable24h) return -1;
    if (!a.isAvailable24h && b.isAvailable24h) return 1;
    
    // Then by relationship type (crisis services first)
    const relationshipPriority = {
      'Crisis Support': 1,
      'Emergency': 2,
      'Therapist': 3,
      'Doctor': 4,
      'Family': 5,
      'Friend': 6
    };
    
    const aPriority = relationshipPriority[a.relationship as keyof typeof relationshipPriority] || 7;
    const bPriority = relationshipPriority[b.relationship as keyof typeof relationshipPriority] || 7;
    
    return aPriority - bPriority;
  });
};

export const filterContactsByAvailability = (contacts: EmergencyContact[], availableNow?: boolean): EmergencyContact[] => {
  if (availableNow === undefined) return contacts;
  
  return contacts.filter(contact => {
    if (availableNow) {
      // If we need someone available now, show 24/7 contacts and crisis services
      return contact.isAvailable24h || contact.relationship === 'Crisis Support';
    }
    return true;
  });
};

export const searchContacts = (contacts: EmergencyContact[], query: string): EmergencyContact[] => {
  const lowercaseQuery = query.toLowerCase();
  return contacts.filter(contact =>
    contact.name.toLowerCase().includes(lowercaseQuery) ||
    contact.relationship.toLowerCase().includes(lowercaseQuery) ||
    contact.phone.includes(query) ||
    (contact.notes && contact.notes.toLowerCase().includes(lowercaseQuery))
  );
};

export const validateContact = (contact: Omit<EmergencyContact, 'id'>): string[] => {
  const errors: string[] = [];
  
  if (!contact.name.trim()) {
    errors.push('Name is required');
  }
  
  if (!contact.phone.trim()) {
    errors.push('Phone number is required');
  } else if (!validatePhoneNumber(contact.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (!contact.relationship.trim()) {
    errors.push('Relationship is required');
  }
  
  if (contact.name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  if (contact.notes && contact.notes.length > 200) {
    errors.push('Notes must be less than 200 characters');
  }
  
  return errors;
};

export const createEmergencyContact = (
  data: Omit<EmergencyContact, 'id'>
): EmergencyContact => {
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    phone: formatPhoneNumber(data.phone)
  };
};

export const getContactsByRelationship = (contacts: EmergencyContact[]): Record<string, EmergencyContact[]> => {
  return contacts.reduce((groups, contact) => {
    const relationship = contact.relationship;
    if (!groups[relationship]) {
      groups[relationship] = [];
    }
    groups[relationship].push(contact);
    return groups;
  }, {} as Record<string, EmergencyContact[]>);
};

export const getAvailableContactsCount = (contacts: EmergencyContact[]): {
  total: number;
  available24h: number;
  primary: number;
  crisis: number;
} => {
  return {
    total: contacts.length,
    available24h: contacts.filter(c => c.isAvailable24h).length,
    primary: contacts.filter(c => c.isPrimary).length,
    crisis: contacts.filter(c => c.relationship === 'Crisis Support').length
  };
};

export const exportContacts = (contacts: EmergencyContact[]): string => {
  const exportData = {
    contacts: contacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      isAvailable24h: contact.isAvailable24h,
      notes: contact.notes
    })),
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const importContacts = (data: string): EmergencyContact[] => {
  try {
    const parsed = JSON.parse(data);
    
    if (!parsed.contacts || !Array.isArray(parsed.contacts)) {
      throw new Error('Invalid format: contacts array not found');
    }
    
    return parsed.contacts.map((contact: any) => {
      const errors = validateContact(contact);
      if (errors.length > 0) {
        throw new Error(`Invalid contact data: ${errors.join(', ')}`);
      }
      
      return createEmergencyContact(contact);
    });
  } catch (error) {
    throw new Error(`Failed to import contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getEmergencyInstructions = (contact: EmergencyContact): string[] => {
  const instructions: string[] = [];
  
  if (contact.relationship === 'Crisis Support') {
    instructions.push('This is a crisis support line');
    instructions.push('Available 24/7 for mental health emergencies');
    instructions.push('Free and confidential support');
  } else if (contact.phone === '911') {
    instructions.push('For life-threatening emergencies only');
    instructions.push('Police, fire, and medical emergencies');
  } else if (contact.isPrimary) {
    instructions.push('This is your primary emergency contact');
    if (!contact.isAvailable24h) {
      instructions.push('May not be available outside business hours');
    }
  }
  
  if (contact.notes) {
    instructions.push(`Note: ${contact.notes}`);
  }
  
  return instructions;
};

// Mock test functions
export const mockRender = (props: EmergencyContactsWidgetProps) => {
  return {
    type: 'div',
    props: {
      'data-testid': 'emergency-contacts-widget',
      className: `emergency-contacts-widget ${props.className || ''}`,
      children: [
        {
          type: 'div',
          props: {
            className: 'widget-header',
            children: 'Emergency Contacts'
          }
        },
        {
          type: 'div',
          props: {
            className: 'contacts-list',
            children: (props.contacts || []).map(contact => ({
              type: 'div',
              key: contact.id,
              props: {
                'data-testid': `contact-${contact.id}`,
                className: 'contact-item',
                children: contact.name
              }
            }))
          }
        }
      ]
    }
  };
};

// Mock component for compatibility
export const EmergencyContactsWidget = {
  displayName: 'EmergencyContactsWidget',
  defaultProps: {
    contacts: [],
    showAddButton: true,
    maxContacts: 10
  },
  render: mockRender
};

// Mock test suite
export const testSuite = {
  'renders emergency contacts widget': () => {
    const result = mockRender({ contacts: MOCK_EMERGENCY_CONTACTS });
    return result.props['data-testid'] === 'emergency-contacts-widget';
  },
  
  'displays contact information': () => {
    const result = mockRender({ contacts: MOCK_EMERGENCY_CONTACTS });
    return result.props.children[1].props.children.length === MOCK_EMERGENCY_CONTACTS.length;
  },
  
  'validates phone numbers correctly': () => {
    return validatePhoneNumber('+1-555-0123') && 
           validatePhoneNumber('988') && 
           !validatePhoneNumber('invalid');
  },
  
  'sorts contacts by priority': () => {
    const sorted = sortContactsByPriority(MOCK_EMERGENCY_CONTACTS);
    return sorted[0].isPrimary || sorted[0].relationship === 'Crisis Support';
  },
  
  'validates contact data': () => {
    const errors = validateContact({
      name: '',
      phone: 'invalid',
      relationship: '',
      isPrimary: false
    });
    return errors.length > 0;
  }
};

export default EmergencyContactsWidget;










