import React from 'react';

interface LoadingStateConfig {
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingStateConfig> = ({
  size = 'medium',
  variant = 'spinner',
  color = 'primary',
  text = 'Loading...',
  showText = true,
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };

  const colorClasses = {
    primary: 'loading-primary',
    secondary: 'loading-secondary',
    white: 'loading-white'
  };

  const baseClasses = `loading-container ${sizeClasses[size]} ${colorClasses[color]} ${fullScreen ? 'loading-fullscreen' : ''} ${className}`;

  const renderSpinner = () => (
    <output className={`${baseClasses} loading-spinner`} aria-live="polite">
      <div className="spinner-element">
        <svg viewBox="0 0 50 50" className="spinner-svg">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="spinner-circle"
          />
        </svg>
      </div>
      {showText && (
        <span className="loading-text" aria-label={text}>
          {text}
        </span>
      )}
      <span className="sr-only">{text}</span>
    </output>
  );

  const renderDots = () => (
    <output className={`${baseClasses} loading-dots`} aria-live="polite">
      <div className="dots-container">
        <div className="dot dot-1"></div>
        <div className="dot dot-2"></div>
        <div className="dot dot-3"></div>
      </div>
      {showText && (
        <span className="loading-text" aria-label={text}>
          {text}
        </span>
      )}
      <span className="sr-only">{text}</span>
    </output>
  );

  const renderPulse = () => (
    <output className={`${baseClasses} loading-pulse`} aria-live="polite">
      <div className="pulse-element"></div>
      {showText && (
        <span className="loading-text" aria-label={text}>
          {text}
        </span>
      )}
      <span className="sr-only">{text}</span>
    </output>
  );

  const renderSkeleton = () => (
    <output className={`${baseClasses} loading-skeleton`} aria-live="polite">
      <div className="skeleton-lines">
        <div className="skeleton-line skeleton-line-1"></div>
        <div className="skeleton-line skeleton-line-2"></div>
        <div className="skeleton-line skeleton-line-3"></div>
      </div>
      <span className="sr-only">{text}</span>
    </output>
  );

  switch (variant) {
    case 'dots':
      return renderDots();
    case 'pulse':
      return renderPulse();
    case 'skeleton':
      return renderSkeleton();
    case 'spinner':
    default:
      return renderSpinner();
  }
};

// Pre-configured loading components for common use cases
export const PageLoader: React.FC<Partial<LoadingStateConfig>> = (props) => (
  <LoadingSpinner
    size="large"
    fullScreen={true}
    text="Loading page..."
    {...props}
  />
);

export const ComponentLoader: React.FC<Partial<LoadingStateConfig>> = (props) => (
  <LoadingSpinner
    size="medium"
    text="Loading..."
    {...props}
  />
);

export const ButtonLoader: React.FC<Partial<LoadingStateConfig>> = (props) => (
  <LoadingSpinner
    size="small"
    variant="dots"
    showText={false}
    color="white"
    {...props}
  />
);

export const InlineLoader: React.FC<Partial<LoadingStateConfig>> = (props) => (
  <LoadingSpinner
    size="small"
    variant="spinner"
    showText={false}
    {...props}
  />
);

export const SkeletonLoader: React.FC<Partial<LoadingStateConfig>> = (props) => (
  <LoadingSpinner
    variant="skeleton"
    showText={false}
    {...props}
  />
);

// Loading wrapper component for conditional loading states
interface LoadingWrapperProps {
  loading: boolean;
  loadingConfig?: LoadingStateConfig;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  loadingConfig = {},
  error,
  empty = false,
  emptyMessage = 'No data available',
  children
}) => {
  if (loading) {
    return <ComponentLoader {...loadingConfig} />;
  }

  if (error) {
    return (
      <div className="loading-error" role="alert">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="loading-empty">
        <div className="empty-icon">📭</div>
        <div className="empty-text">
          <h3>No content</h3>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for managing loading states
export const useLoadingState = (initialLoading = false) => {
  const [loading, setLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError
  };
};

export default LoadingSpinner;