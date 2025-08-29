import { EventEmitter } from 'events';

// Types for crisis service
export interface CrisisEvent {
  id: string;
  userId: string;
  type: 'detection' | 'panic_button' | 'emergency_contact' | 'self_report' | 'escalation';
  severity: 'low' | 'moderate' | 'high' | 'critical' | 'imminent';
  status: 'active' | 'responding' | 'resolved' | 'false_alarm';
  triggerContent?: string;
  triggerSource: 'chat' | 'mood_entry' | 'panic_button' | 'ai_detection' | 'user_report';
  location?: GeolocationCoordinates;
  timestamp: Date;
  metadata: CrisisMetadata;
}

export interface CrisisMetadata {
  confidence: number; // 0-1 scale
  riskFactors: string[];
  protectiveFactors: string[];
  aiAnalysis?: AIAnalysisResult;
  interventionsTriggered: string[];
  emergencyContactsNotified: string[];
  resourcesProvided: string[];
  followUpRequired: boolean;
  resolutionTime?: number; // minutes
  professionalInvolved?: boolean;
}

export interface AIAnalysisResult {
  model: string;
  confidence: number;
  keywords: string[];
  sentiment: 'extremely_negative' | 'negative' | 'neutral' | 'positive';
  urgency: 'immediate' | 'urgent' | 'moderate' | 'low';
  recommendations: string[];
}

export interface CrisisResource {
  id: string;
  type: 'hotline' | 'text_line' | 'chat' | 'emergency_services' | 'local_service' | 'online_resource';
  name: string;
  description: string;
  contactInfo: {
    phone?: string;
    text?: string;
    url?: string;
    email?: string;
  };
  availability: '24/7' | 'business_hours' | 'specific_times';
  location?: string;
  languages: string[];
  specializations: string[];
  isEmergency: boolean;
  responseTime: 'immediate' | 'minutes' | 'hours';
}

export interface SafetyPlan {
  id: string;
  userId: string;
  personalWarningSignals: string[];
  copingStrategies: string[];
  socialSupports: EmergencyContact[];
  professionalContacts: ProfessionalContact[];
  environmentSafety: string[];
  reasonsToLive: string[];
  lastUpdated: Date;
  isActive: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  canReceiveCrisisAlerts: boolean;
  preferredContactMethod: 'phone' | 'text' | 'email';
  availability: string;
  notes?: string;
}

export interface ProfessionalContact {
  id: string;
  name: string;
  title: string;
  practice?: string;
  phone: string;
  email?: string;
  specialty: string;
  isEmergencyContact: boolean;
  officeHours: string;
  emergencyProtocol?: string;
}

export interface CrisisIntervention {
  id: string;
  crisisId: string;
  type: 'automated' | 'human' | 'emergency_services' | 'hotline_referral';
  description: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  responder?: {
    id: string;
    name: string;
    role: 'ai' | 'counselor' | 'therapist' | 'emergency_responder' | 'peer_supporter';
  };
  startTime: Date;
  endTime?: Date;
  outcome?: 'resolved' | 'escalated' | 'referred' | 'ongoing';
  notes?: string;
}

export interface CrisisServiceConfig {
  apiBaseUrl: string;
  emergencyServicesNumber: string;
  crisisHotlineNumber: string;
  enableLocationServices: boolean;
  enableEmergencyContacts: boolean;
  autoEscalationTime: number; // minutes
  aiDetectionThreshold: number; // 0-1 scale
  enableRealTimeMonitoring: boolean;
  emergencyKeywords: string[];
  safetyPlanRequired: boolean;
}

// Default configuration
const DEFAULT_CONFIG: CrisisServiceConfig = {
  apiBaseUrl: process.env.VITE_API_URL || '/api',
  emergencyServicesNumber: '911',
  crisisHotlineNumber: '988',
  enableLocationServices: true,
  enableEmergencyContacts: true,
  autoEscalationTime: 15,
  aiDetectionThreshold: 0.8,
  enableRealTimeMonitoring: true,
  emergencyKeywords: [
    'suicide', 'kill myself', 'end it all', 'want to die', 'better off dead',
    'hurt myself', 'cut myself', 'overdose', 'pills', 'jump', 'hang myself',
    'gun', 'knife', 'bridge', 'can\'t go on', 'no hope', 'worthless', 'burden'
  ],
  safetyPlanRequired: false
};

// Crisis resources database
const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'nspl',
    type: 'hotline',
    name: 'National Suicide Prevention Lifeline',
    description: '24/7 free and confidential support for people in distress',
    contactInfo: { phone: '988' },
    availability: '24/7',
    languages: ['en', 'es'],
    specializations: ['suicide_prevention', 'crisis_support'],
    isEmergency: true,
    responseTime: 'immediate'
  },
  {
    id: 'crisis-text',
    type: 'text_line',
    name: 'Crisis Text Line',
    description: 'Free 24/7 support via text message',
    contactInfo: { text: '741741' },
    availability: '24/7',
    languages: ['en', 'es'],
    specializations: ['crisis_support', 'text_support'],
    isEmergency: false,
    responseTime: 'minutes'
  },
  {
    id: 'emergency-services',
    type: 'emergency_services',
    name: 'Emergency Services',
    description: 'Immediate emergency response',
    contactInfo: { phone: '911' },
    availability: '24/7',
    languages: ['en'],
    specializations: ['emergency_response', 'medical_emergency'],
    isEmergency: true,
    responseTime: 'immediate'
  }
];

/**
 * Crisis Service
 * Handles crisis detection, intervention, and emergency response
 */
export class CrisisService extends EventEmitter {
  private config: CrisisServiceConfig;
  private activeCrises: Map<string, CrisisEvent> = new Map();
  private interventions: Map<string, CrisisIntervention[]> = new Map();
  private monitoringTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<CrisisServiceConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeMonitoring();
  }

  /**
   * Report a crisis event
   */
  async reportCrisis(crisisData: Partial<CrisisEvent>): Promise<CrisisEvent> {
    try {
      const crisis: CrisisEvent = {
        id: this.generateId(),
        userId: crisisData.userId || 'anonymous',
        type: crisisData.type || 'self_report',
        severity: crisisData.severity || 'moderate',
        status: 'active',
        triggerContent: crisisData.triggerContent,
        triggerSource: crisisData.triggerSource || 'user_report',
        location: await this.getCurrentLocation(),
        timestamp: new Date(),
        metadata: {
          confidence: 1.0, // Self-reported crises have full confidence
          riskFactors: crisisData.metadata?.riskFactors || [],
          protectiveFactors: crisisData.metadata?.protectiveFactors || [],
          interventionsTriggered: [],
          emergencyContactsNotified: [],
          resourcesProvided: [],
          followUpRequired: true,
          ...crisisData.metadata
        }
      };

      // Store crisis
      this.activeCrises.set(crisis.id, crisis);

      // Save to server
      try {
        const response = await this.makeRequest('/crisis-events', {
          method: 'POST',
          body: JSON.stringify(crisis)
        });

        if (!response.ok) {
          console.warn('Failed to save crisis event to server');
        }
      } catch (error) {
        console.warn('Crisis event will be saved locally:', error);
      }

      // Trigger immediate response
      await this.triggerCrisisResponse(crisis);

      this.emit('crisis:reported', crisis);
      return crisis;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Detect potential crisis in content
   */
  async detectCrisis(
    content: string,
    userId: string,
    context: {
      source: CrisisEvent['triggerSource'];
      metadata?: Partial<CrisisMetadata>;
    }
  ): Promise<{
    isCrisis: boolean;
    confidence: number;
    severity?: CrisisEvent['severity'];
    crisis?: CrisisEvent;
  }> {
    try {
      // Keyword-based detection
      const keywordAnalysis = this.analyzeKeywords(content);
      
      // AI-based analysis (if available)
      let aiAnalysis: AIAnalysisResult | undefined;
      try {
        aiAnalysis = await this.performAIAnalysis(content);
      } catch (error) {
        console.warn('AI analysis unavailable, using keyword detection');
      }

      // Combine analyses
      const combinedConfidence = Math.max(
        keywordAnalysis.confidence,
        aiAnalysis?.confidence || 0
      );

      const isCrisis = combinedConfidence >= this.config.aiDetectionThreshold;

      if (isCrisis) {
        // Determine severity
        const severity = this.determineSeverity(combinedConfidence, keywordAnalysis, aiAnalysis);

        // Create crisis event
        const crisis = await this.reportCrisis({
          userId,
          type: 'detection',
          severity,
          triggerContent: content,
          triggerSource: context.source,
          metadata: {
            confidence: combinedConfidence,
            riskFactors: [...keywordAnalysis.riskFactors, ...(aiAnalysis?.keywords || [])],
            aiAnalysis,
            ...context.metadata
          }
        });

        return {
          isCrisis: true,
          confidence: combinedConfidence,
          severity,
          crisis
        };
      }

      return {
        isCrisis: false,
        confidence: combinedConfidence
      };
    } catch (error) {
      this.emit('error', error);
      return {
        isCrisis: false,
        confidence: 0
      };
    }
  }

  /**
   * Activate panic button
   */
  async activatePanicButton(userId: string, location?: GeolocationCoordinates): Promise<CrisisEvent> {
    return this.reportCrisis({
      userId,
      type: 'panic_button',
      severity: 'critical',
      triggerSource: 'panic_button',
      location,
      metadata: {
        confidence: 1.0,
        riskFactors: ['panic_button_activated'],
        protectiveFactors: [],
        interventionsTriggered: [],
        emergencyContactsNotified: [],
        resourcesProvided: [],
        followUpRequired: true
      }
    });
  }

  /**
   * Get crisis event by ID
   */
  async getCrisisEvent(crisisId: string): Promise<CrisisEvent | null> {
    // Check local cache first
    const localCrisis = this.activeCrises.get(crisisId);
    if (localCrisis) {
      return localCrisis;
    }

    // Fetch from server
    try {
      const response = await this.makeRequest(`/crisis-events/${crisisId}`);
      if (response.ok) {
        const crisis = await response.json();
        return {
          ...crisis,
          timestamp: new Date(crisis.timestamp)
        };
      }
    } catch (error) {
      console.warn('Failed to fetch crisis event:', error);
    }

    return null;
  }

  /**
   * Get user's crisis history
   */
  async getUserCrisisHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: CrisisEvent['status'];
      severity?: CrisisEvent['severity'];
    } = {}
  ): Promise<CrisisEvent[]> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset) params.set('offset', options.offset.toString());
      if (options.status) params.set('status', options.status);
      if (options.severity) params.set('severity', options.severity);

      const response = await this.makeRequest(`/crisis-events/user/${userId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch crisis history');
      }

      const events: CrisisEvent[] = await response.json();
      return events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }

  /**
   * Create or update safety plan
   */
  async createSafetyPlan(safetyPlan: Partial<SafetyPlan>): Promise<SafetyPlan> {
    try {
      const plan: SafetyPlan = {
        id: safetyPlan.id || this.generateId(),
        userId: safetyPlan.userId || 'anonymous',
        personalWarningSignals: safetyPlan.personalWarningSignals || [],
        copingStrategies: safetyPlan.copingStrategies || [],
        socialSupports: safetyPlan.socialSupports || [],
        professionalContacts: safetyPlan.professionalContacts || [],
        environmentSafety: safetyPlan.environmentSafety || [],
        reasonsToLive: safetyPlan.reasonsToLive || [],
        lastUpdated: new Date(),
        isActive: safetyPlan.isActive !== false
      };

      const response = await this.makeRequest('/safety-plans', {
        method: 'POST',
        body: JSON.stringify(plan)
      });

      if (!response.ok) {
        throw new Error('Failed to save safety plan');
      }

      const savedPlan = await response.json();
      this.emit('safety-plan:created', savedPlan);
      
      return savedPlan;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get user's safety plan
   */
  async getSafetyPlan(userId: string): Promise<SafetyPlan | null> {
    try {
      const response = await this.makeRequest(`/safety-plans/user/${userId}`);
      
      if (!response.ok) {
        return null;
      }

      const plan = await response.json();
      return {
        ...plan,
        lastUpdated: new Date(plan.lastUpdated)
      };
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Get crisis resources
   */
  getCrisisResources(filters: {
    type?: CrisisResource['type'];
    location?: string;
    language?: string;
    emergency?: boolean;
  } = {}): CrisisResource[] {
    let resources = [...CRISIS_RESOURCES];

    if (filters.type) {
      resources = resources.filter(r => r.type === filters.type);
    }

    if (filters.language) {
      resources = resources.filter(r => r.languages.includes(filters.language));
    }

    if (filters.emergency !== undefined) {
      resources = resources.filter(r => r.isEmergency === filters.emergency);
    }

    if (filters.location) {
      // Filter by location - would integrate with location service
      resources = resources.filter(r => !r.location || r.location === filters.location);
    }

    return resources.sort((a, b) => {
      // Emergency resources first
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      
      // Then by response time
      const responseOrder = ['immediate', 'minutes', 'hours'];
      return responseOrder.indexOf(a.responseTime) - responseOrder.indexOf(b.responseTime);
    });
  }

  /**
   * Update crisis status
   */
  async updateCrisisStatus(crisisId: string, status: CrisisEvent['status']): Promise<CrisisEvent> {
    try {
      const crisis = this.activeCrises.get(crisisId);
      if (!crisis) {
        throw new Error('Crisis event not found');
      }

      crisis.status = status;
      
      if (status === 'resolved') {
        crisis.metadata.resolutionTime = Math.floor(
          (Date.now() - crisis.timestamp.getTime()) / 1000 / 60
        );
        
        // Remove from active monitoring
        this.activeCrises.delete(crisisId);
        const timer = this.monitoringTimers.get(crisisId);
        if (timer) {
          clearTimeout(timer);
          this.monitoringTimers.delete(crisisId);
        }
      }

      // Update on server
      const response = await this.makeRequest(`/crisis-events/${crisisId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        console.warn('Failed to update crisis status on server');
      }

      this.emit('crisis:status-updated', crisis);
      return crisis;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add intervention to crisis
   */
  async addIntervention(intervention: Partial<CrisisIntervention>): Promise<CrisisIntervention> {
    try {
      const newIntervention: CrisisIntervention = {
        id: this.generateId(),
        crisisId: intervention.crisisId || '',
        type: intervention.type || 'automated',
        description: intervention.description || '',
        status: 'initiated',
        startTime: new Date(),
        ...intervention
      };

      // Store locally
      const crisisInterventions = this.interventions.get(newIntervention.crisisId) || [];
      crisisInterventions.push(newIntervention);
      this.interventions.set(newIntervention.crisisId, crisisInterventions);

      // Save to server
      try {
        const response = await this.makeRequest('/crisis-interventions', {
          method: 'POST',
          body: JSON.stringify(newIntervention)
        });

        if (!response.ok) {
          console.warn('Failed to save intervention to server');
        }
      } catch (error) {
        console.warn('Intervention will be saved locally:', error);
      }

      this.emit('intervention:added', newIntervention);
      return newIntervention;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Private methods
  private async triggerCrisisResponse(crisis: CrisisEvent): Promise<void> {
    try {
      // Immediate interventions based on severity
      switch (crisis.severity) {
        case 'imminent':
        case 'critical':
          await this.triggerEmergencyProtocol(crisis);
          break;
        case 'high':
          await this.triggerHighRiskProtocol(crisis);
          break;
        case 'moderate':
          await this.triggerModerateRiskProtocol(crisis);
          break;
        case 'low':
          await this.triggerLowRiskProtocol(crisis);
          break;
      }

      // Start monitoring
      this.startCrisisMonitoring(crisis);

      // Provide immediate resources
      await this.provideImmediateResources(crisis);
    } catch (error) {
      console.error('Failed to trigger crisis response:', error);
      this.emit('crisis-response:failed', { crisis, error });
    }
  }

  private async triggerEmergencyProtocol(crisis: CrisisEvent): Promise<void> {
    // Add emergency intervention
    await this.addIntervention({
      crisisId: crisis.id,
      type: 'emergency_services',
      description: 'Emergency protocol activated - immediate intervention required',
      responder: {
        id: 'system',
        name: 'Emergency System',
        role: 'emergency_responder'
      }
    });

    // Notify emergency contacts
    if (this.config.enableEmergencyContacts) {
      this.notifyEmergencyContacts(crisis);
    }

    // Share location if available and enabled
    if (crisis.location && this.config.enableLocationServices) {
      this.shareLocationWithEmergencyServices(crisis);
    }

    crisis.metadata.interventionsTriggered.push('emergency_protocol');
  }

  private async triggerHighRiskProtocol(crisis: CrisisEvent): Promise<void> {
    await this.addIntervention({
      crisisId: crisis.id,
      type: 'hotline_referral',
      description: 'High risk detected - crisis hotline referral provided',
      responder: {
        id: 'system',
        name: 'Crisis Detection System',
        role: 'ai'
      }
    });

    crisis.metadata.interventionsTriggered.push('high_risk_protocol');
    crisis.metadata.resourcesProvided.push('crisis_hotline');
  }

  private async triggerModerateRiskProtocol(crisis: CrisisEvent): Promise<void> {
    await this.addIntervention({
      crisisId: crisis.id,
      type: 'automated',
      description: 'Moderate risk detected - coping resources provided',
      responder: {
        id: 'system',
        name: 'Support System',
        role: 'ai'
      }
    });

    crisis.metadata.interventionsTriggered.push('moderate_risk_protocol');
    crisis.metadata.resourcesProvided.push('coping_resources');
  }

  private async triggerLowRiskProtocol(crisis: CrisisEvent): Promise<void> {
    await this.addIntervention({
      crisisId: crisis.id,
      type: 'automated',
      description: 'Low risk detected - wellness resources provided',
      responder: {
        id: 'system',
        name: 'Wellness System',
        role: 'ai'
      }
    });

    crisis.metadata.interventionsTriggered.push('low_risk_protocol');
    crisis.metadata.resourcesProvided.push('wellness_resources');
  }

  private startCrisisMonitoring(crisis: CrisisEvent): void {
    // Auto-escalation timer for active crises
    if (crisis.severity === 'high' || crisis.severity === 'critical') {
      const timer = setTimeout(() => {
        this.escalateCrisis(crisis.id);
      }, this.config.autoEscalationTime * 60 * 1000);
      
      this.monitoringTimers.set(crisis.id, timer);
    }
  }

  private async escalateCrisis(crisisId: string): Promise<void> {
    const crisis = this.activeCrises.get(crisisId);
    if (!crisis || crisis.status !== 'active') {
      return;
    }

    // Escalate severity if still active
    const severityLevels: CrisisEvent['severity'][] = ['low', 'moderate', 'high', 'critical', 'imminent'];
    const currentIndex = severityLevels.indexOf(crisis.severity);
    
    if (currentIndex < severityLevels.length - 1) {
      crisis.severity = severityLevels[currentIndex + 1];
      crisis.metadata.interventionsTriggered.push('auto_escalated');
      
      await this.triggerCrisisResponse(crisis);
      this.emit('crisis:escalated', crisis);
    }
  }

  private async notifyEmergencyContacts(crisis: CrisisEvent): Promise<void> {
    // This would integrate with notification service
    crisis.metadata.emergencyContactsNotified.push('emergency_contacts_notified');
  }

  private async shareLocationWithEmergencyServices(crisis: CrisisEvent): Promise<void> {
    // This would integrate with emergency services API
    crisis.metadata.interventionsTriggered.push('location_shared_emergency');
  }

  private async provideImmediateResources(crisis: CrisisEvent): Promise<void> {
    // Get appropriate resources based on crisis severity and type
    const resources = this.getCrisisResources({
      emergency: crisis.severity === 'critical' || crisis.severity === 'imminent'
    });

    crisis.metadata.resourcesProvided.push(
      ...resources.slice(0, 3).map(r => r.id)
    );
  }

  private analyzeKeywords(content: string): {
    confidence: number;
    riskFactors: string[];
  } {
    const lowerContent = content.toLowerCase();
    const foundKeywords = this.config.emergencyKeywords.filter(keyword =>
      lowerContent.includes(keyword)
    );

    const confidence = Math.min(foundKeywords.length * 0.3, 1.0);
    
    return {
      confidence,
      riskFactors: foundKeywords
    };
  }

  private async performAIAnalysis(content: string): Promise<AIAnalysisResult> {
    // This would integrate with AI service
    // For now, return mock analysis
    return {
      model: 'crisis-detection-v1',
      confidence: 0.5,
      keywords: [],
      sentiment: 'negative',
      urgency: 'moderate',
      recommendations: ['monitor', 'provide_resources']
    };
  }

  private determineSeverity(
    confidence: number,
    keywordAnalysis: any,
    aiAnalysis?: AIAnalysisResult
  ): CrisisEvent['severity'] {
    if (confidence >= 0.95) return 'imminent';
    if (confidence >= 0.85) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'moderate';
    return 'low';
  }

  private async getCurrentLocation(): Promise<GeolocationCoordinates | undefined> {
    if (!this.config.enableLocationServices) return undefined;

    return new Promise((resolve) => {
      navigator.geolocation?.getCurrentPosition(
        (position) => resolve(position.coords),
        () => resolve(undefined),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  private generateId(): string {
    return `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring(): void {
    // Set up periodic check for stale active crises
    setInterval(() => {
      this.checkStaleCrises();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private checkStaleCrises(): void {
    const staleCutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
    
    for (const [crisisId, crisis] of this.activeCrises.entries()) {
      if (crisis.timestamp.getTime() < staleCutoff && crisis.status === 'active') {
        this.escalateCrisis(crisisId);
      }
    }
  }

  /**
   * Get active crises count
   */
  getActiveCrisesCount(): number {
    return this.activeCrises.size;
  }

  /**
   * Get crisis statistics
   */
  getCrisisStats(): {
    active: number;
    totalInterventions: number;
    averageResolutionTime: number;
  } {
    const interventionCount = Array.from(this.interventions.values())
      .reduce((total, interventions) => total + interventions.length, 0);

    return {
      active: this.activeCrises.size,
      totalInterventions: interventionCount,
      averageResolutionTime: 0 // Would calculate from resolved crises
    };
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    // Clear all timers
    for (const timer of this.monitoringTimers.values()) {
      clearTimeout(timer);
    }
    
    this.monitoringTimers.clear();
    this.activeCrises.clear();
    this.interventions.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const crisisService = new CrisisService();
export default crisisService;
