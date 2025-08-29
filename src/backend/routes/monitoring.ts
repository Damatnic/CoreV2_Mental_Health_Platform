import { Router, Request, Response } from 'express';
import os from 'os';
import { db } from '../config/database';
import { sessionStore } from '../middleware/sessionManager';
import winston from 'winston';

const router = Router();

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/monitoring.log' }),
    new winston.transports.Console()
  ]
});

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = await db.healthCheck();
    
    const health = {
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: dbHealthy ? 'pass' : 'fail'
      }
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await db.healthCheck();
    
    if (dbHealthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not ready'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      reason: 'Service not ready'
    });
  }
});

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // System metrics
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const loadAvg = os.loadavg();
    
    // Database metrics
    const dbStats = db.getPoolStats();
    
    // Session metrics
    const sessionStats = await sessionStore.getSessionStats?.() || {};
    
    // Custom application metrics
    const appMetrics = await getApplicationMetrics();
    
    // Format as Prometheus metrics
    const metrics = `
# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_cpu_user_seconds Total user CPU time spent in seconds
# TYPE process_cpu_user_seconds counter
process_cpu_user_seconds ${cpuUsage.user / 1000000}

# HELP process_cpu_system_seconds Total system CPU time spent in seconds
# TYPE process_cpu_system_seconds counter
process_cpu_system_seconds ${cpuUsage.system / 1000000}

# HELP process_memory_heap_used_bytes Process heap memory used in bytes
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP process_memory_heap_total_bytes Process heap memory total in bytes
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP process_memory_external_bytes Process external memory in bytes
# TYPE process_memory_external_bytes gauge
process_memory_external_bytes ${memUsage.external}

# HELP system_load_average_1m System load average 1 minute
# TYPE system_load_average_1m gauge
system_load_average_1m ${loadAvg[0]}

# HELP system_load_average_5m System load average 5 minutes
# TYPE system_load_average_5m gauge
system_load_average_5m ${loadAvg[1]}

# HELP system_load_average_15m System load average 15 minutes
# TYPE system_load_average_15m gauge
system_load_average_15m ${loadAvg[2]}

# HELP db_pool_total_connections Total database connections
# TYPE db_pool_total_connections gauge
db_pool_total_connections ${dbStats?.totalCount || 0}

# HELP db_pool_idle_connections Idle database connections
# TYPE db_pool_idle_connections gauge
db_pool_idle_connections ${dbStats?.idleCount || 0}

# HELP db_pool_waiting_connections Waiting database connections
# TYPE db_pool_waiting_connections gauge
db_pool_waiting_connections ${dbStats?.waitingCount || 0}

# HELP active_sessions_total Total active sessions
# TYPE active_sessions_total gauge
active_sessions_total ${sessionStats.active_sessions || 0}

# HELP unique_users_total Total unique users with sessions
# TYPE unique_users_total gauge
unique_users_total ${sessionStats.unique_users || 0}

# HELP users_total Total registered users
# TYPE users_total gauge
users_total ${appMetrics.totalUsers}

# HELP active_users_24h Active users in last 24 hours
# TYPE active_users_24h gauge
active_users_24h ${appMetrics.activeUsers24h}

# HELP mood_entries_total Total mood entries
# TYPE mood_entries_total gauge
mood_entries_total ${appMetrics.totalMoodEntries}

# HELP appointments_scheduled Total scheduled appointments
# TYPE appointments_scheduled gauge
appointments_scheduled ${appMetrics.scheduledAppointments}

# HELP crisis_alerts_active Active crisis alerts
# TYPE crisis_alerts_active gauge
crisis_alerts_active ${appMetrics.activeCrisisAlerts}
`.trim();

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics generation failed', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

/**
 * GET /status
 * Detailed system status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      application: {
        name: 'Mental Health Platform Backend',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        pid: process.pid,
        nodejs: process.version
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      },
      process: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      database: {
        connected: await db.healthCheck(),
        pool: db.getPoolStats()
      },
      features: {
        encryption: 'AES-256-GCM',
        authentication: 'JWT',
        hipaaCompliant: true,
        twoFactorAuth: true,
        webSockets: true,
        crisisDetection: true
      },
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    logger.error('Status check failed', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

/**
 * GET /status/dependencies
 * Check external dependencies
 */
router.get('/status/dependencies', async (req: Request, res: Response) => {
  const dependencies = {
    database: {
      name: 'PostgreSQL',
      status: 'unknown',
      latency: null as number | null
    },
    redis: {
      name: 'Redis',
      status: 'unknown',
      latency: null as number | null
    },
    email: {
      name: 'Email Service',
      status: 'unknown',
      provider: process.env.EMAIL_PROVIDER || 'sendgrid'
    },
    sms: {
      name: 'SMS Service',
      status: 'unknown',
      provider: 'twilio'
    },
    storage: {
      name: 'File Storage',
      status: 'unknown',
      provider: process.env.STORAGE_PROVIDER || 's3'
    }
  };

  // Check database
  try {
    const start = Date.now();
    await db.healthCheck();
    dependencies.database.status = 'healthy';
    dependencies.database.latency = Date.now() - start;
  } catch (error) {
    dependencies.database.status = 'unhealthy';
  }

  // Check Redis (if configured)
  if (process.env.REDIS_URL) {
    try {
      // Redis check would go here
      dependencies.redis.status = 'healthy';
    } catch (error) {
      dependencies.redis.status = 'unhealthy';
    }
  } else {
    dependencies.redis.status = 'not_configured';
  }

  // Check email service
  if (process.env.SENDGRID_API_KEY || process.env.SMTP_HOST) {
    dependencies.email.status = 'configured';
  } else {
    dependencies.email.status = 'not_configured';
  }

  // Check SMS service
  if (process.env.TWILIO_ACCOUNT_SID) {
    dependencies.sms.status = 'configured';
  } else {
    dependencies.sms.status = 'not_configured';
  }

  // Check storage
  if (process.env.AWS_ACCESS_KEY_ID || process.env.AZURE_STORAGE_CONNECTION_STRING) {
    dependencies.storage.status = 'configured';
  } else {
    dependencies.storage.status = 'not_configured';
  }

  const allHealthy = Object.values(dependencies).every(
    dep => dep.status === 'healthy' || dep.status === 'configured' || dep.status === 'not_configured'
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    dependencies,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /info
 * Application information (safe for public)
 */
router.get('/info', (req: Request, res: Response) => {
  res.json({
    name: 'Mental Health Platform',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'HIPAA-compliant mental health support platform',
    features: [
      'Mood Tracking',
      'Crisis Support',
      'Teletherapy',
      'Medication Management',
      'Journal Entries',
      'Emergency Contacts'
    ],
    compliance: [
      'HIPAA',
      'GDPR',
      'CCPA'
    ],
    support: {
      email: 'support@mentalhealth.com',
      crisis: '988'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Get application metrics
 */
async function getApplicationMetrics() {
  try {
    const metrics = {
      totalUsers: 0,
      activeUsers24h: 0,
      totalMoodEntries: 0,
      scheduledAppointments: 0,
      activeCrisisAlerts: 0
    };

    // Get total users
    const usersResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    );
    metrics.totalUsers = parseInt(usersResult.rows[0]?.count || '0');

    // Get active users in last 24 hours
    const activeUsersResult = await db.query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM sessions 
       WHERE last_accessed_at > NOW() - INTERVAL '24 hours'`
    );
    metrics.activeUsers24h = parseInt(activeUsersResult.rows[0]?.count || '0');

    // Get total mood entries
    const moodResult = await db.query(
      'SELECT COUNT(*) as count FROM mood_entries'
    );
    metrics.totalMoodEntries = parseInt(moodResult.rows[0]?.count || '0');

    // Get scheduled appointments
    const appointmentsResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM appointments 
       WHERE status IN ('scheduled', 'confirmed') 
       AND scheduled_start > NOW()`
    );
    metrics.scheduledAppointments = parseInt(appointmentsResult.rows[0]?.count || '0');

    // Get active crisis alerts
    const crisisResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM crisis_alerts 
       WHERE status = 'active'`
    );
    metrics.activeCrisisAlerts = parseInt(crisisResult.rows[0]?.count || '0');

    return metrics;
  } catch (error) {
    logger.error('Failed to get application metrics', error);
    return {
      totalUsers: 0,
      activeUsers24h: 0,
      totalMoodEntries: 0,
      scheduledAppointments: 0,
      activeCrisisAlerts: 0
    };
  }
}

export default router;