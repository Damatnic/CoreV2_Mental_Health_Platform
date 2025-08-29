// Mock Peer Support Service for testing
export interface MockPeerSupportUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  supportLevel: 'peer' | 'mentor' | 'counselor' | 'moderator';
  badges: string[];
  joinedAt: string;
  isVerified: boolean;
  helpfulVotes: number;
  responseTime: 'fast' | 'medium' | 'slow';
  specialties: string[];
}

export interface MockSupportRoom {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'crisis' | 'depression' | 'anxiety' | 'addiction' | 'relationships' | 'grief' | 'trauma';
  participantCount: number;
  maxParticipants: number;
  moderators: string[];
  isActive: boolean;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  lastActivity: string;
  rules: string[];
}

export interface MockSupportMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'crisis_alert';
  timestamp: string;
  isEdited: boolean;
  editedAt?: string;
  reactions: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  isHelpful: boolean;
  helpfulVotes: number;
  isPinned: boolean;
  replyTo?: string;
}

export interface MockSupportRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: MockSupportRoom['category'];
  urgency: 'low' | 'medium' | 'high' | 'crisis';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isAnonymous: boolean;
}

export interface MockPeerConnection {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'active' | 'paused' | 'ended';
  initiatedBy: string;
  createdAt: string;
  lastContact: string;
  connectionType: 'peer' | 'mentor' | 'buddy';
  sharedTopics: string[];
  notes?: string;
}

class MockPeerSupportService {
  private users: Map<string, MockPeerSupportUser> = new Map();
  private rooms: Map<string, MockSupportRoom> = new Map();
  private messages: Map<string, MockSupportMessage[]> = new Map();
  private requests: Map<string, MockSupportRequest> = new Map();
  private connections: Map<string, MockPeerConnection> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeMockData();
  }

  // User Management
  async getUser(userId: string): Promise<MockPeerSupportUser | null> {
    await this.simulateDelay();
    return this.users.get(userId) || null;
  }

  async getUsersByStatus(status: MockPeerSupportUser['status']): Promise<MockPeerSupportUser[]> {
    await this.simulateDelay();
    return Array.from(this.users.values()).filter(user => user.status === status);
  }

  async getAvailablePeers(specialty?: string): Promise<MockPeerSupportUser[]> {
    await this.simulateDelay();
    const peers = Array.from(this.users.values()).filter(user => 
      user.status === 'online' && 
      user.supportLevel === 'peer' &&
      (!specialty || user.specialties.includes(specialty))
    );
    return peers;
  }

  async getAvailableMentors(): Promise<MockPeerSupportUser[]> {
    await this.simulateDelay();
    return Array.from(this.users.values()).filter(user => 
      user.status === 'online' && user.supportLevel === 'mentor'
    );
  }

  async updateUserStatus(userId: string, status: MockPeerSupportUser['status']): Promise<void> {
    await this.simulateDelay();
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date().toISOString();
    }
  }

  async updateUserProfile(userId: string, updates: Partial<MockPeerSupportUser>): Promise<MockPeerSupportUser> {
    await this.simulateDelay();
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Room Management
  async getRooms(): Promise<MockSupportRoom[]> {
    await this.simulateDelay();
    return Array.from(this.rooms.values()).filter(room => room.isActive);
  }

  async getRoom(roomId: string): Promise<MockSupportRoom | null> {
    await this.simulateDelay();
    return this.rooms.get(roomId) || null;
  }

  async getRoomsByCategory(category: MockSupportRoom['category']): Promise<MockSupportRoom[]> {
    await this.simulateDelay();
    return Array.from(this.rooms.values()).filter(room => 
      room.category === category && room.isActive
    );
  }

  async createRoom(room: Omit<MockSupportRoom, 'id' | 'createdAt' | 'lastActivity'>): Promise<MockSupportRoom> {
    await this.simulateDelay();
    
    const newRoom: MockSupportRoom = {
      ...room,
      id: `room_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.rooms.set(newRoom.id, newRoom);
    this.messages.set(newRoom.id, []);
    
    return newRoom;
  }

  async joinRoom(roomId: string, userId: string): Promise<boolean> {
    await this.simulateDelay();
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (room.participantCount >= room.maxParticipants) {
      return false;
    }

    room.participantCount++;
    room.lastActivity = new Date().toISOString();

    // Add system message
    const systemMessage: MockSupportMessage = {
      id: `msg_${Date.now()}`,
      roomId,
      userId: 'system',
      content: `User joined the room`,
      type: 'system',
      timestamp: new Date().toISOString(),
      isEdited: false,
      reactions: [],
      isHelpful: false,
      helpfulVotes: 0,
      isPinned: false
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(systemMessage);
    this.messages.set(roomId, roomMessages);

    return true;
  }

  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    await this.simulateDelay();
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participantCount = Math.max(0, room.participantCount - 1);
    room.lastActivity = new Date().toISOString();

    return true;
  }

  // Message Management
  async getRoomMessages(
    roomId: string, 
    options?: { limit?: number; before?: string; after?: string }
  ): Promise<MockSupportMessage[]> {
    await this.simulateDelay();
    
    let messages = this.messages.get(roomId) || [];
    
    // Apply filters
    if (options?.before) {
      messages = messages.filter(msg => msg.timestamp < options.before!);
    }
    if (options?.after) {
      messages = messages.filter(msg => msg.timestamp > options.after!);
    }

    // Sort by timestamp (newest first) and apply limit
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (options?.limit) {
      messages = messages.slice(0, options.limit);
    }

    return messages.reverse(); // Return in chronological order
  }

  async sendMessage(
    roomId: string, 
    userId: string, 
    content: string,
    type: MockSupportMessage['type'] = 'text',
    replyTo?: string
  ): Promise<MockSupportMessage> {
    await this.simulateDelay();

    const message: MockSupportMessage = {
      id: `msg_${Date.now()}`,
      roomId,
      userId,
      content,
      type,
      timestamp: new Date().toISOString(),
      isEdited: false,
      reactions: [],
      isHelpful: false,
      helpfulVotes: 0,
      isPinned: false,
      replyTo
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    // Update room last activity
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = new Date().toISOString();
    }

    return message;
  }

  async editMessage(messageId: string, newContent: string): Promise<MockSupportMessage | null> {
    await this.simulateDelay();

    for (const [roomId, messages] of this.messages) {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex].content = newContent;
        messages[messageIndex].isEdited = true;
        messages[messageIndex].editedAt = new Date().toISOString();
        return messages[messageIndex];
      }
    }

    return null;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    await this.simulateDelay();

    for (const [roomId, messages] of this.messages) {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        messages.splice(messageIndex, 1);
        return true;
      }
    }

    return false;
  }

  async addReaction(messageId: string, emoji: string, userId: string): Promise<boolean> {
    await this.simulateDelay();

    for (const [roomId, messages] of this.messages) {
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (!existingReaction.users.includes(userId)) {
            existingReaction.users.push(userId);
            existingReaction.count++;
          }
        } else {
          message.reactions.push({
            emoji,
            count: 1,
            users: [userId]
          });
        }
        return true;
      }
    }

    return false;
  }

  async markMessageHelpful(messageId: string, userId: string): Promise<boolean> {
    await this.simulateDelay();

    for (const [roomId, messages] of this.messages) {
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        message.isHelpful = true;
        message.helpfulVotes++;
        return true;
      }
    }

    return false;
  }

  // Support Request Management
  async createSupportRequest(request: Omit<MockSupportRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MockSupportRequest> {
    await this.simulateDelay();

    const newRequest: MockSupportRequest = {
      ...request,
      id: `req_${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getSupportRequests(
    filters?: { 
      userId?: string; 
      category?: MockSupportRoom['category']; 
      urgency?: MockSupportRequest['urgency'];
      status?: MockSupportRequest['status'];
    }
  ): Promise<MockSupportRequest[]> {
    await this.simulateDelay();

    let requests = Array.from(this.requests.values());

    if (filters?.userId) {
      requests = requests.filter(req => req.userId === filters.userId);
    }
    if (filters?.category) {
      requests = requests.filter(req => req.category === filters.category);
    }
    if (filters?.urgency) {
      requests = requests.filter(req => req.urgency === filters.urgency);
    }
    if (filters?.status) {
      requests = requests.filter(req => req.status === filters.status);
    }

    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateSupportRequest(
    requestId: string, 
    updates: Partial<MockSupportRequest>
  ): Promise<MockSupportRequest | null> {
    await this.simulateDelay();

    const request = this.requests.get(requestId);
    if (!request) return null;

    const updatedRequest = {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.requests.set(requestId, updatedRequest);
    return updatedRequest;
  }

  async assignSupportRequest(requestId: string, assigneeId: string): Promise<boolean> {
    await this.simulateDelay();

    const request = this.requests.get(requestId);
    if (!request) return false;

    request.assignedTo = assigneeId;
    request.status = 'assigned';
    request.updatedAt = new Date().toISOString();

    return true;
  }

  // Peer Connection Management
  async requestPeerConnection(
    fromUserId: string,
    toUserId: string,
    connectionType: MockPeerConnection['connectionType'] = 'peer',
    sharedTopics: string[] = []
  ): Promise<MockPeerConnection> {
    await this.simulateDelay();

    const connection: MockPeerConnection = {
      id: `conn_${Date.now()}`,
      userId1: fromUserId,
      userId2: toUserId,
      status: 'pending',
      initiatedBy: fromUserId,
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      connectionType,
      sharedTopics
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  async getPeerConnections(userId: string): Promise<MockPeerConnection[]> {
    await this.simulateDelay();

    return Array.from(this.connections.values()).filter(conn => 
      conn.userId1 === userId || conn.userId2 === userId
    );
  }

  async updateConnectionStatus(
    connectionId: string, 
    status: MockPeerConnection['status']
  ): Promise<boolean> {
    await this.simulateDelay();

    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.status = status;
    connection.lastContact = new Date().toISOString();

    return true;
  }

  // Analytics and Insights
  async getUserStats(userId: string): Promise<{
    connectionsCount: number;
    helpfulVotes: number;
    messagesCount: number;
    roomsJoined: number;
    responseRate: number;
  }> {
    await this.simulateDelay();

    const connections = await this.getPeerConnections(userId);
    const user = await this.getUser(userId);
    
    let messagesCount = 0;
    for (const messages of this.messages.values()) {
      messagesCount += messages.filter(msg => msg.userId === userId).length;
    }

    return {
      connectionsCount: connections.filter(c => c.status === 'active').length,
      helpfulVotes: user?.helpfulVotes || 0,
      messagesCount,
      roomsJoined: Math.floor(Math.random() * 10) + 1, // Mock data
      responseRate: Math.random() * 100
    };
  }

  async getCommunityStats(): Promise<{
    activeUsers: number;
    totalRooms: number;
    messagesCount: number;
    resolvedRequests: number;
  }> {
    await this.simulateDelay();

    const activeUsers = Array.from(this.users.values()).filter(u => u.status === 'online').length;
    const totalRooms = Array.from(this.rooms.values()).filter(r => r.isActive).length;
    
    let messagesCount = 0;
    for (const messages of this.messages.values()) {
      messagesCount += messages.length;
    }

    const resolvedRequests = Array.from(this.requests.values())
      .filter(r => r.status === 'resolved').length;

    return {
      activeUsers,
      totalRooms,
      messagesCount,
      resolvedRequests
    };
  }

  // Crisis Support
  async triggerCrisisAlert(
    roomId: string, 
    userId: string, 
    severity: 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await this.simulateDelay();

    // Send crisis alert message
    await this.sendMessage(
      roomId,
      'system',
      `Crisis alert triggered. Moderators have been notified.`,
      'crisis_alert'
    );

    // Notify moderators (in a real implementation)
    console.log(`Crisis alert triggered by ${userId} in room ${roomId} with severity: ${severity}`);
  }

  async getCrisisResources(): Promise<{
    hotlines: Array<{ name: string; number: string; available: string }>;
    emergencyContacts: Array<{ name: string; number: string }>;
    selfCareResources: Array<{ title: string; description: string; url: string }>;
  }> {
    await this.simulateDelay();

    return {
      hotlines: [
        { name: 'Crisis Lifeline', number: '988', available: '24/7' },
        { name: 'Crisis Text Line', number: '741741', available: '24/7' },
        { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: '24/7' }
      ],
      emergencyContacts: [
        { name: 'Emergency Services', number: '911' },
        { name: 'Non-Emergency Mental Health', number: '211' }
      ],
      selfCareResources: [
        {
          title: 'Breathing Exercises',
          description: 'Simple techniques to manage anxiety',
          url: '/resources/breathing'
        },
        {
          title: 'Grounding Techniques',
          description: '5-4-3-2-1 method and other grounding exercises',
          url: '/resources/grounding'
        }
      ]
    };
  }

  // Utility Methods
  private async simulateDelay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeMockData(): void {
    if (this.isInitialized) return;

    // Create mock users
    const mockUsers: MockPeerSupportUser[] = [
      {
        id: 'user1',
        username: 'supportive_sarah',
        displayName: 'Sarah M.',
        status: 'online',
        lastSeen: new Date().toISOString(),
        supportLevel: 'mentor',
        badges: ['Helpful', 'Active'],
        joinedAt: '2024-01-01T00:00:00Z',
        isVerified: true,
        helpfulVotes: 45,
        responseTime: 'fast',
        specialties: ['anxiety', 'depression']
      },
      {
        id: 'user2',
        username: 'caring_alex',
        displayName: 'Alex R.',
        status: 'online',
        lastSeen: new Date().toISOString(),
        supportLevel: 'peer',
        badges: ['Newcomer'],
        joinedAt: '2024-01-15T00:00:00Z',
        isVerified: false,
        helpfulVotes: 12,
        responseTime: 'medium',
        specialties: ['relationships', 'grief']
      }
    ];

    mockUsers.forEach(user => this.users.set(user.id, user));

    // Create mock rooms
    const mockRooms: MockSupportRoom[] = [
      {
        id: 'room1',
        name: 'General Support',
        description: 'A welcoming space for general mental health support',
        category: 'general',
        participantCount: 8,
        maxParticipants: 20,
        moderators: ['user1'],
        isActive: true,
        isPrivate: false,
        tags: ['supportive', 'safe-space'],
        createdAt: '2024-01-01T00:00:00Z',
        lastActivity: new Date().toISOString(),
        rules: ['Be respectful', 'No judgement', 'Keep discussions supportive']
      },
      {
        id: 'room2',
        name: 'Anxiety Support Circle',
        description: 'Support and coping strategies for anxiety',
        category: 'anxiety',
        participantCount: 5,
        maxParticipants: 15,
        moderators: ['user1'],
        isActive: true,
        isPrivate: false,
        tags: ['anxiety', 'coping-strategies'],
        createdAt: '2024-01-05T00:00:00Z',
        lastActivity: new Date().toISOString(),
        rules: ['Share coping techniques', 'Support others', 'Respect privacy']
      }
    ];

    mockRooms.forEach(room => {
      this.rooms.set(room.id, room);
      this.messages.set(room.id, []);
    });

    this.isInitialized = true;
  }

  // Testing utilities
  resetMockData(): void {
    this.users.clear();
    this.rooms.clear();
    this.messages.clear();
    this.requests.clear();
    this.connections.clear();
    this.isInitialized = false;
    this.initializeMockData();
  }

  addMockUser(user: MockPeerSupportUser): void {
    this.users.set(user.id, user);
  }

  addMockRoom(room: MockSupportRoom): void {
    this.rooms.set(room.id, room);
    this.messages.set(room.id, []);
  }

  simulateNetworkError(): Promise<never> {
    return Promise.reject(new Error('Network error: Unable to connect to peer support service'));
  }
}

// Create and export singleton instance
export const mockPeerSupportService = new MockPeerSupportService();

// Export test data generators
export const generateTestUser = (overrides: Partial<MockPeerSupportUser> = {}): MockPeerSupportUser => ({
  id: `user_${Date.now()}`,
  username: `testuser_${Math.random().toString(36).substr(2, 5)}`,
  displayName: 'Test User',
  status: 'online',
  lastSeen: new Date().toISOString(),
  supportLevel: 'peer',
  badges: [],
  joinedAt: new Date().toISOString(),
  isVerified: false,
  helpfulVotes: 0,
  responseTime: 'medium',
  specialties: [],
  ...overrides
});

export const generateTestRoom = (overrides: Partial<MockSupportRoom> = {}): MockSupportRoom => ({
  id: `room_${Date.now()}`,
  name: 'Test Room',
  description: 'A test support room',
  category: 'general',
  participantCount: 1,
  maxParticipants: 10,
  moderators: [],
  isActive: true,
  isPrivate: false,
  tags: ['test'],
  createdAt: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  rules: ['Be respectful'],
  ...overrides
});

export const generateTestMessage = (overrides: Partial<MockSupportMessage> = {}): MockSupportMessage => ({
  id: `msg_${Date.now()}`,
  roomId: 'test_room',
  userId: 'test_user',
  content: 'Test message',
  type: 'text',
  timestamp: new Date().toISOString(),
  isEdited: false,
  reactions: [],
  isHelpful: false,
  helpfulVotes: 0,
  isPinned: false,
  ...overrides
});

export default mockPeerSupportService;
