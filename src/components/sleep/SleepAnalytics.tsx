/**
 * Sleep Analytics Component
 * Advanced visualization and insights for sleep patterns
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Moon, Sun, Brain, 
  Calendar, Clock, AlertTriangle, Target, Zap
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO } from 'date-fns';
import {
  sleepTrackingService,
  SleepEntry,
  SleepPattern,
  CircadianProfile,
  SleepDebt
} from '../../services/sleep/sleepTrackingService';
import { useAuth } from '../../contexts/AuthContext';

interface SleepAnalyticsProps {
  entries?: SleepEntry[];
  timeRange?: number; // days
}

const SleepAnalytics: React.FC<SleepAnalyticsProps> = ({ 
  entries: propEntries, 
  timeRange = 30 
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [pattern, setPattern] = useState<SleepPattern | null>(null);
  const [circadian, setCircadian] = useState<CircadianProfile | null>(null);
  const [sleepDebt, setSleepDebt] = useState<SleepDebt | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'patterns' | 'quality' | 'factors' | 'circadian'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const startDate = subDays(new Date(), timeRange);
        const endDate = new Date();
        
        const fetchedEntries = propEntries || 
          await sleepTrackingService.getEntriesInRange(startDate, endDate, user.id);
        
        setEntries(fetchedEntries);
        
        // Load analytics data
        const [patternData, circadianData, debtData] = await Promise.all([
          sleepTrackingService.analyzeSleepPatterns(user.id, timeRange),
          sleepTrackingService.analyzeCircadianRhythm(user.id),
          sleepTrackingService.calculateSleepDebt(user.id)
        ]);
        
        setPattern(patternData);
        setCircadian(circadianData);
        setSleepDebt(debtData);
      } catch (error) {
        console.error('Error loading sleep analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, timeRange, propEntries]);

  // Prepare data for charts
  const sleepDurationData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });
    
    return last7Days.map(day => {
      const dayEntries = entries.filter(e => 
        format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      const duration = dayEntries.length > 0
        ? (dayEntries[0].actualSleepTime || 0) / 60
        : 0;
      
      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        duration: Math.round(duration * 10) / 10,
        target: 8,
        quality: dayEntries.length > 0 ? dayEntries[0].quality : 0
      };
    });
  }, [entries]);

  const qualityDistribution = useMemo(() => {
    const distribution = [
      { name: 'Excellent', value: 0, color: '#10b981' },
      { name: 'Good', value: 0, color: '#3b82f6' },
      { name: 'Fair', value: 0, color: '#f59e0b' },
      { name: 'Poor', value: 0, color: '#f97316' },
      { name: 'Very Poor', value: 0, color: '#ef4444' }
    ];
    
    entries.forEach(entry => {
      const index = 5 - entry.quality;
      if (index >= 0 && index < 5) {
        distribution[index].value++;
      }
    });
    
    return distribution.filter(d => d.value > 0);
  }, [entries]);

  const sleepScheduleData = useMemo(() => {
    return entries.slice(0, 14).map(entry => {
      const bedtimeHour = new Date(entry.bedtime).getHours() + new Date(entry.bedtime).getMinutes() / 60;
      const wakeTimeHour = new Date(entry.wakeTime).getHours() + new Date(entry.wakeTime).getMinutes() / 60;
      
      return {
        date: format(new Date(entry.date), 'MM/dd'),
        bedtime: bedtimeHour < 12 ? bedtimeHour + 24 : bedtimeHour,
        wakeTime: wakeTimeHour,
        quality: entry.quality
      };
    }).reverse();
  }, [entries]);

  const factorImpactData = useMemo(() => {
    const factorMap = new Map<string, { positive: number, negative: number, count: number }>();
    
    entries.forEach(entry => {
      entry.factors.forEach(factor => {
        if (!factor.present) return;
        
        const current = factorMap.get(factor.factor) || { positive: 0, negative: 0, count: 0 };
        
        if (factor.impact === 'positive') {
          current.positive += entry.quality;
        } else if (factor.impact === 'negative') {
          current.negative += entry.quality;
        }
        current.count++;
        
        factorMap.set(factor.factor, current);
      });
    });
    
    return Array.from(factorMap.entries())
      .map(([factor, data]) => ({
        factor,
        positive: data.positive / Math.max(1, data.count),
        negative: -data.negative / Math.max(1, data.count),
        frequency: data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);
  }, [entries]);

  const circadianData = useMemo(() => {
    if (!circadian) return [];
    
    return [
      { metric: 'Alignment', value: circadian.currentAlignment, fullMark: 100 },
      { metric: 'Consistency', value: pattern?.consistency || 0, fullMark: 100 },
      { metric: 'Quality', value: (pattern?.averageDuration || 0) / 8 * 100, fullMark: 100 },
      { metric: 'Duration', value: Math.min(100, (pattern?.averageDuration || 0) / 8 * 100), fullMark: 100 }
    ];
  }, [circadian, pattern]);

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle: string,
    icon: React.ReactNode,
    trend?: 'up' | 'down' | 'stable',
    color: string = 'indigo'
  ) => {
    const trendIcons = {
      up: <TrendingUp className="w-4 h-4 text-green-500" />,
      down: <TrendingDown className="w-4 h-4 text-red-500" />,
      stable: <Activity className="w-4 h-4 text-gray-500" />
    };
    
    return (
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 bg-${color}-100 rounded-lg`}>
            {icon}
          </div>
          {trend && trendIcons[trend]}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          'Average Sleep',
          `${pattern?.averageDuration.toFixed(1) || 0}h`,
          'Last 30 days',
          <Moon className="w-6 h-6 text-indigo-600" />,
          pattern?.averageDuration && pattern.averageDuration >= 7 ? 'up' : 'down'
        )}
        
        {renderMetricCard(
          'Sleep Debt',
          `${sleepDebt?.current.toFixed(1) || 0}h`,
          sleepDebt?.trend || 'stable',
          <Clock className="w-6 h-6 text-orange-600" />,
          sleepDebt?.trend === 'decreasing' ? 'up' : sleepDebt?.trend === 'increasing' ? 'down' : 'stable',
          'orange'
        )}
        
        {renderMetricCard(
          'Consistency',
          `${pattern?.consistency.toFixed(0) || 0}%`,
          'Schedule regularity',
          <Target className="w-6 h-6 text-blue-600" />,
          pattern?.consistency && pattern.consistency >= 70 ? 'up' : 'down',
          'blue'
        )}
        
        {renderMetricCard(
          'Circadian Alignment',
          `${circadian?.currentAlignment.toFixed(0) || 0}%`,
          circadian?.chronotype || 'Unknown',
          <Sun className="w-6 h-6 text-yellow-600" />,
          circadian?.currentAlignment && circadian.currentAlignment >= 80 ? 'up' : 'down',
          'yellow'
        )}
      </div>

      {/* Sleep Duration Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Sleep Duration</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sleepDurationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 12]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded shadow-lg border">
                      <p className="font-semibold">{payload[0].payload.fullDate}</p>
                      <p className="text-sm">Duration: {payload[0].value}h</p>
                      <p className="text-sm">Quality: {payload[0].payload.quality}/5</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="duration" fill="#6366f1" name="Actual Sleep" />
            <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target (8h)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Quality Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={qualityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {qualityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Circadian Rhythm Profile</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={circadianData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Current" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-6">
      {/* Sleep Schedule Consistency */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Schedule Pattern</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="category" 
              dataKey="date" 
              name="Date"
              allowDuplicatedCategory={false}
            />
            <YAxis 
              type="number" 
              dataKey="bedtime" 
              name="Time" 
              domain={[18, 30]}
              tickFormatter={(value) => {
                const hour = value > 24 ? value - 24 : value;
                return `${Math.floor(hour)}:00`;
              }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const bedtime = payload[0].value as number;
                  const wakeTime = payload[1]?.value as number || 0;
                  const formatTime = (time: number) => {
                    const hour = time > 24 ? time - 24 : time;
                    const h = Math.floor(hour);
                    const m = Math.round((hour - h) * 60);
                    return `${h}:${m.toString().padStart(2, '0')}`;
                  };
                  
                  return (
                    <div className="bg-white p-3 rounded shadow-lg border">
                      <p className="font-semibold">{payload[0].payload.date}</p>
                      <p className="text-sm">Bedtime: {formatTime(bedtime)}</p>
                      <p className="text-sm">Wake: {formatTime(wakeTime)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Scatter name="Bedtime" data={sleepScheduleData} fill="#6366f1" />
            <Scatter name="Wake Time" data={sleepScheduleData.map(d => ({ ...d, bedtime: d.wakeTime }))} fill="#10b981" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Pattern Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Pattern Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Average Bedtime</span>
              <span className="font-semibold">{pattern?.averageBedtime || '--:--'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Average Wake Time</span>
              <span className="font-semibold">{pattern?.averageWakeTime || '--:--'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Average Duration</span>
              <span className="font-semibold">{pattern?.averageDuration.toFixed(1) || 0} hours</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Schedule Consistency</span>
              <span className={`font-semibold ${
                (pattern?.consistency || 0) >= 70 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {pattern?.consistency.toFixed(0) || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Quality Trend</span>
              <span className={`font-semibold capitalize ${
                pattern?.qualityTrend === 'improving' ? 'text-green-600' :
                pattern?.qualityTrend === 'declining' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {pattern?.qualityTrend || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chronotype Profile</h3>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                circadian?.chronotype === 'early_bird' ? 'bg-yellow-100' :
                circadian?.chronotype === 'night_owl' ? 'bg-purple-100' :
                'bg-blue-100'
              }`}>
                {circadian?.chronotype === 'early_bird' ? 
                  <Sun className="w-10 h-10 text-yellow-600" /> :
                  circadian?.chronotype === 'night_owl' ?
                  <Moon className="w-10 h-10 text-purple-600" /> :
                  <Clock className="w-10 h-10 text-blue-600" />
                }
              </div>
              <p className="mt-3 text-lg font-semibold capitalize">
                {circadian?.chronotype?.replace('_', ' ') || 'Unknown'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Optimal Bedtime</span>
                <span className="font-semibold">{circadian?.optimalBedtime || '--:--'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Optimal Wake Time</span>
                <span className="font-semibold">{circadian?.optimalWakeTime || '--:--'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Current Alignment</span>
                <span className={`font-semibold ${
                  (circadian?.currentAlignment || 0) >= 80 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {circadian?.currentAlignment.toFixed(0) || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFactors = () => (
    <div className="space-y-6">
      {/* Factor Impact Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Factor Impact Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={factorImpactData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-5, 5]} />
            <YAxis type="category" dataKey="factor" width={100} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded shadow-lg border">
                      <p className="font-semibold">{data.factor}</p>
                      <p className="text-sm text-green-600">
                        Positive impact: {Math.abs(data.positive).toFixed(1)}
                      </p>
                      <p className="text-sm text-red-600">
                        Negative impact: {Math.abs(data.negative).toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Frequency: {data.frequency} nights
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="positive" fill="#10b981" name="Positive Impact" />
            <Bar dataKey="negative" fill="#ef4444" name="Negative Impact" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Common Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Negative Factors</h3>
          <div className="space-y-3">
            {pattern?.commonFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">{factor}</span>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            ))}
            {(!pattern?.commonFactors || pattern.commonFactors.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recurring negative factors identified</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Debt Recovery Plan</h3>
          {sleepDebt && sleepDebt.current > 0 ? (
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Current Sleep Debt</span>
                  <span className="font-bold text-orange-600">{sleepDebt.current.toFixed(1)} hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Weekly Deficit</span>
                  <span className="font-semibold text-orange-500">{sleepDebt.weekly.toFixed(1)} hours</span>
                </div>
              </div>
              <div className="space-y-2">
                {sleepDebt.recoveryPlan.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <Zap className="w-4 h-4 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600">Great job! No significant sleep debt detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Moon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sleep Data Available</h3>
        <p className="text-gray-600">Start tracking your sleep to see analytics and insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow p-1 flex flex-wrap">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'patterns', label: 'Patterns', icon: TrendingUp },
          { id: 'factors', label: 'Factors', icon: Brain }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
              selectedView === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'patterns' && renderPatterns()}
      {selectedView === 'factors' && renderFactors()}
    </div>
  );
};

export default SleepAnalytics;