#!/usr/bin/env node

/**
 * Service Worker Verification Script
 * Verifies that the service worker is properly generated and configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SW_FILE = path.join(DIST_DIR, 'sw.js');

/**
 * Verify service worker exists and is valid
 */
export function verifyServiceWorker() {
  console.log('🔍 Verifying Service Worker...');

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found');
    return false;
  }

  // Check if service worker file exists
  if (!fs.existsSync(SW_FILE)) {
    console.error('❌ Service worker file not found');
    return false;
  }

  try {
    // Read and validate service worker content
    const swContent = fs.readFileSync(SW_FILE, 'utf8');
    
    if (swContent.length === 0) {
      console.error('❌ Service worker file is empty');
      return false;
    }

    // Check for basic service worker structure
    const hasInstallEvent = swContent.includes('install');
    const hasActivateEvent = swContent.includes('activate');
    const hasFetchEvent = swContent.includes('fetch');

    if (!hasInstallEvent || !hasActivateEvent || !hasFetchEvent) {
      console.warn('⚠️  Service worker may be missing some standard events');
    }

    console.log('✅ Service worker verified successfully');
    return true;

  } catch (error) {
    console.error('❌ Error reading service worker:', error.message);
    return false;
  }
}

/**
 * Analyze build performance and output
 */
export function analyzePerformance() {
  console.log('📊 Analyzing build performance...');

  try {
    const stats = fs.statSync(DIST_DIR);
    console.log(`📁 Build directory: ${DIST_DIR}`);
    console.log(`⏰ Last modified: ${stats.mtime.toISOString()}`);

    // Count files in dist
    const files = fs.readdirSync(DIST_DIR, { recursive: true });
    const fileCount = files.filter(file => {
      const filePath = path.join(DIST_DIR, file);
      return fs.statSync(filePath).isFile();
    }).length;

    console.log(`📄 Total files: ${fileCount}`);

    // Calculate total size
    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(DIST_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
      }
    });

    console.log(`💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('✅ Performance analysis complete');

  } catch (error) {
    console.error('❌ Error analyzing performance:', error.message);
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const swValid = verifyServiceWorker();
  analyzePerformance();
  
  if (!swValid) {
    process.exit(1);
  }
  
  console.log('🎉 All verifications passed!');
}