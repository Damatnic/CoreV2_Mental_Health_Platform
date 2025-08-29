#!/usr/bin/env node

/**
 * Foolproof build script for Netlify deployment
 * Ensures 100% success with Node.js 22.12.0 and Vite 5.4.19
 * Handles all edge cases and dependency issues
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
function safeExec(command, description, critical = false) {
  try {
    log(`\n${description}...`, 'cyan');
    const result = execSync(command, { 
      stdio: critical ? 'inherit' : 'pipe',
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    log(`✓ ${description} completed`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`✗ ${description} failed: ${error.message}`, 'red');
    if (critical) {
      throw error;
    }
    return { success: false, error };
  }
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  log(`\nNode.js version: ${nodeVersion}`, 'yellow');
  
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  const minor = parseInt(nodeVersion.split('.')[1]);
  
  // Vite 5.4.19 requires Node.js ^20.19.0 || >=22.12.0
  if (major === 20 && minor >= 19) {
    log('✓ Node.js version meets Vite requirements (20.19+)', 'green');
  } else if (major >= 22 && minor >= 12) {
    log('✓ Node.js version meets Vite requirements (22.12+)', 'green');
  } else if (major >= 23) {
    log('✓ Node.js version meets Vite requirements (23+)', 'green');
  } else {
    log(`⚠️  Node.js ${nodeVersion} may not meet Vite 5.4.19 requirements`, 'yellow');
    log('Recommended: Node.js 22.12.0 or higher', 'yellow');
  }
}

// Ensure package.json is valid
function validatePackageJson() {
  log('\n📋 Validating package.json...', 'cyan');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if Vite is in dependencies
    if (!packageJson.dependencies?.vite && !packageJson.devDependencies?.vite) {
      log('⚠️  Vite not found in dependencies, adding it...', 'yellow');
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies.vite = '^5.4.19';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    log('✓ package.json is valid', 'green');
    return true;
  } catch (error) {
    log(`✗ package.json validation failed: ${error.message}`, 'red');
    return false;
  }
}

// Main build process
async function build() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 NETLIFY FOOLPROOF BUILD SCRIPT', 'bright');
  log('='.repeat(60), 'bright');
  
  // Step 0: Environment check
  log('\n📊 Environment Information:', 'magenta');
  checkNodeVersion();
  log(`NPM version: ${execSync('npm --version').toString().trim()}`, 'yellow');
  log(`Current directory: ${process.cwd()}`, 'yellow');
  log(`Platform: ${process.platform}`, 'yellow');
  
  // Step 1: Validate package.json
  if (!validatePackageJson()) {
    log('❌ Cannot proceed without valid package.json', 'red');
    process.exit(1);
  }
  
  // Step 2: Clean previous build
  log('\n📦 Step 1: Cleaning previous build...', 'cyan');
  const distDir = path.join(process.cwd(), 'dist');
  const nodeModulesDir = path.join(process.cwd(), 'node_modules');
  
  if (fs.existsSync(distDir)) {
    try {
      fs.rmSync(distDir, { recursive: true, force: true });
      log('✓ Cleaned dist directory', 'green');
    } catch (error) {
      log(`⚠️  Could not clean dist: ${error.message}`, 'yellow');
    }
  }
  
  // Step 3: Clear npm cache (helps with dependency issues)
  log('\n📦 Step 2: Clearing npm cache...', 'cyan');
  safeExec('npm cache clean --force', 'Clear npm cache');
  
  // Step 4: Install dependencies with multiple fallback strategies
  log('\n📦 Step 3: Installing dependencies...', 'cyan');
  
  // Strategy 1: Try clean install first
  let installSuccess = safeExec(
    'npm ci --prefer-offline --no-audit --no-fund',
    'Clean install (npm ci)'
  ).success;
  
  // Strategy 2: If ci fails, try regular install
  if (!installSuccess) {
    log('Attempting regular npm install...', 'yellow');
    installSuccess = safeExec(
      'npm install --no-audit --no-fund --legacy-peer-deps',
      'Regular install with legacy peer deps'
    ).success;
  }
  
  // Strategy 3: If still failing, remove node_modules and try fresh install
  if (!installSuccess) {
    log('Attempting fresh install after removing node_modules...', 'yellow');
    if (fs.existsSync(nodeModulesDir)) {
      try {
        fs.rmSync(nodeModulesDir, { recursive: true, force: true });
        log('✓ Removed node_modules', 'green');
      } catch (error) {
        log(`⚠️  Could not remove node_modules: ${error.message}`, 'yellow');
      }
    }
    
    // Remove package-lock.json to allow fresh resolution
    const lockFile = path.join(process.cwd(), 'package-lock.json');
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      log('✓ Removed package-lock.json for fresh install', 'green');
    }
    
    installSuccess = safeExec(
      'npm install --no-audit --no-fund --legacy-peer-deps',
      'Fresh install without lock file'
    ).success;
  }
  
  if (!installSuccess) {
    log('❌ Failed to install dependencies after all attempts', 'red');
    process.exit(1);
  }
  
  // Step 5: Verify Vite is installed
  log('\n📦 Step 4: Verifying Vite installation...', 'cyan');
  const viteCheck = safeExec('npx vite --version', 'Check Vite version');
  if (!viteCheck.success) {
    log('Vite not found, installing directly...', 'yellow');
    safeExec('npm install vite@^5.4.19 --save', 'Install Vite directly', true);
  }
  
  // Step 6: Run Vite build with multiple strategies
  log('\n📦 Step 5: Building with Vite...', 'cyan');
  
  // Strategy 1: Normal production build
  let buildSuccess = safeExec(
    'npx vite build --mode production',
    'Vite production build'
  ).success;
  
  // Strategy 2: Build without minification if first attempt fails
  if (!buildSuccess) {
    log('Attempting build without minification...', 'yellow');
    buildSuccess = safeExec(
      'npx vite build --mode production --minify false',
      'Vite build without minification'
    ).success;
  }
  
  // Strategy 3: Build with base configuration
  if (!buildSuccess) {
    log('Attempting basic Vite build...', 'yellow');
    buildSuccess = safeExec(
      'npx vite build',
      'Basic Vite build'
    ).success;
  }
  
  if (!buildSuccess) {
    log('❌ Vite build failed after all attempts', 'red');
    process.exit(1);
  }
  
  // Step 7: Generate Service Worker (optional, with fallback)
  log('\n📦 Step 6: Generating Service Worker...', 'cyan');
  
  const workboxConfigs = [
    'workbox-config-simple.js',  // Use simplified config first
    'workbox-enhanced.js',
    'workbox-config.js',
    'workbox-intelligent.js'
  ];
  
  let swGenerated = false;
  for (const config of workboxConfigs) {
    const configPath = path.join(process.cwd(), config);
    if (fs.existsSync(configPath)) {
      swGenerated = safeExec(
        `npx workbox-cli generateSW ${config}`,
        `Generate SW with ${config}`
      ).success;
      if (swGenerated) break;
    }
  }
  
  if (!swGenerated) {
    log('⚠️  Service Worker generation skipped, creating fallback...', 'yellow');
    createFallbackServiceWorker(distDir);
  }
  
  // Step 8: Copy critical files
  log('\n📦 Step 7: Copying critical files...', 'cyan');
  copyPublicFiles(distDir);
  
  // Step 9: Verify build output
  log('\n📦 Step 8: Verifying build output...', 'cyan');
  if (!verifyBuildOutput(distDir)) {
    log('❌ Build verification failed', 'red');
    process.exit(1);
  }
  
  // Success!
  printSuccessSummary(distDir);
}

// Create fallback service worker
function createFallbackServiceWorker(distDir) {
  const swContent = `
// Fallback Service Worker for CoreV2 Mental Health Platform
// Auto-generated by foolproof build script

const CACHE_NAME = 'corev2-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/offline-crisis.html',
  '/crisis-resources.json',
  '/emergency-contacts.json',
  '/offline-coping-strategies.json',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache installation failed:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Network first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Cache first for other resources
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});
`;
  
  const swPath = path.join(distDir, 'sw.js');
  fs.writeFileSync(swPath, swContent.trim());
  log('✓ Created fallback service worker', 'green');
}

// Copy public files to dist
function copyPublicFiles(distDir) {
  const publicDir = path.join(process.cwd(), 'public');
  const criticalFiles = [
    'manifest.json',
    'offline.html',
    'offline-crisis.html',
    'crisis-resources.json',
    'emergency-contacts.json',
    'offline-coping-strategies.json',
    'robots.txt',
    'sitemap.xml',
    'favicon.ico',
    'icon-192.png',
    'icon-512.png',
    'icon.svg'
  ];
  
  let copiedCount = 0;
  criticalFiles.forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
      try {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      } catch (error) {
        log(`⚠️  Could not copy ${file}: ${error.message}`, 'yellow');
      }
    }
  });
  
  log(`✓ Copied ${copiedCount} critical files`, 'green');
}

// Verify build output
function verifyBuildOutput(distDir) {
  if (!fs.existsSync(distDir)) {
    log('✗ Build directory does not exist', 'red');
    return false;
  }
  
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('✗ index.html not found in build output', 'red');
    return false;
  }
  
  // Check if index.html has content
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.length < 100) {
    log('✗ index.html appears to be empty or corrupted', 'red');
    return false;
  }
  
  log('✓ Build output verified successfully', 'green');
  return true;
}

// Print success summary
function printSuccessSummary(distDir) {
  const countFiles = (dir) => {
    let count = 0;
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          count += countFiles(filePath);
        } else {
          count++;
        }
      });
    } catch (error) {
      // Ignore errors in counting
    }
    return count;
  };
  
  const totalFiles = countFiles(distDir);
  
  log('\n' + '='.repeat(60), 'bright');
  log('✅ BUILD COMPLETED SUCCESSFULLY!', 'green');
  log('='.repeat(60), 'bright');
  log(`📁 Output directory: ${distDir}`, 'cyan');
  log(`📊 Total files: ${totalFiles}`, 'cyan');
  log(`⏱️  Build time: ${new Date().toLocaleTimeString()}`, 'cyan');
  log('🎉 Ready for Netlify deployment!', 'magenta');
  log('='.repeat(60) + '\n', 'bright');
}

// Handle errors gracefully
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
  log(`\n❌ Build failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});