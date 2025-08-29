#!/usr/bin/env node

/**
 * Error Fixer Automation Script
 * Helps systematically identify and fix TypeScript errors
 */

import { execSync } from 'child_process';
import fs from 'fs';

class ErrorFixer {
  constructor() {
    this.errorLog = [];
    this.baseline = 0;
  }

  // Get current error count
  getCurrentErrorCount() {
    try {
      const output = execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf8' });
      const errorLines = output.split('\n').filter(line => line.includes(': error TS'));
      return errorLines.length;
    } catch (error) {
      // TypeScript errors cause non-zero exit code, but we still get output
      const errorLines = error.stdout?.split('\n').filter(line => line.includes(': error TS')) || [];
      return errorLines.length;
    }
  }

  // Get error breakdown by type
  getErrorBreakdown() {
    try {
      const output = execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf8' });
      const errors = {};
      
      output.split('\n').forEach(line => {
        const match = line.match(/error (TS\d+):/);
        if (match) {
          const errorCode = match[1];
          errors[errorCode] = (errors[errorCode] || 0) + 1;
        }
      });

      return Object.entries(errors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 error types
    } catch (error) {
      return [];
    }
  }

  // Log progress
  logProgress(phase, action, before, after) {
    const reduction = before - after;
    const log = {
      timestamp: new Date().toISOString(),
      phase,
      action,
      before,
      after,
      reduction,
      success: reduction > 0
    };
    
    this.errorLog.push(log);
    console.log(`📊 ${phase}: ${action}`);
    console.log(`   Before: ${before} errors | After: ${after} errors | Reduction: ${reduction}`);
    
    if (reduction > 0) {
      console.log(`✅ SUCCESS! Eliminated ${reduction} errors`);
    } else {
      console.log(`❌ No reduction achieved`);
    }
  }

  // Save progress report
  saveProgressReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseline: this.baseline,
      current: this.getCurrentErrorCount(),
      totalReduction: this.baseline - this.getCurrentErrorCount(),
      actions: this.errorLog
    };

    fs.writeFileSync('ERROR_FIXING_PROGRESS.json', JSON.stringify(report, null, 2));
    console.log(`📈 Progress saved to ERROR_FIXING_PROGRESS.json`);
  }

  // Initialize baseline
  setBaseline() {
    this.baseline = this.getCurrentErrorCount();
    console.log(`🎯 Baseline set: ${this.baseline} errors`);
  }
}

export default ErrorFixer;

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new ErrorFixer();
  fixer.setBaseline();
  
  console.log('\n📊 Top Error Types:');
  const breakdown = fixer.getErrorBreakdown();
  breakdown.forEach(([code, count], index) => {
    console.log(`${index + 1}. ${code}: ${count} errors`);
  });
}



