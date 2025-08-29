import React from 'react';
import { cn } from '../utils/cn';

interface GoogleBadgeProps {
  variant?: 'signin' | 'signup' | 'continue' | 'custom';
  size?: 'small' | 'medium' | 'large';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  text?: string;
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
  locale?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  // Mental health platform specific props
  context?: 'therapy' | 'crisis' | 'general' | 'anonymous';
  showPrivacyNote?: boolean;
  confidentialMode?: boolean;
}

const GOOGLE_TEXTS = {
  signin: 'Sign in with Google',
  signup: 'Sign up with Google',
  continue: 'Continue with Google',
  custom: 'Continue with Google'
};

const GOOGLE_LOGO_SVG = (
  <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
    <path
      fill="#4285F4"
      d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.54C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
    />
    <path
      fill="#34A853"
      d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.96l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.66z"
    />
    <path
      fill="#FBBC05"
      d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
    />
    <path
      fill="#EA4335"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
    />
  </svg>
);

const getSizeClasses = (size: GoogleBadgeProps['size']) => {
  switch (size) {
    case 'small':
      return {
        button: 'h-10 px-3 text-sm',
        icon: 'w-4 h-4',
        text: 'text-sm'
      };
    case 'large':
      return {
        button: 'h-14 px-6 text-lg',
        icon: 'w-6 h-6',
        text: 'text-lg'
      };
    default: // medium
      return {
        button: 'h-12 px-4 text-base',
        icon: 'w-5 h-5',
        text: 'text-base'
      };
  }
};

const getThemeClasses = (theme: GoogleBadgeProps['theme']) => {
  switch (theme) {
    case 'filled_blue':
      return 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600';
    case 'filled_black':
      return 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-900';
    default: // outline
      return 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm';
  }
};

const getShapeClasses = (shape: GoogleBadgeProps['shape']) => {
  switch (shape) {
    case 'pill':
      return 'rounded-full';
    case 'circle':
      return 'rounded-full aspect-square';
    case 'square':
      return 'rounded-lg aspect-square';
    default: // rectangular
      return 'rounded-lg';
  }
};

export const GoogleBadge: React.FC<GoogleBadgeProps> = ({
  variant = 'signin',
  size = 'medium',
  theme = 'outline',
  text,
  shape = 'rectangular',
  logo_alignment = 'left',
  width,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  context = 'general',
  showPrivacyNote = false,
  confidentialMode = false,
  ...props
}) => {
  const sizeClasses = getSizeClasses(size);
  const themeClasses = getThemeClasses(theme);
  const shapeClasses = getShapeClasses(shape);
  
  const isIconOnly = shape === 'circle' || shape === 'square';

  const getContextualText = () => {
    if (text) return text;
    
    switch (context) {
      case 'therapy':
        return 'Secure sign in with Google';
      case 'crisis':
        return 'Quick access with Google';
      case 'anonymous':
        return 'Private sign in with Google';
      default:
        return GOOGLE_TEXTS[variant];
    }
  };

  const handleClick = () => {
    if (disabled || loading) return;
    onClick?.();
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses.button,
          themeClasses,
          shapeClasses,
          disabled && 'opacity-50 cursor-not-allowed',
          loading && 'cursor-wait',
          logo_alignment === 'center' && 'flex-col gap-2',
          className
        )}
        style={{ 
          width: typeof width === 'number' ? `${width}px` : width 
        }}
        {...props}
      >
        {/* Loading spinner */}
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
        ) : (
          <>
            {/* Google Logo */}
            <div className={cn(
              'flex items-center justify-center',
              !isIconOnly && logo_alignment === 'left' && 'mr-3',
              logo_alignment === 'center' && 'mb-1'
            )}>
              <div className={sizeClasses.icon}>
                {GOOGLE_LOGO_SVG}
              </div>
            </div>

            {/* Text */}
            {!isIconOnly && (
              <span className={cn(
                'font-medium whitespace-nowrap',
                sizeClasses.text
              )}>
                {getContextualText()}
              </span>
            )}
          </>
        )}
      </button>

      {/* Privacy Note for Mental Health Context */}
      {showPrivacyNote && (context === 'therapy' || context === 'crisis' || confidentialMode) && (
        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 flex-shrink-0">
              🔒
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Privacy Protected</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Your Google account info stays separate from therapy data</li>
                <li>• HIPAA-compliant authentication process</li>
                <li>• No personal data shared without consent</li>
                {confidentialMode && (
                  <li>• Anonymous session - minimal data collection</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Crisis Context Warning */}
      {context === 'crisis' && (
        <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded border-l-4 border-amber-400">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 flex-shrink-0">
              ⚡
            </div>
            <div>
              <p className="font-medium mb-1">Crisis Support Access</p>
              <p>
                Signing in allows us to provide personalized crisis support and 
                connect you with appropriate resources.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Context Note */}
      {context === 'anonymous' && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-4 border-gray-400">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 flex-shrink-0">
              🎭
            </div>
            <div>
              <p className="font-medium mb-1">Anonymous Access</p>
              <p>
                Your Google account provides secure access while maintaining 
                anonymity within the platform.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized Google Badge components for mental health platform

export const TherapyGoogleBadge: React.FC<Omit<GoogleBadgeProps, 'context' | 'showPrivacyNote'>> = (props) => (
  <GoogleBadge
    {...props}
    context="therapy"
    showPrivacyNote={true}
    text="Secure Therapy Access"
  />
);

export const CrisisGoogleBadge: React.FC<Omit<GoogleBadgeProps, 'context' | 'theme'>> = (props) => (
  <GoogleBadge
    {...props}
    context="crisis"
    theme="filled_blue"
    text="Quick Crisis Support Access"
  />
);

export const AnonymousGoogleBadge: React.FC<Omit<GoogleBadgeProps, 'context' | 'confidentialMode'>> = (props) => (
  <GoogleBadge
    {...props}
    context="anonymous"
    confidentialMode={true}
    text="Anonymous Support Access"
  />
);

// Google Sign-In Button variations
export const GoogleSignInButton: React.FC<{
  onSuccess: (response: any) => void;
  onError?: (error: any) => void;
  theme?: GoogleBadgeProps['theme'];
  size?: GoogleBadgeProps['size'];
  disabled?: boolean;
  loading?: boolean;
  text?: string;
  className?: string;
}> = ({
  onSuccess,
  onError,
  theme = 'outline',
  size = 'medium',
  disabled = false,
  loading = false,
  text,
  className
}) => {
  const handleGoogleSignIn = async () => {
    try {
      // In a real implementation, this would integrate with Google Sign-In API
      // For now, we'll simulate the flow
      console.log('Initiating Google Sign-In...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful response
      const mockResponse = {
        credential: 'mock-jwt-token',
        select_by: 'btn',
        client_id: 'mock-client-id'
      };
      
      onSuccess(mockResponse);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <GoogleBadge
      variant="signin"
      theme={theme}
      size={size}
      disabled={disabled}
      loading={loading}
      text={text}
      onClick={handleGoogleSignIn}
      className={className}
    />
  );
};

// Hook for Google Sign-In integration
export const useGoogleSignIn = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = React.useCallback(async (options?: {
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    scope?: string;
    prompt?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Google Sign-In (in real implementation)
      // This would use the Google Identity Services library
      
      // Mock implementation for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: '123456789',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://via.placeholder.com/40',
        given_name: 'Test',
        family_name: 'User',
        locale: 'en'
      };

      options?.onSuccess?.(mockUser);
      return mockUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign-in failed';
      setError(errorMessage);
      options?.onError?.(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = React.useCallback(async () => {
    // In real implementation, this would sign out from Google
    console.log('Signing out from Google...');
  }, []);

  return {
    signIn,
    signOut,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Mental health specific Google Sign-In configurations
export const getMentalHealthGoogleConfig = () => ({
  // Scopes specifically needed for mental health platform
  scope: 'openid email profile',
  // Additional privacy-focused configuration
  privacy: {
    minimizeDataCollection: true,
    secureTokenHandling: true,
    hipaaCompliant: true
  },
  // Crisis support integration
  crisisSupport: {
    enableEmergencyAccess: true,
    bypassConsent: false, // Always require consent even in crisis
    connectToSupport: true
  }
});

export default GoogleBadge;

