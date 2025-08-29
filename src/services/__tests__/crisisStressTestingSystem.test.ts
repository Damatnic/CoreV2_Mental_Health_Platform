/**
 * Crisis Stress Testing System Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface CrisisScenario {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];
  expectedResponses: string[];
  timeLimit?: number; // seconds
}

interface StressTestResult {
  scenarioId: string;
  passed: boolean;
  responseTime: number;
  accuracyScore: number;
  missedAlerts: string[];
  falsePositives: string[];
  recommendations: string[];
}

interface SystemMetrics {
  averageResponseTime: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  systemLoad: number;
}

class CrisisStressTestingSystem {
  private scenarios: CrisisScenario[] = [];
  private results: StressTestResult[] = [];
  private isRunning = false;
  private mockCrisisDetectionSystem: any;

  constructor(crisisDetectionSystem?: any) {
    this.mockCrisisDetectionSystem = crisisDetectionSystem || this.createMockSystem();
    this.initializeScenarios();
  }

  private createMockSystem() {
    return {
      detectCrisis: jest.fn().mockResolvedValue({
        detected: true,
        severity: 'high',
        confidence: 0.85
      }),
      triggerAlert: jest.fn().mockResolvedValue(true),
      getResponseTime: jest.fn().mockReturnValue(Math.random() * 1000 + 200)
    };
  }

  private initializeScenarios() {
    this.scenarios = [
      {
        id: 'scenario-1',
        name: 'Suicide Ideation Detection',
        description: 'Test detection of direct suicide ideation',
        severity: 'critical',
        triggers: ['want to die', 'end it all', 'no point living'],
        expectedResponses: ['immediate-alert', 'crisis-hotline', 'emergency-contact'],
        timeLimit: 5
      },
      {
        id: 'scenario-2',
        name: 'Self-Harm Indication',
        description: 'Test detection of self-harm intentions',
        severity: 'high',
        triggers: ['cutting myself', 'hurt myself', 'pain helps'],
        expectedResponses: ['urgent-alert', 'safety-plan', 'coping-strategies'],
        timeLimit: 10
      },
      {
        id: 'scenario-3',
        name: 'Panic Attack Recognition',
        description: 'Test recognition of panic attack symptoms',
        severity: 'medium',
        triggers: ['cant breathe', 'heart racing', 'going to die'],
        expectedResponses: ['breathing-exercise', 'grounding-technique', 'support-contact'],
        timeLimit: 15
      },
      {
        id: 'scenario-4',
        name: 'Severe Depression',
        description: 'Test detection of severe depressive episode',
        severity: 'high',
        triggers: ['hopeless', 'worthless', 'cant go on'],
        expectedResponses: ['mood-assessment', 'therapist-alert', 'support-resources'],
        timeLimit: 20
      },
      {
        id: 'scenario-5',
        name: 'Substance Crisis',
        description: 'Test detection of substance abuse crisis',
        severity: 'high',
        triggers: ['overdosed', 'too much', 'cant stop'],
        expectedResponses: ['emergency-services', 'poison-control', 'immediate-support'],
        timeLimit: 5
      }
    ];
  }

  async runScenario(scenarioId: string): Promise<StressTestResult> {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const startTime = Date.now();
    const detectedAlerts: string[] = [];
    const falsePositives: string[] = [];
    const missedAlerts: string[] = [];

    // Simulate running the scenario
    for (const trigger of scenario.triggers) {
      const result = await this.mockCrisisDetectionSystem.detectCrisis(trigger);
      
      if (result.detected) {
        const alert = await this.mockCrisisDetectionSystem.triggerAlert(result);
        if (alert) {
          detectedAlerts.push(trigger);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    
    // Calculate accuracy
    scenario.expectedResponses.forEach(expected => {
      if (!detectedAlerts.some(alert => alert.includes(expected.split('-')[0]))) {
        missedAlerts.push(expected);
      }
    });

    // Check for false positives
    const benignInputs = ['feeling good', 'happy today', 'great weather'];
    for (const input of benignInputs) {
      const result = await this.mockCrisisDetectionSystem.detectCrisis(input);
      if (result.detected) {
        falsePositives.push(input);
      }
    }

    const accuracyScore = this.calculateAccuracy(
      detectedAlerts.length,
      scenario.triggers.length,
      falsePositives.length
    );

    const passed = this.evaluatePass(scenario, responseTime, accuracyScore, missedAlerts);

    const result: StressTestResult = {
      scenarioId,
      passed,
      responseTime,
      accuracyScore,
      missedAlerts,
      falsePositives,
      recommendations: this.generateRecommendations(scenario, result)
    };

    this.results.push(result);
    return result;
  }

  private calculateAccuracy(detected: number, total: number, falsePositives: number): number {
    const truePositiveRate = detected / total;
    const falsePositivePenalty = falsePositives * 0.1;
    return Math.max(0, Math.min(100, (truePositiveRate * 100) - falsePositivePenalty));
  }

  private evaluatePass(
    scenario: CrisisScenario,
    responseTime: number,
    accuracyScore: number,
    missedAlerts: string[]
  ): boolean {
    const timeLimit = scenario.timeLimit ? scenario.timeLimit * 1000 : Infinity;
    const minAccuracy = scenario.severity === 'critical' ? 95 : 
                       scenario.severity === 'high' ? 85 : 75;
    
    return responseTime <= timeLimit && 
           accuracyScore >= minAccuracy && 
           missedAlerts.length === 0;
  }

  private generateRecommendations(scenario: CrisisScenario, result: any): string[] {
    const recommendations: string[] = [];

    if (result.responseTime > (scenario.timeLimit || 30) * 1000) {
      recommendations.push('Improve response time for critical scenarios');
    }

    if (result.missedAlerts.length > 0) {
      recommendations.push(`Enhance detection for: ${result.missedAlerts.join(', ')}`);
    }

    if (result.falsePositives.length > 0) {
      recommendations.push('Reduce false positive rate to avoid alert fatigue');
    }

    if (result.accuracyScore < 90 && scenario.severity === 'critical') {
      recommendations.push('Critical scenario accuracy must be improved immediately');
    }

    return recommendations;
  }

  async runFullStressTest(): Promise<{
    scenarios: StressTestResult[];
    metrics: SystemMetrics;
    overallPass: boolean;
  }> {
    this.isRunning = true;
    this.results = [];

    for (const scenario of this.scenarios) {
      await this.runScenario(scenario.id);
    }

    const metrics = this.calculateSystemMetrics();
    const overallPass = this.evaluateOverallPass();

    this.isRunning = false;

    return {
      scenarios: this.results,
      metrics,
      overallPass
    };
  }

  private calculateSystemMetrics(): SystemMetrics {
    if (this.results.length === 0) {
      return {
        averageResponseTime: 0,
        detectionAccuracy: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        systemLoad: 0
      };
    }

    const totalResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0);
    const totalAccuracy = this.results.reduce((sum, r) => sum + r.accuracyScore, 0);
    const totalFalsePositives = this.results.reduce((sum, r) => sum + r.falsePositives.length, 0);
    const totalMissedAlerts = this.results.reduce((sum, r) => sum + r.missedAlerts.length, 0);
    const totalExpected = this.scenarios.reduce((sum, s) => sum + s.expectedResponses.length, 0);

    return {
      averageResponseTime: totalResponseTime / this.results.length,
      detectionAccuracy: totalAccuracy / this.results.length,
      falsePositiveRate: (totalFalsePositives / (this.results.length * 3)) * 100, // 3 benign tests per scenario
      falseNegativeRate: (totalMissedAlerts / totalExpected) * 100,
      systemLoad: Math.random() * 100 // Simulated system load
    };
  }

  private evaluateOverallPass(): boolean {
    // All critical scenarios must pass
    const criticalScenarios = this.scenarios.filter(s => s.severity === 'critical');
    const criticalResults = this.results.filter(r => 
      criticalScenarios.some(s => s.id === r.scenarioId)
    );

    if (criticalResults.some(r => !r.passed)) {
      return false;
    }

    // At least 80% of all scenarios must pass
    const passRate = this.results.filter(r => r.passed).length / this.results.length;
    return passRate >= 0.8;
  }

  async simulateLoadTest(concurrent: number, duration: number): Promise<{
    requestsHandled: number;
    averageLatency: number;
    peakLatency: number;
    errorRate: number;
  }> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    let requestsHandled = 0;
    let totalLatency = 0;
    let peakLatency = 0;
    let errors = 0;

    while (Date.now() < endTime) {
      const batch = Array(concurrent).fill(null).map(async () => {
        try {
          const latency = Math.random() * 500 + 100;
          totalLatency += latency;
          peakLatency = Math.max(peakLatency, latency);
          requestsHandled++;
          await new Promise(resolve => setTimeout(resolve, latency));
        } catch {
          errors++;
        }
      });

      await Promise.all(batch);
    }

    return {
      requestsHandled,
      averageLatency: totalLatency / requestsHandled,
      peakLatency,
      errorRate: (errors / requestsHandled) * 100
    };
  }

  getScenarios(): CrisisScenario[] {
    return this.scenarios;
  }

  getResults(): StressTestResult[] {
    return this.results;
  }

  clearResults() {
    this.results = [];
  }
}

describe('CrisisStressTestingSystem', () => {
  let system: CrisisStressTestingSystem;

  beforeEach(() => {
    system = new CrisisStressTestingSystem();
  });

  afterEach(() => {
    system.clearResults();
    jest.clearAllMocks();
  });

  describe('Scenario Management', () => {
    it('should initialize with predefined scenarios', () => {
      const scenarios = system.getScenarios();
      
      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.some(s => s.severity === 'critical')).toBe(true);
      expect(scenarios.some(s => s.name.includes('Suicide'))).toBe(true);
    });

    it('should have scenarios with different severity levels', () => {
      const scenarios = system.getScenarios();
      const severities = new Set(scenarios.map(s => s.severity));
      
      expect(severities.size).toBeGreaterThan(2);
    });
  });

  describe('Individual Scenario Testing', () => {
    it('should run suicide ideation scenario', async () => {
      const result = await system.runScenario('scenario-1');
      
      expect(result).toBeDefined();
      expect(result.scenarioId).toBe('scenario-1');
      expect(result.accuracyScore).toBeGreaterThanOrEqual(0);
      expect(result.accuracyScore).toBeLessThanOrEqual(100);
    });

    it('should detect missed alerts', async () => {
      // Create system with mock that doesn't detect anything
      const mockSystem = {
        detectCrisis: jest.fn().mockResolvedValue({ detected: false }),
        triggerAlert: jest.fn(),
        getResponseTime: jest.fn().mockReturnValue(100)
      };
      
      const testSystem = new CrisisStressTestingSystem(mockSystem);
      const result = await testSystem.runScenario('scenario-1');
      
      expect(result.passed).toBe(false);
      expect(result.missedAlerts.length).toBeGreaterThan(0);
    });

    it('should measure response time', async () => {
      const result = await system.runScenario('scenario-2');
      
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should generate recommendations for failed scenarios', async () => {
      const mockSystem = {
        detectCrisis: jest.fn().mockResolvedValue({ detected: false }),
        triggerAlert: jest.fn(),
        getResponseTime: jest.fn().mockReturnValue(100)
      };
      
      const testSystem = new CrisisStressTestingSystem(mockSystem);
      const result = await testSystem.runScenario('scenario-1');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Full Stress Test', () => {
    it('should run all scenarios', async () => {
      const result = await system.runFullStressTest();
      
      expect(result.scenarios.length).toBe(system.getScenarios().length);
      expect(result.metrics).toBeDefined();
      expect(result.overallPass).toBeDefined();
    });

    it('should calculate system metrics', async () => {
      const result = await system.runFullStressTest();
      
      expect(result.metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.detectionAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.metrics.detectionAccuracy).toBeLessThanOrEqual(100);
      expect(result.metrics.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.falseNegativeRate).toBeGreaterThanOrEqual(0);
    });

    it('should evaluate overall pass/fail', async () => {
      const result = await system.runFullStressTest();
      
      expect(typeof result.overallPass).toBe('boolean');
    });
  });

  describe('Load Testing', () => {
    it('should simulate concurrent load', async () => {
      const result = await system.simulateLoadTest(10, 1000);
      
      expect(result.requestsHandled).toBeGreaterThan(0);
      expect(result.averageLatency).toBeGreaterThan(0);
      expect(result.peakLatency).toBeGreaterThanOrEqual(result.averageLatency);
      expect(result.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle increasing load', async () => {
      const lightLoad = await system.simulateLoadTest(5, 500);
      const heavyLoad = await system.simulateLoadTest(50, 500);
      
      expect(heavyLoad.requestsHandled).toBeGreaterThan(lightLoad.requestsHandled);
    });
  });

  describe('Results Management', () => {
    it('should store test results', async () => {
      await system.runScenario('scenario-1');
      await system.runScenario('scenario-2');
      
      const results = system.getResults();
      expect(results.length).toBe(2);
    });

    it('should clear results', async () => {
      await system.runScenario('scenario-1');
      system.clearResults();
      
      const results = system.getResults();
      expect(results.length).toBe(0);
    });
  });
});
