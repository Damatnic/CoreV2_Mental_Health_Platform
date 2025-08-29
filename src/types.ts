/**
 * Core Types for CoreV2 Mental Health Platform
 * Clean, comprehensive type definitions for the entire application
 */

// UserRole type definition
export type UserRole = 
  | 'user' 
  | 'helper' 
  | 'therapist' 
  | 'moderator' 
  | 'admin' 
  | 'superadmin';

// ======================== USER TYPES ========================

export interface LegacyUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  roles?: UserRole[];
  picture?: string;
  avatar?: string; // Alias for picture for backward compatibility
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ======================== DILEMMA TYPES ========================

export type DilemmaStatus = 
  | 'active' 
  | 'in_progress' 
  | 'resolved' 
  | 'direct_request' 
  | 'declined' 
  | 'removed_by_moderator';

export interface Dilemma {
  id: string;
  userToken: string;
  userId?: string;
  title?: string;
  category: string;
  content: string;
  timestamp: string;
  postedAt?: string;
  anonymous?: boolean;
  supportCount: number;
  isSupported: boolean;
  isReported: boolean;
  reportReason?: string;
  status: DilemmaStatus;
  assignedHelperId?: string;
  helperDisplayName?: string;
  resolved_by_seeker?: boolean;
  requestedHelperId?: string;
  summary?: string;
  summaryLoading?: boolean;
  moderation?: {
    action: 'removed' | 'dismissed';
    moderatorId: string;
    timestamp: string;
    flagged?: boolean;
    approved?: boolean;
    reviewedBy?: string;
    reviewedAt?: string;
  };
}

// ======================== HELPER TYPES ========================

export interface Helper {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  bio?: string;
  expertise?: string[];
  rating?: number;
  isAvailable: boolean;
  profilePicture?: string;
  profileImage?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isVerified?: boolean;
  specializations?: string[];
  languages?: string[];
  timezone?: string;
  responseTime?: string;
  totalSessions?: number;
  successRate?: number;
  createdAt: string;
  updatedAt: string;
  joinedDate?: string;
  lastActive?: string;
  hourlyRate?: number;
  acceptsInsurance?: boolean;
  insuranceProviders?: string[];
  approach?: string;
  education?: string[];
  certifications?: string[];
  availability?: {
    timezone: string;
    schedule: Record<string, Array<{ start: string; end: string }>>;
  };
  yearsOfExperience?: number;
  applicationStatus?: 'pending' | 'approved' | 'rejected' | 'under-review';
  applicationDate?: string;
}

// ======================== CHAT TYPES ========================

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  content?: string; // Alias for text for backward compatibility  
  timestamp: string;
  metadata?: {
    crisisDetected?: boolean;
    sentiment?: string;
    topics?: string[];
    provider?: string;
  };
}

export interface AIChatSession {
  id: string;
  userId: string;
  provider: 'openai' | 'claude';
  startTime: Date;
  endTime?: Date;
  messages: AIChatMessage[];
  metadata?: {
    crisisDetectionEnabled?: boolean;
    moderationEnabled?: boolean;
    sessionType?: string;
  };
  lastActivity?: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
}

// ======================== ASSESSMENT TYPES ========================

export interface LegacyAssessment {
  id: string;
  userId: string;
  type: 'mood' | 'anxiety' | 'depression' | 'stress' | 'general';
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  results?: AssessmentResult;
  createdAt: string;
  completedAt?: string;
  isCompleted: boolean;
}

export interface LegacyAssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'boolean';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  required: boolean;
  category?: string;
}

export interface LegacyAssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  answers: AssessmentAnswer[];
  score: number;
  maxScore: number;
  percentageScore: number;
  interpretation: string;
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  followUpRequired: boolean;
  createdAt: string;
}

export interface LegacyAssessmentAnswer {
  questionId: string;
  answer: string | number | boolean;
  points: number;
}

// ======================== WELLNESS TYPES ========================

export interface LegacyMoodEntry {
  id: string;
  userId: string;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  notes?: string;
  tags?: string[];
  timestamp: string;
  activities?: string[];
  triggers?: string[];
}

export interface LegacyWellnessGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'mood' | 'exercise' | 'sleep' | 'meditation' | 'social' | 'other';
  targetValue: number;
  currentValue: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  isCompleted: boolean;
  progress: number; // 0-100 percentage
}

// ======================== CRISIS TYPES ========================

export interface LegacyCrisisIndicator {
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: string[];
  category: 'suicidal' | 'self-harm' | 'substance-abuse' | 'violence' | 'emergency' | 'general-distress';
  immediateAction: boolean;
  triggerPhrases?: string[];
  sentimentScoreThreshold?: number;
}

export interface LegacySafetyPlan {
  id: string;
  userId: string;
  personalCopingStrategies: string[];
  socialSupports: string[];
  professionalContacts: EmergencyContact[];
  environmentalSafety: string[];
  warningSignsPersonal: string[];
  copingStrategies: string[];
  reasonsForLiving: string[];
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  version?: number;
}

export interface CrisisAnalysisResult {
  hasCrisisIndicators: boolean;
  severityLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedIndicators: CrisisIndicator[];
  suggestedActions: string[];
  timestamp: Date;
  rawText?: string;
  sentimentScore?: number;
  immediateIntervention: boolean;
  recommendedActions: string[];
  emergencyContacts: string[];
}

export interface LegacyEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isHealthcareProfessional?: boolean;
  notes?: string;
  availableHours?: string;
}

// ======================== NOTIFICATION TYPES ========================

export interface LegacyNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'crisis';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// ======================== SESSION TYPES ========================

export interface LegacyTherapySession {
  id: string;
  userId: string;
  helperId?: string;
  type: 'individual' | 'group' | 'crisis' | 'ai-assisted';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // in minutes
  notes?: string;
  rating?: number; // 1-5 stars
  feedback?: string;
  followUpRequired: boolean;
  nextSessionAt?: string;
}

// ======================== COMMUNITY TYPES ========================

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isAnonymous: boolean;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt?: string;
  status: 'active' | 'hidden' | 'reported' | 'removed';
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName?: string;
  content: string;
  isAnonymous: boolean;
  likes: number;
  isLiked: boolean;
  parentCommentId?: string;
  replies?: CommunityComment[];
  createdAt: string;
  updatedAt?: string;
}

// ======================== RESOURCE TYPES ========================

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'pdf' | 'external_link' | 'tool';
  category: string;
  tags: string[];
  url?: string;
  content?: string;
  duration?: number; // for videos/audio in seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  ratingCount: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ======================== ANALYTICS TYPES ========================

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string; // Hashed for privacy
  pageUrl?: string;
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalTimeSpent: number; // in minutes
  featuresUsed: string[];
  lastActiveAt: string;
  engagementScore: number;
  wellnessProgress: number;
  riskAssessment: 'low' | 'moderate' | 'high';
}

// ======================== CONFIGURATION TYPES ========================

export interface AppConfig {
  features: {
    aiChat: boolean;
    crisisDetection: boolean;
    communitySupport: boolean;
    assessments: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  limits: {
    maxFileSize: number;
    maxMessageLength: number;
    dailySessionLimit: number;
  };
  crisis: {
    hotlineNumber: string;
    textLine: string;
    emergencyNumber: string;
  };
}

// ======================== API TYPES ========================

export interface LegacyApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface LegacyApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

// ======================== FORM TYPES ========================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ======================== THEME TYPES ========================

export interface LegacyThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  customCSS?: string;
}

// ======================== ACCESSIBILITY TYPES ========================

export interface LegacyAccessibilitySettings {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  voiceCommands: boolean;
  colorBlindSupport: boolean;
  focusIndicators: boolean;
}

// ======================== UTILITY TYPES ========================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, any>;
}

// ======================== MISSING TYPES ========================

export interface ViewProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface CommunityStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  totalHelpers: number;
  totalSessions: number;
  averageResponseTime: string;
  userGrowthRate: number;
  engagementRate: number;
  crisisInterventions: number;
  lastUpdated: string;
}

export interface WellnessVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  videoUrl?: string;
  thumbnail: string;
  thumbnailUrl?: string;
  duration: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string;
  uploadedAt?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}
