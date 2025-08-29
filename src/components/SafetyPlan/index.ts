/**
 * Safety Plan Components
 * 
 * Self-contained module for safety planning and crisis management tools
 */

// Core interfaces
export interface SafetyPlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  content: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface SafetyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isProfessional: boolean;
  isAvailable24h: boolean;
}

export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'distraction' | 'social' | 'professional';
  effectiveness: number;
}

export interface SafetyPlan {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  steps: SafetyPlanStep[];
  copingStrategies: CopingStrategy[];
  emergencyContacts: SafetyContact[];
  completionPercentage: number;
}

export interface SafetyPlanBuilderProps {
  plan?: SafetyPlan;
  onSave?: (plan: SafetyPlan) => void;
  className?: string;
  readOnly?: boolean;
}

// Constants
export const SAFETY_PLAN_STEPS = [
  { stepNumber: 1, title: 'Warning Signs', description: 'Recognize early warning signs', isRequired: true },
  { stepNumber: 2, title: 'Coping Strategies', description: 'Internal coping strategies', isRequired: true },
  { stepNumber: 3, title: 'Social Support', description: 'People and places for support', isRequired: true },
  { stepNumber: 4, title: 'Professional Help', description: 'Mental health professionals', isRequired: true },
  { stepNumber: 5, title: 'Safe Environment', description: 'Making environment safe', isRequired: true }
] as const;

export const DEFAULT_COPING_STRATEGIES: CopingStrategy[] = [
  {
    id: 'breathing',
    title: 'Deep Breathing',
    description: 'Take slow, deep breaths',
    category: 'immediate',
    effectiveness: 4
  },
  {
    id: 'grounding',
    title: 'Grounding Exercise',
    description: '5-4-3-2-1 technique',
    category: 'immediate',
    effectiveness: 4
  }
];

export const EMERGENCY_CONTACTS: SafetyContact[] = [
  {
    id: 'suicide-prevention',
    name: 'National Suicide Prevention Lifeline',
    relationship: 'Crisis Hotline',
    phone: '988',
    isProfessional: true,
    isAvailable24h: true
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    relationship: 'Emergency',
    phone: '911',
    isProfessional: true,
    isAvailable24h: true
  }
];

// Utility functions
export const createEmptySafetyPlan = (userId: string): SafetyPlan => {
  const now = new Date().toISOString();
  return {
    id: `plan-${Date.now()}`,
    userId,
    title: 'My Safety Plan',
    createdAt: now,
    updatedAt: now,
    steps: SAFETY_PLAN_STEPS.map((step, index) => ({
      id: `step-${index + 1}`,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      content: '',
      isCompleted: false,
      isRequired: step.isRequired
    })),
    copingStrategies: [...DEFAULT_COPING_STRATEGIES],
    emergencyContacts: [...EMERGENCY_CONTACTS],
    completionPercentage: 0
  };
};

export const calculateCompletionPercentage = (plan: SafetyPlan): number => {
  const completedSteps = plan.steps.filter(step => step.isCompleted).length;
  return Math.round((completedSteps / plan.steps.length) * 100);
};

export const validateSafetyPlan = (plan: SafetyPlan): string[] => {
  const errors: string[] = [];
  const incompleteRequired = plan.steps.filter(step => step.isRequired && !step.isCompleted);
  
  if (incompleteRequired.length > 0) {
    errors.push(`${incompleteRequired.length} required steps incomplete`);
  }
  
  if (plan.emergencyContacts.length === 0) {
    errors.push('At least one emergency contact required');
  }
  
  return errors;
};

// Mock component for compatibility
export const SafetyPlanBuilder = {
  displayName: 'SafetyPlanBuilder',
  defaultProps: { readOnly: false }
};

export const SafetyPlan = SafetyPlanBuilder;
export default SafetyPlanBuilder;