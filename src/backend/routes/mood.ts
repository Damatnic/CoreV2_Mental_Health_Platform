import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/mood.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * HIPAA-compliant audit logging for mood data
 */
const auditLog = async (
  userId: string,
  action: string,
  resourceId: string | null,
  details: any,
  req: Request
) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent, request_id, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId,
        action,
        'mood_entry',
        resourceId,
        JSON.stringify(details),
        req.ip,
        req.headers['user-agent'],
        req.headers['x-request-id'] || uuidv4()
      ]
    );
  } catch (error) {
    logger.error('Failed to create audit log', { error, action, userId });
  }
};

/**
 * Crisis detection algorithm
 */
const detectCrisis = async (moodData: any, userId: string): Promise<boolean> => {
  try {
    // Check for crisis indicators
    const crisisIndicators = {
      veryLowMood: moodData.moodScore <= 2,
      highAnxiety: moodData.anxietyLevel >= 8,
      highStress: moodData.stressLevel >= 8,
      criticalEmotions: ['suicidal', 'hopeless', 'desperate', 'panic'].some(
        emotion => moodData.emotions?.includes(emotion)
      ),
      criticalTriggers: ['self-harm', 'suicide', 'crisis'].some(
        trigger => moodData.triggers?.includes(trigger)
      )
    };

    // Check recent mood pattern (last 7 days)
    const recentMoodsResult = await db.query(
      `SELECT mood_score, anxiety_level, stress_level
       FROM mood_entries
       WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    const recentMoods = recentMoodsResult.rows;
    const avgMoodScore = recentMoods.reduce((sum, m) => sum + m.mood_score, 0) / recentMoods.length;
    const decliningPattern = recentMoods.length >= 3 && 
      recentMoods[0].mood_score < recentMoods[2].mood_score - 2;

    // Determine if crisis intervention needed
    const needsIntervention = 
      crisisIndicators.veryLowMood ||
      crisisIndicators.criticalEmotions ||
      crisisIndicators.criticalTriggers ||
      (crisisIndicators.highAnxiety && crisisIndicators.highStress) ||
      (avgMoodScore < 3 && decliningPattern);

    if (needsIntervention) {
      // Create crisis event
      await db.query(
        `INSERT INTO crisis_events (
          id, user_id, severity, trigger_type, trigger_details,
          detected_by, detection_method, keywords, confidence_score,
          response_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          uuidv4(),
          userId,
          crisisIndicators.criticalEmotions || crisisIndicators.criticalTriggers ? 'high' : 'medium',
          'mood_entry',
          JSON.stringify({ moodData, indicators: crisisIndicators }),
          'system',
          'mood_analysis',
          moodData.emotions,
          0.85,
          'pending'
        ]
      );

      logger.warn('Crisis detected from mood entry', {
        userId,
        indicators: crisisIndicators,
        moodScore: moodData.moodScore
      });
    }

    return needsIntervention;
  } catch (error) {
    logger.error('Crisis detection failed', { error, userId });
    return false;
  }
};

/**
 * POST /api/mood/entries
 * Create new mood entry
 */
router.post('/entries',
  authenticate,
  [
    body('mood').isIn(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']),
    body('moodScore').isInt({ min: 1, max: 10 }),
    body('emotions').optional().isArray(),
    body('triggers').optional().isArray(),
    body('activities').optional().isArray(),
    body('sleepHours').optional().isFloat({ min: 0, max: 24 }),
    body('energyLevel').optional().isInt({ min: 1, max: 10 }),
    body('anxietyLevel').optional().isInt({ min: 1, max: 10 }),
    body('stressLevel').optional().isInt({ min: 1, max: 10 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('location').optional().isString(),
    body('weather').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const moodData = req.body;

      // Check for duplicate entry in last hour
      const duplicateCheck = await db.query(
        `SELECT id FROM mood_entries 
         WHERE user_id = $1 
           AND created_at > NOW() - INTERVAL '1 hour'
         LIMIT 1`,
        [userId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(429).json({ 
          error: 'Please wait at least an hour between mood entries',
          nextAllowedTime: new Date(Date.now() + 3600000)
        });
      }

      // Encrypt sensitive notes
      let encryptedNotes = null;
      if (moodData.notes) {
        encryptedNotes = db.encrypt(moodData.notes);
      }

      // Insert mood entry
      const result = await db.query(
        `INSERT INTO mood_entries (
          id, user_id, mood, mood_score, emotions, triggers, activities,
          sleep_hours, energy_level, anxiety_level, stress_level,
          notes, location, weather, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING id, mood, mood_score, emotions, triggers, activities,
                  sleep_hours, energy_level, anxiety_level, stress_level,
                  location, weather, created_at`,
        [
          uuidv4(),
          userId,
          moodData.mood,
          moodData.moodScore,
          JSON.stringify(moodData.emotions || []),
          JSON.stringify(moodData.triggers || []),
          JSON.stringify(moodData.activities || []),
          moodData.sleepHours,
          moodData.energyLevel,
          moodData.anxietyLevel,
          moodData.stressLevel,
          encryptedNotes,
          moodData.location,
          moodData.weather
        ]
      );

      const entry = result.rows[0];

      // Check for crisis indicators
      const crisisDetected = await detectCrisis(moodData, userId);

      // Generate insights
      const insights = await generateMoodInsights(userId);

      // Audit log
      await auditLog(userId, 'create_mood_entry', entry.id, {
        mood: moodData.mood,
        score: moodData.moodScore,
        crisis_detected: crisisDetected
      }, req);

      res.status(201).json({
        message: 'Mood entry created successfully',
        entry,
        insights,
        crisisSupport: crisisDetected ? {
          message: 'We noticed you might be going through a difficult time',
          resources: [
            { name: '988 Crisis Lifeline', number: '988', available: '24/7' },
            { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' }
          ]
        } : null
      });
    } catch (error: any) {
      logger.error('Failed to create mood entry', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to create mood entry' });
    }
  }
);

/**
 * GET /api/mood/entries
 * Get mood entries with pagination and filtering
 */
router.get('/entries',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('mood').optional().isIn(['very_sad', 'sad', 'neutral', 'happy', 'very_happy'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
        endDate = new Date(),
        limit = 50,
        offset = 0,
        mood
      } = req.query;

      // Build query
      let whereConditions = ['user_id = $1', 'created_at BETWEEN $2 AND $3'];
      let queryParams: any[] = [userId, startDate, endDate];
      let paramCount = 4;

      if (mood) {
        whereConditions.push(`mood = $${paramCount}`);
        queryParams.push(mood);
        paramCount++;
      }

      // Get entries
      const entriesResult = await db.query(
        `SELECT 
          id, mood, mood_score, emotions, triggers, activities,
          sleep_hours, energy_level, anxiety_level, stress_level,
          location, weather, created_at
        FROM mood_entries
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...queryParams, limit, offset]
      );

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total
         FROM mood_entries
         WHERE ${whereConditions.join(' AND ')}`,
        queryParams
      );

      // Decrypt notes if requested (only for recent entries for performance)
      const entries = entriesResult.rows.map(entry => ({
        ...entry,
        emotions: entry.emotions || [],
        triggers: entry.triggers || [],
        activities: entry.activities || []
      }));

      // Audit log for PHI access
      await auditLog(userId, 'view_mood_entries', null, {
        count: entries.length,
        date_range: { startDate, endDate }
      }, req);

      res.json({
        entries,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit,
          offset,
          hasMore: offset + entries.length < parseInt(countResult.rows[0].total)
        }
      });
    } catch (error: any) {
      logger.error('Failed to get mood entries', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve mood entries' });
    }
  }
);

/**
 * GET /api/mood/statistics
 * Get mood statistics and analytics
 */
router.get('/statistics',
  authenticate,
  [
    query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { period = 'month' } = req.query;

      // Calculate date range based on period
      let startDate: Date, endDate: Date = new Date();
      
      switch (period) {
        case 'week':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      if (req.query.startDate) startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) endDate = new Date(req.query.endDate as string);

      // Get statistics
      const statsResult = await db.query(
        `SELECT 
          COUNT(*) as total_entries,
          AVG(mood_score)::numeric(3,1) as avg_mood_score,
          MIN(mood_score) as min_mood_score,
          MAX(mood_score) as max_mood_score,
          AVG(anxiety_level)::numeric(3,1) as avg_anxiety,
          AVG(stress_level)::numeric(3,1) as avg_stress,
          AVG(energy_level)::numeric(3,1) as avg_energy,
          AVG(sleep_hours)::numeric(3,1) as avg_sleep_hours,
          MODE() WITHIN GROUP (ORDER BY mood) as most_common_mood
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at BETWEEN $2 AND $3`,
        [userId, startDate, endDate]
      );

      // Get mood distribution
      const distributionResult = await db.query(
        `SELECT mood, COUNT(*) as count
         FROM mood_entries
         WHERE user_id = $1 
           AND created_at BETWEEN $2 AND $3
         GROUP BY mood
         ORDER BY 
           CASE mood
             WHEN 'very_sad' THEN 1
             WHEN 'sad' THEN 2
             WHEN 'neutral' THEN 3
             WHEN 'happy' THEN 4
             WHEN 'very_happy' THEN 5
           END`,
        [userId, startDate, endDate]
      );

      // Get common emotions and triggers
      const emotionsResult = await db.query(
        `SELECT 
          jsonb_array_elements_text(emotions) as emotion,
          COUNT(*) as count
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at BETWEEN $2 AND $3
          AND emotions IS NOT NULL
        GROUP BY emotion
        ORDER BY count DESC
        LIMIT 10`,
        [userId, startDate, endDate]
      );

      const triggersResult = await db.query(
        `SELECT 
          jsonb_array_elements_text(triggers) as trigger,
          COUNT(*) as count
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at BETWEEN $2 AND $3
          AND triggers IS NOT NULL
        GROUP BY trigger
        ORDER BY count DESC
        LIMIT 10`,
        [userId, startDate, endDate]
      );

      // Calculate improvement metrics
      const firstHalfResult = await db.query(
        `SELECT AVG(mood_score)::numeric(3,1) as avg_mood
         FROM mood_entries
         WHERE user_id = $1 
           AND created_at BETWEEN $2 AND $3`,
        [userId, startDate, new Date((startDate.getTime() + endDate.getTime()) / 2)]
      );

      const secondHalfResult = await db.query(
        `SELECT AVG(mood_score)::numeric(3,1) as avg_mood
         FROM mood_entries
         WHERE user_id = $1 
           AND created_at BETWEEN $2 AND $3`,
        [userId, new Date((startDate.getTime() + endDate.getTime()) / 2), endDate]
      );

      const improvement = secondHalfResult.rows[0].avg_mood - firstHalfResult.rows[0].avg_mood;

      res.json({
        period: { startDate, endDate },
        statistics: statsResult.rows[0],
        distribution: distributionResult.rows,
        topEmotions: emotionsResult.rows,
        topTriggers: triggersResult.rows,
        improvement: {
          value: improvement,
          percentage: ((improvement / firstHalfResult.rows[0].avg_mood) * 100).toFixed(1),
          trend: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable'
        }
      });
    } catch (error: any) {
      logger.error('Failed to get mood statistics', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve mood statistics' });
    }
  }
);

/**
 * GET /api/mood/trends
 * Get mood trends and patterns
 */
router.get('/trends',
  authenticate,
  [
    query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { 
        period = 'month',
        groupBy = 'day'
      } = req.query;

      // Calculate date range
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case 'week':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // Determine grouping
      let dateFormat: string;
      switch (groupBy) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'IYYY-IW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      // Get trend data
      const trendResult = await db.query(
        `SELECT 
          TO_CHAR(created_at, $3) as period,
          AVG(mood_score)::numeric(3,1) as avg_mood,
          AVG(anxiety_level)::numeric(3,1) as avg_anxiety,
          AVG(stress_level)::numeric(3,1) as avg_stress,
          AVG(energy_level)::numeric(3,1) as avg_energy,
          COUNT(*) as entries_count
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at BETWEEN $2 AND NOW()
        GROUP BY TO_CHAR(created_at, $3)
        ORDER BY period ASC`,
        [userId, startDate, dateFormat]
      );

      // Get patterns (time of day, day of week)
      const timePatternResult = await db.query(
        `SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          AVG(mood_score)::numeric(3,1) as avg_mood,
          COUNT(*) as count
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour`,
        [userId]
      );

      const dayPatternResult = await db.query(
        `SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          AVG(mood_score)::numeric(3,1) as avg_mood,
          COUNT(*) as count
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(DOW FROM created_at)
        ORDER BY day_of_week`,
        [userId]
      );

      // Calculate correlations
      const correlationsResult = await db.query(
        `SELECT 
          CORR(mood_score, sleep_hours)::numeric(3,2) as mood_sleep_correlation,
          CORR(mood_score, energy_level)::numeric(3,2) as mood_energy_correlation,
          CORR(mood_score, anxiety_level)::numeric(3,2) as mood_anxiety_correlation,
          CORR(mood_score, stress_level)::numeric(3,2) as mood_stress_correlation
        FROM mood_entries
        WHERE user_id = $1 
          AND created_at > NOW() - INTERVAL '30 days'
          AND sleep_hours IS NOT NULL`,
        [userId]
      );

      res.json({
        trends: trendResult.rows,
        patterns: {
          byHour: timePatternResult.rows,
          byDayOfWeek: dayPatternResult.rows.map(row => ({
            ...row,
            day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][row.day_of_week]
          }))
        },
        correlations: correlationsResult.rows[0],
        insights: generateTrendInsights(trendResult.rows, correlationsResult.rows[0])
      });
    } catch (error: any) {
      logger.error('Failed to get mood trends', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve mood trends' });
    }
  }
);

/**
 * DELETE /api/mood/entries/:id
 * Delete a mood entry
 */
router.delete('/entries/:id',
  authenticate,
  [
    param('id').isUUID()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      // Verify ownership
      const checkResult = await db.query(
        'SELECT id FROM mood_entries WHERE id = $1 AND user_id = $2',
        [entryId, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Mood entry not found' });
      }

      // Soft delete
      await db.query(
        'UPDATE mood_entries SET deleted_at = NOW() WHERE id = $1',
        [entryId]
      );

      // Audit log
      await auditLog(userId, 'delete_mood_entry', entryId, {
        soft_delete: true
      }, req);

      res.json({ message: 'Mood entry deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete mood entry', {
        error: error.message,
        userId: req.user?.id,
        entryId: req.params.id
      });
      res.status(500).json({ error: 'Failed to delete mood entry' });
    }
  }
);

/**
 * Helper function to generate mood insights
 */
async function generateMoodInsights(userId: string): Promise<any> {
  try {
    // Get recent mood data
    const recentResult = await db.query(
      `SELECT mood_score, anxiety_level, stress_level, sleep_hours
       FROM mood_entries
       WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC`,
      [userId]
    );

    if (recentResult.rows.length < 3) {
      return { message: 'Keep tracking to see insights!' };
    }

    const recent = recentResult.rows;
    const avgMood = recent.reduce((sum, m) => sum + m.mood_score, 0) / recent.length;
    const avgSleep = recent.filter(m => m.sleep_hours).reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / recent.filter(m => m.sleep_hours).length;

    const insights = [];

    // Mood insights
    if (avgMood >= 7) {
      insights.push('Your mood has been consistently positive this week!');
    } else if (avgMood <= 4) {
      insights.push('Your mood has been lower than usual. Consider reaching out for support.');
    }

    // Sleep insights
    if (avgSleep < 6) {
      insights.push('You might benefit from more sleep. Aim for 7-9 hours.');
    } else if (avgSleep >= 7 && avgSleep <= 9) {
      insights.push('Great job maintaining healthy sleep habits!');
    }

    // Trend insights
    const trend = recent[0].mood_score - recent[recent.length - 1].mood_score;
    if (trend > 2) {
      insights.push('Your mood is trending upward!');
    } else if (trend < -2) {
      insights.push('Your mood has been declining. Consider self-care activities.');
    }

    return { insights, recommendations: generateRecommendations(avgMood, avgSleep) };
  } catch (error) {
    logger.error('Failed to generate insights', { error, userId });
    return { message: 'Unable to generate insights at this time' };
  }
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(avgMood: number, avgSleep: number): string[] {
  const recommendations = [];

  if (avgMood < 5) {
    recommendations.push('Try a guided meditation or breathing exercise');
    recommendations.push('Consider journaling about your feelings');
    recommendations.push('Reach out to a friend or counselor');
  }

  if (avgSleep < 7) {
    recommendations.push('Establish a consistent bedtime routine');
    recommendations.push('Limit screen time before bed');
    recommendations.push('Try relaxation techniques before sleep');
  }

  if (avgMood >= 7) {
    recommendations.push('Keep up the positive activities that are working');
    recommendations.push('Share your success strategies in the community');
  }

  return recommendations;
}

/**
 * Generate trend insights from data
 */
function generateTrendInsights(trends: any[], correlations: any): string[] {
  const insights = [];

  // Analyze trends
  if (trends.length > 0) {
    const recentTrend = trends[trends.length - 1];
    const oldTrend = trends[0];
    
    if (recentTrend.avg_mood > oldTrend.avg_mood) {
      insights.push('Your overall mood has improved over this period');
    }
  }

  // Analyze correlations
  if (correlations) {
    if (correlations.mood_sleep_correlation > 0.5) {
      insights.push('Better sleep is strongly linked to better mood for you');
    }
    if (correlations.mood_anxiety_correlation < -0.5) {
      insights.push('Managing anxiety could significantly improve your mood');
    }
    if (correlations.mood_energy_correlation > 0.5) {
      insights.push('Your mood and energy levels are closely connected');
    }
  }

  return insights;
}

export default router;