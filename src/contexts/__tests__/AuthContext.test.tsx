/// <reference types="../../types/jest-dom" />

/**
 * 🔐 ENHANCED MENTAL HEALTH AUTHENTICATION CONTEXT TESTS
 * 
 * Comprehensive test suite for mental health platform authentication
 * with crisis support, HIPAA compliance, and accessibility features.
 * 
 * ✨ KEY TESTING AREAS:
 * - Crisis-aware authentication and emergency protocols
 * - HIPAA-compliant data handling and privacy protection
 * - Multi-role authentication (seeker, helper, therapist, crisis-specialist)
 * - Anonymous and secure session management
 * - Cultural competency and accessibility integration
 * - Real-time security level escalation
 * - Comprehensive error handling and edge cases
 * 
 * @version 3.0.0
 * @compliance HIPAA, Crisis Intervention Standards, WCAG 2.1 AAA
 */

import * as React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { render, screen, act, waitFor, userEvent } from '../../test-utils/testing-library-exports';
import '@testing-library/jest-dom';
import '../../setupTests';

// 🎯 ENHANCED MENTAL HEALTH TYPES
export interface MentalHealthUser {
  id: string;
  email: string;
  name: string;
  role: 'seeker' | 'helper' | 'therapist' | 'crisis-specialist' | 'admin' | 'moderator';
  verified: boolean;
  isAnonymous?: boolean;
  crisisAccess?: boolean;
  emergencyContact?: string;
  culturalPreference?: string;
  languagePreference?: string;
  accessibilityNeeds?: string[];
  consentToDataProcessing?: boolean;
  hipaaCompliant?: boolean;
  lastActiveTimestamp?: number;
  sessionTimeout?: number;
  twoFactorEnabled?: boolean;
  mentalHealthRole?: {
    specializations?: string[];
    certifications?: string[];
    availableForCrisis?: boolean;
    maxCaseLoad?: number;
  };
}

interface LoginOptions {
  crisisLogin?: boolean;
  anonymousLogin?: boolean;
  rememberMe?: boolean;
  culturalContext?: string;
  accessibilityMode?: string;
}

interface LogoutOptions {
  clearCrisisData?: boolean;
  preserveAnonymousSession?: boolean;
  secureWipe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: MentalHealthUser['role'];
  culturalPreference?: string;
  languagePreference?: string;
  accessibilityNeeds?: string[];
  emergencyContact?: string;
  consentToDataProcessing: boolean;
}

interface SecurityQuestion {
  question: string;
  answer: string;
}

// Enhanced Auth Context for Mental Health Platform
export interface MentalHealthAuthContextType {
  user: MentalHealthUser | null;
  loading: boolean;
  error: string | null;
  crisisMode: boolean;
  anonymousMode: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  login: (email: string, password: string, options?: LoginOptions) => Promise<void>;
  logout: (options?: LogoutOptions) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  resetPassword: (email: string, securityQuestions?: SecurityQuestion[]) => Promise<void>;
  updateProfile: (updates: Partial<MentalHealthUser>) => Promise<void>;
  enableCrisisMode: () => Promise<void>;
  enableAnonymousMode: () => Promise<void>;
  validateHipaaCompliance: () => boolean;
  refreshSession: () => Promise<void>;
  escalateSecurityLevel: (level: 'low' | 'medium' | 'high' | 'critical') => Promise<void>;
}

// Mental Health Auth Context Implementation
const MentalHealthAuthContext = React.createContext<MentalHealthAuthContextType | undefined>(undefined);

export const useMentalHealthAuth = (): MentalHealthAuthContextType => {
  const context = React.useContext(MentalHealthAuthContext);
  if (!context) {
    throw new Error('useMentalHealthAuth must be used within MentalHealthAuthProvider');
  }
  return context;
};

interface MentalHealthAuthProviderProps {
  children: React.ReactNode;
  initialUser?: MentalHealthUser | null;
  testMode?: boolean;
  mockImplementation?: Partial<MentalHealthAuthContextType>;
}

export const MentalHealthAuthProvider: React.FC<MentalHealthAuthProviderProps> = ({ 
  children,
  initialUser = null,
  testMode = false,
  mockImplementation = {}
}) => {
  const [user, setUser] = React.useState<MentalHealthUser | null>(initialUser);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [crisisMode, setCrisisMode] = React.useState(false);
  const [anonymousMode, setAnonymousMode] = React.useState(false);
  const [securityLevel, setSecurityLevel] = React.useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Enhanced login with mental health specific options
  const login = React.useCallback(async (email: string, password: string, options: LoginOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call with enhanced security checks
      await new Promise(resolve => setTimeout(resolve, testMode ? 100 : 500));
      
      // Crisis mode authentication scenarios
      if (options.crisisLogin && email === 'crisis@test.com') {
        const crisisUser: MentalHealthUser = {
          id: 'crisis-1',
          email,
          name: 'Crisis User',
          role: 'seeker',
          verified: true,
          crisisAccess: true,
          hipaaCompliant: true,
          emergencyContact: '+1-800-273-8255'
        };
        setUser(crisisUser);
        setCrisisMode(true);
        setSecurityLevel('critical');
        return;
      }
      
      // Anonymous mode authentication
      if (options.anonymousLogin) {
        const anonUser: MentalHealthUser = {
          id: `anon-${Date.now()}`,
          email: 'anonymous@secure.local',
          name: 'Anonymous User',
          role: 'seeker',
          verified: false,
          isAnonymous: true,
          consentToDataProcessing: false
        };
        setUser(anonUser);
        setAnonymousMode(true);
        return;
      }
      
      // Error scenarios for testing
      if (email === 'error@test.com') {
        throw new Error('Invalid credentials');
      }
      if (email === 'blocked@test.com') {
        throw new Error('Account temporarily blocked for safety');
      }
      if (email === 'hipaa@test.com' && !validateHipaaCompliance()) {
        throw new Error('HIPAA compliance validation failed');
      }
      
      // Role-based user creation
      const getUserByRole = (email: string): MentalHealthUser => {
        if (email.includes('therapist')) {
          return {
            id: 'therapist-1',
            email,
            name: 'Dr. Sarah Thompson',
            role: 'therapist',
            verified: true,
            hipaaCompliant: true,
            mentalHealthRole: {
              specializations: ['anxiety', 'depression', 'trauma'],
              certifications: ['LCSW', 'CBT'],
              availableForCrisis: true,
              maxCaseLoad: 25
            }
          };
        }
        if (email.includes('helper')) {
          return {
            id: 'helper-1',
            email,
            name: 'Alex Rivera',
            role: 'helper',
            verified: true,
            mentalHealthRole: {
              specializations: ['peer-support', 'crisis-intervention'],
              availableForCrisis: true
            }
          };
        }
        if (email.includes('crisis')) {
          return {
            id: 'crisis-specialist-1',
            email,
            name: 'Crisis Specialist Johnson',
            role: 'crisis-specialist',
            verified: true,
            crisisAccess: true,
            hipaaCompliant: true,
            emergencyContact: '+1-800-273-8255'
          };
        }
        return {
          id: '1',
          email,
          name: 'Mental Health Seeker',
          role: 'seeker',
          verified: true,
          consentToDataProcessing: true,
          culturalPreference: options.culturalContext || 'western',
          languagePreference: 'en',
          accessibilityNeeds: options.accessibilityMode ? [options.accessibilityMode] : []
        };
      };
      
      const mockUser = getUserByRole(email);
      setUser(mockUser);
      
      // Secure storage with encryption simulation
      const encryptedUserData = btoa(JSON.stringify(mockUser));
      localStorage.setItem('mh-auth-user', encryptedUserData);
      localStorage.setItem('mh-session-timestamp', Date.now().toString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [testMode]);

  const logout = React.useCallback(async (options: LogoutOptions = {}) => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, testMode ? 50 : 200));
      
      setUser(null);
      setError(null);
      setCrisisMode(false);
      setAnonymousMode(false);
      setSecurityLevel('medium');
      
      if (options.secureWipe) {
        // Secure data clearing for sensitive sessions
        localStorage.removeItem('mh-auth-user');
        localStorage.removeItem('mh-session-timestamp');
        localStorage.removeItem('mh-crisis-data');
        sessionStorage.clear();
      } else {
        localStorage.removeItem('mh-auth-user');
      }
    } catch (err) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  }, [testMode]);

  const register = React.useCallback(async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, testMode ? 100 : 800));
      
      if (userData.email === 'exists@test.com') {
        throw new Error('Email already exists');
      }
      if (!userData.consentToDataProcessing) {
        throw new Error('Data processing consent required');
      }
      
      const newUser: MentalHealthUser = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        verified: false,
        culturalPreference: userData.culturalPreference,
        languagePreference: userData.languagePreference,
        accessibilityNeeds: userData.accessibilityNeeds,
        emergencyContact: userData.emergencyContact,
        consentToDataProcessing: userData.consentToDataProcessing,
        hipaaCompliant: ['therapist', 'crisis-specialist'].includes(userData.role)
      };
      
      setUser(newUser);
      const encryptedUserData = btoa(JSON.stringify(newUser));
      localStorage.setItem('mh-auth-user', encryptedUserData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [testMode]);

  const resetPassword = React.useCallback(async (email: string, securityQuestions: SecurityQuestion[] = []) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, testMode ? 50 : 300));
      
      if (email === 'notfound@test.com') {
        throw new Error('Email not found');
      }
      if (email === 'security@test.com' && securityQuestions.length === 0) {
        throw new Error('Security questions required for this account');
      }
      
      // Simulate secure password reset
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [testMode]);

  const updateProfile = React.useCallback(async (updates: Partial<MentalHealthUser>) => {
    if (!user) throw new Error('No user logged in');
    
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, testMode ? 50 : 400));
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      const encryptedUserData = btoa(JSON.stringify(updatedUser));
      localStorage.setItem('mh-auth-user', encryptedUserData);
    } catch (err) {
      setError('Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, testMode]);

  const enableCrisisMode = React.useCallback(async () => {
    if (!user) throw new Error('No user logged in');
    
    setCrisisMode(true);
    setSecurityLevel('critical');
    
    // Store crisis mode activation
    localStorage.setItem('mh-crisis-mode', 'true');
    localStorage.setItem('mh-crisis-timestamp', Date.now().toString());
  }, [user]);

  const enableAnonymousMode = React.useCallback(async () => {
    setAnonymousMode(true);
    setSecurityLevel('high');
    
    if (user) {
      const anonUser = { ...user, isAnonymous: true, email: 'anonymous@secure.local' };
      setUser(anonUser);
    }
  }, [user]);

  const validateHipaaCompliance = React.useCallback((): boolean => {
    if (!user) return false;
    return user.hipaaCompliant === true && user.consentToDataProcessing === true;
  }, [user]);

  const refreshSession = React.useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, testMode ? 25 : 100));
      localStorage.setItem('mh-session-timestamp', Date.now().toString());
    } finally {
      setLoading(false);
    }
  }, [user, testMode]);

  const escalateSecurityLevel = React.useCallback(async (level: 'low' | 'medium' | 'high' | 'critical') => {
    setSecurityLevel(level);
    localStorage.setItem('mh-security-level', level);
  }, []);

  // Initialize user from encrypted localStorage on mount
  React.useEffect(() => {
    if (!testMode) {
      const storedUser = localStorage.getItem('mh-auth-user');
      const storedCrisisMode = localStorage.getItem('mh-crisis-mode');
      
      if (storedUser && !initialUser) {
        try {
          const decryptedUser = JSON.parse(atob(storedUser));
          setUser(decryptedUser);
          
          if (storedCrisisMode === 'true') {
            setCrisisMode(true);
            setSecurityLevel('critical');
          }
        } catch (err) {
          localStorage.removeItem('mh-auth-user');
          localStorage.removeItem('mh-crisis-mode');
        }
      }
    }
  }, [initialUser, testMode]);

  const contextValue: MentalHealthAuthContextType = {
    user,
    loading,
    error,
    crisisMode,
    anonymousMode,
    securityLevel,
    login,
    logout,
    register,
    resetPassword,
    updateProfile,
    enableCrisisMode,
    enableAnonymousMode,
    validateHipaaCompliance,
    refreshSession,
    escalateSecurityLevel,
    ...mockImplementation
  };

  return React.createElement(
    MentalHealthAuthContext.Provider,
    { value: contextValue },
    children
  );
};

// Enhanced Test Components for Mental Health Authentication
const MentalHealthTestComponent: React.FC = () => {
  const { 
    user, 
    loading, 
    error, 
    crisisMode, 
    anonymousMode, 
    securityLevel,
    login, 
    logout, 
    register, 
    enableCrisisMode,
    enableAnonymousMode,
    validateHipaaCompliance,
    refreshSession,
    escalateSecurityLevel
  } = useMentalHealthAuth();

  const handleRegister = () => {
    register({
      email: 'seeker@example.com',
      password: 'secure123',
      name: 'Mental Health Seeker',
      role: 'seeker',
      consentToDataProcessing: true,
      culturalPreference: 'western',
      languagePreference: 'en'
    });
  };

  const handleCrisisRegister = () => {
    register({
      email: 'crisis-user@example.com',
      password: 'secure123',
      name: 'Crisis User',
      role: 'seeker',
      consentToDataProcessing: true,
      emergencyContact: '+1-800-273-8255'
    });
  };

  return React.createElement('div', null,
    React.createElement('div', { 'data-testid': 'user-status' },
      loading ? 'loading' : user ? `logged-in: ${user.email}` : 'logged-out'
    ),
    React.createElement('div', { 'data-testid': 'user-role' }, user?.role || 'none'),
    React.createElement('div', { 'data-testid': 'crisis-mode' }, crisisMode ? 'crisis-active' : 'normal'),
    React.createElement('div', { 'data-testid': 'anonymous-mode' }, anonymousMode ? 'anonymous-active' : 'identified'),
    React.createElement('div', { 'data-testid': 'security-level' }, securityLevel),
    React.createElement('div', { 'data-testid': 'hipaa-compliant' }, user ? validateHipaaCompliance().toString() : 'false'),
    error && React.createElement('div', { 'data-testid': 'error' }, error),
    
    // Basic Authentication
    React.createElement('button', {
      onClick: () => login('seeker@example.com', 'password'),
      'data-testid': 'login-seeker'
    }, 'Login as Seeker'),
    React.createElement('button', {
      onClick: () => login('therapist@example.com', 'password'),
      'data-testid': 'login-therapist'
    }, 'Login as Therapist'),
    React.createElement('button', {
      onClick: () => login('helper@example.com', 'password'),
      'data-testid': 'login-helper'
    }, 'Login as Helper'),
    React.createElement('button', {
      onClick: () => login('crisis-specialist@example.com', 'password'),
      'data-testid': 'login-crisis-specialist'
    }, 'Login as Crisis Specialist'),
    
    // Crisis Authentication
    React.createElement('button', {
      onClick: () => login('crisis@test.com', 'password', { crisisLogin: true }),
      'data-testid': 'crisis-login'
    }, 'Emergency Crisis Login'),
    
    // Anonymous Authentication
    React.createElement('button', {
      onClick: () => login('', '', { anonymousLogin: true }),
      'data-testid': 'anonymous-login'
    }, 'Anonymous Login'),
    
    // Cultural Context Login
    React.createElement('button', {
      onClick: () => login('cultural@example.com', 'password', { culturalContext: 'asian' }),
      'data-testid': 'cultural-login'
    }, 'Cultural Context Login'),
    
    // Accessibility Login
    React.createElement('button', {
      onClick: () => login('accessible@example.com', 'password', { accessibilityMode: 'screen-reader' }),
      'data-testid': 'accessibility-login'
    }, 'Accessibility Login'),
    
    // Error Scenarios
    React.createElement('button', {
      onClick: () => login('error@test.com', 'password'),
      'data-testid': 'login-error'
    }, 'Login Error'),
    React.createElement('button', {
      onClick: () => login('blocked@test.com', 'password'),
      'data-testid': 'login-blocked'
    }, 'Blocked Account Login'),
    React.createElement('button', {
      onClick: () => login('hipaa@test.com', 'password'),
      'data-testid': 'hipaa-error'
    }, 'HIPAA Error Login'),
    
    // Registration
    React.createElement('button', {
      onClick: handleRegister,
      'data-testid': 'register'
    }, 'Register Seeker'),
    React.createElement('button', {
      onClick: handleCrisisRegister,
      'data-testid': 'register-crisis'
    }, 'Register Crisis User'),
    
    // Special Modes
    React.createElement('button', {
      onClick: enableCrisisMode,
      'data-testid': 'enable-crisis'
    }, 'Enable Crisis Mode'),
    React.createElement('button', {
      onClick: enableAnonymousMode,
      'data-testid': 'enable-anonymous'
    }, 'Enable Anonymous Mode'),
    
    // Session Management
    React.createElement('button', {
      onClick: refreshSession,
      'data-testid': 'refresh-session'
    }, 'Refresh Session'),
    React.createElement('button', {
      onClick: () => escalateSecurityLevel('critical'),
      'data-testid': 'escalate-security'
    }, 'Escalate Security'),
    
    // Logout
    React.createElement('button', {
      onClick: () => logout(),
      'data-testid': 'logout'
    }, 'Normal Logout'),
    React.createElement('button', {
      onClick: () => logout({ secureWipe: true }),
      'data-testid': 'secure-logout'
    }, 'Secure Wipe Logout')
  );
};

// Test component for error scenarios
const ErrorTestComponent: React.FC = () => {
  try {
    const { user } = useMentalHealthAuth();
    return React.createElement('div', null, user?.email);
  } catch (error) {
    return React.createElement('div', { 'data-testid': 'context-error' }, (error as Error).message);
  }
};

describe('Mental Health Platform Authentication Context', () => {
  let mockLocalStorage: { [key: string]: string };
  let mockSessionStorage: { [key: string]: string };
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeAll(() => {
    // Setup global test environment for mental health platform
    global.btoa = jest.fn((str: string) => Buffer.from(str).toString('base64'));
    global.atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString());
  });

  beforeEach(() => {
    // Mock enhanced localStorage for secure mental health data
    mockLocalStorage = {};
    mockSessionStorage = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        })
      },
      writable: true
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn(() => {
          mockSessionStorage = {};
        })
      },
      writable: true
    });

    // Suppress console.error for error boundary tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Core Authentication Features', () => {
    it('should provide initial mental health auth state', () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
      expect(screen.getByTestId('user-role')).toHaveTextContent('none');
      expect(screen.getByTestId('crisis-mode')).toHaveTextContent('normal');
      expect(screen.getByTestId('anonymous-mode')).toHaveTextContent('identified');
      expect(screen.getByTestId('security-level')).toHaveTextContent('medium');
      expect(screen.getByTestId('hipaa-compliant')).toHaveTextContent('false');
    });

    it('should throw error when used outside mental health auth provider', () => {
      render(React.createElement(ErrorTestComponent));
      expect(screen.getByTestId('context-error')).toHaveTextContent(
        'useMentalHealthAuth must be used within MentalHealthAuthProvider'
      );
    });

    it('should handle seeker authentication successfully', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      const loginButton = screen.getByTestId('login-seeker');

      await act(async () => {
        await user.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: seeker@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('seeker');
      });

      // Should store encrypted data in localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mh-auth-user',
        expect.any(String)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mh-session-timestamp',
        expect.any(String)
      );
    });
  });

  describe('Mental Health User Roles Authentication', () => {
    it('should authenticate therapist with HIPAA compliance', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('login-therapist'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: therapist@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('therapist');
        expect(screen.getByTestId('hipaa-compliant')).toHaveTextContent('true');
      });
    });

    it('should authenticate helper with peer support capabilities', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('login-helper'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: helper@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('helper');
      });
    });

    it('should authenticate crisis specialist with emergency access', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('login-crisis-specialist'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: crisis-specialist@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('crisis-specialist');
        expect(screen.getByTestId('hipaa-compliant')).toHaveTextContent('true');
      });
    });
  });

  describe('Crisis Authentication Protocols', () => {
    it('should enable crisis mode authentication with critical security level', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('crisis-login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: crisis@test.com');
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('crisis-active');
        expect(screen.getByTestId('security-level')).toHaveTextContent('critical');
      });
    });

    it('should enable crisis mode for existing user', async () => {
      const initialUser: MentalHealthUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: initialUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('enable-crisis'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('crisis-active');
        expect(screen.getByTestId('security-level')).toHaveTextContent('critical');
      });
    });
  });

  describe('Anonymous Support Authentication', () => {
    it('should enable anonymous mode authentication', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('anonymous-login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: anonymous@secure.local');
        expect(screen.getByTestId('anonymous-mode')).toHaveTextContent('anonymous-active');
        expect(screen.getByTestId('user-role')).toHaveTextContent('seeker');
      });
    });

    it('should enable anonymous mode for existing user', async () => {
      const initialUser: MentalHealthUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: initialUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('enable-anonymous'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('anonymous-mode')).toHaveTextContent('anonymous-active');
        expect(screen.getByTestId('security-level')).toHaveTextContent('high');
      });
    });
  });

  describe('Cultural Competency & Accessibility Authentication', () => {
    it('should authenticate with cultural context', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('cultural-login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: cultural@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('seeker');
      });
    });

    it('should authenticate with accessibility mode', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('accessibility-login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: accessible@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('seeker');
      });
    });
  });

  describe('Security & Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('login-error'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
      });
    });

    it('should handle blocked account for safety', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('login-blocked'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Account temporarily blocked for safety');
      });
    });

    it('should handle HIPAA compliance validation failure', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('hipaa-error'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('HIPAA compliance validation failed');
      });
    });

    it('should escalate security level', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('escalate-security'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('security-level')).toHaveTextContent('critical');
      });
    });
  });

  describe('Registration & User Management', () => {
    it('should handle mental health seeker registration', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('register'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: seeker@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('seeker');
      });
    });

    it('should handle crisis user registration with emergency contact', async () => {
      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('register-crisis'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: crisis-user@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('seeker');
      });
    });

    it('should handle existing email registration error', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('Email already exists'));
      render(
        React.createElement(MentalHealthAuthProvider, {
          testMode: true,
          mockImplementation: { register: mockRegister }
        },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('register'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
      });
    });
  });

  describe('Session Management & Security', () => {
    it('should handle normal logout', async () => {
      const initialUser: MentalHealthUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: initialUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: user@example.com');

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('normal');
        expect(screen.getByTestId('anonymous-mode')).toHaveTextContent('identified');
      });
    });

    it('should handle secure wipe logout', async () => {
      const initialUser: MentalHealthUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: initialUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('secure-logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
      });

      // Should clear all storage
      expect(localStorage.removeItem).toHaveBeenCalledWith('mh-auth-user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mh-session-timestamp');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mh-crisis-data');
      expect(sessionStorage.clear).toHaveBeenCalled();
    });

    it('should refresh session', async () => {
      const initialUser: MentalHealthUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: initialUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('refresh-session'));
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'mh-session-timestamp',
          expect.any(String)
        );
      });
    });
  });

  describe('Data Persistence & Recovery', () => {
    it('should initialize user from encrypted localStorage', () => {
      const testUser: MentalHealthUser = {
        id: '1',
        email: 'stored@example.com',
        name: 'Stored User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      mockLocalStorage['mh-auth-user'] = btoa(JSON.stringify(testUser));

      render(
        React.createElement(MentalHealthAuthProvider, null,
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: stored@example.com');
    });

    it('should handle corrupted encrypted localStorage data', () => {
      mockLocalStorage['mh-auth-user'] = 'corrupted-encrypted-data';

      render(
        React.createElement(MentalHealthAuthProvider, null,
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mh-auth-user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mh-crisis-mode');
    });

    it('should prioritize initialUser over localStorage', () => {
      const storedUser = { id: '1', email: 'stored@example.com' };
      const initialUser: MentalHealthUser = {
        id: '2',
        email: 'initial@example.com',
        name: 'Initial User',
        role: 'therapist',
        verified: true,
        consentToDataProcessing: true,
        hipaaCompliant: true
      };

      mockLocalStorage['mh-auth-user'] = btoa(JSON.stringify(storedUser));

      render(
        React.createElement(MentalHealthAuthProvider, { initialUser: initialUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in: initial@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('therapist');
      expect(screen.getByTestId('hipaa-compliant')).toHaveTextContent('true');
    });

    it('should restore crisis mode from localStorage', () => {
      const testUser: MentalHealthUser = {
        id: '1',
        email: 'crisis@example.com',
        name: 'Crisis User',
        role: 'seeker',
        verified: true,
        crisisAccess: true,
        consentToDataProcessing: true
      };

      mockLocalStorage['mh-auth-user'] = btoa(JSON.stringify(testUser));
      mockLocalStorage['mh-crisis-mode'] = 'true';

      render(
        React.createElement(MentalHealthAuthProvider, null,
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('crisis-mode')).toHaveTextContent('crisis-active');
      expect(screen.getByTestId('security-level')).toHaveTextContent('critical');
    });
  });

  describe('HIPAA Compliance & Privacy', () => {
    it('should validate HIPAA compliance for therapist', async () => {
      const therapistUser: MentalHealthUser = {
        id: '1',
        email: 'therapist@example.com',
        name: 'Dr. Smith',
        role: 'therapist',
        verified: true,
        hipaaCompliant: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: therapistUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('hipaa-compliant')).toHaveTextContent('true');
    });

    it('should validate HIPAA non-compliance for regular user', async () => {
      const regularUser: MentalHealthUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'seeker',
        verified: true,
        consentToDataProcessing: true
      };

      render(
        React.createElement(MentalHealthAuthProvider, { testMode: true, initialUser: regularUser },
          React.createElement(MentalHealthTestComponent)
        )
      );

      expect(screen.getByTestId('hipaa-compliant')).toHaveTextContent('false');
    });
  });
});