#!/usr/bin/env node

/**
 * Netlify Guaranteed Build Script
 * This script GUARANTEES that JavaScript files are created in dist/assets/js
 * Includes extensive validation and fallback mechanisms
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n========================================');
console.log('   NETLIFY GUARANTEED BUILD SCRIPT');
console.log('   Ensuring JavaScript files are built');
console.log('========================================\n');

// Helper to run commands with better error handling
function runCommand(command, description, options = {}) {
  console.log(`\n[BUILD] ${description}...`);
  console.log(`[CMD] ${command}`);
  
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      ...options
    });
    console.log(`[SUCCESS] ${description} completed`);
    return { success: true, output: result ? result.toString() : '' };
  } catch (error) {
    console.error(`[ERROR] ${description} failed`);
    if (error.message) console.error(`[DETAILS] ${error.message}`);
    return { success: false, error };
  }
}

// Helper to check if directory exists
function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

// Helper to count files in directory
function countFiles(dirPath, extension = '') {
  try {
    if (!dirExists(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    if (extension) {
      return files.filter(f => f.endsWith(extension)).length;
    }
    return files.length;
  } catch {
    return 0;
  }
}

// Main build process
async function build() {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const distPath = path.join(projectRoot, 'dist');
  const assetsPath = path.join(distPath, 'assets');
  const jsPath = path.join(assetsPath, 'js');
  const cssPath = path.join(assetsPath, 'css');

  console.log('[INFO] Project root:', projectRoot);
  console.log('[INFO] Node version:', process.version);
  console.log('[INFO] Platform:', process.platform);
  console.log('[INFO] Build environment:', process.env.NODE_ENV || 'production');

  // Step 1: Clean dist directory
  console.log('\n[STEP 1/7] Cleaning dist directory...');
  if (dirExists(distPath)) {
    try {
      // Use platform-appropriate removal
      if (process.platform === 'win32') {
        runCommand(`rmdir /s /q "${distPath}"`, 'Remove dist (Windows)', { silent: true });
      } else {
        runCommand(`rm -rf "${distPath}"`, 'Remove dist (Unix)', { silent: true });
      }
    } catch {
      console.log('[WARN] Could not clean dist, trying alternative method...');
      try {
        fs.rmSync(distPath, { recursive: true, force: true });
      } catch {
        console.log('[WARN] Alternative clean failed, continuing anyway...');
      }
    }
  }

  // Step 2: Ensure node_modules exists
  console.log('\n[STEP 2/7] Checking dependencies...');
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (!dirExists(nodeModulesPath)) {
    console.log('[INFO] node_modules not found, installing dependencies...');
    const npmInstall = runCommand(
      'npm ci --legacy-peer-deps --no-audit --no-fund',
      'Install dependencies (ci)'
    );
    
    if (!npmInstall.success) {
      console.log('[WARN] npm ci failed, trying npm install...');
      runCommand(
        'npm install --legacy-peer-deps --no-audit --no-fund',
        'Install dependencies (install)'
      );
    }
  } else {
    console.log('[INFO] node_modules exists, checking for vite...');
    const vitePath = path.join(nodeModulesPath, 'vite');
    if (!dirExists(vitePath)) {
      console.log('[WARN] Vite not found, installing...');
      runCommand('npm install vite@latest --save-dev', 'Install Vite');
    }
  }

  // Step 3: Verify vite.config exists
  console.log('\n[STEP 3/7] Verifying Vite configuration...');
  const viteConfigPaths = [
    path.join(projectRoot, 'vite.config.ts'),
    path.join(projectRoot, 'vite.config.js'),
    path.join(projectRoot, 'vite.config.mjs')
  ];
  
  const viteConfigExists = viteConfigPaths.some(p => fs.existsSync(p));
  if (!viteConfigExists) {
    console.error('[ERROR] No vite.config file found!');
    console.log('[INFO] Creating minimal vite.config.js...');
    
    const minimalConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});`;
    
    fs.writeFileSync(path.join(projectRoot, 'vite.config.js'), minimalConfig);
  }

  // Step 4: Run Vite build with multiple fallback strategies
  console.log('\n[STEP 4/7] Running Vite build...');
  
  // Strategy 1: Try npx vite build
  let buildResult = runCommand('npx vite build', 'Vite build (npx)');
  
  if (!buildResult.success) {
    // Strategy 2: Try direct node_modules execution
    console.log('[RETRY] Trying direct vite execution...');
    const viteExec = process.platform === 'win32' 
      ? path.join(nodeModulesPath, '.bin', 'vite.cmd')
      : path.join(nodeModulesPath, '.bin', 'vite');
    
    if (fs.existsSync(viteExec)) {
      buildResult = runCommand(`"${viteExec}" build`, 'Vite build (direct)');
    }
  }
  
  if (!buildResult.success) {
    // Strategy 3: Try with Node directly
    console.log('[RETRY] Trying with Node directly...');
    buildResult = runCommand(
      'node node_modules/vite/bin/vite.js build',
      'Vite build (node)'
    );
  }

  // Step 5: Validate build output
  console.log('\n[STEP 5/7] Validating build output...');
  
  const validation = {
    distExists: dirExists(distPath),
    assetsExists: dirExists(assetsPath),
    jsExists: dirExists(jsPath),
    cssExists: dirExists(cssPath),
    indexHtmlExists: fs.existsSync(path.join(distPath, 'index.html')),
    jsFileCount: countFiles(jsPath, '.js'),
    cssFileCount: countFiles(cssPath, '.css')
  };

  console.log('[VALIDATION] Results:');
  console.log(`  - dist/ exists: ${validation.distExists}`);
  console.log(`  - assets/ exists: ${validation.assetsExists}`);
  console.log(`  - assets/js/ exists: ${validation.jsExists}`);
  console.log(`  - assets/css/ exists: ${validation.cssExists}`);
  console.log(`  - index.html exists: ${validation.indexHtmlExists}`);
  console.log(`  - JS files count: ${validation.jsFileCount}`);
  console.log(`  - CSS files count: ${validation.cssFileCount}`);

  // Critical validation
  if (!validation.jsExists || validation.jsFileCount === 0) {
    console.error('\n[CRITICAL] No JavaScript files were created!');
    console.log('[FALLBACK] Creating emergency build...');
    
    // Create directories
    fs.mkdirSync(jsPath, { recursive: true });
    fs.mkdirSync(cssPath, { recursive: true });
    
    // Create a minimal index.js
    const emergencyJS = `
console.log('Emergency build - Vite build failed');
document.getElementById('root').innerHTML = '<h1>Build Error</h1><p>The application failed to build properly. Please check the build logs.</p>';
`;
    fs.writeFileSync(path.join(jsPath, 'emergency-index.js'), emergencyJS);
    
    // Update index.html to use emergency JS
    if (validation.indexHtmlExists) {
      let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
      if (!html.includes('emergency-index.js')) {
        html = html.replace('</body>', '<script src="/assets/js/emergency-index.js"></script></body>');
        fs.writeFileSync(path.join(distPath, 'index.html'), html);
      }
    }
    
    console.log('[FALLBACK] Emergency files created');
  }

  // Step 6: Create Netlify-specific files
  console.log('\n[STEP 6/7] Creating Netlify configuration files...');
  
  // Create _redirects for SPA
  const redirectsPath = path.join(distPath, '_redirects');
  if (!fs.existsSync(redirectsPath)) {
    fs.writeFileSync(redirectsPath, '/*    /index.html   200');
    console.log('[INFO] Created _redirects file');
  }

  // Create _headers for proper MIME types
  const headersPath = path.join(distPath, '_headers');
  if (!fs.existsSync(headersPath)) {
    const headers = `
/assets/js/*
  Content-Type: application/javascript; charset=UTF-8
  Cache-Control: public, max-age=31536000, immutable

/assets/css/*
  Content-Type: text/css; charset=UTF-8
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Type: application/javascript; charset=UTF-8

/*.css
  Content-Type: text/css; charset=UTF-8

/index.html
  Cache-Control: no-cache, no-store, must-revalidate
  Content-Type: text/html; charset=UTF-8
`;
    fs.writeFileSync(headersPath, headers);
    console.log('[INFO] Created _headers file with MIME type fixes');
  }

  // Step 7: Final verification
  console.log('\n[STEP 7/7] Final verification...');
  
  // List all JS files created
  if (dirExists(jsPath)) {
    const jsFiles = fs.readdirSync(jsPath).filter(f => f.endsWith('.js'));
    console.log(`[SUCCESS] Created ${jsFiles.length} JavaScript files:`);
    jsFiles.slice(0, 10).forEach(f => console.log(`  - ${f}`));
    if (jsFiles.length > 10) {
      console.log(`  ... and ${jsFiles.length - 10} more`);
    }
  }

  // Check index.html references
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    const scriptTags = indexHtml.match(/<script[^>]*>/g) || [];
    console.log(`[INFO] index.html contains ${scriptTags.length} script tags`);
    
    // Verify referenced files exist
    const srcPattern = /src=["']([^"']+)["']/g;
    let match;
    let missingFiles = [];
    while ((match = srcPattern.exec(indexHtml)) !== null) {
      const src = match[1];
      if (src.startsWith('/')) {
        const filePath = path.join(distPath, src);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(src);
        }
      }
    }
    
    if (missingFiles.length > 0) {
      console.warn('[WARN] Missing files referenced in index.html:');
      missingFiles.forEach(f => console.warn(`  - ${f}`));
    }
  }

  const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Final status
  if (validation.jsFileCount > 0) {
    console.log('\n========================================');
    console.log('   BUILD COMPLETED SUCCESSFULLY!');
    console.log(`   Time: ${buildTime}s`);
    console.log(`   JS Files: ${validation.jsFileCount}`);
    console.log(`   CSS Files: ${validation.cssFileCount}`);
    console.log('========================================\n');
  } else {
    console.error('\n========================================');
    console.error('   BUILD COMPLETED WITH WARNINGS');
    console.error('   JavaScript files may be missing!');
    console.error('========================================\n');
    process.exit(1);
  }
}

// Run the build
build().catch(error => {
  console.error('\n[FATAL] Build script failed:', error);
  console.error('[STACK]', error.stack);
  process.exit(1);
});