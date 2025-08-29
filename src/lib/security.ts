// Security utilities for the Mental Health Platform
import { EventEmitter } from 'events';

// Types
export interface SecurityConfig {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotationInterval: number; // milliseconds
  };
  authentication: {
    sessionTimeout: number; // milliseconds
    maxLoginAttempts: number;
    lockoutDuration: number; // milliseconds
  };
  dataProtection: {
    anonymizeData: boolean;
    dataRetentionPeriod: number; // days
    requireConsent: boolean;
  };
  monitoring: {
    enabled: boolean;
    suspiciousActivityThreshold: number;
    alertEndpoints: string[];
  };
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'data_access' | 'suspicious_activity' | 'security_breach';
  userId?: string;
  timestamp: Date;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientInfo: {
    userAgent: string;
    ipAddress: string;
    location?: string;
  };
}

export interface EncryptionKey {
  id: string;
  key: string;
  algorithm: string;
  createdAt: Date;
  expiresAt: Date;
  usage: 'data' | 'session' | 'communication';
}

// Security Manager Class
export class SecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private activeKeys: Map<string, string> = new Map(); // keyId -> actual key

  constructor(config?: Partial<SecurityConfig>) {
    super();
    
    this.config = {
      encryption: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotationInterval: 24 * 60 * 60 * 1000 // 24 hours
      },
      authentication: {
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutes
      },
      dataProtection: {
        anonymizeData: true,
        dataRetentionPeriod: 90, // 90 days
        requireConsent: true
      },
      monitoring: {
        enabled: true,
        suspiciousActivityThreshold: 10,
        alertEndpoints: []
      },
      ...config
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Generate initial encryption keys
      await this.generateEncryptionKeys();
      
      // Set up key rotation
      this.setupKeyRotation();
      
      // Initialize security monitoring
      this.setupSecurityMonitoring();
      
      this.emit('security_manager_initialized');
    } catch (error) {
      console.error('Security manager initialization failed:', error);
      this.emit('security_error', { type: 'initialization_failed', error });
    }
  }

  // Encryption Functions
  async encrypt(data: string, keyId?: string): Promise<{ encrypted: string; keyId: string }> {
    if (!this.config.encryption.enabled) {
      return { encrypted: data, keyId: 'none' };
    }

    try {
      const key = keyId ? this.activeKeys.get(keyId) : this.getLatestKey();
      if (!key) {
        throw new Error('No encryption key available');
      }

      // In a real implementation, use Web Crypto API or Node.js crypto
      const encrypted = await this.performEncryption(data, key);
      const usedKeyId = keyId || Array.from(this.activeKeys.keys())[0];
      
      return { encrypted, keyId: usedKeyId };
    } catch (error) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        details: { action: 'encryption_failure', error: error.message },
        severity: 'medium'
      });
      throw new Error('Encryption failed');
    }
  }

  async decrypt(encryptedData: string, keyId: string): Promise<string> {
    if (!this.config.encryption.enabled) {
      return encryptedData;
    }

    try {
      const key = this.activeKeys.get(keyId);
      if (!key) {
        throw new Error('Decryption key not found');
      }

      return await this.performDecryption(encryptedData, key);
    } catch (error) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        details: { action: 'decryption_failure', keyId, error: error.message },
        severity: 'high'
      });
      throw new Error('Decryption failed');
    }
  }

  private async performEncryption(data: string, key: string): Promise<string> {
    // Simplified encryption - use proper crypto library in production
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(key);
    
    // Simple XOR encryption (NOT secure - for demo only)
    const encrypted = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return btoa(String.fromCharCode(...encrypted));
  }

  private async performDecryption(encryptedData: string, key: string): Promise<string> {
    try {
      const encrypted = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const encoder = new TextEncoder();
      const keyBuffer = encoder.encode(key);
      const decrypted = new Uint8Array(encrypted.length);
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBuffer[i % keyBuffer.length];
      }
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Invalid encrypted data');
    }
  }

  // Authentication Security
  validateLoginAttempt(identifier: string): { allowed: boolean; remainingAttempts?: number; lockedUntil?: Date } {
    const attempts = this.loginAttempts.get(identifier);
    const now = new Date();

    if (!attempts) {
      return { allowed: true };
    }

    // Check if locked out
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return { allowed: false, lockedUntil: attempts.lockedUntil };
    }

    // Reset if lockout period passed
    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
      this.loginAttempts.delete(identifier);
      return { allowed: true };
    }

    // Check attempt count
    if (attempts.count >= this.config.authentication.maxLoginAttempts) {
      const lockoutUntil = new Date(now.getTime() + this.config.authentication.lockoutDuration);
      this.loginAttempts.set(identifier, {
        ...attempts,
        lockedUntil: lockoutUntil
      });
      
      this.logSecurityEvent({
        type: 'suspicious_activity',
        details: { action: 'account_locked', identifier, attemptCount: attempts.count },
        severity: 'high'
      });
      
      return { allowed: false, lockedUntil: lockoutUntil };
    }

    return { allowed: true, remainingAttempts: this.config.authentication.maxLoginAttempts - attempts.count };
  }

  recordLoginAttempt(identifier: string, success: boolean): void {
    const now = new Date();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

    if (success) {
      // Clear attempts on successful login
      this.loginAttempts.delete(identifier);
      this.logSecurityEvent({
        type: 'login_attempt',
        details: { identifier, success: true },
        severity: 'low'
      });
    } else {
      // Increment failed attempts
      this.loginAttempts.set(identifier, {
        count: attempts.count + 1,
        lastAttempt: now
      });
      
      this.logSecurityEvent({
        type: 'login_attempt',
        details: { identifier, success: false, attemptCount: attempts.count + 1 },
        severity: attempts.count >= 3 ? 'high' : 'medium'
      });
    }
  }

  // Data Protection
  anonymizeData(data: Record<string, any>, fieldsToAnonymize: string[] = []): Record<string, any> {
    if (!this.config.dataProtection.anonymizeData) {
      return data;
    }

    const sensitiveFields = [
      'email', 'phone', 'firstName', 'lastName', 'fullName', 'address',
      'ssn', 'dateOfBirth', 'ip', 'deviceId', ...fieldsToAnonymize
    ];

    const anonymized = { ...data };

    const anonymizeValue = (value: any): any => {
      if (typeof value === 'string') {
        if (value.includes('@')) {
          // Email anonymization
          const [local, domain] = value.split('@');
          return `${local.substring(0, 2)}***@${domain}`;
        }
        if (value.match(/^\d{10,}$/)) {
          // Phone number anonymization
          return `***-***-${value.slice(-4)}`;
        }
        // General string anonymization
        return value.length > 4 ? `${value.substring(0, 2)}***${value.slice(-2)}` : '***';
      }
      return value;
    };

    Object.keys(anonymized).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        anonymized[key] = anonymizeValue(anonymized[key]);
      } else if (typeof anonymized[key] === 'object' && anonymized[key] !== null) {
        anonymized[key] = this.anonymizeData(anonymized[key], fieldsToAnonymize);
      }
    });

    return anonymized;
  }

  hashSensitiveData(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
    // In a real implementation, use a proper hashing library
    let hash = 0;
    if (data.length === 0) return hash.toString();
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  // Input Sanitization
  sanitizeInput(input: string, type: 'html' | 'sql' | 'xss' | 'general' = 'general'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    switch (type) {
      case 'html':
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');

      case 'sql':
        return input
          .replace(/'/g, "''")
          .replace(/;/g, '')
          .replace(/--/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '');

      case 'xss':
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');

      case 'general':
      default:
        return input
          .trim()
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .slice(0, 1000); // Limit length
    }
  }

  validateInput(input: string, rules: {
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    allowedCharacters?: RegExp;
    blacklistedWords?: string[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (rules.maxLength && input.length > rules.maxLength) {
      errors.push(`Input exceeds maximum length of ${rules.maxLength}`);
    }

    if (rules.minLength && input.length < rules.minLength) {
      errors.push(`Input below minimum length of ${rules.minLength}`);
    }

    if (rules.pattern && !rules.pattern.test(input)) {
      errors.push('Input format is invalid');
    }

    if (rules.allowedCharacters && !rules.allowedCharacters.test(input)) {
      errors.push('Input contains invalid characters');
    }

    if (rules.blacklistedWords) {
      const foundWords = rules.blacklistedWords.filter(word => 
        input.toLowerCase().includes(word.toLowerCase())
      );
      if (foundWords.length > 0) {
        errors.push('Input contains prohibited content');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Security Monitoring
  private logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'clientInfo'>): void {
    const event: SecurityEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      clientInfo: this.getClientInfo(),
      ...eventData
    };

    this.securityEvents.push(event);
    
    // Keep only recent events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-500);
    }

    this.emit('security_event', event);

    // Alert on high severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      this.alertSecurity(event);
    }

    // Check for suspicious patterns
    this.analyzeSecurityPatterns();
  }

  private analyzeSecurityPatterns(): void {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const suspiciousActivityCount = recentEvents.filter(
      event => event.type === 'suspicious_activity'
    ).length;

    if (suspiciousActivityCount >= this.config.monitoring.suspiciousActivityThreshold) {
      this.logSecurityEvent({
        type: 'security_breach',
        details: { 
          suspiciousActivityCount, 
          timeWindow: '1 hour',
          events: recentEvents.map(e => e.id)
        },
        severity: 'critical'
      });
    }
  }

  private alertSecurity(event: SecurityEvent): void {
    // In a real implementation, send alerts to security team
    console.warn('SECURITY ALERT:', event);
    
    if (this.config.monitoring.alertEndpoints.length > 0) {
      this.config.monitoring.alertEndpoints.forEach(endpoint => {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(error => {
          console.error('Failed to send security alert:', error);
        });
      });
    }
  }

  // Key Management
  private async generateEncryptionKeys(): Promise<void> {
    const keyTypes: EncryptionKey['usage'][] = ['data', 'session', 'communication'];
    
    for (const usage of keyTypes) {
      const key = await this.generateEncryptionKey(usage);
      this.encryptionKeys.set(key.id, key);
      this.activeKeys.set(key.id, key.key);
    }
  }

  private async generateEncryptionKey(usage: EncryptionKey['usage']): Promise<EncryptionKey> {
    // Generate a cryptographically secure key
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    const keyString = Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');

    return {
      id: `key_${usage}_${Date.now()}`,
      key: keyString,
      algorithm: this.config.encryption.algorithm,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.encryption.keyRotationInterval),
      usage
    };
  }

  private setupKeyRotation(): void {
    setInterval(() => {
      this.rotateKeys();
    }, this.config.encryption.keyRotationInterval);
  }

  private async rotateKeys(): Promise<void> {
    const now = new Date();
    
    // Generate new keys for expired ones
    for (const [keyId, key] of this.encryptionKeys.entries()) {
      if (now >= key.expiresAt) {
        const newKey = await this.generateEncryptionKey(key.usage);
        this.encryptionKeys.set(newKey.id, newKey);
        this.activeKeys.set(newKey.id, newKey.key);
        
        // Keep old key for a grace period to decrypt old data
        setTimeout(() => {
          this.encryptionKeys.delete(keyId);
          this.activeKeys.delete(keyId);
        }, 24 * 60 * 60 * 1000); // 24 hours grace period
        
        this.logSecurityEvent({
          type: 'data_access',
          details: { action: 'key_rotation', keyId, newKeyId: newKey.id },
          severity: 'low'
        });
      }
    }
  }

  private getLatestKey(): string | undefined {
    const dataKeys = Array.from(this.encryptionKeys.values())
      .filter(key => key.usage === 'data')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return dataKeys[0]?.key;
  }

  private setupSecurityMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    // Monitor for suspicious activity patterns
    setInterval(() => {
      this.analyzeSecurityPatterns();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private getClientInfo(): SecurityEvent['clientInfo'] {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      ipAddress: 'unknown', // Would be populated by server-side code
      location: typeof navigator !== 'undefined' ? navigator.language : undefined
    };
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  getSecurityEvents(filter?: { type?: SecurityEvent['type']; severity?: SecurityEvent['severity'] }): SecurityEvent[] {
    let events = [...this.securityEvents];
    
    if (filter?.type) {
      events = events.filter(event => event.type === filter.type);
    }
    
    if (filter?.severity) {
      events = events.filter(event => event.severity === filter.severity);
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSecurityStatus(): {
    encryptionEnabled: boolean;
    activeKeys: number;
    recentEvents: number;
    suspiciousActivity: number;
    systemHealth: 'good' | 'warning' | 'critical';
  } {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const suspiciousActivity = recentEvents.filter(
      event => event.type === 'suspicious_activity' || event.severity === 'high'
    ).length;

    let systemHealth: 'good' | 'warning' | 'critical' = 'good';
    if (suspiciousActivity > this.config.monitoring.suspiciousActivityThreshold) {
      systemHealth = 'critical';
    } else if (suspiciousActivity > this.config.monitoring.suspiciousActivityThreshold / 2) {
      systemHealth = 'warning';
    }

    return {
      encryptionEnabled: this.config.encryption.enabled,
      activeKeys: this.activeKeys.size,
      recentEvents: recentEvents.length,
      suspiciousActivity,
      systemHealth
    };
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', this.config);
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.encryptionKeys.clear();
    this.activeKeys.clear();
    this.loginAttempts.clear();
    this.securityEvents.length = 0;
  }
}

// Create default security manager instance
export const securityManager = new SecurityManager();

// Utility functions
export const sanitizeHtml = (input: string): string => securityManager.sanitizeInput(input, 'html');
export const sanitizeSql = (input: string): string => securityManager.sanitizeInput(input, 'sql');
export const preventXss = (input: string): string => securityManager.sanitizeInput(input, 'xss');

export default securityManager;
