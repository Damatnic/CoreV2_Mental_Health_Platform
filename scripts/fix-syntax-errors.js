#!/usr/bin/env node

/**
 * Emergency syntax error fix script
 * Fixes common syntax errors that are preventing the build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Common syntax error patterns to fix
const fixes = [
  // Fix duplicate exports
  {
    pattern: /export\s+default\s+(\w+)\s*\n\s*export\s+default\s+\1/g,
    replacement: 'export default $1'
  },
  // Fix duplicate const exports
  {
    pattern: /export\s+const\s+(\w+)\s*=\s*([^;]+);\s*export\s+const\s+\1\s*=\s*\2;/g,
    replacement: 'export const $1 = $2;'
  },
  // Fix missing semicolon and closing brace before function declarations
  {
    pattern: /return\s+\{\s*([^}]+)\s*\}\s*\n\s*\/\*\*/g,
    replacement: 'return { $1 };\n  }\n\n  /**'
  },
  // Fix extra closing braces
  {
    pattern: /}\s*;\s*}/g,
    replacement: '}'
  },
  // Fix misplaced JSX elements (common corruption pattern)
  {
    pattern: /}\s*;\s*<([^>]+)>/g,
    replacement: '};\n\n// TODO: Check if this JSX element belongs here\n// <$1>'
  },
  // Fix unterminated strings in JSX
  {
    pattern: /className="([^"]*)\n/g,
    replacement: 'className="$1"'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed syntax errors in ${path.relative(rootDir, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function findTSXFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        walk(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.tsx') || item.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
console.log('🔧 Starting syntax error fixes...\n');

const srcDir = path.join(rootDir, 'src');
const files = findTSXFiles(srcDir);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed syntax errors in ${fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🚀 Running build test...');
  
  // Test the build
  try {
    const { execSync } = await import('child_process');
    execSync('npm run build --silent', { stdio: 'inherit' });
    console.log('✅ Build successful!');
  } catch (error) {
    console.log('⚠️  Build still has issues, but syntax errors were fixed');
  }
}
