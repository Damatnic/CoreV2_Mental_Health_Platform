/**
 * Wellness Tracking Hook - Store Connected
 * 
 * Comprehensive wellness tracking hook connected to wellness store
 * for mood tracking, wellness metrics, and mental health monitoring
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useWellnessStore } from '../stores/wellnessStore';
import useGlobalStore from '../stores/globalStore';
import { logger } from '../utils/logger';

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number; // 1-10 scale
  emotions: string[];
  activities: string[];
  notes?: string;
  timestamp: number;
  location?: string;
  weather?: string;
  sleepHours?: number;
  exerciseMinutes?: number;
  socialInteractions?: number;
}

export interface WellnessMetrics {
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  streakDays: number;
  totalEntries: number;
  lastEntry?: MoodEntry;
  weeklyAverage: number;
  monthlyAverage: number;
  topEmotions: string[];
  topActivities: string[];
}

export interface WellnessGoal {
  id: string;
  type: 'mood' | 'activity' | 'social' | 'sleep' | 'exercise' | 'custom';
  target: number;
  current: number;
  unit: string;
  deadline?: number;
  completed: boolean;
}

export const useWellnessTracking = () => {
  const { user } = useGlobalStore();
  const wellnessStore = useWellnessStore();
  
  // Get wellness state from store
  const {
    moodHistory,
    currentMood,
    wellnessGoals,
    insights,
    addMoodEntry,
    updateCurrentMood,
    setWellnessGoal,
    updateGoalProgress,
    generateInsights,
    clearHistory
  } = wellnessStore;

  // Add new mood entry
  const trackMood = useCallback(async (
    mood: number,
    emotions: string[] = [],
    activities: string[] = [],
    notes?: string,
    additionalData?: Partial<MoodEntry>
  ): Promise<boolean> => {
    try {
      if (!user) {
        logger.warn('Cannot track mood without authenticated user');
        return false;
      }

      const entry: MoodEntry = {
        id: `mood_${Date.now()}`,
        userId: user.id,
        mood,
        emotions,
        activities,
        notes,
        timestamp: Date.now(),
        ...additionalData
      };

      // Add to store
      addMoodEntry(entry);
      updateCurrentMood(mood);

      // Persist to localStorage for offline support
      const existingHistory = JSON.parse(localStorage.getItem('mood_history') || '[]');
      existingHistory.push(entry);
      localStorage.setItem('mood_history', JSON.stringify(existingHistory.slice(-100))); // Keep last 100 entries

      logger.info('Mood tracked successfully', { mood, emotions });

      // Check for crisis indicators
      if (mood <= 3) {
        useGlobalStore.getState().sendNotification({
          type: 'info',
          title: 'We noticed you\'re having a tough time',
          message: 'Remember, support is always available. Consider reaching out to someone you trust.',
          actions: [
            { label: 'Get Support', action: 'get-support' },
            { label: 'View Resources', action: 'view-resources' }
          ]
        });
      }

      // Generate new insights after adding entry
      generateInsights();

      return true;
    } catch (error) {
      logger.error('Failed to track mood', error);
      return false;
    }
  }, [user, addMoodEntry, updateCurrentMood, generateInsights]);

  // Get wellness metrics
  const getMetrics = useCallback((): WellnessMetrics => {
    const entries = moodHistory || [];
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Calculate averages
    const allMoods = entries.map(e => e.mood);
    const weeklyMoods = entries.filter(e => e.timestamp > oneWeekAgo).map(e => e.mood);
    const monthlyMoods = entries.filter(e => e.timestamp > oneMonthAgo).map(e => e.mood);

    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // Calculate mood trend
    let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (weeklyMoods.length >= 3) {
      const firstHalf = weeklyMoods.slice(0, Math.floor(weeklyMoods.length / 2));
      const secondHalf = weeklyMoods.slice(Math.floor(weeklyMoods.length / 2));
      const firstAvg = average(firstHalf);
      const secondAvg = average(secondHalf);
      
      if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
      else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';
    }

    // Calculate streak
    let streakDays = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const date = today - i * 24 * 60 * 60 * 1000;
      const hasEntry = entries.some(e => {
        const entryDate = new Date(e.timestamp).setHours(0, 0, 0, 0);
        return entryDate === date;
      });
      if (hasEntry) streakDays++;
      else break;
    }

    // Get top emotions and activities
    const allEmotions = entries.flatMap(e => e.emotions || []);
    const allActivities = entries.flatMap(e => e.activities || []);
    
    const getTopItems = (items: string[], limit = 5) => {
      const counts = items.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([item]) => item);
    };

    return {
      averageMood: average(allMoods),
      moodTrend,
      streakDays,
      totalEntries: entries.length,
      lastEntry: entries[entries.length - 1],
      weeklyAverage: average(weeklyMoods),
      monthlyAverage: average(monthlyMoods),
      topEmotions: getTopItems(allEmotions),
      topActivities: getTopItems(allActivities)
    };
  }, [moodHistory]);

  // Set wellness goal
  const setGoal = useCallback((
    type: WellnessGoal['type'],
    target: number,
    unit: string,
    deadline?: number
  ): boolean => {
    try {
      const goal: WellnessGoal = {
        id: `goal_${Date.now()}`,
        type,
        target,
        current: 0,
        unit,
        deadline,
        completed: false
      };

      setWellnessGoal(goal);
      
      logger.info('Wellness goal set', { type, target });
      return true;
    } catch (error) {
      logger.error('Failed to set wellness goal', error);
      return false;
    }
  }, [setWellnessGoal]);

  // Update goal progress
  const updateGoal = useCallback((goalId: string, progress: number): boolean => {
    try {
      updateGoalProgress(goalId, progress);
      
      const goal = wellnessGoals?.find(g => g.id === goalId);
      if (goal && progress >= goal.target && !goal.completed) {
        // Goal completed!
        useGlobalStore.getState().sendNotification({
          type: 'success',
          title: '🎉 Goal Achieved!',
          message: `Congratulations! You've completed your ${goal.type} goal!`,
          duration: 5000
        });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to update goal', error);
      return false;
    }
  }, [updateGoalProgress, wellnessGoals]);

  // Get mood suggestions based on current state
  const getMoodSuggestions = useCallback((): string[] => {
    const metrics = getMetrics();
    const suggestions: string[] = [];

    if (metrics.averageMood < 4) {
      suggestions.push('Consider talking to a mental health professional');
      suggestions.push('Try our crisis support resources');
    } else if (metrics.averageMood < 6) {
      suggestions.push('Practice daily gratitude exercises');
      suggestions.push('Try our guided meditation sessions');
      suggestions.push('Connect with friends or support groups');
    } else {
      suggestions.push('Keep up your wellness routine!');
      suggestions.push('Share your progress with others');
    }

    if (metrics.moodTrend === 'declining') {
      suggestions.push('Review your recent stressors');
      suggestions.push('Adjust your self-care routine');
    }

    if (metrics.streakDays > 7) {
      suggestions.push(`Great job on your ${metrics.streakDays} day streak!`);
    } else {
      suggestions.push('Try to track your mood daily for better insights');
    }

    return suggestions;
  }, [getMetrics]);

  // Load historical data on mount
  useEffect(() => {
    const loadHistoricalData = () => {
      try {
        const storedHistory = localStorage.getItem('mood_history');
        if (storedHistory && moodHistory.length === 0) {
          const entries = JSON.parse(storedHistory) as MoodEntry[];
          entries.forEach(entry => addMoodEntry(entry));
          logger.info('Loaded historical mood data', { count: entries.length });
        }
      } catch (error) {
        logger.error('Failed to load historical mood data', error);
      }
    };

    loadHistoricalData();
  }, [moodHistory.length, addMoodEntry]);

  // Memoized return value
  return useMemo(() => ({
    // State
    moodHistory,
    currentMood,
    wellnessGoals,
    insights,
    metrics: getMetrics(),
    
    // Methods
    trackMood,
    setGoal,
    updateGoal,
    getMoodSuggestions,
    clearHistory,
    
    // Quick actions
    quickMoodTrack: (mood: number) => trackMood(mood, [], []),
    isTrackingConsistent: () => getMetrics().streakDays > 3
  }), [
    moodHistory,
    currentMood,
    wellnessGoals,
    insights,
    trackMood,
    setGoal,
    updateGoal,
    getMoodSuggestions,
    clearHistory,
    getMetrics
  ]);
};

export default useWellnessTracking;