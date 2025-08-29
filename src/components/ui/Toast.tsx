import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
  className?: string;
  'data-testid'?: string;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  dismissible = true,
  onDismiss,
  className = '',
  'data-testid': testId
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.(id);
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-400 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-800';
    }
  };

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
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className={`
        toast
        ${getTypeClasses()}
        ${isExiting ? 'toast-exit' : 'toast-enter'}
        ${className}
        max-w-md w-full bg-white rounded-lg shadow-lg pointer-events-auto
        border-l-4 transform transition-all duration-300 ease-in-out
      `}
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium mb-1">
                {title}
              </p>
            )}
            <p className={`text-sm ${title ? 'text-gray-600' : 'font-medium'}`}>
              {message}
            </p>
          </div>

          {dismissible && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  position?: ToastPosition;
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  toasts,
  onDismiss,
  className = ''
}) => {
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
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};

// Toast Hook
interface ToastManager {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
}

export const useToast = (): ToastManager => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showToast = (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => {
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

  const showSuccess = (message: string, title?: string, duration?: number) =>
    showToast({ type: 'success', message, title, duration });

  const showError = (message: string, title?: string, duration?: number) =>
    showToast({ type: 'error', message, title, duration: duration || 8000 });

  const showWarning = (message: string, title?: string, duration?: number) =>
    showToast({ type: 'warning', message, title, duration: duration || 7000 });

  const showInfo = (message: string, title?: string, duration?: number) =>
    showToast({ type: 'info', message, title, duration });

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Toast;
