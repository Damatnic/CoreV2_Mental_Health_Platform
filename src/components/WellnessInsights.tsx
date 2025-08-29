import React from 'react';
import { SparkleIcon, HeartIcon, TrendingUpIcon, StarIcon } from './icons.dynamic';
import './WellnessInsights.css';

interface Insight {
  type: 'positive' | 'improvement' | 'achievement';
  message: string;
  icon: React.ReactNode;
}

interface WellnessInsightsProps {
  moodAverage: number;
  streakDays: number;
  totalCheckIns: number;
  topMood: string;
}

export const WellnessInsights: React.FC<WellnessInsightsProps> = ({ 
  moodAverage,
  streakDays,
  totalCheckIns,
  topMood 
}) => {
  const getInsights = (): Insight[] => {
    const insights: Insight[] = [];

    if (streakDays >= 7) {
      insights.push({
        type: 'achievement',
        message: `Amazing! You've checked in for ${streakDays} days straight!`,
        icon: <StarIcon />
      });
    }

    if (moodAverage >= 4) {
      insights.push({
        type: 'positive',
        message: 'Your mood has been consistently positive this week!',
        icon: <HeartIcon />
      });
    } else if (moodAverage >= 3) {
      insights.push({
        type: 'improvement',
        message: 'Your mood is stable. Small daily habits can boost it further.',
        icon: <SparkleIcon />
      });
    }

    if (totalCheckIns >= 30) {
      insights.push({
        type: 'achievement',
        message: `You've completed ${totalCheckIns} check-ins! Self-awareness is growing.`,
        icon: <TrendingUpIcon />
      });
    }

    if (!insights.length) {
      insights.push({
        type: 'improvement',
        message: 'Keep tracking to unlock personalized insights!',
        icon: <SparkleIcon />
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="wellness-insights-card">
      <div className="insights-header">
        <h3 className="insights-title">
          <SparkleIcon className="insights-icon" />
          Your Wellness Insights
        </h3>
      </div>

      <div className="insights-grid">
        <div className="insight-stat">
          <div 
            className="stat-icon-circle" 
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <HeartIcon />
          </div>
          <div className="stat-details">
            <span className="stat-number">{moodAverage.toFixed(1)}</span>
            <span className="stat-label">Avg Mood</span>
          </div>
        </div>

        <div className="insight-stat">
          <div 
            className="stat-icon-circle" 
            style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
          >
            🔥
          </div>
          <div className="stat-details">
            <span className="stat-number">{streakDays}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>

        <div className="insight-stat">
          <div 
            className="stat-icon-circle" 
            style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
          >
            ✨
          </div>
          <div className="stat-details">
            <span className="stat-number">{totalCheckIns}</span>
            <span className="stat-label">Check-ins</span>
          </div>
        </div>

        <div className="insight-stat">
          <div 
            className="stat-icon-circle" 
            style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
          >
            {topMood}
          </div>
          <div className="stat-details">
            <span className="stat-number">Top</span>
            <span className="stat-label">Mood</span>
          </div>
        </div>
      </div>

      <div className="insights-messages">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`insight-message insight-${insight.type}`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <span className="insight-icon">{insight.icon}</span>
            <p className="insight-text">{insight.message}</p>
          </div>
        ))}
      </div>

      <div className="insights-footer">
        <p className="insights-tip">
          💡 Consistency is key - even small check-ins make a difference!
        </p>
      </div>
    </div>
  );
};