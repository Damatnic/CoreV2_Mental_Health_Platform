import { EventEmitter } from 'events';

// Types and interfaces
export interface AnonymousUser {
  id: string;
  pseudonym: string;
  avatar: string;
  sessionStart: number;
  lastActivity: number;
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  safety: {
    blocked: boolean;
    reportCount: number;
    lastReported?: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'emoji' | 'system' | 'crisis_alert';
  timestamp: number;
  edited: boolean;
  editedAt?: number;
  reactions: Record<string, string[]>;
  mentions: string[];
  replyTo?: string;
  isEncrypted: boolean;
  metadata: {
    sentiment?: number;
    crisisRisk?: 'low' | 'moderate' | 'high' | 'critical';
    flagged?: boolean;
    moderatorReviewed?: boolean;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'support' | 'peer' | 'crisis' | 'guided';
  isActive: boolean;
  participants: AnonymousUser[];
  maxParticipants: number;
  isPrivate: boolean;
  created: number;
  lastActivity: number;
  moderatorId?: string;
  tags: string[];
  safetySettings: {
    autoModeration: boolean;
    crisisDetection: boolean;
    profanityFilter: boolean;
    spamProtection: boolean;
  };
}

export interface ModerationAction {
  id: string;
  type: 'warning' | 'timeout' | 'kick' | 'ban' | 'content_removal';
  targetUserId: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
  duration?: number; // in milliseconds
  appealable: boolean;
}

export interface CrisisAlert {
  id: string;
  userId: string;
  roomId: string;
  messageId: string;
  severity: 'moderate' | 'high' | 'critical';
  timestamp: number;
  handled: boolean;
  handledBy?: string;
  handledAt?: number;
  escalated: boolean;
  escalatedTo?: string;
}

export interface AnonymousChatConfig {
  enableEncryption: boolean;
  enableCrisisDetection: boolean;
  enableAutoModeration: boolean;
  maxMessageLength: number;
  rateLimitMessages: number;
  rateLimitWindow: number; // milliseconds
  sessionTimeoutMinutes: number;
  enableFileSharing: boolean;
  enableVoiceMessages: boolean;
  enableVideoChat: boolean;
  profanityFilterStrength: 'low' | 'medium' | 'high';
  requireModeratorApproval: boolean;
}

export class AnonymousChatService extends EventEmitter {
  private config: AnonymousChatConfig;
  private currentUser?: AnonymousUser;
  private currentRoom?: ChatRoom;
  private socket?: WebSocket;
  private messageHistory: Map<string, ChatMessage[]> = new Map();
  private activeRooms: Map<string, ChatRoom> = new Map();
  private moderationQueue: ModerationAction[] = [];
  private crisisAlerts: Map<string, CrisisAlert> = new Map();
  private encryptionKey?: CryptoKey;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval?: NodeJS.Timeout;
  private typingUsers: Set<string> = new Set();
  private typingTimeout: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<AnonymousChatConfig> = {}) {
    super();
    
    this.config = {
      enableEncryption: true,
      enableCrisisDetection: true,
      enableAutoModeration: true,
      maxMessageLength: 2000,
      rateLimitMessages: 10,
      rateLimitWindow: 60000, // 1 minute
      sessionTimeoutMinutes: 180, // 3 hours
      enableFileSharing: false,
      enableVoiceMessages: false,
      enableVideoChat: false,
      profanityFilterStrength: 'medium',
      requireModeratorApproval: false,
      ...config
    };

    this.setupEventHandlers();
  }

  // User management
  async createAnonymousSession(): Promise<AnonymousUser> {
    const user: AnonymousUser = {
      id: this.generateUserId(),
      pseudonym: this.generatePseudonym(),
      avatar: this.generateAvatar(),
      sessionStart: Date.now(),
      lastActivity: Date.now(),
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      },
      safety: {
        blocked: false,
        reportCount: 0
      }
    };

    this.currentUser = user;
    
    // Initialize encryption if enabled
    if (this.config.enableEncryption) {
      await this.initializeEncryption();
    }

    this.emit('user_created', user);
    return user;
  }

  updateUserPreferences(preferences: Partial<AnonymousUser['preferences']>): void {
    if (!this.currentUser) {
      throw new Error('No active user session');
    }

    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    };

    this.emit('preferences_updated', this.currentUser.preferences);
  }

  getCurrentUser(): AnonymousUser | undefined {
    return this.currentUser;
  }

  // Room management
  async joinRoom(roomId: string): Promise<ChatRoom> {
    if (!this.currentUser) {
      throw new Error('Must create user session before joining room');
    }

    try {
      // Connect to WebSocket if not already connected
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        await this.connectWebSocket();
      }

      // Request to join room
      const joinRequest = {
        type: 'join_room',
        roomId,
        userId: this.currentUser.id,
        timestamp: Date.now()
      };

      this.sendMessage(joinRequest);

      // Wait for room data
      const room = await this.waitForRoomData(roomId);
      this.currentRoom = room;
      
      // Load recent message history
      await this.loadMessageHistory(roomId);

      this.emit('room_joined', room);
      return room;
      
    } catch (error) {
      this.emit('join_error', error);
      throw error;
    }
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoom || !this.currentUser) {
      return;
    }

    const leaveRequest = {
      type: 'leave_room',
      roomId: this.currentRoom.id,
      userId: this.currentUser.id,
      timestamp: Date.now()
    };

    this.sendMessage(leaveRequest);
    
    const roomId = this.currentRoom.id;
    this.currentRoom = undefined;
    
    this.emit('room_left', roomId);
  }

  async createRoom(roomData: Partial<ChatRoom>): Promise<ChatRoom> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to create room');
    }

    const room: ChatRoom = {
      id: this.generateRoomId(),
      name: roomData.name || 'Unnamed Room',
      description: roomData.description || '',
      type: roomData.type || 'general',
      isActive: true,
      participants: [this.currentUser],
      maxParticipants: roomData.maxParticipants || 50,
      isPrivate: roomData.isPrivate || false,
      created: Date.now(),
      lastActivity: Date.now(),
      moderatorId: this.currentUser.id,
      tags: roomData.tags || [],
      safetySettings: {
        autoModeration: this.config.enableAutoModeration,
        crisisDetection: this.config.enableCrisisDetection,
        profanityFilter: true,
        spamProtection: true,
        ...roomData.safetySettings
      }
    };

    const createRequest = {
      type: 'create_room',
      room,
      creatorId: this.currentUser.id,
      timestamp: Date.now()
    };

    this.sendMessage(createRequest);
    
    this.activeRooms.set(room.id, room);
    this.emit('room_created', room);
    
    return room;
  }

  getAvailableRooms(): ChatRoom[] {
    return Array.from(this.activeRooms.values())
      .filter(room => room.isActive && !room.isPrivate);
  }

  getCurrentRoom(): ChatRoom | undefined {
    return this.currentRoom;
  }

  // Message handling
  async sendChatMessage(content: string, options: {
    type?: ChatMessage['type'];
    replyTo?: string;
    mentions?: string[];
  } = {}): Promise<ChatMessage> {
    if (!this.currentRoom || !this.currentUser) {
      throw new Error('Must be in a room to send messages');
    }

    if (content.length > this.config.maxMessageLength) {
      throw new Error(`Message too long. Maximum ${this.config.maxMessageLength} characters.`);
    }

    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please slow down.');
    }

    // Filter profanity if enabled
    const filteredContent = this.filterProfanity(content);

    const message: ChatMessage = {
      id: this.generateMessageId(),
      senderId: this.currentUser.id,
      content: filteredContent,
      type: options.type || 'text',
      timestamp: Date.now(),
      edited: false,
      reactions: {},
      mentions: options.mentions || [],
      replyTo: options.replyTo,
      isEncrypted: this.config.enableEncryption,
      metadata: {}
    };

    // Encrypt message if enabled
    if (this.config.enableEncryption && this.encryptionKey) {
      message.content = await this.encryptMessage(message.content);
    }

    // Crisis detection
    if (this.config.enableCrisisDetection) {
      const crisisRisk = await this.detectCrisisRisk(filteredContent);
      message.metadata.crisisRisk = crisisRisk;
      
      if (crisisRisk === 'high' || crisisRisk === 'critical') {
        await this.handleCrisisAlert(message);
      }
    }

    // Auto-moderation check
    if (this.config.enableAutoModeration) {
      const moderationResult = await this.checkAutoModeration(message);
      if (moderationResult.flagged) {
        message.metadata.flagged = true;
        
        if (this.config.requireModeratorApproval) {
          this.addToModerationQueue(message, moderationResult.reason);
          this.emit('message_queued', message);
          return message;
        }
      }
    }

    const sendRequest = {
      type: 'send_message',
      message,
      roomId: this.currentRoom.id,
      timestamp: Date.now()
    };

    this.sendMessage(sendRequest);
    
    // Add to local history
    this.addMessageToHistory(this.currentRoom.id, message);
    
    this.emit('message_sent', message);
    return message;
  }

  async editMessage(messageId: string, newContent: string): Promise<ChatMessage> {
    if (!this.currentRoom || !this.currentUser) {
      throw new Error('Must be in a room to edit messages');
    }

    const roomHistory = this.messageHistory.get(this.currentRoom.id) || [];
    const message = roomHistory.find(m => m.id === messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== this.currentUser.id) {
      throw new Error('Can only edit your own messages');
    }

    const editedContent = this.filterProfanity(newContent);
    
    const editRequest = {
      type: 'edit_message',
      messageId,
      newContent: editedContent,
      roomId: this.currentRoom.id,
      userId: this.currentUser.id,
      timestamp: Date.now()
    };

    this.sendMessage(editRequest);

    // Update local copy
    message.content = editedContent;
    message.edited = true;
    message.editedAt = Date.now();

    this.emit('message_edited', message);
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.currentRoom || !this.currentUser) {
      throw new Error('Must be in a room to delete messages');
    }

    const deleteRequest = {
      type: 'delete_message',
      messageId,
      roomId: this.currentRoom.id,
      userId: this.currentUser.id,
      timestamp: Date.now()
    };

    this.sendMessage(deleteRequest);

    // Remove from local history
    const roomHistory = this.messageHistory.get(this.currentRoom.id) || [];
    const filteredHistory = roomHistory.filter(m => m.id !== messageId);
    this.messageHistory.set(this.currentRoom.id, filteredHistory);

    this.emit('message_deleted', messageId);
  }

  addMessageReaction(messageId: string, emoji: string): void {
    if (!this.currentRoom || !this.currentUser) {
      return;
    }

    const reactionRequest = {
      type: 'add_reaction',
      messageId,
      emoji,
      userId: this.currentUser.id,
      roomId: this.currentRoom.id,
      timestamp: Date.now()
    };

    this.sendMessage(reactionRequest);
  }

  removeMessageReaction(messageId: string, emoji: string): void {
    if (!this.currentRoom || !this.currentUser) {
      return;
    }

    const reactionRequest = {
      type: 'remove_reaction',
      messageId,
      emoji,
      userId: this.currentUser.id,
      roomId: this.currentRoom.id,
      timestamp: Date.now()
    };

    this.sendMessage(reactionRequest);
  }

  getMessageHistory(roomId: string): ChatMessage[] {
    return this.messageHistory.get(roomId) || [];
  }

  // Typing indicators
  startTyping(): void {
    if (!this.currentRoom || !this.currentUser) {
      return;
    }

    const typingRequest = {
      type: 'typing_start',
      userId: this.currentUser.id,
      roomId: this.currentRoom.id,
      timestamp: Date.now()
    };

    this.sendMessage(typingRequest);
  }

  stopTyping(): void {
    if (!this.currentRoom || !this.currentUser) {
      return;
    }

    const typingRequest = {
      type: 'typing_stop',
      userId: this.currentUser.id,
      roomId: this.currentRoom.id,
      timestamp: Date.now()
    };

    this.sendMessage(typingRequest);
  }

  getTypingUsers(): string[] {
    return Array.from(this.typingUsers);
  }

  // Safety and moderation
  async reportUser(userId: string, reason: string, evidence?: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to report users');
    }

    const reportRequest = {
      type: 'report_user',
      targetUserId: userId,
      reporterId: this.currentUser.id,
      reason,
      evidence,
      roomId: this.currentRoom?.id,
      timestamp: Date.now()
    };

    this.sendMessage(reportRequest);
    this.emit('user_reported', { userId, reason });
  }

  async reportMessage(messageId: string, reason: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to report messages');
    }

    const reportRequest = {
      type: 'report_message',
      messageId,
      reporterId: this.currentUser.id,
      reason,
      roomId: this.currentRoom?.id,
      timestamp: Date.now()
    };

    this.sendMessage(reportRequest);
    this.emit('message_reported', { messageId, reason });
  }

  blockUser(userId: string): void {
    if (!this.currentUser) {
      return;
    }

    const blockRequest = {
      type: 'block_user',
      targetUserId: userId,
      blockerId: this.currentUser.id,
      timestamp: Date.now()
    };

    this.sendMessage(blockRequest);
    this.emit('user_blocked', userId);
  }

  unblockUser(userId: string): void {
    if (!this.currentUser) {
      return;
    }

    const unblockRequest = {
      type: 'unblock_user',
      targetUserId: userId,
      unblockerId: this.currentUser.id,
      timestamp: Date.now()
    };

    this.sendMessage(unblockRequest);
    this.emit('user_unblocked', userId);
  }

  getCrisisAlerts(): CrisisAlert[] {
    return Array.from(this.crisisAlerts.values());
  }

  // WebSocket connection management
  private async connectWebSocket(): Promise<void> {
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/anonymous-chat`;
    
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
        resolve();
      };

      this.socket.onerror = (error) => {
        this.emit('connection_error', error);
        reject(error);
      };

      this.socket.onclose = () => {
        this.emit('disconnected');
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      // Connection timeout
      setTimeout(() => {
        if (this.socket?.readyState === WebSocket.CONNECTING) {
          this.socket.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connectWebSocket().catch(() => {
        // Will trigger another reconnect attempt
      });
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  private sendMessage(data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.socket.send(JSON.stringify(data));
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'message_received':
        this.handleIncomingMessage(data.message);
        break;
        
      case 'user_joined':
        this.handleUserJoined(data.user, data.roomId);
        break;
        
      case 'user_left':
        this.handleUserLeft(data.userId, data.roomId);
        break;
        
      case 'typing_start':
        this.handleTypingStart(data.userId);
        break;
        
      case 'typing_stop':
        this.handleTypingStop(data.userId);
        break;
        
      case 'room_data':
        this.handleRoomData(data.room);
        break;
        
      case 'message_history':
        this.handleMessageHistory(data.roomId, data.messages);
        break;
        
      case 'crisis_alert':
        this.handleCrisisAlert(data.alert);
        break;
        
      case 'moderation_action':
        this.handleModerationAction(data.action);
        break;
        
      case 'error':
        this.handleServerError(data.error);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }

  private async handleIncomingMessage(message: ChatMessage): Promise<void> {
    // Decrypt if needed
    if (message.isEncrypted && this.encryptionKey) {
      try {
        message.content = await this.decryptMessage(message.content);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        return;
      }
    }

    // Add to history
    if (this.currentRoom) {
      this.addMessageToHistory(this.currentRoom.id, message);
    }

    this.emit('message_received', message);
  }

  private handleUserJoined(user: AnonymousUser, roomId: string): void {
    if (this.currentRoom && this.currentRoom.id === roomId) {
      this.currentRoom.participants.push(user);
    }
    
    this.emit('user_joined', user, roomId);
  }

  private handleUserLeft(userId: string, roomId: string): void {
    if (this.currentRoom && this.currentRoom.id === roomId) {
      this.currentRoom.participants = this.currentRoom.participants
        .filter(p => p.id !== userId);
    }
    
    this.emit('user_left', userId, roomId);
  }

  private handleTypingStart(userId: string): void {
    this.typingUsers.add(userId);
    
    // Clear existing timeout
    const existingTimeout = this.typingTimeout.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      this.typingUsers.delete(userId);
      this.typingTimeout.delete(userId);
      this.emit('typing_stopped', userId);
    }, 3000);
    
    this.typingTimeout.set(userId, timeout);
    this.emit('typing_started', userId);
  }

  private handleTypingStop(userId: string): void {
    this.typingUsers.delete(userId);
    
    const timeout = this.typingTimeout.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeout.delete(userId);
    }
    
    this.emit('typing_stopped', userId);
  }

  private handleRoomData(room: ChatRoom): void {
    this.activeRooms.set(room.id, room);
    this.emit('room_data_received', room);
  }

  private handleMessageHistory(roomId: string, messages: ChatMessage[]): void {
    this.messageHistory.set(roomId, messages);
    this.emit('message_history_loaded', roomId, messages);
  }

  private async handleCrisisAlert(alert: CrisisAlert): Promise<void> {
    this.crisisAlerts.set(alert.id, alert);
    this.emit('crisis_alert_received', alert);
    
    // Auto-escalate critical alerts
    if (alert.severity === 'critical') {
      await this.escalateCrisisAlert(alert);
    }
  }

  private handleModerationAction(action: ModerationAction): void {
    this.emit('moderation_action_received', action);
  }

  private handleServerError(error: any): void {
    this.emit('server_error', error);
  }

  // Utility methods
  private generateUserId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePseudonym(): string {
    const adjectives = ['Anonymous', 'Gentle', 'Kind', 'Caring', 'Supportive', 'Understanding', 'Peaceful', 'Wise'];
    const nouns = ['Helper', 'Friend', 'Soul', 'Heart', 'Spirit', 'Guardian', 'Companion', 'Listener'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    
    return `${adj}${noun}${num}`;
  }

  private generateAvatar(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeEncryption(): Promise<void> {
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('Web Crypto API not available, encryption disabled');
      return;
    }

    this.encryptionKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encryptMessage(content: string): Promise<string> {
    if (!this.encryptionKey) {
      return content;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  private async decryptMessage(encryptedContent: string): Promise<string> {
    if (!this.encryptionKey) {
      return encryptedContent;
    }

    const combined = new Uint8Array(
      atob(encryptedContent)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private filterProfanity(content: string): string {
    if (this.config.profanityFilterStrength === 'low') {
      return content;
    }

    // Simple profanity filter implementation
    const profanityWords = ['badword1', 'badword2']; // Would be more comprehensive in reality
    let filtered = content;
    
    profanityWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    return filtered;
  }

  private checkRateLimit(): boolean {
    // Simple rate limiting implementation
    // Would be more sophisticated in production
    return true;
  }

  private async detectCrisisRisk(content: string): Promise<'low' | 'moderate' | 'high' | 'critical'> {
    // This would integrate with the crisis detection service
    // For now, return low risk
    return 'low';
  }

  private async checkAutoModeration(message: ChatMessage): Promise<{ flagged: boolean; reason?: string }> {
    // This would integrate with content moderation services
    return { flagged: false };
  }

  private addToModerationQueue(message: ChatMessage, reason: string): void {
    // Add message to moderation queue
    console.log('Message queued for moderation:', message.id, reason);
  }

  private addMessageToHistory(roomId: string, message: ChatMessage): void {
    const history = this.messageHistory.get(roomId) || [];
    history.push(message);
    
    // Keep only last 100 messages in memory
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.messageHistory.set(roomId, history);
  }

  private async loadMessageHistory(roomId: string): Promise<void> {
    // Request message history from server
    const historyRequest = {
      type: 'get_history',
      roomId,
      userId: this.currentUser?.id,
      limit: 50,
      timestamp: Date.now()
    };

    this.sendMessage(historyRequest);
  }

  private async waitForRoomData(roomId: string): Promise<ChatRoom> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Room data timeout'));
      }, 10000);

      const handler = (room: ChatRoom) => {
        if (room.id === roomId) {
          clearTimeout(timeout);
          this.off('room_data_received', handler);
          resolve(room);
        }
      };

      this.on('room_data_received', handler);
    });
  }

  private async escalateCrisisAlert(alert: CrisisAlert): Promise<void> {
    // Auto-escalate to crisis support team
    console.log('Escalating crisis alert:', alert.id);
    alert.escalated = true;
    alert.escalatedTo = 'crisis_team';
    
    this.emit('crisis_alert_escalated', alert);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private setupEventHandlers(): void {
    // Handle session timeout
    setInterval(() => {
      if (this.currentUser) {
        const sessionAge = Date.now() - this.currentUser.sessionStart;
        const maxAge = this.config.sessionTimeoutMinutes * 60 * 1000;
        
        if (sessionAge > maxAge) {
          this.emit('session_expired');
          this.disconnect();
        }
      }
    }, 60000); // Check every minute
  }

  // Public API methods
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  isInRoom(): boolean {
    return !!this.currentRoom;
  }

  getConfig(): AnonymousChatConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AnonymousChatConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', this.config);
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
    }
    
    this.stopHeartbeat();
    this.currentUser = undefined;
    this.currentRoom = undefined;
    this.messageHistory.clear();
    this.activeRooms.clear();
    
    this.emit('disconnected');
  }

  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    
    // Clear all timeouts
    this.typingTimeout.forEach(timeout => clearTimeout(timeout));
    this.typingTimeout.clear();
  }
}

export default AnonymousChatService;
