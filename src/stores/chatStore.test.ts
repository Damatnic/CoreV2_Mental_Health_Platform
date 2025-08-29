/**
 * Chat Store Tests
 * Comprehensive test suite for the chat store functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Types
interface ChatParticipant {
  id: string;
  name: string;
  role: 'seeker' | 'helper' | 'moderator';
  isOnline: boolean;
  avatar?: string;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'action';
  metadata?: Record<string, any>;
  edited?: boolean;
  editedAt?: number;
}

interface AIChatSession {
  id: string;
  dilemmaId: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  startedAt: number;
  endedAt?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

interface ChatStore {
  sessions: AIChatSession[];
  activeSession: AIChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createSession: (dilemmaId: string) => AIChatSession;
  endSession: (sessionId: string) => void;
  addParticipant: (sessionId: string, participant: ChatParticipant) => void;
  removeParticipant: (sessionId: string, participantId: string) => void;
  sendMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'chatId'>) => void;
  editMessage: (sessionId: string, messageId: string, content: string) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  setActiveSession: (sessionId: string) => void;
  loadSessions: () => Promise<void>;
  saveSessions: () => Promise<void>;
  reset: () => void;
}

// Mock implementation
const createMockChatStore = (): ChatStore => {
  let state = {
    sessions: [] as AIChatSession[],
    activeSession: null as AIChatSession | null,
    isLoading: false,
    error: null as string | null
  };

  return {
    get sessions() { return state.sessions; },
    get activeSession() { return state.activeSession; },
    get isLoading() { return state.isLoading; },
    get error() { return state.error; },

    createSession(dilemmaId: string): AIChatSession {
      const newSession: AIChatSession = {
        id: `session-${Date.now()}`,
        dilemmaId,
        participants: [],
        messages: [],
        startedAt: Date.now(),
        isActive: true
      };
      state.sessions.push(newSession);
      state.activeSession = newSession;
      return newSession;
    },

    endSession(sessionId: string): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        session.isActive = false;
        session.endedAt = Date.now();
        if (state.activeSession?.id === sessionId) {
          state.activeSession = null;
        }
      }
    },

    addParticipant(sessionId: string, participant: ChatParticipant): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session && !session.participants.find(p => p.id === participant.id)) {
        session.participants.push(participant);
      }
    },

    removeParticipant(sessionId: string, participantId: string): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        session.participants = session.participants.filter(p => p.id !== participantId);
      }
    },

    sendMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'chatId'>): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}`,
          chatId: sessionId,
          timestamp: Date.now()
        };
        session.messages.push(newMessage);
      }
    },

    editMessage(sessionId: string, messageId: string, content: string): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        const message = session.messages.find(m => m.id === messageId);
        if (message) {
          message.content = content;
          message.edited = true;
          message.editedAt = Date.now();
        }
      }
    },

    deleteMessage(sessionId: string, messageId: string): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        session.messages = session.messages.filter(m => m.id !== messageId);
      }
    },

    setActiveSession(sessionId: string): void {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        state.activeSession = session;
      }
    },

    async loadSessions(): Promise<void> {
      state.isLoading = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const stored = localStorage.getItem('chat-sessions');
        if (stored) {
          state.sessions = JSON.parse(stored);
        }
      } catch (error) {
        state.error = 'Failed to load sessions';
      } finally {
        state.isLoading = false;
      }
    },

    async saveSessions(): Promise<void> {
      try {
        localStorage.setItem('chat-sessions', JSON.stringify(state.sessions));
      } catch (error) {
        state.error = 'Failed to save sessions';
      }
    },

    reset(): void {
      state.sessions = [];
      state.activeSession = null;
      state.isLoading = false;
      state.error = null;
    }
  };
};

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] || null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  }
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Mock Date
const mockDate = new Date('2024-01-15T10:30:00Z');

// Helper to create test chat session
const createTestChatSession = (overrides: Partial<AIChatSession> = {}): AIChatSession => ({
  id: 'test-chat-1',
  dilemmaId: 'test-dilemma-1',
  participants: [
    {
      id: 'user-1',
      name: 'Test User',
      role: 'seeker',
      isOnline: true,
      joinedAt: mockDate.getTime()
    },
    {
      id: 'helper-1', 
      name: 'Test Helper',
      role: 'helper',
      isOnline: true,
      joinedAt: mockDate.getTime()
    }
  ],
  messages: [],
  startedAt: mockDate.getTime(),
  isActive: true,
  ...overrides
});

// Test suite
describe('ChatStore', () => {
  let store: ChatStore;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    store = createMockChatStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should create a new chat session', () => {
      const session = store.createSession('dilemma-1');
      
      expect(session).toBeDefined();
      expect(session.dilemmaId).toBe('dilemma-1');
      expect(session.participants).toHaveLength(0);
      expect(session.messages).toHaveLength(0);
      expect(session.isActive).toBe(true);
      expect(store.sessions).toContainEqual(session);
      expect(store.activeSession).toBe(session);
    });

    it('should end a chat session', () => {
      const session = store.createSession('dilemma-1');
      
      store.endSession(session.id);
      
      expect(session.isActive).toBe(false);
      expect(session.endedAt).toBeDefined();
      expect(store.activeSession).toBeNull();
    });

    it('should set active session', () => {
      const session1 = store.createSession('dilemma-1');
      const session2 = store.createSession('dilemma-2');
      
      store.setActiveSession(session1.id);
      
      expect(store.activeSession).toBe(session1);
    });
  });

  describe('Participant Management', () => {
    let session: AIChatSession;

    beforeEach(() => {
      session = store.createSession('dilemma-1');
    });

    it('should add a participant', () => {
      const participant: ChatParticipant = {
        id: 'user-1',
        name: 'Test User',
        role: 'seeker',
        isOnline: true,
        joinedAt: Date.now()
      };
      
      store.addParticipant(session.id, participant);
      
      expect(session.participants).toHaveLength(1);
      expect(session.participants[0]).toEqual(participant);
    });

    it('should not add duplicate participants', () => {
      const participant: ChatParticipant = {
        id: 'user-1',
        name: 'Test User',
        role: 'seeker',
        isOnline: true,
        joinedAt: Date.now()
      };
      
      store.addParticipant(session.id, participant);
      store.addParticipant(session.id, participant);
      
      expect(session.participants).toHaveLength(1);
    });

    it('should remove a participant', () => {
      const participant1: ChatParticipant = {
        id: 'user-1',
        name: 'User 1',
        role: 'seeker',
        isOnline: true,
        joinedAt: Date.now()
      };
      const participant2: ChatParticipant = {
        id: 'user-2',
        name: 'User 2',
        role: 'helper',
        isOnline: true,
        joinedAt: Date.now()
      };
      
      store.addParticipant(session.id, participant1);
      store.addParticipant(session.id, participant2);
      store.removeParticipant(session.id, 'user-1');
      
      expect(session.participants).toHaveLength(1);
      expect(session.participants[0].id).toBe('user-2');
    });
  });

  describe('Message Management', () => {
    let session: AIChatSession;

    beforeEach(() => {
      session = store.createSession('dilemma-1');
    });

    it('should send a message', () => {
      store.sendMessage(session.id, {
        senderId: 'user-1',
        content: 'Hello, world!',
        type: 'text'
      });
      
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].content).toBe('Hello, world!');
      expect(session.messages[0].senderId).toBe('user-1');
      expect(session.messages[0].type).toBe('text');
    });

    it('should edit a message', () => {
      store.sendMessage(session.id, {
        senderId: 'user-1',
        content: 'Original message',
        type: 'text'
      });
      
      const messageId = session.messages[0].id;
      store.editMessage(session.id, messageId, 'Edited message');
      
      expect(session.messages[0].content).toBe('Edited message');
      expect(session.messages[0].edited).toBe(true);
      expect(session.messages[0].editedAt).toBeDefined();
    });

    it('should delete a message', () => {
      store.sendMessage(session.id, {
        senderId: 'user-1',
        content: 'Message 1',
        type: 'text'
      });
      store.sendMessage(session.id, {
        senderId: 'user-2',
        content: 'Message 2',
        type: 'text'
      });
      
      const messageId = session.messages[0].id;
      store.deleteMessage(session.id, messageId);
      
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].content).toBe('Message 2');
    });
  });

  describe('Persistence', () => {
    it('should save sessions to localStorage', async () => {
      const session1 = store.createSession('dilemma-1');
      const session2 = store.createSession('dilemma-2');
      
      await store.saveSessions();
      
      const stored = localStorageMock.getItem('chat-sessions');
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
    });

    it('should load sessions from localStorage', async () => {
      const mockSessions = [createTestChatSession()];
      localStorageMock.setItem('chat-sessions', JSON.stringify(mockSessions));
      
      await store.loadSessions();
      
      expect(store.sessions).toHaveLength(1);
      expect(store.sessions[0].id).toBe('test-chat-1');
    });

    it('should handle load errors gracefully', async () => {
      const original = localStorageMock.getItem;
      localStorageMock.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      await store.loadSessions();
      
      expect(store.error).toBe('Failed to load sessions');
      expect(store.isLoading).toBe(false);
      
      localStorageMock.getItem = original;
    });
  });

  describe('Store State', () => {
    it('should reset store', () => {
      store.createSession('dilemma-1');
      store.createSession('dilemma-2');
      
      store.reset();
      
      expect(store.sessions).toHaveLength(0);
      expect(store.activeSession).toBeNull();
      expect(store.error).toBeNull();
      expect(store.isLoading).toBe(false);
    });

    it('should track loading state', async () => {
      const loadPromise = store.loadSessions();
      
      expect(store.isLoading).toBe(true);
      
      await loadPromise;
      
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on non-existent session', () => {
      expect(() => {
        store.sendMessage('non-existent', {
          senderId: 'user-1',
          content: 'Test',
          type: 'text'
        });
      }).not.toThrow();
      
      expect(() => {
        store.addParticipant('non-existent', {
          id: 'user-1',
          name: 'Test',
          role: 'seeker',
          isOnline: true,
          joinedAt: Date.now()
        });
      }).not.toThrow();
    });

    it('should handle system messages', () => {
      const session = store.createSession('dilemma-1');
      
      store.sendMessage(session.id, {
        senderId: 'system',
        content: 'User joined the chat',
        type: 'system'
      });
      
      expect(session.messages[0].type).toBe('system');
    });

    it('should preserve message metadata', () => {
      const session = store.createSession('dilemma-1');
      
      store.sendMessage(session.id, {
        senderId: 'user-1',
        content: 'Test message',
        type: 'text',
        metadata: {
          emotion: 'happy',
          confidence: 0.95
        }
      });
      
      expect(session.messages[0].metadata).toBeDefined();
      expect(session.messages[0].metadata?.emotion).toBe('happy');
    });
  });
});

// Export for use in other tests
export { createMockChatStore, createTestChatSession };
export type { ChatStore, AIChatSession, ChatMessage, ChatParticipant };