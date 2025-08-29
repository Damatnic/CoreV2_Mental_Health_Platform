#!/usr/bin/env node

/**
 * Script to fix all @testing-library/react imports across the codebase
 * Replaces direct imports with centralized test-utils exports
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}🔧 Starting Testing Library Import Fix...${colors.reset}\n`);

// Patterns to find test files
const testFilePatterns = [
  'src/**/*.test.{ts,tsx}',
  'tests/**/*.test.{ts,tsx}',
  'src/**/__tests__/**/*.{ts,tsx}'
];

// Files to skip (already using test-utils or mock files)
const skipFiles = [
  'src/test-utils.tsx',
  'src/test-utils/**/*',
  'src/setupTests.ts',
  '**/mockContexts.tsx',
  '**/*.d.ts'
];

// Import replacements map
const importReplacements = [
  {
    // Standard @testing-library/react imports
    pattern: /import\s+{([^}]+)}\s+from\s+['"]@testing-library\/react['"]/g,
    replacement: (match, imports, filePath) => {
      // Calculate relative path to test-utils
      const relativePath = calculateRelativePath(filePath);
      return `import {${imports}} from '${relativePath}/test-utils/testing-library-exports'`;
    }
  },
  {
    // userEvent import
    pattern: /import\s+userEvent\s+from\s+['"]@testing-library\/user-event['"]/g,
    replacement: (match, filePath) => {
      // Check if userEvent is already imported from test-utils
      return ''; // Will be handled by merging imports
    }
  }
];

// Calculate relative path from file to src directory
function calculateRelativePath(filePath) {
  const srcDir = path.join(process.cwd(), 'src');
  const fileDir = path.dirname(filePath);
  let relativePath = path.relative(fileDir, srcDir);
  
  // Convert backslashes to forward slashes for consistency
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Add ./ if it doesn't start with ../
  if (!relativePath.startsWith('..')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file should be skipped
    const shouldSkip = skipFiles.some(pattern => {
      if (pattern.includes('*')) {
        return filePath.includes(pattern.replace(/\*/g, ''));
      }
      return filePath.includes(pattern);
    });
    
    if (shouldSkip) {
      console.log(`${colors.yellow}⏭️  Skipping: ${filePath}${colors.reset}`);
      return false;
    }
    
    // Check if file has @testing-library imports
    if (!content.includes('@testing-library/react') && !content.includes('@testing-library/user-event')) {
      return false;
    }
    
    // Collect all imports
    const testingLibraryImports = [];
    let hasUserEvent = false;
    
    // Extract @testing-library/react imports
    const reactImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]@testing-library\/react['"]/);
    if (reactImportMatch) {
      const imports = reactImportMatch[1].split(',').map(i => i.trim());
      testingLibraryImports.push(...imports);
    }
    
    // Check for userEvent
    if (content.includes("import userEvent from '@testing-library/user-event'")) {
      hasUserEvent = true;
      testingLibraryImports.push('userEvent');
    }
    
    // Calculate relative path
    const relativePath = calculateRelativePath(filePath);
    
    // Remove old imports
    content = content.replace(/import\s+{[^}]+}\s+from\s+['"]@testing-library\/react['"];?\s*\n?/g, '');
    content = content.replace(/import\s+userEvent\s+from\s+['"]@testing-library\/user-event['"];?\s*\n?/g, '');
    
    // Add new consolidated import
    if (testingLibraryImports.length > 0) {
      const newImport = `import { ${testingLibraryImports.join(', ')} } from '${relativePath}/test-utils/testing-library-exports';`;
      
      // Find a good place to insert the import (after other imports or at the beginning)
      const importInsertMatch = content.match(/^(.*?import[^;]+;[\s\n]*)+/ms);
      if (importInsertMatch) {
        const lastImportEnd = importInsertMatch[0].length;
        content = content.slice(0, lastImportEnd) + newImport + '\n' + content.slice(lastImportEnd);
      } else {
        // No imports found, add at the beginning (after any comments)
        const firstNonCommentLine = content.search(/^[^\/\*\n]/m);
        if (firstNonCommentLine > 0) {
          content = content.slice(0, firstNonCommentLine) + newImport + '\n' + content.slice(firstNonCommentLine);
        } else {
          content = newImport + '\n' + content;
        }
      }
      
      modified = true;
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`${colors.green}✅ Fixed: ${filePath}${colors.reset}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`${colors.red}❌ Error processing ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main execution
async function main() {
  let totalFiles = 0;
  let fixedFiles = 0;
  
  for (const pattern of testFilePatterns) {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    for (const file of files) {
      const fullPath = path.join(process.cwd(), file);
      totalFiles++;
      
      if (processFile(fullPath)) {
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n${colors.blue}📊 Summary:${colors.reset}`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files fixed: ${colors.green}${fixedFiles}${colors.reset}`);
  console.log(`   Files skipped/unchanged: ${colors.yellow}${totalFiles - fixedFiles}${colors.reset}`);
  
  if (fixedFiles > 0) {
    console.log(`\n${colors.green}✨ Testing library imports have been successfully fixed!${colors.reset}`);
    console.log(`${colors.blue}💡 Next steps:${colors.reset}`);
    console.log('   1. Run: npm run typecheck');
    console.log('   2. Run: npm test');
    console.log('   3. Verify all tests pass');
  } else {
    console.log(`\n${colors.yellow}ℹ️  No files needed fixing.${colors.reset}`);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});