import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, act, waitFor } from '@testing-library/react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const TestComponent: React.FC = () => {
  const { notifications, addNotification, clearAll } = useNotifications();
  
  return (
    <div>
      {notifications.map(n => (
        <div key={n.id} data-testid="notification">
          {n.type}: {n.message}
        </div>
      ))}
      <button onClick={() => addNotification({ type: 'success', message: 'Test' })}>
        Add Notification
      </button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
};

describe('NotificationContext', () => {
  it('should provide notification context', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    expect(screen.getByText('Add Notification')).toBeTruthy();
  });

  it('should add notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    const button = screen.getByText('Add Notification');
    
    act(() => {
      button.click();
    });
    
    expect(screen.getByTestId('notification')).toBeTruthy();
    expect(screen.getByText('success: Test')).toBeTruthy();
  });

  it('should add multiple notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    const button = screen.getByText('Add Notification');
    
    act(() => {
      button.click();
      button.click();
      button.click();
    });
    
    const notifications = screen.getAllByTestId('notification');
    expect(notifications).toHaveLength(3);
  });

  it('should clear all notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add Notification').click();
      screen.getByText('Add Notification').click();
    });
    
    expect(screen.getAllByTestId('notification')).toHaveLength(2);
    
    act(() => {
      screen.getByText('Clear All').click();
    });
    
    expect(screen.queryByTestId('notification')).toBeNull();
  });

  it('should auto-remove notifications with duration', async () => {
    jest.useFakeTimers();
    
    const TestAutoRemove: React.FC = () => {
      const { notifications, addNotification } = useNotifications();
      
      return (
        <div>
          {notifications.map(n => (
            <div key={n.id} data-testid="timed-notification">
              {n.message}
            </div>
          ))}
          <button onClick={() => addNotification({ 
            type: 'info', 
            message: 'Auto Remove', 
            duration: 1000 
          })}>
            Add Timed
          </button>
        </div>
      );
    };
    
    render(
      <NotificationProvider>
        <TestAutoRemove />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add Timed').click();
    });
    
    expect(screen.getByTestId('timed-notification')).toBeTruthy();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('timed-notification')).toBeNull();
    });
    
    jest.useRealTimers();
  });

  it('should throw error when used outside provider', () => {
    const TestWithoutProvider: React.FC = () => {
      try {
        useNotifications();
        return <div>Should not render</div>;
      } catch (error: any) {
        return <div>{error.message}</div>;
      }
    };
    
    render(<TestWithoutProvider />);
    
    expect(screen.getByText(/must be used within NotificationProvider/)).toBeTruthy();
  });
});
