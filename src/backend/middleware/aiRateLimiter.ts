import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  skipSuccessful?: boolean;
  skipFailedRequests?: boolean;
}

class AIRateLimiter {
  private requestCounts: Map<string, RateLimitEntry> = new Map();
  private rules: { [endpoint: string]: RateLimitRule } = {
    // Crisis detection - higher limits due to critical nature
    '/crisis/detect': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      skipSuccessful: false,
      skipFailedRequests: false
    },
    // AI chat - moderate limits
    '/chat': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
      skipSuccessful: false,
      skipFailedRequests: true
    },
    // Mood analysis - conservative limits
    '/mood/analyze': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 15, // 15 requests per minute
      skipSuccessful: false,
      skipFailedRequests: true
    },
    // Default rate limit
    'default': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      skipSuccessful: false,
      skipFailedRequests: false
    }
  };

  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private getRule(endpoint: string): RateLimitRule {
    return this.rules[endpoint] || this.rules['default'];
  }

  private getUserKey(req: Request): string {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as any).user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  private getEndpointFromPath(path: string): string {
    // Extract the relevant part of the path for rule matching
    if (path.includes('/crisis/detect')) return '/crisis/detect';
    if (path.includes('/chat')) return '/chat';
    if (path.includes('/mood/analyze')) return '/mood/analyze';
    return 'default';
  }

  checkLimit(req: Request, res: Response, next: NextFunction): void {
    const userKey = this.getUserKey(req);
    const endpoint = this.getEndpointFromPath(req.path);
    const rule = this.getRule(endpoint);
    const now = Date.now();
    const key = `${userKey}:${endpoint}`;

    // Get or create rate limit entry
    let entry = this.requestCounts.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + rule.windowMs,
        lastRequest: now
      };
    }

    // Check if limit exceeded
    if (entry.count >= rule.maxRequests) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many AI requests. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime,
        limit: rule.maxRequests,
        windowMs: rule.windowMs,
        endpoint
      });
      return;
    }

    // Increment counter and update entry
    entry.count++;
    entry.lastRequest = now;
    this.requestCounts.set(key, entry);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rule.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, rule.maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    // Hook into response to handle skipSuccessful/skipFailedRequests
    const originalSend = res.send;
    res.send = function(body: any) {
      const statusCode = res.statusCode;
      
      // Adjust count based on response and rule settings
      if (rule.skipSuccessful && statusCode >= 200 && statusCode < 300) {
        // Don't count successful requests
        entry!.count = Math.max(0, entry!.count - 1);
        rateLimiter.requestCounts.set(key, entry!);
      } else if (rule.skipFailedRequests && (statusCode >= 400)) {
        // Don't count failed requests
        entry!.count = Math.max(0, entry!.count - 1);
        rateLimiter.requestCounts.set(key, entry!);
      }
      
      return originalSend.call(this, body);
    };

    next();
  }

  // Get current rate limit status for a user
  getStatus(req: Request): { [endpoint: string]: any } {
    const userKey = this.getUserKey(req);
    const now = Date.now();
    const status: { [endpoint: string]: any } = {};

    for (const endpoint of Object.keys(this.rules)) {
      if (endpoint === 'default') continue;
      
      const key = `${userKey}:${endpoint}`;
      const entry = this.requestCounts.get(key);
      const rule = this.rules[endpoint];

      status[endpoint] = {
        limit: rule.maxRequests,
        remaining: entry && now <= entry.resetTime 
          ? Math.max(0, rule.maxRequests - entry.count)
          : rule.maxRequests,
        resetTime: entry?.resetTime || null,
        windowMs: rule.windowMs
      };
    }

    return status;
  }

  // Reset rate limit for a specific user (admin function)
  resetUser(userId: string, endpoint?: string): boolean {
    const userKey = `user:${userId}`;
    let resetCount = 0;

    if (endpoint) {
      const key = `${userKey}:${endpoint}`;
      if (this.requestCounts.delete(key)) {
        resetCount = 1;
      }
    } else {
      // Reset all endpoints for this user
      for (const key of this.requestCounts.keys()) {
        if (key.startsWith(userKey)) {
          this.requestCounts.delete(key);
          resetCount++;
        }
      }
    }

    return resetCount > 0;
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.requestCounts.entries()) {
      if (now > entry.resetTime) {
        this.requestCounts.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`AI Rate Limiter: Cleaned up ${cleanedCount} expired entries`);
    }
  }

  // Get statistics about rate limiting
  getStats(): any {
    const now = Date.now();
    const stats = {
      totalEntries: this.requestCounts.size,
      activeEntries: 0,
      expiredEntries: 0,
      topUsers: new Map<string, number>(),
      topEndpoints: new Map<string, number>()
    };

    for (const [key, entry] of this.requestCounts.entries()) {
      if (now <= entry.resetTime) {
        stats.activeEntries++;
        
        // Extract user and endpoint from key
        const [userPart, endpoint] = key.split(':').slice(0, 2);
        const user = `${userPart}:${key.split(':')[1]}`;
        
        // Track top users
        stats.topUsers.set(user, (stats.topUsers.get(user) || 0) + entry.count);
        
        // Track top endpoints
        stats.topEndpoints.set(endpoint, (stats.topEndpoints.get(endpoint) || 0) + entry.count);
      } else {
        stats.expiredEntries++;
      }
    }

    // Convert maps to sorted arrays
    return {
      ...stats,
      topUsers: Array.from(stats.topUsers.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topEndpoints: Array.from(stats.topEndpoints.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }

  // Configure rate limits dynamically
  setRateLimit(endpoint: string, rule: RateLimitRule): void {
    this.rules[endpoint] = { ...rule };
  }

  // Get current configuration
  getConfiguration(): { [endpoint: string]: RateLimitRule } {
    return { ...this.rules };
  }

  // Destroy the rate limiter and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requestCounts.clear();
  }
}

// Create singleton instance
const rateLimiter = new AIRateLimiter();

// Express middleware function
export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  rateLimiter.checkLimit(req, res, next);
};

// Admin endpoints for rate limit management
export const createRateLimitRoutes = () => {
  const router = require('express').Router();

  // Get rate limit status
  router.get('/status', (req: Request, res: Response) => {
    try {
      const status = rateLimiter.getStatus(req);
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get rate limit status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get rate limiter statistics (admin only)
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const stats = rateLimiter.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get rate limiter stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Reset rate limit for user (admin only)
  router.post('/reset/:userId', (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId } = req.params;
      const { endpoint } = req.body;

      const success = rateLimiter.resetUser(userId, endpoint);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Rate limit reset for user ${userId}${endpoint ? ` on endpoint ${endpoint}` : ''}` 
        });
      } else {
        res.json({ 
          success: false, 
          message: 'No active rate limits found for user' 
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to reset rate limit',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update rate limit configuration (admin only)
  router.put('/config/:endpoint', (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { endpoint } = req.params;
      const { windowMs, maxRequests, skipSuccessful, skipFailedRequests } = req.body;

      if (!windowMs || !maxRequests) {
        return res.status(400).json({
          error: 'Missing required fields: windowMs, maxRequests'
        });
      }

      rateLimiter.setRateLimit(endpoint, {
        windowMs,
        maxRequests,
        skipSuccessful,
        skipFailedRequests
      });

      res.json({
        success: true,
        message: `Rate limit updated for endpoint ${endpoint}`
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update rate limit configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get current configuration (admin only)
  router.get('/config', (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const config = rateLimiter.getConfiguration();
      res.json(config);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get rate limit configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
};

export default rateLimiter;
export { rateLimiter };