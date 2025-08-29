/**
 * Enhanced Notification Settings Component
 * 
 * Comprehensive notification management interface with:
 * - Granular notification type preferences
 * - Multi-channel selection (push, email, SMS)
 * - Advanced scheduling with recurring patterns
 * - Quiet hours with crisis override settings
 * - Personalization options
 * - Real-time preview and testing
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  pushNotificationService,
  NotificationPreferences,
  NotificationSchedule,
  NotificationType,
  NotificationChannel,
  SubscriptionStatus
} from '../services/pushNotificationService';

interface NotificationSettingsProps {
  userId?: string;
  onClose?: () => void;
}

interface NotificationTypeConfig {
  type: NotificationType;
  label: string;
  description: string;
  category: 'crisis' | 'health' | 'social' | 'wellness' | 'system';
  icon: string;
  defaultEnabled: boolean;
  canDisable: boolean;
}

const notificationTypes: NotificationTypeConfig[] = [
  {
    type: 'crisis-alert',
    label: 'Crisis Alerts',
    description: 'Immediate notifications for crisis situations and emergency support',
    category: 'crisis',
    icon: '🚨',
    defaultEnabled: true,
    canDisable: false
  },
  {
    type: 'medication-reminder',
    label: 'Medication Reminders',
    description: 'Timely reminders to take your medications',
    category: 'health',
    icon: '💊',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'appointment-reminder',
    label: 'Appointment Reminders',
    description: 'Notifications about upcoming therapy and medical appointments',
    category: 'health',
    icon: '📅',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'mood-check',
    label: 'Mood Check-ins',
    description: 'Regular prompts to track your emotional wellbeing',
    category: 'wellness',
    icon: '😊',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'safety-reminder',
    label: 'Safety Plan Reminders',
    description: 'Reminders to review and update your safety plan',
    category: 'crisis',
    icon: '🛡️',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'helper-match',
    label: 'Helper Matches',
    description: 'Notifications when compatible peer supporters are available',
    category: 'social',
    icon: '🤝',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'message',
    label: 'Messages',
    description: 'Notifications for new messages from peers and supporters',
    category: 'social',
    icon: '💬',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'group-session',
    label: 'Group Sessions',
    description: 'Invitations and reminders for group therapy sessions',
    category: 'social',
    icon: '👥',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'wellness-tip',
    label: 'Wellness Tips',
    description: 'Daily mental health tips and coping strategies',
    category: 'wellness',
    icon: '💡',
    defaultEnabled: false,
    canDisable: true
  },
  {
    type: 'milestone',
    label: 'Milestones',
    description: 'Celebrate your mental health journey achievements',
    category: 'wellness',
    icon: '🏆',
    defaultEnabled: true,
    canDisable: true
  },
  {
    type: 'check-in',
    label: 'Check-in Reminders',
    description: 'Regular reminders to check in with the app',
    category: 'wellness',
    icon: '📝',
    defaultEnabled: false,
    canDisable: true
  },
  {
    type: 'system',
    label: 'System Updates',
    description: 'Important platform updates and maintenance notices',
    category: 'system',
    icon: '⚙️',
    defaultEnabled: false,
    canDisable: true
  }
];

const channelOptions: { value: NotificationChannel; label: string; icon: string }[] = [
  { value: 'push', label: 'Push Notifications', icon: '📱' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'in-app', label: 'In-App Only', icon: '🔔' }
];

const frequencyOptions = [
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'disabled', label: 'Disabled' }
];

const dayOptions = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  userId = localStorage.getItem('userId') || 'default',
  onClose 
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'channels' | 'schedule' | 'quiet' | 'advanced'>('types');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<NotificationSchedule>>({
    type: 'medication-reminder',
    title: '',
    body: '',
    time: '09:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    enabled: true
  });

  // Load preferences and subscription status on mount
  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Initialize service and get status
      const status = await pushNotificationService.initialize();
      setSubscriptionStatus(status);
      
      // Get current preferences
      const prefs = pushNotificationService.getPreferences();
      if (prefs) {
        setPreferences(prefs);
      } else {
        // Create default preferences
        setPreferences(createDefaultPreferences());
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultPreferences = (): NotificationPreferences => {
    return {
      userId,
      enabled: true,
      types: {
        crisisAlert: true,
        safetyReminder: true,
        medicationReminder: true,
        appointmentReminder: true,
        checkIn: false,
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
  };

  const handleEnableNotifications = async () => {
    try {
      setIsLoading(true);
      const status = await pushNotificationService.subscribe();
      setSubscriptionStatus(status);
      
      if (status.isSubscribed && preferences) {
        setPreferences({ ...preferences, enabled: true });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setIsLoading(true);
      const success = await pushNotificationService.unsubscribe();
      
      if (success && preferences) {
        setPreferences({ ...preferences, enabled: false });
        setSubscriptionStatus({
          ...subscriptionStatus!,
          isSubscribed: false,
          subscription: null
        });
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotificationType = (typeKey: keyof NotificationPreferences['types']) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      types: {
        ...preferences.types,
        [typeKey]: !preferences.types[typeKey]
      }
    });
  };

  const toggleChannel = (channel: NotificationChannel) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: !preferences.channels[channel]
      }
    });
  };

  const updateQuietHours = (field: keyof NotificationPreferences['quietHours'], value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        [field]: value
      }
    });
  };

  const updateFrequency = (
    field: keyof NotificationPreferences['frequency'], 
    value: string
  ) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      frequency: {
        ...preferences.frequency,
        [field]: value
      }
    });
  };

  const addSchedule = () => {
    if (!preferences || !newSchedule.title || !newSchedule.body) {
      alert('Please provide a title and message for the scheduled notification');
      return;
    }

    const schedule: NotificationSchedule = {
      id: `schedule-${Date.now()}`,
      type: newSchedule.type as NotificationType,
      title: newSchedule.title,
      body: newSchedule.body,
      time: newSchedule.time || '09:00',
      days: newSchedule.days || [],
      enabled: true
    };

    setPreferences({
      ...preferences,
      schedules: [...preferences.schedules, schedule]
    });

    // Reset form
    setNewSchedule({
      type: 'medication-reminder',
      title: '',
      body: '',
      time: '09:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      enabled: true
    });

    // Schedule the notification
    pushNotificationService.scheduleNotification(schedule);
  };

  const removeSchedule = (scheduleId: string) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      schedules: preferences.schedules.filter(s => s.id !== scheduleId)
    });

    // Cancel the scheduled notification
    pushNotificationService.cancelScheduledNotification(scheduleId);
  };

  const toggleSchedule = (scheduleId: string) => {
    if (!preferences) return;

    const updatedSchedules = preferences.schedules.map(s => 
      s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
    );

    setPreferences({
      ...preferences,
      schedules: updatedSchedules
    });

    const schedule = updatedSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      if (schedule.enabled) {
        pushNotificationService.scheduleNotification(schedule);
      } else {
        pushNotificationService.cancelScheduledNotification(scheduleId);
      }
    }
  };

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendWellnessTip(
        'This is a test notification to verify your settings are working correctly!'
      );
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      await pushNotificationService.updatePreferences(preferences);
      
      // Show success message
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeKey = (type: NotificationType): keyof NotificationPreferences['types'] => {
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
    return typeMap[type];
  };

  if (isLoading) {
    return (
      <div className="notification-settings loading">
        <div className="spinner">Loading notification settings...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="notification-settings error">
        <p>Failed to load notification settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h2>Notification Settings</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        )}
      </div>

      {/* Subscription Status */}
      <div className="subscription-status">
        {!subscriptionStatus?.isSupported ? (
          <div className="status-card unsupported">
            <span className="status-icon">⚠️</span>
            <div className="status-content">
              <h3>Notifications Not Supported</h3>
              <p>Your browser doesn't support push notifications. Try using a modern browser.</p>
            </div>
          </div>
        ) : !subscriptionStatus?.isSubscribed ? (
          <div className="status-card unsubscribed">
            <span className="status-icon">🔔</span>
            <div className="status-content">
              <h3>Enable Push Notifications</h3>
              <p>Get timely reminders for medications, appointments, and wellness check-ins</p>
              <button 
                className="btn-primary"
                onClick={handleEnableNotifications}
                disabled={isLoading}
              >
                Enable Notifications
              </button>
            </div>
          </div>
        ) : (
          <div className="status-card subscribed">
            <span className="status-icon">✅</span>
            <div className="status-content">
              <h3>Notifications Enabled</h3>
              <p>You're all set to receive notifications</p>
              <div className="status-actions">
                <button 
                  className="btn-secondary"
                  onClick={sendTestNotification}
                  disabled={testSent}
                >
                  {testSent ? 'Test Sent!' : 'Send Test'}
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                >
                  Disable All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          Notification Types
        </button>
        <button 
          className={`tab ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          Channels
        </button>
        <button 
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedules
        </button>
        <button 
          className={`tab ${activeTab === 'quiet' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiet')}
        >
          Quiet Hours
        </button>
        <button 
          className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Notification Types Tab */}
        {activeTab === 'types' && (
          <div className="types-section">
            <h3>Choose what you want to be notified about</h3>
            <div className="notification-types">
              {notificationTypes.map(config => {
                const typeKey = getTypeKey(config.type);
                const isEnabled = preferences.types[typeKey];
                
                return (
                  <div key={config.type} className={`type-item category-${config.category}`}>
                    <div className="type-header">
                      <span className="type-icon">{config.icon}</span>
                      <div className="type-info">
                        <label htmlFor={`type-${config.type}`}>
                          {config.label}
                          {!config.canDisable && (
                            <span className="badge critical">Always On</span>
                          )}
                        </label>
                        <p className="type-description">{config.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        id={`type-${config.type}`}
                        checked={isEnabled}
                        onChange={() => toggleNotificationType(typeKey)}
                        disabled={!config.canDisable || !subscriptionStatus?.isSubscribed}
                        className="toggle-switch"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="channels-section">
            <h3>Choose how you want to receive notifications</h3>
            <div className="channel-options">
              {channelOptions.map(option => (
                <div key={option.value} className="channel-item">
                  <span className="channel-icon">{option.icon}</span>
                  <label htmlFor={`channel-${option.value}`}>
                    {option.label}
                    {option.value === 'email' && (
                      <span className="badge coming-soon">Coming Soon</span>
                    )}
                    {option.value === 'sms' && (
                      <span className="badge coming-soon">Coming Soon</span>
                    )}
                  </label>
                  <input
                    type="checkbox"
                    id={`channel-${option.value}`}
                    checked={preferences.channels[option.value]}
                    onChange={() => toggleChannel(option.value)}
                    disabled={
                      !subscriptionStatus?.isSubscribed || 
                      option.value === 'email' || 
                      option.value === 'sms'
                    }
                    className="toggle-switch"
                  />
                </div>
              ))}
            </div>
            <p className="channel-note">
              Crisis alerts will use all available channels for your safety
            </p>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="schedule-section">
            <h3>Schedule Regular Reminders</h3>
            
            {/* Existing Schedules */}
            {preferences.schedules.length > 0 && (
              <div className="existing-schedules">
                <h4>Your Schedules</h4>
                {preferences.schedules.map(schedule => (
                  <div key={schedule.id} className="schedule-item">
                    <div className="schedule-header">
                      <strong>{schedule.title}</strong>
                      <div className="schedule-actions">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={() => toggleSchedule(schedule.id)}
                          className="toggle-switch"
                        />
                        <button 
                          className="btn-remove"
                          onClick={() => removeSchedule(schedule.id)}
                          aria-label="Remove schedule"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="schedule-body">{schedule.body}</p>
                    <div className="schedule-details">
                      <span className="schedule-time">⏰ {schedule.time}</span>
                      <span className="schedule-days">
                        📅 {schedule.days.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Schedule */}
            <div className="add-schedule">
              <h4>Add New Schedule</h4>
              <div className="schedule-form">
                <div className="form-group">
                  <label htmlFor="schedule-type">Type</label>
                  <select
                    id="schedule-type"
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({ 
                      ...newSchedule, 
                      type: e.target.value as NotificationType 
                    })}
                  >
                    {notificationTypes.filter(t => t.canDisable).map(type => (
                      <option key={type.type} value={type.type}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="schedule-title">Title</label>
                  <input
                    type="text"
                    id="schedule-title"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    placeholder="e.g., Morning Medication"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="schedule-body">Message</label>
                  <textarea
                    id="schedule-body"
                    value={newSchedule.body}
                    onChange={(e) => setNewSchedule({ ...newSchedule, body: e.target.value })}
                    placeholder="e.g., Time to take your morning medication"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="schedule-time">Time</label>
                  <input
                    type="time"
                    id="schedule-time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Days</label>
                  <div className="day-selector">
                    {dayOptions.map(day => (
                      <button
                        key={day}
                        className={`day-btn ${newSchedule.days?.includes(day) ? 'active' : ''}`}
                        onClick={() => {
                          const days = newSchedule.days || [];
                          if (days.includes(day)) {
                            setNewSchedule({ 
                              ...newSchedule, 
                              days: days.filter(d => d !== day) 
                            });
                          } else {
                            setNewSchedule({ 
                              ...newSchedule, 
                              days: [...days, day] 
                            });
                          }
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  className="btn-primary"
                  onClick={addSchedule}
                  disabled={!subscriptionStatus?.isSubscribed}
                >
                  Add Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiet Hours Tab */}
        {activeTab === 'quiet' && (
          <div className="quiet-section">
            <h3>Set Your Quiet Hours</h3>
            <p className="section-description">
              Pause non-urgent notifications during specific times
            </p>

            <div className="quiet-settings">
              <div className="setting-item">
                <label htmlFor="quiet-enabled">
                  Enable Quiet Hours
                </label>
                <input
                  type="checkbox"
                  id="quiet-enabled"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                  className="toggle-switch"
                />
              </div>

              {preferences.quietHours.enabled && (
                <>
                  <div className="time-range">
                    <div className="form-group">
                      <label htmlFor="quiet-start">Start Time</label>
                      <input
                        type="time"
                        id="quiet-start"
                        value={preferences.quietHours.start}
                        onChange={(e) => updateQuietHours('start', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quiet-end">End Time</label>
                      <input
                        type="time"
                        id="quiet-end"
                        value={preferences.quietHours.end}
                        onChange={(e) => updateQuietHours('end', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="quiet-crisis">
                      Allow crisis alerts during quiet hours
                      <span className="setting-note">
                        Critical notifications will always come through for your safety
                      </span>
                    </label>
                    <input
                      type="checkbox"
                      id="quiet-crisis"
                      checked={preferences.quietHours.overrideForCrisis}
                      onChange={(e) => updateQuietHours('overrideForCrisis', e.target.checked)}
                      className="toggle-switch"
                    />
                  </div>

                  <div className="setting-item">
                    <label htmlFor="quiet-weekends">
                      Weekends only
                      <span className="setting-note">
                        Apply quiet hours only on Saturday and Sunday
                      </span>
                    </label>
                    <input
                      type="checkbox"
                      id="quiet-weekends"
                      checked={preferences.quietHours.weekendsOnly}
                      onChange={(e) => updateQuietHours('weekendsOnly', e.target.checked)}
                      className="toggle-switch"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="advanced-section">
            <h3>Advanced Settings</h3>

            <div className="advanced-settings">
              <div className="setting-group">
                <h4>Notification Frequency</h4>
                
                <div className="setting-item">
                  <label htmlFor="freq-checkin">Check-in Reminders</label>
                  <select
                    id="freq-checkin"
                    value={preferences.frequency.checkIn}
                    onChange={(e) => updateFrequency('checkIn', e.target.value)}
                  >
                    {frequencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <label htmlFor="freq-mood">Mood Check-ins</label>
                  <select
                    id="freq-mood"
                    value={preferences.frequency.moodCheck}
                    onChange={(e) => updateFrequency('moodCheck', e.target.value)}
                  >
                    {frequencyOptions.filter(o => o.value !== 'hourly').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <label htmlFor="freq-tips">Wellness Tips</label>
                  <select
                    id="freq-tips"
                    value={preferences.frequency.wellnessTips}
                    onChange={(e) => updateFrequency('wellnessTips', e.target.value)}
                  >
                    {frequencyOptions.filter(o => 
                      ['daily', 'weekly', 'disabled'].includes(o.value)
                    ).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <label htmlFor="freq-reminders">Reminder Delivery</label>
                  <select
                    id="freq-reminders"
                    value={preferences.frequency.reminders}
                    onChange={(e) => updateFrequency('reminders', e.target.value)}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="batched">Batched (grouped)</option>
                    <option value="smart">Smart (AI-optimized)</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <h4>Personalization</h4>
                
                <div className="setting-item">
                  <label htmlFor="personalized">
                    Personalized Content
                    <span className="setting-note">
                      Adapt notification content based on your mood and activity
                    </span>
                  </label>
                  <input
                    type="checkbox"
                    id="personalized"
                    checked={preferences.personalizedContent}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      personalizedContent: e.target.checked
                    })}
                    className="toggle-switch"
                  />
                </div>

                <div className="setting-item">
                  <label htmlFor="sound">
                    Notification Sound
                  </label>
                  <input
                    type="checkbox"
                    id="sound"
                    checked={preferences.sound}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      sound: e.target.checked
                    })}
                    className="toggle-switch"
                  />
                </div>

                <div className="setting-item">
                  <label htmlFor="vibration">
                    Vibration
                  </label>
                  <input
                    type="checkbox"
                    id="vibration"
                    checked={preferences.vibration}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      vibration: e.target.checked
                    })}
                    className="toggle-switch"
                  />
                </div>
              </div>

              <div className="setting-group">
                <h4>Analytics</h4>
                <div className="analytics-summary">
                  <p>View your notification engagement metrics</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      const analytics = pushNotificationService.getAnalytics();
                      console.log('Notification Analytics:', analytics);
                      alert(`Notifications sent: ${analytics.sent}\nDelivered: ${analytics.delivered}\nOpened: ${analytics.opened}`);
                    }}
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="settings-footer">
        <button 
          className="btn-primary"
          onClick={savePreferences}
          disabled={isSaving || !subscriptionStatus?.isSubscribed}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        <p className="privacy-note">
          Your notification preferences are encrypted and never shared with third parties
        </p>
      </div>

      <style jsx>{`
        .notification-settings {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: var(--color-surface, #ffffff);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .settings-header h2 {
          margin: 0;
          font-size: 24px;
          color: var(--color-text-primary, #1a1a1a);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--color-text-secondary, #666);
          padding: 4px 8px;
        }

        .subscription-status {
          margin-bottom: 24px;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          background: var(--color-surface-alt, #f5f5f5);
        }

        .status-card.subscribed {
          background: rgba(72, 187, 120, 0.1);
          border: 1px solid rgba(72, 187, 120, 0.3);
        }

        .status-card.unsubscribed {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-card.unsupported {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-icon {
          font-size: 32px;
        }

        .status-content h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }

        .status-content p {
          margin: 0 0 12px 0;
          color: var(--color-text-secondary, #666);
        }

        .status-actions {
          display: flex;
          gap: 8px;
        }

        .settings-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid var(--color-border, #e0e0e0);
          overflow-x: auto;
        }

        .tab {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary, #666);
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tab:hover {
          color: var(--color-primary, #4f46e5);
        }

        .tab.active {
          color: var(--color-primary, #4f46e5);
          border-bottom-color: var(--color-primary, #4f46e5);
        }

        .tab-content {
          min-height: 400px;
        }

        .types-section h3,
        .channels-section h3,
        .schedule-section h3,
        .quiet-section h3,
        .advanced-section h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: var(--color-text-primary, #1a1a1a);
        }

        .notification-types {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .type-item {
          padding: 16px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e0e0e0);
          transition: all 0.2s;
        }

        .type-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .type-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .type-icon {
          font-size: 24px;
        }

        .type-info {
          flex: 1;
        }

        .type-info label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin-bottom: 4px;
          cursor: pointer;
        }

        .type-description {
          margin: 0;
          font-size: 14px;
          color: var(--color-text-secondary, #666);
        }

        .badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .badge.critical {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .badge.coming-soon {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .toggle-switch {
          width: 44px;
          height: 24px;
          cursor: pointer;
        }

        .channel-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .channel-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 8px;
        }

        .channel-icon {
          font-size: 24px;
        }

        .channel-item label {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .channel-note {
          margin-top: 16px;
          padding: 12px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          font-size: 14px;
          color: #2563eb;
        }

        .existing-schedules {
          margin-bottom: 32px;
        }

        .existing-schedules h4,
        .add-schedule h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .schedule-item {
          padding: 16px;
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .schedule-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-remove {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          padding: 4px;
        }

        .schedule-body {
          margin: 0 0 12px 0;
          color: var(--color-text-secondary, #666);
        }

        .schedule-details {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: var(--color-text-secondary, #666);
        }

        .schedule-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 6px;
          font-size: 14px;
        }

        .day-selector {
          display: flex;
          gap: 8px;
        }

        .day-btn {
          padding: 8px 12px;
          background: var(--color-surface-alt, #f5f5f5);
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .day-btn.active {
          background: var(--color-primary, #4f46e5);
          color: white;
          border-color: var(--color-primary, #4f46e5);
        }

        .quiet-settings {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .setting-item label {
          flex: 1;
          font-weight: 500;
        }

        .setting-note {
          display: block;
          margin-top: 4px;
          font-size: 13px;
          font-weight: normal;
          color: var(--color-text-secondary, #666);
        }

        .time-range {
          display: flex;
          gap: 16px;
        }

        .time-range .form-group {
          flex: 1;
        }

        .advanced-settings {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .setting-group {
          padding: 20px;
          background: var(--color-surface-alt, #f5f5f5);
          border-radius: 8px;
        }

        .setting-group h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .setting-group .setting-item {
          margin-bottom: 16px;
        }

        .setting-group select {
          padding: 8px 12px;
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 6px;
          font-size: 14px;
        }

        .analytics-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .analytics-summary p {
          margin: 0;
          color: var(--color-text-secondary, #666);
        }

        .settings-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid var(--color-border, #e0e0e0);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .privacy-note {
          margin: 0;
          font-size: 13px;
          color: var(--color-text-secondary, #666);
          text-align: center;
        }

        .btn-primary,
        .btn-secondary,
        .btn-danger {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--color-primary, #4f46e5);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark, #4338ca);
        }

        .btn-secondary {
          background: var(--color-surface-alt, #f5f5f5);
          color: var(--color-text-primary, #1a1a1a);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-border, #e0e0e0);
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          text-align: center;
          padding: 40px;
          color: var(--color-text-secondary, #666);
        }

        @media (max-width: 640px) {
          .notification-settings {
            padding: 16px;
            border-radius: 0;
          }

          .settings-tabs {
            gap: 4px;
          }

          .tab {
            padding: 10px 12px;
            font-size: 13px;
          }

          .time-range {
            flex-direction: column;
          }

          .day-selector {
            flex-wrap: wrap;
          }

          .status-actions {
            flex-direction: column;
            width: 100%;
          }

          .status-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;