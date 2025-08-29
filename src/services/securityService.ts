/**
 * Security Service
 *
 * Comprehensive security service for input validation, rate limiting,
 * XSS protection, CSRF protection, and security monitoring for the
 * mental health platform.
 * 
 * @fileoverview Security utilities and protection mechanisms
 * @version 2.0.0
 */

import React from 'react';

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: any) => string;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableRateLimit: boolean;
  enableInputValidation: boolean;
  rateLimits: Record<string, RateLimitConfig>;
}

/**
 * Rate limit entry interface
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Rate limit check result interface
 */
export interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
  remaining?: number;
}

/**
 * Password validation result interface
 */
export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  feedback: string[];
}

/**
 * Security event severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high';

/**
 * Security event log entry interface
 */
export interface SecurityLogEntry {
  timestamp: string;
  event: string;
  details: any;
  severity: SecuritySeverity;
  userAgent: string;
  url: string;
}

/**
 * Comprehensive security service class
 */
export class SecurityService {
  private readonly config: SecurityConfig;
  private readonly rateLimitStore = new Map<string, RateLimitEntry>();
  private readonly blockedIPs = new Set<string>();
  private readonly suspiciousPatterns: RegExp[] = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableCSP: true,
      enableXSSProtection: true,
      enableRateLimit: true,
      enableInputValidation: true,
      rateLimits: {
        api: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
        login: { windowMs: 900000, maxRequests: 5 }, // 5 attempts per 15 minutes
        post: { windowMs: 60000, maxRequests: 10 }, // 10 posts per minute
        message: { windowMs: 60000, maxRequests: 30 } // 30 messages per minute
      },
      ...config
    };

    if (this.config.enableCSP) {
      this.setupCSP();
    }
  }

  /**
   * Set up Content Security Policy
   */
  private setupCSP(): void {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://esm.sh https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https: wss:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspDirectives;
    document.head.appendChild(meta);
  }

  /**
   * Validate input against security rules
   */
  validateInput(value: any, rules: ValidationRule): ValidationResult {
    if (!this.config.enableInputValidation) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Required check
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push('This field is required');
    }

    if (value && typeof value === 'string') {
      // Length checks
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Minimum length is ${rules.minLength} characters`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Maximum length is ${rules.maxLength} characters`);
      }

      // Pattern check
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push('Invalid format');
      }

      // XSS check
      if (this.containsXSS(value)) {
        errors.push('Invalid characters detected');
      }
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (typeof customResult === 'string') {
        errors.push(customResult);
      } else if (!customResult) {
        errors.push('Invalid value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitizeInput(input: string): string {
    if (!this.config.enableXSSProtection) {
      return input;
    }

    // HTML encode dangerous characters
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Check if input contains XSS patterns
   */
  containsXSS(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html: string): string {
    // Basic HTML sanitization - in production, use DOMPurify
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }

  /**
   * Check rate limit for a specific key and identifier
   */
  checkRateLimit(key: string, identifier: string): RateLimitResult {
    if (!this.config.enableRateLimit) {
      return { allowed: true };
    }

    const config = this.config.rateLimits[key];
    if (!config) {
      return { allowed: true };
    }

    const now = Date.now();
    const rateLimitKey = `${key}:${identifier}`;
    const existing = this.rateLimitStore.get(rateLimitKey);

    if (!existing || now > existing.resetTime) {
      // New window or expired
      this.rateLimitStore.set(rateLimitKey, {
        count: 1,
        resetTime: now + config.windowMs
      });

      return {
        allowed: true,
        resetTime: now + config.windowMs,
        remaining: config.maxRequests - 1
      };
    }

    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        resetTime: existing.resetTime,
        remaining: 0
      };
    }

    existing.count++;
    return {
      allowed: true,
      resetTime: existing.resetTime,
      remaining: config.maxRequests - existing.count
    };
  }

  /**
   * Block an IP address
   */
  blockIP(ip: string, duration?: number): void {
    this.blockedIPs.add(ip);

    if (duration) {
      setTimeout(() => {
        this.blockedIPs.delete(ip);
      }, duration);
    }
  }

  /**
   * Check if an IP address is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): PasswordValidationResult {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    // Complexity checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add numbers');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add special characters');
    }

    // Common password check
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('This password is too common');
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    };
  }

  /**
   * Hash password using Web Crypto API
   */
  async hashPassword(password: string): Promise<string> {
    // In a real app, use bcrypt or similar
    // This is a simple example using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'astral_salt');

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate session token
   */
  validateSession(token: string): boolean {
    // Basic token validation
    if (!token || token.length < 32) {
      return false;
    }

    // Check if token is hex
    return /^[a-f0-9]+$/i.test(token);
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    const token = this.generateSecureToken(32);
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    const stored = sessionStorage.getItem('csrf_token');
    return stored === token;
  }

  /**
   * Check if text contains profanity
   */
  containsProfanity(text: string): boolean {
    // Basic profanity filter - in production, use a comprehensive list
    const profanityWords: string[] = [
      // Add your profanity list here
    ];

    const words = text.toLowerCase().split(/\s+/);
    return profanityWords.some(word => words.includes(word));
  }

  /**
   * Filter content for profanity
   */
  filterContent(text: string): string {
    if (this.containsProfanity(text)) {
      // Replace profanity with asterisks
      const filtered = text;
      // Implementation would replace detected words
      return filtered;
    }
    return text;
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, details: any, severity: SecuritySeverity = 'medium'): void {
    const logEntry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in localStorage for development
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    localStorage.setItem('security_logs', JSON.stringify(logs));

    // In production, send to security monitoring service
    console.warn('Security Event:', logEntry);
  }

  /**
   * Add form protection (CSRF token and input validation)
   */
  addFormProtection(form: HTMLFormElement): void {
    // Add CSRF token
    const csrfToken = this.generateCSRFToken();
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);

    // Add input validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (this.containsXSS(target.value)) {
          target.setCustomValidity('Invalid characters detected');
          this.logSecurityEvent('xss_attempt', {
            field: target.name,
            value: target.value.substring(0, 100)
          }, 'high');
        } else {
          target.setCustomValidity('');
        }
      });
    });
  }

  /**
   * Clean up expired rate limit entries
   */
  clearRateLimitStore(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Get security logs
   */
  getSecurityLogs(): SecurityLogEntry[] {
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  }

  /**
   * Clear security logs
   */
  clearSecurityLogs(): void {
    localStorage.removeItem('security_logs');
  }
}

/**
 * React hook for using security service
 */
export const useSecurity = () => {
  const [service] = React.useState(() => new SecurityService());

  React.useEffect(() => {
    // Clean up rate limit store periodically
    const cleanup = setInterval(() => {
      service.clearRateLimitStore();
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, [service]);

  return {
    validateInput: service.validateInput.bind(service),
    sanitizeInput: service.sanitizeInput.bind(service),
    sanitizeHTML: service.sanitizeHTML.bind(service),
    checkRateLimit: service.checkRateLimit.bind(service),
    validatePassword: service.validatePassword.bind(service),
    hashPassword: service.hashPassword.bind(service),
    generateSecureToken: service.generateSecureToken.bind(service),
    validateSession: service.validateSession.bind(service),
    generateCSRFToken: service.generateCSRFToken.bind(service),
    validateCSRFToken: service.validateCSRFToken.bind(service),
    filterContent: service.filterContent.bind(service),
    logSecurityEvent: service.logSecurityEvent.bind(service),
    addFormProtection: service.addFormProtection.bind(service)
  };
};

/**
 * Validation rules presets
 */
export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^\w+$/
  },
  post: {
    required: true,
    minLength: 1,
    maxLength: 2000
  },
  comment: {
    required: true,
    minLength: 1,
    maxLength: 500
  }
};

/**
 * Singleton security service instance
 */
let securityServiceInstance: SecurityService | null = null;

export const getSecurityService = (): SecurityService => {
  if (!securityServiceInstance) {
    securityServiceInstance = new SecurityService();
  }
  return securityServiceInstance;
};

export default SecurityService;
