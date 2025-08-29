/**
 * Two-Factor Authentication Service
 * Implements secure 2FA for professional users (therapists, counselors, administrators)
 * HIPAA-compliant implementation with TOTP, SMS backup, and recovery codes
 */

import * as crypto from 'crypto';
import { logger } from '../utils/logger';

// TOTP Configuration
const TOTP_CONFIG = {
  algorithm: 'SHA256',
  digits: 6,
  period: 30, // 30 seconds
  window: 1, // Allow 1 period before/after for clock skew
  issuer: 'Astral Core Mental Health',
  secretLength: 32
};

// Recovery codes configuration
const RECOVERY_CONFIG = {
  codeLength: 10,
  codeCount: 10,
  hashAlgorithm: 'sha256'
};

// Professional roles that require 2FA
export const PROFESSIONAL_ROLES = ['therapist', 'counselor', 'admin', 'moderator', 'helper'];

export interface TwoFactorSecret {
  secret: string;
  uri: string;
  qrCode: string;
  backupCodes: string[];
  createdAt: number;
}

export interface TwoFactorVerification {
  isValid: boolean;
  remainingAttempts?: number;
  lockedUntil?: number;
  requiresBackup?: boolean;
}

export interface TwoFactorSession {
  userId: string;
  verified: boolean;
  verifiedAt?: number;
  method: 'totp' | 'sms' | 'recovery';
  attempts: number;
  lastAttempt?: number;
}

export interface SMSBackupCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

/**
 * Two-Factor Authentication Service Class
 */
export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;
  private sessions: Map<string, TwoFactorSession> = new Map();
  private smsBackupCodes: Map<string, SMSBackupCode> = new Map();
  private attemptLimits: Map<string, { count: number; resetAt: number }> = new Map();

  // Rate limiting configuration
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly SMS_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Initialize service
    this.startCleanupInterval();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  /**
   * Generate a new TOTP secret for a user
   */
  public async generateSecret(userId: string, email: string): Promise<TwoFactorSecret> {
    try {
      // Generate cryptographically secure random secret
      const secret = this.generateBase32Secret(TOTP_CONFIG.secretLength);
      
      // Create TOTP URI for QR code generation
      const uri = this.generateTOTPUri(secret, email);
      
      // Generate QR code data URL
      const qrCode = await this.generateQRCode(uri);
      
      // Generate backup recovery codes
      const backupCodes = this.generateRecoveryCodes();
      
      logger.info('2FA secret generated for user', { userId, email });
      
      return {
        secret,
        uri,
        qrCode,
        backupCodes,
        createdAt: Date.now()
      };
    } catch (error) {
      logger.error('Failed to generate 2FA secret', { error, userId });
      throw new Error('Failed to generate two-factor authentication secret');
    }
  }

  /**
   * Verify a TOTP code
   */
  public verifyTOTP(secret: string, token: string, userId: string): TwoFactorVerification {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return {
          isValid: false,
          remainingAttempts: 0,
          lockedUntil: rateLimitCheck.lockedUntil
        };
      }

      // Normalize token (remove spaces, ensure 6 digits)
      const normalizedToken = token.replace(/\s/g, '').padStart(6, '0').slice(0, 6);
      
      // Calculate time counter
      const counter = Math.floor(Date.now() / 1000 / TOTP_CONFIG.period);
      
      // Check token with time window for clock skew
      let isValid = false;
      for (let i = -TOTP_CONFIG.window; i <= TOTP_CONFIG.window; i++) {
        const testCounter = counter + i;
        const expectedToken = this.generateTOTP(secret, testCounter);
        
        if (this.constantTimeCompare(normalizedToken, expectedToken)) {
          isValid = true;
          break;
        }
      }

      // Update rate limiting
      this.updateRateLimit(userId, isValid);
      
      if (isValid) {
        // Create or update session
        this.sessions.set(userId, {
          userId,
          verified: true,
          verifiedAt: Date.now(),
          method: 'totp',
          attempts: 0,
          lastAttempt: Date.now()
        });
        
        logger.info('TOTP verification successful', { userId });
      } else {
        const attempts = this.attemptLimits.get(userId);
        logger.warn('TOTP verification failed', { 
          userId, 
          remainingAttempts: this.MAX_ATTEMPTS - (attempts?.count || 0) 
        });
      }

      return {
        isValid,
        remainingAttempts: this.MAX_ATTEMPTS - (this.attemptLimits.get(userId)?.count || 0)
      };
    } catch (error) {
      logger.error('TOTP verification error', { error, userId });
      return { isValid: false, remainingAttempts: 0 };
    }
  }

  /**
   * Generate and send SMS backup code
   */
  public async sendSMSBackupCode(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      // Generate 6-digit SMS code
      const code = this.generateNumericCode(6);
      
      // Store SMS code with expiry
      this.smsBackupCodes.set(userId, {
        code,
        expiresAt: Date.now() + this.SMS_CODE_EXPIRY,
        attempts: 0
      });

      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, log the code securely
      logger.info('SMS backup code generated', { 
        userId, 
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        // In production, never log the actual code
        codeLength: code.length 
      });

      // Simulate SMS sending
      await this.simulateSMSSending(phoneNumber, code);
      
      return true;
    } catch (error) {
      logger.error('Failed to send SMS backup code', { error, userId });
      return false;
    }
  }

  /**
   * Verify SMS backup code
   */
  public verifySMSCode(userId: string, code: string): TwoFactorVerification {
    try {
      const storedCode = this.smsBackupCodes.get(userId);
      
      if (!storedCode) {
        return { isValid: false, requiresBackup: true };
      }

      // Check if code has expired
      if (Date.now() > storedCode.expiresAt) {
        this.smsBackupCodes.delete(userId);
        return { isValid: false, requiresBackup: true };
      }

      // Check attempts
      if (storedCode.attempts >= this.MAX_ATTEMPTS) {
        this.smsBackupCodes.delete(userId);
        return { 
          isValid: false, 
          remainingAttempts: 0,
          lockedUntil: Date.now() + this.LOCKOUT_DURATION 
        };
      }

      // Verify code
      const isValid = this.constantTimeCompare(code, storedCode.code);
      
      if (isValid) {
        // Clear the code after successful verification
        this.smsBackupCodes.delete(userId);
        
        // Create session
        this.sessions.set(userId, {
          userId,
          verified: true,
          verifiedAt: Date.now(),
          method: 'sms',
          attempts: 0,
          lastAttempt: Date.now()
        });
        
        logger.info('SMS code verification successful', { userId });
      } else {
        // Increment attempts
        storedCode.attempts++;
        this.smsBackupCodes.set(userId, storedCode);
        
        logger.warn('SMS code verification failed', { 
          userId, 
          remainingAttempts: this.MAX_ATTEMPTS - storedCode.attempts 
        });
      }

      return {
        isValid,
        remainingAttempts: this.MAX_ATTEMPTS - storedCode.attempts
      };
    } catch (error) {
      logger.error('SMS verification error', { error, userId });
      return { isValid: false };
    }
  }

  /**
   * Verify recovery code
   */
  public async verifyRecoveryCode(
    userId: string, 
    code: string, 
    hashedCodes: string[]
  ): Promise<TwoFactorVerification> {
    try {
      // Normalize the recovery code
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Hash the provided code
      const hashedCode = this.hashRecoveryCode(normalizedCode);
      
      // Check if the hashed code exists in the stored hashed codes
      const isValid = hashedCodes.some(stored => 
        this.constantTimeCompare(hashedCode, stored)
      );

      if (isValid) {
        // Create session
        this.sessions.set(userId, {
          userId,
          verified: true,
          verifiedAt: Date.now(),
          method: 'recovery',
          attempts: 0,
          lastAttempt: Date.now()
        });
        
        logger.info('Recovery code verification successful', { userId });
        
        // Note: In production, mark this recovery code as used
        // and remove it from the user's available codes
      } else {
        logger.warn('Recovery code verification failed', { userId });
      }

      return { isValid };
    } catch (error) {
      logger.error('Recovery code verification error', { error, userId });
      return { isValid: false };
    }
  }

  /**
   * Check if user has active 2FA session
   */
  public hasActiveSession(userId: string): boolean {
    const session = this.sessions.get(userId);
    
    if (!session || !session.verified) {
      return false;
    }

    // Check session expiry (24 hours for professional users)
    const SESSION_DURATION = 24 * 60 * 60 * 1000;
    if (session.verifiedAt && Date.now() - session.verifiedAt > SESSION_DURATION) {
      this.sessions.delete(userId);
      return false;
    }

    return true;
  }

  /**
   * Clear 2FA session
   */
  public clearSession(userId: string): void {
    this.sessions.delete(userId);
    this.smsBackupCodes.delete(userId);
    this.attemptLimits.delete(userId);
    logger.info('2FA session cleared', { userId });
  }

  /**
   * Check if role requires 2FA
   */
  public requiresTwoFactor(role: string): boolean {
    return PROFESSIONAL_ROLES.includes(role.toLowerCase());
  }

  /**
   * Generate recovery codes with secure hashing
   */
  public generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < RECOVERY_CONFIG.codeCount; i++) {
      const code = this.generateAlphanumericCode(RECOVERY_CONFIG.codeLength);
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Hash recovery codes for secure storage
   */
  public hashRecoveryCodes(codes: string[]): string[] {
    return codes.map(code => this.hashRecoveryCode(code));
  }

  // Private helper methods

  private generateBase32Secret(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const randomBytes = crypto.randomBytes(length);
    let secret = '';
    
    for (let i = 0; i < length; i++) {
      secret += charset[randomBytes[i] % charset.length];
    }
    
    return secret;
  }

  private generateTOTPUri(secret: string, email: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: TOTP_CONFIG.issuer,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits.toString(),
      period: TOTP_CONFIG.period.toString()
    });
    
    return `otpauth://totp/${encodeURIComponent(TOTP_CONFIG.issuer)}:${encodeURIComponent(email)}?${params}`;
  }

  private async generateQRCode(uri: string): Promise<string> {
    // In production, use a QR code library like qrcode
    // For now, return a placeholder data URL
    // This would be replaced with actual QR code generation
    const placeholder = `data:image/svg+xml;base64,${Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" fill="black">QR Code</text>
      </svg>`
    ).toString('base64')}`;
    
    return placeholder;
  }

  private generateTOTP(secret: string, counter: number): string {
    // Convert counter to buffer (8 bytes, big-endian)
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);
    
    // Create HMAC
    const hmac = crypto.createHmac(TOTP_CONFIG.algorithm.toLowerCase(), Buffer.from(secret, 'ascii'));
    hmac.update(counterBuffer);
    const hash = hmac.digest();
    
    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0xf;
    const binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    // Generate OTP
    const otp = binary % Math.pow(10, TOTP_CONFIG.digits);
    return otp.toString().padStart(TOTP_CONFIG.digits, '0');
  }

  private generateNumericCode(length: number): string {
    let code = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      code += (randomBytes[i] % 10).toString();
    }
    
    return code;
  }

  private generateAlphanumericCode(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(length);
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += charset[randomBytes[i] % charset.length];
    }
    
    // Format with dashes for readability (e.g., ABCD-EFGH-IJKL)
    return code.match(/.{1,4}/g)?.join('-') || code;
  }

  private hashRecoveryCode(code: string): string {
    return crypto
      .createHash(RECOVERY_CONFIG.hashAlgorithm)
      .update(code)
      .digest('hex');
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  private checkRateLimit(userId: string): { allowed: boolean; lockedUntil?: number } {
    const limit = this.attemptLimits.get(userId);
    
    if (!limit) {
      return { allowed: true };
    }

    // Check if lockout period has expired
    if (Date.now() > limit.resetAt) {
      this.attemptLimits.delete(userId);
      return { allowed: true };
    }

    // Check if max attempts reached
    if (limit.count >= this.MAX_ATTEMPTS) {
      return { allowed: false, lockedUntil: limit.resetAt };
    }

    return { allowed: true };
  }

  private updateRateLimit(userId: string, success: boolean): void {
    if (success) {
      // Clear rate limit on successful authentication
      this.attemptLimits.delete(userId);
      return;
    }

    const limit = this.attemptLimits.get(userId) || {
      count: 0,
      resetAt: Date.now() + this.LOCKOUT_DURATION
    };

    limit.count++;
    
    if (limit.count >= this.MAX_ATTEMPTS) {
      limit.resetAt = Date.now() + this.LOCKOUT_DURATION;
    }

    this.attemptLimits.set(userId, limit);
  }

  private maskPhoneNumber(phone: string): string {
    // Mask all but last 4 digits
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return '****';
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  }

  private async simulateSMSSending(phoneNumber: string, code: string): Promise<void> {
    // In production, this would integrate with an SMS service
    // For development/testing, we'll just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In development mode, you might want to log the code for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] SMS Code for ${this.maskPhoneNumber(phoneNumber)}: ${code}`);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired sessions and codes every 5 minutes
    setInterval(() => {
      // Clean expired SMS codes
      for (const [userId, code] of this.smsBackupCodes.entries()) {
        if (Date.now() > code.expiresAt) {
          this.smsBackupCodes.delete(userId);
        }
      }

      // Clean expired rate limits
      for (const [userId, limit] of this.attemptLimits.entries()) {
        if (Date.now() > limit.resetAt) {
          this.attemptLimits.delete(userId);
        }
      }

      // Clean old sessions (> 24 hours)
      const SESSION_DURATION = 24 * 60 * 60 * 1000;
      for (const [userId, session] of this.sessions.entries()) {
        if (session.verifiedAt && Date.now() - session.verifiedAt > SESSION_DURATION) {
          this.sessions.delete(userId);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Export singleton instance
export const twoFactorAuth = TwoFactorAuthService.getInstance();

// Export types for external use
export type { TwoFactorAuthService };