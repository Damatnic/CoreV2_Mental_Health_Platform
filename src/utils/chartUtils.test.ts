import { describe, it, expect } from '@jest/globals';

interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
}

interface ChartOptions {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
}

function generateChartData(values: number[], labels?: string[]): ChartDataPoint[] {
  return values.map((value, index) => ({
    x: labels ? labels[index] : index,
    y: value,
    label: labels ? labels[index] : `Point ${index + 1}`
  }));
}

function calculateChartBounds(data: ChartDataPoint[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (data.length === 0) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }

  const xValues = data.map(d => typeof d.x === 'number' ? d.x : 0);
  const yValues = data.map(d => d.y);

  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues)
  };
}

function formatChartValue(value: number, type: 'number' | 'percentage' | 'currency' = 'number'): string {
  switch (type) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'currency':
      return `$${value.toFixed(2)}`;
    default:
      return value.toString();
  }
}

function getChartColors(count: number, palette: string[] = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(palette[i % palette.length]);
  }
  return colors;
}

function smoothChartData(data: ChartDataPoint[], windowSize: number = 3): ChartDataPoint[] {
  if (windowSize < 2 || data.length < windowSize) {
    return [...data];
  }

  const smoothed: ChartDataPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length - 1, i + halfWindow);
    
    let sum = 0;
    let count = 0;
    
    for (let j = start; j <= end; j++) {
      sum += data[j].y;
      count++;
    }
    
    smoothed.push({
      ...data[i],
      y: sum / count
    });
  }

  return smoothed;
}

function resampleChartData(data: ChartDataPoint[], targetPoints: number): ChartDataPoint[] {
  if (data.length <= targetPoints) {
    return [...data];
  }

  const step = (data.length - 1) / (targetPoints - 1);
  const resampled: ChartDataPoint[] = [];

  for (let i = 0; i < targetPoints; i++) {
    const index = Math.round(i * step);
    resampled.push(data[index]);
  }

  return resampled;
}

describe('chartUtils', () => {
  describe('generateChartData', () => {
    it('should generate chart data from values', () => {
      const values = [1, 2, 3, 4, 5];
      const result = generateChartData(values);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ x: 0, y: 1, label: 'Point 1' });
      expect(result[4]).toEqual({ x: 4, y: 5, label: 'Point 5' });
    });

    it('should generate chart data with custom labels', () => {
      const values = [10, 20, 30];
      const labels = ['A', 'B', 'C'];
      const result = generateChartData(values, labels);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ x: 'A', y: 10, label: 'A' });
      expect(result[2]).toEqual({ x: 'C', y: 30, label: 'C' });
    });
  });

  describe('calculateChartBounds', () => {
    it('should calculate bounds from chart data', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 5, y: 5 },
        { x: 3, y: 15 }
      ];
      
      const bounds = calculateChartBounds(data);
      
      expect(bounds.minX).toBe(1);
      expect(bounds.maxX).toBe(5);
      expect(bounds.minY).toBe(5);
      expect(bounds.maxY).toBe(15);
    });

    it('should handle empty data', () => {
      const bounds = calculateChartBounds([]);
      
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(1);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(1);
    });
  });

  describe('formatChartValue', () => {
    it('should format numbers', () => {
      expect(formatChartValue(42)).toBe('42');
      expect(formatChartValue(3.14159)).toBe('3.14159');
    });

    it('should format percentages', () => {
      expect(formatChartValue(0.1, 'percentage')).toBe('10.0%');
      expect(formatChartValue(0.856, 'percentage')).toBe('85.6%');
    });

    it('should format currency', () => {
      expect(formatChartValue(99.99, 'currency')).toBe('$99.99');
      expect(formatChartValue(1000, 'currency')).toBe('$1000.00');
    });
  });

  describe('getChartColors', () => {
    it('should return colors for small counts', () => {
      const colors = getChartColors(3);
      expect(colors).toHaveLength(3);
      expect(colors[0]).toBe('#3b82f6');
      expect(colors[1]).toBe('#ef4444');
      expect(colors[2]).toBe('#10b981');
    });

    it('should cycle colors for large counts', () => {
      const colors = getChartColors(8);
      expect(colors).toHaveLength(8);
      expect(colors[5]).toBe(colors[0]); // Should cycle back
    });

    it('should use custom palette', () => {
      const customPalette = ['#000', '#fff'];
      const colors = getChartColors(3, customPalette);
      expect(colors).toEqual(['#000', '#fff', '#000']);
    });
  });

  describe('smoothChartData', () => {
    it('should smooth data with moving average', () => {
      const data = [
        { x: 0, y: 10 },
        { x: 1, y: 0 },
        { x: 2, y: 10 },
        { x: 3, y: 0 },
        { x: 4, y: 10 }
      ];
      
      const smoothed = smoothChartData(data, 3);
      expect(smoothed).toHaveLength(5);
      
      // Middle point should be average of 0, 10, 0 = 3.33
      expect(smoothed[3].y).toBeCloseTo(6.67, 1);
    });

    it('should return original data for small window', () => {
      const data = [{ x: 0, y: 5 }, { x: 1, y: 10 }];
      const smoothed = smoothChartData(data, 5);
      expect(smoothed).toEqual(data);
    });
  });

  describe('resampleChartData', () => {
    it('should reduce data points', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i }));
      const resampled = resampleChartData(data, 10);
      
      expect(resampled).toHaveLength(10);
      expect(resampled[0]).toEqual({ x: 0, y: 0 });
      expect(resampled[9]).toEqual({ x: 99, y: 99 });
    });

    it('should return original data if already small enough', () => {
      const data = [{ x: 0, y: 1 }, { x: 1, y: 2 }];
      const resampled = resampleChartData(data, 5);
      expect(resampled).toEqual(data);
    });
  });
});
