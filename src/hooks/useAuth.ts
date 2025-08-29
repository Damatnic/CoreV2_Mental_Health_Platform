/**
 * Authentication Hook - Production-ready authentication integration
 * Provides seamless authentication state and methods
 * HIPAA-compliant with complete 2FA support
 */

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

/**
 * useAuth Hook - Provides authentication functionality
 * This is the primary way components should access authentication
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export type for convenience
export type { AuthContextType as UseAuthReturn } from '../contexts/AuthContext';
export type { User as AuthUser } from '../contexts/AuthContext';

// Re-export common types
export type {
  LoginCredentials,
  RegisterData,
  TwoFactorSetup,
  TokenPair,
  UserPreferences,
  NotificationPreferences,
  PrivacySettings,
  AccessibilitySettings,
  CrisisSupportSettings,
  EmergencyContact,
  UserProfile,
  TherapistInfo,
  EmergencyInfo
} from '../services/auth/authService';

// Export default for backwards compatibility
export default useAuth;