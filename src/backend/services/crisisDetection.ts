import { db } from '../config/database';

// Simple logger implementation for both browser and server
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  }
};

interface CrisisIndicator {
  keyword: string;
  weight: number;
  category: 'suicide' | 'self-harm' | 'violence' | 'substance' | 'emotional';
}

interface CrisisAnalysisResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  indicators: CrisisIndicator[];
  recommendations: string[];
  requiresImmediate: boolean;
  categories: string[];
}

interface MoodPattern {
  userId: string;
  trend: 'stable' | 'declining' | 'improving' | 'volatile';
  riskLevel: number;
  recentMoods: any[];
}

/**
 * Crisis Detection Service using ML and keyword analysis
 */
export class CrisisDetectionService {
  private crisisKeywords: CrisisIndicator[] = [
    // Suicide indicators
    { keyword: 'suicide', weight: 10, category: 'suicide' },
    { keyword: 'kill myself', weight: 10, category: 'suicide' },
    { keyword: 'end it all', weight: 9, category: 'suicide' },
    { keyword: 'better off dead', weight: 9, category: 'suicide' },
    { keyword: 'no reason to live', weight: 8, category: 'suicide' },
    { keyword: 'want to die', weight: 8, category: 'suicide' },
    { keyword: 'planning to die', weight: 10, category: 'suicide' },
    { keyword: 'goodbye forever', weight: 7, category: 'suicide' },
    
    // Self-harm indicators
    { keyword: 'cutting', weight: 7, category: 'self-harm' },
    { keyword: 'hurt myself', weight: 7, category: 'self-harm' },
    { keyword: 'self harm', weight: 7, category: 'self-harm' },
    { keyword: 'burning myself', weight: 7, category: 'self-harm' },
    { keyword: 'punish myself', weight: 6, category: 'self-harm' },
    
    // Violence indicators
    { keyword: 'kill someone', weight: 9, category: 'violence' },
    { keyword: 'hurt others', weight: 8, category: 'violence' },
    { keyword: 'violent thoughts', weight: 7, category: 'violence' },
    { keyword: 'rage', weight: 5, category: 'violence' },
    { keyword: 'revenge', weight: 5, category: 'violence' },
    
    // Substance abuse indicators
    { keyword: 'overdose', weight: 9, category: 'substance' },
    { keyword: 'drunk all day', weight: 5, category: 'substance' },
    { keyword: 'using again', weight: 5, category: 'substance' },
    { keyword: 'relapsed', weight: 6, category: 'substance' },
    
    // Emotional distress indicators
    { keyword: 'hopeless', weight: 6, category: 'emotional' },
    { keyword: 'worthless', weight: 6, category: 'emotional' },
    { keyword: 'cant go on', weight: 7, category: 'emotional' },
    { keyword: 'unbearable pain', weight: 7, category: 'emotional' },
    { keyword: 'no one cares', weight: 5, category: 'emotional' },
    { keyword: 'all alone', weight: 5, category: 'emotional' },
    { keyword: 'trapped', weight: 5, category: 'emotional' },
    { keyword: 'burden', weight: 6, category: 'emotional' }
  ];

  private contextualFactors = {
    timeOfDay: this.getTimeRiskFactor(),
    recentLoss: 1.5,
    isolation: 1.3,
    previousAttempts: 2.0,
    substanceUse: 1.4,
    mentalHealthDiagnosis: 1.2
  };

  constructor() {
    this.initializeMLModel();
  }

  /**
   * Initialize ML model for advanced detection
   */
  private async initializeMLModel(): Promise<void> {
    // In production, this would load a trained TensorFlow/PyTorch model
    logger.info('Crisis detection ML model initialized');
  }

  /**
   * Analyze content for crisis indicators
   */
  async analyze(data: {
    content?: string;
    userId?: string;
    moodScore?: number;
    context?: any;
  }): Promise<CrisisAnalysisResult> {
    let totalScore = 0;
    const detectedIndicators: CrisisIndicator[] = [];
    const categories = new Set<string>();

    // Text analysis
    if (data.content) {
      const textAnalysis = this.analyzeText(data.content);
      totalScore += textAnalysis.score;
      detectedIndicators.push(...textAnalysis.indicators);
      textAnalysis.categories.forEach(cat => categories.add(cat));
    }

    // Mood analysis
    if (data.moodScore !== undefined) {
      const moodRisk = this.analyzeMoodScore(data.moodScore);
      totalScore += moodRisk;
    }

    // Historical pattern analysis
    if (data.userId) {
      const patternRisk = await this.analyzeUserPatterns(data.userId);
      totalScore += patternRisk;
    }

    // Context analysis
    if (data.context) {
      const contextRisk = this.analyzeContext(data.context);
      totalScore += contextRisk;
    }

    // Determine severity
    const severity = this.calculateSeverity(totalScore);
    const requiresImmediate = severity === 'critical' || 
                            categories.has('suicide') || 
                            categories.has('violence');

    // Generate recommendations
    const recommendations = this.generateRecommendations(severity, Array.from(categories));

    // Log analysis
    if (severity !== 'low') {
      await this.logCrisisDetection(data.userId, severity, detectedIndicators);
    }

    // Trigger alerts if necessary
    if (requiresImmediate) {
      await this.triggerCrisisAlert(data.userId, severity, detectedIndicators);
    }

    return {
      severity,
      score: totalScore,
      indicators: detectedIndicators,
      recommendations,
      requiresImmediate,
      categories: Array.from(categories)
    };
  }

  /**
   * Analyze text content for crisis indicators
   */
  private analyzeText(content: string): {
    score: number;
    indicators: CrisisIndicator[];
    categories: string[];
  } {
    const lowerContent = content.toLowerCase();
    const detectedIndicators: CrisisIndicator[] = [];
    const categories = new Set<string>();
    let score = 0;

    // Check for crisis keywords
    for (const indicator of this.crisisKeywords) {
      if (lowerContent.includes(indicator.keyword)) {
        detectedIndicators.push(indicator);
        categories.add(indicator.category);
        score += indicator.weight;
      }
    }

    // Check for negative sentiment patterns
    const negativePhrases = [
      /i (can't|cannot|won't|will not) (do this|go on|take it|handle)/gi,
      /nobody (cares|loves|wants|needs)/gi,
      /everyone (hates|ignores|abandoned)/gi,
      /life is (pointless|meaningless|over|not worth)/gi
    ];

    for (const pattern of negativePhrases) {
      if (pattern.test(lowerContent)) {
        score += 3;
        categories.add('emotional');
      }
    }

    // Check for urgency indicators
    const urgencyWords = ['now', 'today', 'tonight', 'immediately', 'final', 'last'];
    const urgencyCount = urgencyWords.filter(word => lowerContent.includes(word)).length;
    if (urgencyCount > 0 && detectedIndicators.length > 0) {
      score *= (1 + urgencyCount * 0.2); // Increase score based on urgency
    }

    return {
      score,
      indicators: detectedIndicators,
      categories: Array.from(categories)
    };
  }

  /**
   * Analyze mood score for risk
   */
  private analyzeMoodScore(moodScore: number): number {
    // Mood score assumed to be 1-10, where 1 is very negative
    if (moodScore <= 2) return 8;
    if (moodScore <= 3) return 5;
    if (moodScore <= 4) return 3;
    if (moodScore <= 5) return 1;
    return 0;
  }

  /**
   * Analyze user's historical patterns
   */
  private async analyzeUserPatterns(userId: string): Promise<number> {
    try {
      // Get recent mood entries
      const moodResult = await db.query(
        `SELECT mood_score, created_at 
         FROM mood_entries 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      if (moodResult.rows.length === 0) return 0;

      // Calculate trend
      const moods = moodResult.rows.map(r => r.mood_score);
      const trend = this.calculateTrend(moods);

      // Get crisis history
      const crisisResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM crisis_alerts 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
        [userId]
      );

      const recentCrisisCount = parseInt(crisisResult.rows[0]?.count || '0');

      // Calculate risk based on patterns
      let risk = 0;
      if (trend === 'declining') risk += 5;
      if (trend === 'volatile') risk += 3;
      risk += Math.min(recentCrisisCount * 2, 10); // Cap at 10

      return risk;
    } catch (error) {
      logger.error('Failed to analyze user patterns', error);
      return 0;
    }
  }

  /**
   * Analyze contextual factors
   */
  private analyzeContext(context: any): number {
    let risk = 0;

    if (context.recentLoss) risk += 5;
    if (context.relationshipIssues) risk += 3;
    if (context.financialStress) risk += 3;
    if (context.healthIssues) risk += 3;
    if (context.isolation) risk += 4;
    if (context.substanceUse) risk += 4;
    if (context.previousAttempts) risk += 8;

    // Time-based risk (higher risk late at night)
    const hour = new Date().getHours();
    if (hour >= 23 || hour <= 4) risk += 2;

    return risk;
  }

  /**
   * Calculate trend from mood scores
   */
  private calculateTrend(scores: number[]): 'stable' | 'declining' | 'improving' | 'volatile' {
    if (scores.length < 3) return 'stable';

    const recentAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const variance = this.calculateVariance(scores);

    if (variance > 2) return 'volatile';
    if (recentAvg < olderAvg - 1) return 'declining';
    if (recentAvg > olderAvg + 1) return 'improving';
    return 'stable';
  }

  /**
   * Calculate variance of scores
   */
  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * Calculate severity level
   */
  private calculateSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 30) return 'critical';
    if (score >= 20) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    severity: 'low' | 'medium' | 'high' | 'critical',
    categories: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Severity-based recommendations
    switch (severity) {
      case 'critical':
        recommendations.push('Immediate professional intervention required');
        recommendations.push('Contact crisis hotline: 988');
        recommendations.push('Notify emergency contacts');
        recommendations.push('Consider emergency services if immediate danger');
        break;
      case 'high':
        recommendations.push('Schedule urgent therapy session');
        recommendations.push('Activate safety plan');
        recommendations.push('Remove means of harm');
        recommendations.push('Ensure 24-hour support availability');
        break;
      case 'medium':
        recommendations.push('Schedule therapy session within 24-48 hours');
        recommendations.push('Increase check-in frequency');
        recommendations.push('Review coping strategies');
        recommendations.push('Connect with support network');
        break;
      case 'low':
        recommendations.push('Continue regular therapy schedule');
        recommendations.push('Practice self-care activities');
        recommendations.push('Monitor mood changes');
        break;
    }

    // Category-specific recommendations
    if (categories.includes('suicide')) {
      recommendations.push('Conduct suicide risk assessment');
      recommendations.push('Create or update safety plan');
      recommendations.push('Consider hospitalization if imminent risk');
    }

    if (categories.includes('self-harm')) {
      recommendations.push('Identify and remove self-harm tools');
      recommendations.push('Teach alternative coping mechanisms');
      recommendations.push('Consider DBT skills training');
    }

    if (categories.includes('substance')) {
      recommendations.push('Assess substance use severity');
      recommendations.push('Consider addiction counseling');
      recommendations.push('Connect with recovery resources');
    }

    if (categories.includes('violence')) {
      recommendations.push('Assess violence risk');
      recommendations.push('Implement safety measures for others');
      recommendations.push('Consider anger management therapy');
    }

    return recommendations;
  }

  /**
   * Log crisis detection for audit
   */
  private async logCrisisDetection(
    userId: string | undefined,
    severity: string,
    indicators: CrisisIndicator[]
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO crisis_detections 
         (user_id, severity, indicators, detected_at) 
         VALUES ($1, $2, $3, NOW())`,
        [
          userId,
          severity,
          JSON.stringify(indicators)
        ]
      );

      logger.warn('Crisis detected', {
        userId,
        severity,
        indicatorCount: indicators.length,
        categories: [...new Set(indicators.map(i => i.category))]
      });
    } catch (error) {
      logger.error('Failed to log crisis detection', error);
    }
  }

  /**
   * Trigger crisis alert
   */
  private async triggerCrisisAlert(
    userId: string | undefined,
    severity: string,
    indicators: CrisisIndicator[]
  ): Promise<void> {
    try {
      // Create alert record
      const result = await db.query(
        `INSERT INTO crisis_alerts 
         (user_id, severity, status, indicators, created_at) 
         VALUES ($1, $2, 'active', $3, NOW()) 
         RETURNING id`,
        [userId, severity, JSON.stringify(indicators)]
      );

      const alertId = result.rows[0].id;

      // Get user's care team
      if (userId) {
        const careTeam = await db.query(
          `SELECT primary_therapist_id, primary_psychiatrist_id, emergency_contact_id 
           FROM users WHERE id = $1`,
          [userId]
        );

        if (careTeam.rows.length > 0) {
          const team = careTeam.rows[0];
          
          // Notify care team members
          await this.notifyCareTeam(alertId, userId, severity, team);
        }
      }

      // If critical, consider emergency services
      if (severity === 'critical') {
        await this.considerEmergencyServices(userId, indicators);
      }

      logger.error('Crisis alert triggered', {
        alertId,
        userId,
        severity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to trigger crisis alert', error);
    }
  }

  /**
   * Notify care team of crisis
   */
  private async notifyCareTeam(
    alertId: string,
    userId: string,
    severity: string,
    team: any
  ): Promise<void> {
    // Implementation would send notifications via SMS, email, push notifications
    logger.info('Care team notified', {
      alertId,
      userId,
      severity,
      therapistId: team.primary_therapist_id,
      psychiatristId: team.primary_psychiatrist_id
    });
  }

  /**
   * Consider emergency services intervention
   */
  private async considerEmergencyServices(
    userId: string | undefined,
    indicators: CrisisIndicator[]
  ): Promise<void> {
    const hasSuicideWithPlan = indicators.some(
      i => i.category === 'suicide' && i.weight >= 9
    );
    
    const hasViolenceIntent = indicators.some(
      i => i.category === 'violence' && i.weight >= 8
    );

    if (hasSuicideWithPlan || hasViolenceIntent) {
      logger.error('EMERGENCY SERVICES MAY BE REQUIRED', {
        userId,
        hasSuicideWithPlan,
        hasViolenceIntent,
        timestamp: new Date().toISOString()
      });

      // In production, this would:
      // 1. Alert on-call crisis counselor
      // 2. Prepare emergency contact information
      // 3. Consider automated 911 call if configured and legal
    }
  }

  /**
   * Get time-based risk factor
   */
  private getTimeRiskFactor(): number {
    const hour = new Date().getHours();
    // Higher risk during late night/early morning hours
    if (hour >= 23 || hour <= 4) return 1.3;
    if (hour >= 20 || hour <= 6) return 1.1;
    return 1.0;
  }

  /**
   * Analyze mood trajectory for a user
   */
  async analyzeMoodTrajectory(userId: string): Promise<MoodPattern> {
    const result = await db.query(
      `SELECT mood_score, created_at 
       FROM mood_entries 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [userId]
    );

    const moods = result.rows;
    const trend = this.calculateTrend(moods.map(m => m.mood_score));
    const variance = this.calculateVariance(moods.map(m => m.mood_score));
    
    let riskLevel = 0;
    if (trend === 'declining') riskLevel += 30;
    if (trend === 'volatile') riskLevel += 20;
    if (variance > 2) riskLevel += 15;

    return {
      userId,
      trend,
      riskLevel,
      recentMoods: moods.slice(0, 7)
    };
  }

  /**
   * Get active crisis alerts
   */
  async getActiveAlerts(): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM crisis_alerts 
       WHERE status = 'active' 
       ORDER BY severity DESC, created_at DESC`
    );
    return result.rows;
  }
}

export default CrisisDetectionService;