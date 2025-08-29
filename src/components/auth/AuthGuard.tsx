import React, { useEffect, useState } from 'react';
import { Shield, Lock, AlertCircle, Loader2, CheckCircle, UserPlus } from 'lucide-react';
import { AppButton } from '../AppButton';

interface User {
  id: string;
  email?: string;
  displayName: string;
  isAnonymous: boolean;
  roles?: string[];
  lastActivity?: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowAnonymous?: boolean;
  showAuthOptions?: boolean;
  className?: string;
  onAuthRequired?: () => void;
  onAccessDenied?: (reason: string) => void;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  requiredRoles = [],
  fallback,
  redirectTo,
  allowAnonymous = true,
  showAuthOptions = true,
  className = '',
  onAuthRequired,
  onAccessDenied
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'anonymous'>('login');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check for existing session
      const storedUser = localStorage.getItem('mental_health_user');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        
        // Validate session
        const isValid = await validateSession(user);
        if (isValid) {
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });
          return;
        } else {
          // Clear invalid session
          localStorage.removeItem('mental_health_user');
        }
      }

      // No valid session found
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });

    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Failed to check authentication status'
      });
    }
  };

  const validateSession = async (user: User): Promise<boolean> => {
    try {
      // In a real app, this would validate with the server
      // For now, check if session is recent
      if (user.lastActivity) {
        const lastActivity = new Date(user.lastActivity);
        const now = new Date();
        const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        // Session expires after 24 hours for anonymous users, 7 days for authenticated users
        const maxHours = user.isAnonymous ? 24 : 168;
        return diffHours < maxHours;
      }
      
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock login - replace with real authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user: User = {
        id: `user_${Date.now()}`,
        email: credentials.email,
        displayName: credentials.email.split('@')[0],
        isAnonymous: false,
        roles: ['user'],
        lastActivity: new Date().toISOString()
      };

      localStorage.setItem('mental_health_user', JSON.stringify(user));
      
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });

      setShowLoginForm(false);

    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please try again.'
      }));
    }
  };

  const handleSignup = async (userData: { email: string; password: string; displayName: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock signup - replace with real registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user: User = {
        id: `user_${Date.now()}`,
        email: userData.email,
        displayName: userData.displayName,
        isAnonymous: false,
        roles: ['user'],
        lastActivity: new Date().toISOString()
      };

      localStorage.setItem('mental_health_user', JSON.stringify(user));
      
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });

      setShowLoginForm(false);

    } catch (error) {
      console.error('Signup failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Account creation failed. Please try again.'
      }));
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const user: User = {
        id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        displayName: 'Anonymous User',
        isAnonymous: true,
        roles: ['anonymous'],
        lastActivity: new Date().toISOString()
      };

      localStorage.setItem('mental_health_user', JSON.stringify(user));
      
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });

      setShowLoginForm(false);

    } catch (error) {
      console.error('Anonymous login failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Anonymous access failed. Please try again.'
      }));
    }
  };



  // Check if user has required roles
  const hasRequiredRoles = (user: User, roles: string[]): boolean => {
    if (roles.length === 0) return true;
    if (!user.roles) return false;
    return roles.some(role => user.roles!.includes(role));
  };

  // Loading state
  if (authState.isLoading) {
    return (
      <div className={`auth-guard-loading flex flex-col items-center justify-center min-h-screen ${className}`}>
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 text-lg">Checking authentication...</p>
      </div>
    );
  }

  // Check authentication requirements
  const needsAuth = requireAuth && !authState.isAuthenticated;
  const isAnonymousButNotAllowed = authState.user?.isAnonymous && !allowAnonymous && requireAuth;
  const lacksRequiredRoles = authState.user && !hasRequiredRoles(authState.user, requiredRoles);

  // Handle authentication requirements
  if (needsAuth || isAnonymousButNotAllowed || lacksRequiredRoles) {
    let reason = 'Authentication required';
    
    if (isAnonymousButNotAllowed) {
      reason = 'Full account required for this feature';
    } else if (lacksRequiredRoles) {
      reason = 'Insufficient permissions';
    }

    // Notify parent components
    if (needsAuth && onAuthRequired) {
      onAuthRequired();
    }
    
    if ((isAnonymousButNotAllowed || lacksRequiredRoles) && onAccessDenied) {
      onAccessDenied(reason);
    }

    // Redirect if specified
    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }

    // Show custom fallback
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }

    // Show authentication form
    if (showAuthOptions && (needsAuth || isAnonymousButNotAllowed)) {
      return (
        <div className={`auth-guard min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 ${className}`}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isAnonymousButNotAllowed ? 'Account Required' : 'Welcome Back'}
                </h1>
                <p className="text-gray-600">
                  {isAnonymousButNotAllowed 
                    ? 'This feature requires a full account for your security and privacy.'
                    : 'Please sign in to continue to your mental health journey.'}
                </p>
              </div>

              {/* Auth Options */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {!showLoginForm ? (
                  <div className="p-6 space-y-4">
                    <AppButton
                      variant="primary"
                      onClick={() => {
                        setAuthMode('login');
                        setShowLoginForm(true);
                      }}
                      className="w-full"
                      icon={<Lock className="w-4 h-4" />}
                    >
                      Sign In
                    </AppButton>
                    
                    <AppButton
                      variant="secondary"
                      onClick={() => {
                        setAuthMode('signup');
                        setShowLoginForm(true);
                      }}
                      className="w-full"
                      icon={<UserPlus className="w-4 h-4" />}
                    >
                      Create Account
                    </AppButton>

                    {allowAnonymous && !isAnonymousButNotAllowed && (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or</span>
                          </div>
                        </div>
                        
                        <AppButton
                          variant="ghost"
                          onClick={handleAnonymousLogin}
                          className="w-full"
                        >
                          Continue Anonymously
                        </AppButton>
                      </>
                    )}
                  </div>
                ) : (
                  <AuthForm
                    mode={authMode}
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    onCancel={() => setShowLoginForm(false)}
                    isLoading={authState.isLoading}
                    error={authState.error}
                  />
                )}
              </div>

              {/* Error Display */}
              {authState.error && !showLoginForm && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Authentication Error</h3>
                    <p className="text-red-700 text-sm mt-1">{authState.error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show access denied message
    return (
      <div className={`auth-guard-denied min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">{reason}</p>
          
          <div className="space-y-3">
            {lacksRequiredRoles && (
              <p className="text-sm text-gray-500">
                Required roles: {requiredRoles.join(', ')}
              </p>
            )}
            
            <AppButton
              variant="primary"
              onClick={() => setShowLoginForm(true)}
            >
              Sign In
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized - render children
  return <div className={className}>{children}</div>;
};

// Auth Form Component
interface AuthFormProps {
  mode: 'login' | 'signup' | 'anonymous';
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  onSignup: (userData: { email: string; password: string; displayName: string }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onLogin,
  onSignup,
  onCancel,
  isLoading,
  error
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      await onSignup({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName
      });
    } else {
      await onLogin({
        email: formData.email,
        password: formData.password
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="How should we address you?"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">Passwords don't match</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <AppButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          loading={isLoading}
          loadingText={mode === 'signup' ? 'Creating...' : 'Signing in...'}
          className="flex-1"
          icon={mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        >
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </AppButton>
      </div>
    </form>
  );
};

export default AuthGuard;
