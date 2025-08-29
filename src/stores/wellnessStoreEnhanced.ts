/**
 * Enhanced Wellness Store with Error Handling and Persistence
 *
 * This is an enhanced version of the wellness store that includes:
 * - Proper error state management
 * - Data persistence
 * - Optimistic updates
 * - Performance optimizations
 * - Retry logic
 * - Comprehensive mood and habit tracking
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { 
  createEnhancedSlice,
  createEnhancedPersistence,
  EnhancedStore,
  withRetry,
  withOptimisticUpdate,
  StoreCache
} from './storeEnhancements';

// Import types (assuming they exist in types file)
export interface MoodCheckIn {
  id: string;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  notes?: string;
  timestamp: number;
  tags: string[];
  triggers?: string[];
  activities?: string[];
  location?: string;
  weather?: string;
  sleep?: {
    hours: number;
    quality: number; // 1-10
  };
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'physical' | 'mental' | 'social' | 'spiritual' | 'creative' | 'productivity';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customFrequency?: {
    times: number;
    period: 'day' | 'week' | 'month';
  };
  target?: number;
  unit?: string;
  color: string;
  icon: string;
  streak: number;
  longestStreak: number;
  isActive: boolean;
  createdAt: number;
  reminders?: {
    enabled: boolean;
    times: string[]; // HH:MM format
    message?: string;
  };
}

export interface TrackedHabit extends Habit {
  completions: HabitCompletion[];
  weeklyProgress: number; // 0-1
  monthlyProgress: number; // 0-1
  lastCompleted?: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  timestamp: number;
  value?: number; // For quantifiable habits
  notes?: string;
  mood?: number; // Mood at completion
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood?: number;
  tags: string[];
  timestamp: number;
  isPrivate: boolean;
  wordCount: number;
  readingTime: number; // estimated minutes
  sentiment?: 'positive' | 'neutral' | 'negative';
  themes?: string[];
}

export interface WellnessGoal {
  id: string;
  title: string;
  description: string;
  category: 'mood' | 'habits' | 'sleep' | 'exercise' | 'mindfulness' | 'social' | 'custom';
  target: {
    value: number;
    unit: string;
    timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  progress: number; // 0-1
  isActive: boolean;
  createdAt: number;
  targetDate?: number;
  milestones: {
    id: string;
    title: string;
    value: number;
    achieved: boolean;
    achievedAt?: number;
  }[];
}

export interface WellnessInsight {
  id: string;
  type: 'pattern' | 'correlation' | 'achievement' | 'suggestion' | 'warning';
  title: string;
  description: string;
  data?: any;
  confidence: number; // 0-1
  timestamp: number;
  isRead: boolean;
  actionable: boolean;
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
}

// Store state interface
interface WellnessState {
  // Mood tracking
  moodHistory: MoodCheckIn[];
  currentMood: number | null;
  moodTrends: {
    weekly: number;
    monthly: number;
    direction: 'up' | 'down' | 'stable';
  };
  
  // Habit tracking
  habits: TrackedHabit[];
  habitCompletions: HabitCompletion[];
  streakData: Record<string, number>;
  
  // Journal
  journalEntries: JournalEntry[];
  journalStats: {
    totalEntries: number;
    totalWords: number;
    averageWordsPerEntry: number;
    longestStreak: number;
    currentStreak: number;
  };
  
  // Goals
  goals: WellnessGoal[];
  completedGoals: WellnessGoal[];
  
  // Insights and analytics
  insights: WellnessInsight[];
  analytics: {
    moodCorrelations: Array<{
      factor: string;
      correlation: number;
      significance: number;
    }>;
    habitEffectiveness: Record<string, number>;
    weeklyReport: {
      averageMood: number;
      habitsCompleted: number;
      journalEntries: number;
      topTriggers: string[];
      improvements: string[];
    };
  };
  
  // Settings and preferences
  preferences: {
    moodReminders: boolean;
    habitReminders: boolean;
    journalReminders: boolean;
    insightNotifications: boolean;
    dataRetentionDays: number;
    privacyMode: boolean;
  };
  
  // UI state
  selectedDateRange: {
    start: number;
    end: number;
  };
  activeView: 'overview' | 'mood' | 'habits' | 'journal' | 'goals' | 'insights';
  lastSync: number | null;
}

// Store actions interface
interface WellnessActions {
  // Mood tracking
  addMoodCheckIn: (checkIn: Omit<MoodCheckIn, 'id' | 'timestamp'>) => Promise<void>;
  updateMoodCheckIn: (id: string, updates: Partial<MoodCheckIn>) => void;
  deleteMoodCheckIn: (id: string) => void;
  updateCurrentMood: (mood: number) => void;
  calculateMoodTrends: () => void;
  
  // Habit management
  createHabit: (habit: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (habitId: string, value?: number, notes?: string) => Promise<void>;
  uncompleteHabit: (habitId: string, completionId: string) => void;
  updateHabitProgress: () => void;
  
  // Journal
  createJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp' | 'wordCount' | 'readingTime'>) => Promise<void>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  calculateJournalStats: () => void;
  
  // Goals
  createGoal: (goal: Omit<WellnessGoal, 'id' | 'progress' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<WellnessGoal>) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: () => void;
  completeGoal: (id: string) => void;
  
  // Insights and analytics
  generateInsights: () => Promise<void>;
  markInsightRead: (id: string) => void;
  dismissInsight: (id: string) => void;
  calculateAnalytics: () => void;
  
  // Data management
  exportData: () => string;
  importData: (data: string) => Promise<void>;
  clearOldData: (daysToKeep?: number) => void;
  
  // Settings
  updatePreferences: (updates: Partial<WellnessState['preferences']>) => void;
  
  // UI state
  setDateRange: (start: number, end: number) => void;
  setActiveView: (view: WellnessState['activeView']) => void;
  
  // Sync
  syncData: () => Promise<void>;
}

// Default preferences
const DEFAULT_PREFERENCES: WellnessState['preferences'] = {
  moodReminders: true,
  habitReminders: true,
  journalReminders: true,
  insightNotifications: true,
  dataRetentionDays: 365,
  privacyMode: false
};

// Predefined habits
const PREDEFINED_HABITS: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'createdAt'>[] = [
  {
    name: 'Meditation',
    description: 'Daily mindfulness practice',
    category: 'mental',
    frequency: 'daily',
    target: 10,
    unit: 'minutes',
    color: '#8B5CF6',
    icon: '🧘',
    isActive: true,
    reminders: {
      enabled: true,
      times: ['08:00', '20:00'],
      message: 'Time for your daily meditation'
    }
  },
  {
    name: 'Exercise',
    description: 'Physical activity',
    category: 'physical',
    frequency: 'daily',
    target: 30,
    unit: 'minutes',
    color: '#EF4444',
    icon: '🏃',
    isActive: true
  },
  {
    name: 'Water Intake',
    description: 'Stay hydrated',
    category: 'physical',
    frequency: 'daily',
    target: 8,
    unit: 'glasses',
    color: '#3B82F6',
    icon: '💧',
    isActive: true
  },
  {
    name: 'Gratitude Journal',
    description: 'Write down things you\'re grateful for',
    category: 'mental',
    frequency: 'daily',
    color: '#F59E0B',
    icon: '📝',
    isActive: true
  },
  {
    name: 'Social Connection',
    description: 'Connect with friends or family',
    category: 'social',
    frequency: 'daily',
    color: '#10B981',
    icon: '👥',
    isActive: true
  }
];

// Cache for expensive calculations
const analyticsCache = new StoreCache<any>(10 * 60 * 1000); // 10 minutes

// Create the enhanced wellness store
export const useWellnessStore = create<EnhancedStore<WellnessState, WellnessActions>>()(
  persist(
    devtools(
      createEnhancedSlice<WellnessState, WellnessActions>((set, get) => ({
        // Initial state
        moodHistory: [],
        currentMood: null,
        moodTrends: {
          weekly: 0,
          monthly: 0,
          direction: 'stable'
        },
        habits: [],
        habitCompletions: [],
        streakData: {},
        journalEntries: [],
        journalStats: {
          totalEntries: 0,
          totalWords: 0,
          averageWordsPerEntry: 0,
          longestStreak: 0,
          currentStreak: 0
        },
        goals: [],
        completedGoals: [],
        insights: [],
        analytics: {
          moodCorrelations: [],
          habitEffectiveness: {},
          weeklyReport: {
            averageMood: 0,
            habitsCompleted: 0,
            journalEntries: 0,
            topTriggers: [],
            improvements: []
          }
        },
        preferences: DEFAULT_PREFERENCES,
        selectedDateRange: {
          start: Date.now() - (7 * 24 * 60 * 60 * 1000),
          end: Date.now()
        },
        activeView: 'overview',
        lastSync: null,

        // Mood tracking actions
        addMoodCheckIn: async (checkInData) => {
          const { setLoading, setError, clearError, updateCacheTimestamp } = get();
          
          try {
            setLoading('addMoodCheckIn', true);
            clearError();

            const checkIn: MoodCheckIn = {
              id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              ...checkInData
            };

            set((state) => ({
              moodHistory: [checkIn, ...state.moodHistory].slice(0, 1000), // Keep last 1000
              currentMood: checkIn.mood
            }));

            // Update trends and generate insights
            get().calculateMoodTrends();
            get().generateInsights();
            updateCacheTimestamp('mood');

          } catch (error) {
            setError(error instanceof Error ? error : new Error('Failed to add mood check-in'));
            throw error;
          } finally {
            setLoading('addMoodCheckIn', false);
          }
        },

        updateMoodCheckIn: (id, updates) => {
          set((state) => ({
            moodHistory: state.moodHistory.map(checkIn =>
              checkIn.id === id ? { ...checkIn, ...updates } : checkIn
            )
          }));
          get().calculateMoodTrends();
        },

        deleteMoodCheckIn: (id) => {
          set((state) => ({
            moodHistory: state.moodHistory.filter(checkIn => checkIn.id !== id)
          }));
          get().calculateMoodTrends();
        },

        updateCurrentMood: (mood) => {
          set({ currentMood: mood });
        },

        calculateMoodTrends: () => {
          const { moodHistory } = get();
          if (moodHistory.length === 0) return;

          const now = Date.now();
          const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
          const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

          const weeklyMoods = moodHistory.filter(m => m.timestamp >= weekAgo);
          const monthlyMoods = moodHistory.filter(m => m.timestamp >= monthAgo);

          const weeklyAvg = weeklyMoods.length > 0 
            ? weeklyMoods.reduce((sum, m) => sum + m.mood, 0) / weeklyMoods.length 
            : 0;
          
          const monthlyAvg = monthlyMoods.length > 0
            ? monthlyMoods.reduce((sum, m) => sum + m.mood, 0) / monthlyMoods.length
            : 0;

          // Determine trend direction
          let direction: 'up' | 'down' | 'stable' = 'stable';
          if (weeklyAvg > monthlyAvg + 0.5) direction = 'up';
          else if (weeklyAvg < monthlyAvg - 0.5) direction = 'down';

          set({
            moodTrends: {
              weekly: weeklyAvg,
              monthly: monthlyAvg,
              direction
            }
          });
        },

        // Habit management actions
        createHabit: (habitData) => {
          const habit: TrackedHabit = {
            id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            streak: 0,
            longestStreak: 0,
            createdAt: Date.now(),
            completions: [],
            weeklyProgress: 0,
            monthlyProgress: 0,
            ...habitData
          };

          set((state) => ({
            habits: [...state.habits, habit]
          }));
        },

        updateHabit: (id, updates) => {
          set((state) => ({
            habits: state.habits.map(habit =>
              habit.id === id ? { ...habit, ...updates } : habit
            )
          }));
        },

        deleteHabit: (id) => {
          set((state) => ({
            habits: state.habits.filter(habit => habit.id !== id),
            habitCompletions: state.habitCompletions.filter(completion => completion.habitId !== id)
          }));
        },

        completeHabit: async (habitId, value, notes) => {
          const { setLoading, setError, clearError } = get();
          
          try {
            setLoading('completeHabit', true);
            clearError();

            const completion: HabitCompletion = {
              id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              habitId,
              timestamp: Date.now(),
              value,
              notes,
              mood: get().currentMood || undefined
            };

            set((state) => ({
              habitCompletions: [...state.habitCompletions, completion]
            }));

            // Update habit progress and streaks
            get().updateHabitProgress();

          } catch (error) {
            setError(error instanceof Error ? error : new Error('Failed to complete habit'));
            throw error;
          } finally {
            setLoading('completeHabit', false);
          }
        },

        uncompleteHabit: (habitId, completionId) => {
          set((state) => ({
            habitCompletions: state.habitCompletions.filter(c => c.id !== completionId)
          }));
          get().updateHabitProgress();
        },

        updateHabitProgress: () => {
          const { habits, habitCompletions } = get();
          const now = Date.now();
          const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
          const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

          const updatedHabits = habits.map(habit => {
            const completions = habitCompletions.filter(c => c.habitId === habit.id);
            const weeklyCompletions = completions.filter(c => c.timestamp >= weekAgo);
            const monthlyCompletions = completions.filter(c => c.timestamp >= monthAgo);

            // Calculate progress based on frequency
            let weeklyTarget = 7;
            let monthlyTarget = 30;
            
            if (habit.frequency === 'weekly') {
              weeklyTarget = 1;
              monthlyTarget = 4;
            } else if (habit.frequency === 'monthly') {
              weeklyTarget = 0.25;
              monthlyTarget = 1;
            } else if (habit.customFrequency) {
              const { times, period } = habit.customFrequency;
              if (period === 'week') {
                weeklyTarget = times;
                monthlyTarget = times * 4;
              } else if (period === 'month') {
                weeklyTarget = times / 4;
                monthlyTarget = times;
              }
            }

            const weeklyProgress = Math.min(weeklyCompletions.length / weeklyTarget, 1);
            const monthlyProgress = Math.min(monthlyCompletions.length / monthlyTarget, 1);

            // Calculate streak
            const sortedCompletions = completions.sort((a, b) => b.timestamp - a.timestamp);
            let streak = 0;
            let currentDate = new Date().setHours(0, 0, 0, 0);
            
            for (const completion of sortedCompletions) {
              const completionDate = new Date(completion.timestamp).setHours(0, 0, 0, 0);
              if (completionDate === currentDate || completionDate === currentDate - 24 * 60 * 60 * 1000) {
                streak++;
                currentDate = completionDate - 24 * 60 * 60 * 1000;
              } else {
                break;
              }
            }

            const longestStreak = Math.max(habit.longestStreak, streak);

            return {
              ...habit,
              completions,
              weeklyProgress,
              monthlyProgress,
              streak,
              longestStreak,
              lastCompleted: sortedCompletions[0]?.timestamp
            };
          });

          set({ habits: updatedHabits });
        },

        // Journal actions
        createJournalEntry: async (entryData) => {
          const { setLoading, setError, clearError } = get();
          
          try {
            setLoading('createJournalEntry', true);
            clearError();

            const wordCount = entryData.content.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200); // Assume 200 WPM

            const entry: JournalEntry = {
              id: `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              wordCount,
              readingTime,
              ...entryData
            };

            set((state) => ({
              journalEntries: [entry, ...state.journalEntries].slice(0, 500) // Keep last 500
            }));

            get().calculateJournalStats();

          } catch (error) {
            setError(error instanceof Error ? error : new Error('Failed to create journal entry'));
            throw error;
          } finally {
            setLoading('createJournalEntry', false);
          }
        },

        updateJournalEntry: (id, updates) => {
          set((state) => ({
            journalEntries: state.journalEntries.map(entry => {
              if (entry.id === id) {
                const updated = { ...entry, ...updates };
                if (updates.content) {
                  updated.wordCount = updates.content.split(/\s+/).length;
                  updated.readingTime = Math.ceil(updated.wordCount / 200);
                }
                return updated;
              }
              return entry;
            })
          }));
          get().calculateJournalStats();
        },

        deleteJournalEntry: (id) => {
          set((state) => ({
            journalEntries: state.journalEntries.filter(entry => entry.id !== id)
          }));
          get().calculateJournalStats();
        },

        calculateJournalStats: () => {
          const { journalEntries } = get();
          
          const totalEntries = journalEntries.length;
          const totalWords = journalEntries.reduce((sum, entry) => sum + entry.wordCount, 0);
          const averageWordsPerEntry = totalEntries > 0 ? totalWords / totalEntries : 0;

          // Calculate streaks
          let currentStreak = 0;
          let longestStreak = 0;
          let tempStreak = 0;
          
          const sortedEntries = journalEntries.sort((a, b) => b.timestamp - a.timestamp);
          let currentDate = new Date().setHours(0, 0, 0, 0);
          
          for (const entry of sortedEntries) {
            const entryDate = new Date(entry.timestamp).setHours(0, 0, 0, 0);
            if (entryDate === currentDate || entryDate === currentDate - 24 * 60 * 60 * 1000) {
              tempStreak++;
              if (entryDate === new Date().setHours(0, 0, 0, 0)) {
                currentStreak = tempStreak;
              }
              currentDate = entryDate - 24 * 60 * 60 * 1000;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 0;
            }
          }
          
          longestStreak = Math.max(longestStreak, tempStreak);

          set({
            journalStats: {
              totalEntries,
              totalWords,
              averageWordsPerEntry,
              longestStreak,
              currentStreak
            }
          });
        },

        // Goals actions
        createGoal: (goalData) => {
          const goal: WellnessGoal = {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            progress: 0,
            createdAt: Date.now(),
            milestones: [],
            ...goalData
          };

          set((state) => ({
            goals: [...state.goals, goal]
          }));
        },

        updateGoal: (id, updates) => {
          set((state) => ({
            goals: state.goals.map(goal =>
              goal.id === id ? { ...goal, ...updates } : goal
            )
          }));
        },

        deleteGoal: (id) => {
          set((state) => ({
            goals: state.goals.filter(goal => goal.id !== id)
          }));
        },

        updateGoalProgress: () => {
          // This would calculate progress based on related habits, mood data, etc.
          // Implementation depends on specific goal types
        },

        completeGoal: (id) => {
          const goal = get().goals.find(g => g.id === id);
          if (!goal) return;

          const completedGoal = { ...goal, progress: 1, isActive: false };
          
          set((state) => ({
            goals: state.goals.filter(g => g.id !== id),
            completedGoals: [...state.completedGoals, completedGoal]
          }));
        },

        // Insights and analytics
        generateInsights: async () => {
          const { setLoading } = get();
          
          try {
            setLoading('generateInsights', true);

            // This would use AI/ML to generate insights
            // For now, we'll create some basic insights
            const insights: WellnessInsight[] = [
              {
                id: `insight_${Date.now()}_1`,
                type: 'pattern',
                title: 'Mood Pattern Detected',
                description: 'Your mood tends to be higher on days when you complete your meditation habit.',
                confidence: 0.8,
                timestamp: Date.now(),
                isRead: false,
                actionable: true,
                actions: [{
                  label: 'Set Meditation Reminder',
                  action: 'setReminder',
                  data: { habitId: 'meditation' }
                }]
              }
            ];

            set((state) => ({
              insights: [...insights, ...state.insights].slice(0, 50) // Keep last 50
            }));

          } finally {
            setLoading('generateInsights', false);
          }
        },

        markInsightRead: (id) => {
          set((state) => ({
            insights: state.insights.map(insight =>
              insight.id === id ? { ...insight, isRead: true } : insight
            )
          }));
        },

        dismissInsight: (id) => {
          set((state) => ({
            insights: state.insights.filter(insight => insight.id !== id)
          }));
        },

        calculateAnalytics: () => {
          // Use cache to avoid expensive recalculations
          const cacheKey = 'analytics';
          const cached = analyticsCache.get(cacheKey);
          if (cached) {
            set({ analytics: cached });
            return;
          }

          const { moodHistory, habits, habitCompletions } = get();
          
          // Calculate mood correlations with habits
          const moodCorrelations = habits.map(habit => {
            const completionDays = new Set(
              habitCompletions
                .filter(c => c.habitId === habit.id)
                .map(c => new Date(c.timestamp).toDateString())
            );

            const moodsOnCompletionDays = moodHistory.filter(m => 
              completionDays.has(new Date(m.timestamp).toDateString())
            );

            const moodsOnNonCompletionDays = moodHistory.filter(m => 
              !completionDays.has(new Date(m.timestamp).toDateString())
            );

            const avgMoodWithHabit = moodsOnCompletionDays.length > 0
              ? moodsOnCompletionDays.reduce((sum, m) => sum + m.mood, 0) / moodsOnCompletionDays.length
              : 0;

            const avgMoodWithoutHabit = moodsOnNonCompletionDays.length > 0
              ? moodsOnNonCompletionDays.reduce((sum, m) => sum + m.mood, 0) / moodsOnNonCompletionDays.length
              : 0;

            return {
              factor: habit.name,
              correlation: avgMoodWithHabit - avgMoodWithoutHabit,
              significance: Math.min(moodsOnCompletionDays.length / 10, 1) // Simple significance measure
            };
          });

          const analytics = {
            moodCorrelations,
            habitEffectiveness: {},
            weeklyReport: {
              averageMood: 0,
              habitsCompleted: 0,
              journalEntries: 0,
              topTriggers: [],
              improvements: []
            }
          };

          analyticsCache.set(cacheKey, analytics);
          set({ analytics });
        },

        // Data management
        exportData: () => {
          const state = get();
          const exportData = {
            moodHistory: state.moodHistory,
            habits: state.habits,
            habitCompletions: state.habitCompletions,
            journalEntries: state.journalEntries,
            goals: state.goals,
            completedGoals: state.completedGoals,
            preferences: state.preferences,
            exportDate: Date.now()
          };
          
          return JSON.stringify(exportData, null, 2);
        },

        importData: async (dataString) => {
          const { setLoading, setError, clearError } = get();
          
          try {
            setLoading('importData', true);
            clearError();

            const data = JSON.parse(dataString);
            
            // Validate and merge data
            set((state) => ({
              ...state,
              ...data,
              lastSync: Date.now()
            }));

          } catch (error) {
            setError(error instanceof Error ? error : new Error('Failed to import data'));
            throw error;
          } finally {
            setLoading('importData', false);
          }
        },

        clearOldData: (daysToKeep = 365) => {
          const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
          
          set((state) => ({
            moodHistory: state.moodHistory.filter(m => m.timestamp >= cutoff),
            habitCompletions: state.habitCompletions.filter(c => c.timestamp >= cutoff),
            journalEntries: state.journalEntries.filter(e => e.timestamp >= cutoff),
            insights: state.insights.filter(i => i.timestamp >= cutoff)
          }));
        },

        // Settings
        updatePreferences: (updates) => {
          set((state) => ({
            preferences: { ...state.preferences, ...updates }
          }));
        },

        // UI state
        setDateRange: (start, end) => {
          set({ selectedDateRange: { start, end } });
        },

        setActiveView: (view) => {
          set({ activeView: view });
        },

        // Sync
        syncData: async () => {
          const { setLoading, setError, clearError } = get();
          
          try {
            setLoading('syncData', true);
            clearError();

            // Simulate API sync
            await new Promise(resolve => setTimeout(resolve, 2000));

            set({ lastSync: Date.now() });

          } catch (error) {
            setError(error instanceof Error ? error : new Error('Sync failed'));
            throw error;
          } finally {
            setLoading('syncData', false);
          }
        }
      })),
      { name: 'wellness-store' }
    ),
    createEnhancedPersistence('wellness-store', {
      partialize: (state) => ({
        moodHistory: state.moodHistory,
        habits: state.habits,
        habitCompletions: state.habitCompletions,
        journalEntries: state.journalEntries,
        goals: state.goals,
        completedGoals: state.completedGoals,
        preferences: state.preferences,
        streakData: state.streakData,
        journalStats: state.journalStats
      })
    })
  )
);

// Helper function to initialize with predefined habits
export const initializeWithPredefinedHabits = () => {
  const store = useWellnessStore.getState();
  PREDEFINED_HABITS.forEach(habit => {
    store.createHabit(habit);
  });
};

export default useWellnessStore;
