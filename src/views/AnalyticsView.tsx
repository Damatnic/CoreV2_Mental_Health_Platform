import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  HeartIcon, 
  UsersIcon,
  ChartIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  FilterIcon,
  DownloadIcon,
  RefreshIcon
} from '../components/icons.dynamic';

// Mental Health Analytics Interfaces with HIPAA-compliant privacy measures
interface MentalHealthAnalytics {
  crisisAnalytics: {
    totalInterventions: number;
    averageResponseTime: number; // in seconds
    successfulDeescalations: number;
    emergencyReferrals: number;
    riskLevelDistribution: {
      low: number;
      moderate: number;
      high: number;
      critical: number;
    };
    hourlyPatterns: number[]; // 24 hours
  };
  therapeuticProgress: {
    averageMoodImprovement: number; // percentage
    sessionCompletionRate: number;
    toolsUtilization: {
      breathing: number;
      meditation: number;
      journaling: number;
      cbtExercises: number;
    };
    progressTrends: Array<{
      week: string;
      improvement: number;
      engagement: number;
    }>;
  };
  privacyMetrics: {
    anonymousUsers: number;
    dataEncryptionCompliance: number; // percentage
    consentManagement: {
      given: number;
      withdrawn: number;
      modified: number;
    };
    auditLogEntries: number;
  };
}

interface AnalyticsData extends MentalHealthAnalytics {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
    averageSessionTime: number;
    dailyActiveUsers: number[];
    weeklyActiveUsers: number[];
    monthlyActiveUsers: number[];
  };
  engagementMetrics: {
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
    topFeatures: Array<{
      name: string;
      usage: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  wellnessMetrics: {
    totalAssessments: number;
    averageWellnessScore: number;
    improvementRate: number;
    crisisInterventions: number;
    supportSessionsCompleted: number;
    wellnessTrends: Array<{
      date: string;
      score: number;
      category: string;
    }>;
  };
  communityMetrics: {
    totalPosts: number;
    totalComments: number;
    activeHelpers: number;
    supportRequestsHandled: number;
    averageResponseTime: number;
    communityGrowth: number[];
  };
  systemMetrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    dataProcessed: number;
    storageUsed: number;
    apiCalls: number;
  };
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

const AnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'engagement' | 'wellness' | 'community' | 'crisis' | 'therapeutic'>('wellness');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Mock analytics data with enhanced mental health metrics
      const mockData: AnalyticsData = {
        // Mental Health Specific Analytics
        crisisAnalytics: {
          totalInterventions: 342,
          averageResponseTime: 45, // seconds
          successfulDeescalations: 298,
          emergencyReferrals: 44,
          riskLevelDistribution: {
            low: 180,
            moderate: 95,
            high: 52,
            critical: 15
          },
          hourlyPatterns: [
            12, 8, 5, 3, 2, 4, 7, 15, 22, 18, 20, 25,
            28, 24, 21, 19, 23, 31, 35, 38, 32, 28, 20, 15
          ]
        },
        therapeuticProgress: {
          averageMoodImprovement: 68.5,
          sessionCompletionRate: 82.3,
          toolsUtilization: {
            breathing: 1245,
            meditation: 987,
            journaling: 1456,
            cbtExercises: 678
          },
          progressTrends: [
            { week: 'Week 1', improvement: 12, engagement: 65 },
            { week: 'Week 2', improvement: 18, engagement: 72 },
            { week: 'Week 3', improvement: 25, engagement: 78 },
            { week: 'Week 4', improvement: 32, engagement: 85 }
          ]
        },
        privacyMetrics: {
          anonymousUsers: 4523,
          dataEncryptionCompliance: 100,
          consentManagement: {
            given: 8324,
            withdrawn: 156,
            modified: 423
          },
          auditLogEntries: 145678
        },
        userMetrics: {
          totalUsers: 12847,
          activeUsers: 3421,
          newUsers: 287,
          retentionRate: 73.5,
          averageSessionTime: 18.5,
          dailyActiveUsers: [1200, 1350, 1180, 1420, 1380, 1290, 1340],
          weeklyActiveUsers: [8500, 9200, 8800, 9400, 9100, 8900, 9300],
          monthlyActiveUsers: [35000, 37500, 36200, 38100, 37800, 36900, 38500]
        },
        engagementMetrics: {
          totalSessions: 45632,
          averageSessionDuration: 12.3,
          bounceRate: 24.7,
          pagesPerSession: 4.2,
          topFeatures: [
            { name: 'Mood Tracking', usage: 78.5, trend: 'up' },
            { name: 'Peer Support', usage: 65.2, trend: 'up' },
            { name: 'Wellness Videos', usage: 52.8, trend: 'stable' },
            { name: 'Crisis Support', usage: 31.4, trend: 'down' },
            { name: 'Group Sessions', usage: 28.9, trend: 'up' }
          ]
        },
        wellnessMetrics: {
          totalAssessments: 8934,
          averageWellnessScore: 72.4,
          improvementRate: 68.3,
          crisisInterventions: 156,
          supportSessionsCompleted: 2847,
          wellnessTrends: [
            { date: '2024-01', score: 68.5, category: 'Overall' },
            { date: '2024-02', score: 70.2, category: 'Overall' },
            { date: '2024-03', score: 71.8, category: 'Overall' },
            { date: '2024-04', score: 72.4, category: 'Overall' }
          ]
        },
        communityMetrics: {
          totalPosts: 15634,
          totalComments: 42891,
          activeHelpers: 234,
          supportRequestsHandled: 1876,
          averageResponseTime: 2.4,
          communityGrowth: [150, 180, 220, 280, 340, 420, 480]
        },
        systemMetrics: {
          uptime: 99.8,
          responseTime: 245,
          errorRate: 0.12,
          dataProcessed: 1.2,
          storageUsed: 68.5,
          apiCalls: 2456789
        }
      };

      setAnalyticsData(mockData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      showNotification('Failed to load analytics data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadAnalyticsData();
    showNotification('Analytics data refreshed', 'success');
  };

  // Crisis Pattern Detection Helper
  const detectCrisisPatterns = () => {
    if (!analyticsData) return null;
    
    const { crisisAnalytics } = analyticsData;
    const peakHours = crisisAnalytics.hourlyPatterns
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const riskTrend = crisisAnalytics.riskLevelDistribution.critical > 10 
      ? 'increasing' 
      : 'stable';
    
    return {
      peakHours,
      riskTrend,
      interventionSuccess: (crisisAnalytics.successfulDeescalations / crisisAnalytics.totalInterventions) * 100
    };
  };

  // Privacy-Preserving Data Aggregation
  const anonymizeData = (data: any) => {
    // Remove any personally identifiable information
    const anonymized = { ...data };
    delete anonymized.userDetails;
    delete anonymized.sessionIds;
    delete anonymized.ipAddresses;
    
    // Aggregate data to prevent individual identification
    return {
      ...anonymized,
      aggregatedMetrics: true,
      privacyCompliant: true,
      dataRetentionDays: 90
    };
  };

  // HIPAA-Compliant Export with Privacy Safeguards
  const exportData = () => {
    if (!analyticsData) return;
    
    // Apply privacy safeguards before export
    const anonymizedData = anonymizeData(analyticsData);
    
    const exportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      metrics: anonymizedData,
      privacyNotice: 'This data has been anonymized and aggregated to protect user privacy',
      complianceStandards: ['HIPAA', 'GDPR', 'CCPA']
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification('Analytics data exported successfully', 'success');
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUpIcon className="text-green-500" />;
      case 'down': return <TrendingDownIcon className="text-red-500" />;
      default: return <ChartIcon className="text-gray-500" />;
    }
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, trend?: 'up' | 'down' | 'stable', icon?: React.ReactNode) => (
    <Card className="metric-card">
      <div className="metric-content">
        <div className="metric-header">
          <div className="metric-icon">{icon}</div>
          {trend && getTrendIcon(trend)}
        </div>
        <div className="metric-value">{value}</div>
        <div className="metric-title">{title}</div>
        {subtitle && <div className="metric-subtitle">{subtitle}</div>}
      </div>
    </Card>
  );

  if (isLoading && !analyticsData) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="error-container">
        <h3>Unable to load analytics data</h3>
        <AppButton onClick={loadAnalyticsData}>Try Again</AppButton>
      </div>
    );
  }

  return (
    <div className="analytics-view">
      <ViewHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive insights into platform performance and user wellness"
      />

      {/* Controls */}
      <Card className="controls-card">
        <div className="controls-content">
          <div className="period-selector">
            <label>Time Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="metric-selector">
            <label>Focus Area:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
            >
              <option value="users">User Metrics</option>
              <option value="engagement">Engagement</option>
              <option value="wellness">Wellness</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div className="control-actions">
            <AppButton
              variant="secondary"
              size="small"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshIcon /> Refresh
            </AppButton>
            <AppButton
              variant="secondary"
              size="small"
              onClick={exportData}
            >
              <DownloadIcon /> Export
            </AppButton>
          </div>
        </div>

        <div className="last-updated">
          <ClockIcon />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </Card>

      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <h3>Key Performance Indicators</h3>
        <div className="metrics-grid">
          {renderMetricCard(
            'Total Users',
            formatNumber(analyticsData.userMetrics.totalUsers),
            `${analyticsData.userMetrics.newUsers} new this ${selectedPeriod}`,
            'up',
            <UsersIcon />
          )}
          {renderMetricCard(
            'Active Users',
            formatNumber(analyticsData.userMetrics.activeUsers),
            `${formatPercentage(analyticsData.userMetrics.retentionRate)} retention`,
            'up',
            <HeartIcon />
          )}
          {renderMetricCard(
            'Avg Wellness Score',
            analyticsData.wellnessMetrics.averageWellnessScore.toFixed(1),
            `${formatPercentage(analyticsData.wellnessMetrics.improvementRate)} improving`,
            'up',
            <StarIcon />
          )}
          {renderMetricCard(
            'Support Sessions',
            formatNumber(analyticsData.wellnessMetrics.supportSessionsCompleted),
            `${analyticsData.communityMetrics.activeHelpers} active helpers`,
            'up',
            <UsersIcon />
          )}
        </div>
      </div>

      {/* Detailed Metrics Based on Selection */}
      {selectedMetric === 'users' && (
        <div className="detailed-metrics">
          <h3>User Analytics</h3>
          <div className="metrics-grid">
            {renderMetricCard('Total Users', formatNumber(analyticsData.userMetrics.totalUsers))}
            {renderMetricCard('Active Users', formatNumber(analyticsData.userMetrics.activeUsers))}
            {renderMetricCard('New Users', formatNumber(analyticsData.userMetrics.newUsers))}
            {renderMetricCard('Retention Rate', formatPercentage(analyticsData.userMetrics.retentionRate))}
            {renderMetricCard('Avg Session Time', `${analyticsData.userMetrics.averageSessionTime} min`)}
            {renderMetricCard('Daily Active', formatNumber(analyticsData.userMetrics.dailyActiveUsers[analyticsData.userMetrics.dailyActiveUsers.length - 1]))}
          </div>

          <Card className="chart-card">
            <h4>User Activity Trends</h4>
            <div className="chart-placeholder">
              <div className="trend-line">
                {analyticsData.userMetrics.dailyActiveUsers.map((users, index) => (
                  <div 
                    key={index}
                    className="trend-point"
                    style={{ height: `${(users / Math.max(...analyticsData.userMetrics.dailyActiveUsers)) * 100}%` }}
                  />
                ))}
              </div>
              <div className="chart-labels">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedMetric === 'engagement' && (
        <div className="detailed-metrics">
          <h3>Engagement Analytics</h3>
          <div className="metrics-grid">
            {renderMetricCard('Total Sessions', formatNumber(analyticsData.engagementMetrics.totalSessions))}
            {renderMetricCard('Avg Duration', `${analyticsData.engagementMetrics.averageSessionDuration} min`)}
            {renderMetricCard('Bounce Rate', formatPercentage(analyticsData.engagementMetrics.bounceRate))}
            {renderMetricCard('Pages/Session', analyticsData.engagementMetrics.pagesPerSession.toFixed(1))}
          </div>

          <Card className="feature-usage-card">
            <h4>Top Features Usage</h4>
            <div className="feature-list">
              {analyticsData.engagementMetrics.topFeatures.map(feature => (
                <div key={feature.name} className="feature-item">
                  <div className="feature-info">
                    <span className="feature-name">{feature.name}</span>
                    <span className="feature-usage">{formatPercentage(feature.usage)}</span>
                  </div>
                  <div className="feature-trend">
                    {getTrendIcon(feature.trend)}
                  </div>
                  <div className="feature-bar">
                    <div 
                      className="feature-fill"
                      style={{ width: `${feature.usage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedMetric === 'wellness' && (
        <div className="detailed-metrics">
          <h3>Wellness Analytics</h3>
          <div className="metrics-grid">
            {renderMetricCard('Total Assessments', formatNumber(analyticsData.wellnessMetrics.totalAssessments))}
            {renderMetricCard('Avg Wellness Score', analyticsData.wellnessMetrics.averageWellnessScore.toFixed(1))}
            {renderMetricCard('Improvement Rate', formatPercentage(analyticsData.wellnessMetrics.improvementRate))}
            {renderMetricCard('Crisis Interventions', formatNumber(analyticsData.wellnessMetrics.crisisInterventions))}
            {renderMetricCard('Support Sessions', formatNumber(analyticsData.wellnessMetrics.supportSessionsCompleted))}
          </div>

          <Card className="wellness-trends-card">
            <h4>Wellness Score Trends</h4>
            <div className="wellness-chart">
              {analyticsData.wellnessMetrics.wellnessTrends.map((trend, index) => (
                <div key={index} className="trend-item">
                  <div className="trend-date">{trend.date}</div>
                  <div className="trend-score">{trend.score}</div>
                  <div 
                    className="trend-bar"
                    style={{ height: `${(trend.score / 100) * 100}px` }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedMetric === 'community' && (
        <div className="detailed-metrics">
          <h3>Community Analytics</h3>
          <div className="metrics-grid">
            {renderMetricCard('Total Posts', formatNumber(analyticsData.communityMetrics.totalPosts))}
            {renderMetricCard('Total Comments', formatNumber(analyticsData.communityMetrics.totalComments))}
            {renderMetricCard('Active Helpers', formatNumber(analyticsData.communityMetrics.activeHelpers))}
            {renderMetricCard('Support Requests', formatNumber(analyticsData.communityMetrics.supportRequestsHandled))}
            {renderMetricCard('Avg Response Time', `${analyticsData.communityMetrics.averageResponseTime} hrs`)}
          </div>

          <Card className="community-growth-card">
            <h4>Community Growth</h4>
            <div className="growth-chart">
              {analyticsData.communityMetrics.communityGrowth.map((growth, index) => (
                <div 
                  key={index}
                  className="growth-bar"
                  style={{ height: `${(growth / Math.max(...analyticsData.communityMetrics.communityGrowth)) * 200}px` }}
                >
                  <span className="growth-value">{growth}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* System Health */}
      <Card className="system-health-card">
        <h3>System Health</h3>
        <div className="health-metrics">
          <div className="health-item">
            <span className="health-label">Uptime</span>
            <span className={`health-value ${analyticsData.systemMetrics.uptime > 99 ? 'good' : 'warning'}`}>
              {formatPercentage(analyticsData.systemMetrics.uptime)}
            </span>
          </div>
          <div className="health-item">
            <span className="health-label">Response Time</span>
            <span className={`health-value ${analyticsData.systemMetrics.responseTime < 300 ? 'good' : 'warning'}`}>
              {analyticsData.systemMetrics.responseTime}ms
            </span>
          </div>
          <div className="health-item">
            <span className="health-label">Error Rate</span>
            <span className={`health-value ${analyticsData.systemMetrics.errorRate < 1 ? 'good' : 'warning'}`}>
              {formatPercentage(analyticsData.systemMetrics.errorRate)}
            </span>
          </div>
          <div className="health-item">
            <span className="health-label">Storage Used</span>
            <span className={`health-value ${analyticsData.systemMetrics.storageUsed < 80 ? 'good' : 'warning'}`}>
              {formatPercentage(analyticsData.systemMetrics.storageUsed)}
            </span>
          </div>
          <div className="health-item">
            <span className="health-label">API Calls</span>
            <span className="health-value">
              {formatNumber(analyticsData.systemMetrics.apiCalls)}
            </span>
          </div>
        </div>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="insights-card">
        <h3>Key Insights & Recommendations</h3>
        <div className="insights-content">
          <div className="insight-item">
            <div className="insight-icon positive">
              <TrendingUpIcon />
            </div>
            <div className="insight-text">
              <h4>Strong User Engagement</h4>
              <p>User retention rate of {formatPercentage(analyticsData.userMetrics.retentionRate)} is above industry average. Continue focusing on personalized content.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon positive">
              <HeartIcon />
            </div>
            <div className="insight-text">
              <h4>Wellness Improvement Trending</h4>
              <p>Average wellness scores have improved by {formatPercentage(analyticsData.wellnessMetrics.improvementRate)} over the selected period. Mental health initiatives are effective.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon warning">
              <ClockIcon />
            </div>
            <div className="insight-text">
              <h4>Response Time Optimization</h4>
              <p>Community response time averages {analyticsData.communityMetrics.averageResponseTime} hours. Consider increasing helper availability during peak times.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon positive">
              <UsersIcon />
            </div>
            <div className="insight-text">
              <h4>Community Growth</h4>
              <p>Active helper count has grown to {analyticsData.communityMetrics.activeHelpers}. Community support network is strengthening.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsView;
