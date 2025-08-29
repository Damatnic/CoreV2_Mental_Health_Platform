/**
 * Security Helper Functions
 * 
 * Comprehensive security utilities for mental health platform protecting
 * sensitive patient data with HIPAA-compliant security measures and
 * crisis-aware protection mechanisms.
 * 
 * @fileoverview Security utilities and protection helpers
 * @version 2.0.0
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.astralcore.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': []
} as const;

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  encryptionKey: string;
  sessionTimeout: number;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableXSSProtection: true,
  enableCSRFProtection: true,
  enableRateLimiting: true,
  maxRequestsPerMinute: 60,
  encryptionKey: process.env.REACT_APP_ENCRYPTION_KEY || 'default-key',
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target="_blank"', 'rel="noopener noreferrer"']
  });
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove any HTML tags
  let clean = input.replace(/<[^>]*>/g, '');

  // Escape special characters
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  clean = clean.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);

  // Remove any potential script injections
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=/gi, '');

  return clean.trim();
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';

  // List of allowed protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

  try {
    const parsed = new URL(url, window.location.href);

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    // Block javascript: and data: protocols
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return '';
    }

    return parsed.toString();
  } catch (e) {
    // For relative URLs, ensure they start with /
    if (url.startsWith('/')) {
      return url;
    }
    return '';
  }
}

/**
 * Simple encryption for sensitive data (use proper encryption in production)
 */
export function encryptData(data: string, key: string = DEFAULT_SECURITY_CONFIG.encryptionKey): string {
  try {
    // Simple XOR encryption - replace with proper encryption in production
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key: string = DEFAULT_SECURITY_CONFIG.encryptionKey): string {
  try {
    const encrypted = atob(encryptedData); // Base64 decode
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(): void {
  const required = [
    'REACT_APP_API_URL',
    'REACT_APP_API_KEY',
    'REACT_APP_ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    
    // In production, throw error to prevent app from starting
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

/**
 * Rate limiting for API calls (prevent abuse)
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  key: string, 
  maxRequests: number = DEFAULT_SECURITY_CONFIG.maxRequestsPerMinute, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];

  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return false;
  }

  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
}

/**
 * Generate secure session token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure session storage wrapper
 */
export class SecureStorage {
  private static encryptionKey = DEFAULT_SECURITY_CONFIG.encryptionKey;

  /**
   * Set encrypted item in storage
   */
  public static setItem(key: string, value: string, encrypt: boolean = true): void {
    try {
      const finalValue = encrypt ? encryptData(value, this.encryptionKey) : value;
      sessionStorage.setItem(key, finalValue);
    } catch (error) {
      console.error('Failed to set secure storage item:', error);
    }
  }

  /**
   * Get decrypted item from storage
   */
  public static getItem(key: string, encrypted: boolean = true): string | null {
    try {
      const value = sessionStorage.getItem(key);
      if (!value) return null;
      
      return encrypted ? decryptData(value, this.encryptionKey) : value;
    } catch (error) {
      console.error('Failed to get secure storage item:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  public static removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove secure storage item:', error);
    }
  }

  /**
   * Clear all items from storage
   */
  public static clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
}

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static token: string | null = null;

  /**
   * Generate CSRF token
   */
  public static generateToken(): string {
    this.token = generateSecureToken();
    SecureStorage.setItem('csrf_token', this.token, false);
    return this.token;
  }

  /**
   * Get current CSRF token
   */
  public static getToken(): string | null {
    if (!this.token) {
      this.token = SecureStorage.getItem('csrf_token', false);
    }
    return this.token;
  }

  /**
   * Validate CSRF token
   */
  public static validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken === token;
  }

  /**
   * Clear CSRF token
   */
  public static clearToken(): void {
    this.token = null;
    SecureStorage.removeItem('csrf_token');
  }
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
} as const;

/**
 * Initialize security measures
 */
export function initializeSecurity(config: Partial<SecurityConfig> = {}): void {
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  try {
    // Validate environment
    validateEnvVars();

    // Generate CSRF token
    if (finalConfig.enableCSRFProtection) {
      CSRFProtection.generateToken();
    }

    // Prevent clickjacking
    if (window.top !== window.self) {
      window.top!.location = window.self.location;
    }

    // Monitor for XSS attempts
    if (finalConfig.enableXSSProtection) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                
                // Check for suspicious attributes
                if (element.hasAttribute('onload') ||
                    element.hasAttribute('onerror') ||
                    element.hasAttribute('onclick')) {
                  console.warn('Suspicious element detected and removed');
                  element.remove();
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Set up session timeout
    if (finalConfig.sessionTimeout > 0) {
      setTimeout(() => {
        SecureStorage.clear();
        window.location.reload();
      }, finalConfig.sessionTimeout);
    }

    console.log('Security measures initialized');
  } catch (error) {
    console.error('Failed to initialize security:', error);
  }
}

/**
 * Audit logger for security events
 */
export class SecurityAuditLogger {
  
  /**
   * Log security event
   */
  public static log(
    event: string, 
    details: Record<string, any> = {}, 
    level: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      level,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', logEntry);
    }

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production' && level === 'critical') {
      // Send to monitoring service
      this.sendToMonitoringService(logEntry);
    }
  }

  /**
   * Send to monitoring service
   */
  private static async sendToMonitoringService(logEntry: any): Promise<void> {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': CSRFProtection.getToken() || ''
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }
}

// Default export with all utilities
export default {
  CSP_DIRECTIVES,
  DEFAULT_SECURITY_CONFIG,
  sanitizeHTML,
  sanitizeInput,
  sanitizeURL,
  encryptData,
  decryptData,
  validateEnvVars,
  checkRateLimit,
  generateSecureToken,
  SecureStorage,
  CSRFProtection,
  SECURITY_HEADERS,
  initializeSecurity,
  SecurityAuditLogger
};
