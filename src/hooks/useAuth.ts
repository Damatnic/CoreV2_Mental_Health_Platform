/**
 * Authentication Hook - Minimal Viable Version
 * Provides authentication state and methods integrated with globalStore
 */

import { useCallback, useEffect, useMemo } from 'react';
import useGlobalStore from '../stores/globalStore';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: 'user' | 'helper' | 'admin' | 'moderator';
  isVerified: boolean;
  createdAt?: number;
  lastLogin?: number;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthMethods {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData?: Partial<AuthUser>) => Promise<boolean>;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearError: () => void;
}

export type UseAuthReturn = AuthState & AuthMethods;

/**
 * useAuth Hook - Provides authentication functionality
 * Integrated with globalStore for state persistence
 */
export const useAuth = (): UseAuthReturn => {
  // Get auth state and actions from global store
  const {
    user,
    isAuthenticated,
    authLoading: loading,
    authError: error,
    setUser,
    updateUser: updateGlobalUser,
    setAuthLoading,
    setAuthError,
    login: globalLogin,
    logout: globalLogout
  } = useGlobalStore();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          logger.info('Auth restored from storage', { userId: userData.id });
        }
      } catch (error) {
        logger.error('Failed to restore auth', error);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [setUser, setAuthLoading]);

  // Login method
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      // Use global store login (includes mock for demo)
      const success = await globalLogin(email, password);
      
      if (success) {
        // Store auth data in localStorage
        const currentUser = useGlobalStore.getState().user;
        if (currentUser) {
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
          localStorage.setItem('auth_token', 'demo_token_' + Date.now());
        }
        
        logger.info('Login successful', { email });
      }
      
      return success;
    } catch (error) {
      logger.error('Login failed', error);
      setAuthError('Login failed. Please check your credentials.');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [globalLogin, setAuthLoading, setAuthError]);

  // Register method
  const register = useCallback(async (
    email: string,
    password: string,
    userData?: Partial<AuthUser>
  ): Promise<boolean> => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      // Mock registration for MVP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: AuthUser = {
        id: 'user_' + Date.now(),
        email,
        name: userData?.name || email.split('@')[0],
        username: userData?.username || email.split('@')[0],
        role: userData?.role || 'user',
        isVerified: false,
        createdAt: Date.now(),
        ...userData
      };
      
      setUser(newUser as any);
      
      // Store in localStorage
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      localStorage.setItem('auth_token', 'demo_token_' + Date.now());
      
      logger.info('Registration successful', { email });
      return true;
    } catch (error) {
      logger.error('Registration failed', error);
      setAuthError('Registration failed. Please try again.');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [setUser, setAuthLoading, setAuthError]);

  // Logout method
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthLoading(true);
      
      // Clear localStorage
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      
      // Use global logout
      await globalLogout();
      
      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout error', error);
    } finally {
      setAuthLoading(false);
    }
  }, [globalLogout, setAuthLoading]);

  // Update user method
  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    updateGlobalUser(updates as any);
    
    // Update localStorage
    const currentUser = useGlobalStore.getState().user;
    if (currentUser) {
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }
  }, [updateGlobalUser]);

  // Clear error method
  const clearError = useCallback(() => {
    setAuthError(null);
  }, [setAuthError]);

  // Memoize return value
  const authReturn = useMemo<UseAuthReturn>(() => ({
    user: user as AuthUser | null,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError
  }), [
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError
  ]);

  return authReturn;
};

// Export default for backwards compatibility
export default useAuth;