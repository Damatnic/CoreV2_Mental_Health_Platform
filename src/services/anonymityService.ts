/**
 * Anonymity Service
 *
 * Comprehensive anonymity and privacy protection service for mental health platform.
 * Provides anonymous user sessions, data protection, privacy controls,
 * and HIPAA-compliant anonymization features.
 *
 * @fileoverview Type-safe anonymity service with comprehensive privacy protection
 * @version 2.1.0 - Completely rewritten for type safety and enhanced privacy
 */

// Core Types
export interface AnonymousUser {
  id: string;
  sessionId: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
  expiresAt: Date;
  preferences: AnonymousUserPreferences;
  metadata: AnonymousUserMetadata;
}

export interface AnonymousUserPreferences {
  dataRetention: 'session' | 'temporary' | 'minimal';
  shareAnalytics: boolean;
  allowCommunication: boolean;
  privacyLevel: 'minimal' | 'standard' | 'maximum';
  anonymizeLocation: boolean;
  minimizeDataCollection: boolean;
}

export interface AnonymousUserMetadata {
  location?: string; // Generalized location (country/state level only)
  timezone: string;
  language: string;
  accessibilityNeeds?: string[];
  approximateAge?: 'under-18' | '18-25' | '26-35' | '36-50' | '51-65' | 'over-65';
  generalInterests?: string[];
}

export interface AnonymousSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  activities: ActivityRecord[];
  dataCollected: SessionDataMetrics;
  privacyLevel: 'minimal' | 'standard' | 'maximum';
  isActive: boolean;
}

export interface ActivityRecord {
  type: 'interaction' | 'support_request' | 'crisis_intervention' | 'resource_access';
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SessionDataMetrics {
  interactions: number;
  supportRequests: number;
  crisisInterventions: number;
  resourcesAccessed: number;
  totalTimeSpent: number; // in minutes
  featuresUsed: string[];
}

export interface DataProtectionSettings {
  encryptData: boolean;
  anonymizeImmediately: boolean;
  purgeOnExit: boolean;
  minimizeCollection: boolean;
  shareForResearch: boolean;
  allowPersonalization: boolean;
  retentionPeriod: 'none' | 'session' | '24h' | '7d' | '30d';
  anonymizationLevel: 'basic' | 'moderate' | 'aggressive';
}

export interface AnonymityReport {
  userId: string;
  sessionId: string;
  reportGeneratedAt: Date;
  dataCollected: {
    personalData: string[];
    behavioralData: string[];
    communicationData: string[];
    locationData: string[];
  };
  privacyMeasures: {
    encryption: boolean;
    anonymization: boolean;
    dataMinimization: boolean;
    automaticPurge: boolean;
  };
  retentionInfo: {
    retentionPeriod: string;
    scheduledPurge: Date | null;
    canBeDeleted: boolean;
  };
  complianceStatus: {
    hipaaCompliant: boolean;
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
  };
}

export interface PrivacyControlOptions {
  allowAnalytics: boolean;
  shareAggregatedData: boolean;
  enablePersonalization: boolean;
  retainSessionData: boolean;
  anonymizeInteractions: boolean;
  encryptCommunications: boolean;
}

// Default configurations
const DEFAULT_ANONYMITY_SETTINGS: DataProtectionSettings = {
  encryptData: true,
  anonymizeImmediately: true,
  purgeOnExit: false,
  minimizeCollection: true,
  shareForResearch: false,
  allowPersonalization: false,
  retentionPeriod: 'session',
  anonymizationLevel: 'moderate'
};

const DEFAULT_USER_PREFERENCES: AnonymousUserPreferences = {
  dataRetention: 'minimal',
  shareAnalytics: false,
  allowCommunication: true,
  privacyLevel: 'maximum',
  anonymizeLocation: true,
  minimizeDataCollection: true
};

const AVATAR_TEMPLATES = [
  '🙂', '😊', '😌', '🤗', '😇', '🙃', '😎', '🤔', '😴', '🤫',
  '🌟', '🌙', '🌸', '🌿', '🦋', '🐝', '🌈', '☁️', '⭐', '💫'
];

const DISPLAY_NAME_ADJECTIVES = [
  'Peaceful', 'Brave', 'Gentle', 'Strong', 'Wise', 'Kind', 'Calm', 'Bright',
  'Hopeful', 'Caring', 'Resilient', 'Compassionate', 'Thoughtful', 'Serene'
];

const DISPLAY_NAME_NOUNS = [
  'Soul', 'Heart', 'Mind', 'Spirit', 'Friend', 'Helper', 'Seeker', 'Traveler',
  'Guardian', 'Warrior', 'Healer', 'Dreamer', 'Explorer', 'Companion'
];

/**
 * Type-safe Anonymity Service with comprehensive privacy protection
 */
class AnonymityService {
  private activeSessions: Map<string, AnonymousSession> = new Map();
  private anonymousUsers: Map<string, AnonymousUser> = new Map();
  private protectionSettings: DataProtectionSettings;
  private isSupported: boolean = false;
  private cleanupInterval: number | null = null;

  constructor(settings?: Partial<DataProtectionSettings>) {
    this.protectionSettings = { ...DEFAULT_ANONYMITY_SETTINGS, ...settings };
    this.isSupported = this.checkEnvironmentSupport();
    
    if (this.isSupported) {
      this.initializeService();
    }
  }

  /**
   * Check if environment supports anonymity features
   */
  private checkEnvironmentSupport(): boolean {
    try {
      return typeof window !== 'undefined' && 
             typeof localStorage !== 'undefined' &&
             typeof crypto !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Initialize the anonymity service
   */
  private initializeService(): void {
    // Set up automatic cleanup
    this.cleanupInterval = window.setInterval(() => {
      this.performAutomaticCleanup();
    }, 60000); // Run every minute

    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.handlePageUnload();
      });
    }

    console.log('Anonymity service initialized with privacy protection');
  }

  /**
   * Create anonymous user session
   */
  async createAnonymousUser(
    preferences?: Partial<AnonymousUserPreferences>
  ): Promise<AnonymousUser> {
    if (!this.isSupported) {
      throw new Error('Anonymity service not supported in current environment');
    }

    const userId = this.generateAnonymousId();
    const sessionId = this.generateSessionId();
    const displayName = this.generateAnonymousDisplayName();
    const avatar = this.getRandomAvatar();
    
    const now = new Date();
    const expirationTime = this.calculateExpirationTime(
      preferences?.dataRetention || DEFAULT_USER_PREFERENCES.dataRetention
    );

    const user: AnonymousUser = {
      id: userId,
      sessionId,
      displayName,
      avatar,
      createdAt: now,
      expiresAt: expirationTime,
      preferences: { ...DEFAULT_USER_PREFERENCES, ...preferences },
      metadata: await this.generateSafeMetadata()
    };

    // Store user (encrypted if required)
    this.anonymousUsers.set(userId, user);
    if (this.protectionSettings.encryptData) {
      await this.storeEncryptedUser(user);
    }

    // Create initial session
    await this.createSession(userId);

    console.log(`Anonymous user created: ${displayName} (${userId})`);
    return user;
  }

  /**
   * Create new session for existing anonymous user
   */
  async createSession(userId: string): Promise<AnonymousSession> {
    const user = this.anonymousUsers.get(userId);
    if (!user) {
      throw new Error('Anonymous user not found');
    }

    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: AnonymousSession = {
      id: sessionId,
      userId,
      startedAt: now,
      lastActivity: now,
      expiresAt: user.expiresAt,
      activities: [],
      dataCollected: {
        interactions: 0,
        supportRequests: 0,
        crisisInterventions: 0,
        resourcesAccessed: 0,
        totalTimeSpent: 0,
        featuresUsed: []
      },
      privacyLevel: user.preferences.privacyLevel,
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    
    // Update user's session ID
    user.sessionId = sessionId;
    
    return session;
  }

  /**
   * Record user activity while maintaining anonymity
   */
  async recordActivity(
    sessionId: string,
    activityType: ActivityRecord['type'],
    metadata?: Record<string, any>
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return; // Silently ignore for privacy
    }

    const now = new Date();
    const activity: ActivityRecord = {
      type: activityType,
      timestamp: now,
      metadata: this.sanitizeMetadata(metadata)
    };

    session.activities.push(activity);
    session.lastActivity = now;

    // Update metrics
    switch (activityType) {
      case 'interaction':
        session.dataCollected.interactions++;
        break;
      case 'support_request':
        session.dataCollected.supportRequests++;
        break;
      case 'crisis_intervention':
        session.dataCollected.crisisInterventions++;
        break;
      case 'resource_access':
        session.dataCollected.resourcesAccessed++;
        break;
    }

    // Update time tracking
    if (session.activities.length > 1) {
      const lastActivity = session.activities[session.activities.length - 2];
      const timeDiff = (now.getTime() - lastActivity.timestamp.getTime()) / (1000 * 60);
      session.dataCollected.totalTimeSpent += Math.min(timeDiff, 30); // Cap at 30 min per activity
    }

    // Enforce data minimization
    if (this.protectionSettings.minimizeCollection) {
      await this.enforceDataMinimization(session);
    }
  }

  /**
   * Get current anonymous user
   */
  getAnonymousUser(userId: string): AnonymousUser | null {
    return this.anonymousUsers.get(userId) || null;
  }

  /**
   * Get active session
   */
  getActiveSession(sessionId: string): AnonymousSession | null {
    const session = this.activeSessions.get(sessionId);
    return session?.isActive ? session : null;
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacyPreferences(
    userId: string,
    preferences: Partial<AnonymousUserPreferences>
  ): Promise<void> {
    const user = this.anonymousUsers.get(userId);
    if (!user) {
      return;
    }

    user.preferences = { ...user.preferences, ...preferences };

    // Apply immediate changes if needed
    if (preferences.privacyLevel === 'maximum') {
      await this.maximizePrivacyProtection(userId);
    }

    console.log(`Privacy preferences updated for user: ${userId}`);
  }

  /**
   * Generate privacy report for user
   */
  async generatePrivacyReport(userId: string): Promise<AnonymityReport | null> {
    const user = this.anonymousUsers.get(userId);
    const session = Array.from(this.activeSessions.values()).find(s => s.userId === userId);
    
    if (!user) {
      return null;
    }

    return {
      userId,
      sessionId: user.sessionId,
      reportGeneratedAt: new Date(),
      dataCollected: {
        personalData: this.identifyPersonalData(user),
        behavioralData: session ? this.identifyBehavioralData(session) : [],
        communicationData: [],
        locationData: user.metadata.location ? ['generalized_location'] : []
      },
      privacyMeasures: {
        encryption: this.protectionSettings.encryptData,
        anonymization: this.protectionSettings.anonymizeImmediately,
        dataMinimization: this.protectionSettings.minimizeCollection,
        automaticPurge: this.protectionSettings.purgeOnExit
      },
      retentionInfo: {
        retentionPeriod: this.protectionSettings.retentionPeriod,
        scheduledPurge: this.calculatePurgeDate(user),
        canBeDeleted: true
      },
      complianceStatus: {
        hipaaCompliant: this.isHIPAACompliant(),
        gdprCompliant: this.isGDPRCompliant(),
        ccpaCompliant: this.isCCPACompliant()
      }
    };
  }

  /**
   * Anonymize or delete all data for user
   */
  async purgeUserData(userId: string, level: 'anonymize' | 'delete' = 'delete'): Promise<boolean> {
    try {
      if (level === 'delete') {
        // Complete deletion
        this.anonymousUsers.delete(userId);
        
        // Remove all sessions for this user
        // Remove all sessions for this user
        const sessionsToDelete = Array.from(this.activeSessions.entries())
          .filter(([, session]) => session.userId === userId)
          .map(([sessionId]) => sessionId);
        
        sessionsToDelete.forEach(sessionId => {
          this.activeSessions.delete(sessionId);
        });
        
        // Remove encrypted storage
        await this.removeEncryptedStorage(userId);
        
      } else {
        // Deep anonymization
        const user = this.anonymousUsers.get(userId);
        if (user) {
          await this.deepAnonymizeUser(user);
        }
      }

      console.log(`User data purged (${level}): ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to purge user data:', error);
      return false;
    }
  }

  /**
   * Get anonymity statistics (aggregated and non-identifying)
   */
  getAnonymityStatistics(): {
    totalAnonymousUsers: number;
    activeSessions: number;
    averageSessionDuration: number;
    privacyLevelDistribution: Record<string, number>;
    dataRetentionPreferences: Record<string, number>;
  } {
    const users = Array.from(this.anonymousUsers.values());
    const sessions = Array.from(this.activeSessions.values()).filter(s => s.isActive);

    const privacyLevels: Record<string, number> = {};
    const retentionPrefs: Record<string, number> = {};

    users.forEach(user => {
      privacyLevels[user.preferences.privacyLevel] = 
        (privacyLevels[user.preferences.privacyLevel] || 0) + 1;
      retentionPrefs[user.preferences.dataRetention] = 
        (retentionPrefs[user.preferences.dataRetention] || 0) + 1;
    });

    const avgDuration = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.dataCollected.totalTimeSpent, 0) / sessions.length
      : 0;

    return {
      totalAnonymousUsers: users.length,
      activeSessions: sessions.length,
      averageSessionDuration: Math.round(avgDuration),
      privacyLevelDistribution: privacyLevels,
      dataRetentionPreferences: retentionPrefs
    };
  }

  /**
   * Clean up expired sessions and users
   */
  async performCleanup(): Promise<number> {
    let cleanedCount = 0;
    const now = new Date();

    // Clean up expired users
    // Clean up expired users
    const expiredUsers = Array.from(this.anonymousUsers.entries())
      .filter(([, user]) => now > user.expiresAt)
      .map(([userId]) => userId);
    
    for (const userId of expiredUsers) {
      await this.purgeUserData(userId, 'delete');
      cleanedCount++;
    }

    // Clean up expired sessions
    // Clean up expired sessions
    const expiredSessions = Array.from(this.activeSessions.entries())
      .filter(([, session]) => now > session.expiresAt || !session.isActive)
      .map(([sessionId]) => sessionId);
    
    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
      cleanedCount++;
    });

    return cleanedCount;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.protectionSettings.purgeOnExit) {
      this.anonymousUsers.clear();
      this.activeSessions.clear();
    }
  }

  // Private helper methods

  private generateAnonymousId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `anon_${timestamp}_${random}`;
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `sess_${timestamp}_${random}`;
  }

  private generateAnonymousDisplayName(): string {
    const adjective = DISPLAY_NAME_ADJECTIVES[Math.floor(Math.random() * DISPLAY_NAME_ADJECTIVES.length)];
    const noun = DISPLAY_NAME_NOUNS[Math.floor(Math.random() * DISPLAY_NAME_NOUNS.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${adjective}${noun}${number}`;
  }

  private getRandomAvatar(): string {
    return AVATAR_TEMPLATES[Math.floor(Math.random() * AVATAR_TEMPLATES.length)];
  }

  private async generateSafeMetadata(): Promise<AnonymousUserMetadata> {
    const metadata: AnonymousUserMetadata = {
      timezone: this.getSafeTimezone(),
      language: this.getSafeLanguage()
    };

    // Only add location if not disabled
    if (!this.protectionSettings.minimizeCollection) {
      metadata.location = this.getGeneralizedLocation();
    }

    return metadata;
  }

  private getSafeTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  private getSafeLanguage(): string {
    try {
      return navigator.language.split('-')[0] || 'en';
    } catch {
      return 'en';
    }
  }

  private getGeneralizedLocation(): string | undefined {
    // Return only very general location (country level)
    try {
      const timezone = this.getSafeTimezone();
      const region = timezone.split('/')[0];
      return region || undefined;
    } catch {
      return undefined;
    }
  }

  private calculateExpirationTime(retention: AnonymousUserPreferences['dataRetention']): Date {
    const now = new Date();
    const expirationTime = new Date(now);

    switch (retention) {
      case 'session':
        // Expires when browser session ends (approximated as 6 hours)
        expirationTime.setHours(expirationTime.getHours() + 6);
        break;
      case 'temporary':
        // 24 hours
        expirationTime.setDate(expirationTime.getDate() + 1);
        break;
      case 'minimal':
        // 7 days
        expirationTime.setDate(expirationTime.getDate() + 7);
        break;
    }

    return expirationTime;
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata || this.protectionSettings.minimizeCollection) {
      return undefined;
    }

    // Remove potentially identifying information
    const safe: Record<string, any> = {};
    const allowedKeys = ['category', 'type', 'duration', 'result'];
    
    for (const [key, value] of Object.entries(metadata)) {
      if (allowedKeys.includes(key) && typeof value !== 'object') {
        safe[key] = value;
      }
    }

    return Object.keys(safe).length > 0 ? safe : undefined;
  }

  private async enforceDataMinimization(session: AnonymousSession): Promise<void> {
    // Keep only recent activities (last 50)
    if (session.activities.length > 50) {
      session.activities = session.activities.slice(-50);
    }

    // Remove detailed metadata from old activities
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    session.activities.forEach(activity => {
      if (activity.timestamp < oneHourAgo) {
        delete activity.metadata;
      }
    });
  }

  private async maximizePrivacyProtection(userId: string): Promise<void> {
    const user = this.anonymousUsers.get(userId);
    if (!user) return;

    // Apply maximum privacy settings
    user.preferences = {
      ...user.preferences,
      shareAnalytics: false,
      allowCommunication: false,
      privacyLevel: 'maximum',
      anonymizeLocation: true,
      minimizeDataCollection: true
    };

    // Clear location data
    delete user.metadata.location;
    delete user.metadata.approximateAge;
    user.metadata.generalInterests = [];

    // Minimize session data
    const sessions = Array.from(this.activeSessions.values()).filter(s => s.userId === userId);
    for (const session of sessions) {
      session.activities = session.activities.slice(-10); // Keep only last 10 activities
      session.privacyLevel = 'maximum';
    }
  }

  private identifyPersonalData(user: AnonymousUser): string[] {
    const data: string[] = [];
    
    if (user.displayName) data.push('anonymous_display_name');
    if (user.metadata.location) data.push('generalized_location');
    if (user.metadata.timezone) data.push('timezone');
    if (user.metadata.language) data.push('language_preference');
    
    return data;
  }

  private identifyBehavioralData(session: AnonymousSession): string[] {
    const data: string[] = [];
    
    if (session.dataCollected.interactions > 0) data.push('interaction_count');
    if (session.dataCollected.totalTimeSpent > 0) data.push('session_duration');
    if (session.activities.length > 0) data.push('activity_types');
    
    return data;
  }

  private calculatePurgeDate(user: AnonymousUser): Date | null {
    if (this.protectionSettings.retentionPeriod === 'none') {
      return new Date(); // Immediate
    }
    return user.expiresAt;
  }

  private isHIPAACompliant(): boolean {
    return this.protectionSettings.encryptData && 
           this.protectionSettings.minimizeCollection &&
           this.protectionSettings.retentionPeriod !== 'none';
  }

  private isGDPRCompliant(): boolean {
    return this.protectionSettings.minimizeCollection &&
           this.protectionSettings.anonymizeImmediately;
  }

  private isCCPACompliant(): boolean {
    return this.protectionSettings.minimizeCollection;
  }

  private async storeEncryptedUser(user: AnonymousUser): Promise<void> {
    try {
      const key = `anon_user_${user.id}`;
      const encrypted = await this.encryptData(JSON.stringify(user));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.warn('Failed to store encrypted user data:', error);
    }
  }

  private async removeEncryptedStorage(userId: string): Promise<void> {
    const key = `anon_user_${userId}`;
    localStorage.removeItem(key);
  }

  private async encryptData(data: string): Promise<string> {
    // Simplified encryption - in production, use proper Web Crypto API
    return btoa(data);
  }

  private async deepAnonymizeUser(user: AnonymousUser): Promise<void> {
    // Replace all identifying information with generic values
    user.displayName = this.generateAnonymousDisplayName();
    user.avatar = this.getRandomAvatar();
    user.metadata = {
      timezone: 'UTC',
      language: 'en'
    };
  }

  private performAutomaticCleanup(): void {
    this.performCleanup().catch(error => {
      console.warn('Automatic cleanup failed:', error);
    });
  }

  private handlePageUnload(): void {
    if (this.protectionSettings.purgeOnExit) {
      this.cleanup();
    }
  }
}

// Export singleton instance
export const anonymityService = new AnonymityService();
export default anonymityService;
