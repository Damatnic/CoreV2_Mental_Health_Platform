import { describe, it, expect, jest } from '@jest/globals';

interface MoodEntry {
  id: string;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  notes?: string;
  timestamp: Date;
}

interface MoodTrend {
  period: '7d' | '30d' | '90d';
  averageMood: number;
  trend: 'improving' | 'declining' | 'stable';
  volatility: number;
}

interface MoodPattern {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  averageMood: number;
  frequency: number;
}

class MoodAnalysisService {
  private moodEntries: MoodEntry[] = [];

  addMoodEntry(entry: Omit<MoodEntry, 'id' | 'timestamp'>): MoodEntry {
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...entry
    };
    
    this.moodEntries.push(newEntry);
    return newEntry;
  }

  getMoodEntries(limit?: number): MoodEntry[] {
    const sorted = [...this.moodEntries].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  calculateTrend(period: '7d' | '30d' | '90d'): MoodTrend {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentEntries = this.moodEntries.filter(
      entry => entry.timestamp >= cutoffDate
    );
    
    if (recentEntries.length === 0) {
      return {
        period,
        averageMood: 0,
        trend: 'stable',
        volatility: 0
      };
    }
    
    const averageMood = recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length;
    
    // Calculate trend by comparing first half with second half
    const midpoint = Math.floor(recentEntries.length / 2);
    const firstHalf = recentEntries.slice(0, midpoint);
    const secondHalf = recentEntries.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.mood, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.mood, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable';
    const difference = secondHalfAvg - firstHalfAvg;
    
    if (difference > 0.5) trend = 'improving';
    else if (difference < -0.5) trend = 'declining';
    else trend = 'stable';
    
    // Calculate volatility (standard deviation)
    const variance = recentEntries.reduce((sum, entry) => {
      return sum + Math.pow(entry.mood - averageMood, 2);
    }, 0) / recentEntries.length;
    
    const volatility = Math.sqrt(variance);
    
    return {
      period,
      averageMood: Math.round(averageMood * 10) / 10,
      trend,
      volatility: Math.round(volatility * 10) / 10
    };
  }

  findPatterns(): MoodPattern[] {
    const patterns: Record<string, { totalMood: number; count: number }> = {
      morning: { totalMood: 0, count: 0 },
      afternoon: { totalMood: 0, count: 0 },
      evening: { totalMood: 0, count: 0 }
    };
    
    this.moodEntries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening';
      
      if (hour < 12) timeOfDay = 'morning';
      else if (hour < 18) timeOfDay = 'afternoon';
      else timeOfDay = 'evening';
      
      patterns[timeOfDay].totalMood += entry.mood;
      patterns[timeOfDay].count++;
    });
    
    return Object.entries(patterns).map(([timeOfDay, data]) => ({
      timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening',
      averageMood: data.count > 0 ? Math.round((data.totalMood / data.count) * 10) / 10 : 0,
      frequency: data.count
    }));
  }

  detectAnomalies(threshold: number = 2): MoodEntry[] {
    if (this.moodEntries.length < 5) return [];
    
    const overallAverage = this.moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / this.moodEntries.length;
    
    return this.moodEntries.filter(entry => {
      const deviation = Math.abs(entry.mood - overallAverage);
      return deviation > threshold;
    });
  }

  getMoodInsights(): {
    bestDay?: string;
    worstDay?: string;
    mostCommonMood: number;
    streakCount: number;
  } {
    if (this.moodEntries.length === 0) {
      return { mostCommonMood: 5, streakCount: 0 };
    }
    
    // Find best and worst days
    const sortedByMood = [...this.moodEntries].sort((a, b) => b.mood - a.mood);
    const best = sortedByMood[0];
    const worst = sortedByMood[sortedByMood.length - 1];
    
    // Find most common mood (rounded)
    const moodCounts: Record<number, number> = {};
    this.moodEntries.forEach(entry => {
      const roundedMood = Math.round(entry.mood);
      moodCounts[roundedMood] = (moodCounts[roundedMood] || 0) + 1;
    });
    
    const mostCommonMood = parseInt(Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0][0]);
    
    // Calculate current streak (consecutive days with mood >= 6)
    const recentEntries = this.getMoodEntries().slice(0, 10);
    let streakCount = 0;
    
    for (const entry of recentEntries) {
      if (entry.mood >= 6) {
        streakCount++;
      } else {
        break;
      }
    }
    
    return {
      bestDay: best ? best.timestamp.toDateString() : undefined,
      worstDay: worst ? worst.timestamp.toDateString() : undefined,
      mostCommonMood,
      streakCount
    };
  }

  exportData(): MoodEntry[] {
    return [...this.moodEntries];
  }

  clearData(): void {
    this.moodEntries = [];
  }
}

describe('MoodAnalysisService', () => {
  let service: MoodAnalysisService;

  beforeEach(() => {
    service = new MoodAnalysisService();
  });

  it('should add mood entry', () => {
    const entry = service.addMoodEntry({
      mood: 7,
      energy: 8,
      anxiety: 3,
      notes: 'Feeling good today'
    });

    expect(entry.id).toBeDefined();
    expect(entry.mood).toBe(7);
    expect(entry.timestamp).toBeDefined();
  });

  it('should get mood entries', () => {
    service.addMoodEntry({ mood: 6, energy: 7, anxiety: 4 });
    service.addMoodEntry({ mood: 8, energy: 9, anxiety: 2 });

    const entries = service.getMoodEntries();
    expect(entries).toHaveLength(2);
    
    const limited = service.getMoodEntries(1);
    expect(limited).toHaveLength(1);
  });

  it('should calculate mood trend', () => {
    // Add entries with improving trend
    service.addMoodEntry({ mood: 5, energy: 5, anxiety: 5 });
    service.addMoodEntry({ mood: 6, energy: 6, anxiety: 4 });
    service.addMoodEntry({ mood: 7, energy: 7, anxiety: 3 });
    service.addMoodEntry({ mood: 8, energy: 8, anxiety: 2 });

    const trend = service.calculateTrend('7d');
    
    expect(trend.period).toBe('7d');
    expect(trend.averageMood).toBeGreaterThan(5);
    expect(trend.trend).toBe('improving');
    expect(trend.volatility).toBeGreaterThan(0);
  });

  it('should find mood patterns', () => {
    // Mock timestamps for different times of day
    const morningEntry = service.addMoodEntry({ mood: 6, energy: 7, anxiety: 4 });
    morningEntry.timestamp = new Date('2024-01-01T08:00:00');
    
    const afternoonEntry = service.addMoodEntry({ mood: 8, energy: 8, anxiety: 3 });
    afternoonEntry.timestamp = new Date('2024-01-01T14:00:00');
    
    const eveningEntry = service.addMoodEntry({ mood: 7, energy: 6, anxiety: 4 });
    eveningEntry.timestamp = new Date('2024-01-01T20:00:00');

    const patterns = service.findPatterns();
    
    expect(patterns).toHaveLength(3);
    expect(patterns.find(p => p.timeOfDay === 'morning')?.frequency).toBe(1);
    expect(patterns.find(p => p.timeOfDay === 'afternoon')?.averageMood).toBe(8);
  });

  it('should detect mood anomalies', () => {
    service.addMoodEntry({ mood: 5, energy: 5, anxiety: 5 });
    service.addMoodEntry({ mood: 6, energy: 6, anxiety: 4 });
    service.addMoodEntry({ mood: 1, energy: 2, anxiety: 9 }); // Anomaly
    service.addMoodEntry({ mood: 7, energy: 7, anxiety: 3 });
    service.addMoodEntry({ mood: 9, energy: 9, anxiety: 1 }); // Anomaly

    const anomalies = service.detectAnomalies(2);
    
    expect(anomalies).toHaveLength(2);
    expect(anomalies.some(a => a.mood === 1)).toBe(true);
    expect(anomalies.some(a => a.mood === 9)).toBe(true);
  });

  it('should provide mood insights', () => {
    service.addMoodEntry({ mood: 4, energy: 4, anxiety: 6 });
    service.addMoodEntry({ mood: 7, energy: 7, anxiety: 3 });
    service.addMoodEntry({ mood: 8, energy: 8, anxiety: 2 });
    service.addMoodEntry({ mood: 6, energy: 6, anxiety: 4 });

    const insights = service.getMoodInsights();
    
    expect(insights.mostCommonMood).toBeDefined();
    expect(insights.streakCount).toBeDefined();
    expect(insights.bestDay).toBeDefined();
    expect(insights.worstDay).toBeDefined();
  });

  it('should export and clear data', () => {
    service.addMoodEntry({ mood: 7, energy: 8, anxiety: 3 });
    service.addMoodEntry({ mood: 6, energy: 7, anxiety: 4 });

    const exported = service.exportData();
    expect(exported).toHaveLength(2);

    service.clearData();
    expect(service.getMoodEntries()).toHaveLength(0);
  });
});
