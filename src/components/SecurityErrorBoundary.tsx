/**
 * Security-Enhanced Error Boundary
 * Catches errors while protecting sensitive information
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  isSecurityError: boolean;
}

class SecurityErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: null,
    isSecurityError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if this is a security-related error
    const isSecurityError = SecurityErrorBoundary.isSecurityError(error);
    
    return {
      hasError: true,
      errorId: Date.now().toString(36),
      isSecurityError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId;
    
    // Sanitize error information before logging
    const sanitizedError = this.sanitizeError(error);
    const sanitizedErrorInfo = this.sanitizeErrorInfo(errorInfo);

    // Log error with security considerations
    logger.error('Application error caught by boundary', {
      errorId,
      error: sanitizedError,
      errorInfo: sanitizedErrorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isSecurityError: this.state.isSecurityError
    });

    // If it's a security error, take additional precautions
    if (this.state.isSecurityError) {
      this.handleSecurityError(error);
    }
  }

  private static isSecurityError(error: Error): boolean {
    const securityKeywords = [
      'unauthorized',
      'forbidden',
      'csrf',
      'xss',
      'injection',
      'authentication',
      'permission',
      'access denied'
    ];

    const errorMessage = error.message.toLowerCase();
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private sanitizeError(error: Error): any {
    return {
      name: error.name,
      message: this.sanitizeMessage(error.message),
      stack: this.sanitizeStack(error.stack)
    };
  }

  private sanitizeErrorInfo(errorInfo: ErrorInfo): any {
    return {
      componentStack: this.sanitizeStack(errorInfo.componentStack)
    };
  }

  private sanitizeMessage(message: string): string {
    // Remove potential sensitive information from error messages
    const sensitivePatterns = [
      /token[=:\s]+[a-zA-Z0-9]+/gi,
      /password[=:\s]+\S+/gi,
      /api[_-]?key[=:\s]+\S+/gi,
      /secret[=:\s]+\S+/gi,
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email pattern
    ];

    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  private sanitizeStack(stack?: string): string {
    if (!stack) return '';
    
    // Remove file paths that might contain sensitive information
    return stack
      .replace(/file:\/\/\/.*?\/([^\/]+\.js)/g, 'file:///...//$1')
      .replace(/http:\/\/localhost:\d+/g, 'http://localhost:****')
      .replace(/https:\/\/[^\/]+/g, 'https://[DOMAIN]');
  }

  private handleSecurityError(error: Error): void {
    // Additional security measures for security-related errors
    console.warn('Security error detected - taking precautionary measures');
    
    // Clear potentially compromised session data
    try {
      sessionStorage.clear();
      
      // Only clear non-essential localStorage items
      const essentialKeys = ['theme', 'language', 'accessibility'];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !essentialKeys.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Failed to clear session data:', e);
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      errorId: null,
      isSecurityError: false
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>
              We're sorry, but something unexpected happened. 
              {this.state.isSecurityError && (
                <span> For your security, we've cleared your session data.</span>
              )}
            </p>
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
            </div>
            <details className="error-details">
              <summary>Technical Details (Error ID: {this.state.errorId})</summary>
              <p>
                Please include this Error ID when contacting support: 
                <strong>{this.state.errorId}</strong>
              </p>
            </details>
            <div className="crisis-notice">
              <p>
                <strong>Need immediate help?</strong><br />
                Crisis Support: <a href="tel:988">988</a> | 
                Emergency: <a href="tel:911">911</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecurityErrorBoundary;
