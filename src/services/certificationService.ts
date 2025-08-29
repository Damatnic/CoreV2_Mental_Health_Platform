/**
 * Certification Service
 * Manages helper certification levels, training progress, and competency assessments
 */

import { EventEmitter } from 'events';

// Certification Levels with detailed requirements
export enum CertificationLevel {
  PEER = 'peer',              // Basic peer support - lived experience sharing
  TRAINED = 'trained',        // Completed core training modules
  PROFESSIONAL = 'professional' // Advanced certification with clinical training
}

// Training Module Categories
export enum ModuleCategory {
  CRISIS_INTERVENTION = 'crisis_intervention',
  ACTIVE_LISTENING = 'active_listening',
  CULTURAL_COMPETENCY = 'cultural_competency',
  ETHICAL_BOUNDARIES = 'ethical_boundaries',
  SELF_CARE = 'self_care',
  MENTAL_HEALTH_LITERACY = 'mental_health_literacy',
  TRAUMA_INFORMED_CARE = 'trauma_informed_care',
  DE_ESCALATION = 'de_escalation',
  SUBSTANCE_USE = 'substance_use',
  SUICIDE_PREVENTION = 'suicide_prevention'
}

// Competency Assessment Types
export enum AssessmentType {
  KNOWLEDGE_CHECK = 'knowledge_check',
  SCENARIO_BASED = 'scenario_based',
  PRACTICAL_SKILLS = 'practical_skills',
  PEER_REVIEW = 'peer_review',
  SUPERVISION_HOURS = 'supervision_hours'
}

// Training Module Interface
export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: ModuleCategory;
  duration: number; // in minutes
  requiredForLevel: CertificationLevel;
  prerequisites: string[]; // module IDs
  content: ModuleContent[];
  assessments: Assessment[];
  creditHours: number;
  expiryMonths?: number; // Some certifications need renewal
  version: string;
  lastUpdated: Date;
  isActive: boolean;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Module Content Types
export interface ModuleContent {
  id: string;
  type: 'video' | 'reading' | 'interactive' | 'exercise' | 'quiz' | 'discussion';
  title: string;
  description: string;
  url?: string;
  content?: string;
  estimatedTime: number; // minutes
  isRequired: boolean;
  order: number;
}

// Assessment Interface
export interface Assessment {
  id: string;
  moduleId: string;
  type: AssessmentType;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number; // minutes
  questions?: Question[];
  rubric?: AssessmentRubric;
  weight: number; // percentage of final grade
}

// Question Types for Assessments
export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'scenario' | 'essay' | 'rating-scale';
  options?: string[];
  correctAnswer?: string | number | boolean;
  explanation: string;
  points: number;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeEstimate?: number; // seconds
}

// Assessment Rubric for subjective evaluations
export interface AssessmentRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  maxPoints: number;
  levels: {
    points: number;
    description: string;
  }[];
}

// Helper Certification Record
export interface HelperCertification {
  helperId: string;
  level: CertificationLevel;
  completedModules: CompletedModule[];
  assessmentScores: AssessmentScore[];
  credentials: Credential[];
  continuingEducation: ContinuingEducationRecord[];
  supervisionHours: SupervisionRecord[];
  certificationDate?: Date;
  renewalDate?: Date;
  status: 'active' | 'pending' | 'expired' | 'revoked';
  specializations: string[];
  badges: Badge[];
  portfolio?: PortfolioItem[];
  mentoringReceived: number; // hours
  mentoringProvided: number; // hours
}

// Completed Module Record
export interface CompletedModule {
  moduleId: string;
  completionDate: Date;
  score: number;
  attempts: number;
  timeSpent: number; // minutes
  certificateId?: string;
  feedback?: string;
  verified: boolean;
}

// Assessment Score Record
export interface AssessmentScore {
  assessmentId: string;
  moduleId: string;
  score: number;
  maxScore: number;
  percentage: number;
  attemptNumber: number;
  completedAt: Date;
  timeSpent: number; // minutes
  answers?: any[];
  feedback?: string;
  evaluatorId?: string; // For peer/supervisor reviews
}

// External Credential Verification
export interface Credential {
  id: string;
  type: 'degree' | 'certificate' | 'license' | 'training';
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationMethod: 'manual' | 'api' | 'document';
  documentUrl?: string;
  credentialNumber?: string;
}

// Continuing Education Record
export interface ContinuingEducationRecord {
  id: string;
  title: string;
  provider: string;
  type: 'workshop' | 'conference' | 'course' | 'webinar' | 'self-study';
  date: Date;
  hours: number;
  credits: number;
  category: string;
  certificateUrl?: string;
  notes?: string;
  approved: boolean;
}

// Supervision Record
export interface SupervisionRecord {
  id: string;
  supervisorId: string;
  supervisorName: string;
  date: Date;
  duration: number; // minutes
  type: 'individual' | 'group' | 'peer';
  topics: string[];
  notes?: string;
  goals?: string[];
  feedback?: string;
  approved: boolean;
}

// Achievement Badge
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedDate: Date;
  criteria: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Portfolio Item for showcasing skills
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'case-study' | 'reflection' | 'project' | 'testimonial';
  content: string;
  attachments?: string[];
  date: Date;
  tags: string[];
  isPublic: boolean;
}

// Training Progress Tracking
export interface TrainingProgress {
  helperId: string;
  currentLevel: CertificationLevel;
  nextLevel?: CertificationLevel;
  totalModules: number;
  completedModules: number;
  totalHours: number;
  completedHours: number;
  averageScore: number;
  currentStreak: number; // days
  longestStreak: number; // days
  lastActivityDate: Date;
  strengths: string[];
  areasForImprovement: string[];
  recommendedModules: string[];
  progressPercentage: number;
  estimatedCompletionDate?: Date;
  learningPath: LearningPath;
}

// Personalized Learning Path
export interface LearningPath {
  id: string;
  helperId: string;
  goals: string[];
  milestones: Milestone[];
  recommendedSequence: string[]; // module IDs in order
  adaptiveAdjustments: AdaptiveAdjustment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  requiredModules: string[];
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
}

export interface AdaptiveAdjustment {
  date: Date;
  reason: string;
  changes: string[];
  basedOn: 'performance' | 'feedback' | 'preference' | 'availability';
}

// Certification Requirements by Level
export const CERTIFICATION_REQUIREMENTS: Record<CertificationLevel, {
  minModules: number;
  minHours: number;
  minScore: number;
  requiredCategories: ModuleCategory[];
  supervisionHours: number;
  practiceHours: number;
  assessmentTypes: AssessmentType[];
}> = {
  [CertificationLevel.PEER]: {
    minModules: 5,
    minHours: 10,
    minScore: 70,
    requiredCategories: [
      ModuleCategory.ACTIVE_LISTENING,
      ModuleCategory.ETHICAL_BOUNDARIES,
      ModuleCategory.SELF_CARE
    ],
    supervisionHours: 0,
    practiceHours: 20,
    assessmentTypes: [AssessmentType.KNOWLEDGE_CHECK]
  },
  [CertificationLevel.TRAINED]: {
    minModules: 12,
    minHours: 40,
    minScore: 80,
    requiredCategories: [
      ModuleCategory.CRISIS_INTERVENTION,
      ModuleCategory.ACTIVE_LISTENING,
      ModuleCategory.CULTURAL_COMPETENCY,
      ModuleCategory.ETHICAL_BOUNDARIES,
      ModuleCategory.SELF_CARE,
      ModuleCategory.MENTAL_HEALTH_LITERACY,
      ModuleCategory.DE_ESCALATION
    ],
    supervisionHours: 20,
    practiceHours: 100,
    assessmentTypes: [
      AssessmentType.KNOWLEDGE_CHECK,
      AssessmentType.SCENARIO_BASED,
      AssessmentType.PRACTICAL_SKILLS
    ]
  },
  [CertificationLevel.PROFESSIONAL]: {
    minModules: 20,
    minHours: 120,
    minScore: 85,
    requiredCategories: Object.values(ModuleCategory),
    supervisionHours: 100,
    practiceHours: 500,
    assessmentTypes: Object.values(AssessmentType)
  }
};

/**
 * Certification Service Class
 * Manages all certification-related operations
 */
export class CertificationService extends EventEmitter {
  private static instance: CertificationService;
  private certifications: Map<string, HelperCertification> = new Map();
  private modules: Map<string, TrainingModule> = new Map();
  private assessments: Map<string, Assessment> = new Map();
  private progress: Map<string, TrainingProgress> = new Map();

  private constructor() {
    super();
    this.initializeDefaultModules();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CertificationService {
    if (!CertificationService.instance) {
      CertificationService.instance = new CertificationService();
    }
    return CertificationService.instance;
  }

  /**
   * Initialize default training modules
   */
  private initializeDefaultModules(): void {
    // Crisis Intervention Module
    this.addModule({
      id: 'crisis-001',
      title: 'Crisis Intervention Fundamentals',
      description: 'Learn to recognize and respond to mental health crises safely and effectively',
      category: ModuleCategory.CRISIS_INTERVENTION,
      duration: 120,
      requiredForLevel: CertificationLevel.TRAINED,
      prerequisites: [],
      content: [
        {
          id: 'crisis-001-c1',
          type: 'video',
          title: 'Understanding Mental Health Crises',
          description: 'Overview of crisis situations and warning signs',
          estimatedTime: 30,
          isRequired: true,
          order: 1
        },
        {
          id: 'crisis-001-c2',
          type: 'reading',
          title: 'Crisis Assessment Tools',
          description: 'Learn to use standardized assessment tools',
          content: 'Crisis assessment involves systematic evaluation...',
          estimatedTime: 20,
          isRequired: true,
          order: 2
        },
        {
          id: 'crisis-001-c3',
          type: 'interactive',
          title: 'Crisis Simulation',
          description: 'Practice crisis intervention in simulated scenarios',
          estimatedTime: 40,
          isRequired: true,
          order: 3
        }
      ],
      assessments: [],
      creditHours: 2,
      expiryMonths: 24,
      version: '1.0.0',
      lastUpdated: new Date(),
      isActive: true,
      tags: ['crisis', 'safety', 'intervention'],
      difficulty: 'intermediate'
    });

    // Active Listening Module
    this.addModule({
      id: 'listen-001',
      title: 'Active Listening Skills',
      description: 'Master the art of active listening and empathetic communication',
      category: ModuleCategory.ACTIVE_LISTENING,
      duration: 60,
      requiredForLevel: CertificationLevel.PEER,
      prerequisites: [],
      content: [
        {
          id: 'listen-001-c1',
          type: 'video',
          title: 'The Power of Active Listening',
          description: 'Understanding the principles of active listening',
          estimatedTime: 20,
          isRequired: true,
          order: 1
        },
        {
          id: 'listen-001-c2',
          type: 'exercise',
          title: 'Reflective Listening Practice',
          description: 'Practice reflective listening techniques',
          estimatedTime: 25,
          isRequired: true,
          order: 2
        }
      ],
      assessments: [],
      creditHours: 1,
      version: '1.0.0',
      lastUpdated: new Date(),
      isActive: true,
      tags: ['communication', 'empathy', 'listening'],
      difficulty: 'beginner'
    });

    // Add more default modules...
    this.initializeCulturalCompetencyModule();
    this.initializeEthicalBoundariesModule();
    this.initializeSelfCareModule();
  }

  /**
   * Initialize Cultural Competency Module
   */
  private initializeCulturalCompetencyModule(): void {
    this.addModule({
      id: 'culture-001',
      title: 'Cultural Competency in Mental Health',
      description: 'Develop cultural awareness and sensitivity in mental health support',
      category: ModuleCategory.CULTURAL_COMPETENCY,
      duration: 90,
      requiredForLevel: CertificationLevel.TRAINED,
      prerequisites: ['listen-001'],
      content: [
        {
          id: 'culture-001-c1',
          type: 'reading',
          title: 'Understanding Cultural Differences',
          description: 'Explore how culture impacts mental health',
          content: 'Cultural factors significantly influence...',
          estimatedTime: 30,
          isRequired: true,
          order: 1
        },
        {
          id: 'culture-001-c2',
          type: 'discussion',
          title: 'Cultural Case Studies',
          description: 'Discuss real-world cultural scenarios',
          estimatedTime: 40,
          isRequired: true,
          order: 2
        }
      ],
      assessments: [],
      creditHours: 1.5,
      version: '1.0.0',
      lastUpdated: new Date(),
      isActive: true,
      tags: ['culture', 'diversity', 'inclusion'],
      difficulty: 'intermediate'
    });
  }

  /**
   * Initialize Ethical Boundaries Module
   */
  private initializeEthicalBoundariesModule(): void {
    this.addModule({
      id: 'ethics-001',
      title: 'Ethical Boundaries in Peer Support',
      description: 'Understanding professional boundaries and ethical considerations',
      category: ModuleCategory.ETHICAL_BOUNDARIES,
      duration: 75,
      requiredForLevel: CertificationLevel.PEER,
      prerequisites: [],
      content: [
        {
          id: 'ethics-001-c1',
          type: 'video',
          title: 'Professional Boundaries',
          description: 'Learn about maintaining appropriate boundaries',
          estimatedTime: 25,
          isRequired: true,
          order: 1
        },
        {
          id: 'ethics-001-c2',
          type: 'quiz',
          title: 'Ethical Scenarios Quiz',
          description: 'Test your understanding of ethical boundaries',
          estimatedTime: 20,
          isRequired: true,
          order: 2
        }
      ],
      assessments: [],
      creditHours: 1.25,
      version: '1.0.0',
      lastUpdated: new Date(),
      isActive: true,
      tags: ['ethics', 'boundaries', 'professionalism'],
      difficulty: 'beginner'
    });
  }

  /**
   * Initialize Self-Care Module
   */
  private initializeSelfCareModule(): void {
    this.addModule({
      id: 'selfcare-001',
      title: 'Self-Care for Helpers',
      description: 'Maintain your wellbeing while supporting others',
      category: ModuleCategory.SELF_CARE,
      duration: 60,
      requiredForLevel: CertificationLevel.PEER,
      prerequisites: [],
      content: [
        {
          id: 'selfcare-001-c1',
          type: 'reading',
          title: 'Preventing Burnout',
          description: 'Recognize and prevent helper burnout',
          content: 'Supporting others can be emotionally demanding...',
          estimatedTime: 20,
          isRequired: true,
          order: 1
        },
        {
          id: 'selfcare-001-c2',
          type: 'exercise',
          title: 'Personal Self-Care Plan',
          description: 'Create your personalized self-care strategy',
          estimatedTime: 30,
          isRequired: true,
          order: 2
        }
      ],
      assessments: [],
      creditHours: 1,
      version: '1.0.0',
      lastUpdated: new Date(),
      isActive: true,
      tags: ['wellbeing', 'self-care', 'burnout-prevention'],
      difficulty: 'beginner'
    });
  }

  /**
   * Add a new training module
   */
  public addModule(module: TrainingModule): void {
    this.modules.set(module.id, module);
    this.emit('moduleAdded', module);
  }

  /**
   * Get all available modules
   */
  public getModules(filter?: {
    category?: ModuleCategory;
    level?: CertificationLevel;
    isActive?: boolean;
  }): TrainingModule[] {
    let modules = Array.from(this.modules.values());

    if (filter) {
      if (filter.category) {
        modules = modules.filter(m => m.category === filter.category);
      }
      if (filter.level) {
        modules = modules.filter(m => m.requiredForLevel === filter.level);
      }
      if (filter.isActive !== undefined) {
        modules = modules.filter(m => m.isActive === filter.isActive);
      }
    }

    return modules;
  }

  /**
   * Get module by ID
   */
  public getModule(moduleId: string): TrainingModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Record module completion
   */
  public async completeModule(
    helperId: string,
    moduleId: string,
    score: number,
    timeSpent: number
  ): Promise<void> {
    const certification = this.getCertification(helperId);
    const module = this.modules.get(moduleId);

    if (!module) {
      throw new Error('Module not found');
    }

    const completedModule: CompletedModule = {
      moduleId,
      completionDate: new Date(),
      score,
      attempts: 1, // Track attempts separately
      timeSpent,
      verified: score >= 70 // Auto-verify if passing score
    };

    certification.completedModules.push(completedModule);
    
    // Update progress
    await this.updateProgress(helperId);
    
    // Check for level advancement
    await this.checkLevelAdvancement(helperId);
    
    // Award badges if applicable
    await this.checkAndAwardBadges(helperId, moduleId, score);

    this.emit('moduleCompleted', { helperId, moduleId, score });
  }

  /**
   * Get helper certification
   */
  public getCertification(helperId: string): HelperCertification {
    if (!this.certifications.has(helperId)) {
      // Create new certification record
      this.certifications.set(helperId, {
        helperId,
        level: CertificationLevel.PEER,
        completedModules: [],
        assessmentScores: [],
        credentials: [],
        continuingEducation: [],
        supervisionHours: [],
        status: 'pending',
        specializations: [],
        badges: [],
        mentoringReceived: 0,
        mentoringProvided: 0
      });
    }
    return this.certifications.get(helperId)!;
  }

  /**
   * Update training progress
   */
  private async updateProgress(helperId: string): Promise<void> {
    const certification = this.getCertification(helperId);
    const allModules = Array.from(this.modules.values());
    const completedModuleIds = new Set(certification.completedModules.map(m => m.moduleId));
    
    const completedModules = certification.completedModules.length;
    const totalModules = allModules.filter(m => m.isActive).length;
    
    const completedHours = certification.completedModules.reduce(
      (sum, cm) => sum + (this.modules.get(cm.moduleId)?.creditHours || 0),
      0
    );
    
    const totalHours = allModules
      .filter(m => m.isActive)
      .reduce((sum, m) => sum + m.creditHours, 0);
    
    const scores = certification.completedModules.map(m => m.score);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Calculate learning path recommendations
    const recommendedModules = this.getRecommendedModules(helperId);

    const progress: TrainingProgress = {
      helperId,
      currentLevel: certification.level,
      nextLevel: this.getNextLevel(certification.level),
      totalModules,
      completedModules,
      totalHours,
      completedHours,
      averageScore,
      currentStreak: this.calculateStreak(certification),
      longestStreak: 0, // Calculate from history
      lastActivityDate: new Date(),
      strengths: this.identifyStrengths(certification),
      areasForImprovement: this.identifyAreasForImprovement(certification),
      recommendedModules,
      progressPercentage: (completedModules / totalModules) * 100,
      estimatedCompletionDate: this.estimateCompletionDate(certification),
      learningPath: await this.generateLearningPath(helperId)
    };

    this.progress.set(helperId, progress);
    this.emit('progressUpdated', progress);
  }

  /**
   * Check and advance certification level
   */
  private async checkLevelAdvancement(helperId: string): Promise<void> {
    const certification = this.getCertification(helperId);
    const nextLevel = this.getNextLevel(certification.level);
    
    if (!nextLevel) return;

    const requirements = CERTIFICATION_REQUIREMENTS[nextLevel];
    const completedModules = certification.completedModules;
    
    // Check module count
    if (completedModules.length < requirements.minModules) return;
    
    // Check minimum hours
    const totalHours = completedModules.reduce(
      (sum, cm) => sum + (this.modules.get(cm.moduleId)?.creditHours || 0),
      0
    );
    if (totalHours < requirements.minHours) return;
    
    // Check average score
    const avgScore = completedModules.reduce((sum, cm) => sum + cm.score, 0) / completedModules.length;
    if (avgScore < requirements.minScore) return;
    
    // Check required categories
    const completedCategories = new Set(
      completedModules
        .map(cm => this.modules.get(cm.moduleId)?.category)
        .filter(Boolean)
    );
    
    const hasAllCategories = requirements.requiredCategories.every(
      cat => completedCategories.has(cat)
    );
    
    if (!hasAllCategories) return;
    
    // Check supervision hours
    const supervisionHours = certification.supervisionHours
      .filter(s => s.approved)
      .reduce((sum, s) => sum + s.duration / 60, 0);
    
    if (supervisionHours < requirements.supervisionHours) return;
    
    // All requirements met - advance level
    certification.level = nextLevel;
    certification.certificationDate = new Date();
    certification.status = 'active';
    
    // Set renewal date if applicable
    if (nextLevel === CertificationLevel.PROFESSIONAL) {
      const renewalDate = new Date();
      renewalDate.setFullYear(renewalDate.getFullYear() + 2);
      certification.renewalDate = renewalDate;
    }
    
    this.emit('levelAdvanced', { helperId, newLevel: nextLevel });
  }

  /**
   * Award achievement badges
   */
  private async checkAndAwardBadges(
    helperId: string,
    moduleId: string,
    score: number
  ): Promise<void> {
    const certification = this.getCertification(helperId);
    const badges: Badge[] = [];

    // Perfect score badge
    if (score === 100) {
      badges.push({
        id: `perfect-${moduleId}`,
        name: 'Perfect Score',
        description: 'Achieved 100% on a module assessment',
        icon: '🏆',
        category: 'achievement',
        earnedDate: new Date(),
        criteria: 'Score 100% on any module',
        rarity: 'uncommon'
      });
    }

    // First module completion
    if (certification.completedModules.length === 1) {
      badges.push({
        id: 'first-step',
        name: 'First Step',
        description: 'Completed your first training module',
        icon: '👣',
        category: 'milestone',
        earnedDate: new Date(),
        criteria: 'Complete first module',
        rarity: 'common'
      });
    }

    // Category master badges
    const moduleCategory = this.modules.get(moduleId)?.category;
    if (moduleCategory) {
      const categoryModules = Array.from(this.modules.values())
        .filter(m => m.category === moduleCategory);
      const completedInCategory = certification.completedModules
        .filter(cm => {
          const mod = this.modules.get(cm.moduleId);
          return mod?.category === moduleCategory;
        });
      
      if (completedInCategory.length === categoryModules.length) {
        badges.push({
          id: `master-${moduleCategory}`,
          name: `${moduleCategory.replace(/_/g, ' ')} Master`,
          description: `Completed all ${moduleCategory.replace(/_/g, ' ')} modules`,
          icon: '🎓',
          category: 'mastery',
          earnedDate: new Date(),
          criteria: `Complete all modules in ${moduleCategory}`,
          rarity: 'rare'
        });
      }
    }

    // Add badges to certification
    certification.badges.push(...badges);
    
    if (badges.length > 0) {
      this.emit('badgesAwarded', { helperId, badges });
    }
  }

  /**
   * Get next certification level
   */
  private getNextLevel(currentLevel: CertificationLevel): CertificationLevel | undefined {
    switch (currentLevel) {
      case CertificationLevel.PEER:
        return CertificationLevel.TRAINED;
      case CertificationLevel.TRAINED:
        return CertificationLevel.PROFESSIONAL;
      default:
        return undefined;
    }
  }

  /**
   * Calculate current learning streak
   */
  private calculateStreak(certification: HelperCertification): number {
    if (certification.completedModules.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completionDates = certification.completedModules
      .map(m => {
        const date = new Date(m.completionDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = today.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (const dateMs of completionDates) {
      if (dateMs === currentDate || dateMs === currentDate - oneDayMs) {
        streak++;
        currentDate = dateMs;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Identify helper strengths based on performance
   */
  private identifyStrengths(certification: HelperCertification): string[] {
    const strengths: string[] = [];
    const categoryScores: Record<string, number[]> = {};
    
    certification.completedModules.forEach(cm => {
      const module = this.modules.get(cm.moduleId);
      if (module) {
        if (!categoryScores[module.category]) {
          categoryScores[module.category] = [];
        }
        categoryScores[module.category].push(cm.score);
      }
    });
    
    Object.entries(categoryScores).forEach(([category, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore >= 85) {
        strengths.push(category.replace(/_/g, ' '));
      }
    });
    
    return strengths;
  }

  /**
   * Identify areas for improvement
   */
  private identifyAreasForImprovement(certification: HelperCertification): string[] {
    const areas: string[] = [];
    const requirements = CERTIFICATION_REQUIREMENTS[certification.level];
    
    // Check missing categories
    const completedCategories = new Set(
      certification.completedModules
        .map(cm => this.modules.get(cm.moduleId)?.category)
        .filter(Boolean)
    );
    
    requirements.requiredCategories.forEach(cat => {
      if (!completedCategories.has(cat)) {
        areas.push(`Complete ${cat.replace(/_/g, ' ')} training`);
      }
    });
    
    // Check low scores
    const categoryScores: Record<string, number[]> = {};
    certification.completedModules.forEach(cm => {
      const module = this.modules.get(cm.moduleId);
      if (module) {
        if (!categoryScores[module.category]) {
          categoryScores[module.category] = [];
        }
        categoryScores[module.category].push(cm.score);
      }
    });
    
    Object.entries(categoryScores).forEach(([category, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore < 75) {
        areas.push(`Improve ${category.replace(/_/g, ' ')} skills`);
      }
    });
    
    return areas;
  }

  /**
   * Get personalized module recommendations
   */
  private getRecommendedModules(helperId: string): string[] {
    const certification = this.getCertification(helperId);
    const completedIds = new Set(certification.completedModules.map(m => m.moduleId));
    const recommendations: string[] = [];
    
    // Get next level requirements
    const nextLevel = this.getNextLevel(certification.level);
    if (nextLevel) {
      const requirements = CERTIFICATION_REQUIREMENTS[nextLevel];
      
      // Recommend modules for missing categories
      const completedCategories = new Set(
        certification.completedModules
          .map(cm => this.modules.get(cm.moduleId)?.category)
          .filter(Boolean)
      );
      
      Array.from(this.modules.values()).forEach(module => {
        if (!completedIds.has(module.id) && 
            module.isActive &&
            requirements.requiredCategories.includes(module.category) &&
            !completedCategories.has(module.category)) {
          recommendations.push(module.id);
        }
      });
    }
    
    // Recommend based on prerequisites
    Array.from(this.modules.values()).forEach(module => {
      if (!completedIds.has(module.id) && 
          module.isActive &&
          module.prerequisites.every(prereq => completedIds.has(prereq))) {
        if (!recommendations.includes(module.id)) {
          recommendations.push(module.id);
        }
      }
    });
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Estimate completion date based on current pace
   */
  private estimateCompletionDate(certification: HelperCertification): Date | undefined {
    if (certification.completedModules.length < 2) {
      return undefined; // Not enough data
    }
    
    const completionDates = certification.completedModules
      .map(m => m.completionDate.getTime())
      .sort((a, b) => a - b);
    
    const firstDate = completionDates[0];
    const lastDate = completionDates[completionDates.length - 1];
    const daysPassed = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const modulesCompleted = certification.completedModules.length;
    const averageDaysPerModule = daysPassed / modulesCompleted;
    
    const nextLevel = this.getNextLevel(certification.level);
    if (!nextLevel) return undefined;
    
    const requirements = CERTIFICATION_REQUIREMENTS[nextLevel];
    const remainingModules = requirements.minModules - modulesCompleted;
    
    if (remainingModules <= 0) return new Date(); // Already complete
    
    const estimatedDays = remainingModules * averageDaysPerModule;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + Math.ceil(estimatedDays));
    
    return estimatedDate;
  }

  /**
   * Generate personalized learning path
   */
  private async generateLearningPath(helperId: string): Promise<LearningPath> {
    const certification = this.getCertification(helperId);
    const completedIds = new Set(certification.completedModules.map(m => m.moduleId));
    
    // Create milestones based on certification levels
    const milestones: Milestone[] = [];
    
    if (certification.level === CertificationLevel.PEER) {
      milestones.push({
        id: 'milestone-trained',
        title: 'Achieve Trained Helper Status',
        description: 'Complete core training modules and assessments',
        requiredModules: Array.from(this.modules.values())
          .filter(m => m.requiredForLevel === CertificationLevel.TRAINED)
          .map(m => m.id),
        targetDate: this.estimateCompletionDate(certification) || new Date(),
        completed: false
      });
    }
    
    // Generate recommended sequence
    const recommendedSequence = this.generateModuleSequence(helperId);
    
    const learningPath: LearningPath = {
      id: `path-${helperId}`,
      helperId,
      goals: [
        'Develop core helping skills',
        'Build crisis intervention capabilities',
        'Enhance cultural competency',
        'Master ethical boundaries'
      ],
      milestones,
      recommendedSequence,
      adaptiveAdjustments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return learningPath;
  }

  /**
   * Generate optimal module sequence based on prerequisites
   */
  private generateModuleSequence(helperId: string): string[] {
    const certification = this.getCertification(helperId);
    const completedIds = new Set(certification.completedModules.map(m => m.moduleId));
    const sequence: string[] = [];
    const remaining = new Set(
      Array.from(this.modules.values())
        .filter(m => m.isActive && !completedIds.has(m.id))
        .map(m => m.id)
    );
    
    // Topological sort based on prerequisites
    while (remaining.size > 0) {
      let added = false;
      
      for (const moduleId of remaining) {
        const module = this.modules.get(moduleId);
        if (!module) continue;
        
        const prereqsMet = module.prerequisites.every(
          prereq => completedIds.has(prereq) || sequence.includes(prereq)
        );
        
        if (prereqsMet) {
          sequence.push(moduleId);
          remaining.delete(moduleId);
          added = true;
          break;
        }
      }
      
      // If no module can be added, add one without unmet prerequisites
      if (!added && remaining.size > 0) {
        const next = remaining.values().next().value;
        sequence.push(next);
        remaining.delete(next);
      }
    }
    
    return sequence;
  }

  /**
   * Record supervision hours
   */
  public async addSupervisionHours(
    helperId: string,
    record: Omit<SupervisionRecord, 'id'>
  ): Promise<void> {
    const certification = this.getCertification(helperId);
    const supervisionRecord: SupervisionRecord = {
      ...record,
      id: `supervision-${Date.now()}`
    };
    
    certification.supervisionHours.push(supervisionRecord);
    await this.updateProgress(helperId);
    
    this.emit('supervisionRecorded', { helperId, record: supervisionRecord });
  }

  /**
   * Add continuing education record
   */
  public async addContinuingEducation(
    helperId: string,
    record: Omit<ContinuingEducationRecord, 'id'>
  ): Promise<void> {
    const certification = this.getCertification(helperId);
    const educationRecord: ContinuingEducationRecord = {
      ...record,
      id: `ce-${Date.now()}`
    };
    
    certification.continuingEducation.push(educationRecord);
    
    this.emit('continuingEducationAdded', { helperId, record: educationRecord });
  }

  /**
   * Verify external credential
   */
  public async verifyCredential(
    helperId: string,
    credentialId: string,
    status: 'verified' | 'rejected'
  ): Promise<void> {
    const certification = this.getCertification(helperId);
    const credential = certification.credentials.find(c => c.id === credentialId);
    
    if (credential) {
      credential.verificationStatus = status;
      this.emit('credentialVerified', { helperId, credentialId, status });
    }
  }

  /**
   * Generate certificate for completed module
   */
  public async generateCertificate(
    helperId: string,
    moduleId: string
  ): Promise<string> {
    const certification = this.getCertification(helperId);
    const completedModule = certification.completedModules.find(
      cm => cm.moduleId === moduleId
    );
    
    if (!completedModule || !completedModule.verified) {
      throw new Error('Module not completed or not verified');
    }
    
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }
    
    // Generate certificate ID
    const certificateId = `cert-${helperId}-${moduleId}-${Date.now()}`;
    completedModule.certificateId = certificateId;
    
    // In production, this would generate a PDF or similar
    const certificateUrl = `/certificates/${certificateId}.pdf`;
    
    this.emit('certificateGenerated', { helperId, moduleId, certificateId });
    
    return certificateUrl;
  }

  /**
   * Get training progress for a helper
   */
  public getProgress(helperId: string): TrainingProgress | undefined {
    return this.progress.get(helperId);
  }

  /**
   * Export certification data for reporting
   */
  public exportCertificationData(helperId: string): any {
    const certification = this.getCertification(helperId);
    const progress = this.getProgress(helperId);
    
    return {
      certification,
      progress,
      exportDate: new Date(),
      format: 'v1.0'
    };
  }
}

// Export singleton instance
export const certificationService = CertificationService.getInstance();