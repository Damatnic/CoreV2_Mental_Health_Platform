import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Request validation schemas
const SafetyPlanSchema = z.object({
  userId: z.string().uuid(),
  warningSigns: z.array(z.string()).optional(),
  copingStrategies: z.array(z.string()).optional(),
  socialSupports: z.array(z.string()).optional(), // Encrypted client-side
  environmentalSafety: z.record(z.any()).optional(),
  professionalContacts: z.record(z.any()).optional(), // Encrypted client-side
  crisisContacts: z.record(z.any()).optional(), // Encrypted client-side
  effectivenessRating: z.number().int().min(1).max(10).optional()
});

const EmergencyContactSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  relationship: z.string().optional(),
  phone: z.string().optional(), // Encrypted client-side
  email: z.string().email().optional(), // Encrypted client-side
  isPrimary: z.boolean().optional(),
  isAvailable24h: z.boolean().optional()
});

const CrisisResourceSchema = z.object({
  userId: z.string().uuid(),
  resourceType: z.enum(['hotline', 'facility', 'professional', 'website', 'app']),
  name: z.string().min(1),
  contact: z.string().optional(), // Encrypted client-side
  description: z.string().optional(),
  availability: z.string().optional(),
  isLocal: z.boolean().optional()
});

interface SafetyPlanResponse {
  success: boolean;
  data?: any;
  error?: string;
  recommendations?: string[];
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/netlify/functions/safety-plan/', '');
    const method = event.httpMethod;

    switch (true) {
      case method === 'POST' && path === 'plan':
        return await createSafetyPlan(event, headers);
      
      case method === 'GET' && path.startsWith('plan/'):
        return await getSafetyPlan(event, headers);
      
      case method === 'PUT' && path.startsWith('plan/'):
        return await updateSafetyPlan(event, headers);
      
      case method === 'DELETE' && path.startsWith('plan/'):
        return await deleteSafetyPlan(event, headers);
      
      case method === 'POST' && path === 'contact':
        return await addEmergencyContact(event, headers);
      
      case method === 'GET' && path.startsWith('contacts/'):
        return await getEmergencyContacts(event, headers);
      
      case method === 'PUT' && path.startsWith('contact/'):
        return await updateEmergencyContact(event, headers);
      
      case method === 'DELETE' && path.startsWith('contact/'):
        return await deleteEmergencyContact(event, headers);
      
      case method === 'POST' && path === 'resource':
        return await addCrisisResource(event, headers);
      
      case method === 'GET' && path.startsWith('resources/'):
        return await getCrisisResources(event, headers);
      
      case method === 'GET' && path.startsWith('assessment/'):
        return await assessSafetyPlanEffectiveness(event, headers);
      
      case method === 'POST' && path === 'activate':
        return await activateSafetyPlan(event, headers);
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('Safety plan function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function createSafetyPlan(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = SafetyPlanSchema.parse(body);

    // Check if user already has a safety plan
    const { data: existingPlan } = await supabase
      .from('safety_plans')
      .select('id')
      .eq('user_id', validatedData.userId)
      .single();

    if (existingPlan) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Safety plan already exists. Use PUT to update.'
        })
      };
    }

    // Create safety plan
    const { data: safetyPlan, error: planError } = await supabase
      .from('safety_plans')
      .insert({
        user_id: validatedData.userId,
        warning_signs: validatedData.warningSigns,
        coping_strategies: validatedData.copingStrategies,
        social_supports: validatedData.socialSupports,
        environmental_safety: validatedData.environmentalSafety,
        professional_contacts: validatedData.professionalContacts,
        crisis_contacts: validatedData.crisisContacts,
        effectiveness_rating: validatedData.effectivenessRating,
        last_reviewed: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (planError) throw planError;

    // Log safety plan creation for audit
    await createSafetyPlanAuditLog(validatedData.userId, 'created', safetyPlan.id);

    // Generate personalized recommendations
    const recommendations = generateSafetyPlanRecommendations(validatedData);

    const response: SafetyPlanResponse = {
      success: true,
      data: {
        planId: safetyPlan.id,
        userId: validatedData.userId,
        createdAt: safetyPlan.created_at,
        isActive: true
      },
      recommendations
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid safety plan data'
      })
    };
  }
}

async function getSafetyPlan(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: safetyPlan, error } = await supabase
      .from('safety_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    if (!safetyPlan) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No active safety plan found'
        })
      };
    }

    // Check if plan needs review (older than 3 months)
    const lastReviewed = new Date(safetyPlan.last_reviewed);
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const needsReview = lastReviewed < threeMonthsAgo;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          ...safetyPlan,
          needsReview,
          daysSinceLastReview: Math.floor((Date.now() - lastReviewed.getTime()) / (24 * 60 * 60 * 1000))
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch safety plan'
      })
    };
  }
}

async function updateSafetyPlan(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const planId = pathParts[pathParts.length - 1];

    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const updateData = { ...body };
    delete updateData.userId; // Don't allow userId changes

    // Add review timestamp
    updateData.last_reviewed = new Date().toISOString();

    const { data: updatedPlan, error } = await supabase
      .from('safety_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Log safety plan update for audit
    await createSafetyPlanAuditLog(updatedPlan.user_id, 'updated', planId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          plan: updatedPlan,
          lastReviewed: updateData.last_reviewed
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update safety plan'
      })
    };
  }
}

async function deleteSafetyPlan(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const planId = pathParts[pathParts.length - 1];

    if (!planId) {
      throw new Error('Plan ID is required');
    }

    // Soft delete - mark as inactive instead of deleting
    const { data: deletedPlan, error } = await supabase
      .from('safety_plans')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', planId)
      .select('user_id')
      .single();

    if (error) throw error;

    // Log safety plan deletion for audit
    await createSafetyPlanAuditLog(deletedPlan.user_id, 'deleted', planId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          planId,
          deleted: true,
          deletedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete safety plan'
      })
    };
  }
}

async function addEmergencyContact(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = EmergencyContactSchema.parse(body);

    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: validatedData.userId,
        name: validatedData.name,
        relationship: validatedData.relationship,
        phone: validatedData.phone,
        email: validatedData.email,
        is_primary: validatedData.isPrimary || false,
        is_available_24h: validatedData.isAvailable24h || false
      })
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          contactId: contact.id,
          name: validatedData.name,
          relationship: validatedData.relationship,
          isPrimary: validatedData.isPrimary
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add emergency contact'
      })
    };
  }
}

async function getEmergencyContacts(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: contacts, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          contacts: contacts || [],
          count: contacts?.length || 0
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch emergency contacts'
      })
    };
  }
}

async function updateEmergencyContact(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const contactId = pathParts[pathParts.length - 1];

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const updateData = { ...body };
    delete updateData.userId;

    const { data: updatedContact, error } = await supabase
      .from('emergency_contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          contact: updatedContact
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update emergency contact'
      })
    };
  }
}

async function deleteEmergencyContact(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const contactId = pathParts[pathParts.length - 1];

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    const { error } = await supabase
      .from('emergency_contacts')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', contactId);

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          contactId,
          deleted: true
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete emergency contact'
      })
    };
  }
}

async function addCrisisResource(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = CrisisResourceSchema.parse(body);

    const { data: resource, error } = await supabase
      .from('crisis_resources')
      .insert({
        user_id: validatedData.userId,
        resource_type: validatedData.resourceType,
        name: validatedData.name,
        contact: validatedData.contact,
        description: validatedData.description,
        availability: validatedData.availability,
        is_local: validatedData.isLocal || false
      })
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          resourceId: resource.id,
          name: validatedData.name,
          type: validatedData.resourceType
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add crisis resource'
      })
    };
  }
}

async function getCrisisResources(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: resources, error } = await supabase
      .from('crisis_resources')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('resource_type')
      .order('name');

    if (error) throw error;

    // Group resources by type
    const groupedResources = (resources || []).reduce((acc, resource) => {
      const type = resource.resource_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(resource);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          resources: groupedResources,
          totalCount: resources?.length || 0
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crisis resources'
      })
    };
  }
}

async function assessSafetyPlanEffectiveness(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get safety plan usage data
    const { data: usageData, error: usageError } = await supabase
      .from('safety_plan_activations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (usageError) throw usageError;

    // Get mood data for correlation
    const { data: moodData, error: moodError } = await supabase
      .from('mood_entries')
      .select('mood_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (moodError) throw moodError;

    const assessment = {
      activationCount: usageData?.length || 0,
      averageEffectivenessRating: calculateAverageEffectiveness(usageData || []),
      mostUsedStrategies: analyzeMostUsedStrategies(usageData || []),
      moodCorrelation: analyzeMoodCorrelation(usageData || [], moodData || []),
      recommendations: generateEffectivenessRecommendations(usageData || [], moodData || [])
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          assessment,
          timeframe: '30 days'
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assess safety plan effectiveness'
      })
    };
  }
}

async function activateSafetyPlan(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, strategyUsed, effectivenessRating, notes } = body;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Log safety plan activation
    const { data: activation, error } = await supabase
      .from('safety_plan_activations')
      .insert({
        user_id: userId,
        strategy_used: strategyUsed,
        effectiveness_rating: effectivenessRating,
        notes: notes,
        activated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await createSafetyPlanAuditLog(userId, 'activated', null, {
      strategy: strategyUsed,
      effectiveness: effectivenessRating
    });

    // If effectiveness is low, suggest plan review
    const suggestions = effectivenessRating && effectivenessRating <= 3 
      ? ['Consider reviewing and updating your safety plan', 'Reach out to a mental health professional']
      : ['Great job using your safety plan!', 'Continue practicing these strategies'];

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          activationId: activation.id,
          activatedAt: activation.activated_at,
          suggestions
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log safety plan activation'
      })
    };
  }
}

// Helper functions
async function createSafetyPlanAuditLog(userId: string, action: string, planId?: string, metadata?: any) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: `safety_plan_${action}`,
        resource_type: 'safety_plan',
        resource_id: planId,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

function generateSafetyPlanRecommendations(data: z.infer<typeof SafetyPlanSchema>): string[] {
  const recommendations = [];

  if (!data.warningSigns || data.warningSigns.length === 0) {
    recommendations.push('Consider adding warning signs that indicate when you might need to use your safety plan');
  }

  if (!data.copingStrategies || data.copingStrategies.length < 3) {
    recommendations.push('Try to include at least 3-5 coping strategies that work for you');
  }

  if (!data.socialSupports || data.socialSupports.length === 0) {
    recommendations.push('Include trusted friends or family members you can reach out to');
  }

  if (!data.professionalContacts) {
    recommendations.push('Add contact information for mental health professionals');
  }

  if (!data.crisisContacts) {
    recommendations.push('Include crisis hotline numbers and emergency contacts');
  }

  recommendations.push('Review and update your safety plan regularly');
  recommendations.push('Practice using your coping strategies when you\'re feeling well');

  return recommendations;
}

function calculateAverageEffectiveness(usageData: any[]): number {
  if (usageData.length === 0) return 0;
  
  const ratingsWithValues = usageData.filter(u => u.effectiveness_rating);
  if (ratingsWithValues.length === 0) return 0;
  
  const sum = ratingsWithValues.reduce((acc, u) => acc + u.effectiveness_rating, 0);
  return Math.round((sum / ratingsWithValues.length) * 10) / 10;
}

function analyzeMostUsedStrategies(usageData: any[]): string[] {
  const strategyCount = new Map<string, number>();
  
  usageData.forEach(usage => {
    if (usage.strategy_used) {
      strategyCount.set(usage.strategy_used, (strategyCount.get(usage.strategy_used) || 0) + 1);
    }
  });

  return Array.from(strategyCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strategy]) => strategy);
}

function analyzeMoodCorrelation(usageData: any[], moodData: any[]): string {
  // Simple correlation analysis
  const activationDates = usageData.map(u => new Date(u.activated_at).toDateString());
  const moodOnActivationDays = moodData.filter(m => 
    activationDates.includes(new Date(m.created_at).toDateString())
  );

  if (moodOnActivationDays.length === 0) return 'insufficient_data';

  const avgMoodOnActivationDays = moodOnActivationDays.reduce((sum, m) => sum + m.mood_score, 0) / moodOnActivationDays.length;
  const allMoodsAvg = moodData.reduce((sum, m) => sum + m.mood_score, 0) / moodData.length;

  if (avgMoodOnActivationDays > allMoodsAvg + 0.5) return 'positive';
  if (avgMoodOnActivationDays < allMoodsAvg - 0.5) return 'negative';
  return 'neutral';
}

function generateEffectivenessRecommendations(usageData: any[], moodData: any[]): string[] {
  const recommendations = [];

  if (usageData.length === 0) {
    recommendations.push('Start using your safety plan when you notice warning signs');
    return recommendations;
  }

  const avgEffectiveness = calculateAverageEffectiveness(usageData);
  
  if (avgEffectiveness < 5) {
    recommendations.push('Consider reviewing and updating your coping strategies');
    recommendations.push('Discuss your safety plan with a mental health professional');
  } else if (avgEffectiveness >= 7) {
    recommendations.push('Your safety plan is working well - keep using it!');
    recommendations.push('Consider sharing successful strategies with others');
  }

  const mostUsed = analyzeMostUsedStrategies(usageData);
  if (mostUsed.length > 0) {
    recommendations.push(`Your most effective strategy appears to be: ${mostUsed[0]}`);
  }

  const correlation = analyzeMoodCorrelation(usageData, moodData);
  if (correlation === 'positive') {
    recommendations.push('Your safety plan usage correlates with improved mood');
  } else if (correlation === 'negative') {
    recommendations.push('Consider additional support during difficult periods');
  }

  return recommendations;
}
