#!/usr/bin/env node
/**
 * Bulk TypeScript Error Fix Script
 * Fixes common patterns across the mental health platform codebase
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common error patterns and their fixes
const BULK_FIXES = [
  // Size prop fixes
  { pattern: /size="sm"/g, replacement: 'size="small"', description: 'Fix size sm -> small' },
  { pattern: /size="md"/g, replacement: 'size="medium"', description: 'Fix size md -> medium' },
  { pattern: /size="lg"/g, replacement: 'size="large"', description: 'Fix size lg -> large' },
  
  // Button variant fixes
  { pattern: /variant="warning"/g, replacement: 'variant="danger"', description: 'Fix variant warning -> danger' },
  { pattern: /variant="destructive"/g, replacement: 'variant="danger"', description: 'Fix variant destructive -> danger' },
  
  // Common missing imports (add to existing imports)
  { 
    pattern: /from 'lucide-react';$/gm, 
    replacement: function(match, offset, string) {
      const lineStart = string.lastIndexOf('\n', offset) + 1;
      const line = string.slice(lineStart, offset + match.length);
      
      // Check if specific icons are missing and add them
      const iconsToAdd = [];
      if (string.includes('Globe') && !line.includes('Globe')) iconsToAdd.push('Globe');
      if (string.includes('Shield') && !line.includes('Shield')) iconsToAdd.push('Shield');
      if (string.includes('AlertTriangle') && !line.includes('AlertTriangle')) iconsToAdd.push('AlertTriangle');
      if (string.includes('ExternalLink') && !line.includes('ExternalLink')) iconsToAdd.push('ExternalLink');
      
      if (iconsToAdd.length > 0) {
        return match.replace("} from 'lucide-react';", `, ${iconsToAdd.join(', ')} } from 'lucide-react';`);
      }
      return match;
    },
    description: 'Add missing lucide-react imports'
  },
  
  // Fix common prop type issues
  { pattern: /\.variant\]/g, replacement: ']>[\'variant\']', description: 'Fix optional property access' },
  { pattern: /\.type\]/g, replacement: ']>[\'type\']', description: 'Fix optional property access' },
  
  // Fix undefined checks
  { pattern: /(\w+)\.(\w+) > 0 &&/g, replacement: '$1.$2 && $1.$2 > 0 &&', description: 'Add null checks before comparisons' },
];

// File patterns to process
const FILE_PATTERNS = [
  'src/**/*.tsx',
  'src/**/*.ts',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!node_modules/**',
  '!dist/**',
  '!build/**'
];

let totalFixes = 0;
let filesProcessed = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = false;
    let fileFixes = 0;

    BULK_FIXES.forEach(fix => {
      const originalContent = content;
      
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      if (content !== originalContent) {
        const matches = (originalContent.match(fix.pattern) || []).length;
        fileFixes += matches;
        totalFixes += matches;
        fileFixed = true;
        console.log(`  ✓ ${fix.description}: ${matches} fixes`);
      }
    });

    if (fileFixed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`📝 Fixed ${fileFixes} issues in ${path.relative(process.cwd(), filePath)}`);
    }

    filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting bulk TypeScript error fixes...\n');
  
  const files = glob.sync(FILE_PATTERNS.join(','), { 
    ignore: ['node_modules/**', 'dist/**', 'build/**'] 
  });
  
  console.log(`Found ${files.length} files to process\n`);
  
  files.forEach(processFile);
  
  console.log('\n🎉 Bulk fixes completed!');
  console.log(`📊 Summary: ${totalFixes} total fixes across ${filesProcessed} files`);
  console.log('\nRun `npx tsc --noEmit` to check remaining errors.');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, BULK_FIXES };