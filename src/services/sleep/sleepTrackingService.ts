/**
 * Sleep Tracking Service
 * Comprehensive sleep monitoring and analysis for mental health insights
 */

import { differenceInHours, differenceInMinutes, format, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';

// Types for sleep tracking
export interface SleepEntry {
  id: string;
  userId: string;
  date: Date;
  bedtime: Date;
  wakeTime: Date;
  actualSleepTime?: number; // in minutes
  quality: SleepQuality;
  dreams?: DreamEntry[];
  factors: SleepFactor[];
  environment: EnvironmentAssessment;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DreamEntry {
  id: string;
  content: string;
  emotion: 'positive' | 'neutral' | 'negative' | 'nightmare';
  intensity: number; // 1-5
  recurring?: boolean;
  themes?: string[];
}

export interface SleepFactor {
  factor: string;
  present: boolean;
  impact?: 'positive' | 'negative' | 'neutral';
}

export interface EnvironmentAssessment {
  temperature: 'too_cold' | 'cold' | 'comfortable' | 'warm' | 'too_warm';
  noise: 'silent' | 'quiet' | 'moderate' | 'noisy' | 'very_noisy';
  light: 'pitch_dark' | 'dark' | 'dim' | 'bright' | 'very_bright';
  comfort: number; // 1-5
}

export enum SleepQuality {
  VERY_POOR = 1,
  POOR = 2,
  FAIR = 3,
  GOOD = 4,
  EXCELLENT = 5
}

export interface SleepPattern {
  averageBedtime: string;
  averageWakeTime: string;
  averageDuration: number; // in hours
  consistency: number; // 0-100%
  qualityTrend: 'improving' | 'stable' | 'declining';
  commonFactors: string[];
}

export interface CircadianProfile {
  chronotype: 'early_bird' | 'night_owl' | 'intermediate';
  optimalBedtime: string;
  optimalWakeTime: string;
  currentAlignment: number; // 0-100%
  recommendations: string[];
}

export interface SleepDebt {
  current: number; // in hours
  weekly: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  recoveryPlan: string[];
}

export interface SleepRecommendation {
  category: 'hygiene' | 'schedule' | 'environment' | 'lifestyle' | 'medical';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  expectedBenefit: string;
}

class SleepTrackingService {
  private readonly STORAGE_KEY = 'sleep_entries';
  private readonly RECOMMENDED_SLEEP_HOURS = 8;
  private readonly SLEEP_DEBT_THRESHOLD = 14; // hours per week

  /**
   * Log a new sleep entry
   */
  async logSleep(entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<SleepEntry> {
    const newEntry: SleepEntry = {
      ...entry,
      id: this.generateId(),
      actualSleepTime: this.calculateSleepDuration(entry.bedtime, entry.wakeTime),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const entries = await this.getAllEntries();
    entries.push(newEntry);
    await this.saveEntries(entries);

    // Trigger analysis for patterns
    this.analyzeAndNotify(newEntry);

    return newEntry;
  }

  /**
   * Calculate actual sleep duration in minutes
   */
  private calculateSleepDuration(bedtime: Date, wakeTime: Date): number {
    return differenceInMinutes(wakeTime, bedtime);
  }

  /**
   * Get all sleep entries for a user
   */
  async getAllEntries(userId?: string): Promise<SleepEntry[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    const entries = JSON.parse(stored) as SleepEntry[];
    return userId ? entries.filter(e => e.userId === userId) : entries;
  }

  /**
   * Get entries for a specific date range
   */
  async getEntriesInRange(startDate: Date, endDate: Date, userId: string): Promise<SleepEntry[]> {
    const entries = await this.getAllEntries(userId);
    return entries.filter(entry => 
      isWithinInterval(new Date(entry.date), { start: startDate, end: endDate })
    );
  }

  /**
   * Analyze sleep patterns over time
   */
  async analyzeSleepPatterns(userId: string, days: number = 30): Promise<SleepPattern> {
    const startDate = subDays(new Date(), days);
    const entries = await this.getEntriesInRange(startDate, new Date(), userId);

    if (entries.length === 0) {
      return this.getDefaultPattern();
    }

    // Calculate averages
    const bedtimes = entries.map(e => new Date(e.bedtime).getHours() + new Date(e.bedtime).getMinutes() / 60);
    const waketimes = entries.map(e => new Date(e.wakeTime).getHours() + new Date(e.wakeTime).getMinutes() / 60);
    const durations = entries.map(e => (e.actualSleepTime || 0) / 60);
    const qualities = entries.map(e => e.quality);

    const avgBedtime = this.calculateAverageTime(bedtimes);
    const avgWakeTime = this.calculateAverageTime(waketimes);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Calculate consistency (standard deviation)
    const consistency = this.calculateConsistency(bedtimes, waketimes);

    // Determine quality trend
    const qualityTrend = this.calculateQualityTrend(qualities);

    // Find common factors
    const commonFactors = this.findCommonFactors(entries);

    return {
      averageBedtime: this.formatTime(avgBedtime),
      averageWakeTime: this.formatTime(avgWakeTime),
      averageDuration: Math.round(avgDuration * 10) / 10,
      consistency,
      qualityTrend,
      commonFactors
    };
  }

  /**
   * Analyze circadian rhythm and chronotype
   */
  async analyzeCircadianRhythm(userId: string): Promise<CircadianProfile> {
    const pattern = await this.analyzeSleepPatterns(userId);
    const entries = await this.getEntriesInRange(subDays(new Date(), 30), new Date(), userId);

    // Determine chronotype based on average sleep times
    const avgBedtimeHour = parseInt(pattern.averageBedtime.split(':')[0]);
    let chronotype: CircadianProfile['chronotype'] = 'intermediate';
    
    if (avgBedtimeHour < 22) {
      chronotype = 'early_bird';
    } else if (avgBedtimeHour >= 24 || avgBedtimeHour < 2) {
      chronotype = 'night_owl';
    }

    // Calculate optimal times based on chronotype and performance
    const { optimalBedtime, optimalWakeTime } = this.calculateOptimalTimes(chronotype, entries);

    // Calculate current alignment
    const alignment = this.calculateCircadianAlignment(pattern, optimalBedtime, optimalWakeTime);

    // Generate recommendations
    const recommendations = this.generateCircadianRecommendations(chronotype, alignment, pattern);

    return {
      chronotype,
      optimalBedtime,
      optimalWakeTime,
      currentAlignment: alignment,
      recommendations
    };
  }

  /**
   * Calculate sleep debt
   */
  async calculateSleepDebt(userId: string): Promise<SleepDebt> {
    const weeklyEntries = await this.getEntriesInRange(
      startOfWeek(new Date()),
      endOfWeek(new Date()),
      userId
    );

    const monthlyEntries = await this.getEntriesInRange(
      subDays(new Date(), 30),
      new Date(),
      userId
    );

    // Calculate weekly sleep debt
    const weeklyActual = weeklyEntries.reduce((sum, e) => sum + (e.actualSleepTime || 0) / 60, 0);
    const weeklyRecommended = 7 * this.RECOMMENDED_SLEEP_HOURS;
    const weeklyDebt = Math.max(0, weeklyRecommended - weeklyActual);

    // Calculate current accumulated debt
    const monthlyActual = monthlyEntries.reduce((sum, e) => sum + (e.actualSleepTime || 0) / 60, 0);
    const monthlyRecommended = 30 * this.RECOMMENDED_SLEEP_HOURS;
    const currentDebt = Math.max(0, monthlyRecommended - monthlyActual);

    // Determine trend
    const trend = this.calculateDebtTrend(monthlyEntries);

    // Generate recovery plan
    const recoveryPlan = this.generateRecoveryPlan(currentDebt, weeklyDebt);

    return {
      current: Math.round(currentDebt * 10) / 10,
      weekly: Math.round(weeklyDebt * 10) / 10,
      trend,
      recoveryPlan
    };
  }

  /**
   * Generate personalized sleep recommendations
   */
  async generateRecommendations(userId: string): Promise<SleepRecommendation[]> {
    const pattern = await this.analyzeSleepPatterns(userId);
    const circadian = await this.analyzeCircadianRhythm(userId);
    const debt = await this.calculateSleepDebt(userId);
    const entries = await this.getEntriesInRange(subDays(new Date(), 30), new Date(), userId);

    const recommendations: SleepRecommendation[] = [];

    // Sleep debt recommendations
    if (debt.current > this.SLEEP_DEBT_THRESHOLD) {
      recommendations.push({
        category: 'schedule',
        priority: 'high',
        title: 'Address Sleep Debt',
        description: `You have accumulated ${debt.current} hours of sleep debt. This can impact your mental health and cognitive function.`,
        actionItems: debt.recoveryPlan,
        expectedBenefit: 'Improved mood, energy, and cognitive performance'
      });
    }

    // Consistency recommendations
    if (pattern.consistency < 70) {
      recommendations.push({
        category: 'schedule',
        priority: 'high',
        title: 'Improve Sleep Schedule Consistency',
        description: 'Your sleep schedule varies significantly, which can disrupt your circadian rhythm.',
        actionItems: [
          'Set a consistent bedtime and wake time, even on weekends',
          'Use bedtime reminders 30 minutes before sleep',
          'Create a wind-down routine starting 1 hour before bed'
        ],
        expectedBenefit: 'Better sleep quality and easier sleep onset'
      });
    }

    // Circadian alignment recommendations
    if (circadian.currentAlignment < 80) {
      recommendations.push({
        category: 'lifestyle',
        priority: 'medium',
        title: 'Optimize Circadian Rhythm',
        description: `Your sleep schedule could be better aligned with your natural ${circadian.chronotype} chronotype.`,
        actionItems: circadian.recommendations,
        expectedBenefit: 'More restorative sleep and improved daytime alertness'
      });
    }

    // Environmental recommendations
    const environmentalIssues = this.analyzeEnvironmentalFactors(entries);
    if (environmentalIssues.length > 0) {
      recommendations.push({
        category: 'environment',
        priority: 'medium',
        title: 'Optimize Sleep Environment',
        description: 'Your sleep environment could be improved for better sleep quality.',
        actionItems: environmentalIssues,
        expectedBenefit: 'Deeper, more restorative sleep'
      });
    }

    // Sleep hygiene recommendations
    const hygieneIssues = this.analyzeSleepHygiene(entries);
    if (hygieneIssues.length > 0) {
      recommendations.push({
        category: 'hygiene',
        priority: 'low',
        title: 'Improve Sleep Hygiene',
        description: 'Better sleep hygiene practices can enhance your sleep quality.',
        actionItems: hygieneIssues,
        expectedBenefit: 'Easier sleep onset and fewer nighttime awakenings'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Correlate sleep with mood data
   */
  async correlateSleepWithMood(userId: string, moodData: any[]): Promise<{
    correlation: number;
    insights: string[];
  }> {
    const sleepEntries = await this.getEntriesInRange(subDays(new Date(), 30), new Date(), userId);
    
    if (sleepEntries.length === 0 || moodData.length === 0) {
      return { correlation: 0, insights: ['Insufficient data for correlation analysis'] };
    }

    // Calculate correlation coefficient
    const correlation = this.calculateCorrelation(
      sleepEntries.map(e => e.quality),
      moodData.map(m => m.score)
    );

    // Generate insights
    const insights = this.generateSleepMoodInsights(correlation, sleepEntries, moodData);

    return { correlation, insights };
  }

  // Helper methods
  private calculateAverageTime(times: number[]): number {
    if (times.length === 0) return 0;
    
    // Handle times that cross midnight
    const adjusted = times.map(t => t < 12 ? t + 24 : t);
    const avg = adjusted.reduce((a, b) => a + b, 0) / adjusted.length;
    return avg >= 24 ? avg - 24 : avg;
  }

  private formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private calculateConsistency(bedtimes: number[], waketimes: number[]): number {
    // Calculate standard deviation and convert to consistency percentage
    const bedtimeStdDev = this.standardDeviation(bedtimes);
    const waketimeStdDev = this.standardDeviation(waketimes);
    const avgStdDev = (bedtimeStdDev + waketimeStdDev) / 2;
    
    // Convert to percentage (lower deviation = higher consistency)
    return Math.max(0, Math.min(100, 100 - (avgStdDev * 20)));
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private calculateQualityTrend(qualities: SleepQuality[]): 'improving' | 'stable' | 'declining' {
    if (qualities.length < 3) return 'stable';
    
    const recentAvg = qualities.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, qualities.slice(-7).length);
    const previousAvg = qualities.slice(-14, -7).reduce((a, b) => a + b, 0) / Math.min(7, qualities.slice(-14, -7).length);
    
    if (recentAvg > previousAvg + 0.5) return 'improving';
    if (recentAvg < previousAvg - 0.5) return 'declining';
    return 'stable';
  }

  private findCommonFactors(entries: SleepEntry[]): string[] {
    const factorCounts = new Map<string, number>();
    
    entries.forEach(entry => {
      entry.factors.filter(f => f.present && f.impact === 'negative').forEach(f => {
        factorCounts.set(f.factor, (factorCounts.get(f.factor) || 0) + 1);
      });
    });

    // Return factors present in more than 30% of entries
    const threshold = entries.length * 0.3;
    return Array.from(factorCounts.entries())
      .filter(([_, count]) => count > threshold)
      .map(([factor, _]) => factor)
      .slice(0, 5);
  }

  private calculateOptimalTimes(
    chronotype: CircadianProfile['chronotype'],
    entries: SleepEntry[]
  ): { optimalBedtime: string; optimalWakeTime: string } {
    // Base recommendations by chronotype
    const baseRecommendations = {
      early_bird: { bedtime: '22:00', wakeTime: '06:00' },
      intermediate: { bedtime: '23:00', wakeTime: '07:00' },
      night_owl: { bedtime: '00:00', wakeTime: '08:00' }
    };

    // Adjust based on best quality sleep entries
    const bestEntries = entries
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 5);

    if (bestEntries.length > 0) {
      const avgBestBedtime = this.calculateAverageTime(
        bestEntries.map(e => new Date(e.bedtime).getHours() + new Date(e.bedtime).getMinutes() / 60)
      );
      const avgBestWakeTime = this.calculateAverageTime(
        bestEntries.map(e => new Date(e.wakeTime).getHours() + new Date(e.wakeTime).getMinutes() / 60)
      );

      return {
        optimalBedtime: this.formatTime(avgBestBedtime),
        optimalWakeTime: this.formatTime(avgBestWakeTime)
      };
    }

    return baseRecommendations[chronotype];
  }

  private calculateCircadianAlignment(
    pattern: SleepPattern,
    optimalBedtime: string,
    optimalWakeTime: string
  ): number {
    const currentBed = parseInt(pattern.averageBedtime.split(':')[0]) + parseInt(pattern.averageBedtime.split(':')[1]) / 60;
    const optimalBed = parseInt(optimalBedtime.split(':')[0]) + parseInt(optimalBedtime.split(':')[1]) / 60;
    
    const currentWake = parseInt(pattern.averageWakeTime.split(':')[0]) + parseInt(pattern.averageWakeTime.split(':')[1]) / 60;
    const optimalWake = parseInt(optimalWakeTime.split(':')[0]) + parseInt(optimalWakeTime.split(':')[1]) / 60;

    const bedDiff = Math.abs(currentBed - optimalBed);
    const wakeDiff = Math.abs(currentWake - optimalWake);
    
    const avgDiff = (bedDiff + wakeDiff) / 2;
    
    // Convert difference to alignment percentage
    return Math.max(0, Math.min(100, 100 - (avgDiff * 25)));
  }

  private generateCircadianRecommendations(
    chronotype: CircadianProfile['chronotype'],
    alignment: number,
    pattern: SleepPattern
  ): string[] {
    const recommendations: string[] = [];

    if (alignment < 80) {
      recommendations.push('Gradually shift your sleep schedule by 15 minutes every 2-3 days');
    }

    if (chronotype === 'night_owl') {
      recommendations.push('Get bright light exposure in the morning');
      recommendations.push('Dim lights 2 hours before desired bedtime');
    } else if (chronotype === 'early_bird') {
      recommendations.push('Avoid bright light in the evening');
      recommendations.push('Consider blackout curtains for summer months');
    }

    if (pattern.consistency < 70) {
      recommendations.push('Maintain consistent sleep times even on weekends');
    }

    recommendations.push('Avoid caffeine 6 hours before bedtime');
    recommendations.push('Limit screen time 1 hour before sleep');

    return recommendations;
  }

  private calculateDebtTrend(entries: SleepEntry[]): 'increasing' | 'stable' | 'decreasing' {
    if (entries.length < 7) return 'stable';

    const recentWeek = entries.slice(-7);
    const previousWeek = entries.slice(-14, -7);

    const recentAvg = recentWeek.reduce((sum, e) => sum + (e.actualSleepTime || 0), 0) / recentWeek.length;
    const previousAvg = previousWeek.length > 0 
      ? previousWeek.reduce((sum, e) => sum + (e.actualSleepTime || 0), 0) / previousWeek.length
      : recentAvg;

    if (recentAvg < previousAvg - 30) return 'increasing'; // 30 minutes less sleep
    if (recentAvg > previousAvg + 30) return 'decreasing';
    return 'stable';
  }

  private generateRecoveryPlan(currentDebt: number, weeklyDebt: number): string[] {
    const plan: string[] = [];

    if (currentDebt > 20) {
      plan.push('Consider taking strategic naps (20-30 minutes) in early afternoon');
      plan.push('Go to bed 30 minutes earlier for the next week');
    } else if (currentDebt > 10) {
      plan.push('Go to bed 15-20 minutes earlier each night');
    }

    if (weeklyDebt > 7) {
      plan.push('Allow yourself to sleep in on one weekend day (but not more than 2 hours)');
    }

    plan.push('Prioritize sleep over non-essential evening activities');
    plan.push('Set a bedtime alarm to remind you to start winding down');
    
    if (currentDebt > 30) {
      plan.push('Consider consulting with a sleep specialist');
    }

    return plan;
  }

  private analyzeEnvironmentalFactors(entries: SleepEntry[]): string[] {
    const issues: string[] = [];
    
    const tempIssues = entries.filter(e => 
      e.environment.temperature === 'too_cold' || 
      e.environment.temperature === 'too_warm'
    );
    
    if (tempIssues.length > entries.length * 0.3) {
      issues.push('Maintain bedroom temperature between 60-67°F (15-19°C)');
    }

    const noiseIssues = entries.filter(e => 
      e.environment.noise === 'noisy' || 
      e.environment.noise === 'very_noisy'
    );
    
    if (noiseIssues.length > entries.length * 0.3) {
      issues.push('Consider using white noise or earplugs');
      issues.push('Address sources of noise disruption');
    }

    const lightIssues = entries.filter(e => 
      e.environment.light === 'bright' || 
      e.environment.light === 'very_bright'
    );
    
    if (lightIssues.length > entries.length * 0.3) {
      issues.push('Use blackout curtains or eye mask');
      issues.push('Remove or cover LED lights from electronics');
    }

    return issues;
  }

  private analyzeSleepHygiene(entries: SleepEntry[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze common negative factors
    const factorMap = new Map<string, number>();
    entries.forEach(entry => {
      entry.factors.filter(f => f.present && f.impact === 'negative').forEach(f => {
        factorMap.set(f.factor, (factorMap.get(f.factor) || 0) + 1);
      });
    });

    factorMap.forEach((count, factor) => {
      if (count > entries.length * 0.3) {
        switch (factor.toLowerCase()) {
          case 'caffeine':
            recommendations.push('Limit caffeine intake after 2 PM');
            break;
          case 'alcohol':
            recommendations.push('Avoid alcohol 3 hours before bedtime');
            break;
          case 'heavy meal':
            recommendations.push('Finish eating 2-3 hours before bed');
            break;
          case 'screen time':
            recommendations.push('Use blue light filters on devices after sunset');
            break;
          case 'stress':
            recommendations.push('Practice relaxation techniques before bed');
            break;
        }
      }
    });

    return recommendations;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  }

  private generateSleepMoodInsights(
    correlation: number,
    sleepEntries: SleepEntry[],
    moodData: any[]
  ): string[] {
    const insights: string[] = [];

    if (Math.abs(correlation) > 0.7) {
      insights.push(`Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between sleep quality and mood`);
      
      if (correlation > 0) {
        insights.push('Better sleep quality is associated with improved mood');
        insights.push('Prioritizing sleep may help stabilize your emotional wellbeing');
      } else {
        insights.push('Your mood patterns may be affecting your sleep quality');
        insights.push('Consider addressing stress or anxiety that might be impacting sleep');
      }
    } else if (Math.abs(correlation) > 0.4) {
      insights.push(`Moderate correlation between sleep and mood detected`);
      insights.push('Sleep is one of several factors influencing your mood');
    } else {
      insights.push('Sleep and mood appear to be independently variable');
      insights.push('Consider other factors that might be affecting your wellbeing');
    }

    // Analyze specific patterns
    const poorSleepDays = sleepEntries.filter(e => e.quality <= 2);
    if (poorSleepDays.length > sleepEntries.length * 0.3) {
      insights.push('Frequent poor sleep quality detected - consider sleep hygiene improvements');
    }

    return insights;
  }

  private analyzeAndNotify(entry: SleepEntry): void {
    // Check for concerning patterns
    if (entry.quality <= 2) {
      this.notifyPoorSleep(entry);
    }

    if (entry.dreams?.some(d => d.emotion === 'nightmare')) {
      this.notifyNightmares(entry);
    }

    // Check sleep duration
    const duration = (entry.actualSleepTime || 0) / 60;
    if (duration < 6) {
      this.notifyInsufficientSleep(entry, duration);
    }
  }

  private notifyPoorSleep(entry: SleepEntry): void {
    console.log('Poor sleep quality detected. Consider reviewing sleep hygiene practices.');
  }

  private notifyNightmares(entry: SleepEntry): void {
    console.log('Nightmares detected. This may be related to stress or anxiety.');
  }

  private notifyInsufficientSleep(entry: SleepEntry, duration: number): void {
    console.log(`Only ${duration.toFixed(1)} hours of sleep. Aim for 7-9 hours for optimal health.`);
  }

  private getDefaultPattern(): SleepPattern {
    return {
      averageBedtime: '23:00',
      averageWakeTime: '07:00',
      averageDuration: 8,
      consistency: 0,
      qualityTrend: 'stable',
      commonFactors: []
    };
  }

  private generateId(): string {
    return `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveEntries(entries: SleepEntry[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
  }

  /**
   * Update an existing sleep entry
   */
  async updateEntry(id: string, updates: Partial<SleepEntry>): Promise<SleepEntry | null> {
    const entries = await this.getAllEntries();
    const index = entries.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date()
    };
    
    await this.saveEntries(entries);
    return entries[index];
  }

  /**
   * Delete a sleep entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    const entries = await this.getAllEntries();
    const filtered = entries.filter(e => e.id !== id);
    
    if (filtered.length === entries.length) return false;
    
    await this.saveEntries(filtered);
    return true;
  }

  /**
   * Export sleep data for backup or analysis
   */
  async exportData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const entries = await this.getAllEntries(userId);
    
    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }
    
    // CSV format
    const headers = ['Date', 'Bedtime', 'Wake Time', 'Duration (hours)', 'Quality', 'Notes'];
    const rows = entries.map(e => [
      format(new Date(e.date), 'yyyy-MM-dd'),
      format(new Date(e.bedtime), 'HH:mm'),
      format(new Date(e.wakeTime), 'HH:mm'),
      ((e.actualSleepTime || 0) / 60).toFixed(1),
      e.quality.toString(),
      e.notes || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export const sleepTrackingService = new SleepTrackingService();