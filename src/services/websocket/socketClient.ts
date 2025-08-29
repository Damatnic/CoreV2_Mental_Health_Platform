import io, { Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

// Types for WebSocket client
interface SocketConfig {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface QueuedEvent {
  event: string;
  data: any;
  timestamp: Date;
  retries: number;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  latency: number;
}

// Event types
export enum SocketEvents {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  RECONNECTED = 'reconnected',
  CONNECTION_ERROR = 'connection_error',
  
  // Crisis events
  CRISIS_ALERT = 'crisis-alert',
  CRISIS_ALERT_CONFIRMED = 'crisis-alert-confirmed',
  CRISIS_BROADCAST = 'crisis-alert-broadcast',
  CRISIS_STATUS_UPDATE = 'crisis-status-update',
  RESPONDER_ASSIGNED = 'responder-assigned',
  CRISIS_ESCALATED = 'crisis-escalated',
  CRISIS_RESOLVED = 'crisis-resolved',
  
  // Chat events
  NEW_MESSAGE = 'new-message',
  MESSAGE_SENT = 'message-sent',
  MESSAGE_DELIVERED = 'message-delivered',
  MESSAGE_READ = 'message-read',
  MESSAGE_EDITED = 'message-edited',
  MESSAGE_DELETED = 'message-deleted',
  TYPING_INDICATOR = 'typing-indicator',
  
  // Room events
  ROOM_JOINED = 'room-joined',
  ROOM_LEFT = 'room-left',
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  PARTICIPANT_JOINED = 'participant-joined',
  PARTICIPANT_LEFT = 'participant-left',
  
  // Status events
  USER_STATUS_CHANGE = 'user-status-change',
  PING = 'ping',
  PONG = 'pong',
  
  // Error events
  ERROR = 'error',
  UNAUTHORIZED = 'unauthorized'
}

class WebSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private connectionState: ConnectionState;
  private eventQueue: QueuedEvent[] = [];
  private encryptionKey: string | null = null;
  private sessionId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private offlineStartTime: Date | null = null;

  constructor(config: SocketConfig = {}) {
    super();
    
    this.config = {
      url: config.url || process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001',
      token: config.token,
      autoConnect: config.autoConnect !== false,
      reconnectionAttempts: config.reconnectionAttempts || 10,
      reconnectionDelay: config.reconnectionDelay || 1000
    };

    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      latency: 0
    };

    if (this.config.autoConnect && this.config.token) {
      this.connect();
    }

    // Handle page visibility changes
    this.setupVisibilityHandling();
    
    // Setup offline detection
    this.setupOfflineDetection();
  }

  /**
   * Connect to WebSocket server
   */
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (token) {
        this.config.token = token;
      }

      if (!this.config.token) {
        reject(new Error('No authentication token provided'));
        return;
      }

      this.connectionState.isConnecting = true;
      
      try {
        // Create socket connection
        this.socket = io(this.config.url!, {
          auth: {
            token: this.config.token
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.config.reconnectionAttempts,
          reconnectionDelay: this.config.reconnectionDelay,
          reconnectionDelayMax: 10000,
          timeout: 20000
        });

        this.setupEventHandlers();
        
        // Wait for connection
        this.socket.once('connect', () => {
          this.connectionState.isConnecting = false;
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          this.connectionState.isConnecting = false;
          reject(error);
        });
      } catch (error) {
        this.connectionState.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.clearTimers();
    this.connectionState.isConnected = false;
    this.connectionState.lastDisconnected = new Date();
    this.emit(SocketEvents.DISCONNECTED);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', (reason) => this.handleDisconnect(reason));
    this.socket.on('connect_error', (error) => this.handleConnectionError(error));
    
    // Server events
    this.socket.on('connected', (data) => this.handleServerConnected(data));
    this.socket.on('error', (error) => this.handleError(error));
    this.socket.on('pong', (data) => this.handlePong(data));
    
    // Forward all other events
    this.forwardEvents();
  }

  /**
   * Handle successful connection
   */
  private handleConnect(): void {
    console.log('WebSocket connected');
    
    this.connectionState.isConnected = true;
    this.connectionState.isConnecting = false;
    this.connectionState.lastConnected = new Date();
    this.connectionState.reconnectAttempts = 0;
    
    // Process queued events
    this.processEventQueue();
    
    // Start ping interval
    this.startPingInterval();
    
    // Calculate offline duration
    if (this.offlineStartTime) {
      const offlineDuration = Date.now() - this.offlineStartTime.getTime();
      console.log(`Was offline for ${Math.round(offlineDuration / 1000)} seconds`);
      this.offlineStartTime = null;
    }
    
    this.emit(SocketEvents.CONNECTED);
    
    // If this is a reconnection
    if (this.connectionState.lastDisconnected) {
      this.emit(SocketEvents.RECONNECTED);
    }
  }

  /**
   * Handle server connection confirmation
   */
  private handleServerConnected(data: any): void {
    this.sessionId = data.sessionId;
    this.encryptionKey = data.encryptionKey;
    
    console.log('Server confirmed connection:', {
      sessionId: this.sessionId,
      features: data.features,
      serverTime: data.serverTime
    });
    
    // Store encryption key securely
    if (this.encryptionKey) {
      this.storeEncryptionKey(this.encryptionKey);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(reason: string): void {
    console.log('WebSocket disconnected:', reason);
    
    this.connectionState.isConnected = false;
    this.connectionState.lastDisconnected = new Date();
    this.offlineStartTime = new Date();
    
    this.clearTimers();
    
    this.emit(SocketEvents.DISCONNECTED, reason);
    
    // Handle reconnection based on reason
    if (reason === 'io server disconnect') {
      // Server disconnected us, don't auto-reconnect
      console.log('Server disconnected the client');
    } else if (reason === 'transport close' || reason === 'transport error') {
      // Network issue, attempt reconnection
      this.attemptReconnection();
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: any): void {
    console.error('WebSocket connection error:', error);
    
    this.connectionState.isConnecting = false;
    
    if (error.type === 'TransportError') {
      this.attemptReconnection();
    }
    
    this.emit(SocketEvents.CONNECTION_ERROR, error);
  }

  /**
   * Handle general errors
   */
  private handleError(error: any): void {
    console.error('WebSocket error:', error);
    this.emit(SocketEvents.ERROR, error);
  }

  /**
   * Handle pong response
   */
  private handlePong(data: any): void {
    this.connectionState.latency = data.latency || 0;
    this.emit(SocketEvents.PONG, data);
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.connectionState.reconnectAttempts >= this.config.reconnectionAttempts!) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.connectionState.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectionDelay! * Math.pow(2, this.connectionState.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    console.log(`Attempting reconnection ${this.connectionState.reconnectAttempts} in ${delay}ms`);
    
    this.emit(SocketEvents.RECONNECTING, {
      attempt: this.connectionState.reconnectAttempts,
      maxAttempts: this.config.reconnectionAttempts,
      delay
    });
    
    this.reconnectTimer = setTimeout(() => {
      if (this.config.token) {
        this.connect(this.config.token).catch(error => {
          console.error('Reconnection failed:', error);
          this.attemptReconnection();
        });
      }
    }, delay);
  }

  /**
   * Forward all events to listeners
   */
  private forwardEvents(): void {
    if (!this.socket) return;
    
    // List of events to forward
    const eventsToForward = [
      // Crisis events
      'crisis-alert-broadcast',
      'crisis-status-changed',
      'responder-assigned',
      'crisis-escalated',
      'crisis-resolved',
      'emergency-escalation-broadcast',
      
      // Chat events
      'new-message',
      'message-sent',
      'message-delivered',
      'message-read',
      'message-edited',
      'message-deleted',
      'typing-indicator',
      'queued-messages',
      
      // Room events
      'room-joined',
      'room-left',
      'room-error',
      'user-joined',
      'user-left',
      'participant-joined',
      'participant-left',
      
      // Status events
      'user-status-change',
      'user-location-update',
      
      // System events
      'notification',
      'announcement'
    ];
    
    eventsToForward.forEach(event => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  /**
   * Emit event to server
   */
  public emit(event: string, data?: any): void {
    if (event.startsWith('socket:')) {
      // Internal event
      super.emit(event, data);
      return;
    }
    
    if (!this.socket?.connected) {
      // Queue event if not connected
      this.queueEvent(event, data);
      return;
    }
    
    this.socket.emit(event, data);
  }

  /**
   * Send message
   */
  public sendMessage(roomId: string, content: string, metadata?: any): void {
    this.emit('send-message', {
      roomId,
      content,
      type: 'text',
      ...metadata
    });
  }

  /**
   * Join room
   */
  public joinRoom(roomId: string, roomType: string, metadata?: any): void {
    this.emit('join-room', {
      roomId,
      roomType,
      metadata
    });
  }

  /**
   * Leave room
   */
  public leaveRoom(roomId: string): void {
    this.emit('leave-room', { roomId });
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(roomId: string, isTyping: boolean): void {
    this.emit('typing', {
      roomId,
      isTyping
    });
  }

  /**
   * Send read receipt
   */
  public sendReadReceipt(messageId: string, roomId: string): void {
    this.emit('read-receipt', {
      messageId,
      roomId
    });
  }

  /**
   * Trigger crisis alert
   */
  public triggerCrisisAlert(severity: string, message: string, location?: any): void {
    this.emit('crisis-alert', {
      severity,
      message,
      location,
      timestamp: new Date()
    });
  }

  /**
   * Share location
   */
  public shareLocation(location: any, alertId?: string): void {
    this.emit('share-location', {
      ...location,
      alertId
    });
  }

  /**
   * Queue event for later sending
   */
  private queueEvent(event: string, data: any): void {
    const queuedEvent: QueuedEvent = {
      event,
      data,
      timestamp: new Date(),
      retries: 0
    };
    
    this.eventQueue.push(queuedEvent);
    
    // Limit queue size
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift(); // Remove oldest
    }
  }

  /**
   * Process queued events
   */
  private processEventQueue(): void {
    if (!this.socket?.connected || this.eventQueue.length === 0) return;
    
    console.log(`Processing ${this.eventQueue.length} queued events`);
    
    const queue = [...this.eventQueue];
    this.eventQueue = [];
    
    queue.forEach(queuedEvent => {
      // Skip old events (older than 5 minutes)
      const age = Date.now() - queuedEvent.timestamp.getTime();
      if (age < 5 * 60 * 1000) {
        this.socket!.emit(queuedEvent.event, queuedEvent.data);
      }
    });
  }

  /**
   * Start ping interval for connection health
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        const startTime = Date.now();
        this.socket.emit('ping');
        
        // Timeout if no pong received
        setTimeout(() => {
          if (Date.now() - startTime > 5000) {
            console.warn('Ping timeout, connection may be lost');
          }
        }, 5000);
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Setup page visibility handling
   */
  private setupVisibilityHandling(): void {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, reduce activity
        this.clearTimers();
      } else {
        // Page is visible, ensure connection
        if (this.config.token && !this.socket?.connected) {
          this.connect(this.config.token);
        } else if (this.socket?.connected) {
          this.startPingInterval();
        }
      }
    });
  }

  /**
   * Setup offline detection
   */
  private setupOfflineDetection(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      console.log('Network is online');
      if (this.config.token && !this.socket?.connected) {
        this.connect(this.config.token);
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('Network is offline');
      this.offlineStartTime = new Date();
    });
  }

  /**
   * Store encryption key securely
   */
  private storeEncryptionKey(key: string): void {
    // In production, use secure storage
    // For now, store in memory
    this.encryptionKey = key;
  }

  /**
   * Get connection state
   */
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get latency
   */
  public getLatency(): number {
    return this.connectionState.latency;
  }

  /**
   * Subscribe to event
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    super.on(event, callback as any);
  }

  /**
   * Unsubscribe from event
   */
  public off(event: string, callback?: Function): void {
    if (callback) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
      super.off(event, callback as any);
    } else {
      this.eventListeners.delete(event);
      super.removeAllListeners(event);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.disconnect();
    this.clearTimers();
    this.eventQueue = [];
    this.eventListeners.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
let instance: WebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(config?: SocketConfig): WebSocketClient {
  if (!instance) {
    instance = new WebSocketClient(config);
  }
  return instance;
}

export default WebSocketClient;