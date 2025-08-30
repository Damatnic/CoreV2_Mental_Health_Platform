/**
 * Secure Authentication Service
 * Implements enterprise-grade security for mental health platform
 * HIPAA-compliant authentication with encryption and audit logging
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SecureUser {
  id: string;
  email?: string;
  displayName: string;
  isAnonymous: boolean;
  role: 'user' | 'helper' | 'admin' | 'therapist' | 'moderator';
  mfaEnabled?: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
  sessionId?: string;
  encryptedData?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  sessionId: string;
}

export interface AuthResponse {
  user: SecureUser;
  tokens: AuthTokens;
  requiresMFA?: boolean;
  csrfToken: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const EmailSchema = z.string().email().min(5).max(255);
const PasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

const UsernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores');

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

class SecurityUtils {
  /**
   * Generate cryptographically secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data using Web Crypto API
   */
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt sensitive data using Web Crypto API
   */
  static async encryptData(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data using Web Crypto API
   */
  static async decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Generate encryption key from password
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return input.replace(/[&<>"'/]/g, char => map[char]);
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken && token.length === 64;
  }

  /**
   * Check if account is locked due to failed attempts
   */
  static isAccountLocked(user: SecureUser): boolean {
    if (!user.lockedUntil) return false;
    return new Date() < new Date(user.lockedUntil);
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

class SessionManager {
  private static readonly SESSION_STORAGE_KEY = '__astral_secure_session';
  private static readonly CSRF_STORAGE_KEY = '__astral_csrf_token';
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static sessionTimer: NodeJS.Timeout | null = null;

  /**
   * Create new secure session
   */
  static async createSession(user: SecureUser): Promise<string> {
    const sessionId = SecurityUtils.generateSecureToken(32);
    const csrfToken = SecurityUtils.generateSecureToken(32);
    
    const sessionData = {
      sessionId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT).toISOString(),
      csrfToken,
      fingerprint: await this.generateFingerprint()
    };
    
    // Store in sessionStorage (more secure than localStorage)
    sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(this.CSRF_STORAGE_KEY, csrfToken);
    
    // Set session timeout
    this.startSessionTimer();
    
    return sessionId;
  }

  /**
   * Validate current session
   */
  static validateSession(): boolean {
    const sessionData = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
    if (!sessionData) return false;
    
    try {
      const session = JSON.parse(sessionData);
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now > expiresAt) {
        this.clearSession();
        return false;
      }
      
      // Extend session on activity
      this.extendSession();
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  /**
   * Extend session timeout on user activity
   */
  static extendSession(): void {
    const sessionData = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
    if (!sessionData) return;
    
    try {
      const session = JSON.parse(sessionData);
      session.expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT).toISOString();
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
      
      // Reset timer
      this.startSessionTimer();
    } catch {
      this.clearSession();
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    sessionStorage.removeItem(this.CSRF_STORAGE_KEY);
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Start session timeout timer
   */
  private static startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      this.clearSession();
      window.dispatchEvent(new CustomEvent('sessionExpired'));
    }, this.SESSION_TIMEOUT);
  }

  /**
   * Generate browser fingerprint for session validation
   */
  private static async generateFingerprint(): Promise<string> {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0
    ].join('|');
    
    return SecurityUtils.hashData(data);
  }

  /**
   * Get CSRF token for current session
   */
  static getCSRFToken(): string | null {
    return sessionStorage.getItem(this.CSRF_STORAGE_KEY);
  }
}

// ============================================================================
// SECURE AUTHENTICATION SERVICE
// ============================================================================

export class SecureAuthService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Register new user with secure validation
   */
  static async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    // Validate inputs
    EmailSchema.parse(email);
    PasswordSchema.parse(password);
    UsernameSchema.parse(displayName);
    
    // Sanitize inputs
    const sanitizedEmail = SecurityUtils.sanitizeInput(email.toLowerCase());
    const sanitizedDisplayName = SecurityUtils.sanitizeInput(displayName);
    
    // Hash password client-side (server will hash again)
    const hashedPassword = await SecurityUtils.hashData(password);
    
    const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': SecurityUtils.generateSecureToken(16)
      },
      body: JSON.stringify({
        email: sanitizedEmail,
        password: hashedPassword,
        displayName: sanitizedDisplayName,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const data = await response.json();
    
    // Create secure session
    await SessionManager.createSession(data.user);
    
    return data;
  }

  /**
   * Login with enhanced security
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    // Validate inputs
    EmailSchema.parse(email);
    
    // Sanitize inputs
    const sanitizedEmail = SecurityUtils.sanitizeInput(email.toLowerCase());
    
    // Hash password client-side
    const hashedPassword = await SecurityUtils.hashData(password);
    
    const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': SecurityUtils.generateSecureToken(16)
      },
      body: JSON.stringify({
        email: sanitizedEmail,
        password: hashedPassword,
        timestamp: new Date().toISOString(),
        fingerprint: await SessionManager['generateFingerprint']()
      })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw new Error('Invalid credentials');
    }
    
    const data = await response.json();
    
    // Check if MFA is required
    if (data.requiresMFA) {
      return data;
    }
    
    // Create secure session
    await SessionManager.createSession(data.user);
    
    return data;
  }

  /**
   * Anonymous login with tracking
   */
  static async loginAnonymously(): Promise<AuthResponse> {
    const anonymousId = SecurityUtils.generateSecureToken(32);
    
    const response = await fetch(`${this.API_BASE_URL}/auth/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': SecurityUtils.generateSecureToken(16)
      },
      body: JSON.stringify({
        anonymousId,
        timestamp: new Date().toISOString(),
        fingerprint: await SessionManager['generateFingerprint']()
      })
    });
    
    if (!response.ok) {
      throw new Error('Anonymous login failed');
    }
    
    const data = await response.json();
    
    // Create secure session
    await SessionManager.createSession(data.user);
    
    return data;
  }

  /**
   * Verify MFA code
   */
  static async verifyMFA(code: string, sessionId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.API_BASE_URL}/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        code,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error('Invalid MFA code');
    }
    
    const data = await response.json();
    
    // Create secure session
    await SessionManager.createSession(data.user);
    
    return data;
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      SessionManager.clearSession();
      throw new Error('Token refresh failed');
    }
    
    return response.json();
  }

  /**
   * Logout and clear session
   */
  static async logout(): Promise<void> {
    const session = sessionStorage.getItem(SessionManager['SESSION_STORAGE_KEY']);
    
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        
        await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionData.sessionId
          }
        });
      } catch {
        // Continue with logout even if request fails
      }
    }
    
    SessionManager.clearSession();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return SessionManager.validateSession();
  }

  /**
   * Get current CSRF token
   */
  static getCSRFToken(): string | null {
    return SessionManager.getCSRFToken();
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export class AuditLogger {
  private static readonly AUDIT_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/audit`;

  static async log(event: {
    action: string;
    userId?: string;
    details?: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      await fetch(this.AUDIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': SessionManager.getCSRFToken() || ''
        },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ip: 'server-side',
          sessionId: sessionStorage.getItem(SessionManager['SESSION_STORAGE_KEY'])
        })
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default SecureAuthService;