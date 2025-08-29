const fs = require('fs');
const path = require('path');

// The most comprehensive error patterns possible
const comprehensiveFixes = [
  // === $2 and replacement artifact patterns ===
  {
    name: 'Fix $2 export patterns',
    pattern: /\$2 default (\w+)/g,
    replacement: 'export default $1'
  },
  {
    name: 'Fix $2 const patterns',
    pattern: /\$2 const (\w+)/g,
    replacement: 'export const $1'
  },
  {
    name: 'Fix $2 class patterns',
    pattern: /\$2 (\w+): React\.FC/g,
    replacement: 'const $1: React.FC'
  },
  {
    name: 'Fix $2 variable patterns',
    pattern: /\$2 (\w+) = /g,
    replacement: 'const $1 = '
  },
  {
    name: 'Fix $2 function patterns',
    pattern: /\$2 (\w+)\(/g,
    replacement: 'const $1 = ('
  },
  {
    name: 'Fix $2Name patterns in JSX',
    pattern: /\$2Name=/g,
    replacement: 'className='
  },
  {
    name: 'Fix useState destructuring',
    pattern: /\$2 \[(\w+), (\w+)\] = useState/g,
    replacement: 'const [$1, $2] = useState'
  },
  {
    name: 'Fix useRef patterns',
    pattern: /\$2 (\w+) = useRef/g,
    replacement: 'const $1 = useRef'
  },
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
    name: 'Fix $2 class declaration patterns',
    pattern: /\$2 (\w+) \{ private/g,
    replacement: 'class $1 {\\n  private'
  },
  {
    name: 'Fix any remaining $2 patterns',
    pattern: /\$2 /g,
    replacement: ''
  },
  {
    name: 'Fix $1 patterns in replacement artifacts',
    pattern: /\$1/g,
    replacement: ''
  },
  {
    name: 'Fix $3 and higher patterns',
    pattern: /\$[3-9]/g,
    replacement: ''
  },

  // === Type declaration fixes ===
  {
    name: 'Fix malformed type declarations',
    pattern: /const (\w+) = "([^"]+)" \| "([^"]+)"/g,
    replacement: 'type $1 = "$2" | "$3"'
  },
  {
    name: 'Fix union type syntax',
    pattern: /const (\w+) = (\w+) \| (\w+)/g,
    replacement: 'type $1 = $2 | $3'
  },
  {
    name: 'Fix interface property syntax',
    pattern: /(\w+): (\w+)\\n/g,
    replacement: '$1: $2;\\n'
  },

  // === Missing semicolons and braces ===
  {
    name: 'Remove double semicolons',
    pattern: /;;+/g,
    replacement: ';'
  },
  {
    name: 'Fix missing semicolons after statements',
    pattern: /([^;{},\s])\s*\n\s*(?:export|import|const|let|var|function|class|interface|type|enum)/g,
    replacement: '$1;\n'
  },
  {
    name: 'Fix semicolons in object properties',
    pattern: /(\w+:\s*[^,;{}]+);\s*$/gm,
    replacement: '$1'
  },
  {
    name: 'Fix object literal ending semicolons',
    pattern: /(\w+:\s*[^,;{}]+);\s*\n\s*}/g,
    replacement: '$1\n  }'
  },
  {
    name: 'Fix missing closing braces in objects',
    pattern: /{\s*([^}]+)\s*$/gm,
    replacement: '{\n  $1\n}'
  },
  {
    name: 'Fix missing closing braces in functions',
    pattern: /function\s+\w+\([^)]*\)\s*{[^}]*$/gm,
    replacement: (match) => match + '\n}'
  },

  // === JSX syntax fixes ===
  {
    name: 'Fix JSX stray semicolons',
    pattern: /<(\w+);(\s+)/g,
    replacement: '<$1$2'
  },
  {
    name: 'Fix JSX malformed closing tags',
    pattern: /}><\/\$1>/g,
    replacement: '}>'
  },
  {
    name: 'Fix JSX attribute syntax',
    pattern: /(\w+)=;/g,
    replacement: '$1='
  },
  {
    name: 'Fix JSX className typos',
    pattern: /classname=/gi,
    replacement: 'className='
  },

  // === React Hook fixes ===
  {
    name: 'Fix useEffect cleanup function syntax',
    pattern: /return\\s*\\(\\)\\s*=>\\s*{([^}]+)}\\s*,\\s*\\[/g,
    replacement: 'return () => {\\n      $1\\n    };\\n  }, ['
  },
  {
    name: 'Fix useCallback syntax',
    pattern: /useCallback\\(([^,]+),\\s*;/g,
    replacement: 'useCallback($1,'
  },
  {
    name: 'Fix useMemo syntax',
    pattern: /useMemo\\(([^,]+),\\s*;/g,
    replacement: 'useMemo($1,'
  },

  // === Import/Export fixes ===
  {
    name: 'Fix export statement semicolons',
    pattern: /export\\s+{\\s*([^}]+);\\s*}/g,
    replacement: 'export { $1 }'
  },
  {
    name: 'Fix import statement semicolons',
    pattern: /import\\s+{\\s*([^}]+);\\s*}\\s+from/g,
    replacement: 'import { $1 } from'
  },
  {
    name: 'Fix default export syntax',
    pattern: /export\\s+default\\s*;/g,
    replacement: 'export default'
  },

  // === Comment and documentation fixes ===
  {
    name: 'Fix comment ending semicolons',
    pattern: /\\/\\/.*?;\\s*$/gm,
    replacement: (match) => match.replace(/;\\s*$/, '')
  },
  {
    name: 'Fix block comment syntax',
    pattern: /\\/\\*([^*]*)\\*;/g,
    replacement: '/*$1*/'
  },

  // === Function and method fixes ===
  {
    name: 'Fix function parameter semicolons',
    pattern: /\\(([^)]+);\\)/g,
    replacement: '($1)'
  },
  {
    name: 'Fix arrow function syntax',
    pattern: /=>\\s*;\\s*{/g,
    replacement: '=> {'
  },
  {
    name: 'Fix method declaration syntax',
    pattern: /(\\w+)\\s*\\([^)]*\\)\\s*;\\s*{/g,
    replacement: '$1() {'
  },

  // === Control flow fixes ===
  {
    name: 'Fix if statement conditions',
    pattern: /if\\(\\s*;\\s*/g,
    replacement: 'if('
  },
  {
    name: 'Fix for loop syntax',
    pattern: /for\\s*\\(([^)]*);([^)]*);([^)]*)\\s*;\\s*\\)/g,
    replacement: 'for($1; $2; $3)'
  },
  {
    name: 'Fix while loop syntax',
    pattern: /while\\s*\\(([^)]*);\\)/g,
    replacement: 'while($1)'
  },

  // === Array and object destructuring fixes ===
  {
    name: 'Fix array destructuring semicolons',
    pattern: /\\[\\s*([^\\]]+);\\s*\\]/g,
    replacement: '[ $1 ]'
  },
  {
    name: 'Fix object destructuring semicolons',
    pattern: /{\\s*([^}]+);\\s*}/g,
    replacement: '{ $1 }'
  },

  // === String and template literal fixes ===
  {
    name: 'Fix template literal syntax',
    pattern: /`([^`]*);`/g,
    replacement: '`$1`'
  },
  {
    name: 'Fix string concatenation',
    pattern: /"([^"]*)"\\s*;\\s*\\+/g,
    replacement: '"$1" +'
  },

  // === CSS and style fixes ===
  {
    name: 'Fix style object syntax',
    pattern: /style=\\{\\{([^}]+);\\}\\}/g,
    replacement: 'style={{$1}}'
  },

  // === Async/await fixes ===
  {
    name: 'Fix async function syntax',
    pattern: /async\\s*;\\s*\\(/g,
    replacement: 'async ('
  },
  {
    name: 'Fix await expression syntax',
    pattern: /await\\s*;/g,
    replacement: 'await'
  },

  // === Try/catch fixes ===
  {
    name: 'Fix try block syntax',
    pattern: /try\\s*;\\s*{/g,
    replacement: 'try {'
  },
  {
    name: 'Fix catch block syntax',
    pattern: /catch\\s*;\\s*\\(/g,
    replacement: 'catch ('
  },

  // === Generic cleanup patterns ===
  {
    name: 'Fix extra spaces before semicolons',
    pattern: /\\s+;\\s*$/gm,
    replacement: ';'
  },
  {
    name: 'Fix malformed return statements',
    pattern: /return\\s+{\\s*([^}]+);\\s*}/g,
    replacement: 'return { $1 }'
  },
  {
    name: 'Fix ternary operator syntax',
    pattern: /\\?\\s*;\\s*:/g,
    replacement: '? :'
  },
  {
    name: 'Fix logical operator syntax',
    pattern: /&&\\s*;/g,
    replacement: '&&'
  },
  {
    name: 'Fix pipe operator syntax',
    pattern: /\\|\\|\\s*;/g,
    replacement: '||'
  },

  // === TypeScript specific fixes ===
  {
    name: 'Fix generic type syntax',
    pattern: /<([^>]+);>/g,
    replacement: '<$1>'
  },
  {
    name: 'Fix type assertion syntax',
    pattern: /as\\s*;\\s*(\\w+)/g,
    replacement: 'as $1'
  },
  {
    name: 'Fix optional property syntax',
    pattern: /(\\w+)\\?\\s*;\\s*:/g,
    replacement: '$1?:'
  },

  // === Module system fixes ===
  {
    name: 'Fix require syntax',
    pattern: /require\\s*;\\s*\\(/g,
    replacement: 'require('
  },
  {
    name: 'Fix module.exports syntax',
    pattern: /module\\.exports\\s*;\\s*=/g,
    replacement: 'module.exports ='
  },

  // === Final cleanup patterns ===
  {
    name: 'Fix trailing semicolons in comments',
    pattern: /\\/\\*[^*]*\\*\\/;/g,
    replacement: (match) => match.replace(/;$/, '')
  },
  {
    name: 'Fix empty statement semicolons',
    pattern: /;\\s*;\\s*$/gm,
    replacement: ';'
  }
];

function scanAndFixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixCount = 0;
    
    comprehensiveFixes.forEach(fix => {
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
      
      if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(item)) {
        processDirectory(fullPath);
      } else if (stat.isFile() && /\\.(ts|tsx|js|jsx|mjs|cjs)$/.test(item)) {
        console.log(`\\nProcessing: ${fullPath}`);
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

console.log('🔍 Starting Comprehensive Error Scanner...');
console.log(`📋 Scanning ${comprehensiveFixes.length} error patterns:`);
comprehensiveFixes.forEach((fix, index) => {
  console.log(`${index + 1}. ${fix.name}`);
});
console.log('\\n' + '='.repeat(80) + '\\n');

const srcPath = path.join(process.cwd(), 'src');
const scriptsPath = path.join(process.cwd(), 'scripts');

console.log('🔍 Scanning src directory...');
const srcResults = scanDirectory(srcPath);

console.log('\\n🔍 Scanning scripts directory...');
const scriptsResults = scanDirectory(scriptsPath);

const totalFixes = srcResults.totalFixes + scriptsResults.totalFixes;
const filesProcessed = srcResults.filesProcessed + scriptsResults.filesProcessed;

console.log('\\n' + '='.repeat(80));
console.log(`🎉 Comprehensive Error Scanner Complete!`);
console.log(`📊 Total fixes applied: ${totalFixes}`);
console.log(`📁 Files modified: ${filesProcessed}`);
console.log(`🔧 Error patterns scanned: ${comprehensiveFixes.length}`);
console.log('='.repeat(80));
