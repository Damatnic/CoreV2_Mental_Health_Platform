import React, { useEffect, useState, useCallback } from 'react';
import { BellIcon, CheckIcon, CloseIcon, HeartIcon, SparkleIcon } from './icons.dynamic';
import './WellnessNotifications.css';

interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'support' | 'tip';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

const wellnessMessages = [
  'Time for a mindfulness check-in! How are you feeling?',
  'Remember to take a deep breath and center yourself.',
  'You\'re doing great! Take a moment to appreciate your progress.',
  'Have you connected with someone today? Reach out to a friend!',
  'Time for a stretch break! Your body will thank you.',
  'Remember: It\'s okay to not be okay. Support is here when you need it.',
  'You\'ve been focused! Time for a 5-minute breathing exercise?',
  'Hydration check! When did you last have some water?',
  'You matter. Your feelings are valid. You are enough.',
  'Quick gratitude moment: What\'s one thing you\'re thankful for today?'
];

const WellnessNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved notifications
    const saved = localStorage.getItem('wellnessNotifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));
    }

    // Check preferences
    const prefs = localStorage.getItem('userPreferences');
    if (prefs) {
      const preferences = JSON.parse(prefs);
      if (preferences.wellnessReminders) {
        setupReminders(preferences.reminderFrequency || 4);
      }
    }
  }, []);

  useEffect(() => {
    // Update unread count
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);

    // Save notifications
    localStorage.setItem('wellnessNotifications', JSON.stringify(notifications));
  }, [notifications]);

  const setupReminders = (frequencyHours: number) => {
    // Set up periodic reminders
    const intervalMs = frequencyHours * 60 * 60 * 1000;
    const reminderInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();

      // Check if within quiet hours
      const prefs = localStorage.getItem('userPreferences');
      if (prefs) {
        const preferences = JSON.parse(prefs);
        const quietStart = parseInt(preferences.quietHoursStart?.split(':')[0] || '22');
        const quietEnd = parseInt(preferences.quietHoursEnd?.split(':')[0] || '8');

        if (quietStart > quietEnd) {
          // Quiet hours span midnight
          if (hours >= quietStart || hours < quietEnd) return;
        } else {
          // Normal quiet hours
          if (hours >= quietStart && hours < quietEnd) return;
        }
      }

      // Create reminder notification
      const message = wellnessMessages[Math.floor(Math.random() * wellnessMessages.length)];
      createNotification('reminder', 'Wellness Check-In', message);
    }, intervalMs);

    return () => clearInterval(reminderInterval);
  };

  const createNotification = useCallback((
    type: 'reminder' | 'achievement' | 'support' | 'tip',
    title: string,
    message: string,
    action?: { label: string; handler: () => void }
  ) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      action
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50

    // Show browser notification if permitted
    if (permission === 'granted' && 'Notification' in window) {
      const browserNotif = new Notification(title, {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        requireInteraction: false
      });

      browserNotif.onclick = () => {
        window.focus();
        setShowPanel(true);
        markAsRead(notification.id);
        if (action) action.handler();
      };
    }
  }, [permission]);

  const requestPermission = async () => {
    if ('Notification' in window && permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <SparkleIcon className="notif-type-icon achievement" />;
      case 'support':
        return <HeartIcon className="notif-type-icon support" />;
      case 'tip':
        return <CheckIcon className="notif-type-icon tip" />;
      default:
        return <BellIcon className="notif-type-icon reminder" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Simulate some achievements for demo
  useEffect(() => {
    const checkAchievements = () => {
      const wellnessHistory = localStorage.getItem('wellnessHistory');
      if (wellnessHistory) {
        const history = JSON.parse(wellnessHistory);

        // Check for streaks
        if (history.length >= 3 && !localStorage.getItem('achievement_streak3')) {
          createNotification('achievement', '3-Day Streak!', 'You have been consistent with your wellness check-ins!');
          localStorage.setItem('achievement_streak3', 'true');
        }

        if (history.length >= 7 && !localStorage.getItem('achievement_streak7')) {
          createNotification('achievement', 'Week Warrior!', 'A full week of wellness tracking! Amazing!');
          localStorage.setItem('achievement_streak7', 'true');
        }
      }
    };

    checkAchievements();
  }, [createNotification]);

  return (
    <>
      <button 
        className={`notifications-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setShowPanel(!showPanel)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <>
          <div className="notifications-overlay" onClick={() => setShowPanel(false)} />
          <div className="notifications-panel">
            <div className="notifications-header">
              <h3>
                <BellIcon />
                Notifications
              </h3>
              <div className="header-actions">
                {unreadCount > 0 && (
                  <button className="mark-all-read" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
                <button className="close-panel" onClick={() => setShowPanel(false)}>
                  <CloseIcon />
                </button>
              </div>
            </div>

            {permission === 'default' && (
              <div className="permission-request">
                <p>Enable notifications to receive wellness reminders</p>
                <button onClick={requestPermission}>Enable Notifications</button>
              </div>
            )}

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <BellIcon className="empty-icon" />
                  <p>No notifications yet</p>
                  <span>Wellness reminders will appear here</span>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="notif-icon">
                      {getIcon(notif.type)}
                    </div>
                    <div className="notif-content">
                      <div className="notif-header">
                        <h4>{notif.title}</h4>
                        <span className="notif-time">{formatTime(notif.timestamp)}</span>
                      </div>
                      <p className="notif-message">{notif.message}</p>
                      {notif.action && (
                        <button 
                          className="notif-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            notif.action!.handler();
                          }}
                        >
                          {notif.action.label}
                        </button>
                      )}
                    </div>
                    <button 
                      className="delete-notif"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notifications-footer">
                <button className="clear-all" onClick={clearAll}>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default WellnessNotifications;