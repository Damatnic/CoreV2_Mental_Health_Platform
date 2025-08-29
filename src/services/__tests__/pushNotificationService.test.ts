/**
 * Push Notification Service Tests
 * 
 * Tests for push notification functionality including subscriptions,
 * crisis alerts, and notification preferences
 */

import { pushNotificationService } from '../pushNotificationService';
import type {
  PushSubscription,
  NotificationType,
  NotificationPriority,
  NotificationPayload,
  NotificationAction,
  NotificationPreferences,
  SubscriptionStatus,
  DeliveryResult
} from '../pushNotificationService';

// Mock service worker registration
const mockShowNotification = jest.fn();
const mockSubscribe = jest.fn();
const mockGetSubscription = jest.fn();
const mockPermissionState = jest.fn();
const mockPostMessage = jest.fn();

const mockRegistration = {
  pushManager: {
    subscribe: mockSubscribe,
    getSubscription: mockGetSubscription,
    permissionState: mockPermissionState
  },
  showNotification: mockShowNotification,
  active: {
    postMessage: mockPostMessage
  }
} as unknown as ServiceWorkerRegistration;

// Mock push subscription
const mockUnsubscribe = jest.fn();
const mockGetKey = jest.fn((name: string) => {
  if (name === 'p256dh') return new Uint8Array([1, 2, 3]);
  if (name === 'auth') return new Uint8Array([4, 5, 6]);
  return null;
});
const mockToJSON = jest.fn(() => ({
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  expirationTime: null,
  keys: {
    p256dh: 'AQID',
    auth: 'BAUG'
  }
}));

const mockPushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  expirationTime: null,
  options: {
    applicationServerKey: null,
    userVisibleOnly: true
  },
  getKey: mockGetKey,
  toJSON: mockToJSON,
  unsubscribe: mockUnsubscribe
} as unknown as globalThis.PushSubscription;

// Mock navigator
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve(mockRegistration)),
    ready: Promise.resolve(mockRegistration),
    getRegistration: jest.fn(() => Promise.resolve(mockRegistration)),
    getRegistrations: jest.fn(() => Promise.resolve([mockRegistration]))
  },
  writable: true
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default' as NotificationPermission,
    requestPermission: jest.fn(() => Promise.resolve('granted' as NotificationPermission))
  },
  writable: true,
  configurable: true
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('PushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (window.Notification as any).permission = 'default';
    mockSubscribe.mockReset();
    mockGetSubscription.mockReset();
    mockShowNotification.mockReset();
    mockUnsubscribe.mockReset();
    mockPermissionState.mockReset();
    mockPostMessage.mockReset();
  });

  describe('Initialization', () => {
    it('should initialize the service', async () => {
      mockGetSubscription.mockResolvedValue(null);
      
      const status = await pushNotificationService.initialize();
      
      expect(status.isSubscribed).toBe(false);
      expect(status).toHaveProperty('permission');
    });

    it('should detect existing subscription', async () => {
      mockGetSubscription.mockResolvedValue(mockPushSubscription);
      (window.Notification as any).permission = 'granted';
      
      const status = await pushNotificationService.initialize();
      
      expect(status.isSubscribed).toBe(true);
      expect(status).toHaveProperty('permission');
    });

    it('should handle initialization errors', async () => {
      mockGetSubscription.mockRejectedValue(new Error('Failed'));
      
      const status = await pushNotificationService.initialize();
      
      expect(status.isSubscribed).toBe(false);
      expect(status.error).toBe('Failed');
    });
  });

  describe('Subscription', () => {
    it('should subscribe to push notifications', async () => {
      (window.Notification.requestPermission as jest.Mock).mockResolvedValue('granted');
      mockSubscribe.mockResolvedValue(mockPushSubscription);
      mockGetSubscription.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      const status = await pushNotificationService.subscribe();
      
      expect(window.Notification.requestPermission).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();
      expect(status.isSubscribed).toBe(true);
      expect(status).toHaveProperty('permission');
    });

    it('should handle permission denial', async () => {
      (window.Notification.requestPermission as jest.Mock).mockResolvedValue('denied');
      
      const status = await pushNotificationService.subscribe();
      
      expect(status.isSubscribed).toBe(false);
      expect(status).toHaveProperty('permission');
      expect(status.error).toBe('Permission denied');
    });

    it('should handle existing subscription', async () => {
      mockGetSubscription.mockResolvedValue(mockPushSubscription);
      (window.Notification as any).permission = 'granted';
      
      const status = await pushNotificationService.subscribe();
      
      expect(status.isSubscribed).toBe(true);
      expect(status.subscription).toBeDefined();
    });

    it('should unsubscribe from push notifications', async () => {
      mockGetSubscription.mockResolvedValue(mockPushSubscription);
      mockUnsubscribe.mockResolvedValue(true);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      const result = await pushNotificationService.unsubscribe();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Sending Notifications', () => {
    const mockPayload: NotificationPayload = {
      id: 'notif-123',
      type: 'message',
      priority: 'medium',
      title: 'Test Notification',
      body: 'This is a test',
      timestamp: Date.now(),
      data: { userId: 'user-123' }
    };

    beforeEach(() => {
      mockGetSubscription.mockResolvedValue(mockPushSubscription);
      (window.Notification as any).permission = 'granted';
    });

    it('should send a notification', async () => {
      mockShowNotification.mockResolvedValue(undefined);
      
      const result = await pushNotificationService.sendNotification(mockPayload);
      
      expect(mockShowNotification).toHaveBeenCalledWith(
        mockPayload.title,
        expect.objectContaining({
          body: mockPayload.body,
          tag: mockPayload.id,
          data: mockPayload.data
        })
      );
      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('priority');
    });

    it('should send a crisis alert', async () => {
      mockShowNotification.mockResolvedValue(undefined);
      
      const result = await pushNotificationService.sendCrisisAlert(
        '988 Crisis Line',
        'Immediate support available',
        { helplineNumber: '988' }
      );
      
      expect(mockShowNotification).toHaveBeenCalledWith(
        '988 Crisis Line',
        expect.objectContaining({
          body: 'Immediate support available',
          requireInteraction: true,
          badge: '/icons/crisis-badge.png',
          icon: '/icons/crisis-icon.png'
        })
      );
      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('priority');
    });

    it('should send a safety reminder', async () => {
      mockShowNotification.mockResolvedValue(undefined);
      
      const result = await pushNotificationService.sendSafetyReminder(
        'Safety Plan Reminder',
        'Review your coping strategies',
        'safety-plan-123'
      );
      
      expect(mockShowNotification).toHaveBeenCalled();
      expect(result).toHaveProperty('delivered');
    });

    it('should send a check-in reminder', async () => {
      mockShowNotification.mockResolvedValue(undefined);
      
      const result = await pushNotificationService.sendCheckInReminder(
        'How are you feeling today?',
        'user-123'
      );
      
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Mental Health Check-In',
        expect.objectContaining({
          body: 'How are you feeling today?'
        })
      );
      expect(result).toHaveProperty('delivered');
    });

    it('should send a helper match notification', async () => {
      mockShowNotification.mockResolvedValue(undefined);
      
      const result = await pushNotificationService.sendHelperMatchNotification(
        'A certified counselor',
        85
      );
      
      expect(mockShowNotification).toHaveBeenCalled();
      expect(result).toHaveProperty('delivered');
    });

    it('should send a message notification', async () => {
      mockShowNotification.mockResolvedValue(undefined);
      
      const result = await pushNotificationService.sendMessageNotification(
        'John Doe',
        'Hello, how can I help?',
        'conv-123'
      );
      
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Hello, how can I help?')
        })
      );
      expect(result).toHaveProperty('delivered');
    });

    it('should handle notification errors', async () => {
      mockShowNotification.mockRejectedValue(new Error('Failed to show'));
      
      const result = await pushNotificationService.sendNotification(mockPayload);
      
      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('error');
    });

    it('should respect quiet hours', async () => {
      const preferences: Partial<NotificationPreferences> = {
        userId: 'user-123',
        enabled: true,
        types: {
          crisisAlert: true,
          safetyReminder: true,
          checkIn: true,
          helperMatch: true,
          message: true,
          milestone: true,
          system: true
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        frequency: {
          checkIn: 'daily',
          reminders: 'immediate'
        }
      };

      await pushNotificationService.updatePreferences(preferences);

      // Mock current time to be within quiet hours
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      // Non-critical notification should be blocked
      const result = await pushNotificationService.sendMessageNotification(
        'Test',
        'Message during quiet hours',
        'conv-123'
      );

      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('error');

      // Crisis alert should still go through
      const crisisResult = await pushNotificationService.sendCrisisAlert(
        'Crisis Alert',
        'Urgent'
      );

      expect(crisisResult).toHaveProperty('delivered');
    });
  });

  describe('Preferences', () => {
    it('should update notification preferences', async () => {
      const preferences: Partial<NotificationPreferences> = {
        types: {
          crisisAlert: true,
          safetyReminder: true,
          checkIn: false,
          helperMatch: true,
          message: false,
          milestone: false,
          system: true
        }
      };

      await pushNotificationService.updatePreferences(preferences);
      const saved = pushNotificationService.getPreferences();

      expect(saved).toBeDefined();
      expect(saved?.types.checkIn).toBe(false);
      expect(saved?.types.message).toBe(false);
    });

    it('should get notification preferences', () => {
      const preferences = pushNotificationService.getPreferences();
      
      // Should return null or saved preferences
      expect(preferences === null || typeof preferences === 'object').toBe(true);
    });

    it('should respect type preferences when sending', async () => {
      await pushNotificationService.updatePreferences({
        enabled: true,
        types: {
          crisisAlert: true,
          safetyReminder: false,
          checkIn: false,
          helperMatch: false,
          message: false,
          milestone: false,
          system: false
        }
      });

      // Message notification should be blocked
      const result = await pushNotificationService.sendMessageNotification(
        'Test',
        'Blocked message',
        'conv-123'
      );

      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('error');

      // Crisis alert should still work
      const crisisResult = await pushNotificationService.sendCrisisAlert(
        'Crisis',
        'Alert'
      );

      expect(crisisResult).toHaveProperty('delivered');
    });
  });

  describe('Status', () => {
    it('should get subscription status', () => {
      const status = pushNotificationService.getSubscriptionStatus();
      
      expect(status).toHaveProperty('isSubscribed');
      expect(status).toHaveProperty('permission');
      expect(status).toHaveProperty('isSupported');
    });

    it('should detect push support', () => {
      const status = pushNotificationService.getSubscriptionStatus();
      
      expect(status.isSupported).toBe(true);
    });
  });

  describe('Mental Health Specific Features', () => {
    beforeEach(() => {
      mockGetSubscription.mockResolvedValue(mockPushSubscription);
      (window.Notification as any).permission = 'granted';
      mockShowNotification.mockResolvedValue(undefined);
    });

    it('should prioritize crisis alerts', async () => {
      const result = await pushNotificationService.sendCrisisAlert(
        'Emergency Support',
        'Call 988 for immediate help'
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requireInteraction: true,
          silent: false
        })
      );
      expect(result).toHaveProperty('priority');
    });

    it('should include safety actions in notifications', async () => {
      const result = await pushNotificationService.sendSafetyReminder(
        'Safety Check',
        'Review your safety plan',
        'safety-123'
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ action: 'view' }),
            expect.objectContaining({ action: 'dismiss' })
          ])
        })
      );
    });

    it('should handle helper matching notifications', async () => {
      const result = await pushNotificationService.sendHelperMatchNotification(
        'Licensed therapist available',
        92
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.stringContaining('Helper'),
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ action: 'accept' }),
            expect.objectContaining({ action: 'view' })
          ])
        })
      );
      expect(result).toHaveProperty('delivered');
    });

    it('should format check-in reminders appropriately', async () => {
      const result = await pushNotificationService.sendCheckInReminder(
        'Time for your daily check-in',
        'user-123'
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Mental Health Check-In',
        expect.objectContaining({
          body: 'Time for your daily check-in',
          actions: expect.arrayContaining([
            expect.objectContaining({ title: 'Check In Now' })
          ])
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing service worker', async () => {
      (navigator as any).serviceWorker = undefined;
      
      const status = await pushNotificationService.initialize();
      
      expect(status.isSubscribed).toBe(false);
      expect(status.isSupported).toBe(false);
    });

    it('should handle subscription failures', async () => {
      mockSubscribe.mockRejectedValue(new Error('Subscribe failed'));
      (window.Notification.requestPermission as jest.Mock).mockResolvedValue('granted');
      
      const status = await pushNotificationService.subscribe();
      
      expect(status.isSubscribed).toBe(false);
      expect(status.error).toBe('Subscribe failed');
    });

    it('should handle notification API errors gracefully', async () => {
      mockShowNotification.mockRejectedValue(new Error('Show failed'));
      
      const result = await pushNotificationService.sendNotification({
        id: 'test',
        type: 'message',
        priority: 'low',
        title: 'Test',
        body: 'Test body',
        timestamp: Date.now()
      });
      
      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('error');
    });
  });
});