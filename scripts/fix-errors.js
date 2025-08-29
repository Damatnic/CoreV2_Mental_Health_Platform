#!/usr/bin/env node

/**
 * Systematic Error Fixer
 * Tackles the biggest error categories first
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class SystematicErrorFixer {
  constructor() {
    this.beforeCount = 0;
    this.afterCount = 0;
  }

  logProgress(step, before, after) {
    const reduction = before - after;
    console.log(`\n📊 ${step}`);
    console.log(`Before: ${before} errors | After: ${after} errors | Reduction: ${reduction}`);
    if (reduction > 0) {
      console.log(`✅ SUCCESS! Eliminated ${reduction} errors`);
    } else {
      console.log(`❌ No reduction achieved`);
    }
  }

  // Get current error count
  getErrorCount() {
    try {
      const output = execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf8' });
      const errorLines = output.split('\n').filter(line => line.includes(': error TS'));
      return errorLines.length;
    } catch (error) {
      const errorLines = error.stdout?.split('\n').filter(line => line.includes(': error TS')) || [];
      return errorLines.length;
    }
  }

  // Fix 1: Remove unused React imports (TS6133)
  fixUnusedReactImports() {
    console.log('\n🧹 FIXING: Unused React imports (TS6133)');
    const before = this.getErrorCount();

    const testFiles = [
      'tests/views/GroupSessionView.test.tsx',
      'src/views/DesignShowcaseView.tsx'
    ];

    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Remove unused React import if it's not needed
        if (content.includes("import React from 'react';") && !content.includes('React.')) {
          content = content.replace(/import React from 'react';\n?/, '');
          fs.writeFileSync(file, content);
          console.log(`Fixed unused React import in ${file}`);
        }
      }
    });

    const after = this.getErrorCount();
    this.logProgress('Remove unused React imports', before, after);
  }

  // Fix 2: Fix showNotification parameter order (TS2345) 
  fixShowNotificationCalls() {
    console.log('\n🔧 FIXING: showNotification parameter order (TS2345)');
    const before = this.getErrorCount();

    // Get all .tsx files in views
    const viewFiles = fs.readdirSync('src/views').filter(f => f.endsWith('.tsx'));
    
    viewFiles.forEach(file => {
      const filePath = `src/views/${file}`;
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Fix showNotification calls - pattern: showNotification('type', 'message')
        // Should be: showNotification('message', 'type')
        const patterns = [
          /showNotification\('error',\s*'([^']+)'\)/g,
          /showNotification\('success',\s*'([^']+)'\)/g,
          /showNotification\('warning',\s*'([^']+)'\)/g,
          /showNotification\('info',\s*'([^']+)'\)/g,
        ];

        patterns.forEach((pattern, index) => {
          const types = ['error', 'success', 'warning', 'info'];
          content = content.replace(pattern, (match, message) => {
            changed = true;
            return `showNotification('${message}', '${types[index]}')`;
          });
        });

        if (changed) {
          fs.writeFileSync(filePath, content);
          console.log(`Fixed showNotification calls in ${file}`);
        }
      }
    });

    const after = this.getErrorCount();
    this.logProgress('Fix showNotification parameter order', before, after);
  }

  // Fix 3: Fix AppButton size props (TS2322)
  fixAppButtonSizes() {
    console.log('\n🎯 FIXING: AppButton size="small" to size="sm" (TS2322)');
    const before = this.getErrorCount();

    // Get all .tsx files
    const allTsxFiles = [];
    
    function findTsxFiles(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          findTsxFiles(fullPath);
        } else if (file.endsWith('.tsx')) {
          allTsxFiles.push(fullPath);
        }
      });
    }

    findTsxFiles('src');

    allTsxFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Fix size="small" to size="sm"
        if (content.includes('size="small"')) {
          content = content.replace(/size="small"/g, 'size="sm"');
          changed = true;
        }

        // Fix size="large" to size="lg" 
        if (content.includes('size="large"')) {
          content = content.replace(/size="large"/g, 'size="lg"');
          changed = true;
        }

        // Fix size="medium" to size="md"
        if (content.includes('size="medium"')) {
          content = content.replace(/size="medium"/g, 'size="md"');
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(filePath, content);
          console.log(`Fixed button sizes in ${filePath}`);
        }
      }
    });

    const after = this.getErrorCount();
    this.logProgress('Fix AppButton sizes', before, after);
  }

  // Run all fixes
  async run() {
    console.log('🚀 Starting Systematic Error Fixing\n');
    this.beforeCount = this.getErrorCount();
    console.log(`📊 Starting baseline: ${this.beforeCount} errors\n`);

    // Run fixes in order of impact
    this.fixUnusedReactImports();
    this.fixShowNotificationCalls();
    this.fixAppButtonSizes();

    this.afterCount = this.getErrorCount();
    const totalReduction = this.beforeCount - this.afterCount;
    
    console.log('\n🏆 FINAL RESULTS');
    console.log(`Total before: ${this.beforeCount} errors`);
    console.log(`Total after: ${this.afterCount} errors`);
    console.log(`Total reduction: ${totalReduction} errors`);

    if (totalReduction > 0) {
      console.log(`✅ SUCCESS! Eliminated ${totalReduction} errors (${((totalReduction/this.beforeCount)*100).toFixed(1)}%)`);
    } else {
      console.log(`❌ No errors eliminated`);
    }
  }
}

// Run if called directly
const fixer = new SystematicErrorFixer();
fixer.run().catch(console.error);
