import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { db, dbHelpers } from '../config/database';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
      requestId?: string;
    }
  }
}

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  therapistId?: string;
  psychiatristId?: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/auth.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * JWT Authentication Service
 */
class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiry: string;
  private readonly jwtRefreshExpiry: string;
  private readonly saltRounds: number;
  private readonly maxLoginAttempts: number;
  private readonly lockoutDuration: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'change-this-secret-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret';
    this.jwtExpiry = process.env.JWT_EXPIRY || '15m';
    this.jwtRefreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    this.saltRounds = 12;
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes

    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'change-this-secret-in-production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }

  /**
   * Hash password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  public generateToken(user: any, sessionId: string): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
      issuer: 'mental-health-platform',
      audience: 'mental-health-users'
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId, type: 'refresh' },
      this.jwtRefreshSecret,
      { expiresIn: this.jwtRefreshExpiry }
    );
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'mental-health-platform',
        audience: 'mental-health-users'
      }) as JWTPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate 2FA secret
   */
  public generate2FASecret(email: string): any {
    return speakeasy.generateSecret({
      name: `MentalHealth:${email}`,
      length: 32
    });
  }

  /**
   * Verify 2FA token
   */
  public verify2FAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
  }

  /**
   * Create session in database
   */
  public async createSession(
    userId: string,
    token: string,
    refreshToken: string,
    req: Request
  ): Promise<string> {
    const sessionId = uuidv4();
    const tokenHash = await this.hashToken(token);
    const refreshTokenHash = await this.hashToken(refreshToken);

    await db.query(
      `INSERT INTO sessions (
        id, user_id, token_hash, refresh_token_hash, 
        ip_address, user_agent, expires_at, refresh_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 
        NOW() + INTERVAL '${this.jwtExpiry}',
        NOW() + INTERVAL '${this.jwtRefreshExpiry}'
      )`,
      [
        sessionId,
        userId,
        tokenHash,
        refreshTokenHash,
        req.ip,
        req.headers['user-agent']
      ]
    );

    return sessionId;
  }

  /**
   * Hash token for storage
   */
  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  /**
   * Invalidate session
   */
  public async invalidateSession(sessionId: string, reason?: string): Promise<void> {
    await db.query(
      'UPDATE sessions SET revoked_at = NOW(), revocation_reason = $2 WHERE id = $1',
      [sessionId, reason || 'User logout']
    );
  }

  /**
   * Check if account is locked
   */
  public async isAccountLocked(email: string): Promise<boolean> {
    const result = await db.query(
      'SELECT account_locked_until FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) return false;

    const lockedUntil = result.rows[0].account_locked_until;
    return lockedUntil && new Date(lockedUntil) > new Date();
  }

  /**
   * Record failed login attempt
   */
  public async recordFailedLogin(email: string): Promise<void> {
    const result = await db.query(
      `UPDATE users 
       SET failed_login_attempts = failed_login_attempts + 1
       WHERE email = $1
       RETURNING failed_login_attempts`,
      [email]
    );

    if (result.rows[0]?.failed_login_attempts >= this.maxLoginAttempts) {
      await db.query(
        `UPDATE users 
         SET account_locked_until = NOW() + INTERVAL '30 minutes'
         WHERE email = $1`,
        [email]
      );

      logger.warn('Account locked due to too many failed attempts', { email });
    }
  }

  /**
   * Reset failed login attempts
   */
  public async resetFailedLogins(userId: string): Promise<void> {
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = $1',
      [userId]
    );
  }
}

// Create singleton instance
const authService = new AuthService();

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = authService.verifyToken(token);

    // Check if session is still valid
    const sessionResult = await db.query(
      `SELECT s.*, u.email, u.role, u.first_name_encrypted, u.last_name_encrypted,
              u.primary_therapist_id, u.primary_psychiatrist_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 
         AND s.revoked_at IS NULL 
         AND s.expires_at > NOW()
         AND u.deleted_at IS NULL`,
      [payload.sessionId]
    );

    if (sessionResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    const session = sessionResult.rows[0];

    // Decrypt user data
    let firstName, lastName;
    if (session.first_name_encrypted) {
      firstName = db.decrypt(session.first_name_encrypted);
    }
    if (session.last_name_encrypted) {
      lastName = db.decrypt(session.last_name_encrypted);
    }

    // Set user in request
    req.user = {
      id: payload.userId,
      email: session.email,
      role: session.role,
      firstName,
      lastName,
      therapistId: session.primary_therapist_id,
      psychiatristId: session.primary_psychiatrist_id,
      sessionId: payload.sessionId
    };

    req.sessionId = payload.sessionId;

    // Update session last accessed
    await db.query(
      'UPDATE sessions SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE id = $1',
      [payload.sessionId]
    );

    // Update user last activity
    await db.query(
      'UPDATE users SET last_activity_at = NOW() WHERE id = $1',
      [payload.userId]
    );

    // Log access for audit
    await logAccess(req, 'authenticated_request');

    next();
  } catch (error: any) {
    logger.error('Authentication failed', { error: error.message, path: req.path });
    
    if (error.message === 'Token expired') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else if (error.message === 'Invalid token') {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

/**
 * Authorization middleware - check user role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    await authenticate(req, res, () => {});
  } catch (error) {
    // Continue without authentication
  }
  
  next();
};

/**
 * Verify 2FA middleware
 */
export const verify2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { twoFactorCode } = req.body;

  if (!twoFactorCode) {
    res.status(400).json({ error: '2FA code required' });
    return;
  }

  try {
    // Get user's 2FA secret
    const result = await db.query(
      'SELECT two_factor_secret_encrypted FROM users WHERE id = $1 AND two_factor_enabled = true',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      next();
      return;
    }

    const encryptedSecret = result.rows[0].two_factor_secret_encrypted;
    const secret = db.decrypt(encryptedSecret);

    if (!authService.verify2FAToken(secret, twoFactorCode)) {
      res.status(401).json({ error: 'Invalid 2FA code' });
      return;
    }

    next();
  } catch (error) {
    logger.error('2FA verification failed', error);
    res.status(500).json({ error: '2FA verification failed' });
  }
};

/**
 * Rate limiting per user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.id;
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || userRequests.resetTime < now) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({ 
        error: 'Too many requests', 
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000) 
      });
      return;
    }

    userRequests.count++;
    next();
  };
};

/**
 * Log access for audit trail
 */
async function logAccess(req: Request, action: string): Promise<void> {
  try {
    await db.query(
      `INSERT INTO audit_logs 
       (user_id, action, resource_type, resource_id, ip_address, user_agent, request_method, request_path, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        req.user?.id || null,
        action,
        req.baseUrl?.split('/')[2] || 'unknown',
        req.params?.id || null,
        req.ip,
        req.headers['user-agent'],
        req.method,
        req.path,
        req.headers['x-request-id'] || uuidv4()
      ]
    );
  } catch (error) {
    logger.error('Failed to log audit entry', error);
  }
}

/**
 * Session timeout middleware
 */
export const sessionTimeout = (timeoutMinutes: number = 30) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.sessionId) {
      next();
      return;
    }

    try {
      const result = await db.query(
        `SELECT last_accessed_at FROM sessions 
         WHERE id = $1 AND revoked_at IS NULL`,
        [req.sessionId]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Session not found' });
        return;
      }

      const lastAccessed = new Date(result.rows[0].last_accessed_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastAccessed.getTime()) / (1000 * 60);

      if (diffMinutes > timeoutMinutes) {
        await authService.invalidateSession(req.sessionId, 'Session timeout');
        res.status(401).json({ error: 'Session timeout', code: 'SESSION_TIMEOUT' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Session timeout check failed', error);
      next();
    }
  };
};

// Export auth service for use in routes
export { authService };

export default {
  authenticate,
  authorize,
  optionalAuth,
  verify2FA,
  userRateLimit,
  sessionTimeout,
  authService
};