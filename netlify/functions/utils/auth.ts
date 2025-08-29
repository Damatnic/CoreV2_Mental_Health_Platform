import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db-connection';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AnonymousUser {
  id: string;
  isAnonymous: true;
  role: 'anonymous';
  anonymousId: string;
}

interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
  status: string;
}

/**
 * Generate JWT token
 */
export function generateToken(user: User): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT refresh secret is not configured');
  }

  return jwt.sign(
    { userId, type: 'refresh' },
    secret,
    { expiresIn: '30d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate user from token (supports anonymous users)
 */
export async function authenticateUser(authHeader?: string, anonymousId?: string): Promise<User | AnonymousUser | null> {
  // First try to authenticate with token
  const token = extractToken(authHeader);
  if (!token) {
    // If no token but anonymous ID provided, return anonymous user
    if (anonymousId) {
      return {
        id: anonymousId,
        isAnonymous: true,
        role: 'anonymous',
        anonymousId: anonymousId
      } as AnonymousUser;
    }
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  try {
    const users = await query<User>(
      'SELECT id, email, username, role, status FROM users WHERE id = $1 AND status = $2',
      [payload.userId, 'active']
    );

    if (users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    console.error('User authentication error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | AnonymousUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role);
}

/**
 * Check if user is anonymous
 */
export function isAnonymousUser(user: User | AnonymousUser): user is AnonymousUser {
  return 'isAnonymous' in user && user.isAnonymous === true;
}

/**
 * Get user identifier (works for both authenticated and anonymous)
 */
export function getUserIdentifier(user: User | AnonymousUser): string {
  if (isAnonymousUser(user)) {
    return `anon_${user.anonymousId}`;
  }
  return user.id;
}

/**
 * Generate random secure token
 */
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Generate verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Rate limiting check
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Sanitize user object for response
 */
export function sanitizeUser(user: any): any {
  const { password_hash, two_factor_secret, ...sanitized } = user;
  return sanitized;
}

/**
 * Create audit log entry (supports anonymous users)
 */
export async function createAuditLog(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any,
  isAnonymous?: boolean
): Promise<void> {
  try {
    // For anonymous users, store with a special prefix
    const userIdToLog = isAnonymous ? `anon_${userId}` : userId;
    
    await query(
      `INSERT INTO user_audit_log (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [userIdToLog, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the main operation
  }
}

/**
 * Session management
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sessionToken = generateSecureToken(64);
  const refreshToken = generateRefreshToken(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await query(
    `INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at, refresh_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, sessionToken, refreshToken, ipAddress, userAgent, expiresAt, refreshExpiresAt]
  );

  return sessionToken;
}

export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    const sessions = await query<any>(
      `SELECT u.* FROM users u
       JOIN user_sessions s ON u.id = s.user_id
       WHERE s.session_token = $1 
       AND s.expires_at > NOW()
       AND u.status = 'active'`,
      [sessionToken]
    );

    if (sessions.length === 0) {
      return null;
    }

    // Update last activity
    await query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE session_token = $1',
      [sessionToken]
    );

    return sanitizeUser(sessions[0]);
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function revokeSession(sessionToken: string): Promise<void> {
  await query(
    'DELETE FROM user_sessions WHERE session_token = $1',
    [sessionToken]
  );
}