const fs = require('fs');
const path = require('path');

// Comprehensive syntax error patterns to fix
const fixes = [
  // Fix missing semicolons after object/array returns
  {
    pattern: /return\s*({[\s\S]*?})\s*([,\)])\s*([;\)])/g,
    replacement: (match, obj, sep1, sep2) => {
      if (sep1 === ',' || sep1 === ')') {
        return `return ${obj};${sep1 === ')' ? '\n  }' : ''}${sep2}`;
      }
      return match;
    }
  },
  // Fix missing closing braces for interfaces
  {
    pattern: /(\s+)(\w+):\s*{([^}]+)}\s*\n(\s*)export/g,
    replacement: '$1$2: {$3};\n}\n$4export'
  },
  // Fix missing semicolons after property definitions
  {
    pattern: /(\s+\w+:\s*[^,;{}\n]+)(\n\s*})/g,
    replacement: '$1;$2'
  },
  // Fix missing closing braces for functions
  {
    pattern: /}\s*,\s*\[([^\]]+)\]\);(\s*\n\s*return\s+{)/g,
    replacement: '};\n  }, [$1]);$2'
  },
  // Fix if-else structure issues
  {
    pattern: /}\s+else\s+if/g,
    replacement: '} else if'
  },
  // Fix missing semicolons in object literals
  {
    pattern: /([^;,}])\s*\n\s*}\s*else/g,
    replacement: '$1;\n  } else'
  },
  // Fix useEffect/useMemo/useCallback closing
  {
    pattern: /return\s*\(\)\s*=>\s*{([^}]+)}\s*,\s*\[/g,
    replacement: 'return () => {$1};\n  }, ['
  },
  // Fix missing semicolons after statements
  {
    pattern: /([^{};,\s])(\s*\n\s*(?:export|import|const|let|var|function|class|interface|type|enum))/g,
    replacement: '$1;$2'
  },
  // Fix missing closing braces for arrow functions
  {
    pattern: /=>\s*{([^}]+)}\s*\n\s*export/g,
    replacement: '=> {$1};\n}\n\nexport'
  },
  // Fix broken JSX
  {
    pattern: /<([^>]+)>\s*,\s*</g,
    replacement: '<$1><'
  },
  // Fix missing semicolons after JSX
  {
    pattern: /(<\/\w+>)(\s*\n\s*(?:export|const|let|var|function|class))/g,
    replacement: '$1;$2'
  },
  // Fix missing closing braces for try-catch
  {
    pattern: /catch\s*\([^)]*\)\s*{([^}]+)}\s*\n\s*(\w)/g,
    replacement: 'catch (error) {$1}\n  }\n\n  $2'
  },
  // Fix missing semicolons in type definitions
  {
    pattern: /(\w+):\s*(\w+(?:<[^>]+>)?)\s*\n\s*}/g,
    replacement: '$1: $2;\n}'
  },
  // Fix broken import statements
  {
    pattern: /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]\s*(?!;)/g,
    replacement: "import {$1} from '$2';"
  },
  // Fix missing closing parentheses
  {
    pattern: /\)\s*,\s*\[([^\]]+)\]\)(\s*\n\s*(?:export|const|let|var|function))/g,
    replacement: ');\n  }, [$1]);$2'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changeCount = 0;

    // Apply each fix pattern
    fixes.forEach(fix => {
      if (typeof fix.replacement === 'string') {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          changeCount++;
          content = newContent;
        }
      } else if (typeof fix.replacement === 'function') {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          changeCount++;
          content = newContent;
        }
      }
    });

    // Additional specific fixes for common patterns
    
    // Fix useEffect/useMemo/useCallback structures
    content = content.replace(/}\s*,\s*\[([^\]]*)\]\);/g, (match, deps) => {
      // Check if this is inside a useEffect, useMemo, or useCallback
      const lines = match.split('\n');
      if (lines.length > 0) {
        return `};\n  }, [${deps}]);`;
      }
      return match;
    });

    // Fix interface/type definitions
    content = content.replace(/interface\s+(\w+)\s*{([^}]+)}\s*\n\s*export/g, 
      'interface $1 {$2}\n\nexport');

    // Fix missing semicolons after variable declarations
    content = content.replace(/^(\s*(?:const|let|var)\s+\w+\s*=\s*[^;{}\n]+)$/gm, '$1;');

    // Fix missing closing braces in object returns
    content = content.replace(/return\s*{([^}]+)}\s*\n\s*}\s*,/g, 'return {$1};\n  },');

    // Fix if-else-if chains
    content = content.replace(/}\s*else\s+if\s*\(/g, '} else if (');

    // Fix missing semicolons in JSX props
    content = content.replace(/(\w+)={([^}]+)}(\s*\n\s*\/?>)/g, '$1={$2}$3');

    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return changeCount;
    }
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let totalFiles = 0;
  let fixedFiles = 0;
  let totalFixes = 0;

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
      }
    } else if (file.isFile() && 
               (file.name.endsWith('.ts') || 
                file.name.endsWith('.tsx') || 
                file.name.endsWith('.js') || 
                file.name.endsWith('.jsx'))) {
      totalFiles++;
      const fixes = fixFile(fullPath);
      if (fixes > 0) {
        fixedFiles++;
        totalFixes += fixes;
        console.log(`Fixed ${fixes} issues in ${fullPath}`);
      }
    }
  }
  
  return { totalFiles, fixedFiles, totalFixes };
}

// Run the fixer
console.log('Starting comprehensive syntax fix...\n');
const srcPath = path.join(process.cwd(), 'src');
const result = processDirectory(srcPath);

console.log('\n========================================');
console.log('Comprehensive Syntax Fix Complete!');
console.log('========================================');
console.log(`Total files scanned: ${result.totalFiles}`);
console.log(`Files fixed: ${result.fixedFiles}`);
console.log(`Total fixes applied: ${result.totalFixes}`);
