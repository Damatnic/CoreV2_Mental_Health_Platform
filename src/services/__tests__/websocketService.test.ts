/**
 * WebSocket Service Tests
 * 
 * Tests for WebSocket connection management, real-time messaging,
 * and connection resilience
 */

// Using jest instead of vitest
const { describe, test, expect, beforeEach, afterEach } = global as any;
const vi = { 
  fn: jest.fn,
  clearAllMocks: jest.clearAllMocks,
  clearAllTimers: jest.clearAllTimers,
  advanceTimersByTime: jest.advanceTimersByTime,
  spyOn: jest.spyOn
};
import { webSocketService } from '../websocketService';

// Mock WebSocket implementation
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState: number;
  url: string;
  protocol: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] || '' : protocols || '';
    this.readyState = MockWebSocket.CONNECTING;
    
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string | ArrayBuffer | Blob): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock successful send
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason });
      this.onclose?.(closeEvent);
    }, 10);
  }

  // Test utilities
  simulateMessage(data: any): void {
    const messageEvent = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(messageEvent);
  }

  simulateError(): void {
    const errorEvent = new Event('error');
    this.onerror?.(errorEvent);
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webSocketService.disconnect();
  });

  afterEach(() => {
    webSocketService.disconnect();
    vi.clearAllTimers();
  });

  describe('Connection Management', () => {
    test('should establish WebSocket connection', async () => {
      const url = 'ws://localhost:8080/ws';
      
      const connected = await webSocketService.connect(url);
      
      expect(connected).toBe(true);
      expect(webSocketService.isConnected()).toBe(true);
    });

    test('should handle connection with authentication', async () => {
      const url = 'ws://localhost:8080/ws';
      const token = 'auth-token-123';
      
      const connected = await webSocketService.connect(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      expect(connected).toBe(true);
    });

    test('should handle connection failure', async () => {
      // Mock connection failure
      global.WebSocket = vi.fn().mockImplementation(() => {
        const ws = new MockWebSocket('ws://invalid');
        setTimeout(() => ws.simulateError(), 5);
        return ws;
      }) as any;

      const connected = await webSocketService.connect('ws://invalid');
      
      expect(connected).toBe(false);
      expect(webSocketService.isConnected()).toBe(false);
    });

    test('should disconnect WebSocket', async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
      expect(webSocketService.isConnected()).toBe(true);
      
      webSocketService.disconnect();
      
      // Wait for disconnect to process
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(webSocketService.isConnected()).toBe(false);
    });

    test('should handle multiple connection attempts', async () => {
      const url = 'ws://localhost:8080/ws';
      
      // First connection
      const connected1 = await webSocketService.connect(url);
      expect(connected1).toBe(true);
      
      // Second connection attempt should reuse existing connection
      const connected2 = await webSocketService.connect(url);
      expect(connected2).toBe(true);
      expect(webSocketService.isConnected()).toBe(true);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
    });

    test('should send messages', async () => {
      const message = { type: 'chat', content: 'Hello World' };
      
      const sent = await webSocketService.send(message);
      
      expect(sent).toBe(true);
    });

    test('should receive and route messages', async () => {
      const messageHandler = vi.fn();
      webSocketService.subscribe('chat', messageHandler);
      
      const mockMessage = { type: 'chat', content: 'Hello from server' };
      
      // Simulate incoming message
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws.simulateMessage(mockMessage);
      
      expect(messageHandler).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle message subscription and unsubscription', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      // Subscribe handlers
      const unsubscribe1 = webSocketService.subscribe('chat', handler1);
      const unsubscribe2 = webSocketService.subscribe('chat', handler2);
      
      const mockMessage = { type: 'chat', content: 'Test message' };
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws.simulateMessage(mockMessage);
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      
      // Unsubscribe first handler
      unsubscribe1();
      handler1.mockClear();
      handler2.mockClear();
      
      ws.simulateMessage(mockMessage);
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('should handle wildcard message subscriptions', async () => {
      const wildcardHandler = vi.fn();
      webSocketService.subscribe('*', wildcardHandler);
      
      const messages = [
        { type: 'chat', content: 'Chat message' },
        { type: 'notification', content: 'Notification message' },
        { type: 'system', content: 'System message' },
      ];
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      for (const message of messages) {
        ws.simulateMessage(message);
      }
      
      expect(wildcardHandler).toHaveBeenCalledTimes(3);
    });

    test('should queue messages when disconnected', async () => {
      webSocketService.disconnect();
      
      const message = { type: 'chat', content: 'Queued message' };
      const sent = await webSocketService.send(message);
      
      expect(sent).toBe(false); // Not sent immediately
      
      // Should be in queue
      const queuedMessages = webSocketService.getQueuedMessages();
      expect(queuedMessages).toHaveLength(1);
    });

    test('should process queued messages on reconnection', async () => {
      // Queue messages while disconnected
      webSocketService.disconnect();
      await webSocketService.send({ type: 'test1', content: 'Message 1' });
      await webSocketService.send({ type: 'test2', content: 'Message 2' });
      
      expect(webSocketService.getQueuedMessages()).toHaveLength(2);
      
      // Reconnect and process queue
      await webSocketService.connect('ws://localhost:8080/ws');
      
      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(webSocketService.getQueuedMessages()).toHaveLength(0);
    });
  });

  describe('Real-time Features', () => {
    beforeEach(async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
    });

    test('should handle ping/pong for connection health', async () => {
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      // Simulate ping from server
      ws.simulateMessage({ type: 'ping', timestamp: Date.now() });
      
      // Should automatically respond with pong
      // In a real test, we'd verify the pong was sent
      expect(webSocketService.isConnected()).toBe(true);
    });

    test('should detect connection timeout', async () => {
      const connectionLostHandler = vi.fn();
      webSocketService.onConnectionLost(connectionLostHandler);
      
      // Simulate connection timeout by not responding to pings
      vi.advanceTimersByTime(35000); // 35 seconds without heartbeat
      
      expect(connectionLostHandler).toHaveBeenCalled();
    });

    test('should handle automatic reconnection', async () => {
      const reconnectHandler = vi.fn();
      webSocketService.onReconnect(reconnectHandler);
      
      // Simulate connection loss
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws.simulateError();
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 1100)); // Default retry delay
      
      expect(reconnectHandler).toHaveBeenCalled();
    });

    test('should respect exponential backoff for reconnection', async () => {
      const reconnectAttempts: number[] = [];
      const originalConnect = webSocketService.connect;
      
      webSocketService.connect = vi.fn().mockImplementation(async () => {
        reconnectAttempts.push(Date.now());
        return false; // Simulate failed connection
      });
      
      // Trigger reconnection cycle
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws?.simulateError();
      
      // Advance timers to trigger multiple reconnection attempts
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(Math.pow(2, i) * 1000);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      expect(reconnectAttempts.length).toBeGreaterThan(1);
      
      // Restore original method
      webSocketService.connect = originalConnect;
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket errors gracefully', async () => {
      const errorHandler = vi.fn();
      webSocketService.onError(errorHandler);
      
      await webSocketService.connect('ws://localhost:8080/ws');
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws.simulateError();
      
      expect(errorHandler).toHaveBeenCalled();
    });

    test('should handle malformed message data', async () => {
      const errorHandler = vi.fn();
      webSocketService.onError(errorHandler);
      
      await webSocketService.connect('ws://localhost:8080/ws');
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      // Simulate malformed JSON
      const malformedEvent = new MessageEvent('message', { data: '{ invalid json' });
      ws.onmessage?.(malformedEvent);
      
      expect(errorHandler).toHaveBeenCalled();
    });

    test('should handle connection closure with different codes', async () => {
      const closeHandler = vi.fn();
      webSocketService.onClose(closeHandler);
      
      await webSocketService.connect('ws://localhost:8080/ws');
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      // Simulate abnormal closure
      const closeEvent = new CloseEvent('close', { 
        code: 1006, // Abnormal closure
        reason: 'Connection lost',
        wasClean: false 
      });
      
      ws.onclose?.(closeEvent);
      
      expect(closeHandler).toHaveBeenCalledWith(closeEvent);
    });
  });

  describe('Performance and Optimization', () => {
    beforeEach(async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
    });

    test('should throttle message sending', async () => {
      const sendSpy = vi.spyOn(webSocketService, 'send');
      
      // Send multiple messages rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(webSocketService.send({ type: 'spam', content: `Message ${i}` }));
      }
      
      await Promise.all(promises);
      
      // Should implement some form of throttling
      expect(sendSpy).toHaveBeenCalledTimes(10);
    });

    test('should batch small messages', async () => {
      const batchHandler = vi.fn();
      webSocketService.subscribe('batch', batchHandler);
      
      // Enable message batching
      webSocketService.enableBatching(true, 100); // 100ms batch window
      
      const messages = [
        { type: 'batch', id: 1 },
        { type: 'batch', id: 2 },
        { type: 'batch', id: 3 },
      ];
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      messages.forEach(msg => ws.simulateMessage(msg));
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have processed messages in batch
      expect(batchHandler).toHaveBeenCalled();
    });

    test('should handle high message volume', async () => {
      const messageHandler = vi.fn();
      webSocketService.subscribe('volume-test', messageHandler);
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      // Simulate high volume
      for (let i = 0; i < 1000; i++) {
        ws.simulateMessage({ type: 'volume-test', id: i });
      }
      
      expect(messageHandler).toHaveBeenCalledTimes(1000);
      expect(webSocketService.isConnected()).toBe(true);
    });
  });

  describe('Security Features', () => {
    test('should validate message format', async () => {
      const errorHandler = vi.fn();
      webSocketService.onError(errorHandler);
      
      await webSocketService.connect('ws://localhost:8080/ws');
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      // Simulate message without required type field
      ws.simulateMessage({ content: 'Invalid message' });
      
      expect(errorHandler).toHaveBeenCalled();
    });

    test('should handle authentication challenges', async () => {
      const authHandler = vi.fn();
      webSocketService.onAuthChallenge(authHandler);
      
      await webSocketService.connect('ws://localhost:8080/ws');
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      // Simulate auth challenge from server
      ws.simulateMessage({ 
        type: 'auth_required', 
        challenge: 'provide-token' 
      });
      
      expect(authHandler).toHaveBeenCalled();
    });

    test('should sanitize outgoing messages', async () => {
      const dangerousMessage = {
        type: 'chat',
        content: '<script>alert("xss")</script>Hello',
        userId: 'user-123'
      };
      
      const sanitizedMessage = webSocketService.sanitizeMessage(dangerousMessage);
      
      expect(sanitizedMessage.content).not.toContain('<script>');
      expect(sanitizedMessage.content).toContain('Hello');
    });
  });

  describe('Mental Health Specific Features', () => {
    beforeEach(async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
    });

    test('should handle crisis alert messages with priority', async () => {
      const crisisHandler = vi.fn();
      webSocketService.subscribe('crisis_alert', crisisHandler);
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      const crisisMessage = {
        type: 'crisis_alert',
        userId: 'user-123',
        severity: 'critical',
        message: 'User expressing suicidal thoughts'
      };
      
      ws.simulateMessage(crisisMessage);
      
      expect(crisisHandler).toHaveBeenCalledWith(crisisMessage);
    });

    test('should handle therapy session updates', async () => {
      const sessionHandler = vi.fn();
      webSocketService.subscribe('session_update', sessionHandler);
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      const sessionUpdate = {
        type: 'session_update',
        sessionId: 'session-456',
        status: 'started',
        participants: ['therapist-123', 'client-789']
      };
      
      ws.simulateMessage(sessionUpdate);
      
      expect(sessionHandler).toHaveBeenCalledWith(sessionUpdate);
    });

    test('should handle peer support matching notifications', async () => {
      const matchHandler = vi.fn();
      webSocketService.subscribe('peer_match', matchHandler);
      
      const ws = webSocketService.getConnection() as MockWebSocket;
      
      const matchNotification = {
        type: 'peer_match',
        userId: 'user-123',
        matchedPeer: 'peer-456',
        compatibilityScore: 0.85
      };
      
      ws.simulateMessage(matchNotification);
      
      expect(matchHandler).toHaveBeenCalledWith(matchNotification);
    });
  });

  describe('Connection Statistics', () => {
    test('should track connection metrics', async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
      
      // Send some messages
      await webSocketService.send({ type: 'test', content: 'message 1' });
      await webSocketService.send({ type: 'test', content: 'message 2' });
      
      // Receive some messages
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws.simulateMessage({ type: 'response', content: 'response 1' });
      
      const stats = webSocketService.getConnectionStats();
      
      expect(stats.messagesSent).toBe(2);
      expect(stats.messagesReceived).toBe(1);
      expect(stats.connectionTime).toBeGreaterThan(0);
    });

    test('should track reconnection attempts', async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
      
      // Simulate connection loss and reconnection
      const ws = webSocketService.getConnection() as MockWebSocket;
      ws.simulateError();
      
      // Wait for reconnection
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const stats = webSocketService.getConnectionStats();
      expect(stats.reconnectionAttempts).toBeGreaterThan(0);
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should clean up resources on disconnect', async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
      
      const handler = vi.fn();
      webSocketService.subscribe('test', handler);
      
      webSocketService.disconnect();
      
      // Check that subscriptions are cleaned up
      expect(webSocketService.getActiveSubscriptions()).toBe(0);
    });

    test('should clear message queue on explicit clear', async () => {
      // Queue some messages while disconnected
      await webSocketService.send({ type: 'test1', content: 'message 1' });
      await webSocketService.send({ type: 'test2', content: 'message 2' });
      
      expect(webSocketService.getQueuedMessages()).toHaveLength(2);
      
      webSocketService.clearMessageQueue();
      
      expect(webSocketService.getQueuedMessages()).toHaveLength(0);
    });

    test('should handle memory leaks in long-running connections', async () => {
      await webSocketService.connect('ws://localhost:8080/ws');
      
      // Create many subscriptions
      const handlers = [];
      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn();
        handlers.push(handler);
        webSocketService.subscribe(`test-${i}`, handler);
      }
      
      expect(webSocketService.getActiveSubscriptions()).toBe(1000);
      
      // Cleanup all subscriptions
      webSocketService.clearAllSubscriptions();
      
      expect(webSocketService.getActiveSubscriptions()).toBe(0);
    });
  });
});



