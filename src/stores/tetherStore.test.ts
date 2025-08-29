/**
 * Tether Store Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { create } from 'zustand';

interface TetherConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  type: 'helper' | 'peer' | 'therapist' | 'family';
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  createdAt: string;
  lastInteraction?: string;
}

interface TetherRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'helper' | 'peer' | 'therapist' | 'family';
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface TetherSession {
  id: string;
  connectionId: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  rating?: number;
}

interface TetherStore {
  connections: TetherConnection[];
  requests: TetherRequest[];
  activeSessions: TetherSession[];
  currentTether: TetherConnection | null;
  isConnecting: boolean;
  error: string | null;

  // Actions
  addConnection: (connection: TetherConnection) => void;
  removeConnection: (connectionId: string) => void;
  updateConnectionStatus: (connectionId: string, status: TetherConnection['status']) => void;
  sendTetherRequest: (request: Omit<TetherRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  acceptTetherRequest: (requestId: string) => Promise<void>;
  declineTetherRequest: (requestId: string) => Promise<void>;
  startSession: (connectionId: string) => void;
  endSession: (sessionId: string, notes?: string, rating?: number) => void;
  setCurrentTether: (connection: TetherConnection | null) => void;
  clearError: () => void;
  reset: () => void;
}

const createTetherStore = () => create<TetherStore>((set, get) => ({
  connections: [],
  requests: [],
  activeSessions: [],
  currentTether: null,
  isConnecting: false,
  error: null,

  addConnection: (connection) => {
    set((state) => ({
      connections: [...state.connections, connection]
    }));
  },

  removeConnection: (connectionId) => {
    set((state) => ({
      connections: state.connections.filter(c => c.id !== connectionId),
      currentTether: state.currentTether?.id === connectionId ? null : state.currentTether
    }));
  },

  updateConnectionStatus: (connectionId, status) => {
    set((state) => ({
      connections: state.connections.map(c =>
        c.id === connectionId ? { ...c, status, lastInteraction: new Date().toISOString() } : c
      )
    }));
  },

  sendTetherRequest: async (request) => {
    set({ isConnecting: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRequest: TetherRequest = {
        ...request,
        id: `req-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      set((state) => ({
        requests: [...state.requests, newRequest],
        isConnecting: false
      }));
    } catch (error) {
      set({ 
        error: 'Failed to send tether request', 
        isConnecting: false 
      });
      throw error;
    }
  },

  acceptTetherRequest: async (requestId) => {
    set({ isConnecting: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const request = get().requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');
      
      const newConnection: TetherConnection = {
        id: `conn-${Date.now()}`,
        userId: request.toUserId,
        connectedUserId: request.fromUserId,
        type: request.type,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      set((state) => ({
        connections: [...state.connections, newConnection],
        requests: state.requests.map(r =>
          r.id === requestId ? { ...r, status: 'accepted' } : r
        ),
        isConnecting: false
      }));
    } catch (error) {
      set({ 
        error: 'Failed to accept tether request', 
        isConnecting: false 
      });
      throw error;
    }
  },

  declineTetherRequest: async (requestId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set((state) => ({
        requests: state.requests.map(r =>
          r.id === requestId ? { ...r, status: 'declined' } : r
        )
      }));
    } catch (error) {
      set({ error: 'Failed to decline tether request' });
      throw error;
    }
  },

  startSession: (connectionId) => {
    const connection = get().connections.find(c => c.id === connectionId);
    if (!connection) {
      set({ error: 'Connection not found' });
      return;
    }

    const newSession: TetherSession = {
      id: `session-${Date.now()}`,
      connectionId,
      startTime: new Date().toISOString()
    };

    set((state) => ({
      activeSessions: [...state.activeSessions, newSession],
      currentTether: connection
    }));
  },

  endSession: (sessionId, notes, rating) => {
    set((state) => ({
      activeSessions: state.activeSessions.map(s =>
        s.id === sessionId
          ? { ...s, endTime: new Date().toISOString(), notes, rating }
          : s
      ).filter(s => s.id !== sessionId),
      currentTether: null
    }));
  },

  setCurrentTether: (connection) => {
    set({ currentTether: connection });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      connections: [],
      requests: [],
      activeSessions: [],
      currentTether: null,
      isConnecting: false,
      error: null
    });
  }
}));

describe('TetherStore', () => {
  let store: ReturnType<typeof createTetherStore>;

  beforeEach(() => {
    store = createTetherStore();
  });

  afterEach(() => {
    store.getState().reset();
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should add a new connection', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'user-2',
        type: 'peer',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      
      expect(store.getState().connections).toHaveLength(1);
      expect(store.getState().connections[0]).toEqual(connection);
    });

    it('should remove a connection', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'user-2',
        type: 'helper',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      store.getState().removeConnection('conn-1');
      
      expect(store.getState().connections).toHaveLength(0);
    });

    it('should update connection status', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'user-2',
        type: 'therapist',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      store.getState().updateConnectionStatus('conn-1', 'active');
      
      expect(store.getState().connections[0].status).toBe('active');
      expect(store.getState().connections[0].lastInteraction).toBeDefined();
    });

    it('should handle multiple connections', () => {
      const connections: TetherConnection[] = [
        {
          id: 'conn-1',
          userId: 'user-1',
          connectedUserId: 'helper-1',
          type: 'helper',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'conn-2',
          userId: 'user-1',
          connectedUserId: 'peer-1',
          type: 'peer',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];

      connections.forEach(conn => store.getState().addConnection(conn));
      
      expect(store.getState().connections).toHaveLength(2);
      expect(store.getState().connections[0].type).toBe('helper');
      expect(store.getState().connections[1].type).toBe('peer');
    });
  });

  describe('Tether Requests', () => {
    it('should send a tether request', async () => {
      const request = {
        fromUserId: 'user-1',
        toUserId: 'helper-1',
        type: 'helper' as const,
        message: 'Need support with anxiety'
      };

      await store.getState().sendTetherRequest(request);
      
      expect(store.getState().requests).toHaveLength(1);
      expect(store.getState().requests[0].status).toBe('pending');
      expect(store.getState().requests[0].message).toBe('Need support with anxiety');
      expect(store.getState().isConnecting).toBe(false);
    });

    it('should accept a tether request', async () => {
      const request = {
        fromUserId: 'user-1',
        toUserId: 'helper-1',
        type: 'helper' as const
      };

      await store.getState().sendTetherRequest(request);
      const requestId = store.getState().requests[0].id;
      
      await store.getState().acceptTetherRequest(requestId);
      
      expect(store.getState().connections).toHaveLength(1);
      expect(store.getState().requests[0].status).toBe('accepted');
      expect(store.getState().connections[0].status).toBe('active');
    });

    it('should decline a tether request', async () => {
      const request = {
        fromUserId: 'user-1',
        toUserId: 'helper-1',
        type: 'helper' as const
      };

      await store.getState().sendTetherRequest(request);
      const requestId = store.getState().requests[0].id;
      
      await store.getState().declineTetherRequest(requestId);
      
      expect(store.getState().requests[0].status).toBe('declined');
      expect(store.getState().connections).toHaveLength(0);
    });

    it('should handle request errors', async () => {
      // Mock error scenario
      const request = {
        fromUserId: 'user-1',
        toUserId: 'helper-1',
        type: 'helper' as const
      };

      // Force an error by accepting non-existent request
      await expect(
        store.getState().acceptTetherRequest('non-existent')
      ).rejects.toThrow();
      
      expect(store.getState().error).toBe('Failed to accept tether request');
    });
  });

  describe('Session Management', () => {
    it('should start a session', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'helper-1',
        type: 'helper',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      store.getState().startSession('conn-1');
      
      expect(store.getState().activeSessions).toHaveLength(1);
      expect(store.getState().activeSessions[0].connectionId).toBe('conn-1');
      expect(store.getState().currentTether).toEqual(connection);
    });

    it('should end a session with rating', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'helper-1',
        type: 'helper',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      store.getState().startSession('conn-1');
      
      const sessionId = store.getState().activeSessions[0].id;
      store.getState().endSession(sessionId, 'Great session!', 5);
      
      expect(store.getState().activeSessions).toHaveLength(0);
      expect(store.getState().currentTether).toBeNull();
    });

    it('should handle session not found error', () => {
      store.getState().startSession('non-existent');
      
      expect(store.getState().error).toBe('Connection not found');
      expect(store.getState().activeSessions).toHaveLength(0);
    });
  });

  describe('Current Tether Management', () => {
    it('should set current tether', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'helper-1',
        type: 'helper',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().setCurrentTether(connection);
      
      expect(store.getState().currentTether).toEqual(connection);
    });

    it('should clear current tether when connection is removed', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'helper-1',
        type: 'helper',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      store.getState().setCurrentTether(connection);
      store.getState().removeConnection('conn-1');
      
      expect(store.getState().currentTether).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      store.getState().startSession('non-existent');
      expect(store.getState().error).toBeDefined();
      
      store.getState().clearError();
      expect(store.getState().error).toBeNull();
    });
  });

  describe('Store Reset', () => {
    it('should reset all state', () => {
      const connection: TetherConnection = {
        id: 'conn-1',
        userId: 'user-1',
        connectedUserId: 'helper-1',
        type: 'helper',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      store.getState().addConnection(connection);
      store.getState().setCurrentTether(connection);
      store.getState().reset();
      
      expect(store.getState().connections).toHaveLength(0);
      expect(store.getState().requests).toHaveLength(0);
      expect(store.getState().activeSessions).toHaveLength(0);
      expect(store.getState().currentTether).toBeNull();
      expect(store.getState().error).toBeNull();
      expect(store.getState().isConnecting).toBe(false);
    });
  });

  describe('Connection Types', () => {
    it('should support different connection types', () => {
      const connectionTypes: TetherConnection['type'][] = ['helper', 'peer', 'therapist', 'family'];
      
      connectionTypes.forEach((type, index) => {
        const connection: TetherConnection = {
          id: `conn-${index}`,
          userId: 'user-1',
          connectedUserId: `${type}-1`,
          type,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        store.getState().addConnection(connection);
      });
      
      expect(store.getState().connections).toHaveLength(4);
      expect(store.getState().connections.map(c => c.type)).toEqual(connectionTypes);
    });

    it('should filter connections by type', () => {
      const connections: TetherConnection[] = [
        {
          id: 'conn-1',
          userId: 'user-1',
          connectedUserId: 'helper-1',
          type: 'helper',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'conn-2',
          userId: 'user-1',
          connectedUserId: 'peer-1',
          type: 'peer',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'conn-3',
          userId: 'user-1',
          connectedUserId: 'helper-2',
          type: 'helper',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];

      connections.forEach(conn => store.getState().addConnection(conn));
      
      const helperConnections = store.getState().connections.filter(c => c.type === 'helper');
      expect(helperConnections).toHaveLength(2);
      
      const peerConnections = store.getState().connections.filter(c => c.type === 'peer');
      expect(peerConnections).toHaveLength(1);
    });
  });
});
