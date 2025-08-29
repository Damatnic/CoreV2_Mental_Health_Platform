/**
 * Safety Plan API Service
 */

interface SafetyPlan {
  id: string;
  userId: string;
  warningSignals: string[];
  copingStrategies: string[];
  socialSupports: Array<{
    name: string;
    relationship: string;
    phone?: string;
    email?: string;
    notes?: string;
  }>;
  professionalSupports: Array<{
    name: string;
    role: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  }>;
  environmentSafety: {
    itemsToRemove: string[];
    safeEnvironmentSteps: string[];
    safeLocations: string[];
  };
  reasonsToLive: string[];
  emergencyContacts: Array<{
    name: string;
    phone: string;
    type: 'personal' | 'professional' | 'crisis';
  }>;
  crisisActionPlan: {
    immediateSteps: string[];
    whoToCall: string[];
    whereToGo: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  version: number;
}

interface SafetyPlanTemplate {
  id: string;
  name: string;
  description: string;
  sections: Array<{
    title: string;
    prompts: string[];
    required: boolean;
  }>;
  targetDemographic?: string;
}

class SafetyPlanService {
  private baseUrl: string;

  constructor(baseUrl = '/api/safety-plans') {
    this.baseUrl = baseUrl;
  }

  async createSafetyPlan(planData: Omit<SafetyPlan, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<SafetyPlan> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        ...planData,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create safety plan');
    }

    return response.json();
  }

  async getSafetyPlan(userId: string): Promise<SafetyPlan | null> {
    const response = await fetch(`${this.baseUrl}/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch safety plan');
    }

    return response.json();
  }

  async updateSafetyPlan(planId: string, updates: Partial<SafetyPlan>): Promise<SafetyPlan> {
    const response = await fetch(`${this.baseUrl}/${planId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update safety plan');
    }

    return response.json();
  }

  async deleteSafetyPlan(planId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete safety plan');
    }
  }

  async getTemplates(): Promise<SafetyPlanTemplate[]> {
    const response = await fetch(`${this.baseUrl}/templates`);

    if (!response.ok) {
      throw new Error('Failed to fetch safety plan templates');
    }

    return response.json();
  }

  async createFromTemplate(templateId: string, userId: string): Promise<SafetyPlan> {
    const response = await fetch(`${this.baseUrl}/from-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ templateId, userId })
    });

    if (!response.ok) {
      throw new Error('Failed to create safety plan from template');
    }

    return response.json();
  }

  async validateSafetyPlan(plan: Partial<SafetyPlan>): Promise<{
    isValid: boolean;
    errors: string[];
    completionPercentage: number;
  }> {
    const errors: string[] = [];
    let completedSections = 0;
    const totalSections = 7;

    // Validate warning signals
    if (!plan.warningSignals || plan.warningSignals.length === 0) {
      errors.push('Warning signals are required');
    } else {
      completedSections++;
    }

    // Validate coping strategies
    if (!plan.copingStrategies || plan.copingStrategies.length === 0) {
      errors.push('Coping strategies are required');
    } else {
      completedSections++;
    }

    // Validate social supports
    if (!plan.socialSupports || plan.socialSupports.length === 0) {
      errors.push('At least one social support contact is required');
    } else {
      completedSections++;
    }

    // Validate professional supports
    if (!plan.professionalSupports || plan.professionalSupports.length === 0) {
      errors.push('At least one professional support contact is required');
    } else {
      completedSections++;
    }

    // Validate environment safety
    if (!plan.environmentSafety || 
        !plan.environmentSafety.safeEnvironmentSteps || 
        plan.environmentSafety.safeEnvironmentSteps.length === 0) {
      errors.push('Environment safety steps are required');
    } else {
      completedSections++;
    }

    // Validate reasons to live
    if (!plan.reasonsToLive || plan.reasonsToLive.length === 0) {
      errors.push('Reasons to live are required');
    } else {
      completedSections++;
    }

    // Validate crisis action plan
    if (!plan.crisisActionPlan || 
        !plan.crisisActionPlan.immediateSteps || 
        plan.crisisActionPlan.immediateSteps.length === 0) {
      errors.push('Crisis action plan with immediate steps is required');
    } else {
      completedSections++;
    }

    return {
      isValid: errors.length === 0,
      errors,
      completionPercentage: (completedSections / totalSections) * 100
    };
  }

  async shareSafetyPlan(planId: string, shareWith: {
    email: string;
    role: 'therapist' | 'family' | 'friend' | 'professional';
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canReceiveAlerts: boolean;
    };
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${planId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(shareWith)
    });

    if (!response.ok) {
      throw new Error('Failed to share safety plan');
    }
  }

  async exportSafetyPlan(planId: string, format: 'pdf' | 'json' | 'text'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${planId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export safety plan');
    }

    return response.blob();
  }

  async checkPlanAccess(userId: string): Promise<{
    hasActivePlan: boolean;
    lastUpdated?: Date;
    completionPercentage?: number;
    needsReview: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/access-check/${userId}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check plan access');
    }

    return response.json();
  }

  async triggerEmergencyAlert(planId: string, alertType: 'crisis' | 'urgent' | 'check-in'): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${planId}/emergency-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ alertType, timestamp: new Date().toISOString() })
    });

    if (!response.ok) {
      throw new Error('Failed to trigger emergency alert');
    }
  }

  // Helper method to get authentication token
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  // Default safety plan template
  getDefaultTemplate(): SafetyPlanTemplate {
    return {
      id: 'default',
      name: 'Standard Safety Plan',
      description: 'A comprehensive safety plan template for crisis prevention',
      sections: [
        {
          title: 'Warning Signals',
          prompts: [
            'What thoughts, feelings, or situations let you know that a crisis may be developing?',
            'What are your personal warning signs?'
          ],
          required: true
        },
        {
          title: 'Coping Strategies',
          prompts: [
            'What can you do to help yourself feel better without contacting another person?',
            'What activities help you cope?'
          ],
          required: true
        },
        {
          title: 'Social Support',
          prompts: [
            'Who can you contact for support and distraction?',
            'List people you trust and feel comfortable talking to'
          ],
          required: true
        },
        {
          title: 'Professional Support',
          prompts: [
            'Who are your mental health professionals?',
            'Include therapists, counselors, doctors, etc.'
          ],
          required: true
        },
        {
          title: 'Environment Safety',
          prompts: [
            'What should be removed from your environment?',
            'How can you make your environment safer?'
          ],
          required: true
        },
        {
          title: 'Reasons to Live',
          prompts: [
            'What are your reasons for living?',
            'What is most important to you?'
          ],
          required: true
        },
        {
          title: 'Crisis Action Plan',
          prompts: [
            'What will you do if the crisis escalates?',
            'Who will you contact?',
            'Where will you go?'
          ],
          required: true
        }
      ]
    };
  }
}

export const safetyPlanService = new SafetyPlanService();
export default safetyPlanService;
export type { SafetyPlan, SafetyPlanTemplate };

