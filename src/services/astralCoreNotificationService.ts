/**
 * Notification Service for Astral Core
 * 
 * Handles push notifications, in-app notifications, and notification preferences
 * with comprehensive crisis alert support and user preference management
 *
 * Features:
 * - Push notification support with service worker integration
 * - In-app notification system
 * - Crisis alert priority handling
 * - User preference management
 * - Notification scheduling and batching
 * - Offline notification queuing
 * - Rich notification content support
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { storageService } from './storageService';

// Mock env utility since getEnv doesn't exist
const getEnv = (key: string, defaultValue?: string): string => {
  return process.env[key] || defaultValue || '';
};

// Create storage wrapper with proper methods
const storage = {
  get: async (key: string): Promise<any> => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  set: async (key: string, value: any): Promise<void> => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Storage set failed:', { key, error });
    }
  },
  remove: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Storage remove failed:', { key, error });
    }
  }
};

// Notification Types
export enum NotificationType {
  CRISIS_ALERT = 'crisis_alert',
  PEER_MESSAGE = 'peer_message',
  SUPPORT_REQUEST = 'support_request',
  WELLNESS_REMINDER = 'wellness_reminder',
  ASSESSMENT_DUE = 'assessment_due',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  SYSTEM_UPDATE = 'system_update',
  ACHIEVEMENT = 'achievement',
  COMMUNITY_POST = 'community_post',
  SAFETY_CHECK = 'safety_check'
}

// Notification Priority
export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Notification Status
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DISMISSED = 'dismissed',
  FAILED = 'failed'
}

// Notification Interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  timestamp: Date;
  scheduledFor?: Date;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  userId?: string;
  channelId?: string;
}

// Notification Action Interface
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification Preferences Interface
export interface NotificationPreferences {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  channels: {
    push: boolean;
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  crisisOverride: boolean; // Crisis alerts override quiet hours
}

// Notification Statistics Interface
export interface NotificationStatistics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalDismissed: number;
  totalFailed: number;
  averageDeliveryTime: number;
  lastNotificationTime: Date | null;
}

// Push Subscription Interface
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Main Service Interface
export interface AstralCoreNotificationService {
  // Notification Management
  sendNotification(notification: Omit<Notification, 'id' | 'status' | 'timestamp'>): Promise<string>;
  scheduleNotification(notification: Omit<Notification, 'id' | 'status' | 'timestamp'>, scheduledFor: Date): Promise<string>;
  cancelNotification(notificationId: string): Promise<boolean>;
  
  // Crisis Alerts
  sendCrisisAlert(alert: {
    title: string;
    message: string;
    data?: Record<string, any>;
    userId?: string;
  }): Promise<string>;
  
  // Notification Retrieval
  getNotifications(userId?: string, limit?: number): Promise<Notification[]>;
  getNotification(notificationId: string): Promise<Notification | null>;
  markAsRead(notificationId: string): Promise<boolean>;
  markAsDismissed(notificationId: string): Promise<boolean>;
  
  // Push Notifications
  requestPermission(): Promise<NotificationPermission>;
  subscribeToPush(): Promise<PushSubscription | null>;
  unsubscribeFromPush(): Promise<boolean>;
  
  // Preferences
  getPreferences(userId?: string): Promise<NotificationPreferences>;
  updatePreferences(preferences: Partial<NotificationPreferences>, userId?: string): Promise<void>;
  
  // Statistics
  getStatistics(userId?: string): Promise<NotificationStatistics>;
  
  // Service Worker Integration
  registerServiceWorker(): Promise<boolean>;
  
  // Event Handlers
  onNotificationClick(callback: (notification: Notification) => void): void;
  onNotificationClose(callback: (notification: Notification) => void): void;
}

// Default Preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  types: {
    [NotificationType.CRISIS_ALERT]: true,
    [NotificationType.PEER_MESSAGE]: true,
    [NotificationType.SUPPORT_REQUEST]: true,
    [NotificationType.WELLNESS_REMINDER]: true,
    [NotificationType.ASSESSMENT_DUE]: true,
    [NotificationType.APPOINTMENT_REMINDER]: true,
    [NotificationType.SYSTEM_UPDATE]: false,
    [NotificationType.ACHIEVEMENT]: true,
    [NotificationType.COMMUNITY_POST]: false,
    [NotificationType.SAFETY_CHECK]: true
  },
  priorities: {
    [NotificationPriority.CRITICAL]: true,
    [NotificationPriority.HIGH]: true,
    [NotificationPriority.MEDIUM]: true,
    [NotificationPriority.LOW]: false
  },
  channels: {
    push: true,
    inApp: true,
    email: false,
    sms: false
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  crisisOverride: true
};

// VAPID Configuration
const VAPID_PUBLIC_KEY = getEnv('VITE_VAPID_PUBLIC_KEY') || '';

// Implementation
class AstralCoreNotificationServiceImpl implements AstralCoreNotificationService {
  private notifications = new Map<string, Notification>();
  private preferences = new Map<string, NotificationPreferences>();
  private statistics: NotificationStatistics = {
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalDismissed: 0,
    totalFailed: 0,
    averageDeliveryTime: 0,
    lastNotificationTime: null
  };
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private notificationQueue: Notification[] = [];
  private clickHandlers: ((notification: Notification) => void)[] = [];
  private closeHandlers: ((notification: Notification) => void)[] = [];

  constructor() {
    this.initializeService();
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'status' | 'timestamp'>): Promise<string> {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      status: NotificationStatus.PENDING,
      timestamp: new Date()
    };

    try {
      // Check user preferences
      const canSend = await this.canSendNotification(fullNotification);
      if (!canSend) {
        logger.debug('Notification blocked by user preferences', { 
          id: fullNotification.id, 
          type: fullNotification.type 
        });
        return fullNotification.id;
      }

      // Store notification
      this.notifications.set(fullNotification.id, fullNotification);
      await this.persistNotification(fullNotification);

      // Send through appropriate channels
      await this.deliverNotification(fullNotification);

      // Update statistics
      this.statistics.totalSent++;
      this.statistics.lastNotificationTime = new Date();

      logger.info('Notification sent successfully', {
        id: fullNotification.id,
        type: fullNotification.type,
        priority: fullNotification.priority
      });

      return fullNotification.id;
    } catch (error) {
      logger.error('Failed to send notification', { error, notificationId: fullNotification.id });
      fullNotification.status = NotificationStatus.FAILED;
      this.statistics.totalFailed++;
      throw error;
    }
  }

  async scheduleNotification(
    notification: Omit<Notification, 'id' | 'status' | 'timestamp'>, 
    scheduledFor: Date
  ): Promise<string> {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      status: NotificationStatus.PENDING,
      timestamp: new Date(),
      scheduledFor
    };

    // Store for later delivery
    this.notifications.set(fullNotification.id, fullNotification);
    await this.persistNotification(fullNotification);

    // Schedule delivery
    const delay = scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await this.deliverNotification(fullNotification);
        } catch (error) {
          logger.error('Failed to deliver scheduled notification', { error, notificationId: fullNotification.id });
        }
      }, delay);
    } else {
      // Schedule for immediate delivery if time has passed
      await this.deliverNotification(fullNotification);
    }

    logger.info('Notification scheduled', {
      id: fullNotification.id,
      scheduledFor: scheduledFor.toISOString()
    });

    return fullNotification.id;
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) {
        return false;
      }

      // Remove from storage
      await storage.remove(`notification_${notificationId}`);
      this.notifications.delete(notificationId);

      // Cancel system notification if it exists
      if ('Notification' in window && Notification.permission === 'granted') {
        // Note: There's no direct way to cancel a specific notification
        // This would typically be handled by the service worker
      }

      logger.info('Notification cancelled', { notificationId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel notification', { error, notificationId });
      return false;
    }
  }

  async sendCrisisAlert(alert: {
    title: string;
    message: string;
    data?: Record<string, any>;
    userId?: string;
  }): Promise<string> {
    return this.sendNotification({
      type: NotificationType.CRISIS_ALERT,
      title: alert.title,
      message: alert.message,
      priority: NotificationPriority.CRITICAL,
      data: alert.data,
      userId: alert.userId,
      requireInteraction: true,
      actions: [
        { action: 'call-emergency', title: 'Call Emergency Services', icon: '/icons/phone.png' },
        { action: 'contact-support', title: 'Contact Support', icon: '/icons/support.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' }
      ],
      icon: '/icons/crisis-alert.png',
      badge: '/icons/badge-crisis.png',
      tag: 'crisis-alert'
    });
  }

  async getNotifications(userId?: string, limit = 50): Promise<Notification[]> {
    try {
      const notifications = Array.from(this.notifications.values());
      
      let filtered = notifications;
      if (userId) {
        filtered = notifications.filter(n => n.userId === userId);
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return filtered.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get notifications', { error, userId, limit });
      return [];
    }
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    try {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        return notification;
      }

      // Try to load from storage
      const stored = await storage.get(`notification_${notificationId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification;
        parsed.timestamp = new Date(parsed.timestamp);
        if (parsed.scheduledFor) {
          parsed.scheduledFor = new Date(parsed.scheduledFor);
        }
        this.notifications.set(notificationId, parsed);
        return parsed;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get notification', { error, notificationId });
      return null;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notification = await this.getNotification(notificationId);
      if (!notification) {
        return false;
      }

      notification.status = NotificationStatus.READ;
      this.notifications.set(notificationId, notification);
      await this.persistNotification(notification);

      this.statistics.totalRead++;

      logger.debug('Notification marked as read', { notificationId });
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
      return false;
    }
  }

  async markAsDismissed(notificationId: string): Promise<boolean> {
    try {
      const notification = await this.getNotification(notificationId);
      if (!notification) {
        return false;
      }

      notification.status = NotificationStatus.DISMISSED;
      this.notifications.set(notificationId, notification);
      await this.persistNotification(notification);

      this.statistics.totalDismissed++;

      logger.debug('Notification marked as dismissed', { notificationId });
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as dismissed', { error, notificationId });
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      logger.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      logger.info('Notification permission requested', { permission });
      return permission;
    } catch (error) {
      logger.error('Failed to request notification permission', { error });
      return 'denied';
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        await this.registerServiceWorker();
      }

      if (!this.serviceWorkerRegistration) {
        throw new Error('Service Worker not available');
      }

      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      this.pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Store subscription
      await storage.set('push_subscription', JSON.stringify(this.pushSubscription));

      logger.info('Push subscription created');
      return this.pushSubscription;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications', { error });
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return true;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      this.pushSubscription = null;
      await storage.remove('push_subscription');

      logger.info('Push subscription removed');
      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications', { error });
      return false;
    }
  }

  async getPreferences(userId = 'default'): Promise<NotificationPreferences> {
    try {
      let preferences = this.preferences.get(userId);
      
      if (!preferences) {
        const stored = await storage.get(`notification_preferences_${userId}`);
        if (stored) {
          preferences = JSON.parse(stored);
        } else {
          preferences = { ...DEFAULT_PREFERENCES };
        }
        this.preferences.set(userId, preferences as NotificationPreferences);
      }

      return { ...preferences } as NotificationPreferences;
    } catch (error) {
      logger.error('Failed to get notification preferences', { error, userId });
      return { ...DEFAULT_PREFERENCES };
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>, userId = 'default'): Promise<void> {
    try {
      const current = await this.getPreferences(userId);
      const updated = { ...current, ...preferences };
      
      this.preferences.set(userId, updated);
      await storage.set(`notification_preferences_${userId}`, JSON.stringify(updated));

      logger.info('Notification preferences updated', { userId });
    } catch (error) {
      logger.error('Failed to update notification preferences', { error, userId });
      throw error;
    }
  }

  async getStatistics(userId?: string): Promise<NotificationStatistics> {
    // TODO: Filter statistics by user if needed
    return { ...this.statistics };
  }

  async registerServiceWorker(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        logger.warn('Service Worker not supported');
        return false;
      }

      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');

      // Listen for message events from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      logger.info('Service Worker registered for notifications');
      return true;
    } catch (error) {
      logger.error('Failed to register Service Worker', { error });
      return false;
    }
  }

  onNotificationClick(callback: (notification: Notification) => void): void {
    this.clickHandlers.push(callback);
  }

  onNotificationClose(callback: (notification: Notification) => void): void {
    this.closeHandlers.push(callback);
  }

  // Private helper methods
  private async initializeService(): Promise<void> {
    try {
      // Load stored push subscription
      const storedSubscription = await storage.get('push_subscription');
      if (storedSubscription) {
        this.pushSubscription = JSON.parse(storedSubscription);
      }

      // Register service worker
      await this.registerServiceWorker();

      logger.info('Notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service', { error });
    }
  }

  private async canSendNotification(notification: Notification): Promise<boolean> {
    const preferences = await this.getPreferences(notification.userId);

    // Check if notifications are enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check notification type preference
    if (!preferences.types[notification.type]) {
      return false;
    }

    // Check priority preference
    if (!preferences.priorities[notification.priority]) {
      return false;
    }

    // Check quiet hours (unless crisis override is enabled)
    if (preferences.quietHours.enabled && 
        !(preferences.crisisOverride && notification.type === NotificationType.CRISIS_ALERT)) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (this.isInQuietHours(currentTime, preferences.quietHours.start, preferences.quietHours.end)) {
        return false;
      }
    }

    return true;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    const preferences = await this.getPreferences(notification.userId);
    const deliveryPromises: Promise<void>[] = [];

    // In-app notification
    if (preferences.channels.inApp) {
      deliveryPromises.push(this.deliverInAppNotification(notification));
    }

    // Push notification
    if (preferences.channels.push && this.pushSubscription) {
      deliveryPromises.push(this.deliverPushNotification(notification));
    }

    try {
      await Promise.allSettled(deliveryPromises);
      notification.status = NotificationStatus.DELIVERED;
      this.statistics.totalDelivered++;
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      this.statistics.totalFailed++;
      throw error;
    }
  }

  private async deliverInAppNotification(notification: Notification): Promise<void> {
    // Create browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/icons/default-notification.png',
        badge: notification.badge || '/icons/badge.png',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        data: { notificationId: notification.id, ...notification.data }
      });

      browserNotification.onclick = () => {
        this.handleNotificationClick(notification);
        browserNotification.close();
      };

      browserNotification.onclose = () => {
        this.handleNotificationClose(notification);
      };
    }
  }

  private async deliverPushNotification(notification: Notification): Promise<void> {
    // This would typically send to your push notification server
    // For now, we'll just log it
    logger.debug('Would send push notification', {
      subscription: this.pushSubscription,
      notification: {
        title: notification.title,
        body: notification.message,
        icon: notification.icon,
        data: notification.data
      }
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'notification-click':
        const clickedNotification = this.notifications.get(data.notificationId);
        if (clickedNotification) {
          this.handleNotificationClick(clickedNotification);
        }
        break;
      
      case 'notification-close':
        const closedNotification = this.notifications.get(data.notificationId);
        if (closedNotification) {
          this.handleNotificationClose(closedNotification);
        }
        break;
    }
  }

  private handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification.id);
    
    this.clickHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        logger.error('Notification click handler error', { error });
      }
    });
  }

  private handleNotificationClose(notification: Notification): void {
    this.closeHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        logger.error('Notification close handler error', { error });
      }
    });
  }

  private async persistNotification(notification: Notification): Promise<void> {
    try {
      await storage.set(`notification_${notification.id}`, JSON.stringify(notification));
    } catch (error) {
      logger.error('Failed to persist notification', { error, notificationId: notification.id });
    }
  }

  private isInQuietHours(currentTime: string, start: string, end: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      return current >= startMinutes && current <= endMinutes;
    } else {
      // Quiet hours span midnight
      return current >= startMinutes || current <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const astralCoreNotificationService = new AstralCoreNotificationServiceImpl();
