import { EventEmitter } from 'events';

// WebSocket connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

// Message types
export interface RealtimeMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  userId?: string;
  channel?: string;
}

// Channel subscription
export interface ChannelSubscription {
  id: string;
  channel: string;
  userId?: string;
  filters?: Record<string, any>;
  createdAt: Date;
}

// Connection configuration
export interface RealtimeConfig {
  url: string;
  apiKey?: string;
  userId?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  enableCompression?: boolean;
  protocols?: string[];
}

// Event types
export interface RealtimeEvents {
  'connection:state': (state: ConnectionState) => void;
  'connection:error': (error: Error) => void;
  'message:received': (message: RealtimeMessage) => void;
  'message:sent': (message: RealtimeMessage) => void;
  'channel:subscribed': (subscription: ChannelSubscription) => void;
  'channel:unsubscribed': (channelId: string) => void;
  'presence:join': (data: { userId: string; channel: string; metadata?: any }) => void;
  'presence:leave': (data: { userId: string; channel: string }) => void;
  'presence:update': (data: { userId: string; channel: string; metadata: any }) => void;
}

// Default configuration
const DEFAULT_CONFIG: Required<RealtimeConfig> = {
  url: '',
  apiKey: '',
  userId: '',
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  messageQueueSize: 1000,
  enableCompression: true,
  protocols: []
};

/**
 * Realtime Service
 * Manages WebSocket connections for real-time communication
 */
export class RealtimeService extends EventEmitter {
  private config: Required<RealtimeConfig>;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private messageQueue: RealtimeMessage[] = [];
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private messageId = 0;

  constructor(config: RealtimeConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to the realtime server
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.setConnectionState('connecting');

    try {
      const wsUrl = new URL(this.config.url);
      if (this.config.apiKey) {
        wsUrl.searchParams.set('apikey', this.config.apiKey);
      }
      if (this.config.userId) {
        wsUrl.searchParams.set('userId', this.config.userId);
      }

      const protocols = this.config.protocols.length > 0 ? this.config.protocols : undefined;
      this.ws = new WebSocket(wsUrl.toString(), protocols);

      if (this.config.enableCompression && 'extensions' in this.ws) {
        // Enable compression if supported
        (this.ws as any).extensions = 'permessage-deflate';
      }

      this.setupWebSocketListeners();

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          this.ws?.close();
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, 10000);

      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        const onOpen = () => {
          clearTimeout(connectionTimeout);
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          resolve();
        };

        const onError = (event: Event) => {
          clearTimeout(connectionTimeout);
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws?.addEventListener('open', onOpen);
        this.ws?.addEventListener('error', onError);
      });

    } catch (error) {
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from the realtime server
   */
  disconnect(): void {
    this.config.reconnect = false; // Disable auto-reconnect
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionState('disconnected');
  }

  /**
   * Send a message
   */
  send<T = any>(type: string, payload: T, channel?: string): string {
    const message: RealtimeMessage<T> = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: Date.now(),
      userId: this.config.userId,
      channel
    };

    if (this.connectionState === 'connected' && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
        this.emit('message:sent', message);
        return message.id;
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }

    return message.id;
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, filters?: Record<string, any>): Promise<string> {
    const subscriptionId = this.generateMessageId();
    const subscription: ChannelSubscription = {
      id: subscriptionId,
      channel,
      userId: this.config.userId,
      filters,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message
    this.send('subscribe', {
      subscriptionId,
      channel,
      filters
    });

    this.emit('channel:subscribed', subscription);
    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    this.subscriptions.delete(subscriptionId);

    // Send unsubscribe message
    this.send('unsubscribe', {
      subscriptionId
    });

    this.emit('channel:unsubscribed', subscriptionId);
  }

  /**
   * Join presence channel
   */
  joinPresence(channel: string, metadata?: any): void {
    this.send('presence:join', {
      channel,
      metadata
    });
  }

  /**
   * Leave presence channel
   */
  leavePresence(channel: string): void {
    this.send('presence:leave', {
      channel
    });
  }

  /**
   * Update presence metadata
   */
  updatePresence(channel: string, metadata: any): void {
    this.send('presence:update', {
      channel,
      metadata
    });
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): ChannelSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get message queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connectionState: ConnectionState;
    reconnectAttempts: number;
    subscriptions: number;
    queuedMessages: number;
    userId?: string;
  } {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: this.subscriptions.size,
      queuedMessages: this.messageQueue.length,
      userId: this.config.userId
    };
  }

  // Private methods
  private setupWebSocketListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
    };

    this.ws.onclose = (event) => {
      this.clearTimers();
      
      if (event.code === 1000) {
        // Normal closure
        this.setConnectionState('disconnected');
      } else if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.handleReconnect();
      } else {
        this.setConnectionState('failed');
      }
    };

    this.ws.onerror = (event) => {
      this.handleConnectionError(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  private handleMessage(message: RealtimeMessage): void {
    this.emit('message:received', message);

    // Handle system messages
    switch (message.type) {
      case 'pong':
        // Heartbeat response - no action needed
        break;
        
      case 'presence:join':
        this.emit('presence:join', message.payload);
        break;
        
      case 'presence:leave':
        this.emit('presence:leave', message.payload);
        break;
        
      case 'presence:update':
        this.emit('presence:update', message.payload);
        break;
        
      default:
        // Custom message types are handled by external listeners
        break;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection:state', state);
    }
  }

  private handleConnectionError(error: Error): void {
    this.emit('connection:error', error);
    
    if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.handleReconnect();
    } else {
      this.setConnectionState('failed');
    }
  }

  private handleReconnect(): void {
    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send('ping', {});
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private queueMessage(message: RealtimeMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    
    this.messageQueue.push(message);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.connectionState === 'connected') {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        try {
          this.ws.send(JSON.stringify(message));
          this.emit('message:sent', message);
        } catch (error) {
          // Re-queue if sending fails
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService({
  url: process.env.VITE_REALTIME_URL || 'ws://localhost:3001/realtime',
  apiKey: process.env.VITE_REALTIME_API_KEY,
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
});

export default realtimeService;
