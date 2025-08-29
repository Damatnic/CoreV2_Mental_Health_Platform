import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';
import authService, { User as AuthServiceUser, LoginCredentials, RegisterData, TwoFactorSetup } from '../services/auth/authService';

// Extended User interface for context
export interface User extends Omit<AuthServiceUser, 'createdAt' | 'lastLoginAt' | 'accountLockedUntil' | 'lastPasswordChange' | 'passwordResetExpires' | 'emailVerificationExpires'> {
  createdAt: string;
  lastLoginAt?: string;
  accountLockedUntil?: string;
  lastPasswordChange?: string;
  passwordResetExpires?: string;
  emailVerificationExpires?: string;
}

// Authentication state interface
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  sessionTimeRemaining: number;
}

// Authentication context interface
export interface AuthContextType extends AuthState {
  // Core authentication
  login: (email: string, password: string, rememberMe?: boolean, twoFactorCode?: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // OAuth
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  handleOAuthCallback: (provider: string, code: string, state: string) => Promise<boolean>;
  
  // Two-factor authentication
  completeTwoFactorAuth: (code: string) => Promise<boolean>;
  setupTwoFactorAuth: () => Promise<TwoFactorSetup | null>;
  disableTwoFactorAuth: (password: string) => Promise<boolean>;
  
  // Password management
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  
  // Email verification
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  
  // User management
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  
  // Utility
  clearError: () => void;
  checkSession: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to convert AuthServiceUser to User
const convertUser = (authUser: AuthServiceUser | null): User | null => {
  if (!authUser) return null;
  
  return {
    ...authUser,
    createdAt: authUser.createdAt instanceof Date ? authUser.createdAt.toISOString() : authUser.createdAt,
    lastLoginAt: authUser.lastLoginAt instanceof Date ? authUser.lastLoginAt.toISOString() : authUser.lastLoginAt,
    accountLockedUntil: authUser.accountLockedUntil instanceof Date ? authUser.accountLockedUntil.toISOString() : authUser.accountLockedUntil,
    lastPasswordChange: authUser.lastPasswordChange instanceof Date ? authUser.lastPasswordChange.toISOString() : authUser.lastPasswordChange,
    passwordResetExpires: authUser.passwordResetExpires instanceof Date ? authUser.passwordResetExpires.toISOString() : authUser.passwordResetExpires,
    emailVerificationExpires: authUser.emailVerificationExpires instanceof Date ? authUser.emailVerificationExpires.toISOString() : authUser.emailVerificationExpires,
  };
};

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    requiresTwoFactor: false,
    sessionTimeRemaining: 0
  });

  // Session time update interval
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        sessionTimeRemaining: authService.sessionTimeRemaining
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      // Set up event listeners
      authService.on('auth:initialized', (isAuthenticated: boolean) => {
        setState(prev => ({
          ...prev,
          isAuthenticated,
          user: convertUser(authService.user),
          loading: false
        }));
      });

      authService.on('auth:loading', (loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
      });

      authService.on('auth:login', (user: AuthServiceUser) => {
        setState(prev => ({
          ...prev,
          user: convertUser(user),
          isAuthenticated: true,
          error: null,
          requiresTwoFactor: false
        }));
        logger.info('User logged in', { userId: user.id }, 'AuthContext');
      });

      authService.on('auth:logout', () => {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          error: null
        }));
        logger.info('User logged out', undefined, 'AuthContext');
      });

      authService.on('auth:error', (error: Error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
        logger.error('Authentication error', error, 'AuthContext');
      });

      authService.on('auth:2fa-required', () => {
        setState(prev => ({
          ...prev,
          requiresTwoFactor: true,
          loading: false
        }));
      });

      authService.on('auth:token-refreshed', () => {
        logger.info('Token refreshed', undefined, 'AuthContext');
      });

      authService.on('auth:session-expired', () => {
        setState(prev => ({
          ...prev,
          error: 'Your session has expired. Please log in again.',
          isAuthenticated: false,
          user: null
        }));
        logger.warn('Session expired', undefined, 'AuthContext');
      });

      authService.on('auth:inactive', () => {
        logger.info('User inactive', undefined, 'AuthContext');
      });

      authService.on('auth:profile-updated', (user: AuthServiceUser) => {
        setState(prev => ({
          ...prev,
          user: convertUser(user)
        }));
      });

      // Initial state from authService
      setState({
        user: convertUser(authService.user),
        loading: authService.isLoading,
        error: null,
        isAuthenticated: authService.isAuthenticated,
        requiresTwoFactor: authService.requiresTwoFactor,
        sessionTimeRemaining: authService.sessionTimeRemaining
      });
    };

    initializeAuth();

    // Cleanup
    return () => {
      authService.removeAllListeners();
    };
  }, []);

  // Login function
  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false,
    twoFactorCode?: string
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const credentials: LoginCredentials = {
        email,
        password,
        rememberMe,
        twoFactorCode
      };
      
      await authService.login(credentials);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Login failed'
      }));
      return false;
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.register(data);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Registration failed'
      }));
      return false;
    }
  }, []);

  // OAuth login functions
  const loginWithGoogle = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.loginWithOAuth('google');
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Google login failed'
      }));
    }
  }, []);

  const loginWithApple = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.loginWithOAuth('apple');
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Apple login failed'
      }));
    }
  }, []);

  const handleOAuthCallback = useCallback(async (
    provider: string, 
    code: string, 
    state: string
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null, loading: true }));
      await authService.handleOAuthCallback(provider, code, state);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'OAuth authentication failed',
        loading: false
      }));
      return false;
    }
  }, []);

  // Two-factor authentication
  const completeTwoFactorAuth = useCallback(async (code: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.completeTwoFactorAuth(code);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || '2FA verification failed'
      }));
      return false;
    }
  }, []);

  const setupTwoFactorAuth = useCallback(async (): Promise<TwoFactorSetup | null> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await authService.setupTwoFactorAuth();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || '2FA setup failed'
      }));
      return null;
    }
  }, []);

  const disableTwoFactorAuth = useCallback(async (password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.disableTwoFactorAuth(password);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to disable 2FA'
      }));
      return false;
    }
  }, []);

  // Password management
  const changePassword = useCallback(async (
    currentPassword: string, 
    newPassword: string
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.changePassword(currentPassword, newPassword);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Password change failed'
      }));
      return false;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.requestPasswordReset(email);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Password reset request failed'
      }));
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (
    token: string, 
    newPassword: string
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.resetPassword(token, newPassword);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Password reset failed'
      }));
      return false;
    }
  }, []);

  // Email verification
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.verifyEmail(token);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Email verification failed'
      }));
      return false;
    }
  }, []);

  const resendVerificationEmail = useCallback(async (): Promise<boolean> => {
    if (!state.user?.email) return false;
    
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.sendVerificationEmail(state.user.email);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to send verification email'
      }));
      return false;
    }
  }, [state.user?.email]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.updateProfile(userData as any);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Profile update failed'
      }));
      return false;
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.refreshAuthToken();
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Token refresh failed'
      }));
      return false;
    }
  }, []);

  // Check session
  const checkSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionTimeRemaining: authService.sessionTimeRemaining
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoize context value
  const contextValue = useMemo((): AuthContextType => ({
    ...state,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithApple,
    handleOAuthCallback,
    completeTwoFactorAuth,
    setupTwoFactorAuth,
    disableTwoFactorAuth,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    updateUser,
    refreshToken,
    checkSession,
    clearError
  }), [
    state,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithApple,
    handleOAuthCallback,
    completeTwoFactorAuth,
    setupTwoFactorAuth,
    disableTwoFactorAuth,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    updateUser,
    refreshToken,
    checkSession,
    clearError
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export context for testing
export { AuthContext };

// Default export
export default AuthProvider;