/**
 * WebSocket Service for Astral Core
 * 
 * Handles real-time communication for chat, crisis alerts, and live features
 * with automatic reconnection, message queuing, and connection health monitoring
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing for offline scenarios
 * - Connection health monitoring
 * - Event-driven architecture
 * - Crisis alert priority handling
 * - Heartbeat mechanism
 * - Message acknowledgment system
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { simpleAuthService } from './simpleAuthService';
import { astralCoreNotificationService, NotificationType, NotificationPriority } from './astralCoreNotificationService';
import { getEnv, isProduction } from '../utils/envValidator';

// WebSocket Configuration
const WS_BASE_URL = getEnv('VITE_WEBSOCKET_URL') || 'ws://localhost:3000';
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MESSAGE_QUEUE_SIZE = 100;
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// WebSocket Message Interface
interface WebSocketMessage {
  id: string;
  type: MessageType;
  payload: any;
  timestamp: Date;
  priority: MessagePriority;
  requiresAck?: boolean;
  retryCount?: number;
}

// Message Types
enum MessageType {
  CHAT_MESSAGE = 'chat_message',
  CRISIS_ALERT = 'crisis_alert',
  TYPING_INDICATOR = 'typing_indicator',
  USER_STATUS = 'user_status',
  SYSTEM_NOTIFICATION = 'system_notification',
  HEARTBEAT = 'heartbeat',
  ACK = 'ack',
  ERROR = 'error'
}

// Message Priority
enum MessagePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Connection State
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

// Event Handlers Interface
interface WebSocketEventHandlers {
  onMessage: (message: WebSocketMessage) => void;
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  onError: (error: Error) => void;
  onReconnect: (attempt: number) => void;
}

// Connection Statistics
interface ConnectionStatistics {
  connectedAt: Date | null;
  disconnectedAt: Date | null;
  reconnectAttempts: number;
  messagesSent: number;
  messagesReceived: number;
  lastHeartbeat: Date | null;
  latency: number;
  uptime: number;
}

// Main Service Interface
interface AstralCoreWebSocketService {
  // Connection Management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionState(): ConnectionState;
  
  // Message Handling
  sendMessage(type: MessageType, payload: any, priority?: MessagePriority): Promise<string>;
  sendCrisisAlert(alert: any): Promise<string>;
  sendChatMessage(message: any): Promise<string>;
  
  // Event Handling
  on(event: keyof WebSocketEventHandlers, handler: Function): void;
  off(event: keyof WebSocketEventHandlers, handler: Function): void;
  
  // Health Monitoring
  getStatistics(): ConnectionStatistics;
  getLatency(): Promise<number>;
  
  // Queue Management
  getQueueSize(): number;
  clearQueue(): void;
  
  // Configuration
  setHeartbeatInterval(interval: number): void;
  setReconnectDelay(delay: number): void;
}

// Implementation
class AstralCoreWebSocketServiceImpl implements AstralCoreWebSocketService {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private messageQueue: WebSocketMessage[] = [];
  private pendingAcks = new Map<string, { resolve: Function; reject: Function; timestamp: Date }>();
  private eventHandlers = new Map<keyof WebSocketEventHandlers, Function[]>();
  private statistics: ConnectionStatistics = {
    connectedAt: null,
    disconnectedAt: null,
    reconnectAttempts: 0,
    messagesSent: 0,
    messagesReceived: 0,
    lastHeartbeat: null,
    latency: 0,
    uptime: 0
  };
  private config = {
    heartbeatInterval: HEARTBEAT_INTERVAL,
    reconnectDelay: RECONNECT_DELAY,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    messageQueueSize: MESSAGE_QUEUE_SIZE,
    connectionTimeout: CONNECTION_TIMEOUT
  };

  async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED || 
        this.connectionState === ConnectionState.CONNECTING) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.connectionState = ConnectionState.CONNECTING;
        
        // Get authentication token
        const token = simpleAuthService.getToken();
        const wsUrl = `${WS_BASE_URL}${token ? `?token=${token}` : ''}`;
        
        logger.info('Attempting WebSocket connection', { url: wsUrl.replace(/token=[^&]*/, 'token=***') });
        
        this.ws = new WebSocket(wsUrl);
        
        // Connection timeout
        const timeout = setTimeout(() => {
          if (this.connectionState === ConnectionState.CONNECTING) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);
        
        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.handleConnection();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
        
        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          this.handleDisconnection(event.reason || 'Connection closed');
        };
        
        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          const error = new Error('WebSocket error');
          this.handleError(error);
          if (this.connectionState === ConnectionState.CONNECTING) {
            reject(error);
          }
        };
        
      } catch (error) {
        this.connectionState = ConnectionState.FAILED;
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws && this.connectionState !== ConnectionState.DISCONNECTED) {
      this.connectionState = ConnectionState.DISCONNECTED;
      
      // Clear timers
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = undefined;
      }
      
      // Close connection
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
      
      this.statistics.disconnectedAt = new Date();
      
      logger.info('WebSocket disconnected');
    }
  }

  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && 
           this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  async sendMessage(
    type: MessageType, 
    payload: any, 
    priority: MessagePriority = MessagePriority.MEDIUM
  ): Promise<string> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: new Date(),
      priority,
      requiresAck: priority === MessagePriority.CRITICAL || priority === MessagePriority.HIGH,
      retryCount: 0
    };

    return this.queueAndSendMessage(message);
  }

  async sendCrisisAlert(alert: any): Promise<string> {
    const message = await this.sendMessage(MessageType.CRISIS_ALERT, alert, MessagePriority.CRITICAL);
    
    // Also send local notification
    await astralCoreNotificationService.sendNotification({
      type: NotificationType.CRISIS_ALERT,
      title: 'Crisis Alert Sent',
      message: 'Your crisis alert has been sent to support team',
      priority: NotificationPriority.HIGH,
      data: { alertId: message }
    });
    
    return message;
  }

  async sendChatMessage(message: any): Promise<string> {
    return this.sendMessage(MessageType.CHAT_MESSAGE, message, MessagePriority.MEDIUM);
  }

  on(event: keyof WebSocketEventHandlers, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: keyof WebSocketEventHandlers, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getStatistics(): ConnectionStatistics {
    if (this.statistics.connectedAt && this.connectionState === ConnectionState.CONNECTED) {
      this.statistics.uptime = Date.now() - this.statistics.connectedAt.getTime();
    }
    
    return { ...this.statistics };
  }

  async getLatency(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.isConnected()) {
        resolve(-1);
        return;
      }
      
      const startTime = performance.now();
      const messageId = this.generateMessageId();
      
      // Set up one-time handler for pong response
      const handlePong = (message: WebSocketMessage) => {
        if (message.type === MessageType.HEARTBEAT && message.payload.pong && message.id === messageId) {
          const latency = performance.now() - startTime;
          this.statistics.latency = latency;
          resolve(latency);
          this.off('onMessage', handlePong);
        }
      };
      
      this.on('onMessage', handlePong);
      
      // Send ping
      this.sendMessage(MessageType.HEARTBEAT, { ping: true, id: messageId }, MessagePriority.LOW);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.off('onMessage', handlePong);
        resolve(-1);
      }, 5000);
    });
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clearQueue(): void {
    this.messageQueue = [];
    logger.info('Message queue cleared');
  }

  setHeartbeatInterval(interval: number): void {
    this.config.heartbeatInterval = interval;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.startHeartbeat();
    }
  }

  setReconnectDelay(delay: number): void {
    this.config.reconnectDelay = delay;
  }

  // Private helper methods
  private handleConnection(): void {
    this.connectionState = ConnectionState.CONNECTED;
    this.reconnectAttempts = 0;
    this.statistics.connectedAt = new Date();
    this.statistics.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.processMessageQueue();
    
    // Notify handlers
    this.emitEvent('onConnect');
    
    logger.info('WebSocket connected successfully');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const message: WebSocketMessage = {
        ...data,
        timestamp: new Date(data.timestamp)
      };
      
      this.statistics.messagesReceived++;
      
      // Handle acknowledgments
      if (message.type === MessageType.ACK) {
        this.handleAcknowledgment(message);
        return;
      }
      
      // Handle heartbeat responses
      if (message.type === MessageType.HEARTBEAT) {
        this.handleHeartbeatResponse(message);
        return;
      }
      
      // Handle crisis alerts with priority
      if (message.type === MessageType.CRISIS_ALERT) {
        this.handleCrisisAlert(message);
      }
      
      // Emit to handlers
      this.emitEvent('onMessage', message);
      
      // Send acknowledgment if required
      if (message.requiresAck) {
        this.sendAcknowledgment(message.id);
      }
      
    } catch (error) {
      logger.error('Failed to parse WebSocket message', { error, data: event.data });
    }
  }

  private handleDisconnection(reason: string): void {
    this.connectionState = ConnectionState.DISCONNECTED;
    this.statistics.disconnectedAt = new Date();
    
    // Clear heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    
    // Emit event
    this.emitEvent('onDisconnect', reason);
    
    // Attempt reconnection if not intentionally disconnected
    if (reason !== 'Normal closure' && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnection();
    }
    
    logger.warn('WebSocket disconnected', { reason, reconnectAttempts: this.reconnectAttempts });
  }

  private handleError(error: Error): void {
    logger.error('WebSocket error', { error });
    this.emitEvent('onError', error);
  }

  private handleAcknowledgment(message: WebSocketMessage): void {
    const pending = this.pendingAcks.get(message.payload.messageId);
    
    if (pending) {
      pending.resolve(message.payload.messageId);
      this.pendingAcks.delete(message.payload.messageId);
    }
  }

  private handleHeartbeatResponse(message: WebSocketMessage): void {
    this.statistics.lastHeartbeat = new Date();
    
    if (message.payload.pong) {
      // This is handled by getLatency method
      this.emitEvent('onMessage', message);
    }
  }

  private async handleCrisisAlert(message: WebSocketMessage): Promise<void> {
    // Send high-priority local notification
    await astralCoreNotificationService.sendNotification({
      type: NotificationType.CRISIS_ALERT,
      title: 'Crisis Alert Received',
      message: message.payload.message || 'A crisis alert has been received',
      priority: NotificationPriority.CRITICAL,
      data: message.payload
    });
  }

  private scheduleReconnection(): void {
    this.connectionState = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;
    this.statistics.reconnectAttempts = this.reconnectAttempts;
    
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    logger.info('Scheduling reconnection', { 
      attempt: this.reconnectAttempts, 
      delay,
      maxAttempts: this.config.maxReconnectAttempts 
    });
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.emitEvent('onReconnect', this.reconnectAttempts);
      } catch (error) {
        logger.error('Reconnection failed', { error, attempt: this.reconnectAttempts });
        
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnection();
        } else {
          this.connectionState = ConnectionState.FAILED;
          logger.error('Max reconnection attempts reached');
        }
      }
    }, delay);
  }

  private async queueAndSendMessage(message: WebSocketMessage): Promise<string> {
    // Add to queue
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > this.config.messageQueueSize) {
      // Remove lowest priority messages first
      this.messageQueue.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
      this.messageQueue = this.messageQueue.slice(0, this.config.messageQueueSize);
    }
    
    // Try to send immediately if connected
    if (this.isConnected()) {
      await this.sendQueuedMessage(message);
    }
    
    return message.id;
  }

  private async sendQueuedMessage(message: WebSocketMessage): Promise<void> {
    if (!this.isConnected()) {
      return;
    }
    
    try {
      // Send message
      this.ws!.send(JSON.stringify(message));
      this.statistics.messagesSent++;
      
      // Remove from queue
      const index = this.messageQueue.findIndex(m => m.id === message.id);
      if (index !== -1) {
        this.messageQueue.splice(index, 1);
      }
      
      // Handle acknowledgment if required
      if (message.requiresAck) {
        return new Promise((resolve, reject) => {
          this.pendingAcks.set(message.id, {
            resolve,
            reject,
            timestamp: new Date()
          });
          
          // Timeout after 30 seconds
          setTimeout(() => {
            if (this.pendingAcks.has(message.id)) {
              this.pendingAcks.delete(message.id);
              reject(new Error('Message acknowledgment timeout'));
            }
          }, 30000);
        });
      }
      
    } catch (error) {
      logger.error('Failed to send message', { error, messageId: message.id });
      throw error;
    }
  }

  private async processMessageQueue(): Promise<void> {
    // Sort by priority
    this.messageQueue.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
    
    // Send all queued messages
    const promises = this.messageQueue.map(message => this.sendQueuedMessage(message));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to process message queue', { error });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage(MessageType.HEARTBEAT, { ping: true }, MessagePriority.LOW);
      }
    }, this.config.heartbeatInterval);
  }

  private sendAcknowledgment(messageId: string): void {
    if (this.isConnected()) {
      this.sendMessage(MessageType.ACK, { messageId }, MessagePriority.HIGH);
    }
  }

  private getPriorityWeight(priority: MessagePriority): number {
    switch (priority) {
      case MessagePriority.CRITICAL: return 4;
      case MessagePriority.HIGH: return 3;
      case MessagePriority.MEDIUM: return 2;
      case MessagePriority.LOW: return 1;
      default: return 0;
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent(eventName: keyof WebSocketEventHandlers, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          logger.error('Event handler error', { error, eventName });
        }
      });
    }
  }
}

// Export singleton instance
export const astralCoreWebSocketService = new AstralCoreWebSocketServiceImpl();
export type { 
  AstralCoreWebSocketService, 
  WebSocketMessage, 
  WebSocketEventHandlers,
  ConnectionStatistics 
};
export { MessageType, MessagePriority, ConnectionState };
