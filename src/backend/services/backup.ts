import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import zlib from 'zlib';
import crypto from 'crypto';

const pipelineAsync = promisify(pipeline);

interface BackupOptions {
  type: 'user_data' | 'system' | 'analytics' | 'full';
  userId?: string;
  compression?: boolean;
  encryption?: boolean;
  excludePatterns?: string[];
  includeMetadata?: boolean;
}

interface BackupResult {
  success: boolean;
  backupId: string;
  filename: string;
  size: number;
  checksum: string;
  duration: number;
  itemsBackedUp: number;
  error?: string;
}

interface RestoreOptions {
  backupPath: string;
  targetLocation?: string;
  overwrite?: boolean;
  validateChecksum?: boolean;
  selectiveRestore?: {
    userData?: boolean;
    analytics?: boolean;
    system?: boolean;
  };
}

interface RestoreResult {
  success: boolean;
  itemsRestored: number;
  duration: number;
  warnings: string[];
  error?: string;
}

class BackupService {
  private backupDirectory: string;
  private encryptionKey: string;
  private maxBackupRetention: number = 30; // days

  constructor() {
    this.backupDirectory = process.env.BACKUP_DIR || '/tmp/backups';
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || 'default-backup-key-change-in-production';
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }

  async createBackup(options: BackupOptions): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = this.generateBackupId();
    const filename = this.generateBackupFilename(options.type, options.userId, new Date());
    const backupPath = path.join(this.backupDirectory, filename);

    try {
      console.log(`Starting backup: ${backupId} (${options.type})`);

      // Collect data based on backup type
      const backupData = await this.collectBackupData(options);
      
      // Serialize data
      const serializedData = JSON.stringify(backupData, null, options.includeMetadata ? 2 : 0);
      
      // Create backup file
      let finalData = serializedData;
      
      // Apply compression if requested
      if (options.compression !== false) {
        finalData = await this.compressData(serializedData);
      }

      // Apply encryption if requested
      if (options.encryption) {
        finalData = await this.encryptData(finalData);
      }

      // Write to file
      await fs.promises.writeFile(backupPath, finalData);

      // Calculate file size and checksum
      const stats = await fs.promises.stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      const duration = Date.now() - startTime;

      console.log(`Backup completed: ${backupId} (${stats.size} bytes, ${duration}ms)`);

      return {
        success: true,
        backupId,
        filename,
        size: stats.size,
        checksum,
        duration,
        itemsBackedUp: this.countBackupItems(backupData)
      };

    } catch (error) {
      console.error(`Backup failed: ${backupId}`, error);
      
      // Clean up failed backup file
      try {
        if (fs.existsSync(backupPath)) {
          await fs.promises.unlink(backupPath);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up backup file:', cleanupError);
      }

      return {
        success: false,
        backupId,
        filename,
        size: 0,
        checksum: '',
        duration: Date.now() - startTime,
        itemsBackedUp: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async restoreFromBackup(backupPath: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      console.log(`Starting restore from: ${backupPath}`);

      // Verify backup file exists
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file does not exist');
      }

      // Validate checksum if requested
      if (options.validateChecksum) {
        // This would require storing checksums separately or in filename
        warnings.push('Checksum validation skipped - not implemented');
      }

      // Read backup file
      let backupData = await fs.promises.readFile(backupPath, 'utf8');

      // Decrypt if needed (detect by file format or header)
      if (this.isEncrypted(backupData)) {
        backupData = await this.decryptData(backupData);
      }

      // Decompress if needed
      if (this.isCompressed(backupData)) {
        backupData = await this.decompressData(backupData);
      }

      // Parse JSON data
      const parsedData = JSON.parse(backupData);

      // Validate backup format
      this.validateBackupFormat(parsedData);

      // Perform selective restore
      const restoredItems = await this.performRestore(parsedData, options);

      const duration = Date.now() - startTime;

      console.log(`Restore completed: ${restoredItems} items restored in ${duration}ms`);

      return {
        success: true,
        itemsRestored: restoredItems,
        duration,
        warnings
      };

    } catch (error) {
      console.error('Restore failed:', error);

      return {
        success: false,
        itemsRestored: 0,
        duration: Date.now() - startTime,
        warnings,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async collectBackupData(options: BackupOptions): Promise<any> {
    const backupData: any = {
      metadata: {
        type: options.type,
        userId: options.userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    switch (options.type) {
      case 'user_data':
        backupData.userData = await this.collectUserData(options.userId);
        break;
        
      case 'analytics':
        backupData.analytics = await this.collectAnalyticsData();
        break;
        
      case 'system':
        backupData.system = await this.collectSystemData();
        break;
        
      case 'full':
        backupData.userData = await this.collectUserData(options.userId);
        backupData.analytics = await this.collectAnalyticsData();
        backupData.system = await this.collectSystemData();
        break;
    }

    return backupData;
  }

  private async collectUserData(userId?: string): Promise<any> {
    // In a real implementation, this would query the database
    const userData = {
      profiles: userId ? [{ id: userId, name: 'User Profile' }] : [],
      moodEntries: [],
      journalEntries: [],
      appointments: [],
      medications: [],
      preferences: {},
      safetyPlans: {},
      emergencyContacts: []
    };

    return userData;
  }

  private async collectAnalyticsData(): Promise<any> {
    const analyticsData = {
      events: [],
      metrics: {},
      reports: [],
      aggregations: {}
    };

    return analyticsData;
  }

  private async collectSystemData(): Promise<any> {
    const systemData = {
      configuration: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },
      logs: [], // Would collect recent logs
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      healthChecks: {}
    };

    return systemData;
  }

  private async performRestore(backupData: any, options: RestoreOptions): Promise<number> {
    let itemsRestored = 0;

    const selectiveRestore = options.selectiveRestore;

    // Restore user data
    if (backupData.userData && (!selectiveRestore || selectiveRestore.userData)) {
      itemsRestored += await this.restoreUserData(backupData.userData);
    }

    // Restore analytics data
    if (backupData.analytics && (!selectiveRestore || selectiveRestore.analytics)) {
      itemsRestored += await this.restoreAnalyticsData(backupData.analytics);
    }

    // Restore system data
    if (backupData.system && (!selectiveRestore || selectiveRestore.system)) {
      itemsRestored += await this.restoreSystemData(backupData.system);
    }

    return itemsRestored;
  }

  private async restoreUserData(userData: any): Promise<number> {
    let restored = 0;

    // Restore user profiles
    if (userData.profiles && Array.isArray(userData.profiles)) {
      for (const profile of userData.profiles) {
        // In real implementation, would insert into database
        console.log(`Restored user profile: ${profile.id}`);
        restored++;
      }
    }

    // Restore mood entries
    if (userData.moodEntries && Array.isArray(userData.moodEntries)) {
      restored += userData.moodEntries.length;
    }

    // Restore journal entries
    if (userData.journalEntries && Array.isArray(userData.journalEntries)) {
      restored += userData.journalEntries.length;
    }

    return restored;
  }

  private async restoreAnalyticsData(analyticsData: any): Promise<number> {
    let restored = 0;

    if (analyticsData.events && Array.isArray(analyticsData.events)) {
      restored += analyticsData.events.length;
    }

    if (analyticsData.reports && Array.isArray(analyticsData.reports)) {
      restored += analyticsData.reports.length;
    }

    return restored;
  }

  private async restoreSystemData(systemData: any): Promise<number> {
    let restored = 0;

    if (systemData.configuration) {
      // Restore configuration (would be more selective in production)
      console.log('System configuration restore completed');
      restored++;
    }

    return restored;
  }

  private async compressData(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data), (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed.toString('base64'));
      });
    });
  }

  private async decompressData(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(data, 'base64');
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString());
      });
    });
  }

  private async encryptData(data: string): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private async decryptData(encryptedData: string): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private isCompressed(data: string): boolean {
    // Simple heuristic - check if data looks like base64
    return /^[A-Za-z0-9+/]+=*$/.test(data) && data.length > 100;
  }

  private isEncrypted(data: string): boolean {
    // Simple heuristic - check if data contains ':' separator from encryption format
    return data.includes(':') && !data.startsWith('{');
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private validateBackupFormat(data: any): void {
    if (!data.metadata) {
      throw new Error('Invalid backup format: missing metadata');
    }

    if (!data.metadata.type || !data.metadata.timestamp) {
      throw new Error('Invalid backup format: incomplete metadata');
    }

    // Additional format validations could go here
  }

  private countBackupItems(data: any): number {
    let count = 0;

    if (data.userData) {
      count += (data.userData.profiles || []).length;
      count += (data.userData.moodEntries || []).length;
      count += (data.userData.journalEntries || []).length;
      count += (data.userData.appointments || []).length;
    }

    if (data.analytics) {
      count += (data.analytics.events || []).length;
      count += (data.analytics.reports || []).length;
    }

    if (data.system) {
      count += Object.keys(data.system).length;
    }

    return count;
  }

  private generateBackupId(): string {
    return 'backup_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private generateBackupFilename(type: string, userId?: string, timestamp: Date = new Date()): string {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    const userPart = userId ? `_${userId}` : '';
    
    return `${type}${userPart}_${dateStr}_${timeStr}.backup`;
  }

  async listBackups(): Promise<Array<{
    filename: string;
    size: number;
    created: Date;
    type?: string;
  }>> {
    try {
      const files = await fs.promises.readdir(this.backupDirectory);
      const backupFiles = files.filter(file => file.endsWith('.backup'));

      const backups = await Promise.all(
        backupFiles.map(async (filename) => {
          const filePath = path.join(this.backupDirectory, filename);
          const stats = await fs.promises.stat(filePath);
          
          // Extract type from filename
          const type = filename.split('_')[0];
          
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            type
          };
        })
      );

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.backupDirectory, filename);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }

      await fs.promises.unlink(filePath);
      console.log(`Deleted backup: ${filename}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete backup ${filename}:`, error);
      return false;
    }
  }

  async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.maxBackupRetention);

      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          const success = await this.deleteBackup(backup.filename);
          if (success) {
            deletedCount++;
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old backups`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return 0;
    }
  }

  getBackupDirectory(): string {
    return this.backupDirectory;
  }

  setMaxRetention(days: number): void {
    this.maxBackupRetention = days;
  }

  async getBackupInfo(filename: string): Promise<any | null> {
    try {
      const filePath = path.join(this.backupDirectory, filename);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = await fs.promises.stat(filePath);
      
      // Try to read metadata from backup
      let metadata = null;
      try {
        let data = await fs.promises.readFile(filePath, 'utf8');
        
        if (this.isEncrypted(data)) {
          data = await this.decryptData(data);
        }
        
        if (this.isCompressed(data)) {
          data = await this.decompressData(data);
        }
        
        const backupData = JSON.parse(data);
        metadata = backupData.metadata;
      } catch (error) {
        console.warn(`Failed to read metadata from ${filename}:`, error);
      }

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        metadata
      };
    } catch (error) {
      console.error(`Failed to get backup info for ${filename}:`, error);
      return null;
    }
  }
}

// Create singleton instance
export const backupService = new BackupService();

export default backupService;