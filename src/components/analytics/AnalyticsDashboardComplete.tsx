import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  Brain,
  Heart,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Zap,
  Battery,
  Target,
  Award,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Share2,
  Filter,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  Smile,
  Frown,
  Meh,
  Hash,
  Users,
  MessageSquare,
  FileText,
  Coffee,
  Pill,
  Shield,
  Sparkles
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar, Area, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

// Types for analytics data
interface MoodData {
  date: Date;
  value: number;
  notes?: string;
  factors?: string[];
}

interface SleepData {
  date: Date;
  duration: number;
  quality: number;
  deepSleep?: number;
  remSleep?: number;
}

interface AnxietyData {
  date: Date;
  level: number;
  triggers?: string[];
  copingUsed?: string[];
}

interface ActivityData {
  date: Date;
  type: string;
  duration: number;
  intensity?: 'low' | 'medium' | 'high';
}

interface MedicationData {
  name: string;
  adherence: number;
  missedDoses: number;
  sideEffects?: string[];
}

interface TherapyProgress {
  goal: string;
  baseline: number;
  current: number;
  target: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface CrisisEvent {
  date: Date;
  severity: 'mild' | 'moderate' | 'severe';
  duration: number;
  intervention?: string;
  outcome?: string;
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'attention';
  icon: React.ReactNode;
  action?: string;
}

// Mood Patterns Visualization Component
const MoodPatternsChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | 'year'>('month');
  const [showDetails, setShowDetails] = useState(false);

  // Generate mock mood data
  const moodData = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 365;
    const data: MoodData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date,
        value: Math.floor(Math.random() * 5) + 3 + (i < days / 2 ? 1 : 0), // Slight upward trend
        factors: ['sleep', 'exercise', 'social', 'work'].filter(() => Math.random() > 0.5)
      });
    }
    return data;
  }, [timeRange]);

  const chartData = {
    labels: moodData.map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Mood Score',
        data: moodData.map(d => d.value),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Mood: ${context.parsed.y}/10`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2
        }
      }
    }
  };

  const averageMood = moodData.reduce((sum, d) => sum + d.value, 0) / moodData.length;
  const trend = moodData[moodData.length - 1].value > moodData[0].value ? 'up' : 'down';

  return (
    <div className="mood-patterns-chart bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mood Patterns</h3>
          <p className="text-sm text-gray-600">Track your emotional wellbeing over time</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', '3months', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '3months' ? '3M' : range === 'year' ? '1Y' : range === 'week' ? '1W' : '1M'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{averageMood.toFixed(1)}</div>
          <div className="text-xs text-gray-600">Average Mood</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-xl font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(moodData[moodData.length - 1].value - moodData[0].value)}
            </span>
          </div>
          <div className="text-xs text-gray-600">Trend</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {moodData.filter(d => d.value >= 7).length}
          </div>
          <div className="text-xs text-gray-600">Good Days</div>
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
      >
        <span>View Detailed Analysis</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t"
        >
          <h4 className="font-medium text-gray-900 mb-3">Mood Influencers</h4>
          <div className="space-y-2">
            {['Sleep Quality', 'Exercise', 'Social Interaction', 'Work Stress'].map(factor => (
              <div key={factor} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{factor}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.floor(Math.random() * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Sleep Analysis Component
const SleepAnalysis: React.FC = () => {
  const sleepData = useMemo(() => {
    const data: SleepData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date,
        duration: 5 + Math.random() * 4,
        quality: Math.floor(Math.random() * 5) + 1,
        deepSleep: 1 + Math.random() * 2,
        remSleep: 0.5 + Math.random() * 1.5
      });
    }
    return data;
  }, []);

  const avgDuration = sleepData.reduce((sum, d) => sum + d.duration, 0) / sleepData.length;
  const avgQuality = sleepData.reduce((sum, d) => sum + d.quality, 0) / sleepData.length;

  const chartData = {
    labels: sleepData.slice(-7).map(d => d.date.toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: 'Sleep Duration',
        data: sleepData.slice(-7).map(d => d.duration),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2
      },
      {
        label: 'Deep Sleep',
        data: sleepData.slice(-7).map(d => d.deepSleep || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      },
      {
        label: 'REM Sleep',
        data: sleepData.slice(-7).map(d => d.remSleep || 0),
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  const getSleepQualityIcon = (quality: number) => {
    if (quality >= 4) return <Moon className="w-5 h-5 text-indigo-600" />;
    if (quality >= 3) return <Cloud className="w-5 h-5 text-blue-600" />;
    return <CloudRain className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="sleep-analysis bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sleep Analysis</h3>
          <p className="text-sm text-gray-600">Understanding your sleep patterns</p>
        </div>
        <Moon className="w-6 h-6 text-indigo-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Duration</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgDuration.toFixed(1)}h</div>
          <div className="text-xs text-gray-600">
            {avgDuration >= 7 ? 'Good' : avgDuration >= 6 ? 'Fair' : 'Poor'}
          </div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Sleep Quality</span>
            {getSleepQualityIcon(avgQuality)}
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgQuality.toFixed(1)}/5</div>
          <div className="text-xs text-gray-600">
            {avgQuality >= 4 ? 'Excellent' : avgQuality >= 3 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
      </div>

      <div className="h-48 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Sleep Insights</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              Your sleep duration has improved by 12% this week
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              Best sleep quality on weekends - consider your weekday routine
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              3 nights below recommended 7 hours this week
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wellness Metrics Component
const WellnessMetrics: React.FC = () => {
  const metrics = [
    {
      name: 'Anxiety Level',
      current: 4,
      previous: 6,
      max: 10,
      icon: <Brain className="w-5 h-5" />,
      color: 'indigo',
      trend: 'down'
    },
    {
      name: 'Energy Level',
      current: 7,
      previous: 5,
      max: 10,
      icon: <Battery className="w-5 h-5" />,
      color: 'green',
      trend: 'up'
    },
    {
      name: 'Social Connection',
      current: 6,
      previous: 6,
      max: 10,
      icon: <Users className="w-5 h-5" />,
      color: 'blue',
      trend: 'stable'
    },
    {
      name: 'Physical Activity',
      current: 8,
      previous: 7,
      max: 10,
      icon: <Activity className="w-5 h-5" />,
      color: 'purple',
      trend: 'up'
    }
  ];

  const radarData = {
    labels: metrics.map(m => m.name),
    datasets: [
      {
        label: 'Current',
        data: metrics.map(m => m.current),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)'
      },
      {
        label: 'Previous',
        data: metrics.map(m => m.previous),
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgb(156, 163, 175)',
        pointBackgroundColor: 'rgb(156, 163, 175)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(156, 163, 175)'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  return (
    <div className="wellness-metrics bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Wellness Metrics</h3>
          <p className="text-sm text-gray-600">Comprehensive health overview</p>
        </div>
        <Heart className="w-6 h-6 text-red-500" />
      </div>

      <div className="h-64 mb-6">
        <Radar data={radarData} options={radarOptions} />
      </div>

      <div className="space-y-3">
        {metrics.map(metric => (
          <div key={metric.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${metric.color}-100 text-${metric.color}-600 rounded-lg`}>
                {metric.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">{metric.name}</div>
                <div className="text-sm text-gray-600">
                  {metric.current}/{metric.max}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {metric.trend === 'up' && (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+{metric.current - metric.previous}</span>
                </div>
              )}
              {metric.trend === 'down' && (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">-{metric.previous - metric.current}</span>
                </div>
              )}
              {metric.trend === 'stable' && (
                <div className="text-gray-500 text-sm">Stable</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Crisis Intervention Analytics
const CrisisAnalytics: React.FC = () => {
  const crisisData = {
    totalEvents: 3,
    avgDuration: 45,
    lastEvent: '15 days ago',
    trend: 'decreasing',
    interventions: [
      { type: 'Breathing Exercise', success: 85 },
      { type: 'Support Chat', success: 78 },
      { type: 'Crisis Hotline', success: 92 },
      { type: 'Emergency Contact', success: 88 }
    ]
  };

  const chartData = {
    labels: crisisData.interventions.map(i => i.type),
    datasets: [
      {
        data: crisisData.interventions.map(i => i.success),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="crisis-analytics bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Crisis Management</h3>
          <p className="text-sm text-gray-600">Emergency response analytics</p>
        </div>
        <Shield className="w-6 h-6 text-red-600" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{crisisData.totalEvents}</div>
          <div className="text-xs text-gray-600">Total Events</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{crisisData.avgDuration}m</div>
          <div className="text-xs text-gray-600">Avg Duration</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{crisisData.lastEvent}</div>
          <div className="text-xs text-gray-600">Last Event</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-3">Intervention Effectiveness</h4>
        <div className="h-48">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-900">Positive Trend</span>
        </div>
        <p className="text-sm text-green-800">
          Crisis events have decreased by 40% over the past month. Your coping strategies are working effectively.
        </p>
      </div>
    </div>
  );
};

// Personal Insights Component
const PersonalInsights: React.FC = () => {
  const insights: InsightCard[] = [
    {
      id: '1',
      title: 'Sleep-Mood Connection',
      description: 'Your mood improves by 23% after nights with 7+ hours of sleep',
      type: 'positive',
      icon: <Sparkles className="w-5 h-5" />,
      action: 'Set sleep reminder'
    },
    {
      id: '2',
      title: 'Exercise Impact',
      description: 'Physical activity reduced your anxiety levels by 35% this month',
      type: 'positive',
      icon: <Activity className="w-5 h-5" />,
      action: 'Schedule workout'
    },
    {
      id: '3',
      title: 'Social Patterns',
      description: 'You feel better after connecting with friends - last contact 4 days ago',
      type: 'attention',
      icon: <Users className="w-5 h-5" />,
      action: 'Reach out to friend'
    },
    {
      id: '4',
      title: 'Meditation Streak',
      description: '7-day meditation streak! Keep it up for better mental clarity',
      type: 'positive',
      icon: <Award className="w-5 h-5" />,
      action: 'Continue streak'
    },
    {
      id: '5',
      title: 'Stress Peak Times',
      description: 'Highest stress levels detected between 2-4 PM on weekdays',
      type: 'neutral',
      icon: <Clock className="w-5 h-5" />,
      action: 'Plan breaks'
    }
  ];

  const getInsightColor = (type: InsightCard['type']) => {
    switch (type) {
      case 'positive': return 'bg-green-50 border-green-200 text-green-900';
      case 'attention': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'neutral': return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getIconColor = (type: InsightCard['type']) => {
    switch (type) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'attention': return 'text-yellow-600 bg-yellow-100';
      case 'neutral': return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="personal-insights bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Personal Insights</h3>
          <p className="text-sm text-gray-600">AI-powered wellness recommendations</p>
        </div>
        <Brain className="w-6 h-6 text-purple-600" />
      </div>

      <div className="space-y-3">
        {insights.map(insight => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getIconColor(insight.type)}`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{insight.title}</h4>
                <p className="text-sm opacity-90">{insight.description}</p>
                {insight.action && (
                  <button className="mt-2 text-sm font-medium hover:underline">
                    {insight.action} →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full mt-4 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
        Generate New Insights
      </button>
    </div>
  );
};

// Progress Summary Component
const ProgressSummary: React.FC = () => {
  const goals: TherapyProgress[] = [
    {
      goal: 'Reduce Anxiety',
      baseline: 8,
      current: 5,
      target: 3,
      trend: 'improving'
    },
    {
      goal: 'Improve Sleep',
      baseline: 4,
      current: 7,
      target: 8,
      trend: 'improving'
    },
    {
      goal: 'Daily Exercise',
      baseline: 2,
      current: 5,
      target: 7,
      trend: 'improving'
    },
    {
      goal: 'Social Activities',
      baseline: 3,
      current: 4,
      target: 6,
      trend: 'stable'
    }
  ];

  const calculateProgress = (goal: TherapyProgress) => {
    const totalDistance = Math.abs(goal.target - goal.baseline);
    const currentDistance = Math.abs(goal.current - goal.baseline);
    return Math.min(100, Math.round((currentDistance / totalDistance) * 100));
  };

  const getTrendIcon = (trend: TherapyProgress['trend']) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'stable': return <ChevronRight className="w-4 h-4 text-gray-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="progress-summary bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Goal Progress</h3>
          <p className="text-sm text-gray-600">Track your wellness journey</p>
        </div>
        <Target className="w-6 h-6 text-indigo-600" />
      </div>

      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.goal} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{goal.goal}</span>
                {getTrendIcon(goal.trend)}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {calculateProgress(goal)}%
              </span>
            </div>
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${calculateProgress(goal)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Baseline: {goal.baseline}</span>
                <span>Current: {goal.current}</span>
                <span>Target: {goal.target}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-indigo-900">Overall Progress</span>
        </div>
        <div className="text-sm text-indigo-800">
          You've achieved 68% of your wellness goals. Great progress!
        </div>
      </div>
    </div>
  );
};

// Main Analytics Dashboard Component
const AnalyticsDashboardComplete: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'export'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  return (
    <div className="analytics-dashboard-complete min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into your mental health journey</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className={`px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                refreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-6">
          {(['overview', 'detailed', 'export'] as const).map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                selectedView === view
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {selectedView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="lg:col-span-2 xl:col-span-2">
              <MoodPatternsChart />
            </div>
            <div>
              <WellnessMetrics />
            </div>
            <div>
              <SleepAnalysis />
            </div>
            <div>
              <CrisisAnalytics />
            </div>
            <div>
              <ProgressSummary />
            </div>
            <div className="lg:col-span-2 xl:col-span-3">
              <PersonalInsights />
            </div>
          </div>
        )}

        {selectedView === 'detailed' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Analytics</h2>
            <p className="text-gray-600">
              Access comprehensive data visualizations and in-depth analysis of all wellness metrics.
            </p>
            {/* Additional detailed views would go here */}
          </div>
        )}

        {selectedView === 'export' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Export Options</h2>
            <div className="space-y-4">
              <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">PDF Report</h3>
                    <p className="text-sm text-gray-600">Comprehensive wellness report in PDF format</p>
                  </div>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">CSV Data</h3>
                    <p className="text-sm text-gray-600">Raw data for external analysis</p>
                  </div>
                  <Download className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Share with Provider</h3>
                    <p className="text-sm text-gray-600">Securely share with healthcare provider</p>
                  </div>
                  <Share2 className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboardComplete;