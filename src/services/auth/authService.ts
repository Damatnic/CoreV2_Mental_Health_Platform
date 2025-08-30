import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

// Browser-compatible EventEmitter implementation
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

// Types for authentication service
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'patient' | 'therapist' | 'admin' | 'moderator';
  isAnonymous: boolean;
  verified: boolean;
  preferences: UserPreferences;
  profile?: UserProfile;
  createdAt: Date;
  lastLoginAt?: Date;
  isOnline?: boolean;
  twoFactorEnabled?: boolean;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  refreshTokens?: string[];
  lastPasswordChange?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
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
  hipaaConsent?: boolean;
  dataProcessingConsent?: boolean;
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
  licenseNumber?: string;
  specializations?: string[];
}

export interface EmergencyInfo {
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyInstructions?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  acceptTerms: boolean;
  acceptHipaa?: boolean;
  isAnonymous?: boolean;
  role?: 'patient' | 'therapist';
}

export interface OAuthProvider {
  name: 'google' | 'apple' | 'facebook' | 'microsoft';
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string[];
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorage: 'localStorage' | 'sessionStorage' | 'memory' | 'secure';
  refreshThreshold: number; // minutes before expiry to refresh
  sessionTimeout: number; // minutes of inactivity
  anonymousSupported: boolean;
  twoFactorEnabled: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    preventCommon: boolean;
  };
  oauthProviders: OAuthProvider[];
  hipaaCompliant: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: TokenPair | null;
  isLoading: boolean;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
  requiresTwoFactor: boolean;
  tempUserId?: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
  requiresTwoFactor?: boolean;
  twoFactorSetup?: TwoFactorSetup;
}

// Secure token storage implementation
class SecureTokenStorage {
  private tokens: Map<string, string> = new Map();
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  // Encrypt token before storage
  private encrypt(token: string): string {
    // In production, use proper encryption library like crypto-js
    return btoa(token); // Simple base64 for demo
  }

  // Decrypt token after retrieval
  private decrypt(encryptedToken: string): string {
    return atob(encryptedToken);
  }

  set(key: string, token: string): void {
    const encrypted = this.encrypt(token);
    
    // Try secure storage first
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        // Use IndexedDB for secure storage
        localStorage.setItem(`secure_${key}`, encrypted);
      } catch {
        // Fallback to memory storage
        this.tokens.set(key, encrypted);
      }
    } else {
      this.tokens.set(key, encrypted);
    }
  }

  get(key: string): string | null {
    let encrypted: string | null = null;
    
    if (typeof window !== 'undefined') {
      encrypted = localStorage.getItem(`secure_${key}`);
    }
    
    if (!encrypted) {
      encrypted = this.tokens.get(key) || null;
    }
    
    return encrypted ? this.decrypt(encrypted) : null;
  }

  remove(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`secure_${key}`);
    }
    this.tokens.delete(key);
  }

  clear(): void {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          localStorage.removeItem(key);
        }
      });
    }
    this.tokens.clear();
  }
}

// Default configuration
const DEFAULT_CONFIG: AuthConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.mentalhealthapp.com',
  tokenStorage: 'secure',
  refreshThreshold: 15, // 15 minutes
  sessionTimeout: 60, // 1 hour
  anonymousSupported: true,
  twoFactorEnabled: true,
  maxLoginAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  jwtSecret: import.meta.env.JWT_SECRET || 'astral-core-jwt-secret-min-32-characters-long',
  jwtExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  passwordRequirements: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    preventCommon: true
  },
  oauthProviders: [
    {
      name: 'google',
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/google/callback`,
      scope: ['openid', 'profile', 'email']
    },
    {
      name: 'apple',
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/apple/callback`,
      scope: ['name', 'email']
    }
  ],
  hipaaCompliant: true
};

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', '123456', 'password123', 'admin', 'letmein', 
  'qwerty', 'abc123', 'monkey', 'dragon', 'master'
];

/**
 * Enhanced Authentication Service with full security features
 */
export class AuthService extends EventEmitter {
  private config: AuthConfig;
  private state: AuthState;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private sessionTimer?: ReturnType<typeof setTimeout>;
  private activityTimer?: ReturnType<typeof setTimeout>;
  private tokenStorage: SecureTokenStorage;
  private refreshTokenRotation: Map<string, number> = new Map();

  constructor(config: Partial<AuthConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokenStorage = new SecureTokenStorage(this.config.jwtSecret);
    this.state = {
      isAuthenticated: false,
      user: null,
      tokens: null,
      isLoading: false,
      lastActivity: null,
      sessionExpiry: null,
      requiresTwoFactor: false
    };

    this.initializeAuth();
    this.setupActivityTracking();
    this.setupSecurityHeaders();
  }

  /**
   * Initialize authentication from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      const accessToken = this.tokenStorage.get('access_token');
      const refreshToken = this.tokenStorage.get('refresh_token');

      if (accessToken && refreshToken) {
        // Verify token and get user data
        const decoded = this.verifyJWT(accessToken);
        
        if (decoded && !this.isTokenExpired(decoded)) {
          const user = await this.fetchUserProfile(decoded.userId);
          if (user) {
            this.setAuthState(user, { 
              accessToken, 
              refreshToken,
              expiresIn: decoded.exp - Math.floor(Date.now() / 1000),
              tokenType: 'Bearer'
            });
            this.startTokenRefreshTimer();
            this.startSessionTimer();
          }
        } else {
          // Token expired, try refresh
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
      // Check for account lockout
      const lockoutCheck = await this.checkAccountLockout(credentials.email);
      if (lockoutCheck.isLocked) {
        throw new Error(`Account locked. Try again in ${lockoutCheck.minutesRemaining} minutes.`);
      }

      // Hash password before sending (additional client-side security)
      const hashedPassword = await this.hashPassword(credentials.password);
      
      const response = await this.makeAuthRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: hashedPassword,
          rememberMe: credentials.rememberMe,
          twoFactorCode: credentials.twoFactorCode
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle failed login attempts
        if (response.status === 401) {
          await this.incrementFailedAttempts(credentials.email);
        }
        
        // Handle 2FA requirement
        if (response.status === 428 && error.requiresTwoFactor) {
          this.state.requiresTwoFactor = true;
          this.state.tempUserId = error.userId;
          this.emit('auth:2fa-required');
          throw new Error('Two-factor authentication required');
        }
        
        throw new Error(error.message || 'Login failed');
      }

      const authData: AuthResponse = await response.json();
      
      // Validate response
      this.validateAuthResponse(authData);
      
      // Reset failed attempts on successful login
      await this.resetFailedAttempts(credentials.email);
      
      // Set auth state
      this.setAuthState(authData.user, authData.tokens);
      
      // Store tokens based on remember me
      if (credentials.rememberMe) {
        this.storeTokens(authData.tokens);
      }
      
      // Start timers
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      // Emit events
      this.emit('auth:login', authData.user);
      this.trackActivity();
      
      // Audit log for HIPAA compliance
      await this.auditLog('LOGIN', authData.user.id, { email: credentials.email });
      
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
   * Complete two-factor authentication
   */
  async completeTwoFactorAuth(code: string): Promise<User> {
    if (!this.state.tempUserId) {
      throw new Error('No pending 2FA authentication');
    }

    try {
      const response = await this.makeAuthRequest('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          userId: this.state.tempUserId,
          code
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '2FA verification failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.tokens);
      this.storeTokens(authData.tokens);
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      this.state.requiresTwoFactor = false;
      this.state.tempUserId = undefined;
      
      this.emit('auth:login', authData.user);
      await this.auditLog('2FA_LOGIN', authData.user.id);
      
      return authData.user;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactorAuth(): Promise<TwoFactorSetup> {
    if (!this.state.user) {
      throw new Error('No authenticated user');
    }

    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Astral Core (${this.state.user.email})`,
        issuer: 'Astral Core Mental Health',
        length: 32
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Save to server
      const response = await this.makeAuthRequest('/auth/2fa/setup', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          secret: secret.base32,
          backupCodes: await Promise.all(backupCodes.map(code => this.hashPassword(code)))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      await this.auditLog('2FA_SETUP', this.state.user.id);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes
      };
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactorAuth(password: string): Promise<void> {
    if (!this.state.user) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthRequest('/auth/2fa/disable', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          password: await this.hashPassword(password)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      this.state.user.twoFactorEnabled = false;
      await this.auditLog('2FA_DISABLED', this.state.user.id);
      
      this.emit('auth:2fa-disabled');
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
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
      
      // Check for common passwords
      if (this.config.passwordRequirements.preventCommon) {
        const passwordLower = userData.password.toLowerCase();
        if (COMMON_PASSWORDS.some(common => passwordLower.includes(common))) {
          throw new Error('Password is too common. Please choose a stronger password.');
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      const response = await this.makeAuthRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          password: hashedPassword,
          preferences: this.getDefaultPreferences(),
          hipaaConsent: userData.acceptHipaa || false,
          role: userData.role || 'patient'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.tokens);
      this.storeTokens(authData.tokens);
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      // Send verification email
      await this.sendVerificationEmail(authData.user.email);
      
      this.emit('auth:register', authData.user);
      this.trackActivity();
      
      await this.auditLog('REGISTER', authData.user.id, { email: userData.email });
      
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
   * OAuth login
   */
  async loginWithOAuth(provider: 'google' | 'apple' | 'facebook' | 'microsoft'): Promise<void> {
    const oauthConfig = this.config.oauthProviders.find(p => p.name === provider);
    
    if (!oauthConfig) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

    try {
      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: oauthConfig.clientId,
        redirect_uri: oauthConfig.redirectUri,
        scope: oauthConfig.scope.join(' '),
        response_type: 'code',
        state: this.generateStateToken(),
        nonce: this.generateNonce()
      });

      let authUrl: string;
      switch (provider) {
        case 'google':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
          break;
        case 'apple':
          authUrl = `https://appleid.apple.com/auth/authorize?${params}&response_mode=form_post`;
          break;
        case 'facebook':
          authUrl = `https://www.facebook.com/v12.0/dialog/oauth?${params}`;
          break;
        case 'microsoft':
          authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
          break;
        default:
          throw new Error('Unsupported OAuth provider');
      }

      // Store state for validation
      sessionStorage.setItem('oauth_state', params.get('state')!);
      sessionStorage.setItem('oauth_nonce', params.get('nonce')!);

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(provider: string, code: string, state: string): Promise<User> {
    try {
      // Validate state
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid OAuth state');
      }

      const response = await this.makeAuthRequest(`/auth/oauth/${provider}/callback`, {
        method: 'POST',
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        throw new Error('OAuth authentication failed');
      }

      const authData: AuthResponse = await response.json();
      
      this.setAuthState(authData.user, authData.tokens);
      this.storeTokens(authData.tokens);
      this.startTokenRefreshTimer();
      this.startSessionTimer();
      
      // Clean up
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_nonce');
      
      this.emit('auth:oauth-login', authData.user);
      await this.auditLog('OAUTH_LOGIN', authData.user.id, { provider });
      
      return authData.user;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token with rotation
   */
  async refreshAuthToken(): Promise<string> {
    if (!this.state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Check refresh token rotation limit
      const rotationCount = this.refreshTokenRotation.get(this.state.tokens.refreshToken) || 0;
      if (rotationCount >= 5) {
        throw new Error('Refresh token rotation limit exceeded');
      }

      const response = await this.makeAuthRequest('/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.state.tokens.refreshToken}`
        }
      });

      if (!response.ok) {
        // Refresh failed, logout user
        await this.logout();
        throw new Error('Token refresh failed');
      }

      const authData: AuthResponse = await response.json();
      
      // Update rotation count
      this.refreshTokenRotation.delete(this.state.tokens.refreshToken);
      this.refreshTokenRotation.set(authData.tokens.refreshToken, rotationCount + 1);
      
      this.setAuthState(authData.user, authData.tokens);
      this.storeTokens(authData.tokens);
      
      this.emit('auth:token-refreshed', authData.tokens.accessToken);
      
      return authData.tokens.accessToken;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.state.isLoading = true;
    this.emit('auth:loading', true);

    try {
      if (this.state.tokens?.accessToken) {
        // Notify server of logout
        await this.makeAuthRequest('/auth/logout', {
          method: 'POST',
          headers: this.getAuthHeaders()
        }).catch(console.warn);
        
        await this.auditLog('LOGOUT', this.state.user?.id || 'unknown');
      }
      
      this.emit('auth:logout', this.state.user);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthState();
      this.tokenStorage.clear();
      this.clearTimers();
      this.refreshTokenRotation.clear();
      
      this.state.isLoading = false;
      this.emit('auth:loading', false);
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
          currentPassword: await this.hashPassword(currentPassword),
          newPassword: await this.hashPassword(newPassword)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password change failed');
      }

      await this.auditLog('PASSWORD_CHANGE', this.state.user.id);
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

      await this.auditLog('PASSWORD_RESET_REQUEST', 'unknown', { email });
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
          password: await this.hashPassword(newPassword)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }

      await this.auditLog('PASSWORD_RESET', 'unknown', { token: token.substring(0, 8) });
      this.emit('auth:password-reset');
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string): Promise<void> {
    try {
      const response = await this.makeAuthRequest('/auth/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      this.emit('auth:verification-sent', email);
    } catch (error) {
      console.error('Failed to send verification email:', error);
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
      
      await this.auditLog('EMAIL_VERIFIED', this.state.user?.id || 'unknown');
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.state.user) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthRequest('/auth/profile', {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }

      const updatedUser: User = await response.json();
      
      // Update local state
      this.state.user = { ...this.state.user, ...updatedUser };
      
      // Emit update event
      this.emit('auth:profile-updated', this.state.user);
      
      await this.auditLog('PROFILE_UPDATE', this.state.user.id, { fields: Object.keys(userData) });
      
      return this.state.user;
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  // Security helper methods
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  private generateJWT(userId: string, role: string): string {
    return jwt.sign(
      { 
        userId, 
        role,
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateNonce()
      },
      this.config.jwtSecret,
      { 
        expiresIn: this.config.jwtExpiresIn,
        issuer: 'astral-core',
        audience: 'astral-core-app'
      }
    );
  }

  private verifyJWT(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'astral-core',
        audience: 'astral-core-app'
      });
    } catch {
      return null;
    }
  }

  private isTokenExpired(decoded: any): boolean {
    return decoded.exp * 1000 < Date.now();
  }

  private generateStateToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateNonce(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async checkAccountLockout(email: string): Promise<{ isLocked: boolean; minutesRemaining?: number }> {
    try {
      const response = await this.makeAuthRequest(`/auth/lockout-status/${encodeURIComponent(email)}`, {
        method: 'GET'
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fail open
    }
    
    return { isLocked: false };
  }

  private async incrementFailedAttempts(email: string): Promise<void> {
    try {
      await this.makeAuthRequest('/auth/failed-attempt', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch {
      // Fail silently
    }
  }

  private async resetFailedAttempts(email: string): Promise<void> {
    try {
      await this.makeAuthRequest('/auth/reset-attempts', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch {
      // Fail silently
    }
  }

  private validateAuthResponse(response: AuthResponse): void {
    if (!response.user || !response.tokens) {
      throw new Error('Invalid authentication response');
    }
    
    if (!response.tokens.accessToken || !response.tokens.refreshToken) {
      throw new Error('Invalid token response');
    }
  }

  private async auditLog(action: string, userId: string, metadata?: any): Promise<void> {
    if (!this.config.hipaaCompliant) return;
    
    try {
      await this.makeAuthRequest('/audit/log', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action,
          userId,
          timestamp: new Date().toISOString(),
          metadata,
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent
        })
      });
    } catch {
      // Audit logging should not break auth flow
      console.error('Failed to create audit log');
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private setupSecurityHeaders(): void {
    if (typeof window === 'undefined') return;
    
    // Add security headers via meta tags
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];
    
    securityHeaders.forEach(header => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    });
  }

  private async fetchUserProfile(userId: string): Promise<User | null> {
    try {
      const response = await this.makeAuthRequest(`/auth/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
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
    return this.state.tokens?.accessToken || null;
  }

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get sessionTimeRemaining(): number {
    if (!this.state.sessionExpiry) return 0;
    return Math.max(0, this.state.sessionExpiry.getTime() - Date.now());
  }

  get requiresTwoFactor(): boolean {
    return this.state.requiresTwoFactor;
  }

  // Private methods
  private async makeAuthRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Request-ID': this.generateNonce()
    };

    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: 'include' // Include cookies for CSRF protection
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.state.tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${this.state.tokens.accessToken}`;
    }
    
    return headers;
  }

  private setAuthState(user: User, tokens: TokenPair): void {
    this.state.isAuthenticated = true;
    this.state.user = user;
    this.state.tokens = tokens;
    this.state.sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000);
    this.trackActivity();
  }

  private clearAuthState(): void {
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.tokens = null;
    this.state.sessionExpiry = null;
    this.state.lastActivity = null;
    this.state.requiresTwoFactor = false;
    this.state.tempUserId = undefined;
  }

  private storeTokens(tokens: TokenPair): void {
    this.tokenStorage.set('access_token', tokens.accessToken);
    this.tokenStorage.set('refresh_token', tokens.refreshToken);
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
        allowAnalytics: false,
        dataRetention: '1y',
        anonymousMode: false,
        hipaaConsent: true,
        dataProcessingConsent: true
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
    
    if (!this.state.tokens) return;
    
    const refreshTime = (this.state.tokens.expiresIn - this.config.refreshThreshold * 60) * 1000;
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAuthToken().catch(console.error);
      }, refreshTime);
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
    this.tokenStorage.clear();
    this.refreshTokenRotation.clear();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;