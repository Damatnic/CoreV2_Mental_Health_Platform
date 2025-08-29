import { Request, Response, NextFunction } from 'express';
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
    new winston.transports.File({ filename: 'logs/encryption.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * HIPAA-compliant encryption service using AES-256-GCM
 */
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 64; // 512 bits
  private readonly iterations = 100000; // PBKDF2 iterations
  private masterKey: Buffer;
  private dataEncryptionKey: Buffer;

  constructor() {
    // Initialize encryption keys from environment
    this.masterKey = this.getMasterKey();
    this.dataEncryptionKey = this.deriveDataEncryptionKey();
  }

  /**
   * Get master key from environment or generate if not exists
   */
  private getMasterKey(): Buffer {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_MASTER_KEY must be set in production');
      }
      // Generate a default key for development
      logger.warn('Using default encryption key - NOT FOR PRODUCTION USE');
      return crypto.scryptSync('development-key-not-for-production', 'salt', this.keyLength);
    }

    // Validate key format (should be hex string)
    if (!/^[0-9a-f]{64}$/i.test(key)) {
      throw new Error('ENCRYPTION_MASTER_KEY must be a 64-character hex string');
    }

    return Buffer.from(key, 'hex');
  }

  /**
   * Derive data encryption key from master key
   */
  private deriveDataEncryptionKey(): Buffer {
    const salt = process.env.ENCRYPTION_SALT || 'mental-health-platform-salt';
    return crypto.pbkdf2Sync(this.masterKey, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  public encrypt(text: string): string {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.dataEncryptionKey, iv);
      
      // Encrypt data
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'base64')
      ]);
      
      // Return base64 encoded result
      return combined.toString('base64');
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  public decrypt(encryptedData: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.dataEncryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt data
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
  public encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt object (parses JSON after decryption)
   */
  public decryptObject(encryptedData: string): any {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * Hash sensitive data for storage (one-way)
   */
  public hash(data: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const hash = crypto.pbkdf2Sync(data, salt, this.iterations, 64, 'sha512');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  /**
   * Verify hashed data
   */
  public verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(
      data, 
      Buffer.from(salt, 'hex'), 
      this.iterations, 
      64, 
      'sha512'
    );
    return hash === verifyHash.toString('hex');
  }

  /**
   * Generate encryption key for file storage
   */
  public generateFileKey(): { key: string; iv: string } {
    return {
      key: crypto.randomBytes(this.keyLength).toString('hex'),
      iv: crypto.randomBytes(this.ivLength).toString('hex')
    };
  }

  /**
   * Encrypt file stream
   */
  public createEncryptStream(key: string, iv: string): crypto.CipherGCM {
    return crypto.createCipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );
  }

  /**
   * Decrypt file stream
   */
  public createDecryptStream(key: string, iv: string, authTag: Buffer): crypto.DecipherGCM {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(authTag);
    return decipher;
  }

  /**
   * Rotate encryption keys
   */
  public async rotateKeys(): Promise<void> {
    logger.info('Starting encryption key rotation');
    
    // Generate new master key
    const newMasterKey = crypto.randomBytes(this.keyLength);
    const newDataKey = crypto.pbkdf2Sync(
      newMasterKey, 
      process.env.ENCRYPTION_SALT || 'salt',
      this.iterations,
      this.keyLength,
      'sha256'
    );

    // Store old keys for re-encryption
    const oldDataKey = this.dataEncryptionKey;

    // Update keys
    this.masterKey = newMasterKey;
    this.dataEncryptionKey = newDataKey;

    // Log key rotation (without exposing keys)
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
   * Validate encryption health
   */
  public validateEncryption(): boolean {
    try {
      const testData = 'encryption-health-check';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      return decrypted === testData;
    } catch (error) {
      logger.error('Encryption validation failed', error);
      return false;
    }
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

/**
 * Encryption middleware for request/response
 */
export const encryptionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip encryption for certain paths
  const skipPaths = ['/health', '/api/auth/login', '/api/auth/register'];
  if (skipPaths.includes(req.path)) {
    next();
    return;
  }

  // Encrypt sensitive fields in request body
  if (req.body && req.method !== 'GET') {
    const sensitiveFields = [
      'ssn', 'dateOfBirth', 'medicalHistory', 'medications',
      'diagnosis', 'treatmentNotes', 'phoneNumber', 'address',
      'emergencyContact', 'insurance', 'creditCard'
    ];

    sensitiveFields.forEach(field => {
      if (req.body[field]) {
        req.body[`${field}_encrypted`] = encryptionService.encrypt(req.body[field]);
        delete req.body[field];
      }
    });
  }

  // Override res.json to encrypt response
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    // Encrypt sensitive fields in response
    if (data && typeof data === 'object') {
      const encryptResponse = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(item => encryptResponse(item));
        }
        
        if (obj && typeof obj === 'object') {
          const encrypted: any = {};
          
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              // Check if field should be encrypted
              const sensitivePatterns = [
                /ssn/i, /social.*security/i,
                /dob/i, /date.*birth/i,
                /medical/i, /health/i, /diagnosis/i,
                /medication/i, /prescription/i,
                /treatment/i, /therapy/i,
                /phone/i, /address/i,
                /emergency.*contact/i,
                /insurance/i, /credit.*card/i
              ];

              const shouldEncrypt = sensitivePatterns.some(pattern => 
                pattern.test(key) && typeof obj[key] === 'string'
              );

              if (shouldEncrypt && !key.endsWith('_encrypted')) {
                encrypted[`${key}_encrypted`] = encryptionService.encrypt(obj[key]);
                encrypted[`${key}_masked`] = maskSensitiveData(obj[key]);
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                encrypted[key] = encryptResponse(obj[key]);
              } else {
                encrypted[key] = obj[key];
              }
            }
          }
          
          return encrypted;
        }
        
        return obj;
      };

      // Only encrypt if not already encrypted
      if (!data._encrypted) {
        data = encryptResponse(data);
        data._encrypted = true;
      }
    }

    return originalJson(data);
  };

  next();
};

/**
 * Decrypt middleware for encrypted requests
 */
export const decryptionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Decrypt encrypted fields in request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (key.endsWith('_encrypted') && req.body[key]) {
        try {
          const originalKey = key.replace('_encrypted', '');
          req.body[originalKey] = encryptionService.decrypt(req.body[key]);
          delete req.body[key];
        } catch (error) {
          logger.error(`Failed to decrypt field ${key}`, error);
        }
      }
    }
  }

  next();
};

/**
 * Field-level encryption for specific data
 */
export const encryptField = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && req.body[fieldName]) {
      req.body[`${fieldName}_encrypted`] = encryptionService.encrypt(req.body[fieldName]);
      req.body[`${fieldName}_masked`] = maskSensitiveData(req.body[fieldName]);
      delete req.body[fieldName];
    }
    next();
  };
};

/**
 * Mask sensitive data for display
 */
function maskSensitiveData(data: string): string {
  if (!data) return '';
  
  const length = data.length;
  if (length <= 4) {
    return '*'.repeat(length);
  }
  
  // Show first and last 2 characters for longer strings
  return data.substring(0, 2) + '*'.repeat(length - 4) + data.substring(length - 2);
}

/**
 * Validate encryption configuration
 */
export const validateEncryptionConfig = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!encryptionService.validateEncryption()) {
    logger.error('Encryption validation failed - server should not start');
    res.status(500).json({ error: 'Encryption configuration error' });
    return;
  }
  next();
};

// Export service and middleware
export { encryptionService, EncryptionService };

export default {
  encryptionMiddleware,
  decryptionMiddleware,
  encryptField,
  validateEncryptionConfig,
  encryptionService
};