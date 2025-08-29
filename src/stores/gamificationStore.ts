/**
 * Gamification Store using Zustand
 * 
 * This store manages the gamification state for the mental health platform,
 * providing a centralized state management solution for all gamification features.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { gamificationService, UserProgress, Achievement, Challenge, Milestone, LeaderboardEntry, ActivityReward } from '../services/gamification/gamificationService';

interface GamificationState {
  // User Progress
  userProgress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
  
  // Achievements
  allAchievements: Achievement[];
  unlockedAchievements: Achievement[];
  recentAchievement: Achievement | null;
  
  // Challenges
  availableChallenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: string[];
  
  // Milestones
  allMilestones: Milestone[];
  achievedMilestones: Milestone[];
  nextMilestone: Milestone | null;
  
  // Leaderboard
  weeklyLeaderboard: LeaderboardEntry[];
  monthlyLeaderboard: LeaderboardEntry[];
  allTimeLeaderboard: LeaderboardEntry[];
  userRank: number | null;
  
  // Notifications
  notifications: GamificationNotification[];
  showLevelUpModal: boolean;
  showAchievementModal: boolean;
  showMilestoneModal: boolean;
  
  // User Preferences
  soundEnabled: boolean;
  animationsEnabled: boolean;
  leaderboardOptIn: boolean;
  dailyReminderEnabled: boolean;
  
  // Recent Activity
  recentActivityReward: ActivityReward | null;
  streakFrozen: boolean;
  
  // Actions
  initializeUser: (userId: string) => Promise<void>;
  completeActivity: (activityType: string, metadata?: Record<string, any>) => Promise<ActivityReward>;
  updateDailyStreak: () => Promise<void>;
  freezeStreak: () => Promise<boolean>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  
  // Leaderboard Actions
  fetchLeaderboard: (type: 'weekly' | 'monthly' | 'all-time') => Promise<void>;
  toggleLeaderboardOptIn: () => void;
  
  // UI Actions
  dismissNotification: (notificationId: string) => void;
  closeLevelUpModal: () => void;
  closeAchievementModal: () => void;
  closeMilestoneModal: () => void;
  
  // Preference Actions
  toggleSound: () => void;
  toggleAnimations: () => void;
  toggleDailyReminder: () => void;
  
  // Utility Actions
  refreshProgress: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

interface GamificationNotification {
  id: string;
  type: 'achievement' | 'level_up' | 'milestone' | 'challenge' | 'streak';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  read: boolean;
}

const useGamificationStore = create<GamificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        userProgress: null,
        isLoading: false,
        error: null,
        
        allAchievements: [],
        unlockedAchievements: [],
        recentAchievement: null,
        
        availableChallenges: [],
        activeChallenges: [],
        completedChallenges: [],
        
        allMilestones: [],
        achievedMilestones: [],
        nextMilestone: null,
        
        weeklyLeaderboard: [],
        monthlyLeaderboard: [],
        allTimeLeaderboard: [],
        userRank: null,
        
        notifications: [],
        showLevelUpModal: false,
        showAchievementModal: false,
        showMilestoneModal: false,
        
        soundEnabled: true,
        animationsEnabled: true,
        leaderboardOptIn: false,
        dailyReminderEnabled: true,
        
        recentActivityReward: null,
        streakFrozen: false,
        
        // Initialize user and load data
        initializeUser: async (userId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // Get user progress from service
            const progress = gamificationService.getProgress(userId);
            
            // Get all achievements and milestones
            const allAchievements = gamificationService.getAllAchievements();
            const allMilestones = gamificationService.getAllMilestones();
            const availableChallenges = gamificationService.getAvailableChallenges();
            
            // Find next milestone
            const nextMilestone = allMilestones.find(m => !m.achieved) || null;
            
            set({
              userProgress: progress,
              allAchievements,
              unlockedAchievements: progress.achievements,
              allMilestones,
              achievedMilestones: progress.milestones,
              nextMilestone,
              availableChallenges,
              activeChallenges: progress.activeChallenges,
              completedChallenges: progress.completedChallenges,
              streakFrozen: progress.streakFrozen,
              isLoading: false
            });
            
            // Set up event listeners
            gamificationService.on('levelUp', (data) => {
              const { newLevel, rewards } = data;
              
              set((state) => ({
                showLevelUpModal: true,
                notifications: [
                  ...state.notifications,
                  {
                    id: `level_${Date.now()}`,
                    type: 'level_up',
                    title: 'Level Up!',
                    message: `You've reached level ${newLevel}!`,
                    icon: '🎉',
                    timestamp: new Date(),
                    read: false
                  }
                ]
              }));
              
              // Play sound if enabled
              if (get().soundEnabled) {
                // Play level up sound
                const audio = new Audio('/sounds/level-up.mp3');
                audio.play().catch(() => {});
              }
            });
            
            gamificationService.on('achievementUnlocked', (data) => {
              const { achievement } = data;
              
              set((state) => ({
                recentAchievement: achievement,
                showAchievementModal: true,
                unlockedAchievements: [...state.unlockedAchievements, achievement],
                notifications: [
                  ...state.notifications,
                  {
                    id: `achievement_${Date.now()}`,
                    type: 'achievement',
                    title: 'Achievement Unlocked!',
                    message: achievement.name,
                    icon: achievement.icon,
                    timestamp: new Date(),
                    read: false
                  }
                ]
              }));
              
              // Play sound if enabled
              if (get().soundEnabled) {
                const audio = new Audio('/sounds/achievement.mp3');
                audio.play().catch(() => {});
              }
            });
            
            gamificationService.on('milestoneAchieved', (data) => {
              const { milestone } = data;
              
              set((state) => ({
                showMilestoneModal: true,
                achievedMilestones: [...state.achievedMilestones, milestone],
                notifications: [
                  ...state.notifications,
                  {
                    id: `milestone_${Date.now()}`,
                    type: 'milestone',
                    title: 'Milestone Reached!',
                    message: milestone.name,
                    icon: '🏆',
                    timestamp: new Date(),
                    read: false
                  }
                ]
              }));
            });
            
            gamificationService.on('challengeCompleted', (data) => {
              const { challenge } = data;
              
              set((state) => ({
                completedChallenges: [...state.completedChallenges, challenge.id],
                activeChallenges: state.activeChallenges.filter(c => c.id !== challenge.id),
                notifications: [
                  ...state.notifications,
                  {
                    id: `challenge_${Date.now()}`,
                    type: 'challenge',
                    title: 'Challenge Completed!',
                    message: challenge.title,
                    icon: '✅',
                    timestamp: new Date(),
                    read: false
                  }
                ]
              }));
            });
            
            gamificationService.on('streakBroken', (data) => {
              const { previousStreak, message } = data;
              
              set((state) => ({
                notifications: [
                  ...state.notifications,
                  {
                    id: `streak_${Date.now()}`,
                    type: 'streak',
                    title: 'Starting Fresh',
                    message,
                    icon: '🌱',
                    timestamp: new Date(),
                    read: false
                  }
                ]
              }));
            });
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize gamification',
              isLoading: false
            });
          }
        },
        
        // Complete an activity and earn rewards
        completeActivity: async (activityType: string, metadata?: Record<string, any>) => {
          const state = get();
          if (!state.userProgress) {
            throw new Error('User not initialized');
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const reward = await gamificationService.awardActivity(
              state.userProgress.userId,
              activityType as any,
              metadata
            );
            
            set({ 
              recentActivityReward: reward,
              isLoading: false
            });
            
            // Refresh progress
            await get().refreshProgress();
            
            return reward;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to complete activity',
              isLoading: false
            });
            throw error;
          }
        },
        
        // Update daily streak
        updateDailyStreak: async () => {
          const state = get();
          if (!state.userProgress) return;
          
          try {
            gamificationService.updateStreak(state.userProgress.userId);
            await get().refreshProgress();
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update streak'
            });
          }
        },
        
        // Freeze streak for mental health days
        freezeStreak: async () => {
          const state = get();
          if (!state.userProgress) return false;
          
          try {
            const success = gamificationService.freezeStreak(state.userProgress.userId);
            if (success) {
              set({ streakFrozen: true });
              
              // Add notification
              set((state) => ({
                notifications: [
                  ...state.notifications,
                  {
                    id: `freeze_${Date.now()}`,
                    type: 'streak',
                    title: 'Streak Protected',
                    message: 'Your streak is safe. Take the time you need.',
                    icon: '❄️',
                    timestamp: new Date(),
                    read: false
                  }
                ]
              }));
            }
            return success;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to freeze streak'
            });
            return false;
          }
        },
        
        // Join a challenge
        joinChallenge: async (challengeId: string) => {
          const state = get();
          if (!state.userProgress) return false;
          
          try {
            const success = gamificationService.joinChallenge(state.userProgress.userId, challengeId);
            if (success) {
              await get().refreshProgress();
            }
            return success;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to join challenge'
            });
            return false;
          }
        },
        
        // Fetch leaderboard
        fetchLeaderboard: async (type: 'weekly' | 'monthly' | 'all-time') => {
          const state = get();
          if (!state.userProgress) return;
          
          set({ isLoading: true });
          
          try {
            const leaderboard = gamificationService.getLeaderboard(
              type,
              10,
              state.userProgress.userId
            );
            
            const userEntry = leaderboard.find(e => e.userId === state.userProgress?.userId);
            
            switch (type) {
              case 'weekly':
                set({ weeklyLeaderboard: leaderboard });
                break;
              case 'monthly':
                set({ monthlyLeaderboard: leaderboard });
                break;
              case 'all-time':
                set({ allTimeLeaderboard: leaderboard });
                break;
            }
            
            set({
              userRank: userEntry?.rank || null,
              isLoading: false
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
              isLoading: false
            });
          }
        },
        
        // Toggle leaderboard opt-in
        toggleLeaderboardOptIn: () => {
          set((state) => ({ leaderboardOptIn: !state.leaderboardOptIn }));
        },
        
        // Dismiss notification
        dismissNotification: (notificationId: string) => {
          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            )
          }));
        },
        
        // Close modals
        closeLevelUpModal: () => set({ showLevelUpModal: false }),
        closeAchievementModal: () => set({ showAchievementModal: false, recentAchievement: null }),
        closeMilestoneModal: () => set({ showMilestoneModal: false }),
        
        // Toggle preferences
        toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
        toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
        toggleDailyReminder: () => set((state) => ({ dailyReminderEnabled: !state.dailyReminderEnabled })),
        
        // Refresh progress
        refreshProgress: async () => {
          const state = get();
          if (!state.userProgress) return;
          
          try {
            const progress = gamificationService.getProgress(state.userProgress.userId);
            const availableChallenges = gamificationService.getAvailableChallenges();
            
            set({
              userProgress: progress,
              unlockedAchievements: progress.achievements,
              achievedMilestones: progress.milestones,
              activeChallenges: progress.activeChallenges,
              completedChallenges: progress.completedChallenges,
              availableChallenges,
              streakFrozen: progress.streakFrozen
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to refresh progress'
            });
          }
        },
        
        // Clear error
        clearError: () => set({ error: null }),
        
        // Reset store
        reset: () => {
          // Remove event listeners
          gamificationService.removeAllListeners();
          
          set({
            userProgress: null,
            isLoading: false,
            error: null,
            allAchievements: [],
            unlockedAchievements: [],
            recentAchievement: null,
            availableChallenges: [],
            activeChallenges: [],
            completedChallenges: [],
            allMilestones: [],
            achievedMilestones: [],
            nextMilestone: null,
            weeklyLeaderboard: [],
            monthlyLeaderboard: [],
            allTimeLeaderboard: [],
            userRank: null,
            notifications: [],
            showLevelUpModal: false,
            showAchievementModal: false,
            showMilestoneModal: false,
            recentActivityReward: null,
            streakFrozen: false
          });
        }
      }),
      {
        name: 'gamification-storage',
        partialize: (state) => ({
          soundEnabled: state.soundEnabled,
          animationsEnabled: state.animationsEnabled,
          leaderboardOptIn: state.leaderboardOptIn,
          dailyReminderEnabled: state.dailyReminderEnabled,
          notifications: state.notifications
        })
      }
    ),
    {
      name: 'GamificationStore'
    }
  )
);

export default useGamificationStore;