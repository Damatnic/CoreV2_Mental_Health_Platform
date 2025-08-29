/**
 * Insights Engine Service
 * Provides AI-powered pattern recognition, predictive analytics, and personalized recommendations
 * for mental health wellness tracking and improvement
 */

interface MoodEntry {
  id: string;
  mood: number; // 1-10 scale
  timestamp: Date;
  notes?: string;
  triggers?: string[];
  activities?: string[];
  copingStrategies?: string[];
}

interface Pattern {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  trend: 'improving' | 'stable' | 'declining';
  dominantMood?: string;
  stability: number; // 0-100
  confidence: number; // 0-100
  insight: string;
  timeRange: {
    start: Date;
    end: Date;
  };
}

interface Trigger {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'physical' | 'emotional' | 'cognitive';
  frequency: number;
  impact: number; // 1-5 scale
  correlationStrength: number; // 0-1
  managementStrategies: string[];
  lastOccurrence: Date;
}

interface CopingStrategy {
  id: string;
  name: string;
  category: 'mindfulness' | 'physical' | 'social' | 'creative' | 'cognitive' | 'professional';
  effectiveness: number; // 0-100
  timesUsed: number;
  averageDuration: number; // minutes
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  conditions: string[]; // When it works best
}

interface Goal {
  id: string;
  title: string;
  category: 'mood' | 'activity' | 'social' | 'sleep' | 'exercise' | 'mindfulness';
  progress: number; // 0-100
  deadline?: Date;
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  trend: 'on-track' | 'ahead' | 'behind';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'mood' | 'coping' | 'activity' | 'social' | 'professional';
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  evidence: string[];
  action?: string;
  expectedOutcome: string;
  timeToImplement: number; // minutes
}

interface RiskAssessment {
  level: 'low' | 'moderate' | 'high' | 'critical';
  factors: {
    name: string;
    weight: number;
    present: boolean;
  }[];
  recommendations: string[];
  requiresImmediate: boolean;
  lastAssessed: Date;
}

interface ProgressMetric {
  moodStability: number; // 0-100
  copingEffectiveness: number; // 0-100
  goalProgress: number; // 0-100
  triggerManagement: number; // 0-100
  overallWellness: number; // 0-100
  weeklyChange: number; // percentage
  monthlyChange: number; // percentage
}

class InsightsEngine {
  private moodHistory: MoodEntry[] = [];
  private userPreferences: Map<string, any> = new Map();
  private cachedInsights: Map<string, any> = new Map();
  private lastAnalysis: Date | null = null;

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    // Initialize machine learning models and pattern recognition
    // In production, this would load trained models
    console.log('Insights Engine initialized');
  }

  /**
   * Analyze mood patterns using statistical analysis and pattern recognition
   */
  public analyzeMoodPatterns(
    entries: MoodEntry[], 
    timeRange: 'week' | 'month' | 'quarter' = 'month'
  ): Pattern[] {
    const patterns: Pattern[] = [];
    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);
    
    // Filter entries within time range
    const relevantEntries = entries.filter(e => 
      new Date(e.timestamp) >= startDate && new Date(e.timestamp) <= now
    );

    if (relevantEntries.length < 3) {
      return patterns;
    }

    // Calculate overall trend
    const trend = this.calculateTrend(relevantEntries);
    
    // Find dominant mood
    const dominantMood = this.findDominantMood(relevantEntries);
    
    // Calculate stability (lower variance = higher stability)
    const stability = this.calculateStability(relevantEntries);
    
    // Detect daily patterns (e.g., morning low, evening high)
    const dailyPattern = this.detectDailyPattern(relevantEntries);
    if (dailyPattern) {
      patterns.push(dailyPattern);
    }
    
    // Detect weekly patterns (e.g., Monday blues, weekend highs)
    const weeklyPattern = this.detectWeeklyPattern(relevantEntries);
    if (weeklyPattern) {
      patterns.push(weeklyPattern);
    }
    
    // Main pattern summary
    patterns.push({
      id: `pattern-${Date.now()}`,
      type: timeRange === 'week' ? 'weekly' : 'monthly',
      trend,
      dominantMood,
      stability,
      confidence: this.calculateConfidence(relevantEntries.length),
      insight: this.generatePatternInsight(trend, dominantMood, stability),
      timeRange: {
        start: startDate,
        end: now
      }
    });

    return patterns;
  }

  /**
   * Identify triggers and their impact on mood
   */
  public identifyTriggers(entries: MoodEntry[]): Trigger[] {
    const triggerMap = new Map<string, {
      count: number;
      totalImpact: number;
      occurrences: Date[];
      associatedMoods: number[];
    }>();

    // Analyze each entry for triggers
    entries.forEach(entry => {
      if (entry.triggers && entry.triggers.length > 0) {
        entry.triggers.forEach(trigger => {
          const existing = triggerMap.get(trigger) || {
            count: 0,
            totalImpact: 0,
            occurrences: [],
            associatedMoods: []
          };
          
          existing.count++;
          existing.totalImpact += (5 - entry.mood); // Lower mood = higher impact
          existing.occurrences.push(new Date(entry.timestamp));
          existing.associatedMoods.push(entry.mood);
          
          triggerMap.set(trigger, existing);
        });
      }
    });

    // Convert to Trigger objects with analysis
    const triggers: Trigger[] = [];
    triggerMap.forEach((data, name) => {
      const avgImpact = data.totalImpact / data.count;
      const category = this.categorizeTrigger(name);
      const correlation = this.calculateTriggerCorrelation(data.associatedMoods, entries);
      
      triggers.push({
        id: `trigger-${name.replace(/\s+/g, '-')}`,
        name,
        category,
        frequency: data.count,
        impact: Math.min(5, Math.max(1, Math.round(avgImpact))),
        correlationStrength: correlation,
        managementStrategies: this.suggestTriggerManagement(name, category, avgImpact),
        lastOccurrence: data.occurrences[data.occurrences.length - 1]
      });
    });

    // Sort by impact and frequency
    return triggers.sort((a, b) => 
      (b.impact * b.frequency) - (a.impact * a.frequency)
    );
  }

  /**
   * Analyze effectiveness of coping strategies
   */
  public analyzeCopingStrategies(entries: MoodEntry[]): CopingStrategy[] {
    const strategyMap = new Map<string, {
      uses: number;
      moodImprovements: number[];
      timesOfDay: string[];
      durations: number[];
    }>();

    // Analyze strategy effectiveness
    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];
      
      if (current.copingStrategies && current.copingStrategies.length > 0) {
        const moodImprovement = current.mood - previous.mood;
        
        current.copingStrategies.forEach(strategy => {
          const existing = strategyMap.get(strategy) || {
            uses: 0,
            moodImprovements: [],
            timesOfDay: [],
            durations: []
          };
          
          existing.uses++;
          existing.moodImprovements.push(moodImprovement);
          existing.timesOfDay.push(this.getTimeOfDay(new Date(current.timestamp)));
          existing.durations.push(this.estimateDuration(strategy));
          
          strategyMap.set(strategy, existing);
        });
      }
    }

    // Convert to CopingStrategy objects
    const strategies: CopingStrategy[] = [];
    strategyMap.forEach((data, name) => {
      const avgImprovement = data.moodImprovements.reduce((a, b) => a + b, 0) / data.uses;
      const effectiveness = Math.min(100, Math.max(0, 50 + (avgImprovement * 20)));
      
      strategies.push({
        id: `strategy-${name.replace(/\s+/g, '-')}`,
        name,
        category: this.categorizeStrategy(name),
        effectiveness: Math.round(effectiveness),
        timesUsed: data.uses,
        averageDuration: Math.round(data.durations.reduce((a, b) => a + b, 0) / data.uses),
        bestTimeOfDay: this.findMostCommon(data.timesOfDay) as any,
        conditions: this.identifyOptimalConditions(name, data.moodImprovements)
      });
    });

    // Sort by effectiveness
    return strategies.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Calculate progress towards goals
   */
  public calculateGoalProgress(
    goals: Goal[], 
    entries: MoodEntry[], 
    activities: any[]
  ): Goal[] {
    return goals.map(goal => {
      let progress = 0;
      const trend = this.determineGoalTrend(goal, entries, activities);
      
      // Calculate progress based on goal type
      switch (goal.category) {
        case 'mood':
          progress = this.calculateMoodGoalProgress(goal, entries);
          break;
        case 'activity':
          progress = this.calculateActivityGoalProgress(goal, activities);
          break;
        case 'sleep':
        case 'exercise':
        case 'mindfulness':
          progress = this.calculateHabitGoalProgress(goal, activities);
          break;
        default:
          progress = this.calculateGenericGoalProgress(goal);
      }
      
      return {
        ...goal,
        progress: Math.min(100, Math.max(0, Math.round(progress))),
        trend
      };
    });
  }

  /**
   * Generate personalized recommendations
   */
  public generateRecommendations(
    patterns: Pattern[],
    triggers: Trigger[],
    strategies: CopingStrategy[],
    goals: Goal[],
    riskLevel: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // High priority recommendations based on risk level
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push(this.createCrisisRecommendation());
    }
    
    // Pattern-based recommendations
    patterns.forEach(pattern => {
      if (pattern.trend === 'declining') {
        recommendations.push(this.createPatternRecommendation(pattern));
      }
    });
    
    // Trigger management recommendations
    const highImpactTriggers = triggers.filter(t => t.impact >= 4);
    highImpactTriggers.forEach(trigger => {
      recommendations.push(this.createTriggerRecommendation(trigger));
    });
    
    // Coping strategy optimization
    const underutilizedStrategies = strategies.filter(s => 
      s.effectiveness > 70 && s.timesUsed < 5
    );
    underutilizedStrategies.forEach(strategy => {
      recommendations.push(this.createStrategyRecommendation(strategy));
    });
    
    // Goal-based recommendations
    const strugglingGoals = goals.filter(g => 
      g.trend === 'behind' && g.progress < 50
    );
    strugglingGoals.forEach(goal => {
      recommendations.push(this.createGoalRecommendation(goal));
    });
    
    // Add general wellness recommendations
    recommendations.push(...this.createWellnessRecommendations(patterns, strategies));
    
    // Sort by priority and confidence
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Perform risk assessment based on multiple factors
   */
  public assessRisk(
    patterns: Pattern[],
    triggers: Trigger[],
    entries: MoodEntry[]
  ): RiskAssessment {
    const factors = [
      {
        name: 'Declining mood trend',
        weight: 0.3,
        present: patterns.some(p => p.trend === 'declining')
      },
      {
        name: 'Low mood persistence',
        weight: 0.25,
        present: this.hasLowMoodPersistence(entries)
      },
      {
        name: 'High-impact triggers',
        weight: 0.2,
        present: triggers.some(t => t.impact >= 4 && t.frequency > 3)
      },
      {
        name: 'Reduced coping',
        weight: 0.15,
        present: this.hasReducedCoping(entries)
      },
      {
        name: 'Isolation indicators',
        weight: 0.1,
        present: this.hasIsolationIndicators(entries)
      }
    ];
    
    // Calculate risk score
    const riskScore = factors.reduce((score, factor) => 
      score + (factor.present ? factor.weight : 0), 0
    );
    
    // Determine risk level
    let level: RiskAssessment['level'];
    if (riskScore >= 0.7) level = 'critical';
    else if (riskScore >= 0.5) level = 'high';
    else if (riskScore >= 0.3) level = 'moderate';
    else level = 'low';
    
    return {
      level,
      factors,
      recommendations: this.getRiskRecommendations(level, factors),
      requiresImmediate: level === 'critical' || level === 'high',
      lastAssessed: new Date()
    };
  }

  /**
   * Calculate overall progress metrics
   */
  public calculateProgressMetrics(
    patterns: Pattern[],
    triggers: Trigger[],
    strategies: CopingStrategy[],
    goals: Goal[]
  ): ProgressMetric {
    // Calculate mood stability from patterns
    const moodStability = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.stability, 0) / patterns.length
      : 50;
    
    // Calculate coping effectiveness
    const copingEffectiveness = strategies.length > 0
      ? strategies.reduce((sum, s) => sum + s.effectiveness, 0) / strategies.length
      : 50;
    
    // Calculate goal progress
    const goalProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
      : 50;
    
    // Calculate trigger management (inverse of trigger impact)
    const avgTriggerImpact = triggers.length > 0
      ? triggers.reduce((sum, t) => sum + t.impact, 0) / triggers.length
      : 2.5;
    const triggerManagement = 100 - (avgTriggerImpact * 20);
    
    // Calculate overall wellness
    const overallWellness = (
      moodStability * 0.3 +
      copingEffectiveness * 0.25 +
      goalProgress * 0.25 +
      triggerManagement * 0.2
    );
    
    // Calculate changes (mock data for now)
    const weeklyChange = this.calculateWeeklyChange(patterns);
    const monthlyChange = this.calculateMonthlyChange(patterns);
    
    return {
      moodStability: Math.round(moodStability),
      copingEffectiveness: Math.round(copingEffectiveness),
      goalProgress: Math.round(goalProgress),
      triggerManagement: Math.round(triggerManagement),
      overallWellness: Math.round(overallWellness),
      weeklyChange,
      monthlyChange
    };
  }

  // Helper methods
  private getStartDate(now: Date, timeRange: 'week' | 'month' | 'quarter'): Date {
    const date = new Date(now);
    switch (timeRange) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
    }
    return date;
  }

  private calculateTrend(entries: MoodEntry[]): 'improving' | 'stable' | 'declining' {
    if (entries.length < 2) return 'stable';
    
    // Simple linear regression
    const n = entries.length;
    const indices = entries.map((_, i) => i);
    const moods = entries.map(e => e.mood);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = moods.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * moods[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }

  private findDominantMood(entries: MoodEntry[]): string {
    const moodRanges = {
      'Very Low': [1, 2],
      'Low': [3, 4],
      'Neutral': [5, 6],
      'Good': [7, 8],
      'Excellent': [9, 10]
    };
    
    const moodCounts = new Map<string, number>();
    
    entries.forEach(entry => {
      for (const [label, range] of Object.entries(moodRanges)) {
        if (entry.mood >= range[0] && entry.mood <= range[1]) {
          moodCounts.set(label, (moodCounts.get(label) || 0) + 1);
          break;
        }
      }
    });
    
    let dominant = 'Neutral';
    let maxCount = 0;
    
    moodCounts.forEach((count, mood) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = mood;
      }
    });
    
    return dominant;
  }

  private calculateStability(entries: MoodEntry[]): number {
    if (entries.length < 2) return 50;
    
    const moods = entries.map(e => e.mood);
    const mean = moods.reduce((a, b) => a + b, 0) / moods.length;
    const variance = moods.reduce((sum, mood) => 
      sum + Math.pow(mood - mean, 2), 0
    ) / moods.length;
    
    // Convert variance to stability score (lower variance = higher stability)
    const maxVariance = 25; // Maximum possible variance for 1-10 scale
    const stability = 100 - (variance / maxVariance * 100);
    
    return Math.max(0, Math.min(100, stability));
  }

  private calculateConfidence(sampleSize: number): number {
    // Simple confidence calculation based on sample size
    const minSamples = 3;
    const idealSamples = 30;
    
    if (sampleSize < minSamples) return 0;
    if (sampleSize >= idealSamples) return 95;
    
    return Math.round(50 + (sampleSize - minSamples) / (idealSamples - minSamples) * 45);
  }

  private generatePatternInsight(
    trend: string, 
    dominantMood: string, 
    stability: number
  ): string {
    const insights = [];
    
    if (trend === 'improving') {
      insights.push("Your mood is showing positive improvement");
    } else if (trend === 'declining') {
      insights.push("Your mood has been declining recently");
    }
    
    if (stability > 70) {
      insights.push("with consistent stability");
    } else if (stability < 30) {
      insights.push("with significant fluctuations");
    }
    
    if (dominantMood === 'Good' || dominantMood === 'Excellent') {
      insights.push("and generally positive feelings");
    } else if (dominantMood === 'Low' || dominantMood === 'Very Low') {
      insights.push("Consider reaching out for support");
    }
    
    return insights.join(" ") + ".";
  }

  private detectDailyPattern(entries: MoodEntry[]): Pattern | null {
    // Group entries by hour of day
    const hourlyMoods = new Map<number, number[]>();
    
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      const moods = hourlyMoods.get(hour) || [];
      moods.push(entry.mood);
      hourlyMoods.set(hour, moods);
    });
    
    // Find patterns in hourly moods
    let morningAvg = 0, afternoonAvg = 0, eveningAvg = 0;
    let morningCount = 0, afternoonCount = 0, eveningCount = 0;
    
    hourlyMoods.forEach((moods, hour) => {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      
      if (hour >= 6 && hour < 12) {
        morningAvg += avg;
        morningCount++;
      } else if (hour >= 12 && hour < 18) {
        afternoonAvg += avg;
        afternoonCount++;
      } else if (hour >= 18 && hour < 24) {
        eveningAvg += avg;
        eveningCount++;
      }
    });
    
    if (morningCount === 0 && afternoonCount === 0 && eveningCount === 0) {
      return null;
    }
    
    morningAvg = morningCount > 0 ? morningAvg / morningCount : 0;
    afternoonAvg = afternoonCount > 0 ? afternoonAvg / afternoonCount : 0;
    eveningAvg = eveningCount > 0 ? eveningAvg / eveningCount : 0;
    
    // Determine if there's a significant daily pattern
    const maxDiff = Math.max(
      Math.abs(morningAvg - afternoonAvg),
      Math.abs(afternoonAvg - eveningAvg),
      Math.abs(eveningAvg - morningAvg)
    );
    
    if (maxDiff < 1) return null;
    
    let insight = "Your mood tends to be ";
    if (morningAvg > afternoonAvg && morningAvg > eveningAvg) {
      insight += "highest in the morning";
    } else if (afternoonAvg > morningAvg && afternoonAvg > eveningAvg) {
      insight += "highest in the afternoon";
    } else {
      insight += "highest in the evening";
    }
    
    return {
      id: `daily-pattern-${Date.now()}`,
      type: 'daily',
      trend: 'stable',
      stability: 100 - (maxDiff * 10),
      confidence: 75,
      insight,
      timeRange: {
        start: new Date(entries[0].timestamp),
        end: new Date(entries[entries.length - 1].timestamp)
      }
    };
  }

  private detectWeeklyPattern(entries: MoodEntry[]): Pattern | null {
    // Group entries by day of week
    const dailyMoods = new Map<number, number[]>();
    
    entries.forEach(entry => {
      const day = new Date(entry.timestamp).getDay();
      const moods = dailyMoods.get(day) || [];
      moods.push(entry.mood);
      dailyMoods.set(day, moods);
    });
    
    if (dailyMoods.size < 3) return null;
    
    // Calculate average mood for each day
    const dayAverages = new Map<number, number>();
    dailyMoods.forEach((moods, day) => {
      dayAverages.set(day, moods.reduce((a, b) => a + b, 0) / moods.length);
    });
    
    // Find best and worst days
    let bestDay = 0, worstDay = 0;
    let bestMood = 0, worstMood = 10;
    
    dayAverages.forEach((avg, day) => {
      if (avg > bestMood) {
        bestMood = avg;
        bestDay = day;
      }
      if (avg < worstMood) {
        worstMood = avg;
        worstDay = day;
      }
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const insight = `${dayNames[bestDay]}s tend to be your best days, while ${dayNames[worstDay]}s are typically more challenging`;
    
    return {
      id: `weekly-pattern-${Date.now()}`,
      type: 'weekly',
      trend: 'stable',
      stability: 100 - ((bestMood - worstMood) * 10),
      confidence: 70,
      insight,
      timeRange: {
        start: new Date(entries[0].timestamp),
        end: new Date(entries[entries.length - 1].timestamp)
      }
    };
  }

  private categorizeTrigger(trigger: string): Trigger['category'] {
    const categories = {
      environmental: ['weather', 'noise', 'crowded', 'traffic', 'pollution'],
      social: ['conflict', 'isolation', 'rejection', 'criticism', 'comparison'],
      physical: ['pain', 'fatigue', 'illness', 'hunger', 'sleep'],
      emotional: ['anxiety', 'stress', 'sadness', 'anger', 'fear'],
      cognitive: ['overthinking', 'rumination', 'worry', 'confusion', 'indecision']
    };
    
    const lowerTrigger = trigger.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerTrigger.includes(keyword))) {
        return category as Trigger['category'];
      }
    }
    
    return 'emotional'; // Default category
  }

  private calculateTriggerCorrelation(
    associatedMoods: number[], 
    allEntries: MoodEntry[]
  ): number {
    if (associatedMoods.length === 0) return 0;
    
    const triggerAvg = associatedMoods.reduce((a, b) => a + b, 0) / associatedMoods.length;
    const overallAvg = allEntries.reduce((sum, e) => sum + e.mood, 0) / allEntries.length;
    
    const difference = Math.abs(overallAvg - triggerAvg);
    const maxDifference = 9; // Maximum possible difference on 1-10 scale
    
    return difference / maxDifference;
  }

  private suggestTriggerManagement(
    trigger: string, 
    category: Trigger['category'], 
    impact: number
  ): string[] {
    const strategies: string[] = [];
    
    // Category-specific strategies
    switch (category) {
      case 'environmental':
        strategies.push('Create a calm environment', 'Use noise-cancelling headphones', 'Find quiet spaces');
        break;
      case 'social':
        strategies.push('Set healthy boundaries', 'Practice assertive communication', 'Seek supportive relationships');
        break;
      case 'physical':
        strategies.push('Maintain regular sleep schedule', 'Stay hydrated', 'Exercise regularly');
        break;
      case 'emotional':
        strategies.push('Practice mindfulness', 'Use grounding techniques', 'Express emotions through journaling');
        break;
      case 'cognitive':
        strategies.push('Challenge negative thoughts', 'Practice thought-stopping', 'Use cognitive restructuring');
        break;
    }
    
    // Add general strategies for high-impact triggers
    if (impact >= 4) {
      strategies.push('Consider professional support', 'Develop a crisis plan');
    }
    
    return strategies.slice(0, 3);
  }

  private categorizeStrategy(strategy: string): CopingStrategy['category'] {
    const categories = {
      mindfulness: ['meditation', 'breathing', 'mindful', 'present', 'awareness'],
      physical: ['exercise', 'walk', 'run', 'yoga', 'sport'],
      social: ['talk', 'friend', 'family', 'support', 'connect'],
      creative: ['art', 'music', 'write', 'draw', 'create'],
      cognitive: ['reframe', 'challenge', 'problem-solve', 'plan', 'organize'],
      professional: ['therapy', 'counseling', 'medication', 'treatment']
    };
    
    const lowerStrategy = strategy.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerStrategy.includes(keyword))) {
        return category as CopingStrategy['category'];
      }
    }
    
    return 'mindfulness'; // Default category
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private estimateDuration(strategy: string): number {
    // Estimate typical duration based on strategy type
    const durations: { [key: string]: number } = {
      meditation: 15,
      breathing: 5,
      exercise: 30,
      walk: 20,
      journaling: 10,
      music: 15,
      social: 30,
      therapy: 60
    };
    
    const lowerStrategy = strategy.toLowerCase();
    
    for (const [key, duration] of Object.entries(durations)) {
      if (lowerStrategy.includes(key)) {
        return duration;
      }
    }
    
    return 15; // Default duration
  }

  private findMostCommon<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const counts = new Map<T, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    
    let maxCount = 0;
    let mostCommon: T | null = null;
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });
    
    return mostCommon;
  }

  private identifyOptimalConditions(
    strategy: string, 
    improvements: number[]
  ): string[] {
    const conditions: string[] = [];
    
    // Analyze when strategy works best
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    const positiveImprovements = improvements.filter(i => i > 0);
    
    if (positiveImprovements.length > improvements.length * 0.7) {
      conditions.push('Generally effective');
    }
    
    if (avgImprovement > 2) {
      conditions.push('Highly effective for mood boost');
    }
    
    // Add strategy-specific conditions
    if (strategy.toLowerCase().includes('exercise')) {
      conditions.push('Best in morning or afternoon');
    }
    
    if (strategy.toLowerCase().includes('meditation')) {
      conditions.push('Quiet environment needed');
    }
    
    return conditions;
  }

  private determineGoalTrend(
    goal: Goal, 
    entries: MoodEntry[], 
    activities: any[]
  ): 'on-track' | 'ahead' | 'behind' {
    if (!goal.deadline) return 'on-track';
    
    const now = new Date();
    const start = new Date(goal.deadline);
    start.setMonth(start.getMonth() - 1); // Assume 1-month goal period
    
    const totalDays = Math.ceil((goal.deadline.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = (daysElapsed / totalDays) * 100;
    
    if (goal.progress > expectedProgress + 10) return 'ahead';
    if (goal.progress < expectedProgress - 10) return 'behind';
    return 'on-track';
  }

  private calculateMoodGoalProgress(goal: Goal, entries: MoodEntry[]): number {
    // Calculate progress based on mood improvements
    const recentEntries = entries.slice(-7); // Last week
    if (recentEntries.length === 0) return 0;
    
    const avgMood = recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length;
    
    // Assume goal is to maintain mood above 6
    const targetMood = 6;
    return Math.min(100, (avgMood / targetMood) * 100);
  }

  private calculateActivityGoalProgress(goal: Goal, activities: any[]): number {
    // Mock implementation - would use actual activity data
    return Math.random() * 100;
  }

  private calculateHabitGoalProgress(goal: Goal, activities: any[]): number {
    // Mock implementation - would use actual habit tracking data
    return Math.random() * 100;
  }

  private calculateGenericGoalProgress(goal: Goal): number {
    // Use milestone completion if available
    if (goal.milestones && goal.milestones.length > 0) {
      const completed = goal.milestones.filter(m => m.completed).length;
      return (completed / goal.milestones.length) * 100;
    }
    
    return goal.progress || 0;
  }

  private createCrisisRecommendation(): Recommendation {
    return {
      id: `rec-crisis-${Date.now()}`,
      title: 'Immediate Support Available',
      description: 'Based on your recent patterns, professional support could be beneficial',
      category: 'professional',
      priority: 'high',
      confidence: 95,
      evidence: ['Persistent low mood', 'Multiple high-impact triggers'],
      action: 'Contact Crisis Helpline',
      expectedOutcome: 'Immediate emotional support and coping strategies',
      timeToImplement: 5
    };
  }

  private createPatternRecommendation(pattern: Pattern): Recommendation {
    return {
      id: `rec-pattern-${Date.now()}`,
      title: 'Address Mood Pattern',
      description: `Your ${pattern.type} mood pattern shows ${pattern.trend} trend`,
      category: 'mood',
      priority: pattern.trend === 'declining' ? 'high' : 'medium',
      confidence: pattern.confidence,
      evidence: [pattern.insight],
      action: 'View Detailed Analysis',
      expectedOutcome: 'Better understanding of mood triggers and patterns',
      timeToImplement: 10
    };
  }

  private createTriggerRecommendation(trigger: Trigger): Recommendation {
    return {
      id: `rec-trigger-${trigger.id}`,
      title: `Manage "${trigger.name}" Trigger`,
      description: `This trigger has appeared ${trigger.frequency} times with high impact`,
      category: 'coping',
      priority: trigger.impact >= 4 ? 'high' : 'medium',
      confidence: 85,
      evidence: [`Impact level: ${trigger.impact}/5`, `Frequency: ${trigger.frequency}`],
      action: 'Learn Management Techniques',
      expectedOutcome: 'Reduced trigger impact on mood',
      timeToImplement: 15
    };
  }

  private createStrategyRecommendation(strategy: CopingStrategy): Recommendation {
    return {
      id: `rec-strategy-${strategy.id}`,
      title: `Try "${strategy.name}" More Often`,
      description: `This strategy has ${strategy.effectiveness}% effectiveness but you've only used it ${strategy.timesUsed} times`,
      category: 'coping',
      priority: 'medium',
      confidence: strategy.effectiveness,
      evidence: [`${strategy.effectiveness}% effective`, `Best time: ${strategy.bestTimeOfDay}`],
      action: 'Set Reminder',
      expectedOutcome: 'Improved mood management',
      timeToImplement: strategy.averageDuration
    };
  }

  private createGoalRecommendation(goal: Goal): Recommendation {
    return {
      id: `rec-goal-${goal.id}`,
      title: `Refocus on "${goal.title}"`,
      description: `This goal is ${100 - goal.progress}% away from completion and trending ${goal.trend}`,
      category: 'activity',
      priority: goal.deadline && new Date(goal.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
      confidence: 75,
      evidence: [`Current progress: ${goal.progress}%`, `Trend: ${goal.trend}`],
      action: 'Adjust Goal Plan',
      expectedOutcome: 'Improved goal achievement rate',
      timeToImplement: 20
    };
  }

  private createWellnessRecommendations(
    patterns: Pattern[], 
    strategies: CopingStrategy[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Sleep recommendation if patterns show evening/night issues
    const eveningPattern = patterns.find(p => 
      p.insight.toLowerCase().includes('evening') || p.insight.toLowerCase().includes('night')
    );
    
    if (eveningPattern) {
      recommendations.push({
        id: `rec-sleep-${Date.now()}`,
        title: 'Improve Sleep Hygiene',
        description: 'Your mood patterns suggest sleep quality might be affecting your wellbeing',
        category: 'activity',
        priority: 'medium',
        confidence: 70,
        evidence: ['Evening mood variations detected'],
        action: 'Try Sleep Meditation',
        expectedOutcome: 'Better sleep quality and morning mood',
        timeToImplement: 30
      });
    }
    
    // Social connection recommendation if no social strategies
    const hasSocialStrategies = strategies.some(s => s.category === 'social');
    
    if (!hasSocialStrategies) {
      recommendations.push({
        id: `rec-social-${Date.now()}`,
        title: 'Strengthen Social Connections',
        description: 'Social support can significantly improve mental wellbeing',
        category: 'social',
        priority: 'low',
        confidence: 60,
        evidence: ['Limited social coping strategies detected'],
        action: 'Schedule Friend Activity',
        expectedOutcome: 'Increased social support and mood improvement',
        timeToImplement: 60
      });
    }
    
    return recommendations;
  }

  private hasLowMoodPersistence(entries: MoodEntry[]): boolean {
    const recentEntries = entries.slice(-7);
    const lowMoodCount = recentEntries.filter(e => e.mood <= 3).length;
    return lowMoodCount >= 4;
  }

  private hasReducedCoping(entries: MoodEntry[]): boolean {
    const recentEntries = entries.slice(-7);
    const withCoping = recentEntries.filter(e => 
      e.copingStrategies && e.copingStrategies.length > 0
    ).length;
    return withCoping < recentEntries.length * 0.3;
  }

  private hasIsolationIndicators(entries: MoodEntry[]): boolean {
    const recentEntries = entries.slice(-7);
    const isolationKeywords = ['alone', 'isolated', 'lonely', 'disconnected'];
    
    return recentEntries.some(entry => 
      entry.notes && isolationKeywords.some(keyword => 
        entry.notes!.toLowerCase().includes(keyword)
      )
    );
  }

  private getRiskRecommendations(
    level: RiskAssessment['level'], 
    factors: RiskAssessment['factors']
  ): string[] {
    const recommendations: string[] = [];
    
    switch (level) {
      case 'critical':
        recommendations.push(
          'Immediate professional support recommended',
          'Contact crisis helpline: 988',
          'Reach out to trusted friend or family member'
        );
        break;
      case 'high':
        recommendations.push(
          'Consider scheduling therapy appointment',
          'Increase use of coping strategies',
          'Daily mood monitoring recommended'
        );
        break;
      case 'moderate':
        recommendations.push(
          'Maintain regular self-care routine',
          'Practice preventive coping strategies',
          'Monitor for changes in mood patterns'
        );
        break;
      case 'low':
        recommendations.push(
          'Continue current wellness practices',
          'Focus on maintaining positive patterns',
          'Celebrate your progress'
        );
        break;
    }
    
    // Add factor-specific recommendations
    factors.forEach(factor => {
      if (factor.present && factor.weight >= 0.2) {
        switch (factor.name) {
          case 'Declining mood trend':
            recommendations.push('Identify and address recent stressors');
            break;
          case 'High-impact triggers':
            recommendations.push('Develop trigger management plan');
            break;
          case 'Reduced coping':
            recommendations.push('Re-engage with effective coping strategies');
            break;
        }
      }
    });
    
    return recommendations;
  }

  private calculateWeeklyChange(patterns: Pattern[]): number {
    // Mock implementation - would compare week-over-week data
    const recentPattern = patterns.find(p => p.type === 'weekly');
    if (!recentPattern) return 0;
    
    if (recentPattern.trend === 'improving') return Math.random() * 10 + 5;
    if (recentPattern.trend === 'declining') return -(Math.random() * 10 + 5);
    return Math.random() * 5 - 2.5;
  }

  private calculateMonthlyChange(patterns: Pattern[]): number {
    // Mock implementation - would compare month-over-month data
    const recentPattern = patterns.find(p => p.type === 'monthly');
    if (!recentPattern) return 0;
    
    if (recentPattern.trend === 'improving') return Math.random() * 15 + 10;
    if (recentPattern.trend === 'declining') return -(Math.random() * 15 + 10);
    return Math.random() * 10 - 5;
  }
}

// Export singleton instance
export const insightsEngine = new InsightsEngine();

// Export types for use in components
export type {
  MoodEntry,
  Pattern,
  Trigger,
  CopingStrategy,
  Goal,
  Recommendation,
  RiskAssessment,
  ProgressMetric
};