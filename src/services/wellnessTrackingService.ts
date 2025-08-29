/**
 * Wellness Tracking Service - Rewritten for Type Safety
 * 
 * Comprehensive wellness tracking for mental health monitoring
 * Optimized for performance and type safety
 */

// Type-safe logger
const logger = {
  info: (msg: string, data?: any) => console.log(msg, data),
  error: (msg: string, data?: any) => console.error(msg, data),
  warn: (msg: string, data?: any) => console.warn(msg, data)
};

export interface WellnessMetrics {
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  sleep: number; // hours
  exercise: number; // minutes
  socialInteraction: number; // 1-10 scale
  productivity: number; // 1-10 scale
  timestamp: Date;
}

export interface WellnessGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'mood' | 'exercise' | 'sleep' | 'meditation' | 'social' | 'custom';
  targetValue: number;
  currentValue: number;
  progress: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  isCompleted: boolean;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number;
  energy?: number;
  anxiety?: number;
  notes?: string;
  timestamp: string;
}

export interface WellnessInsight {
  id: string;
  type: 'trend' | 'pattern' | 'achievement' | 'recommendation' | 'warning';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  actionable: boolean;
  createdAt: Date;
}

export interface WellnessReport {
  id: string;
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    averageMood: number;
    averageEnergy: number;
    averageAnxiety: number;
    totalExerciseMinutes: number;
    averageSleepHours: number;
    goalsCompleted: number;
    streakDays: number;
  };
  insights: WellnessInsight[];
  recommendations: string[];
  createdAt: Date;
}

export interface WellnessStreak {
  type: 'mood_logging' | 'exercise' | 'meditation' | 'sleep' | 'goal_completion';
  currentDays: number;
  longestDays: number;
  lastActivity: Date;
  nextMilestone: number;
}

export interface WellnessReminder {
  id: string;
  type: 'mood_check' | 'medication' | 'exercise' | 'sleep' | 'hydration' | 'custom';
  title: string;
  message: string;
  time: string; // HH:MM format
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  enabled: boolean;
  lastTriggered?: Date;
  nextTrigger?: Date;
}

export class WellnessTrackingService {
  private metrics: Map<string, WellnessMetrics[]> = new Map();
  private goals: Map<string, WellnessGoal[]> = new Map();
  private insights: Map<string, WellnessInsight[]> = new Map();
  private reminders: Map<string, WellnessReminder[]> = new Map();
  private streaks: Map<string, Map<string, WellnessStreak>> = new Map();
  private reports: Map<string, WellnessReport[]> = new Map();

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    this.loadPersistedData();
    this.initializeReminders();
    logger.info('Wellness tracking service initialized');
  }

  public async trackMetrics(userId: string, metrics: Partial<WellnessMetrics>): Promise<void> {
    try {
      const fullMetrics: WellnessMetrics = {
        mood: metrics.mood || 5,
        energy: metrics.energy || 5,
        anxiety: metrics.anxiety || 5,
        sleep: metrics.sleep || 0,
        exercise: metrics.exercise || 0,
        socialInteraction: metrics.socialInteraction || 5,
        productivity: metrics.productivity || 5,
        timestamp: new Date()
      };

      const userMetrics = this.metrics.get(userId) || [];
      userMetrics.push(fullMetrics);
      this.metrics.set(userId, userMetrics);

      this.updateStreaks(userId, metrics);
      await this.generateInsights(userId);
      this.checkGoalProgress(userId);
      this.persistData();

      logger.info(`Tracked wellness metrics for user ${userId}`);
    } catch (error) {
      logger.error('Failed to track wellness metrics:', error);
      throw error;
    }
  }

  public async createMoodEntry(userId: string, entry: Omit<MoodEntry, 'id' | 'userId' | 'timestamp'>): Promise<MoodEntry> {
    const moodEntry: MoodEntry = {
      id: this.generateId(),
      userId,
      timestamp: new Date().toISOString(),
      ...entry
    };

    await this.trackMetrics(userId, {
      mood: entry.mood,
      energy: entry.energy,
      anxiety: entry.anxiety
    });

    logger.info(`Created mood entry for user ${userId}`);
    return moodEntry;
  }

  public getMoodHistory(userId: string, days: number = 30): MoodEntry[] {
    const metrics = this.metrics.get(userId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return metrics
      .filter(m => m.timestamp >= cutoffDate)
      .map(m => ({
        id: this.generateId(),
        userId,
        mood: m.mood,
        energy: m.energy,
        anxiety: m.anxiety,
        timestamp: m.timestamp.toISOString()
      }));
  }

  public createGoal(userId: string, goal: Omit<WellnessGoal, 'id' | 'userId' | 'progress' | 'isCompleted' | 'currentValue'>): WellnessGoal {
    const wellnessGoal: WellnessGoal = {
      id: this.generateId(),
      userId,
      progress: 0,
      currentValue: 0,
      isCompleted: false,
      ...goal
    };

    const userGoals = this.goals.get(userId) || [];
    userGoals.push(wellnessGoal);
    this.goals.set(userId, userGoals);

    this.persistData();
    logger.info(`Created wellness goal for user ${userId}`);
    
    return wellnessGoal;
  }

  public updateGoalProgress(userId: string, goalId: string, progress: number): void {
    const userGoals = this.goals.get(userId) || [];
    const goal = userGoals.find(g => g.id === goalId);

    if (goal) {
      goal.currentValue = progress;
      goal.progress = Math.min(100, (progress / goal.targetValue) * 100);
      goal.isCompleted = goal.progress >= 100;

      if (goal.isCompleted) {
        this.createInsight(userId, {
          type: 'achievement',
          title: 'Goal Completed!',
          description: `Congratulations! You've completed your goal: ${goal.title}`,
          severity: 'success',
          actionable: false
        });
      }

      this.persistData();
      logger.info(`Updated goal progress for user ${userId}`);
    }
  }

  public getGoals(userId: string): WellnessGoal[] {
    return this.goals.get(userId) || [];
  }

  public getActiveGoals(userId: string): WellnessGoal[] {
    const goals = this.goals.get(userId) || [];
    return goals.filter(g => !g.isCompleted);
  }

  private async generateInsights(userId: string): Promise<void> {
    const metrics = this.metrics.get(userId) || [];
    if (metrics.length < 2) return;

    const insights: WellnessInsight[] = [];

    // Analyze mood trends
    const moodTrend = this.analyzeTrend(metrics.map(m => m.mood));
    if (moodTrend.significant) {
      insights.push({
        id: this.generateId(),
        type: moodTrend.direction === 'improving' ? 'trend' : 'warning',
        title: `Mood ${moodTrend.direction === 'improving' ? 'Improving' : 'Declining'}`,
        description: `Your mood has ${moodTrend.direction === 'improving' ? 'improved' : 'declined'} by ${Math.abs(moodTrend.changePercent)}% over the past week`,
        severity: moodTrend.direction === 'improving' ? 'success' : 'warning',
        actionable: true,
        createdAt: new Date()
      });
    }

    // Store insights
    const userInsights = this.insights.get(userId) || [];
    userInsights.push(...insights);
    this.insights.set(userId, userInsights);
  }

  private analyzeTrend(data: number[]): {
    direction: 'improving' | 'stable' | 'declining';
    changePercent: number;
    significant: boolean;
  } {
    if (data.length < 2) {
      return { direction: 'stable', changePercent: 0, significant: false };
    }

    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((a, b) => a + b, 0) / previous.length 
      : recentAvg;

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
    const threshold = 10; // 10% change threshold

    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (changePercent > threshold) direction = 'improving';
    else if (changePercent < -threshold) direction = 'declining';

    return {
      direction,
      changePercent,
      significant: Math.abs(changePercent) > threshold
    };
  }

  private updateStreaks(userId: string, metrics: Partial<WellnessMetrics>): void {
    const userStreaks = this.streaks.get(userId) || new Map();

    // Update mood logging streak
    if (metrics.mood !== undefined) {
      const moodStreak = userStreaks.get('mood_logging') || {
        type: 'mood_logging' as const,
        currentDays: 0,
        longestDays: 0,
        lastActivity: new Date(),
        nextMilestone: 7
      };

      const daysSinceLastActivity = Math.floor(
        (new Date().getTime() - moodStreak.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity <= 1) {
        moodStreak.currentDays++;
        moodStreak.longestDays = Math.max(moodStreak.longestDays, moodStreak.currentDays);
      } else {
        moodStreak.currentDays = 1;
      }

      moodStreak.lastActivity = new Date();
      moodStreak.nextMilestone = this.getNextMilestone(moodStreak.currentDays);

      userStreaks.set('mood_logging', moodStreak);
    }

    this.streaks.set(userId, userStreaks);
  }

  private getNextMilestone(currentDays: number): number {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    return milestones.find(m => m > currentDays) || currentDays + 100;
  }

  public getStreaks(userId: string): WellnessStreak[] {
    const userStreaks = this.streaks.get(userId) || new Map();
    return Array.from(userStreaks.values());
  }

  private checkGoalProgress(userId: string): void {
    const userGoals = this.goals.get(userId) || [];
    const metrics = this.metrics.get(userId) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    userGoals.forEach(goal => {
      if (goal.isCompleted) return;

      if (goal.frequency === 'daily') {
        const todayMetrics = metrics.filter(m => {
          const metricDate = new Date(m.timestamp);
          metricDate.setHours(0, 0, 0, 0);
          return metricDate.getTime() === today.getTime();
        });

        if (todayMetrics.length > 0) {
          if (goal.category === 'mood' && todayMetrics.some(m => m.mood >= goal.targetValue)) {
            this.updateGoalProgress(userId, goal.id, goal.targetValue);
          } else if (goal.category === 'exercise') {
            const totalExercise = todayMetrics.reduce((sum, m) => sum + m.exercise, 0);
            this.updateGoalProgress(userId, goal.id, totalExercise);
          }
        }
      }
    });
  }

  private createInsight(userId: string, insight: Omit<WellnessInsight, 'id' | 'createdAt'>): void {
    const userInsights = this.insights.get(userId) || [];
    userInsights.push({
      id: this.generateId(),
      createdAt: new Date(),
      ...insight
    });
    this.insights.set(userId, userInsights);
  }

  public getInsights(userId: string, limit: number = 10): WellnessInsight[] {
    const userInsights = this.insights.get(userId) || [];
    return userInsights
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  public async generateReport(userId: string, period: 'weekly' | 'monthly' = 'weekly'): Promise<WellnessReport> {
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const metrics = (this.metrics.get(userId) || [])
      .filter(m => m.timestamp >= startDate && m.timestamp <= endDate);

    const goals = this.goals.get(userId) || [];
    const completedGoals = goals.filter(g => 
      g.isCompleted && 
      g.endDate && 
      new Date(g.endDate) >= startDate && 
      new Date(g.endDate) <= endDate
    );

    const report: WellnessReport = {
      id: this.generateId(),
      userId,
      period: { start: startDate, end: endDate },
      summary: {
        averageMood: metrics.reduce((sum, m) => sum + m.mood, 0) / (metrics.length || 1),
        averageEnergy: metrics.reduce((sum, m) => sum + m.energy, 0) / (metrics.length || 1),
        averageAnxiety: metrics.reduce((sum, m) => sum + m.anxiety, 0) / (metrics.length || 1),
        totalExerciseMinutes: metrics.reduce((sum, m) => sum + m.exercise, 0),
        averageSleepHours: metrics.reduce((sum, m) => sum + m.sleep, 0) / (metrics.length || 1),
        goalsCompleted: completedGoals.length,
        streakDays: this.getStreaks(userId).reduce((max, s) => Math.max(max, s.currentDays), 0)
      },
      insights: this.getInsights(userId, 5),
      recommendations: this.generateRecommendations(metrics),
      createdAt: new Date()
    };

    const userReports = this.reports.get(userId) || [];
    userReports.push(report);
    this.reports.set(userId, userReports);

    return report;
  }

  private generateRecommendations(metrics: WellnessMetrics[]): string[] {
    const recommendations: string[] = [];

    const avgMood = metrics.reduce((sum, m) => sum + m.mood, 0) / (metrics.length || 1);
    const avgExercise = metrics.reduce((sum, m) => sum + m.exercise, 0) / (metrics.length || 1);
    const avgSleep = metrics.reduce((sum, m) => sum + m.sleep, 0) / (metrics.length || 1);

    if (avgMood < 5) {
      recommendations.push('Consider talking to a mental health professional');
      recommendations.push('Try incorporating mood-boosting activities into your routine');
    }

    if (avgExercise < 30) {
      recommendations.push('Aim for at least 30 minutes of physical activity daily');
    }

    if (avgSleep < 7) {
      recommendations.push('Focus on improving sleep hygiene for better rest');
    }

    return recommendations;
  }

  public setReminder(userId: string, reminder: Omit<WellnessReminder, 'id'>): WellnessReminder {
    const fullReminder: WellnessReminder = {
      id: this.generateId(),
      ...reminder
    };

    const userReminders = this.reminders.get(userId) || [];
    userReminders.push(fullReminder);
    this.reminders.set(userId, userReminders);

    this.scheduleReminder(userId, fullReminder);
    this.persistData();

    return fullReminder;
  }

  public getReminders(userId: string): WellnessReminder[] {
    return this.reminders.get(userId) || [];
  }

  private initializeReminders(): void {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.checkReminders();
      }, 60000);
    }
  }

  private checkReminders(): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.reminders.forEach((userReminders, userId) => {
      userReminders.forEach(reminder => {
        if (!reminder.enabled) return;

        if (reminder.time === currentTime) {
          if (this.shouldTriggerReminder(reminder, now)) {
            this.triggerReminder(userId, reminder);
          }
        }
      });
    });
  }

  private shouldTriggerReminder(reminder: WellnessReminder, now: Date): boolean {
    if (reminder.lastTriggered) {
      const lastTrigger = new Date(reminder.lastTriggered);
      const hoursSinceLastTrigger = (now.getTime() - lastTrigger.getTime()) / (1000 * 60 * 60);

      if (reminder.frequency === 'daily' && hoursSinceLastTrigger < 23) {
        return false;
      }
    }

    if (reminder.frequency === 'weekly' && reminder.daysOfWeek) {
      return reminder.daysOfWeek.includes(now.getDay());
    }

    return true;
  }

  private triggerReminder(userId: string, reminder: WellnessReminder): void {
    logger.info(`Triggering reminder for user ${userId}: ${reminder.title}`);

    reminder.lastTriggered = new Date();
    
    const next = new Date();
    if (reminder.frequency === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (reminder.frequency === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (reminder.frequency === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    }
    reminder.nextTrigger = next;

    this.persistData();
  }

  private scheduleReminder(userId: string, reminder: WellnessReminder): void {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const nextTrigger = new Date();
    nextTrigger.setHours(hours, minutes, 0, 0);

    if (nextTrigger <= now) {
      if (reminder.frequency === 'daily') {
        nextTrigger.setDate(nextTrigger.getDate() + 1);
      }
    }

    reminder.nextTrigger = nextTrigger;
  }

  private loadPersistedData(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const savedData = localStorage.getItem('wellnessTrackingData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        if (parsed.metrics) {
          this.metrics = new Map(parsed.metrics.map((item: any) => [
            item.userId,
            item.data.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
          ]));
        }

        if (parsed.goals) {
          this.goals = new Map(parsed.goals);
        }

        if (parsed.reminders) {
          this.reminders = new Map(parsed.reminders);
        }
      }
    } catch (error) {
      logger.error('Failed to load persisted wellness data:', error);
    }
  }

  private persistData(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const dataToSave = {
        metrics: Array.from(this.metrics.entries()).map(([userId, data]) => ({
          userId,
          data
        })),
        goals: Array.from(this.goals.entries()),
        reminders: Array.from(this.reminders.entries())
      };

      localStorage.setItem('wellnessTrackingData', JSON.stringify(dataToSave));
    } catch (error) {
      logger.error('Failed to persist wellness data:', error);
    }
  }

  private generateId(): string {
    return `wellness-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public clearUserData(userId: string): void {
    this.metrics.delete(userId);
    this.goals.delete(userId);
    this.insights.delete(userId);
    this.reminders.delete(userId);
    this.streaks.delete(userId);
    this.reports.delete(userId);
    this.persistData();
    
    logger.info(`Cleared all wellness data for user ${userId}`);
  }

  public exportUserData(userId: string): any {
    return {
      metrics: this.metrics.get(userId) || [],
      goals: this.goals.get(userId) || [],
      insights: this.insights.get(userId) || [],
      reminders: this.reminders.get(userId) || [],
      streaks: Array.from(this.streaks.get(userId)?.values() || []),
      reports: this.reports.get(userId) || []
    };
  }
}

// Export singleton instance
export const wellnessTrackingService = new WellnessTrackingService();
export default wellnessTrackingService;