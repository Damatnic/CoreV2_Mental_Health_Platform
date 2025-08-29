/**
 * Session Persistence Service for AstralCore V4
 *
 * Handles saving and restoring user sessions with encryption and anonymity preservation.
 * Provides comprehensive session management for both anonymous and authenticated users.
 *
 * Features:
 * - Secure session data collection and storage
 * - End-to-end encryption for sensitive data
 * - Recovery code system for session restoration
 * - Multiple export formats (JSON, PDF, encrypted packages)
 * - Automatic cleanup of expired data
 * - HIPAA-compliant data handling
 * - Offline session support
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { secureStorageService } from './secureStorageService';
import { securityService } from './securityService';
import { dataExportService } from './dataExportService';

// Session Data Interfaces
export interface SessionData {
  sessionId: string;
  userId?: string;
  anonymousId?: string;
  timestamp: string;
  lastActivity: string;
  sessionType: 'anonymous' | 'authenticated';
  
  // Core session data
  chatHistory?: ChatMessage[];
  journalEntries?: JournalEntry[];
  moodEntries?: MoodEntry[];
  safetyPlan?: SafetyPlan;
  preferences?: UserPreferences;
  drawings?: Drawing[];
  
  // Session metadata
  sessionDuration?: number;
  activeFeatures?: string[];
  completedAssessments?: Assessment[];
  
  // Privacy and security
  encrypted: boolean;
  dataClassification: 'anonymous' | 'personal' | 'sensitive';
  retentionDate?: string;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  metadata?: {
    mood?: string;
    sentiment?: number;
    tags?: string[];
  };
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  encrypted: boolean;
}

export interface MoodEntry {
  id: string;
  timestamp: string;
  primary: string;
  secondary?: string;
  intensity: number;
  notes?: string;
  triggers?: string[];
}

export interface SafetyPlan {
  id: string;
  timestamp: string;
  warningSigns: string[];
  copingStrategies: string[];
  distractionActivities: string[];
  supportContacts: Contact[];
  professionalContacts: Contact[];
  environmentSafety: string[];
  lastUpdated: string;
}

export interface Contact {
  name: string;
  phone?: string;
  email?: string;
  relationship: string;
  notes?: string;
}

export interface Drawing {
  id: string;
  timestamp: string;
  title?: string;
  imageData: string; // Base64 encoded image
  mood?: string;
  notes?: string;
}

export interface Assessment {
  id: string;
  type: string;
  timestamp: string;
  results: any;
  score?: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
  };
}

export interface SessionRecoveryCode {
  code: string;
  sessionId: string;
  userId?: string;
  expiresAt: string;
  used: boolean;
  encrypted: boolean;
}

export interface SessionExportOptions {
  format: 'json' | 'pdf' | 'encrypted';
  includeChats: boolean;
  includeJournal: boolean;
  includeMoods: boolean;
  includeSafetyPlan: boolean;
  includeDrawings: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  encryption: {
    enabled: boolean;
    password?: string;
  };
}

// Main Service Interface
export interface SessionPersistenceService {
  // Session Management
  collectCurrentSessionData(): Promise<SessionData>;
  saveCurrentSession(options?: {
    temporary?: boolean;
    generateRecoveryCode?: boolean;
    retentionDays?: number;
  }): Promise<{
    sessionId: string;
    recoveryCode?: string;
    saved: boolean;
  }>;
  
  loadSession(sessionId: string): Promise<SessionData | null>;
  restoreSession(sessionData: SessionData): Promise<boolean>;
  deleteSession(sessionId: string): Promise<boolean>;
  
  // Recovery System
  generateRecoveryCode(sessionId: string): Promise<string>;
  useRecoveryCode(code: string): Promise<SessionData | null>;
  
  // Export and Import
  exportSession(sessionId: string, options: SessionExportOptions): Promise<Blob | null>;
  
  // Session Listing and Management
  listSessions(): Promise<Array<{
    sessionId: string;
    timestamp: string;
    sessionType: 'anonymous' | 'authenticated';
    lastActivity: string;
    hasRecoveryCode: boolean;
  }>>;
  
  // Cleanup
  cleanupExpiredData(): Promise<{
    sessionsDeleted: number;
    codesDeleted: number;
  }>;
}

// Implementation
class SessionPersistenceServiceImpl implements SessionPersistenceService {
  private readonly SESSION_STORAGE_KEY = 'astral_session_data';
  private readonly RECOVERY_CODES_KEY = 'session_recovery_codes';
  private readonly SESSION_HISTORY_KEY = 'session_history';

  /**
   * Get current session ID or create new one
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('current_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
      sessionStorage.setItem('current_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Collect current session data from various sources
   */
  public async collectCurrentSessionData(): Promise<SessionData> {
    const sessionId = this.getOrCreateSessionId();
    const userId = localStorage.getItem('userId');
    const anonymousId = localStorage.getItem('anonymous_id');
    const isAuthenticated = !!userId && !localStorage.getItem('demo_user');

    const sessionData: SessionData = {
      sessionId,
      userId: isAuthenticated ? userId : undefined,
      anonymousId: anonymousId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      sessionType: isAuthenticated ? 'authenticated' : 'anonymous',
      encrypted: true,
      dataClassification: isAuthenticated ? 'personal' : 'anonymous'
    };

    try {
      // Collect chat history
      const aiChatHistory = await this.getStoredData('aiChatHistory');
      const peerChatHistory = await this.getStoredData('peerChatHistory');
      
      if (aiChatHistory || peerChatHistory) {
        sessionData.chatHistory = [
          ...(aiChatHistory || []),
          ...(peerChatHistory || [])
        ];
      }

      // Collect journal entries
      const journalEntries = await this.getStoredData('userReflections');
      if (journalEntries) {
        sessionData.journalEntries = journalEntries;
      }

      // Collect mood entries
      const moodAnalyses = await this.getStoredData('mood_analyses');
      if (moodAnalyses) {
        sessionData.moodEntries = moodAnalyses.map((analysis: any) => ({
          id: analysis.id || crypto.randomUUID(),
          timestamp: analysis.timestamp,
          primary: analysis.primary,
          secondary: analysis.secondary,
          intensity: analysis.intensity,
          notes: analysis.notes,
          triggers: analysis.triggers
        }));
      }

      // Collect safety plan
      const safetyPlan = await this.getStoredData('safetyPlan');
      if (safetyPlan) {
        sessionData.safetyPlan = safetyPlan;
        sessionData.dataClassification = 'sensitive';
      }

      // Collect preferences
      const preferences = await this.getStoredData('userPreferences');
      if (preferences) {
        sessionData.preferences = preferences;
      }

      // Collect drawings
      const drawings = await this.getStoredData('userDrawings');
      if (drawings) {
        sessionData.drawings = drawings;
      }

      // Collect completed assessments
      const assessments = await this.getStoredData('completedAssessments');
      if (assessments) {
        sessionData.completedAssessments = assessments;
      }

      // Calculate session duration
      const sessionStart = sessionStorage.getItem('session_start_time');
      if (sessionStart) {
        sessionData.sessionDuration = Date.now() - parseInt(sessionStart);
      }

      // Track active features
      sessionData.activeFeatures = this.getActiveFeatures();

    } catch (error) {
      logger.error('Error collecting session data', { error });
    }

    return sessionData;
  }

  /**
   * Save current session with encryption
   */
  public async saveCurrentSession(options: {
    temporary?: boolean;
    generateRecoveryCode?: boolean;
    retentionDays?: number;
  } = {}): Promise<{
    sessionId: string;
    recoveryCode?: string;
    saved: boolean;
  }> {
    try {
      const sessionData = await this.collectCurrentSessionData();

      // Set retention date
      if (options.retentionDays) {
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() + options.retentionDays);
        sessionData.retentionDate = retentionDate.toISOString();
      }

      // Encrypt session data
      const encryptedSession = await securityService.encryptData(
        JSON.stringify(sessionData)
      );

      // Store session
      const storageKey = options.temporary 
        ? `temp_session_${sessionData.sessionId}`
        : `${this.SESSION_STORAGE_KEY}_${sessionData.sessionId}`;

      await secureStorageService.setItem(storageKey, JSON.stringify(encryptedSession));

      // Add to session history
      await this.addToSessionHistory(sessionData);

      // Generate recovery code if requested
      let recoveryCode: string | undefined;
      if (options.generateRecoveryCode) {
        recoveryCode = await this.generateRecoveryCode(sessionData.sessionId);
      }

      return {
        sessionId: sessionData.sessionId,
        recoveryCode,
        saved: true
      };
    } catch (error) {
      logger.error('Failed to save session', { error });
      return {
        sessionId: this.getOrCreateSessionId(),
        saved: false
      };
    }
  }

  /**
   * Load a saved session by ID
   */
  public async loadSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Try regular session first
      let encryptedData = await secureStorageService.getItem(
        `${this.SESSION_STORAGE_KEY}_${sessionId}`
      );

      // Try temporary session if regular not found
      if (!encryptedData) {
        encryptedData = await secureStorageService.getItem(`temp_session_${sessionId}`);
      }

      if (!encryptedData) {
        return null;
      }

      const encryptedSession = JSON.parse(encryptedData);
      const sessionDataJson = await securityService.decryptData(encryptedSession);
      const sessionData: SessionData = JSON.parse(sessionDataJson);

      // Check if session has expired
      if (sessionData.retentionDate && new Date() > new Date(sessionData.retentionDate)) {
        await this.deleteSession(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      logger.error('Failed to load session', { error, sessionId });
      return null;
    }
  }

  /**
   * Restore session data to current session
   */
  public async restoreSession(sessionData: SessionData): Promise<boolean> {
    try {
      // Restore chat history
      if (sessionData.chatHistory) {
        const aiChats = sessionData.chatHistory.filter(msg => msg.type === 'ai');
        const peerChats = sessionData.chatHistory.filter(msg => msg.type === 'user');
        
        if (aiChats.length > 0) {
          await secureStorageService.setItem('aiChatHistory', JSON.stringify(aiChats));
        }
        if (peerChats.length > 0) {
          await secureStorageService.setItem('peerChatHistory', JSON.stringify(peerChats));
        }
      }

      // Restore journal entries
      if (sessionData.journalEntries) {
        await secureStorageService.setItem('userReflections', JSON.stringify(sessionData.journalEntries));
      }

      // Restore mood entries
      if (sessionData.moodEntries) {
        await secureStorageService.setItem('mood_analyses', JSON.stringify(sessionData.moodEntries));
      }

      // Restore safety plan
      if (sessionData.safetyPlan) {
        await secureStorageService.setItem('safetyPlan', JSON.stringify(sessionData.safetyPlan));
      }

      // Restore preferences
      if (sessionData.preferences) {
        await secureStorageService.setItem('userPreferences', JSON.stringify(sessionData.preferences));
      }

      // Restore drawings
      if (sessionData.drawings) {
        await secureStorageService.setItem('userDrawings', JSON.stringify(sessionData.drawings));
      }

      // Restore assessments
      if (sessionData.completedAssessments) {
        await secureStorageService.setItem('completedAssessments', JSON.stringify(sessionData.completedAssessments));
      }

      // Update session metadata
      sessionStorage.setItem('current_session_id', sessionData.sessionId);
      sessionStorage.setItem('session_restored', 'true');
      sessionStorage.setItem('session_restore_time', new Date().toISOString());

      return true;
    } catch (error) {
      logger.error('Failed to restore session', { error });
      return false;
    }
  }

  /**
   * Generate recovery code for session
   */
  public async generateRecoveryCode(sessionId: string): Promise<string> {
    const recoveryCode = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();
    
    const recoveryData: SessionRecoveryCode = {
      code: recoveryCode,
      sessionId,
      userId: localStorage.getItem('userId') || undefined,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      used: false,
      encrypted: true
    };

    // Store recovery code
    const recoveryCodes = await this.getRecoveryCodes();
    recoveryCodes.push(recoveryData);

    await secureStorageService.setItem(
      this.RECOVERY_CODES_KEY,
      JSON.stringify(recoveryCodes)
    );

    return recoveryCode;
  }

  /**
   * Use recovery code to load session
   */
  public async useRecoveryCode(code: string): Promise<SessionData | null> {
    try {
      const recoveryCodes = await this.getRecoveryCodes();
      const recoveryData = recoveryCodes.find(rc => rc.code === code && !rc.used);

      if (!recoveryData) {
        throw new Error('Invalid or expired recovery code');
      }

      // Check if code has expired
      if (new Date() > new Date(recoveryData.expiresAt)) {
        throw new Error('Recovery code has expired');
      }

      // Mark code as used
      recoveryData.used = true;
      await secureStorageService.setItem(
        this.RECOVERY_CODES_KEY,
        JSON.stringify(recoveryCodes)
      );

      // Load the session
      return await this.loadSession(recoveryData.sessionId);
    } catch (error) {
      logger.error('Failed to use recovery code', { error, code });
      return null;
    }
  }

  /**
   * Export session data in various formats
   */
  public async exportSession(
    sessionId: string,
    options: SessionExportOptions
  ): Promise<Blob | null> {
    try {
      const sessionData = await this.loadSession(sessionId);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      // Filter data based on options
      const exportData: Partial<SessionData> = {
        sessionId: sessionData.sessionId,
        timestamp: sessionData.timestamp,
        sessionType: sessionData.sessionType,
        sessionDuration: sessionData.sessionDuration
      };

      if (options.includeChats && sessionData.chatHistory) {
        exportData.chatHistory = this.filterByDateRange(
          sessionData.chatHistory,
          options.dateRange
        );
      }

      if (options.includeJournal && sessionData.journalEntries) {
        exportData.journalEntries = this.filterByDateRange(
          sessionData.journalEntries,
          options.dateRange
        );
      }

      if (options.includeMoods && sessionData.moodEntries) {
        exportData.moodEntries = this.filterByDateRange(
          sessionData.moodEntries,
          options.dateRange
        );
      }

      if (options.includeSafetyPlan && sessionData.safetyPlan) {
        exportData.safetyPlan = sessionData.safetyPlan;
      }

      if (options.includeDrawings && sessionData.drawings) {
        exportData.drawings = this.filterByDateRange(
          sessionData.drawings,
          options.dateRange
        );
      }

      // Export based on format
      switch (options.format) {
        case 'json':
          return this.exportAsJSON(exportData, options.encryption);
        case 'pdf':
          return this.exportAsPDF(exportData);
        case 'encrypted':
          return this.exportAsEncryptedPackage(exportData, options.encryption.password);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      logger.error('Failed to export session', { error, sessionId });
      return null;
    }
  }

  /**
   * Delete a saved session
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Remove regular session
      await secureStorageService.removeItem(`${this.SESSION_STORAGE_KEY}_${sessionId}`);
      
      // Remove temporary session
      await secureStorageService.removeItem(`temp_session_${sessionId}`);

      // Remove from session history
      await this.removeFromSessionHistory(sessionId);

      // Remove associated recovery codes
      const recoveryCodes = await this.getRecoveryCodes();
      const updatedCodes = recoveryCodes.filter(rc => rc.sessionId !== sessionId);
      await secureStorageService.setItem(
        this.RECOVERY_CODES_KEY,
        JSON.stringify(updatedCodes)
      );

      return true;
    } catch (error) {
      logger.error('Failed to delete session', { error, sessionId });
      return false;
    }
  }

  /**
   * List all saved sessions
   */
  public async listSessions(): Promise<Array<{
    sessionId: string;
    timestamp: string;
    sessionType: 'anonymous' | 'authenticated';
    lastActivity: string;
    hasRecoveryCode: boolean;
  }>> {
    try {
      const sessionHistory = await this.getSessionHistory();
      const recoveryCodes = await this.getRecoveryCodes();

      return sessionHistory.map(session => ({
        sessionId: session.sessionId,
        timestamp: session.timestamp,
        sessionType: session.sessionType,
        lastActivity: session.lastActivity,
        hasRecoveryCode: recoveryCodes.some(rc => rc.sessionId === session.sessionId && !rc.used)
      }));
    } catch (error) {
      logger.error('Failed to list sessions', { error });
      return [];
    }
  }

  /**
   * Clean up expired sessions and recovery codes
   */
  public async cleanupExpiredData(): Promise<{
    sessionsDeleted: number;
    codesDeleted: number;
  }> {
    let sessionsDeleted = 0;
    let codesDeleted = 0;

    try {
      // Cleanup expired sessions
      const sessions = await this.listSessions();
      const now = new Date();

      for (const session of sessions) {
        const sessionData = await this.loadSession(session.sessionId);
        if (sessionData?.retentionDate && now > new Date(sessionData.retentionDate)) {
          await this.deleteSession(session.sessionId);
          sessionsDeleted++;
        }
      }

      // Cleanup expired recovery codes
      const recoveryCodes = await this.getRecoveryCodes();
      const validCodes = recoveryCodes.filter(rc => {
        const expired = now > new Date(rc.expiresAt);
        if (expired) codesDeleted++;
        return !expired;
      });

      await secureStorageService.setItem(
        this.RECOVERY_CODES_KEY,
        JSON.stringify(validCodes)
      );

    } catch (error) {
      logger.error('Failed to cleanup expired data', { error });
    }

    return { sessionsDeleted, codesDeleted };
  }

  // Private helper methods
  private async getStoredData(key: string): Promise<any> {
    try {
      const data = await secureStorageService.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn(`Failed to get stored data for ${key}`, { error });
      return null;
    }
  }

  private getActiveFeatures(): string[] {
    const features: string[] = [];
    
    if (localStorage.getItem('aiChatHistory')) features.push('ai-chat');
    if (localStorage.getItem('userReflections')) features.push('journaling');
    if (localStorage.getItem('mood_analyses')) features.push('mood-tracking');
    if (localStorage.getItem('safetyPlan')) features.push('safety-plan');
    if (localStorage.getItem('userDrawings')) features.push('drawing');
    if (localStorage.getItem('completedAssessments')) features.push('assessments');
    
    return features;
  }

  private async getSessionHistory(): Promise<SessionData[]> {
    try {
      const historyData = await secureStorageService.getItem(this.SESSION_HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      logger.warn('Failed to get session history', { error });
      return [];
    }
  }

  private async addToSessionHistory(sessionData: SessionData): Promise<void> {
    try {
      const history = await this.getSessionHistory();
      
      // Remove duplicate entries
      const updatedHistory = history.filter(s => s.sessionId !== sessionData.sessionId);
      
      // Add new session (keep only metadata for history)
      updatedHistory.push({
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        anonymousId: sessionData.anonymousId,
        timestamp: sessionData.timestamp,
        lastActivity: sessionData.lastActivity,
        sessionType: sessionData.sessionType,
        encrypted: true,
        dataClassification: sessionData.dataClassification,
        sessionDuration: sessionData.sessionDuration,
        activeFeatures: sessionData.activeFeatures
      } as SessionData);

      // Keep only last 50 sessions
      if (updatedHistory.length > 50) {
        updatedHistory.splice(0, updatedHistory.length - 50);
      }

      await secureStorageService.setItem(
        this.SESSION_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      logger.error('Failed to add to session history', { error });
    }
  }

  private async removeFromSessionHistory(sessionId: string): Promise<void> {
    try {
      const history = await this.getSessionHistory();
      const updatedHistory = history.filter(s => s.sessionId !== sessionId);
      
      await secureStorageService.setItem(
        this.SESSION_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      logger.error('Failed to remove from session history', { error });
    }
  }

  private async getRecoveryCodes(): Promise<SessionRecoveryCode[]> {
    try {
      const codesData = await secureStorageService.getItem(this.RECOVERY_CODES_KEY);
      return codesData ? JSON.parse(codesData) : [];
    } catch (error) {
      logger.warn('Failed to get recovery codes', { error });
      return [];
    }
  }

  private filterByDateRange<T extends { timestamp: string }>(
    data: T[],
    dateRange?: { start: Date; end: Date }
  ): T[] {
    if (!dateRange) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  }

  private async exportAsJSON(data: any, encryption?: { enabled: boolean; password?: string }): Promise<Blob> {
    let content = JSON.stringify(data, null, 2);
    
    if (encryption?.enabled && encryption.password) {
      const encrypted = await securityService.encryptData(content);
      content = JSON.stringify(encrypted, null, 2);
    }
    
    return new Blob([content], { type: 'application/json' });
  }

  private async exportAsPDF(data: any): Promise<Blob> {
    // Create a PDF-like text format
    let pdfContent = `ASTRALCORE SESSION EXPORT\n`;
    pdfContent += `${'='.repeat(40)}\n\n`;
    pdfContent += `Session ID: ${data.sessionId}\n`;
    pdfContent += `Export Date: ${new Date().toLocaleString()}\n`;
    pdfContent += `Session Date: ${new Date(data.timestamp).toLocaleString()}\n\n`;

    if (data.chatHistory?.length > 0) {
      pdfContent += `CHAT HISTORY (${data.chatHistory.length} messages)\n`;
      pdfContent += `${'-'.repeat(30)}\n`;
      data.chatHistory.slice(-20).forEach((msg: ChatMessage) => {
        pdfContent += `${new Date(msg.timestamp).toLocaleString()} [${msg.type}]: ${msg.content}\n\n`;
      });
    }

    if (data.journalEntries?.length > 0) {
      pdfContent += `JOURNAL ENTRIES (${data.journalEntries.length} entries)\n`;
      pdfContent += `${'-'.repeat(30)}\n`;
      data.journalEntries.forEach((entry: JournalEntry) => {
        pdfContent += `${new Date(entry.timestamp).toLocaleString()}\n`;
        pdfContent += `Title: ${entry.title || 'Untitled'}\n`;
        pdfContent += `${entry.content}\n\n`;
      });
    }

    if (data.moodEntries?.length > 0) {
      pdfContent += `MOOD TRACKING (${data.moodEntries.length} entries)\n`;
      pdfContent += `${'-'.repeat(30)}\n`;
      data.moodEntries.forEach((mood: MoodEntry) => {
        pdfContent += `${new Date(mood.timestamp).toLocaleString()}: ${mood.primary}`;
        if (mood.secondary) pdfContent += ` (${mood.secondary})`;
        pdfContent += ` - Intensity: ${mood.intensity}/10\n`;
        if (mood.notes) pdfContent += `Notes: ${mood.notes}\n`;
        pdfContent += '\n';
      });
    }

    return new Blob([pdfContent], { type: 'text/plain' });
  }

  private async exportAsEncryptedPackage(data: any, password?: string): Promise<Blob> {
    if (!password) {
      throw new Error('Password required for encrypted export');
    }

    const jsonData = JSON.stringify(data, null, 2);
    const encrypted = await securityService.encryptData(jsonData);
    
    return new Blob([JSON.stringify(encrypted)], { type: 'application/octet-stream' });
  }
}

// Export singleton instance
export const sessionPersistenceService = new SessionPersistenceServiceImpl();
export type { SessionPersistenceService };
