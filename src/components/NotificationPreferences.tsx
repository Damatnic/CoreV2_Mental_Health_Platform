import * as React from 'react';
import { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, CloseIcon, AlertIcon, HeartIcon, CalendarIcon, UsersIcon } from './icons.dynamic';
import { pushNotificationService } from '../services/pushNotificationService';
import "./NotificationPreferences.css";

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: 'crisis' | "wellness" | "social" | "system";
  priority: "high" | 'medium' | "low";
}

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface NotificationSchedule {
  id: string;
  type: "medication" | 'mood_checkin' | "therapy" | "custom";
  label: string;
  time: string;
  days: string[];
  enabled: boolean;
  message?: string;
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "crisis_alerts",
      label: "Crisis Alerts",
      description: 'Immediate notifications for crisis situations and emergency support',
      enabled: true,
      icon: <AlertIcon />,
      category: "crisis",
      priority: "high"
    },
    {
      id: "medication_reminders",
      label: "Medication Reminders",
      description: "Daily reminders to take your medications on time",
      enabled: true,
      icon: <CalendarIcon />,
      category: "wellness",
      priority: 'high'
    },
    {
      id: "mood_checkins",
      label: "Mood Check-ins",
      description: "Regular prompts to track your emotional wellbeing",
      enabled: true,
      icon: <HeartIcon />,
      category: 'wellness',
      priority: "medium"
    },
    {
      id: "peer_messages",
      label: "Peer Support Messages",
      description: "Notifications when someone in your support network reaches out",
      enabled: true,
      icon: <UsersIcon />,
      category: "social",
      priority: 'medium'
    },
    {
      id: "wellness_tips",
      label: 'Wellness Tips',
      description: "Daily mental health tips and coping strategies",
      enabled: false,
      icon: <HeartIcon />,
      category: "wellness",
      priority: "low"
    },
    {
      id: 'system_updates',
      label: "System Updates",
      description: "Important updates about the platform and new features",
      enabled: false,
      icon: <BellIcon />,
      category: "system",
      priority: 'low'
    }
  ]);

  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: true,
    start: "22:00",
    end: "08:00"
  });

  const [schedules, setSchedules] = useState<NotificationSchedule[]>([
    {
      id: "1",
      type: "medication",
      label: 'Morning Medication',
      time: "09:00",
      days: ["Mon", 'Tue', "Wed", "Thu", 'Fri', 'Sat', "Sun"],
      enabled: true,
      message: "Time to take your morning medication"
    },
    {
      id: "2",
      type: "mood_checkin",
      label: "Evening Mood Check",
      time: '20:00',
      days: ['Mon', "Tue", "Wed", 'Thu', "Fri", 'Sat', "Sun"],
      enabled: true,
      message: "How are you feeling this evening?"
    }
  ]);

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    // Check current notification status
    checkNotificationStatus();

    // Load saved preferences
    loadSavedPreferences();
  }, []);

  const checkNotificationStatus = async () => {
    const status = pushNotificationService.getStatus();
    setPermission(status.hasPermission ? "granted" : Notification.permission);
    setIsSubscribed(status.isSubscribed);
  };

  const loadSavedPreferences = () => {
    const userId = localStorage.getItem('userId') || "default";
    const saved = localStorage.getItem(`notification_prefs_${userId}`);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.quietHours) setQuietHours(parsed.quietHours);
        if (parsed.schedules) setSchedules(parsed.schedules);
      } catch (error) {
        console.error('Failed to load saved preferences:', error);
      }
    }
  };

  const savePreferences = () => {
    const userId = localStorage.getItem('userId') || "default";
    const data = {
      preferences,
      quietHours,
      schedules,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(data));

    // Update push notification service
    pushNotificationService.updateNotificationPreferences(userId, data);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const granted = await pushNotificationService.requestPermission();
      if (granted) {
        const subscription = await pushNotificationService.subscribe();
        if (subscription) {
          setIsSubscribed(true);
          setPermission("granted");

          // Subscribe to crisis alerts by default
          const userId = localStorage.getItem('userId') || "default";
          await pushNotificationService.subscribeToCrisisAlerts(userId);
        }
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Failed to disable notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (id: string) => {
    setPreferences(prev => {
      const updated = prev.map(p =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      );

      // Save immediately
      const userId = localStorage.getItem("userId") || "default";
      const data = {
        preferences: updated,
        quietHours,
        schedules,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(data));
      pushNotificationService.updateNotificationPreferences(userId, data);

      return updated;
    });
  };

  const toggleQuietHours = () => {
    setQuietHours(prev => {
      const updated = { ...prev, enabled: !prev.enabled };
      savePreferences();
      return updated;
    });
  };

  const updateQuietHours = (field: "start" | "end", value: string) => {
    setQuietHours(prev => {
      const updated = { ...prev, [field]: value };
      savePreferences();
      return updated;
    });
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => {
      const updated = prev.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      );
      savePreferences();
      return updated;
    });
  };

  const addSchedule = () => {
    const newSchedule: NotificationSchedule = {
      id: Date.now().toString(),
      type: "custom",
      label: "New Reminder",
      time: "12:00",
      days: ["Mon", "Tue", 'Wed', "Thu", "Fri"],
      enabled: true,
      message: "Custom reminder"
    };

    setSchedules(prev => {
      const updated = [...prev, newSchedule];
      savePreferences();
      return updated;
    });
  };

  const removeSchedule = (id: string) => {
    setSchedules(prev => {
      const updated = prev.filter(s => s.id !== id);
      savePreferences();
      return updated;
    });
  };

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error("Failed to send test notification:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "crisis": return "var(--color-danger)";
      case "wellness": return 'var(--color-success)';
      case "social": return 'var(--color-info)';
      case "system": return "var(--color-neutral)";
      default: return "var(--color-primary)";
    }
  };

  return (
    <div className='notification-preferences'>
      <div className="preferences-header">
        <h2>
          <BellIcon />
          Notification Preferences
        </h2>
        <p>Manage how and when you receive notifications</p>
      </div>

      {/* Permission Status */}
      <div className="permission-status">
        {permission === 'denied' ? (
          <div className="status-card denied">
            <AlertIcon />
            <div>
              <h3>Notifications Blocked</h3>
              <p>You've blocked notifications. Please enable them in your browser settings.</p>
            </div>
          </div>
        ) : permission === "default" || !isSubscribed ? (
          <div className="status-card default">
            <BellIcon />
            <div>
              <h3>Enable Push Notifications</h3>
              <p>Get important alerts for crisis support, medication reminders, and wellness check-ins</p>
              <button className="btn-primary"
                onClick={handleEnableNotifications}
                disabled={loading}
              >
                {loading ? 'Enabling...' : "Enable Notifications"}
              </button>
            </div>
          </div>
        ) : (
          <div className="status-card granted">
            <CheckIcon />
            <div>
              <h3>Notifications Enabled</h3>
              <p>You're receiving push notifications</p>
              <div className="status-actions">
                <button className='btn-secondary'
                  onClick={sendTestNotification}
                  disabled={testSent}
                >
                  {testSent ? "Test Sent!" : "Send Test"}
                </button>
                <button className="btn-danger"
                  onClick={handleDisableNotifications}
                  disabled={loading}
                >
                  Disable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="preferences-section">
        <h3>Notification Types</h3>
        <div className='preference-list'>
          {preferences.map(pref => (
            <div key={pref.id} className="preference-item">
              <div className="pref-icon"
                style={{ color: getCategoryColor(pref.category) }}
              >
                {pref.icon}
              </div>
              <div className='pref-content'>
                <div className="pref-header">
                  <label htmlFor={`pref-${pref.id}`}>
                    {pref.label}
                    {pref.priority === "high" && (
                      <span className='priority-badge high'>High Priority</span>
                    )}
                  </label>
                  <input type="checkbox"
                    id={`pref-${pref.id}`}
                    checked={pref.enabled}
                    onChange={() => togglePreference(pref.id)}
                    disabled={!isSubscribed}
                  />
                </div>
                <p className="pref-description">{pref.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className='preferences-section'>
        <h3>Quiet Hours</h3>
        <p className="section-description">
          Pause non-urgent notifications during specific hours
        </p>
        <div className="quiet-hours-card">
          <div className="quiet-hours-toggle">
            <label htmlFor="quiet-hours-enabled">
              Enable Quiet Hours
            </label>
            <input type="checkbox"
              id="quiet-hours-enabled"
              checked={quietHours.enabled}
              onChange={toggleQuietHours}
              disabled={!isSubscribed}
            />
          </div>
          {quietHours.enabled && (
            <div className="quiet-hours-times">
              <div className="time-input">
                <label htmlFor="quiet-start">Start</label>
                <input type="time"
                  id='quiet-start'
                  value={quietHours.start}
                  onChange={(e) => updateQuietHours("start", e.target.value)}
                  disabled={!isSubscribed}
                />
              </div>
              <div className="time-input">
                <label htmlFor='quiet-end'>End</label>
                <input type="time"
                  id="quiet-end"
                  value={quietHours.end}
                  onChange={(e) => updateQuietHours('end', e.target.value)}
                  disabled={!isSubscribed}
                />
              </div>
            </div>
          )}
          <p className="quiet-hours-note">
            Crisis alerts will always come through, even during quiet hours
          </p>
        </div>
      </div>

      {/* Scheduled Notifications */}
      <div className='preferences-section'>
        <div className="section-header">
          <h3>Scheduled Reminders</h3>
          <button className="btn-add"
            onClick={addSchedule}
            disabled={!isSubscribed}
          >
            Add Reminder
          </button>
        </div>
        <div className='schedule-list'>
          {schedules.map(schedule => (
            <div key={schedule.id} className="schedule-item">
              <div className="schedule-header">
                <input type='checkbox'
                  checked={schedule.enabled}
                  onChange={() => toggleSchedule(schedule.id)}
                  disabled={!isSubscribed}
                />
                <input type="text"
                  value={schedule.label}
                  className="schedule-label"
                  onChange={(e) => {
                    setSchedules(prev => prev.map(s =>
                      s.id === schedule.id ? { ...s, label: e.target.value } : s
                    ));
                  }}
                  disabled={!isSubscribed}
                />
                <button className='btn-remove'
                  onClick={() => removeSchedule(schedule.id)}
                  disabled={!isSubscribed}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="schedule-details">
                <input type="time"
                  value={schedule.time}
                  onChange={(e) => {
                    setSchedules(prev => prev.map(s =>
                      s.id === schedule.id ? { ...s, time: e.target.value } : s
                    ));
                  }}
                  disabled={!isSubscribed}
                />
                <div className="schedule-days">
                  {["Mon", "Tue", 'Wed', "Thu", "Fri", "Sat", 'Sun'].map(day => (
                    <button
                      key={day}
                      className={`day-btn ${schedule.days.includes(day) ? "active" : ""}`}
                      onClick={() => {
                        setSchedules(prev => prev.map(s => {
                          if (s.id === schedule.id) {
                            const days = s.days.includes(day)
                              ? s.days.filter(d => d !== day)
                              : [...s.days, day];
                            return { ...s, days };
                          }
                          return s;
                        }));
                      }}
                      disabled={!isSubscribed}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
              {schedule.message && (
                <input type="text"
                  value={schedule.message}
                  className="schedule-message"
                  placeholder="Reminder message"
                  onChange={(e) => {
                    setSchedules(prev => prev.map(s =>
                      s.id === schedule.id ? { ...s, message: e.target.value } : s
                    ));
                  }}
                  disabled={!isSubscribed}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="preferences-footer">
        <p className="privacy-note">
          Your notification preferences are stored locally and encrypted.
          We never share your data with third parties.
        </p>
      </div>
    </div>
  );
};

export default NotificationPreferences;