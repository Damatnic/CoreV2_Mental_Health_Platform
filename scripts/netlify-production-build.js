#!/usr/bin/env node

/**
 * PRODUCTION BUILD SCRIPT FOR NETLIFY
 * Optimized for the full React app deployment without emergency fallbacks
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
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to execute commands
function safeExec(command, description, options = {}) {
  const { critical = false, silent = false } = options;
  
  try {
    if (!silent) {
      log(`\n${description}...`, 'cyan');
    }
    
    const result = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--max-old-space-size=8192',
        FORCE_COLOR: '0',
        CI: 'true'
      }
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

// Main build process
async function build() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 NETLIFY PRODUCTION BUILD', 'bright');
  log('='.repeat(60), 'bright');
  
  // Step 1: Environment check
  log('\n📊 Environment Information:', 'magenta');
  const nodeVersion = process.version;
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  log(`Node.js: ${nodeVersion}`, 'yellow');
  log(`npm: ${npmVersion}`, 'yellow');
  log(`Platform: ${process.platform}`, 'yellow');
  log(`Working Directory: ${process.cwd()}`, 'yellow');
  
  // Step 2: Clean previous build
  log('\n📦 Step 1: Cleaning previous build...', 'cyan');
  const distDir = path.join(process.cwd(), 'dist');
  
  if (fs.existsSync(distDir)) {
    try {
      fs.rmSync(distDir, { recursive: true, force: true });
      log('✓ Cleaned dist directory', 'green');
    } catch (error) {
      log(`⚠️  Could not clean dist: ${error.message}`, 'yellow');
    }
  }
  
  // Step 3: Install dependencies
  log('\n📦 Step 2: Installing dependencies...', 'cyan');
  
  // Try clean install first
  let installSuccess = safeExec(
    'npm ci --prefer-offline --no-audit --no-fund',
    'Clean install (npm ci)'
  ).success;
  
  // If ci fails, try regular install
  if (!installSuccess) {
    log('Attempting regular npm install...', 'yellow');
    installSuccess = safeExec(
      'npm install --no-audit --no-fund --legacy-peer-deps',
      'Regular install with legacy peer deps'
    ).success;
  }
  
  if (!installSuccess) {
    log('❌ Failed to install dependencies', 'red');
    process.exit(1);
  }
  
  // Step 4: Fix any import resolution issues
  log('\n📦 Step 3: Fixing import resolutions...', 'cyan');
  fixImportResolutions();
  
  // Step 5: Run Vite build
  log('\n📦 Step 4: Building with Vite...', 'cyan');
  
  // Use standard production build
  let buildSuccess = safeExec(
    'npx vite build --mode production',
    'Vite production build',
    { critical: true }
  ).success;
  
  // Step 6: Generate Service Worker (optional)
  log('\n📦 Step 5: Generating Service Worker...', 'cyan');
  
  // Check if service worker already exists in dist
  const existingSW = path.join(distDir, 'sw.js');
  if (fs.existsSync(existingSW)) {
    log('✓ Service Worker already exists in dist', 'green');
  } else {
    // Service worker generation is optional - skip for now to avoid interactive prompts
    log('⚠️  Service Worker generation skipped (not critical for deployment)', 'yellow');
    
    // Create a minimal service worker as fallback
    const minimalSW = `
// Minimal Service Worker for Astral Core Mental Health Platform
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle all requests for now
  event.respondWith(fetch(event.request));
});
`;
    
    try {
      fs.writeFileSync(existingSW, minimalSW);
      log('✓ Created minimal service worker fallback', 'green');
    } catch (error) {
      log('⚠️  Could not create service worker fallback', 'yellow');
    }
  }
  
  // Step 7: Copy critical files
  log('\n📦 Step 6: Copying critical files...', 'cyan');
  copyPublicFiles(distDir);
  
  // Step 8: Verify build output
  log('\n📦 Step 7: Verifying build output...', 'cyan');
  if (!verifyBuildOutput(distDir)) {
    log('❌ Build verification failed', 'red');
    process.exit(1);
  }
  
  // Success!
  printSuccessSummary(distDir);
}

// Fix import resolution issues
function fixImportResolutions() {
  // Ensure TypeScript paths are correctly resolved
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      
      // Ensure baseUrl is set
      if (!tsConfig.compilerOptions) {
        tsConfig.compilerOptions = {};
      }
      
      // Set sensible defaults for module resolution
      tsConfig.compilerOptions.moduleResolution = 'node';
      tsConfig.compilerOptions.allowSyntheticDefaultImports = true;
      tsConfig.compilerOptions.esModuleInterop = true;
      
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      log('✓ Fixed TypeScript configuration', 'green');
    } catch (error) {
      log(`⚠️  Could not update tsconfig.json: ${error.message}`, 'yellow');
    }
  }
  
  // Ensure vite config has proper resolution settings
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  const viteConfigJsPath = path.join(process.cwd(), 'vite.config.js');
  
  if (!fs.existsSync(viteConfigPath) && !fs.existsSync(viteConfigJsPath)) {
    log('  Creating fallback vite.config.js...', 'yellow');
    const fallbackConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@services': path.resolve(__dirname, './src/services'),
      '@components': path.resolve(__dirname, './src/components'),
      '@views': path.resolve(__dirname, './src/views'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils': ['zustand', 'i18next', 'react-i18next']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'react-markdown', 'buffer']
  }
});
`;
    fs.writeFileSync(viteConfigJsPath, fallbackConfig.trim());
    log('  ✓ Created fallback vite.config.js', 'green');
  }
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
  
  // Check if index.html has content and includes React app
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.length < 500) {
    log('✗ index.html appears to be too small', 'red');
    return false;
  }
  
  // Check for React app entry point
  if (!indexContent.includes('assets/js/index-') && !indexContent.includes('type="module"')) {
    log('✗ index.html missing React app entry point', 'red');
    return false;
  }
  
  // Check for JavaScript files
  const assetsDir = path.join(distDir, 'assets', 'js');
  if (!fs.existsSync(assetsDir)) {
    log('✗ JavaScript assets directory not found', 'red');
    return false;
  }
  
  const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
  if (jsFiles.length < 5) {
    log('✗ Too few JavaScript files generated', 'red');
    return false;
  }
  
  log('✓ Build output verified successfully', 'green');
  log(`  - index.html: ${(indexContent.length / 1024).toFixed(2)} KB`, 'cyan');
  log(`  - JS files: ${jsFiles.length}`, 'cyan');
  
  return true;
}

// Print success summary
function printSuccessSummary(distDir) {
  const countFiles = (dir) => {
    let count = 0;
    let totalSize = 0;
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const subResult = countFiles(filePath);
          count += subResult.count;
          totalSize += subResult.size;
        } else {
          count++;
          totalSize += stat.size;
        }
      });
    } catch (error) {
      // Ignore errors in counting
    }
    return { count, size: totalSize };
  };
  
  const { count: totalFiles, size: totalSize } = countFiles(distDir);
  
  log('\n' + '='.repeat(60), 'bright');
  log('✅ PRODUCTION BUILD COMPLETED SUCCESSFULLY!', 'green');
  log('='.repeat(60), 'bright');
  log(`📁 Output directory: ${distDir}`, 'cyan');
  log(`📊 Total files: ${totalFiles}`, 'cyan');
  log(`💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`, 'cyan');
  log(`⏱️  Build time: ${new Date().toLocaleTimeString()}`, 'cyan');
  log('🎉 Full React app ready for Netlify deployment!', 'magenta');
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