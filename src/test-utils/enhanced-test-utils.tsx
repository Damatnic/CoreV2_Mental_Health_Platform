/**
 * Enhanced Test Utilities for Mental Health Platform
 * Provides comprehensive testing utilities with full TypeScript support
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { WellnessContext } from '../contexts/WellnessContext';
import type {
  TestUser,
  CustomRenderOptions,
  RenderWithProvidersResult,
  Notification,
  MockAuthService,
  MockCrisisService,
  TestDataGenerators,
  MoodEntry,
  TherapySession,
  SafetyPlan,
  CrisisTestScenario,
  EmergencyResource
} from './types';

// Default test user
const defaultTestUser: TestUser = {
  id: 'test-user-1',
  email: 'testuser@example.com',
  name: 'Test User',
  role: 'seeker',
  isAnonymous: false,
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
      crisisAlerts: true,
      checkInReminders: true
    },
    privacy: {
      shareData: false,
      allowAnalytics: false,
      publicProfile: false,
      anonymousMode: false
    }
  },
  mentalHealthProfile: {
    currentMood: 5,
    anxietyLevel: 3,
    stressLevel: 4,
    sleepQuality: 6,
    triggers: [],
    copingStrategies: ['breathing exercises', 'journaling'],
    medications: [],
    emergencyContacts: []
  }
};

// Mock services factory
export const createMockAuthService = (): MockAuthService => ({
  login: jest.fn().mockResolvedValue(defaultTestUser),
  logout: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue(defaultTestUser),
  getCurrentUser: jest.fn().mockResolvedValue(defaultTestUser),
  updateProfile: jest.fn().mockResolvedValue(defaultTestUser),
  resetPassword: jest.fn().mockResolvedValue(undefined)
});

export const createMockCrisisService = (): MockCrisisService => ({
  detectCrisis: jest.fn().mockResolvedValue({
    isCrisis: false,
    severity: 'low',
    type: 'none',
    confidence: 0.1,
    keywords: [],
    recommendedActions: [],
    resources: []
  }),
  escalateCrisis: jest.fn().mockResolvedValue(undefined),
  getEmergencyResources: jest.fn().mockResolvedValue([]),
  notifyEmergencyContacts: jest.fn().mockResolvedValue(undefined)
});

// Test data generators
export const testDataGenerators: TestDataGenerators = {
  generateUser: (overrides = {}) => ({
    ...defaultTestUser,
    ...overrides,
    id: overrides.id || `test-user-${Math.random().toString(36).substr(2, 9)}`
  }),

  generateCrisisScenario: (severity = 'low'): CrisisTestScenario => {
    const scenarios: Record<string, CrisisTestScenario> = {
      low: {
        input: "I'm feeling a bit down today",
        expectedSeverity: 'low',
        expectedType: 'none',
        expectedConfidence: 0.2,
        shouldTriggerAlert: false,
        shouldEscalate: false
      },
      medium: {
        input: "I've been feeling really anxious and can't sleep",
        expectedSeverity: 'medium',
        expectedType: 'severe_depression',
        expectedConfidence: 0.6,
        shouldTriggerAlert: true,
        shouldEscalate: false
      },
      high: {
        input: "I've been thinking about hurting myself",
        expectedSeverity: 'high',
        expectedType: 'self_harm',
        expectedConfidence: 0.85,
        shouldTriggerAlert: true,
        shouldEscalate: true
      },
      critical: {
        input: "I have a plan to end my life tonight",
        expectedSeverity: 'critical',
        expectedType: 'suicidal_ideation',
        expectedConfidence: 0.95,
        shouldTriggerAlert: true,
        shouldEscalate: true
      }
    };
    return scenarios[severity];
  },

  generateMoodEntry: (date = new Date()): MoodEntry => ({
    id: `mood-${Math.random().toString(36).substr(2, 9)}`,
    userId: defaultTestUser.id,
    mood: Math.floor(Math.random() * 10) + 1,
    anxiety: Math.floor(Math.random() * 10) + 1,
    stress: Math.floor(Math.random() * 10) + 1,
    sleep: Math.floor(Math.random() * 10) + 1,
    timestamp: date,
    triggers: [],
    copingStrategiesUsed: []
  }),

  generateTherapySession: (duration = 45): TherapySession => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    return {
      id: `session-${Math.random().toString(36).substr(2, 9)}`,
      userId: defaultTestUser.id,
      startTime,
      endTime,
      type: 'ai',
      sentiment: 'neutral',
      topicsDiscussed: ['anxiety', 'work stress'],
      actionItems: ['practice breathing exercises', 'journal daily']
    };
  },

  generateSafetyPlan: (): SafetyPlan => ({
    id: `safety-${Math.random().toString(36).substr(2, 9)}`,
    userId: defaultTestUser.id,
    warningSignsContent: 'Feeling isolated, negative thoughts',
    internalCopingContent: 'Deep breathing, mindfulness',
    socialDistractionsContent: 'Call a friend, go for a walk',
    socialSupportsContent: 'Best friend: 555-0123',
    professionalContactsContent: 'Therapist: Dr. Smith 555-0456',
    safeEnvironmentContent: 'Remove harmful objects',
    reasonsToLiveContent: 'Family, future goals',
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

// Provider wrapper component
interface AllTheProvidersProps {
  children: ReactNode;
  user?: TestUser | null;
  theme?: 'light' | 'dark';
  notifications?: Notification[];
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  user = null,
  theme = 'light',
  notifications = []
}) => {
  const [currentUser, setCurrentUser] = React.useState(user);
  const [currentTheme, setCurrentTheme] = React.useState(theme);
  const [currentNotifications, setCurrentNotifications] = React.useState(notifications);

  const authValue = {
    user: currentUser,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
    loading: false,
    error: null
  };

  const themeValue = {
    theme: currentTheme,
    toggleTheme: () => setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light'),
    setTheme: setCurrentTheme
  };

  const notificationValue = {
    notifications: currentNotifications,
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false
      };
      setCurrentNotifications(prev => [...prev, newNotification]);
    },
    removeNotification: jest.fn(),
    markAsRead: jest.fn(),
    clearAll: jest.fn()
  };

  const wellnessValue = {
    moodEntries: [],
    addMoodEntry: jest.fn(),
    safetyPlan: null,
    updateSafetyPlan: jest.fn(),
    wellnessScore: 70,
    insights: []
  };

  return (
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <ThemeProvider value={themeValue}>
          <NotificationContext.Provider value={notificationValue}>
            <WellnessContext.Provider value={wellnessValue}>
              {children}
            </WellnessContext.Provider>
          </NotificationContext.Provider>
        </ThemeProvider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

// Custom render function
export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderWithProvidersResult => {
  const {
    initialUser = null,
    initialTheme = 'light',
    initialNotifications = [],
    ...renderOptions
  } = options || {};

  const result = render(
    <AllTheProviders
      user={initialUser}
      theme={initialTheme}
      notifications={initialNotifications}
    >
      {ui}
    </AllTheProviders>,
    renderOptions
  ) as RenderWithProvidersResult;

  // Add custom properties and methods
  result.user = initialUser;
  result.updateUser = (newUser: TestUser | null) => {
    result.user = newUser;
    result.rerender(
      <AllTheProviders
        user={newUser}
        theme={result.theme}
        notifications={result.notifications}
      >
        {ui}
      </AllTheProviders>
    );
  };

  result.theme = initialTheme;
  result.toggleTheme = () => {
    result.theme = result.theme === 'light' ? 'dark' : 'light';
    result.rerender(
      <AllTheProviders
        user={result.user}
        theme={result.theme}
        notifications={result.notifications}
      >
        {ui}
      </AllTheProviders>
    );
  };

  result.notifications = initialNotifications;
  result.addNotification = (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };
    result.notifications = [...result.notifications, newNotification];
    result.rerender(
      <AllTheProviders
        user={result.user}
        theme={result.theme}
        notifications={result.notifications}
      >
        {ui}
      </AllTheProviders>
    );
  };

  return result;
};

// Crisis detection test helpers
export const testCrisisDetection = async (
  message: string,
  expectedSeverity: 'low' | 'medium' | 'high' | 'critical'
): Promise<boolean> => {
  const mockService = createMockCrisisService();
  const result = await mockService.detectCrisis(message);
  return result.severity === expectedSeverity;
};

// Accessibility test helpers
export const checkAccessibility = async (container: HTMLElement): Promise<void> => {
  // Check for ARIA labels
  const interactiveElements = container.querySelectorAll('button, input, select, textarea, a');
  interactiveElements.forEach(element => {
    const hasLabel = element.getAttribute('aria-label') || 
                     element.getAttribute('aria-labelledby') ||
                     element.textContent?.trim();
    if (!hasLabel) {
      console.warn(`Element missing accessible label: ${element.tagName}`);
    }
  });

  // Check for color contrast (simplified)
  const elements = container.querySelectorAll('*');
  elements.forEach(element => {
    const styles = window.getComputedStyle(element);
    if (styles.color && styles.backgroundColor) {
      // Basic contrast check would go here
    }
  });
};

// Performance test helpers
export const measureRenderTime = async (
  component: ReactElement
): Promise<number> => {
  const startTime = performance.now();
  render(component);
  const endTime = performance.now();
  return endTime - startTime;
};

// Mock emergency resources
export const mockEmergencyResources: EmergencyResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    website: 'https://988lifeline.org',
    available247: true,
    specialties: ['crisis', 'suicide prevention', 'emotional distress']
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    website: 'https://www.crisistextline.org',
    available247: true,
    specialties: ['crisis', 'text support', 'youth']
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    available247: true,
    specialties: ['substance abuse', 'mental health', 'treatment referral']
  }
];

// Wait for async updates
export const waitForAsync = (): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };

// Export default render for backward compatibility
export { renderWithProviders as render };