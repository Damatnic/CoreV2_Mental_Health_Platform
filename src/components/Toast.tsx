import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Heart, Zap } from 'lucide-react';

export interface ToastData {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'supportive' | 'motivational';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  animation?: 'slide' | 'fade' | 'bounce';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Support both prop patterns for backward compatibility
export type ToastProps = ToastData & {
  onClose?: () => void;
} | {
  toast: ToastData;
  onDismiss: () => void;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  toasts: ToastData[];
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Helper function to normalize props
const normalizeToastProps = (props: ToastProps): ToastData & { onClose?: () => void } => {
  if ('toast' in props) {
    return {
      ...props.toast,
      onClose: props.onDismiss
    };
  }
  return props;
};

// Individual Toast Component
export const Toast: React.FC<ToastProps> = (props) => {
  const normalizedProps = normalizeToastProps(props);
  const {
    id,
    type = 'info',
    title,
    message,
    duration = 5000,
    persistent = false,
    action,
    onClose,
    position = 'top-right',
    animation = 'slide',
    priority = 'normal'
  } = normalizedProps;
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss timer
  useEffect(() => {
    if (persistent || duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / duration * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, persistent]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Animation duration
  }, [onClose]);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          progressColor: 'bg-green-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          progressColor: 'bg-red-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          progressColor: 'bg-yellow-500'
        };
      case 'supportive':
        return {
          icon: Heart,
          iconColor: 'text-pink-600',
          bgColor: 'bg-pink-50',
          borderColor: 'border-pink-200',
          textColor: 'text-pink-800',
          progressColor: 'bg-pink-500'
        };
      case 'motivational':
        return {
          icon: Zap,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          progressColor: 'bg-purple-500'
        };
      case 'loading':
        return {
          icon: () => (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ),
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          progressColor: 'bg-blue-500'
        };
      default: // info
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          progressColor: 'bg-blue-500'
        };
    }
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    if (!isVisible) return `${baseClasses} opacity-0 scale-95`;
    
    if (isExiting) {
      switch (animation) {
        case 'slide':
          return `${baseClasses} transform translate-x-full opacity-0`;
        case 'bounce':
          return `${baseClasses} transform scale-75 opacity-0`;
        case 'fade':
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    // Entry animation
    switch (animation) {
      case 'slide':
        return `${baseClasses} transform translate-x-0 opacity-100`;
      case 'bounce':
        return `${baseClasses} transform scale-100 opacity-100 animate-bounce-in`;
      case 'fade':
      default:
        return `${baseClasses} opacity-100`;
    }
  };

  const getPriorityClasses = () => {
    switch (priority) {
      case 'urgent':
        return 'ring-2 ring-red-400 shadow-lg';
      case 'high':
        return 'ring-1 ring-yellow-400 shadow-md';
      case 'low':
        return 'opacity-90';
      default:
        return '';
    }
  };

  if (!isVisible) return null;

  const config = getToastConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`
        max-w-sm w-full p-4 rounded-lg border shadow-sm relative overflow-hidden
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        ${getAnimationClasses()}
        ${getPriorityClasses()}
      `}
      role="alert"
      aria-live={priority === 'urgent' ? 'assertive' : 'polite'}
    >
      {/* Progress bar */}
      {!persistent && duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-100 ${config.progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {React.isValidElement(IconComponent) ? (
            IconComponent
          ) : (
            <IconComponent className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold mb-1 leading-tight">
              {title}
            </h4>
          )}
          <p className="text-sm leading-relaxed">
            {message}
          </p>
          
          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`
                mt-2 text-sm font-medium underline hover:no-underline transition-all
                ${config.textColor} opacity-80 hover:opacity-100
              `}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors
            ${config.iconColor}
          `}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{
  position?: ToastData['position'];
  maxToasts?: number;
}> = ({ 
  position = 'top-right',
  maxToasts = 5
}) => {
  const { toasts } = useToast();

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Sort toasts by priority and timestamp
  const sortedToasts = [...toasts]
    .sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      return (priorityOrder[b.priority || 'normal'] - priorityOrder[a.priority || 'normal']);
    })
    .slice(0, maxToasts);

  return (
    <div
      className={`
        fixed z-50 pointer-events-none
        ${getPositionClasses()}
      `}
    >
      <div className="space-y-2 pointer-events-auto">
        {sortedToasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = {
      ...toast,
      id,
      onClose: () => removeToast(id)
    };

    setToasts(current => {
      // Remove existing toast if it's a duplicate message
      const filtered = current.filter(t => t.message !== toast.message);
      return [...filtered, newToast];
    });

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    clearAllToasts,
    toasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Utility functions for common toast types
export const showToast = {
  success: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'success', message });
  },
  
  error: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'error', message, duration: 8000 });
  },
  
  warning: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'warning', message, duration: 6000 });
  },
  
  info: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'info', message });
  },

  supportive: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'supportive', message, duration: 7000 });
  },

  motivational: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'motivational', message, duration: 6000 });
  },

  loading: (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) => {
    const { addToast } = useToast();
    return addToast({ ...options, type: 'loading', message, persistent: true });
  }
};

// Hook for mental health specific toasts
export const useMentalHealthToasts = () => {
  const { addToast } = useToast();

  const showCrisisSupport = useCallback(() => {
    return addToast({
      type: 'supportive',
      title: 'Support is Available',
      message: 'If you\'re in crisis, remember that help is available 24/7. You\'re not alone.',
      persistent: true,
      priority: 'urgent',
      action: {
        label: 'Get Help Now',
        onClick: () => window.open('tel:988')
      }
    });
  }, [addToast]);

  const showWellnessReminder = useCallback((message: string) => {
    return addToast({
      type: 'motivational',
      title: 'Wellness Check-in',
      message,
      duration: 8000,
      priority: 'normal'
    });
  }, [addToast]);

  const showProgressCelebration = useCallback((achievement: string) => {
    return addToast({
      type: 'success',
      title: 'Great Progress! 🎉',
      message: `You've achieved: ${achievement}`,
      duration: 10000,
      animation: 'bounce'
    });
  }, [addToast]);

  const showGentleEncouragement = useCallback((message: string) => {
    return addToast({
      type: 'supportive',
      message,
      duration: 7000
    });
  }, [addToast]);

  return {
    showCrisisSupport,
    showWellnessReminder,
    showProgressCelebration,
    showGentleEncouragement
  };
};

// Custom CSS for animations (add to your global CSS)
const toastStyles = `
  @keyframes bounce-in {
    0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
    50% { transform: scale(1.05) translateY(-10px); }
    70% { transform: scale(0.9) translateY(0); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  
  .animate-bounce-in {
    animation: bounce-in 0.5s ease-out;
  }
`;

export default Toast;
