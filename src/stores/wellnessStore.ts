/**
 * Wellness Store
 *
 * Basic Zustand store for managing wellness data including mood tracking,
 * habit management, and journal entries. This is the standard version
 * without enhanced features.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// Basic types for wellness functionality
export interface MoodCheckIn {
  id: string;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  notes?: string;
  timestamp: number;
  tags: string[];
  userToken: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target?: number;
  unit?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: number;
}

export interface TrackedHabit extends Habit {
  streak: number;
  longestStreak: number;
  lastCompleted?: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  timestamp: number;
  value?: number;
  notes?: string;
  userToken: string;
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood?: number;
  tags: string[];
  timestamp: number;
  isPrivate: boolean;
  userToken: string;
}

// Store state interface
interface WellnessState {
  // Mood tracking
  history: MoodCheckIn[];
  isLoading: boolean;
  
  // Habit management
  predefinedHabits: Habit[];
  trackedHabits: TrackedHabit[];
  isLoadingHabits: boolean;
  completions: HabitCompletion[];
  
  // Journal
  journalEntries: JournalEntry[];
  isLoadingJournal: boolean;
  
  // Error handling
  error: string | null;
}

// Store actions interface
interface WellnessActions {
  // Mood tracking actions
  fetchHistory: () => Promise<void>;
  postCheckIn: (checkInData: Omit<MoodCheckIn, 'id' | 'userToken' | 'timestamp'>) => Promise<void>;
  
  // Habit management actions
  fetchHabits: () => Promise<void>;
  trackHabit: (habitId: string) => Promise<void>;
  untrackHabit: (habitId: string) => Promise<void>;
  logCompletion: (habitId: string, value?: number, notes?: string) => Promise<void>;
  
  // Journal actions
  fetchJournalEntries: () => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userToken' | 'timestamp'>) => Promise<void>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Predefined habits
const DEFAULT_HABITS: Omit<Habit, 'id' | 'createdAt'>[] = [
  {
    name: 'Meditation',
    description: 'Daily mindfulness practice',
    category: 'mental',
    frequency: 'daily',
    target: 10,
    unit: 'minutes',
    color: '#8B5CF6',
    icon: '🧘',
    isActive: true
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
    name: 'Reading',
    description: 'Read for personal growth',
    category: 'mental',
    frequency: 'daily',
    target: 20,
    unit: 'minutes',
    color: '#F59E0B',
    icon: '📚',
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

// Mock API client for demonstration
const mockApiClient = {
  async get(endpoint: string): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    if (endpoint === '/wellness/history') {
      return { data: [] };
    }
    if (endpoint === '/wellness/habits') {
      return { data: DEFAULT_HABITS.map((habit, index) => ({
        ...habit,
        id: `habit_${index + 1}`,
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      })) };
    }
    if (endpoint === '/wellness/journal') {
      return { data: [] };
    }
    if (endpoint === '/wellness/completions') {
      return { data: [] };
    }
    
    return { data: [] };
  },
  
  async post(endpoint: string, data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    const id = `${endpoint.split('/').pop()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { data: { id, ...data, timestamp: Date.now() } };
  },
  
  async put(endpoint: string, data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    return { data: { ...data, updatedAt: Date.now() } };
  },
  
  async delete(endpoint: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    return { success: true };
  }
};

// Get user token (mock implementation)
const getUserToken = (): string => {
  return localStorage.getItem('userToken') || 'demo_user_token';
};

// Create the wellness store
export const useWellnessStore = create<WellnessState & WellnessActions>()(
  persist(
    devtools(
      (set, get) => ({
        // Initial state
        history: [],
        isLoading: false,
        predefinedHabits: [],
        trackedHabits: [],
        isLoadingHabits: false,
        completions: [],
        journalEntries: [],
        isLoadingJournal: false,
        error: null,

        // Mood tracking actions
        fetchHistory: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await mockApiClient.get('/wellness/history');
            
            set({ 
              history: response.data || [],
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch mood history',
              isLoading: false 
            });
          }
        },

        postCheckIn: async (checkInData) => {
          try {
            set({ isLoading: true, error: null });
            
            const checkIn: Omit<MoodCheckIn, 'id'> = {
              ...checkInData,
              userToken: getUserToken(),
              timestamp: Date.now()
            };
            
            const response = await mockApiClient.post('/wellness/checkin', checkIn);
            
            set(state => ({
              history: [response.data, ...state.history],
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save mood check-in',
              isLoading: false 
            });
          }
        },

        // Habit management actions
        fetchHabits: async () => {
          try {
            set({ isLoadingHabits: true, error: null });
            
            const [habitsResponse, completionsResponse] = await Promise.all([
              mockApiClient.get('/wellness/habits'),
              mockApiClient.get('/wellness/completions')
            ]);
            
            const habits = habitsResponse.data || [];
            const completions = completionsResponse.data || [];
            
            // Calculate streaks and progress for tracked habits
            const trackedHabits: TrackedHabit[] = habits.map((habit: Habit) => {
              const habitCompletions = completions.filter((c: HabitCompletion) => c.habitId === habit.id);
              
              // Calculate streak
              let streak = 0;
              let longestStreak = 0;
              let currentStreak = 0;
              
              if (habitCompletions.length > 0) {
                const sortedCompletions = habitCompletions
                  .sort((a, b) => b.timestamp - a.timestamp);
                
                const today = new Date().setHours(0, 0, 0, 0);
                let checkDate = today;
                
                for (const completion of sortedCompletions) {
                  const completionDate = new Date(completion.timestamp).setHours(0, 0, 0, 0);
                  
                  if (completionDate === checkDate || completionDate === checkDate - 24 * 60 * 60 * 1000) {
                    currentStreak++;
                    checkDate = completionDate - 24 * 60 * 60 * 1000;
                  } else {
                    break;
                  }
                }
                
                streak = currentStreak;
                longestStreak = Math.max(currentStreak, longestStreak);
              }
              
              // Calculate progress
              const now = Date.now();
              const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
              const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
              
              const weeklyCompletions = habitCompletions.filter(c => c.timestamp >= weekAgo);
              const monthlyCompletions = habitCompletions.filter(c => c.timestamp >= monthAgo);
              
              const weeklyTarget = habit.frequency === 'daily' ? 7 : habit.frequency === 'weekly' ? 1 : 0.25;
              const monthlyTarget = habit.frequency === 'daily' ? 30 : habit.frequency === 'weekly' ? 4 : 1;
              
              const weeklyProgress = Math.min(weeklyCompletions.length / weeklyTarget, 1);
              const monthlyProgress = Math.min(monthlyCompletions.length / monthlyTarget, 1);
              
              return {
                ...habit,
                streak,
                longestStreak,
                lastCompleted: habitCompletions[0]?.timestamp,
                weeklyProgress,
                monthlyProgress
              };
            });
            
            set({ 
              predefinedHabits: habits,
              trackedHabits,
              completions,
              isLoadingHabits: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch habits',
              isLoadingHabits: false 
            });
          }
        },

        trackHabit: async (habitId) => {
          try {
            const habit = get().predefinedHabits.find(h => h.id === habitId);
            if (!habit) return;
            
            await mockApiClient.post('/wellness/track-habit', { habitId, userToken: getUserToken() });
            
            // Refresh habits to update tracked status
            await get().fetchHabits();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to track habit' });
          }
        },

        untrackHabit: async (habitId) => {
          try {
            await mockApiClient.delete(`/wellness/track-habit/${habitId}`);
            
            set(state => ({
              trackedHabits: state.trackedHabits.filter(h => h.id !== habitId)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to untrack habit' });
          }
        },

        logCompletion: async (habitId, value, notes) => {
          try {
            const completion: Omit<HabitCompletion, 'id'> = {
              habitId,
              timestamp: Date.now(),
              value,
              notes,
              userToken: getUserToken()
            };
            
            const response = await mockApiClient.post('/wellness/completion', completion);
            
            set(state => ({
              completions: [...state.completions, response.data]
            }));
            
            // Refresh habits to update streaks and progress
            await get().fetchHabits();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to log habit completion' });
          }
        },

        // Journal actions
        fetchJournalEntries: async () => {
          try {
            set({ isLoadingJournal: true, error: null });
            
            const response = await mockApiClient.get('/wellness/journal');
            
            set({ 
              journalEntries: response.data || [],
              isLoadingJournal: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch journal entries',
              isLoadingJournal: false 
            });
          }
        },

        addJournalEntry: async (entryData) => {
          try {
            set({ isLoadingJournal: true, error: null });
            
            const entry: Omit<JournalEntry, 'id'> = {
              ...entryData,
              userToken: getUserToken(),
              timestamp: Date.now()
            };
            
            const response = await mockApiClient.post('/wellness/journal', entry);
            
            set(state => ({
              journalEntries: [response.data, ...state.journalEntries],
              isLoadingJournal: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save journal entry',
              isLoadingJournal: false 
            });
          }
        },

        updateJournalEntry: async (id, updates) => {
          try {
            const response = await mockApiClient.put(`/wellness/journal/${id}`, updates);
            
            set(state => ({
              journalEntries: state.journalEntries.map(entry =>
                entry.id === id ? { ...entry, ...response.data } : entry
              )
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update journal entry' });
          }
        },

        deleteJournalEntry: async (id) => {
          try {
            await mockApiClient.delete(`/wellness/journal/${id}`);
            
            set(state => ({
              journalEntries: state.journalEntries.filter(entry => entry.id !== id)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete journal entry' });
          }
        },

        // Utility actions
        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        }
      }),
      { name: 'wellness-store' }
    ),
    {
      name: 'wellness-store',
      partialize: (state) => ({
        history: state.history,
        trackedHabits: state.trackedHabits,
        completions: state.completions,
        journalEntries: state.journalEntries
      })
    }
  )
);

export default useWellnessStore;
