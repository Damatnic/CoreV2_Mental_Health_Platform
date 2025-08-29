import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { db, dbHelpers } from '../config/database';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';

const router = Router();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/medications.log' }),
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
        'medication',
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
 * Check for drug interactions
 */
const checkDrugInteractions = async (userId: string, medicationName: string): Promise<any[]> => {
  try {
    // Get user's current medications
    const currentMeds = await db.query(
      `SELECT name, active_ingredient FROM medications 
       WHERE user_id = $1 AND is_active = true AND deleted_at IS NULL`,
      [userId]
    );

    // Simple interaction check (in production, use a proper drug interaction API)
    const interactions = [];
    const commonInteractions: Record<string, string[]> = {
      'ssri': ['maoi', 'tramadol', 'st_johns_wort'],
      'maoi': ['ssri', 'snri', 'tyramine_foods'],
      'benzodiazepine': ['opioid', 'alcohol', 'sedative'],
      'lithium': ['nsaid', 'ace_inhibitor', 'diuretic'],
      'warfarin': ['nsaid', 'antibiotic', 'vitamin_k']
    };

    // Check for interactions (simplified)
    const medLower = medicationName.toLowerCase();
    for (const [drug, interactsWith] of Object.entries(commonInteractions)) {
      if (medLower.includes(drug)) {
        for (const currentMed of currentMeds.rows) {
          for (const interaction of interactsWith) {
            if (currentMed.name.toLowerCase().includes(interaction) || 
                currentMed.active_ingredient?.toLowerCase().includes(interaction)) {
              interactions.push({
                medication: currentMed.name,
                severity: 'moderate',
                description: `Potential interaction between ${medicationName} and ${currentMed.name}`
              });
            }
          }
        }
      }
    }

    return interactions;
  } catch (error) {
    logger.error('Failed to check drug interactions', { error, userId });
    return [];
  }
};

/**
 * Send medication reminder
 */
const scheduleMedicationReminder = async (
  userId: string,
  medicationId: string,
  medicationName: string,
  schedule: any
): Promise<void> => {
  try {
    // Create reminder entries for the next 7 days
    const reminders = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = addDays(now, day);
      
      for (const time of schedule.times || []) {
        const [hour, minute] = time.split(':').map(Number);
        const reminderTime = new Date(date);
        reminderTime.setHours(hour, minute, 0, 0);
        
        if (isAfter(reminderTime, now)) {
          reminders.push({
            id: uuidv4(),
            userId,
            medicationId,
            scheduledFor: reminderTime,
            message: `Time to take ${medicationName}`,
            type: 'medication_reminder'
          });
        }
      }
    }

    // Batch insert reminders
    if (reminders.length > 0) {
      const values = reminders.map(r => 
        `('${r.id}', '${r.userId}', '${r.medicationId}', '${r.scheduledFor.toISOString()}', '${r.message}', '${r.type}')`
      ).join(',');

      await db.query(
        `INSERT INTO medication_reminders (id, user_id, medication_id, scheduled_for, message, type)
         VALUES ${values}
         ON CONFLICT (user_id, medication_id, scheduled_for) DO NOTHING`
      );
    }

    logger.info('Medication reminders scheduled', { 
      userId, 
      medicationId, 
      remindersCount: reminders.length 
    });
  } catch (error) {
    logger.error('Failed to schedule medication reminders', { error, userId, medicationId });
  }
};

/**
 * POST /api/medications
 * Add new medication
 */
router.post('/',
  authenticate,
  [
    body('name').notEmpty().isString().isLength({ max: 200 }),
    body('dosage').notEmpty().isString().isLength({ max: 100 }),
    body('frequency').notEmpty().isString().isLength({ max: 100 }),
    body('prescribedBy').optional().isString().isLength({ max: 200 }),
    body('prescribedDate').optional().isISO8601(),
    body('startDate').notEmpty().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('purpose').optional().isString().isLength({ max: 500 }),
    body('sideEffects').optional().isArray(),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('schedule').optional().isObject(),
    body('schedule.times').optional().isArray(),
    body('schedule.days').optional().isArray(),
    body('refillDate').optional().isISO8601(),
    body('pharmacy').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const medicationData = req.body;

      // Check for drug interactions
      const interactions = await checkDrugInteractions(userId, medicationData.name);

      // Encrypt sensitive information
      const encryptedNotes = medicationData.notes ? db.encrypt(medicationData.notes) : null;
      const encryptedPurpose = medicationData.purpose ? db.encrypt(medicationData.purpose) : null;

      // Create medication record
      const result = await db.query(
        `INSERT INTO medications (
          id, user_id, name, dosage, frequency, prescribed_by,
          prescribed_date, start_date, end_date, purpose, side_effects,
          notes, schedule, refill_date, pharmacy, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING id, name, dosage, frequency, prescribed_by, prescribed_date,
                  start_date, end_date, side_effects, schedule, refill_date, pharmacy, is_active`,
        [
          uuidv4(),
          userId,
          medicationData.name,
          medicationData.dosage,
          medicationData.frequency,
          medicationData.prescribedBy,
          medicationData.prescribedDate ? parseISO(medicationData.prescribedDate) : null,
          parseISO(medicationData.startDate),
          medicationData.endDate ? parseISO(medicationData.endDate) : null,
          encryptedPurpose,
          JSON.stringify(medicationData.sideEffects || []),
          encryptedNotes,
          JSON.stringify(medicationData.schedule || {}),
          medicationData.refillDate ? parseISO(medicationData.refillDate) : null,
          medicationData.pharmacy,
          true
        ]
      );

      const medication = result.rows[0];

      // Schedule reminders if schedule provided
      if (medicationData.schedule && medicationData.schedule.times) {
        await scheduleMedicationReminder(
          userId,
          medication.id,
          medication.name,
          medicationData.schedule
        );
      }

      // Create initial adherence tracking record
      await db.query(
        `INSERT INTO medication_adherence (
          medication_id, user_id, total_doses, taken_doses, 
          missed_doses, adherence_rate, period_start, period_end
        ) VALUES ($1, $2, 0, 0, 0, 0, NOW(), NOW() + INTERVAL '30 days')`,
        [medication.id, userId]
      );

      // Audit log
      await auditLog(userId, 'add_medication', medication.id, {
        medication_name: medication.name,
        has_interactions: interactions.length > 0
      }, req);

      res.status(201).json({
        message: 'Medication added successfully',
        medication,
        interactions: interactions.length > 0 ? {
          warning: 'Potential drug interactions detected',
          interactions
        } : null,
        remindersScheduled: !!medicationData.schedule
      });
    } catch (error: any) {
      logger.error('Failed to add medication', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to add medication' });
    }
  }
);

/**
 * GET /api/medications
 * Get user's medications
 */
router.get('/',
  authenticate,
  [
    query('active').optional().isBoolean(),
    query('includeHistory').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { active = true, includeHistory = false } = req.query;

      // Build query conditions
      let whereConditions = ['user_id = $1', 'deleted_at IS NULL'];
      
      if (active === 'true' || active === true) {
        whereConditions.push('is_active = true');
      }

      // Get medications
      const medicationsResult = await db.query(
        `SELECT 
          id, name, dosage, frequency, prescribed_by, prescribed_date,
          start_date, end_date, side_effects, schedule, refill_date,
          pharmacy, is_active, created_at, updated_at
        FROM medications
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY is_active DESC, created_at DESC`,
        [userId]
      );

      // Decrypt sensitive fields for display
      const medications = await Promise.all(medicationsResult.rows.map(async (med) => {
        // Get adherence data
        const adherenceResult = await db.query(
          `SELECT adherence_rate, taken_doses, missed_doses, total_doses
           FROM medication_adherence
           WHERE medication_id = $1 AND user_id = $2
           ORDER BY period_start DESC
           LIMIT 1`,
          [med.id, userId]
        );

        // Get recent doses if requested
        let recentDoses = [];
        if (includeHistory) {
          const dosesResult = await db.query(
            `SELECT taken_at, scheduled_time, status, notes
             FROM medication_doses
             WHERE medication_id = $1 AND user_id = $2
             ORDER BY scheduled_time DESC
             LIMIT 7`,
            [med.id, userId]
          );
          recentDoses = dosesResult.rows;
        }

        // Get upcoming reminders
        const remindersResult = await db.query(
          `SELECT scheduled_for, message
           FROM medication_reminders
           WHERE medication_id = $1 
             AND user_id = $2 
             AND scheduled_for > NOW()
             AND sent = false
           ORDER BY scheduled_for ASC
           LIMIT 3`,
          [med.id, userId]
        );

        return {
          ...med,
          sideEffects: med.side_effects || [],
          schedule: med.schedule || {},
          adherence: adherenceResult.rows[0] || {
            adherence_rate: 0,
            taken_doses: 0,
            missed_doses: 0,
            total_doses: 0
          },
          recentDoses,
          upcomingReminders: remindersResult.rows,
          daysUntilRefill: med.refill_date ? 
            Math.ceil((new Date(med.refill_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
        };
      }));

      // Get medication statistics
      const statsResult = await db.query(
        `SELECT 
          COUNT(DISTINCT m.id) as total_medications,
          COUNT(DISTINCT CASE WHEN m.is_active THEN m.id END) as active_medications,
          AVG(ma.adherence_rate) as avg_adherence_rate
        FROM medications m
        LEFT JOIN medication_adherence ma ON m.id = ma.medication_id
        WHERE m.user_id = $1 AND m.deleted_at IS NULL`,
        [userId]
      );

      // Audit log
      await auditLog(userId, 'view_medications', null, {
        count: medications.length,
        include_history: includeHistory
      }, req);

      res.json({
        medications,
        statistics: {
          total: parseInt(statsResult.rows[0].total_medications),
          active: parseInt(statsResult.rows[0].active_medications),
          averageAdherence: parseFloat(statsResult.rows[0].avg_adherence_rate || '0').toFixed(1)
        }
      });
    } catch (error: any) {
      logger.error('Failed to get medications', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to retrieve medications' });
    }
  }
);

/**
 * PUT /api/medications/:id
 * Update medication
 */
router.put('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('dosage').optional().isString().isLength({ max: 100 }),
    body('frequency').optional().isString().isLength({ max: 100 }),
    body('endDate').optional().isISO8601(),
    body('sideEffects').optional().isArray(),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('schedule').optional().isObject(),
    body('refillDate').optional().isISO8601(),
    body('pharmacy').optional().isString(),
    body('isActive').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const medicationId = req.params.id;
      const updates = req.body;

      // Verify ownership
      const checkResult = await db.query(
        'SELECT id, name FROM medications WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [medicationId, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      const medication = checkResult.rows[0];

      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 2;

      if (updates.dosage !== undefined) {
        updateFields.push(`dosage = $${paramCount}`);
        updateValues.push(updates.dosage);
        paramCount++;
      }

      if (updates.frequency !== undefined) {
        updateFields.push(`frequency = $${paramCount}`);
        updateValues.push(updates.frequency);
        paramCount++;
      }

      if (updates.endDate !== undefined) {
        updateFields.push(`end_date = $${paramCount}`);
        updateValues.push(updates.endDate ? parseISO(updates.endDate) : null);
        paramCount++;
      }

      if (updates.sideEffects !== undefined) {
        updateFields.push(`side_effects = $${paramCount}`);
        updateValues.push(JSON.stringify(updates.sideEffects));
        paramCount++;
      }

      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramCount}`);
        updateValues.push(updates.notes ? db.encrypt(updates.notes) : null);
        paramCount++;
      }

      if (updates.schedule !== undefined) {
        updateFields.push(`schedule = $${paramCount}`);
        updateValues.push(JSON.stringify(updates.schedule));
        paramCount++;

        // Update reminders if schedule changed
        if (updates.schedule.times) {
          await scheduleMedicationReminder(
            userId,
            medicationId,
            medication.name,
            updates.schedule
          );
        }
      }

      if (updates.refillDate !== undefined) {
        updateFields.push(`refill_date = $${paramCount}`);
        updateValues.push(updates.refillDate ? parseISO(updates.refillDate) : null);
        paramCount++;
      }

      if (updates.pharmacy !== undefined) {
        updateFields.push(`pharmacy = $${paramCount}`);
        updateValues.push(updates.pharmacy);
        paramCount++;
      }

      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = $${paramCount}`);
        updateValues.push(updates.isActive);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Update medication
      updateFields.push('updated_at = NOW()');
      
      const result = await db.query(
        `UPDATE medications 
         SET ${updateFields.join(', ')}
         WHERE id = $1
         RETURNING id, name, dosage, frequency, is_active`,
        [medicationId, ...updateValues]
      );

      // Create update history
      await db.query(
        `INSERT INTO medication_history (
          medication_id, user_id, action, changes, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [medicationId, userId, 'updated', JSON.stringify(Object.keys(updates))]
      );

      // Audit log
      await auditLog(userId, 'update_medication', medicationId, {
        fields_updated: Object.keys(updates)
      }, req);

      res.json({
        message: 'Medication updated successfully',
        medication: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Failed to update medication', {
        error: error.message,
        userId: req.user?.id,
        medicationId: req.params.id
      });
      res.status(500).json({ error: 'Failed to update medication' });
    }
  }
);

/**
 * DELETE /api/medications/:id
 * Delete medication (soft delete)
 */
router.delete('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('reason').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const medicationId = req.params.id;
      const { reason } = req.body;

      // Verify ownership
      const checkResult = await db.query(
        'SELECT id, name FROM medications WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [medicationId, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      // Soft delete medication
      await db.query(
        `UPDATE medications 
         SET deleted_at = NOW(), 
             is_active = false,
             deletion_reason = $2
         WHERE id = $1`,
        [medicationId, reason]
      );

      // Cancel future reminders
      await db.query(
        `UPDATE medication_reminders 
         SET cancelled = true 
         WHERE medication_id = $1 
           AND scheduled_for > NOW()
           AND sent = false`,
        [medicationId]
      );

      // Create deletion record
      await db.query(
        `INSERT INTO medication_history (
          medication_id, user_id, action, changes, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [medicationId, userId, 'deleted', JSON.stringify({ reason })]
      );

      // Audit log
      await auditLog(userId, 'delete_medication', medicationId, {
        reason,
        soft_delete: true
      }, req);

      res.json({
        message: 'Medication removed successfully',
        remindersCancelled: true
      });
    } catch (error: any) {
      logger.error('Failed to delete medication', {
        error: error.message,
        userId: req.user?.id,
        medicationId: req.params.id
      });
      res.status(500).json({ error: 'Failed to delete medication' });
    }
  }
);

/**
 * POST /api/medications/doses
 * Record medication dose taken/missed
 */
router.post('/doses',
  authenticate,
  [
    body('medicationId').isUUID(),
    body('scheduledTime').isISO8601(),
    body('status').isIn(['taken', 'missed', 'skipped', 'late']),
    body('takenAt').optional().isISO8601(),
    body('notes').optional().isString().isLength({ max: 500 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.id;
      const { medicationId, scheduledTime, status, takenAt, notes } = req.body;

      // Verify medication ownership
      const medResult = await db.query(
        'SELECT id, name FROM medications WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [medicationId, userId]
      );

      if (medResult.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      const medication = medResult.rows[0];

      // Check for duplicate dose record
      const duplicateCheck = await db.query(
        `SELECT id FROM medication_doses 
         WHERE medication_id = $1 
           AND user_id = $2 
           AND scheduled_time = $3`,
        [medicationId, userId, scheduledTime]
      );

      let doseId;
      if (duplicateCheck.rows.length > 0) {
        // Update existing dose record
        doseId = duplicateCheck.rows[0].id;
        await db.query(
          `UPDATE medication_doses 
           SET status = $2, 
               taken_at = $3, 
               notes = $4,
               updated_at = NOW()
           WHERE id = $1`,
          [doseId, status, takenAt || null, notes ? db.encrypt(notes) : null]
        );
      } else {
        // Create new dose record
        const insertResult = await db.query(
          `INSERT INTO medication_doses (
            id, medication_id, user_id, scheduled_time, 
            taken_at, status, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id`,
          [
            uuidv4(),
            medicationId,
            userId,
            parseISO(scheduledTime),
            takenAt ? parseISO(takenAt) : null,
            status,
            notes ? db.encrypt(notes) : null
          ]
        );
        doseId = insertResult.rows[0].id;
      }

      // Update adherence statistics
      await updateAdherenceStats(userId, medicationId);

      // Mark reminder as acknowledged if exists
      await db.query(
        `UPDATE medication_reminders 
         SET acknowledged = true, 
             acknowledged_at = NOW(),
             dose_status = $3
         WHERE medication_id = $1 
           AND user_id = $2 
           AND scheduled_for = $4`,
        [medicationId, userId, status, scheduledTime]
      );

      // Check for concerning patterns
      const missedDosesResult = await db.query(
        `SELECT COUNT(*) as missed_count
         FROM medication_doses
         WHERE medication_id = $1 
           AND user_id = $2 
           AND status = 'missed'
           AND scheduled_time > NOW() - INTERVAL '7 days'`,
        [medicationId, userId]
      );

      const missedCount = parseInt(missedDosesResult.rows[0].missed_count);
      let alert = null;

      if (missedCount >= 3) {
        alert = {
          type: 'adherence_concern',
          message: `You've missed ${missedCount} doses of ${medication.name} in the past week. Consider discussing this with your healthcare provider.`,
          severity: missedCount >= 5 ? 'high' : 'medium'
        };

        // Create adherence alert
        await db.query(
          `INSERT INTO adherence_alerts (
            id, user_id, medication_id, alert_type, 
            message, severity, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            uuidv4(),
            userId,
            medicationId,
            'missed_doses',
            alert.message,
            alert.severity
          ]
        );
      }

      // Audit log
      await auditLog(userId, 'record_dose', doseId, {
        medication_id: medicationId,
        status,
        scheduled_time: scheduledTime
      }, req);

      res.json({
        message: `Dose ${status} recorded successfully`,
        doseId,
        alert,
        adherenceImpact: status === 'taken' ? 'positive' : 'negative'
      });
    } catch (error: any) {
      logger.error('Failed to record medication dose', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to record medication dose' });
    }
  }
);

/**
 * Helper function to update adherence statistics
 */
async function updateAdherenceStats(userId: string, medicationId: string): Promise<void> {
  try {
    // Calculate adherence for the current period
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total_doses,
        COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken_doses,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed_doses,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_doses
      FROM medication_doses
      WHERE medication_id = $1 
        AND user_id = $2 
        AND scheduled_time > NOW() - INTERVAL '30 days'`,
      [medicationId, userId]
    );

    const stats = statsResult.rows[0];
    const adherenceRate = stats.total_doses > 0 
      ? ((parseInt(stats.taken_doses) + parseInt(stats.late_doses) * 0.5) / parseInt(stats.total_doses)) * 100
      : 0;

    // Update or insert adherence record
    await db.query(
      `INSERT INTO medication_adherence (
        medication_id, user_id, total_doses, taken_doses, 
        missed_doses, late_doses, adherence_rate, 
        period_start, period_end, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '30 days', NOW(), NOW())
      ON CONFLICT (medication_id, user_id) 
      DO UPDATE SET 
        total_doses = $3,
        taken_doses = $4,
        missed_doses = $5,
        late_doses = $6,
        adherence_rate = $7,
        updated_at = NOW()`,
      [
        medicationId,
        userId,
        stats.total_doses,
        stats.taken_doses,
        stats.missed_doses,
        stats.late_doses,
        adherenceRate
      ]
    );
  } catch (error) {
    logger.error('Failed to update adherence statistics', { error, userId, medicationId });
  }
}

export default router;