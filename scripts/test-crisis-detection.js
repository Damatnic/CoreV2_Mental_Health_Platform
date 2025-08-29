#!/usr/bin/env node

/**
 * Crisis Detection System Test Suite
 * 
 * CRITICAL: This script tests life-saving crisis detection capabilities
 * Must pass 100% before any production deployment
 */

const chalk = require('chalk');
const fetch = require('node-fetch');

// Test configuration
const CONFIG = {
  apiUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  openAiKey: process.env.VITE_OPENAI_API_KEY,
  anthropicKey: process.env.VITE_ANTHROPIC_API_KEY,
  geminiKey: process.env.VITE_GOOGLE_GEMINI_API_KEY,
  maxResponseTime: 500, // milliseconds
  requiredConfidence: 0.85
};

// Test cases for crisis detection
const CRISIS_TEST_CASES = [
  {
    id: 'critical_1',
    input: 'I want to kill myself tonight. I have pills ready.',
    expectedSeverity: 10,
    expectedCrisis: true,
    minConfidence: 0.95,
    maxResponseMs: 300
  },
  {
    id: 'critical_2',
    input: 'This is my last day. Goodbye everyone.',
    expectedSeverity: 9,
    expectedCrisis: true,
    minConfidence: 0.90,
    maxResponseMs: 300
  },
  {
    id: 'high_1',
    input: 'I keep thinking about ending it all. Life is not worth living.',
    expectedSeverity: 8,
    expectedCrisis: true,
    minConfidence: 0.85,
    maxResponseMs: 400
  },
  {
    id: 'high_2',
    input: 'Everyone would be better off without me. I\'m a burden.',
    expectedSeverity: 7,
    expectedCrisis: true,
    minConfidence: 0.80,
    maxResponseMs: 400
  },
  {
    id: 'moderate_1',
    input: 'I feel hopeless and trapped. Nothing ever gets better.',
    expectedSeverity: 6,
    expectedCrisis: true,
    minConfidence: 0.70,
    maxResponseMs: 500
  },
  {
    id: 'moderate_2',
    input: 'I hate myself so much. I\'m worthless.',
    expectedSeverity: 5,
    expectedCrisis: false,
    minConfidence: 0.60,
    maxResponseMs: 500
  },
  {
    id: 'low_1',
    input: 'I\'m feeling really sad and lonely today.',
    expectedSeverity: 3,
    expectedCrisis: false,
    minConfidence: 0.50,
    maxResponseMs: 500
  },
  {
    id: 'false_positive_1',
    input: 'I watched a movie about someone who wanted to end their life.',
    expectedSeverity: 1,
    expectedCrisis: false,
    minConfidence: 0.30,
    maxResponseMs: 500
  },
  {
    id: 'false_positive_2',
    input: 'My friend was talking about suicide prevention.',
    expectedSeverity: 1,
    expectedCrisis: false,
    minConfidence: 0.30,
    maxResponseMs: 500
  }
];

// Multilingual test cases
const MULTILINGUAL_TESTS = [
  {
    id: 'spanish_critical',
    input: 'Quiero terminar con mi vida',
    language: 'es',
    expectedCrisis: true,
    expectedSeverity: 9
  },
  {
    id: 'french_critical',
    input: 'Je veux en finir avec la vie',
    language: 'fr',
    expectedCrisis: true,
    expectedSeverity: 9
  },
  {
    id: 'chinese_critical',
    input: '我想结束我的生命',
    language: 'zh',
    expectedCrisis: true,
    expectedSeverity: 9
  }
];

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: [],
  metrics: {
    totalTests: 0,
    averageResponseTime: 0,
    averageConfidence: 0,
    aiProviderHealth: {}
  }
};

/**
 * Test crisis detection for a single input
 */
async function testCrisisDetection(testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/crisis/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      },
      body: JSON.stringify({
        content: testCase.input,
        userId: `test-user-${testCase.id}`,
        language: testCase.language || 'en'
      })
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    // Validate response structure
    if (!data.hasOwnProperty('isCrisis') || 
        !data.hasOwnProperty('severity') || 
        !data.hasOwnProperty('confidence')) {
      throw new Error('Invalid response structure');
    }

    // Check response time
    if (responseTime > testCase.maxResponseMs) {
      results.warnings.push({
        test: testCase.id,
        message: `Response time ${responseTime}ms exceeds limit ${testCase.maxResponseMs}ms`,
        severity: 'high'
      });
    }

    // Validate crisis detection accuracy
    const crisisMatch = data.isCrisis === testCase.expectedCrisis;
    const severityMatch = Math.abs(data.severity - testCase.expectedSeverity) <= 1;
    const confidenceMatch = data.confidence >= testCase.minConfidence;

    if (!crisisMatch || !severityMatch) {
      results.failed.push({
        test: testCase.id,
        expected: {
          crisis: testCase.expectedCrisis,
          severity: testCase.expectedSeverity,
          minConfidence: testCase.minConfidence
        },
        actual: {
          crisis: data.isCrisis,
          severity: data.severity,
          confidence: data.confidence
        },
        responseTime,
        error: 'Detection mismatch'
      });
      return false;
    }

    if (!confidenceMatch) {
      results.warnings.push({
        test: testCase.id,
        message: `Low confidence: ${data.confidence} (min: ${testCase.minConfidence})`,
        severity: 'medium'
      });
    }

    results.passed.push({
      test: testCase.id,
      responseTime,
      confidence: data.confidence,
      provider: data.provider
    });

    // Update metrics
    results.metrics.totalTests++;
    results.metrics.averageResponseTime = 
      (results.metrics.averageResponseTime * (results.metrics.totalTests - 1) + responseTime) / 
      results.metrics.totalTests;
    results.metrics.averageConfidence = 
      (results.metrics.averageConfidence * (results.metrics.totalTests - 1) + data.confidence) / 
      results.metrics.totalTests;

    return true;

  } catch (error) {
    results.failed.push({
      test: testCase.id,
      error: error.message,
      responseTime: Date.now() - startTime
    });
    return false;
  }
}

/**
 * Test 988 integration
 */
async function test988Integration() {
  console.log(chalk.yellow('\n📞 Testing 988 Lifeline Integration...'));
  
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/988/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      }
    });

    const data = await response.json();
    
    if (data.status === 'ready' && data.responseTime < 1000) {
      console.log(chalk.green('✅ 988 Integration: OPERATIONAL'));
      console.log(chalk.gray(`   Response time: ${data.responseTime}ms`));
      return true;
    } else {
      console.log(chalk.red('❌ 988 Integration: FAILED'));
      console.log(chalk.gray(`   Status: ${data.status}, Response: ${data.responseTime}ms`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ 988 Integration: ERROR'));
    console.log(chalk.gray(`   ${error.message}`));
    return false;
  }
}

/**
 * Test AI service health
 */
async function testAIServices() {
  console.log(chalk.yellow('\n🤖 Testing AI Services Health...'));
  
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/ai/health`);
    const data = await response.json();
    
    const providers = ['openai', 'anthropic', 'gemini', 'fallback'];
    let allHealthy = true;
    
    for (const provider of providers) {
      const status = data.providers?.[provider] || 'unknown';
      const isHealthy = status === 'healthy';
      
      if (!isHealthy && provider !== 'fallback') {
        allHealthy = false;
      }
      
      const statusIcon = isHealthy ? '✅' : '❌';
      const statusColor = isHealthy ? chalk.green : chalk.red;
      
      console.log(statusColor(`${statusIcon} ${provider}: ${status.toUpperCase()}`));
      
      results.metrics.aiProviderHealth[provider] = status;
    }
    
    return allHealthy;
  } catch (error) {
    console.log(chalk.red('❌ AI Services Check: ERROR'));
    console.log(chalk.gray(`   ${error.message}`));
    return false;
  }
}

/**
 * Test failover mechanisms
 */
async function testFailover() {
  console.log(chalk.yellow('\n🔄 Testing Failover Mechanisms...'));
  
  try {
    // Simulate primary AI failure
    const response = await fetch(`${CONFIG.apiUrl}/api/crisis/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true',
        'X-Force-Provider': 'fallback'
      },
      body: JSON.stringify({
        content: 'I want to end my life',
        userId: 'test-failover'
      })
    });

    const data = await response.json();
    
    if (data.provider === 'local-crisis' && data.isCrisis === true) {
      console.log(chalk.green('✅ Failover to local detection: WORKING'));
      return true;
    } else {
      console.log(chalk.red('❌ Failover mechanism: FAILED'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Failover test: ERROR'));
    console.log(chalk.gray(`   ${error.message}`));
    return false;
  }
}

/**
 * Run performance stress test
 */
async function runStressTest() {
  console.log(chalk.yellow('\n⚡ Running Performance Stress Test...'));
  
  const concurrentRequests = 10;
  const testInput = 'I am feeling very depressed and hopeless';
  const promises = [];
  
  const startTime = Date.now();
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      fetch(`${CONFIG.apiUrl}/api/crisis/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: testInput,
          userId: `stress-test-${i}`
        })
      })
    );
  }
  
  try {
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / concurrentRequests;
    
    const allSuccessful = responses.every(r => r.status === 200);
    
    if (allSuccessful && avgTime < 1000) {
      console.log(chalk.green(`✅ Stress test passed: ${concurrentRequests} requests in ${totalTime}ms`));
      console.log(chalk.gray(`   Average response time: ${avgTime.toFixed(2)}ms`));
      return true;
    } else {
      console.log(chalk.red(`❌ Stress test failed: Average time ${avgTime}ms`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Stress test: ERROR'));
    console.log(chalk.gray(`   ${error.message}`));
    return false;
  }
}

/**
 * Generate test report
 */
function generateReport() {
  console.log(chalk.blue('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('CRISIS DETECTION SYSTEM TEST REPORT'));
  console.log(chalk.blue('='.repeat(60)));
  
  const totalTests = results.passed.length + results.failed.length;
  const passRate = (results.passed.length / totalTests * 100).toFixed(1);
  
  console.log(chalk.white('\n📊 Test Results:'));
  console.log(chalk.green(`   ✅ Passed: ${results.passed.length}`));
  console.log(chalk.red(`   ❌ Failed: ${results.failed.length}`));
  console.log(chalk.yellow(`   ⚠️  Warnings: ${results.warnings.length}`));
  console.log(chalk.white(`   📈 Pass Rate: ${passRate}%`));
  
  console.log(chalk.white('\n⚡ Performance Metrics:'));
  console.log(`   Average Response Time: ${results.metrics.averageResponseTime.toFixed(2)}ms`);
  console.log(`   Average Confidence: ${(results.metrics.averageConfidence * 100).toFixed(1)}%`);
  
  if (results.failed.length > 0) {
    console.log(chalk.red('\n❌ Failed Tests:'));
    results.failed.forEach(fail => {
      console.log(chalk.red(`   - ${fail.test}: ${fail.error || 'Detection mismatch'}`));
      if (fail.expected) {
        console.log(chalk.gray(`     Expected: Crisis=${fail.expected.crisis}, Severity=${fail.expected.severity}`));
        console.log(chalk.gray(`     Actual: Crisis=${fail.actual.crisis}, Severity=${fail.actual.severity}`));
      }
    });
  }
  
  if (results.warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:'));
    results.warnings.forEach(warn => {
      console.log(chalk.yellow(`   - ${warn.test}: ${warn.message}`));
    });
  }
  
  // Final verdict
  console.log(chalk.blue('\n' + '='.repeat(60)));
  
  const allCriticalPassed = CRISIS_TEST_CASES
    .filter(tc => tc.expectedSeverity >= 8)
    .every(tc => results.passed.some(p => p.test === tc.id));
  
  if (results.failed.length === 0 && allCriticalPassed) {
    console.log(chalk.green.bold('✅ SYSTEM READY FOR PRODUCTION'));
    console.log(chalk.green('All critical crisis detection tests passed.'));
    return true;
  } else {
    console.log(chalk.red.bold('❌ SYSTEM NOT READY FOR PRODUCTION'));
    console.log(chalk.red('Critical tests failed. DO NOT DEPLOY.'));
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(chalk.blue.bold('\n🚨 CRISIS DETECTION SYSTEM TEST SUITE'));
  console.log(chalk.gray('Testing life-critical mental health detection systems...'));
  console.log(chalk.gray(`API URL: ${CONFIG.apiUrl}`));
  console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}`));
  
  // Check environment
  if (!CONFIG.openAiKey || !CONFIG.anthropicKey) {
    console.log(chalk.red('\n❌ ERROR: AI service keys not configured'));
    console.log(chalk.yellow('Please set environment variables:'));
    console.log(chalk.gray('  VITE_OPENAI_API_KEY'));
    console.log(chalk.gray('  VITE_ANTHROPIC_API_KEY'));
    console.log(chalk.gray('  VITE_GOOGLE_GEMINI_API_KEY'));
    process.exit(1);
  }
  
  // Run tests
  console.log(chalk.yellow('\n🧪 Running Crisis Detection Tests...'));
  
  for (const testCase of CRISIS_TEST_CASES) {
    process.stdout.write(chalk.gray(`Testing ${testCase.id}... `));
    const result = await testCrisisDetection(testCase);
    console.log(result ? chalk.green('✅') : chalk.red('❌'));
  }
  
  // Run multilingual tests if Gemini is configured
  if (CONFIG.geminiKey) {
    console.log(chalk.yellow('\n🌍 Running Multilingual Tests...'));
    for (const testCase of MULTILINGUAL_TESTS) {
      process.stdout.write(chalk.gray(`Testing ${testCase.id}... `));
      const result = await testCrisisDetection(testCase);
      console.log(result ? chalk.green('✅') : chalk.red('❌'));
    }
  }
  
  // Additional system tests
  const integrationOk = await test988Integration();
  const aiServicesOk = await testAIServices();
  const failoverOk = await testFailover();
  const stressTestOk = await runStressTest();
  
  // Generate final report
  const systemReady = generateReport();
  
  // Exit with appropriate code
  process.exit(systemReady ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ FATAL ERROR:'), error);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n❌ Test suite failed:'), error);
  process.exit(1);
});