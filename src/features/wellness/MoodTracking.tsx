import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, BarChart2, Smile } from 'lucide-react';
import '../../styles/MoodTracking.css';

interface MoodData {
  date: Date;
  mood: number;
  energy: number;
  anxiety: number;
  sleep: number;
  notes?: string;
}

interface MoodStats {
  average: number;
  trend: 'improving' | 'stable' | 'declining';
  bestDay: string;
  streakDays: number;
}

const MoodTracking: React.FC = () => {
  const [moodHistory, setMoodHistory] = useState<MoodData[]>([]);
  const [stats, setStats] = useState<MoodStats>({
    average: 7,
    trend: 'stable',
    bestDay: 'Yesterday',
    streakDays: 5
  });
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadMoodData();
  }, [viewMode]);

  const loadMoodData = () => {
    // Mock data
    const mockData: MoodData[] = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      mood: Math.floor(Math.random() * 4) + 6,
      energy: Math.floor(Math.random() * 4) + 5,
      anxiety: Math.floor(Math.random() * 3) + 2,
      sleep: Math.floor(Math.random() * 3) + 6,
      notes: i === 0 ? 'Feeling good today' : undefined
    }));

    setMoodHistory(mockData);
    calculateStats(mockData);
  };

  const calculateStats = (data: MoodData[]) => {
    if (data.length === 0) return;

    const avgMood = data.reduce((sum, d) => sum + d.mood, 0) / data.length;
    const recentAvg = data.slice(0, 3).reduce((sum, d) => sum + d.mood, 0) / 3;
    
    setStats({
      average: Math.round(avgMood),
      trend: recentAvg > avgMood ? 'improving' : recentAvg < avgMood ? 'declining' : 'stable',
      bestDay: 'Yesterday',
      streakDays: 5
    });
  };

  const getMoodColor = (value: number) => {
    if (value >= 8) return '#4CAF50';
    if (value >= 6) return '#FFC107';
    if (value >= 4) return '#FF9800';
    return '#F44336';
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <div className="mood-tracking">
      <div className="tracking-header">
        <h2>Mood Insights</h2>
        <div className="view-toggle">
          {(['week', 'month', 'year'] as const).map(mode => (
            <button
              key={mode}
              className={viewMode === mode ? 'active' : ''}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Smile size={20} />
          <div>
            <h3>Average Mood</h3>
            <p className="stat-value">{stats.average}/10</p>
          </div>
        </div>

        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <h3>Trend</h3>
            <p className="stat-value">
              {getTrendIcon()} {stats.trend}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <Calendar size={20} />
          <div>
            <h3>Best Day</h3>
            <p className="stat-value">{stats.bestDay}</p>
          </div>
        </div>

        <div className="stat-card">
          <BarChart2 size={20} />
          <div>
            <h3>Streak</h3>
            <p className="stat-value">{stats.streakDays} days</p>
          </div>
        </div>
      </div>

      <div className="mood-chart">
        <h3>Mood History</h3>
        <div className="chart-container">
          {moodHistory.map((data, index) => (
            <div key={index} className="chart-bar-wrapper">
              <div 
                className="chart-bar"
                style={{
                  height: `${data.mood * 10}%`,
                  backgroundColor: getMoodColor(data.mood)
                }}
              >
                <span className="bar-value">{data.mood}</span>
              </div>
              <span className="bar-label">
                {data.date.toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="tracking-footer">
        <button className="track-mood-btn">
          Track Today's Mood
        </button>
        <button className="view-details-btn">
          View Detailed Report
        </button>
      </div>
    </div>
  );
};

export default MoodTracking;
