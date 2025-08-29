import express from 'express';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Analytics data store (in production, use proper database)
interface AnalyticsEvent {
  id: string;
  userId: string;
  event: string;
  timestamp: Date;
  metadata: any;
  sessionId: string;
}

interface UserMetrics {
  userId: string;
  sessionsCount: number;
  totalTimeSpent: number;
  featuresUsed: string[];
  lastActivity: Date;
  crisisInterventions: number;
  moodEntries: number;
}

// In-memory storage for demo (use database in production)
const analyticsEvents: AnalyticsEvent[] = [];
const userMetrics: Map<string, UserMetrics> = new Map();

// Track analytics event
router.post('/event', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { event, metadata, sessionId } = req.body;
    const userId = (req as any).user?.id;

    if (!event || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: event'
      });
    }

    // Create analytics event
    const analyticsEvent: AnalyticsEvent = {
      id: generateId(),
      userId,
      event,
      timestamp: new Date(),
      metadata: metadata || {},
      sessionId: sessionId || generateId()
    };

    // Store event (in production, save to database)
    analyticsEvents.push(analyticsEvent);

    // Update user metrics
    updateUserMetrics(userId, event, metadata);

    res.json({
      success: true,
      eventId: analyticsEvent.id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to track analytics event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user analytics
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = (req as any).user?.id;

    // Ensure user can only access their own analytics (unless admin)
    if (userId !== requestingUserId && (req as any).user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized to access user analytics'
      });
    }

    const metrics = userMetrics.get(userId) || {
      userId,
      sessionsCount: 0,
      totalTimeSpent: 0,
      featuresUsed: [],
      lastActivity: new Date(),
      crisisInterventions: 0,
      moodEntries: 0
    };

    // Get recent events for the user
    const recentEvents = analyticsEvents
      .filter(event => event.userId === userId)
      .slice(-50)
      .map(event => ({
        event: event.event,
        timestamp: event.timestamp,
        metadata: event.metadata
      }));

    res.json({
      metrics,
      recentEvents,
      summary: {
        engagementScore: calculateEngagementScore(metrics),
        riskLevel: calculateRiskLevel(recentEvents),
        recommendations: generateRecommendations(metrics, recentEvents)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get platform analytics (admin only)
router.get('/platform', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate platform metrics
    const totalUsers = userMetrics.size;
    const activeUsers24h = Array.from(userMetrics.values())
      .filter(metrics => metrics.lastActivity >= last24h).length;
    const activeUsers7d = Array.from(userMetrics.values())
      .filter(metrics => metrics.lastActivity >= last7d).length;

    const events24h = analyticsEvents.filter(event => event.timestamp >= last24h);
    const crisisEvents24h = events24h.filter(event => event.event.includes('crisis')).length;

    const topFeatures = getTopFeatures(events24h);
    const averageSessionTime = calculateAverageSessionTime();

    res.json({
      totalUsers,
      activeUsers24h,
      activeUsers7d,
      events24h: events24h.length,
      crisisEvents24h,
      averageSessionTime,
      topFeatures,
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get platform analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get crisis analytics (admin only)
router.get('/crisis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const crisisEvents = analyticsEvents.filter(event => 
      event.event.includes('crisis') || 
      event.event.includes('emergency') ||
      event.event === 'panic_button_pressed'
    );

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const crisisEvents24h = crisisEvents.filter(event => event.timestamp >= last24h);

    const crisisStats = {
      totalCrisisEvents: crisisEvents.length,
      crisisEvents24h: crisisEvents24h.length,
      averageResponseTime: calculateAverageResponseTime(crisisEvents),
      successfulInterventions: crisisEvents.filter(event => 
        event.metadata?.outcome === 'resolved' || 
        event.metadata?.connected_to_support === true
      ).length,
      crisisTypes: getCrisisTypes(crisisEvents),
      hourlyDistribution: getHourlyDistribution(crisisEvents24h)
    };

    res.json(crisisStats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get crisis analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export analytics data (admin only)
router.get('/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const { startDate, endDate, userId } = req.query;

    let filteredEvents = analyticsEvents;

    if (startDate) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp >= new Date(startDate as string)
      );
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp <= new Date(endDate as string)
      );
    }

    if (userId) {
      filteredEvents = filteredEvents.filter(event => 
        event.userId === userId
      );
    }

    // Anonymize data for export
    const anonymizedEvents = filteredEvents.map(event => ({
      id: event.id,
      userId: hashUserId(event.userId), // Hash for privacy
      event: event.event,
      timestamp: event.timestamp,
      metadata: sanitizeMetadata(event.metadata)
    }));

    res.json({
      events: anonymizedEvents,
      exportTimestamp: new Date(),
      totalEvents: anonymizedEvents.length,
      dateRange: {
        start: startDate || 'all-time',
        end: endDate || 'now'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to export analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function updateUserMetrics(userId: string, event: string, metadata: any): void {
  let metrics = userMetrics.get(userId) || {
    userId,
    sessionsCount: 0,
    totalTimeSpent: 0,
    featuresUsed: [],
    lastActivity: new Date(),
    crisisInterventions: 0,
    moodEntries: 0
  };

  metrics.lastActivity = new Date();

  // Update specific metrics based on event type
  if (event === 'session_start') {
    metrics.sessionsCount++;
  }

  if (event === 'session_end' && metadata?.duration) {
    metrics.totalTimeSpent += metadata.duration;
  }

  if (event.includes('crisis')) {
    metrics.crisisInterventions++;
  }

  if (event === 'mood_entry') {
    metrics.moodEntries++;
  }

  // Track feature usage
  const feature = extractFeatureFromEvent(event);
  if (feature && !metrics.featuresUsed.includes(feature)) {
    metrics.featuresUsed.push(feature);
  }

  userMetrics.set(userId, metrics);
}

function extractFeatureFromEvent(event: string): string | null {
  const eventFeatureMap: { [key: string]: string } = {
    'mood_entry': 'mood-tracking',
    'journal_entry': 'journaling',
    'crisis_detection': 'crisis-support',
    'ai_chat': 'ai-assistant',
    'appointment_booked': 'teletherapy',
    'panic_button_pressed': 'panic-button',
    'resource_accessed': 'resources'
  };

  return eventFeatureMap[event] || null;
}

function calculateEngagementScore(metrics: UserMetrics): number {
  const sessionScore = Math.min(metrics.sessionsCount / 10, 1) * 30;
  const featureScore = Math.min(metrics.featuresUsed.length / 5, 1) * 30;
  const activityScore = metrics.moodEntries > 0 ? 20 : 0;
  const consistencyScore = calculateConsistencyScore(metrics);

  return Math.round(sessionScore + featureScore + activityScore + consistencyScore);
}

function calculateConsistencyScore(metrics: UserMetrics): number {
  const daysSinceLastActivity = (Date.now() - metrics.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastActivity <= 1) return 20;
  if (daysSinceLastActivity <= 3) return 15;
  if (daysSinceLastActivity <= 7) return 10;
  if (daysSinceLastActivity <= 14) return 5;
  return 0;
}

function calculateRiskLevel(events: any[]): 'low' | 'medium' | 'high' {
  const crisisEvents = events.filter(event => 
    event.event.includes('crisis') || 
    event.event === 'panic_button_pressed'
  );

  const negativeEvents = events.filter(event => 
    event.metadata?.mood === 'negative' || 
    event.metadata?.mood === 'depressed'
  );

  if (crisisEvents.length > 0) return 'high';
  if (negativeEvents.length > events.length * 0.6) return 'medium';
  return 'low';
}

function generateRecommendations(metrics: UserMetrics, events: any[]): string[] {
  const recommendations = [];

  if (metrics.sessionsCount < 5) {
    recommendations.push('Consider exploring more platform features');
  }

  if (metrics.moodEntries === 0) {
    recommendations.push('Try tracking your mood to identify patterns');
  }

  if (!metrics.featuresUsed.includes('crisis-support')) {
    recommendations.push('Familiarize yourself with crisis support features');
  }

  const recentCrisisEvents = events.filter(event => 
    event.event.includes('crisis') && 
    new Date(event.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  if (recentCrisisEvents.length > 0) {
    recommendations.push('Consider scheduling a session with a mental health professional');
  }

  return recommendations;
}

function getTopFeatures(events: any[]): Array<{feature: string, count: number}> {
  const featureCount: { [key: string]: number } = {};
  
  events.forEach(event => {
    const feature = extractFeatureFromEvent(event.event);
    if (feature) {
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    }
  });

  return Object.entries(featureCount)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateAverageSessionTime(): number {
  const sessionTimes = Array.from(userMetrics.values())
    .map(metrics => metrics.totalTimeSpent / Math.max(metrics.sessionsCount, 1))
    .filter(time => time > 0);

  if (sessionTimes.length === 0) return 0;
  return Math.round(sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length);
}

function calculateAverageResponseTime(crisisEvents: AnalyticsEvent[]): number {
  const responseTimes = crisisEvents
    .filter(event => event.metadata?.responseTime)
    .map(event => event.metadata.responseTime);

  if (responseTimes.length === 0) return 0;
  return Math.round(responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length);
}

function getCrisisTypes(crisisEvents: AnalyticsEvent[]): Array<{type: string, count: number}> {
  const typeCount: { [key: string]: number } = {};
  
  crisisEvents.forEach(event => {
    const type = event.metadata?.crisisType || 'unspecified';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  return Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

function getHourlyDistribution(events: AnalyticsEvent[]): Array<{hour: number, count: number}> {
  const hourCount: { [key: number]: number } = {};
  
  events.forEach(event => {
    const hour = event.timestamp.getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCount[hour] || 0
  }));
}

function hashUserId(userId: string): string {
  // Simple hash for demo (use proper crypto in production)
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `user_${Math.abs(hash)}`;
}

function sanitizeMetadata(metadata: any): any {
  if (!metadata) return {};
  
  // Remove sensitive information
  const sanitized = { ...metadata };
  delete sanitized.ip;
  delete sanitized.userAgent;
  delete sanitized.personalInfo;
  
  return sanitized;
}

export default router;