#!/usr/bin/env node

/**
 * Clean install script - removes all build artifacts and reinstalls
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build artifacts and dependencies...\n');

// Directories to remove
const dirsToRemove = [
  'node_modules',
  'dist',
  '.vite',
  'package-lock.json'
];

// Remove each directory/file
dirsToRemove.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      console.log(`✓ Removed ${dir}`);
    } catch (error) {
      console.log(`⚠️  Could not remove ${dir}: ${error.message}`);
    }
  }
});

console.log('\n📦 Installing fresh dependencies...\n');

try {
  // Clean npm cache
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  // Install with legacy peer deps
  execSync('npm install --legacy-peer-deps --no-audit --no-fund', { stdio: 'inherit' });
  
  console.log('\n✅ Clean install completed successfully!');
} catch (error) {
  console.error('\n❌ Install failed:', error.message);
  process.exit(1);
}