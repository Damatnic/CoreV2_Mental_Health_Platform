// Mock notification service for testing
export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'crisis';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  scheduled?: string;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    time?: string;
  };
  data?: Record<string, any>;
}

export interface MockPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  createdAt: string;
  isActive: boolean;
}

export interface MockNotificationSettings {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    reminders: boolean;
    wellness: boolean;
    social: boolean;
    crisis: boolean;
    updates: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}

class MockNotificationService {
  private notifications: Map<string, MockNotification[]> = new Map();
  private subscriptions: Map<string, MockPushSubscription> = new Map();
  private settings: Map<string, MockNotificationSettings> = new Map();
  private isSupported = true;
  private permission: NotificationPermission = 'default';

  // Browser notification API simulation
  async requestPermission(): Promise<NotificationPermission> {
    // Simulate user interaction
    await this.simulateDelay(500);
    
    // Mock permission result (randomize for testing)
    const permissions: NotificationPermission[] = ['granted', 'denied', 'default'];
    this.permission = permissions[Math.floor(Math.random() * permissions.length)];
    
    console.log('Mock: Notification permission requested, result:', this.permission);
    return this.permission;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Push notifications
  async subscribeToPush(userId: string): Promise<MockPushSubscription> {
    await this.simulateDelay(300);

    if (this.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const subscription: MockPushSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      endpoint: `https://mock-push-service.com/send/${this.generateId()}`,
      keys: {
        p256dh: this.generateKey(),
        auth: this.generateKey()
      },
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.subscriptions.set(userId, subscription);
    console.log('Mock: User subscribed to push notifications:', subscription);
    
    return subscription;
  }

  async unsubscribeFromPush(userId: string): Promise<void> {
    await this.simulateDelay(200);
    
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      subscription.isActive = false;
      console.log('Mock: User unsubscribed from push notifications:', userId);
    }
  }

  getPushSubscription(userId: string): MockPushSubscription | null {
    return this.subscriptions.get(userId) || null;
  }

  // Local notifications
  async scheduleNotification(
    userId: string,
    notification: Omit<MockNotification, 'id' | 'timestamp' | 'read'>
  ): Promise<MockNotification> {
    await this.simulateDelay(100);

    const fullNotification: MockNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.push(fullNotification);
    this.notifications.set(userId, userNotifications);

    // Simulate showing notification if scheduled for now
    if (!notification.scheduled || new Date(notification.scheduled) <= new Date()) {
      this.showBrowserNotification(fullNotification);
    }

    console.log('Mock: Notification scheduled:', fullNotification);
    return fullNotification;
  }

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    options?: {
      type?: MockNotification['type'];
      priority?: MockNotification['priority'];
      data?: Record<string, any>;
    }
  ): Promise<MockNotification> {
    const notification = await this.scheduleNotification(userId, {
      title,
      message,
      type: options?.type || 'info',
      priority: options?.priority || 'medium',
      data: options?.data
    });

    return notification;
  }

  async sendCrisisAlert(
    userId: string,
    message: string,
    data?: Record<string, any>
  ): Promise<MockNotification> {
    const notification = await this.scheduleNotification(userId, {
      title: 'Crisis Support Available',
      message,
      type: 'crisis',
      priority: 'urgent',
      data
    });

    // Crisis alerts bypass quiet hours
    this.showBrowserNotification(notification, true);
    
    return notification;
  }

  // Wellness reminders
  async scheduleWellnessReminder(
    userId: string,
    type: 'mood_check' | 'medication' | 'therapy' | 'self_care',
    scheduledTime: string,
    recurring?: MockNotification['recurring']
  ): Promise<MockNotification> {
    const messages = {
      mood_check: 'Time for your daily mood check-in',
      medication: 'Reminder to take your medication',
      therapy: 'You have a therapy session coming up',
      self_care: 'Take a moment for self-care'
    };

    return this.scheduleNotification(userId, {
      title: 'Wellness Reminder',
      message: messages[type],
      type: 'reminder',
      priority: 'medium',
      scheduled: scheduledTime,
      recurring,
      data: { reminderType: type }
    });
  }

  // Notification management
  getNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      type?: MockNotification['type'];
      limit?: number;
    }
  ): MockNotification[] {
    let notifications = this.notifications.get(userId) || [];

    if (options?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (options?.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.simulateDelay(50);
    
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      console.log('Mock: Notification marked as read:', notificationId);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.simulateDelay(100);
    
    const notifications = this.notifications.get(userId) || [];
    notifications.forEach(n => n.read = true);
    
    console.log('Mock: All notifications marked as read for user:', userId);
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await this.simulateDelay(50);
    
    const notifications = this.notifications.get(userId) || [];
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    this.notifications.set(userId, filteredNotifications);
    
    console.log('Mock: Notification deleted:', notificationId);
  }

  async clearAllNotifications(userId: string): Promise<void> {
    await this.simulateDelay(100);
    
    this.notifications.set(userId, []);
    console.log('Mock: All notifications cleared for user:', userId);
  }

  // Settings management
  async updateSettings(
    userId: string,
    settings: Partial<MockNotificationSettings>
  ): Promise<MockNotificationSettings> {
    await this.simulateDelay(200);

    const currentSettings = this.getSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings, userId };
    
    this.settings.set(userId, updatedSettings);
    console.log('Mock: Notification settings updated:', updatedSettings);
    
    return updatedSettings;
  }

  getSettings(userId: string): MockNotificationSettings {
    return this.settings.get(userId) || this.getDefaultSettings(userId);
  }

  private getDefaultSettings(userId: string): MockNotificationSettings {
    return {
      userId,
      pushEnabled: false,
      emailEnabled: true,
      smsEnabled: false,
      categories: {
        reminders: true,
        wellness: true,
        social: true,
        crisis: true,
        updates: false
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      frequency: {
        daily: true,
        weekly: true,
        monthly: false
      }
    };
  }

  // Analytics and tracking
  getNotificationStats(userId: string): {
    total: number;
    unread: number;
    byType: Record<MockNotification['type'], number>;
    byPriority: Record<MockNotification['priority'], number>;
  } {
    const notifications = this.notifications.get(userId) || [];
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        info: 0,
        success: 0,
        warning: 0,
        error: 0,
        reminder: 0,
        crisis: 0
      } as Record<MockNotification['type'], number>,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      } as Record<MockNotification['priority'], number>
    };

    notifications.forEach(notification => {
      stats.byType[notification.type]++;
      stats.byPriority[notification.priority]++;
    });

    return stats;
  }

  // Utility methods for testing
  async simulateNetworkError(): Promise<never> {
    await this.simulateDelay(1000);
    throw new Error('Network error: Unable to send notification');
  }

  async simulateServiceUnavailable(): Promise<never> {
    await this.simulateDelay(2000);
    throw new Error('Service temporarily unavailable');
  }

  setPermission(permission: NotificationPermission): void {
    this.permission = permission;
  }

  setSupported(supported: boolean): void {
    this.isSupported = supported;
  }

  resetMockData(): void {
    this.notifications.clear();
    this.subscriptions.clear();
    this.settings.clear();
    this.permission = 'default';
    this.isSupported = true;
  }

  // Internal helper methods
  private async simulateDelay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateKey(): string {
    return btoa(Math.random().toString(36).substr(2, 16));
  }

  private showBrowserNotification(
    notification: MockNotification,
    bypassQuietHours = false
  ): void {
    // Check if notifications should be shown
    if (this.permission !== 'granted') {
      console.log('Mock: Cannot show notification, permission not granted');
      return;
    }

    // Mock showing browser notification
    console.log('Mock: Browser notification shown:', {
      title: notification.title,
      body: notification.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: notification.id,
      data: notification.data,
      timestamp: Date.now()
    });

    // Simulate notification click
    setTimeout(() => {
      console.log('Mock: Notification clicked (simulated)');
    }, Math.random() * 10000); // Random click within 10 seconds
  }

  private isInQuietHours(userId: string): boolean {
    const settings = this.getSettings(userId);
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = settings.quietHours.start;
    const end = settings.quietHours.end;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    return currentTime >= start && currentTime <= end;
  }

  // Test data generators
  generateTestNotifications(userId: string, count: number = 10): MockNotification[] {
    const notifications: MockNotification[] = [];
    const types: MockNotification['type'][] = ['info', 'success', 'warning', 'error', 'reminder'];
    const priorities: MockNotification['priority'][] = ['low', 'medium', 'high'];

    for (let i = 0; i < count; i++) {
      const notification: MockNotification = {
        id: `test_${i}_${this.generateId()}`,
        title: `Test Notification ${i + 1}`,
        message: `This is test notification number ${i + 1}`,
        type: types[Math.floor(Math.random() * types.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        read: Math.random() > 0.3, // 70% read rate
        data: { testData: true, notificationIndex: i }
      };

      notifications.push(notification);
    }

    const existingNotifications = this.notifications.get(userId) || [];
    this.notifications.set(userId, [...existingNotifications, ...notifications]);

    return notifications;
  }
}

// Create and export singleton instance
export const mockNotificationService = new MockNotificationService();

// Export as notificationService for compatibility with actual service
export const notificationService = mockNotificationService;

// Export commonly used test data
export const TEST_NOTIFICATIONS = {
  WELLNESS_REMINDER: {
    title: 'Wellness Check-In',
    message: 'How are you feeling today?',
    type: 'reminder' as const,
    priority: 'medium' as const
  },
  CRISIS_ALERT: {
    title: 'Crisis Support Available',
    message: 'We noticed you might need support. Help is available 24/7.',
    type: 'crisis' as const,
    priority: 'urgent' as const
  },
  SOCIAL_UPDATE: {
    title: 'New Message',
    message: 'You have a new message in your support group',
    type: 'info' as const,
    priority: 'low' as const
  }
};

export default mockNotificationService;
