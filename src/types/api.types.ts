/**
 * Comprehensive API Response Types for Mental Health Platform
 * 
 * This file defines all API response types used throughout the application,
 * providing type safety and consistency for all API interactions.
 */

import { ApiResponse, PaginatedResponse, Timestamped, WithUserId, WithOptionalUserId } from './common';

// ============================================================================
// Base API Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiMeta {
  version: string;
  requestId: string;
  timestamp: string;
  processingTime?: number;
}

export interface EnhancedApiResponse<T = unknown> extends ApiResponse<T> {
  meta?: ApiMeta;
  errors?: ApiError[];
}

// ============================================================================
// Authentication API Types
// ============================================================================

export interface ApiUser extends Timestamped {
  id: string;
  email?: string;
  username?: string;
  isAnonymous: boolean;
  profile?: ApiUserProfile;
  preferences?: ApiUserPreferences;
  isVerified: boolean;
  lastLoginAt?: string;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'deleted';
  roles: UserRole[];
}

export interface ApiUserProfile {
  displayName?: string;
  avatar?: string;
  bio?: string;
  preferredName?: string;
  pronouns?: string;
  timezone?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface ApiUserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  reminders: boolean;
  communityUpdates: boolean;
  systemUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  activitySharing: boolean;
  analyticsOptOut: boolean;
  dataRetention: number; // days
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope?: string[];
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  confirmPassword: string;
  isAnonymous?: boolean;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface AuthResponse extends ApiResponse<{
  user: ApiUser;
  tokens: AuthTokens;
}> {}

export interface UserResponse extends ApiResponse<ApiUser> {}

export interface UsersResponse extends PaginatedResponse<ApiUser> {}

// ============================================================================
// Mental Health Data Types
// ============================================================================

export interface ApiMoodEntry extends Timestamped, WithUserId {
  id: string;
  mood: number; // 1-10 scale
  emotions: string[];
  notes?: string;
  activities?: string[];
  sleepHours?: number;
  energyLevel?: number; // 1-10 scale
  stressLevel?: number; // 1-10 scale
  symptoms?: string[];
  triggers?: string[];
  copingStrategies?: string[];
  tags?: string[];
}

export interface ApiJournalEntry extends Timestamped, WithUserId {
  id: string;
  title?: string;
  content: string;
  mood?: number;
  isPrivate: boolean;
  tags?: string[];
  wordCount: number;
  readingTime: number; // minutes
  sentiment?: {
    score: number; // -1 to 1
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  aiInsights?: string[];
}

export interface ApiSafetyPlan extends Timestamped, WithUserId {
  id: string;
  warningSignals: string[];
  copingStrategies: string[];
  socialContacts: SafetyContact[];
  professionalContacts: SafetyContact[];
  environmentSafety: string[];
  reasonsForLiving: string[];
  emergencyContacts: ApiEmergencyContact[];
  isActive: boolean;
  lastReviewed?: string;
}

export interface SafetyContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  notes?: string;
  isEmergency: boolean;
  isAvailable24h: boolean;
}

export interface ApiEmergencyContact {
  id: string;
  name: string;
  phone: string;
  description: string;
  isLocal: boolean;
  isActive: boolean;
}

export interface TherapySession extends Timestamped, WithUserId {
  id: string;
  type: 'individual' | 'group' | 'couples' | 'family' | 'ai';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  scheduledAt: string;
  duration: number; // minutes
  therapistId?: string;
  therapistName?: string;
  notes?: string;
  sessionSummary?: string;
  homework?: string[];
  nextSessionAt?: string;
  rating?: number; // 1-5 stars
  feedback?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
}

export interface ApiCrisisEvent extends Timestamped, WithOptionalUserId {
  id: string;
  type: 'panic_attack' | 'suicidal_thoughts' | 'self_harm' | 'substance_abuse' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'de-escalated' | 'resolved' | 'escalated';
  description?: string;
  triggeredSafetyPlan: boolean;
  interventions: string[];
  contactedSupport: boolean;
  supportContacts?: string[];
  followUpRequired: boolean;
  followUpAt?: string;
  location?: {
    country: string;
    region?: string;
    isApproximate: boolean;
  };
  deviceInfo?: {
    platform: string;
    userAgent?: string;
  };
}

// API Response Types for Mental Health Data
export interface MoodEntryResponse extends ApiResponse<ApiMoodEntry> {}
export interface MoodEntriesResponse extends PaginatedResponse<ApiMoodEntry> {}

export interface JournalEntryResponse extends ApiResponse<ApiJournalEntry> {}
export interface JournalEntriesResponse extends PaginatedResponse<ApiJournalEntry> {}

export interface SafetyPlanResponse extends ApiResponse<ApiSafetyPlan> {}
export interface SafetyPlansResponse extends PaginatedResponse<ApiSafetyPlan> {}

export interface TherapySessionResponse extends ApiResponse<TherapySession> {}
export interface TherapySessionsResponse extends PaginatedResponse<TherapySession> {}

export interface CrisisEventResponse extends ApiResponse<ApiCrisisEvent> {}
export interface CrisisEventsResponse extends PaginatedResponse<ApiCrisisEvent> {}

// ============================================================================
// Community & Social Types
// ============================================================================

export interface Community extends Timestamped {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'invite-only';
  category: string;
  memberCount: number;
  moderatorIds: string[];
  rules: string[];
  isActive: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  tags: string[];
}

export interface Post extends Timestamped, WithUserId {
  id: string;
  communityId?: string;
  title?: string;
  content: string;
  type: 'text' | 'poll' | 'image' | 'video' | 'link' | 'resource';
  isAnonymous: boolean;
  authorDisplayName?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  attachments?: Attachment[];
  poll?: Poll;
  isModerated: boolean;
  moderationStatus: 'approved' | 'pending' | 'rejected';
  visibility: 'public' | 'community' | 'followers' | 'private';
}

export interface Comment extends Timestamped, WithUserId {
  id: string;
  postId: string;
  parentCommentId?: string;
  content: string;
  isAnonymous: boolean;
  authorDisplayName?: string;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isDeleted: boolean;
  replies?: Comment[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  endsAt?: string;
  totalVotes: number;
  userVote?: string[]; // option IDs
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  alt?: string;
  caption?: string;
}

// API Response Types for Community Data
export interface CommunityResponse extends ApiResponse<Community> {}
export interface CommunitiesResponse extends PaginatedResponse<Community> {}

export interface PostResponse extends ApiResponse<Post> {}
export interface PostsResponse extends PaginatedResponse<Post> {}

export interface CommentResponse extends ApiResponse<Comment> {}
export interface CommentsResponse extends PaginatedResponse<Comment> {}

// ============================================================================
// AI & ML Types
// ============================================================================

export interface AIAnalysis {
  id: string;
  type: 'mood' | 'crisis' | 'sentiment' | 'risk' | 'recommendation';
  confidence: number; // 0-1
  results: Record<string, unknown>;
  model: {
    name: string;
    version: string;
    accuracy?: number;
  };
  processedAt: string;
  processingTime: number; // milliseconds
}

export interface AIChatMessage extends Timestamped, WithOptionalUserId {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'image' | 'audio' | 'file';
  metadata?: {
    mood?: number;
    sentiment?: number;
    crisisLevel?: number;
    suggestions?: string[];
    resources?: string[];
  };
  isEncrypted: boolean;
  attachments?: Attachment[];
}

export interface AIChatSession extends Timestamped, WithOptionalUserId {
  id: string;
  title?: string;
  status: 'active' | 'paused' | 'ended';
  messageCount: number;
  duration: number; // seconds
  model: string;
  context: {
    userMood?: number;
    recentEntries?: string[];
    safetyPlanActive?: boolean;
    crisisMode?: boolean;
  };
  summary?: string;
  tags?: string[];
}

export interface AIAnalysisResponse extends ApiResponse<AIAnalysis> {}
export interface AIChatMessageResponse extends ApiResponse<AIChatMessage> {}
export interface AIChatMessagesResponse extends PaginatedResponse<AIChatMessage> {}
export interface AIChatSessionResponse extends ApiResponse<AIChatSession> {}
export interface AIChatSessionsResponse extends PaginatedResponse<AIChatSession> {}

// ============================================================================
// Analytics & Insights Types
// ============================================================================

export interface UserInsights {
  moodTrends: {
    average: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
    period: string;
    data: Array<{ date: string; value: number }>;
  };
  journalInsights: {
    totalEntries: number;
    totalWords: number;
    averageLength: number;
    mostCommonTags: Array<{ tag: string; count: number }>;
    sentimentTrend: 'positive' | 'neutral' | 'negative';
  };
  activityPatterns: {
    mostActiveTime: string;
    mostActiveDay: string;
    streakDays: number;
    consistencyScore: number; // 0-100
  };
  crisisMetrics: {
    totalEvents: number;
    averageResolutionTime: number; // minutes
    mostCommonTriggers: string[];
    improvementTrend: 'better' | 'same' | 'worse';
  };
  recommendations: Array<{
    type: 'activity' | 'resource' | 'reminder' | 'intervention';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionUrl?: string;
  }>;
}

export interface SystemAnalytics {
  users: {
    total: number;
    active: number;
    new: number;
    returning: number;
    anonymous: number;
  };
  engagement: {
    avgSessionDuration: number; // minutes
    avgEntriesPerUser: number;
    mostUsedFeatures: Array<{ feature: string; usage: number }>;
    retentionRate: number; // percentage
  };
  crisis: {
    totalEvents: number;
    averageResponseTime: number; // minutes
    resolutionRate: number; // percentage
    riskLevels: Record<string, number>;
  };
  performance: {
    avgResponseTime: number; // milliseconds
    errorRate: number; // percentage
    uptime: number; // percentage
    cacheHitRate: number; // percentage
  };
}

export interface UserInsightsResponse extends ApiResponse<UserInsights> {}
export interface SystemAnalyticsResponse extends ApiResponse<SystemAnalytics> {}

// ============================================================================
// Resource & Content Types
// ============================================================================

export interface Resource extends Timestamped {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'tool' | 'hotline' | 'app' | 'book';
  category: string;
  subcategory?: string;
  url?: string;
  content?: string;
  author?: string;
  source?: string;
  tags: string[];
  rating: number; // 1-5 stars
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  language: string;
  readingTime?: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: string[];
  relatedResourceIds: string[];
  downloadUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
}

export interface ResourceCollection extends Timestamped {
  id: string;
  title: string;
  description: string;
  resourceIds: string[];
  creatorId: string;
  isPublic: boolean;
  tags: string[];
  likeCount: number;
  bookmarkCount: number;
  category: string;
}

export interface ResourceResponse extends ApiResponse<Resource> {}
export interface ResourcesResponse extends PaginatedResponse<Resource> {}

export interface ResourceCollectionResponse extends ApiResponse<ResourceCollection> {}
export interface ResourceCollectionsResponse extends PaginatedResponse<ResourceCollection> {}

// ============================================================================
// Notification Types
// ============================================================================

export interface ApiNotification extends Timestamped {
  id: string;
  userId: string;
  type: 'reminder' | 'social' | 'system' | 'crisis' | 'achievement';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'in-app' | 'email' | 'push' | 'sms';
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    types: string[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    types: string[];
    quietHours?: {
      start: string; // HH:mm
      end: string; // HH:mm
    };
  };
  inApp: {
    enabled: boolean;
    types: string[];
    showCount: boolean;
  };
}

export interface NotificationResponse extends ApiResponse<ApiNotification> {}
export interface NotificationsResponse extends PaginatedResponse<ApiNotification> {}

// ============================================================================
// System & Configuration Types
// ============================================================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    lastCheck: string;
  }>;
  version: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

export interface AppConfig {
  features: {
    aiChat: boolean;
    videoCall: boolean;
    community: boolean;
    analytics: boolean;
    crisisDetection: boolean;
  };
  limits: {
    maxFileSize: number; // bytes
    maxJournalLength: number; // characters
    maxCommunities: number;
    maxSessionDuration: number; // minutes
  };
  crisis: {
    hotlines: EmergencyContact[];
    autoEscalationEnabled: boolean;
    escalationThreshold: number;
  };
  ai: {
    models: Array<{
      name: string;
      version: string;
      isActive: boolean;
      capabilities: string[];
    }>;
    rateLimit: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
  };
}

export interface SystemHealthResponse extends ApiResponse<SystemHealth> {}
export interface AppConfigResponse extends ApiResponse<AppConfig> {}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateMoodEntryRequest extends Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'> {}
export interface UpdateMoodEntryRequest extends Partial<CreateMoodEntryRequest> {}

export interface CreateJournalEntryRequest extends Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'wordCount' | 'readingTime' | 'sentiment' | 'aiInsights'> {}
export interface UpdateJournalEntryRequest extends Partial<CreateJournalEntryRequest> {}

export interface CreatePostRequest extends Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked' | 'isBookmarked' | 'moderationStatus'> {}
export interface UpdatePostRequest extends Partial<CreatePostRequest> {}

export interface CreateCommentRequest extends Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'likesCount' | 'repliesCount' | 'isLiked' | 'isDeleted' | 'replies'> {}
export interface UpdateCommentRequest extends Partial<CreateCommentRequest> {}

export interface SendAIMessageRequest {
  sessionId?: string;
  content: string;
  type?: 'text' | 'image' | 'audio' | 'file';
  attachments?: File[];
  context?: Record<string, unknown>;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchResponse<T> extends ApiResponse<SearchResult<T>[]> {
  query: string;
  totalResults: number;
  took: number; // milliseconds
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
}

// Export all types for easy importing
export type {
  // Re-export from common types
  ApiResponse,
  PaginatedResponse,
  Timestamped,
  WithUserId,
  WithOptionalUserId,
};