import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    dataCollection: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    contrast: 'normal' | 'high';
    motionReduced: boolean;
  };
  wellness: {
    dailyCheckIn: boolean;
    moodTracking: boolean;
    journalReminders: boolean;
    crisisAlerts: boolean;
  };
}

class PreferenceStore {
  private preferences: UserPreferences;
  private listeners: Set<(preferences: UserPreferences) => void> = new Set();
  private storageKey = 'user-preferences';

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.loadFromStorage();
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      notifications: {
        enabled: true,
        email: false,
        push: true,
        reminders: true
      },
      privacy: {
        analytics: false,
        crashReporting: true,
        dataCollection: false
      },
      accessibility: {
        fontSize: 'medium',
        contrast: 'normal',
        motionReduced: false
      },
      wellness: {
        dailyCheckIn: true,
        moodTracking: true,
        journalReminders: true,
        crisisAlerts: true
      }
    };
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...this.getDefaultPreferences(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load preferences from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save preferences to storage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  getPreferences(): UserPreferences {
    return JSON.parse(JSON.stringify(this.preferences)); // Return deep copy
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    const oldPreferences = this.getPreferences();
    this.preferences = this.mergeDeep(this.preferences, updates);
    this.saveToStorage();
    
    // Only notify if preferences actually changed
    if (JSON.stringify(oldPreferences) !== JSON.stringify(this.preferences)) {
      this.notifyListeners();
    }
  }

  updateNestedPreference<T extends keyof UserPreferences>(
    category: T,
    updates: Partial<UserPreferences[T]>
  ): void {
    this.updatePreferences({
      [category]: { ...this.preferences[category], ...updates }
    } as Partial<UserPreferences>);
  }

  resetPreferences(): void {
    this.preferences = this.getDefaultPreferences();
    this.saveToStorage();
    this.notifyListeners();
  }

  resetCategory<T extends keyof UserPreferences>(category: T): void {
    const defaults = this.getDefaultPreferences();
    this.updatePreferences({
      [category]: defaults[category]
    } as Partial<UserPreferences>);
  }

  subscribe(listener: (preferences: UserPreferences) => void): () => void {
    this.listeners.add(listener);
    
    // Call listener immediately with current preferences
    listener(this.getPreferences());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  importPreferences(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      
      // Validate imported data structure
      if (this.validatePreferences(imported)) {
        this.preferences = { ...this.getDefaultPreferences(), ...imported };
        this.saveToStorage();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  private validatePreferences(data: any): boolean {
    // Basic validation - check if it looks like valid preferences
    return (
      typeof data === 'object' &&
      data !== null &&
      (data.theme === undefined || ['light', 'dark', 'system'].includes(data.theme)) &&
      (data.language === undefined || typeof data.language === 'string')
    );
  }

  private mergeDeep(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Convenience getters
  get theme(): string {
    return this.preferences.theme;
  }

  get language(): string {
    return this.preferences.language;
  }

  get notificationsEnabled(): boolean {
    return this.preferences.notifications.enabled;
  }

  get accessibilityFontSize(): string {
    return this.preferences.accessibility.fontSize;
  }
}

describe('PreferenceStore', () => {
  let store: PreferenceStore;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        })
      },
      writable: true
    });

    store = new PreferenceStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default preferences', () => {
    const prefs = store.getPreferences();
    
    expect(prefs.theme).toBe('system');
    expect(prefs.language).toBe('en');
    expect(prefs.notifications.enabled).toBe(true);
    expect(prefs.accessibility.fontSize).toBe('medium');
  });

  it('should load preferences from localStorage', () => {
    const savedPrefs = {
      theme: 'dark',
      language: 'es',
      notifications: { enabled: false }
    };
    
    mockLocalStorage['user-preferences'] = JSON.stringify(savedPrefs);
    
    const newStore = new PreferenceStore();
    const prefs = newStore.getPreferences();
    
    expect(prefs.theme).toBe('dark');
    expect(prefs.language).toBe('es');
    expect(prefs.notifications.enabled).toBe(false);
  });

  it('should update preferences', () => {
    store.updatePreferences({
      theme: 'dark',
      language: 'fr'
    });
    
    const prefs = store.getPreferences();
    expect(prefs.theme).toBe('dark');
    expect(prefs.language).toBe('fr');
  });

  it('should update nested preferences', () => {
    store.updateNestedPreference('notifications', {
      enabled: false,
      email: true
    });
    
    const prefs = store.getPreferences();
    expect(prefs.notifications.enabled).toBe(false);
    expect(prefs.notifications.email).toBe(true);
    expect(prefs.notifications.push).toBe(true); // Should remain unchanged
  });

  it('should save preferences to localStorage', () => {
    store.updatePreferences({ theme: 'dark' });
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'user-preferences',
      expect.stringContaining('"theme":"dark"')
    );
  });

  it('should notify listeners on preference changes', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    
    store.subscribe(listener1);
    store.subscribe(listener2);
    
    // Clear initial calls
    listener1.mockClear();
    listener2.mockClear();
    
    store.updatePreferences({ theme: 'dark' });
    
    expect(listener1).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark' })
    );
    expect(listener2).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark' })
    );
  });

  it('should not notify listeners if preferences unchanged', () => {
    const listener = jest.fn();
    store.subscribe(listener);
    
    listener.mockClear();
    
    // Update with same values
    const currentPrefs = store.getPreferences();
    store.updatePreferences({ theme: currentPrefs.theme });
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should unsubscribe listeners', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    
    listener.mockClear();
    unsubscribe();
    
    store.updatePreferences({ theme: 'dark' });
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should reset all preferences', () => {
    store.updatePreferences({ theme: 'dark', language: 'fr' });
    
    store.resetPreferences();
    
    const prefs = store.getPreferences();
    expect(prefs.theme).toBe('system');
    expect(prefs.language).toBe('en');
  });

  it('should reset specific category', () => {
    store.updateNestedPreference('notifications', {
      enabled: false,
      email: true,
      push: false
    });
    
    store.resetCategory('notifications');
    
    const prefs = store.getPreferences();
    expect(prefs.notifications.enabled).toBe(true);
    expect(prefs.notifications.email).toBe(false);
    expect(prefs.notifications.push).toBe(true);
  });

  it('should export preferences as JSON', () => {
    store.updatePreferences({ theme: 'dark' });
    
    const exported = store.exportPreferences();
    const parsed = JSON.parse(exported);
    
    expect(parsed.theme).toBe('dark');
  });

  it('should import preferences from JSON', () => {
    const importData = {
      theme: 'dark',
      language: 'de',
      notifications: { enabled: false }
    };
    
    const success = store.importPreferences(JSON.stringify(importData));
    
    expect(success).toBe(true);
    
    const prefs = store.getPreferences();
    expect(prefs.theme).toBe('dark');
    expect(prefs.language).toBe('de');
    expect(prefs.notifications.enabled).toBe(false);
  });

  it('should reject invalid import data', () => {
    const success1 = store.importPreferences('invalid json');
    const success2 = store.importPreferences('null');
    const success3 = store.importPreferences(JSON.stringify({ theme: 'invalid' }));
    
    expect(success1).toBe(false);
    expect(success2).toBe(false);
    expect(success3).toBe(false);
  });

  it('should provide convenience getters', () => {
    store.updatePreferences({
      theme: 'dark',
      language: 'es'
    });
    
    store.updateNestedPreference('notifications', { enabled: false });
    store.updateNestedPreference('accessibility', { fontSize: 'large' });
    
    expect(store.theme).toBe('dark');
    expect(store.language).toBe('es');
    expect(store.notificationsEnabled).toBe(false);
    expect(store.accessibilityFontSize).toBe('large');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    (localStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage full');
    });
    
    expect(() => {
      store.updatePreferences({ theme: 'dark' });
    }).not.toThrow();
  });

  it('should return deep copies of preferences', () => {
    const prefs1 = store.getPreferences();
    const prefs2 = store.getPreferences();
    
    // Modify first copy
    prefs1.notifications.enabled = false;
    
    // Second copy should be unaffected
    expect(prefs2.notifications.enabled).toBe(true);
  });
});
