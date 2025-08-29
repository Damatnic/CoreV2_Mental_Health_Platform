/**
 * useGamification Hook
 * 
 * A comprehensive hook for integrating gamification features into components.
 * Provides easy access to gamification state and actions with mental health-appropriate safeguards.
 */

import { useEffect, useCallback, useMemo } from 'react';
import useGamificationStore from '../stores/gamificationStore';
import { useAuth } from './useAuth';

export interface UseGamificationReturn {
  // Progress Data
  level: number;
  currentXP: number;
  xpProgress: number; // Percentage to next level
  points: number;
  streakDays: number;
  isStreakFrozen: boolean;
  
  // Achievements
  totalAchievements: number;
  unlockedAchievements: number;
  achievementProgress: number; // Percentage
  recentAchievement: any;
  
  // Challenges
  activeChallenges: any[];
  availableChallenges: any[];
  canJoinMoreChallenges: boolean;
  
  // Milestones
  nextMilestone: any;
  milestoneProgress: number; // Percentage to next milestone
  
  // Leaderboard
  userRank: number | null;
  isOnLeaderboard: boolean;
  
  // State
  isLoading: boolean;
  error: string | null;
  hasNotifications: boolean;
  unreadNotifications: number;
  
  // Actions
  completeActivity: (activityType: string, metadata?: Record<string, any>) => Promise<void>;
  checkIn: () => Promise<void>;
  logMood: (mood: number, notes?: string) => Promise<void>;
  completeJournalEntry: (entryId: string) => Promise<void>;
  completeMeditation: (duration: number) => Promise<void>;
  completeBreathingExercise: () => Promise<void>;
  offerPeerSupport: (recipientId: string) => Promise<void>;
  
  // Streak Actions
  freezeStreak: () => Promise<boolean>;
  
  // Challenge Actions
  joinChallenge: (challengeId: string) => Promise<boolean>;
  
  // Leaderboard Actions
  toggleLeaderboard: () => void;
  refreshLeaderboard: (type: 'weekly' | 'monthly' | 'all-time') => Promise<void>;
  
  // UI Actions
  dismissNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Preference Actions
  toggleSound: () => void;
  toggleAnimations: () => void;
  
  // Utility
  refresh: () => Promise<void>;
  
  // Computed Values
  dailyProgress: {
    activitiesCompleted: number;
    pointsEarned: number;
    dailyGoalProgress: number;
  };
  
  weeklyStats: {
    activeDays: number;
    totalActivities: number;
    averagePointsPerDay: number;
  };
  
  // Encouragement
  encouragementMessage: string;
  nextReward: string | null;
}

/**
 * Custom hook for gamification features
 */
export function useGamification(): UseGamificationReturn {
  const { user } = useAuth();
  const {
    userProgress,
    isLoading,
    error,
    allAchievements,
    unlockedAchievements,
    recentAchievement,
    availableChallenges,
    activeChallenges,
    allMilestones,
    nextMilestone,
    userRank,
    notifications,
    soundEnabled,
    animationsEnabled,
    leaderboardOptIn,
    streakFrozen,
    initializeUser,
    completeActivity: storeCompleteActivity,
    updateDailyStreak,
    freezeStreak: storeFreezeStreak,
    joinChallenge: storeJoinChallenge,
    fetchLeaderboard,
    toggleLeaderboardOptIn,
    dismissNotification,
    toggleSound,
    toggleAnimations,
    refreshProgress,
    clearError
  } = useGamificationStore();
  
  // Initialize on mount if user is authenticated
  useEffect(() => {
    if (user?.id && !userProgress) {
      initializeUser(user.id);
    }
  }, [user?.id, userProgress, initializeUser]);
  
  // Activity completion handlers with mental health context
  const checkIn = useCallback(async () => {
    if (!user?.id) return;
    
    await storeCompleteActivity('DAILY_CHECK_IN', {
      timestamp: new Date().toISOString(),
      userId: user.id
    });
    
    // Update streak
    await updateDailyStreak();
  }, [user?.id, storeCompleteActivity, updateDailyStreak]);
  
  const logMood = useCallback(async (mood: number, notes?: string) => {
    if (!user?.id) return;
    
    await storeCompleteActivity('MOOD_LOG', {
      mood,
      notes,
      timestamp: new Date().toISOString()
    });
  }, [user?.id, storeCompleteActivity]);
  
  const completeJournalEntry = useCallback(async (entryId: string) => {
    if (!user?.id) return;
    
    await storeCompleteActivity('JOURNAL_ENTRY', {
      entryId,
      timestamp: new Date().toISOString()
    });
  }, [user?.id, storeCompleteActivity]);
  
  const completeMeditation = useCallback(async (duration: number) => {
    if (!user?.id) return;
    
    await storeCompleteActivity('MEDITATION_SESSION', {
      duration,
      timestamp: new Date().toISOString()
    });
  }, [user?.id, storeCompleteActivity]);
  
  const completeBreathingExercise = useCallback(async () => {
    if (!user?.id) return;
    
    await storeCompleteActivity('BREATHING_EXERCISE', {
      timestamp: new Date().toISOString()
    });
  }, [user?.id, storeCompleteActivity]);
  
  const offerPeerSupport = useCallback(async (recipientId: string) => {
    if (!user?.id) return;
    
    await storeCompleteActivity('PEER_SUPPORT_GIVEN', {
      recipientId,
      timestamp: new Date().toISOString()
    });
  }, [user?.id, storeCompleteActivity]);
  
  // Wrapper for generic activity completion
  const completeActivity = useCallback(async (
    activityType: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return;
    
    await storeCompleteActivity(activityType, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }, [user?.id, storeCompleteActivity]);
  
  // Freeze streak with confirmation
  const freezeStreak = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    // You might want to show a confirmation dialog here
    const confirmed = true; // Replace with actual confirmation
    
    if (confirmed) {
      return await storeFreezeStreak();
    }
    
    return false;
  }, [user?.id, storeFreezeStreak]);
  
  // Join challenge with validation
  const joinChallenge = useCallback(async (challengeId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    // Check if user can join more challenges (max 3)
    if (activeChallenges.length >= 3) {
      console.warn('Maximum active challenges reached');
      return false;
    }
    
    return await storeJoinChallenge(challengeId);
  }, [user?.id, activeChallenges.length, storeJoinChallenge]);
  
  // Refresh leaderboard
  const refreshLeaderboard = useCallback(async (type: 'weekly' | 'monthly' | 'all-time') => {
    await fetchLeaderboard(type);
  }, [fetchLeaderboard]);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    notifications.forEach(n => {
      if (!n.read) {
        dismissNotification(n.id);
      }
    });
  }, [notifications, dismissNotification]);
  
  // Refresh all data
  const refresh = useCallback(async () => {
    await refreshProgress();
    clearError();
  }, [refreshProgress, clearError]);
  
  // Computed values
  const level = userProgress?.level || 1;
  const currentXP = userProgress?.currentXP || 0;
  const nextLevelXP = userProgress?.nextLevelXP || 100;
  const xpProgress = (currentXP / nextLevelXP) * 100;
  const points = userProgress?.points || 0;
  const streakDays = userProgress?.streakDays || 0;
  const isStreakFrozen = streakFrozen;
  
  const totalAchievementsCount = allAchievements.length;
  const unlockedAchievementsCount = unlockedAchievements.length;
  const achievementProgress = totalAchievementsCount > 0
    ? (unlockedAchievementsCount / totalAchievementsCount) * 100
    : 0;
  
  const canJoinMoreChallenges = activeChallenges.length < 3;
  
  const milestoneProgress = useMemo(() => {
    if (!nextMilestone || !userProgress) return 0;
    
    const requirement = nextMilestone.requirement;
    let current = 0;
    
    switch (requirement.type) {
      case 'days_active':
        current = userProgress.weeklyProgress.activeDays;
        break;
      case 'achievements_earned':
        current = userProgress.achievements.length;
        break;
      case 'level_reached':
        current = userProgress.level;
        break;
      case 'activities_completed':
        current = userProgress.monthlyProgress.totalActivities;
        break;
    }
    
    return Math.min((current / requirement.value) * 100, 100);
  }, [nextMilestone, userProgress]);
  
  const hasNotifications = notifications.some(n => !n.read);
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  const isOnLeaderboard = leaderboardOptIn;
  
  // Daily progress calculation
  const dailyProgress = useMemo(() => {
    if (!userProgress) {
      return {
        activitiesCompleted: 0,
        pointsEarned: 0,
        dailyGoalProgress: 0
      };
    }
    
    // This would ideally track actual daily data
    const dailyGoal = 100; // Daily point goal
    const todayPoints = Math.min(userProgress.weeklyProgress.pointsEarned, dailyGoal);
    
    return {
      activitiesCompleted: userProgress.weeklyProgress.activitiesCompleted,
      pointsEarned: todayPoints,
      dailyGoalProgress: (todayPoints / dailyGoal) * 100
    };
  }, [userProgress]);
  
  // Weekly stats
  const weeklyStats = useMemo(() => {
    if (!userProgress) {
      return {
        activeDays: 0,
        totalActivities: 0,
        averagePointsPerDay: 0
      };
    }
    
    const activeDays = userProgress.weeklyProgress.activeDays || 1;
    
    return {
      activeDays,
      totalActivities: userProgress.weeklyProgress.activitiesCompleted,
      averagePointsPerDay: Math.round(userProgress.weeklyProgress.pointsEarned / activeDays)
    };
  }, [userProgress]);
  
  // Generate encouragement message based on progress
  const encouragementMessage = useMemo(() => {
    if (!userProgress) return 'Start your wellness journey today!';
    
    if (streakDays > 30) {
      return 'You\'re doing amazing! Keep up the incredible work!';
    } else if (streakDays > 7) {
      return 'Great consistency! You\'re building healthy habits.';
    } else if (streakDays > 0) {
      return `${streakDays} day streak! Every day counts.`;
    } else if (dailyProgress.activitiesCompleted > 0) {
      return 'Great progress today! Keep it up!';
    } else {
      return 'Welcome back! Ready to continue your journey?';
    }
  }, [userProgress, streakDays, dailyProgress.activitiesCompleted]);
  
  // Next reward message
  const nextReward = useMemo(() => {
    if (!userProgress) return null;
    
    const xpToNextLevel = nextLevelXP - currentXP;
    
    if (xpToNextLevel <= 20) {
      return `${xpToNextLevel} XP to level ${level + 1}!`;
    }
    
    if (nextMilestone && milestoneProgress >= 80) {
      return `Almost there! ${100 - milestoneProgress}% to ${nextMilestone.name}`;
    }
    
    if (activeChallenges.length > 0) {
      const nearComplete = activeChallenges.find(c => 
        (c.progress / c.target) >= 0.8 && !c.isCompleted
      );
      
      if (nearComplete) {
        return `Almost done with ${nearComplete.title}!`;
      }
    }
    
    return null;
  }, [userProgress, currentXP, nextLevelXP, level, nextMilestone, milestoneProgress, activeChallenges]);
  
  return {
    // Progress Data
    level,
    currentXP,
    xpProgress,
    points,
    streakDays,
    isStreakFrozen,
    
    // Achievements
    totalAchievements: totalAchievementsCount,
    unlockedAchievements: unlockedAchievementsCount,
    achievementProgress,
    recentAchievement,
    
    // Challenges
    activeChallenges,
    availableChallenges,
    canJoinMoreChallenges,
    
    // Milestones
    nextMilestone,
    milestoneProgress,
    
    // Leaderboard
    userRank,
    isOnLeaderboard,
    
    // State
    isLoading,
    error,
    hasNotifications,
    unreadNotifications,
    
    // Actions
    completeActivity,
    checkIn,
    logMood,
    completeJournalEntry,
    completeMeditation,
    completeBreathingExercise,
    offerPeerSupport,
    
    // Streak Actions
    freezeStreak,
    
    // Challenge Actions
    joinChallenge,
    
    // Leaderboard Actions
    toggleLeaderboard: toggleLeaderboardOptIn,
    refreshLeaderboard,
    
    // UI Actions
    dismissNotification,
    clearAllNotifications,
    
    // Preference Actions
    toggleSound,
    toggleAnimations,
    
    // Utility
    refresh,
    
    // Computed Values
    dailyProgress,
    weeklyStats,
    
    // Encouragement
    encouragementMessage,
    nextReward
  };
}

export default useGamification;