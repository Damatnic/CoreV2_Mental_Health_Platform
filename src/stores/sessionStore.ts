/**
 * Session Store
 *
 * Zustand store for managing help sessions, video chat functionality,
 * and session-related state management for the mental health platform.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// Types for session functionality
export interface HelpSession {
  id: string;
  dilemmaId: string;
  helperId: string;
  seekerId: string;
  helperName: string;
  seekerName: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  duration?: number;
  rating?: number;
  feedback?: string;
  tags: string[];
  isFavorite: boolean;
  kudosCount: number;
  hasKudos: boolean;
  summary?: {
    seekerSummary?: string;
    helperPerformance?: string;
    keyInsights?: string[];
    followUpRecommendations?: string[];
  };
  videoChat?: {
    roomId: string;
    isActive: boolean;
    participants: string[];
    startedAt: number;
    endedAt?: number;
  };
  metadata?: Record<string, any>;
}

export interface VideoConsentData {
  dilemmaId: string;
  helperName: string;
  estimatedDuration: number;
  guidelines: string[];
}

// Store state interface
interface SessionState {
  // Sessions
  helpSessions: HelpSession[];
  isLoading: boolean;
  
  // Video chat
  videoChatDilemmaId: string | null;
  pendingVideoChatDilemmaId: string | null;
  isVideoConsentModalOpen: boolean;
  videoConsentData: VideoConsentData | null;
  
  // UI state
  selectedSessionId: string | null;
  filterStatus: 'all' | 'pending' | 'active' | 'completed' | 'cancelled';
  sortBy: 'recent' | 'rating' | 'duration' | 'alphabetical';
  
  // Error handling
  error: string | null;
}

// Store actions interface
interface SessionActions {
  // Session management
  fetchHelpSessions: () => Promise<void>;
  getHelpSessionByDilemmaId: (dilemmaId: string) => HelpSession | undefined;
  updateSessionStatus: (sessionId: string, status: HelpSession['status']) => Promise<void>;
  
  // Session interactions
  toggleFavorite: (sessionId: string) => Promise<void>;
  sendKudos: (sessionId: string) => Promise<void>;
  rateSession: (sessionId: string, rating: number, feedback?: string) => Promise<void>;
  
  // Summary generation
  generateSeekerSummary: (sessionId: string) => Promise<void>;
  generateHelperPerformanceSummary: (sessionId: string) => Promise<void>;
  
  // Video chat actions
  startVideoChat: (dilemmaId: string, consentData: VideoConsentData) => void;
  acceptVideoConsent: () => Promise<void>;
  declineVideoConsent: () => void;
  endVideoChat: () => Promise<void>;
  
  // UI actions
  setSelectedSession: (sessionId: string | null) => void;
  setFilterStatus: (status: SessionState['filterStatus']) => void;
  setSortBy: (sortBy: SessionState['sortBy']) => void;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Mock API client
const mockApiClient = {
  async get(endpoint: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    if (endpoint === '/sessions') {
      // Return mock sessions
      return {
        data: [
          {
            id: 'session_1',
            dilemmaId: 'dilemma_1',
            helperId: 'helper_1',
            seekerId: 'seeker_1',
            helperName: 'Sarah Johnson',
            seekerName: 'Anonymous User',
            status: 'completed',
            startTime: Date.now() - 2 * 60 * 60 * 1000,
            endTime: Date.now() - 1.5 * 60 * 60 * 1000,
            duration: 30 * 60 * 1000,
            rating: 5,
            feedback: 'Very helpful session',
            tags: ['anxiety', 'coping-strategies'],
            isFavorite: false,
            kudosCount: 3,
            hasKudos: false
          },
          {
            id: 'session_2',
            dilemmaId: 'dilemma_2',
            helperId: 'helper_2',
            seekerId: 'seeker_1',
            helperName: 'Michael Chen',
            seekerName: 'Anonymous User',
            status: 'active',
            startTime: Date.now() - 15 * 60 * 1000,
            tags: ['depression', 'support'],
            isFavorite: true,
            kudosCount: 1,
            hasKudos: true
          }
        ]
      };
    }
    
    return { data: [] };
  },
  
  async post(endpoint: string, data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    return { success: true, data };
  },
  
  async put(endpoint: string, data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    return { success: true, data: { ...data, updatedAt: Date.now() } };
  }
};

// Get user token
const getUserToken = (): string => {
  return localStorage.getItem('userToken') || 'demo_user_token';
};

// Create the session store
export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    devtools(
      (set, get) => ({
        // Initial state
        helpSessions: [],
        isLoading: false,
        videoChatDilemmaId: null,
        pendingVideoChatDilemmaId: null,
        isVideoConsentModalOpen: false,
        videoConsentData: null,
        selectedSessionId: null,
        filterStatus: 'all',
        sortBy: 'recent',
        error: null,

        // Session management
        fetchHelpSessions: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await mockApiClient.get('/sessions');
            
            set({ 
              helpSessions: response.data || [],
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch help sessions',
              isLoading: false 
            });
          }
        },

        getHelpSessionByDilemmaId: (dilemmaId) => {
          const sessions = get().helpSessions;
          return sessions.find(session => session.dilemmaId === dilemmaId);
        },

        updateSessionStatus: async (sessionId, status) => {
          try {
            await mockApiClient.put(`/sessions/${sessionId}/status`, { status });
            
            set(state => ({
              helpSessions: state.helpSessions.map(session =>
                session.id === sessionId 
                  ? { 
                      ...session, 
                      status,
                      ...(status === 'completed' && !session.endTime ? {
                        endTime: Date.now(),
                        duration: Date.now() - session.startTime
                      } : {})
                    }
                  : session
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update session status' });
          }
        },

        // Session interactions
        toggleFavorite: async (sessionId) => {
          try {
            const session = get().helpSessions.find(s => s.id === sessionId);
            if (!session) return;
            
            const newFavoriteStatus = !session.isFavorite;
            
            await mockApiClient.put(`/sessions/${sessionId}/favorite`, { 
              isFavorite: newFavoriteStatus 
            });
            
            set(state => ({
              helpSessions: state.helpSessions.map(s =>
                s.id === sessionId ? { ...s, isFavorite: newFavoriteStatus } : s
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to toggle favorite' });
          }
        },

        sendKudos: async (sessionId) => {
          try {
            const session = get().helpSessions.find(s => s.id === sessionId);
            if (!session || session.hasKudos) return;
            
            await mockApiClient.post(`/sessions/${sessionId}/kudos`, {
              userToken: getUserToken()
            });
            
            set(state => ({
              helpSessions: state.helpSessions.map(s =>
                s.id === sessionId 
                  ? { ...s, kudosCount: s.kudosCount + 1, hasKudos: true }
                  : s
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to send kudos' });
          }
        },

        rateSession: async (sessionId, rating, feedback) => {
          try {
            await mockApiClient.put(`/sessions/${sessionId}/rating`, {
              rating,
              feedback,
              userToken: getUserToken()
            });
            
            set(state => ({
              helpSessions: state.helpSessions.map(s =>
                s.id === sessionId ? { ...s, rating, feedback } : s
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to rate session' });
          }
        },

        // Summary generation
        generateSeekerSummary: async (sessionId) => {
          try {
            const response = await mockApiClient.post(`/sessions/${sessionId}/summary/seeker`, {
              userToken: getUserToken()
            });
            
            set(state => ({
              helpSessions: state.helpSessions.map(s =>
                s.id === sessionId 
                  ? { 
                      ...s, 
                      summary: { 
                        ...s.summary, 
                        seekerSummary: response.data.summary 
                      } 
                    }
                  : s
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to generate seeker summary' });
          }
        },

        generateHelperPerformanceSummary: async (sessionId) => {
          try {
            const response = await mockApiClient.post(`/sessions/${sessionId}/summary/helper`, {
              userToken: getUserToken()
            });
            
            set(state => ({
              helpSessions: state.helpSessions.map(s =>
                s.id === sessionId 
                  ? { 
                      ...s, 
                      summary: { 
                        ...s.summary, 
                        helperPerformance: response.data.summary 
                      } 
                    }
                  : s
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to generate helper performance summary' });
          }
        },

        // Video chat actions
        startVideoChat: (dilemmaId, consentData) => {
          set({
            pendingVideoChatDilemmaId: dilemmaId,
            videoConsentData: consentData,
            isVideoConsentModalOpen: true
          });
        },

        acceptVideoConsent: async () => {
          try {
            const { pendingVideoChatDilemmaId, videoConsentData } = get();
            
            if (!pendingVideoChatDilemmaId || !videoConsentData) {
              throw new Error('No pending video chat consent');
            }
            
            // Start video chat session
            const response = await mockApiClient.post('/video-chat/start', {
              dilemmaId: pendingVideoChatDilemmaId,
              userToken: getUserToken()
            });
            
            set({
              videoChatDilemmaId: pendingVideoChatDilemmaId,
              pendingVideoChatDilemmaId: null,
              videoConsentData: null,
              isVideoConsentModalOpen: false
            });
            
            // Update session with video chat info
            set(state => ({
              helpSessions: state.helpSessions.map(session =>
                session.dilemmaId === pendingVideoChatDilemmaId
                  ? {
                      ...session,
                      videoChat: {
                        roomId: response.data.roomId,
                        isActive: true,
                        participants: [session.helperId, session.seekerId],
                        startedAt: Date.now()
                      }
                    }
                  : session
              )
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to start video chat',
              isVideoConsentModalOpen: false,
              pendingVideoChatDilemmaId: null,
              videoConsentData: null
            });
          }
        },

        declineVideoConsent: () => {
          set({
            pendingVideoChatDilemmaId: null,
            videoConsentData: null,
            isVideoConsentModalOpen: false
          });
        },

        endVideoChat: async () => {
          try {
            const { videoChatDilemmaId } = get();
            
            if (!videoChatDilemmaId) return;
            
            await mockApiClient.post('/video-chat/end', {
              dilemmaId: videoChatDilemmaId,
              userToken: getUserToken()
            });
            
            set({ videoChatDilemmaId: null });
            
            // Update session to mark video chat as ended
            set(state => ({
              helpSessions: state.helpSessions.map(session =>
                session.dilemmaId === videoChatDilemmaId && session.videoChat
                  ? {
                      ...session,
                      videoChat: {
                        ...session.videoChat,
                        isActive: false,
                        endedAt: Date.now()
                      }
                    }
                  : session
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to end video chat' });
          }
        },

        // UI actions
        setSelectedSession: (sessionId) => {
          set({ selectedSessionId: sessionId });
        },

        setFilterStatus: (filterStatus) => {
          set({ filterStatus });
        },

        setSortBy: (sortBy) => {
          set({ sortBy });
        },

        // Utility actions
        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        }
      }),
      { name: 'session-store' }
    ),
    {
      name: 'session-store',
      partialize: (state) => ({
        helpSessions: state.helpSessions,
        selectedSessionId: state.selectedSessionId,
        filterStatus: state.filterStatus,
        sortBy: state.sortBy
      })
    }
  )
);

// Utility functions for session management
export const getSessionDuration = (session: HelpSession): number => {
  if (session.duration) return session.duration;
  if (session.endTime) return session.endTime - session.startTime;
  if (session.status === 'active') return Date.now() - session.startTime;
  return 0;
};

export const formatSessionDuration = (duration: number): string => {
  const minutes = Math.floor(duration / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m`;
};

export const getSessionStatusColor = (status: HelpSession['status']): string => {
  switch (status) {
    case 'pending': return '#F59E0B';
    case 'active': return '#10B981';
    case 'completed': return '#3B82F6';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

export default useSessionStore;
