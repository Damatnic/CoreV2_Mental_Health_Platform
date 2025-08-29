/**
 * Mood Analytics Dashboard Component for Mental Health Platform
 * 
 * Comprehensive mood tracking visualization with crisis detection,
 * therapeutic insights, and accessibility-first design.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMoodAnalytics } from '../../hooks/useMoodAnalytics';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuth } from '../../contexts/AuthContext';

export interface MoodAnalyticsDashboardProps {
  className?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  showCrisisAlerts?: boolean;
  enableTherapeuticInsights?: boolean;
  compactView?: boolean;
  autoRefresh?: boolean;
  onCrisisDetected?: (level: any) => void;
}

export interface MoodChartProps {
  data: any[];
  height?: number;
  showTrendLine?: boolean;
  highlightCrisis?: boolean;
  accessibleColors?: boolean;
}

export interface CrisisAlertProps {
  crisisRisk: any;
  onAcknowledge: () => void;
  onSeekHelp: () => void;
}

export interface InsightsCardProps {
  insights: any[];
  type: 'patterns' | 'triggers' | 'recommendations';
  onActionClick?: (actionId: string) => void;
}

export interface StatsGridProps {
  stats: any;
  compactView?: boolean;
}

const MoodChart: React.FC<MoodChartProps> = ({ 
  data, 
  height = 300, 
  showTrendLine = true, 
  highlightCrisis = true,
  accessibleColors = true 
}) => {
  const { announceToScreenReader } = useAccessibility();
  const [focusedDataPoint, setFocusedDataPoint] = useState<number | null>(null);

  const handleDataPointFocus = useCallback((index: number, entry: any) => {
    setFocusedDataPoint(index);
    const date = new Date(entry.timestamp).toLocaleDateString();
    const mood = entry.moodValue;
    const emotion = entry.primaryEmotion;
    announceToScreenReader(`Data point: ${date}, mood level ${mood}, primary emotion ${emotion}`);
  }, [announceToScreenReader]);

  const crisisPoints = useMemo(() => {
    return data.filter(entry => entry.crisisRisk && entry.crisisRisk !== 'low');
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="mood-chart empty" role="img" aria-label="No mood data available">
        <div className="empty-state">
          <p>No mood data to display</p>
          <span className="sr-only">Start tracking your mood to see analytics</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`mood-chart ${accessibleColors ? 'accessible-colors' : ''}`}
      style={{ height }}
      role="img"
      aria-label={`Mood tracking chart with ${data.length} data points`}
    >
      <div className="chart-header">
        <h3>Mood Timeline</h3>
        {crisisPoints.length > 0 && (
          <div className="crisis-indicator" role="alert">
            <span className="icon">⚠️</span>
            {crisisPoints.length} crisis point{crisisPoints.length !== 1 ? 's' : ''} detected
          </div>
        )}
      </div>

      <div className="chart-container">
        <svg
          width="100%"
          height={height - 60}
          viewBox="0 0 800 240"
          className="mood-svg"
          role="presentation"
        >
          {/* Grid lines */}
          <g className="grid-lines" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <line
                key={level}
                x1="50"
                y1={220 - (level * 20)}
                x2="750"
                y2={220 - (level * 20)}
                stroke={accessibleColors ? '#e0e0e0' : '#f0f0f0'}
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Y-axis labels */}
          <g className="y-axis" role="presentation">
            {[1, 3, 5, 7, 9, 10].map(level => (
              <text
                key={level}
                x="40"
                y={225 - (level * 20)}
                textAnchor="end"
                className="axis-label"
                fontSize="12"
                fill={accessibleColors ? '#333' : '#666'}
              >
                {level}
              </text>
            ))}
          </g>

          {/* Data points and line */}
          <g className="data-visualization">
            {showTrendLine && data.length > 1 && (
              <polyline
                points={data.map((entry, index) => 
                  `${50 + (index * (700 / (data.length - 1)))},${220 - (entry.moodValue * 20)}`
                ).join(' ')}
                fill="none"
                stroke={accessibleColors ? '#2563eb' : '#4f46e5'}
                strokeWidth="2"
                className="trend-line"
              />
            )}

            {data.map((entry, index) => {
              const x = 50 + (index * (700 / (data.length - 1)));
              const y = 220 - (entry.moodValue * 20);
              const isCrisis = highlightCrisis && entry.crisisRisk && entry.crisisRisk !== 'low';
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isCrisis ? "8" : "6"}
                    fill={isCrisis 
                      ? (accessibleColors ? '#dc2626' : '#ef4444')
                      : (accessibleColors ? '#2563eb' : '#4f46e5')
                    }
                    stroke={focusedDataPoint === index ? '#000' : 'transparent'}
                    strokeWidth="2"
                    className="data-point"
                    tabIndex={0}
                    role="button"
                    aria-label={`Mood entry: ${new Date(entry.timestamp).toLocaleDateString()}, level ${entry.moodValue}`}
                    onFocus={() => handleDataPointFocus(index, entry)}
                    onMouseEnter={() => handleDataPointFocus(index, entry)}
                  />
                  
                  {isCrisis && (
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      fontSize="16"
                      role="img"
                      aria-label="Crisis alert"
                    >
                      ⚠️
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* X-axis */}
          <line
            x1="50"
            y1="220"
            x2="750"
            y2="220"
            stroke={accessibleColors ? '#333' : '#666'}
            strokeWidth="1"
          />
        </svg>

        {focusedDataPoint !== null && (
          <div className="data-tooltip" role="tooltip">
            <div className="tooltip-content">
              <strong>{new Date(data[focusedDataPoint].timestamp).toLocaleDateString()}</strong>
              <p>Mood: {data[focusedDataPoint].moodValue}/10</p>
              <p>Emotion: {data[focusedDataPoint].primaryEmotion}</p>
              {data[focusedDataPoint].triggers.length > 0 && (
                <p>Triggers: {data[focusedDataPoint].triggers.join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="chart-legend" role="note">
        <div className="legend-item">
          <span className="legend-color normal" aria-hidden="true"></span>
          <span>Normal entries</span>
        </div>
        {highlightCrisis && (
          <div className="legend-item">
            <span className="legend-color crisis" aria-hidden="true"></span>
            <span>Crisis risk detected</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CrisisAlert: React.FC<CrisisAlertProps> = ({ 
  crisisRisk, 
  onAcknowledge, 
  onSeekHelp 
}) => {
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    if (crisisRisk && crisisRisk !== 'low') {
      announceToScreenReader(`Crisis risk alert: ${crisisRisk} level detected. Immediate support options available.`);
    }
  }, [crisisRisk, announceToScreenReader]);

  if (!crisisRisk || crisisRisk === 'low') {
    return null;
  }

  const getSeverityColor = (risk: string): string => {
    switch (risk) {
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'severe': return '#dc2626';
      case 'imminent': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const getSeverityMessage = (risk: string): string => {
    switch (risk) {
      case 'moderate': return 'Your recent mood patterns suggest you might benefit from additional support.';
      case 'high': return 'We\'ve detected concerning patterns in your mood data. Please consider reaching out for help.';
      case 'severe': return 'Your mood data indicates significant distress. Professional support is strongly recommended.';
      case 'imminent': return 'Immediate crisis risk detected. Please seek emergency support right away.';
      default: return 'Crisis risk detected in your mood patterns.';
    }
  };

  return (
    <div 
      className={`crisis-alert ${crisisRisk}`}
      role="alert"
      aria-live="assertive"
      style={{ borderColor: getSeverityColor(crisisRisk) }}
    >
      <div className="alert-header">
        <span className="alert-icon" aria-hidden="true">⚠️</span>
        <h3>Crisis Risk Alert: {crisisRisk.toUpperCase()}</h3>
      </div>

      <div className="alert-content">
        <p>{getSeverityMessage(crisisRisk)}</p>
        
        <div className="emergency-contacts">
          <p><strong>Immediate Support:</strong></p>
          <ul>
            <li>Crisis Hotline: <a href="tel:988" aria-label="Call 988 crisis hotline">988</a></li>
            <li>Emergency Services: <a href="tel:911" aria-label="Call 911 emergency services">911</a></li>
            <li>Crisis Text Line: Text HOME to <a href="sms:741741" aria-label="Text HOME to 741741">741741</a></li>
          </ul>
        </div>
      </div>

      <div className="alert-actions">
        <button
          type="button"
          className="btn-seek-help"
          onClick={onSeekHelp}
          aria-label="Get immediate professional help"
        >
          Get Help Now
        </button>
        
        <button
          type="button"
          className="btn-acknowledge"
          onClick={onAcknowledge}
          aria-label="Acknowledge crisis alert"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

const InsightsCard: React.FC<InsightsCardProps> = ({ 
  insights, 
  type, 
  onActionClick 
}) => {
  const getCardTitle = (type: string): string => {
    switch (type) {
      case 'patterns': return 'Mood Patterns';
      case 'triggers': return 'Common Triggers';
      case 'recommendations': return 'Personalized Recommendations';
      default: return 'Insights';
    }
  };

  const getCardIcon = (type: string): string => {
    switch (type) {
      case 'patterns': return '📈';
      case 'triggers': return '⚡';
      case 'recommendations': return '💡';
      default: return '📊';
    }
  };

  if (insights.length === 0) {
    return (
      <div className={`insights-card ${type} empty`}>
        <h4>
          <span className="card-icon" aria-hidden="true">{getCardIcon(type)}</span>
          {getCardTitle(type)}
        </h4>
        <p>Not enough data yet to generate insights.</p>
      </div>
    );
  }

  return (
    <div className={`insights-card ${type}`}>
      <h4>
        <span className="card-icon" aria-hidden="true">{getCardIcon(type)}</span>
        {getCardTitle(type)}
      </h4>
      
      <ul className="insights-list" role="list">
        {insights.map((insight, index) => (
          <li key={index} className="insight-item">
            <div className="insight-content">
              <p>{insight.description}</p>
              {insight.confidence && (
                <span className="confidence-level" aria-label={`Confidence: ${insight.confidence}%`}>
                  {insight.confidence}% confidence
                </span>
              )}
            </div>
            
            {insight.actionable && onActionClick && (
              <button
                type="button"
                className="insight-action"
                onClick={() => onActionClick(insight.id)}
                aria-label={`Take action on: ${insight.description}`}
              >
                Take Action
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({ stats, compactView = false }) => {
  const statItems = [
    { label: 'Average Mood', value: stats.averageMood, unit: '/10', icon: '😊' },
    { label: 'Entries This Week', value: stats.entriesThisWeek, unit: '', icon: '📝' },
    { label: 'Improvement Trend', value: stats.improvementTrend, unit: '%', icon: '📈' },
    { label: 'Crisis-Free Days', value: stats.crisisFreeStreak, unit: ' days', icon: '🎯' },
    { label: 'Coping Strategies Used', value: stats.copingStrategiesCount, unit: '', icon: '🛠️' },
    { label: 'Support Connections', value: stats.supportConnections, unit: '', icon: '🤝' }
  ];

  return (
    <div className={`stats-grid ${compactView ? 'compact' : ''}`}>
      {statItems.map((stat, index) => (
        <div key={index} className="stat-card" role="group" aria-labelledby={`stat-${index}-label`}>
          <div className="stat-icon" aria-hidden="true">{stat.icon}</div>
          <div className="stat-content">
            <div className="stat-value" aria-live="polite">
              {typeof stat.value === 'number' ? stat.value.toFixed(1) : stat.value}{stat.unit}
            </div>
            <div id={`stat-${index}-label`} className="stat-label">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const MoodAnalyticsDashboard: React.FC<MoodAnalyticsDashboardProps> = ({
  className = '',
  timeRange = 'month',
  showCrisisAlerts = true,
  enableTherapeuticInsights = true,
  compactView = false,
  autoRefresh = false,
  onCrisisDetected
}) => {
  const { user } = useAuth();
  const {
    moodEntries,
    weeklyData,
    monthlyData,
    analytics,
    crisisIndicators,
    isLoading,
    error,
    analyzeData
  } = useMoodAnalytics();

  const { announceToScreenReader, isFocusMode } = useAccessibility();

  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [acknowledgedCrisis, setAcknowledgedCrisis] = useState(false);

  const handleTimeRangeChange = useCallback((newRange: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedTimeRange(newRange);
    announceToScreenReader(`Viewing mood data for ${newRange}`);
  }, [announceToScreenReader]);

  const handleCrisisAcknowledge = useCallback(() => {
    setAcknowledgedCrisis(true);
    announceToScreenReader('Crisis alert acknowledged');
  }, [announceToScreenReader]);

  const handleSeekHelp = useCallback(() => {
    // In a real implementation, this would connect to crisis services
    window.open('tel:988', '_self');
    announceToScreenReader('Connecting to crisis support');
  }, [announceToScreenReader]);

  const handleInsightAction = useCallback((actionId: string) => {
    // In a real implementation, this would trigger specific therapeutic actions
    announceToScreenReader(`Action triggered: ${actionId}`);
  }, [announceToScreenReader]);

  useEffect(() => {
    const highRiskIndicators = crisisIndicators.filter(ci => ci.severity === 'severe');
    if (highRiskIndicators.length > 0 && onCrisisDetected) {
      onCrisisDetected('severe');
    }
  }, [crisisIndicators, onCrisisDetected]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(analyzeData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh, analyzeData]);

  if (isLoading) {
    return (
      <div className="loading-state" role="status" aria-label="Loading mood analytics">
        <div className="spinner" aria-hidden="true"></div>
        <span className="sr-only">Loading your mood analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state" role="alert">
        <h3>Unable to Load Analytics</h3>
        <p>{error}</p>
        <button 
          type="button"
          className="btn-retry"
          onClick={analyzeData}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-required" role="note">
        <h3>Sign In Required</h3>
        <p>Please sign in to view your mood analytics and insights.</p>
      </div>
    );
  }

  const shouldShowCrisisAlert = showCrisisAlerts && 
                                crisisIndicators.length > 0 && 
                                crisisIndicators.some(ci => ci.severity === 'severe') && 
                                !acknowledgedCrisis;

  return (
    <div 
      className={`mood-analytics-dashboard ${className} ${compactView ? 'compact' : ''}`}
      role="main"
      aria-label="Mood analytics dashboard"
    >
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Mood Analytics</h2>
          <div className="time-range-selector">
            {(['week', 'month', 'quarter', 'year'] as const).map(range => (
              <button
                key={range}
                type="button"
                className={`range-btn ${selectedTimeRange === range ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange(range)}
                aria-pressed={selectedTimeRange === range}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={analyzeData}
          aria-label="Refresh analytics data"
        >
          🔄 Refresh
        </button>
      </div>

      {shouldShowCrisisAlert && (
        <CrisisAlert
          crisisRisk={'high'}
          onAcknowledge={handleCrisisAcknowledge}
          onSeekHelp={handleSeekHelp}
        />
      )}

      <div className="dashboard-content">
        {!compactView && analytics && (
          <section className="stats-section" aria-labelledby="stats-heading">
            <h3 id="stats-heading" className="sr-only">Mood Statistics</h3>
            <StatsGrid stats={analytics} compactView={compactView} />
          </section>
        )}

        {moodEntries.length > 0 && (
          <section className="chart-section" aria-labelledby="chart-heading">
            <h3 id="chart-heading" className="sr-only">Mood Timeline Chart</h3>
            <MoodChart
              data={moodEntries}
              showTrendLine={!compactView}
              highlightCrisis={showCrisisAlerts}
              accessibleColors={true}
            />
          </section>
        )}

        {enableTherapeuticInsights && analytics && (
          <section className="insights-section" aria-labelledby="insights-heading">
            <div className="insights-header">
              <h3 id="insights-heading">Therapeutic Insights</h3>
              {!compactView && (
                <button
                  type="button"
                  className="toggle-insights"
                  onClick={() => setShowAllInsights(!showAllInsights)}
                  aria-expanded={showAllInsights}
                >
                  {showAllInsights ? 'Show Less' : 'Show All'}
                </button>
              )}
            </div>

            <div className="insights-grid">
              <InsightsCard
                insights={[]}
                type="patterns"
                onActionClick={handleInsightAction}
              />
              
              <InsightsCard
                insights={[]}
                type="triggers"
                onActionClick={handleInsightAction}
              />
              
              <InsightsCard
                insights={[]}
                type="recommendations"
                onActionClick={handleInsightAction}
              />
            </div>
          </section>
        )}

        {moodEntries.length === 0 && (
          <div className="empty-state" role="status">
            <h3>Start Tracking Your Mood</h3>
            <p>Begin logging your daily mood to see personalized analytics and insights.</p>
            <button
              type="button"
              className="btn-start-tracking"
              onClick={() => announceToScreenReader('Navigate to mood tracking to get started')}
            >
              Start Mood Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodAnalyticsDashboard;