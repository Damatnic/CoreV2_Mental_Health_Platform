import React, { createContext, useContext, ReactNode } from 'react';
import { Toast as ToastType, ConfirmationModalState } from '../../types';

interface NotificationContextType {
  toasts: ToastType[];
  addToast: (message: string, type?: ToastType["type"]) => void;
  removeToast: (id: string) => void;
  confirmationModal: ConfirmationModalState | null;
  showConfirmationModal: (config: ConfirmationModalState) => void;
  hideConfirmationModal: () => void;
}

const defaultNotificationContext: NotificationContextType = {
  toasts: [],
  addToast: jest.fn(),
  removeToast: jest.fn(),
  confirmationModal: null,
  showConfirmationModal: jest.fn(),
  hideConfirmationModal: jest.fn()
};

const NotificationContext = createContext<NotificationContextType>(defaultNotificationContext);

export { NotificationContext };

export const NotificationProvider: React.FC<{ children: ReactNode; value?: Partial<NotificationContextType> }> = ({
  children,
  value = {}
}) => {
  const contextValue = { ...defaultNotificationContext, ...value };
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    return defaultNotificationContext;
  }
  return context;
};