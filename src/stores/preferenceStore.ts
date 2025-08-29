/**
 * Preference Store
 *
 * Zustand store for managing user preferences, settings, and configuration
 * options for the mental health platform. Handles content filters, UI preferences,
 * accessibility settings, and more.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// Types for preferences
export interface ContentFilter {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  category: 'language' | 'violence' | 'substance' | 'adult' | 'custom';
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'default' | 'colorblind-friendly' | 'monochrome';
  animations: boolean;
  soundEffects: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  sidebarCollapsed: boolean;
}

export interface AccessibilityPreferences {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  voiceCommands: boolean;
  alternativeText: boolean;
  captions: boolean;
  focusIndicators: boolean;
  skipLinks: boolean;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  crisis: boolean;
  reminders: boolean;
  social: boolean;
  updates: boolean;
  marketing: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;
  };
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  shareAnalytics: boolean;
  personalizedAds: boolean;
  dataCollection: boolean;
  locationTracking: boolean;
  activityTracking: boolean;
  thirdPartySharing: boolean;
}

export interface ContentPreferences {
  language: string;
  region: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  currency: string;
  units: 'metric' | 'imperial';
  contentMaturity: 'all' | 'teen' | 'mature' | 'restricted';
}

// Store state interface
interface PreferenceState {
  // Preferences
  contentFilters: ContentFilter[];
  uiPreferences: UIPreferences;
  accessibilityPreferences: AccessibilityPreferences;
  notificationPreferences: NotificationPreferences;
  privacyPreferences: PrivacyPreferences;
  contentPreferences: ContentPreferences;
  
  // State management
  isLoading: boolean;
  lastSaved: number | null;
  hasUnsavedChanges: boolean;
  
  // Error handling
  error: string | null;
}

// Store actions interface
interface PreferenceActions {
  // Content filters
  addContentFilter: (filter: Omit<ContentFilter, 'id'>) => void;
  updateContentFilter: (id: string, updates: Partial<ContentFilter>) => void;
  deleteContentFilter: (id: string) => void;
  toggleContentFilter: (id: string) => void;
  setContentFilters: (filters: ContentFilter[]) => void;
  
  // UI preferences
  updateUIPreferences: (updates: Partial<UIPreferences>) => void;
  setTheme: (theme: UIPreferences['theme']) => void;
  setFontSize: (fontSize: UIPreferences['fontSize']) => void;
  toggleAnimations: () => void;
  toggleSoundEffects: () => void;
  
  // Accessibility preferences
  updateAccessibilityPreferences: (updates: Partial<AccessibilityPreferences>) => void;
  toggleScreenReader: () => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  
  // Notification preferences
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  toggleNotifications: (type: keyof Omit<NotificationPreferences, 'quietHours'>) => void;
  setQuietHours: (start: string, end: string, enabled?: boolean) => void;
  
  // Privacy preferences
  updatePrivacyPreferences: (updates: Partial<PrivacyPreferences>) => void;
  setProfileVisibility: (visibility: PrivacyPreferences['profileVisibility']) => void;
  togglePrivacySetting: (setting: keyof Omit<PrivacyPreferences, 'profileVisibility'>) => void;
  
  // Content preferences
  updateContentPreferences: (updates: Partial<ContentPreferences>) => void;
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  
  // Data management
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  resetToDefaults: () => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  markSaved: () => void;
  markUnsaved: () => void;
}

// Default preferences
const DEFAULT_UI_PREFERENCES: UIPreferences = {
  theme: 'auto',
  fontSize: 'medium',
  colorScheme: 'default',
  animations: true,
  soundEffects: true,
  reducedMotion: false,
  compactMode: false,
  sidebarCollapsed: false
};

const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  screenReader: false,
  highContrast: false,
  largeText: false,
  keyboardNavigation: true,
  voiceCommands: false,
  alternativeText: true,
  captions: false,
  focusIndicators: true,
  skipLinks: true
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push: true,
  email: true,
  sms: false,
  inApp: true,
  crisis: true,
  reminders: true,
  social: true,
  updates: false,
  marketing: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  }
};

const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisibility: 'friends',
  showOnlineStatus: true,
  allowDirectMessages: true,
  shareAnalytics: false,
  personalizedAds: false,
  dataCollection: false,
  locationTracking: false,
  activityTracking: false,
  thirdPartySharing: false
};

const DEFAULT_CONTENT_PREFERENCES: ContentPreferences = {
  language: 'en',
  region: 'US',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  units: 'imperial',
  contentMaturity: 'all'
};

const DEFAULT_CONTENT_FILTERS: ContentFilter[] = [
  {
    id: 'profanity',
    name: 'Profanity Filter',
    description: 'Filter out profanity and offensive language',
    keywords: ['profanity', 'offensive', 'inappropriate'],
    severity: 'medium',
    isActive: false,
    category: 'language'
  },
  {
    id: 'violence',
    name: 'Violence Filter',
    description: 'Filter out violent or aggressive content',
    keywords: ['violence', 'aggression', 'harm'],
    severity: 'high',
    isActive: false,
    category: 'violence'
  },
  {
    id: 'substance',
    name: 'Substance Filter',
    description: 'Filter out substance abuse related content',
    keywords: ['drugs', 'alcohol', 'substance'],
    severity: 'medium',
    isActive: false,
    category: 'substance'
  }
];

// Mock API for preferences
const mockPreferenceAPI = {
  async load(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to load from localStorage first
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
    
    return null;
  },
  
  async save(preferences: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }
};

// Create the preference store
export const usePreferenceStore = create<PreferenceState & PreferenceActions>()(
  persist(
    devtools(
      (set, get) => ({
        // Initial state
        contentFilters: DEFAULT_CONTENT_FILTERS,
        uiPreferences: DEFAULT_UI_PREFERENCES,
        accessibilityPreferences: DEFAULT_ACCESSIBILITY_PREFERENCES,
        notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        privacyPreferences: DEFAULT_PRIVACY_PREFERENCES,
        contentPreferences: DEFAULT_CONTENT_PREFERENCES,
        isLoading: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        error: null,

        // Content filter actions
        addContentFilter: (filterData) => {
          const filter: ContentFilter = {
            id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...filterData
          };
          
          set(state => ({
            contentFilters: [...state.contentFilters, filter],
            hasUnsavedChanges: true
          }));
        },

        updateContentFilter: (id, updates) => {
          set(state => ({
            contentFilters: state.contentFilters.map(filter =>
              filter.id === id ? { ...filter, ...updates } : filter
            ),
            hasUnsavedChanges: true
          }));
        },

        deleteContentFilter: (id) => {
          set(state => ({
            contentFilters: state.contentFilters.filter(filter => filter.id !== id),
            hasUnsavedChanges: true
          }));
        },

        toggleContentFilter: (id) => {
          set(state => ({
            contentFilters: state.contentFilters.map(filter =>
              filter.id === id ? { ...filter, isActive: !filter.isActive } : filter
            ),
            hasUnsavedChanges: true
          }));
        },

        setContentFilters: (filters) => {
          set({
            contentFilters: filters,
            hasUnsavedChanges: true
          });
        },

        // UI preference actions
        updateUIPreferences: (updates) => {
          set(state => ({
            uiPreferences: { ...state.uiPreferences, ...updates },
            hasUnsavedChanges: true
          }));
        },

        setTheme: (theme) => {
          get().updateUIPreferences({ theme });
          
          // Apply theme immediately
          document.documentElement.setAttribute('data-theme', theme);
        },

        setFontSize: (fontSize) => {
          get().updateUIPreferences({ fontSize });
          
          // Apply font size immediately
          document.documentElement.setAttribute('data-font-size', fontSize);
        },

        toggleAnimations: () => {
          const { uiPreferences } = get();
          get().updateUIPreferences({ animations: !uiPreferences.animations });
        },

        toggleSoundEffects: () => {
          const { uiPreferences } = get();
          get().updateUIPreferences({ soundEffects: !uiPreferences.soundEffects });
        },

        // Accessibility preference actions
        updateAccessibilityPreferences: (updates) => {
          set(state => ({
            accessibilityPreferences: { ...state.accessibilityPreferences, ...updates },
            hasUnsavedChanges: true
          }));
        },

        toggleScreenReader: () => {
          const { accessibilityPreferences } = get();
          get().updateAccessibilityPreferences({ 
            screenReader: !accessibilityPreferences.screenReader 
          });
        },

        toggleHighContrast: () => {
          const { accessibilityPreferences } = get();
          get().updateAccessibilityPreferences({ 
            highContrast: !accessibilityPreferences.highContrast 
          });
          
          // Apply high contrast immediately
          document.documentElement.classList.toggle('high-contrast', !accessibilityPreferences.highContrast);
        },

        toggleLargeText: () => {
          const { accessibilityPreferences } = get();
          get().updateAccessibilityPreferences({ 
            largeText: !accessibilityPreferences.largeText 
          });
        },

        // Notification preference actions
        updateNotificationPreferences: (updates) => {
          set(state => ({
            notificationPreferences: { ...state.notificationPreferences, ...updates },
            hasUnsavedChanges: true
          }));
        },

        toggleNotifications: (type) => {
          const { notificationPreferences } = get();
          get().updateNotificationPreferences({ 
            [type]: !notificationPreferences[type] 
          });
        },

        setQuietHours: (start, end, enabled = true) => {
          get().updateNotificationPreferences({
            quietHours: { start, end, enabled }
          });
        },

        // Privacy preference actions
        updatePrivacyPreferences: (updates) => {
          set(state => ({
            privacyPreferences: { ...state.privacyPreferences, ...updates },
            hasUnsavedChanges: true
          }));
        },

        setProfileVisibility: (visibility) => {
          get().updatePrivacyPreferences({ profileVisibility: visibility });
        },

        togglePrivacySetting: (setting) => {
          const { privacyPreferences } = get();
          get().updatePrivacyPreferences({ 
            [setting]: !privacyPreferences[setting] 
          });
        },

        // Content preference actions
        updateContentPreferences: (updates) => {
          set(state => ({
            contentPreferences: { ...state.contentPreferences, ...updates },
            hasUnsavedChanges: true
          }));
        },

        setLanguage: (language) => {
          get().updateContentPreferences({ language });
          
          // Update document language
          document.documentElement.lang = language;
        },

        setTimezone: (timezone) => {
          get().updateContentPreferences({ timezone });
        },

        // Data management actions
        loadPreferences: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const savedPreferences = await mockPreferenceAPI.load();
            
            if (savedPreferences) {
              set({
                ...savedPreferences,
                hasUnsavedChanges: false,
                lastSaved: Date.now()
              });
            }
            
            set({ isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load preferences',
              isLoading: false 
            });
          }
        },

        savePreferences: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const state = get();
            const preferences = {
              contentFilters: state.contentFilters,
              uiPreferences: state.uiPreferences,
              accessibilityPreferences: state.accessibilityPreferences,
              notificationPreferences: state.notificationPreferences,
              privacyPreferences: state.privacyPreferences,
              contentPreferences: state.contentPreferences
            };
            
            await mockPreferenceAPI.save(preferences);
            
            set({ 
              hasUnsavedChanges: false,
              lastSaved: Date.now(),
              isLoading: false
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save preferences',
              isLoading: false 
            });
          }
        },

        resetToDefaults: () => {
          set({
            contentFilters: DEFAULT_CONTENT_FILTERS,
            uiPreferences: DEFAULT_UI_PREFERENCES,
            accessibilityPreferences: DEFAULT_ACCESSIBILITY_PREFERENCES,
            notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
            privacyPreferences: DEFAULT_PRIVACY_PREFERENCES,
            contentPreferences: DEFAULT_CONTENT_PREFERENCES,
            hasUnsavedChanges: true
          });
        },

        exportPreferences: () => {
          const state = get();
          const exportData = {
            contentFilters: state.contentFilters,
            uiPreferences: state.uiPreferences,
            accessibilityPreferences: state.accessibilityPreferences,
            notificationPreferences: state.notificationPreferences,
            privacyPreferences: state.privacyPreferences,
            contentPreferences: state.contentPreferences,
            exportDate: Date.now(),
            version: '1.0'
          };
          
          return JSON.stringify(exportData, null, 2);
        },

        importPreferences: async (data) => {
          try {
            set({ isLoading: true, error: null });
            
            const importedData = JSON.parse(data);
            
            // Validate imported data structure
            if (!importedData.version || !importedData.exportDate) {
              throw new Error('Invalid preference data format');
            }
            
            set({
              contentFilters: importedData.contentFilters || DEFAULT_CONTENT_FILTERS,
              uiPreferences: { ...DEFAULT_UI_PREFERENCES, ...importedData.uiPreferences },
              accessibilityPreferences: { ...DEFAULT_ACCESSIBILITY_PREFERENCES, ...importedData.accessibilityPreferences },
              notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, ...importedData.notificationPreferences },
              privacyPreferences: { ...DEFAULT_PRIVACY_PREFERENCES, ...importedData.privacyPreferences },
              contentPreferences: { ...DEFAULT_CONTENT_PREFERENCES, ...importedData.contentPreferences },
              hasUnsavedChanges: true,
              isLoading: false
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to import preferences',
              isLoading: false 
            });
          }
        },

        // Utility actions
        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        markSaved: () => {
          set({ 
            hasUnsavedChanges: false,
            lastSaved: Date.now()
          });
        },

        markUnsaved: () => {
          set({ hasUnsavedChanges: true });
        }
      }),
      { name: 'preference-store' }
    ),
    {
      name: 'preference-store',
      partialize: (state) => ({
        contentFilters: state.contentFilters,
        uiPreferences: state.uiPreferences,
        accessibilityPreferences: state.accessibilityPreferences,
        notificationPreferences: state.notificationPreferences,
        privacyPreferences: state.privacyPreferences,
        contentPreferences: state.contentPreferences,
        lastSaved: state.lastSaved
      })
    }
  )
);

// Apply initial preferences on store creation
if (typeof window !== 'undefined') {
  const store = usePreferenceStore.getState();
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', store.uiPreferences.theme);
  
  // Apply font size
  document.documentElement.setAttribute('data-font-size', store.uiPreferences.fontSize);
  
  // Apply high contrast
  if (store.accessibilityPreferences.highContrast) {
    document.documentElement.classList.add('high-contrast');
  }
  
  // Apply language
  document.documentElement.lang = store.contentPreferences.language;
}

export default usePreferenceStore;
