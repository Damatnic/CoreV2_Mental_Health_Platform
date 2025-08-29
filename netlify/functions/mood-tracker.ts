import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Request validation schemas
const MoodEntrySchema = z.object({
  userId: z.string().uuid(),
  moodScore: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10).optional(),
  anxietyLevel: z.number().int().min(1).max(10).optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  triggers: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  notes: z.string().optional(),
  weather: z.string().optional(),
  socialInteraction: z.boolean().optional(),
  exercise: z.boolean().optional(),
  medicationTaken: z.boolean().optional()
});

const MoodAnalysisRequestSchema = z.object({
  userId: z.string().uuid(),
  days: z.number().int().min(1).max(365).optional().default(30)
});

interface MoodResponse {
  success: boolean;
  data?: any;
  error?: string;
  insights?: string[];
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
    const path = event.path.replace('/netlify/functions/mood-tracker/', '');
    const method = event.httpMethod;

    switch (true) {
      case method === 'POST' && path === 'entry':
        return await createMoodEntry(event, headers);
      
      case method === 'GET' && path.startsWith('entries/'):
        return await getUserMoodEntries(event, headers);
      
      case method === 'GET' && path.startsWith('trends/'):
        return await getMoodTrends(event, headers);
      
      case method === 'POST' && path === 'analysis':
        return await getMoodAnalysis(event, headers);
      
      case method === 'GET' && path.startsWith('statistics/'):
        return await getMoodStatistics(event, headers);
      
      case method === 'DELETE' && path.startsWith('entry/'):
        return await deleteMoodEntry(event, headers);
      
      case method === 'PUT' && path.startsWith('entry/'):
        return await updateMoodEntry(event, headers);
      
      case method === 'GET' && path.startsWith('today/'):
        return await getTodaysMoodEntry(event, headers);
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('Mood tracker function error:', error);
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

async function createMoodEntry(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = MoodEntrySchema.parse(body);

    // Create mood entry
    const { data: moodEntry, error: moodError } = await supabase
      .from('mood_entries')
      .insert({
        user_id: validatedData.userId,
        mood_score: validatedData.moodScore,
        energy_level: validatedData.energyLevel,
        anxiety_level: validatedData.anxietyLevel,
        sleep_quality: validatedData.sleepQuality,
        triggers: validatedData.triggers,
        activities: validatedData.activities,
        notes: validatedData.notes,
        weather: validatedData.weather,
        social_interaction: validatedData.socialInteraction,
        exercise: validatedData.exercise,
        medication_taken: validatedData.medicationTaken
      })
      .select()
      .single();

    if (moodError) throw moodError;

    // Check for crisis patterns (low mood scores)
    if (validatedData.moodScore <= 3) {
      await createCrisisEventFromMood(validatedData.userId, validatedData.moodScore, validatedData.triggers);
    }

    // Generate insights for this entry
    const insights = generateMoodInsights(validatedData);
    const recommendations = generateMoodRecommendations(validatedData);

    const response: MoodResponse = {
      success: true,
      data: {
        entryId: moodEntry.id,
        moodScore: validatedData.moodScore,
        timestamp: moodEntry.created_at
      },
      insights,
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
        error: error instanceof Error ? error.message : 'Invalid mood entry data'
      })
    };
  }
}

async function getUserMoodEntries(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '100');
    const days = queryParams.days ? parseInt(queryParams.days) : undefined;

    let query = supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (days) {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          entries,
          count: entries?.length || 0,
          timeframe: days ? `${days} days` : 'all time'
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch mood entries'
      })
    };
  }
}

async function getMoodTrends(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const queryParams = event.queryStringParameters || {};
    const days = parseInt(queryParams.days || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data: entries, error } = await supabase
      .from('mood_entries')
      .select('created_at, mood_score, energy_level, anxiety_level, sleep_quality')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date and calculate daily averages
    const dailyData = new Map<string, {
      entries: number;
      moodSum: number;
      energySum: number;
      anxietySum: number;
      sleepSum: number;
    }>();

    entries?.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      const current = dailyData.get(date) || {
        entries: 0,
        moodSum: 0,
        energySum: 0,
        anxietySum: 0,
        sleepSum: 0
      };

      current.entries++;
      current.moodSum += entry.mood_score;
      if (entry.energy_level) current.energySum += entry.energy_level;
      if (entry.anxiety_level) current.anxietySum += entry.anxiety_level;
      if (entry.sleep_quality) current.sleepSum += entry.sleep_quality;

      dailyData.set(date, current);
    });

    const trendData = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      moodScore: Math.round((data.moodSum / data.entries) * 10) / 10,
      energyLevel: data.energySum > 0 ? Math.round((data.energySum / data.entries) * 10) / 10 : null,
      anxietyLevel: data.anxietySum > 0 ? Math.round((data.anxietySum / data.entries) * 10) / 10 : null,
      sleepQuality: data.sleepSum > 0 ? Math.round((data.sleepSum / data.entries) * 10) / 10 : null,
      entryCount: data.entries
    }));

    // Calculate trend direction
    const recentAvg = calculateRecentAverage(trendData, 7); // Last 7 days
    const olderAvg = calculateOlderAverage(trendData, 7, 14); // 7-14 days ago
    
    let trendDirection = 'stable';
    if (recentAvg > olderAvg + 0.5) trendDirection = 'improving';
    else if (recentAvg < olderAvg - 0.5) trendDirection = 'declining';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          trends: trendData,
          summary: {
            trendDirection,
            recentAverage: Math.round(recentAvg * 10) / 10,
            olderAverage: Math.round(olderAvg * 10) / 10,
            totalEntries: entries?.length || 0,
            timeframe: `${days} days`
          }
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate mood trends'
      })
    };
  }
}

async function getMoodAnalysis(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, days } = MoodAnalysisRequestSchema.parse(body);

    // Use database function for mood trend analysis
    const { data: trendData, error: trendError } = await supabase
      .rpc('get_mood_trend', { user_uuid: userId, days });

    if (trendError) throw trendError;

    const trend = trendData?.[0] || { avg_mood: 0, trend_direction: 'stable', crisis_risk: 'low' };

    // Get detailed mood entries for pattern analysis
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data: entries, error: entriesError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            analysis: {
              averageMood: 0,
              trendDirection: 'stable',
              crisisRisk: 'low',
              totalEntries: 0,
              patterns: {
                commonTriggers: [],
                effectiveActivities: [],
                weeklyPattern: new Array(7).fill(0),
                correlations: { exercise: 0, sleep: 0, social: 0, medication: 0 }
              }
            },
            recommendations: ['Start tracking your mood regularly to identify patterns']
          }
        })
      };
    }

    // Analyze patterns
    const analysis = {
      averageMood: Math.round(trend.avg_mood * 10) / 10,
      trendDirection: trend.trend_direction,
      crisisRisk: trend.crisis_risk,
      totalEntries: entries.length,
      patterns: {
        commonTriggers: analyzeFrequency(entries.flatMap(e => e.triggers || [])).slice(0, 5),
        effectiveActivities: analyzeEffectiveActivities(entries).slice(0, 5),
        weeklyPattern: analyzeWeeklyPattern(entries),
        correlations: analyzeCorrelations(entries)
      }
    };

    const recommendations = generateAnalysisRecommendations(analysis);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          analysis,
          recommendations,
          timeframe: `${days} days`
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate mood analysis'
      })
    };
  }
}

async function getMoodStatistics(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const queryParams = event.queryStringParameters || {};
    const days = parseInt(queryParams.days || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: entries, error } = await supabase
      .from('mood_entries')
      .select('mood_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            statistics: {
              totalEntries: 0,
              averageMood: 0,
              highestMood: 0,
              lowestMood: 0,
              moodRange: 0,
              streakDays: 0
            }
          }
        })
      };
    }

    const moodScores = entries.map(e => e.mood_score);
    const averageMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    const highestMood = Math.max(...moodScores);
    const lowestMood = Math.min(...moodScores);
    const streakDays = calculateMoodStreak(entries);

    const statistics = {
      totalEntries: entries.length,
      averageMood: Math.round(averageMood * 10) / 10,
      highestMood,
      lowestMood,
      moodRange: highestMood - lowestMood,
      streakDays
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          statistics,
          timeframe: `${days} days`
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate mood statistics'
      })
    };
  }
}

async function getTodaysMoodEntry(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      throw new Error('User ID is required');
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: entry, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today)
      .lt('created_at', tomorrow)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          todaysEntry: entry || null,
          hasEntry: !!entry
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch today\'s mood entry'
      })
    };
  }
}

async function deleteMoodEntry(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const entryId = pathParts[pathParts.length - 1];

    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    const { error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          entryId,
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
        error: error instanceof Error ? error.message : 'Failed to delete mood entry'
      })
    };
  }
}

async function updateMoodEntry(event: HandlerEvent, headers: Record<string, string>) {
  try {
    const pathParts = event.path.split('/');
    const entryId = pathParts[pathParts.length - 1];

    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    
    // Remove userId from validation for updates
    const updateData = { ...body };
    delete updateData.userId;

    const { data: updatedEntry, error } = await supabase
      .from('mood_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          entry: updatedEntry
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update mood entry'
      })
    };
  }
}

// Helper functions
async function createCrisisEventFromMood(userId: string, moodScore: number, triggers?: string[]) {
  const severity = moodScore <= 2 ? 'high' : 'medium';
  const confidenceScore = moodScore <= 2 ? 0.8 : 0.6;

  await supabase
    .from('crisis_events')
    .insert({
      user_id: userId,
      severity,
      trigger_type: 'behavioral',
      detected_keywords: ['low_mood_pattern'],
      confidence_score: confidenceScore,
      device_context: { source: 'mood_tracker', mood_score: moodScore }
    });
}

function generateMoodInsights(data: z.infer<typeof MoodEntrySchema>): string[] {
  const insights = [];

  if (data.moodScore >= 8) {
    insights.push('You\'re having a great day! This is a good time to note what\'s working well.');
  } else if (data.moodScore <= 3) {
    insights.push('It looks like you\'re having a tough time. Remember that these feelings are temporary.');
  }

  if (data.exercise && data.moodScore >= 6) {
    insights.push('Exercise seems to be positively impacting your mood today.');
  }

  if (data.sleepQuality && data.sleepQuality >= 8 && data.energyLevel && data.energyLevel >= 7) {
    insights.push('Good sleep appears to be boosting your energy levels.');
  }

  if (data.socialInteraction && data.moodScore >= 6) {
    insights.push('Social interaction seems to be having a positive effect on your mood.');
  }

  return insights;
}

function generateMoodRecommendations(data: z.infer<typeof MoodEntrySchema>): string[] {
  const recommendations = [];

  if (data.moodScore <= 4) {
    recommendations.push('Consider practicing some self-care activities');
    recommendations.push('Reach out to a friend or support person');
    
    if (data.anxietyLevel && data.anxietyLevel >= 7) {
      recommendations.push('Try some breathing exercises or grounding techniques');
    }
  }

  if (data.sleepQuality && data.sleepQuality <= 4) {
    recommendations.push('Focus on improving sleep hygiene tonight');
  }

  if (!data.exercise && data.energyLevel && data.energyLevel >= 6) {
    recommendations.push('You have good energy today - consider some physical activity');
  }

  if (!data.socialInteraction && data.moodScore <= 5) {
    recommendations.push('Consider connecting with someone you care about');
  }

  return recommendations;
}

function analyzeFrequency(items: string[]): string[] {
  const frequency = new Map<string, number>();
  
  items.forEach(item => {
    frequency.set(item, (frequency.get(item) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
}

function analyzeEffectiveActivities(entries: any[]): string[] {
  const activityEffectiveness = new Map<string, { total: number; moodSum: number }>();
  
  entries.forEach(entry => {
    if (entry.activities) {
      entry.activities.forEach((activity: string) => {
        const current = activityEffectiveness.get(activity) || { total: 0, moodSum: 0 };
        current.total++;
        current.moodSum += entry.mood_score;
        activityEffectiveness.set(activity, current);
      });
    }
  });

  return Array.from(activityEffectiveness.entries())
    .map(([activity, stats]) => ({
      activity,
      effectiveness: stats.total > 0 ? stats.moodSum / stats.total : 0
    }))
    .filter(item => item.effectiveness >= 6) // Only activities that correlate with good mood
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .map(item => item.activity);
}

function analyzeWeeklyPattern(entries: any[]): number[] {
  const weeklyData = new Array(7).fill(0);
  const weeklyCounts = new Array(7).fill(0);

  entries.forEach(entry => {
    const dayOfWeek = new Date(entry.created_at).getDay();
    weeklyData[dayOfWeek] += entry.mood_score;
    weeklyCounts[dayOfWeek]++;
  });

  return weeklyData.map((sum, index) => 
    weeklyCounts[index] > 0 ? Math.round((sum / weeklyCounts[index]) * 10) / 10 : 0
  );
}

function analyzeCorrelations(entries: any[]): { exercise: number; sleep: number; social: number; medication: number } {
  const correlations = { exercise: 0, sleep: 0, social: 0, medication: 0 };
  
  const exerciseEntries = entries.filter(e => e.exercise === true);
  const socialEntries = entries.filter(e => e.social_interaction === true);
  const medicationEntries = entries.filter(e => e.medication_taken === true);
  const sleepEntries = entries.filter(e => e.sleep_quality && e.sleep_quality >= 7);

  if (exerciseEntries.length > 0) {
    correlations.exercise = exerciseEntries.reduce((sum, e) => sum + e.mood_score, 0) / exerciseEntries.length;
  }

  if (socialEntries.length > 0) {
    correlations.social = socialEntries.reduce((sum, e) => sum + e.mood_score, 0) / socialEntries.length;
  }

  if (medicationEntries.length > 0) {
    correlations.medication = medicationEntries.reduce((sum, e) => sum + e.mood_score, 0) / medicationEntries.length;
  }

  if (sleepEntries.length > 0) {
    correlations.sleep = sleepEntries.reduce((sum, e) => sum + e.mood_score, 0) / sleepEntries.length;
  }

  return correlations;
}

function calculateRecentAverage(trendData: any[], days: number): number {
  const recent = trendData.slice(-days);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, day) => sum + day.moodScore, 0) / recent.length;
}

function calculateOlderAverage(trendData: any[], startDays: number, endDays: number): number {
  const older = trendData.slice(-endDays, -startDays);
  if (older.length === 0) return 0;
  return older.reduce((sum, day) => sum + day.moodScore, 0) / older.length;
}

function calculateMoodStreak(entries: any[]): number {
  if (entries.length === 0) return 0;

  let streak = 0;
  const sortedEntries = entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  for (const entry of sortedEntries) {
    if (entry.mood_score >= 5) { // Consider 5+ as positive mood
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function generateAnalysisRecommendations(analysis: any): string[] {
  const recommendations = [];

  if (analysis.crisisRisk === 'high') {
    recommendations.push('Consider reaching out to a mental health professional');
    recommendations.push('Review your safety plan and coping strategies');
  } else if (analysis.crisisRisk === 'medium') {
    recommendations.push('Focus on self-care and stress management');
    recommendations.push('Consider increasing support system engagement');
  }

  if (analysis.trendDirection === 'declining') {
    recommendations.push('Consider what might be contributing to the decline');
    recommendations.push('Increase use of effective coping strategies');
  } else if (analysis.trendDirection === 'improving') {
    recommendations.push('Great progress! Continue what\'s working well');
    recommendations.push('Document successful strategies for future reference');
  }

  if (analysis.patterns.correlations.exercise > analysis.averageMood) {
    recommendations.push('Exercise appears beneficial - consider increasing physical activity');
  }

  if (analysis.patterns.correlations.social > analysis.averageMood) {
    recommendations.push('Social interaction seems helpful - prioritize social connections');
  }

  return recommendations;
}
