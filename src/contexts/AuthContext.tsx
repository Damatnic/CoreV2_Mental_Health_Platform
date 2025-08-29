import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';

// User interface
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'helper' | 'admin' | 'moderator';
  isVerified: boolean;
  profile?: {
    avatar?: string;
    bio?: string;
    preferences?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

// Authentication state interface
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Authentication context interface
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, userData?: Partial<User>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
  user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        logger.info('Initializing authentication state', undefined, 'AuthContext');
        
        // Check for existing session in localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: true
          });
          
          logger.info('Authentication restored from storage', { userId: user?.id }, 'AuthContext');
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        logger.error('Failed to initialize authentication', error, 'AuthContext');
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to initialize authentication' 
        }));
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      logger.info('Attempting login', { email }, 'AuthContext');
      
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email,
        username: email.split('@')[0],
        role: 'user',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', 'mock-token-123');
      
      setState({
        user: mockUser,
        loading: false,
        error: null,
        isAuthenticated: true
      });
      
      logger.info('Login successful', { userId: mockUser.id }, 'AuthContext');
      return true;
    } catch (error) {
      logger.error('Login failed', error, 'AuthContext');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Login failed. Please try again.' 
      }));
      return false;
    }
  }, []);

  // Register function
  const register = useCallback(async (
    email: string, 
    password: string, 
    userData: Partial<User> = {}
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      logger.info('Attempting registration', { email }, 'AuthContext');
      
      // Mock registration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email,
        username: userData.username || email.split('@')[0],
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...userData
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', 'mock-token-123');
      
      setState({
        user: mockUser,
        loading: false,
        error: null,
        isAuthenticated: true
      });
      
      logger.info('Registration successful', { userId: mockUser.id }, 'AuthContext');
      return true;
    } catch (error) {
      logger.error('Registration failed', error, 'AuthContext');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Registration failed. Please try again.' 
      }));
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      logger.info('Logging out', { userId: state.user?.id }, 'AuthContext');
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false
      });
      
      logger.info('Logout successful', undefined, 'AuthContext');
    } catch (error) {
      logger.error('Logout failed', error, 'AuthContext');
      // Still clear local state even if server logout fails
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false
      });
    }
  }, [state.user?.id]);

  // Update user
  const updateUser = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!state.user) return false;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Mock update - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...state.user, ...userData };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setState(prev => ({ 
        ...prev, 
        user: updatedUser, 
        loading: false 
      }));
      
      logger.info('User updated', { userId: updatedUser.id }, 'AuthContext');
      return true;
    } catch (error) {
      logger.error('User update failed', error, 'AuthContext');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to update profile' 
      }));
      return false;
    }
  }, [state.user]);

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
    updateUser,
    clearError
  }), [
    state,
    login,
    register,
    logout,
    updateUser,
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
