import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { db } from '../config/database';
import Redis from 'ioredis';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
      sessionStore?: SessionStore;
    }
  }
}

interface SessionData {
  id: string;
  userId?: string;
  data: Record<string, any>;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent?: string;
  isActive: boolean;
}

interface SessionConfig {
  maxAge: number; // Session max age in milliseconds
  idleTimeout: number; // Idle timeout in milliseconds
  maxSessions: number; // Max concurrent sessions per user
  secure: boolean; // Require secure connection
  sameSite: 'strict' | 'lax' | 'none';
  httpOnly: boolean;
  domain?: string;
  path: string;
}

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/session.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Session Store implementation
 */
class SessionStore {
  private redis: Redis | null = null;
  private config: SessionConfig;
  private prefix = 'session:';

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      maxAge: 30 * 60 * 1000, // 30 minutes
      idleTimeout: 15 * 60 * 1000, // 15 minutes idle timeout
      maxSessions: 5, // Max 5 concurrent sessions per user
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: true,
      path: '/',
      ...config
    };

    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        keyPrefix: this.prefix,
        retryStrategy: (times: number) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error', error);
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected for session storage');
      });
    }
  }

  /**
   * Create new session
   */
  async create(userId: string | undefined, req: Request): Promise<SessionData> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxAge);

    const session: SessionData = {
      id: sessionId,
      userId,
      data: {},
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      isActive: true
    };

    // Store in Redis if available
    if (this.redis) {
      await this.redis.setex(
        sessionId,
        Math.floor(this.config.maxAge / 1000),
        JSON.stringify(session)
      );
    }

    // Store in database for persistence
    await db.query(
      `INSERT INTO sessions (
        id, user_id, data, created_at, last_accessed_at, 
        expires_at, ip_address, user_agent, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        session.id,
        session.userId,
        JSON.stringify(session.data),
        session.createdAt,
        session.lastAccessedAt,
        session.expiresAt,
        session.ipAddress,
        session.userAgent,
        session.isActive
      ]
    );

    // Check and enforce max sessions per user
    if (userId) {
      await this.enforceMaxSessions(userId);
    }

    logger.info('Session created', { sessionId, userId });
    return session;
  }

  /**
   * Get session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    // Try Redis first
    if (this.redis) {
      try {
        const data = await this.redis.get(sessionId);
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        logger.error('Redis get error', error);
      }
    }

    // Fallback to database
    const result = await db.query(
      `SELECT * FROM sessions 
       WHERE id = $1 AND is_active = true AND expires_at > NOW()`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const session: SessionData = {
      id: row.id,
      userId: row.user_id,
      data: row.data || {},
      createdAt: row.created_at,
      lastAccessedAt: row.last_accessed_at,
      expiresAt: row.expires_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      isActive: row.is_active
    };

    // Cache in Redis
    if (this.redis) {
      const ttl = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await this.redis.setex(sessionId, ttl, JSON.stringify(session));
      }
    }

    return session;
  }

  /**
   * Update session
   */
  async update(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updated = {
      ...session,
      ...data,
      lastAccessedAt: new Date()
    };

    // Update in Redis
    if (this.redis) {
      const ttl = Math.floor((new Date(updated.expiresAt).getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await this.redis.setex(sessionId, ttl, JSON.stringify(updated));
      }
    }

    // Update in database
    await db.query(
      `UPDATE sessions 
       SET data = $2, last_accessed_at = $3, expires_at = $4
       WHERE id = $1`,
      [
        sessionId,
        JSON.stringify(updated.data),
        updated.lastAccessedAt,
        updated.expiresAt
      ]
    );
  }

  /**
   * Touch session (update last accessed time)
   */
  async touch(sessionId: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxAge);

    // Update in Redis
    if (this.redis) {
      const session = await this.get(sessionId);
      if (session) {
        session.lastAccessedAt = now;
        session.expiresAt = expiresAt;
        const ttl = Math.floor(this.config.maxAge / 1000);
        await this.redis.setex(sessionId, ttl, JSON.stringify(session));
      }
    }

    // Update in database
    await db.query(
      `UPDATE sessions 
       SET last_accessed_at = $2, expires_at = $3
       WHERE id = $1`,
      [sessionId, now, expiresAt]
    );
  }

  /**
   * Destroy session
   */
  async destroy(sessionId: string, reason?: string): Promise<void> {
    // Remove from Redis
    if (this.redis) {
      await this.redis.del(sessionId);
    }

    // Mark as inactive in database (soft delete for audit)
    await db.query(
      `UPDATE sessions 
       SET is_active = false, 
           revoked_at = NOW(), 
           revocation_reason = $2
       WHERE id = $1`,
      [sessionId, reason || 'User logout']
    );

    logger.info('Session destroyed', { sessionId, reason });
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const query = exceptSessionId
      ? `SELECT id FROM sessions WHERE user_id = $1 AND id != $2 AND is_active = true`
      : `SELECT id FROM sessions WHERE user_id = $1 AND is_active = true`;
    
    const params = exceptSessionId ? [userId, exceptSessionId] : [userId];
    const result = await db.query(query, params);

    for (const row of result.rows) {
      await this.destroy(row.id, 'User sessions cleared');
    }

    logger.info('User sessions destroyed', { userId, count: result.rows.length });
  }

  /**
   * Enforce maximum sessions per user
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    const result = await db.query(
      `SELECT id, created_at FROM sessions 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY created_at DESC`,
      [userId]
    );

    if (result.rows.length > this.config.maxSessions) {
      // Destroy oldest sessions
      const toDestroy = result.rows.slice(this.config.maxSessions);
      for (const session of toDestroy) {
        await this.destroy(session.id, 'Max sessions exceeded');
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanup(): Promise<number> {
    const result = await db.query(
      `UPDATE sessions 
       SET is_active = false, 
           revoked_at = NOW(), 
           revocation_reason = 'Session expired'
       WHERE is_active = true AND expires_at < NOW()
       RETURNING id`
    );

    // Remove from Redis
    if (this.redis && result.rows.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const row of result.rows) {
        pipeline.del(row.id);
      }
      await pipeline.exec();
    }

    logger.info('Session cleanup completed', { count: result.rows.length });
    return result.rows.length;
  }

  /**
   * Get active sessions for user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const result = await db.query(
      `SELECT * FROM sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
       ORDER BY last_accessed_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      data: row.data || {},
      createdAt: row.created_at,
      lastAccessedAt: row.last_accessed_at,
      expiresAt: row.expires_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      isActive: row.is_active
    }));
  }

  /**
   * Check if session is idle
   */
  isIdle(session: SessionData): boolean {
    const idleTime = Date.now() - new Date(session.lastAccessedAt).getTime();
    return idleTime > this.config.idleTimeout;
  }

  /**
   * Check if session is expired
   */
  isExpired(session: SessionData): boolean {
    return new Date(session.expiresAt) < new Date();
  }
}

// Create singleton instance
const sessionStore = new SessionStore();

/**
 * Session management middleware
 */
export const sessionManager = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get session ID from cookie or header
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;

    if (sessionId) {
      // Get existing session
      const session = await sessionStore.get(sessionId);

      if (session) {
        // Check if session is expired or idle
        if (sessionStore.isExpired(session)) {
          await sessionStore.destroy(sessionId, 'Session expired');
          res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' });
          return;
        }

        if (sessionStore.isIdle(session)) {
          await sessionStore.destroy(sessionId, 'Session idle timeout');
          res.status(401).json({ error: 'Session timeout', code: 'SESSION_TIMEOUT' });
          return;
        }

        // Touch session to update last accessed time
        await sessionStore.touch(sessionId);

        // Attach session to request
        req.session = session;
        req.sessionId = sessionId;
      }
    }

    // Attach session store to request
    req.sessionStore = sessionStore;

    next();
  } catch (error) {
    logger.error('Session manager error', error);
    next();
  }
};

/**
 * Create session middleware
 */
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session && req.user) {
      const session = await sessionStore.create(req.user.id, req);
      
      // Set session cookie
      res.cookie('sessionId', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: sessionStore['config'].maxAge,
        path: '/'
      });

      req.session = session;
      req.sessionId = session.id;
    }
    next();
  } catch (error) {
    logger.error('Create session error', error);
    next(error);
  }
};

/**
 * Destroy session middleware
 */
export const destroySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.sessionId) {
      await sessionStore.destroy(req.sessionId, 'User logout');
      res.clearCookie('sessionId');
      delete req.session;
      delete req.sessionId;
    }
    next();
  } catch (error) {
    logger.error('Destroy session error', error);
    next(error);
  }
};

/**
 * Session cleanup job
 */
export const startSessionCleanup = (): void => {
  // Run cleanup every 5 minutes
  setInterval(async () => {
    try {
      const cleaned = await sessionStore.cleanup();
      if (cleaned > 0) {
        logger.info(`Cleaned up ${cleaned} expired sessions`);
      }
    } catch (error) {
      logger.error('Session cleanup error', error);
    }
  }, 5 * 60 * 1000);
};

/**
 * Get session statistics
 */
export const getSessionStats = async (): Promise<any> => {
  const result = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
      COUNT(*) FILTER (WHERE is_active = false) as inactive_sessions,
      COUNT(DISTINCT user_id) FILTER (WHERE is_active = true) as unique_users,
      AVG(EXTRACT(EPOCH FROM (last_accessed_at - created_at))) as avg_session_duration,
      MAX(last_accessed_at) as last_activity
    FROM sessions
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);

  return result.rows[0];
};

export { sessionStore, SessionStore, SessionData };

export default {
  sessionManager,
  createSession,
  destroySession,
  startSessionCleanup,
  getSessionStats,
  sessionStore
};