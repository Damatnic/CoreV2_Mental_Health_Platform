import { Handler } from '@netlify/functions';
import { query, transaction } from './utils/db-connection';
import { authenticateUser, createAuditLog } from './utils/auth';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Authenticate user
  const user = await authenticateUser(event.headers.authorization);
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const path = event.path.replace('/.netlify/functions/api-safety', '');
  const method = event.httpMethod;

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // Route handlers
    switch (true) {
      // Get crisis resources
      case path === '/crisis-resources' && method === 'GET': {
        const country = event.queryStringParameters?.country || 'US';
        const category = event.queryStringParameters?.category;
        
        let queryStr = `
          SELECT * FROM crisis_resources 
          WHERE is_active = true 
          AND country = $1
        `;
        const params: any[] = [country];
        
        if (category) {
          queryStr += ' AND category = $2';
          params.push(category);
        }
        
        queryStr += ' ORDER BY priority ASC, name ASC';
        
        const resources = await query(queryStr, params);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: resources }),
        };
      }

      // Get user's safety plan
      case path === '/safety-plan' && method === 'GET': {
        const plans = await query(
          `SELECT * FROM safety_plans 
           WHERE user_id = $1 AND is_active = true
           ORDER BY updated_at DESC
           LIMIT 1`,
          [user.id]
        );
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            data: plans.length > 0 ? plans[0] : null 
          }),
        };
      }

      // Create or update safety plan
      case path === '/safety-plan' && method === 'POST': {
        const {
          title,
          warning_signs,
          internal_coping_strategies,
          distraction_activities,
          social_distractions,
          support_contacts,
          professional_contacts,
          crisis_hotlines,
          safe_environment_steps,
          reasons_for_living,
          helpful_resources,
          personal_strengths,
          calming_activities,
          safe_places,
        } = body;

        // Deactivate existing plans
        await query(
          'UPDATE safety_plans SET is_active = false WHERE user_id = $1',
          [user.id]
        );

        // Create new active plan
        const result = await query(
          `INSERT INTO safety_plans 
           (user_id, title, warning_signs, internal_coping_strategies, 
            distraction_activities, social_distractions, support_contacts,
            professional_contacts, crisis_hotlines, safe_environment_steps,
            reasons_for_living, helpful_resources, personal_strengths,
            calming_activities, safe_places, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
           RETURNING *`,
          [
            user.id, title || 'My Safety Plan', warning_signs,
            internal_coping_strategies, distraction_activities,
            social_distractions, support_contacts, professional_contacts,
            crisis_hotlines, safe_environment_steps, reasons_for_living,
            helpful_resources, personal_strengths, calming_activities,
            safe_places,
          ]
        );

        await createAuditLog(user.id, 'safety_plan_created', 'safety_plans', result[0].id);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: result[0] }),
        };
      }

      // Activate safety plan (crisis moment)
      case path === '/safety-plan/activate' && method === 'POST': {
        const { trigger_reason, severity_level, strategies_used, contacts_reached } = body;

        // Get active safety plan
        const plans = await query(
          'SELECT id FROM safety_plans WHERE user_id = $1 AND is_active = true LIMIT 1',
          [user.id]
        );

        if (plans.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'No active safety plan found' }),
          };
        }

        // Record activation
        const result = await query(
          `INSERT INTO safety_plan_activations 
           (safety_plan_id, user_id, trigger_reason, severity_level, 
            strategies_used, contacts_reached)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            plans[0].id, user.id, trigger_reason, severity_level,
            strategies_used, contacts_reached,
          ]
        );

        // Check if crisis level requires intervention
        if (severity_level >= 8) {
          await query(
            `INSERT INTO crisis_detection_logs 
             (user_id, content_type, risk_score, action_taken)
             VALUES ($1, 'safety_plan_activation', $2, 'high_severity_activation')`,
            [user.id, severity_level * 10]
          );
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: result[0] }),
        };
      }

      // Emergency contacts
      case path === '/emergency-contacts' && method === 'GET': {
        const contacts = await query(
          `SELECT * FROM emergency_contacts 
           WHERE user_id = $1 
           ORDER BY priority_order ASC, is_primary DESC`,
          [user.id]
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: contacts }),
        };
      }

      case path === '/emergency-contacts' && method === 'POST': {
        const {
          name,
          relationship,
          phone_primary,
          phone_secondary,
          email,
          is_primary,
          notify_in_crisis,
        } = body;

        const result = await query(
          `INSERT INTO emergency_contacts 
           (user_id, name, relationship, phone_primary, phone_secondary, 
            email, is_primary, notify_in_crisis)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            user.id, name, relationship, phone_primary, phone_secondary,
            email, is_primary, notify_in_crisis,
          ]
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: result[0] }),
        };
      }

      // Crisis assessment
      case path === '/crisis-assessment' && method === 'POST': {
        const {
          assessment_type,
          questions,
          answers,
          total_score,
        } = body;

        // Calculate risk level based on assessment type and score
        let risk_level = 'low';
        if (assessment_type === 'PHQ-9') {
          if (total_score >= 20) risk_level = 'severe';
          else if (total_score >= 15) risk_level = 'high';
          else if (total_score >= 10) risk_level = 'moderate';
          else if (total_score >= 5) risk_level = 'low';
          else risk_level = 'none';
        }

        // Check for immediate danger indicators
        const suicidal_ideation = answers?.some((a: any) => 
          a.question?.includes('suicide') && a.value > 0
        );

        const result = await transaction(async (client) => {
          // Create assessment record
          const assessmentResult = await client.query(
            `INSERT INTO crisis_assessments 
             (user_id, assessment_type, total_score, risk_level, 
              questions, answers, suicidal_ideation)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
              user.id, assessment_type, total_score, risk_level,
              JSON.stringify(questions), JSON.stringify(answers),
              suicidal_ideation,
            ]
          );

          const assessment = assessmentResult.rows[0];

          // If high risk, create intervention record
          if (risk_level === 'high' || risk_level === 'severe' || suicidal_ideation) {
            await client.query(
              `INSERT INTO crisis_interventions 
               (user_id, assessment_id, intervention_type, severity_level, 
                immediate_danger, presenting_issues)
               VALUES ($1, $2, 'automated_assessment', $3, $4, $5)`,
              [
                user.id, assessment.id, risk_level,
                suicidal_ideation, ['assessment_triggered'],
              ]
            );

            // Log for monitoring
            await client.query(
              `INSERT INTO crisis_detection_logs 
               (user_id, content_type, content_id, risk_score, action_taken)
               VALUES ($1, 'assessment', $2, $3, 'intervention_created')`,
              [user.id, assessment.id, total_score]
            );
          }

          return assessment;
        });

        // Get appropriate resources based on risk level
        const resources = await query(
          `SELECT * FROM crisis_resources 
           WHERE is_active = true 
           AND country = 'US'
           AND category = 'crisis'
           ORDER BY priority ASC
           LIMIT 5`,
          []
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              assessment: result,
              risk_level,
              resources: resources,
              immediate_action_needed: risk_level === 'severe' || risk_level === 'high',
            },
          }),
        };
      }

      // Wellness check request
      case path === '/wellness-check' && method === 'POST': {
        const { check_type, reason, scheduled_time } = body;

        const result = await query(
          `INSERT INTO wellness_check_requests 
           (user_id, requested_by, check_type, reason, scheduled_time)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [user.id, user.id, check_type || 'self_scheduled', reason, scheduled_time]
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: result[0] }),
        };
      }

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' }),
        };
    }
  } catch (error: any) {
    console.error('Safety API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
      }),
    };
  }
};