/**
 * Enhanced Push Notification Service
 *
 * Comprehensive push notification system for mental health platform with:
 * - Web Push API integration with fallback options
 * - Granular notification scheduling and templates
 * - Personalized content based on user preferences and state
 * - Multi-channel delivery (push, email, SMS)
 * - Crisis override settings and priority management
 * - Privacy-preserving analytics and tracking
 *
 * @fileoverview Enhanced push notification service with comprehensive features
 * @version 3.0.0
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
  | 'crisis-alert'         // Highest priority
  | 'safety-reminder'      // High priority
  | 'medication-reminder'  // High priority
  | 'appointment-reminder' // High priority
  | 'check-in'            // Medium priority
  | 'mood-check'          // Medium priority
  | 'helper-match'        // Medium priority
  | 'message'             // Normal priority
  | 'group-session'       // Normal priority
  | 'wellness-tip'        // Low priority
  | 'milestone'           // Low priority
  | 'system';             // Variable priority

/**
 * Notification priority levels
 */
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Notification channel types
 */
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app';

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
  channels?: NotificationChannel[];
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
 * Notification schedule interface
 */
export interface NotificationSchedule {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string; // HH:MM format
  days: string[]; // ['Mon', 'Tue', etc.]
  enabled: boolean;
  metadata?: Record<string, any>;
  lastTriggered?: string;
  nextTrigger?: string;
}

/**
 * Notification template interface
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  bodyTemplate: string;
  icon?: string;
  badge?: string;
  actions?: NotificationAction[];
  priority: NotificationPriority;
  variables?: string[];
  personalizationRules?: PersonalizationRule[];
}

/**
 * Personalization rule for dynamic content
 */
export interface PersonalizationRule {
  condition: string; // e.g., "moodScore < 3"
  modifications: {
    title?: string;
    body?: string;
    priority?: NotificationPriority;
    actions?: NotificationAction[];
  };
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
    medicationReminder: boolean;
    appointmentReminder: boolean;
    checkIn: boolean;
    moodCheck: boolean;
    helperMatch: boolean;
    message: boolean;
    groupSession: boolean;
    wellnessTip: boolean;
    milestone: boolean;
    system: boolean;
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    overrideForCrisis: boolean;
    weekendsOnly?: boolean;
  };
  frequency: {
    checkIn: 'hourly' | 'daily' | 'twice-daily' | 'weekly' | 'disabled';
    moodCheck: 'daily' | 'twice-daily' | 'weekly' | 'disabled';
    wellnessTips: 'daily' | 'weekly' | 'disabled';
    reminders: 'immediate' | 'batched' | 'smart' | 'disabled';
  };
  schedules: NotificationSchedule[];
  personalizedContent: boolean;
  sound: boolean;
  vibration: boolean;
  language: string;
  timezone: string;
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
  channels?: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

/**
 * Delivery result
 */
export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: number;
  channel?: NotificationChannel;
  retryCount?: number;
}

/**
 * Notification analytics
 */
export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  actioned: number;
  dismissed: number;
  failed: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  averageResponseTime: number;
}

/**
 * Enhanced Push Notification Service Implementation
 */
export class PushNotificationService {
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences | null = null;
  private isInitialized = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private templates: Map<NotificationType, NotificationTemplate> = new Map();
  private scheduledNotifications: Map<string, NodeJS.Timer> = new Map();
  private analytics: NotificationAnalytics = {
    sent: 0,
    delivered: 0,
    opened: 0,
    actioned: 0,
    dismissed: 0,
    failed: 0,
    byType: {} as Record<NotificationType, number>,
    byChannel: {} as Record<NotificationChannel, number>,
    averageResponseTime: 0
  };

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'medication-reminder',
        type: 'medication-reminder',
        title: 'Medication Reminder',
        bodyTemplate: 'Time to take your {{medication}} - {{dosage}}',
        icon: '/icons/medication.png',
        badge: '/icons/badge-health.png',
        actions: [
          { action: 'taken', title: 'Mark as Taken', icon: '/icons/check.png' },
          { action: 'snooze', title: 'Snooze 10 min', icon: '/icons/clock.png' }
        ],
        priority: 'high',
        variables: ['medication', 'dosage'],
        personalizationRules: [
          {
            condition: 'missedCount > 2',
            modifications: {
              priority: 'critical',
              body: 'Important: You\'ve missed {{missedCount}} doses. Please take your {{medication}} now.'
            }
          }
        ]
      },
      {
        id: 'appointment-reminder',
        type: 'appointment-reminder',
        title: 'Appointment Reminder',
        bodyTemplate: '{{appointmentType}} with {{provider}} {{timeUntil}}',
        icon: '/icons/calendar.png',
        badge: '/icons/badge-calendar.png',
        actions: [
          { action: 'view-details', title: 'View Details', icon: '/icons/info.png' },
          { action: 'get-directions', title: 'Get Directions', icon: '/icons/map.png' }
        ],
        priority: 'high',
        variables: ['appointmentType', 'provider', 'timeUntil']
      },
      {
        id: 'mood-check',
        type: 'mood-check',
        title: 'Daily Mood Check-in',
        bodyTemplate: 'How are you feeling today? Take a moment to check in with yourself.',
        icon: '/icons/mood.png',
        badge: '/icons/badge-heart.png',
        actions: [
          { action: 'quick-check', title: 'Quick Check-in', icon: '/icons/quick.png' },
          { action: 'detailed', title: 'Detailed Entry', icon: '/icons/journal.png' }
        ],
        priority: 'medium',
        variables: [],
        personalizationRules: [
          {
            condition: 'lastMoodScore < 3',
            modifications: {
              body: 'We noticed you\'ve been feeling down. How are you doing today?',
              actions: [
                { action: 'quick-check', title: 'Quick Check-in', icon: '/icons/quick.png' },
                { action: 'talk-to-someone', title: 'Talk to Someone', icon: '/icons/chat.png' }
              ]
            }
          }
        ]
      },
      {
        id: 'crisis-alert',
        type: 'crisis-alert',
        title: 'Crisis Support Available',
        bodyTemplate: '{{message}}',
        icon: '/icons/crisis-alert.png',
        badge: '/icons/badge-crisis.png',
        actions: [
          { action: 'get-help', title: 'Get Help Now', icon: '/icons/help.png' },
          { action: 'call-988', title: 'Call 988', icon: '/icons/phone.png' }
        ],
        priority: 'critical',
        variables: ['message']
      },
      {
        id: 'group-session',
        type: 'group-session',
        title: 'Group Session Starting Soon',
        bodyTemplate: '{{sessionName}} starts in {{timeUntil}}',
        icon: '/icons/group.png',
        badge: '/icons/badge-group.png',
        actions: [
          { action: 'join', title: 'Join Session', icon: '/icons/join.png' },
          { action: 'maybe-later', title: 'Maybe Later', icon: '/icons/later.png' }
        ],
        priority: 'medium',
        variables: ['sessionName', 'timeUntil']
      },
      {
        id: 'wellness-tip',
        type: 'wellness-tip',
        title: 'Daily Wellness Tip',
        bodyTemplate: '{{tip}}',
        icon: '/icons/wellness.png',
        badge: '/icons/badge-wellness.png',
        actions: [
          { action: 'learn-more', title: 'Learn More', icon: '/icons/info.png' },
          { action: 'save', title: 'Save Tip', icon: '/icons/bookmark.png' }
        ],
        priority: 'low',
        variables: ['tip']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

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

      // Load user preferences
      await this.loadPreferences();

      // Initialize scheduled notifications
      this.initializeScheduledNotifications();

      this.isInitialized = true;

      return {
        isSubscribed: !!this.subscription,
        isSupported: true,
        subscription: this.subscription,
        channels: {
          push: !!this.subscription,
          email: false, // TODO: Check email subscription
          sms: false    // TODO: Check SMS subscription
        },
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

      // Update analytics
      this.trackEvent('subscription', 'created');

      return {
        isSubscribed: true,
        isSupported: true,
        subscription: this.subscription,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      this.trackEvent('subscription', 'failed');
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
          // Clear scheduled notifications
          this.clearAllScheduledNotifications();
          // Update analytics
          this.trackEvent('subscription', 'removed');
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
   * Send a push notification with multi-channel support
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
        // Check for crisis override
        if (!(payload.type === 'crisis-alert' && this.preferences?.quietHours.overrideForCrisis)) {
          return {
            success: false,
            error: 'Currently in quiet hours',
            timestamp: Date.now()
          };
        }
      }

      // Apply personalization if enabled
      if (this.preferences?.personalizedContent) {
        payload = await this.personalizeNotification(payload);
      }

      // Determine channels to use
      const channels = payload.channels || this.getEnabledChannels();
      
      // Send through each enabled channel
      const results: DeliveryResult[] = [];
      
      for (const channel of channels) {
        const result = await this.sendViaChannel(channel, payload);
        results.push(result);
      }

      // Update analytics
      this.analytics.sent++;
      if (payload.type in this.analytics.byType) {
        this.analytics.byType[payload.type]++;
      } else {
        this.analytics.byType[payload.type] = 1;
      }

      // Return first successful result or last failure
      const successResult = results.find(r => r.success);
      return successResult || results[results.length - 1];
    } catch (error) {
      console.error('Failed to send push notification:', error);
      this.analytics.failed++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Send failed',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Send notification via specific channel
   */
  private async sendViaChannel(
    channel: NotificationChannel, 
    payload: NotificationPayload
  ): Promise<DeliveryResult> {
    switch (channel) {
      case 'push':
        return this.sendPushNotification(payload);
      case 'email':
        return this.sendEmailNotification(payload);
      case 'sms':
        return this.sendSMSNotification(payload);
      case 'in-app':
        return this.sendInAppNotification(payload);
      default:
        return {
          success: false,
          error: `Unknown channel: ${channel}`,
          timestamp: Date.now(),
          channel
        };
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.subscription) {
      return {
        success: false,
        error: 'No push subscription',
        timestamp: Date.now(),
        channel: 'push'
      };
    }

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
    
    this.analytics.delivered++;
    if ('push' in this.analytics.byChannel) {
      this.analytics.byChannel.push++;
    } else {
      this.analytics.byChannel.push = 1;
    }

    return {
      success: true,
      messageId: result.messageId,
      timestamp: Date.now(),
      channel: 'push'
    };
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(payload: NotificationPayload): Promise<DeliveryResult> {
    // TODO: Implement email sending
    console.log('Email notification would be sent:', payload);
    return {
      success: false,
      error: 'Email notifications not yet implemented',
      timestamp: Date.now(),
      channel: 'email'
    };
  }

  /**
   * Send SMS notification (placeholder)
   */
  private async sendSMSNotification(payload: NotificationPayload): Promise<DeliveryResult> {
    // TODO: Implement SMS sending
    console.log('SMS notification would be sent:', payload);
    return {
      success: false,
      error: 'SMS notifications not yet implemented',
      timestamp: Date.now(),
      channel: 'sms'
    };
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(payload: NotificationPayload): Promise<DeliveryResult> {
    // Dispatch custom event for in-app notification
    window.dispatchEvent(new CustomEvent('in-app-notification', {
      detail: payload
    }));

    return {
      success: true,
      messageId: `in-app-${Date.now()}`,
      timestamp: Date.now(),
      channel: 'in-app'
    };
  }

  /**
   * Personalize notification based on user data and context
   */
  private async personalizeNotification(
    payload: NotificationPayload
  ): Promise<NotificationPayload> {
    const template = this.templates.get(payload.type);
    
    if (!template?.personalizationRules) {
      return payload;
    }

    // Get user context (would come from user store/service)
    const userContext = await this.getUserContext(payload.userId);
    
    // Apply personalization rules
    for (const rule of template.personalizationRules) {
      if (this.evaluateCondition(rule.condition, userContext)) {
        payload = {
          ...payload,
          ...rule.modifications
        };
      }
    }

    return payload;
  }

  /**
   * Get user context for personalization
   */
  private async getUserContext(userId?: string): Promise<Record<string, any>> {
    // TODO: Fetch actual user context from store/service
    return {
      moodScore: 5,
      lastMoodScore: 4,
      missedCount: 0,
      streakDays: 7
    };
  }

  /**
   * Evaluate personalization condition
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Simple evaluation - in production, use a proper expression evaluator
    try {
      // WARNING: This is for demo only - never use eval in production!
      // Use a proper expression parser like mathjs or expr-eval
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return func(context);
    } catch {
      return false;
    }
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(schedule: NotificationSchedule): Promise<string> {
    const scheduleId = schedule.id || `schedule-${Date.now()}`;
    
    // Clear existing schedule if it exists
    if (this.scheduledNotifications.has(scheduleId)) {
      clearInterval(this.scheduledNotifications.get(scheduleId)!);
    }

    // Calculate next trigger time
    const nextTrigger = this.calculateNextTrigger(schedule);
    
    if (!nextTrigger) {
      return scheduleId;
    }

    // Set up the schedule
    const checkInterval = setInterval(() => {
      const now = new Date();
      const shouldTrigger = this.shouldTriggerSchedule(schedule, now);
      
      if (shouldTrigger) {
        const template = this.templates.get(schedule.type);
        
        if (template) {
          const payload: NotificationPayload = {
            id: `${scheduleId}-${Date.now()}`,
            type: schedule.type,
            priority: template.priority,
            title: schedule.title || template.title,
            body: schedule.body || template.bodyTemplate,
            icon: template.icon,
            badge: template.badge,
            actions: template.actions,
            data: schedule.metadata,
            timestamp: Date.now()
          };
          
          this.sendNotification(payload);
          
          // Update last triggered time
          schedule.lastTriggered = now.toISOString();
        }
      }
    }, 60000); // Check every minute

    this.scheduledNotifications.set(scheduleId, checkInterval);
    
    return scheduleId;
  }

  /**
   * Calculate next trigger time for a schedule
   */
  private calculateNextTrigger(schedule: NotificationSchedule): Date | null {
    if (!schedule.enabled || schedule.days.length === 0) {
      return null;
    }

    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    // Find next matching day
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let daysToAdd = 0;
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      const dayName = daysOfWeek[checkDate.getDay()];
      
      if (schedule.days.includes(dayName)) {
        const scheduledTime = new Date(checkDate);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        if (scheduledTime > now) {
          return scheduledTime;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if schedule should trigger
   */
  private shouldTriggerSchedule(schedule: NotificationSchedule, now: Date): boolean {
    if (!schedule.enabled) return false;
    
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = daysOfWeek[now.getDay()];
    
    // Check if current day is in schedule
    if (!schedule.days.includes(currentDay)) return false;
    
    // Check if current time matches schedule time (within a minute)
    if (now.getHours() !== hours || Math.abs(now.getMinutes() - minutes) > 1) {
      return false;
    }
    
    // Check if already triggered recently (prevent duplicates)
    if (schedule.lastTriggered) {
      const lastTrigger = new Date(schedule.lastTriggered);
      const timeSinceLastTrigger = now.getTime() - lastTrigger.getTime();
      
      // Don't trigger if already triggered in the last hour
      if (timeSinceLastTrigger < 3600000) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduledNotification(scheduleId: string): boolean {
    if (this.scheduledNotifications.has(scheduleId)) {
      clearInterval(this.scheduledNotifications.get(scheduleId)!);
      this.scheduledNotifications.delete(scheduleId);
      return true;
    }
    return false;
  }

  /**
   * Clear all scheduled notifications
   */
  private clearAllScheduledNotifications(): void {
    this.scheduledNotifications.forEach(timer => clearInterval(timer));
    this.scheduledNotifications.clear();
  }

  /**
   * Initialize scheduled notifications from preferences
   */
  private initializeScheduledNotifications(): void {
    if (!this.preferences?.schedules) return;
    
    this.preferences.schedules.forEach(schedule => {
      if (schedule.enabled) {
        this.scheduleNotification(schedule);
      }
    });
  }

  /**
   * Send medication reminder
   */
  async sendMedicationReminder(
    medication: string,
    dosage: string,
    metadata?: Record<string, any>
  ): Promise<DeliveryResult> {
    const template = this.templates.get('medication-reminder')!;
    
    const payload: NotificationPayload = {
      id: `med-${Date.now()}`,
      type: 'medication-reminder',
      priority: 'high',
      title: template.title,
      body: template.bodyTemplate
        .replace('{{medication}}', medication)
        .replace('{{dosage}}', dosage),
      icon: template.icon,
      badge: template.badge,
      actions: template.actions,
      requireInteraction: true,
      data: {
        medication,
        dosage,
        ...metadata,
        url: '/medications',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    appointmentType: string,
    provider: string,
    appointmentTime: Date,
    metadata?: Record<string, any>
  ): Promise<DeliveryResult> {
    const template = this.templates.get('appointment-reminder')!;
    
    // Calculate time until appointment
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeUntil = '';
    if (hoursUntil > 0) {
      timeUntil = `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
    } else if (minutesUntil > 0) {
      timeUntil = `in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;
    } else {
      timeUntil = 'now';
    }
    
    const payload: NotificationPayload = {
      id: `appt-${Date.now()}`,
      type: 'appointment-reminder',
      priority: 'high',
      title: template.title,
      body: template.bodyTemplate
        .replace('{{appointmentType}}', appointmentType)
        .replace('{{provider}}', provider)
        .replace('{{timeUntil}}', timeUntil),
      icon: template.icon,
      badge: template.badge,
      actions: template.actions,
      requireInteraction: true,
      data: {
        appointmentType,
        provider,
        appointmentTime: appointmentTime.toISOString(),
        ...metadata,
        url: '/appointments',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send mood check-in reminder
   */
  async sendMoodCheckInReminder(customMessage?: string): Promise<DeliveryResult> {
    const template = this.templates.get('mood-check')!;
    
    const payload: NotificationPayload = {
      id: `mood-${Date.now()}`,
      type: 'mood-check',
      priority: 'medium',
      title: template.title,
      body: customMessage || template.bodyTemplate,
      icon: template.icon,
      badge: template.badge,
      actions: template.actions,
      data: {
        url: '/mood',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send crisis alert notification
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
          action: 'call-988',
          title: 'Call 988',
          icon: '/icons/phone.png'
        }
      ],
      timestamp: Date.now(),
      channels: ['push', 'sms', 'email'] // Use all channels for crisis
    };

    return this.sendNotification(payload);
  }

  /**
   * Send group session invitation
   */
  async sendGroupSessionInvite(
    sessionName: string,
    startTime: Date,
    metadata?: Record<string, any>
  ): Promise<DeliveryResult> {
    const template = this.templates.get('group-session')!;
    
    // Calculate time until session
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));
    
    const payload: NotificationPayload = {
      id: `group-${Date.now()}`,
      type: 'group-session',
      priority: 'medium',
      title: template.title,
      body: template.bodyTemplate
        .replace('{{sessionName}}', sessionName)
        .replace('{{timeUntil}}', `${minutesUntil} minutes`),
      icon: template.icon,
      badge: template.badge,
      actions: template.actions,
      data: {
        sessionName,
        startTime: startTime.toISOString(),
        ...metadata,
        url: '/groups',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Send wellness tip
   */
  async sendWellnessTip(tip: string, metadata?: Record<string, any>): Promise<DeliveryResult> {
    const template = this.templates.get('wellness-tip')!;
    
    const payload: NotificationPayload = {
      id: `tip-${Date.now()}`,
      type: 'wellness-tip',
      priority: 'low',
      title: template.title,
      body: tip,
      icon: template.icon,
      badge: template.badge,
      actions: template.actions,
      silent: true,
      data: {
        tip,
        ...metadata,
        url: '/wellness',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    return this.sendNotification(payload);
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): SubscriptionStatus {
    return {
      isSubscribed: !!this.subscription,
      isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      subscription: this.subscription,
      channels: {
        push: !!this.subscription,
        email: this.preferences?.channels.email || false,
        sms: this.preferences?.channels.sms || false
      }
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

    // Reinitialize scheduled notifications if schedules changed
    if (preferences.schedules) {
      this.clearAllScheduledNotifications();
      this.initializeScheduledNotifications();
    }

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

    // Save locally
    this.savePreferencesLocally();
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  /**
   * Get notification analytics
   */
  getAnalytics(): NotificationAnalytics {
    return { ...this.analytics };
  }

  /**
   * Track notification event
   */
  trackEvent(eventType: string, eventData: any): void {
    // Update analytics based on event type
    switch (eventType) {
      case 'opened':
        this.analytics.opened++;
        break;
      case 'actioned':
        this.analytics.actioned++;
        break;
      case 'dismissed':
        this.analytics.dismissed++;
        break;
    }

    // Send to analytics service
    console.log('Notification event tracked:', eventType, eventData);
  }

  /**
   * Load user preferences
   */
  private async loadPreferences(): Promise<void> {
    try {
      // Try to load from local storage first
      const userId = localStorage.getItem('userId') || 'default';
      const localPrefs = localStorage.getItem(`notification_preferences_${userId}`);
      
      if (localPrefs) {
        this.preferences = JSON.parse(localPrefs);
      }

      // Then try to sync with server
      const response = await fetch(`/.netlify/functions/get-notification-preferences?userId=${userId}`);
      
      if (response.ok) {
        const serverPrefs = await response.json();
        this.preferences = serverPrefs;
        this.savePreferencesLocally();
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      // Use default preferences
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Save preferences locally
   */
  private savePreferencesLocally(): void {
    if (!this.preferences) return;
    
    const userId = this.preferences.userId || 'default';
    localStorage.setItem(
      `notification_preferences_${userId}`,
      JSON.stringify(this.preferences)
    );
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      userId: localStorage.getItem('userId') || 'default',
      enabled: true,
      types: {
        crisisAlert: true,
        safetyReminder: true,
        medicationReminder: true,
        appointmentReminder: true,
        checkIn: true,
        moodCheck: true,
        helperMatch: true,
        message: true,
        groupSession: true,
        wellnessTip: false,
        milestone: true,
        system: false
      },
      channels: {
        push: true,
        email: false,
        sms: false,
        inApp: true
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        overrideForCrisis: true,
        weekendsOnly: false
      },
      frequency: {
        checkIn: 'daily',
        moodCheck: 'daily',
        wellnessTips: 'weekly',
        reminders: 'immediate'
      },
      schedules: [],
      personalizedContent: true,
      sound: true,
      vibration: true,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get enabled notification channels
   */
  private getEnabledChannels(): NotificationChannel[] {
    if (!this.preferences) return ['push'];
    
    const channels: NotificationChannel[] = [];
    
    if (this.preferences.channels.push && this.subscription) {
      channels.push('push');
    }
    if (this.preferences.channels.email) {
      channels.push('email');
    }
    if (this.preferences.channels.sms) {
      channels.push('sms');
    }
    if (this.preferences.channels.inApp) {
      channels.push('in-app');
    }
    
    return channels.length > 0 ? channels : ['in-app'];
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
      'medication-reminder': 'medicationReminder',
      'appointment-reminder': 'appointmentReminder',
      'check-in': 'checkIn',
      'mood-check': 'moodCheck',
      'helper-match': 'helperMatch',
      'message': 'message',
      'group-session': 'groupSession',
      'wellness-tip': 'wellnessTip',
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
    
    // Check if weekends only and not weekend
    if (this.preferences.quietHours.weekendsOnly) {
      const dayOfWeek = now.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        return false;
      }
    }

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
export const sendMedicationReminder = (medication: string, dosage: string, metadata?: Record<string, any>) =>
  pushNotificationService.sendMedicationReminder(medication, dosage, metadata);
export const sendAppointmentReminder = (
  appointmentType: string,
  provider: string,
  appointmentTime: Date,
  metadata?: Record<string, any>
) => pushNotificationService.sendAppointmentReminder(appointmentType, provider, appointmentTime, metadata);

export default pushNotificationService;