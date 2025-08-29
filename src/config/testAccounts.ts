// Test accounts configuration for development and testing environments
// ⚠️ NEVER use these in production environments

export interface TestAccount {
  id: string;
  email: string;
  password: string;
  username: string;
  displayName: string;
  role: 'admin' | 'helper' | 'user' | 'therapist' | 'moderator';
  isVerified: boolean;
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    preferences?: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      notifications: boolean;
    };
  };
  mentalHealth?: {
    conditions?: string[];
    medications?: string[];
    goals?: string[];
    supportNeeds?: string[];
    crisisContacts?: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
  };
  permissions: string[];
  metadata: {
    createdAt: string;
    lastLogin?: string;
    sessionCount: number;
    testScenario?: string;
  };
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  accounts: string[]; // Array of account IDs
  setupSteps: string[];
  expectedOutcomes: string[];
  tags: string[];
}

// Development Test Accounts
export const DEV_TEST_ACCOUNTS: TestAccount[] = [
  // Admin Accounts
  {
    id: 'admin-001',
    email: 'admin@test.local',
    password: 'TestAdmin123!',
    username: 'testadmin',
    displayName: 'Test Administrator',
    role: 'admin',
    isVerified: true,
    profile: {
      avatar: '/avatars/admin.jpg',
      bio: 'System administrator for testing',
      location: 'Test Environment',
      timezone: 'UTC',
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true
      }
    },
    permissions: [
      'admin.users.manage',
      'admin.system.config',
      'admin.content.moderate',
      'admin.reports.view',
      'admin.analytics.access',
      'crisis.manage',
      'support.escalate'
    ],
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      sessionCount: 0,
      testScenario: 'admin-workflows'
    }
  },

  // Helper Accounts
  {
    id: 'helper-001',
    email: 'helper1@test.local',
    password: 'TestHelper123!',
    username: 'helpfulheart',
    displayName: 'Sarah Helper',
    role: 'helper',
    isVerified: true,
    profile: {
      avatar: '/avatars/helper1.jpg',
      bio: 'Experienced peer supporter specializing in anxiety and depression',
      location: 'Virtual Support Center',
      timezone: 'America/New_York',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      }
    },
    mentalHealth: {
      conditions: ['anxiety', 'recovered_depression'],
      supportNeeds: ['peer_support', 'skill_sharing'],
      goals: ['help_others', 'maintain_wellbeing']
    },
    permissions: [
      'helper.chat.access',
      'helper.resources.share',
      'helper.support.provide',
      'crisis.detect',
      'crisis.respond'
    ],
    metadata: {
      createdAt: '2024-01-02T00:00:00Z',
      sessionCount: 0,
      testScenario: 'helper-support-flow'
    }
  },

  {
    id: 'helper-002',
    email: 'helper2@test.local',
    password: 'TestHelper456!',
    username: 'compassionatecarer',
    displayName: 'Michael Support',
    role: 'helper',
    isVerified: true,
    profile: {
      avatar: '/avatars/helper2.jpg',
      bio: 'Crisis intervention specialist and trauma-informed supporter',
      location: 'Crisis Response Team',
      timezone: 'America/Los_Angeles',
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true
      }
    },
    mentalHealth: {
      conditions: ['ptsd_recovered', 'anxiety_managed'],
      supportNeeds: ['professional_development', 'self_care'],
      goals: ['crisis_prevention', 'trauma_support']
    },
    permissions: [
      'helper.chat.access',
      'helper.resources.share',
      'helper.support.provide',
      'crisis.detect',
      'crisis.respond',
      'crisis.escalate'
    ],
    metadata: {
      createdAt: '2024-01-03T00:00:00Z',
      sessionCount: 0,
      testScenario: 'crisis-intervention'
    }
  },

  // User Accounts
  {
    id: 'user-001',
    email: 'user1@test.local',
    password: 'TestUser123!',
    username: 'seekingsupport',
    displayName: 'Emma User',
    role: 'user',
    isVerified: true,
    profile: {
      avatar: '/avatars/user1.jpg',
      bio: 'Looking for support and community',
      location: 'Hometown, USA',
      timezone: 'America/Chicago',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: false
      }
    },
    mentalHealth: {
      conditions: ['depression', 'social_anxiety'],
      medications: ['sertraline_50mg'],
      goals: ['daily_mood_tracking', 'social_connection', 'coping_skills'],
      supportNeeds: ['peer_support', 'professional_guidance', 'crisis_resources'],
      crisisContacts: [
        {
          name: 'Mom',
          phone: '+1-555-0123',
          relationship: 'parent'
        },
        {
          name: 'Best Friend Alex',
          phone: '+1-555-0456',
          relationship: 'friend'
        }
      ]
    },
    permissions: [
      'user.chat.access',
      'user.mood.track',
      'user.journal.write',
      'user.resources.access',
      'user.community.participate'
    ],
    metadata: {
      createdAt: '2024-01-04T00:00:00Z',
      sessionCount: 0,
      testScenario: 'user-onboarding'
    }
  },

  {
    id: 'user-002',
    email: 'user2@test.local',
    password: 'TestUser456!',
    username: 'hopefuljourney',
    displayName: 'Alex Journey',
    role: 'user',
    isVerified: false, // Test unverified user scenario
    profile: {
      avatar: '/avatars/user2.jpg',
      bio: 'New to mental health support, eager to learn',
      location: 'Rural Area, State',
      timezone: 'America/Denver',
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true
      }
    },
    mentalHealth: {
      conditions: ['bipolar_disorder', 'anxiety'],
      goals: ['mood_stability', 'medication_compliance', 'stress_management'],
      supportNeeds: ['medication_reminders', 'crisis_planning', 'family_support']
    },
    permissions: [
      'user.chat.access',
      'user.mood.track',
      'user.journal.write',
      'user.resources.access'
    ],
    metadata: {
      createdAt: '2024-01-05T00:00:00Z',
      sessionCount: 0,
      testScenario: 'unverified-user-flow'
    }
  },

  // Crisis User (for testing emergency scenarios)
  {
    id: 'user-crisis',
    email: 'crisis@test.local',
    password: 'TestCrisis123!',
    username: 'needshelp',
    displayName: 'Crisis Test User',
    role: 'user',
    isVerified: true,
    profile: {
      avatar: '/avatars/crisis.jpg',
      bio: 'Test account for crisis scenarios',
      location: 'Test Location',
      timezone: 'America/New_York',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      }
    },
    mentalHealth: {
      conditions: ['severe_depression', 'suicidal_ideation'],
      goals: ['crisis_management', 'safety_planning'],
      supportNeeds: ['immediate_support', 'crisis_resources', 'professional_help'],
      crisisContacts: [
        {
          name: 'Emergency Contact',
          phone: '+1-555-9999',
          relationship: 'emergency'
        }
      ]
    },
    permissions: [
      'user.chat.access',
      'user.crisis.access',
      'user.emergency.trigger'
    ],
    metadata: {
      createdAt: '2024-01-06T00:00:00Z',
      sessionCount: 0,
      testScenario: 'crisis-detection-response'
    }
  },

  // Therapist Account
  {
    id: 'therapist-001',
    email: 'therapist@test.local',
    password: 'TestTherapist123!',
    username: 'drtherapist',
    displayName: 'Dr. Therapeutic Professional',
    role: 'therapist',
    isVerified: true,
    profile: {
      avatar: '/avatars/therapist.jpg',
      bio: 'Licensed clinical professional for testing therapeutic features',
      location: 'Professional Practice',
      timezone: 'America/New_York',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      }
    },
    permissions: [
      'therapist.client.manage',
      'therapist.notes.access',
      'therapist.assessment.create',
      'crisis.manage',
      'professional.tools.access'
    ],
    metadata: {
      createdAt: '2024-01-07T00:00:00Z',
      sessionCount: 0,
      testScenario: 'professional-integration'
    }
  },

  // Moderator Account
  {
    id: 'moderator-001',
    email: 'moderator@test.local',
    password: 'TestModerator123!',
    username: 'communitymoderator',
    displayName: 'Community Moderator',
    role: 'moderator',
    isVerified: true,
    profile: {
      avatar: '/avatars/moderator.jpg',
      bio: 'Community moderation and safety enforcement',
      location: 'Community Hub',
      timezone: 'UTC',
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true
      }
    },
    permissions: [
      'moderator.content.review',
      'moderator.users.warn',
      'moderator.community.manage',
      'crisis.detect',
      'crisis.escalate'
    ],
    metadata: {
      createdAt: '2024-01-08T00:00:00Z',
      sessionCount: 0,
      testScenario: 'content-moderation'
    }
  }
];

// Test Scenarios
export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'user-onboarding',
    name: 'New User Onboarding',
    description: 'Test the complete new user registration and onboarding flow',
    accounts: ['user-001'],
    setupSteps: [
      'Register new account',
      'Complete email verification',
      'Fill out mental health assessment',
      'Set up crisis contacts',
      'Configure preferences',
      'Complete tutorial'
    ],
    expectedOutcomes: [
      'Account created successfully',
      'Profile completed',
      'Crisis plan established',
      'First session recorded'
    ],
    tags: ['onboarding', 'registration', 'assessment']
  },

  {
    id: 'crisis-detection-response',
    name: 'Crisis Detection and Response',
    description: 'Test automated crisis detection and escalation procedures',
    accounts: ['user-crisis', 'helper-002', 'moderator-001'],
    setupSteps: [
      'User exhibits crisis indicators',
      'System detects crisis signals',
      'Automatic helper notification',
      'Helper engages with user',
      'Escalation to professional if needed'
    ],
    expectedOutcomes: [
      'Crisis detected accurately',
      'Appropriate resources provided',
      'Professional intervention triggered',
      'Safety plan activated'
    ],
    tags: ['crisis', 'safety', 'intervention']
  },

  {
    id: 'helper-support-flow',
    name: 'Helper Support Interaction',
    description: 'Test peer helper providing support to users',
    accounts: ['helper-001', 'user-001', 'user-002'],
    setupSteps: [
      'Helper comes online',
      'Users request support',
      'Helper engages in support chat',
      'Resources shared appropriately',
      'Session completion and follow-up'
    ],
    expectedOutcomes: [
      'Successful support connection',
      'Appropriate resources shared',
      'User satisfaction recorded',
      'Helper feedback collected'
    ],
    tags: ['peer-support', 'helper', 'chat']
  },

  {
    id: 'professional-integration',
    name: 'Professional Therapist Integration',
    description: 'Test therapist tools and professional features',
    accounts: ['therapist-001', 'user-001'],
    setupSteps: [
      'Therapist accesses professional dashboard',
      'Client assessment tools used',
      'Treatment plan created',
      'Progress tracking enabled',
      'Professional notes maintained'
    ],
    expectedOutcomes: [
      'Professional tools accessible',
      'Assessment completed',
      'Treatment plan active',
      'Progress tracked accurately'
    ],
    tags: ['professional', 'therapist', 'assessment']
  },

  {
    id: 'content-moderation',
    name: 'Community Content Moderation',
    description: 'Test content moderation and community safety features',
    accounts: ['moderator-001', 'user-001', 'user-002'],
    setupSteps: [
      'Inappropriate content posted',
      'Automated detection triggers',
      'Moderator review process',
      'Action taken on content',
      'User notification sent'
    ],
    expectedOutcomes: [
      'Content flagged appropriately',
      'Moderator tools functional',
      'Community safety maintained',
      'Users properly informed'
    ],
    tags: ['moderation', 'safety', 'community']
  }
];

// Utility functions
export const getTestAccountById = (id: string): TestAccount | undefined => {
  return DEV_TEST_ACCOUNTS.find(account => account.id === id);
};

export const getTestAccountsByRole = (role: TestAccount['role']): TestAccount[] => {
  return DEV_TEST_ACCOUNTS.filter(account => account.role === role);
};

export const getTestScenarioById = (id: string): TestScenario | undefined => {
  return TEST_SCENARIOS.find(scenario => scenario.id === id);
};

export const getAccountsForScenario = (scenarioId: string): TestAccount[] => {
  const scenario = getTestScenarioById(scenarioId);
  if (!scenario) return [];
  
  return scenario.accounts
    .map(accountId => getTestAccountById(accountId))
    .filter((account): account is TestAccount => account !== undefined);
};

// Environment checks
export const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         process.env.NODE_ENV === 'test' ||
         process.env.VITE_ENABLE_TEST_ACCOUNTS === 'true';
};

export const getEnabledTestAccounts = (): TestAccount[] => {
  if (!isTestEnvironment()) {
    console.warn('Test accounts are only available in development/test environments');
    return [];
  }
  
  return DEV_TEST_ACCOUNTS;
};

// Login helpers for testing
export const generateTestLoginCredentials = (accountId: string) => {
  const account = getTestAccountById(accountId);
  if (!account || !isTestEnvironment()) {
    throw new Error('Test account not found or not in test environment');
  }
  
  return {
    email: account.email,
    password: account.password,
    role: account.role
  };
};

// Security warning
if (process.env.NODE_ENV === 'production') {
  console.error('⚠️ WARNING: Test accounts should never be used in production!');
  console.error('Please ensure VITE_ENABLE_TEST_ACCOUNTS is not set in production.');
}

export default {
  DEV_TEST_ACCOUNTS,
  TEST_SCENARIOS,
  getTestAccountById,
  getTestAccountsByRole,
  getTestScenarioById,
  getAccountsForScenario,
  isTestEnvironment,
  getEnabledTestAccounts,
  generateTestLoginCredentials
};
