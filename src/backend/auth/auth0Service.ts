/**
 * Production Auth0 Authentication Service
 * Implements secure authentication with professional verification
 * HIPAA-compliant with role-based access control
 */

import { ManagementClient, AuthenticationClient } from 'auth0';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { getDatabase } from '../database/connection';
import { users, professionalProfiles, auditLogs } from '../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Auth0 configuration
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'] as const,
};

// JWKS client for token verification
const jwksClient = jwksRsa({
  jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// User roles with permissions
export const ROLES = {
  USER: 'user',
  HELPER: 'helper',
  THERAPIST: 'therapist',
  PSYCHIATRIST: 'psychiatrist',
  CRISIS_COUNSELOR: 'crisis_counselor',
  ADMIN: 'admin',
} as const;

export const PERMISSIONS = {
  // User permissions
  'user:read': 'Read own user data',
  'user:write': 'Update own user data',
  'mood:write': 'Track mood entries',
  'journal:write': 'Write journal entries',
  'safety_plan:write': 'Create safety plans',
  
  // Helper permissions
  'session:conduct': 'Conduct support sessions',
  'message:moderate': 'Moderate messages',
  'user:support': 'Provide user support',
  
  // Therapist permissions
  'assessment:review': 'Review assessments',
  'treatment:plan': 'Create treatment plans',
  'notes:clinical': 'Write clinical notes',
  
  // Psychiatrist permissions
  'medication:prescribe': 'Prescribe medications',
  'diagnosis:make': 'Make diagnoses',
  
  // Crisis counselor permissions
  'crisis:respond': 'Respond to crisis events',
  'crisis:escalate': 'Escalate crisis situations',
  '988:contact': 'Contact 988 services',
  
  // Admin permissions
  'user:manage': 'Manage all users',
  'system:configure': 'Configure system settings',
  'data:export': 'Export system data',
  'audit:view': 'View audit logs',
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    'user:read',
    'user:write',
    'mood:write',
    'journal:write',
    'safety_plan:write',
  ],
  [ROLES.HELPER]: [
    ...ROLE_PERMISSIONS[ROLES.USER],
    'session:conduct',
    'message:moderate',
    'user:support',
  ],
  [ROLES.THERAPIST]: [
    ...ROLE_PERMISSIONS[ROLES.HELPER],
    'assessment:review',
    'treatment:plan',
    'notes:clinical',
  ],
  [ROLES.PSYCHIATRIST]: [
    ...ROLE_PERMISSIONS[ROLES.THERAPIST],
    'medication:prescribe',
    'diagnosis:make',
  ],
  [ROLES.CRISIS_COUNSELOR]: [
    ...ROLE_PERMISSIONS[ROLES.HELPER],
    'crisis:respond',
    'crisis:escalate',
    '988:contact',
  ],
  [ROLES.ADMIN]: Object.keys(PERMISSIONS),
};

export class Auth0Service {
  private management: ManagementClient;
  private authentication: AuthenticationClient;
  private db = getDatabase();

  constructor() {
    // Initialize Auth0 Management API client
    this.management = new ManagementClient({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      clientSecret: auth0Config.clientSecret,
      scope: 'read:users update:users create:users delete:users',
    });

    // Initialize Auth0 Authentication API client
    this.authentication = new AuthenticationClient({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      clientSecret: auth0Config.clientSecret,
    });
  }

  /**
   * Register a new user with Auth0 and local database
   */
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: keyof typeof ROLES;
    isAnonymous?: boolean;
  }) {
    try {
      let auth0User;
      let localUser;

      if (data.isAnonymous) {
        // Create anonymous user without Auth0
        const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        localUser = await this.db.getDb().insert(users).values({
          email: `${anonymousId}@anonymous.local`,
          isAnonymous: true,
          anonymousId,
          role: 'user',
          displayName: 'Anonymous User',
        }).returning();

        // Generate temporary JWT for anonymous user
        const token = this.generateAnonymousToken(localUser[0]);
        
        await this.logAudit(localUser[0].id, 'user.register.anonymous', 'users', {
          anonymousId,
        });

        return {
          user: this.sanitizeUser(localUser[0]),
          token,
          isAnonymous: true,
        };
      }

      // Create user in Auth0
      auth0User = await this.management.createUser({
        email: data.email,
        password: data.password,
        email_verified: false,
        connection: 'Username-Password-Authentication',
        user_metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || ROLES.USER,
        },
      });

      // Hash password for local storage (backup)
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user in local database
      localUser = await this.db.getDb().insert(users).values({
        email: data.email,
        passwordHash: this.db.encrypt(passwordHash),
        firstName: data.firstName ? this.db.encrypt(data.firstName) : null,
        lastName: data.lastName ? this.db.encrypt(data.lastName) : null,
        role: data.role || 'user',
        displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email.split('@')[0],
      }).returning();

      // Assign role and permissions in Auth0
      await this.assignRole(auth0User.user_id!, data.role || ROLES.USER);

      // Send verification email
      await this.sendVerificationEmail(data.email);

      // Log registration
      await this.logAudit(localUser[0].id, 'user.register', 'users', {
        email: data.email,
        role: data.role,
      });

      return {
        user: this.sanitizeUser(localUser[0]),
        auth0Id: auth0User.user_id,
        requiresVerification: true,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Authenticate user with Auth0
   */
  async login(email: string, password: string, totpCode?: string) {
    try {
      // Get user from database
      const dbUser = await this.db.getDb()
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!dbUser.length) {
        throw new Error('Invalid credentials');
      }

      const user = dbUser[0];

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is temporarily locked');
      }

      // Verify 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!totpCode) {
          return { requires2FA: true };
        }

        const secret = this.db.decrypt(user.twoFactorSecret!);
        const verified = speakeasy.totp.verify({
          secret,
          encoding: 'base32',
          token: totpCode,
          window: 2,
        });

        if (!verified) {
          await this.incrementLoginAttempts(user.id);
          throw new Error('Invalid 2FA code');
        }
      }

      // Authenticate with Auth0
      const auth0Token = await this.authentication.oauth.passwordGrant({
        username: email,
        password,
        audience: auth0Config.audience,
        scope: 'openid profile email offline_access',
      });

      // Update last login
      await this.db.getDb()
        .update(users)
        .set({
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
          loginAttempts: 0,
        })
        .where(eq(users.id, user.id));

      // Get user permissions
      const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];

      // Log successful login
      await this.logAudit(user.id, 'user.login', 'users', {
        method: user.twoFactorEnabled ? '2fa' : 'password',
      });

      return {
        user: this.sanitizeUser(user),
        accessToken: auth0Token.access_token,
        refreshToken: auth0Token.refresh_token,
        idToken: auth0Token.id_token,
        expiresIn: auth0Token.expires_in,
        permissions,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getKey,
        {
          audience: auth0Config.audience,
          issuer: auth0Config.issuer,
          algorithms: auth0Config.algorithms,
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });
  }

  /**
   * Get signing key from JWKS
   */
  private getKey = (header: any, callback: any) => {
    jwksClient.getSigningKey(header.kid, (err, key: any) => {
      if (err) {
        callback(err);
      } else {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
      }
    });
  };

  /**
   * Setup 2FA for user
   */
  async setup2FA(userId: string) {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Mental Health Platform (${userId})`,
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Store encrypted secret
      await this.db.getDb()
        .update(users)
        .set({
          twoFactorSecret: this.db.encrypt(secret.base32),
        })
        .where(eq(users.id, userId));

      await this.logAudit(userId, 'user.2fa.setup', 'users', {});

      return {
        secret: secret.base32,
        qrCode,
        backupCodes: this.generateBackupCodes(),
      };
    } catch (error: any) {
      console.error('2FA setup error:', error);
      throw new Error('Failed to setup 2FA');
    }
  }

  /**
   * Enable 2FA after verification
   */
  async enable2FA(userId: string, totpCode: string) {
    try {
      const user = await this.db.getDb()
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length || !user[0].twoFactorSecret) {
        throw new Error('2FA not set up');
      }

      const secret = this.db.decrypt(user[0].twoFactorSecret);
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: totpCode,
        window: 2,
      });

      if (!verified) {
        throw new Error('Invalid verification code');
      }

      await this.db.getDb()
        .update(users)
        .set({
          twoFactorEnabled: true,
        })
        .where(eq(users.id, userId));

      await this.logAudit(userId, 'user.2fa.enabled', 'users', {});

      return { success: true };
    } catch (error: any) {
      console.error('2FA enable error:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Verify professional credentials
   */
  async verifyProfessionalCredentials(userId: string, credentials: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiry: Date;
    npiNumber?: string;
    documents: string[];
  }) {
    try {
      // Store professional profile
      await this.db.getDb().insert(professionalProfiles).values({
        userId,
        licenseNumber: this.db.encrypt(credentials.licenseNumber),
        licenseState: credentials.licenseState,
        licenseExpiry: credentials.licenseExpiry,
        npiNumber: credentials.npiNumber ? this.db.encrypt(credentials.npiNumber) : null,
        verificationDocuments: credentials.documents,
        verificationStatus: 'pending',
      });

      // TODO: Integrate with professional verification API
      // For now, mark as pending manual review

      await this.logAudit(userId, 'professional.verification.submitted', 'professional_profiles', {
        licenseState: credentials.licenseState,
      });

      return {
        status: 'pending',
        message: 'Credentials submitted for verification',
      };
    } catch (error: any) {
      console.error('Professional verification error:', error);
      throw new Error('Failed to submit credentials');
    }
  }

  /**
   * Assign role and permissions to user
   */
  private async assignRole(auth0UserId: string, role: string) {
    try {
      const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
      
      await this.management.assignRolestoUser(
        { id: auth0UserId },
        { roles: [role] }
      );

      // Assign permissions
      for (const permission of permissions) {
        await this.management.updateUserMetadata(
          { id: auth0UserId },
          {
            permissions: permissions,
          }
        );
      }
    } catch (error) {
      console.error('Role assignment error:', error);
      // Non-critical error, continue
    }
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(email: string) {
    try {
      await this.authentication.requestEmailCode({
        email,
        send: 'code',
      });
    } catch (error) {
      console.error('Verification email error:', error);
      // Non-critical error, continue
    }
  }

  /**
   * Generate anonymous user token
   */
  private generateAnonymousToken(user: any) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        isAnonymous: true,
        permissions: ROLE_PERMISSIONS[ROLES.USER],
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
        issuer: 'mental-health-platform',
        audience: 'mental-health-api',
      }
    );
  }

  /**
   * Generate backup codes for 2FA
   */
  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(
        Math.random().toString(36).substr(2, 4) + '-' +
        Math.random().toString(36).substr(2, 4)
      );
    }
    return codes;
  }

  /**
   * Increment login attempts and lock account if needed
   */
  private async incrementLoginAttempts(userId: string) {
    const user = await this.db.getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length) {
      const attempts = (user[0].loginAttempts || 0) + 1;
      const updates: any = { loginAttempts: attempts };

      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await this.db.getDb()
        .update(users)
        .set(updates)
        .where(eq(users.id, userId));
    }
  }

  /**
   * Sanitize user data for client
   */
  private sanitizeUser(user: any) {
    const sanitized = { ...user };
    delete sanitized.passwordHash;
    delete sanitized.twoFactorSecret;
    
    // Decrypt encrypted fields
    if (sanitized.firstName) {
      sanitized.firstName = this.db.decrypt(sanitized.firstName);
    }
    if (sanitized.lastName) {
      sanitized.lastName = this.db.decrypt(sanitized.lastName);
    }

    return sanitized;
  }

  /**
   * Log audit trail for HIPAA compliance
   */
  private async logAudit(
    userId: string,
    action: string,
    resource: string,
    details: any
  ) {
    try {
      await this.db.getDb().insert(auditLogs).values({
        userId,
        action,
        resource,
        details,
        success: true,
      });
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw - audit failures shouldn't break the app
    }
  }
}

// Export singleton instance
export const auth0Service = new Auth0Service();