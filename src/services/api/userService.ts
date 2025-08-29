import { EventEmitter } from 'events';

// Types and interfaces
export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName: string;
  avatar?: string;
  isAnonymous: boolean;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  emailVerified: boolean;
  profile: UserProfile;
  preferences: UserPreferences;
  privacy: PrivacySettings;
  subscription?: Subscription;
  stats: UserStats;
  metadata: UserMetadata;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  timezone: string;
  language: string;
  country?: string;
  city?: string;
  bio?: string;
  pronouns?: string;
  emergencyContact?: EmergencyContact;
  therapistInfo?: TherapistInfo;
  mentalHealthConditions?: string[];
  medications?: Medication[];
  goals?: Goal[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
  privacy: 'public' | 'private' | 'friends_only';
  language: string;
  timezone: string;
  soundEffects: boolean;
  animations: boolean;
  autoSave: boolean;
  dataBackup: boolean;
  offlineMode: boolean;
  crisisAlerts: boolean;
  mentorshipProgram: boolean;
  peerSupport: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  dailyReminders: boolean;
  moodCheckIns: boolean;
  journalPrompts: boolean;
  appointmentReminders: boolean;
  crisisAlerts: boolean;
  supportMessages: boolean;
  communityUpdates: boolean;
  weeklyReports: boolean;
  achievementNotifications: boolean;
}

export interface AccessibilityPreferences {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceNavigation: boolean;
  keyboardNavigation: boolean;
  colorBlindFriendly: boolean;
  audioDescriptions: boolean;
  captionPreferences: 'off' | 'on' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  focusIndicators: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showOnlineStatus: boolean;
  shareAnalytics: boolean;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  consentToMarketing: boolean;
  consentToResearch: boolean;
  anonymousUsage: boolean;
  locationTracking: boolean;
  personalizedAds: boolean;
  thirdPartySharing: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface TherapistInfo {
  name?: string;
  email?: string;
  phone?: string;
  practice?: string;
  nextAppointment?: string;
  notes?: string;
  hasConsent: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  notes?: string;
  reminders: boolean;
  sideEffects?: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'mood' | 'anxiety' | 'depression' | 'habits' | 'relationships' | 'career' | 'health';
  targetDate?: string;
  progress: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface Subscription {
  tier: 'free' | 'basic' | 'premium' | 'professional';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  paymentMethod?: string;
  features: string[];
  billingCycle: 'monthly' | 'yearly';
}

export interface UserStats {
  totalLogins: number;
  streakDays: number;
  moodEntries: number;
  journalEntries: number;
  meditationMinutes: number;
  goalsCompleted: number;
  badgesEarned: string[];
  pointsTotal: number;
  level: number;
  joinDate: string;
  lastActiveDate: string;
  avgMoodScore: number;
  totalSessionTime: number;
  featuresUsed: string[];
}

export interface UserMetadata {
  version: string;
  source: string;
  referrer?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  firstTimeUser: boolean;
  hasCompletedTutorial: boolean;
  betaFeatures: string[];
  experiments: Record<string, string>;
  tags: string[];
  notes: string;
}

export interface CreateUserRequest {
  email?: string;
  username?: string;
  displayName: string;
  password?: string;
  isAnonymous: boolean;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  source?: string;
  referrer?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatar?: string;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  privacy?: Partial<PrivacySettings>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export class UserService extends EventEmitter {
  private currentUser: User | null = null;
  private authTokens: AuthTokens | null = null;
  private refreshTimer: any = null;
  private sessionId: string;
  private apiBaseUrl: string;

  constructor(apiBaseUrl?: string) {
    super();
    this.apiBaseUrl = apiBaseUrl || (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) || '/api';
    this.sessionId = this.generateSessionId();
    this.initializeFromStorage();
  }

  // Authentication methods
  async createUser(userData: CreateUserRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await this.makeAuthenticatedRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      const result = await response.json();
      
      this.currentUser = result.user;
      this.authTokens = result.tokens;
      
      this.saveToStorage();
      this.setupTokenRefresh();
      
      this.emit('user_created', this.currentUser);
      this.emit('authenticated', this.currentUser);
      
      return result;
    } catch (error) {
      this.emit('auth_error', error);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch API not available');
      }
      
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      
      this.currentUser = result.user;
      this.authTokens = result.tokens;
      
      this.saveToStorage();
      this.setupTokenRefresh();
      
      this.emit('user_logged_in', this.currentUser);
      this.emit('authenticated', this.currentUser);
      
      return result;
    } catch (error) {
      this.emit('auth_error', error);
      throw error;
    }
  }

  async createAnonymousUser(): Promise<User> {
    try {
      const anonymousUserData: CreateUserRequest = {
        displayName: this.generateAnonymousDisplayName(),
        isAnonymous: true,
        agreeToTerms: true,
        agreeToPrivacy: true,
        source: 'anonymous'
      };

      const result = await this.createUser(anonymousUserData);
      
      this.emit('anonymous_user_created', result.user);
      return result.user;
    } catch (error) {
      this.emit('auth_error', error);
      throw error;
    }
  }

  async convertAnonymousUser(email: string, password: string): Promise<User> {
    if (!this.currentUser || !this.currentUser.isAnonymous) {
      throw new Error('No anonymous user to convert');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/users/convert-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          userId: this.currentUser.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to convert anonymous user');
      }

      const result = await response.json();
      
      this.currentUser = result.user;
      this.authTokens = result.tokens;
      
      this.saveToStorage();
      
      this.emit('user_converted', this.currentUser);
      return this.currentUser;
    } catch (error) {
      this.emit('auth_error', error);
      throw error;
    }
  }

  async logoutUser(): Promise<void> {
    try {
      if (this.authTokens) {
        await this.makeAuthenticatedRequest('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      this.emit('user_logged_out');
    }
  }

  async refreshTokens(): Promise<AuthTokens> {
    if (!this.authTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.authTokens.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const result = await response.json();
      this.authTokens = result.tokens;
      
      this.saveToStorage();
      this.setupTokenRefresh();
      
      this.emit('tokens_refreshed', this.authTokens);
      return this.authTokens;
    } catch (error) {
      this.clearAuthData();
      this.emit('auth_error', error);
      throw error;
    }
  }

  // User management methods
  async getCurrentUser(): Promise<User | null> {
    if (!this.currentUser) {
      return null;
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/users/${this.currentUser.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      this.currentUser = await response.json();
      this.saveToStorage();
      
      return this.currentUser;
    } catch (error) {
      this.emit('fetch_error', error);
      throw error;
    }
  }

  async updateUser(updates: UpdateUserRequest): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/users/${this.currentUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      this.currentUser = await response.json();
      this.saveToStorage();
      
      this.emit('user_updated', this.currentUser);
      return this.currentUser;
    } catch (error) {
      this.emit('update_error', error);
      throw error;
    }
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const updatedUser = await this.updateUser({ preferences });
    
    this.emit('preferences_updated', updatedUser.preferences);
    return updatedUser.preferences;
  }

  async updatePrivacySettings(privacy: Partial<PrivacySettings>): Promise<PrivacySettings> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const updatedUser = await this.updateUser({ privacy });
    
    this.emit('privacy_updated', updatedUser.privacy);
    return updatedUser.privacy;
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const updatedUser = await this.updateUser({ profile });
    
    this.emit('profile_updated', updatedUser.profile);
    return updatedUser.profile;
  }

  async uploadAvatar(file: File): Promise<string> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await this.makeAuthenticatedRequest(`/users/${this.currentUser.id}/avatar`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let browser set it for FormData
        headers: undefined
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const result = await response.json();
      const avatarUrl = result.avatarUrl;

      // Update current user
      if (this.currentUser) {
        this.currentUser.avatar = avatarUrl;
        this.saveToStorage();
      }

      this.emit('avatar_updated', avatarUrl);
      return avatarUrl;
    } catch (error) {
      this.emit('upload_error', error);
      throw error;
    }
  }

  async deleteUser(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/users/${this.currentUser.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete user account');
      }

      this.clearAuthData();
      this.emit('user_deleted');
    } catch (error) {
      this.emit('delete_error', error);
      throw error;
    }
  }

  // Emergency contacts
  async addEmergencyContact(contact: Omit<EmergencyContact, 'isPrimary'>): Promise<EmergencyContact> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/users/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify(contact)
      });

      if (!response.ok) {
        throw new Error('Failed to add emergency contact');
      }

      const newContact = await response.json();
      
      if (this.currentUser.profile.emergencyContact) {
        // If this is the first contact, make it primary
        if (!this.currentUser.profile.emergencyContact) {
          newContact.isPrimary = true;
        }
      }

      this.emit('emergency_contact_added', newContact);
      return newContact;
    } catch (error) {
      this.emit('contact_error', error);
      throw error;
    }
  }

  // Goals management
  async createGoal(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>): Promise<Goal> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/users/goals', {
        method: 'POST',
        body: JSON.stringify(goalData)
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const newGoal = await response.json();
      this.emit('goal_created', newGoal);
      return newGoal;
    } catch (error) {
      this.emit('goal_error', error);
      throw error;
    }
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/users/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      this.emit('goal_updated', updatedGoal);
      return updatedGoal;
    } catch (error) {
      this.emit('goal_error', error);
      throw error;
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/users/goals/${goalId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      this.emit('goal_deleted', goalId);
    } catch (error) {
      this.emit('goal_error', error);
      throw error;
    }
  }

  // Data export and privacy
  async exportUserData(): Promise<Blob> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/users/export-data');

      if (!response.ok) {
        throw new Error('Failed to export user data');
      }

      const blob = await response.blob();
      this.emit('data_exported', blob.size);
      return blob;
    } catch (error) {
      this.emit('export_error', error);
      throw error;
    }
  }

  async requestDataDeletion(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/users/request-deletion', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to request data deletion');
      }

      this.emit('deletion_requested');
    } catch (error) {
      this.emit('deletion_error', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!(this.currentUser && this.authTokens);
  }

  isAnonymous(): boolean {
    return !!(this.currentUser?.isAnonymous);
  }

  hasValidToken(): boolean {
    if (!this.authTokens) return false;
    return Date.now() < this.authTokens.expiresAt;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Private methods
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Ensure we have a valid token
    if (this.authTokens && !this.hasValidToken()) {
      await this.refreshTokens();
    }

    const headers = new Headers(options.headers);
    
    // Add authentication header if we have tokens
    if (this.authTokens) {
      headers.set('Authorization', `${this.authTokens.tokenType} ${this.authTokens.accessToken}`);
    }

    // Add session ID
    headers.set('X-Session-ID', this.sessionId);

    // Set content type for JSON requests
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnonymousDisplayName(): string {
    const adjectives = ['Anonymous', 'Helpful', 'Kind', 'Caring', 'Supportive', 'Understanding', 'Gentle'];
    const nouns = ['User', 'Friend', 'Visitor', 'Guest', 'Companion', 'Soul'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 10000);
    
    return `${adj} ${noun} ${num}`;
  }

  private setupTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.authTokens || typeof setTimeout === 'undefined') return;

    // Refresh 5 minutes before expiration
    const refreshTime = this.authTokens.expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTokens().catch(error => {
          console.error('Auto token refresh failed:', error);
        });
      }, refreshTime);
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      if (this.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }
      if (this.authTokens) {
        localStorage.setItem('authTokens', JSON.stringify(this.authTokens));
      }
      localStorage.setItem('sessionId', this.sessionId);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private initializeFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedTokens = localStorage.getItem('authTokens');
      const savedSessionId = localStorage.getItem('sessionId');

      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }

      if (savedTokens) {
        this.authTokens = JSON.parse(savedTokens);
        
        // Check if tokens are still valid
        if (this.hasValidToken()) {
          this.setupTokenRefresh();
          this.emit('restored_from_storage', this.currentUser);
        } else {
          // Tokens expired, try to refresh
          this.refreshTokens().catch(() => {
            this.clearAuthData();
          });
        }
      }

      if (savedSessionId) {
        this.sessionId = savedSessionId;
      }
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error);
      this.clearAuthData();
    }
  }

  private clearAuthData(): void {
    this.currentUser = null;
    this.authTokens = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authTokens');
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }

  // Cleanup
  destroy(): void {
    this.clearAuthData();
    this.removeAllListeners();
  }
}

export default UserService;
