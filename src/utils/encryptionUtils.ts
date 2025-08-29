/**
 * Encryption Utilities for Mental Health Platform
 * HIPAA-compliant encryption for sensitive mental health data
 */

// Type definitions
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  iterations: number;
  saltLength: number;
}

export interface EncryptedData {
  ciphertext: string;
  salt: string;
  iv: string;
  tag?: string;
  algorithm: string;
  timestamp: number;
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
  createdAt: Date;
  expiresAt?: Date;
}

// Default configuration for HIPAA compliance
const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  iterations: 100000,
  saltLength: 16
};

/**
 * Generate a cryptographic key from a password
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  config: EncryptionConfig = DEFAULT_CONFIG
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: config.iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: config.algorithm,
      length: config.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
export function generateSalt(length: number = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a random initialization vector
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
}

/**
 * Encrypt sensitive data
 */
export async function encryptData(
  data: string,
  password: string,
  config: EncryptionConfig = DEFAULT_CONFIG
): Promise<EncryptedData> {
  try {
    const salt = generateSalt(config.saltLength);
    const iv = generateIV();
    const key = await deriveKey(password, salt, config);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: config.algorithm,
        iv
      },
      key,
      encodedData
    );

    // Convert to base64 for storage
    const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const saltStr = btoa(String.fromCharCode(...salt));
    const ivStr = btoa(String.fromCharCode(...iv));

    return {
      ciphertext,
      salt: saltStr,
      iv: ivStr,
      algorithm: config.algorithm,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(
  encryptedData: EncryptedData,
  password: string,
  config: EncryptionConfig = DEFAULT_CONFIG
): Promise<string> {
  try {
    // Convert from base64
    const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));

    const key = await deriveKey(password, salt, config);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: encryptedData.algorithm || config.algorithm,
        iv
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt object data
 */
export async function encryptObject<T extends object>(
  obj: T,
  password: string,
  config?: EncryptionConfig
): Promise<EncryptedData> {
  const jsonString = JSON.stringify(obj);
  return encryptData(jsonString, password, config);
}

/**
 * Decrypt object data
 */
export async function decryptObject<T extends object>(
  encryptedData: EncryptedData,
  password: string,
  config?: EncryptionConfig
): Promise<T> {
  const jsonString = await decryptData(encryptedData, password, config);
  return JSON.parse(jsonString) as T;
}

/**
 * Validate password strength for HIPAA compliance
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Secure comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Encrypt form data for secure transmission
 */
export async function encryptFormData(
  formData: Record<string, any>,
  password: string,
  sensitiveFields: string[] = []
): Promise<Record<string, any>> {
  const encryptedForm: Record<string, any> = {};

  for (const [key, value] of Object.entries(formData)) {
    if (sensitiveFields.includes(key) && typeof value === 'string') {
      encryptedForm[key] = await encryptData(value, password);
    } else {
      encryptedForm[key] = value;
    }
  }

  return encryptedForm;
}

/**
 * Create encryption key from biometric data
 */
export async function createBiometricKey(
  biometricData: ArrayBuffer
): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', biometricData);
  
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Sanitize data before encryption (remove PII markers)
 */
export function sanitizeForEncryption(data: string): string {
  // Remove common PII patterns
  let sanitized = data;
  
  // Remove SSN patterns
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REMOVED]');
  
  // Remove credit card patterns
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CC_REMOVED]');
  
  // Remove email patterns (optional, based on requirements)
  // sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REMOVED]');
  
  return sanitized;
}

/**
 * Key rotation utility
 */
export class KeyRotation {
  private keys: Map<string, EncryptionKey> = new Map();
  private currentKeyId: string | null = null;

  async rotateKey(password: string, config?: EncryptionConfig): Promise<string> {
    const salt = generateSalt();
    const key = await deriveKey(password, salt, config);
    const keyId = generateSecureToken();

    this.keys.set(keyId, {
      key,
      salt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    this.currentKeyId = keyId;
    return keyId;
  }

  getCurrentKey(): EncryptionKey | null {
    if (!this.currentKeyId) return null;
    return this.keys.get(this.currentKeyId) || null;
  }

  getKey(keyId: string): EncryptionKey | null {
    return this.keys.get(keyId) || null;
  }

  cleanupExpiredKeys(): void {
    const now = new Date();
    for (const [keyId, keyData] of this.keys.entries()) {
      if (keyData.expiresAt && keyData.expiresAt < now) {
        this.keys.delete(keyId);
      }
    }
  }
}

// Export singleton instance for key rotation
export const keyRotation = new KeyRotation();

// Mental health specific encryption utilities
export const MentalHealthEncryption = {
  /**
   * Encrypt therapy session notes
   */
  async encryptSessionNotes(notes: string, therapistKey: string): Promise<EncryptedData> {
    const sanitized = sanitizeForEncryption(notes);
    return encryptData(sanitized, therapistKey);
  },

  /**
   * Encrypt patient records
   */
  async encryptPatientRecord(record: object, masterKey: string): Promise<EncryptedData> {
    return encryptObject(record, masterKey);
  },

  /**
   * Create session-specific encryption key
   */
  async createSessionKey(sessionId: string, userId: string): Promise<string> {
    const combined = `${sessionId}-${userId}-${Date.now()}`;
    return hashData(combined);
  },

  /**
   * Encrypt crisis intervention data
   */
  async encryptCrisisData(
    data: any,
    emergencyKey: string
  ): Promise<EncryptedData> {
    // Use stronger encryption for crisis data
    const config: EncryptionConfig = {
      ...DEFAULT_CONFIG,
      iterations: 150000 // Higher iteration count for crisis data
    };
    return encryptObject(data, emergencyKey, config);
  }
};

export default {
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  hashData,
  generateSecureToken,
  validatePasswordStrength,
  MentalHealthEncryption,
  keyRotation
};