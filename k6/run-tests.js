#!/usr/bin/env node

/**
 * K6 Test Runner for Mental Health Platform
 * This script orchestrates the execution of all performance tests
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseDir: __dirname,
  testsDir: path.join(__dirname, 'tests'),
  resultsDir: path.join(__dirname, 'results'),
  environment: process.env.NODE_ENV || 'local',
  
  // Test suites
  testSuites: {
    smoke: {
      name: 'Smoke Tests',
      description: 'Quick validation of core functionality',
      duration: '2m',
      vus: 2,
      tests: [
        'authentication-load.js',
        'crisis-services-load.js'
      ]
    },
    
    load: {
      name: 'Load Tests', 
      description: 'Normal expected load testing',
      duration: '10m',
      vus: 50,
      tests: [
        'authentication-load.js',
        'crisis-services-load.js',
        'teletherapy-load.js'
      ]
    },
    
    stress: {
      name: 'Stress Tests',
      description: 'High load stress testing',
      duration: '15m',
      vus: 100,
      tests: [
        'authentication-load.js',
        'crisis-services-load.js',
        'teletherapy-load.js'
      ]
    },
    
    crisis: {
      name: 'Crisis Services Tests',
      description: 'Dedicated crisis intervention testing',
      duration: '8m', 
      vus: 25,
      tests: [
        'crisis-services-load.js'
      ]
    },
    
    teletherapy: {
      name: 'Teletherapy Tests',
      description: 'Video session and WebRTC testing',
      duration: '12m',
      vus: 30,
      tests: [
        'teletherapy-load.js'
      ]
    }
  }
};

class K6TestRunner {
  constructor() {
    this.results = [];
    this.setupResultsDirectory();
  }
  
  setupResultsDirectory() {
    if (!fs.existsSync(TEST_CONFIG.resultsDir)) {
      fs.mkdirSync(TEST_CONFIG.resultsDir, { recursive: true });
    }
  }
  
  async runTestSuite(suiteName, options = {}) {
    const suite = TEST_CONFIG.testSuites[suiteName];
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`);
    }
    
    console.log(`\n🧪 Running ${suite.name}`);
    console.log(`📝 ${suite.description}`);
    console.log(`⏱️  Duration: ${suite.duration}, VUs: ${suite.vus}`);
    console.log('─'.repeat(60));
    
    const suiteResults = [];
    
    for (const testFile of suite.tests) {
      const testPath = path.join(TEST_CONFIG.testsDir, testFile);
      const testName = testFile.replace('.js', '');
      
      console.log(`\n🔄 Running test: ${testName}`);
      
      try {
        const result = await this.runK6Test(testPath, {
          ...options,
          duration: suite.duration,
          vus: suite.vus,
          testName
        });
        
        suiteResults.push(result);
        console.log(`✅ Test ${testName} completed successfully`);
        
      } catch (error) {
        console.error(`❌ Test ${testName} failed:`, error.message);
        suiteResults.push({
          testName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    this.results.push({
      suiteName,
      suite,
      results: suiteResults,
      timestamp: new Date().toISOString()
    });
    
    return suiteResults;
  }
  
  async runK6Test(testPath, options = {}) {
    const {
      duration = '5m',
      vus = 10,
      testName = 'k6-test',
      environment = TEST_CONFIG.environment
    } = options;
    
    // Generate unique result file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = path.join(TEST_CONFIG.resultsDir, `${testName}-${timestamp}.json`);
    const summaryFile = path.join(TEST_CONFIG.resultsDir, `${testName}-${timestamp}-summary.json`);
    
    // Build K6 command
    const k6Command = [
      'k6 run',
      `--duration ${duration}`,
      `--vus ${vus}`,
      `--out json=${resultFile}`,
      `--summary-export ${summaryFile}`,
      `--env ENVIRONMENT=${environment}`,
      `--env BASE_URL=${this.getBaseUrl(environment)}`,
      `--env WS_URL=${this.getWebSocketUrl(environment)}`,
      '--no-color',
      testPath
    ].join(' ');
    
    console.log(`📋 Command: ${k6Command}`);
    
    try {
      const output = execSync(k6Command, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      // Parse results
      const summary = this.parseSummary(summaryFile);
      
      return {
        testName,
        status: 'passed',
        duration,
        vus,
        resultFile,
        summaryFile,
        summary,
        output: output.slice(-1000) // Last 1000 characters
      };
      
    } catch (error) {
      throw new Error(`K6 test execution failed: ${error.message}`);
    }
  }
  
  getBaseUrl(environment) {
    const urls = {
      local: 'http://localhost:3000',
      staging: 'https://staging.mentalhealthapp.test',
      production: 'https://api.mentalhealthapp.com'
    };
    return urls[environment] || urls.local;
  }
  
  getWebSocketUrl(environment) {
    const urls = {
      local: 'ws://localhost:3000',
      staging: 'wss://staging.mentalhealthapp.test',
      production: 'wss://ws.mentalhealthapp.com'
    };
    return urls[environment] || urls.local;
  }
  
  parseSummary(summaryFile) {
    try {
      if (fs.existsSync(summaryFile)) {
        const content = fs.readFileSync(summaryFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Could not parse summary file: ${error.message}`);
    }
    return null;
  }
  
  generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      environment: TEST_CONFIG.environment,
      totalSuites: this.results.length,
      summary: this.generateSummary(),
      results: this.results
    };
    
    const reportFile = path.join(TEST_CONFIG.resultsDir, `performance-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    this.generateHtmlReport(reportData, reportFile.replace('.json', '.html'));
    
    console.log(`\n📊 Performance test report generated: ${reportFile}`);
    return reportData;
  }
  
  generateSummary() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    for (const suiteResult of this.results) {
      for (const testResult of suiteResult.results) {
        totalTests++;
        if (testResult.status === 'passed') {
          passedTests++;
        } else {
          failedTests++;
        }
      }
    }
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0
    };
  }
  
  generateHtmlReport(reportData, outputFile) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Mental Health Platform - Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .summary { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .suite { border: 1px solid #d1d5db; margin: 20px 0; border-radius: 8px; }
        .suite-header { background: #e5e7eb; padding: 15px; border-radius: 8px 8px 0 0; }
        .test-result { padding: 15px; border-bottom: 1px solid #e5e7eb; }
        .passed { color: #059669; }
        .failed { color: #dc2626; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-weight: bold; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 Mental Health Platform - Performance Test Report</h1>
        <p class="timestamp">Generated: ${reportData.timestamp}</p>
        <p>Environment: <strong>${reportData.environment}</strong></p>
    </div>
    
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <div class="metric">
            <span class="metric-label">Total Suites:</span> ${reportData.totalSuites}
        </div>
        <div class="metric">
            <span class="metric-label">Total Tests:</span> ${reportData.summary.totalTests}
        </div>
        <div class="metric">
            <span class="metric-label passed">Passed:</span> ${reportData.summary.passedTests}
        </div>
        <div class="metric">
            <span class="metric-label failed">Failed:</span> ${reportData.summary.failedTests}
        </div>
        <div class="metric">
            <span class="metric-label">Success Rate:</span> ${reportData.summary.successRate}%
        </div>
    </div>
    
    ${reportData.results.map(suiteResult => `
        <div class="suite">
            <div class="suite-header">
                <h3>${suiteResult.suite.name}</h3>
                <p>${suiteResult.suite.description}</p>
                <p class="timestamp">Executed: ${suiteResult.timestamp}</p>
            </div>
            ${suiteResult.results.map(testResult => `
                <div class="test-result">
                    <h4 class="${testResult.status}">${testResult.testName}</h4>
                    <p>Status: <span class="${testResult.status}">${testResult.status.toUpperCase()}</span></p>
                    ${testResult.summary ? `
                        <p>Average Response Time: ${testResult.summary.metrics?.http_req_duration?.avg || 'N/A'}ms</p>
                        <p>95th Percentile: ${testResult.summary.metrics?.http_req_duration?.p95 || 'N/A'}ms</p>
                        <p>Error Rate: ${testResult.summary.metrics?.http_req_failed?.rate || 'N/A'}</p>
                    ` : ''}
                    ${testResult.error ? `<p class="failed">Error: ${testResult.error}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <div class="summary">
        <h2>🔍 Test Details</h2>
        <p>For detailed metrics, check the individual JSON result files in the results directory.</p>
        <p><strong>Critical Services Tested:</strong></p>
        <ul>
            <li>🔐 Authentication & Authorization</li>
            <li>🚨 Crisis Detection & Response</li>
            <li>📞 988 Lifeline Integration</li>
            <li>🎥 Teletherapy Video Sessions</li>
            <li>👥 Group Therapy Sessions</li>
            <li>🛡️ Safety Plan Activation</li>
        </ul>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(outputFile, html);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const runner = new K6TestRunner();
  
  switch (command) {
    case 'smoke':
      await runner.runTestSuite('smoke');
      break;
      
    case 'load':
      await runner.runTestSuite('load');
      break;
      
    case 'stress':
      await runner.runTestSuite('stress');
      break;
      
    case 'crisis':
      await runner.runTestSuite('crisis');
      break;
      
    case 'teletherapy':
      await runner.runTestSuite('teletherapy');
      break;
      
    case 'all':
      console.log('🚀 Running all performance test suites for Mental Health Platform\n');
      await runner.runTestSuite('smoke');
      await runner.runTestSuite('load');
      await runner.runTestSuite('crisis');
      await runner.runTestSuite('teletherapy');
      break;
      
    case 'help':
    default:
      console.log(`
🏥 Mental Health Platform - K6 Performance Test Runner

Usage: node run-tests.js <command>

Commands:
  smoke       Run smoke tests (quick validation)
  load        Run load tests (normal expected load)
  stress      Run stress tests (high load)
  crisis      Run crisis services tests only
  teletherapy Run teletherapy session tests only
  all         Run all test suites
  help        Show this help message

Environment Variables:
  NODE_ENV    Set environment (local, staging, production)
  
Examples:
  node run-tests.js smoke
  NODE_ENV=staging node run-tests.js load
  node run-tests.js all
      `);
      return;
  }
  
  // Generate final report
  const report = runner.generateReport();
  
  console.log('\n🎉 Performance testing completed!');
  console.log(`📈 Success Rate: ${report.summary.successRate}%`);
  console.log(`✅ Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
  
  if (report.summary.failedTests > 0) {
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    process.exit(1);
  }
}

// Run if called directly  
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { K6TestRunner, TEST_CONFIG };