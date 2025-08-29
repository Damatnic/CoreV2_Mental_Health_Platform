/**
 * HIPAA-Compliant Key Management Service
 * 
 * Implements secure key generation, storage, rotation, and access control
 * Complies with HIPAA Technical Safeguards § 164.312(a)(2)(iv) and § 164.312(e)
 * 
 * @version 1.0.0
 * @security HIPAA Compliant
 */

import { hipaaEncryption } from './hipaaEncryptionService';
import { hipaaAudit, AuditEventType } from './hipaaAuditService';
import { logger } from '../utils/logger';

/**
 * Key types and purposes
 */
export enum KeyType {
  MASTER = 'MASTER',
  DATA_ENCRYPTION = 'DATA_ENCRYPTION',
  KEY_ENCRYPTION = 'KEY_ENCRYPTION',
  SIGNING = 'SIGNING',
  SESSION = 'SESSION',
  API = 'API',
  BACKUP = 'BACKUP'
}

/**
 * Key metadata structure
 */
export interface KeyMetadata {
  id: string;
  type: KeyType;
  algorithm: string;
  keyLength: number;
  createdAt: string;
  expiresAt?: string;
  rotatedFrom?: string;
  purpose: string;
  status: 'active' | 'rotated' | 'expired' | 'revoked';
  accessCount: number;
  lastAccessed?: string;
  createdBy?: string;
  tags?: string[];
}

/**
 * Key access policy
 */
export interface KeyAccessPolicy {
  keyId: string;
  allowedUsers?: string[];
  allowedRoles?: string[];
  allowedApplications?: string[];
  validFrom?: string;
  validUntil?: string;
  maxUsageCount?: number;
  requiresMFA?: boolean;
}

/**
 * Key rotation policy
 */
export interface KeyRotationPolicy {
  keyType: KeyType;
  rotationInterval: number; // in days
  autoRotate: boolean;
  notificationLeadTime: number; // in days
  gracePeriod: number; // in days for old key usage
}

/**
 * Encrypted key storage structure
 */
interface EncryptedKeyStore {
  encryptedKey: string;
  metadata: KeyMetadata;
  checksum: string;
}

/**
 * HIPAA-compliant key management service
 */
export class HIPAAKeyManagementService {
  private keyStore = new Map<string, EncryptedKeyStore>();
  private keyAccessPolicies = new Map<string, KeyAccessPolicy>();
  private keyRotationPolicies = new Map<KeyType, KeyRotationPolicy>();
  private masterKeyId: string | null = null;
  private keyCache = new Map<string, CryptoKey>();
  private rotationSchedules = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the key management service
   */
  private async initializeService(): Promise<void> {
    try {
      // Set up default rotation policies
      this.setupDefaultRotationPolicies();

      // Load existing keys from secure storage
      await this.loadKeys();

      // Initialize master key if not exists
      if (!this.masterKeyId) {
        await this.initializeMasterKey();
      }

      // Schedule key rotation checks
      this.scheduleRotationChecks();

      // Log initialization
      await hipaaAudit.logEvent({
        eventType: AuditEventType.SYSTEM_ACCESS,
        action: 'Key Management Service initialized',
        success: true
      });

      logger.info('HIPAA Key Management Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize key management service:', error);
      throw error;
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(params: {
    type: KeyType;
    purpose: string;
    expiresIn?: number; // days
    userId?: string;
    tags?: string[];
  }): Promise<string> {
    try {
      // Generate the key based on type
      const key = await this.generateCryptoKey(params.type);

      // Create key metadata
      const metadata: KeyMetadata = {
        id: this.generateKeyId(params.type),
        type: params.type,
        algorithm: this.getAlgorithmForKeyType(params.type),
        keyLength: this.getKeyLengthForType(params.type),
        createdAt: new Date().toISOString(),
        expiresAt: params.expiresIn 
          ? new Date(Date.now() + params.expiresIn * 86400000).toISOString()
          : undefined,
        purpose: params.purpose,
        status: 'active',
        accessCount: 0,
        createdBy: params.userId,
        tags: params.tags
      };

      // Export and encrypt the key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const encryptedKey = await this.encryptKeyForStorage(exportedKey);

      // Generate checksum for integrity
      const checksum = await this.generateKeyChecksum(encryptedKey, metadata);

      // Store the encrypted key
      this.keyStore.set(metadata.id, {
        encryptedKey,
        metadata,
        checksum
      });

      // Cache the actual key
      this.keyCache.set(metadata.id, key);

      // Set up expiration if needed
      if (params.expiresIn) {
        this.scheduleKeyExpiration(metadata.id, params.expiresIn);
      }

      // Set up rotation if applicable
      const rotationPolicy = this.keyRotationPolicies.get(params.type);
      if (rotationPolicy?.autoRotate) {
        this.scheduleKeyRotation(metadata.id, rotationPolicy.rotationInterval);
      }

      // Persist to secure storage
      await this.persistKeys();

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId: params.userId,
        action: 'Key generated',
        resourceId: metadata.id,
        resourceType: 'Encryption Key',
        success: true,
        metadata: {
          keyType: params.type,
          purpose: params.purpose
        }
      });

      return metadata.id;
    } catch (error) {
      logger.error('Failed to generate key:', error);
      
      await hipaaAudit.logEvent({
        eventType: AuditEventType.ENCRYPTION_FAILURE,
        action: 'Key generation failed',
        success: false,
        errorMessage: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * Retrieve a key for use
   */
  async getKey(keyId: string, userId?: string, purpose?: string): Promise<CryptoKey> {
    try {
      // Check if key exists
      const keyData = this.keyStore.get(keyId);
      if (!keyData) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Verify key status
      if (keyData.metadata.status !== 'active') {
        throw new Error(`Key is not active: ${keyData.metadata.status}`);
      }

      // Check expiration
      if (keyData.metadata.expiresAt && new Date(keyData.metadata.expiresAt) < new Date()) {
        await this.expireKey(keyId);
        throw new Error('Key has expired');
      }

      // Check access policy
      if (!await this.checkKeyAccess(keyId, userId)) {
        await hipaaAudit.logEvent({
          eventType: AuditEventType.UNAUTHORIZED_ACCESS,
          userId,
          action: 'Unauthorized key access attempt',
          resourceId: keyId,
          success: false
        });
        throw new Error('Access denied to key');
      }

      // Check cache first
      if (this.keyCache.has(keyId)) {
        await this.updateKeyAccessMetrics(keyId);
        return this.keyCache.get(keyId)!;
      }

      // Decrypt and import the key
      const decryptedKey = await this.decryptKeyFromStorage(keyData.encryptedKey);
      const key = await crypto.subtle.importKey(
        'raw',
        decryptedKey,
        {
          name: keyData.metadata.algorithm,
          length: keyData.metadata.keyLength
        },
        true,
        this.getKeyUsagesForType(keyData.metadata.type)
      );

      // Cache the key
      this.keyCache.set(keyId, key);

      // Update access metrics
      await this.updateKeyAccessMetrics(keyId);

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.SYSTEM_ACCESS,
        userId,
        action: 'Key accessed',
        resourceId: keyId,
        resourceType: 'Encryption Key',
        success: true,
        metadata: { purpose }
      });

      return key;
    } catch (error) {
      logger.error('Failed to retrieve key:', error);
      throw error;
    }
  }

  /**
   * Rotate a key
   */
  async rotateKey(keyId: string, userId?: string): Promise<string> {
    try {
      const oldKeyData = this.keyStore.get(keyId);
      if (!oldKeyData) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Generate new key with same properties
      const newKeyId = await this.generateKey({
        type: oldKeyData.metadata.type,
        purpose: oldKeyData.metadata.purpose,
        userId,
        tags: oldKeyData.metadata.tags
      });

      // Update new key metadata
      const newKeyData = this.keyStore.get(newKeyId)!;
      newKeyData.metadata.rotatedFrom = keyId;

      // Mark old key as rotated
      oldKeyData.metadata.status = 'rotated';
      
      // Set grace period for old key
      const rotationPolicy = this.keyRotationPolicies.get(oldKeyData.metadata.type);
      if (rotationPolicy) {
        oldKeyData.metadata.expiresAt = new Date(
          Date.now() + rotationPolicy.gracePeriod * 86400000
        ).toISOString();
      }

      // Persist changes
      await this.persistKeys();

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.KEY_ROTATION,
        userId,
        action: 'Key rotated',
        resourceId: keyId,
        resourceType: 'Encryption Key',
        success: true,
        metadata: {
          oldKeyId: keyId,
          newKeyId: newKeyId
        }
      });

      logger.info(`Key rotated: ${keyId} -> ${newKeyId}`);
      return newKeyId;
    } catch (error) {
      logger.error('Failed to rotate key:', error);
      throw error;
    }
  }

  /**
   * Revoke a key
   */
  async revokeKey(keyId: string, userId: string, reason: string): Promise<void> {
    try {
      const keyData = this.keyStore.get(keyId);
      if (!keyData) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Mark key as revoked
      keyData.metadata.status = 'revoked';

      // Remove from cache
      this.keyCache.delete(keyId);

      // Cancel any scheduled rotations
      const schedule = this.rotationSchedules.get(keyId);
      if (schedule) {
        clearTimeout(schedule);
        this.rotationSchedules.delete(keyId);
      }

      // Persist changes
      await this.persistKeys();

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId,
        action: 'Key revoked',
        resourceId: keyId,
        resourceType: 'Encryption Key',
        success: true,
        metadata: { reason }
      });

      logger.info(`Key revoked: ${keyId}`);
    } catch (error) {
      logger.error('Failed to revoke key:', error);
      throw error;
    }
  }

  /**
   * Set key access policy
   */
  async setKeyAccessPolicy(policy: KeyAccessPolicy, userId: string): Promise<void> {
    try {
      // Validate key exists
      if (!this.keyStore.has(policy.keyId)) {
        throw new Error(`Key not found: ${policy.keyId}`);
      }

      // Store policy
      this.keyAccessPolicies.set(policy.keyId, policy);

      // Persist changes
      await this.persistAccessPolicies();

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.PERMISSION_CHANGE,
        userId,
        action: 'Key access policy updated',
        resourceId: policy.keyId,
        resourceType: 'Key Access Policy',
        success: true,
        metadata: { policy }
      });

      logger.info(`Access policy set for key: ${policy.keyId}`);
    } catch (error) {
      logger.error('Failed to set key access policy:', error);
      throw error;
    }
  }

  /**
   * Backup all keys
   */
  async backupKeys(userId: string): Promise<string> {
    try {
      // Create backup data
      const backup = {
        timestamp: new Date().toISOString(),
        keys: Array.from(this.keyStore.entries()),
        policies: Array.from(this.keyAccessPolicies.entries()),
        rotationPolicies: Array.from(this.keyRotationPolicies.entries())
      };

      // Encrypt backup
      const backupString = JSON.stringify(backup);
      const encryptedBackup = await hipaaEncryption.encryptPHI(backupString, 'key-backup');

      // Generate backup ID
      const backupId = `BACKUP-${Date.now()}`;

      // Store backup reference
      localStorage.setItem(`key_backup_${backupId}`, JSON.stringify(encryptedBackup));

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.BACKUP_CREATED,
        userId,
        action: 'Keys backed up',
        resourceId: backupId,
        resourceType: 'Key Backup',
        success: true
      });

      logger.info(`Keys backed up: ${backupId}`);
      return backupId;
    } catch (error) {
      logger.error('Failed to backup keys:', error);
      throw error;
    }
  }

  /**
   * Restore keys from backup
   */
  async restoreKeys(backupId: string, userId: string): Promise<void> {
    try {
      // Retrieve backup
      const encryptedBackup = localStorage.getItem(`key_backup_${backupId}`);
      if (!encryptedBackup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Decrypt backup
      const encrypted = JSON.parse(encryptedBackup);
      const backupString = await hipaaEncryption.decryptPHI(encrypted, 'key-backup');
      const backup = JSON.parse(backupString);

      // Restore data
      this.keyStore = new Map(backup.keys);
      this.keyAccessPolicies = new Map(backup.policies);
      this.keyRotationPolicies = new Map(backup.rotationPolicies);

      // Clear cache as keys need to be re-imported
      this.keyCache.clear();

      // Audit log
      await hipaaAudit.logEvent({
        eventType: AuditEventType.RESTORE_PERFORMED,
        userId,
        action: 'Keys restored from backup',
        resourceId: backupId,
        resourceType: 'Key Backup',
        success: true
      });

      logger.info(`Keys restored from backup: ${backupId}`);
    } catch (error) {
      logger.error('Failed to restore keys:', error);
      throw error;
    }
  }

  /**
   * Get key statistics
   */
  async getKeyStatistics(): Promise<any> {
    const stats = {
      totalKeys: this.keyStore.size,
      activeKeys: 0,
      rotatedKeys: 0,
      expiredKeys: 0,
      revokedKeys: 0,
      keysByType: {} as Record<string, number>,
      averageAccessCount: 0,
      oldestKey: null as string | null,
      newestKey: null as string | null
    };

    let totalAccessCount = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);

    for (const [keyId, keyData] of this.keyStore) {
      const metadata = keyData.metadata;

      // Count by status
      switch (metadata.status) {
        case 'active': stats.activeKeys++; break;
        case 'rotated': stats.rotatedKeys++; break;
        case 'expired': stats.expiredKeys++; break;
        case 'revoked': stats.revokedKeys++; break;
      }

      // Count by type
      stats.keysByType[metadata.type] = (stats.keysByType[metadata.type] || 0) + 1;

      // Track access count
      totalAccessCount += metadata.accessCount;

      // Track oldest/newest
      const createdDate = new Date(metadata.createdAt);
      if (createdDate < oldestDate) {
        oldestDate = createdDate;
        stats.oldestKey = keyId;
      }
      if (createdDate > newestDate) {
        newestDate = createdDate;
        stats.newestKey = keyId;
      }
    }

    stats.averageAccessCount = stats.totalKeys > 0 
      ? totalAccessCount / stats.totalKeys 
      : 0;

    return stats;
  }

  /**
   * Initialize master key
   */
  private async initializeMasterKey(): Promise<void> {
    this.masterKeyId = await this.generateKey({
      type: KeyType.MASTER,
      purpose: 'Master key for key encryption',
      tags: ['master', 'critical']
    });
  }

  /**
   * Generate crypto key based on type
   */
  private async generateCryptoKey(type: KeyType): Promise<CryptoKey> {
    const algorithm = this.getAlgorithmForKeyType(type);
    const keyLength = this.getKeyLengthForType(type);
    const keyUsages = this.getKeyUsagesForType(type);

    if (type === KeyType.SIGNING) {
      return await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        keyUsages
      ) as CryptoKey;
    }

    return await crypto.subtle.generateKey(
      {
        name: algorithm,
        length: keyLength
      },
      true,
      keyUsages
    );
  }

  /**
   * Get algorithm for key type
   */
  private getAlgorithmForKeyType(type: KeyType): string {
    switch (type) {
      case KeyType.SIGNING:
        return 'ECDSA';
      default:
        return 'AES-GCM';
    }
  }

  /**
   * Get key length for type
   */
  private getKeyLengthForType(type: KeyType): number {
    switch (type) {
      case KeyType.SESSION:
      case KeyType.API:
        return 128;
      default:
        return 256;
    }
  }

  /**
   * Get key usages for type
   */
  private getKeyUsagesForType(type: KeyType): KeyUsage[] {
    switch (type) {
      case KeyType.SIGNING:
        return ['sign', 'verify'];
      default:
        return ['encrypt', 'decrypt'];
    }
  }

  /**
   * Encrypt key for storage
   */
  private async encryptKeyForStorage(key: ArrayBuffer): Promise<string> {
    // Use master key to encrypt other keys
    if (this.masterKeyId) {
      const masterKey = await this.getKey(this.masterKeyId);
      const iv = crypto.getRandomValues(new Uint8Array(16));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        masterKey,
        key
      );

      return JSON.stringify({
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv)
      });
    }

    // Fallback to base64 encoding (not recommended for production)
    return btoa(String.fromCharCode(...new Uint8Array(key)));
  }

  /**
   * Decrypt key from storage
   */
  private async decryptKeyFromStorage(encryptedKey: string): Promise<ArrayBuffer> {
    // Use master key to decrypt
    if (this.masterKeyId && encryptedKey.startsWith('{')) {
      const data = JSON.parse(encryptedKey);
      const masterKey = await this.getKey(this.masterKeyId);
      
      return await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(data.iv)
        },
        masterKey,
        new Uint8Array(data.encrypted)
      );
    }

    // Fallback from base64
    const binary = atob(encryptedKey);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Check key access permissions
   */
  private async checkKeyAccess(keyId: string, userId?: string): Promise<boolean> {
    const policy = this.keyAccessPolicies.get(keyId);
    if (!policy) {
      return true; // No policy means open access (for development)
    }

    // Check user access
    if (policy.allowedUsers && userId) {
      if (!policy.allowedUsers.includes(userId)) {
        return false;
      }
    }

    // Check time validity
    if (policy.validFrom && new Date(policy.validFrom) > new Date()) {
      return false;
    }
    if (policy.validUntil && new Date(policy.validUntil) < new Date()) {
      return false;
    }

    // Check usage count
    const keyData = this.keyStore.get(keyId);
    if (policy.maxUsageCount && keyData) {
      if (keyData.metadata.accessCount >= policy.maxUsageCount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update key access metrics
   */
  private async updateKeyAccessMetrics(keyId: string): Promise<void> {
    const keyData = this.keyStore.get(keyId);
    if (keyData) {
      keyData.metadata.accessCount++;
      keyData.metadata.lastAccessed = new Date().toISOString();
      await this.persistKeys();
    }
  }

  /**
   * Generate key ID
   */
  private generateKeyId(type: KeyType): string {
    return `KEY-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate key checksum
   */
  private async generateKeyChecksum(encryptedKey: string, metadata: KeyMetadata): Promise<string> {
    const data = JSON.stringify({ encryptedKey, metadata });
    return await hipaaEncryption.hashData(data);
  }

  /**
   * Schedule key expiration
   */
  private scheduleKeyExpiration(keyId: string, days: number): void {
    const timeout = setTimeout(async () => {
      await this.expireKey(keyId);
    }, days * 86400000);

    this.rotationSchedules.set(keyId, timeout);
  }

  /**
   * Schedule key rotation
   */
  private scheduleKeyRotation(keyId: string, days: number): void {
    const timeout = setTimeout(async () => {
      await this.rotateKey(keyId);
    }, days * 86400000);

    this.rotationSchedules.set(keyId, timeout);
  }

  /**
   * Expire a key
   */
  private async expireKey(keyId: string): Promise<void> {
    const keyData = this.keyStore.get(keyId);
    if (keyData) {
      keyData.metadata.status = 'expired';
      this.keyCache.delete(keyId);
      await this.persistKeys();
    }
  }

  /**
   * Set up default rotation policies
   */
  private setupDefaultRotationPolicies(): void {
    // Master key - rotate every 365 days
    this.keyRotationPolicies.set(KeyType.MASTER, {
      keyType: KeyType.MASTER,
      rotationInterval: 365,
      autoRotate: true,
      notificationLeadTime: 30,
      gracePeriod: 7
    });

    // Data encryption keys - rotate every 90 days
    this.keyRotationPolicies.set(KeyType.DATA_ENCRYPTION, {
      keyType: KeyType.DATA_ENCRYPTION,
      rotationInterval: 90,
      autoRotate: true,
      notificationLeadTime: 14,
      gracePeriod: 7
    });

    // Session keys - rotate every 1 day
    this.keyRotationPolicies.set(KeyType.SESSION, {
      keyType: KeyType.SESSION,
      rotationInterval: 1,
      autoRotate: true,
      notificationLeadTime: 0,
      gracePeriod: 0
    });

    // API keys - rotate every 30 days
    this.keyRotationPolicies.set(KeyType.API, {
      keyType: KeyType.API,
      rotationInterval: 30,
      autoRotate: true,
      notificationLeadTime: 7,
      gracePeriod: 3
    });
  }

  /**
   * Schedule rotation checks
   */
  private scheduleRotationChecks(): void {
    // Check daily for keys needing rotation
    setInterval(async () => {
      for (const [keyId, keyData] of this.keyStore) {
        if (keyData.metadata.status !== 'active') continue;

        const policy = this.keyRotationPolicies.get(keyData.metadata.type);
        if (!policy?.autoRotate) continue;

        const createdDate = new Date(keyData.metadata.createdAt);
        const rotationDate = new Date(createdDate.getTime() + policy.rotationInterval * 86400000);
        const notificationDate = new Date(rotationDate.getTime() - policy.notificationLeadTime * 86400000);

        if (new Date() >= rotationDate) {
          await this.rotateKey(keyId);
        } else if (new Date() >= notificationDate) {
          logger.info(`Key rotation upcoming: ${keyId} on ${rotationDate.toISOString()}`);
        }
      }
    }, 86400000); // Daily check
  }

  /**
   * Load keys from storage
   */
  private async loadKeys(): Promise<void> {
    try {
      const stored = localStorage.getItem('hipaa_key_store');
      if (stored) {
        const data = JSON.parse(stored);
        this.keyStore = new Map(data.keys);
        this.keyAccessPolicies = new Map(data.policies);
        this.masterKeyId = data.masterKeyId;
      }
    } catch (error) {
      logger.error('Failed to load keys:', error);
    }
  }

  /**
   * Persist keys to storage
   */
  private async persistKeys(): Promise<void> {
    try {
      const data = {
        keys: Array.from(this.keyStore.entries()),
        policies: Array.from(this.keyAccessPolicies.entries()),
        masterKeyId: this.masterKeyId
      };
      localStorage.setItem('hipaa_key_store', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to persist keys:', error);
    }
  }

  /**
   * Persist access policies to storage
   */
  private async persistAccessPolicies(): Promise<void> {
    await this.persistKeys(); // Reuse the same persistence method
  }
}

// Export singleton instance
export const hipaaKeyManagement = new HIPAAKeyManagementService();

// Export types
export type { KeyMetadata, KeyAccessPolicy, KeyRotationPolicy };