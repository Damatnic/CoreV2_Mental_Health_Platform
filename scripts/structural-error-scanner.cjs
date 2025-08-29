const fs = require('fs');
const path = require('path');

// Specialized patterns for "dumb" structural errors
const structuralFixes = [
  // Extra closing braces and semicolons
  {
    name: 'Extra closing brace and semicolon',
    pattern: /}\s*;\s*}\s*;/g,
    replacement: '}'
  },
  {
    name: 'Double closing brace semicolon',
    pattern: /}\s*;\s*}/g,
    replacement: '}'
  },
  {
    name: 'Extra semicolon after closing brace',
    pattern: /}\s*;\s*,\s*\[/g,
    replacement: '}, ['
  },
  {
    name: 'Missing semicolon in statements',
    pattern: /([^;{}])\s*\n\s*}/g,
    replacement: '$1;\n  }'
  },
  // Malformed useEffect cleanup functions
  {
    name: 'Broken useEffect cleanup',
    pattern: /return\s*\(\)\s*=>\s*{\s*([^}]+)\s*}\s*;\s*}\s*,\s*\[/g,
    replacement: 'return () => {\n      $1\n    };\n  }, ['
  },
  // Extra semicolons in various contexts
  {
    name: 'Stray semicolon before closing paren',
    pattern: /;\s*\)\s*;/g,
    replacement: ')'
  },
  {
    name: 'Double semicolons',
    pattern: /;;\s*/g,
    replacement: ';'
  },
  // Malformed ternary operators
  {
    name: 'Broken ternary operator',
    pattern: /=\s*\w+\s*;\s*\?\s*/g,
    replacement: '= $1\n    ? '
  },
  // Missing closing parentheses
  {
    name: 'Missing closing paren in function calls',
    pattern: /\(\s*{\s*([^}]+)\s*}\s*\n\s*}\s*\)/g,
    replacement: '({\n    $1\n  })'
  },
  // Extra closing braces in object literals
  {
    name: 'Extra closing brace in objects',
    pattern: /{\s*([^}]+)\s*}\s*}\s*/g,
    replacement: '{\n  $1\n}'
  },
  // Malformed JSX closing tags
  {
    name: 'Malformed JSX',
    pattern: /<\/\w+>\s*;\s*/g,
    replacement: '</$1>'
  },
  // Missing semicolons after return statements
  {
    name: 'Missing semicolon after return',
    pattern: /return\s+([^;]+)\s*\n\s*}/g,
    replacement: 'return $1;\n  }'
  }
];

function fixStructuralErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changeCount = 0;
    let appliedFixes = [];

    // Apply each structural fix
    structuralFixes.forEach(fix => {
      const beforeContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeContent) {
        changeCount++;
        appliedFixes.push(fix.name);
      }
    });

    // Additional manual fixes for common patterns
    
    // Fix broken useEffect structures
    const useEffectPattern = /useEffect\(\(\)\s*=>\s*{\s*([^}]+)\s*}\s*;\s*}\s*,\s*\[/g;
    const useEffectBefore = content;
    content = content.replace(useEffectPattern, 'useEffect(() => {\n    $1\n  }, [');
    if (content !== useEffectBefore) {
      changeCount++;
      appliedFixes.push('useEffect structure fix');
    }

    // Fix extra closing braces in return statements
    const returnPattern = /return\s*\(\s*<([^>]+)>\s*([^<]+)\s*<\/\1>\s*\)\s*;\s*}/g;
    const returnBefore = content;
    content = content.replace(returnPattern, 'return (\n    <$1>\n      $2\n    </$1>\n  );');
    if (content !== returnBefore) {
      changeCount++;
      appliedFixes.push('JSX return structure fix');
    }

    // Fix malformed if statements
    const ifPattern = /if\s*\(\s*;\s*/g;
    const ifBefore = content;
    content = content.replace(ifPattern, 'if (');
    if (content !== ifBefore) {
      changeCount++;
      appliedFixes.push('if statement fix');
    }

    // Fix missing closing statements
    const missingClosePattern = /([^;{}])\s*\n\s*(?:export|const|let|var|function|class|interface|type)/g;
    const missingCloseBefore = content;
    content = content.replace(missingClosePattern, '$1;\n\n$2');
    if (content !== missingCloseBefore) {
      changeCount++;
      appliedFixes.push('Missing statement termination');
    }

    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { changeCount, appliedFixes };
    }
    return { changeCount: 0, appliedFixes: [] };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { changeCount: 0, appliedFixes: [] };
  }
}

function scanDirectory(dir) {
  let totalFiles = 0;
  let fixedFiles = 0;
  let totalFixes = 0;
  let allAppliedFixes = new Set();

  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(file.name)) {
        const subResult = scanDirectory(fullPath);
        totalFiles += subResult.totalFiles;
        fixedFiles += subResult.fixedFiles;
        totalFixes += subResult.totalFixes;
        subResult.allAppliedFixes.forEach(fix => allAppliedFixes.add(fix));
      }
    } else if (file.isFile() && 
               (file.name.endsWith('.ts') || 
                file.name.endsWith('.tsx') || 
                file.name.endsWith('.js') || 
                file.name.endsWith('.jsx'))) {
      totalFiles++;
      const result = fixStructuralErrors(fullPath);
      if (result.changeCount > 0) {
        fixedFiles++;
        totalFixes += result.changeCount;
        result.appliedFixes.forEach(fix => allAppliedFixes.add(fix));
        console.log(`Fixed ${result.changeCount} structural errors in ${fullPath}:`);
        console.log(`  - ${result.appliedFixes.join(', ')}`);
      }
    }
  }
  
  return { totalFiles, fixedFiles, totalFixes, allAppliedFixes };
}

// Run the structural error scanner
console.log('Starting structural error scan for "dumb" syntax errors...\n');
const srcPath = path.join(process.cwd(), 'src');
const result = scanDirectory(srcPath);

console.log('\n========================================');
console.log('Structural Error Scan Complete!');
console.log('========================================');
console.log(`Total files scanned: ${result.totalFiles}`);
console.log(`Files fixed: ${result.fixedFiles}`);
console.log(`Total fixes applied: ${result.totalFixes}`);
console.log('\nTypes of structural fixes applied:');
result.allAppliedFixes.forEach(fix => {
  console.log(`  - ${fix}`);
});
