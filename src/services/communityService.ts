import { EventEmitter } from 'events';

// Types and interfaces
export interface CommunityMember {
  id: string;
  displayName: string;
  avatar?: string;
  role: 'member' | 'helper' | 'moderator' | 'admin';
  joinDate: string;
  lastActive: string;
  isOnline: boolean;
  stats: {
    postsCreated: number;
    helpProvided: number;
    kudosReceived: number;
    streakDays: number;
    level: number;
  };
  badges: Badge[];
  preferences: {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    shareProgress: boolean;
  };
  mentalHealth?: {
    supportAreas: string[];
    experienceLevel: 'beginner' | 'experienced' | 'expert';
    availableForSupport: boolean;
  };
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  type: 'text' | 'question' | 'celebration' | 'resource' | 'crisis_alert';
  category: 'general' | 'anxiety' | 'depression' | 'addiction' | 'relationships' | 'self_care' | 'crisis';
  isAnonymous: boolean;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string;
  reactions: Record<string, string[]>; // emoji -> user IDs
  replies: Reply[];
  tags: string[];
  mentionedUsers: string[];
  attachments?: Attachment[];
  visibility: 'public' | 'members_only' | 'supporters_only';
  isModerated: boolean;
  moderationStatus?: 'pending' | 'approved' | 'flagged' | 'removed';
  supportLevel?: 'info' | 'emotional' | 'crisis';
  triggerWarnings?: string[];
}

export interface Reply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  reactions: Record<string, string[]>;
  parentReplyId?: string; // For threaded replies
  isModerated: boolean;
  isHelpful?: boolean; // Marked by original poster
}

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'open' | 'closed' | 'private';
  memberCount: number;
  maxMembers?: number;
  facilitatorId: string;
  createdAt: string;
  rules: string[];
  meetingSchedule?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: number; // 0-6
    time: string; // HH:MM
    timezone: string;
    duration: number; // minutes
  };
  nextMeeting?: string;
  isActive: boolean;
  requiresApproval: boolean;
  tags: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'engagement' | 'support' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  criteria: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link' | 'resource';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'workshop' | 'support_group' | 'social' | 'educational' | 'crisis_response';
  startTime: string;
  endTime: string;
  timezone: string;
  isVirtual: boolean;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  facilitatorIds: string[];
  tags: string[];
  requiresRegistration: boolean;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetType: 'post' | 'reply' | 'user' | 'group';
  targetId: string;
  reason: string;
  category: 'spam' | 'harassment' | 'inappropriate_content' | 'crisis_concern' | 'other';
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  action?: 'warning' | 'content_removal' | 'user_suspension' | 'no_action';
}

export interface CommunityStats {
  totalMembers: number;
  activeMembers: number; // Active in last 30 days
  totalPosts: number;
  postsToday: number;
  totalGroups: number;
  activeGroups: number;
  upcomingEvents: number;
  supportInteractions: number;
  averageResponseTime: number; // minutes
  memberSatisfaction: number; // 0-5 rating
}

export class CommunityService extends EventEmitter {
  private apiBaseUrl: string;
  private currentUser?: CommunityMember;
  private members: Map<string, CommunityMember> = new Map();
  private posts: Map<string, Post> = new Map();
  private groups: Map<string, SupportGroup> = new Map();
  private events: Map<string, CommunityEvent> = new Map();
  private reports: Map<string, ModerationReport> = new Map();
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: any[] = [];

  constructor(apiBaseUrl?: string) {
    super();
    this.apiBaseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || '/api';
    this.setupEventListeners();
  }

  // Initialization and Authentication
  async initialize(userId?: string): Promise<void> {
    try {
      if (userId) {
        await this.loadCurrentUser(userId);
      }
      
      await this.loadCommunityData();
      this.emit('initialized');
    } catch (error) {
      console.error('Community service initialization failed:', error);
      this.emit('error', error);
    }
  }

  private async loadCurrentUser(userId: string): Promise<void> {
    const response = await this.makeRequest(`/community/members/${userId}`);
    this.currentUser = await response.json();
  }

  private async loadCommunityData(): Promise<void> {
    const [membersRes, postsRes, groupsRes, eventsRes] = await Promise.all([
      this.makeRequest('/community/members?limit=100'),
      this.makeRequest('/community/posts?limit=50'),
      this.makeRequest('/community/groups'),
      this.makeRequest('/community/events?upcoming=true')
    ]);

    const members = await membersRes.json();
    const posts = await postsRes.json();
    const groups = await groupsRes.json();
    const events = await eventsRes.json();

    members.forEach((member: CommunityMember) => this.members.set(member.id, member));
    posts.forEach((post: Post) => this.posts.set(post.id, post));
    groups.forEach((group: SupportGroup) => this.groups.set(group.id, group));
    events.forEach((event: CommunityEvent) => this.events.set(event.id, event));
  }

  // Member Management
  async joinCommunity(userData: Partial<CommunityMember>): Promise<CommunityMember> {
    const response = await this.makeRequest('/community/members', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    const member = await response.json();
    this.members.set(member.id, member);
    this.currentUser = member;
    
    this.emit('member_joined', member);
    return member;
  }

  async updateMemberProfile(updates: Partial<CommunityMember>): Promise<CommunityMember> {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    const response = await this.makeRequest(`/community/members/${this.currentUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });

    const updatedMember = await response.json();
    this.members.set(updatedMember.id, updatedMember);
    this.currentUser = updatedMember;
    
    this.emit('member_updated', updatedMember);
    return updatedMember;
  }

  async getMember(memberId: string): Promise<CommunityMember | null> {
    if (this.members.has(memberId)) {
      return this.members.get(memberId)!;
    }

    try {
      const response = await this.makeRequest(`/community/members/${memberId}`);
      const member = await response.json();
      this.members.set(member.id, member);
      return member;
    } catch (error) {
      console.error(`Failed to fetch member ${memberId}:`, error);
      return null;
    }
  }

  getOnlineMembers(): CommunityMember[] {
    return Array.from(this.members.values()).filter(member => member.isOnline);
  }

  searchMembers(query: string, filters?: {
    role?: string;
    supportAreas?: string[];
    availableForSupport?: boolean;
  }): CommunityMember[] {
    return Array.from(this.members.values()).filter(member => {
      const matchesQuery = member.displayName.toLowerCase().includes(query.toLowerCase());
      const matchesRole = !filters?.role || member.role === filters.role;
      const matchesSupportAreas = !filters?.supportAreas?.length || 
        filters.supportAreas.some(area => member.mentalHealth?.supportAreas.includes(area));
      const matchesAvailability = filters?.availableForSupport === undefined || 
        member.mentalHealth?.availableForSupport === filters.availableForSupport;

      return matchesQuery && matchesRole && matchesSupportAreas && matchesAvailability;
    });
  }

  // Post Management
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'authorId' | 'reactions' | 'replies'>): Promise<Post> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to create posts');
    }

    const newPost: Post = {
      ...postData,
      id: this.generateId(),
      authorId: this.currentUser.id,
      createdAt: new Date().toISOString(),
      reactions: {},
      replies: [],
      isModerated: false
    };

    // Auto-moderation check
    const moderationResult = await this.checkContentModeration(newPost.content);
    if (moderationResult.requiresReview) {
      newPost.isModerated = true;
      newPost.moderationStatus = 'pending';
    }

    // Crisis detection
    if (postData.type === 'crisis_alert' || this.detectCrisisContent(newPost.content)) {
      newPost.supportLevel = 'crisis';
      this.emit('crisis_post_created', newPost);
    }

    const response = await this.makeRequest('/community/posts', {
      method: 'POST',
      body: JSON.stringify(newPost)
    });

    const createdPost = await response.json();
    this.posts.set(createdPost.id, createdPost);
    
    this.emit('post_created', createdPost);
    return createdPost;
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (!this.currentUser || post.authorId !== this.currentUser.id) {
      throw new Error('Not authorized to edit this post');
    }

    const response = await this.makeRequest(`/community/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString(),
        editedAt: new Date().toISOString()
      })
    });

    const updatedPost = await response.json();
    this.posts.set(updatedPost.id, updatedPost);
    
    this.emit('post_updated', updatedPost);
    return updatedPost;
  }

  async deletePost(postId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (!this.currentUser || (post.authorId !== this.currentUser.id && this.currentUser.role !== 'moderator' && this.currentUser.role !== 'admin')) {
      throw new Error('Not authorized to delete this post');
    }

    await this.makeRequest(`/community/posts/${postId}`, {
      method: 'DELETE'
    });

    this.posts.delete(postId);
    this.emit('post_deleted', postId);
  }

  async reactToPost(postId: string, emoji: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to react');
    }

    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const response = await this.makeRequest(`/community/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });

    const updatedReactions = await response.json();
    post.reactions = updatedReactions;
    
    this.emit('post_reaction_added', { postId, emoji, userId: this.currentUser.id });
  }

  async replyToPost(postId: string, content: string, parentReplyId?: string): Promise<Reply> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to reply');
    }

    const reply: Reply = {
      id: this.generateId(),
      postId,
      authorId: this.currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      reactions: {},
      parentReplyId,
      isModerated: false
    };

    const response = await this.makeRequest(`/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify(reply)
    });

    const createdReply = await response.json();
    
    const post = this.posts.get(postId);
    if (post) {
      post.replies.push(createdReply);
    }

    this.emit('reply_created', createdReply);
    return createdReply;
  }

  getPosts(filters?: {
    category?: string;
    type?: string;
    authorId?: string;
    supportLevel?: string;
    limit?: number;
  }): Post[] {
    let posts = Array.from(this.posts.values());

    if (filters?.category) {
      posts = posts.filter(post => post.category === filters.category);
    }

    if (filters?.type) {
      posts = posts.filter(post => post.type === filters.type);
    }

    if (filters?.authorId) {
      posts = posts.filter(post => post.authorId === filters.authorId);
    }

    if (filters?.supportLevel) {
      posts = posts.filter(post => post.supportLevel === filters.supportLevel);
    }

    // Sort by creation date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit) {
      posts = posts.slice(0, filters.limit);
    }

    return posts;
  }

  // Support Group Management
  async createSupportGroup(groupData: Omit<SupportGroup, 'id' | 'createdAt' | 'memberCount' | 'facilitatorId'>): Promise<SupportGroup> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to create groups');
    }

    const newGroup: SupportGroup = {
      ...groupData,
      id: this.generateId(),
      facilitatorId: this.currentUser.id,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      isActive: true
    };

    const response = await this.makeRequest('/community/groups', {
      method: 'POST',
      body: JSON.stringify(newGroup)
    });

    const createdGroup = await response.json();
    this.groups.set(createdGroup.id, createdGroup);
    
    this.emit('group_created', createdGroup);
    return createdGroup;
  }

  async joinGroup(groupId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to join groups');
    }

    const response = await this.makeRequest(`/community/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberId: this.currentUser.id })
    });

    if (response.ok) {
      const group = this.groups.get(groupId);
      if (group) {
        group.memberCount++;
      }
      this.emit('group_joined', { groupId, memberId: this.currentUser.id });
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated');
    }

    await this.makeRequest(`/community/groups/${groupId}/members/${this.currentUser.id}`, {
      method: 'DELETE'
    });

    const group = this.groups.get(groupId);
    if (group) {
      group.memberCount--;
    }

    this.emit('group_left', { groupId, memberId: this.currentUser.id });
  }

  getGroups(filters?: {
    category?: string;
    type?: string;
    isActive?: boolean;
    hasOpenings?: boolean;
  }): SupportGroup[] {
    let groups = Array.from(this.groups.values());

    if (filters?.category) {
      groups = groups.filter(group => group.category === filters.category);
    }

    if (filters?.type) {
      groups = groups.filter(group => group.type === filters.type);
    }

    if (filters?.isActive !== undefined) {
      groups = groups.filter(group => group.isActive === filters.isActive);
    }

    if (filters?.hasOpenings) {
      groups = groups.filter(group => !group.maxMembers || group.memberCount < group.maxMembers);
    }

    return groups.sort((a, b) => b.memberCount - a.memberCount);
  }

  // Event Management
  async createEvent(eventData: Omit<CommunityEvent, 'id' | 'currentParticipants' | 'facilitatorIds'>): Promise<CommunityEvent> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to create events');
    }

    const newEvent: CommunityEvent = {
      ...eventData,
      id: this.generateId(),
      currentParticipants: 0,
      facilitatorIds: [this.currentUser.id]
    };

    const response = await this.makeRequest('/community/events', {
      method: 'POST',
      body: JSON.stringify(newEvent)
    });

    const createdEvent = await response.json();
    this.events.set(createdEvent.id, createdEvent);
    
    this.emit('event_created', createdEvent);
    return createdEvent;
  }

  async registerForEvent(eventId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to register');
    }

    const response = await this.makeRequest(`/community/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ memberId: this.currentUser.id })
    });

    if (response.ok) {
      const event = this.events.get(eventId);
      if (event) {
        event.currentParticipants++;
      }
      this.emit('event_registered', { eventId, memberId: this.currentUser.id });
    }
  }

  getUpcomingEvents(limit: number = 10): CommunityEvent[] {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  }

  // Moderation and Safety
  async reportContent(targetType: 'post' | 'reply' | 'user', targetId: string, reason: string, category: ModerationReport['category']): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be authenticated to report');
    }

    const report: ModerationReport = {
      id: this.generateId(),
      reporterId: this.currentUser.id,
      targetType,
      targetId,
      reason,
      category,
      description: reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await this.makeRequest('/community/reports', {
      method: 'POST',
      body: JSON.stringify(report)
    });

    this.reports.set(report.id, report);
    this.emit('content_reported', report);
  }

  private async checkContentModeration(content: string): Promise<{ requiresReview: boolean; reasons: string[] }> {
    // Simple content moderation logic - in reality would use AI/ML services
    const flaggedWords = ['spam', 'scam', 'inappropriate'];
    const foundFlags = flaggedWords.filter(word => content.toLowerCase().includes(word));
    
    return {
      requiresReview: foundFlags.length > 0,
      reasons: foundFlags
    };
  }

  private detectCrisisContent(content: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'no point', 'want to die',
      'self harm', 'hurt myself', 'overdose', 'giving up'
    ];
    
    const lowerContent = content.toLowerCase();
    return crisisKeywords.some(keyword => lowerContent.includes(keyword));
  }

  // Analytics and Statistics
  async getCommunityStats(): Promise<CommunityStats> {
    const response = await this.makeRequest('/community/stats');
    return await response.json();
  }

  getMemberEngagementStats(memberId: string): Promise<{
    postsCreated: number;
    repliesGiven: number;
    reactionsReceived: number;
    helpfulReplies: number;
    streakDays: number;
  }> {
    return this.makeRequest(`/community/members/${memberId}/stats`)
      .then(res => res.json());
  }

  // Badge and Achievement System
  async awardBadge(memberId: string, badgeId: string): Promise<void> {
    await this.makeRequest(`/community/members/${memberId}/badges`, {
      method: 'POST',
      body: JSON.stringify({ badgeId })
    });

    this.emit('badge_awarded', { memberId, badgeId });
  }

  checkBadgeEligibility(memberId: string): Promise<Badge[]> {
    return this.makeRequest(`/community/members/${memberId}/badges/eligible`)
      .then(res => res.json());
  }

  // Search and Discovery
  searchCommunity(query: string, type?: 'posts' | 'groups' | 'events' | 'members'): Promise<{
    posts?: Post[];
    groups?: SupportGroup[];
    events?: CommunityEvent[];
    members?: CommunityMember[];
  }> {
    const params = new URLSearchParams({ query });
    if (type) params.append('type', type);

    return this.makeRequest(`/community/search?${params}`)
      .then(res => res.json());
  }

  getRecommendedContent(memberId: string): Promise<{
    posts: Post[];
    groups: SupportGroup[];
    events: CommunityEvent[];
    members: CommunityMember[];
  }> {
    return this.makeRequest(`/community/members/${memberId}/recommendations`)
      .then(res => res.json());
  }

  // Utility methods
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (!this.isOnline) {
      this.offlineQueue.push({ endpoint, options });
      throw new Error('Offline - request queued');
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = new Error(`Community API error: ${response.status}`);
      this.emit('api_error', error);
      throw error;
    }

    return response;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async processOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0) {
      const { endpoint, options } = this.offlineQueue.shift();
      try {
        await this.makeRequest(endpoint, options);
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.members.clear();
    this.posts.clear();
    this.groups.clear();
    this.events.clear();
    this.reports.clear();
    this.offlineQueue = [];
  }

  // Getters
  getCurrentUser(): CommunityMember | undefined {
    return this.currentUser;
  }

  isInitialized(): boolean {
    return this.currentUser !== undefined;
  }

  getTotalMembers(): number {
    return this.members.size;
  }

  getTotalPosts(): number {
    return this.posts.size;
  }

  getTotalGroups(): number {
    return this.groups.size;
  }
}

export default CommunityService;
