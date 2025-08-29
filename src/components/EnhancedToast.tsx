import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Heart, Shield, Phone, MessageCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'crisis' | 'wellness' | 'reminder' | 'achievement';
export type ToastPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface EnhancedToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  actions?: ToastAction[];
  onDismiss?: (id: string) => void;
  onExpire?: (id: string) => void;
  onClick?: () => void;
  progress?: boolean;
  icon?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  persistent = false,
  dismissible = true,
  actions = [],
  onDismiss,
  onExpire,
  onClick,
  progress = false,
  icon,
  className = '',
  'data-testid': testId
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (persistent || isPaused) return;

    if (timeRemaining <= 0) {
      handleExpire();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeRemaining(prev => prev - 100);
    }, 100);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, persistent, isPaused]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    if (!dismissible) return;
    
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.(id);
    }, 300); // Animation duration
  };

  const handleExpire = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onExpire?.(id);
    }, 300);
  };

  const handleMouseEnter = () => {
    if (!persistent) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (!persistent) {
      setIsPaused(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (!isVisible) return null;

  // Get icon based on toast type
  const getIcon = () => {
    if (icon) return icon;

    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'crisis':
        return <Shield className="w-5 h-5" />;
      case 'wellness':
        return <Heart className="w-5 h-5" />;
      case 'reminder':
        return <MessageCircle className="w-5 h-5" />;
      case 'achievement':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Get styling based on toast type
  const getTypeClasses = () => {
    const baseClasses = 'border-l-4';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-400 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
      case 'crisis':
        return `${baseClasses} bg-red-100 border-red-500 text-red-900 shadow-lg ring-2 ring-red-200`;
      case 'wellness':
        return `${baseClasses} bg-purple-50 border-purple-400 text-purple-800`;
      case 'reminder':
        return `${baseClasses} bg-indigo-50 border-indigo-400 text-indigo-800`;
      case 'achievement':
        return `${baseClasses} bg-emerald-50 border-emerald-400 text-emerald-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-400 text-gray-800`;
    }
  };

  // Get icon color based on type
  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'crisis':
        return 'text-red-500';
      case 'wellness':
        return 'text-purple-400';
      case 'reminder':
        return 'text-indigo-400';
      case 'achievement':
        return 'text-emerald-400';
      default:
        return 'text-gray-400';
    }
  };

  const progressPercentage = persistent ? 100 : ((duration - timeRemaining) / duration) * 100;

  return (
    <div
      ref={toastRef}
      className={`
        enhanced-toast
        ${getTypeClasses()}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${isExiting ? 'toast-exit' : 'toast-enter'}
        ${className}
        max-w-md w-full bg-white rounded-lg shadow-lg pointer-events-auto
        transform transition-all duration-300 ease-in-out
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role={type === 'crisis' ? 'alert' : 'status'}
      aria-live={type === 'crisis' ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-testid={testId}
    >
      {/* Progress bar */}
      {progress && !persistent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              type === 'success' ? 'bg-green-400' :
              type === 'error' ? 'bg-red-400' :
              type === 'warning' ? 'bg-yellow-400' :
              type === 'crisis' ? 'bg-red-500' :
              'bg-blue-400'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium mb-1">
                {title}
              </p>
            )}
            <p className={`text-sm ${title ? 'text-gray-600' : 'font-medium'}`}>
              {message}
            </p>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="mt-3 flex gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                    className={`
                      text-xs font-medium px-3 py-1.5 rounded-md transition-colors
                      ${action.style === 'primary' ? 
                        'bg-blue-600 text-white hover:bg-blue-700' :
                        action.style === 'danger' ?
                        'bg-red-600 text-white hover:bg-red-700' :
                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Crisis-specific actions */}
            {type === 'crisis' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = 'tel:988';
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  Call 988
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open crisis resources
                  }}
                  className="text-xs font-medium px-3 py-1.5 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  Resources
                </button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Time remaining indicator for persistent toasts */}
        {!persistent && duration > 10000 && (
          <div className="mt-2 text-xs text-gray-500">
            Dismissing in {Math.ceil(timeRemaining / 1000)}s
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  position: ToastPosition;
  toasts: EnhancedToastProps[];
  onDismiss: (id: string) => void;
  onExpire: (id: string) => void;
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position,
  toasts,
  onDismiss,
  onExpire,
  className = ''
}) => {
  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`
        toast-container
        fixed z-50 pointer-events-none
        ${getPositionClasses()}
        ${className}
      `}
      style={{ maxWidth: '420px' }}
    >
      <div className="space-y-3">
        {toasts.map((toast) => (
          <EnhancedToast
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
            onExpire={onExpire}
          />
        ))}
      </div>
    </div>
  );
};

// Toast Manager Hook
export interface ToastManager {
  toasts: EnhancedToastProps[];
  showToast: (toast: Omit<EnhancedToastProps, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  showSuccess: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showError: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showWarning: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showInfo: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showCrisis: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showWellness: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showReminder: (message: string, options?: Partial<EnhancedToastProps>) => string;
  showAchievement: (message: string, options?: Partial<EnhancedToastProps>) => string;
}

export const useToastManager = (): ToastManager => {
  const [toasts, setToasts] = useState<EnhancedToastProps[]>([]);

  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showToast = (toast: Omit<EnhancedToastProps, 'id'>) => {
    const id = generateId();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  // Convenience methods
  const showSuccess = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'success', message, ...options });

  const showError = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'error', message, duration: 8000, ...options });

  const showWarning = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'warning', message, duration: 7000, ...options });

  const showInfo = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'info', message, ...options });

  const showCrisis = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ 
      type: 'crisis', 
      message, 
      persistent: true, 
      dismissible: false,
      actions: [
        { label: 'Get Help Now', action: () => window.location.href = 'tel:988', style: 'primary' },
        { label: 'I\'m Safe', action: () => dismissAll(), style: 'secondary' }
      ],
      ...options 
    });

  const showWellness = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'wellness', message, duration: 6000, ...options });

  const showReminder = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'reminder', message, duration: 8000, ...options });

  const showAchievement = (message: string, options: Partial<EnhancedToastProps> = {}) =>
    showToast({ type: 'achievement', message, duration: 7000, ...options });

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCrisis,
    showWellness,
    showReminder,
    showAchievement
  };
};

// Export default
export default EnhancedToast;
