/**
 * Emergency Contact Service
 * Manages emergency contacts and crisis response for mental health support
 */

import { logger } from '../utils/logger';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isHealthcareProfessional?: boolean;
  notes?: string;
  availableHours?: string;
}

export interface CrisisResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'local' | 'professional';
  contactInfo: string;
  description: string;
  availability: string;
  isEmergency: boolean;
  country?: string;
  language?: string[];
}

export interface EmergencyPlan {
  id: string;
  userId: string;
  warningSignals: string[];
  copingStrategies: string[];
  emergencyContacts: string[]; // IDs of emergency contacts
  crisisResources: string[]; // IDs of crisis resources
  safeEnvironment: string[];
  professionalSupports: string[];
  lastUpdated: Date;
  isActive: boolean;
}

class EmergencyContactService {
  private readonly CONTACTS_KEY = 'corev2_emergency_contacts';
  private readonly PLAN_KEY = 'corev2_emergency_plan';
  private readonly RESOURCES_KEY = 'corev2_crisis_resources';

  constructor() {
    this.initializeDefaultResources();
  }

  private initializeDefaultResources(): void {
    const existingResources = this.getCrisisResources();
    if (existingResources.length === 0) {
      const defaultResources = this.getDefaultCrisisResources();
      this.saveCrisisResources(defaultResources);
    }
  }

  private getDefaultCrisisResources(): CrisisResource[] {
    return [
      {
        id: 'suicide-prevention-lifeline',
        name: 'National Suicide Prevention Lifeline',
        type: 'hotline',
        contactInfo: '988',
        description: '24/7 free and confidential support for people in distress and crisis prevention resources',
        availability: '24/7',
        isEmergency: true,
        country: 'US',
        language: ['English', 'Spanish']
      },
      {
        id: 'crisis-text-line',
        name: 'Crisis Text Line',
        type: 'text',
        contactInfo: 'Text HOME to 741741',
        description: 'Free, 24/7 crisis support via text message',
        availability: '24/7',
        isEmergency: true,
        country: 'US',
        language: ['English', 'Spanish']
      },
      {
        id: 'emergency-services',
        name: 'Emergency Services',
        type: 'hotline',
        contactInfo: '911',
        description: 'Immediate emergency response for life-threatening situations',
        availability: '24/7',
        isEmergency: true,
        country: 'US',
        language: ['English']
      },
      {
        id: 'nami-helpline',
        name: 'NAMI National Helpline',
        type: 'hotline',
        contactInfo: '1-800-950-6264',
        description: 'Information, referrals and support for people with mental health conditions',
        availability: 'Mon-Fri 10am-10pm ET',
        isEmergency: false,
        country: 'US',
        language: ['English', 'Spanish']
      },
      {
        id: 'samhsa-helpline',
        name: 'SAMHSA National Helpline',
        type: 'hotline',
        contactInfo: '1-800-662-4357',
        description: 'Treatment referral and information service for mental health and substance use disorders',
        availability: '24/7',
        isEmergency: false,
        country: 'US',
        language: ['English', 'Spanish']
      }
    ];
  }

  // Emergency Contacts Management
  public getEmergencyContacts(): EmergencyContact[] {
    try {
      const contacts = localStorage.getItem(this.CONTACTS_KEY);
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      logger.error('Failed to retrieve emergency contacts', { error });
      return [];
    }
  }

  public addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): EmergencyContact {
    const newContact: EmergencyContact = {
      ...contact,
      id: this.generateId()
    };

    const contacts = this.getEmergencyContacts();
    contacts.push(newContact);
    this.saveEmergencyContacts(contacts);

    logger.info('Emergency contact added', { contactId: newContact.id });
    return newContact;
  }

  public updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): boolean {
    const contacts = this.getEmergencyContacts();
    const index = contacts.findIndex(contact => contact.id === id);

    if (index === -1) {
      logger.warn('Emergency contact not found for update', { id });
      return false;
    }

    contacts[index] = { ...contacts[index], ...updates };
    this.saveEmergencyContacts(contacts);

    logger.info('Emergency contact updated', { contactId: id });
    return true;
  }

  public removeEmergencyContact(id: string): boolean {
    const contacts = this.getEmergencyContacts();
    const filteredContacts = contacts.filter(contact => contact.id !== id);

    if (filteredContacts.length === contacts.length) {
      logger.warn('Emergency contact not found for removal', { id });
      return false;
    }

    this.saveEmergencyContacts(filteredContacts);
    logger.info('Emergency contact removed', { contactId: id });
    return true;
  }

  public getPrimaryContact(): EmergencyContact | null {
    const contacts = this.getEmergencyContacts();
    return contacts.find(contact => contact.isPrimary) || null;
  }

  public setPrimaryContact(id: string): boolean {
    const contacts = this.getEmergencyContacts();
    
    // Remove primary flag from all contacts
    contacts.forEach(contact => {
      contact.isPrimary = false;
    });

    // Set new primary contact
    const targetContact = contacts.find(contact => contact.id === id);
    if (!targetContact) {
      logger.warn('Contact not found for primary assignment', { id });
      return false;
    }

    targetContact.isPrimary = true;
    this.saveEmergencyContacts(contacts);

    logger.info('Primary contact updated', { contactId: id });
    return true;
  }

  private saveEmergencyContacts(contacts: EmergencyContact[]): void {
    try {
      localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
    } catch (error) {
      logger.error('Failed to save emergency contacts', { error });
    }
  }

  // Crisis Resources Management
  public getCrisisResources(): CrisisResource[] {
    try {
      const resources = localStorage.getItem(this.RESOURCES_KEY);
      return resources ? JSON.parse(resources) : [];
    } catch (error) {
      logger.error('Failed to retrieve crisis resources', { error });
      return [];
    }
  }

  public getEmergencyResources(): CrisisResource[] {
    return this.getCrisisResources().filter(resource => resource.isEmergency);
  }

  public getSupportResources(): CrisisResource[] {
    return this.getCrisisResources().filter(resource => !resource.isEmergency);
  }

  private saveCrisisResources(resources: CrisisResource[]): void {
    try {
      localStorage.setItem(this.RESOURCES_KEY, JSON.stringify(resources));
    } catch (error) {
      logger.error('Failed to save crisis resources', { error });
    }
  }

  // Emergency Plan Management
  public getEmergencyPlan(): EmergencyPlan | null {
    try {
      const plan = localStorage.getItem(this.PLAN_KEY);
      return plan ? JSON.parse(plan) : null;
    } catch (error) {
      logger.error('Failed to retrieve emergency plan', { error });
      return null;
    }
  }

  public createEmergencyPlan(planData: Omit<EmergencyPlan, 'id' | 'lastUpdated'>): EmergencyPlan {
    const newPlan: EmergencyPlan = {
      ...planData,
      id: this.generateId(),
      lastUpdated: new Date()
    };

    this.saveEmergencyPlan(newPlan);
    logger.info('Emergency plan created', { planId: newPlan.id });
    return newPlan;
  }

  public updateEmergencyPlan(updates: Partial<EmergencyPlan>): boolean {
    const currentPlan = this.getEmergencyPlan();
    if (!currentPlan) {
      logger.warn('No emergency plan found for update');
      return false;
    }

    const updatedPlan: EmergencyPlan = {
      ...currentPlan,
      ...updates,
      lastUpdated: new Date()
    };

    this.saveEmergencyPlan(updatedPlan);
    logger.info('Emergency plan updated', { planId: updatedPlan.id });
    return true;
  }

  private saveEmergencyPlan(plan: EmergencyPlan): void {
    try {
      localStorage.setItem(this.PLAN_KEY, JSON.stringify(plan));
    } catch (error) {
      logger.error('Failed to save emergency plan', { error });
    }
  }

  // Emergency Actions
  public async initiateEmergencyContact(contactId: string): Promise<boolean> {
    const contact = this.getEmergencyContacts().find(c => c.id === contactId);
    if (!contact) {
      logger.error('Emergency contact not found', { contactId });
      return false;
    }

    try {
      // Log the emergency contact initiation
      logger.info('Emergency contact initiated', { 
        contactId, 
        contactName: contact.name,
        timestamp: new Date()
      });

      // In a real app, you might integrate with calling APIs or send notifications
      // For now, we'll open the phone dialer or email client
      if (contact.phone) {
        window.open(`tel:${contact.phone}`);
      }

      return true;
    } catch (error) {
      logger.error('Failed to initiate emergency contact', { contactId, error });
      return false;
    }
  }

  public async callCrisisHotline(resourceId: string): Promise<boolean> {
    const resource = this.getCrisisResources().find(r => r.id === resourceId);
    if (!resource) {
      logger.error('Crisis resource not found', { resourceId });
      return false;
    }

    try {
      logger.info('Crisis hotline called', { 
        resourceId, 
        resourceName: resource.name,
        timestamp: new Date()
      });

      // Open phone dialer
      if (resource.type === 'hotline') {
        window.open(`tel:${resource.contactInfo}`);
      } else if (resource.type === 'text') {
        // For text services, show instructions
        alert(`To contact ${resource.name}: ${resource.contactInfo}`);
      }

      return true;
    } catch (error) {
      logger.error('Failed to call crisis hotline', { resourceId, error });
      return false;
    }
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public clearAllData(): void {
    try {
      localStorage.removeItem(this.CONTACTS_KEY);
      localStorage.removeItem(this.PLAN_KEY);
      localStorage.removeItem(this.RESOURCES_KEY);
      logger.info('All emergency contact data cleared');
    } catch (error) {
      logger.error('Failed to clear emergency contact data', { error });
    }
  }

  // Quick Access Methods
  public getQuickAccessContacts(): EmergencyContact[] {
    return this.getEmergencyContacts()
      .filter(contact => contact.isPrimary || contact.isHealthcareProfessional)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });
  }

  public getQuickAccessResources(): CrisisResource[] {
    return this.getCrisisResources()
      .filter(resource => resource.isEmergency)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Export singleton instance
export const emergencyContactService = new EmergencyContactService();
export default emergencyContactService;
