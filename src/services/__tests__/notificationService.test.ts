import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  timestamp: number;
}

interface NotificationOptions {
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private permission: NotificationPermission = 'default';
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async show(
    title: string,
    body: string,
    options?: NotificationOptions
  ): Promise<Notification | null> {
    if (!this.isSupported || this.permission !== 'granted') {
      return null;
    }

    const notification: Notification = {
      id: this.generateId(),
      title,
      body,
      timestamp: Date.now(),
      ...options
    };

    try {
      // Create native notification
      const nativeNotif = new Notification(title, {
        body,
        ...options
      });

      // Store reference
      this.notifications.set(notification.id, notification);

      // Auto-close after 5 seconds unless require interaction
      if (!options?.requireInteraction) {
        setTimeout(() => {
          nativeNotif.close();
          this.notifications.delete(notification.id);
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    delayMs: number,
    options?: NotificationOptions
  ): Promise<string> {
    const notificationId = this.generateId();

    setTimeout(() => {
      this.show(title, body, options);
    }, delayMs);

    return notificationId;
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  close(notificationId: string): void {
    this.notifications.delete(notificationId);
  }

  closeAll(): void {
    this.notifications.clear();
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Service worker notifications
  async showFromServiceWorker(
    registration: ServiceWorkerRegistration,
    title: string,
    options?: any
  ): Promise<void> {
    if (this.permission !== 'granted') {
      return;
    }

    await registration.showNotification(title, options);
  }

  // Push notification subscription
  async subscribeToPush(
    registration: ServiceWorkerRegistration,
    vapidPublicKey: string
  ): Promise<PushSubscription | null> {
    if (this.permission !== 'granted') {
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

describe('NotificationService', () => {
  let service: NotificationService;
  let mockNotification: jest.Mock & { permission?: string; requestPermission?: jest.Mock };

  beforeEach(() => {
    service = new NotificationService();
    
    // Mock Notification API
    mockNotification = jest.fn();
    
    // Create a proper mock constructor with static properties
    const MockNotificationConstructor = jest.fn() as jest.Mock & { permission?: string; requestPermission?: jest.Mock };
    
    MockNotificationConstructor.mockImplementation(((title: string, options?: any) => ({
      title,
      body: options?.body || '',
      icon: options?.icon || '',
      tag: options?.tag || '',
      data: options?.data || {},
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    })) as any);
    
    mockNotification = MockNotificationConstructor;
    
    // Add static properties to the mock constructor
    mockNotification.permission = 'granted';
    mockNotification.requestPermission = jest.fn(() => Promise.resolve('granted'));
    (global as any).Notification = mockNotification;
  });

  it('should check if notifications are supported', () => {
    expect(service.isNotificationSupported()).toBe(true);
  });

  it('should request permission', async () => {
    const permission = await service.requestPermission();
    
    expect(mockNotification.requestPermission).toHaveBeenCalled();
    expect(permission).toBe('granted');
  });

  it('should show notification when permitted', async () => {
    const notification = await service.show('Test Title', 'Test Body');
    
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Title');
    expect(notification?.body).toBe('Test Body');
  });

  it('should not show notification when denied', async () => {
    mockNotification.permission = 'denied';
    service = new NotificationService();
    
    const notification = await service.show('Test', 'Body');
    
    expect(notification).toBeNull();
  });

  it('should schedule notification', async () => {
    jest.useFakeTimers();
    
    const id = await service.scheduleNotification('Scheduled', 'Body', 1000);
    
    expect(id).toBeDefined();
    
    jest.advanceTimersByTime(1000);
    
    jest.useRealTimers();
  });

  it('should get all notifications', async () => {
    await service.show('Test1', 'Body1');
    await service.show('Test2', 'Body2');
    
    const all = service.getAll();
    
    expect(all).toHaveLength(2);
  });

  it('should close notification', async () => {
    const notification = await service.show('Test', 'Body');
    
    if (notification) {
      service.close(notification.id);
      const all = service.getAll();
      expect(all).toHaveLength(0);
    }
  });

  it('should close all notifications', async () => {
    await service.show('Test1', 'Body1');
    await service.show('Test2', 'Body2');
    
    service.closeAll();
    
    expect(service.getAll()).toHaveLength(0);
  });

  it('should generate unique IDs', async () => {
    const notif1 = await service.show('Test1', 'Body1');
    const notif2 = await service.show('Test2', 'Body2');
    
    expect(notif1?.id).not.toBe(notif2?.id);
  });

  it('should auto-close notifications', async () => {
    jest.useFakeTimers();
    
    await service.show('Test', 'Body');
    
    expect(service.getAll()).toHaveLength(1);
    
    jest.advanceTimersByTime(5000);
    
    expect(service.getAll()).toHaveLength(0);
    
    jest.useRealTimers();
  });
});
