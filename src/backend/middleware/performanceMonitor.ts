import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  userAgent?: string;
  userId?: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

interface EndpointStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  errorRate: number;
  lastUpdated: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private endpointStats: Map<string, EndpointStats> = new Map();
  private maxMetricsHistory = 10000;
  private cleanupInterval: NodeJS.Timeout;
  private alertThresholds = {
    slowResponseTime: 5000, // 5 seconds
    highErrorRate: 0.1, // 10%
    highMemoryUsage: 500 * 1024 * 1024, // 500MB
    highCpuUsage: 80 // 80% of a single core
  };

  constructor() {
    // Cleanup old metrics every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);

    // Monitor overall system performance
    this.startSystemMonitoring();
  }

  // Middleware function to track request performance
  trackRequest = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = performance.now();
    const startCpuUsage = process.cpuUsage();
    const startMemory = process.memoryUsage();

    // Store start time for later use
    (req as any).performanceStart = startTime;
    (req as any).startCpuUsage = startCpuUsage;

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = (chunk?: any, encoding?: any) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const endMemory = process.memoryUsage();

      // Create performance metric
      const metric: PerformanceMetric = {
        endpoint: this.normalizeEndpoint(req.path),
        method: req.method,
        duration,
        timestamp: new Date(),
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        },
        cpuUsage: endCpuUsage
      };

      // Store metric and update stats
      this.addMetric(metric);
      this.checkAlerts(metric);

      // Call original end function
      originalEnd.call(res, chunk, encoding);
    };

    next();
  };

  private normalizeEndpoint(path: string): string {
    // Normalize paths by replacing IDs with placeholders
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-zA-Z0-9_-]{8,}/g, '/:id');
  }

  private addMetric(metric: PerformanceMetric): void {
    // Add to metrics history
    this.metrics.push(metric);

    // Update endpoint statistics
    const endpointKey = `${metric.method} ${metric.endpoint}`;
    let stats = this.endpointStats.get(endpointKey);

    if (!stats) {
      stats = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        errorRate: 0,
        lastUpdated: new Date()
      };
    }

    // Update statistics
    stats.count++;
    stats.totalDuration += metric.duration;
    stats.averageDuration = stats.totalDuration / stats.count;
    stats.minDuration = Math.min(stats.minDuration, metric.duration);
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
    
    if (metric.statusCode >= 400) {
      stats.errorCount++;
    }
    
    stats.errorRate = stats.errorCount / stats.count;
    stats.lastUpdated = new Date();

    this.endpointStats.set(endpointKey, stats);

    // Keep metrics history within limits
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private checkAlerts(metric: PerformanceMetric): void {
    const alerts = [];

    // Check slow response time
    if (metric.duration > this.alertThresholds.slowResponseTime) {
      alerts.push({
        type: 'slow_response',
        endpoint: `${metric.method} ${metric.endpoint}`,
        duration: metric.duration,
        threshold: this.alertThresholds.slowResponseTime,
        severity: 'warning'
      });
    }

    // Check memory usage
    if (metric.memoryUsage.heapUsed > this.alertThresholds.highMemoryUsage) {
      alerts.push({
        type: 'high_memory',
        memoryUsage: metric.memoryUsage.heapUsed,
        threshold: this.alertThresholds.highMemoryUsage,
        severity: 'critical'
      });
    }

    // Check error rate for endpoint
    const endpointKey = `${metric.method} ${metric.endpoint}`;
    const stats = this.endpointStats.get(endpointKey);
    if (stats && stats.errorRate > this.alertThresholds.highErrorRate) {
      alerts.push({
        type: 'high_error_rate',
        endpoint: endpointKey,
        errorRate: stats.errorRate,
        threshold: this.alertThresholds.highErrorRate,
        severity: 'critical'
      });
    }

    // Log alerts (in production, send to monitoring service)
    if (alerts.length > 0) {
      console.warn('Performance Alerts:', alerts);
    }
  }

  private startSystemMonitoring(): void {
    // Monitor system performance every 30 seconds
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Log system metrics (in production, send to monitoring service)
      if (memoryUsage.heapUsed > this.alertThresholds.highMemoryUsage) {
        console.warn('System Alert: High memory usage', {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss
        });
      }
    }, 30000);
  }

  // Get performance statistics
  getStats(timeWindow?: number): any {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const filteredMetrics = this.metrics.filter(metric => 
      metric.timestamp.getTime() >= windowStart
    );

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        endpoints: []
      };
    }

    // Calculate overall statistics
    const totalRequests = filteredMetrics.length;
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalDuration / totalRequests;
    const errorCount = filteredMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = errorCount / totalRequests;

    // Get top endpoints by request count
    const endpointCounts: { [key: string]: number } = {};
    filteredMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      endpointCounts[key] = (endpointCounts[key] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => {
        const endpointMetrics = filteredMetrics.filter(m => 
          `${m.method} ${m.endpoint}` === endpoint
        );
        const avgDuration = endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / count;
        
        return {
          endpoint,
          count,
          averageResponseTime: avgDuration,
          errorCount: endpointMetrics.filter(m => m.statusCode >= 400).length
        };
      });

    return {
      timeWindow: timeWindow || 'all-time',
      totalRequests,
      averageResponseTime,
      errorRate,
      errorCount,
      topEndpoints,
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
  }

  // Get slow requests
  getSlowRequests(limit = 50, threshold = 1000): PerformanceMetric[] {
    return this.metrics
      .filter(metric => metric.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Get error requests
  getErrorRequests(limit = 50): PerformanceMetric[] {
    return this.metrics
      .filter(metric => metric.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get endpoint statistics
  getEndpointStats(): Map<string, EndpointStats> {
    return new Map(this.endpointStats);
  }

  // Get health status
  getHealth(): any {
    const stats = this.getStats(5 * 60 * 1000); // Last 5 minutes
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const health = {
      status: 'healthy',
      uptime,
      memoryUsage,
      responseTime: stats.averageResponseTime,
      errorRate: stats.errorRate,
      totalRequests: stats.totalRequests,
      issues: [] as string[]
    };

    // Check for health issues
    if (stats.averageResponseTime > this.alertThresholds.slowResponseTime / 2) {
      health.issues.push('High response times detected');
      health.status = 'warning';
    }

    if (stats.errorRate > this.alertThresholds.highErrorRate / 2) {
      health.issues.push('High error rate detected');
      health.status = 'warning';
    }

    if (memoryUsage.heapUsed > this.alertThresholds.highMemoryUsage) {
      health.issues.push('High memory usage detected');
      health.status = 'critical';
    }

    return health;
  }

  // Configure alert thresholds
  setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  // Get alert thresholds
  getAlertThresholds(): typeof this.alertThresholds {
    return { ...this.alertThresholds };
  }

  // Clean up old metrics
  private cleanup(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const initialLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => 
      metric.timestamp.getTime() > oneDayAgo
    );

    const removed = initialLength - this.metrics.length;
    if (removed > 0) {
      console.log(`Performance Monitor: Cleaned up ${removed} old metrics`);
    }

    // Clean up old endpoint stats (keep only active ones)
    const activeEndpoints = new Set(
      this.metrics.map(m => `${m.method} ${m.endpoint}`)
    );

    for (const [endpoint, stats] of this.endpointStats.entries()) {
      if (!activeEndpoints.has(endpoint) && 
          Date.now() - stats.lastUpdated.getTime() > 24 * 60 * 60 * 1000) {
        this.endpointStats.delete(endpoint);
      }
    }
  }

  // Export metrics for external monitoring
  exportMetrics(format: 'json' | 'csv' = 'json', timeWindow?: number): string {
    const stats = this.getStats(timeWindow);
    
    if (format === 'json') {
      return JSON.stringify({
        exported_at: new Date().toISOString(),
        ...stats
      }, null, 2);
    } else if (format === 'csv') {
      // Simple CSV export of recent metrics
      const headers = 'timestamp,endpoint,method,duration,status_code,user_id\n';
      const now = Date.now();
      const windowStart = timeWindow ? now - timeWindow : 0;
      
      const filteredMetrics = this.metrics.filter(metric => 
        metric.timestamp.getTime() >= windowStart
      );

      const rows = filteredMetrics.map(metric => 
        `${metric.timestamp.toISOString()},${metric.endpoint},${metric.method},${metric.duration},${metric.statusCode},${metric.userId || ''}`
      ).join('\n');

      return headers + rows;
    }

    return '';
  }

  // Destroy monitor and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.metrics = [];
    this.endpointStats.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Express middleware
export const performanceMiddleware = performanceMonitor.trackRequest;

// Export monitor instance for direct access
export { performanceMonitor };

export default performanceMonitor;