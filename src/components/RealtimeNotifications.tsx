import React, { useState, useEffect } from 'react';
import { getRealtimeService } from '../services/realtimeService';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import "./RealtimeNotifications.css";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | "success" | "warning" | "error" | 'crisis';
  urgency: "low" | "normal" | 'high' | "critical";
  timestamp: number;
  read?: boolean;
  actionUrl?: string;
  senderId?: string;
  senderName?: string;
}

interface RealtimeNotificationsProps {
  userId: string;
  position?: "top-right" | "top-left" | "bottom-right" | 'bottom-left';
  maxVisible?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  userId,
  position = "top-right",
  maxVisible = 3,
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const realtimeService = getRealtimeService();

  useEffect(() => {
    // Set user ID for realtime service
    realtimeService.setUserId(userId);

    // Subscribe to notifications
    const unsubscribe = realtimeService.on("notification", (notification: Notification) => {
      handleNewNotification(notification);
    });

    // Subscribe to crisis alerts
    const unsubscribeCrisis = realtimeService.on("crisis-alert", (alert: any) => {
      handleCrisisAlert(alert);
    });

    // Load stored notifications
    loadStoredNotifications();

    // Request notification permission
    requestNotificationPermission();

    return () => {
      unsubscribe();
      unsubscribeCrisis();
    };
  }, [userId]);

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Keep only last 50 notifications
      return updated.slice(0, 50);
    });

    // Auto-hide non-urgent notifications
    if (autoHide && notification.urgency !== "high" && notification.urgency !== "critical") {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, autoHideDelay);
    }

    // Play sound for important notifications
    if (notification.urgency === 'high' || notification.urgency === "critical") {
      playNotificationSound();
    }
  };

  const handleCrisisAlert = (alert: any) => {
    const crisisNotification: Notification = {
      id: `crisis-${alert.alertId}`,
      title: "🚨 Crisis Alert",
      message: alert.message || "Immediate assistance needed",
      type: 'crisis',
      urgency: 'critical',
      timestamp: alert.timestamp,
      actionUrl: `/crisis/respond/${alert.alertId}`
    };

    handleNewNotification(crisisNotification);
  };

  const loadStoredNotifications = () => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (error) {
        console.error('Failed to load stored notifications:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiuBzvLZizEGFWW66+OZURE');
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Could not play notification sound:", e));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    // Update in backend
    try {
      await fetch(`/.netlify/functions/api-realtime/notifications/read/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ""}`
        }
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return '✅';
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "crisis":
        return "🚨";
      default:
        return "ℹ️";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return '#10b981';
      case "warning":
        return "#f59e0b";
      case "error":
        return "#ef4444";
      case "crisis":
        return '#dc2626';
      default:
        return "#3b82f6";
    }
  };

  const visibleNotifications = showAll ? notifications : notifications.slice(0, maxVisible);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="notification-bell-container">
        <button 
          className="notification-bell"
          onClick={() => setShowAll(!showAll)}
          aria-label="Toggle notifications"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notification Container */}
      <div className={`notification-container notification-${position}`}>
        {visibleNotifications.map(notification => (
          <div
            key={notification.id}
            className={`notification-item notification-${notification.type} ${notification.read ? "read" : 'unread'}`}
            style={{
              borderLeftColor: getNotificationColor(notification.type)
            }}
          >
            <div className="notification-header">
              <span className="notification-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <span className="notification-title">{notification.title}</span>
              <button 
                className="notification-close"
                onClick={() => dismissNotification(notification.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>

            <div className="notification-body">
              <p className="notification-message">{notification.message}</p>

              {notification.senderName && (
                <p className="notification-sender">From: {notification.senderName}</p>
              )}

              <div className="notification-footer">
                <span className="notification-time">
                  {formatTimeAgo(new Date(notification.timestamp))}
                </span>

                {!notification.read && (
                  <button 
                    className="notification-mark-read"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                )}

                {notification.actionUrl && (
                  <a
                    href={notification.actionUrl}
                    className="notification-action"
                    onClick={() => markAsRead(notification.id)}
                  >
                    View →
                  </a>
                )}
              </div>
            </div>

            {notification.urgency === "critical" && (
              <div className="notification-urgent-indicator">
                URGENT
              </div>
            )}
          </div>
        ))}

        {notifications.length > maxVisible && !showAll && (
          <button 
            className="notification-show-all"
            onClick={() => setShowAll(true)}
          >
            Show all {notifications.length} notifications
          </button>
        )}

        {showAll && notifications.length > 0 && (
          <div className="notification-actions">
            <button 
              className="notification-clear-all"
              onClick={clearAll}
            >
              Clear all
            </button>
            <button 
              className="notification-collapse"
              onClick={() => setShowAll(false)}
            >
              Collapse
            </button>
          </div>
        )}

        {notifications.length === 0 && (
          <div className="notification-empty">
            <p>No notifications</p>
          </div>
        )}
      </div>
    </>
  );
};

// Mini notification component for inline use
export const NotificationBadge: React.FC<{ userId: string }> = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const realtimeService = getRealtimeService();

  useEffect(() => {
    const unsubscribe = realtimeService.on("notification", () => {
      setUnreadCount(prev => prev + 1);
    });

    return () => unsubscribe();
  }, []);

  if (unreadCount === 0) return null;

  return (
    <div className="notification-badge-inline">
      {unreadCount > 99 ? "99+" : unreadCount}
    </div>
  );
};