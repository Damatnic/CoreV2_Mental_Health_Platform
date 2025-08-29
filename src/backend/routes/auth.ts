import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import winston from 'winston';
import { authService, authenticate } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import { EmailService } from '../services/email';
import { AuditService } from '../services/audit';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/auth.log' }),
    new winston.transports.Console()
  ]
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('role').optional().isIn(['patient', 'therapist', 'psychiatrist']),
    body('acceptedTerms').isBoolean().equals('true'),
    body('consentToTreatment').isBoolean().equals('true')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        dateOfBirth,
        phone,
        role = 'patient',
        acceptedTerms,
        consentToTreatment
      } = req.body;

      // Check if user already exists
      const existingUser = await dbHelpers.findOne('users', { email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Encrypt sensitive data
      const encryptedData = {
        email_encrypted: db.encrypt(email),
        first_name_encrypted: db.encrypt(firstName),
        last_name_encrypted: db.encrypt(lastName),
        date_of_birth_encrypted: dateOfBirth ? db.encrypt(dateOfBirth) : null,
        phone_encrypted: phone ? db.encrypt(phone) : null
      };

      // Create user
      const userId = uuidv4();
      const user = await db.query(
        `INSERT INTO users (
          id, email, email_encrypted, password_hash, role,
          first_name_encrypted, last_name_encrypted, 
          date_of_birth_encrypted, phone_encrypted,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, email, role`,
        [
          userId,
          email,
          encryptedData.email_encrypted,
          passwordHash,
          role,
          encryptedData.first_name_encrypted,
          encryptedData.last_name_encrypted,
          encryptedData.date_of_birth_encrypted,
          encryptedData.phone_encrypted
        ]
      );

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await db.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [userId, verificationToken]
      );

      // Send welcome email
      await EmailService.sendWelcomeEmail(email, firstName, verificationToken);

      // Log registration for audit
      await AuditService.log({
        userId,
        action: 'user_registration',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Generate tokens
      const sessionId = uuidv4();
      const accessToken = authService.generateToken(user.rows[0], sessionId);
      const refreshToken = authService.generateRefreshToken(userId, sessionId);

      // Create session
      await authService.createSession(userId, accessToken, refreshToken, req);

      logger.info('User registered successfully', { userId, email, role });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: userId,
          email,
          role,
          emailVerified: false
        },
        accessToken,
        refreshToken,
        sessionId
      });
    } catch (error) {
      logger.error('Registration failed', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('twoFactorCode').optional().isLength({ min: 6, max: 6 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, twoFactorCode } = req.body;

      // Check if account is locked
      if (await authService.isAccountLocked(email)) {
        return res.status(423).json({ 
          error: 'Account temporarily locked due to multiple failed login attempts',
          retryAfter: 1800 // 30 minutes in seconds
        });
      }

      // Find user
      const userResult = await db.query(
        `SELECT id, email, password_hash, role, two_factor_enabled, 
                two_factor_secret_encrypted, email_verified
         FROM users 
         WHERE email = $1 AND deleted_at IS NULL`,
        [email]
      );

      if (userResult.rows.length === 0) {
        await authService.recordFailedLogin(email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Verify password
      const validPassword = await authService.verifyPassword(password, user.password_hash);
      if (!validPassword) {
        await authService.recordFailedLogin(email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check 2FA if enabled
      if (user.two_factor_enabled) {
        if (!twoFactorCode) {
          return res.status(200).json({ 
            requiresTwoFactor: true,
            message: 'Please provide 2FA code'
          });
        }

        const secret = db.decrypt(user.two_factor_secret_encrypted);
        if (!authService.verify2FAToken(secret, twoFactorCode)) {
          return res.status(401).json({ error: 'Invalid 2FA code' });
        }
      }

      // Reset failed login attempts
      await authService.resetFailedLogins(user.id);

      // Generate tokens
      const sessionId = uuidv4();
      const accessToken = authService.generateToken(user, sessionId);
      const refreshToken = authService.generateRefreshToken(user.id, sessionId);

      // Create session
      await authService.createSession(user.id, accessToken, refreshToken, req);

      // Update last login
      await db.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Log login for audit
      await AuditService.log({
        userId: user.id,
        action: 'user_login',
        resourceType: 'session',
        resourceId: sessionId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      logger.info('User logged in successfully', { userId: user.id, email });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified
        },
        accessToken,
        refreshToken,
        sessionId
      });
    } catch (error) {
      logger.error('Login failed', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const sessionId = req.sessionId;
    
    if (sessionId) {
      await authService.invalidateSession(sessionId, 'User logout');
      
      // Log logout for audit
      await AuditService.log({
        userId: req.user?.id,
        action: 'user_logout',
        resourceType: 'session',
        resourceId: sessionId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const payload = authService.verifyRefreshToken(refreshToken);
      
      // Check if session is still valid
      const sessionResult = await db.query(
        `SELECT s.*, u.email, u.role 
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1 
           AND s.revoked_at IS NULL 
           AND s.refresh_expires_at > NOW()`,
        [payload.sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const session = sessionResult.rows[0];
      
      // Generate new access token
      const newAccessToken = authService.generateToken(
        { id: session.user_id, email: session.email, role: session.role },
        payload.sessionId
      );

      // Update session
      await db.query(
        'UPDATE sessions SET last_accessed_at = NOW() WHERE id = $1',
        [payload.sessionId]
      );

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      logger.error('Token refresh failed', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Find user
      const user = await dbHelpers.findOne('users', { email });
      
      if (user) {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Store reset token
        await db.query(
          `INSERT INTO password_resets (user_id, token_hash, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '1 hour')
           ON CONFLICT (user_id) DO UPDATE 
           SET token_hash = $2, expires_at = NOW() + INTERVAL '1 hour'`,
          [user.id, hashedToken]
        );

        // Send reset email
        await EmailService.sendPasswordResetEmail(email, resetToken);

        // Log for audit
        await AuditService.log({
          userId: user.id,
          action: 'password_reset_requested',
          resourceType: 'user',
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      // Always return success to prevent email enumeration
      res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent' 
      });
    } catch (error) {
      logger.error('Password reset request failed', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  ],
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      // Hash token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const resetResult = await db.query(
        `SELECT pr.*, u.email 
         FROM password_resets pr
         JOIN users u ON pr.user_id = u.id
         WHERE pr.token_hash = $1 
           AND pr.expires_at > NOW() 
           AND pr.used_at IS NULL`,
        [hashedToken]
      );

      if (resetResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const reset = resetResult.rows[0];

      // Hash new password
      const passwordHash = await authService.hashPassword(password);

      // Update password
      await db.query(
        `UPDATE users 
         SET password_hash = $1, password_changed_at = NOW() 
         WHERE id = $2`,
        [passwordHash, reset.user_id]
      );

      // Mark token as used
      await db.query(
        'UPDATE password_resets SET used_at = NOW() WHERE user_id = $1',
        [reset.user_id]
      );

      // Invalidate all existing sessions
      await db.query(
        `UPDATE sessions 
         SET revoked_at = NOW(), revocation_reason = 'Password reset' 
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [reset.user_id]
      );

      // Send confirmation email
      await EmailService.sendPasswordChangedEmail(reset.email);

      // Log for audit
      await AuditService.log({
        userId: reset.user_id,
        action: 'password_reset_completed',
        resourceType: 'user',
        resourceId: reset.user_id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      logger.error('Password reset failed', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post('/verify-email',
  [body('token').notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      // Find valid verification token
      const verificationResult = await db.query(
        `SELECT * FROM email_verifications 
         WHERE token = $1 
           AND expires_at > NOW() 
           AND verified_at IS NULL`,
        [token]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      const verification = verificationResult.rows[0];

      // Mark email as verified
      await db.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [verification.user_id]
      );

      // Mark token as used
      await db.query(
        'UPDATE email_verifications SET verified_at = NOW() WHERE id = $1',
        [verification.id]
      );

      // Log for audit
      await AuditService.log({
        userId: verification.user_id,
        action: 'email_verified',
        resourceType: 'user',
        resourceId: verification.user_id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      logger.error('Email verification failed', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }
);

/**
 * POST /api/auth/2fa/enable
 * Enable two-factor authentication
 */
router.post('/2fa/enable', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Generate 2FA secret
    const secret = authService.generate2FASecret(req.user!.email);
    
    // Encrypt and store secret
    const encryptedSecret = db.encrypt(secret.base32);
    
    await db.query(
      `UPDATE users 
       SET two_factor_secret_encrypted = $1, two_factor_enabled = false 
       WHERE id = $2`,
      [encryptedSecret, userId]
    );

    res.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes: generateBackupCodes()
    });
  } catch (error) {
    logger.error('2FA enable failed', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

/**
 * POST /api/auth/2fa/verify
 * Verify and activate 2FA
 */
router.post('/2fa/verify', 
  authenticate,
  [body('code').isLength({ min: 6, max: 6 })],
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const userId = req.user!.id;

      // Get user's 2FA secret
      const result = await db.query(
        'SELECT two_factor_secret_encrypted FROM users WHERE id = $1',
        [userId]
      );

      if (!result.rows[0]?.two_factor_secret_encrypted) {
        return res.status(400).json({ error: '2FA not configured' });
      }

      const secret = db.decrypt(result.rows[0].two_factor_secret_encrypted);

      // Verify code
      if (!authService.verify2FAToken(secret, code)) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Enable 2FA
      await db.query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [userId]
      );

      res.json({ message: '2FA enabled successfully' });
    } catch (error) {
      logger.error('2FA verification failed', error);
      res.status(500).json({ error: 'Failed to verify 2FA' });
    }
  }
);

/**
 * Generate backup codes for 2FA
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

export default router;