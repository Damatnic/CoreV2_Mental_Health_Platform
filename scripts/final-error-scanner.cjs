const fs = require('fs');
const path = require('path');

// Focused, working error patterns
const errorFixes = [
  // Fix $2 and similar patterns
  {
    name: 'Fix $2 interface patterns',
    pattern: /\$2 (\w+) \{/g,
    replacement: 'interface $1 {'
  },
  {
    name: 'Fix $2 type patterns', 
    pattern: /\$2 (\w+) =/g,
    replacement: 'type $1 ='
  },
  {
    name: 'Fix $2 class patterns',
    pattern: /\$2 (\w+) \{ private/g,
    replacement: 'class $1 {\n  private'
  },
  {
    name: 'Fix $2 variable patterns',
    pattern: /\$2 (\w+) = /g,
    replacement: 'const $1 = '
  },
  {
    name: 'Fix $2 export patterns',
    pattern: /\$2 default (\w+)/g,
    replacement: 'export default $1'
  },
  {
    name: 'Fix any remaining $2 patterns',
    pattern: /\$2 /g,
    replacement: ''
  },
  
  // Fix type declaration issues
  {
    name: 'Fix malformed type declarations',
    pattern: /const (\w+) = "([^"]+)" \| "([^"]+)"/g,
    replacement: 'type $1 = "$2" | "$3"'
  },
  
  // Fix semicolon issues
  {
    name: 'Remove double semicolons',
    pattern: /;;+/g,
    replacement: ';'
  },
  {
    name: 'Fix semicolons in object properties',
    pattern: /(\w+:\s*[^,;{}]+);\s*$/gm,
    replacement: '$1'
  },
  {
    name: 'Fix comment ending semicolons',
    pattern: /\/\/.*?;\s*$/gm,
    replacement: (match) => match.replace(/;\s*$/, '')
  },
  
  // Fix JSX issues
  {
    name: 'Fix JSX stray semicolons',
    pattern: /<(\w+);(\s+)/g,
    replacement: '<$1$2'
  },
  {
    name: 'Fix JSX attribute syntax',
    pattern: /(\w+)=;/g,
    replacement: '$1='
  },
  
  // Fix missing closing braces
  {
    name: 'Fix missing closing brace after object property',
    pattern: /(\w+:\s*[^,;{}]+)\s*\n\s*(?:export|import|const|let|var|function|class)/g,
    replacement: '$1;\n}\n\n'
  },
  
  // Fix function syntax
  {
    name: 'Fix function parameter semicolons',
    pattern: /\(([^)]+);\)/g,
    replacement: '($1)'
  },
  {
    name: 'Fix if statement conditions',
    pattern: /if\(\s*;\s*/g,
    replacement: 'if('
  },
  
  // Fix array/object destructuring
  {
    name: 'Fix object destructuring semicolons',
    pattern: /{\s*([^}]+);\s*}/g,
    replacement: '{ $1 }'
  },
  {
    name: 'Fix array destructuring semicolons', 
    pattern: /\[\s*([^\]]+);\s*\]/g,
    replacement: '[ $1 ]'
  },
  
  // Fix return statements
  {
    name: 'Fix return statement formatting',
    pattern: /return\s+{\s*([^}]+);\s*}/g,
    replacement: 'return { $1 }'
  },
  
  // Fix stray closing braces
  {
    name: 'Fix stray closing braces after imports',
    pattern: /import\s+[^;]+;\s*\n\s*}/g,
    replacement: (match) => match.replace(/\s*}/, '')
  },
  {
    name: 'Fix stray closing braces between imports',
    pattern: /(import\s+[^;]+;\s*)\n\s*}\s*\n\s*(import|\/\/)/g,
    replacement: '$1\n$2'
  },
  {
    name: 'Fix stray closing braces in comment blocks',
    pattern: /\/\/[^}\n]*\n\s*}/g,
    replacement: (match) => match.replace(/\s*}/, '')
  },
  {
    name: 'Fix stray closing braces after statements',
    pattern: /([^{};])\s*;\s*\n\s*}\s*\n\s*([a-zA-Z_$])/g,
    replacement: '$1;\n$2'
  },
  {
    name: 'Fix standalone closing braces',
    pattern: /^\s*}\s*$/gm,
    replacement: ''
  },
  {
    name: 'Fix multiple consecutive closing braces',
    pattern: /}\s*}\s*}/g,
    replacement: '}'
  },
  {
    name: 'Fix closing brace before import/export',
    pattern: /}\s*\n\s*(import|export)/g,
    replacement: '\n$1'
  },
  
  // Fix malformed import statements
  {
    name: 'Fix malformed import statements with quotes',
    pattern: /^\s*'[^']+'\s*;?\s*$/gm,
    replacement: (match) => {
      const cleaned = match.trim().replace(/^'/, "import '").replace(/';?$/, "';");
      return cleaned;
    }
  },
  {
    name: 'Fix import statements missing import keyword',
    pattern: /^\s*'\.\/[^']+'\s*;?\s*$/gm,
    replacement: (match) => {
      const path = match.trim().replace(/^'/, '').replace(/';?$/, '');
      return `import '${path}';`;
    }
  },
  
  // Fix mismatched braces and parentheses
  {
    name: 'Fix mismatched brace instead of parenthesis',
    pattern: /(\w+\([^)]*)\s*}\s*;/g,
    replacement: '$1);'
  },
  {
    name: 'Fix mismatched parenthesis instead of brace',
    pattern: /{\s*([^}]*)\s*\)\s*;/g,
    replacement: '{ $1 };'
  },
  {
    name: 'Fix function call with brace instead of parenthesis',
    pattern: /(\w+)\s*{\s*([^}]*)\s*}\s*([;}])/g,
    replacement: (match, func, args, ending) => {
      // Only fix if it looks like a function call, not an object
      if (args.includes(':') || args.includes('{')) {
        return match; // Keep as object
      }
      return `${func}(${args})${ending}`;
    }
  },
  {
    name: 'Fix if statement with mismatched braces',
    pattern: /if\s*{\s*([^}]*)\s*}\s*{/g,
    replacement: 'if ($1) {'
  },
  {
    name: 'Fix while/for loops with mismatched braces',
    pattern: /(while|for)\s*{\s*([^}]*)\s*}\s*{/g,
    replacement: '$1 ($2) {'
  },
  {
    name: 'Fix event listener with mismatched structure',
    pattern: /addEventListener\s*\(\s*'([^']+)',\s*([^=]+)\s*=>\s*{\s*([^}]+)\s*}\s*;/g,
    replacement: "addEventListener('$1', $2 => {\n  $3\n});"
  },
  {
    name: 'Fix method call ending with brace semicolon',
    pattern: /(\w+\.[a-zA-Z_$]\w*\([^)]*\))\s*}\s*;/g,
    replacement: '$1;'
  },
  {
    name: 'Fix nested function calls with mismatched brackets',
    pattern: /(\w+)\s*\(\s*([^)]*)\s*}\s*([;}])/g,
    replacement: '$1($2)$3'
  },
  {
    name: 'Fix conditional statements with brace instead of parenthesis',
    pattern: /(if|while|for)\s*{\s*([^{}]*)\s*}\s*([;}])/g,
    replacement: (match, keyword, condition, ending) => {
      // Only fix if it doesn't contain object-like syntax
      if (condition.includes(':') && !condition.includes('==') && !condition.includes('!=')) {
        return match; // Keep as is if it looks like an object
      }
      return `${keyword} (${condition})${ending}`;
    }
  },
  {
    name: 'Fix object property access with mismatched brackets',
    pattern: /(\w+)\s*{\s*([a-zA-Z_$]\w*)\s*}/g,
    replacement: '$1.$2'
  },
  {
    name: 'Fix array access with braces instead of brackets',
    pattern: /(\w+)\s*{\s*(\d+|'[^']*'|"[^"]*")\s*}/g,
    replacement: '$1[$2]'
  },
  
  // Fix extra spaces
  {
    name: 'Fix extra spaces before semicolons',
    pattern: /\s+;\s*$/gm,
    replacement: ';'
  }
];

function scanAndFixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixCount = 0;
    
    errorFixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
        const matches = originalContent.match(fix.pattern);
        if (matches) {
          fixCount += matches.length;
          console.log(`  ✓ ${fix.name}: ${matches.length} fixes`);
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return fixCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function scanDirectory(dirPath) {
  let totalFixes = 0;
  let filesProcessed = 0;
  
  function processDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(item)) {
        processDirectory(fullPath);
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
        console.log(`\nProcessing: ${fullPath}`);
        const fixes = scanAndFixFile(fullPath);
        if (fixes > 0) {
          totalFixes += fixes;
          filesProcessed++;
          console.log(`  → ${fixes} total fixes applied`);
        }
      }
    });
  }
  
  processDirectory(dirPath);
  return { totalFixes, filesProcessed };
}

console.log('🔍 Starting Final Error Scanner...');
console.log(`📋 Scanning ${errorFixes.length} critical error patterns\n`);

const srcPath = path.join(process.cwd(), 'src');
const { totalFixes, filesProcessed } = scanDirectory(srcPath);

console.log('\n' + '='.repeat(60));
console.log(`🎉 Final Error Scanner Complete!`);
console.log(`📊 Total fixes applied: ${totalFixes}`);
console.log(`📁 Files modified: ${filesProcessed}`);
console.log('='.repeat(60));
