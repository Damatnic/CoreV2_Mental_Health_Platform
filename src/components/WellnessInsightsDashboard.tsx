import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain, 
  Heart, 
  Activity,
  Award,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { useWellnessInsights } from '../hooks/useWellnessInsights';
import { Card } from './Card';

interface InsightCard {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'achievement';
  title: string;
  description: string;
  metric?: {
    value: number;
    change: number;
    label: string;
  };
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProgressMetric {
  category: string;
  current: number;
  goal: number;
  trend: 'improving' | 'stable' | 'declining';
  weeklyChange: number;
}

// Add CSS animations via style tag
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideDown {
    from { 
      opacity: 0;
      transform: translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInLeft {
    from { 
      opacity: 0;
      transform: translateX(-20px);
    }
    to { 
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInScale {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-slideDown {
    animation: slideDown 0.5s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.5s ease-out;
  }
  
  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
  }
  
  .animate-fadeInScale {
    animation: fadeInScale 0.5s ease-out;
  }
  
  .animation-delay-100 { animation-delay: 0.1s; animation-fill-mode: both; }
  .animation-delay-200 { animation-delay: 0.2s; animation-fill-mode: both; }
  .animation-delay-300 { animation-delay: 0.3s; animation-fill-mode: both; }
  .animation-delay-400 { animation-delay: 0.4s; animation-fill-mode: both; }
  .animation-delay-500 { animation-delay: 0.5s; animation-fill-mode: both; }
`;

export const WellnessInsightsDashboard: React.FC = () => {
  const {
    insights,
    patterns,
    triggers,
    copingStrategies,
    progressMetrics,
    goals,
    recommendations,
    riskLevel,
    loading,
    error,
    refreshInsights
  } = useWellnessInsights();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeInsightCategory, setActiveInsightCategory] = useState<'all' | 'mood' | 'triggers' | 'coping' | 'goals'>('all');
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  // Calculate overall wellness score based on multiple factors
  const wellnessScore = useMemo(() => {
    if (!progressMetrics) return 0;
    
    const weights = {
      moodStability: 0.3,
      copingEffectiveness: 0.25,
      goalProgress: 0.25,
      triggerManagement: 0.2
    };
    
    let score = 0;
    if (progressMetrics.moodStability) score += progressMetrics.moodStability * weights.moodStability;
    if (progressMetrics.copingEffectiveness) score += progressMetrics.copingEffectiveness * weights.copingEffectiveness;
    if (progressMetrics.goalProgress) score += progressMetrics.goalProgress * weights.goalProgress;
    if (progressMetrics.triggerManagement) score += progressMetrics.triggerManagement * weights.triggerManagement;
    
    return Math.round(score);
  }, [progressMetrics]);

  // Filter insights based on selected category
  const filteredInsights = useMemo(() => {
    if (!insights) return [];
    if (activeInsightCategory === 'all') return insights;
    
    return insights.filter(insight => {
      switch (activeInsightCategory) {
        case 'mood':
          return insight.category === 'mood_pattern';
        case 'triggers':
          return insight.category === 'trigger_identification';
        case 'coping':
          return insight.category === 'coping_strategy';
        case 'goals':
          return insight.category === 'goal_progress';
        default:
          return true;
      }
    });
  }, [insights, activeInsightCategory]);

  // Determine wellness trend
  const wellnessTrend = useMemo(() => {
    if (!progressMetrics?.weeklyChange) return 'stable';
    if (progressMetrics.weeklyChange > 5) return 'improving';
    if (progressMetrics.weeklyChange < -5) return 'declining';
    return 'stable';
  }, [progressMetrics]);

  // Auto-refresh insights periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshInsights();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [refreshInsights]);

  // Add animation styles to document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Analyzing your wellness data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">Unable to load wellness insights. Please try again later.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Wellness Score */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white animate-slideDown">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Wellness Insights</h1>
            <p className="text-white/90">Personalized analysis and recommendations</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{wellnessScore}%</div>
            <div className="text-sm text-white/80 flex items-center gap-1">
              {wellnessTrend === 'improving' && <TrendingUp className="w-4 h-4" />}
              {wellnessTrend === 'declining' && <TrendingDown className="w-4 h-4" />}
              {wellnessTrend === 'stable' && <Activity className="w-4 h-4" />}
              <span>Wellness Score</span>
            </div>
          </div>
        </div>

        {/* Risk Level Indicator */}
        {riskLevel && riskLevel !== 'low' && (
          <div
            className={`mt-4 p-3 rounded-lg animate-fadeInScale ${
              riskLevel === 'high' 
                ? 'bg-red-600/20 border border-red-400' 
                : 'bg-yellow-600/20 border border-yellow-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="font-medium">
                {riskLevel === 'high' ? 'Immediate support recommended' : 'Consider additional support'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTimeRange('week')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedTimeRange === 'week'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedTimeRange('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedTimeRange === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedTimeRange('quarter')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedTimeRange === 'quarter'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Quarter
          </button>
        </div>

        <button
          onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-800 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {showDetailedAnalysis ? 'Hide' : 'Show'} Detailed Analysis
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'mood', 'triggers', 'coping', 'goals'].map((category) => (
          <button
            key={category}
            onClick={() => setActiveInsightCategory(category as any)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              activeInsightCategory === category
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mood Patterns Card */}
        {patterns && (
          <div className="animate-fadeInScale animation-delay-100">
            <Card className="p-5 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <h3 className="font-semibold">Mood Patterns</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  patterns.trend === 'improving' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : patterns.trend === 'declining'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {patterns.trend}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Most Common Mood</p>
                  <p className="font-medium">{patterns.dominantMood || 'Neutral'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stability Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${patterns.stability || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{patterns.stability || 0}%</span>
                  </div>
                </div>
                
                {patterns.insight && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    "{patterns.insight}"
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Trigger Analysis Card */}
        {triggers && triggers.length > 0 && (
          <div className="animate-fadeInScale animation-delay-200">
            <Card className="p-5 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold">Top Triggers</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {triggers.length} identified
                </span>
              </div>
              
              <div className="space-y-3">
                {triggers.slice(0, 3).map((trigger, index) => (
                  <div key={trigger.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium">{trigger.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${trigger.impact * 20}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {trigger.frequency}x
                      </span>
                    </div>
                  </div>
                ))}
                
                {triggers.length > 3 && (
                  <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    View all {triggers.length} triggers →
                  </button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Coping Strategies Effectiveness */}
        {copingStrategies && copingStrategies.length > 0 && (
          <div className="animate-fadeInScale animation-delay-300">
            <Card className="p-5 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Effective Strategies</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Top 3
                </span>
              </div>
              
              <div className="space-y-3">
                {copingStrategies.slice(0, 3).map((strategy) => (
                  <div key={strategy.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{strategy.name}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {strategy.effectiveness}% effective
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${strategy.effectiveness}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {strategy.timesUsed}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Goals Progress Section */}
      {goals && goals.length > 0 && (
        <div className="animate-slideUp animation-delay-400">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Goal Progress
              </h3>
              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Manage Goals →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{goal.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {goal.category}
                      </p>
                    </div>
                    {goal.progress >= 100 && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          goal.progress >= 100 
                            ? 'bg-green-500' 
                            : goal.progress >= 75 
                            ? 'bg-blue-500'
                            : goal.progress >= 50
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      />
                    </div>
                    {goal.deadline && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="animate-slideUp animation-delay-500">
          <Card className="p-6 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec, index) => (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg animate-slideInLeft"
                  style={{ animationDelay: `${0.1 * index}s`, animationFillMode: 'both' }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    rec.priority === 'high' 
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                      : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  }`}>
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{rec.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {rec.description}
                    </p>
                    {rec.action && (
                      <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                        {rec.action} →
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rec.category === 'mood' 
                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
                        : rec.category === 'coping'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : rec.category === 'activity'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {rec.category}
                    </span>
                    {rec.confidence && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {rec.confidence}% match
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Analysis Modal */}
      {showDetailedAnalysis && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowDetailedAnalysis(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Detailed Wellness Analysis</h2>
              <button
                onClick={() => setShowDetailedAnalysis(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Detailed content would go here */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Comprehensive Mood Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your mood patterns over the selected period show interesting trends...
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Trigger Correlation Matrix</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We've identified correlations between your triggers and mood changes...
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Predictive Insights</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Based on your patterns, here's what we predict for the coming period...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};