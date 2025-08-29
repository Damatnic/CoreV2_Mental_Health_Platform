import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours, format, isAfter, isBefore, parseISO } from 'date-fns';

const router = Router();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/appointments.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * HIPAA-compliant audit logging
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
        'appointment',
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
 * Send appointment notification
 */
const sendAppointmentNotification = async (
  userId: string,
  appointmentId: string,
  type: string,
  details: any
): Promise<void> => {
  try {
    await db.query(
      `INSERT INTO notifications (
        id, user_id, type, title, message, data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        uuidv4(),
        userId,
        type,
        details.title,
        details.message,
        JSON.stringify({ appointmentId, ...details.data }),
      ]
    );

    // TODO: Trigger push notification service
    logger.info('Appointment notification sent', { userId, type, appointmentId });
  } catch (error) {
    logger.error('Failed to send appointment notification', { error, userId, appointmentId });
  }
};

/**
 * POST /api/appointments
 * Create new appointment
 */
router.post('/',
  authenticate,
  [
    body('helperId').isUUID(),
    body('type').isIn(['video', 'phone', 'chat', 'in_person']),
    body('scheduledAt').isISO8601().custom((value) => {
      const date = parseISO(value);
      return isAfter(date, new Date());
    }).withMessage('Appointment must be in the future'),
    body('duration').isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes'),
    body('reason').optional().isString().isLength({ max: 500 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('recurring').optional().isObject(),
    body('recurring.frequency').optional().isIn(['weekly', 'biweekly', 'monthly']),
    body('recurring.endDate').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { 
        helperId, 
        type, 
        scheduledAt, 
        duration, 
        reason, 
        notes,
        recurring 
      } = req.body;

      // Verify helper exists and is available
      const helperResult = await db.query(
        `SELECT u.id, u.email, u.display_name, pp.accepting_clients, pp.session_rate, pp.timezone
         FROM users u
         JOIN professional_profiles pp ON u.id = pp.user_id
         WHERE u.id = $1 
           AND u.role IN ('therapist', 'psychiatrist', 'helper')
           AND u.deleted_at IS NULL
           AND pp.verification_status = 'verified'`,
        [helperId]
      );

      if (helperResult.rows.length === 0) {
        return res.status(404).json({ error: 'Helper not found or not available' });
      }

      const helper = helperResult.rows[0];

      if (!helper.accepting_clients) {
        return res.status(400).json({ error: 'This helper is not currently accepting new appointments' });
      }

      // Check for scheduling conflicts
      const scheduledDate = parseISO(scheduledAt);
      const endTime = addHours(scheduledDate, duration / 60);

      const conflictResult = await db.query(
        `SELECT id FROM sessions
         WHERE (client_id = $1 OR helper_id = $2)
           AND status IN ('scheduled', 'in_progress')
           AND (
             (scheduled_at <= $3 AND scheduled_at + INTERVAL '1 minute' * duration > $3)
             OR (scheduled_at < $4 AND scheduled_at + INTERVAL '1 minute' * duration >= $4)
             OR (scheduled_at >= $3 AND scheduled_at < $4)
           )`,
        [userId, helperId, scheduledDate, endTime]
      );

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Scheduling conflict detected',
          conflictingAppointments: conflictResult.rows.map(r => r.id)
        });
      }

      // Start transaction for appointment creation
      const result = await db.transaction(async (client) => {
        const appointments = [];
        
        // Create main appointment
        const mainAppointment = await client.query(
          `INSERT INTO sessions (
            id, client_id, helper_id, status, type,
            scheduled_at, duration, client_notes, rate, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *`,
          [
            uuidv4(),
            userId,
            helperId,
            'scheduled',
            type,
            scheduledDate,
            duration,
            notes ? db.encrypt(notes) : null,
            helper.session_rate
          ]
        );
        
        appointments.push(mainAppointment.rows[0]);

        // Create appointment details
        await client.query(
          `INSERT INTO appointment_details (
            session_id, reason, intake_form_completed,
            reminder_sent, confirmation_required, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            mainAppointment.rows[0].id,
            reason ? db.encrypt(reason) : null,
            false,
            false,
            true
          ]
        );

        // Handle recurring appointments
        if (recurring && recurring.frequency) {
          const endDate = recurring.endDate ? parseISO(recurring.endDate) : addDays(scheduledDate, 90);
          let nextDate = scheduledDate;
          let count = 0;
          const maxRecurring = 12; // Maximum 12 recurring appointments

          while (count < maxRecurring && isBefore(nextDate, endDate)) {
            // Calculate next date based on frequency
            switch (recurring.frequency) {
              case 'weekly':
                nextDate = addDays(nextDate, 7);
                break;
              case 'biweekly':
                nextDate = addDays(nextDate, 14);
                break;
              case 'monthly':
                nextDate = addDays(nextDate, 30);
                break;
            }

            if (isBefore(nextDate, endDate)) {
              const recurringAppointment = await client.query(
                `INSERT INTO sessions (
                  id, client_id, helper_id, status, type,
                  scheduled_at, duration, client_notes, rate,
                  parent_session_id, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                RETURNING *`,
                [
                  uuidv4(),
                  userId,
                  helperId,
                  'scheduled',
                  type,
                  nextDate,
                  duration,
                  notes ? db.encrypt(notes) : null,
                  helper.session_rate,
                  mainAppointment.rows[0].id
                ]
              );
              
              appointments.push(recurringAppointment.rows[0]);
              count++;
            }
          }
        }

        return appointments;
      });

      // Send notifications
      await sendAppointmentNotification(userId, result[0].id, 'appointment_scheduled', {
        title: 'Appointment Scheduled',
        message: `Your ${type} appointment with ${helper.display_name || 'your helper'} is confirmed for ${format(scheduledDate, 'PPpp')}`,
        data: {
          helperId,
          helperName: helper.display_name,
          scheduledAt,
          type,
          duration
        }
      });

      await sendAppointmentNotification(helperId, result[0].id, 'new_appointment', {
        title: 'New Appointment',
        message: `You have a new ${type} appointment scheduled for ${format(scheduledDate, 'PPpp')}`,
        data: {
          clientId: userId,
          scheduledAt,
          type,
          duration
        }
      });

      // Audit log
      await auditLog(userId, 'create_appointment', result[0].id, {
        helper_id: helperId,
        type,
        scheduled_at: scheduledAt,
        recurring: !!recurring
      }, req);

      res.status(201).json({
        message: 'Appointment(s) scheduled successfully',
        appointments: result.map(apt => ({
          id: apt.id,
          helperId: apt.helper_id,
          helperName: helper.display_name,
          type: apt.type,
          scheduledAt: apt.scheduled_at,
          duration: apt.duration,
          status: apt.status,
          rate: apt.rate
        })),
        totalScheduled: result.length
      });
    } catch (error: any) {
      logger.error('Failed to create appointment', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to schedule appointment' });
    }
  }
);

/**
 * GET /api/appointments
 * Get user's appointments
 */
router.get('/',
  authenticate,
  [
    query('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['video', 'phone', 'chat', 'in_person']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const isHelper = ['therapist', 'psychiatrist', 'helper'].includes(req.user!.role);
      
      const {
        status,
        startDate = new Date(),
        endDate = addDays(new Date(), 90),
        type,
        limit = 50,
        offset = 0
      } = req.query;

      // Build query conditions
      let whereConditions = [];
      let queryParams: any[] = [];
      let paramCount = 1;

      // User role determines which appointments to show
      if (isHelper) {
        whereConditions.push(`(s.client_id = $${paramCount} OR s.helper_id = $${paramCount})`);
      } else {
        whereConditions.push(`s.client_id = $${paramCount}`);
      }
      queryParams.push(userId);
      paramCount++;

      whereConditions.push(`s.scheduled_at BETWEEN $${paramCount} AND $${paramCount + 1}`);
      queryParams.push(startDate, endDate);
      paramCount += 2;

      if (status) {
        whereConditions.push(`s.status = $${paramCount}`);
        queryParams.push(status);
        paramCount++;
      }

      if (type) {
        whereConditions.push(`s.type = $${paramCount}`);
        queryParams.push(type);
        paramCount++;
      }

      // Get appointments with helper/client info
      const appointmentsResult = await db.query(
        `SELECT 
          s.id, s.client_id, s.helper_id, s.status, s.type,
          s.scheduled_at, s.duration, s.started_at, s.ended_at,
          s.client_rating, s.helper_rating, s.rate,
          c.display_name as client_name, c.email as client_email,
          h.display_name as helper_name, h.email as helper_email,
          pp.specializations, pp.timezone,
          ad.reason, ad.intake_form_completed, ad.reminder_sent
        FROM sessions s
        JOIN users c ON s.client_id = c.id
        JOIN users h ON s.helper_id = h.id
        LEFT JOIN professional_profiles pp ON h.id = pp.user_id
        LEFT JOIN appointment_details ad ON s.id = ad.session_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY s.scheduled_at ASC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...queryParams, limit, offset]
      );

      // Decrypt sensitive fields and format response
      const appointments = appointmentsResult.rows.map(apt => {
        const appointment: any = {
          id: apt.id,
          type: apt.type,
          status: apt.status,
          scheduledAt: apt.scheduled_at,
          duration: apt.duration,
          rate: apt.rate
        };

        // Add role-specific information
        if (isHelper && apt.helper_id === userId) {
          // Helper viewing their appointments
          appointment.client = {
            id: apt.client_id,
            name: apt.client_name || 'Anonymous',
            email: apt.client_email
          };
          appointment.isHelper = true;
        } else {
          // Client viewing their appointments
          appointment.helper = {
            id: apt.helper_id,
            name: apt.helper_name,
            email: apt.helper_email,
            specializations: apt.specializations
          };
          appointment.isClient = true;
        }

        // Add additional details
        if (apt.reason) {
          try {
            appointment.reason = db.decrypt(apt.reason);
          } catch (error) {
            appointment.reason = null;
          }
        }

        appointment.intakeFormCompleted = apt.intake_form_completed;
        appointment.reminderSent = apt.reminder_sent;

        // Add timing information
        if (apt.started_at) appointment.startedAt = apt.started_at;
        if (apt.ended_at) appointment.endedAt = apt.ended_at;

        // Add ratings if completed
        if (apt.status === 'completed') {
          appointment.ratings = {
            client: apt.client_rating,
            helper: apt.helper_rating
          };
        }

        return appointment;
      });

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total
         FROM sessions s
         WHERE ${whereConditions.join(' AND ')}`,
        queryParams
      );

      // Get upcoming appointment reminders
      const upcomingResult = await db.query(
        `SELECT id, scheduled_at, type
         FROM sessions
         WHERE client_id = $1
           AND status = 'scheduled'
           AND scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
         ORDER BY scheduled_at ASC
         LIMIT 1`,
        [userId]
      );

      // Audit log
      await auditLog(userId, 'view_appointments', null, {
        count: appointments.length,
        date_range: { startDate, endDate }
      }, req);

      res.json({
        appointments,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit,
          offset,
          hasMore: offset + appointments.length < parseInt(countResult.rows[0].total)
        },
        upcoming: upcomingResult.rows[0] ? {
          id: upcomingResult.rows[0].id,
          scheduledAt: upcomingResult.rows[0].scheduled_at,
          type: upcomingResult.rows[0].type,
          hoursUntil: Math.round((new Date(upcomingResult.rows[0].scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60))
        } : null
      });
    } catch (error: any) {
      logger.error('Failed to get appointments', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve appointments' });
    }
  }
);

/**
 * PUT /api/appointments/:id
 * Update appointment (reschedule, update notes, etc.)
 */
router.put('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('scheduledAt').optional().isISO8601().custom((value) => {
      const date = parseISO(value);
      return isAfter(date, new Date());
    }),
    body('duration').optional().isInt({ min: 15, max: 120 }),
    body('type').optional().isIn(['video', 'phone', 'chat', 'in_person']),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('reason').optional().isString().isLength({ max: 500 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const appointmentId = req.params.id;
      const updates = req.body;

      // Verify ownership or helper access
      const appointmentResult = await db.query(
        `SELECT s.*, ad.reason
         FROM sessions s
         LEFT JOIN appointment_details ad ON s.id = ad.session_id
         WHERE s.id = $1 
           AND (s.client_id = $2 OR s.helper_id = $2)
           AND s.status IN ('scheduled', 'confirmed')`,
        [appointmentId, userId]
      );

      if (appointmentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found or cannot be modified' });
      }

      const appointment = appointmentResult.rows[0];

      // Check if appointment is too close to modify (less than 24 hours)
      const hoursUntil = (new Date(appointment.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24 && updates.scheduledAt) {
        return res.status(400).json({ 
          error: 'Cannot reschedule appointments less than 24 hours in advance',
          hoursUntil: Math.round(hoursUntil)
        });
      }

      // Check for scheduling conflicts if rescheduling
      if (updates.scheduledAt) {
        const newDate = parseISO(updates.scheduledAt);
        const duration = updates.duration || appointment.duration;
        const endTime = addHours(newDate, duration / 60);

        const conflictResult = await db.query(
          `SELECT id FROM sessions
           WHERE id != $1
             AND (client_id = $2 OR helper_id = $3)
             AND status IN ('scheduled', 'in_progress')
             AND (
               (scheduled_at <= $4 AND scheduled_at + INTERVAL '1 minute' * duration > $4)
               OR (scheduled_at < $5 AND scheduled_at + INTERVAL '1 minute' * duration >= $5)
               OR (scheduled_at >= $4 AND scheduled_at < $5)
             )`,
          [appointmentId, appointment.client_id, appointment.helper_id, newDate, endTime]
        );

        if (conflictResult.rows.length > 0) {
          return res.status(409).json({ error: 'Scheduling conflict with new time' });
        }
      }

      // Update appointment
      await db.transaction(async (client) => {
        // Update session
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (updates.scheduledAt) {
          updateFields.push(`scheduled_at = $${++paramCount}`);
          updateValues.push(parseISO(updates.scheduledAt));
        }

        if (updates.duration) {
          updateFields.push(`duration = $${++paramCount}`);
          updateValues.push(updates.duration);
        }

        if (updates.type) {
          updateFields.push(`type = $${++paramCount}`);
          updateValues.push(updates.type);
        }

        if (updates.notes) {
          const fieldName = userId === appointment.client_id ? 'client_notes' : 'helper_notes';
          updateFields.push(`${fieldName} = $${++paramCount}`);
          updateValues.push(db.encrypt(updates.notes));
        }

        if (updateFields.length > 0) {
          updateFields.push('updated_at = NOW()');
          await client.query(
            `UPDATE sessions 
             SET ${updateFields.join(', ')}
             WHERE id = $1`,
            [appointmentId, ...updateValues]
          );
        }

        // Update appointment details if reason provided
        if (updates.reason) {
          await client.query(
            `UPDATE appointment_details 
             SET reason = $2, updated_at = NOW()
             WHERE session_id = $1`,
            [appointmentId, db.encrypt(updates.reason)]
          );
        }

        // Create modification history
        await client.query(
          `INSERT INTO appointment_history (
            session_id, modified_by, action, changes, created_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [
            appointmentId,
            userId,
            updates.scheduledAt ? 'rescheduled' : 'updated',
            JSON.stringify(Object.keys(updates))
          ]
        );
      });

      // Send notifications if rescheduled
      if (updates.scheduledAt) {
        const otherUserId = userId === appointment.client_id ? appointment.helper_id : appointment.client_id;
        
        await sendAppointmentNotification(otherUserId, appointmentId, 'appointment_rescheduled', {
          title: 'Appointment Rescheduled',
          message: `Your appointment has been rescheduled to ${format(parseISO(updates.scheduledAt), 'PPpp')}`,
          data: {
            oldTime: appointment.scheduled_at,
            newTime: updates.scheduledAt,
            rescheduledBy: userId
          }
        });
      }

      // Audit log
      await auditLog(userId, 'update_appointment', appointmentId, {
        changes: Object.keys(updates),
        rescheduled: !!updates.scheduledAt
      }, req);

      res.json({
        message: 'Appointment updated successfully',
        appointment: {
          id: appointmentId,
          ...updates
        }
      });
    } catch (error: any) {
      logger.error('Failed to update appointment', {
        error: error.message,
        userId: req.user?.id,
        appointmentId: req.params.id
      });
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  }
);

/**
 * DELETE /api/appointments/:id
 * Cancel appointment
 */
router.delete('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('reason').optional().isString().isLength({ max: 500 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const appointmentId = req.params.id;
      const { reason } = req.body;

      // Verify ownership or helper access
      const appointmentResult = await db.query(
        `SELECT * FROM sessions
         WHERE id = $1 
           AND (client_id = $2 OR helper_id = $2)
           AND status = 'scheduled'`,
        [appointmentId, userId]
      );

      if (appointmentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found or already cancelled' });
      }

      const appointment = appointmentResult.rows[0];

      // Check cancellation policy (24 hours notice)
      const hoursUntil = (new Date(appointment.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
      const lateCancellation = hoursUntil < 24;

      // Cancel appointment
      await db.transaction(async (client) => {
        // Update status
        await client.query(
          `UPDATE sessions 
           SET status = 'cancelled', 
               cancelled_at = NOW(),
               cancellation_reason = $2,
               cancelled_by = $3,
               late_cancellation = $4
           WHERE id = $1`,
          [appointmentId, reason, userId, lateCancellation]
        );

        // Create cancellation record for billing
        if (lateCancellation) {
          await client.query(
            `INSERT INTO billing_events (
              id, user_id, session_id, type, amount, description, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              uuidv4(),
              appointment.client_id,
              appointmentId,
              'late_cancellation_fee',
              appointment.rate * 0.5, // 50% late cancellation fee
              'Late cancellation fee (less than 24 hours notice)'
            ]
          );
        }

        // Cancel any recurring appointments if this was the parent
        await client.query(
          `UPDATE sessions 
           SET status = 'cancelled', 
               cancelled_at = NOW(),
               cancellation_reason = 'Parent appointment cancelled'
           WHERE parent_session_id = $1 AND status = 'scheduled'`,
          [appointmentId]
        );
      });

      // Send notifications
      const otherUserId = userId === appointment.client_id ? appointment.helper_id : appointment.client_id;
      
      await sendAppointmentNotification(otherUserId, appointmentId, 'appointment_cancelled', {
        title: 'Appointment Cancelled',
        message: `Your appointment scheduled for ${format(new Date(appointment.scheduled_at), 'PPpp')} has been cancelled`,
        data: {
          cancelledBy: userId,
          reason,
          lateCancellation
        }
      });

      // Audit log
      await auditLog(userId, 'cancel_appointment', appointmentId, {
        reason,
        late_cancellation: lateCancellation,
        hours_until: Math.round(hoursUntil)
      }, req);

      res.json({
        message: 'Appointment cancelled successfully',
        lateCancellation,
        cancellationFee: lateCancellation ? appointment.rate * 0.5 : 0
      });
    } catch (error: any) {
      logger.error('Failed to cancel appointment', {
        error: error.message,
        userId: req.user?.id,
        appointmentId: req.params.id
      });
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
);

/**
 * GET /api/appointments/available-slots
 * Get available appointment slots for a helper
 */
router.get('/available-slots',
  authenticate,
  [
    query('helperId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('duration').optional().isInt({ min: 15, max: 120 }),
    query('type').optional().isIn(['video', 'phone', 'chat', 'in_person'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        helperId,
        startDate = new Date(),
        endDate = addDays(new Date(), 14),
        duration = 60,
        type = 'video'
      } = req.query;

      // Get helper's availability settings
      const helperResult = await db.query(
        `SELECT pp.available_hours, pp.timezone, pp.accepting_clients, u.display_name
         FROM professional_profiles pp
         JOIN users u ON pp.user_id = u.id
         WHERE pp.user_id = $1 AND pp.verification_status = 'verified'`,
        [helperId]
      );

      if (helperResult.rows.length === 0) {
        return res.status(404).json({ error: 'Helper not found or not verified' });
      }

      const helper = helperResult.rows[0];

      if (!helper.accepting_clients) {
        return res.json({
          message: 'This helper is not currently accepting new appointments',
          availableSlots: []
        });
      }

      // Get helper's existing appointments
      const appointmentsResult = await db.query(
        `SELECT scheduled_at, duration
         FROM sessions
         WHERE helper_id = $1
           AND status IN ('scheduled', 'in_progress')
           AND scheduled_at BETWEEN $2 AND $3
         ORDER BY scheduled_at`,
        [helperId, startDate, endDate]
      );

      // Parse availability hours (stored as JSON)
      const availableHours = helper.available_hours || {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null
      };

      // Generate available slots
      const slots = [];
      const currentDate = new Date(startDate as string);
      const endDateTime = new Date(endDate as string);

      while (currentDate <= endDateTime) {
        const dayName = format(currentDate, 'EEEE').toLowerCase();
        const dayAvailability = availableHours[dayName];

        if (dayAvailability && dayAvailability.start && dayAvailability.end) {
          // Generate slots for this day
          const [startHour, startMin] = dayAvailability.start.split(':').map(Number);
          const [endHour, endMin] = dayAvailability.end.split(':').map(Number);
          
          const dayStart = new Date(currentDate);
          dayStart.setHours(startHour, startMin, 0, 0);
          
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(endHour, endMin, 0, 0);

          let slotTime = new Date(dayStart);
          
          while (slotTime < dayEnd) {
            const slotEnd = addHours(slotTime, Number(duration) / 60);
            
            // Check if slot is in the future
            if (isAfter(slotTime, new Date())) {
              // Check for conflicts with existing appointments
              const hasConflict = appointmentsResult.rows.some(apt => {
                const aptStart = new Date(apt.scheduled_at);
                const aptEnd = addHours(aptStart, apt.duration / 60);
                
                return (
                  (slotTime >= aptStart && slotTime < aptEnd) ||
                  (slotEnd > aptStart && slotEnd <= aptEnd) ||
                  (slotTime <= aptStart && slotEnd >= aptEnd)
                );
              });

              if (!hasConflict && slotEnd <= dayEnd) {
                slots.push({
                  start: slotTime.toISOString(),
                  end: slotEnd.toISOString(),
                  duration: Number(duration),
                  available: true
                });
              }
            }

            // Move to next slot
            slotTime = new Date(slotTime.getTime() + Number(duration) * 60 * 1000);
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({
        helper: {
          id: helperId,
          name: helper.display_name,
          timezone: helper.timezone
        },
        availableSlots: slots,
        totalSlots: slots.length,
        dateRange: {
          start: startDate,
          end: endDate
        }
      });
    } catch (error: any) {
      logger.error('Failed to get available slots', {
        error: error.message,
        userId: req.user?.id,
        helperId: req.query.helperId
      });
      res.status(500).json({ error: 'Failed to retrieve available slots' });
    }
  }
);

export default router;