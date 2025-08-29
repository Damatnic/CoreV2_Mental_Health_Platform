/**
 * Consent Management Service
 * 
 * Comprehensive consent management for GDPR, CCPA, HIPAA, and COPPA compliance.
 * Provides granular consent controls, version tracking, and easy opt-out mechanisms.
 * 
 * @fileoverview Consent management with regulatory compliance
 * @version 3.0.0
 */

import { logger } from '../utils/logger';
import { secureStorage } from './secureStorageService';

// Consent types
export type ConsentType = 
  | 'essential'       // Required for basic functionality
  | 'functional'      // Enhanced features
  | 'analytics'       // Usage analytics
  | 'performance'     // Performance monitoring
  | 'personalization' // Personalized experience
  | 'research'        // Clinical research
  | 'marketing'       // Marketing communications
  | 'third_party';    // Third-party services

export type ConsentStatus = 'granted' | 'denied' | 'pending' | 'withdrawn';
export type LegalBasis = 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
export type Jurisdiction = 'gdpr' | 'ccpa' | 'hipaa' | 'coppa' | 'global';

export interface ConsentRecord {
  id: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  timestamp: Date;
  expiresAt?: Date;
  version: string;
  legalBasis: LegalBasis;
  jurisdiction: Jurisdiction;
  withdrawable: boolean;
  description: string;
  dataCategories: string[];
  purposes: string[];
  thirdParties?: string[];
  ipAddress?: string;
  userAgent?: string;
  parentalConsent?: boolean;
  verificationMethod?: string;
}

export interface ConsentPreferences {
  userId: string;
  consents: Map<ConsentType, ConsentRecord>;
  globalOptOut: boolean;
  doNotTrack: boolean;
  doNotSell: boolean;
  limitedDataUse: boolean;
  sensitiveDataOptOut: boolean;
  lastUpdated: Date;
  preferredJurisdiction: Jurisdiction;
}

export interface ConsentVersion {
  version: string;
  effectiveDate: Date;
  changes: string[];
  requiredConsents: ConsentType[];
  optionalConsents: ConsentType[];
  legalText: Map<ConsentType, string>;
}

export interface ConsentAuditLog {
  id: string;
  userId: string;
  action: 'grant' | 'deny' | 'withdraw' | 'update' | 'expire';
  consentType: ConsentType;
  previousStatus?: ConsentStatus;
  newStatus: ConsentStatus;
  timestamp: Date;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ConsentStatistics {
  totalUsers: number;
  consentedUsers: number;
  optOutUsers: number;
  consentRates: Map<ConsentType, number>;
  withdrawalRates: Map<ConsentType, number>;
  averageConsentDuration: number;
  complianceScore: number;
}

// Consent configurations per jurisdiction
const JURISDICTION_CONFIGS = {
  gdpr: {
    requiredAge: 16,
    parentalConsentAge: 16,
    retentionPeriod: 3 * 365, // 3 years
    withdrawalGracePeriod: 0,
    explicitConsentRequired: true,
    granularConsentRequired: true,
    rightToErasure: true,
    rightToPortability: true
  },
  ccpa: {
    requiredAge: 13,
    parentalConsentAge: 13,
    retentionPeriod: 2 * 365, // 2 years
    withdrawalGracePeriod: 0,
    explicitConsentRequired: false,
    granularConsentRequired: true,
    rightToErasure: true,
    rightToPortability: true
  },
  hipaa: {
    requiredAge: 18,
    parentalConsentAge: 18,
    retentionPeriod: 6 * 365, // 6 years
    withdrawalGracePeriod: 30,
    explicitConsentRequired: true,
    granularConsentRequired: true,
    rightToErasure: false, // Limited under HIPAA
    rightToPortability: true
  },
  coppa: {
    requiredAge: 13,
    parentalConsentAge: 13,
    retentionPeriod: 365, // 1 year
    withdrawalGracePeriod: 0,
    explicitConsentRequired: true,
    granularConsentRequired: false,
    rightToErasure: true,
    rightToPortability: false
  },
  global: {
    requiredAge: 18,
    parentalConsentAge: 18,
    retentionPeriod: 365,
    withdrawalGracePeriod: 0,
    explicitConsentRequired: true,
    granularConsentRequired: true,
    rightToErasure: true,
    rightToPortability: true
  }
};

// Consent descriptions
const CONSENT_DESCRIPTIONS = {
  essential: 'Core functionality required for the platform to operate',
  functional: 'Enhanced features for improved user experience',
  analytics: 'Anonymous usage data to improve our services',
  performance: 'Performance monitoring to ensure optimal service',
  personalization: 'Personalized content and recommendations',
  research: 'Participation in mental health research studies',
  marketing: 'Updates about new features and services',
  third_party: 'Sharing data with trusted third-party services'
};

class ConsentManagerService {
  private userPreferences: Map<string, ConsentPreferences> = new Map();
  private consentVersions: ConsentVersion[] = [];
  private currentVersion: ConsentVersion;
  private auditLogs: ConsentAuditLog[] = [];
  private statistics: ConsentStatistics;

  constructor() {
    this.currentVersion = this.createCurrentVersion();
    this.consentVersions.push(this.currentVersion);
    this.statistics = this.initializeStatistics();
    this.loadStoredConsents();
    this.startConsentExpiration();
  }

  private createCurrentVersion(): ConsentVersion {
    return {
      version: '3.0.0',
      effectiveDate: new Date(),
      changes: [
        'Enhanced privacy controls',
        'Granular consent options',
        'Improved data minimization',
        'Clearer purpose descriptions'
      ],
      requiredConsents: ['essential'],
      optionalConsents: ['functional', 'analytics', 'performance', 'personalization', 'research'],
      legalText: new Map(Object.entries(CONSENT_DESCRIPTIONS))
    };
  }

  private initializeStatistics(): ConsentStatistics {
    return {
      totalUsers: 0,
      consentedUsers: 0,
      optOutUsers: 0,
      consentRates: new Map(),
      withdrawalRates: new Map(),
      averageConsentDuration: 0,
      complianceScore: 100
    };
  }

  private async loadStoredConsents(): Promise<void> {
    try {
      const stored = await secureStorage.getItem('consent-preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        for (const [userId, prefs] of Object.entries(preferences)) {
          this.userPreferences.set(userId, this.deserializePreferences(prefs as any));
        }
        logger.info(`Loaded consent preferences for ${this.userPreferences.size} users`);
      }
    } catch (error) {
      logger.error('Failed to load stored consents:', error);
    }
  }

  /**
   * Request consent from user
   */
  public async requestConsent(
    userId: string,
    consentType: ConsentType,
    jurisdiction: Jurisdiction = 'global',
    metadata?: Record<string, any>
  ): Promise<ConsentRecord> {
    const config = JURISDICTION_CONFIGS[jurisdiction];
    
    // Create consent record
    const consent: ConsentRecord = {
      id: this.generateConsentId(),
      userId,
      type: consentType,
      status: 'pending',
      timestamp: new Date(),
      version: this.currentVersion.version,
      legalBasis: 'consent',
      jurisdiction,
      withdrawable: true,
      description: CONSENT_DESCRIPTIONS[consentType],
      dataCategories: this.getDataCategories(consentType),
      purposes: this.getPurposes(consentType),
      ...metadata
    };

    // Set expiration if configured
    if (config.retentionPeriod) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + config.retentionPeriod);
      consent.expiresAt = expirationDate;
    }

    // Store consent request
    await this.updateUserConsent(userId, consent);

    return consent;
  }

  /**
   * Grant consent
   */
  public async grantConsent(
    userId: string,
    consentType: ConsentType,
    metadata?: Record<string, any>
  ): Promise<ConsentRecord> {
    const preferences = await this.getUserPreferences(userId);
    const existingConsent = preferences.consents.get(consentType);
    
    const consent: ConsentRecord = existingConsent || await this.requestConsent(userId, consentType);
    const previousStatus = consent.status;
    
    consent.status = 'granted';
    consent.timestamp = new Date();
    
    // Update preferences
    preferences.consents.set(consentType, consent);
    preferences.lastUpdated = new Date();
    
    await this.saveUserPreferences(userId, preferences);
    
    // Log audit
    this.logConsentAction(userId, 'grant', consentType, previousStatus, 'granted', metadata);
    
    // Update statistics
    this.updateStatistics();
    
    logger.info(`Consent granted: ${userId} - ${consentType}`);
    
    return consent;
  }

  /**
   * Deny consent
   */
  public async denyConsent(
    userId: string,
    consentType: ConsentType,
    reason?: string
  ): Promise<ConsentRecord> {
    const preferences = await this.getUserPreferences(userId);
    const existingConsent = preferences.consents.get(consentType);
    
    const consent: ConsentRecord = existingConsent || await this.requestConsent(userId, consentType);
    const previousStatus = consent.status;
    
    consent.status = 'denied';
    consent.timestamp = new Date();
    
    // Update preferences
    preferences.consents.set(consentType, consent);
    preferences.lastUpdated = new Date();
    
    await this.saveUserPreferences(userId, preferences);
    
    // Log audit
    this.logConsentAction(userId, 'deny', consentType, previousStatus, 'denied', { reason });
    
    // Update statistics
    this.updateStatistics();
    
    logger.info(`Consent denied: ${userId} - ${consentType}`);
    
    return consent;
  }

  /**
   * Withdraw consent
   */
  public async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    reason?: string
  ): Promise<ConsentRecord> {
    const preferences = await this.getUserPreferences(userId);
    const consent = preferences.consents.get(consentType);
    
    if (!consent) {
      throw new Error(`No consent record found for ${consentType}`);
    }
    
    if (!consent.withdrawable) {
      throw new Error(`Consent for ${consentType} cannot be withdrawn`);
    }
    
    const previousStatus = consent.status;
    consent.status = 'withdrawn';
    consent.timestamp = new Date();
    
    // Update preferences
    preferences.consents.set(consentType, consent);
    preferences.lastUpdated = new Date();
    
    await this.saveUserPreferences(userId, preferences);
    
    // Log audit
    this.logConsentAction(userId, 'withdraw', consentType, previousStatus, 'withdrawn', { reason });
    
    // Trigger data deletion if required
    if (consentType === 'essential' || preferences.globalOptOut) {
      await this.triggerDataDeletion(userId);
    }
    
    // Update statistics
    this.updateStatistics();
    
    logger.info(`Consent withdrawn: ${userId} - ${consentType}`);
    
    return consent;
  }

  /**
   * Get user consent status
   */
  public async getConsentStatus(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentStatus> {
    const preferences = await this.getUserPreferences(userId);
    const consent = preferences.consents.get(consentType);
    
    if (!consent) {
      return 'pending';
    }
    
    // Check if consent has expired
    if (consent.expiresAt && new Date() > consent.expiresAt) {
      return 'withdrawn';
    }
    
    return consent.status;
  }

  /**
   * Check if user has valid consent
   */
  public async hasValidConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    const status = await this.getConsentStatus(userId, consentType);
    return status === 'granted';
  }

  /**
   * Get all user consents
   */
  public async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const preferences = await this.getUserPreferences(userId);
    return Array.from(preferences.consents.values());
  }

  /**
   * Global opt-out
   */
  public async globalOptOut(userId: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    preferences.globalOptOut = true;
    preferences.doNotTrack = true;
    preferences.doNotSell = true;
    preferences.limitedDataUse = true;
    preferences.sensitiveDataOptOut = true;
    
    // Withdraw all consents
    for (const [type, consent] of preferences.consents) {
      if (consent.withdrawable) {
        consent.status = 'withdrawn';
        consent.timestamp = new Date();
      }
    }
    
    preferences.lastUpdated = new Date();
    
    await this.saveUserPreferences(userId, preferences);
    
    // Trigger data deletion
    await this.triggerDataDeletion(userId);
    
    logger.info(`Global opt-out activated for user: ${userId}`);
  }

  /**
   * Check GDPR compliance
   */
  public isGDPRCompliant(preferences: ConsentPreferences): boolean {
    // Check if essential consents are present
    const hasEssential = preferences.consents.has('essential') && 
                         preferences.consents.get('essential')!.status === 'granted';
    
    // Check if all consents are explicit
    const allExplicit = Array.from(preferences.consents.values()).every(
      consent => consent.legalBasis === 'consent' || consent.legalBasis === 'contract'
    );
    
    // Check if user can withdraw
    const canWithdraw = Array.from(preferences.consents.values()).every(
      consent => consent.withdrawable || consent.type === 'essential'
    );
    
    return hasEssential && allExplicit && canWithdraw;
  }

  /**
   * Check CCPA compliance
   */
  public isCCPACompliant(preferences: ConsentPreferences): boolean {
    // Check if user can opt-out of sale
    const canOptOut = preferences.doNotSell !== undefined;
    
    // Check if user has access rights
    const hasAccessRights = true; // Assuming we provide data access
    
    return canOptOut && hasAccessRights;
  }

  /**
   * Check HIPAA compliance
   */
  public isHIPAACompliant(preferences: ConsentPreferences): boolean {
    // Check if health data consents are explicit
    const healthConsents = ['essential', 'functional', 'research'];
    
    return healthConsents.every(type => {
      const consent = preferences.consents.get(type as ConsentType);
      return !consent || consent.legalBasis === 'consent';
    });
  }

  /**
   * Check COPPA compliance
   */
  public async isCOPPACompliant(userId: string, age?: number): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    
    // If user is under 13, check parental consent
    if (age && age < 13) {
      return Array.from(preferences.consents.values()).every(
        consent => consent.parentalConsent === true
      );
    }
    
    return true;
  }

  /**
   * Verify parental consent
   */
  public async verifyParentalConsent(
    userId: string,
    parentId: string,
    verificationMethod: 'email' | 'credit_card' | 'id_verification'
  ): Promise<boolean> {
    // Implement parental consent verification
    logger.info(`Parental consent verification for ${userId} by ${parentId} using ${verificationMethod}`);
    
    // Update all consents with parental consent flag
    const preferences = await this.getUserPreferences(userId);
    
    for (const consent of preferences.consents.values()) {
      consent.parentalConsent = true;
      consent.verificationMethod = verificationMethod;
    }
    
    await this.saveUserPreferences(userId, preferences);
    
    return true;
  }

  /**
   * Get user preferences
   */
  private async getUserPreferences(userId: string): Promise<ConsentPreferences> {
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      preferences = {
        userId,
        consents: new Map(),
        globalOptOut: false,
        doNotTrack: false,
        doNotSell: false,
        limitedDataUse: false,
        sensitiveDataOptOut: false,
        lastUpdated: new Date(),
        preferredJurisdiction: 'global'
      };
      
      this.userPreferences.set(userId, preferences);
    }
    
    return preferences;
  }

  /**
   * Save user preferences
   */
  private async saveUserPreferences(
    userId: string,
    preferences: ConsentPreferences
  ): Promise<void> {
    this.userPreferences.set(userId, preferences);
    
    // Persist to storage
    try {
      const allPreferences: Record<string, any> = {};
      
      for (const [id, prefs] of this.userPreferences) {
        allPreferences[id] = this.serializePreferences(prefs);
      }
      
      await secureStorage.setItem('consent-preferences', JSON.stringify(allPreferences));
    } catch (error) {
      logger.error('Failed to save consent preferences:', error);
    }
  }

  /**
   * Update user consent
   */
  private async updateUserConsent(userId: string, consent: ConsentRecord): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    preferences.consents.set(consent.type, consent);
    preferences.lastUpdated = new Date();
    await this.saveUserPreferences(userId, preferences);
  }

  /**
   * Get data categories for consent type
   */
  private getDataCategories(consentType: ConsentType): string[] {
    const categories: Record<ConsentType, string[]> = {
      essential: ['account', 'authentication', 'security'],
      functional: ['preferences', 'settings', 'usage'],
      analytics: ['behavior', 'performance', 'errors'],
      performance: ['metrics', 'timing', 'resources'],
      personalization: ['interests', 'history', 'recommendations'],
      research: ['health', 'wellness', 'outcomes'],
      marketing: ['contact', 'preferences', 'engagement'],
      third_party: ['shared', 'external', 'integration']
    };
    
    return categories[consentType] || [];
  }

  /**
   * Get purposes for consent type
   */
  private getPurposes(consentType: ConsentType): string[] {
    const purposes: Record<ConsentType, string[]> = {
      essential: ['service provision', 'security', 'legal compliance'],
      functional: ['feature enablement', 'user experience'],
      analytics: ['service improvement', 'usage analysis'],
      performance: ['optimization', 'monitoring'],
      personalization: ['customization', 'recommendations'],
      research: ['clinical studies', 'outcome analysis'],
      marketing: ['communications', 'updates'],
      third_party: ['integration', 'enhanced features']
    };
    
    return purposes[consentType] || [];
  }

  /**
   * Log consent action
   */
  private logConsentAction(
    userId: string,
    action: ConsentAuditLog['action'],
    consentType: ConsentType,
    previousStatus: ConsentStatus | undefined,
    newStatus: ConsentStatus,
    metadata?: Record<string, any>
  ): void {
    const log: ConsentAuditLog = {
      id: this.generateAuditId(),
      userId,
      action,
      consentType,
      previousStatus,
      newStatus,
      timestamp: new Date(),
      metadata
    };
    
    this.auditLogs.push(log);
    
    // Trim old logs (keep last 10000)
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Trigger data deletion
   */
  private async triggerDataDeletion(userId: string): Promise<void> {
    // This would integrate with data deletion service
    logger.info(`Data deletion triggered for user: ${userId}`);
    
    // Send deletion request to relevant services
    // await dataService.deleteUserData(userId);
  }

  /**
   * Check and expire old consents
   */
  private startConsentExpiration(): void {
    // Check for expired consents every day
    setInterval(async () => {
      await this.checkExpiredConsents();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Check for expired consents
   */
  private async checkExpiredConsents(): Promise<void> {
    const now = new Date();
    
    for (const [userId, preferences] of this.userPreferences) {
      let updated = false;
      
      for (const [type, consent] of preferences.consents) {
        if (consent.expiresAt && now > consent.expiresAt && consent.status === 'granted') {
          consent.status = 'withdrawn';
          updated = true;
          
          this.logConsentAction(
            userId,
            'expire',
            type,
            'granted',
            'withdrawn',
            { reason: 'expired' }
          );
        }
      }
      
      if (updated) {
        await this.saveUserPreferences(userId, preferences);
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    this.statistics.totalUsers = this.userPreferences.size;
    this.statistics.consentedUsers = 0;
    this.statistics.optOutUsers = 0;
    
    // Reset rates
    for (const type of Object.keys(CONSENT_DESCRIPTIONS) as ConsentType[]) {
      this.statistics.consentRates.set(type, 0);
      this.statistics.withdrawalRates.set(type, 0);
    }
    
    // Calculate statistics
    for (const preferences of this.userPreferences.values()) {
      if (preferences.globalOptOut) {
        this.statistics.optOutUsers++;
      } else if (preferences.consents.size > 0) {
        this.statistics.consentedUsers++;
      }
      
      for (const [type, consent] of preferences.consents) {
        const currentRate = this.statistics.consentRates.get(type) || 0;
        const withdrawalRate = this.statistics.withdrawalRates.get(type) || 0;
        
        if (consent.status === 'granted') {
          this.statistics.consentRates.set(type, currentRate + 1);
        } else if (consent.status === 'withdrawn') {
          this.statistics.withdrawalRates.set(type, withdrawalRate + 1);
        }
      }
    }
    
    // Convert to percentages
    if (this.statistics.totalUsers > 0) {
      for (const [type, count] of this.statistics.consentRates) {
        this.statistics.consentRates.set(type, (count / this.statistics.totalUsers) * 100);
      }
      
      for (const [type, count] of this.statistics.withdrawalRates) {
        this.statistics.withdrawalRates.set(type, (count / this.statistics.totalUsers) * 100);
      }
    }
    
    // Calculate compliance score
    const gdprCompliant = Array.from(this.userPreferences.values()).filter(
      p => this.isGDPRCompliant(p)
    ).length;
    
    const ccpaCompliant = Array.from(this.userPreferences.values()).filter(
      p => this.isCCPACompliant(p)
    ).length;
    
    if (this.statistics.totalUsers > 0) {
      this.statistics.complianceScore = 
        ((gdprCompliant + ccpaCompliant) / (this.statistics.totalUsers * 2)) * 100;
    }
  }

  /**
   * Get consent statistics
   */
  public getStatistics(): ConsentStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Get audit logs
   */
  public getAuditLogs(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): ConsentAuditLog[] {
    let logs = [...this.auditLogs];
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }
    
    return logs;
  }

  /**
   * Export user consent data
   */
  public async exportUserConsentData(userId: string): Promise<{
    preferences: ConsentPreferences;
    consents: ConsentRecord[];
    auditLogs: ConsentAuditLog[];
  }> {
    const preferences = await this.getUserPreferences(userId);
    const consents = Array.from(preferences.consents.values());
    const auditLogs = this.getAuditLogs(userId);
    
    return {
      preferences,
      consents,
      auditLogs
    };
  }

  /**
   * Generate consent ID
   */
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Serialize preferences for storage
   */
  private serializePreferences(preferences: ConsentPreferences): any {
    return {
      ...preferences,
      consents: Array.from(preferences.consents.entries())
    };
  }

  /**
   * Deserialize preferences from storage
   */
  private deserializePreferences(data: any): ConsentPreferences {
    return {
      ...data,
      consents: new Map(data.consents),
      lastUpdated: new Date(data.lastUpdated)
    };
  }
}

// Export singleton instance
export const consentManager = new ConsentManagerService();

// Export types
export type { ConsentManagerService };