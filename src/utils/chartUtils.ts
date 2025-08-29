/**
 * Chart Utilities
 * 
 * Comprehensive chart data processing and visualization utilities for mental health analytics.
 * Provides data transformation, aggregation, and formatting for mood tracking, wellness metrics,
 * and assessment visualization.
 * 
 * @fileoverview Chart data processing and visualization utilities
 * @version 2.0.0
 */

// TODO: Import MoodCheckIn from types when available
// import { MoodCheckIn } from '../types';

// Temporary type definition
interface MoodCheckIn {
  id: string;
  mood: number;
  date: Date;
  [key: string]: any;
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  date: Date;
  metadata?: {
    count?: number;
    average?: number;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
  };
}

/**
 * Chart configuration options
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  aggregation: 'daily' | 'weekly' | 'monthly';
  showTrend: boolean;
  showAverage: boolean;
  colorScheme: 'default' | 'mood' | 'wellness' | 'assessment';
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  significance: 'low' | 'moderate' | 'high';
  confidence: number;
}

/**
 * Chart statistics
 */
export interface ChartStatistics {
  min: number;
  max: number;
  average: number;
  median: number;
  standardDeviation: number;
  totalDataPoints: number;
  trend: TrendAnalysis;
}

/**
 * Group mood check-ins by day for chart visualization
 */
export const groupCheckInsByDay = (checkIns: MoodCheckIn[], days: number): ChartDataPoint[] => {
  const dataByDay: { [key: string]: { total: number; count: number } } = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter relevant check-ins within the specified day range
  const relevantCheckIns = checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.timestamp);
    checkInDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays < days;
  });

  // Aggregate data by day
  for (const checkIn of relevantCheckIns) {
    const dateKey = new Date(checkIn.timestamp).toISOString().split('T')[0];
    if (!dataByDay[dateKey]) {
      dataByDay[dateKey] = { total: 0, count: 0 };
    }
    dataByDay[dateKey].total += checkIn.moodScore;
    dataByDay[dateKey].count++;
  }

  // Generate chart data for each day
  const chartData: ChartDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const dayData = dataByDay[dateKey];

    chartData.push({
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: dayData ? dayData.total / dayData.count : 0, // Average mood score or 0 if no data
      date: new Date(date),
      metadata: {
        count: dayData?.count || 0,
        average: dayData ? dayData.total / dayData.count : 0,
        color: getMoodColor(dayData ? dayData.total / dayData.count : 0)
      }
    });
  }

  return chartData;
};

/**
 * Group data by week for weekly trend analysis
 */
export const groupDataByWeek = (data: ChartDataPoint[], weeks: number): ChartDataPoint[] => {
  const weeklyData: { [key: string]: { total: number; count: number; dates: Date[] } } = {};
  const today = new Date();

  // Group data by week
  data.forEach(point => {
    const weekStart = getWeekStart(point.date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { total: 0, count: 0, dates: [] };
    }
    
    weeklyData[weekKey].total += point.value;
    weeklyData[weekKey].count++;
    weeklyData[weekKey].dates.push(point.date);
  });

  // Generate weekly chart data
  const chartData: ChartDataPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = getWeekStart(new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000));
    const weekKey = weekStart.toISOString().split('T')[0];
    const weekData = weeklyData[weekKey];

    chartData.push({
      label: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      value: weekData ? weekData.total / weekData.count : 0,
      date: weekStart,
      metadata: {
        count: weekData?.count || 0,
        average: weekData ? weekData.total / weekData.count : 0
      }
    });
  }

  return chartData;
};

/**
 * Group data by month for monthly trend analysis
 */
export const groupDataByMonth = (data: ChartDataPoint[], months: number): ChartDataPoint[] => {
  const monthlyData: { [key: string]: { total: number; count: number } } = {};
  const today = new Date();

  // Group data by month
  data.forEach(point => {
    const monthKey = `${point.date.getFullYear()}-${String(point.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, count: 0 };
    }
    
    monthlyData[monthKey].total += point.value;
    monthlyData[monthKey].count++;
  });

  // Generate monthly chart data
  const chartData: ChartDataPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthData = monthlyData[monthKey];

    chartData.push({
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: monthData ? monthData.total / monthData.count : 0,
      date: date,
      metadata: {
        count: monthData?.count || 0,
        average: monthData ? monthData.total / monthData.count : 0
      }
    });
  }

  return chartData;
};

/**
 * Calculate trend analysis for chart data
 */
export const calculateTrend = (data: ChartDataPoint[]): TrendAnalysis => {
  if (data.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      significance: 'low',
      confidence: 0
    };
  }

  // Calculate linear regression
  const n = data.length;
  const xValues = data.map((_, index) => index);
  const yValues = data.map(point => point.value);

  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate trend direction and significance
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const percentageChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const residualSumSquares = yValues.reduce((sum, y, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = 1 - (residualSumSquares / totalSumSquares);

  return {
    direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable',
    percentage: Math.abs(percentageChange),
    significance: Math.abs(percentageChange) > 20 ? 'high' : Math.abs(percentageChange) > 10 ? 'moderate' : 'low',
    confidence: Math.max(0, Math.min(1, rSquared))
  };
};

/**
 * Calculate comprehensive statistics for chart data
 */
export const calculateStatistics = (data: ChartDataPoint[]): ChartStatistics => {
  if (data.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      standardDeviation: 0,
      totalDataPoints: 0,
      trend: calculateTrend([])
    };
  }

  const values = data.map(point => point.value);
  const sortedValues = [...values].sort((a, b) => a - b);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];

  const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    min,
    max,
    average,
    median,
    standardDeviation,
    totalDataPoints: data.length,
    trend: calculateTrend(data)
  };
};

/**
 * Get color based on mood score
 */
export const getMoodColor = (moodScore: number): string => {
  if (moodScore >= 8) return '#10b981'; // Green - Great mood
  if (moodScore >= 6) return '#84cc16'; // Light green - Good mood
  if (moodScore >= 4) return '#f59e0b'; // Yellow - Neutral mood
  if (moodScore >= 2) return '#f97316'; // Orange - Low mood
  return '#ef4444'; // Red - Very low mood
};

/**
 * Get wellness color scheme
 */
export const getWellnessColors = (): string[] => [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

/**
 * Format chart data for different visualization libraries
 */
export const formatForChartLibrary = (
  data: ChartDataPoint[],
  libraryType: 'chartjs' | 'recharts' | 'd3'
): any => {
  switch (libraryType) {
    case 'chartjs':
      return {
        labels: data.map(point => point.label),
        datasets: [{
          data: data.map(point => point.value),
          backgroundColor: data.map(point => point.metadata?.color || '#3b82f6'),
          borderColor: '#3b82f6',
          borderWidth: 2,
          fill: false
        }]
      };

    case 'recharts':
      return data.map(point => ({
        name: point.label,
        value: point.value,
        date: point.date.toISOString(),
        ...point.metadata
      }));

    case 'd3':
      return data.map((point, index) => ({
        x: index,
        y: point.value,
        label: point.label,
        date: point.date,
        ...point.metadata
      }));

    default:
      return data;
  }
};

/**
 * Generate time-based labels
 */
export const generateTimeLabels = (
  startDate: Date,
  endDate: Date,
  interval: 'day' | 'week' | 'month'
): string[] => {
  const labels: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    switch (interval) {
      case 'day':
        labels.push(current.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }));
        current.setDate(current.getDate() + 1);
        break;

      case 'week':
        labels.push(`Week of ${current.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}`);
        current.setDate(current.getDate() + 7);
        break;

      case 'month':
        labels.push(current.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }));
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return labels;
};

/**
 * Get week start date (Sunday)
 */
export const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day;
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

/**
 * Smooth data using moving average
 */
export const smoothData = (data: ChartDataPoint[], windowSize: number = 3): ChartDataPoint[] => {
  if (data.length < windowSize) return data;

  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const window = data.slice(start, end);
    const smoothedValue = window.reduce((sum, p) => sum + p.value, 0) / window.length;

    return {
      ...point,
      value: smoothedValue,
      metadata: {
        ...point.metadata,
        original: point.value
      }
    };
  });
};

/**
 * Filter outliers using IQR method
 */
export const filterOutliers = (data: ChartDataPoint[]): ChartDataPoint[] => {
  const values = data.map(point => point.value).sort((a, b) => a - b);
  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return data.filter(point => 
    point.value >= lowerBound && point.value <= upperBound
  );
};

// Default export with all utilities
export default {
  groupCheckInsByDay,
  groupDataByWeek,
  groupDataByMonth,
  calculateTrend,
  calculateStatistics,
  getMoodColor,
  getWellnessColors,
  formatForChartLibrary,
  generateTimeLabels,
  getWeekStart,
  smoothData,
  filterOutliers
};
