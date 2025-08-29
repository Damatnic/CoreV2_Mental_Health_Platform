/**
 * Enhanced Dashboard View
 * Comprehensive wellness dashboard with advanced analytics and personalized insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartIcon,
  UsersIcon,
  ShieldIcon,
  SparkleIcon,
  TrendingUpIcon,
  BookIcon,
  CalendarIcon,
  ActivityIcon,
  SmileIcon,
  MoonIcon,
  SunIcon,
  CloudIcon,
  BrainIcon,
  TargetIcon,
  AwardIcon,
  ClockIcon
} from '../components/icons.dynamic';
import { Card } from '../components/Card';
import { ViewHeader } from '../components/ViewHeader';
import { AppButton } from '../components/AppButton';
import { ProgressBar } from '../components/ui/Progress';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import '../styles/modern-therapeutic-design.css';

export interface WellnessStat {
  id: string;
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.FC<any>;
  description: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  gradient: string;
  delay: number;
  category: 'wellness' | 'social' | 'crisis' | 'tools';
  priority: 'high' | 'medium' | 'low';
}

export interface MoodData {
  date: string;
  mood: string;
  emoji: string;
  color: string;
  gradient: string;
  score: number;
  notes?: string;
}

export interface WellnessGoal {
  id: string;
  title: string;
  description: string;
  category: 'mental' | 'physical' | 'social' | 'spiritual';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  icon: React.FC<any>;
}

export interface InsightCard {
  id: string;
  type: 'tip' | 'achievement' | 'recommendation' | 'alert';
  title: string;
  content: string;
  icon: React.FC<any>;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionHandler?: () => void;
  dismissible: boolean;
}

const WELLNESS_STATS: WellnessStat[] = [
  {
    id: 'mood-trend',
    label: 'Mood Trend',
    value: '7.2',
    change: 0.8,
    trend: 'up',
    color: '#10b981',
    icon: SmileIcon,
    description: '7-day average mood score'
  },
  {
    id: 'session-streak',
    label: 'Session Streak',
    value: 12,
    change: 2,
    trend: 'up',
    color: '#f59e0b',
    icon: ActivityIcon,
    description: 'Consecutive days with mindfulness practice'
  },
  {
    id: 'sleep-quality',
    label: 'Sleep Quality',
    value: '85%',
    change: -5,
    trend: 'down',
    color: '#6366f1',
    icon: MoonIcon,
    description: 'Average sleep quality this week'
  },
  {
    id: 'social-connections',
    label: 'Social Score',
    value: 6.5,
    change: 1.2,
    trend: 'up',
    color: '#ec4899',
    icon: UsersIcon,
    description: 'Peer support engagement level'
  }
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'breathing-exercise',
    title: 'Quick Breathing',
    description: '5-minute calming session',
    icon: CloudIcon,
    gradient: 'from-blue-400 to-cyan-400',
    delay: 0,
    category: 'wellness',
    priority: 'high'
  },
  {
    id: 'mood-check',
    title: 'Mood Check-in',
    description: 'Log your current feelings',
    icon: HeartIcon,
    gradient: 'from-pink-400 to-rose-400',
    delay: 100,
    category: 'wellness',
    priority: 'high'
  },
  {
    id: 'peer-connect',
    title: 'Find Support',
    description: 'Connect with peers',
    icon: UsersIcon,
    gradient: 'from-purple-400 to-indigo-400',
    delay: 200,
    category: 'social',
    priority: 'medium'
  },
  {
    id: 'crisis-resources',
    title: 'Crisis Resources',
    description: 'Immediate help available',
    icon: ShieldIcon,
    gradient: 'from-red-400 to-pink-400',
    delay: 300,
    category: 'crisis',
    priority: 'high'
  },
  {
    id: 'guided-meditation',
    title: 'Meditation',
    description: 'Guided mindfulness session',
    icon: BrainIcon,
    gradient: 'from-green-400 to-emerald-400',
    delay: 400,
    category: 'wellness',
    priority: 'medium'
  },
  {
    id: 'journal-entry',
    title: 'Journal',
    description: 'Write your thoughts',
    icon: BookIcon,
    gradient: 'from-amber-400 to-orange-400',
    delay: 500,
    category: 'tools',
    priority: 'medium'
  }
];

const SAMPLE_MOOD_DATA: MoodData[] = [
  {
    date: '2024-01-15',
    mood: 'Great',
    emoji: '😊',
    color: '#10b981',
    gradient: 'from-green-400 to-emerald-400',
    score: 8,
    notes: 'Had a productive therapy session'
  },
  {
    date: '2024-01-14',
    mood: 'Good',
    emoji: '🙂',
    color: '#3b82f6',
    gradient: 'from-blue-400 to-cyan-400',
    score: 7
  },
  {
    date: '2024-01-13',
    mood: 'Okay',
    emoji: '😐',
    color: '#f59e0b',
    gradient: 'from-amber-400 to-yellow-400',
    score: 5
  },
  {
    date: '2024-01-12',
    mood: 'Challenging',
    emoji: '😔',
    color: '#ef4444',
    gradient: 'from-red-400 to-rose-400',
    score: 3,
    notes: 'Difficult day, but used coping strategies'
  },
  {
    date: '2024-01-11',
    mood: 'Good',
    emoji: '🙂',
    color: '#3b82f6',
    gradient: 'from-blue-400 to-cyan-400',
    score: 7
  }
];

const WELLNESS_GOALS: WellnessGoal[] = [
  {
    id: 'daily-meditation',
    title: 'Daily Meditation',
    description: 'Complete 10 minutes of mindfulness daily',
    category: 'mental',
    targetValue: 7,
    currentValue: 5,
    unit: 'days/week',
    deadline: new Date('2024-02-15'),
    priority: 'high',
    icon: BrainIcon
  },
  {
    id: 'social-connections',
    title: 'Social Connections',
    description: 'Engage with peer support network',
    category: 'social',
    targetValue: 3,
    currentValue: 2,
    unit: 'interactions/week',
    deadline: new Date('2024-02-01'),
    priority: 'medium',
    icon: UsersIcon
  },
  {
    id: 'sleep-schedule',
    title: 'Sleep Schedule',
    description: 'Maintain consistent sleep routine',
    category: 'physical',
    targetValue: 8,
    currentValue: 6,
    unit: 'hours/night',
    deadline: new Date('2024-02-28'),
    priority: 'high',
    icon: MoonIcon
  }
];

const EnhancedDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate personalized insights based on user data
  const generateInsights = useMemo((): InsightCard[] => {
    const currentMoodTrend = WELLNESS_STATS.find(s => s.id === 'mood-trend');
    const sessionStreak = WELLNESS_STATS.find(s => s.id === 'session-streak');
    const insights: InsightCard[] = [];

    // Mood trend insight
    if (currentMoodTrend && currentMoodTrend.trend === 'up') {
      insights.push({
        id: 'mood-improvement',
        type: 'achievement',
        title: 'Mood Improving! 🎉',
        content: `Your mood has improved by ${currentMoodTrend.change} points this week. Keep up the great work!`,
        icon: TrendingUpIcon,
        priority: 'high',
        dismissible: true
      });
    }

    // Session streak achievement
    if (sessionStreak && typeof sessionStreak.value === 'number' && sessionStreak.value >= 10) {
      insights.push({
        id: 'streak-achievement',
        type: 'achievement',
        title: 'Amazing Streak!',
        content: `${sessionStreak.value} days of consistent practice! You're building strong mental health habits.`,
        icon: AwardIcon,
        priority: 'medium',
        dismissible: true
      });
    }

    // Wellness tip
    insights.push({
      id: 'daily-tip',
      type: 'tip',
      title: 'Today\'s Wellness Tip',
      content: 'Try the 5-4-3-2-1 grounding technique when feeling overwhelmed: notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.',
      icon: SparkleIcon,
      priority: 'low',
      dismissible: true
    });

    return insights;
  }, []);

  useEffect(() => {
    setInsights(generateInsights);
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [generateInsights]);

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'breathing-exercise':
        showNotification('Take deep breaths and relax', 'info');
        // Navigate to breathing exercise
        break;
      case 'mood-check':
        showNotification('How are you feeling today?', 'info');
        // Navigate to mood logging
        break;
      case 'peer-connect':
        showNotification('Finding available support', 'info');
        // Navigate to peer support
        break;
      case 'crisis-resources':
        showNotification('Help is available 24/7', 'warning');
        // Navigate to crisis resources
        break;
      default:
        showNotification('This feature will be available soon', 'info');
    }
  };

  const dismissInsight = (insightId: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId));
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const name = user?.username || user?.email || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const getMoodTrendData = () => {
    return SAMPLE_MOOD_DATA.slice(-7).map(data => ({
      ...data,
      date: new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
  };

  if (isLoading) {
    return (
      <div className="enhanced-dashboard-view loading">
        <div className="loading-spinner">
          <SparkleIcon className="w-8 h-8 animate-spin" />
          <p>Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard-view">
      <ViewHeader 
        title={getGreeting()}
        subtitle="Your personalized wellness journey"
      />

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="insights-section">
          {insights.map((insight, index) => (
            <Card 
              key={insight.id} 
              className={`insight-card insight-${insight.type} priority-${insight.priority}`}
            >
              <div className="insight-header">
                <div className="insight-icon">
                  <div className="w-5 h-5">
                    <insight.icon />
                  </div>
                </div>
                <h3>{insight.title}</h3>
                {insight.dismissible && (
                  <button 
                    className="dismiss-btn"
                    onClick={() => dismissInsight(insight.id)}
                    aria-label="Dismiss insight"
                  >
                    ×
                  </button>
                )}
              </div>
              <p>{insight.content}</p>
              {insight.actionLabel && insight.actionHandler && (
                <AppButton 
                  variant="secondary" 
                  size="sm"
                  onClick={insight.actionHandler}
                >
                  {insight.actionLabel}
                </AppButton>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Wellness Stats Grid */}
      <div className="wellness-stats-grid">
        {WELLNESS_STATS.map((stat, index) => (
          <Card 
            key={stat.id} 
            className="wellness-stat-card"
          >
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
                <div className="w-5 h-5" style={{ color: stat.color }}>
                  <stat.icon />
                </div>
              </div>
              <div className="stat-trend">
                <div 
                  className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}
                  style={{ 
                    transform: stat.trend === 'down' ? 'rotate(180deg)' : stat.trend === 'stable' ? 'rotate(90deg)' : 'none'
                  }}
                >
                  <TrendingUpIcon />
                </div>
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-change">
                <span className={stat.trend === 'up' ? 'positive' : stat.trend === 'down' ? 'negative' : 'neutral'}>
                  {stat.change > 0 ? '+' : ''}{stat.change}
                </span>
                <span className="stat-description">{stat.description}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="quick-actions-card">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((action, index) => (
            <div
              key={action.id}
              className={`quick-action-item priority-${action.priority}`}
              onClick={() => handleQuickAction(action.id)}
            >
              <div className={`action-icon bg-gradient-to-r ${action.gradient}`}>
                <div className="w-6 h-6 text-white">
                  <action.icon />
                </div>
              </div>
              <div className="action-content">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mood Trend Visualization */}
      <Card className="mood-trend-card">
        <div className="card-header">
          <h3>Mood Trend</h3>
          <div className="timeframe-selector">
            {(['week', 'month', 'year'] as const).map((timeframe) => (
              <button
                key={timeframe}
                className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="mood-chart">
          {getMoodTrendData().map((data, index) => (
            <div key={index} className="mood-data-point">
              <div 
                className="mood-bar"
                style={{ 
                  height: `${(data.score / 10) * 100}%`,
                  backgroundColor: data.color 
                }}
              />
              <div className="mood-emoji">{data.emoji}</div>
              <div className="mood-date">{data.date}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Wellness Goals */}
      <Card className="wellness-goals-card">
        <h3>Wellness Goals</h3>
        <div className="goals-list">
          {WELLNESS_GOALS.map((goal) => {
            const progress = (goal.currentValue / goal.targetValue) * 100;
            const isOverdue = new Date() > goal.deadline;
            
            return (
              <div key={goal.id} className={`goal-item priority-${goal.priority}`}>
                <div className="goal-header">
                  <div className="goal-icon">
                    <div className="w-5 h-5">
                      <goal.icon />
                    </div>
                  </div>
                  <div className="goal-info">
                    <h4>{goal.title}</h4>
                    <p>{goal.description}</p>
                  </div>
                  <div className="goal-deadline">
                    <div className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                      <ClockIcon />
                    </div>
                    <span className={isOverdue ? 'text-red-500' : 'text-gray-600'}>
                      {goal.deadline.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="goal-progress">
                  <div className="progress-info">
                    <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar 
                    value={progress} 
                    max={100}
                    color={isOverdue ? 'red' : 'green'}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="recent-activity-card">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <div className="w-4 h-4 text-blue-500">
                <CloudIcon />
              </div>
            </div>
            <div className="activity-content">
              <span>Completed breathing exercise</span>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <div className="w-4 h-4 text-pink-500">
                <HeartIcon />
              </div>
            </div>
            <div className="activity-content">
              <span>Logged mood: Good (7/10)</span>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <div className="w-4 h-4 text-purple-500">
                <UsersIcon />
              </div>
            </div>
            <div className="activity-content">
              <span>Connected with peer supporter</span>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedDashboardView;
