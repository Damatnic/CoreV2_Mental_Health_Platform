/**
 * Community Forum Service
 * 
 * Advanced forum system with moderation, peer support matching,
 * group therapy management, and mentor-mentee connections.
 */

import { EventEmitter } from 'events';
import { aiModerationService } from '../aiModerationService';

// ============================
// Type Definitions
// ============================

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  categoryId: string;
  title: string;
  content: string;
  tags: string[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  viewCount: number;
  likeCount: number;
  replyCount: number;
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  moderationStatus: ModerationStatus;
  moderationFlags: ModerationFlag[];
  sentiment: SentimentScore;
  helpfulnessScore: number;
  replies: ForumReply[];
  metadata: PostMetadata;
}

export interface ForumReply {
  id: string;
  postId: string;
  parentReplyId?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  content: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  likeCount: number;
  isAnonymous: boolean;
  isBestAnswer: boolean;
  isDeleted: boolean;
  moderationStatus: ModerationStatus;
  sentiment: SentimentScore;
  helpfulnessScore: number;
  childReplies?: ForumReply[];
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  order: number;
  postCount: number;
  replyCount: number;
  lastActivity?: Date;
  lastPost?: ForumPost;
  moderators: string[];
  rules: string[];
  requiresApproval: boolean;
  isPrivate: boolean;
  allowedRoles: UserRole[];
  subcategories?: ForumCategory[];
}

export type UserRole = 
  | 'member'
  | 'peer_supporter'
  | 'mentor'
  | 'therapist'
  | 'moderator'
  | 'admin';

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video';
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
  mimeType: string;
}

export type ModerationStatus = 
  | 'pending'
  | 'approved'
  | 'flagged'
  | 'removed'
  | 'escalated';

export interface ModerationFlag {
  type: FlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  flaggedBy?: string;
  flaggedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  action?: ModerationAction;
}

export type FlagType = 
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'self_harm'
  | 'violence'
  | 'misinformation'
  | 'inappropriate'
  | 'crisis';

export interface ModerationAction {
  type: 'warning' | 'edit' | 'remove' | 'ban' | 'escalate';
  reason: string;
  performedBy: string;
  performedAt: Date;
  duration?: number; // For temporary bans
}

export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
  overall: 'positive' | 'neutral' | 'negative';
}

export interface PostMetadata {
  readTime: number; // minutes
  wordCount: number;
  language: string;
  topics: string[];
  relatedPosts: string[];
  therapeuticValue: number; // 0-100
}

// Peer Support Types
export interface PeerSupportMatch {
  id: string;
  seekerId: string;
  supporterId: string;
  matchScore: number;
  matchReasons: string[];
  status: MatchStatus;
  createdAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
  messages: PeerMessage[];
  feedback?: MatchFeedback;
  preferences: MatchPreferences;
}

export type MatchStatus = 
  | 'pending'
  | 'accepted'
  | 'active'
  | 'paused'
  | 'ended'
  | 'rejected';

export interface PeerMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  sentiment?: SentimentScore;
}

export interface MatchFeedback {
  rating: number; // 1-5
  helpful: boolean;
  wouldRecommend: boolean;
  comments?: string;
  reportedIssues?: string[];
}

export interface MatchPreferences {
  topics: string[];
  communicationStyle: 'supportive' | 'direct' | 'empathetic' | 'practical';
  availability: AvailabilitySchedule;
  languages: string[];
  ageRange?: [number, number];
  genderPreference?: 'same' | 'different' | 'any';
}

export interface AvailabilitySchedule {
  timezone: string;
  weekdays: TimeSlot[];
  weekends: TimeSlot[];
  responseTime: 'immediate' | 'within_hour' | 'within_day' | 'flexible';
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

// Group Therapy Types
export interface TherapyGroup {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  facilitatorId: string;
  coFacilitators: string[];
  members: GroupMember[];
  maxMembers: number;
  schedule: GroupSchedule;
  status: GroupStatus;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
  sessions: GroupSession[];
  rules: string[];
  requirements: GroupRequirements;
  therapeuticFocus: string[];
  isPrivate: boolean;
}

export type GroupType = 
  | 'support'
  | 'therapy'
  | 'skill_building'
  | 'psychoeducation'
  | 'process'
  | 'crisis';

export interface GroupMember {
  userId: string;
  role: 'member' | 'facilitator' | 'co_facilitator' | 'observer';
  joinedAt: Date;
  attendance: AttendanceRecord[];
  participation: ParticipationMetrics;
  progress: ProgressTracking;
}

export interface GroupSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: string;
  time: string;
  duration: number; // minutes
  timezone: string;
}

export type GroupStatus = 
  | 'forming'
  | 'active'
  | 'full'
  | 'closed'
  | 'completed'
  | 'cancelled';

export interface GroupSession {
  id: string;
  groupId: string;
  sessionNumber: number;
  date: Date;
  topic: string;
  objectives: string[];
  activities: SessionActivity[];
  attendance: string[]; // User IDs
  notes?: string;
  recording?: string;
  materials: Attachment[];
  homework?: string[];
  feedback: SessionFeedback[];
}

export interface SessionActivity {
  name: string;
  type: 'discussion' | 'exercise' | 'meditation' | 'roleplay' | 'sharing';
  duration: number;
  description: string;
  materials?: string[];
}

export interface AttendanceRecord {
  sessionId: string;
  date: Date;
  attended: boolean;
  reason?: string;
}

export interface ParticipationMetrics {
  engagementScore: number; // 0-100
  contributionCount: number;
  supportivenessScore: number;
  insightfulness: number;
}

export interface ProgressTracking {
  goals: TherapyGoal[];
  milestones: Milestone[];
  overallProgress: number; // 0-100
  lastAssessment: Date;
}

export interface TherapyGoal {
  id: string;
  description: string;
  targetDate: Date;
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'achieved' | 'revised';
}

export interface Milestone {
  id: string;
  title: string;
  achievedAt: Date;
  significance: 'minor' | 'moderate' | 'major';
}

export interface SessionFeedback {
  userId: string;
  rating: number; // 1-5
  helpful: boolean;
  topics: string[];
  suggestions?: string;
}

export interface GroupRequirements {
  minAge?: number;
  maxAge?: number;
  diagnoses?: string[];
  commitmentLevel: 'low' | 'medium' | 'high';
  screeningRequired: boolean;
  prerequisites?: string[];
}

// Mentorship Types
export interface MentorshipProgram {
  id: string;
  mentorId: string;
  menteeId: string;
  status: MentorshipStatus;
  matchScore: number;
  matchCriteria: MatchCriteria;
  goals: MentorshipGoal[];
  meetings: MentorshipMeeting[];
  progress: MentorshipProgress;
  startDate: Date;
  expectedDuration: number; // weeks
  actualEndDate?: Date;
  feedback?: MentorshipFeedback;
}

export type MentorshipStatus = 
  | 'matching'
  | 'proposed'
  | 'active'
  | 'paused'
  | 'completed'
  | 'terminated';

export interface MatchCriteria {
  interests: string[];
  expertise: string[];
  experience: string[];
  availability: AvailabilitySchedule;
  communicationPreference: 'text' | 'audio' | 'video' | 'mixed';
  mentoringStyle: 'directive' | 'collaborative' | 'supportive' | 'challenging';
}

export interface MentorshipGoal {
  id: string;
  description: string;
  category: 'personal' | 'professional' | 'wellness' | 'skills';
  targetDate: Date;
  milestones: string[];
  progress: number;
  status: 'planned' | 'active' | 'completed' | 'abandoned';
}

export interface MentorshipMeeting {
  id: string;
  programId: string;
  date: Date;
  duration: number;
  type: 'intro' | 'regular' | 'review' | 'emergency' | 'closing';
  agenda: string[];
  notes?: string;
  actionItems: ActionItem[];
  nextMeetingDate?: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: 'mentor' | 'mentee' | 'both';
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface MentorshipProgress {
  overallProgress: number;
  engagementLevel: 'low' | 'moderate' | 'high';
  relationshipQuality: number; // 0-100
  skillsDeveloped: string[];
  challengesOvercome: string[];
  nextSteps: string[];
}

export interface MentorshipFeedback {
  mentorFeedback: {
    rating: number;
    wouldMentorAgain: boolean;
    menteeStrengths: string[];
    areasForGrowth: string[];
    comments?: string;
  };
  menteeFeedback: {
    rating: number;
    wouldRecommend: boolean;
    mostValuable: string[];
    suggestions?: string;
    comments?: string;
  };
}

// ============================
// Community Forum Service
// ============================

export class CommunityForumService extends EventEmitter {
  private static instance: CommunityForumService;
  private posts: Map<string, ForumPost> = new Map();
  private categories: Map<string, ForumCategory> = new Map();
  private peerMatches: Map<string, PeerSupportMatch> = new Map();
  private therapyGroups: Map<string, TherapyGroup> = new Map();
  private mentorships: Map<string, MentorshipProgram> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private moderationQueue: ModerationItem[] = [];
  private searchIndex: SearchIndex;
  private matchingAlgorithm: MatchingAlgorithm;

  private constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): CommunityForumService {
    if (!CommunityForumService.instance) {
      CommunityForumService.instance = new CommunityForumService();
    }
    return CommunityForumService.instance;
  }

  private async initializeService(): Promise<void> {
    // Initialize search index
    this.searchIndex = new SearchIndex();
    
    // Initialize matching algorithm
    this.matchingAlgorithm = new MatchingAlgorithm();
    
    // Initialize default categories
    this.initializeDefaultCategories();
    
    // Start moderation service
    this.startModerationService();
  }

  private initializeDefaultCategories(): void {
    const defaultCategories: ForumCategory[] = [
      {
        id: 'general',
        name: 'General Discussion',
        description: 'Open discussions about mental health and wellness',
        icon: '💬',
        color: '#6B7280',
        order: 1,
        postCount: 0,
        replyCount: 0,
        moderators: [],
        rules: ['Be respectful', 'No medical advice', 'Support each other'],
        requiresApproval: false,
        isPrivate: false,
        allowedRoles: ['member', 'peer_supporter', 'mentor', 'therapist', 'moderator', 'admin']
      },
      {
        id: 'anxiety',
        name: 'Anxiety Support',
        description: 'Support and strategies for managing anxiety',
        icon: '🌊',
        color: '#3B82F6',
        order: 2,
        postCount: 0,
        replyCount: 0,
        moderators: [],
        rules: ['Share experiences', 'No triggering content', 'Be supportive'],
        requiresApproval: false,
        isPrivate: false,
        allowedRoles: ['member', 'peer_supporter', 'mentor', 'therapist', 'moderator', 'admin']
      },
      {
        id: 'depression',
        name: 'Depression Support',
        description: 'A safe space for those dealing with depression',
        icon: '🌧️',
        color: '#8B5CF6',
        order: 3,
        postCount: 0,
        replyCount: 0,
        moderators: [],
        rules: ['No harmful advice', 'Crisis resources available', 'Be compassionate'],
        requiresApproval: true,
        isPrivate: false,
        allowedRoles: ['member', 'peer_supporter', 'mentor', 'therapist', 'moderator', 'admin']
      },
      {
        id: 'coping',
        name: 'Coping Strategies',
        description: 'Share and learn coping techniques',
        icon: '🛡️',
        color: '#10B981',
        order: 4,
        postCount: 0,
        replyCount: 0,
        moderators: [],
        rules: ['Evidence-based strategies preferred', 'Share what works for you', 'No guarantees'],
        requiresApproval: false,
        isPrivate: false,
        allowedRoles: ['member', 'peer_supporter', 'mentor', 'therapist', 'moderator', 'admin']
      },
      {
        id: 'success',
        name: 'Success Stories',
        description: 'Celebrate victories and progress',
        icon: '🎉',
        color: '#F59E0B',
        order: 5,
        postCount: 0,
        replyCount: 0,
        moderators: [],
        rules: ['Celebrate all victories', 'Be encouraging', 'Share your journey'],
        requiresApproval: false,
        isPrivate: false,
        allowedRoles: ['member', 'peer_supporter', 'mentor', 'therapist', 'moderator', 'admin']
      },
      {
        id: 'professional',
        name: 'Ask a Professional',
        description: 'Questions answered by verified therapists',
        icon: '👨‍⚕️',
        color: '#EF4444',
        order: 6,
        postCount: 0,
        replyCount: 0,
        moderators: [],
        rules: ['General guidance only', 'Not a substitute for therapy', 'No diagnoses'],
        requiresApproval: true,
        isPrivate: false,
        allowedRoles: ['therapist', 'moderator', 'admin']
      }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  private startModerationService(): void {
    // Start automated moderation
    setInterval(() => {
      this.processModerationQueue();
    }, 30000); // Every 30 seconds
  }

  // ============================
  // Forum Post Methods
  // ============================

  public async createPost(
    authorId: string,
    categoryId: string,
    title: string,
    content: string,
    options?: Partial<ForumPost>
  ): Promise<ForumPost> {
    // Validate category
    const category = this.categories.get(categoryId);
    if (!category) {
      throw new Error('Invalid category');
    }

    // Check permissions
    const userProfile = await this.getUserProfile(authorId);
    if (!category.allowedRoles.includes(userProfile.role)) {
      throw new Error('Not authorized to post in this category');
    }

    // Moderate content
    const moderationResult = await this.moderateContent(content);
    
    // Create post
    const post: ForumPost = {
      id: this.generateId('post'),
      authorId,
      authorName: options?.isAnonymous ? 'Anonymous' : userProfile.displayName,
      authorAvatar: options?.isAnonymous ? undefined : userProfile.avatar,
      authorRole: userProfile.role,
      categoryId,
      title,
      content,
      tags: options?.tags || this.extractTags(content),
      attachments: options?.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      replyCount: 0,
      isAnonymous: options?.isAnonymous || false,
      isPinned: false,
      isLocked: false,
      isDeleted: false,
      moderationStatus: category.requiresApproval ? 'pending' : moderationResult.status,
      moderationFlags: moderationResult.flags,
      sentiment: await this.analyzeSentiment(content),
      helpfulnessScore: 0,
      replies: [],
      metadata: {
        readTime: this.calculateReadTime(content),
        wordCount: content.split(/\s+/).length,
        language: this.detectLanguage(content),
        topics: this.extractTopics(content),
        relatedPosts: [],
        therapeuticValue: await this.assessTherapeuticValue(content)
      },
      ...options
    };

    // Check for crisis content
    if (moderationResult.flags.some(f => f.type === 'crisis')) {
      await this.handleCrisisContent(post);
    }

    // Store post
    this.posts.set(post.id, post);

    // Update category
    category.postCount++;
    category.lastActivity = new Date();
    category.lastPost = post;

    // Index for search
    this.searchIndex.addPost(post);

    // Find related posts
    post.metadata.relatedPosts = await this.findRelatedPosts(post);

    // Emit event
    this.emit('post:created', post);

    return post;
  }

  public async replyToPost(
    postId: string,
    authorId: string,
    content: string,
    options?: Partial<ForumReply>
  ): Promise<ForumReply> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.isLocked) {
      throw new Error('Post is locked');
    }

    // Get user profile
    const userProfile = await this.getUserProfile(authorId);

    // Moderate content
    const moderationResult = await this.moderateContent(content);

    // Create reply
    const reply: ForumReply = {
      id: this.generateId('reply'),
      postId,
      authorId,
      authorName: options?.isAnonymous ? 'Anonymous' : userProfile.displayName,
      authorAvatar: options?.isAnonymous ? undefined : userProfile.avatar,
      authorRole: userProfile.role,
      content,
      attachments: options?.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      likeCount: 0,
      isAnonymous: options?.isAnonymous || false,
      isBestAnswer: false,
      isDeleted: false,
      moderationStatus: moderationResult.status,
      sentiment: await this.analyzeSentiment(content),
      helpfulnessScore: 0,
      ...options
    };

    // Add reply to post
    if (options?.parentReplyId) {
      // Nested reply
      const parentReply = this.findReply(post.replies, options.parentReplyId);
      if (parentReply) {
        parentReply.childReplies = parentReply.childReplies || [];
        parentReply.childReplies.push(reply);
      }
    } else {
      // Top-level reply
      post.replies.push(reply);
    }

    // Update post
    post.replyCount++;
    post.updatedAt = new Date();

    // Update category
    const category = this.categories.get(post.categoryId);
    if (category) {
      category.replyCount++;
      category.lastActivity = new Date();
    }

    // Check if reply is helpful
    if (await this.isHelpfulReply(reply, post)) {
      reply.helpfulnessScore = await this.calculateHelpfulness(reply, post);
    }

    // Notify post author
    if (post.authorId !== authorId) {
      await this.notifyUser(post.authorId, {
        type: 'reply',
        postId,
        replyId: reply.id,
        authorName: reply.authorName
      });
    }

    this.emit('reply:created', { post, reply });

    return reply;
  }

  public async likePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    post.likeCount++;
    post.helpfulnessScore = await this.calculateHelpfulness(post);

    this.emit('post:liked', { postId, userId });
  }

  public async searchPosts(
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResults> {
    return this.searchIndex.search(query, filters);
  }

  // ============================
  // Peer Support Methods
  // ============================

  public async requestPeerSupport(
    seekerId: string,
    preferences: MatchPreferences
  ): Promise<PeerSupportMatch[]> {
    // Get seeker profile
    const seekerProfile = await this.getUserProfile(seekerId);

    // Find potential supporters
    const supporters = await this.findPeerSupporters(preferences);

    // Calculate match scores
    const matches: PeerSupportMatch[] = [];
    
    for (const supporter of supporters) {
      const matchScore = this.matchingAlgorithm.calculatePeerMatchScore(
        seekerProfile,
        supporter,
        preferences
      );

      if (matchScore > 0.6) { // 60% match threshold
        const match: PeerSupportMatch = {
          id: this.generateId('match'),
          seekerId,
          supporterId: supporter.userId,
          matchScore,
          matchReasons: this.getMatchReasons(seekerProfile, supporter, preferences),
          status: 'pending',
          createdAt: new Date(),
          messages: [],
          preferences
        };

        matches.push(match);
        this.peerMatches.set(match.id, match);

        // Notify supporter
        await this.notifyUser(supporter.userId, {
          type: 'peer_match',
          matchId: match.id,
          seekerInfo: {
            topics: preferences.topics,
            communicationStyle: preferences.communicationStyle
          }
        });
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches.slice(0, 5); // Return top 5 matches
  }

  public async acceptPeerMatch(matchId: string, supporterId: string): Promise<void> {
    const match = this.peerMatches.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.supporterId !== supporterId) {
      throw new Error('Not authorized');
    }

    match.status = 'accepted';
    match.acceptedAt = new Date();

    // Notify seeker
    await this.notifyUser(match.seekerId, {
      type: 'match_accepted',
      matchId
    });

    this.emit('match:accepted', match);
  }

  public async sendPeerMessage(
    matchId: string,
    senderId: string,
    content: string
  ): Promise<PeerMessage> {
    const match = this.peerMatches.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'accepted' && match.status !== 'active') {
      throw new Error('Match not active');
    }

    // Moderate message
    const moderationResult = await this.moderateContent(content);
    if (moderationResult.status === 'removed') {
      throw new Error('Message contains inappropriate content');
    }

    const message: PeerMessage = {
      id: this.generateId('msg'),
      matchId,
      senderId,
      content,
      timestamp: new Date(),
      isRead: false,
      sentiment: await this.analyzeSentiment(content)
    };

    match.messages.push(message);
    match.status = 'active';

    // Check for crisis content
    if (moderationResult.flags.some(f => f.type === 'crisis')) {
      await this.handleCrisisInPeerSupport(match, message);
    }

    // Notify recipient
    const recipientId = senderId === match.seekerId ? match.supporterId : match.seekerId;
    await this.notifyUser(recipientId, {
      type: 'peer_message',
      matchId,
      messageId: message.id
    });

    this.emit('peer:message', { match, message });

    return message;
  }

  // ============================
  // Group Therapy Methods
  // ============================

  public async createTherapyGroup(
    facilitatorId: string,
    groupData: Partial<TherapyGroup>
  ): Promise<TherapyGroup> {
    // Verify facilitator credentials
    const facilitator = await this.getUserProfile(facilitatorId);
    if (facilitator.role !== 'therapist' && facilitator.role !== 'admin') {
      throw new Error('Only therapists can create therapy groups');
    }

    const group: TherapyGroup = {
      id: this.generateId('group'),
      name: groupData.name || 'Therapy Group',
      description: groupData.description || '',
      type: groupData.type || 'support',
      facilitatorId,
      coFacilitators: groupData.coFacilitators || [],
      members: [{
        userId: facilitatorId,
        role: 'facilitator',
        joinedAt: new Date(),
        attendance: [],
        participation: {
          engagementScore: 100,
          contributionCount: 0,
          supportivenessScore: 100,
          insightfulness: 100
        },
        progress: {
          goals: [],
          milestones: [],
          overallProgress: 0,
          lastAssessment: new Date()
        }
      }],
      maxMembers: groupData.maxMembers || 12,
      schedule: groupData.schedule || {
        frequency: 'weekly',
        dayOfWeek: 'Wednesday',
        time: '18:00',
        duration: 90,
        timezone: 'America/New_York'
      },
      status: 'forming',
      createdAt: new Date(),
      startDate: groupData.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      sessions: [],
      rules: groupData.rules || [
        'Maintain confidentiality',
        'Respect all members',
        'Arrive on time',
        'Participate actively',
        'No advice giving unless requested'
      ],
      requirements: groupData.requirements || {
        commitmentLevel: 'medium',
        screeningRequired: true
      },
      therapeuticFocus: groupData.therapeuticFocus || [],
      isPrivate: groupData.isPrivate || false,
      ...groupData
    };

    this.therapyGroups.set(group.id, group);

    this.emit('group:created', group);

    return group;
  }

  public async joinTherapyGroup(
    groupId: string,
    userId: string,
    application?: GroupApplication
  ): Promise<void> {
    const group = this.therapyGroups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.status === 'full' || group.status === 'closed') {
      throw new Error('Group is not accepting new members');
    }

    if (group.members.length >= group.maxMembers) {
      throw new Error('Group is full');
    }

    // Check requirements
    if (group.requirements.screeningRequired && !application) {
      throw new Error('Application required');
    }

    // Screen application if required
    if (application) {
      const approved = await this.screenGroupApplication(group, application);
      if (!approved) {
        throw new Error('Application not approved');
      }
    }

    // Add member
    const member: GroupMember = {
      userId,
      role: 'member',
      joinedAt: new Date(),
      attendance: [],
      participation: {
        engagementScore: 0,
        contributionCount: 0,
        supportivenessScore: 0,
        insightfulness: 0
      },
      progress: {
        goals: [],
        milestones: [],
        overallProgress: 0,
        lastAssessment: new Date()
      }
    };

    group.members.push(member);

    // Update status if full
    if (group.members.length >= group.maxMembers) {
      group.status = 'full';
    }

    // Notify facilitator
    await this.notifyUser(group.facilitatorId, {
      type: 'group_join',
      groupId,
      userId
    });

    this.emit('group:joined', { group, member });
  }

  public async startGroupSession(
    groupId: string,
    facilitatorId: string,
    sessionData: Partial<GroupSession>
  ): Promise<GroupSession> {
    const group = this.therapyGroups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.facilitatorId !== facilitatorId && !group.coFacilitators.includes(facilitatorId)) {
      throw new Error('Not authorized');
    }

    const session: GroupSession = {
      id: this.generateId('session'),
      groupId,
      sessionNumber: group.sessions.length + 1,
      date: new Date(),
      topic: sessionData.topic || `Session ${group.sessions.length + 1}`,
      objectives: sessionData.objectives || [],
      activities: sessionData.activities || [],
      attendance: [],
      materials: sessionData.materials || [],
      feedback: [],
      ...sessionData
    };

    group.sessions.push(session);
    group.status = 'active';

    // Notify members
    for (const member of group.members) {
      await this.notifyUser(member.userId, {
        type: 'session_starting',
        groupId,
        sessionId: session.id
      });
    }

    this.emit('session:started', { group, session });

    return session;
  }

  // ============================
  // Mentorship Methods
  // ============================

  public async requestMentor(
    menteeId: string,
    criteria: MatchCriteria
  ): Promise<MentorshipProgram[]> {
    // Get mentee profile
    const menteeProfile = await this.getUserProfile(menteeId);

    // Find potential mentors
    const mentors = await this.findMentors(criteria);

    // Calculate match scores
    const programs: MentorshipProgram[] = [];

    for (const mentor of mentors) {
      const matchScore = this.matchingAlgorithm.calculateMentorMatchScore(
        menteeProfile,
        mentor,
        criteria
      );

      if (matchScore > 0.7) { // 70% match threshold for mentorship
        const program: MentorshipProgram = {
          id: this.generateId('mentorship'),
          mentorId: mentor.userId,
          menteeId,
          status: 'proposed',
          matchScore,
          matchCriteria: criteria,
          goals: [],
          meetings: [],
          progress: {
            overallProgress: 0,
            engagementLevel: 'moderate',
            relationshipQuality: 0,
            skillsDeveloped: [],
            challengesOvercome: [],
            nextSteps: []
          },
          startDate: new Date(),
          expectedDuration: 12 // 12 weeks default
        };

        programs.push(program);
        this.mentorships.set(program.id, program);

        // Notify mentor
        await this.notifyUser(mentor.userId, {
          type: 'mentorship_request',
          programId: program.id,
          menteeInfo: {
            interests: criteria.interests,
            goals: criteria.expertise
          }
        });
      }
    }

    return programs.slice(0, 3); // Return top 3 matches
  }

  public async acceptMentorship(
    programId: string,
    mentorId: string
  ): Promise<void> {
    const program = this.mentorships.get(programId);
    if (!program) {
      throw new Error('Mentorship program not found');
    }

    if (program.mentorId !== mentorId) {
      throw new Error('Not authorized');
    }

    program.status = 'active';

    // Schedule first meeting
    const firstMeeting: MentorshipMeeting = {
      id: this.generateId('meeting'),
      programId,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 60,
      type: 'intro',
      agenda: [
        'Introductions and getting to know each other',
        'Discuss goals and expectations',
        'Establish communication preferences',
        'Schedule regular meetings'
      ],
      actionItems: []
    };

    program.meetings.push(firstMeeting);

    // Notify mentee
    await this.notifyUser(program.menteeId, {
      type: 'mentorship_accepted',
      programId,
      firstMeetingDate: firstMeeting.date
    });

    this.emit('mentorship:accepted', program);
  }

  // ============================
  // Moderation Methods
  // ============================

  private async moderateContent(content: string): Promise<ModerationResult> {
    // Use AI moderation service
    const aiResult = await aiModerationService.moderate(content);
    
    const flags: ModerationFlag[] = [];
    let status: ModerationStatus = 'approved';

    // Check for various issues
    if (aiResult.toxicity > 0.7) {
      flags.push({
        type: 'harassment',
        severity: aiResult.toxicity > 0.9 ? 'high' : 'medium',
        reason: 'Toxic content detected',
        flaggedAt: new Date()
      });
      status = 'flagged';
    }

    if (aiResult.selfHarm > 0.6) {
      flags.push({
        type: 'self_harm',
        severity: 'critical',
        reason: 'Self-harm content detected',
        flaggedAt: new Date()
      });
      status = 'escalated';
    }

    if (aiResult.violence > 0.7) {
      flags.push({
        type: 'violence',
        severity: 'high',
        reason: 'Violent content detected',
        flaggedAt: new Date()
      });
      status = 'removed';
    }

    // Check for crisis keywords
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die'];
    const lowerContent = content.toLowerCase();
    
    if (crisisKeywords.some(keyword => lowerContent.includes(keyword))) {
      flags.push({
        type: 'crisis',
        severity: 'critical',
        reason: 'Crisis situation detected',
        flaggedAt: new Date()
      });
      status = 'escalated';
    }

    return { status, flags };
  }

  private async handleCrisisContent(post: ForumPost): Promise<void> {
    // Immediate crisis response
    this.emit('crisis:detected', {
      postId: post.id,
      authorId: post.authorId,
      content: post.content
    });

    // Add crisis resources reply
    const crisisReply: ForumReply = {
      id: this.generateId('crisis-reply'),
      postId: post.id,
      authorId: 'system',
      authorName: 'Crisis Support',
      authorRole: 'admin',
      content: this.getCrisisResourceMessage(),
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      likeCount: 0,
      isAnonymous: false,
      isBestAnswer: true,
      isDeleted: false,
      moderationStatus: 'approved',
      sentiment: { positive: 1, neutral: 0, negative: 0, overall: 'positive' },
      helpfulnessScore: 100
    };

    post.replies.unshift(crisisReply);

    // Notify moderators
    await this.notifyModerators({
      type: 'crisis_post',
      postId: post.id,
      authorId: post.authorId
    });
  }

  private getCrisisResourceMessage(): string {
    return `
If you're in crisis or having thoughts of suicide, please reach out for immediate help:

**Emergency Resources:**
- **Call 988** - Suicide & Crisis Lifeline (24/7)
- **Text HOME to 741741** - Crisis Text Line
- **Call 911** - For immediate emergency

**International Resources:**
- UK: 116 123 (Samaritans)
- Australia: 13 11 14 (Lifeline)
- Canada: 1-833-456-4566

You are not alone, and help is available. Please reach out to someone who can support you right now.
    `.trim();
  }

  private async handleCrisisInPeerSupport(
    match: PeerSupportMatch,
    message: PeerMessage
  ): Promise<void> {
    // Notify both parties about crisis resources
    await this.notifyUser(match.seekerId, {
      type: 'crisis_resources',
      message: this.getCrisisResourceMessage()
    });

    await this.notifyUser(match.supporterId, {
      type: 'crisis_alert',
      matchId: match.id,
      guidance: 'Crisis content detected. Please encourage seeking professional help.'
    });

    // Escalate to moderators
    await this.notifyModerators({
      type: 'crisis_peer_support',
      matchId: match.id,
      messageId: message.id
    });
  }

  private async processModerationQueue(): Promise<void> {
    while (this.moderationQueue.length > 0) {
      const item = this.moderationQueue.shift();
      if (item) {
        await this.processModerationItem(item);
      }
    }
  }

  private async processModerationItem(item: ModerationItem): Promise<void> {
    // Process moderation item based on type and severity
    // Implementation depends on specific moderation policies
  }

  // ============================
  // Helper Methods
  // ============================

  private async analyzeSentiment(text: string): Promise<SentimentScore> {
    // Simplified sentiment analysis
    // In production, use NLP service
    const positiveWords = ['good', 'great', 'happy', 'helpful', 'thank', 'appreciate'];
    const negativeWords = ['bad', 'terrible', 'sad', 'angry', 'hate', 'awful'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positive = 0;
    let negative = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positive++;
      if (negativeWords.includes(word)) negative++;
    });
    
    const total = positive + negative || 1;
    const positiveScore = positive / total;
    const negativeScore = negative / total;
    const neutralScore = 1 - positiveScore - negativeScore;
    
    return {
      positive: positiveScore,
      neutral: neutralScore,
      negative: negativeScore,
      overall: positiveScore > negativeScore ? 'positive' : 
               negativeScore > positiveScore ? 'negative' : 'neutral'
    };
  }

  private extractTags(content: string): string[] {
    // Extract hashtags and relevant keywords
    const hashtags = content.match(/#\w+/g) || [];
    const keywords = this.extractKeywords(content);
    return [...new Set([...hashtags, ...keywords])].slice(0, 5);
  }

  private extractKeywords(content: string): string[] {
    // Simplified keyword extraction
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Return top keywords
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractTopics(content: string): string[] {
    // Topic extraction using keyword matching
    const topicKeywords = {
      anxiety: ['anxiety', 'anxious', 'worry', 'panic', 'nervous'],
      depression: ['depression', 'depressed', 'sad', 'hopeless', 'empty'],
      therapy: ['therapy', 'therapist', 'counseling', 'treatment', 'session'],
      medication: ['medication', 'medicine', 'pills', 'prescription', 'dose'],
      relationships: ['relationship', 'partner', 'family', 'friends', 'social'],
      work: ['work', 'job', 'career', 'boss', 'workplace'],
      sleep: ['sleep', 'insomnia', 'tired', 'rest', 'dreams'],
      trauma: ['trauma', 'ptsd', 'flashback', 'trigger', 'abuse']
    };
    
    const lowerContent = content.toLowerCase();
    const detectedTopics: string[] = [];
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        detectedTopics.push(topic);
      }
    }
    
    return detectedTopics;
  }

  private async assessTherapeuticValue(content: string): Promise<number> {
    // Assess the therapeutic value of content
    let value = 50; // Base value
    
    // Positive indicators
    if (content.includes('helped') || content.includes('better')) value += 10;
    if (content.includes('strategy') || content.includes('technique')) value += 10;
    if (content.includes('support') || content.includes('understand')) value += 10;
    if (content.includes('cope') || content.includes('manage')) value += 10;
    
    // Negative indicators
    if (content.includes('worse') || content.includes('hopeless')) value -= 10;
    if (content.includes('give up') || content.includes('no point')) value -= 20;
    
    // Ensure value is between 0 and 100
    return Math.max(0, Math.min(100, value));
  }

  private calculateReadTime(content: string): number {
    // Average reading speed: 200 words per minute
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }

  private detectLanguage(content: string): string {
    // Simplified language detection
    // In production, use a proper language detection library
    return 'en';
  }

  private async findRelatedPosts(post: ForumPost): Promise<string[]> {
    // Find related posts using search index
    const results = await this.searchIndex.findSimilar(post);
    return results.map(r => r.id).slice(0, 5);
  }

  private findReply(replies: ForumReply[], replyId: string): ForumReply | undefined {
    for (const reply of replies) {
      if (reply.id === replyId) return reply;
      if (reply.childReplies) {
        const found = this.findReply(reply.childReplies, replyId);
        if (found) return found;
      }
    }
    return undefined;
  }

  private async isHelpfulReply(reply: ForumReply, post: ForumPost): Promise<boolean> {
    // Check if reply is helpful based on content analysis
    const hasAdvice = reply.content.includes('try') || reply.content.includes('suggest');
    const hasSupport = reply.content.includes('understand') || reply.content.includes('relate');
    const hasResources = reply.content.includes('http') || reply.content.includes('book');
    
    return hasAdvice || hasSupport || hasResources;
  }

  private async calculateHelpfulness(item: ForumPost | ForumReply, context?: ForumPost): Promise<number> {
    let score = 50; // Base score
    
    // Positive sentiment adds to helpfulness
    if (item.sentiment.overall === 'positive') score += 20;
    
    // Length and detail
    const wordCount = item.content.split(/\s+/).length;
    if (wordCount > 100) score += 10;
    if (wordCount > 200) score += 10;
    
    // Engagement metrics
    if (item.likeCount > 0) score += Math.min(item.likeCount * 5, 20);
    
    return Math.min(100, score);
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Get or create user profile
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        displayName: `User${userId.substring(0, 6)}`,
        role: 'member',
        joinedAt: new Date(),
        reputation: 0,
        badges: [],
        bio: '',
        interests: [],
        expertise: [],
        availability: {
          timezone: 'UTC',
          weekdays: [],
          weekends: [],
          responseTime: 'flexible'
        }
      };
      this.userProfiles.set(userId, profile);
    }
    
    return profile;
  }

  private async findPeerSupporters(preferences: MatchPreferences): Promise<UserProfile[]> {
    // Find users who are peer supporters
    const supporters: UserProfile[] = [];
    
    this.userProfiles.forEach(profile => {
      if (profile.role === 'peer_supporter' || profile.role === 'mentor') {
        // Check if supporter matches preferences
        if (this.matchesPreferences(profile, preferences)) {
          supporters.push(profile);
        }
      }
    });
    
    return supporters;
  }

  private matchesPreferences(profile: UserProfile, preferences: MatchPreferences): boolean {
    // Check topic overlap
    const topicMatch = preferences.topics.some(topic => 
      profile.interests.includes(topic) || profile.expertise.includes(topic)
    );
    
    // Check language match
    const languageMatch = preferences.languages.some(lang =>
      profile.languages?.includes(lang)
    );
    
    // Check availability overlap
    // Simplified check - in production would be more complex
    const availabilityMatch = true;
    
    return topicMatch && languageMatch && availabilityMatch;
  }

  private getMatchReasons(
    seeker: UserProfile,
    supporter: UserProfile,
    preferences: MatchPreferences
  ): string[] {
    const reasons: string[] = [];
    
    // Check shared interests
    const sharedInterests = seeker.interests.filter(i => supporter.interests.includes(i));
    if (sharedInterests.length > 0) {
      reasons.push(`Shared interests: ${sharedInterests.join(', ')}`);
    }
    
    // Check expertise match
    const relevantExpertise = supporter.expertise.filter(e => preferences.topics.includes(e));
    if (relevantExpertise.length > 0) {
      reasons.push(`Relevant experience: ${relevantExpertise.join(', ')}`);
    }
    
    // Check communication style
    if (supporter.communicationStyle === preferences.communicationStyle) {
      reasons.push(`Compatible communication style`);
    }
    
    // Check availability
    if (supporter.availability.responseTime === preferences.availability.responseTime) {
      reasons.push(`Similar availability`);
    }
    
    return reasons;
  }

  private async findMentors(criteria: MatchCriteria): Promise<UserProfile[]> {
    const mentors: UserProfile[] = [];
    
    this.userProfiles.forEach(profile => {
      if (profile.role === 'mentor' || profile.role === 'therapist') {
        // Check if mentor matches criteria
        if (this.matchesCriteria(profile, criteria)) {
          mentors.push(profile);
        }
      }
    });
    
    return mentors;
  }

  private matchesCriteria(profile: UserProfile, criteria: MatchCriteria): boolean {
    // Check expertise overlap
    const expertiseMatch = criteria.expertise.some(exp =>
      profile.expertise.includes(exp)
    );
    
    // Check experience requirements
    const experienceMatch = criteria.experience.some(exp =>
      profile.experience?.includes(exp)
    );
    
    return expertiseMatch || experienceMatch;
  }

  private async screenGroupApplication(
    group: TherapyGroup,
    application: GroupApplication
  ): Promise<boolean> {
    // Screen application based on group requirements
    // In production, this would involve more complex screening logic
    
    // Check age requirements
    if (group.requirements.minAge && application.age < group.requirements.minAge) {
      return false;
    }
    if (group.requirements.maxAge && application.age > group.requirements.maxAge) {
      return false;
    }
    
    // Check diagnosis match
    if (group.requirements.diagnoses && group.requirements.diagnoses.length > 0) {
      const hasMatchingDiagnosis = group.requirements.diagnoses.some(d =>
        application.diagnoses?.includes(d)
      );
      if (!hasMatchingDiagnosis) return false;
    }
    
    // Check commitment level
    if (application.commitmentLevel < group.requirements.commitmentLevel) {
      return false;
    }
    
    return true;
  }

  private async notifyUser(userId: string, notification: any): Promise<void> {
    // Send notification to user
    this.emit('notification', { userId, ...notification });
  }

  private async notifyModerators(alert: any): Promise<void> {
    // Notify all moderators
    this.userProfiles.forEach(profile => {
      if (profile.role === 'moderator' || profile.role === 'admin') {
        this.notifyUser(profile.userId, alert);
      }
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================
// Supporting Classes
// ============================

class SearchIndex {
  private posts: Map<string, ForumPost> = new Map();
  private index: Map<string, Set<string>> = new Map(); // word -> post IDs

  public addPost(post: ForumPost): void {
    this.posts.set(post.id, post);
    
    // Index title and content
    const words = this.tokenize(post.title + ' ' + post.content);
    words.forEach(word => {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }
      this.index.get(word)!.add(post.id);
    });
  }

  public async search(query: string, filters?: SearchFilters): Promise<SearchResults> {
    const words = this.tokenize(query);
    const results = new Map<string, number>(); // post ID -> relevance score
    
    // Find posts containing query words
    words.forEach(word => {
      const postIds = this.index.get(word);
      if (postIds) {
        postIds.forEach(postId => {
          results.set(postId, (results.get(postId) || 0) + 1);
        });
      }
    });
    
    // Convert to array and sort by relevance
    const sortedResults = Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([postId]) => this.posts.get(postId)!)
      .filter(post => post && this.matchesFilters(post, filters));
    
    return {
      posts: sortedResults.slice(0, 20),
      total: sortedResults.length
    };
  }

  public async findSimilar(post: ForumPost): Promise<ForumPost[]> {
    // Find posts with similar content
    const words = this.tokenize(post.title + ' ' + post.content);
    const similar = new Map<string, number>();
    
    words.forEach(word => {
      const postIds = this.index.get(word);
      if (postIds) {
        postIds.forEach(postId => {
          if (postId !== post.id) {
            similar.set(postId, (similar.get(postId) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(similar.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([postId]) => this.posts.get(postId)!)
      .filter(p => p);
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private matchesFilters(post: ForumPost, filters?: SearchFilters): boolean {
    if (!filters) return true;
    
    if (filters.categoryId && post.categoryId !== filters.categoryId) return false;
    if (filters.authorId && post.authorId !== filters.authorId) return false;
    if (filters.tags && !filters.tags.some(tag => post.tags.includes(tag))) return false;
    if (filters.dateFrom && post.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && post.createdAt > filters.dateTo) return false;
    
    return true;
  }
}

class MatchingAlgorithm {
  public calculatePeerMatchScore(
    seeker: UserProfile,
    supporter: UserProfile,
    preferences: MatchPreferences
  ): number {
    let score = 0;
    let factors = 0;
    
    // Interest overlap (30%)
    const sharedInterests = seeker.interests.filter(i => supporter.interests.includes(i));
    score += (sharedInterests.length / Math.max(seeker.interests.length, 1)) * 0.3;
    factors += 0.3;
    
    // Expertise match (25%)
    const relevantExpertise = supporter.expertise.filter(e => preferences.topics.includes(e));
    score += (relevantExpertise.length / Math.max(preferences.topics.length, 1)) * 0.25;
    factors += 0.25;
    
    // Communication style (20%)
    if (supporter.communicationStyle === preferences.communicationStyle) {
      score += 0.2;
    }
    factors += 0.2;
    
    // Availability match (15%)
    if (supporter.availability.responseTime === preferences.availability.responseTime) {
      score += 0.15;
    }
    factors += 0.15;
    
    // Reputation (10%)
    score += Math.min(supporter.reputation / 1000, 0.1);
    factors += 0.1;
    
    return score / factors;
  }

  public calculateMentorMatchScore(
    mentee: UserProfile,
    mentor: UserProfile,
    criteria: MatchCriteria
  ): number {
    let score = 0;
    let factors = 0;
    
    // Expertise match (35%)
    const expertiseOverlap = criteria.expertise.filter(e => mentor.expertise.includes(e));
    score += (expertiseOverlap.length / Math.max(criteria.expertise.length, 1)) * 0.35;
    factors += 0.35;
    
    // Experience match (25%)
    const experienceOverlap = criteria.experience.filter(e => mentor.experience?.includes(e));
    score += (experienceOverlap.length / Math.max(criteria.experience.length, 1)) * 0.25;
    factors += 0.25;
    
    // Interest alignment (20%)
    const sharedInterests = criteria.interests.filter(i => mentor.interests.includes(i));
    score += (sharedInterests.length / Math.max(criteria.interests.length, 1)) * 0.2;
    factors += 0.2;
    
    // Availability match (10%)
    if (mentor.availability.responseTime === criteria.availability.responseTime) {
      score += 0.1;
    }
    factors += 0.1;
    
    // Mentoring style (10%)
    if (mentor.mentoringStyle === criteria.mentoringStyle) {
      score += 0.1;
    }
    factors += 0.1;
    
    return score / factors;
  }
}

// ============================
// Type Definitions for Internal Use
// ============================

interface UserProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  joinedAt: Date;
  reputation: number;
  badges: string[];
  bio: string;
  interests: string[];
  expertise: string[];
  experience?: string[];
  languages?: string[];
  communicationStyle?: MatchPreferences['communicationStyle'];
  mentoringStyle?: MatchCriteria['mentoringStyle'];
  availability: AvailabilitySchedule;
}

interface ModerationResult {
  status: ModerationStatus;
  flags: ModerationFlag[];
}

interface ModerationItem {
  id: string;
  type: 'post' | 'reply' | 'message';
  content: string;
  authorId: string;
  flags: ModerationFlag[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

interface SearchFilters {
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

interface SearchResults {
  posts: ForumPost[];
  total: number;
}

interface GroupApplication {
  userId: string;
  age: number;
  diagnoses?: string[];
  commitmentLevel: 'low' | 'medium' | 'high';
  goals: string[];
  previousTherapy: boolean;
  medications?: string[];
  emergencyContact: string;
}

// Export singleton instance
export const communityForumService = CommunityForumService.getInstance();

// Export convenience functions
export const createForumPost = (
  authorId: string,
  categoryId: string,
  title: string,
  content: string,
  options?: Partial<ForumPost>
) => communityForumService.createPost(authorId, categoryId, title, content, options);

export const replyToForumPost = (
  postId: string,
  authorId: string,
  content: string,
  options?: Partial<ForumReply>
) => communityForumService.replyToPost(postId, authorId, content, options);

export const requestPeerSupport = (
  seekerId: string,
  preferences: MatchPreferences
) => communityForumService.requestPeerSupport(seekerId, preferences);

export const createTherapyGroup = (
  facilitatorId: string,
  groupData: Partial<TherapyGroup>
) => communityForumService.createTherapyGroup(facilitatorId, groupData);

export const requestMentor = (
  menteeId: string,
  criteria: MatchCriteria
) => communityForumService.requestMentor(menteeId, criteria);