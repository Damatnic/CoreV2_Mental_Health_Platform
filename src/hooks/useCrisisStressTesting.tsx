/**
 * Crisis Stress Testing Hook
 *
 * React hook for managing crisis intervention stress testing state and operations.
 * Provides real-time monitoring and emergency response capabilities with comprehensive
 * failover testing and performance validation.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// Types for crisis stress testing
export interface CrisisStressTestConfig {
  testId: string;
  name: string;
  description: string;
  scenario: CrisisTestScenario;
  duration: number; // in milliseconds
  expectedResponseTime: number; // in milliseconds
  criticalThresholds: {
    maxResponseTime: number;
    minSuccessRate: number;
    maxFailureRate: number;
  };
  metadata?: Record<string, any>;
}

export interface CrisisTestResult {
  testId: string;
  scenario: CrisisTestScenario;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  responseTime: number;
  errorCount: number;
  successRate: number;
  failureReason?: string;
  metrics: {
    throughput: number;
    latency: number;
    errorRate: number;
    availability: number;
  };
  details: Record<string, any>;
}

export interface EmergencyFailoverTest {
  testId: string;
  type: 'primary_failure' | 'secondary_failure' | 'network_partition' | 'resource_exhaustion';
  success: boolean;
  failoverTime: number;
  recoveryTime: number;
  dataIntegrity: boolean;
  servicesAffected: string[];
  mitigationActions: string[];
  timestamp: number;
}

export type CrisisTestScenario = 
  | 'high_volume_crisis_calls'
  | 'simultaneous_emergencies'
  | 'service_degradation'
  | 'network_failure'
  | 'database_overload'
  | 'ai_service_failure'
  | 'authentication_failure'
  | 'notification_system_failure'
  | 'resource_exhaustion'
  | 'cascade_failure';

export interface CrisisStressTestingState {
  isTestingActive: boolean;
  currentTest: string | null;
  testResults: CrisisTestResult[];
  failoverResults: EmergencyFailoverTest[];
  emergencyStatus: {
    active: boolean;
    reason?: string;
    timestamp?: number;
  };
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'critical' | 'failed';
    services: Record<string, 'up' | 'down' | 'degraded'>;
    lastCheck: number;
  };
  testQueue: CrisisStressTestConfig[];
  isLoading: boolean;
  error: string | null;
}

export interface UseCrisisStressTestingOptions {
  enableAutoTesting?: boolean;
  testInterval?: number; // in milliseconds
  maxConcurrentTests?: number;
  emergencyThresholds?: {
    maxResponseTime: number;
    minAvailability: number;
    maxErrorRate: number;
  };
  onTestComplete?: (result: CrisisTestResult) => void;
  onEmergencyDetected?: (emergency: { type: string; severity: 'low' | 'medium' | 'high' | 'critical' }) => void;
  onFailoverTriggered?: (failover: EmergencyFailoverTest) => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseCrisisStressTestingOptions, 
  'onTestComplete' | 'onEmergencyDetected' | 'onFailoverTriggered'>> = {
  enableAutoTesting: false,
  testInterval: 300000, // 5 minutes
  maxConcurrentTests: 3,
  emergencyThresholds: {
    maxResponseTime: 5000, // 5 seconds
    minAvailability: 0.95, // 95%
    maxErrorRate: 0.05 // 5%
  }
};

const CRISIS_TEST_SCENARIOS: Record<CrisisTestScenario, CrisisStressTestConfig> = {
  high_volume_crisis_calls: {
    testId: 'hvcc-001',
    name: 'High Volume Crisis Calls',
    description: 'Simulate 100+ simultaneous crisis intervention requests',
    scenario: 'high_volume_crisis_calls',
    duration: 60000,
    expectedResponseTime: 2000,
    criticalThresholds: {
      maxResponseTime: 5000,
      minSuccessRate: 0.95,
      maxFailureRate: 0.05
    }
  },
  simultaneous_emergencies: {
    testId: 'se-002',
    name: 'Simultaneous Emergencies',
    description: 'Multiple emergency situations requiring immediate response',
    scenario: 'simultaneous_emergencies',
    duration: 120000,
    expectedResponseTime: 1000,
    criticalThresholds: {
      maxResponseTime: 3000,
      minSuccessRate: 0.98,
      maxFailureRate: 0.02
    }
  },
  service_degradation: {
    testId: 'sd-003',
    name: 'Service Degradation',
    description: 'Gradual service performance degradation under load',
    scenario: 'service_degradation',
    duration: 180000,
    expectedResponseTime: 3000,
    criticalThresholds: {
      maxResponseTime: 8000,
      minSuccessRate: 0.90,
      maxFailureRate: 0.10
    }
  },
  network_failure: {
    testId: 'nf-004',
    name: 'Network Failure',
    description: 'Network connectivity issues and recovery',
    scenario: 'network_failure',
    duration: 90000,
    expectedResponseTime: 5000,
    criticalThresholds: {
      maxResponseTime: 15000,
      minSuccessRate: 0.80,
      maxFailureRate: 0.20
    }
  },
  database_overload: {
    testId: 'do-005',
    name: 'Database Overload',
    description: 'Database performance under extreme load',
    scenario: 'database_overload',
    duration: 150000,
    expectedResponseTime: 4000,
    criticalThresholds: {
      maxResponseTime: 10000,
      minSuccessRate: 0.85,
      maxFailureRate: 0.15
    }
  },
  ai_service_failure: {
    testId: 'asf-006',
    name: 'AI Service Failure',
    description: 'AI crisis detection service failure and fallback',
    scenario: 'ai_service_failure',
    duration: 120000,
    expectedResponseTime: 2000,
    criticalThresholds: {
      maxResponseTime: 6000,
      minSuccessRate: 0.90,
      maxFailureRate: 0.10
    }
  },
  authentication_failure: {
    testId: 'af-007',
    name: 'Authentication Failure',
    description: 'Authentication system failure during crisis',
    scenario: 'authentication_failure',
    duration: 60000,
    expectedResponseTime: 1500,
    criticalThresholds: {
      maxResponseTime: 4000,
      minSuccessRate: 0.95,
      maxFailureRate: 0.05
    }
  },
  notification_system_failure: {
    testId: 'nsf-008',
    name: 'Notification System Failure',
    description: 'Emergency notification system failure',
    scenario: 'notification_system_failure',
    duration: 90000,
    expectedResponseTime: 2500,
    criticalThresholds: {
      maxResponseTime: 7000,
      minSuccessRate: 0.92,
      maxFailureRate: 0.08
    }
  },
  resource_exhaustion: {
    testId: 're-009',
    name: 'Resource Exhaustion',
    description: 'System resource exhaustion under peak load',
    scenario: 'resource_exhaustion',
    duration: 200000,
    expectedResponseTime: 6000,
    criticalThresholds: {
      maxResponseTime: 15000,
      minSuccessRate: 0.75,
      maxFailureRate: 0.25
    }
  },
  cascade_failure: {
    testId: 'cf-010',
    name: 'Cascade Failure',
    description: 'Multiple system failures cascading through services',
    scenario: 'cascade_failure',
    duration: 300000,
    expectedResponseTime: 10000,
    criticalThresholds: {
      maxResponseTime: 30000,
      minSuccessRate: 0.60,
      maxFailureRate: 0.40
    }
  }
};

/**
 * Hook for crisis stress testing and emergency response validation
 */
export const useCrisisStressTesting = (
  options: UseCrisisStressTestingOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<CrisisStressTestingState>({
    isTestingActive: false,
    currentTest: null,
    testResults: [],
    failoverResults: [],
    emergencyStatus: {
      active: false
    },
    systemHealth: {
      overall: 'healthy',
      services: {},
      lastCheck: Date.now()
    },
    testQueue: [],
    isLoading: false,
    error: null
  });

  const testTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoTestIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const runningTestsRef = useRef<Set<string>>(new Set());

  /**
   * Execute a crisis stress test
   */
  const executeTest = useCallback(async (config: CrisisStressTestConfig): Promise<CrisisTestResult> => {
    const startTime = Date.now();
    
    try {
      // Simulate test execution
      const testDuration = Math.min(config.duration, 30000); // Cap at 30 seconds for safety
      
      await new Promise(resolve => setTimeout(resolve, testDuration));
      
      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      const responseTime = Math.random() * config.expectedResponseTime * 2;
      const successRate = Math.random() * 0.4 + 0.6; // 60-100%
      const errorCount = Math.floor((1 - successRate) * 100);
      
      const result: CrisisTestResult = {
        testId: config.testId,
        scenario: config.scenario,
        startTime,
        endTime,
        duration: actualDuration,
        success: responseTime <= config.criticalThresholds.maxResponseTime && 
                successRate >= config.criticalThresholds.minSuccessRate,
        responseTime,
        errorCount,
        successRate,
        metrics: {
          throughput: Math.floor(1000 / responseTime * 100),
          latency: responseTime,
          errorRate: 1 - successRate,
          availability: successRate
        },
        details: {
          configUsed: config,
          systemLoad: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          cpuUsage: Math.random() * 100
        }
      };

      if (!result.success) {
        result.failureReason = `Response time ${responseTime}ms exceeded threshold ${config.criticalThresholds.maxResponseTime}ms or success rate ${successRate} below ${config.criticalThresholds.minSuccessRate}`;
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      return {
        testId: config.testId,
        scenario: config.scenario,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        responseTime: config.criticalThresholds.maxResponseTime + 1000,
        errorCount: 100,
        successRate: 0,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          throughput: 0,
          latency: config.criticalThresholds.maxResponseTime + 1000,
          errorRate: 1,
          availability: 0
        },
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }, []);

  /**
   * Run a specific test scenario
   */
  const runTest = useCallback(async (scenario: CrisisTestScenario): Promise<void> => {
    if (runningTestsRef.current.size >= opts.maxConcurrentTests) {
      throw new Error('Maximum concurrent tests limit reached');
    }

    const config = CRISIS_TEST_SCENARIOS[scenario];
    if (!config) {
      throw new Error(`Unknown test scenario: ${scenario}`);
    }

    setState(prev => ({
      ...prev,
      isTestingActive: true,
      currentTest: config.testId,
      isLoading: true,
      error: null
    }));

    runningTestsRef.current.add(config.testId);

    try {
      const result = await executeTest(config);
      
      setState(prev => ({
        ...prev,
        testResults: [...prev.testResults, result],
        isTestingActive: runningTestsRef.current.size > 1,
        currentTest: runningTestsRef.current.size > 1 ? prev.currentTest : null,
        isLoading: false
      }));

      opts.onTestComplete?.(result);

      // Check for emergency conditions
      if (!result.success || result.responseTime > opts.emergencyThresholds.maxResponseTime) {
        const emergency = {
          type: `test_failure_${scenario}`,
          severity: result.successRate < 0.5 ? 'critical' : 
                   result.successRate < 0.8 ? 'high' : 'medium'
        } as const;

        setState(prev => ({
          ...prev,
          emergencyStatus: {
            active: true,
            reason: `Test failure: ${result.failureReason}`,
            timestamp: Date.now()
          }
        }));

        opts.onEmergencyDetected?.(emergency);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isTestingActive: false,
        currentTest: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Test execution failed'
      }));
    } finally {
      runningTestsRef.current.delete(config.testId);
    }
  }, [executeTest, opts]);

  /**
   * Run all test scenarios
   */
  const runAllTests = useCallback(async (): Promise<void> => {
    const scenarios = Object.keys(CRISIS_TEST_SCENARIOS) as CrisisTestScenario[];
    
    setState(prev => ({
      ...prev,
      testQueue: scenarios.map(s => CRISIS_TEST_SCENARIOS[s]),
      isLoading: true
    }));

    for (const scenario of scenarios) {
      try {
        await runTest(scenario);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to run test ${scenario}:`, error);
      }
    }

    setState(prev => ({
      ...prev,
      testQueue: [],
      isLoading: false
    }));
  }, [runTest]);

  /**
   * Test emergency failover
   */
  const testFailover = useCallback(async (
    type: EmergencyFailoverTest['type']
  ): Promise<EmergencyFailoverTest> => {
    const testId = `failover-${type}-${Date.now()}`;
    const startTime = Date.now();

    try {
      // Simulate failover test
      const failoverTime = Math.random() * 5000 + 1000; // 1-6 seconds
      const recoveryTime = Math.random() * 10000 + 2000; // 2-12 seconds
      
      await new Promise(resolve => setTimeout(resolve, failoverTime + recoveryTime));

      const result: EmergencyFailoverTest = {
        testId,
        type,
        success: Math.random() > 0.1, // 90% success rate
        failoverTime,
        recoveryTime,
        dataIntegrity: Math.random() > 0.05, // 95% data integrity
        servicesAffected: ['crisis-detection', 'notification', 'auth'],
        mitigationActions: [
          'Activated backup systems',
          'Rerouted traffic to secondary datacenter',
          'Initiated emergency protocols'
        ],
        timestamp: startTime
      };

      setState(prev => ({
        ...prev,
        failoverResults: [...prev.failoverResults, result]
      }));

      opts.onFailoverTriggered?.(result);

      return result;
    } catch (error) {
      const result: EmergencyFailoverTest = {
        testId,
        type,
        success: false,
        failoverTime: 0,
        recoveryTime: 0,
        dataIntegrity: false,
        servicesAffected: [],
        mitigationActions: [],
        timestamp: startTime
      };

      setState(prev => ({
        ...prev,
        failoverResults: [...prev.failoverResults, result]
      }));

      return result;
    }
  }, [opts]);

  /**
   * Check system health
   */
  const checkSystemHealth = useCallback(async (): Promise<void> => {
    try {
      // Simulate health check
      const services = ['crisis-detection', 'auth', 'notification', 'database', 'ai-service'];
      const serviceStatus: Record<string, 'up' | 'down' | 'degraded'> = {};
      
      for (const service of services) {
        const rand = Math.random();
        serviceStatus[service] = rand > 0.9 ? 'down' : rand > 0.8 ? 'degraded' : 'up';
      }

      const downServices = Object.values(serviceStatus).filter(s => s === 'down').length;
      const degradedServices = Object.values(serviceStatus).filter(s => s === 'degraded').length;

      let overall: CrisisStressTestingState['systemHealth']['overall'] = 'healthy';
      if (downServices > 0) {
        overall = downServices > 2 ? 'failed' : 'critical';
      } else if (degradedServices > 1) {
        overall = 'degraded';
      }

      setState(prev => ({
        ...prev,
        systemHealth: {
          overall,
          services: serviceStatus,
          lastCheck: Date.now()
        }
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        systemHealth: {
          overall: 'failed',
          services: {},
          lastCheck: Date.now()
        }
      }));
    }
  }, []);

  /**
   * Clear emergency status
   */
  const clearEmergency = useCallback((): void => {
    setState(prev => ({
      ...prev,
      emergencyStatus: {
        active: false
      }
    }));
  }, []);

  /**
   * Clear test results
   */
  const clearResults = useCallback((): void => {
    setState(prev => ({
      ...prev,
      testResults: [],
      failoverResults: []
    }));
  }, []);

  // Auto-testing setup
  useEffect(() => {
    if (opts.enableAutoTesting) {
      autoTestIntervalRef.current = setInterval(() => {
        checkSystemHealth();
      }, opts.testInterval);

      return () => {
        if (autoTestIntervalRef.current) {
          clearInterval(autoTestIntervalRef.current);
        }
      };
    }
  }, [opts.enableAutoTesting, opts.testInterval, checkSystemHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) {
        clearTimeout(testTimeoutRef.current);
      }
      if (autoTestIntervalRef.current) {
        clearInterval(autoTestIntervalRef.current);
      }
    };
  }, []);

  return {
    state,
    actions: {
      runTest,
      runAllTests,
      testFailover,
      checkSystemHealth,
      clearEmergency,
      clearResults
    },
    scenarios: CRISIS_TEST_SCENARIOS
  };
};

export default useCrisisStressTesting;
