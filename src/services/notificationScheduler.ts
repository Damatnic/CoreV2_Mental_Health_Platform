/**
 * Notification Scheduler Service
 *
 * Provides intelligent notification scheduling for the mental health platform.
 * Manages wellness reminders, crisis alerts, therapy appointments, medication
 * reminders, and mood check-ins with user preference awareness and smart timing.
 *
 * @fileoverview Intelligent notification scheduling and management
 * @version 2.0.0
 */

import React from 'react';
import { logger } from '../utils/logger';
import { pushNotificationService } from './pushNotificationService';
import { secureStorage } from './secureStorageService';

export type NotificationType = 
  | 'wellness-reminder'
  | 'mood-checkin'
  | 'therapy-appointment'
  | 'medication-reminder'
  | 'crisis-alert'
  | 'breathing-exercise'
  | 'journal-prompt'
  | 'safety-plan-review'
  | 'progress-update'
  | 'custom';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface NotificationSchedule {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  scheduledTime: number;
  recurrence: RecurrenceType;
  customRecurrence?: {
    interval: number;
    daysOfWeek?: number[];
    endDate?: number;
  };
  enabled: boolean;
  conditions?: {
    moodThreshold?: 'low' | 'medium' | 'high';
    timeRange?: { start: string; end: string };
    skipWeekends?: boolean;
    skipHolidays?: boolean;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    relatedEntityId?: string;
    customData?: Record<string, any>;
  };
  createdAt: number;
  updatedAt: number;
  lastSent?: number;
  nextScheduled?: number;
}

export interface NotificationPreferences {
  userId: string;
  globalEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  typePreferences: Record<NotificationType, {
    enabled: boolean;
    priority: NotificationPriority;
    frequency: 'minimal' | 'normal' | 'frequent';
  }>;
  deliveryChannels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  smartTiming: boolean;
  respectDoNotDisturb: boolean;
  timezone: string;
}

export interface NotificationHistory {
  id: string;
  scheduleId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sentAt: number;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'dismissed';
  interactionType?: 'opened' | 'dismissed' | 'action_taken';
  interactionTime?: number;
  metadata?: Record<string, any>;
}

class NotificationSchedulerService {
  private schedules: Map<string, NotificationSchedule> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private history: NotificationHistory[] = [];
  private activeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly STORAGE_PREFIX = 'notification_';
  private readonly PREFS_STORAGE_KEY = 'notification_preferences';
  private readonly HISTORY_STORAGE_KEY = 'notification_history';

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadPersistedData();
    this.scheduleAllActiveNotifications();
    this.setupCleanupTimer();
    logger.info('NotificationSchedulerService initialized');
  }

  private async loadPersistedData() {
    try {
      const preferences = await secureStorage.getItem<Record<string, NotificationPreferences>>(this.PREFS_STORAGE_KEY);
      if (preferences) {
        Object.entries(preferences).forEach(([userId, prefs]) => {
          this.preferences.set(userId, prefs);
        });
      }

      const history = await secureStorage.getItem<NotificationHistory[]>(this.HISTORY_STORAGE_KEY);
      if (history && Array.isArray(history)) {
        this.history = history.slice(-1000);
      }

      const keys = await this.getAllStorageKeys();
      for (const key of keys) {
        if (key.startsWith(this.STORAGE_PREFIX + 'schedule_')) {
          const schedule = await secureStorage.getItem<NotificationSchedule>(key);
          if (schedule) {
            this.schedules.set(schedule.id, schedule);
          }
        }
      }

      logger.debug(`Loaded ${this.schedules.size} notification schedules and ${this.preferences.size} user preferences`);
    } catch (error) {
      logger.error('Failed to load persisted notification data:', error);
    }
  }

  private async getAllStorageKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private setupCleanupTimer() {
    setInterval(() => {
      this.cleanupOldHistory();
    }, 24 * 60 * 60 * 1000);
  }

  private async cleanupOldHistory() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const initialCount = this.history.length;
    
    this.history = this.history.filter(entry => entry.sentAt > thirtyDaysAgo);
    
    if (this.history.length < initialCount) {
      await this.persistHistory();
      logger.info(`Cleaned up ${initialCount - this.history.length} old notification history entries`);
    }
  }

  public async createSchedule(schedule: Omit<NotificationSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationSchedule> {
    const newSchedule: NotificationSchedule = {
      ...schedule,
      id: this.generateScheduleId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.schedules.set(newSchedule.id, newSchedule);
    await this.persistSchedule(newSchedule);
    
    if (newSchedule.enabled) {
      this.scheduleNotification(newSchedule);
    }

    logger.info(`Created notification schedule: ${newSchedule.id} (${newSchedule.type})`);
    return newSchedule;
  }

  public async updateSchedule(scheduleId: string, updates: Partial<NotificationSchedule>): Promise<NotificationSchedule | null> {
    const existing = this.schedules.get(scheduleId);
    if (!existing) {
      logger.warn(`Schedule ${scheduleId} not found for update`);
      return null;
    }

    const updated: NotificationSchedule = {
      ...existing,
      ...updates,
      id: scheduleId,
      updatedAt: Date.now(),
    };

    this.schedules.set(scheduleId, updated);
    await this.persistSchedule(updated);

    this.cancelScheduledNotification(scheduleId);
    if (updated.enabled) {
      this.scheduleNotification(updated);
    }

    logger.info(`Updated notification schedule: ${scheduleId}`);
    return updated;
  }

  public async deleteSchedule(scheduleId: string): Promise<boolean> {
    if (!this.schedules.has(scheduleId)) {
      return false;
    }

    this.cancelScheduledNotification(scheduleId);
    this.schedules.delete(scheduleId);
    await secureStorage.removeItem(`${this.STORAGE_PREFIX}schedule_${scheduleId}`);

    logger.info(`Deleted notification schedule: ${scheduleId}`);
    return true;
  }

  public getSchedule(scheduleId: string): NotificationSchedule | null {
    return this.schedules.get(scheduleId) || null;
  }

  public getUserSchedules(userId: string): NotificationSchedule[] {
    return Array.from(this.schedules.values()).filter(schedule => schedule.userId === userId);
  }

  private scheduleNotification(schedule: NotificationSchedule) {
    const nextTime = this.calculateNextScheduleTime(schedule);
    if (!nextTime) return;

    const delay = nextTime - Date.now();
    if (delay <= 0) {
      setTimeout(() => this.executeNotification(schedule), 100);
      return;
    }

    const timer = setTimeout(() => {
      this.executeNotification(schedule);
    }, delay);

    this.activeTimers.set(schedule.id, timer);
    
    schedule.nextScheduled = nextTime;
    this.persistSchedule(schedule);

    logger.debug(`Scheduled notification ${schedule.id} for ${new Date(nextTime).toLocaleString()}`);
  }

  private calculateNextScheduleTime(schedule: NotificationSchedule): number | null {
    const now = Date.now();
    let nextTime = schedule.scheduledTime;

    if (schedule.recurrence === 'once' && nextTime <= now) {
      return null;
    }

    switch (schedule.recurrence) {
      case 'once':
        return nextTime > now ? nextTime : null;

      case 'daily':
        while (nextTime <= now) {
          nextTime += 24 * 60 * 60 * 1000;
        }
        break;

      case 'weekly':
        while (nextTime <= now) {
          nextTime += 7 * 24 * 60 * 60 * 1000;
        }
        break;

      case 'monthly':
        const date = new Date(nextTime);
        while (nextTime <= now) {
          date.setMonth(date.getMonth() + 1);
          nextTime = date.getTime();
        }
        break;

      case 'custom':
        if (schedule.customRecurrence) {
          const interval = schedule.customRecurrence.interval * 60 * 1000;
          while (nextTime <= now) {
            nextTime += interval;
          }
          
          if (schedule.customRecurrence.endDate && nextTime > schedule.customRecurrence.endDate) {
            return null;
          }
        }
        break;
    }

    return this.applySchedulingConditions(nextTime, schedule);
  }

  private applySchedulingConditions(scheduledTime: number, schedule: NotificationSchedule): number {
    const prefs = this.preferences.get(schedule.userId);
    if (!prefs) return scheduledTime;

    const date = new Date(scheduledTime);
    
    if (prefs.quietHours.enabled) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const currentTime = hour * 60 + minute;
      
      const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);
      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;
      
      if (currentTime >= quietStart && currentTime <= quietEnd) {
        date.setHours(endHour, endMin, 0, 0);
        scheduledTime = date.getTime();
      }
    }

    if (schedule.conditions?.skipWeekends) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const daysToAdd = dayOfWeek === 0 ? 1 : 2;
        date.setDate(date.getDate() + daysToAdd);
        scheduledTime = date.getTime();
      }
    }

    return scheduledTime;
  }

  private async executeNotification(schedule: NotificationSchedule) {
    try {
      const prefs = this.preferences.get(schedule.userId);
      
      if (prefs && !prefs.globalEnabled) {
        logger.debug(`Skipping notification for user ${schedule.userId} - globally disabled`);
        return;
      }

      if (prefs && !prefs.typePreferences[schedule.type]?.enabled) {
        logger.debug(`Skipping ${schedule.type} notification for user ${schedule.userId} - type disabled`);
        return;
      }

      const success = await pushNotificationService.sendNotification(
        schedule.userId,
        schedule.message,
        schedule.title,
        schedule.metadata?.customData
      );

      const historyEntry: NotificationHistory = {
        id: this.generateHistoryId(),
        scheduleId: schedule.id,
        userId: schedule.userId,
        type: schedule.type,
        title: schedule.title,
        message: schedule.message,
        sentAt: Date.now(),
        deliveryStatus: success ? 'sent' : 'failed',
        metadata: schedule.metadata?.customData,
      };

      this.history.push(historyEntry);
      await this.persistHistory();

      schedule.lastSent = Date.now();
      await this.persistSchedule(schedule);

      if (schedule.recurrence !== 'once') {
        this.scheduleNotification(schedule);
      }

      logger.info(`Executed notification: ${schedule.id} (${schedule.type}) for user ${schedule.userId}`);
    } catch (error) {
      logger.error(`Failed to execute notification ${schedule.id}:`, error);
    }
  }

  private cancelScheduledNotification(scheduleId: string) {
    const timer = this.activeTimers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(scheduleId);
      logger.debug(`Cancelled scheduled notification: ${scheduleId}`);
    }
  }

  private scheduleAllActiveNotifications() {
    let scheduledCount = 0;
    for (const schedule of this.schedules.values()) {
      if (schedule.enabled) {
        this.scheduleNotification(schedule);
        scheduledCount++;
      }
    }
    logger.info(`Scheduled ${scheduledCount} active notifications`);
  }

  public async setUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const existing = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...existing, ...preferences };
    
    this.preferences.set(userId, updated);
    await this.persistPreferences();
    
    logger.info(`Updated notification preferences for user: ${userId}`);
  }

  public getUserPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      globalEnabled: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
      typePreferences: {
        'wellness-reminder': { enabled: true, priority: 'medium', frequency: 'normal' },
        'mood-checkin': { enabled: true, priority: 'medium', frequency: 'normal' },
        'therapy-appointment': { enabled: true, priority: 'high', frequency: 'normal' },
        'medication-reminder': { enabled: true, priority: 'high', frequency: 'normal' },
        'crisis-alert': { enabled: true, priority: 'critical', frequency: 'normal' },
        'breathing-exercise': { enabled: true, priority: 'low', frequency: 'normal' },
        'journal-prompt': { enabled: true, priority: 'low', frequency: 'normal' },
        'safety-plan-review': { enabled: true, priority: 'medium', frequency: 'normal' },
        'progress-update': { enabled: true, priority: 'low', frequency: 'normal' },
        'custom': { enabled: true, priority: 'medium', frequency: 'normal' },
      },
      deliveryChannels: {
        push: true,
        email: false,
        sms: false,
      },
      smartTiming: true,
      respectDoNotDisturb: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  public getNotificationHistory(userId: string, limit: number = 50): NotificationHistory[] {
    return this.history
      .filter(entry => entry.userId === userId)
      .slice(-limit)
      .reverse();
  }

  public async markNotificationInteraction(
    historyId: string,
    interactionType: 'opened' | 'dismissed' | 'action_taken',
    metadata?: Record<string, any>
  ): Promise<void> {
    const entry = this.history.find(h => h.id === historyId);
    if (entry) {
      entry.interactionType = interactionType;
      entry.interactionTime = Date.now();
      if (metadata) {
        entry.metadata = { ...entry.metadata, ...metadata };
      }
      await this.persistHistory();
      logger.debug(`Marked notification interaction: ${historyId} - ${interactionType}`);
    }
  }

  private async persistSchedule(schedule: NotificationSchedule): Promise<void> {
    await secureStorage.setItem(`${this.STORAGE_PREFIX}schedule_${schedule.id}`, schedule);
  }

  private async persistPreferences(): Promise<void> {
    const prefsObject = Object.fromEntries(this.preferences.entries());
    await secureStorage.setItem(this.PREFS_STORAGE_KEY, prefsObject);
  }

  private async persistHistory(): Promise<void> {
    await secureStorage.setItem(this.HISTORY_STORAGE_KEY, this.history);
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHistoryId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
    
    logger.info('NotificationSchedulerService destroyed');
  }
}

export const notificationSchedulerService = new NotificationSchedulerService();

export const useNotificationScheduler = (userId: string) => {
  const [schedules, setSchedules] = React.useState<NotificationSchedule[]>([]);
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null);
  const [history, setHistory] = React.useState<NotificationHistory[]>([]);

  React.useEffect(() => {
    if (userId) {
      const userSchedules = notificationSchedulerService.getUserSchedules(userId);
      const userPrefs = notificationSchedulerService.getUserPreferences(userId);
      const userHistory = notificationSchedulerService.getNotificationHistory(userId);
      
      setSchedules(userSchedules);
      setPreferences(userPrefs);
      setHistory(userHistory);
    }
  }, [userId]);

  const createSchedule = React.useCallback(async (schedule: Omit<NotificationSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSchedule = await notificationSchedulerService.createSchedule(schedule);
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  }, []);

  const updateSchedule = React.useCallback(async (scheduleId: string, updates: Partial<NotificationSchedule>) => {
    const updated = await notificationSchedulerService.updateSchedule(scheduleId, updates);
    if (updated) {
      setSchedules(prev => prev.map(s => s.id === scheduleId ? updated : s));
    }
    return updated;
  }, []);

  const deleteSchedule = React.useCallback(async (scheduleId: string) => {
    const success = await notificationSchedulerService.deleteSchedule(scheduleId);
    if (success) {
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    }
    return success;
  }, []);

  const updatePreferences = React.useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    await notificationSchedulerService.setUserPreferences(userId, newPrefs);
    const updated = notificationSchedulerService.getUserPreferences(userId);
    setPreferences(updated);
  }, [userId]);

  return {
    schedules,
    preferences,
    history,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    updatePreferences,
    markInteraction: notificationSchedulerService.markNotificationInteraction.bind(notificationSchedulerService),
  };
};

export default notificationSchedulerService;
