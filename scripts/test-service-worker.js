/**
 * Service Worker Test Suite Runner
 * Comprehensive test execution for service worker functionality
 */

const { execSync } = require('child_process');
const path = require('path');

class ServiceWorkerTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Unit Tests',
        command: 'npm run test:sw-unit',
        description: 'Service worker registration and cache strategy tests'
      },
      {
        name: 'Integration Tests',
        command: 'npm run test:sw-integration',
        description: 'Offline functionality and crisis scenario tests'
      },
      {
        name: 'Performance Tests',
        command: 'npm run test:sw-performance',
        description: 'Performance metrics and optimization tests'
      },
      {
        name: 'Cross-Browser Tests',
        command: 'npm run test:sw-cross-browser',
        description: 'Browser compatibility and feature detection tests'
      }
    ];
  }

  async runAllTests() {
    console.log('🧪 Starting Service Worker Test Suite');
    console.log('=====================================\n');

    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: this.testSuites.length
    };

    for (const suite of this.testSuites) {
      try {
        console.log(`\n🔍 Running ${suite.name}...`);
        console.log(`📋 ${suite.description}\n`);

        const startTime = Date.now();
        execSync(suite.command, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        const endTime = Date.now();

        console.log(`✅ ${suite.name} completed in ${endTime - startTime}ms\n`);
        results.passed++;

      } catch (error) {
        console.error(`❌ ${suite.name} failed:`);
        console.error(error.message);
        results.failed++;
      }
    }

    this.printSummary(results);
  }

  async runWithCoverage() {
    console.log('📊 Running Service Worker Tests with Coverage');
    console.log('============================================\n');

    try {
      execSync('npm run test:sw-coverage', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('\n✅ Coverage report generated successfully');
    } catch (error) {
      console.error('\n❌ Coverage run failed:', error.message);
    }
  }

  async runPerformanceBenchmarks() {
    console.log('⚡ Running Service Worker Performance Benchmarks');
    console.log('===============================================\n');

    try {
      execSync('npm run test:sw-performance', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('\n✅ Performance benchmarks completed');
    } catch (error) {
      console.error('\n❌ Performance benchmarks failed:', error.message);
    }
  }

  printSummary(results) {
    console.log('\n📋 Test Suite Summary');
    console.log('====================');
    console.log(`Total Suites: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    
    const successRate = (results.passed / results.total * 100).toFixed(1);
    console.log(`📊 Success Rate: ${successRate}%`);

    if (results.failed === 0) {
      console.log('\n🎉 All service worker tests passed! 🎉');
    } else {
      console.log(`\n⚠️  ${results.failed} test suite(s) failed. Please review the output above.`);
    }
  }

  async validateServiceWorkerDeployment() {
    console.log('🔍 Validating Service Worker Deployment');
    console.log('======================================\n');

    try {
      // Run the existing verification script
      execSync('npm run verify:sw', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('\n✅ Service worker deployment validation passed');
    } catch (error) {
      console.error('\n❌ Service worker deployment validation failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
const command = process.argv[2];
const runner = new ServiceWorkerTestRunner();

switch (command) {
  case 'all':
    runner.runAllTests();
    break;
  case 'coverage':
    runner.runWithCoverage();
    break;
  case 'performance':
    runner.runPerformanceBenchmarks();
    break;
  case 'validate':
    runner.validateServiceWorkerDeployment();
    break;
  case 'ci':
    // Continuous Integration mode
    runner.runAllTests()
      .then(() => runner.runWithCoverage())
      .then(() => runner.validateServiceWorkerDeployment())
      .then(() => {
        console.log('\n🚀 CI pipeline completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 CI pipeline failed:', error.message);
        process.exit(1);
      });
    break;
  default:
    console.log('Service Worker Test Runner');
    console.log('========================\n');
    console.log('Usage: node scripts/test-service-worker.js <command>\n');
    console.log('Commands:');
    console.log('  all         - Run all test suites');
    console.log('  coverage    - Run tests with coverage report');
    console.log('  performance - Run performance benchmarks');
    console.log('  validate    - Validate service worker deployment');
    console.log('  ci          - Run full CI pipeline\n');
    console.log('Example: node scripts/test-service-worker.js all');
}

module.exports = ServiceWorkerTestRunner;
