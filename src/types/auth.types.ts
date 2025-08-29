/**
 * Authentication Types
 * Types for authentication and authorization in the mental health platform
 */

export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  role: 'admin' | 'therapist' | 'helper' | 'user';
  isAnonymous: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string | null;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    fingerprint: string;
  };
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  provider?: 'email' | 'google' | 'anonymous';
  providerId?: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface PasswordResetRequest {
  email: string;
  token?: string;
  newPassword?: string;
}

export interface EmailVerification {
  userId: string;
  token: string;
  expiresAt: Date;
  verified: boolean;
}

export interface AuthPermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface AuthRole {
  name: string;
  permissions: AuthPermission[];
  description?: string;
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  verified: boolean;
  backupCodes?: string[];
}

export interface AuthContext {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (credentials: AuthCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<AuthResponse>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refreshSession: () => Promise<AuthSession>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<AuthUser>;
}

// Type guards
export const isAuthUser = (obj: any): obj is AuthUser => {
  return obj && typeof obj.id === 'string' && typeof obj.role === 'string';
};

export const isAuthSession = (obj: any): obj is AuthSession => {
  return obj && typeof obj.id === 'string' && typeof obj.token === 'string';
};

export const isAuthError = (obj: any): obj is AuthError => {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string';
};