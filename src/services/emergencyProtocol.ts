// Emergency protocol service for crisis management
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: 'family' | 'friend' | 'therapist' | 'doctor' | 'other';
  phone: string;
  email?: string;
  isEmergencyContact: boolean;
  canReceiveAlerts: boolean;
  notes?: string;
}

export interface SafetyPlan {
  id: string;
  userId: string;
  warningSignsAndTriggers: string[];
  copingStrategies: string[];
  socialSupports: string[];
  professionalContacts: EmergencyContact[];
  environmentalSafety: string[];
  emergencyContacts: EmergencyContact[];
  customNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrisisEvent {
  id: string;
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger?: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  actionsPerformed: string[];
  followUpRequired: boolean;
}

export interface EmergencyProtocolConfig {
  crisisHotlines: Array<{
    name: string;
    number: string;
    textNumber?: string;
    available: string;
    description: string;
  }>;
  emergencyServices: {
    police: string;
    ambulance: string;
    fire: string;
  };
  mentalHealthResources: Array<{
    name: string;
    type: 'hotline' | 'chat' | 'text' | 'website';
    contact: string;
    description: string;
    available: string;
  }>;
}

class EmergencyProtocolService {
  private config: EmergencyProtocolConfig;
  private safetyPlans: Map<string, SafetyPlan> = new Map();
  private crisisEvents: CrisisEvent[] = [];

  constructor() {
    this.config = {
      crisisHotlines: [
        {
          name: '988 Suicide & Crisis Lifeline',
          number: '988',
          textNumber: '741741',
          available: '24/7',
          description: 'Free and confidential emotional support'
        },
        {
          name: 'Crisis Text Line',
          number: '',
          textNumber: '741741',
          available: '24/7',
          description: 'Text HOME to connect with a crisis counselor'
        },
        {
          name: 'SAMHSA National Helpline',
          number: '1-800-662-4357',
          available: '24/7',
          description: 'Treatment referral and information service'
        }
      ],
      emergencyServices: {
        police: '911',
        ambulance: '911',
        fire: '911'
      },
      mentalHealthResources: [
        {
          name: 'National Institute of Mental Health',
          type: 'website',
          contact: 'https://www.nimh.nih.gov/health/find-help',
          description: 'Mental health information and resources',
          available: 'Always'
        },
        {
          name: 'Mental Health America',
          type: 'website',
          contact: 'https://www.mhanational.org/finding-help',
          description: 'Mental health screening and resources',
          available: 'Always'
        }
      ]
    };
  }

  // Safety Plan Management
  async createSafetyPlan(data: Omit<SafetyPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SafetyPlan> {
    const safetyPlan: SafetyPlan = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.safetyPlans.set(safetyPlan.userId, safetyPlan);
    await this.persistSafetyPlan(safetyPlan);
    
    return safetyPlan;
  }

  async updateSafetyPlan(userId: string, updates: Partial<SafetyPlan>): Promise<SafetyPlan | null> {
    const existing = this.safetyPlans.get(userId);
    if (!existing) return null;

    const updated: SafetyPlan = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.safetyPlans.set(userId, updated);
    await this.persistSafetyPlan(updated);
    
    return updated;
  }

  getSafetyPlan(userId: string): SafetyPlan | null {
    return this.safetyPlans.get(userId) || null;
  }

  // Crisis Event Management
  async recordCrisisEvent(data: Omit<CrisisEvent, 'id' | 'timestamp' | 'resolved' | 'actionsPerformed' | 'followUpRequired'>): Promise<CrisisEvent> {
    const crisisEvent: CrisisEvent = {
      ...data,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      resolved: false,
      actionsPerformed: [],
      followUpRequired: true
    };

    this.crisisEvents.push(crisisEvent);
    await this.handleCrisisEvent(crisisEvent);
    
    return crisisEvent;
  }

  async resolveCrisisEvent(eventId: string, actions: string[]): Promise<boolean> {
    const eventIndex = this.crisisEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return false;

    this.crisisEvents[eventIndex] = {
      ...this.crisisEvents[eventIndex],
      resolved: true,
      resolvedAt: new Date().toISOString(),
      actionsPerformed: actions,
      followUpRequired: this.shouldRequireFollowUp(this.crisisEvents[eventIndex])
    };

    return true;
  }

  getCrisisEvents(userId: string, limit = 10): CrisisEvent[] {
    return this.crisisEvents
      .filter(event => event.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Emergency Contact Management
  validateEmergencyContact(contact: Partial<EmergencyContact>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contact.name?.trim()) {
      errors.push('Contact name is required');
    }

    if (!contact.phone?.trim()) {
      errors.push('Phone number is required');
    } else if (!this.isValidPhoneNumber(contact.phone)) {
      errors.push('Invalid phone number format');
    }

    if (contact.email && !this.isValidEmail(contact.email)) {
      errors.push('Invalid email format');
    }

    return { valid: errors.length === 0, errors };
  }

  // Crisis Response Protocols
  async executeCrisisProtocol(severity: CrisisEvent['severity'], userId: string): Promise<string[]> {
    const actions: string[] = [];
    const safetyPlan = this.getSafetyPlan(userId);

    switch (severity) {
      case 'critical':
        actions.push('Immediate professional intervention required');
        actions.push('Contact emergency services if in immediate danger');
        actions.push('Activate all emergency contacts');
        if (safetyPlan) {
          actions.push('Review safety plan with user');
        }
        break;

      case 'high':
        actions.push('Contact crisis hotline recommended');
        actions.push('Notify primary emergency contact');
        actions.push('Schedule immediate professional appointment');
        if (safetyPlan) {
          actions.push('Review coping strategies from safety plan');
        }
        break;

      case 'medium':
        actions.push('Offer crisis resources');
        actions.push('Suggest contacting trusted support person');
        actions.push('Review coping strategies');
        break;

      case 'low':
        actions.push('Provide emotional support resources');
        actions.push('Suggest self-care activities');
        actions.push('Monitor for escalation');
        break;
    }

    return actions;
  }

  // Resource Access
  getCrisisResources(): EmergencyProtocolConfig['crisisHotlines'] {
    return this.config.crisisHotlines;
  }

  getEmergencyServices(): EmergencyProtocolConfig['emergencyServices'] {
    return this.config.emergencyServices;
  }

  getMentalHealthResources(): EmergencyProtocolConfig['mentalHealthResources'] {
    return this.config.mentalHealthResources;
  }

  // Quick Actions
  async callCrisisHotline(hotlineId?: string): Promise<boolean> {
    const hotline = hotlineId 
      ? this.config.crisisHotlines.find(h => h.name.includes(hotlineId))
      : this.config.crisisHotlines[0]; // Default to 988

    if (!hotline) return false;

    try {
      // In a real app, this would integrate with telephony services
      if (typeof window !== 'undefined' && hotline.number) {
        window.location.href = `tel:${hotline.number}`;
        return true;
      }
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }

    return false;
  }

  async sendCrisisText(message = 'HOME'): Promise<boolean> {
    try {
      // In a real app, this would integrate with SMS services
      if (typeof window !== 'undefined') {
        window.location.href = `sms:741741?body=${encodeURIComponent(message)}`;
        return true;
      }
    } catch (error) {
      console.error('Failed to send crisis text:', error);
    }

    return false;
  }

  // Risk Assessment
  assessRiskLevel(indicators: {
    suicidalIdeation: boolean;
    selfHarmBehavior: boolean;
    substanceAbuse: boolean;
    socialIsolation: boolean;
    recentLoss: boolean;
    previousAttempts: boolean;
    impulsivity: boolean;
    hopelessness: boolean;
  }): { level: CrisisEvent['severity']; reasoning: string[] } {
    let score = 0;
    const reasoning: string[] = [];

    if (indicators.suicidalIdeation) {
      score += 4;
      reasoning.push('Suicidal ideation present');
    }

    if (indicators.selfHarmBehavior) {
      score += 3;
      reasoning.push('Self-harm behavior reported');
    }

    if (indicators.previousAttempts) {
      score += 3;
      reasoning.push('History of previous attempts');
    }

    if (indicators.substanceAbuse) {
      score += 2;
      reasoning.push('Substance abuse present');
    }

    if (indicators.impulsivity) {
      score += 2;
      reasoning.push('High impulsivity indicators');
    }

    if (indicators.hopelessness) {
      score += 2;
      reasoning.push('Feelings of hopelessness');
    }

    if (indicators.socialIsolation) {
      score += 1;
      reasoning.push('Social isolation present');
    }

    if (indicators.recentLoss) {
      score += 1;
      reasoning.push('Recent significant loss');
    }

    let level: CrisisEvent['severity'];
    if (score >= 8) {
      level = 'critical';
    } else if (score >= 5) {
      level = 'high';
    } else if (score >= 3) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, reasoning };
  }

  // Utility Methods
  private async handleCrisisEvent(event: CrisisEvent): Promise<void> {
    // Execute appropriate protocol based on severity
    const actions = await this.executeCrisisProtocol(event.severity, event.userId);
    
    // Log the event
    console.log(`Crisis event recorded: ${event.id}`, {
      severity: event.severity,
      actions
    });

    // In a real implementation, this would:
    // - Send notifications to emergency contacts
    // - Log to secure crisis management system
    // - Trigger appropriate escalation procedures
  }

  private shouldRequireFollowUp(event: CrisisEvent): boolean {
    return event.severity === 'critical' || event.severity === 'high';
  }

  private async persistSafetyPlan(plan: SafetyPlan): Promise<void> {
    try {
      // In a real implementation, this would save to a secure database
      localStorage.setItem(`safety_plan_${plan.userId}`, JSON.stringify(plan));
    } catch (error) {
      console.error('Failed to persist safety plan:', error);
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateId(): string {
    return `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Safety Plan Template
  getDefaultSafetyPlanTemplate(): Omit<SafetyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    return {
      warningSignsAndTriggers: [
        'Feeling overwhelmed',
        'Thoughts of hopelessness',
        'Social isolation',
        'Sleep disturbances'
      ],
      copingStrategies: [
        'Deep breathing exercises',
        'Call a trusted friend',
        'Go for a walk',
        'Listen to calming music',
        'Practice mindfulness'
      ],
      socialSupports: [
        'Family members',
        'Close friends',
        'Support group members',
        'Religious/spiritual community'
      ],
      professionalContacts: [],
      environmentalSafety: [
        'Remove or secure potentially harmful items',
        'Stay in safe, supervised environments',
        'Avoid substances that impair judgment'
      ],
      emergencyContacts: [],
      customNotes: 'Remember: This crisis will pass. You have survived difficult times before and you can get through this too.'
    };
  }
}

export default new EmergencyProtocolService();
