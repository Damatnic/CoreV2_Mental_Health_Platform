import { useCallback } from 'react';

interface NotificationOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotification = () => {
  const showNotification = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    options?: NotificationOptions
  ) => {
    // In production, this would integrate with a notification system
    console.log(`[${type.toUpperCase()}] ${message}`, options);
    
    // For now, using a simple alert for critical errors
    if (type === 'error' && typeof window !== 'undefined') {
      console.error(message);
    }
  }, []);

  const hideNotification = useCallback((id?: string) => {
    console.log('Hiding notification', id);
  }, []);

  return {
    showNotification,
    hideNotification
  };
};