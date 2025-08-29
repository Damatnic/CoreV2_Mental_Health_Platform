/**
 * Simple Authentication Context
 *
 * React context for managing basic authentication state and operations.
 * Provides user authentication, registration, and session management
 * with simple token-based authentication.
 */

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';

// Types for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  preferences?: Record<string, any>;
  lastLogin?: number;
  createdAt?: number;
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  userToken: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export interface AuthProviderProps {
  children: ReactNode;
  enablePersistence?: boolean;
  tokenStorageKey?: string;
  userStorageKey?: string;
  onAuthStateChange?: (isAuthenticated: boolean, user: User | null) => void;
}

// Default context value
const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  userToken: null,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  updateUser: async () => {},
  refreshToken: async () => false,
  hasRole: () => false,
  hasPermission: () => false
};

// Create context
const SimpleAuthContext = createContext<AuthContextType>(defaultAuthContext);

// Mock authentication service
class SimpleAuthService {
  private static instance: SimpleAuthService;
  private users: Map<string, { user: User; password: string; token: string }> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  static getInstance(): SimpleAuthService {
    if (!SimpleAuthService.instance) {
      SimpleAuthService.instance = new SimpleAuthService();
    }
    return SimpleAuthService.instance;
  }

  private constructor() {
    // Initialize with demo users
    this.initializeDemoUsers();
  }

  private initializeDemoUsers(): void {
    const demoUsers = [
      {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'user',
        password: 'demo123'
      },
      {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        password: 'admin123'
      },
      {
        id: 'helper-1',
        email: 'helper@example.com',
        name: 'Helper User',
        role: 'helper',
        password: 'helper123'
      }
    ];

    demoUsers.forEach(userData => {
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Random date in last 30 days
      };
      
      const token = this.generateToken();
      this.users.set(userData.email, { user, password: userData.password, token });
    });
  }

  private generateToken(): string {
    return 'tok_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateUserId(): string {
    return 'usr_' + Math.random().toString(36).substr(2, 9);
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const userData = this.users.get(email);
    if (!userData || userData.password !== password) {
      return null;
    }

    // Update last login
    userData.user.lastLogin = Date.now();
    
    // Create session
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(userData.token, { userId: userData.user.id, expiresAt });

    return { user: userData.user, token: userData.token };
  }

  async register(email: string, password: string, name: string, role: string = 'user'): Promise<{ user: User; token: string } | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    // Create new user
    const user: User = {
      id: this.generateUserId(),
      email,
      name,
      role,
      createdAt: Date.now()
    };

    const token = this.generateToken();
    this.users.set(email, { user, password, token });

    // Create session
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(token, { userId: user.id, expiresAt });

    return { user, token };
  }

  async validateToken(token: string): Promise<User | null> {
    const session = this.sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      // Clean up expired session
      if (session) {
        this.sessions.delete(token);
      }
      return null;
    }

    // Find user by token
    for (const [email, userData] of this.users.entries()) {
      if (userData.token === token) {
        return userData.user;
      }
    }

    return null;
  }

  async updateUser(token: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.validateToken(token);
    if (!user) {
      return null;
    }

    // Find and update user
    for (const [email, userData] of this.users.entries()) {
      if (userData.user.id === user.id) {
        userData.user = { ...userData.user, ...updates };
        return userData.user;
      }
    }

    return null;
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async refreshToken(oldToken: string): Promise<{ user: User; token: string } | null> {
    const user = await this.validateToken(oldToken);
    if (!user) {
      return null;
    }

    // Generate new token
    const newToken = this.generateToken();
    
    // Update user's token
    for (const [email, userData] of this.users.entries()) {
      if (userData.user.id === user.id) {
        userData.token = newToken;
        break;
      }
    }

    // Remove old session and create new one
    this.sessions.delete(oldToken);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(newToken, { userId: user.id, expiresAt });

    return { user, token: newToken };
  }
}

/**
 * Simple Authentication Provider
 */
export const SimpleAuthProvider: React.FC<AuthProviderProps> = ({
  children,
  enablePersistence = true,
  tokenStorageKey = 'auth_token',
  userStorageKey = 'auth_user',
  onAuthStateChange
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  const authService = useMemo(() => SimpleAuthService.getInstance(), []);

  /**
   * Save authentication state to storage
   */
  const saveToStorage = useCallback((token: string | null, userData: User | null): void => {
    if (!enablePersistence) return;

    try {
      if (token && userData) {
        localStorage.setItem(tokenStorageKey, token);
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
      } else {
        localStorage.removeItem(tokenStorageKey);
        localStorage.removeItem(userStorageKey);
      }
    } catch (error) {
      console.warn('Failed to save auth state to storage:', error);
    }
  }, [enablePersistence, tokenStorageKey, userStorageKey]);

  /**
   * Load authentication state from storage
   */
  const loadFromStorage = useCallback((): { token: string | null; user: User | null } => {
    if (!enablePersistence) {
      return { token: null, user: null };
    }

    try {
      const token = localStorage.getItem(tokenStorageKey);
      const userStr = localStorage.getItem(userStorageKey);
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    } catch (error) {
      console.warn('Failed to load auth state from storage:', error);
      return { token: null, user: null };
    }
  }, [enablePersistence, tokenStorageKey, userStorageKey]);

  /**
   * Update authentication state
   */
  const updateAuthState = useCallback((
    authenticated: boolean, 
    userData: User | null, 
    token: string | null
  ): void => {
    setIsAuthenticated(authenticated);
    setUser(userData);
    setUserToken(token);
    saveToStorage(token, userData);
    onAuthStateChange?.(authenticated, userData);
  }, [saveToStorage, onAuthStateChange]);

  /**
   * Login user
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.login(email, password);
      
      if (result) {
        updateAuthState(true, result.user, result.token);
        return true;
      } else {
        updateAuthState(false, null, null);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      updateAuthState(false, null, null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authService, updateAuthState]);

  /**
   * Register new user
   */
  const register = useCallback(async (
    email: string, 
    password: string, 
    name: string, 
    role: string = 'user'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.register(email, password, name, role);
      
      if (result) {
        updateAuthState(true, result.user, result.token);
        return true;
      } else {
        updateAuthState(false, null, null);
        return false;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      updateAuthState(false, null, null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authService, updateAuthState]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (userToken) {
        await authService.logout(userToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      updateAuthState(false, null, null);
    }
  }, [authService, userToken, updateAuthState]);

  /**
   * Update user profile
   */
  const updateUser = useCallback(async (updates: Partial<User>): Promise<void> => {
    if (!userToken) {
      throw new Error('No authentication token');
    }

    try {
      const updatedUser = await authService.updateUser(userToken, updates);
      if (updatedUser) {
        updateAuthState(true, updatedUser, userToken);
      }
    } catch (error) {
      console.error('User update failed:', error);
      throw error;
    }
  }, [authService, userToken, updateAuthState]);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!userToken) {
      return false;
    }

    try {
      const result = await authService.refreshToken(userToken);
      if (result) {
        updateAuthState(true, result.user, result.token);
        return true;
      } else {
        updateAuthState(false, null, null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      updateAuthState(false, null, null);
      return false;
    }
  }, [authService, userToken, updateAuthState]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user has specific permission (simplified role-based)
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics'],
      helper: ['read', 'write', 'help_users', 'view_sessions'],
      user: ['read', 'write_own']
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  }, [user]);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token, user: storedUser } = loadFromStorage();
        
        if (token && storedUser) {
          // Validate stored token
          const validUser = await authService.validateToken(token);
          if (validUser) {
            updateAuthState(true, validUser, token);
          } else {
            updateAuthState(false, null, null);
          }
        } else {
          updateAuthState(false, null, null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        updateAuthState(false, null, null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService, loadFromStorage, updateAuthState]);

  // Auto-refresh token periodically
  useEffect(() => {
    if (!isAuthenticated || !userToken) return;

    const refreshInterval = setInterval(() => {
      refreshToken().catch(console.error);
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, userToken, refreshToken]);

  const contextValue: AuthContextType = useMemo(() => ({
    isAuthenticated,
    user,
    isLoading,
    userToken,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    hasRole,
    hasPermission
  }), [
    isAuthenticated,
    user,
    isLoading,
    userToken,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    hasRole,
    hasPermission
  ]);

  return (
    <SimpleAuthContext.Provider value={contextValue}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useSimpleAuth = (): AuthContextType => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export default SimpleAuthContext;
