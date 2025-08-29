/**
 * AI Safety Guardrails Service
 * 
 * Comprehensive safety system for AI therapy interactions including
 * harm prevention, boundary enforcement, and ethical guidelines.
 */

// Event handling will be managed internally without EventEmitter

// ============================
// Type Definitions
// ============================

export interface SafetyCheckResult {
  safe: boolean;
  violations: SafetyViolation[];
  warnings: SafetyWarning[];
  recommendations: string[];
  requiresHumanReview: boolean;
  blockResponse: boolean;
  modifiedContent?: string;
}

export interface SafetyViolation {
  type: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: string;
  timestamp: Date;
  action: 'block' | 'modify' | 'warn' | 'escalate';
}

export interface SafetyWarning {
  type: string;
  message: string;
  recommendation: string;
}

export type ViolationType = 
  | 'harmful_content'
  | 'medical_advice'
  | 'legal_advice'
  | 'boundary_violation'
  | 'personal_information'
  | 'inappropriate_relationship'
  | 'crisis_mishandling'
  | 'discrimination'
  | 'misinformation'
  | 'manipulation'
  | 'unethical_suggestion';

export interface EthicalGuideline {
  id: string;
  category: string;
  principle: string;
  description: string;
  examples: string[];
  violations: string[];
}

export interface BoundaryRule {
  id: string;
  type: 'professional' | 'therapeutic' | 'personal' | 'technical';
  rule: string;
  rationale: string;
  enforcement: 'strict' | 'flexible';
  exceptions?: string[];
}

export interface ContentFilter {
  id: string;
  name: string;
  patterns: RegExp[];
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'block' | 'modify' | 'warn';
  replacement?: string;
}

export interface SafetyMetrics {
  totalChecks: number;
  violations: number;
  warnings: number;
  blocked: number;
  modified: number;
  escalated: number;
  falsePositives: number;
  lastUpdated: Date;
}

// ============================
// Safety Rules and Guidelines
// ============================

const ETHICAL_GUIDELINES: EthicalGuideline[] = [
  {
    id: 'beneficence',
    category: 'core_principles',
    principle: 'Beneficence and Non-Maleficence',
    description: 'Act in the best interest of the user and do no harm',
    examples: [
      'Providing supportive, empathetic responses',
      'Offering evidence-based coping strategies',
      'Encouraging professional help when needed'
    ],
    violations: [
      'Suggesting harmful behaviors',
      'Minimizing serious mental health concerns',
      'Providing false hope or guarantees'
    ]
  },
  {
    id: 'autonomy',
    category: 'core_principles',
    principle: 'Respect for Autonomy',
    description: 'Respect user choices and promote informed decision-making',
    examples: [
      'Presenting options without coercion',
      'Respecting user preferences',
      'Supporting self-determination'
    ],
    violations: [
      'Making decisions for the user',
      'Manipulating user choices',
      'Ignoring user preferences'
    ]
  },
  {
    id: 'boundaries',
    category: 'professional',
    principle: 'Professional Boundaries',
    description: 'Maintain appropriate therapeutic boundaries',
    examples: [
      'Keeping focus on therapeutic goals',
      'Maintaining professional language',
      'Referring to human professionals when appropriate'
    ],
    violations: [
      'Developing personal relationships',
      'Sharing AI "personal" experiences',
      'Making promises about outcomes'
    ]
  },
  {
    id: 'confidentiality',
    category: 'privacy',
    principle: 'Confidentiality and Privacy',
    description: 'Protect user information and maintain confidentiality',
    examples: [
      'Not storing unnecessary personal information',
      'Protecting user data',
      'Explaining limits of confidentiality'
    ],
    violations: [
      'Sharing user information',
      'Requesting unnecessary personal details',
      'Storing identifiable information without consent'
    ]
  },
  {
    id: 'competence',
    category: 'professional',
    principle: 'Professional Competence',
    description: 'Operate within scope of AI capabilities',
    examples: [
      'Acknowledging AI limitations',
      'Referring to human professionals for complex cases',
      'Providing evidence-based information'
    ],
    violations: [
      'Claiming human-level understanding',
      'Diagnosing mental health conditions',
      'Prescribing medications'
    ]
  }
];

const BOUNDARY_RULES: BoundaryRule[] = [
  {
    id: 'no_diagnosis',
    type: 'professional',
    rule: 'Never provide medical or psychiatric diagnoses',
    rationale: 'Diagnosis requires professional medical training and in-person assessment',
    enforcement: 'strict'
  },
  {
    id: 'no_medication',
    type: 'professional',
    rule: 'Never recommend, prescribe, or advise on medications',
    rationale: 'Medication management requires medical supervision',
    enforcement: 'strict'
  },
  {
    id: 'crisis_referral',
    type: 'therapeutic',
    rule: 'Always refer crisis situations to appropriate emergency services',
    rationale: 'Crisis situations require immediate professional intervention',
    enforcement: 'strict'
  },
  {
    id: 'no_personal_relationship',
    type: 'personal',
    rule: 'Maintain professional therapeutic relationship boundaries',
    rationale: 'Personal relationships compromise therapeutic effectiveness',
    enforcement: 'strict'
  },
  {
    id: 'scope_limitation',
    type: 'technical',
    rule: 'Acknowledge AI limitations and defer to human judgment',
    rationale: 'AI cannot replace human clinical judgment',
    enforcement: 'strict'
  },
  {
    id: 'mandatory_reporting',
    type: 'professional',
    rule: 'Flag content requiring mandatory reporting',
    rationale: 'Legal and ethical obligations for safety',
    enforcement: 'strict',
    exceptions: ['Anonymous users where reporting is not possible']
  }
];

const HARMFUL_CONTENT_FILTERS: ContentFilter[] = [
  {
    id: 'suicide_methods',
    name: 'Suicide Method Filter',
    patterns: [
      /how to (kill|end|commit suicide)/gi,
      /suicide (method|technique|way)/gi,
      /painless way to die/gi,
      /best way to (kill|end life)/gi
    ],
    category: 'critical_harm',
    severity: 'critical',
    action: 'block',
    replacement: 'I cannot and will not provide information about suicide methods. If you\'re having thoughts of suicide, please reach out for help immediately: Call 988 for the Suicide & Crisis Lifeline or text HOME to 741741.'
  },
  {
    id: 'self_harm_instruction',
    name: 'Self-Harm Instruction Filter',
    patterns: [
      /how to (cut|hurt|harm) (myself|yourself)/gi,
      /self[\s-]?harm (technique|method)/gi,
      /where to cut/gi
    ],
    category: 'critical_harm',
    severity: 'critical',
    action: 'block',
    replacement: 'I cannot provide information about self-harm. If you\'re struggling with urges to hurt yourself, please reach out for support: Call 988 or text HOME to 741741. There are healthier ways to cope with emotional pain.'
  },
  {
    id: 'violence_planning',
    name: 'Violence Planning Filter',
    patterns: [
      /how to (hurt|harm|kill) (someone|others|them)/gi,
      /planning to (attack|hurt|harm)/gi,
      /revenge plan/gi
    ],
    category: 'violence',
    severity: 'critical',
    action: 'block',
    replacement: 'I cannot assist with plans to harm others. If you\'re having violent thoughts, please seek immediate professional help. These feelings can be addressed safely with proper support.'
  },
  {
    id: 'illegal_activity',
    name: 'Illegal Activity Filter',
    patterns: [
      /how to (obtain|get|buy) illegal/gi,
      /where to buy drugs/gi,
      /illegal substance/gi
    ],
    category: 'illegal',
    severity: 'high',
    action: 'block'
  },
  {
    id: 'medical_advice',
    name: 'Medical Advice Filter',
    patterns: [
      /should i (take|stop taking) (medication|medicine|pills)/gi,
      /what (medication|medicine|drug) should/gi,
      /diagnose (me|my)/gi,
      /do i have (depression|anxiety|bipolar|schizophrenia|ptsd)/gi
    ],
    category: 'medical',
    severity: 'high',
    action: 'modify',
    replacement: 'I cannot provide medical advice or diagnoses. Please consult with a qualified healthcare professional about medication and diagnostic concerns.'
  }
];

const PROFESSIONAL_BOUNDARY_FILTERS: ContentFilter[] = [
  {
    id: 'personal_contact',
    name: 'Personal Contact Filter',
    patterns: [
      /can i (have|get) your (number|email|contact)/gi,
      /meet in person/gi,
      /where do you live/gi,
      /what\'s your real name/gi
    ],
    category: 'boundary',
    severity: 'medium',
    action: 'modify',
    replacement: 'I\'m an AI therapy assistant and don\'t have personal contact information or meet in person. I\'m here to provide support within this platform.'
  },
  {
    id: 'romantic_interest',
    name: 'Romantic Interest Filter',
    patterns: [
      /i (love|like) you/gi,
      /do you (love|like) me/gi,
      /be my (girlfriend|boyfriend|partner)/gi,
      /romantic relationship/gi
    ],
    category: 'boundary',
    severity: 'medium',
    action: 'modify',
    replacement: 'I appreciate your openness, but as an AI therapy assistant, I\'m here to provide professional support. Let\'s focus on your wellbeing and therapeutic goals.'
  }
];

// ============================
// AI Safety Guardrails Service
// ============================

export class AISafetyGuardrailsService {
  private metrics: SafetyMetrics;
  private contentFilters: ContentFilter[];
  private boundaryRules: BoundaryRule[];
  private ethicalGuidelines: EthicalGuideline[];
  private violationHistory: Map<string, SafetyViolation[]> = new Map();
  
  constructor() {
    
    this.metrics = {
      totalChecks: 0,
      violations: 0,
      warnings: 0,
      blocked: 0,
      modified: 0,
      escalated: 0,
      falsePositives: 0,
      lastUpdated: new Date()
    };
    
    this.contentFilters = [
      ...HARMFUL_CONTENT_FILTERS,
      ...PROFESSIONAL_BOUNDARY_FILTERS
    ];
    
    this.boundaryRules = BOUNDARY_RULES;
    this.ethicalGuidelines = ETHICAL_GUIDELINES;
    
    this.initializeService();
  }
  
  private initializeService(): void {
    // Set up periodic metrics reporting
    setInterval(() => {
      this.reportMetrics();
    }, 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Perform comprehensive safety check on content
   */
  async checkSafety(
    content: string,
    context: {
      userId?: string;
      sessionId?: string;
      messageType: 'user' | 'ai';
      previousMessages?: string[];
      metadata?: any;
    }
  ): Promise<SafetyCheckResult> {
    this.metrics.totalChecks++;
    
    const violations: SafetyViolation[] = [];
    const warnings: SafetyWarning[] = [];
    const recommendations: string[] = [];
    
    // Check for harmful content
    const harmCheck = this.checkHarmfulContent(content);
    violations.push(...harmCheck.violations);
    
    // Check professional boundaries
    const boundaryCheck = this.checkBoundaries(content, context);
    violations.push(...boundaryCheck.violations);
    warnings.push(...boundaryCheck.warnings);
    
    // Check ethical guidelines
    const ethicsCheck = this.checkEthicalCompliance(content, context);
    violations.push(...ethicsCheck.violations);
    warnings.push(...ethicsCheck.warnings);
    
    // Check for personal information exposure
    const privacyCheck = this.checkPrivacy(content);
    violations.push(...privacyCheck.violations);
    warnings.push(...privacyCheck.warnings);
    
    // Check for crisis mishandling (AI responses only)
    if (context.messageType === 'ai') {
      const crisisCheck = this.checkCrisisHandling(content, context);
      violations.push(...crisisCheck.violations);
      recommendations.push(...crisisCheck.recommendations);
    }
    
    // Determine overall safety
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');
    
    const safe = criticalViolations.length === 0 && highViolations.length === 0;
    const blockResponse = criticalViolations.length > 0;
    const requiresHumanReview = criticalViolations.length > 0 || highViolations.length > 2;
    
    // Apply content modifications if needed
    let modifiedContent = content;
    if (!blockResponse && violations.some(v => v.action === 'modify')) {
      modifiedContent = this.applyContentModifications(content, violations);
    }
    
    // Update metrics
    if (violations.length > 0) this.metrics.violations += violations.length;
    if (warnings.length > 0) this.metrics.warnings += warnings.length;
    if (blockResponse) this.metrics.blocked++;
    if (modifiedContent !== content) this.metrics.modified++;
    if (requiresHumanReview) this.metrics.escalated++;
    
    // Store violation history
    if (context.userId) {
      const userViolations = this.violationHistory.get(context.userId) || [];
      userViolations.push(...violations);
      this.violationHistory.set(context.userId, userViolations);
    }
    
    // Log safety events
    if (!safe) {
      console.warn('Safety violation detected:', {
        violations,
        context,
        timestamp: new Date()
      });
    }
    
    return {
      safe,
      violations,
      warnings,
      recommendations,
      requiresHumanReview,
      blockResponse,
      modifiedContent: modifiedContent !== content ? modifiedContent : undefined
    };
  }
  
  /**
   * Check for harmful content
   */
  private checkHarmfulContent(content: string): {
    violations: SafetyViolation[];
  } {
    const violations: SafetyViolation[] = [];
    
    for (const filter of this.contentFilters) {
      for (const pattern of filter.patterns) {
        if (pattern.test(content)) {
          violations.push({
            type: this.mapFilterToViolationType(filter.category),
            severity: filter.severity,
            description: `Detected ${filter.name}`,
            context: content.substring(0, 200),
            timestamp: new Date(),
            action: filter.action
          });
          break; // One violation per filter is enough
        }
      }
    }
    
    return { violations };
  }
  
  /**
   * Check professional boundaries
   */
  private checkBoundaries(
    content: string,
    context: any
  ): {
    violations: SafetyViolation[];
    warnings: SafetyWarning[];
  } {
    const violations: SafetyViolation[] = [];
    const warnings: SafetyWarning[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check each boundary rule
    for (const rule of this.boundaryRules) {
      let violated = false;
      
      switch (rule.id) {
        case 'no_diagnosis':
          if (context.messageType === 'ai' && 
              /you (have|appear to have|seem to have) (depression|anxiety|bipolar|ptsd|adhd)/gi.test(content)) {
            violated = true;
          }
          break;
          
        case 'no_medication':
          if (context.messageType === 'ai' && 
              /(take|try|consider|use) (medication|medicine|drug|pill)/gi.test(content)) {
            violated = true;
          }
          break;
          
        case 'no_personal_relationship':
          if (/my (friend|best friend|partner|love)/gi.test(content) && context.messageType === 'ai') {
            warnings.push({
              type: 'boundary_risk',
              message: 'Potential boundary crossing detected',
              recommendation: 'Maintain professional therapeutic relationship'
            });
          }
          break;
      }
      
      if (violated) {
        violations.push({
          type: 'boundary_violation',
          severity: rule.enforcement === 'strict' ? 'high' : 'medium',
          description: `Violation of rule: ${rule.rule}`,
          context: content.substring(0, 200),
          timestamp: new Date(),
          action: rule.enforcement === 'strict' ? 'block' : 'modify'
        });
      }
    }
    
    return { violations, warnings };
  }
  
  /**
   * Check ethical compliance
   */
  private checkEthicalCompliance(
    content: string,
    context: any
  ): {
    violations: SafetyViolation[];
    warnings: SafetyWarning[];
  } {
    const violations: SafetyViolation[] = [];
    const warnings: SafetyWarning[] = [];
    
    // Check for discrimination or bias
    const discriminationPatterns = [
      /all (men|women|blacks|whites|asians|latinos) are/gi,
      /(stupid|inferior|superior) (race|gender|ethnicity)/gi,
      /hate (men|women|blacks|whites|asians|latinos)/gi
    ];
    
    for (const pattern of discriminationPatterns) {
      if (pattern.test(content)) {
        violations.push({
          type: 'discrimination',
          severity: 'high',
          description: 'Discriminatory content detected',
          context: content.substring(0, 200),
          timestamp: new Date(),
          action: 'block'
        });
        break;
      }
    }
    
    // Check for manipulation (AI responses)
    if (context.messageType === 'ai') {
      const manipulationPatterns = [
        /you must/gi,
        /you have no choice/gi,
        /only option is/gi,
        /if you don\'t.*will happen/gi
      ];
      
      for (const pattern of manipulationPatterns) {
        if (pattern.test(content)) {
          warnings.push({
            type: 'potential_manipulation',
            message: 'Potentially coercive language detected',
            recommendation: 'Ensure user autonomy and present options'
          });
          break;
        }
      }
    }
    
    // Check for false promises (AI responses)
    if (context.messageType === 'ai') {
      const falsePromisePatterns = [
        /i (guarantee|promise) you\'ll/gi,
        /definitely (cure|fix|solve)/gi,
        /100% (better|effective|successful)/gi
      ];
      
      for (const pattern of falsePromisePatterns) {
        if (pattern.test(content)) {
          violations.push({
            type: 'misinformation',
            severity: 'medium',
            description: 'False promises or guarantees detected',
            context: content.substring(0, 200),
            timestamp: new Date(),
            action: 'modify'
          });
          break;
        }
      }
    }
    
    return { violations, warnings };
  }
  
  /**
   * Check for privacy violations
   */
  private checkPrivacy(content: string): {
    violations: SafetyViolation[];
    warnings: SafetyWarning[];
  } {
    const violations: SafetyViolation[] = [];
    const warnings: SafetyWarning[] = [];
    
    // Check for personal information patterns
    const personalInfoPatterns = {
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      address: /\d+\s+[\w\s]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln)/gi,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
    };
    
    for (const [type, pattern] of Object.entries(personalInfoPatterns)) {
      if (pattern.test(content)) {
        violations.push({
          type: 'personal_information',
          severity: type === 'ssn' || type === 'creditCard' ? 'high' : 'medium',
          description: `Personal information detected: ${type}`,
          context: 'Personal information redacted',
          timestamp: new Date(),
          action: 'modify'
        });
      }
    }
    
    // Check for requesting personal information (AI responses)
    if (content.toLowerCase().includes('what is your') || 
        content.toLowerCase().includes('tell me your')) {
      const sensitiveRequests = ['ssn', 'social security', 'credit card', 'bank account'];
      
      for (const request of sensitiveRequests) {
        if (content.toLowerCase().includes(request)) {
          violations.push({
            type: 'personal_information',
            severity: 'high',
            description: 'Requesting sensitive personal information',
            context: content.substring(0, 200),
            timestamp: new Date(),
            action: 'block'
          });
          break;
        }
      }
    }
    
    return { violations, warnings };
  }
  
  /**
   * Check crisis handling appropriateness (AI responses)
   */
  private checkCrisisHandling(
    content: string,
    context: any
  ): {
    violations: SafetyViolation[];
    recommendations: string[];
  } {
    const violations: SafetyViolation[] = [];
    const recommendations: string[] = [];
    
    // Check if AI is minimizing crisis
    const minimizingPatterns = [
      /it\'s not that bad/gi,
      /you\'re overreacting/gi,
      /just calm down/gi,
      /don\'t worry about it/gi,
      /everyone feels this way/gi
    ];
    
    // Check context for crisis indicators
    const previousMessages = context.previousMessages || [];
    const hasCrisisContext = previousMessages.some((msg: string) => 
      /suicide|kill myself|hurt myself|end it all/gi.test(msg)
    );
    
    if (hasCrisisContext) {
      for (const pattern of minimizingPatterns) {
        if (pattern.test(content)) {
          violations.push({
            type: 'crisis_mishandling',
            severity: 'high',
            description: 'Minimizing crisis situation',
            context: content.substring(0, 200),
            timestamp: new Date(),
            action: 'block'
          });
          break;
        }
      }
      
      // Check if crisis resources are mentioned
      const hasResources = /988|crisis|emergency|741741/gi.test(content);
      if (!hasResources) {
        recommendations.push('Include crisis resources in response');
      }
    }
    
    return { violations, recommendations };
  }
  
  /**
   * Apply content modifications based on violations
   */
  private applyContentModifications(
    content: string,
    violations: SafetyViolation[]
  ): string {
    let modified = content;
    
    // Apply filter replacements
    for (const violation of violations) {
      if (violation.action === 'modify') {
        // Find matching filter
        const filter = this.contentFilters.find(f => 
          f.patterns.some(p => p.test(content))
        );
        
        if (filter && filter.replacement) {
          // Replace matched content with safe alternative
          for (const pattern of filter.patterns) {
            modified = modified.replace(pattern, filter.replacement);
          }
        }
      }
    }
    
    // Redact personal information
    if (violations.some(v => v.type === 'personal_information')) {
      // Redact various personal information patterns
      modified = modified.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]');
      modified = modified.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE REDACTED]');
      modified = modified.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
      modified = modified.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CREDIT CARD REDACTED]');
    }
    
    return modified;
  }
  
  /**
   * Validate AI response before sending
   */
  async validateAIResponse(
    response: string,
    context: {
      userId?: string;
      sessionId?: string;
      userMessage?: string;
      conversationHistory?: string[];
    }
  ): Promise<{
    valid: boolean;
    modifiedResponse?: string;
    reason?: string;
  }> {
    const safetyCheck = await this.checkSafety(response, {
      ...context,
      messageType: 'ai',
      previousMessages: context.conversationHistory
    });
    
    if (safetyCheck.blockResponse) {
      return {
        valid: false,
        reason: 'Response contains unsafe content and was blocked'
      };
    }
    
    if (safetyCheck.modifiedContent) {
      return {
        valid: true,
        modifiedResponse: safetyCheck.modifiedContent
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if user input requires immediate intervention
   */
  async checkUserInputForCrisis(
    input: string,
    userId?: string
  ): Promise<{
    requiresIntervention: boolean;
    interventionType?: 'emergency' | 'crisis' | 'warning';
    suggestedActions?: string[];
  }> {
    const lowerInput = input.toLowerCase();
    
    // Check for immediate danger
    const emergencyPatterns = [
      /i (am|will) kill myself (now|today|tonight)/gi,
      /have a (gun|knife|pills) ready/gi,
      /goodbye forever/gi,
      /this is my last/gi
    ];
    
    for (const pattern of emergencyPatterns) {
      if (pattern.test(input)) {
        return {
          requiresIntervention: true,
          interventionType: 'emergency',
          suggestedActions: [
            'Call 911 immediately',
            'Contact crisis hotline: 988',
            'Alert emergency contacts',
            'Initiate welfare check'
          ]
        };
      }
    }
    
    // Check for crisis indicators
    const crisisPatterns = [
      /want to die/gi,
      /planning to hurt myself/gi,
      /can\'t go on/gi,
      /no reason to live/gi
    ];
    
    for (const pattern of crisisPatterns) {
      if (pattern.test(input)) {
        return {
          requiresIntervention: true,
          interventionType: 'crisis',
          suggestedActions: [
            'Provide crisis resources',
            'Engage safety planning',
            'Increase check-in frequency',
            'Consider professional referral'
          ]
        };
      }
    }
    
    // Check for warning signs
    const warningPatterns = [
      /feeling hopeless/gi,
      /burden to everyone/gi,
      /trapped/gi,
      /unbearable pain/gi
    ];
    
    for (const pattern of warningPatterns) {
      if (pattern.test(input)) {
        return {
          requiresIntervention: true,
          interventionType: 'warning',
          suggestedActions: [
            'Monitor closely',
            'Provide coping resources',
            'Check in regularly',
            'Document in session notes'
          ]
        };
      }
    }
    
    return { requiresIntervention: false };
  }
  
  /**
   * Get safety recommendations for session
   */
  getSafetyRecommendations(
    sessionHistory: any[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];
    
    switch (riskLevel) {
      case 'critical':
        recommendations.push(
          'Immediate professional intervention required',
          'Contact emergency services if needed',
          'Implement safety plan immediately',
          'Continuous monitoring required'
        );
        break;
        
      case 'high':
        recommendations.push(
          'Increase session frequency',
          'Develop comprehensive safety plan',
          'Consider psychiatric evaluation',
          'Engage support network'
        );
        break;
        
      case 'moderate':
        recommendations.push(
          'Regular safety assessments',
          'Teach coping strategies',
          'Monitor for escalation',
          'Consider group therapy'
        );
        break;
        
      case 'low':
        recommendations.push(
          'Continue regular sessions',
          'Build resilience factors',
          'Preventive skill building',
          'Maintain therapeutic alliance'
        );
        break;
    }
    
    return recommendations;
  }
  
  /**
   * Map filter category to violation type
   */
  private mapFilterToViolationType(category: string): ViolationType {
    const mapping: { [key: string]: ViolationType } = {
      'critical_harm': 'harmful_content',
      'violence': 'harmful_content',
      'illegal': 'harmful_content',
      'medical': 'medical_advice',
      'legal': 'legal_advice',
      'boundary': 'boundary_violation',
      'privacy': 'personal_information',
      'discrimination': 'discrimination'
    };
    
    return mapping[category] || 'harmful_content';
  }
  
  /**
   * Report false positive
   */
  reportFalsePositive(
    violationId: string,
    reason: string
  ): void {
    this.metrics.falsePositives++;
    
    console.log('False positive reported:', {
      violationId,
      reason,
      timestamp: new Date()
    });
  }
  
  /**
   * Get user violation history
   */
  getUserViolationHistory(userId: string): SafetyViolation[] {
    return this.violationHistory.get(userId) || [];
  }
  
  /**
   * Clear user violation history
   */
  clearUserViolationHistory(userId: string): void {
    this.violationHistory.delete(userId);
  }
  
  /**
   * Get safety metrics
   */
  getMetrics(): SafetyMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Report metrics
   */
  private reportMetrics(): void {
    this.metrics.lastUpdated = new Date();
    
    // Metrics reported internally
    
    // Log metrics for monitoring
    console.log('Safety Metrics Report:', {
      totalChecks: this.metrics.totalChecks,
      violationRate: (this.metrics.violations / Math.max(1, this.metrics.totalChecks) * 100).toFixed(2) + '%',
      blockRate: (this.metrics.blocked / Math.max(1, this.metrics.totalChecks) * 100).toFixed(2) + '%',
      falsePositiveRate: (this.metrics.falsePositives / Math.max(1, this.metrics.violations) * 100).toFixed(2) + '%'
    });
  }
  
  /**
   * Update content filters
   */
  addContentFilter(filter: ContentFilter): void {
    this.contentFilters.push(filter);
    
    console.log('Content filter added:', filter.id);
  }
  
  /**
   * Remove content filter
   */
  removeContentFilter(filterId: string): void {
    const index = this.contentFilters.findIndex(f => f.id === filterId);
    if (index !== -1) {
      const removed = this.contentFilters.splice(index, 1)[0];
      console.log('Content filter removed:', removed.id);
    }
  }
  
  /**
   * Add boundary rule
   */
  addBoundaryRule(rule: BoundaryRule): void {
    this.boundaryRules.push(rule);
    
    console.log('Boundary rule added:', rule.id);
  }
  
  /**
   * Get all ethical guidelines
   */
  getEthicalGuidelines(): EthicalGuideline[] {
    return [...this.ethicalGuidelines];
  }
  
  /**
   * Get all boundary rules
   */
  getBoundaryRules(): BoundaryRule[] {
    return [...this.boundaryRules];
  }
  
  /**
   * Export safety configuration
   */
  exportConfiguration(): {
    filters: ContentFilter[];
    boundaries: BoundaryRule[];
    guidelines: EthicalGuideline[];
  } {
    return {
      filters: [...this.contentFilters],
      boundaries: [...this.boundaryRules],
      guidelines: [...this.ethicalGuidelines]
    };
  }
}

// Export singleton instance
export const aiSafetyGuardrails = new AISafetyGuardrailsService();
export default aiSafetyGuardrails;