/**
 * User Feedback System
 * Provides comprehensive feedback for all user actions
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAccessibility } from './AccessibilityProvider';

// Feedback types
type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';
type FeedbackPosition = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean;
  position?: FeedbackPosition;
  icon?: React.ReactNode;
  progress?: number;
}

interface FeedbackContextValue {
  showFeedback: (feedback: Omit<FeedbackMessage, 'id'>) => string;
  hideFeedback: (id: string) => void;
  clearAllFeedback: () => void;
  updateFeedback: (id: string, updates: Partial<FeedbackMessage>) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

// Default icons for feedback types
const FeedbackIcons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  loading: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-spin">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M10 2a8 8 0 018 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
};

// Toast Notification Component
const Toast: React.FC<{
  feedback: FeedbackMessage;
  onDismiss: (id: string) => void;
}> = ({ feedback, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const { announce } = useAccessibility();

  useEffect(() => {
    // Announce to screen readers
    announce(`${feedback.type}: ${feedback.message}`, feedback.type === 'error' ? 'assertive' : 'polite');

    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss if not persistent
    if (!feedback.persistent && feedback.duration) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - (100 / (feedback.duration! / 100));
        });
      }, 100);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(feedback.id), 300);
      }, feedback.duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [feedback, onDismiss, announce]);

  const typeClasses = {
    success: 'feedback-toast--success',
    error: 'feedback-toast--error',
    warning: 'feedback-toast--warning',
    info: 'feedback-toast--info',
    loading: 'feedback-toast--loading'
  };

  return (
    <div 
      className={[
        'feedback-toast',
        typeClasses[feedback.type],
        isVisible && 'feedback-toast--visible'
      ].filter(Boolean).join(' ')}
      role={feedback.type === 'error' ? 'alert' : 'status'}
      aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="feedback-toast__icon">
        {feedback.icon || FeedbackIcons[feedback.type]}
      </div>
      <div className="feedback-toast__content">
        <div className="feedback-toast__message">{feedback.message}</div>
        {feedback.description && (
          <div className="feedback-toast__description">{feedback.description}</div>
        )}
        {feedback.action && (
          <button 
            className="feedback-toast__action"
            onClick={feedback.action.onClick}
            aria-label={feedback.action.label}
          >
            {feedback.action.label}
          </button>
        )}
      </div>
      {feedback.dismissible && (
        <button 
          className="feedback-toast__dismiss"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(feedback.id), 300);
          }}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      )}
      {!feedback.persistent && feedback.duration && (
        <div className="feedback-toast__progress">
          <div 
            className="feedback-toast__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Inline Feedback Component
export const InlineFeedback: React.FC<{
  type: FeedbackType;
  message: string;
  visible: boolean;
  className?: string;
}> = ({ type, message, visible, className = '' }) => {
  const typeClasses = {
    success: 'inline-feedback--success',
    error: 'inline-feedback--error',
    warning: 'inline-feedback--warning',
    info: 'inline-feedback--info',
    loading: 'inline-feedback--loading'
  };

  if (!visible) return null;

  return (
    <div 
      className={`inline-feedback ${typeClasses[type]} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="inline-feedback__icon">
        {FeedbackIcons[type]}
      </span>
      <span className="inline-feedback__message">{message}</span>
    </div>
  );
};

// Form Field Feedback Component
export const FieldFeedback: React.FC<{
  error?: string;
  warning?: string;
  success?: string;
  touched?: boolean;
}> = ({ error, warning, success, touched }) => {
  if (!touched) return null;

  if (error) {
    return (
      <div className="field-feedback field-feedback--error" role="alert">
        {FeedbackIcons.error}
        <span>{error}</span>
      </div>
    );
  }

  if (warning) {
    return (
      <div className="field-feedback field-feedback--warning" role="status">
        {FeedbackIcons.warning}
        <span>{warning}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="field-feedback field-feedback--success" role="status">
        {FeedbackIcons.success}
        <span>{success}</span>
      </div>
    );
  }

  return null;
};

// Confirmation Dialog Component
export const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel
}) => {
  const { getAriaLabel } = useAccessibility();

  if (!isOpen) return null;

  const typeClasses = {
    danger: 'confirmation-dialog--danger',
    warning: 'confirmation-dialog--warning',
    info: 'confirmation-dialog--info'
  };

  return (
    <div className="confirmation-dialog-overlay" onClick={onCancel}>
      <div 
        className={`confirmation-dialog ${typeClasses[type]}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        <h2 id="confirmation-title" className="confirmation-dialog__title">
          {title}
        </h2>
        <p id="confirmation-message" className="confirmation-dialog__message">
          {message}
        </p>
        <div className="confirmation-dialog__actions">
          <button 
            className="confirmation-dialog__cancel"
            onClick={onCancel}
            aria-label={getAriaLabel('button.cancel')}
          >
            {cancelLabel}
          </button>
          <button 
            className={`confirmation-dialog__confirm confirmation-dialog__confirm--${type}`}
            onClick={onConfirm}
            aria-label={getAriaLabel('button.submit')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Feedback Provider Component
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  let feedbackIdCounter = 0;

  const showFeedback = useCallback((feedback: Omit<FeedbackMessage, 'id'>) => {
    const id = `feedback-${Date.now()}-${++feedbackIdCounter}`;
    const newFeedback: FeedbackMessage = {
      id,
      duration: feedback.persistent ? undefined : feedback.duration || 5000,
      dismissible: feedback.dismissible !== false,
      position: feedback.position || 'top-right',
      ...feedback
    };

    setFeedbackMessages(prev => [...prev, newFeedback]);
    return id;
  }, []);

  const hideFeedback = useCallback((id: string) => {
    setFeedbackMessages(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAllFeedback = useCallback(() => {
    setFeedbackMessages([]);
  }, []);

  const updateFeedback = useCallback((id: string, updates: Partial<FeedbackMessage>) => {
    setFeedbackMessages(prev =>
      prev.map(f => f.id === id ? { ...f, ...updates } : f)
    );
  }, []);

  const value: FeedbackContextValue = {
    showFeedback,
    hideFeedback,
    clearAllFeedback,
    updateFeedback
  };

  // Group feedback by position
  const feedbackByPosition = feedbackMessages.reduce((acc, feedback) => {
    const position = feedback.position || 'top-right';
    if (!acc[position]) acc[position] = [];
    acc[position].push(feedback);
    return acc;
  }, {} as Record<FeedbackPosition, FeedbackMessage[]>);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {Object.entries(feedbackByPosition).map(([position, messages]) => (
        <div key={position} className={`feedback-container feedback-container--${position}`}>
          {messages.map(feedback => (
            <Toast key={feedback.id} feedback={feedback} onDismiss={hideFeedback} />
          ))}
        </div>
      ))}
    </FeedbackContext.Provider>
  );
};

// Hook to use feedback system
export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};

// Utility functions for common feedback scenarios
export const feedbackUtils = {
  success: (message: string, options?: Partial<FeedbackMessage>) => ({
    type: 'success' as FeedbackType,
    message,
    ...options
  }),

  error: (message: string, error?: Error, options?: Partial<FeedbackMessage>) => ({
    type: 'error' as FeedbackType,
    message,
    description: error?.message,
    ...options
  }),

  warning: (message: string, options?: Partial<FeedbackMessage>) => ({
    type: 'warning' as FeedbackType,
    message,
    ...options
  }),

  info: (message: string, options?: Partial<FeedbackMessage>) => ({
    type: 'info' as FeedbackType,
    message,
    ...options
  }),

  loading: (message: string = 'Loading...', options?: Partial<FeedbackMessage>) => ({
    type: 'loading' as FeedbackType,
    message,
    persistent: true,
    dismissible: false,
    ...options
  }),

  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string | ((result: T) => string);
      error?: string | ((error: Error) => string);
    } = {}
  ) => {
    const { showFeedback, hideFeedback } = useFeedback();
    const loadingId = showFeedback({ ...feedbackUtils.loading(messages.loading || 'Processing...') });

    try {
      const result = await promise;
      hideFeedback(loadingId);
      const successMessage = typeof messages.success === 'function'
        ? messages.success(result)
        : messages.success || 'Operation completed successfully';

      showFeedback(feedbackUtils.success(successMessage));
      return result;
    } catch (error) {
      hideFeedback(loadingId);
      const errorMessage = typeof messages.error === 'function'
        ? messages.error(error as Error)
        : messages.error || 'An error occurred';

      showFeedback(feedbackUtils.error(errorMessage, error as Error));
      throw error;
    }
  }
};

export default FeedbackProvider;