/**
 * Secure Storage Service
 *
 * Provides a drop-in replacement for localStorage with automatic encryption,
 * HIPAA compliance, audit logging, and data retention management for the
 * mental health platform. Ensures sensitive user data is protected.
 *
 * @fileoverview Secure storage wrapper with encryption and compliance features
 * @version 2.0.0
 */

import { encryptionService } from './encryptionService';

/**
 * Configuration options for secure storage
 */
export interface SecureStorageOptions {
  enableEncryption?: boolean;
  enableAuditLogging?: boolean;
  enableDataRetention?: boolean;
  maxRetentionDays?: number;
  compressionLevel?: number;
}

/**
 * Metadata stored with each item
 */
export interface StorageMetadata {
  timestamp: number;
  classification: string;
  encrypted: boolean;
  size: number;
  accessCount: number;
  lastAccessed: number;
  expiresAt?: number;
  version: string;
}

/**
 * Storage item with metadata
 */
export interface SecureStorageItem {
  key: string;
  value: any;
  metadata: StorageMetadata;
}

/**
 * Audit log entry for compliance tracking
 */
export interface AuditLogEntry {
  timestamp: number;
  action: 'read' | 'write' | 'delete' | 'expire';
  key: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

/**
 * Storage statistics and quota information
 */
export interface StorageStats {
  totalItems: number;
  totalSize: number;
  encryptedItems: number;
  unencryptedItems: number;
  expiredItems: number;
  quotaUsed: number;
  quotaRemaining: number;
  oldestItem?: Date;
  newestItem?: Date;
}

/**
 * Data classification levels for HIPAA compliance
 */
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

/**
 * Secure Storage Service Implementation
 */
export class SecureStorageService {
  private encryptionService = getEncryptionService();
  private options: SecureStorageOptions;
  private auditLog: AuditLogEntry[] = [];
  private readonly METADATA_PREFIX = '__secure_meta_';
  private readonly AUDIT_LOG_KEY = '__secure_audit_log';
  private readonly VERSION = '2.0.0';

  constructor(options: SecureStorageOptions = {}) {
    this.options = {
      enableEncryption: true,
      enableAuditLogging: true,
      enableDataRetention: true,
      maxRetentionDays: 365,
      compressionLevel: 1,
      ...options
    };

    // Load existing audit log
    this.loadAuditLog();
    
    // Clean up expired items on initialization
    this.cleanupExpiredItems();
  }

  /**
   * Store an item with optional encryption and metadata
   */
  async setItem(
    key: string, 
    value: any, 
    classification: DataClassification = DataClassification.INTERNAL,
    expiresInDays?: number
  ): Promise<void> {
    try {
      const shouldEncrypt = this.options.enableEncryption && 
        (classification === DataClassification.CONFIDENTIAL || 
         classification === DataClassification.RESTRICTED);

      let processedValue = value;
      
      // Serialize value
      const serializedValue = JSON.stringify(value);
      
      // Encrypt if required
      if (shouldEncrypt) {
        processedValue = await this.encryptionService.encrypt(serializedValue);
      } else {
        processedValue = serializedValue;
      }

      // Create metadata
      const metadata: StorageMetadata = {
        timestamp: Date.now(),
        classification,
        encrypted: shouldEncrypt,
        size: new Blob([processedValue]).size,
        accessCount: 0,
        lastAccessed: Date.now(),
        version: this.VERSION,
        expiresAt: expiresInDays ? Date.now() + (expiresInDays * 24 * 60 * 60 * 1000) : undefined
      };

      // Store the item and metadata
      localStorage.setItem(key, processedValue);
      localStorage.setItem(this.METADATA_PREFIX + key, JSON.stringify(metadata));

      // Log the action
      this.logAction('write', key, true);

    } catch (error) {
      this.logAction('write', key, false, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to store item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve an item with automatic decryption
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const rawValue = localStorage.getItem(key);
      if (!rawValue) {
        return null;
      }

      const metadata = this.getMetadata(key);
      if (!metadata) {
        // Handle legacy items without metadata
        this.logAction('read', key, true);
        return JSON.parse(rawValue);
      }

      // Check if item has expired
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        await this.removeItem(key);
        return null;
      }

      // Update access tracking
      metadata.accessCount++;
      metadata.lastAccessed = Date.now();
      this.updateMetadata(key, metadata);

      let processedValue = rawValue;

      // Decrypt if encrypted
      if (metadata.encrypted) {
        processedValue = await this.encryptionService.decrypt(rawValue);
      }

      // Parse and return
      const result = JSON.parse(processedValue);
      this.logAction('read', key, true);
      return result;

    } catch (error) {
      this.logAction('read', key, false, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to retrieve item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove an item and its metadata
   */
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(this.METADATA_PREFIX + key);
      this.logAction('delete', key, true);
    } catch (error) {
      this.logAction('delete', key, false, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to remove item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if an item exists
   */
  hasItem(key: string): boolean {
    const item = localStorage.getItem(key);
    if (!item) return false;

    const metadata = this.getMetadata(key);
    if (metadata?.expiresAt && Date.now() > metadata.expiresAt) {
      // Item has expired
      this.removeItem(key);
      return false;
    }

    return true;
  }

  /**
   * Get all keys (excluding metadata keys)
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith(this.METADATA_PREFIX) && key !== this.AUDIT_LOG_KEY) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const keys = this.getAllKeys();
    let totalSize = 0;
    let encryptedItems = 0;
    let unencryptedItems = 0;
    let expiredItems = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    for (const key of keys) {
      const metadata = this.getMetadata(key);
      if (metadata) {
        totalSize += metadata.size;
        
        if (metadata.encrypted) {
          encryptedItems++;
        } else {
          unencryptedItems++;
        }

        if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
          expiredItems++;
        }

        if (metadata.timestamp < oldestTimestamp) {
          oldestTimestamp = metadata.timestamp;
        }
        if (metadata.timestamp > newestTimestamp) {
          newestTimestamp = metadata.timestamp;
        }
      }
    }

    // Get quota information
    const quota = await navigator.storage?.estimate() || { usage: 0, quota: 0 };

    return {
      totalItems: keys.length,
      totalSize,
      encryptedItems,
      unencryptedItems,
      expiredItems,
      quotaUsed: quota.usage || 0,
      quotaRemaining: (quota.quota || 0) - (quota.usage || 0),
      oldestItem: oldestTimestamp < Date.now() ? new Date(oldestTimestamp) : undefined,
      newestItem: newestTimestamp > 0 ? new Date(newestTimestamp) : undefined
    };
  }

  /**
   * Clean up expired items
   */
  async cleanupExpiredItems(): Promise<number> {
    const keys = this.getAllKeys();
    let cleanedCount = 0;

    for (const key of keys) {
      const metadata = this.getMetadata(key);
      if (metadata?.expiresAt && Date.now() > metadata.expiresAt) {
        await this.removeItem(key);
        this.logAction('expire', key, true);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clean up items older than retention period
   */
  async cleanupByRetention(): Promise<number> {
    if (!this.options.enableDataRetention || !this.options.maxRetentionDays) {
      return 0;
    }

    const keys = this.getAllKeys();
    const retentionCutoff = Date.now() - (this.options.maxRetentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const key of keys) {
      const metadata = this.getMetadata(key);
      if (metadata && metadata.timestamp < retentionCutoff) {
        await this.removeItem(key);
        this.logAction('expire', key, true);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Export all data for backup or migration
   */
  async exportData(): Promise<SecureStorageItem[]> {
    const keys = this.getAllKeys();
    const items: SecureStorageItem[] = [];

    for (const key of keys) {
      const value = await this.getItem(key);
      const metadata = this.getMetadata(key);
      
      if (value !== null && metadata) {
        items.push({
          key,
          value,
          metadata
        });
      }
    }

    return items;
  }

  /**
   * Import data from backup
   */
  async importData(items: SecureStorageItem[]): Promise<void> {
    for (const item of items) {
      await this.setItem(
        item.key, 
        item.value, 
        item.metadata.classification as DataClassification,
        item.metadata.expiresAt ? Math.ceil((item.metadata.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)) : undefined
      );
    }
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    const keys = this.getAllKeys();
    
    for (const key of keys) {
      await this.removeItem(key);
    }

    // Clear audit log
    localStorage.removeItem(this.AUDIT_LOG_KEY);
    this.auditLog = [];
  }

  /**
   * Get audit log entries
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Export audit log for compliance reporting
   */
  exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }

  /**
   * Get metadata for a key
   */
  private getMetadata(key: string): StorageMetadata | null {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_PREFIX + key);
      return metadataJson ? JSON.parse(metadataJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update metadata for a key
   */
  private updateMetadata(key: string, metadata: StorageMetadata): void {
    localStorage.setItem(this.METADATA_PREFIX + key, JSON.stringify(metadata));
  }

  /**
   * Log an action for audit purposes
   */
  private logAction(action: AuditLogEntry['action'], key: string, success: boolean, error?: string): void {
    if (!this.options.enableAuditLogging) return;

    const entry: AuditLogEntry = {
      timestamp: Date.now(),
      action,
      key,
      success,
      error
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries to prevent unbounded growth
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Persist audit log
    this.saveAuditLog();
  }

  /**
   * Load audit log from storage
   */
  private loadAuditLog(): void {
    try {
      const auditLogJson = localStorage.getItem(this.AUDIT_LOG_KEY);
      if (auditLogJson) {
        this.auditLog = JSON.parse(auditLogJson);
      }
    } catch {
      this.auditLog = [];
    }
  }

  /**
   * Save audit log to storage
   */
  private saveAuditLog(): void {
    try {
      localStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(this.auditLog));
    } catch {
      // Handle quota exceeded or other storage errors
      console.warn('Failed to save audit log');
    }
  }
}

// Create and export singleton instance
export const secureStorage = new SecureStorageService();

// Export convenience methods
export const setSecureItem = (key: string, value: any, classification?: DataClassification, expiresInDays?: number) =>
  secureStorage.setItem(key, value, classification, expiresInDays);

export const getSecureItem = <T = any>(key: string) => secureStorage.getItem<T>(key);

export const removeSecureItem = (key: string) => secureStorage.removeItem(key);

export const hasSecureItem = (key: string) => secureStorage.hasItem(key);

export default secureStorage;
