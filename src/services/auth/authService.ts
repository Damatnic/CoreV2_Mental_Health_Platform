import { EventEmitter } from 'events';

// Types for authentication service
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'therapist' | 'admin' | 'moderator';
  isAnonymous: boolean;
  verified: boolean;
  preferences: UserPreferences;
  profile?: UserProfile;
  createdAt: Date;
  lastLoginAt?: Date;
  isOnline?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  crisisSupport: CrisisSupportSettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  reminders: boolean;
  crisisAlerts: boolean;
  weeklyDigest: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  shareLocation: boolean;
  allowAnalytics: boolean;
  dataRetention: '30d' | '90d' | '1y' | 'indefinite';
  anonymousMode: boolean;
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface CrisisSupportSettings {
  enableDetection: boolean;
  emergencyContacts: EmergencyContact[];
  autoShareLocation: boolean;
  preferredSupportMethod: 'call' | 'text' | 'chat';
  crisisKeywords: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  available24h: boolean;
}

export interface UserProfile {
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  location?: string;
  timezone: string;
  mentalHealthConditions?: string[];
  medications?: string[];
  therapistInfo?: TherapistInfo;
  emergencyInfo?: EmergencyInfo;
}

export interface TherapistInfo {
  name: string;
  phone?: string;
  email?: string;
  practice?: string;
  nextAppointment?: Date;
}

export interface EmergencyInfo {
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyInstructions?: string;
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
  acceptTerms: boolean;
  isAnonymous?: boolean;
}

export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorage: 'localStorage' | 'sessionStorage' | 'memory';
  refreshThreshold: number; // minutes before expiry to refresh
  sessionTimeout: number; // minutes of inactivity
  anonymousSupported: boolean;
  twoFactorEnabled: boolean;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

// Default configuration
const DEFAULT_CONFIG: AuthConfig = {
  apiBaseUrl: process.env.VITE_API_URL || 'https://api.mentalhealthapp.com',
  tokenStorage: 'localStorage',
  refreshThreshold: 15, // 15 minutes
  sessionTimeout: 60, // 1 hour
  anonymousSupported: true,
  twoFactorEnabled: false,
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false
  }
};

/**
 * Authentication Service
 * Handles user authentication, session management, and user preferences
 */
export class AuthService extends EventEmitter {
  private config: AuthConfig;
  private state: AuthState;
  private refreshTimer?: NodeJS.Timeout;
  private sessionTimer?: NodeJS.Timeout;
  private activityTimer?: NodeJS.Timeout;

  constructor(config: Partial<AuthConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      lastActivity: null,
      sessionExpiry: null
    };

    this.initializeAuth();
    this.setupActivityTracking();
  }

  /**
   * Initialize authentication from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      const storedToken = this.getStoredToken();
      const storedRefreshToken = this.getStoredRefreshToken();

      if (storedToken && storedRefreshToken) {
        // Verify token and get user data
        const user = await this.verifyToken(storedToken);
        if (user) {
          this.setAuthState(user, storedToken, storedRefreshToken);
          this.startTokenRefreshTimer();
          this.startSessionTimer();
        } else {
          // Token invalid, try refresh
          await this.refreshAuthToken();
        }
      }
    } catch (error) {
      console.warn('Failed to initialize auth:', error);
      this.clearAuthState();
    } finally {
      this.state.isLoading = false;
      this.emit('auth:loading', false);
      this.emit('auth:initialized', this.state.isAuthenticated);
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      const response = await this.makeAuthRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.token, authData.refreshToken, authData.expiresAt);
      
      if (credentials.rememberMe) {
        this.storeTokens(authData.token, authData.refreshToken);
      }
      
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      this.emit('auth:login', authData.user);
      this.trackActivity();
      
      return authData.user;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    } finally {
      this.state.isLoading = false;
      this.emit('auth:loading', false);
    }
  }

  /**
   * Register new user account
   */
  async register(userData: RegisterData): Promise<User> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      // Validate password requirements
      this.validatePassword(userData.password);

      const response = await this.makeAuthRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          preferences: this.getDefaultPreferences()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.token, authData.refreshToken, authData.expiresAt);
      this.storeTokens(authData.token, authData.refreshToken);
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      this.emit('auth:register', authData.user);
      this.trackActivity();
      
      return authData.user;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    } finally {
      this.state.isLoading = false;
      this.emit('auth:loading', false);
    }
  }

  /**
   * Login as anonymous user
   */
  async loginAnonymously(): Promise<User> {
    if (!this.config.anonymousSupported) {
      throw new Error('Anonymous login not supported');
    }

    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      const response = await this.makeAuthRequest('/auth/anonymous', {
        method: 'POST',
        body: JSON.stringify({
          preferences: this.getDefaultPreferences()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Anonymous login failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.token, authData.refreshToken, authData.expiresAt);
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      this.emit('auth:anonymous-login', authData.user);
      this.trackActivity();
      
      return authData.user;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    } finally {
      this.state.isLoading = false;
      this.emit('auth:loading', false);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      if (this.state.token) {
        // Notify server of logout
        await this.makeAuthRequest('/auth/logout', {
          method: 'POST',
          headers: this.getAuthHeaders()
        }).catch(console.warn); // Don't fail logout on server error
      }
      
      this.emit('auth:logout', this.state.user);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthState();
      this.clearStoredTokens();
      this.clearTimers();
      
      this.state.isLoading = false;
      this.emit('auth:loading', false);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken(): Promise<string> {
    if (!this.state.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.makeAuthRequest('/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.state.refreshToken}`
        }
      });

      if (!response.ok) {
        // Refresh failed, logout user
        await this.logout();
        throw new Error('Token refresh failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.token, authData.refreshToken, authData.expiresAt);
      this.storeTokens(authData.token, authData.refreshToken);
      
      this.emit('auth:token-refreshed', authData.token);
      
      return authData.token;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.state.user) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthRequest('/auth/profile', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }

      const updatedUser: User = await response.json();
      
      this.state.user = updatedUser;
      this.emit('auth:profile-updated', updatedUser);
      
      return updatedUser;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!this.state.user) {
      throw new Error('No authenticated user');
    }

    try {
      const updatedPreferences = {
        ...this.state.user.preferences,
        ...preferences
      };

      const response = await this.makeAuthRequest('/auth/preferences', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updatedPreferences)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Preferences update failed');
      }

      this.state.user.preferences = updatedPreferences;
      this.emit('auth:preferences-updated', updatedPreferences);
      
      return updatedPreferences;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.state.user) {
      throw new Error('No authenticated user');
    }

    // Validate new password
    this.validatePassword(newPassword);

    try {
      const response = await this.makeAuthRequest('/auth/change-password', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password change failed');
      }

      this.emit('auth:password-changed');
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await this.makeAuthRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset request failed');
      }

      this.emit('auth:password-reset-requested', email);
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    this.validatePassword(newPassword);

    try {
      const response = await this.makeAuthRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }

      this.emit('auth:password-reset');
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await this.makeAuthRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Email verification failed');
      }

      if (this.state.user) {
        this.state.user.verified = true;
        this.emit('auth:email-verified', this.state.user);
      }
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  // Getters
  get isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  get user(): User | null {
    return this.state.user;
  }

  get token(): string | null {
    return this.state.token;
  }

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get sessionTimeRemaining(): number {
    if (!this.state.sessionExpiry) return 0;
    return Math.max(0, this.state.sessionExpiry.getTime() - Date.now());
  }

  // Private methods
  private async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await this.makeAuthRequest('/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async makeAuthRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'MentalHealthApp/1.0'
    };

    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }
    
    return headers;
  }

  private setAuthState(user: User, token: string, refreshToken: string, expiresAt?: Date): void {
    this.state.isAuthenticated = true;
    this.state.user = user;
    this.state.token = token;
    this.state.refreshToken = refreshToken;
    this.state.sessionExpiry = expiresAt || new Date(Date.now() + this.config.sessionTimeout * 60 * 1000);
    this.trackActivity();
  }

  private clearAuthState(): void {
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.token = null;
    this.state.refreshToken = null;
    this.state.sessionExpiry = null;
    this.state.lastActivity = null;
  }

  private storeTokens(token: string, refreshToken: string): void {
    const storage = this.config.tokenStorage === 'localStorage' ? localStorage : sessionStorage;
    
    try {
      storage.setItem('auth_token', token);
      storage.setItem('auth_refresh_token', refreshToken);
    } catch (error) {
      console.warn('Failed to store tokens:', error);
    }
  }

  private getStoredToken(): string | null {
    const storage = this.config.tokenStorage === 'localStorage' ? localStorage : sessionStorage;
    return storage.getItem('auth_token');
  }

  private getStoredRefreshToken(): string | null {
    const storage = this.config.tokenStorage === 'localStorage' ? localStorage : sessionStorage;
    return storage.getItem('auth_refresh_token');
  }

  private clearStoredTokens(): void {
    const storage = this.config.tokenStorage === 'localStorage' ? localStorage : sessionStorage;
    storage.removeItem('auth_token');
    storage.removeItem('auth_refresh_token');
  }

  private validatePassword(password: string): void {
    const requirements = this.config.passwordRequirements;
    
    if (password.length < requirements.minLength) {
      throw new Error(`Password must be at least ${requirements.minLength} characters long`);
    }
    
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (requirements.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    if (requirements.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        reminders: true,
        crisisAlerts: true,
        weeklyDigest: false
      },
      privacy: {
        profileVisibility: 'private',
        shareLocation: false,
        allowAnalytics: true,
        dataRetention: '1y',
        anonymousMode: false
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false
      },
      crisisSupport: {
        enableDetection: true,
        emergencyContacts: [],
        autoShareLocation: false,
        preferredSupportMethod: 'call',
        crisisKeywords: []
      }
    };
  }

  private startTokenRefreshTimer(): void {
    this.clearTimers();
    
    if (!this.state.sessionExpiry) return;
    
    const refreshTime = this.state.sessionExpiry.getTime() - (this.config.refreshThreshold * 60 * 1000);
    const delay = refreshTime - Date.now();
    
    if (delay > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAuthToken().catch(console.error);
      }, delay);
    }
  }

  private startSessionTimer(): void {
    const sessionTimeout = this.config.sessionTimeout * 60 * 1000;
    
    this.sessionTimer = setTimeout(() => {
      this.emit('auth:session-expired');
      this.logout();
    }, sessionTimeout);
  }

  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const trackActivity = () => this.trackActivity();
    
    events.forEach(event => {
      window.addEventListener(event, trackActivity, { passive: true });
    });
  }

  private trackActivity(): void {
    this.state.lastActivity = new Date();
    
    // Reset session timer on activity
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.startSessionTimer();
    }
    
    // Clear activity timer
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    // Set new activity timer
    this.activityTimer = setTimeout(() => {
      this.emit('auth:inactive');
    }, 5 * 60 * 1000); // 5 minutes
  }

  private clearTimers(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = undefined;
    }
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = undefined;
    }
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    this.clearTimers();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
