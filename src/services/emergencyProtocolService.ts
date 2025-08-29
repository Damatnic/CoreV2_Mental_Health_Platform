import { EventEmitter } from 'events';

// Types for emergency protocols
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  canReceiveCrisisAlerts: boolean;
  preferredContactMethod: 'phone' | 'text' | 'email';
  notes?: string;
}

export interface EmergencyProtocol {
  id: string;
  userId: string;
  name: string;
  triggerConditions: string[];
  actions: EmergencyAction[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  effectiveness?: number; // 0-1 rating
}

export interface EmergencyAction {
  id: string;
  type: 'contact_person' | 'call_service' | 'send_location' | 'display_resources' | 'escalate_professional';
  description: string;
  parameters: Record<string, any>;
  order: number;
  isAutomatic: boolean;
  requiresConfirmation: boolean;
}

export interface CrisisAlert {
  id: string;
  userId: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'suicidal_ideation' | 'self_harm' | 'panic_attack' | 'substance_abuse' | 'domestic_violence';
  triggers: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  context: {
    timestamp: string;
    source: 'user_trigger' | 'ai_detection' | 'peer_report' | 'scheduled_check';
    severity: number; // 1-10
    confidence: number; // 0-1
  };
  status: 'active' | 'responding' | 'resolved' | 'escalated';
  responseTime?: number;
}

export interface EmergencyResponse {
  id: string;
  alertId: string;
  protocolId?: string;
  responderId: string;
  responderType: 'ai' | 'peer_helper' | 'professional' | 'emergency_services';
  startTime: string;
  endTime?: string;
  actions: string[];
  outcome: 'resolved' | 'escalated' | 'ongoing' | 'no_response';
  notes?: string;
}

export class EmergencyProtocolService extends EventEmitter {
  private protocols: Map<string, EmergencyProtocol> = new Map();
  private activeAlerts: Map<string, CrisisAlert> = new Map();
  private emergencyContacts: Map<string, EmergencyContact[]> = new Map();
  private responses: Map<string, EmergencyResponse[]> = new Map();
  private geolocationWatcher: number | null = null;
  private currentLocation: GeolocationPosition | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing protocols and contacts
      await this.loadUserData();
      
      // Set up geolocation monitoring
      this.setupGeolocationMonitoring();
      
      // Set up emergency services integration
      this.setupEmergencyServices();
      
      this.emit('initialized');
    } catch (error) {
      console.error('EmergencyProtocolService initialization failed:', error);
      this.emit('error', error);
    }
  }

  // Protocol Management
  async createProtocol(data: Omit<EmergencyProtocol, 'id' | 'createdAt'>): Promise<EmergencyProtocol> {
    const protocol: EmergencyProtocol = {
      ...data,
      id: this.generateId('protocol'),
      createdAt: new Date().toISOString()
    };

    this.protocols.set(protocol.id, protocol);
    await this.saveProtocols();
    
    this.emit('protocol_created', protocol);
    return protocol;
  }

  async updateProtocol(protocolId: string, updates: Partial<EmergencyProtocol>): Promise<EmergencyProtocol> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error('Protocol not found');
    }

    const updated = { ...protocol, ...updates };
    this.protocols.set(protocolId, updated);
    await this.saveProtocols();
    
    this.emit('protocol_updated', updated);
    return updated;
  }

  async deleteProtocol(protocolId: string): Promise<void> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error('Protocol not found');
    }

    this.protocols.delete(protocolId);
    await this.saveProtocols();
    
    this.emit('protocol_deleted', protocolId);
  }

  getProtocolsForUser(userId: string): EmergencyProtocol[] {
    return Array.from(this.protocols.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // Emergency Contact Management
  async addEmergencyContact(userId: string, contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    const newContact: EmergencyContact = {
      ...contact,
      id: this.generateId('contact')
    };

    const userContacts = this.emergencyContacts.get(userId) || [];
    
    // Ensure only one primary contact per user
    if (newContact.isPrimary) {
      userContacts.forEach(c => c.isPrimary = false);
    }
    
    userContacts.push(newContact);
    this.emergencyContacts.set(userId, userContacts);
    await this.saveEmergencyContacts();
    
    this.emit('contact_added', { userId, contact: newContact });
    return newContact;
  }

  async updateEmergencyContact(userId: string, contactId: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const userContacts = this.emergencyContacts.get(userId) || [];
    const contactIndex = userContacts.findIndex(c => c.id === contactId);
    
    if (contactIndex === -1) {
      throw new Error('Contact not found');
    }

    const updated = { ...userContacts[contactIndex], ...updates };
    
    // Ensure only one primary contact
    if (updated.isPrimary) {
      userContacts.forEach((c, i) => {
        if (i !== contactIndex) c.isPrimary = false;
      });
    }
    
    userContacts[contactIndex] = updated;
    this.emergencyContacts.set(userId, userContacts);
    await this.saveEmergencyContacts();
    
    this.emit('contact_updated', { userId, contact: updated });
    return updated;
  }

  getEmergencyContacts(userId: string): EmergencyContact[] {
    return this.emergencyContacts.get(userId) || [];
  }

  // Crisis Detection and Alert Management
  async triggerCrisisAlert(alertData: Omit<CrisisAlert, 'id'>): Promise<CrisisAlert> {
    const alert: CrisisAlert = {
      ...alertData,
      id: this.generateId('alert'),
      status: 'active'
    };

    this.activeAlerts.set(alert.id, alert);
    
    // Execute emergency protocols
    await this.executeEmergencyProtocols(alert);
    
    // Log the alert
    await this.logCrisisEvent(alert);
    
    this.emit('crisis_alert_triggered', alert);
    return alert;
  }

  private async executeEmergencyProtocols(alert: CrisisAlert): Promise<void> {
    const userProtocols = this.getProtocolsForUser(alert.userId)
      .filter(p => p.isActive)
      .filter(p => this.protocolMatchesAlert(p, alert));

    for (const protocol of userProtocols) {
      try {
        await this.executeProtocol(protocol, alert);
      } catch (error) {
        console.error(`Failed to execute protocol ${protocol.id}:`, error);
        this.emit('protocol_execution_failed', { protocol, alert, error });
      }
    }
  }

  private protocolMatchesAlert(protocol: EmergencyProtocol, alert: CrisisAlert): boolean {
    // Check if protocol trigger conditions match alert
    return protocol.triggerConditions.some(condition => 
      alert.triggers.includes(condition) || 
      alert.type === condition ||
      (condition === 'any_crisis' && alert.level !== 'low')
    );
  }

  private async executeProtocol(protocol: EmergencyProtocol, alert: CrisisAlert): Promise<void> {
    const response: EmergencyResponse = {
      id: this.generateId('response'),
      alertId: alert.id,
      protocolId: protocol.id,
      responderId: 'system',
      responderType: 'ai',
      startTime: new Date().toISOString(),
      actions: [],
      outcome: 'ongoing'
    };

    // Execute actions in order
    for (const action of protocol.actions.sort((a, b) => a.order - b.order)) {
      try {
        await this.executeAction(action, alert, response);
        response.actions.push(`Executed: ${action.description}`);
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error);
        response.actions.push(`Failed: ${action.description} - ${error}`);
      }
    }

    response.endTime = new Date().toISOString();
    response.outcome = 'resolved'; // This would be determined by action results
    
    // Store response
    const alertResponses = this.responses.get(alert.id) || [];
    alertResponses.push(response);
    this.responses.set(alert.id, alertResponses);
    
    // Update protocol usage
    protocol.lastUsed = new Date().toISOString();
    this.protocols.set(protocol.id, protocol);
    
    this.emit('protocol_executed', { protocol, alert, response });
  }

  private async executeAction(action: EmergencyAction, alert: CrisisAlert, response: EmergencyResponse): Promise<void> {
    switch (action.type) {
      case 'contact_person':
        await this.contactEmergencyPerson(action, alert);
        break;
      
      case 'call_service':
        await this.callEmergencyService(action, alert);
        break;
      
      case 'send_location':
        await this.sendLocationToContacts(action, alert);
        break;
      
      case 'display_resources':
        await this.displayEmergencyResources(action, alert);
        break;
      
      case 'escalate_professional':
        await this.escalateToProfessional(action, alert);
        break;
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async contactEmergencyPerson(action: EmergencyAction, alert: CrisisAlert): Promise<void> {
    const { contactId, message } = action.parameters;
    const userContacts = this.getEmergencyContacts(alert.userId);
    const contact = userContacts.find(c => c.id === contactId);
    
    if (!contact) {
      throw new Error('Emergency contact not found');
    }

    // Send notification based on preferred method
    const alertMessage = message || `Emergency alert for ${contact.name}. Please provide immediate support.`;
    
    switch (contact.preferredContactMethod) {
      case 'phone':
        await this.makeEmergencyCall(contact.phone, alertMessage);
        break;
      case 'text':
        await this.sendEmergencyText(contact.phone, alertMessage);
        break;
      case 'email':
        if (contact.email) {
          await this.sendEmergencyEmail(contact.email, alertMessage);
        }
        break;
    }
    
    this.emit('emergency_contact_notified', { contact, alert });
  }

  private async callEmergencyService(action: EmergencyAction, alert: CrisisAlert): Promise<void> {
    const { serviceType, autoDialer } = action.parameters;
    
    let phoneNumber: string;
    switch (serviceType) {
      case 'suicide_hotline':
        phoneNumber = '988';
        break;
      case 'crisis_text':
        phoneNumber = '741741';
        break;
      case 'emergency_services':
        phoneNumber = '911';
        break;
      default:
        phoneNumber = action.parameters.phoneNumber;
    }

    if (autoDialer && typeof window !== 'undefined') {
      window.location.href = `tel:${phoneNumber}`;
    }
    
    this.emit('emergency_service_called', { serviceType, phoneNumber, alert });
  }

  private async sendLocationToContacts(action: EmergencyAction, alert: CrisisAlert): Promise<void> {
    if (!alert.location && !this.currentLocation) {
      throw new Error('Location not available');
    }

    const location = alert.location || {
      latitude: this.currentLocation!.coords.latitude,
      longitude: this.currentLocation!.coords.longitude,
      accuracy: this.currentLocation!.coords.accuracy
    };

    const userContacts = this.getEmergencyContacts(alert.userId)
      .filter(c => c.canReceiveCrisisAlerts);

    const locationMessage = `Emergency location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;

    for (const contact of userContacts) {
      try {
        await this.sendEmergencyText(contact.phone, locationMessage);
      } catch (error) {
        console.error(`Failed to send location to ${contact.name}:`, error);
      }
    }
    
    this.emit('location_sent_to_contacts', { location, contacts: userContacts, alert });
  }

  private async displayEmergencyResources(action: EmergencyAction, alert: CrisisAlert): Promise<void> {
    const resources = this.getEmergencyResources(alert.type);
    this.emit('display_emergency_resources', { resources, alert });
  }

  private async escalateToProfessional(action: EmergencyAction, alert: CrisisAlert): Promise<void> {
    const { professionalType, urgency } = action.parameters;
    
    // This would integrate with professional services
    this.emit('escalated_to_professional', { 
      professionalType, 
      urgency, 
      alert,
      escalationTime: new Date().toISOString()
    });
  }

  // Emergency Services Integration
  private async makeEmergencyCall(phoneNumber: string, message: string): Promise<void> {
    // In a real implementation, this would integrate with telephony services
    console.log(`Emergency call to ${phoneNumber}: ${message}`);
  }

  private async sendEmergencyText(phoneNumber: string, message: string): Promise<void> {
    // In a real implementation, this would integrate with SMS services
    console.log(`Emergency text to ${phoneNumber}: ${message}`);
  }

  private async sendEmergencyEmail(email: string, message: string): Promise<void> {
    // In a real implementation, this would integrate with email services
    console.log(`Emergency email to ${email}: ${message}`);
  }

  // Geolocation Management
  private setupGeolocationMonitoring(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    this.geolocationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = position;
        this.emit('location_updated', position);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.emit('location_error', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }

  private getEmergencyResources(alertType: CrisisAlert['type']): any[] {
    // Return type-specific emergency resources
    const baseResources = [
      { name: '988 Suicide & Crisis Lifeline', phone: '988', available: '24/7' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' }
    ];

    switch (alertType) {
      case 'domestic_violence':
        return [
          ...baseResources,
          { name: 'National Domestic Violence Hotline', phone: '1-800-799-7233', available: '24/7' }
        ];
      
      case 'substance_abuse':
        return [
          ...baseResources,
          { name: 'SAMHSA National Helpline', phone: '1-800-662-4357', available: '24/7' }
        ];
      
      default:
        return baseResources;
    }
  }

  // Data Persistence
  private async loadUserData(): Promise<void> {
    try {
      const protocolsData = localStorage.getItem('emergency_protocols');
      const contactsData = localStorage.getItem('emergency_contacts');
      
      if (protocolsData) {
        const protocols = JSON.parse(protocolsData);
        protocols.forEach((p: EmergencyProtocol) => this.protocols.set(p.id, p));
      }
      
      if (contactsData) {
        const contacts = JSON.parse(contactsData);
        Object.entries(contacts).forEach(([userId, userContacts]) => {
          this.emergencyContacts.set(userId, userContacts as EmergencyContact[]);
        });
      }
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    }
  }

  private async saveProtocols(): Promise<void> {
    try {
      const protocols = Array.from(this.protocols.values());
      localStorage.setItem('emergency_protocols', JSON.stringify(protocols));
    } catch (error) {
      console.error('Failed to save protocols:', error);
    }
  }

  private async saveEmergencyContacts(): Promise<void> {
    try {
      const contacts = Object.fromEntries(this.emergencyContacts);
      localStorage.setItem('emergency_contacts', JSON.stringify(contacts));
    } catch (error) {
      console.error('Failed to save emergency contacts:', error);
    }
  }

  private setupEmergencyServices(): void {
    // Set up integration with emergency services APIs
    // This would include webhooks, service integrations, etc.
  }

  private async logCrisisEvent(alert: CrisisAlert): Promise<void> {
    // Log crisis events for analysis and improvement
    console.log('Crisis event logged:', alert.id);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters
  getActiveAlerts(): CrisisAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getCurrentLocation(): GeolocationPosition | null {
    return this.currentLocation;
  }

  // Cleanup
  destroy(): void {
    if (this.geolocationWatcher) {
      navigator.geolocation.clearWatch(this.geolocationWatcher);
    }
    
    this.removeAllListeners();
    this.protocols.clear();
    this.activeAlerts.clear();
    this.emergencyContacts.clear();
    this.responses.clear();
  }
}

export default new EmergencyProtocolService();
