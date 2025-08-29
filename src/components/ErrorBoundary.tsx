/**
 * Comprehensive Error Boundary System
 *
 * Robust error handling for the Astral Core mental health platform
 * with specialized fallback UIs and crisis intervention priority.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';

// Simple icon components to avoid external dependencies
const AlertIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SupportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
  </svg>
);

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isMinimized: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  enableMinimize?: boolean;
  showErrorDetails?: boolean;
  context?: 'general' | 'crisis' | 'auth' | 'data';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isMinimized: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      isMinimized: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to error tracking service (e.g., Sentry)
      if (typeof window !== 'undefined' && window.console) {
        console.group('🚨 Error Boundary Report');
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.error('Error ID:', this.state.errorId);
        console.error('Context:', this.props.context || 'general');
        console.error('Retry Count:', this.state.retryCount);
        console.groupEnd();
      }

      // Send to analytics/monitoring if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.toString(),
          fatal: false,
          error_id: this.state.errorId,
          context: this.props.context || 'general'
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isMinimized: false
      }));

      // Clear any existing timeout
      if (this.retryTimeoutId) {
        clearTimeout(this.retryTimeoutId);
      }

      // Set timeout to reset retry count after successful render
      this.retryTimeoutId = setTimeout(() => {
        this.setState({ retryCount: 0 });
      }, 30000); // Reset after 30 seconds of successful operation
    }
  };

  private handleMinimize = () => {
    this.setState(prevState => ({
      isMinimized: !prevState.isMinimized
    }));
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleGetSupport = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/crisis-support';
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { 
        enableRetry = true, 
        maxRetries = 3, 
        enableMinimize = false,
        showErrorDetails = false,
        context = 'general'
      } = this.props;

      const canRetry = enableRetry && this.state.retryCount < maxRetries;
      const isCrisisContext = context === 'crisis';

      // Minimized state
      if (this.state.isMinimized && enableMinimize) {
        return (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={this.handleMinimize}
              className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
              title="Expand error details"
            >
              <AlertIcon />
            </button>
          </div>
        );
      }

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isCrisisContext ? 'bg-red-50' : 'bg-gray-50'
        }`}>
          <div className={`max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 ${
            isCrisisContext ? 'border-red-500' : 'border-yellow-500'
          }`}>
            {/* Header */}
            <div className={`p-6 ${isCrisisContext ? 'bg-red-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${
                  isCrisisContext ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  <AlertIcon />
                </div>
                <div className="ml-3">
                  <h3 className={`text-lg font-medium ${
                    isCrisisContext ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {isCrisisContext ? 'Crisis Support Error' : 'Something went wrong'}
                  </h3>
                  <p className={`mt-1 text-sm ${
                    isCrisisContext ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {isCrisisContext 
                      ? 'An error occurred in crisis support. Your safety is our priority.'
                      : 'We encountered an unexpected error. Don\'t worry, we\'re here to help.'
                    }
                  </p>
                </div>
                
                {enableMinimize && (
                  <button
                    onClick={this.handleMinimize}
                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                    title="Minimize error"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {isCrisisContext && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    🆘 If you're in immediate danger, please contact emergency services:
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    • Call 911 (US) or your local emergency number
                    • National Suicide Prevention Lifeline: 988
                    • Crisis Text Line: Text HOME to 741741
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Error ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    {this.state.errorId}
                  </code>
                </p>

                {this.state.retryCount > 0 && (
                  <p className="text-gray-500 text-xs">
                    Retry attempt: {this.state.retryCount} of {maxRetries}
                  </p>
                )}

                {showErrorDetails && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="flex flex-wrap gap-2">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshIcon />
                    <span className="ml-2">Try Again</span>
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <HomeIcon />
                  <span className="ml-2">Go Home</span>
                </button>

                {isCrisisContext && (
                  <button
                    onClick={this.handleGetSupport}
                    className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <SupportIcon />
                    <span className="ml-2">Get Support</span>
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                If this problem persists, please contact our support team with the error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
export const CrisisErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="crisis" 
    enableRetry={true} 
    maxRetries={5}
    showErrorDetails={false}
  >
    {children}
  </ErrorBoundary>
);

export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="auth" 
    enableRetry={true} 
    maxRetries={3}
    enableMinimize={true}
  >
    {children}
  </ErrorBoundary>
);

export const DataErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="data" 
    enableRetry={true} 
    maxRetries={2}
    showErrorDetails={true}
  >
    {children}
  </ErrorBoundary>
);

// Hook for manual error reporting
export const useErrorHandler = () => {
  const reportError = (error: Error, context?: string) => {
    console.error('Manual error report:', error);
    
    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        context: context || 'manual'
      });
    }
  };

  return { reportError };
};

export default ErrorBoundary;
