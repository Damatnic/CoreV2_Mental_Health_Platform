/**
 * Real-time Service for Mental Health Platform
 * 
 * Provides real-time communication capabilities including WebSocket connections,
 * live notifications, presence tracking, and real-time data synchronization.
 */

import { webSocketService } from './webSocketService';
import { notificationService } from './notificationService';

export interface RealtimeConfig {
  key: string;
  cluster: string;
  authEndpoint: string;
  auth?: {
    headers: Record<string, string>;
  };
  enableLogging?: boolean;
  maxReconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'crisis';
  urgency: 'low' | 'normal' | 'high' | 'critical';
  senderId?: string;
  timestamp: number;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  expiresAt?: number;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'dismiss' | 'navigate' | 'callback';
  target?: string;
  callback?: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface MoodUpdate {
  userId: string;
  mood: {
    value: number; // -5 to 5
    label: string;
    color?: string;
    description?: string;
  };
  timestamp: number;
  context?: {
    activity?: string;
    location?: string;
    triggers?: string[];
    notes?: string;
  };
  privacy: 'private' | 'friends' | 'public';
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: number;
  activity?: string;
  location?: string;
  mood?: MoodUpdate['mood'];
  availableForSupport: boolean;
  customStatus?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'system';
  timestamp: number;
  edited?: boolean;
  editedAt?: number;
  replyTo?: string;
  reactions?: MessageReaction[];
  metadata?: Record<string, any>;
  encrypted?: boolean;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'support' | 'crisis' | 'public';
  participants: string[];
  createdBy: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
  settings: ChannelSettings;
  metadata?: Record<string, any>;
}

export interface ChannelSettings {
  isPrivate: boolean;
  allowInvites: boolean;
  moderationEnabled: boolean;
  maxParticipants?: number;
  messageRetention?: number; // days
  crisisMonitoring: boolean;
  encryptionEnabled: boolean;
  allowFileSharing: boolean;
  allowVoiceMessages: boolean;
}

export interface RealtimeEvent {
  type: string;
  channel?: string;
  data: any;
  timestamp: number;
  senderId?: string;
  targetUsers?: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectionId?: string;
  lastConnected?: number;
  reconnectionAttempts: number;
  latency?: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RealtimeMetrics {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesDelivered: number;
  averageLatency: number;
  reconnectionRate: number;
  errorRate: number;
  peakConcurrentUsers: number;
  channelsActive: number;
  dataTransferred: number; // bytes
}

class RealtimeService {
  private config: RealtimeConfig;
  private connections: Map<string, WebSocket> = new Map();
  private channels: Map<string, Channel> = new Map();
  private presenceData: Map<string, PresenceData> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    reconnectionAttempts: 0,
    quality: 'poor'
  };
  private metrics: RealtimeMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    averageLatency: 0,
    reconnectionRate: 0,
    errorRate: 0,
    peakConcurrentUsers: 0,
    channelsActive: 0,
    dataTransferred: 0
  };
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectionTimeout?: NodeJS.Timeout;

  constructor(config: RealtimeConfig) {
    this.config = {
      enableLogging: false,
      maxReconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config
    };
    this.initializeService();
  }

  /**
   * Initialize the realtime service
   */
  private initializeService(): void {
    this.setupEventHandlers();
    this.startMetricsCollection();
    this.startHeartbeat();
  }

  /**
   * Connect to the realtime service
   */
  async connect(userId: string): Promise<void> {
    try {
      await webSocketService.connect();
      this.connectionStatus.isConnected = true;
      this.connectionStatus.lastConnected = Date.now();
      this.connectionStatus.reconnectionAttempts = 0;
      
      // Set user presence
      await this.updatePresence(userId, {
        userId,
        status: 'online',
        lastSeen: Date.now(),
        availableForSupport: true
      });

      this.metrics.totalConnections++;
      this.metrics.activeConnections++;

      this.log('Connected to realtime service');
      this.emit('connected', { userId, timestamp: Date.now() });
    } catch (error) {
      this.log('Failed to connect to realtime service', error);
      await this.handleConnectionError(error);
    }
  }

  /**
   * Disconnect from the realtime service
   */
  async disconnect(userId: string): Promise<void> {
    try {
      // Update presence to offline
      await this.updatePresence(userId, {
        userId,
        status: 'offline',
        lastSeen: Date.now(),
        availableForSupport: false
      });

      // Close WebSocket connection
      await webSocketService.disconnect();
      this.connectionStatus.isConnected = false;
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);

      this.log('Disconnected from realtime service');
      this.emit('disconnected', { userId, timestamp: Date.now() });
    } catch (error) {
      this.log('Error during disconnect', error);
    }
  }

  /**
   * Send a real-time message
   */
  async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'deliveryStatus'>): Promise<string> {
    const fullMessage: ChatMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      deliveryStatus: 'sending',
      ...message
    };

    try {
      // Send via WebSocket
      await webSocketService.sendToChannel(message.channelId, {
        type: 'chat-message',
        data: fullMessage
      });

      fullMessage.deliveryStatus = 'sent';
      this.metrics.messagesSent++;

      // Monitor for crisis indicators if enabled
      const channel = this.channels.get(message.channelId);
      if (channel?.settings.crisisMonitoring) {
        await this.monitorMessageForCrisis(fullMessage);
      }

      this.emit('message-sent', fullMessage);
      return fullMessage.id;
    } catch (error) {
      fullMessage.deliveryStatus = 'failed';
      this.log('Failed to send message', error);
      throw error;
    }
  }

  /**
   * Create a new channel
   */
  async createChannel(channelData: Omit<Channel, 'id' | 'createdAt' | 'lastActivity' | 'isActive'>): Promise<Channel> {
    const channel: Channel = {
      id: this.generateId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
      ...channelData
    };

    this.channels.set(channel.id, channel);

    // Create WebSocket channel
    await webSocketService.createChannel(channel.id, channel.participants);

    // Notify participants
    for (const participantId of channel.participants) {
      await this.sendNotification(participantId, {
        id: this.generateId(),
        title: 'New Channel Created',
        message: `You've been added to ${channel.name}`,
        type: 'info',
        urgency: 'normal',
        timestamp: Date.now()
      });
    }

    this.metrics.channelsActive++;
    this.emit('channel-created', channel);
    return channel;
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId: string, userId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (!channel.participants.includes(userId)) {
      channel.participants.push(userId);
      channel.lastActivity = Date.now();

      // Add to WebSocket channel
      await webSocketService.addToChannel(channelId, userId);

      // Notify other participants
      await webSocketService.broadcastToChannel(channelId, {
        type: 'user-joined',
        data: { userId, channelId, timestamp: Date.now() }
      });

      this.emit('user-joined-channel', { channelId, userId });
    }
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string, userId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return;
    }

    channel.participants = channel.participants.filter(id => id !== userId);
    channel.lastActivity = Date.now();

    // Remove from WebSocket channel
    await webSocketService.removeFromChannel(channelId, userId);

    // Notify other participants
    await webSocketService.broadcastToChannel(channelId, {
      type: 'user-left',
      data: { userId, channelId, timestamp: Date.now() }
    });

    // Delete channel if no participants left
    if (channel.participants.length === 0) {
      await this.deleteChannel(channelId);
    }

    this.emit('user-left-channel', { channelId, userId });
  }

  /**
   * Update user presence
   */
  async updatePresence(userId: string, presence: PresenceData): Promise<void> {
    this.presenceData.set(userId, presence);

    // Broadcast presence update
    await webSocketService.broadcast({
      type: 'presence-update',
      data: presence
    });

    this.emit('presence-updated', presence);
  }

  /**
   * Get user presence
   */
  getPresence(userId: string): PresenceData | undefined {
    return this.presenceData.get(userId);
  }

  /**
   * Send a notification
   */
  async sendNotification(userId: string, notification: NotificationData): Promise<void> {
    // Send via WebSocket for real-time delivery
    await webSocketService.sendToUser(userId, {
      type: 'notification',
      data: notification
    });

    // Also send via notification service for persistence
    await notificationService.sendNotification({
      userId,
      title: notification.title,
      body: notification.message
    });

    this.emit('notification-sent', { userId, notification });
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastNotification(userIds: string[], notification: NotificationData): Promise<void> {
    const promises = userIds.map(userId => this.sendNotification(userId, notification));
    await Promise.all(promises);
  }

  /**
   * Send mood update
   */
  async sendMoodUpdate(moodUpdate: MoodUpdate): Promise<void> {
    // Broadcast to appropriate audience based on privacy setting
    let targetChannel: string;
    
    switch (moodUpdate.privacy) {
      case 'public':
        targetChannel = 'public-mood-updates';
        break;
      case 'friends':
        targetChannel = `friends-${moodUpdate.userId}`;
        break;
      case 'private':
        targetChannel = `private-${moodUpdate.userId}`;
        break;
    }

    await webSocketService.broadcastToChannel(targetChannel, {
      type: 'mood-update',
      data: moodUpdate
    });

    // Update user presence with mood
    const currentPresence = this.presenceData.get(moodUpdate.userId);
    if (currentPresence) {
      await this.updatePresence(moodUpdate.userId, {
        ...currentPresence,
        mood: moodUpdate.mood
      });
    }

    this.emit('mood-updated', moodUpdate);
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get realtime metrics
   */
  getMetrics(): RealtimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active channels
   */
  getActiveChannels(): Channel[] {
    return Array.from(this.channels.values()).filter(channel => channel.isActive);
  }

  /**
   * Get channel by ID
   */
  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  // Private helper methods

  private generateId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log('Error in event handler', error);
        }
      });
    }
  }

  private log(message: string, error?: any): void {
    if (this.config.enableLogging) {
      console.log(`[RealtimeService] ${message}`, error || '');
    }
  }

  private setupEventHandlers(): void {
    // Setup WebSocket event handlers
    webSocketService.on('message', this.handleIncomingMessage.bind(this));
    webSocketService.on('disconnect', this.handleDisconnection.bind(this));
    webSocketService.on('error', this.handleError.bind(this));
  }

  private handleIncomingMessage(message: any): void {
    switch (message.type) {
      case 'chat-message':
        this.handleChatMessage(message.data);
        break;
      case 'presence-update':
        this.handlePresenceUpdate(message.data);
        break;
      case 'notification':
        this.handleNotification(message.data);
        break;
      default:
        this.emit('message', message);
    }
  }

  private handleChatMessage(message: ChatMessage): void {
    message.deliveryStatus = 'delivered';
    this.metrics.messagesDelivered++;
    this.emit('message-received', message);
  }

  private handlePresenceUpdate(presence: PresenceData): void {
    this.presenceData.set(presence.userId, presence);
    this.emit('presence-updated', presence);
  }

  private handleNotification(notification: NotificationData): void {
    this.emit('notification-received', notification);
  }

  private async handleDisconnection(): Promise<void> {
    this.connectionStatus.isConnected = false;
    this.emit('disconnected', { timestamp: Date.now() });
    
    // Attempt reconnection
    if (this.connectionStatus.reconnectionAttempts < this.config.maxReconnectionAttempts!) {
      await this.attemptReconnection();
    }
  }

  private async handleError(error: any): Promise<void> {
    this.log('WebSocket error', error);
    this.metrics.errorRate++;
    this.emit('error', error);
  }

  private async handleConnectionError(error: any): Promise<void> {
    this.connectionStatus.isConnected = false;
    this.emit('connection-error', error);
    
    // Attempt reconnection
    if (this.connectionStatus.reconnectionAttempts < this.config.maxReconnectionAttempts!) {
      await this.attemptReconnection();
    }
  }

  private async attemptReconnection(): Promise<void> {
    this.connectionStatus.reconnectionAttempts++;
    const delay = this.config.reconnectionDelay! * this.connectionStatus.reconnectionAttempts;
    
    this.log(`Attempting reconnection ${this.connectionStatus.reconnectionAttempts}/${this.config.maxReconnectionAttempts} in ${delay}ms`);
    
    this.reconnectionTimeout = setTimeout(async () => {
      try {
        await webSocketService.connect();
        this.connectionStatus.isConnected = true;
        this.connectionStatus.reconnectionAttempts = 0;
        this.emit('reconnected', { timestamp: Date.now() });
      } catch (error) {
        this.log('Reconnection failed', error);
        await this.handleConnectionError(error);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.connectionStatus.isConnected) {
        const startTime = Date.now();
        try {
          await webSocketService.ping();
          const latency = Date.now() - startTime;
          this.connectionStatus.latency = latency;
          this.updateConnectionQuality(latency);
        } catch (error) {
          this.log('Heartbeat failed', error);
          await this.handleConnectionError(error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private updateConnectionQuality(latency: number): void {
    if (latency < 100) {
      this.connectionStatus.quality = 'excellent';
    } else if (latency < 300) {
      this.connectionStatus.quality = 'good';
    } else if (latency < 1000) {
      this.connectionStatus.quality = 'fair';
    } else {
      this.connectionStatus.quality = 'poor';
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.metrics.peakConcurrentUsers = Math.max(
        this.metrics.peakConcurrentUsers,
        this.metrics.activeConnections
      );
    }, 60000); // Every minute
  }

  private async deleteChannel(channelId: string): Promise<void> {
    this.channels.delete(channelId);
    await webSocketService.closeChannel(channelId);
    this.metrics.channelsActive = Math.max(0, this.metrics.channelsActive - 1);
    this.emit('channel-deleted', { channelId });
  }

  private async monitorMessageForCrisis(message: ChatMessage): Promise<void> {
    // Crisis monitoring logic would be implemented here
    // This would typically involve analyzing message content for crisis indicators
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself'];
    const containsCrisisKeyword = crisisKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    );

    if (containsCrisisKeyword) {
      await this.handleCrisisDetected(message);
    }
  }

  private async handleCrisisDetected(message: ChatMessage): Promise<void> {
    // Notify crisis intervention team
    await this.sendNotification('crisis-team', {
      id: this.generateId(),
      title: 'Crisis Detected',
      message: `Crisis indicators detected in channel ${message.channelId}`,
      type: 'crisis',
      urgency: 'critical',
      timestamp: Date.now(),
      data: {
        messageId: message.id,
        channelId: message.channelId,
        senderId: message.senderId
      }
    });

    this.emit('crisis-detected', {
      message,
      timestamp: Date.now()
    });
  }
}

export const realtimeService = new RealtimeService({
  key: process.env.PUSHER_KEY || 'default-key',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  authEndpoint: '/api/pusher/auth',
  enableLogging: process.env.NODE_ENV === 'development'
});
