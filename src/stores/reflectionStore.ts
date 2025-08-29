/**
 * Comprehensive Reflection Store for Mental Health Platform
 *
 * Advanced Zustand store for managing user reflections, emotional processing,
 * therapeutic insights, and crisis-safe self-discovery features.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// ============================
// COMPREHENSIVE TYPE DEFINITIONS
// ============================

export type ReflectionCategory = 
  | 'gratitude' 
  | 'challenge' 
  | 'growth' 
  | 'emotion' 
  | 'goal' 
  | 'relationship' 
  | 'general'
  | 'crisis'
  | 'therapy'
  | 'breakthrough'
  | 'healing'
  | 'mindfulness'
  | 'coping'
  | 'trauma-processing';

export type EmotionalState = 
  | 'calm'
  | 'anxious'
  | 'depressed'
  | 'hopeful'
  | 'overwhelmed'
  | 'peaceful'
  | 'angry'
  | 'grateful'
  | 'confused'
  | 'empowered'
  | 'vulnerable'
  | 'resilient';

export type ReflectionMoodTrend = 'improving' | 'stable' | 'declining' | 'fluctuating';

export interface Reflection {
  id: string;
  title: string;
  content: string;
  prompt?: string;
  category: ReflectionCategory;
  mood?: number; // 1-10 scale
  tags: string[];
  isPrivate: boolean;
  timestamp: number;
  updatedAt?: number;
  reactions: {
    helpful: number;
    insightful: number;
    relatable: number;
    inspiring: number;
  };
  userReaction?: {
    type: 'helpful' | 'insightful' | 'relatable' | 'inspiring';
    timestamp: number;
  };
  wordCount: number;
  readingTime: number; // estimated minutes
  attachments?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    caption?: string;
  }[];
  metadata?: {
    emotionalState?: EmotionalState[];
    energyLevel?: number;
    stressLevel?: number;
    insights?: string[];
    therapeuticValue?: number;
    crisisSafe?: boolean;
    therapistShared?: boolean;
  };
}

export interface ReflectionPrompt {
  id: string;
  title: string;
  content: string;
  category: ReflectionCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  emotionalSafety: 'low-risk' | 'medium-risk' | 'high-risk';
  therapeuticBenefit: number; // 1-10 scale
  crisisAppropriate: boolean;
  therapistRecommended?: boolean;
  culturallySensitive?: boolean;
}

export interface ReflectionAnalytics {
  totalReflections: number;
  averageMood: number;
  mostActiveCategory: ReflectionCategory;
  longestStreak: number;
  currentStreak: number;
  categoryCounts: Record<ReflectionCategory, number>;
  moodTrend: {
    average: number;
    direction: ReflectionMoodTrend;
    weeklyChange: number;
    monthlyChange: number;
  };
  weeklyGoal: number;
  progressToGoal: number;
  emotionalGrowthScore: number;
  therapeuticInsights: number;
  crisisSafetyScore: number;
}

export interface ReflectionInsight {
  id: string;
  type: 'pattern' | 'growth' | 'concern' | 'breakthrough' | 'trend' | 'therapeutic';
  title: string;
  description: string;
  confidence: number; // 0-1
  supportingData: string[];
  recommendations?: string[];
  timestamp: number;
  severity?: 'low' | 'medium' | 'high' | 'crisis';
  therapeuticRelevance?: number;
}

export interface TherapeuticReflectionGoal {
  id: string;
  title: string;
  description: string;
  category: ReflectionCategory;
  targetFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  isActive: boolean;
  progress: number; // 0-100
  startDate: number;
  targetDate: number;
  therapeuticObjective: string;
  crisisPrevention?: boolean;
}

export interface ReflectionFilter {
  categories?: ReflectionCategory[];
  mood?: { min: number; max: number };
  dateRange?: { start: number; end: number };
  tags?: string[];
  isPrivate?: boolean;
  emotionalStates?: EmotionalState[];
  therapeuticValue?: { min: number; max: number };
  crisisSafe?: boolean;
  searchQuery?: string;
}

export interface ReflectionShareSettings {
  allowTherapistAccess: boolean;
  allowAnonymousSharing: boolean;
  emergencyAccessEnabled: boolean;
  shareWithSupportNetwork: boolean;
  autoShareCrisisReflections: boolean;
  privacyLevel: 'private' | 'therapist-only' | 'support-network' | 'community';
}

// ============================
// STORE STATE INTERFACE
// ============================

export interface ReflectionState {
  // Core data
  reflections: Reflection[];
  prompts: ReflectionPrompt[];
  insights: ReflectionInsight[];
  goals: TherapeuticReflectionGoal[];
  
  // Analytics and stats
  stats: ReflectionAnalytics;
  
  // UI state
  filter: ReflectionFilter;
  sortBy: 'timestamp' | 'mood' | 'category' | 'wordCount' | 'therapeuticValue';
  sortOrder: 'asc' | 'desc';
  selectedReflection: string | null;
  isEditing: boolean;
  
  // Settings
  shareSettings: ReflectionShareSettings;
  isPrivacyMode: boolean;
  autoSaveEnabled: boolean;
  crisisSafetyEnabled: boolean;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isAnalyzing: boolean;
  
  // Error handling
  error: string | null;
  
  // Mental health specific
  therapeuticMode: boolean;
  crisisDetectionEnabled: boolean;
  emergencyContactNotified: boolean;
}

// ============================
// STORE ACTIONS INTERFACE
// ============================

export interface ReflectionActions {
  // Reflection CRUD operations
  addReflection: (reflection: Omit<Reflection, 'id' | 'timestamp' | 'wordCount' | 'readingTime' | 'reactions'>) => Promise<void>;
  updateReflection: (id: string, updates: Partial<Reflection>) => Promise<void>;
  deleteReflection: (id: string) => Promise<void>;
  getReflection: (id: string) => Reflection | undefined;
  getFilteredReflections: () => Reflection[];
  
  // Prompt management
  addCustomPrompt: (prompt: Omit<ReflectionPrompt, 'id'>) => void;
  getRandomPrompt: (category?: ReflectionCategory, crisisSafe?: boolean) => ReflectionPrompt | null;
  getTherapeuticPrompts: () => ReflectionPrompt[];
  
  // Analytics and insights
  updateStats: () => void;
  generateInsights: () => Promise<void>;
  getInsightsByType: (type: ReflectionInsight['type']) => ReflectionInsight[];
  getMoodTrend: (days: number) => { date: number; mood: number }[];
  getCategoryBreakdown: () => { category: ReflectionCategory; count: number; percentage: number }[];
  
  // Goals and tracking
  addGoal: (goal: Omit<TherapeuticReflectionGoal, 'id' | 'progress'>) => void;
  updateGoalProgress: (goalId: string) => void;
  getActiveGoals: () => TherapeuticReflectionGoal[];
  checkGoalCompletion: (goalId: string) => boolean;
  
  // Filtering and search
  setFilter: (filter: Partial<ReflectionFilter>) => void;
  clearFilter: () => void;
  searchReflections: (query: string) => Reflection[];
  setSortBy: (sortBy: ReflectionState['sortBy'], order?: ReflectionState['sortOrder']) => void;
  
  // UI state management
  selectReflection: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  togglePrivacyMode: () => void;
  
  // Mental health specific actions
  detectCrisisContent: (content: string) => boolean;
  flagForTherapistReview: (reflectionId: string) => Promise<void>;
  shareWithTherapist: (reflectionId: string, message?: string) => Promise<void>;
  enableEmergencyProtocol: (reflectionId: string) => Promise<void>;
  validateTherapeuticContent: (reflection: Reflection) => number;
  
  // Data management
  exportReflections: (format: 'json' | 'csv' | 'pdf', filter?: ReflectionFilter) => Promise<Blob>;
  importReflections: (data: Reflection[]) => Promise<void>;
  backup: () => Promise<void>;
  restore: (backupData: any) => Promise<void>;
  
  // Privacy and security
  updateShareSettings: (settings: Partial<ReflectionShareSettings>) => void;
  encryptSensitiveReflections: () => Promise<void>;
  anonymizeReflections: () => Reflection[];
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

// ============================
// STORE IMPLEMENTATION
// ============================

export type ReflectionStore = ReflectionState & ReflectionActions;

const initialState: ReflectionState = {
  reflections: [],
  prompts: [],
  insights: [],
  goals: [],
  stats: {
    totalReflections: 0,
    averageMood: 5,
    mostActiveCategory: 'general',
    longestStreak: 0,
    currentStreak: 0,
    categoryCounts: {
      gratitude: 0,
      challenge: 0,
      growth: 0,
      emotion: 0,
      goal: 0,
      relationship: 0,
      general: 0,
      crisis: 0,
      therapy: 0,
      breakthrough: 0,
      healing: 0,
      mindfulness: 0,
      coping: 0,
      'trauma-processing': 0
    },
    moodTrend: {
      average: 5,
      direction: 'stable',
      weeklyChange: 0,
      monthlyChange: 0
    },
    weeklyGoal: 3,
    progressToGoal: 0,
    emotionalGrowthScore: 0,
    therapeuticInsights: 0,
    crisisSafetyScore: 100
  },
  filter: {},
  sortBy: 'timestamp',
  sortOrder: 'desc',
  selectedReflection: null,
  isEditing: false,
  shareSettings: {
    allowTherapistAccess: false,
    allowAnonymousSharing: false,
    emergencyAccessEnabled: true,
    shareWithSupportNetwork: false,
    autoShareCrisisReflections: true,
    privacyLevel: 'private'
  },
  isPrivacyMode: false,
  autoSaveEnabled: true,
  crisisSafetyEnabled: true,
  isLoading: false,
  isSaving: false,
  isAnalyzing: false,
  error: null,
  therapeuticMode: false,
  crisisDetectionEnabled: true,
  emergencyContactNotified: false
};

// Crisis keywords for content detection
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'no point living',
  'want to die', 'better off dead', 'hopeless', 'worthless',
  'can\'t go on', 'no way out', 'unbearable pain', 'self-harm',
  'hurt myself', 'cut myself', 'overdose', 'suicide plan'
];

// Therapeutic reflection prompts
const defaultPrompts: ReflectionPrompt[] = [
  {
    id: 'gratitude-1',
    title: 'Daily Gratitude Practice',
    content: 'What are three things you\'re grateful for today, no matter how small?',
    category: 'gratitude',
    tags: ['daily', 'positive', 'mindfulness'],
    difficulty: 'beginner',
    estimatedTime: 5,
    emotionalSafety: 'low-risk',
    therapeuticBenefit: 8,
    crisisAppropriate: true,
    culturallySensitive: true
  },
  {
    id: 'challenge-1',
    title: 'Overcoming Obstacles',
    content: 'Describe a challenge you\'re facing and one small step you can take toward addressing it.',
    category: 'challenge',
    tags: ['problem-solving', 'resilience', 'growth'],
    difficulty: 'intermediate',
    estimatedTime: 10,
    emotionalSafety: 'medium-risk',
    therapeuticBenefit: 9,
    crisisAppropriate: false
  },
  {
    id: 'emotion-1',
    title: 'Emotion Check-In',
    content: 'How are you feeling right now? What emotions are present, and what might they be telling you?',
    category: 'emotion',
    tags: ['emotional-awareness', 'mindfulness', 'self-discovery'],
    difficulty: 'beginner',
    estimatedTime: 8,
    emotionalSafety: 'low-risk',
    therapeuticBenefit: 8,
    crisisAppropriate: true
  },
  {
    id: 'therapy-1',
    title: 'Session Reflection',
    content: 'What insights did you gain from your therapy session? What would you like to explore further?',
    category: 'therapy',
    tags: ['therapy', 'insights', 'growth'],
    difficulty: 'intermediate',
    estimatedTime: 15,
    emotionalSafety: 'medium-risk',
    therapeuticBenefit: 10,
    crisisAppropriate: false,
    therapistRecommended: true
  },
  {
    id: 'coping-1',
    title: 'Coping Strategy Assessment',
    content: 'What healthy coping strategies have you used recently? Which ones work best for you?',
    category: 'coping',
    tags: ['coping', 'self-care', 'resilience'],
    difficulty: 'beginner',
    estimatedTime: 7,
    emotionalSafety: 'low-risk',
    therapeuticBenefit: 9,
    crisisAppropriate: true
  }
];

// ============================
// STORE CREATION
// ============================

export const useReflectionStore = create<ReflectionStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        prompts: defaultPrompts,

        // ============================
        // REFLECTION CRUD OPERATIONS
        // ============================

        addReflection: async (reflectionData) => {
          set({ isSaving: true, error: null });
          
          try {
            const wordCount = reflectionData.content.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200); // Average reading speed
            
            const reflection: Reflection = {
              ...reflectionData,
              id: `reflection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              wordCount,
              readingTime,
              reactions: { helpful: 0, insightful: 0, relatable: 0, inspiring: 0 }
            };

            // Crisis content detection
            if (get().crisisDetectionEnabled) {
              const isCrisisContent = get().detectCrisisContent(reflection.content);
              if (isCrisisContent) {
                reflection.metadata = {
                  ...reflection.metadata,
                  crisisSafe: false
                };
                
                if (get().shareSettings.autoShareCrisisReflections) {
                  await get().enableEmergencyProtocol(reflection.id);
                }
              }
            }

            // Calculate therapeutic value
            if (get().therapeuticMode) {
              const therapeuticValue = get().validateTherapeuticContent(reflection);
              reflection.metadata = {
                ...reflection.metadata,
                therapeuticValue
              };
            }

            set(state => ({
              reflections: [reflection, ...state.reflections],
              isSaving: false
            }));

            // Update stats and generate insights
            get().updateStats();
            
            // Check goal progress
            get().goals.forEach(goal => {
              if (goal.category === reflection.category && goal.isActive) {
                get().updateGoalProgress(goal.id);
              }
            });

          } catch (error) {
            set({ 
              error: `Failed to save reflection: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isSaving: false 
            });
          }
        },

        updateReflection: async (id, updates) => {
          set({ isSaving: true, error: null });
          
          try {
            set(state => ({
              reflections: state.reflections.map(r => 
                r.id === id 
                  ? { 
                      ...r, 
                      ...updates, 
                      updatedAt: Date.now(),
                      wordCount: updates.content ? updates.content.split(/\s+/).length : r.wordCount,
                      readingTime: updates.content ? Math.ceil(updates.content.split(/\s+/).length / 200) : r.readingTime
                    }
                  : r
              ),
              isSaving: false
            }));

            get().updateStats();

          } catch (error) {
            set({ 
              error: `Failed to update reflection: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isSaving: false 
            });
          }
        },

        deleteReflection: async (id) => {
          try {
            set(state => ({
              reflections: state.reflections.filter(r => r.id !== id),
              selectedReflection: state.selectedReflection === id ? null : state.selectedReflection
            }));

            get().updateStats();

          } catch (error) {
            set({ error: `Failed to delete reflection: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        },

        getReflection: (id) => {
          return get().reflections.find(r => r.id === id);
        },

        getFilteredReflections: () => {
          const { reflections, filter } = get();
          
          return reflections.filter(reflection => {
            // Category filter
            if (filter.categories && !filter.categories.includes(reflection.category)) {
              return false;
            }

            // Mood filter
            if (filter.mood && reflection.mood) {
              if (reflection.mood < filter.mood.min || reflection.mood > filter.mood.max) {
                return false;
              }
            }

            // Date range filter
            if (filter.dateRange) {
              if (reflection.timestamp < filter.dateRange.start || 
                  reflection.timestamp > filter.dateRange.end) {
                return false;
              }
            }

            // Tags filter
            if (filter.tags && filter.tags.length > 0) {
              const hasMatchingTag = filter.tags.some(tag => 
                reflection.tags.some(reflectionTag => 
                  reflectionTag.toLowerCase().includes(tag.toLowerCase())
                )
              );
              if (!hasMatchingTag) return false;
            }

            // Privacy filter
            if (filter.isPrivate !== undefined && reflection.isPrivate !== filter.isPrivate) {
              return false;
            }

            // Emotional states filter
            if (filter.emotionalStates && reflection.metadata?.emotionalState) {
              const hasMatchingState = filter.emotionalStates.some(state => 
                reflection.metadata?.emotionalState?.includes(state)
              );
              if (!hasMatchingState) return false;
            }

            // Therapeutic value filter
            if (filter.therapeuticValue && reflection.metadata?.therapeuticValue) {
              const value = reflection.metadata.therapeuticValue;
              if (value < filter.therapeuticValue.min || value > filter.therapeuticValue.max) {
                return false;
              }
            }

            // Crisis safety filter
            if (filter.crisisSafe !== undefined) {
              const isCrisisSafe = reflection.metadata?.crisisSafe !== false;
              if (isCrisisSafe !== filter.crisisSafe) {
                return false;
              }
            }

            // Search query
            if (filter.searchQuery) {
              const query = filter.searchQuery.toLowerCase();
              const searchableText = [
                reflection.title,
                reflection.content,
                reflection.prompt,
                ...reflection.tags
              ].join(' ').toLowerCase();
              
              if (!searchableText.includes(query)) {
                return false;
              }
            }

            return true;
          }).sort((a, b) => {
            const { sortBy, sortOrder } = get();
            let comparison = 0;

            switch (sortBy) {
              case 'timestamp':
                comparison = a.timestamp - b.timestamp;
                break;
              case 'mood':
                comparison = (a.mood || 5) - (b.mood || 5);
                break;
              case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
              case 'wordCount':
                comparison = a.wordCount - b.wordCount;
                break;
              case 'therapeuticValue':
                comparison = (a.metadata?.therapeuticValue || 0) - (b.metadata?.therapeuticValue || 0);
                break;
              default:
                comparison = a.timestamp - b.timestamp;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
          });
        },

        // ============================
        // PROMPT MANAGEMENT
        // ============================

        addCustomPrompt: (promptData) => {
          const prompt: ReflectionPrompt = {
            ...promptData,
            id: `custom-prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };

          set(state => ({
            prompts: [...state.prompts, prompt]
          }));
        },

        getRandomPrompt: (category, crisisSafe = true) => {
          const { prompts } = get();
          
          let availablePrompts = prompts.filter(prompt => {
            if (category && prompt.category !== category) return false;
            if (crisisSafe && !prompt.crisisAppropriate) return false;
            return true;
          });

          if (availablePrompts.length === 0) {
            availablePrompts = prompts.filter(p => p.crisisAppropriate);
          }

          return availablePrompts.length > 0 
            ? availablePrompts[Math.floor(Math.random() * availablePrompts.length)]
            : null;
        },

        getTherapeuticPrompts: () => {
          return get().prompts.filter(prompt => 
            prompt.therapistRecommended || prompt.therapeuticBenefit >= 8
          );
        },

        // ============================
        // ANALYTICS AND INSIGHTS
        // ============================

        updateStats: () => {
          const { reflections } = get();
          
          if (reflections.length === 0) {
            set({ stats: initialState.stats });
            return;
          }

          // Basic counts
          const totalReflections = reflections.length;
          const moods = reflections.filter(r => r.mood).map(r => r.mood!);
          const averageMood = moods.length > 0 
            ? moods.reduce((sum, mood) => sum + mood, 0) / moods.length 
            : 5;

          // Category counts
          const categoryCounts = reflections.reduce((counts, reflection) => {
            counts[reflection.category] = (counts[reflection.category] || 0) + 1;
            return counts;
          }, {} as Record<ReflectionCategory, number>);

          // Fill in missing categories
          const allCategories: ReflectionCategory[] = [
            'gratitude', 'challenge', 'growth', 'emotion', 'goal', 
            'relationship', 'general', 'crisis', 'therapy', 'breakthrough',
            'healing', 'mindfulness', 'coping', 'trauma-processing'
          ];
          
          allCategories.forEach(category => {
            if (!categoryCounts[category]) {
              categoryCounts[category] = 0;
            }
          });

          const mostActiveCategory = Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)[0][0] as ReflectionCategory;

          // Calculate streaks
          const sortedReflections = [...reflections].sort((a, b) => b.timestamp - a.timestamp);
          let currentStreak = 0;
          let longestStreak = 0;
          let tempStreak = 0;

          const today = new Date();
          const oneDayMs = 24 * 60 * 60 * 1000;

          // Check for current streak
          for (let i = 0; i < sortedReflections.length; i++) {
            const reflectionDate = new Date(sortedReflections[i].timestamp);
            const daysDiff = Math.floor((today.getTime() - reflectionDate.getTime()) / oneDayMs);
            
            if (daysDiff === i) {
              currentStreak++;
            } else {
              break;
            }
          }

          // Calculate longest streak
          for (let i = 0; i < sortedReflections.length; i++) {
            const currentDate = new Date(sortedReflections[i].timestamp);
            const nextDate = i + 1 < sortedReflections.length 
              ? new Date(sortedReflections[i + 1].timestamp)
              : null;
            
            tempStreak++;
            
            if (!nextDate || Math.abs(currentDate.getTime() - nextDate.getTime()) > oneDayMs * 2) {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 0;
            }
          }

          // Mood trend calculation
          const recentReflections = reflections
            .filter(r => r.mood && Date.now() - r.timestamp < 30 * oneDayMs)
            .sort((a, b) => a.timestamp - b.timestamp);

          let moodDirection: ReflectionMoodTrend = 'stable';
          let weeklyChange = 0;
          let monthlyChange = 0;

          if (recentReflections.length >= 2) {
            const firstHalf = recentReflections.slice(0, Math.ceil(recentReflections.length / 2));
            const secondHalf = recentReflections.slice(Math.floor(recentReflections.length / 2));
            
            const firstAvg = firstHalf.reduce((sum, r) => sum + r.mood!, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, r) => sum + r.mood!, 0) / secondHalf.length;
            
            const change = secondAvg - firstAvg;
            monthlyChange = change;
            
            if (Math.abs(change) < 0.5) {
              moodDirection = 'stable';
            } else if (change > 0.5) {
              moodDirection = 'improving';
            } else {
              moodDirection = 'declining';
            }
          }

          // Weekly progress
          const weeklyGoal = get().stats.weeklyGoal;
          const thisWeek = reflections.filter(r => 
            Date.now() - r.timestamp < 7 * oneDayMs
          ).length;
          const progressToGoal = Math.min(100, (thisWeek / weeklyGoal) * 100);

          // Therapeutic metrics
          const therapeuticInsights = reflections.filter(r => 
            r.category === 'therapy' || r.category === 'breakthrough'
          ).length;

          const crisisReflections = reflections.filter(r => 
            r.metadata?.crisisSafe === false
          ).length;
          const crisisSafetyScore = Math.max(0, 100 - (crisisReflections / totalReflections) * 100);

          const emotionalGrowthScore = Math.min(100, 
            (longestStreak * 5) + 
            (averageMood * 10) + 
            (therapeuticInsights * 3) + 
            (progressToGoal * 0.5)
          );

          set({
            stats: {
              totalReflections,
              averageMood,
              mostActiveCategory,
              longestStreak,
              currentStreak,
              categoryCounts,
              moodTrend: {
                average: averageMood,
                direction: moodDirection,
                weeklyChange,
                monthlyChange
              },
              weeklyGoal,
              progressToGoal,
              emotionalGrowthScore,
              therapeuticInsights,
              crisisSafetyScore
            }
          });
        },

        generateInsights: async () => {
          set({ isAnalyzing: true });
          
          try {
            const { reflections, stats } = get();
            const insights: ReflectionInsight[] = [];
            
            // Pattern detection
            if (stats.currentStreak >= 7) {
              insights.push({
                id: `insight-streak-${Date.now()}`,
                type: 'pattern',
                title: 'Consistent Reflection Habit',
                description: `You've maintained a ${stats.currentStreak}-day reflection streak! This consistency shows strong commitment to self-awareness.`,
                confidence: 0.9,
                supportingData: [`Current streak: ${stats.currentStreak} days`],
                recommendations: ['Continue this excellent habit', 'Consider setting a higher weekly goal'],
                timestamp: Date.now(),
                severity: 'low',
                therapeuticRelevance: 8
              });
            }

            // Mood trend analysis
            if (stats.moodTrend.direction === 'improving') {
              insights.push({
                id: `insight-mood-${Date.now()}`,
                type: 'growth',
                title: 'Positive Mood Trend',
                description: 'Your mood has been improving over time, which is wonderful to see!',
                confidence: 0.85,
                supportingData: [`Mood trend: ${stats.moodTrend.direction}`, `Average mood: ${stats.averageMood.toFixed(1)}`],
                recommendations: ['Identify what\'s contributing to this positive change', 'Continue the practices that are working'],
                timestamp: Date.now(),
                severity: 'low',
                therapeuticRelevance: 9
              });
            } else if (stats.moodTrend.direction === 'declining') {
              insights.push({
                id: `insight-mood-concern-${Date.now()}`,
                type: 'concern',
                title: 'Mood Decline Noticed',
                description: 'Your mood has been declining recently. This is important information to address.',
                confidence: 0.8,
                supportingData: [`Mood trend: ${stats.moodTrend.direction}`, `Average mood: ${stats.averageMood.toFixed(1)}`],
                recommendations: [
                  'Consider reaching out to your support network',
                  'Review your self-care practices',
                  'Consider professional support if needed'
                ],
                timestamp: Date.now(),
                severity: stats.averageMood < 4 ? 'high' : 'medium',
                therapeuticRelevance: 10
              });
            }

            // Category balance analysis
            const topCategory = stats.mostActiveCategory;
            const categoryPercentage = (stats.categoryCounts[topCategory] / stats.totalReflections) * 100;
            
            if (categoryPercentage > 50) {
              insights.push({
                id: `insight-category-${Date.now()}`,
                type: 'pattern',
                title: 'Focused Reflection Theme',
                description: `Most of your reflections (${categoryPercentage.toFixed(1)}%) focus on ${topCategory}. This shows a strong area of interest or concern.`,
                confidence: 0.7,
                supportingData: [`${topCategory}: ${stats.categoryCounts[topCategory]} reflections`],
                recommendations: ['Consider exploring other reflection categories for balance', 'Dive deeper into this theme with a therapist if helpful'],
                timestamp: Date.now(),
                severity: 'low',
                therapeuticRelevance: 6
              });
            }

            // Crisis content detection
            const crisisReflections = reflections.filter(r => r.metadata?.crisisSafe === false);
            if (crisisReflections.length > 0) {
              insights.push({
                id: `insight-crisis-${Date.now()}`,
                type: 'concern',
                title: 'Crisis Content Detected',
                description: `Some reflections contain concerning content. Professional support may be beneficial.`,
                confidence: 0.95,
                supportingData: [`${crisisReflections.length} reflections flagged`],
                recommendations: [
                  'Reach out to a mental health professional',
                  'Contact crisis hotline if in immediate danger: 988',
                  'Connect with trusted friends or family'
                ],
                timestamp: Date.now(),
                severity: 'crisis',
                therapeuticRelevance: 10
              });
            }

            set(state => ({
              insights: [...insights, ...state.insights].slice(0, 20), // Keep latest 20 insights
              isAnalyzing: false
            }));

          } catch (error) {
            set({ 
              error: `Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isAnalyzing: false 
            });
          }
        },

        getInsightsByType: (type) => {
          return get().insights.filter(insight => insight.type === type);
        },

        getMoodTrend: (days) => {
          const { reflections } = get();
          const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
          
          return reflections
            .filter(r => r.mood && r.timestamp >= cutoffDate)
            .map(r => ({ date: r.timestamp, mood: r.mood! }))
            .sort((a, b) => a.date - b.date);
        },

        getCategoryBreakdown: () => {
          const { stats } = get();
          const total = stats.totalReflections;
          
          return Object.entries(stats.categoryCounts)
            .map(([category, count]) => ({
              category: category as ReflectionCategory,
              count,
              percentage: total > 0 ? (count / total) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);
        },

        // ============================
        // GOALS AND TRACKING
        // ============================

        addGoal: (goalData) => {
          const goal: TherapeuticReflectionGoal = {
            ...goalData,
            id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            progress: 0
          };

          set(state => ({
            goals: [...state.goals, goal]
          }));
        },

        updateGoalProgress: (goalId) => {
          const goal = get().goals.find(g => g.id === goalId);
          if (!goal || !goal.isActive) return;

          const { reflections } = get();
          const relevantReflections = reflections.filter(r => 
            r.category === goal.category && r.timestamp >= goal.startDate
          );

          let targetCount = 0;
          const timeElapsed = Date.now() - goal.startDate;
          const totalTime = goal.targetDate - goal.startDate;
          const timeProgress = Math.min(1, timeElapsed / totalTime);

          switch (goal.targetFrequency) {
            case 'daily':
              targetCount = Math.floor(timeElapsed / (24 * 60 * 60 * 1000));
              break;
            case 'weekly':
              targetCount = Math.floor(timeElapsed / (7 * 24 * 60 * 60 * 1000));
              break;
            case 'bi-weekly':
              targetCount = Math.floor(timeElapsed / (14 * 24 * 60 * 60 * 1000));
              break;
            case 'monthly':
              targetCount = Math.floor(timeElapsed / (30 * 24 * 60 * 60 * 1000));
              break;
          }

          const progress = Math.min(100, targetCount > 0 ? (relevantReflections.length / targetCount) * 100 : 0);

          set(state => ({
            goals: state.goals.map(g => 
              g.id === goalId ? { ...g, progress } : g
            )
          }));
        },

        getActiveGoals: () => {
          return get().goals.filter(goal => goal.isActive);
        },

        checkGoalCompletion: (goalId) => {
          const goal = get().goals.find(g => g.id === goalId);
          return goal ? goal.progress >= 100 : false;
        },

        // ============================
        // FILTERING AND SEARCH
        // ============================

        setFilter: (newFilter) => {
          set(state => ({
            filter: { ...state.filter, ...newFilter }
          }));
        },

        clearFilter: () => {
          set({ filter: {} });
        },

        searchReflections: (query) => {
          const searchQuery = query.toLowerCase();
          return get().reflections.filter(reflection => {
            const searchableText = [
              reflection.title,
              reflection.content,
              reflection.prompt,
              ...reflection.tags,
              ...(reflection.metadata?.insights || [])
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchQuery);
          });
        },

        setSortBy: (sortBy, order = 'desc') => {
          set({ sortBy, sortOrder: order });
        },

        // ============================
        // UI STATE MANAGEMENT
        // ============================

        selectReflection: (id) => {
          set({ selectedReflection: id });
        },

        setEditing: (editing) => {
          set({ isEditing: editing });
        },

        togglePrivacyMode: () => {
          set(state => ({ isPrivacyMode: !state.isPrivacyMode }));
        },

        // ============================
        // MENTAL HEALTH SPECIFIC
        // ============================

        detectCrisisContent: (content) => {
          const lowerContent = content.toLowerCase();
          return crisisKeywords.some(keyword => lowerContent.includes(keyword));
        },

        flagForTherapistReview: async (reflectionId) => {
          try {
            set(state => ({
              reflections: state.reflections.map(r => 
                r.id === reflectionId 
                  ? { 
                      ...r, 
                      metadata: { 
                        ...r.metadata, 
                        therapistShared: true 
                      } 
                    }
                  : r
              )
            }));

            // In a real implementation, this would send to therapist portal
            console.log(`Reflection ${reflectionId} flagged for therapist review`);

          } catch (error) {
            set({ error: `Failed to flag reflection: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        },

        shareWithTherapist: async (reflectionId, message) => {
          try {
            const reflection = get().getReflection(reflectionId);
            if (!reflection) throw new Error('Reflection not found');

            // In a real implementation, this would send to therapist
            console.log(`Sharing reflection with therapist: ${message || 'No message'}`);

            await get().flagForTherapistReview(reflectionId);

          } catch (error) {
            set({ error: `Failed to share with therapist: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        },

        enableEmergencyProtocol: async (reflectionId) => {
          try {
            set({ emergencyContactNotified: true });
            
            // In a real implementation, this would trigger emergency protocols
            console.log('Emergency protocol activated for reflection:', reflectionId);
            
            await get().flagForTherapistReview(reflectionId);

          } catch (error) {
            set({ error: `Failed to enable emergency protocol: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        },

        validateTherapeuticContent: (reflection) => {
          let score = 5; // Base score

          // Positive indicators
          if (reflection.category === 'therapy') score += 2;
          if (reflection.category === 'growth') score += 1.5;
          if (reflection.category === 'breakthrough') score += 2.5;
          if (reflection.wordCount > 100) score += 1;
          if (reflection.metadata?.emotionalState?.includes('empowered')) score += 1;
          if (reflection.metadata?.insights && reflection.metadata.insights.length > 0) score += 1.5;

          // Content analysis
          const content = reflection.content.toLowerCase();
          if (content.includes('learned') || content.includes('realized') || content.includes('understand')) score += 1;
          if (content.includes('grateful') || content.includes('thankful')) score += 0.5;
          if (content.includes('progress') || content.includes('better') || content.includes('improved')) score += 1;

          return Math.min(10, Math.max(0, score));
        },

        // ============================
        // DATA MANAGEMENT
        // ============================

        exportReflections: async (format, filter) => {
          try {
            const reflections = filter ? get().getFilteredReflections() : get().reflections;
            
            switch (format) {
              case 'json':
                return new Blob([JSON.stringify(reflections, null, 2)], { type: 'application/json' });
              
              case 'csv':
                const csvHeader = 'ID,Title,Category,Content,Mood,Date,Tags\n';
                const csvData = reflections.map(r => 
                  `"${r.id}","${r.title}","${r.category}","${r.content.replace(/"/g, '""')}","${r.mood || ''}","${new Date(r.timestamp).toISOString()}","${r.tags.join('; ')}"`
                ).join('\n');
                return new Blob([csvHeader + csvData], { type: 'text/csv' });
              
              case 'pdf':
                // In a real implementation, this would generate a PDF
                const pdfContent = reflections.map(r => 
                  `${r.title}\n${new Date(r.timestamp).toLocaleDateString()}\n${r.content}\n\n`
                ).join('---\n\n');
                return new Blob([pdfContent], { type: 'text/plain' });
              
              default:
                throw new Error('Unsupported export format');
            }

          } catch (error) {
            set({ error: `Failed to export reflections: ${error instanceof Error ? error.message : 'Unknown error'}` });
            throw error;
          }
        },

        importReflections: async (data) => {
          try {
            set({ isLoading: true, error: null });

            // Validate data
            if (!Array.isArray(data)) {
              throw new Error('Invalid data format');
            }

            const validReflections = data.filter(item => 
              item.id && item.title && item.content && item.category && item.timestamp
            );

            if (validReflections.length === 0) {
              throw new Error('No valid reflections found in import data');
            }

            set(state => ({
              reflections: [...validReflections, ...state.reflections],
              isLoading: false
            }));

            get().updateStats();

          } catch (error) {
            set({ 
              error: `Failed to import reflections: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isLoading: false 
            });
          }
        },

        backup: async () => {
          try {
            const backupData = {
              reflections: get().reflections,
              goals: get().goals,
              shareSettings: get().shareSettings,
              stats: get().stats,
              timestamp: Date.now()
            };

            // In a real implementation, this would save to cloud storage
            localStorage.setItem('reflection-backup', JSON.stringify(backupData));

          } catch (error) {
            set({ error: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        },

        restore: async (backupData) => {
          try {
            set({ isLoading: true, error: null });

            if (backupData.reflections) set({ reflections: backupData.reflections });
            if (backupData.goals) set({ goals: backupData.goals });
            if (backupData.shareSettings) set({ shareSettings: backupData.shareSettings });

            get().updateStats();
            set({ isLoading: false });

          } catch (error) {
            set({ 
              error: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isLoading: false 
            });
          }
        },

        // ============================
        // PRIVACY AND SECURITY
        // ============================

        updateShareSettings: (settings) => {
          set(state => ({
            shareSettings: { ...state.shareSettings, ...settings }
          }));
        },

        encryptSensitiveReflections: async () => {
          try {
            // In a real implementation, this would use proper encryption
            const sensitiveReflections = get().reflections.filter(r => 
              r.metadata?.crisisSafe === false || r.category === 'crisis'
            );

            console.log(`Would encrypt ${sensitiveReflections.length} sensitive reflections`);

          } catch (error) {
            set({ error: `Failed to encrypt reflections: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        },

        anonymizeReflections: () => {
          return get().reflections.map(r => ({
            ...r,
            id: 'anonymous',
            content: r.content.replace(/\b[A-Z][a-z]+\b/g, '[NAME]'), // Replace names
            metadata: {
              ...r.metadata,
              emotionalState: r.metadata?.emotionalState,
              therapeuticValue: r.metadata?.therapeuticValue
            }
          }));
        },

        // ============================
        // ERROR HANDLING
        // ============================

        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // ============================
        // RESET
        // ============================

        reset: () => {
          set(initialState);
        }
      }),
      {
        name: 'reflection-store',
        partialize: (state) => ({
          reflections: state.reflections,
          goals: state.goals,
          shareSettings: state.shareSettings,
          isPrivacyMode: state.isPrivacyMode,
          therapeuticMode: state.therapeuticMode,
          crisisDetectionEnabled: state.crisisDetectionEnabled
        })
      }
    ),
    { name: 'ReflectionStore' }
  )
);

export default useReflectionStore;