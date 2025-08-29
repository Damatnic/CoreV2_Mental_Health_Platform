import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { Express } from 'express';
import { authService } from '../middleware/auth';
import { db } from '../config/database';

// Mock database
jest.mock('../config/database');

describe('Authentication Tests', () => {
  let app: Express;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'patient'
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    
    const { default: serverInstance } = await import('../server');
    app = serverInstance.app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    test('Should register a new user with valid data', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Email check
      (db.query as jest.Mock).mockResolvedValueOnce({ 
        rows: [{ ...mockUser, id: 'new-user-id' }] 
      }); // Insert user

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          acceptedTerms: true,
          consentToTreatment: true
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('userId');
    });

    test('Should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: 'weak',
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          acceptedTerms: true,
          consentToTreatment: true
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('path', 'password');
    });

    test('Should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          acceptedTerms: true,
          consentToTreatment: true
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('path', 'email');
    });

    test('Should reject registration without consent', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          acceptedTerms: false,
          consentToTreatment: false
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('Should reject duplicate email registration', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ 
        rows: [mockUser] 
      }); // Email already exists

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          acceptedTerms: true,
          consentToTreatment: true
        })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already registered');
    });
  });

  describe('User Login', () => {
    test('Should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 12);
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ ...mockUser, password_hash: hashedPassword }] 
        }) // Find user
        .mockResolvedValueOnce({ rows: [] }) // Reset failed logins
        .mockResolvedValueOnce({ 
          rows: [{ id: 'session-id' }] 
        }); // Create session

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockUser.email);
    });

    test('Should reject login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 12);
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ ...mockUser, password_hash: hashedPassword }] 
        }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Record failed attempt

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'wrong-password'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('Should reject login for non-existent user', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: mockUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('Should reject login for locked account', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ 
        rows: [{
          ...mockUser,
          account_locked_until: new Date(Date.now() + 3600000) // Locked for 1 hour
        }] 
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(423);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('locked');
    });

    test('Should handle 2FA if enabled', async () => {
      const secret = speakeasy.generateSecret();
      const hashedPassword = await bcrypt.hash(mockUser.password, 12);
      
      (db.query as jest.Mock).mockResolvedValueOnce({ 
        rows: [{
          ...mockUser,
          password_hash: hashedPassword,
          two_factor_enabled: true,
          two_factor_secret_encrypted: secret.base32
        }] 
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('requires2FA', true);
      expect(response.body).toHaveProperty('tempToken');
    });
  });

  describe('Token Management', () => {
    test('Should generate valid JWT token', () => {
      const token = authService.generateToken(mockUser, 'session-id');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded).toHaveProperty('userId', mockUser.id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('role', mockUser.role);
      expect(decoded).toHaveProperty('sessionId', 'session-id');
    });

    test('Should generate refresh token', () => {
      const refreshToken = authService.generateRefreshToken(mockUser.id, 'session-id');
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      expect(decoded).toHaveProperty('userId', mockUser.id);
      expect(decoded).toHaveProperty('sessionId', 'session-id');
      expect(decoded).toHaveProperty('type', 'refresh');
    });

    test('Should refresh access token with valid refresh token', async () => {
      const refreshToken = authService.generateRefreshToken(mockUser.id, 'session-id');
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'session-id',
            user_id: mockUser.id,
            refresh_token_hash: 'hash'
          }] 
        }) // Find session
        .mockResolvedValueOnce({ 
          rows: [mockUser] 
        }); // Find user

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    test('Should reject expired token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      expect(() => authService.verifyToken(expiredToken))
        .toThrow('Token expired');
    });

    test('Should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => authService.verifyToken(invalidToken))
        .toThrow('Invalid token');
    });
  });

  describe('Two-Factor Authentication', () => {
    test('Should enable 2FA', async () => {
      const token = authService.generateToken(mockUser, 'session-id');
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ ...mockUser, two_factor_enabled: false }] 
        }) // Check current status
        .mockResolvedValueOnce({ rows: [] }); // Update user

      const response = await request(app)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('backupCodes');
    });

    test('Should verify 2FA token', () => {
      const secret = speakeasy.generateSecret();
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const isValid = authService.verify2FAToken(secret.base32, token);
      expect(isValid).toBe(true);
    });

    test('Should reject invalid 2FA token', () => {
      const secret = speakeasy.generateSecret();
      const isValid = authService.verify2FAToken(secret.base32, '000000');
      expect(isValid).toBe(false);
    });

    test('Should disable 2FA with valid token', async () => {
      const jwtToken = authService.generateToken(mockUser, 'session-id');
      const secret = speakeasy.generateSecret();
      const twoFactorCode = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{
            ...mockUser,
            two_factor_enabled: true,
            two_factor_secret_encrypted: secret.base32
          }] 
        }) // Get user with 2FA
        .mockResolvedValueOnce({ rows: [] }); // Update user

      const response = await request(app)
        .post('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ twoFactorCode })
        .expect(200);

      expect(response.body).toHaveProperty('message', '2FA disabled successfully');
    });
  });

  describe('Password Management', () => {
    test('Should change password with valid current password', async () => {
      const token = authService.generateToken(mockUser, 'session-id');
      const hashedPassword = await bcrypt.hash(mockUser.password, 12);
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ ...mockUser, password_hash: hashedPassword }] 
        }) // Get user
        .mockResolvedValueOnce({ rows: [] }); // Update password

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: mockUser.password,
          newPassword: 'NewPass123!@#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Password changed successfully');
    });

    test('Should reject password change with invalid current password', async () => {
      const token = authService.generateToken(mockUser, 'session-id');
      const hashedPassword = await bcrypt.hash(mockUser.password, 12);
      
      (db.query as jest.Mock).mockResolvedValueOnce({ 
        rows: [{ ...mockUser, password_hash: hashedPassword }] 
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrong-password',
          newPassword: 'NewPass123!@#'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Current password is incorrect');
    });

    test('Should initiate password reset', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Store reset token

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: mockUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset instructions');
    });

    test('Should reset password with valid token', async () => {
      const resetToken = 'valid-reset-token';
      const hashedToken = await bcrypt.hash(resetToken, 10);
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{
            user_id: mockUser.id,
            token_hash: hashedToken,
            expires_at: new Date(Date.now() + 3600000)
          }] 
        }) // Find valid reset token
        .mockResolvedValueOnce({ rows: [] }) // Update password
        .mockResolvedValueOnce({ rows: [] }); // Delete reset token

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPass123!@#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Password reset successfully');
    });
  });

  describe('Session Management', () => {
    test('Should create session on login', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 12);
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ ...mockUser, password_hash: hashedPassword }] 
        })
        .mockResolvedValueOnce({ rows: [] }) // Reset failed logins
        .mockResolvedValueOnce({ 
          rows: [{ id: 'session-id' }] 
        }); // Create session

      await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        expect.any(Array)
      );
    });

    test('Should logout and invalidate session', async () => {
      const token = authService.generateToken(mockUser, 'session-id');
      
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ id: 'session-id', user_id: mockUser.id }] 
        }) // Find session
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Invalidate session

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    test('Should reject request with invalid session', async () => {
      const token = authService.generateToken(mockUser, 'invalid-session');
      
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Session not found

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired session');
    });

    test('Should handle session timeout', async () => {
      const token = authService.generateToken(mockUser, 'session-id');
      const expiredSession = {
        id: 'session-id',
        user_id: mockUser.id,
        expires_at: new Date(Date.now() - 3600000) // Expired 1 hour ago
      };
      
      (db.query as jest.Mock).mockResolvedValueOnce({ 
        rows: [expiredSession] 
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired session');
    });
  });

  describe('Account Security', () => {
    test('Should lock account after max failed attempts', async () => {
      for (let i = 0; i < 6; i++) {
        (db.query as jest.Mock).mockResolvedValueOnce({ 
          rows: [{ 
            ...mockUser,
            failed_login_attempts: i,
            password_hash: 'wrong-hash'
          }] 
        });
        (db.query as jest.Mock).mockResolvedValueOnce({ 
          rows: [{ failed_login_attempts: i + 1 }] 
        });

        if (i === 5) {
          (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Lock account
        }
      }

      // After 6 failed attempts, account should be locked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'wrong-password'
        });

      expect(response.status).toBe(423);
    });

    test('Should validate password complexity', () => {
      const weakPasswords = [
        'short',           // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!',      // No numbers
        'NoSpecial123',    // No special chars
      ];

      weakPasswords.forEach(password => {
        expect(() => authService.validatePasswordStrength(password))
          .toThrow();
      });

      const strongPassword = 'Strong123!@#';
      expect(() => authService.validatePasswordStrength(strongPassword))
        .not.toThrow();
    });
  });
});

describe('OAuth Authentication Tests', () => {
  let app: Express;

  beforeAll(async () => {
    const { default: serverInstance } = await import('../server');
    app = serverInstance.app;
  });

  test('Should redirect to Google OAuth', async () => {
    const response = await request(app)
      .get('/api/auth/google')
      .expect(302);

    expect(response.headers.location).toContain('accounts.google.com');
  });

  test('Should handle OAuth callback', async () => {
    // Mock OAuth callback
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // Check existing user
      .mockResolvedValueOnce({ 
        rows: [{ id: 'oauth-user-id', email: 'oauth@example.com' }] 
      }); // Create user

    // This would require mocking passport strategies
    // For now, we just test the endpoint exists
    const response = await request(app)
      .get('/api/auth/google/callback?code=test-code')
      .expect(302);

    expect(response.headers.location).toBeDefined();
  });
});