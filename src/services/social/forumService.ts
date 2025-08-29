/**
 * Forum Service - Manages discussion boards, support groups, and peer interactions
 * Includes comprehensive moderation tools and safety features for mental health support
 */

import { io, Socket } from 'socket.io-client';

// Types and Interfaces
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  reputation: number;
  badges: Badge[];
  isAnonymous?: boolean;
  isModerator?: boolean;
  isHelper?: boolean;
  joinedDate: Date;
  trustLevel: TrustLevel;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: Date;
}

export enum TrustLevel {
  NEW_MEMBER = 0,
  BASIC = 1,
  REGULAR = 2,
  TRUSTED = 3,
  LEADER = 4
}

export interface Forum {
  id: string;
  name: string;
  description: string;
  category: ForumCategory;
  icon?: string;
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
  lastActivity: Date;
  moderators: string[];
  rules?: string[];
  tags: string[];
}

export enum ForumCategory {
  ANXIETY = 'anxiety',
  DEPRESSION = 'depression',
  TRAUMA = 'trauma',
  RELATIONSHIPS = 'relationships',
  SELF_CARE = 'self-care',
  ADDICTION = 'addiction',
  EATING_DISORDERS = 'eating-disorders',
  BIPOLAR = 'bipolar',
  OCD = 'ocd',
  PTSD = 'ptsd',
  GENERAL = 'general',
  SUCCESS_STORIES = 'success-stories',
  RESOURCES = 'resources'
}

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  category: ForumCategory;
  isPrivate: boolean;
  requiresApproval: boolean;
  maxMembers?: number;
  members: GroupMember[];
  moderators: string[];
  rules: string[];
  resources: GroupResource[];
  events: GroupEvent[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  settings: GroupSettings;
}

export enum GroupType {
  PEER_SUPPORT = 'peer-support',
  RECOVERY = 'recovery',
  THERAPY = 'therapy',
  EDUCATIONAL = 'educational',
  CRISIS_SUPPORT = 'crisis-support'
}

export interface GroupMember {
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  isAnonymous: boolean;
  nickname?: string;
}

export enum MemberRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  FACILITATOR = 'facilitator'
}

export interface GroupResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
  content?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  LINK = 'link',
  EXERCISE = 'exercise',
  WORKSHEET = 'worksheet'
}

export interface GroupEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  recurring?: RecurrencePattern;
  maxAttendees?: number;
  attendees: string[];
  facilitator?: string;
  meetingLink?: string;
}

export enum EventType {
  GROUP_SESSION = 'group-session',
  WORKSHOP = 'workshop',
  MEDITATION = 'meditation',
  CHECK_IN = 'check-in',
  SOCIAL = 'social'
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface GroupSettings {
  allowAnonymous: boolean;
  requireIntroduction: boolean;
  autoModeration: boolean;
  contentFilters: ContentFilter[];
  joinRequirements?: string[];
  membershipDuration?: number; // in days
}

export interface ContentFilter {
  type: FilterType;
  keywords?: string[];
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'hide' | 'remove';
}

export enum FilterType {
  PROFANITY = 'profanity',
  TRIGGERS = 'triggers',
  CRISIS_KEYWORDS = 'crisis',
  SPAM = 'spam',
  PERSONAL_INFO = 'personal-info'
}

export interface Post {
  id: string;
  forumId?: string;
  groupId?: string;
  title: string;
  content: string;
  author: string;
  authorDisplayName?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt?: Date;
  tags: string[];
  category?: ForumCategory;
  upvotes: string[];
  downvotes: string[];
  comments: Comment[];
  isPinned: boolean;
  isLocked: boolean;
  isFlagged: boolean;
  flagReasons?: FlagReason[];
  contentWarnings?: string[];
  sentiment?: SentimentAnalysis;
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string; // For nested comments
  content: string;
  author: string;
  authorDisplayName?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt?: Date;
  upvotes: string[];
  downvotes: string[];
  isFlagged: boolean;
  flagReasons?: FlagReason[];
  sentiment?: SentimentAnalysis;
  replies?: Comment[];
}

export interface FlagReason {
  reason: FlagType;
  reportedBy: string;
  reportedAt: Date;
  details?: string;
}

export enum FlagType {
  INAPPROPRIATE = 'inappropriate',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  TRIGGERING = 'triggering',
  CRISIS = 'crisis',
  MISINFORMATION = 'misinformation',
  SELF_HARM = 'self-harm',
  OTHER = 'other'
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  categories: {
    positive: number;
    negative: number;
    neutral: number;
  };
  triggers?: string[];
  requiresReview: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface ModerationAction {
  id: string;
  type: ModerationType;
  targetType: 'post' | 'comment' | 'user' | 'group';
  targetId: string;
  moderatorId: string;
  reason: string;
  details?: string;
  timestamp: Date;
  duration?: number; // For temporary actions
  appealable: boolean;
  appealed?: boolean;
}

export enum ModerationType {
  WARNING = 'warning',
  CONTENT_REMOVAL = 'content-removal',
  CONTENT_EDIT = 'content-edit',
  USER_MUTE = 'user-mute',
  USER_BAN = 'user-ban',
  GROUP_REMOVAL = 'group-removal',
  ESCALATE_TO_CRISIS = 'escalate-crisis',
  REFER_TO_PROFESSIONAL = 'refer-professional'
}

export interface ReputationChange {
  userId: string;
  amount: number;
  reason: ReputationReason;
  source?: string; // ID of post/comment/action
  timestamp: Date;
}

export enum ReputationReason {
  POST_UPVOTED = 'post-upvoted',
  POST_DOWNVOTED = 'post-downvoted',
  COMMENT_UPVOTED = 'comment-upvoted',
  COMMENT_DOWNVOTED = 'comment-downvoted',
  HELPFUL_CONTENT = 'helpful-content',
  MODERATION_ACTION = 'moderation-action',
  BADGE_EARNED = 'badge-earned',
  GROUP_CONTRIBUTION = 'group-contribution'
}

// Service Class
class ForumService {
  private socket: Socket | null = null;
  private apiUrl: string;
  private crisisKeywords: Set<string>;
  private contentModerationQueue: Map<string, Post | Comment>;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.contentModerationQueue = new Map();
    
    // Initialize crisis detection keywords
    this.crisisKeywords = new Set([
      'suicide', 'kill myself', 'end it all', 'not worth living',
      'self harm', 'cutting', 'overdose', 'pills',
      'hopeless', 'no way out', 'better off dead',
      'plan to die', 'goodbye', 'final message'
    ]);

    this.initializeSocket();
  }

  private initializeSocket() {
    this.socket = io(`${this.apiUrl}/social`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to social features socket');
    });

    this.socket.on('moderation-alert', (data) => {
      this.handleModerationAlert(data);
    });

    this.socket.on('crisis-detected', (data) => {
      this.handleCrisisDetection(data);
    });
  }

  // Forum Management
  async getForums(category?: ForumCategory): Promise<Forum[]> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await fetch(`${this.apiUrl}/api/forums${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching forums:', error);
      throw error;
    }
  }

  async createForum(forum: Partial<Forum>): Promise<Forum> {
    try {
      const response = await fetch(`${this.apiUrl}/api/forums`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(forum)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating forum:', error);
      throw error;
    }
  }

  // Support Group Management
  async getSupportGroups(filters?: {
    category?: ForumCategory;
    type?: GroupType;
    isPrivate?: boolean;
  }): Promise<SupportGroup[]> {
    try {
      const params = new URLSearchParams(filters as any).toString();
      const response = await fetch(`${this.apiUrl}/api/support-groups?${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching support groups:', error);
      throw error;
    }
  }

  async createSupportGroup(group: Partial<SupportGroup>): Promise<SupportGroup> {
    try {
      // Add default safety settings for mental health groups
      const safeGroup = {
        ...group,
        settings: {
          ...group.settings,
          autoModeration: true,
          contentFilters: this.getDefaultContentFilters()
        }
      };

      const response = await fetch(`${this.apiUrl}/api/support-groups`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(safeGroup)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating support group:', error);
      throw error;
    }
  }

  async joinSupportGroup(groupId: string, isAnonymous: boolean = false): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/support-groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAnonymous })
      });
      
      // Emit socket event for real-time updates
      this.socket?.emit('group-joined', { groupId });
    } catch (error) {
      console.error('Error joining support group:', error);
      throw error;
    }
  }

  async leaveSupportGroup(groupId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/support-groups/${groupId}/leave`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      
      this.socket?.emit('group-left', { groupId });
    } catch (error) {
      console.error('Error leaving support group:', error);
      throw error;
    }
  }

  // Post and Comment System
  async createPost(post: Partial<Post>): Promise<Post> {
    try {
      // Perform content analysis before posting
      const analysis = await this.analyzeContent(post.content || '');
      
      if (analysis.requiresReview) {
        // Add to moderation queue
        this.contentModerationQueue.set(post.id || '', post as Post);
        
        // Check for crisis keywords
        if (this.detectCrisisContent(post.content || '')) {
          await this.triggerCrisisSupport(post.author || '');
        }
      }

      const safePost = {
        ...post,
        sentiment: analysis,
        contentWarnings: this.generateContentWarnings(post.content || '')
      };

      const response = await fetch(`${this.apiUrl}/api/posts`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(safePost)
      });
      
      const createdPost = await response.json();
      
      // Emit real-time update
      this.socket?.emit('post-created', createdPost);
      
      return createdPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async getPosts(filters?: {
    forumId?: string;
    groupId?: string;
    category?: ForumCategory;
    tags?: string[];
    sortBy?: 'recent' | 'popular' | 'trending';
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    try {
      const params = new URLSearchParams(filters as any).toString();
      const response = await fetch(`${this.apiUrl}/api/posts?${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async createComment(comment: Partial<Comment>): Promise<Comment> {
    try {
      // Analyze comment content
      const analysis = await this.analyzeContent(comment.content || '');
      
      if (analysis.requiresReview) {
        this.contentModerationQueue.set(comment.id || '', comment as Comment);
        
        if (this.detectCrisisContent(comment.content || '')) {
          await this.triggerCrisisSupport(comment.author || '');
        }
      }

      const safeComment = {
        ...comment,
        sentiment: analysis
      };

      const response = await fetch(`${this.apiUrl}/api/comments`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(safeComment)
      });
      
      const createdComment = await response.json();
      
      // Emit real-time update
      this.socket?.emit('comment-created', createdComment);
      
      return createdComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Voting System
  async voteOnPost(postId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType })
      });
      
      // Update user reputation
      await this.updateReputation(postId, voteType);
    } catch (error) {
      console.error('Error voting on post:', error);
      throw error;
    }
  }

  async voteOnComment(commentId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType })
      });
      
      await this.updateReputation(commentId, voteType);
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  }

  // Moderation Tools
  async flagContent(
    contentId: string,
    contentType: 'post' | 'comment',
    reason: FlagType,
    details?: string
  ): Promise<void> {
    try {
      const flagData = {
        contentId,
        contentType,
        reason,
        details,
        reportedAt: new Date()
      };

      await fetch(`${this.apiUrl}/api/moderation/flag`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flagData)
      });
      
      // Alert moderators for high-priority flags
      if (reason === FlagType.CRISIS || reason === FlagType.SELF_HARM) {
        this.socket?.emit('urgent-moderation', flagData);
      }
    } catch (error) {
      console.error('Error flagging content:', error);
      throw error;
    }
  }

  async moderateContent(action: ModerationAction): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/moderation/action`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action)
      });
      
      // Handle crisis escalation
      if (action.type === ModerationType.ESCALATE_TO_CRISIS) {
        await this.escalateToCrisisTeam(action.targetId);
      }
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }

  async getModerationQueue(): Promise<(Post | Comment)[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/moderation/queue`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw error;
    }
  }

  // Anonymous Posting Options
  async createAnonymousPost(post: Partial<Post>): Promise<Post> {
    try {
      const anonymousPost = {
        ...post,
        isAnonymous: true,
        authorDisplayName: this.generateAnonymousName()
      };
      
      return await this.createPost(anonymousPost);
    } catch (error) {
      console.error('Error creating anonymous post:', error);
      throw error;
    }
  }

  // User Reputation System
  async getUserReputation(userId: string): Promise<{
    score: number;
    level: TrustLevel;
    history: ReputationChange[];
    badges: Badge[];
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/users/${userId}/reputation`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user reputation:', error);
      throw error;
    }
  }

  private async updateReputation(
    contentId: string,
    action: 'upvote' | 'downvote'
  ): Promise<void> {
    try {
      const reason = action === 'upvote' 
        ? ReputationReason.POST_UPVOTED 
        : ReputationReason.POST_DOWNVOTED;
      
      await fetch(`${this.apiUrl}/api/reputation/update`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId,
          reason,
          amount: action === 'upvote' ? 10 : -5
        })
      });
    } catch (error) {
      console.error('Error updating reputation:', error);
    }
  }

  // Group Events and Scheduling
  async scheduleGroupEvent(groupId: string, event: Partial<GroupEvent>): Promise<GroupEvent> {
    try {
      const response = await fetch(`${this.apiUrl}/api/support-groups/${groupId}/events`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      const createdEvent = await response.json();
      
      // Notify group members
      this.socket?.emit('event-scheduled', {
        groupId,
        event: createdEvent
      });
      
      return createdEvent;
    } catch (error) {
      console.error('Error scheduling group event:', error);
      throw error;
    }
  }

  async joinGroupEvent(eventId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/events/${eventId}/join`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error joining group event:', error);
      throw error;
    }
  }

  // Search and Discovery
  async searchContent(query: string, filters?: {
    type?: 'posts' | 'comments' | 'groups';
    category?: ForumCategory;
    dateRange?: { start: Date; end: Date };
  }): Promise<(Post | Comment | SupportGroup)[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      } as any).toString();
      
      const response = await fetch(`${this.apiUrl}/api/search?${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }

  // Safety and Crisis Detection
  private detectCrisisContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    for (const keyword of this.crisisKeywords) {
      if (lowerContent.includes(keyword)) {
        return true;
      }
    }
    
    // Use more sophisticated NLP if available
    return false;
  }

  private async triggerCrisisSupport(userId: string): Promise<void> {
    try {
      // Immediately notify crisis team
      await fetch(`${this.apiUrl}/api/crisis/alert`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          type: 'content-triggered',
          priority: 'high',
          timestamp: new Date()
        })
      });
      
      // Send supportive resources to user
      this.socket?.emit('crisis-resources', {
        userId,
        resources: this.getCrisisResources()
      });
    } catch (error) {
      console.error('Error triggering crisis support:', error);
    }
  }

  private async analyzeContent(content: string): Promise<SentimentAnalysis> {
    try {
      const response = await fetch(`${this.apiUrl}/api/content/analyze`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      return await response.json();
    } catch (error) {
      console.error('Error analyzing content:', error);
      // Return default safe analysis
      return {
        score: 0,
        magnitude: 0,
        categories: { positive: 0, negative: 0, neutral: 1 },
        requiresReview: false
      };
    }
  }

  private generateContentWarnings(content: string): string[] {
    const warnings: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check for various trigger topics
    const triggerTopics = {
      'self-harm': ['cutting', 'self harm', 'self-harm'],
      'suicide': ['suicide', 'suicidal', 'kill myself'],
      'eating disorder': ['anorexia', 'bulimia', 'binge', 'purge'],
      'substance use': ['drugs', 'alcohol', 'addiction'],
      'violence': ['abuse', 'violence', 'assault']
    };
    
    for (const [warning, keywords] of Object.entries(triggerTopics)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        warnings.push(warning);
      }
    }
    
    return warnings;
  }

  private getDefaultContentFilters(): ContentFilter[] {
    return [
      {
        type: FilterType.CRISIS_KEYWORDS,
        keywords: Array.from(this.crisisKeywords),
        severity: 'high',
        action: 'flag'
      },
      {
        type: FilterType.PROFANITY,
        severity: 'medium',
        action: 'hide'
      },
      {
        type: FilterType.PERSONAL_INFO,
        severity: 'high',
        action: 'remove'
      },
      {
        type: FilterType.SPAM,
        severity: 'low',
        action: 'flag'
      }
    ];
  }

  private generateAnonymousName(): string {
    const adjectives = ['Brave', 'Hopeful', 'Strong', 'Caring', 'Gentle', 'Kind'];
    const nouns = ['Soul', 'Heart', 'Spirit', 'Friend', 'Warrior', 'Phoenix'];
    const random = Math.floor(Math.random() * 1000);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${random}`;
  }

  private getCrisisResources() {
    return {
      hotlines: [
        { name: 'National Suicide Prevention Lifeline', number: '988' },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741' }
      ],
      exercises: [
        { type: 'breathing', name: '4-7-8 Breathing' },
        { type: 'grounding', name: '5-4-3-2-1 Technique' }
      ],
      immediateHelp: true
    };
  }

  private async escalateToCrisisTeam(targetId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/crisis/escalate`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId,
          type: 'moderation-escalation',
          priority: 'urgent'
        })
      });
    } catch (error) {
      console.error('Error escalating to crisis team:', error);
    }
  }

  private handleModerationAlert(data: any) {
    // Handle real-time moderation alerts
    console.log('Moderation alert received:', data);
    // Trigger UI updates through event emitters or state management
  }

  private handleCrisisDetection(data: any) {
    // Handle real-time crisis detection
    console.log('Crisis detected:', data);
    // Immediately show support resources
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const forumService = new ForumService();