/**
 * Sleep Tracking Hook
 * State management and integration for sleep tracking features
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { subDays } from 'date-fns';
import {
  sleepTrackingService,
  SleepEntry,
  SleepPattern,
  CircadianProfile,
  SleepDebt,
  SleepRecommendation
} from '../services/sleep/sleepTrackingService';
import { useAuth } from '../contexts/AuthContext';

interface SleepTrackingState {
  // Data
  entries: SleepEntry[];
  currentEntry: SleepEntry | null;
  recentEntries: SleepEntry[];
  pattern: SleepPattern | null;
  circadian: CircadianProfile | null;
  sleepDebt: SleepDebt | null;
  recommendations: SleepRecommendation[];
  
  // Mood correlation
  moodCorrelation: {
    correlation: number;
    insights: string[];
  } | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  
  // Actions
  logSleep: (entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSleep: (id: string, updates: Partial<SleepEntry>) => Promise<void>;
  deleteSleep: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  exportData: (format: 'json' | 'csv') => Promise<string>;
  
  // Analysis
  analyzePeriod: (days: number) => Promise<void>;
  correlateWithMood: (moodData: any[]) => Promise<void>;
}

export const useSleepTracking = (): SleepTrackingState => {
  const { user } = useAuth();
  
  // State
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<SleepEntry | null>(null);
  const [pattern, setPattern] = useState<SleepPattern | null>(null);
  const [circadian, setCircadian] = useState<CircadianProfile | null>(null);
  const [sleepDebt, setSleepDebt] = useState<SleepDebt | null>(null);
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);
  const [moodCorrelation, setMoodCorrelation] = useState<SleepTrackingState['moodCorrelation']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [analysisRange, setAnalysisRange] = useState(30); // days

  // Computed values
  const recentEntries = useMemo(() => {
    return entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [entries]);

  // Load initial data
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  // Auto-refresh analytics when entries change
  useEffect(() => {
    if (user && entries.length > 0) {
      refreshAnalytics();
    }
  }, [entries, user]);

  // Set up periodic sync (every 5 minutes when app is active)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        refreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Core data refresh
  const refreshData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load entries
      const allEntries = await sleepTrackingService.getAllEntries(user.id);
      setEntries(allEntries);

      // Get today's entry if exists
      const today = new Date();
      const todayEntry = allEntries.find(e => {
        const entryDate = new Date(e.date);
        return entryDate.toDateString() === today.toDateString();
      });
      setCurrentEntry(todayEntry || null);

      // Update sync time
      setLastSync(new Date());
    } catch (err) {
      console.error('Error refreshing sleep data:', err);
      setError('Failed to load sleep data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      const [
        patternData,
        circadianData,
        debtData,
        recommendationsData
      ] = await Promise.all([
        sleepTrackingService.analyzeSleepPatterns(user.id, analysisRange),
        sleepTrackingService.analyzeCircadianRhythm(user.id),
        sleepTrackingService.calculateSleepDebt(user.id),
        sleepTrackingService.generateRecommendations(user.id)
      ]);

      setPattern(patternData);
      setCircadian(circadianData);
      setSleepDebt(debtData);
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error('Error refreshing analytics:', err);
    }
  }, [user, analysisRange]);

  // Log new sleep entry
  const logSleep = useCallback(async (
    entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newEntry = await sleepTrackingService.logSleep({
        ...entry,
        userId: user.id
      });

      setEntries(prev => [...prev, newEntry]);
      
      // If this is today's entry, set as current
      const today = new Date();
      if (new Date(newEntry.date).toDateString() === today.toDateString()) {
        setCurrentEntry(newEntry);
      }

      // Refresh analytics with new data
      await refreshAnalytics();
      
      // Show success notification (you can integrate with your notification system)
      console.log('Sleep entry logged successfully');
    } catch (err) {
      console.error('Error logging sleep:', err);
      setError('Failed to log sleep entry. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshAnalytics]);

  // Update existing sleep entry
  const updateSleep = useCallback(async (
    id: string,
    updates: Partial<SleepEntry>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedEntry = await sleepTrackingService.updateEntry(id, updates);
      
      if (updatedEntry) {
        setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
        
        if (currentEntry?.id === id) {
          setCurrentEntry(updatedEntry);
        }

        await refreshAnalytics();
        console.log('Sleep entry updated successfully');
      }
    } catch (err) {
      console.error('Error updating sleep:', err);
      setError('Failed to update sleep entry. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentEntry, refreshAnalytics]);

  // Delete sleep entry
  const deleteSleep = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await sleepTrackingService.deleteEntry(id);
      
      if (success) {
        setEntries(prev => prev.filter(e => e.id !== id));
        
        if (currentEntry?.id === id) {
          setCurrentEntry(null);
        }

        await refreshAnalytics();
        console.log('Sleep entry deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting sleep:', err);
      setError('Failed to delete sleep entry. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentEntry, refreshAnalytics]);

  // Analyze specific time period
  const analyzePeriod = useCallback(async (days: number) => {
    if (!user) return;

    setAnalysisRange(days);
    setIsLoading(true);

    try {
      const startDate = subDays(new Date(), days);
      const periodEntries = await sleepTrackingService.getEntriesInRange(
        startDate,
        new Date(),
        user.id
      );

      const patternData = await sleepTrackingService.analyzeSleepPatterns(user.id, days);
      setPattern(patternData);

      // Trigger full analytics refresh
      await refreshAnalytics();
    } catch (err) {
      console.error('Error analyzing period:', err);
      setError('Failed to analyze sleep period.');
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshAnalytics]);

  // Correlate with mood data
  const correlateWithMood = useCallback(async (moodData: any[]) => {
    if (!user) return;

    try {
      const correlation = await sleepTrackingService.correlateSleepWithMood(
        user.id,
        moodData
      );
      setMoodCorrelation(correlation);
    } catch (err) {
      console.error('Error correlating with mood:', err);
    }
  }, [user]);

  // Export data
  const exportData = useCallback(async (format: 'json' | 'csv'): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const data = await sleepTrackingService.exportData(user.id, format);
      
      // Create download link
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sleep-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return data;
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export sleep data.');
      throw err;
    }
  }, [user]);

  return {
    // Data
    entries,
    currentEntry,
    recentEntries,
    pattern,
    circadian,
    sleepDebt,
    recommendations,
    moodCorrelation,
    
    // UI State
    isLoading,
    error,
    lastSync,
    
    // Actions
    logSleep,
    updateSleep,
    deleteSleep,
    refreshData,
    exportData,
    
    // Analysis
    analyzePeriod,
    correlateWithMood
  };
};

/**
 * Hook for integrating sleep tracking with other features
 */
export const useSleepIntegration = () => {
  const { user } = useAuth();
  const [integrationStatus, setIntegrationStatus] = useState({
    mood: false,
    symptoms: false,
    medication: false,
    activity: false
  });

  // Check for correlations with other tracked data
  const checkCorrelations = useCallback(async () => {
    if (!user) return;

    try {
      // This would integrate with your other services
      // For now, we'll simulate the integration points
      
      // Check if mood tracking is available
      const moodData = localStorage.getItem('mood_entries');
      if (moodData) {
        setIntegrationStatus(prev => ({ ...prev, mood: true }));
      }

      // Check other integrations similarly
      // You would replace these with actual service calls
    } catch (err) {
      console.error('Error checking integrations:', err);
    }
  }, [user]);

  useEffect(() => {
    checkCorrelations();
  }, [checkCorrelations]);

  // Generate insights based on integrated data
  const generateIntegratedInsights = useCallback(async (): Promise<string[]> => {
    const insights: string[] = [];

    if (integrationStatus.mood) {
      insights.push('Your sleep quality appears to correlate with mood patterns');
    }

    if (integrationStatus.symptoms) {
      insights.push('Better sleep is associated with reduced symptom severity');
    }

    if (integrationStatus.medication) {
      insights.push('Consider tracking medication timing relative to sleep');
    }

    if (integrationStatus.activity) {
      insights.push('Physical activity earlier in the day may improve sleep quality');
    }

    return insights;
  }, [integrationStatus]);

  return {
    integrationStatus,
    checkCorrelations,
    generateIntegratedInsights
  };
};

/**
 * Hook for sleep reminders and notifications
 */
export const useSleepReminders = () => {
  const [reminders, setReminders] = useState({
    bedtime: { enabled: false, time: '22:30' },
    wakeTime: { enabled: false, time: '07:00' },
    windDown: { enabled: false, minutesBefore: 30 },
    logging: { enabled: false, time: '08:00' }
  });

  // Load saved reminder preferences
  useEffect(() => {
    const saved = localStorage.getItem('sleep_reminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  }, []);

  // Save reminder preferences
  const updateReminders = useCallback((updates: Partial<typeof reminders>) => {
    const newReminders = { ...reminders, ...updates };
    setReminders(newReminders);
    localStorage.setItem('sleep_reminders', JSON.stringify(newReminders));
    
    // Schedule actual notifications (would integrate with notification service)
    if (newReminders.bedtime.enabled) {
      console.log(`Bedtime reminder scheduled for ${newReminders.bedtime.time}`);
    }
  }, [reminders]);

  // Check if it's time for a reminder
  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (reminders.bedtime.enabled && currentTime === reminders.bedtime.time) {
      // Trigger bedtime reminder
      console.log('Time for bed! Start your wind-down routine.');
    }

    if (reminders.logging.enabled && currentTime === reminders.logging.time) {
      // Trigger logging reminder
      console.log("Don't forget to log your sleep from last night!");
    }
  }, [reminders]);

  // Set up reminder checking
  useEffect(() => {
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkReminders]);

  return {
    reminders,
    updateReminders
  };
};