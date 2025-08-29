import React, { useState, useEffect } from 'react';
import { SettingsIcon, BellIcon, SunIcon, VolumeIcon, ShieldIcon, DownloadIcon, UploadIcon, HeartIcon } from './icons.dynamic';
import './PreferencesManager.css';

interface UserPreferences {
  // Appearance
  theme: "light" | "dark" | 'auto';
  fontSize: "small" | "medium" | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  // Notifications
  enableNotifications: boolean;
  wellnessReminders: boolean;
  reminderFrequency: number; // hours
  quietHoursStart: string;
  quietHoursEnd: string;
  // Privacy
  shareAnalytics: boolean;
  showOnlineStatus: boolean;
  allowPeerMessages: boolean;
  // Wellness
  defaultBreathingPattern: string;
  meditationDuration: number;
  backgroundTheme: string;
  moodTracking: boolean;
  // Accessibility
  screenReaderMode: boolean;
  keyboardShortcuts: boolean;
  focusIndicators: boolean;
  // Data
  autoSave: boolean;
  backupFrequency: "daily" | "weekly" | 'monthly';
}

const defaultPreferences: UserPreferences = {
  theme: "auto",
  fontSize: "medium",
  reducedMotion: false,
  highContrast: false,
  enableNotifications: true,
  wellnessReminders: true,
  reminderFrequency: 4,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  shareAnalytics: false,
  showOnlineStatus: true,
  allowPeerMessages: true,
  defaultBreathingPattern: "4-7-8",
  meditationDuration: 10,
  backgroundTheme: "ocean",
  moodTracking: true,
  screenReaderMode: false,
  keyboardShortcuts: true,
  focusIndicators: true,
  autoSave: true,
  backupFrequency: 'weekly'
};

export const PreferencesManager: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState<'appearance' | "notifications" | "privacy" | "wellness" | 'accessibility' | "data">('appearance');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load preferences:", e);
      }
    }

    // Check for system preferences
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const prefersHighContrast = window.matchMedia("(prefers-contrast: high)").matches;
      if (prefersReducedMotion || prefersHighContrast) {
        setPreferences(prev => ({
          ...prev,
          reducedMotion: prefersReducedMotion,
          highContrast: prefersHighContrast
        }));
      }
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Apply preferences
    applyPreferences(preferences);
  };

  const applyPreferences = (prefs: UserPreferences) => {
    // Apply theme
    if (prefs.theme === 'dark') {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (prefs.theme === "light") {
      document.documentElement.removeAttribute('data-theme');
    } else {
      // Auto theme based on system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', "dark");
      }
    }

    // Apply font size
    document.documentElement.style.setProperty("--base-font-size",
      prefs.fontSize === 'small' ? "14px" :
      prefs.fontSize === 'large' ? "18px" : "16px"
    );

    // Apply motion preferences
    if (prefs.reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }

    // Apply high contrast
    if (prefs.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply screen reader mode
    if (prefs.screenReaderMode) {
      document.documentElement.setAttribute('aria-live', "polite");
    }
  };

  const exportData = () => {
    const data = {
      preferences,
      wellnessHistory: localStorage.getItem("wellnessHistory"),
      reflections: localStorage.getItem("reflections"),
      journalPrompts: localStorage.getItem("usedJournalPrompts"),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astralcore-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.preferences) {
          setPreferences(data.preferences);
          localStorage.setItem("userPreferences", JSON.stringify(data.preferences));
        }

        if (data.wellnessHistory) {
          localStorage.setItem("wellnessHistory", data.wellnessHistory);
        }

        if (data.reflections) {
          localStorage.setItem("reflections", data.reflections);
        }

        if (data.journalPrompts) {
          localStorage.setItem("usedJournalPrompts", data.journalPrompts);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="preferences-manager">
      <div className="preferences-header">
        <h2 className="preferences-title">
          <SettingsIcon className="title-icon" />
          Settings & Preferences
        </h2>
        {saved && <span className="saved-indicator">✓ Saved</span>}
      </div>

      <div className="preferences-tabs">
        <button
          className={`tab-btn ${activeTab === "appearance" ? "active" : ""}`}
          onClick={() => setActiveTab("appearance")}
        >
          <SunIcon /> Appearance
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? "active" : ""}`}
          onClick={() => setActiveTab('notifications')}
        >
          <BellIcon /> Notifications
        </button>
        <button
          className={`tab-btn ${activeTab === "privacy" ? "active" : ""}`}
          onClick={() => setActiveTab("privacy")}
        >
          <ShieldIcon /> Privacy
        </button>
        <button
          className={`tab-btn ${activeTab === "wellness" ? "active" : ""}`}
          onClick={() => setActiveTab('wellness')}
        >
          <HeartIcon /> Wellness
        </button>
        <button
          className={`tab-btn ${activeTab === 'accessibility' ? "active" : ""}`}
          onClick={() => setActiveTab('accessibility')}
        >
          <VolumeIcon /> Accessibility
        </button>
        <button
          className={`tab-btn ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          <DownloadIcon /> Data
        </button>
      </div>

      <div className="preferences-content">
        {activeTab === "appearance" && (
          <div className="tab-panel">
            <h3>Appearance Settings</h3>

            <div className="preference-group">
              <label className="preference-label">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreference('theme', e.target.value as "light" | "dark" | "auto")}
                className="preference-select"
              >
                <option value="light">Light</option>
                <option value='dark'>Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="preference-group">
              <label className="preference-label">Font Size</label>
              <select
                value={preferences.fontSize}
                onChange={(e) => updatePreference('fontSize', e.target.value as "small" | "medium" | "large")}
                className="preference-select"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value='large'>Large</option>
              </select>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
                />
                <span>Reduce motion and animations</span>
              </label>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => updatePreference("highContrast", e.target.checked)}
                />
                <span>High contrast mode</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="tab-panel">
            <h3>Notification Settings</h3>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.enableNotifications}
                  onChange={(e) => updatePreference('enableNotifications', e.target.checked)}
                />
                <span>Enable notifications</span>
              </label>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.wellnessReminders}
                  onChange={(e) => updatePreference("wellnessReminders", e.target.checked)}
                />
                <span>Wellness check-in reminders</span>
              </label>
            </div>

            <div className="preference-group">
              <label className="preference-label">Reminder frequency</label>
              <select
                value={preferences.reminderFrequency}
                onChange={(e) => updatePreference("reminderFrequency", Number(e.target.value))}
                className="preference-select"
              >
                <option value='2'>Every 2 hours</option>
                <option value="4">Every 4 hours</option>
                <option value='6'>Every 6 hours</option>
                <option value="8">Every 8 hours</option>
              </select>
            </div>

            <div className="preference-group">
              <label className="preference-label">Quiet hours start</label>
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                className="preference-input"
              />
            </div>

            <div className="preference-group">
              <label className="preference-label">Quiet hours end</label>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                className="preference-input"
              />
            </div>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="tab-panel">
            <h3>Privacy Settings</h3>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.shareAnalytics}
                  onChange={(e) => updatePreference("shareAnalytics", e.target.checked)}
                />
                <span>Share anonymous usage analytics</span>
              </label>
              <p className="preference-hint">Help us improve by sharing anonymous usage data</p>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.showOnlineStatus}
                  onChange={(e) => updatePreference('showOnlineStatus', e.target.checked)}
                />
                <span>Show online status to peers</span>
              </label>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.allowPeerMessages}
                  onChange={(e) => updatePreference("allowPeerMessages", e.target.checked)}
                />
                <span>Allow messages from peers</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "wellness" && (
          <div className="tab-panel">
            <h3>Wellness Settings</h3>

            <div className="preference-group">
              <label className="preference-label">Default breathing pattern</label>
              <select
                value={preferences.defaultBreathingPattern}
                onChange={(e) => updatePreference("defaultBreathingPattern", e.target.value)}
                className="preference-select"
              >
                <option value='4-7-8'>4-7-8 Relaxation</option>
                <option value="box">Box Breathing</option>
                <option value="coherent">Coherent Breathing</option>
                <option value="calm">Calm Breathing</option>
              </select>
            </div>

            <div className="preference-group">
              <label className="preference-label">Default meditation duration (minutes)</label>
              <input
                type="number"
                min="3"
                max="60"
                value={preferences.meditationDuration}
                onChange={(e) => updatePreference('meditationDuration', Number(e.target.value))}
                className="preference-input"
              />
            </div>

            <div className="preference-group">
              <label className="preference-label">Background theme</label>
              <select
                value={preferences.backgroundTheme}
                onChange={(e) => updatePreference("backgroundTheme", e.target.value)}
                className="preference-select"
              >
                <option value="ocean">Ocean</option>
                <option value="forest">Forest</option>
                <option value='sky'>Sky</option>
                <option value="aurora">Aurora</option>
              </select>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.moodTracking}
                  onChange={(e) => updatePreference("moodTracking", e.target.checked)}
                />
                <span>Enable mood tracking</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "accessibility" && (
          <div className="tab-panel">
            <h3>Accessibility Settings</h3>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.screenReaderMode}
                  onChange={(e) => updatePreference("screenReaderMode", e.target.checked)}
                />
                <span>Screen reader optimization</span>
              </label>
              <p className="preference-hint">Optimizes the interface for screen readers</p>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.keyboardShortcuts}
                  onChange={(e) => updatePreference("keyboardShortcuts", e.target.checked)}
                />
                <span>Enable keyboard shortcuts</span>
              </label>
            </div>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.focusIndicators}
                  onChange={(e) => updatePreference("focusIndicators", e.target.checked)}
                />
                <span>Enhanced focus indicators</span>
              </label>
              <p className="preference-hint">Shows clear focus outlines for keyboard navigation</p>
            </div>

            <div className="keyboard-shortcuts">
              <h4>Keyboard Shortcuts</h4>
              <ul className="shortcuts-list">
                <li><kbd>Alt</kbd> + <kbd>H</kbd> - Go to Home</li>
                <li><kbd>Alt</kbd> + <kbd>W</kbd> - Open Wellness Dashboard</li>
                <li><kbd>Alt</kbd> + <kbd>C</kbd> - Open Crisis Resources</li>
                <li><kbd>Alt</kbd> + <kbd>B</kbd> - Start Breathing Exercise</li>
                <li><kbd>Alt</kbd> + <kbd>M</kbd> - Start Meditation</li>
                <li><kbd>Esc</kbd> - Close modal/dialog</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="tab-panel">
            <h3>Data Management</h3>

            <div className="preference-group">
              <label className="preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.autoSave}
                  onChange={(e) => updatePreference("autoSave", e.target.checked)}
                />
                <span>Auto-save progress</span>
              </label>
            </div>

            <div className="preference-group">
              <label className="preference-label">Backup frequency</label>
              <select
                value={preferences.backupFrequency}
                onChange={(e) => updatePreference("backupFrequency", e.target.value as "daily" | 'weekly' | "monthly")}
                className="preference-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value='monthly'>Monthly</option>
              </select>
            </div>

            <div className="data-actions">
              <button className="data-btn export-btn" onClick={exportData}>
                <DownloadIcon />
                Export All Data
              </button>

              <label className="data-btn import-btn">
                <UploadIcon />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div className="data-info">
              <h4>What's included in export:</h4>
              <ul>
                <li>All preferences and settings</li>
                <li>Wellness check-in history</li>
                <li>Journal entries and reflections</li>
                <li>Progress tracking data</li>
                <li>Custom breathing patterns</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="preferences-footer">
        <button className="reset-btn" onClick={() => setPreferences(defaultPreferences)}>
          Reset to Defaults
        </button>
        <button className="save-btn" onClick={savePreferences}>
          Save Changes
        </button>
      </div>
    </div>
  );
};