import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as AppleStrategy } from 'passport-apple';
import winston from 'winston';
import { db } from '../config/database';
import { EncryptionService } from './encryption';
import { v4 as uuidv4 } from 'uuid';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/oauth.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  emailVerified: boolean;
}

/**
 * OAuth Provider Service
 * Configures multiple OAuth providers for authentication
 */
export class OAuthProviderService {
  /**
   * Initialize all OAuth strategies
   */
  static initialize(): void {
    this.configureJWT();
    this.configureGoogle();
    this.configureFacebook();
    this.configureApple();
    
    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const result = await db.query(
          'SELECT id, email, role FROM users WHERE id = $1 AND deleted_at IS NULL',
          [id]
        );
        done(null, result.rows[0] || null);
      } catch (error) {
        done(error, null);
      }
    });

    logger.info('OAuth providers initialized');
  }

  /**
   * Configure JWT Strategy
   */
  private static configureJWT(): void {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'change-this-secret',
      issuer: 'mental-health-platform',
      audience: 'mental-health-users'
    };

    passport.use(new JwtStrategy(options, async (payload, done) => {
      try {
        const result = await db.query(
          'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
          [payload.userId]
        );

        if (result.rows.length === 0) {
          return done(null, false);
        }

        return done(null, result.rows[0]);
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  /**
   * Configure Google OAuth
   */
  private static configureGoogle(): void {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.warn('Google OAuth not configured - missing credentials');
      return;
    }

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const oauthProfile: OAuthProfile = {
          provider: 'google',
          providerId: profile.id,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profilePicture: profile.photos?.[0]?.value,
          emailVerified: profile.emails?.[0]?.verified || false
        };

        const user = await this.findOrCreateUser(oauthProfile);
        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error', error);
        return done(error as Error, undefined);
      }
    }));
  }

  /**
   * Configure Facebook OAuth
   */
  private static configureFacebook(): void {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      logger.warn('Facebook OAuth not configured - missing credentials');
      return;
    }

    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'picture']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const oauthProfile: OAuthProfile = {
          provider: 'facebook',
          providerId: profile.id,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profilePicture: profile.photos?.[0]?.value,
          emailVerified: true // Facebook emails are pre-verified
        };

        const user = await this.findOrCreateUser(oauthProfile);
        return done(null, user);
      } catch (error) {
        logger.error('Facebook OAuth error', error);
        return done(error as Error, undefined);
      }
    }));
  }

  /**
   * Configure Apple Sign In
   */
  private static configureApple(): void {
    if (!process.env.APPLE_SERVICE_ID || !process.env.APPLE_TEAM_ID) {
      logger.warn('Apple Sign In not configured - missing credentials');
      return;
    }

    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_SERVICE_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID || '',
      privateKeyString: process.env.APPLE_PRIVATE_KEY || '',
      callbackURL: `${process.env.API_URL}/api/auth/apple/callback`,
      passReqToCallback: false
    }, async (accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
      try {
        const oauthProfile: OAuthProfile = {
          provider: 'apple',
          providerId: profile.id,
          email: idToken.email || '',
          firstName: profile.name?.firstName,
          lastName: profile.name?.lastName,
          profilePicture: undefined,
          emailVerified: idToken.email_verified === 'true'
        };

        const user = await this.findOrCreateUser(oauthProfile);
        return done(null, user);
      } catch (error) {
        logger.error('Apple Sign In error', error);
        return done(error, false);
      }
    }));
  }

  /**
   * Find or create user from OAuth profile
   */
  private static async findOrCreateUser(profile: OAuthProfile): Promise<any> {
    // Check if user exists with this email
    let result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [profile.email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Update OAuth provider info
      await db.query(
        `INSERT INTO oauth_providers (
          user_id, provider, provider_id, access_token_encrypted,
          profile_data, last_login_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, provider) DO UPDATE SET
          provider_id = $3,
          profile_data = $5,
          last_login_at = CURRENT_TIMESTAMP`,
        [
          user.id,
          profile.provider,
          profile.providerId,
          null, // We don't store access tokens for security
          JSON.stringify(profile)
        ]
      );

      // Update last login
      await db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      logger.info('OAuth login successful', {
        userId: user.id,
        provider: profile.provider
      });

      return user;
    }

    // Create new user
    const userId = uuidv4();
    const defaultPassword = uuidv4(); // Random password for OAuth users

    result = await db.query(
      `INSERT INTO users (
        id, email, email_encrypted, password_hash, role,
        first_name_encrypted, last_name_encrypted,
        email_verified, oauth_provider, profile_picture_url,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        userId,
        profile.email,
        EncryptionService.encryptField(profile.email),
        EncryptionService.hash(defaultPassword), // OAuth users don't use passwords
        'patient', // Default role for new OAuth users
        EncryptionService.encryptField(profile.firstName || 'User'),
        EncryptionService.encryptField(profile.lastName || ''),
        profile.emailVerified,
        profile.provider,
        profile.profilePicture
      ]
    );

    const newUser = result.rows[0];

    // Store OAuth provider info
    await db.query(
      `INSERT INTO oauth_providers (
        user_id, provider, provider_id, profile_data, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        userId,
        profile.provider,
        profile.providerId,
        JSON.stringify(profile)
      ]
    );

    logger.info('New OAuth user created', {
      userId: newUser.id,
      provider: profile.provider,
      email: profile.email
    });

    // Send welcome email
    await this.sendWelcomeEmail(newUser);

    return newUser;
  }

  /**
   * Link OAuth provider to existing user
   */
  static async linkProvider(
    userId: string,
    provider: string,
    providerId: string,
    profileData: any
  ): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO oauth_providers (
          user_id, provider, provider_id, profile_data, linked_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, provider) DO UPDATE SET
          provider_id = $3,
          profile_data = $4,
          linked_at = CURRENT_TIMESTAMP`,
        [userId, provider, providerId, JSON.stringify(profileData)]
      );

      logger.info('OAuth provider linked', { userId, provider });
      return true;
    } catch (error) {
      logger.error('Failed to link OAuth provider', error);
      return false;
    }
  }

  /**
   * Unlink OAuth provider from user
   */
  static async unlinkProvider(userId: string, provider: string): Promise<boolean> {
    try {
      // Check if user has password or other providers
      const result = await db.query(
        `SELECT 
          (password_hash IS NOT NULL) as has_password,
          COUNT(op.provider) as provider_count
        FROM users u
        LEFT JOIN oauth_providers op ON u.id = op.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.password_hash`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const { has_password, provider_count } = result.rows[0];

      // Don't unlink if it's the only auth method
      if (!has_password && provider_count <= 1) {
        logger.warn('Cannot unlink last authentication method', { userId, provider });
        return false;
      }

      await db.query(
        'DELETE FROM oauth_providers WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      logger.info('OAuth provider unlinked', { userId, provider });
      return true;
    } catch (error) {
      logger.error('Failed to unlink OAuth provider', error);
      return false;
    }
  }

  /**
   * Get linked providers for user
   */
  static async getLinkedProviders(userId: string): Promise<string[]> {
    const result = await db.query(
      'SELECT provider FROM oauth_providers WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => row.provider);
  }

  /**
   * Send welcome email to new OAuth user
   */
  private static async sendWelcomeEmail(user: any): Promise<void> {
    // Implementation would send actual email
    logger.info('Welcome email queued', { userId: user.id, email: user.email });
  }

  /**
   * Validate OAuth state parameter
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify OAuth state parameter
   */
  static async verifyState(state: string, sessionState: string): Promise<boolean> {
    return state === sessionState;
  }

  /**
   * Handle OAuth callback errors
   */
  static handleCallbackError(error: any, provider: string): {
    code: string;
    message: string;
  } {
    logger.error(`OAuth callback error for ${provider}`, error);

    if (error.message?.includes('email')) {
      return {
        code: 'EMAIL_REQUIRED',
        message: 'Email address is required for registration'
      };
    }

    if (error.message?.includes('already exists')) {
      return {
        code: 'ACCOUNT_EXISTS',
        message: 'An account with this email already exists'
      };
    }

    return {
      code: 'OAUTH_ERROR',
      message: 'Authentication failed. Please try again.'
    };
  }
}

// OAuth providers table schema (add to migrations)
const oauthProvidersSchema = `
CREATE TABLE IF NOT EXISTS oauth_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  profile_data JSONB,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_oauth_providers_user ON oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON oauth_providers(provider, provider_id);
`;

export default OAuthProviderService;