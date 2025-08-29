/**
 * Tether Sync Service
 *
 * Handles real-time data synchronization between tethered users with different
 * permission levels and selective data sharing capabilities.
 *
 * Features:
 * - Real-time bidirectional synchronization
 * - Granular permission system with role-based access
 * - Selective data sharing with privacy controls
 * - Conflict resolution and data integrity
 * - Emergency priority handling
 * - Offline queue with retry logic
 * - End-to-end encryption for sensitive data
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { astralCoreWebSocketService, MessageType, MessagePriority } from './astralCoreWebSocketService';
import { astralCoreNotificationService, NotificationType, NotificationPriority } from './astralCoreNotificationService';
import { SecureStorageService } from './secureStorageService';
import { SecurityService } from './securityService';

// Create service instances
const secureStorageService = new SecureStorageService();
const securityService = new SecurityService();

// Sync Data Interface
export interface SyncData {
  userId: string;
  timestamp: number;
  dataType: 'mood' | 'crisis' | 'progress' | 'location' | 'presence' | 'vitals' | 'contacts' | 'safety_plan';
  data: any;
  confidenceLevel?: number; // 0-1 for data reliability
  isEmergency?: boolean;
  encrypted?: boolean;
  checksum?: string;
}

// Sync Permission Interface
export interface SyncPermission {
  userId: string;
  tetherSessionId: string;
  dataTypes: string[];
  strengthLevel: 'view-only' | 'support' | 'full-sync';
  expiration?: number;
  isTemporary: boolean;
  anonymized: boolean;
  restrictions?: {
    locationPrecision?: 'exact' | 'city' | 'region';
    moodDetail?: 'basic' | 'detailed' | 'full';
    vitalsSensitivity?: 'low' | 'medium' | 'high';
  };
  createdAt: Date;
  lastUsed?: Date;
}

// Sync Conflict Resolution Interface
export interface SyncConflictResolution {
  strategy: 'latest-wins' | 'merge' | 'user-choice' | 'emergency-priority';
  mergeFunctions?: {
    [dataType: string]: (oldData: any, newData: any) => any;
  };
}

// Sync Queue Item Interface
export interface SyncQueueItem {
  id: string;
  targetUserId: string;
  syncData: SyncData;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attempts: number;
  maxAttempts: number;
  nextRetry: number;
  permissions: SyncPermission;
  createdAt: Date;
}

// Data Integrity Check Interface
export interface DataIntegrityCheck {
  checksum: string;
  validator: (data: any) => boolean;
  sanitizer: (data: any) => any;
  encryptionRequired: boolean;
}

// Tether Session Interface
export interface TetherSession {
  id: string;
  initiatorId: string;
  targetId: string;
  type: 'peer' | 'family' | 'professional' | 'emergency';
  status: 'pending' | 'active' | 'paused' | 'terminated';
  permissions: SyncPermission[];
  createdAt: Date;
  lastActivity: Date;
  metadata: {
    relationship?: string;
    emergencyContact?: boolean;
    notificationPreferences?: {
      crisis: boolean;
      mood: boolean;
      progress: boolean;
    };
  };
}

// Sync Statistics Interface
export interface SyncStatistics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  pendingItems: number;
  averageSyncTime: number;
  lastSyncTime: Date | null;
  activeConnections: number;
  dataTypesSync: Record<string, number>;
}

// Main Service Interface
export interface TetherSyncService {
  // Data Synchronization
  syncData(
    targetUserId: string,
    dataType: SyncData['dataType'],
    data: any,
    options?: {
      priority?: SyncQueueItem['priority'];
      isEmergency?: boolean;
      confidenceLevel?: number;
      encrypt?: boolean;
    }
  ): Promise<boolean>;

  // Permission Management
  grantSyncPermission(
    targetUserId: string,
    tetherSessionId: string,
    dataTypes: string[],
    strengthLevel: SyncPermission['strengthLevel'],
    options?: {
      isTemporary?: boolean;
      expiration?: number;
      anonymized?: boolean;
      restrictions?: SyncPermission['restrictions'];
    }
  ): Promise<boolean>;

  revokeSyncPermission(targetUserId: string, tetherSessionId: string): Promise<boolean>;

  // Tether Session Management
  createTetherSession(
    targetUserId: string,
    type: TetherSession['type'],
    metadata?: TetherSession['metadata']
  ): Promise<string>;

  acceptTetherSession(sessionId: string): Promise<boolean>;
  terminateTetherSession(sessionId: string): Promise<boolean>;

  // Data Access
  getSyncHistory(userId: string, dataType?: string): SyncData[];
  getLastSyncTimestamp(userId: string): number | undefined;
  getSyncPermissions(userId?: string): SyncPermission[];
  getTetherSessions(userId?: string): TetherSession[];

  // Statistics and Monitoring
  getStatistics(): SyncStatistics;
  getQueueStatus(): { pending: number; processing: number; failed: number };

  // Service Management
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

// Default Configuration
const DEFAULT_CONFIG = {
  maxRetries: 3,
  baseRetryDelay: 1000,
  maxRetryDelay: 30000,
  syncInterval: 5000,
  queueMaxSize: 1000,
  sessionTimeout: 3600000, // 1 hour
  encryptSensitiveData: true,
  enableConflictResolution: true
};

// Data Type Configurations
const DATA_TYPE_CONFIG: Record<string, DataIntegrityCheck> = {
  mood: {
    checksum: '',
    validator: (data) => typeof data === 'object' && data.primary && typeof data.intensity === 'number',
    sanitizer: (data) => ({
      primary: String(data.primary || 'neutral'),
      secondary: data.secondary ? String(data.secondary) : undefined,
      intensity: Math.max(0, Math.min(10, Number(data.intensity) || 5)),
      notes: data.notes ? String(data.notes).substring(0, 500) : undefined,
      timestamp: data.timestamp || Date.now()
    }),
    encryptionRequired: false
  },
  crisis: {
    checksum: '',
    validator: (data) => typeof data === 'object' && data.level && data.timestamp,
    sanitizer: (data) => ({
      level: String(data.level || 'low'),
      type: String(data.type || 'general'),
      description: data.description ? String(data.description).substring(0, 1000) : undefined,
      location: data.location,
      timestamp: Number(data.timestamp) || Date.now(),
      resolved: Boolean(data.resolved)
    }),
    encryptionRequired: true
  },
  vitals: {
    checksum: '',
    validator: (data) => typeof data === 'object' && data.timestamp,
    sanitizer: (data) => ({
      heartRate: data.heartRate ? Math.max(30, Math.min(220, Number(data.heartRate))) : undefined,
      bloodPressure: data.bloodPressure,
      temperature: data.temperature ? Math.max(90, Math.min(110, Number(data.temperature))) : undefined,
      timestamp: Number(data.timestamp) || Date.now()
    }),
    encryptionRequired: true
  },
  location: {
    checksum: '',
    validator: (data) => typeof data === 'object' && data.latitude && data.longitude,
    sanitizer: (data) => ({
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      accuracy: data.accuracy ? Number(data.accuracy) : undefined,
      timestamp: Number(data.timestamp) || Date.now()
    }),
    encryptionRequired: true
  },
  progress: {
    checksum: '',
    validator: (data) => typeof data === 'object' && data.metric,
    sanitizer: (data) => ({
      metric: String(data.metric),
      value: Number(data.value) || 0,
      unit: data.unit ? String(data.unit) : undefined,
      notes: data.notes ? String(data.notes).substring(0, 500) : undefined,
      timestamp: Number(data.timestamp) || Date.now()
    }),
    encryptionRequired: false
  },
  presence: {
    checksum: '',
    validator: (data) => typeof data === 'object' && data.status,
    sanitizer: (data) => ({
      status: String(data.status),
      activity: data.activity ? String(data.activity) : undefined,
      lastSeen: Number(data.lastSeen) || Date.now(),
      timestamp: Number(data.timestamp) || Date.now()
    }),
    encryptionRequired: false
  },
  contacts: {
    checksum: '',
    validator: (data) => Array.isArray(data) || (typeof data === 'object' && data.name),
    sanitizer: (data) => {
      const contacts = Array.isArray(data) ? data : [data];
      return contacts.map(contact => ({
        name: String(contact.name || 'Unknown'),
        phone: contact.phone ? String(contact.phone) : undefined,
        email: contact.email ? String(contact.email) : undefined,
        relationship: contact.relationship ? String(contact.relationship) : undefined,
        emergency: Boolean(contact.emergency)
      }));
    },
    encryptionRequired: true
  },
  safety_plan: {
    checksum: '',
    validator: (data) => typeof data === 'object' && Array.isArray(data.warningSigns),
    sanitizer: (data) => ({
      warningSigns: Array.isArray(data.warningSigns) ? data.warningSigns.map(String) : [],
      copingStrategies: Array.isArray(data.copingStrategies) ? data.copingStrategies.map(String) : [],
      supportContacts: Array.isArray(data.supportContacts) ? data.supportContacts : [],
      professionalContacts: Array.isArray(data.professionalContacts) ? data.professionalContacts : [],
      lastUpdated: Number(data.lastUpdated) || Date.now()
    }),
    encryptionRequired: true
  }
};

// Implementation
class TetherSyncServiceImpl implements TetherSyncService {
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private permissions: Map<string, SyncPermission[]> = new Map();
  private syncHistory: Map<string, SyncData[]> = new Map();
  private tetherSessions: Map<string, TetherSession> = new Map();
  private conflictResolution: SyncConflictResolution;
  private isOnline = navigator.onLine;
  private syncInterval?: ReturnType<typeof setTimeout>;
  private currentUserId = 'current-user'; // Should be set by auth
  private encryptionKey?: string;
  private lastSyncTimestamp = new Map<string, number>();
  private statistics: SyncStatistics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingItems: 0,
    averageSyncTime: 0,
    lastSyncTime: null,
    activeConnections: 0,
    dataTypesSync: {}
  };
  private _isRunning = false;
  private emergencyProtocols: Map<string, any> = new Map();
  private crisisQueue: Map<string, any> = new Map();

  constructor() {
    this.conflictResolution = {
      strategy: 'emergency-priority',
      mergeFunctions: {
        mood: this.mergeMoodData.bind(this),
        progress: this.mergeProgressData.bind(this),
        vitals: this.mergeVitalsData.bind(this)
      }
    };
  }

  async start(): Promise<void> {
    if (this._isRunning) return;

    try {
      await this.initializeService();
      this._isRunning = true;
      logger.info('Tether sync service started');
    } catch (error) {
      logger.error('Failed to start tether sync service', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this._isRunning) return;

    this._isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    // Save current state
    await this.saveState();
    
    logger.info('Tether sync service stopped');
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  async syncData(
    targetUserId: string,
    dataType: SyncData['dataType'],
    data: any,
    options: {
      priority?: SyncQueueItem['priority'];
      isEmergency?: boolean;
      confidenceLevel?: number;
      encrypt?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      // Check permissions
      const permission = this.getPermissionForUser(targetUserId, dataType);
      if (!permission) {
        throw new Error(`No permission to sync ${dataType} with user ${targetUserId}`);
      }

      // Validate and sanitize data
      const integrityCheck = this.getDataIntegrityCheck(dataType);
      const sanitizedData = integrityCheck.sanitizer(data);
      
      if (!integrityCheck.validator(sanitizedData)) {
        throw new Error(`Invalid data format for ${dataType}`);
      }

      // Create sync data
      const syncData: SyncData = {
        userId: this.currentUserId,
        timestamp: Date.now(),
        dataType,
        data: this.anonymizeDataIfNeeded(sanitizedData, permission),
        confidenceLevel: options.confidenceLevel || 1.0,
        isEmergency: options.isEmergency || false
      };

      // Encrypt if required or requested
      if ((integrityCheck.encryptionRequired || options.encrypt) && this.encryptionKey) {
        syncData.data = await securityService.encryptData(JSON.stringify(syncData.data));
        syncData.encrypted = true;
      }

      // Generate checksum
      syncData.checksum = await this.generateChecksum(syncData);

      // Add to sync queue
      const queueItem: SyncQueueItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        targetUserId,
        syncData,
        priority: options.priority || 'medium',
        attempts: 0,
        maxAttempts: options.isEmergency ? 5 : 3,
        nextRetry: Date.now(),
        permissions: permission,
        createdAt: new Date()
      };

      this.syncQueue.set(queueItem.id, queueItem);

      // Store in history
      this.addToSyncHistory(targetUserId, syncData);

      // Process immediately if online and high priority
      if (this.isOnline && (options.priority === 'high' || options.priority === 'critical')) {
        await this.processSyncItem(queueItem);
      }

      return true;
    } catch (error) {
      logger.error('Failed to sync data', { error, targetUserId, dataType });
      return false;
    }
  }

  async grantSyncPermission(
    targetUserId: string,
    tetherSessionId: string,
    dataTypes: string[],
    strengthLevel: SyncPermission['strengthLevel'],
    options: {
      isTemporary?: boolean;
      expiration?: number;
      anonymized?: boolean;
      restrictions?: SyncPermission['restrictions'];
    } = {}
  ): Promise<boolean> {
    try {
      const permission: SyncPermission = {
        userId: targetUserId,
        tetherSessionId,
        dataTypes,
        strengthLevel,
        expiration: options.expiration,
        isTemporary: options.isTemporary || false,
        anonymized: options.anonymized || false,
        restrictions: options.restrictions,
        createdAt: new Date()
      };

      // Validate strength level permissions
      const allowedDataTypes = this.getDataTypesForStrengthLevel(strengthLevel);
      const invalidTypes = dataTypes.filter(type => !allowedDataTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        throw new Error(`Data types ${invalidTypes.join(', ')} not allowed for strength level ${strengthLevel}`);
      }

      // Store permission
      if (!this.permissions.has(this.currentUserId)) {
        this.permissions.set(this.currentUserId, []);
      }

      const userPermissions = this.permissions.get(this.currentUserId)!;
      const existingIndex = userPermissions.findIndex(p => 
        p.userId === targetUserId && p.tetherSessionId === tetherSessionId
      );

      if (existingIndex >= 0) {
        userPermissions[existingIndex] = permission;
      } else {
        userPermissions.push(permission);
      }

      await this.savePermissions();

      // Notify target user
      await astralCoreWebSocketService.sendMessage(
        MessageType.SYSTEM_NOTIFICATION,
        {
          type: 'sync-permission-granted',
          fromUserId: this.currentUserId,
          toUserId: targetUserId,
          permission
        },
        MessagePriority.HIGH
      );

      return true;
    } catch (error) {
      logger.error('Failed to grant sync permission', { error, targetUserId, tetherSessionId });
      return false;
    }
  }

  async revokeSyncPermission(targetUserId: string, tetherSessionId: string): Promise<boolean> {
    try {
      const userPermissions = this.permissions.get(this.currentUserId) || [];
      const filteredPermissions = userPermissions.filter(p => 
        !(p.userId === targetUserId && p.tetherSessionId === tetherSessionId)
      );
      
      this.permissions.set(this.currentUserId, filteredPermissions);
      await this.savePermissions();

      // Notify target user
      await astralCoreWebSocketService.sendMessage(
        MessageType.SYSTEM_NOTIFICATION,
        {
          type: 'sync-permission-revoked',
          fromUserId: this.currentUserId,
          toUserId: targetUserId,
          tetherSessionId
        },
        MessagePriority.HIGH
      );

      return true;
    } catch (error) {
      logger.error('Failed to revoke sync permission', { error, targetUserId, tetherSessionId });
      return false;
    }
  }

  async createTetherSession(
    targetUserId: string,
    type: TetherSession['type'],
    metadata: TetherSession['metadata'] = {}
  ): Promise<string> {
    try {
      const sessionId = `tether-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const session: TetherSession = {
        id: sessionId,
        initiatorId: this.currentUserId,
        targetId: targetUserId,
        type,
        status: 'pending',
        permissions: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata
      };

      this.tetherSessions.set(sessionId, session);
      await this.saveTetherSessions();

      // Notify target user
      await astralCoreNotificationService.sendNotification({
        type: NotificationType.SUPPORT_REQUEST,
        title: 'Tether Connection Request',
        message: `${this.currentUserId} wants to connect with you for ${type} support`,
        priority: NotificationPriority.HIGH,
        data: { sessionId, type, initiatorId: this.currentUserId }
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to create tether session', { error, targetUserId, type });
      throw error;
    }
  }

  async acceptTetherSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.tetherSessions.get(sessionId);
      if (!session) {
        throw new Error('Tether session not found');
      }

      if (session.targetId !== this.currentUserId) {
        throw new Error('Not authorized to accept this session');
      }

      session.status = 'active';
      session.lastActivity = new Date();

      this.tetherSessions.set(sessionId, session);
      await this.saveTetherSessions();

      // Notify initiator
      await astralCoreNotificationService.sendNotification({
        type: NotificationType.SYSTEM_UPDATE,
        title: 'Tether Connection Accepted',
        message: `Your tether connection request has been accepted`,
        priority: NotificationPriority.MEDIUM,
        data: { sessionId, acceptedBy: this.currentUserId }
      });

      return true;
    } catch (error) {
      logger.error('Failed to accept tether session', { error, sessionId });
      return false;
    }
  }

  async terminateTetherSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.tetherSessions.get(sessionId);
      if (!session) {
        return false;
      }

      if (session.initiatorId !== this.currentUserId && session.targetId !== this.currentUserId) {
        throw new Error('Not authorized to terminate this session');
      }

      session.status = 'terminated';
      session.lastActivity = new Date();

      this.tetherSessions.set(sessionId, session);
      await this.saveTetherSessions();

      // Revoke all permissions for this session
      const userPermissions = this.permissions.get(this.currentUserId) || [];
      const filteredPermissions = userPermissions.filter(p => p.tetherSessionId !== sessionId);
      this.permissions.set(this.currentUserId, filteredPermissions);
      await this.savePermissions();

      return true;
    } catch (error) {
      logger.error('Failed to terminate tether session', { error, sessionId });
      return false;
    }
  }

  getSyncHistory(userId: string, dataType?: string): SyncData[] {
    const history = this.syncHistory.get(userId) || [];
    if (dataType) {
      return history.filter(item => item.dataType === dataType);
    }
    return history;
  }

  getLastSyncTimestamp(userId: string): number | undefined {
    return this.lastSyncTimestamp.get(userId);
  }

  getSyncPermissions(userId?: string): SyncPermission[] {
    if (userId) {
      const userPermissions = this.permissions.get(this.currentUserId) || [];
      return userPermissions.filter(p => p.userId === userId);
    }
    
    const allPermissions: SyncPermission[] = [];
    this.permissions.forEach(permissions => {
      allPermissions.push(...permissions);
    });
    return allPermissions;
  }

  getTetherSessions(userId?: string): TetherSession[] {
    const sessions = Array.from(this.tetherSessions.values());
    if (userId) {
      return sessions.filter(s => s.initiatorId === userId || s.targetId === userId);
    }
    return sessions.filter(s => 
      s.initiatorId === this.currentUserId || s.targetId === this.currentUserId
    );
  }

  getStatistics(): SyncStatistics {
    this.statistics.pendingItems = this.syncQueue.size;
    this.statistics.activeConnections = this.getTetherSessions().filter(s => s.status === 'active').length;
    return { ...this.statistics };
  }

  getQueueStatus(): { pending: number; processing: number; failed: number } {
    const items = Array.from(this.syncQueue.values());
    return {
      pending: items.filter(item => item.attempts === 0).length,
      processing: items.filter(item => item.attempts > 0 && item.attempts < item.maxAttempts).length,
      failed: items.filter(item => item.attempts >= item.maxAttempts).length
    };
  }

  // Private helper methods
  private async initializeService(): Promise<void> {
    await this.loadSyncHistory();
    await this.loadPermissions();
    await this.loadTetherSessions();
    await this.initializeEncryption();
    this.setupWebSocketListeners();
    this.setupOfflineHandling();
    this.startSyncQueue();
  }

  private async loadSyncHistory(): Promise<void> {
    try {
      const historyData = await secureStorageService.getItem('sync-history');
      if (historyData) {
        const parsed = JSON.parse(historyData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.syncHistory.set(key, value as SyncData[]);
        });
      }
    } catch (error) {
      logger.error('Failed to load sync history', { error });
    }
  }

  private async loadPermissions(): Promise<void> {
    try {
      const permissionsData = await secureStorageService.getItem('sync-permissions');
      if (permissionsData) {
        const parsed = JSON.parse(permissionsData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.permissions.set(key, value as SyncPermission[]);
        });
      }
    } catch (error) {
      logger.error('Failed to load permissions', { error });
    }
  }

  private async loadTetherSessions(): Promise<void> {
    try {
      const sessionsData = await secureStorageService.getItem('tether-sessions');
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData);
        Object.entries(parsed).forEach(([key, value]) => {
          const session = value as TetherSession;
          session.createdAt = new Date(session.createdAt);
          session.lastActivity = new Date(session.lastActivity);
          this.tetherSessions.set(key, session);
        });
      }
    } catch (error) {
      logger.error('Failed to load tether sessions', { error });
    }
  }

  private async saveState(): Promise<void> {
    await Promise.all([
      this.saveSyncHistory(),
      this.savePermissions(),
      this.saveTetherSessions()
    ]);
  }

  private async saveSyncHistory(): Promise<void> {
    try {
      const historyObj = Object.fromEntries(this.syncHistory.entries());
      await secureStorageService.setItem('sync-history', JSON.stringify(historyObj));
    } catch (error) {
      logger.error('Failed to save sync history', { error });
    }
  }

  private async savePermissions(): Promise<void> {
    try {
      const permissionsObj = Object.fromEntries(this.permissions.entries());
      await secureStorageService.setItem('sync-permissions', JSON.stringify(permissionsObj));
    } catch (error) {
      logger.error('Failed to save permissions', { error });
    }
  }

  private async saveTetherSessions(): Promise<void> {
    try {
      const sessionsObj = Object.fromEntries(this.tetherSessions.entries());
      await secureStorageService.setItem('tether-sessions', JSON.stringify(sessionsObj));
    } catch (error) {
      logger.error('Failed to save tether sessions', { error });
    }
  }

  private async initializeEncryption(): Promise<void> {
    try {
      let key = await secureStorageService.getItem('encryption-key');
      if (!key) {
        key = this.generateEncryptionKey();
        await secureStorageService.setItem('encryption-key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      logger.error('Failed to initialize encryption', { error });
    }
  }

  private generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private setupWebSocketListeners(): void {
    astralCoreWebSocketService.on('onMessage', this.handleIncomingSyncData.bind(this));
  }

  private setupOfflineHandling(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startSyncQueue(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
      this.cleanupExpiredPermissions();
      this.cleanupOldSyncHistory();
    }, DEFAULT_CONFIG.syncInterval);
  }

  private async processSyncQueue(): Promise<void> {
    const items = Array.from(this.syncQueue.values())
      .filter(item => item.nextRetry <= Date.now())
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

    for (const item of items.slice(0, 10)) { // Process max 10 items at once
      await this.processSyncItem(item);
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const startTime = performance.now();
    
    try {
      item.attempts++;
      
      // Send sync data via WebSocket
      await astralCoreWebSocketService.sendMessage(
        MessageType.SYSTEM_NOTIFICATION,
        {
          type: 'sync-data',
          fromUserId: this.currentUserId,
          toUserId: item.targetUserId,
          syncData: item.syncData
        },
        this.getPriorityFromSyncPriority(item.priority)
      );

      // Remove from queue on success
      this.syncQueue.delete(item.id);
      
      // Update statistics
      this.statistics.successfulSyncs++;
      this.statistics.totalSyncs++;
      this.statistics.lastSyncTime = new Date();
      
      const duration = performance.now() - startTime;
      this.statistics.averageSyncTime = (this.statistics.averageSyncTime + duration) / 2;
      
      // Update data type statistics
      const dataType = item.syncData.dataType;
      this.statistics.dataTypesSync[dataType] = (this.statistics.dataTypesSync[dataType] || 0) + 1;

    } catch (error) {
      logger.error('Failed to process sync item', { error, itemId: item.id });
      
      if (item.attempts >= item.maxAttempts) {
        // Remove failed item
        this.syncQueue.delete(item.id);
        this.statistics.failedSyncs++;
      } else {
        // Schedule retry with exponential backoff
        const delay = Math.min(
          DEFAULT_CONFIG.baseRetryDelay * Math.pow(2, item.attempts - 1),
          DEFAULT_CONFIG.maxRetryDelay
        );
        item.nextRetry = Date.now() + delay;
      }
      
      this.statistics.totalSyncs++;
    }
  }

  private handleIncomingSyncData(message: any): void {
    if (message.type === 'sync-data') {
      this.processIncomingSyncData(message.syncData, message.fromUserId);
    }
  }

  private async processIncomingSyncData(syncData: SyncData, fromUserId: string): Promise<void> {
    try {
      // Verify permission
      const permission = this.getPermissionForUser(fromUserId, syncData.dataType);
      if (!permission) {
        logger.warn('Received sync data without permission', { fromUserId, dataType: syncData.dataType });
        return;
      }

      // Verify checksum
      const expectedChecksum = await this.generateChecksum(syncData);
      if (syncData.checksum !== expectedChecksum) {
        logger.warn('Sync data checksum mismatch', { fromUserId, dataType: syncData.dataType });
        return;
      }

      // Decrypt if encrypted
      if (syncData.encrypted && this.encryptionKey) {
        syncData.data = JSON.parse(await securityService.decryptData(syncData.data));
      }

      // Add to sync history
      this.addToSyncHistory(fromUserId, syncData);
      
      // Update last sync timestamp
      this.lastSyncTimestamp.set(fromUserId, syncData.timestamp);

      // Handle emergency data
      if (syncData.isEmergency) {
        await this.handleEmergencyData(syncData, fromUserId);
      }

    } catch (error) {
      logger.error('Failed to process incoming sync data', { error, fromUserId });
    }
  }

  private async handleEmergencyData(syncData: SyncData, fromUserId: string): Promise<void> {
    // Send high-priority notification
    await astralCoreNotificationService.sendNotification({
      type: NotificationType.CRISIS_ALERT,
      title: 'Emergency Data Received',
      message: `Emergency ${syncData.dataType} data received from connected user`,
      priority: NotificationPriority.CRITICAL,
      data: { syncData, fromUserId }
    });
  }

  private getPermissionForUser(userId: string, dataType: string): SyncPermission | null {
    const userPermissions = this.permissions.get(this.currentUserId) || [];
    return userPermissions.find(p => 
      p.userId === userId && 
      p.dataTypes.includes(dataType) &&
      (!p.expiration || p.expiration > Date.now())
    ) || null;
  }

  private getDataIntegrityCheck(dataType: string): DataIntegrityCheck {
    return DATA_TYPE_CONFIG[dataType] || DATA_TYPE_CONFIG.progress;
  }

  private anonymizeDataIfNeeded(data: any, permission: SyncPermission): any {
    if (!permission.anonymized) return data;

    // Apply anonymization based on restrictions
    const anonymized = { ...data };
    
    if (permission.restrictions?.locationPrecision && data.latitude) {
      const precision = permission.restrictions.locationPrecision;
      if (precision === 'city') {
        anonymized.latitude = Math.round(data.latitude * 100) / 100;
        anonymized.longitude = Math.round(data.longitude * 100) / 100;
      } else if (precision === 'region') {
        anonymized.latitude = Math.round(data.latitude * 10) / 10;
        anonymized.longitude = Math.round(data.longitude * 10) / 10;
      }
    }

    if (permission.restrictions?.moodDetail && data.notes) {
      const detail = permission.restrictions.moodDetail;
      if (detail === 'basic') {
        delete anonymized.notes;
      } else if (detail === 'detailed') {
        anonymized.notes = data.notes.substring(0, 100);
      }
    }

    return anonymized;
  }

  private addToSyncHistory(userId: string, syncData: SyncData): void {
    if (!this.syncHistory.has(userId)) {
      this.syncHistory.set(userId, []);
    }
    
    const history = this.syncHistory.get(userId)!;
    history.push(syncData);
    
    // Keep only last 100 entries per user
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  private async generateChecksum(syncData: SyncData): Promise<string> {
    const data = JSON.stringify({
      userId: syncData.userId,
      timestamp: syncData.timestamp,
      dataType: syncData.dataType,
      data: syncData.data
    });
    
    return await securityService.hashData(data);
  }

  private getDataTypesForStrengthLevel(strengthLevel: string): string[] {
    switch (strengthLevel) {
      case 'view-only':
        return ['mood', 'progress', 'presence'];
      case 'support':
        return ['mood', 'progress', 'presence', 'contacts'];
      case 'full-sync':
        return ['mood', 'crisis', 'progress', 'location', 'presence', 'vitals', 'contacts', 'safety_plan'];
      default:
        return [];
    }
  }

  private getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private getPriorityFromSyncPriority(priority: string): MessagePriority {
    switch (priority) {
      case 'critical': return MessagePriority.CRITICAL;
      case 'high': return MessagePriority.HIGH;
      case 'medium': return MessagePriority.MEDIUM;
      case 'low': return MessagePriority.LOW;
      default: return MessagePriority.MEDIUM;
    }
  }

  private cleanupExpiredPermissions(): void {
    const now = Date.now();
    this.permissions.forEach((permissions, userId) => {
      const validPermissions = permissions.filter(p => !p.expiration || p.expiration > now);
      this.permissions.set(userId, validPermissions);
    });
  }

  private cleanupOldSyncHistory(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = Date.now() - maxAge;
    
    this.syncHistory.forEach((history, userId) => {
      const recentHistory = history.filter(item => item.timestamp > cutoff);
      this.syncHistory.set(userId, recentHistory);
    });
  }

  // Merge functions for conflict resolution
  private mergeMoodData(oldData: any, newData: any): any {
    // Use newer data for mood, but preserve notes if both exist
    return {
      ...newData,
      notes: newData.notes || oldData.notes,
      previousMood: oldData.primary !== newData.primary ? oldData.primary : undefined
    };
  }

  private mergeProgressData(oldData: any, newData: any): any {
    // Combine progress data, keeping both values
    return {
      ...newData,
      previousValue: oldData.value,
      change: newData.value - oldData.value,
      trend: newData.value > oldData.value ? 'improving' : 'declining'
    };
  }

  private mergeVitalsData(oldData: any, newData: any): any {
    // Use most recent vitals but keep historical data
    return {
      ...newData,
      previous: {
        heartRate: oldData.heartRate,
        bloodPressure: oldData.bloodPressure,
        temperature: oldData.temperature,
        timestamp: oldData.timestamp
      }
    };
  }
  
  // Enhanced emergency and crisis management methods
  private initializeEmergencyProtocols(): void {
    // Set up default emergency protocols
    this.emergencyProtocols.set('default', {
      escalationSteps: ['support_notification', 'professional_contact', 'emergency_services'],
      responseTimeouts: {
        immediate: 5 * 60 * 1000, // 5 minutes
        high: 15 * 60 * 1000, // 15 minutes
        moderate: 60 * 60 * 1000 // 1 hour
      },
      requiredActions: {
        immediate: ['notify_all_contacts', 'activate_safety_plan', 'emergency_services_check'],
        high: ['notify_primary_contacts', 'send_crisis_resources'],
        moderate: ['send_support_resources', 'schedule_check_in']
      }
    });
  }
  
  private async handleEmergencySync(queueItem: SyncQueueItem): Promise<void> {
    logger.warn('Processing emergency sync item', { itemId: queueItem.id, dataType: queueItem.syncData.dataType });
    
    // Add to crisis queue for special handling
    this.crisisQueue.set(queueItem.id, {
      ...queueItem,
      emergencyProcessingStarted: Date.now()
    });
    
    // Process with highest priority
    await this.processSyncItem(queueItem);
    
    // Remove from crisis queue once processed
    this.crisisQueue.delete(queueItem.id);
  }
  
  private getEmergencyTitle(dataType: string, data: any): string {
    switch (dataType) {
      case 'emergency_alert':
        return `🚨 Emergency Alert - ${data.urgencyLevel?.toUpperCase() || 'UNKNOWN'} Priority`;
      case 'crisis':
        return `🆘 Crisis Data - ${data.level?.toUpperCase() || 'UNKNOWN'} Risk Level`;
      default:
        return '🚨 Emergency Data Received';
    }
  }
  
  private getEmergencyMessage(dataType: string, data: any, fromUserId: string): string {
    const baseMessage = `Emergency ${dataType} data received from connected user ${fromUserId}`;
    
    if (dataType === 'emergency_alert') {
      return `${baseMessage}. Urgency: ${data.urgencyLevel || 'Unknown'}. ${data.description ? 'Description: ' + data.description.substring(0, 100) : ''}`;
    } else if (dataType === 'crisis') {
      return `${baseMessage}. Risk Level: ${data.level || 'Unknown'}. ${data.description ? 'Details: ' + data.description.substring(0, 100) : ''}`;
    }
    
    return baseMessage;
  }
}

// Export singleton instance
export const tetherSyncService = new TetherSyncServiceImpl();
// TetherSyncService interface is already exported above
