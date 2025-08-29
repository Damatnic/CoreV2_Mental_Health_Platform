import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Types for WebSocket events and data
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  encryptionKey?: Buffer;
}

interface ConnectionInfo {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
}

// Room types for different features
enum RoomType {
  THERAPY_SESSION = 'therapy',
  SUPPORT_GROUP = 'group',
  CRISIS_RESPONSE = 'crisis',
  PRIVATE_CHAT = 'private'
}

class WebSocketServer {
  private io: SocketIOServer;
  private connections: Map<string, ConnectionInfo> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private roomParticipants: Map<string, Set<string>> = new Map(); // roomId -> userIds

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.IO with security configurations
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  /**
   * Setup authentication middleware for socket connections
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Attach user information to socket
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        socket.sessionId = crypto.randomBytes(16).toString('hex');
        
        // Generate encryption key for this session
        socket.encryptionKey = crypto.randomBytes(32);
        
        console.log(`User ${socket.userId} authenticated with role ${socket.userRole}`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup main event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
      
      // Core event handlers
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('update-status', (data) => this.handleStatusUpdate(socket, data));
      socket.on('ping', () => this.handlePing(socket));
      
      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
        this.emitToUser(socket.userId!, 'error', {
          message: 'Connection error occurred',
          timestamp: new Date()
        });
      });
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const connectionInfo: ConnectionInfo = {
      userId,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: new Set()
    };

    // Store connection info
    this.connections.set(socket.id, connectionInfo);
    
    // Track user's sockets (for multi-device support)
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // Send connection confirmation with encryption key
    socket.emit('connected', {
      sessionId: socket.sessionId,
      encryptionKey: socket.encryptionKey?.toString('base64'),
      serverTime: new Date(),
      features: this.getAvailableFeatures(socket.userRole!)
    });

    // Notify relevant users of online status
    this.broadcastUserStatus(userId, 'online');
    
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const connectionInfo = this.connections.get(socket.id);
    
    if (connectionInfo) {
      // Leave all rooms
      connectionInfo.rooms.forEach(roomId => {
        this.removeUserFromRoom(userId, roomId);
      });
      
      // Remove connection info
      this.connections.delete(socket.id);
    }

    // Remove from user sockets
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      
      // If user has no more active connections, mark as offline
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, 'offline');
      }
    }

    console.log(`User ${userId} disconnected from socket ${socket.id}`);
  }

  /**
   * Handle room joining
   */
  private handleJoinRoom(socket: AuthenticatedSocket, data: any): void {
    const { roomId, roomType, metadata } = data;
    const userId = socket.userId!;
    
    // Validate room access based on user role and room type
    if (!this.validateRoomAccess(userId, socket.userRole!, roomType, metadata)) {
      socket.emit('room-error', {
        error: 'Access denied',
        roomId
      });
      return;
    }

    // Join the room
    socket.join(roomId);
    
    // Update connection info
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms.add(roomId);
    }

    // Track room participants
    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set());
    }
    this.roomParticipants.get(roomId)!.add(userId);

    // Notify room members
    socket.to(roomId).emit('user-joined', {
      userId,
      roomId,
      timestamp: new Date()
    });

    // Send room state to joining user
    socket.emit('room-joined', {
      roomId,
      participants: Array.from(this.roomParticipants.get(roomId) || []),
      roomType,
      metadata
    });

    console.log(`User ${userId} joined room ${roomId}`);
  }

  /**
   * Handle room leaving
   */
  private handleLeaveRoom(socket: AuthenticatedSocket, data: any): void {
    const { roomId } = data;
    const userId = socket.userId!;
    
    socket.leave(roomId);
    this.removeUserFromRoom(userId, roomId);
    
    // Update connection info
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms.delete(roomId);
    }

    // Notify room members
    socket.to(roomId).emit('user-left', {
      userId,
      roomId,
      timestamp: new Date()
    });

    socket.emit('room-left', { roomId });
    
    console.log(`User ${userId} left room ${roomId}`);
  }

  /**
   * Handle user status updates
   */
  private handleStatusUpdate(socket: AuthenticatedSocket, data: any): void {
    const { status, message } = data;
    const userId = socket.userId!;
    
    // Update last activity
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.lastActivity = new Date();
    }

    // Broadcast status to relevant users
    this.broadcastUserStatus(userId, status, message);
  }

  /**
   * Handle ping for connection health check
   */
  private handlePing(socket: AuthenticatedSocket): void {
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.lastActivity = new Date();
    }
    
    socket.emit('pong', {
      serverTime: new Date(),
      latency: Date.now() - (socket.handshake.issued || Date.now())
    });
  }

  /**
   * Validate room access based on user role and room type
   */
  private validateRoomAccess(
    userId: string,
    userRole: string,
    roomType: RoomType,
    metadata?: any
  ): boolean {
    switch (roomType) {
      case RoomType.THERAPY_SESSION:
        // Only therapists and assigned patients
        return userRole === 'therapist' || 
               (userRole === 'patient' && metadata?.patientId === userId);
      
      case RoomType.SUPPORT_GROUP:
        // Open to all authenticated users
        return true;
      
      case RoomType.CRISIS_RESPONSE:
        // Only crisis responders and users in crisis
        return userRole === 'crisis_responder' || 
               userRole === 'therapist' ||
               metadata?.crisisUserId === userId;
      
      case RoomType.PRIVATE_CHAT:
        // Only participants
        return metadata?.participants?.includes(userId);
      
      default:
        return false;
    }
  }

  /**
   * Get available features based on user role
   */
  private getAvailableFeatures(userRole: string): string[] {
    const baseFeatures = ['chat', 'notifications', 'status'];
    
    switch (userRole) {
      case 'therapist':
        return [...baseFeatures, 'therapy_sessions', 'crisis_response', 'video_call'];
      case 'crisis_responder':
        return [...baseFeatures, 'crisis_alerts', 'emergency_chat'];
      case 'patient':
        return [...baseFeatures, 'support_groups', 'therapy_chat'];
      default:
        return baseFeatures;
    }
  }

  /**
   * Broadcast user status to relevant connections
   */
  private broadcastUserStatus(userId: string, status: string, message?: string): void {
    // Get all users who should be notified (therapists, group members, etc.)
    const relevantUsers = this.getRelevantUsersForStatus(userId);
    
    relevantUsers.forEach(targetUserId => {
      this.emitToUser(targetUserId, 'user-status-change', {
        userId,
        status,
        message,
        timestamp: new Date()
      });
    });
  }

  /**
   * Get users who should be notified of status changes
   */
  private getRelevantUsersForStatus(userId: string): Set<string> {
    const relevantUsers = new Set<string>();
    
    // Add users from shared rooms
    this.roomParticipants.forEach((participants, roomId) => {
      if (participants.has(userId)) {
        participants.forEach(participantId => {
          if (participantId !== userId) {
            relevantUsers.add(participantId);
          }
        });
      }
    });
    
    return relevantUsers;
  }

  /**
   * Remove user from room tracking
   */
  private removeUserFromRoom(userId: string, roomId: string): void {
    const participants = this.roomParticipants.get(roomId);
    if (participants) {
      participants.delete(userId);
      if (participants.size === 0) {
        this.roomParticipants.delete(roomId);
      }
    }
  }

  /**
   * Emit event to specific user (all their sockets)
   */
  public emitToUser(userId: string, event: string, data: any): void {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Emit event to room
   */
  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Broadcast to all connected users
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Start heartbeat to check connection health
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const now = new Date();
      const timeout = 5 * 60 * 1000; // 5 minutes
      
      this.connections.forEach((info, socketId) => {
        const timeSinceActivity = now.getTime() - info.lastActivity.getTime();
        
        if (timeSinceActivity > timeout) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('connection-timeout');
            socket.disconnect(true);
          }
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get server statistics
   */
  public getStats(): any {
    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userSockets.size,
      activeRooms: this.roomParticipants.size,
      connections: Array.from(this.connections.values()).map(info => ({
        userId: info.userId,
        connectedAt: info.connectedAt,
        lastActivity: info.lastActivity,
        roomCount: info.rooms.size
      }))
    };
  }
}

export default WebSocketServer;
export { RoomType, AuthenticatedSocket };