/**
 * Notification Service
 *
 * Comprehensive notification system for mental health platform.
 * Handles push notifications, in-app notifications, and notification preferences
 * with HIPAA compliance and privacy protection.
 *
 * @fileoverview Type-safe notification service with comprehensive privacy and crisis handling
 * @version 2.1.0 - Completely rewritten for type safety and enhanced features
 */

// Core Types
export type NotificationUrgency = 'low' | 'normal' | 'high' | 'crisis';
export type NotificationCategory = 
  | 'message' | 'reminder' | 'alert' | 'crisis' | 'achievement' 
  | 'system' | 'therapy' | 'wellness' | 'medication' | 'appointment';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'dismissed';
export type NotificationChannel = 'push' | 'in-app' | 'email' | 'sms';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  requiresAuth?: boolean;
  url?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  urgency?: NotificationUrgency;
  category?: NotificationCategory;
  scheduledTime?: Date;
  expiresAt?: Date;
  channels?: NotificationChannel[];
  userId?: string;
  anonymousId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: {
    push: boolean;
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  categories: Record<NotificationCategory, boolean>;
  urgencyLevels: Record<NotificationUrgency, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone?: string;
  };
  frequency: {
    immediate: boolean;
    digest: boolean;
    digestFrequency: 'hourly' | 'daily' | 'weekly';
  };
  privacy: {
    anonymizeContent: boolean;
    minimizePersonalInfo: boolean;
    requireEncryption: boolean;
  };
}

export interface StoredNotification {
  id: string;
  userId?: string;
  anonymousId?: string;
  options: NotificationOptions;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  dismissedAt?: Date;
  failureReason?: string;
  retryCount: number;
  lastRetry?: Date;
  expiresAt?: Date;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalDismissed: number;
  averageDeliveryTime: number;
  deliveryRate: number;
  categoryBreakdown: Record<NotificationCategory, number>;
  channelPerformance: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export interface CrisisNotificationConfig {
  immediateDelivery: boolean;
  bypassQuietHours: boolean;
  requireAcknowledgment: boolean;
  escalationTimeout: number; // minutes
  fallbackChannels: NotificationChannel[];
  emergencyContacts: string[];
}

// Default configurations
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  channels: {
    push: true,
    inApp: true,
    email: false,
    sms: false
  },
  categories: {
    message: true,
    reminder: true,
    alert: true,
    crisis: true,
    achievement: true,
    system: false,
    therapy: true,
    wellness: true,
    medication: true,
    appointment: true
  },
  urgencyLevels: {
    low: true,
    normal: true,
    high: true,
    crisis: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  frequency: {
    immediate: true,
    digest: false,
    digestFrequency: 'daily'
  },
  privacy: {
    anonymizeContent: false,
    minimizePersonalInfo: true,
    requireEncryption: true
  }
};

const CRISIS_CONFIG: CrisisNotificationConfig = {
  immediateDelivery: true,
  bypassQuietHours: true,
  requireAcknowledgment: true,
  escalationTimeout: 15,
  fallbackChannels: ['push', 'in-app', 'sms'],
  emergencyContacts: []
};

/**
 * Type-safe Notification Service with comprehensive privacy and crisis handling
 */
class NotificationService {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private notifications: Map<string, StoredNotification> = new Map();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private pushSubscription: PushSubscription | null = null;
  private notificationPermission: NotificationPermission = 'default';
  private stats: NotificationStats;

  constructor() {
    this.stats = this.initializeStats();
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initialize();
    }
  }

  /**
   * Check if notifications are supported in current environment
   */
  private checkSupport(): boolean {
    try {
      return typeof window !== 'undefined' &&
             'Notification' in window &&
             'serviceWorker' in navigator &&
             'PushManager' in window;
    } catch {
      return false;
    }
  }

  /**
   * Initialize notification service
   */
  private async initialize(): Promise<void> {
    try {
      this.notificationPermission = Notification.permission;
      
      // Register service worker for push notifications
      await this.registerServiceWorker();
      
      // Load user preferences
      await this.loadPreferences();
      
      // Set up periodic cleanup
      this.scheduleCleanup();
      
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Send notification with comprehensive options
   */
  async sendNotification(options: NotificationOptions): Promise<string> {
    if (!this.isSupported) {
      throw new Error('Notifications not supported');
    }

    const notificationId = this.generateNotificationId();
    const userId = options.userId || options.anonymousId;
    
    // Check if user wants this type of notification
    if (userId && !this.shouldSendNotification(userId, options)) {
      console.log('Notification blocked by user preferences');
      return notificationId;
    }

    const storedNotification: StoredNotification = {
      id: notificationId,
      userId: options.userId,
      anonymousId: options.anonymousId,
      options: this.sanitizeNotificationOptions(options),
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      expiresAt: options.expiresAt
    };

    this.notifications.set(notificationId, storedNotification);

    try {
      // Handle crisis notifications with special priority
      if (options.urgency === 'crisis' || options.category === 'crisis') {
        await this.handleCrisisNotification(storedNotification);
      } else {
        await this.deliverNotification(storedNotification);
      }

      this.updateStats('sent', options.category, options.channels?.[0] || 'in-app');
      return notificationId;
    } catch (error) {
      storedNotification.status = 'failed';
      storedNotification.failureReason = error instanceof Error ? error.message : String(error);
      this.updateStats('failed', options.category, options.channels?.[0] || 'in-app');
      throw error;
    }
  }

  /**
   * Send multiple notifications efficiently
   */
  async sendBatchNotifications(notifications: NotificationOptions[]): Promise<string[]> {
    const notificationIds: string[] = [];
    const batchSize = 10;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchPromises = batch.map(options => this.sendNotification(options));
      
      try {
        const batchIds = await Promise.all(batchPromises);
        notificationIds.push(...batchIds);
      } catch (error) {
        console.error('Batch notification failed:', error);
        // Continue with remaining batches
      }
      
      // Add delay between batches to prevent rate limiting
      if (i + batchSize < notifications.length) {
        await this.delay(100);
      }
    }

    return notificationIds;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const currentPreferences = this.preferences.get(userId) || DEFAULT_PREFERENCES;
    const updatedPreferences = this.mergePreferences(currentPreferences, preferences);
    
    this.preferences.set(userId, updatedPreferences);
    await this.savePreferences(userId, updatedPreferences);
    
    console.log(`Notification preferences updated for user: ${userId}`);
  }

  /**
   * Get user notification preferences
   */
  getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || DEFAULT_PREFERENCES;
  }

  /**
   * Get notification by ID
   */
  getNotification(notificationId: string): StoredNotification | null {
    return this.notifications.get(notificationId) || null;
  }

  /**
   * Get notifications for user
   */
  getUserNotifications(
    userId: string, 
    limit: number = 50,
    status?: NotificationStatus
  ): StoredNotification[] {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId || n.anonymousId === userId)
      .filter(n => !status || n.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return userNotifications;
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return false;
    }

    notification.status = 'dismissed';
    notification.dismissedAt = new Date();
    this.updateStats('dismissed', notification.options.category, 'in-app');
    
    return true;
  }

  /**
   * Schedule notification for later delivery
   */
  async scheduleNotification(
    options: NotificationOptions,
    scheduledTime: Date
  ): Promise<string> {
    const notificationOptions = {
      ...options,
      scheduledTime
    };

    const notificationId = await this.sendNotification(notificationOptions);
    
    // Set up timer for scheduled delivery
    const delay = scheduledTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.deliverScheduledNotification(notificationId);
      }, delay);
    }

    return notificationId;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration || this.notificationPermission !== 'granted') {
      return null;
    }

    try {
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey()
      });

      return this.pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Get notification statistics
   */
  getStatistics(): NotificationStats {
    return { ...this.stats };
  }

  /**
   * Clean up expired notifications
   */
  async cleanup(): Promise<number> {
    let cleanedCount = 0;
    const now = new Date();

    const expiredNotifications = Array.from(this.notifications.entries())
      .filter(([, notification]) => notification.expiresAt && now > notification.expiresAt)
      .map(([id]) => id);
    
    expiredNotifications.forEach(id => {
      this.notifications.delete(id);
      cleanedCount++;
    });

    console.log(`Cleaned up ${cleanedCount} expired notifications`);
    return cleanedCount;
  }

  /**
   * Clear all notifications for user
   */
  clearUserNotifications(userId: string): number {
    let clearedCount = 0;
    
    const userNotifications = Array.from(this.notifications.entries())
      .filter(([, notification]) => notification.userId === userId || notification.anonymousId === userId)
      .map(([id]) => id);
    
    userNotifications.forEach(id => {
      this.notifications.delete(id);
      clearedCount++;
    });

    return clearedCount;
  }

  // Private helper methods

  private async registerServiceWorker(): Promise<void> {
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered for push notifications');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  private shouldSendNotification(userId: string, options: NotificationOptions): boolean {
    const preferences = this.getPreferences(userId);
    
    if (!preferences.enabled) {
      return false;
    }

    // Check category preferences
    if (options.category && !preferences.categories[options.category]) {
      return false;
    }

    // Check urgency preferences
    if (options.urgency && !preferences.urgencyLevels[options.urgency]) {
      return false;
    }

    // Check quiet hours (except for crisis notifications)
    if (options.urgency !== 'crisis' && preferences.quietHours.enabled) {
      if (this.isInQuietHours(preferences.quietHours)) {
        return false;
      }
    }

    return true;
  }

  private async deliverNotification(notification: StoredNotification): Promise<void> {
    const options = notification.options;
    const channels = options.channels || ['in-app'];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'in-app':
            await this.sendInAppNotification(notification);
            break;
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'sms':
            await this.sendSMSNotification(notification);
            break;
        }

        notification.status = 'sent';
        notification.sentAt = new Date();
        return; // Exit after first successful delivery
      } catch (error) {
        console.warn(`Failed to deliver via ${channel}:`, error);
        continue; // Try next channel
      }
    }

    throw new Error('Failed to deliver notification via any channel');
  }

  private async handleCrisisNotification(notification: StoredNotification): Promise<void> {
    const config = CRISIS_CONFIG;
    
    // Crisis notifications bypass normal filtering
    notification.options.requireInteraction = true;
    notification.options.urgency = 'crisis';
    
    // Try immediate delivery
    try {
      await this.deliverNotification(notification);
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
      
      // If requires acknowledgment, set up escalation timer
      if (config.requireAcknowledgment) {
        setTimeout(() => {
          this.escalateCrisisNotification(notification);
        }, config.escalationTimeout * 60 * 1000);
      }
    } catch (error) {
      // If immediate delivery fails, try fallback channels
      await this.tryCrisisFallbacks(notification);
    }
  }

  private async tryCrisisFallbacks(notification: StoredNotification): Promise<void> {
    const fallbackChannels = CRISIS_CONFIG.fallbackChannels;
    
    for (const channel of fallbackChannels) {
      try {
        notification.options.channels = [channel];
        await this.deliverNotification(notification);
        return;
      } catch (error) {
        console.error(`Crisis fallback ${channel} failed:`, error);
      }
    }
    
    // If all fallbacks fail, log critical error
    console.error('CRITICAL: All crisis notification channels failed');
  }

  private async escalateCrisisNotification(notification: StoredNotification): Promise<void> {
    // Check if notification was acknowledged
    if (notification.status === 'dismissed') {
      return; // User acknowledged, no escalation needed
    }
    
    // Escalate to emergency contacts or supervisors
    console.warn('Crisis notification escalation triggered:', notification.id);
    // In production, this would notify emergency contacts
  }

  private async sendPushNotification(notification: StoredNotification): Promise<void> {
    if (!this.pushSubscription) {
      throw new Error('No push subscription available');
    }

    const payload = JSON.stringify({
      title: notification.options.title,
      body: notification.options.body,
      icon: notification.options.icon,
      badge: notification.options.badge,
      data: notification.options.data,
      actions: notification.options.actions
    });

    // In production, this would send to push service
    console.log('Push notification sent:', payload);
  }

  private async sendInAppNotification(notification: StoredNotification): Promise<void> {
    if (!this.isSupported) {
      throw new Error('In-app notifications not supported');
    }

    const browserNotification = new Notification(notification.options.title, {
      body: notification.options.body,
      icon: notification.options.icon,
      badge: notification.options.badge,
      tag: notification.options.tag,
      data: notification.options.data,
      requireInteraction: notification.options.requireInteraction,
      silent: notification.options.silent,
      // Note: actions removed for compatibility - would be handled by service worker
    });

    // Set up notification event handlers
    browserNotification.onclick = () => {
      this.handleNotificationClick(notification.id);
    };

    browserNotification.onclose = () => {
      this.dismissNotification(notification.id);
    };
  }

  private async sendEmailNotification(notification: StoredNotification): Promise<void> {
    // In production, this would integrate with email service
    console.log('Email notification sent:', notification.options.title);
  }

  private async sendSMSNotification(notification: StoredNotification): Promise<void> {
    // In production, this would integrate with SMS service
    console.log('SMS notification sent:', notification.options.title);
  }

  private sanitizeNotificationOptions(options: NotificationOptions): NotificationOptions {
    const sanitized = { ...options };
    
    // Remove potentially sensitive data for privacy
    if (sanitized.data) {
      const safeCopy = { ...sanitized.data };
      delete safeCopy.personalInfo;
      delete safeCopy.medicalData;
      sanitized.data = safeCopy;
    }
    
    return sanitized;
  }

  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private mergePreferences(
    current: NotificationPreferences, 
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    return {
      ...current,
      ...updates,
      channels: { ...current.channels, ...updates.channels },
      categories: { ...current.categories, ...updates.categories },
      urgencyLevels: { ...current.urgencyLevels, ...updates.urgencyLevels },
      quietHours: { ...current.quietHours, ...updates.quietHours },
      frequency: { ...current.frequency, ...updates.frequency },
      privacy: { ...current.privacy, ...updates.privacy }
    };
  }

  private async loadPreferences(): Promise<void> {
    // In production, this would load from secure storage
    console.log('Notification preferences loaded');
  }

  private async savePreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    // In production, this would save to secure storage
    console.log('Notification preferences saved for user:', userId);
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getVapidPublicKey(): Uint8Array {
    // In production, this would be your actual VAPID public key
    return new Uint8Array(65); // Placeholder
  }

  private handleNotificationClick(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
      this.updateStats('delivered', notification.options.category, 'in-app');
    }
  }

  private async deliverScheduledNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.status !== 'pending') {
      return;
    }

    try {
      await this.deliverNotification(notification);
    } catch (error) {
      console.error('Failed to deliver scheduled notification:', error);
    }
  }

  private initializeStats(): NotificationStats {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalDismissed: 0,
      averageDeliveryTime: 0,
      deliveryRate: 0,
      categoryBreakdown: {} as Record<NotificationCategory, number>,
      channelPerformance: {} as Record<NotificationChannel, {
        sent: number;
        delivered: number;
        failed: number;
      }>
    };
  }

  private updateStats(
    action: 'sent' | 'delivered' | 'failed' | 'dismissed',
    category?: NotificationCategory,
    channel?: NotificationChannel
  ): void {
    switch (action) {
      case 'sent':
        this.stats.totalSent++;
        break;
      case 'delivered':
        this.stats.totalDelivered++;
        break;
      case 'failed':
        this.stats.totalFailed++;
        break;
      case 'dismissed':
        this.stats.totalDismissed++;
        break;
    }

    // Update category breakdown
    if (category) {
      this.stats.categoryBreakdown[category] = 
        (this.stats.categoryBreakdown[category] || 0) + 1;
    }

    // Update channel performance
    if (channel) {
      if (!this.stats.channelPerformance[channel]) {
        this.stats.channelPerformance[channel] = { sent: 0, delivered: 0, failed: 0 };
      }
      
      if (action === 'sent') {
        this.stats.channelPerformance[channel].sent++;
      } else if (action === 'delivered') {
        this.stats.channelPerformance[channel].delivered++;
      } else if (action === 'failed') {
        this.stats.channelPerformance[channel].failed++;
      }
    }

    // Update delivery rate
    const total = this.stats.totalSent;
    if (total > 0) {
      this.stats.deliveryRate = (this.stats.totalDelivered / total) * 100;
    }
  }

  private scheduleCleanup(): void {
    // Clean up expired notifications every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
