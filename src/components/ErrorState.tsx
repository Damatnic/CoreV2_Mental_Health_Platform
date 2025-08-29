import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, WifiOff, ServerCrash, AlertCircle, HelpCircle } from 'lucide-react';
import { AppButton } from './AppButton';

interface ErrorStateProps {
  type?: 'network' | 'server' | '404' | '403' | '500' | 'generic' | 'loading' | 'empty' | 'maintenance';
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  className?: string;
  illustration?: React.ReactNode;
  actions?: React.ReactNode;
  errorDetails?: string;
  showErrorDetails?: boolean;
}

const ERROR_CONFIGS = {
  network: {
    icon: WifiOff,
    title: 'Connection Problem',
    message: 'Unable to connect to our servers. Please check your internet connection and try again.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  server: {
    icon: ServerCrash,
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  404: {
    icon: HelpCircle,
    title: 'Page Not Found',
    message: 'The page you\'re looking for doesn\'t exist or has been moved.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  403: {
    icon: AlertCircle,
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  500: {
    icon: Bug,
    title: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  loading: {
    icon: RefreshCw,
    title: 'Loading...',
    message: 'Please wait while we load your content.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  empty: {
    icon: AlertCircle,
    title: 'No Data Found',
    message: 'There\'s nothing to show here yet.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  maintenance: {
    icon: AlertTriangle,
    title: 'Under Maintenance',
    message: 'We\'re performing scheduled maintenance. Please check back soon.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    message: 'An error occurred while loading this content.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  showRetry = true,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
  className = '',
  illustration,
  actions,
  errorDetails,
  showErrorDetails = false
}) => {
  const config = ERROR_CONFIGS[type];
  const IconComponent = config.icon;
  
  const finalTitle = title || config.title;
  const finalMessage = message || config.message;

  const [showDetails, setShowDetails] = React.useState(false);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`error-state flex flex-col items-center justify-center min-h-[400px] p-8 text-center ${className}`}>
      {/* Illustration or Icon */}
      <div className="mb-6">
        {illustration || (
          <div className={`w-20 h-20 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center mb-4`}>
            <IconComponent 
              className={`w-10 h-10 ${config.color} ${type === 'loading' ? 'animate-spin' : ''}`} 
            />
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        {finalTitle}
      </h2>

      {/* Message */}
      <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
        {finalMessage}
      </p>

      {/* Error Details Toggle */}
      {(errorDetails || showErrorDetails) && (
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          
          {showDetails && (
            <div className="mt-3 p-4 bg-gray-100 rounded-lg text-left text-sm text-gray-700 font-mono max-w-md overflow-auto">
              {errorDetails || 'No additional details available'}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {/* Custom Actions */}
        {actions}

        {/* Default Actions */}
        {!actions && (
          <>
            {showRetry && (
              <AppButton
                onClick={handleRetry}
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </AppButton>
            )}
            
            {showBack && (
              <AppButton
                onClick={handleBack}
                variant="secondary"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Go Back
              </AppButton>
            )}
            
            {showHome && (
              <AppButton
                onClick={handleHome}
                variant="ghost"
                icon={<Home className="w-4 h-4" />}
              >
                Go Home
              </AppButton>
            )}
          </>
        )}
      </div>

      {/* Additional Help Text for specific error types */}
      {type === 'network' && (
        <div className="mt-6 text-sm text-gray-500 max-w-md">
          <p className="mb-2">If the problem persists, try:</p>
          <ul className="text-left space-y-1">
            <li>• Checking your internet connection</li>
            <li>• Refreshing the page</li>
            <li>• Clearing your browser cache</li>
            <li>• Trying a different browser</li>
          </ul>
        </div>
      )}

      {type === 'maintenance' && (
        <div className="mt-6 text-sm text-gray-500">
          <p>Estimated completion: Usually within 30 minutes</p>
          <p>Follow us on social media for updates</p>
        </div>
      )}

      {type === '403' && (
        <div className="mt-6 text-sm text-gray-500">
          <p>If you believe this is an error, please contact support</p>
        </div>
      )}
    </div>
  );
};

// Specialized error components for common use cases
export const NetworkErrorState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState {...props} type="network" showRetry />
);

export const NotFoundErrorState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState {...props} type="404" showHome showBack />
);

export const ServerErrorState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState {...props} type="server" showRetry showHome />
);

export const LoadingState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState {...props} type="loading" showRetry={false} />
);

export const EmptyState: React.FC<Omit<ErrorStateProps, 'type'> & {
  actionLabel?: string;
  onAction?: () => void;
}> = ({ actionLabel, onAction, ...props }) => (
  <ErrorState 
    {...props} 
    type="empty" 
    showRetry={false}
    actions={
      actionLabel && onAction ? (
        <AppButton onClick={onAction} variant="primary">
          {actionLabel}
        </AppButton>
      ) : undefined
    }
  />
);

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <ErrorState
          type="generic"
          title="Something went wrong"
          message="An unexpected error occurred in the application."
          showRetry
          onRetry={() => this.setState({ hasError: false })}
          errorDetails={this.state.error?.stack}
          showErrorDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error handled:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    retry,
    hasError: error !== null
  };
};

// Mental health specific error states
export const CrisisErrorState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState
    {...props}
    type="generic"
    title="Unable to Connect"
    message="We're having trouble connecting you to crisis support. If this is an emergency, please call 911 or go to your nearest emergency room."
    actions={
      <div className="space-y-3">
        <AppButton
          onClick={() => window.open('tel:911')}
          variant="danger"
          className="w-full"
        >
          Call 911 - Emergency
        </AppButton>
        <AppButton
          onClick={() => window.open('tel:988')}
          variant="primary"
          className="w-full"
        >
          Call 988 - Crisis Line
        </AppButton>
        <AppButton
          onClick={() => window.open('sms:741741?body=HOME')}
          variant="secondary"
          className="w-full"
        >
          Text Crisis Line
        </AppButton>
      </div>
    }
    className="bg-red-50 border border-red-200 rounded-lg"
  />
);

export const WellnessDataErrorState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState
    {...props}
    type="generic"
    title="Wellness Data Unavailable"
    message="We're unable to load your wellness data right now. Your progress is safely stored and will be restored when the connection is restored."
    showRetry
  />
);

export const ChatConnectionErrorState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState
    {...props}
    type="network"
    title="Chat Connection Lost"
    message="We've lost connection to the chat service. Your messages are being queued and will be sent when the connection is restored."
    showRetry
  />
);

export default ErrorState;
