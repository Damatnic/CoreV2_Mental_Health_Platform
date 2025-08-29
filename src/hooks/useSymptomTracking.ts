/**
 * Symptom Tracking Hook
 * Manages symptom tracking state and provides utility functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  symptomTrackingService,
  Symptom,
  SymptomPattern,
  TrendAnalysis,
  SymptomCategory,
  SymptomType,
  Trigger,
  MedicationLog,
  ExportData
} from '../services/symptom/symptomTrackingService';
import { useAuth } from '../contexts/AuthContext';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';

interface UseSymptomTrackingOptions {
  autoLoad?: boolean;
  defaultPeriod?: number;
  category?: SymptomCategory;
  realTimeUpdates?: boolean;
}

interface SymptomTrackingState {
  symptoms: Symptom[];
  patterns: SymptomPattern[];
  trends: TrendAnalysis | null;
  isLoading: boolean;
  error: Error | null;
  hasWarningSigns: boolean;
}

export const useSymptomTracking = (options: UseSymptomTrackingOptions = {}) => {
  const {
    autoLoad = true,
    defaultPeriod = 30,
    category,
    realTimeUpdates = true
  } = options;
  
  const { user } = useAuth();
  const [state, setState] = useState<SymptomTrackingState>({
    symptoms: [],
    patterns: [],
    trends: null,
    isLoading: false,
    error: null,
    hasWarningSigns: false
  });
  
  // Statistics computed from symptoms
  const statistics = useMemo(() => {
    const { symptoms } = state;
    if (symptoms.length === 0) {
      return {
        totalSymptoms: 0,
        averageSeverity: 0,
        peakSeverity: 0,
        mostCommonSymptom: null,
        mostCommonTrigger: null,
        severityTrend: 'stable' as 'improving' | 'worsening' | 'stable',
        lastLogged: null
      };
    }
    
    // Calculate basic stats
    const severities = symptoms.map(s => s.severity);
    const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
    const peakSeverity = Math.max(...severities);
    
    // Find most common symptom
    const symptomCounts = new Map<string, number>();
    symptoms.forEach(s => {
      symptomCounts.set(s.name, (symptomCounts.get(s.name) || 0) + 1);
    });
    const mostCommonSymptom = Array.from(symptomCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // Find most common trigger
    const triggerCounts = new Map<string, number>();
    symptoms.forEach(s => {
      s.triggers?.forEach(t => {
        triggerCounts.set(t.name, (triggerCounts.get(t.name) || 0) + 1);
      });
    });
    const mostCommonTrigger = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // Calculate severity trend
    let severityTrend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (symptoms.length >= 7) {
      const recentSymptoms = symptoms.slice(0, Math.floor(symptoms.length / 2));
      const olderSymptoms = symptoms.slice(Math.floor(symptoms.length / 2));
      
      const recentAvg = recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length;
      const olderAvg = olderSymptoms.reduce((sum, s) => sum + s.severity, 0) / olderSymptoms.length;
      
      if (recentAvg < olderAvg - 1) {
        severityTrend = 'improving';
      } else if (recentAvg > olderAvg + 1) {
        severityTrend = 'worsening';
      }
    }
    
    // Get last logged time
    const lastLogged = symptoms[0]?.timestamp || null;
    
    return {
      totalSymptoms: symptoms.length,
      averageSeverity: Math.round(avgSeverity * 10) / 10,
      peakSeverity,
      mostCommonSymptom,
      mostCommonTrigger,
      severityTrend,
      lastLogged
    };
  }, [state.symptoms]);
  
  // Load symptoms data
  const loadSymptoms = useCallback(async (
    startDate?: Date,
    endDate?: Date,
    filters?: {
      category?: SymptomCategory;
      type?: SymptomType;
      minSeverity?: number;
    }
  ) => {
    if (!user) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const end = endDate || new Date();
      const start = startDate || subDays(end, defaultPeriod);
      
      // Load symptoms
      const symptoms = await symptomTrackingService.getSymptoms(
        user.id,
        start,
        end,
        { ...filters, category: filters?.category || category }
      );
      
      // Analyze patterns
      const patterns = await symptomTrackingService.analyzePatterns(user.id);
      
      // Get trends
      const trends = await symptomTrackingService.analyzeTrends(
        user.id,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      
      setState(prev => ({
        ...prev,
        symptoms,
        patterns,
        trends,
        hasWarningSigns: trends.warningSignsDetected,
        isLoading: false
      }));
      
      // Show warning if needed
      if (trends.warningSignsDetected) {
        toast.error('Warning signs detected in your symptom patterns. Consider reaching out to your healthcare provider.', {
          duration: 6000,
          icon: '⚠️'
        });
      }
    } catch (error) {
      console.error('Error loading symptoms:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      toast.error('Failed to load symptom data');
    }
  }, [user, defaultPeriod, category]);
  
  // Log a new symptom
  const logSymptom = useCallback(async (
    symptomData: Omit<Symptom, 'id' | 'timestamp' | 'userId'>
  ): Promise<Symptom | null> => {
    if (!user) {
      toast.error('Please sign in to track symptoms');
      return null;
    }
    
    try {
      const symptom = await symptomTrackingService.logSymptom({
        ...symptomData,
        userId: user.id
      });
      
      // Update local state if real-time updates are enabled
      if (realTimeUpdates) {
        setState(prev => ({
          ...prev,
          symptoms: [symptom, ...prev.symptoms]
        }));
        
        // Re-analyze patterns
        const patterns = await symptomTrackingService.analyzePatterns(user.id);
        const trends = await symptomTrackingService.analyzeTrends(user.id, defaultPeriod);
        
        setState(prev => ({
          ...prev,
          patterns,
          trends,
          hasWarningSigns: trends.warningSignsDetected
        }));
        
        if (trends.warningSignsDetected && !state.hasWarningSigns) {
          toast.error('Warning signs detected. Please monitor your symptoms closely.', {
            duration: 6000,
            icon: '⚠️'
          });
        }
      }
      
      toast.success('Symptom logged successfully');
      return symptom;
    } catch (error) {
      console.error('Error logging symptom:', error);
      toast.error('Failed to log symptom');
      return null;
    }
  }, [user, realTimeUpdates, defaultPeriod, state.hasWarningSigns]);
  
  // Update an existing symptom
  const updateSymptom = useCallback(async (
    symptomId: string,
    updates: Partial<Omit<Symptom, 'id' | 'userId' | 'timestamp'>>
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Find the symptom
      const symptom = state.symptoms.find(s => s.id === symptomId);
      if (!symptom) {
        toast.error('Symptom not found');
        return false;
      }
      
      // Update the symptom
      const updatedSymptom: Symptom = {
        ...symptom,
        ...updates
      };
      
      // Update local state
      setState(prev => ({
        ...prev,
        symptoms: prev.symptoms.map(s => s.id === symptomId ? updatedSymptom : s)
      }));
      
      toast.success('Symptom updated');
      return true;
    } catch (error) {
      console.error('Error updating symptom:', error);
      toast.error('Failed to update symptom');
      return false;
    }
  }, [user, state.symptoms]);
  
  // Delete a symptom
  const deleteSymptom = useCallback(async (symptomId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Remove from local state
      setState(prev => ({
        ...prev,
        symptoms: prev.symptoms.filter(s => s.id !== symptomId)
      }));
      
      toast.success('Symptom deleted');
      return true;
    } catch (error) {
      console.error('Error deleting symptom:', error);
      toast.error('Failed to delete symptom');
      return false;
    }
  }, [user]);
  
  // Export symptoms for healthcare provider
  const exportForProvider = useCallback(async (
    format: 'json' | 'pdf' | 'csv' = 'json',
    startDate?: Date,
    endDate?: Date
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Please sign in to export data');
      return null;
    }
    
    try {
      const end = endDate || new Date();
      const start = startDate || subDays(end, defaultPeriod);
      
      const exportData = await symptomTrackingService.exportForProvider(
        user.id,
        start,
        end,
        format
      );
      
      // Handle different formats
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `symptom-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const blob = new Blob([exportData as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `symptom-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // For PDF, we'd typically use a library like jsPDF
        // For now, return the text content
        toast.info('PDF export will open in a new window');
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<pre>${exportData}</pre>`);
          win.document.title = 'Symptom Report';
        }
      }
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
      return typeof exportData === 'string' ? exportData : JSON.stringify(exportData);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
      return null;
    }
  }, [user, defaultPeriod]);
  
  // Get symptom templates for quick entry
  const getSymptomTemplates = useCallback((cat?: SymptomCategory) => {
    return symptomTrackingService.getSymptomTemplates(cat || SymptomCategory.GENERAL);
  }, []);
  
  // Get common triggers
  const getCommonTriggers = useCallback((cat?: SymptomCategory) => {
    return symptomTrackingService.getCommonTriggers(cat);
  }, []);
  
  // Refresh data
  const refresh = useCallback(() => {
    if (autoLoad && user) {
      loadSymptoms();
    }
  }, [autoLoad, user, loadSymptoms]);
  
  // Auto-load on mount and user change
  useEffect(() => {
    if (autoLoad && user) {
      loadSymptoms();
      
      // Load from storage first for faster initial render
      symptomTrackingService.loadFromStorage(user.id).then(() => {
        loadSymptoms();
      });
    }
  }, [autoLoad, user, loadSymptoms]);
  
  // Set up real-time sync if enabled
  useEffect(() => {
    if (!realTimeUpdates || !user) return;
    
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(() => {
      loadSymptoms();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [realTimeUpdates, user, loadSymptoms]);
  
  return {
    // State
    symptoms: state.symptoms,
    patterns: state.patterns,
    trends: state.trends,
    isLoading: state.isLoading,
    error: state.error,
    hasWarningSigns: state.hasWarningSigns,
    
    // Statistics
    statistics,
    
    // Actions
    logSymptom,
    updateSymptom,
    deleteSymptom,
    loadSymptoms,
    exportForProvider,
    refresh,
    
    // Utilities
    getSymptomTemplates,
    getCommonTriggers
  };
};