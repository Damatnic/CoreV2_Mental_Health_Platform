import { EventEmitter } from 'events';

// Types for mood tracking service
export interface MoodEntry {
  id: string;
  userId: string;
  date: Date;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  sleep: number; // hours
  stress: number; // 1-10 scale
  notes?: string;
  tags: string[];
  triggers: string[];
  activities: string[];
  medications: MedicationEntry[];
  weather?: WeatherData;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  takenAt: Date;
  sideEffects?: string[];
  effectiveness?: number; // 1-10 scale
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  condition: string;
  cloudCover: number;
  uvIndex: number;
}

export interface MoodPattern {
  id: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'trigger-based';
  pattern: {
    timeframe: string;
    averageMood: number;
    moodRange: [number, number];
    commonTriggers: string[];
    correlatedFactors: string[];
    confidence: number; // 0-1 scale
  };
  createdAt: Date;
}

export interface MoodInsight {
  id: string;
  type: 'trend' | 'correlation' | 'trigger' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  data: any;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  recommendations?: string[];
  createdAt: Date;
}

export interface MoodGoal {
  id: string;
  userId: string;
  type: 'mood_target' | 'consistency' | 'trigger_reduction' | 'activity_increase';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  deadline?: Date;
  isActive: boolean;
  progress: number; // 0-100 percentage
  createdAt: Date;
  completedAt?: Date;
}

export interface MoodReport {
  userId: string;
  period: {
    start: Date;
    end: Date;
    type: 'week' | 'month' | 'quarter' | 'year';
  };
  summary: {
    totalEntries: number;
    averageMood: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    consistencyScore: number;
    streakData: {
      current: number;
      longest: number;
      type: 'daily_tracking' | 'good_mood' | 'low_anxiety';
    };
  };
  insights: MoodInsight[];
  patterns: MoodPattern[];
  recommendations: string[];
  graphData: {
    moodOverTime: Array<{ date: Date; mood: number; energy: number; anxiety: number }>;
    triggerFrequency: Array<{ trigger: string; count: number; impact: number }>;
    activityCorrelation: Array<{ activity: string; moodImpact: number; frequency: number }>;
  };
}

export interface MoodServiceConfig {
  apiBaseUrl: string;
  enableWeatherData: boolean;
  enableLocationData: boolean;
  enablePatternAnalysis: boolean;
  enableInsights: boolean;
  cacheTimeout: number; // minutes
  syncInterval: number; // minutes
  offlineSupport: boolean;
}

// Default configuration
const DEFAULT_CONFIG: MoodServiceConfig = {
  apiBaseUrl: process.env.VITE_API_URL || '/api',
  enableWeatherData: true,
  enableLocationData: false,
  enablePatternAnalysis: true,
  enableInsights: true,
  cacheTimeout: 30,
  syncInterval: 5,
  offlineSupport: true
};

/**
 * Mood Tracking Service
 * Handles mood data collection, analysis, and insights
 */
export class MoodService extends EventEmitter {
  private config: MoodServiceConfig;
  private cache: Map<string, { data: any; expires: Date }> = new Map();
  private syncQueue: MoodEntry[] = [];
  private syncTimer?: NodeJS.Timeout;

  constructor(config: Partial<MoodServiceConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeSync();
  }

  /**
   * Create new mood entry
   */
  async createMoodEntry(entryData: Partial<MoodEntry>): Promise<MoodEntry> {
    try {
      const entry: MoodEntry = {
        id: this.generateId(),
        userId: entryData.userId || 'anonymous',
        date: entryData.date || new Date(),
        mood: entryData.mood || 5,
        energy: entryData.energy || 5,
        anxiety: entryData.anxiety || 5,
        sleep: entryData.sleep || 8,
        stress: entryData.stress || 5,
        notes: entryData.notes || '',
        tags: entryData.tags || [],
        triggers: entryData.triggers || [],
        activities: entryData.activities || [],
        medications: entryData.medications || [],
        weather: await this.getWeatherData(),
        location: this.config.enableLocationData ? await this.getLocationData() : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Try to save to server
      try {
        const response = await this.makeRequest('/mood-entries', {
          method: 'POST',
          body: JSON.stringify(entry)
        });

        if (response.ok) {
          const savedEntry = await response.json();
          this.cacheEntry(savedEntry);
          this.emit('entry:created', savedEntry);
          return savedEntry;
        }
      } catch (error) {
        console.warn('Failed to sync mood entry:', error);
      }

      // Offline support - queue for sync
      if (this.config.offlineSupport) {
        this.syncQueue.push(entry);
        this.cacheEntry(entry);
        this.emit('entry:created', entry);
        this.emit('entry:offline', entry);
        return entry;
      }

      throw new Error('Failed to create mood entry');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get mood entries for user
   */
  async getMoodEntries(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
      includeWeather?: boolean;
    } = {}
  ): Promise<MoodEntry[]> {
    const cacheKey = `entries:${userId}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCached<MoodEntry[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.startDate) params.set('start', options.startDate.toISOString());
      if (options.endDate) params.set('end', options.endDate.toISOString());
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset) params.set('offset', options.offset.toString());
      if (options.includeWeather) params.set('includeWeather', 'true');

      const response = await this.makeRequest(`/mood-entries/${userId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood entries');
      }

      const entries: MoodEntry[] = await response.json();
      
      // Convert date strings to Date objects
      const processedEntries = entries.map(entry => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));

      this.setCached(cacheKey, processedEntries);
      return processedEntries;
    } catch (error) {
      this.emit('error', error);
      
      // Return cached entries if available during offline
      const offlineEntries = this.getOfflineEntries(userId);
      if (offlineEntries.length > 0) {
        return offlineEntries;
      }
      
      throw error;
    }
  }

  /**
   * Update mood entry
   */
  async updateMoodEntry(entryId: string, updates: Partial<MoodEntry>): Promise<MoodEntry> {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date()
      };

      const response = await this.makeRequest(`/mood-entries/${entryId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update mood entry');
      }

      const updatedEntry: MoodEntry = await response.json();
      
      this.cacheEntry(updatedEntry);
      this.emit('entry:updated', updatedEntry);
      
      return updatedEntry;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Delete mood entry
   */
  async deleteMoodEntry(entryId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/mood-entries/${entryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete mood entry');
      }

      this.removeCachedEntry(entryId);
      this.emit('entry:deleted', entryId);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get mood patterns for user
   */
  async getMoodPatterns(userId: string): Promise<MoodPattern[]> {
    if (!this.config.enablePatternAnalysis) {
      return [];
    }

    const cacheKey = `patterns:${userId}`;
    const cached = this.getCached<MoodPattern[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/mood-patterns/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood patterns');
      }

      const patterns: MoodPattern[] = await response.json();
      
      this.setCached(cacheKey, patterns);
      return patterns;
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }

  /**
   * Get mood insights for user
   */
  async getMoodInsights(userId: string): Promise<MoodInsight[]> {
    if (!this.config.enableInsights) {
      return [];
    }

    const cacheKey = `insights:${userId}`;
    const cached = this.getCached<MoodInsight[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/mood-insights/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood insights');
      }

      const insights: MoodInsight[] = await response.json();
      
      this.setCached(cacheKey, insights);
      this.emit('insights:updated', insights);
      
      return insights;
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }

  /**
   * Generate mood report
   */
  async generateMoodReport(
    userId: string,
    period: { start: Date; end: Date; type: 'week' | 'month' | 'quarter' | 'year' }
  ): Promise<MoodReport> {
    try {
      const response = await this.makeRequest('/mood-reports', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          period
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate mood report');
      }

      const report: MoodReport = await response.json();
      
      this.emit('report:generated', report);
      
      return report;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create mood goal
   */
  async createMoodGoal(goalData: Partial<MoodGoal>): Promise<MoodGoal> {
    try {
      const goal: MoodGoal = {
        id: this.generateId(),
        userId: goalData.userId || 'anonymous',
        type: goalData.type || 'mood_target',
        title: goalData.title || '',
        description: goalData.description || '',
        targetValue: goalData.targetValue || 0,
        currentValue: goalData.currentValue || 0,
        deadline: goalData.deadline,
        isActive: goalData.isActive !== false,
        progress: goalData.progress || 0,
        createdAt: new Date()
      };

      const response = await this.makeRequest('/mood-goals', {
        method: 'POST',
        body: JSON.stringify(goal)
      });

      if (!response.ok) {
        throw new Error('Failed to create mood goal');
      }

      const savedGoal: MoodGoal = await response.json();
      
      this.emit('goal:created', savedGoal);
      
      return savedGoal;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get mood statistics
   */
  async getMoodStatistics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    averageMood: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    consistencyScore: number;
    triggerAnalysis: Array<{ trigger: string; impact: number; frequency: number }>;
    activityAnalysis: Array<{ activity: string; moodBoost: number; frequency: number }>;
  }> {
    try {
      const response = await this.makeRequest(`/mood-statistics/${userId}?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood statistics');
      }

      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Export mood data
   */
  async exportMoodData(
    userId: string,
    format: 'json' | 'csv' | 'pdf',
    dateRange?: { start: Date; end: Date }
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      if (dateRange) {
        params.set('start', dateRange.start.toISOString());
        params.set('end', dateRange.end.toISOString());
      }

      const response = await this.makeRequest(`/mood-export/${userId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export mood data');
      }

      return await response.blob();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Private methods
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  private generateId(): string {
    return `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cacheEntry(entry: MoodEntry): void {
    this.setCached(`entry:${entry.id}`, entry);
  }

  private setCached<T>(key: string, data: T): void {
    const expires = new Date(Date.now() + this.config.cacheTimeout * 60 * 1000);
    this.cache.set(key, { data, expires });
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > new Date()) {
      return cached.data as T;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private removeCachedEntry(entryId: string): void {
    this.cache.delete(`entry:${entryId}`);
    
    // Clear related caches
    for (const [key] of this.cache.entries()) {
      if (key.includes('entries:')) {
        this.cache.delete(key);
      }
    }
  }

  private getOfflineEntries(userId: string): MoodEntry[] {
    return this.syncQueue.filter(entry => entry.userId === userId);
  }

  private async getWeatherData(): Promise<WeatherData | undefined> {
    if (!this.config.enableWeatherData) return undefined;

    try {
      // This would integrate with a weather API
      // For now, return mock data
      return {
        temperature: 22,
        humidity: 65,
        pressure: 1013,
        condition: 'partly-cloudy',
        cloudCover: 40,
        uvIndex: 6
      };
    } catch (error) {
      console.warn('Failed to get weather data:', error);
      return undefined;
    }
  }

  private async getLocationData(): Promise<string | undefined> {
    if (!this.config.enableLocationData) return undefined;

    try {
      return new Promise((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (position) => {
            resolve(`${position.coords.latitude},${position.coords.longitude}`);
          },
          () => resolve(undefined),
          { timeout: 5000 }
        );
      });
    } catch (error) {
      console.warn('Failed to get location:', error);
      return undefined;
    }
  }

  private initializeSync(): void {
    if (!this.config.offlineSupport) return;

    this.syncTimer = setInterval(async () => {
      if (this.syncQueue.length > 0) {
        await this.syncOfflineEntries();
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  private async syncOfflineEntries(): Promise<void> {
    const entriesToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const entry of entriesToSync) {
      try {
        const response = await this.makeRequest('/mood-entries', {
          method: 'POST',
          body: JSON.stringify(entry)
        });

        if (response.ok) {
          const syncedEntry = await response.json();
          this.cacheEntry(syncedEntry);
          this.emit('entry:synced', syncedEntry);
        } else {
          // Re-queue failed entries
          this.syncQueue.push(entry);
        }
      } catch (error) {
        // Re-queue failed entries
        this.syncQueue.push(entry);
        console.warn('Failed to sync entry:', error);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.cache.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const moodService = new MoodService();
export default moodService;
