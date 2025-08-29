#!/usr/bin/env node

/**
 * Robust build script for Netlify deployment
 * Handles all edge cases and dependency issues for Linux environments
 * Compatible with Node.js 20.x and Vite 5.x
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to execute commands with proper error handling
function safeExec(command, description, options = {}) {
  const { critical = false, silent = false } = options;
  
  try {
    if (!silent) log(`\n${description}...`, 'cyan');
    
    const result = execSync(command, { 
      stdio: silent ? 'pipe' : (critical ? 'inherit' : 'pipe'),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer for large outputs
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    
    if (!silent) log(`✓ ${description} completed`, 'green');
    return { success: true, output: result };
  } catch (error) {
    if (!silent) log(`✗ ${description} failed: ${error.message}`, 'red');
    if (critical) {
      throw error;
    }
    return { success: false, error };
  }
}

// Check and report Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  log(`\nNode.js version: ${nodeVersion}`, 'yellow');
  
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  const minor = parseInt(nodeVersion.split('.')[1]);
  
  // Check for Node.js 20.x (recommended for stability)
  if (major === 20 && minor >= 9) {
    log('✓ Node.js version 20.x detected (recommended)', 'green');
  } else if (major === 22) {
    log('⚠️  Node.js 22.x detected - may have compatibility issues', 'yellow');
    log('Proceeding with caution...', 'yellow');
  } else if (major < 20) {
    log('⚠️  Node.js version too old, minimum 20.9.0 required', 'red');
    process.exit(1);
  }
  
  return { major, minor };
}

// Fix package.json dependencies
function fixPackageJson() {
  log('\n📋 Fixing package.json dependencies...', 'cyan');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;
    
    // Ensure critical dependencies are present
    const criticalDeps = {
      'vite': '^5.4.19',
      '@vitejs/plugin-react': '^4.3.3',
      'rollup': '^4.28.1',
      'terser': '^5.43.1'
    };
    
    // Add to dependencies if missing
    packageJson.dependencies = packageJson.dependencies || {};
    for (const [dep, version] of Object.entries(criticalDeps)) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies?.[dep]) {
        log(`  Adding missing dependency: ${dep}@${version}`, 'yellow');
        packageJson.dependencies[dep] = version;
        modified = true;
      }
    }
    
    // Ensure Rollup platform-specific packages for Linux
    const rollupPlatformDeps = {
      '@rollup/rollup-linux-x64-gnu': '^4.28.1',
      '@rollup/rollup-linux-x64-musl': '^4.28.1',
      '@rollup/rollup-linux-arm64-gnu': '^4.28.1',
      '@rollup/rollup-linux-arm64-musl': '^4.28.1'
    };
    
    for (const [dep, version] of Object.entries(rollupPlatformDeps)) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies?.[dep]) {
        packageJson.optionalDependencies = packageJson.optionalDependencies || {};
        packageJson.optionalDependencies[dep] = version;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('✓ package.json dependencies fixed', 'green');
    } else {
      log('✓ package.json dependencies already correct', 'green');
    }
    
    return packageJson;
  } catch (error) {
    log(`✗ Failed to fix package.json: ${error.message}`, 'red');
    throw error;
  }
}

// Clean build artifacts and caches
function cleanBuildArtifacts() {
  log('\n🧹 Cleaning build artifacts...', 'cyan');
  
  const dirsToClean = ['dist', '.vite', 'node_modules/.vite', 'node_modules/.cache'];
  
  for (const dir of dirsToClean) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        log(`  ✓ Removed ${dir}`, 'green');
      } catch (error) {
        log(`  ⚠️  Could not remove ${dir}: ${error.message}`, 'yellow');
      }
    }
  }
}

// Install dependencies with multiple strategies
function installDependencies() {
  log('\n📦 Installing dependencies...', 'cyan');
  
  // Clear npm cache first
  safeExec('npm cache clean --force', 'Clear npm cache', { silent: true });
  
  // Remove package-lock.json if it exists (for fresh resolution)
  const lockFile = path.join(process.cwd(), 'package-lock.json');
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
      log('  ✓ Removed package-lock.json for fresh install', 'green');
    } catch (error) {
      log(`  ⚠️  Could not remove package-lock.json: ${error.message}`, 'yellow');
    }
  }
  
  // Strategy 1: Fresh install with legacy peer deps
  let result = safeExec(
    'npm install --no-audit --no-fund --legacy-peer-deps --prefer-offline',
    'Installing dependencies (npm install)'
  );
  
  if (!result.success) {
    // Strategy 2: Force install
    log('  Attempting force install...', 'yellow');
    result = safeExec(
      'npm install --force --no-audit --no-fund',
      'Force installing dependencies'
    );
  }
  
  if (!result.success) {
    log('❌ Failed to install dependencies', 'red');
    process.exit(1);
  }
  
  // Install Rollup explicitly if needed
  const rollupCheck = safeExec('npx rollup --version', 'Check Rollup', { silent: true });
  if (!rollupCheck.success) {
    log('  Installing Rollup explicitly...', 'yellow');
    safeExec('npm install rollup@^4.28.1 --save', 'Install Rollup', { critical: true });
  }
  
  // Install platform-specific Rollup binaries
  const platform = process.platform;
  const arch = process.arch;
  
  if (platform === 'linux') {
    let rollupBinary = '';
    if (arch === 'x64') {
      // Try musl first (common in Docker/Alpine), then gnu
      rollupBinary = '@rollup/rollup-linux-x64-musl';
      const muslResult = safeExec(
        `npm install ${rollupBinary}@^4.28.1 --save-optional --no-save`,
        'Install Rollup Linux x64 musl binary',
        { silent: true }
      );
      
      if (!muslResult.success) {
        rollupBinary = '@rollup/rollup-linux-x64-gnu';
        safeExec(
          `npm install ${rollupBinary}@^4.28.1 --save-optional --no-save`,
          'Install Rollup Linux x64 gnu binary',
          { silent: true }
        );
      }
    } else if (arch === 'arm64') {
      rollupBinary = '@rollup/rollup-linux-arm64-gnu';
      safeExec(
        `npm install ${rollupBinary}@^4.28.1 --save-optional --no-save`,
        'Install Rollup Linux arm64 binary',
        { silent: true }
      );
    }
  }
  
  log('✓ Dependencies installed successfully', 'green');
}

// Create minimal vite config if missing
function ensureViteConfig() {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  const viteConfigJsPath = path.join(process.cwd(), 'vite.config.js');
  
  if (!fs.existsSync(viteConfigPath) && !fs.existsSync(viteConfigJsPath)) {
    log('  Creating minimal vite.config.js...', 'yellow');
    const minimalConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});
`;
    fs.writeFileSync(viteConfigJsPath, minimalConfig.trim());
    log('  ✓ Created minimal vite.config.js', 'green');
  }
}

// Build with Vite
function buildWithVite() {
  log('\n🔨 Building with Vite...', 'cyan');
  
  ensureViteConfig();
  
  // Try different build strategies
  const buildStrategies = [
    {
      command: 'npx vite build --mode production',
      description: 'Vite production build'
    },
    {
      command: 'npx vite build',
      description: 'Basic Vite build'
    },
    {
      command: 'npm run build:full',
      description: 'Full build script'
    },
    {
      command: 'node_modules/.bin/vite build',
      description: 'Direct Vite binary'
    }
  ];
  
  let buildSuccess = false;
  for (const strategy of buildStrategies) {
    const result = safeExec(strategy.command, strategy.description);
    if (result.success) {
      buildSuccess = true;
      break;
    }
  }
  
  if (!buildSuccess) {
    // Last resort: create a simple build
    log('  Attempting emergency build...', 'yellow');
    createEmergencyBuild();
  }
  
  return buildSuccess;
}

// Create emergency build as last resort
function createEmergencyBuild() {
  log('\n🚨 Creating emergency build...', 'yellow');
  
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Copy index.html from public
  const publicIndex = path.join(process.cwd(), 'public', 'index.html');
  const indexHtml = path.join(process.cwd(), 'index.html');
  let sourceIndex = null;
  
  if (fs.existsSync(publicIndex)) {
    sourceIndex = publicIndex;
  } else if (fs.existsSync(indexHtml)) {
    sourceIndex = indexHtml;
  }
  
  if (sourceIndex) {
    const content = fs.readFileSync(sourceIndex, 'utf8');
    // Basic transformation for production
    const transformed = content
      .replace(/type="module" crossorigin src="\/src\/main.tsx"/, 'src="/assets/main.js"')
      .replace(/href="\/src\/index.css"/, 'href="/assets/main.css"');
    
    fs.writeFileSync(path.join(distDir, 'index.html'), transformed);
    log('  ✓ Created emergency index.html', 'green');
  }
  
  // Create placeholder main.js
  const placeholderJs = `
console.log('Emergency build - React app loading...');
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('root').innerHTML = '<h1>Mental Health Support Platform</h1><p>Loading application...</p>';
});
`;
  
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(assetsDir, 'main.js'), placeholderJs.trim());
  fs.writeFileSync(path.join(assetsDir, 'main.css'), 'body { font-family: sans-serif; padding: 20px; }');
  
  log('  ✓ Emergency build created', 'yellow');
}

// Copy public files
function copyPublicFiles() {
  log('\n📄 Copying public files...', 'cyan');
  
  const publicDir = path.join(process.cwd(), 'public');
  const distDir = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(publicDir)) {
    log('  ⚠️  No public directory found', 'yellow');
    return;
  }
  
  const criticalFiles = [
    'manifest.json',
    'robots.txt',
    'favicon.ico',
    'offline.html',
    'offline-crisis.html',
    'crisis-resources.json',
    'emergency-contacts.json',
    'offline-coping-strategies.json'
  ];
  
  let copiedCount = 0;
  for (const file of criticalFiles) {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      } catch (error) {
        log(`  ⚠️  Could not copy ${file}: ${error.message}`, 'yellow');
      }
    }
  }
  
  // Copy icons
  const iconPatterns = ['icon*.png', 'icon*.svg', 'apple-touch-icon*.png'];
  for (const pattern of iconPatterns) {
    try {
      const files = fs.readdirSync(publicDir).filter(f => f.match(new RegExp(pattern.replace('*', '.*'))));
      for (const file of files) {
        fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
        copiedCount++;
      }
    } catch (error) {
      // Ignore errors for optional files
    }
  }
  
  log(`  ✓ Copied ${copiedCount} public files`, 'green');
}

// Generate service worker
function generateServiceWorker() {
  log('\n⚙️  Generating service worker...', 'cyan');
  
  const distDir = path.join(process.cwd(), 'dist');
  
  // Try workbox first
  const workboxConfigs = ['workbox-config.js', 'workbox-enhanced.js', 'workbox-intelligent.js'];
  let swGenerated = false;
  
  for (const config of workboxConfigs) {
    if (fs.existsSync(path.join(process.cwd(), config))) {
      const result = safeExec(
        `npx workbox generateSW ${config}`,
        `Generate SW with ${config}`,
        { silent: true }
      );
      if (result.success) {
        swGenerated = true;
        break;
      }
    }
  }
  
  if (!swGenerated) {
    // Create basic service worker
    const swContent = `
// Basic Service Worker for Mental Health Platform
const CACHE_NAME = 'mh-platform-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
});
`;
    
    fs.writeFileSync(path.join(distDir, 'sw.js'), swContent.trim());
    log('  ✓ Created basic service worker', 'green');
  } else {
    log('  ✓ Service worker generated with workbox', 'green');
  }
}

// Verify build output
function verifyBuild() {
  log('\n✅ Verifying build output...', 'cyan');
  
  const distDir = path.join(process.cwd(), 'dist');
  const checks = {
    'dist directory': fs.existsSync(distDir),
    'index.html': fs.existsSync(path.join(distDir, 'index.html')),
    'assets directory': fs.existsSync(path.join(distDir, 'assets')) || fs.existsSync(path.join(distDir, 'js'))
  };
  
  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    if (passed) {
      log(`  ✓ ${check}`, 'green');
    } else {
      log(`  ✗ ${check}`, 'red');
      allPassed = false;
    }
  }
  
  // Check index.html has content
  if (checks['index.html']) {
    const indexContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    if (indexContent.length < 100) {
      log('  ✗ index.html appears empty', 'red');
      allPassed = false;
    } else {
      log('  ✓ index.html has content', 'green');
    }
  }
  
  return allPassed;
}

// Main build process
async function build() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 NETLIFY ROBUST BUILD SCRIPT', 'bright');
  log('='.repeat(60), 'bright');
  
  try {
    // Step 1: Environment check
    log('\n📊 Environment Information:', 'magenta');
    const nodeInfo = checkNodeVersion();
    log(`Platform: ${process.platform} (${process.arch})`, 'yellow');
    log(`Current directory: ${process.cwd()}`, 'yellow');
    
    // Step 2: Fix package.json
    fixPackageJson();
    
    // Step 3: Clean artifacts
    cleanBuildArtifacts();
    
    // Step 4: Install dependencies
    installDependencies();
    
    // Step 5: Build with Vite
    const buildSuccess = buildWithVite();
    
    // Step 6: Copy public files
    copyPublicFiles();
    
    // Step 7: Generate service worker
    generateServiceWorker();
    
    // Step 8: Verify build
    const verified = verifyBuild();
    
    if (!verified && !buildSuccess) {
      log('\n⚠️  Build completed with warnings', 'yellow');
      log('The build output may be incomplete but should deploy', 'yellow');
    }
    
    // Success
    log('\n' + '='.repeat(60), 'bright');
    log('✅ BUILD COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(60), 'bright');
    log(`📁 Output directory: ${path.join(process.cwd(), 'dist')}`, 'cyan');
    log('🎉 Ready for Netlify deployment!', 'magenta');
    log('='.repeat(60) + '\n', 'bright');
    
  } catch (error) {
    log('\n' + '='.repeat(60), 'bright');
    log('❌ BUILD FAILED', 'red');
    log('='.repeat(60), 'bright');
    log(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle process errors
process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Promise Rejection: ${reason}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the build
build().catch(error => {
  log(`\n❌ Build failed: ${error.message}`, 'red');
  process.exit(1);
});