/**
 * Gamification Service
 *
 * Comprehensive gamification system for mental health engagement with
 * achievements, progress tracking, rewards, and motivational features.
 * Designed to encourage consistent engagement with therapeutic activities.
 *
 * @fileoverview Type-safe gamification system with achievements, progress tracking, and rewards
 * @version 2.1.0 - Rewritten for type safety and SSR compatibility
 */

// Core Types
export type AchievementType = 
  | 'milestone'
  | 'streak'
  | 'challenge'
  | 'social'
  | 'wellness'
  | 'learning'
  | 'crisis-recovery'
  | 'self-care';

export type RewardType = 
  | 'badge'
  | 'points'
  | 'unlock'
  | 'customization'
  | 'certificate'
  | 'milestone-reward';

export type ActivityType = 
  | 'mood-check'
  | 'journal-entry'
  | 'breathing-exercise'
  | 'meditation'
  | 'therapy-session'
  | 'peer-support'
  | 'safety-plan-update'
  | 'crisis-resource-access'
  | 'goal-completion'
  | 'reflection'
  | 'assessment'
  | 'learning-module';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  category: string;
}

export interface AchievementRequirement {
  type: 'activity_count' | 'streak_days' | 'points_total' | 'specific_action';
  target: number;
  current: number;
  activityType?: ActivityType;
  description: string;
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  streakDays: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: Badge[];
  lastActivityDate: Date;
  weeklyGoal: number;
  weeklyProgress: number;
  stats: ActivityStats;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
}

export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
}

export interface WeeklyStats {
  week: string;
  activities: number;
  points: number;
  achievements: number;
}

export interface MonthlyStats {
  month: string;
  activities: number;
  points: number;
  achievements: number;
  streakRecord: number;
}

export interface ChallengeData {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  requirements: AchievementRequirement[];
  reward: Reward;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  participants: number;
  progress: number;
}

export interface Reward {
  type: RewardType;
  value: number;
  item?: string;
  description: string;
  icon: string;
}

export interface MilestoneData {
  id: string;
  name: string;
  description: string;
  requiredPoints: number;
  reward: Reward;
  isCompleted: boolean;
  completedAt?: Date;
}

// Activity Configuration
const ACTIVITY_POINTS: Record<ActivityType, number> = {
  'mood-check': 5,
  'journal-entry': 10,
  'breathing-exercise': 8,
  'meditation': 15,
  'therapy-session': 25,
  'peer-support': 12,
  'safety-plan-update': 20,
  'crisis-resource-access': 8,
  'goal-completion': 30,
  'reflection': 12,
  'assessment': 15,
  'learning-module': 20
};

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300, 10700
];

/**
 * Type-safe Gamification Service with SSR compatibility
 */
class GamificationService {
  private readonly storageKey = 'mental_health_gamification';
  private readonly achievementKey = 'user_achievements';
  private readonly progressKey = 'user_progress';
  
  private isInitialized = false;
  private userProgress: UserProgress | null = null;
  private achievements: Achievement[] = [];

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the gamification service with SSR safety
   */
  private async initializeService(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // SSR environment - skip initialization
        return;
      }

      await this.loadUserProgress();
      await this.loadAchievements();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Gamification service initialization failed:', error);
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeService();
    }
  }

  /**
   * Record user activity and update progress
   */
  async recordActivity(
    userId: string, 
    activityType: ActivityType, 
    metadata?: Record<string, any>
  ): Promise<{
    pointsEarned: number;
    newAchievements: Achievement[];
    levelUp: boolean;
    newLevel?: number;
  }> {
    await this.ensureInitialized();
    
    try {
      const progress = await this.getUserProgress(userId);
      const pointsEarned = ACTIVITY_POINTS[activityType] || 0;
      
      // Update activity stats
      progress.stats.totalActivities++;
      progress.stats.activitiesByType[activityType] = 
        (progress.stats.activitiesByType[activityType] || 0) + 1;
      
      // Add points
      progress.totalPoints += pointsEarned;
      progress.currentLevelPoints += pointsEarned;
      
      // Check for level up
      const currentLevel = progress.level;
      const newLevel = this.calculateLevel(progress.totalPoints);
      const levelUp = newLevel > currentLevel;
      
      if (levelUp) {
        progress.level = newLevel;
        progress.currentLevelPoints = progress.totalPoints - LEVEL_THRESHOLDS[newLevel - 1];
        progress.nextLevelPoints = newLevel < LEVEL_THRESHOLDS.length 
          ? LEVEL_THRESHOLDS[newLevel] - LEVEL_THRESHOLDS[newLevel - 1]
          : 1000;
      }
      
      // Update streak
      this.updateStreak(progress);
      
      // Check for new achievements
      const newAchievements = await this.checkForNewAchievements(userId, activityType, progress);
      
      // Update weekly progress
      progress.weeklyProgress++;
      
      // Save updated progress
      await this.saveUserProgress(progress);
      
      return {
        pointsEarned,
        newAchievements,
        levelUp,
        newLevel: levelUp ? newLevel : undefined
      };
    } catch (error) {
      console.error('Error recording activity:', error);
      return {
        pointsEarned: 0,
        newAchievements: [],
        levelUp: false
      };
    }
  }

  /**
   * Get user progress with fallback for new users
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    await this.ensureInitialized();
    
    try {
      if (this.userProgress && this.userProgress.userId === userId) {
        return this.userProgress;
      }

      const stored = await this.getFromStorage(`${this.progressKey}_${userId}`);
      if (stored) {
        this.userProgress = {
          ...stored,
          lastActivityDate: new Date(stored.lastActivityDate),
          achievements: stored.achievements.map((a: any) => ({
            ...a,
            unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
          })),
          badges: stored.badges.map((b: any) => ({
            ...b,
            earnedAt: new Date(b.earnedAt)
          }))
        };
        return this.userProgress;
      }

      // Create new user progress
      const newProgress: UserProgress = {
        userId,
        totalPoints: 0,
        level: 1,
        currentLevelPoints: 0,
        nextLevelPoints: LEVEL_THRESHOLDS[1],
        streakDays: 0,
        longestStreak: 0,
        achievements: [],
        badges: [],
        lastActivityDate: new Date(),
        weeklyGoal: 7,
        weeklyProgress: 0,
        stats: {
          totalActivities: 0,
          activitiesByType: {} as Record<ActivityType, number>,
          weeklyStats: [],
          monthlyStats: []
        }
      };

      this.userProgress = newProgress;
      await this.saveUserProgress(newProgress);
      return newProgress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      // Return minimal safe progress
      return {
        userId,
        totalPoints: 0,
        level: 1,
        currentLevelPoints: 0,
        nextLevelPoints: 100,
        streakDays: 0,
        longestStreak: 0,
        achievements: [],
        badges: [],
        lastActivityDate: new Date(),
        weeklyGoal: 7,
        weeklyProgress: 0,
        stats: {
          totalActivities: 0,
          activitiesByType: {} as Record<ActivityType, number>,
          weeklyStats: [],
          monthlyStats: []
        }
      };
    }
  }

  /**
   * Get available achievements for user
   */
  async getAvailableAchievements(userId: string): Promise<Achievement[]> {
    await this.ensureInitialized();
    
    try {
      const userProgress = await this.getUserProgress(userId);
      const allAchievements = await this.getAllAchievements();
      
      return allAchievements.map(achievement => {
        const userAchievement = userProgress.achievements.find(a => a.id === achievement.id);
        if (userAchievement) {
          return userAchievement;
        }
        
        // Calculate progress for unearned achievements
        const progress = this.calculateAchievementProgress(achievement, userProgress);
        return {
          ...achievement,
          progress,
          isUnlocked: false
        };
      });
    } catch (error) {
      console.error('Error getting available achievements:', error);
      return [];
    }
  }

  /**
   * Get user badges
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    await this.ensureInitialized();
    
    try {
      const progress = await this.getUserProgress(userId);
      return progress.badges;
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  /**
   * Get leaderboard data (privacy-focused)
   */
  async getLeaderboard(type: 'points' | 'streak' | 'achievements' = 'points'): Promise<Array<{
    rank: number;
    anonymousId: string;
    value: number;
    badge?: string;
  }>> {
    try {
      // In a real implementation, this would fetch from a backend API
      // For now, return mock data that preserves privacy
      const mockData = [
        { rank: 1, anonymousId: 'User****1', value: type === 'points' ? 1250 : type === 'streak' ? 15 : 8, badge: 'champion' },
        { rank: 2, anonymousId: 'User****2', value: type === 'points' ? 1100 : type === 'streak' ? 12 : 7, badge: 'expert' },
        { rank: 3, anonymousId: 'User****3', value: type === 'points' ? 950 : type === 'streak' ? 10 : 6, badge: 'dedicated' }
      ];
      
      return mockData;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Set weekly goal for user
   */
  async setWeeklyGoal(userId: string, goal: number): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      progress.weeklyGoal = Math.max(1, Math.min(goal, 50)); // Reasonable limits
      await this.saveUserProgress(progress);
    } catch (error) {
      console.error('Error setting weekly goal:', error);
    }
  }

  /**
   * Get current challenges
   */
  async getCurrentChallenges(): Promise<ChallengeData[]> {
    try {
      const now = new Date();
      
      // Mock challenges - in production, this would come from a backend
      const mockChallenges: ChallengeData[] = [
        {
          id: 'weekly-wellness',
          name: 'Weekly Wellness Check',
          description: 'Complete 5 mood checks this week',
          type: 'weekly',
          requirements: [
            {
              type: 'activity_count',
              target: 5,
              current: 0,
              activityType: 'mood-check',
              description: 'Complete mood checks'
            }
          ],
          reward: {
            type: 'badge',
            value: 50,
            description: 'Wellness Warrior badge',
            icon: '🏆'
          },
          startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          isActive: true,
          participants: 128,
          progress: 0
        }
      ];
      
      return mockChallenges.filter(c => c.isActive);
    } catch (error) {
      console.error('Error getting challenges:', error);
      return [];
    }
  }

  /**
   * Reset weekly progress
   */
  async resetWeeklyProgress(userId: string): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      progress.weeklyProgress = 0;
      
      // Add weekly stats
      const weekKey = new Date().toISOString().slice(0, 10);
      const existingWeek = progress.stats.weeklyStats.find(w => w.week === weekKey);
      
      if (!existingWeek) {
        progress.stats.weeklyStats.push({
          week: weekKey,
          activities: 0,
          points: 0,
          achievements: 0
        });
      }
      
      await this.saveUserProgress(progress);
    } catch (error) {
      console.error('Error resetting weekly progress:', error);
    }
  }

  // Private helper methods

  private calculateLevel(totalPoints: number): number {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (totalPoints >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return level;
  }

  private updateStreak(progress: UserProgress): void {
    const now = new Date();
    const lastActivity = new Date(progress.lastActivityDate);
    const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change to streak
      return;
    } else if (daysDiff === 1) {
      // Next day, continue or start streak
      progress.streakDays++;
    } else {
      // Gap in days, reset streak
      progress.streakDays = 1;
    }
    
    progress.longestStreak = Math.max(progress.longestStreak, progress.streakDays);
    progress.lastActivityDate = now;
  }

  private async checkForNewAchievements(
    userId: string, 
    activityType: ActivityType, 
    progress: UserProgress
  ): Promise<Achievement[]> {
    const allAchievements = await this.getAllAchievements();
    const newAchievements: Achievement[] = [];
    
    for (const achievement of allAchievements) {
      if (progress.achievements.some(a => a.id === achievement.id)) {
        continue; // Already earned
      }
      
      if (this.isAchievementEarned(achievement, progress)) {
        const earnedAchievement: Achievement = {
          ...achievement,
          isUnlocked: true,
          unlockedAt: new Date(),
          progress: achievement.maxProgress
        };
        
        progress.achievements.push(earnedAchievement);
        newAchievements.push(earnedAchievement);
        
        // Award points for achievement
        progress.totalPoints += achievement.points;
      }
    }
    
    return newAchievements;
  }

  private calculateAchievementProgress(achievement: Achievement, progress: UserProgress): number {
    let totalProgress = 0;
    const requirements = achievement.requirements;
    
    for (const req of requirements) {
      let current = 0;
      
      switch (req.type) {
        case 'activity_count':
          if (req.activityType) {
            current = progress.stats.activitiesByType[req.activityType] || 0;
          } else {
            current = progress.stats.totalActivities;
          }
          break;
        case 'streak_days':
          current = progress.streakDays;
          break;
        case 'points_total':
          current = progress.totalPoints;
          break;
        default:
          current = 0;
      }
      
      totalProgress += Math.min(current / req.target, 1) * (100 / requirements.length);
    }
    
    return Math.floor(totalProgress);
  }

  private isAchievementEarned(achievement: Achievement, progress: UserProgress): boolean {
    return achievement.requirements.every(req => {
      let current = 0;
      
      switch (req.type) {
        case 'activity_count':
          if (req.activityType) {
            current = progress.stats.activitiesByType[req.activityType] || 0;
          } else {
            current = progress.stats.totalActivities;
          }
          break;
        case 'streak_days':
          current = progress.streakDays;
          break;
        case 'points_total':
          current = progress.totalPoints;
          break;
        default:
          return false;
      }
      
      return current >= req.target;
    });
  }

  private async getAllAchievements(): Promise<Achievement[]> {
    if (this.achievements.length > 0) {
      return this.achievements;
    }
    
    // Default achievements for mental health platform
    this.achievements = [
      {
        id: 'first-mood-check',
        name: 'First Step',
        description: 'Complete your first mood check',
        type: 'milestone',
        icon: '🎯',
        points: 10,
        rarity: 'common',
        requirements: [
          {
            type: 'activity_count',
            target: 1,
            current: 0,
            activityType: 'mood-check',
            description: 'Complete 1 mood check'
          }
        ],
        progress: 0,
        maxProgress: 100,
        isUnlocked: false,
        category: 'wellness'
      },
      {
        id: 'journal-writer',
        name: 'Reflective Writer',
        description: 'Write 10 journal entries',
        type: 'milestone',
        icon: '📝',
        points: 50,
        rarity: 'common',
        requirements: [
          {
            type: 'activity_count',
            target: 10,
            current: 0,
            activityType: 'journal-entry',
            description: 'Write 10 journal entries'
          }
        ],
        progress: 0,
        maxProgress: 100,
        isUnlocked: false,
        category: 'self-care'
      },
      {
        id: 'streak-warrior',
        name: 'Consistency Champion',
        description: 'Maintain a 7-day activity streak',
        type: 'streak',
        icon: '🔥',
        points: 75,
        rarity: 'rare',
        requirements: [
          {
            type: 'streak_days',
            target: 7,
            current: 0,
            description: 'Maintain 7-day streak'
          }
        ],
        progress: 0,
        maxProgress: 100,
        isUnlocked: false,
        category: 'wellness'
      }
    ];
    
    return this.achievements;
  }

  private async loadUserProgress(): Promise<void> {
    // Progress loaded on-demand in getUserProgress
  }

  private async loadAchievements(): Promise<void> {
    // Achievements loaded on-demand in getAllAchievements
  }

  private async saveUserProgress(progress: UserProgress): Promise<void> {
    try {
      await this.saveToStorage(`${this.progressKey}_${progress.userId}`, progress);
      this.userProgress = progress;
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  }

  private async getFromStorage(key: string): Promise<any> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  private async saveToStorage(key: string, data: any): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
export default gamificationService;


