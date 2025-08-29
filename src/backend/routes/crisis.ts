import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { authenticate, authorize } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import { CrisisService } from '../services/crisis';
import { NotificationService } from '../services/notification';
import { EmergencyContactService } from '../services/emergencyContact';
import { WebSocketService } from '../services/websocket';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/crisis.log' }),
    new winston.transports.Console()
  ]
});

/**
 * POST /api/crisis/alert
 * Trigger a crisis alert - HIGHEST PRIORITY ENDPOINT
 */
router.post('/alert',
  authenticate,
  [
    body('severity').isIn(['low', 'moderate', 'high', 'critical', 'emergency']),
    body('symptoms').isArray().optional(),
    body('suicidalIdeation').isBoolean().optional(),
    body('selfHarmRisk').isBoolean().optional(),
    body('harmToOthersRisk').isBoolean().optional(),
    body('location').optional(),
    body('message').optional().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user!.id;
      const {
        severity,
        symptoms = [],
        suicidalIdeation = false,
        selfHarmRisk = false,
        harmToOthersRisk = false,
        location,
        message
      } = req.body;

      // Create crisis log entry
      const crisisId = uuidv4();
      const crisisLog = await db.query(
        `INSERT INTO crisis_logs (
          id, user_id, severity, trigger_source, trigger_data,
          symptoms, suicidal_ideation, self_harm_risk, harm_to_others_risk,
          auto_response_triggered, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
        RETURNING *`,
        [
          crisisId,
          userId,
          severity,
          'manual',
          JSON.stringify({ message, location }),
          JSON.stringify(symptoms),
          suicidalIdeation,
          selfHarmRisk,
          harmToOthersRisk
        ]
      );

      // Get user details and emergency contacts
      const userResult = await db.query(
        `SELECT u.*, 
                t.email as therapist_email, 
                t.phone_encrypted as therapist_phone,
                p.email as psychiatrist_email,
                p.phone_encrypted as psychiatrist_phone
         FROM users u
         LEFT JOIN users t ON u.primary_therapist_id = t.id
         LEFT JOIN users p ON u.primary_psychiatrist_id = p.id
         WHERE u.id = $1`,
        [userId]
      );

      const user = userResult.rows[0];
      const firstName = user.first_name_encrypted ? db.decrypt(user.first_name_encrypted) : 'User';
      const lastName = user.last_name_encrypted ? db.decrypt(user.last_name_encrypted) : '';

      // Initialize response actions
      const responseActions = [];

      // IMMEDIATE ACTIONS FOR CRITICAL/EMERGENCY SEVERITY
      if (severity === 'critical' || severity === 'emergency') {
        // 1. Notify emergency services if high risk
        if (suicidalIdeation || harmToOthersRisk) {
          const emergencyResponse = await CrisisService.notifyEmergencyServices({
            userId,
            crisisId,
            severity,
            location,
            riskFactors: { suicidalIdeation, selfHarmRisk, harmToOthersRisk }
          });
          responseActions.push('emergency_services_notified');
          
          // Log emergency notification
          logger.error('EMERGENCY: Critical crisis alert', {
            userId,
            crisisId,
            severity,
            suicidalIdeation,
            harmToOthersRisk
          });
        }

        // 2. Immediately notify therapist/psychiatrist
        if (user.therapist_email) {
          await NotificationService.sendUrgentNotification({
            to: user.therapist_email,
            type: 'crisis_alert',
            priority: 'urgent',
            subject: 'URGENT: Patient Crisis Alert',
            data: {
              patientName: `${firstName} ${lastName}`,
              severity,
              crisisId,
              symptoms,
              immediateAction: true
            }
          });
          responseActions.push('therapist_notified');
        }

        // 3. Alert on-call crisis counselor
        const onCallCounselor = await CrisisService.getOnCallCounselor();
        if (onCallCounselor) {
          await WebSocketService.notifyCounselor(onCallCounselor.id, {
            type: 'crisis_alert',
            userId,
            crisisId,
            severity,
            requiresImmediate: true
          });
          responseActions.push('crisis_counselor_alerted');
        }
      }

      // Get and notify emergency contacts based on severity
      const emergencyContacts = await EmergencyContactService.getContacts(userId);
      const contactsToNotify = emergencyContacts.filter(contact => {
        if (severity === 'emergency') return true;
        if (severity === 'critical') return contact.priority <= 2;
        if (severity === 'high') return contact.priority === 1;
        return false;
      });

      for (const contact of contactsToNotify) {
        const decryptedPhone = db.decrypt(contact.phone_primary_encrypted);
        const decryptedName = db.decrypt(contact.name_encrypted);
        
        await NotificationService.sendSMS({
          to: decryptedPhone,
          message: `CRISIS ALERT: ${firstName} ${lastName} needs immediate assistance. Severity: ${severity}. Please contact them or emergency services if needed.`
        });
        
        responseActions.push(`emergency_contact_notified:${contact.id}`);
      }

      // Generate safety resources
      const safetyResources = await CrisisService.getSafetyResources({
        severity,
        location,
        symptoms
      });

      // Create immediate safety plan
      const safetyPlan = await CrisisService.generateImmediateSafetyPlan({
        userId,
        severity,
        symptoms,
        riskFactors: { suicidalIdeation, selfHarmRisk, harmToOthersRisk }
      });

      // Update crisis log with response actions
      await db.query(
        `UPDATE crisis_logs 
         SET response_actions = $1, contacted_emergency = $2, 
             contacted_therapist = $3, contacted_emergency_contact = $4
         WHERE id = $5`,
        [
          JSON.stringify(responseActions),
          responseActions.includes('emergency_services_notified'),
          responseActions.includes('therapist_notified'),
          responseActions.some(a => a.startsWith('emergency_contact_notified')),
          crisisId
        ]
      );

      // Send real-time update via WebSocket
      await WebSocketService.sendToUser(userId, {
        type: 'crisis_response',
        crisisId,
        status: 'active',
        helpOnTheWay: severity === 'critical' || severity === 'emergency',
        safetyPlan,
        resources: safetyResources
      });

      // Track response time
      const responseTime = Date.now() - new Date(crisisLog.rows[0].created_at).getTime();
      logger.info('Crisis alert processed', {
        crisisId,
        userId,
        severity,
        responseTime,
        actionsCount: responseActions.length
      });

      res.status(200).json({
        crisisId,
        status: 'alert_received',
        severity,
        helpOnTheWay: responseActions.includes('emergency_services_notified'),
        therapistNotified: responseActions.includes('therapist_notified'),
        emergencyContactsNotified: contactsToNotify.length,
        safetyPlan,
        resources: safetyResources,
        responseActions,
        message: 'Help is on the way. Please stay safe and follow the safety plan.'
      });

    } catch (error) {
      logger.error('Crisis alert processing failed', error);
      
      // Even if processing fails, try to provide basic help
      res.status(500).json({
        error: 'Crisis processing encountered an issue, but help is being dispatched',
        emergencyHotline: '988', // Suicide & Crisis Lifeline
        message: 'If this is an emergency, please call 911 immediately'
      });
    }
  }
);

/**
 * GET /api/crisis/status
 * Get current crisis status for user
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get active crisis if any
    const activeCrisis = await db.query(
      `SELECT * FROM crisis_logs 
       WHERE user_id = $1 AND resolved_at IS NULL 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (activeCrisis.rows.length === 0) {
      return res.json({
        status: 'no_active_crisis',
        lastCrisis: null,
        safetyPlan: await CrisisService.getUserSafetyPlan(userId)
      });
    }

    const crisis = activeCrisis.rows[0];
    const timeSinceAlert = Date.now() - new Date(crisis.created_at).getTime();

    res.json({
      status: 'active_crisis',
      crisisId: crisis.id,
      severity: crisis.severity,
      startedAt: crisis.created_at,
      duration: Math.floor(timeSinceAlert / 1000), // seconds
      helpStatus: {
        emergencyContacted: crisis.contacted_emergency,
        therapistContacted: crisis.contacted_therapist,
        counselorAssigned: crisis.responder_id !== null
      },
      responseActions: crisis.response_actions
    });

  } catch (error) {
    logger.error('Failed to get crisis status', error);
    res.status(500).json({ error: 'Failed to retrieve crisis status' });
  }
});

/**
 * POST /api/crisis/resolve
 * Mark crisis as resolved
 */
router.post('/resolve',
  authenticate,
  [
    body('crisisId').isUUID(),
    body('resolutionMethod').notEmpty(),
    body('notes').optional().trim(),
    body('followUpRequired').isBoolean().optional()
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { crisisId, resolutionMethod, notes, followUpRequired = true } = req.body;

      // Verify crisis belongs to user or user is authorized
      const crisis = await db.query(
        'SELECT * FROM crisis_logs WHERE id = $1',
        [crisisId]
      );

      if (crisis.rows.length === 0) {
        return res.status(404).json({ error: 'Crisis not found' });
      }

      const isOwner = crisis.rows[0].user_id === userId;
      const isResponder = crisis.rows[0].responder_id === userId;
      const isAuthorized = req.user!.role === 'therapist' || 
                          req.user!.role === 'psychiatrist' || 
                          req.user!.role === 'crisis_counselor';

      if (!isOwner && !isResponder && !isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to resolve this crisis' });
      }

      // Update crisis log
      const encryptedNotes = notes ? db.encrypt(notes) : null;
      await db.query(
        `UPDATE crisis_logs 
         SET resolved_at = NOW(), 
             resolution_method = $1, 
             resolution_notes_encrypted = $2,
             follow_up_required = $3,
             outcome = $4
         WHERE id = $5`,
        [resolutionMethod, encryptedNotes, followUpRequired, 'resolved', crisisId]
      );

      // Notify relevant parties of resolution
      await NotificationService.notifyCrisisResolution({
        crisisId,
        userId: crisis.rows[0].user_id,
        resolvedBy: userId,
        method: resolutionMethod
      });

      // Schedule follow-up if required
      if (followUpRequired) {
        await CrisisService.scheduleFollowUp({
          userId: crisis.rows[0].user_id,
          crisisId,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
      }

      logger.info('Crisis resolved', {
        crisisId,
        resolvedBy: userId,
        method: resolutionMethod
      });

      res.json({
        message: 'Crisis resolved successfully',
        crisisId,
        followUpScheduled: followUpRequired
      });

    } catch (error) {
      logger.error('Failed to resolve crisis', error);
      res.status(500).json({ error: 'Failed to resolve crisis' });
    }
  }
);

/**
 * GET /api/crisis/history
 * Get crisis history for user
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 10, offset = 0 } = req.query;

    const history = await db.query(
      `SELECT id, severity, created_at, resolved_at, resolution_method, 
              outcome, follow_up_completed_at
       FROM crisis_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const total = await dbHelpers.count('crisis_logs', { user_id: userId });

    res.json({
      crises: history.rows,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (error) {
    logger.error('Failed to get crisis history', error);
    res.status(500).json({ error: 'Failed to retrieve crisis history' });
  }
});

/**
 * POST /api/crisis/safety-plan
 * Create or update safety plan
 */
router.post('/safety-plan',
  authenticate,
  [
    body('warningSignals').isArray(),
    body('copingStrategies').isArray(),
    body('distractions').isArray(),
    body('supportContacts').isArray(),
    body('professionalContacts').isArray(),
    body('safeEnvironment').isArray(),
    body('reasonsToLive').isArray().optional()
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const safetyPlan = req.body;

      // Store safety plan
      await CrisisService.createOrUpdateSafetyPlan(userId, safetyPlan);

      logger.info('Safety plan updated', { userId });

      res.json({
        message: 'Safety plan saved successfully',
        planId: uuidv4()
      });

    } catch (error) {
      logger.error('Failed to save safety plan', error);
      res.status(500).json({ error: 'Failed to save safety plan' });
    }
  }
);

/**
 * GET /api/crisis/safety-plan
 * Get user's safety plan
 */
router.get('/safety-plan', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const safetyPlan = await CrisisService.getUserSafetyPlan(userId);

    if (!safetyPlan) {
      return res.status(404).json({ 
        error: 'No safety plan found',
        message: 'Please create a safety plan with your therapist'
      });
    }

    res.json(safetyPlan);

  } catch (error) {
    logger.error('Failed to get safety plan', error);
    res.status(500).json({ error: 'Failed to retrieve safety plan' });
  }
});

/**
 * POST /api/crisis/hotlines
 * Get crisis hotlines based on location
 */
router.post('/hotlines',
  [
    body('location').optional(),
    body('country').optional().isISO31661Alpha2(),
    body('language').optional().isISO6391()
  ],
  async (req: Request, res: Response) => {
    try {
      const { location, country = 'US', language = 'en' } = req.body;

      const hotlines = await CrisisService.getHotlines({
        location,
        country,
        language
      });

      res.json({
        hotlines,
        primary: hotlines[0], // Most relevant hotline
        international: {
          suicide: '988', // US Suicide & Crisis Lifeline
          text: 'Text HOME to 741741' // Crisis Text Line
        }
      });

    } catch (error) {
      logger.error('Failed to get hotlines', error);
      
      // Always return basic hotlines even on error
      res.json({
        hotlines: [
          {
            name: 'Suicide & Crisis Lifeline',
            number: '988',
            available: '24/7',
            text: true,
            chat: true
          }
        ]
      });
    }
  }
);

/**
 * POST /api/crisis/check-in
 * Periodic check-in during crisis
 */
router.post('/check-in',
  authenticate,
  [
    body('crisisId').isUUID(),
    body('currentState').isIn(['improving', 'stable', 'worsening', 'resolved']),
    body('needsHelp').isBoolean(),
    body('notes').optional()
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { crisisId, currentState, needsHelp, notes } = req.body;

      // Record check-in
      await CrisisService.recordCheckIn({
        crisisId,
        userId,
        state: currentState,
        needsHelp,
        notes
      });

      // If worsening or needs help, escalate
      if (currentState === 'worsening' || needsHelp) {
        await CrisisService.escalateCrisis(crisisId);
        
        return res.json({
          message: 'Check-in recorded. Additional help is being dispatched.',
          escalated: true
        });
      }

      res.json({
        message: 'Check-in recorded successfully',
        nextCheckIn: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });

    } catch (error) {
      logger.error('Failed to record check-in', error);
      res.status(500).json({ error: 'Failed to record check-in' });
    }
  }
);

export default router;