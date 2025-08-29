import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Heart, MessageCircle, Calendar, Award, AlertTriangle } from 'lucide-react';

interface WellnessMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'mood' | 'engagement' | 'support' | 'crisis' | 'growth';
  description: string;
  color: string;
}

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  averageMoodScore: number;
  supportInteractions: number;
  crisisInterventions: number;
  wellnessResources: number;
  memberRetention: number;
  satisfactionScore: number;
  weeklyGrowth: number;
  communityHealth: 'excellent' | 'good' | 'fair' | 'needs_attention';
}

interface CommunityWellnessIndicatorProps {
  communityId?: string;
  showDetailedMetrics?: boolean;
  refreshInterval?: number; // milliseconds
  className?: string;
  onMetricClick?: (metric: WellnessMetric) => void;
  onCrisisAlert?: (data: { level: string; details: string }) => void;
}

export const CommunityWellnessIndicator: React.FC<CommunityWellnessIndicatorProps> = ({
  communityId = 'general',
  showDetailedMetrics = false,
  refreshInterval = 300000, // 5 minutes
  className = '',
  onMetricClick,
  onCrisisAlert
}) => {
  const [metrics, setMetrics] = useState<WellnessMetric[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockMetrics: WellnessMetric[] = [
    {
      id: 'mood-average',
      name: 'Community Mood',
      value: 7.2,
      previousValue: 6.8,
      unit: '/10',
      trend: 'up',
      category: 'mood',
      description: 'Average mood score across all active members',
      color: 'text-green-600'
    },
    {
      id: 'active-members',
      name: 'Active Members',
      value: 1847,
      previousValue: 1793,
      unit: 'members',
      trend: 'up',
      category: 'engagement',
      description: 'Members who engaged in the last 7 days',
      color: 'text-blue-600'
    },
    {
      id: 'support-interactions',
      name: 'Support Interactions',
      value: 342,
      previousValue: 298,
      unit: 'interactions',
      trend: 'up',
      category: 'support',
      description: 'Peer support interactions this week',
      color: 'text-purple-600'
    },
    {
      id: 'crisis-responses',
      name: 'Crisis Support',
      value: 12,
      previousValue: 18,
      unit: 'responses',
      trend: 'down',
      category: 'crisis',
      description: 'Crisis interventions this week (lower is better)',
      color: 'text-red-600'
    },
    {
      id: 'wellness-engagement',
      name: 'Wellness Resources',
      value: 89,
      previousValue: 84,
      unit: '%',
      trend: 'up',
      category: 'growth',
      description: 'Members actively using wellness resources',
      color: 'text-emerald-600'
    }
  ];

  const mockStats: CommunityStats = {
    totalMembers: 2456,
    activeMembers: 1847,
    averageMoodScore: 7.2,
    supportInteractions: 342,
    crisisInterventions: 12,
    wellnessResources: 89,
    memberRetention: 94.5,
    satisfactionScore: 4.7,
    weeklyGrowth: 3.2,
    communityHealth: 'good'
  };

  useEffect(() => {
    const fetchWellnessData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMetrics(mockMetrics);
        setCommunityStats(mockStats);
        setLastUpdated(new Date());

        // Check for crisis alerts
        const crisisMetric = mockMetrics.find(m => m.category === 'crisis');
        if (crisisMetric && crisisMetric.value > 15) {
          onCrisisAlert?.({
            level: 'high',
            details: `Crisis interventions have increased to ${crisisMetric.value} this week`
          });
        }

      } catch (err) {
        setError('Failed to load wellness data');
        console.error('Error fetching wellness data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWellnessData();

    // Set up refresh interval
    const interval = setInterval(fetchWellnessData, refreshInterval);
    return () => clearInterval(interval);
  }, [communityId, refreshInterval, onCrisisAlert]);

  const getHealthColor = (health: CommunityStats['communityHealth']) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'needs_attention': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: WellnessMetric['trend'], category: string) => {
    const isPositiveTrend = category === 'crisis' ? trend === 'down' : trend === 'up';
    
    if (trend === 'stable') {
      return null;
    }

    return isPositiveTrend ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getCategoryIcon = (category: WellnessMetric['category']) => {
    switch (category) {
      case 'mood': return <Heart className="w-5 h-5" />;
      case 'engagement': return <Users className="w-5 h-5" />;
      case 'support': return <MessageCircle className="w-5 h-5" />;
      case 'crisis': return <AlertTriangle className="w-5 h-5" />;
      case 'growth': return <Award className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === '/10') {
      return `${value.toFixed(1)}/10`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ${unit}`;
    }
    return `${value} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Error loading wellness data</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Community Wellness
              </h3>
              <p className="text-sm text-gray-600">
                Real-time community health metrics
              </p>
            </div>
          </div>

          {communityStats && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(communityStats.communityHealth)}`}>
              {communityStats.communityHealth.replace('_', ' ').toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onMetricClick?.(metric)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center ${metric.color}`}>
                  {getCategoryIcon(metric.category)}
                </div>
                {getTrendIcon(metric.trend, metric.category)}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">
                  {formatValue(metric.value, metric.unit)}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {metric.name}
                </div>
                <div className="text-xs text-gray-500">
                  {metric.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Stats */}
        {showDetailedMetrics && communityStats && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              Additional Community Insights
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {communityStats.memberRetention.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Member Retention</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {communityStats.satisfactionScore.toFixed(1)}/5
                </div>
                <div className="text-xs text-gray-600">Satisfaction Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  +{communityStats.weeklyGrowth.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Weekly Growth</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {((communityStats.activeMembers / communityStats.totalMembers) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Active Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {lastUpdated && (
              <span>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Updates every {Math.floor(refreshInterval / 60000)} minutes
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityWellnessIndicator;
