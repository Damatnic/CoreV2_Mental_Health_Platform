/**
 * Enhanced Service Worker - Push Notifications Module
 * 
 * Handles all push notification functionality including:
 * - Push event handling
 * - Notification display
 * - Notification click handling
 * - Scheduled notifications
 * - Crisis alerts
 * - Medication reminders
 */

// Import main service worker if needed
if (typeof importScripts === 'function') {
  // This is a service worker context
}

/**
 * Push notification event handler
 */
self.addEventListener('push', async (event) => {
  console.log('[SW-Notifications] Push event received');
  
  if (!event.data) {
    console.log('[SW-Notifications] No data in push event');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[SW-Notifications] Failed to parse push data:', error);
    data = { title: 'New Notification', body: event.data.text() };
  }
  
  console.log('[SW-Notifications] Push data:', data);
  
  // Determine notification options based on type
  const options = await buildNotificationOptions(data);
  
  // Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title || 'CoreV2 Notification', options)
  );
});

/**
 * Build notification options based on notification type
 */
async function buildNotificationOptions(data) {
  const baseOptions = {
    body: data.body || data.message || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    timestamp: data.timestamp || Date.now(),
    data: data,
    vibrate: [200, 100, 200],
    silent: false
  };
  
  // Customize based on notification type
  switch (data.type) {
    case 'crisis_alert':
      return {
        ...baseOptions,
        tag: 'crisis-alert',
        requireInteraction: true,
        urgency: 'high',
        actions: [
          { action: 'crisis-help', title: '🆘 Get Help Now', icon: '/icons/help.png' },
          { action: 'crisis-resources', title: '📚 Resources', icon: '/icons/resources.png' },
          { action: 'crisis-dismiss', title: '✖ Dismiss', icon: '/icons/dismiss.png' }
        ],
        image: '/images/crisis-support.png'
      };
      
    case 'medication':
    case 'medication_reminder':
      return {
        ...baseOptions,
        tag: `medication-${data.medicationId || Date.now()}`,
        requireInteraction: true,
        actions: [
          { action: 'med-taken', title: '✅ Mark as Taken', icon: '/icons/check.png' },
          { action: 'med-snooze', title: '⏰ Snooze 15 min', icon: '/icons/snooze.png' },
          { action: 'med-skip', title: '❌ Skip', icon: '/icons/skip.png' }
        ],
        renotify: true
      };
      
    case 'mood_checkin':
      return {
        ...baseOptions,
        tag: 'mood-checkin',
        actions: [
          { action: 'mood-checkin', title: '📝 Check In Now', icon: '/icons/checkin.png' },
          { action: 'mood-later', title: '⏱ Later', icon: '/icons/later.png' }
        ]
      };
      
    case 'peer_support':
    case 'peer_message':
      return {
        ...baseOptions,
        tag: `peer-${data.peerId || Date.now()}`,
        actions: [
          { action: 'peer-reply', title: '💬 Reply', icon: '/icons/reply.png' },
          { action: 'peer-view', title: '👁 View', icon: '/icons/view.png' }
        ],
        image: data.senderAvatar
      };
      
    case 'therapy_reminder':
      return {
        ...baseOptions,
        tag: 'therapy-reminder',
        requireInteraction: true,
        actions: [
          { action: 'therapy-confirm', title: '✅ Confirm', icon: '/icons/confirm.png' },
          { action: 'therapy-reschedule', title: '📅 Reschedule', icon: '/icons/calendar.png' }
        ]
      };
      
    case 'wellness_tip':
      return {
        ...baseOptions,
        tag: 'wellness-tip',
        actions: [
          { action: 'tip-view', title: '📖 Read More', icon: '/icons/read.png' },
          { action: 'tip-save', title: '⭐ Save', icon: '/icons/save.png' }
        ]
      };
      
    case 'achievement':
      return {
        ...baseOptions,
        tag: 'achievement',
        icon: '/icons/achievement.png',
        badge: '/icons/star.png',
        actions: [
          { action: 'achievement-view', title: '🏆 View', icon: '/icons/trophy.png' },
          { action: 'achievement-share', title: '📤 Share', icon: '/icons/share.png' }
        ],
        image: data.achievementImage
      };
      
    default:
      return {
        ...baseOptions,
        tag: data.tag || 'general',
        actions: [
          { action: 'open', title: 'Open', icon: '/icons/open.png' },
          { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
        ]
      };
  }
}

/**
 * Notification click event handler
 */
self.addEventListener('notificationclick', async (event) => {
  console.log('[SW-Notifications] Notification clicked:', event.action);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // Handle different actions
  event.waitUntil(handleNotificationAction(action, data));
});

/**
 * Handle notification actions
 */
async function handleNotificationAction(action, data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // Find an existing window or open a new one
  let client = clients.find(c => c.visibilityState === 'visible') || clients[0];
  
  switch (action) {
    // Crisis actions
    case 'crisis-help':
      return openOrFocus('/crisis?urgent=true');
    case 'crisis-resources':
      return openOrFocus('/crisis/resources');
    case 'crisis-dismiss':
      // Log dismissal for analytics
      logNotificationAction('crisis_dismissed', data);
      break;
      
    // Medication actions
    case 'med-taken':
      if (client) {
        client.postMessage({
          type: 'MEDICATION_TAKEN',
          medicationId: data.medicationId,
          timestamp: Date.now()
        });
      }
      logNotificationAction('medication_taken', data);
      break;
    case 'med-snooze':
      // Schedule a new notification for 15 minutes later
      scheduleSnoozeNotification(data, 15);
      break;
    case 'med-skip':
      if (client) {
        client.postMessage({
          type: 'MEDICATION_SKIPPED',
          medicationId: data.medicationId,
          timestamp: Date.now()
        });
      }
      logNotificationAction('medication_skipped', data);
      break;
      
    // Mood check-in actions
    case 'mood-checkin':
      return openOrFocus('/wellness/mood?checkin=true');
    case 'mood-later':
      scheduleSnoozeNotification(data, 30);
      break;
      
    // Peer support actions
    case 'peer-reply':
      return openOrFocus(`/chat/${data.peerId}?reply=true`);
    case 'peer-view':
      return openOrFocus(`/chat/${data.peerId}`);
      
    // Therapy actions
    case 'therapy-confirm':
      if (client) {
        client.postMessage({
          type: 'THERAPY_CONFIRMED',
          sessionId: data.sessionId,
          timestamp: Date.now()
        });
      }
      break;
    case 'therapy-reschedule':
      return openOrFocus('/therapy/schedule?reschedule=true');
      
    // Wellness tip actions
    case 'tip-view':
      return openOrFocus(`/wellness/tips/${data.tipId}`);
    case 'tip-save':
      if (client) {
        client.postMessage({
          type: 'SAVE_WELLNESS_TIP',
          tipId: data.tipId
        });
      }
      break;
      
    // Achievement actions
    case 'achievement-view':
      return openOrFocus('/profile/achievements');
    case 'achievement-share':
      return openOrFocus(`/share/achievement/${data.achievementId}`);
      
    // Default actions
    case 'open':
    default:
      const url = data.url || data.link || '/';
      return openOrFocus(url);
  }
}

/**
 * Open or focus a window with the given URL
 */
async function openOrFocus(url) {
  const urlToOpen = new URL(url, self.location.origin).href;
  
  // Get all windows
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  
  // Try to find an existing window
  for (const client of windowClients) {
    const clientUrl = new URL(client.url);
    if (clientUrl.origin === self.location.origin) {
      // Focus existing window and navigate
      await client.focus();
      await client.navigate(urlToOpen);
      return;
    }
  }
  
  // No existing window found, open a new one
  await self.clients.openWindow(urlToOpen);
}

/**
 * Schedule a snooze notification
 */
async function scheduleSnoozeNotification(originalData, delayMinutes) {
  // Store the snooze request in IndexedDB for persistence
  const db = await openIndexedDB();
  const transaction = db.transaction(['snoozedNotifications'], 'readwrite');
  const store = transaction.objectStore('snoozedNotifications');
  
  const snoozeData = {
    ...originalData,
    snoozedAt: Date.now(),
    showAt: Date.now() + (delayMinutes * 60 * 1000),
    originalType: originalData.type,
    type: 'snoozed'
  };
  
  await store.add(snoozeData);
  
  // Set a timeout to show the notification
  setTimeout(async () => {
    const options = await buildNotificationOptions({
      ...snoozeData,
      title: `[Reminder] ${snoozeData.title || 'Snoozed Notification'}`,
      body: snoozeData.body || snoozeData.message
    });
    
    await self.registration.showNotification(
      `[Reminder] ${snoozeData.title || 'Snoozed Notification'}`,
      options
    );
  }, delayMinutes * 60 * 1000);
  
  console.log(`[SW-Notifications] Notification snoozed for ${delayMinutes} minutes`);
}

/**
 * Log notification actions for analytics
 */
async function logNotificationAction(action, data) {
  try {
    // Store in IndexedDB for later sync
    const db = await openIndexedDB();
    const transaction = db.transaction(['notificationAnalytics'], 'readwrite');
    const store = transaction.objectStore('notificationAnalytics');
    
    await store.add({
      action,
      notificationType: data.type,
      timestamp: Date.now(),
      data: data
    });
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      await syncNotificationAnalytics();
    }
  } catch (error) {
    console.error('[SW-Notifications] Failed to log notification action:', error);
  }
}

/**
 * Sync notification analytics to server
 */
async function syncNotificationAnalytics() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['notificationAnalytics'], 'readonly');
    const store = transaction.objectStore('notificationAnalytics');
    const analytics = await store.getAll();
    
    if (analytics.length > 0) {
      await fetch('/.netlify/functions/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notification_analytics',
          data: analytics
        })
      });
      
      // Clear synced analytics
      const clearTransaction = db.transaction(['notificationAnalytics'], 'readwrite');
      await clearTransaction.objectStore('notificationAnalytics').clear();
    }
  } catch (error) {
    console.error('[SW-Notifications] Failed to sync notification analytics:', error);
  }
}

/**
 * Open IndexedDB
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CoreV2Notifications', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('snoozedNotifications')) {
        db.createObjectStore('snoozedNotifications', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
      
      if (!db.objectStoreNames.contains('notificationAnalytics')) {
        db.createObjectStore('notificationAnalytics', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };
  });
}

/**
 * Check for snoozed notifications on service worker activation
 */
self.addEventListener('activate', async (event) => {
  console.log('[SW-Notifications] Checking for snoozed notifications...');
  
  event.waitUntil(checkSnoozedNotifications());
});

/**
 * Check and display any due snoozed notifications
 */
async function checkSnoozedNotifications() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['snoozedNotifications'], 'readwrite');
    const store = transaction.objectStore('snoozedNotifications');
    const notifications = await store.getAll();
    
    const now = Date.now();
    const toShow = [];
    const toKeep = [];
    
    for (const notification of notifications) {
      if (notification.showAt <= now) {
        toShow.push(notification);
      } else {
        toKeep.push(notification);
        // Schedule for later
        setTimeout(async () => {
          const options = await buildNotificationOptions(notification);
          await self.registration.showNotification(
            `[Reminder] ${notification.title}`,
            options
          );
        }, notification.showAt - now);
      }
    }
    
    // Show due notifications
    for (const notification of toShow) {
      const options = await buildNotificationOptions(notification);
      await self.registration.showNotification(
        `[Reminder] ${notification.title}`,
        options
      );
    }
    
    // Clear shown notifications from store
    await store.clear();
    for (const notification of toKeep) {
      await store.add(notification);
    }
  } catch (error) {
    console.error('[SW-Notifications] Failed to check snoozed notifications:', error);
  }
}

console.log('[SW-Notifications] Push notification module loaded');