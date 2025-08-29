import React from 'react';
import './ErrorFallback.css';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary, 
  className = '' 
}) => {
  const isDevelopment = import.meta.env.DEV;

  const handleReportError = () => {
    // In production, this could send error details to an error tracking service
    console.error('Error reported:', error);
    
    // Could integrate with error tracking service here
    if (window.location.href.includes('localhost')) {
      alert('Error reported to development console');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={`error-fallback ${className}`} role="alert">
      <div className="error-fallback__container">
        <div className="error-fallback__icon">
          ⚠️
        </div>
        
        <div className="error-fallback__content">
          <h2 className="error-fallback__title">
            Oops! Something went wrong
          </h2>
          
          <p className="error-fallback__description">
            We're sorry, but something unexpected happened. This error has been logged 
            and we're working to fix it.
          </p>

          {isDevelopment && (
            <details className="error-fallback__details">
              <summary className="error-fallback__details-summary">
                Technical Details (Development Mode)
              </summary>
              <div className="error-fallback__error-info">
                <h4>Error Message:</h4>
                <pre className="error-fallback__error-message">
                  {error.message}
                </pre>
                
                {error.stack && (
                  <>
                    <h4>Stack Trace:</h4>
                    <pre className="error-fallback__stack-trace">
                      {error.stack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="error-fallback__actions">
          <button
            className="error-fallback__button error-fallback__button--primary"
            onClick={resetErrorBoundary}
            type="button"
          >
            Try Again
          </button>
          
          <button
            className="error-fallback__button error-fallback__button--secondary"
            onClick={handleRefresh}
            type="button"
          >
            Refresh Page
          </button>
          
          <button
            className="error-fallback__button error-fallback__button--tertiary"
            onClick={handleReportError}
            type="button"
          >
            Report Issue
          </button>
        </div>

        <div className="error-fallback__help">
          <p className="error-fallback__help-text">
            If this problem persists, please try:
          </p>
          <ul className="error-fallback__help-list">
            <li>Refreshing the page</li>
            <li>Clearing your browser cache</li>
            <li>Checking your internet connection</li>
            <li>Contacting support if the issue continues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;