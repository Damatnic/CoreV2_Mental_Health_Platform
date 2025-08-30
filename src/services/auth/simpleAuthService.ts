/**
 * Simple Authentication Service
 * Integrates with Mock API for immediate functionality
 */

import { mockApiService } from '../api/mockApiService';
import { logger } from '../../utils/logger';

// Type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'therapist' | 'admin';
  avatar?: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  preferences?: any;
  profile?: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: 'patient' | 'therapist';
}

// Event emitter for auth events
class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

class SimpleAuthService extends EventEmitter {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null
  };

  private sessionTimer?: ReturnType<typeof setTimeout>;
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

  constructor() {
    super();
    this.initializeAuth();
  }

  // Initialize auth from localStorage
  private async initializeAuth(): Promise<void> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      const storedToken = localStorage.getItem('astral_auth_token');
      const storedUser = localStorage.getItem('astral_current_user');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        this.state = {
          isAuthenticated: true,
          user,
          token: storedToken,
          isLoading: false,
          error: null
        };
        this.emit('auth:initialized', true);
        this.emit('auth:login', user);
        this.startSessionTimer();
      } else {
        this.state.isLoading = false;
        this.emit('auth:initialized', false);
      }
    } catch (error) {
      logger.error('Failed to initialize auth', error, 'SimpleAuthService');
      this.state.isLoading = false;
      this.emit('auth:initialized', false);
    }

    this.emit('auth:loading', false);
  }

  // Login method
  async login(credentials: LoginCredentials): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    this.emit('auth:loading', true);

    try {
      const response = await mockApiService.login(credentials.email, credentials.password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Update state
        this.state = {
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
          error: null
        };

        // Store in localStorage if remember me
        if (credentials.rememberMe) {
          localStorage.setItem('astral_auth_token', token);
          localStorage.setItem('astral_current_user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('astral_auth_token', token);
          sessionStorage.setItem('astral_current_user', JSON.stringify(user));
        }

        this.emit('auth:login', user);
        this.startSessionTimer();
        
        logger.info('User logged in successfully', { userId: user.id }, 'SimpleAuthService');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      this.state.error = error.message || 'Login failed';
      this.state.isLoading = false;
      this.emit('auth:error', error);
      throw error;
    } finally {
      this.emit('auth:loading', false);
    }
  }

  // Register method
  async register(data: RegisterData): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    this.emit('auth:loading', true);

    try {
      const response = await mockApiService.register(data.email, data.password, {
        name: data.name || data.email.split('@')[0],
        role: data.role || 'patient'
      });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Update state
        this.state = {
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
          error: null
        };

        // Store in localStorage
        localStorage.setItem('astral_auth_token', token);
        localStorage.setItem('astral_current_user', JSON.stringify(user));

        this.emit('auth:login', user);
        this.startSessionTimer();
        
        logger.info('User registered successfully', { userId: user.id }, 'SimpleAuthService');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      this.state.error = error.message || 'Registration failed';
      this.state.isLoading = false;
      this.emit('auth:error', error);
      throw error;
    } finally {
      this.emit('auth:loading', false);
    }
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      await mockApiService.logout();
      
      // Clear state
      this.state = {
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null
      };

      // Clear storage
      localStorage.removeItem('astral_auth_token');
      localStorage.removeItem('astral_current_user');
      sessionStorage.removeItem('astral_auth_token');
      sessionStorage.removeItem('astral_current_user');

      // Clear timer
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
      }

      this.emit('auth:logout');
      
      logger.info('User logged out', undefined, 'SimpleAuthService');
    } catch (error) {
      logger.error('Logout error', error, 'SimpleAuthService');
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<void> {
    if (!this.state.user) {
      throw new Error('No user logged in');
    }

    try {
      const response = await mockApiService.updateProfile(updates);
      
      if (response.success && response.data) {
        this.state.user = response.data;
        
        // Update storage
        const token = localStorage.getItem('astral_auth_token') || sessionStorage.getItem('astral_auth_token');
        if (token) {
          if (localStorage.getItem('astral_auth_token')) {
            localStorage.setItem('astral_current_user', JSON.stringify(response.data));
          } else {
            sessionStorage.setItem('astral_current_user', JSON.stringify(response.data));
          }
        }

        this.emit('auth:profile-updated', response.data);
        
        logger.info('Profile updated', { userId: this.state.user.id }, 'SimpleAuthService');
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error: any) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  // Session management
  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.emit('auth:session-expired');
      this.logout();
    }, this.SESSION_TIMEOUT);
  }

  // Reset session timer on activity
  resetSessionTimer(): void {
    if (this.state.isAuthenticated) {
      this.startSessionTimer();
    }
  }

  // OAuth methods (simplified stubs)
  async loginWithOAuth(provider: 'google' | 'apple'): Promise<void> {
    logger.info(`OAuth login with ${provider} initiated`, undefined, 'SimpleAuthService');
    // In a real app, this would redirect to OAuth provider
    throw new Error('OAuth not implemented in mock service');
  }

  async handleOAuthCallback(provider: string, code: string, state: string): Promise<void> {
    logger.info(`OAuth callback for ${provider}`, { code, state }, 'SimpleAuthService');
    throw new Error('OAuth not implemented in mock service');
  }

  // Two-factor auth (simplified stubs)
  async setupTwoFactorAuth(): Promise<any> {
    logger.info('2FA setup requested', undefined, 'SimpleAuthService');
    return {
      secret: 'MOCK_SECRET',
      qrCode: 'data:image/png;base64,MOCK_QR_CODE',
      backupCodes: ['123456', '234567', '345678']
    };
  }

  async completeTwoFactorAuth(code: string): Promise<void> {
    logger.info('2FA verification', { code }, 'SimpleAuthService');
    // Mock verification always succeeds
    this.emit('auth:2fa-complete');
  }

  async disableTwoFactorAuth(password: string): Promise<void> {
    logger.info('2FA disabled', undefined, 'SimpleAuthService');
  }

  // Password management
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    logger.info('Password change requested', undefined, 'SimpleAuthService');
    // Mock implementation
  }

  async requestPasswordReset(email: string): Promise<void> {
    logger.info('Password reset requested', { email }, 'SimpleAuthService');
    // Mock implementation
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    logger.info('Password reset', { token }, 'SimpleAuthService');
    // Mock implementation
  }

  // Email verification
  async verifyEmail(token: string): Promise<void> {
    logger.info('Email verification', { token }, 'SimpleAuthService');
    if (this.state.user) {
      this.state.user.verified = true;
      this.emit('auth:email-verified');
    }
  }

  async sendVerificationEmail(email: string): Promise<void> {
    logger.info('Verification email sent', { email }, 'SimpleAuthService');
  }

  // Token management
  async refreshAuthToken(): Promise<void> {
    logger.info('Token refresh requested', undefined, 'SimpleAuthService');
    this.emit('auth:token-refreshed');
  }

  async getToken(): Promise<string | null> {
    return this.state.token;
  }

  // Getters
  get user(): User | null {
    return this.state.user;
  }

  get isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get requiresTwoFactor(): boolean {
    return false; // Simplified for mock
  }

  get sessionTimeRemaining(): number {
    return this.SESSION_TIMEOUT / 1000; // Return in seconds
  }
}

// Export singleton instance
export const simpleAuthService = new SimpleAuthService();

// Export for compatibility
export default simpleAuthService;