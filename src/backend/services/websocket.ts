import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import { db } from '../config/database';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/websocket.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

interface SocketUser {
  id: string;
  email: string;
  role: string;
  therapistId?: string;
  psychiatristId?: string;
}

interface Room {
  id: string;
  type: 'therapy' | 'crisis' | 'group' | 'support';
  participants: string[];
  createdAt: Date;
  metadata?: any;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  metadata?: any;
}

/**
 * WebSocket Service for real-time communication
 */
export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Socket> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private rooms: Map<string, Room> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // roomId -> userIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupNamespaces();
  }

  /**
   * Set up Socket.IO namespaces
   */
  private setupNamespaces(): void {
    // Main namespace for general communication
    this.io.of('/').on('connection', this.handleConnection.bind(this));

    // Therapy namespace for therapy sessions
    this.io.of('/therapy').on('connection', this.handleTherapyConnection.bind(this));

    // Crisis namespace for crisis support
    this.io.of('/crisis').on('connection', this.handleCrisisConnection.bind(this));

    // Group namespace for group sessions
    this.io.of('/group').on('connection', this.handleGroupConnection.bind(this));
  }

  /**
   * Authenticate socket connection
   */
  async authenticateSocket(token: string): Promise<SocketUser> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      // Get user details from database
      const result = await db.query(
        `SELECT id, email, role, primary_therapist_id, primary_psychiatrist_id 
         FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        therapistId: user.primary_therapist_id,
        psychiatristId: user.primary_psychiatrist_id
      };
    } catch (error) {
      logger.error('Socket authentication failed', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Handle main namespace connection
   */
  private handleConnection(socket: Socket): void {
    const user = socket.data.user as SocketUser;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    // Store socket connection
    this.connectedUsers.set(socket.id, socket);
    
    // Track user's sockets (for multiple connections)
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${user.id}`);
    
    // Join role-specific room
    socket.join(`role:${user.role}`);

    // Notify user is online
    this.broadcastUserStatus(user.id, 'online');

    // Set up event handlers
    this.setupSocketHandlers(socket, user);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket, user);
    });

    logger.info('User connected', { userId: user.id, socketId: socket.id });
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(socket: Socket, user: SocketUser): void {
    // Join room
    socket.on('room:join', async (data: { roomId: string }) => {
      await this.handleJoinRoom(socket, user, data.roomId);
    });

    // Leave room
    socket.on('room:leave', async (data: { roomId: string }) => {
      await this.handleLeaveRoom(socket, user, data.roomId);
    });

    // Send message
    socket.on('message:send', async (data: Partial<Message>) => {
      await this.handleSendMessage(socket, user, data);
    });

    // Typing indicator
    socket.on('typing:start', (data: { roomId: string }) => {
      this.handleTypingStart(socket, user, data.roomId);
    });

    socket.on('typing:stop', (data: { roomId: string }) => {
      this.handleTypingStop(socket, user, data.roomId);
    });

    // Presence updates
    socket.on('presence:update', (data: { status: string }) => {
      this.updateUserPresence(user.id, data.status);
    });

    // Video call signaling
    socket.on('call:initiate', async (data: any) => {
      await this.handleCallInitiate(socket, user, data);
    });

    socket.on('call:signal', async (data: any) => {
      await this.handleCallSignal(socket, user, data);
    });

    // File sharing
    socket.on('file:upload', async (data: any) => {
      await this.handleFileUpload(socket, user, data);
    });

    // Screen sharing
    socket.on('screen:share', async (data: any) => {
      await this.handleScreenShare(socket, user, data);
    });
  }

  /**
   * Handle therapy namespace connection
   */
  private handleTherapyConnection(socket: Socket): void {
    const user = socket.data.user as SocketUser;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    // Verify user has therapy access
    if (user.role !== 'therapist' && user.role !== 'patient') {
      socket.disconnect();
      return;
    }

    socket.join(`therapy:${user.id}`);

    // Therapist-specific setup
    if (user.role === 'therapist') {
      socket.join('therapists');
      this.setupTherapistHandlers(socket, user);
    }

    // Patient-specific setup
    if (user.role === 'patient' && user.therapistId) {
      socket.join(`therapist:${user.therapistId}:patients`);
    }

    logger.info('Therapy connection established', { userId: user.id, role: user.role });
  }

  /**
   * Set up therapist-specific handlers
   */
  private setupTherapistHandlers(socket: Socket, therapist: SocketUser): void {
    // Start therapy session
    socket.on('session:start', async (data: { patientId: string; type: string }) => {
      await this.startTherapySession(socket, therapist, data.patientId, data.type);
    });

    // End therapy session
    socket.on('session:end', async (data: { sessionId: string }) => {
      await this.endTherapySession(socket, therapist, data.sessionId);
    });

    // Update session notes
    socket.on('session:notes', async (data: { sessionId: string; notes: string }) => {
      await this.updateSessionNotes(therapist.id, data.sessionId, data.notes);
    });

    // Emergency intervention
    socket.on('emergency:intervene', async (data: { patientId: string; reason: string }) => {
      await this.handleEmergencyIntervention(socket, therapist, data);
    });
  }

  /**
   * Handle crisis namespace connection
   */
  private handleCrisisConnection(socket: Socket): void {
    const user = socket.data.user as SocketUser;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    socket.join(`crisis:${user.id}`);

    // Crisis counselor setup
    if (user.role === 'crisis_counselor' || user.role === 'therapist') {
      socket.join('crisis:responders');
      this.setupCrisisHandlers(socket, user);
    }

    // Patient in crisis
    if (user.role === 'patient') {
      this.notifyCrisisTeam(user);
    }

    logger.info('Crisis connection established', { userId: user.id, role: user.role });
  }

  /**
   * Set up crisis handlers
   */
  private setupCrisisHandlers(socket: Socket, user: SocketUser): void {
    // Accept crisis case
    socket.on('crisis:accept', async (data: { patientId: string }) => {
      await this.acceptCrisisCase(socket, user, data.patientId);
    });

    // Escalate to emergency
    socket.on('crisis:escalate', async (data: { patientId: string; reason: string }) => {
      await this.escalateCrisis(socket, user, data);
    });

    // Transfer case
    socket.on('crisis:transfer', async (data: { patientId: string; toUserId: string }) => {
      await this.transferCrisisCase(socket, user, data);
    });
  }

  /**
   * Handle group namespace connection
   */
  private handleGroupConnection(socket: Socket): void {
    const user = socket.data.user as SocketUser;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    socket.join(`group:${user.id}`);

    // Get user's groups
    this.getUserGroups(user.id).then(groups => {
      groups.forEach(group => {
        socket.join(`group:session:${group.id}`);
      });
    });

    logger.info('Group connection established', { userId: user.id });
  }

  /**
   * Handle join room
   */
  private async handleJoinRoom(socket: Socket, user: SocketUser, roomId: string): Promise<void> {
    try {
      // Verify user has access to room
      const hasAccess = await this.verifyRoomAccess(user.id, roomId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to room' });
        return;
      }

      socket.join(roomId);
      
      // Update room participants
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          id: roomId,
          type: 'support',
          participants: [],
          createdAt: new Date()
        });
      }
      
      const room = this.rooms.get(roomId)!;
      if (!room.participants.includes(user.id)) {
        room.participants.push(user.id);
      }

      // Notify others in room
      socket.to(roomId).emit('room:user:joined', { userId: user.id, roomId });

      // Send room history
      const history = await this.getRoomHistory(roomId);
      socket.emit('room:history', history);

      logger.info('User joined room', { userId: user.id, roomId });
    } catch (error) {
      logger.error('Failed to join room', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle leave room
   */
  private async handleLeaveRoom(socket: Socket, user: SocketUser, roomId: string): Promise<void> {
    socket.leave(roomId);
    
    // Update room participants
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants = room.participants.filter(id => id !== user.id);
      
      // Remove room if empty
      if (room.participants.length === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Notify others in room
    socket.to(roomId).emit('room:user:left', { userId: user.id, roomId });

    logger.info('User left room', { userId: user.id, roomId });
  }

  /**
   * Handle send message
   */
  private async handleSendMessage(socket: Socket, user: SocketUser, data: Partial<Message>): Promise<void> {
    try {
      if (!data.roomId || !data.content) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Create message
      const message: Message = {
        id: this.generateId(),
        roomId: data.roomId,
        senderId: user.id,
        content: data.content,
        timestamp: new Date(),
        type: data.type || 'text',
        metadata: data.metadata
      };

      // Store message in database
      await this.storeMessage(message);

      // Broadcast to room
      this.io.to(data.roomId).emit('message:received', message);

      // Check for crisis keywords
      if (await this.detectCrisisContent(data.content)) {
        this.triggerCrisisAlert(user, message);
      }

      logger.info('Message sent', { userId: user.id, roomId: data.roomId });
    } catch (error) {
      logger.error('Failed to send message', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(socket: Socket, user: SocketUser, roomId: string): void {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    
    this.typingUsers.get(roomId)!.add(user.id);
    socket.to(roomId).emit('typing:users', {
      roomId,
      users: Array.from(this.typingUsers.get(roomId)!)
    });
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(socket: Socket, user: SocketUser, roomId: string): void {
    const typing = this.typingUsers.get(roomId);
    if (typing) {
      typing.delete(user.id);
      socket.to(roomId).emit('typing:users', {
        roomId,
        users: Array.from(typing)
      });
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket, user: SocketUser): void {
    // Remove from connected users
    this.connectedUsers.delete(socket.id);
    
    // Remove from user sockets
    const userSocketSet = this.userSockets.get(user.id);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      
      // If no more sockets for this user, mark as offline
      if (userSocketSet.size === 0) {
        this.userSockets.delete(user.id);
        this.broadcastUserStatus(user.id, 'offline');
      }
    }

    // Clear typing status
    this.typingUsers.forEach((users, roomId) => {
      if (users.has(user.id)) {
        users.delete(user.id);
        socket.to(roomId).emit('typing:users', {
          roomId,
          users: Array.from(users)
        });
      }
    });

    logger.info('User disconnected', { userId: user.id, socketId: socket.id });
  }

  /**
   * Broadcast user status
   */
  private broadcastUserStatus(userId: string, status: string): void {
    this.io.emit('user:status', { userId, status, timestamp: new Date() });
  }

  /**
   * Update user presence
   */
  private updateUserPresence(userId: string, status: string): void {
    db.query(
      'UPDATE users SET presence_status = $1, last_seen_at = NOW() WHERE id = $2',
      [status, userId]
    ).catch(error => {
      logger.error('Failed to update user presence', error);
    });

    this.broadcastUserStatus(userId, status);
  }

  /**
   * Start therapy session
   */
  private async startTherapySession(
    socket: Socket,
    therapist: SocketUser,
    patientId: string,
    type: string
  ): Promise<void> {
    try {
      // Create session record
      const result = await db.query(
        `INSERT INTO therapy_sessions 
         (therapist_id, patient_id, type, status, started_at) 
         VALUES ($1, $2, $3, 'active', NOW()) 
         RETURNING id`,
        [therapist.id, patientId, type]
      );

      const sessionId = result.rows[0].id;
      const roomId = `therapy:session:${sessionId}`;

      // Create room
      this.rooms.set(roomId, {
        id: roomId,
        type: 'therapy',
        participants: [therapist.id, patientId],
        createdAt: new Date(),
        metadata: { sessionId, type }
      });

      // Join both users to room
      socket.join(roomId);
      
      // Notify patient
      this.io.to(`user:${patientId}`).emit('therapy:session:started', {
        sessionId,
        therapistId: therapist.id,
        roomId
      });

      logger.info('Therapy session started', { sessionId, therapistId: therapist.id, patientId });
    } catch (error) {
      logger.error('Failed to start therapy session', error);
      socket.emit('error', { message: 'Failed to start session' });
    }
  }

  /**
   * End therapy session
   */
  private async endTherapySession(
    socket: Socket,
    therapist: SocketUser,
    sessionId: string
  ): Promise<void> {
    try {
      // Update session record
      await db.query(
        `UPDATE therapy_sessions 
         SET status = 'completed', ended_at = NOW() 
         WHERE id = $1 AND therapist_id = $2`,
        [sessionId, therapist.id]
      );

      const roomId = `therapy:session:${sessionId}`;
      
      // Notify room participants
      this.io.to(roomId).emit('therapy:session:ended', { sessionId });

      // Remove room
      this.rooms.delete(roomId);

      logger.info('Therapy session ended', { sessionId, therapistId: therapist.id });
    } catch (error) {
      logger.error('Failed to end therapy session', error);
      socket.emit('error', { message: 'Failed to end session' });
    }
  }

  /**
   * Handle emergency intervention
   */
  private async handleEmergencyIntervention(
    socket: Socket,
    therapist: SocketUser,
    data: { patientId: string; reason: string }
  ): Promise<void> {
    try {
      // Create intervention record
      await db.query(
        `INSERT INTO emergency_interventions 
         (therapist_id, patient_id, reason, initiated_at) 
         VALUES ($1, $2, $3, NOW())`,
        [therapist.id, data.patientId, data.reason]
      );

      // Notify crisis team
      this.io.to('crisis:responders').emit('emergency:intervention', {
        therapistId: therapist.id,
        patientId: data.patientId,
        reason: data.reason,
        timestamp: new Date()
      });

      // Notify patient's emergency contacts
      await this.notifyEmergencyContacts(data.patientId, data.reason);

      logger.warn('Emergency intervention initiated', {
        therapistId: therapist.id,
        patientId: data.patientId,
        reason: data.reason
      });
    } catch (error) {
      logger.error('Failed to initiate emergency intervention', error);
      socket.emit('error', { message: 'Failed to initiate intervention' });
    }
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
    // Implement room access verification logic
    return true; // Placeholder
  }

  private async getRoomHistory(roomId: string): Promise<Message[]> {
    // Implement fetching room message history
    return []; // Placeholder
  }

  private async storeMessage(message: Message): Promise<void> {
    // Implement message storage in database
  }

  private async detectCrisisContent(content: string): Promise<boolean> {
    // Implement crisis content detection
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'harm myself'];
    return crisisKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private triggerCrisisAlert(user: SocketUser, message: Message): void {
    this.io.to('crisis:responders').emit('crisis:alert', {
      userId: user.id,
      message,
      timestamp: new Date()
    });
  }

  private notifyCrisisTeam(user: SocketUser): void {
    this.io.to('crisis:responders').emit('crisis:user:connected', {
      userId: user.id,
      timestamp: new Date()
    });
  }

  private async acceptCrisisCase(
    socket: Socket,
    counselor: SocketUser,
    patientId: string
  ): Promise<void> {
    // Implement crisis case acceptance
  }

  private async escalateCrisis(
    socket: Socket,
    user: SocketUser,
    data: { patientId: string; reason: string }
  ): Promise<void> {
    // Implement crisis escalation
  }

  private async transferCrisisCase(
    socket: Socket,
    user: SocketUser,
    data: { patientId: string; toUserId: string }
  ): Promise<void> {
    // Implement crisis case transfer
  }

  private async getUserGroups(userId: string): Promise<any[]> {
    // Implement fetching user's groups
    return [];
  }

  private async updateSessionNotes(
    therapistId: string,
    sessionId: string,
    notes: string
  ): Promise<void> {
    // Implement session notes update
  }

  private async notifyEmergencyContacts(patientId: string, reason: string): Promise<void> {
    // Implement emergency contact notification
  }

  private async handleCallInitiate(socket: Socket, user: SocketUser, data: any): Promise<void> {
    // Implement call initiation
  }

  private async handleCallSignal(socket: Socket, user: SocketUser, data: any): Promise<void> {
    // Implement call signaling
  }

  private async handleFileUpload(socket: Socket, user: SocketUser, data: any): Promise<void> {
    // Implement file upload handling
  }

  private async handleScreenShare(socket: Socket, user: SocketUser, data: any): Promise<void> {
    // Implement screen sharing
  }

  /**
   * Public methods for external use
   */
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

export default WebSocketService;