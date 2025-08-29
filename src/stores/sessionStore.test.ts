import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useSessionStore, HelpSession, VideoConsentData } from './sessionStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:30:00Z');
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(mockDate);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('SessionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSessionStore());
      
      expect(result.current.helpSessions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.videoChatDilemmaId).toBeNull();
      expect(result.current.pendingVideoChatDilemmaId).toBeNull();
      expect(result.current.isVideoConsentModalOpen).toBe(false);
      expect(result.current.videoConsentData).toBeNull();
      expect(result.current.selectedSessionId).toBeNull();
      expect(result.current.filterStatus).toBe('all');
      expect(result.current.sortBy).toBe('recent');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should fetch help sessions successfully', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.helpSessions.length).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
    });

    it('should find session by dilemma ID', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const session = result.current.getHelpSessionByDilemmaId('dilemma_1');
      expect(session).toBeDefined();
      expect(session?.dilemmaId).toBe('dilemma_1');
    });

    it('should update session status', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const sessionId = result.current.helpSessions[0]?.id;
      if (sessionId) {
        await act(async () => {
          await result.current.updateSessionStatus(sessionId, 'completed');
        });

        const updatedSession = result.current.helpSessions.find(s => s.id === sessionId);
        expect(updatedSession?.status).toBe('completed');
      }
    });

    it('should toggle session favorite status', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const sessionId = result.current.helpSessions[0]?.id;
      const initialFavoriteStatus = result.current.helpSessions[0]?.isFavorite;
      
      if (sessionId) {
        await act(async () => {
          await result.current.toggleFavorite(sessionId);
        });

        const updatedSession = result.current.helpSessions.find(s => s.id === sessionId);
        expect(updatedSession?.isFavorite).toBe(!initialFavoriteStatus);
      }
    });

    it('should send kudos to session', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const sessionId = result.current.helpSessions[0]?.id;
      const initialKudosCount = result.current.helpSessions[0]?.kudosCount || 0;
      
      if (sessionId) {
        await act(async () => {
          await result.current.sendKudos(sessionId);
        });

        const updatedSession = result.current.helpSessions.find(s => s.id === sessionId);
        expect(updatedSession?.kudosCount).toBe(initialKudosCount + 1);
        expect(updatedSession?.hasKudos).toBe(true);
      }
    });

    it('should rate a session', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const sessionId = result.current.helpSessions[0]?.id;
      
      if (sessionId) {
        await act(async () => {
          await result.current.rateSession(sessionId, 4, 'Great session!');
        });

        const updatedSession = result.current.helpSessions.find(s => s.id === sessionId);
        expect(updatedSession?.rating).toBe(4);
        expect(updatedSession?.feedback).toBe('Great session!');
      }
    });
  });

  describe('Video Chat Functionality', () => {
    const mockConsentData: VideoConsentData = {
      dilemmaId: 'test-dilemma',
      helperName: 'Test Helper',
      estimatedDuration: 30,
      guidelines: ['Be respectful', 'Stay on topic']
    };

    it('should start video chat consent flow', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startVideoChat('test-dilemma', mockConsentData);
      });

      expect(result.current.pendingVideoChatDilemmaId).toBe('test-dilemma');
      expect(result.current.videoConsentData).toEqual(mockConsentData);
      expect(result.current.isVideoConsentModalOpen).toBe(true);
    });

    it('should accept video consent and start chat', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startVideoChat('test-dilemma', mockConsentData);
      });

      await act(async () => {
        await result.current.acceptVideoConsent();
      });

      expect(result.current.videoChatDilemmaId).toBe('test-dilemma');
      expect(result.current.pendingVideoChatDilemmaId).toBeNull();
      expect(result.current.videoConsentData).toBeNull();
      expect(result.current.isVideoConsentModalOpen).toBe(false);
    });

    it('should decline video consent', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startVideoChat('test-dilemma', mockConsentData);
      });

      act(() => {
        result.current.declineVideoConsent();
      });

      expect(result.current.pendingVideoChatDilemmaId).toBeNull();
      expect(result.current.videoConsentData).toBeNull();
      expect(result.current.isVideoConsentModalOpen).toBe(false);
    });

    it('should end video chat', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      // Start video chat first
      act(() => {
        result.current.startVideoChat('test-dilemma', mockConsentData);
      });

      await act(async () => {
        await result.current.acceptVideoConsent();
      });

      // End video chat
      await act(async () => {
        await result.current.endVideoChat();
      });

      expect(result.current.videoChatDilemmaId).toBeNull();
    });
  });

  describe('UI State Management', () => {
    it('should set selected session', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setSelectedSession('session-123');
      });

      expect(result.current.selectedSessionId).toBe('session-123');
    });

    it('should set filter status', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setFilterStatus('completed');
      });

      expect(result.current.filterStatus).toBe('completed');
    });

    it('should set sort criteria', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setSortBy('rating');
      });

      expect(result.current.sortBy).toBe('rating');
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Summary Generation', () => {
    it('should generate seeker summary', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const sessionId = result.current.helpSessions[0]?.id;
      
      if (sessionId) {
        await act(async () => {
          await result.current.generateSeekerSummary(sessionId);
        });

        const updatedSession = result.current.helpSessions.find(s => s.id === sessionId);
        expect(updatedSession?.summary?.seekerSummary).toBeDefined();
      }
    });

    it('should generate helper performance summary', async () => {
      const { result } = renderHook(() => useSessionStore());
      
      await act(async () => {
        await result.current.fetchHelpSessions();
      });

      const sessionId = result.current.helpSessions[0]?.id;
      
      if (sessionId) {
        await act(async () => {
          await result.current.generateHelperPerformanceSummary(sessionId);
        });

        const updatedSession = result.current.helpSessions.find(s => s.id === sessionId);
        expect(updatedSession?.summary?.helperPerformance).toBeDefined();
      }
    });
  });
});