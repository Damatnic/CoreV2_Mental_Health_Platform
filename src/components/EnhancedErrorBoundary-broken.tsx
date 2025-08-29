import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Phone, MessageCircle, Bug, Copy, ExternalLink } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableErrorReporting?: boolean;
  showCrisisSupport?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
  reportStatus: 'idle' | 'sending' | 'sent' | 'failed';
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportStatus: 'idle',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo
    });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Automatically report error if enabled
    if (this.props.enableErrorReporting) {
      this.reportError(error, errorInfo);
    }

    // Track error in analytics (if available)
    this.trackError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (
      hasError &&
      prevProps.resetKeys !== resetKeys &&
      resetKeys &&
      resetKeys.length > 0
    ) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset when any prop changes if resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportStatus: 'idle',
      retryCount: 0
    });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({ retryCount: retryCount + 1 });
      this.resetErrorBoundary();
    } else {
      // Auto-retry after delay if max retries reached
      this.retryTimeoutId = window.setTimeout(() => {
        this.setState({ retryCount: 0 });
        this.resetErrorBoundary();
      }, 5000);
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    this.setState({ isReporting: true, reportStatus: 'sending' });

    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        sessionId: this.getSessionId()
      };

      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      });

      if (response.ok) {
        this.setState({ reportStatus: 'sent' });
      } else {
        throw new Error('Failed to report error');
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      this.setState({ reportStatus: 'failed' });
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private trackError(error: Error, errorInfo: ErrorInfo) {
    // Track error in analytics service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_id: this.state.errorId,
          component_stack: errorInfo.componentStack
        }
      });
    }
  }

  private getUserId(): string | null {
    // Get user ID from localStorage or session
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  private getSessionId(): string | null {
    // Get session ID from sessionStorage
    try {
      return sessionStorage.getItem('sessionId') || null;
    } catch {
      return null;
    }
  }

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorDetails = `
Error ID: ${errorId}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        alert('Error details copied to clipboard');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorDetails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard');
    }
  };

  private openIssueReport = () => {
    const { error, errorId } = this.state;
    const issueUrl = `https://github.com/your-org/mental-health-platform/issues/new?` +
      `title=${encodeURIComponent(`Bug: ${error?.message}`)}&` +
      `body=${encodeURIComponent(`Error ID: ${errorId}\nDescription: Please describe what you were doing when this error occurred.`)}`;
    
    window.open(issueUrl, '_blank');
  };

  render() {
    const { hasError, error, errorInfo, errorId, reportStatus, retryCount } = this.state;
    const { 
      children, 
      fallback, 
      showErrorDetails = false, 
      enableErrorReporting = true,
      showCrisisSupport = true,
      className = '' 
    } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`enhanced-error-boundary min-h-screen bg-red-50 ${className}`}>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Error Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-red-800 mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-red-700 mb-6">
                We encountered an unexpected error. Don't worry - your data is safe, 
                and our team has been notified.
              </p>

              {errorId && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    <strong>Error ID:</strong> {errorId}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Please include this ID when reporting the issue
                  </p>
                </div>
              )}
            </div>

            {/* Crisis Support Section */}
            {showCrisisSupport && (
              <div className="bg-red-100 border border-red-300 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Need Immediate Support?
                    </h3>
                    <p className="text-red-700 mb-4">
                      If you're experiencing a mental health crisis, help is available 24/7.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="tel:988"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call 988
                      </a>
                      <a
                        href="sms:741741"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Text 741741
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <button
                onClick={this.handleRetry}
                disabled={retryCount >= 3}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                {retryCount >= 3 ? 'Auto-retrying...' : 'Try Again'}
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
              
              <button
                onClick={this.handleRefresh}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>
            </div>

            {/* Error Reporting Status */}
            {enableErrorReporting && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Error Reporting</h4>
                    <p className="text-sm text-gray-600">
                      {reportStatus === 'idle' && 'Ready to report error'}
                      {reportStatus === 'sending' && 'Sending error report...'}
                      {reportStatus === 'sent' && 'Error report sent successfully'}
                      {reportStatus === 'failed' && 'Failed to send error report'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={this.copyErrorDetails}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Details
                    </button>
                    <button
                      onClick={this.openIssueReport}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Details (Developer Mode) */}
            {showErrorDetails && error && (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="w-5 h-5 text-red-400" />
                  <h4 className="font-medium">Error Details</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <strong className="text-red-400">Message:</strong>
                    <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-auto">
                      {error.message}
                    </pre>
                  </div>
                  
                  {error.stack && (
                    <div>
                      <strong className="text-red-400">Stack Trace:</strong>
                      <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <strong className="text-red-400">Component Stack:</strong>
                      <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Retry Information */}
            {retryCount > 0 && (
              <div className="text-center text-gray-600 text-sm">
                {retryCount < 3 ? (
                  <p>Attempt {retryCount + 1} of 3</p>
                ) : (
                  <p>Maximum retries reached. Auto-retrying in 5 seconds...</p>
                )}
              </div>
            )}

            {/* Support Information */}
            <div className="mt-12 text-center text-gray-600">
              <p className="mb-4">
                If this problem persists, please contact our support team.
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Contact Support
                </a>
                <a
                  href="/help"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Help Center
                </a>
                <a
                  href="/status"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  System Status
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for easier usage
interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableErrorReporting?: boolean;
  showCrisisSupport?: boolean;
  resetKeys?: Array<string | number>;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...options}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default EnhancedErrorBoundary;
