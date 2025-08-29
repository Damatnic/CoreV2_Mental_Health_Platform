import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auditId?: string;
      auditMetadata?: Record<string, any>;
    }
  }
}

// Logger configuration for audit logs
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/audit.log',
      maxsize: 10485760, // 10MB
      maxFiles: 30 // Keep 30 days of audit logs
    })
  ]
});

// HIPAA-compliant audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  TWO_FACTOR_ENABLED = '2FA_ENABLED',
  TWO_FACTOR_DISABLED = '2FA_DISABLED',
  
  // Data access events
  PHI_VIEW = 'PHI_VIEW',
  PHI_CREATE = 'PHI_CREATE',
  PHI_UPDATE = 'PHI_UPDATE',
  PHI_DELETE = 'PHI_DELETE',
  PHI_EXPORT = 'PHI_EXPORT',
  PHI_PRINT = 'PHI_PRINT',
  
  // Administrative events
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  
  // Clinical events
  ASSESSMENT_CREATE = 'ASSESSMENT_CREATE',
  ASSESSMENT_VIEW = 'ASSESSMENT_VIEW',
  TREATMENT_PLAN_CREATE = 'TREATMENT_PLAN_CREATE',
  TREATMENT_PLAN_UPDATE = 'TREATMENT_PLAN_UPDATE',
  PRESCRIPTION_CREATE = 'PRESCRIPTION_CREATE',
  PRESCRIPTION_UPDATE = 'PRESCRIPTION_UPDATE',
  
  // Emergency events
  CRISIS_ALERT = 'CRISIS_ALERT',
  EMERGENCY_ACCESS = 'EMERGENCY_ACCESS',
  BREAK_GLASS_ACCESS = 'BREAK_GLASS_ACCESS',
  
  // System events
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  ENCRYPTION_KEY_ROTATION = 'ENCRYPTION_KEY_ROTATION'
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  targetUserId?: string;
  targetResourceType?: string;
  targetResourceId?: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  requestId: string;
  httpMethod: string;
  requestPath: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  dataBeforeChange?: any;
  dataAfterChange?: any;
}

/**
 * Audit Service for HIPAA compliance
 */
class AuditService {
  /**
   * Create audit log entry
   */
  public async createAuditLog(entry: Partial<AuditEntry>): Promise<void> {
    try {
      const auditEntry: AuditEntry = {
        id: entry.id || uuidv4(),
        timestamp: entry.timestamp || new Date(),
        eventType: entry.eventType || AuditEventType.PHI_VIEW,
        userId: entry.userId,
        userEmail: entry.userEmail,
        userRole: entry.userRole,
        targetUserId: entry.targetUserId,
        targetResourceType: entry.targetResourceType,
        targetResourceId: entry.targetResourceId,
        ipAddress: entry.ipAddress || 'unknown',
        userAgent: entry.userAgent,
        sessionId: entry.sessionId,
        requestId: entry.requestId || uuidv4(),
        httpMethod: entry.httpMethod || 'GET',
        requestPath: entry.requestPath || '/',
        statusCode: entry.statusCode,
        success: entry.success !== undefined ? entry.success : true,
        errorMessage: entry.errorMessage,
        metadata: entry.metadata,
        dataBeforeChange: entry.dataBeforeChange,
        dataAfterChange: entry.dataAfterChange
      };

      // Log to file
      auditLogger.info('Audit Event', auditEntry);

      // Store in database
      await this.storeAuditLog(auditEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Never throw errors from audit logging to prevent disrupting the application
    }
  }

  /**
   * Store audit log in database
   */
  private async storeAuditLog(entry: AuditEntry): Promise<void> {
    try {
      await db.query(
        `INSERT INTO audit_logs (
          id, timestamp, event_type, user_id, user_email, user_role,
          target_user_id, target_resource_type, target_resource_id,
          ip_address, user_agent, session_id, request_id,
          http_method, request_path, status_code, success,
          error_message, metadata, data_before_change, data_after_change
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21
        )`,
        [
          entry.id,
          entry.timestamp,
          entry.eventType,
          entry.userId,
          entry.userEmail,
          entry.userRole,
          entry.targetUserId,
          entry.targetResourceType,
          entry.targetResourceId,
          entry.ipAddress,
          entry.userAgent,
          entry.sessionId,
          entry.requestId,
          entry.httpMethod,
          entry.requestPath,
          entry.statusCode,
          entry.success,
          entry.errorMessage,
          JSON.stringify(entry.metadata),
          entry.dataBeforeChange ? JSON.stringify(entry.dataBeforeChange) : null,
          entry.dataAfterChange ? JSON.stringify(entry.dataAfterChange) : null
        ]
      );
    } catch (error) {
      console.error('Failed to store audit log in database:', error);
    }
  }

  /**
   * Query audit logs
   */
  public async queryAuditLogs(filters: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    targetUserId?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AuditEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters.eventType) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(filters.eventType);
    }

    if (filters.startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    if (filters.targetUserId) {
      query += ` AND target_user_id = $${paramIndex++}`;
      params.push(filters.targetUserId);
    }

    if (filters.success !== undefined) {
      query += ` AND success = $${paramIndex++}`;
      params.push(filters.success);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get user access report
   */
  public async getUserAccessReport(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db.query(
      `SELECT 
        event_type,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM audit_logs
      WHERE user_id = $1 AND timestamp >= $2
      GROUP BY event_type, DATE(timestamp)
      ORDER BY date DESC, count DESC`,
      [userId, startDate]
    );

    return result.rows;
  }

  /**
   * Detect suspicious activity
   */
  public async detectSuspiciousActivity(userId: string): Promise<boolean> {
    // Check for unusual access patterns
    const result = await db.query(
      `SELECT 
        COUNT(*) as access_count,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_attempts
      FROM audit_logs
      WHERE user_id = $1 
        AND timestamp >= NOW() - INTERVAL '1 hour'`,
      [userId]
    );

    const stats = result.rows[0];
    
    // Flag as suspicious if:
    // - More than 100 requests in an hour
    // - More than 5 different IP addresses
    // - More than 10 failed attempts
    return (
      stats.access_count > 100 ||
      stats.unique_ips > 5 ||
      stats.failed_attempts > 10
    );
  }
}

// Create singleton instance
const auditService = new AuditService();

/**
 * Audit logging middleware
 */
export const auditLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Generate audit ID for this request
  req.auditId = uuidv4();
  req.requestId = req.headers['x-request-id'] as string || req.auditId;

  // Capture response status
  const originalSend = res.send;
  res.send = function(data: any) {
    res.locals.responseData = data;
    return originalSend.call(this, data);
  };

  // Log request start
  const startTime = Date.now();

  // Continue with request
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    // Determine event type based on path and method
    let eventType = AuditEventType.PHI_VIEW;
    const path = req.path.toLowerCase();
    const method = req.method.toUpperCase();

    if (path.includes('/auth/login')) {
      eventType = res.statusCode === 200 ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE;
    } else if (path.includes('/auth/logout')) {
      eventType = AuditEventType.LOGOUT;
    } else if (path.includes('/mood') || path.includes('/journal') || path.includes('/assessment')) {
      if (method === 'POST') eventType = AuditEventType.PHI_CREATE;
      else if (method === 'PUT' || method === 'PATCH') eventType = AuditEventType.PHI_UPDATE;
      else if (method === 'DELETE') eventType = AuditEventType.PHI_DELETE;
      else eventType = AuditEventType.PHI_VIEW;
    } else if (path.includes('/crisis') || path.includes('/emergency')) {
      eventType = AuditEventType.EMERGENCY_ACCESS;
    } else if (path.includes('/users') && method === 'POST') {
      eventType = AuditEventType.USER_CREATE;
    } else if (path.includes('/users') && (method === 'PUT' || method === 'PATCH')) {
      eventType = AuditEventType.USER_UPDATE;
    } else if (path.includes('/users') && method === 'DELETE') {
      eventType = AuditEventType.USER_DELETE;
    }

    // Create audit log entry
    await auditService.createAuditLog({
      id: req.auditId,
      eventType,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      targetResourceType: req.baseUrl?.split('/')[2],
      targetResourceId: req.params?.id,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionId,
      requestId: req.requestId,
      httpMethod: req.method,
      requestPath: req.originalUrl,
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      errorMessage: res.statusCode >= 400 ? res.locals.responseData : undefined,
      metadata: {
        duration,
        queryParams: req.query,
        bodySize: JSON.stringify(req.body || {}).length,
        responseSize: JSON.stringify(res.locals.responseData || {}).length
      }
    });

    // Check for suspicious activity
    if (req.user?.id) {
      const isSuspicious = await auditService.detectSuspiciousActivity(req.user.id);
      if (isSuspicious) {
        auditLogger.warn('Suspicious activity detected', {
          userId: req.user.id,
          userEmail: req.user.email,
          ipAddress: req.ip
        });
      }
    }
  });

  next();
};

/**
 * PHI access audit middleware
 */
export const auditPHIAccess = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Record PHI access
    await auditService.createAuditLog({
      eventType: AuditEventType.PHI_VIEW,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      targetResourceType: resourceType,
      targetResourceId: req.params?.id || req.query?.id as string,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionId,
      requestId: req.requestId || uuidv4(),
      httpMethod: req.method,
      requestPath: req.originalUrl,
      success: true,
      metadata: {
        accessReason: req.headers['x-access-reason'],
        breakGlass: req.headers['x-break-glass'] === 'true'
      }
    });

    next();
  };
};

/**
 * Break glass access middleware
 */
export const breakGlassAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const reason = req.headers['x-break-glass-reason'] as string;
  
  if (!reason) {
    res.status(400).json({ error: 'Break glass reason required' });
    return;
  }

  // Log break glass access
  await auditService.createAuditLog({
    eventType: AuditEventType.BREAK_GLASS_ACCESS,
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    targetResourceType: req.baseUrl?.split('/')[2],
    targetResourceId: req.params?.id,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionId,
    requestId: req.requestId || uuidv4(),
    httpMethod: req.method,
    requestPath: req.originalUrl,
    success: true,
    metadata: {
      breakGlassReason: reason,
      timestamp: new Date().toISOString()
    }
  });

  // Send alert to administrators
  auditLogger.warn('BREAK GLASS ACCESS', {
    userId: req.user?.id,
    userEmail: req.user?.email,
    reason,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });

  next();
};

export { auditService, AuditEventType };

export default {
  auditLog,
  auditPHIAccess,
  breakGlassAccess,
  auditService
};