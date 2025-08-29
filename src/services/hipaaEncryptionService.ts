/**
 * HIPAA-Compliant Encryption Service
 * 
 * Implements AES-256-GCM encryption for PHI (Protected Health Information)
 * Complies with HIPAA Technical Safeguards § 164.312(a)(2)(iv)
 * 
 * @version 1.0.0
 * @security HIPAA Compliant
 */

import { logger } from '../utils/logger';

/**
 * Encryption configuration interface
 */
interface EncryptionConfig {
  algorithm: 'AES-GCM';
  keyLength: 256;
  ivLength: 16;
  saltLength: 32;
  tagLength: 128;
  iterations: 100000;
}

/**
 * Encrypted data structure
 */
interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
  algorithm: string;
  timestamp: string;
  keyId?: string;
}

/**
 * Key derivation parameters
 */
interface KeyDerivationParams {
  salt: Uint8Array;
  iterations: number;
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
}

/**
 * HIPAA-compliant encryption service class
 */
export class HIPAAEncryptionService {
  private readonly config: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 16,
    saltLength: 32,
    tagLength: 128,
    iterations: 100000
  };

  private masterKey: CryptoKey | null = null;
  private keyCache = new Map<string, CryptoKey>();
  private keyRotationSchedule: NodeJS.Timeout | null = null;

  /**
   * Initialize the encryption service with master key
   */
  async initialize(masterPassword?: string): Promise<void> {
    try {
      // Generate or derive master key
      if (masterPassword) {
        this.masterKey = await this.deriveKeyFromPassword(masterPassword);
      } else {
        this.masterKey = await this.generateMasterKey();
      }

      // Schedule key rotation (every 90 days for HIPAA compliance)
      this.scheduleKeyRotation();

      logger.info('HIPAA Encryption Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  /**
   * Encrypt sensitive data (PHI)
   * @param data - Plain text data to encrypt
   * @param context - Optional context for key derivation (e.g., user ID)
   * @returns Encrypted data structure
   */
  async encryptPHI(data: string, context?: string): Promise<EncryptedData> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
      
      // Generate salt for additional security
      const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));

      // Derive encryption key from master key
      const encryptionKey = await this.deriveDataKey(salt, context);

      // Convert data to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv,
          tagLength: this.config.tagLength
        },
        encryptionKey,
        dataBuffer
      );

      // Extract authentication tag (last 16 bytes for GCM)
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const tagStart = encryptedArray.length - (this.config.tagLength / 8);
      const ciphertext = encryptedArray.slice(0, tagStart);
      const tag = encryptedArray.slice(tagStart);

      // Return encrypted data structure
      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        tag: this.arrayBufferToBase64(tag),
        algorithm: this.config.algorithm,
        timestamp: new Date().toISOString(),
        keyId: context
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt PHI data');
    }
  }

  /**
   * Decrypt sensitive data (PHI)
   * @param encryptedData - Encrypted data structure
   * @param context - Optional context for key derivation
   * @returns Decrypted plain text
   */
  async decryptPHI(encryptedData: EncryptedData, context?: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Validate encrypted data structure
      this.validateEncryptedData(encryptedData);

      // Convert from base64
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const salt = this.base64ToArrayBuffer(encryptedData.salt);
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const tag = this.base64ToArrayBuffer(encryptedData.tag);

      // Combine ciphertext and tag for GCM
      const encryptedBuffer = new Uint8Array(ciphertext.byteLength + tag.byteLength);
      encryptedBuffer.set(new Uint8Array(ciphertext), 0);
      encryptedBuffer.set(new Uint8Array(tag), ciphertext.byteLength);

      // Derive the same encryption key
      const decryptionKey = await this.deriveDataKey(new Uint8Array(salt), context || encryptedData.keyId);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv: new Uint8Array(iv),
          tagLength: this.config.tagLength
        },
        decryptionKey,
        encryptedBuffer
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt PHI data');
    }
  }

  /**
   * Encrypt field-level data for database storage
   */
  async encryptField(fieldValue: any, fieldName: string): Promise<string> {
    const data = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
    const encrypted = await this.encryptPHI(data, `field:${fieldName}`);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt field-level data from database
   */
  async decryptField(encryptedField: string, fieldName: string): Promise<any> {
    try {
      const encrypted = JSON.parse(encryptedField) as EncryptedData;
      const decrypted = await this.decryptPHI(encrypted, `field:${fieldName}`);
      
      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      logger.error(`Failed to decrypt field ${fieldName}:`, error);
      throw new Error('Field decryption failed');
    }
  }

  /**
   * Generate a new master key
   */
  private async generateMasterKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: this.config.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKeyFromPassword(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Generate salt for key derivation
    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive the key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.config.algorithm, length: this.config.keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive data encryption key from master key
   */
  private async deriveDataKey(salt: Uint8Array, context?: string): Promise<CryptoKey> {
    if (!this.masterKey) {
      throw new Error('Master key not available');
    }

    // Create key derivation context
    const contextKey = context || 'default';
    const cacheKey = `${contextKey}:${this.arrayBufferToBase64(salt)}`;

    // Check cache
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Export master key for HKDF
    const masterKeyBuffer = await crypto.subtle.exportKey('raw', this.masterKey);

    // Use HKDF to derive data key
    const info = new TextEncoder().encode(contextKey);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKeyBuffer,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: salt,
        info: info,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.config.algorithm, length: this.config.keyLength },
      true,
      ['encrypt', 'decrypt']
    );

    // Cache the derived key
    this.keyCache.set(cacheKey, derivedKey);

    return derivedKey;
  }

  /**
   * Validate encrypted data structure
   */
  private validateEncryptedData(data: EncryptedData): void {
    if (!data.ciphertext || !data.iv || !data.salt || !data.tag) {
      throw new Error('Invalid encrypted data structure');
    }

    if (data.algorithm !== this.config.algorithm) {
      throw new Error(`Unsupported algorithm: ${data.algorithm}`);
    }
  }

  /**
   * Schedule key rotation for HIPAA compliance
   */
  private scheduleKeyRotation(): void {
    // Rotate keys every 90 days
    const rotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

    this.keyRotationSchedule = setInterval(async () => {
      await this.rotateKeys();
    }, rotationInterval);
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      logger.info('Starting key rotation process');

      // Generate new master key
      const newMasterKey = await this.generateMasterKey();

      // Store old key for re-encryption process
      const oldMasterKey = this.masterKey;

      // Update master key
      this.masterKey = newMasterKey;

      // Clear key cache
      this.keyCache.clear();

      // Log key rotation event for audit
      logger.info('Key rotation completed successfully', {
        timestamp: new Date().toISOString(),
        action: 'KEY_ROTATION'
      });

      // Trigger re-encryption of existing data (would be handled by separate process)
      // This would typically be done in batches to avoid performance impact
    } catch (error) {
      logger.error('Key rotation failed:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }

  /**
   * Hash sensitive data using SHA-256
   */
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.keyRotationSchedule) {
      clearInterval(this.keyRotationSchedule);
    }
    this.keyCache.clear();
    this.masterKey = null;
  }
}

// Export singleton instance
export const hipaaEncryption = new HIPAAEncryptionService();

// Export types for external use
export type { EncryptedData, EncryptionConfig };