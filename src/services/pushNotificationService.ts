/**
 * Push Notification Service
 *
 * Handles push notification subscriptions, crisis alerts, helper notifications,
 * and background communication with service worker for the Astral Core mental
 * health platform. Provides comprehensive notification management with
 * priority handling and user preferences.
 *
 * @fileoverview Push notification service with crisis alert capabilities
 * @version 2.0.0
 */

import { ENV } from '../utils/envConfig';

// VAPID public key from environment configuration
const VAPID_PUBLIC_KEY = ENV.VAPID_PUBLIC_KEY || 'default-vapid-key';

/**
 * Push subscription interface
 */
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
}

/**
 * Notification types with priority levels
 */
export type NotificationType = 
  | 'crisis-alert'      // Highest priority
  | 'safety-reminder'   // High priority
  | 'check-in'         // Medium priority
  | 'helper-match'     // Medium priority
  | 'message'          // Normal priority
  | 'milestone'        // Low priority
  | 'system';          // Variable priority

/**
 * Notification priority levels
 */
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Notification payload interface
 */
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp: number;
  expiresAt?: number;
  userId?: string;
}

/**
 * Notification action interface
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  types: {
    crisisAlert: boolean;
    safetyReminder: boolean;
    checkIn: boolean;
    helperMatch: boolean;
    message: boolean;
    milestone: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency: {
    checkIn: 'daily' | 'twice-daily' | 'weekly' | 'disabled';
    reminders: 'immediate' | 'batched' | 'disabled';
  };
  sound: boolean;
  vibration: boolean;
  updatedAt: string;
}

/**
 * Subscription status interface
 */
export interface SubscriptionStatus {
  isSubscribed: boolean;
  isSupported: boolean;
  subscription: PushSubscription | null;
  lastUpdated?: string;
  error?: string;
}

/**
 * Notification delivery result
 */
export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: number;
}

/**
 * Push Notification Service Implementation
 */
export class PushNotificationService {
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences | null = null;
  private isInitialized = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize the push notification service
   */
  async initialize(): Promise<SubscriptionStatus> {
    try {
      // Check for service worker support
      if (!('serviceWorker' in navigator)) {
        return {
          isSubscribed: false,
          isSupported: false,
          subscription: null,
          error: 'Service workers not supported'
        };
      }

      // Check for push notification support
      if (!('PushManager' in window)) {
        return {
          isSubscribed: false,
          isSupported: false,
          subscription: null,
          error: 'Push notifications not supported'
        };
      }

      // Get service worker registration
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready;

      // Check existing subscription
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (existingSubscription) {
        this.subscription = this.convertSubscription(existingSubscription);
      }

      this.isInitialized = true;

      return {
        isSubscribed: !!this.subscription,
        isSupported: true,
        subscription: this.subscription,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return {
        isSubscribed: false,
        isSupported: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request permission and subscribe to push notifications
   */
  async subscribe(): Promise<SubscriptionStatus> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        return {
          isSubscribed: false,
          isSupported: true,
          subscription: null,
          error: 'Permission denied'
        };
      }

      // Subscribe to push notifications
      const subscription = await this.serviceWorkerRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      this.subscription = this.convertSubscription(subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return {
        isSubscribed: true,
        isSupported: true,
        subscription: this.subscription,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return {
        isSubscribed: false,
        isSupported: true,
        subscription: null,
        error: error instanceof Error ? error.message : 'Subscription failed'
      };
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        const success = await subscription.unsubscribe();
        
        if (success) {
          this.subscription = null;
          // Notify server of unsubscription
          await this.removeSubscriptionFromServer();
        }
        
        return success;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Send a push notification
   */
  async sendNotification(payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      // Check if notifications are enabled and type is allowed
      if (!this.canSendNotification(payload.type)) {
        return {
          success: false,
          error: 'Notification type disabled or blocked',
          timestamp: Date.now()
        };
      }

      // Check quiet hours for non-critical notifications
      if (payload.priority !== 'critical' && this.isInQuietHours()) {
        return {
          success: false,
          error: 'Currently in quiet hours',
          timestamp: Date.now()
        };
      }

      // Send to server for delivery
      const response = await fetch('/.netlify/functions/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: this.subscription,
          payload
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messageId,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Send failed',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Send crisis alert notification (highest priority)
   */
  async sendCrisisAlert(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<DeliveryResult> {
    const payload: NotificationPayload = {
      id: `crisis-${Date.now()}`,
      type: 'crisis-alert',
      priority: 'critical',
      title,
      body,
      icon: '/icons/crisis-alert.png',
      badge: '/icons/badge-crisis.png',
      tag: 'crisis-alert',
      requireInteraction: true,
      silent: false,
      data: {
        ...data,
        url: '/crisis-support',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'get-help',
          title: 'Get Help Now',
          icon: '/icons/help.png'
        },
        {
          action: 'call-crisis',
          title: 'Call 988',
          icon: '/icons/phone.png'
        }
      ],
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send safety plan reminder
   */
  async sendSafetyReminder(
    title: string,
    body: string,
    safetyPlanId: string
  ): Promise<DeliveryResult> {
    const payload: NotificationPayload = {
      id: `safety-${safetyPlanId}-${Date.now()}`,
      type: 'safety-reminder',
      priority: 'high',
      title,
      body,
      icon: '/icons/safety-plan.png',
      tag: 'safety-reminder',
      data: {
        safetyPlanId,
        url: `/safety-plan/${safetyPlanId}`,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view-plan',
          title: 'View Safety Plan'
        },
        {
          action: 'check-in',
          title: 'Quick Check-in'
        }
      ],
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send check-in reminder
   */
  async sendCheckInReminder(
    title: string = 'Daily Check-in',
    body: string = 'How are you feeling today?'
  ): Promise<DeliveryResult> {
    const payload: NotificationPayload = {
      id: `checkin-${Date.now()}`,
      type: 'check-in',
      priority: 'medium',
      title,
      body,
      icon: '/icons/check-in.png',
      tag: 'check-in',
      data: {
        url: '/check-in',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'quick-checkin',
          title: 'Quick Check-in'
        }
      ],
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send helper match notification
   */
  async sendHelperMatchNotification(
    helperName: string,
    matchScore: number
  ): Promise<DeliveryResult> {
    const payload: NotificationPayload = {
      id: `helper-match-${Date.now()}`,
      type: 'helper-match',
      priority: 'medium',
      title: 'New Helper Match Found!',
      body: `${helperName} is a ${Math.round(matchScore * 100)}% match for you`,
      icon: '/icons/helper-match.png',
      data: {
        helperName,
        matchScore,
        url: '/helpers',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view-helper',
          title: 'View Profile'
        },
        {
          action: 'connect',
          title: 'Connect Now'
        }
      ],
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send message notification
   */
  async sendMessageNotification(
    senderName: string,
    messagePreview: string,
    conversationId: string
  ): Promise<DeliveryResult> {
    const payload: NotificationPayload = {
      id: `message-${conversationId}-${Date.now()}`,
      type: 'message',
      priority: 'medium',
      title: `Message from ${senderName}`,
      body: messagePreview,
      icon: '/icons/message.png',
      tag: `conversation-${conversationId}`,
      data: {
        senderName,
        conversationId,
        url: `/messages/${conversationId}`,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply'
        },
        {
          action: 'view',
          title: 'View Message'
        }
      ],
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): SubscriptionStatus {
    return {
      isSubscribed: !!this.subscription,
      isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      subscription: this.subscription
    };
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = {
      ...this.preferences,
      ...preferences,
      updatedAt: new Date().toISOString()
    } as NotificationPreferences;

    // Save to server
    try {
      await fetch('/.netlify/functions/update-notification-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.preferences)
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  /**
   * Check if a notification type can be sent
   */
  private canSendNotification(type: NotificationType): boolean {
    if (!this.preferences) return true; // Default to allowing if no preferences set

    if (!this.preferences.enabled) return false;

    // Crisis alerts always allowed regardless of preferences
    if (type === 'crisis-alert') return true;

    // Check type-specific preferences
    const typeMap: Record<NotificationType, keyof NotificationPreferences['types']> = {
      'crisis-alert': 'crisisAlert',
      'safety-reminder': 'safetyReminder',
      'check-in': 'checkIn',
      'helper-match': 'helperMatch',
      'message': 'message',
      'milestone': 'milestone',
      'system': 'system'
    };

    return this.preferences.types[typeMap[type]] !== false;
  }

  /**
   * Check if currently in quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = this.preferences.quietHours;
    
    // Handle same-day quiet hours
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    }
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    return currentTime >= start || currentTime <= end;
  }

  /**
   * Convert browser PushSubscription to our interface
   */
  private convertSubscription(subscription: globalThis.PushSubscription): PushSubscription {
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      },
      expirationTime: subscription.expirationTime || undefined
    };
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/.netlify/functions/register-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await fetch('/.netlify/functions/unregister-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: this.subscription?.endpoint })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  /**
   * Convert URL-safe base64 to Uint8Array
   */
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

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return window.btoa(binary);
  }
}

// Create and export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export convenience methods
export const initializePushNotifications = () => pushNotificationService.initialize();
export const subscribeToPushNotifications = () => pushNotificationService.subscribe();
export const sendCrisisAlert = (title: string, body: string, data?: Record<string, any>) =>
  pushNotificationService.sendCrisisAlert(title, body, data);

export default pushNotificationService;
