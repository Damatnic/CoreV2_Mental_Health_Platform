/**
 * Notification Context for CoreV2 Mental Health Platform
 * Provides toast notifications and confirmation modals throughout the app
 */

import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { notificationService } from '../services/notificationService';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'crisis';
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

export interface ConfirmationModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'crisis';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  persistent?: boolean;
}

export interface NotificationContextType {
  // Toast management
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], options?: Partial<Toast>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  
  // Confirmation modal
  confirmationModal: ConfirmationModalConfig | null;
  showConfirmationModal: (config: ConfirmationModalConfig) => void;
  hideConfirmationModal: () => void;
  
  // Convenience methods
  showSuccess: (message: string, options?: Partial<Toast>) => string;
  showError: (message: string, options?: Partial<Toast>) => string;
  showWarning: (message: string, options?: Partial<Toast>) => string;
  showInfo: (message: string, options?: Partial<Toast>) => string;
  showCrisisAlert: (message: string, options?: Partial<Toast>) => string;
  showNotification: (message: string, type?: Toast['type'], options?: Partial<Toast>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalConfig | null>(null);

  // Toast management
  const addToast = useCallback((
    message: string, 
    type: Toast['type'] = 'info', 
    options: Partial<Toast> = {}
  ): string => {
    const id = crypto.randomUUID();
    const duration = options.duration ?? (type === 'crisis' ? 0 : type === 'error' ? 7000 : 5000);
    
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      persistent: options.persistent || type === 'crisis',
      actions: options.actions,
      ...options
    };

    setToasts(prev => [toast, ...prev]);

    // Auto-remove toast after duration (if not persistent)
    if (!toast.persistent && duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    // Also send to notification service for browser notifications if important
    if (type === 'crisis' || type === 'error') {
      notificationService.sendNotification({
        title: type === 'crisis' ? '🚨 Crisis Alert' : '⚠️ Error',
        body: message,
        urgency: type === 'crisis' ? 'crisis' : 'high',
        category: type === 'crisis' ? 'crisis' : 'system'
      });
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Confirmation modal management
  const showConfirmationModal = useCallback((config: ConfirmationModalConfig) => {
    setConfirmationModal(config);
  }, []);

  const hideConfirmationModal = useCallback(() => {
    if (confirmationModal?.onCancel) {
      confirmationModal.onCancel();
    }
    setConfirmationModal(null);
  }, [confirmationModal]);

  // Convenience methods
  const showSuccess = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const showError = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast(message, 'error', options);
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast(message, 'info', options);
  }, [addToast]);

    const showCrisisAlert = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast(message, 'crisis', { 
      persistent: true, 
      actions: [
        {
          label: 'Get Help Now',
          action: () => {
            // Navigate to crisis resources
            window.location.href = '/crisis-resources';
          },
          style: 'danger'
        },
        {
          label: 'Call 988',
          action: () => {
            window.open('tel:988', '_self');
          },
          style: 'primary'
        }
      ],
      ...options
    });
  }, [addToast]);

  const showNotification = useCallback((message: string, type: Toast['type'] = 'info', options?: Partial<Toast>) => {
    return addToast(message, type, options);
  }, [addToast]);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    confirmationModal,
    showConfirmationModal,
    hideConfirmationModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCrisisAlert,
    showNotification
  }), [
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    confirmationModal,
    showConfirmationModal,
    hideConfirmationModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCrisisAlert,
    showNotification
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Backward compatibility alias
export const useNotification = useNotifications;

// Export individual hooks for convenience
export const useToasts = () => {
  const { toasts, addToast, removeToast, clearAllToasts } = useNotifications();
  return { toasts, addToast, removeToast, clearAllToasts };
};

export const useConfirmationModal = () => {
  const { confirmationModal, showConfirmationModal, hideConfirmationModal } = useNotifications();
  return { confirmationModal, showConfirmationModal, hideConfirmationModal };
};

export const useNotificationHelpers = () => {
  const { showSuccess, showError, showWarning, showInfo, showCrisisAlert } = useNotifications();
  return { showSuccess, showError, showWarning, showInfo, showCrisisAlert };
};

export default NotificationContext;
