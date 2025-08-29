#!/usr/bin/env node

/**
 * Dependency Cleanup Script
 * 
 * Identifies and helps remove unused dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Dependencies that are known to be used but might not be detected
const whitelist = [
  // Build tools
  '@vitejs/plugin-react',
  'vite',
  'vitest',
  'workbox-*',
  
  // Testing
  '@testing-library/*',
  '@playwright/test',
  'jest*',
  
  // Types
  '@types/*',
  
  // Essential React
  'react',
  'react-dom',
  'react-router-dom',
  
  // i18n
  'i18next',
  'react-i18next',
  'i18next-browser-languagedetector',
  
  // State management
  'zustand',
  
  // Monitoring
  '@sentry/*',
  'web-vitals',
  
  // Development
  'eslint*',
  'prettier',
  'typescript',
  
  // Netlify
  '@netlify/functions',
  
  // Storybook (if using)
  '@storybook/*'
];

// Dependencies that are definitely unused based on analysis
const definitelyUnused = [
  'express', // This is a frontend app, not a server
  'helmet', // Server middleware, not needed for frontend
  'compression', // Server middleware
  'cors', // Server middleware, handled by Netlify
];

// Heavy dependencies to consider removing
const heavyDependencies = [
  {
    name: '@tensorflow/tfjs',
    size: '~50MB',
    alternative: 'Consider using a lighter ML library or API service'
  },
  {
    name: '@tensorflow/tfjs-core',
    size: '~30MB',
    alternative: 'Included with tfjs, remove if not using TensorFlow'
  },
  {
    name: 'natural',
    size: '~15MB',
    alternative: 'Consider using compromise or removing if not needed'
  },
  {
    name: '@google/genai',
    size: '~10MB',
    alternative: 'Only keep if actively using Google AI services'
  }
];

console.log('🧹 Dependency Cleanup Analysis\n');
console.log('=' .repeat(50));

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

// 1. List definitely unused dependencies
console.log('\n❌ Definitely Unused (Safe to Remove):');
console.log('-'.repeat(40));
definitelyUnused.forEach(dep => {
  if (allDeps[dep]) {
    console.log(`  • ${dep} - ${allDeps[dep]}`);
  }
});

// 2. List heavy dependencies to consider
console.log('\n⚠️  Heavy Dependencies to Consider:');
console.log('-'.repeat(40));
heavyDependencies.forEach(({ name, size, alternative }) => {
  if (allDeps[name]) {
    console.log(`  • ${name} (${size})`);
    console.log(`    ${alternative}`);
  }
});

// 3. Check for duplicate/similar packages
console.log('\n🔄 Potential Duplicates:');
console.log('-'.repeat(40));
const duplicates = [
  ['sentiment', 'compromise'], // Both do NLP
  ['@sentry/tracing', '@sentry/react'], // React includes tracing
  ['i18n-js', 'i18next'], // Both handle i18n
];

duplicates.forEach(([pkg1, pkg2]) => {
  if (allDeps[pkg1] && allDeps[pkg2]) {
    console.log(`  • ${pkg1} and ${pkg2} - Consider keeping only one`);
  }
});

// 4. Generate removal commands
console.log('\n📦 Suggested Removal Commands:');
console.log('-'.repeat(40));

const toRemove = [
  ...definitelyUnused,
  'i18n-js', // Keep i18next instead
  '@sentry/tracing', // Included in @sentry/react
];

const removeCommand = `npm uninstall ${toRemove.filter(d => allDeps[d]).join(' ')}`;
console.log(`\n${removeCommand}\n`);

// 5. Analyze bundle size impact
console.log('\n📊 Estimated Size Savings:');
console.log('-'.repeat(40));

let totalSavings = 0;
const sizes = {
  'express': 200,
  'helmet': 50,
  'compression': 30,
  'cors': 20,
  '@tensorflow/tfjs': 50000,
  '@tensorflow/tfjs-core': 30000,
  'natural': 15000,
  '@google/genai': 10000,
  'i18n-js': 100,
  '@sentry/tracing': 100
};

toRemove.forEach(dep => {
  if (allDeps[dep] && sizes[dep]) {
    totalSavings += sizes[dep];
    console.log(`  • Removing ${dep}: ~${sizes[dep]}KB`);
  }
});

console.log(`\n  Total estimated savings: ~${(totalSavings / 1024).toFixed(2)}MB`);

// 6. Check for outdated packages
console.log('\n🔄 Checking for Outdated Packages...');
console.log('-'.repeat(40));

try {
  const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
  const outdatedPkgs = JSON.parse(outdated || '{}');
  
  if (Object.keys(outdatedPkgs).length > 0) {
    console.log('  Outdated packages found:');
    Object.entries(outdatedPkgs).forEach(([name, info]) => {
      console.log(`  • ${name}: ${info.current} → ${info.latest}`);
    });
  } else {
    console.log('  ✅ All packages are up to date!');
  }
} catch (error) {
  // npm outdated returns non-zero exit code when packages are outdated
  // This is expected behavior
}

// 7. Security audit
console.log('\n🔒 Security Audit:');
console.log('-'.repeat(40));

try {
  const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.metadata.vulnerabilities.total > 0) {
    console.log(`  ⚠️  ${audit.metadata.vulnerabilities.total} vulnerabilities found:`);
    console.log(`     Critical: ${audit.metadata.vulnerabilities.critical}`);
    console.log(`     High: ${audit.metadata.vulnerabilities.high}`);
    console.log(`     Moderate: ${audit.metadata.vulnerabilities.moderate}`);
    console.log(`     Low: ${audit.metadata.vulnerabilities.low}`);
    console.log('\n  Run "npm audit fix" to fix automatically');
  } else {
    console.log('  ✅ No vulnerabilities found!');
  }
} catch (error) {
  console.log('  Could not run security audit');
}

// 8. Final recommendations
console.log('\n✨ Recommendations:');
console.log('=' .repeat(50));
console.log(`
1. Remove server-side packages (express, helmet, etc.)
2. Consider removing heavy ML libraries if not actively used
3. Remove duplicate i18n library (keep i18next)
4. Run "npm audit fix" to fix vulnerabilities
5. Consider using dynamic imports for heavy libraries
6. Use bundle analyzer to identify other optimization opportunities

To analyze bundle size after cleanup:
  npm run analyze:bundle

To remove suggested packages:
  ${removeCommand}

To update all packages:
  npm update

To fix vulnerabilities:
  npm audit fix
`);

console.log('✅ Analysis complete!\n');