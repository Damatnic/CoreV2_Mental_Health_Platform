/**
 * Register Form Component - Production-ready user registration
 * Includes HIPAA consent, email verification, password strength meter
 * Supports role selection and comprehensive validation
 */

import React, { useState, useCallback, useEffect, FormEvent } from 'react';
import { 
  Eye, EyeOff, AlertCircle, Loader, Mail, Lock, User, 
  Shield, CheckCircle, Info, UserPlus, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../services/auth/authService';
import { logger } from '../../utils/logger';
import Button from '../Button';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
  className?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onLoginClick,
  className = ''
}) => {
  const { register, loading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'patient' | 'therapist',
    acceptTerms: false,
    acceptHipaa: false,
    subscribeNewsletter: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    color: 'red',
    suggestions: []
  });
  const [verificationSent, setVerificationSent] = useState(false);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Calculate password strength
  const calculatePasswordStrength = useCallback((password: string): PasswordStrength => {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 12) {
      score += 20;
    } else if (password.length >= 8) {
      score += 10;
    } else {
      suggestions.push('Use at least 12 characters');
    }

    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      suggestions.push('Include uppercase letters');
    }

    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      suggestions.push('Include lowercase letters');
    }

    if (/\d/.test(password)) {
      score += 20;
    } else {
      suggestions.push('Include numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    } else {
      suggestions.push('Include special characters');
    }

    // Bonus for length
    if (password.length >= 16) {
      score += 10;
    }

    // Check for common patterns
    const commonPatterns = ['123', 'abc', 'password', 'qwerty'];
    const lowerPassword = password.toLowerCase();
    if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
      score -= 20;
      suggestions.push('Avoid common patterns');
    }

    let label = 'Weak';
    let color = '#ef4444'; // red

    if (score >= 80) {
      label = 'Strong';
      color = '#10b981'; // green
    } else if (score >= 60) {
      label = 'Good';
      color = '#3b82f6'; // blue
    } else if (score >= 40) {
      label = 'Fair';
      color = '#f59e0b'; // yellow
    }

    return { score: Math.min(100, Math.max(0, score)), label, color, suggestions };
  }, []);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, label: 'Weak', color: '#ef4444', suggestions: [] });
    }
  }, [formData.password, calculatePasswordStrength]);

  // Validate name
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setFormErrors(prev => ({ ...prev, name: 'Name is required' }));
      return false;
    }
    if (name.trim().length < 2) {
      setFormErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, name: undefined }));
    return true;
  };

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
    if (password.length < 12) {
      setFormErrors(prev => ({ ...prev, password: 'Password must be at least 12 characters' }));
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setFormErrors(prev => ({ ...prev, password: 'Password must contain uppercase letters' }));
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setFormErrors(prev => ({ ...prev, password: 'Password must contain lowercase letters' }));
      return false;
    }
    if (!/\d/.test(password)) {
      setFormErrors(prev => ({ ...prev, password: 'Password must contain numbers' }));
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setFormErrors(prev => ({ ...prev, password: 'Password must contain special characters' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== password) {
      setFormErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
    return true;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});
    clearError();

    // Validate all fields
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (!formData.acceptTerms) {
      setFormErrors(prev => ({ ...prev, general: 'You must accept the Terms of Service' }));
      return;
    }

    if (formData.role === 'therapist' && !formData.acceptHipaa) {
      setFormErrors(prev => ({ ...prev, general: 'Therapists must accept HIPAA compliance agreement' }));
      return;
    }

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const registerData: RegisterData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        acceptTerms: formData.acceptTerms,
        acceptHipaa: formData.acceptHipaa,
        role: formData.role
      };

      const success = await register(registerData);

      if (success) {
        logger.info('Registration successful', { email: formData.email });
        setVerificationSent(true);
        onSuccess?.();
      } else {
        setFormErrors({ general: error || 'Registration failed' });
      }
    } catch (error) {
      logger.error('Registration error', error);
      setFormErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, register, clearError, error, onSuccess]);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (field in formErrors) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // If verification email sent, show success message
  if (verificationSent) {
    return (
      <div className={`register-form ${className}`}>
        <div className="text-center space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
          <p className="text-gray-700">
            We've sent a verification email to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Please check your inbox and click the verification link to activate your account.
          </p>
          <Button
            variant="primary"
            onClick={onLoginClick}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`register-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Error Alert */}
        {(formErrors.general || error) && (
          <div className="alert alert-error flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{formErrors.general || error}</p>
          </div>
        )}

        {/* Role Selection */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am registering as a:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('role', 'patient')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                formData.role === 'patient'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-1" />
              <span className="block text-sm font-medium">Patient</span>
              <span className="text-xs text-gray-500">Seeking support</span>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('role', 'therapist')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                formData.role === 'therapist'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Shield className="w-6 h-6 mx-auto mb-1" />
              <span className="block text-sm font-medium">Therapist</span>
              <span className="text-xs text-gray-500">Healthcare provider</span>
            </button>
          </div>
        </div>

        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => validateName(formData.name)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
              autoComplete="name"
              disabled={isSubmitting || loading}
              required
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? 'name-error' : undefined}
            />
            <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          {formErrors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

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
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => validateEmail(formData.email)}
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
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => validatePassword(formData.password)}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isSubmitting || loading}
              required
              aria-invalid={!!formErrors.password}
              aria-describedby={formErrors.password ? 'password-error' : 'password-requirements'}
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
          
          {/* Password Strength Meter */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${passwordStrength.score}%`,
                    backgroundColor: passwordStrength.color
                  }}
                />
              </div>
              {passwordStrength.suggestions.length > 0 && (
                <ul className="mt-1 text-xs text-gray-600">
                  {passwordStrength.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {formErrors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={() => validateConfirmPassword(formData.confirmPassword, formData.password)}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={isSubmitting || loading}
              required
              aria-invalid={!!formErrors.confirmPassword}
              aria-describedby={formErrors.confirmPassword ? 'confirm-error' : undefined}
            />
            <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <p id="confirm-error" className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms and Agreements */}
        <div className="space-y-3">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              disabled={isSubmitting || loading}
              required
            />
            <span className="ml-2 text-sm text-gray-700">
              I accept the <a href="/terms" className="text-primary-600 hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
            </span>
          </label>

          {formData.role === 'therapist' && (
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.acceptHipaa}
                onChange={(e) => handleInputChange('acceptHipaa', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                disabled={isSubmitting || loading}
                required
              />
              <span className="ml-2 text-sm text-gray-700">
                I understand and agree to comply with{' '}
                <a href="/hipaa" className="text-primary-600 hover:underline">HIPAA requirements</a>
              </span>
            </label>
          )}

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.subscribeNewsletter}
              onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              disabled={isSubmitting || loading}
            />
            <span className="ml-2 text-sm text-gray-700">
              Send me helpful mental health tips and updates (optional)
            </span>
          </label>
        </div>

        {/* HIPAA Notice for Therapists */}
        {formData.role === 'therapist' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="ml-2">
                <p className="text-sm text-blue-800 font-medium">Healthcare Provider Notice</p>
                <p className="text-xs text-blue-700 mt-1">
                  As a therapist, you'll need to verify your credentials and complete additional 
                  HIPAA compliance training after registration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting || loading || !formData.acceptTerms}
        >
          {isSubmitting || loading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="-ml-1 mr-2 h-5 w-5" />
              Create Account
            </>
          )}
        </Button>

        {/* Login Link */}
        {onLoginClick && (
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="font-medium text-primary-600 hover:text-primary-500"
                disabled={isSubmitting || loading}
              >
                Sign in
              </button>
            </span>
          </div>
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

export default RegisterForm;