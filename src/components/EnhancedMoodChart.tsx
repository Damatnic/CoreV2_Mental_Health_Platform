import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Download, Share2, BarChart3, LineChart, PieChart } from 'lucide-react';

// Types for mood data
export interface MoodEntry {
  id: string;
  date: Date;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  notes?: string;
  tags?: string[];
  triggers?: string[];
  activities?: string[];
}

export interface MoodStats {
  average: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  bestDay: MoodEntry;
  worstDay: MoodEntry;
  streaks: {
    current: number;
    longest: number;
  };
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area';
  metric: 'mood' | 'energy' | 'anxiety' | 'all';
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  showAverage?: boolean;
  showTrend?: boolean;
  groupBy?: 'day' | 'week' | 'month';
}

interface EnhancedMoodChartProps {
  data: MoodEntry[];
  config?: Partial<ChartConfig>;
  showStats?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  interactive?: boolean;
  onEntryClick?: (entry: MoodEntry) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  className?: string;
}

// Default chart configuration
const DEFAULT_CONFIG: ChartConfig = {
  type: 'line',
  metric: 'mood',
  timeRange: '30d',
  showAverage: true,
  showTrend: true,
  groupBy: 'day'
};

// Mood level colors
const MOOD_COLORS = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16',
  5: '#22c55e', 6: '#06b6d4', 7: '#3b82f6', 8: '#6366f1',
  9: '#8b5cf6', 10: '#a855f7'
};

export const EnhancedMoodChart: React.FC<EnhancedMoodChartProps> = ({
  data = [],
  config = {},
  showStats = true,
  showFilters = true,
  showExport = true,
  interactive = true,
  onEntryClick,
  className = ''
}) => {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({ ...DEFAULT_CONFIG, ...config });
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<MoodEntry | null>(null);


  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const now = new Date();
    let startDate = new Date();

    switch (chartConfig.timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(Math.min(...data.map(entry => entry.date.getTime())));
        break;
    }

    return data
      .filter(entry => entry.date >= startDate && entry.date <= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, chartConfig.timeRange]);

  // Group data by time period
  const groupedData = useMemo(() => {
    if (!filteredData.length) return [];

    const groups = new Map<string, MoodEntry[]>();

    filteredData.forEach(entry => {
      let key = '';
      const date = entry.date;

      switch (chartConfig.groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    return Array.from(groups.entries()).map(([key, entries]) => {
      const averageEntry: MoodEntry = {
        id: key,
        date: new Date(key),
        mood: entries.reduce((sum, e) => sum + e.mood, 0) / entries.length,
        energy: entries.reduce((sum, e) => sum + e.energy, 0) / entries.length,
        anxiety: entries.reduce((sum, e) => sum + e.anxiety, 0) / entries.length,
        notes: entries.map(e => e.notes).filter(Boolean).join('; '),
        tags: [...new Set(entries.flatMap(e => e.tags || []))],
        triggers: [...new Set(entries.flatMap(e => e.triggers || []))],
        activities: [...new Set(entries.flatMap(e => e.activities || []))]
      };

      return { key, entries, average: averageEntry };
    });
  }, [filteredData, chartConfig.groupBy]);

  // Calculate statistics
  const stats: MoodStats = useMemo(() => {
    if (!filteredData.length) {
      return {
        average: 0,
        trend: 'stable',
        trendValue: 0,
        bestDay: {} as MoodEntry,
        worstDay: {} as MoodEntry,
        streaks: { current: 0, longest: 0 }
      };
    }

    const moods = filteredData.map(entry => entry.mood);
    const average = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;

    // Calculate trend
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));
    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood, 0) / secondHalf.length;
    const trendValue = secondAvg - firstAvg;
    const trend = Math.abs(trendValue) < 0.3 ? 'stable' : trendValue > 0 ? 'up' : 'down';

    // Find best and worst days
    const bestDay = filteredData.reduce((best, entry) => entry.mood > best.mood ? entry : best);
    const worstDay = filteredData.reduce((worst, entry) => entry.mood < worst.mood ? entry : worst);

    // Calculate streaks (days above average)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = filteredData.length - 1; i >= 0; i--) {
      if (filteredData[i].mood >= average) {
        tempStreak++;
        if (i === filteredData.length - 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      average: Math.round(average * 10) / 10,
      trend,
      trendValue: Math.round(trendValue * 10) / 10,
      bestDay,
      worstDay,
      streaks: { current: currentStreak, longest: longestStreak }
    };
  }, [filteredData]);

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Scales
  const xScale = useMemo(() => {
    if (!groupedData.length) return (_x: number) => 0;
    const domain = groupedData.map((_, i) => i);
    return (x: number) => (x / (domain.length - 1 || 1)) * innerWidth;
  }, [groupedData, innerWidth]);

  const yScale = useMemo(() => {
    return (y: number) => innerHeight - ((y - 1) / 9) * innerHeight;
  }, [innerHeight]);

  // Generate path data for line chart
  const getPathData = (metric: keyof Pick<MoodEntry, 'mood' | 'energy' | 'anxiety'>) => {
    if (!groupedData.length) return '';

    const points = groupedData.map((group, index) => {
      const x = xScale(index);
      const y = yScale(group.average[metric]);
      return `${x},${y}`;
    });

    return `M${points.join('L')}`;
  };

  // Handle entry click
  const handleEntryClick = (entry: MoodEntry) => {
    setSelectedEntry(entry);
    onEntryClick?.(entry);
  };

  // Handle chart configuration changes
  const updateConfig = (updates: Partial<ChartConfig>) => {
    setChartConfig(prev => ({ ...prev, ...updates }));
  };

  // Export data
  const handleExport = (format: 'csv' | 'json') => {
    const dataToExport = filteredData.map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      mood: entry.mood,
      energy: entry.energy,
      anxiety: entry.anxiety,
      notes: entry.notes || '',
      tags: (entry.tags || []).join(', '),
      triggers: (entry.triggers || []).join(', '),
      activities: (entry.activities || []).join(', ')
    }));

    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => (row as any)[header]).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mood-data.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mood-data.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getMoodColor = (mood: number) => {
    const rounded = Math.round(mood);
    return MOOD_COLORS[rounded as keyof typeof MOOD_COLORS] || '#94a3b8';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  if (!data.length) {
    return (
      <div className={`enhanced-mood-chart bg-white border border-gray-200 rounded-xl p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No mood data available</h3>
          <p className="text-sm">Start tracking your mood to see insights here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-mood-chart bg-white border border-gray-200 rounded-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Mood Chart</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredData.length} entries over the last {chartConfig.timeRange}
            </p>
          </div>
          
          {showExport && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigator.share?.({ title: 'Mood Chart', text: 'Check out my mood tracking progress!' })}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            {/* Chart Type */}
            <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
              {(['line', 'bar', 'area'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => updateConfig({ type })}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    chartConfig.type === type
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'line' && <LineChart className="w-4 h-4" />}
                  {type === 'bar' && <BarChart3 className="w-4 h-4" />}
                  {type === 'area' && <PieChart className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Metric */}
            <select
              value={chartConfig.metric}
              onChange={(e) => updateConfig({ metric: e.target.value as any })}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mood">Mood</option>
              <option value="energy">Energy</option>
              <option value="anxiety">Anxiety</option>
              <option value="all">All Metrics</option>
            </select>

            {/* Time Range */}
            <select
              value={chartConfig.timeRange}
              onChange={(e) => updateConfig({ timeRange: e.target.value as any })}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.average}</div>
              <div className="text-sm text-gray-600">Average Mood</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {getTrendIcon(stats.trend)}
                <span className="text-2xl font-bold text-gray-900">
                  {stats.trendValue > 0 ? '+' : ''}{stats.trendValue}
                </span>
              </div>
              <div className="text-sm text-gray-600">Trend</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.streaks.current}</div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.streaks.longest}</div>
              <div className="text-sm text-gray-600">Best Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-6">
        <div className="relative">
          <svg width={chartWidth} height={chartHeight} className="overflow-visible">
            {/* Grid lines */}
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Y-axis grid */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                <g key={value}>
                  <line
                    x1={0}
                    y1={yScale(value)}
                    x2={innerWidth}
                    y2={yScale(value)}
                    stroke="#f3f4f6"
                    strokeWidth={1}
                  />
                  <text
                    x={-10}
                    y={yScale(value)}
                    fill="#9ca3af"
                    fontSize="12"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {value}
                  </text>
                </g>
              ))}

              {/* X-axis grid */}
              {groupedData.map((group, index) => (
                <g key={group.key}>
                  <line
                    x1={xScale(index)}
                    y1={0}
                    x2={xScale(index)}
                    y2={innerHeight}
                    stroke="#f3f4f6"
                    strokeWidth={1}
                  />
                  {index % Math.ceil(groupedData.length / 8) === 0 && (
                    <text
                      x={xScale(index)}
                      y={innerHeight + 15}
                      fill="#9ca3af"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {formatDate(group.average.date)}
                    </text>
                  )}
                </g>
              ))}

              {/* Chart content based on type */}
              {chartConfig.type === 'line' && chartConfig.metric !== 'all' && (
                <>
                  {/* Main line */}
                  <path
                    d={getPathData(chartConfig.metric)}
                    fill="none"
                    stroke={chartConfig.metric === 'mood' ? '#3b82f6' : chartConfig.metric === 'energy' ? '#10b981' : '#f59e0b'}
                    strokeWidth="2"
                  />
                  
                  {/* Data points */}
                  {groupedData.map((group, index) => (
                    <circle
                      key={group.key}
                      cx={xScale(index)}
                      cy={yScale(group.average[chartConfig.metric])}
                      r="4"
                      fill={getMoodColor(group.average.mood)}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-6 transition-all"
                      onClick={() => interactive && handleEntryClick(group.average)}
                      onMouseEnter={() => setHoveredEntry(group.average)}
                      onMouseLeave={() => setHoveredEntry(null)}
                    />
                  ))}
                </>
              )}

              {chartConfig.type === 'bar' && (
                <>
                  {groupedData.map((group, index) => {
                    const barWidth = Math.max(innerWidth / groupedData.length - 4, 8);
                    const barHeight = (group.average[chartConfig.metric] - 1) / 9 * innerHeight;
                    return (
                      <rect
                        key={group.key}
                        x={xScale(index) - barWidth / 2}
                        y={yScale(group.average[chartConfig.metric])}
                        width={barWidth}
                        height={barHeight}
                        fill={getMoodColor(group.average.mood)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => interactive && handleEntryClick(group.average)}
                        onMouseEnter={() => setHoveredEntry(group.average)}
                        onMouseLeave={() => setHoveredEntry(null)}
                      />
                    );
                  })}
                </>
              )}

              {chartConfig.metric === 'all' && (
                <>
                  {/* Mood line */}
                  <path d={getPathData('mood')} fill="none" stroke="#3b82f6" strokeWidth="2" />
                  {/* Energy line */}
                  <path d={getPathData('energy')} fill="none" stroke="#10b981" strokeWidth="2" />
                  {/* Anxiety line */}
                  <path d={getPathData('anxiety')} fill="none" stroke="#f59e0b" strokeWidth="2" />
                </>
              )}

              {/* Average line */}
              {chartConfig.showAverage && (
                <line
                  x1={0}
                  y1={yScale(stats.average)}
                  x2={innerWidth}
                  y2={yScale(stats.average)}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
              )}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredEntry && (
            <div
              className="absolute bg-gray-900 text-white p-2 rounded-lg text-sm pointer-events-none z-10"
              style={{
                left: Math.min(xScale(groupedData.findIndex(g => g.average.id === hoveredEntry.id)) + margin.left + 10, chartWidth - 200),
                top: yScale(hoveredEntry[chartConfig.metric]) + margin.top - 50
              }}
            >
              <div className="font-medium">{formatDate(hoveredEntry.date)}</div>
              <div>Mood: {hoveredEntry.mood.toFixed(1)}</div>
              <div>Energy: {hoveredEntry.energy.toFixed(1)}</div>
              <div>Anxiety: {hoveredEntry.anxiety.toFixed(1)}</div>
              {hoveredEntry.notes && (
                <div className="mt-1 text-gray-300 max-w-48 truncate">{hoveredEntry.notes}</div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        {chartConfig.metric === 'all' && (
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Mood</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Anxiety</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected entry details */}
      {selectedEntry && (
        <div className="p-6 border-t border-gray-200 bg-blue-50">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-blue-900">
              {formatDate(selectedEntry.date)}
            </h4>
            <button
              onClick={() => setSelectedEntry(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-xs text-blue-700 uppercase tracking-wide">Mood</div>
              <div className="text-lg font-semibold text-blue-900">{selectedEntry.mood.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 uppercase tracking-wide">Energy</div>
              <div className="text-lg font-semibold text-blue-900">{selectedEntry.energy.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 uppercase tracking-wide">Anxiety</div>
              <div className="text-lg font-semibold text-blue-900">{selectedEntry.anxiety.toFixed(1)}</div>
            </div>
          </div>

          {selectedEntry.notes && (
            <div className="mb-3">
              <div className="text-xs text-blue-700 uppercase tracking-wide mb-1">Notes</div>
              <p className="text-sm text-blue-800">{selectedEntry.notes}</p>
            </div>
          )}

          {selectedEntry.tags && selectedEntry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedEntry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedMoodChart;
