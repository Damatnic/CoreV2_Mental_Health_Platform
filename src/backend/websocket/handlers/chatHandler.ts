import { AuthenticatedSocket } from '../socketServer';
import crypto from 'crypto';

// Types for chat-related events
interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  encrypted: boolean;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: {
    replyTo?: string;
    edited?: boolean;
    editedAt?: Date;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      url: string;
    }>;
  };
}

interface TypingIndicator {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
}

interface ChatRoom {
  id: string;
  type: 'private' | 'group' | 'therapy' | 'support';
  participants: Map<string, ParticipantInfo>;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
  metadata?: {
    therapistId?: string;
    sessionId?: string;
    groupName?: string;
    maxParticipants?: number;
    isEncrypted?: boolean;
  };
}

interface ParticipantInfo {
  userId: string;
  userName: string;
  role: string;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  publicKey?: string; // For end-to-end encryption
}

class ChatHandler {
  private chatRooms: Map<string, ChatRoom> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // roomId -> userIds typing
  private messageQueue: Map<string, Message[]> = new Map(); // Offline message queue
  private encryptionKeys: Map<string, Buffer> = new Map(); // roomId -> encryption key
  private readReceipts: Map<string, ReadReceipt[]> = new Map(); // messageId -> receipts

  constructor(private io: any) {
    this.startMessageCleanup();
  }

  /**
   * Handle sending a message
   */
  public handleSendMessage(socket: AuthenticatedSocket, data: any): void {
    const { roomId, content, type = 'text', replyTo, attachments } = data;
    const senderId = socket.userId!;
    
    // Validate room access
    const room = this.chatRooms.get(roomId);
    if (!room || !room.participants.has(senderId)) {
      socket.emit('message-error', { error: 'Unauthorized to send message to this room' });
      return;
    }

    // Generate message ID
    const messageId = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Encrypt message if room is encrypted
    const encryptedContent = room.metadata?.isEncrypted 
      ? this.encryptMessage(content, roomId)
      : content;

    // Create message object
    const message: Message = {
      id: messageId,
      roomId,
      senderId,
      senderName: room.participants.get(senderId)?.userName || 'Unknown',
      content: encryptedContent,
      encrypted: room.metadata?.isEncrypted || false,
      timestamp: new Date(),
      type,
      status: 'sending',
      metadata: {
        replyTo,
        attachments
      }
    };

    // Validate message content
    if (!this.validateMessage(message)) {
      socket.emit('message-error', { error: 'Invalid message content' });
      return;
    }

    // Store message
    room.messages.push(message);
    room.lastActivity = new Date();
    
    // Update message status
    message.status = 'sent';

    // Send confirmation to sender
    socket.emit('message-sent', {
      messageId,
      roomId,
      timestamp: message.timestamp,
      status: 'sent'
    });

    // Broadcast to room participants
    this.broadcastMessage(socket, room, message);

    // Handle offline users
    this.queueForOfflineUsers(room, message);

    // Log for therapy sessions
    if (room.type === 'therapy') {
      this.logTherapyMessage(room, message);
    }
  }

  /**
   * Broadcast message to room participants
   */
  private broadcastMessage(socket: AuthenticatedSocket, room: ChatRoom, message: Message): void {
    // Send to all participants except sender
    room.participants.forEach((participant, userId) => {
      if (userId !== message.senderId) {
        // Decrypt for each recipient if needed
        const messageToSend = room.metadata?.isEncrypted
          ? { ...message, content: this.decryptForUser(message.content, userId, room.id) }
          : message;

        if (participant.isOnline) {
          this.io.emitToUser(userId, 'new-message', messageToSend);
          
          // Update delivery status
          message.status = 'delivered';
          socket.emit('message-delivered', {
            messageId: message.id,
            deliveredTo: userId,
            timestamp: new Date()
          });
        } else {
          // Queue for offline user
          this.addToMessageQueue(userId, message);
        }
      }
    });
  }

  /**
   * Handle typing indicator
   */
  public handleTypingIndicator(socket: AuthenticatedSocket, data: any): void {
    const { roomId, isTyping } = data;
    const userId = socket.userId!;
    
    // Validate room access
    const room = this.chatRooms.get(roomId);
    if (!room || !room.participants.has(userId)) {
      return;
    }

    // Update typing users
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    
    const typingSet = this.typingUsers.get(roomId)!;
    
    if (isTyping) {
      typingSet.add(userId);
      
      // Auto-clear typing after 5 seconds
      setTimeout(() => {
        typingSet.delete(userId);
        this.broadcastTypingStatus(roomId, userId, false);
      }, 5000);
    } else {
      typingSet.delete(userId);
    }

    // Broadcast typing status
    this.broadcastTypingStatus(roomId, userId, isTyping);
  }

  /**
   * Broadcast typing status to room
   */
  private broadcastTypingStatus(roomId: string, userId: string, isTyping: boolean): void {
    const room = this.chatRooms.get(roomId);
    if (!room) return;

    const userName = room.participants.get(userId)?.userName || 'Unknown';
    
    const typingIndicator: TypingIndicator = {
      roomId,
      userId,
      userName,
      isTyping,
      timestamp: new Date()
    };

    // Send to all participants except the typing user
    room.participants.forEach((participant, participantId) => {
      if (participantId !== userId && participant.isOnline) {
        this.io.emitToUser(participantId, 'typing-indicator', typingIndicator);
      }
    });
  }

  /**
   * Handle read receipt
   */
  public handleReadReceipt(socket: AuthenticatedSocket, data: any): void {
    const { messageId, roomId } = data;
    const userId = socket.userId!;
    
    // Validate room access
    const room = this.chatRooms.get(roomId);
    if (!room || !room.participants.has(userId)) {
      return;
    }

    // Find message
    const message = room.messages.find(m => m.id === messageId);
    if (!message) return;

    // Create read receipt
    const receipt: ReadReceipt = {
      messageId,
      userId,
      readAt: new Date()
    };

    // Store receipt
    if (!this.readReceipts.has(messageId)) {
      this.readReceipts.set(messageId, []);
    }
    this.readReceipts.get(messageId)!.push(receipt);

    // Update message status
    message.status = 'read';

    // Notify sender
    if (message.senderId !== userId) {
      this.io.emitToUser(message.senderId, 'message-read', receipt);
    }
  }

  /**
   * Handle creating/joining a chat room
   */
  public handleJoinChatRoom(socket: AuthenticatedSocket, data: any): void {
    const { roomId, roomType, participants, metadata } = data;
    const userId = socket.userId!;
    
    let room = this.chatRooms.get(roomId);
    
    // Create room if it doesn't exist
    if (!room) {
      room = this.createChatRoom(roomId, roomType, metadata);
      this.chatRooms.set(roomId, room);
      
      // Generate encryption key if needed
      if (metadata?.isEncrypted) {
        this.encryptionKeys.set(roomId, crypto.randomBytes(32));
      }
    }

    // Add participant
    const participantInfo: ParticipantInfo = {
      userId,
      userName: data.userName || 'User',
      role: socket.userRole!,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isOnline: true,
      publicKey: data.publicKey
    };
    
    room.participants.set(userId, participantInfo);
    
    // Join socket room
    socket.join(roomId);

    // Send room info to user
    socket.emit('chat-room-joined', {
      roomId,
      roomType: room.type,
      participants: Array.from(room.participants.values()),
      recentMessages: this.getRecentMessages(room, 50),
      encryptionEnabled: room.metadata?.isEncrypted,
      encryptionKey: room.metadata?.isEncrypted 
        ? this.getEncryptionKeyForUser(roomId, userId)
        : undefined
    });

    // Notify other participants
    socket.to(roomId).emit('participant-joined', {
      roomId,
      participant: participantInfo
    });

    // Send any queued messages
    this.sendQueuedMessages(socket, userId, roomId);
  }

  /**
   * Handle leaving a chat room
   */
  public handleLeaveChatRoom(socket: AuthenticatedSocket, data: any): void {
    const { roomId } = data;
    const userId = socket.userId!;
    
    const room = this.chatRooms.get(roomId);
    if (!room) return;

    // Update participant status
    const participant = room.participants.get(userId);
    if (participant) {
      participant.isOnline = false;
      participant.lastSeen = new Date();
    }

    // Leave socket room
    socket.leave(roomId);

    // Notify other participants
    socket.to(roomId).emit('participant-left', {
      roomId,
      userId,
      timestamp: new Date()
    });

    // Clean up empty rooms (except therapy sessions)
    if (room.type !== 'therapy' && this.isRoomEmpty(room)) {
      this.chatRooms.delete(roomId);
      this.encryptionKeys.delete(roomId);
    }
  }

  /**
   * Handle editing a message
   */
  public handleEditMessage(socket: AuthenticatedSocket, data: any): void {
    const { messageId, roomId, newContent } = data;
    const userId = socket.userId!;
    
    const room = this.chatRooms.get(roomId);
    if (!room) {
      socket.emit('message-error', { error: 'Room not found' });
      return;
    }

    const message = room.messages.find(m => m.id === messageId);
    if (!message) {
      socket.emit('message-error', { error: 'Message not found' });
      return;
    }

    // Verify sender
    if (message.senderId !== userId) {
      socket.emit('message-error', { error: 'Unauthorized to edit this message' });
      return;
    }

    // Update message
    message.content = room.metadata?.isEncrypted 
      ? this.encryptMessage(newContent, roomId)
      : newContent;
    message.metadata = {
      ...message.metadata,
      edited: true,
      editedAt: new Date()
    };

    // Notify all participants
    this.io.to(roomId).emit('message-edited', {
      messageId,
      roomId,
      newContent: message.content,
      editedAt: message.metadata.editedAt
    });
  }

  /**
   * Handle deleting a message
   */
  public handleDeleteMessage(socket: AuthenticatedSocket, data: any): void {
    const { messageId, roomId } = data;
    const userId = socket.userId!;
    
    const room = this.chatRooms.get(roomId);
    if (!room) {
      socket.emit('message-error', { error: 'Room not found' });
      return;
    }

    const messageIndex = room.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      socket.emit('message-error', { error: 'Message not found' });
      return;
    }

    const message = room.messages[messageIndex];
    
    // Verify sender or admin
    if (message.senderId !== userId && socket.userRole !== 'admin') {
      socket.emit('message-error', { error: 'Unauthorized to delete this message' });
      return;
    }

    // Remove message
    room.messages.splice(messageIndex, 1);

    // Notify all participants
    this.io.to(roomId).emit('message-deleted', {
      messageId,
      roomId,
      deletedBy: userId,
      timestamp: new Date()
    });
  }

  /**
   * Create a new chat room
   */
  private createChatRoom(roomId: string, type: string, metadata?: any): ChatRoom {
    return {
      id: roomId,
      type: type as any,
      participants: new Map(),
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata
    };
  }

  /**
   * Validate message content
   */
  private validateMessage(message: Message): boolean {
    // Check message length
    if (message.content.length > 5000) return false;
    
    // Check for prohibited content (implement content filtering)
    // This would use a more sophisticated content moderation system
    
    // Validate attachments
    if (message.metadata?.attachments) {
      for (const attachment of message.metadata.attachments) {
        if (attachment.size > 10 * 1024 * 1024) { // 10MB limit
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Encrypt message content
   */
  private encryptMessage(content: string, roomId: string): string {
    const key = this.encryptionKeys.get(roomId);
    if (!key) return content;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt message for specific user
   */
  private decryptForUser(encryptedContent: string, userId: string, roomId: string): string {
    const key = this.encryptionKeys.get(roomId);
    if (!key) return encryptedContent;
    
    try {
      const parts = encryptedContent.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted Message]';
    }
  }

  /**
   * Get encryption key for user
   */
  private getEncryptionKeyForUser(roomId: string, userId: string): string | undefined {
    const key = this.encryptionKeys.get(roomId);
    if (!key) return undefined;
    
    // In production, this would use proper key exchange
    // For now, return base64 encoded key
    return key.toString('base64');
  }

  /**
   * Queue messages for offline users
   */
  private queueForOfflineUsers(room: ChatRoom, message: Message): void {
    room.participants.forEach((participant, userId) => {
      if (!participant.isOnline && userId !== message.senderId) {
        this.addToMessageQueue(userId, message);
      }
    });
  }

  /**
   * Add message to offline queue
   */
  private addToMessageQueue(userId: string, message: Message): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    this.messageQueue.get(userId)!.push(message);
  }

  /**
   * Send queued messages to user
   */
  private sendQueuedMessages(socket: AuthenticatedSocket, userId: string, roomId: string): void {
    const queue = this.messageQueue.get(userId);
    if (!queue) return;
    
    const roomMessages = queue.filter(m => m.roomId === roomId);
    if (roomMessages.length > 0) {
      socket.emit('queued-messages', {
        roomId,
        messages: roomMessages
      });
      
      // Remove sent messages from queue
      const remaining = queue.filter(m => m.roomId !== roomId);
      if (remaining.length > 0) {
        this.messageQueue.set(userId, remaining);
      } else {
        this.messageQueue.delete(userId);
      }
    }
  }

  /**
   * Get recent messages from room
   */
  private getRecentMessages(room: ChatRoom, limit: number): Message[] {
    const messages = room.messages.slice(-limit);
    
    // Decrypt if needed (would be done per-user in production)
    if (room.metadata?.isEncrypted) {
      // Return encrypted messages, client will decrypt
      return messages;
    }
    
    return messages;
  }

  /**
   * Check if room is empty
   */
  private isRoomEmpty(room: ChatRoom): boolean {
    let hasOnlineUsers = false;
    room.participants.forEach(participant => {
      if (participant.isOnline) {
        hasOnlineUsers = true;
      }
    });
    return !hasOnlineUsers;
  }

  /**
   * Log therapy session messages for compliance
   */
  private logTherapyMessage(room: ChatRoom, message: Message): void {
    // This would write to a secure, compliant storage system
    const logEntry = {
      sessionId: room.metadata?.sessionId,
      therapistId: room.metadata?.therapistId,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type
      // Note: actual content might be stored encrypted
    };
    
    console.log('Therapy message logged:', logEntry);
  }

  /**
   * Clean up old messages periodically
   */
  private startMessageCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      this.chatRooms.forEach(room => {
        // Don't clean up therapy sessions (required for records)
        if (room.type === 'therapy') return;
        
        room.messages = room.messages.filter(message => {
          const age = now - message.timestamp.getTime();
          return age < maxAge;
        });
      });
      
      // Clean up old read receipts
      this.readReceipts.forEach((receipts, messageId) => {
        const oldestReceipt = receipts[0];
        if (oldestReceipt) {
          const age = now - oldestReceipt.readAt.getTime();
          if (age > maxAge) {
            this.readReceipts.delete(messageId);
          }
        }
      });
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  /**
   * Get handler statistics
   */
  public getStats(): any {
    let totalMessages = 0;
    let activeRooms = 0;
    let onlineUsers = 0;
    
    this.chatRooms.forEach(room => {
      totalMessages += room.messages.length;
      if (room.lastActivity.getTime() > Date.now() - 60 * 60 * 1000) {
        activeRooms++;
      }
      room.participants.forEach(participant => {
        if (participant.isOnline) onlineUsers++;
      });
    });
    
    return {
      totalRooms: this.chatRooms.size,
      activeRooms,
      totalMessages,
      onlineUsers,
      queuedMessages: Array.from(this.messageQueue.values()).flat().length,
      typingUsers: Array.from(this.typingUsers.values()).flat().length
    };
  }
}

export default ChatHandler;