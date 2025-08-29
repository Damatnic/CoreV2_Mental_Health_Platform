/**
 * Comprehensive Symptom Tracking Service
 * Provides symptom logging, pattern recognition, and healthcare provider export functionality
 */

import { format, startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns';

// Types and Interfaces
export interface Symptom {
  id: string;
  userId: string;
  timestamp: Date;
  category: SymptomCategory;
  type: SymptomType;
  name: string;
  severity: number; // 0-10 scale
  duration?: number; // in minutes
  triggers?: Trigger[];
  medications?: MedicationLog[];
  notes?: string;
  context?: SymptomContext;
  location?: string; // body location for physical symptoms
}

export enum SymptomCategory {
  ANXIETY = 'anxiety',
  DEPRESSION = 'depression',
  ADHD = 'adhd',
  PTSD = 'ptsd',
  BIPOLAR = 'bipolar',
  OCD = 'ocd',
  EATING_DISORDER = 'eating_disorder',
  SUBSTANCE_USE = 'substance_use',
  SLEEP_DISORDER = 'sleep_disorder',
  GENERAL = 'general'
}

export enum SymptomType {
  PHYSICAL = 'physical',
  EMOTIONAL = 'emotional',
  BEHAVIORAL = 'behavioral',
  COGNITIVE = 'cognitive'
}

export interface Trigger {
  id: string;
  name: string;
  category: TriggerCategory;
  intensity?: number; // 0-10 scale
}

export enum TriggerCategory {
  ENVIRONMENTAL = 'environmental',
  SOCIAL = 'social',
  WORK_SCHOOL = 'work_school',
  RELATIONSHIP = 'relationship',
  HEALTH = 'health',
  FINANCIAL = 'financial',
  DIETARY = 'dietary',
  SLEEP = 'sleep',
  MEDICATION = 'medication',
  SUBSTANCE = 'substance',
  OTHER = 'other'
}

export interface MedicationLog {
  id: string;
  name: string;
  dosage: string;
  takenAt: Date;
  effectiveness?: number; // 0-10 scale
  sideEffects?: string[];
}

export interface SymptomContext {
  timeOfDay: TimeOfDay;
  activity?: string;
  mood?: number; // 0-10 scale
  energyLevel?: number; // 0-10 scale
  stressLevel?: number; // 0-10 scale
  sleepQuality?: number; // 0-10 scale
  weatherConditions?: string;
}

export enum TimeOfDay {
  EARLY_MORNING = 'early_morning', // 4-7am
  MORNING = 'morning', // 7-12pm
  AFTERNOON = 'afternoon', // 12-5pm
  EVENING = 'evening', // 5-9pm
  NIGHT = 'night', // 9pm-12am
  LATE_NIGHT = 'late_night' // 12am-4am
}

export interface SymptomPattern {
  type: PatternType;
  confidence: number; // 0-1 scale
  description: string;
  affectedSymptoms: string[];
  timeframe: string;
  recommendations?: string[];
}

export enum PatternType {
  CYCLICAL = 'cyclical',
  TRIGGERED = 'triggered',
  ESCALATING = 'escalating',
  IMPROVING = 'improving',
  STABLE = 'stable',
  MEDICATION_RELATED = 'medication_related',
  TIME_BASED = 'time_based'
}

export interface TrendAnalysis {
  period: string;
  averageSeverity: number;
  peakSeverity: number;
  mostCommonSymptoms: Array<{ name: string; count: number }>;
  mostCommonTriggers: Array<{ name: string; count: number }>;
  patterns: SymptomPattern[];
  improvementRate: number; // percentage
  warningSignsDetected: boolean;
  recommendations: string[];
}

export interface ExportData {
  patient: {
    id: string;
    dateRange: { start: Date; end: Date };
  };
  symptoms: Symptom[];
  patterns: SymptomPattern[];
  trends: TrendAnalysis;
  medications: MedicationLog[];
  summary: string;
}

// Predefined symptom templates for common conditions
const SYMPTOM_TEMPLATES = {
  [SymptomCategory.ANXIETY]: {
    physical: [
      'Rapid heartbeat', 'Sweating', 'Trembling', 'Shortness of breath',
      'Chest tightness', 'Nausea', 'Dizziness', 'Muscle tension'
    ],
    emotional: [
      'Excessive worry', 'Fear', 'Restlessness', 'Irritability',
      'Feeling on edge', 'Panic', 'Dread'
    ],
    behavioral: [
      'Avoidance', 'Compulsive behaviors', 'Pacing', 'Fidgeting',
      'Social withdrawal', 'Procrastination'
    ],
    cognitive: [
      'Racing thoughts', 'Difficulty concentrating', 'Mind going blank',
      'Catastrophizing', 'Intrusive thoughts'
    ]
  },
  [SymptomCategory.DEPRESSION]: {
    physical: [
      'Fatigue', 'Changes in appetite', 'Sleep disturbances', 'Body aches',
      'Headaches', 'Digestive issues', 'Slowed movements'
    ],
    emotional: [
      'Persistent sadness', 'Emptiness', 'Hopelessness', 'Guilt',
      'Worthlessness', 'Loss of interest', 'Numbness'
    ],
    behavioral: [
      'Social isolation', 'Reduced activity', 'Neglecting responsibilities',
      'Changes in hygiene', 'Substance use'
    ],
    cognitive: [
      'Difficulty concentrating', 'Memory problems', 'Indecisiveness',
      'Negative thoughts', 'Suicidal ideation'
    ]
  },
  [SymptomCategory.ADHD]: {
    physical: [
      'Hyperactivity', 'Restlessness', 'Fidgeting', 'Difficulty sitting still'
    ],
    emotional: [
      'Impatience', 'Frustration', 'Mood swings', 'Low frustration tolerance'
    ],
    behavioral: [
      'Impulsivity', 'Interrupting others', 'Difficulty waiting',
      'Disorganization', 'Procrastination', 'Time blindness'
    ],
    cognitive: [
      'Inattention', 'Distractibility', 'Forgetfulness', 'Difficulty focusing',
      'Executive dysfunction', 'Racing thoughts'
    ]
  },
  [SymptomCategory.PTSD]: {
    physical: [
      'Hypervigilance', 'Startle response', 'Sleep disturbances',
      'Nightmares', 'Sweating', 'Rapid heartbeat'
    ],
    emotional: [
      'Fear', 'Anger', 'Guilt', 'Shame', 'Emotional numbness',
      'Detachment', 'Anxiety'
    ],
    behavioral: [
      'Avoidance of triggers', 'Social withdrawal', 'Aggressive outbursts',
      'Self-destructive behavior', 'Substance use'
    ],
    cognitive: [
      'Flashbacks', 'Intrusive memories', 'Dissociation',
      'Negative thoughts about self/world', 'Memory problems'
    ]
  }
};

class SymptomTrackingService {
  private symptoms: Map<string, Symptom[]> = new Map();
  private patterns: Map<string, SymptomPattern[]> = new Map();
  
  /**
   * Log a new symptom entry
   */
  async logSymptom(symptom: Omit<Symptom, 'id' | 'timestamp'>): Promise<Symptom> {
    const newSymptom: Symptom = {
      ...symptom,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    // Store symptom
    const userSymptoms = this.symptoms.get(symptom.userId) || [];
    userSymptoms.push(newSymptom);
    this.symptoms.set(symptom.userId, userSymptoms);
    
    // Trigger pattern recognition
    await this.analyzePatterns(symptom.userId);
    
    // Check for warning signs
    await this.checkWarningSignsAsync(symptom.userId);
    
    // Persist to storage
    await this.persistToStorage(symptom.userId);
    
    return newSymptom;
  }
  
  /**
   * Get symptoms for a user within a date range
   */
  async getSymptoms(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    filters?: {
      category?: SymptomCategory;
      type?: SymptomType;
      minSeverity?: number;
    }
  ): Promise<Symptom[]> {
    let symptoms = this.symptoms.get(userId) || [];
    
    // Apply date filter
    if (startDate || endDate) {
      symptoms = symptoms.filter(s => {
        const symptomDate = new Date(s.timestamp);
        if (startDate && symptomDate < startDate) return false;
        if (endDate && symptomDate > endDate) return false;
        return true;
      });
    }
    
    // Apply other filters
    if (filters) {
      if (filters.category) {
        symptoms = symptoms.filter(s => s.category === filters.category);
      }
      if (filters.type) {
        symptoms = symptoms.filter(s => s.type === filters.type);
      }
      if (filters.minSeverity !== undefined) {
        symptoms = symptoms.filter(s => s.severity >= filters.minSeverity);
      }
    }
    
    return symptoms.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  
  /**
   * Analyze patterns in symptom data
   */
  async analyzePatterns(userId: string): Promise<SymptomPattern[]> {
    const symptoms = await this.getSymptoms(userId, subDays(new Date(), 30));
    const patterns: SymptomPattern[] = [];
    
    // Check for cyclical patterns
    const cyclicalPattern = this.detectCyclicalPatterns(symptoms);
    if (cyclicalPattern) patterns.push(cyclicalPattern);
    
    // Check for trigger-based patterns
    const triggerPatterns = this.detectTriggerPatterns(symptoms);
    patterns.push(...triggerPatterns);
    
    // Check for time-based patterns
    const timePattern = this.detectTimeBasedPatterns(symptoms);
    if (timePattern) patterns.push(timePattern);
    
    // Check for medication-related patterns
    const medicationPattern = this.detectMedicationPatterns(symptoms);
    if (medicationPattern) patterns.push(medicationPattern);
    
    // Check for escalation/improvement trends
    const trendPattern = this.detectTrendPatterns(symptoms);
    if (trendPattern) patterns.push(trendPattern);
    
    // Store patterns
    this.patterns.set(userId, patterns);
    
    return patterns;
  }
  
  /**
   * Perform trend analysis
   */
  async analyzeTrends(
    userId: string,
    days: number = 30
  ): Promise<TrendAnalysis> {
    const symptoms = await this.getSymptoms(
      userId,
      subDays(new Date(), days)
    );
    
    if (symptoms.length === 0) {
      return this.getEmptyTrendAnalysis(days);
    }
    
    // Calculate average and peak severity
    const severities = symptoms.map(s => s.severity);
    const averageSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
    const peakSeverity = Math.max(...severities);
    
    // Find most common symptoms
    const symptomCounts = new Map<string, number>();
    symptoms.forEach(s => {
      symptomCounts.set(s.name, (symptomCounts.get(s.name) || 0) + 1);
    });
    const mostCommonSymptoms = Array.from(symptomCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Find most common triggers
    const triggerCounts = new Map<string, number>();
    symptoms.forEach(s => {
      s.triggers?.forEach(t => {
        triggerCounts.set(t.name, (triggerCounts.get(t.name) || 0) + 1);
      });
    });
    const mostCommonTriggers = Array.from(triggerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get patterns
    const patterns = await this.analyzePatterns(userId);
    
    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(symptoms);
    
    // Check for warning signs
    const warningSignsDetected = await this.checkWarningSigns(userId);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      symptoms,
      patterns,
      averageSeverity
    );
    
    return {
      period: `Last ${days} days`,
      averageSeverity: Math.round(averageSeverity * 10) / 10,
      peakSeverity,
      mostCommonSymptoms,
      mostCommonTriggers,
      patterns,
      improvementRate,
      warningSignsDetected,
      recommendations
    };
  }
  
  /**
   * Export data for healthcare providers
   */
  async exportForProvider(
    userId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'pdf' | 'csv' = 'json'
  ): Promise<ExportData | string> {
    const symptoms = await this.getSymptoms(userId, startDate, endDate);
    const patterns = this.patterns.get(userId) || [];
    const trends = await this.analyzeTrends(
      userId,
      differenceInDays(endDate, startDate)
    );
    
    // Get all medications from symptoms
    const medications: MedicationLog[] = [];
    const medicationMap = new Map<string, MedicationLog>();
    symptoms.forEach(s => {
      s.medications?.forEach(m => {
        if (!medicationMap.has(m.id)) {
          medicationMap.set(m.id, m);
          medications.push(m);
        }
      });
    });
    
    const exportData: ExportData = {
      patient: {
        id: userId,
        dateRange: { start: startDate, end: endDate }
      },
      symptoms,
      patterns,
      trends,
      medications,
      summary: this.generateSummary(symptoms, patterns, trends)
    };
    
    switch (format) {
      case 'csv':
        return this.convertToCSV(exportData);
      case 'pdf':
        return this.convertToPDF(exportData);
      default:
        return exportData;
    }
  }
  
  /**
   * Get symptom templates for a category
   */
  getSymptomTemplates(category: SymptomCategory): typeof SYMPTOM_TEMPLATES[SymptomCategory.ANXIETY] {
    return SYMPTOM_TEMPLATES[category] || SYMPTOM_TEMPLATES[SymptomCategory.GENERAL];
  }
  
  /**
   * Get common triggers for a category
   */
  getCommonTriggers(category?: SymptomCategory): Trigger[] {
    const commonTriggers: Trigger[] = [
      { id: '1', name: 'Work stress', category: TriggerCategory.WORK_SCHOOL },
      { id: '2', name: 'Relationship conflict', category: TriggerCategory.RELATIONSHIP },
      { id: '3', name: 'Financial concerns', category: TriggerCategory.FINANCIAL },
      { id: '4', name: 'Health issues', category: TriggerCategory.HEALTH },
      { id: '5', name: 'Lack of sleep', category: TriggerCategory.SLEEP },
      { id: '6', name: 'Social situation', category: TriggerCategory.SOCIAL },
      { id: '7', name: 'Weather changes', category: TriggerCategory.ENVIRONMENTAL },
      { id: '8', name: 'Medication change', category: TriggerCategory.MEDICATION },
      { id: '9', name: 'Diet/nutrition', category: TriggerCategory.DIETARY },
      { id: '10', name: 'Substance use', category: TriggerCategory.SUBSTANCE }
    ];
    
    // Add category-specific triggers if provided
    if (category === SymptomCategory.PTSD) {
      commonTriggers.push(
        { id: '11', name: 'Loud noises', category: TriggerCategory.ENVIRONMENTAL },
        { id: '12', name: 'Crowded spaces', category: TriggerCategory.ENVIRONMENTAL },
        { id: '13', name: 'Specific locations', category: TriggerCategory.ENVIRONMENTAL }
      );
    }
    
    return commonTriggers;
  }
  
  // Private helper methods
  
  private detectCyclicalPatterns(symptoms: Symptom[]): SymptomPattern | null {
    // Group symptoms by day and calculate average severity
    const dailyAverages = new Map<string, number[]>();
    
    symptoms.forEach(s => {
      const day = format(s.timestamp, 'yyyy-MM-dd');
      const severities = dailyAverages.get(day) || [];
      severities.push(s.severity);
      dailyAverages.set(day, severities);
    });
    
    // Look for weekly patterns
    const weeklyPattern = this.findWeeklyPattern(dailyAverages);
    if (weeklyPattern) {
      return {
        type: PatternType.CYCLICAL,
        confidence: weeklyPattern.confidence,
        description: `Symptoms tend to peak on ${weeklyPattern.peakDays.join(', ')}`,
        affectedSymptoms: weeklyPattern.symptoms,
        timeframe: 'Weekly',
        recommendations: [
          'Plan lighter activities on peak days',
          'Schedule self-care activities before peak days',
          'Consider preventive coping strategies'
        ]
      };
    }
    
    return null;
  }
  
  private detectTriggerPatterns(symptoms: Symptom[]): SymptomPattern[] {
    const patterns: SymptomPattern[] = [];
    const triggerSeverityMap = new Map<string, number[]>();
    
    symptoms.forEach(s => {
      s.triggers?.forEach(t => {
        const severities = triggerSeverityMap.get(t.name) || [];
        severities.push(s.severity);
        triggerSeverityMap.set(t.name, severities);
      });
    });
    
    // Find triggers that consistently lead to high severity
    triggerSeverityMap.forEach((severities, triggerName) => {
      if (severities.length >= 3) {
        const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
        if (avgSeverity >= 7) {
          patterns.push({
            type: PatternType.TRIGGERED,
            confidence: Math.min(severities.length / 10, 1),
            description: `"${triggerName}" consistently triggers high-severity symptoms`,
            affectedSymptoms: this.getSymptomsByTrigger(symptoms, triggerName),
            timeframe: 'Ongoing',
            recommendations: [
              `Develop coping strategies for "${triggerName}"`,
              'Consider exposure therapy or gradual desensitization',
              'Practice preventive techniques when trigger is anticipated'
            ]
          });
        }
      }
    });
    
    return patterns;
  }
  
  private detectTimeBasedPatterns(symptoms: Symptom[]): SymptomPattern | null {
    const timeOfDaySeverity = new Map<TimeOfDay, number[]>();
    
    symptoms.forEach(s => {
      if (s.context?.timeOfDay) {
        const severities = timeOfDaySeverity.get(s.context.timeOfDay) || [];
        severities.push(s.severity);
        timeOfDaySeverity.set(s.context.timeOfDay, severities);
      }
    });
    
    // Find time of day with highest average severity
    let peakTime: TimeOfDay | null = null;
    let peakAverage = 0;
    
    timeOfDaySeverity.forEach((severities, time) => {
      const avg = severities.reduce((a, b) => a + b, 0) / severities.length;
      if (avg > peakAverage) {
        peakAverage = avg;
        peakTime = time;
      }
    });
    
    if (peakTime && peakAverage >= 6) {
      return {
        type: PatternType.TIME_BASED,
        confidence: 0.8,
        description: `Symptoms tend to be most severe during ${peakTime.replace('_', ' ')}`,
        affectedSymptoms: this.getUniqueSymptomNames(symptoms),
        timeframe: 'Daily',
        recommendations: [
          `Schedule important activities outside of ${peakTime.replace('_', ' ')}`,
          'Implement coping strategies before typical peak time',
          'Consider medication timing adjustments with healthcare provider'
        ]
      };
    }
    
    return null;
  }
  
  private detectMedicationPatterns(symptoms: Symptom[]): SymptomPattern | null {
    const medicationEffects = new Map<string, { before: number[], after: number[] }>();
    
    symptoms.forEach((s, index) => {
      if (s.medications && s.medications.length > 0) {
        s.medications.forEach(m => {
          const effects = medicationEffects.get(m.name) || { before: [], after: [] };
          
          // Look at symptoms before and after medication
          if (index > 0) {
            effects.before.push(symptoms[index - 1].severity);
          }
          if (index < symptoms.length - 1) {
            effects.after.push(symptoms[index + 1].severity);
          }
          
          medicationEffects.set(m.name, effects);
        });
      }
    });
    
    // Find medications with consistent effects
    const effectiveMedications: string[] = [];
    const ineffectiveMedications: string[] = [];
    
    medicationEffects.forEach((effects, medName) => {
      if (effects.before.length >= 3 && effects.after.length >= 3) {
        const avgBefore = effects.before.reduce((a, b) => a + b, 0) / effects.before.length;
        const avgAfter = effects.after.reduce((a, b) => a + b, 0) / effects.after.length;
        
        if (avgAfter < avgBefore - 2) {
          effectiveMedications.push(medName);
        } else if (avgAfter > avgBefore + 1) {
          ineffectiveMedications.push(medName);
        }
      }
    });
    
    if (effectiveMedications.length > 0 || ineffectiveMedications.length > 0) {
      const descriptions: string[] = [];
      const recommendations: string[] = [];
      
      if (effectiveMedications.length > 0) {
        descriptions.push(`${effectiveMedications.join(', ')} showing positive effects`);
        recommendations.push('Continue current medication regimen');
      }
      
      if (ineffectiveMedications.length > 0) {
        descriptions.push(`${ineffectiveMedications.join(', ')} may need adjustment`);
        recommendations.push('Discuss medication effectiveness with healthcare provider');
      }
      
      return {
        type: PatternType.MEDICATION_RELATED,
        confidence: 0.7,
        description: descriptions.join('; '),
        affectedSymptoms: this.getUniqueSymptomNames(symptoms),
        timeframe: 'Ongoing',
        recommendations
      };
    }
    
    return null;
  }
  
  private detectTrendPatterns(symptoms: Symptom[]): SymptomPattern | null {
    if (symptoms.length < 7) return null;
    
    // Calculate weekly averages
    const weeklyAverages: number[] = [];
    const sortedSymptoms = [...symptoms].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (let i = 0; i < sortedSymptoms.length; i += 7) {
      const weekSymptoms = sortedSymptoms.slice(i, Math.min(i + 7, sortedSymptoms.length));
      const avgSeverity = weekSymptoms.reduce((sum, s) => sum + s.severity, 0) / weekSymptoms.length;
      weeklyAverages.push(avgSeverity);
    }
    
    if (weeklyAverages.length < 2) return null;
    
    // Determine trend
    const firstHalf = weeklyAverages.slice(0, Math.floor(weeklyAverages.length / 2));
    const secondHalf = weeklyAverages.slice(Math.floor(weeklyAverages.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg - 1) {
      return {
        type: PatternType.IMPROVING,
        confidence: Math.min((firstAvg - secondAvg) / 5, 1),
        description: 'Overall symptom severity is improving',
        affectedSymptoms: this.getUniqueSymptomNames(symptoms),
        timeframe: `Last ${weeklyAverages.length} weeks`,
        recommendations: [
          'Continue current management strategies',
          'Document what has been working well',
          'Maintain consistency in treatment approach'
        ]
      };
    } else if (secondAvg > firstAvg + 1) {
      return {
        type: PatternType.ESCALATING,
        confidence: Math.min((secondAvg - firstAvg) / 5, 1),
        description: 'Symptom severity is increasing',
        affectedSymptoms: this.getUniqueSymptomNames(symptoms),
        timeframe: `Last ${weeklyAverages.length} weeks`,
        recommendations: [
          'Consider reaching out to healthcare provider',
          'Review and adjust coping strategies',
          'Identify new stressors or triggers',
          'Ensure medication compliance if applicable'
        ]
      };
    }
    
    return {
      type: PatternType.STABLE,
      confidence: 0.6,
      description: 'Symptom severity remains relatively stable',
      affectedSymptoms: this.getUniqueSymptomNames(symptoms),
      timeframe: `Last ${weeklyAverages.length} weeks`,
      recommendations: [
        'Maintain current management approach',
        'Consider small adjustments for improvement',
        'Monitor for any changes in pattern'
      ]
    };
  }
  
  private findWeeklyPattern(dailyAverages: Map<string, number[]>): any {
    const dayOfWeekSeverities = new Map<string, number[]>();
    
    dailyAverages.forEach((severities, dateStr) => {
      const date = new Date(dateStr);
      const dayName = format(date, 'EEEE');
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      
      const daySeverities = dayOfWeekSeverities.get(dayName) || [];
      daySeverities.push(avgSeverity);
      dayOfWeekSeverities.set(dayName, daySeverities);
    });
    
    // Find days with consistently high severity
    const peakDays: string[] = [];
    let maxAvg = 0;
    
    dayOfWeekSeverities.forEach((severities, day) => {
      if (severities.length >= 2) {
        const avg = severities.reduce((a, b) => a + b, 0) / severities.length;
        if (avg > maxAvg) {
          maxAvg = avg;
          peakDays.length = 0;
          peakDays.push(day);
        } else if (avg === maxAvg) {
          peakDays.push(day);
        }
      }
    });
    
    if (peakDays.length > 0 && maxAvg >= 5) {
      return {
        confidence: 0.7,
        peakDays,
        symptoms: ['Various']
      };
    }
    
    return null;
  }
  
  private getSymptomsByTrigger(symptoms: Symptom[], triggerName: string): string[] {
    const symptomNames = new Set<string>();
    
    symptoms.forEach(s => {
      if (s.triggers?.some(t => t.name === triggerName)) {
        symptomNames.add(s.name);
      }
    });
    
    return Array.from(symptomNames);
  }
  
  private getUniqueSymptomNames(symptoms: Symptom[]): string[] {
    return Array.from(new Set(symptoms.map(s => s.name)));
  }
  
  private calculateImprovementRate(symptoms: Symptom[]): number {
    if (symptoms.length < 2) return 0;
    
    const sortedSymptoms = [...symptoms].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const firstThird = sortedSymptoms.slice(0, Math.floor(sortedSymptoms.length / 3));
    const lastThird = sortedSymptoms.slice(Math.floor(sortedSymptoms.length * 2 / 3));
    
    const firstAvg = firstThird.reduce((sum, s) => sum + s.severity, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, s) => sum + s.severity, 0) / lastThird.length;
    
    const improvement = ((firstAvg - lastAvg) / firstAvg) * 100;
    return Math.round(Math.max(0, Math.min(100, improvement)));
  }
  
  private async checkWarningSignsAsync(userId: string): Promise<void> {
    // Run warning sign check asynchronously
    setTimeout(() => this.checkWarningSigns(userId), 0);
  }
  
  private async checkWarningSigns(userId: string): Promise<boolean> {
    const recentSymptoms = await this.getSymptoms(
      userId,
      subDays(new Date(), 7)
    );
    
    // Check for high severity symptoms
    const highSeverityCount = recentSymptoms.filter(s => s.severity >= 8).length;
    if (highSeverityCount >= 3) return true;
    
    // Check for escalating pattern
    const sortedSymptoms = [...recentSymptoms].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    if (sortedSymptoms.length >= 3) {
      const recentAvg = sortedSymptoms.slice(-3)
        .reduce((sum, s) => sum + s.severity, 0) / 3;
      const earlierAvg = sortedSymptoms.slice(0, 3)
        .reduce((sum, s) => sum + s.severity, 0) / 3;
      
      if (recentAvg > earlierAvg + 3) return true;
    }
    
    // Check for crisis-related symptoms
    const crisisKeywords = [
      'suicidal', 'self-harm', 'hopeless', 'worthless', 'end it',
      'cant go on', 'no point', 'give up'
    ];
    
    const hasCrisisSymptoms = recentSymptoms.some(s => 
      crisisKeywords.some(keyword => 
        s.name.toLowerCase().includes(keyword) ||
        s.notes?.toLowerCase().includes(keyword)
      )
    );
    
    return hasCrisisSymptoms;
  }
  
  private generateRecommendations(
    symptoms: Symptom[],
    patterns: SymptomPattern[],
    averageSeverity: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Severity-based recommendations
    if (averageSeverity >= 7) {
      recommendations.push('Consider scheduling an appointment with your healthcare provider');
      recommendations.push('Increase use of coping strategies and self-care activities');
    } else if (averageSeverity >= 5) {
      recommendations.push('Monitor symptoms closely for any escalation');
      recommendations.push('Maintain regular self-care routine');
    }
    
    // Pattern-based recommendations
    patterns.forEach(pattern => {
      if (pattern.recommendations) {
        recommendations.push(...pattern.recommendations);
      }
    });
    
    // General recommendations
    if (symptoms.some(s => !s.triggers || s.triggers.length === 0)) {
      recommendations.push('Try to identify triggers when symptoms occur');
    }
    
    if (symptoms.some(s => !s.notes)) {
      recommendations.push('Add notes to provide context for better pattern recognition');
    }
    
    // Remove duplicates
    return Array.from(new Set(recommendations)).slice(0, 5);
  }
  
  private generateSummary(
    symptoms: Symptom[],
    patterns: SymptomPattern[],
    trends: TrendAnalysis
  ): string {
    const summary: string[] = [];
    
    summary.push(`Symptom Tracking Summary`);
    summary.push(`Period: ${trends.period}`);
    summary.push(`Total symptoms logged: ${symptoms.length}`);
    summary.push(`Average severity: ${trends.averageSeverity}/10`);
    summary.push(`Peak severity: ${trends.peakSeverity}/10`);
    
    if (trends.mostCommonSymptoms.length > 0) {
      summary.push(`\nMost common symptoms:`);
      trends.mostCommonSymptoms.forEach(s => {
        summary.push(`  - ${s.name} (${s.count} occurrences)`);
      });
    }
    
    if (trends.mostCommonTriggers.length > 0) {
      summary.push(`\nMost common triggers:`);
      trends.mostCommonTriggers.forEach(t => {
        summary.push(`  - ${t.name} (${t.count} occurrences)`);
      });
    }
    
    if (patterns.length > 0) {
      summary.push(`\nIdentified patterns:`);
      patterns.forEach(p => {
        summary.push(`  - ${p.description}`);
      });
    }
    
    if (trends.improvementRate > 0) {
      summary.push(`\nImprovement rate: ${trends.improvementRate}%`);
    }
    
    if (trends.warningSignsDetected) {
      summary.push(`\n⚠️ Warning signs detected - please consult healthcare provider`);
    }
    
    return summary.join('\n');
  }
  
  private convertToCSV(data: ExportData): string {
    const csv: string[] = [];
    
    // Header
    csv.push('Date,Time,Category,Type,Symptom,Severity,Triggers,Medications,Notes');
    
    // Data rows
    data.symptoms.forEach(s => {
      const date = format(s.timestamp, 'yyyy-MM-dd');
      const time = format(s.timestamp, 'HH:mm');
      const triggers = s.triggers?.map(t => t.name).join('; ') || '';
      const medications = s.medications?.map(m => `${m.name} (${m.dosage})`).join('; ') || '';
      const notes = s.notes?.replace(/,/g, ';') || '';
      
      csv.push(`${date},${time},${s.category},${s.type},${s.name},${s.severity},${triggers},${medications},${notes}`);
    });
    
    return csv.join('\n');
  }
  
  private convertToPDF(data: ExportData): string {
    // In a real implementation, this would generate an actual PDF
    // For now, return a formatted text representation
    return this.generateSummary(data.symptoms, data.patterns, data.trends);
  }
  
  private getEmptyTrendAnalysis(days: number): TrendAnalysis {
    return {
      period: `Last ${days} days`,
      averageSeverity: 0,
      peakSeverity: 0,
      mostCommonSymptoms: [],
      mostCommonTriggers: [],
      patterns: [],
      improvementRate: 0,
      warningSignsDetected: false,
      recommendations: ['Start logging symptoms regularly for pattern analysis']
    };
  }
  
  private generateId(): string {
    return `sym_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async persistToStorage(userId: string): Promise<void> {
    // In a real implementation, this would save to a database or local storage
    const symptoms = this.symptoms.get(userId);
    if (symptoms) {
      try {
        localStorage.setItem(`symptoms_${userId}`, JSON.stringify(symptoms));
      } catch (error) {
        console.error('Failed to persist symptoms:', error);
      }
    }
  }
  
  async loadFromStorage(userId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(`symptoms_${userId}`);
      if (stored) {
        const symptoms = JSON.parse(stored);
        this.symptoms.set(userId, symptoms);
      }
    } catch (error) {
      console.error('Failed to load symptoms from storage:', error);
    }
  }
}

// Export singleton instance
export const symptomTrackingService = new SymptomTrackingService();