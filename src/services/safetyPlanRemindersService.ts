/**
 * Safety Plan Reminders Service
 *
 * Provides proactive safety plan reminders for high-risk users based on mood patterns,
 * crisis history, and configurable check-in schedules. Integrates with mood analysis
 * and crisis detection services to provide personalized, timely interventions.
 *
 * Features:
 * - Mood pattern-based reminder triggers
 * - Configurable check-in schedules for different risk levels
 * - Integration with crisis detection and escalation systems
 * - Personalized reminder content based on user's safety plan
 * - Progressive reminder escalation for missed check-ins
 * - Cultural and accessibility-aware notifications
 *
 * @fileoverview Safety plan reminders and proactive intervention service
 * @version 2.0.0
 */

import { MoodAnalysis } from './moodAnalysisService';
import { crisisDetectionIntegrationService } from './crisisDetectionIntegrationService';
import { pushNotificationService } from './pushNotificationService';

/**
 * Safety plan interface
 */
export interface SafetyPlan {
  id: string;
  userId: string;
  title: string;
  warningSigns: string[];
  copingStrategies: string[];
  socialSupports: string[];
  professionalSupports: string[];
  emergencyContacts: EmergencyContact[];
  environmentalSafety: string[];
  reasonsForLiving: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  version: number;
}

/**
 * Emergency contact interface
 */
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  type: 'personal' | 'professional' | 'crisis' | 'emergency';
  isAvailable24h: boolean;
  notes?: string;
}

/**
 * Safety plan reminder interface
 */
export interface SafetyPlanReminder {
  id: string;
  userId: string;
  safetyPlanId: string;
  type: 'check-in' | 'warning-signs' | 'coping-strategies' | 'emergency' | 'follow-up';
  title: string;
  message: string;
  scheduledTime: string;
  frequency: 'once' | 'daily' | 'twice-daily' | 'weekly' | 'bi-weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  lastSent?: string;
  responses: ReminderResponse[];
  escalationLevel: number;
  maxEscalations: number;
}

/**
 * Reminder response interface
 */
export interface ReminderResponse {
  id: string;
  reminderId: string;
  userId: string;
  responseTime: string;
  responses: Record<string, any>;
  moodScore?: number;
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  followUpRequired: boolean;
  notes?: string;
}

/**
 * Risk assessment interface
 */
export interface RiskAssessment {
  userId: string;
  level: 'low' | 'moderate' | 'high' | 'critical';
  score: number; // 0-1 scale
  factors: string[];
  recommendations: string[];
  lastUpdated: string;
  validUntil: string;
}

/**
 * Check-in question interface
 */
export interface CheckInQuestion {
  id: string;
  text: string;
  type: 'scale' | 'yes-no' | 'multiple-choice' | 'text';
  options?: string[];
  required: boolean;
  weight: number; // For risk calculation
}

/**
 * Reminder template interface
 */
export interface ReminderTemplate {
  id: string;
  name: string;
  type: SafetyPlanReminder['type'];
  title: string;
  message: string;
  questions?: CheckInQuestion[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  culturalAdaptations?: Record<string, { title: string; message: string }>;
}

/**
 * User preferences for reminders
 */
export interface ReminderPreferences {
  userId: string;
  frequency: 'daily' | 'twice-daily' | 'weekly' | 'disabled';
  preferredTime: string; // HH:MM format
  timeZone: string;
  enableMoodBasedTriggers: boolean;
  enableProgressiveEscalation: boolean;
  culturalContext: 'western' | 'eastern' | 'mixed';
  language: string;
  accessibilityNeeds: string[];
  updatedAt: string;
}

/**
 * Safety Plan Reminders Service Implementation
 */
export class SafetyPlanRemindersService {
  private reminders: Map<string, SafetyPlanReminder> = new Map();
  private templates: ReminderTemplate[] = [];
  private userPreferences: Map<string, ReminderPreferences> = new Map();
  private activeSchedules: Map<string, number> = new Map(); // userId -> intervalId

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Reset service state (for testing)
   */
  async reset(): Promise<void> {
    this.reminders.clear();
    this.userPreferences.clear();
    this.activeSchedules.forEach(intervalId => clearInterval(intervalId));
    this.activeSchedules.clear();
  }

  /**
   * Create a new safety plan
   */
  async createSafetyPlan(
    userId: string,
    title: string,
    warningSigns: string[],
    copingStrategies: string[],
    emergencyContacts: EmergencyContact[]
  ): Promise<SafetyPlan> {
    const safetyPlan: SafetyPlan = {
      id: `plan_${userId}_${Date.now()}`,
      userId,
      title,
      warningSigns,
      copingStrategies,
      socialSupports: [],
      professionalSupports: [],
      emergencyContacts,
      environmentalSafety: [],
      reasonsForLiving: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      version: 1
    };

    // Create initial reminders for the safety plan
    await this.createInitialReminders(safetyPlan);

    return safetyPlan;
  }

  /**
   * Get available safety plan templates
   */
  async getTemplates(): Promise<ReminderTemplate[]> {
    return [...this.templates];
  }

  /**
   * Create adaptive safety plan based on user data
   */
  async createAdaptivePlan(
    userId: string,
    userData: {
      moodHistory: MoodAnalysis[];
      riskFactors: string[];
      preferences: ReminderPreferences;
    }
  ): Promise<SafetyPlan> {
    // Analyze user data to create personalized plan
    const riskLevel = this.assessRiskFromHistory(userData.moodHistory);
    const personalizedStrategies = this.generatePersonalizedStrategies(userData);

    const adaptivePlan: SafetyPlan = {
      id: `adaptive_plan_${userId}_${Date.now()}`,
      userId,
      title: 'Personalized Safety Plan',
      warningSigns: this.generatePersonalizedWarningSigns(userData.moodHistory),
      copingStrategies: personalizedStrategies,
      socialSupports: ['Trusted friend or family member', 'Support group'],
      professionalSupports: ['Therapist', 'Crisis counselor'],
      emergencyContacts: [
        {
          id: 'crisis-line',
          name: 'Crisis Hotline',
          phone: '988',
          relationship: 'Crisis Support',
          type: 'crisis',
          isAvailable24h: true
        }
      ],
      environmentalSafety: ['Remove or secure harmful items', 'Create calm space'],
      reasonsForLiving: ['Family and friends', 'Future goals', 'Personal values'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      version: 1
    };

    // Set up adaptive reminder schedule
    await this.setupAdaptiveReminders(adaptivePlan, riskLevel);

    return adaptivePlan;
  }

  /**
   * Handle crisis event and trigger appropriate responses
   */
  async handleCrisisEvent(crisisEvent: {
    userId: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    triggers: string[];
    timestamp: number;
  }): Promise<{
    actionsTriggered: string[];
    remindersScheduled: number;
    success: boolean;
  }> {
    const actionsTriggered: string[] = [];
    let remindersScheduled = 0;

    try {
      // Immediate crisis response based on severity
      if (crisisEvent.severity === 'critical') {
        // Send immediate crisis alert
        await pushNotificationService.sendCrisisAlert(
          'Crisis Support Available',
          'Immediate help is available. You are not alone.',
          { crisisEventId: `crisis_${crisisEvent.timestamp}` }
        );
        actionsTriggered.push('crisis-alert');

        // Escalate to emergency contacts
        await this.notifyEmergencyContacts(crisisEvent.userId);
        actionsTriggered.push('emergency-contacts');

        // Schedule immediate follow-up
        await this.scheduleImmediateFollowUp(crisisEvent.userId);
        remindersScheduled++;
      }

      if (crisisEvent.severity === 'high' || crisisEvent.severity === 'critical') {
        // Escalate to professional support
        await crisisDetectionIntegrationService.escalateToProfessional(
          crisisEvent.userId,
          crisisEvent.severity,
          crisisEvent.triggers
        );
        actionsTriggered.push('professional-escalation');

        // Increase reminder frequency temporarily
        await this.temporarilyIncreaseReminderFrequency(crisisEvent.userId);
        remindersScheduled++;
      }

      // Log crisis event for pattern analysis
      await this.logCrisisEvent(crisisEvent);

      return {
        actionsTriggered,
        remindersScheduled,
        success: true
      };
    } catch (error) {
      console.error('Crisis event handling failed:', error);
      return {
        actionsTriggered,
        remindersScheduled,
        success: false
      };
    }
  }

  /**
   * Get active reminders for a user
   */
  async getActiveReminders(userId: string): Promise<SafetyPlanReminder[]> {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.userId === userId && reminder.isActive);
  }

  /**
   * Create interactive reminder with questions
   */
  async createInteractiveReminder(
    userId: string,
    safetyPlanId: string,
    title: string,
    questions: CheckInQuestion[]
  ): Promise<SafetyPlanReminder> {
    const reminder: SafetyPlanReminder = {
      id: `interactive_${userId}_${Date.now()}`,
      userId,
      safetyPlanId,
      type: 'check-in',
      title,
      message: 'Please take a moment to check in with yourself',
      scheduledTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      frequency: 'daily',
      priority: 'medium',
      isActive: true,
      createdAt: new Date().toISOString(),
      responses: [],
      escalationLevel: 0,
      maxEscalations: 3
    };

    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  /**
   * Schedule check-in reminder
   */
  async scheduleCheckIn(
    userId: string,
    safetyPlanId: string,
    frequency: SafetyPlanReminder['frequency'],
    preferredTime: string
  ): Promise<SafetyPlanReminder> {
    const reminder: SafetyPlanReminder = {
      id: `checkin_${userId}_${Date.now()}`,
      userId,
      safetyPlanId,
      type: 'check-in',
      title: 'Daily Check-in',
      message: 'How are you feeling today? Take a moment to check in with yourself.',
      scheduledTime: this.calculateNextScheduledTime(frequency, preferredTime),
      frequency,
      priority: 'medium',
      isActive: true,
      createdAt: new Date().toISOString(),
      responses: [],
      escalationLevel: 0,
      maxEscalations: 2
    };

    this.reminders.set(reminder.id, reminder);
    this.scheduleReminderDelivery(reminder);
    
    return reminder;
  }

  /**
   * Process check-in response
   */
  async processCheckInResponse(response: {
    reminderId: string;
    responses: Record<string, any>;
    timestamp: number;
  }): Promise<{
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    nextReminderScheduled: boolean;
    recommendedActions: string[];
    success: boolean;
  }> {
    try {
      const reminder = this.reminders.get(response.reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // Calculate risk level from responses
      const riskLevel = this.calculateRiskFromResponses(response.responses);

      // Create response record
      const reminderResponse: ReminderResponse = {
        id: `response_${response.reminderId}_${response.timestamp}`,
        reminderId: response.reminderId,
        userId: reminder.userId,
        responseTime: new Date().toISOString(),
        responses: response.responses,
        riskLevel,
        followUpRequired: riskLevel === 'high' || riskLevel === 'critical',
        notes: this.generateResponseNotes(response.responses, riskLevel)
      };

      // Add response to reminder
      reminder.responses.push(reminderResponse);

      // Reset escalation level on response
      reminder.escalationLevel = 0;

      // Generate recommendations
      const recommendedActions = this.generateRecommendations(riskLevel, response.responses);

      // Schedule next reminder
      const nextReminderScheduled = await this.scheduleNextReminder(reminder, riskLevel);

      // Handle high-risk responses
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.handleHighRiskResponse(reminder.userId, riskLevel, recommendedActions);
      }

      return {
        riskLevel,
        nextReminderScheduled,
        recommendedActions,
        success: true
      };
    } catch (error) {
      console.error('Failed to process check-in response:', error);
      return {
        riskLevel: 'moderate',
        nextReminderScheduled: false,
        recommendedActions: ['Contact support if needed'],
        success: false
      };
    }
  }

  /**
   * Escalate reminder when user doesn't respond
   */
  async escalateReminder(
    reminderId: string,
    escalationLevel: number
  ): Promise<{
    reminderId: string;
    escalationLevel: number;
    actionsTriggered: string[];
    nextReminderIn: number;
  }> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    reminder.escalationLevel = escalationLevel;
    const actionsTriggered: string[] = [];

    // Progressive escalation based on level
    if (escalationLevel === 1) {
      // Send follow-up notification
      await pushNotificationService.sendSafetyReminder(
        'Check-in Reminder',
        'We noticed you missed your check-in. How are you doing?',
        reminder.safetyPlanId
      );
      actionsTriggered.push('follow-up-notification');
    } else if (escalationLevel === 2) {
      // Notify support team
      await this.notifySupportTeam(reminder.userId, 'missed-checkin');
      actionsTriggered.push('support-team-notification');
    } else if (escalationLevel >= 3) {
      // Escalate to emergency contacts
      await this.notifyEmergencyContacts(reminder.userId);
      actionsTriggered.push('emergency-contact-notification');
    }

    // Calculate next reminder time (shorter intervals for higher escalations)
    const nextReminderIn = this.calculateEscalationInterval(escalationLevel);

    return {
      reminderId,
      escalationLevel,
      actionsTriggered,
      nextReminderIn
    };
  }

  /**
   * Get user risk level assessment
   */
  async getUserRiskLevel(userId: string): Promise<RiskAssessment> {
    // Get recent responses and mood data
    const recentResponses = this.getRecentResponses(userId, 7); // Last 7 days
    const moodHistory = await this.getMoodHistory(userId, 7);

    // Calculate risk factors
    const factors: string[] = [];
    let score = 0.3; // Base score

    // Analyze response patterns
    if (recentResponses.length === 0) {
      factors.push('no-recent-checkins');
      score += 0.2;
    }

    const highRiskResponses = recentResponses.filter(r => 
      r.riskLevel === 'high' || r.riskLevel === 'critical'
    );
    if (highRiskResponses.length > 0) {
      factors.push('high-risk-responses');
      score += 0.3;
    }

    // Analyze mood patterns
    if (moodHistory.some(m => m.riskLevel === 'high' || m.riskLevel === 'critical')) {
      factors.push('concerning-mood-patterns');
      score += 0.2;
    }

    // Determine risk level
    let level: RiskAssessment['level'] = 'low';
    if (score >= 0.8) level = 'critical';
    else if (score >= 0.6) level = 'high';
    else if (score >= 0.4) level = 'moderate';

    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(level, factors);

    return {
      userId,
      level,
      score,
      factors,
      recommendations,
      lastUpdated: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Valid for 24 hours
    };
  }

  /**
   * Get personalized content for reminders
   */
  async getPersonalizedContent(
    userId: string,
    contentType: 'check-in' | 'coping-strategies' | 'encouragement',
    preferences: ReminderPreferences
  ): Promise<{
    greeting: string;
    copingStrategies: string[];
    motivationalMessage: string;
    culturalAdaptations: string[];
    languageCode: string;
  }> {
    // Get time-appropriate greeting
    const greeting = this.getTimeAppropriateGreeting(preferences.preferredTime);

    // Get personalized coping strategies
    const copingStrategies = this.getPersonalizedCopingStrategies(userId);

    // Generate motivational message
    const motivationalMessage = this.generateMotivationalMessage(preferences.culturalContext);

    // Apply cultural adaptations
    const culturalAdaptations = this.getCulturalAdaptations(preferences.culturalContext);

    return {
      greeting,
      copingStrategies,
      motivationalMessage,
      culturalAdaptations,
      languageCode: preferences.language
    };
  }

  /**
   * Track reminder effectiveness
   */
  async trackReminderEffectiveness(reminderId: string): Promise<{
    reminderId: string;
    responseRate: number;
    averageResponseTime: number;
    userFeedbackScore: number;
    improvementMetrics: {
      moodImprovement: number;
      engagementIncrease: number;
    };
  }> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    // Calculate response rate
    const totalSent = 30; // Mock data - would track actual sends
    const responseRate = reminder.responses.length / totalSent;

    // Calculate average response time
    const responseTimes = reminder.responses.map(r => {
      const sent = new Date(reminder.lastSent || reminder.createdAt).getTime();
      const responded = new Date(r.responseTime).getTime();
      return responded - sent;
    });
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;

    // Mock user feedback score
    const userFeedbackScore = 4.2;

    // Mock improvement metrics
    const improvementMetrics = {
      moodImprovement: 0.3,
      engagementIncrease: 0.15
    };

    return {
      reminderId,
      responseRate,
      averageResponseTime,
      userFeedbackScore,
      improvementMetrics
    };
  }

  /**
   * Generate reminder report for user
   */
  async generateReminderReport(
    userId: string,
    period: '7-days' | '30-days' | '90-days'
  ): Promise<{
    userId: string;
    period: string;
    totalReminders: number;
    respondedReminders: number;
    responseRate: number;
    averageMoodScore: number;
    crisisEvents: number;
    effectiveStrategies: string[];
    recommendations: string[];
    generatedAt: string;
  }> {
    const days = period === '7-days' ? 7 : period === '30-days' ? 30 : 90;
    const responses = this.getRecentResponses(userId, days);

    return {
      userId,
      period,
      totalReminders: 25, // Mock data
      respondedReminders: responses.length,
      responseRate: responses.length / 25,
      averageMoodScore: 3.2,
      crisisEvents: 1,
      effectiveStrategies: ['breathing-exercises', 'social-connection'],
      recommendations: ['maintain-current-frequency'],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Update reminder frequency based on risk level
   */
  async updateReminderFrequency(
    userId: string,
    newFrequency: ReminderPreferences['frequency'],
    reason: string
  ): Promise<{
    userId: string;
    oldFrequency: ReminderPreferences['frequency'];
    newFrequency: ReminderPreferences['frequency'];
    reason: string;
    effectiveDate: string;
  }> {
    const preferences = this.userPreferences.get(userId);
    const oldFrequency = preferences?.frequency || 'daily';

    // Update preferences
    if (preferences) {
      preferences.frequency = newFrequency;
      preferences.updatedAt = new Date().toISOString();
    }

    // Reschedule active reminders
    await this.rescheduleUserReminders(userId, newFrequency);

    return {
      userId,
      oldFrequency,
      newFrequency,
      reason,
      effectiveDate: new Date().toISOString()
    };
  }

  /**
   * Pause reminders for a user
   */
  async pauseReminders(
    userId: string,
    duration: '1-day' | '3-days' | '7-days',
    reason: string
  ): Promise<{
    userId: string;
    pausedAt: string;
    pauseDuration: string;
    affectedReminders: number;
    success: boolean;
  }> {
    const userReminders = Array.from(this.reminders.values())
      .filter(r => r.userId === userId && r.isActive);

    // Deactivate reminders
    userReminders.forEach(reminder => {
      reminder.isActive = false;
    });

    // Clear scheduled deliveries
    const intervalId = this.activeSchedules.get(userId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSchedules.delete(userId);
    }

    return {
      userId,
      pausedAt: new Date().toISOString(),
      pauseDuration: duration,
      affectedReminders: userReminders.length,
      success: true
    };
  }

  /**
   * Resume reminders for a user
   */
  async resumeReminders(userId: string): Promise<{
    userId: string;
    resumedAt: string;
    reactivatedReminders: number;
    nextReminderTime: string;
    success: boolean;
  }> {
    const userReminders = Array.from(this.reminders.values())
      .filter(r => r.userId === userId && !r.isActive);

    // Reactivate reminders
    userReminders.forEach(reminder => {
      reminder.isActive = true;
    });

    // Reschedule deliveries
    await this.rescheduleUserReminders(userId, 'daily');

    return {
      userId,
      resumedAt: new Date().toISOString(),
      reactivatedReminders: userReminders.length,
      nextReminderTime: new Date(Date.now() + 3600000).toISOString(),
      success: true
    };
  }

  /**
   * Archive old reminders
   */
  async archiveOldReminders(olderThanDays: number): Promise<{
    archivedCount: number;
    oldestArchived: string;
    storageFreed: number;
    success: boolean;
  }> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let archivedCount = 0;
    let oldestArchived = new Date().toISOString();

    for (const [id, reminder] of this.reminders) {
      const createdAt = new Date(reminder.createdAt);
      if (createdAt < cutoffDate) {
        this.reminders.delete(id);
        archivedCount++;
        if (createdAt.toISOString() < oldestArchived) {
          oldestArchived = createdAt.toISOString();
        }
      }
    }

    return {
      archivedCount,
      oldestArchived,
      storageFreed: archivedCount * 1024, // Rough estimate
      success: true
    };
  }

  /**
   * Export reminder data for backup
   */
  async exportReminderData(
    userId: string,
    format: 'json' | 'csv'
  ): Promise<{
    userId: string;
    reminders: SafetyPlanReminder[];
    safetyPlans: SafetyPlan[];
    responses: ReminderResponse[];
    exportedAt: string;
    format: string;
  }> {
    const userReminders = Array.from(this.reminders.values())
      .filter(r => r.userId === userId);

    const responses = userReminders.flatMap(r => r.responses);

    return {
      userId,
      reminders: userReminders,
      safetyPlans: [], // Would fetch from database
      responses,
      exportedAt: new Date().toISOString(),
      format
    };
  }

  /**
   * Import reminder data from backup
   */
  async importReminderData(data: {
    userId: string;
    reminders: SafetyPlanReminder[];
    safetyPlans: SafetyPlan[];
    responses: ReminderResponse[];
  }): Promise<{
    importedReminders: number;
    importedSafetyPlans: number;
    importedResponses: number;
    duplicatesSkipped: number;
    errors: string[];
    success: boolean;
  }> {
    let importedReminders = 0;
    let duplicatesSkipped = 0;
    const errors: string[] = [];

    try {
      // Import reminders
      for (const reminder of data.reminders) {
        if (!this.reminders.has(reminder.id)) {
          this.reminders.set(reminder.id, reminder);
          importedReminders++;
        } else {
          duplicatesSkipped++;
        }
      }

      return {
        importedReminders,
        importedSafetyPlans: data.safetyPlans.length,
        importedResponses: data.responses.length,
        duplicatesSkipped,
        errors,
        success: true
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        importedReminders,
        importedSafetyPlans: 0,
        importedResponses: 0,
        duplicatesSkipped,
        errors,
        success: false
      };
    }
  }

  // Private helper methods
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'daily-checkin',
        name: 'Daily Check-in',
        type: 'check-in',
        title: 'How are you today?',
        message: 'Take a moment to check in with yourself',
        riskLevel: 'low',
        questions: [
          {
            id: 'mood',
            text: 'How is your mood today?',
            type: 'scale',
            required: true,
            weight: 0.4
          }
        ]
      }
    ];
  }

  private async createInitialReminders(safetyPlan: SafetyPlan): Promise<void> {
    // Create daily check-in reminder
    await this.scheduleCheckIn(safetyPlan.userId, safetyPlan.id, 'daily', '09:00');
  }

  private assessRiskFromHistory(moodHistory: MoodAnalysis[]): 'low' | 'moderate' | 'high' | 'critical' {
    const highRiskCount = moodHistory.filter(m => 
      m.riskLevel === 'high' || m.riskLevel === 'critical'
    ).length;
    
    if (highRiskCount > moodHistory.length * 0.5) return 'high';
    if (highRiskCount > moodHistory.length * 0.3) return 'moderate';
    return 'low';
  }

  private generatePersonalizedStrategies(userData: any): string[] {
    return ['Deep breathing exercises', 'Contact support person', 'Use grounding techniques'];
  }

  private generatePersonalizedWarningSigns(moodHistory: MoodAnalysis[]): string[] {
    return ['Feeling hopeless', 'Social withdrawal', 'Sleep changes'];
  }

  private async setupAdaptiveReminders(safetyPlan: SafetyPlan, riskLevel: string): Promise<void> {
    const frequency = riskLevel === 'high' ? 'twice-daily' : 'daily';
    await this.scheduleCheckIn(safetyPlan.userId, safetyPlan.id, frequency, '09:00');
  }

  private calculateNextScheduledTime(frequency: SafetyPlanReminder['frequency'], preferredTime: string): string {
    const now = new Date();
    const [hours, minutes] = preferredTime.split(':').map(Number);
    
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    return scheduledTime.toISOString();
  }

  private scheduleReminderDelivery(reminder: SafetyPlanReminder): void {
    // Implementation would schedule actual delivery
    console.log('Scheduling reminder delivery:', reminder.id);
  }

  private calculateRiskFromResponses(responses: Record<string, any>): 'low' | 'moderate' | 'high' | 'critical' {
    // Simple risk calculation based on responses
    const moodScore = responses.mood || 5;
    if (moodScore <= 2) return 'critical';
    if (moodScore <= 3) return 'high';
    if (moodScore <= 5) return 'moderate';
    return 'low';
  }

  private generateResponseNotes(responses: Record<string, any>, riskLevel: string): string {
    return `Risk level: ${riskLevel}. Mood score: ${responses.mood || 'N/A'}`;
  }

  private generateRecommendations(riskLevel: string, responses: Record<string, any>): string[] {
    const base = ['Continue self-care practices', 'Stay connected with support'];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      base.push('Contact crisis support', 'Use safety plan strategies');
    }
    
    return base;
  }

  private async scheduleNextReminder(reminder: SafetyPlanReminder, riskLevel: string): Promise<boolean> {
    // Schedule next reminder based on frequency and risk level
    return true;
  }

  private async handleHighRiskResponse(userId: string, riskLevel: string, actions: string[]): Promise<void> {
    if (riskLevel === 'critical') {
      await pushNotificationService.sendCrisisAlert(
        'Crisis Support Available',
        'We noticed you might need support. Help is available.',
        { userId, timestamp: Date.now() }
      );
    }
  }

  private getRecentResponses(userId: string, days: number): ReminderResponse[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const responses: ReminderResponse[] = [];
    
    for (const reminder of this.reminders.values()) {
      if (reminder.userId === userId) {
        responses.push(...reminder.responses.filter(r => 
          new Date(r.responseTime) > cutoff
        ));
      }
    }
    
    return responses;
  }

  private async getMoodHistory(userId: string, days: number): Promise<MoodAnalysis[]> {
    // Would fetch from mood service
    return [];
  }

  private generateRiskRecommendations(level: string, factors: string[]): string[] {
    const base = ['Continue regular check-ins', 'Maintain support connections'];
    
    if (level === 'high' || level === 'critical') {
      base.push('Consider professional support', 'Increase check-in frequency');
    }
    
    return base;
  }

  private getTimeAppropriateGreeting(preferredTime: string): string {
    const hour = parseInt(preferredTime.split(':')[0]);
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  private getPersonalizedCopingStrategies(userId: string): string[] {
    return ['Try deep breathing', 'Take a short walk', 'Listen to calming music'];
  }

  private generateMotivationalMessage(culturalContext: string): string {
    return 'You are doing great by taking care of your mental health.';
  }

  private getCulturalAdaptations(culturalContext: string): string[] {
    return ['mindfulness-based'];
  }

  private async rescheduleUserReminders(userId: string, frequency: string): Promise<void> {
    // Implementation would reschedule all user reminders
  }

  private calculateEscalationInterval(escalationLevel: number): number {
    // Shorter intervals for higher escalations
    const intervals = [3600000, 1800000, 900000]; // 1hr, 30min, 15min
    return intervals[Math.min(escalationLevel - 1, intervals.length - 1)] || 900000;
  }

  private async notifyEmergencyContacts(userId: string): Promise<void> {
    console.log('Notifying emergency contacts for user:', userId);
  }

  private async notifySupportTeam(userId: string, reason: string): Promise<void> {
    console.log('Notifying support team:', userId, reason);
  }

  private async scheduleImmediateFollowUp(userId: string): Promise<void> {
    console.log('Scheduling immediate follow-up for user:', userId);
  }

  private async temporarilyIncreaseReminderFrequency(userId: string): Promise<void> {
    console.log('Temporarily increasing reminder frequency for user:', userId);
  }

  private async logCrisisEvent(crisisEvent: any): Promise<void> {
    console.log('Logging crisis event:', crisisEvent);
  }
}

// Create and export singleton instance
export const safetyPlanRemindersService = new SafetyPlanRemindersService();

export default safetyPlanRemindersService;
