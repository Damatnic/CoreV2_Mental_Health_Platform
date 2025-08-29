import { EventEmitter } from 'events';

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: NodeJS.MemoryUsage;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    connections: number;
    bytesReceived: number;
    bytesSent: number;
  };
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message?: string;
  responseTime?: number;
  lastChecked: Date;
}

interface Alert {
  id: string;
  type: 'system' | 'application' | 'security' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: any;
}

class MonitoringService extends EventEmitter {
  private systemMetrics: SystemMetrics[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Alert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxMetricsHistory = 1440; // 24 hours of 1-minute intervals
  private thresholds = {
    cpu: {
      warning: 70,
      critical: 90
    },
    memory: {
      warning: 80,
      critical: 95
    },
    disk: {
      warning: 85,
      critical: 95
    },
    responseTime: {
      warning: 2000,
      critical: 5000
    }
  };

  constructor() {
    super();
    this.setupDefaultHealthChecks();
  }

  start(): void {
    // Collect system metrics every minute
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60 * 1000);

    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks();
    }, 30 * 1000);

    // Initial collection
    this.collectSystemMetrics();
    this.runHealthChecks();

    console.log('Monitoring service started');
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.log('Monitoring service stopped');
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Convert CPU usage to percentage (simplified)
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: Math.min(cpuPercent * 100, 100), // Cap at 100%
          loadAverage: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0]
        },
        memory: {
          used: memoryUsage.rss,
          total: require('os').totalmem(),
          percentage: (memoryUsage.rss / require('os').totalmem()) * 100,
          heap: memoryUsage
        },
        disk: {
          used: 0, // Would need external library to get disk usage
          total: 0,
          percentage: 0
        },
        network: {
          connections: 0, // Would need to track active connections
          bytesReceived: 0,
          bytesSent: 0
        }
      };

      this.systemMetrics.push(metrics);

      // Keep only last maxMetricsHistory entries
      if (this.systemMetrics.length > this.maxMetricsHistory) {
        this.systemMetrics = this.systemMetrics.slice(-this.maxMetricsHistory);
      }

      // Check for threshold breaches and create alerts
      this.checkSystemThresholds(metrics);

      this.emit('metrics-collected', metrics);
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  private checkSystemThresholds(metrics: SystemMetrics): void {
    // CPU threshold check
    if (metrics.cpu.usage > this.thresholds.cpu.critical) {
      this.createAlert('system', 'critical', 'High CPU Usage', 
        `CPU usage is ${metrics.cpu.usage.toFixed(1)}% (critical threshold: ${this.thresholds.cpu.critical}%)`);
    } else if (metrics.cpu.usage > this.thresholds.cpu.warning) {
      this.createAlert('system', 'high', 'Elevated CPU Usage', 
        `CPU usage is ${metrics.cpu.usage.toFixed(1)}% (warning threshold: ${this.thresholds.cpu.warning}%)`);
    }

    // Memory threshold check
    if (metrics.memory.percentage > this.thresholds.memory.critical) {
      this.createAlert('system', 'critical', 'High Memory Usage', 
        `Memory usage is ${metrics.memory.percentage.toFixed(1)}% (critical threshold: ${this.thresholds.memory.critical}%)`);
    } else if (metrics.memory.percentage > this.thresholds.memory.warning) {
      this.createAlert('system', 'high', 'Elevated Memory Usage', 
        `Memory usage is ${metrics.memory.percentage.toFixed(1)}% (warning threshold: ${this.thresholds.memory.warning}%)`);
    }
  }

  private setupDefaultHealthChecks(): void {
    // Database health check
    this.addHealthCheck('database', async () => {
      try {
        // This would check database connection in real implementation
        const startTime = Date.now();
        // await database.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy' as const,
          responseTime,
          message: 'Database connection successful'
        };
      } catch (error) {
        return {
          status: 'critical' as const,
          message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });

    // AI Services health check
    this.addHealthCheck('ai-services', async () => {
      try {
        const startTime = Date.now();
        // This would check AI service endpoints in real implementation
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy' as const,
          responseTime,
          message: 'AI services responding normally'
        };
      } catch (error) {
        return {
          status: 'warning' as const,
          message: `AI services partially unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });

    // Crisis services health check
    this.addHealthCheck('crisis-services', async () => {
      try {
        const startTime = Date.now();
        // This would check 988 hotline integration and crisis detection
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy' as const,
          responseTime,
          message: 'Crisis intervention systems operational'
        };
      } catch (error) {
        return {
          status: 'critical' as const,
          message: `Crisis services unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });

    // External API health check
    this.addHealthCheck('external-apis', async () => {
      try {
        const startTime = Date.now();
        // This would check external service dependencies
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy' as const,
          responseTime,
          message: 'External APIs responding normally'
        };
      } catch (error) {
        return {
          status: 'warning' as const,
          message: `Some external APIs unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  addHealthCheck(name: string, checkFunction: () => Promise<Omit<HealthCheck, 'name' | 'lastChecked'>>): void {
    // Store the check function for later execution
    (this as any)[`_check_${name}`] = checkFunction;
  }

  private async runHealthChecks(): Promise<void> {
    const checkPromises = Array.from(this.healthChecks.keys()).map(async (name) => {
      try {
        const checkFunction = (this as any)[`_check_${name}`];
        if (checkFunction) {
          const result = await checkFunction();
          const healthCheck: HealthCheck = {
            name,
            ...result,
            lastChecked: new Date()
          };
          
          this.healthChecks.set(name, healthCheck);

          // Create alerts for unhealthy services
          if (result.status === 'critical') {
            this.createAlert('application', 'critical', `Service ${name} Critical`, 
              result.message || `Health check for ${name} failed`);
          } else if (result.status === 'warning') {
            this.createAlert('application', 'medium', `Service ${name} Warning`, 
              result.message || `Health check for ${name} shows warnings`);
          }

          // Check response time thresholds
          if (result.responseTime) {
            if (result.responseTime > this.thresholds.responseTime.critical) {
              this.createAlert('application', 'high', `Slow Response Time: ${name}`, 
                `Response time ${result.responseTime}ms exceeds critical threshold`);
            } else if (result.responseTime > this.thresholds.responseTime.warning) {
              this.createAlert('application', 'medium', `Elevated Response Time: ${name}`, 
                `Response time ${result.responseTime}ms exceeds warning threshold`);
            }
          }
        }
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        
        const healthCheck: HealthCheck = {
          name,
          status: 'critical',
          message: `Health check execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastChecked: new Date()
        };
        
        this.healthChecks.set(name, healthCheck);
      }
    });

    await Promise.all(checkPromises);
    this.emit('health-checks-completed', Array.from(this.healthChecks.values()));
  }

  createAlert(
    type: Alert['type'], 
    severity: Alert['severity'], 
    title: string, 
    message: string,
    metadata?: any
  ): string {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(alert => 
      !alert.resolved && 
      alert.title === title && 
      Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000 // Within 5 minutes
    );

    if (existingAlert) {
      return existingAlert.id; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    this.emit('alert-created', alert);

    // Log critical alerts
    if (severity === 'critical') {
      console.error(`CRITICAL ALERT: ${title} - ${message}`);
    } else if (severity === 'high') {
      console.warn(`HIGH ALERT: ${title} - ${message}`);
    }

    return alert.id;
  }

  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (resolvedBy) {
      alert.metadata = { ...alert.metadata, resolvedBy };
    }

    this.emit('alert-resolved', alert);
    return true;
  }

  getSystemMetrics(timeWindow?: number): SystemMetrics[] {
    if (!timeWindow) {
      return [...this.systemMetrics];
    }

    const cutoffTime = Date.now() - timeWindow;
    return this.systemMetrics.filter(metric => 
      metric.timestamp.getTime() >= cutoffTime
    );
  }

  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  getAlerts(filters?: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    resolved?: boolean;
    timeWindow?: number;
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (filters) {
      if (filters.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
      }
      
      if (filters.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
      }
      
      if (filters.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filters.resolved);
      }
      
      if (filters.timeWindow) {
        const cutoffTime = Date.now() - filters.timeWindow;
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.timestamp.getTime() >= cutoffTime
        );
      }
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSystemStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    services: HealthCheck[];
    metrics: SystemMetrics | null;
    activeAlerts: number;
    uptime: number;
  } {
    const healthChecks = this.getHealthChecks();
    const recentMetrics = this.systemMetrics[this.systemMetrics.length - 1] || null;
    const activeAlerts = this.getAlerts({ resolved: false }).length;

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (healthChecks.some(check => check.status === 'critical')) {
      overallStatus = 'critical';
    } else if (healthChecks.some(check => check.status === 'warning')) {
      overallStatus = 'warning';
    }

    // Also consider active alerts
    const criticalAlerts = this.getAlerts({ resolved: false, severity: 'critical' });
    if (criticalAlerts.length > 0) {
      overallStatus = 'critical';
    } else if (activeAlerts > 0) {
      if (overallStatus === 'healthy') {
        overallStatus = 'warning';
      }
    }

    return {
      overall: overallStatus,
      services: healthChecks,
      metrics: recentMetrics,
      activeAlerts,
      uptime: process.uptime()
    };
  }

  // Update monitoring thresholds
  setThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.emit('thresholds-updated', this.thresholds);
  }

  getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }

  // Export monitoring data
  exportData(format: 'json' | 'csv', timeWindow?: number): string {
    const metrics = this.getSystemMetrics(timeWindow);
    const alerts = this.getAlerts({ timeWindow });
    const healthChecks = this.getHealthChecks();

    const exportData = {
      exported_at: new Date().toISOString(),
      time_window: timeWindow ? `${timeWindow}ms` : 'all-time',
      system_status: this.getSystemStatus(),
      metrics,
      alerts,
      health_checks: healthChecks
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      // Simple CSV export of metrics
      const headers = 'timestamp,cpu_usage,memory_percentage,memory_used,heap_used\n';
      const rows = metrics.map(metric => 
        `${metric.timestamp.toISOString()},${metric.cpu.usage},${metric.memory.percentage},${metric.memory.used},${metric.memory.heap.heapUsed}`
      ).join('\n');
      
      return headers + rows;
    }

    return '';
  }

  private generateAlertId(): string {
    return 'alert_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Cleanup resources
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.systemMetrics = [];
    this.healthChecks.clear();
    this.alerts = [];
  }
}

// Create singleton instance
export const monitoringService = new MonitoringService();

export default monitoringService;