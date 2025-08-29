import { test as base } from '@playwright/test';
import { CrisisChatPage } from '../pages/CrisisChatPage';
import { HelperCertificationPage } from '../pages/HelperCertificationPage';
import { SafetyPlanPage } from '../pages/SafetyPlanPage';
import { EmergencyEscalationPage } from '../pages/EmergencyEscalationPage';

/**
 * Test Fixtures for Mental Health Platform E2E Tests
 * Provides reusable page objects and test data
 */

// Test data fixtures
export const testData = {
  crisisMessages: [
    'I want to end my life',
    'I am going to hurt myself',
    'I have a plan to kill myself',
    'I feel suicidal',
    'I want to die',
    'Nobody would miss me',
    'I have nothing left to live for',
    'The pain is too much'
  ],
  
  safetyPlanData: {
    warningSigns: [
      'Feeling overwhelmed',
      'Social isolation',
      'Sleep disturbances',
      'Increased anxiety',
      'Negative thoughts'
    ],
    copingStrategies: [
      'Deep breathing exercises',
      'Go for a walk',
      'Listen to calming music',
      'Practice mindfulness',
      'Call a friend'
    ],
    supportContacts: [
      'Best friend - 555-0123',
      'Sister - 555-0456',
      'Therapist - 555-0789',
      'Support group leader - 555-0321'
    ],
    professionalContacts: [
      '988 Suicide & Crisis Lifeline',
      'Crisis Text Line - Text HOME to 741741',
      'Local Crisis Center - 555-HELP',
      'Emergency Services - 911'
    ],
    environmentSafety: [
      'Remove harmful objects',
      'Ask someone to stay with me',
      'Go to a safe location',
      'Avoid substance use'
    ],
    reasonsToLive: [
      'My family and friends',
      'My pet needs me',
      'Future goals and dreams',
      'Making a positive impact',
      'Helping others through difficult times'
    ]
  },
  
  helperTrainingData: {
    modules: [
      'Crisis Response Fundamentals',
      'Active Listening Techniques',
      'Mental Health Awareness',
      'Crisis De-escalation',
      'Safety Planning',
      'Ethics and Boundaries'
    ],
    quizQuestions: {
      'Crisis Response Fundamentals': [
        'What is the first step in crisis intervention?',
        'How do you assess immediate safety?',
        'When should you escalate to professional help?'
      ],
      'Active Listening Techniques': [
        'What are the key components of active listening?',
        'How do you reflect emotions effectively?',
        'What questions help encourage sharing?'
      ]
    }
  },
  
  emergencyContacts: {
    national: [
      { name: '988 Lifeline', number: '988', type: 'Crisis Hotline' },
      { name: 'Emergency Services', number: '911', type: 'Emergency' },
      { name: 'Crisis Text Line', number: '741741', type: 'Text Support' }
    ],
    personal: [
      { name: 'Therapist', number: '555-THERAPY', relationship: 'Professional' },
      { name: 'Best Friend', number: '555-FRIEND', relationship: 'Personal' },
      { name: 'Family Member', number: '555-FAMILY', relationship: 'Family' }
    ]
  }
};

// Extended test with page objects
export const test = base.extend<{
  crisisChatPage: CrisisChatPage;
  helperCertificationPage: HelperCertificationPage;
  safetyPlanPage: SafetyPlanPage;
  emergencyEscalationPage: EmergencyEscalationPage;
}>({
  crisisChatPage: async ({ page }, use) => {
    const crisisChatPage = new CrisisChatPage(page);
    await use(crisisChatPage);
  },
  
  helperCertificationPage: async ({ page }, use) => {
    const helperCertificationPage = new HelperCertificationPage(page);
    await use(helperCertificationPage);
  },
  
  safetyPlanPage: async ({ page }, use) => {
    const safetyPlanPage = new SafetyPlanPage(page);
    await use(safetyPlanPage);
  },
  
  emergencyEscalationPage: async ({ page }, use) => {
    const emergencyEscalationPage = new EmergencyEscalationPage(page);
    await use(emergencyEscalationPage);
  }
});

export { expect } from '@playwright/test';
