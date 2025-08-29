/**
 * Tether Store
 *
 * Zustand store for managing Astral Tether connections, profiles, and real-time
 * emotional support features. Provides state management for peer-to-peer
 * mental health support connections.
 */

import { create } from 'zustand';

// Types for Tether functionality
export interface TetherProfile {
  id: string;
  vibrationPattern: 'gentle' | 'rhythmic' | 'heartbeat' | 'custom';
  color: string;
  sound: 'heartbeat' | 'ocean' | 'rain' | 'silence' | 'custom';
  comfortMessages: string[];
  breathingPattern: 'box' | '478' | 'coherent' | 'custom';
  intensity: number; // 0-100
  duration: number; // in seconds
  customSettings?: {
    vibrationData?: number[];
    soundFile?: string;
    breathingTiming?: number[];
  };
}

export interface TetherCircleMember {
  id: string;
  name: string;
  avatar?: string;
  availability: 'available' | 'busy' | 'offline';
  lastTether?: string;
  trustLevel: 'primary' | 'secondary' | 'tertiary';
  preferredTimes?: string[];
  responseRate: number; // 0-1
  supportStyle: string[];
  mutualConnections: number;
  joinedAt: number;
}

export interface ActiveTether {
  id: string;
  partnerId: string;
  partnerName: string;
  startTime: number;
  duration: number;
  status: 'connecting' | 'active' | 'paused' | 'completed' | 'failed';
  type: 'emergency' | 'scheduled' | 'spontaneous';
  intensity: number;
  sharedActivities: string[];
  messages: TetherMessage[];
  biometricSync?: {
    heartRate?: number;
    breathingRate?: number;
    stressLevel?: number;
  };
}

export interface TetherMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'comfort' | 'breathing_cue' | 'check_in' | 'system';
  timestamp: number;
  delivered: boolean;
  read: boolean;
}

export interface TetherRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  type: 'emergency' | 'support' | 'check_in';
  message?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  autoAccept: boolean;
  expiresAt: number;
}

export interface TetherHistory {
  id: string;
  partnerId: string;
  partnerName: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'emergency' | 'scheduled' | 'spontaneous';
  effectiveness: number; // 0-5 rating
  notes?: string;
  followUpNeeded: boolean;
  tags: string[];
}

export interface TetherSettings {
  autoAcceptFromTrusted: boolean;
  emergencyAutoAccept: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;
  };
  notifications: {
    requests: boolean;
    reminders: boolean;
    checkIns: boolean;
    emergencies: boolean;
  };
  privacy: {
    shareAvailability: boolean;
    shareLocation: boolean;
    allowAnonymous: boolean;
  };
  limits: {
    maxDailyTethers: number;
    maxConcurrentTethers: number;
    cooldownPeriod: number; // minutes
  };
}

// Store state interface
interface TetherState {
  // User's tether profile
  profile: TetherProfile | null;
  
  // Circle management
  circle: TetherCircleMember[];
  pendingInvites: TetherCircleMember[];
  
  // Active connections
  activeTethers: ActiveTether[];
  currentTether: ActiveTether | null;
  
  // Requests
  incomingRequests: TetherRequest[];
  outgoingRequests: TetherRequest[];
  
  // History and analytics
  tetherHistory: TetherHistory[];
  weeklyStats: {
    totalTethers: number;
    totalDuration: number;
    averageEffectiveness: number;
    mostActivePartner: string;
    emergencyTethers: number;
  };
  
  // Settings
  settings: TetherSettings;
  
  // UI state
  isConnecting: boolean;
  connectionStatus: 'offline' | 'online' | 'connecting' | 'error';
  lastSync: number | null;
}

// Store actions interface
interface TetherActions {
  // Profile management
  updateProfile: (updates: Partial<TetherProfile>) => void;
  createProfile: (profile: Omit<TetherProfile, 'id'>) => void;
  
  // Circle management
  addToCircle: (member: Omit<TetherCircleMember, 'id' | 'joinedAt'>) => void;
  removeFromCircle: (memberId: string) => void;
  updateCircleMember: (memberId: string, updates: Partial<TetherCircleMember>) => void;
  
  // Tether operations
  requestTether: (partnerId: string, type: TetherRequest['type'], urgency?: TetherRequest['urgency'], message?: string) => Promise<void>;
  acceptTetherRequest: (requestId: string) => Promise<void>;
  declineTetherRequest: (requestId: string) => Promise<void>;
  startTether: (partnerId: string, type: ActiveTether['type']) => Promise<void>;
  endTether: (tetherId: string, rating?: number, notes?: string) => Promise<void>;
  pauseTether: (tetherId: string) => void;
  resumeTether: (tetherId: string) => void;
  
  // Messaging
  sendTetherMessage: (tetherId: string, content: string, type?: TetherMessage['type']) => void;
  markMessageRead: (tetherId: string, messageId: string) => void;
  
  // Settings
  updateSettings: (updates: Partial<TetherSettings>) => void;
  
  // Sync and connection
  syncWithServer: () => Promise<void>;
  updateConnectionStatus: (status: TetherState['connectionStatus']) => void;
  
  // Analytics
  calculateWeeklyStats: () => void;
  addTetherHistory: (history: Omit<TetherHistory, 'id'>) => void;
  
  // Cleanup
  clearExpiredRequests: () => void;
  clearOldHistory: (daysToKeep?: number) => void;
}

// Default settings
const DEFAULT_SETTINGS: TetherSettings = {
  autoAcceptFromTrusted: true,
  emergencyAutoAccept: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  notifications: {
    requests: true,
    reminders: true,
    checkIns: true,
    emergencies: true
  },
  privacy: {
    shareAvailability: true,
    shareLocation: false,
    allowAnonymous: false
  },
  limits: {
    maxDailyTethers: 10,
    maxConcurrentTethers: 3,
    cooldownPeriod: 15
  }
};

// Default profile
const DEFAULT_PROFILE: Omit<TetherProfile, 'id'> = {
  vibrationPattern: 'gentle',
  color: '#6366f1',
  sound: 'heartbeat',
  comfortMessages: [
    "You're not alone in this",
    "I'm here with you",
    "Take it one breath at a time",
    "You're stronger than you know"
  ],
  breathingPattern: 'box',
  intensity: 50,
  duration: 300 // 5 minutes
};

// Create the store
export const useTetherStore = create<TetherState & TetherActions>()(
  (set, get) => ({
      // Initial state
      profile: null,
      circle: [],
      pendingInvites: [],
      activeTethers: [],
      currentTether: null,
      incomingRequests: [],
      outgoingRequests: [],
      tetherHistory: [],
      weeklyStats: {
        totalTethers: 0,
        totalDuration: 0,
        averageEffectiveness: 0,
        mostActivePartner: '',
        emergencyTethers: 0
      },
      settings: DEFAULT_SETTINGS,
      isConnecting: false,
      connectionStatus: 'offline',
      lastSync: null,

      // Profile management
      updateProfile: (updates) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null
        }));
      },

      createProfile: (profileData) => {
        const profile: TetherProfile = {
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...DEFAULT_PROFILE,
          ...profileData
        };
        
        set({ profile });
      },

      // Circle management
      addToCircle: (memberData) => {
        const member: TetherCircleMember = {
          id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          joinedAt: Date.now(),
          responseRate: 0.8,
          supportStyle: ['listener', 'advisor'],
          mutualConnections: 0,
          ...memberData
        };
        
        set((state) => ({
          circle: [...state.circle, member]
        }));
      },

      removeFromCircle: (memberId) => {
        set((state) => ({
          circle: state.circle.filter(member => member.id !== memberId)
        }));
      },

      updateCircleMember: (memberId, updates) => {
        set((state) => ({
          circle: state.circle.map(member =>
            member.id === memberId ? { ...member, ...updates } : member
          )
        }));
      },

      // Tether operations
      requestTether: async (partnerId, type, urgency = 'medium', message) => {
        try {
          set({ isConnecting: true });

          const partner = get().circle.find(m => m.id === partnerId);
          if (!partner) {
            throw new Error('Partner not found in circle');
          }

          const request: TetherRequest = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromId: 'current_user', // In real app, get from auth
            fromName: 'You',
            toId: partnerId,
            toName: partner.name,
            type,
            message,
            urgency,
            timestamp: Date.now(),
            status: 'pending',
            autoAccept: partner.trustLevel === 'primary' && get().settings.autoAcceptFromTrusted,
            expiresAt: Date.now() + (urgency === 'critical' ? 2 * 60 * 1000 : 10 * 60 * 1000)
          };

          set((state) => ({
            outgoingRequests: [...state.outgoingRequests, request]
          }));

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error('Failed to request tether:', error);
          throw error;
        } finally {
          set({ isConnecting: false });
        }
      },

      acceptTetherRequest: async (requestId) => {
        try {
          set({ isConnecting: true });

          const request = get().incomingRequests.find(r => r.id === requestId);
          if (!request) {
            throw new Error('Request not found');
          }

          // Remove from incoming requests
          set((state) => ({
            incomingRequests: state.incomingRequests.filter(r => r.id !== requestId)
          }));

          // Start the tether
          await get().startTether(request.fromId, request.type === 'emergency' ? 'emergency' : 'spontaneous');
          
        } catch (error) {
          console.error('Failed to accept tether request:', error);
          throw error;
        } finally {
          set({ isConnecting: false });
        }
      },

      declineTetherRequest: async (requestId) => {
        set((state) => ({
          incomingRequests: state.incomingRequests.map(request =>
            request.id === requestId ? { ...request, status: 'declined' } : request
          )
        }));

        // Remove declined request after a delay
        setTimeout(() => {
          set((state) => ({
            incomingRequests: state.incomingRequests.filter(r => r.id !== requestId)
          }));
        }, 3000);
      },

      startTether: async (partnerId, type) => {
        try {
          set({ isConnecting: true });

          const partner = get().circle.find(m => m.id === partnerId);
          if (!partner) {
            throw new Error('Partner not found');
          }

          const tether: ActiveTether = {
            id: `tether_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            partnerId,
            partnerName: partner.name,
            startTime: Date.now(),
            duration: 0,
            status: 'connecting',
            type,
            intensity: get().profile?.intensity || 50,
            sharedActivities: [],
            messages: []
          };

          set((state) => ({
            activeTethers: [...state.activeTethers, tether],
            currentTether: tether,
            isConnecting: true
          }));

          // Simulate connection process
          await new Promise(resolve => setTimeout(resolve, 2000));

          set((state) => ({
            activeTethers: state.activeTethers.map(t =>
              t.id === tether.id ? { ...t, status: 'active' } : t
            ),
            currentTether: { ...tether, status: 'active' },
            isConnecting: false
          }));

        } catch (error) {
          console.error('Failed to start tether:', error);
          set({ isConnecting: false });
          throw error;
        }
      },

      endTether: async (tetherId, rating, notes) => {
        const tether = get().activeTethers.find(t => t.id === tetherId);
        if (!tether) return;

        const endTime = Date.now();
        const duration = endTime - tether.startTime;

        // Add to history
        const historyEntry: Omit<TetherHistory, 'id'> = {
          partnerId: tether.partnerId,
          partnerName: tether.partnerName,
          startTime: tether.startTime,
          endTime,
          duration,
          type: tether.type,
          effectiveness: rating || 3,
          notes,
          followUpNeeded: (rating || 3) < 3,
          tags: []
        };

        get().addTetherHistory(historyEntry);

        // Remove from active tethers
        set((state) => ({
          activeTethers: state.activeTethers.filter(t => t.id !== tetherId),
          currentTether: state.currentTether?.id === tetherId ? null : state.currentTether
        }));

        // Recalculate stats
        get().calculateWeeklyStats();
      },

      pauseTether: (tetherId) => {
        set((state) => ({
          activeTethers: state.activeTethers.map(tether =>
            tether.id === tetherId ? { ...tether, status: 'paused' } : tether
          ),
          currentTether: state.currentTether?.id === tetherId 
            ? { ...state.currentTether, status: 'paused' }
            : state.currentTether
        }));
      },

      resumeTether: (tetherId) => {
        set((state) => ({
          activeTethers: state.activeTethers.map(tether =>
            tether.id === tetherId ? { ...tether, status: 'active' } : tether
          ),
          currentTether: state.currentTether?.id === tetherId 
            ? { ...state.currentTether, status: 'active' }
            : state.currentTether
        }));
      },

      // Messaging
      sendTetherMessage: (tetherId, content, type = 'text') => {
        const message: TetherMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          senderId: 'current_user',
          senderName: 'You',
          content,
          type,
          timestamp: Date.now(),
          delivered: false,
          read: false
        };

        set((state) => ({
          activeTethers: state.activeTethers.map(tether =>
            tether.id === tetherId 
              ? { ...tether, messages: [...tether.messages, message] }
              : tether
          ),
          currentTether: state.currentTether?.id === tetherId
            ? { ...state.currentTether, messages: [...state.currentTether.messages, message] }
            : state.currentTether
        }));

        // Simulate message delivery
        setTimeout(() => {
          set((state) => ({
            activeTethers: state.activeTethers.map(tether =>
              tether.id === tetherId 
                ? {
                    ...tether,
                    messages: tether.messages.map(msg =>
                      msg.id === message.id ? { ...msg, delivered: true } : msg
                    )
                  }
                : tether
            )
          }));
        }, 1000);
      },

      markMessageRead: (tetherId, messageId) => {
        set((state) => ({
          activeTethers: state.activeTethers.map(tether =>
            tether.id === tetherId 
              ? {
                  ...tether,
                  messages: tether.messages.map(msg =>
                    msg.id === messageId ? { ...msg, read: true } : msg
                  )
                }
              : tether
          )
        }));
      },

      // Settings
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
      },

      // Sync and connection
      syncWithServer: async () => {
        try {
          set({ isConnecting: true });

          // Simulate server sync
          await new Promise(resolve => setTimeout(resolve, 1500));

          set({
            lastSync: Date.now(),
            connectionStatus: 'online'
          });

        } catch (error) {
          console.error('Sync failed:', error);
          set({ connectionStatus: 'error' });
        } finally {
          set({ isConnecting: false });
        }
      },

      updateConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      // Analytics
      calculateWeeklyStats: () => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const weeklyHistory = get().tetherHistory.filter(h => h.startTime >= weekAgo);

        const stats = weeklyHistory.reduce((acc, history) => {
          acc.totalTethers++;
          acc.totalDuration += history.duration;
          acc.averageEffectiveness += history.effectiveness;
          
          if (history.type === 'emergency') {
            acc.emergencyTethers++;
          }

          return acc;
        }, {
          totalTethers: 0,
          totalDuration: 0,
          averageEffectiveness: 0,
          mostActivePartner: '',
          emergencyTethers: 0
        });

        if (stats.totalTethers > 0) {
          stats.averageEffectiveness = stats.averageEffectiveness / stats.totalTethers;
          
          // Find most active partner
          const partnerCounts = weeklyHistory.reduce((acc, h) => {
            acc[h.partnerId] = (acc[h.partnerId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const mostActivePartnerId = Object.entries(partnerCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0];
          
          if (mostActivePartnerId) {
            const partner = get().circle.find(m => m.id === mostActivePartnerId);
            stats.mostActivePartner = partner?.name || '';
          }
        }

        set({ weeklyStats: stats });
      },

      addTetherHistory: (historyData) => {
        const history: TetherHistory = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...historyData
        };

        set((state) => ({
          tetherHistory: [history, ...state.tetherHistory].slice(0, 100) // Keep last 100
        }));
      },

      // Cleanup
      clearExpiredRequests: () => {
        const now = Date.now();
        set((state) => ({
          incomingRequests: state.incomingRequests.filter(r => r.expiresAt > now),
          outgoingRequests: state.outgoingRequests.filter(r => r.expiresAt > now)
        }));
      },

      clearOldHistory: (daysToKeep = 30) => {
        const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        set((state) => ({
          tetherHistory: state.tetherHistory.filter(h => h.startTime >= cutoff)
        }));
      }
    })
);

export default useTetherStore;
