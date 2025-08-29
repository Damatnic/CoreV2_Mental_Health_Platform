import crypto from 'crypto';
import winston from 'winston';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/encryption-service.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Static Encryption Service for HIPAA-compliant data encryption
 */
export class EncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32; // 256 bits
  private static readonly ivLength = 16; // 128 bits
  private static readonly tagLength = 16; // 128 bits
  private static readonly saltLength = 64; // 512 bits
  private static readonly iterations = 100000; // PBKDF2 iterations

  private static masterKey: Buffer;
  private static dataEncryptionKey: Buffer;
  private static initialized = false;

  /**
   * Initialize the encryption service
   */
  static initialize(): void {
    if (this.initialized) return;

    this.masterKey = this.getMasterKey();
    this.dataEncryptionKey = this.deriveDataEncryptionKey();
    this.initialized = true;

    logger.info('Encryption service initialized');
  }

  /**
   * Get master key from environment
   */
  private static getMasterKey(): Buffer {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_MASTER_KEY must be set in production');
      }
      logger.warn('Using default encryption key - NOT FOR PRODUCTION USE');
      return crypto.scryptSync('development-key-not-for-production', 'salt', this.keyLength);
    }

    if (!/^[0-9a-f]{64}$/i.test(key)) {
      throw new Error('ENCRYPTION_MASTER_KEY must be a 64-character hex string');
    }

    return Buffer.from(key, 'hex');
  }

  /**
   * Derive data encryption key from master key
   */
  private static deriveDataEncryptionKey(): Buffer {
    const salt = process.env.ENCRYPTION_SALT || 'mental-health-platform-salt';
    return crypto.pbkdf2Sync(this.masterKey, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(text: string): string {
    if (!this.initialized) this.initialize();

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.dataEncryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'base64')
      ]);
      
      return combined.toString('base64');
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string): string {
    if (!this.initialized) this.initialize();

    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.dataEncryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt object (converts to JSON first)
   */
  static encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt object (parses JSON after decryption)
   */
  static decryptObject(encryptedData: string): any {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * Hash sensitive data for storage (one-way)
   */
  static hash(data: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const hash = crypto.pbkdf2Sync(data, salt, this.iterations, 64, 'sha512');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const verifyHash = crypto.pbkdf2Sync(
        data, 
        Buffer.from(salt, 'hex'), 
        this.iterations, 
        64, 
        'sha512'
      );
      return hash === verifyHash.toString('hex');
    } catch (error) {
      logger.error('Hash verification failed', error);
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate encryption key for file storage
   */
  static generateFileKey(): { key: string; iv: string } {
    return {
      key: crypto.randomBytes(this.keyLength).toString('hex'),
      iv: crypto.randomBytes(this.ivLength).toString('hex')
    };
  }

  /**
   * Create cipher stream for file encryption
   */
  static createCipherStream(key: string, iv: string): crypto.CipherGCM {
    return crypto.createCipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );
  }

  /**
   * Create decipher stream for file decryption
   */
  static createDecipherStream(key: string, iv: string, authTag: Buffer): crypto.DecipherGCM {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(authTag);
    return decipher;
  }

  /**
   * Encrypt field for database storage
   */
  static encryptField(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return this.encrypt(String(value));
  }

  /**
   * Decrypt field from database
   */
  static decryptField(encryptedValue: string): string {
    if (!encryptedValue) {
      return '';
    }
    try {
      return this.decrypt(encryptedValue);
    } catch (error) {
      logger.error('Field decryption failed', error);
      return '';
    }
  }

  /**
   * Batch encrypt multiple values
   */
  static encryptBatch(values: string[]): string[] {
    return values.map(value => this.encrypt(value));
  }

  /**
   * Batch decrypt multiple values
   */
  static decryptBatch(encryptedValues: string[]): string[] {
    return encryptedValues.map(value => {
      try {
        return this.decrypt(value);
      } catch (error) {
        logger.error('Batch decryption failed for value', error);
        return '';
      }
    });
  }

  /**
   * Rotate encryption keys
   */
  static async rotateKeys(): Promise<void> {
    logger.info('Starting encryption key rotation');
    
    const newMasterKey = crypto.randomBytes(this.keyLength);
    const newDataKey = crypto.pbkdf2Sync(
      newMasterKey, 
      process.env.ENCRYPTION_SALT || 'salt',
      this.iterations,
      this.keyLength,
      'sha256'
    );

    const oldDataKey = this.dataEncryptionKey;

    this.masterKey = newMasterKey;
    this.dataEncryptionKey = newDataKey;

    logger.info('Encryption keys rotated successfully', {
      timestamp: new Date().toISOString(),
      keyId: crypto.createHash('sha256').update(newMasterKey).digest('hex').substring(0, 8)
    });

    // Note: In production, you would need to:
    // 1. Re-encrypt all existing encrypted data with new keys
    // 2. Store new keys securely (e.g., AWS KMS, Azure Key Vault)
    // 3. Update environment variables
    // 4. Notify administrators
  }

  /**
   * Validate encryption configuration
   */
  static validateConfiguration(): boolean {
    try {
      const testData = 'encryption-validation-test';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      
      const isValid = decrypted === testData;
      
      if (isValid) {
        logger.info('Encryption configuration validated successfully');
      } else {
        logger.error('Encryption configuration validation failed');
      }
      
      return isValid;
    } catch (error) {
      logger.error('Encryption validation error', error);
      return false;
    }
  }

  /**
   * Generate deterministic encryption (for searchable encryption)
   */
  static deterministicEncrypt(text: string): string {
    // Use HMAC for deterministic encryption (allows searching)
    const hmac = crypto.createHmac('sha256', this.dataEncryptionKey);
    hmac.update(text);
    return hmac.digest('hex');
  }

  /**
   * Create signature for data integrity
   */
  static sign(data: string): string {
    const hmac = crypto.createHmac('sha256', this.masterKey);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify signature
   */
  static verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.sign(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Encrypt sensitive log data
   */
  static encryptLogData(data: any): string {
    const sensitive = {
      timestamp: new Date().toISOString(),
      data: data
    };
    return this.encrypt(JSON.stringify(sensitive));
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate secure API key
   */
  static generateApiKey(): string {
    const prefix = 'mhp'; // Mental Health Platform
    const key = crypto.randomBytes(32).toString('base64url');
    return `${prefix}_${key}`;
  }

  /**
   * Mask sensitive data for display
   */
  static mask(data: string, showChars: number = 4): string {
    if (!data || data.length <= showChars) {
      return '*'.repeat(data?.length || 0);
    }
    
    const visiblePart = data.substring(data.length - showChars);
    const maskedPart = '*'.repeat(data.length - showChars);
    return maskedPart + visiblePart;
  }

  /**
   * Generate encryption metadata
   */
  static getEncryptionMetadata(): {
    algorithm: string;
    keyLength: number;
    compliance: string[];
    rotationSchedule: string;
  } {
    return {
      algorithm: this.algorithm.toUpperCase(),
      keyLength: this.keyLength * 8, // Convert to bits
      compliance: ['HIPAA', 'GDPR', 'CCPA'],
      rotationSchedule: '90 days'
    };
  }
}

// Initialize on module load
EncryptionService.initialize();

export default EncryptionService;