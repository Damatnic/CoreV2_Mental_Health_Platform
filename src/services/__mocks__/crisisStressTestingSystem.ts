/**
 * Advanced Mock Crisis Stress Testing System
 *
 * World-class comprehensive mock system for crisis stress testing with:
 * - Advanced crisis scenario simulation with cultural/linguistic variations
 * - High-volume load testing capabilities for realistic crisis loads
 * - Professional escalation pathway testing and validation
 * - Real-time system resilience testing under extreme crisis conditions
 * - Data integrity validation during crisis events
 * - Emergency protocol testing with comprehensive mock data generation
 * - Performance benchmarking infrastructure for mental health platforms
 *
 * @fileoverview Advanced mock crisis stress testing system for comprehensive validation
 * @version 3.0.0
 * @author Mental Health Platform Crisis Testing Team
 */

import { logger } from '../../utils/logger';

// Core crisis detection and response interfaces
export interface CrisisContext {
  userId: string;
  sessionId: string;
  timestamp: Date;
  location?: {
    country: string;
    timezone: string;
    culturalContext: string;
  };
  userProfile: {
    age: number;
    language: string;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    previousCrises: number;
    supportNetwork: string[];
    therapeuticHistory: string[];
  };
  deviceContext: {
    platform: 'web' | 'mobile' | 'desktop';
    connectivity: 'online' | 'offline' | 'limited';
    batteryLevel?: number;
  };
}

/**
 * Enhanced crisis test scenario severity levels with clinical precision
 */
export type CrisisTestSeverity = 'low' | 'moderate' | 'high' | 'critical' | 'catastrophic';

/**
 * Cultural crisis pattern types for international support
 */
export type CulturalCrisisPattern = 
  | 'western-direct'
  | 'asian-indirect'
  | 'hispanic-family-centered'
  | 'african-community-focused'
  | 'middle-eastern-honor-based'
  | 'indigenous-spiritual'
  | 'nordic-stoic';

/**
 * Crisis intervention response types
 */
export type CrisisResponseType =
  | 'immediate-emergency'
  | 'urgent-professional'
  | 'scheduled-support'
  | 'peer-connection'
  | 'self-guided-resources'
  | 'family-notification'
  | 'cultural-liaison'
  | 'linguistic-support';

/**
 * Professional escalation levels
 */
export type EscalationLevel =
  | 'ai-response'
  | 'peer-counselor'
  | 'licensed-therapist'
  | 'crisis-specialist'
  | 'psychiatric-emergency'
  | 'emergency-services'
  | 'law-enforcement'
  | 'medical-intervention';

/**
 * Comprehensive test scenario types for crisis system validation
 */
export type TestScenarioType = 
  | 'load-test' 
  | 'stress-test' 
  | 'spike-test' 
  | 'volume-test' 
  | 'endurance-test'
  | 'failover-test'
  | 'cultural-variation-test'
  | 'linguistic-accuracy-test'
  | 'escalation-pathway-test'
  | 'data-integrity-test'
  | 'real-time-resilience-test'
  | 'emergency-protocol-test'
  | 'cross-platform-test'
  | 'offline-capability-test'
  | 'concurrent-crisis-test'
  | 'cascade-failure-test';

/**
 * Advanced crisis test scenario interface with comprehensive validation
 */
export interface CrisisTestScenario {
  id: string;
  name: string;
  description: string;
  type: TestScenarioType;
  severity: CrisisTestSeverity;
  duration: number; // milliseconds
  targetComponents: string[];
  expectedOutcome: string;
  failureConditions: string[];
  recoveryTime: number; // milliseconds
  culturalVariations: CulturalCrisisPattern[];
  linguisticRequirements: {
    languages: string[];
    culturalNuances: Record<string, string[]>;
    translationAccuracy: number; // percentage
  };
  escalationPathways: {
    level: EscalationLevel;
    triggerConditions: string[];
    maxResponseTime: number; // milliseconds
    requiredCapabilities: string[];
  }[];
  dataIntegrityChecks: {
    personalData: string[];
    sessionState: string[];
    crisisHistory: string[];
    complianceRequirements: string[];
  };
  realTimeRequirements: {
    maxLatency: number; // milliseconds
    concurrentUsers: number;
    throughputThreshold: number; // requests/second
    availabilityTarget: number; // percentage
  };
  emergencyProtocols: {
    protocolType: string;
    activationTriggers: string[];
    requiredActions: string[];
    timeConstraints: number; // milliseconds
    validationCriteria: string[];
  }[];
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    riskLevel: number; // 1-10
    complianceLevel: 'basic' | 'enhanced' | 'clinical';
    testEnvironment: 'dev' | 'staging' | 'prod-like';
    simulatedUsers: number;
    geographicScope: string[];
    timeZoneCoverage: string[];
    [key: string]: any;
  };
}

/**
 * Advanced load testing configuration with crisis-specific parameters
 */
export interface LoadTestConfig {
  virtualUsers: number;
  rampUpTime: number; // seconds
  testDuration: number; // seconds
  requestsPerSecond: number;
  crisisLoadProfile: {
    baselineUsers: number;
    peakMultiplier: number;
    crisisSpikeDuration: number; // seconds
    recoveryTime: number; // seconds
    sustainedHighLoad: number; // percentage of peak
  };
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    weight: number; // percentage of requests
    expectedResponseTime: number; // milliseconds
    crisisSpecific: boolean;
    escalationTrigger?: boolean;
    dataIntegrityRequired: boolean;
    culturalContext?: CulturalCrisisPattern;
  }>;
  thresholds: {
    responseTime: {
      average: number;
      p95: number;
      p99: number;
      crisis: number; // stricter threshold for crisis endpoints
    };
    errorRate: {
      general: number; // percentage
      crisis: number; // much lower for crisis scenarios
    };
    throughput: {
      minimum: number; // requests/second
      target: number;
      crisis: number; // higher requirement during crisis
    };
    availability: number; // percentage uptime required
  };
  failureSimulation: {
    networkLatency: number; // milliseconds
    packetLoss: number; // percentage
    connectionTimeouts: number; // percentage
    serverFailures: number; // percentage
    databaseSlowdowns: number; // percentage
  };
  culturalTesting: {
    multiLanguage: boolean;
    culturalPatterns: CulturalCrisisPattern[];
    timeZoneDistribution: string[];
    localizedContent: boolean;
  };
}

/**
 * Comprehensive performance benchmark with crisis-specific metrics
 */
export interface PerformanceBenchmark {
  id: string;
  name: string;
  component: string;
  metric: 
    | 'response-time' 
    | 'throughput' 
    | 'error-rate' 
    | 'cpu-usage' 
    | 'memory-usage'
    | 'crisis-detection-accuracy'
    | 'escalation-speed'
    | 'cultural-sensitivity'
    | 'data-integrity'
    | 'availability'
    | 'recovery-time';
  baseline: number;
  target: number;
  threshold: {
    warning: number;
    critical: number;
    emergency: number;
  };
  unit: string;
  timestamp: string;
  severity: CrisisTestSeverity;
  complianceRequired: boolean;
  culturalVariations?: Record<CulturalCrisisPattern, number>;
  escalationLevelImpact?: Record<EscalationLevel, number>;
  realTimeRequirement: boolean;
  dataIntegrityImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Comprehensive test execution result with detailed crisis analytics
 */
export interface TestExecutionResult {
  scenarioId: string;
  executionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'passed' | 'failed' | 'error' | 'timeout' | 'degraded' | 'critical-failure';
  metrics: {
    responseTime: {
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
      p999: number;
    };
    throughput: {
      requests: number;
      peak: number;
      sustained: number;
    };
    errorRate: {
      total: number;
      critical: number;
      byComponent: Record<string, number>;
    };
    successRate: {
      overall: number;
      crisisDetection: number;
      escalationAccuracy: number;
    };
    crisisSpecific: {
      detectionAccuracy: number;
      falsePositiveRate: number;
      falseNegativeRate: number;
      escalationTime: number;
      culturalSensitivity: number;
      linguisticAccuracy: number;
    };
    dataIntegrity: {
      personalDataProtection: number;
      sessionConsistency: number;
      crisisHistoryAccuracy: number;
      complianceValidation: number;
    };
    systemResilience: {
      availabilityScore: number;
      failoverTime: number;
      recoveryTime: number;
      degradationHandling: number;
    };
  };
  errors: Array<{
    type: 'system' | 'data' | 'security' | 'compliance' | 'cultural' | 'linguistic';
    severity: CrisisTestSeverity;
    message: string;
    component: string;
    count: number;
    timestamp: string;
    impact: 'none' | 'minimal' | 'moderate' | 'severe' | 'critical';
    resolution?: string;
  }>;
  culturalResults: Array<{
    pattern: CulturalCrisisPattern;
    accuracy: number;
    responseTime: number;
    culturalSensitivity: number;
    issues: string[];
  }>;
  escalationResults: Array<{
    level: EscalationLevel;
    triggered: boolean;
    responseTime: number;
    accuracy: number;
    professionalReady: boolean;
  }>;
  protocolValidation: Array<{
    protocol: string;
    executed: boolean;
    compliance: number;
    timing: number;
    effectiveness: number;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    component: string;
    message: string;
    metadata?: Record<string, any>;
  }>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    compliance: string[];
  };
  complianceReport: {
    hipaaCompliant: boolean;
    gdprCompliant: boolean;
    localRegulations: Record<string, boolean>;
    auditTrail: string[];
  };
}

/**
 * Comprehensive crisis stress testing scenarios with cultural and linguistic variations
 */
const ADVANCED_CRISIS_TEST_SCENARIOS: CrisisTestScenario[] = [
  {
    id: 'scenario-001-mass-crisis-detection',
    name: 'Mass Crisis Event Detection',
    description: 'Test system response to simultaneous crisis events with cultural sensitivity',
    type: 'concurrent-crisis-test',
    severity: 'catastrophic',
    duration: 45000, // 45 seconds
    targetComponents: [
      'crisis-detection-engine',
      'cultural-context-analyzer', 
      'emergency-escalation-system',
      'notification-dispatcher',
      'data-integrity-validator'
    ],
    expectedOutcome: 'All crisis requests processed within 1.5 seconds with 99.9% accuracy',
    failureConditions: [
      'Response time > 3 seconds',
      'Error rate > 0.1%',
      'False negative > 0.01%',
      'Cultural insensitivity detected'
    ],
    recoveryTime: 3000, // 3 seconds
    culturalVariations: [
      'western-direct',
      'asian-indirect', 
      'hispanic-family-centered',
      'african-community-focused',
      'indigenous-spiritual'
    ],
    linguisticRequirements: {
      languages: ['en', 'es', 'zh', 'ar', 'hi', 'fr', 'de', 'pt', 'ru', 'ja'],
      culturalNuances: {
        'western-direct': ['explicit language', 'individual focus'],
        'asian-indirect': ['metaphorical expression', 'family honor concerns'],
        'hispanic-family-centered': ['family involvement', 'religious context'],
        'african-community-focused': ['community support', 'collective healing'],
        'indigenous-spiritual': ['spiritual context', 'traditional healing']
      },
      translationAccuracy: 99.5
    },
    escalationPathways: [
      {
        level: 'ai-response',
        triggerConditions: ['initial assessment', 'language processing'],
        maxResponseTime: 500,
        requiredCapabilities: ['multilingual NLP', 'cultural awareness']
      },
      {
        level: 'crisis-specialist',
        triggerConditions: ['high risk detected', 'immediate danger'],
        maxResponseTime: 2000,
        requiredCapabilities: ['professional training', 'crisis intervention']
      },
      {
        level: 'emergency-services',
        triggerConditions: ['imminent danger', 'location available'],
        maxResponseTime: 1000,
        requiredCapabilities: ['emergency dispatch', 'GPS coordination']
      }
    ],
    dataIntegrityChecks: {
      personalData: ['PII encryption', 'HIPAA compliance', 'access logging'],
      sessionState: ['crisis context preservation', 'intervention continuity'],
      crisisHistory: ['previous episodes', 'treatment history', 'risk factors'],
      complianceRequirements: ['audit trail', 'data retention', 'consent validation']
    },
    realTimeRequirements: {
      maxLatency: 1500,
      concurrentUsers: 10000,
      throughputThreshold: 1000,
      availabilityTarget: 99.99
    },
    emergencyProtocols: [
      {
        protocolType: 'immediate-intervention',
        activationTriggers: ['suicide risk', 'self-harm detected'],
        requiredActions: ['crisis specialist contact', 'emergency services alert'],
        timeConstraints: 2000,
        validationCriteria: ['professional availability', 'user safety confirmed']
      }
    ],
    metadata: {
      priority: 'critical',
      riskLevel: 10,
      complianceLevel: 'clinical',
      testEnvironment: 'prod-like',
      simulatedUsers: 10000,
      geographicScope: ['North America', 'Europe', 'Asia', 'Australia'],
      timeZoneCoverage: ['UTC-8', 'UTC-5', 'UTC+0', 'UTC+1', 'UTC+8', 'UTC+10']
    }
  }
];

/**
 * Advanced load testing configurations for crisis scenarios
 */
const ADVANCED_LOAD_TEST_CONFIGS: Record<string, LoadTestConfig> = {
  'advanced-crisis-detection': {
    virtualUsers: 10000,
    rampUpTime: 60,
    testDuration: 600,
    requestsPerSecond: 1000,
    crisisLoadProfile: {
      baselineUsers: 1000,
      peakMultiplier: 10,
      crisisSpikeDuration: 300,
      recoveryTime: 120,
      sustainedHighLoad: 70
    },
    endpoints: [
      {
        path: '/api/v2/crisis/detect',
        method: 'POST',
        weight: 35,
        expectedResponseTime: 1500,
        crisisSpecific: true,
        escalationTrigger: true,
        dataIntegrityRequired: true,
        culturalContext: 'western-direct'
      },
      {
        path: '/api/v2/crisis/cultural-analysis',
        method: 'POST',
        weight: 20,
        expectedResponseTime: 2000,
        crisisSpecific: true,
        escalationTrigger: false,
        dataIntegrityRequired: true,
        culturalContext: 'asian-indirect'
      }
    ],
    thresholds: {
      responseTime: {
        average: 2000,
        p95: 3000,
        p99: 5000,
        crisis: 1500
      },
      errorRate: {
        general: 0.5,
        crisis: 0.1
      },
      throughput: {
        minimum: 800,
        target: 1000,
        crisis: 1200
      },
      availability: 99.99
    },
    failureSimulation: {
      networkLatency: 50,
      packetLoss: 0.1,
      connectionTimeouts: 1,
      serverFailures: 0.5,
      databaseSlowdowns: 2
    },
    culturalTesting: {
      multiLanguage: true,
      culturalPatterns: ['western-direct', 'asian-indirect', 'hispanic-family-centered'],
      timeZoneDistribution: ['UTC-8', 'UTC-5', 'UTC+0', 'UTC+8'],
      localizedContent: true
    }
  }
};

/**
 * Comprehensive performance benchmarks for crisis systems
 */
const ADVANCED_PERFORMANCE_BENCHMARKS: PerformanceBenchmark[] = [
  {
    id: 'crisis-response-time-v3',
    name: 'Advanced Crisis Response Time',
    component: 'crisis-detection-engine',
    metric: 'response-time',
    baseline: 1000,
    target: 500,
    threshold: {
      warning: 1500,
      critical: 2000,
      emergency: 3000
    },
    unit: 'ms',
    timestamp: new Date().toISOString(),
    severity: 'critical',
    complianceRequired: true,
    culturalVariations: {
      'western-direct': 800,
      'asian-indirect': 1200,
      'hispanic-family-centered': 1000,
      'african-community-focused': 1100,
      'middle-eastern-honor-based': 1150,
      'indigenous-spiritual': 1300,
      'nordic-stoic': 900
    },
    escalationLevelImpact: {
      'ai-response': 500,
      'peer-counselor': 2000,
      'licensed-therapist': 3000,
      'crisis-specialist': 1500,
      'psychiatric-emergency': 1000,
      'emergency-services': 800,
      'law-enforcement': 1200,
      'medical-intervention': 1000
    },
    realTimeRequirement: true,
    dataIntegrityImpact: 'critical'
  }
];

/**
 * Advanced Mock Crisis Stress Testing System Implementation
 */
export class AdvancedMockCrisisStressTestingSystem {
  private runningTests: Map<string, TestExecutionResult> = new Map();
  private testHistory: TestExecutionResult[] = [];
  
  constructor() {
    logger.info('Advanced Crisis Stress Testing System initialized with comprehensive mock capabilities');
  }

  /**
   * Execute an advanced crisis test scenario with comprehensive validation
   */
  async executeScenario(scenarioId: string, customContext?: CrisisContext): Promise<TestExecutionResult> {
    const scenario = ADVANCED_CRISIS_TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Advanced scenario ${scenarioId} not found in comprehensive test suite`);
    }

    const executionId = this.generateExecutionId();
    const startTime = new Date().toISOString();

    logger.info(`Starting advanced crisis test scenario: ${scenario.name}`, {
      scenarioId,
      executionId,
      culturalVariations: scenario.culturalVariations.length,
      escalationPathways: scenario.escalationPathways.length
    });

    // Create comprehensive initial result
    const result: TestExecutionResult = {
      scenarioId,
      executionId,
      startTime,
      endTime: '',
      duration: 0,
      status: 'passed',
      metrics: {
        responseTime: { min: Infinity, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, p999: 0 },
        throughput: { requests: 0, peak: 0, sustained: 0 },
        errorRate: { total: 0, critical: 0, byComponent: {} },
        successRate: { overall: 100, crisisDetection: 100, escalationAccuracy: 100 },
        crisisSpecific: {
          detectionAccuracy: 95 + Math.random() * 5,
          falsePositiveRate: Math.random() * 2,
          falseNegativeRate: Math.random() * 1,
          escalationTime: 1000 + Math.random() * 2000,
          culturalSensitivity: 90 + Math.random() * 10,
          linguisticAccuracy: 95 + Math.random() * 5
        },
        dataIntegrity: {
          personalDataProtection: 100,
          sessionConsistency: 100,
          crisisHistoryAccuracy: 100,
          complianceValidation: 100
        },
        systemResilience: {
          availabilityScore: 99.9 + Math.random() * 0.1,
          failoverTime: Math.random() * 5000,
          recoveryTime: Math.random() * 15000,
          degradationHandling: 95 + Math.random() * 5
        }
      },
      errors: [],
      culturalResults: [],
      escalationResults: [],
      protocolValidation: [],
      logs: [{
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'test-runner',
        message: `Advanced crisis test started: ${scenario.name}`,
        metadata: { scenarioId }
      }],
      recommendations: { immediate: [], shortTerm: [], longTerm: [], compliance: [] },
      complianceReport: {
        hipaaCompliant: true,
        gdprCompliant: true,
        localRegulations: {},
        auditTrail: []
      }
    };

    this.runningTests.set(executionId, result);

    try {
      // Simulate comprehensive testing
      await this.simulateAdvancedTesting(scenario, result);
      
      result.status = this.determineOverallStatus(result);
      result.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'test-runner',
        message: `Advanced crisis test completed with status: ${result.status}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.status = 'critical-failure';
      result.errors.push({
        type: 'system',
        severity: 'catastrophic',
        message: errorMessage,
        component: 'test-execution',
        count: 1,
        timestamp: new Date().toISOString(),
        impact: 'critical',
        resolution: 'Investigate system failure and retry test'
      });
    }

    // Finalize comprehensive result
    result.endTime = new Date().toISOString();
    result.duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();
    
    this.runningTests.delete(executionId);
    this.testHistory.push(result);
    
    return result;
  }

  /**
   * Simulate advanced testing scenarios
   */
  private async simulateAdvancedTesting(scenario: CrisisTestScenario, result: TestExecutionResult): Promise<void> {
    // Simulate cultural variations testing
    for (const pattern of scenario.culturalVariations) {
      const culturalResult = {
        pattern,
        accuracy: 85 + Math.random() * 15,
        responseTime: 500 + Math.random() * 1500,
        culturalSensitivity: 80 + Math.random() * 20,
        issues: Math.random() < 0.1 ? ['Minor cultural sensitivity concern'] : []
      };
      result.culturalResults.push(culturalResult);
    }

    // Simulate escalation pathways
    for (const pathway of scenario.escalationPathways) {
      const escalationResult = {
        level: pathway.level,
        triggered: Math.random() > 0.2,
        responseTime: pathway.maxResponseTime * (0.8 + Math.random() * 0.4),
        accuracy: 90 + Math.random() * 10,
        professionalReady: Math.random() > 0.1
      };
      result.escalationResults.push(escalationResult);
    }

    // Simulate protocol validation
    for (const protocol of scenario.emergencyProtocols) {
      const protocolResult = {
        protocol: protocol.protocolType,
        executed: Math.random() > 0.05,
        compliance: 95 + Math.random() * 5,
        timing: protocol.timeConstraints * (0.8 + Math.random() * 0.4),
        effectiveness: 90 + Math.random() * 10
      };
      result.protocolValidation.push(protocolResult);
    }

    // Update overall metrics
    if (result.culturalResults.length > 0) {
      result.metrics.crisisSpecific.culturalSensitivity = 
        result.culturalResults.reduce((sum, r) => sum + r.culturalSensitivity, 0) / result.culturalResults.length;
    }

    // Simulate test duration
    await this.delay(Math.min(scenario.duration, 1000));
  }

  /**
   * Determine overall test status
   */
  private determineOverallStatus(result: TestExecutionResult): 'passed' | 'failed' | 'error' | 'timeout' | 'degraded' | 'critical-failure' {
    const criticalErrors = result.errors.filter(e => e.severity === 'catastrophic' || e.severity === 'critical');
    const highErrors = result.errors.filter(e => e.severity === 'high');
    
    if (criticalErrors.length > 0) {
      return 'critical-failure';
    }
    
    if (highErrors.length > 2) {
      return 'failed';
    }
    
    if (result.metrics.crisisSpecific.culturalSensitivity < 70 ||
        result.metrics.crisisSpecific.detectionAccuracy < 90 ||
        result.metrics.systemResilience.availabilityScore < 99) {
      return 'degraded';
    }
    
    return 'passed';
  }

  // Public API methods
  public getRunningTests(): TestExecutionResult[] {
    return Array.from(this.runningTests.values());
  }
  
  public getTestHistory(limit: number = 100): TestExecutionResult[] {
    return this.testHistory.slice(-limit);
  }
  
  public getTestResult(executionId: string): TestExecutionResult | undefined {
    return this.testHistory.find(result => result.executionId === executionId);
  }
  
  public async stopTest(executionId: string): Promise<boolean> {
    const result = this.runningTests.get(executionId);
    if (!result) {
      return false;
    }
    
    result.status = 'timeout';
    result.endTime = new Date().toISOString();
    result.duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();
    
    this.runningTests.delete(executionId);
    this.testHistory.push(result);
    
    logger.info(`Stopped advanced crisis test: ${executionId}`);
    return true;
  }
  
  public clearHistory(): void {
    this.testHistory = [];
    logger.info('Advanced crisis test history cleared');
  }
  
  public getPerformanceBenchmarks(): PerformanceBenchmark[] {
    return [...ADVANCED_PERFORMANCE_BENCHMARKS];
  }
  
  public validateBenchmark(benchmarkId: string, actualValue: number): boolean {
    const benchmark = ADVANCED_PERFORMANCE_BENCHMARKS.find(b => b.id === benchmarkId);
    if (!benchmark) return false;
    
    return actualValue <= benchmark.threshold.warning;
  }

  // Helper methods
  private generateExecutionId(): string {
    return `advanced_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export singleton instance of advanced system
export const advancedMockCrisisStressTesting = new AdvancedMockCrisisStressTestingSystem();

// Backward compatibility - alias to advanced system
export const mockCrisisStressTesting = advancedMockCrisisStressTesting;

// Export advanced test data for comprehensive crisis testing
export const CRISIS_TEST_SCENARIOS = ADVANCED_CRISIS_TEST_SCENARIOS;
export const LOAD_TEST_CONFIGS = ADVANCED_LOAD_TEST_CONFIGS;
export const PERFORMANCE_BENCHMARKS = ADVANCED_PERFORMANCE_BENCHMARKS;

export default advancedMockCrisisStressTesting;