/**
 * Authentication Hook - Simplified for demo functionality
 * Provides authentication state and methods via mock API
 */

import { useSimpleAuth } from './useSimpleAuth';

/**
 * useAuth Hook - Provides authentication functionality
 * This is the primary way components should access authentication
 * Now using simplified implementation for immediate functionality
 */
export const useAuth = () => {
  const simpleAuth = useSimpleAuth();
  
  // Map simple auth to expected interface for compatibility
  return {
    user: simpleAuth.user,
    loading: simpleAuth.loading,
    error: simpleAuth.error,
    isAuthenticated: simpleAuth.isAuthenticated,
    requiresTwoFactor: false, // Not implemented in simple auth
    sessionTimeRemaining: 3600, // Default 1 hour
    
    // Core methods - map with appropriate signatures
    login: async (email: string, password: string, rememberMe?: boolean, twoFactorCode?: string) => {
      return simpleAuth.login(email, password);
    },
    
    register: async (data: any) => {
      const email = typeof data === 'string' ? data : data.email;
      const password = typeof data === 'object' ? data.password : 'password123';
      const profile = typeof data === 'object' ? data : undefined;
      return simpleAuth.register(email, password, profile);
    },
    
    logout: simpleAuth.logout,
    updateUser: simpleAuth.updateUser,
    clearError: simpleAuth.clearError,
    
    // Stub methods for compatibility
    loginWithGoogle: async () => {
      console.log('Google login not available in demo mode');
    },
    
    loginWithApple: async () => {
      console.log('Apple login not available in demo mode');
    },
    
    handleOAuthCallback: async () => false,
    completeTwoFactorAuth: async () => false,
    setupTwoFactorAuth: async () => null,
    disableTwoFactorAuth: async () => false,
    changePassword: async () => false,
    requestPasswordReset: async () => false,
    resetPassword: async () => false,
    verifyEmail: async () => false,
    resendVerificationEmail: async () => false,
    refreshToken: async () => true,
    checkSession: () => {}
  };
};

// Export types for compatibility
export type UseAuthReturn = ReturnType<typeof useAuth>;
export type AuthUser = any;

// Export default for backwards compatibility
export default useAuth;