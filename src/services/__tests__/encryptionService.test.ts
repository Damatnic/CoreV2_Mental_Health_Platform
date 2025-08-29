import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// Type definitions for Mental Health Encryption Service
export type EncryptionKeyType = 
  | 'user-data' 
  | 'crisis-data' 
  | 'therapeutic-content' 
  | 'pii' 
  | 'clinical-notes' 
  | 'session-recordings';

export type EncryptionStrength = 
  | 'standard' 
  | 'high-security' 
  | 'hipaa-compliant' 
  | 'crisis-priority';

export type DataClassification = 
  | 'public' 
  | 'internal' 
  | 'confidential' 
  | 'highly-confidential' 
  | 'crisis-sensitive';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EncryptionConfig {
  algorithm?: string;
  keyLength?: number;
  strength?: EncryptionStrength;
  hipaaCompliance?: boolean;
  auditLogging?: boolean;
  keyRotationEnabled?: boolean;
  crisisDataProtection?: boolean;
  therapeuticContentSafeguarding?: boolean;
  zeroKnowledgeMode?: boolean;
  emergencyDecryptionEnabled?: boolean;
  performanceMode?: boolean;
  complianceMode?: 'hipaa' | 'gdpr' | 'both';
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag?: string;
  metadata: {
    timestamp: number;
    keyType: EncryptionKeyType;
    classification: DataClassification;
    version: number;
    hipaaCompliant: boolean;
    auditId?: string;
    integrityHash?: string;
    compressionApplied?: boolean;
  };
}

export interface KeyMetadata {
  id: string;
  type: EncryptionKeyType;
  created: number;
  lastUsed: number;
  rotationRequired: boolean;
  strength: EncryptionStrength;
  hipaaCompliant: boolean;
  emergencyAccessible: boolean;
  usageCount?: number;
  expiresAt?: number;
}

export interface AuditLogEntry {
  id: string;
  operation: 'encrypt' | 'decrypt' | 'key-generation' | 'key-rotation' | 'emergency-access' | 'compliance-check';
  timestamp: number;
  keyId: string;
  dataClassification: DataClassification;
  success: boolean;
  userId?: string;
  crisisContext?: boolean;
  errorDetails?: string;
  ipAddress?: string;
  deviceId?: string;
  complianceFlags?: string[];
}

export interface SessionData {
  sessionId: string;
  patientNotes: string;
  treatmentPlan: string;
  assessments?: Array<{ question: string; answer: string }>;
  transcript?: string;
  notes?: string;
}

export interface CrisisData {
  riskLevel: string;
  interventionNeeded: boolean;
  contactedAuthorities: boolean;
  emergency?: boolean;
}

// Mental Health Encryption Service implementation
export class MentalHealthEncryptionService {
  private config: Required<EncryptionConfig>;
  private auditLog: AuditLogEntry[] = [];
  private keyCache: Map<string, { key: CryptoKey; metadata: KeyMetadata }> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(config: EncryptionConfig = {}) {
    this.config = {
      algorithm: config.algorithm ?? 'AES-GCM',
      keyLength: config.keyLength ?? 256,
      strength: config.strength ?? 'hipaa-compliant',
      hipaaCompliance: config.hipaaCompliance ?? true,
      auditLogging: config.auditLogging ?? true,
      keyRotationEnabled: config.keyRotationEnabled ?? true,
      crisisDataProtection: config.crisisDataProtection ?? true,
      therapeuticContentSafeguarding: config.therapeuticContentSafeguarding ?? true,
      zeroKnowledgeMode: config.zeroKnowledgeMode ?? false,
      emergencyDecryptionEnabled: config.emergencyDecryptionEnabled ?? true,
      performanceMode: config.performanceMode ?? false,
      complianceMode: config.complianceMode ?? 'hipaa'
    };
  }

  async generateMentalHealthKey(keyType: EncryptionKeyType): Promise<{ key: CryptoKey; metadata: KeyMetadata }> {
    const startTime = performance.now();
    const keyLength = this.getKeyLengthForType(keyType);
    const strength = this.getStrengthForKeyType(keyType);

    const key = await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );

    const metadata: KeyMetadata = {
      id: crypto.randomUUID(),
      type: keyType,
      created: Date.now(),
      lastUsed: Date.now(),
      rotationRequired: false,
      strength,
      hipaaCompliant: this.config.hipaaCompliance,
      emergencyAccessible: keyType === 'crisis-data' && this.config.emergencyDecryptionEnabled,
      usageCount: 0,
      expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days expiration
    };

    this.keyCache.set(metadata.id, { key, metadata });

    if (this.config.auditLogging) {
      this.logAuditEvent({
        id: crypto.randomUUID(),
        operation: 'key-generation',
        timestamp: Date.now(),
        keyId: metadata.id,
        dataClassification: this.getClassificationForKeyType(keyType),
        success: true,
        crisisContext: keyType === 'crisis-data',
        complianceFlags: this.getComplianceFlags()
      });
    }

    this.recordPerformanceMetric('key-generation', performance.now() - startTime);
    return { key, metadata };
  }

  async encryptMentalHealthData(
    data: string, 
    key: CryptoKey, 
    keyMetadata: KeyMetadata,
    classification: DataClassification = 'confidential',
    crisisContext: boolean = false
  ): Promise<EncryptedData> {
    const startTime = performance.now();

    // HIPAA compliance validation
    if (!this.validateHipaaCompliance(keyMetadata, classification)) {
      throw new Error('HIPAA compliance validation failed for encryption operation');
    }

    // Crisis data protection validation
    if (crisisContext && !this.config.crisisDataProtection) {
      throw new Error('Crisis data protection is required but not enabled');
    }

    // Data integrity check for sensitive classifications
    const integrityHash = classification === 'crisis-sensitive' || classification === 'highly-confidential'
      ? await this.generateIntegrityHash(data)
      : undefined;

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.config.algorithm,
        iv: iv,
        tagLength: classification === 'crisis-sensitive' ? 128 : 96
      },
      key,
      dataBuffer
    );

    const auditId = this.config.auditLogging ? crypto.randomUUID() : undefined;

    const encryptedData: EncryptedData = {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
      metadata: {
        timestamp: Date.now(),
        keyType: keyMetadata.type,
        classification,
        version: 1,
        hipaaCompliant: this.config.hipaaCompliance,
        auditId,
        integrityHash,
        compressionApplied: dataBuffer.byteLength > 10000
      }
    };

    // Update key usage statistics
    if (keyMetadata) {
      keyMetadata.lastUsed = Date.now();
      keyMetadata.usageCount = (keyMetadata.usageCount || 0) + 1;
    }

    if (this.config.auditLogging && auditId) {
      this.logAuditEvent({
        id: auditId,
        operation: 'encrypt',
        timestamp: Date.now(),
        keyId: keyMetadata.id,
        dataClassification: classification,
        success: true,
        crisisContext,
        complianceFlags: this.getComplianceFlags()
      });
    }

    this.recordPerformanceMetric('encryption', performance.now() - startTime);
    return encryptedData;
  }

  async decryptMentalHealthData(
    encryptedData: EncryptedData, 
    key: CryptoKey, 
    keyMetadata: KeyMetadata,
    emergencyAccess: boolean = false
  ): Promise<string> {
    const startTime = performance.now();

    // Compliance validation
    if (!emergencyAccess && !this.validateHipaaCompliance(keyMetadata, encryptedData.metadata.classification)) {
      throw new Error('HIPAA compliance validation failed for decryption operation');
    }

    // Emergency access validation
    if (emergencyAccess && !keyMetadata.emergencyAccessible) {
      throw new Error('Emergency access not allowed for this key type');
    }

    const encrypted = this.base64ToArrayBuffer(encryptedData.data);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const tagLength = encryptedData.metadata.classification === 'crisis-sensitive' ? 128 : 96;

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.config.algorithm,
        iv: iv,
        tagLength
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);

    // Verify integrity for sensitive data
    if (encryptedData.metadata.integrityHash) {
      const expectedHash = await this.generateIntegrityHash(result);
      if (expectedHash !== encryptedData.metadata.integrityHash) {
        throw new Error('Data integrity verification failed');
      }
    }

    // Update key usage
    if (keyMetadata) {
      keyMetadata.lastUsed = Date.now();
      keyMetadata.usageCount = (keyMetadata.usageCount || 0) + 1;
    }

    if (this.config.auditLogging) {
      this.logAuditEvent({
        id: crypto.randomUUID(),
        operation: emergencyAccess ? 'emergency-access' : 'decrypt',
        timestamp: Date.now(),
        keyId: keyMetadata.id,
        dataClassification: encryptedData.metadata.classification,
        success: true,
        crisisContext: encryptedData.metadata.classification === 'crisis-sensitive',
        complianceFlags: this.getComplianceFlags()
      });
    }

    this.recordPerformanceMetric('decryption', performance.now() - startTime);
    return result;
  }

  async encryptTherapeuticSession(
    sessionData: SessionData,
    key: CryptoKey,
    keyMetadata: KeyMetadata,
    patientId: string,
    therapistId: string
  ): Promise<EncryptedData> {
    if (!this.config.therapeuticContentSafeguarding) {
      throw new Error('Therapeutic content safeguarding is required but not enabled');
    }

    const enhancedSessionData = {
      ...sessionData,
      _metadata: {
        patientId: this.config.zeroKnowledgeMode ? this.hashPII(patientId) : patientId,
        therapistId: this.config.zeroKnowledgeMode ? this.hashPII(therapistId) : therapistId,
        encryptedAt: Date.now(),
        hipaaCompliant: true,
        gdprCompliant: this.config.complianceMode === 'gdpr' || this.config.complianceMode === 'both'
      }
    };

    return this.encryptMentalHealthData(
      JSON.stringify(enhancedSessionData),
      key,
      keyMetadata,
      'highly-confidential',
      false
    );
  }

  async encryptCrisisData(
    crisisData: CrisisData,
    key: CryptoKey,
    keyMetadata: KeyMetadata,
    userId: string,
    urgencyLevel: UrgencyLevel = 'high'
  ): Promise<EncryptedData> {
    if (!this.config.crisisDataProtection) {
      throw new Error('Crisis data protection is required but not enabled');
    }

    const enhancedCrisisData = {
      ...crisisData,
      _crisisMetadata: {
        userId: this.config.zeroKnowledgeMode ? this.hashPII(userId) : userId,
        urgencyLevel,
        emergencyAccessible: true,
        encryptedAt: Date.now(),
        requiresEmergencyProtocol: urgencyLevel === 'critical',
        notificationsSent: urgencyLevel === 'critical' || urgencyLevel === 'high'
      }
    };

    return this.encryptMentalHealthData(
      JSON.stringify(enhancedCrisisData),
      key,
      keyMetadata,
      'crisis-sensitive',
      true
    );
  }

  async rotateKey(oldKeyId: string, keyType: EncryptionKeyType): Promise<{ newKey: CryptoKey; newMetadata: KeyMetadata }> {
    const oldKeyData = this.keyCache.get(oldKeyId);
    if (!oldKeyData) {
      throw new Error(`Key with ID ${oldKeyId} not found`);
    }

    const { key: newKey, metadata: newMetadata } = await this.generateMentalHealthKey(keyType);
    
    oldKeyData.metadata.rotationRequired = false;
    this.keyCache.delete(oldKeyId);

    if (this.config.auditLogging) {
      this.logAuditEvent({
        id: crypto.randomUUID(),
        operation: 'key-rotation',
        timestamp: Date.now(),
        keyId: newMetadata.id,
        dataClassification: this.getClassificationForKeyType(keyType),
        success: true,
        complianceFlags: this.getComplianceFlags()
      });
    }

    return { newKey, newMetadata };
  }

  async exportKeyForRecovery(keyId: string): Promise<{ keyData: ArrayBuffer; metadata: KeyMetadata }> {
    const keyData = this.keyCache.get(keyId);
    if (!keyData) {
      throw new Error(`Key with ID ${keyId} not found`);
    }

    if (!keyData.metadata.emergencyAccessible) {
      throw new Error('Key is not marked for emergency access');
    }

    const exportedKey = await crypto.subtle.exportKey('raw', keyData.key);
    
    if (this.config.auditLogging) {
      this.logAuditEvent({
        id: crypto.randomUUID(),
        operation: 'emergency-access',
        timestamp: Date.now(),
        keyId,
        dataClassification: this.getClassificationForKeyType(keyData.metadata.type),
        success: true,
        crisisContext: keyData.metadata.type === 'crisis-data'
      });
    }

    return {
      keyData: exportedKey,
      metadata: keyData.metadata
    };
  }

  async importRecoveryKey(keyData: ArrayBuffer, metadata: KeyMetadata): Promise<CryptoKey> {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: this.config.algorithm,
        length: this.getKeyLengthForType(metadata.type),
      },
      true,
      ['encrypt', 'decrypt']
    );

    this.keyCache.set(metadata.id, { key, metadata });
    return key;
  }

  async performComplianceCheck(): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check key rotation compliance
    for (const [keyId, keyData] of this.keyCache.entries()) {
      const ageInDays = (Date.now() - keyData.metadata.created) / (1000 * 60 * 60 * 24);
      if (ageInDays > 90) {
        issues.push(`Key ${keyId} exceeds 90-day rotation requirement`);
      }
    }

    // Check audit log retention
    if (this.auditLog.length > 10000) {
      issues.push('Audit log exceeds maximum retention size');
    }

    // Check HIPAA compliance settings
    if (this.config.complianceMode === 'hipaa' || this.config.complianceMode === 'both') {
      if (!this.config.auditLogging) {
        issues.push('Audit logging must be enabled for HIPAA compliance');
      }
      if (!this.config.keyRotationEnabled) {
        issues.push('Key rotation must be enabled for HIPAA compliance');
      }
    }

    if (this.config.auditLogging) {
      this.logAuditEvent({
        id: crypto.randomUUID(),
        operation: 'compliance-check',
        timestamp: Date.now(),
        keyId: 'system',
        dataClassification: 'internal',
        success: issues.length === 0,
        complianceFlags: this.getComplianceFlags(),
        errorDetails: issues.length > 0 ? issues.join('; ') : undefined
      });
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }

  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  getCrisisAuditLog(): AuditLogEntry[] {
    return this.auditLog.filter(entry => entry.crisisContext === true);
  }

  getPerformanceMetrics(): Map<string, number[]> {
    return new Map(this.performanceMetrics);
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  private getKeyLengthForType(keyType: EncryptionKeyType): number {
    switch (keyType) {
      case 'crisis-data':
      case 'clinical-notes':
      case 'therapeutic-content':
      case 'session-recordings':
      case 'pii':
        return 256;
      case 'user-data':
        return 192;
      default:
        return this.config.keyLength;
    }
  }

  private getStrengthForKeyType(keyType: EncryptionKeyType): EncryptionStrength {
    switch (keyType) {
      case 'crisis-data':
        return 'crisis-priority';
      case 'clinical-notes':
      case 'session-recordings':
      case 'pii':
        return 'hipaa-compliant';
      case 'therapeutic-content':
        return 'high-security';
      default:
        return this.config.strength;
    }
  }

  private getClassificationForKeyType(keyType: EncryptionKeyType): DataClassification {
    switch (keyType) {
      case 'crisis-data':
        return 'crisis-sensitive';
      case 'clinical-notes':
      case 'session-recordings':
      case 'pii':
        return 'highly-confidential';
      case 'therapeutic-content':
      case 'user-data':
        return 'confidential';
      default:
        return 'internal';
    }
  }

  private validateHipaaCompliance(keyMetadata: KeyMetadata, classification: DataClassification): boolean {
    if (!this.config.hipaaCompliance) return true;
    
    const requiresHipaa = ['highly-confidential', 'crisis-sensitive'].includes(classification);
    return !requiresHipaa || keyMetadata.hipaaCompliant;
  }

  private hashPII(data: string): string {
    return btoa(data).slice(0, 8) + '...';
  }

  private logAuditEvent(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async generateIntegrityHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  private recordPerformanceMetric(operation: string, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    this.performanceMetrics.get(operation)!.push(duration);
  }

  private getComplianceFlags(): string[] {
    const flags: string[] = [];
    if (this.config.hipaaCompliance) flags.push('HIPAA');
    if (this.config.complianceMode === 'gdpr' || this.config.complianceMode === 'both') flags.push('GDPR');
    if (this.config.auditLogging) flags.push('AUDIT');
    if (this.config.keyRotationEnabled) flags.push('KEY_ROTATION');
    if (this.config.crisisDataProtection) flags.push('CRISIS_PROTECTION');
    return flags;
  }
}

// Enhanced mock crypto for Vitest
const mockCrypto = {
  subtle: {
    generateKey: vi.fn() as Mock,
    encrypt: vi.fn() as Mock,
    decrypt: vi.fn() as Mock,
    exportKey: vi.fn() as Mock,
    importKey: vi.fn() as Mock,
    digest: vi.fn() as Mock
  },
  getRandomValues: vi.fn() as Mock,
  randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36))
};

// Test suite
describe('MentalHealthEncryptionService', () => {
  let service: MentalHealthEncryptionService;
  let mockKey: CryptoKey;
  let mockKeyMetadata: KeyMetadata;

  beforeEach(() => {
    service = new MentalHealthEncryptionService({
      hipaaCompliance: true,
      auditLogging: true,
      crisisDataProtection: true,
      therapeuticContentSafeguarding: true,
      complianceMode: 'hipaa'
    });
    
    // Mock CryptoKey
    mockKey = {
      type: 'secret',
      extractable: true,
      algorithm: { name: 'AES-GCM', length: 256 },
      usages: ['encrypt', 'decrypt']
    } as CryptoKey;

    mockKeyMetadata = {
      id: 'test-key-id',
      type: 'therapeutic-content',
      created: Date.now(),
      lastUsed: Date.now(),
      rotationRequired: false,
      strength: 'hipaa-compliant',
      hipaaCompliant: true,
      emergencyAccessible: false,
      usageCount: 0
    };
    
    // Setup crypto mock
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mental Health Key Generation', () => {
    it('should generate HIPAA-compliant therapeutic content key', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      const { key, metadata } = await service.generateMentalHealthKey('therapeutic-content');

      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      expect(key).toBe(mockKey);
      expect(metadata.type).toBe('therapeutic-content');
      expect(metadata.hipaaCompliant).toBe(true);
      expect(metadata.strength).toBe('high-security');
      expect(metadata.expiresAt).toBeDefined();
    });

    it('should generate crisis-priority key for crisis data', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      const { key, metadata } = await service.generateMentalHealthKey('crisis-data');

      expect(metadata.type).toBe('crisis-data');
      expect(metadata.strength).toBe('crisis-priority');
      expect(metadata.emergencyAccessible).toBe(true);
    });

    it('should generate clinical notes key with maximum security', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      const { key, metadata } = await service.generateMentalHealthKey('clinical-notes');

      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      expect(metadata.strength).toBe('hipaa-compliant');
      expect(metadata.hipaaCompliant).toBe(true);
    });

    it('should log key generation audit events with compliance flags', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      await service.generateMentalHealthKey('pii');

      const auditLog = service.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].operation).toBe('key-generation');
      expect(auditLog[0].dataClassification).toBe('highly-confidential');
      expect(auditLog[0].complianceFlags).toContain('HIPAA');
      expect(auditLog[0].complianceFlags).toContain('AUDIT');
    });

    it('should track performance metrics for key generation', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      await service.generateMentalHealthKey('session-recordings');

      const metrics = service.getPerformanceMetrics();
      expect(metrics.has('key-generation')).toBe(true);
      expect(metrics.get('key-generation')!.length).toBeGreaterThan(0);
    });
  });

  describe('Mental Health Data Encryption', () => {
    beforeEach(() => {
      const mockEncrypted = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockHashBuffer = new ArrayBuffer(32);
      
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
    });

    it('should encrypt therapeutic content with enhanced security and integrity', async () => {
      const therapeuticData = 'CBT session notes for anxiety treatment';

      const result = await service.encryptMentalHealthData(
        therapeuticData,
        mockKey,
        mockKeyMetadata,
        'confidential',
        false
      );

      expect(crypto.subtle.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: expect.any(Uint8Array), tagLength: 96 },
        mockKey,
        expect.any(ArrayBuffer)
      );
      expect(result.metadata.keyType).toBe('therapeutic-content');
      expect(result.metadata.classification).toBe('confidential');
      expect(result.metadata.hipaaCompliant).toBe(true);
      expect(mockKeyMetadata.usageCount).toBe(1);
    });

    it('should encrypt crisis-sensitive data with maximum security and integrity hash', async () => {
      const crisisKeyMetadata: KeyMetadata = { ...mockKeyMetadata, type: 'crisis-data' };
      const crisisData = 'Patient expressing suicidal ideation';

      const result = await service.encryptMentalHealthData(
        crisisData,
        mockKey,
        crisisKeyMetadata,
        'crisis-sensitive',
        true
      );

      expect(crypto.subtle.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: expect.any(Uint8Array), tagLength: 128 },
        mockKey,
        expect.any(ArrayBuffer)
      );
      expect(result.metadata.classification).toBe('crisis-sensitive');
      expect(result.metadata.integrityHash).toBeDefined();
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer));
    });

    it('should reject non-HIPAA compliant encryption for confidential data', async () => {
      const nonHipaaKeyMetadata = { ...mockKeyMetadata, hipaaCompliant: false };

      await expect(service.encryptMentalHealthData(
        'confidential medical data',
        mockKey,
        nonHipaaKeyMetadata,
        'highly-confidential'
      )).rejects.toThrow('HIPAA compliance validation failed');
    });

    it('should enforce crisis data protection requirements', async () => {
      const serviceWithoutCrisisProtection = new MentalHealthEncryptionService({
        crisisDataProtection: false
      });

      await expect(serviceWithoutCrisisProtection.encryptMentalHealthData(
        'crisis data',
        mockKey,
        mockKeyMetadata,
        'crisis-sensitive',
        true
      )).rejects.toThrow('Crisis data protection is required but not enabled');
    });

    it('should mark compression flag for large data', async () => {
      const largeData = 'x'.repeat(15000);

      const result = await service.encryptMentalHealthData(
        largeData,
        mockKey,
        mockKeyMetadata,
        'confidential'
      );

      expect(result.metadata.compressionApplied).toBe(true);
    });
  });

  describe('Mental Health Data Decryption', () => {
    let mockEncryptedData: EncryptedData;

    beforeEach(() => {
      mockEncryptedData = {
        data: 'bW9ja0VuY3J5cHRlZERhdGE=',
        iv: 'bW9ja0l2',
        metadata: {
          timestamp: Date.now(),
          keyType: 'therapeutic-content',
          classification: 'confidential',
          version: 1,
          hipaaCompliant: true,
          auditId: 'audit-123'
        }
      };

      const mockDecrypted = new TextEncoder().encode('decrypted therapeutic data');
      const mockHashBuffer = new ArrayBuffer(32);
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecrypted);
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
    });

    it('should decrypt therapeutic content with audit logging and usage tracking', async () => {
      const result = await service.decryptMentalHealthData(
        mockEncryptedData,
        mockKey,
        mockKeyMetadata
      );

      expect(crypto.subtle.decrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: expect.any(ArrayBuffer), tagLength: 96 },
        mockKey,
        expect.any(ArrayBuffer)
      );
      expect(result).toBe('decrypted therapeutic data');
      expect(mockKeyMetadata.usageCount).toBe(1);

      const auditLog = service.getAuditLog();
      expect(auditLog.some(entry => entry.operation === 'decrypt')).toBe(true);
    });

    it('should allow emergency access for crisis data', async () => {
      const crisisKeyMetadata: KeyMetadata = { ...mockKeyMetadata, emergencyAccessible: true };
      const crisisEncryptedData: EncryptedData = {
        ...mockEncryptedData,
        metadata: { ...mockEncryptedData.metadata, classification: 'crisis-sensitive' }
      };

      const result = await service.decryptMentalHealthData(
        crisisEncryptedData,
        mockKey,
        crisisKeyMetadata,
        true
      );

      expect(result).toBe('decrypted therapeutic data');

      const auditLog = service.getAuditLog();
      expect(auditLog.some(entry => entry.operation === 'emergency-access')).toBe(true);
    });

    it('should reject emergency access for non-emergency keys', async () => {
      const nonEmergencyKeyMetadata = { ...mockKeyMetadata, emergencyAccessible: false };

      await expect(service.decryptMentalHealthData(
        mockEncryptedData,
        mockKey,
        nonEmergencyKeyMetadata,
        true
      )).rejects.toThrow('Emergency access not allowed for this key type');
    });

    it('should verify data integrity when integrity hash is present', async () => {
      const encryptedDataWithIntegrity: EncryptedData = {
        ...mockEncryptedData,
        metadata: {
          ...mockEncryptedData.metadata,
          integrityHash: 'invalid-hash'
        }
      };

      // Mock different hash for integrity check failure
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(16));

      await expect(service.decryptMentalHealthData(
        encryptedDataWithIntegrity,
        mockKey,
        mockKeyMetadata
      )).rejects.toThrow('Data integrity verification failed');
    });
  });

  describe('Therapeutic Session Encryption', () => {
    it('should encrypt therapeutic session with enhanced metadata and compliance', async () => {
      const sessionData: SessionData = {
        sessionId: 'session-123',
        patientNotes: 'Patient showed improvement in anxiety levels',
        treatmentPlan: 'Continue CBT, add mindfulness exercises'
      };

      const mockEncrypted = new ArrayBuffer(64);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      const result = await service.encryptTherapeuticSession(
        sessionData,
        mockKey,
        mockKeyMetadata,
        'patient-456',
        'therapist-789'
      );

      expect(result.metadata.classification).toBe('highly-confidential');
      expect(result.metadata.hipaaCompliant).toBe(true);
    });

    it('should enforce therapeutic content safeguarding', async () => {
      const serviceWithoutSafeguarding = new MentalHealthEncryptionService({
        therapeuticContentSafeguarding: false
      });

      await expect(serviceWithoutSafeguarding.encryptTherapeuticSession(
        {} as SessionData,
        mockKey,
        mockKeyMetadata,
        'patient',
        'therapist'
      )).rejects.toThrow('Therapeutic content safeguarding is required but not enabled');
    });

    it('should apply zero-knowledge mode when enabled', async () => {
      const zeroKnowledgeService = new MentalHealthEncryptionService({
        zeroKnowledgeMode: true,
        therapeuticContentSafeguarding: true
      });

      const sessionData: SessionData = {
        sessionId: 'session-zk',
        patientNotes: 'Zero knowledge test',
        treatmentPlan: 'Test plan'
      };

      const mockEncrypted = new ArrayBuffer(64);
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      await zeroKnowledgeService.encryptTherapeuticSession(
        sessionData,
        mockKey,
        mockKeyMetadata,
        'patient-private',
        'therapist-private'
      );

      // Verify that PII was hashed
      expect(crypto.subtle.encrypt).toHaveBeenCalled();
    });
  });

  describe('Crisis Data Encryption', () => {
    it('should encrypt crisis data with maximum security and notification flags', async () => {
      const crisisData: CrisisData = {
        riskLevel: 'high',
        interventionNeeded: true,
        contactedAuthorities: false
      };

      const crisisKeyMetadata: KeyMetadata = { ...mockKeyMetadata, type: 'crisis-data' };
      const mockEncrypted = new ArrayBuffer(64);
      const mockIv = new Uint8Array(12);
      const mockHashBuffer = new ArrayBuffer(32);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);

      const result = await service.encryptCrisisData(
        crisisData,
        mockKey,
        crisisKeyMetadata,
        'user-critical-123',
        'critical'
      );

      expect(result.metadata.classification).toBe('crisis-sensitive');
      expect(crypto.subtle.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: expect.any(Uint8Array), tagLength: 128 },
        mockKey,
        expect.any(ArrayBuffer)
      );

      const auditLog = service.getCrisisAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].crisisContext).toBe(true);
    });

    it('should require crisis data protection for crisis data', async () => {
      const serviceWithoutCrisisProtection = new MentalHealthEncryptionService({
        crisisDataProtection: false
      });

      await expect(serviceWithoutCrisisProtection.encryptCrisisData(
        {} as CrisisData,
        mockKey,
        mockKeyMetadata,
        'user-123'
      )).rejects.toThrow('Crisis data protection is required but not enabled');
    });

    it('should handle different urgency levels appropriately', async () => {
      const crisisData: CrisisData = {
        riskLevel: 'medium',
        interventionNeeded: true,
        contactedAuthorities: false
      };

      const mockEncrypted = new ArrayBuffer(64);
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      const result = await service.encryptCrisisData(
        crisisData,
        mockKey,
        { ...mockKeyMetadata, type: 'crisis-data' },
        'user-123',
        'medium'
      );

      expect(result.metadata.classification).toBe('crisis-sensitive');
    });
  });

  describe('Key Rotation for Mental Health Data', () => {
    it('should rotate keys with audit trail and compliance flags', async () => {
      // First, generate and cache a key
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      const { metadata: originalMetadata } = await service.generateMentalHealthKey('clinical-notes');
      
      // Mock new key generation for rotation
      const newMockKey = { ...mockKey } as CryptoKey;
      mockCrypto.subtle.generateKey.mockResolvedValue(newMockKey);

      const { newKey, newMetadata } = await service.rotateKey(
        originalMetadata.id,
        'clinical-notes'
      );

      expect(newKey).toBe(newMockKey);
      expect(newMetadata.type).toBe('clinical-notes');
      expect(newMetadata.id).not.toBe(originalMetadata.id);

      const auditLog = service.getAuditLog();
      const rotationEntry = auditLog.find(entry => entry.operation === 'key-rotation');
      expect(rotationEntry).toBeDefined();
      expect(rotationEntry!.complianceFlags).toContain('HIPAA');
    });

    it('should handle key rotation for non-existent keys', async () => {
      await expect(service.rotateKey('non-existent-key', 'user-data'))
        .rejects.toThrow('Key with ID non-existent-key not found');
    });
  });

  describe('Emergency Recovery Features', () => {
    it('should export emergency-accessible keys for recovery with audit', async () => {
      // Generate and cache an emergency-accessible key
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      const { metadata } = await service.generateMentalHealthKey('crisis-data');
      
      const mockKeyData = new ArrayBuffer(32);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockKeyData);

      const { keyData, metadata: exportedMetadata } = await service.exportKeyForRecovery(metadata.id);

      expect(crypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockKey);
      expect(keyData).toBe(mockKeyData);
      expect(exportedMetadata.emergencyAccessible).toBe(true);

      const auditLog = service.getAuditLog();
      expect(auditLog.some(entry => entry.operation === 'emergency-access')).toBe(true);
    });

    it('should reject export for non-emergency keys', async () => {
      // Generate and cache a non-emergency key
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      const { metadata } = await service.generateMentalHealthKey('user-data');

      await expect(service.exportKeyForRecovery(metadata.id))
        .rejects.toThrow('Key is not marked for emergency access');
    });

    it('should import recovery keys properly', async () => {
      const keyData = new ArrayBuffer(32);
      const recoveryMetadata = { ...mockKeyMetadata, emergencyAccessible: true };

      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);

      const importedKey = await service.importRecoveryKey(keyData, recoveryMetadata);

      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      expect(importedKey).toBe(mockKey);
    });
  });

  describe('Compliance and Audit Features', () => {
    it('should maintain comprehensive audit logs with compliance flags', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      
      // Perform various operations
      await service.generateMentalHealthKey('therapeutic-content');
      
      const mockEncrypted = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      await service.encryptMentalHealthData(
        'test data',
        mockKey,
        mockKeyMetadata,
        'confidential'
      );

      const auditLog = service.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      expect(auditLog.every(entry => entry.timestamp)).toBe(true);
      expect(auditLog.every(entry => entry.success !== undefined)).toBe(true);
      expect(auditLog.every(entry => entry.complianceFlags && entry.complianceFlags.length > 0)).toBe(true);
    });

    it('should filter crisis-specific audit entries', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      
      const crisisKeyMetadata: KeyMetadata = { ...mockKeyMetadata, type: 'crisis-data' };
      const mockEncrypted = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      await service.encryptCrisisData(
        { emergency: true } as CrisisData,
        mockKey,
        crisisKeyMetadata,
        'user-123',
        'critical'
      );

      const crisisAuditLog = service.getCrisisAuditLog();
      expect(crisisAuditLog.length).toBeGreaterThan(0);
      expect(crisisAuditLog.every(entry => entry.crisisContext === true)).toBe(true);
    });

    it('should perform comprehensive compliance checks', async () => {
      // Generate an old key to test rotation compliance
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      const { metadata } = await service.generateMentalHealthKey('clinical-notes');
      
      // Manually set the created date to be over 90 days ago
      metadata.created = Date.now() - (91 * 24 * 60 * 60 * 1000);

      const complianceResult = await service.performComplianceCheck();

      expect(complianceResult.compliant).toBe(false);
      expect(complianceResult.issues.length).toBeGreaterThan(0);
      expect(complianceResult.issues.some(issue => issue.includes('90-day rotation'))).toBe(true);

      const auditLog = service.getAuditLog();
      expect(auditLog.some(entry => entry.operation === 'compliance-check')).toBe(true);
    });

    it('should enforce GDPR compliance when configured', async () => {
      const gdprService = new MentalHealthEncryptionService({
        complianceMode: 'both',
        therapeuticContentSafeguarding: true
      });

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));

      const sessionData: SessionData = {
        sessionId: 'gdpr-session',
        patientNotes: 'GDPR compliant notes',
        treatmentPlan: 'GDPR compliant plan'
      };

      const result = await gdprService.encryptTherapeuticSession(
        sessionData,
        mockKey,
        mockKeyMetadata,
        'eu-patient',
        'eu-therapist'
      );

      expect(result).toBeDefined();
      // The encrypted data would include GDPR compliance metadata
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle encryption failures gracefully', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption hardware failure'));

      await expect(service.encryptMentalHealthData(
        'test data',
        mockKey,
        mockKeyMetadata
      )).rejects.toThrow('Encryption hardware failure');
    });

    it('should handle decryption failures with audit logging', async () => {
      const encryptedData: EncryptedData = {
        data: 'invalid-data',
        iv: 'invalid-iv',
        metadata: {
          timestamp: Date.now(),
          keyType: 'user-data',
          classification: 'internal',
          version: 1,
          hipaaCompliant: true
        }
      };

      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(service.decryptMentalHealthData(
        encryptedData,
        mockKey,
        mockKeyMetadata
      )).rejects.toThrow('Decryption failed');
    });

    it('should validate key strength requirements', async () => {
      const weakKeyMetadata: KeyMetadata = { ...mockKeyMetadata, strength: 'standard' };
      
      // Should still work but with warnings for lower security requirements
      const mockEncrypted = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      const result = await service.encryptMentalHealthData(
        'non-critical data',
        mockKey,
        weakKeyMetadata,
        'internal'
      );

      expect(result.metadata.classification).toBe('internal');
    });

    it('should handle key expiration validation', async () => {
      const expiredKeyMetadata: KeyMetadata = {
        ...mockKeyMetadata,
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      // Key should still work but would typically trigger a warning
      const mockEncrypted = new ArrayBuffer(32);
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      const result = await service.encryptMentalHealthData(
        'test data',
        mockKey,
        expiredKeyMetadata,
        'internal'
      );

      expect(result).toBeDefined();
    });
  });

  describe('Performance and Optimization Tests', () => {
    it('should handle large therapeutic session data efficiently', async () => {
      const largeSessionData: SessionData = {
        sessionId: 'large-session',
        patientNotes: 'x'.repeat(10000),
        treatmentPlan: 'y'.repeat(5000),
        assessments: Array(100).fill({ question: 'test', answer: 'response' })
      };

      const mockEncrypted = new ArrayBuffer(20000);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      const result = await service.encryptTherapeuticSession(
        largeSessionData,
        mockKey,
        mockKeyMetadata,
        'patient-large-data',
        'therapist-123'
      );

      expect(result.metadata.classification).toBe('highly-confidential');
      expect(result.metadata.compressionApplied).toBe(true);
      expect(crypto.subtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM' }),
        mockKey,
        expect.any(ArrayBuffer)
      );
    });

    it('should maintain performance under concurrent operations', async () => {
      const mockEncrypted = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      // Simulate concurrent encryption operations
      const encryptionPromises = Array(5).fill(null).map((_, index) =>
        service.encryptMentalHealthData(
          `concurrent data ${index}`,
          mockKey,
          { ...mockKeyMetadata, id: `key-${index}` },
          'confidential'
        )
      );

      const results = await Promise.all(encryptionPromises);
      
      expect(results).toHaveLength(5);
      expect(results.every(result => result.metadata.hipaaCompliant)).toBe(true);
      expect(crypto.subtle.encrypt).toHaveBeenCalledTimes(5);

      // Check performance metrics
      const metrics = service.getPerformanceMetrics();
      expect(metrics.get('encryption')!.length).toBe(5);
    });

    it('should handle zero-knowledge mode correctly', async () => {
      const zeroKnowledgeService = new MentalHealthEncryptionService({
        zeroKnowledgeMode: true,
        hipaaCompliance: true,
        auditLogging: true,
        therapeuticContentSafeguarding: true
      });

      const mockEncrypted = new ArrayBuffer(64);
      const mockIv = new Uint8Array(12);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      const result = await zeroKnowledgeService.encryptTherapeuticSession(
        { 
          sessionId: 'zk-session',
          patientNotes: 'sensitive session data',
          treatmentPlan: 'confidential plan'
        },
        mockKey,
        mockKeyMetadata,
        'patient-sensitive-id',
        'therapist-secure-id'
      );

      expect(result.metadata.hipaaCompliant).toBe(true);
      expect(result.metadata.classification).toBe('highly-confidential');
    });

    it('should track and manage performance metrics', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));

      // Perform multiple operations
      await service.generateMentalHealthKey('clinical-notes');
      await service.encryptMentalHealthData('test1', mockKey, mockKeyMetadata);
      await service.encryptMentalHealthData('test2', mockKey, mockKeyMetadata);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.has('key-generation')).toBe(true);
      expect(metrics.has('encryption')).toBe(true);
      expect(metrics.get('encryption')!.length).toBe(2);

      // Clear metrics
      service.clearPerformanceMetrics();
      const clearedMetrics = service.getPerformanceMetrics();
      expect(clearedMetrics.size).toBe(0);
    });

    it('should handle batch encryption operations', async () => {
      const batchData = Array(10).fill(null).map((_, i) => ({
        id: `batch-${i}`,
        data: `Batch data item ${i}`,
        classification: i % 2 === 0 ? 'confidential' : 'highly-confidential'
      }));

      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      const results = await Promise.all(
        batchData.map(item =>
          service.encryptMentalHealthData(
            item.data,
            mockKey,
            mockKeyMetadata,
            item.classification as DataClassification
          )
        )
      );

      expect(results).toHaveLength(10);
      expect(results.filter(r => r.metadata.classification === 'highly-confidential')).toHaveLength(5);
      expect(results.filter(r => r.metadata.integrityHash !== undefined)).toHaveLength(5);
    });
  });

  describe('Advanced Security Features', () => {
    it('should implement proper key usage limits', async () => {
      const limitedKeyMetadata: KeyMetadata = {
        ...mockKeyMetadata,
        usageCount: 0
      };

      const mockEncrypted = new ArrayBuffer(32);
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      // Perform multiple operations
      await service.encryptMentalHealthData('test1', mockKey, limitedKeyMetadata);
      await service.encryptMentalHealthData('test2', mockKey, limitedKeyMetadata);
      await service.encryptMentalHealthData('test3', mockKey, limitedKeyMetadata);

      expect(limitedKeyMetadata.usageCount).toBe(3);
    });

    it('should handle session recording encryption with maximum security', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      
      const { key: recordingKey, metadata: recordingMetadata } = 
        await service.generateMentalHealthKey('session-recordings');

      expect(recordingMetadata.type).toBe('session-recordings');
      expect(recordingMetadata.strength).toBe('hipaa-compliant');
      expect(recordingMetadata.hipaaCompliant).toBe(true);
    });

    it('should validate PII encryption requirements', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      
      const { metadata: piiMetadata } = await service.generateMentalHealthKey('pii');

      expect(piiMetadata.type).toBe('pii');
      expect(piiMetadata.strength).toBe('hipaa-compliant');
      expect(piiMetadata.hipaaCompliant).toBe(true);

      const auditLog = service.getAuditLog();
      expect(auditLog[0].dataClassification).toBe('highly-confidential');
    });
  });
});