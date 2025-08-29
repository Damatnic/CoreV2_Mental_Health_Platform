// Safety Plan Service - Mental Health Crisis Management
// TODO: Import from actual safety types when available
// import { SafetyPlan, SafetyPlanItem, CrisisContact, CopingStrategy, SafetyPlanTemplate } from '../types/safety';
// import { User } from '../types/auth';
import { apiClient } from '../utils/apiClient';
// TODO: Import from actual encryption utils when available
// import { encryptSensitiveData, decryptSensitiveData } from '../utils/encryption';
// import { validateSafetyPlan, validateCrisisContact } from '../utils/validation';

// Temporary type definitions until dependencies are available
interface SafetyPlan {
  id: string;
  userId: string;
  [key: string]: any;
}

interface SafetyPlanItem {
  id: string;
  [key: string]: any;
}

interface CrisisContact {
  id: string;
  name: string;
  phone: string;
  [key: string]: any;
}

interface CopingStrategy {
  id: string;
  strategy: string;
  [key: string]: any;
}

interface SafetyPlanTemplate {
  id: string;
  name: string;
  [key: string]: any;
}

interface User {
  id: string;
  [key: string]: any;
}

// Temporary utility functions until dependencies are available
const encryptSensitiveData = (data: any): string => JSON.stringify(data);
const decryptSensitiveData = (encryptedData: string): any => JSON.parse(encryptedData);

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const validateSafetyPlan = (plan: any): ValidationResult => {
  const errors: string[] = [];
  
  // Basic validation for required fields
  if (!plan.userId && !plan.id) {
    errors.push('Plan must have a userId or id');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateCrisisContact = (contact: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!contact.name) {
    errors.push('Contact name is required');
  }
  if (!contact.phone) {
    errors.push('Contact phone is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export interface SafetyPlanServiceConfig {
  apiEndpoint: string;
  encryptionEnabled: boolean;
  autoSave: boolean;
  backupEnabled: boolean;
  emergencyNumbers: string[];
}

export interface SafetyPlanAnalytics {
  planId: string;
  accessCount: number;
  lastAccessed: string;
  itemsUsed: string[];
  effectiveness: number;
  userFeedback?: string;
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  contacts: CrisisContact[];
  resources: string[];
  isActive: boolean;
}

class SafetyPlanService {
  private config: SafetyPlanServiceConfig;
  private cache: Map<string, SafetyPlan> = new Map();
  private templates: SafetyPlanTemplate[] = [];
  private emergencyProtocols: EmergencyProtocol[] = [];

  constructor(config: Partial<SafetyPlanServiceConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/safety-plans',
      encryptionEnabled: true,
      autoSave: true,
      backupEnabled: true,
      emergencyNumbers: ['988', '911', '1-800-273-8255'],
      ...config
    };

    this.initializeEmergencyProtocols();
    this.loadTemplates();
  }

  // Safety Plan CRUD Operations
  async createSafetyPlan(
    userId: string,
    plan: Omit<SafetyPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SafetyPlan> {
    try {
      // Create a full plan object for validation
      const planToValidate = { ...plan, userId };
      const validationResult = validateSafetyPlan(planToValidate);
      if (!validationResult.isValid) {
        throw new Error(`Invalid safety plan: ${validationResult.errors.join(', ')}`);
      }

      // Encrypt sensitive data
      let processedPlan = { ...plan };
      if (this.config.encryptionEnabled) {
        processedPlan = await this.encryptPlanSensitiveData(processedPlan);
      }

      const newPlan: SafetyPlan = {
        ...processedPlan,
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to API
      const response = await apiClient.post<SafetyPlan>(this.config.apiEndpoint, newPlan);
      
      // Cache the plan
      this.cache.set(newPlan.id, response.data || newPlan);

      // Create backup if enabled
      if (this.config.backupEnabled) {
        await this.createPlanBackup(newPlan);
      }

      return response.data || newPlan;
    } catch (error) {
      console.error('Error creating safety plan:', error);
      throw new Error('Failed to create safety plan');
    }
  }

  async getSafetyPlan(userId: string, planId: string): Promise<SafetyPlan | null> {
    try {
      // Check cache first
      if (this.cache.has(planId)) {
        const cachedPlan = this.cache.get(planId)!;
        if (cachedPlan.userId === userId) {
          return await this.decryptPlanSensitiveData(cachedPlan);
        }
      }

      // Fetch from API
      const response = await apiClient.get<SafetyPlan>(`${this.config.apiEndpoint}/${planId}`);
      if (!response.data || response.data.userId !== userId) {
        return null;
      }

      // Cache and decrypt
      this.cache.set(planId, response.data);
      return await this.decryptPlanSensitiveData(response.data);
    } catch (error) {
      console.error('Error fetching safety plan:', error);
      return null;
    }
  }

  async getUserSafetyPlans(userId: string): Promise<SafetyPlan[]> {
    try {
      const response = await apiClient.get<SafetyPlan[]>(
        `${this.config.apiEndpoint}?userId=${userId}`
      );

      const plans = response.data || [];

      // Decrypt and cache plans
      const decryptedPlans = await Promise.all(
        plans.map(async (plan) => {
          this.cache.set(plan.id, plan);
          return await this.decryptPlanSensitiveData(plan);
        })
      );

      return decryptedPlans.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching user safety plans:', error);
      return [];
    }
  }

  async updateSafetyPlan(
    userId: string,
    planId: string,
    updates: Partial<SafetyPlan>
  ): Promise<SafetyPlan> {
    try {
      const existingPlan = await this.getSafetyPlan(userId, planId);
      if (!existingPlan) {
        throw new Error('Safety plan not found');
      }

      const updatedPlan = {
        ...existingPlan,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Validate updated plan
      const validationResult = validateSafetyPlan(updatedPlan);
      if (!validationResult.isValid) {
        throw new Error(`Invalid safety plan update: ${validationResult.errors.join(', ')}`);
      }

      // Encrypt sensitive data
      let processedPlan = updatedPlan;
      if (this.config.encryptionEnabled) {
        processedPlan = await this.encryptPlanSensitiveData(processedPlan);
      }

      // Update via API
      const response = await apiClient.put<SafetyPlan>(
        `${this.config.apiEndpoint}/${planId}`,
        processedPlan
      );

      // Update cache
      this.cache.set(planId, response.data || processedPlan);

      return response.data || updatedPlan;
    } catch (error) {
      console.error('Error updating safety plan:', error);
      throw new Error('Failed to update safety plan');
    }
  }

  async deleteSafetyPlan(userId: string, planId: string): Promise<boolean> {
    try {
      const plan = await this.getSafetyPlan(userId, planId);
      if (!plan) {
        return false;
      }

      await apiClient.delete(`${this.config.apiEndpoint}/${planId}`);
      
      // Remove from cache
      this.cache.delete(planId);

      return true;
    } catch (error) {
      console.error('Error deleting safety plan:', error);
      return false;
    }
  }

  // Crisis Contact Management
  async addCrisisContact(
    userId: string,
    planId: string,
    contact: Omit<CrisisContact, 'id'>
  ): Promise<CrisisContact> {
    try {
      // Validate contact
      const validationResult = validateCrisisContact(contact);
      if (!validationResult.isValid) {
        throw new Error(`Invalid crisis contact: ${validationResult.errors.join(', ')}`);
      }

      const newContact: CrisisContact = {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: contact.name,
        phone: contact.phone,
        ...contact
      };

      const plan = await this.getSafetyPlan(userId, planId);
      if (!plan) {
        throw new Error('Safety plan not found');
      }

      plan.crisisContacts = [...(plan.crisisContacts || []), newContact];
      
      await this.updateSafetyPlan(userId, planId, { crisisContacts: plan.crisisContacts });

      return newContact;
    } catch (error) {
      console.error('Error adding crisis contact:', error);
      throw new Error('Failed to add crisis contact');
    }
  }

  async updateCrisisContact(
    userId: string,
    planId: string,
    contactId: string,
    updates: Partial<CrisisContact>
  ): Promise<CrisisContact> {
    try {
      const plan = await this.getSafetyPlan(userId, planId);
      if (!plan || !plan.crisisContacts) {
        throw new Error('Safety plan or contacts not found');
      }

      const contactIndex = plan.crisisContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) {
        throw new Error('Crisis contact not found');
      }

      const updatedContact = { ...plan.crisisContacts[contactIndex], ...updates };
      
      // Validate updated contact
      const validationResult = validateCrisisContact(updatedContact);
      if (!validationResult.isValid) {
        throw new Error(`Invalid crisis contact: ${validationResult.errors.join(', ')}`);
      }

      plan.crisisContacts[contactIndex] = updatedContact;
      
      await this.updateSafetyPlan(userId, planId, { crisisContacts: plan.crisisContacts });

      return updatedContact;
    } catch (error) {
      console.error('Error updating crisis contact:', error);
      throw new Error('Failed to update crisis contact');
    }
  }

  async removeCrisisContact(
    userId: string,
    planId: string,
    contactId: string
  ): Promise<boolean> {
    try {
      const plan = await this.getSafetyPlan(userId, planId);
      if (!plan || !plan.crisisContacts) {
        return false;
      }

      const filteredContacts = plan.crisisContacts.filter(c => c.id !== contactId);
      
      await this.updateSafetyPlan(userId, planId, { crisisContacts: filteredContacts });

      return true;
    } catch (error) {
      console.error('Error removing crisis contact:', error);
      return false;
    }
  }

  // Coping Strategy Management
  async addCopingStrategy(
    userId: string,
    planId: string,
    strategy: Omit<CopingStrategy, 'id'>
  ): Promise<CopingStrategy> {
    try {
      const newStrategy: CopingStrategy = {
        id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        strategy: strategy.strategy,
        ...strategy
      };

      const plan = await this.getSafetyPlan(userId, planId);
      if (!plan) {
        throw new Error('Safety plan not found');
      }

      plan.copingStrategies = [...(plan.copingStrategies || []), newStrategy];
      
      await this.updateSafetyPlan(userId, planId, { copingStrategies: plan.copingStrategies });

      return newStrategy;
    } catch (error) {
      console.error('Error adding coping strategy:', error);
      throw new Error('Failed to add coping strategy');
    }
  }

  // Emergency Activation
  async activateEmergencyPlan(
    userId: string,
    planId: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<EmergencyProtocol> {
    try {
      const plan = await this.getSafetyPlan(userId, planId);
      if (!plan) {
        throw new Error('Safety plan not found');
      }

      // Select appropriate protocol
      const protocol = this.getEmergencyProtocol(severity);
      
      // Log activation for analytics
      await this.logPlanActivation(userId, planId, severity);

      // Notify emergency contacts if critical
      if (severity === 'critical') {
        await this.notifyEmergencyContacts(plan);
      }

      // Execute protocol steps
      await this.executeProtocolSteps(protocol, plan);

      return protocol;
    } catch (error) {
      console.error('Error activating emergency plan:', error);
      throw new Error('Failed to activate emergency plan');
    }
  }

  // Template Management
  async getTemplates(): Promise<SafetyPlanTemplate[]> {
    return [...this.templates];
  }

  async createPlanFromTemplate(
    userId: string,
    templateId: string,
    customizations?: Partial<SafetyPlan>
  ): Promise<SafetyPlan> {
    try {
      const template = this.templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const planData = {
        ...template.defaultPlan,
        ...customizations,
        name: customizations?.name || `${template.name} - My Plan`
      };

      return await this.createSafetyPlan(userId, planData);
    } catch (error) {
      console.error('Error creating plan from template:', error);
      throw new Error('Failed to create plan from template');
    }
  }

  // Analytics and Insights
  async getPlanAnalytics(userId: string, planId: string): Promise<SafetyPlanAnalytics | null> {
    try {
      const response = await apiClient.get<SafetyPlanAnalytics>(
        `${this.config.apiEndpoint}/${planId}/analytics`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching plan analytics:', error);
      return null;
    }
  }

  async getPlanEffectiveness(userId: string, planId: string): Promise<number> {
    try {
      const analytics = await this.getPlanAnalytics(userId, planId);
      return analytics?.effectiveness || 0;
    } catch (error) {
      console.error('Error getting plan effectiveness:', error);
      return 0;
    }
  }

  // Private helper methods
  private async encryptPlanSensitiveData(plan: any): Promise<any> {
    if (!this.config.encryptionEnabled) return plan;

    const sensitiveFields = ['crisisContacts', 'personalNotes', 'triggerWarnings'];
    const encrypted = { ...plan };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = await encryptSensitiveData(JSON.stringify(encrypted[field]));
      }
    }

    return encrypted;
  }

  private async decryptPlanSensitiveData(plan: SafetyPlan): Promise<SafetyPlan> {
    if (!this.config.encryptionEnabled) return plan;

    const sensitiveFields = ['crisisContacts', 'personalNotes', 'triggerWarnings'];
    const decrypted = { ...plan };

    for (const field of sensitiveFields) {
      if (decrypted[field as keyof SafetyPlan] && typeof decrypted[field as keyof SafetyPlan] === 'string') {
        try {
          const decryptedData = await decryptSensitiveData(decrypted[field as keyof SafetyPlan] as string);
          (decrypted as any)[field] = JSON.parse(decryptedData);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
        }
      }
    }

    return decrypted;
  }

  private async createPlanBackup(plan: SafetyPlan): Promise<void> {
    try {
      await apiClient.post(`${this.config.apiEndpoint}/${plan.id}/backup`, plan);
    } catch (error) {
      console.error('Error creating plan backup:', error);
    }
  }

  private initializeEmergencyProtocols(): void {
    this.emergencyProtocols = [
      {
        id: 'low-severity',
        name: 'Low Severity Protocol',
        priority: 'low',
        steps: [
          'Practice breathing exercises',
          'Review coping strategies',
          'Reach out to support person',
          'Engage in self-care activity'
        ],
        contacts: [],
        resources: ['Breathing exercises', 'Coping strategy list'],
        isActive: true
      },
      {
        id: 'medium-severity',
        name: 'Medium Severity Protocol',
        priority: 'medium',
        steps: [
          'Use grounding techniques',
          'Contact trusted friend or family member',
          'Review safety plan items',
          'Consider professional support'
        ],
        contacts: [],
        resources: ['Grounding techniques', 'Professional contact list'],
        isActive: true
      },
      {
        id: 'high-severity',
        name: 'High Severity Protocol',
        priority: 'high',
        steps: [
          'Implement immediate safety measures',
          'Contact crisis hotline',
          'Reach out to emergency contact',
          'Consider going to safe space'
        ],
        contacts: [],
        resources: ['Crisis hotlines', 'Emergency contacts'],
        isActive: true
      },
      {
        id: 'critical-severity',
        name: 'Critical Emergency Protocol',
        priority: 'critical',
        steps: [
          'Call 911 or emergency services',
          'Notify emergency contact immediately',
          'Go to nearest emergency room',
          'Activate crisis intervention team'
        ],
        contacts: [],
        resources: ['Emergency services', 'Hospital locations'],
        isActive: true
      }
    ];
  }

  private loadTemplates(): void {
    this.templates = [
      {
        id: 'basic-template',
        name: 'Basic Safety Plan',
        description: 'A simple safety plan template for general use',
        category: 'general',
        defaultPlan: {
          name: 'My Safety Plan',
          description: 'Personal safety plan for crisis management',
          warningSignsPersonal: ['Feeling isolated', 'Sleep disturbances', 'Increased anxiety'],
          copingStrategies: [
            { id: '1', name: 'Deep breathing', description: '4-7-8 breathing technique', category: 'breathing', isActive: true },
            { id: '2', name: 'Progressive muscle relaxation', description: 'Tense and relax muscle groups', category: 'relaxation', isActive: true }
          ],
          socialSupport: ['Family member', 'Trusted friend', 'Support group'],
          professionalContacts: [],
          crisisContacts: [],
          safeEnvironment: ['Remove harmful items', 'Go to safe location', 'Stay with trusted person'],
          isActive: true
        }
      }
    ];
  }

  private getEmergencyProtocol(severity: string): EmergencyProtocol {
    const protocol = this.emergencyProtocols.find(p => p.id === `${severity}-severity`);
    return protocol || this.emergencyProtocols[0];
  }

  private async logPlanActivation(userId: string, planId: string, severity: string): Promise<void> {
    try {
      await apiClient.post(`${this.config.apiEndpoint}/${planId}/activations`, {
        userId,
        severity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging plan activation:', error);
    }
  }

  private async notifyEmergencyContacts(plan: SafetyPlan): Promise<void> {
    if (!plan.crisisContacts || plan.crisisContacts.length === 0) {
      return;
    }

    try {
      const notifications = plan.crisisContacts.map(contact => ({
        contactId: contact.id,
        method: contact.preferredContactMethod || 'phone',
        message: 'Emergency safety plan has been activated'
      }));

      await apiClient.post(`${this.config.apiEndpoint}/${plan.id}/notify-contacts`, {
        notifications
      });
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  private async executeProtocolSteps(protocol: EmergencyProtocol, plan: SafetyPlan): Promise<void> {
    // Implementation would depend on specific protocol requirements
    console.log(`Executing protocol: ${protocol.name}`);
    
    // Log each step execution
    for (const step of protocol.steps) {
      console.log(`Step: ${step}`);
      // Here you could integrate with other services to actually execute steps
    }
  }
}

// Export singleton instance
export const safetyPlanService = new SafetyPlanService();
export default safetyPlanService;
