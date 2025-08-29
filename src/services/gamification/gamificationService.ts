/**
 * Gamification Service for Mental Health Progress
 * 
 * This service implements a thoughtful gamification system designed specifically
 * for mental health applications. It focuses on encouraging positive behaviors
 * while avoiding addictive patterns or unhealthy competition.
 * 
 * Key Features:
 * - Points and XP system for activities
 * - Achievement/badge system with mental health-appropriate milestones
 * - Streak tracking for daily check-ins (with compassionate break handling)
 * - Level progression system with meaningful tiers
 * - Milestone rewards for significant progress
 * - Optional anonymous leaderboards (focus on personal growth)
 * - Challenge system with wellness-focused goals
 */

import { EventEmitter } from 'events';

// Types and Interfaces
export interface UserProgress {
  userId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  nextLevelXP: number;
  points: number;
  streakDays: number;
  longestStreak: number;
  lastCheckIn: Date | null;
  streakFrozen: boolean; // For mental health days
  achievements: Achievement[];
  completedChallenges: string[];
  activeChallenges: Challenge[];
  milestones: Milestone[];
  weeklyProgress: WeeklyProgress;
  monthlyProgress: MonthlyProgress;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  progress?: number;
  maxProgress?: number;
  points: number;
  hidden?: boolean;
}

export enum AchievementCategory {
  SELF_CARE = 'self_care',
  CONSISTENCY = 'consistency',
  COMMUNITY = 'community',
  GROWTH = 'growth',
  MINDFULNESS = 'mindfulness',
  RESILIENCE = 'resilience',
  SUPPORT = 'support',
  WELLNESS = 'wellness'
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  progress: number;
  target: number;
  reward: ChallengeReward;
  isActive: boolean;
  isCompleted: boolean;
}

export enum ChallengeType {
  MOOD_TRACKING = 'mood_tracking',
  JOURNALING = 'journaling',
  MEDITATION = 'meditation',
  BREATHING_EXERCISES = 'breathing_exercises',
  GRATITUDE = 'gratitude',
  SOCIAL_CONNECTION = 'social_connection',
  PHYSICAL_ACTIVITY = 'physical_activity',
  SLEEP_TRACKING = 'sleep_tracking',
  SELF_COMPASSION = 'self_compassion',
  MINDFUL_MOMENTS = 'mindful_moments'
}

export interface ChallengeReward {
  xp: number;
  points: number;
  badge?: string;
  title?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: MilestoneRequirement;
  achieved: boolean;
  achievedAt?: Date;
  reward: MilestoneReward;
  nextMilestone?: string;
}

export interface MilestoneRequirement {
  type: 'days_active' | 'activities_completed' | 'level_reached' | 'achievements_earned';
  value: number;
}

export interface MilestoneReward {
  xp: number;
  points: number;
  badge?: string;
  feature?: string; // Unlocks new features
  customization?: string; // Unlocks theme/avatar customizations
}

export interface WeeklyProgress {
  activeDays: number;
  moodCheckins: number;
  activitiesCompleted: number;
  pointsEarned: number;
  xpEarned: number;
  weekStart: Date;
}

export interface MonthlyProgress {
  activeDays: number;
  totalActivities: number;
  averageMood?: number;
  topActivities: string[];
  growthAreas: string[];
  monthStart: Date;
}

export interface ActivityReward {
  xp: number;
  points: number;
  message?: string;
  achievement?: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string; // Anonymous or chosen name
  level: number;
  points: number;
  streakDays: number;
  achievements: number;
  rank?: number;
}

// Activity Point Values (thoughtfully balanced)
const ACTIVITY_POINTS = {
  // Daily essentials
  DAILY_CHECK_IN: 10,
  MOOD_LOG: 15,
  JOURNAL_ENTRY: 25,
  
  // Therapeutic activities
  MEDITATION_SESSION: 20,
  BREATHING_EXERCISE: 15,
  GROUNDING_EXERCISE: 15,
  THERAPY_SESSION: 50,
  
  // Social & Support
  PEER_SUPPORT_GIVEN: 30,
  PEER_SUPPORT_RECEIVED: 20,
  GROUP_SESSION: 40,
  SHARE_STORY: 35,
  
  // Self-care
  SAFETY_PLAN_UPDATE: 45,
  CRISIS_RESOURCES_REVIEWED: 25,
  SELF_CARE_ACTIVITY: 20,
  WELLNESS_VIDEO_WATCHED: 15,
  
  // Progress tracking
  WEEKLY_REFLECTION: 50,
  MONTHLY_REVIEW: 100,
  GOAL_COMPLETED: 75
};

// XP multipliers for consistency
const CONSISTENCY_MULTIPLIERS = {
  STREAK_3_DAYS: 1.1,
  STREAK_7_DAYS: 1.25,
  STREAK_14_DAYS: 1.5,
  STREAK_30_DAYS: 1.75,
  STREAK_60_DAYS: 2.0,
  STREAK_90_DAYS: 2.5
};

// Level thresholds (progressive but achievable)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  450,    // Level 4
  700,    // Level 5
  1000,   // Level 6
  1400,   // Level 7
  1900,   // Level 8
  2500,   // Level 9
  3200,   // Level 10
  4000,   // Level 11
  5000,   // Level 12
  6200,   // Level 13
  7600,   // Level 14
  9200,   // Level 15
  11000,  // Level 16
  13000,  // Level 17
  15500,  // Level 18
  18500,  // Level 19
  22000,  // Level 20
  // Continue with larger increments
];

class GamificationService extends EventEmitter {
  private userProgress: Map<string, UserProgress> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private milestones: Map<string, Milestone> = new Map();
  
  // Safeguards
  private readonly MAX_DAILY_POINTS = 500; // Prevent unhealthy grinding
  private readonly STREAK_FREEZE_DURATION = 2; // Days allowed for mental health breaks
  private readonly MIN_ACTIVITY_INTERVAL = 60000; // 1 minute between same activities
  private lastActivityTime: Map<string, Map<string, number>> = new Map();
  
  constructor() {
    super();
    this.initializeAchievements();
    this.initializeMilestones();
    this.initializeChallenges();
  }
  
  /**
   * Initialize achievement definitions
   */
  private initializeAchievements(): void {
    const achievementDefinitions = [
      // Self-care achievements
      {
        id: 'first_check_in',
        name: 'Hello, Friend',
        description: 'Complete your first daily check-in',
        icon: '👋',
        category: AchievementCategory.SELF_CARE,
        rarity: 'common' as const,
        points: 10
      },
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Check in every day for a week',
        icon: '🗓️',
        category: AchievementCategory.CONSISTENCY,
        rarity: 'uncommon' as const,
        points: 50
      },
      {
        id: 'mindful_month',
        name: 'Mindful Month',
        description: 'Complete 30 days of mindfulness activities',
        icon: '🧘',
        category: AchievementCategory.MINDFULNESS,
        rarity: 'rare' as const,
        points: 100
      },
      {
        id: 'support_star',
        name: 'Support Star',
        description: 'Offer support to 10 community members',
        icon: '⭐',
        category: AchievementCategory.SUPPORT,
        rarity: 'rare' as const,
        points: 75
      },
      {
        id: 'resilience_champion',
        name: 'Resilience Champion',
        description: 'Bounce back from a difficult period',
        icon: '💪',
        category: AchievementCategory.RESILIENCE,
        rarity: 'epic' as const,
        points: 150,
        hidden: true
      },
      {
        id: 'wellness_master',
        name: 'Wellness Master',
        description: 'Reach level 20 in your wellness journey',
        icon: '🏆',
        category: AchievementCategory.WELLNESS,
        rarity: 'legendary' as const,
        points: 500
      }
    ];
    
    achievementDefinitions.forEach(achievement => {
      this.achievements.set(achievement.id, {
        ...achievement,
        unlockedAt: new Date()
      });
    });
  }
  
  /**
   * Initialize milestone definitions
   */
  private initializeMilestones(): void {
    const milestoneDefinitions = [
      {
        id: 'first_week',
        name: 'First Week',
        description: 'Complete your first week of wellness activities',
        requirement: { type: 'days_active' as const, value: 7 },
        reward: {
          xp: 100,
          points: 50,
          badge: 'week_badge',
          customization: 'theme_calming_blue'
        }
      },
      {
        id: 'month_milestone',
        name: 'Monthly Milestone',
        description: 'Stay active for 30 days',
        requirement: { type: 'days_active' as const, value: 30 },
        reward: {
          xp: 500,
          points: 200,
          badge: 'month_badge',
          feature: 'advanced_mood_insights'
        }
      },
      {
        id: 'achievement_collector',
        name: 'Achievement Collector',
        description: 'Earn 10 achievements',
        requirement: { type: 'achievements_earned' as const, value: 10 },
        reward: {
          xp: 300,
          points: 150,
          badge: 'collector_badge',
          customization: 'avatar_special_frame'
        }
      }
    ];
    
    milestoneDefinitions.forEach(milestone => {
      this.milestones.set(milestone.id, {
        ...milestone,
        achieved: false
      });
    });
  }
  
  /**
   * Initialize available challenges
   */
  private initializeChallenges(): void {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const challengeTemplates = [
      {
        id: 'daily_gratitude',
        title: 'Gratitude Practice',
        description: 'Write down 3 things you\'re grateful for',
        type: ChallengeType.GRATITUDE,
        difficulty: 'easy' as const,
        duration: 'daily' as const,
        target: 3,
        reward: { xp: 30, points: 15 }
      },
      {
        id: 'weekly_meditation',
        title: 'Meditation Week',
        description: 'Complete 5 meditation sessions this week',
        type: ChallengeType.MEDITATION,
        difficulty: 'medium' as const,
        duration: 'weekly' as const,
        target: 5,
        reward: { xp: 150, points: 75, badge: 'meditation_week' }
      },
      {
        id: 'self_compassion_month',
        title: 'Self-Compassion Journey',
        description: 'Practice self-compassion exercises 20 times this month',
        type: ChallengeType.SELF_COMPASSION,
        difficulty: 'hard' as const,
        duration: 'monthly' as const,
        target: 20,
        reward: { xp: 500, points: 250, badge: 'compassion_master' }
      }
    ];
    
    challengeTemplates.forEach(template => {
      let endDate: Date;
      switch (template.duration) {
        case 'daily':
          endDate = tomorrow;
          break;
        case 'weekly':
          endDate = nextWeek;
          break;
        case 'monthly':
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        default:
          endDate = tomorrow;
      }
      
      this.challenges.set(template.id, {
        ...template,
        startDate: now,
        endDate,
        progress: 0,
        isActive: true,
        isCompleted: false
      });
    });
  }
  
  /**
   * Award points for completing an activity
   */
  public async awardActivity(
    userId: string,
    activityType: keyof typeof ACTIVITY_POINTS,
    metadata?: Record<string, any>
  ): Promise<ActivityReward> {
    // Check for rate limiting
    if (!this.canPerformActivity(userId, activityType)) {
      return {
        xp: 0,
        points: 0,
        message: 'Please wait a moment before repeating this activity'
      };
    }
    
    const userProgress = this.getUserProgress(userId);
    const dailyPoints = this.getDailyPoints(userId);
    
    // Check daily limit (safeguard against unhealthy behavior)
    if (dailyPoints >= this.MAX_DAILY_POINTS) {
      return {
        xp: 0,
        points: 0,
        message: 'You\'ve reached your daily wellness goal! Take some time to rest.'
      };
    }
    
    const basePoints = ACTIVITY_POINTS[activityType];
    const multiplier = this.getStreakMultiplier(userProgress.streakDays);
    const xpEarned = Math.round(basePoints * multiplier);
    const pointsEarned = basePoints;
    
    // Update user progress
    userProgress.currentXP += xpEarned;
    userProgress.totalXP += xpEarned;
    userProgress.points += pointsEarned;
    
    // Update weekly and monthly progress
    userProgress.weeklyProgress.xpEarned += xpEarned;
    userProgress.weeklyProgress.pointsEarned += pointsEarned;
    userProgress.weeklyProgress.activitiesCompleted++;
    
    userProgress.monthlyProgress.totalActivities++;
    
    // Check for level up
    const leveledUp = this.checkLevelUp(userProgress);
    
    // Check for new achievements
    const newAchievements = this.checkAchievements(userId, activityType, metadata);
    
    // Check for challenge progress
    this.updateChallengeProgress(userId, activityType, metadata);
    
    // Check for milestone completion
    this.checkMilestones(userId);
    
    // Update last activity time
    this.updateActivityTime(userId, activityType);
    
    // Emit events
    this.emit('activityCompleted', {
      userId,
      activityType,
      xpEarned,
      pointsEarned,
      leveledUp,
      newAchievements
    });
    
    if (leveledUp) {
      this.emit('levelUp', {
        userId,
        newLevel: userProgress.level,
        rewards: this.getLevelRewards(userProgress.level)
      });
    }
    
    return {
      xp: xpEarned,
      points: pointsEarned,
      message: this.getEncouragingMessage(activityType),
      achievement: newAchievements[0]?.id
    };
  }
  
  /**
   * Update daily streak
   */
  public updateStreak(userId: string): void {
    const userProgress = this.getUserProgress(userId);
    const now = new Date();
    const lastCheckIn = userProgress.lastCheckIn;
    
    if (!lastCheckIn) {
      // First check-in
      userProgress.streakDays = 1;
      userProgress.lastCheckIn = now;
      return;
    }
    
    const daysSinceLastCheckIn = Math.floor(
      (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastCheckIn === 1) {
      // Consecutive day
      userProgress.streakDays++;
      if (userProgress.streakDays > userProgress.longestStreak) {
        userProgress.longestStreak = userProgress.streakDays;
      }
    } else if (daysSinceLastCheckIn <= this.STREAK_FREEZE_DURATION && userProgress.streakFrozen) {
      // Streak frozen for mental health break
      userProgress.streakFrozen = false;
    } else if (daysSinceLastCheckIn > 1) {
      // Streak broken - but be encouraging
      this.emit('streakBroken', {
        userId,
        previousStreak: userProgress.streakDays,
        message: 'Starting fresh is a sign of resilience. Welcome back!'
      });
      userProgress.streakDays = 1;
    }
    
    userProgress.lastCheckIn = now;
  }
  
  /**
   * Freeze streak for mental health days
   */
  public freezeStreak(userId: string): boolean {
    const userProgress = this.getUserProgress(userId);
    
    if (userProgress.streakFrozen) {
      return false; // Already frozen
    }
    
    userProgress.streakFrozen = true;
    this.emit('streakFrozen', {
      userId,
      message: 'Your streak is protected. Take the time you need.'
    });
    
    return true;
  }
  
  /**
   * Get leaderboard (anonymous and opt-in)
   */
  public getLeaderboard(
    type: 'weekly' | 'monthly' | 'all-time',
    limit: number = 10,
    includeUser?: string
  ): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    
    this.userProgress.forEach((progress, userId) => {
      // Only include users who opted in to leaderboards
      if (!this.isOptedInToLeaderboard(userId) && userId !== includeUser) {
        return;
      }
      
      entries.push({
        userId,
        displayName: this.getAnonymousName(userId),
        level: progress.level,
        points: type === 'weekly' ? progress.weeklyProgress.pointsEarned :
                type === 'monthly' ? this.getMonthlyPoints(progress) :
                progress.points,
        streakDays: progress.streakDays,
        achievements: progress.achievements.length
      });
    });
    
    // Sort by points
    entries.sort((a, b) => b.points - a.points);
    
    // Add rankings
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    // Return top entries plus user's entry if requested
    const topEntries = entries.slice(0, limit);
    
    if (includeUser) {
      const userEntry = entries.find(e => e.userId === includeUser);
      if (userEntry && !topEntries.includes(userEntry)) {
        topEntries.push(userEntry);
      }
    }
    
    return topEntries;
  }
  
  /**
   * Join a challenge
   */
  public joinChallenge(userId: string, challengeId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || !challenge.isActive || challenge.isCompleted) {
      return false;
    }
    
    const userProgress = this.getUserProgress(userId);
    
    // Check if already in this challenge
    if (userProgress.activeChallenges.find(c => c.id === challengeId)) {
      return false;
    }
    
    // Limit active challenges to prevent overwhelm
    if (userProgress.activeChallenges.length >= 3) {
      this.emit('challengeLimitReached', {
        userId,
        message: 'Focus on completing your current challenges first'
      });
      return false;
    }
    
    userProgress.activeChallenges.push({ ...challenge });
    
    this.emit('challengeJoined', {
      userId,
      challengeId,
      challenge
    });
    
    return true;
  }
  
  /**
   * Helper: Get user progress or create new
   */
  private getUserProgress(userId: string): UserProgress {
    if (!this.userProgress.has(userId)) {
      const now = new Date();
      this.userProgress.set(userId, {
        userId,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        nextLevelXP: LEVEL_THRESHOLDS[1],
        points: 0,
        streakDays: 0,
        longestStreak: 0,
        lastCheckIn: null,
        streakFrozen: false,
        achievements: [],
        completedChallenges: [],
        activeChallenges: [],
        milestones: [],
        weeklyProgress: {
          activeDays: 0,
          moodCheckins: 0,
          activitiesCompleted: 0,
          pointsEarned: 0,
          xpEarned: 0,
          weekStart: now
        },
        monthlyProgress: {
          activeDays: 0,
          totalActivities: 0,
          topActivities: [],
          growthAreas: [],
          monthStart: now
        }
      });
    }
    
    return this.userProgress.get(userId)!;
  }
  
  /**
   * Helper: Check if activity can be performed (rate limiting)
   */
  private canPerformActivity(userId: string, activityType: string): boolean {
    if (!this.lastActivityTime.has(userId)) {
      this.lastActivityTime.set(userId, new Map());
    }
    
    const userActivities = this.lastActivityTime.get(userId)!;
    const lastTime = userActivities.get(activityType);
    
    if (!lastTime) {
      return true;
    }
    
    return Date.now() - lastTime >= this.MIN_ACTIVITY_INTERVAL;
  }
  
  /**
   * Helper: Update last activity time
   */
  private updateActivityTime(userId: string, activityType: string): void {
    if (!this.lastActivityTime.has(userId)) {
      this.lastActivityTime.set(userId, new Map());
    }
    
    this.lastActivityTime.get(userId)!.set(activityType, Date.now());
  }
  
  /**
   * Helper: Get daily points earned
   */
  private getDailyPoints(userId: string): number {
    const userProgress = this.getUserProgress(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // This would typically query from a database
    // For now, we'll use weekly progress as an approximation
    const daysSinceWeekStart = Math.floor(
      (today.getTime() - userProgress.weeklyProgress.weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceWeekStart === 0) {
      return userProgress.weeklyProgress.pointsEarned;
    }
    
    return Math.floor(userProgress.weeklyProgress.pointsEarned / (daysSinceWeekStart + 1));
  }
  
  /**
   * Helper: Get streak multiplier
   */
  private getStreakMultiplier(streakDays: number): number {
    if (streakDays >= 90) return CONSISTENCY_MULTIPLIERS.STREAK_90_DAYS;
    if (streakDays >= 60) return CONSISTENCY_MULTIPLIERS.STREAK_60_DAYS;
    if (streakDays >= 30) return CONSISTENCY_MULTIPLIERS.STREAK_30_DAYS;
    if (streakDays >= 14) return CONSISTENCY_MULTIPLIERS.STREAK_14_DAYS;
    if (streakDays >= 7) return CONSISTENCY_MULTIPLIERS.STREAK_7_DAYS;
    if (streakDays >= 3) return CONSISTENCY_MULTIPLIERS.STREAK_3_DAYS;
    return 1.0;
  }
  
  /**
   * Helper: Check for level up
   */
  private checkLevelUp(userProgress: UserProgress): boolean {
    const currentLevel = userProgress.level;
    let newLevel = currentLevel;
    
    for (let i = currentLevel; i < LEVEL_THRESHOLDS.length; i++) {
      if (userProgress.totalXP >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }
    
    if (newLevel > currentLevel) {
      userProgress.level = newLevel;
      userProgress.currentXP = userProgress.totalXP - LEVEL_THRESHOLDS[newLevel - 1];
      userProgress.nextLevelXP = LEVEL_THRESHOLDS[newLevel] - LEVEL_THRESHOLDS[newLevel - 1];
      return true;
    }
    
    return false;
  }
  
  /**
   * Helper: Check for new achievements
   */
  private checkAchievements(
    userId: string,
    activityType: string,
    metadata?: Record<string, any>
  ): Achievement[] {
    const userProgress = this.getUserProgress(userId);
    const newAchievements: Achievement[] = [];
    
    // Check various achievement conditions
    // This is simplified - in production, this would be more sophisticated
    
    // First check-in achievement
    if (activityType === 'DAILY_CHECK_IN' && userProgress.achievements.length === 0) {
      const achievement = this.achievements.get('first_check_in');
      if (achievement && !userProgress.achievements.find(a => a.id === achievement.id)) {
        const unlockedAchievement = { ...achievement, unlockedAt: new Date() };
        userProgress.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
      }
    }
    
    // Week warrior achievement
    if (userProgress.streakDays >= 7) {
      const achievement = this.achievements.get('week_warrior');
      if (achievement && !userProgress.achievements.find(a => a.id === achievement.id)) {
        const unlockedAchievement = { ...achievement, unlockedAt: new Date() };
        userProgress.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
      }
    }
    
    // Level 20 achievement
    if (userProgress.level >= 20) {
      const achievement = this.achievements.get('wellness_master');
      if (achievement && !userProgress.achievements.find(a => a.id === achievement.id)) {
        const unlockedAchievement = { ...achievement, unlockedAt: new Date() };
        userProgress.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
      }
    }
    
    return newAchievements;
  }
  
  /**
   * Helper: Update challenge progress
   */
  private updateChallengeProgress(
    userId: string,
    activityType: string,
    metadata?: Record<string, any>
  ): void {
    const userProgress = this.getUserProgress(userId);
    
    userProgress.activeChallenges.forEach(challenge => {
      // Map activity types to challenge types
      let progressIncrement = 0;
      
      switch (challenge.type) {
        case ChallengeType.MOOD_TRACKING:
          if (activityType === 'MOOD_LOG') progressIncrement = 1;
          break;
        case ChallengeType.JOURNALING:
          if (activityType === 'JOURNAL_ENTRY') progressIncrement = 1;
          break;
        case ChallengeType.MEDITATION:
          if (activityType === 'MEDITATION_SESSION') progressIncrement = 1;
          break;
        case ChallengeType.BREATHING_EXERCISES:
          if (activityType === 'BREATHING_EXERCISE') progressIncrement = 1;
          break;
        // Add more mappings as needed
      }
      
      if (progressIncrement > 0) {
        challenge.progress += progressIncrement;
        
        // Check if challenge is completed
        if (challenge.progress >= challenge.target && !challenge.isCompleted) {
          challenge.isCompleted = true;
          userProgress.completedChallenges.push(challenge.id);
          
          // Award challenge rewards
          userProgress.currentXP += challenge.reward.xp;
          userProgress.totalXP += challenge.reward.xp;
          userProgress.points += challenge.reward.points;
          
          this.emit('challengeCompleted', {
            userId,
            challenge,
            reward: challenge.reward
          });
        }
      }
    });
    
    // Remove expired challenges
    const now = new Date();
    userProgress.activeChallenges = userProgress.activeChallenges.filter(
      challenge => challenge.endDate > now && !challenge.isCompleted
    );
  }
  
  /**
   * Helper: Check for milestone completion
   */
  private checkMilestones(userId: string): void {
    const userProgress = this.getUserProgress(userId);
    
    this.milestones.forEach(milestone => {
      if (milestone.achieved) return;
      
      let requirementMet = false;
      
      switch (milestone.requirement.type) {
        case 'days_active':
          // This would typically check actual activity days from database
          requirementMet = userProgress.weeklyProgress.activeDays >= milestone.requirement.value;
          break;
        case 'achievements_earned':
          requirementMet = userProgress.achievements.length >= milestone.requirement.value;
          break;
        case 'level_reached':
          requirementMet = userProgress.level >= milestone.requirement.value;
          break;
        case 'activities_completed':
          requirementMet = userProgress.monthlyProgress.totalActivities >= milestone.requirement.value;
          break;
      }
      
      if (requirementMet && !userProgress.milestones.find(m => m.id === milestone.id)) {
        const achievedMilestone = {
          ...milestone,
          achieved: true,
          achievedAt: new Date()
        };
        
        userProgress.milestones.push(achievedMilestone);
        
        // Award milestone rewards
        userProgress.currentXP += milestone.reward.xp;
        userProgress.totalXP += milestone.reward.xp;
        userProgress.points += milestone.reward.points;
        
        this.emit('milestoneAchieved', {
          userId,
          milestone: achievedMilestone,
          reward: milestone.reward
        });
      }
    });
  }
  
  /**
   * Helper: Get level rewards
   */
  private getLevelRewards(level: number): Record<string, any> {
    const rewards: Record<string, any> = {
      points: level * 10,
      message: `Congratulations on reaching level ${level}!`
    };
    
    // Special rewards at certain levels
    if (level % 5 === 0) {
      rewards.badge = `level_${level}_badge`;
      rewards.customization = `theme_level_${level}`;
    }
    
    if (level === 10) {
      rewards.feature = 'advanced_analytics';
    }
    
    if (level === 20) {
      rewards.feature = 'mentor_status';
      rewards.title = 'Wellness Mentor';
    }
    
    return rewards;
  }
  
  /**
   * Helper: Get encouraging message
   */
  private getEncouragingMessage(activityType: string): string {
    const messages: Record<string, string[]> = {
      DAILY_CHECK_IN: [
        'Great start to the day!',
        'Your consistency is inspiring!',
        'Every check-in is a step forward.'
      ],
      MOOD_LOG: [
        'Thank you for sharing how you feel.',
        'Awareness is the first step to wellness.',
        'Your feelings are valid and important.'
      ],
      JOURNAL_ENTRY: [
        'Your thoughts matter.',
        'Writing is a powerful tool for healing.',
        'Keep expressing yourself!'
      ],
      MEDITATION_SESSION: [
        'Finding peace within.',
        'Mindfulness is a gift to yourself.',
        'You\'re cultivating inner calm.'
      ],
      PEER_SUPPORT_GIVEN: [
        'Your kindness makes a difference.',
        'Supporting others supports you too.',
        'You\'re building a caring community.'
      ]
    };
    
    const activityMessages = messages[activityType] || [
      'Well done!',
      'Keep up the great work!',
      'You\'re making progress!'
    ];
    
    return activityMessages[Math.floor(Math.random() * activityMessages.length)];
  }
  
  /**
   * Helper: Check if user opted in to leaderboards
   */
  private isOptedInToLeaderboard(userId: string): boolean {
    // This would check user preferences in production
    // For now, we'll assume opt-in by default with ability to opt-out
    return true;
  }
  
  /**
   * Helper: Generate anonymous display name
   */
  private getAnonymousName(userId: string): string {
    // Generate consistent anonymous names based on user ID
    const adjectives = ['Brave', 'Mindful', 'Resilient', 'Caring', 'Strong', 'Gentle', 'Wise'];
    const nouns = ['Phoenix', 'Oak', 'River', 'Mountain', 'Star', 'Garden', 'Light'];
    
    // Use user ID to generate consistent index
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const adjIndex = hash % adjectives.length;
    const nounIndex = (hash * 2) % nouns.length;
    
    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
  }
  
  /**
   * Helper: Get monthly points
   */
  private getMonthlyPoints(progress: UserProgress): number {
    // This would calculate actual monthly points from database
    // For now, use approximation
    return progress.points;
  }
  
  /**
   * Get user's current progress
   */
  public getProgress(userId: string): UserProgress {
    return this.getUserProgress(userId);
  }
  
  /**
   * Get available challenges
   */
  public getAvailableChallenges(): Challenge[] {
    return Array.from(this.challenges.values()).filter(c => c.isActive && !c.isCompleted);
  }
  
  /**
   * Get all achievements
   */
  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }
  
  /**
   * Get all milestones
   */
  public getAllMilestones(): Milestone[] {
    return Array.from(this.milestones.values());
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();

// Export for testing
export default GamificationService;