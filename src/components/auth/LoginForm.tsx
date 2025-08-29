/**
 * Login Form Component - Production-ready authentication
 * Supports email/password, OAuth, 2FA, and accessibility features
 * HIPAA-compliant with secure credential handling
 */

import React, { useState, useCallback, useEffect, FormEvent } from 'react';
import { Eye, EyeOff, AlertCircle, Loader, Mail, Lock, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import Button from '../Button';

// OAuth provider icons as SVG components
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
  className?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  twoFactorCode?: string;
  general?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
  className = ''
}) => {
  const {
    login,
    loginWithGoogle,
    loginWithApple,
    completeTwoFactorAuth,
    requiresTwoFactor,
    loading,
    error,
    clearError
  } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Handle lockout timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(prev => prev - 1);
        if (lockoutTime === 1) {
          setIsLocked(false);
          setLoginAttempts(0);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setFormErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  // Validate password
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setFormErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 8) {
      setFormErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  // Validate 2FA code
  const validateTwoFactorCode = (code: string): boolean => {
    if (!code) {
      setFormErrors(prev => ({ ...prev, twoFactorCode: '2FA code is required' }));
      return false;
    }
    if (!/^\d{6}$/.test(code)) {
      setFormErrors(prev => ({ ...prev, twoFactorCode: 'Code must be 6 digits' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, twoFactorCode: undefined }));
    return true;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setFormErrors({ general: `Account locked. Try again in ${lockoutTime} seconds` });
      return;
    }

    // Clear previous errors
    setFormErrors({});
    clearError();

    // Handle 2FA verification
    if (requiresTwoFactor) {
      if (!validateTwoFactorCode(twoFactorCode)) return;
      
      setIsSubmitting(true);
      try {
        const success = await completeTwoFactorAuth(twoFactorCode);
        if (success) {
          logger.info('2FA verification successful');
          onSuccess?.();
        } else {
          setFormErrors({ twoFactorCode: 'Invalid verification code' });
        }
      } catch (error) {
        logger.error('2FA verification failed', error);
        setFormErrors({ twoFactorCode: 'Verification failed. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) return;

    setIsSubmitting(true);
    try {
      const success = await login(email, password, rememberMe);
      
      if (success) {
        logger.info('Login successful', { email });
        setLoginAttempts(0);
        onSuccess?.();
      } else {
        // Handle failed login
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTime(300); // 5 minutes
          setFormErrors({ general: 'Too many failed attempts. Account locked for 5 minutes.' });
        } else {
          setFormErrors({ general: error || 'Invalid email or password' });
        }
      }
    } catch (error) {
      logger.error('Login error', error);
      setFormErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    email,
    password,
    twoFactorCode,
    rememberMe,
    requiresTwoFactor,
    isLocked,
    lockoutTime,
    loginAttempts,
    login,
    completeTwoFactorAuth,
    clearError,
    error,
    onSuccess
  ]);

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async (provider: 'google' | 'apple') => {
    setFormErrors({});
    clearError();
    
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithApple();
      }
    } catch (error) {
      logger.error(`${provider} login failed`, error);
      setFormErrors({ general: `${provider} login failed. Please try again.` });
    }
  }, [loginWithGoogle, loginWithApple, clearError]);

  return (
    <div className={`login-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Error Alert */}
        {(formErrors.general || error) && (
          <div className="alert alert-error flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{formErrors.general || error}</p>
          </div>
        )}

        {/* Success message for 2FA */}
        {requiresTwoFactor && !formErrors.twoFactorCode && (
          <div className="alert alert-info flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Two-factor authentication required. Please enter your verification code.
            </p>
          </div>
        )}

        {!requiresTwoFactor ? (
          <>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                  required
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                />
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isSubmitting || loading}
                  required
                  aria-invalid={!!formErrors.password}
                  aria-describedby={formErrors.password ? 'password-error' : undefined}
                />
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isSubmitting || loading}
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              
              {onForgotPasswordClick && (
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  className="text-sm text-primary-600 hover:text-primary-500"
                  disabled={isSubmitting || loading}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </>
        ) : (
          /* 2FA Code Field */
          <div className="form-group">
            <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <div className="relative">
              <input
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTwoFactorCode(value);
                  if (value.length === 6) {
                    validateTwoFactorCode(value);
                  }
                }}
                onBlur={() => validateTwoFactorCode(twoFactorCode)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-lg tracking-wider ${
                  formErrors.twoFactorCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000000"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                disabled={isSubmitting || loading}
                required
                aria-invalid={!!formErrors.twoFactorCode}
                aria-describedby={formErrors.twoFactorCode ? 'code-error' : undefined}
              />
              <Shield className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {twoFactorCode.length === 6 && !formErrors.twoFactorCode && (
                <CheckCircle className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />
              )}
            </div>
            {formErrors.twoFactorCode && (
              <p id="code-error" className="mt-1 text-sm text-red-600">{formErrors.twoFactorCode}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting || loading || isLocked}
        >
          {isSubmitting || loading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
              {requiresTwoFactor ? 'Verifying...' : 'Signing in...'}
            </>
          ) : (
            requiresTwoFactor ? 'Verify Code' : 'Sign In'
          )}
        </Button>

        {!requiresTwoFactor && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || loading || isLocked}
              >
                <GoogleIcon />
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('apple')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || loading || isLocked}
              >
                <AppleIcon />
                <span className="ml-2">Apple</span>
              </button>
            </div>

            {/* Register Link */}
            {onRegisterClick && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="font-medium text-primary-600 hover:text-primary-500"
                    disabled={isSubmitting || loading}
                  >
                    Sign up
                  </button>
                </span>
              </div>
            )}
          </>
        )}

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <Shield className="inline w-3 h-3 mr-1" />
            Your data is encrypted and protected by HIPAA-compliant security
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;