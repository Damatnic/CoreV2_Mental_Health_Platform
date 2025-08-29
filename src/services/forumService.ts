import { EventEmitter } from 'events';

// Types and Interfaces
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId: string;
  authorName?: string;
  category: string;
  tags: string[];
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastReplyAt?: Date;
  viewCount: number;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  reportCount: number;
  triggerWarnings?: string[];
  moderationStatus: 'pending' | 'approved' | 'flagged' | 'removed' | 'auto-approved';
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: Date;
  crisisLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  hasHelpfulReply?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export interface ForumReply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt?: Date;
  upvotes: number;
  downvotes: number;
  isHelpful: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  parentReplyId?: string;
  moderationStatus: 'pending' | 'approved' | 'flagged' | 'removed';
  reportCount: number;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  postCount: number;
  isModerated?: boolean;
  requiresApproval?: boolean;
  moderatorIds?: string[];
}

export interface ForumUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'member' | 'helper' | 'moderator' | 'admin';
  reputation: number;
  postCount: number;
  helpfulCount: number;
  joinedAt: Date;
  lastActiveAt: Date;
  isBanned: boolean;
  isVerified: boolean;
  badges: ForumBadge[];
  trustLevel: 0 | 1 | 2 | 3 | 4; // 0=new, 1=basic, 2=member, 3=regular, 4=leader
  warningCount: number;
  suspendedUntil?: Date;
}

export interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'participation' | 'helpful' | 'moderation' | 'special';
}

export interface ForumReport {
  id: string;
  reporterId: string;
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'crisis' | 'misinformation' | 'other';
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  action?: 'none' | 'warning' | 'edit' | 'remove' | 'ban';
  actionNotes?: string;
}

export interface ForumStats {
  totalPosts: number;
  totalReplies: number;
  totalMembers: number;
  activeMembers: number;
  activeToday: number;
  postsToday: number;
  supportInteractions: number;
  averageResponseTime: number; // in minutes
  crisisInterventions: number;
  successfulResolutions: number;
}

export interface ModerationQueue {
  id: string;
  items: ModerationItem[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdAt: Date;
}

export interface ModerationItem {
  id: string;
  type: 'post' | 'reply' | 'user' | 'report';
  targetId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  autoDetected: boolean;
  detectionConfidence: number;
  suggestedAction: 'approve' | 'flag' | 'remove' | 'escalate';
  createdAt: Date;
}

export interface VotingRecord {
  userId: string;
  targetId: string;
  targetType: 'post' | 'reply';
  voteType: 'up' | 'down';
  timestamp: Date;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasReplies?: boolean;
  isResolved?: boolean;
  sortBy?: 'recent' | 'popular' | 'trending' | 'unanswered';
  includeDeleted?: boolean;
}

// Crisis Keywords for Detection
const CRISIS_KEYWORDS = {
  critical: [
    'suicide', 'kill myself', 'end my life', 'not worth living',
    'better off dead', 'want to die', 'planning to die', 'goodbye forever'
  ],
  high: [
    'self harm', 'hurt myself', 'cutting', 'overdose', 'pills',
    'hopeless', 'no point', 'give up', 'cant go on', 'ending it'
  ],
  medium: [
    'depressed', 'anxious', 'panic attack', 'scared',
    'alone', 'nobody cares', 'hate myself', 'worthless'
  ],
  low: [
    'sad', 'worried', 'stressed', 'overwhelmed',
    'tired', 'frustrated', 'struggling', 'difficult'
  ]
};

// Inappropriate Content Patterns
const INAPPROPRIATE_PATTERNS = [
  'spam', 'scam', 'advertisement', 'promotion',
  'explicit', 'graphic', 'violent', 'harassment',
  'hate speech', 'discrimination', 'bullying'
];

export class ForumService extends EventEmitter {
  private apiBaseUrl: string;
  private posts: Map<string, ForumPost> = new Map();
  private replies: Map<string, ForumReply[]> = new Map();
  private users: Map<string, ForumUser> = new Map();
  private reports: Map<string, ForumReport> = new Map();
  private votingRecords: Map<string, VotingRecord> = new Map();
  private moderationQueue: ModerationItem[] = [];
  private currentUser?: ForumUser;
  private isInitialized: boolean = false;

  constructor(apiBaseUrl?: string) {
    super();
    this.apiBaseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || '/api/forums';
    this.setupAutoModeration();
  }

  // Initialization
  async initialize(userId?: string): Promise<void> {
    try {
      if (userId) {
        await this.loadCurrentUser(userId);
      }
      
      await this.loadForumData();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Forum service initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async loadCurrentUser(userId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/users/${userId}`);
      this.currentUser = await response.json();
      this.users.set(userId, this.currentUser);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  }

  private async loadForumData(): Promise<void> {
    try {
      const [postsRes, statsRes] = await Promise.all([
        this.makeRequest('/posts?limit=50'),
        this.makeRequest('/stats')
      ]);

      const posts = await postsRes.json();
      posts.forEach((post: ForumPost) => {
        this.posts.set(post.id, post);
      });
    } catch (error) {
      console.error('Failed to load forum data:', error);
    }
  }

  // Post Management
  async createPost(postData: Partial<ForumPost>): Promise<ForumPost> {
    if (!postData.title || !postData.content) {
      throw new Error('Title and content are required');
    }

    // Auto-moderation check
    const moderationResult = await this.checkContentModeration(
      `${postData.title} ${postData.content}`
    );

    // Crisis detection
    const crisisLevel = this.detectCrisisLevel(postData.content || '');

    const newPost: ForumPost = {
      id: this.generateId(),
      title: postData.title,
      content: postData.content,
      excerpt: this.generateExcerpt(postData.content),
      authorId: postData.authorId || this.currentUser?.id || 'anonymous',
      authorName: postData.isAnonymous ? 'Anonymous' : this.currentUser?.displayName,
      category: postData.category || 'general',
      tags: postData.tags || [],
      isAnonymous: postData.isAnonymous || false,
      isPinned: false,
      isLocked: false,
      isFlagged: moderationResult.shouldFlag,
      isDeleted: false,
      createdAt: new Date(),
      viewCount: 0,
      replyCount: 0,
      upvotes: 0,
      downvotes: 0,
      reportCount: 0,
      triggerWarnings: postData.triggerWarnings,
      moderationStatus: moderationResult.requiresReview ? 'pending' : 'auto-approved',
      crisisLevel,
      sentiment: this.analyzeSentiment(postData.content)
    };

    // Handle crisis posts
    if (crisisLevel === 'critical' || crisisLevel === 'high') {
      this.emit('crisis_detected', { post: newPost, level: crisisLevel });
      await this.escalateToCrisisTeam(newPost);
    }

    // Add to moderation queue if needed
    if (moderationResult.requiresReview) {
      this.addToModerationQueue(newPost, moderationResult.reasons);
    }

    try {
      const response = await this.makeRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(newPost)
      });

      const createdPost = await response.json();
      this.posts.set(createdPost.id, createdPost);
      
      this.emit('post_created', createdPost);
      return createdPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  async updatePost(postId: string, updates: Partial<ForumPost>): Promise<ForumPost> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check permissions
    if (!this.canEditPost(post)) {
      throw new Error('Not authorized to edit this post');
    }

    // Re-check moderation if content changed
    if (updates.content || updates.title) {
      const moderationResult = await this.checkContentModeration(
        `${updates.title || post.title} ${updates.content || post.content}`
      );
      
      if (moderationResult.requiresReview) {
        updates.moderationStatus = 'pending';
        updates.isFlagged = true;
      }
    }

    const updatedPost = {
      ...post,
      ...updates,
      updatedAt: new Date()
    };

    try {
      const response = await this.makeRequest(`/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      const serverPost = await response.json();
      this.posts.set(postId, serverPost);
      
      this.emit('post_updated', serverPost);
      return serverPost;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }

  async deletePost(postId: string, reason?: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check permissions
    if (!this.canDeletePost(post)) {
      throw new Error('Not authorized to delete this post');
    }

    try {
      await this.makeRequest(`/posts/${postId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      });

      post.isDeleted = true;
      this.posts.set(postId, post);
      
      this.emit('post_deleted', postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }

  // Reply Management
  async createReply(postId: string, content: string, parentReplyId?: string): Promise<ForumReply> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.isLocked) {
      throw new Error('This post is locked and cannot receive new replies');
    }

    // Auto-moderation check
    const moderationResult = await this.checkContentModeration(content);

    const newReply: ForumReply = {
      id: this.generateId(),
      postId,
      content,
      authorId: this.currentUser?.id || 'anonymous',
      authorName: this.currentUser?.displayName,
      isAnonymous: false,
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      isHelpful: false,
      isFlagged: moderationResult.shouldFlag,
      isDeleted: false,
      parentReplyId,
      moderationStatus: moderationResult.requiresReview ? 'pending' : 'approved',
      reportCount: 0
    };

    try {
      const response = await this.makeRequest(`/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify(newReply)
      });

      const createdReply = await response.json();
      
      // Update local cache
      const postReplies = this.replies.get(postId) || [];
      postReplies.push(createdReply);
      this.replies.set(postId, postReplies);
      
      // Update post reply count
      post.replyCount++;
      post.lastReplyAt = new Date();
      
      this.emit('reply_created', createdReply);
      return createdReply;
    } catch (error) {
      console.error('Failed to create reply:', error);
      throw error;
    }
  }

  // Voting System
  async voteOnPost(postId: string, voteType: 'up' | 'down'): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (!this.currentUser) {
      throw new Error('Must be logged in to vote');
    }

    const voteKey = `${this.currentUser.id}-post-${postId}`;
    const existingVote = this.votingRecords.get(voteKey);

    // Check if user already voted
    if (existingVote) {
      if (existingVote.voteType === voteType) {
        throw new Error('You have already voted on this post');
      }
      
      // Change vote
      if (existingVote.voteType === 'up') {
        post.upvotes--;
        post.downvotes++;
      } else {
        post.downvotes--;
        post.upvotes++;
      }
    } else {
      // New vote
      if (voteType === 'up') {
        post.upvotes++;
      } else {
        post.downvotes++;
      }
    }

    // Record vote
    this.votingRecords.set(voteKey, {
      userId: this.currentUser.id,
      targetId: postId,
      targetType: 'post',
      voteType,
      timestamp: new Date()
    });

    try {
      await this.makeRequest(`/posts/${postId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteType })
      });

      this.emit('post_voted', { postId, voteType });
    } catch (error) {
      // Rollback on error
      if (existingVote) {
        if (existingVote.voteType === 'up') {
          post.upvotes++;
          post.downvotes--;
        } else {
          post.downvotes++;
          post.upvotes--;
        }
      } else {
        if (voteType === 'up') {
          post.upvotes--;
        } else {
          post.downvotes--;
        }
      }
      
      throw error;
    }
  }

  // Search and Filtering
  async searchPosts(query: string, filters?: SearchFilters): Promise<ForumPost[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    try {
      const response = await this.makeRequest(`/posts/search?${params}`);
      const results = await response.json();
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  // Get posts by various criteria
  async getRecentPosts(category?: string, limit: number = 20): Promise<ForumPost[]> {
    const allPosts = Array.from(this.posts.values())
      .filter(post => !post.isDeleted && post.moderationStatus === 'approved');
    
    let filtered = category 
      ? allPosts.filter(post => post.category === category)
      : allPosts;
    
    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTrendingPosts(limit: number = 10): Promise<ForumPost[]> {
    const recentPosts = Array.from(this.posts.values())
      .filter(post => !post.isDeleted && post.moderationStatus === 'approved');
    
    // Calculate trending score
    const now = Date.now();
    const postsWithScore = recentPosts.map(post => {
      const ageInHours = (now - post.createdAt.getTime()) / (1000 * 60 * 60);
      const engagement = post.upvotes + (post.replyCount * 2) + (post.viewCount * 0.1);
      const score = engagement / Math.pow(ageInHours + 2, 1.5);
      
      return { post, score };
    });
    
    return postsWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.post);
  }

  async getUnansweredPosts(category?: string, limit: number = 20): Promise<ForumPost[]> {
    const allPosts = Array.from(this.posts.values())
      .filter(post => 
        !post.isDeleted && 
        post.moderationStatus === 'approved' &&
        post.replyCount === 0
      );
    
    let filtered = category 
      ? allPosts.filter(post => post.category === category)
      : allPosts;
    
    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Reporting System
  async reportContent(
    targetType: 'post' | 'reply' | 'user',
    targetId: string,
    reason: ForumReport['reason'],
    description: string
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Must be logged in to report content');
    }

    const report: ForumReport = {
      id: this.generateId(),
      reporterId: this.currentUser.id,
      targetType,
      targetId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date()
    };

    try {
      await this.makeRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(report)
      });

      this.reports.set(report.id, report);
      
      // Update report count on target
      if (targetType === 'post') {
        const post = this.posts.get(targetId);
        if (post) {
          post.reportCount++;
          
          // Auto-flag if too many reports
          if (post.reportCount >= 3) {
            post.isFlagged = true;
            post.moderationStatus = 'flagged';
            this.addToModerationQueue(post, ['Multiple reports received']);
          }
        }
      }
      
      this.emit('content_reported', report);
    } catch (error) {
      console.error('Failed to report content:', error);
      throw error;
    }
  }

  // Moderation Functions
  private async checkContentModeration(content: string): Promise<{
    requiresReview: boolean;
    shouldFlag: boolean;
    reasons: string[];
    confidence: number;
  }> {
    const reasons: string[] = [];
    let confidence = 0;
    
    const lowerContent = content.toLowerCase();
    
    // Check for inappropriate content
    for (const pattern of INAPPROPRIATE_PATTERNS) {
      if (lowerContent.includes(pattern)) {
        reasons.push(`Contains potentially inappropriate content: ${pattern}`);
        confidence += 20;
      }
    }
    
    // Check for crisis keywords
    const crisisLevel = this.detectCrisisLevel(content);
    if (crisisLevel !== 'none' && crisisLevel !== 'low') {
      reasons.push(`Crisis content detected: ${crisisLevel} level`);
      confidence += crisisLevel === 'critical' ? 100 : 50;
    }
    
    // Check for excessive caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 20) {
      reasons.push('Excessive capitalization');
      confidence += 10;
    }
    
    // Check for repeated characters (spam)
    if (/(.)\1{4,}/.test(content)) {
      reasons.push('Repeated characters detected');
      confidence += 15;
    }
    
    // Check for URLs (potential spam)
    if (/(https?:\/\/[^\s]+)/g.test(content)) {
      reasons.push('Contains URLs');
      confidence += 5;
    }
    
    return {
      requiresReview: confidence >= 30,
      shouldFlag: confidence >= 50,
      reasons,
      confidence: Math.min(confidence, 100)
    };
  }

  private detectCrisisLevel(content: string): ForumPost['crisisLevel'] {
    const lowerContent = content.toLowerCase();
    
    // Check critical keywords
    for (const keyword of CRISIS_KEYWORDS.critical) {
      if (lowerContent.includes(keyword)) {
        return 'critical';
      }
    }
    
    // Check high keywords
    for (const keyword of CRISIS_KEYWORDS.high) {
      if (lowerContent.includes(keyword)) {
        return 'high';
      }
    }
    
    // Check medium keywords
    let mediumCount = 0;
    for (const keyword of CRISIS_KEYWORDS.medium) {
      if (lowerContent.includes(keyword)) {
        mediumCount++;
      }
    }
    if (mediumCount >= 2) return 'medium';
    
    // Check low keywords
    let lowCount = 0;
    for (const keyword of CRISIS_KEYWORDS.low) {
      if (lowerContent.includes(keyword)) {
        lowCount++;
      }
    }
    if (lowCount >= 2) return 'low';
    
    return 'none';
  }

  private analyzeSentiment(content: string): ForumPost['sentiment'] {
    // Simple sentiment analysis - in production would use NLP service
    const positive = ['happy', 'great', 'awesome', 'love', 'wonderful', 'amazing', 'better', 'hope'];
    const negative = ['sad', 'angry', 'hate', 'terrible', 'awful', 'worse', 'bad', 'horrible'];
    
    const lowerContent = content.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positive.forEach(word => {
      if (lowerContent.includes(word)) positiveScore++;
    });
    
    negative.forEach(word => {
      if (lowerContent.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    if (positiveScore > 0 && negativeScore > 0) return 'mixed';
    return 'neutral';
  }

  private addToModerationQueue(
    target: ForumPost | ForumReply,
    reasons: string[]
  ): void {
    const item: ModerationItem = {
      id: this.generateId(),
      type: 'postId' in target ? 'reply' : 'post',
      targetId: target.id,
      reason: reasons.join(', '),
      priority: this.determinePriority(target),
      flags: reasons,
      autoDetected: true,
      detectionConfidence: 0.8,
      suggestedAction: this.suggestModerationAction(target, reasons),
      createdAt: new Date()
    };
    
    this.moderationQueue.push(item);
    this.emit('moderation_item_added', item);
  }

  private determinePriority(
    target: ForumPost | ForumReply
  ): ModerationItem['priority'] {
    if ('crisisLevel' in target) {
      switch (target.crisisLevel) {
        case 'critical': return 'critical';
        case 'high': return 'high';
        case 'medium': return 'medium';
        default: return 'low';
      }
    }
    
    if (target.reportCount >= 5) return 'high';
    if (target.reportCount >= 3) return 'medium';
    return 'low';
  }

  private suggestModerationAction(
    target: ForumPost | ForumReply,
    reasons: string[]
  ): ModerationItem['suggestedAction'] {
    // Crisis content should be escalated
    if ('crisisLevel' in target && ['critical', 'high'].includes(target.crisisLevel || '')) {
      return 'escalate';
    }
    
    // Multiple reports suggest removal
    if (target.reportCount >= 5) {
      return 'remove';
    }
    
    // Inappropriate content should be flagged
    if (reasons.some(r => r.includes('inappropriate'))) {
      return 'flag';
    }
    
    return 'approve';
  }

  private async escalateToCrisisTeam(post: ForumPost): Promise<void> {
    // This would connect to crisis intervention system
    try {
      await this.makeRequest('/crisis/escalate', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          authorId: post.authorId,
          content: post.content,
          crisisLevel: post.crisisLevel,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.error('Failed to escalate to crisis team:', error);
      // Don't throw - we don't want to block post creation
    }
  }

  // Permission Checks
  private canEditPost(post: ForumPost): boolean {
    if (!this.currentUser) return false;
    
    // Admins and moderators can edit any post
    if (['admin', 'moderator'].includes(this.currentUser.role)) {
      return true;
    }
    
    // Authors can edit their own posts (within time limit)
    if (post.authorId === this.currentUser.id) {
      const hoursSinceCreation = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation < 24; // 24 hour edit window
    }
    
    return false;
  }

  private canDeletePost(post: ForumPost): boolean {
    if (!this.currentUser) return false;
    
    // Admins and moderators can delete any post
    if (['admin', 'moderator'].includes(this.currentUser.role)) {
      return true;
    }
    
    // Authors can delete their own posts (within time limit)
    if (post.authorId === this.currentUser.id) {
      const hoursSinceCreation = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation < 1; // 1 hour delete window
    }
    
    return false;
  }

  // Statistics
  async getForumStats(): Promise<ForumStats> {
    try {
      const response = await this.makeRequest('/stats');
      return await response.json();
    } catch (error) {
      // Return cached/estimated stats as fallback
      return {
        totalPosts: this.posts.size,
        totalReplies: Array.from(this.replies.values()).reduce((sum, r) => sum + r.length, 0),
        totalMembers: this.users.size,
        activeMembers: Math.floor(this.users.size * 0.3),
        activeToday: Math.floor(this.users.size * 0.1),
        postsToday: Array.from(this.posts.values()).filter(p => {
          const today = new Date();
          return p.createdAt.toDateString() === today.toDateString();
        }).length,
        supportInteractions: 0,
        averageResponseTime: 45,
        crisisInterventions: 0,
        successfulResolutions: 0
      };
    }
  }

  async getCategoryPostCount(categoryId: string): Promise<number> {
    return Array.from(this.posts.values())
      .filter(post => post.category === categoryId && !post.isDeleted)
      .length;
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExcerpt(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Forum API error: ${response.status}`);
    }
    
    return response;
  }

  private setupAutoModeration(): void {
    // Set up periodic moderation queue processing
    setInterval(() => {
      this.processModerationQueue();
    }, 60000); // Every minute
  }

  private async processModerationQueue(): Promise<void> {
    const criticalItems = this.moderationQueue.filter(item => item.priority === 'critical');
    
    for (const item of criticalItems) {
      // Auto-escalate critical items
      if (item.suggestedAction === 'escalate') {
        this.emit('critical_moderation_item', item);
      }
    }
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.posts.clear();
    this.replies.clear();
    this.users.clear();
    this.reports.clear();
    this.votingRecords.clear();
    this.moderationQueue = [];
  }
}

// Export singleton instance
export const forumService = new ForumService();
export default forumService;