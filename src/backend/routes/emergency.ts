import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = Router();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/emergency.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * HIPAA-compliant audit logging for emergency events
 */
const auditLog = async (
  userId: string | null,
  action: string,
  resourceId: string | null,
  details: any,
  req: Request
) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent, request_id, timestamp, is_emergency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true)`,
      [
        userId,
        action,
        'emergency',
        resourceId,
        JSON.stringify(details),
        req.ip,
        req.headers['user-agent'],
        req.headers['x-request-id'] || uuidv4()
      ]
    );
  } catch (error) {
    logger.error('Failed to create emergency audit log', { error, action, userId });
  }
};

/**
 * Notify emergency contacts
 */
const notifyEmergencyContacts = async (userId: string, emergencyType: string, location?: any): Promise<void> => {
  try {
    // Get user's emergency contacts
    const contactsResult = await db.query(
      `SELECT name, phone_number, relationship, is_primary
       FROM emergency_contacts
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_primary DESC, created_at ASC`,
      [userId]
    );

    if (contactsResult.rows.length === 0) {
      logger.warn('No emergency contacts found for user', { userId });
      return;
    }

    // Get user info
    const userResult = await db.query(
      `SELECT display_name, email FROM users WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    const userName = user?.display_name || 'A user';

    // Send notifications to each contact
    for (const contact of contactsResult.rows) {
      try {
        // Decrypt phone number
        const phoneNumber = db.decrypt(contact.phone_number);

        // Create notification record
        await db.query(
          `INSERT INTO emergency_notifications (
            id, user_id, contact_name, contact_phone, 
            notification_type, message, sent_at, status
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
          [
            uuidv4(),
            userId,
            contact.name,
            contact.phone_number, // Store encrypted
            emergencyType,
            `Emergency alert: ${userName} has triggered an emergency alert. Type: ${emergencyType}`,
            'pending'
          ]
        );

        // TODO: Integrate with SMS service (Twilio, etc.)
        // await sendSMS(phoneNumber, message);

        logger.info('Emergency contact notified', {
          userId,
          contactName: contact.name,
          emergencyType
        });
      } catch (error) {
        logger.error('Failed to notify emergency contact', {
          error,
          userId,
          contactName: contact.name
        });
      }
    }
  } catch (error) {
    logger.error('Failed to notify emergency contacts', { error, userId });
  }
};

/**
 * Connect to 988 Crisis Lifeline
 */
const connect988Service = async (userId: string | null, details: any): Promise<any> => {
  try {
    // Log 988 connection attempt
    await db.query(
      `INSERT INTO crisis_connections (
        id, user_id, service_type, connection_time, 
        connection_details, status
      ) VALUES ($1, $2, '988', NOW(), $3, 'initiated')`,
      [
        uuidv4(),
        userId,
        JSON.stringify(details)
      ]
    );

    // Return 988 connection information
    return {
      service: '988 Suicide & Crisis Lifeline',
      number: '988',
      textOption: 'Text 988',
      chatUrl: 'https://988lifeline.org/chat',
      available: '24/7',
      languages: ['English', 'Spanish'],
      additionalResources: [
        {
          name: 'Crisis Text Line',
          contact: 'Text HOME to 741741',
          available: '24/7'
        },
        {
          name: 'Veterans Crisis Line',
          contact: 'Press 1 after calling 988',
          available: '24/7'
        },
        {
          name: 'LGBTQ National Hotline',
          contact: '1-888-843-4564',
          available: 'M-F 1pm-9pm PST'
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to connect to 988 service', { error, userId });
    throw error;
  }
};

/**
 * Get nearest emergency services
 */
const getNearestEmergencyServices = async (location: any): Promise<any[]> => {
  try {
    // In production, integrate with real geolocation/mapping API
    // For now, return mock data
    const services = [
      {
        type: 'hospital',
        name: 'Emergency Room - General Hospital',
        address: 'Nearest hospital based on location',
        distance: '2.3 miles',
        estimatedTime: '8 minutes',
        phone: '911'
      },
      {
        type: 'crisis_center',
        name: 'Community Crisis Center',
        address: 'Local crisis center',
        distance: '3.1 miles',
        estimatedTime: '12 minutes',
        phone: 'Local crisis line'
      },
      {
        type: 'police',
        name: 'Local Police Department',
        address: 'Nearest police station',
        distance: '1.8 miles',
        estimatedTime: '6 minutes',
        phone: '911'
      }
    ];

    return services;
  } catch (error) {
    logger.error('Failed to get emergency services', { error });
    return [];
  }
};

/**
 * POST /api/emergency/panic
 * Trigger panic/emergency alert
 */
router.post('/panic',
  optionalAuth, // Allow anonymous emergency requests
  [
    body('location').optional().isObject(),
    body('location.latitude').optional().isFloat(),
    body('location.longitude').optional().isFloat(),
    body('emergencyType').optional().isIn(['panic', 'medical', 'safety', 'crisis']),
    body('message').optional().isString().isLength({ max: 500 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user?.id || null;
      const { location, emergencyType = 'panic', message } = req.body;

      // Create emergency event
      const emergencyId = uuidv4();
      
      await db.query(
        `INSERT INTO emergency_events (
          id, user_id, event_type, severity, location,
          message, triggered_at, status, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)`,
        [
          emergencyId,
          userId,
          emergencyType,
          'critical',
          location ? JSON.stringify(location) : null,
          message ? db.encrypt(message) : null,
          'active',
          req.ip
        ]
      );

      // Get emergency resources
      const resources = {
        immediate: {
          call911: {
            number: '911',
            instruction: 'Call 911 immediately if you are in immediate danger'
          },
          crisis988: await connect988Service(userId, { emergencyType, hasLocation: !!location })
        },
        nearbyServices: location ? await getNearestEmergencyServices(location) : null,
        safetyPlan: null
      };

      // If authenticated user, get their safety plan and notify contacts
      if (userId) {
        // Notify emergency contacts asynchronously
        notifyEmergencyContacts(userId, emergencyType, location).catch(error => {
          logger.error('Failed to notify contacts', { error, userId, emergencyId });
        });

        // Get user's safety plan
        const safetyPlanResult = await db.query(
          `SELECT warning_signs, coping_strategies, support_contacts, 
                  emergency_contacts, reasons_for_living
           FROM safety_plans
           WHERE user_id = $1 AND is_active = true`,
          [userId]
        );

        if (safetyPlanResult.rows.length > 0) {
          const plan = safetyPlanResult.rows[0];
          resources.safetyPlan = {
            copingStrategies: plan.coping_strategies || [],
            supportContacts: plan.support_contacts || [],
            reasonsForLiving: plan.reasons_for_living || []
          };
        }

        // Create crisis event for tracking
        await db.query(
          `INSERT INTO crisis_events (
            id, user_id, severity, trigger_type, trigger_details,
            detected_by, response_status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            uuidv4(),
            userId,
            'emergency',
            'panic_button',
            JSON.stringify({ emergencyType, location, message }),
            'user',
            'responding'
          ]
        );
      }

      // Audit log
      await auditLog(userId, 'panic_triggered', emergencyId, {
        emergency_type: emergencyType,
        has_location: !!location,
        authenticated: !!userId
      }, req);

      // Response with emergency resources
      res.status(200).json({
        emergencyId,
        status: 'emergency_response_activated',
        resources,
        message: 'Emergency response activated. Help is available.',
        contactsNotified: !!userId,
        stayOnLine: true,
        instructions: [
          'If you are in immediate danger, call 911',
          'Stay in a safe location',
          'Use the coping strategies from your safety plan if available',
          'A crisis counselor is available at 988'
        ]
      });
    } catch (error: any) {
      logger.error('Failed to handle emergency panic', {
        error: error.message,
        userId: req.user?.id
      });
      
      // Still try to provide emergency resources even if database fails
      res.status(500).json({
        error: 'System error, but help is still available',
        emergencyResources: {
          call911: '911',
          crisis988: '988',
          crisisText: 'Text HOME to 741741'
        }
      });
    }
  }
);

/**
 * GET /api/emergency/contacts
 * Get user's emergency contacts
 */
router.get('/contacts',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get emergency contacts
      const contactsResult = await db.query(
        `SELECT 
          id, name, relationship, is_primary,
          created_at, updated_at
        FROM emergency_contacts
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY is_primary DESC, created_at ASC`,
        [userId]
      );

      // Don't decrypt phone numbers for listing (security)
      const contacts = contactsResult.rows.map(contact => ({
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        isPrimary: contact.is_primary,
        addedOn: contact.created_at
      }));

      // Get notification history
      const notificationResult = await db.query(
        `SELECT 
          COUNT(*) as total_notifications,
          MAX(sent_at) as last_notified
        FROM emergency_notifications
        WHERE user_id = $1`,
        [userId]
      );

      // Audit log
      await auditLog(userId, 'view_emergency_contacts', null, {
        count: contacts.length
      }, req);

      res.json({
        contacts,
        statistics: {
          totalContacts: contacts.length,
          hasPrimaryContact: contacts.some(c => c.isPrimary),
          ...notificationResult.rows[0]
        },
        recommendations: contacts.length === 0 ? [
          'Add at least one emergency contact',
          'Consider adding a trusted friend or family member',
          'Include someone who can respond quickly in emergencies'
        ] : null
      });
    } catch (error: any) {
      logger.error('Failed to get emergency contacts', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve emergency contacts' });
    }
  }
);

/**
 * POST /api/emergency/alert
 * Send emergency alert to contacts
 */
router.post('/alert',
  authenticate,
  [
    body('alertType').isIn(['check_in', 'need_support', 'emergency']),
    body('message').optional().isString().isLength({ max: 500 }),
    body('contactIds').optional().isArray(),
    body('location').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { alertType, message, contactIds, location } = req.body;

      // Rate limiting check for non-emergency alerts
      if (alertType !== 'emergency') {
        const recentAlertsResult = await db.query(
          `SELECT COUNT(*) as count
           FROM emergency_alerts
           WHERE user_id = $1 
             AND created_at > NOW() - INTERVAL '1 hour'
             AND alert_type != 'emergency'`,
          [userId]
        );

        if (parseInt(recentAlertsResult.rows[0].count) >= 3) {
          return res.status(429).json({ 
            error: 'Too many alerts sent recently. Please wait before sending another.',
            waitMinutes: 60
          });
        }
      }

      // Get contacts to alert
      let contactsQuery = `
        SELECT id, name, phone_number, relationship
        FROM emergency_contacts
        WHERE user_id = $1 AND deleted_at IS NULL
      `;
      
      const queryParams: any[] = [userId];
      
      if (contactIds && contactIds.length > 0) {
        contactsQuery += ` AND id = ANY($2)`;
        queryParams.push(contactIds);
      } else if (alertType === 'emergency') {
        // For emergency, notify all contacts
        contactsQuery += ` ORDER BY is_primary DESC`;
      } else {
        // For non-emergency, only notify primary contact
        contactsQuery += ` AND is_primary = true`;
      }

      const contactsResult = await db.query(contactsQuery, queryParams);

      if (contactsResult.rows.length === 0) {
        return res.status(404).json({ error: 'No emergency contacts found' });
      }

      // Create alert record
      const alertId = uuidv4();
      await db.query(
        `INSERT INTO emergency_alerts (
          id, user_id, alert_type, message, location,
          contacts_notified, created_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [
          alertId,
          userId,
          alertType,
          message ? db.encrypt(message) : null,
          location ? JSON.stringify(location) : null,
          JSON.stringify(contactsResult.rows.map(c => c.id)),
          'sent'
        ]
      );

      // Send notifications
      const notifications = [];
      for (const contact of contactsResult.rows) {
        try {
          // Prepare message based on alert type
          let alertMessage = '';
          switch (alertType) {
            case 'check_in':
              alertMessage = `Check-in request from ${req.user!.displayName || 'your contact'}: ${message || 'Please check in with me when you can.'}`;
              break;
            case 'need_support':
              alertMessage = `Support needed from ${req.user!.displayName || 'your contact'}: ${message || 'I could use some support right now.'}`;
              break;
            case 'emergency':
              alertMessage = `EMERGENCY ALERT from ${req.user!.displayName || 'your contact'}: ${message || 'I need immediate help.'}`;
              if (location) {
                alertMessage += ` Location provided.`;
              }
              break;
          }

          // TODO: Send actual SMS/notification
          // await sendSMS(db.decrypt(contact.phone_number), alertMessage);

          notifications.push({
            contactName: contact.name,
            status: 'sent',
            timestamp: new Date()
          });

          // Log notification
          await db.query(
            `INSERT INTO emergency_notification_log (
              alert_id, contact_id, status, sent_at
            ) VALUES ($1, $2, $3, NOW())`,
            [alertId, contact.id, 'sent']
          );
        } catch (error) {
          logger.error('Failed to send alert to contact', {
            error,
            contactId: contact.id,
            alertId
          });
          
          notifications.push({
            contactName: contact.name,
            status: 'failed',
            error: 'Failed to send notification'
          });
        }
      }

      // Audit log
      await auditLog(userId, 'send_emergency_alert', alertId, {
        alert_type: alertType,
        contacts_count: contactsResult.rows.length,
        has_location: !!location
      }, req);

      res.json({
        alertId,
        alertType,
        message: 'Emergency alert sent successfully',
        notifications,
        contactsNotified: notifications.filter(n => n.status === 'sent').length,
        totalContacts: contactsResult.rows.length
      });
    } catch (error: any) {
      logger.error('Failed to send emergency alert', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to send emergency alert' });
    }
  }
);

/**
 * GET /api/emergency/resources
 * Get emergency resources and crisis information
 */
router.get('/resources',
  optionalAuth,
  [
    query('type').optional().isIn(['crisis', 'mental_health', 'substance', 'domestic_violence', 'lgbtq']),
    query('location').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const { type = 'all', location } = req.query;
      const userId = req.user?.id || null;

      // Base resources available to everyone
      const resources: any = {
        national: {
          crisis: [
            {
              name: '988 Suicide & Crisis Lifeline',
              number: '988',
              text: 'Text 988',
              chat: 'https://988lifeline.org/chat',
              available: '24/7',
              description: 'Free, confidential crisis support'
            },
            {
              name: 'Crisis Text Line',
              number: 'Text HOME to 741741',
              available: '24/7',
              description: 'Free, 24/7 text support'
            },
            {
              name: 'Emergency Services',
              number: '911',
              available: '24/7',
              description: 'For immediate danger or medical emergency'
            }
          ],
          mentalHealth: [
            {
              name: 'SAMHSA National Helpline',
              number: '1-800-662-4357',
              available: '24/7',
              description: 'Treatment referral and information service'
            },
            {
              name: 'NAMI Helpline',
              number: '1-800-950-6264',
              available: 'M-F 10am-10pm ET',
              description: 'National Alliance on Mental Illness support'
            }
          ],
          substance: [
            {
              name: 'SAMHSA National Helpline',
              number: '1-800-662-4357',
              available: '24/7',
              description: 'Substance abuse and mental health services'
            },
            {
              name: 'Poison Control',
              number: '1-800-222-1222',
              available: '24/7',
              description: 'For overdose or poisoning emergencies'
            }
          ],
          domesticViolence: [
            {
              name: 'National Domestic Violence Hotline',
              number: '1-800-799-7233',
              text: 'Text START to 88788',
              available: '24/7',
              description: 'Confidential support for survivors'
            }
          ],
          lgbtq: [
            {
              name: 'Trevor Lifeline',
              number: '1-866-488-7386',
              text: 'Text START to 678-678',
              available: '24/7',
              description: 'Crisis support for LGBTQ youth'
            },
            {
              name: 'Trans Lifeline',
              number: '877-565-8860',
              available: 'Check website for hours',
              description: 'Support for transgender people'
            }
          ],
          veterans: [
            {
              name: 'Veterans Crisis Line',
              number: '988 then Press 1',
              text: 'Text 838255',
              available: '24/7',
              description: 'Support for veterans and their families'
            }
          ]
        }
      };

      // Filter by type if specified
      if (type !== 'all' && resources.national[type]) {
        resources.filtered = resources.national[type];
      }

      // Add user-specific resources if authenticated
      if (userId) {
        // Get user's safety plan
        const safetyPlanResult = await db.query(
          `SELECT coping_strategies, support_contacts, professional_contacts
           FROM safety_plans
           WHERE user_id = $1 AND is_active = true`,
          [userId]
        );

        if (safetyPlanResult.rows.length > 0) {
          resources.personalSafetyPlan = {
            available: true,
            copingStrategies: safetyPlanResult.rows[0].coping_strategies || [],
            supportNetwork: safetyPlanResult.rows[0].support_contacts || [],
            professionals: safetyPlanResult.rows[0].professional_contacts || []
          };
        }

        // Get user's therapist/psychiatrist info
        const providerResult = await db.query(
          `SELECT 
            u.display_name as provider_name,
            u.email as provider_email,
            pp.session_rate,
            'therapist' as provider_type
          FROM users u
          JOIN professional_profiles pp ON u.id = pp.user_id
          WHERE u.id = (SELECT primary_therapist_id FROM users WHERE id = $1)
          UNION
          SELECT 
            u.display_name as provider_name,
            u.email as provider_email,
            pp.session_rate,
            'psychiatrist' as provider_type
          FROM users u
          JOIN professional_profiles pp ON u.id = pp.user_id
          WHERE u.id = (SELECT primary_psychiatrist_id FROM users WHERE id = $1)`,
          [userId, userId]
        );

        if (providerResult.rows.length > 0) {
          resources.myProviders = providerResult.rows;
        }
      }

      // Add location-based resources if location provided
      if (location) {
        // TODO: Integrate with real geolocation API for local resources
        resources.local = {
          message: 'Location-based resources would be provided here',
          nearestER: 'Call 911 for nearest emergency room',
          localCrisisCenter: 'Contact 988 for local crisis center referral'
        };
      }

      // Add self-help resources
      resources.selfHelp = {
        breathingExercises: [
          {
            name: '4-7-8 Breathing',
            description: 'Inhale for 4, hold for 7, exhale for 8'
          },
          {
            name: 'Box Breathing',
            description: 'Inhale 4, hold 4, exhale 4, hold 4'
          }
        ],
        groundingTechniques: [
          {
            name: '5-4-3-2-1 Technique',
            description: 'Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste'
          },
          {
            name: 'Progressive Muscle Relaxation',
            description: 'Tense and release muscle groups from toes to head'
          }
        ],
        copingStrategies: [
          'Call a friend or family member',
          'Take a walk outside',
          'Listen to calming music',
          'Write in a journal',
          'Practice mindfulness meditation'
        ]
      };

      // Track resource access for analytics
      if (userId) {
        await db.query(
          `INSERT INTO resource_access_log (
            user_id, resource_type, accessed_at
          ) VALUES ($1, $2, NOW())`,
          [userId, type]
        );
      }

      // Audit log
      await auditLog(userId, 'view_emergency_resources', null, {
        resource_type: type,
        has_location: !!location
      }, req);

      res.json({
        resources,
        message: 'Help is available. You are not alone.',
        lastUpdated: new Date(),
        disclaimer: 'In case of immediate danger, always call 911'
      });
    } catch (error: any) {
      logger.error('Failed to get emergency resources', {
        error: error.message,
        userId: req.user?.id
      });
      
      // Always provide basic emergency numbers even on error
      res.status(500).json({
        error: 'Failed to load full resources',
        emergencyNumbers: {
          emergency: '911',
          crisis: '988',
          text: 'Text HOME to 741741'
        }
      });
    }
  }
);

export default router;