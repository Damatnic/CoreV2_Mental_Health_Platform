/**
 * Mental Health Platform Type Definitions
 * 
 * Comprehensive type-safe interfaces for all mental health data models.
 * These types ensure data integrity and prevent runtime errors that could
 * affect users in crisis situations.
 */

// ============================================================================
// User & Identity Types
// ============================================================================

export interface User {
  id: string;
  email?: string;
  username?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
  preferences?: UserPreferences;
  safetyPlan?: SafetyPlan;
  emergencyContacts?: EmergencyContact[];
}

export interface UserProfile {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  pronouns?: string;
  timezone?: string;
  language: string;
  culturalBackground?: string;
  ageRange?: "13-17" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";
  isHelper?: boolean;
  isPeerSupporter?: boolean;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  wellness: WellnessPreferences;
}

// ============================================================================
// Crisis & Safety Types
// ============================================================================

export type CrisisRiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type NotificationContextType = 'info' | 'warning' | 'error' | 'success' | 'critical';
export type TherapeuticInterventionType = 'supportive' | 'cognitive-behavioral' | 'crisis-focused' | 'safety-planning' | 'emergency';

export interface CrisisEvent {
  id: string;
  userId: string;
  timestamp: Date;
  severityLevel: "low" | "medium" | "high" | "critical";
  category: "suicidal" | "self-harm" | "substance-abuse" | "violence" | "emergency" | "general-distress";
  triggeredKeywords: string[];
  actionsTaken: CrisisAction[];
  outcome?: CrisisOutcome;
  followUpRequired: boolean;
  anonymousId?: string;
}

export interface CrisisAction {
  type: "resource_provided" | "hotline_suggested" | "emergency_contacted" | "peer_support" | "professional_referral";
  timestamp: Date;
  details: string;
  accepted: boolean;
}

export interface CrisisOutcome {
  resolved: boolean;
  resolutionType: "self-managed" | "peer-support" | "professional-help" | "emergency-services" | "unknown";
  notes?: string;
  followUpDate?: Date;
}

export interface SafetyPlan {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  warningSignals: string[];
  copingStrategies: CopingStrategy[];
  distractionTechniques: string[];
  supportPeople: SupportPerson[];
  professionals: ProfessionalContact[];
  safeEnvironment: SafeEnvironmentStep[];
  reasonsToLive: string[];
  createdAt: Date;
  updatedAt: Date;
  lastReviewed: Date;
  emergencyContacts?: EmergencyContact[];
  // Enhanced sections for comprehensive planning
  triggers?: string;
  safeEnvironmentNotes?: string;
  customSections?: {
    warningSignsEnhanced?: Array<{
      id: string;
      description: string;
      severity: string;
      triggers?: string[];
      copingStrategies?: string[];
    }>;
    copingStrategiesEnhanced?: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      effectiveness?: number;
      accessibilityAdaptations?: string[];
    }>;
    culturalAdaptations?: {
      language?: string;
      culturalContext?: string;
      familyInvolvement?: string;
      religiousConsiderations?: string | null;
    };
  };
}

export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  category: "breathing" | "grounding" | "physical" | "creative" | "social" | "cognitive";
  effectiveness?: 1 | 2 | 3 | 4 | 5;
  lastUsed?: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isAvailable24h?: boolean;
  availableHours?: string;
  notes?: string;
}

export interface SupportPerson {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  howTheyHelp: string;
  isAvailable24h?: boolean;
}

export interface ProfessionalContact {
  id: string;
  name: string;
  role: "therapist" | "psychiatrist" | "counselor" | "doctor" | "crisis-worker" | "other";
  phone: string;
  email?: string;
  address?: string;
  availableHours?: string;
  isEmergencyContact?: boolean;
}

export interface SafeEnvironmentStep {
  id: string;
  risk: string;
  action: string;
  location: string;
  priority: "low" | "medium" | "high" | "critical";
  completed: boolean;
  completedDate?: string;
  verificationRequired: boolean;
  verifiedBy?: string;
  instructions: string;
  estimatedTime: number;
  dependencies?: string[];
  notes?: string;
  resources?: string[];
}

// ============================================================================
// Accessibility & Cultural Competency Types
// ============================================================================

export interface AccessibilityOptions {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  keyboardOnly: boolean;
  audioDescriptions?: boolean;
  signLanguageSupport?: boolean;
  simplifiedUI?: boolean;
}

export interface CulturalAdaptation {
  language: string;
  region: string;
  culturalContext: string;
  religiousConsiderations: string[];
  familyDynamics: 'individual' | 'nuclear' | 'extended' | 'collective';
  communicationStyle?: 'direct' | 'indirect' | 'high-context' | 'low-context';
  stigmaConsiderations?: string[];
}

// ============================================================================
// Mood & Wellness Types
// ============================================================================

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: Date;
  moodScore: number; // 1-10 scale
  emotions: Emotion[];
  triggers?: string[];
  activities?: string[];
  notes?: string;
  sleepHours?: number;
  exerciseMinutes?: number;
  medicationTaken?: boolean;
  substanceUse?: SubstanceUse[];
}

export interface Emotion {
  name: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  category: "positive" | "negative" | "neutral";
}

export interface SubstanceUse {
  substance: string;
  amount: string;
  impact: "positive" | "negative" | "neutral";
}

export interface WellnessGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: "mental" | "physical" | "social" | "spiritual" | "professional";
  targetDate?: Date;
  milestones: Milestone[];
  status: "active" | "paused" | "completed" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface WellnessMetrics {
  userId: string;
  date: Date;
  overallWellness: number; // 1-10
  dimensions: {
    emotional: number;
    physical: number;
    social: number;
    spiritual: number;
    intellectual: number;
    occupational: number;
  };
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

// ============================================================================
// Journal & Reflection Types
// ============================================================================

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood?: MoodEntry;
  tags?: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  promptId?: string;
  attachments?: Attachment[];
}

export interface JournalPrompt {
  id: string;
  text: string;
  category: "gratitude" | "reflection" | "goals" | "emotions" | "relationships" | "growth";
  difficulty: "easy" | "medium" | "challenging";
  suggestedTime?: number; // in minutes
  followUpQuestions?: string[];
}

export interface Reflection {
  id: string;
  userId: string;
  type: "daily" | "weekly" | "monthly" | "milestone";
  period: {
    start: Date;
    end: Date;
  };
  insights: string[];
  gratitudes: string[];
  challenges: string[];
  learnings: string[];
  goals: string[];
  overallFeeling: 1 | 2 | 3 | 4 | 5;
  createdAt: Date;
}

// ============================================================================
// Peer Support & Community Types
// ============================================================================

export interface PeerSupportSession {
  id: string;
  seekerId: string;
  supporterId: string;
  status: "pending" | "active" | "completed" | "cancelled";
  startTime?: Date;
  endTime?: Date;
  topic?: string;
  rating?: SessionRating;
  notes?: string;
  isAnonymous: boolean;
  chatMessages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isEdited: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  attachments?: Attachment[];
  crisisDetected?: boolean;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface SessionRating {
  overall: 1 | 2 | 3 | 4 | 5;
  helpful: boolean;
  wouldRecommend: boolean;
  feedback?: string;
  reportedIssues?: string[];
}

export interface CommunityPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: "story" | "question" | "resource" | "achievement" | "support-request";
  tags: string[];
  isAnonymous: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: Comment[];
  reports?: Report[];
  moderationStatus: "pending" | "approved" | "flagged" | "removed";
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: Date;
  isEdited: boolean;
  likes: number;
  replies?: Comment[];
  isDeleted: boolean;
}

// ============================================================================
// Therapy & Professional Support Types
// ============================================================================

export interface TherapySession {
  id: string;
  userId: string;
  therapistId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show";
  type: "individual" | "group" | "family" | "couples";
  mode: "in-person" | "video" | "phone" | "text";
  notes?: TherapyNotes;
  homework?: TherapyHomework[];
  nextSessionDate?: Date;
}

export interface TherapyNotes {
  presenting_issues: string[];
  interventions_used: string[];
  client_response: string;
  progress_notes: string;
  risk_assessment?: RiskAssessment;
  treatment_plan_updates?: string;
}

export interface RiskAssessment {
  suicidal_ideation: "none" | "passive" | "active";
  self_harm_risk: "none" | "low" | "moderate" | "high";
  harm_to_others: "none" | "low" | "moderate" | "high";
  substance_abuse_risk: "none" | "low" | "moderate" | "high";
  notes: string;
  safety_plan_reviewed: boolean;
  emergency_contacts_verified: boolean;
}

export interface TherapyHomework {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

// ============================================================================
// Meditation & Mindfulness Types
// ============================================================================

export interface MeditationSession {
  id: string;
  userId: string;
  type: "guided" | "unguided" | "breathing" | "body-scan" | "loving-kindness" | "visualization";
  durationMinutes: number;
  completedAt: Date;
  moodBefore?: number;
  moodAfter?: number;
  notes?: string;
  guidedAudioId?: string;
}

export interface BreathingExercise {
  id: string;
  name: string;
  pattern: {
    inhale: number;
    hold?: number;
    exhale: number;
    pause?: number;
  };
  cycles: number;
  description: string;
  benefits: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

// ============================================================================
// Analytics & Progress Types
// ============================================================================

export interface UserProgress {
  userId: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  metrics: {
    moodAverage: number;
    moodStability: number;
    journalEntries: number;
    meditationMinutes: number;
    copingStrategiesUsed: number;
    socialInteractions: number;
    goalsCompleted: number;
    crisisEvents: number;
  };
  improvements: string[];
  challenges: string[];
  recommendations: string[];
}

export interface TrendAnalysis {
  userId: string;
  metric: string;
  timeframe: Date[];
  values: number[];
  trend: "improving" | "declining" | "stable" | "volatile";
  correlations?: {
    factor: string;
    strength: number;
  }[];
  insights: string[];
}

// ============================================================================
// Notification & Alert Types
// ============================================================================

export interface NotificationPreferences {
  crisisAlerts: boolean;
  medicationReminders: boolean;
  moodCheckIns: boolean;
  appointmentReminders: boolean;
  communityUpdates: boolean;
  wellnessTips: boolean;
  achievementCelebrations: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;
  };
}

export interface Alert {
  id: string;
  userId: string;
  type: "crisis" | "medication" | "appointment" | "check-in" | "achievement" | "system";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  actionRequired: boolean;
  actions?: AlertAction[];
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
}

export interface AlertAction {
  label: string;
  type: "link" | "button" | "dismiss";
  action: string;
  isPrimary: boolean;
}

// ============================================================================
// Privacy & Security Types
// ============================================================================

export interface PrivacySettings {
  profileVisibility: "public" | "community" | "connections" | "private";
  shareProgress: boolean;
  allowAnonymousMessages: boolean;
  dataSharing: {
    analytics: boolean;
    research: boolean;
    improvements: boolean;
  };
  exportData: boolean;
  deleteAfterInactivityDays?: number;
}

export interface DataExport {
  userId: string;
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  includeTypes: string[];
  format: "json" | "csv" | "pdf";
}

// ============================================================================
// Helper & Moderation Types
// ============================================================================

export interface Helper {
  userId: string;
  certifications?: Certification[];
  specializations: string[];
  languages: string[];
  availability: AvailabilitySchedule;
  rating: number;
  sessionsCompleted: number;
  trainingCompleted: string[];
  supervisorId?: string;
  isActive: boolean;
  verifiedAt?: Date;
}

export interface Certification {
  name: string;
  issuer: string;
  dateIssued: Date;
  expiryDate?: Date;
  verificationUrl?: string;
}

export interface AvailabilitySchedule {
  timezone: string;
  regularHours: {
    [day: string]: TimeSlot[];
  };
  exceptions: {
    date: Date;
    available: boolean;
    slots?: TimeSlot[];
  }[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "user" | "post" | "comment" | "message";
  targetId: string;
  reason: "harassment" | "spam" | "inappropriate" | "violence" | "self-harm" | "misinformation" | "other";
  description: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  moderatorId?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// ============================================================================
// Attachment & Media Types
// ============================================================================

export interface Attachment {
  id: string;
  type: "image" | "audio" | "video" | "document";
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Wellness Preferences Types
// ============================================================================

export interface WellnessPreferences {
  dailyCheckIn: boolean;
  checkInTime?: string; // HH:MM format
  weeklyReflection: boolean;
  reflectionDay?: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  trackMedication: boolean;
  trackSleep: boolean;
  trackExercise: boolean;
  trackNutrition: boolean;
  reminderFrequency: "never" | "daily" | "weekly" | "as-needed";
  encouragementMessages: boolean;
  progressCelebrations: boolean;
}

// ============================================================================
// Type Guards for Runtime Safety
// ============================================================================

export function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "id" in obj && "isAnonymous" in obj;
}

export function isCrisisEvent(obj: unknown): obj is CrisisEvent {
  return typeof obj === "object" && obj !== null && "severityLevel" in obj && "category" in obj;
}

export function isSafetyPlan(obj: unknown): obj is SafetyPlan {
  return typeof obj === "object" && obj !== null && "warningSignals" in obj && "copingStrategies" in obj;
}

export function hasEmergencyContact(user: User): user is User & { emergencyContacts: EmergencyContact[] } {
  return user.emergencyContacts !== undefined && user.emergencyContacts.length > 0;
}

export function isInCrisis(event: CrisisEvent): boolean {
  return event.severityLevel === "high" || event.severityLevel === "critical";
}

export function requiresImmediateHelp(event: CrisisEvent): boolean {
  return event.severityLevel === "critical" && event.category !== "general-distress";
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error' | 'pending';
}

export interface TherapeuticGuidanceResponse {
  guidance: string;
  suggestions?: string[];
  resources?: string[];
  severity?: CrisisRiskLevel;
  interventionRequired?: boolean;
}

export interface SafetyPlanAnalysis {
  completeness: number;
  missingElements: string[];
  recommendations: string[];
  riskLevel: CrisisRiskLevel;
}