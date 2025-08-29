#!/usr/bin/env node

/**
 * Local build tester - simulates Netlify environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log('\n🧪 TESTING BUILD LOCALLY', 'bright');
log('=' .repeat(50), 'bright');

// Check Node version
const nodeVersion = process.version;
const major = parseInt(nodeVersion.split('.')[0].substring(1));

log(`\nNode.js version: ${nodeVersion}`, 'yellow');

if (major === 20) {
  log('✓ Using recommended Node.js 20.x', 'green');
} else if (major === 22) {
  log('⚠️  Using Node.js 22.x - may have issues on Netlify', 'yellow');
} else {
  log('✗ Node.js version not optimal for deployment', 'red');
}

// Test strategies
const tests = [
  {
    name: 'Standard Vite Build',
    command: 'npx vite build',
    critical: false
  },
  {
    name: 'Production Build',
    command: 'npx vite build --mode production',
    critical: false
  },
  {
    name: 'Robust Build Script',
    command: 'node scripts/netlify-robust-build.js',
    critical: true
  }
];

log('\nRunning build tests...', 'cyan');

for (const test of tests) {
  log(`\nTesting: ${test.name}`, 'cyan');
  
  // Clean dist directory
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  
  try {
    const startTime = Date.now();
    execSync(test.command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Verify output
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      const files = countFiles(distDir);
      log(`  ✓ Success - Built ${files} files in ${duration}s`, 'green');
    } else {
      log(`  ✗ Failed - No index.html generated`, 'red');
    }
  } catch (error) {
    log(`  ✗ Failed - ${error.message.substring(0, 100)}`, 'red');
    if (test.critical) {
      log('\nCritical test failed!', 'red');
      process.exit(1);
    }
  }
}

function countFiles(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      count += countFiles(filePath);
    } else {
      count++;
    }
  });
  return count;
}

log('\n' + '=' .repeat(50), 'bright');
log('✅ BUILD TESTS COMPLETED', 'green');
log('=' .repeat(50) + '\n', 'bright');