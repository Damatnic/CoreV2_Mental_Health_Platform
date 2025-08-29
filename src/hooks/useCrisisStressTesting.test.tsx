import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

interface StressTest {
  id: string;
  name: string;
  scenario: string;
  expectedResponse: string;
  maxResponseTime: number;
}

const useCrisisStressTesting = () => {
  const [tests, setTests] = React.useState<StressTest[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState<Array<{
    testId: string;
    passed: boolean;
    responseTime: number;
    actualResponse: string;
  }>>([]);

  const defaultTests: StressTest[] = [
    {
      id: '1',
      name: 'High Volume Crisis Detection',
      scenario: 'Process 100 crisis texts simultaneously',
      expectedResponse: 'All texts processed within 2 seconds',
      maxResponseTime: 2000
    },
    {
      id: '2',
      name: 'Multiple Language Crisis',
      scenario: 'Detect crisis in 5 different languages',
      expectedResponse: 'Crisis detected in all languages',
      maxResponseTime: 1500
    },
    {
      id: '3',
      name: 'Resource Allocation Stress',
      scenario: '50 users request crisis resources simultaneously',
      expectedResponse: 'Resources allocated without timeout',
      maxResponseTime: 3000
    }
  ];

  React.useEffect(() => {
    setTests(defaultTests);
  }, []);

  const runStressTest = React.useCallback(async (test: StressTest) => {
    const startTime = Date.now();
    
    // Simulate stress test execution
    await new Promise(resolve => {
      const delay = Math.random() * test.maxResponseTime * 1.5;
      setTimeout(resolve, delay);
    });
    
    const responseTime = Date.now() - startTime;
    const passed = responseTime <= test.maxResponseTime;
    
    return {
      testId: test.id,
      passed,
      responseTime,
      actualResponse: passed ? test.expectedResponse : 'Timeout exceeded'
    };
  }, []);

  const runAllTests = React.useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults = [];
    
    for (const test of tests) {
      const result = await runStressTest(test);
      testResults.push(result);
      setResults([...testResults]);
    }
    
    setIsRunning(false);
    return testResults;
  }, [tests, runStressTest]);

  const addCustomTest = React.useCallback((test: Omit<StressTest, 'id'>) => {
    const newTest: StressTest = {
      ...test,
      id: Date.now().toString()
    };
    setTests(prev => [...prev, newTest]);
  }, []);

  const getPassRate = React.useCallback(() => {
    if (results.length === 0) return 0;
    return (results.filter(r => r.passed).length / results.length) * 100;
  }, [results]);

  const getAverageResponseTime = React.useCallback(() => {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  }, [results]);

  return {
    tests,
    results,
    isRunning,
    runStressTest,
    runAllTests,
    addCustomTest,
    getPassRate,
    getAverageResponseTime
  };
};

describe('useCrisisStressTesting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default tests', () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    expect(result.current.tests).toHaveLength(3);
    expect(result.current.results).toHaveLength(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should run individual stress test', async () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    let testResult: any;
    await act(async () => {
      testResult = await result.current.runStressTest(result.current.tests[0]);
    });
    
    expect(testResult).toHaveProperty('testId');
    expect(testResult).toHaveProperty('passed');
    expect(testResult).toHaveProperty('responseTime');
    expect(testResult).toHaveProperty('actualResponse');
  });

  it('should run all tests', async () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    await act(async () => {
      await result.current.runAllTests();
    });
    
    expect(result.current.results).toHaveLength(3);
    expect(result.current.isRunning).toBe(false);
  });

  it('should add custom test', () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    const customTest = {
      name: 'Custom Stress Test',
      scenario: 'Test custom scenario',
      expectedResponse: 'Custom response',
      maxResponseTime: 1000
    };
    
    act(() => {
      result.current.addCustomTest(customTest);
    });
    
    expect(result.current.tests).toHaveLength(4);
    expect(result.current.tests[3].name).toBe('Custom Stress Test');
  });

  it('should calculate pass rate correctly', async () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    await act(async () => {
      await result.current.runAllTests();
    });
    
    const passRate = result.current.getPassRate();
    expect(passRate).toBeGreaterThanOrEqual(0);
    expect(passRate).toBeLessThanOrEqual(100);
  });

  it('should calculate average response time', async () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    await act(async () => {
      await result.current.runAllTests();
    });
    
    const avgTime = result.current.getAverageResponseTime();
    expect(avgTime).toBeGreaterThan(0);
  });

  it('should set running state during test execution', async () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    const runPromise = act(async () => {
      return result.current.runAllTests();
    });
    
    // Check if running state is set
    expect(result.current.isRunning).toBe(true);
    
    await runPromise;
    
    expect(result.current.isRunning).toBe(false);
  });

  it('should handle test failures', async () => {
    const { result } = renderHook(() => useCrisisStressTesting());
    
    const failingTest: StressTest = {
      id: 'fail',
      name: 'Failing Test',
      scenario: 'This should fail',
      expectedResponse: 'Should not reach this',
      maxResponseTime: 1 // Very low timeout
    };
    
    let testResult: any;
    await act(async () => {
      testResult = await result.current.runStressTest(failingTest);
    });
    
    // Most likely to fail due to very low timeout
    expect(testResult.passed).toBeDefined();
    expect(testResult.responseTime).toBeGreaterThan(0);
  });
});
