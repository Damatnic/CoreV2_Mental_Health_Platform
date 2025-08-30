/**
 * Simplified Authentication Hook
 * Direct integration with mock API service for immediate functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { mockApiService, User } from '../services/api/mockApiService';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface UseSimpleAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, profile?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Simple authentication hook that works with mock API
 * This replaces the complex auth context for demo purposes
 */
export const useSimpleAuth = (): UseSimpleAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        const storedUser = localStorage.getItem('astral_current_user');
        const storedToken = localStorage.getItem('astral_auth_token');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          setState({
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          logger.info('Auth initialized from storage', { userId: user.id }, 'useSimpleAuth');
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        logger.error('Failed to initialize auth', error, 'useSimpleAuth');
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    
    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await mockApiService.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('astral_current_user', JSON.stringify(user));
        localStorage.setItem('astral_auth_token', token);
        
        setState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        
        logger.info('Login successful', { userId: user.id }, 'useSimpleAuth');
        return true;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      logger.error('Login failed', error, 'useSimpleAuth');
      return false;
    }
  }, []);

  // Register function
  const register = useCallback(async (
    email: string, 
    password: string, 
    profile?: any
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await mockApiService.register(email, password, {
        name: profile?.name || profile?.firstName || email.split('@')[0],
        ...profile
      });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('astral_current_user', JSON.stringify(user));
        localStorage.setItem('astral_auth_token', token);
        
        setState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        
        logger.info('Registration successful', { userId: user.id }, 'useSimpleAuth');
        return true;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      logger.error('Registration failed', error, 'useSimpleAuth');
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await mockApiService.logout();
      
      // Clear localStorage
      localStorage.removeItem('astral_current_user');
      localStorage.removeItem('astral_auth_token');
      
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
      
      logger.info('Logout successful', undefined, 'useSimpleAuth');
    } catch (error) {
      logger.error('Logout error', error, 'useSimpleAuth');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Update user profile
  const updateUser = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!state.user) {
      setState(prev => ({ ...prev, error: 'No user logged in' }));
      return false;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await mockApiService.updateProfile(updates);
      
      if (response.success && response.data) {
        // Update localStorage
        localStorage.setItem('astral_current_user', JSON.stringify(response.data));
        
        setState(prev => ({
          ...prev,
          user: response.data,
          loading: false
        }));
        
        logger.info('Profile updated', { userId: response.data.id }, 'useSimpleAuth');
        return true;
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      logger.error('Profile update failed', error, 'useSimpleAuth');
      return false;
    }
  }, [state.user]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError
  };
};

// Default export
export default useSimpleAuth;