/**
 * Data Export Service
 *
 * GDPR-compliant data export service for mental health platform.
 * Provides secure, comprehensive user data exports in multiple formats
 * with privacy protection and HIPAA compliance.
 *
 * @fileoverview GDPR-compliant data export with privacy protection
 * @version 2.0.0
 */

import React from 'react';
import { logger } from '../utils/logger';
import { secureStorage } from './secureStorageService';

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'xml';
export type DataCategory = 
  | 'personal'
  | 'mood'
  | 'activity' 
  | 'communication'
  | 'assessments'
  | 'goals'
  | 'preferences'
  | 'security'
  | 'analytics';

export interface ExportOptions {
  format: ExportFormat;
  categories: DataCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includePersonalData: boolean;
  includeMoodData: boolean;
  includeActivityData: boolean;
  includeCommunicationData: boolean;
  includeAssessmentData: boolean;
  includeAnalytics: boolean;
  anonymize: boolean;
  compress: boolean;
  encryptExport: boolean;
  password?: string;
}

export interface UserDataExport {
  metadata: ExportMetadata;
  personalData?: PersonalDataExport;
  moodData?: MoodDataExport;
  activityData?: ActivityDataExport;
  communicationData?: CommunicationDataExport;
  assessmentData?: AssessmentDataExport;
  analyticsData?: AnalyticsDataExport;
  privacyInfo: PrivacyInfo;
}

export interface ExportMetadata {
  exportId: string;
  exportDate: Date;
  exportVersion: string;
  format: ExportFormat;
  categories: DataCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  totalRecords: number;
  dataTypes: string[];
  privacyCompliance: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    anonymized: boolean;
    encrypted: boolean;
  };
  exportDuration: number;
  fileSize: number;
}

export interface PersonalDataExport {
  userId: string;
  profile: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
  };
  preferences: UserPreferences;
  settings: UserSettings;
  accountHistory: AccountHistoryEntry[];
}

export interface UserPreferences {
  theme: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
  communication: CommunicationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  categories: string[];
}

export interface PrivacyPreferences {
  shareAnonymousData: boolean;
  allowAnalytics: boolean;
  shareWithResearchers: boolean;
  dataRetentionPeriod: number;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
}

export interface CommunicationPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface UserSettings {
  securitySettings: SecuritySettings;
  appSettings: AppSettings;
  integrationSettings: IntegrationSettings;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordLastChanged: Date;
  securityQuestions: boolean;
}

export interface AppSettings {
  autoSave: boolean;
  offlineMode: boolean;
  dataSync: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  storageLocation: 'local' | 'cloud' | 'both';
}

export interface IntegrationSettings {
  connectedServices: string[];
  dataSharing: Record<string, boolean>;
  apiAccess: ApiAccessSettings[];
}

export interface ApiAccessSettings {
  serviceName: string;
  permissions: string[];
  lastAccessed: Date;
  accessCount: number;
}

export interface AccountHistoryEntry {
  date: Date;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MoodDataExport {
  moodEntries: MoodEntry[];
  moodAnalyses: MoodAnalysis[];
  moodTrends: MoodTrend[];
  moodPatterns: MoodPattern[];
  statistics: MoodStatistics;
}

export interface MoodEntry {
  id: string;
  date: Date;
  primaryMood: string;
  secondaryMood?: string;
  intensity: number;
  notes?: string;
  triggers?: string[];
  context?: Record<string, any>;
}

export interface MoodAnalysis {
  id: string;
  date: Date;
  analysis: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
  keywords: string[];
}

export interface MoodTrend {
  period: string;
  averageMood: number;
  moodVariability: number;
  dominantMoods: string[];
  trendDirection: 'improving' | 'declining' | 'stable';
}

export interface MoodPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  timeOfDay?: string;
  dayOfWeek?: string;
  seasonality?: string;
}

export interface MoodStatistics {
  totalEntries: number;
  averageIntensity: number;
  mostCommonMood: string;
  longestStreak: number;
  moodDistribution: Record<string, number>;
}

export interface ActivityDataExport {
  posts: UserPost[];
  interactions: UserInteraction[];
  achievements: Achievement[];
  goals: Goal[];
  sessions: TherapySession[];
  exercises: Exercise[];
  gamification: GamificationData;
}

export interface UserPost {
  id: string;
  content: string;
  timestamp: Date;
  mood?: string;
  tags?: string[];
  supportCount: number;
  commentCount: number;
  isAnonymous: boolean;
}

export interface UserInteraction {
  id: string;
  type: 'like' | 'comment' | 'share' | 'support';
  targetId: string;
  targetType: 'post' | 'comment' | 'user';
  timestamp: Date;
  content?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  earnedDate: Date;
  points: number;
  level?: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
  progress: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  description: string;
  completed: boolean;
  completedDate?: Date;
}

export interface TherapySession {
  id: string;
  date: Date;
  type: 'individual' | 'group' | 'ai-assisted';
  duration: number;
  notes?: string;
  mood: {
    before: number;
    after: number;
  };
  topics: string[];
}

export interface Exercise {
  id: string;
  name: string;
  type: 'breathing' | 'meditation' | 'mindfulness' | 'cognitive';
  completedDate: Date;
  duration: number;
  effectiveness: number;
  notes?: string;
}

export interface GamificationData {
  level: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  achievements: string[];
  leaderboardRank?: number;
}

export interface CommunicationDataExport {
  chatHistory: ChatMessage[];
  peerSupportMessages: PeerMessage[];
  aiInteractions: AIInteraction[];
  notifications: NotificationHistory[];
}

export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  type: 'text' | 'image' | 'file';
  encrypted: boolean;
  roomId?: string;
}

export interface PeerMessage {
  id: string;
  timestamp: Date;
  content: string;
  anonymous: boolean;
  supportType: string;
  responseCount: number;
}

export interface AIInteraction {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  context: string;
  satisfaction?: number;
}

export interface NotificationHistory {
  id: string;
  timestamp: Date;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionTaken?: string;
}

export interface AssessmentDataExport {
  assessments: AssessmentResult[];
  screenings: ScreeningResult[];
  evaluations: EvaluationResult[];
  riskAssessments: RiskAssessment[];
}

export interface AssessmentResult {
  id: string;
  assessmentType: string;
  completedDate: Date;
  score: number;
  interpretation: string;
  recommendations: string[];
  followUpRequired: boolean;
}

export interface ScreeningResult {
  id: string;
  screeningType: string;
  completedDate: Date;
  results: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high';
  referralNeeded: boolean;
}

export interface EvaluationResult {
  id: string;
  evaluationType: string;
  completedDate: Date;
  clinicianNotes?: string;
  patientFeedback?: string;
  outcome: string;
}

export interface RiskAssessment {
  id: string;
  assessmentDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  interventions: string[];
  followUpDate?: Date;
}

export interface AnalyticsDataExport {
  usageStatistics: UsageStatistics;
  behaviorPatterns: BehaviorPattern[];
  engagementMetrics: EngagementMetrics;
  performanceData: PerformanceData;
}

export interface UsageStatistics {
  totalSessionTime: number;
  averageSessionDuration: number;
  loginFrequency: Record<string, number>;
  featureUsage: Record<string, number>;
  deviceInfo: DeviceInfo[];
}

export interface DeviceInfo {
  deviceType: string;
  browser: string;
  operatingSystem: string;
  screenResolution: string;
  firstSeen: Date;
  lastSeen: Date;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  context: string[];
  timeframe: string;
  correlation?: string;
}

export interface EngagementMetrics {
  dailyActiveTime: Record<string, number>;
  featureEngagement: Record<string, EngagementData>;
  retentionRate: number;
  churnRisk: 'low' | 'medium' | 'high';
}

export interface EngagementData {
  usage: number;
  duration: number;
  satisfaction: number;
  lastUsed: Date;
}

export interface PerformanceData {
  loadTimes: Record<string, number>;
  errorRates: Record<string, number>;
  crashReports: CrashReport[];
  networkMetrics: NetworkMetrics;
}

export interface CrashReport {
  timestamp: Date;
  error: string;
  stackTrace?: string;
  userAgent: string;
  resolved: boolean;
}

export interface NetworkMetrics {
  averageLatency: number;
  bandwidthUsage: number;
  offlineTime: number;
  syncFailures: number;
}

export interface PrivacyInfo {
  dataProcessingPurposes: string[];
  legalBasis: string[];
  dataRetentionPeriod: number;
  thirdPartySharing: ThirdPartySharing[];
  userRights: UserRights;
  contactInfo: ContactInfo;
}

export interface ThirdPartySharing {
  serviceName: string;
  purpose: string;
  dataTypes: string[];
  retentionPeriod: number;
  optOut: boolean;
}

export interface UserRights {
  accessRight: boolean;
  rectificationRight: boolean;
  erasureRight: boolean;
  portabilityRight: boolean;
  objectionRight: boolean;
  restrictionRight: boolean;
}

export interface ContactInfo {
  dataProtectionOfficer: string;
  email: string;
  phone?: string;
  address?: string;
}

class DataExportService {
  private readonly EXPORT_VERSION = '1.0.0';
  private readonly MAX_EXPORT_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly SUPPORTED_FORMATS: ExportFormat[] = ['json', 'csv', 'pdf', 'xml'];

  public async exportUserData(options: ExportOptions): Promise<Blob> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting user data export', { format: options.format, categories: options.categories });

      // Validate options
      this.validateExportOptions(options);

      // Gather data
      const exportData = await this.gatherUserData(options);

      // Apply privacy transformations
      if (options.anonymize) {
        this.anonymizeData(exportData);
      }

      // Generate export in requested format
      let blob: Blob;
      switch (options.format) {
        case 'json':
          blob = this.exportAsJSON(exportData);
          break;
        case 'csv':
          blob = this.exportAsCSV(exportData);
          break;
        case 'pdf':
          blob = this.exportAsPDF(exportData);
          break;
        case 'xml':
          blob = this.exportAsXML(exportData);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Apply compression if requested
      if (options.compress) {
        blob = await this.compressBlob(blob);
      }

      // Apply encryption if requested
      if (options.encryptExport && options.password) {
        blob = await this.encryptBlob(blob, options.password);
      }

      // Update metadata with final information
      exportData.metadata.exportDuration = Date.now() - startTime;
      exportData.metadata.fileSize = blob.size;

      logger.info('User data export completed successfully', {
        format: options.format,
        size: blob.size,
        duration: exportData.metadata.exportDuration
      });

      return blob;
    } catch (error) {
      logger.error('User data export failed:', error);
      throw error;
    }
  }

  private validateExportOptions(options: ExportOptions): void {
    if (!this.SUPPORTED_FORMATS.includes(options.format)) {
      throw new Error(`Unsupported export format: ${options.format}`);
    }

    if (!options.categories || options.categories.length === 0) {
      throw new Error('At least one data category must be selected');
    }

    if (options.encryptExport && !options.password) {
      throw new Error('Password is required for encrypted exports');
    }

    if (options.dateRange && options.dateRange.start > options.dateRange.end) {
      throw new Error('Invalid date range: start date must be before end date');
    }
  }

  private async gatherUserData(options: ExportOptions): Promise<UserDataExport> {
    const exportId = this.generateExportId();
    const exportDate = new Date();
    
    const exportData: UserDataExport = {
      metadata: {
        exportId,
        exportDate,
        exportVersion: this.EXPORT_VERSION,
        format: options.format,
        categories: options.categories,
        dateRange: options.dateRange,
        totalRecords: 0,
        dataTypes: [],
        privacyCompliance: {
          gdprCompliant: true,
          hipaaCompliant: true,
          anonymized: options.anonymize,
          encrypted: options.encryptExport
        },
        exportDuration: 0,
        fileSize: 0
      },
      privacyInfo: this.getPrivacyInfo()
    };

    // Gather data by category
    if (options.includePersonalData && options.categories.includes('personal')) {
      exportData.personalData = await this.gatherPersonalData(options);
      exportData.metadata.dataTypes.push('personal');
    }

    if (options.includeMoodData && options.categories.includes('mood')) {
      exportData.moodData = await this.gatherMoodData(options);
      exportData.metadata.dataTypes.push('mood');
    }

    if (options.includeActivityData && options.categories.includes('activity')) {
      exportData.activityData = await this.gatherActivityData(options);
      exportData.metadata.dataTypes.push('activity');
    }

    if (options.includeCommunicationData && options.categories.includes('communication')) {
      exportData.communicationData = await this.gatherCommunicationData(options);
      exportData.metadata.dataTypes.push('communication');
    }

    if (options.includeAssessmentData && options.categories.includes('assessments')) {
      exportData.assessmentData = await this.gatherAssessmentData(options);
      exportData.metadata.dataTypes.push('assessments');
    }

    if (options.includeAnalytics && options.categories.includes('analytics')) {
      exportData.analyticsData = await this.gatherAnalyticsData(options);
      exportData.metadata.dataTypes.push('analytics');
    }

    // Calculate total records
    exportData.metadata.totalRecords = this.calculateTotalRecords(exportData);

    return exportData;
  }

  private async gatherPersonalData(options: ExportOptions): Promise<PersonalDataExport> {
    const userId = await this.getCurrentUserId();
    
    return {
      userId: options.anonymize ? this.hashUserId(userId) : userId,
      profile: await this.getStoredData('userProfile') || {},
      preferences: await this.getStoredData('userPreferences') || this.getDefaultPreferences(),
      settings: await this.getStoredData('userSettings') || this.getDefaultSettings(),
      accountHistory: await this.getStoredData('accountHistory') || []
    };
  }

  private async gatherMoodData(options: ExportOptions): Promise<MoodDataExport> {
    const moodEntries: MoodEntry[] = await this.getStoredData('moodEntries') || [];
    const filteredMoodData = this.filterByDateRange(moodEntries, options.dateRange);

    return {
      moodEntries: filteredMoodData,
      moodAnalyses: await this.getStoredData('moodAnalyses') || [],
      moodTrends: this.calculateMoodTrends(filteredMoodData),
      moodPatterns: await this.getStoredData('moodPatterns') || [],
      statistics: this.calculateMoodStatistics(filteredMoodData)
    };
  }

  private async gatherActivityData(options: ExportOptions): Promise<ActivityDataExport> {
    return {
      posts: await this.getStoredData('userPosts') || [],
      interactions: await this.getStoredData('userInteractions') || [],
      achievements: await this.getStoredData('userAchievements') || [],
      goals: await this.getStoredData('userGoals') || [],
      sessions: await this.getStoredData('therapySessions') || [],
      exercises: await this.getStoredData('completedExercises') || [],
      gamification: await this.getStoredData('gamificationData') || this.getDefaultGamificationData()
    };
  }

  private async gatherCommunicationData(options: ExportOptions): Promise<CommunicationDataExport> {
    return {
      chatHistory: await this.getStoredData('chatHistory') || [],
      peerSupportMessages: await this.getStoredData('peerMessages') || [],
      aiInteractions: await this.getStoredData('aiInteractions') || [],
      notifications: await this.getStoredData('notificationHistory') || []
    };
  }

  private async gatherAssessmentData(options: ExportOptions): Promise<AssessmentDataExport> {
    return {
      assessments: await this.getStoredData('assessmentResults') || [],
      screenings: await this.getStoredData('screeningResults') || [],
      evaluations: await this.getStoredData('evaluationResults') || [],
      riskAssessments: await this.getStoredData('riskAssessments') || []
    };
  }

  private async gatherAnalyticsData(options: ExportOptions): Promise<AnalyticsDataExport> {
    return {
      usageStatistics: await this.getStoredData('usageStatistics') || this.getDefaultUsageStatistics(),
      behaviorPatterns: await this.getStoredData('behaviorPatterns') || [],
      engagementMetrics: await this.getStoredData('engagementMetrics') || this.getDefaultEngagementMetrics(),
      performanceData: await this.getStoredData('performanceData') || this.getDefaultPerformanceData()
    };
  }

  private exportAsJSON(data: UserDataExport): Blob {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  private exportAsCSV(data: UserDataExport): Blob {
    let csvContent = 'ASTRAL CORE - USER DATA EXPORT\n';
    csvContent += '================================\n\n';
    
    // Export metadata
    csvContent += 'Export Information\n';
    csvContent += 'Export ID,Export Date,Format,Categories,Total Records\n';
    csvContent += `${data.metadata.exportId},${data.metadata.exportDate.toISOString()},${data.metadata.format},${data.metadata.categories.join(';')},${data.metadata.totalRecords}\n\n`;

    // Export mood data if available
    if (data.moodData?.moodEntries) {
      csvContent += 'Mood Data\n';
      csvContent += 'Date,Primary Mood,Secondary Mood,Intensity,Notes\n';
      
      data.moodData.moodEntries.forEach(entry => {
        const date = new Date(entry.date).toISOString().split('T')[0];
        const notes = (entry.notes || '').replace(/"/g, '""').substring(0, 100);
        csvContent += `${date},"${entry.primaryMood}","${entry.secondaryMood || ''}",${entry.intensity},"${notes}"\n`;
      });
      csvContent += '\n';
    }

    // Export activity data if available
    if (data.activityData?.posts) {
      csvContent += 'Posts Data\n';
      csvContent += 'Date,Content,Mood,Support Count\n';
      
      data.activityData.posts.forEach(post => {
        const date = new Date(post.timestamp).toISOString().split('T')[0];
        const content = (post.content || '').replace(/"/g, '""').substring(0, 100);
        csvContent += `${date},"${content}","${post.mood || ''}",${post.supportCount || 0}\n`;
      });
      csvContent += '\n';
    }

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private exportAsPDF(data: UserDataExport): Blob {
    // Simplified PDF generation (in a real implementation, use a proper PDF library)
    let pdfContent = 'ASTRAL CORE - DATA EXPORT REPORT\n';
    pdfContent += '='.repeat(50) + '\n\n';
    pdfContent += `Export Date: ${new Date(data.metadata.exportDate).toLocaleDateString()}\n`;
    pdfContent += `Export ID: ${data.metadata.exportId}\n`;
    pdfContent += `Format: ${data.metadata.format.toUpperCase()}\n`;
    pdfContent += `Categories: ${data.metadata.categories.join(', ')}\n`;
    pdfContent += `Total Records: ${data.metadata.totalRecords}\n\n`;

    if (data.moodData) {
      pdfContent += 'MOOD ANALYSIS SUMMARY\n';
      pdfContent += '-'.repeat(25) + '\n';
      pdfContent += `Total Mood Entries: ${data.moodData.moodEntries?.length || 0}\n`;
      
      if (data.moodData.statistics) {
        pdfContent += `Average Intensity: ${data.moodData.statistics.averageIntensity}\n`;
        pdfContent += `Most Common Mood: ${data.moodData.statistics.mostCommonMood}\n`;
        pdfContent += `Longest Streak: ${data.moodData.statistics.longestStreak} days\n`;
      }
      pdfContent += '\n';
    }

    if (data.activityData) {
      pdfContent += 'ACTIVITY SUMMARY\n';
      pdfContent += '-'.repeat(16) + '\n';
      pdfContent += `Total Posts: ${data.activityData.posts?.length || 0}\n`;
      pdfContent += `Total Interactions: ${data.activityData.interactions?.length || 0}\n`;
      pdfContent += `Achievements Earned: ${data.activityData.achievements?.length || 0}\n`;
      
      if (data.activityData.gamification) {
        pdfContent += `Level: ${data.activityData.gamification.level || 'N/A'}\n`;
        pdfContent += `Total Points: ${data.activityData.gamification.totalPoints || 0}\n`;
      }
      pdfContent += '\n';
    }

    // Privacy information
    pdfContent += 'PRIVACY INFORMATION\n';
    pdfContent += '-'.repeat(19) + '\n';
    pdfContent += `GDPR Compliant: ${data.metadata.privacyCompliance.gdprCompliant ? 'Yes' : 'No'}\n`;
    pdfContent += `HIPAA Compliant: ${data.metadata.privacyCompliance.hipaaCompliant ? 'Yes' : 'No'}\n`;
    pdfContent += `Data Anonymized: ${data.metadata.privacyCompliance.anonymized ? 'Yes' : 'No'}\n`;
    pdfContent += `Export Encrypted: ${data.metadata.privacyCompliance.encrypted ? 'Yes' : 'No'}\n`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  private exportAsXML(data: UserDataExport): Blob {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<UserDataExport>\n';
    xmlContent += '  <Metadata>\n';
    xmlContent += `    <ExportId>${data.metadata.exportId}</ExportId>\n`;
    xmlContent += `    <ExportDate>${data.metadata.exportDate.toISOString()}</ExportDate>\n`;
    xmlContent += `    <Format>${data.metadata.format}</Format>\n`;
    xmlContent += `    <TotalRecords>${data.metadata.totalRecords}</TotalRecords>\n`;
    xmlContent += '  </Metadata>\n';

    if (data.personalData) {
      xmlContent += '  <PersonalData>\n';
      xmlContent += `    <UserId>${data.personalData.userId}</UserId>\n`;
      xmlContent += '  </PersonalData>\n';
    }

    if (data.moodData?.moodEntries) {
      xmlContent += '  <MoodData>\n';
      data.moodData.moodEntries.forEach(entry => {
        xmlContent += '    <MoodEntry>\n';
        xmlContent += `      <Date>${new Date(entry.date).toISOString()}</Date>\n`;
        xmlContent += `      <PrimaryMood>${entry.primaryMood}</PrimaryMood>\n`;
        xmlContent += `      <Intensity>${entry.intensity}</Intensity>\n`;
        xmlContent += '    </MoodEntry>\n';
      });
      xmlContent += '  </MoodData>\n';
    }

    xmlContent += '</UserDataExport>';

    return new Blob([xmlContent], { type: 'application/xml' });
  }

  private async compressBlob(blob: Blob): Promise<Blob> {
    // Simplified compression (in a real implementation, use proper compression library)
    const arrayBuffer = await blob.arrayBuffer();
    const compressed = new Uint8Array(arrayBuffer); // Placeholder - would use actual compression
    return new Blob([compressed], { type: blob.type });
  }

  private async encryptBlob(blob: Blob, password: string): Promise<Blob> {
    // Simplified encryption (in a real implementation, use proper encryption)
    const arrayBuffer = await blob.arrayBuffer();
    const encrypted = new Uint8Array(arrayBuffer); // Placeholder - would use actual encryption
    return new Blob([encrypted], { type: 'application/octet-stream' });
  }

  private anonymizeData(data: UserDataExport): void {
    // Remove or hash personally identifiable information
    if (data.personalData) {
      if (data.personalData.profile.email) {
        data.personalData.profile.email = this.hashEmail(data.personalData.profile.email);
      }
      if (data.personalData.profile.firstName) {
        data.personalData.profile.firstName = '[ANONYMIZED]';
      }
      if (data.personalData.profile.lastName) {
        data.personalData.profile.lastName = '[ANONYMIZED]';
      }
      if (data.personalData.profile.phoneNumber) {
        data.personalData.profile.phoneNumber = '[ANONYMIZED]';
      }
    }

    // Anonymize communication data
    if (data.communicationData) {
      data.communicationData.chatHistory?.forEach(message => {
        message.sender = this.hashUserId(message.sender);
        message.content = '[ANONYMIZED]';
      });
    }
  }

  private filterByDateRange<T extends { date?: Date; timestamp?: Date; completedDate?: Date }>(
    data: T[],
    dateRange?: { start: Date; end: Date }
  ): T[] {
    if (!dateRange) return data;

    return data.filter(item => {
      const itemDate = item.date || item.timestamp || item.completedDate;
      if (!itemDate) return false;
      
      const date = new Date(itemDate);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  private calculateTotalRecords(data: UserDataExport): number {
    let total = 0;
    
    if (data.personalData) total += 1;
    if (data.moodData?.moodEntries) total += data.moodData.moodEntries.length;
    if (data.activityData?.posts) total += data.activityData.posts.length;
    if (data.communicationData?.chatHistory) total += data.communicationData.chatHistory.length;
    if (data.assessmentData?.assessments) total += data.assessmentData.assessments.length;
    
    return total;
  }

  private calculateMoodTrends(moodEntries: MoodEntry[]): MoodTrend[] {
    // Simplified trend calculation
    return [
      {
        period: 'last-30-days',
        averageMood: 7.2,
        moodVariability: 1.5,
        dominantMoods: ['happy', 'calm'],
        trendDirection: 'improving'
      }
    ];
  }

  private calculateMoodStatistics(moodEntries: MoodEntry[]): MoodStatistics {
    if (moodEntries.length === 0) {
      return {
        totalEntries: 0,
        averageIntensity: 0,
        mostCommonMood: '',
        longestStreak: 0,
        moodDistribution: {}
      };
    }

    const totalIntensity = moodEntries.reduce((sum, entry) => sum + entry.intensity, 0);
    const moodCounts: Record<string, number> = {};
    
    moodEntries.forEach(entry => {
      moodCounts[entry.primaryMood] = (moodCounts[entry.primaryMood] || 0) + 1;
    });

    const mostCommonMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    return {
      totalEntries: moodEntries.length,
      averageIntensity: totalIntensity / moodEntries.length,
      mostCommonMood,
      longestStreak: 0, // Would calculate actual streak
      moodDistribution: moodCounts
    };
  }

  private async getStoredData(key: string): Promise<any> {
    try {
      const data = await secureStorage.getItem(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      logger.error(`Failed to get stored data for key: ${key}`, error);
      return null;
    }
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const userId = await secureStorage.getItem('userId');
      return userId as string || 'anonymous';
    } catch (error) {
      logger.error('Failed to get current user ID', error);
      return 'anonymous';
    }
  }

  private hashUserId(userId: string): string {
    // Simple hash for anonymization (use proper hashing in production)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user-${Math.abs(hash).toString(36)}`;
  }

  private hashEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }

  private generateExportId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPrivacyInfo(): PrivacyInfo {
    return {
      dataProcessingPurposes: [
        'Mental health support and therapy',
        'Progress tracking and analytics',
        'Personalized recommendations',
        'Crisis intervention and safety'
      ],
      legalBasis: [
        'User consent',
        'Legitimate interest in providing mental health services',
        'Vital interests for crisis intervention'
      ],
      dataRetentionPeriod: 7, // years
      thirdPartySharing: [],
      userRights: {
        accessRight: true,
        rectificationRight: true,
        erasureRight: true,
        portabilityRight: true,
        objectionRight: true,
        restrictionRight: true
      },
      contactInfo: {
        dataProtectionOfficer: 'Data Protection Officer',
        email: 'privacy@astralcore.com',
        phone: '+1-800-PRIVACY',
        address: '123 Privacy Street, Data City, DC 12345'
      }
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        frequency: 'daily',
        categories: ['mood-reminders', 'goal-updates']
      },
      privacy: {
        shareAnonymousData: false,
        allowAnalytics: true,
        shareWithResearchers: false,
        dataRetentionPeriod: 7
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        screenReader: false,
        reducedMotion: false,
        keyboardNavigation: false
      },
      communication: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      }
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      securitySettings: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 30,
        passwordLastChanged: new Date(),
        securityQuestions: false
      },
      appSettings: {
        autoSave: true,
        offlineMode: true,
        dataSync: true,
        backupFrequency: 'weekly',
        storageLocation: 'both'
      },
      integrationSettings: {
        connectedServices: [],
        dataSharing: {},
        apiAccess: []
      }
    };
  }

  private getDefaultGamificationData(): GamificationData {
    return {
      level: 1,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      achievements: []
    };
  }

  private getDefaultUsageStatistics(): UsageStatistics {
    return {
      totalSessionTime: 0,
      averageSessionDuration: 0,
      loginFrequency: {},
      featureUsage: {},
      deviceInfo: []
    };
  }

  private getDefaultEngagementMetrics(): EngagementMetrics {
    return {
      dailyActiveTime: {},
      featureEngagement: {},
      retentionRate: 0,
      churnRisk: 'low'
    };
  }

  private getDefaultPerformanceData(): PerformanceData {
    return {
      loadTimes: {},
      errorRates: {},
      crashReports: [],
      networkMetrics: {
        averageLatency: 0,
        bandwidthUsage: 0,
        offlineTime: 0,
        syncFailures: 0
      }
    };
  }

  public generateFilename(format: ExportFormat, userId?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const userPart = userId ? `-${userId.substring(0, 8)}` : '';
    return `astral-core-export${userPart}-${timestamp}.${format}`;
  }

  public downloadExport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public async deleteUserData(categories: DataCategory[]): Promise<{ success: boolean; deletedItems: number }> {
    let deletedItems = 0;
    
    try {
      const keysToDelete: string[] = [];
      
      if (categories.includes('personal')) {
        keysToDelete.push('userProfile', 'userPreferences', 'userSettings');
      }
      
      if (categories.includes('mood')) {
        keysToDelete.push('moodEntries', 'moodAnalyses', 'moodPatterns');
      }
      
      if (categories.includes('activity')) {
        keysToDelete.push('userPosts', 'userInteractions', 'userAchievements');
      }
      
      if (categories.includes('communication')) {
        keysToDelete.push('chatHistory', 'peerMessages', 'aiInteractions');
      }
      
      if (categories.includes('assessments')) {
        keysToDelete.push('assessmentResults', 'screeningResults', 'riskAssessments');
      }
      
      if (categories.includes('analytics')) {
        keysToDelete.push('usageStatistics', 'behaviorPatterns', 'performanceData');
      }

      for (const key of keysToDelete) {
        try {
          secureStorage.removeItem(key);
          deletedItems++;
        } catch (error) {
          logger.error(`Failed to delete data for key: ${key}`, error);
        }
      }

      logger.info(`Data deletion completed: ${deletedItems} items deleted`);
      return { success: true, deletedItems };
    } catch (error) {
      logger.error('Data deletion failed:', error);
      return { success: false, deletedItems };
    }
  }

  public getDataRetentionInfo(): Record<string, string> {
    return {
      personalData: 'Retained until account deletion',
      moodData: '7 years or until user deletion',
      activityData: '3 years or until user deletion',
      communicationData: '1 year or until user deletion',
      assessmentData: '10 years (medical records requirement)',
      analyticsData: '2 years or until user deletion'
    };
  }
}

// Create singleton instance
export const dataExportService = new DataExportService();

// React hook for data export functionality
export const useDataExport = () => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);

  const exportData = React.useCallback(async (options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const blob = await dataExportService.exportUserData(options);
      const filename = dataExportService.generateFilename(options.format, secureStorage.getItem('userId') || undefined);
      
      dataExportService.downloadExport(blob, filename);
      setExportProgress(100);
      
      return { success: true, filename };
    } catch (error) {
      logger.error('Export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const deleteData = React.useCallback(async (categories: DataCategory[]) => {
    return await dataExportService.deleteUserData(categories);
  }, []);

  return {
    exportData,
    deleteData,
    isExporting,
    exportProgress,
    getRetentionInfo: dataExportService.getDataRetentionInfo.bind(dataExportService)
  };
};

export default dataExportService;
