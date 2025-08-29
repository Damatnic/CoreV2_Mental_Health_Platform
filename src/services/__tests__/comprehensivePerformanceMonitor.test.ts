/**
 * Comprehensive Performance Monitor Service Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface PerformanceMetrics {
  cpu: number;
  memory: number;
  fps: number;
  networkLatency: number;
  domNodes: number;
  jsHeapSize: number;
  loadTime: number;
  timestamp: number;
}

interface PerformanceReport {
  average: PerformanceMetrics;
  peak: PerformanceMetrics;
  current: PerformanceMetrics;
  trends: TrendAnalysis;
  recommendations: string[];
}

interface TrendAnalysis {
  cpuTrend: 'increasing' | 'stable' | 'decreasing';
  memoryTrend: 'increasing' | 'stable' | 'decreasing';
  performanceScore: number;
}

class ComprehensivePerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly maxMetrics = 100;
  private readonly sampleRate = 1000; // ms

  startMonitoring(callback?: (metrics: PerformanceMetrics) => void) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const metrics = this.collectMetrics();
      this.metrics.push(metrics);
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }
      callback?.(metrics);
    }, this.sampleRate);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  private collectMetrics(): PerformanceMetrics {
    return {
      cpu: this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      fps: this.getFPS(),
      networkLatency: this.getNetworkLatency(),
      domNodes: this.getDOMNodeCount(),
      jsHeapSize: this.getJSHeapSize(),
      loadTime: this.getPageLoadTime(),
      timestamp: Date.now()
    };
  }

  private getCPUUsage(): number {
    // Simulated CPU usage
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return Math.random() * 100;
  }

  private getFPS(): number {
    // Simulated FPS calculation
    return Math.floor(Math.random() * 30) + 30;
  }

  private getNetworkLatency(): number {
    // Simulated network latency
    return Math.floor(Math.random() * 200) + 50;
  }

  private getDOMNodeCount(): number {
    if (typeof document !== 'undefined') {
      return document.getElementsByTagName('*').length;
    }
    return Math.floor(Math.random() * 1000) + 500;
  }

  private getJSHeapSize(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    return Math.random() * 100;
  }

  private getPageLoadTime(): number {
    if (typeof performance !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return navigation.loadEventEnd - navigation.fetchStart;
      }
    }
    return Math.random() * 3000;
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      throw new Error('No metrics collected');
    }

    const average = this.calculateAverage();
    const peak = this.calculatePeak();
    const current = this.getCurrentMetrics()!;
    const trends = this.analyzeTrends();
    const recommendations = this.generateRecommendations(average, peak, trends);

    return {
      average,
      peak,
      current,
      trends,
      recommendations
    };
  }

  private calculateAverage(): PerformanceMetrics {
    const sum = this.metrics.reduce((acc, metric) => ({
      cpu: acc.cpu + metric.cpu,
      memory: acc.memory + metric.memory,
      fps: acc.fps + metric.fps,
      networkLatency: acc.networkLatency + metric.networkLatency,
      domNodes: acc.domNodes + metric.domNodes,
      jsHeapSize: acc.jsHeapSize + metric.jsHeapSize,
      loadTime: acc.loadTime + metric.loadTime,
      timestamp: Date.now()
    }));

    const count = this.metrics.length;
    return {
      cpu: sum.cpu / count,
      memory: sum.memory / count,
      fps: sum.fps / count,
      networkLatency: sum.networkLatency / count,
      domNodes: sum.domNodes / count,
      jsHeapSize: sum.jsHeapSize / count,
      loadTime: sum.loadTime / count,
      timestamp: Date.now()
    };
  }

  private calculatePeak(): PerformanceMetrics {
    return this.metrics.reduce((peak, metric) => ({
      cpu: Math.max(peak.cpu, metric.cpu),
      memory: Math.max(peak.memory, metric.memory),
      fps: Math.min(peak.fps, metric.fps), // Lower FPS is worse
      networkLatency: Math.max(peak.networkLatency, metric.networkLatency),
      domNodes: Math.max(peak.domNodes, metric.domNodes),
      jsHeapSize: Math.max(peak.jsHeapSize, metric.jsHeapSize),
      loadTime: Math.max(peak.loadTime, metric.loadTime),
      timestamp: Date.now()
    }));
  }

  private analyzeTrends(): TrendAnalysis {
    if (this.metrics.length < 10) {
      return {
        cpuTrend: 'stable',
        memoryTrend: 'stable',
        performanceScore: 50
      };
    }

    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);

    const recentAvgCPU = recent.reduce((sum, m) => sum + m.cpu, 0) / recent.length;
    const olderAvgCPU = older.reduce((sum, m) => sum + m.cpu, 0) / older.length;

    const recentAvgMemory = recent.reduce((sum, m) => sum + m.memory, 0) / recent.length;
    const olderAvgMemory = older.reduce((sum, m) => sum + m.memory, 0) / older.length;

    const cpuTrend = this.determineTrend(olderAvgCPU, recentAvgCPU);
    const memoryTrend = this.determineTrend(olderAvgMemory, recentAvgMemory);

    const performanceScore = this.calculatePerformanceScore();

    return {
      cpuTrend,
      memoryTrend,
      performanceScore
    };
  }

  private determineTrend(older: number, recent: number): 'increasing' | 'stable' | 'decreasing' {
    const threshold = 5;
    if (recent > older + threshold) return 'increasing';
    if (recent < older - threshold) return 'decreasing';
    return 'stable';
  }

  private calculatePerformanceScore(): number {
    const current = this.getCurrentMetrics();
    if (!current) return 0;

    let score = 100;
    score -= Math.min(current.cpu / 2, 30);
    score -= Math.min(current.memory / 2, 30);
    score -= Math.min((100 - current.fps) / 2, 20);
    score -= Math.min(current.networkLatency / 20, 20);

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    average: PerformanceMetrics,
    peak: PerformanceMetrics,
    trends: TrendAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (average.cpu > 70) {
      recommendations.push('High CPU usage detected. Consider optimizing computations.');
    }

    if (average.memory > 80) {
      recommendations.push('High memory usage. Check for memory leaks.');
    }

    if (average.fps < 30) {
      recommendations.push('Low frame rate. Optimize rendering and animations.');
    }

    if (average.networkLatency > 1000) {
      recommendations.push('High network latency. Consider caching and CDN optimization.');
    }

    if (trends.cpuTrend === 'increasing') {
      recommendations.push('CPU usage is increasing over time.');
    }

    if (trends.memoryTrend === 'increasing') {
      recommendations.push('Memory usage is growing. Possible memory leak.');
    }

    return recommendations;
  }

  reset() {
    this.metrics = [];
    this.stopMonitoring();
  }
}

describe('ComprehensivePerformanceMonitorService', () => {
  let service: ComprehensivePerformanceMonitorService;

  beforeEach(() => {
    service = new ComprehensivePerformanceMonitorService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.reset();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      const callback = jest.fn();
      service.startMonitoring(callback);
      
      jest.advanceTimersByTime(1000);
      
      expect(callback).toHaveBeenCalled();
      const metrics = callback.mock.calls[0][0];
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('fps');
    });

    it('should stop monitoring', () => {
      const callback = jest.fn();
      service.startMonitoring(callback);
      
      jest.advanceTimersByTime(2000);
      service.stopMonitoring();
      callback.mockClear();
      
      jest.advanceTimersByTime(2000);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not start monitoring if already monitoring', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      service.startMonitoring(callback1);
      service.startMonitoring(callback2);
      
      jest.advanceTimersByTime(1000);
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect metrics over time', () => {
      service.startMonitoring();
      
      jest.advanceTimersByTime(5000);
      
      const metrics = service.getMetrics();
      expect(metrics).toHaveLength(5);
    });

    it('should limit stored metrics', () => {
      service.startMonitoring();
      
      jest.advanceTimersByTime(110000); // 110 seconds
      
      const metrics = service.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });

    it('should get current metrics', () => {
      service.startMonitoring();
      
      jest.advanceTimersByTime(1000);
      
      const current = service.getCurrentMetrics();
      expect(current).toBeDefined();
      expect(current?.timestamp).toBeDefined();
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      service.startMonitoring();
      jest.advanceTimersByTime(10000); // Collect 10 metrics
    });

    it('should generate performance report', () => {
      const report = service.generateReport();
      
      expect(report).toHaveProperty('average');
      expect(report).toHaveProperty('peak');
      expect(report).toHaveProperty('current');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
    });

    it('should calculate average metrics', () => {
      const report = service.generateReport();
      
      expect(report.average.cpu).toBeGreaterThanOrEqual(0);
      expect(report.average.cpu).toBeLessThanOrEqual(100);
      expect(report.average.memory).toBeGreaterThanOrEqual(0);
      expect(report.average.memory).toBeLessThanOrEqual(100);
    });

    it('should identify peak metrics', () => {
      const report = service.generateReport();
      
      expect(report.peak.cpu).toBeGreaterThanOrEqual(report.average.cpu);
      expect(report.peak.memory).toBeGreaterThanOrEqual(report.average.memory);
      expect(report.peak.fps).toBeLessThanOrEqual(report.average.fps);
    });

    it('should analyze trends', () => {
      const report = service.generateReport();
      
      expect(['increasing', 'stable', 'decreasing']).toContain(report.trends.cpuTrend);
      expect(['increasing', 'stable', 'decreasing']).toContain(report.trends.memoryTrend);
      expect(report.trends.performanceScore).toBeGreaterThanOrEqual(0);
      expect(report.trends.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should generate recommendations', () => {
      const report = service.generateReport();
      
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should throw error if no metrics collected', () => {
      const emptyService = new ComprehensivePerformanceMonitorService();
      
      expect(() => emptyService.generateReport()).toThrow('No metrics collected');
    });
  });

  describe('Performance Score Calculation', () => {
    it('should calculate performance score based on metrics', () => {
      service.startMonitoring();
      jest.advanceTimersByTime(5000);
      
      const report = service.generateReport();
      expect(report.trends.performanceScore).toBeGreaterThanOrEqual(0);
      expect(report.trends.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics and stop monitoring', () => {
      service.startMonitoring();
      jest.advanceTimersByTime(5000);
      
      service.reset();
      
      expect(service.getMetrics()).toHaveLength(0);
      expect(service.getCurrentMetrics()).toBeNull();
    });
  });
});
