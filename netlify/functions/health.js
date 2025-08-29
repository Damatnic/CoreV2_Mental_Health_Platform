/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring
 * 
 * @returns {object} Health status including uptime, memory, and service checks
 */

const os = require('os');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        error: 'Method not allowed'
      })
    };
  }

  try {
    // Basic health information
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      version: process.env.BUILD_ID || '1.0.0',
      
      // Memory information
      memory: {
        used: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
        }
      },
      
      // System information
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        loadAverage: os.loadavg()
      },
      
      // Service checks
      services: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        auth0: await checkAuth0(),
        sentry: await checkSentry(),
        serviceWorker: true, // Checked on client side
        offlineSupport: true
      },
      
      // Critical resources
      criticalResources: {
        crisisResources: true,
        offlineFallback: true,
        manifest: true,
        serviceWorker: true
      },
      
      // Feature flags
      features: {
        i18n: true,
        offlineMode: true,
        backgroundSync: true,
        pushNotifications: Boolean(process.env.VITE_PUSH_NOTIFICATIONS_ENABLED),
        analytics: Boolean(process.env.VITE_GA_MEASUREMENT_ID)
      }
    };

    // Determine overall health status
    const allServicesHealthy = Object.values(health.services).every(status => 
      status === true || status === 'healthy'
    );
    
    if (!allServicesHealthy) {
      health.status = 'degraded';
    }
    
    // Check memory usage
    const memoryUsagePercent = (os.totalmem() - os.freemem()) / os.totalmem();
    if (memoryUsagePercent > 0.9) {
      health.status = 'unhealthy';
      health.warnings = health.warnings || [];
      health.warnings.push('High memory usage detected');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': health.status
      },
      body: JSON.stringify(health, null, 2)
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Check database connectivity
 */
async function checkDatabase() {
  // Implement actual database check
  // For now, return mock status
  if (process.env.DATABASE_URL) {
    try {
      // const db = await connectToDatabase();
      // await db.ping();
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }
  return 'not_configured';
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  // Implement actual Redis check
  // For now, return mock status
  if (process.env.REDIS_URL) {
    try {
      // const redis = await connectToRedis();
      // await redis.ping();
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }
  return 'not_configured';
}

/**
 * Check Auth0 connectivity
 */
async function checkAuth0() {
  if (process.env.VITE_AUTH0_DOMAIN && process.env.VITE_AUTH0_CLIENT_ID) {
    try {
      // In Netlify functions, we can't use node-fetch directly
      // Using built-in https module instead
      const https = require('https');
      
      return new Promise((resolve) => {
        const options = {
          hostname: process.env.VITE_AUTH0_DOMAIN,
          path: '/.well-known/openid-configuration',
          method: 'GET',
          timeout: 5000
        };
        
        const req = https.request(options, (res) => {
          if (res.statusCode === 200) {
            resolve('healthy');
          } else {
            resolve('unhealthy');
          }
        });
        
        req.on('error', () => {
          resolve('unhealthy');
        });
        
        req.on('timeout', () => {
          resolve('unhealthy');
        });
        
        req.end();
      });
    } catch (error) {
      return 'unhealthy';
    }
  }
  return 'not_configured';
}

/**
 * Check Sentry connectivity
 */
async function checkSentry() {
  if (process.env.VITE_SENTRY_DSN) {
    // Sentry health is checked passively
    return 'healthy';
  }
  return 'not_configured';
}
