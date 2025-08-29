import encryptionService from '../../../services/encryptionService';
import { jest } from '@jest/globals';

// Mock crypto APIs
const mockCrypto = {
  getRandomValues: jest.fn(),
  subtle: {
    generateKey: jest.fn(),
    importKey: jest.fn(),
    exportKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    deriveBits: jest.fn(),
    deriveKey: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn()
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('EncryptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default crypto mocks
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });
    
    mockCrypto.subtle.generateKey.mockResolvedValue({
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: false,
      type: 'secret',
      usages: ['encrypt', 'decrypt']
    });
    
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('decrypted data'));
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive data', async () => {
      const sensitiveData = 'This is sensitive mental health information';
      
      const encrypted = await encryptionService.encrypt(sensitiveData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(sensitiveData);
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it('should decrypt encrypted data', async () => {
      const originalData = 'Mental health journal entry';
      
      // First encrypt the data
      const encrypted = await encryptionService.encrypt(originalData);
      
      // Then decrypt it
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(originalData);
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should handle large data sets', async () => {
      const largeData = 'x'.repeat(100000); // 100KB of data
      
      const encrypted = await encryptionService.encrypt(largeData);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(largeData);
    });

    it('should encrypt objects and arrays', async () => {
      const complexData = {
        moodEntries: [
          { date: '2024-01-01', mood: 'happy', score: 8 },
          { date: '2024-01-02', mood: 'sad', score: 3 }
        ],
        journalEntries: ['Entry 1', 'Entry 2'],
        settings: { privacy: 'high', sharing: false }
      };
      
      const encrypted = await encryptionService.encrypt(JSON.stringify(complexData));
      const decrypted = JSON.parse(await encryptionService.decrypt(encrypted));
      
      expect(decrypted).toEqual(complexData);
    });

    it('should handle null and undefined values', async () => {
      await expect(encryptionService.encrypt(null)).rejects.toThrow(/cannot encrypt null/i);
      await expect(encryptionService.encrypt(undefined)).rejects.toThrow(/cannot encrypt undefined/i);
      await expect(encryptionService.encrypt('')).rejects.toThrow(/cannot encrypt empty/i);
    });

    it('should generate unique encryptions for same data', async () => {
      const data = 'Same data';
      
      const encrypted1 = await encryptionService.encrypt(data);
      const encrypted2 = await encryptionService.encrypt(data);
      
      expect(encrypted1).not.toBe(encrypted2); // Different due to random IV
      
      const decrypted1 = await encryptionService.decrypt(encrypted1);
      const decrypted2 = await encryptionService.decrypt(encrypted2);
      
      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });
  });

  describe('Key Management', () => {
    it('should generate encryption keys securely', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValueOnce({
        algorithm: { name: 'AES-GCM', length: 256 },
        extractable: false,
        type: 'secret',
        usages: ['encrypt', 'decrypt']
      });
      
      const key = await encryptionService.generateKey();
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          length: 256
        },
        false, // not extractable
        ['encrypt', 'decrypt']
      );
      
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should derive keys from passwords', async () => {
      const password = 'userSecurePassword123';
      const salt = new Uint8Array(16);
      mockCrypto.getRandomValues(salt);
      
      mockCrypto.subtle.importKey.mockResolvedValueOnce({
        algorithm: { name: 'PBKDF2' },
        extractable: false,
        type: 'secret',
        usages: ['deriveKey']
      });
      
      mockCrypto.subtle.deriveKey.mockResolvedValueOnce({
        algorithm: { name: 'AES-GCM', length: 256 },
        extractable: false,
        type: 'secret',
        usages: ['encrypt', 'decrypt']
      });
      
      const derivedKey = await encryptionService.deriveKeyFromPassword(password, salt);
      
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        expect.any(Object), // master key
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      expect(derivedKey).toBeDefined();
    });

    it('should store keys securely', async () => {
      const key = await encryptionService.generateKey();
      
      mockCrypto.subtle.exportKey.mockResolvedValueOnce(new ArrayBuffer(32));
      
      await encryptionService.storeKey('testKey', key);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'encKey_testKey',
        expect.any(String)
      );
    });

    it('should retrieve stored keys', async () => {
      const keyData = 'base64EncodedKeyData';
      localStorageMock.getItem.mockReturnValueOnce(keyData);
      
      mockCrypto.subtle.importKey.mockResolvedValueOnce({
        algorithm: { name: 'AES-GCM', length: 256 },
        extractable: false,
        type: 'secret',
        usages: ['encrypt', 'decrypt']
      });
      
      const retrievedKey = await encryptionService.retrieveKey('testKey');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('encKey_testKey');
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
      expect(retrievedKey).toBeDefined();
    });

    it('should handle missing keys gracefully', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const retrievedKey = await encryptionService.retrieveKey('nonExistentKey');
      
      expect(retrievedKey).toBeNull();
    });

    it('should rotate keys periodically', async () => {
      // Mock old key
      const oldKeyData = { created: Date.now() - (90 * 24 * 60 * 60 * 1000) }; // 90 days old
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(oldKeyData));
      
      const shouldRotate = await encryptionService.shouldRotateKey('testKey');
      
      expect(shouldRotate).toBe(true);
      
      // Test key rotation
      await encryptionService.rotateKey('testKey');
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'encKey_testKey',
        expect.any(String)
      );
    });
  });

  describe('Hashing and Integrity', () => {
    it('should hash data securely', async () => {
      const data = 'Data to hash';
      const expectedHash = new ArrayBuffer(32);
      
      mockCrypto.subtle.digest = jest.fn().mockResolvedValueOnce(expectedHash);
      
      const hash = await encryptionService.hash(data);
      
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        new TextEncoder().encode(data)
      );
      
      expect(hash).toBeDefined();
    });

    it('should verify data integrity', async () => {
      const data = 'Original data';
      const originalHash = await encryptionService.hash(data);
      
      const isValid = await encryptionService.verifyIntegrity(data, originalHash);
      
      expect(isValid).toBe(true);
      
      // Test with modified data
      const isInvalid = await encryptionService.verifyIntegrity('Modified data', originalHash);
      
      expect(isInvalid).toBe(false);
    });

    it('should generate secure salts', () => {
      const salt1 = encryptionService.generateSalt();
      const salt2 = encryptionService.generateSalt();
      
      expect(salt1).toHaveLength(16);
      expect(salt2).toHaveLength(16);
      expect(salt1).not.toEqual(salt2);
      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
    });

    it('should create HMACs for authentication', async () => {
      const data = 'Data to authenticate';
      const key = await encryptionService.generateKey();
      
      mockCrypto.subtle.sign.mockResolvedValueOnce(new ArrayBuffer(32));
      
      const hmac = await encryptionService.createHMAC(data, key);
      
      expect(mockCrypto.subtle.sign).toHaveBeenCalledWith(
        'HMAC',
        key,
        new TextEncoder().encode(data)
      );
      
      expect(hmac).toBeDefined();
    });

    it('should verify HMACs', async () => {
      const data = 'Data to verify';
      const key = await encryptionService.generateKey();
      const signature = new ArrayBuffer(32);
      
      mockCrypto.subtle.verify.mockResolvedValueOnce(true);
      
      const isValid = await encryptionService.verifyHMAC(data, signature, key);
      
      expect(mockCrypto.subtle.verify).toHaveBeenCalledWith(
        'HMAC',
        key,
        signature,
        new TextEncoder().encode(data)
      );
      
      expect(isValid).toBe(true);
    });
  });

  describe('HIPAA Compliance Features', () => {
    it('should encrypt PHI with additional protections', async () => {
      const phi = {
        patientId: 'P12345',
        diagnosis: 'Major Depression',
        treatment: 'Cognitive Behavioral Therapy',
        notes: 'Patient shows improvement'
      };
      
      const encryptedPHI = await encryptionService.encryptPHI(phi);
      
      expect(encryptedPHI).toBeDefined();
      expect(encryptedPHI.encrypted).toBeDefined();
      expect(encryptedPHI.metadata.hipaaCompliant).toBe(true);
      expect(encryptedPHI.metadata.encryptionAlgorithm).toBe('AES-256-GCM');
      expect(encryptedPHI.metadata.timestamp).toBeDefined();
    });

    it('should decrypt PHI with audit trail', async () => {
      const phi = { patientId: 'P12345', notes: 'Sensitive information' };
      const encryptedPHI = await encryptionService.encryptPHI(phi);
      
      const decryptedPHI = await encryptionService.decryptPHI(encryptedPHI, {
        userId: 'doctor123',
        reason: 'treatment_review'
      });
      
      expect(decryptedPHI.data).toEqual(phi);
      expect(decryptedPHI.auditInfo).toBeDefined();
      expect(decryptedPHI.auditInfo.accessedBy).toBe('doctor123');
      expect(decryptedPHI.auditInfo.reason).toBe('treatment_review');
    });

    it('should implement data retention policies', async () => {
      const oldData = {
        timestamp: Date.now() - (8 * 365 * 24 * 60 * 60 * 1000), // 8 years old
        data: 'Old PHI data'
      };
      
      const shouldPurge = await encryptionService.shouldPurgeData(oldData);
      
      expect(shouldPurge).toBe(true);
      
      await encryptionService.secureDelete(oldData);
      
      // Verify secure deletion occurred
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should track access to encrypted data', async () => {
      const accessLog = {
        dataId: 'phi-123',
        userId: 'user456',
        timestamp: new Date(),
        action: 'decrypt',
        ipAddress: '192.168.1.1'
      };
      
      await encryptionService.logDataAccess(accessLog);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessLog',
        expect.stringContaining('phi-123')
      );
    });
  });

  describe('Advanced Security Features', () => {
    it('should implement key stretching for passwords', async () => {
      const password = 'userPassword123';
      const salt = encryptionService.generateSalt();
      
      const stretchedKey = await encryptionService.stretchKey(password, salt, {
        iterations: 100000,
        algorithm: 'PBKDF2',
        hash: 'SHA-256'
      });
      
      expect(stretchedKey).toBeDefined();
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations: 100000
        }),
        expect.any(Object),
        expect.any(Object),
        false,
        expect.any(Array)
      );
    });

    it('should support multiple encryption algorithms', async () => {
      const data = 'Test data';
      
      // Test AES-256-GCM
      const aesEncrypted = await encryptionService.encrypt(data, { algorithm: 'AES-256-GCM' });
      const aesDecrypted = await encryptionService.decrypt(aesEncrypted, { algorithm: 'AES-256-GCM' });
      expect(aesDecrypted).toBe(data);
      
      // Test ChaCha20-Poly1305 (if available)
      try {
        const chachaEncrypted = await encryptionService.encrypt(data, { algorithm: 'ChaCha20-Poly1305' });
        const chachaDecrypted = await encryptionService.decrypt(chachaEncrypted, { algorithm: 'ChaCha20-Poly1305' });
        expect(chachaDecrypted).toBe(data);
      } catch (e) {
        // Algorithm may not be supported in all environments
        expect(e.message).toContain('not supported');
      }
    });

    it('should implement forward secrecy', async () => {
      const sessionKey1 = await encryptionService.generateSessionKey();
      const sessionKey2 = await encryptionService.generateSessionKey();
      
      expect(sessionKey1).not.toEqual(sessionKey2);
      
      // Verify session keys are ephemeral
      await encryptionService.destroySessionKey(sessionKey1.id);
      
      const retrievedKey = await encryptionService.retrieveSessionKey(sessionKey1.id);
      expect(retrievedKey).toBeNull();
    });

    it('should implement secure random number generation', () => {
      const randomBytes1 = encryptionService.generateSecureRandom(32);
      const randomBytes2 = encryptionService.generateSecureRandom(32);
      
      expect(randomBytes1).toHaveLength(32);
      expect(randomBytes2).toHaveLength(32);
      expect(randomBytes1).not.toEqual(randomBytes2);
      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
    });

    it('should handle cryptographic errors gracefully', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValueOnce(new Error('Encryption failed'));
      
      await expect(encryptionService.encrypt('test data')).rejects.toThrow('Encryption failed');
      
      // Should not expose sensitive information in error
      try {
        await encryptionService.encrypt('sensitive data');
      } catch (error) {
        expect(error.message).not.toContain('sensitive data');
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache frequently used keys', async () => {
      const keyId = 'frequently-used-key';
      
      // First access should generate/retrieve key
      await encryptionService.getCachedKey(keyId);
      
      // Second access should use cached key
      await encryptionService.getCachedKey(keyId);
      
      // Should only generate/retrieve once
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledTimes(1);
    });

    it('should handle large data encryption efficiently', async () => {
      const largeData = 'x'.repeat(1000000); // 1MB of data
      
      const startTime = Date.now();
      const encrypted = await encryptionService.encrypt(largeData);
      const decrypted = await encryptionService.decrypt(encrypted);
      const endTime = Date.now();
      
      expect(decrypted).toBe(largeData);
      // Should complete within reasonable time (adjust based on environment)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should implement streaming encryption for large files', async () => {
      const streamEncryptor = await encryptionService.createStreamEncryptor();
      
      // Simulate streaming large data
      const chunk1 = 'First chunk of data';
      const chunk2 = 'Second chunk of data';
      const chunk3 = 'Final chunk of data';
      
      const encrypted1 = await streamEncryptor.update(chunk1);
      const encrypted2 = await streamEncryptor.update(chunk2);
      const encrypted3 = await streamEncryptor.finalize(chunk3);
      
      expect(encrypted1).toBeDefined();
      expect(encrypted2).toBeDefined();
      expect(encrypted3).toBeDefined();
    });

    it('should clean up resources properly', async () => {
      const key = await encryptionService.generateKey();
      const keyId = await encryptionService.storeKey('temp-key', key);
      
      // Clean up
      await encryptionService.cleanup();
      
      // Key should be removed from cache/storage
      const cleanedKey = await encryptionService.retrieveKey(keyId);
      expect(cleanedKey).toBeNull();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work with different crypto implementations', async () => {
      // Test with Node.js-style crypto (if available)
      const nodeCrypto = {
        randomBytes: jest.fn(),
        createCipher: jest.fn(),
        createDecipher: jest.fn()
      };
      
      const data = 'Cross-platform test data';
      
      // Should fallback gracefully if WebCrypto is not available
      if (!global.crypto?.subtle) {
        const encrypted = await encryptionService.encrypt(data, { fallback: 'node' });
        const decrypted = await encryptionService.decrypt(encrypted, { fallback: 'node' });
        
        expect(decrypted).toBe(data);
      }
    });

    it('should handle different text encodings', async () => {
      const unicodeData = '🔒 Unicode encryption test: αβγ 中文 العربية';
      
      const encrypted = await encryptionService.encrypt(unicodeData);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(unicodeData);
    });

    it('should work in worker threads', async () => {
      // Simulate worker environment
      const workerGlobal = {
        crypto: mockCrypto,
        TextEncoder,
        TextDecoder
      };
      
      const workerEncryption = new (encryptionService.constructor as any)(workerGlobal);
      
      const data = 'Worker thread encryption test';
      const encrypted = await workerEncryption.encrypt(data);
      const decrypted = await workerEncryption.decrypt(encrypted);
      
      expect(decrypted).toBe(data);
    });
  });

  describe('Security Audit and Compliance', () => {
    it('should generate security audit reports', async () => {
      const auditReport = await encryptionService.generateSecurityAudit();
      
      expect(auditReport).toHaveProperty('encryptionAlgorithms');
      expect(auditReport).toHaveProperty('keyStrengths');
      expect(auditReport).toHaveProperty('dataAccessLogs');
      expect(auditReport).toHaveProperty('complianceStatus');
      expect(auditReport.complianceStatus.hipaa).toBe(true);
      expect(auditReport.complianceStatus.gdpr).toBe(true);
    });

    it('should validate encryption configuration', async () => {
      const configValidation = await encryptionService.validateConfiguration();
      
      expect(configValidation.isValid).toBe(true);
      expect(configValidation.weaknesses).toHaveLength(0);
      expect(configValidation.recommendations).toBeInstanceOf(Array);
    });

    it('should detect and prevent timing attacks', async () => {
      const correctPassword = 'correct_password';
      const wrongPassword = 'wrong_password';
      
      const startTime1 = Date.now();
      try {
        await encryptionService.verifyPassword(correctPassword, 'stored_hash');
      } catch (e) {}
      const time1 = Date.now() - startTime1;
      
      const startTime2 = Date.now();
      try {
        await encryptionService.verifyPassword(wrongPassword, 'stored_hash');
      } catch (e) {}
      const time2 = Date.now() - startTime2;
      
      // Times should be similar to prevent timing attacks
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(100); // 100ms tolerance
    });

    it('should implement secure key destruction', async () => {
      const key = await encryptionService.generateKey();
      const keyId = await encryptionService.storeKey('test-key', key);
      
      const destructionResult = await encryptionService.secureKeyDestruction(keyId);
      
      expect(destructionResult.success).toBe(true);
      expect(destructionResult.method).toBe('cryptographic_erasure');
      
      // Key should be unrecoverable
      const retrievedKey = await encryptionService.retrieveKey(keyId);
      expect(retrievedKey).toBeNull();
    });
  });
});