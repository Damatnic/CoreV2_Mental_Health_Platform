/**
 * Comprehensive Hook and Model Integration Test Script
 * Tests all hooks, their service dependencies, and store integrations
 */

const fs = require('fs').promises;
const path = require('path');

const HOOKS_DIR = path.join(__dirname, '..', 'src', 'hooks');
const SERVICES_DIR = path.join(__dirname, '..', 'src', 'services');
const STORES_DIR = path.join(__dirname, '..', 'src', 'stores');
const CONTEXTS_DIR = path.join(__dirname, '..', 'src', 'contexts');

// Test results tracking
const testResults = {
  hooks: {
    total: 0,
    passed: [],
    failed: [],
    issues: []
  },
  services: {
    total: 0,
    used: [],
    missing: []
  },
  stores: {
    total: 0,
    used: [],
    missing: []
  },
  contexts: {
    total: 0,
    used: [],
    missing: []
  },
  integration: {
    hookToService: [],
    hookToStore: [],
    hookToContext: [],
    circularDependencies: [],
    missingDependencies: []
  }
};

// Helper function to extract imports from a file
async function extractImports(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const imports = [];
    
    // Match ES6 imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Match dynamic imports
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Helper function to extract exports from a file
async function extractExports(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const exports = [];
    
    // Match named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Match export { ... } statements
    const exportBracesRegex = /export\s*{([^}]+)}/g;
    while ((match = exportBracesRegex.exec(content)) !== null) {
      const items = match[1].split(',').map(item => item.trim().split(/\s+as\s+/)[0]);
      exports.push(...items);
    }
    
    // Check for default export
    if (/export\s+default\s+/m.test(content)) {
      exports.push('default');
    }
    
    return exports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Test individual hook
async function testHook(hookPath) {
  const hookName = path.basename(hookPath, '.ts').replace('.tsx', '');
  const hookInfo = {
    name: hookName,
    path: hookPath,
    imports: [],
    exports: [],
    dependencies: {
      services: [],
      stores: [],
      contexts: [],
      hooks: []
    },
    issues: []
  };
  
  try {
    // Extract imports and exports
    hookInfo.imports = await extractImports(hookPath);
    hookInfo.exports = await extractExports(hookPath);
    
    // Check if the hook is properly exported
    if (hookInfo.exports.length === 0) {
      hookInfo.issues.push('No exports found');
    }
    
    // Analyze dependencies
    for (const importPath of hookInfo.imports) {
      if (importPath.includes('../services/')) {
        const serviceName = path.basename(importPath, '.ts');
        hookInfo.dependencies.services.push(serviceName);
        testResults.services.used.push(serviceName);
      } else if (importPath.includes('../stores/')) {
        const storeName = path.basename(importPath, '.ts');
        hookInfo.dependencies.stores.push(storeName);
        testResults.stores.used.push(storeName);
      } else if (importPath.includes('../contexts/')) {
        const contextName = path.basename(importPath, '.tsx');
        hookInfo.dependencies.contexts.push(contextName);
        testResults.contexts.used.push(contextName);
      } else if (importPath.includes('./') || importPath.includes('../hooks/')) {
        const otherHookName = path.basename(importPath, '.ts');
        if (otherHookName !== hookName) {
          hookInfo.dependencies.hooks.push(otherHookName);
        }
      }
    }
    
    // Check for React hooks usage
    const content = await fs.readFile(hookPath, 'utf-8');
    const reactHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'];
    const usedReactHooks = reactHooks.filter(hook => content.includes(hook));
    
    if (usedReactHooks.length === 0 && !hookName.includes('test')) {
      hookInfo.issues.push('No React hooks used - may not be a proper hook');
    }
    
    // Check for proper hook naming convention
    if (!hookName.startsWith('use') && !hookName.includes('test')) {
      hookInfo.issues.push('Hook name does not follow "use" convention');
    }
    
    // Check for TypeScript issues
    if (content.includes('any') && !content.includes('// eslint-disable')) {
      hookInfo.issues.push('Uses "any" type without explicit disable');
    }
    
    // Check for error handling
    if (!content.includes('try') && !content.includes('catch') && 
        (content.includes('async') || content.includes('Promise'))) {
      hookInfo.issues.push('Async operations without error handling');
    }
    
    // Mental health specific checks
    const mentalHealthKeywords = ['crisis', 'emergency', 'suicide', 'harm', 'wellness', 'therapy'];
    const isMentalHealthHook = mentalHealthKeywords.some(keyword => 
      hookName.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword)
    );
    
    if (isMentalHealthHook) {
      // Check for privacy considerations
      if (!content.includes('privacy') && !content.includes('secure') && !content.includes('encrypt')) {
        hookInfo.issues.push('Mental health hook without explicit privacy considerations');
      }
      
      // Check for crisis handling
      if (hookName.toLowerCase().includes('crisis') && !content.includes('emergency')) {
        hookInfo.issues.push('Crisis hook without emergency handling');
      }
    }
    
    return hookInfo;
  } catch (error) {
    hookInfo.issues.push(`Error testing hook: ${error.message}`);
    return hookInfo;
  }
}

// Test service existence
async function checkServiceExists(serviceName) {
  const servicePath = path.join(SERVICES_DIR, `${serviceName}.ts`);
  try {
    await fs.access(servicePath);
    return true;
  } catch {
    return false;
  }
}

// Test store existence
async function checkStoreExists(storeName) {
  const storePath = path.join(STORES_DIR, `${storeName}.ts`);
  try {
    await fs.access(storePath);
    return true;
  } catch {
    return false;
  }
}

// Test context existence
async function checkContextExists(contextName) {
  const contextPath = path.join(CONTEXTS_DIR, `${contextName}.tsx`);
  try {
    await fs.access(contextPath);
    return true;
  } catch {
    // Try .ts extension
    const contextPathTs = path.join(CONTEXTS_DIR, `${contextName}.ts`);
    try {
      await fs.access(contextPathTs);
      return true;
    } catch {
      return false;
    }
  }
}

// Main test function
async function runHookIntegrationTests() {
  console.log('================================');
  console.log('HOOK INTEGRATION TEST REPORT');
  console.log('================================\n');
  
  // Get all hook files
  const hookFiles = await fs.readdir(HOOKS_DIR);
  const tsHookFiles = hookFiles.filter(file => 
    (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')
  );
  
  testResults.hooks.total = tsHookFiles.length;
  
  console.log(`Testing ${tsHookFiles.length} hooks...\n`);
  
  // Test each hook
  const hookTests = [];
  for (const hookFile of tsHookFiles) {
    const hookPath = path.join(HOOKS_DIR, hookFile);
    const hookInfo = await testHook(hookPath);
    hookTests.push(hookInfo);
    
    if (hookInfo.issues.length === 0) {
      testResults.hooks.passed.push(hookInfo.name);
    } else {
      testResults.hooks.failed.push(hookInfo.name);
      testResults.hooks.issues.push(...hookInfo.issues.map(issue => `${hookInfo.name}: ${issue}`));
    }
    
    // Track integration points
    if (hookInfo.dependencies.services.length > 0) {
      testResults.integration.hookToService.push({
        hook: hookInfo.name,
        services: hookInfo.dependencies.services
      });
    }
    if (hookInfo.dependencies.stores.length > 0) {
      testResults.integration.hookToStore.push({
        hook: hookInfo.name,
        stores: hookInfo.dependencies.stores
      });
    }
    if (hookInfo.dependencies.contexts.length > 0) {
      testResults.integration.hookToContext.push({
        hook: hookInfo.name,
        contexts: hookInfo.dependencies.contexts
      });
    }
  }
  
  // Check for missing dependencies
  console.log('Checking service dependencies...');
  const uniqueServices = [...new Set(testResults.services.used)];
  for (const serviceName of uniqueServices) {
    const exists = await checkServiceExists(serviceName);
    if (!exists) {
      testResults.services.missing.push(serviceName);
      testResults.integration.missingDependencies.push(`Service: ${serviceName}`);
    }
  }
  
  console.log('Checking store dependencies...');
  const uniqueStores = [...new Set(testResults.stores.used)];
  for (const storeName of uniqueStores) {
    const exists = await checkStoreExists(storeName);
    if (!exists) {
      testResults.stores.missing.push(storeName);
      testResults.integration.missingDependencies.push(`Store: ${storeName}`);
    }
  }
  
  console.log('Checking context dependencies...');
  const uniqueContexts = [...new Set(testResults.contexts.used)];
  for (const contextName of uniqueContexts) {
    const exists = await checkContextExists(contextName);
    if (!exists) {
      testResults.contexts.missing.push(contextName);
      testResults.integration.missingDependencies.push(`Context: ${contextName}`);
    }
  }
  
  // Print summary report
  console.log('\n================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('================================\n');
  
  console.log('HOOK STATUS:');
  console.log(`  Total Hooks: ${testResults.hooks.total}`);
  console.log(`  ✅ Passed: ${testResults.hooks.passed.length}`);
  console.log(`  ❌ Failed: ${testResults.hooks.failed.length}`);
  
  if (testResults.hooks.failed.length > 0) {
    console.log('\n  Failed Hooks:');
    testResults.hooks.failed.forEach(hook => {
      console.log(`    - ${hook}`);
    });
  }
  
  console.log('\nINTEGRATION POINTS:');
  console.log(`  Hook → Service: ${testResults.integration.hookToService.length} connections`);
  console.log(`  Hook → Store: ${testResults.integration.hookToStore.length} connections`);
  console.log(`  Hook → Context: ${testResults.integration.hookToContext.length} connections`);
  
  console.log('\nDEPENDENCY STATUS:');
  console.log(`  Missing Services: ${testResults.services.missing.length}`);
  console.log(`  Missing Stores: ${testResults.stores.missing.length}`);
  console.log(`  Missing Contexts: ${testResults.contexts.missing.length}`);
  
  if (testResults.integration.missingDependencies.length > 0) {
    console.log('\n  Missing Dependencies:');
    testResults.integration.missingDependencies.forEach(dep => {
      console.log(`    ❌ ${dep}`);
    });
  }
  
  console.log('\nCRITICAL ISSUES:');
  if (testResults.hooks.issues.length > 0) {
    testResults.hooks.issues.slice(0, 10).forEach(issue => {
      console.log(`  ⚠️  ${issue}`);
    });
    if (testResults.hooks.issues.length > 10) {
      console.log(`  ... and ${testResults.hooks.issues.length - 10} more issues`);
    }
  } else {
    console.log('  ✅ No critical issues found');
  }
  
  // Mental health specific checks
  console.log('\nMENTAL HEALTH PLATFORM CHECKS:');
  const crisisHooks = hookTests.filter(h => h.name.toLowerCase().includes('crisis'));
  const wellnessHooks = hookTests.filter(h => h.name.toLowerCase().includes('wellness'));
  const privacyHooks = hookTests.filter(h => h.name.toLowerCase().includes('privacy'));
  
  console.log(`  Crisis Detection Hooks: ${crisisHooks.length}`);
  console.log(`  Wellness Tracking Hooks: ${wellnessHooks.length}`);
  console.log(`  Privacy-Focused Hooks: ${privacyHooks.length}`);
  
  // Generate detailed report
  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalHooks: testResults.hooks.total,
      passed: testResults.hooks.passed.length,
      failed: testResults.hooks.failed.length,
      integrationPoints: {
        services: testResults.integration.hookToService.length,
        stores: testResults.integration.hookToStore.length,
        contexts: testResults.integration.hookToContext.length
      },
      missingDependencies: testResults.integration.missingDependencies.length
    },
    hooks: hookTests,
    issues: testResults.hooks.issues,
    missingDependencies: testResults.integration.missingDependencies,
    recommendations: []
  };
  
  // Add recommendations
  if (testResults.services.missing.length > 0) {
    detailedReport.recommendations.push('Create or fix missing service dependencies');
  }
  if (testResults.stores.missing.length > 0) {
    detailedReport.recommendations.push('Create or fix missing store dependencies');
  }
  if (testResults.contexts.missing.length > 0) {
    detailedReport.recommendations.push('Create or fix missing context dependencies');
  }
  
  // Save detailed report
  await fs.writeFile(
    path.join(__dirname, '..', 'HOOK_INTEGRATION_TEST_REPORT.json'),
    JSON.stringify(detailedReport, null, 2)
  );
  
  console.log('\n✅ Detailed report saved to HOOK_INTEGRATION_TEST_REPORT.json');
  
  // Return exit code based on results
  const hasFailures = testResults.hooks.failed.length > 0 || 
                      testResults.integration.missingDependencies.length > 0;
  
  if (hasFailures) {
    console.log('\n❌ Hook integration tests completed with failures');
    process.exit(1);
  } else {
    console.log('\n✅ All hook integration tests passed successfully!');
    process.exit(0);
  }
}

// Run the tests
runHookIntegrationTests().catch(error => {
  console.error('Fatal error during hook integration testing:', error);
  process.exit(1);
});