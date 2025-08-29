const fs = require('fs');
const path = require('path');

// Comprehensive syntax error patterns to fix
const fixes = [
  // JSX stray semicolons
  {
    name: 'JSX stray semicolons',
    pattern: /<(\w+);(\s+)/g,
    replacement: '<$1$2'
  },
  // Missing semicolons after statements
  {
    name: 'Missing semicolons after statements',
    pattern: /([^{};,\s])(\s*\n\s*(?:export|import|const|let|var|function|class|interface|type|enum))/g,
    replacement: '$1;$2'
  },
  // Stray semicolons in object literals
  {
    name: 'Stray semicolons in object literals',
    pattern: /([^;,}])\s*;\s*\n\s*}/g,
    replacement: '$1\n  }'
  },
  // Fix useEffect/useMemo/useCallback closing
  {
    name: 'useEffect cleanup function syntax',
    pattern: /return\s*\(\)\s*=>\s*{([^}]+)}\s*,\s*\[/g,
    replacement: 'return () => {$1};\n  }, ['
  },
  // Fix missing closing braces for functions
  {
    name: 'Function closing braces',
    pattern: /}\s*,\s*\[([^\]]+)\]\);(\s*\n\s*return\s+{)/g,
    replacement: '};\n  }, [$1]);$2'
  },
  // Fix if-else structure issues
  {
    name: 'If-else structure',
    pattern: /}\s+else\s+if/g,
    replacement: '} else if'
  },
  // Fix missing semicolons in object properties
  {
    name: 'Object property semicolons',
    pattern: /(\w+):\s*([^,;{}\n]+)(\s*\n\s*})/g,
    replacement: '$1: $2;$3'
  },
  // Fix broken import statements
  {
    name: 'Import statements',
    pattern: /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]\s*(?!;)/g,
    replacement: "import {$1} from '$2';"
  },
  // Fix missing closing parentheses in hooks
  {
    name: 'Hook closing parentheses',
    pattern: /\)\s*,\s*\[([^\]]+)\]\)(\s*\n\s*(?:export|const|let|var|function))/g,
    replacement: ');\n  }, [$1]);$2'
  },
  // Fix JSX attribute syntax
  {
    name: 'JSX attribute syntax',
    pattern: /(\w+)={([^}]+)}(\s*;)/g,
    replacement: '$1={$2}'
  },
  // Fix interface/type definitions
  {
    name: 'Interface definitions',
    pattern: /interface\s+(\w+)\s*{([^}]+)}\s*\n\s*export/g,
    replacement: 'interface $1 {$2}\n\nexport'
  },
  // Fix arrow function returns
  {
    name: 'Arrow function returns',
    pattern: /=>\s*{([^}]+)}\s*\n\s*export/g,
    replacement: '=> {$1};\n}\n\nexport'
  },
  // Fix try-catch blocks
  {
    name: 'Try-catch blocks',
    pattern: /catch\s*\([^)]*\)\s*{([^}]+)}\s*\n\s*(\w)/g,
    replacement: 'catch (error) {$1}\n  }\n\n  $2'
  },
  // Fix missing semicolons in type definitions
  {
    name: 'Type definition semicolons',
    pattern: /(\w+):\s*(\w+(?:<[^>]+>)?)\s*\n\s*}/g,
    replacement: '$1: $2;\n}'
  },
  // Fix missing closing braces in return objects
  {
    name: 'Return object closing braces',
    pattern: /return\s*{([^}]+)}\s*\n\s*}\s*,/g,
    replacement: 'return {$1};\n  },'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changeCount = 0;
    let appliedFixes = [];

    // Apply each fix pattern
    fixes.forEach(fix => {
      const beforeContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeContent) {
        changeCount++;
        appliedFixes.push(fix.name);
      }
    });

    // Additional specific fixes for common patterns
    
    // Fix multiple JSX stray semicolons
    const jsxSemicolonPattern = /<(\w+);\s*/g;
    const jsxBefore = content;
    content = content.replace(jsxSemicolonPattern, '<$1 ');
    if (content !== jsxBefore) {
      changeCount++;
      appliedFixes.push('JSX semicolon cleanup');
    }

    // Fix missing semicolons after variable declarations
    const varDeclPattern = /^(\s*(?:const|let|var)\s+\w+\s*=\s*[^;{}\n]+)$/gm;
    const varBefore = content;
    content = content.replace(varDeclPattern, '$1;');
    if (content !== varBefore) {
      changeCount++;
      appliedFixes.push('Variable declaration semicolons');
    }

    // Fix missing closing braces in object returns
    const objReturnPattern = /return\s*{([^}]+)}\s*\n\s*}\s*,/g;
    const objBefore = content;
    content = content.replace(objReturnPattern, 'return {$1};\n  },');
    if (content !== objBefore) {
      changeCount++;
      appliedFixes.push('Object return braces');
    }

    // Fix if-else-if chains
    const ifElsePattern = /}\s*else\s+if\s*\(/g;
    const ifElseBefore = content;
    content = content.replace(ifElsePattern, '} else if (');
    if (content !== ifElseBefore) {
      changeCount++;
      appliedFixes.push('If-else chains');
    }

    // Fix stray semicolons in various contexts
    const straySemiPattern = /([^;,}])\s*;\s*\n\s*}/g;
    const strayBefore = content;
    content = content.replace(straySemiPattern, '$1\n  }');
    if (content !== strayBefore) {
      changeCount++;
      appliedFixes.push('Stray semicolon cleanup');
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

function processDirectory(dir) {
  let totalFiles = 0;
  let fixedFiles = 0;
  let totalFixes = 0;
  let allAppliedFixes = new Set();

  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(file.name)) {
        const subResult = processDirectory(fullPath);
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
      const result = fixFile(fullPath);
      if (result.changeCount > 0) {
        fixedFiles++;
        totalFixes += result.changeCount;
        result.appliedFixes.forEach(fix => allAppliedFixes.add(fix));
        console.log(`Fixed ${result.changeCount} issues in ${fullPath}:`);
        console.log(`  - ${result.appliedFixes.join(', ')}`);
      }
    }
  }
  
  return { totalFiles, fixedFiles, totalFixes, allAppliedFixes };
}

// Run the deep scanner
console.log('Starting comprehensive deep syntax scan...\n');
const srcPath = path.join(process.cwd(), 'src');
const result = processDirectory(srcPath);

console.log('\n========================================');
console.log('Deep Syntax Scan Complete!');
console.log('========================================');
console.log(`Total files scanned: ${result.totalFiles}`);
console.log(`Files fixed: ${result.fixedFiles}`);
console.log(`Total fixes applied: ${result.totalFixes}`);
console.log('\nTypes of fixes applied:');
result.allAppliedFixes.forEach(fix => {
  console.log(`  - ${fix}`);
});
