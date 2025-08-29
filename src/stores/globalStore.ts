/**
 * Global Store Manager for Mental Health Platform
 *
 * Central coordination store that integrates all application stores and manages
 * global state, service coordination, and cross-store communication.
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';

// Types for global state management
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'helper' | 'admin' | 'moderator';
  avatar?: string;
  preferences?: Record<string, any>;
  lastLogin?: number;
  createdAt?: number;
  isVerified: boolean;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: Record<string, string>;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'ready' | 'loading' | 'error' | 'disabled';
  lastCheck: number;
  error?: string;
  version?: string;
  dependencies?: string[];
}

export interface AppMetrics {
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    networkLatency: number;
  };
  usage: {
    pageViews: number;
    sessionDuration: number;
    interactions: number;
    errors: number;
  };
  features: {
    mostUsed: string[];
    leastUsed: string[];
    userJourney: string[];
  };
}

export interface CrisisState {
  isActive: boolean;
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  triggeredAt?: number;
  resolvedAt?: number;
  interventions: string[];
  contacts: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    relationship: string;
    priority: number;
  }[];
  resources: {
    id: string;
    name: string;
    type: 'hotline' | 'chat' | 'text' | 'website' | 'app';
    url?: string;
    phone?: string;
    description: string;
    availability: string;
  }[];
}

// Accessibility state interface
export interface AccessibilityState {
  enabled: boolean;
  screenReaderActive: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  keyboardNavigation: boolean;
  voiceControl: boolean;
  focusIndicator: boolean;
  customColors: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  announcements: {
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }[];
}

// Feedback state interface
export interface FeedbackState {
  submissions: {
    id: string;
    type: 'bug' | 'feature' | 'general' | 'crisis' | 'satisfaction';
    message: string;
    rating?: number;
    category?: string;
    anonymous: boolean;
    userId?: string;
    timestamp: number;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    response?: {
      message: string;
      respondedBy: string;
      timestamp: number;
    };
  }[];
  satisfaction: {
    overall: number;
    features: Record<string, number>;
    lastUpdated: number;
  };
  activePrompt?: {
    id: string;
    type: string;
    message: string;
    options?: string[];
  };
}

// Global application state interface
interface GlobalState {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  
  // Service integration state
  services: Record<string, ServiceStatus>;
  servicesReady: boolean;
  criticalServicesReady: boolean;
  serviceErrors: string[];
  
  // App state
  isOnline: boolean;
  isOfflineMode: boolean;
  appReady: boolean;
  appVersion: string;
  buildInfo: {
    version: string;
    buildTime: number;
    gitCommit?: string;
    environment: 'development' | 'staging' | 'production';
  };
  
  // Crisis state
  crisisState: CrisisState;
  
  // Accessibility state
  accessibilityState: AccessibilityState;
  
  // Feedback state
  feedbackState: FeedbackState;
  
  // Performance and metrics
  metrics: AppMetrics;
  
  // UI state
  sidebarOpen: boolean;
  modalStack: string[];
  notifications: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    persistent?: boolean;
  }[];
  
  // Feature flags
  featureFlags: Record<string, boolean>;
  
  // Debug state
  debugMode: boolean;
  debugLogs: {
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    source: string;
    message: string;
    data?: any;
  }[];
}

// Global store actions interface
interface GlobalActions {
  // Authentication actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Service management
  registerService: (name: string, status: Omit<ServiceStatus, 'name' | 'lastCheck'>) => void;
  updateServiceStatus: (name: string, status: Partial<ServiceStatus>) => void;
  checkServiceHealth: (serviceName?: string) => Promise<void>;
  initializeServices: () => Promise<void>;
  
  // App state management
  setOnlineStatus: (isOnline: boolean) => void;
  setOfflineMode: (isOfflineMode: boolean) => void;
  setAppReady: (ready: boolean) => void;
  updateBuildInfo: (buildInfo: Partial<GlobalState['buildInfo']>) => void;
  
  // Crisis management
  activateCrisis: (level: CrisisState['level'], interventions?: string[]) => void;
  updateCrisisLevel: (level: CrisisState['level']) => void;
  resolveCrisis: () => void;
  addCrisisContact: (contact: CrisisState['contacts'][0]) => void;
  removeCrisisContact: (contactId: string) => void;
  
  // Accessibility management
  updateAccessibilitySettings: (settings: Partial<AccessibilityState>) => void;
  toggleAccessibility: (enabled: boolean) => void;
  setScreenReaderActive: (active: boolean) => void;
  setColorBlindMode: (mode: AccessibilityState['colorBlindMode']) => void;
  setFontSize: (size: AccessibilityState['fontSize']) => void;
  addAnnouncement: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
  
  // Feedback management
  submitFeedback: (feedback: Omit<FeedbackState['submissions'][0], 'id' | 'timestamp' | 'status'>) => string;
  updateFeedbackStatus: (id: string, status: FeedbackState['submissions'][0]['status']) => void;
  respondToFeedback: (id: string, response: string, respondedBy: string) => void;
  updateSatisfaction: (overall?: number, feature?: { name: string; rating: number }) => void;
  setActivePrompt: (prompt: FeedbackState['activePrompt']) => void;
  dismissActivePrompt: () => void;
  getFeedbackAnalytics: () => { total: number; pending: number; resolved: number; avgRating: number };
  
  // Performance and metrics
  updateMetrics: (metrics: Partial<AppMetrics>) => void;
  recordPerformance: (metric: keyof AppMetrics['performance'], value: number) => void;
  recordUsage: (metric: keyof AppMetrics['usage'], increment?: number) => void;
  
  // UI state management
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  pushModal: (modalId: string) => void;
  popModal: () => string | undefined;
  clearModals: () => void;
  
  // Notification management
  addNotification: (notification: Omit<GlobalState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Feature flags
  setFeatureFlag: (flag: string, enabled: boolean) => void;
  isFeatureEnabled: (flag: string) => boolean;
  
  // Debug utilities
  setDebugMode: (enabled: boolean) => void;
  addDebugLog: (level: GlobalState['debugLogs'][0]['level'], source: string, message: string, data?: any) => void;
  clearDebugLogs: () => void;
  
  // Store coordination
  resetAllStores: () => void;
  getStoreSnapshot: () => Record<string, any>;
}

// Default crisis resources
const DEFAULT_CRISIS_RESOURCES: CrisisState['resources'] = [
  {
    id: 'suicide-prevention',
    name: 'National Suicide Prevention Lifeline',
    type: 'hotline',
    phone: '988',
    description: '24/7 free and confidential support for people in distress',
    availability: '24/7'
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    type: 'text',
    phone: 'Text HOME to 741741',
    description: 'Free 24/7 support via text message',
    availability: '24/7'
  },
  {
    id: 'samhsa-helpline',
    name: 'SAMHSA National Helpline',
    type: 'hotline',
    phone: '1-800-662-4357',
    description: 'Treatment referral and information service',
    availability: '24/7'
  }
];

// Mock authentication service
const mockAuthService = {
  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@example.com' && password === 'demo123') {
      return {
        id: 'user_1',
        email,
        name: 'Demo User',
        role: 'user',
        isVerified: true,
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        lastLogin: Date.now()
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// Create the global store
export const useGlobalStore = create<GlobalState & GlobalActions>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        authLoading: false,
        authError: null,
        
        services: {},
        servicesReady: false,
        criticalServicesReady: false,
        serviceErrors: [],
        
        isOnline: navigator?.onLine ?? true,
        isOfflineMode: false,
        appReady: false,
        appVersion: '2.0.0',
        buildInfo: {
          version: '2.0.0',
          buildTime: Date.now(),
          environment: 'development'
        },
        
        crisisState: {
          isActive: false,
          level: 'none',
          interventions: [],
          contacts: [],
          resources: DEFAULT_CRISIS_RESOURCES
        },
        
        accessibilityState: {
          enabled: false,
          screenReaderActive: false,
          highContrast: false,
          reducedMotion: false,
          fontSize: 'medium',
          colorBlindMode: 'none',
          keyboardNavigation: true,
          voiceControl: false,
          focusIndicator: true,
          customColors: {},
          announcements: []
        },
        
        feedbackState: {
          submissions: [],
          satisfaction: {
            overall: 0,
            features: {},
            lastUpdated: Date.now()
          }
        },
        
        metrics: {
          performance: {
            loadTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            networkLatency: 0
          },
          usage: {
            pageViews: 0,
            sessionDuration: 0,
            interactions: 0,
            errors: 0
          },
          features: {
            mostUsed: [],
            leastUsed: [],
            userJourney: []
          }
        },
        
        sidebarOpen: false,
        modalStack: [],
        notifications: [],
        
        featureFlags: {
          'new-dashboard': true,
          'enhanced-crisis-detection': true,
          'peer-support-network': true,
          'ai-assistant': false,
          'video-chat': true,
          'offline-mode': true
        },
        
        debugMode: process.env.NODE_ENV === 'development',
        debugLogs: [],

        // Authentication actions
        setUser: (user) => {
          set({ 
            user,
            isAuthenticated: !!user,
            authError: null
          });
        },

        updateUser: (updates) => {
          set(state => ({
            user: state.user ? { ...state.user, ...updates } : null
          }));
        },

        setAuthLoading: (loading) => {
          set({ authLoading: loading });
        },

        setAuthError: (error) => {
          set({ authError: error });
        },

        login: async (email, password) => {
          try {
            set({ authLoading: true, authError: null });
            
            const user = await mockAuthService.login(email, password);
            
            set({ 
              user,
              isAuthenticated: true,
              authLoading: false
            });
            
            // Log successful login
            get().addDebugLog('info', 'auth', 'User logged in successfully', { userId: user.id });
            
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            
            set({ 
              authError: errorMessage,
              authLoading: false
            });
            
            get().addDebugLog('error', 'auth', 'Login failed', { error: errorMessage });
            
            return false;
          }
        },

        logout: async () => {
          try {
            set({ authLoading: true });
            
            await mockAuthService.logout();
            
            set({ 
              user: null,
              isAuthenticated: false,
              authLoading: false,
              authError: null
            });
            
            get().addDebugLog('info', 'auth', 'User logged out successfully');
          } catch (error) {
            set({ authLoading: false });
            
            get().addDebugLog('error', 'auth', 'Logout failed', { error });
          }
        },

        // Service management
        registerService: (name, serviceData) => {
          set(state => ({
            services: {
              ...state.services,
              [name]: {
                ...serviceData,
                name,
                lastCheck: Date.now()
              }
            }
          }));
          
          get().checkServiceHealth();
        },

        updateServiceStatus: (name, statusUpdates) => {
          set(state => ({
            services: {
              ...state.services,
              [name]: {
                ...state.services[name],
                ...statusUpdates,
                lastCheck: Date.now()
              }
            }
          }));
          
          get().checkServiceHealth();
        },

        checkServiceHealth: async (serviceName) => {
          const { services } = get();
          
          if (serviceName) {
            // Check specific service
            const service = services[serviceName];
            if (service) {
              // Mock health check
              await new Promise(resolve => setTimeout(resolve, 100));
              
              get().updateServiceStatus(serviceName, {
                status: 'ready',
                lastCheck: Date.now()
              });
            }
          } else {
            // Check all services
            const serviceNames = Object.keys(services);
            const criticalServices = ['auth', 'crisis-detection', 'storage'];
            
            let readyCount = 0;
            let criticalReadyCount = 0;
            const errors: string[] = [];
            
            for (const name of serviceNames) {
              const service = services[name];
              
              if (service.status === 'ready') {
                readyCount++;
                if (criticalServices.includes(name)) {
                  criticalReadyCount++;
                }
              } else if (service.status === 'error') {
                errors.push(`${name}: ${service.error || 'Unknown error'}`);
              }
            }
            
            set({
              servicesReady: readyCount === serviceNames.length,
              criticalServicesReady: criticalReadyCount === criticalServices.length,
              serviceErrors: errors
            });
          }
        },

        initializeServices: async () => {
          // Register core services
          const coreServices = [
            { name: 'auth', status: 'loading' as const },
            { name: 'crisis-detection', status: 'loading' as const },
            { name: 'storage', status: 'loading' as const },
            { name: 'notifications', status: 'loading' as const },
            { name: 'analytics', status: 'loading' as const }
          ];
          
          for (const service of coreServices) {
            get().registerService(service.name, { status: service.status });
          }
          
          // Simulate service initialization
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          for (const service of coreServices) {
            get().updateServiceStatus(service.name, { status: 'ready' });
          }
          
          set({ appReady: true });
        },

        // App state management
        setOnlineStatus: (isOnline) => {
          set({ isOnline });
          
          if (!isOnline) {
            get().addNotification({
              type: 'warning',
              title: 'Connection Lost',
              message: 'You are now offline. Some features may be limited.',
              persistent: true
            });
          } else {
            get().addNotification({
              type: 'success',
              title: 'Connection Restored',
              message: 'You are back online. All features are available.'
            });
          }
        },

        setOfflineMode: (isOfflineMode) => {
          set({ isOfflineMode });
        },

        setAppReady: (ready) => {
          set({ appReady: ready });
        },

        updateBuildInfo: (buildInfo) => {
          set(state => ({
            buildInfo: { ...state.buildInfo, ...buildInfo }
          }));
        },

        // Crisis management
        activateCrisis: (level, interventions = []) => {
          set({
            crisisState: {
              ...get().crisisState,
              isActive: true,
              level,
              triggeredAt: Date.now(),
              interventions
            }
          });
          
          get().addDebugLog('warn', 'crisis', `Crisis activated at level: ${level}`, { interventions });
        },

        updateCrisisLevel: (level) => {
          set(state => ({
            crisisState: {
              ...state.crisisState,
              level
            }
          }));
        },

        resolveCrisis: () => {
          set(state => ({
            crisisState: {
              ...state.crisisState,
              isActive: false,
              level: 'none',
              resolvedAt: Date.now()
            }
          }));
          
          get().addDebugLog('info', 'crisis', 'Crisis resolved');
        },

        addCrisisContact: (contact) => {
          set(state => ({
            crisisState: {
              ...state.crisisState,
              contacts: [...state.crisisState.contacts, contact]
            }
          }));
        },

        removeCrisisContact: (contactId) => {
          set(state => ({
            crisisState: {
              ...state.crisisState,
              contacts: state.crisisState.contacts.filter(c => c.id !== contactId)
            }
          }));
        },

        // Accessibility management
        updateAccessibilitySettings: (settings) => {
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              ...settings
            }
          }));
          
          // Apply settings to document
          const root = document.documentElement;
          const { accessibilityState } = get();
          
          // Apply high contrast
          root.classList.toggle('high-contrast', accessibilityState.highContrast);
          
          // Apply reduced motion
          root.classList.toggle('reduced-motion', accessibilityState.reducedMotion);
          
          // Apply font size
          root.setAttribute('data-font-size', accessibilityState.fontSize);
          
          // Apply color blind mode
          root.setAttribute('data-color-blind-mode', accessibilityState.colorBlindMode);
          
          get().addDebugLog('info', 'accessibility', 'Accessibility settings updated', settings);
        },

        toggleAccessibility: (enabled) => {
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              enabled
            }
          }));
        },

        setScreenReaderActive: (active) => {
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              screenReaderActive: active
            }
          }));
        },

        setColorBlindMode: (mode) => {
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              colorBlindMode: mode
            }
          }));
          document.documentElement.setAttribute('data-color-blind-mode', mode);
        },

        setFontSize: (size) => {
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              fontSize: size
            }
          }));
          document.documentElement.setAttribute('data-font-size', size);
        },

        addAnnouncement: (message, priority = 'polite') => {
          const announcement = {
            id: `announcement_${Date.now()}`,
            message,
            priority,
            timestamp: Date.now()
          };
          
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              announcements: [announcement, ...state.accessibilityState.announcements.slice(0, 49)]
            }
          }));
        },

        clearAnnouncements: () => {
          set(state => ({
            accessibilityState: {
              ...state.accessibilityState,
              announcements: []
            }
          }));
        },

        // Feedback management
        submitFeedback: (feedback) => {
          const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const submission = {
            ...feedback,
            id,
            timestamp: Date.now(),
            status: 'pending' as const
          };
          
          set(state => ({
            feedbackState: {
              ...state.feedbackState,
              submissions: [submission, ...state.feedbackState.submissions]
            }
          }));
          
          // Log feedback submission
          get().addDebugLog('info', 'feedback', 'Feedback submitted', { id, type: feedback.type });
          
          // Show notification
          get().addNotification({
            type: 'success',
            title: 'Feedback Received',
            message: 'Thank you for your feedback. We appreciate your input!'
          });
          
          return id;
        },

        updateFeedbackStatus: (id, status) => {
          set(state => ({
            feedbackState: {
              ...state.feedbackState,
              submissions: state.feedbackState.submissions.map(s =>
                s.id === id ? { ...s, status } : s
              )
            }
          }));
        },

        respondToFeedback: (id, response, respondedBy) => {
          set(state => ({
            feedbackState: {
              ...state.feedbackState,
              submissions: state.feedbackState.submissions.map(s =>
                s.id === id 
                  ? { 
                      ...s, 
                      status: 'resolved' as const,
                      response: {
                        message: response,
                        respondedBy,
                        timestamp: Date.now()
                      }
                    } 
                  : s
              )
            }
          }));
        },

        updateSatisfaction: (overall, feature) => {
          set(state => {
            const newState = { ...state.feedbackState };
            
            if (overall !== undefined) {
              newState.satisfaction.overall = overall;
            }
            
            if (feature) {
              newState.satisfaction.features[feature.name] = feature.rating;
            }
            
            newState.satisfaction.lastUpdated = Date.now();
            
            return { feedbackState: newState };
          });
        },

        setActivePrompt: (prompt) => {
          set(state => ({
            feedbackState: {
              ...state.feedbackState,
              activePrompt: prompt
            }
          }));
        },

        dismissActivePrompt: () => {
          set(state => ({
            feedbackState: {
              ...state.feedbackState,
              activePrompt: undefined
            }
          }));
        },

        getFeedbackAnalytics: () => {
          const { submissions } = get().feedbackState;
          const total = submissions.length;
          const pending = submissions.filter(s => s.status === 'pending').length;
          const resolved = submissions.filter(s => s.status === 'resolved').length;
          const ratings = submissions.filter(s => s.rating).map(s => s.rating!);
          const avgRating = ratings.length > 0 
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
            : 0;
          
          return { total, pending, resolved, avgRating };
        },

        // Performance and metrics
        updateMetrics: (metricsUpdate) => {
          set(state => ({
            metrics: {
              performance: { ...state.metrics.performance, ...metricsUpdate.performance },
              usage: { ...state.metrics.usage, ...metricsUpdate.usage },
              features: { ...state.metrics.features, ...metricsUpdate.features }
            }
          }));
        },

        recordPerformance: (metric, value) => {
          set(state => ({
            metrics: {
              ...state.metrics,
              performance: {
                ...state.metrics.performance,
                [metric]: value
              }
            }
          }));
        },

        recordUsage: (metric, increment = 1) => {
          set(state => ({
            metrics: {
              ...state.metrics,
              usage: {
                ...state.metrics.usage,
                [metric]: state.metrics.usage[metric] + increment
              }
            }
          }));
        },

        // UI state management
        toggleSidebar: () => {
          set(state => ({ sidebarOpen: !state.sidebarOpen }));
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },

        pushModal: (modalId) => {
          set(state => ({
            modalStack: [...state.modalStack, modalId]
          }));
        },

        popModal: () => {
          const { modalStack } = get();
          if (modalStack.length === 0) return undefined;
          
          const poppedModal = modalStack[modalStack.length - 1];
          
          set({
            modalStack: modalStack.slice(0, -1)
          });
          
          return poppedModal;
        },

        clearModals: () => {
          set({ modalStack: [] });
        },

        // Notification management
        addNotification: (notificationData) => {
          const notification = {
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
            ...notificationData
          };
          
          set(state => ({
            notifications: [notification, ...state.notifications]
          }));
          
          // Auto-remove non-persistent notifications after 5 seconds
          if (!notification.persistent) {
            setTimeout(() => {
              get().removeNotification(notification.id);
            }, 5000);
          }
        },

        markNotificationRead: (id) => {
          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            )
          }));
        },

        removeNotification: (id) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Feature flags
        setFeatureFlag: (flag, enabled) => {
          set(state => ({
            featureFlags: {
              ...state.featureFlags,
              [flag]: enabled
            }
          }));
        },

        isFeatureEnabled: (flag) => {
          return get().featureFlags[flag] ?? false;
        },

        // Debug utilities
        setDebugMode: (enabled) => {
          set({ debugMode: enabled });
        },

        addDebugLog: (level, source, message, data) => {
          if (!get().debugMode && level === 'debug') return;
          
          const log = {
            timestamp: Date.now(),
            level,
            source,
            message,
            data
          };
          
          set(state => ({
            debugLogs: [log, ...state.debugLogs.slice(0, 999)] // Keep last 1000 logs
          }));
          
          // Also log to console in development
          if (process.env.NODE_ENV === 'development') {
            console[level](`[${source}] ${message}`, data || '');
          }
        },

        clearDebugLogs: () => {
          set({ debugLogs: [] });
        },

        // Store coordination
        resetAllStores: () => {
          // This would reset all stores to their initial state
          // Implementation would depend on how other stores are structured
          get().addDebugLog('info', 'global', 'All stores reset');
        },

        getStoreSnapshot: () => {
          const state = get();
          return {
            global: {
              user: state.user,
              services: state.services,
              metrics: state.metrics,
              crisisState: state.crisisState
            }
            // Would include other store snapshots
          };
        }
      })
    ),
    { name: 'global-store' }
  )
);

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useGlobalStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useGlobalStore.getState().setOnlineStatus(false);
  });
  
  // Initialize services on store creation
  useGlobalStore.getState().initializeServices();
}

export default useGlobalStore;
