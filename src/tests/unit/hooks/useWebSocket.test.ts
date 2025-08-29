import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import useWebSocket from '../../../hooks/useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;
  public protocol: string = '';
  
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    // Echo back the message for testing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: `echo: ${data}`
        }));
      }
    }, 5);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  // Mock methods for testing
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code: number = 1000, reason: string = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws')
      );

      expect(result.current.readyState).toBe(MockWebSocket.CONNECTING);

      await waitFor(() => {
        expect(result.current.readyState).toBe(MockWebSocket.OPEN);
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should handle connection with protocols', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          protocols: ['chat', 'superchat']
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should reconnect automatically on connection loss', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          shouldReconnect: true,
          reconnectInterval: 100
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate connection loss
      const ws = result.current.ws as any;
      act(() => {
        ws.simulateClose(1006, 'Connection lost');
      });

      expect(result.current.isConnected).toBe(false);

      // Should attempt to reconnect
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 1000 });
    });

    it('should not reconnect when shouldReconnect is false', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          shouldReconnect: false
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;
      act(() => {
        ws.simulateClose(1000, 'Normal closure');
      });

      expect(result.current.isConnected).toBe(false);
      
      // Wait and verify no reconnection
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(result.current.isConnected).toBe(false);
    });

    it('should limit reconnection attempts', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/invalid', {
          shouldReconnect: true,
          reconnectAttempts: 3,
          reconnectInterval: 50
        })
      );

      // Mock connection failure
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.simulateError();
            this.simulateClose(1006, 'Connection failed');
          }, 10);
        }
      } as any;

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(3);
        expect(result.current.isConnected).toBe(false);
      }, { timeout: 1000 });

      global.WebSocket = originalWebSocket;
    });

    it('should close connection manually', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws')
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.close();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe('Message Handling', () => {
    it('should send and receive messages', async () => {
      const onMessage = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', { onMessage })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const testMessage = 'Hello WebSocket!';
      
      act(() => {
        result.current.sendMessage(testMessage);
      });

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            data: `echo: ${testMessage}`
          })
        );
      });
    });

    it('should handle JSON messages', async () => {
      const onMessage = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', { 
          onMessage,
          parseJSON: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const jsonMessage = { type: 'chat', content: 'Hello!', timestamp: Date.now() };
      
      act(() => {
        result.current.sendJsonMessage(jsonMessage);
      });

      // Simulate JSON response
      const ws = result.current.ws as any;
      act(() => {
        ws.simulateMessage(JSON.stringify({ 
          type: 'response', 
          data: jsonMessage 
        }));
      });

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'response',
            data: jsonMessage
          })
        );
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const onMessage = jest.fn();
      const onError = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', { 
          onMessage,
          onError,
          parseJSON: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;
      act(() => {
        ws.simulateMessage('{"invalid": json}');
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should queue messages when disconnected', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          queueMessages: true
        })
      );

      // Send message before connection is established
      act(() => {
        result.current.sendMessage('Queued message 1');
        result.current.sendMessage('Queued message 2');
      });

      expect(result.current.messageQueue.length).toBe(2);

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Messages should be sent after connection
      await waitFor(() => {
        expect(result.current.messageQueue.length).toBe(0);
      });
    });

    it('should handle binary messages', async () => {
      const onMessage = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', { onMessage })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const binaryData = new ArrayBuffer(8);
      const ws = result.current.ws as any;
      
      act(() => {
        ws.simulateMessage(binaryData);
      });

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            data: binaryData
          })
        );
      });
    });
  });

  describe('Crisis Communication Features', () => {
    it('should prioritize crisis messages', async () => {
      const onMessage = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://crisis-support:8080/ws', { 
          onMessage,
          parseJSON: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const crisisMessage = {
        type: 'crisis_alert',
        priority: 'critical',
        userId: 'user-123',
        content: 'User expressing suicidal ideation'
      };

      act(() => {
        result.current.sendCrisisMessage(crisisMessage);
      });

      // Crisis messages should bypass normal queue
      expect(result.current.priorityMessageQueue.length).toBe(0);
    });

    it('should handle crisis response protocols', async () => {
      const onCrisisMessage = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://crisis-support:8080/ws', { 
          onCrisisMessage,
          parseJSON: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;
      const crisisResponse = {
        type: 'crisis_response',
        action: 'connect_988',
        sessionId: 'crisis-session-456',
        resources: ['988', 'local_crisis_center']
      };

      act(() => {
        ws.simulateMessage(JSON.stringify(crisisResponse));
      });

      await waitFor(() => {
        expect(onCrisisMessage).toHaveBeenCalledWith(crisisResponse);
      });
    });

    it('should maintain heartbeat for crisis sessions', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://crisis-support:8080/ws', {
          heartbeatInterval: 30000, // 30 seconds
          isCrisisSession: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const sendMessageSpy = jest.spyOn(result.current, 'sendMessage');

      // Fast-forward to trigger heartbeat
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('heartbeat')
      );

      jest.useRealTimers();
    });

    it('should handle emergency disconnection protocols', async () => {
      const onEmergencyDisconnect = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://crisis-support:8080/ws', {
          onEmergencyDisconnect,
          isCrisisSession: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;
      act(() => {
        ws.simulateClose(4001, 'Emergency protocol activated');
      });

      expect(onEmergencyDisconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 4001,
          reason: 'Emergency protocol activated'
        })
      );
    });
  });

  describe('Performance and Optimization', () => {
    it('should throttle message sending', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          throttleInterval: 100
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const sendSpy = jest.spyOn(result.current.ws!, 'send');

      // Send multiple messages rapidly
      act(() => {
        result.current.sendMessage('Message 1');
        result.current.sendMessage('Message 2');
        result.current.sendMessage('Message 3');
      });

      // Only one message should be sent immediately
      expect(sendSpy).toHaveBeenCalledTimes(1);

      // Fast-forward throttle interval
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(sendSpy).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should manage connection pool for multiple endpoints', async () => {
      const { result: result1 } = renderHook(() => 
        useWebSocket('ws://endpoint1:8080/ws')
      );
      
      const { result: result2 } = renderHook(() => 
        useWebSocket('ws://endpoint2:8080/ws')
      );

      await waitFor(() => {
        expect(result1.current.isConnected).toBe(true);
        expect(result2.current.isConnected).toBe(true);
      });

      // Both connections should be independent
      expect(result1.current.ws).not.toBe(result2.current.ws);
    });

    it('should cleanup resources on unmount', async () => {
      const { result, unmount } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws')
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const closeSpy = jest.spyOn(result.current.ws!, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle memory-efficient message history', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          messageHistorySize: 100
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;

      // Send more messages than history size
      for (let i = 0; i < 150; i++) {
        act(() => {
          ws.simulateMessage(`Message ${i}`);
        });
      }

      await waitFor(() => {
        expect(result.current.messageHistory.length).toBe(100);
        expect(result.current.messageHistory[0].data).toContain('Message 50');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle connection errors', async () => {
      const onError = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://invalid-url', { onError })
      );

      const ws = result.current.ws as any;
      act(() => {
        ws.simulateError();
      });

      expect(onError).toHaveBeenCalled();
      expect(result.current.hasError).toBe(true);
    });

    it('should implement exponential backoff for reconnection', async () => {
      jest.useFakeTimers();
      
      let connectionAttempts = 0;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          connectionAttempts++;
          setTimeout(() => {
            this.simulateError();
            this.simulateClose(1006, 'Connection failed');
          }, 10);
        }
      } as any;

      const { result } = renderHook(() => 
        useWebSocket('ws://unreliable-server', {
          shouldReconnect: true,
          reconnectAttempts: 5,
          reconnectInterval: 1000,
          exponentialBackoff: true
        })
      );

      // Fast-forward through multiple reconnection attempts
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(Math.pow(2, i) * 1000);
        });
        
        await waitFor(() => {
          expect(connectionAttempts).toBe(i + 1);
        });
      }

      jest.useRealTimers();
    });

    it('should handle WebSocket close codes appropriately', async () => {
      const onClose = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          onClose,
          shouldReconnect: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;

      // Test different close codes
      act(() => {
        ws.simulateClose(1000, 'Normal closure');
      });

      expect(onClose).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1000,
          reason: 'Normal closure'
        })
      );

      // Should not reconnect for normal closure
      expect(result.current.shouldReconnect).toBe(false);

      // Test abnormal closure
      act(() => {
        ws.simulateClose(1006, 'Connection lost');
      });

      // Should attempt to reconnect for abnormal closure
      expect(result.current.reconnectAttempts).toBeGreaterThan(0);
    });

    it('should validate message format before sending', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          validateMessages: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Try to send invalid message
      const invalidMessage = { circular: {} };
      invalidMessage.circular = invalidMessage; // Circular reference

      act(() => {
        result.current.sendJsonMessage(invalidMessage);
      });

      expect(result.current.lastError).toContain('validation failed');
    });
  });

  describe('Security Features', () => {
    it('should validate WebSocket origin', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          validateOrigin: true,
          allowedOrigins: ['http://localhost:3000', 'https://app.example.com']
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should encrypt sensitive messages', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://secure-endpoint:8080/ws', {
          encryptMessages: true,
          encryptionKey: 'test-key-123'
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const sensitiveMessage = {
        type: 'sensitive_data',
        content: 'Personal health information',
        userId: 'user-123'
      };

      act(() => {
        result.current.sendSecureMessage(sensitiveMessage);
      });

      // Message should be encrypted before sending
      expect(result.current.lastSentMessage).not.toContain('Personal health information');
    });

    it('should implement message rate limiting', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          rateLimit: {
            maxMessages: 10,
            timeWindow: 60000 // 1 minute
          }
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Send messages up to the limit
      for (let i = 0; i < 12; i++) {
        act(() => {
          result.current.sendMessage(`Message ${i}`);
        });
      }

      expect(result.current.rateLimitExceeded).toBe(true);
      expect(result.current.messageQueue.length).toBe(2); // Last 2 messages queued

      // Fast-forward time window
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(result.current.rateLimitExceeded).toBe(false);

      jest.useRealTimers();
    });

    it('should sanitize incoming messages', async () => {
      const onMessage = jest.fn();
      
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080/ws', {
          onMessage,
          sanitizeMessages: true
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const ws = result.current.ws as any;
      const maliciousMessage = '<script>alert("xss")</script>Hello World';

      act(() => {
        ws.simulateMessage(maliciousMessage);
      });

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            data: 'Hello World' // Script tag removed
          })
        );
      });
    });
  });
});