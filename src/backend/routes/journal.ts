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
    new winston.transports.File({ filename: 'logs/journal.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * HIPAA-compliant audit logging for journal data
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
        'journal_entry',
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
 * Analyze journal content for insights and crisis detection
 */
const analyzeJournalContent = async (content: string, userId: string): Promise<any> => {
  try {
    // Crisis keywords detection
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living',
      'self-harm', 'cutting', 'overdose', 'die', 'hopeless',
      'no way out', 'burden', 'better off without me'
    ];

    const positiveKeywords = [
      'grateful', 'happy', 'blessed', 'thankful', 'accomplished',
      'proud', 'excited', 'hopeful', 'peaceful', 'content',
      'improved', 'better', 'progress', 'achievement'
    ];

    const contentLower = content.toLowerCase();
    
    // Check for crisis indicators
    const detectedCrisisKeywords = crisisKeywords.filter(keyword => 
      contentLower.includes(keyword)
    );

    const detectedPositiveKeywords = positiveKeywords.filter(keyword => 
      contentLower.includes(keyword)
    );

    // Calculate sentiment score (simplified)
    const sentimentScore = 
      (detectedPositiveKeywords.length * 2 - detectedCrisisKeywords.length * 3) / 
      (content.split(' ').length / 100);

    // Detect themes
    const themes = [];
    if (contentLower.includes('work') || contentLower.includes('job')) themes.push('work');
    if (contentLower.includes('family') || contentLower.includes('parent')) themes.push('family');
    if (contentLower.includes('friend') || contentLower.includes('social')) themes.push('relationships');
    if (contentLower.includes('health') || contentLower.includes('exercise')) themes.push('health');
    if (contentLower.includes('sleep') || contentLower.includes('tired')) themes.push('sleep');
    if (contentLower.includes('anxious') || contentLower.includes('worried')) themes.push('anxiety');
    if (contentLower.includes('sad') || contentLower.includes('depressed')) themes.push('depression');

    // Crisis detection
    const needsCrisisIntervention = detectedCrisisKeywords.length > 0;
    
    if (needsCrisisIntervention) {
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
          detectedCrisisKeywords.length > 2 ? 'critical' : 'high',
          'journal_entry',
          JSON.stringify({ keywords: detectedCrisisKeywords }),
          'system',
          'keyword_detection',
          JSON.stringify(detectedCrisisKeywords),
          0.9,
          'pending'
        ]
      );

      logger.warn('Crisis keywords detected in journal entry', {
        userId,
        keywords: detectedCrisisKeywords
      });
    }

    return {
      sentimentScore,
      themes,
      crisisDetected: needsCrisisIntervention,
      crisisKeywords: detectedCrisisKeywords,
      positiveKeywords: detectedPositiveKeywords,
      wordCount: content.split(' ').length
    };
  } catch (error) {
    logger.error('Failed to analyze journal content', { error, userId });
    return null;
  }
};

/**
 * POST /api/journal/entries
 * Create new journal entry
 */
router.post('/entries',
  authenticate,
  [
    body('title').optional().isString().isLength({ max: 200 }),
    body('content').notEmpty().isString().isLength({ min: 1, max: 10000 }),
    body('mood').optional().isIn(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']),
    body('tags').optional().isArray(),
    body('isPrivate').optional().isBoolean(),
    body('promptId').optional().isUUID()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { title, content, mood, tags, isPrivate = true, promptId } = req.body;

      // Analyze content
      const analysis = await analyzeJournalContent(content, userId);

      // Encrypt content for storage
      const encryptedContent = db.encrypt(content);
      const encryptedTitle = title ? db.encrypt(title) : null;

      // Create journal entry
      const result = await db.query(
        `INSERT INTO journal_entries (
          id, user_id, title, content, mood, tags, 
          is_private, prompt_id, word_count, sentiment_score,
          themes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id, mood, tags, is_private, word_count, 
                  sentiment_score, themes, created_at`,
        [
          uuidv4(),
          userId,
          encryptedTitle,
          encryptedContent,
          mood,
          JSON.stringify(tags || []),
          isPrivate,
          promptId,
          analysis?.wordCount || content.split(' ').length,
          analysis?.sentimentScore || 0,
          JSON.stringify(analysis?.themes || [])
        ]
      );

      const entry = result.rows[0];

      // Update user stats
      await db.query(
        `INSERT INTO user_stats (user_id, journal_entries_count, last_journal_date)
         VALUES ($1, 1, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           journal_entries_count = user_stats.journal_entries_count + 1,
           last_journal_date = NOW()`,
        [userId]
      );

      // Generate insights if enough entries
      const insights = await generateJournalInsights(userId);

      // Audit log
      await auditLog(userId, 'create_journal_entry', entry.id, {
        word_count: entry.word_count,
        has_crisis_content: analysis?.crisisDetected || false
      }, req);

      // Prepare response
      const response: any = {
        message: 'Journal entry created successfully',
        entry: {
          ...entry,
          title: title || 'Untitled Entry' // Don't return encrypted title
        },
        insights
      };

      // Add crisis support if needed
      if (analysis?.crisisDetected) {
        response.crisisSupport = {
          message: 'We noticed you might be going through a difficult time',
          resources: [
            { name: '988 Crisis Lifeline', number: '988', available: '24/7' },
            { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' }
          ],
          action: 'A counselor will be notified if you need immediate support'
        };
      }

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Failed to create journal entry', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }
);

/**
 * GET /api/journal/entries
 * Get journal entries with pagination and filtering
 */
router.get('/entries',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
    query('mood').optional().isIn(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']),
    query('tag').optional().isString(),
    query('search').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default 90 days
        endDate = new Date(),
        limit = 20,
        offset = 0,
        mood,
        tag,
        search
      } = req.query;

      // Build query conditions
      let whereConditions = [
        'user_id = $1',
        'deleted_at IS NULL',
        'created_at BETWEEN $2 AND $3'
      ];
      let queryParams: any[] = [userId, startDate, endDate];
      let paramCount = 4;

      if (mood) {
        whereConditions.push(`mood = $${paramCount}`);
        queryParams.push(mood);
        paramCount++;
      }

      if (tag) {
        whereConditions.push(`tags @> $${paramCount}::jsonb`);
        queryParams.push(JSON.stringify([tag]));
        paramCount++;
      }

      // Get entries (without decrypting content for list view)
      const entriesResult = await db.query(
        `SELECT 
          id, mood, tags, is_private, word_count,
          sentiment_score, themes, created_at, updated_at
        FROM journal_entries
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...queryParams, limit, offset]
      );

      // Get titles separately and decrypt them
      const entryIds = entriesResult.rows.map(e => e.id);
      const titlesResult = await db.query(
        `SELECT id, title FROM journal_entries WHERE id = ANY($1)`,
        [entryIds]
      );

      // Decrypt titles and create map
      const titlesMap = new Map();
      for (const row of titlesResult.rows) {
        if (row.title) {
          try {
            titlesMap.set(row.id, db.decrypt(row.title));
          } catch (error) {
            titlesMap.set(row.id, 'Untitled Entry');
          }
        } else {
          titlesMap.set(row.id, 'Untitled Entry');
        }
      }

      // Get first few words of content for preview (decrypted)
      const previewsMap = new Map();
      const contentResult = await db.query(
        `SELECT id, content FROM journal_entries WHERE id = ANY($1)`,
        [entryIds]
      );

      for (const row of contentResult.rows) {
        try {
          const decryptedContent = db.decrypt(row.content);
          const preview = decryptedContent.split(' ').slice(0, 20).join(' ') + '...';
          previewsMap.set(row.id, preview);
        } catch (error) {
          previewsMap.set(row.id, 'Unable to load preview');
        }
      }

      // Combine data
      const entries = entriesResult.rows.map(entry => ({
        ...entry,
        title: titlesMap.get(entry.id) || 'Untitled Entry',
        preview: previewsMap.get(entry.id) || '',
        tags: entry.tags || [],
        themes: entry.themes || []
      }));

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total
         FROM journal_entries
         WHERE ${whereConditions.join(' AND ')}`,
        queryParams
      );

      // Audit log for PHI access
      await auditLog(userId, 'view_journal_entries', null, {
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
      logger.error('Failed to get journal entries', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve journal entries' });
    }
  }
);

/**
 * PUT /api/journal/entries/:id
 * Update journal entry
 */
router.put('/entries/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('title').optional().isString().isLength({ max: 200 }),
    body('content').optional().isString().isLength({ min: 1, max: 10000 }),
    body('mood').optional().isIn(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']),
    body('tags').optional().isArray(),
    body('isPrivate').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const entryId = req.params.id;
      const { title, content, mood, tags, isPrivate } = req.body;

      // Verify ownership
      const checkResult = await db.query(
        'SELECT id, created_at FROM journal_entries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [entryId, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      // Check if entry is too old to edit (older than 30 days)
      const createdAt = new Date(checkResult.rows[0].created_at);
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation > 30) {
        return res.status(403).json({ 
          error: 'Cannot edit entries older than 30 days',
          createdAt,
          daysAgo: Math.floor(daysSinceCreation)
        });
      }

      // Prepare update data
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${++paramCount}`);
        updateValues.push(title ? db.encrypt(title) : null);
      }

      if (content !== undefined) {
        // Analyze new content
        const analysis = await analyzeJournalContent(content, userId);
        
        updateFields.push(`content = $${++paramCount}`);
        updateValues.push(db.encrypt(content));
        
        updateFields.push(`word_count = $${++paramCount}`);
        updateValues.push(analysis?.wordCount || content.split(' ').length);
        
        updateFields.push(`sentiment_score = $${++paramCount}`);
        updateValues.push(analysis?.sentimentScore || 0);
        
        updateFields.push(`themes = $${++paramCount}`);
        updateValues.push(JSON.stringify(analysis?.themes || []));
      }

      if (mood !== undefined) {
        updateFields.push(`mood = $${++paramCount}`);
        updateValues.push(mood);
      }

      if (tags !== undefined) {
        updateFields.push(`tags = $${++paramCount}`);
        updateValues.push(JSON.stringify(tags));
      }

      if (isPrivate !== undefined) {
        updateFields.push(`is_private = $${++paramCount}`);
        updateValues.push(isPrivate);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Update entry
      updateFields.push('updated_at = NOW()');
      
      const result = await db.query(
        `UPDATE journal_entries 
         SET ${updateFields.join(', ')}
         WHERE id = $1
         RETURNING id, mood, tags, is_private, word_count, 
                   sentiment_score, themes, created_at, updated_at`,
        [entryId, ...updateValues]
      );

      // Create edit history
      await db.query(
        `INSERT INTO journal_entry_history (
          entry_id, user_id, action, changed_fields, change_timestamp
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [entryId, userId, 'edit', JSON.stringify(Object.keys(req.body))]
      );

      // Audit log
      await auditLog(userId, 'update_journal_entry', entryId, {
        fields_updated: Object.keys(req.body)
      }, req);

      res.json({
        message: 'Journal entry updated successfully',
        entry: {
          ...result.rows[0],
          title: title || 'Untitled Entry'
        }
      });
    } catch (error: any) {
      logger.error('Failed to update journal entry', {
        error: error.message,
        userId: req.user?.id,
        entryId: req.params.id
      });
      res.status(500).json({ error: 'Failed to update journal entry' });
    }
  }
);

/**
 * DELETE /api/journal/entries/:id
 * Delete journal entry (soft delete)
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
        'SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [entryId, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      // Soft delete
      await db.query(
        'UPDATE journal_entries SET deleted_at = NOW() WHERE id = $1',
        [entryId]
      );

      // Update user stats
      await db.query(
        `UPDATE user_stats 
         SET journal_entries_count = GREATEST(journal_entries_count - 1, 0)
         WHERE user_id = $1`,
        [userId]
      );

      // Audit log
      await auditLog(userId, 'delete_journal_entry', entryId, {
        soft_delete: true
      }, req);

      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete journal entry', {
        error: error.message,
        userId: req.user?.id,
        entryId: req.params.id
      });
      res.status(500).json({ error: 'Failed to delete journal entry' });
    }
  }
);

/**
 * GET /api/journal/prompts
 * Get journal prompts
 */
router.get('/prompts',
  authenticate,
  [
    query('category').optional().isString(),
    query('mood').optional().isIn(['very_sad', 'sad', 'neutral', 'happy', 'very_happy'])
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { category, mood } = req.query;

      // Get user's recent moods to personalize prompts
      const recentMoodResult = await db.query(
        `SELECT mood, mood_score 
         FROM mood_entries 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      const userMood = mood || recentMoodResult.rows[0]?.mood || 'neutral';

      // Build query for prompts
      let whereConditions = ['is_active = true'];
      let queryParams: any[] = [];
      let paramCount = 1;

      if (category) {
        whereConditions.push(`category = $${paramCount}`);
        queryParams.push(category);
        paramCount++;
      }

      // Get prompts
      const promptsResult = await db.query(
        `SELECT 
          id, prompt_text, category, difficulty_level,
          therapeutic_goal, follow_up_questions
        FROM journal_prompts
        WHERE ${whereConditions.length > 0 ? whereConditions.join(' AND ') : 'true'}
        ORDER BY 
          CASE 
            WHEN category = 'mood_specific' THEN 0
            WHEN category = 'gratitude' THEN 1
            WHEN category = 'self_reflection' THEN 2
            WHEN category = 'goals' THEN 3
            ELSE 4
          END,
          RANDOM()
        LIMIT 5`,
        queryParams
      );

      // Add default prompts if none found
      let prompts = promptsResult.rows;
      
      if (prompts.length === 0) {
        prompts = getDefaultPrompts(userMood as string);
      }

      // Track prompt views
      for (const prompt of prompts) {
        if (prompt.id) {
          await db.query(
            `INSERT INTO prompt_analytics (prompt_id, user_id, viewed_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (prompt_id, user_id) 
             DO UPDATE SET view_count = prompt_analytics.view_count + 1, viewed_at = NOW()`,
            [prompt.id, userId]
          );
        }
      }

      res.json({
        prompts,
        userMood,
        categories: [
          'mood_specific',
          'gratitude',
          'self_reflection',
          'goals',
          'relationships',
          'mindfulness',
          'creativity'
        ]
      });
    } catch (error: any) {
      logger.error('Failed to get journal prompts', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve journal prompts' });
    }
  }
);

/**
 * Helper function to generate journal insights
 */
async function generateJournalInsights(userId: string): Promise<any> {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_entries,
        AVG(word_count) as avg_word_count,
        AVG(sentiment_score) as avg_sentiment,
        array_agg(DISTINCT jsonb_array_elements_text(themes)) as all_themes
      FROM journal_entries
      WHERE user_id = $1 
        AND deleted_at IS NULL
        AND created_at > NOW() - INTERVAL '30 days'`,
      [userId]
    );

    const stats = result.rows[0];

    if (parseInt(stats.total_entries) < 3) {
      return {
        message: 'Keep journaling to unlock insights!',
        entriesNeeded: 3 - parseInt(stats.total_entries)
      };
    }

    const insights = [];

    // Writing consistency
    if (parseInt(stats.total_entries) >= 7) {
      insights.push('Great job maintaining a consistent journaling practice!');
    }

    // Sentiment insights
    if (stats.avg_sentiment > 0.5) {
      insights.push('Your recent entries show a positive outlook');
    } else if (stats.avg_sentiment < -0.5) {
      insights.push('Your entries suggest you might be facing challenges. Remember support is available.');
    }

    // Theme insights
    const topThemes = stats.all_themes?.slice(0, 3) || [];
    if (topThemes.length > 0) {
      insights.push(`You've been focusing on: ${topThemes.join(', ')}`);
    }

    return {
      insights,
      stats: {
        totalEntries: parseInt(stats.total_entries),
        averageWordCount: Math.round(stats.avg_word_count || 0),
        topThemes
      }
    };
  } catch (error) {
    logger.error('Failed to generate journal insights', { error, userId });
    return null;
  }
}

/**
 * Get default prompts based on mood
 */
function getDefaultPrompts(mood: string): any[] {
  const promptsByMood: Record<string, any[]> = {
    very_sad: [
      {
        prompt_text: "What's one small thing that brought you comfort today, no matter how tiny?",
        category: 'mood_specific',
        therapeutic_goal: 'Finding light in darkness'
      },
      {
        prompt_text: "If a close friend was feeling the way you do now, what would you tell them?",
        category: 'self_compassion',
        therapeutic_goal: 'Practicing self-compassion'
      }
    ],
    sad: [
      {
        prompt_text: "Describe your feelings without judging them as good or bad.",
        category: 'mindfulness',
        therapeutic_goal: 'Emotional awareness'
      },
      {
        prompt_text: "What would help you feel 1% better right now?",
        category: 'coping',
        therapeutic_goal: 'Identifying coping strategies'
      }
    ],
    neutral: [
      {
        prompt_text: "What are three things you're grateful for today?",
        category: 'gratitude',
        therapeutic_goal: 'Cultivating gratitude'
      },
      {
        prompt_text: "What's one goal you'd like to work toward this week?",
        category: 'goals',
        therapeutic_goal: 'Goal setting'
      }
    ],
    happy: [
      {
        prompt_text: "What contributed to your positive mood today?",
        category: 'mood_specific',
        therapeutic_goal: 'Identifying positive factors'
      },
      {
        prompt_text: "How can you share this positive energy with others?",
        category: 'relationships',
        therapeutic_goal: 'Spreading positivity'
      }
    ],
    very_happy: [
      {
        prompt_text: "Describe this moment in detail so you can remember it later.",
        category: 'mindfulness',
        therapeutic_goal: 'Savoring positive experiences'
      },
      {
        prompt_text: "What lessons from today's joy can you apply to future challenges?",
        category: 'self_reflection',
        therapeutic_goal: 'Learning from positive experiences'
      }
    ]
  };

  return promptsByMood[mood] || promptsByMood.neutral;
}

export default router;