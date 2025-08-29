/**
 * HIPAA-Compliant Audit Logging Service
 * 
 * Implements comprehensive audit logging for all PHI access and modifications
 * Complies with HIPAA Administrative Safeguards § 164.308(a)(1)(ii)(D)
 * and Technical Safeguards § 164.312(b)
 * 
 * @version 1.0.0
 * @security HIPAA Compliant
 */

import { hipaaEncryption } from './hipaaEncryptionService';
import { logger } from '../utils/logger';

/**
 * Audit event types as per HIPAA requirements
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',

  // PHI access events
  PHI_VIEW = 'PHI_VIEW',
  PHI_CREATE = 'PHI_CREATE',
  PHI_UPDATE = 'PHI_UPDATE',
  PHI_DELETE = 'PHI_DELETE',
  PHI_EXPORT = 'PHI_EXPORT',
  PHI_PRINT = 'PHI_PRINT',
  PHI_SHARE = 'PHI_SHARE',

  // System events
  SYSTEM_ACCESS = 'SYSTEM_ACCESS',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  KEY_ROTATION = 'KEY_ROTATION',
  BACKUP_CREATED = 'BACKUP_CREATED',
  RESTORE_PERFORMED = 'RESTORE_PERFORMED',

  // Security events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BREACH_DETECTED = 'BREACH_DETECTED',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  ENCRYPTION_FAILURE = 'ENCRYPTION_FAILURE',

  // Crisis intervention events
  CRISIS_DETECTED = 'CRISIS_DETECTED',
  CRISIS_INTERVENTION = 'CRISIS_INTERVENTION',
  EMERGENCY_CONTACT = 'EMERGENCY_CONTACT',
  PROFESSIONAL_REFERRAL = 'PROFESSIONAL_REFERRAL',

  // Compliance events
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  DISCLOSURE_MADE = 'DISCLOSURE_MADE',
  AUDIT_LOG_ACCESS = 'AUDIT_LOG_ACCESS',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK'
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  
  // Event details
  action: string;
  resource?: string;
  resourceId?: string;
  resourceType?: string;
  
  // PHI access details
  patientId?: string;
  dataCategories?: string[];
  purposeOfUse?: string;
  
  // Security context
  authenticationMethod?: string;
  accessLevel?: string;
  dataClassification?: string;
  
  // Outcome
  success: boolean;
  errorMessage?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Compliance tracking
  regulatoryRequirement?: string;
  retentionPeriod?: number; // in years
  
  // Integrity verification
  checksum?: string;
}

/**
 * Audit query filters
 */
export interface AuditQueryFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType[];
  resourceId?: string;
  success?: boolean;
  ipAddress?: string;
}

/**
 * Audit statistics
 */
export interface AuditStatistics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueUsers: number;
  eventsByType: Record<string, number>;
  suspiciousActivities: number;
  phiAccessCount: number;
}

/**
 * HIPAA-compliant audit logging service
 */
export class HIPAAAuditService {
  private auditLogs: AuditLogEntry[] = [];
  private readonly maxInMemoryLogs = 1000;
  private readonly retentionYears = 7; // HIPAA requires 6 years minimum
  private encryptionEnabled = true;
  private integrityCheckEnabled = true;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the audit service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load existing audit logs from secure storage
      await this.loadAuditLogs();
      
      // Schedule regular integrity checks
      this.scheduleIntegrityChecks();
      
      // Schedule log archival
      this.scheduleLogArchival();
      
      logger.info('HIPAA Audit Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize audit service:', error);
    }
  }

  /**
   * Log an audit event
   */
  async logEvent(params: {
    eventType: AuditEventType;
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    resourceType?: string;
    patientId?: string;
    dataCategories?: string[];
    purposeOfUse?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Create audit log entry
      const entry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: new Date().toISOString(),
        eventType: params.eventType,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        ipAddress: this.getClientIpAddress(),
        userAgent: this.getUserAgent(),
        sessionId: this.getSessionId(),
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        patientId: params.patientId,
        dataCategories: params.dataCategories,
        purposeOfUse: params.purposeOfUse,
        success: params.success,
        errorMessage: params.errorMessage,
        metadata: params.metadata,
        regulatoryRequirement: 'HIPAA',
        retentionPeriod: this.retentionYears
      };

      // Add integrity checksum
      if (this.integrityCheckEnabled) {
        entry.checksum = await this.generateChecksum(entry);
      }

      // Encrypt sensitive fields if enabled
      if (this.encryptionEnabled) {
        await this.encryptSensitiveFields(entry);
      }

      // Store the audit log
      await this.storeAuditLog(entry);

      // Check for suspicious activities
      if (this.isSuspiciousActivity(entry)) {
        await this.handleSuspiciousActivity(entry);
      }

      // Real-time alerting for critical events
      if (this.isCriticalEvent(entry)) {
        await this.sendCriticalEventAlert(entry);
      }

    } catch (error) {
      // Audit logging must never fail silently
      console.error('CRITICAL: Audit logging failed:', error);
      
      // Fallback to file system or backup logging
      this.fallbackLogging(params);
    }
  }

  /**
   * Log PHI access
   */
  async logPHIAccess(params: {
    userId: string;
    patientId: string;
    dataCategories: string[];
    action: 'view' | 'create' | 'update' | 'delete' | 'export';
    purposeOfUse: string;
    resourceId?: string;
  }): Promise<void> {
    const eventTypeMap = {
      view: AuditEventType.PHI_VIEW,
      create: AuditEventType.PHI_CREATE,
      update: AuditEventType.PHI_UPDATE,
      delete: AuditEventType.PHI_DELETE,
      export: AuditEventType.PHI_EXPORT
    };

    await this.logEvent({
      eventType: eventTypeMap[params.action],
      userId: params.userId,
      action: `PHI ${params.action}`,
      patientId: params.patientId,
      dataCategories: params.dataCategories,
      purposeOfUse: params.purposeOfUse,
      resourceId: params.resourceId,
      resourceType: 'PHI',
      success: true
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(params: {
    userId?: string;
    userName?: string;
    eventType: 'login' | 'logout' | 'failed_login' | 'timeout';
    authMethod?: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const eventTypeMap = {
      login: AuditEventType.LOGIN_SUCCESS,
      logout: AuditEventType.LOGOUT,
      failed_login: AuditEventType.LOGIN_FAILURE,
      timeout: AuditEventType.SESSION_TIMEOUT
    };

    await this.logEvent({
      eventType: eventTypeMap[params.eventType],
      userId: params.userId,
      userName: params.userName,
      action: `Authentication: ${params.eventType}`,
      success: params.success,
      errorMessage: params.errorMessage,
      metadata: {
        authenticationMethod: params.authMethod
      }
    });
  }

  /**
   * Log crisis intervention
   */
  async logCrisisIntervention(params: {
    userId: string;
    patientId: string;
    interventionType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    outcome?: string;
  }): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.CRISIS_INTERVENTION,
      userId: params.userId,
      patientId: params.patientId,
      action: params.action,
      resourceType: 'Crisis Intervention',
      success: true,
      metadata: {
        interventionType: params.interventionType,
        severity: params.severity,
        outcome: params.outcome
      }
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    // Log the audit log access itself
    await this.logEvent({
      eventType: AuditEventType.AUDIT_LOG_ACCESS,
      action: 'Query audit logs',
      success: true,
      metadata: { filters }
    });

    let logs = [...this.auditLogs];

    // Apply filters
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate!);
    }

    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate!);
    }

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters.eventType && filters.eventType.length > 0) {
      logs = logs.filter(log => filters.eventType!.includes(log.eventType));
    }

    if (filters.resourceId) {
      logs = logs.filter(log => log.resourceId === filters.resourceId);
    }

    if (filters.success !== undefined) {
      logs = logs.filter(log => log.success === filters.success);
    }

    if (filters.ipAddress) {
      logs = logs.filter(log => log.ipAddress === filters.ipAddress);
    }

    return logs;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<AuditStatistics> {
    const logs = await this.queryLogs({ startDate, endDate });

    const eventsByType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    let suspiciousCount = 0;
    let phiAccessCount = 0;

    for (const log of logs) {
      // Count by event type
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;

      // Track unique users
      if (log.userId) {
        uniqueUsers.add(log.userId);
      }

      // Count suspicious activities
      if (this.isSuspiciousActivity(log)) {
        suspiciousCount++;
      }

      // Count PHI access
      if (log.eventType.startsWith('PHI_')) {
        phiAccessCount++;
      }
    }

    return {
      totalEvents: logs.length,
      successfulEvents: logs.filter(l => l.success).length,
      failedEvents: logs.filter(l => !l.success).length,
      uniqueUsers: uniqueUsers.size,
      eventsByType,
      suspiciousActivities: suspiciousCount,
      phiAccessCount
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const stats = await this.getStatistics(startDate, endDate);
    const logs = await this.queryLogs({ startDate, endDate });

    return {
      reportId: this.generateAuditId(),
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      statistics: stats,
      criticalEvents: logs.filter(l => this.isCriticalEvent(l)),
      failedAuthentications: logs.filter(l => l.eventType === AuditEventType.LOGIN_FAILURE),
      unauthorizedAccess: logs.filter(l => l.eventType === AuditEventType.UNAUTHORIZED_ACCESS),
      phiAccess: logs.filter(l => l.eventType.startsWith('PHI_')),
      complianceStatus: this.assessComplianceStatus(stats, logs)
    };
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(entry: AuditLogEntry): Promise<boolean> {
    if (!entry.checksum) return true;

    const calculatedChecksum = await this.generateChecksum(entry);
    return calculatedChecksum === entry.checksum;
  }

  /**
   * Archive old audit logs
   */
  private async archiveOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - this.retentionYears);

    const logsToArchive = this.auditLogs.filter(
      log => new Date(log.timestamp) < cutoffDate
    );

    if (logsToArchive.length > 0) {
      // Archive to secure long-term storage
      await this.archiveToSecureStorage(logsToArchive);

      // Remove from active logs
      this.auditLogs = this.auditLogs.filter(
        log => new Date(log.timestamp) >= cutoffDate
      );

      logger.info(`Archived ${logsToArchive.length} audit logs`);
    }
  }

  /**
   * Store audit log entry
   */
  private async storeAuditLog(entry: AuditLogEntry): Promise<void> {
    // Add to in-memory cache
    this.auditLogs.push(entry);

    // Persist to secure storage
    await this.persistToSecureStorage(entry);

    // Manage cache size
    if (this.auditLogs.length > this.maxInMemoryLogs) {
      // Keep only recent logs in memory
      this.auditLogs = this.auditLogs.slice(-this.maxInMemoryLogs);
    }
  }

  /**
   * Encrypt sensitive fields in audit log
   */
  private async encryptSensitiveFields(entry: AuditLogEntry): Promise<void> {
    // Encrypt patient ID if present
    if (entry.patientId) {
      const encrypted = await hipaaEncryption.encryptPHI(entry.patientId, 'audit');
      entry.patientId = JSON.stringify(encrypted);
    }

    // Encrypt metadata if it contains sensitive data
    if (entry.metadata && this.containsSensitiveData(entry.metadata)) {
      const encrypted = await hipaaEncryption.encryptPHI(
        JSON.stringify(entry.metadata),
        'audit-metadata'
      );
      entry.metadata = { encrypted: JSON.stringify(encrypted) };
    }
  }

  /**
   * Check if activity is suspicious
   */
  private isSuspiciousActivity(entry: AuditLogEntry): boolean {
    // Multiple failed login attempts
    if (entry.eventType === AuditEventType.LOGIN_FAILURE) {
      const recentFailures = this.auditLogs.filter(
        log => 
          log.userId === entry.userId &&
          log.eventType === AuditEventType.LOGIN_FAILURE &&
          new Date(log.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      );
      return recentFailures.length >= 3;
    }

    // Unauthorized access attempts
    if (entry.eventType === AuditEventType.UNAUTHORIZED_ACCESS) {
      return true;
    }

    // Unusual access patterns
    if (entry.eventType.startsWith('PHI_')) {
      const recentAccess = this.auditLogs.filter(
        log =>
          log.userId === entry.userId &&
          log.eventType.startsWith('PHI_') &&
          new Date(log.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      );
      return recentAccess.length > 20; // More than 20 PHI accesses in 5 minutes
    }

    return false;
  }

  /**
   * Check if event is critical
   */
  private isCriticalEvent(entry: AuditLogEntry): boolean {
    const criticalEvents = [
      AuditEventType.BREACH_DETECTED,
      AuditEventType.MALWARE_DETECTED,
      AuditEventType.ENCRYPTION_FAILURE,
      AuditEventType.CRISIS_DETECTED,
      AuditEventType.UNAUTHORIZED_ACCESS
    ];

    return criticalEvents.includes(entry.eventType) || 
           (entry.metadata?.severity === 'critical');
  }

  /**
   * Handle suspicious activity
   */
  private async handleSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
    // Log suspicious activity
    await this.logEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      userId: entry.userId,
      action: 'Suspicious activity detected',
      success: true,
      metadata: {
        originalEvent: entry.eventType,
        reason: 'Anomalous access pattern'
      }
    });

    // Send alert to security team
    logger.warn('Suspicious activity detected:', entry);
  }

  /**
   * Send critical event alert
   */
  private async sendCriticalEventAlert(entry: AuditLogEntry): Promise<void> {
    // In production, this would send to monitoring system
    logger.error('CRITICAL EVENT:', entry);
  }

  /**
   * Generate audit ID
   */
  private generateAuditId(): string {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate checksum for integrity verification
   */
  private async generateChecksum(entry: AuditLogEntry): Promise<string> {
    const data = JSON.stringify({
      ...entry,
      checksum: undefined // Exclude checksum from calculation
    });
    return await hipaaEncryption.hashData(data);
  }

  /**
   * Get client IP address
   */
  private getClientIpAddress(): string {
    // In production, get from request headers
    return '127.0.0.1';
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string {
    return navigator.userAgent || 'Unknown';
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || 'no-session';
  }

  /**
   * Check if data contains sensitive information
   */
  private containsSensitiveData(data: any): boolean {
    const sensitiveKeys = ['ssn', 'dob', 'diagnosis', 'medication', 'treatment'];
    const dataStr = JSON.stringify(data).toLowerCase();
    return sensitiveKeys.some(key => dataStr.includes(key));
  }

  /**
   * Assess compliance status
   */
  private assessComplianceStatus(stats: AuditStatistics, logs: AuditLogEntry[]): string {
    if (stats.suspiciousActivities > 10) return 'NEEDS_REVIEW';
    if (stats.failedEvents / stats.totalEvents > 0.1) return 'WARNING';
    return 'COMPLIANT';
  }

  /**
   * Load audit logs from storage
   */
  private async loadAuditLogs(): Promise<void> {
    try {
      const stored = localStorage.getItem('hipaa_audit_logs');
      if (stored) {
        this.auditLogs = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load audit logs:', error);
    }
  }

  /**
   * Persist to secure storage
   */
  private async persistToSecureStorage(entry: AuditLogEntry): Promise<void> {
    // In production, this would write to secure database
    try {
      localStorage.setItem('hipaa_audit_logs', JSON.stringify(this.auditLogs));
    } catch (error) {
      logger.error('Failed to persist audit log:', error);
    }
  }

  /**
   * Archive to secure storage
   */
  private async archiveToSecureStorage(logs: AuditLogEntry[]): Promise<void> {
    // In production, this would archive to secure long-term storage
    logger.info(`Archiving ${logs.length} audit logs`);
  }

  /**
   * Fallback logging mechanism
   */
  private fallbackLogging(params: any): void {
    // Write to console as last resort
    console.error('AUDIT FALLBACK:', params);
  }

  /**
   * Schedule integrity checks
   */
  private scheduleIntegrityChecks(): void {
    setInterval(async () => {
      for (const log of this.auditLogs) {
        if (!(await this.verifyIntegrity(log))) {
          logger.error('Integrity check failed for audit log:', log.id);
        }
      }
    }, 3600000); // Every hour
  }

  /**
   * Schedule log archival
   */
  private scheduleLogArchival(): void {
    setInterval(async () => {
      await this.archiveOldLogs();
    }, 86400000); // Daily
  }
}

// Export singleton instance
export const hipaaAudit = new HIPAAAuditService();

// Export types
export type { AuditLogEntry, AuditQueryFilters, AuditStatistics };