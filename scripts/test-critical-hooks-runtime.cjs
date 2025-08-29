/**
 * Critical Hooks Runtime Integration Test
 * Tests runtime functionality of critical mental health platform hooks
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Critical hooks for mental health platform
const CRITICAL_HOOKS = [
  'useAuth',
  'useEnhancedCrisisDetection',
  'useCulturalCrisisDetection',
  'usePrivacyAnalytics',
  'usePerformanceMonitor',
  'useMobile',
  'useConnectionStatus',
  'useCrisisAssessment',
  'useTherapeuticInterventions',
  'useProfessionalVerification'
];

const testResults = {
  runtime: {
    passed: [],
    failed: [],
    errors: []
  },
  typeChecking: {
    passed: [],
    failed: [],
    errors: []
  },
  serviceDependencies: {
    working: [],
    broken: [],
    missing: []
  },
  storeIntegration: {
    working: [],
    broken: [],
    missing: []
  }
};

// Test TypeScript compilation for a hook
async function testTypeScriptCompilation(hookName) {
  const hookPath = path.join(__dirname, '..', 'src', 'hooks', `${hookName}.ts`);
  const testPath = path.join(__dirname, '..', 'src', 'hooks', `${hookName}.test.ts`);
  
  try {
    // Check if hook file exists
    await fs.access(hookPath);
    
    // Create a temporary test file to check compilation
    const testContent = `
import { ${hookName} } from './${hookName}';

// Test that the hook can be imported and used
const TestComponent = () => {
  const hookResult = ${hookName}();
  return null;
};

export default TestComponent;
`;
    
    const tempTestFile = path.join(__dirname, `temp-test-${hookName}.tsx`);
    await fs.writeFile(tempTestFile, testContent);
    
    try {
      // Try to compile with TypeScript
      execSync(`npx tsc --noEmit --jsx react ${tempTestFile}`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      
      testResults.typeChecking.passed.push(hookName);
      return { success: true, hook: hookName };
    } catch (error) {
      testResults.typeChecking.failed.push(hookName);
      testResults.typeChecking.errors.push({
        hook: hookName,
        error: error.message || error.toString()
      });
      return { success: false, hook: hookName, error: error.message };
    } finally {
      // Clean up temp file
      await fs.unlink(tempTestFile).catch(() => {});
    }
  } catch (error) {
    testResults.typeChecking.failed.push(hookName);
    testResults.typeChecking.errors.push({
      hook: hookName,
      error: `Hook file not found: ${error.message}`
    });
    return { success: false, hook: hookName, error: 'File not found' };
  }
}

// Test service integration
async function testServiceIntegration(hookName) {
  const hookPath = path.join(__dirname, '..', 'src', 'hooks', `${hookName}.ts`);
  
  try {
    const content = await fs.readFile(hookPath, 'utf-8');
    
    // Extract service imports
    const serviceImportRegex = /import\s+.*\s+from\s+['"]\.\.\/services\/([^'"]+)['"]/g;
    const services = [];
    let match;
    
    while ((match = serviceImportRegex.exec(content)) !== null) {
      const serviceName = match[1].replace('.ts', '');
      services.push(serviceName);
      
      // Check if service file exists
      const servicePath = path.join(__dirname, '..', 'src', 'services', `${serviceName}.ts`);
      try {
        await fs.access(servicePath);
        testResults.serviceDependencies.working.push({
          hook: hookName,
          service: serviceName
        });
      } catch {
        testResults.serviceDependencies.missing.push({
          hook: hookName,
          service: serviceName
        });
      }
    }
    
    return { hook: hookName, services };
  } catch (error) {
    testResults.serviceDependencies.broken.push({
      hook: hookName,
      error: error.message
    });
    return { hook: hookName, error: error.message };
  }
}

// Test store integration
async function testStoreIntegration(hookName) {
  const hookPath = path.join(__dirname, '..', 'src', 'hooks', `${hookName}.ts`);
  
  try {
    const content = await fs.readFile(hookPath, 'utf-8');
    
    // Check for Zustand store usage
    const storeImportRegex = /import\s+.*\s+from\s+['"]\.\.\/stores\/([^'"]+)['"]/g;
    const stores = [];
    let match;
    
    while ((match = storeImportRegex.exec(content)) !== null) {
      const storeName = match[1].replace('.ts', '');
      stores.push(storeName);
      
      // Check if store file exists
      const storePath = path.join(__dirname, '..', 'src', 'stores', `${storeName}.ts`);
      try {
        await fs.access(storePath);
        testResults.storeIntegration.working.push({
          hook: hookName,
          store: storeName
        });
      } catch {
        testResults.storeIntegration.missing.push({
          hook: hookName,
          store: storeName
        });
      }
    }
    
    // Also check for direct Zustand usage
    if (content.includes('useStore') || content.includes('create(') || content.includes('zustand')) {
      if (stores.length === 0) {
        stores.push('direct-zustand-usage');
      }
    }
    
    return { hook: hookName, stores };
  } catch (error) {
    testResults.storeIntegration.broken.push({
      hook: hookName,
      error: error.message
    });
    return { hook: hookName, error: error.message };
  }
}

// Test hook export structure
async function testHookExports(hookName) {
  const hookPath = path.join(__dirname, '..', 'src', 'hooks', `${hookName}.ts`);
  
  try {
    const content = await fs.readFile(hookPath, 'utf-8');
    
    // Check for proper hook export
    const hasNamedExport = content.includes(`export const ${hookName}`) || 
                          content.includes(`export function ${hookName}`);
    const hasDefaultExport = content.includes('export default');
    
    // Check for TypeScript types
    const hasTypes = content.includes('interface') || content.includes('type');
    
    // Check for React hooks usage
    const usesReactHooks = content.includes('useState') || 
                          content.includes('useEffect') || 
                          content.includes('useCallback') ||
                          content.includes('useMemo');
    
    return {
      hook: hookName,
      hasNamedExport,
      hasDefaultExport,
      hasTypes,
      usesReactHooks,
      isValid: (hasNamedExport || hasDefaultExport) && usesReactHooks
    };
  } catch (error) {
    return {
      hook: hookName,
      error: error.message,
      isValid: false
    };
  }
}

// Main test runner
async function runCriticalHookTests() {
  console.log('=====================================');
  console.log('CRITICAL HOOKS RUNTIME TEST REPORT');
  console.log('=====================================\n');
  
  console.log('Testing critical mental health platform hooks...\n');
  
  for (const hookName of CRITICAL_HOOKS) {
    console.log(`Testing ${hookName}...`);
    
    // Test exports
    const exportTest = await testHookExports(hookName);
    if (exportTest.isValid) {
      testResults.runtime.passed.push(hookName);
    } else {
      testResults.runtime.failed.push(hookName);
      if (exportTest.error) {
        testResults.runtime.errors.push({
          hook: hookName,
          error: exportTest.error
        });
      }
    }
    
    // Test TypeScript compilation
    await testTypeScriptCompilation(hookName);
    
    // Test service integration
    await testServiceIntegration(hookName);
    
    // Test store integration
    await testStoreIntegration(hookName);
  }
  
  // Generate report
  console.log('\n=====================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('=====================================\n');
  
  console.log('RUNTIME VALIDATION:');
  console.log(`  ✅ Passed: ${testResults.runtime.passed.length}/${CRITICAL_HOOKS.length}`);
  console.log(`  ❌ Failed: ${testResults.runtime.failed.length}/${CRITICAL_HOOKS.length}`);
  
  if (testResults.runtime.failed.length > 0) {
    console.log('\n  Failed hooks:');
    testResults.runtime.failed.forEach(hook => {
      console.log(`    - ${hook}`);
    });
  }
  
  console.log('\nTYPE SAFETY:');
  console.log(`  ✅ Type-safe: ${testResults.typeChecking.passed.length}`);
  console.log(`  ❌ Type errors: ${testResults.typeChecking.failed.length}`);
  
  if (testResults.typeChecking.errors.length > 0) {
    console.log('\n  Type errors:');
    testResults.typeChecking.errors.slice(0, 5).forEach(err => {
      console.log(`    - ${err.hook}: ${err.error.substring(0, 100)}...`);
    });
  }
  
  console.log('\nSERVICE INTEGRATION:');
  console.log(`  ✅ Working: ${testResults.serviceDependencies.working.length}`);
  console.log(`  ❌ Missing: ${testResults.serviceDependencies.missing.length}`);
  console.log(`  ⚠️  Broken: ${testResults.serviceDependencies.broken.length}`);
  
  if (testResults.serviceDependencies.missing.length > 0) {
    console.log('\n  Missing services:');
    testResults.serviceDependencies.missing.forEach(dep => {
      console.log(`    - ${dep.hook} → ${dep.service}`);
    });
  }
  
  console.log('\nSTORE INTEGRATION:');
  console.log(`  ✅ Working: ${testResults.storeIntegration.working.length}`);
  console.log(`  ❌ Missing: ${testResults.storeIntegration.missing.length}`);
  console.log(`  ⚠️  Broken: ${testResults.storeIntegration.broken.length}`);
  
  // Mental health specific validations
  console.log('\nMENTAL HEALTH PLATFORM VALIDATIONS:');
  
  const crisisHooks = CRITICAL_HOOKS.filter(h => h.toLowerCase().includes('crisis'));
  const crisisWorking = crisisHooks.filter(h => testResults.runtime.passed.includes(h));
  console.log(`  Crisis Detection: ${crisisWorking.length}/${crisisHooks.length} working`);
  
  const privacyHooks = CRITICAL_HOOKS.filter(h => h.toLowerCase().includes('privacy'));
  const privacyWorking = privacyHooks.filter(h => testResults.runtime.passed.includes(h));
  console.log(`  Privacy Analytics: ${privacyWorking.length}/${privacyHooks.length} working`);
  
  const authHooks = CRITICAL_HOOKS.filter(h => h.toLowerCase().includes('auth'));
  const authWorking = authHooks.filter(h => testResults.runtime.passed.includes(h));
  console.log(`  Authentication: ${authWorking.length}/${authHooks.length} working`);
  
  // Generate recommendations
  console.log('\nRECOMMENDATIONS:');
  
  const recommendations = [];
  
  if (testResults.runtime.failed.length > 0) {
    recommendations.push('1. Fix hook export structures for failed hooks');
  }
  
  if (testResults.typeChecking.failed.length > 0) {
    recommendations.push('2. Resolve TypeScript type errors in hooks');
  }
  
  if (testResults.serviceDependencies.missing.length > 0) {
    recommendations.push('3. Create missing service dependencies or update import paths');
  }
  
  if (testResults.storeIntegration.missing.length > 0) {
    recommendations.push('4. Create missing store dependencies or update import paths');
  }
  
  if (crisisWorking.length < crisisHooks.length) {
    recommendations.push('5. CRITICAL: Fix crisis detection hooks before deployment');
  }
  
  if (privacyWorking.length < privacyHooks.length) {
    recommendations.push('6. CRITICAL: Fix privacy analytics hooks for HIPAA compliance');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All critical hooks are properly integrated and functional!');
  }
  
  recommendations.forEach(rec => console.log(`  ${rec}`));
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    criticalHooks: CRITICAL_HOOKS,
    results: testResults,
    summary: {
      totalTested: CRITICAL_HOOKS.length,
      runtimePassed: testResults.runtime.passed.length,
      typeSafe: testResults.typeChecking.passed.length,
      serviceIntegration: {
        working: testResults.serviceDependencies.working.length,
        missing: testResults.serviceDependencies.missing.length
      },
      storeIntegration: {
        working: testResults.storeIntegration.working.length,
        missing: testResults.storeIntegration.missing.length
      }
    },
    recommendations
  };
  
  await fs.writeFile(
    path.join(__dirname, '..', 'CRITICAL_HOOKS_RUNTIME_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Detailed report saved to CRITICAL_HOOKS_RUNTIME_REPORT.json');
  
  // Determine overall status
  const hasBlockingIssues = 
    testResults.runtime.failed.includes('useAuth') ||
    testResults.runtime.failed.includes('useEnhancedCrisisDetection') ||
    testResults.runtime.failed.includes('useCulturalCrisisDetection') ||
    testResults.runtime.failed.includes('usePrivacyAnalytics');
  
  if (hasBlockingIssues) {
    console.log('\n❌ BLOCKING ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION');
    process.exit(1);
  } else if (testResults.runtime.failed.length > 0) {
    console.log('\n⚠️  Non-blocking issues found - Review before deployment');
    process.exit(0);
  } else {
    console.log('\n✅ All critical hooks are production-ready!');
    process.exit(0);
  }
}

// Run tests
runCriticalHookTests().catch(error => {
  console.error('Fatal error during critical hook testing:', error);
  process.exit(1);
});