#!/usr/bin/env node

/**
 * Simplified Netlify Build Script
 * Focuses on essential build steps without complex error handling
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n🚀 NETLIFY SIMPLIFIED BUILD\n');

// Helper function to run commands
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

// Main build process
async function build() {
  // 1. Clean dist directory
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    try {
      fs.rmSync(distPath, { recursive: true, force: true });
      console.log('✅ Cleaned dist directory');
    } catch (error) {
      console.log('⚠️  Could not clean dist directory, continuing...');
    }
  }

  // 2. Install dependencies with legacy peer deps flag
  if (!runCommand('npm install --legacy-peer-deps', 'Installing dependencies')) {
    process.exit(1);
  }

  // 3. Run Vite build
  if (!runCommand('npx vite build', 'Building with Vite')) {
    process.exit(1);
  }

  // 4. Create _redirects file for Netlify SPA support
  const redirectsContent = '/*    /index.html   200';
  const redirectsPath = path.join(distPath, '_redirects');
  
  try {
    fs.writeFileSync(redirectsPath, redirectsContent);
    console.log('✅ Created _redirects file for SPA routing');
  } catch (error) {
    console.error('⚠️  Could not create _redirects file:', error.message);
  }

  console.log('\n✨ Build completed successfully!\n');
}

// Run the build
build().catch(error => {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
});