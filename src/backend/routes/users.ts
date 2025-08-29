import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/users.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * HIPAA-compliant audit logging
 */
const auditLog = async (
  userId: string,
  action: string,
  resourceId: string | null,
  details: any,
  req: Request
) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent, request_id, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId,
        action,
        'user',
        resourceId,
        JSON.stringify(details),
        req.ip,
        req.headers['user-agent'],
        req.headers['x-request-id'] || uuidv4()
      ]
    );
  } catch (error) {
    logger.error('Failed to create audit log', { error, action, userId });
  }
};

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await db.query(
      `SELECT 
        id, email, role, display_name, avatar, bio,
        two_factor_enabled, email_verified,
        created_at, updated_at, last_login_at, last_activity_at,
        terms_accepted_at, privacy_accepted_at, data_retention_consent
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get professional profile if applicable
    let professionalProfile = null;
    if (['therapist', 'psychiatrist', 'helper'].includes(user.role)) {
      const profileResult = await db.query(
        `SELECT 
          verification_status, verified_at, specializations, languages,
          timezone, accepting_clients, session_rate, insurance_accepted
        FROM professional_profiles 
        WHERE user_id = $1`,
        [userId]
      );
      
      if (profileResult.rows.length > 0) {
        professionalProfile = profileResult.rows[0];
      }
    }

    // Get emergency contacts (encrypted)
    const contactsResult = await db.query(
      `SELECT id, name, relationship, phone_number, is_primary
       FROM emergency_contacts 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_primary DESC, created_at ASC`,
      [userId]
    );

    // Decrypt encrypted fields
    const emergencyContacts = contactsResult.rows.map(contact => ({
      ...contact,
      phone_number: contact.phone_number ? db.decrypt(contact.phone_number) : null
    }));

    // Audit log for PHI access
    await auditLog(userId, 'view_profile', userId, { self_access: true }, req);

    res.json({
      user,
      professionalProfile,
      emergencyContacts
    });
  } catch (error: any) {
    logger.error('Failed to get user profile', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', 
  authenticate,
  [
    body('displayName').optional().isLength({ min: 1, max: 100 }),
    body('bio').optional().isLength({ max: 500 }),
    body('avatar').optional().isURL(),
    body('timezone').optional().isString(),
    body('languages').optional().isArray(),
    body('specializations').optional().isArray()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { 
        displayName, bio, avatar, timezone, 
        languages, specializations 
      } = req.body;

      // Start transaction
      const result = await db.transaction(async (client) => {
        // Update user profile
        const updateData: any = {
          updated_at: new Date()
        };

        if (displayName !== undefined) updateData.display_name = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;

        const userResult = await client.query(
          `UPDATE users 
           SET display_name = COALESCE($2, display_name),
               bio = COALESCE($3, bio),
               avatar = COALESCE($4, avatar),
               updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL
           RETURNING id, email, role, display_name, avatar, bio`,
          [userId, displayName, bio, avatar]
        );

        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }

        // Update professional profile if applicable
        if (['therapist', 'psychiatrist', 'helper'].includes(req.user!.role)) {
          if (timezone || languages || specializations) {
            await client.query(
              `UPDATE professional_profiles 
               SET timezone = COALESCE($2, timezone),
                   languages = COALESCE($3, languages),
                   specializations = COALESCE($4, specializations),
                   updated_at = NOW()
               WHERE user_id = $1`,
              [userId, timezone, languages, specializations]
            );
          }
        }

        return userResult.rows[0];
      });

      // Audit log
      await auditLog(userId, 'update_profile', userId, { 
        fields_updated: Object.keys(req.body) 
      }, req);

      res.json({ 
        message: 'Profile updated successfully',
        user: result 
      });
    } catch (error: any) {
      logger.error('Failed to update user profile', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * DELETE /api/users/account
 * Delete user account (soft delete with HIPAA compliance)
 */
router.delete('/account', 
  authenticate,
  [
    body('password').notEmpty().withMessage('Password required for account deletion'),
    body('reason').optional().isString(),
    body('feedback').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { password, reason, feedback } = req.body;

      // Verify password
      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const bcrypt = require('bcrypt');
      const isValidPassword = await bcrypt.compare(
        password, 
        userResult.rows[0].password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Perform soft delete with transaction
      await db.transaction(async (client) => {
        // Cancel any active subscriptions
        await client.query(
          `UPDATE subscriptions 
           SET status = 'cancelled', cancelled_at = NOW()
           WHERE user_id = $1 AND status = 'active'`,
          [userId]
        );

        // Anonymize personal data (HIPAA compliant)
        const anonymousId = `deleted_${uuidv4()}`;
        await client.query(
          `UPDATE users 
           SET email = $2,
               display_name = 'Deleted User',
               first_name = NULL,
               last_name = NULL,
               bio = NULL,
               avatar = NULL,
               password_hash = NULL,
               two_factor_secret = NULL,
               deleted_at = NOW(),
               deletion_reason = $3,
               deletion_feedback = $4
           WHERE id = $1`,
          [userId, `${anonymousId}@deleted.local`, reason, feedback]
        );

        // Archive user data for legal retention (7 years for HIPAA)
        await client.query(
          `INSERT INTO archived_users (
            user_id, archived_data, deletion_reason, 
            deletion_feedback, archived_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [
            userId,
            db.encrypt(JSON.stringify(userResult.rows[0])),
            reason,
            feedback
          ]
        );

        // Invalidate all sessions
        await client.query(
          `UPDATE sessions 
           SET revoked_at = NOW(), revocation_reason = 'Account deleted'
           WHERE user_id = $1`,
          [userId]
        );
      });

      // Final audit log
      await auditLog(userId, 'delete_account', userId, { 
        reason, 
        feedback,
        retention_period_years: 7 
      }, req);

      res.json({ 
        message: 'Account successfully deleted',
        note: 'Your data will be retained for 7 years per HIPAA requirements in anonymized form'
      });
    } catch (error: any) {
      logger.error('Failed to delete user account', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
);

/**
 * POST /api/users/emergency-contacts
 * Add emergency contact
 */
router.post('/emergency-contacts',
  authenticate,
  [
    body('name').notEmpty().isLength({ max: 100 }),
    body('relationship').notEmpty().isLength({ max: 50 }),
    body('phoneNumber').notEmpty().matches(/^[\d\s\-\+\(\)]+$/),
    body('isPrimary').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { name, relationship, phoneNumber, isPrimary } = req.body;

      // If setting as primary, unset other primary contacts
      if (isPrimary) {
        await db.query(
          'UPDATE emergency_contacts SET is_primary = false WHERE user_id = $1',
          [userId]
        );
      }

      // Encrypt phone number
      const encryptedPhone = db.encrypt(phoneNumber);

      const result = await db.query(
        `INSERT INTO emergency_contacts (
          id, user_id, name, relationship, phone_number, is_primary, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, name, relationship, is_primary`,
        [uuidv4(), userId, name, relationship, encryptedPhone, isPrimary || false]
      );

      // Audit log
      await auditLog(userId, 'add_emergency_contact', result.rows[0].id, {
        relationship,
        is_primary: isPrimary
      }, req);

      res.status(201).json({
        message: 'Emergency contact added successfully',
        contact: {
          ...result.rows[0],
          phoneNumber: phoneNumber // Return unencrypted for confirmation
        }
      });
    } catch (error: any) {
      logger.error('Failed to add emergency contact', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({ error: 'Failed to add emergency contact' });
    }
  }
);

/**
 * GET /api/users/settings
 * Get user settings
 */
router.get('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await db.query(
      `SELECT 
        notification_preferences,
        privacy_settings,
        theme_preferences,
        language_preference,
        timezone,
        data_sharing_consent,
        marketing_consent,
        analytics_consent
      FROM user_settings 
      WHERE user_id = $1`,
      [userId]
    );

    let settings = result.rows[0];
    
    // Create default settings if not exist
    if (!settings) {
      const defaultSettings = {
        notification_preferences: {
          email: true,
          push: true,
          sms: false,
          appointment_reminders: true,
          medication_reminders: true,
          mood_check_reminders: true,
          crisis_alerts: true
        },
        privacy_settings: {
          profile_visibility: 'private',
          share_mood_data: false,
          share_progress: false,
          anonymous_data_usage: true
        },
        theme_preferences: {
          mode: 'light',
          color_scheme: 'default',
          font_size: 'medium',
          high_contrast: false
        },
        language_preference: 'en',
        timezone: 'America/New_York',
        data_sharing_consent: false,
        marketing_consent: false,
        analytics_consent: true
      };

      const insertResult = await db.query(
        `INSERT INTO user_settings (
          user_id, notification_preferences, privacy_settings,
          theme_preferences, language_preference, timezone,
          data_sharing_consent, marketing_consent, analytics_consent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userId,
          JSON.stringify(defaultSettings.notification_preferences),
          JSON.stringify(defaultSettings.privacy_settings),
          JSON.stringify(defaultSettings.theme_preferences),
          defaultSettings.language_preference,
          defaultSettings.timezone,
          defaultSettings.data_sharing_consent,
          defaultSettings.marketing_consent,
          defaultSettings.analytics_consent
        ]
      );

      settings = insertResult.rows[0];
    }

    res.json({ settings });
  } catch (error: any) {
    logger.error('Failed to get user settings', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * PUT /api/users/settings
 * Update user settings
 */
router.put('/settings',
  authenticate,
  [
    body('notificationPreferences').optional().isObject(),
    body('privacySettings').optional().isObject(),
    body('themePreferences').optional().isObject(),
    body('languagePreference').optional().isString(),
    body('timezone').optional().isString(),
    body('dataSharing Consent').optional().isBoolean(),
    body('marketingConsent').optional().isBoolean(),
    body('analyticsConsent').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const updates = req.body;

      // Build update query dynamically
      const updateFields = [];
      const values = [userId];
      let paramCount = 2;

      Object.keys(updates).forEach(key => {
        const snakeCase = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updateFields.push(`${snakeCase} = $${paramCount}`);
        values.push(
          typeof updates[key] === 'object' 
            ? JSON.stringify(updates[key]) 
            : updates[key]
        );
        paramCount++;
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const result = await db.query(
        `UPDATE user_settings 
         SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        values
      );

      // Audit log for privacy settings changes
      if (updates.privacySettings || updates.dataSharingConsent) {
        await auditLog(userId, 'update_privacy_settings', userId, {
          changes: updates
        }, req);
      }

      res.json({
        message: 'Settings updated successfully',
        settings: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Failed to update user settings', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

export default router;