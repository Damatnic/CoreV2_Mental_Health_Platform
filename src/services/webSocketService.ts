/**
 * WebSocket Service for Real-time Communication
 * Handles real-time messaging, notifications, and live updates
 */

export type WebSocketEvent = 
  | 'connect'
  | 'disconnect'
  | 'message'
  | 'notification'
  | 'typing'
  | 'presence'
  | 'crisis_alert'
  | 'system_update'
  | 'heartbeat'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketEvent | string;
  payload: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface ConnectionConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export interface WebSocketEventHandler {
  (message: WebSocketMessage): void;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Mock notification service for this implementation
const mockNotificationService = {
  showNotification: (notification: NotificationPayload): void => {
    console.log('Notification:', notification);
  }
};

// Mock logger for this implementation
const mockLogger = {
  info: (message: string, meta?: any) => console.log(message, meta),
  warn: (message: string, meta?: any) => console.warn(message, meta),
  error: (message: string, meta?: any) => console.error(message, meta),
  debug: (message: string, meta?: any) => console.debug(message, meta)
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private connectionTimeout: number | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(config: ConnectionConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      timeout: 10000,
      ...config
    };
    
    this.maxReconnectAttempts = this.config.reconnectAttempts!;
    this.reconnectDelay = this.config.reconnectDelay!;
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      
      // Set connection timeout
      this.connectionTimeout = window.setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.config.timeout);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);

    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimeouts();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Send message through WebSocket
   */
  public send(type: WebSocketEvent | string, payload: any): void {
    if (!this.isConnected()) {
      mockLogger.warn('WebSocket not connected, cannot send message:', { type, payload });
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    };

    try {
      this.ws!.send(JSON.stringify(message));
      mockLogger.debug('WebSocket message sent:', message);
    } catch (error) {
      mockLogger.error('Failed to send WebSocket message:', error);
    }
  }

  /**
   * Send message with full message object
   */
  public sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      mockLogger.warn('WebSocket not connected, cannot send message:', message);
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
      mockLogger.debug('WebSocket message sent:', message);
    } catch (error) {
      mockLogger.error('Failed to send WebSocket message:', error);
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  public on(event: WebSocketEvent | string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  public off(event: WebSocketEvent | string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  public getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    mockLogger.info('WebSocket connected successfully');
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.clearTimeouts();
    this.startHeartbeat();
    
    this.emit('connect', { type: 'connect', payload: { event }, timestamp: Date.now() });
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    mockLogger.info('WebSocket connection closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    this.isConnecting = false;
    this.clearTimeouts();
    
    this.emit('disconnect', { type: 'disconnect', payload: { event }, timestamp: Date.now() });
    
    // Attempt reconnection if appropriate
    if (this.shouldReconnect && event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    mockLogger.error('WebSocket error occurred:', event);
    this.handleConnectionError(new Error('WebSocket error'));
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      mockLogger.debug('WebSocket message received:', message);
      
      this.emit(message.type, message);
      
      // Handle special message types
      if (message.type === 'crisis_alert') {
        this.handleCrisisAlert(message);
      }
      
    } catch (error) {
      mockLogger.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle crisis alerts
   */
  private handleCrisisAlert(message: WebSocketMessage): void {
    try {
      mockNotificationService.showNotification({
        id: `crisis_${Date.now()}`,
        title: 'Crisis Alert',
        message: message.payload?.message || 'Crisis support resources are available',
        type: 'error',
        persistent: true,
        actions: [
          {
            label: 'Get Help',
            action: () => {
              if (typeof window !== 'undefined') {
                window.open('tel:988', '_blank');
              }
            }
          },
          {
            label: 'Dismiss',
            action: () => {}
          }
        ]
      });
    } catch (error) {
      mockLogger.error('Failed to handle crisis alert:', error);
    }
  }

  /**
   * Emit event to registered handlers
   */
  private emit(event: string, data: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          mockLogger.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: any): void {
    mockLogger.error('WebSocket connection error:', error);
    this.isConnecting = false;
    
    this.emit('error', { 
      type: 'error', 
      payload: { error: error.message || 'Connection error' }, 
      timestamp: Date.now() 
    });

    if (this.shouldReconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      mockLogger.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    mockLogger.info(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(error => {
          mockLogger.error('Reconnection attempt failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.send('heartbeat', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval!);
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    connected: boolean;
    connectionState: string;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    eventHandlers: string[];
    config: ConnectionConfig;
  } {
    return {
      connected: this.isConnected(),
      connectionState: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      eventHandlers: Array.from(this.eventHandlers.keys()),
      config: this.config
    };
  }

  /**
   * Channel-based messaging methods
   */
  public async sendToChannel(channelId: string, message: any): Promise<void> {
    this.send('channel-message', { channelId, ...message });
  }

  public async createChannel(channelId: string, options?: any): Promise<void> {
    this.send('create-channel', { channelId, options });
  }

  public async addToChannel(channelId: string, userId: string): Promise<void> {
    this.send('join-channel', { channelId, userId });
  }

  public async removeFromChannel(channelId: string, userId: string): Promise<void> {
    this.send('leave-channel', { channelId, userId });
  }

  public async broadcastToChannel(channelId: string, message: any): Promise<void> {
    this.send('broadcast-channel', { channelId, ...message });
  }

  public async broadcast(message: any): Promise<void> {
    this.send('broadcast', message);
  }

  public async sendToUser(userId: string, message: any): Promise<void> {
    this.send('direct-message', { userId, ...message });
  }

  public async ping(): Promise<void> {
    this.send('ping', { timestamp: Date.now() });
  }

  public async closeChannel(channelId: string): Promise<void> {
    this.send('close-channel', { channelId });
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    this.disconnect();
    this.eventHandlers.clear();
  }
}

// Create default configuration
const getDefaultConfig = (): ConnectionConfig => ({
  url: (typeof process !== 'undefined' && process.env?.REACT_APP_WS_URL) || 'wss://localhost:3001/ws',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  timeout: 10000
});

// Export singleton instance
export const webSocketService = new WebSocketService(getDefaultConfig());
export default webSocketService;