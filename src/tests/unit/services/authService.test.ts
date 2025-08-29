import authService from '../../../services/auth/authService';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../../services/encryptionService');
jest.mock('../../../services/apiClient');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const mockEncryptionService = require('../../../services/encryptionService');
const mockApiClient = require('../../../services/apiClient');
const mockJwt = require('jsonwebtoken');
const mockBcrypt = require('bcryptjs');

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

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Default mocks
    mockEncryptionService.encrypt.mockImplementation((data: string) => `encrypted_${data}`);
    mockEncryptionService.decrypt.mockImplementation((data: string) => data.replace('encrypted_', ''));
    mockBcrypt.hash.mockResolvedValue('hashedPassword123');
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('mock.jwt.token');
    mockJwt.verify.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          user: {
            id: 'user123',
            email: 'test@example.com',
            username: 'testuser'
          },
          token: 'mock.jwt.token'
        }
      });

      const userData = {
        email: 'test@example.com',
        password: 'securePassword123',
        username: 'testuser',
        agreeToTerms: true
      };

      const result = await authService.register(userData);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('securePassword123', 12);
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'hashedPassword123',
        username: 'testuser',
        agreeToTerms: true
      });
      
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'encrypted_mock.jwt.token');
    });

    it('should validate required registration fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // too short
        username: '',
        agreeToTerms: false
      };

      await expect(authService.register(invalidData)).rejects.toThrow('Invalid registration data');
      
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle duplicate email registration', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'Email already exists' }
        }
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'testuser',
        agreeToTerms: true
      };

      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
    });

    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        'PASSWORD123', // no lowercase
        'password123', // no uppercase
        'Password', // no numbers
      ];

      for (const password of weakPasswords) {
        const userData = {
          email: 'test@example.com',
          password,
          username: 'testuser',
          agreeToTerms: true
        };

        await expect(authService.register(userData)).rejects.toThrow(/password/i);
      }
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          user: {
            id: 'user123',
            email: 'test@example.com',
            roles: ['user']
          },
          token: 'valid.jwt.token',
          refreshToken: 'refresh.token'
        }
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        deviceInfo: expect.any(Object)
      });

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'encrypted_valid.jwt.token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'encrypted_refresh.token');
    });

    it('should reject invalid credentials', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      });

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle account lockout', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 423,
          data: { 
            message: 'Account locked',
            lockoutUntil: Date.now() + 300000
          }
        }
      });

      await expect(authService.login('locked@example.com', 'password')).rejects.toThrow('Account locked');
    });

    it('should implement rate limiting', async () => {
      // Simulate rapid login attempts
      const loginPromises = Array(10).fill(null).map(() => 
        authService.login('test@example.com', 'password')
      );

      // Some should be rate limited
      const results = await Promise.allSettled(loginPromises);
      const rejected = results.filter(r => r.status === 'rejected');
      
      expect(rejected.length).toBeGreaterThan(0);
    });
  });

  describe('Token Management', () => {
    it('should validate JWT tokens correctly', async () => {
      const validToken = 'valid.jwt.token';
      mockJwt.verify.mockReturnValueOnce({
        userId: 'user123',
        email: 'test@example.com',
        exp: Date.now() / 1000 + 3600 // 1 hour from now
      });

      const result = await authService.validateToken(validToken);

      expect(result.valid).toBe(true);
      expect(result.payload.userId).toBe('user123');
    });

    it('should reject expired tokens', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });

      const result = await authService.validateToken('expired.token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should refresh expired tokens automatically', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'encrypted_refresh.token';
        return null;
      });

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'new.access.token',
          refreshToken: 'new.refresh.token'
        }
      });

      const result = await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh.token'
      });

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'encrypted_new.access.token');
    });

    it('should handle refresh token expiration', async () => {
      localStorageMock.getItem.mockReturnValue('encrypted_expired.refresh.token');
      
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Refresh token expired' }
        }
      });

      await expect(authService.refreshToken()).rejects.toThrow('Refresh token expired');
      
      // Should clear all tokens
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should initiate 2FA setup', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          qrCode: 'data:image/png;base64,mockqrcode',
          backupCodes: ['123456', '789012'],
          secret: 'MOCK2FASECRET'
        }
      });

      const result = await authService.setup2FA('user123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/setup', {
        userId: 'user123'
      });

      expect(result.qrCode).toBeDefined();
      expect(result.backupCodes).toHaveLength(2);
    });

    it('should verify 2FA codes', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          valid: true
        }
      });

      const result = await authService.verify2FA('user123', '123456');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/verify', {
        userId: 'user123',
        code: '123456'
      });

      expect(result.valid).toBe(true);
    });

    it('should handle invalid 2FA codes', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          valid: false,
          attemptsRemaining: 2
        }
      });

      const result = await authService.verify2FA('user123', 'invalid');

      expect(result.valid).toBe(false);
      expect(result.attemptsRemaining).toBe(2);
    });

    it('should support backup codes for 2FA', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          valid: true,
          backupCodeUsed: true,
          remainingBackupCodes: 7
        }
      });

      const result = await authService.verify2FA('user123', '123456', true);

      expect(result.valid).toBe(true);
      expect(result.backupCodeUsed).toBe(true);
    });
  });

  describe('Password Management', () => {
    it('should initiate password reset', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Reset email sent'
        }
      });

      const result = await authService.requestPasswordReset('user@example.com');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/password-reset', {
        email: 'user@example.com'
      });

      expect(result.success).toBe(true);
    });

    it('should reset password with valid token', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Password reset successfully'
        }
      });

      const result = await authService.resetPassword('reset-token', 'newPassword123');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
        token: 'reset-token',
        password: 'hashedPassword123'
      });

      expect(result.success).toBe(true);
    });

    it('should change password for authenticated user', async () => {
      localStorageMock.getItem.mockReturnValue('encrypted_user.token');
      
      mockApiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Password changed successfully'
        }
      });

      const result = await authService.changePassword('oldPassword', 'newPassword123');

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/password', {
        currentPassword: 'oldPassword',
        newPassword: 'hashedPassword123'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should check if user is authenticated', () => {
      localStorageMock.getItem.mockReturnValue('encrypted_valid.token');
      mockJwt.verify.mockReturnValue({ userId: 'user123' });

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false for invalid tokens', () => {
      localStorageMock.getItem.mockReturnValue('encrypted_invalid.token');
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should get current user info', async () => {
      localStorageMock.getItem.mockReturnValue('encrypted_user.token');
      mockJwt.verify.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        roles: ['user']
      });

      const result = await authService.getCurrentUser();

      expect(result.id).toBe('user123');
      expect(result.email).toBe('test@example.com');
      expect(result.roles).toContain('user');
    });

    it('should logout user completely', async () => {
      localStorageMock.getItem.mockReturnValue('encrypted_user.token');
      
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true }
      });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userProfile');
    });

    it('should handle concurrent logout', async () => {
      // Simulate multiple logout calls
      const logoutPromises = [
        authService.logout(),
        authService.logout(),
        authService.logout()
      ];

      await Promise.all(logoutPromises);

      // Should only make one API call
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should check user permissions', () => {
      const userRoles = ['user', 'helper'];
      
      expect(authService.hasPermission(userRoles, 'read_posts')).toBe(true);
      expect(authService.hasPermission(userRoles, 'moderate_posts')).toBe(false);
      expect(authService.hasPermission(userRoles, 'admin_access')).toBe(false);
    });

    it('should validate admin permissions', () => {
      const adminRoles = ['user', 'admin'];
      
      expect(authService.hasPermission(adminRoles, 'admin_access')).toBe(true);
      expect(authService.hasPermission(adminRoles, 'moderate_posts')).toBe(true);
      expect(authService.hasPermission(adminRoles, 'manage_users')).toBe(true);
    });

    it('should handle role hierarchy correctly', () => {
      const moderatorRoles = ['user', 'moderator'];
      
      expect(authService.hasPermission(moderatorRoles, 'read_posts')).toBe(true);
      expect(authService.hasPermission(moderatorRoles, 'moderate_posts')).toBe(true);
      expect(authService.hasPermission(moderatorRoles, 'admin_access')).toBe(false);
    });
  });

  describe('Security Features', () => {
    it('should detect suspicious login patterns', async () => {
      const suspiciousAttempts = [
        { ip: '192.168.1.1', userAgent: 'Browser1', location: 'US' },
        { ip: '10.0.0.1', userAgent: 'Browser2', location: 'CN' },
        { ip: '172.16.0.1', userAgent: 'Browser3', location: 'RU' }
      ];

      const result = authService.detectSuspiciousActivity(suspiciousAttempts);

      expect(result.suspicious).toBe(true);
      expect(result.reasons).toContain('multiple_locations');
      expect(result.reasons).toContain('multiple_ips');
    });

    it('should implement device fingerprinting', () => {
      const deviceInfo = authService.generateDeviceFingerprint();

      expect(deviceInfo).toHaveProperty('userAgent');
      expect(deviceInfo).toHaveProperty('screen');
      expect(deviceInfo).toHaveProperty('timezone');
      expect(deviceInfo).toHaveProperty('language');
    });

    it('should track failed login attempts', async () => {
      const email = 'test@example.com';
      
      // Simulate failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(email, 'wrongpassword');
        } catch (error) {
          // Expected to fail
        }
      }

      const attempts = authService.getFailedAttempts(email);
      expect(attempts).toBeGreaterThanOrEqual(5);
    });

    it('should implement account lockout after failed attempts', async () => {
      const email = 'test@example.com';
      
      // Set high failed attempt count
      authService.setFailedAttempts(email, 10);
      
      await expect(authService.login(email, 'password')).rejects.toThrow(/account.*locked/i);
    });
  });

  describe('Data Privacy and Encryption', () => {
    it('should encrypt sensitive data before storage', () => {
      const sensitiveData = {
        email: 'user@example.com',
        personalInfo: 'sensitive details'
      };

      authService.secureStore('userData', sensitiveData);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        JSON.stringify(sensitiveData)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userData',
        'encrypted_' + JSON.stringify(sensitiveData)
      );
    });

    it('should decrypt data when retrieving', () => {
      const encryptedData = 'encrypted_{"email":"user@example.com"}';
      localStorageMock.getItem.mockReturnValue(encryptedData);

      const result = authService.secureRetrieve('userData');

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(encryptedData);
      expect(result.email).toBe('user@example.com');
    });

    it('should handle encryption errors gracefully', () => {
      mockEncryptionService.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      expect(() => {
        authService.secureStore('test', { data: 'sensitive' });
      }).not.toThrow();

      // Should log error but not crash
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network errors gracefully', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow('Network error');
    });

    it('should retry failed requests', async () => {
      mockApiClient.post
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          data: { success: true, token: 'success.token' }
        });

      const result = await authService.login('test@example.com', 'password');

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should handle malformed responses', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: null // Malformed response
      });

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow(/invalid response/i);
    });

    it('should validate input parameters', async () => {
      await expect(authService.login('', 'password')).rejects.toThrow(/email.*required/i);
      await expect(authService.login('invalid-email', 'password')).rejects.toThrow(/invalid email/i);
      await expect(authService.login('test@example.com', '')).rejects.toThrow(/password.*required/i);
    });
  });
});