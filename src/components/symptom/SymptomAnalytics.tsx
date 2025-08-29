/**
 * Symptom Analytics Component
 * Provides comprehensive data visualization for symptom tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import {
  symptomTrackingService,
  Symptom,
  SymptomPattern,
  TrendAnalysis,
  PatternType,
  SymptomCategory
} from '../../services/symptom/symptomTrackingService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiTrendingUp, FiTrendingDown, FiActivity, FiAlertCircle, 
  FiCalendar, FiDownload, FiFilter, FiRefreshCw, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SymptomAnalyticsProps {
  dateRange?: { start: Date; end: Date };
  category?: SymptomCategory;
  onExport?: () => void;
}

export const SymptomAnalytics: React.FC<SymptomAnalyticsProps> = ({
  dateRange,
  category,
  onExport
}) => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [patterns, setPatterns] = useState<SymptomPattern[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'patterns' | 'timeline' | 'distribution'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30 | 90>(30);
  
  // Fetch data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateRange, category, selectedPeriod]);
  
  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const endDate = dateRange?.end || new Date();
      const startDate = dateRange?.start || subDays(endDate, selectedPeriod);
      
      // Fetch symptoms
      const fetchedSymptoms = await symptomTrackingService.getSymptoms(
        user.id,
        startDate,
        endDate,
        category ? { category } : undefined
      );
      setSymptoms(fetchedSymptoms);
      
      // Analyze patterns
      const analyzedPatterns = await symptomTrackingService.analyzePatterns(user.id);
      setPatterns(analyzedPatterns);
      
      // Get trends
      const trendAnalysis = await symptomTrackingService.analyzeTrends(user.id, selectedPeriod);
      setTrends(trendAnalysis);
    } catch (error) {
      console.error('Error loading symptom data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Prepare timeline data
  const timelineData = useMemo(() => {
    if (symptoms.length === 0) return [];
    
    const endDate = dateRange?.end || new Date();
    const startDate = dateRange?.start || subDays(endDate, selectedPeriod);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const daySymptoms = symptoms.filter(s => {
        const symptomDate = new Date(s.timestamp);
        return format(symptomDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      const avgSeverity = daySymptoms.length > 0
        ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length
        : 0;
      
      const maxSeverity = daySymptoms.length > 0
        ? Math.max(...daySymptoms.map(s => s.severity))
        : 0;
      
      return {
        date: format(day, 'MMM dd'),
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        maxSeverity,
        count: daySymptoms.length
      };
    });
  }, [symptoms, selectedPeriod, dateRange]);
  
  // Prepare category distribution data
  const categoryData = useMemo(() => {
    const categoryCount = new Map<string, number>();
    symptoms.forEach(s => {
      categoryCount.set(s.category, (categoryCount.get(s.category) || 0) + 1);
    });
    
    return Array.from(categoryCount.entries()).map(([category, count]) => ({
      name: category.replace('_', ' '),
      value: count,
      percentage: Math.round((count / symptoms.length) * 100)
    }));
  }, [symptoms]);
  
  // Prepare symptom frequency data
  const symptomFrequencyData = useMemo(() => {
    const symptomCount = new Map<string, number>();
    symptoms.forEach(s => {
      symptomCount.set(s.name, (symptomCount.get(s.name) || 0) + 1);
    });
    
    return Array.from(symptomCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [symptoms]);
  
  // Prepare trigger correlation data
  const triggerCorrelationData = useMemo(() => {
    const triggerSeverity = new Map<string, { total: number; count: number }>();
    
    symptoms.forEach(s => {
      s.triggers?.forEach(t => {
        const current = triggerSeverity.get(t.name) || { total: 0, count: 0 };
        triggerSeverity.set(t.name, {
          total: current.total + s.severity,
          count: current.count + 1
        });
      });
    });
    
    return Array.from(triggerSeverity.entries())
      .map(([trigger, data]) => ({
        trigger,
        avgSeverity: Math.round((data.total / data.count) * 10) / 10,
        frequency: data.count
      }))
      .sort((a, b) => b.avgSeverity - a.avgSeverity)
      .slice(0, 8);
  }, [symptoms]);
  
  // Prepare time of day analysis
  const timeOfDayData = useMemo(() => {
    const timeSlots = {
      'Early Morning': { total: 0, count: 0 },
      'Morning': { total: 0, count: 0 },
      'Afternoon': { total: 0, count: 0 },
      'Evening': { total: 0, count: 0 },
      'Night': { total: 0, count: 0 },
      'Late Night': { total: 0, count: 0 }
    };
    
    symptoms.forEach(s => {
      if (s.context?.timeOfDay) {
        const slot = s.context.timeOfDay.replace('_', ' ').split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        if (slot in timeSlots) {
          timeSlots[slot as keyof typeof timeSlots].total += s.severity;
          timeSlots[slot as keyof typeof timeSlots].count += 1;
        }
      }
    });
    
    return Object.entries(timeSlots).map(([time, data]) => ({
      time,
      avgSeverity: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
      count: data.count
    }));
  }, [symptoms]);
  
  // Colors for charts
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
  
  // Export data
  const handleExport = async () => {
    if (!user) return;
    
    try {
      const endDate = dateRange?.end || new Date();
      const startDate = dateRange?.start || subDays(endDate, selectedPeriod);
      
      const exportData = await symptomTrackingService.exportForProvider(
        user.id,
        startDate,
        endDate,
        'json'
      );
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `symptom-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
      onExport?.();
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };
  
  // Render pattern card
  const renderPatternCard = (pattern: SymptomPattern) => {
    const getPatternIcon = () => {
      switch (pattern.type) {
        case PatternType.ESCALATING:
          return <FiTrendingUp className="w-5 h-5 text-red-500" />;
        case PatternType.IMPROVING:
          return <FiTrendingDown className="w-5 h-5 text-green-500" />;
        case PatternType.CYCLICAL:
          return <FiRefreshCw className="w-5 h-5 text-blue-500" />;
        case PatternType.TRIGGERED:
          return <FiAlertCircle className="w-5 h-5 text-orange-500" />;
        default:
          return <FiActivity className="w-5 h-5 text-purple-500" />;
      }
    };
    
    return (
      <div key={pattern.type} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex items-start space-x-3">
          {getPatternIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
              {pattern.type.replace('_', ' ')} Pattern
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pattern.description}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-xs">
              <span className="text-gray-500 dark:text-gray-500">
                Confidence: {Math.round(pattern.confidence * 100)}%
              </span>
              <span className="text-gray-500 dark:text-gray-500">
                {pattern.timeframe}
              </span>
            </div>
            {pattern.recommendations && pattern.recommendations.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Recommendations:
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  {pattern.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (symptoms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <FiActivity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Symptom Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start tracking your symptoms to see analytics and patterns.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Symptom Analytics
          </h2>
          <div className="flex items-center space-x-2">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value) as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            
            {/* View Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['overview', 'patterns', 'timeline', 'distribution'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                    selectedView === view
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              title="Export data"
            >
              <FiDownload className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        {trends && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Severity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {trends.averageSeverity}/10
              </p>
              {trends.improvementRate > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {trends.improvementRate}% improvement
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Peak Severity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {trends.peakSeverity}/10
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Logged</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {symptoms.length}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Patterns Found</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {patterns.length}
              </p>
              {trends.warningSignsDetected && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                  <FiAlertCircle className="w-3 h-3 mr-1" />
                  Warning signs detected
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Severity Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis domain={[0, 10]} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgSeverity" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  name="Avg Severity"
                />
                <Area 
                  type="monotone" 
                  dataKey="maxSeverity" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.2}
                  name="Max Severity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Symptoms */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Most Frequent Symptoms
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={symptomFrequencyData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Trigger Correlation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trigger Impact
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={triggerCorrelationData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="trigger" stroke="#9CA3AF" />
                <PolarRadiusAxis domain={[0, 10]} stroke="#9CA3AF" />
                <Radar 
                  name="Avg Severity" 
                  dataKey="avgSeverity" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Time of Day Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Time of Day Patterns
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 10]} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSeverity" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  name="Avg Severity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {selectedView === 'patterns' && (
        <div className="space-y-4">
          {patterns.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patterns.map(pattern => renderPatternCard(pattern))}
              </div>
              
              {trends && trends.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Personalized Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {trends.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-blue-800 dark:text-blue-200">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Continue tracking symptoms to discover patterns in your data.
              </p>
            </div>
          )}
        </div>
      )}
      
      {selectedView === 'timeline' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Timeline
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis yAxisId="left" domain={[0, 10]} stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avgSeverity" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Avg Severity"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="count" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Symptom Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {selectedView === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Severity Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={
                (() => {
                  const severityBins = Array(11).fill(0);
                  symptoms.forEach(s => {
                    severityBins[Math.floor(s.severity)]++;
                  });
                  return severityBins.map((count, severity) => ({ severity, count }));
                })()
              }>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="severity" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};